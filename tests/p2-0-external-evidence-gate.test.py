#!/usr/bin/env python3
from __future__ import annotations
import copy, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from validate_external_evidence import validate_data  # noqa: E402

blind = json.loads((ROOT / 'validation/P2_0_BLIND_DOMAIN_REVIEW_CASES_RU.json').read_text(encoding='utf-8'))
key = json.loads((ROOT / 'validation/P2_0_REFERENCE_ANSWER_KEY_PRIVATE.json').read_text(encoding='utf-8'))
pending = json.loads((ROOT / 'quality/p2-external-evidence.pending.json').read_text(encoding='utf-8'))
A = 0

def check(condition, message):
    global A
    assert condition, message
    A += 1

def accepted_fixture():
    responses = [{'case_id': row['case_id'], 'result': 'PASS', 'comment_ru': ''} for row in blind['cases']]
    reviewers = []
    for idx in range(3):
        reviewers.append({
            'schema_version': 1,
            'release_version': 'v5.3.210-pc2',
            'blind_pack_sha256': blind['integrity']['content_sha256'],
            'review_id': f'R-{idx+1}',
            'reviewer_pseudonym': f'reviewer-{idx+1}',
            'reviewer_independence_attestation': True,
            'professional_scope': {
                'nutrition_domain': idx < 2,
                'medical_protected_modes': idx == 2,
                'role': 'independent reviewer',
                'years_experience_band': '5_plus',
                'country_or_jurisdiction': 'test',
                'conflicts_of_interest': 'none'
            },
            'case_responses': copy.deepcopy(responses),
            'overall_assessment': {'decision': 'ACCEPTED'},
            'signature': {
                'method': 'typed_attestation_or_external_signature',
                'signed_at': '2026-07-19T12:00:00+02:00',
                'signed_by': f'reviewer-{idx+1}'
            }
        })
    tasks = [{'task_id': task_id, 'completed': True, 'critical_use_error': False, 'assistance_count': 0, 'time_seconds': 30, 'notes_ru': ''}
             for task_id in ('calculate_needs', 'add_first_product', 'interpret_summary', 'find_limitations')]
    pilots = [{
        'schema_version': 1,
        'release_version': 'v5.3.210-pc2',
        'observation_id': f'O-{idx+1}',
        'participant_pseudonym': f'participant-{idx+1}',
        'participant_group': 'LAY_USER_OR_NUTRITION_PROFESSIONAL',
        'moderator_pseudonym': 'moderator-1',
        'session_date': '2026-07-19',
        'consent_recorded_externally': True,
        'contains_direct_identifiers': False,
        'session_decision': 'COMPLETE',
        'tasks': copy.deepcopy(tasks),
        'safety_observations': [],
        'issues': [],
        'ratings_1_to_5': {'clarity': 5, 'confidence_in_next_step': 5, 'perceived_burden': 1, 'understanding_of_limitations': 5}
    } for idx in range(8)]
    return {
        'schema_version': 1,
        'release_version': 'v5.3.210-pc2',
        'created_at': '2026-07-19',
        'blind_pack_sha256': blind['integrity']['content_sha256'],
        'reference_key_sha256': key['integrity']['content_sha256'],
        'evidence_status': 'ACCEPTED',
        'decision': 'ACCEPTED',
        'reviewers': reviewers,
        'pilot_observations': pilots,
        'findings': [],
        'metrics': {'completion_rate': 1.0, 'critical_use_errors': 0, 'quantitative_case_acceptance_rate': 1.0},
        'claim_authorization': {'external_validation_claim_allowed': True, 'authorized_at': '2026-07-19T13:00:00+02:00'}
    }

ok, detail = validate_data(pending, ROOT)
check(not ok and 'decision' in detail['missing_or_failed'], 'pending evidence must be rejected')
fixture = accepted_fixture()
ok, detail = validate_data(fixture, ROOT)
check(ok, detail)
check(detail['reviewers'] == 3 and detail['pilot_observations'] == 8, 'accepted counts')

bad = copy.deepcopy(fixture); bad['reviewers'][0]['signature']['signed_at'] = ''
check(not validate_data(bad, ROOT)[0], 'unsigned review must fail')
bad = copy.deepcopy(fixture); bad['reviewers'][0]['case_responses'] = bad['reviewers'][0]['case_responses'][:-1]
check(not validate_data(bad, ROOT)[0], 'incomplete blind review must fail')
bad = copy.deepcopy(fixture); critical_id = next(row['case_id'] for row in key['cases'] if row['reference'].get('severity') == 'CRITICAL'); next(r for r in bad['reviewers'][1]['case_responses'] if r['case_id'] == critical_id)['result'] = 'FAIL'; bad['metrics']['quantitative_case_acceptance_rate'] = 1.0
check(not validate_data(bad, ROOT)[0], 'critical safety dissent must fail')
bad = copy.deepcopy(fixture); bad['pilot_observations'][0]['tasks'][0]['critical_use_error'] = True; bad['metrics']['critical_use_errors'] = 1
check(not validate_data(bad, ROOT)[0], 'critical pilot error must fail')
bad = copy.deepcopy(fixture); bad['release_version'] = 'v5.3.210-p1.5'
check(not validate_data(bad, ROOT)[0], 'version mismatch must fail')

print(json.dumps({'status': 'PASS', 'assertions': A, 'accepted_fixture_is_test_only': True}, ensure_ascii=False, indent=2))
