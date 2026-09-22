#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
import v6_ivory_acceptance as base
ROOT=Path(__file__).resolve().parents[1]
VERSION=base.VERSION

def result(name,ok,details):return {'case':name,'passed':bool(ok),'details':details}

async def profile_disclosure(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':390,'height':844})
    await page.wait_for_selector('#ivoryAdvancedProfileButton')
    before=await page.evaluate("""() => ({expanded:document.getElementById('ivoryAdvancedProfileButton').getAttribute('aria-expanded'),stateHidden:document.getElementById('needs_state').parentElement.hidden,edemaHidden:document.getElementById('needs_edema').parentElement.hidden,guardHidden:document.getElementById('needs_guardrail').parentElement.hidden,protectedHidden:document.getElementById('needsProtectedModeContext').hidden})""")
    await page.click('#ivoryAdvancedProfileButton');await page.wait_for_timeout(100)
    opened=await page.evaluate("""() => ({expanded:document.getElementById('ivoryAdvancedProfileButton').getAttribute('aria-expanded'),stateHidden:document.getElementById('needs_state').parentElement.hidden,guardHidden:document.getElementById('needs_guardrail').parentElement.hidden})""")
    await page.evaluate("() => window.NutritionTheme.set('modern',{persist:false})");await page.wait_for_timeout(100)
    modern=await page.evaluate("""() => ({controlHidden:document.getElementById('ivoryAdvancedProfileDisclosure').hidden,stateHidden:document.getElementById('needs_state').parentElement.hidden,guardHidden:document.getElementById('needs_guardrail').parentElement.hidden})""")
    ok=before=={'expanded':'false','stateHidden':True,'edemaHidden':True,'guardHidden':True,'protectedHidden':True} and opened=={'expanded':'true','stateHidden':False,'guardHidden':False} and modern=={'controlHidden':True,'stateHidden':False,'guardHidden':False} and not errors
    await ctx.close();return result('profile-progressive-disclosure-stable-dom',ok,{'before':before,'opened':opened,'modern':modern,'errors':errors})

async def truthful_targets_and_palette(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':1440,'height':900})
    await base.go_ration(page)
    state=await page.evaluate("""() => {
      const model=window.NutritionUIViewModel.get(),hero=getComputedStyle(document.querySelector('#ivoryRationHero button')),theme=getComputedStyle(document.querySelector('#ivoryNavTheme [data-theme-value="ivory-brass"]')),rail=getComputedStyle(document.querySelector('#ivoryInsightRail button'));
      return {ready:model.profile.ready,targets:model.metrics.map(x=>Number.isFinite(x.target)?x.target:null),heroImage:hero.backgroundImage,heroColor:hero.color,themeBg:theme.backgroundColor,railBg:rail.backgroundColor,railColor:rail.color,blue:[hero.backgroundColor,theme.backgroundColor,rail.backgroundColor].includes('rgb(20, 94, 199)')};
    }""")
    ok=state['ready'] is False and all(x is None for x in state['targets']) and 'linear-gradient' in state['heroImage'] and state['themeBg']=='rgb(65, 69, 29)' and not state['blue'] and not errors
    await ctx.close();return result('truthful-uncomputed-targets-and-ivory-palette',ok,{'state':state,'errors':errors})

async def focus_reduced_motion(browser):
    ctx=await browser.new_context(viewport={'width':390,'height':844},bypass_csp=True,reduced_motion='reduce')
    await base.install(ctx);page=await ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1).replace("window.location.search||''",repr('?theme=ivory-brass&noautov=1'),1)
    await page.set_content(html,wait_until='domcontentloaded',timeout=30000);await page.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=45000);await page.wait_for_timeout(250)
    state=await page.evaluate("""() => {const e=document.activeElement,cs=getComputedStyle(e),b=document.querySelector('#ivoryAdvancedProfileButton'),bs=getComputedStyle(b);return {tag:e.tagName,tab:e.getAttribute('tabindex'),box:cs.boxShadow,outline:cs.outlineStyle,motion:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:bs.transitionDuration,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};}""")
    ok=state['tag']=='H2' and state['tab']=='-1' and state['box']=='none' and state['motion'] and state['overflow']<=1 and not errors
    await ctx.close();return result('mobile-programmatic-focus-and-reduced-motion',ok,{'state':state,'errors':errors})

