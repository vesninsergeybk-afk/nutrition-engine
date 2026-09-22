#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,os,re,shutil,subprocess,sys,time,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v6.0.0-beta1-profile-continuity'
HOSTING_NAME='NUTRITION_CALCULATOR_V6_0_0_BETA1_PROFILE_CONTINUITY_HOSTING_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V6_0_0_BETA1_PROFILE_CONTINUITY_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET='api/gemini-secret.php'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
def sha(data):return hashlib.sha256(data).hexdigest()
def add(rows,name,ok,detail=None):
 r={'name':name,'ok':bool(ok)}
 if detail is not None:r['detail']=detail
 rows.append(r)
def check_zip(path,kind,rows):
 with zipfile.ZipFile(path) as z:
  names=set(z.namelist());bad=z.testzip();add(rows,path.name+': CRC',bad is None,bad);add(rows,path.name+': manifest','release-manifest.json' in names);add(rows,path.name+': SBOM','release-sbom.spdx.json' in names)
  m=json.loads(z.read('release-manifest.json'));add(rows,path.name+': version',m.get('release_version')==VERSION,m.get('release_version'));add(rows,path.name+': kind',m.get('artifact_kind')==kind,m.get('artifact_kind'));add(rows,path.name+': profile contract',m.get('architecture',{}).get('profile_storage_contract','').startswith('NutritionProfilePersistenceV1'));add(rows,path.name+': analysis contract',m.get('architecture',{}).get('analysis_feature_contract')=='NutritionFeatureContinuityV1');add(rows,path.name+': 1105 products',m.get('architecture',{}).get('product_count')==1105)
  errs=[]
  for x in m.get('files',[]):
   rel=x['path']
   if rel not in names:errs.append('missing '+rel);continue
   data=z.read(rel)
   if len(data)!=x['size'] or sha(data)!=x['sha256']:errs.append('hash '+rel)
  add(rows,path.name+': payload hashes',not errs,errs[:10]);add(rows,path.name+': manifest count',len(m.get('files',[]))==len(names)-2,{'manifest':len(m.get('files',[])),'zip':len(names)-2})
  add(rows,path.name+': secret present',SECRET in names)
  if SECRET in names:
   sec=z.read(SECRET);keys=SECRET_RX.findall(sec);mode=(z.getinfo(SECRET).external_attr>>16)&0o777
   add(rows,path.name+': two packaged keys',len(keys)>=2 and len(set(keys))>=2,{'key_count':len(keys)});add(rows,path.name+': secret mode 0600',mode==0o600,oct(mode));add(rows,path.name+': direct execution guard',all(x in sec for x in (b'SCRIPT_FILENAME',b'http_response_code(404)',b'exit;')))
  leaks=[]
  for n in names:
   if n==SECRET or n.endswith('/'):continue
   if SECRET_RX.search(z.read(n)):leaks.append(n)
  add(rows,path.name+': keys isolated',not leaks,leaks)
  required=('index.html','config/runtime-assets.v6.0.0-beta1.json','assets/runtime/runtime-manifest-v6.0.0-beta1.js','assets/js/profile-persistence-v6.0.0-beta1.js','assets/js/analysis-feature-continuity-v6.0.0-beta1.js','assets/css/profile-continuity-v6.css','README_DEPLOY_V6_BETA1_RU.md')
  for rel in required:add(rows,path.name+': '+rel,rel in names)
def direct_secret(root,rows):
 port='18761';proc=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);body=OUT/'v6-beta1-secret-body.tmp'
 try:
  time.sleep(.7);r=subprocess.run(['curl','-sS','-o',str(body),'-w','%{http_code}',f'http://127.0.0.1:{port}/api/gemini-secret.php'],capture_output=True,text=True,timeout=20);data=body.read_bytes() if body.exists() else b'';add(rows,'extracted hosting: secret is empty 404',r.returncode==0 and r.stdout.strip()=='404' and data==b'',{'status':r.stdout.strip(),'bytes':len(data)})
 finally:
  body.unlink(missing_ok=True);proc.terminate()
  try:proc.wait(timeout=3)
  except subprocess.TimeoutExpired:proc.kill()
