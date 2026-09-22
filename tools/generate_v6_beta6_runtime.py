#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
ROOT=Path(__file__).resolve().parents[1]
OLD='v6.0.0-beta5-cross-stage-hardening'
NEW='v6.0.0-beta6-design-refinement'
DATE='2026-08-05T20:30:00Z'

def replace_file(src,dst):
    text=(ROOT/src).read_text(encoding='utf-8').replace(OLD,NEW)
    (ROOT/dst).write_text(text,encoding='utf-8')

def update_index(path):
    text=path.read_text(encoding='utf-8').replace(OLD,NEW)
    text=text.replace('data-ui-version="6.0.0-beta5"','data-ui-version="6.0.0-beta6"')
    text=text.replace('data-performance-release="v6-cross-stage-hardening-beta5"','data-performance-release="v6-design-refinement-beta6"')
    text=re.sub(r'<title>.*?</title>','<title>Калькулятор рациона Сергея Веснина — v6.0 beta 6</title>',text,count=1)
    text=text.replace("var APP_VERSION = '6.0.0-beta5';","var APP_VERSION = '6.0.0-beta6';")
    text=re.sub(r'<meta name="application-build-date" content="[^"]*"/>','<meta name="application-build-date" content="'+DATE+'"/>',text,count=1)
    text=text.replace('assets/runtime/runtime-manifest-v6.0.0-beta5.js','assets/runtime/runtime-manifest-v6.0.0-beta6.js')
    text=text.replace('assets/js/00-runtime-selector-v6.0.0-beta5.js','assets/js/00-runtime-selector-v6.0.0-beta6.js')
    marker='<link href="./assets/css/interaction-states-v6.0.0-beta3.css?v='+NEW+'" rel="stylesheet" data-ui-v6="interaction-states"/>'
    extra='<link href="./assets/css/design-refinement-v6.0.0-beta6.css?v='+NEW+'" rel="stylesheet" data-ui-v6="design-refinement"/>'
    if extra not in text:
        text=text.replace(marker,marker+'\n'+extra,1)
    path.write_text(text,encoding='utf-8')

def main():
    replace_file('assets/js/00-runtime-bootstrap-v6.0.0-beta5.js','assets/js/00-runtime-bootstrap-v6.0.0-beta6.js')
    replace_file('assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta5.legacy.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta6.legacy.js')
    replace_file('assets/js/00-runtime-selector-v6.0.0-beta5.js','assets/js/00-runtime-selector-v6.0.0-beta6.js')
    replace_file('assets/runtime/runtime-manifest-v6.0.0-beta5.js','assets/runtime/runtime-manifest-v6.0.0-beta6.js')
    cfg=json.loads((ROOT/'config/runtime-assets.v6.0.0-beta5.json').read_text(encoding='utf-8'))
    cfg['release_version']=NEW
    ui=cfg.setdefault('ui_v6',{})
    assets=ui.setdefault('new_assets',[])
    if 'assets/css/design-refinement-v6.0.0-beta6.css' not in assets: assets.append('assets/css/design-refinement-v6.0.0-beta6.css')
    ui['design_refinement_contract']='NutritionDesignRefinementV1'
    ui['design_refinement_release']='beta6'
    ui['design_refinement_scope']=['profile-title-hierarchy','mobile-ration-deduplication','search-first-mobile-order','non-overlay-desktop-actions','empty-analysis-disclosure']
    cfg.setdefault('asset_bytes',{})['design_refinement_css']=(ROOT/'assets/css/design-refinement-v6.0.0-beta6.css').stat().st_size
    for name in ['config/runtime-assets.v6.0.0-beta6.json','config/runtime-assets.v5.3.210-rc2.json']:
        (ROOT/name).write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for name in ['index.html','index-v5.3.210.html']: update_index(ROOT/name)
    inv=ROOT/'tools/runtime_inventory.py';t=inv.read_text(encoding='utf-8');t=re.sub(r"CONFIG=ROOT/'config/runtime-assets\.[^']+\.json'","CONFIG=ROOT/'config/runtime-assets.v6.0.0-beta6.json'",t);inv.write_text(t,encoding='utf-8')
    pkg=ROOT/'package.json';pd=json.loads(pkg.read_text(encoding='utf-8'));pd['version']='6.0.0-beta.6';pd['description']='V6 Beta 6: design and usability refinement for the Ivory & Brass workspace, preserving all calculations, themes and analytics.';pkg.write_text(json.dumps(pd,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lock=ROOT/'package-lock.json';ld=json.loads(lock.read_text(encoding='utf-8'));ld['version']='6.0.0-beta.6';ld['packages']['']['version']='6.0.0-beta.6';lock.write_text(json.dumps(ld,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'release':NEW,'design_css_bytes':cfg['asset_bytes']['design_refinement_css']},ensure_ascii=False,indent=2))
if __name__=='__main__': main()
