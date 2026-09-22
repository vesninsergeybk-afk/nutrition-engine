#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta6-design-refinement'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z_-]{20,})')
SECRET_ENTRY_RX=re.compile(rb"'(primary|backup)'\s*=>\s*'([^']+)'")
REPORTS={
 'design':'reports/v6-beta6-design-acceptance.json',
 'hierarchy':'reports/v6-beta6-profile-hierarchy-acceptance.json',
 'profile':'reports/v6-beta6-profile-acceptance.json',
 'interaction':'reports/v6-beta6-interaction-acceptance.json',
 'analysis':'reports/v6-beta6-analysis-continuity.json',
 'groups':'reports/v6-beta6-nutrient-group-acceptance.json',
 'media':'reports/v6-beta6-gemini-media-acceptance.json',
 'runtime':'reports/v6-beta6-runtime-inventory.json',
 'protected':'reports/v6-beta6-protected-comparison.json',
}
def read_json(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def add(rows,name,ok,detail=None): rows.append({'name':name,'ok':bool(ok),'detail':detail})
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta6-release-audit.json');ap.add_argument('--syntax-out',default='reports/v6-beta6-syntax-checks.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve()
 rows=[]
 for key,rel in REPORTS.items():
  exists=(ROOT/rel).is_file();add(rows,f'report present: {key}',exists,rel)
  if exists:
   d=read_json(rel);add(rows,f'report passes: {key}',d.get('ok') is True,{'assertions':d.get('assertions'),'version':d.get('release_version')})
 for rel in ('index.html','index-v5.3.210.html'):
  p=ROOT/rel;t=p.read_text(encoding='utf-8')
  add(rows,rel+' beta6 release metadata',VERSION in t and 'data-ui-version="6.0.0-beta6"' in t and "APP_VERSION = '6.0.0-beta6'" in t)
  add(rows,rel+' beta6 runtime boot',all(x in t for x in ('runtime-manifest-v6.0.0-beta6.js','00-runtime-selector-v6.0.0-beta6.js')))
  order=[t.find('theme-ivory-brass-v6.css'),t.find('ivory-brass-responsive-v6.css'),t.find('profile-continuity-v6.css'),t.find('profile-hierarchy-v6.0.0-beta5.css'),t.find('interaction-states-v6.0.0-beta3.css'),t.find('design-refinement-v6.0.0-beta6.css'),t.find('ivory-brass-print-v6.css')]
  add(rows,rel+' design CSS loaded last before print',all(x>=0 for x in order) and order==sorted(order),order)
  add(rows,rel+' canonical branding','Калькулятор рациона Сергея Веснина' in t)
  add(rows,rel+' profile skip link first required field','href="#needs_sex"' in t)
 add(rows,'index copies byte-identical',(ROOT/'index.html').read_bytes()==(ROOT/'index-v5.3.210.html').read_bytes())
 cfg=read_json('config/runtime-assets.v6.0.0-beta6.json');ui=cfg.get('ui_v6',{});ab=cfg.get('asset_bytes',{})
 add(rows,'runtime config release coherent',cfg.get('release_version')==VERSION,cfg.get('release_version'))
 add(rows,'design refinement contract recorded',ui.get('design_refinement_contract')=='NutritionDesignRefinementV1' and ui.get('design_refinement_release')=='beta6',ui.get('design_refinement_scope'))
 add(rows,'design CSS byte budget current',ab.get('design_refinement_css')==(ROOT/'assets/css/design-refinement-v6.0.0-beta6.css').stat().st_size,ab.get('design_refinement_css'))
 add(rows,'Ivory shell byte metadata current',ab.get('ivory_shell_js')==(ROOT/'assets/js/ivory-brass-shell-v6.js').stat().st_size,ab.get('ivory_shell_js'))
 pkg=read_json('package.json');lock=read_json('package-lock.json')
 add(rows,'package versions beta6',pkg.get('version')=='6.0.0-beta.6' and lock.get('version')=='6.0.0-beta.6' and lock.get('packages',{}).get('',{}).get('version')=='6.0.0-beta.6')
 add(rows,'package describes design refinement','design and usability refinement' in str(pkg.get('description','')).lower())
 shell=(ROOT/'assets/js/ivory-brass-shell-v6.js').read_text(encoding='utf-8');css=(ROOT/'assets/css/design-refinement-v6.0.0-beta6.css').read_text(encoding='utf-8')
 add(rows,'shell release coherent',"var VERSION='"+VERSION+"'" in shell)
 add(rows,'hero profile-first action implemented','id="ivoryHeroPrimary"' in shell and "data-ivory-action=\"profile\"" in shell and 'needs_sex' in shell)
 add(rows,'empty nutrient overview implemented','ivoryGroupEmptyState' in shell and 'data-ivory-group-state' in shell)
 add(rows,'priority duplication suppressed before current profile','ivory-priority-card' in shell and ':not([data-profile-calculation-state="current"]) .ivory-priority-card' in css)
 add(rows,'desktop dock non-overlay rule','position:static' in css and '.ivory-quick-dock' in css)
 add(rows,'desktop entry methods readable','repeat(4,minmax(0,1fr))' in css and 'white-space:normal!important' in css)
 add(rows,'mobile duplicate ration summary hidden','workspaceRationInlineSummary{display:none!important}' in css and '#ivoryMobileSummary{display:none!important}' in css)
 add(rows,'mobile search-first order','search-main-grid{order:2}' in css and '#workspaceRationEntryMethods{order:4' in css)
 add(rows,'mobile navigation compact','max-height:76px!important' in css and '.navigation-shell__brand' in css and '#ivoryNavTheme{display:none!important}' in css)
 add(rows,'mobile profile title de-duplicated','#needs>.row:first-of-type h1' in css and '#profileContinuityMissing' in css)
 protected=read_json(REPORTS['protected']);add(rows,'protected core byte-identical',protected.get('ok') and protected.get('unchanged_files')==184 and not protected.get('changed'),protected)
 add(rows,'product count retained',protected.get('product_count',{}).get('current')==1105,protected.get('product_count'))
 runtime=read_json(REPORTS['runtime']);add(rows,'runtime closure complete',runtime.get('ok') and not runtime.get('missing') and runtime.get('file_count')==317,{'files':runtime.get('file_count'),'missing':runtime.get('missing')})
 # Syntax checks for changed/runtime-facing files plus all PHP endpoints.
 syntax=[]
 js_files=['assets/js/ivory-brass-shell-v6.js','assets/js/00-runtime-bootstrap-v6.0.0-beta6.js','assets/js/00-runtime-selector-v6.0.0-beta6.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta6.legacy.js','assets/runtime/runtime-manifest-v6.0.0-beta6.js']
 for rel in js_files:
  r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True);syntax.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for p in sorted((ROOT/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for rel in ['config/runtime-assets.v6.0.0-beta6.json','package.json','package-lock.json']:
  try:json.loads((ROOT/rel).read_text(encoding='utf-8'));ok=True;detail=''
  except Exception as e:ok=False;detail=str(e)
  syntax.append({'path':rel,'ok':ok,'detail':detail})
 syn={'ok':all(x['ok'] for x in syntax),'release_version':VERSION,'assertions':len(syntax),'results':syntax};sp=ROOT/a.syntax_out;sp.parent.mkdir(parents=True,exist_ok=True);sp.write_text(json.dumps(syn,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 add(rows,'runtime-facing syntax valid',syn['ok'],{'assertions':len(syntax)})
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
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'Cross-stage design and usability refinement audit; formulas, data and analytics protected.'}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
