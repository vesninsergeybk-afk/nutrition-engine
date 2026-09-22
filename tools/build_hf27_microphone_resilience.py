#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,stat,subprocess,sys,zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v5.3.210-rc2-hf27-microphone-resilience'
CREATED='2026-07-27T10:30:00Z';FIXED_DT=(2026,7,27,10,30,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX27_MICROPHONE_RESILIENCE_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX27_MICROPHONE_RESILIENCE_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/hf27-build.json','reports/hf27-archive-verification.json'}

def sha(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def mode(rel:str)->int:return 0o755 if rel.startswith('tools/') or (rel.startswith('tests/') and rel.endswith(('.py','.sh','.js'))) else 0o644
def read_report(rel:str):return json.loads((ROOT/rel).read_text(encoding='utf-8'))

def runtime_files():
 rels,missing=compute_runtime()
 if missing:raise SystemExit('runtime closure incomplete: '+', '.join(missing))
 return [(r,(ROOT/r).read_bytes(),0o644) for r in rels]

def full_files():
 rows=[]
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(ROOT).as_posix()
  if any(x in EXCLUDE_PARTS for x in Path(rel).parts) or rel in EXCLUDE_NAMES:continue
  rows.append((rel,p.read_bytes(),mode(rel)))
 return rows

def file_rows(files):return [{'path':r,'size':len(b),'sha256':sha(b),'mode':oct(m)} for r,b,m in files]

def manifest(kind,files):
 loader=read_report('reports/hf27-truthful-loader-smoke.json')
 media=read_report('reports/hf27-microphone-resilience-acceptance.json')
 photo=read_report('reports/hf27-photo-acceptance.json')
 audit=read_report('reports/hf27-release-audit.json')
 inventory=read_report('reports/hf27-runtime-inventory.json')
 normal=next(x for x in loader['cases'] if x['case']=='normal')
 fr=file_rows(files)
 return {
  'schema_version':4,'release_version':VERSION,'base_release':'v5.3.210-rc2-hf26-truthful-progress','artifact_kind':kind,'created_at':CREATED,
  'file_count':len(fr),'uncompressed_bytes':sum(x['size'] for x in fr),
  'change_scope':'mobile microphone resilience, visible permission feedback and native recorder fallback; calculation-neutral',
  'architecture':{
   'startup_loader':'truthful five-stage full-readiness progress preserved from HF26','normal_loader_visible_ms':normal['state']['visible'],
   'microphone_request':{'constraints':{'audio':True},'soft_watchdog_ms':2800,'hard_watchdog_ms':18000,'feature_policy_preblock':False},
   'visible_feedback_location':'workspace product-entry card directly below entry buttons',
   'fallback':'native audio capture input accept=audio/* capture=microphone',
   'media_module':'lazy, loaded on first photo/audio/voice action','product_count':1105,
   'critical_shell_modern_bytes':72170,'critical_shell_legacy_bytes':72212,
  },
  'acceptance':{
   'loader_ok':loader['ok'],'loader_scenarios':len(loader['cases']),
   'microphone_ok':media['ok'],'microphone_scenarios':len(media['cases']),
   'photo_ok':photo['ok'],'release_audit_ok':audit['ok'],'release_audit_assertions':audit['assertions'],
   'runtime_closure_ok':inventory['ok'],'runtime_files':inventory['file_count'],
   'formula_assertions':108,'normative_assertions':74,'protected_hf26_common_files_identical':946,
   'actual_device_note':'Browser API behavior was exercised in automated Chromium; system permission UI on a concrete device remains dependent on HTTPS, Android and browser settings.'
  },
  'files':fr,
 }

def spdx(name,files):
 fs=[]
 for rel,data,_ in files:
  sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest()
  fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
 return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,'creationInfo':{'created':CREATED,'creators':['Tool: build_hf27_microphone_resilience.py']},'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}

def add(z,rel,data,md):
 zi=zipfile.ZipInfo(rel,FIXED_DT);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|md)<<16
 z.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)

def build(path,kind,files):
 m=manifest(kind,files);s=spdx(path.name,files);path.unlink(missing_ok=True)
 with zipfile.ZipFile(path,'w') as z:
  for rel,data,md in files:add(z,rel,data,md)
  add(z,'release-manifest.json',(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode(),0o644)
  add(z,'release-sbom.spdx.json',(json.dumps(s,ensure_ascii=False,indent=2)+'\n').encode(),0o644)
 return m,s

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));a=ap.parse_args();out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
 # Runtime generation is part of a reproducible build.
 r=subprocess.run([sys.executable,str(ROOT/'tools/generate_hf27_runtime.py')],cwd=ROOT,capture_output=True,text=True)
 if r.returncode:raise SystemExit('runtime generation failed: '+r.stderr)
 required=['reports/hf27-truthful-loader-smoke.json','reports/hf27-microphone-resilience-acceptance.json','reports/hf27-photo-acceptance.json','reports/hf27-release-audit.json','reports/hf27-runtime-inventory.json']
 for rel in required:
  if read_report(rel).get('ok') is not True:raise SystemExit('required report failed: '+rel)
 host=runtime_files();full=full_files();hp=out/HOSTING_NAME;fp=out/FULL_NAME
 hm,_=build(hp,'hosting-private',host);fm,s=build(fp,'full-private-audited',full)
 (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'release-sbom.spdx.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 result={'ok':True,'release_version':VERSION,'artifacts':[{'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(host),'manifest_files':hm['file_count']},{'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']}]}
 (ROOT/'reports/hf27-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
