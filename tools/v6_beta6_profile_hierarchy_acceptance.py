#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json,mimetypes,subprocess,sys,tempfile
from pathlib import Path
from urllib.parse import unquote,urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta6-design-refinement'
PERSISTENCE_VERSION='v6.0.0-beta5-cross-stage-hardening'

def mime(p):
    if p.suffix=='.gz': return 'application/gzip'
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
    await ctx.add_init_script(script=init);await install(ctx)
    page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append('pageerror:'+str(e)))
    page.on('console',lambda m:errors.append('console:'+m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text else None)
    return ctx,page,errors

async def load(page,theme='ivory-brass'):
    query=f'theme={theme}&noautov=1'
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1)
    html=html.replace("window.location.search||''",repr('?'+query),1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=45000)
    await page.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=65000)
    await page.wait_for_function(f"window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release==='{VERSION}'",timeout=20000)
    await page.wait_for_function("window.NutritionProfileHierarchyV2&&document.documentElement.dataset.profileHierarchy==='v2'",timeout=10000)
    try:await page.wait_for_selector('#runtimeBootStatusOverlay',state='detached',timeout=3000)
    except Exception:pass
    await page.wait_for_timeout(250)

def case(name,ok,details):return {'case':name,'passed':bool(ok),'details':details}

async def first_run(browser,outdir):
    ctx,p,errors=await make_context(browser,{'width':1440,'height':900});await load(p)
    state=await p.evaluate('''() => ({
      release:window.__APP_BOOTSTRAP_META__.release,hierarchy:window.NutritionProfileHierarchyV2.status(),persistence:window.NutritionProfilePersistenceV1.version,
      completion:window.NutritionProfilePersistenceV1.completion(),calc:{disabled:profileCalculateContinue.disabled,text:profileCalculateContinue.textContent.trim()},
      basic:[...document.querySelectorAll('#profileBasicSection > .profile-hierarchy__fields input,#profileBasicSection > .profile-hierarchy__fields select')].map(x=>x.id),
      prefsOpen:profilePreferencesSection.open,advancedOpen:profileAdvancedSection.open,utilitiesOpen:profileUtilitiesSection.open,
      oldDisclosure:!!document.getElementById('ivoryAdvancedProfileDisclosure'),canonicalHidden:needs_calc_btn.hidden,
      methodClosed:!profileMethodDetails.open,journey:document.querySelectorAll('.profile-hierarchy__journey span').length,
      purposeCount:document.querySelectorAll('[data-profile-purpose]').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      viewport:{w:innerWidth,h:innerHeight},
      basicRect:(()=>{const r=profileBasicSection.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})(),
      firstFieldRect:(()=>{const r=needs_sex.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})(),
      continuityAfterFields:profileContinuityPanel.parentElement===profileBasicSection && profileContinuityPanel.previousElementSibling?.classList.contains('profile-hierarchy__fields'),
      continuityEmbedded:profileContinuityPanel.classList.contains('profile-continuity--embedded'),
      unrelated:{metric:!!document.querySelector('.ivory-metric-strip')?.offsetParent,rail:!!document.querySelector('.ivory-insight-rail')?.offsetParent,dock:!!document.querySelector('.ivory-quick-dock')?.offsetParent,mobileSummary:!!document.querySelector('.ivory-mobile-summary')?.offsetParent,legacyPanel:!!document.getElementById('workspaceProfilePanel')?.offsetParent},
      skipHref:document.querySelector('.skip-link')?.getAttribute('href')
    })''')
    ok=(state['release']==VERSION and state['persistence']==PERSISTENCE_VERSION and state['completion']['done']==0 and state['completion']['total']==5 and state['calc']['disabled'] and state['calc']['text']=='Заполните основные данные' and state['basic']==['needs_sex','needs_age','needs_h','needs_w','needs_activity','needs_bmi'] and not state['prefsOpen'] and not state['advancedOpen'] and not state['utilitiesOpen'] and not state['oldDisclosure'] and state['canonicalHidden'] and state['methodClosed'] and state['journey']==3 and state['purposeCount']==6 and state['overflow']<=1 and state['basicRect']['top']<state['viewport']['h']*.55 and state['firstFieldRect']['top']>=0 and state['firstFieldRect']['bottom']<=state['viewport']['h'] and state['continuityAfterFields'] and state['continuityEmbedded'] and not any(state['unrelated'].values()) and state['skipHref']=='#needs_sex' and not errors)
    await p.screenshot(path=str(outdir/'beta5-profile-first-step-desktop.png'),full_page=False);await ctx.close()
    return case('first-run-five-field-hierarchy',ok,{'state':state,'errors':errors})

