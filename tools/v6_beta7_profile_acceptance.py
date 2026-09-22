#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json,mimetypes
from pathlib import Path
from urllib.parse import unquote,urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta7-navigation-recovery'

def mime(p):
    if p.suffix=='.gz':return 'application/gzip'
    return mimetypes.guess_type(p.name)[0] or 'application/octet-stream'

async def install(ctx):
    async def handler(route,request):
        rel=unquote(urlparse(request.url).path).lstrip('/') or 'index.html'
        if rel=='api/gemini.php':
            await route.fulfill(status=200 if request.method=='GET' else 503,content_type='application/json',body=json.dumps({'ok':request.method=='GET','configured':True,'ai_available':False,'availability_code':'ci_mock','csrf_token':'test','limits':{'max_images':4,'max_image_bytes':7340032,'max_audio_bytes':7340032}}));return
        path=(ROOT/rel).resolve()
        try:path.relative_to(ROOT)
        except ValueError:await route.fulfill(status=403,body='forbidden');return
        if path.is_file():await route.fulfill(status=200,path=str(path),content_type=mime(path))
        else:await route.fulfill(status=404,body='missing '+rel)
    await ctx.route('https://app.test/**',handler)

async def make_context(browser,viewport,seed=None):
    ctx=await browser.new_context(viewport=viewport,bypass_csp=True)
    seed_json=json.dumps(seed or {},ensure_ascii=False)
    init="""(() => {const data=Object.assign({},__SEED__);const api={getItem:k=>Object.prototype.hasOwnProperty.call(data,String(k))?data[String(k)]:null,setItem:(k,v)=>{data[String(k)]=String(v)},removeItem:k=>{delete data[String(k)]},clear:()=>{Object.keys(data).forEach(k=>delete data[k])},key:i=>Object.keys(data)[i]||null,get length(){return Object.keys(data).length}};Object.defineProperty(window,'localStorage',{configurable:true,value:api});const sessionData={};const sessionApi={getItem:k=>Object.prototype.hasOwnProperty.call(sessionData,String(k))?sessionData[String(k)]:null,setItem:(k,v)=>{sessionData[String(k)]=String(v)},removeItem:k=>{delete sessionData[String(k)]},clear:()=>{Object.keys(sessionData).forEach(k=>delete sessionData[k])},key:i=>Object.keys(sessionData)[i]||null,get length(){return Object.keys(sessionData).length}};Object.defineProperty(window,'sessionStorage',{configurable:true,value:sessionApi});window.__TEST_LOCAL_STORAGE__=data;})()""".replace('__SEED__',seed_json)
    await ctx.add_init_script(script=init)
    await install(ctx)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror:'+str(e)))
    page.on('console',lambda m:errors.append('console:'+m.text) if m.type=='error' else None)
    return ctx,page,errors

async def load(page,query='theme=ivory-brass&noautov=1'):
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    html=html.replace("window.location.search||''",repr('?'+query),1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=45000)
    await page.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=60000)
    await page.wait_for_function(f"window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release==='{VERSION}'",timeout=20000)
    await page.wait_for_timeout(350)

def case(name,ok,details):return {'case':name,'passed':bool(ok),'details':details}

