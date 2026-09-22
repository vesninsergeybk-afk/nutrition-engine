#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
files=[ROOT/'assets/js/00-runtime-bootstrap-v5.3.210-hf26.js',ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf26.legacy.js']
checks=[]
def add(name,ok,detail=''):checks.append({'name':name,'ok':bool(ok),'detail':detail})
for p in files:
 s=p.read_text(encoding='utf-8');tag=p.name
 add(tag+': five real stages',all(x in s for x in ["label: 'Интерфейс'","label: 'База продуктов'","label: 'Расчёты и инструменты'","label: 'Проверка готовности'","label: 'Готово'"]))
 add(tag+': byte reader',"resp.body.getReader" in s and "reader.read()" in s and "update(received" in s)
 add(tag+': content length',"resp.headers.get('content-length')" in s)
 add(tag+': product byte progress',"setProductByteProgress" in s and "productBytesDone" in s and "productBytesTotal" in s)
 add(tag+': runtime byte progress',"setRuntimeByteProgress" in s and "runtimeBytesDone" in s and "runtimeBytesTotal" in s)
 add(tag+': real progress weights','(bootFrac*14)+(productFraction()*46)+(runtimeFraction()*32)+(finalizeFraction()*8)' in s)
 add(tag+': readiness validation',"window.__HF26_READINESS_CHECKS__" in s and "finalizeDone" in s)
 add(tag+': adaptive minimum',"MIN_FULL_LOADER_MS = 4200" in s and "now()>=minCloseAt" in s)
 add(tag+': no fixed five-second timeout',"setTimeout(closeLoaderAfterFullReady,5000)" not in s)
 add(tag+': fallback paths',"loadProductBundleScript" in s and "loadCompressedRuntime" in s and "deferred bundle unavailable; using source files" in s)
idx=(ROOT/'index.html').read_text(encoding='utf-8')
add('active hf26 manifest','runtime-manifest-v5.3.210-rc2-hf26.js' in idx)
add('active hf26 selector','00-runtime-selector-v5.3.210-hf26.js' in idx)
result={'ok':all(x['ok'] for x in checks),'assertions':len(checks),'checks':checks}
(ROOT/'reports/hf26-progress-contract-static.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
