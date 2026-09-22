#!/usr/bin/env python3
from pathlib import Path
import json,re,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/work_5b0')
REL='v5.3.210-rc2-hf19'
checks=[]
def add(name,ok,detail=''):
 checks.append({'name':name,'passed':bool(ok),'detail':detail})
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text())
manifest=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf19.js').read_text()
index=(ROOT/'index.html').read_text()
selector=(ROOT/'assets/js/00-runtime-selector-v5.3.210.js').read_text()
modern=(ROOT/'assets/js/00-runtime-bootstrap-v5.3.210.js').read_text()
legacy=(ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js').read_text()
add('config release',cfg['release_version']==REL,cfg['release_version'])
add('manifest release',f'"version":"{REL}"' in manifest)
add('index expected release',f"window.__EXPECTED_RUNTIME_RELEASE__='{REL}'" in index)
add('new manifest active',f'runtime-manifest-v5.3.210-rc2-hf19.js?v={REL}' in index)
add('selector cache bust',f'00-runtime-selector-v5.3.210.js?v={REL}' in index)
add('selector release',f"RELEASE_VERSION='{REL}'" in selector)
add('modern bootstrap cache bust',f'00-runtime-bootstrap-v5.3.210.js?v={REL}' in selector)
add('legacy bootstrap cache bust',f'00-runtime-bootstrap-v5.3.210.legacy.js?v={REL}' in selector)
for label,text in [('modern',modern),('legacy',legacy)]:
 add(label+' bootstrap gate',f"RELEASE_GATE_VERSION = '{REL}'" in text)
 add(label+' three-way handshake','EXPECTED_RUNTIME_RELEASE !== RELEASE_GATE_VERSION' in text and 'RUNTIME_MANIFEST.version !== EXPECTED_RUNTIME_RELEASE' in text)
 add(label+' ready state',"status: 'ready'" in text)
 add(label+' fatal state',"status: 'fatal'" in text)
# Critical scientific/data files must be byte-identical.
critical=['assets/data/normative-registry.v5.3.210-p1.2.json','config/formula-registry.v5.3.210-p1.4.json','data/product-provenance-registry.v5.3.210-p1.3.json']+[f'data/products.v5.3.210-p1.3.part-{i:02}.json' for i in range(1,13)]
for rel in critical:
 add('unchanged '+rel,sha(ROOT/rel)==sha(BASE/rel))
# Runtime closure.
sys.path.insert(0,str(ROOT/'tools'))
from runtime_inventory import compute
files,missing=compute()
add('runtime closure complete',not missing,','.join(missing))
add('runtime closure count',len(files)==277,str(len(files)))
add('only hf19 manifest reachable',[x for x in files if 'runtime-manifest' in x]==['assets/runtime/runtime-manifest-v5.3.210-rc2-hf19.js'],str([x for x in files if 'runtime-manifest' in x]))
result={'ok':all(c['passed'] for c in checks),'release':REL,'assertions':len(checks),'checks':checks}
out=ROOT/'reports/hf19-boot-recovery-static.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(0 if result['ok'] else 1)
