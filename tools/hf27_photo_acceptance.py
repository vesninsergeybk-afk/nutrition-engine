#!/usr/bin/env python3
from __future__ import annotations
import argparse,asyncio,base64,importlib.util,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-rc2-hf27-microphone-resilience'
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M9Qz0AEYBxVSFUAAN0ABfXgl7QAAAAASUVORK5CYII=')

def load_helpers():
 spec=importlib.util.spec_from_file_location('helpers',Path(__file__).resolve().parent/'hf27_microphone_resilience_acceptance.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.ROOT=ROOT;return m
async def run(chromium):
 m=load_helpers()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx,page,errors,requests=await m.base_case(browser)
  before=await page.evaluate("() => ({media:!!window.NutritionGeminiRationImport,bridge:!!window.NutritionMediaEntryBridge})")
  fixture=Path('/tmp/hf27-media-test.png');fixture.write_bytes(PNG)
  async with page.expect_file_chooser(timeout=5000) as info:await page.locator('[data-ration-entry-method="photo"]').click()
  chooser=await info.value;await chooser.set_files(str(fixture))
  await page.wait_for_function("window.NutritionGeminiRationImport&&window.NutritionGeminiRationImport.getMedia().length===1&&window.NutritionGeminiRationImport.getMedia()[0].preparationState==='ready'",timeout=20000)
  state=await page.evaluate("""() => ({media:window.NutritionGeminiRationImport.getMedia().map(x=>({kind:x.kind,source:x.source,state:x.preparationState,size:x.preparedSize||x.file.size})),topHidden:document.getElementById('workspaceMediaEntryStatus').hidden,topText:document.getElementById('workspaceMediaEntryStatusText').textContent,lazyScripts:document.querySelectorAll('script[data-gemini-media-lazy-module]').length,release:window.__APP_BOOTSTRAP_META__.release})""")
  passed=before['bridge'] and not before['media'] and state['release']==VERSION and state['lazyScripts']==1 and state['media'][0]['kind']=='image' and state['media'][0]['state']=='ready' and not state['topHidden'] and 'фотограф' in state['topText'].lower() and not errors
  result={'ok':passed,'release_version':VERSION,'case':'photo-one-click-prepared-visible','before':before,'state':state,'errors':errors,'mediaRequests':sum('62-gemini-ration-import-v5.js' in x for x in requests)}
  await ctx.close();await browser.close();return result
def main():
 global ROOT
 ap=argparse.ArgumentParser();ap.add_argument('--chromium',default='/usr/bin/chromium');ap.add_argument('--app-root',default=str(ROOT));ap.add_argument('--json-out');a=ap.parse_args();ROOT=Path(a.app_root).resolve();r=asyncio.run(run(a.chromium))
 if a.json_out:
  p=Path(a.json_out);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(r,ensure_ascii=False,indent=2));raise SystemExit(0 if r['ok'] else 1)
if __name__=='__main__':main()
