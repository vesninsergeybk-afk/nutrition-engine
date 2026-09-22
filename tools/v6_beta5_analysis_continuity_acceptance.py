#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta5-cross-stage-hardening'
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v6_beta5_profile_acceptance as profile_test

def case(name,ok,details): return {'case':name,'passed':bool(ok),'details':details}

async def prepare(browser):
    profile_test.ROOT=ROOT
    ctx,page,errors=await profile_test.make_context(browser,{'width':1440,'height':900})
    await profile_test.load(page)
    await page.select_option('#needs_sex','female')
    await page.fill('#needs_h','168')
    await page.fill('#needs_w','63.5')
    await page.fill('#needs_age','37')
    await page.select_option('#needs_activity','moderate')
    await page.click('#profileCalculateContinue')
    await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=15000)
    added=await page.evaluate("""() => {
      const xs=(window.DB&&window.DB.items)||[], used=new Set(), picks=[];
      const tests=[
        ['fruit',p=>(+p.whole_fruit_cup_eq_per_100g||+p.fruit_cup_eq_per_100g)>0],
        ['vegetable',p=>(+p.veg_cup_eq_per_100g||+p.greens_beans_cup_eq_per_100g)>0],
        ['whole_grain',p=>(+p.whole_grain_oz_eq_per_100g||+p.whole_grains_oz_eq_per_100g)>0],
        ['protein',p=>(+p.seafood_plant_oz_eq_per_100g||+p.protein_oz_eq_per_100g)>0],
        ['dairy',p=>(+p.dairy_cup_eq_per_100g)>0]
      ];
      for(const [group,test] of tests){const p=xs.find(x=>x&&x.key&&!used.has(x.key)&&test(x));if(p){used.add(p.key);State.add(p.key,group==='dairy'?200:150);picks.push({group,key:p.key,name:p.name_ru||p.name})}}
      if(picks.length<3){for(const p of xs){if(p&&p.key&&!used.has(p.key)){used.add(p.key);State.add(p.key,120);picks.push({group:'fallback',key:p.key,name:p.name_ru||p.name});if(picks.length>=5)break}}}
      return picks;
    }""")
    await page.wait_for_function('window.State.get().length>=3',timeout=10000)
    await page.wait_for_function('window.__lastHEIModel&&window.__lastHEIModel.valid===true&&Number.isFinite(Number(window.__lastHEIModel.total))',timeout=20000)
    await page.wait_for_function("document.querySelectorAll('#heiTableBody tr').length>=10",timeout=10000)
    await page.wait_for_timeout(800)
    return ctx,page,errors,added

async def run(chromium,outdir):
    async with async_playwright() as p:
      browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
      try:
        ctx,page,errors,added=await prepare(browser)
        data=await page.evaluate(r"""() => {
          const txt=id=>(document.getElementById(id)?.textContent||'').replace(/\s+/g,' ').trim();
          const model=window.__lastHEIModel||{};
          const report=window.NutritionReportV5&&window.NutritionReportV5.buildReportModel({force:true});
          const reportHtml=window.NutritionReportV5&&window.NutritionReportV5.buildReportHtml(report||undefined);
          return {
            release:window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release,
            rationCount:window.State.get().length,
            totalText:txt('totalsSection'),
            nutrientCards:document.getElementById('totalsGrid')?.children.length||0,microRows:document.querySelectorAll('#microsGroups .micro-row, #microsGroups tr, #microsGroups [data-nutrient]').length,
            hei:{valid:model.valid===true,total:Number(model.total),grade:model.grade||'',rows:document.querySelectorAll('#heiTableBody tr').length,summary:txt('heiSummary')},
            diet:{text:txt('dietAnalysisProfilePanel'),model:!!window.__lastDietAnalysisProfile},
            harvard:{text:txt('strictHarvardPlateDetails'),panel:!!document.getElementById('harvardPlatePanel')},
            report:{section:txt('globalActions'),model:!!report,htmlLength:(reportHtml||'').length,containsHEI:/HEI/i.test(reportHtml||''),containsHarvard:/Гарвард/i.test(reportHtml||''),containsNeeds:/потребност|энерги/i.test(reportHtml||'')},
            feature:window.NutritionFeatureContinuityV1.audit(),
            viewModel:window.NutritionUIViewModel.get()
          };
        }""")
        await page.evaluate("() => {const b=document.querySelector('[data-workspace-view-mode=sections]');if(b)b.click();}"); await page.wait_for_timeout(250)
        await page.evaluate("() => window.NavigationShellV1.navigate('analysis/hei')")
        await page.wait_for_function("document.documentElement.dataset.navigationRoute==='analysis/hei'",timeout=10000)
        analysis_route=await page.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,visible:getComputedStyle(document.getElementById('workspaceHeiPanel')).display,summary:document.getElementById('heiSummary').textContent.trim()})")
        await page.evaluate("() => window.NavigationShellV1.navigate('report')")
        await page.wait_for_function("document.documentElement.dataset.navigationRoute==='report'",timeout=10000)
        report_route=await page.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,visible:getComputedStyle(document.getElementById('workspaceReportPanel')).display,buttons:[...document.querySelectorAll('#workspaceReportPanel button')].map(x=>x.textContent.trim())})")
        await page.screenshot(path=str(outdir/'beta1-analysis-continuity-desktop.png'),full_page=False)
        checks=[]
        checks.append(case('nutrient-summary-populated',data['rationCount']>=3 and len(data['totalText'])>250 and ('Энергия' in data['totalText']) and data['nutrientCards']>=4 and len(data['totalText'])>1000,{'rationCount':data['rationCount'],'nutrientCards':data['nutrientCards'],'microRows':data['microRows'],'textSample':data['totalText'][:300]}))
        checks.append(case('hei-model-table-and-route-functional',data['hei']['valid'] and 0<=data['hei']['total']<=100 and data['hei']['rows']>=10 and 'HEI' in data['hei']['summary'] and analysis_route['route']=='analysis/hei' and analysis_route['visible']!='none',{'hei':data['hei'],'route':analysis_route}))
        checks.append(case('integrated-diet-profile-populated',data['diet']['model'] and len(data['diet']['text'])>250 and ('Итог профиля' in data['diet']['text'] or 'Качество' in data['diet']['text']),data['diet']))
        checks.append(case('harvard-plate-populated',data['harvard']['panel'] and len(data['harvard']['text'])>250 and 'Гарвард' in data['harvard']['text'],data['harvard']))
        checks.append(case('full-report-builds-with-analysis',data['report']['model'] and data['report']['htmlLength']>5000 and data['report']['containsHEI'] and data['report']['containsHarvard'] and data['report']['containsNeeds'] and report_route['route']=='report' and report_route['visible']!='none' and len(report_route['buttons'])>=2,{'report':data['report'],'route':report_route}))
        checks.append(case('feature-contract-complete',data['release']==VERSION and data['feature']['ok'] and data['viewModel'].get('contract')=='NutritionUIViewModel.v1' and not errors,{'feature':data['feature'],'errors':errors,'added':added}))
        await ctx.close()
        return checks
      finally: await browser.close()

def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/v6-beta5-analysis-continuity.json');ap.add_argument('--screenshots',default='reports/screenshots');ns=ap.parse_args();ROOT=Path(ns.app_root).resolve();profile_test.ROOT=ROOT;outdir=ROOT/ns.screenshots;outdir.mkdir(parents=True,exist_ok=True)
    cases=asyncio.run(run(ns.chromium,outdir));result={'ok':all(x['passed'] for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases}
    out=ROOT/ns.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
