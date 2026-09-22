#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_VERSION = 'v5.3.210-rc2-hf26-truthful-progress'
VERSION = 'v5.3.210-rc2-hf27-microphone-resilience'
OLD_INTERNAL = 'v5.3.210_rc2_hosting_hotfix_26_truthful_progress'
INTERNAL = 'v5.3.210_rc2_hosting_hotfix_27_microphone_resilience'

MODERN_SOURCES = [
    './assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17',
    './assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18',
    './assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf27.js?v=' + VERSION,
    './assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf27.js?v=' + VERSION,
]
LEGACY_SOURCES = [
    './assets/legacy/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17',
    './assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18',
    './assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf27.js?v=' + VERSION,
    './assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf27.js?v=' + VERSION,
]
MODERN_BUNDLE = './assets/runtime/critical-shell-v5.3.210-rc2-hf27.js?v=' + VERSION
LEGACY_BUNDLE = './assets/runtime/critical-shell-v5.3.210-rc2-hf27.legacy.js?v=' + VERSION
MANIFEST_PATH = ROOT / 'assets/runtime/runtime-manifest-v5.3.210-rc2-hf27.js'

def clean(url: str) -> str:
    return url.split('?', 1)[0].lstrip('./')

def bundle(path: Path, sources: list[str], label: str) -> int:
    pieces = [f'/* HF27 {label} critical shell bundle; generated, calculation-neutral. */\n']
    for url in sources:
        rel = clean(url)
        src = (ROOT / rel).read_text(encoding='utf-8')
        pieces.append(f'\n/* BEGIN {rel} */\n{src.rstrip()}\n/* END {rel} */\n')
    text = ''.join(pieces)
    path.write_text(text, encoding='utf-8')
    return len(text.encode('utf-8'))

