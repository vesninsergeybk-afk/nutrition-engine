#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta3-interaction-coherence'
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v6_beta3_analysis_continuity_acceptance as analysis_test
import v6_beta3_ivory_acceptance as ivory_test

def result(name,ok,details):return {'case':name,'passed':bool(ok),'details':details}

async def desktop_suite(browser,outdir):
    analysis_test.ROOT=ROOT;analysis_test.VERSION=VERSION
    analysis_test.profile_test.ROOT=ROOT;analysis_test.profile_test.VERSION=VERSION
    ctx,page,errors,added=await analysis_test.prepare(browser)
    await page.evaluate("() => document.querySelector('[data-theme-value=\"ivory-brass\"]')?.click()")
    await page.evaluate("() => document.querySelector('[data-workspace-view-mode=\"canvas\"]')?.click()")
    await page.evaluate("() => window.NavigationShellV1.navigate('ration')")
    await page.wait_for_function("document.documentElement.dataset.navigationRoute==='ration'",timeout=10000)
    await page.wait_for_timeout(650)
    cases=[]

    state=await page.evaluate(r'''() => {
      const detail=window.NutritionAnalysisWorkspaceHF7.getViewModel();
      const model=window.NutritionUIViewModel.get();
      const expected={}; for(const row of detail.nutrients){const k=row.group||'other';expected[k]=(expected[k]||0)+1;}
      const rows=[...document.querySelectorAll('#ivoryNutrientGroupList .ivory-nutrient-group-row')];
      return {
        release:window.__APP_BOOTSTRAP_META__.release,contract:model.analysis.nutrientGroupOverview,groups:model.analysis.nutrientGroups,expected,
        title:document.getElementById('ivoryNutrientGroupTitle')?.textContent.trim(),copy:document.querySelector('.ivory-group-overview-copy')?.textContent.replace(/\s+/g,' ').trim(),
        hasPseudoBalance:/БАЛАНС|Баланс\s*\d+\s*\/\s*\d+/.test(document.querySelector('.ivory-nutrient-orbit')?.textContent||''),center:[...document.querySelectorAll('#ivoryRadialChart text')].map(x=>x.textContent.trim()),
        legend:document.querySelector('.ivory-chart-legend')?.textContent.replace(/\s+/g,' ').trim(),
        listRows:rows.map(x=>{const s=getComputedStyle(x);return {key:x.dataset.ivoryNutrientGroup,aria:x.getAttribute('aria-label'),height:x.getBoundingClientRect().height,background:s.backgroundColor,color:s.color,fontSize:s.fontSize};}),
        ringButtons:[...document.querySelectorAll('#ivoryRadialChart [data-ivory-nutrient-group]')].map(x=>({key:x.dataset.ivoryNutrientGroup,role:x.getAttribute('role'),tabindex:x.getAttribute('tabindex'),aria:x.getAttribute('aria-label')}))
      };
    }''')
    groups=state['groups'];sums=all(g['target']+g['below']+g['review']+g['above']+g['unknown']==g['total'] for g in groups);counts=all(state['expected'].get(g['key'],0)==g['total'] for g in groups)
    semantic_ok=(state['release']==VERSION and state['contract'].get('contract')=='NutrientGroupOverview.v1' and state['contract'].get('purpose')=='navigation-summary' and state['title']=='Обзор по группам' and 'не новая итоговая оценка' in state['copy'] and not state['hasPseudoBalance'] and state['center']==['ОБЗОР','по группам'] and all(x in state['legend'] for x in ['Целевой диапазон','Ниже ориентира','Требует проверки','Выше предела','Не оценивается']) and sums and counts and len(state['listRows'])==len(groups) and all(r['height']>=44 and r['aria'] and 'Открыть' in r['aria'] and r['background']=='rgb(255, 253, 248)' and r['color']=='rgb(36, 37, 31)' for r in state['listRows']) and len(state['ringButtons'])==len(groups) and all(r['role']=='button' and r['tabindex']=='0' and r['aria'] for r in state['ringButtons']) and not errors)
    cases.append(result('transparent-navigation-summary-over-canonical-table',semantic_ok,{'state':state,'errors':errors,'added':added}))
    await page.screenshot(path=str(outdir/'beta2-group-overview-desktop.png'),full_page=False)

    classified=await page.evaluate(r'''() => {
      const api=window.NutritionAnalysisWorkspaceHF7,original=api.getViewModel;
      api.getViewModel=()=>({nutrients:[
        {group:'basic',status:{code:'ok',label:'Ориентир достигнут'}},{group:'basic',status:{code:'high',label:'Ниже ориентира'}},
        {group:'basic',status:{code:'medium',label:'Близко к верхнему пределу'}},{group:'basic',status:{code:'critical',label:'Выше верхнего предела'}},
        {group:'basic',status:{code:'info',label:'Справочный показатель'}},{group:'basic',status:{code:'high',label:'Выше ориентира'}}
      ]});
      const model=window.NutritionUIViewModel.refresh();api.getViewModel=original;window.NutritionUIViewModel.refresh();return model.analysis.nutrientGroups[0];
    }''')
    expected={'key':'basic','label':'Основные показатели','target':1,'below':1,'review':2,'above':1,'unknown':1,'total':6,'evaluated':5,'attention':4,'targetPercent':20}
    cases.append(result('status-semantics-do-not-confuse-rda-with-ul',classified==expected and not errors,{'group':classified,'errors':errors}))

    await page.click('#ivoryNutrientGroupList [data-ivory-nutrient-group="vitamins"]')
    await page.wait_for_function("document.documentElement.dataset.navigationRoute==='analysis/nutrients'",timeout=10000);await page.wait_for_timeout(450)
    nav=await page.evaluate(r'''() => ({route:document.documentElement.dataset.navigationRoute,filters:window.NutritionAnalysisWorkspaceHF7.getFilters(),pressed:[...document.querySelectorAll('[data-nutrient-group][aria-pressed="true"]')].map(x=>x.dataset.nutrientGroup),visible:[...document.querySelectorAll('#workspaceNutrientList .workspace-analysis-row__group')].map(x=>x.textContent.trim()),active:document.activeElement&&document.activeElement.id})''')
    nav_ok=nav['route']=='analysis/nutrients' and nav['filters']['nutrientFilter']=='all' and nav['filters']['nutrientGroup']=='vitamins' and nav['pressed']==['vitamins'] and nav['visible'] and all('Витамины' in x for x in nav['visible']) and nav['active']=='workspaceNutrientsTitle' and not errors
    cases.append(result('group-click-opens-filtered-full-table',nav_ok,{'state':nav,'errors':errors}))

    await page.evaluate("() => window.NavigationShellV1.navigate('ration')");await page.wait_for_function("document.documentElement.dataset.navigationRoute==='ration'",timeout=10000);await page.wait_for_timeout(400)
    ring=page.locator('#ivoryRadialChart [data-ivory-nutrient-group="minerals"]');await ring.focus();await page.keyboard.press('Enter')
    await page.wait_for_function("document.documentElement.dataset.navigationRoute==='analysis/nutrients'",timeout=10000);await page.wait_for_timeout(450)
    keynav=await page.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,filters:window.NutritionAnalysisWorkspaceHF7.getFilters()})")
    cases.append(result('svg-ring-keyboard-navigation',keynav['route']=='analysis/nutrients' and keynav['filters']['nutrientFilter']=='all' and keynav['filters']['nutrientGroup']=='minerals' and not errors,{'state':keynav,'errors':errors}))
    await ctx.close();return cases

