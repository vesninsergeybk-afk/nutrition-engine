#!/usr/bin/env python3
from __future__ import annotations
import gzip,hashlib,json,os,re,stat,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-alpha1-ivory-brass'
checks=[]
def add(name,ok,detail=None):checks.append({'name':name,'ok':bool(ok),'detail':detail})
def load(rel):return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def run(name,cmd):
 r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'},timeout=240)
 add(name,r.returncode==0,{'returncode':r.returncode,'stdout':r.stdout[-1600:],'stderr':r.stderr[-1600:]})
 return r

required={
 'reports/v6_ivory_acceptance.json':6,
 'reports/v6_ivory_extended_acceptance.json':7,
 'reports/v6-gemini-media-acceptance.json':7,
 'reports/v6-runtime-inventory.json':None,
 'reports/v6-syntax-checks.json':16,
 'reports/v6-protected-data-comparison.json':159,
 'reports/v6-core-regression-comparison.json':10,
 'reports/v6-generator-idempotency.json':10,
 'reports/v6-ui-asset-budget.json':None,
 'reports/hf28-http-contract.json':5,
 'reports/hf28-packaged-secret-http.json':6,
 'reports/v6-live-audio-transport-probe.json':None,
}
for rel,count in required.items():
 try:
  data=load(rel);ok=data.get('ok') is True
  if count is not None:ok=ok and data.get('assertions')==count
  add(rel,ok,{'assertions':data.get('assertions'),'file_count':data.get('file_count'),'new_failures':data.get('new_failures')})
 except Exception as e:add(rel,False,str(e))

# Release identity and runtime contract.
html=(ROOT/'index.html').read_text(encoding='utf-8')
html2=(ROOT/'index-v5.3.210.html').read_text(encoding='utf-8')
add('v6 release token in both entry points',VERSION in html and VERSION in html2)
add('three themes are exposed',all(x in html for x in ['data-theme-value="modern"','data-theme-value="retro-2bit"','data-theme-value="ivory-brass"']))
add('safe UI fallback is wired','safe-ui' in html and "selected=safe?'modern'" in html)
add('new UI assets are versioned',all((x+'?v='+VERSION) in html for x in [
 './assets/js/theme-controller-v2.js','./assets/js/ivory-brass-charts-v6.js','./assets/js/ivory-brass-view-model-v6.js','./assets/js/ivory-brass-progressive-disclosure-v6.js','./assets/js/ivory-brass-search-compact-v6.js','./assets/js/ivory-brass-shell-v6.js']))
add('runtime CSS metadata is v6','data-runtime-css-bundle="'+VERSION+'"' in html)

manifest_text=(ROOT/'assets/runtime/runtime-manifest-v6.0.0-alpha1.js').read_text(encoding='utf-8')
m=re.search(r'var m=(\{.*\});if\(Object\.freeze\)',manifest_text,re.S)
manifest=json.loads(m.group(1)) if m else {}
add('runtime manifest parses',bool(manifest))
add('runtime manifest version',manifest.get('version')==VERSION,manifest.get('version'))
for side,rel,key in [('modern','assets/runtime/critical-shell-v6.0.0-alpha1.js','criticalShellModern'),('legacy','assets/runtime/critical-shell-v6.0.0-alpha1.legacy.js','criticalShellLegacy')]:
 actual=(ROOT/rel).stat().st_size;expected=manifest.get('assetBytes',{}).get(key);add(side+' critical shell byte contract',actual==expected,{'actual':actual,'expected':expected})

# Architecture and usability invariants.
view=(ROOT/'assets/js/ivory-brass-view-model-v6.js').read_text(encoding='utf-8')
shell=(ROOT/'assets/js/ivory-brass-shell-v6.js').read_text(encoding='utf-8')
disclosure=(ROOT/'assets/js/ivory-brass-progressive-disclosure-v6.js').read_text(encoding='utf-8')
search=(ROOT/'assets/js/ivory-brass-search-compact-v6.js').read_text(encoding='utf-8')
layout=(ROOT/'assets/js/89-workspace-entry-ux-v6.0.0-alpha1.js').read_text(encoding='utf-8')
add('view-model contract is explicit','NutritionUIViewModel.v1' in view)
add('view-model does not calculate norms','normInput-' in view and 'profileReady?' in view and 'Mifflin' not in view and 'Harris' not in view)
add('uncomputed profile does not expose placeholder targets','profileReady?inputNumber' in view)
add('presentation shell does not move existing forms',all(x not in shell for x in ['appendChild(byId(\'needs','insertBefore(byId(\'needs','replaceChild']))
add('advanced fields remain in original parents','state.parentElement.parentNode.insertBefore(c,state.parentElement)' in disclosure and 'appendChild(state.parentElement)' not in disclosure)
add('mobile is forced to sequential sections',"w.innerWidth<900?'sections':value" in layout)
add('search first pass is compact',re.search(r'var PAGE=8\b',search) is not None)
add('print removes decorative workspace',all(x in (ROOT/'assets/css/ivory-brass-print-v6.css').read_text() for x in ['.ivory-insight-rail','.ivory-ration-hero','.ivory-quick-dock']))
add('programmatic headings do not look like inputs','[tabindex="-1"]:focus' in (ROOT/'assets/css/theme-system-v2.css').read_text() and 'box-shadow:none!important' in (ROOT/'assets/css/theme-system-v2.css').read_text())

