#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BETA_CSS=['assets/css/profile-continuity-v6.css']
BETA_JS=['assets/js/profile-persistence-v6.0.0-beta1.js','assets/js/analysis-feature-continuity-v6.0.0-beta1.js']
V6_CSS=['assets/css/theme-system-v2.css','assets/css/theme-ivory-brass-v6.css','assets/css/ivory-brass-workspace-v6.css','assets/css/ivory-brass-sections-v6.css','assets/css/ivory-brass-responsive-v6.css','assets/css/ivory-brass-print-v6.css']+BETA_CSS
V6_JS=['assets/js/theme-controller-v2.js','assets/js/ivory-brass-view-model-v6.js','assets/js/ivory-brass-charts-v6.js','assets/js/ivory-brass-shell-v6.js','assets/js/ivory-brass-progressive-disclosure-v6.js','assets/js/ivory-brass-search-compact-v6.js']+BETA_JS

def measure(files):
 rows=[]
 for rel in files:
  p=ROOT/rel
  if p.is_file():rows.append({'path':rel,'bytes':p.stat().st_size})
 return {'bytes':sum(x['bytes'] for x in rows),'files':rows}
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta1-ui-budget.json');ns=ap.parse_args();ROOT=Path(ns.app_root).resolve()
 beta_css=measure(BETA_CSS);beta_js=measure(BETA_JS);v6_css=measure(V6_CSS);v6_js=measure(V6_JS)
 limits={'beta_css':30000,'beta_js':60000,'v6_css':150000,'v6_js':180000}
 result={'ok':beta_css['bytes']<=limits['beta_css'] and beta_js['bytes']<=limits['beta_js'] and v6_css['bytes']<=limits['v6_css'] and v6_js['bytes']<=limits['v6_js'],'release_version':'v6.0.0-beta1-profile-continuity','beta_increment':{'css':beta_css,'js':beta_js},'v6_ui_total':{'css':v6_css,'js':v6_js},'limits':limits,'framework_added':False}
 out=ROOT/ns.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
