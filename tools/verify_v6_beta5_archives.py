#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,os,re,shutil,subprocess,sys,time,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v6.0.0-beta5-cross-stage-hardening'
HOSTING_NAME='NUTRITION_CALCULATOR_V6_0_0_BETA5_CROSS_STAGE_HARDENING_HOSTING_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V6_0_0_BETA5_CROSS_STAGE_HARDENING_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET='api/gemini-secret.php'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
def sha(data):return hashlib.sha256(data).hexdigest()
def add(rows,name,ok,detail=None):
 r={'name':name,'ok':bool(ok)}
 if detail is not None:r['detail']=detail
 rows.append(r)
def check_zip(path,kind,rows):
 with zipfile.ZipFile(path) as z:
  names=set(z.namelist());add(rows,path.name+': CRC',z.testzip() is None);add(rows,path.name+': manifest','release-manifest.json' in names);add(rows,path.name+': SBOM','release-sbom.spdx.json' in names)
  m=json.loads(z.read('release-manifest.json'));a=m.get('architecture',{});ac=m.get('acceptance',{})
  add(rows,path.name+': version',m.get('release_version')==VERSION,m.get('release_version'));add(rows,path.name+': kind',m.get('artifact_kind')==kind,m.get('artifact_kind'))
  add(rows,path.name+': HOTFIX30 complete',a.get('profile_hierarchy_release')=='HOTFIX30 completed and re-audited');add(rows,path.name+': hierarchy contract',a.get('profile_hierarchy_contract')=='NutritionProfileHierarchyV2')
  add(rows,path.name+': five required fields',a.get('profile_required_fields')==['needs_sex','needs_age','needs_h','needs_w','needs_activity'],a.get('profile_required_fields'))
  add(rows,path.name+': stable profile DOM',a.get('stable_profile_dom_after_startup') is True);add(rows,path.name+': HOTFIX29 retained',a.get('interaction_state_release')=='HOTFIX29 completed')
  add(rows,path.name+': all themes/layouts',a.get('themes')==['modern','retro-2bit','ivory-brass'] and a.get('presentation_modes')==['sections','canvas'])
  add(rows,path.name+': protected core',a.get('protected_files_byte_identical')==184,a.get('protected_files_byte_identical'));add(rows,path.name+': products',a.get('product_count')==1105,a.get('product_count'))
  add(rows,path.name+': runtime count',a.get('runtime_files')==316,a.get('runtime_files'));add(rows,path.name+': embedded extracted 49/49',ac.get('extracted_hosting_browser',{}).get('ok') is True and ac.get('extracted_hosting_browser',{}).get('assertions')==49,ac.get('extracted_hosting_browser'))
  errors=[]
  for item in m.get('files',[]):
   rel=item['path']
   if rel not in names:errors.append('missing '+rel);continue
   data=z.read(rel)
   if len(data)!=item['size'] or sha(data)!=item['sha256']:errors.append('hash '+rel)
  add(rows,path.name+': payload hashes',not errors,errors[:10]);add(rows,path.name+': manifest count',len(m.get('files',[]))==len(names)-2,{'manifest':len(m.get('files',[])),'zip':len(names)-2})
  add(rows,path.name+': secret present',SECRET in names)
  if SECRET in names:
   data=z.read(SECRET);keys=SECRET_RX.findall(data);md=(z.getinfo(SECRET).external_attr>>16)&0o777
   add(rows,path.name+': primary and backup keys',len(keys)>=2 and len(set(keys))>=2,{'key_count':len(keys)});add(rows,path.name+': secret 0600',md==0o600,oct(md));add(rows,path.name+': direct guard',all(x in data for x in (b'SCRIPT_FILENAME',b'http_response_code(404)',b'exit;')))
  leaks=[n for n in names if n!=SECRET and not n.endswith('/') and SECRET_RX.search(z.read(n))]
  add(rows,path.name+': keys isolated',not leaks,leaks)
  required=('index.html','config/runtime-assets.v6.0.0-beta5.json','assets/runtime/runtime-manifest-v6.0.0-beta5.js','assets/runtime/critical-shell-v6.0.0-beta5.js','assets/runtime/critical-shell-v6.0.0-beta5.legacy.js','assets/js/00-runtime-bootstrap-v6.0.0-beta5.js','assets/js/00-runtime-selector-v6.0.0-beta5.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta5.legacy.js','assets/css/profile-hierarchy-v6.0.0-beta5.css','assets/js/profile-hierarchy-v6.0.0-beta5.js','assets/js/profile-persistence-v6.0.0-beta5.js','assets/css/interaction-states-v6.0.0-beta3.css','assets/js/interaction-state-controller-v6.0.0-beta3.js','README_DEPLOY_V6_BETA5_RU.md')
  for rel in required:add(rows,path.name+': '+rel,rel in names)
