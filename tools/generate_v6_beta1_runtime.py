#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='v6.0.0-alpha1-ivory-brass'
VERSION='v6.0.0-beta1-profile-continuity'
OLD_INTERNAL='v6_0_0_alpha1_ivory_brass'
INTERNAL='v6_0_0_beta1_profile_continuity'
DATE='2026-08-04'
CONFIG_OLD=ROOT/'config/runtime-assets.v6.0.0-alpha1.json'
CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta1.json'
MANIFEST_OLD=ROOT/'assets/runtime/runtime-manifest-v6.0.0-alpha1.js'
MANIFEST=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta1.js'
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
MODERN_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta1.js?v='+VERSION
LEGACY_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta1.legacy.js?v='+VERSION

def clean(url):return url.split('?',1)[0].lstrip('./')
def bundle(path,sources,label):
 pieces=[f'/* v6 beta 1 {label} critical shell; generated. */\n']
 for url in sources:
  rel=clean(url);pieces.append(f'\n/* BEGIN {rel} */\n{(ROOT/rel).read_text(encoding="utf-8").rstrip()}\n/* END {rel} */\n')
 text=''.join(pieces);path.write_text(text,encoding='utf-8');return len(text.encode())
def parse_manifest(path):
 text=path.read_text(encoding='utf-8');m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',text,re.S)
 if not m:raise RuntimeError('manifest parse failed')
 return json.loads(m.group(1))
def write_manifest(data):
 MANIFEST.write_text("(function(w){'use strict';var m="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";if(Object.freeze){try{Object.freeze(m);}catch(_){}}w.__NUTRITION_RUNTIME_MANIFEST__=m;})(window);\n",encoding='utf-8')
def replace_query(items,targets):
 out=[]
 for item in items:
  path=item.split('?',1)[0]
  if any(t in item for t in targets):item=path+'?v='+VERSION
  out.append(item)
 return out
def copy_runtime(src,dst):
 text=(ROOT/src).read_text(encoding='utf-8').replace(OLD,VERSION).replace(OLD_INTERNAL,INTERNAL)
 text=text.replace('v6.0.0 alpha 1','v6.0.0 beta 1').replace('v6 alpha 1','v6 beta 1')
 text=text.replace('00-runtime-bootstrap-v6.0.0-alpha1.legacy.js','00-runtime-bootstrap-v6.0.0-beta1.legacy.js')
 text=text.replace('00-runtime-bootstrap-v6.0.0-alpha1.js','00-runtime-bootstrap-v6.0.0-beta1.js')
 (ROOT/dst).write_text(text,encoding='utf-8')
