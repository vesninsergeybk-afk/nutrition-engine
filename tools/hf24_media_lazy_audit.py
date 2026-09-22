#!/usr/bin/env python3
from __future__ import annotations
import argparse, gzip, hashlib, json, re, shutil, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf24-media-lazy'
BASELINE=Path('/mnt/data/hf23work')
MEDIA='assets/js/62-gemini-ration-import-v5.js'
BRIDGE='assets/js/90-media-entry-lazy-bridge-v5.3.210-rc2-hf24.js'
ENTRY='assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf24.js'
ENTRY_LEGACY='assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf24.js'
MANIFEST='assets/runtime/runtime-manifest-v5.3.210-rc2-hf24.js'
CRIT='assets/runtime/critical-shell-v5.3.210-rc2-hf24.js'
CRIT_LEG='assets/runtime/critical-shell-v5.3.210-rc2-hf24.legacy.js'
DEF='assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js'
DEF_LEG='assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js'
PROD_GZ='assets/data/products.v5.3.210-p1.3.compact.json.gz'
DEF_GZ='assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz'
DEF_LEG_GZ='assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js.gz'

def sha(path:Path)->str:return hashlib.sha256(path.read_bytes()).hexdigest()
def clean(url:str)->str:return url.split('?',1)[0].lstrip('./')
def run(cmd):return subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
def load_manifest():
    text=(ROOT/MANIFEST).read_text(encoding='utf-8')
    m=re.search(r'var m=(\{.*\});if\(Object\.freeze',text)
    if not m:raise ValueError('runtime manifest payload not found')
    return json.loads(m.group(1))

