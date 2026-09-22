#!/usr/bin/env python3
from __future__ import annotations
import gzip, hashlib, json, re, subprocess, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX27_MICROPHONE_RESILIENCE_ACCEPTED_FULL_PRIVATE_AUDITED.zip')
VERSION='v5.3.210-rc2-hf28-gemini-reliability'
checks=[]
def add(name,ok,detail=''):checks.append({'name':name,'ok':bool(ok),'detail':detail})

def run(name,cmd):
 r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=240)
 add(name,r.returncode==0,(r.stdout+r.stderr)[-1200:])
 return r

allowed_prefixes=(
 'reports/','tests/hf28-','tools/hf28_','tools/generate_hf28_runtime.py','tools/build_hf28_','tools/verify_hf28_',
 'assets/js/00-runtime-bootstrap-v5.3.210-hf28.js','assets/js/00-runtime-selector-v5.3.210-hf28.js',
 'assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf28.legacy.js','assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf28.js',
 'assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf28.js','assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js',
 'assets/css/gemini-reliability-v5.3.210-rc2-hf28.css','assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js',
 'assets/runtime/critical-shell-v5.3.210-rc2-hf28.js','assets/runtime/critical-shell-v5.3.210-rc2-hf28.legacy.js',
 'config/runtime-assets.v5.3.210-rc2-hf28.json','api/utf8-safe.php'
)
allowed_exact={
 'index.html','index-v5.3.210.html','package.json','package-lock.json','tools/runtime_inventory.py',
 'config/runtime-assets.v5.3.210-rc2.json','api/gemini.php','api/gemini-secret.php','api/gemini-secret.example.php','api/.htaccess','GEMINI_CREDENTIALS_SETUP_RU.md','assets/js/61-ai-nutrition-planner-v5.3.210.js','assets/js/62-gemini-ration-import-v5.js'
}
if not BASE.is_file():add('HF27 baseline available',False,str(BASE))
else:
 with zipfile.ZipFile(BASE) as z:
  names=[n for n in z.namelist() if not n.endswith('/')]
  unexpected=[];missing=[];identical=0
  protected_changed=[]
  for rel in names:
   if rel in {'release-manifest.json','release-sbom.spdx.json','api/gemini-secret.php'} or rel.startswith('reports/'):continue
   p=ROOT/rel
   if not p.is_file():missing.append(rel);continue
   same=p.read_bytes()==z.read(rel)
   if same:identical+=1
   elif rel not in allowed_exact and not any(rel.startswith(x) for x in allowed_prefixes):unexpected.append(rel)
   if (rel.startswith(('data/','assets/data/')) or 'formula' in rel.lower() or 'normative' in rel.lower()) and not same:protected_changed.append(rel)
  add('HF27 protected common files unchanged',not unexpected and not missing,{'identical':identical,'unexpected':unexpected,'missing':missing})
  add('calculation, normative and product data unchanged',not protected_changed,protected_changed)

