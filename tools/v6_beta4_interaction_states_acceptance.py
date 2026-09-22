#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json,mimetypes
from pathlib import Path
from urllib.parse import unquote,urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta4-profile-hierarchy'
INTERACTION_VERSION='v6.0.0-beta3-interaction-coherence'

def mime(path:Path)->str:
    if path.suffix=='.gz':return 'application/gzip'
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
async def install(context):
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/') or 'index.html';path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT)
        except ValueError:await route.fulfill(status=403,body='forbidden');return
        if path.is_file():await route.fulfill(status=200,path=str(path),content_type=mime(path))
        elif rel=='api/gemini.php':await route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'configured':True,'ai_available':False,'csrf_token':'x'}))
        else:await route.fulfill(status=404,body='missing '+rel)
    await context.route('https://app.test/**',handler)
async def open_page(browser,viewport,theme='ivory-brass'):
    ctx=await browser.new_context(viewport=viewport,bypass_csp=True);await install(ctx);page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    page.on('console',lambda m:errors.append('console error: '+m.text) if m.type=='error' else None)
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    html=html.replace("window.location.search||''",repr('?theme='+theme+'&noautov=1'),1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    await page.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=60000)
    await page.wait_for_function("window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release==='"+VERSION+"'",timeout=20000)
    await page.wait_for_function('window.NutritionInteractionStatesV1&&document.documentElement.dataset.interactionSystem==="v1"',timeout=10000)
    await page.evaluate("t=>window.NutritionTheme.set(t,{persist:false})",theme);await page.wait_for_timeout(500)
    return ctx,page,errors
def case(name,passed,details):return {'case':name,'passed':bool(passed),'details':details}

async def core_contract(browser,outdir):
    ctx,p,errors=await open_page(browser,{'width':1440,'height':900})
    state=await p.evaluate('''() => ({release:window.__APP_BOOTSTRAP_META__.release,controller:window.NutritionInteractionStatesV1.version,marker:document.documentElement.dataset.interactionSystem,interactive:document.querySelectorAll('[data-ui-interactive="true"]').length,buttons:document.querySelectorAll('button').length,fields:document.querySelectorAll('input,select,textarea').length,undecorated:[...document.querySelectorAll('button,input,select,textarea,summary')].filter(x=>x.dataset.uiInteractive!=='true').length})''')
    ok=state['release']==VERSION and state['controller']==INTERACTION_VERSION and state['marker']=='v1' and state['interactive']>=state['buttons']+state['fields'] and state['undecorated']==0 and not errors
    await p.screenshot(path=str(outdir/'beta4-interaction-desktop.png'),full_page=False);await ctx.close();return case('global-interaction-contract',ok,{'state':state,'errors':errors})

async def focus_validation(browser):
    ctx,p,errors=await open_page(browser,{'width':1280,'height':800},'modern')
    age=p.locator('#needs_age');await age.focus();focused=await p.evaluate('''() => {const x=document.getElementById('needs_age'),w=x.closest('label,.field,.form-field')||x.parentElement,s=getComputedStyle(x);return {wrap:w.dataset.uiFocusWithin,border:s.borderColor,shadow:s.boxShadow,outline:s.outlineStyle};}''')
    await age.fill('130');await p.locator('#needs_h').focus();await p.wait_for_timeout(100)
    invalid=await p.evaluate('''() => {const x=document.getElementById('needs_age'),w=x.closest('label,.field,.form-field')||x.parentElement,s=getComputedStyle(x);return {touched:x.dataset.uiTouched,invalid:x.dataset.uiInvalid,wrap:w.dataset.uiInvalid,valid:x.checkValidity(),border:s.borderColor,background:s.backgroundColor,outline:s.outlineColor,shadow:s.boxShadow};}''')
    ok=focused['wrap']=='true' and focused['shadow']!='none' and invalid['touched']=='true' and invalid['invalid']=='true' and invalid['wrap']=='true' and not invalid['valid'] and invalid['background'] in ('rgb(255, 240, 238)','rgb(255, 240, 236)') and invalid['shadow']!='none' and not errors
    await ctx.close();return case('field-focus-and-validation',ok,{'focused':focused,'invalid':invalid,'errors':errors})

