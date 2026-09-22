#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='v5.3.210-rc2-hf27-microphone-resilience'
VERSION='v5.3.210-rc2-hf28-gemini-reliability'
BASE_INTERNAL='v5.3.210_rc2_hosting_hotfix_27_microphone_resilience'
INTERNAL='v5.3.210_rc2_hosting_hotfix_28_gemini_reliability'
DATE='2026-08-04'
MODERN_SOURCES=[
 './assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17',
 './assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18',
 './assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js?v='+VERSION,
 './assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf28.js?v='+VERSION,
]
LEGACY_SOURCES=[
 './assets/legacy/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17',
 './assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18',
 './assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js?v='+VERSION,
 './assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf28.js?v='+VERSION,
]
MODERN_BUNDLE='./assets/runtime/critical-shell-v5.3.210-rc2-hf28.js?v='+VERSION
LEGACY_BUNDLE='./assets/runtime/critical-shell-v5.3.210-rc2-hf28.legacy.js?v='+VERSION
MANIFEST=ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js'

def clean(url:str)->str:return url.split('?',1)[0].lstrip('./')
def bundle(path:Path,sources:list[str],label:str)->int:
    pieces=[f'/* HF28 {label} critical shell bundle; generated, calculation-neutral. */\n']
    for url in sources:
        rel=clean(url); pieces.append(f'\n/* BEGIN {rel} */\n{(ROOT/rel).read_text(encoding="utf-8").rstrip()}\n/* END {rel} */\n')
    text=''.join(pieces); path.write_text(text,encoding='utf-8'); return len(text.encode())
def parse_manifest(path:Path)->dict:
    text=path.read_text(encoding='utf-8'); m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',text,re.S)
    if not m: raise RuntimeError('cannot parse '+str(path))
    return json.loads(m.group(1))
def write_manifest(data:dict):
    payload=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    MANIFEST.write_text("(function(w){'use strict';var m="+payload+";if(Object.freeze){try{Object.freeze(m);}catch(_){}}w.__NUTRITION_RUNTIME_MANIFEST__=m;})(window);\n",encoding='utf-8')
def replace_one(items:list[str],needle:str,value:str)->list[str]:
    out=[]; done=False
    for item in items:
        if needle in item:
            if not done: out.append(value); done=True
        else: out.append(item)
    if not done: out.append(value)
    return out
def update_queries(items:list[str])->list[str]:
    out=[]
    for item in items:
        if '61-ai-nutrition-planner-v5.3.210.js' in item or '62-gemini-ration-import-v5.js' in item:
            item=item.split('?',1)[0]+'?v='+VERSION
        out.append(item)
    return out

def copy_entry(old:str,new:str):
    text=(ROOT/old).read_text(encoding='utf-8')
    text=text.replace(BASE,VERSION).replace(BASE_INTERNAL,INTERNAL)
    text=text.replace('HF27 resilient media loader','HF28 Gemini reliability loader')
    text=text.replace('__HF27_READINESS_CHECKS__','__HF28_READINESS_CHECKS__').replace('HF27:','HF28:')
    text=text.replace('hf27-microphone-resilience','hf28-gemini-reliability')
    text=text.replace('00-runtime-bootstrap-v5.3.210-hf27.legacy.js','00-runtime-bootstrap-v5.3.210-hf28.legacy.js')
    text=text.replace('00-runtime-bootstrap-v5.3.210-hf27.js','00-runtime-bootstrap-v5.3.210-hf28.js')
    (ROOT/new).write_text(text,encoding='utf-8')

def update_config():
    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2-hf27.json').read_text(encoding='utf-8'))
    cfg['release_version']=VERSION
    cfg['modern_core_scripts']=update_queries(replace_one(cfg['modern_core_scripts'],'89-workspace-entry-ux-',MODERN_SOURCES[-1]))
    cfg['legacy_core_scripts']=update_queries(replace_one(cfg['legacy_core_scripts'],'89-workspace-entry-ux-',LEGACY_SOURCES[-1]))
    fast=cfg['fast_start']; fast['strategy']='truthful_full_start_with_gemini_reliability_guard'
    fast['critical_shell_scripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
    fast['critical_shell_sources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
    fast['product_bundle_script']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
    fast['product_compressed_json']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
    fast['lazy_feature_scripts']={'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
    out=ROOT/'config/runtime-assets.v5.3.210-rc2-hf28.json'; out.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def update_index(path:Path):
    text=path.read_text(encoding='utf-8')
    text=text.replace('data-build-date="2026-07-27"','data-build-date="'+DATE+'"')
    text=text.replace('data-performance-release="hf27-microphone-resilience"','data-performance-release="hf28-gemini-reliability"')
    text=text.replace(BASE,VERSION)
    text=text.replace('runtime-manifest-v5.3.210-rc2-hf27.js','runtime-manifest-v5.3.210-rc2-hf28.js')
    text=text.replace('00-runtime-selector-v5.3.210-hf27.js','00-runtime-selector-v5.3.210-hf28.js')
    path.write_text(text,encoding='utf-8')

def main():
    modern_bytes=bundle(ROOT/clean(MODERN_BUNDLE),MODERN_SOURCES,'modern')
    legacy_bytes=bundle(ROOT/clean(LEGACY_BUNDLE),LEGACY_SOURCES,'legacy')
    data=parse_manifest(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf27.js')
    data['version']=VERSION
    data['cssBundle']['url']=re.sub(r'\?v=.*$','?v='+VERSION,data['cssBundle']['url'])
    data['modernCoreScripts']=update_queries(replace_one(data['modernCoreScripts'],'89-workspace-entry-ux-',MODERN_SOURCES[-1]))
    data['legacyCoreScripts']=update_queries(replace_one(data['legacyCoreScripts'],'89-workspace-entry-ux-',LEGACY_SOURCES[-1]))
    data['criticalShellScripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
    data['criticalShellSources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
    data['productBundleScript']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
    data['productCompressedJson']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
    data['lazyFeatureScripts']={'geminiMediaImport':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
    data.setdefault('assetBytes',{})['criticalShellModern']=modern_bytes; data['assetBytes']['criticalShellLegacy']=legacy_bytes
    write_manifest(data); update_config()
    copy_entry('assets/js/00-runtime-bootstrap-v5.3.210-hf27.js','assets/js/00-runtime-bootstrap-v5.3.210-hf28.js')
    copy_entry('assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf27.legacy.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf28.legacy.js')
    copy_entry('assets/js/00-runtime-selector-v5.3.210-hf27.js','assets/js/00-runtime-selector-v5.3.210-hf28.js')
    for name in ('index.html','index-v5.3.210.html'): update_index(ROOT/name)
    inv=ROOT/'tools/runtime_inventory.py'; t=inv.read_text(encoding='utf-8')
    t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.v5\.3\.210-rc2(?:-hf\d+)?\.json'", "CONFIG=ROOT/'config/runtime-assets.v5.3.210-rc2-hf28.json'",t)
    inv.write_text(t,encoding='utf-8')
    print(json.dumps({'version':VERSION,'criticalShellModern':modern_bytes,'criticalShellLegacy':legacy_bytes,'manifest':str(MANIFEST.relative_to(ROOT))},ensure_ascii=False,indent=2))
if __name__=='__main__': main()
