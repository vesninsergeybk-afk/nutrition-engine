#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports'/'hf20-entry-ux-browser.json'

def main()->int:
    report={'checks':[],'console_errors':[],'page_errors':[]}
    def add(name:str,ok:bool,detail=''):
        report['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
        print(f"{name}: {'PASS' if ok else 'FAIL'} {detail}")
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for label,viewport in [('desktop',{'width':1366,'height':900}),('mobile',{'width':390,'height':844})]:
            context=browser.new_context(viewport=viewport)
            page=context.new_page()
            page.on('console',lambda msg,l=label: report['console_errors'].append({'viewport':l,'type':msg.type,'text':msg.text}) if msg.type=='error' else None)
            page.on('pageerror',lambda err,l=label: report['page_errors'].append({'viewport':l,'text':str(err)}))
            def serve(route):
                u=urlparse(route.request.url)
                if u.hostname!='nutrition.test':
                    route.abort();return
                rel=unquote(u.path.lstrip('/')) or 'index.html'
                target=(ROOT/rel).resolve()
                if not str(target).startswith(str(ROOT.resolve())) or not target.is_file():
                    route.fulfill(status=404,body='not found');return
                ctype='application/octet-stream'
                if target.suffix=='.js':ctype='application/javascript'
                elif target.suffix=='.css':ctype='text/css'
                elif target.suffix in {'.html','.htm'}:ctype='text/html'
                elif target.suffix=='.json':ctype='application/json'
                elif target.suffix=='.svg':ctype='image/svg+xml'
                elif target.suffix=='.png':ctype='image/png'
                route.fulfill(status=200,body=target.read_bytes(),content_type=ctype)
            page.route('**/*',serve)
            html=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://nutrition.test/">',1)
            page.set_content(html,wait_until='domcontentloaded',timeout=30000)
            try:page.wait_for_function('window.NavigationShellV1 && window.NutritionWorkspaceEntryUXHF20',timeout=30000)
            except PlaywrightTimeoutError:pass
            page.wait_for_timeout(1200)
            state=page.evaluate('window.NavigationShellV1&&window.NavigationShellV1.getState?window.NavigationShellV1.getState():null')
            add(label+'_boot',bool(state),json.dumps(state,ensure_ascii=False))
            add(label+'_label',page.locator('label[for="needs_person_name"]').inner_text().strip()=='Имя или ФИО (необязательно)')
            switcher=page.locator('#workspaceViewSwitcher');add(label+'_switcher_visible',switcher.is_visible())
            legacy=['heiPanel','totalsSection','dietAnalysisProfilePanel','strictHarvardPlateDetails','dataQualityPanel']
            visible=lambda:page.evaluate("ids=>ids.filter(id=>{const e=document.getElementById(id);return e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0})",legacy)
            add(label+'_profile_isolated',not visible(),json.dumps(visible()))
            page.locator('[data-workspace-view-mode="long"]').click();page.wait_for_timeout(250)
            add(label+'_long_mode',page.evaluate('window.NavigationShellV1.getState().mode')=='long')
            add(label+'_long_canvas_restored',len(visible())>=4,json.dumps(visible()))
            add(label+'_switcher_visible_long',switcher.is_visible())
            page.locator('[data-workspace-view-mode="workspace"]').click();page.wait_for_timeout(250)
            page.evaluate("window.NavigationShellV1.navigate('ration')");page.wait_for_timeout(500)
            back=page.locator('#workspaceProfileBackAction');add(label+'_profile_back_visible',back.is_visible())
            methods=page.locator('#workspaceRationEntryMethods');add(label+'_entry_methods_visible',methods.is_visible())
            add(label+'_ai_wording','ИИ-распознавание' in methods.inner_text())
            page.evaluate("""() => {window.__hf20Hits={photo:0,voice:0,audio:0};[['geminiRationChoosePhotos','photo'],['geminiRationRecordAudio','voice'],['geminiRationChooseAudio','audio']].forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.addEventListener('click',e=>{window.__hf20Hits[key]++;e.preventDefault();e.stopImmediatePropagation();},true);});}""")
            for kind in ('photo','voice','audio'):
                page.locator(f'[data-ration-entry-method="{kind}"]').click();page.wait_for_timeout(100)
            hits=page.evaluate('window.__hf20Hits');add(label+'_ai_shortcuts',hits=={'photo':1,'voice':1,'audio':1},json.dumps(hits))
            add(label+'_ai_tools_revealed',page.locator('#workspaceRationSecondary').evaluate('(el)=>el.open'))
            for route_id,panel_id in [('analysis/overview','workspaceOverviewPanel'),('analysis/nutrients','workspaceNutrientsPanel'),('analysis/hei','workspaceHeiPanel'),('correction','workspaceCorrectionPanel'),('report','workspaceReportPanel')]:
                page.evaluate('(r)=>window.NavigationShellV1.navigate(r)',route_id);page.wait_for_timeout(200)
                panel=page.locator('#'+panel_id)
                add(label+'_route_'+route_id.replace('/','_'),panel.count()>0 and panel.is_visible())
                add(label+'_isolated_'+route_id.replace('/','_'),not visible(),json.dumps(visible()))
            page.evaluate("window.NavigationShellV1.navigate('ration')");page.wait_for_timeout(200);back.click();page.wait_for_timeout(250)
            add(label+'_back_to_profile',page.evaluate('window.NavigationShellV1.getState().route')=='profile')
            dims=page.evaluate('({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
            add(label+'_no_horizontal_overflow',dims['sw']<=dims['cw']+2,json.dumps(dims))
            context.close()
        browser.close()
    report['ok']=all(x['passed'] for x in report['checks']) and not report['page_errors']
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('console errors:',len(report['console_errors']),'page errors:',len(report['page_errors']))
    return 0 if report['ok'] else 1

if __name__=='__main__':raise SystemExit(main())
