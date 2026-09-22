#!/usr/bin/env python3
from __future__ import annotations
import argparse, gzip, hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'config/runtime-assets.v5.3.210-rc2.json'
CSS_BUNDLE=ROOT/'assets/css/runtime-bundle-v5.3.210-rc2-hf21.css'
MANIFEST_JS=ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf24.js'
PRODUCT_BUNDLE=ROOT/'assets/data/products.v5.3.210-p1.3.bundle.js'
PRODUCT_COMPRESSED=ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz'
CRITICAL_MODERN=ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf24.js'
CRITICAL_LEGACY=ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf24.legacy.js'
DEFERRED_MODERN=ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js'
DEFERRED_LEGACY=ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js'
DEFERRED_MODERN_GZIP=ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz'
DEFERRED_LEGACY_GZIP=ROOT/'assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js.gz'


def digest(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()


def strip_query(url:str)->str:
    return url.split('?',1)[0].lstrip('./')


def load_config():
    data=json.loads(CONFIG.read_text(encoding='utf-8'))
    required={'release_version','css_sources','product_json_chunks','product_script_chunks','modern_core_scripts','legacy_core_scripts','selftest_scripts','diagnostic_scripts','performance_script','fast_start'}
    missing=required-set(data)
    if missing: raise SystemExit('runtime config missing: '+', '.join(sorted(missing)))
    return data


def validate_urls(cfg):
    missing=[]
    list_keys=('product_json_chunks','product_script_chunks','modern_core_scripts','legacy_core_scripts','selftest_scripts','diagnostic_scripts')
    for key in list_keys:
        for url in cfg[key]:
            rel=strip_query(url)
            if not (ROOT/rel).is_file(): missing.append(f'{key}: {rel}')
    rel=strip_query(cfg['performance_script'])
    if not (ROOT/rel).is_file(): missing.append(f'performance_script: {rel}')
    fs=cfg['fast_start']
    for key in ('critical_shell_scripts','critical_shell_sources','deferred_runtime_sources'):
        value=fs[key]
        for mode in ('modern','legacy'):
            for url in value[mode]:
                rel=strip_query(url)
                # Generated bundles may not exist before generation.
                if key!='critical_shell_scripts' and not (ROOT/rel).is_file(): missing.append(f'fast_start.{key}.{mode}: {rel}')
    for mode,url in fs['deferred_runtime_bundles'].items():
        if mode not in {'modern','legacy'}: missing.append(f'fast_start.deferred_runtime_bundles: invalid mode {mode}')
    for name,url in fs.get('lazy_feature_scripts',{}).items():
        rel=strip_query(url)
        if not (ROOT/rel).is_file(): missing.append(f'fast_start.lazy_feature_scripts.{name}: {rel}')
    if missing: raise SystemExit('runtime manifest has missing files:\n'+'\n'.join(missing))


def build_css(cfg):
    # HF21 security hardening retained a reviewed CSS bundle whose final patch is
    # not represented as a standalone source layer. Do not silently rebuild it.
    if not CSS_BUNDLE.is_file(): raise SystemExit(f'missing reviewed CSS bundle: {CSS_BUNDLE.relative_to(ROOT)}')
    inventory=[]
    for rel in cfg['css_sources']:
        path=ROOT/rel
        if not path.is_file(): raise SystemExit(f'missing CSS source: {rel}')
        raw=path.read_bytes(); inventory.append({'path':rel,'sha256':digest(raw),'size':len(raw)})
    output=CSS_BUNDLE.read_bytes()
    return inventory,digest(output)


def build_script_bundle(urls, out_path:Path, header:str):
    chunks=[header+'\n']
    inventory=[]
    for url in urls:
        rel=strip_query(url); path=ROOT/rel
        raw=path.read_bytes(); text=raw.decode('utf-8'); h=digest(raw)
        inventory.append({'path':rel,'sha256':h,'size':len(raw)})
        chunks.append(f'\n/* BEGIN {rel} */\n')
        chunks.append(text)
        if not text.endswith('\n'): chunks.append('\n')
        chunks.append(f'\n;\n/* END {rel} */\n')
    output=''.join(chunks).encode('utf-8')
    out_path.parent.mkdir(parents=True,exist_ok=True); out_path.write_bytes(output)
    return inventory,digest(output)


def build_gzip(source:Path,target:Path):
    raw=source.read_bytes(); target.write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))
    return digest(target.read_bytes()),len(target.read_bytes())