def direct_secret(root,rows):
 port='18764';proc=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);body=OUT/'beta5-secret-body.tmp'
 try:
  time.sleep(.8);r=subprocess.run(['curl','-sS','-o',str(body),'-w','%{http_code}',f'http://127.0.0.1:{port}/api/gemini-secret.php'],capture_output=True,text=True,timeout=20);data=body.read_bytes() if body.exists() else b'';add(rows,'extracted hosting: secret empty 404',r.returncode==0 and r.stdout.strip()=='404' and data==b'',{'status':r.stdout.strip(),'bytes':len(data)})
 finally:
  body.unlink(missing_ok=True);proc.terminate()
  try:proc.wait(timeout=3)
  except subprocess.TimeoutExpired:proc.kill()
def main():
 global ROOT,OUT
 ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--out-dir',default=str(OUT));ap.add_argument('--extracted-report-dir',required=True);ap.add_argument('--json-out',default='reports/v6-beta5-archive-verification.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve();OUT=Path(a.out_dir).resolve();rd=Path(a.extracted_report_dir).resolve();hosting=OUT/HOSTING_NAME;full=OUT/FULL_NAME;rows=[]
 add(rows,'hosting exists',hosting.is_file());add(rows,'full exists',full.is_file())
 if not hosting.is_file() or not full.is_file():raise SystemExit(1)
 check_zip(hosting,'hosting-private',rows);check_zip(full,'full-private-audited',rows)
 verify=OUT/'v6_beta5_final_archive_verify';shutil.rmtree(verify,ignore_errors=True);verify.mkdir(parents=True)
 with zipfile.ZipFile(hosting) as z:z.extractall(verify)
 direct_secret(verify,rows)
 for rel in ('assets/js/profile-hierarchy-v6.0.0-beta5.js','assets/js/profile-persistence-v6.0.0-beta5.js','assets/js/interaction-state-controller-v6.0.0-beta3.js','assets/js/ivory-brass-search-compact-v6.js','assets/js/ivory-brass-view-model-v6.js','assets/runtime/runtime-manifest-v6.0.0-beta5.js','assets/runtime/critical-shell-v6.0.0-beta5.js','assets/runtime/critical-shell-v6.0.0-beta5.legacy.js','assets/js/00-runtime-bootstrap-v6.0.0-beta5.js','assets/js/00-runtime-selector-v6.0.0-beta5.js'):
  r=subprocess.run(['node','--check',str(verify/rel)],capture_output=True,text=True);add(rows,'extracted syntax: '+rel,r.returncode==0,(r.stderr or r.stdout)[-300:])
 for rel in ('api/gemini.php','api/utf8-safe.php',SECRET):
  r=subprocess.run(['php','-l',str(verify/rel)],capture_output=True,text=True);add(rows,'extracted syntax: '+rel,r.returncode==0,(r.stderr or r.stdout)[-300:])
 inv=json.loads((ROOT/'reports/v6-beta5-runtime-inventory.json').read_text());names=set(zipfile.ZipFile(hosting).namelist());missing=[x for x in inv.get('files',[]) if x not in names];add(rows,'hosting complete runtime closure',inv.get('ok') is True and inv.get('file_count')==316 and not missing,{'file_count':inv.get('file_count'),'missing':missing[:10]})
 exact=rd/'extracted-hosting-acceptance.json';edata=json.loads(exact.read_text()) if exact.is_file() else {};hsha=sha(hosting.read_bytes());add(rows,'exact final extracted 49/49 and hash bound',edata.get('ok') is True and edata.get('release_version')==VERSION and edata.get('assertions')==49 and edata.get('archive_sha256')==hsha,edata)
 for suite,fn,count in [('profile_hierarchy','profile-hierarchy.json',6),('profile','profile.json',4),('interaction','interaction.json',8),('analysis','analysis.json',6),('ivory','ivory.json',6),('ivory_extended','extended.json',7),('nutrient_group','groups.json',5),('gemini_media','media.json',7)]:
  p=rd/fn;d=json.loads(p.read_text()) if p.is_file() else {};add(rows,'exact suite: '+suite,d.get('ok') is True and d.get('release_version')==VERSION and d.get('assertions')==count,{'assertions':d.get('assertions')})
 env=dict(os.environ);env['PYTHONDONTWRITEBYTECODE']='1';repro=OUT/'v6_beta5_repro';shutil.rmtree(repro,ignore_errors=True);repro.mkdir(parents=True);r=subprocess.run([sys.executable,str(ROOT/'tools/build_v6_beta5.py'),'--out-dir',str(repro)],cwd=ROOT,env=env,capture_output=True,text=True,timeout=500);add(rows,'rebuild command',r.returncode==0,(r.stderr or r.stdout)[-500:])
 if r.returncode==0:
  for orig in (hosting,full):
   reb=repro/orig.name;add(rows,'byte-identical rebuild: '+orig.name,reb.is_file() and reb.read_bytes()==orig.read_bytes(),{'sha256':sha(reb.read_bytes()) if reb.is_file() else None})
 result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'artifacts':[{'path':str(p),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size} for p in (hosting,full)],'exact_final_extracted_acceptance':edata}
 out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
