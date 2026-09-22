#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta7-navigation-recovery'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z_-]{20,})')
SECRET_ENTRY_RX=re.compile(rb"'(primary|backup)'\s*=>\s*'([^']+)'")
REPORTS={
 'navigation':'reports/v6-beta7-navigation-recovery-acceptance.json',
 'design':'reports/v6-beta7-design-acceptance.json',
 'hierarchy':'reports/v6-beta7-profile-hierarchy-acceptance.json',
 'profile':'reports/v6-beta7-profile-acceptance.json',
 'interaction':'reports/v6-beta7-interaction-acceptance.json',
 'analysis':'reports/v6-beta7-analysis-continuity.json',
 'groups':'reports/v6-beta7-nutrient-group-acceptance.json',
 'media':'reports/v6-beta7-gemini-media-acceptance.json',
 'runtime':'reports/v6-beta7-runtime-inventory.json',
 'protected':'reports/v6-beta7-protected-comparison.json',
 'utf8':'reports/v6-beta7-hf28-utf8.json',
 'gemini_contract':'reports/v6-beta7-hf28-gemini-contract.json',
 'media_mock':'reports/v6-beta7-hf28-media-mock-e2e.json',
 'credentials':'reports/v6-beta7-hf28-credential-loading.json',
 'http':'reports/v6-beta7-http-contract.json',
}
def read_json(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def add(rows,name,ok,detail=None):rows.append({'name':name,'ok':bool(ok),'detail':detail})
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta7-release-audit.json');ap.add_argument('--syntax-out',default='reports/v6-beta7-syntax-checks.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve()
 rows=[]
 for key,rel in REPORTS.items():
  exists=(ROOT/rel).is_file();add(rows,f'report present: {key}',exists,rel)
  if exists:
   d=read_json(rel);add(rows,f'report passes: {key}',d.get('ok') is True,{'assertions':d.get('assertions'),'version':d.get('release_version')})
 for rel in ('index.html','index-v5.3.210.html'):
  p=ROOT/rel;t=p.read_text(encoding='utf-8')
  add(rows,rel+' beta7 metadata',VERSION in t and 'data-ui-version="6.0.0-beta7"' in t and "APP_VERSION = '6.0.0-beta7'" in t)
  add(rows,rel+' beta7 runtime boot',all(x in t for x in ('runtime-manifest-v6.0.0-beta7.js','00-runtime-selector-v6.0.0-beta7.js')))
  order=[t.find('design-refinement-v6.0.0-beta6.css'),t.find('navigation-recovery-v6.0.0-beta7.css'),t.find('ivory-brass-print-v6.css')]
  add(rows,rel+' navigation recovery CSS after design layer and before print',all(x>=0 for x in order) and order==sorted(order),order)
  add(rows,rel+' navigation recovery JS loaded','navigation-recovery-v6.0.0-beta7.js' in t)
  add(rows,rel+' profile skip link first required field','href="#needs_sex"' in t)
  add(rows,rel+' canonical branding','Калькулятор рациона Сергея Веснина' in t)
 add(rows,'index copies byte-identical',(ROOT/'index.html').read_bytes()==(ROOT/'index-v5.3.210.html').read_bytes())
 cfg=read_json('config/runtime-assets.v6.0.0-beta7.json');ui=cfg.get('ui_v6',{});ab=cfg.get('asset_bytes',{})
 add(rows,'runtime config release coherent',cfg.get('release_version')==VERSION,cfg.get('release_version'))
 add(rows,'navigation recovery contract recorded',ui.get('navigation_recovery_contract')=='NutritionNavigationRecoveryV1' and ui.get('navigation_recovery_release')=='beta7',ui)
 add(rows,'three themes permanently available',ui.get('theme_selector_always_reachable') is True and ui.get('theme_count')==3)
 add(rows,'profile route is primary navigation',ui.get('profile_route_primary_navigation') is True)
 add(rows,'mobile canvas enabled and sequential',ui.get('canvas_mobile_enabled') is True and ui.get('canvas_mobile_behavior')=='continuous-sequential-page')
 add(rows,'desktop Ivory canvas remains spatial',ui.get('canvas_desktop_ivory_behavior')=='spatial-workspace')
 add(rows,'theme and mode independent',ui.get('presentation_modes_independent_from_themes') is True)
 add(rows,'navigation JS byte metadata current',ab.get('navigation_recovery_js')==(ROOT/'assets/js/navigation-recovery-v6.0.0-beta7.js').stat().st_size,ab.get('navigation_recovery_js'))
 add(rows,'navigation CSS byte metadata current',ab.get('navigation_recovery_css')==(ROOT/'assets/css/navigation-recovery-v6.0.0-beta7.css').stat().st_size,ab.get('navigation_recovery_css'))
 pkg=read_json('package.json');lock=read_json('package-lock.json')
 add(rows,'package versions beta7',pkg.get('version')=='6.0.0-beta.7' and lock.get('version')=='6.0.0-beta.7' and lock.get('packages',{}).get('',{}).get('version')=='6.0.0-beta.7')
 add(rows,'package describes navigation recovery','three-theme' in str(pkg.get('description','')).lower() and 'sections/canvas' in str(pkg.get('description','')).lower())
 js=(ROOT/'assets/js/navigation-recovery-v6.0.0-beta7.js').read_text(encoding='utf-8');css=(ROOT/'assets/css/navigation-recovery-v6.0.0-beta7.css').read_text(encoding='utf-8')
 add(rows,'controller release coherent',"var VERSION='"+VERSION+"'" in js)
 add(rows,'persistent theme control implemented','primaryDisplayControls' in js and 'data-theme-value' in js)
 add(rows,'permanent needs route implemented','data-primary-needs-route' in js and "link.href='#profile'" in js)
 add(rows,'mobile canvas no longer disabled',"setMode('long')" in js and 'disabled=true' not in js)
 add(rows,'view preference persisted','nutritionCalculator.primaryView.v2' in js)
 add(rows,'mobile profile navigation restored','data-navigation-route="profile"] #navigationShell{display:grid!important}' in css)
 add(rows,'mobile controls preserve 44px targets','min-height:44px!important' in css)
 add(rows,'compact mobile composition preserves first field','grid-template-columns:minmax(0,3fr) minmax(0,2fr)' in css and 'navigation-route="profile"] #navigationShellContext' in css)
 protected=read_json(REPORTS['protected']);add(rows,'protected core byte-identical',protected.get('ok') and protected.get('unchanged_files')==184 and not protected.get('changed'),protected)
 add(rows,'product count retained',protected.get('product_count',{}).get('current')==1105,protected.get('product_count'))
 runtime=read_json(REPORTS['runtime']);add(rows,'runtime closure complete',runtime.get('ok') and not runtime.get('missing') and runtime.get('file_count')==319,{'files':runtime.get('file_count'),'missing':runtime.get('missing')})
 budget=read_json('reports/v6-beta7-ui-budget.json');add(rows,'incremental UI budget passes',budget.get('ok') and budget.get('incremental_ui_bytes')==((ROOT/'assets/js/navigation-recovery-v6.0.0-beta7.js').stat().st_size+(ROOT/'assets/css/navigation-recovery-v6.0.0-beta7.css').stat().st_size),budget)
 syntax=[]
 js_files=['assets/js/navigation-recovery-v6.0.0-beta7.js','assets/js/00-runtime-bootstrap-v6.0.0-beta7.js','assets/js/00-runtime-selector-v6.0.0-beta7.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta7.legacy.js','assets/runtime/runtime-manifest-v6.0.0-beta7.js']
 for rel in js_files:
  r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True);syntax.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for p in sorted((ROOT/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for rel in ['config/runtime-assets.v6.0.0-beta7.json','package.json','package-lock.json']:
  try:json.loads((ROOT/rel).read_text(encoding='utf-8'));ok=True;detail=''
  except Exception as e:ok=False;detail=str(e)
  syntax.append({'path':rel,'ok':ok,'detail':detail})
 syn={'ok':all(x['ok'] for x in syntax),'release_version':VERSION,'assertions':len(syntax),'results':syntax};sp=ROOT/a.syntax_out;sp.parent.mkdir(parents=True,exist_ok=True);sp.write_text(json.dumps(syn,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');add(rows,'runtime-facing syntax valid',syn['ok'],{'assertions':len(syntax)})
 secret=ROOT/'api/gemini-secret.php';add(rows,'protected Gemini secret present',secret.is_file())
 if secret.is_file():
  entries={k.decode():v for k,v in SECRET_ENTRY_RX.findall(secret.read_bytes())};keys=list(entries.values());add(rows,'primary and backup server keys present',set(entries)=={'primary','backup'} and len(set(keys))==2 and all(len(x)>=30 for x in keys),{'count':len(set(keys)),'slots':sorted(entries)});add(rows,'secret mode 0600',(secret.stat().st_mode&0o777)==0o600,oct(secret.stat().st_mode&0o777))
 leaks=[]
 for target in ('assets','index.html','index-v5.3.210.html'):
  p=ROOT/target;files=[p] if p.is_file() else [q for q in p.rglob('*') if q.is_file()]
  for q in files:
   if SECRET_RX.search(q.read_bytes()):leaks.append(str(q.relative_to(ROOT)))
 add(rows,'no Gemini key in client payload',not leaks,leaks)
 caches=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and (p.suffix=='.pyc' or '__pycache__' in p.parts)]
 add(rows,'no Python bytecode cache',not caches,caches)
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'Functional recovery audit: permanent three-theme selector, working Sections/Canvas modes, permanent profile/needs access, preserved analytics and Gemini.'}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
