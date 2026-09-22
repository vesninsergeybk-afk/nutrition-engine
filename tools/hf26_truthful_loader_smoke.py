#!/usr/bin/env python3
from __future__ import annotations
import asyncio,json,mimetypes,time
from pathlib import Path
from urllib.parse import unquote,urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf26-truthful-progress'

def mime(p:Path):
    if p.suffix=='.gz': return 'application/gzip'
    return mimetypes.guess_type(p.name)[0] or 'application/octet-stream'

async def install(page,delays=None,failures=None):
    delays=delays or {}; failures=failures or set(); requests=[]
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/'); requests.append(rel)
        for marker,delay in delays.items():
            if marker in rel: await asyncio.sleep(delay)
        if any(marker in rel for marker in failures):
            await route.fulfill(status=404,body='forced '+rel); return
        p=(ROOT/rel).resolve()
        try:p.relative_to(ROOT)
        except ValueError:await route.fulfill(status=403,body='forbidden');return
        if p.is_file():await route.fulfill(status=200,path=str(p),content_type=mime(p))
        else:await route.fulfill(status=404,body='missing '+rel)
    await page.route('https://app.test/**',handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    started=time.perf_counter(); await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    return started,requests

async def case(browser,name,delays=None,failures=None):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True)
    page=await ctx.new_page(); errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m: errors.append('console error: '+m.text) if m.type=='error' else None)
    started,requests=await install(page,delays,failures)
    samples=[]
    async def sample():
        return await page.evaluate("""() => {const r=document.getElementById('runtimeBootStatus');return {t:performance.now(),stage:r&&r.querySelector('.rbs-stage')&&r.querySelector('.rbs-stage').textContent,primary:r&&r.querySelector('.rbs-primary')&&r.querySelector('.rbs-primary').textContent,hint:r&&r.querySelector('.rbs-hint')&&r.querySelector('.rbs-hint').textContent,percent:r&&r.querySelector('.rbs-percent')&&r.querySelector('.rbs-percent').textContent,closed:!!window.__RUNTIME_LOADER_CLOSED__,shell:window.__APP_SHELL_READY_STATE__&&window.__APP_SHELL_READY_STATE__.timing_ms,ready:window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status};}""")
    for _ in range(30):
        samples.append(await sample())
        if samples[-1]['closed']: break
        await page.wait_for_timeout(250)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    await page.wait_for_function("window.__RUNTIME_LOADER_CLOSED__===true",timeout=20000)
    state=await page.evaluate("""() => ({release:window.__APP_BOOTSTRAP_META__.release,products:window.__PRODUCTS_ARRAY__&&window.__PRODUCTS_ARRAY__.length,checks:window.__HF26_READINESS_CHECKS__,visible:window.__APP_BOOTSTRAP_META__.loader_visible_ms,phase:document.documentElement.getAttribute('data-runtime-phase'),overlay:!!document.getElementById('runtimeBootStatusOverlay')})""")
    perc=[int((x['percent'] or '0').replace('%','')) for x in samples if x['percent']]
    stages=[]
    for x in samples:
        if x['stage'] and (not stages or stages[-1]!=x['stage']):stages.append(x['stage'])
    unexpected_errors=[e for e in errors if not (failures and ('404' in e or 'Failed to load resource' in e))]
    passed=(state['release']==VERSION and state['products']==1105 and all(x.get('ok') for x in state['checks']) and state['visible']>=4150 and perc==sorted(perc) and len(set(perc))>=8 and stages[:4]==['Интерфейс','База продуктов','Расчёты и инструменты','Проверка готовности'] and not unexpected_errors)
    out={'case':name,'passed':passed,'state':state,'stages':stages,'percent_samples':perc,'samples':samples,'requests':len(requests),'errors':errors,'unexpected_errors':unexpected_errors,'wall_ms':round((time.perf_counter()-started)*1000)}
    await ctx.close();return out

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=[
          await case(b,'normal'),
          await case(b,'slow-products',{'products.v5.3.210-p1.3.compact.json.gz':2.0}),
          await case(b,'slow-runtime',{'deferred-runtime-v5.3.210-rc2-hf24.js.gz':2.0}),
          await case(b,'fallback-product',failures={'products.v5.3.210-p1.3.compact.json.gz'}),
          await case(b,'fallback-runtime',failures={'deferred-runtime-v5.3.210-rc2-hf24.js.gz'}),
        ]
        await b.close()
    result={'ok':all(c['passed'] for c in cases),'cases':cases}
    (ROOT/'reports/hf26-truthful-loader-smoke.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':asyncio.run(main())
