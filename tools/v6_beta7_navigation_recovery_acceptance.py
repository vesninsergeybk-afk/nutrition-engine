#!/usr/bin/env python3
from __future__ import annotations
import argparse, asyncio, json, mimetypes
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.async_api import async_playwright
VERSION='v6.0.0-beta7-navigation-recovery'

def mime(p:Path)->str:
    if p.suffix=='.gz': return 'application/gzip'
    return mimetypes.guess_type(p.name)[0] or 'application/octet-stream'

async def main_async(root:Path,out:Path,screenshot_dir:Path):
    rows=[]
    def add(name,ok,detail=None): rows.append({'name':name,'ok':bool(ok),'detail':detail})
    screenshot_dir.mkdir(parents=True,exist_ok=True)
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        async def open_page(width,height,query='?theme=ivory-brass&noautov=1'):
            ctx=await browser.new_context(viewport={'width':width,'height':height},bypass_csp=True)
            async def handler(r,req):
                rel=unquote(urlparse(req.url).path).lstrip('/') or 'index.html';fp=(root/rel).resolve()
                try: fp.relative_to(root)
                except Exception:return await r.fulfill(status=403,body='forbidden')
                if fp.is_file():return await r.fulfill(status=200,path=str(fp),content_type=mime(fp))
                return await r.fulfill(status=404,body='missing '+rel)
            await ctx.route('https://app.test/**',handler)
            p=await ctx.new_page();errors=[]
            p.on('pageerror',lambda e: errors.append(str(e)))
            html=(root/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1).replace("window.location.search||''",repr(query),1)
            await p.set_content(html,wait_until='domcontentloaded',timeout=30000)
            await p.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=70000)
            await p.wait_for_function('window.NutritionNavigationRecoveryV1 && document.querySelector("#primaryDisplayControls")',timeout=15000)
            if 'theme=ivory-brass' in query:
                await p.evaluate("() => window.NutritionTheme && NutritionTheme.set('ivory-brass',{persist:false})")
            await p.wait_for_timeout(500)
            return ctx,p,errors

# Mobile: controls and both modes.
        ctx,p,errors=await open_page(390,844)
        mobile=await p.evaluate("""() => {const q=s=>document.querySelector(s),vis=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};return {release:window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release,controls:vis(q('#primaryDisplayControls')),themeButtons:[...document.querySelectorAll('#primaryDisplayControls [data-theme-value]')].map(x=>({v:x.dataset.themeValue,visible:vis(x)})),viewButtons:[...document.querySelectorAll('#primaryDisplayControls [data-primary-view-mode]')].map(x=>({v:x.dataset.primaryViewMode,disabled:x.disabled,visible:vis(x)})),needs:vis(q('[data-primary-needs-route="1"]')),navItems:[...document.querySelectorAll('#navigationShell .navigation-shell__items [data-navshell-route]')].filter(vis).map(x=>x.getAttribute('data-navshell-route')),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};}""")
        add('mobile exposes three-theme selector',mobile['release']==VERSION and mobile['controls'] and len(mobile['themeButtons'])==3 and all(x['visible'] for x in mobile['themeButtons']),mobile)
        add('mobile canvas control is enabled',len(mobile['viewButtons'])==2 and all(x['visible'] and not x['disabled'] for x in mobile['viewButtons']),mobile)
        add('mobile primary navigation includes needs',mobile['needs'] and mobile['navItems'][0]=='profile' and len(mobile['navItems'])==5,mobile)
        add('mobile recovery has no overflow or runtime errors',mobile['overflow']<=1 and not errors,{'state':mobile,'errors':errors})
        # theme switching
        themes=[]
        for val in ('modern','retro-2bit','ivory-brass'):
            await p.click(f'#primaryDisplayControls [data-theme-value="{val}"]');await p.wait_for_timeout(120)
            themes.append(await p.evaluate("""() => { const theme=document.documentElement.dataset.theme; const b=document.querySelector(`#primaryDisplayControls [data-theme-value="${theme}"]`); return {theme,selected:b&&b.getAttribute('aria-pressed')}; }"""))
        add('all three themes switch on mobile',all(x['selected']=='true' for x in themes) and [x['theme'] for x in themes]==['modern','retro-2bit','ivory-brass'],themes)
        # canvas and back
        await p.click('#primaryDisplayControls [data-primary-view-mode="canvas"]');await p.wait_for_timeout(350)
        canvas=await p.evaluate("() => ({mode:document.documentElement.dataset.navigationShell,view:document.documentElement.dataset.primaryView,layout:document.documentElement.dataset.workspaceLayout,controls:!!document.querySelector('#primaryDisplayControls')&&getComputedStyle(document.querySelector('#primaryDisplayControls')).display!=='none',banner:document.querySelector('#navigationShellLongReturn strong')?.textContent.trim(),copy:document.querySelector('#navigationShellLongReturn span')?.textContent.trim()})")
        add('mobile canvas opens a real continuous page',canvas['mode']=='long' and canvas['view']=='canvas' and canvas['controls'] and canvas['banner']=='Режим «Полотно»',canvas)
        await p.click('#primaryDisplayControls [data-primary-view-mode="sections"]');await p.wait_for_timeout(350)
        sections=await p.evaluate("() => ({mode:document.documentElement.dataset.navigationShell,view:document.documentElement.dataset.primaryView,layout:document.documentElement.dataset.workspaceLayout})")
        add('mobile returns from canvas to sections',sections['mode']=='workspace' and sections['view']=='sections' and sections['layout']=='sections',sections)
        await p.screenshot(path=str(screenshot_dir/'beta7-mobile-navigation-recovery.png'),full_page=False)
        await ctx.close()

