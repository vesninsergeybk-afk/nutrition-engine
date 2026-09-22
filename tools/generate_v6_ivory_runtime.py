#!/usr/bin/env python3
from __future__ import annotations
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='v5.3.210-rc2-hf28-gemini-reliability'
VERSION='v6.0.0-alpha1-ivory-brass'
BASE_INTERNAL='v5.3.210_rc2_hosting_hotfix_28_gemini_reliability'
INTERNAL='v6_0_0_alpha1_ivory_brass'
DATE='2026-08-04'
MODERN_SOURCES=[
 './assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17',
 './assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18',
 './assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js?v='+VERSION,
 './assets/js/89-workspace-entry-ux-v6.0.0-alpha1.js?v='+VERSION,
]
LEGACY_SOURCES=[
 './assets/legacy/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17',
 './assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18',
 './assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js?v='+VERSION,
 './assets/legacy/js/89-workspace-entry-ux-v6.0.0-alpha1.js?v='+VERSION,
]
MODERN_BUNDLE='./assets/runtime/critical-shell-v6.0.0-alpha1.js?v='+VERSION
LEGACY_BUNDLE='./assets/runtime/critical-shell-v6.0.0-alpha1.legacy.js?v='+VERSION
MANIFEST=ROOT/'assets/runtime/runtime-manifest-v6.0.0-alpha1.js'
CONFIG=ROOT/'config/runtime-assets.v6.0.0-alpha1.json'

def clean(url:str)->str:return url.split('?',1)[0].lstrip('./')
def bundle(path:Path,sources:list[str],label:str)->int:
    pieces=[f'/* v6 alpha 1 {label} critical shell; generated; calculation-neutral. */\n']
    for url in sources:
        rel=clean(url)
        pieces.append(f'\n/* BEGIN {rel} */\n{(ROOT/rel).read_text(encoding="utf-8").rstrip()}\n/* END {rel} */\n')
    text=''.join(pieces); path.write_text(text,encoding='utf-8'); return len(text.encode())
def parse_manifest(path:Path)->dict:
    text=path.read_text(encoding='utf-8');m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',text,re.S)
    if not m: raise RuntimeError('cannot parse '+str(path))
    return json.loads(m.group(1))
def write_manifest(data:dict):
    payload=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    MANIFEST.write_text("(function(w){'use strict';var m="+payload+";if(Object.freeze){try{Object.freeze(m);}catch(_){}}w.__NUTRITION_RUNTIME_MANIFEST__=m;})(window);\n",encoding='utf-8')
def replace_one(items:list[str],needle:str,value:str)->list[str]:
    out=[];done=False
    for item in items:
        if needle in item:
            if not done:out.append(value);done=True
        else:out.append(item)
    if not done:out.append(value)
    return out
def update_queries(items:list[str])->list[str]:
    targets=('61-ai-nutrition-planner-v5.3.210.js','62-gemini-ration-import-v5.js')
    return [item.split('?',1)[0]+'?v='+VERSION if any(x in item for x in targets) else item for item in items]
def copy_bootstrap(src:str,dst:str):
    text=(ROOT/src).read_text(encoding='utf-8')
    text=text.replace(BASE,VERSION).replace(BASE_INTERNAL,INTERNAL)
    text=text.replace('HF28: the splash follows','v6 alpha 1: the splash follows')
    (ROOT/dst).write_text(text,encoding='utf-8')
def copy_selector(src:str,dst:str,legacy:bool=False):
    text=(ROOT/src).read_text(encoding='utf-8')
    text=text.replace(BASE,VERSION)
    text=text.replace('00-runtime-bootstrap-v5.3.210-hf28.legacy.js','00-runtime-bootstrap-v6.0.0-alpha1.legacy.js')
    text=text.replace('00-runtime-bootstrap-v5.3.210-hf28.js','00-runtime-bootstrap-v6.0.0-alpha1.js')
    text=text.replace('v5.3.210 HF26','v6.0.0 alpha 1')
    (ROOT/dst).write_text(text,encoding='utf-8')

