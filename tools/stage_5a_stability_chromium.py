#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, re, time
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CFG_PATH=ROOT/'config/runtime-assets.v5.3.210-rc2.json'
BUNDLE=ROOT/'assets/css/runtime-bundle-v5.3.210-rc2-hf17.css'
VERSION='v5.3.210-rc2-hf17'
MODE_KEY='nutritionCalculator.navigationShell.mode.v2'
ROUTE_KEY='nutritionCalculator.navigationShell.route.v1'
SCROLL_KEY='nutritionCalculator.navigationShell.scroll.v1'
ROUTES=['profile','ration','analysis/overview','analysis/nutrients','analysis/hei','correction','report']
PRODUCT_KEYS=['cheese_russian','butter_82_5_pct','white_bread','banana','chicken_breast_boiled_skinless','milk_1_5_pct','broccoli_raw']

def strip_query(url:str)->str:return url.split('?',1)[0].lstrip('./')
def script_safe(text:str)->str:return re.sub(r'</script',r'<\\/script',text,flags=re.I)

def selected_products():
    found={}
    for path in sorted((ROOT/'data').glob('products.v5.3.210-p1.3.part-*.json')):
        for row in json.loads(path.read_text(encoding='utf-8')):
            if row.get('key') in PRODUCT_KEYS:found[row['key']]=row
    missing=[x for x in PRODUCT_KEYS if x not in found]
    if missing:raise RuntimeError('Missing fixture products: '+', '.join(missing))
    rows=[found[x] for x in PRODUCT_KEYS]
    rows.extend({'key':f'fixture_hidden_{i:03d}','name_ru':f'Служебная запись {i:03d}','name':f'Fixture {i:03d}','kcal':0,'hidden_from_search':True,'tags':['fixture']} for i in range(1,106))
    return rows

def harness_script(initial_url:str,local_seed:dict|None=None,session_seed:dict|None=None)->str:
    return f"""
(function(){{
  function makeStore(initial){{var data={{}},key;for(key in initial)if(Object.prototype.hasOwnProperty.call(initial,key))data[key]=String(initial[key]);return {{getItem:function(k){{return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null;}},setItem:function(k,v){{data[k]=String(v);}},removeItem:function(k){{delete data[k];}},clear:function(){{data={{}};}},key:function(i){{return Object.keys(data)[i]||null;}},get length(){{return Object.keys(data).length;}}}};}}
  try{{Object.defineProperty(window,'localStorage',{{configurable:true,value:makeStore({json.dumps(local_seed or {},ensure_ascii=False)})}});}}catch(_){{}}
  try{{Object.defineProperty(window,'sessionStorage',{{configurable:true,value:makeStore({json.dumps(session_seed or {},ensure_ascii=False)})}});}}catch(_){{}}
  var current=new URL({json.dumps(initial_url)}),length=1;
  window.__NAVIGATION_SHELL_URL_ADAPTER__={{get href(){{return current.href;}},get length(){{return length;}},replace:function(relative,absolute){{current=new URL(absolute||relative,current.href);}},push:function(relative,absolute){{current=new URL(absolute||relative,current.href);length+=1;}},snapshot:function(){{return {{href:current.href,pathname:current.pathname,search:current.search,hash:current.hash,length:length}};}}}};
}})();
"""

def build_inline_html(initial_url='https://local.test/index.html',local_seed=None,session_seed=None)->str:
    cfg=json.loads(CFG_PATH.read_text(encoding='utf-8'))
    soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
    for link in list(soup.find_all('link')):
        if 'stylesheet' in (link.get('rel') or []):link.decompose()
    for script in list(soup.find_all('script')):
        if script.get('src'):script.decompose()
    style=soup.new_tag('style');style.string=BUNDLE.read_text(encoding='utf-8');soup.head.append(style)
    harness=soup.new_tag('script');harness.string=harness_script(initial_url,local_seed,session_seed);soup.head.append(harness)
    fixture=soup.new_tag('script');fixture.string='window.__PRODUCTS_ARRAY__='+json.dumps(selected_products(),ensure_ascii=False,separators=(',',':'))+';';soup.body.append(fixture)
    for url in cfg['modern_core_scripts']:
        tag=soup.new_tag('script');tag.string=script_safe((ROOT/strip_query(url)).read_text(encoding='utf-8'));soup.body.append(tag)
    ready=soup.new_tag('script');ready.string="window.__APP_BOOTSTRAP_META__={version:'stage-5a-stability-inline',ready:true};window.dispatchEvent(new CustomEvent('app:ready'));";soup.body.append(ready)
    return '<!DOCTYPE html>\n'+str(soup)

