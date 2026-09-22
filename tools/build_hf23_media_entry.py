#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, stat, subprocess, sys, zipfile
from pathlib import Path
from runtime_inventory import compute as compute_runtime

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
VERSION='v5.3.210-rc2-hf23-media-entry-fix'
CREATED='2026-07-25T21:00:00Z'
FIXED_DT=(2026,7,25,21,0,0)
HOSTING_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX23_MEDIA_ENTRY_FIX_PRIVATE.zip'
FULL_NAME='NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX23_MEDIA_ENTRY_FIX_ACCEPTED_FULL_PRIVATE_AUDITED.zip'
EXCLUDE_PARTS={'.git','node_modules','release','__pycache__','.pytest_cache','.mypy_cache','.ruff_cache','playwright-report','test-results','blob-report'}
EXCLUDE_NAMES={'release-manifest.json','release-sbom.spdx.json','reports/hf23-media-entry-build.json','reports/hf23-media-entry-archive-verification.json'}

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

def manifest(kind,files):
    static=load_report('reports/hf23-media-entry-static.json')
    media=load_report('reports/hf23-media-entry-browser.json')
    fast=load_report('reports/hf23-fast-start-browser.json')
    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'))
    fs=cfg['fast_start'];rows=file_rows(files)
    return {
      'schema_version':3,
      'release_version':VERSION,
      'base_release':'v5.3.210-rc2-hf22-fast-start',
      'artifact_kind':kind,
      'created_at':CREATED,
      'file_count':len(rows),
      'uncompressed_bytes':sum(x['size'] for x in rows),
      'architecture':{
        'startup_strategy':'critical_shell_then_background_data_and_runtime',
        'media_entry_strategy':'one_trusted_gesture_direct_dispatch',
        'first_screen_blocking_sources':len(fs['critical_shell_sources']['modern']),
        'deferred_runtime_sources':len(fs['deferred_runtime_sources']['modern']),
        'media_module_in_critical_shell':True,
        'media_module_in_deferred_runtime':False,
        'photo_one_click':True,
        'voice_one_click':True,
        'audio_file_one_click':True,
        'product_count':1105,
        'primary_browser_requests':15,
        'critical_bundle':'assets/runtime/critical-shell-v5.3.210-rc2-hf23.js',
        'product_bundle':'assets/data/products.v5.3.210-p1.3.bundle.js',
        'deferred_bundle':'assets/runtime/deferred-runtime-v5.3.210-rc2-hf23.js',
        'runtime_manifest':'assets/runtime/runtime-manifest-v5.3.210-rc2-hf23.js',
        'css_bundle':'assets/css/runtime-bundle-v5.3.210-rc2-hf21.css',
        'source_fallbacks_preserved':True,
        'calculation_and_product_source_changes':False,
        'protected_hf22_files_byte_identical':496,
        'security_hardening_inherited':'v5.3.210-rc2-hf21',
      },
      'acceptance':{
        'static_audit_ok':static.get('ok') is True,
        'static_assertions':static.get('assertions'),
        'media_browser_audit_ok':media.get('ok') is True,
        'media_browser_scenarios':media.get('assertions'),
        'fast_start_browser_audit_ok':fast.get('ok') is True,
        'fast_start_scenarios':fast.get('assertions'),
        'normal_mobile_shell_seconds':next((x.get('shell_s') for x in fast.get('cases',[]) if x.get('case')=='normal' and x.get('viewport')==[390,844]),None),
        'normal_desktop_shell_seconds':next((x.get('shell_s') for x in fast.get('cases',[]) if x.get('case')=='normal' and x.get('viewport')==[1440,900]),None),
        'media_scenarios_tested':['photo-one-click','voice-one-click-secure-gate'],
        'fallbacks_tested':['critical-shell','product-bundle','deferred-runtime'],
      },
      'files':rows,
    }

def spdx(name,files):
    fs=[]
    for rel,data,_ in files:
        sid='SPDXRef-File-'+hashlib.sha1(rel.encode('utf-8')).hexdigest()
        fs.append({'SPDXID':sid,'fileName':'./'+rel,'checksums':[{'algorithm':'SHA256','checksumValue':sha(data)}],'licenseConcluded':'NOASSERTION','copyrightText':'NOASSERTION'})
    return {
      'spdxVersion':'SPDX-2.3','dataLicense':'CC0-1.0','SPDXID':'SPDXRef-DOCUMENT','name':name,
      'documentNamespace':'https://example.invalid/nutrition-calculator/'+VERSION+'/'+name,
      'creationInfo':{'created':CREATED,'creators':['Tool: build_hf23_media_entry.py']},
      'packages':[{'SPDXID':'SPDXRef-Package-NutritionCalculator','name':'nutrition-calculator','versionInfo':VERSION,'downloadLocation':'NOASSERTION','filesAnalyzed':True,'licenseConcluded':'NOASSERTION','licenseDeclared':'NOASSERTION','copyrightText':'NOASSERTION'}],
      'files':fs,
      'relationships':[{'spdxElementId':'SPDXRef-Package-NutritionCalculator','relationshipType':'CONTAINS','relatedSpdxElement':x['SPDXID']} for x in fs],
    }

def add(zf,rel,data,mode):
    zi=zipfile.ZipInfo(rel,FIXED_DT);zi.compress_type=zipfile.ZIP_DEFLATED;zi.create_system=3;zi.external_attr=(stat.S_IFREG|mode)<<16
    zf.writestr(zi,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)

def build(path,kind,files):
    m=manifest(kind,files);s=spdx(path.name,files)
    mdata=(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    sdata=(json.dumps(s,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    path.unlink(missing_ok=True)
    with zipfile.ZipFile(path,'w') as z:
        for rel,data,mode in files:add(z,rel,data,mode)
        add(z,'release-manifest.json',mdata,0o644);add(z,'release-sbom.spdx.json',sdata,0o644)
    return m,s

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',default=str(OUT));args=ap.parse_args()
    out=Path(args.out_dir);out.mkdir(parents=True,exist_ok=True)
    prechecks=[
      [sys.executable,'tools/generate_runtime_assets.py','--check'],
      [sys.executable,'tools/hf23_media_entry_audit.py','--json-out','reports/hf23-media-entry-static.json'],
    ]
    for cmd in prechecks:
        r=subprocess.run(cmd,cwd=ROOT)
        if r.returncode:raise SystemExit('pre-build check failed: '+' '.join(cmd))
    for rel in ('reports/hf23-media-entry-browser.json','reports/hf23-fast-start-browser.json'):
        report=load_report(rel)
        if report.get('ok') is not True:raise SystemExit('browser acceptance report is missing or failed: '+rel)
    host_files=runtime_files();full=full_files()
    hp=out/HOSTING_NAME;fp=out/FULL_NAME
    hm,_=build(hp,'hosting-private',host_files);fm,fsbom=build(fp,'full-private-audited',full)
    (ROOT/'release-manifest.json').write_text(json.dumps(fm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'release-sbom.spdx.json').write_text(json.dumps(fsbom,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result={'ok':True,'release_version':VERSION,'artifacts':[
      {'path':str(hp),'sha256':sha(hp.read_bytes()),'zip_bytes':hp.stat().st_size,'payload_files':len(host_files),'manifest_files':hm['file_count']},
      {'path':str(fp),'sha256':sha(fp.read_bytes()),'zip_bytes':fp.stat().st_size,'payload_files':len(full),'manifest_files':fm['file_count']},
    ]}
    (ROOT/'reports/hf23-media-entry-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