def run_browser(root,rows,env):
 tests=[
  ('profile',['tools/v6_beta1_profile_acceptance.py','--app-root',str(root),'--json-out',str(OUT/'v6-beta1-extracted-profile.json'),'--screenshots',str(OUT/'v6-beta1-extracted-screens')]),
  ('analysis',['tools/v6_beta1_analysis_continuity_acceptance.py','--app-root',str(root),'--json-out',str(OUT/'v6-beta1-extracted-analysis.json'),'--screenshots',str(OUT/'v6-beta1-extracted-screens')]),
  ('ui',['tools/v6_ivory_acceptance.py','--app-root',str(root),'--json-out',str(OUT/'v6-beta1-extracted-ui.json'),'--screenshots',str(OUT/'v6-beta1-extracted-screens')]),
  ('extended',['tools/v6_ivory_extended_acceptance.py','--app-root',str(root),'--json-out',str(OUT/'v6-beta1-extracted-extended.json')]),
  ('media',['tools/v6_gemini_media_acceptance.py','--app-root',str(root),'--json-out',str(OUT/'v6-beta1-extracted-media.json')])]
 for name,args in tests:
  cmd=[sys.executable,str(ROOT/args[0])]+args[1:];r=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True,timeout=300);detail=(r.stderr or r.stdout)[-700:];add(rows,'extracted browser: '+name,r.returncode==0,detail)
def main():
 global ROOT,OUT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--out-dir',default=str(OUT));ap.add_argument('--json-out',default='reports/v6-beta1-archive-verification.json');ns=ap.parse_args();ROOT=Path(ns.app_root).resolve();OUT=Path(ns.out_dir).resolve();hosting=OUT/HOSTING_NAME;full=OUT/FULL_NAME;rows=[];add(rows,'hosting exists',hosting.is_file());add(rows,'full exists',full.is_file());check_zip(hosting,'hosting-private',rows);check_zip(full,'full-private-audited',rows)
 verify=OUT/'v6_beta1_archive_verify';shutil.rmtree(verify,ignore_errors=True);verify.mkdir(parents=True)
 with zipfile.ZipFile(hosting) as z:z.extractall(verify)
 direct_secret(verify,rows)
 env=dict(os.environ);env['PYTHONDONTWRITEBYTECODE']='1'
 # Syntax in exact hosting payload.
 for rel in ('assets/js/profile-persistence-v6.0.0-beta1.js','assets/js/analysis-feature-continuity-v6.0.0-beta1.js','assets/runtime/runtime-manifest-v6.0.0-beta1.js','assets/runtime/critical-shell-v6.0.0-beta1.js','assets/runtime/critical-shell-v6.0.0-beta1.legacy.js'):
  r=subprocess.run(['node','--check',str(verify/rel)],capture_output=True,text=True);add(rows,'extracted syntax: '+rel,r.returncode==0,(r.stderr or r.stdout)[-300:])
 for rel in ('api/gemini.php','api/utf8-safe.php',SECRET):
  r=subprocess.run(['php','-l',str(verify/rel)],capture_output=True,text=True);add(rows,'extracted syntax: '+rel,r.returncode==0,(r.stderr or r.stdout)[-300:])
 inv_path=OUT/'v6-beta1-runtime-recheck.json';r=subprocess.run([sys.executable,str(ROOT/'tools/runtime_inventory.py'),'--json-out',str(inv_path)],cwd=ROOT,env=env,capture_output=True,text=True);add(rows,'runtime inventory command',r.returncode==0,(r.stderr or r.stdout)[-300:])
 if r.returncode==0:
  inv=json.loads(inv_path.read_text(encoding='utf-8'));names=set(zipfile.ZipFile(hosting).namelist());missing=[x for x in inv['files'] if x not in names];add(rows,'hosting contains complete runtime closure',not missing,{'file_count':inv['file_count'],'missing':missing[:10]})
 inv_path.unlink(missing_ok=True)
 extracted=ROOT/'reports/v6-beta1-extracted-hosting-acceptance.json'
 if extracted.is_file():
  ed=json.loads(extracted.read_text(encoding='utf-8'));add(rows,'extracted hosting browser acceptance',ed.get('ok') is True,{'assertions':ed.get('assertions'),'suites':[(x.get('suite'),x.get('ok')) for x in ed.get('suites',[])]})
 else:add(rows,'extracted hosting browser acceptance',False,'missing report')
 repro=OUT/'v6_beta1_repro';shutil.rmtree(repro,ignore_errors=True);repro.mkdir(parents=True);r=subprocess.run([sys.executable,str(ROOT/'tools/build_v6_beta1.py'),'--out-dir',str(repro)],cwd=ROOT,env=env,capture_output=True,text=True,timeout=300);add(rows,'rebuild command',r.returncode==0,(r.stderr or r.stdout)[-500:])
 if r.returncode==0:
  for orig in (hosting,full):
   rebuilt=repro/orig.name;add(rows,'byte-identical rebuild: '+orig.name,orig.read_bytes()==rebuilt.read_bytes(),{'sha256':sha(rebuilt.read_bytes())})
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'artifacts':[{'path':str(p),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size} for p in (hosting,full)]}
 out=ROOT/ns.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