async def journey(browser,outdir):
    ctx,page,errors=await make_context(browser,{'width':1440,'height':900});await load(page)
    initial=await page.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,panel:!!document.getElementById('profileContinuityPanel'),completion:window.NutritionProfilePersistenceV1.completion(),feature:window.NutritionFeatureContinuityV1.audit()})")
    await page.select_option('#needs_sex','female');await page.fill('#needs_h','168');await page.fill('#needs_w','63.5');await page.fill('#needs_age','37');await page.select_option('#needs_activity','moderate')
    await page.wait_for_function('window.NutritionProfilePersistenceV1.completion().complete===true',timeout=5000)
    await page.click('#profileCalculateContinue');await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=15000);await page.wait_for_function("document.documentElement.dataset.navigationRoute==='ration'",timeout=10000)
    added=await page.evaluate("() => {const p=((window.DB&&window.DB.items)||[]).find(x=>x&&x.key);return p?!!window.State.add(p.key,125):false}")
    await page.wait_for_function('window.State.get().length>0',timeout=5000);await page.wait_for_timeout(300)
    seed=await page.evaluate('() => Object.assign({},window.__TEST_LOCAL_STORAGE__)')
    saved=json.loads(seed['nutritionCalculator.profile.v1'])
    await ctx.close()

    ctx2,page2,errors2=await make_context(browser,{'width':1440,'height':900},seed);await load(page2)
    
    try:
        await page2.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=20000)
    except Exception:
        dbg=await page2.evaluate("() => ({stored:window.NutritionProfilePersistenceV1&&window.NutritionProfilePersistenceV1.getStored(),complete:window.NutritionProfilePersistenceV1&&window.NutritionProfilePersistenceV1.completion(),button:{disabled:needs_calc_btn.disabled,ready:needs_calc_btn.getAttribute('data-needs-calculation-ready')},attrs:{restoring:document.documentElement.dataset.profileRestoring,route:document.documentElement.dataset.navigationRoute},out:needs_out.textContent.slice(0,500),lastApplied:window.__lastNeedsProfileApplied,lastMeta:!!window.__lastNeedsMeta})")
        print('RESTORE_DEBUG',json.dumps(dbg,ensure_ascii=False,indent=2),flush=True)
        raise
    await page2.wait_for_timeout(500)
    restored=await page2.evaluate("() => ({sex:needs_sex.value,h:needs_h.value,w:needs_w.value,age:needs_age.value,activity:needs_activity.value,route:document.documentElement.dataset.navigationRoute,applied:window.__lastNeedsProfileApplied,count:window.State.get().length,feature:window.NutritionFeatureContinuityV1.audit(),targets:{kcal:document.getElementById('normInput-kcal').value,protein:document.getElementById('normInput-protein_g').value}})")
    await page2.screenshot(path=str(outdir/'beta5-profile-continuity-restored-desktop.png'),full_page=False)
    ok=initial['route']=='profile' and initial['panel'] and not initial['completion']['complete'] and initial['feature']['ok'] and added and saved['applied'] and restored['sex']=='female' and restored['h']=='168' and restored['w']=='63.5' and restored['age']=='37' and restored['activity']=='moderate' and restored['route']=='ration' and restored['applied'] and restored['count']>=1 and restored['feature']['ok'] and bool(restored['targets']['kcal']) and not errors and not errors2
    c1=case('profile-calculate-ration-reload-continuity',ok,{'initial':initial,'savedApplied':saved['applied'],'restored':restored,'errors':errors+errors2})

    await page2.evaluate("() => window.NavigationShellV1.navigate('profile')");await page2.fill('#needs_age','42');await page2.wait_for_timeout(500)
    seed2=await page2.evaluate('() => Object.assign({},window.__TEST_LOCAL_STORAGE__)');draft=json.loads(seed2['nutritionCalculator.profile.v1']);await ctx2.close()
    ctx3,page3,errors3=await make_context(browser,{'width':1440,'height':900},seed2);await load(page3);await page3.wait_for_timeout(800)
    after=await page3.evaluate("() => ({age:needs_age.value,route:document.documentElement.dataset.navigationRoute,applied:window.__lastNeedsProfileApplied===true,ration:window.State.get().length})")
    c2=case('edited-draft-restores-without-false-recalculation',not draft['applied'] and after['age']=='42' and after['route']=='profile' and not after['applied'] and after['ration']>=1 and not errors3,{'draftApplied':draft['applied'],'after':after,'errors':errors3})
    await page3.evaluate("() => document.getElementById('needs_reset_btn').click()");await page3.wait_for_timeout(350)
    reset=await page3.evaluate("() => ({stored:localStorage.getItem('nutritionCalculator.profile.v1'),h:needs_h.value,w:needs_w.value,age:needs_age.value,ration:window.State.get().length})")
    c3=case('profile-reset-clears-profile-not-ration',reset['stored'] is None and reset['h']=='' and reset['w']=='' and reset['age']=='' and reset['ration']>=1,reset)
    await ctx3.close();return [c1,c2,c3]

async def mobile(browser,outdir):
    ctx,page,errors=await make_context(browser,{'width':390,'height':844});await load(page)
    state=await page.evaluate("() => {const p=document.getElementById('profileContinuityPanel').getBoundingClientRect(),h=document.documentElement;return {route:h.dataset.navigationRoute,layout:h.dataset.workspaceLayout,panelWidth:p.width,overflow:h.scrollWidth-h.clientWidth,buttonHeight:document.getElementById('profileCalculateContinue').getBoundingClientRect().height}}")
    await page.screenshot(path=str(outdir/'beta5-profile-continuity-mobile-390x844.png'),full_page=False)
    c=case('mobile-profile-first-sequential-comfort',state['route']=='profile' and state['layout']=='sections' and state['panelWidth']<=390 and state['overflow']<=1 and state['buttonHeight']>=44 and not errors,{'state':state,'errors':errors});await ctx.close();return c

async def main_async(chromium,outdir):
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:return (await journey(b,outdir))+[await mobile(b,outdir)]
        finally:await b.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/v6-beta7-profile-acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots');ns=ap.parse_args();ROOT=Path(ns.app_root).resolve();outdir=ROOT/ns.screenshots;outdir.mkdir(parents=True,exist_ok=True)
    cases=asyncio.run(main_async(ns.chromium,outdir));result={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};out=ROOT/ns.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
