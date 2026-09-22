#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/mnt/data')
H=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX27_MICROPHONE_RESILIENCE_PRIVATE.zip'
F=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX27_MICROPHONE_RESILIENCE_ACCEPTED_FULL_PRIVATE_AUDITED.zip'

def sha(b):return hashlib.sha256(b).hexdigest()
def check_zip(p):
 with zipfile.ZipFile(p) as z:
  bad=z.testzip();m=json.loads(z.read('release-manifest.json'));names=set(z.namelist());errs=[]
  if bad:errs.append('CRC '+bad)
  for row in m['files']:
   if row['path'] not in names:errs.append('missing '+row['path']);continue
   data=z.read(row['path'])
   if len(data)!=row['size'] or sha(data)!=row['sha256']:errs.append('hash '+row['path'])
  if len(m['files'])!=len(names)-2:errs.append('file count')
  return {'path':str(p),'ok':not errs,'errors':errs,'payload_files':len(m['files']),'sha256':sha(p.read_bytes())}
def report_from_full(rel):
 with zipfile.ZipFile(F) as z:return json.loads(z.read(rel))
def main():
 results=[check_zip(H),check_zip(F)]
 v=OUT/'hf27_archive_verify';shutil.rmtree(v,ignore_errors=True);v.mkdir()
 with zipfile.ZipFile(H) as z:z.extractall(v)
 active=['assets/js/00-runtime-bootstrap-v5.3.210-hf27.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf27.legacy.js','assets/js/00-runtime-selector-v5.3.210-hf27.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf27.js','assets/runtime/critical-shell-v5.3.210-rc2-hf27.js','assets/runtime/critical-shell-v5.3.210-rc2-hf27.legacy.js']
 for rel in active:
  r=subprocess.run(['node','--check',str(v/rel)],capture_output=True,text=True);results.append({'path':rel,'ok':r.returncode==0,'detail':(r.stderr or r.stdout)[-300:]})
 for rel in ['reports/hf27-truthful-loader-smoke.json','reports/hf27-microphone-resilience-acceptance.json','reports/hf27-photo-acceptance.json','reports/hf27-release-audit.json','reports/hf27-runtime-inventory.json']:
  data=report_from_full(rel);results.append({'path':'embedded '+rel,'ok':data.get('ok') is True})
 repro=OUT/'hf27_repro';shutil.rmtree(repro,ignore_errors=True);repro.mkdir()
 r=subprocess.run([sys.executable,str(ROOT/'tools/build_hf27_microphone_resilience.py'),'--out-dir',str(repro)],cwd=ROOT,capture_output=True,text=True,timeout=180)
 results.append({'path':'repro build command','ok':r.returncode==0,'stderr':r.stderr[-500:]})
 if r.returncode==0:
  for original in [H,F]:
   rp=repro/original.name;results.append({'path':'repro '+original.name,'ok':original.read_bytes()==rp.read_bytes(),'sha256':sha(rp.read_bytes())})
 out={'ok':all(x['ok'] for x in results),'release_version':'v5.3.210-rc2-hf27-microphone-resilience','results':results}
 (ROOT/'reports/hf27-archive-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
