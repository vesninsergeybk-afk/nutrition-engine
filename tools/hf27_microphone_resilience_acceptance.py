#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, base64, json, mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf27-microphone-resilience'
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M9Qz0AEYBxVSFUAAN0ABfXgl7QAAAAASUVORK5CYII=')

def mime(path:Path)->str:
    if path.suffix=='.gz': return 'application/gzip'
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

async def install(page):
    requests=[]
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/');requests.append(rel)
        path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT)
        except ValueError:await route.fulfill(status=403,body='forbidden');return
        if path.is_file():await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else:await route.fulfill(status=404,body='missing '+rel)
    await page.route('https://app.test/**',handler)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    return requests

async def open_ration(page):
    await page.wait_for_function("window.__RUNTIME_LOADER_CLOSED__===true",timeout=30000)
    await page.fill('#needs_person_name','Мобильный тест')
    await page.select_option('#needs_sex','female');await page.fill('#needs_h','168');await page.fill('#needs_w','62');await page.fill('#needs_age','35')
    await page.select_option('#needs_state','normal');await page.select_option('#needs_activity','low');await page.select_option('#needs_goal','maintain')
    await page.click('#needs_calc_btn');await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=10000)
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click()
    await page.wait_for_function("document.documentElement.getAttribute('data-navigation-route')==='ration'",timeout=10000)
    await page.locator('[data-ration-entry-method="voice"]').scroll_into_view_if_needed()

async def base_case(browser):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m:errors.append('console error: '+m.text) if m.type=='error' else None)
    requests=await install(page);await open_ration(page)
    return ctx,page,errors,requests

async def setup_media(page,mode='success',policy_false=False):
    body={
      'success':'return Promise.resolve(stream);',
      'denied':"return Promise.reject(new DOMException('denied','NotAllowedError'));",
      'hanging':'return new Promise(function(){});'
    }[mode]
    js="""() => {
      Object.defineProperty(window,'isSecureContext',{configurable:true,value:true});
      window.__hf27Calls=0;window.__hf27Constraints=null;
      window.__NUTRITION_MIC_SOFT_TIMEOUT_MS__=250;
      window.__NUTRITION_MIC_HARD_TIMEOUT_MS__=1500;
      var track={stop:function(){window.__hf27Stops=(window.__hf27Stops||0)+1;},onended:null};
      var stream={getTracks:function(){return [track];},getAudioTracks:function(){return [track];}};
      var devices=navigator.mediaDevices||{};Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:devices});
      Object.defineProperty(devices,'getUserMedia',{configurable:true,value:function(c){window.__hf27Calls++;window.__hf27Constraints=c;__BODY__}});
      function FakeRecorder(s,o){this.stream=s;this.state='inactive';this.mimeType='audio/webm';this.ondataavailable=null;this.onstop=null;this.onerror=null;}
      FakeRecorder.isTypeSupported=function(){return true;};
      FakeRecorder.prototype.start=function(){this.state='recording';};
      FakeRecorder.prototype.stop=function(){this.state='inactive';if(this.onstop)this.onstop();};
      Object.defineProperty(window,'MediaRecorder',{configurable:true,value:FakeRecorder});
      __POLICY__
    }""".replace('__BODY__',body).replace('__POLICY__',"Object.defineProperty(document,'permissionsPolicy',{configurable:true,value:{allowsFeature:function(){return false;}}});" if policy_false else '')
    await page.evaluate(js)


