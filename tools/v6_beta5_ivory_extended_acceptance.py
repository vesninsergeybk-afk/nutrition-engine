#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
import v6_beta5_ivory_acceptance as base
ROOT=Path(__file__).resolve().parents[1]
VERSION=base.VERSION

def result(name,ok,details):return {'case':name,'passed':bool(ok),'details':details}

async def profile_disclosure(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':390,'height':844})
    await page.wait_for_selector('#profilePreferencesSection > summary')
    before=await page.evaluate("""() => ({
      preferencesOpen:document.getElementById('profilePreferencesSection').open,
      advancedOpen:document.getElementById('profileAdvancedSection').open,
      preferenceVisible:document.getElementById('needs_goal').checkVisibility(),
      advancedVisible:document.getElementById('needs_state').checkVisibility(),
      basicVisible:document.getElementById('needs_age').getClientRects().length>0,
      stateParent:document.getElementById('needs_state').parentElement
    })""")
    before.pop('stateParent',None)
    await page.click('#profilePreferencesSection > summary');await page.click('#profileAdvancedSection > summary');await page.wait_for_timeout(100)
    opened=await page.evaluate("""() => ({
      preferencesOpen:document.getElementById('profilePreferencesSection').open,
      advancedOpen:document.getElementById('profileAdvancedSection').open,
      preferenceVisible:document.getElementById('needs_goal').checkVisibility(),
      advancedVisible:document.getElementById('needs_state').checkVisibility()
    })""")
    await page.evaluate("() => window.NutritionTheme.set('modern',{persist:false})");await page.wait_for_timeout(100)
    modern=await page.evaluate("""() => ({
      theme:document.documentElement.dataset.theme,
      preferencesOpen:document.getElementById('profilePreferencesSection').open,
      advancedOpen:document.getElementById('profileAdvancedSection').open,
      preferenceVisible:document.getElementById('needs_goal').checkVisibility(),
      advancedVisible:document.getElementById('needs_state').checkVisibility(),
      hierarchy:!!window.NutritionProfileHierarchyV2
    })""")
    ok=(before=={'preferencesOpen':False,'advancedOpen':False,'preferenceVisible':False,'advancedVisible':False,'basicVisible':True}
        and opened=={'preferencesOpen':True,'advancedOpen':True,'preferenceVisible':True,'advancedVisible':True}
        and modern['theme']=='modern' and modern['preferencesOpen'] and modern['advancedOpen']
        and modern['preferenceVisible'] and modern['advancedVisible'] and modern['hierarchy'] and not errors)
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
    state=await page.evaluate("""() => {const e=document.activeElement,cs=getComputedStyle(e),b=document.querySelector('#profileAdvancedSection > summary'),bs=getComputedStyle(b);return {tag:e.tagName,tab:e.getAttribute('tabindex'),box:cs.boxShadow,outline:cs.outlineStyle,motion:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:bs.transitionDuration,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};}""")
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
    await page.select_option('#needs_sex','female');await page.fill('#needs_h','168');await page.fill('#needs_w','62');await page.fill('#needs_age','35');await page.select_option('#needs_activity','moderate')
    await page.wait_for_function("!document.getElementById('profileCalculateContinue').disabled",timeout=5000)
    await page.click('#profileCalculateContinue');await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=10000);await page.wait_for_timeout(150)
    state=await page.evaluate("""() => {const m=window.NutritionUIViewModel.refresh();return {
      ready:m.profile.ready,
      targets:m.metrics.map(x=>Number.isFinite(x.target)?x.target:null),
      advancedOpen:document.getElementById('profileAdvancedSection').open,
      advancedVisible:document.getElementById('needs_state').checkVisibility(),
      calculationState:document.documentElement.dataset.profileCalculationState,
      status:document.getElementById('workspaceProfileStatusTitle')&&document.getElementById('workspaceProfileStatusTitle').textContent
    };}""")
    ok=state['ready'] and state['targets'][0] is not None and state['targets'][1] is not None and not state['advancedOpen'] and not state['advancedVisible'] and state['calculationState']=='current' and not errors
    await ctx.close();return result('collapsed-advanced-profile-still-calculates',ok,{'state':state,'errors':errors})

async def compact_search(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':390,'height':844});await base.go_ration(page)
    await page.fill('#globalSearchInput','творог')
    await page.wait_for_function("""() => {
      const cards=[...document.querySelectorAll('#globalResults .search-result-card')];
      const control=document.getElementById('ivorySearchMore');
      return cards.length>8 && cards.filter(x=>getComputedStyle(x).display!=='none').length===8 && control && !control.hidden;
    }""",timeout=5000)
    before=await page.evaluate("""() => ({all:document.querySelectorAll('#globalResults .search-result-card').length,visible:[...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>getComputedStyle(x).display!=='none').length,more:!document.getElementById('ivorySearchMore').hidden})""")
    await page.click('#ivorySearchMore button')
    await page.wait_for_function("""() => [...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>getComputedStyle(x).display!=='none').length===16""",timeout=5000)
    more=await page.evaluate("""() => ({visible:[...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>getComputedStyle(x).display!=='none').length})""")
    await page.evaluate("() => window.NutritionTheme.set('modern',{persist:false})");await page.wait_for_timeout(100)
    modern=await page.evaluate("""() => ({all:document.querySelectorAll('#globalResults .search-result-card').length,visible:[...document.querySelectorAll('#globalResults .search-result-card')].filter(x=>getComputedStyle(x).display!=='none').length,controlHidden:document.getElementById('ivorySearchMore').hidden})""")
    ok=before['all']>8 and before['visible']==8 and before['more'] and more['visible']==16 and modern['visible']==modern['all'] and modern['all']>=before['all'] and modern['controlHidden'] and not errors
    await ctx.close();return result('compact-search-eight-then-show-more',ok,{'before':before,'afterMore':more,'modern':modern,'errors':errors})

async def print_simplifies_workspace(browser):
    ctx,page,_,errors=await base.open_page(browser,{'width':1440,'height':900});await base.go_ration(page);await page.emulate_media(media='print');await page.wait_for_timeout(100)
    state=await page.evaluate("""() => ({nav:getComputedStyle(document.getElementById('navigationShell')).display,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,hero:getComputedStyle(document.getElementById('ivoryRationHero')).display,dock:getComputedStyle(document.getElementById('ivoryQuickDock')).display,main:getComputedStyle(document.getElementById('mainContent')).display})""")
    ok=state['nav']=='none' and state['rail']=='none' and state['hero']=='none' and state['dock']=='none' and state['main']!='none' and not errors
    await ctx.close();return result('print-removes-navigation-and-decorative-shell',ok,{'state':state,'errors':errors})

CASE_FUNCTIONS={
    'disclosure':profile_disclosure,
    'truthful':truthful_targets_and_palette,
    'focus':focus_reduced_motion,
    'tablet':tablet,
    'calculation':profile_calculation_with_collapsed_advanced,
    'search':compact_search,
    'print':print_simplifies_workspace,
}
async def run(chromium,selected=None):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            cases=[]
            for name in (selected or list(CASE_FUNCTIONS)):
                cases.append(await CASE_FUNCTIONS[name](browser))
            return cases
        finally:await browser.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta5-ivory-extended-acceptance.json');ap.add_argument('--case',action='append',choices=list(CASE_FUNCTIONS));a=ap.parse_args();ROOT=Path(a.app_root).resolve();base.ROOT=ROOT
    cases=asyncio.run(run(a.chromium,a.case));out={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};p=ROOT/a.json_out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
