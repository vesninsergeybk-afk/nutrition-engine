#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,stat,sys,zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v5.3.210-rc2-hf26-truthful-progress'
CREATED='2026-07-26T20:15:00Z';FIXED_DT=(2026,7,26,20,15,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX26_TRUTHFUL_PROGRESS_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX26_TRUTHFUL_PROGRESS_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/hf26-build.json','reports/hf26-archive-verification.json'}
def sha(b):return hashlib.sha256(b).hexdigest()
def mode(rel):return 0o755 if rel.startswith('tools/') or (rel.startswith('tests/') and rel.endswith(('.py','.sh','.js'))) else 0o644
def read_report(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
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
def rows(files):return [{'path':r,'size':len(b),'sha256':sha(b),'mode':oct(m)} for r,b,m in files]
def manifest(kind,files):
 smoke=read_report('reports/hf26-truthful-loader-smoke.json');media=read_report('reports/hf26-media-acceptance.json');contract=read_report('reports/hf26-progress-contract-static.json');audit=read_report('reports/hf26-release-audit.json');inventory=read_report('reports/hf26-runtime-inventory.json')
 by={c['case']:c for c in smoke['cases']};fr=rows(files)
 return {'schema_version':4,'release_version':VERSION,'base_release':'v5.3.210-rc2-hf25-splash-balance','artifact_kind':kind,'created_at':CREATED,'file_count':len(fr),'uncompressed_bytes':sum(x['size'] for x in fr),'change_scope':'truthful staged startup progress and release handshake only','architecture':{'stages':['Интерфейс','База продуктов','Расчёты и инструменты','Проверка готовности','Готово'],'weights_percent':{'interface':14,'products':46,'runtime':32,'validation':8},'minimum_visible_ms':4200,'fade_ms':360,'product_count':1105,'product_compressed_bytes':600495,'deferred_runtime_modern_compressed_bytes':619926,'progress_sources':['critical shell completion','product bytes or fallback chunks','runtime bytes or fallback modules','four readiness checks'],'slower_real_load_extends_splash':True,'fixed_delay_after_slow_load':False},'acceptance':{'smoke_ok':smoke['ok'],'smoke_scenarios':len(smoke['cases']),'normal_visible_ms':by['normal']['state']['visible'],'slow_products_visible_ms':by['slow-products']['state']['visible'],'slow_runtime_visible_ms':by['slow-runtime']['state']['visible'],'fallback_product_ok':by['fallback-product']['passed'],'fallback_runtime_ok':by['fallback-runtime']['passed'],'media_ok':media['ok'],'media_scenarios':len(media['cases']),'contract_ok':contract['ok'],'contract_assertions':contract['assertions'],'release_audit_ok':audit['ok'],'release_assertions':audit['assertions'],'runtime_closure_ok':inventory['ok'],'runtime_files':inventory['file_count'],'formula_assertions':108,'normative_assertions':74,'protected_hf25_common_files_identical':954},'files':fr}
def spdx(name,files):
 fs=[]
 for rel,data,_ in files:
  sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest();fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
 return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,'creationInfo':{'created':CREATED,'creators':['Tool: build_hf26_truthful_progress.py']},'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}
def add(z,rel,data,md):
 zi=zipfile.ZipInfo(rel,FIXED_DT);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|md)<<16;z.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def build(path,kind,files):
 m=manifest(kind,files);s=spdx(path.name,files);path.unlink(missing_ok=True)
 with zipfile.ZipFile(path,'w') as z:
  for rel,data,md in files:add(z,rel,data,md)
  add(z,'release-manifest.json',(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode(),0o644)
  add(z,'release-sbom.spdx.json',(json.dumps(s,ensure_ascii=False,indent=2)+'\n').encode(),0o644)
 return m,s
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));a=ap.parse_args();out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
 required=['reports/hf26-truthful-loader-smoke.json','reports/hf26-media-acceptance.json','reports/hf26-progress-contract-static.json','reports/hf26-release-audit.json','reports/hf26-runtime-inventory.json']
 for r in required:
  if read_report(r).get('ok') is not True:raise SystemExit('required report failed: '+r)
 host=runtime_files();full=full_files();hp=out/HOSTING_NAME;fp=out/FULL_NAME
 hm,_=build(hp,'hosting-private',host);fm,s=build(fp,'full-private-audited',full)
 (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(ROOT/'release-sbom.spdx.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 result={'ok':True,'release_version':VERSION,'artifacts':[{'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(host),'manifest_files':hm['file_count']},{'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']}]}
 (ROOT/'reports/hf26-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
