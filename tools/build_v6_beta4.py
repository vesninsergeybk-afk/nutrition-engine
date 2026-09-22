#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, stat, subprocess, sys, zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v6.0.0-beta4-profile-hierarchy'
BASE='v6.0.0-beta3-interaction-coherence'
CREATED='2026-08-05T13:20:00Z'
FIXED_DT=(2026,8,5,13,20,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V6_0_0_BETA4_PROFILE_HIERARCHY_HOSTING_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V6_0_0_BETA4_PROFILE_HIERARCHY_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET='api/gemini-secret.php'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report','.cache'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/v6-beta4-build.json','reports/v6-beta4-archive-verification.json'}
PREFIX='NUTRITION_CALCULATOR_V6_0_0_BETA4_PROFILE_HIERARCHY'
HOSTING_DOCS=[
 'config/runtime-assets.v6.0.0-beta4.json','README_DEPLOY_V6_BETA4_RU.md',
 PREFIX+'_RELEASE_NOTES_RU.md',PREFIX+'_CHANGELOG_RU.md',PREFIX+'_TEST_REPORT_RU.md',PREFIX+'_AUDIT_RU.md',PREFIX+'_FINAL_ACCEPTANCE_RU.md']
REQUIRED_REPORTS=[
 'reports/v6-beta4-release-audit.json','reports/v6-beta4-profile-hierarchy-acceptance.json','reports/v6-beta4-profile-acceptance.json',
 'reports/v6-beta4-interaction-acceptance.json','reports/v6-beta4-nutrient-group-acceptance.json','reports/v6-beta4-analysis-continuity.json',
 'reports/v6-beta4-ivory-acceptance.json','reports/v6-beta4-ivory-extended-acceptance.json','reports/v6-beta4-gemini-media-acceptance.json',
 'reports/v6-beta4-syntax-checks.json','reports/v6-beta4-runtime-inventory.json','reports/v6-beta4-protected-comparison.json',
 'reports/v6-beta4-generator-idempotency.json','reports/v6-beta4-ui-budget.json','reports/v6-beta4-extracted-hosting-acceptance.json',
 'reports/hf28-http-contract.json','reports/hf28-packaged-secret-http.json']
def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()
def mode(rel:str)->int:
 if rel==SECRET:return 0o600
 if rel.startswith('tools/') and rel.endswith(('.py','.sh')):return 0o755
 if rel.startswith('tests/') and rel.endswith(('.py','.sh','.js','.php')):return 0o755
 return 0o644
