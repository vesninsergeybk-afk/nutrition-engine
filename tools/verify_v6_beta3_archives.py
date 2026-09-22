#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/mnt/data')
VERSION = 'v6.0.0-beta3-interaction-coherence'
HOSTING_NAME = 'NUTRITION_CALCULATOR_V6_0_0_BETA3_INTERACTION_COHERENCE_HOSTING_PRIVATE.zip'
FULL_NAME = 'NUTRITION_CALCULATOR_V6_0_0_BETA3_INTERACTION_COHERENCE_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET = 'api/gemini-secret.php'
SECRET_RX = re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
FINAL_REPORTS = {
    'interaction': 'interaction.json',
    'profile': 'profile.json',
    'analysis': 'analysis.json',
    'ivory': 'ivory.json',
    'ivory_extended': 'extended.json',
    'nutrient_group': 'groups.json',
    'gemini_media': 'media.json',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def add(rows: list[dict], name: str, ok: bool, detail=None) -> None:
    row = {'name': name, 'ok': bool(ok)}
    if detail is not None:
        row['detail'] = detail
    rows.append(row)


def check_zip(path: Path, kind: str, rows: list[dict]) -> None:
    with zipfile.ZipFile(path) as zf:
        names = set(zf.namelist())
        add(rows, f'{path.name}: CRC', zf.testzip() is None)
        add(rows, f'{path.name}: manifest', 'release-manifest.json' in names)
        add(rows, f'{path.name}: SBOM', 'release-sbom.spdx.json' in names)
        manifest = json.loads(zf.read('release-manifest.json'))
        arch = manifest.get('architecture', {})
        acceptance = manifest.get('acceptance', {})
        add(rows, f'{path.name}: version', manifest.get('release_version') == VERSION, manifest.get('release_version'))
        add(rows, f'{path.name}: kind', manifest.get('artifact_kind') == kind, manifest.get('artifact_kind'))
        add(rows, f'{path.name}: interaction contract', arch.get('interaction_state_contract') == 'NutritionInteractionStatesV1')
        add(rows, f'{path.name}: HOTFIX29 completed', arch.get('interaction_state_release') == 'HOTFIX29 completed')
        add(rows, f'{path.name}: HOTFIX30 retained', 'HOTFIX30' in arch.get('future_work', {}))
        add(rows, f'{path.name}: stable interactive DOM', arch.get('stable_interactive_dom') is True)
        add(rows, f'{path.name}: all themes/layouts', arch.get('themes') == ['modern', 'retro-2bit', 'ivory-brass'] and arch.get('presentation_modes') == ['sections', 'canvas'])
        add(rows, f'{path.name}: protected core', arch.get('protected_files_byte_identical') == 184, arch.get('protected_files_byte_identical'))
        add(rows, f'{path.name}: products', arch.get('product_count') == 1105, arch.get('product_count'))
        add(rows, f'{path.name}: runtime count', arch.get('runtime_files') == 315, arch.get('runtime_files'))
        embedded = acceptance.get('extracted_hosting_browser', {})
        add(rows, f'{path.name}: embedded extracted preflight 43/43', embedded.get('ok') is True and embedded.get('assertions') == 43, embedded)

        errors = []
        for item in manifest.get('files', []):
            rel = item['path']
            if rel not in names:
                errors.append('missing ' + rel)
                continue
            data = zf.read(rel)
            if len(data) != item['size'] or sha(data) != item['sha256']:
                errors.append('hash ' + rel)
        add(rows, f'{path.name}: payload hashes', not errors, errors[:10])
        add(rows, f'{path.name}: manifest count', len(manifest.get('files', [])) == len(names) - 2, {'manifest': len(manifest.get('files', [])), 'zip': len(names) - 2})

        add(rows, f'{path.name}: secret present', SECRET in names)
        if SECRET in names:
            secret = zf.read(SECRET)
            keys = SECRET_RX.findall(secret)
            mode = (zf.getinfo(SECRET).external_attr >> 16) & 0o777
            add(rows, f'{path.name}: primary and backup keys', len(keys) >= 2 and len(set(keys)) >= 2, {'key_count': len(keys)})
            add(rows, f'{path.name}: secret mode 0600', mode == 0o600, oct(mode))
            add(rows, f'{path.name}: direct execution guard', all(x in secret for x in (b'SCRIPT_FILENAME', b'http_response_code(404)', b'exit;')))
        leaks = []
        for name in names:
            if name == SECRET or name.endswith('/'):
                continue
            if SECRET_RX.search(zf.read(name)):
                leaks.append(name)
        add(rows, f'{path.name}: keys isolated from client and reports', not leaks, leaks)

        required = (
            'index.html',
            'config/runtime-assets.v6.0.0-beta3.json',
            'assets/runtime/runtime-manifest-v6.0.0-beta3.js',
            'assets/runtime/critical-shell-v6.0.0-beta3.js',
            'assets/runtime/critical-shell-v6.0.0-beta3.legacy.js',
            'assets/js/00-runtime-bootstrap-v6.0.0-beta3.js',
            'assets/js/00-runtime-selector-v6.0.0-beta3.js',
            'assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta3.legacy.js',
            'assets/css/interaction-states-v6.0.0-beta3.css',
            'assets/js/interaction-state-controller-v6.0.0-beta3.js',
            'assets/js/ivory-brass-search-compact-v6.js',
            'assets/css/theme-ivory-brass-v6.css',
            'assets/js/profile-persistence-v6.0.0-beta1.js',
            'assets/js/analysis-feature-continuity-v6.0.0-beta1.js',
            'README_DEPLOY_V6_BETA3_RU.md',
        )
        for rel in required:
            add(rows, f'{path.name}: {rel}', rel in names)
        if 'assets/js/ivory-brass-search-compact-v6.js' in names and 'assets/css/theme-ivory-brass-v6.css' in names:
            js = zf.read('assets/js/ivory-brass-search-compact-v6.js').decode('utf-8')
            css = zf.read('assets/css/theme-ivory-brass-v6.css').decode('utf-8')
            add(rows, f'{path.name}: compact search has persistent marker', 'data-ivory-search-hidden' in js and '[data-ivory-search-hidden="1"]' in css)
        if 'assets/css/interaction-states-v6.0.0-beta3.css' in names:
            css = zf.read('assets/css/interaction-states-v6.0.0-beta3.css').decode('utf-8')
            add(rows, f'{path.name}: focus and recording states', ':focus-visible' in css and 'recording' in css and 'data-ui-state="error"' in css)


def direct_secret(root: Path, rows: list[dict], out_dir: Path) -> None:
    port = '18763'
    proc = subprocess.Popen(['php', '-S', f'127.0.0.1:{port}', '-t', str(root)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    body = out_dir / 'v6-beta3-secret-body.tmp'
    try:
        time.sleep(0.8)
        result = subprocess.run(['curl', '-sS', '-o', str(body), '-w', '%{http_code}', f'http://127.0.0.1:{port}/api/gemini-secret.php'], capture_output=True, text=True, timeout=20)
        data = body.read_bytes() if body.exists() else b''
        add(rows, 'extracted hosting: secret is empty 404', result.returncode == 0 and result.stdout.strip() == '404' and data == b'', {'status': result.stdout.strip(), 'bytes': len(data)})
    finally:
        body.unlink(missing_ok=True)
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


def read_final_acceptance(report_dir: Path, hosting_sha: str, rows: list[dict]) -> dict:
    suites = []
    for suite, filename in FINAL_REPORTS.items():
        path = report_dir / filename
        data = None
        ok = path.is_file()
        if ok:
            try:
                data = json.loads(path.read_text(encoding='utf-8'))
                ok = data.get('ok') is True and data.get('release_version') == VERSION
            except Exception as exc:
                data = {'error': str(exc)}
                ok = False
        assertions = data.get('assertions', 0) if isinstance(data, dict) else 0
        add(rows, f'exact final extracted browser: {suite}', ok, {'path': str(path), 'assertions': assertions})
        suites.append({'suite': suite, 'ok': ok, 'assertions': assertions, 'path': str(path)})
    combined_path = report_dir / 'extracted-hosting-acceptance.json'
    combined = None
    ok = combined_path.is_file()
    if ok:
        try:
            combined = json.loads(combined_path.read_text(encoding='utf-8'))
            ok = combined.get('ok') is True and combined.get('release_version') == VERSION and combined.get('assertions') == 43 and combined.get('archive_sha256') == hosting_sha
        except Exception as exc:
            combined = {'error': str(exc)}
            ok = False
    add(rows, 'exact final extracted hosting combined 43/43 and archive hash bound', ok, combined)
    return combined or {'ok': False, 'assertions': sum(x['assertions'] for x in suites), 'suites': suites}


def main() -> None:
    global ROOT, OUT
    parser = argparse.ArgumentParser()
    parser.add_argument('--app-root', default=str(ROOT))
    parser.add_argument('--out-dir', default=str(OUT))
    parser.add_argument('--extracted-report-dir', required=True)
    parser.add_argument('--json-out', default='reports/v6-beta3-archive-verification.json')
    args = parser.parse_args()
    ROOT = Path(args.app_root).resolve()
    OUT = Path(args.out_dir).resolve()
    report_dir = Path(args.extracted_report_dir).resolve()
    hosting = OUT / HOSTING_NAME
    full = OUT / FULL_NAME
    rows: list[dict] = []
    add(rows, 'hosting exists', hosting.is_file())
    add(rows, 'full exists', full.is_file())
    if not hosting.is_file() or not full.is_file():
        raise SystemExit(1)

    check_zip(hosting, 'hosting-private', rows)
    check_zip(full, 'full-private-audited', rows)

    verify = OUT / 'v6_beta3_final_archive_verify'
    shutil.rmtree(verify, ignore_errors=True)
    verify.mkdir(parents=True)
    with zipfile.ZipFile(hosting) as zf:
        zf.extractall(verify)
    direct_secret(verify, rows, OUT)

    for rel in (
        'assets/js/interaction-state-controller-v6.0.0-beta3.js',
        'assets/js/ivory-brass-search-compact-v6.js',
        'assets/js/ivory-brass-view-model-v6.js',
        'assets/js/ivory-brass-charts-v6.js',
        'assets/js/ivory-brass-shell-v6.js',
        'assets/runtime/runtime-manifest-v6.0.0-beta3.js',
        'assets/runtime/critical-shell-v6.0.0-beta3.js',
        'assets/runtime/critical-shell-v6.0.0-beta3.legacy.js',
        'assets/js/00-runtime-bootstrap-v6.0.0-beta3.js',
        'assets/js/00-runtime-selector-v6.0.0-beta3.js',
    ):
        result = subprocess.run(['node', '--check', str(verify / rel)], capture_output=True, text=True)
        add(rows, 'extracted syntax: ' + rel, result.returncode == 0, (result.stderr or result.stdout)[-300:])
    for rel in ('api/gemini.php', 'api/utf8-safe.php', SECRET):
        result = subprocess.run(['php', '-l', str(verify / rel)], capture_output=True, text=True)
        add(rows, 'extracted syntax: ' + rel, result.returncode == 0, (result.stderr or result.stdout)[-300:])

    inventory = json.loads((ROOT / 'reports/v6-beta3-runtime-inventory.json').read_text(encoding='utf-8'))
    with zipfile.ZipFile(hosting) as zf:
        names = set(zf.namelist())
    missing = [rel for rel in inventory.get('files', []) if rel not in names]
    add(rows, 'hosting contains complete runtime closure', inventory.get('ok') is True and inventory.get('file_count') == 315 and not missing, {'file_count': inventory.get('file_count'), 'missing': missing[:10]})

    hosting_sha = sha(hosting.read_bytes())
    combined = read_final_acceptance(report_dir, hosting_sha, rows)

    env = dict(os.environ)
    env['PYTHONDONTWRITEBYTECODE'] = '1'
    repro = OUT / 'v6_beta3_repro'
    shutil.rmtree(repro, ignore_errors=True)
    repro.mkdir(parents=True)
    result = subprocess.run([sys.executable, str(ROOT / 'tools/build_v6_beta3.py'), '--out-dir', str(repro)], cwd=ROOT, env=env, capture_output=True, text=True, timeout=420)
    add(rows, 'rebuild command', result.returncode == 0, (result.stderr or result.stdout)[-500:])
    if result.returncode == 0:
        for original in (hosting, full):
            rebuilt = repro / original.name
            add(rows, 'byte-identical rebuild: ' + original.name, rebuilt.is_file() and original.read_bytes() == rebuilt.read_bytes(), {'sha256': sha(rebuilt.read_bytes()) if rebuilt.is_file() else None})

    verification = {
        'ok': all(row['ok'] for row in rows),
        'release_version': VERSION,
        'assertions': len(rows),
        'results': rows,
        'artifacts': [{'path': str(path), 'sha256': sha(path.read_bytes()), 'bytes': path.stat().st_size} for path in (hosting, full)],
        'exact_final_extracted_acceptance': combined,
    }
    output = ROOT / args.json_out
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(verification, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(verification, ensure_ascii=False, indent=2))
    raise SystemExit(0 if verification['ok'] else 1)


if __name__ == '__main__':
    main()
