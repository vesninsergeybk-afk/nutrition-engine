#!/usr/bin/env python3
from pathlib import Path
import zipfile, hashlib, json, stat, os
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
REL='v5.3.210-rc2-hf19'
FIXED=(2026,7,21,0,0,0)
HOSTING=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_PRIVATE.zip'
OVERLAY=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_OVERLAY_PRIVATE.zip'
FULL=OUT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_ACCEPTED_FULL_PRIVATE_AUDITED.zip'

def sha(b):return hashlib.sha256(b).hexdigest()
def add(z,rel,data,mode=0o644):
 zi=zipfile.ZipInfo(rel,FIXED);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|mode)<<16
 z.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def runtime_files():
 import sys;sys.path.insert(0,str(ROOT/'tools'));from runtime_inventory import compute
 files,missing=compute()
 if missing:raise SystemExit('missing runtime: '+','.join(missing))
 return files

def manifest(kind,files):
 return {'schema_version':1,'release_version':REL,'artifact_kind':kind,'created_at':'2026-07-21T00:00:00Z','runtime_files':len(files),'incident':'BOOT_VERSION_HANDSHAKE_MISMATCH','source_baseline':'v5.3.210-rc2-hf18-stage5b0','changed_runtime_files':['index.html','index-v5.3.210.html','assets/js/00-browser-compatibility-gate-v5.3.210.js','assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js','assets/js/11-hosting-selftest.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf19.js'],'scientific_data_changed':False,'product_database_changed':False,'calculations_changed':False,'browser_evidence':'reports/hf19-boot-recovery-browser.json','failure_reproduction':'reports/hf18-boot-failure-reproduction.json','files':[{'path':rel,'sha256':sha(data),'size':len(data)} for rel,data,_ in files]}
def spdx(files,name):
 return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':'https://example.invalid/nutrition-calculator/'+REL+'/'+name,'creationInfo':{'created':'2026-07-21T00:00:00Z','creators':['Tool: hf19-boot-recovery-builder']},'files':[{'SPDXID':'SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest(),'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}]} for rel,data,_ in files]}

def build_hosting():
 rels=runtime_files();files=[(r,(ROOT/r).read_bytes(),0o644) for r in rels]
 with zipfile.ZipFile(HOSTING,'w') as z:
  for f in files:add(z,*f)
  add(z,'release-manifest.json',(json.dumps(manifest('hosting-private',files),ensure_ascii=False,indent=2)+'\n').encode())
  add(z,'release-sbom.spdx.json',(json.dumps(spdx(files,HOSTING.name),ensure_ascii=False,indent=2)+'\n').encode())
 return files

def build_overlay():
 rels=['index.html','index-v5.3.210.html','assets/js/00-browser-compatibility-gate-v5.3.210.js','assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js','assets/js/11-hosting-selftest.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf19.js']
 files=[(r,(ROOT/r).read_bytes(),0o644) for r in rels]
 with zipfile.ZipFile(OVERLAY,'w') as z:
  for f in files:add(z,*f)
  add(z,'HOTFIX19_UPLOAD_INSTRUCTIONS_RU.md',(ROOT/'NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX19_BOOT_RECOVERY_OPERATIONS_RU.md').read_bytes())
 return files

def build_full():
 skip_parts={'.git','node_modules','__pycache__','.pytest_cache','playwright-report','test-results'}
 files=[]
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(ROOT).as_posix()
  if rel in {'release-manifest.json','release-sbom.spdx.json','reports/hf19-build.json'}:continue
  if any(x in skip_parts for x in Path(rel).parts):continue
  mode=0o755 if rel.startswith('tools/') and p.suffix in {'.py','.sh'} else 0o644
  files.append((rel,p.read_bytes(),mode))
 with zipfile.ZipFile(FULL,'w') as z:
  for f in files:add(z,*f)
  add(z,'release-manifest.json',(json.dumps(manifest('full-private-audited',files),ensure_ascii=False,indent=2)+'\n').encode())
  add(z,'release-sbom.spdx.json',(json.dumps(spdx(files,FULL.name),ensure_ascii=False,indent=2)+'\n').encode())
 return files

def main():
 h=build_hosting();o=build_overlay();f=build_full()
 result={'release':REL,'hosting':{'path':str(HOSTING),'sha256':sha(HOSTING.read_bytes()),'entries':len(h)+2},'overlay':{'path':str(OVERLAY),'sha256':sha(OVERLAY.read_bytes()),'entries':len(o)+1},'full':{'path':str(FULL),'sha256':sha(FULL.read_bytes()),'entries':len(f)+2}}
 (ROOT/'reports/hf19-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
