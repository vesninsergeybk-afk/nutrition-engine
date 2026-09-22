#!/usr/bin/env python3
from pathlib import Path
import zipfile,json,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
ARTS={
 'hosting':OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_PRIVATE.zip',
 'overlay':OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_OVERLAY_PRIVATE.zip',
 'full':OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_ACCEPTED_FULL_PRIVATE_AUDITED.zip'}
REL='v5.3.210-rc2-hf19'
checks=[]
def add(n,ok,d=''):checks.append({'name':n,'passed':bool(ok),'detail':d})
def sha(b):return hashlib.sha256(b).hexdigest()
sys.path.insert(0,str(ROOT/'tools'));from runtime_inventory import compute
runtime,_=compute();runtime=set(runtime)
for kind,path in ARTS.items():
 with zipfile.ZipFile(path) as z:
  names=z.namelist();add(kind+' zip integrity',z.testzip() is None);add(kind+' unique names',len(names)==len(set(names)),str(len(names)))
  if kind=='hosting':
   add('hosting runtime exact',set(names)-{'release-manifest.json','release-sbom.spdx.json'}==runtime,str(len(set(names)-{'release-manifest.json','release-sbom.spdx.json'})))
   m=json.loads(z.read('release-manifest.json'));add('hosting release',m['release_version']==REL,m['release_version']);add('hosting runtime count',m['runtime_files']==277,str(m['runtime_files']))
   bad=[]
   for row in m['files']:
    if sha(z.read(row['path']))!=row['sha256']:bad.append(row['path'])
   add('hosting manifest hashes',not bad,','.join(bad[:10]))
   idx=z.read('index.html').decode();add('hosting hf19 index',REL in idx and 'runtime-manifest-v5.3.210-rc2-hf19.js' in idx)
  elif kind=='overlay':
   expected={'index.html','index-v5.3.210.html','assets/js/00-browser-compatibility-gate-v5.3.210.js','assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js','assets/js/11-hosting-selftest.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf19.js','HOTFIX19_UPLOAD_INSTRUCTIONS_RU.md'}
   add('overlay exact',set(names)==expected,','.join(sorted(set(names)^expected)))
  else:
   add('full contains evidence',all(x in names for x in ['reports/hf18-boot-failure-reproduction.json','reports/hf19-boot-recovery-browser.json','reports/hf19-boot-recovery-static.json','NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_TEST_REPORT_RU.md']))
   add('full private secret','api/gemini-secret.php' in names)
result={'ok':all(x['passed'] for x in checks),'release':REL,'assertions':len(checks),'artifacts':{k:{'path':str(v),'sha256':sha(v.read_bytes())} for k,v in ARTS.items()},'checks':checks}
(ROOT/'reports/hf19-archive-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(0 if result['ok'] else 1)