def update_config(modern_bytes:int,legacy_bytes:int):
    cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2-hf28.json').read_text(encoding='utf-8'))
    cfg['release_version']=VERSION
    cfg['modern_core_scripts']=update_queries(replace_one(cfg['modern_core_scripts'],'89-workspace-entry-ux-',MODERN_SOURCES[-1]))
    cfg['legacy_core_scripts']=update_queries(replace_one(cfg['legacy_core_scripts'],'89-workspace-entry-ux-',LEGACY_SOURCES[-1]))
    cfg['css_sources']=[x for x in cfg['css_sources'] if 'theme-switcher-v3.css' not in x]
    for x in ['assets/css/theme-system-v2.css','assets/css/theme-switcher-v4.css','assets/css/interaction-states-v6.css','assets/css/theme-ivory-brass-v6.css','assets/css/ivory-brass-responsive-v6.css','assets/css/ivory-brass-print-v6.css']:
        if x not in cfg['css_sources']:cfg['css_sources'].append(x)
    fast=cfg['fast_start']
    fast['strategy']='stable_core_with_switchable_spatial_desktop_and_sequential_mobile'
    fast['critical_shell_scripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
    fast['critical_shell_sources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
    fast['product_bundle_script']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
    fast['product_compressed_json']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
    fast['lazy_feature_scripts']={'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
    cfg.setdefault('ui_v6',{})
    cfg['ui_v6']={'themes':['modern','retro-2bit','ivory-brass'],'layouts':['sections','canvas'],'mobile_layout':'sections','view_model_contract':'NutritionUIViewModel.v1','safe_ui_query':'safe-ui=1','new_assets':['assets/js/theme-controller-v2.js','assets/js/ivory-brass-charts-v6.js','assets/js/ivory-brass-view-model-v6.js','assets/js/ivory-brass-shell-v6.js','assets/js/ivory-brass-progressive-disclosure-v6.js','assets/js/ivory-brass-search-compact-v6.js']}
    CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def update_index(path:Path):
    text=path.read_text(encoding='utf-8')
    text=re.sub(r'<html lang="ru"[^>]*>', '<html lang="ru" data-ui-version="6.0.0-alpha1" data-build-date="'+DATE+'" data-security-release="hf28" data-performance-release="v6-ivory-brass-alpha1">', text, count=1)
    text=text.replace('<meta name="application-build-date" content="2026-07-22"/>','<meta name="application-build-date" content="'+DATE+'"/>')
    text=re.sub(r'<title>.*?</title>', '<title>Калькулятор рациона Сергея Веснина — v6.0 alpha</title>', text, count=1)
    old_boot=re.search(r'<script data-theme-bootstrap="v1">.*?</script>',text,re.S)
    new_boot='''<script data-theme-bootstrap="v2">\n(function(){\n  var key='nutritionCalculator.uiTheme.v1';\n  var allowed={'modern':1,'retro-2bit':1,'ivory-brass':1};\n  var selected='modern',query='',safe=false;\n  try { var params=new URLSearchParams(window.location.search||'');query=params.get('theme')||'';safe=params.get('safe-ui')==='1'; } catch(_) {}\n  try { var saved=localStorage.getItem(key); selected=safe?'modern':(allowed[query]?query:(allowed[saved]?saved:'modern')); if(!safe&&allowed[query])localStorage.setItem(key,query); } catch(_) {}\n  if(window.__LEGACY_COMPAT_MODE__)selected='modern';\n  document.documentElement.setAttribute('data-theme',selected);\n  if(safe)document.documentElement.setAttribute('data-safe-ui','1');\n  window.__INITIAL_UI_THEME__=selected;\n})();\n</script>'''
    if old_boot:
        text=text[:old_boot.start()]+new_boot+text[old_boot.end():]
    elif 'data-theme-bootstrap="v2"' not in text:
        raise RuntimeError('theme bootstrap not found in '+str(path))
    text=text.replace('?v='+BASE,'?v='+VERSION)
    text=text.replace('data-runtime-css-bundle="'+BASE+'"','data-runtime-css-bundle="'+VERSION+'"')
    text=text.replace("var APP_VERSION = '5.3.210';","var APP_VERSION = '6.0.0-alpha1';")
    text=text.replace("window.__APP_DEPLOY_VERSION__='v'+APP_VERSION;window.__EXPECTED_RUNTIME_RELEASE__='"+BASE+"';","window.__APP_DEPLOY_VERSION__='v'+APP_VERSION;window.__EXPECTED_RUNTIME_RELEASE__='"+VERSION+"';")
    text=text.replace("window.__APP_BRAND_NAME__='Калькулятор нутриентов Сергея Веснина';","window.__APP_BRAND_NAME__='Калькулятор рациона Сергея Веснина';")
    text=text.replace('<script defer src="./assets/js/theme-controller-v1.js?v=5.3.159" data-theme-controller="v1"></script>', '''<script defer src="./assets/js/theme-controller-v2.js?v='''+VERSION+'''" data-theme-controller="v2"></script>\n<script defer src="./assets/js/ivory-brass-charts-v6.js?v='''+VERSION+'''" data-ivory-module="charts"></script>\n<script defer src="./assets/js/ivory-brass-view-model-v6.js?v='''+VERSION+'''" data-ivory-module="view-model"></script>\n<script defer src="./assets/js/ivory-brass-shell-v6.js?v='''+VERSION+'''" data-ivory-module="shell"></script>''')
    shell_marker='<script defer src="./assets/js/ivory-brass-shell-v6.js?v='+VERSION+'" data-ivory-module="shell"></script>'
    disclosure='<script defer src="./assets/js/ivory-brass-progressive-disclosure-v6.js?v='+VERSION+'" data-ivory-module="progressive-disclosure"></script>'
    if 'data-ivory-module="progressive-disclosure"' not in text:
        if shell_marker not in text:raise RuntimeError('ivory shell marker not found')
        text=text.replace(shell_marker,disclosure+'\n'+shell_marker,1)
    progressive_marker='<script defer src="./assets/js/ivory-brass-progressive-disclosure-v6.js?v='+VERSION+'" data-ivory-module="progressive-disclosure"></script>'
    compact='<script defer src="./assets/js/ivory-brass-search-compact-v6.js?v='+VERSION+'" data-ivory-module="search-compact"></script>'
    if 'data-ivory-module="search-compact"' not in text:
        if progressive_marker not in text:raise RuntimeError('progressive disclosure marker not found')
        text=text.replace(progressive_marker,progressive_marker+'\n'+compact,1)
    css_marker='<link href="./assets/css/gemini-reliability-v5.3.210-rc2-hf28.css?v='+VERSION+'" rel="stylesheet"/>'
    css_add='''\n<link href="./assets/css/theme-system-v2.css?v='''+VERSION+'''" rel="stylesheet" data-ui-v6="theme-system"/>\n<link href="./assets/css/theme-switcher-v4.css?v='''+VERSION+'''" rel="stylesheet" data-ui-v6="theme-switcher"/>\n<link href="./assets/css/interaction-states-v6.css?v='''+VERSION+'''" rel="stylesheet" data-ui-v6="interaction-states"/>\n<link href="./assets/css/theme-ivory-brass-v6.css?v='''+VERSION+'''" rel="stylesheet" data-ui-v6="ivory-brass"/>\n<link href="./assets/css/ivory-brass-responsive-v6.css?v='''+VERSION+'''" rel="stylesheet" data-ui-v6="responsive"/>\n<link href="./assets/css/ivory-brass-print-v6.css?v='''+VERSION+'''" rel="stylesheet" media="print" data-ui-v6="print"/>'''
    if 'data-ui-v6="theme-system"' not in text:
        if css_marker not in text:raise RuntimeError('css marker not found')
        text=text.replace(css_marker,css_marker+css_add,1)
    theme_old=None if 'theme-switcher__options' in text else re.search(r'<div class="theme-switcher" id="themeSwitcher".*?</div>\n</div>\n</header>',text,re.S)
    if theme_old is None and 'theme-switcher__options' not in text:raise RuntimeError('theme switcher block not found')
    theme_new='''<div class="theme-switcher" id="themeSwitcher" aria-label="Выбор оформления">\n<span class="theme-switcher__label">Тема</span>\n<div class="theme-switcher__options" role="group" aria-label="Тема оформления">\n<button class="theme-switcher__option" data-theme-value="modern" aria-pressed="true" type="button"><span>Современная</span></button>\n<button class="theme-switcher__option" data-theme-value="retro-2bit" aria-pressed="false" type="button"><span>2-bit</span></button>\n<button class="theme-switcher__option" data-theme-value="ivory-brass" aria-pressed="false" type="button"><span>Ivory &amp; Brass</span></button>\n</div>\n<span class="visually-hidden" id="themeStatus" aria-live="polite">Современное оформление включено</span>\n</div>\n</div>\n</header>'''
    if theme_old is not None:text=text[:theme_old.start()]+theme_new+text[theme_old.end():]
    text=re.sub(r'<script defer src="\./assets/runtime/runtime-manifest-[^"]+"[^>]*></script>', '<script defer src="./assets/runtime/runtime-manifest-v6.0.0-alpha1.js?v='+VERSION+'" data-runtime-manifest="'+VERSION+'"></script>', text)
    text=re.sub(r'<script defer src="\./assets/js/00-runtime-selector-[^"]+"[^>]*></script>', '<script defer src="./assets/js/00-runtime-selector-v6.0.0-alpha1.js?v='+VERSION+'" data-runtime-selector="manifest-driven"></script>', text)
    path.write_text(text,encoding='utf-8')

def main():
    modern_bytes=bundle(ROOT/clean(MODERN_BUNDLE),MODERN_SOURCES,'modern')
    legacy_bytes=bundle(ROOT/clean(LEGACY_BUNDLE),LEGACY_SOURCES,'legacy')
    data=parse_manifest(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js')
    data['version']=VERSION
    data['cssBundle']['url']=re.sub(r'\?v=.*$','?v='+VERSION,data['cssBundle']['url'])
    data['modernCoreScripts']=update_queries(replace_one(data['modernCoreScripts'],'89-workspace-entry-ux-',MODERN_SOURCES[-1]))
    data['legacyCoreScripts']=update_queries(replace_one(data['legacyCoreScripts'],'89-workspace-entry-ux-',LEGACY_SOURCES[-1]))
    data['criticalShellScripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
    data['criticalShellSources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
    data['productBundleScript']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
    data['productCompressedJson']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
    data['lazyFeatureScripts']={'geminiMediaImport':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
    data.setdefault('assetBytes',{})['criticalShellModern']=modern_bytes;data['assetBytes']['criticalShellLegacy']=legacy_bytes
    write_manifest(data);update_config(modern_bytes,legacy_bytes)
    copy_bootstrap('assets/js/00-runtime-bootstrap-v5.3.210-hf28.js','assets/js/00-runtime-bootstrap-v6.0.0-alpha1.js')
    copy_bootstrap('assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf28.legacy.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-alpha1.legacy.js')
    copy_selector('assets/js/00-runtime-selector-v5.3.210-hf28.js','assets/js/00-runtime-selector-v6.0.0-alpha1.js')
    for name in ('index.html','index-v5.3.210.html'):update_index(ROOT/name)
    inv=ROOT/'tools/runtime_inventory.py';t=inv.read_text(encoding='utf-8')
    t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.[^']+\.json'", "CONFIG=ROOT/'config/runtime-assets.v6.0.0-alpha1.json'", t)
    inv.write_text(t,encoding='utf-8')
    print(json.dumps({'version':VERSION,'criticalShellModern':modern_bytes,'criticalShellLegacy':legacy_bytes,'manifest':str(MANIFEST.relative_to(ROOT)),'config':str(CONFIG.relative_to(ROOT))},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