# Desktop: Ivory spatial canvas and theme independence.
        ctx,p,errors=await open_page(1440,900)
        await p.click('#primaryDisplayControls [data-primary-view-mode="canvas"]',timeout=10000);await p.wait_for_timeout(300)
        desktop=await p.evaluate("""() => ({theme:document.documentElement.dataset.theme,mode:document.documentElement.dataset.navigationShell,view:document.documentElement.dataset.primaryView,layout:document.documentElement.dataset.workspaceLayout,controls:document.querySelector('#primaryDisplayControls')?.getBoundingClientRect().toJSON(),needs:document.querySelector('[data-primary-needs-route="1"]')?.textContent.trim(),errors:window.__APP_BOOTSTRAP_META__})""")
        add('desktop Ivory canvas is spatial workspace',desktop['theme']=='ivory-brass' and desktop['mode']=='workspace' and desktop['view']=='canvas' and desktop['layout']=='canvas',desktop)
        await p.click('#primaryDisplayControls [data-theme-value="modern"]',timeout=10000);await p.wait_for_timeout(350)
        modern_canvas=await p.evaluate("() => ({theme:document.documentElement.dataset.theme,mode:document.documentElement.dataset.navigationShell,view:document.documentElement.dataset.primaryView})")
        add('view mode remains available independently of theme',modern_canvas['theme']=='modern' and modern_canvas['mode']=='long' and modern_canvas['view']=='canvas',modern_canvas)
        await p.click('#primaryDisplayControls [data-primary-view-mode="sections"]',timeout=10000);await p.wait_for_timeout(250)
        await p.click('[data-primary-needs-route="1"]',timeout=10000);await p.wait_for_timeout(350)
        profile=await p.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,sex:document.querySelector('#needs_sex')?.value,printVisible:!!document.querySelector('#needs_print_btn')})")
        add('needs route is permanently reachable on desktop',profile['route']=='profile' and profile['printVisible'],profile)
        await p.screenshot(path=str(screenshot_dir/'beta7-desktop-navigation-recovery.png'),full_page=False)
        await ctx.close()

