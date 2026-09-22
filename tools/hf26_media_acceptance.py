#!/usr/bin/env python3
from __future__ import annotations
import asyncio,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import hf26_full_acceptance_chromium as full
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 full.ROOT=ROOT
 cases=[]
 async with async_playwright() as p:
  for name,fn in [('photo',full.photo_case),('voice',lambda b:full.voice_case(b,False)),('denied',lambda b:full.voice_case(b,True))]:
   b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   try:cases.append(await asyncio.wait_for(fn(b),timeout=60))
   finally:await b.close()
 result={'ok':all(x.get('passed') for x in cases),'cases':cases}
 (ROOT/'reports/hf26-media-acceptance.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':asyncio.run(main())
