#!/usr/bin/env python3
from __future__ import annotations
import asyncio,hashlib,importlib.util,json,shutil,subprocess,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/mnt/data')
H=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX26_TRUTHFUL_PROGRESS_PRIVATE.zip'
F=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX26_TRUTHFUL_PROGRESS_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
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
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
async def extracted_smoke(v):
 smoke=load('hf26smoke_verify',ROOT/'tools/hf26_truthful_loader_smoke.py');smoke.ROOT=v
 from playwright.async_api import async_playwright
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  cases=[await smoke.case(b,'normal'),await smoke.case(b,'slow-products',{'products.v5.3.210-p1.3.compact.json.gz':2.0}),await smoke.case(b,'fallback-product',failures={'products.v5.3.210-p1.3.compact.json.gz'}),await smoke.case(b,'fallback-runtime',failures={'deferred-runtime-v5.3.210-rc2-hf24.js.gz'})]
  await b.close()
 return {'ok':all(c['passed'] for c in cases),'cases':cases}
def main():
 results=[check_zip(H),check_zip(F)]
 v=OUT/'hf26_archive_verify';shutil.rmtree(v,ignore_errors=True);v.mkdir()
 with zipfile.ZipFile(H) as z:z.extractall(v)
 for rel in ['assets/js/00-runtime-bootstrap-v5.3.210-hf26.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf26.legacy.js','assets/js/00-runtime-selector-v5.3.210-hf26.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf26.js']:
  r=subprocess.run(['node','--check',str(v/rel)],capture_output=True);results.append({'path':rel,'ok':r.returncode==0})
 browser=asyncio.run(extracted_smoke(v));results.append({'path':'extracted browser smoke','ok':browser['ok'],'cases':len(browser['cases']),'visible_ms':[c['state']['visible'] for c in browser['cases']]})
 repro=OUT/'hf26_repro';shutil.rmtree(repro,ignore_errors=True);repro.mkdir()
 r=subprocess.run([sys.executable,str(ROOT/'tools/build_hf26_truthful_progress.py'),'--out-dir',str(repro)],cwd=ROOT,capture_output=True,text=True)
 results.append({'path':'repro build command','ok':r.returncode==0,'stderr':r.stderr[-500:]})
 if r.returncode==0:
  for original in [H,F]:
   rp=repro/original.name;results.append({'path':'repro '+original.name,'ok':original.read_bytes()==rp.read_bytes(),'sha256':sha(rp.read_bytes())})
 out={'ok':all(x['ok'] for x in results),'results':results}
 (ROOT/'reports/hf26-archive-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
