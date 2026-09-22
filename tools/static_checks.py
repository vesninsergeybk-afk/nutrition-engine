#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, re, stat, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {
    '.git', 'node_modules', 'reports', 'release',
    '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache',
    'playwright-report', 'test-results', 'blob-report',
}
ACTIVE_HTML = ('index.html', 'index-v5.3.210.html')
EXPECTED_VERSION = 'v5.3.210-rc2'

class AppHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=[]; self.refs=[]; self.external_runtime=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        attr = 'src' if tag in {'script','img','source'} else ('href' if tag in {'link','a'} else None)
        if attr and a.get(attr):
            value=a[attr]
            if tag in {'script','link'} and re.match(r'^https?://', value, re.I): self.external_runtime.append((tag,value))
            if tag in {'script','link','img','source'}: self.refs.append((tag,value))

def files_with_suffix(suffix: str):
    for p in ROOT.rglob(f'*{suffix}'):
        if any(part in EXCLUDED_DIRS for part in p.relative_to(ROOT).parts): continue
        if p.is_file(): yield p

def run(cmd):
    return subprocess.run(cmd, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

def _syntax_one(tool: str, p: Path):
    cmd=[tool,'--check',str(p)] if tool=='node' else [tool,'-l',str(p)]
    r=run(cmd)
    return None if r.returncode==0 else f'{p.relative_to(ROOT)}: {r.stdout.strip()}'

def _parallel_syntax(tool: str, suffix: str):
    paths=list(files_with_suffix(suffix))
    workers=min(12,max(2,(os.cpu_count() or 2)))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results=list(pool.map(lambda p:_syntax_one(tool,p),paths))
    return len(paths),[x for x in results if x]

def check_js():
    return _parallel_syntax('node','.js')

def check_php():
    return _parallel_syntax('php','.php')

def check_json():
    failures=[]; count=0
    for p in files_with_suffix('.json'):
        count+=1
        try: json.loads(p.read_text(encoding='utf-8'))
        except Exception as e: failures.append(f'{p.relative_to(ROOT)}: {e}')
    return count, failures

def check_html():
    failures=[]; assertions=0
    for name in ACTIVE_HTML:
        p=ROOT/name; parser=AppHTMLParser(); parser.feed(p.read_text(encoding='utf-8'))
        assertions+=1
        dup=sorted({x for x in parser.ids if parser.ids.count(x)>1})
        if dup: failures.append(f'{name}: duplicate ids {dup}')
        if parser.external_runtime: failures.append(f'{name}: external runtime resources {parser.external_runtime}')
        for tag,ref in parser.refs:
            if ref.startswith(('data:','#','mailto:','tel:','javascript:','http://','https://','//')): continue
            clean=ref.split('?',1)[0].split('#',1)[0]
            if not clean: continue
            target=(p.parent/clean).resolve()
            assertions+=1
            if not target.is_file(): failures.append(f'{name}: missing {tag} resource {ref}')
    assertions+=1
    if (ROOT/'index.html').read_bytes() != (ROOT/'index-v5.3.210.html').read_bytes():
        failures.append('index.html and index-v5.3.210.html are not byte-identical')
    return assertions, failures

def check_permissions():
    failures=[]; count=0
    for p in ROOT.rglob('*'):
        if any(part in EXCLUDED_DIRS for part in p.relative_to(ROOT).parts): continue
        count+=1; mode=p.stat().st_mode
        if mode & (stat.S_IWGRP|stat.S_IWOTH): failures.append(f'{p.relative_to(ROOT)} is group/world writable: {oct(stat.S_IMODE(mode))}')
    return count, failures

def check_secrets():
    failures=[]; count=0
    pat=re.compile(rb'AIza[0-9A-Za-z_-]{30,}')
    for p in ROOT.rglob('*'):
        if not p.is_file() or any(part in EXCLUDED_DIRS for part in p.relative_to(ROOT).parts): continue
        if p.relative_to(ROOT).as_posix()=='api/gemini-secret.php': continue
        if p.stat().st_size > 20_000_000: continue
        count+=1
        try: data=p.read_bytes()
        except OSError: continue
        if pat.search(data): failures.append(f'Google API key-like value outside private secret file: {p.relative_to(ROOT)}')
    return count, failures

def check_version_and_workflow():
    failures=[]; count=0
    release_required=[
        ROOT/'index.html',ROOT/'index-v5.3.210.html',ROOT/'config/runtime-assets.v5.3.210-rc2.json',
        ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf20.js',
        ROOT/'assets/js/67-professional-workflow-restoration-v5.3.210-rc2.js',
        ROOT/'assets/legacy/js/67-professional-workflow-restoration-v5.3.210-rc2.js',
        ROOT/'assets/js/69-release-support-v5.3.210-rc2.js',
        ROOT/'assets/legacy/js/69-release-support-v5.3.210-rc2.js',
        ROOT/'assets/css/professional-workflow-restoration-v5.3.210-rc2.css',
        ROOT/'assets/css/release-support-v5.3.210-rc2.css',ROOT/'api/gemini.php'
    ]
    for p in release_required:
        count+=1
        if EXPECTED_VERSION not in p.read_text(encoding='utf-8',errors='ignore'):
            failures.append(f'{p.relative_to(ROOT)} lacks {EXPECTED_VERSION}')
    runtime=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'))
    active='\n'.join(runtime['css_sources']+runtime['modern_core_scripts']+runtime['legacy_core_scripts'])
    for stale in ['67-ux-decision-hierarchy-v5.3.210-pc2.js','68-validation-readiness-v5.3.210-pc2.js','product-correction-stabilization-v5.3.210-pc2.css','validation-readiness-v5.3.210-pc2.css','ux-decision-hierarchy-v5.3.210-p1.5.css']:
        count+=1
        if stale in active: failures.append(f'active runtime still contains obsolete UI layer: {stale}')
    for rel,version in [
        ('assets/data/validation-evidence-policy.v5.3.210-pc2.js','v5.3.210-pc2'),
        ('assets/data/ux-decision-hierarchy.v5.3.210-p1.5.js','v5.3.210-p1.5'),
        ('assets/data/formula-registry.v5.3.210-p1.4.js','v5.3.210-p1.4'),
        ('assets/data/normative-registry.v5.3.210-p1.2.json','v5.3.210-p1.2')]:
        p=ROOT/rel;count+=1
        if version not in p.read_text(encoding='utf-8',errors='ignore'):failures.append(f'{rel} lacks {version}')
    wf=ROOT/'.github/workflows/quality-gate.yml'
    if wf.exists():
        for line in wf.read_text().splitlines():
            m=re.search(r'uses:\s*([^\s#]+)',line)
            if m:
                count+=1;ref=m.group(1)
                if '@' not in ref or not re.search(r'@[0-9a-f]{40}$',ref):failures.append(f'workflow action is not pinned to full SHA: {ref}')
    return count, failures

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--json-out'); args=ap.parse_args()
    suites=[]
    for name,fn in [('javascript_syntax',check_js),('php_syntax',check_php),('json_parse',check_json),('html_integrity',check_html),('permissions',check_permissions),('secret_scan',check_secrets),('version_workflow',check_version_and_workflow)]:
        count,failures=fn(); suites.append({'name':name,'assertions':count,'passed':not failures,'failures':failures})
        print(f"{name}: {'PASS' if not failures else 'FAIL'} ({count})")
        for f in failures: print('  -',f)
    result={'ok':all(x['passed'] for x in suites),'root':str(ROOT),'suites':suites,'assertions':sum(x['assertions'] for x in suites)}
    if args.json_out:
        out=Path(args.json_out); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return 0 if result['ok'] else 1
if __name__=='__main__': raise SystemExit(main())
