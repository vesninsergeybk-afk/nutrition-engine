#!/usr/bin/env python3
from __future__ import annotations
import argparse, http.cookiejar, json, os, socket, subprocess, time, urllib.error, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def free_port():
    s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p

def multipart(fields:dict[str,str]):
    boundary='----NutritionHF28Boundary'
    chunks=[]
    for k,v in fields.items():
        chunks.extend([f'--{boundary}\r\n'.encode(),f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode(),str(v).encode('utf-8'),b'\r\n'])
    chunks.append(f'--{boundary}--\r\n'.encode())
    return b''.join(chunks),f'multipart/form-data; boundary={boundary}'

def request(opener,url,method='GET',fields=None,csrf=''):
    data=None;headers={}
    if fields is not None:
        data,ctype=multipart(fields);headers['Content-Type']=ctype;headers['X-Nutrition-CSRF']=csrf
    req=urllib.request.Request(url,data=data,headers=headers,method=method)
    try:
        with opener.open(req,timeout=20) as r:return r.status,json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read().decode('utf-8'))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--json-out',default='reports/hf28-http-contract.json');a=ap.parse_args()
    port=free_port();log=ROOT/'reports/hf28-http-contract-server.log';log.parent.mkdir(exist_ok=True)
    env=os.environ.copy();env['NUTRITION_GEMINI_ENABLED']='1';env['GEMINI_API_KEY']='hf28-http-contract-dummy-key';env['NUTRITION_GEMINI_GUARD_DIR']=f'/tmp/nutrition-hf28-http-{os.getpid()}'
    with log.open('wb') as fh:
        proc=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(ROOT)],cwd=ROOT,env=env,stdout=fh,stderr=subprocess.STDOUT)
        try:
            url=f'http://127.0.0.1:{port}/api/gemini.php';opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            for _ in range(80):
                try: status,health=request(opener,url);break
                except Exception: time.sleep(.1)
            else: raise RuntimeError('PHP server did not start')
            csrf=health.get('csrf_token','')
            common={'action':'recognize_ration_media','ai_profile_state':'normal'}
            cases=[]
            def add(name,fields,expected_status,expected_code):
                st,body=request(opener,url,'POST',fields,csrf);cases.append({'case':name,'status':st,'error_code':body.get('error_code',''),'body':body,'passed':st==expected_status and body.get('error_code')==expected_code})
            add('age-required',common,403,'ai_age_attestation_required')
            add('non-clinical-attestation-required',{**common,'ai_user_confirmed_18':'1'},403,'ai_non_clinical_use_attestation_required')
            add('media-consent-required',{**common,'ai_user_confirmed_18':'1','ai_non_clinical_use':'1'},403,'ai_media_transfer_consent_required')
            add('ordinary-adult-reaches-media-validation',{**common,'ai_user_confirmed_18':'1','ai_non_clinical_use':'1','ai_media_transfer_consent':'1'},422,'media_missing')
            add('clinical-profile-blocked',{**common,'ai_user_confirmed_18':'1','ai_non_clinical_use':'1','ai_media_transfer_consent':'1','ai_profile_state':'oncology'},403,'ai_clinical_profile_blocked')
            result={'ok':status==200 and health.get('version')=='v5.3.210-rc2-hf28' and len(csrf)==64 and all(c['passed'] for c in cases),'release_version':'v5.3.210-rc2-hf28-gemini-reliability','health':{'status':status,'ok':health.get('ok'),'version':health.get('version'),'configured':health.get('configured'),'csrf_length':len(csrf)},'assertions':5,'cases':cases}
            out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
        finally:
            proc.terminate()
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:proc.kill()
if __name__=='__main__':main()
