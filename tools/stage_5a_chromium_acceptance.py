#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, re
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CFG_PATH=ROOT/'config/runtime-assets.v5.3.210-rc2.json'
VIEWPORTS=[(360,800),(390,844),(430,932),(768,1024),(1366,768),(1440,900)]
MODE_KEY='nutritionCalculator.navigationShell.mode.v2'
ROUTE_KEY='nutritionCalculator.navigationShell.route.v1'
PRODUCT_KEYS=['cheese_russian','butter_82_5_pct','white_bread','banana','chicken_breast_boiled_skinless','milk_1_5_pct','broccoli_raw']

def strip_query(url:str)->str:
    return url.split('?',1)[0].lstrip('./')

def selected_products():
    found={}
    for path in sorted((ROOT/'data').glob('products.v5.3.210-p1.3.part-*.json')):
        for row in json.loads(path.read_text(encoding='utf-8')):
            if row.get('key') in PRODUCT_KEYS: found[row['key']]=row
    missing=[key for key in PRODUCT_KEYS if key not in found]
    if missing: raise RuntimeError('Missing fixture products: '+', '.join(missing))
    rows=[found[key] for key in PRODUCT_KEYS]
    rows.extend({'key':f'fixture_hidden_{i:03d}','name_ru':f'Служебная запись {i:03d}','name':f'Fixture {i:03d}','kcal':0,'hidden_from_search':True,'tags':['fixture']} for i in range(1,106))
    return rows

def script_safe(text:str)->str:
    return re.sub(r'</script',r'<\\/script',text,flags=re.I)

def harness_script(initial_url:str,stale_long:bool=False)->str:
    seed={MODE_KEY:'long'} if stale_long else {}
    return f"""
(function(){{
  var seed={json.dumps(seed,ensure_ascii=False)};
  function makeStore(initial){{
    var data={{}},key;for(key in initial)if(Object.prototype.hasOwnProperty.call(initial,key))data[key]=String(initial[key]);
    return {{getItem:function(k){{return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null;}},setItem:function(k,v){{data[k]=String(v);}},removeItem:function(k){{delete data[k];}},clear:function(){{data={{}};}},key:function(i){{return Object.keys(data)[i]||null;}},get length(){{return Object.keys(data).length;}}}};
  }}
  try{{Object.defineProperty(window,'localStorage',{{configurable:true,value:makeStore(seed)}});}}catch(_){{}}
  try{{Object.defineProperty(window,'sessionStorage',{{configurable:true,value:makeStore({{}})}});}}catch(_){{}}
  var current=new URL({json.dumps(initial_url)}),length=1;
  window.__NAVIGATION_SHELL_URL_ADAPTER__={{
    get href(){{return current.href;}},
    get length(){{return length;}},
    replace:function(relative,absolute){{current=new URL(absolute||relative,current.href);}},
    push:function(relative,absolute){{current=new URL(absolute||relative,current.href);length+=1;}},
    snapshot:function(){{return {{href:current.href,pathname:current.pathname,search:current.search,hash:current.hash,length:length}};}}
  }};
}})();
"""

def build_inline_html(initial_url='https://local.test/index.html',stale_long=False)->str:
    cfg=json.loads(CFG_PATH.read_text(encoding='utf-8'))
    soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
    for link in list(soup.find_all('link')):
        if 'stylesheet' in (link.get('rel') or []): link.decompose()
    for script in list(soup.find_all('script')):
        if script.get('src'): script.decompose()
    style=soup.new_tag('style');style.string=(ROOT/'assets/css/runtime-bundle-v5.3.210-rc2-hf16.css').read_text(encoding='utf-8');soup.head.append(style)
    harness=soup.new_tag('script');harness.string=harness_script(initial_url,stale_long);soup.head.append(harness)
    fixture=soup.new_tag('script');fixture.string='window.__PRODUCTS_ARRAY__='+json.dumps(selected_products(),ensure_ascii=False,separators=(',',':'))+';';soup.body.append(fixture)
    for url in cfg['modern_core_scripts']:
        rel=strip_query(url);tag=soup.new_tag('script');tag.string=script_safe((ROOT/rel).read_text(encoding='utf-8'));soup.body.append(tag)
    ready=soup.new_tag('script');ready.string="window.__APP_BOOTSTRAP_META__={version:'stage-5a-inline',ready:true};window.dispatchEvent(new CustomEvent('app:ready'));";soup.body.append(ready)
    return '<!DOCTYPE html>\n'+str(soup)

async def wait_ready(page):
    await page.wait_for_function("() => !!(window.__APP_BOOTSTRAP_META__ && window.NavigationShellV1 && window.State && window.DB && Array.isArray(window.DB.items) && window.DB.items.length >= 7)",timeout=60000)
    await page.wait_for_timeout(350)

async def new_inline_page(browser,initial_url,viewport=(390,844),stale_long=False):
    page=await browser.new_page(viewport={'width':viewport[0],'height':viewport[1]})
    errors=[]
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.on('console',lambda msg: errors.append('console:'+msg.text) if msg.type=='error' else None)
    await page.set_content(build_inline_html(initial_url,stale_long),wait_until='domcontentloaded',timeout=60000)
    await wait_ready(page)
    return page,errors

