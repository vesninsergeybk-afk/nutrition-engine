#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, ssl, urllib.error, urllib.request

UI_DEFAULT='v5.3.210-rc2-hf18'
API_DEFAULT='v5.3.210-rc2'

def safe_headers(headers):
    out=dict(headers or {})
    if 'set-cookie' in out:
        cookie=out['set-cookie']
        parts=cookie.split(';')
        name=parts[0].split('=',1)[0] if parts else 'cookie'
        out['set-cookie']=name+'=<redacted>;'+(';'.join(parts[1:]) if len(parts)>1 else '')
    for key in ('authorization','proxy-authorization'):
        if key in out:
            out[key]='<redacted>'
    return out

def request(url, method='GET', data=None, headers=None):
    req=urllib.request.Request(url,data=data,method=method,headers=headers or {})
    try:
        with urllib.request.urlopen(req,timeout=25,context=ssl.create_default_context()) as r:
            return r.status,{str(k).lower():str(v) for k,v in r.headers.items()},r.read()
    except urllib.error.HTTPError as e:
        return e.code,{str(k).lower():str(v) for k,v in e.headers.items()},e.read()

def main():
    ap=argparse.ArgumentParser(description='Remote Stage 5A smoke test: UI release, API baseline, headers and private surface denial.')
    ap.add_argument('base_url')
    ap.add_argument('--expected-ui',default=UI_DEFAULT)
    ap.add_argument('--expected-api',default=API_DEFAULT)
    ap.add_argument('--allow-http',action='store_true')
    ap.add_argument('--json-out')
    args=ap.parse_args();base=args.base_url.rstrip('/');checks=[]
    def add(name,ok,detail=''):
        checks.append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',detail)

    st,h,b=request(base+'/index.html');html=b.decode('utf-8','replace')
    add('index_available',st==200,st)
    ui=re.search(r'data-runtime-manifest=["\']([^"\']+)',html)
    ui_value=ui.group(1) if ui else None
    add('ui_release_identity',ui_value==args.expected_ui,ui_value)
    add('ui_runtime_bundle',f'runtime-bundle-v5.3.210-rc2-hf18.css?v={args.expected_ui}' in html,args.expected_ui)
    add('https_or_explicit_http',base.startswith('https://') or args.allow_http,base)
    add('index_security_headers',h.get('x-content-type-options','').lower()=='nosniff' and 'noindex' in h.get('x-robots-tag','').lower() and 'x-powered-by' not in h,safe_headers(h))

    st,h,b=request(base+'/api/gemini.php')
    try: health=json.loads(b)
    except Exception: health={}
    add('api_health',st==200 and health.get('ok') is True,{'status':st,'configured':health.get('configured'),'ai_available':health.get('ai_available')})
    add('api_baseline_version',health.get('version')==args.expected_api,health.get('version'))
    add('api_csrf_token',bool(re.fullmatch(r'[a-f0-9]{64}',str(health.get('csrf_token','')))),len(str(health.get('csrf_token',''))))
    add('api_security_headers',h.get('x-content-type-options','').lower()=='nosniff' and 'x-powered-by' not in h,safe_headers(h))

    st,_,robots=request(base+'/robots.txt');add('robots_disallow',st==200 and b'Disallow: /' in robots,st)
    st,asset_headers,_=request(base+'/assets/js/69-release-support-v5.3.210-rc2.js')
    cache=asset_headers.get('cache-control','')
    add('immutable_asset_cache',st==200 and 'immutable' in cache and 'max-age=31536000' in cache,cache)
    for path in ['/api/gemini-secret.php','/api/gemini-guard.php','/tests/','/tools/','/.git/HEAD','/hosting-check.html']:
        st,_,_=request(base+path);add('deny_'+path,st in (403,404),st)
    payload=b'{"operation":"planner"}'
    st,_,_=request(base+'/api/gemini.php','POST',payload,{'Content-Type':'application/json'})
    add('csrf_required',st==403,st)
    result={'schema_version':1,'ok':all(x['passed'] for x in checks),'base_url':base,'expected_ui_release':args.expected_ui,'expected_api_release':args.expected_api,'checks':checks}
    if args.json_out:
        from pathlib import Path
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
