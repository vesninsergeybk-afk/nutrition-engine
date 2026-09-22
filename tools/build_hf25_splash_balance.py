#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, stat, subprocess, sys, zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v5.3.210-rc2-hf25-splash-balance'
CREATED='2026-07-26T20:00:00Z'
FIXED_DT=(2026,7,26,20,0,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX25_SPLASH_BALANCE_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX25_SPLASH_BALANCE_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/hf25-splash-balance-build.json','reports/hf25-splash-balance-archive-verification.json'}
def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()
def mode_for(rel:str)->int:
    if rel.startswith('tools/') or (rel.startswith('tests/') and rel.endswith(('.py','.sh','.js'))):return 0o755
    return 0o644
def runtime_files():
    rels,missing=compute_runtime()
    if missing:raise SystemExit('runtime closure incomplete: '+', '.join(missing))
    rows=[]
    for rel in rels:
        p=ROOT/rel
        if not p.is_file():raise SystemExit('runtime file missing: '+rel)
        rows.append((rel,p.read_bytes(),0o644))
    return rows
def full_files():
    rows=[]
    for p in sorted(ROOT.rglob('*')):
        if not p.is_file():continue
        rel=p.relative_to(ROOT).as_posix()
        if any(part in EXCLUDE_PARTS for part in Path(rel).parts):continue
        if rel in EXCLUDE_NAMES:continue
        rows.append((rel,p.read_bytes(),mode_for(rel)))
    return rows
def file_rows(files):return [{'path':rel,'size':len(data),'sha256':sha(data),'mode':oct(mode)} for rel,data,mode in files]
def report(rel):
    p=ROOT/rel
    return json.loads(p.read_text(encoding='utf-8')) if p.is_file() else {}
def case(rep,name):return next((x for x in rep.get('cases',[]) if x.get('case')==name),{})
def manifest(kind,files):
    static=report('reports/hf25-splash-balance-static.json');splash=report('reports/hf25-splash-acceptance.json');full=report('reports/hf25-full-acceptance-browser.json');inventory=report('reports/hf25-runtime-inventory.json')
    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'));fs=cfg['fast_start'];rows=file_rows(files)
    normal=case(splash,'normal-mobile');slow=case(splash,'slow-background-desktop');slowcrit=case(splash,'slow-critical-no-extra-wait')
    return {
      'schema_version':4,'release_version':VERSION,'base_release':'v5.3.210-rc2-hf24-media-lazy','artifact_kind':kind,'created_at':CREATED,
      'file_count':len(rows),'uncompressed_bytes':sum(x['size'] for x in rows),
      'change_scope':'startup splash timing and release handshake only',
      'architecture':{
        'startup_strategy':'critical_shell_then_lazy_media_and_compressed_background',
        'splash_policy':{'minimum_visible_ms':1450,'fade_ms':340,'duration_origin':'bootstrap_start','extra_delay_when_actual_startup_exceeds_minimum':False,'background_loading_independent':True},
        'critical_bundle':'assets/runtime/critical-shell-v5.3.210-rc2-hf24.js','critical_bundle_bytes':(ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf24.js').stat().st_size,
        'product_compressed_bytes':(ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').stat().st_size,
        'deferred_runtime_compressed_bytes':(ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz').stat().st_size,
        'product_count':1105,'protected_hf24_files_byte_identical':525,'calculation_normative_product_media_api_css_bundle_changes':False
      },
      'acceptance':{
        'static_audit_ok':static.get('ok') is True,'static_assertions':static.get('assertions'),
        'splash_browser_ok':splash.get('ok') is True,'splash_scenarios':splash.get('assertions'),
        'full_browser_ok':full.get('ok') is True,'full_scenarios':full.get('assertions'),
        'normal_loader_visible_ms':normal.get('closed',{}).get('loader_visible_ms'),
        'slow_background_loader_visible_ms':slow.get('closed',{}).get('loader_visible_ms'),
        'slow_critical_shell_ms':slowcrit.get('closed',{}).get('timing_ms'),'slow_critical_loader_visible_ms':slowcrit.get('closed',{}).get('loader_visible_ms'),
        'runtime_closure_ok':inventory.get('ok') is True,'runtime_files':inventory.get('file_count'),
        'photo_one_click':case(full,'photo-lazy-one-click').get('passed') is True,'voice_recording_started':case(full,'voice-lazy-success').get('passed') is True,
        'voice_denial_visible':case(full,'voice-denied-visible').get('passed') is True
      },'files':rows}
def spdx(name,files):
    fs=[]
    for rel,data,_ in files:
        sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest();fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
    return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,
      'creationInfo':{'created':CREATED,'creators':['Tool: build_hf25_splash_balance.py']},'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],
      'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}
def add(zf,rel,data,mode):
    zi=zipfile.ZipInfo(rel,FIXED_DT);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|mode)<<16
    zf.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
def build(path,kind,files):
    m=manifest(kind,files);s=spdx(path.name,files);md=(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode();sd=(json.dumps(s,ensure_ascii=False,indent=2)+'\n').encode();path.unlink(missing_ok=True)
    with zipfile.ZipFile(path,'w') as z:
        for rel,data,mode in files:add(z,rel,data,mode)
        add(z,'release-manifest.json',md,0o644);add(z,'release-sbom.spdx.json',sd,0o644)
    return m,s
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));args=ap.parse_args();out=Path(args.out_dir);out.mkdir(parents=True,exist_ok=True)
    checks=[[sys.executable,'tools/generate_runtime_assets.py','--check'],[sys.executable,'tools/hf25_splash_balance_audit.py']]
    for cmd in checks:
        r=subprocess.run(cmd,cwd=ROOT)
        if r.returncode:raise SystemExit('pre-build check failed: '+' '.join(cmd))
    for rel in ('reports/hf25-splash-balance-static.json','reports/hf25-splash-acceptance.json','reports/hf25-full-acceptance-browser.json','reports/hf25-runtime-inventory.json'):
        if report(rel).get('ok') is not True:raise SystemExit('required report failed: '+rel)
    host=runtime_files();full=full_files();hp=out/HOSTING_NAME;fp=out/FULL_NAME
    hm,_=build(hp,'hosting-private',host);fm,sbom=build(fp,'full-private-audited',full)
    (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(ROOT/'release-sbom.spdx.json').write_text(json.dumps(sbom,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result={'ok':True,'release_version':VERSION,'artifacts':[{'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(host),'manifest_files':hm['file_count']},{'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']}]}
    (ROOT/'reports/hf25-splash-balance-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
