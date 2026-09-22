#!/usr/bin/env python3
from __future__ import annotations
import argparse, gzip, hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/hf24_full')
VERSION='v5.3.210-rc2-hf25-splash-balance'
MANIFEST='assets/runtime/runtime-manifest-v5.3.210-rc2-hf25.js'
BOOT='assets/js/00-runtime-bootstrap-v5.3.210.js'
LBOOT='assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js'
SELECTOR='assets/js/00-runtime-selector-v5.3.210.js'
ALLOWED_CHANGED={
 'index.html','index-v5.3.210.html','config/runtime-assets.v5.3.210-rc2.json',BOOT,LBOOT,SELECTOR,
 'assets/runtime/runtime-manifest-v5.3.210-rc2-hf24.js'
}
ALLOWED_ADDED={MANIFEST,'tools/hf25_splash_acceptance_chromium.py','tools/hf25_full_acceptance_chromium.py','tools/hf25_splash_balance_audit.py',
 'reports/hf25-splash-acceptance.json','reports/hf25-full-acceptance-browser.json','reports/hf25-runtime-inventory.json','reports/hf25-splash-balance-static.json','NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX25_SPLASH_BALANCE_TEST_REPORT_RU.md','tools/build_hf25_splash_balance.py'}

def sha(p:Path): return hashlib.sha256(p.read_bytes()).hexdigest()
def run(cmd): return subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
def load_manifest():
 t=(ROOT/MANIFEST).read_text(encoding='utf-8'); m=re.search(r'var m=(\{.*\});if\(Object\.freeze',t)
 if not m: raise ValueError('manifest payload missing')
 return json.loads(m.group(1))
