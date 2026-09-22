#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/nutrition_v6_groups_work')
VERSION='v6.0.0-beta3-interaction-coherence'
FILES=[
 'assets/css/interaction-states-v6.0.0-beta3.css',
 'assets/js/interaction-state-controller-v6.0.0-beta3.js',
 'assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js',
 'assets/js/ivory-brass-search-compact-v6.js',
 'assets/css/theme-ivory-brass-v6.css',
]
def size(root,rel):
 p=root/rel
 return p.stat().st_size if p.is_file() else 0
def main():
 global ROOT,BASE
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--base-root',default=str(BASE));ap.add_argument('--json-out',default='reports/v6-beta3-ui-budget.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve();BASE=Path(a.base_root).resolve()
 rows=[]
 for rel in FILES:
  current=size(ROOT,rel);base=size(BASE,rel);rows.append({'path':rel,'base_bytes':base,'current_bytes':current,'delta_bytes':current-base})
 css=sum(max(0,x['delta_bytes']) for x in rows if x['path'].endswith('.css'));js=sum(max(0,x['delta_bytes']) for x in rows if x['path'].endswith('.js'))
 limits={'css_growth_bytes':30000,'js_growth_bytes':50000,'total_growth_bytes':70000}
 ok=css<=limits['css_growth_bytes'] and js<=limits['js_growth_bytes'] and css+js<=limits['total_growth_bytes']
 result={'ok':ok,'release_version':VERSION,'base_release':'v6.0.0-beta2-nutrient-group-overview','affected_assets':rows,'increment':{'css_bytes':css,'js_bytes':js,'total_bytes':css+js},'limits':limits,'framework_added':False}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if ok else 1)
if __name__=='__main__':main()