async def main_async(args):
    result={
      'schema_version':2,'release_version':'v5.3.210-rc2-hf16','stage':'5A','engine':'system Chromium','executable':args.chromium,
      'execution_mode':'inline full application with production URL adapter','viewport_matrix':[list(v) for v in VIEWPORTS],
      'checks':{},'matrix_results':[],'errors':[],
      'limitations':['Managed Chromium blocks navigation to local HTTP and file URLs; startup query semantics were executed through the production URL adapter in the full inline application','Firefox binary unavailable in the local environment','WebKit binary unavailable in the local environment','TalkBack, VoiceOver, browser text scaling, dynamic mobile browser bars and the system print dialog require real-device review']
    }
    async with async_playwright() as p:
      browser=await p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
      page,errors=await new_inline_page(browser,'https://local.test/index.html',(390,844),stale_long=True);result['errors'].extend(errors)
      normal=await page.evaluate(f"""() => ({{
        mode:NavigationShellV1.getState().mode,technical:NavigationShellV1.getState().technicalFallback,
        switcher:!!document.getElementById('navigationShellModeSwitcher'),modeActions:document.querySelectorAll('[data-navshell-mode]').length,
        primary:document.querySelectorAll('#navigationShell .navigation-shell__items [data-navshell-route]').length,
        secondary:document.querySelectorAll('#navigationShell .navigation-shell__secondary button').length,
        stored:localStorage.getItem('{MODE_KEY}'),url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot()
      }})""")
      normal_pass=(normal['mode']=='workspace' and normal['technical'] is False and normal['switcher'] is False and normal['modeActions']==0 and normal['primary']==4 and normal['secondary']==2 and normal['stored'] is None and normal['url']['search']=='' and normal['url']['hash']=='#profile')
      result['checks']['ordinary_startup']={'data':normal,'passed':normal_pass}

      before=await page.evaluate("""() => {const product=(DB.items||[]).find(item=>item&&item.key);if(!product)throw new Error('product database empty');State.add(product.key,123);NavigationShellV1.navigate('analysis/hei');return {ration:JSON.stringify(State.get()),url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot(),route:NavigationShellV1.getState().route};}""")
      await page.wait_for_timeout(180);await page.evaluate("NavigationShellV1.setMode('long')");await page.wait_for_timeout(180)
      long_state=await page.evaluate(f"""() => ({{mode:NavigationShellV1.getState().mode,technical:NavigationShellV1.getState().technicalFallback,url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot(),ration:JSON.stringify(State.get()),returnCount:document.querySelectorAll('[data-navshell-return-workspace]').length,returnVisible:getComputedStyle(document.getElementById('navigationShellLongReturn')).display!=='none',stored:localStorage.getItem('{MODE_KEY}')}})""")
      await page.locator('[data-navshell-return-workspace]').click();await page.wait_for_function("() => NavigationShellV1.getState().mode==='workspace' && NavigationShellV1.getState().route==='analysis/hei'",timeout=10000)
      after=await page.evaluate(f"""() => ({{mode:NavigationShellV1.getState().mode,route:NavigationShellV1.getState().route,url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot(),ration:JSON.stringify(State.get()),modeStored:localStorage.getItem('{MODE_KEY}'),routeStored:localStorage.getItem('{ROUTE_KEY}')}})""")
      roundtrip_pass=(before['route']=='analysis/hei' and long_state['mode']=='long' and long_state['technical'] and long_state['url']['search']=='?ui=long' and long_state['url']['hash']=='#heiPanel' and long_state['ration']==before['ration'] and long_state['url']['length']==before['url']['length'] and long_state['returnCount']==1 and long_state['returnVisible'] and long_state['stored'] is None and after['mode']=='workspace' and after['route']=='analysis/hei' and after['url']['search']=='' and after['url']['hash']=='#analysis/hei' and after['ration']==before['ration'] and after['url']['length']==before['url']['length'] and after['modeStored'] is None and after['routeStored']=='analysis/hei')
      result['checks']['fallback_roundtrip']={'before':before,'long':long_state,'after':after,'passed':roundtrip_pass}

      await page.evaluate("NavigationShellV1.navigate('report')");await page.wait_for_function("() => !!(window.WorkspaceReportHF13 && WorkspaceReportHF13.getLastModel && WorkspaceReportHF13.getLastModel())",timeout=15000)
      report_payload=await page.evaluate("""() => {
        const model=WorkspaceReportHF13.getLastModel();
        return {
          html:WorkspaceReportHF13.buildDocumentHtml(model),
          modelHash:JSON.stringify(model),
          generatedText:(new DOMParser().parseFromString(WorkspaceReportHF13.buildDocumentHtml(model),'text/html').querySelector('.workspace-report-document')||{}).textContent||'',
          switcher:!!document.getElementById('navigationShellModeSwitcher')
        };
      }""")
      print_page=await browser.new_page(viewport={'width':1240,'height':900})
      await print_page.set_content(report_payload['html'],wait_until='domcontentloaded',timeout=30000)
      await print_page.emulate_media(media='print')
      print_state=await print_page.evaluate("""() => ({
        title:document.title,
        reportCount:document.querySelectorAll('.workspace-report-document').length,
        scriptCount:document.querySelectorAll('script').length,
        tableCount:document.querySelectorAll('.workspace-report-table').length,
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth,
        text:(document.querySelector('.workspace-report-document')||{}).textContent||''
      })""")
      pdf=ROOT/args.pdf_out;pdf.parent.mkdir(parents=True,exist_ok=True);await print_page.pdf(path=str(pdf),format='A4',print_background=True,prefer_css_page_size=True);print_state['pdf_bytes']=pdf.stat().st_size
      normalize=lambda value:' '.join(str(value or '').split())
      print_state['same_report_text']=bool(report_payload['generatedText'] and normalize(print_state['text'])==normalize(report_payload['generatedText']))
      print_state['no_horizontal_overflow']=print_state['scrollWidth']<=print_state['clientWidth']+1
      print_state['switcher']=report_payload['switcher']
      await print_page.close()
      result['checks']['report_print']={'data':print_state,'passed':print_state['reportCount']==1 and print_state['scriptCount']==0 and print_state['tableCount']>=1 and print_state['same_report_text'] and print_state['no_horizontal_overflow'] and not print_state['switcher'] and print_state['pdf_bytes']>10000}

      for width,height in VIEWPORTS:
        await page.set_viewport_size({'width':width,'height':height});await page.evaluate("NavigationShellV1.setMode('long')");await page.wait_for_timeout(80)
        metrics=await page.evaluate("""() => {const c=document.getElementById('navigationShellLongReturn').getBoundingClientRect(),b=document.querySelector('[data-navshell-return-workspace]').getBoundingClientRect(),u=__NAVIGATION_SHELL_URL_ADAPTER__.snapshot();return {inner:innerWidth,scroll:document.documentElement.scrollWidth,left:c.left,right:c.right,buttonHeight:b.height,search:u.search,hash:u.hash,length:u.length};}""")
        passed=metrics['scroll']<=metrics['inner']+1 and metrics['left']>=-.5 and metrics['right']<=metrics['inner']+.5 and metrics['buttonHeight']>=43.5 and metrics['search']=='?ui=long'
        await page.locator('[data-navshell-return-workspace]').click();await page.wait_for_function("() => NavigationShellV1.getState().mode==='workspace'",timeout=5000)
        returned=await page.evaluate("__NAVIGATION_SHELL_URL_ADAPTER__.snapshot()");metrics['returned_search']=returned['search'];metrics['returned_hash']=returned['hash'];metrics['returned_length']=returned['length'];passed=passed and returned['search']=='' and returned['length']==metrics['length']
        result['matrix_results'].append({'viewport':[width,height],'metrics':metrics,'passed':passed})

      direct,direct_errors=await new_inline_page(browser,'https://local.test/index.html?ui=long#analysis/hei',(390,844));result['errors'].extend(direct_errors)
      direct_state=await direct.evaluate(f"""() => ({{mode:NavigationShellV1.getState().mode,route:NavigationShellV1.getState().route,url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot(),stored:localStorage.getItem('{MODE_KEY}'),returnCount:document.querySelectorAll('[data-navshell-return-workspace]').length}})""");await direct.close()
      alias,alias_errors=await new_inline_page(browser,'https://local.test/index.html?ui=page#analysis/hei',(390,844));result['errors'].extend(alias_errors)
      alias_state=await alias.evaluate("() => ({mode:NavigationShellV1.getState().mode,route:NavigationShellV1.getState().route,url:__NAVIGATION_SHELL_URL_ADAPTER__.snapshot()})");await alias.close()
      query_pass=(direct_state['mode']=='long' and direct_state['route']=='analysis/hei' and direct_state['url']['search']=='?ui=long' and direct_state['url']['hash']=='#heiPanel' and direct_state['stored'] is None and direct_state['returnCount']==1 and alias_state['mode']=='workspace' and alias_state['route']=='analysis/hei' and alias_state['url']['search']=='' and alias_state['url']['hash']=='#analysis/hei')
      result['checks']['direct_query_and_aliases']={'direct':direct_state,'retired_alias':alias_state,'passed':query_pass}
      await page.close();await browser.close()
    result['passed']=all(row.get('passed') for row in result['checks'].values()) and all(row.get('passed') for row in result['matrix_results']) and not result['errors']
    out=ROOT/args.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':result['passed'],'checks':{k:v.get('passed') for k,v in result['checks'].items()},'viewports':len(result['matrix_results']),'failed_viewports':[x['viewport'] for x in result['matrix_results'] if not x['passed']],'errors':result['errors'],'report':str(out.relative_to(ROOT)),'pdf':str(pdf.relative_to(ROOT))},ensure_ascii=False,indent=2))
    return 0 if result['passed'] else 1

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/stage-5a-chromium-acceptance.json');ap.add_argument('--pdf-out',default='reports/stage-5a-chromium-print.pdf');args=ap.parse_args();raise SystemExit(asyncio.run(main_async(args)))
if __name__=='__main__':main()