# New assets remain inside the planned budgets.
budget=load('reports/v6-ui-asset-budget.json')
add('new CSS budget',budget['budgets']['css_ok'],budget['css']['bytes'])
add('new JS budget',budget['budgets']['js_ok'],budget['js']['bytes'])
add('no new framework dependency',not any(x in html.lower() for x in ['react.','vue.','angular.','bootstrap.']))

# Server credentials are intentionally included but not client-exposed.
secret=ROOT/'api/gemini-secret.php';secret_text=secret.read_text(encoding='utf-8') if secret.exists() else ''
secret_rx=re.compile(r'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
keys=secret_rx.findall(secret_text)
add('packaged server credential file exists',secret.is_file())
add('primary and backup Gemini keys are present',len(keys)>=2 and len(keys)==len(set(keys)),{'count':len(keys)})
add('credential file mode is owner-only',(secret.stat().st_mode&0o777)==0o600,oct(secret.stat().st_mode&0o777))
add('credential direct-request guard exists',all(x in secret_text for x in ['SCRIPT_FILENAME','http_response_code(404)','exit;']))
hits=[]
for p in ROOT.rglob('*'):
 if not p.is_file() or any(x in p.parts for x in ['.git','node_modules','__pycache__','release']):continue
 rel=p.relative_to(ROOT).as_posix()
 if rel=='api/gemini-secret.php':continue
 try:t=p.read_text(encoding='utf-8')
 except Exception:continue
 if secret_rx.search(t):hits.append(rel)
add('live key patterns occur only in server secret file',not hits,hits)
add('client entry points contain no live key',not secret_rx.search(html+html2))

# Protected calculation assets and database.
protected=load('reports/v6-protected-data-comparison.json')
add('all protected data/formula/normative files unchanged',protected.get('ok') is True and protected.get('changed')==[],protected)
products=json.loads(gzip.decompress((ROOT/'assets/data/products.v5.3.210-p1.3.compact.json.gz').read_bytes()))
add('product database count remains 1105',len(products)==1105,len(products))
reg=load('reports/v6-core-regression-comparison.json')
add('no new core regression failures',reg.get('ok') is True and reg.get('new_failures')==[],{'passed':reg.get('passed'),'known_baseline_failures':reg.get('known_baseline_failures')})

# Re-run critical unit contracts during the final audit.
run('UTF-8 safety unit contract',['php','tests/hf28-utf8-safe.test.php'])
run('Gemini static consent contract',['node','tests/hf28-gemini-contract.test.js'])
run('Gemini mock media E2E',['php','tests/hf28-media-mock-e2e.test.php'])
run('Gemini credential loading contract',['php','tests/hf28-credential-loading.test.php'])
run('static project checks',[sys.executable,'tools/static_checks.py'])

# No generated caches may enter the final archives.
cache_hits=[]
for name in ['__pycache__','.pytest_cache','.mypy_cache','.ruff_cache']:
 cache_hits.extend(str(p.relative_to(ROOT)) for p in ROOT.rglob(name))
add('no build caches remain',not cache_hits,cache_hits)

result={'ok':all(x['ok'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks,
'limitations':['The build container cannot resolve generativelanguage.googleapis.com, so the live server request reached the Gemini transport layer but did not receive the provider response. Response parsing and ration import were verified with a controlled provider mock.','Physical Android, iPhone, Samsung Internet, Safari and Qt WebEngine permission dialogs still require deployment-device acceptance.','The release is alpha 1: automated and heuristic usability checks passed, but a human usability study has not yet been performed.']}
(ROOT/'reports/v6-release-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
