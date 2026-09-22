#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta1-profile-continuity'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
REPORTS={
 'profile':'reports/v6-beta1-profile-acceptance.json','analysis':'reports/v6-beta1-analysis-continuity.json','extracted':'reports/v6-beta1-extracted-hosting-acceptance.json',
 'ui':'reports/v6_ivory_acceptance.json','extended':'reports/v6_ivory_extended_acceptance.json','media':'reports/v6-gemini-media-acceptance.json',
 'protected':'reports/v6-beta1-protected-comparison.json','generator':'reports/v6-beta1-generator-idempotency.json','budget':'reports/v6-beta1-ui-budget.json',
 'runtime':'reports/v6-runtime-inventory.json','http':'reports/hf28-http-contract.json','secret_http':'reports/hf28-packaged-secret-http.json'
}
def add(rows,name,ok,detail=None):
 r={'name':name,'ok':bool(ok)}
 if detail is not None:r['detail']=detail
 rows.append(r)
def read(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta1-release-audit.json');ap.add_argument('--syntax-out',default='reports/v6-beta1-syntax-checks.json');ns=ap.parse_args();ROOT=Path(ns.app_root).resolve();rows=[]
 for name,rel in REPORTS.items():
  p=ROOT/rel;ok=p.is_file();data=None
  if ok:
   try:data=read(rel);ok=data.get('ok') is True
   except Exception as e:data={'error':str(e)};ok=False
  add(rows,'required report: '+name,ok,{'path':rel,'assertions':data.get('assertions') if isinstance(data,dict) else None})
 for rel in ('index.html','index-v5.3.210.html'):
  t=(ROOT/rel).read_text(encoding='utf-8');add(rows,rel+' release version',VERSION in t);add(rows,rel+' profile-first assets',all(x in t for x in ('profile-persistence-v6.0.0-beta1.js','profile-continuity-v6.css','analysis-feature-continuity-v6.0.0-beta1.js')))
 for rel in ('config/runtime-assets.v6.0.0-beta1.json','assets/runtime/runtime-manifest-v6.0.0-beta1.js','assets/runtime/critical-shell-v6.0.0-beta1.js','assets/runtime/critical-shell-v6.0.0-beta1.legacy.js'):
  add(rows,'runtime file present: '+rel,(ROOT/rel).is_file())
 ptext=(ROOT/'assets/js/profile-persistence-v6.0.0-beta1.js').read_text(encoding='utf-8')
 for name,tokens in {
  'versioned profile storage':['nutritionCalculator.profile.v1','schema:SCHEMA'],
  'draft versus applied protection':['appliedSignature','canRestoreApplied','lastPayload.applied=false'],
  'startup hydration lock':['startupHydrating','reconcileStoredFields'],
  'conscious first-run choices':['Выберите пол','Выберите уровень активности'],
  'profile user controls':['Запоминать данные на этом устройстве','Удалить сохранённый профиль'],
  'profile-to-ration action':['Рассчитать и перейти к рациону']}.items():add(rows,name,all(x in ptext for x in tokens))
 ftext=(ROOT/'assets/js/analysis-feature-continuity-v6.0.0-beta1.js').read_text(encoding='utf-8')
 add(rows,'analysis continuity covers full stack',all(x in ftext for x in ('totalsSection','heiPanel','dietAnalysisProfilePanel','strictHarvardPlateDetails','globalActions','NutritionFeatureContinuityV1')))
 index=(ROOT/'index.html').read_text(encoding='utf-8')
 add(rows,'canonical analytics still in document',all(('id="'+x+'"') in index for x in ('totalsSection','heiPanel','heiTableBody','dietAnalysisProfilePanel','strictHarvardPlateDetails','globalActions')))
 add(rows,'three themes remain',all(x in index for x in ('modern','retro-2bit','ivory-brass')))
 secret=ROOT/'api/gemini-secret.php';add(rows,'server Gemini secret present',secret.is_file())
 if secret.is_file():
  keys=SECRET_RX.findall(secret.read_bytes());add(rows,'primary and backup Gemini keys present',len(keys)>=2 and len(set(keys))>=2,{'key_count':len(keys)});add(rows,'secret filesystem mode 0600',(secret.stat().st_mode&0o777)==0o600,oct(secret.stat().st_mode&0o777))
 leaks=[]
 for folder in ('assets','index.html','index-v5.3.210.html'):
  p=ROOT/folder
  files=[p] if p.is_file() else [x for x in p.rglob('*') if x.is_file()]
  for q in files:
   if SECRET_RX.search(q.read_bytes()):leaks.append(str(q.relative_to(ROOT)))
 add(rows,'no Gemini key in client payload',not leaks,leaks)
 syntax=[]
 js_files=sorted(set([ROOT/'assets/js/profile-persistence-v6.0.0-beta1.js',ROOT/'assets/js/analysis-feature-continuity-v6.0.0-beta1.js',ROOT/'assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js',ROOT/'assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js',ROOT/'assets/js/ivory-brass-view-model-v6.js',ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta1.js',ROOT/'assets/runtime/critical-shell-v6.0.0-beta1.js',ROOT/'assets/runtime/critical-shell-v6.0.0-beta1.legacy.js',ROOT/'assets/js/00-runtime-bootstrap-v6.0.0-beta1.js',ROOT/'assets/js/00-runtime-selector-v6.0.0-beta1.js']))
 for p in js_files:
  r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for p in sorted((ROOT/'api').glob('*.php')):
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);syntax.append({'path':str(p.relative_to(ROOT)),'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 syntax_result={'ok':all(x['ok'] for x in syntax),'release_version':VERSION,'assertions':len(syntax),'results':syntax}
 sout=ROOT/ns.syntax_out;sout.parent.mkdir(parents=True,exist_ok=True);sout.write_text(json.dumps(syntax_result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');add(rows,'changed/generated JS and PHP syntax',syntax_result['ok'],{'assertions':len(syntax)})
 caches=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and (p.suffix=='.pyc' or '__pycache__' in p.parts)]
 add(rows,'no generated bytecode cache',not caches,caches)
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'profile-first continuity, analytics preservation, themes, Gemini, runtime and syntax'}
 out=ROOT/ns.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
