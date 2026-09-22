#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, base64, json, mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf23-media-entry-fix'
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M9Qz0AEYBxVSFUAAN0ABfXgl7QAAAAASUVORK5CYII=')

def mime(path:Path)->str:return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

async def install(page):
    requests=[]
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/')
        requests.append(rel)
        path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT)
        except ValueError: await route.fulfill(status=403,body='forbidden');return
        if path.is_file():await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else:await route.fulfill(status=404,body='missing '+rel)
    await page.route('https://app.test/**',handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    return requests

async def open_ration(page):
    await page.fill('#needs_person_name','Медиатест')
    await page.select_option('#needs_sex','male');await page.fill('#needs_h','175');await page.fill('#needs_w','74');await page.fill('#needs_age','45')
    await page.select_option('#needs_state','normal');await page.select_option('#needs_activity','low');await page.select_option('#needs_goal','maintain')
    await page.click('#needs_calc_btn');await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=10000)
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click()
    await page.wait_for_function("document.documentElement.getAttribute('data-navigation-route')==='ration'",timeout=10000)

async def normal_case(browser):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m:errors.append('console error: '+m.text) if m.type=='error' else None)
    requests=await install(page)
    await page.wait_for_function("window.__APP_SHELL_READY_STATE__&&window.__APP_SHELL_READY_STATE__.status==='ready'",timeout=30000)
    shell_state=await page.evaluate("() => ({media:!!window.NutritionGeminiRationImport,bound:document.getElementById('geminiRationChoosePhotos').dataset.bound,background:!!window.__APP_BACKGROUND_READY__})")
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    await open_ration(page)
    photo=page.locator('[data-ration-entry-method="photo"]');await photo.scroll_into_view_if_needed()
    async with page.expect_file_chooser(timeout=5000) as info:await photo.click()
    chooser=await info.value
    fixture=Path('/tmp/hf23-media-test.png');fixture.write_bytes(PNG)
    await chooser.set_files(str(fixture))
    await page.wait_for_function("window.NutritionGeminiRationImport.getMedia().length===1 && window.NutritionGeminiRationImport.getMedia()[0].preparationState==='ready'",timeout=15000)
    media=await page.evaluate("() => window.NutritionGeminiRationImport.getMedia().map(x=>({kind:x.kind,source:x.source,state:x.preparationState,size:x.preparedSize||x.file.size}))")
    state=await page.evaluate("() => ({release:window.__APP_BOOTSTRAP_META__.release,critical:window.__NUTRITION_RUNTIME_MANIFEST__.criticalShellSources.modern,deferred:window.__NUTRITION_RUNTIME_MANIFEST__.deferredRuntimeSources.modern,details:document.getElementById('workspaceRationSecondary').open})")
    result={'case':'photo-one-click','shell_state':shell_state,'media':media,'state':state,'requests':len(requests),'errors':errors}
    result['passed']=(shell_state['media'] and shell_state['bound']=='1' and shell_state['background'] is False and media and media[0]['kind']=='image' and media[0]['state']=='ready' and state['details'] and state['release']==VERSION and any('62-gemini-ration-import-v5.js' in x for x in state['critical']) and not any('62-gemini-ration-import-v5.js' in x for x in state['deferred']) and not errors)
    await ctx.close();return result

async def voice_case(browser):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    await install(page)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.status==='ready'",timeout=120000)
    await open_ration(page)
    await page.evaluate("""() => {
      Object.defineProperty(window,'isSecureContext',{configurable:true,value:true});
      window.__hf23GetUserMediaCalls=0;
      var devices=navigator.mediaDevices||{};
      Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:devices});
      Object.defineProperty(devices,'getUserMedia',{configurable:true,value:function(){window.__hf23GetUserMediaCalls++;return Promise.reject(new DOMException('test denial','NotAllowedError'));}});
    }""")
    voice=page.locator('[data-ration-entry-method="voice"]');await voice.scroll_into_view_if_needed();await voice.click()
    await page.wait_for_function('window.__hf23GetUserMediaCalls===1',timeout=5000)
    await page.wait_for_function("document.getElementById('geminiRationStatus').textContent.indexOf('Доступ к микрофону не разрешён')>=0",timeout=5000)
    state=await page.evaluate("() => ({secure:window.isSecureContext,calls:window.__hf23GetUserMediaCalls,status:document.getElementById('geminiRationStatus').textContent,details:document.getElementById('workspaceRationSecondary').open,diag:window.NutritionGeminiRationImport.getRecorderDiagnostics()})")
    result={'case':'voice-one-click-secure-gate','state':state,'errors':errors}
    result['passed']=(state['secure'] and state['calls']==1 and state['details'] and 'Доступ к микрофону не разрешён' in state['status'] and not state['diag']['active'] and not errors)
    await ctx.close();return result

async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=[await normal_case(browser),await voice_case(browser)]
        await browser.close();return cases

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out');args=ap.parse_args();ROOT=Path(args.app_root).resolve()
    cases=asyncio.run(run(args.chromium));result={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases}
    if args.json_out:
        p=Path(args.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
