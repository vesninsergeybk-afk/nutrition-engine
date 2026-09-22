#!/usr/bin/env python3
from __future__ import annotations

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
VERSION = 'v6.0.0-alpha1-ivory-brass'
HOSTING_NAME = 'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_HOSTING_PRIVATE.zip'
FULL_NAME = 'NUTRITION_CALCULATOR_V6_0_0_ALPHA1_IVORY_BRASS_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
HOSTING = OUT / HOSTING_NAME
FULL = OUT / FULL_NAME
SECRET = 'api/gemini-secret.php'
SECRET_RX = re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def add_result(results, name, ok, detail=None):
    row = {'name': name, 'ok': bool(ok)}
    if detail is not None:
        row['detail'] = detail
    results.append(row)


def check_zip(path: Path, expected_kind: str, results):
    with zipfile.ZipFile(path) as zf:
        names = set(zf.namelist())
        bad = zf.testzip()
        add_result(results, f'{path.name}: CRC', bad is None, bad)
        add_result(results, f'{path.name}: release manifest', 'release-manifest.json' in names)
        add_result(results, f'{path.name}: SPDX SBOM', 'release-sbom.spdx.json' in names)
        manifest = json.loads(zf.read('release-manifest.json'))
        add_result(results, f'{path.name}: version', manifest.get('release_version') == VERSION, manifest.get('release_version'))
        add_result(results, f'{path.name}: kind', manifest.get('artifact_kind') == expected_kind, manifest.get('artifact_kind'))
        add_result(results, f'{path.name}: three themes', manifest['architecture'].get('themes') == ['modern', 'retro-2bit', 'ivory-brass'])
        add_result(results, f'{path.name}: two modes', manifest['architecture'].get('presentation_modes') == ['sections', 'canvas'])
        add_result(results, f'{path.name}: product count', manifest['architecture'].get('product_count') == 1105)
        add_result(results, f'{path.name}: manifest count', len(manifest['files']) == len(names) - 2, {'manifest': len(manifest['files']), 'zip': len(names) - 2})
        errors = []
        for row in manifest['files']:
            rel = row['path']
            if rel not in names:
                errors.append('missing ' + rel)
                continue
            data = zf.read(rel)
            if len(data) != row['size'] or sha(data) != row['sha256']:
                errors.append('hash ' + rel)
        add_result(results, f'{path.name}: all payload hashes', not errors, errors[:10])
        add_result(results, f'{path.name}: server secret present', SECRET in names)
        if SECRET in names:
            secret = zf.read(SECRET)
            keys = SECRET_RX.findall(secret)
            secret_mode = (zf.getinfo(SECRET).external_attr >> 16) & 0o777
            add_result(results, f'{path.name}: primary and backup keys', len(keys) >= 2 and len(set(keys)) >= 2, {'key_count': len(keys)})
            add_result(results, f'{path.name}: secret mode 0600', secret_mode == 0o600, oct(secret_mode))
            add_result(results, f'{path.name}: direct guard', all(token in secret for token in (b'SCRIPT_FILENAME', b'http_response_code(404)', b'exit;')))
        leak_hits = []
        for name in sorted(names):
            if name.endswith('/') or name == SECRET:
                continue
            try:
                data = zf.read(name)
            except Exception:
                continue
            if SECRET_RX.search(data):
                leak_hits.append(name)
        add_result(results, f'{path.name}: keys isolated from all other files', not leak_hits, leak_hits)
        for rel in (
            'index.html', 'assets/js/theme-controller-v2.js',
            'assets/js/ivory-brass-shell-v6.js',
            'assets/js/ivory-brass-view-model-v6.js',
            'assets/js/89-workspace-entry-ux-v6.0.0-alpha1.js',
            'assets/css/theme-ivory-brass-v6.css',
            'config/runtime-assets.v6.0.0-alpha1.json',
            'assets/runtime/runtime-manifest-v6.0.0-alpha1.js',
        ):
            add_result(results, f'{path.name}: required {rel}', rel in names)


