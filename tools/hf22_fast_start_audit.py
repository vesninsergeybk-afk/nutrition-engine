#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf22-fast-start'

def sha(path:Path)->str: return hashlib.sha256(path.read_bytes()).hexdigest()
def strip_query(url:str)->str: return url.split('?',1)[0].lstrip('./')

def load_manifest():
    text=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf22.js').read_text(encoding='utf-8')
    m=re.search(r'var m=(\{.*\});if\(Object\.freeze',text)
    if not m: raise ValueError('runtime manifest payload not found')
    return json.loads(m.group(1))

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--json-out'); args=ap.parse_args()
    checks=[]
    def add(name,passed,detail=''):
        checks.append({'name':name,'passed':bool(passed),'detail':str(detail)})

    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8'))
    manifest=load_manifest(); fs=cfg.get('fast_start',{})
    add('config release version',cfg.get('release_version')==VERSION,cfg.get('release_version'))
    add('manifest release version',manifest.get('version')==VERSION,manifest.get('version'))
    add('fast start enabled',fs.get('enabled') is True and manifest.get('fastStart',{}).get('blockingPhase')=='critical-shell-only')

    for name in ('index.html','index-v5.3.210.html'):
        text=(ROOT/name).read_text(encoding='utf-8')
        add(name+' version handshake',VERSION in text and 'runtime-manifest-v5.3.210-rc2-hf22.js' in text)
        add(name+' release metadata','data-performance-release="hf22-fast-start"' in text and 'data-build-date="2026-07-25"' in text)
    selector=(ROOT/'assets/js/00-runtime-selector-v5.3.210.js').read_text(encoding='utf-8')
    boot=(ROOT/'assets/js/00-runtime-bootstrap-v5.3.210.js').read_text(encoding='utf-8')
    legacy=(ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js').read_text(encoding='utf-8')
    add('selector version handshake',("RELEASE_VERSION='"+VERSION+"'") in selector)
    add('modern bootstrap version handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in boot)
    add('legacy bootstrap version handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in legacy)
    add('two-phase runtime contract',all(token in boot for token in ('__APP_SHELL_READY_PROMISE__','__APP_BACKGROUND_READY__','loadCriticalShell','loadProducts','loadRuntime')))
    add('route guard contract','data-runtime-phase' in boot and 'shell-ready' in boot and 'background' in boot)

    # Ensure all manifest runtime references exist.
    urls=[]
    for key in ('productJsonChunks','productScriptChunks','modernCoreScripts','legacyCoreScripts','selftestScripts','diagnosticScripts'):
        urls.extend(manifest.get(key,[]))
    urls.extend(manifest.get('criticalShellScripts',{}).get('modern',[])); urls.extend(manifest.get('criticalShellScripts',{}).get('legacy',[]))
    urls.extend(manifest.get('criticalShellSources',{}).get('modern',[])); urls.extend(manifest.get('criticalShellSources',{}).get('legacy',[]))
    urls.extend(manifest.get('deferredRuntimeSources',{}).get('modern',[])); urls.extend(manifest.get('deferredRuntimeSources',{}).get('legacy',[]))
    urls.extend(manifest.get('deferredRuntimeBundles',{}).values())
    urls.extend([manifest.get('productBundleScript',''),manifest.get('performanceScript','')])
    missing=sorted({strip_query(u) for u in urls if u and not (ROOT/strip_query(u)).is_file()})
    add('all runtime references exist',not missing,', '.join(missing[:10]))

    # Product bundle must be exactly the canonical 12 JSON chunks in order.
    products=[]
    for url in cfg['product_json_chunks']:
        products.extend(json.loads((ROOT/strip_query(url)).read_text(encoding='utf-8')))
    bundle_text=(ROOT/'assets/data/products.v5.3.210-p1.3.bundle.js').read_text(encoding='utf-8')
    match=re.fullmatch(r'/\* HF22 single-request product bundle generated from canonical JSON chunks\. \*/\nwindow\.__PRODUCTS_BUNDLE__=(.*);\n',bundle_text,re.S)
    bundled=json.loads(match.group(1)) if match else None
    keys=[x.get('key') for x in products]
    add('canonical product bundle payload',bundled==products,f'{len(products)} products')
    add('product count and unique keys',len(products)==1105 and len(set(keys))==1105 and None not in keys,f'products={len(products)}, unique={len(set(keys))}')

    # Bundle source order and content are reproducible through the generator.
    r=subprocess.run([sys.executable,'tools/generate_runtime_assets.py','--check'],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    add('generated runtime assets are current',r.returncode==0,r.stdout[-1200:])

    critical_mod=fs['critical_shell_sources']['modern']; critical_leg=fs['critical_shell_sources']['legacy']
    deferred_mod=fs['deferred_runtime_sources']['modern']; deferred_leg=fs['deferred_runtime_sources']['legacy']
    add('critical shell size is bounded',len(critical_mod)==3 and len(critical_leg)==3,f'modern={len(critical_mod)}, legacy={len(critical_leg)}')
    add('deferred source coverage',len(deferred_mod)==74 and len(deferred_leg)==74,f'modern={len(deferred_mod)}, legacy={len(deferred_leg)}')
    add('modern sources partition core',set(critical_mod).isdisjoint(deferred_mod) and set(critical_mod+deferred_mod)==set(cfg['modern_core_scripts']))
    add('legacy sources partition core',set(critical_leg).isdisjoint(deferred_leg) and set(critical_leg+deferred_leg)==set(cfg['legacy_core_scripts']))

    # Verify retained HF21 files are byte-identical to the approved baseline hashes recorded at implementation time.
    integ=json.loads((ROOT/'config/hf22-fast-start-integrity.json').read_text(encoding='utf-8'))
    bad=[]
    for row in integ['verified_unchanged_files']:
        p=ROOT/row['path']
        if not p.is_file() or sha(p)!=row['sha256']: bad.append(row['path'])
    add('HF21 protected files unchanged',not bad,f"{len(integ['verified_unchanged_files'])} checked; changed: {', '.join(bad[:10])}")

    syntax_files=[
      'assets/js/00-runtime-selector-v5.3.210.js','assets/js/00-runtime-bootstrap-v5.3.210.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js',
      'assets/runtime/runtime-manifest-v5.3.210-rc2-hf22.js','assets/runtime/critical-shell-v5.3.210-rc2-hf22.js','assets/runtime/critical-shell-v5.3.210-rc2-hf22.legacy.js',
      'assets/runtime/deferred-runtime-v5.3.210-rc2-hf22.js','assets/runtime/deferred-runtime-v5.3.210-rc2-hf22.legacy.js','assets/data/products.v5.3.210-p1.3.bundle.js'
    ]
    syntax_bad=[]
    for rel in syntax_files:
        rr=subprocess.run(['node','--check',rel],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        if rr.returncode: syntax_bad.append(rel+': '+rr.stdout[-300:])
    add('active JavaScript syntax',not syntax_bad,' | '.join(syntax_bad))

    inv=subprocess.run([sys.executable,'tools/runtime_inventory.py'],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    add('runtime closure complete',inv.returncode==0,inv.stdout[-800:])

    regression_suites=[
      ('formula registry regression',['node','tests/p1-4-formula-registry.test.js']),
      ('navigation shell regression',['node','tests/navigation-shell-parallel.test.js']),
      ('profile and needs regression',['node','tests/workspace-profile-needs-hf8.test.js']),
      ('entry UX HF22 regression',['node','tests/workspace-entry-ux-hf22.test.js']),
    ]
    for name,cmd in regression_suites:
        rr=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        add(name,rr.returncode==0,rr.stdout[-1000:])

    result={'ok':all(x['passed'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks}
    if args.json_out:
        p=Path(args.json_out); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)

if __name__=='__main__': main()