def read_json(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def clean_caches():
 for p in sorted(ROOT.rglob('__pycache__'),reverse=True):
  if p.is_dir():
   for q in sorted(p.rglob('*'),reverse=True):
    if q.is_file():q.unlink()
    elif q.is_dir():q.rmdir()
   p.rmdir()
 for p in ROOT.rglob('*.pyc'):p.unlink(missing_ok=True)
def runtime_files():
 rels,missing=compute_runtime()
 if missing:raise SystemExit('runtime closure incomplete: '+', '.join(missing))
 merged=list(rels)
 for rel in HOSTING_DOCS:
  if rel not in merged:merged.append(rel)
 rows=[]
 for rel in sorted(merged):
  p=ROOT/rel
  if not p.is_file():raise SystemExit('hosting payload missing: '+rel)
  rows.append((rel,p.read_bytes(),mode(rel)))
 return rows
def full_files():
 rows=[]
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(ROOT).as_posix()
  if any(x in EXCLUDE_PARTS for x in Path(rel).parts) or rel in EXCLUDE_NAMES:continue
  rows.append((rel,p.read_bytes(),mode(rel)))
 return rows
def file_rows(files):return [{'path':r,'size':len(d),'sha256':sha(d),'mode':oct(m)} for r,d,m in files]
def manifest(kind,files):
 names={
  'audit':'reports/v6-beta4-release-audit.json','hierarchy':'reports/v6-beta4-profile-hierarchy-acceptance.json','profile':'reports/v6-beta4-profile-acceptance.json',
  'interaction':'reports/v6-beta4-interaction-acceptance.json','group':'reports/v6-beta4-nutrient-group-acceptance.json','analysis':'reports/v6-beta4-analysis-continuity.json',
  'ui':'reports/v6-beta4-ivory-acceptance.json','ux':'reports/v6-beta4-ivory-extended-acceptance.json','media':'reports/v6-beta4-gemini-media-acceptance.json',
  'runtime':'reports/v6-beta4-runtime-inventory.json','protected':'reports/v6-beta4-protected-comparison.json','budget':'reports/v6-beta4-ui-budget.json',
  'syntax':'reports/v6-beta4-syntax-checks.json','http':'reports/hf28-http-contract.json','secret_http':'reports/hf28-packaged-secret-http.json',
  'extracted':'reports/v6-beta4-extracted-hosting-acceptance.json'}
 r={k:read_json(v) for k,v in names.items()};live=read_json('reports/v6-live-audio-transport-probe.json')
 rows=file_rows(files)
 return {
  'schema_version':6,'release_version':VERSION,'base_release':BASE,'artifact_kind':kind,'created_at':CREATED,
  'file_count':len(rows),'uncompressed_bytes':sum(x['size'] for x in rows),
  'change_scope':'HOTFIX30 final profile hierarchy and progressive disclosure across all themes and layouts; no calculation-engine changes.',
  'architecture':{
   'themes':['modern','retro-2bit','ivory-brass'],'presentation_modes':['sections','canvas'],
   'desktop_ivory':'spatial canvas with persistent analytical rail','mobile_model':'sequential sections with five-field profile first step',
   'view_model_contract':'NutritionUIViewModel.v1','profile_hierarchy_contract':'NutritionProfileHierarchyV2','profile_hierarchy_release':'HOTFIX30 completed',
   'profile_required_fields':['needs_sex','needs_age','needs_h','needs_w','needs_activity'],
   'profile_preferences':['needs_person_name','needs_goal','needs_diet_style','needs_split'],
   'profile_advanced':['needs_state','needs_edema','needs_guardrail','needs_protein_manual','needsProtectedModeContext','needsLowWeightSafety'],
   'canonical_calculation_button':'needs_calc_btn','primary_profile_action':'profileCalculateContinue','stable_profile_dom_after_startup':True,
   'profile_storage_contract':'NutritionProfilePersistenceV1 / nutritionCalculator.profile.v1','analysis_feature_contract':'NutritionFeatureContinuityV1',
   'interaction_state_contract':'NutritionInteractionStatesV1','interaction_state_release':'HOTFIX29 completed',
   'nutrient_group_overview_contract':'NutrientGroupOverview.v1','nutrient_group_overview_role':'navigation-summary','nutrient_group_overview_not_a_score':True,
   'safe_ui_query':'?safe-ui=1','product_count':1105,'protected_files_byte_identical':r['protected']['unchanged_files'],'runtime_files':r['runtime']['file_count'],
   'server_credentials':'Existing primary and backup Gemini keys are intentionally included only in protected server-side api/gemini-secret.php.'},
  'acceptance':{
   'profile_hierarchy':{'ok':r['hierarchy']['ok'],'assertions':r['hierarchy']['assertions']},'profile_persistence':{'ok':r['profile']['ok'],'assertions':r['profile']['assertions']},
   'interaction_states':{'ok':r['interaction']['ok'],'assertions':r['interaction']['assertions']},'release_audit':{'ok':r['audit']['ok'],'assertions':r['audit']['assertions']},
   'group_overview':{'ok':r['group']['ok'],'assertions':r['group']['assertions']},'analysis':{'ok':r['analysis']['ok'],'assertions':r['analysis']['assertions']},
   'ui':{'ok':r['ui']['ok'],'assertions':r['ui']['assertions']},'extended_ux':{'ok':r['ux']['ok'],'assertions':r['ux']['assertions']},
   'gemini_browser':{'ok':r['media']['ok'],'assertions':r['media']['assertions']},'syntax':{'ok':r['syntax']['ok'],'assertions':r['syntax']['assertions']},
   'runtime_closure_ok':r['runtime']['ok'],'protected_core_changes':len(r['protected']['changed']),'ui_increment_bytes':r['budget']['increment'],
   'http_contract':{'ok':r['http']['ok'],'assertions':r['http']['assertions']},'packaged_secret_http':{'ok':r['secret_http']['ok'],'assertions':r['secret_http']['assertions']},
   'extracted_hosting_browser':{'ok':r['extracted']['ok'],'assertions':r['extracted']['assertions']},
   'live_provider_response_verified':live.get('provider_response_verified',False),'live_transport_status':live.get('http_status')},
  'limitations':[
   'External Gemini response was not received in the isolated build container because DNS access to Google API was unavailable; response handling was verified with a controlled mock.',
   'Physical Android, iPhone, Safari, Samsung Internet and Qt WebEngine remain deployment acceptance checks.',
   'Human usability testing has not yet been performed; release status remains beta 4.',
   'The private archives intentionally contain protected server-side Gemini credentials; remove the uploaded ZIP from public web storage after extraction.',
   'HOTFIX29 and HOTFIX30 are completed; later work should focus on live-device acceptance and release-candidate hardening.'],
  'files':rows}
def spdx(name,files):
 fs=[]
 for rel,data,_ in files:
  sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest();fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
 return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':f'https://example.invalid/nutrition-calculator/{VERSION}/{name}','creationInfo':{'created':CREATED,'creators':['Tool: build_v6_beta4.py']},'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}
def add(zf,rel,data,md):
 info=zipfile.ZipInfo(rel,FIXED_DT);info.compress_type=zipfile.ZIP_DEFLATED;info.create_system=3;info.external_attr=(stat.S_IFREG|md)<<16;zf.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def build(path,kind,files):
 man=manifest(kind,files);sb=spdx(path.name,files);path.unlink(missing_ok=True)
 with zipfile.ZipFile(path,'w') as z:
  for rel,data,md in files:add(z,rel,data,md)
  add(z,'release-manifest.json',(json.dumps(man,ensure_ascii=False,indent=2)+'\n').encode(),0o644);add(z,'release-sbom.spdx.json',(json.dumps(sb,ensure_ascii=False,indent=2)+'\n').encode(),0o644)
 return man,sb
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));ns=ap.parse_args();out=Path(ns.out_dir);out.mkdir(parents=True,exist_ok=True)
 clean_caches();os.chmod(ROOT/SECRET,0o600);env=dict(os.environ);env['PYTHONDONTWRITEBYTECODE']='1'
 r=subprocess.run([sys.executable,str(ROOT/'tools/generate_v6_beta4_runtime.py')],cwd=ROOT,env=env,capture_output=True,text=True)
 if r.returncode:raise SystemExit('runtime generation failed: '+r.stderr)
 os.chmod(ROOT/SECRET,0o600)
 for rel in REQUIRED_REPORTS:
  d=read_json(rel)
  if d.get('ok') is not True:raise SystemExit('required report failed: '+rel)
 hosting=runtime_files();full=full_files();hp=out/HOSTING_NAME;fp=out/FULL_NAME;hm,_=build(hp,'hosting-private',hosting);fm,sb=build(fp,'full-private-audited',full)
 (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(ROOT/'release-sbom.spdx.json').write_text(json.dumps(sb,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 result={'ok':True,'release_version':VERSION,'artifacts':[{'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(hosting),'manifest_files':hm['file_count']},{'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']}]}
 (ROOT/'reports/v6-beta4-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
