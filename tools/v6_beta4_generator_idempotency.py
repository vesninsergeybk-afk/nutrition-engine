#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta4-profile-hierarchy'
FILES=[
 'config/runtime-assets.v6.0.0-beta4.json','config/runtime-assets.v5.3.210-rc2.json',
 'assets/runtime/runtime-manifest-v6.0.0-beta4.js','assets/runtime/critical-shell-v6.0.0-beta4.js','assets/runtime/critical-shell-v6.0.0-beta4.legacy.js',
 'assets/js/00-runtime-bootstrap-v6.0.0-beta4.js','assets/js/00-runtime-selector-v6.0.0-beta4.js','assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta4.legacy.js',
 'index.html','index-v5.3.210.html','tools/runtime_inventory.py']
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def snap(): return {f:sha(ROOT/f) for f in FILES}
def run():
 env=dict(os.environ); env['PYTHONDONTWRITEBYTECODE']='1'
 return subprocess.run([sys.executable,str(ROOT/'tools/generate_v6_beta4_runtime.py')],cwd=ROOT,env=env,capture_output=True,text=True)
def main():
 global ROOT
 ap=argparse.ArgumentParser(); ap.add_argument('--app-root',default=str(ROOT)); ap.add_argument('--json-out',default='reports/v6-beta4-generator-idempotency.json'); ns=ap.parse_args(); ROOT=Path(ns.app_root).resolve()
 a=run(); first=snap() if a.returncode==0 else {}; b=run(); second=snap() if b.returncode==0 else {}; diff=[f for f in FILES if first.get(f)!=second.get(f)]
 result={'ok':a.returncode==0 and b.returncode==0 and not diff,'release_version':VERSION,'files':len(FILES),'changed_after_second_run':diff,'first_stdout':a.stdout[-500:],'second_stdout':b.stdout[-500:],'errors':(a.stderr+b.stderr)[-1000:]}
 out=ROOT/ns.json_out; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,ensure_ascii=False,indent=2)); raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__': main()