async def photo_one_click(browser):
    ctx,page,errors,requests=await base_case(browser)
    before=await page.evaluate("() => ({media:!!window.NutritionGeminiRationImport,bridge:!!window.NutritionMediaEntryBridge})")
    fixture=Path('/tmp/hf27-media-test.png');fixture.write_bytes(PNG)
    async with page.expect_file_chooser(timeout=5000) as info:
        await page.locator('[data-ration-entry-method="photo"]').click()
    chooser=await info.value;await chooser.set_files(str(fixture))
    await page.wait_for_function("window.NutritionGeminiRationImport&&window.NutritionGeminiRationImport.getMedia().length===1&&window.NutritionGeminiRationImport.getMedia()[0].preparationState==='ready'",timeout=20000)
    state=await page.evaluate("""() => ({media:window.NutritionGeminiRationImport.getMedia().map(x=>({kind:x.kind,source:x.source,state:x.preparationState,size:x.preparedSize||x.file.size})),topHidden:document.getElementById('workspaceMediaEntryStatus').hidden,topText:document.getElementById('workspaceMediaEntryStatusText').textContent,lazyScripts:document.querySelectorAll('script[data-gemini-media-lazy-module]').length})""")
    passed=before['bridge'] and not before['media'] and state['lazyScripts']==1 and state['media'][0]['kind']=='image' and state['media'][0]['state']=='ready' and not state['topHidden'] and 'Фотография подготовлена' in state['topText'] and not errors
    result={'case':'photo-one-click-prepared-visible','before':before,'state':state,'errors':errors,'mediaRequests':sum('62-gemini-ration-import-v5.js' in x for x in requests),'passed':passed}
    await ctx.close();return result

async def success_visible(browser,policy_false=False):
    ctx,page,errors,requests=await base_case(browser);await setup_media(page,'success',policy_false)
    await page.locator('[data-ration-entry-method="voice"]').click()
    await page.wait_for_function('window.__hf27Calls===1',timeout=5000)
    await page.wait_for_function("window.NutritionGeminiRationImport&&window.NutritionGeminiRationImport.getRecorderDiagnostics().active===true",timeout=20000)
    state=await page.evaluate("""() => ({
      calls:window.__hf27Calls,constraints:window.__hf27Constraints,
      topHidden:document.getElementById('workspaceMediaEntryStatus').hidden,
      topText:document.getElementById('workspaceMediaEntryStatusText').textContent,
      fallbackHidden:document.getElementById('workspaceNativeVoiceFallback').hidden,
      pending:window.NutritionMediaEntryBridge.isVoicePending(),
      active:window.NutritionGeminiRationImport.getRecorderDiagnostics().active,
      release:window.__APP_BOOTSTRAP_META__.release
    })""")
    passed=(state['calls']==1 and state['constraints']=={'audio':True} and not state['topHidden'] and 'Микрофон включён' in state['topText'] and state['fallbackHidden'] and not state['pending'] and state['active'] and state['release']==VERSION and not errors)
    result={'case':'feature-policy-false-still-records' if policy_false else 'voice-success-visible','state':state,'errors':errors,'mediaRequests':sum('62-gemini-ration-import-v5.js' in x for x in requests),'passed':passed}
    await ctx.close();return result

async def denied_visible(browser):
    ctx,page,errors,requests=await base_case(browser);await setup_media(page,'denied')
    await page.locator('[data-ration-entry-method="voice"]').click()
    await page.wait_for_function("document.getElementById('workspaceMediaEntryStatusText').textContent.indexOf('Доступ к микрофону не разрешён')>=0",timeout=10000)
    state=await page.evaluate("""() => ({calls:window.__hf27Calls,topHidden:document.getElementById('workspaceMediaEntryStatus').hidden,topText:document.getElementById('workspaceMediaEntryStatusText').textContent,fallbackHidden:document.getElementById('workspaceNativeVoiceFallback').hidden,pending:window.NutritionMediaEntryBridge.isVoicePending()})""")
    passed=state['calls']==1 and not state['topHidden'] and 'Доступ к микрофону не разрешён' in state['topText'] and not state['fallbackHidden'] and not state['pending'] and not errors
    result={'case':'voice-denied-visible-in-entry-card','state':state,'errors':errors,'passed':passed}
    await ctx.close();return result

