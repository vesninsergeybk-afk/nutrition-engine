#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,re,sys
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
A=[]
def ok(name,cond,detail=''):
 A.append((name,bool(cond),str(detail)));print(('PASS' if cond else 'FAIL')+': '+name+((' — '+str(detail)) if detail else ''))

def sha(b):return hashlib.sha256(b).hexdigest()
cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text())
css=(ROOT/'assets/css/runtime-bundle-v5.3.210-rc2-hf18.css').read_text()
manifest_text=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf18.js').read_text()
m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',manifest_text)
manifest=json.loads(m.group(1)) if m else {}
ok('runtime config version',cfg['release_version']=='v5.3.210-rc2-hf18')
ok('browser manifest parseable',bool(m))
ok('browser manifest version',manifest.get('version')==cfg['release_version'])
ok('modern list single source',manifest.get('modernCoreScripts')==cfg['modern_core_scripts'],len(cfg['modern_core_scripts']))
ok('legacy list single source',manifest.get('legacyCoreScripts')==cfg['legacy_core_scripts'],len(cfg['legacy_core_scripts']))
ok('product JSON list single source',manifest.get('productJsonChunks')==cfg['product_json_chunks'])
ok('product fallback list single source',manifest.get('productScriptChunks')==cfg['product_script_chunks'])
ok('CSS source count',manifest.get('cssBundle',{}).get('sourceCount')==len(cfg['css_sources'])==38)
ok('CSS bundle hash',manifest.get('cssBundle',{}).get('sha256')==sha(css.encode()))
for rel in cfg['css_sources']:
 ok('CSS source marker '+Path(rel).name,css.count('BEGIN '+Path(rel).name)==1 and css.count('END '+Path(rel).name)==1)
modern=(ROOT/'assets/js/00-runtime-bootstrap-v5.3.210.js').read_text();legacy=(ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js').read_text()
ok('modern bootstrap manifest-driven','RUNTIME_MANIFEST.modernCoreScripts' in modern and 'var CORE_SCRIPTS = [' not in modern)
ok('legacy bootstrap manifest-driven','RUNTIME_MANIFEST.legacyCoreScripts' in legacy and 'var CORE_SCRIPTS = [' not in legacy)
ok('legacy self-test fail-closed','RUNTIME_MANIFEST.legacySelftestScripts' in legacy and manifest.get('legacySelftestScripts')==[])
html=(ROOT/'index.html').read_text();links=re.findall(r'<link\b[^>]*href="([^"]+\.css[^\"]*)"',html,re.I)
ok('two active CSS requests',len(links)==2,links)
ok('CSS bundle active',any('runtime-bundle-v5.3.210-rc2-hf18.css' in x for x in links))
ok('runtime manifest ordered before selector',html.find('runtime-manifest-v5.3.210-rc2-hf18.js')<html.find('00-runtime-selector-v5.3.210.js'))
ok('active entrypoints identical',(ROOT/'index.html').read_bytes()==(ROOT/'index-v5.3.210.html').read_bytes())
ok('formula registry pointer current','formula-registry.v5.3.145.json' in (ROOT/'assets/js/30-methodology-governance-v5.js').read_text())
selftest=(ROOT/'assets/js/11-hosting-selftest.js').read_text()
ok('production self-test has no historical product chunks','OLD_PRODUCT_CHUNKS' not in selftest and 'PREVIOUS_PRODUCT_CHUNKS' not in selftest)
ok('production self-test targets current core','03-app-core-v5.3.208.js' in selftest and '03-app-core.js' not in selftest)
sys.path.insert(0,str(ROOT/'tools'));from runtime_inventory import compute
files,missing=compute();S=set(files)
ok('runtime closure complete',not missing,missing)
ok('current products reachable',all(f'data/products.v5.3.210-p1.3.part-{i:02d}.json' in S for i in range(1,13)))
ok('historical products pruned from closure',not any('products.v5.3.184.part-' in x or 'products.v5.3.189.part-' in x for x in S))
ok('historical source retained',(ROOT/'data/products.v5.3.184.part-01.json').is_file() and (ROOT/'assets/css/theme-retro-2bit-v1.css').is_file())
ok('only bundled application CSS reachable',not any(x in S for x in cfg['css_sources']))
ok('dynamic Harvard assets included',all(p.relative_to(ROOT).as_posix() in S for p in (ROOT/'assets/images/harvard-plate/v5').rglob('*') if p.is_file()))
failed=[x for x in A if not x[1]]
print(json.dumps({'status':'PASS' if not failed else 'FAIL','assertions':len(A),'failed':len(failed)},ensure_ascii=False))
raise SystemExit(0 if not failed else 1)
