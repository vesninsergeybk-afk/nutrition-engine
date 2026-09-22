#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,os,stat,zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v6.0.0-beta6-design-refinement'
BASE='v6.0.0-beta5-cross-stage-hardening'
CREATED='2026-08-05T21:30:00Z'
FIXED_DT=(2026,8,5,21,30,0)
PREFIX='NUTRITION_CALCULATOR_V6_0_0_BETA6_DESIGN_REFINEMENT'
HOSTING_NAME=PREFIX+'_HOSTING_PRIVATE.zip'
FULL_NAME=PREFIX+'_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
SECRET='api/gemini-secret.php'
DOCS=[
 'README_DEPLOY_V6_BETA6_RU.md',
 PREFIX+'_RELEASE_NOTES_RU.md',PREFIX+'_CHANGELOG_RU.md',PREFIX+'_TEST_REPORT_RU.md',PREFIX+'_AUDIT_RU.md',PREFIX+'_FINAL_ACCEPTANCE_RU.md',
]
REPORTS=[
 'reports/v6-beta6-design-acceptance.json','reports/v6-beta6-profile-hierarchy-acceptance.json','reports/v6-beta6-profile-acceptance.json',
 'reports/v6-beta6-interaction-acceptance.json','reports/v6-beta6-analysis-continuity.json','reports/v6-beta6-nutrient-group-acceptance.json',
 'reports/v6-beta6-gemini-media-acceptance.json','reports/v6-beta6-runtime-inventory.json','reports/v6-beta6-protected-comparison.json',
 'reports/v6-beta6-ui-budget.json','reports/v6-beta6-release-audit.json','reports/v6-beta6-syntax-checks.json',
]
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report','.cache'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/v6-beta6-build.json','reports/v6-beta6-archive-verification.json','reports/v6-beta6-extracted-hosting-acceptance.json'}

def sha(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def mode(rel:str)->int:
 if rel==SECRET:return 0o600
 if rel.startswith(('tools/','tests/')) and rel.endswith(('.py','.sh','.js','.php')):return 0o755
 return 0o644

def row(rel,data,md):return {'path':rel,'size':len(data),'sha256':sha(data),'mode':oct(md)}
def read(rel):return (ROOT/rel).read_bytes()
def reports_summary():
 out={}
 for rel in REPORTS:
  d=json.loads((ROOT/rel).read_text(encoding='utf-8'));out[Path(rel).stem]={'ok':d.get('ok'),'assertions':d.get('assertions')}
 return out

def hosting_files():
 files,missing=compute_runtime()
 if missing:raise SystemExit('runtime closure incomplete: '+', '.join(missing))
 rels=list(files)+['config/runtime-assets.v6.0.0-beta6.json']+DOCS+REPORTS
 out=[]
 for rel in sorted(set(rels)):
  p=ROOT/rel
  if not p.is_file():raise SystemExit('hosting file missing: '+rel)
  out.append((rel,p.read_bytes(),mode(rel)))
 return out

def full_files():
 out=[]
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(ROOT).as_posix()
  if any(x in EXCLUDE_PARTS for x in Path(rel).parts) or rel in EXCLUDE_NAMES or p.suffix=='.pyc':continue
  out.append((rel,p.read_bytes(),mode(rel)))
 return out

def manifest(kind,files):
 protected=json.loads((ROOT/'reports/v6-beta6-protected-comparison.json').read_text())
 runtime=json.loads((ROOT/'reports/v6-beta6-runtime-inventory.json').read_text())
 budget=json.loads((ROOT/'reports/v6-beta6-ui-budget.json').read_text())
 rows=[row(*x) for x in files]
 return {
  'schema_version':6,'release_version':VERSION,'base_release':BASE,'artifact_kind':kind,'created_at':CREATED,
  'file_count':len(rows),'uncompressed_bytes':sum(x['size'] for x in rows),
  'change_scope':'Design and usability refinement of Ivory & Brass: clearer empty states, readable entry methods, non-overlay desktop actions and sequential mobile flow; no calculation-engine changes.',
  'architecture':{'themes':['modern','retro-2bit','ivory-brass'],'presentation_modes':['sections','canvas'],'desktop_model':'spatial workspace','mobile_model':'sequential sections','profile_required_fields':['needs_sex','needs_age','needs_h','needs_w','needs_activity'],'product_count':1105,'protected_files_byte_identical':protected['unchanged_files'],'runtime_files':runtime['file_count'],'incremental_ui_bytes':budget['incremental_ui_bytes'],'server_credentials':'Primary and backup Gemini keys are included only in protected server-side api/gemini-secret.php.'},
  'acceptance':reports_summary(),
  'limitations':['Physical Android/iPhone, Safari, Samsung Internet and Qt WebEngine remain external acceptance targets.','A live external Gemini HTTP 200 is not claimed from the isolated build environment.','Human usability observation remains a release-candidate activity.','Private archives contain protected server credentials and must not be stored in public download directories.'],
  'files':rows}

def sbom(name,files):
 fs=[]
 for rel,data,_ in files:
  sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest();fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
 return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,'creationInfo':{'created':CREATED,'creators':['Tool: build_v6_beta6.py']},'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}

def add(z,rel,data,md):
 i=zipfile.ZipInfo(rel,FIXED_DT);i.create_system=3;i.compress_type=zipfile.ZIP_DEFLATED;i.external_attr=(stat.S_IFREG|md)<<16;z.writestr(i,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def build(path,kind,files):
 man=json.dumps(manifest(kind,files),ensure_ascii=False,indent=2).encode()+b'\n';sb=json.dumps(sbom(path.name,files),ensure_ascii=False,indent=2).encode()+b'\n'
 with zipfile.ZipFile(path,'w',allowZip64=True) as z:
  for rel,data,md in files:add(z,rel,data,md)
  add(z,'release-manifest.json',man,0o644);add(z,'release-sbom.spdx.json',sb,0o644)
 return {'path':str(path),'size':path.stat().st_size,'sha256':sha(path.read_bytes()),'payload_files':len(files),'zip_entries':len(files)+2}
def main():
 for p in ROOT.rglob('__pycache__'):
  if p.is_dir():
   import shutil;shutil.rmtree(p)
 for p in ROOT.rglob('*.pyc'):p.unlink(missing_ok=True)
 h=build(OUT/HOSTING_NAME,'hosting-private',hosting_files());f=build(OUT/FULL_NAME,'full-private-audited',full_files())
 result={'ok':True,'release_version':VERSION,'hosting':h,'full':f};(ROOT/'reports/v6-beta6-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
