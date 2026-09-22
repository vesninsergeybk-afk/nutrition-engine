#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import subprocess
import sys
import zipfile
from pathlib import Path

from runtime_inventory import compute as compute_runtime

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/mnt/data')
VERSION = 'v6.0.0-alpha1-ivory-brass'
BASE = 'v5.3.210-rc2-hf28-gemini-reliability'
CREATED = '2026-08-04T16:43:00Z'
FIXED_DT = (2026, 8, 4, 16, 43, 0)
HOSTING_NAME = 'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_HOSTING_PRIVATE.zip'
FULL_NAME = 'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET = 'api/gemini-secret.php'

EXCLUDE_PARTS = {
    '.git', 'node_modules', 'release', '__pycache__', '.pytest_cache', '.mypy_cache',
    '.ruff_cache', 'playwright-report', 'test-results', 'blob-report', '.cache'
}
EXCLUDE_NAMES = {
    'release-manifest.json', 'release-sbom.spdx.json',
    'reports/v6-build.json', 'reports/v6-archive-verification.json',
    'reports/v6-extracted-hosting-acceptance.json',
}
HOSTING_DOCS = [
    'config/runtime-assets.v6.0.0-alpha1.json',
    'README_DEPLOY_V6_RU.md',
    'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_RELEASE_NOTES_RU.md',
    'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_CHANGELOG_RU.md',
    'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_TEST_REPORT_RU.md',
    'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_AUDIT_RU.md',
]
REQUIRED_REPORTS = [
    'reports/v6-release-audit.json',
    'reports/v6-runtime-inventory.json',
    'reports/v6_ivory_acceptance.json',
    'reports/v6_ivory_extended_acceptance.json',
    'reports/v6-gemini-media-acceptance.json',
    'reports/v6-syntax-checks.json',
    'reports/v6-protected-data-comparison.json',
    'reports/v6-core-regression-comparison.json',
    'reports/v6-generator-idempotency.json',
    'reports/v6-ui-asset-budget.json',
    'reports/hf28-http-contract.json',
    'reports/hf28-packaged-secret-http.json',
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def mode(rel: str) -> int:
    if rel == SECRET:
        return 0o600
    if rel.startswith('tools/') and rel.endswith(('.py', '.sh')):
        return 0o755
    if rel.startswith('tests/') and rel.endswith(('.py', '.sh', '.js', '.php')):
        return 0o755
    return 0o644


def read_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def clean_generated_caches() -> None:
    for p in sorted(ROOT.rglob('__pycache__'), reverse=True):
        if p.is_dir():
            for child in p.rglob('*'):
                if child.is_file():
                    child.unlink()
            for child in sorted(p.rglob('*'), reverse=True):
                if child.is_dir():
                    child.rmdir()
            p.rmdir()
    for p in ROOT.rglob('*.pyc'):
        p.unlink(missing_ok=True)


def runtime_files():
    rels, missing = compute_runtime()
    if missing:
        raise SystemExit('runtime closure incomplete: ' + ', '.join(missing))
    merged = list(rels)
    for rel in HOSTING_DOCS:
        if rel not in merged:
            merged.append(rel)
    rows = []
    for rel in sorted(merged):
        path = ROOT / rel
        if not path.is_file():
            raise SystemExit(f'hosting payload missing: {rel}')
        rows.append((rel, path.read_bytes(), mode(rel)))
    return rows


def full_files():
    rows = []
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if any(x in EXCLUDE_PARTS for x in Path(rel).parts) or rel in EXCLUDE_NAMES:
            continue
        rows.append((rel, path.read_bytes(), mode(rel)))
    return rows


def file_rows(files):
    return [
        {'path': rel, 'size': len(data), 'sha256': sha(data), 'mode': oct(md)}
        for rel, data, md in files
    ]


def manifest(kind: str, files):
    audit = read_json('reports/v6-release-audit.json')
    ui = read_json('reports/v6_ivory_acceptance.json')
    ux = read_json('reports/v6_ivory_extended_acceptance.json')
    media = read_json('reports/v6-gemini-media-acceptance.json')
    runtime = read_json('reports/v6-runtime-inventory.json')
    protected = read_json('reports/v6-protected-data-comparison.json')
    regression = read_json('reports/v6-core-regression-comparison.json')
    budget = read_json('reports/v6-ui-asset-budget.json')
    syntax = read_json('reports/v6-syntax-checks.json')
    http_contract = read_json('reports/hf28-http-contract.json')
    packaged = read_json('reports/hf28-packaged-secret-http.json')
    live = read_json('reports/v6-live-audio-transport-probe.json')
    rows = file_rows(files)
    return {
        'schema_version': 5,
        'release_version': VERSION,
        'base_release': BASE,
        'artifact_kind': kind,
        'created_at': CREATED,
        'file_count': len(rows),
        'uncompressed_bytes': sum(x['size'] for x in rows),
        'change_scope': (
            'Third switchable Ivory & Brass theme; desktop spatial workspace; '
            'mobile sequential sections; stable-DOM projections; calculation-neutral UI layer.'
        ),
        'architecture': {
            'themes': ['modern', 'retro-2bit', 'ivory-brass'],
            'presentation_modes': ['sections', 'canvas'],
            'desktop_ivory_default': 'canvas at >=1080 CSS px unless user chose otherwise',
            'mobile_model': 'sequential sections; canvas is not compressed into phone viewport',
            'view_model_contract': 'NutritionUIViewModel.v1',
            'stable_interactive_dom': True,
            'safe_ui_query': '?safe-ui=1',
            'product_count': 1105,
            'protected_files_byte_identical': protected['unchanged'],
            'runtime_files': runtime['file_count'],
            'server_credentials': (
                'Existing primary and backup Gemini keys are intentionally included only in '
                'protected server-side api/gemini-secret.php for immediate private deployment.'
            ),
        },
        'acceptance': {
            'release_audit_ok': audit['ok'],
            'release_audit_assertions': audit['assertions'],
            'ui_acceptance_ok': ui['ok'],
            'ui_acceptance_assertions': ui['assertions'],
            'extended_ux_ok': ux['ok'],
            'extended_ux_assertions': ux['assertions'],
            'gemini_browser_ok': media['ok'],
            'gemini_browser_assertions': media['assertions'],
            'syntax_ok': syntax['ok'],
            'syntax_assertions': syntax['assertions'],
            'runtime_closure_ok': runtime['ok'],
            'http_contract_ok': http_contract['ok'],
            'http_contract_assertions': http_contract['assertions'],
            'packaged_secret_http_ok': packaged['ok'],
            'packaged_secret_http_assertions': packaged['assertions'],
            'core_new_regressions': regression['new_failures'],
            'ui_css_bytes': budget['css']['bytes'],
            'ui_js_bytes': budget['js']['bytes'],
            'live_provider_response_verified': live.get('provider_response_verified', False),
            'live_transport_status': live.get('http_status'),
        },
        'limitations': [
            'External Gemini response was not received in the isolated build container because DNS access to Google API was unavailable; provider response handling was verified with a controlled mock.',
            'Physical Android, iPhone, Safari, Samsung Internet and Qt WebEngine permission dialogs remain deployment acceptance checks.',
            'Human usability testing with ordinary and professional users has not yet been performed; release status is alpha 1.',
            'The private archives intentionally contain server-side Gemini credentials; remove the uploaded ZIP from public web storage after extraction.',
        ],
        'files': rows,
    }


def spdx(name: str, files):
    spdx_files = []
    for rel, data, _ in files:
        sid = 'SPDXRef-File-' + hashlib.sha1(rel.encode()).hexdigest()
        spdx_files.append({
            'SPDXID': sid,
            'fileName': './' + rel,
            'checksums': [{'algorithm': 'SHA256', 'checksumValue': sha(data)}],
            'licenseConcluded': 'NOASSERTION',
            'copyrightText': 'NOASSERTION',
        })
    return {
        'spdxVersion': 'SPDX-2.3',
        'dataLicense': 'CC0-1.0',
        'SPDXID': 'SPDXRef-DOCUMENT',
        'name': name,
        'documentNamespace': f'https://example.invalid/nutrition-calculator/{VERSION}/{name}',
        'creationInfo': {'created': CREATED, 'creators': ['Tool: build_v6_ivory_brass.py']},
        'packages': [{
            'SPDXID': 'SPDXRef-Package-NutritionCalculator',
            'name': 'nutrition-calculator',
            'versionInfo': VERSION,
            'downloadLocation': 'NOASSERTION',
            'filesAnalyzed': True,
            'licenseConcluded': 'NOASSERTION',
            'licenseDeclared': 'NOASSERTION',
            'copyrightText': 'NOASSERTION',
        }],
        'files': spdx_files,
        'relationships': [
            {
                'spdxElementId': 'SPDXRef-Package-NutritionCalculator',
                'relationshipType': 'CONTAINS',
                'relatedSpdxElement': row['SPDXID'],
            }
            for row in spdx_files
        ],
    }


def add(zf: zipfile.ZipFile, rel: str, data: bytes, md: int) -> None:
    info = zipfile.ZipInfo(rel, FIXED_DT)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = (stat.S_IFREG | md) << 16
    zf.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def build(path: Path, kind: str, files):
    man = manifest(kind, files)
    sbom = spdx(path.name, files)
    path.unlink(missing_ok=True)
    with zipfile.ZipFile(path, 'w') as zf:
        for rel, data, md in files:
            add(zf, rel, data, md)
        add(zf, 'release-manifest.json', (json.dumps(man, ensure_ascii=False, indent=2) + '\n').encode(), 0o644)
        add(zf, 'release-sbom.spdx.json', (json.dumps(sbom, ensure_ascii=False, indent=2) + '\n').encode(), 0o644)
    return man, sbom


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--out-dir', default=str(OUT))
    args = parser.parse_args()
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    clean_generated_caches()
    os.chmod(ROOT / SECRET, 0o600)
    env = dict(os.environ)
    env['PYTHONDONTWRITEBYTECODE'] = '1'
    generated = subprocess.run(
        [sys.executable, str(ROOT / 'tools/generate_v6_ivory_runtime.py')],
        cwd=ROOT, env=env, capture_output=True, text=True,
    )
    if generated.returncode:
        raise SystemExit('runtime generation failed: ' + generated.stderr)
    os.chmod(ROOT / SECRET, 0o600)

    for rel in REQUIRED_REPORTS:
        data = read_json(rel)
        if data.get('ok') is not True:
            raise SystemExit('required report failed: ' + rel)

    hosting = runtime_files()
    full = full_files()
    hp = out / HOSTING_NAME
    fp = out / FULL_NAME
    hm, _ = build(hp, 'hosting-private', hosting)
    fm, sbom = build(fp, 'full-private-audited', full)

    (ROOT / 'release-manifest.json').write_text(json.dumps(fm, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'release-sbom.spdx.json').write_text(json.dumps(sbom, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    result = {
        'ok': True,
        'release_version': VERSION,
        'artifacts': [
            {
                'path': str(hp), 'sha256': sha(hp.read_bytes()),
                'zip_bytes': hp.stat().st_size, 'payload_files': len(hosting),
                'manifest_files': hm['file_count'],
            },
            {
                'path': str(fp), 'sha256': sha(fp.read_bytes()),
                'zip_bytes': fp.stat().st_size, 'payload_files': len(full),
                'manifest_files': fm['file_count'],
            },
        ],
    }
    (ROOT / 'reports/v6-build.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
