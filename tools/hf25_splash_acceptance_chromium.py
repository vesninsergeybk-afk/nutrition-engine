#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, mimetypes, time
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf25-splash-balance'

def mime(path:Path)->str:
    if path.suffix=='.gz': return 'application/gzip'
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

async def install(page, delays=None, failures=None):
    delays=delays or {}; failures=failures or set(); requests=[]
    async def handler(route, request):
        rel=unquote(urlparse(request.url).path).lstrip('/'); requests.append(rel)
        for marker,delay in delays.items():
            if marker in rel: await asyncio.sleep(delay)
        if any(marker in rel for marker in failures):
            await route.fulfill(status=404, body='forced missing '+rel); return
        path=(ROOT/rel).resolve()
        try: path.relative_to(ROOT)
        except ValueError:
            await route.fulfill(status=403,body='forbidden'); return
        if path.is_file(): await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else: await route.fulfill(status=404,body='missing '+rel)
    await page.route('https://app.test/**',handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    started=time.perf_counter(); await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    return requests,started

async def startup_case(browser, name, viewport=(390,844), delays=None):
    ctx=await browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},bypass_csp=True)
    page=await ctx.new_page(); errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m:errors.append('console error: '+m.text) if m.type=='error' else None)
    requests,started=await install(page,delays=delays)
    await page.wait_for_function("window.__APP_SHELL_READY_STATE__&&window.__APP_SHELL_READY_STATE__.status==='ready'",timeout=30000)
    shell_wall=(time.perf_counter()-started)*1000
    at_shell=await page.evaluate("""() => ({
      release:window.__APP_SHELL_READY_STATE__.release,
      shellTiming:window.__APP_SHELL_READY_STATE__.timing_ms,
      closing:!!window.__RUNTIME_LOADER_CLOSING__,
      closed:!!window.__RUNTIME_LOADER_CLOSED__,
      overlay:!!document.getElementById('runtimeBootStatusOverlay'),
      kind:document.getElementById('runtimeBootStatus')&&document.getElementById('runtimeBootStatus').dataset.kind,
      primary:document.querySelector('#runtimeBootStatus .rbs-primary')&&document.querySelector('#runtimeBootStatus .rbs-primary').textContent,
      percent:document.querySelector('#runtimeBootStatus .rbs-percent')&&document.querySelector('#runtimeBootStatus .rbs-percent').textContent
    })""")
    await page.wait_for_function("window.__RUNTIME_LOADER_CLOSED__===true",timeout=10000)
    closed_wall=(time.perf_counter()-started)*1000
    closed=await page.evaluate("() => ({...window.__APP_SHELL_READY_STATE__,overlayHidden:document.getElementById('runtimeBootStatusOverlay')?document.getElementById('runtimeBootStatusOverlay').classList.contains('hide'):true})")
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    full_wall=(time.perf_counter()-started)*1000
    state=await page.evaluate("() => ({release:window.__APP_BOOTSTRAP_META__.release,products:window.__PRODUCTS_ARRAY__&&window.__PRODUCTS_ARRAY__.length,background:!!window.__APP_BACKGROUND_READY__})")
    slow_critical=bool(delays and any('critical-shell' in k for k in delays))
    min_ok=(closed.get('loader_visible_ms',0)>=1420) if not slow_critical else (closed.get('loader_visible_ms',0)>=at_shell['shellTiming']-50 and closed.get('loader_visible_ms',0)<at_shell['shellTiming']+500)
    lifecycle_ok=((at_shell['closing'] and not at_shell['closed']) if not slow_critical else at_shell['closed'])
    passed=(at_shell['release']==VERSION and at_shell['overlay'] and lifecycle_ok and at_shell['primary']=='Первый экран готов' and at_shell['percent']=='100%' and min_ok and closed['overlayHidden'] and state['release']==VERSION and state['products']==1105 and state['background'] and not errors)
    result={'case':name,'shell_wall_ms':round(shell_wall),'closed_wall_ms':round(closed_wall),'full_wall_ms':round(full_wall),'at_shell':at_shell,'closed':closed,'state':state,'requests':len(requests),'errors':errors,'passed':passed}
    await ctx.close(); return result

async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=[]
        cases.append(await startup_case(browser,'normal-mobile'))
        cases.append(await startup_case(browser,'slow-background-desktop',(1440,900),{'products.v5.3.210-p1.3.compact.json.gz':2.2,'deferred-runtime-v5.3.210-rc2-hf24.js.gz':2.2}))
        cases.append(await startup_case(browser,'slow-critical-no-extra-wait',(390,844),{'critical-shell-v5.3.210-rc2-hf24.js':2.0}))
        await browser.close(); return cases

def main():
    global ROOT
    ap=argparse.ArgumentParser(); ap.add_argument('--chromium',default='/usr/bin/chromium'); ap.add_argument('--app-root',default=str(ROOT)); ap.add_argument('--json-out'); args=ap.parse_args(); ROOT=Path(args.app_root).resolve()
    cases=asyncio.run(run(args.chromium)); result={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases}
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2)); raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__': main()