def build_product_bundle(cfg):
    products=[]
    source_inventory=[]
    for url in cfg['product_json_chunks']:
        rel=strip_query(url); path=ROOT/rel; raw=path.read_bytes(); items=json.loads(raw)
        if not isinstance(items,list): raise SystemExit(f'product chunk must be an array: {rel}')
        products.extend(items)
        source_inventory.append({'path':rel,'sha256':digest(raw),'size':len(raw),'products':len(items)})
    keys=[x.get('key') for x in products]
    if len(products)!=1105 or len(set(keys))!=len(keys) or None in keys:
        raise SystemExit(f'product bundle integrity failed: products={len(products)}, unique_keys={len(set(keys))}')
    payload=json.dumps(products,ensure_ascii=False,separators=(',',':'))
    text='/* HF23 single-request product bundle generated from canonical JSON chunks. */\nwindow.__PRODUCTS_BUNDLE__='+payload+';\n'
    PRODUCT_BUNDLE.parent.mkdir(parents=True,exist_ok=True); PRODUCT_BUNDLE.write_text(text,encoding='utf-8')
    compact=(json.dumps(products,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
    PRODUCT_COMPRESSED.write_bytes(gzip.compress(compact,compresslevel=9,mtime=0))
    return source_inventory,digest(text.encode('utf-8')),len(products),digest(PRODUCT_COMPRESSED.read_bytes()),len(PRODUCT_COMPRESSED.read_bytes())


def build_manifest_js(cfg, css_inventory, css_sha, product_count):
    fs=cfg['fast_start']
    payload={
      'schemaVersion':1,
      'version':cfg['release_version'],
      'cssBundle':{'url':'./assets/css/runtime-bundle-v5.3.210-rc2-hf21.css?v='+cfg['release_version'],'sha256':css_sha,'sourceCount':len(css_inventory)},
      'productJsonChunks':cfg['product_json_chunks'],
      'productScriptChunks':cfg['product_script_chunks'],
      'modernCoreScripts':cfg['modern_core_scripts'],
      'legacyCoreScripts':cfg['legacy_core_scripts'],
      'selftestScripts':cfg['selftest_scripts'],
      'legacySelftestScripts':cfg.get('legacy_selftest_scripts',[]),
      'diagnosticScripts':cfg['diagnostic_scripts'],
      'performanceScript':cfg['performance_script'],
      'criticalShellScripts':fs['critical_shell_scripts'],
      'deferredRuntimeBundles':fs['deferred_runtime_bundles'],
      'deferredRuntimeCompressed':fs.get('deferred_runtime_compressed',{}),
      'productBundleScript':fs['product_bundle_script'],
      'productCompressedJson':fs.get('product_compressed_json',''),
      'lazyFeatureScripts':{'geminiMediaImport':fs.get('lazy_feature_scripts',{}).get('gemini_media_import','')},
      'fastStart':{
        'schemaVersion':1,
        'blockingPhase':'critical-shell-only',
        'backgroundPhase':['product-bundle','deferred-runtime-bundle'],
        'criticalShellSourceCount':len(fs['critical_shell_sources']['modern']),
        'deferredModernSourceCount':len(fs['deferred_runtime_sources']['modern']),
        'deferredLegacySourceCount':len(fs['deferred_runtime_sources']['legacy']),
        'productCount':product_count,
        'mediaModuleLazy':True,
      },
      'criticalShellSources':fs['critical_shell_sources'],
      'deferredRuntimeSources':fs['deferred_runtime_sources'],
    }
    encoded=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
    text=("/* Generated runtime manifest. ES5-safe; do not edit directly. */\n"
          "(function(w){'use strict';var m="+encoded+";"
          "if(Object.freeze){try{Object.freeze(m);}catch(_){}}"
          "w.__NUTRITION_RUNTIME_MANIFEST__=m;})(window);\n")
    MANIFEST_JS.parent.mkdir(parents=True,exist_ok=True); MANIFEST_JS.write_text(text,encoding='utf-8')
    return digest(text.encode('utf-8'))


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); ap.add_argument('--json-out'); args=ap.parse_args()
    cfg=load_config(); validate_urls(cfg)
    outputs=[CSS_BUNDLE,MANIFEST_JS,PRODUCT_BUNDLE,PRODUCT_COMPRESSED,CRITICAL_MODERN,CRITICAL_LEGACY,DEFERRED_MODERN,DEFERRED_LEGACY,DEFERRED_MODERN_GZIP,DEFERRED_LEGACY_GZIP]
    old={p:p.read_bytes() if p.exists() else None for p in outputs}
    css_inventory,css_sha=build_css(cfg)
    fs=cfg['fast_start']
    critical_modern,critical_modern_sha=build_script_bundle(fs['critical_shell_sources']['modern'],CRITICAL_MODERN,'/* HF24 critical shell bundle; generated, calculation-neutral. */')
    critical_legacy,critical_legacy_sha=build_script_bundle(fs['critical_shell_sources']['legacy'],CRITICAL_LEGACY,'/* HF24 critical shell bundle; generated, calculation-neutral. */')
    deferred_modern,deferred_modern_sha=build_script_bundle(fs['deferred_runtime_sources']['modern'],DEFERRED_MODERN,'/* HF24 deferred runtime bundle; generated in manifest order. */')
    deferred_legacy,deferred_legacy_sha=build_script_bundle(fs['deferred_runtime_sources']['legacy'],DEFERRED_LEGACY,'/* HF24 deferred runtime bundle; generated in manifest order. */')
    deferred_modern_gzip_sha,deferred_modern_gzip_bytes=build_gzip(DEFERRED_MODERN,DEFERRED_MODERN_GZIP)
    deferred_legacy_gzip_sha,deferred_legacy_gzip_bytes=build_gzip(DEFERRED_LEGACY,DEFERRED_LEGACY_GZIP)
    product_inventory,product_sha,product_count,product_gzip_sha,product_gzip_bytes=build_product_bundle(cfg)
    manifest_sha=build_manifest_js(cfg,css_inventory,css_sha,product_count)
    changed=[p.relative_to(ROOT).as_posix() for p in outputs if old[p]!=p.read_bytes()]
    result={
      'ok':True,'release_version':cfg['release_version'],'changed':changed,
      'css':{'sources':len(css_inventory),'sha256':css_sha},
      'critical_shell':{'modern_sources':len(critical_modern),'legacy_sources':len(critical_legacy),'modern_sha256':critical_modern_sha,'legacy_sha256':critical_legacy_sha},
      'deferred_runtime':{'modern_sources':len(deferred_modern),'legacy_sources':len(deferred_legacy),'modern_sha256':deferred_modern_sha,'legacy_sha256':deferred_legacy_sha,'modern_gzip_sha256':deferred_modern_gzip_sha,'legacy_gzip_sha256':deferred_legacy_gzip_sha,'modern_gzip_bytes':deferred_modern_gzip_bytes,'legacy_gzip_bytes':deferred_legacy_gzip_bytes},
      'products':{'sources':len(product_inventory),'count':product_count,'sha256':product_sha,'gzip_sha256':product_gzip_sha,'gzip_bytes':product_gzip_bytes},
      'manifest_sha256':manifest_sha,
    }
    if args.json_out:
        p=Path(args.json_out); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if args.check and changed: raise SystemExit('generated runtime assets were stale: '+', '.join(changed))

if __name__=='__main__': main()
