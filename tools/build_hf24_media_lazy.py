#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, stat, subprocess, sys, zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v5.3.210-rc2-hf24-media-lazy'
CREATED='2026-07-25T22:30:00Z'
FIXED_DT=(2026,7,25,22,30,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX24_MEDIA_LAZY_FAST_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX24_MEDIA_LAZY_FAST_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/hf24-media-lazy-build.json','reports/hf24-media-lazy-archive-verification.json'}

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
def load_report(rel):
    p=ROOT/rel
    return json.loads(p.read_text(encoding='utf-8')) if p.is_file() else {}

def find_case(report,name):return next((x for x in report.get('cases',[]) if x.get('case')==name),{})

def manifest(kind,files):
    static=load_report('reports/hf24-media-lazy-static.json')
    browser=load_report('reports/hf24-acceptance-browser.json')
    generation=load_report('reports/hf24-runtime-generation.json')
    inventory=load_report('reports/hf24-runtime-inventory.json')
    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'))
    fs=cfg['fast_start'];rows=file_rows(files);normal=find_case(browser,'startup-normal');slow=find_case(browser,'startup-slow')
    return {
      'schema_version':4,'release_version':VERSION,'base_release':'v5.3.210-rc2-hf23-media-entry-fix','artifact_kind':kind,'created_at':CREATED,
      'file_count':len(rows),'uncompressed_bytes':sum(x['size'] for x in rows),
      'architecture':{
        'startup_strategy':'critical_shell_then_lazy_media_and_compressed_background',
        'media_entry_strategy':'trusted_gesture_bridge_then_lazy_full_module',
        'microphone_constraint':{'audio':True},
        'first_screen_blocking_sources':len(fs['critical_shell_sources']['modern']),
        'deferred_runtime_sources':len(fs['deferred_runtime_sources']['modern']),
        'media_module_in_critical_shell':False,'media_module_in_deferred_runtime':False,'media_module_lazy_loaded':True,
        'critical_bundle':'assets/runtime/critical-shell-v5.3.210-rc2-hf24.js','critical_bundle_bytes':(ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf24.js').stat().st_size,
        'product_compressed':'assets/data/products.v5.3.210-p1.3.compact.json.gz','product_compressed_bytes':(ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').stat().st_size,
        'deferred_runtime_compressed':'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz','deferred_runtime_compressed_bytes':(ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz').stat().st_size,
        'host_independent_compression':True,'source_fallbacks_preserved':True,'product_count':1105,
        'calculation_normative_product_api_css_changes':False,'protected_hf23_files_byte_identical':498,
        'security_hardening_inherited':'v5.3.210-rc2-hf21'
      },
      'acceptance':{
        'static_audit_ok':static.get('ok') is True,'static_assertions':static.get('assertions'),
        'browser_audit_ok':browser.get('ok') is True,'browser_scenarios':browser.get('assertions'),
        'normal_shell_seconds':normal.get('shell_s'),'normal_full_seconds':normal.get('full_s'),'normal_requests':normal.get('requests'),
        'slow_background_shell_seconds':slow.get('shell_s'),'slow_background_full_seconds':slow.get('full_s'),
        'photo_one_click':find_case(browser,'photo-lazy-one-click').get('passed') is True,
        'voice_recording_started':find_case(browser,'voice-lazy-success').get('passed') is True,
        'voice_denial_visible':find_case(browser,'voice-denied-visible').get('passed') is True,
        'compressed_product_fallback':find_case(browser,'startup-normal-product-compressed-fallback').get('passed') is True,
        'generated_assets_reproducible':generation.get('ok') is True,
        'runtime_closure_complete':inventory.get('ok') is True,
      },
      'files':rows,
    }

def spdx(name,files):
    fs=[]
    for rel,data,_ in files:
        sid='SPDXRef-File-'+hashlib.sha1(rel.encode()).hexdigest()
        fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
    return {'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,
      'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,
      'creationInfo':{'created':CREATED,'creators':['Tool: build_hf24_media_lazy.py']},
      'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],
      'files':fs,'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs]}

def add(zf,rel,data,mode):
    zi=zipfile.ZipInfo(rel,FIXED_DT);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|mode)<<16
    zf.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)

def build(path,kind,files):
    m=manifest(kind,files);s=spdx(path.name,files)
    mdata=(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode();sdata=(json.dumps(s,ensure_ascii=False,indent=2)+'\n').encode()
    path.unlink(missing_ok=True)
    with zipfile.ZipFile(path,'w') as z:
        for rel,data,mode in files:add(z,rel,data,mode)
        add(z,'release-manifest.json',mdata,0o644);add(z,'release-sbom.spdx.json',sdata,0o644)
    return m,s

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));args=ap.parse_args();out=Path(args.out_dir);out.mkdir(parents=True,exist_ok=True)
    prechecks=[
      [sys.executable,'tools/generate_runtime_assets.py','--check'],
      [sys.executable,'tools/hf24_media_lazy_audit.py','--json-out','reports/hf24-media-lazy-static.json'],
    ]
    for cmd in prechecks:
        r=subprocess.run(cmd,cwd=ROOT)
        if r.returncode:raise SystemExit('pre-build check failed: '+' '.join(cmd))
    for rel in ('reports/hf24-acceptance-browser.json','reports/hf24-runtime-generation.json','reports/hf24-runtime-inventory.json'):
        if load_report(rel).get('ok') is not True:raise SystemExit('required report missing or failed: '+rel)
    host=runtime_files();full=full_files();hp=out/HOSTING_NAME;fp=out/FULL_NAME
    hm,_=build(hp,'hosting-private',host);fm,fsbom=build(fp,'full-private-audited',full)
    (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'release-sbom.spdx.json').write_text(json.dumps(fsbom,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result={'ok':True,'release_version':VERSION,'artifacts':[
      {'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(host),'manifest_files':hm['file_count']},
      {'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']}]}
    (ROOT/'reports/hf24-media-lazy-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
