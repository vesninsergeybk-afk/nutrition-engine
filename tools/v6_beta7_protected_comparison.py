#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE = Path('/mnt/data/nutrition_v6_beta6_design_work')
VERSION = 'v6.0.0-beta7-navigation-recovery'
BASE = 'v6.0.0-beta6-design-refinement'

def sha(p: Path) -> str: return hashlib.sha256(p.read_bytes()).hexdigest()
def selected(root: Path):
    out=[]
    for folder in ('assets/data','data'):
        p=root/folder
        if p.exists(): out.extend(x for x in p.rglob('*') if x.is_file())
    patterns=(
      'assets/js/01-hei-module.js','assets/js/03-app-core-v5.3.208.js','assets/js/04-needs-norms.js',
      'assets/js/05-protected-modes-v5.3.210.js','assets/js/05-hei-bridges.js','assets/js/26-',
      'assets/js/29-report-builder-v5.js','assets/js/34-','assets/js/38-','assets/js/39-','assets/js/40-',
      'assets/js/41-','assets/js/42-','assets/js/43-','assets/js/44-','assets/js/50-integrated-',
      'assets/js/70-','assets/js/71-','assets/js/72-','assets/js/73-'
    )
    for prefix in patterns:
        if prefix.endswith('-'):
            out.extend(x for x in (root/'assets/js').glob(Path(prefix).name+'*.js') if x.is_file())
        else:
            p=root/prefix
            if p.is_file(): out.append(p)
    mirrors=[]
    for p in out:
        r=p.relative_to(root)
        if str(r).startswith('assets/js/'):
            q=root/Path(str(r).replace('assets/js/','assets/legacy/js/',1))
            if q.is_file(): mirrors.append(q)
    return sorted(set(out+mirrors), key=lambda p:str(p.relative_to(root)))

def product_count(root: Path):
    p=root/'assets/data/products.v5.3.210-p1.3.bundle.js'
    text=p.read_text(encoding='utf-8')
    m=re.search(r'window\.__PRODUCTS_BUNDLE__\s*=\s*(\[.*\])\s*;?\s*$',text,re.S)
    return len(json.loads(m.group(1))) if m else None

def main():
    global ROOT
    ap=argparse.ArgumentParser(); ap.add_argument('--app-root',default=str(ROOT)); ap.add_argument('--base-root',default=str(DEFAULT_BASE)); ap.add_argument('--json-out',default='reports/v6-beta7-protected-comparison.json'); ns=ap.parse_args()
    ROOT=Path(ns.app_root).resolve(); base=Path(ns.base_root).resolve()
    base_files=selected(base); missing=[]; changed=[]; same=[]
    for p in base_files:
        r=p.relative_to(base); q=ROOT/r
        if not q.is_file(): missing.append(str(r)); continue
        if sha(p)!=sha(q): changed.append({'path':str(r),'base':sha(p),'current':sha(q)})
        else: same.append(str(r))
    counts={'base':product_count(base),'current':product_count(ROOT)}
    result={'ok':not missing and not changed and counts['base']==counts['current']==1105,'base_release':BASE,'release_version':VERSION,'protected_files':len(base_files),'unchanged_files':len(same),'missing':missing,'changed':changed,'product_count':counts}
    out=ROOT/ns.json_out; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,ensure_ascii=False,indent=2)); raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__': main()