async def disclosures(browser):
    ctx,p,errors=await make_context(browser,{'width':1280,'height':800});await load(p,'modern')
    await p.click('#profilePreferencesSection > summary');await p.select_option('#needs_goal','lose');await p.select_option('#needs_diet_style','plant_forward')
    await p.click('#profileAdvancedSection > summary');await p.select_option('#needs_state','rehab');await p.wait_for_timeout(120)
    state=await p.evaluate('''() => ({
      preferencesOpen:profilePreferencesSection.open,advancedOpen:profileAdvancedSection.open,
      preferenceIds:[...document.querySelectorAll('#profilePreferencesSection input,#profilePreferencesSection select')].map(x=>x.id),
      advancedIds:[...document.querySelectorAll('#profileAdvancedSection input,#profileAdvancedSection select')].map(x=>x.id),
      preferenceStatus:profilePreferencesSection.querySelector('[data-profile-summary-status]').textContent.trim(),
      advancedStatus:profileAdvancedSection.querySelector('[data-profile-summary-status]').textContent.trim(),
      special:window.NutritionProfileHierarchyV2.status().special,
      prefs:JSON.parse(localStorage.getItem('nutritionCalculator.profileDisclosure.v2'))
    })''')
    ok=state['preferencesOpen'] and state['advancedOpen'] and all(x in state['preferenceIds'] for x in ['needs_person_name','needs_goal','needs_diet_style','needs_split']) and all(x in state['advancedIds'] for x in ['needs_state','needs_edema','needs_guardrail','needs_protein_manual']) and state['preferenceStatus']=='Настроено' and state['advancedStatus']=='Особые параметры выбраны' and state['special'] and state['prefs']['preferences'] and state['prefs']['advanced'] and not errors
    await ctx.close();return case('optional-and-professional-disclosure',ok,{'state':state,'errors':errors})

async def calculate_restore(browser,outdir):
    ctx,p,errors=await make_context(browser,{'width':1440,'height':900});await load(p)
    await p.select_option('#needs_sex','female');await p.fill('#needs_age','37');await p.fill('#needs_h','168');await p.fill('#needs_w','63.5');await p.select_option('#needs_activity','moderate')
    await p.wait_for_function('window.NutritionProfilePersistenceV1.completion().complete===true',timeout=5000)
    before=await p.evaluate("() => ({text:profileCalculateContinue.textContent.trim(),state:document.documentElement.dataset.profileCalculationState,enabled:!profileCalculateContinue.disabled})")
    await p.click('#profileCalculateContinue');await p.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=15000);await p.wait_for_function("document.documentElement.dataset.navigationRoute==='ration'",timeout=10000)
    await p.wait_for_timeout(350)
    seed=await p.evaluate('() => Object.assign({},window.__TEST_LOCAL_STORAGE__)');saved=json.loads(seed['nutritionCalculator.profile.v1']);await ctx.close()
    ctx2,p2,errors2=await make_context(browser,{'width':1440,'height':900},seed);await load(p2)
    await p2.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=20000);await p2.wait_for_timeout(250)
    restored=await p2.evaluate('''() => ({sex:needs_sex.value,age:needs_age.value,h:needs_h.value,w:needs_w.value,activity:needs_activity.value,route:document.documentElement.dataset.navigationRoute,current:window.NutritionProfilePersistenceV1.isCurrentApplied(),text:profileCalculateContinue.textContent.trim(),state:document.documentElement.dataset.profileCalculationState,advancedOpen:profileAdvancedSection.open})''')
    await p2.evaluate("() => window.NavigationShellV1.navigate('profile')");await p2.wait_for_timeout(200);await p2.screenshot(path=str(outdir/'beta5-profile-restored-desktop.png'),full_page=False)
    ok=before['enabled'] and before['text']=='Рассчитать и перейти к рациону' and before['state']=='draft' and saved['applied'] and restored['sex']=='female' and restored['age']=='37' and restored['h']=='168' and restored['w']=='63.5' and restored['activity']=='moderate' and restored['route']=='ration' and restored['current'] and restored['text']=='Перейти к рациону' and restored['state']=='current' and not restored['advancedOpen'] and not errors and not errors2
    await ctx2.close();return case('calculate-persist-restore-current-profile',ok,{'before':before,'savedApplied':saved['applied'],'restored':restored,'errors':errors+errors2})

async def special_restore(browser):
    ctx,p,errors=await make_context(browser,{'width':1200,'height':800});await load(p,'modern')
    await p.click('#profileAdvancedSection > summary');await p.select_option('#needs_state','rehab');await p.wait_for_timeout(350)
    seed=await p.evaluate('() => Object.assign({},window.__TEST_LOCAL_STORAGE__)');await ctx.close()
    ctx2,p2,errors2=await make_context(browser,{'width':1200,'height':800},seed);await load(p2,'modern')
    state=await p2.evaluate("() => ({open:profileAdvancedSection.open,status:profileAdvancedSection.querySelector('[data-profile-summary-status]').textContent.trim(),value:needs_state.value,special:window.NutritionProfileHierarchyV2.status().special})")
    ok=state['open'] and state['value']=='rehab' and state['status']=='Особые параметры выбраны' and state['special'] and not errors and not errors2
    await ctx2.close();return case('special-profile-auto-reveals-on-restore',ok,{'state':state,'errors':errors+errors2})

