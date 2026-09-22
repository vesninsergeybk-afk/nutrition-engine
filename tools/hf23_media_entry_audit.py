#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re, shutil, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf23-media-entry-fix'
DEFAULT_BASELINE=Path('/mnt/data/hf22full')
MEDIA='assets/js/62-gemini-ration-import-v5.js'
ENTRY='assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf23.js'
ENTRY_LEGACY='assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf23.js'

def sha(path:Path)->str:return hashlib.sha256(path.read_bytes()).hexdigest()
def clean(url:str)->str:return url.split('?',1)[0].lstrip('./')
def run(cmd):return subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)

def load_manifest():
    text=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf23.js').read_text(encoding='utf-8')
    m=re.search(r'var m=(\{.*\});if\(Object\.freeze',text)
    if not m:raise ValueError('runtime manifest payload not found')
    return json.loads(m.group(1))

def protected_diff(baseline:Path):
    protected_dirs=('data','api','assets/data','assets/css','assets/js','assets/legacy/js')
    allowed_changed={
      'assets/js/00-runtime-bootstrap-v5.3.210.js',
      'assets/js/00-runtime-selector-v5.3.210.js',
      'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js',
      'assets/data/products.v5.3.210-p1.3.bundle.js',
    }
    checked=[];changed=[];missing=[]
    for top in protected_dirs:
        base_dir=baseline/top
        if not base_dir.is_dir():continue
        for bp in sorted(base_dir.rglob('*')):
            if not bp.is_file():continue
            rel=bp.relative_to(baseline).as_posix()
            if rel in allowed_changed:continue
            cp=ROOT/rel
            if not cp.is_file():missing.append(rel);continue
            checked.append(rel)
            if sha(bp)!=sha(cp):changed.append(rel)
    return checked,changed,missing

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--json-out');ap.add_argument('--baseline',default=str(DEFAULT_BASELINE));args=ap.parse_args()
    checks=[]
    def add(name,passed,detail=''):checks.append({'name':name,'passed':bool(passed),'detail':str(detail)})

    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'))
    manifest=load_manifest();fs=cfg.get('fast_start',{})
    add('config release version',cfg.get('release_version')==VERSION,cfg.get('release_version'))
    add('manifest release version',manifest.get('version')==VERSION,manifest.get('version'))
    add('fast start retained',fs.get('enabled') is True and manifest.get('fastStart',{}).get('blockingPhase')=='critical-shell-only')

    for name in ('index.html','index-v5.3.210.html'):
        text=(ROOT/name).read_text(encoding='utf-8')
        add(name+' HF23 handshake',VERSION in text and 'runtime-manifest-v5.3.210-rc2-hf23.js' in text)
        add(name+' release metadata','data-performance-release="hf23-media-entry-fix"' in text and 'data-build-date="2026-07-25"' in text)
    selector=(ROOT/'assets/js/00-runtime-selector-v5.3.210.js').read_text(encoding='utf-8')
    boot=(ROOT/'assets/js/00-runtime-bootstrap-v5.3.210.js').read_text(encoding='utf-8')
    legacy_boot=(ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js').read_text(encoding='utf-8')
    add('selector HF23 handshake',("RELEASE_VERSION='"+VERSION+"'") in selector)
    add('modern bootstrap HF23 handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in boot)
    add('legacy bootstrap HF23 handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in legacy_boot)

    critical_mod=[clean(x) for x in fs['critical_shell_sources']['modern']]
    critical_leg=[clean(x) for x in fs['critical_shell_sources']['legacy']]
    deferred_mod=[clean(x) for x in fs['deferred_runtime_sources']['modern']]
    deferred_leg=[clean(x) for x in fs['deferred_runtime_sources']['legacy']]
    add('media module in critical modern shell',critical_mod.count(MEDIA)==1,critical_mod)
    add('media module in critical legacy shell',critical_leg.count(MEDIA)==1,critical_leg)
    add('media module absent from deferred shells',MEDIA not in deferred_mod and MEDIA not in deferred_leg)
    add('HF23 entry controllers in critical shells',ENTRY in critical_mod and ENTRY_LEGACY in critical_leg)
    add('core source partitions remain complete',set(critical_mod).isdisjoint(deferred_mod) and set(critical_mod+deferred_mod)==set(clean(x) for x in cfg['modern_core_scripts']))
    add('legacy source partitions remain complete',set(critical_leg).isdisjoint(deferred_leg) and set(critical_leg+deferred_leg)==set(clean(x) for x in cfg['legacy_core_scripts']))

    entry=(ROOT/ENTRY).read_text(encoding='utf-8');entry_legacy=(ROOT/ENTRY_LEGACY).read_text(encoding='utf-8')
    add('modern and legacy entry controllers identical',entry==entry_legacy)
    add('one-click photo/audio dispatch','target.click()' in entry and 'separate visible click inside AI block' not in entry)
    add('one-click voice dispatch','NutritionGeminiRationImport.startLiveRecording()' in entry)
    add('media availability guard','if(target.disabled)return' in entry)

    crit=(ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf23.js').read_text(encoding='utf-8')
    deff=(ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf23.js').read_text(encoding='utf-8')
    add('critical bundle contains media and HF23 controller','NutritionGeminiRationImport' in crit and 'NutritionWorkspaceEntryUXHF23' in crit)
    add('deferred bundle excludes media implementation','window.NutritionGeminiRationImport={' not in deff and 'NutritionWorkspaceEntryUXHF23' not in deff)

    urls=[]
    for key in ('productJsonChunks','productScriptChunks','modernCoreScripts','legacyCoreScripts','selftestScripts','diagnosticScripts'):
        urls.extend(manifest.get(key,[]))
    for key in ('criticalShellScripts','criticalShellSources'):
        urls.extend(manifest.get(key,{}).get('modern',[]));urls.extend(manifest.get(key,{}).get('legacy',[]))
    urls.extend(manifest.get('deferredRuntimeSources',{}).get('modern',[]));urls.extend(manifest.get('deferredRuntimeSources',{}).get('legacy',[]))
    urls.extend(manifest.get('deferredRuntimeBundles',{}).values())
    urls.extend([manifest.get('productBundleScript',''),manifest.get('performanceScript','')])
    missing=sorted({clean(x) for x in urls if x and not (ROOT/clean(x)).is_file()})
    add('all runtime references exist',not missing,', '.join(missing[:10]))

    products=[]
    for url in cfg['product_json_chunks']:
        products.extend(json.loads((ROOT/clean(url)).read_text(encoding='utf-8')))
    keys=[x.get('key') for x in products]
    add('product count and unique keys',len(products)==1105 and len(set(keys))==1105 and None not in keys,f'products={len(products)}, unique={len(set(keys))}')

    gen=run([sys.executable,'tools/generate_runtime_assets.py','--check'])
    add('generated runtime assets are current',gen.returncode==0,gen.stdout[-1000:])
    inv=run([sys.executable,'tools/runtime_inventory.py'])
    add('runtime closure complete',inv.returncode==0,inv.stdout[-700:])

    syntax_files=[
      'assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js',
      ENTRY,ENTRY_LEGACY,'assets/js/62-gemini-ration-import-v5.js','assets/runtime/runtime-manifest-v5.3.210-rc2-hf23.js',
      'assets/runtime/critical-shell-v5.3.210-rc2-hf23.js','assets/runtime/critical-shell-v5.3.210-rc2-hf23.legacy.js',
      'assets/runtime/deferred-runtime-v5.3.210-rc2-hf23.js','assets/runtime/deferred-runtime-v5.3.210-rc2-hf23.legacy.js'
    ]
    syntax_bad=[]
    for rel in syntax_files:
        rr=run(['node','--check',rel])
        if rr.returncode:syntax_bad.append(rel+': '+rr.stdout[-250:])
    add('active JavaScript syntax',not syntax_bad,' | '.join(syntax_bad))

    baseline=Path(args.baseline).resolve()
    if baseline.is_dir():
        protected,changed,baseline_missing=protected_diff(baseline)
        add('HF22 protected calculation, data, API and CSS files unchanged',not changed and not baseline_missing,f'{len(protected)} checked; changed={changed[:8]}; missing={baseline_missing[:8]}')
        current_bundle=(ROOT/'assets/data/products.v5.3.210-p1.3.bundle.js').read_text(encoding='utf-8').split('=',1)[1]
        baseline_bundle=(baseline/'assets/data/products.v5.3.210-p1.3.bundle.js').read_text(encoding='utf-8').split('=',1)[1]
        add('product bundle payload unchanged from HF22',current_bundle==baseline_bundle)
    else:
        add('HF22 protected baseline available',False,str(baseline))

    if shutil.which('php'):
        php_bad=[]
        for p in sorted((ROOT/'api').glob('*.php')):
            rr=run(['php','-l',str(p.relative_to(ROOT))])
            if rr.returncode:php_bad.append(p.name+': '+rr.stdout[-200:])
        add('PHP API syntax',not php_bad,' | '.join(php_bad))

    suites=[
      ('HF23 media entry contract',['node','tests/ai-media-entry-hf23.test.js']),
      ('formula registry regression',['node','tests/p1-4-formula-registry.test.js']),
      ('normative registry regression',['node','tests/p1-2-normative-registry.test.js']),
      ('navigation shell regression',['node','tests/navigation-shell-parallel.test.js']),
      ('profile and needs regression',['node','tests/workspace-profile-needs-hf8.test.js']),
    ]
    for name,cmd in suites:
        rr=run(cmd);add(name,rr.returncode==0,rr.stdout[-900:])

    result={'ok':all(x['passed'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks}
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
