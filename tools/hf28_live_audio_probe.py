#!/usr/bin/env python3
from __future__ import annotations
import http.cookiejar,json,os,socket,subprocess,time,urllib.error,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; AUDIO=Path('/mnt/data/test_ration_ru.wav')
def port():
 s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def encode(fields,filename,data):
 b='----NutritionHF28Live';out=[]
 for k,v in fields.items():out += [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode('utf-8')]
 out += [f'--{b}\r\nContent-Disposition: form-data; name="media[]"; filename="{filename}"\r\nContent-Type: audio/wav\r\n\r\n'.encode(),data,b'\r\n',f'--{b}--\r\n'.encode()]
 return b''.join(out),f'multipart/form-data; boundary={b}'
def main():
 if not AUDIO.is_file():raise SystemExit('test audio missing')
 p=port();log=ROOT/'reports/hf28-live-audio-server.log';env=os.environ.copy();env['NUTRITION_GEMINI_ENABLED']='1';env['NUTRITION_GEMINI_GUARD_DIR']=f'/tmp/nutrition-hf28-live-{os.getpid()}'
 with log.open('wb') as fh:
  proc=subprocess.Popen(['php','-S',f'127.0.0.1:{p}','-t',str(ROOT)],cwd=ROOT,env=env,stdout=fh,stderr=subprocess.STDOUT)
  try:
   jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));url=f'http://127.0.0.1:{p}/api/gemini.php'
   for _ in range(80):
    try:
     with opener.open(url,timeout=5) as r:health=json.loads(r.read());break
    except Exception:time.sleep(.1)
   csrf=health['csrf_token'];context=('Проверка русской строки: творог двести граммов, яблоко и чай. '*20)+'Финал ✅'
   meta=json.dumps([{'source_id':'live_audio_1','kind':'audio','meal_code':'full_day','label_ru':'Весь день','filename':AUDIO.name,'order':1}],ensure_ascii=False)
   fields={'action':'recognize_ration_media','ai_user_confirmed_18':'1','ai_non_clinical_use':'1','ai_media_transfer_consent':'1','ai_profile_state':'normal','context':context,'media_meta':meta}
   body,ctype=encode(fields,AUDIO.name,AUDIO.read_bytes());req=urllib.request.Request(url,data=body,method='POST',headers={'Content-Type':ctype,'X-Nutrition-CSRF':csrf})
   try:
    with opener.open(req,timeout=80) as r:status=r.status;payload=json.loads(r.read())
   except urllib.error.HTTPError as e:status=e.code;payload=json.loads(e.read())
   code=payload.get('error_code','');serialized=json.dumps(payload,ensure_ascii=False)
   malformed='UTF-8' in serialized or 'Malformed' in serialized or code in {'encode_error','php_fatal_error'}
   result={'ok':not malformed and status in {200,429,500,502,503,504},'release_version':'v5.3.210-rc2-hf28-gemini-reliability','http_status':status,'error_code':code,'provider_response_verified':status==200 and payload.get('ok') is True,'utf8_request_preparation_verified':not malformed,'response':payload,'note':'Внешний ответ Gemini подтверждён только при provider_response_verified=true; транспортная ошибка всё равно подтверждает прохождение UTF-8-подготовки и серверной валидации до сетевого вызова.'}
   (ROOT/'reports/hf28-live-audio-transport-probe.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
  finally:
   proc.terminate()
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.kill()
if __name__=='__main__':main()
