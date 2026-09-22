#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, mimetypes, time
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf22-fast-start'

def mime(path:Path)->str: return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

async def install_app(page, fail_suffixes=(), delays=None):
    requests=[]; transferred=0; delays=delays or {}
    async def handler(route, request):
        nonlocal transferred
        rel=unquote(urlparse(request.url).path).lstrip('/')
        requests.append(rel)
        for suffix in fail_suffixes:
            if rel.endswith(suffix):
                await route.fulfill(status=404,body='simulated missing '+rel); return
        for token,delay in delays.items():
            if token in rel: await asyncio.sleep(delay)
        path=(ROOT/rel).resolve()
        try: path.relative_to(ROOT)
        except ValueError:
            await route.fulfill(status=403,body='forbidden'); return
        if path.is_file():
            transferred+=path.stat().st_size
            await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else: await route.fulfill(status=404,body='not found '+rel)
    await page.route('https://app.test/**',handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    started=time.perf_counter()
    await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    await page.wait_for_function("window.__APP_SHELL_READY_STATE__&&window.__APP_SHELL_READY_STATE__.status==='ready'",timeout=30000)
    return started,round(time.perf_counter()-started,3),requests,lambda:transferred

async def new_page(browser, viewport):
    ctx=await browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},bypass_csp=True)
    page=await ctx.new_page(); errors=[]
    page.on('pageerror',lambda e: errors.append('pageerror: '+str(e)))
    page.on('console',lambda m: errors.append('console error: '+m.text) if m.type=='error' else None)
    return ctx,page,errors

async def normal_case(browser, viewport):
    ctx,page,errors=await new_page(browser,viewport)
    started,shell,requests,bytes_getter=await install_app(page)
    shell_state=await page.evaluate("""() => ({
      overlayVisible:!!(document.getElementById('runtimeBootStatusOverlay')&&getComputedStyle(document.getElementById('runtimeBootStatusOverlay')).display!=='none'&&getComputedStyle(document.getElementById('runtimeBootStatusOverlay')).visibility!=='hidden'&&Number(getComputedStyle(document.getElementById('runtimeBootStatusOverlay')).opacity||1)>0),
      route:window.NavigationShellV1&&window.NavigationShellV1.getState().route,
      phase:document.documentElement.getAttribute('data-runtime-phase'),full:!!window.__APP_BACKGROUND_READY__
    })""")
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    full=round(time.perf_counter()-started,3)
    await page.fill('#needs_person_name','Иван Иванов'); await page.select_option('#needs_sex','male')
    await page.fill('#needs_h','175'); await page.fill('#needs_w','74'); await page.fill('#needs_age','45')
    await page.select_option('#needs_state','normal'); await page.select_option('#needs_activity','low'); await page.select_option('#needs_goal','maintain')
    await page.click('#needs_calc_btn'); await page.wait_for_function("window.__lastNeedsProfileApplied===true&&!!window.__lastNeedsMeta",timeout=20000)
    kcal=await page.input_value('#normInput-kcal')
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click()
    await page.wait_for_function("document.documentElement.getAttribute('data-navigation-route')==='ration'",timeout=10000)
    await page.fill('#globalSearchInput','молоко'); await page.wait_for_timeout(250)
    results=await page.locator('#globalResults .search-result-card').count()
    state=await page.evaluate("""() => ({products:window.DB&&window.DB.items.length,failed:window.__APP_BOOTSTRAP_META__.failed_scripts,
      recovered:window.__APP_BOOTSTRAP_META__.recovered_requests,scriptRequests:window.__APP_BOOTSTRAP_META__.loaded_script_requests,
      phase:document.documentElement.getAttribute('data-runtime-phase'),route:window.NavigationShellV1&&window.NavigationShellV1.getState().route,
      overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth),release:window.__APP_BOOTSTRAP_META__.release})""")
    result={'case':'normal','viewport':viewport,'shell_s':shell,'full_s':full,'network_requests':len(requests),'transferred_bytes':bytes_getter(),'shell_state':shell_state,'kcal':kcal,'search_results':results,'state':state,'errors':errors}
    result['passed']=(shell_state['overlayVisible'] is False and shell_state['route']=='profile' and shell_state['phase']=='shell-ready' and shell_state['full'] is False and state['products']==1105 and state['failed']==[] and len(state['scriptRequests'])==2 and state['phase']=='ready' and state['route']=='ration' and state['overflow']==0 and state['release']==VERSION and kcal=='2288' and results>0 and len(requests)<=18 and not errors)
    await ctx.close(); return result