async def new_page(browser,initial_url='https://local.test/index.html',viewport=(390,844),local_seed=None,session_seed=None):
    page=await browser.new_page(viewport={'width':viewport[0],'height':viewport[1]})
    errors=[]
    page.on('pageerror',lambda exc:errors.append(str(exc)))
    page.on('console',lambda msg:errors.append('console:'+msg.text) if msg.type=='error' else None)
    await page.set_content(build_inline_html(initial_url,local_seed,session_seed),wait_until='domcontentloaded',timeout=60000)
    await page.wait_for_function("() => !!(window.NavigationShellV1&&window.State&&window.DB&&Array.isArray(DB.items)&&DB.items.length>=7)",timeout=60000)
    await page.wait_for_timeout(450)
    return page,errors

async def install_mutation_counter(page,name='__stabilityMutations'):
    await page.evaluate("""name => {window[name]=0;const old=window[name+'Observer'];if(old)old.disconnect();const observer=new MutationObserver(list=>{window[name]+=list.length;});document.querySelectorAll('.navshell-managed').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['hidden','aria-hidden']}));window[name+'Observer']=observer;}""",name)

async def read_reset(page,name='__stabilityMutations'):
    return await page.evaluate("name => {const n=window[name]||0;window[name]=0;return n;}",name)

