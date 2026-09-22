#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='v6.0.0-beta2-nutrient-group-overview'
VERSION='v6.0.0-beta3-interaction-coherence'
DATE='2026-08-05'
CONFIG_OLD=ROOT/'config/runtime-assets.v6.0.0-beta2.json'
CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta3.json'
MANIFEST_OLD=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta2.js'
MANIFEST=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta3.js'
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
MODERN_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta3.js?v='+VERSION
LEGACY_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta3.legacy.js?v='+VERSION

def clean(url):return url.split('?',1)[0].lstrip('./')
def bundle(path,sources,label):
 pieces=[f'/* v6 beta 3 {label} critical shell; generated. */\n']
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
 text=(ROOT/src).read_text(encoding='utf-8').replace(OLD,VERSION)
 text=text.replace('v6.0.0-beta2','v6.0.0-beta3').replace('6.0.0-beta2','6.0.0-beta3')
 text=text.replace('00-runtime-bootstrap-v6.0.0-beta2.legacy.js','00-runtime-bootstrap-v6.0.0-beta3.legacy.js')
 text=text.replace('00-runtime-bootstrap-v6.0.0-beta2.js','00-runtime-bootstrap-v6.0.0-beta3.js')
 (ROOT/dst).write_text(text,encoding='utf-8')
def update_config(mb,lb):
 cfg=json.loads(CONFIG_OLD.read_text(encoding='utf-8'));cfg['release_version']=VERSION
 cfg['css_sources']=[x for x in cfg['css_sources'] if x not in ('assets/css/interaction-states-v6.css','assets/css/interaction-states-v6.0.0-beta3.css','assets/css/ivory-brass-print-v6.css')]
 # The interaction layer is intentionally last among screen styles so legacy/theme/profile rules cannot erase state feedback.
 cfg['css_sources'].append('assets/css/interaction-states-v6.0.0-beta3.css')
 cfg['css_sources'].append('assets/css/ivory-brass-print-v6.css')
 cfg['modern_core_scripts']=replace_query(cfg['modern_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 cfg['legacy_core_scripts']=replace_query(cfg['legacy_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 fast=cfg['fast_start'];fast['strategy']='profile_continuity_spatial_desktop_sequential_mobile_transparent_group_navigation_unified_interaction_states'
 fast['critical_shell_scripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]};fast['critical_shell_sources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
 fast['product_bundle_script']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
 fast['product_compressed_json']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
 fast['lazy_feature_scripts']={'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
 ui=cfg.setdefault('ui_v6',{});assets=ui.setdefault('new_assets',[])
 for x in ['assets/css/interaction-states-v6.0.0-beta3.css','assets/js/interaction-state-controller-v6.0.0-beta3.js']:
  if x not in assets:assets.append(x)
 ui.update({
  'interaction_state_contract':'NutritionInteractionStatesV1',
  'interaction_state_release':'hotfix29',
  'interaction_states':['idle','hover','pressed','focused','selected','loading','success','error','disabled','recording'],
  'interaction_state_scope':'all-themes-all-layouts-presentation-only',
  'future_work_boundaries':{
    'hotfix29':'completed in v6 beta 3: unified interaction state presentation and synchronisation',
    'hotfix30':'profile progressive disclosure and final field hierarchy; calculation and persistence contracts remain canonical'
  }
 })
 cfg.setdefault('asset_bytes',{})['critical_shell_modern']=mb;cfg['asset_bytes']['critical_shell_legacy']=lb
 cfg['asset_bytes']['interaction_state_css']=(ROOT/'assets/css/interaction-states-v6.0.0-beta3.css').stat().st_size
 cfg['asset_bytes']['interaction_state_js']=(ROOT/'assets/js/interaction-state-controller-v6.0.0-beta3.js').stat().st_size
 CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def update_index(path):
 text=path.read_text(encoding='utf-8').replace(OLD,VERSION)
 text=re.sub(r'<html lang="ru"[^>]*>', '<html lang="ru" data-ui-version="6.0.0-beta3" data-build-date="'+DATE+'" data-security-release="hf28" data-performance-release="v6-interaction-coherence-beta3">',text,count=1)
 text=re.sub(r'<title>.*?</title>','<title>Калькулятор рациона Сергея Веснина — v6.0 beta 3</title>',text,count=1)
 text=text.replace("var APP_VERSION = '6.0.0-beta2';","var APP_VERSION = '6.0.0-beta3';")
 text=text.replace('<link href="./assets/css/interaction-states-v6.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="interaction-states"/>','<link href="./assets/css/interaction-states-v6.0.0-beta3.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="interaction-states"/>')
 # Keep state presentation after all screen-theme/profile styles and before print-only rules.
 interaction='<link href="./assets/css/interaction-states-v6.0.0-beta3.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="interaction-states"/>'
 text=re.sub(r'\s*<link href="\./assets/css/interaction-states-v6\.0\.0-beta3\.css\?v='+re.escape(VERSION)+r'" rel="stylesheet" data-ui-v6="interaction-states"/>\s*','\n',text,count=1)
 print_link='<link href="./assets/css/ivory-brass-print-v6.css?v='+VERSION+'" rel="stylesheet" media="print" data-ui-v6="print"/>'
 text=text.replace(print_link,interaction+'\n'+print_link,1)
 text=re.sub(r'<meta name="application-build-date" content="[^"]*"/>','<meta name="application-build-date" content="'+DATE+'"/>',text,count=1)
 marker='<script defer src="./assets/js/theme-controller-v2.js?v='+VERSION+'" data-theme-controller="v2"></script>'
 addition=marker+'\n<script defer src="./assets/js/interaction-state-controller-v6.0.0-beta3.js?v='+VERSION+'" data-interaction-controller="v1"></script>'
 if 'data-interaction-controller="v1"' not in text:text=text.replace(marker,addition)
 text=re.sub(r'<script defer src="\./assets/runtime/runtime-manifest-[^"]+"[^>]*></script>','<script defer src="./assets/runtime/runtime-manifest-v6.0.0-beta3.js?v='+VERSION+'" data-runtime-manifest="'+VERSION+'"></script>',text)
 text=re.sub(r'<script defer src="\./assets/js/00-runtime-selector-[^"]+"[^>]*></script>','<script defer src="./assets/js/00-runtime-selector-v6.0.0-beta3.js?v='+VERSION+'" data-runtime-selector="manifest-driven"></script>',text)
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
 copy_runtime('assets/js/00-runtime-bootstrap-v6.0.0-beta2.js','assets/js/00-runtime-bootstrap-v6.0.0-beta3.js')
 copy_runtime('assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta2.legacy.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta3.legacy.js')
 copy_runtime('assets/js/00-runtime-selector-v6.0.0-beta2.js','assets/js/00-runtime-selector-v6.0.0-beta3.js')
 for name in ['index.html','index-v5.3.210.html']:update_index(ROOT/name)
 inv=ROOT/'tools/runtime_inventory.py';t=inv.read_text(encoding='utf-8');t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.[^']+\.json'","CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta3.json'",t);inv.write_text(t,encoding='utf-8')
 print(json.dumps({'version':VERSION,'criticalShellModern':mb,'criticalShellLegacy':lb},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
