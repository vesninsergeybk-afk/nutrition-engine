#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
import hf28_gemini_reliability_acceptance as hf
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta5-cross-stage-hardening'

async def beta4_open_ration(page):
    await page.wait_for_function("window.__RUNTIME_LOADER_CLOSED__===true",timeout=45000)
    await page.select_option('#needs_sex','female')
    await page.fill('#needs_age','35')
    await page.fill('#needs_h','168')
    await page.fill('#needs_w','62')
    await page.select_option('#needs_activity','low')
    await page.wait_for_function("!document.getElementById('profileCalculateContinue').disabled",timeout=5000)
    await page.click('#profileCalculateContinue')
    await page.wait_for_function('window.__lastNeedsProfileApplied===true',timeout=10000)
    await page.wait_for_function("document.documentElement.getAttribute('data-navigation-route')==='ration'",timeout=10000)
    await page.locator('[data-ration-entry-method="voice"]').scroll_into_view_if_needed()

CASE_FUNCTIONS={
    'photo':lambda b:hf.photo_one_click(b),
    'voice':lambda b:hf.success_visible(b),
    'policy':lambda b:hf.success_visible(b,True),
    'denied':lambda b:hf.denied_visible(b),
    'hanging':lambda b:hf.hanging_watchdog(b),
    'repeated':lambda b:hf.repeated_click_visible(b),
    'native':lambda b:hf.native_fallback(b),
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
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta5-gemini-media-acceptance.json');ap.add_argument('--case',action='append',choices=list(CASE_FUNCTIONS));a=ap.parse_args();ROOT=Path(a.app_root).resolve();hf.ROOT=ROOT;hf.VERSION=VERSION;hf.open_ration=beta4_open_ration
    cases=asyncio.run(run(a.chromium,a.case));out={'ok':all(x.get('passed') for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};p=ROOT/a.json_out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
