#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,re,zipfile,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX25_SPLASH_BALANCE_ACCEPTED_FULL_PRIVATE_AUDITED.zip')
VERSION='v5.3.210-rc2-hf26-truthful-progress'
checks=[]
def add(name,ok,detail=''):checks.append({'name':name,'ok':bool(ok),'detail':detail})
with zipfile.ZipFile(BASE) as z:
 names=set(z.namelist());same=0;changed=[];missing=[]
 for rel in sorted(names):
  if rel in {'release-manifest.json','release-sbom.spdx.json','index.html','index-v5.3.210.html'}:continue
  p=ROOT/rel
  if not p.is_file():missing.append(rel);continue
  if p.read_bytes()==z.read(rel):same+=1
  else:changed.append(rel)
add('HF25 common protected files unchanged',not changed and not missing,f'identical={same}; changed={changed[:10]}; missing={missing[:10]}')
active=[ROOT/'index.html',ROOT/'index-v5.3.210.html',ROOT/'assets/js/00-runtime-bootstrap-v5.3.210-hf26.js',ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf26.legacy.js',ROOT/'assets/js/00-runtime-selector-v5.3.210-hf26.js',ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf26.js']
text='\n'.join(p.read_text(encoding='utf-8') for p in active)
add('active release version present',VERSION in text)
add('old HF25 release token absent from active files','v5.3.210-rc2-hf25-splash-balance' not in text)
for p in active:
 if p.suffix=='.js':
  r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
  add('syntax '+p.name,r.returncode==0,(r.stderr or r.stdout).strip())
add('product gzip exists and compact',(ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').is_file(),str((ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').stat().st_size))
add('runtime gzip exists and compact',(ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz').is_file(),str((ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz').stat().st_size))
for rel in ['reports/hf26-truthful-loader-smoke.json','reports/hf26-media-acceptance.json','reports/hf26-progress-contract-static.json','reports/hf26-runtime-inventory.json']:
 try:o=json.loads((ROOT/rel).read_text(encoding='utf-8'));add(rel,o.get('ok') is True)
 except Exception as e:add(rel,False,str(e))
result={'ok':all(x['ok'] for x in checks),'assertions':len(checks),'checks':checks}
(ROOT/'reports/hf26-release-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