active=[
 'index.html','index-v5.3.210.html','api/gemini.php','api/gemini-secret.php','api/.htaccess','api/utf8-safe.php','assets/js/61-ai-nutrition-planner-v5.3.210.js','assets/js/62-gemini-ration-import-v5.js',
 'assets/js/00-runtime-selector-v5.3.210-hf28.js','assets/js/00-runtime-bootstrap-v5.3.210-hf28.js','assets/legacy/js/00-runtime-bootstrap-v5.3.210-hf28.legacy.js',
 'assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf28.js','assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf28.js','assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js',
 'assets/css/gemini-reliability-v5.3.210-rc2-hf28.css','assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js','assets/runtime/critical-shell-v5.3.210-rc2-hf28.js','assets/runtime/critical-shell-v5.3.210-rc2-hf28.legacy.js'
]
secret_path=ROOT/'api/gemini-secret.php'
secret_text=secret_path.read_text(encoding='utf-8') if secret_path.is_file() else ''
secret_rx=re.compile(r'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
secret_values=secret_rx.findall(secret_text)
add('packaged server-side credential file is present',secret_path.is_file())
add('packaged credential file contains primary and backup keys',len(secret_values)>=2 and len(set(secret_values))==len(secret_values),{'configured_keys':len(secret_values)})
add('packaged credential file has direct-request guard',all(x in secret_text for x in ['SCRIPT_FILENAME','http_response_code(404)','exit;']))
add('packaged credential file mode is owner-only',(secret_path.stat().st_mode & 0o777)==0o600,oct(secret_path.stat().st_mode & 0o777) if secret_path.exists() else '')
root_ht=(ROOT/'.htaccess').read_text(encoding='utf-8')
api_ht=(ROOT/'api/.htaccess').read_text(encoding='utf-8') if (ROOT/'api/.htaccess').is_file() else ''
add('Apache rules deny direct secret access',r'gemini-secret\.php' in root_ht and 'Require all denied' in root_ht and r'gemini-secret\.php' in api_ht and 'Require all denied' in api_ht)
example=(ROOT/'api/gemini-secret.example.php').read_text(encoding='utf-8') if (ROOT/'api/gemini-secret.example.php').is_file() else ''
add('credential example contains placeholders only','REPLACE_WITH_PRIMARY_GEMINI_KEY' in example and 'REPLACE_WITH_BACKUP_GEMINI_KEY' in example and not secret_rx.search(example))
add('credential loading supports packaged file plus optional overrides',all(x in (ROOT/'api/gemini.php').read_text(encoding='utf-8') for x in ['GEMINI_API_KEY','GEMINI_SECRET_FILE','load_api_keys_from_file',"__DIR__.'/gemini-secret.php'"]))
secret_hits=[]
for q in ROOT.rglob('*'):
 if not q.is_file() or any(part in {'.git','node_modules','release','__pycache__'} for part in q.parts):continue
 rel=q.relative_to(ROOT).as_posix()
 if rel=='api/gemini-secret.php':continue
 try:t=q.read_text(encoding='utf-8')
 except Exception:continue
 if secret_rx.search(t):secret_hits.append(rel)
add('no live credential patterns outside protected server file',not secret_hits,secret_hits)
add('all active HF28 files exist',all((ROOT/x).is_file() for x in active),[x for x in active if not (ROOT/x).is_file()])
text='\n'.join((ROOT/x).read_text(encoding='utf-8',errors='replace') for x in active if (ROOT/x).is_file())
add('HF28 release token active',VERSION in text)
add('HF27 active token absent from entry points','v5.3.210-rc2-hf27-microphone-resilience' not in (ROOT/'index.html').read_text() and 'v5.3.210-rc2-hf27-microphone-resilience' not in (ROOT/'index-v5.3.210.html').read_text())
for rel in active:
 p=ROOT/rel
 if p.suffix=='.js':
  r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);add('syntax '+rel,r.returncode==0,(r.stderr or r.stdout).strip())
 if p.suffix=='.php':
  r=subprocess.run(['php','-l',str(p)],capture_output=True,text=True);add('syntax '+rel,r.returncode==0,(r.stderr or r.stdout).strip())

