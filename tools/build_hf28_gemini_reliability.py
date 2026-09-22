#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,stat,subprocess,sys,zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/mnt/data')
VERSION='v5.3.210-rc2-hf28-gemini-reliability';CREATED='2026-08-04T14:30:00Z';FIXED_DT=(2026,8,4,14,30,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX28_GEMINI_RELIABILITY_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX28_GEMINI_RELIABILITY_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/hf28-build.json','reports/hf28-archive-verification.json'}
REQUIRED_REPORTS=['reports/hf28-browser-acceptance.json','reports/hf28-http-contract.json','reports/hf28-live-audio-transport-probe.json','reports/hf28-release-audit.json','reports/hf28-runtime-inventory.json','reports/hf28-regression-comparison.json','reports/hf28-packaged-secret-http.json']
def sha(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def mode(rel:str)->int:
 if rel=='api/gemini-secret.php':return 0o600
 return 0o755 if rel.startswith('tools/') or (rel.startswith('tests/') and rel.endswith(('.py','.sh','.js','.php'))) else 0o644
def read_json(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def runtime_files():
 rels,missing=compute_runtime()
 if missing:raise SystemExit('runtime closure incomplete: '+', '.join(missing))
 return [(r,(ROOT/r).read_bytes(),mode(r)) for r in rels]
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
 audit=read_json('reports/hf28-release-audit.json');browser=read_json('reports/hf28-browser-acceptance.json');http=read_json('reports/hf28-http-contract.json');live=read_json('reports/hf28-live-audio-transport-probe.json');runtime=read_json('reports/hf28-runtime-inventory.json');reg=read_json('reports/hf28-regression-comparison.json');packaged=read_json('reports/hf28-packaged-secret-http.json')
 mt=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js').read_text();import re;m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',mt,re.S);rm=json.loads(m.group(1))
 fr=file_rows(files)
 return {'schema_version':4,'release_version':VERSION,'base_release':'v5.3.210-rc2-hf27-microphone-resilience','artifact_kind':kind,'created_at':CREATED,'file_count':len(fr),'uncompressed_bytes':sum(x['size'] for x in fr),'change_scope':'Gemini media reliability, UTF-8-safe PHP, ordinary-adult non-clinical consent, explicit media interaction states and private server-side credential packaging; calculation-neutral','architecture':{'credential_packaging':'The existing primary and backup Gemini keys are included only in protected server-side api/gemini-secret.php; environment variables and GEMINI_SECRET_FILE remain optional overrides','utf8_helper':'api/utf8-safe.php; pure-PHP fallback with optional mbstring/iconv acceleration','consent_contract':['18+','non-clinical use','explicit media transfer consent'],'protected_clinical_profiles':True,'media_module':'lazy','product_count':1105,'runtime_files':runtime['file_count'],'critical_shell_modern_bytes':rm['assetBytes']['criticalShellModern'],'critical_shell_legacy_bytes':rm['assetBytes']['criticalShellLegacy']},'acceptance':{'release_audit_ok':audit['ok'],'release_audit_assertions':audit['assertions'],'browser_ok':browser['ok'],'browser_scenarios':browser['assertions'],'http_contract_ok':http['ok'],'http_contract_assertions':http['assertions'],'mock_media_e2e_assertions':12,'utf8_assertions':8,'static_contract_assertions':13,'runtime_closure_ok':runtime['ok'],'packaged_secret_http_ok':packaged['ok'],'packaged_secret_http_assertions':packaged['assertions'],'new_regressions':reg['new_failures'],'live_transport_status':live['http_status'],'live_provider_response_verified':live['provider_response_verified']},'limitations':['External Gemini response was not received in the build container because DNS access to Google API was unavailable. Successful response handling was verified with a provider mock; run one live HTTPS request after deployment.','Physical Android and iOS permission dialogs remain deployment acceptance checks.','Private release archives contain the existing server-side Gemini credential file for immediate operation; delete the uploaded ZIP from public web storage after extraction.'],'files':fr}
def spdx(name,files):
 fs=[]
 for rel,data,_ in files:
  sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest();fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
 return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,'creationInfo':{'created':CREATED,'creators':['Tool: build_hf28_gemini_reliability.py']},'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}
def add(z,rel,data,md):
 zi=zipfile.ZipInfo(rel,FIXED_DT);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|md)<<16;z.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def build(path,kind,files):
 m=manifest(kind,files);s=spdx(path.name,files);path.unlink(missing_ok=True)
 with zipfile.ZipFile(path,'w') as z:
  for rel,data,md in files:add(z,rel,data,md)
  add(z,'release-manifest.json',(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode(),0o644);add(z,'release-sbom.spdx.json',(json.dumps(s,ensure_ascii=False,indent=2)+'\n').encode(),0o644)
 return m,s
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));a=ap.parse_args();out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
 r=subprocess.run([sys.executable,str(ROOT/'tools/generate_hf28_runtime.py')],cwd=ROOT,capture_output=True,text=True)
 if r.returncode:raise SystemExit('runtime generation failed: '+r.stderr)
 for rel in REQUIRED_REPORTS:
  data=read_json(rel)
  if data.get('ok') is not True:raise SystemExit('required report failed: '+rel)
 host=runtime_files();full=full_files();hp=out/HOSTING_NAME;fp=out/FULL_NAME;hm,_=build(hp,'hosting-private',host);fm,s=build(fp,'full-private-audited',full)
 (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n');(ROOT/'release-sbom.spdx.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
 result={'ok':True,'release_version':VERSION,'artifacts':[{'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(host),'manifest_files':hm['file_count']},{'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']}]}
 (ROOT/'reports/hf28-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
