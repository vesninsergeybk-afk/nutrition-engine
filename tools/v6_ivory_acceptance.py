#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta2-nutrient-group-overview'

def mime(path:Path)->str:
    if path.suffix=='.gz':return 'application/gzip'
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'

async def install(context):
    requests=[]
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/') or 'index.html';requests.append(rel)
        path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT)
        except ValueError:await route.fulfill(status=403,body='forbidden');return
        if path.is_file():await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else:await route.fulfill(status=404,body='missing '+rel)
    await context.route('https://app.test/**',handler)
    return requests

async def open_page(browser,viewport,query='theme=ivory-brass&noautov=1'):
    ctx=await browser.new_context(viewport=viewport,bypass_csp=True)
    requests=await install(ctx);page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m:errors.append('console error: '+m.text) if m.type=='error' else None)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    html=html.replace("window.location.search||''",repr('?'+query),1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    await page.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=45000)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release==='"+VERSION+"'",timeout=15000)
    if 'safe-ui=1' in query:
        await page.evaluate("() => {document.documentElement.setAttribute('data-safe-ui','1');window.NutritionTheme.set('modern',{persist:false});window.NutritionWorkspaceEntryUXHF28&&window.NutritionWorkspaceEntryUXHF28.setLayout('sections',{persist:false});}")
    elif 'theme=ivory-brass' in query:
        await page.evaluate("() => {window.NutritionTheme.set('ivory-brass',{persist:false});window.NutritionWorkspaceEntryUXHF28&&window.NutritionWorkspaceEntryUXHF28.setLayout('canvas',{persist:false});}")
    elif 'theme=retro-2bit' in query:
        await page.evaluate("() => window.NutritionTheme.set('retro-2bit',{persist:false})")
    await page.wait_for_timeout(500)
    return ctx,page,requests,errors

def passed(name,ok,details):return {'case':name,'passed':bool(ok),'details':details}

async def go_ration(page):
    await page.evaluate("() => window.NavigationShellV1&&window.NavigationShellV1.navigate('ration')")
    await page.wait_for_function("document.documentElement.getAttribute('data-navigation-route')==='ration'",timeout=10000)
    await page.wait_for_timeout(250)

async def desktop_canvas(browser,outdir:Path):
    ctx,page,req,errors=await open_page(browser,{'width':1440,'height':900})
    await page.wait_for_selector('#ivoryInsightRail')
    await go_ration(page)
    await page.wait_for_timeout(500)
    state=await page.evaluate("""() => {
      const html=document.documentElement,main=document.getElementById('mainContent'),nav=document.getElementById('navigationShell'),ctx=document.getElementById('navigationShellContext'),rail=document.getElementById('ivoryInsightRail'),hero=document.getElementById('ivoryRationHero');
      const r=x=>x?x.getBoundingClientRect():null,cs=getComputedStyle(main);
      return {theme:html.dataset.theme,layout:html.dataset.workspaceLayout,route:html.dataset.navigationRoute,columns:cs.gridTemplateColumns,nav:r(nav),context:r(ctx),rail:r(rail),heroDisplay:getComputedStyle(hero).display,railDisplay:getComputedStyle(rail).display,themeButtons:[...document.querySelectorAll('[data-theme-value]')].map(x=>({v:x.dataset.themeValue,p:x.getAttribute('aria-pressed')})),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,contract:window.NutritionUIViewModel&&window.NutritionUIViewModel.get().contract,release:window.__APP_BOOTSTRAP_META__.release};
    }""")
    await page.screenshot(path=str(outdir/'ivory-desktop-1440x900.png'),full_page=False)
    rectok=state['nav'] and state['context'] and state['rail'] and state['nav']['right']<=state['context']['left']+2 and state['context']['right']<=state['rail']['left']+2
    ok=state['theme']=='ivory-brass' and state['layout']=='canvas' and state['railDisplay']!='none' and state['heroDisplay']!='none' and state['overflow']<=1 and state['contract']=='NutritionUIViewModel.v1' and rectok and not errors
    await ctx.close();return passed('desktop-ivory-spatial-canvas',ok,{'state':state,'errors':errors,'requests':len(req)})

async def theme_switch(browser):
    ctx,page,req,errors=await open_page(browser,{'width':1366,'height':768})
    before=await page.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,layout:document.documentElement.dataset.workspaceLayout,count:window.State.get().length})")
    await page.evaluate("() => document.querySelector('[data-theme-value=modern]').click()");await page.wait_for_timeout(150)
    modern=await page.evaluate("() => ({theme:document.documentElement.dataset.theme,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,pressed:document.querySelector('[data-theme-value=modern]').getAttribute('aria-pressed')})")
    await page.evaluate("() => document.querySelector('[data-theme-value=\"retro-2bit\"]').click()");await page.wait_for_timeout(150)
    retro=await page.evaluate("() => ({theme:document.documentElement.dataset.theme,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,pressed:document.querySelector('[data-theme-value=\"retro-2bit\"]').getAttribute('aria-pressed')})")
    await page.evaluate("() => document.querySelector('[data-theme-value=\"ivory-brass\"]').click()");await page.wait_for_timeout(150)
    after=await page.evaluate("() => ({theme:document.documentElement.dataset.theme,route:document.documentElement.dataset.navigationRoute,layout:document.documentElement.dataset.workspaceLayout,count:window.State.get().length,pressed:document.querySelector('[data-theme-value=\"ivory-brass\"]').getAttribute('aria-pressed')})")
    ok=modern=={'theme':'modern','rail':'none','pressed':'true'} and retro=={'theme':'retro-2bit','rail':'none','pressed':'true'} and after['theme']=='ivory-brass' and after['pressed']=='true' and after['route']==before['route'] and after['count']==before['count'] and not errors
    await ctx.close();return passed('three-themes-preserve-state',ok,{'before':before,'modern':modern,'retro':retro,'after':after,'errors':errors})