def update_config(mb,lb):
 cfg=json.loads(CONFIG_OLD.read_text(encoding='utf-8'))
 cfg['release_version']=VERSION
 cfg['modern_core_scripts']=replace_query(cfg['modern_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 cfg['legacy_core_scripts']=replace_query(cfg['legacy_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 for x in ['assets/css/profile-continuity-v6.css']:
  if x not in cfg['css_sources']:cfg['css_sources'].append(x)
 fast=cfg['fast_start'];fast['strategy']='profile_first_continuity_spatial_desktop_sequential_mobile'
 fast['critical_shell_scripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
 fast['critical_shell_sources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
 fast['product_bundle_script']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
 fast['product_compressed_json']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
 fast['lazy_feature_scripts']={'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
 ui=cfg.setdefault('ui_v6',{});ui.update({'profile_persistence_contract':'NutritionProfilePersistenceV1','feature_continuity_contract':'NutritionFeatureContinuityV1','profile_first':True,'new_assets':list(dict.fromkeys(ui.get('new_assets',[])+['assets/js/profile-persistence-v6.0.0-beta1.js','assets/js/analysis-feature-continuity-v6.0.0-beta1.js','assets/css/profile-continuity-v6.css']))})
 cfg.setdefault('asset_bytes',{})['critical_shell_modern']=mb;cfg['asset_bytes']['critical_shell_legacy']=lb
 CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def update_index(path):
 text=path.read_text(encoding='utf-8')
 text=text.replace(OLD,VERSION)
 text=re.sub(r'<html lang="ru"[^>]*>', '<html lang="ru" data-ui-version="6.0.0-beta1" data-build-date="'+DATE+'" data-security-release="hf28" data-performance-release="v6-profile-continuity-beta1">',text,count=1)
 text=re.sub(r'<title>.*?</title>','<title>Калькулятор рациона Сергея Веснина — v6.0 beta 1</title>',text,count=1)
 text=text.replace("var APP_VERSION = '6.0.0-alpha1';","var APP_VERSION = '6.0.0-beta1';")
 css='<link href="./assets/css/profile-continuity-v6.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="profile-continuity"/>'
 marker='<link href="./assets/css/ivory-brass-responsive-v6.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="responsive"/>'
 if 'data-ui-v6="profile-continuity"' not in text:
  if marker not in text:raise RuntimeError('responsive marker missing')
  text=text.replace(marker,marker+'\n'+css,1)
 profile='<script defer src="./assets/js/profile-persistence-v6.0.0-beta1.js?v='+VERSION+'" data-profile-persistence="v1"></script>'
 markerjs='<script defer src="./assets/js/theme-controller-v2.js?v='+VERSION+'" data-theme-controller="v2"></script>'
 if 'data-profile-persistence="v1"' not in text:
  if markerjs not in text:raise RuntimeError('theme controller marker missing')
  text=text.replace(markerjs,profile+'\n'+markerjs,1)
 feature='<script defer src="./assets/js/analysis-feature-continuity-v6.0.0-beta1.js?v='+VERSION+'" data-feature-continuity="v1"></script>'
 shell='<script defer src="./assets/js/ivory-brass-shell-v6.js?v='+VERSION+'" data-ivory-module="shell"></script>'
 if 'data-feature-continuity="v1"' not in text:
  if shell not in text:raise RuntimeError('shell marker missing')
  text=text.replace(shell,shell+'\n'+feature,1)
 text=re.sub(r'<script defer src="\./assets/runtime/runtime-manifest-[^"]+"[^>]*></script>','<script defer src="./assets/runtime/runtime-manifest-v6.0.0-beta1.js?v='+VERSION+'" data-runtime-manifest="'+VERSION+'"></script>',text)
 text=re.sub(r'<script defer src="\./assets/js/00-runtime-selector-[^"]+"[^>]*></script>','<script defer src="./assets/js/00-runtime-selector-v6.0.0-beta1.js?v='+VERSION+'" data-runtime-selector="manifest-driven"></script>',text)
 path.write_text(text,encoding='utf-8')
def main():
 mb=bundle(ROOT/clean(MODERN_BUNDLE),MODERN_SOURCES,'modern');lb=bundle(ROOT/clean(LEGACY_BUNDLE),LEGACY_SOURCES,'legacy')
 data=parse_manifest(MANIFEST_OLD);data['version']=VERSION
 data['cssBundle']['url']=re.sub(r'\?v=.*$','?v='+VERSION,data['cssBundle']['url'])
 data['modernCoreScripts']=replace_query(data['modernCoreScripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 data['legacyCoreScripts']=replace_query(data['legacyCoreScripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 data['criticalShellScripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]};data['criticalShellSources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
 data['productBundleScript']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION;data['productCompressedJson']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
 data['lazyFeatureScripts']={'geminiMediaImport':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION};data.setdefault('assetBytes',{})['criticalShellModern']=mb;data['assetBytes']['criticalShellLegacy']=lb
 write_manifest(data);update_config(mb,lb)
 copy_runtime('assets/js/00-runtime-bootstrap-v6.0.0-alpha1.js','assets/js/00-runtime-bootstrap-v6.0.0-beta1.js')
 copy_runtime('assets/legacy/js/00-runtime-bootstrap-v6.0.0-alpha1.legacy.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta1.legacy.js')
 copy_runtime('assets/js/00-runtime-selector-v6.0.0-alpha1.js','assets/js/00-runtime-selector-v6.0.0-beta1.js')
 for name in ['index.html','index-v5.3.210.html']:update_index(ROOT/name)
 inv=ROOT/'tools/runtime_inventory.py';t=inv.read_text(encoding='utf-8');t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.[^']+\.json'","CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta1.json'",t);inv.write_text(t,encoding='utf-8')
 print(json.dumps({'version':VERSION,'criticalShellModern':mb,'criticalShellLegacy':lb},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
