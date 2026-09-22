#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, re, mimetypes
from urllib.parse import urlsplit, unquote
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
UI_RELEASE='v5.3.210-rc2-hf18'
VIEWPORTS=[(360,800),(390,844),(430,932),(768,1024),(1366,768),(1440,900)]

DENIED_PREFIXES=('/.git','/.github','/tests','/tools','/quality','/reports','/release','/node_modules')
DENIED_NAMES={'.htaccess','_headers','gemini-secret.php','gemini-guard.php','gemini-disabled.flag','integrity-failed.flag','hosting-check.html'}

def denied_path(path):
    clean='/' + unquote(path).lstrip('/')
    if any(clean==p or clean.startswith(p+'/') for p in DENIED_PREFIXES): return True
    name=Path(clean).name
    return name.startswith('.') or name in DENIED_NAMES or clean.endswith('.php')

async def install_virtual_origin(context, root:Path, origin:str):
    token='a'*64
    async def handler(route):
        req=route.request;u=urlsplit(req.url);path=u.path
        headers={'cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'same-origin','x-frame-options':'SAMEORIGIN','x-robots-tag':'noindex, nofollow, noarchive','cross-origin-resource-policy':'same-origin'}
        if path=='/api/gemini.php':
            if req.method=='GET':
                return await route.fulfill(status=200,content_type='application/json',headers={**headers,'set-cookie':f'nutrition_ai_csrf={token}; Path=/; SameSite=Lax'},body=json.dumps({'ok':True,'version':'v5.3.210-rc2','protocol_version':'nutrition-ai-comprehensive-planner-v7','configured':True,'ai_available':False,'availability_code':'virtual_origin','csrf_token':token,'limits':{'max_images':4,'max_image_bytes':7340032,'max_audio_bytes':7340032}}))
            return await route.fulfill(status=403,content_type='application/json',headers=headers,body=json.dumps({'ok':False,'error_code':'csrf_failed'}))
        if denied_path(path): return await route.fulfill(status=404,headers=headers,body='Not found')
        rel=unquote(path).lstrip('/') or 'index.html';file=(root/rel).resolve()
        if not str(file).startswith(str(root.resolve())+str(Path('/'))) and file!=root.resolve(): return await route.fulfill(status=404,headers=headers,body='Not found')
        if not file.is_file(): return await route.fulfill(status=404,headers=headers,body='Not found')
        ctype=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        return await route.fulfill(status=200,content_type=ctype,headers=headers,body=file.read_bytes())
    await context.route(origin+'/**',handler)

def check(rows,name,passed,detail=None):
    rows.append({'name':name,'passed':bool(passed),'detail':detail})

def exact_card(page, query):
    return page.locator('#globalResults .search-result-card').filter(has_text=query.split(' ')[0]).first

async def wait_ready(page):
    await page.wait_for_function("""() => {const c=document.getElementById('needs_calc_btn');return !!window.__APP_BOOTSTRAP_META__&&!!window.NavigationShellV1&&!!window.State&&!!window.DB&&!!c&&c.getAttribute('data-needs-calculation-ready')==='1'&&!c.disabled;}""",timeout=45000)
    await page.wait_for_timeout(350)

async def open_app(page,base,suffix=''):
    response=await page.goto(base+'/index.html'+suffix,wait_until='networkidle',timeout=60000)
    if not response or response.status!=200:raise RuntimeError(f'app load failed: {response.status if response else None}')
    await wait_ready(page)

async def calculate_needs(page):
    await page.fill('#needs_person_name','Иван Иванов');await page.select_option('#needs_sex','male');await page.fill('#needs_h','175');await page.fill('#needs_w','74');await page.fill('#needs_age','45');await page.select_option('#needs_state','normal');await page.select_option('#needs_activity','low');await page.select_option('#needs_goal','maintain');await page.click('#needs_calc_btn')
    await page.wait_for_function("() => window.__lastNeedsProfileApplied===true&&!!window.__lastNeedsMeta",timeout=20000)
    await page.evaluate("() => NavigationShellV1.navigate('ration','globalSearchSection')")

async def add_search(page,query,grams):
    await page.fill('#globalSearchInput',query)
    card=page.locator('#globalResults .search-result-card').filter(has_text=query.split(' ')[0]).first
    await card.wait_for(state='visible',timeout=15000)
    amount=card.locator('[data-role="grams"]')
    if await amount.count():await amount.fill(str(grams))
    before=await page.evaluate("() => State.get().length")
    await card.locator('button[data-role="add-search"],button[data-role="add"]').first.click()
    await page.wait_for_function("count => State.get().length===count+1",arg=before,timeout=10000)
    await page.wait_for_timeout(550)
    return await page.evaluate("""() => {const input=document.getElementById('globalSearchInput'),box=input.getBoundingClientRect(),nav=document.getElementById('navigationShell'),nb=nav&&nav.getBoundingClientRect();return {count:State.get().length,route:NavigationShellV1.getState().route,query:input.value,focused:document.activeElement===input,visible:box.top>=0&&box.bottom<=innerHeight,covered:!!(nb&&getComputedStyle(nav).position==='fixed'&&box.bottom>nb.top),scrollWidth:document.documentElement.scrollWidth,innerWidth};}""")

async def run_engine(args):
    rows=[];errors=[];pdf=ROOT/args.pdf_out
    async with async_playwright() as p:
        engine=getattr(p,args.engine)
        launch={}
        if args.executable:launch['executable_path']=args.executable
        if args.engine=='chromium':launch['args']=['--no-sandbox','--disable-dev-shm-usage']
        browser=await engine.launch(headless=True,**launch)
        try:
            # Startup, actual history, long fallback.
            context=await browser.new_context(viewport={'width':390,'height':844},locale='ru-RU',timezone_id='Europe/Paris')
            
            if args.virtual_root: await install_virtual_origin(context,Path(args.virtual_root),args.base_url)
            page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            await open_app(page,args.base_url)
            await page.evaluate("() => localStorage.setItem('nutritionCalculator.navigationShell.mode.v2','long')")
            await page.reload(wait_until='networkidle');await wait_ready(page)
            stale=await page.evaluate("() => ({mode:NavigationShellV1.getState().mode,stored:localStorage.getItem('nutritionCalculator.navigationShell.mode.v2')})")
            check(rows,'stale_long_removed',stale=={'mode':'workspace','stored':None},stale)
            for route in ['analysis/overview','analysis/hei','report']:
                await page.evaluate('(r)=>NavigationShellV1.navigate(r)',route);await page.wait_for_timeout(100)
            current=page.url
            await page.go_back(wait_until='networkidle');await page.wait_for_timeout(100);back1=page.url
            await page.go_back(wait_until='networkidle');await page.wait_for_timeout(100);back2=page.url
            await page.go_forward(wait_until='networkidle');await page.wait_for_timeout(100);forward=page.url
            state=await page.evaluate("() => NavigationShellV1.getState().route")
            check(rows,'real_browser_history',current.endswith('#report') and back1.endswith('#analysis/hei') and back2.endswith('#analysis/overview') and forward.endswith('#analysis/hei') and state=='analysis/hei',{'current':current,'back1':back1,'back2':back2,'forward':forward,'state':state})
            before_len=await page.evaluate('() => history.length')
            await page.evaluate("() => NavigationShellV1.setMode('long')");await page.wait_for_timeout(100)
            long_url=page.url;return_count=await page.locator('[data-navshell-return-workspace]').count();long_stored=await page.evaluate("() => localStorage.getItem('nutritionCalculator.navigationShell.mode.v2')")
            await page.locator('[data-navshell-return-workspace]').click();await page.wait_for_timeout(120)
            after_len=await page.evaluate('() => history.length')
            check(rows,'technical_fallback_roundtrip',('?ui=long#heiPanel' in long_url and return_count==1 and long_stored is None and page.url.endswith('#analysis/hei') and before_len==after_len),{'long_url':long_url,'return_count':return_count,'before_history':before_len,'after_history':after_len,'returned':page.url})
            await context.close()

            # Daily UI workflow and reload persistence.
            context=await browser.new_context(viewport={'width':390,'height':844},locale='ru-RU',timezone_id='Europe/Paris')
            
            if args.virtual_root: await install_virtual_origin(context,Path(args.virtual_root),args.base_url)
            page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            await open_app(page,args.base_url);await calculate_needs(page)
            workflow_ok=True;adds=[]
            for q,g in [('сыр российский',100),('масло сливочное',40),('банан',160)]:
                a=await add_search(page,q,g);adds.append(a);workflow_ok=workflow_ok and a['route']=='ration' and a['query']==q and a['focused'] and a['visible'] and not a['covered'] and a['scrollWidth']<=a['innerWidth']
            state_before=await page.evaluate('() => JSON.stringify(State.get())');count_before=await page.evaluate('() => State.get().length')
            await page.reload(wait_until='networkidle');await wait_ready(page);await page.wait_for_function('c=>State.get().length===c',arg=count_before,timeout=30000)
            persisted=(await page.evaluate('() => JSON.stringify(State.get())'))==state_before
            await page.evaluate("() => NavigationShellV1.navigate('ration','rationSection')");await page.wait_for_timeout(200)
            inp=page.locator('#rationBody input[data-ration-ref]').first;await inp.wait_for(state='visible',timeout=10000);old=float(await inp.input_value());await inp.fill(str(old+17));await inp.dispatch_event('input');await page.wait_for_timeout(350);edited=abs(float(await inp.input_value())-(old+17))<.01
            check(rows,'daily_workflow_reload_edit',workflow_ok and persisted and edited,{'adds':adds,'persisted':persisted,'edited':edited,'count':count_before})

            # Full-document quiescence.
            await page.wait_for_timeout(1200)
            await page.evaluate("""() => {window.__hostingMutations=0;window.__hostingObserver=new MutationObserver(list=>window.__hostingMutations+=list.length);window.__hostingObserver.observe(document.documentElement,{subtree:true,attributes:true,childList:true,characterData:true});}""")
            await page.wait_for_timeout(3000);mutations=await page.evaluate('() => window.__hostingMutations')
            check(rows,'full_document_quiescence',mutations<=2,{'mutations':mutations,'observation_ms':3000,'budget':2})

            # Matrix and synthetic 200% text.
            matrix=[];matrix_ok=True
            for width,height in VIEWPORTS:
                await page.set_viewport_size({'width':width,'height':height})
                for route in ['ration','analysis/overview','analysis/nutrients','analysis/hei','correction','report','profile']:
                    await page.evaluate('(r)=>NavigationShellV1.navigate(r)',route);await page.wait_for_timeout(80)
                    m=await page.evaluate('() => ({inner:innerWidth,scroll:document.documentElement.scrollWidth})')
                    ok=m['scroll']<=m['inner']+1;matrix_ok=matrix_ok and ok;matrix.append({'viewport':[width,height],'route':route,'passed':ok,**m})
            await page.set_viewport_size({'width':390,'height':844});await page.evaluate("() => document.documentElement.style.fontSize='200%'");await page.wait_for_timeout(300)
            scaled=await page.evaluate('() => ({inner:innerWidth,scroll:document.documentElement.scrollWidth})');scale_ok=scaled['scroll']<=scaled['inner']+1;await page.evaluate("() => document.documentElement.style.fontSize='' ")
            check(rows,'viewport_and_text_scale',matrix_ok and scale_ok,{'failed':[x for x in matrix if not x['passed']],'scale':scaled})

            # Lightweight accessibility surface checks.
            access=await page.evaluate("""() => {const ids=[...document.querySelectorAll('[id]')].map(x=>x.id),dups=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))],current=document.querySelectorAll('#navigationShell [aria-current="page"]').length,unlabeled=[...document.querySelectorAll('button,input,select,textarea')].filter(el=>{if(el.disabled||el.hidden||getComputedStyle(el).display==='none')return false;return !((el.getAttribute('aria-label')||'').trim()||(el.textContent||'').trim()||(el.labels&&el.labels.length)||el.title);}).map(el=>el.id||el.outerHTML.slice(0,80));return {dups,current,unlabeled};}""")
            check(rows,'accessibility_surface',not access['dups'] and access['current']==1 and not access['unlabeled'],access)

            # Print from actual HTTP origin.
            await page.evaluate("() => NavigationShellV1.navigate('report')");await page.wait_for_function("() => !!(window.WorkspaceReportHF13&&WorkspaceReportHF13.getLastModel&&WorkspaceReportHF13.getLastModel())",timeout=20000);await page.emulate_media(media='print')
            ps=await page.evaluate("() => ({nav:getComputedStyle(document.getElementById('navigationShell')).display,fallback:getComputedStyle(document.getElementById('navigationShellLongReturn')).display,report:getComputedStyle(document.querySelector('.workspace-report-document')).display})")
            pdf_size=None
            if args.engine=='chromium':
                pdf.parent.mkdir(parents=True,exist_ok=True);data=await page.pdf(path=str(pdf),format='A4',print_background=True);pdf_size=len(data)
            check(rows,'print_surface',ps['nav']=='none' and ps['fallback']=='none' and ps['report']!='none' and (pdf_size is None or pdf_size>10000),{'state':ps,'pdf_size':pdf_size})
            await context.close()

            # Direct real URL query.
            context=await browser.new_context(viewport={'width':390,'height':844},locale='ru-RU',timezone_id='Europe/Paris')
            
            if args.virtual_root: await install_virtual_origin(context,Path(args.virtual_root),args.base_url)
            page=await context.new_page();await open_app(page,args.base_url,'?ui=long#analysis/hei')
            direct=await page.evaluate("() => ({mode:NavigationShellV1.getState().mode,route:NavigationShellV1.getState().route,stored:localStorage.getItem('nutritionCalculator.navigationShell.mode.v2'),url:location.href})")
            await page.locator('[data-navshell-return-workspace]').click();await page.wait_for_timeout(100)
            check(rows,'direct_query_entry',direct['mode']=='long' and direct['route']=='analysis/hei' and direct['stored'] is None and '?ui=long#heiPanel' in direct['url'] and page.url.endswith('#analysis/hei'),{'direct':direct,'returned':page.url})
            await context.close()
        finally:
            await browser.close()
    result={'schema_version':1,'release_version':UI_RELEASE,'engine':args.engine,'executable':args.executable,'base_url':args.base_url,'checks':rows,'errors':errors,'passed':all(x['passed'] for x in rows) and not errors}
    out=ROOT/args.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':result['passed'],'engine':args.engine,'checks':{x['name']:x['passed'] for x in rows},'errors':errors,'report':str(out.relative_to(ROOT))},ensure_ascii=False,indent=2))
    return 0 if result['passed'] else 1

def main():
    ap=argparse.ArgumentParser();ap.add_argument('base_url');ap.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium');ap.add_argument('--executable');ap.add_argument('--json-out',default='reports/stage-5a-hosting-browser.json');ap.add_argument('--pdf-out',default='reports/stage-5a-hosting-print.pdf');ap.add_argument('--virtual-root');args=ap.parse_args();args.base_url=args.base_url.rstrip('/');raise SystemExit(asyncio.run(run_engine(args)))
if __name__=='__main__':main()
