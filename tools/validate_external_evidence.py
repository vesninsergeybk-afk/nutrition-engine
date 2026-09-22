#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VERSION = 'v5.3.210-pc2'
ACCEPTED_DECISIONS = {'ACCEPTED', 'ACCEPTED_WITH_NONBLOCKING_LIMITATIONS'}
ACCEPTED_REVIEW_DECISIONS = {'ACCEPTED', 'ACCEPTED_WITH_LIMITATIONS'}
PASS_RESPONSES = {'PASS', 'ACCEPT', 'ACCEPT_WITH_COMMENT'}
EXPECTED_PILOT_TASKS = {'calculate_needs', 'add_first_product', 'interpret_summary', 'find_limitations'}


def canonical_content_hash(document: dict[str, Any]) -> str:
    body = {k: v for k, v in document.items() if k != 'integrity'}
    payload = json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n'
    return hashlib.sha256(payload.encode()).hexdigest()


def load_reference(root: Path = ROOT):
    blind = json.loads((root / 'validation/P2_0_BLIND_DOMAIN_REVIEW_CASES_RU.json').read_text(encoding='utf-8'))
    key = json.loads((root / 'validation/P2_0_REFERENCE_ANSWER_KEY_PRIVATE.json').read_text(encoding='utf-8'))
    return blind, key