async def pressed_selected_disabled(browser):
    ctx,p,errors=await open_page(browser,{'width':1366,'height':768})
    theme=p.locator('[data-theme-value="ivory-brass"]:visible').first;await theme.dispatch_event('pointerdown',{'pointerType':'mouse'});await p.wait_for_timeout(60)
    pressed=await theme.evaluate('x=>({pressed:x.dataset.uiPressed,transform:getComputedStyle(x).transform})');await theme.dispatch_event('pointerup',{'pointerType':'mouse'});await p.wait_for_timeout(60)
    selected=await theme.evaluate('x=>({selected:x.dataset.uiSelected,aria:x.getAttribute("aria-pressed"),shadow:getComputedStyle(x).boxShadow,bg:getComputedStyle(x).backgroundColor,weight:getComputedStyle(x).fontWeight})')
    disabled=await p.locator('#profileCalculateContinue').evaluate('x=>({disabled:x.dataset.uiDisabled,opacity:getComputedStyle(x).opacity,cursor:getComputedStyle(x).cursor})')
    ok=pressed['pressed']=='true' and pressed['transform']!='none' and selected['selected']=='true' and selected['aria']=='true' and selected['bg'] not in ('rgba(0, 0, 0, 0)','rgb(255, 255, 255)') and int(selected['weight'])>=700 and disabled['disabled']=='true' and float(disabled['opacity'])<.7 and disabled['cursor']=='not-allowed' and not errors
    await ctx.close();return case('pressed-selected-disabled',ok,{'pressed':pressed,'selected':selected,'disabled':disabled,'errors':errors})

async def details_and_choices(browser):
    ctx,p,errors=await open_page(browser,{'width':1280,'height':800},'modern')
    advanced=p.locator('#profileAdvancedSection > summary');
    if not await p.locator('#profileAdvancedSection').evaluate('x=>x.open'):
        await advanced.click();await p.wait_for_timeout(80)
    summary=p.locator('#needsProtectedModeContext > summary');before=await summary.get_attribute('aria-expanded');await summary.click();await p.wait_for_timeout(80)
    after=await summary.evaluate('x=>({expanded:x.getAttribute("aria-expanded"),data:x.dataset.uiExpanded,bg:getComputedStyle(x).backgroundColor,controls:x.getAttribute("aria-controls")})')
    await p.locator('#needs_sex').select_option('female');choice=await p.locator('#needs_sex').evaluate('x=>({value:x.value,touched:x.dataset.uiTouched,invalid:x.dataset.uiInvalid})')
    ok=before=='false' and after['expanded']=='true' and after['data']=='true' and after['bg']!='rgba(0, 0, 0, 0)' and choice['value']=='female' and choice['touched']=='true' and choice['invalid']=='false' and not errors
    await ctx.close();return case('expanded-and-choice-states',ok,{'before':before,'after':after,'choice':choice,'errors':errors})

async def profile_success(browser):
    ctx,p,errors=await open_page(browser,{'width':1280,'height':800})
    await p.locator('#needs_sex').select_option('female');await p.locator('#needs_age').fill('35');await p.locator('#needs_h').fill('168');await p.locator('#needs_w').fill('62');await p.locator('#needs_activity').select_option('moderate')
    await p.wait_for_timeout(400);btn=p.locator('#profileCalculateContinue');ready=await btn.is_enabled();await btn.click();
    await p.wait_for_function("document.getElementById('profileCalculateContinue').dataset.uiFeedback==='success'",timeout=10000)
    state=await btn.evaluate('x=>({feedback:x.dataset.uiFeedback,busy:x.dataset.uiBusy,aria:x.getAttribute("aria-busy"),text:x.textContent.trim()})')
    ok=ready and state['feedback']=='success' and state['busy']=='false' and state['aria']=='false' and not errors
    await ctx.close();return case('calculation-busy-success-feedback',ok,{'ready':ready,'state':state,'errors':errors})

