#!/usr/bin/env python3
from __future__ import annotations
import gzip,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='v6.0.0-beta4-profile-hierarchy'
VERSION='v6.0.0-beta5-cross-stage-hardening'
DATE='2026-08-05'
CONFIG_OLD=ROOT/'config/runtime-assets.v6.0.0-beta4.json'
CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta5.json'
MANIFEST_OLD=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta4.js'
MANIFEST=ROOT/'assets/runtime/runtime-manifest-v6.0.0-beta5.js'
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
MODERN_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta5.js?v='+VERSION
LEGACY_BUNDLE='./assets/runtime/critical-shell-v6.0.0-beta5.legacy.js?v='+VERSION
DEFERRED_MODERN='assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js'
DEFERRED_LEGACY='assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js'
DEFERRED_MODERN_GZ=DEFERRED_MODERN+'.gz'
DEFERRED_LEGACY_GZ=DEFERRED_LEGACY+'.gz'

def clean(url):return url.split('?',1)[0].lstrip('./')
def bundle(path,sources,label):
 pieces=[f'/* v6 beta 5 {label} critical shell; generated. */\n']
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
 text=text.replace('v6.0.0-beta4','v6.0.0-beta5').replace('6.0.0-beta4','6.0.0-beta5')
 text=text.replace('00-runtime-bootstrap-v6.0.0-beta4.legacy.js','00-runtime-bootstrap-v6.0.0-beta5.legacy.js')
 text=text.replace('00-runtime-bootstrap-v6.0.0-beta4.js','00-runtime-bootstrap-v6.0.0-beta5.js')
 (ROOT/dst).write_text(text,encoding='utf-8')
def write_deterministic_gzip(src_rel,dst_rel):
 data=(ROOT/src_rel).read_bytes();compressed=gzip.compress(data,compresslevel=9,mtime=0);(ROOT/dst_rel).write_bytes(compressed);return len(compressed)
def patch_profile_skip_targets():
 for rel in ('assets/js/77-workspace-ration-overview-v5.3.210-rc2-hf15.js','assets/legacy/js/77-workspace-ration-overview-v5.3.210-rc2-hf15.js','assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js','assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js','assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js','assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js'):
  p=ROOT/rel;text=p.read_text(encoding='utf-8')
  text=text.replace("first.setAttribute('href','#needs_person_name');first.textContent='Перейти к данным человека';","first.setAttribute('href','#needs_sex');first.textContent='Перейти к основным данным профиля';")
  text=text.replace("setAttr(links[0],'href','#needs_person_name');setText(links[0],'Перейти к данным человека');","setAttr(links[0],'href','#needs_sex');setText(links[0],'Перейти к основным данным профиля');")
  text=text.replace("links[0].setAttribute('href','#needs_person_name');links[0].textContent='Перейти к данным человека';","links[0].setAttribute('href','#needs_sex');links[0].textContent='Перейти к основным данным профиля';")
  p.write_text(text,encoding='utf-8')