async def hanging_watchdog(browser):
    ctx,page,errors,requests=await base_case(browser);await setup_media(page,'hanging')
    await page.locator('[data-ration-entry-method="voice"]').click()
    await page.wait_for_function("document.getElementById('workspaceMediaEntryStatusText').textContent.indexOf('Запрашиваем доступ')>=0",timeout=2000)
    immediate=await page.evaluate("() => ({hidden:document.getElementById('workspaceMediaEntryStatus').hidden,text:document.getElementById('workspaceMediaEntryStatusText').textContent,pending:window.NutritionMediaEntryBridge.isVoicePending(),calls:window.__hf27Calls})")
    await page.wait_for_function("document.getElementById('workspaceMediaEntryStatusText').textContent.indexOf('всё ещё ожидает')>=0",timeout=3000)
    soft=await page.evaluate("() => ({text:document.getElementById('workspaceMediaEntryStatusText').textContent,fallbackHidden:document.getElementById('workspaceNativeVoiceFallback').hidden,pending:window.NutritionMediaEntryBridge.isVoicePending()})")
    await page.wait_for_function("document.getElementById('workspaceMediaEntryStatusText').textContent.indexOf('не ответил')>=0",timeout=4000)
    hard=await page.evaluate("() => ({text:document.getElementById('workspaceMediaEntryStatusText').textContent,fallbackHidden:document.getElementById('workspaceNativeVoiceFallback').hidden,pending:window.NutritionMediaEntryBridge.isVoicePending(),calls:window.__hf27Calls})")
    await page.locator('[data-ration-entry-method="voice"]').click();await page.wait_for_function('window.__hf27Calls===2',timeout=2000)
    retried=await page.evaluate("() => ({calls:window.__hf27Calls,pending:window.NutritionMediaEntryBridge.isVoicePending(),text:document.getElementById('workspaceMediaEntryStatusText').textContent})")
    passed=(not immediate['hidden'] and immediate['pending'] and immediate['calls']==1 and 'Запрашиваем доступ' in immediate['text'] and not soft['fallbackHidden'] and soft['pending'] and 'всё ещё ожидает' in soft['text'] and not hard['fallbackHidden'] and not hard['pending'] and 'не ответил' in hard['text'] and retried['calls']==2 and retried['pending'] and not errors)
    result={'case':'hanging-permission-visible-and-retryable','immediate':immediate,'soft':soft,'hard':hard,'retried':retried,'errors':errors,'passed':passed}
    await ctx.close();return result

async def repeated_click_visible(browser):
    ctx,page,errors,_=await base_case(browser);await setup_media(page,'hanging')
    button=page.locator('[data-ration-entry-method="voice"]');await button.click();await page.wait_for_function('window.__hf27Calls===1',timeout=2000);await button.click()
    state=await page.evaluate("() => ({calls:window.__hf27Calls,text:document.getElementById('workspaceMediaEntryStatusText').textContent,fallbackHidden:document.getElementById('workspaceNativeVoiceFallback').hidden,pending:window.NutritionMediaEntryBridge.isVoicePending()})")
    passed=state['calls']==1 and 'Ожидаем ответ браузера' in state['text'] and not state['fallbackHidden'] and state['pending'] and not errors
    result={'case':'repeated-click-is-not-silent','state':state,'errors':errors,'passed':passed}
    await ctx.close();return result

async def native_fallback(browser):
    ctx,page,errors,_=await base_case(browser)
    await page.evaluate("""() => {Object.defineProperty(window,'isSecureContext',{configurable:true,value:false});try{Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:undefined});}catch(_){}}""")
    async with page.expect_file_chooser(timeout=5000) as info:
        await page.locator('[data-ration-entry-method="voice"]').click()
    chooser=await info.value
    state=await page.evaluate("() => ({text:document.getElementById('workspaceMediaEntryStatusText').textContent,accept:document.getElementById('workspaceNativeVoiceCaptureInput').accept,capture:document.getElementById('workspaceNativeVoiceCaptureInput').getAttribute('capture'),pending:window.NutritionMediaEntryBridge.isVoicePending()})")
    passed=bool(chooser) and state['accept']=='audio/*' and state['capture']=='microphone' and 'системный диктофон' in state['text'] and not state['pending'] and not errors
    result={'case':'insecure-context-opens-native-recorder','state':state,'errors':errors,'passed':passed}
    await ctx.close();return result

async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=[await success_visible(browser),await success_visible(browser,True),await denied_visible(browser),await hanging_watchdog(browser),await repeated_click_visible(browser),await native_fallback(browser)]
        await browser.close();return cases

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out');a=ap.parse_args();ROOT=Path(a.app_root).resolve()
    cases=asyncio.run(run(a.chromium));result={'ok':all(c['passed'] for c in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases}
    if a.json_out:
        p=Path(a.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