async def layout_switch(browser):
    ctx,page,_,errors=await open_page(browser,{'width':1440,'height':900})
    await page.click('[data-workspace-view-mode="sections"]');await page.wait_for_timeout(150)
    sections=await page.evaluate("() => ({layout:document.documentElement.dataset.workspaceLayout,pressed:document.querySelector('[data-workspace-view-mode=sections]').getAttribute('aria-pressed'),rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display})")
    await page.click('[data-workspace-view-mode="canvas"]');await page.wait_for_timeout(150)
    canvas=await page.evaluate("() => ({layout:document.documentElement.dataset.workspaceLayout,pressed:document.querySelector('[data-workspace-view-mode=canvas]').getAttribute('aria-pressed'),rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display})")
    ok=sections['layout']=='sections' and sections['pressed']=='true' and sections['rail']=='none' and canvas['layout']=='canvas' and canvas['pressed']=='true' and canvas['rail']!='none' and not errors
    await ctx.close();return passed('sections-canvas-independent-switch',ok,{'sections':sections,'canvas':canvas,'errors':errors})

async def mobile(browser,outdir:Path):
    ctx,page,_,errors=await open_page(browser,{'width':390,'height':844})
    await page.wait_for_selector('#ivoryMobileSummary')
    state=await page.evaluate("""() => {const h=document.documentElement,b=document.querySelector('[data-workspace-view-mode=canvas]');return {theme:h.dataset.theme,layout:h.dataset.workspaceLayout,preference:h.dataset.workspaceLayoutPreference,canvasDisabled:b.disabled,canvasAria:b.getAttribute('aria-disabled'),rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,hero:getComputedStyle(document.getElementById('ivoryRationHero')).display,mobile:getComputedStyle(document.getElementById('ivoryMobileSummary')).display,overflow:h.scrollWidth-h.clientWidth,bottomNav:getComputedStyle(document.getElementById('navigationShell')).position};}""")
    await page.screenshot(path=str(outdir/'ivory-mobile-390x844.png'),full_page=False)
    ok=state['theme']=='ivory-brass' and state['layout']=='sections' and state['canvasDisabled'] and state['canvasAria']=='true' and state['rail']=='none' and state['hero']=='none' and state['mobile']!='none' and state['overflow']<=1 and not errors
    await ctx.close();return passed('mobile-sequential-architecture',ok,{'state':state,'errors':errors})

async def add_item_updates(browser):
    ctx,page,_,errors=await open_page(browser,{'width':1440,'height':900})
    await go_ration(page)
    result=await page.evaluate("""() => {const source=window.DB&&(window.DB.items||window.DB.list)||[];const first=source.find(x=>x&&x.key);if(!first)return {added:false};const row=window.State.add(first.key,100);return {added:!!row,key:first.key};}""")
    await page.wait_for_function("document.documentElement.getAttribute('data-ivory-ration')==='filled'",timeout=10000)
    state=await page.evaluate("() => ({count:window.State.get().length,mode:document.documentElement.dataset.ivoryRation,model:window.NutritionUIViewModel.get().ration.count,mobile:document.getElementById('ivoryMobileRation').textContent,heroHeight:document.getElementById('ivoryRationHero').getBoundingClientRect().height})")
    ok=result['added'] and state['count']>=1 and state['model']>=1 and state['mode']=='filled' and 'Рацион пока пуст' not in state['mobile'] and state['heroHeight']<260 and not errors
    await ctx.close();return passed('canonical-state-updates-dashboard',ok,{'add':result,'state':state,'errors':errors})

async def safe_ui(browser):
    ctx,page,_,errors=await open_page(browser,{'width':1440,'height':900},'theme=ivory-brass&safe-ui=1&noautov=1')
    state=await page.evaluate("() => ({theme:document.documentElement.dataset.theme,safe:document.documentElement.dataset.safeUi,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display})")
    ok=state['theme']=='modern' and state['safe']=='1' and state['rail']=='none' and not errors
    await ctx.close();return passed('safe-ui-forces-modern',ok,{'state':state,'errors':errors})

async def run(chromium,outdir):
    # Run isolated browser contexts concurrently. Sequentially creating several
    # heavy full-runtime contexts can exhaust Chromium's shared-process quota on
    # constrained CI hosts, while concurrent isolated contexts remain deterministic.
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            return await asyncio.gather(
                desktop_canvas(browser,outdir),theme_switch(browser),layout_switch(browser),
                mobile(browser,outdir),add_item_updates(browser),safe_ui(browser)
            )
        finally:await browser.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6_ivory_acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots');a=ap.parse_args();ROOT=Path(a.app_root).resolve();outdir=ROOT/a.screenshots;outdir.mkdir(parents=True,exist_ok=True)
    cases=asyncio.run(run(a.chromium,outdir));result={'ok':all(c['passed'] for c in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases}
    out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