async def tablet(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':1024,'height':768})
    await base.go_ration(page)
    state=await page.evaluate("""() => ({layout:document.documentElement.dataset.workspaceLayout,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,hero:getComputedStyle(document.getElementById('ivoryRationHero')).display,mobile:getComputedStyle(document.getElementById('ivoryMobileSummary')).display,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,nav:getComputedStyle(document.getElementById('navigationShell')).position})""")
    ok=state['layout']=='sections' and state['rail']=='none' and state['hero']=='none' and state['mobile']=='none' and state['overflow']<=1 and not errors
    await ctx.close();return result('tablet-sequential-without-cramped-rail',ok,{'state':state,'errors':errors})


async def profile_calculation_with_collapsed_advanced(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':390,'height':844})
    await page.fill('#needs_person_name','Тест темы')
    await page.select_option('#needs_sex','female');await page.fill('#needs_h','168');await page.fill('#needs_w','62');await page.fill('#needs_age','35');await page.select_option('#needs_activity','moderate');await page.select_option('#needs_goal','maintain')
    await page.click('#needs_calc_btn');await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=10000);await page.wait_for_timeout(150)
    state=await page.evaluate("""() => {const m=window.NutritionUIViewModel.refresh();return {ready:m.profile.ready,targets:m.metrics.map(x=>Number.isFinite(x.target)?x.target:null),advancedHidden:document.getElementById('needs_state').parentElement.hidden,expanded:document.getElementById('ivoryAdvancedProfileButton').getAttribute('aria-expanded'),status:document.getElementById('workspaceProfileStatusTitle')&&document.getElementById('workspaceProfileStatusTitle').textContent};}""")
    ok=state['ready'] and state['targets'][0] is not None and state['targets'][1] is not None and state['advancedHidden'] and state['expanded']=='false' and not errors
    await ctx.close();return result('collapsed-advanced-profile-still-calculates',ok,{'state':state,'errors':errors})

async def compact_search(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':390,'height':844});await base.go_ration(page)
    await page.fill('#globalSearchInput','творог');await page.wait_for_timeout(500)
    before=await page.evaluate("""() => ({all:document.querySelectorAll('#globalResults .search-result-card').length,visible:[...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>!x.hidden).length,more:!document.getElementById('ivorySearchMore').hidden})""")
    await page.click('#ivorySearchMore button');await page.wait_for_timeout(100)
    more=await page.evaluate("""() => ({visible:[...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>!x.hidden).length})""")
    await page.evaluate("() => window.NutritionTheme.set('modern',{persist:false})");await page.wait_for_timeout(100)
    modern=await page.evaluate("""() => ({visible:[...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>!x.hidden).length,controlHidden:document.getElementById('ivorySearchMore').hidden})""")
    ok=before['all']>8 and before['visible']==8 and before['more'] and more['visible']==16 and modern['visible']==before['all'] and modern['controlHidden'] and not errors
    await ctx.close();return result('compact-search-eight-then-show-more',ok,{'before':before,'afterMore':more,'modern':modern,'errors':errors})

async def print_simplifies_workspace(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':1440,'height':900});await base.go_ration(page);await page.emulate_media(media='print');await page.wait_for_timeout(100)
    state=await page.evaluate("""() => ({nav:getComputedStyle(document.getElementById('navigationShell')).display,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,hero:getComputedStyle(document.getElementById('ivoryRationHero')).display,dock:getComputedStyle(document.getElementById('ivoryQuickDock')).display,main:getComputedStyle(document.getElementById('mainContent')).display})""")
    ok=state['nav']=='none' and state['rail']=='none' and state['hero']=='none' and state['dock']=='none' and state['main']!='none' and not errors
    await ctx.close();return result('print-removes-navigation-and-decorative-shell',ok,{'state':state,'errors':errors})

async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:return await asyncio.gather(profile_disclosure(browser),truthful_targets_and_palette(browser),focus_reduced_motion(browser),tablet(browser),profile_calculation_with_collapsed_advanced(browser),compact_search(browser),print_simplifies_workspace(browser))
        finally:await browser.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6_ivory_extended_acceptance.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve();base.ROOT=ROOT
    cases=asyncio.run(run(a.chromium));out={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};p=ROOT/a.json_out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