def update_config(mb,lb,dmgz,dlgz):
 cfg=json.loads(CONFIG_OLD.read_text(encoding='utf-8'));cfg['release_version']=VERSION
 cfg['css_sources']=[x for x in cfg['css_sources'] if x not in ('assets/css/profile-hierarchy-v6.0.0-beta4.css','assets/css/profile-hierarchy-v6.0.0-beta5.css','assets/css/interaction-states-v6.0.0-beta3.css','assets/css/ivory-brass-print-v6.css')]
 # Profile hierarchy must follow base/profile styles. Interaction states remain last among screen styles.
 profile_index=cfg['css_sources'].index('assets/css/profile-continuity-v6.css')+1 if 'assets/css/profile-continuity-v6.css' in cfg['css_sources'] else len(cfg['css_sources'])
 cfg['css_sources'].insert(profile_index,'assets/css/profile-hierarchy-v6.0.0-beta5.css')
 cfg['css_sources'].append('assets/css/interaction-states-v6.0.0-beta3.css')
 cfg['css_sources'].append('assets/css/ivory-brass-print-v6.css')
 cfg['modern_core_scripts']=replace_query(cfg['modern_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','77-workspace-ration-overview','89-workspace-entry-ux'])
 cfg['legacy_core_scripts']=replace_query(cfg['legacy_core_scripts'],['61-ai-nutrition-planner','62-gemini-ration-import','77-workspace-ration-overview','89-workspace-entry-ux'])
 fast=cfg['fast_start'];fast['strategy']='profile_first_viewport_spatial_desktop_sequential_mobile_unified_interaction_states'
 fast['critical_shell_scripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]};fast['critical_shell_sources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
 fast['deferred_runtime_bundles']={'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js?v='+VERSION,'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js?v='+VERSION}
 fast['deferred_runtime_compressed']={'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz?v='+VERSION,'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js.gz?v='+VERSION}
 fast['product_bundle_script']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION
 fast['product_compressed_json']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
 fast['lazy_feature_scripts']={'gemini_media_import':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION}
 ui=cfg.setdefault('ui_v6',{});assets=ui.setdefault('new_assets',[])
 assets[:]=[x for x in assets if x not in ('assets/css/profile-hierarchy-v6.0.0-beta4.css','assets/js/profile-hierarchy-v6.0.0-beta4.js','assets/js/profile-persistence-v6.0.0-beta4.js')]
 for x in ['assets/css/profile-hierarchy-v6.0.0-beta5.css','assets/js/profile-hierarchy-v6.0.0-beta5.js','assets/js/profile-persistence-v6.0.0-beta5.js']:
  if x not in assets:assets.append(x)
 ui.update({
  'profile_hierarchy_contract':'NutritionProfileHierarchyV2',
  'profile_hierarchy_release':'hotfix30-reaudited',
  'cross_stage_hardening_contract':'NutritionCrossStageHardeningV1',
  'profile_hierarchy':{
   'required':['needs_sex','needs_age','needs_h','needs_w','needs_activity'],
   'preferences':['needs_person_name','needs_goal','needs_diet_style','needs_split'],
   'advanced':['needs_state','needs_edema','needs_guardrail','needs_protein_manual','needsProtectedModeContext','needsLowWeightSafety'],
   'canonical_calculation_button':'needs_calc_btn',
   'primary_journey_button':'profileCalculateContinue',
   'stable_after_startup':True,
   'required_fields_first_actionable_content':True,
   'profile_route_hides_unrelated_analytics':True
  },
  'future_work_boundaries':{
   'hotfix29':'completed in v6 beta 3: unified interaction state presentation and synchronisation',
   'hotfix30':'re-audited in v6 beta 5: required anthropometrics are the first actionable content; unrelated analytics and quick actions are hidden on the profile route'
  }
 })
 cfg.setdefault('asset_bytes',{})['critical_shell_modern']=mb;cfg['asset_bytes']['critical_shell_legacy']=lb
 cfg['asset_bytes']['deferred_runtime_modern_compressed']=dmgz;cfg['asset_bytes']['deferred_runtime_legacy_compressed']=dlgz
 cfg['asset_bytes']['profile_hierarchy_css']=(ROOT/'assets/css/profile-hierarchy-v6.0.0-beta5.css').stat().st_size
 cfg['asset_bytes']['profile_hierarchy_js']=(ROOT/'assets/js/profile-hierarchy-v6.0.0-beta5.js').stat().st_size
 cfg['asset_bytes']['profile_persistence_js']=(ROOT/'assets/js/profile-persistence-v6.0.0-beta5.js').stat().st_size
 CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'config/runtime-assets.v5.3.210-rc2.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def update_index(path):
 text=path.read_text(encoding='utf-8').replace(OLD,VERSION)
 text=re.sub(r'<html lang="ru"[^>]*>', '<html lang="ru" data-ui-version="6.0.0-beta5" data-build-date="'+DATE+'" data-security-release="hf28" data-performance-release="v6-cross-stage-hardening-beta5">',text,count=1)
 text=re.sub(r'<title>.*?</title>','<title>Калькулятор рациона Сергея Веснина — v6.0 beta 5</title>',text,count=1)
 text=text.replace("var APP_VERSION = '6.0.0-beta4';","var APP_VERSION = '6.0.0-beta5';")
 text=re.sub(r'<meta name="application-build-date" content="[^"]*"/>','<meta name="application-build-date" content="'+DATE+'"/>',text,count=1)
 text=text.replace('./assets/css/profile-hierarchy-v6.0.0-beta4.css?v='+VERSION,'./assets/css/profile-hierarchy-v6.0.0-beta5.css?v='+VERSION)
 text=text.replace('./assets/js/profile-persistence-v6.0.0-beta4.js?v='+VERSION,'./assets/js/profile-persistence-v6.0.0-beta5.js?v='+VERSION)
 text=text.replace('./assets/js/profile-hierarchy-v6.0.0-beta4.js?v='+VERSION,'./assets/js/profile-hierarchy-v6.0.0-beta5.js?v='+VERSION)
 profile_link='<link href="./assets/css/profile-hierarchy-v6.0.0-beta5.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="profile-hierarchy"/>'
 if 'data-ui-v6="profile-hierarchy"' not in text:
  anchor='<link href="./assets/css/profile-continuity-v6.css?v='+VERSION+'" rel="stylesheet" data-ui-v6="profile-continuity"/>'
  text=text.replace(anchor,anchor+'\n'+profile_link,1)
 text=text.replace('./assets/js/profile-persistence-v6.0.0-beta1.js?v='+VERSION,'./assets/js/profile-persistence-v6.0.0-beta5.js?v='+VERSION)
 text=re.sub(r'<script defer src="\./assets/js/ivory-brass-progressive-disclosure-v6\.js\?v='+re.escape(VERSION)+r'"[^>]*></script>', '<script defer src="./assets/js/profile-hierarchy-v6.0.0-beta5.js?v='+VERSION+'" data-profile-hierarchy="v2"></script>', text, count=1)
 text=re.sub(r'<script defer src="\./assets/runtime/runtime-manifest-[^"]+"[^>]*></script>','<script defer src="./assets/runtime/runtime-manifest-v6.0.0-beta5.js?v='+VERSION+'" data-runtime-manifest="'+VERSION+'"></script>',text)
 text=re.sub(r'<script defer src="\./assets/js/00-runtime-selector-[^"]+"[^>]*></script>','<script defer src="./assets/js/00-runtime-selector-v6.0.0-beta5.js?v='+VERSION+'" data-runtime-selector="manifest-driven"></script>',text)
 text=text.replace('<meta name="application-name" content="Калькулятор нутриентов Сергея Веснина"/>','<meta name="application-name" content="Калькулятор рациона Сергея Веснина"/>')
 text=text.replace('<div class="title">Калькулятор нутриентов Сергея Веснина</div>','<div class="title">Калькулятор рациона Сергея Веснина</div>')
 text=text.replace('<strong>Калькулятор нутриентов Сергея Веснина</strong>','<strong>Калькулятор рациона Сергея Веснина</strong>')
 text=text.replace('<a class="skip-link" href="#needsCompact">Перейти к калькулятору потребностей</a>','<a class="skip-link" href="#needs_sex">Перейти к основным данным профиля</a>')
 text=re.sub(r'(<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>\s*<meta http-equiv="Pragma" content="no-cache"/>\s*<meta http-equiv="Expires" content="0"/>)(?:\s*<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\s*<meta http-equiv="Pragma" content="no-cache">\s*<meta http-equiv="Expires" content="0">)',r'\1',text,count=1)
 path.write_text(text,encoding='utf-8')
def main():
 patch_profile_skip_targets()
 dmgz=write_deterministic_gzip(DEFERRED_MODERN,DEFERRED_MODERN_GZ);dlgz=write_deterministic_gzip(DEFERRED_LEGACY,DEFERRED_LEGACY_GZ)
 mb=bundle(ROOT/clean(MODERN_BUNDLE),MODERN_SOURCES,'modern');lb=bundle(ROOT/clean(LEGACY_BUNDLE),LEGACY_SOURCES,'legacy')
 data=parse_manifest(MANIFEST_OLD);data['version']=VERSION
 data['cssBundle']['url']=re.sub(r'\?v=.*$','?v='+VERSION,data['cssBundle']['url'])
 data['modernCoreScripts']=replace_query(data['modernCoreScripts'],['61-ai-nutrition-planner','62-gemini-ration-import','77-workspace-ration-overview','89-workspace-entry-ux'])
 data['legacyCoreScripts']=replace_query(data['legacyCoreScripts'],['61-ai-nutrition-planner','62-gemini-ration-import','77-workspace-ration-overview','89-workspace-entry-ux'])
 data['criticalShellScripts']={'modern':[MODERN_BUNDLE],'legacy':[LEGACY_BUNDLE]};data['criticalShellSources']={'modern':MODERN_SOURCES,'legacy':LEGACY_SOURCES}
 data['deferredRuntimeBundles']={'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js?v='+VERSION,'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js?v='+VERSION}
 data['deferredRuntimeCompressed']={'modern':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.js.gz?v='+VERSION,'legacy':'./assets/runtime/deferred-runtime-v5.3.210-rc2-hf24.legacy.js.gz?v='+VERSION}
 data['productBundleScript']='./assets/data/products.v5.3.210-p1.3.bundle.js?v='+VERSION;data['productCompressedJson']='./assets/data/products.v5.3.210-p1.3.compact.json.gz?v='+VERSION
 data['lazyFeatureScripts']={'geminiMediaImport':'./assets/js/62-gemini-ration-import-v5.js?v='+VERSION};data.setdefault('assetBytes',{})['criticalShellModern']=mb;data['assetBytes']['criticalShellLegacy']=lb;data['assetBytes']['deferredRuntimeModernCompressed']=dmgz;data['assetBytes']['deferredRuntimeLegacyCompressed']=dlgz
 write_manifest(data);update_config(mb,lb,dmgz,dlgz)
 copy_runtime('assets/js/00-runtime-bootstrap-v6.0.0-beta4.js','assets/js/00-runtime-bootstrap-v6.0.0-beta5.js')
 copy_runtime('assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta4.legacy.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta5.legacy.js')
 copy_runtime('assets/js/00-runtime-selector-v6.0.0-beta4.js','assets/js/00-runtime-selector-v6.0.0-beta5.js')
 for name in ['index.html','index-v5.3.210.html']:update_index(ROOT/name)
 inv=ROOT/'tools/runtime_inventory.py';t=inv.read_text(encoding='utf-8');t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.[^']+\.json'","CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta5.json'",t);inv.write_text(t,encoding='utf-8')
 pkg=ROOT/'package.json';pd=json.loads(pkg.read_text(encoding='utf-8'));pd['version']='6.0.0-beta.5';pd['description']='V6 Beta 5: cross-stage re-audit of Gemini reliability, unified interaction states, profile hierarchy, browser persistence, complete analytics and first-step usability.';pkg.write_text(json.dumps(pd,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 lock=ROOT/'package-lock.json';ld=json.loads(lock.read_text(encoding='utf-8'));ld['version']='6.0.0-beta.5';ld['packages']['']['version']='6.0.0-beta.5';lock.write_text(json.dumps(ld,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'version':VERSION,'criticalShellModern':mb,'criticalShellLegacy':lb,'deferredRuntimeModernCompressed':dmgz,'deferredRuntimeLegacyCompressed':dlgz},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