def clean(u): return str(u).split('?',1)[0].lstrip('./')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--json-out',default=str(ROOT/'reports/hf25-splash-balance-static.json'));args=ap.parse_args()
 checks=[]
 def add(name,ok,detail=''): checks.append({'name':name,'passed':bool(ok),'detail':str(detail)})
 cfg=json.loads((ROOT/'config/runtime-assets.v5.3.210-rc2.json').read_text(encoding='utf-8')); mf=load_manifest()
 add('config release handshake',cfg.get('release_version')==VERSION,cfg.get('release_version'))
 add('runtime manifest handshake',mf.get('version')==VERSION,mf.get('version'))
 for name in ('index.html','index-v5.3.210.html'):
  t=(ROOT/name).read_text(encoding='utf-8')
  add(name+' release handshake',VERSION in t and 'runtime-manifest-v5.3.210-rc2-hf25.js' in t)
  add(name+' metadata','data-performance-release="hf25-splash-balance"' in t and 'data-build-date="2026-07-26"' in t)
 sel=(ROOT/SELECTOR).read_text(encoding='utf-8'); b=(ROOT/BOOT).read_text(encoding='utf-8'); lb=(ROOT/LBOOT).read_text(encoding='utf-8')
 add('selector release handshake',("RELEASE_VERSION='"+VERSION+"'") in sel)
 add('modern bootstrap handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in b)
 add('legacy bootstrap handshake',("RELEASE_GATE_VERSION = '"+VERSION+"'") in lb)
 for label,t in [('modern',b),('legacy',lb)]:
  add(label+' minimum visible duration','var MIN_BLOCKING_LOADER_MS = 1450;' in t)
  add(label+' smooth fade','var LOADER_FADE_MS = 340;' in t and 'transition:opacity .34s ease,visibility .34s ease' in t)
  add(label+' reduced-motion handling','@media (prefers-reduced-motion:reduce)' in t and 'prefersReducedMotion() ? 0 : LOADER_FADE_MS' in t)
  add(label+' no extra delay on slow startup','Math.max(0, MIN_BLOCKING_LOADER_MS - elapsed)' in t)
  add(label+' closing state isolates background updates','__RUNTIME_LOADER_CLOSING__' in t and "updateBackgroundStatus(text, kind)" in t)
  add(label+' truthful ready screen',all(x in t for x in ('Первый экран готов','база продуктов продолжает загружаться в фоне','Остальные разделы активируются автоматически')))
  add(label+' measured close metadata',all(x in t for x in ('loader_visible_ms','loader_minimum_ms','loader_close_scheduled_ms')))
 add('modern and legacy timing policy aligned',all(x in lb for x in ('MIN_BLOCKING_LOADER_MS = 1450','LOADER_FADE_MS = 340','loader_visible_ms')))

 # Functional payload should remain byte-identical to HF24 outside explicit release/loader files.
 changed=[];added=[];removed=[];checked=0
 old={p.relative_to(BASE).as_posix():p for p in BASE.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.relative_to(BASE).as_posix() not in {'release-manifest.json','release-sbom.spdx.json'}}
 new={p.relative_to(ROOT).as_posix():p for p in ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.relative_to(ROOT).as_posix() not in {'release-manifest.json','release-sbom.spdx.json'}}
 for rel in sorted(old.keys()|new.keys()):
  if rel not in old: added.append(rel)
  elif rel not in new: removed.append(rel)
  else:
   checked+=1
   if sha(old[rel])!=sha(new[rel]): changed.append(rel)
 unexpected_changed=[x for x in changed if x not in ALLOWED_CHANGED]
 unexpected_added=[x for x in added if x not in ALLOWED_ADDED]
 add('change surface restricted',not unexpected_changed and not unexpected_added and not removed,f'checked={checked}; changed={changed}; added={added}; removed={removed}')

 # Explicitly protect calculation/data/media payload.
 protected=[]
 for top in ('data','api','assets/data','assets/css','assets/js','assets/legacy/js','assets/runtime'):
  bd=BASE/top
  if not bd.exists(): continue
  for p in bd.rglob('*'):
   if not p.is_file(): continue
   rel=p.relative_to(BASE).as_posix()
   if rel in ALLOWED_CHANGED or rel=='assets/runtime/runtime-manifest-v5.3.210-rc2-hf24.js': continue
   q=ROOT/rel
   if q.is_file(): protected.append((rel,sha(p)==sha(q)))
 add('calculation data media and bundles unchanged',all(ok for _,ok in protected),f'{len(protected)} protected files checked')

 fs=cfg['fast_start']
 crit=clean(fs['critical_shell_scripts']['modern'][0]);defer=clean(fs['deferred_runtime_bundles']['modern']);prod=clean(fs['product_compressed_json'])
 add('critical bundle remains compact',(ROOT/crit).stat().st_size<80000,(ROOT/crit).stat().st_size)
 add('background compression preserved',(ROOT/prod).stat().st_size<700000 and (ROOT/(defer+'.gz')).stat().st_size<700000,f"products={(ROOT/prod).stat().st_size}; runtime={(ROOT/(defer+'.gz')).stat().st_size}")
 with gzip.open(ROOT/prod,'rt',encoding='utf-8') as f: products=json.load(f)
 keys=[x.get('key') for x in products]
 add('product database unchanged and complete',len(products)==1105 and len(set(keys))==1105 and None not in keys,f'{len(products)} products')

 syntax=[BOOT,LBOOT,SELECTOR,MANIFEST,crit,clean(fs['critical_shell_scripts']['legacy'][0]),defer,clean(fs['deferred_runtime_bundles']['legacy'])]
 bad=[]
 for rel in syntax:
  r=run(['node','--check',rel])
  if r.returncode: bad.append(rel+': '+r.stdout[-200:])
 add('active JavaScript syntax',not bad,' | '.join(bad))
 r=run([sys.executable,'tools/generate_runtime_assets.py','--check']);add('runtime assets reproducible',r.returncode==0,r.stdout[-600:])
 r=run([sys.executable,'tools/runtime_inventory.py','--json-out','reports/hf25-runtime-inventory.json']);add('runtime closure complete',r.returncode==0,r.stdout[-500:])
 if shutil.which('php'):
  badphp=[]
  for p in sorted((ROOT/'api').glob('*.php')):
   rr=run(['php','-l',str(p.relative_to(ROOT))])
   if rr.returncode: badphp.append(p.name)
  add('PHP API syntax',not badphp,', '.join(badphp))
 suites=[
  ('formula registry',['node','tests/p1-4-formula-registry.test.js']),('normative registry',['node','tests/p1-2-normative-registry.test.js']),
  ('HEI',['node','tests/hei2020-hf3.test.js']),('navigation',['node','tests/navigation-shell-parallel.test.js']),
  ('profile and needs',['node','tests/workspace-profile-needs-hf8.test.js'])]
 for name,cmd in suites:
  rr=run(cmd);add(name+' regression',rr.returncode==0,rr.stdout[-500:])
 splash=json.loads((ROOT/'reports/hf25-splash-acceptance.json').read_text(encoding='utf-8'))
 full=json.loads((ROOT/'reports/hf25-full-acceptance-browser.json').read_text(encoding='utf-8'))
 add('splash browser acceptance',splash.get('ok') is True,f"{splash.get('assertions')} scenarios")
 add('full browser acceptance',full.get('ok') is True,f"{full.get('assertions')} scenarios")
 result={'ok':all(x['passed'] for x in checks),'release_version':VERSION,'assertions':len(checks),'checks':checks}
 out=Path(args.json_out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