async def synthetic_async_states(browser):
    ctx,p,errors=await open_page(browser,{'width':1280,'height':800})
    await p.evaluate('''() => {const b=document.getElementById('geminiRationRecognizeBtn');b.disabled=false;b.dataset.actionState='working';b.setAttribute('aria-busy','true');}''');await p.wait_for_timeout(100)
    working=await p.locator('#geminiRationRecognizeBtn').evaluate('x=>({busy:x.dataset.uiBusy,state:x.dataset.uiState,cursor:getComputedStyle(x).cursor,after:getComputedStyle(x,"::after").content})')
    await p.evaluate('''() => {const b=document.getElementById('geminiRationRecognizeBtn');b.dataset.actionState='error';b.setAttribute('aria-busy','false');}''');await p.wait_for_timeout(100)
    error=await p.locator('#geminiRationRecognizeBtn').evaluate('x=>({busy:x.dataset.uiBusy,state:x.dataset.uiState,color:getComputedStyle(x).color})')
    ok=working['busy']=='true' and working['state']=='working' and working['cursor']=='progress' and working['after']!='none' and error['busy']=='false' and error['state']=='error' and not errors
    await ctx.close();return case('async-working-error-state',ok,{'working':working,'error':error,'errors':errors})

async def theme_matrix(browser):
    results=[];all_errors=[]
    for theme in ('modern','retro-2bit','ivory-brass'):
        ctx,p,errors=await open_page(browser,{'width':1024,'height':768},theme);all_errors+=errors
        await p.locator('#needs_age').focus();x=await p.locator('#needs_age').evaluate('x=>({theme:document.documentElement.dataset.theme,shadow:getComputedStyle(x).boxShadow,outline:getComputedStyle(x).outlineColor,focus:(x.closest("label,.field,.form-field")||x.parentElement).dataset.uiFocusWithin})')
        results.append(x);await ctx.close()
    ok=[x['theme'] for x in results]==['modern','retro-2bit','ivory-brass'] and all(x['focus']=='true' and (x['shadow']!='none' or x['outline']!='rgba(0, 0, 0, 0)') for x in results) and not all_errors
    return case('three-theme-focus-matrix',ok,{'states':results,'errors':all_errors})

async def mobile(browser,outdir):
    ctx,p,errors=await open_page(browser,{'width':390,'height':844})
    state=await p.evaluate('''() => ({layout:document.documentElement.dataset.workspaceLayout,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,targets:[...document.querySelectorAll('button:not([hidden]),input:not([hidden]),select:not([hidden]),summary:not([hidden])')].filter(x=>{const s=getComputedStyle(x),r=x.getBoundingClientRect();return x.getClientRects().length>0&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}).slice(0,120).map(x=>({id:x.id,tag:x.tagName,h:x.getBoundingClientRect().height,w:x.getBoundingClientRect().width})),controller:!!window.NutritionInteractionStatesV1})''')
    await p.screenshot(path=str(outdir/'beta4-interaction-mobile.png'),full_page=False)
    ok=state['layout']=='sections' and state['overflow']<=1 and state['controller'] and min(x['h'] for x in state['targets'])>=24 and sum(1 for x in state['targets'] if x['h']>=44)>=max(1,int(len(state['targets'])*.8)) and not errors
    await ctx.close();return case('mobile-sequential-touch-feedback',ok,{'state':state,'errors':errors})

CASE_FUNCTIONS={
    'core':core_contract,
    'focus':focus_validation,
    'pressed':pressed_selected_disabled,
    'details':details_and_choices,
    'profile':profile_success,
    'async':synthetic_async_states,
    'themes':theme_matrix,
    'mobile':mobile,
}
async def run(chromium,outdir,selected=None):
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            cases=[]
            names=selected or list(CASE_FUNCTIONS)
            for name in names:
                fn=CASE_FUNCTIONS[name]
                cases.append(await fn(browser,outdir) if fn in (core_contract,mobile) else await fn(browser))
            return cases
        finally:await browser.close()
def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/v6-beta4-interaction-acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots');ap.add_argument('--case',action='append',choices=list(CASE_FUNCTIONS));a=ap.parse_args();ROOT=Path(a.app_root).resolve();outdir=ROOT/a.screenshots;outdir.mkdir(parents=True,exist_ok=True)
    cases=asyncio.run(run(a.chromium,outdir,a.case));payload={'ok':all(c['passed'] for c in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(payload,ensure_ascii=False,indent=2));raise SystemExit(0 if payload['ok'] else 1)
if __name__=='__main__':main()