def parse_manifest(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    m = re.search(r'var m=(\{.*\});if\(Object\.freeze\)', text, re.S)
    if not m:
        raise RuntimeError('Cannot parse manifest: ' + str(path))
    return json.loads(m.group(1))

def write_manifest(data: dict) -> None:
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    text = "(function(w){'use strict';var m=" + payload + ";if(Object.freeze){try{Object.freeze(m);}catch(_){}}w.__NUTRITION_RUNTIME_MANIFEST__=m;})(window);\n"
    MANIFEST_PATH.write_text(text, encoding='utf-8')

def replace_core(items: list[str], old_segment: str, new_url: str) -> list[str]:
    result=[]; replaced=False
    for item in items:
        if old_segment in item:
            if not replaced:
                result.append(new_url);replaced=True
        else:
            result.append(item)
    if not replaced:
        result.append(new_url)
    return result

def update_config() -> None:
    source = ROOT / 'config/runtime-assets.v5.3.210-rc2-hf26.json'
    cfg = json.loads(source.read_text(encoding='utf-8'))
    cfg['release_version'] = VERSION
    cfg['modern_core_scripts'] = replace_core(cfg['modern_core_scripts'], '89-workspace-entry-ux-', MODERN_SOURCES[-1])
    cfg['legacy_core_scripts'] = replace_core(cfg['legacy_core_scripts'], '89-workspace-entry-ux-', LEGACY_SOURCES[-1])
    fast = cfg['fast_start']
    fast['strategy'] = 'truthful_full_start_with_resilient_mobile_media_entry'
    fast['critical_shell_scripts'] = {'modern':[MODERN_BUNDLE], 'legacy':[LEGACY_BUNDLE]}
    fast['critical_shell_sources'] = {'modern':MODERN_SOURCES, 'legacy':LEGACY_SOURCES}
    fast['product_bundle_script'] = './assets/data/products.v5.3.210-p1.3.bundle.js?v=' + VERSION
    fast['product_compressed_json'] = './assets/data/products.v5.3.210-p1.3.compact.json.gz?v=' + VERSION
    fast['deferred_runtime_bundles'] = {
        'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js?v='+VERSION,
        'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js?v='+VERSION,
    }
    fast['deferred_runtime_compressed'] = {
        'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz?v='+VERSION,
        'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js.gz?v='+VERSION,
    }
    fast['lazy_feature_scripts'] = {'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
    fast['media_module_in_critical_shell'] = False
    fast['media_module_lazy'] = True
    out = ROOT / 'config/runtime-assets.v5.3.210-rc2-hf27.json'
    out.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Keep the generic active config aligned with the actual release.
    (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def copy_runtime_entry(old_rel: str, new_rel: str, legacy: bool=False) -> None:
    text=(ROOT/old_rel).read_text(encoding='utf-8')
    text=text.replace(OLD_VERSION,VERSION).replace(OLD_INTERNAL,INTERNAL)
    text=text.replace('HF26 truthful loader','HF27 resilient media loader')
    text=text.replace('__HF26_READINESS_CHECKS__','__HF27_READINESS_CHECKS__')
    text=text.replace('HF26:','HF27:')
    text=text.replace('hf26-truthful-progress','hf27-microphone-resilience')
    text=text.replace('00-runtime-bootstrap-v5.3.210-hf26.legacy.js','00-runtime-bootstrap-v5.3.210-hf27.legacy.js')
    text=text.replace('00-runtime-bootstrap-v5.3.210-hf26.js','00-runtime-bootstrap-v5.3.210-hf27.js')
    (ROOT/new_rel).write_text(text,encoding='utf-8')

def update_index(path: Path) -> None:
    text=path.read_text(encoding='utf-8')
    text=text.replace('data-build-date="2026-07-26"','data-build-date="2026-07-27"')
    text=text.replace('data-performance-release="hf26-truthful-progress"','data-performance-release="hf27-microphone-resilience"')
    text=text.replace(OLD_VERSION,VERSION)
    text=text.replace('runtime-manifest-v5.3.210-rc2-hf26.js','runtime-manifest-v5.3.210-rc2-hf27.js')
    text=text.replace('00-runtime-selector-v5.3.210-hf26.js','00-runtime-selector-v5.3.210-hf27.js')
    path.write_text(text,encoding='utf-8')

def main() -> None:
    modern_bytes=bundle(ROOT/clean(MODERN_BUNDLE),MODERN_SOURCES,'modern')
    legacy_bytes=bundle(ROOT/clean(LEGACY_BUNDLE),LEGACY_SOURCES,'legacy')
    data=parse_manifest(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf26.js')
    data['version']=VERSION
    data['cssBundle']['url']=re.sub(r'\?v=.*$', '?v='+VERSION, data['cssBundle']['url'])
    data['modernCoreScripts']=replace_core(data['modernCoreScripts'],'89-workspace-entry-ux-',MODERN_SOURCES[-1])
    data['legacyCoreScripts']=replace_core(data['legacyCoreScripts'],'89-workspace-entry-ux-',LEGACY_SOURCES[-1])
    data['criticalShellScripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
    data.pop('criticalShellBundles',None)
    data['criticalShellSources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
    data['productBundleScript']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
    data['productCompressedJson']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
    data['deferredRuntimeBundles']={'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js?v='+VERSION,'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js?v='+VERSION}
    data['deferredRuntimeCompressed']={'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz?v='+VERSION,'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js.gz?v='+VERSION}
    data['lazyFeatureScripts']={'geminiMediaImport':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
    data.setdefault('assetBytes',{})['criticalShellModern']=modern_bytes
    data['assetBytes']['criticalShellLegacy']=legacy_bytes
    write_manifest(data)
    update_config()
    copy_runtime_entry('assets/js/00-runtime-bootstrap-v5.3.210-hf26.js','assets/js/00-runtime-bootstrap-v5.3.210-hf27.js')
    copy_runtime_entry('assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf26.legacy.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf27.legacy.js',True)
    copy_runtime_entry('assets/js/00-runtime-selector-v5.3.210-hf26.js','assets/js/00-runtime-selector-v5.3.210-hf27.js')
    for name in ('index.html','index-v5.3.210.html'):
        update_index(ROOT/name)
    # Make runtime inventory use the release-specific active config.
    inv=ROOT/'tools/runtime_inventory.py'
    t=inv.read_text(encoding='utf-8')
    t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.v5\.3\.210-rc2(?:-hf\d+)?\.json'", "CONFIG=ROOT/'config/runtime-assets.v5.3.210-rc2-hf27.json'", t)
    inv.write_text(t,encoding='utf-8')
    result={'version':VERSION,'criticalShellModern':modern_bytes,'criticalShellLegacy':legacy_bytes,'manifest':str(MANIFEST_PATH.relative_to(ROOT))}
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
