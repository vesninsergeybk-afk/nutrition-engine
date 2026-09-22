#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta2-nutrient-group-overview'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
REPORTS={
 'group_overview':'reports/v6-beta2-nutrient-group-acceptance.json',
 'profile':'reports/v6-beta2-profile-acceptance.json',
 'analysis':'reports/v6-beta2-analysis-continuity.json',
 'ui':'reports/v6-beta2-ivory-acceptance.json',
 'extended':'reports/v6-beta2-ivory-extended-acceptance.json',
 'media':'reports/v6-beta2-gemini-media-acceptance.json',
 'runtime':'reports/v6-beta2-runtime-inventory.json',
 'protected':'reports/v6-beta2-protected-comparison.json',
 'generator':'reports/v6-beta2-generator-idempotency.json',
 'budget':'reports/v6-beta2-ui-budget.json',
 'extracted_hosting':'reports/v6-beta2-extracted-hosting-acceptance.json',
 'http':'reports/hf28-http-contract.json',
 'secret_http':'reports/hf28-packaged-secret-http.json',
}
def add(rows,name,ok,detail=None):
 r={'name':name,'ok':bool(ok)}
 if detail is not None:r['detail']=detail
 rows.append(r)
def read_json(p):return json.loads(p.read_text(encoding='utf-8'))
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta2-release-audit.json');ap.add_argument('--syntax-out',default='reports/v6-beta2-syntax-checks.json');ns=ap.parse_args();ROOT=Path(ns.app_root).resolve();rows=[]
 for name,rel in REPORTS.items():
  p=ROOT/rel;data=None;ok=p.is_file()
  if ok:
   try:data=read_json(p);ok=data.get('ok') is True
   except Exception as e:data={'error':str(e)};ok=False
  add(rows,'required report: '+name,ok,{'path':rel,'assertions':data.get('assertions') if isinstance(data,dict) else None})
 for rel in ('index.html','index-v5.3.210.html'):
  t=(ROOT/rel).read_text(encoding='utf-8');add(rows,rel+' release version',VERSION in t);add(rows,rel+' beta2 selector','00-runtime-selector-v6.0.0-beta2.js' in t)
 for rel in ('config/runtime-assets.v6.0.0-beta2.json','assets/runtime/runtime-manifest-v6.0.0-beta2.js','assets/runtime/critical-shell-v6.0.0-beta2.js','assets/runtime/critical-shell-v6.0.0-beta2.legacy.js','assets/js/00-runtime-bootstrap-v6.0.0-beta2.js','assets/js/00-runtime-selector-v6.0.0-beta2.js'):
  add(rows,'runtime file present: '+rel,(ROOT/rel).is_file())
 vm=(ROOT/'assets/js/ivory-brass-view-model-v6.js').read_text(encoding='utf-8')
 charts=(ROOT/'assets/js/ivory-brass-charts-v6.js').read_text(encoding='utf-8')
 shell=(ROOT/'assets/js/ivory-brass-shell-v6.js').read_text(encoding='utf-8')
 css=(ROOT/'assets/css/theme-ivory-brass-v6.css').read_text(encoding='utf-8')+(ROOT/'assets/css/ivory-brass-responsive-v6.css').read_text(encoding='utf-8')
 add(rows,'overview contract declared','NutrientGroupOverview.v1' in vm and 'navigation-summary' in vm)
 add(rows,'five transparent statuses',all(x in vm and x in charts and x in shell for x in ('target','below','review','above','unknown')))
 add(rows,'canonical detailed table source','NutritionAnalysisWorkspaceHF7' in vm)
 add(rows,'no pseudo balance score',all(x not in charts+shell for x in ('БАЛАНС','Баланс ')))
 add(rows,'not presented as final assessment','не новая итоговая оценка рациона' in shell and 'не является общей оценкой рациона' in charts)
 add(rows,'group navigation to canonical table',all(x in shell for x in ('openNutrientGroup','analysis/nutrients','data-nutrient-filter','data-nutrient-group','workspaceNutrientsPanel')))
 add(rows,'keyboard-accessible radial navigation',all(x in charts+shell for x in ('role="button"','tabindex="0"','e.key===\'Enter\'','e.key===\' \'')))
 add(rows,'mobile text-first overview',all(x in shell+css for x in ('ivoryMobileGroupOverview','ivory-mobile-group-overview','is-mobile')))
 add(rows,'explicit methodical distinction',all(x in shell for x in ('Целевой диапазон','Ниже ориентира','Требует проверки','Выше предела','Не оценивается')))
 index=(ROOT/'index.html').read_text(encoding='utf-8')
 add(rows,'full analytics remain in document',all(('id="'+x+'"') in index for x in ('totalsSection','heiPanel','heiTableBody','dietAnalysisProfilePanel','strictHarvardPlateDetails','globalActions')))
 add(rows,'profile continuity assets remain',all(x in index for x in ('profile-persistence-v6.0.0-beta1.js','profile-continuity-v6.css','analysis-feature-continuity-v6.0.0-beta1.js')))
 add(rows,'three themes remain',all(x in index for x in ('modern','retro-2bit','ivory-brass')))
 cfg=read_json(ROOT/'config/runtime-assets.v6.0.0-beta2.json')
 add(rows,'runtime metadata says overview is not score',cfg.get('ui_v6',{}).get('nutrient_group_overview_not_a_score') is True,cfg.get('ui_v6',{}))
 add(rows,'HF29 and HF30 boundaries recorded',all(x in json.dumps(cfg,ensure_ascii=False).lower() for x in ('hotfix29','hotfix30')))
 secret=ROOT/'api/gemini-secret.php';add(rows,'server Gemini secret present',secret.is_file())
 if secret.is_file():
  keys=SECRET_RX.findall(secret.read_bytes());add(rows,'primary and backup Gemini keys present',len(keys)>=2 and len(set(keys))>=2,{'key_count':len(keys)});add(rows,'secret filesystem mode 0600',(secret.stat().st_mode&0o777)==0o600,oct(secret.stat().st_mode&0o777))
 leaks=[]
 for folder in ('assets','index.html','index-v5.3.210.html'):
  p=ROOT/folder;files=[p] if p.is_file() else [x for x in p.rglob('*') if x.is_file()]
  for q in files:
   if SECRET_RX.search(q.read_bytes()):leaks.append(str(q.relative_to(ROOT)))
 add(rows,'no Gemini key in client payload',not leaks,leaks)
 syntax=[]
 js_files=[
 'assets/js/ivory-brass-view-model-v6.js','assets/js/ivory-brass-charts-v6.js','assets/js/ivory-brass-shell-v6.js',
 'assets/runtime/runtime-manifest-v6.0.0-beta2.js','assets/runtime/critical-shell-v6.0.0-beta2.js','assets/runtime/critical-shell-v6.0.0-beta2.legacy.js',
 'assets/js/00-runtime-bootstrap-v6.0.0-beta2.js','assets/js/00-runtime-selector-v6.0.0-beta2.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta2.legacy.js']
 for rel in js_files:
  r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True);syntax.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for p in sorted((ROOT/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 syntax_result={'ok':all(x['ok'] for x in syntax),'release_version':VERSION,'assertions':len(syntax),'results':syntax}
 sout=ROOT/ns.syntax_out;sout.parent.mkdir(parents=True,exist_ok=True);sout.write_text(json.dumps(syntax_result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');add(rows,'changed/generated JS and PHP syntax',syntax_result['ok'],{'assertions':len(syntax)})
 caches=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and (p.suffix=='.pyc' or '__pycache__' in p.parts)]
 add(rows,'no generated bytecode cache',not caches,caches)
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'transparent nutrient-group navigation summary, full analytics preservation, themes, profile, Gemini, runtime and future HF29/HF30 boundaries'}
 out=ROOT/ns.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