# Journey: calculate -> ration -> return to needs -> edit -> recalculate.
        ctx,p,errors=await open_page(390,844,'?theme=ivory-brass&noautov=1')
        await p.click('[data-primary-needs-route="1"]',timeout=10000);await p.wait_for_timeout(250)
        # Fill required fields, including explicit selects so no hidden default is assumed.
        await p.select_option('#needs_sex','female',timeout=10000)
        await p.fill('#needs_age','42');await p.fill('#needs_h','168');await p.fill('#needs_w','64')
        await p.select_option('#needs_activity','moderate')
        await p.wait_for_timeout(500)
        button=await p.evaluate("() => ({text:document.querySelector('#profileCalculateContinue')?.textContent.trim(),disabled:document.querySelector('#profileCalculateContinue')?.disabled})")
        add('profile journey becomes calculable',not button['disabled'] and ('рассчитать' in button['text'].lower() or 'пересчитать' in button['text'].lower()),button)
        await p.click('#profileCalculateContinue',timeout=15000);await p.wait_for_timeout(1000)
        after_calc=await p.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,needsOut:document.querySelector('#needs_out')?.textContent.trim().slice(0,120),stored:!!(window.NutritionProfilePersistenceV1&&NutritionProfilePersistenceV1.hasStoredProfile())})")
        add('calculation continues to ration and stores profile',after_calc['route']=='ration' and after_calc['stored'],after_calc)
        await p.click('[data-primary-needs-route="1"]',timeout=10000);await p.wait_for_timeout(500)
        returned=await p.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,age:document.querySelector('#needs_age')?.value,height:document.querySelector('#needs_h')?.value,weight:document.querySelector('#needs_w')?.value,sex:document.querySelector('#needs_sex')?.value,activity:document.querySelector('#needs_activity')?.value,print:document.querySelector('#needs_print_btn')?.disabled,pdf:document.querySelector('#needs_pdf_btn')?.disabled})")
        add('return to needs preserves anthropometrics and print actions',returned['route']=='profile' and returned['height']=='168' and returned['weight']=='64' and returned['sex']=='female' and returned['activity']=='moderate' and returned['print'] is False and returned['pdf'] is False,returned)
        await p.fill('#needs_h','169',timeout=10000);await p.wait_for_timeout(350)
        dirty=await p.evaluate("() => ({height:document.querySelector('#needs_h')?.value,text:document.querySelector('#profileCalculateContinue')?.textContent.trim(),disabled:document.querySelector('#profileCalculateContinue')?.disabled})")
        add('anthropometry can be edited and calculation becomes pending',dirty['height']=='169' and not dirty['disabled'] and 'рассчитать' in dirty['text'].lower(),dirty)
        await p.click('#profileCalculateContinue',timeout=15000);await p.wait_for_timeout(900)
        recalc=await p.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,payload:(window.NutritionProfilePersistenceV1&&NutritionProfilePersistenceV1.getStored())||{}})")
        stored_h=str(recalc['payload'].get('fields',{}).get('needs_h','')) if isinstance(recalc['payload'],dict) else ''
        add('edited profile recalculates and returns to ration',recalc['route']=='ration' and stored_h=='169',{'route':recalc['route'],'stored_height':stored_h})
        add('full journey has no runtime errors',not errors,errors)
        await ctx.close();await browser.close()
    result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'Navigation recovery: three themes, Sections/Canvas on mobile and desktop, permanent needs access, edit/recalculate/print journey.'}
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));return 0 if result['ok'] else 1

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));ap.add_argument('--json-out',default='reports/v6-beta7-navigation-recovery-acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots')
    a=ap.parse_args();root=Path(a.root).resolve();out=Path(a.json_out);out=out if out.is_absolute() else root/out;ss=Path(a.screenshots);ss=ss if ss.is_absolute() else root/ss
    raise SystemExit(asyncio.run(main_async(root,out,ss)))
if __name__=='__main__':main()
