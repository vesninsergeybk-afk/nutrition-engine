#!/usr/bin/env python3
from __future__ import annotations
import http.cookiejar,json,os,re,socket,subprocess,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SECRET_RX=re.compile(r'(?:AIza[0-9A-Za-z_-]{25,}|AQ\.[0-9A-Za-z_-]{25,}|sk-[0-9A-Za-z_-]{20,})')
def free_port():
 s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def main():
 p=free_port();env=os.environ.copy();env['NUTRITION_GEMINI_ENABLED']='1';env['NUTRITION_GEMINI_GUARD_DIR']=f'/tmp/nutrition-hf28-packaged-{os.getpid()}'
 for k in ('GEMINI_API_KEY','GEMINI_API_KEY_BACKUP','GEMINI_API_KEYS','GEMINI_SECRET_FILE'):env.pop(k,None)
 proc=subprocess.Popen(['php','-S',f'127.0.0.1:{p}','-t',str(ROOT)],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));base=f'http://127.0.0.1:{p}'
  for _ in range(80):
   try:
    with opener.open(base+'/api/gemini.php',timeout=5) as r:status=r.status;raw=r.read().decode('utf-8');health=json.loads(raw);break
   except Exception:time.sleep(.1)
  else:raise RuntimeError('PHP server did not start')
  direct_req=urllib.request.Request(base+'/api/gemini-secret.php')
  try:
   with opener.open(direct_req,timeout=5) as r:direct_status=r.status;direct_body=r.read().decode('utf-8','replace')
  except Exception as e:
   direct_status=getattr(e,'code',0);direct_body=e.read().decode('utf-8','replace') if hasattr(e,'read') else ''
  checks={
   'health_status_200':status==200,
   'packaged_credentials_configured':health.get('configured') is True,
   'health_response_does_not_expose_keys':SECRET_RX.search(raw) is None,
   'direct_secret_request_is_404':direct_status==404,
   'direct_secret_response_is_empty':direct_body=='',
   'direct_secret_response_does_not_expose_keys':SECRET_RX.search(direct_body) is None,
  }
  out={'ok':all(checks.values()),'release_version':'v5.3.210-rc2-hf28-gemini-reliability','assertions':len(checks),'checks':checks,'health':{'status':status,'configured':health.get('configured')},'direct_request':{'status':direct_status,'body_bytes':len(direct_body.encode())}}
  (ROOT/'reports/hf28-packaged-secret-http.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
 finally:
  proc.terminate()
  try:proc.wait(timeout=3)
  except subprocess.TimeoutExpired:proc.kill()
if __name__=='__main__':main()
