#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, base64, json, mimetypes, time
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf27-microphone-resilience'
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M9Qz0AEYBxVSFUAAN0ABfXgl7QAAAAASUVORK5CYII=')

def mime(path:Path)->str:
    if path.suffix=='.gz':return 'application/gzip'
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

async def install(page, delays=None, failures=None):
    delays=delays or {};failures=failures or set();requests=[]
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/');requests.append(rel)
        for marker,delay in delays.items():
            if marker in rel: await asyncio.sleep(delay)
        if any(marker in rel for marker in failures):await route.fulfill(status=404,body='forced missing '+rel);return
        path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT)
        except ValueError:await route.fulfill(status=403,body='forbidden');return
        if path.is_file():await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else:await route.fulfill(status=404,body='missing '+rel)
    await page.route('https://app.test/**',handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    started=time.perf_counter();await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    return requests,started

async def open_ration(page):
    await page.wait_for_function("window.__RUNTIME_LOADER_CLOSED__===true",timeout=20000)
    await page.fill('#needs_person_name','Тест')
    await page.select_option('#needs_sex','male');await page.fill('#needs_h','175');await page.fill('#needs_w','74');await page.fill('#needs_age','45')
    await page.select_option('#needs_state','normal');await page.select_option('#needs_activity','low');await page.select_option('#needs_goal','maintain')
    await page.click('#needs_calc_btn');await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=10000)
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click()
    await page.wait_for_function("document.documentElement.getAttribute('data-navigation-route')==='ration'",timeout=10000)

async def startup_case(browser,viewport,slow=False,failure_kind=None):
    ctx=await browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},bypass_csp=True)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m:errors.append('console error: '+m.text) if m.type=='error' else None)
    delays={'products.v5.3.210-p1.3.compact.json.gz':2.2,'deferred-runtime-v5.3.210-rc2-hf24.js.gz':2.2} if slow else {}
    failure_markers={'product-compressed':'products.v5.3.210-p1.3.compact.json.gz','runtime-compressed':'deferred-runtime-v5.3.210-rc2-hf24.js.gz','critical-bundle':'critical-shell-v5.3.210-rc2-hf27.js'}
    failures={failure_markers[failure_kind]} if failure_kind else set()
    requests,started=await install(page,delays,failures)
    await page.wait_for_function("window.__APP_SHELL_READY_STATE__&&window.__APP_SHELL_READY_STATE__.status==='ready'",timeout=30000)
    shell_s=time.perf_counter()-started
    shell=await page.evaluate("() => ({bridge:!!window.NutritionMediaEntryBridge,media:!!window.NutritionGeminiRationImport,bg:!!window.__APP_BACKGROUND_READY__,critical:window.__NUTRITION_RUNTIME_MANIFEST__.criticalShellSources.modern})")
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    full_s=time.perf_counter()-started
    state=await page.evaluate("() => ({release:window.__APP_BOOTSTRAP_META__.release,products:window.__PRODUCTS_ARRAY__&&window.__PRODUCTS_ARRAY__.length,compressed:!!(window.__PRODUCTS_META__&&window.__PRODUCTS_META__.compressed_database),dataUrl:window.__PRODUCTS_META__&&window.__PRODUCTS_META__.data_url,runtimeCompressed:!!window.__HF24_DEFERRED_INLINE_EXECUTED__,media:!!window.NutritionGeminiRationImport})")
    unexpected_errors=[e for e in errors if not (failure_kind and ('404' in e or 'Failed to load resource' in e))]
    await page.wait_for_function("window.__RUNTIME_LOADER_CLOSED__===true",timeout=20000)
    loader=await page.evaluate("() => ({visible:window.__APP_BOOTSTRAP_META__.loader_visible_ms,checks:window.__HF27_READINESS_CHECKS__})")
    passed=shell['bridge'] and not shell['media'] and not shell['bg'] and state['release']==VERSION and state['products']==1105 and not state['media'] and loader['visible']>=4150 and all(x.get('ok') for x in loader['checks']) and not unexpected_errors
    if failure_kind=='product-compressed':passed=passed and not state['compressed'] and str(state['dataUrl']).startswith('bundle-script:') and state['runtimeCompressed']
    elif failure_kind=='runtime-compressed':passed=passed and state['compressed'] and not state['runtimeCompressed']
    else:passed=passed and state['compressed'] and state['runtimeCompressed']
    result={'case':('startup-slow' if slow else 'startup-normal')+(('-'+failure_kind+'-fallback') if failure_kind else ''),'viewport':viewport,'shell_s':round(shell_s,3),'full_s':round(full_s,3),'shell':shell,'state':state,'loader':loader,'requests':len(requests),'errors':errors,'unexpected_errors':unexpected_errors,'passed':passed}
    await ctx.close();return result

