#!/usr/bin/env python3
from __future__ import annotations
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/nutrition_v6_beta1_full')
VERSION='v6.0.0-beta2-nutrient-group-overview'
FILES=[
 'assets/js/ivory-brass-view-model-v6.js','assets/js/ivory-brass-charts-v6.js','assets/js/ivory-brass-shell-v6.js',
 'assets/css/theme-ivory-brass-v6.css','assets/css/ivory-brass-responsive-v6.css']
def rows(root):
 out=[]
 for rel in FILES:
  p=root/rel
  out.append({'path':rel,'bytes':p.stat().st_size if p.is_file() else None})
 return out
def main():
 global ROOT,BASE
 ap=argparse.ArgumentParser(); ap.add_argument('--app-root',default=str(ROOT)); ap.add_argument('--base-root',default=str(BASE)); ap.add_argument('--json-out',default='reports/v6-beta2-ui-budget.json'); ns=ap.parse_args(); ROOT=Path(ns.app_root).resolve(); BASE=Path(ns.base_root).resolve()
 cur=rows(ROOT); base=rows(BASE); growth=[]
 for c,b in zip(cur,base): growth.append({'path':c['path'],'base_bytes':b['bytes'],'current_bytes':c['bytes'],'delta_bytes':(c['bytes'] or 0)-(b['bytes'] or 0)})
 css_delta=sum(x['delta_bytes'] for x in growth if x['path'].endswith('.css')); js_delta=sum(x['delta_bytes'] for x in growth if x['path'].endswith('.js'))
 limits={'css_growth_bytes':30000,'js_growth_bytes':60000}
 ok=css_delta<=limits['css_growth_bytes'] and js_delta<=limits['js_growth_bytes']
 result={'ok':ok,'release_version':VERSION,'base_release':'v6.0.0-beta1-profile-continuity','affected_assets':growth,'increment':{'css_bytes':css_delta,'js_bytes':js_delta,'total_bytes':css_delta+js_delta},'limits':limits,'framework_added':False}
 out=ROOT/ns.json_out; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,ensure_ascii=False,indent=2)); raise SystemExit(0 if ok else 1)
if __name__=='__main__': main()
