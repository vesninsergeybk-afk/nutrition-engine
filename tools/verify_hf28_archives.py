#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,re,shutil,subprocess,sys,time,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/mnt/data')
H=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX28_GEMINI_RELIABILITY_PRIVATE.zip'
F=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX28_GEMINI_RELIABILITY_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET='api/gemini-secret.php'; API_HT='api/.htaccess'
SECRET_RX=re.compile(rb'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
def sha(b):return hashlib.sha256(b).hexdigest()
def check_zip(p):
 with zipfile.ZipFile(p) as z:
  bad=z.testzip();m=json.loads(z.read('release-manifest.json'));names=set(z.namelist());errors=[]
  if SECRET not in names:errors.append('server credential file missing')
  else:
   sec=z.read(SECRET);keys=SECRET_RX.findall(sec);mode=(z.getinfo(SECRET).external_attr>>16)&0o777
   if len(keys)<2 or len(set(keys))!=len(keys):errors.append('primary/backup credential pool invalid')
   if not all(x in sec for x in [b'SCRIPT_FILENAME',b'http_response_code(404)',b'exit;']):errors.append('direct request guard missing')
   if mode!=0o600:errors.append('secret mode '+oct(mode))
  if API_HT not in names or b'Require all denied' not in z.read(API_HT) or b'gemini-secret\\.php' not in z.read(API_HT):errors.append('api deny rule missing')
  for name in names:
   if name.endswith('/') or name==SECRET:continue
   try:data=z.read(name)
   except Exception:continue
   if SECRET_RX.search(data):errors.append('credential leaked outside server secret: '+name)
  if bad:errors.append('CRC '+bad)
  for row in m['files']:
   if row['path'] not in names:errors.append('missing '+row['path']);continue
   data=z.read(row['path'])
   if len(data)!=row['size'] or sha(data)!=row['sha256']:errors.append('hash '+row['path'])
  if len(m['files'])!=len(names)-2:errors.append('file count')
  return {'path':str(p),'ok':not errors,'errors':errors,'payload_files':len(m['files']),'sha256':sha(p.read_bytes()),'server_keys_packaged':SECRET in names}
def direct_request_test(docroot:Path):
 port='18728';proc=subprocess.Popen(['php','-S','127.0.0.1:'+port,'-t',str(docroot)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  time.sleep(.5)
  r=subprocess.run(['curl','-sS','-o',str(OUT/'hf28-secret-direct-body.tmp'),'-w','%{http_code}','http://127.0.0.1:'+port+'/api/gemini-secret.php'],capture_output=True,text=True,timeout=15)
  body=(OUT/'hf28-secret-direct-body.tmp').read_bytes() if (OUT/'hf28-secret-direct-body.tmp').exists() else b''
  (OUT/'hf28-secret-direct-body.tmp').unlink(missing_ok=True)
  return {'path':'direct request to api/gemini-secret.php','ok':r.returncode==0 and r.stdout.strip()=='404' and SECRET_RX.search(body) is None and body==b'','detail':{'status':r.stdout.strip(),'body_bytes':len(body)}}
 finally:
  proc.terminate()
  try:proc.wait(timeout=3)
  except subprocess.TimeoutExpired:proc.kill()
def main():
 results=[check_zip(H),check_zip(F)]
 v=OUT/'hf28_archive_verify';shutil.rmtree(v,ignore_errors=True);v.mkdir()
 with zipfile.ZipFile(H) as z:z.extractall(v)
 required=['api/gemini.php','api/utf8-safe.php',SECRET,API_HT,'assets/js/00-runtime-bootstrap-v5.3.210-hf28.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf28.legacy.js','assets/js/00-runtime-selector-v5.3.210-hf28.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js','assets/runtime/critical-shell-v5.3.210-rc2-hf28.js','assets/runtime/critical-shell-v5.3.210-rc2-hf28.legacy.js']
 for rel in required:results.append({'path':'hosting '+rel,'ok':(v/rel).is_file()})
 sec=(v/SECRET).read_bytes() if (v/SECRET).is_file() else b''
 results.append({'path':'hosting contains existing primary and backup keys','ok':len(SECRET_RX.findall(sec))>=2})
 results.append(direct_request_test(v))
 for rel in [x for x in required if x.endswith('.js')]:
  r=subprocess.run(['node','--check',str(v/rel)],capture_output=True,text=True);results.append({'path':'syntax '+rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for rel in ['api/gemini.php','api/utf8-safe.php',SECRET]:
  r=subprocess.run(['php','-l',str(v/rel)],capture_output=True,text=True);results.append({'path':'syntax '+rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 with zipfile.ZipFile(F) as z:
  full_names=set(z.namelist())
  results.append({'path':'full includes protected api/gemini-secret.php','ok':SECRET in full_names})
  results.append({'path':'full includes safe credential example','ok':'api/gemini-secret.example.php' in full_names and b'REPLACE_WITH_PRIMARY_GEMINI_KEY' in z.read('api/gemini-secret.example.php')})
  results.append({'path':'full includes credential setup guide','ok':'GEMINI_CREDENTIALS_SETUP_RU.md' in full_names})
  for rel in ['reports/hf28-release-audit.json','reports/hf28-browser-acceptance.json','reports/hf28-http-contract.json','reports/hf28-regression-comparison.json']:
   data=json.loads(z.read(rel));results.append({'path':'embedded '+rel,'ok':data.get('ok') is True})
 repro=OUT/'hf28_repro';shutil.rmtree(repro,ignore_errors=True);repro.mkdir()
 r=subprocess.run([sys.executable,str(ROOT/'tools/build_hf28_gemini_reliability.py'),'--out-dir',str(repro)],cwd=ROOT,capture_output=True,text=True,timeout=300);results.append({'path':'repro build command','ok':r.returncode==0,'detail':r.stderr[-500:]})
 if r.returncode==0:
  for original in [H,F]:
   rp=repro/original.name;results.append({'path':'repro '+original.name,'ok':original.read_bytes()==rp.read_bytes(),'sha256':sha(rp.read_bytes())})
 out={'ok':all(x['ok'] for x in results),'release_version':'v5.3.210-rc2-hf28-gemini-reliability','results':results};(ROOT/'reports/hf28-archive-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
