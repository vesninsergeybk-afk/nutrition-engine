#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta3-interaction-coherence'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
REPORTS={
 'interaction':'reports/v6-beta3-interaction-acceptance.json',
 'group_overview':'reports/v6-beta3-nutrient-group-acceptance.json',
 'profile':'reports/v6-beta3-profile-acceptance.json',
 'analysis':'reports/v6-beta3-analysis-continuity.json',
 'ui':'reports/v6-beta3-ivory-acceptance.json',
 'extended':'reports/v6-beta3-ivory-extended-acceptance.json',
 'media':'reports/v6-beta3-gemini-media-acceptance.json',
 'runtime':'reports/v6-beta3-runtime-inventory.json',
 'protected':'reports/v6-beta3-protected-comparison.json',
 'generator':'reports/v6-beta3-generator-idempotency.json',
 'budget':'reports/v6-beta3-ui-budget.json',
 'http':'reports/hf28-http-contract.json',
 'secret_http':'reports/hf28-packaged-secret-http.json',
 'extracted_hosting':'reports/v6-beta3-extracted-hosting-acceptance.json',
}
def read(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def add(rows,name,ok,detail=None):
 row={'name':name,'ok':bool(ok)}
 if detail is not None:row['detail']=detail
 rows.append(row)
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta3-release-audit.json');ap.add_argument('--syntax-out',default='reports/v6-beta3-syntax-checks.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve();rows=[]
 for name,rel in REPORTS.items():
  p=ROOT/rel;data=None;ok=p.is_file()
  if ok:
   try:data=read(rel);ok=data.get('ok') is True
   except Exception as exc:data={'error':str(exc)};ok=False
  add(rows,'required report: '+name,ok,{'path':rel,'assertions':data.get('assertions') if isinstance(data,dict) else None})
 for rel in ('index.html','index-v5.3.210.html'):
  t=(ROOT/rel).read_text(encoding='utf-8')
  add(rows,rel+' release version',VERSION in t)
  add(rows,rel+' beta3 runtime selector','00-runtime-selector-v6.0.0-beta3.js' in t)
  add(rows,rel+' interaction CSS after profile CSS',t.find('profile-continuity-v6.css')<t.find('interaction-states-v6.0.0-beta3.css')<t.find('ivory-brass-print-v6.css'))
  add(rows,rel+' interaction controller after theme controller',t.find('theme-controller-v2.js')<t.find('interaction-state-controller-v6.0.0-beta3.js'))
 runtime_files=(
  'config/runtime-assets.v6.0.0-beta3.json','assets/runtime/runtime-manifest-v6.0.0-beta3.js',
  'assets/runtime/critical-shell-v6.0.0-beta3.js','assets/runtime/critical-shell-v6.0.0-beta3.legacy.js',
  'assets/js/00-runtime-bootstrap-v6.0.0-beta3.js','assets/js/00-runtime-selector-v6.0.0-beta3.js',
  'assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta3.legacy.js',
  'assets/css/interaction-states-v6.0.0-beta3.css','assets/js/interaction-state-controller-v6.0.0-beta3.js')
 for rel in runtime_files:add(rows,'runtime/state file present: '+rel,(ROOT/rel).is_file())
 cfg=read('config/runtime-assets.v6.0.0-beta3.json');ui=cfg.get('ui_v6',{});serialized=json.dumps(cfg,ensure_ascii=False).lower()
 add(rows,'interaction contract recorded',ui.get('interaction_state_contract')=='NutritionInteractionStatesV1',ui)
 add(rows,'ten state vocabulary recorded',ui.get('interaction_states')==['idle','hover','pressed','focused','selected','loading','success','error','disabled','recording'],ui.get('interaction_states'))
 add(rows,'HOTFIX29 completed and HOTFIX30 remains future','completed' in serialized and 'hotfix29' in serialized and 'hotfix30' in serialized and 'profile progressive disclosure' in serialized)
 css=(ROOT/'assets/css/interaction-states-v6.0.0-beta3.css').read_text(encoding='utf-8')
 js=(ROOT/'assets/js/interaction-state-controller-v6.0.0-beta3.js').read_text(encoding='utf-8')
 add(rows,'focus/pressed/selected/disabled/validation CSS present',all(x in css for x in ('data-ui-pressed','focus-visible','data-ui-selected','not-allowed','data-ui-touched','aria-invalid')))
 add(rows,'busy is not globally disabled','pointer-events:none' not in css.split('data-ui-lock-while-busy')[0] and 'data-ui-lock-while-busy' in css)
 add(rows,'recording/success/error states present',all(x in css for x in ('uis-record','data-ui-feedback="success"','data-ui-feedback="error"')))
 add(rows,'mobile target safeguard present','min-height:44px!important' in css and '@media(max-width:899px)' in css)
 add(rows,'controller marks and synchronizes all controls',all(x in js for x in ('data-interaction-system','uiInteractive','uiSelected','uiBusy','uiDisabled','uiTouched')))
 add(rows,'details aria-controls avoids false target','bodies.length===1' in js and 'formally misleading' in js)
 add(rows,'repeatable microphone pending state retained','voicePending' in (ROOT/'assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js').read_text(encoding='utf-8'))
 search_js=(ROOT/'assets/js/ivory-brass-search-compact-v6.js').read_text(encoding='utf-8');theme_css=(ROOT/'assets/css/theme-ivory-brass-v6.css').read_text(encoding='utf-8')
 add(rows,'compact search resists legacy visibility reset','data-ivory-search-hidden' in search_js and '[data-ivory-search-hidden="1"]' in theme_css and 'display:none!important' in theme_css)
 index=(ROOT/'index.html').read_text(encoding='utf-8')
 add(rows,'complete analytics remain',all(('id="'+x+'"') in index for x in ('totalsSection','heiPanel','heiTableBody','dietAnalysisProfilePanel','strictHarvardPlateDetails','globalActions')))
 add(rows,'profile persistence remains',all(x in index for x in ('profile-persistence-v6.0.0-beta1.js','profile-continuity-v6.css','analysis-feature-continuity-v6.0.0-beta1.js')))
 add(rows,'three themes remain',all(x in index for x in ('modern','retro-2bit','ivory-brass')))
 add(rows,'nutrient overview contract remains','NutrientGroupOverview.v1' in (ROOT/'assets/js/ivory-brass-view-model-v6.js').read_text(encoding='utf-8'))
 secret=ROOT/'api/gemini-secret.php';add(rows,'server Gemini secret present',secret.is_file())
 if secret.is_file():
  keys=SECRET_RX.findall(secret.read_bytes());add(rows,'primary and backup Gemini keys present',len(keys)>=2 and len(set(keys))>=2,{'key_count':len(keys)});add(rows,'secret mode 0600',(secret.stat().st_mode&0o777)==0o600,oct(secret.stat().st_mode&0o777))
 leaks=[]
 for target in ('assets','index.html','index-v5.3.210.html'):
  p=ROOT/target;files=[p] if p.is_file() else [q for q in p.rglob('*') if q.is_file()]
  for q in files:
   if SECRET_RX.search(q.read_bytes()):leaks.append(str(q.relative_to(ROOT)))
 add(rows,'no Gemini key in client payload',not leaks,leaks)
 syntax=[]
 js_files=[x for x in runtime_files if x.endswith('.js')]+['assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js','assets/js/ivory-brass-view-model-v6.js','assets/js/ivory-brass-charts-v6.js','assets/js/ivory-brass-shell-v6.js','assets/js/ivory-brass-search-compact-v6.js']
 for rel in js_files:
  r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True);syntax.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for p in sorted((ROOT/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 syn={'ok':all(x['ok'] for x in syntax),'release_version':VERSION,'assertions':len(syntax),'results':syntax};sp=ROOT/a.syntax_out;sp.parent.mkdir(parents=True,exist_ok=True);sp.write_text(json.dumps(syn,ensure_ascii=False,indent=2)+'\n')
 add(rows,'changed/generated JS and PHP syntax',syn['ok'],{'assertions':len(syntax)})
 caches=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and (p.suffix=='.pyc' or '__pycache__' in p.parts)]
 add(rows,'no generated bytecode cache',not caches,caches)
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'HOTFIX29 unified interaction states across themes/layouts, with profile, analytics, nutrient overview and Gemini regression protection'}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