def protected_diff(baseline:Path):
    protected_dirs=('data','api','assets/data','assets/css','assets/js','assets/legacy/js')
    allowed_changed={
      'assets/js/00-runtime-bootstrap-v5.3.210.js',
      'assets/js/00-runtime-selector-v5.3.210.js',
      'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js',
      MEDIA,
    }
    checked=[];changed=[];missing=[]
    for top in protected_dirs:
        bd=baseline/top
        if not bd.is_dir():continue
        for bp in sorted(bd.rglob('*')):
            if not bp.is_file():continue
            rel=bp.relative_to(baseline).as_posix()
            if rel in allowed_changed:continue
            cp=ROOT/rel
            if not cp.is_file():missing.append(rel);continue
            checked.append(rel)
            if sha(bp)!=sha(cp):changed.append(rel)
    return checked,changed,missing

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--json-out');ap.add_argument('--baseline',default=str(BASELINE));args=ap.parse_args()
    checks=[]
    def add(name,passed,detail=''):checks.append({'name':name,'passed':bool(passed),'detail':str(detail)})

    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'))
    mf=load_manifest();fs=cfg['fast_start']
    add('config release',cfg.get('release_version')==VERSION,cfg.get('release_version'))
    add('manifest release',mf.get('version')==VERSION,mf.get('version'))
    add('fast-start strategy',fs.get('enabled') is True and fs.get('strategy')=='critical_shell_then_lazy_media_and_compressed_background',fs.get('strategy'))
    for name in ('index.html','index-v5.3.210.html'):
        t=(ROOT/name).read_text(encoding='utf-8')
        add(name+' HF24 handshake',VERSION in t and 'runtime-manifest-v5.3.210-rc2-hf24.js' in t)
        add(name+' performance metadata','data-performance-release="hf24-media-lazy"' in t)

    selector=(ROOT/'assets/js/00-runtime-selector-v5.3.210.js').read_text(encoding='utf-8')
    boot=(ROOT/'assets/js/00-runtime-bootstrap-v5.3.210.js').read_text(encoding='utf-8')
    lboot=(ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js').read_text(encoding='utf-8')
    add('selector handshake',("RELEASE_VERSION='"+VERSION+"'") in selector)
    add('modern bootstrap handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in boot)
    add('legacy bootstrap handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in lboot)

    cm=[clean(x) for x in fs['critical_shell_sources']['modern']]
    cl=[clean(x) for x in fs['critical_shell_sources']['legacy']]
    dm=[clean(x) for x in fs['deferred_runtime_sources']['modern']]
    dl=[clean(x) for x in fs['deferred_runtime_sources']['legacy']]
    add('tiny bridge in both critical partitions',BRIDGE in cm and BRIDGE in cl)
    add('HF24 entry controllers in critical partitions',ENTRY in cm and ENTRY_LEGACY in cl)
    add('full media module excluded from startup partitions',MEDIA not in cm and MEDIA not in cl and MEDIA not in dm and MEDIA not in dl)
    add('source partitions complete modern',set(cm).isdisjoint(dm) and set(cm+dm+[MEDIA])==(set(clean(x) for x in cfg['modern_core_scripts'])|{BRIDGE}))
    add('source partitions complete legacy',set(cl).isdisjoint(dl) and set(cl+dl+[MEDIA])==(set(clean(x) for x in cfg['legacy_core_scripts'])|{BRIDGE}))
    add('critical modern bundle below 80 KB',(ROOT/CRIT).stat().st_size<80000,(ROOT/CRIT).stat().st_size)
    add('critical legacy bundle below 80 KB',(ROOT/CRIT_LEG).stat().st_size<80000,(ROOT/CRIT_LEG).stat().st_size)
    add('product gzip below 700 KB',(ROOT/PROD_GZ).stat().st_size<700000,(ROOT/PROD_GZ).stat().st_size)
    add('modern deferred gzip below 700 KB',(ROOT/DEF_GZ).stat().st_size<700000,(ROOT/DEF_GZ).stat().st_size)
    add('legacy deferred gzip below 700 KB',(ROOT/DEF_LEG_GZ).stat().st_size<700000,(ROOT/DEF_LEG_GZ).stat().st_size)

    lazy=mf.get('lazyFeatureScripts',{})
    dc=mf.get('deferredRuntimeCompressed',{})
    add('lazy media module declared',clean(lazy.get('geminiMediaImport',''))==MEDIA,lazy)
    add('compressed product declared',clean(mf.get('productCompressedJson',''))==PROD_GZ,mf.get('productCompressedJson'))
    add('compressed deferred runtime declared',clean(dc.get('modern',''))==DEF_GZ and clean(dc.get('legacy',''))==DEF_LEG_GZ,dc)
    add('manifest runtime references exist',all((ROOT/clean(u)).is_file() for u in [lazy.get('geminiMediaImport',''),mf.get('productCompressedJson',''),dc.get('modern',''),dc.get('legacy','')]))

    bridge=(ROOT/BRIDGE).read_text(encoding='utf-8')
    media=(ROOT/MEDIA).read_text(encoding='utf-8')
    entry=(ROOT/ENTRY).read_text(encoding='utf-8')
    entry_l=(ROOT/ENTRY_LEGACY).read_text(encoding='utf-8')
    add('modern and legacy HF24 entry controllers identical',entry==entry_l)
    add('trusted-gesture microphone request is simple',"navigator.mediaDevices.getUserMedia({audio:true})" in bridge)
    add('microphone policy and secure-context diagnostics',"allowsFeature('microphone')" in bridge and '!w.isSecureContext' in bridge and 'allow="microphone"' in bridge)
    add('media module lazy script singleton',"data-gemini-media-lazy-module" in bridge and 'if(loadPromise)return loadPromise' in bridge)
    add('pre-acquired stream handoff',"startLiveRecordingWithStream(stream)" in bridge and 'function startLiveRecordingWithStream(stream)' in media)
    add('photo and audio lazy ingestion','ingestFiles(files,kind,source)' in bridge and 'async function ingestFiles(files,kind,source)' in media)
    add('full module simple microphone fallback',"getUserMedia({audio:true})" in media)
    add('visible microphone error taxonomy',all(x in bridge for x in ('NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError','SecurityError')))
    add('entry controller delegates to bridge','NutritionMediaEntryBridge' in entry and '.startVoice()' in entry and '.choosePhotos()' in entry)

    with gzip.open(ROOT/PROD_GZ,'rt',encoding='utf-8') as f: products=json.load(f)
    keys=[x.get('key') for x in products]
    add('compressed database contains 1105 unique products',len(products)==1105 and len(set(keys))==1105 and None not in keys,f'count={len(products)}, unique={len(set(keys))}')
    with gzip.open(ROOT/DEF_GZ,'rb') as f: dmod=f.read()
    with gzip.open(ROOT/DEF_LEG_GZ,'rb') as f: dleg=f.read()
    add('modern compressed runtime is exact gzip of bundle',dmod==(ROOT/DEF).read_bytes())
    add('legacy compressed runtime is exact gzip of bundle',dleg==(ROOT/DEF_LEG).read_bytes())

    gen=run([sys.executable,'tools/generate_runtime_assets.py','--check'])
    add('generated runtime reproducible',gen.returncode==0,gen.stdout[-900:])
    inv=run([sys.executable,'tools/runtime_inventory.py','--json-out','reports/hf24-runtime-inventory.json'])
    add('runtime closure complete',inv.returncode==0,inv.stdout[-700:])

    syntax=[
      'assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js',
      BRIDGE,ENTRY,ENTRY_LEGACY,MEDIA,MANIFEST,CRIT,CRIT_LEG,DEF,DEF_LEG]
    bad=[]
    for rel in syntax:
        rr=run(['node','--check',rel])
        if rr.returncode:bad.append(rel+': '+rr.stdout[-200:])
    add('active JavaScript syntax',not bad,' | '.join(bad))

    baseline=Path(args.baseline).resolve()
    if baseline.is_dir():
        protected,changed,missing=protected_diff(baseline)
        add('protected calculation, data, API and CSS files unchanged',not changed and not missing,f'{len(protected)} checked; changed={changed[:10]}; missing={missing[:10]}')
    else:add('HF23 baseline available',False,str(baseline))

    if shutil.which('php'):
        badphp=[]
        for p in sorted((ROOT/'api').glob('*.php')):
            rr=run(['php','-l',str(p.relative_to(ROOT))])
            if rr.returncode:badphp.append(p.name+': '+rr.stdout[-150:])
        add('PHP API syntax',not badphp,' | '.join(badphp))

    suites=[
      ('formula registry regression',['node','tests/p1-4-formula-registry.test.js']),
      ('normative registry regression',['node','tests/p1-2-normative-registry.test.js']),
      ('HEI regression',['node','tests/hei2020-hf3.test.js']),
      ('navigation shell regression',['node','tests/navigation-shell-parallel.test.js']),
      ('profile and needs regression',['node','tests/workspace-profile-needs-hf8.test.js']),
    ]
    for name,cmd in suites:
        rr=run(cmd);add(name,rr.returncode==0,rr.stdout[-900:])

    browser_path=ROOT/'reports/hf24-acceptance-browser.json'
    browser=json.loads(browser_path.read_text(encoding='utf-8')) if browser_path.is_file() else {}
    add('browser acceptance report',browser.get('ok') is True,f"cases={browser.get('assertions')}")

    result={'ok':all(x['passed'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks}
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
