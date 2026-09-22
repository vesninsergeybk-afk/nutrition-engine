#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, importlib.util, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf18'
SPEC=importlib.util.spec_from_file_location('hf17_runner',ROOT/'tools/stage_5a_stability_chromium.py')
base=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(base)
base.CFG_PATH=ROOT/'config/runtime-assets.v5.3.210-rc2.json'
base.BUNDLE=ROOT/'assets/css/runtime-bundle-v5.3.210-rc2-hf18.css'

def counter_script(name):
    return """name=>{window[name]=[];const old=window[name+'Observer'];if(old)old.disconnect();const o=new MutationObserver(list=>list.forEach(m=>window[name].push({type:m.type,attribute:m.attributeName,target:m.target.id||m.target.tagName})));o.observe(document.documentElement,{subtree:true,attributes:true,childList:true,characterData:true});window[name+'Observer']=o;}"""
async def take(page,name):
    return await page.evaluate("name=>{const a=window[name]||[];window[name]=[];return a;}",name)
async def main_async(args):
    contract=json.loads((ROOT/'quality/stage-5a-final-stability-contract.json').read_text(encoding='utf-8'))
    t=contract['stability_targets']
    result={'schema_version':1,'release_version':VERSION,'stage':'5A-SF','engine':'system Chromium','executable':args.chromium,'checks':{},'errors':[],'limitations':['Firefox and WebKit binaries are unavailable in this managed environment.','TalkBack, VoiceOver and the real hosting URL still require external review.']}
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        page,errors=await base.new_page(browser);result['errors'].extend(errors)
        await page.wait_for_timeout(max(0,t['startup_settle_ms']-450))
        await page.evaluate(counter_script('__fullDocument'))
        await page.wait_for_timeout(t['full_document_observation_ms'])
        full=await take(page,'__fullDocument')
        result['checks']['full_document_quiescence']={'observation_ms':t['full_document_observation_ms'],'mutations':len(full),'budget':t['full_document_mutations_max'],'sample':full[:20],'passed':len(full)<=t['full_document_mutations_max']}

        await page.evaluate(counter_script('__idempotentModules'))
        calls=t['profile_norm_refresh_calls']
        await page.evaluate("calls=>{for(let i=0;i<calls;i++){NutritionWorkspaceProfileHF8.refresh();__NORM_REGION_CLARITY_V53129__.sync();__NORM_REGION_CLARITY_V53129__.renderComparison();}}",calls)
        await page.wait_for_timeout(500)
        idem=await take(page,'__idempotentModules')
        result['checks']['profile_norm_idempotence']={'calls':calls,'mutations':len(idem),'budget':t['profile_norm_refresh_mutations_max'],'sample':idem[:20],'passed':len(idem)<=t['profile_norm_refresh_mutations_max']}

        desired=await page.locator('#v40NeedsStatus').text_content()
        await page.evaluate(counter_script('__profileRepair'))
        await page.locator('#v40NeedsStatus').evaluate("el=>{el.textContent='EXTERNAL DRIFT';}")
        await page.wait_for_timeout(180)
        repaired=await page.locator('#v40NeedsStatus').text_content()
        repair_mut=await take(page,'__profileRepair')
        await page.wait_for_timeout(500);repair_settle=await take(page,'__profileRepair')
        result['checks']['profile_observer_repair']={'desired':desired,'repaired':repaired,'repair_mutations':len(repair_mut),'post_repair_mutations':len(repair_settle),'passed':repaired==desired and len(repair_settle)<=t['post_repair_mutations_max']}

        before=await page.locator('#normComparisonProfile').text_content()
        await page.evaluate(counter_script('__normInput'))
        await page.locator('#needs_age').fill('55');await page.locator('#needs_age').dispatch_event('input');await page.wait_for_timeout(200)
        after=await page.locator('#normComparisonProfile').text_content();norm_mut=await take(page,'__normInput')
        await page.wait_for_timeout(700);norm_settle=await take(page,'__normInput')
        result['checks']['norm_input_refresh']={'before':before,'after':after,'mutations':len(norm_mut),'post_settle_mutations':len(norm_settle),'passed':before!=after and '55' in (after or '') and len(norm_settle)<=t['post_repair_mutations_max']}
        await page.close()

        # Re-run the previous navigation stability evidence against the HF18 runtime.
        nav,errors=await base.new_page(browser,'https://local.test/index.html?campaign=stability');result['errors'].extend(errors)
        await base.install_mutation_counter(nav)
        await nav.wait_for_timeout(1200);steady=await base.read_reset(nav)
        for route in base.ROUTES:
            await nav.evaluate('(r)=>NavigationShellV1.navigate(r)',route)
        await nav.wait_for_timeout(300);transition_mutations=await base.read_reset(nav)
        await nav.wait_for_timeout(1000);post_settle=await base.read_reset(nav)
        result['checks']['previous_navigation_stability']={'managed_mutations_steady':steady,'managed_mutations_during_routes':transition_mutations,'managed_mutations_post_settle':post_settle,'passed':steady<=2 and transition_mutations<=15*len(base.ROUTES) and post_settle<=2}
        await nav.close();await browser.close()
    result['passed']=all(v.get('passed') for v in result['checks'].values()) and not result['errors']
    out=ROOT/args.json_out;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':result['passed'],'checks':{k:v.get('passed') for k,v in result['checks'].items()},'errors':result['errors'],'report':str(out.relative_to(ROOT))},ensure_ascii=False,indent=2))
    return 0 if result['passed'] else 1

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--json-out',default='reports/stage-5a-final-stability-chromium.json');args=ap.parse_args();raise SystemExit(asyncio.run(main_async(args)))
if __name__=='__main__':main()
