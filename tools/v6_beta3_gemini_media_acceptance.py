#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
import hf28_gemini_reliability_acceptance as hf
ROOT=Path(__file__).resolve().parents[1]
VERSION='v6.0.0-beta3-interaction-coherence'
async def run(chromium):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            return await asyncio.gather(
                hf.photo_one_click(browser),hf.success_visible(browser),hf.success_visible(browser,True),
                hf.denied_visible(browser),hf.hanging_watchdog(browser),hf.repeated_click_visible(browser),hf.native_fallback(browser)
            )
        finally:await browser.close()
def main():
    global ROOT
    ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out',default='reports/v6-beta3-gemini-media-acceptance.json');a=ap.parse_args();ROOT=Path(a.app_root).resolve();hf.ROOT=ROOT;hf.VERSION=VERSION
    cases=asyncio.run(run(a.chromium));out={'ok':all(x.get('passed') for x in cases),'release_version':VERSION,'assertions':len(cases),'cases':cases};p=ROOT/a.json_out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['ok'] else 1)
if __name__=='__main__':main()
