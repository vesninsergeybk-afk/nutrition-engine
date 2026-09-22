#!/usr/bin/env python3
import asyncio, json, mimetypes, time
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/hf19-boot-recovery-browser.json'

async def mount(page):
    async def handler(route, request):
        path=unquote(urlparse(request.url).path).lstrip('/')
        fp=(ROOT/path).resolve()
        try: fp.relative_to(ROOT.resolve())
        except Exception:
            await route.fulfill(status=403, body='forbidden'); return
        if fp.is_file():
            await route.fulfill(status=200, path=str(fp), content_type=mimetypes.guess_type(fp.name)[0] or 'application/octet-stream')
        else:
            await route.fulfill(status=404, body='not found '+path, content_type='text/plain')
    await page.route('https://app.test/**', handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    await page.set_content(html, wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__ && ['ready','fatal'].includes(window.__APP_BOOTSTRAP_META__.status)", timeout=120000)

async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for width,height in [(390,844),(1440,900)]:
            page=await browser.new_page(viewport={'width':width,'height':height})
            errors=[]
            page.on('console',lambda msg: errors.append('console:'+msg.type+':'+msg.text) if msg.type=='error' else None)
            page.on('pageerror',lambda exc: errors.append('pageerror:'+str(exc)))
            started=time.time(); await mount(page); await page.wait_for_timeout(2800)
            state=await page.evaluate("""() => ({
              meta: window.__APP_BOOTSTRAP_META__,
              manifest: window.__NUTRITION_RUNTIME_MANIFEST__ && window.__NUTRITION_RUNTIME_MANIFEST__.version,
              selector: window.__RUNTIME_SELECTOR_RELEASE__,
              expected: window.__EXPECTED_RUNTIME_RELEASE__,
              notice: !!document.getElementById('browserCompatibilityNotice'),
              loader: !!document.getElementById('runtimeBootStatusOverlay'),
              nav: !!document.getElementById('navigationShell'),
              search: !!document.getElementById('globalSearch') || !!document.getElementById('globalSearchInput'),
              productReady: !!window.__PRODUCTS_READY__,
              loadedScripts: window.__APP_BOOTSTRAP_META__ && window.__APP_BOOTSTRAP_META__.loaded_scripts ? window.__APP_BOOTSTRAP_META__.loaded_scripts.length : 0,
              failedScripts: window.__APP_BOOTSTRAP_META__ && window.__APP_BOOTSTRAP_META__.failed_scripts ? window.__APP_BOOTSTRAP_META__.failed_scripts.length : -1,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth
            })""")
            state.update({'width':width,'height':height,'elapsed_s':round(time.time()-started,3),'errors':errors})
            state['passed']=(state['meta']['status']=='ready' and state['manifest']=='v5.3.210-rc2-hf19' and state['selector']=='v5.3.210-rc2-hf19' and state['expected']=='v5.3.210-rc2-hf19' and not state['notice'] and not state['loader'] and state['nav'] and state['search'] and state['productReady'] and state['loadedScripts']>=75 and state['failedScripts']==0 and state['scrollWidth']<=state['clientWidth']+1 and not errors)
            results.append(state)
            await page.close()
        await browser.close()
    report={'release':'v5.3.210-rc2-hf19','ok':all(r['passed'] for r in results),'results':results}
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(0 if report['ok'] else 1)

if __name__=='__main__': asyncio.run(main())
