#!/usr/bin/env python3
import http.cookiejar, json, os, pathlib, shutil, socket, subprocess, tempfile, time, urllib.error, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
work=pathlib.Path(tempfile.mkdtemp(prefix='nutrition-p041-http-'))
sessions=work/'sessions'; guard=work/'guard'; sessions.mkdir(mode=0o700); guard.mkdir(mode=0o700)
sock=socket.socket(); sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]; sock.close()
env=os.environ.copy(); env['NUTRITION_GEMINI_GUARD_DIR']=str(guard); env['NUTRITION_GEMINI_GUARD_LOG']='0'; env['NUTRITION_GEMINI_ENABLED']='0'
proc=subprocess.Popen(['php','-d',f'session.save_path={sessions}','-S',f'127.0.0.1:{port}','-t',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env=env)
base=f'http://127.0.0.1:{port}/api/gemini.php'
try:
    for _ in range(50):
        try:
            urllib.request.urlopen(base,timeout=3).read()
            break
        except Exception: time.sleep(.05)
    for _ in range(49): urllib.request.urlopen(base,timeout=3).read()
    files=list(sessions.iterdir())
    assert files==[], f'health created {len(files)} PHP sessions'
    jar=http.cookiejar.CookieJar(); opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    data=json.loads(opener.open(base,timeout=3).read())
    token=data['csrf_token']; assert len(token)==64
    csrf_cookie=next((c for c in jar if c.name=='nutri_ai_csrf' and c.value==token),None)
    assert csrf_cookie is not None, 'CSRF cookie missing'
    assert csrf_cookie.path=='/' and csrf_cookie.has_nonstandard_attr('HttpOnly'), 'CSRF cookie flags incomplete'
    assert str(csrf_cookie._rest.get('SameSite','')).lower()=='lax', 'SameSite=Lax missing'
    payload=json.dumps({'action':'explain_results','payload':{'usage_context':{'user_confirmed_18':True,'professional_business_use':True},'ration':{'items':[]}}}).encode()
    req=urllib.request.Request(base,data=payload,headers={'Content-Type':'application/json','X-Nutrition-CSRF':token})
    try: opener.open(req,timeout=3)
    except urllib.error.HTTPError as e:
        body=json.loads(e.read()); assert e.code==422 and body.get('error_code')=='empty_ration_snapshot', (e.code,body)
    bad=urllib.request.Request(base,data=payload,headers={'Content-Type':'application/json','X-Nutrition-CSRF':'0'*64})
    try: opener.open(bad,timeout=3); raise AssertionError('bad CSRF accepted')
    except urllib.error.HTTPError as e:
        body=json.loads(e.read()); assert e.code==403 and body.get('error_code')=='csrf_token_invalid', (e.code,body)
    body_only=json.dumps({'action':'explain_results','csrf_token':token,'payload':{'usage_context':{'user_confirmed_18':True,'professional_business_use':True},'ration':{'items':[]}}}).encode()
    no_header=urllib.request.Request(base,data=body_only,headers={'Content-Type':'application/json'})
    try: opener.open(no_header,timeout=3); raise AssertionError('body-only CSRF accepted')
    except urllib.error.HTTPError as e:
        body=json.loads(e.read()); assert e.code==403 and body.get('error_code')=='csrf_token_invalid', (e.code,body)
    unsupported=urllib.request.Request(base,data=b'abc',headers={'Content-Type':'text/plain','X-Nutrition-CSRF':token})
    try: opener.open(unsupported,timeout=3); raise AssertionError('unsupported media type accepted')
    except urllib.error.HTTPError as e:
        body=json.loads(e.read()); assert e.code==415 and body.get('error_code')=='unsupported_media_type', (e.code,body)
    assert list(sessions.iterdir())==[], 'rejected/local-only requests created PHP sessions'
    planner={'action':'plan_ration','payload':{'usage_context':{'user_confirmed_18':True,'professional_business_use':True},'ration':[{'key':'x','name':'x','grams':1}],'verified_scenarios':[{'scenario_id':'s1','label':'x','operations':[]}]}}
    for _ in range(20):
        one=http.cookiejar.CookieJar(); one_opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(one)); health=json.loads(one_opener.open(base,timeout=3).read()); req=urllib.request.Request(base,data=json.dumps(planner).encode(),headers={'Content-Type':'application/json','X-Nutrition-CSRF':health['csrf_token']})
        try: one_opener.open(req,timeout=3); raise AssertionError('kill switch request accepted')
        except urllib.error.HTTPError as e: assert e.code==503
    assert list(sessions.iterdir())==[], 'guard-rejected POST requests created PHP sessions'
    print(json.dumps({'status':'PASS','assertions':12,'health_requests':70,'session_files':0},ensure_ascii=False,indent=2))
finally:
    proc.terminate()
    try: proc.wait(timeout=3)
    except subprocess.TimeoutExpired: proc.kill()
    shutil.rmtree(work,ignore_errors=True)
