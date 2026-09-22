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
        async def open_page(width,height,route='ration'):
            ctx=await browser.new_context(viewport={'width':width,'height':height},bypass_csp=True)
            async def handler(r,req):
                rel=unquote(urlparse(req.url).path).lstrip('/') or 'index.html'; fp=(root/rel).resolve()
                try: fp.relative_to(root)
                except Exception: return await r.fulfill(status=403,body='forbidden')
                if fp.is_file(): return await r.fulfill(status=200,path=str(fp),content_type=mime(fp))
                return await r.fulfill(status=404,body='missing '+rel)
            await ctx.route('https://app.test/**',handler)
            page=await ctx.new_page(); errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            html=(root/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://app.test/">',1).replace("window.location.search||''",repr('?theme=ivory-brass&noautov=1'),1)
            await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
            await page.wait_for_function('window.__RUNTIME_LOADER_CLOSED__===true',timeout=60000)
            await page.evaluate("route=>{NutritionTheme.set('ivory-brass',{persist:false}); if(window.NutritionWorkspaceEntryUXHF28) NutritionWorkspaceEntryUXHF28.setLayout('canvas',{persist:false}); NavigationShellV1.navigate(route)}",route)
            await page.wait_for_timeout(850)
            return ctx,page,errors

        ctx,p,errors=await open_page(1440,900,'ration')
        state=await p.evaluate("""() => {const q=s=>document.querySelector(s),v=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0},r=s=>{const e=q(s),x=e&&e.getBoundingClientRect();return x?{top:x.top,bottom:x.bottom,width:x.width,height:x.height}:null};return {version:window.__APP_BOOTSTRAP_META__&&window.__APP_BOOTSTRAP_META__.release,route:document.documentElement.dataset.navigationRoute,heroAction:q('#ivoryHeroPrimary')&&q('#ivoryHeroPrimary').dataset.ivoryAction,heroText:q('#ivoryHeroPrimary')&&q('#ivoryHeroPrimary').textContent.trim(),metricVisible:v(q('.ivory-metric-strip')),radialVisible:v(q('#ivoryRadialChart')),emptyVisible:v(q('#ivoryGroupEmptyState')),priorityVisible:v(q('.ivory-priority-card')),dockPosition:q('.ivory-quick-dock')&&getComputedStyle(q('.ivory-quick-dock')).position,dockParent:q('.ivory-quick-dock')&&q('.ivory-quick-dock').parentElement.id,dockInsideContext:!!(q('.ivory-quick-dock')&&q('.ivory-quick-dock').closest('#navigationShellContext')),search:r('#globalSearchSection'),rail:r('#ivoryInsightRail'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,entryCols:q('.workspace-ration-entry-methods__grid')&&getComputedStyle(q('.workspace-ration-entry-methods__grid')).gridTemplateColumns};}""")
        add('desktop empty state is profile-first',state['version']==VERSION and state['heroAction']=='profile' and 'потребност' in state['heroText'].lower(),state)
        add('desktop blank analytics are suppressed',not state['metricVisible'] and not state['radialVisible'] and state['emptyVisible'] and not state['priorityVisible'],state)
        add('desktop quick actions do not overlay content',state['dockPosition']!='fixed',state)
        add('desktop search appears in first working screen',state['search'] and state['search']['top']<520 and state['overflow']<=1,state)
        add('desktop entry methods have four readable columns',state['entryCols'] and len(state['entryCols'].split())==4,state)
        add('desktop no runtime errors',not errors,errors)
        await p.screenshot(path=str(screenshot_dir/'beta7-design-desktop-empty.png'),full_page=True)
        await p.click('#ivoryHeroPrimary'); await p.wait_for_timeout(250)
        nav=await p.evaluate("() => ({route:document.documentElement.dataset.navigationRoute,active:document.activeElement&&document.activeElement.id})")
        add('hero CTA opens profile at first required field',nav['route']=='profile' and nav['active']=='needs_sex',nav)
        await ctx.close()

        ctx,p,errors=await open_page(390,844,'ration')
        mob=await p.evaluate("""() => {const q=s=>document.querySelector(s),v=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0},r=s=>{const e=q(s),x=e&&e.getBoundingClientRect();return x?{top:x.top,bottom:x.bottom,height:x.height}:null};return {mobileSummary:v(q('#ivoryMobileSummary')),inlineSummary:v(q('#workspaceRationInlineSummary')),person:v(q('#workspacePersonContext')),search:r('#globalSearchSection'),searchGrid:r('#globalSearchSection .search-main-grid'),methods:r('#workspaceRationEntryMethods'),nav:r('#navigationShell'),brand:v(q('.navigation-shell__brand')),theme:v(q('#ivoryNavTheme')),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};}""")
        add('mobile ration has one contextual summary',not mob['mobileSummary'] and not mob['inlineSummary'] and mob['person'],mob)
        add('mobile search precedes optional AI methods',mob['searchGrid'] and mob['methods'] and mob['searchGrid']['top']<mob['methods']['top'],mob)
        add('mobile bottom navigation is compact',mob['nav'] and mob['nav']['height']<=76 and not mob['brand'] and not mob['theme'],mob)
        add('mobile ration has no horizontal overflow',mob['overflow']<=1,mob)
        add('mobile ration no runtime errors',not errors,errors)
        await p.screenshot(path=str(screenshot_dir/'beta7-design-mobile-ration.png'),full_page=True)
        for theme in ('modern','retro-2bit'):
            await p.evaluate("theme=>{NutritionTheme.set(theme,{persist:false});NavigationShellV1.navigate('ration')}",theme); await p.wait_for_timeout(250)
            scoped=await p.evaluate("""() => {const e=document.querySelector('#workspaceRationInlineSummary'),r=e&&e.getBoundingClientRect(),s=e&&getComputedStyle(e);return {theme:document.documentElement.dataset.theme,visible:!!(e&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}}""")
            add(theme+' retains its existing ration summary',scoped['theme']==theme and scoped['visible'],scoped)
            add(theme+' has no horizontal overflow',scoped['overflow']<=1,scoped)
        await ctx.close()

        ctx,p,errors=await open_page(390,844,'profile')
        prof=await p.evaluate("""() => {const q=s=>document.querySelector(s),v=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0},r=s=>{const e=q(s),x=e&&e.getBoundingClientRect();return x?{top:x.top,bottom:x.bottom,height:x.height}:null};return {basic:r('#profileBasicSection'),sex:r('#needs_sex'),legacyTitle:v(q('#needs>.row:first-of-type h1')),missing:v(q('#profileContinuityMissing')),focusMissing:v(q('#profileFocusMissing')),required:['needs_sex','needs_age','needs_h','needs_w','needs_activity'].map(id=>({id,visible:v(q('#'+id))})),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};}""")
        add('mobile profile exposes all five required fields',all(x['visible'] for x in prof['required']),prof)
        add('mobile first field is visible without scrolling',prof['sex'] and prof['sex']['top']<844 and prof['basic']['top']<330,prof)
        add('mobile profile removes duplicate heading and chip layer',not prof['legacyTitle'] and not prof['missing'] and not prof['focusMissing'],prof)
        add('mobile profile has no horizontal overflow',prof['overflow']<=1,prof)
        add('mobile profile no runtime errors',not errors,errors)
        await p.screenshot(path=str(screenshot_dir/'beta7-design-mobile-profile.png'),full_page=True)
        await ctx.close(); await browser.close()
    result={'ok':all(x['ok'] for x in rows),'release_version':VERSION,'assertions':len(rows),'results':rows,'scope':'Independent design hierarchy and usability acceptance for desktop canvas and mobile sequential architecture.'}
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if result['ok'] else 1

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));ap.add_argument('--json-out',default='reports/v6-beta7-design-acceptance.json');ap.add_argument('--screenshots',default='reports/screenshots')
    a=ap.parse_args();root=Path(a.root).resolve();out=Path(a.json_out);out=out if out.is_absolute() else root/out;ss=Path(a.screenshots);ss=ss if ss.is_absolute() else root/ss
    raise SystemExit(asyncio.run(main_async(root,out,ss)))
if __name__=='__main__':main()