def direct_request_test(docroot: Path, results):
    port = '18760'
    proc = subprocess.Popen(
        ['php', '-S', f'127.0.0.1:{port}', '-t', str(docroot)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    body_path = OUT / 'v6-secret-direct-body.tmp'
    try:
        time.sleep(0.6)
        response = subprocess.run(
            ['curl', '-sS', '-o', str(body_path), '-w', '%{http_code}', f'http://127.0.0.1:{port}/api/gemini-secret.php'],
            capture_output=True, text=True, timeout=20,
        )
        body = body_path.read_bytes() if body_path.exists() else b''
        add_result(
            results, 'extracted hosting: direct secret request is empty 404',
            response.returncode == 0 and response.stdout.strip() == '404' and body == b'' and SECRET_RX.search(body) is None,
            {'status': response.stdout.strip(), 'body_bytes': len(body)},
        )
    finally:
        body_path.unlink(missing_ok=True)
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


def main():
    results = []
    add_result(results, 'hosting archive exists', HOSTING.is_file())
    add_result(results, 'full archive exists', FULL.is_file())
    check_zip(HOSTING, 'hosting-private', results)
    check_zip(FULL, 'full-private-audited', results)

    verify_root = OUT / 'v6_ivory_archive_verify'
    shutil.rmtree(verify_root, ignore_errors=True)
    verify_root.mkdir(parents=True)
    with zipfile.ZipFile(HOSTING) as zf:
        zf.extractall(verify_root)
    direct_request_test(verify_root, results)

    # Syntax checks on the clean extracted hosting payload.
    for rel in (
        'assets/js/theme-controller-v2.js',
        'assets/js/ivory-brass-charts-v6.js',
        'assets/js/ivory-brass-view-model-v6.js',
        'assets/js/ivory-brass-shell-v6.js',
        'assets/js/ivory-brass-progressive-disclosure-v6.js',
        'assets/js/ivory-brass-search-compact-v6.js',
        'assets/js/89-workspace-entry-ux-v6.0.0-alpha1.js',
        'assets/runtime/runtime-manifest-v6.0.0-alpha1.js',
    ):
        run = subprocess.run(['node', '--check', str(verify_root / rel)], capture_output=True, text=True)
        add_result(results, f'extracted syntax: {rel}', run.returncode == 0, (run.stderr or run.stdout)[-300:])
    for rel in ('api/gemini.php', 'api/utf8-safe.php', SECRET):
        run = subprocess.run(['php', '-l', str(verify_root / rel)], capture_output=True, text=True)
        add_result(results, f'extracted syntax: {rel}', run.returncode == 0, (run.stderr or run.stdout)[-300:])

    # Runtime closure from the source manifest must be fully represented in hosting.
    runtime_module = ROOT / 'tools/runtime_inventory.py'
    env = dict(os.environ)
    env['PYTHONDONTWRITEBYTECODE'] = '1'
    runtime = subprocess.run([sys.executable, str(runtime_module), '--json-out', str(OUT / 'v6-runtime-recheck.json')], cwd=ROOT, env=env, capture_output=True, text=True)
    add_result(results, 'runtime inventory command', runtime.returncode == 0, runtime.stderr[-300:])
    if runtime.returncode == 0:
        inventory = json.loads((OUT / 'v6-runtime-recheck.json').read_text(encoding='utf-8'))
        with zipfile.ZipFile(HOSTING) as zf:
            names = set(zf.namelist())
        missing = [rel for rel in inventory['files'] if rel not in names]
        add_result(results, 'hosting contains entire 311-file runtime closure', not missing and inventory['file_count'] == 311, {'file_count': inventory['file_count'], 'missing': missing[:10]})
    (OUT / 'v6-runtime-recheck.json').unlink(missing_ok=True)

    # Reproducibility: rebuild in another directory and compare full bytes.
    repro = OUT / 'v6_ivory_repro'
    shutil.rmtree(repro, ignore_errors=True)
    repro.mkdir(parents=True)
    build = subprocess.run(
        [sys.executable, str(ROOT / 'tools/build_v6_ivory_brass.py'), '--out-dir', str(repro)],
        cwd=ROOT, env=env, capture_output=True, text=True, timeout=300,
    )
    add_result(results, 'reproducible build command', build.returncode == 0, build.stderr[-500:])
    if build.returncode == 0:
        for original in (HOSTING, FULL):
            rebuilt = repro / original.name
            add_result(
                results, f'byte-identical rebuild: {original.name}',
                original.read_bytes() == rebuilt.read_bytes(),
                {'sha256': sha(rebuilt.read_bytes())},
            )

    output = {
        'ok': all(row['ok'] for row in results),
        'release_version': VERSION,
        'assertions': len(results),
        'results': results,
        'artifacts': [
            {'path': str(HOSTING), 'sha256': sha(HOSTING.read_bytes()), 'bytes': HOSTING.stat().st_size},
            {'path': str(FULL), 'sha256': sha(FULL.read_bytes()), 'bytes': FULL.stat().st_size},
        ],
    }
    (ROOT / 'reports/v6-archive-verification.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(output, ensure_ascii=False, indent=2))
    raise SystemExit(0 if output['ok'] else 1)


if __name__ == '__main__':
    main()