async def main_async(args):
    contract=json.loads((ROOT/'quality/stage-5a-stability-contract.json').read_text(encoding='utf-8'))
    targets=contract['stability_targets']
    result={'schema_version':1,'release_version':VERSION,'stage':'5A-S','engine':'system Chromium','executable':args.chromium,'execution_mode':'inline full application with production URL adapter','checks':{},'errors':[],'limitations':['Direct local HTTP and file navigation is blocked by the managed browser policy; URL semantics were exercised through the production adapter.','Firefox and WebKit binaries could not be downloaded because this environment has no external DNS access.','TalkBack, VoiceOver, actual browser text scaling, dynamic mobile browser bars and the system print dialog still require external real-device review.']}
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        page,errors=await new_page(browser,'https://local.test/index.html?campaign=stability');result['errors'].extend(errors)
        await install_mutation_counter(page)
        await page.wait_for_timeout(1200)
        steady=await read_reset(page)
        result['checks']['steady_state_quiescence']={'mutations_1200ms':steady,'budget_per_second':targets['steady_state_managed_attribute_mutations_per_second_max'],'hf16_observed_per_second':contract['confirmed_defect']['hf16_observed_mutations_per_second'],'passed':steady<=targets['steady_state_managed_attribute_mutations_per_second_max']*1.2}

        await page.evaluate("""() => {const p=(DB.items||[]).find(x=>x&&x.key);if(!p)throw new Error('product database empty');State.add(p.key,77);}""")
        ration_before=await page.evaluate("JSON.stringify(State.get())")
        history_before=await page.evaluate("__NAVIGATION_SHELL_URL_ADAPTER__.snapshot().length")
        transitions=0;fallbacks=0;start=time.perf_counter()
        for cycle in range(targets['route_cycles']):
            for route in ROUTES:
                await page.evaluate('(route)=>NavigationShellV1.navigate(route)',route);transitions+=1
            if cycle%5==0:
                await page.evaluate("NavigationShellV1.setMode('long')");await page.locator('[data-navshell-return-workspace]').click();fallbacks+=1;transitions+=2
            await page.wait_for_timeout(15)
        await page.wait_for_timeout(500)
        route_mutations=await read_reset(page)
        state=await page.evaluate("""() => ({nav:NavigationShellV1.getState(),ration:JSON.stringify(State.get()),url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot(),duplicates:[...document.querySelectorAll('[id]')].map(x=>x.id).filter((x,i,a)=>a.indexOf(x)!==i)})""")
        elapsed=round(time.perf_counter()-start,3)
        per_transition=route_mutations/max(1,transitions)
        await page.wait_for_timeout(1000);post_settle=await read_reset(page)
        stress_pass=(fallbacks==targets['technical_fallback_roundtrips'] and state['nav']['mode']=='workspace' and state['ration']==ration_before and not state['duplicates'] and state['url']['search']=='?campaign=stability' and per_transition<=targets['managed_mutations_per_transition_max'] and post_settle<=targets['post_route_settle_mutations_per_second_max'])
        result['checks']['route_and_fallback_soak']={'cycles':targets['route_cycles'],'route_transitions':transitions,'fallback_roundtrips':fallbacks,'mutations':route_mutations,'mutations_per_transition':round(per_transition,3),'post_settle_mutations_1s':post_settle,'history_before':history_before,'history_after':state['url']['length'],'elapsed_seconds':elapsed,'ration_preserved':state['ration']==ration_before,'unrelated_query_preserved':state['url']['search']=='?campaign=stability','duplicate_ids':state['duplicates'],'passed':stress_pass}

        await page.evaluate("NavigationShellV1.navigate('ration')");await page.wait_for_timeout(120)
        await install_mutation_counter(page,'__repairMutations')
        await page.evaluate("""() => {const hidden=document.getElementById('workspaceHeiPanel');hidden.hidden=false;hidden.removeAttribute('aria-hidden');const visible=document.getElementById('globalSearchSection');visible.hidden=true;visible.setAttribute('aria-hidden','true');}""")
        await page.wait_for_timeout(180)
        repaired=await page.evaluate("""() => ({hiddenPanel:{hidden:document.getElementById('workspaceHeiPanel').hidden,aria:document.getElementById('workspaceHeiPanel').getAttribute('aria-hidden')},visiblePanel:{hidden:document.getElementById('globalSearchSection').hidden,aria:document.getElementById('globalSearchSection').getAttribute('aria-hidden')}})""")
        repair_mutations=await read_reset(page,'__repairMutations');await page.wait_for_timeout(1000);repair_settle=await read_reset(page,'__repairMutations')
        result['checks']['visibility_drift_repair']={'state':repaired,'repair_mutations':repair_mutations,'post_repair_mutations_1s':repair_settle,'passed':repaired['hiddenPanel']=={'hidden':True,'aria':'true'} and repaired['visiblePanel']=={'hidden':False,'aria':None} and repair_settle<=2}

        await install_mutation_counter(page,'__refreshMutations')
        await page.evaluate(f"() => {{for(var i=0;i<{targets['idempotent_refresh_calls']};i++)NavigationShellV1.refresh();}}")
        await page.wait_for_timeout(300);refresh_mut=await read_reset(page,'__refreshMutations');await page.wait_for_timeout(1000);refresh_settle=await read_reset(page,'__refreshMutations')
        result['checks']['idempotent_refresh']={'calls':targets['idempotent_refresh_calls'],'mutations':refresh_mut,'post_refresh_mutations_1s':refresh_settle,'passed':refresh_mut<=2 and refresh_settle<=2}

        reflow=[]
        for route in ROUTES:
            await page.evaluate('(route)=>NavigationShellV1.navigate(route)',route);await page.wait_for_timeout(80)
            await page.evaluate("document.documentElement.style.fontSize='200%'");await page.wait_for_timeout(60)
            metrics=await page.evaluate("() => ({route:NavigationShellV1.getState().route,inner:innerWidth,scroll:document.documentElement.scrollWidth})")
            metrics['passed']=metrics['scroll']<=metrics['inner']+1;reflow.append(metrics)
            await page.evaluate("document.documentElement.style.fontSize=''")
        result['checks']['synthetic_text_reflow_200_percent']={'viewport':[390,844],'routes':reflow,'passed':all(x['passed'] for x in reflow)}
        await page.close()

        corrupt,errors=await new_page(browser,'https://local.test/index.html?ui=page#bogus',(390,844),{MODE_KEY:'long',ROUTE_KEY:'%%%broken%%%'},{SCROLL_KEY:'{broken-json'});result['errors'].extend(errors)
        corrupt_state=await corrupt.evaluate(f"""() => ({{state:NavigationShellV1.getState(),url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot(),modeStored:localStorage.getItem('{MODE_KEY}'),routeStored:localStorage.getItem('{ROUTE_KEY}')}})""")
        result['checks']['corrupted_storage_fail_safe']={'data':corrupt_state,'passed':corrupt_state['state']['mode']=='workspace' and corrupt_state['state']['route']=='profile' and corrupt_state['url']['search']=='' and corrupt_state['url']['hash']=='#profile' and corrupt_state['modeStored'] is None}
        await corrupt.close()

        query,errors=await new_page(browser,'https://local.test/index.html?campaign=alpha&utm_source=gate&ui=long#analysis/hei');result['errors'].extend(errors)
        before_query=await query.evaluate("__NAVIGATION_SHELL_URL_ADAPTER__.snapshot()")
        await query.locator('[data-navshell-return-workspace]').click();await query.wait_for_function("() => NavigationShellV1.getState().mode==='workspace'")
        after_query=await query.evaluate("__NAVIGATION_SHELL_URL_ADAPTER__.snapshot()")
        result['checks']['query_parameter_preservation']={'before':before_query,'after':after_query,'passed':before_query['search']=='?campaign=alpha&utm_source=gate&ui=long' and after_query['search']=='?campaign=alpha&utm_source=gate' and after_query['hash']=='#analysis/hei'}
        await query.close();await browser.close()
    result['passed']=all(x.get('passed') for x in result['checks'].values()) and not result['errors']
    out=ROOT/args.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':result['passed'],'checks':{k:v.get('passed') for k,v in result['checks'].items()},'errors':result['errors'],'report':str(out.relative_to(ROOT))},ensure_ascii=False,indent=2))
    return 0 if result['passed'] else 1

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/stage-5a-stability-chromium.json');args=ap.parse_args();raise SystemExit(asyncio.run(main_async(args)))
if __name__=='__main__':main()
