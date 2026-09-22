#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, ssl, urllib.error, urllib.request

EXPECTED_VERSION='v5.3.210-rc2'

def request(url, method='GET', data=None, headers=None):
    req=urllib.request.Request(url,data=data,method=method,headers=headers or {})
    try:
        with urllib.request.urlopen(req,timeout=20,context=ssl.create_default_context()) as r:
            return r.status,dict(r.headers),r.read()
    except urllib.error.HTTPError as e:
        return e.code,dict(e.headers),e.read()

def main():
    ap=argparse.ArgumentParser(description='Remote smoke test for the RC1 hosting build.')
    ap.add_argument('base_url');ap.add_argument('--allow-http',action='store_true')
    args=ap.parse_args();base=args.base_url.rstrip('/')
    checks=[]
    def add(name,ok,detail): checks.append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',detail)
    st,h,b=request(base+'/api/gemini.php')
    try: health=json.loads(b)
    except Exception: health={}
    add('https_health',st==200 and (base.startswith('https://') or args.allow_http) and health.get('ok') is True,{'status':st,'version':health.get('version')})
    add('release_version',health.get('version')==EXPECTED_VERSION,health.get('version'))
    lower={str(k).lower():str(v) for k,v in h.items()}
    add('security_headers',lower.get('x-content-type-options','').lower()=='nosniff' and 'x-powered-by' not in lower,h)
    add('beta_noindex','noindex' in lower.get('x-robots-tag','').lower(),lower.get('x-robots-tag',''))
    st,_,robots=request(base+'/robots.txt');add('robots_disallow',st==200 and b'Disallow: /' in robots,st)
    st,asset_headers,_=request(base+'/assets/js/69-release-support-v5.3.210-rc2.js')
    cache=str(asset_headers.get('Cache-Control',asset_headers.get('cache-control','')))
    add('beta_support_asset',st==200,st)
    add('immutable_asset_cache','immutable' in cache and 'max-age=31536000' in cache,cache)
    for path in ['/api/gemini-secret.php','/api/gemini-guard.php','/tests/','/tools/','/.git/HEAD','/hosting-check.html']:
        st,_,_=request(base+path);add('deny_'+path,st in (403,404),st)
    payload=b'{"operation":"planner"}'
    st,_,_=request(base+'/api/gemini.php','POST',payload,{'Content-Type':'application/json'})
    add('csrf_required',st==403,st)
    result={'ok':all(x['passed'] for x in checks),'release_version':EXPECTED_VERSION,'checks':checks}
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