async def photo_case(browser):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    requests,_=await install(page)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    await open_ration(page)
    before=await page.evaluate("() => ({media:!!window.NutritionGeminiRationImport,bridge:!!window.NutritionMediaEntryBridge})")
    fixture=Path('/tmp/hf24-media-test.png');fixture.write_bytes(PNG)
    async with page.expect_file_chooser(timeout=5000) as info:await page.locator('[data-ration-entry-method="photo"]').click()
    chooser=await info.value;await chooser.set_files(str(fixture))
    await page.wait_for_function("window.NutritionGeminiRationImport&&window.NutritionGeminiRationImport.getMedia().length===1&&window.NutritionGeminiRationImport.getMedia()[0].preparationState==='ready'",timeout=20000)
    state=await page.evaluate("() => ({media:window.NutritionGeminiRationImport.getMedia().map(x=>({kind:x.kind,source:x.source,state:x.preparationState,size:x.preparedSize||x.file.size})),lazyScripts:document.querySelectorAll('script[data-gemini-media-lazy-module]').length,status:document.getElementById('geminiRationStatus').textContent})")
    passed=before['bridge'] and not before['media'] and state['lazyScripts']==1 and state['media'][0]['kind']=='image' and state['media'][0]['state']=='ready' and not errors
    result={'case':'photo-lazy-one-click','before':before,'state':state,'media_module_requests':sum('62-gemini-ration-import-v5.js' in x for x in requests),'errors':errors,'passed':passed}
    await ctx.close();return result

async def voice_case(browser,deny=False):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    requests,_=await install(page)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    await open_ration(page)
    gum_body = "return Promise.reject(new DOMException('denied','NotAllowedError'));" if deny else "return Promise.resolve(stream);"
    setup_js = """() => {
      Object.defineProperty(window,'isSecureContext',{configurable:true,value:true});
      window.__hf24Calls=0;window.__hf24Constraints=null;
      var track={stop:function(){},onended:null};
      var stream={getTracks:function(){return [track];},getAudioTracks:function(){return [track];}};
      var devices=navigator.mediaDevices||{};Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:devices});
      Object.defineProperty(devices,'getUserMedia',{configurable:true,value:function(c){window.__hf24Calls++;window.__hf24Constraints=c;__GUM_BODY__}});
      function FakeRecorder(s,o){this.stream=s;this.state='inactive';this.mimeType='audio/webm';this.ondataavailable=null;this.onstop=null;this.onerror=null;}
      FakeRecorder.isTypeSupported=function(){return true;};FakeRecorder.prototype.start=function(){this.state='recording';};FakeRecorder.prototype.stop=function(){this.state='inactive';if(this.onstop)this.onstop();};
      Object.defineProperty(window,'MediaRecorder',{configurable:true,value:FakeRecorder});
    }""".replace('__GUM_BODY__', gum_body)
    await page.evaluate(setup_js)
    await page.locator('[data-ration-entry-method="voice"]').click()
    await page.wait_for_function('window.__hf24Calls===1',timeout=5000)
    if deny:
        await page.wait_for_function("document.getElementById('geminiRationStatus').textContent.indexOf('Доступ к микрофону не разрешён')>=0",timeout=10000)
    else:
        await page.wait_for_function("window.NutritionGeminiRationImport&&window.NutritionGeminiRationImport.getRecorderDiagnostics().active===true",timeout=20000)
    state=await page.evaluate("() => ({calls:window.__hf24Calls,constraints:window.__hf24Constraints,status:document.getElementById('geminiRationStatus').textContent,panelHidden:document.getElementById('geminiRationRecorderPanel').hidden,diag:window.NutritionGeminiRationImport?window.NutritionGeminiRationImport.getRecorderDiagnostics():null,lazyScripts:document.querySelectorAll('script[data-gemini-media-lazy-module]').length})")
    simple=state['constraints']=={'audio':True}
    passed=state['calls']==1 and simple and state['lazyScripts']==1 and not errors
    if deny:passed=passed and state['diag'] is not None and not state['diag']['active'] and 'Доступ к микрофону не разрешён' in state['status']
    else:passed=passed and state['diag']['active'] and state['diag']['mode']=='media' and not state['panelHidden'] and 'Микрофон включён' in state['status']
    result={'case':'voice-denied-visible' if deny else 'voice-lazy-success','state':state,'media_module_requests':sum('62-gemini-ration-import-v5.js' in x for x in requests),'errors':errors,'passed':passed}
    await ctx.close();return result

async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=[await startup_case(browser,[390,844]),await startup_case(browser,[1440,900],True),await startup_case(browser,[390,844],False,'product-compressed'),await startup_case(browser,[390,844],False,'runtime-compressed'),await startup_case(browser,[390,844],False,'critical-bundle'),await photo_case(browser),await voice_case(browser,False),await voice_case(browser,True)]
        await browser.close();return cases

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out');args=ap.parse_args();ROOT=Path(args.app_root).resolve()
    cases=asyncio.run(run(args.chromium));result={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases}
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
