#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re
from collections import deque
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta7.json'
TEXT_EXT={'.html','.js','.css','.json','.php','.xml','.txt','.svg','.webmanifest','.htaccess'}
ROOT_FILES={'assets/data/normative-registry.v5.3.210-p1.2.json','data/product-provenance-registry.v5.3.210-p1.3.json','.htaccess','_headers','index.html','index-v5.3.210.html','api/gemini.php','api/utf8-safe.php','api/gemini-guard.php','api/gemini-secret.php','api/.htaccess','robots.txt'}
QUOTED_RE=re.compile(r'''["']((?:\.{0,2}/)?(?:assets|data|api)/[^"'?#\s<>]+)(?:\?[^"']*)?["']''')
CSS_URL_RE=re.compile(r'''url\(\s*["']?([^"')?#\s]+)(?:\?[^"')]*)?["']?\s*\)''',re.I)
HTML_RE=re.compile(r'''(?:src|href)=["']([^"'?#]+)(?:\?[^"']*)?["']''',re.I)


def clean_path(raw:str, source:Path)->str|None:
    raw=raw.strip().replace('\\','/')
    raw=raw.split('::',1)[0]
    if not raw or raw.endswith('/') or raw.endswith('-') or raw.startswith(('data:','http:','https:','//','#','mailto:','tel:','javascript:')): return None
    if raw.startswith('/'):
        candidate=ROOT/raw.lstrip('/')
    elif raw.startswith(('./assets/','./data/','./api/','assets/','data/','api/')):
        candidate=ROOT/raw.lstrip('./')
    else:
        candidate=(source.parent/raw).resolve()
    try: rel=candidate.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError: return None
    return rel


def references(path:Path):
    try: text=path.read_text(encoding='utf-8')
    except (UnicodeDecodeError,OSError): return set()
    out=set()
    for rx in (QUOTED_RE,HTML_RE):
        for m in rx.finditer(text):
            rel=clean_path(m.group(1),path)
            if rel: out.add(rel)
    if path.suffix.lower()=='.css':
        for m in CSS_URL_RE.finditer(text):
            rel=clean_path(m.group(1),path)
            if rel: out.add(rel)
    return out


def legacy_path(url:str)->str:
    clean=url.split('?',1)[0].lstrip('./')
    if clean.startswith('assets/js/'):
        clean=clean.replace('assets/js/','assets/legacy/js/',1)
    elif clean.startswith('assets/data/') and 'products.' not in clean:
        clean=clean.replace('assets/data/','assets/legacy/data/',1)
    return clean


def compute():
    cfg=json.loads(CONFIG.read_text(encoding='utf-8'))
    roots=set(ROOT_FILES)
    roots.update(p.relative_to(ROOT).as_posix() for p in (ROOT/'assets/images/harvard-plate/v5').rglob('*') if p.is_file())
    # Dynamic legacy path mapping is not visible as a literal in the browser manifest.
    roots.update(legacy_path(x) for x in cfg['legacy_core_scripts'])
    roots.update(x.split('?',1)[0].lstrip('./') for x in cfg['product_script_chunks'])
    roots.update(x.split('?',1)[0].lstrip('./') for x in cfg['product_json_chunks'])
    roots.update(x.split('?',1)[0].lstrip('./') for x in cfg['selftest_scripts'])
    roots.update(x.split('?',1)[0].lstrip('./') for x in cfg['diagnostic_scripts'])
    roots.add(cfg['performance_script'].split('?',1)[0].lstrip('./'))
    queue=deque(sorted(roots)); seen=set(); missing=[]
    while queue:
        rel=queue.popleft()
        if rel in seen: continue
        seen.add(rel)
        path=ROOT/rel
        if not path.is_file():
            missing.append(rel);continue
        if path.suffix.lower() in TEXT_EXT or path.name in {'.htaccess','_headers'}:
            for dep in references(path):
                if dep not in seen: queue.append(dep)
    return sorted(seen),sorted(set(missing))


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--json-out');ap.add_argument('--list',action='store_true');args=ap.parse_args()
    files,missing=compute()
    all_runtime=[]
    for top in ('assets','data','api'):
        all_runtime += [p.relative_to(ROOT).as_posix() for p in (ROOT/top).rglob('*') if p.is_file()]
    reachable=set(files)
    unreachable=sorted(set(all_runtime)-reachable)
    result={'ok':not missing,'files':files,'file_count':len(files),'missing':missing,'unreachable_count':len(unreachable),'unreachable':unreachable}
    if args.list:
        print('\n'.join(files))
    else:
        print(json.dumps({k:v for k,v in result.items() if k not in {'files','unreachable'}},ensure_ascii=False,indent=2))
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__': main()