async def delayed_case(browser):
    ctx,page,errors=await new_page(browser,(390,844))
    started,shell,requests,bytes_getter=await install_app(page,delays={'products.v5.3.210-p1.3.bundle.js':2.5,'deferred-runtime-v5.3.210-rc2-hf22.js':2.5})
    await page.fill('#needs_person_name','Данные введены до готовности')
    await page.evaluate("document.querySelector('[data-navshell-route=\"ration\"]').click()")
    await page.wait_for_timeout(350)
    route_while=await page.evaluate("window.NavigationShellV1&&window.NavigationShellV1.getState().route")
    background_before=await page.evaluate("!!window.__APP_BACKGROUND_READY__")
    overlay_visible=await page.evaluate("""() => {var x=document.getElementById('runtimeBootStatusOverlay');return !!(x&&getComputedStyle(x).display!=='none'&&getComputedStyle(x).visibility!=='hidden'&&Number(getComputedStyle(x).opacity||1)>0)}""")
    await page.wait_for_function("window.__APP_BACKGROUND_READY__===true",timeout=30000)
    full=round(time.perf_counter()-started,3); preserved=await page.input_value('#needs_person_name')
    await page.evaluate("window.NavigationShellV1.navigate('ration')"); await page.wait_for_timeout(100)
    route_after=await page.evaluate("window.NavigationShellV1&&window.NavigationShellV1.getState().route")
    result={'case':'delayed-background','shell_s':shell,'full_s':full,'network_requests':len(requests),'transferred_bytes':bytes_getter(),'overlay_visible_after_shell':overlay_visible,'background_ready_before':background_before,'route_while_loading':route_while,'preserved_input':preserved,'route_after_ready':route_after,'errors':errors}
    result['passed']=(shell<1.5 and full>=2.5 and overlay_visible is False and background_before is False and route_while=='profile' and preserved=='Данные введены до готовности' and route_after=='ration' and not errors)
    await ctx.close(); return result

async def fallback_case(browser,kind):
    suffixes={
      'critical':'critical-shell-v5.3.210-rc2-hf22.js',
      'product':'products.v5.3.210-p1.3.bundle.js',
      'runtime':'deferred-runtime-v5.3.210-rc2-hf22.js'
    }
    ctx,page,errors=await new_page(browser,(390,844))
    started,shell,requests,bytes_getter=await install_app(page,fail_suffixes=(suffixes[kind],))
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    full=round(time.perf_counter()-started,3)
    state=await page.evaluate("""() => ({products:window.DB&&window.DB.items.length,failed:window.__APP_BOOTSTRAP_META__.failed_scripts,
      recovered:window.__APP_BOOTSTRAP_META__.recovered_requests,scriptRequests:window.__APP_BOOTSTRAP_META__.loaded_script_requests.length,
      phase:document.documentElement.getAttribute('data-runtime-phase')})""")
    recovered=any(suffixes[kind] in x for x in state['recovered'])
    bounds={'critical':22,'product':32,'runtime':95}
    expected_errors=[x for x in errors if 'Failed to load resource' in x]
    unexpected_errors=[x for x in errors if x not in expected_errors]
    result={'case':'fallback-'+kind,'shell_s':shell,'full_s':full,'network_requests':len(requests),'transferred_bytes':bytes_getter(),'state':state,'expected_network_errors':expected_errors,'unexpected_errors':unexpected_errors}
    result['passed']=(state['products']==1105 and state['failed']==[] and recovered and state['phase']=='ready' and len(requests)<=bounds[kind] and not unexpected_errors)
    await ctx.close(); return result

async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=[await normal_case(browser,(390,844)),await normal_case(browser,(1440,900)),await delayed_case(browser),await fallback_case(browser,'critical'),await fallback_case(browser,'product'),await fallback_case(browser,'runtime')]
        await browser.close()
    return cases

def main():
    global ROOT
    ap=argparse.ArgumentParser(); ap.add_argument('--chromium',default='/usr/bin/chromium'); ap.add_argument('--app-root',default=str(ROOT)); ap.add_argument('--json-out'); args=ap.parse_args()
    ROOT=Path(args.app_root).resolve()
    cases=asyncio.run(run(args.chromium))
    result={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'cases':cases,'assertions':len(cases)}
    if args.json_out:
        p=Path(args.json_out); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['ok'] else 1)

if __name__=='__main__': main()