def validate_data(data: dict[str, Any], root: Path = ROOT) -> tuple[bool, dict[str, Any]]:
    blind, key = load_reference(root)
    failures: list[str] = []
    blind_hash = blind.get('integrity', {}).get('content_sha256')
    key_hash = key.get('integrity', {}).get('content_sha256')
    case_ids = [row['case_id'] for row in blind.get('cases', [])]
    case_types = {row['case_id']: row['case_type'] for row in blind.get('cases', [])}
    key_by_id = {row['case_id']: row['reference'] for row in key.get('cases', [])}
    critical_ids = {cid for cid, ref in key_by_id.items() if ref.get('severity') == 'CRITICAL'}
    quantitative_ids = {cid for cid, typ in case_types.items() if typ == 'QUANTITATIVE_OR_RULE'}

    if data.get('release_version') != VERSION: failures.append('release_version')
    if data.get('blind_pack_sha256') != blind_hash: failures.append('blind_pack_sha256')
    if data.get('reference_key_sha256') != key_hash: failures.append('reference_key_sha256')
    if data.get('decision') not in ACCEPTED_DECISIONS: failures.append('decision')
    if data.get('evidence_status') not in {'ACCEPTED', 'ACCEPTED_WITH_LIMITATIONS'}: failures.append('evidence_status')

    reviewers = data.get('reviewers') or []
    reviewer_ids: set[str] = set()
    nutrition_reviewers = 0
    medical_reviewers = 0
    quantitative_total = 0
    quantitative_pass = 0
    critical_votes = {cid: [] for cid in critical_ids}
    for idx, reviewer in enumerate(reviewers):
        prefix = f'reviewer[{idx}]'
        rid = str(reviewer.get('review_id') or '').strip()
        if not rid or rid in reviewer_ids: failures.append(prefix + '.review_id')
        reviewer_ids.add(rid)
        if reviewer.get('release_version') != VERSION: failures.append(prefix + '.release_version')
        if reviewer.get('blind_pack_sha256') != blind_hash: failures.append(prefix + '.blind_pack_sha256')
        if not reviewer.get('reviewer_independence_attestation'): failures.append(prefix + '.independence_attestation')
        if not str(reviewer.get('reviewer_pseudonym') or '').strip(): failures.append(prefix + '.reviewer_pseudonym')
        scope = reviewer.get('professional_scope') or {}
        nutrition_reviewers += int(bool(scope.get('nutrition_domain')))
        medical_reviewers += int(bool(scope.get('medical_protected_modes')))
        signature = reviewer.get('signature') or {}
        if signature.get('method') not in {'typed_attestation_or_external_signature', 'external_signature'}:
            failures.append(prefix + '.signature.method')
        if not str(signature.get('signed_at') or '').strip() or not str(signature.get('signed_by') or '').strip():
            failures.append(prefix + '.signature')
        if (reviewer.get('overall_assessment') or {}).get('decision') not in ACCEPTED_REVIEW_DECISIONS:
            failures.append(prefix + '.overall_assessment.decision')
        responses = reviewer.get('case_responses') or []
        response_ids = [str(r.get('case_id') or '') for r in responses]
        if len(response_ids) != len(case_ids) or set(response_ids) != set(case_ids) or len(response_ids) != len(set(response_ids)):
            failures.append(prefix + '.case_responses_complete')
        response_by_id = {str(r.get('case_id') or ''): r for r in responses}
        for cid in case_ids:
            response = response_by_id.get(cid) or {}
            result = str(response.get('result') or response.get('decision') or '').upper()
            if cid in quantitative_ids:
                quantitative_total += 1
                quantitative_pass += int(result in PASS_RESPONSES)
            if cid in critical_ids:
                critical_votes[cid].append(result in PASS_RESPONSES)

    if len(reviewers) < 3: failures.append('reviewers<3')
    if nutrition_reviewers < 2: failures.append('nutrition_reviewers<2')
    if medical_reviewers < 1: failures.append('medical_reviewers<1')
    quantitative_rate = quantitative_pass / quantitative_total if quantitative_total else 0.0
    if quantitative_rate < 0.95: failures.append('quantitative_case_acceptance_rate')
    if any(len(votes) != len(reviewers) or not all(votes) for votes in critical_votes.values()):
        failures.append('critical_safety_unanimity')

    findings = data.get('findings') or []
    unresolved = []
    for item in findings:
        severity = str(item.get('severity') or '').upper()
        status = str(item.get('status') or '').upper()
        if severity in {'CRITICAL', 'MAJOR'} and status not in {'RESOLVED', 'ACCEPTED_LIMITATION'}:
            unresolved.append(str(item.get('finding_id') or severity))
    if unresolved: failures.append('unresolved_critical_or_major_findings')

    pilots = data.get('pilot_observations') or []
    observation_ids: set[str] = set()
    completed_tasks = 0
    total_tasks = 0
    critical_use_errors = 0
    for idx, observation in enumerate(pilots):
        prefix = f'pilot[{idx}]'
        oid = str(observation.get('observation_id') or '').strip()
        if not oid or oid in observation_ids: failures.append(prefix + '.observation_id')
        observation_ids.add(oid)
        if observation.get('release_version') != VERSION: failures.append(prefix + '.release_version')
        if not observation.get('consent_recorded_externally'): failures.append(prefix + '.consent')
        if observation.get('contains_direct_identifiers') is not False: failures.append(prefix + '.direct_identifiers')
        if not str(observation.get('participant_pseudonym') or '').strip(): failures.append(prefix + '.participant_pseudonym')
        if observation.get('session_decision') != 'COMPLETE': failures.append(prefix + '.session_decision')
        tasks = observation.get('tasks') or []
        task_ids = {str(task.get('task_id') or '') for task in tasks}
        if task_ids != EXPECTED_PILOT_TASKS or len(tasks) != len(EXPECTED_PILOT_TASKS): failures.append(prefix + '.tasks')
        for task in tasks:
            total_tasks += 1
            completed_tasks += int(task.get('completed') is True)
            critical_use_errors += int(task.get('critical_use_error') is True)
        critical_use_errors += sum(1 for x in (observation.get('safety_observations') or []) if str(x.get('severity') or '').upper() == 'CRITICAL')
    if len(pilots) < 8: failures.append('pilot_observations<8')
    completion_rate = completed_tasks / total_tasks if total_tasks else 0.0
    if completion_rate < 0.85: failures.append('pilot_completion_rate')
    if critical_use_errors != 0: failures.append('critical_use_errors')

    metrics = data.get('metrics') or {}
    def numeric(value, default=-1.0):
        try: return float(value)
        except (TypeError, ValueError): return default
    if abs(numeric(metrics.get('completion_rate')) - completion_rate) > 1e-9: failures.append('metrics.completion_rate_mismatch')
    if int(numeric(metrics.get('critical_use_errors'))) != critical_use_errors: failures.append('metrics.critical_use_errors_mismatch')
    if abs(numeric(metrics.get('quantitative_case_acceptance_rate')) - quantitative_rate) > 1e-9:
        failures.append('metrics.quantitative_case_acceptance_rate_mismatch')

    authorization = data.get('claim_authorization') or {}
    if authorization.get('external_validation_claim_allowed') is not True: failures.append('claim_authorization')
    if not str(authorization.get('authorized_at') or '').strip(): failures.append('claim_authorization.authorized_at')

    detail = {
        'release_version': data.get('release_version'),
        'decision': data.get('decision'),
        'reviewers': len(reviewers),
        'nutrition_reviewers': nutrition_reviewers,
        'medical_reviewers': medical_reviewers,
        'pilot_observations': len(pilots),
        'quantitative_case_acceptance_rate': round(quantitative_rate, 6),
        'pilot_completion_rate': round(completion_rate, 6),
        'critical_use_errors': critical_use_errors,
        'critical_safety_cases': len(critical_ids),
        'missing_or_failed': sorted(set(failures)),
    }
    return not failures, detail


def validate_file(path: str | Path, root: Path = ROOT) -> tuple[bool, dict[str, Any]]:
    p = Path(path)
    data = json.loads(p.read_text(encoding='utf-8'))
    ok, detail = validate_data(data, root)
    return ok, {'file': str(p), **detail}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('evidence')
    parser.add_argument('--json-out')
    args = parser.parse_args()
    ok, result = validate_file(args.evidence)
    result['ok'] = ok
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.json_out:
        out = Path(args.json_out); out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
