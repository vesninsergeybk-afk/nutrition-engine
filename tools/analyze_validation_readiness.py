#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path
from validate_external_evidence import canonical_content_hash, validate_data

ROOT = Path(__file__).resolve().parents[1]
VERSION = 'v5.3.210-pc2'

def load(rel):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--json-out'); args = parser.parse_args()
    failures = []
    policy = load('config/validation-evidence-policy.v5.3.210-pc2.json')
    blind = load('validation/P2_0_BLIND_DOMAIN_REVIEW_CASES_RU.json')
    key = load('validation/P2_0_REFERENCE_ANSWER_KEY_PRIVATE.json')
    evidence = load('quality/p2-external-evidence.pending.json')
    reviewer_template = load('validation/P2_0_REVIEWER_RESPONSE_TEMPLATE.json')
    pilot_template = load('validation/P2_0_PILOT_OBSERVATION_TEMPLATE.json')

    if policy.get('release_version') != VERSION or policy.get('stage_status') != 'EXTERNAL_VALIDATION_PENDING':
        failures.append('policy version/status must remain P2.0 pending without real evidence')
    versions = [blind.get('release_version'), key.get('release_version'), evidence.get('release_version'), reviewer_template.get('release_version'), pilot_template.get('release_version')]
    if any(value != VERSION for value in versions): failures.append('validation package version mismatch')

    blind_hash = canonical_content_hash(blind)
    key_hash = canonical_content_hash(key)
    if blind_hash != blind.get('integrity', {}).get('content_sha256'): failures.append('blind pack integrity hash mismatch')
    if key_hash != key.get('integrity', {}).get('content_sha256'): failures.append('reference key integrity hash mismatch')
    if blind.get('integrity', {}).get('paired_key_sha256') != key_hash: failures.append('blind pack paired key hash mismatch')
    if key.get('integrity', {}).get('paired_blind_sha256') != blind_hash: failures.append('reference key paired blind hash mismatch')
    if evidence.get('blind_pack_sha256') != blind_hash or evidence.get('reference_key_sha256') != key_hash:
        failures.append('pending evidence is not bound to validation packs')
    if reviewer_template.get('blind_pack_sha256') != blind_hash: failures.append('reviewer template blind hash mismatch')

    blind_ids = [row['case_id'] for row in blind.get('cases', [])]
    key_ids = [row['case_id'] for row in key.get('cases', [])]
    if len(blind_ids) != len(set(blind_ids)) or blind_ids != key_ids: failures.append('blind/key case IDs differ or duplicate')
    if blind.get('case_count') != len(blind_ids) or key.get('case_count') != len(key_ids): failures.append('case count metadata mismatch')
    if any(any(field in row for field in ('reference', 'expected', 'formula_id', 'severity')) for row in blind.get('cases', [])):
        failures.append('blind pack leaks reference data')
    counts = {kind: sum(row.get('case_type') == kind for row in blind.get('cases', [])) for kind in ('QUANTITATIVE_OR_RULE', 'SAFETY_DECISION', 'USABILITY_INTERPRETATION')}
    expected_counts = {'QUANTITATIVE_OR_RULE': 31, 'SAFETY_DECISION': 12, 'USABILITY_INTERPRETATION': 8}
    if counts != expected_counts: failures.append('unexpected case distribution ' + str(counts))
    critical = sum(row.get('reference', {}).get('severity') == 'CRITICAL' for row in key.get('cases', []))
    if critical < 7: failures.append('insufficient critical safety coverage')

    pending_ok, _ = validate_data(evidence, ROOT)
    if pending_ok: failures.append('pending evidence unexpectedly passes external evidence gate')
    if evidence.get('decision') != 'PENDING' or evidence.get('claim_authorization', {}).get('external_validation_claim_allowed') is not False:
        failures.append('pending evidence authorizes external validation claim')

    template_responses = reviewer_template.get('case_responses') or []
    if [row.get('case_id') for row in template_responses] != blind_ids or any(row.get('result') != 'NOT_REVIEWED' or 'expected' in row or 'reference' in row for row in template_responses):
        failures.append('review template does not safely prelist all blind cases')
    if reviewer_template.get('overall_assessment', {}).get('decision') != 'PENDING': failures.append('review template prematurely decides')
    if not reviewer_template.get('case_response_schema'): failures.append('review template lacks response schema')
    prohibited = set(policy.get('privacy_policy', {}).get('prohibited_fields', []))
    pilot_text = json.dumps(pilot_template, ensure_ascii=False).lower()
    if pilot_template.get('contains_direct_identifiers') is not False or any(str(field).lower() in pilot_text for field in prohibited):
        failures.append('pilot template permits direct identifiers')
    if pilot_template.get('consent_recorded_externally') is not False: failures.append('blank pilot template must not claim consent')

    active_paths = ['index.html', 'assets/js/29-report-builder-v5.js', 'assets/js/68-validation-readiness-v5.3.210-pc2.js']
    active = '\n'.join((ROOT / rel).read_text(encoding='utf-8', errors='ignore') for rel in active_paths)
    if 'EXTERNAL_VALIDATION_PENDING' not in active or 'Статус внешней проверки' not in active:
        failures.append('runtime/report lacks validation status disclosure')
    for pattern in policy.get('claims_policy', {}).get('forbidden_regex', []):
        try:
            for match in re.finditer(pattern, active, flags=re.I):
                context = active[max(0, match.start()-140):match.end()+180].lower()
                explicitly_negative = any(marker in context for marker in (
                    'не обозначается как клинически валидирован',
                    'утверждение «клинически валидирован» для этой версии не разрешено',
                    '!/клинически валидирован',
                    'внешняя клиническая и предметная валидация ещё не завершена',
                ))
                if not explicitly_negative:
                    failures.append('active surface contains forbidden claim pattern: ' + pattern)
                    break
        except re.error as exc:
            failures.append('invalid forbidden claim regex: ' + str(exc))

    result = {
        'ok': not failures,
        'version': VERSION,
        'stage_status': policy.get('stage_status'),
        'evidence_domains': len(policy.get('evidence_model', [])),
        'cases': len(blind_ids),
        'case_counts': counts,
        'critical_reference_cases': critical,
        'blind_pack_sha256': blind_hash,
        'reference_key_sha256': key_hash,
        'external_evidence_gate': 'PENDING_REJECTED_AS_REQUIRED',
        'failures': failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.json_out:
        out = Path(args.json_out); out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    raise SystemExit(0 if result['ok'] else 1)

if __name__ == '__main__':
    main()