async def theme_matrix(browser):
    rows=[];errors_all=[]
    for theme in ('modern','retro-2bit','ivory-brass'):
        ctx,p,errors=await make_context(browser,{'width':1024,'height':768});await load(p,theme);errors_all+=errors
        row=await p.evaluate('''() => ({theme:document.documentElement.dataset.theme,hierarchy:document.documentElement.dataset.profileHierarchy,basic:!!document.getElementById('profileBasicSection').offsetParent,prefs:profilePreferencesSection.open,advanced:profileAdvancedSection.open,summaryHeight:profilePreferencesSection.querySelector('summary').getBoundingClientRect().height})''');rows.append(row);await ctx.close()
    ok=[r['theme'] for r in rows]==['modern','retro-2bit','ivory-brass'] and all(r['hierarchy']=='v2' and r['basic'] and not r['prefs'] and not r['advanced'] and r['summaryHeight']>=52 for r in rows) and not errors_all
    return case('three-theme-profile-hierarchy',ok,{'rows':rows,'errors':errors_all})

async def mobile(browser,outdir):
    ctx,p,errors=await make_context(browser,{'width':390,'height':844});await load(p)
    state=await p.evaluate('''() => ({layout:document.documentElement.dataset.workspaceLayout,route:document.documentElement.dataset.navigationRoute,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,basicWidth:profileBasicSection.getBoundingClientRect().width,primaryHeight:profileCalculateContinue.getBoundingClientRect().height,summaries:[...document.querySelectorAll('.profile-hierarchy__details>summary')].map(x=>x.getBoundingClientRect().height),columns:getComputedStyle(document.querySelector('#profileBasicSection .profile-hierarchy__fields')).gridTemplateColumns,viewport:{w:innerWidth,h:innerHeight},basicTop:profileBasicSection.getBoundingClientRect().top,firstField:(()=>{const r=needs_sex.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})(),unrelated:{metric:!!document.querySelector('.ivory-metric-strip')?.offsetParent,rail:!!document.querySelector('.ivory-insight-rail')?.offsetParent,dock:!!document.querySelector('.ivory-quick-dock')?.offsetParent,mobileSummary:!!document.querySelector('.ivory-mobile-summary')?.offsetParent,legacyPanel:!!document.getElementById('workspaceProfilePanel')?.offsetParent},continuityAfterFields:profileContinuityPanel.parentElement===profileBasicSection && profileContinuityPanel.previousElementSibling?.classList.contains('profile-hierarchy__fields')})''')
    await p.screenshot(path=str(outdir/'beta5-profile-first-step-mobile.png'),full_page=False)
    ok=state['layout']=='sections' and state['route']=='profile' and state['overflow']<=1 and state['basicWidth']<=390 and state['primaryHeight']>=44 and min(state['summaries'])>=56 and ' ' not in state['columns'].strip() and state['basicTop']<state['viewport']['h']*.6 and state['firstField']['top']>=0 and state['firstField']['bottom']<=state['viewport']['h'] and not any(state['unrelated'].values()) and state['continuityAfterFields'] and not errors
    await ctx.close();return case('mobile-sequential-profile-hierarchy',ok,{'state':state,'errors':errors})

async def run(chromium,outdir,selected='all'):
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            cases=[];mapping={'first':first_run,'disclosures':disclosures,'restore':calculate_restore,'special':special_restore,'themes':theme_matrix,'mobile':mobile}
            names=list(mapping) if selected=='all' else [selected]
            for name in names:
                fn=mapping[name];print('RUN',name,flush=True)
                if fn in (first_run,calculate_restore,mobile):cases.append(await fn(browser,outdir))
                else:cases.append(await fn(browser))
                print('DONE',name,cases[-1]['passed'],flush=True)
            return cases
        finally:await browser.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/v6-beta6-profile-hierarchy-acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots');ap.add_argument('--case',choices=['all','first','disclosures','restore','special','themes','mobile'],default='all');a=ap.parse_args();ROOT=Path(a.app_root).resolve();outdir=ROOT/a.screenshots;outdir.mkdir(parents=True,exist_ok=True)
    if a.case=='all':
        cases=[];errors=[]
        for name in ('first','disclosures','restore','special','themes','mobile'):
            tmp=Path(tempfile.gettempdir())/('v6-beta6-profile-'+name+'.json')
            cmd=[sys.executable,str(Path(__file__).resolve()),'--app-root',str(ROOT),'--chromium',a.chromium,'--case',name,'--json-out',str(tmp)]
            runp=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=190)
            if runp.returncode==0 and tmp.is_file():cases.extend(json.loads(tmp.read_text(encoding='utf-8')).get('cases',[]))
            else:errors.append({'case':name,'returncode':runp.returncode,'stdout':runp.stdout[-1000:],'stderr':runp.stderr[-1000:]})
        if errors:cases.extend({'case':'isolated-'+e['case'],'passed':False,'details':e} for e in errors)
    else:cases=asyncio.run(run(a.chromium,outdir,a.case))
    payload={'ok':all(c['passed'] for c in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(payload,ensure_ascii=False,indent=2));raise SystemExit(0 if payload['ok'] else 1)
if __name__=='__main__':main()
