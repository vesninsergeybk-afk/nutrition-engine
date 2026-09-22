#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='v6.0.0-beta1-profile-continuity'
VERSION='v6.0.0-beta2-nutrient-group-overview'
DATE='2026-08-05'
CONFIG_OLD=ROOT/'config/runtime-assets.v6.0.0-beta1.json'
CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta2.json'
MANIFEST_OLD=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta1.js'
MANIFEST=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta2.js'
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
MODERN_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta2.js?v='+VERSION
LEGACY_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta2.legacy.js?v='+VERSION

def clean(url):return url.split('?',1)[0].lstrip('./')
def bundle(path,sources,label):
 pieces=[f'/* v6 beta 2 {label} critical shell; generated. */\n']
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
 text=text.replace('v6.0.0-beta1','v6.0.0-beta2').replace('6.0.0-beta1','6.0.0-beta2')
 text=text.replace('00-runtime-bootstrap-v6.0.0-beta1.legacy.js','00-runtime-bootstrap-v6.0.0-beta2.legacy.js')
 text=text.replace('00-runtime-bootstrap-v6.0.0-beta1.js','00-runtime-bootstrap-v6.0.0-beta2.js')
 (ROOT/dst).write_text(text,encoding='utf-8')
def update_config(mb,lb):
 cfg=json.loads(CONFIG_OLD.read_text(encoding='utf-8'))
 cfg['release_version']=VERSION
 cfg['modern_core_scripts']=replace_query(cfg['modern_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 cfg['legacy_core_scripts']=replace_query(cfg['legacy_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','89-workspace-entry-ux'])
 fast=cfg['fast_start'];fast['strategy']='profile_continuity_spatial_desktop_sequential_mobile_transparent_nutrient_group_navigation'
 fast['critical_shell_scripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]}
 fast['critical_shell_sources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
 fast['product_bundle_script']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
 fast['product_compressed_json']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
 fast['lazy_feature_scripts']={'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
 ui=cfg.setdefault('ui_v6',{})
 ui.update({
  'nutrient_group_overview_contract':'NutrientGroupOverview.v1',
  'nutrient_group_overview_role':'navigation-summary-over-canonical-nutrient-table',
  'nutrient_group_overview_not_a_score':True,
  'nutrient_group_statuses':['target','below','review','above','unknown'],
  'future_work_boundaries':{
    'hotfix29':'unified interaction states; overview uses standard buttons/ARIA and adds no parallel state controller',
    'hotfix30':'profile progressive disclosure; overview does not alter profile DOM or persistence'
  }
 })
 cfg.setdefault('asset_bytes',{})['critical_shell_modern']=mb;cfg['asset_bytes']['critical_shell_legacy']=lb
 CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def update_index(path):
 text=path.read_text(encoding='utf-8').replace(OLD,VERSION)
 text=re.sub(r'<html lang="ru"[^>]*>', '<html lang="ru" data-ui-version="6.0.0-beta2" data-build-date="'+DATE+'" data-security-release="hf28" data-performance-release="v6-nutrient-group-overview-beta2">',text,count=1)
 text=re.sub(r'<title>.*?</title>','<title>Калькулятор рациона Сергея Веснина — v6.0 beta 2</title>',text,count=1)
 text=text.replace("var APP_VERSION = '6.0.0-beta1';","var APP_VERSION = '6.0.0-beta2';")
 text=re.sub(r'<script defer src="\./assets/runtime/runtime-manifest-[^"]+"[^>]*></script>','<script defer src="./assets/runtime/runtime-manifest-v6.0.0-beta2.js?v='+VERSION+'" data-runtime-manifest="'+VERSION+'"></script>',text)
 text=re.sub(r'<script defer src="\./assets/js/00-runtime-selector-[^"]+"[^>]*></script>','<script defer src="./assets/js/00-runtime-selector-v6.0.0-beta2.js?v='+VERSION+'" data-runtime-selector="manifest-driven"></script>',text)
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
 copy_runtime('assets/js/00-runtime-bootstrap-v6.0.0-beta1.js','assets/js/00-runtime-bootstrap-v6.0.0-beta2.js')
 copy_runtime('assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta1.legacy.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta2.legacy.js')
 copy_runtime('assets/js/00-runtime-selector-v6.0.0-beta1.js','assets/js/00-runtime-selector-v6.0.0-beta2.js')
 for name in ['index.html','index-v5.3.210.html']:update_index(ROOT/name)
 inv=ROOT/'tools/runtime_inventory.py';t=inv.read_text(encoding='utf-8');t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.[^']+\.json'","CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta2.json'",t);inv.write_text(t,encoding='utf-8')
 print(json.dumps({'version':VERSION,'criticalShellModern':mb,'criticalShellLegacy':lb},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