html=(ROOT/'index.html').read_text(encoding='utf-8')
api=(ROOT/'api/gemini.php').read_text(encoding='utf-8')
utf=(ROOT/'api/utf8-safe.php').read_text(encoding='utf-8')
bridge=(ROOT/'assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js').read_text(encoding='utf-8')
media=(ROOT/'assets/js/62-gemini-ration-import-v5.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/gemini-reliability-v5.3.210-rc2-hf28.css').read_text(encoding='utf-8')
add('ordinary adult non-clinical consent is visible',('18 лет' in html.lower() or 'совершеннолет' in html.lower()) and 'немедицин' in html.lower() and ('отправк' in html.lower() or 'передач' in html.lower()))
add('professional purpose is not required in UI','профессиональных или деловых целях' not in html.lower())
add('legacy professional flag retained only as compatibility','professional_business_use' in api and 'ai_non_clinical_use' in api)
add('protected clinical profiles remain blocked',all(x in api for x in ['oncology','dialysis','icu','ai_clinical_profile_blocked']))
add('UTF-8 helper is independent of mbstring','function nutrition_utf8_truncate' in utf and 'function nutrition_utf8_sanitize' in utf and "preg_match_all('/./us'" in utf and "function_exists('mb_substr')" in utf)
add('all API JSON paths use safe flags','nutrition_json_flags' in api and 'JSON_INVALID_UTF8_SUBSTITUTE' in utf)
add('missing media has explicit 422 contract',"'error_code'=>'media_missing'" in api and 'respond(422' in api)
add('voice states are explicit',all(x in bridge+media for x in ["'working'","'recording'","'error'",'aria-pressed','aria-busy']))
add('photo status cannot generically mutate microphone state','microphoneStatus' not in bridge and "setDirectRecordState('working','Подключаем микрофон…')" in bridge)
add('denied state is reapplied after lazy module initialization','Promise.resolve(modulePromise).then' in bridge and "setDirectRecordState('error','Повторить запись')" in bridge)
add('interaction CSS covers focus pressed loading error and recording',all(x in css for x in [':focus-visible',':active','data-action-state="working"','data-action-state="error"','data-action-state="recording"','prefers-reduced-motion']))

mt=(ROOT/'assets/runtime/runtime-manifest-v5.3.210-rc2-hf28.js').read_text(encoding='utf-8')
m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',mt,re.S);manifest=json.loads(m.group(1)) if m else {}
add('runtime manifest parses',bool(manifest))
add('runtime manifest version',manifest.get('version')==VERSION,manifest.get('version'))
add('HF28 bridge is in critical sources',any('hf28' in x and '90-media-entry' in x for x in manifest.get('criticalShellSources',{}).get('modern',[])))
add('Gemini media module remains lazy','62-gemini-ration-import' in manifest.get('lazyFeatureScripts',{}).get('geminiMediaImport',''))
for side,rel,key in [('modern','assets/runtime/critical-shell-v5.3.210-rc2-hf28.js','criticalShellModern'),('legacy','assets/runtime/critical-shell-v5.3.210-rc2-hf28.legacy.js','criticalShellLegacy')]:
 expected=manifest.get('assetBytes',{}).get(key);actual=(ROOT/rel).stat().st_size;add(side+' critical bytes match manifest',actual==expected,f'{actual}/{expected}')

products=json.loads(gzip.decompress((ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').read_bytes()))
add('product database count preserved',len(products)==1105,len(products))
for rel in ['reports/hf28-browser-acceptance.json','reports/hf28-http-contract.json','reports/hf28-live-audio-transport-probe.json','reports/hf28-runtime-inventory.json','reports/hf28-regression-comparison.json','reports/hf28-packaged-secret-http.json']:
 try:o=json.loads((ROOT/rel).read_text(encoding='utf-8'));add(rel,o.get('ok') is True,{'assertions':o.get('assertions'),'provider_response_verified':o.get('provider_response_verified')})
 except Exception as e:add(rel,False,str(e))
run('HF28 UTF-8 unit test',['php','tests/hf28-utf8-safe.test.php'])
run('HF28 consent/static contract',['node','tests/hf28-gemini-contract.test.js'])
run('HF28 mocked media E2E',['php','tests/hf28-media-mock-e2e.test.php'])
run('HF28 credential loading and packaged fallback',['php','tests/hf28-credential-loading.test.php'])
run('HF28 packaged credential HTTP isolation',['python','tools/hf28_packaged_secret_http_test.py'])
add('no build caches are included',not any((ROOT/x).exists() for x in ['tools/__pycache__','.pytest_cache']),[x for x in ['tools/__pycache__','.pytest_cache'] if (ROOT/x).exists()])
result={'ok':all(x['ok'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks,'limitations':['The external Gemini response was not verified in this container because DNS access to generativelanguage.googleapis.com was unavailable; the request reached the transport layer and the complete response path was verified with a provider mock.','Private release archives intentionally include the existing Gemini keys only in protected server-side api/gemini-secret.php so media recognition works immediately after deployment.','After extracting the private package on hosting, remove the uploaded ZIP from any publicly reachable directory.']}
(ROOT/'reports/hf28-release-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
