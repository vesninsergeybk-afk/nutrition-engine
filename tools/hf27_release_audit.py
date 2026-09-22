#!/usr/bin/env python3
from __future__ import annotations
import gzip,hashlib,json,re,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX26_TRUTHFUL_PROGRESS_ACCEPTED_FULL_PRIVATE_AUDITED.zip')
VERSION='v5.3.210-rc2-hf27-microphone-resilience'
checks=[]
def add(name,ok,detail=''):checks.append({'name':name,'ok':bool(ok),'detail':str(detail)})
expected_changed={
 'index.html','index-v5.3.210.html','package.json','package-lock.json',
 'config/runtime-assets.v5.3.210-rc2.json','tools/runtime_inventory.py',
 'assets/js/62-gemini-ration-import-v5.js','assets/legacy/js/62-gemini-ration-import-v5.js',
}
if not BASE.is_file():add('HF26 baseline available',False,BASE)
else:
 with zipfile.ZipFile(BASE) as z:
  names=set(z.namelist());changed=[];missing=[];identical=0
  for rel in sorted(names):
   if rel in {'release-manifest.json','release-sbom.spdx.json'} or rel.startswith('reports/'):continue
   p=ROOT/rel
   if not p.is_file():missing.append(rel);continue
   if p.read_bytes()==z.read(rel):identical+=1
   elif rel not in expected_changed:changed.append(rel)
  add('HF26 protected common files unchanged',not changed and not missing,f'identical={identical}; unexpected_changed={changed}; missing={missing}')
active=[
 ROOT/'index.html',ROOT/'index-v5.3.210.html',
 ROOT/'assets/js/00-runtime-bootstrap-v5.3.210-hf27.js',ROOT/'assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf27.legacy.js',
 ROOT/'assets/js/00-runtime-selector-v5.3.210-hf27.js',ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf27.js',
 ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf27.js',ROOT/'assets/runtime/critical-shell-v5.3.210-rc2-hf27.legacy.js',
 ROOT/'assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf27.js',ROOT/'assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf27.js',ROOT/'assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf27.js',
 ROOT/'assets/js/62-gemini-ration-import-v5.js',ROOT/'assets/legacy/js/62-gemini-ration-import-v5.js',
]
add('all active files exist',all(p.is_file() for p in active),[str(p.relative_to(ROOT)) for p in active if not p.is_file()])
text='\n'.join(p.read_text(encoding='utf-8') for p in active if p.is_file())
add('HF27 release token active',VERSION in text)
add('HF26 token absent from active entry files','v5.3.210-rc2-hf26-truthful-progress' not in text)
for p in active:
 if p.suffix=='.js' and p.is_file():
  r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
  add('syntax '+p.relative_to(ROOT).as_posix(),r.returncode==0,(r.stderr or r.stdout).strip())
bridge=(ROOT/'assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf27.js').read_text(encoding='utf-8')
workspace=(ROOT/'assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf27.js').read_text(encoding='utf-8')
modern_media=(ROOT/'assets/js/62-gemini-ration-import-v5.js').read_text(encoding='utf-8')
legacy_media=(ROOT/'assets/legacy/js/62-gemini-ration-import-v5.js').read_text(encoding='utf-8')
add('visible entry status contract',all(x in workspace for x in ['workspaceMediaEntryStatus','workspaceMediaEntryStatusText','workspaceNativeVoiceFallback']))
add('microphone request simple and direct','getUserMedia({audio:true})' in bridge)
add('soft permission watchdog present','__NUTRITION_MIC_SOFT_TIMEOUT_MS__' in bridge and 'всё ещё ожидает' in bridge)
add('hard permission watchdog releases retry','__NUTRITION_MIC_HARD_TIMEOUT_MS__' in bridge and 'voicePending=false;voiceToken++' in bridge and 'Браузер не ответил' in bridge)
add('repeat click gives visible feedback','Ожидаем ответ браузера' in bridge and "setEntryStatus" in bridge)
add('native recorder fallback present',all(x in bridge for x in ["accept='audio/*'","capture','microphone'","workspaceNativeVoiceCaptureInput"]))
add('feature policy is diagnostic only','Do not pre-block on document.featurePolicy' in bridge and "if(!policyAllowsMicrophone())" not in bridge.split('function startVoice(){',1)[1].split('function clickHandler',1)[0])
add('modern bottom recorder routes through bridge',"bridge&&typeofbridge.startVoice==='function'" in modern_media.replace(' ',''))
add('legacy bottom recorder routes through bridge',"bridge&&typeofbridge.startVoice==='function'" in legacy_media.replace(' ',''))
# Parse active runtime manifest.
mt=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf27.js').read_text(encoding='utf-8')
m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',mt,re.S)
manifest=json.loads(m.group(1)) if m else {}
add('manifest parse',bool(manifest))
add('manifest version',manifest.get('version')==VERSION,manifest.get('version'))
add('critical bundle points to HF27',all('hf27' in x for x in manifest.get('criticalShellScripts',{}).get('modern',[])+manifest.get('criticalShellScripts',{}).get('legacy',[])))
add('critical source bridge is HF27',any('90-media-entry-resilient-bridge' in x for x in manifest.get('criticalShellSources',{}).get('modern',[])))
add('media import remains lazy',manifest.get('lazyFeatureScripts',{}).get('geminiMediaImport','').startswith('./assets/js/62-') and 'hf27' in manifest.get('lazyFeatureScripts',{}).get('geminiMediaImport',''))
for side,file in [('Modern','assets/runtime/critical-shell-v5.3.210-rc2-hf27.js'),('Legacy','assets/runtime/critical-shell-v5.3.210-rc2-hf27.legacy.js')]:
 actual=(ROOT/file).stat().st_size;expected=manifest.get('assetBytes',{}).get('criticalShell'+side)
 add(side.lower()+' critical bytes match manifest',actual==expected,f'{actual}/{expected}')
products=json.loads(gzip.decompress((ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').read_bytes()))
add('product database count',len(products)==1105,len(products))
for rel in ['reports/hf27-truthful-loader-smoke.json','reports/hf27-microphone-resilience-acceptance.json','reports/hf27-photo-acceptance.json','reports/hf27-runtime-inventory.json']:
 try:o=json.loads((ROOT/rel).read_text(encoding='utf-8'));add(rel,o.get('ok') is True,o.get('assertions',o.get('file_count','')))
 except Exception as e:add(rel,False,e)
tap=(ROOT/'reports/hf27-calculation-tests.tap').read_text(encoding='utf-8')
add('calculation and normative test suites pass','# fail 0' in tap and '# pass 2' in tap)
result={'ok':all(x['ok'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks}
(ROOT/'reports/hf27-release-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
