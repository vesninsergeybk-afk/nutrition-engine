#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
import hf28_gemini_reliability_acceptance as m

async def run_case(name:str):
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            fn={
                'photo':lambda:m.photo_one_click(browser),
                'voice':lambda:m.success_visible(browser),
                'policy':lambda:m.success_visible(browser,True),
                'denied':lambda:m.denied_visible(browser),
                'hanging':lambda:m.hanging_watchdog(browser),
                'repeated':lambda:m.repeated_click_visible(browser),
                'native':lambda:m.native_fallback(browser),
            }[name]
            return await asyncio.wait_for(fn(),timeout=160)
        finally:
            await browser.close()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('case');ap.add_argument('--out',required=True);a=ap.parse_args()
    result=asyncio.run(run_case(a.case));Path(a.out).parent.mkdir(parents=True,exist_ok=True);Path(a.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result.get('passed') else 1)
if __name__=='__main__':main()