async def mobile_case(browser,outdir):
    ivory_test.ROOT=ROOT;ivory_test.VERSION=VERSION
    ctx,page,_,errors=await ivory_test.open_page(browser,{'width':390,'height':844},'theme=ivory-brass&noautov=1')
    await page.evaluate("() => window.NavigationShellV1.navigate('analysis/overview')");await page.wait_for_function("document.documentElement.dataset.navigationRoute==='analysis/overview'",timeout=10000);await page.wait_for_timeout(400)
    before=await page.evaluate(r'''() => {const h=document.querySelector('#ivoryMobileGroupOverview [data-ivory-route]'),hs=h?getComputedStyle(h):null;return {layout:document.documentElement.dataset.workspaceLayout,card:getComputedStyle(document.getElementById('ivoryMobileGroupOverview')).display,rail:getComputedStyle(document.getElementById('ivoryInsightRail')).display,rows:[...document.querySelectorAll('#ivoryMobileNutrientGroupList button')].map(x=>x.getBoundingClientRect().height),headButton:hs?{background:hs.backgroundColor,color:hs.color}:null,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};}''')
    await page.locator('#ivoryMobileGroupOverview').scroll_into_view_if_needed();await page.wait_for_timeout(180)
    await page.screenshot(path=str(outdir/'beta2-group-overview-mobile.png'),full_page=False)
    await page.click('#ivoryMobileNutrientGroupList [data-ivory-nutrient-group="minerals"]');await page.wait_for_function("document.documentElement.dataset.navigationRoute==='analysis/nutrients'",timeout=10000);await page.wait_for_timeout(450)
    after=await page.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,filters:window.NutritionAnalysisWorkspaceHF7.getFilters(),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth})")
    ok=before['layout']=='sections' and before['card']=='grid' and before['rail']=='none' and len(before['rows'])>=4 and all(x>=44 for x in before['rows']) and before['headButton'] and before['headButton']['background']=='rgb(255, 253, 248)' and before['headButton']['color']=='rgb(65, 69, 29)' and before['overflow']<=1 and after['route']=='analysis/nutrients' and after['filters']['nutrientGroup']=='minerals' and after['filters']['nutrientFilter']=='all' and after['overflow']<=1 and not errors
    await ctx.close();return result('mobile-keeps-sequential-text-first-navigation',ok,{'before':before,'after':after,'errors':errors})

async def run(chromium,outdir):
    async with async_playwright() as p:
      browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
      try:
        cases=await desktop_suite(browser,outdir);cases.append(await mobile_case(browser,outdir));return cases
      finally:await browser.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/v6-beta3-nutrient-group-acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots');a=ap.parse_args();ROOT=Path(a.app_root).resolve();outdir=ROOT/a.screenshots;outdir.mkdir(parents=True,exist_ok=True)
    cases=asyncio.run(run(a.chromium,outdir));payload={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};out=ROOT/a.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(payload,ensure_ascii=False,indent=2));raise SystemExit(0 if payload['ok'] else 1)
if __name__=='__main__':main()
