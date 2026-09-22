#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/nutrition_v6_beta4_profile_work')
VERSION='v6.0.0-beta5-cross-stage-hardening'
FILES=[
 'assets/css/profile-hierarchy-v6.0.0-beta5.css',
 'assets/js/profile-hierarchy-v6.0.0-beta5.js',
 'assets/js/profile-persistence-v6.0.0-beta5.js',
]
def size(root,rel):
 p=root/rel
 return p.stat().st_size if p.is_file() else 0
def main():
 global ROOT,BASE
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--base-root',default=str(BASE));ap.add_argument('--json-out',default='reports/v6-beta5-ui-budget.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve();BASE=Path(a.base_root).resolve()
 rows=[]
 for rel in FILES:
  current=size(ROOT,rel)
  # The beta5 profile modules replace beta4 runtime entries rather than loading both.
  base_rel=rel.replace('v6.0.0-beta5','v6.0.0-beta4')
  base=size(BASE,base_rel)
  rows.append({'path':rel,'base_path':base_rel,'base_bytes':base,'current_bytes':current,'delta_bytes':current-base})
 css=sum(max(0,x['delta_bytes']) for x in rows if x['path'].endswith('.css'));js=sum(max(0,x['delta_bytes']) for x in rows if x['path'].endswith('.js'))
 limits={'css_growth_bytes':20000,'js_growth_bytes':30000,'total_growth_bytes':45000}
 ok=css<=limits['css_growth_bytes'] and js<=limits['js_growth_bytes'] and css+js<=limits['total_growth_bytes']
 result={'ok':ok,'release_version':VERSION,'base_release':'v6.0.0-beta4-profile-hierarchy','affected_assets':rows,'increment':{'css_bytes':css,'js_bytes':js,'total_bytes':css+js},'limits':limits,'framework_added':False}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if ok else 1)
if __name__=='__main__':main()
