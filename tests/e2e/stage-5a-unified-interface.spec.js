const { test, expect, ORIGIN } = require('./fixtures');
const contract = require('../../quality/stage-5a-unified-interface-contract.json');

async function openApp(page, suffix=''){
  const response=await page.goto(`${ORIGIN}/index.html${suffix}`,{waitUntil:'networkidle'});
  if(!response||response.status()!==200)throw new Error(`app load failed: ${response&&response.status()}`);
  await page.waitForFunction(()=>{
    const calc=document.getElementById('needs_calc_btn');
    return !!window.__APP_BOOTSTRAP_META__&&!!window.NavigationShellV1&&!!calc&&calc.getAttribute('data-needs-calculation-ready')==='1'&&!calc.disabled;
  },null,{timeout:30000});
}

test.describe('stage 5A unified user interface',()=>{
  test('ordinary startup ignores and removes a stale persisted long mode',async({page})=>{
    await page.addInitScript(()=>{try{localStorage.setItem('nutritionCalculator.navigationShell.mode.v2','long');}catch(_){}});
    await openApp(page);
    await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','workspace');
    await expect(page.locator('#navigationShell')).toBeVisible();
    await expect(page.locator('#navigationShellModeSwitcher')).toHaveCount(0);
    await expect(page.locator('[data-navshell-mode]')).toHaveCount(0);
    await expect(page.locator('#navigationShell .navigation-shell__items [data-navshell-route]')).toHaveCount(4);
    await expect(page.locator('#navigationShell .navigation-shell__secondary button')).toHaveCount(2);
    const state=await page.evaluate(()=>({
      mode:window.NavigationShellV1.getState().mode,
      technical:window.NavigationShellV1.getState().technicalFallback,
      stored:localStorage.getItem('nutritionCalculator.navigationShell.mode.v2'),
      query:new URL(location.href).searchParams.get('ui')
    }));
    expect(state).toEqual({mode:'workspace',technical:false,stored:null,query:null});
  });

  test('direct ui=long entry exposes only one technical return action',async({page})=>{
    await openApp(page,'?ui=long#analysis/hei');
    await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','long');
    await expect(page.locator('html')).toHaveAttribute('data-navigation-long-fallback','technical');
    await expect(page.locator('#navigationShell')).toBeHidden();
    await expect(page.locator('.workflow-steps')).toBeVisible();
    await expect(page.locator('#navigationShellLongReturn')).toBeVisible();
    await expect(page.locator('[data-navshell-return-workspace]')).toHaveCount(contract.technical_fallback.return_action_count);
    await expect(page.locator('[data-navshell-return-workspace]')).toHaveText(contract.technical_fallback.return_action_label);
    const state=await page.evaluate(()=>({
      mode:window.NavigationShellV1.getState().mode,
      route:window.NavigationShellV1.getState().route,
      stored:localStorage.getItem('nutritionCalculator.navigationShell.mode.v2'),
      query:new URL(location.href).searchParams.get('ui'),
      hash:location.hash
    }));
    expect(state.mode).toBe('long');
    expect(state.route).toBe('analysis/hei');
    expect(state.stored).toBeNull();
    expect(state.query).toBe('long');
    expect(state.hash).toBe('#heiPanel');
  });

  test('fallback roundtrip preserves ration, route and browser history without persisting long',async({page})=>{
    await openApp(page);
    const before=await page.evaluate(()=>{
      const product=(window.DB.items||[]).find(item=>item&&item.key);
      if(!product)throw new Error('product database is empty');
      window.State.add(product.key,123);
      window.NavigationShellV1.navigate('analysis/hei');
      return {ration:JSON.stringify(window.State.get()),history:history.length};
    });
    await expect(page.locator('html')).toHaveAttribute('data-navigation-route','analysis/hei');
    await page.evaluate(()=>window.NavigationShellV1.setMode('long'));
    await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','long');
    await expect(page).toHaveURL(/\?ui=long#heiPanel$/);
    expect(await page.evaluate(()=>JSON.stringify(window.State.get()))).toBe(before.ration);
    await page.locator('[data-navshell-return-workspace]').click();
    await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','workspace');
    await expect(page.locator('html')).toHaveAttribute('data-navigation-route','analysis/hei');
    await expect(page.locator('#workspaceHeiPanel')).toBeVisible();
    const after=await page.evaluate(()=>({
      ration:JSON.stringify(window.State.get()),
      history:history.length,
      modeStored:localStorage.getItem('nutritionCalculator.navigationShell.mode.v2'),
      routeStored:localStorage.getItem('nutritionCalculator.navigationShell.route.v1'),
      query:new URL(location.href).searchParams.get('ui'),
      hash:location.hash
    }));
    expect(after.ration).toBe(before.ration);
    expect(after.history).toBe(before.history);
    expect(after.modeStored).toBeNull();
    expect(after.routeStored).toBe('analysis/hei');
    expect(after.query).toBeNull();
    expect(after.hash).toBe('#analysis/hei');
  });

  test('technical fallback and return control fit every accepted viewport',async({page})=>{
    for(const [width,height] of contract.viewport_matrix){
      await page.setViewportSize({width,height});
      await openApp(page,'?ui=long#ration');
      const metrics=await page.evaluate(()=>{
        const control=document.getElementById('navigationShellLongReturn').getBoundingClientRect();
        const button=document.querySelector('[data-navshell-return-workspace]').getBoundingClientRect();
        return {inner:innerWidth,scroll:document.documentElement.scrollWidth,left:control.left,right:control.right,buttonHeight:button.height};
      });
      expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner);
      expect(metrics.left).toBeGreaterThanOrEqual(-0.5);
      expect(metrics.right).toBeLessThanOrEqual(metrics.inner+0.5);
      expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44);
    }
  });

  test('report and print remain available without any architecture switcher',async({page,browserName})=>{
    await openApp(page);
    await page.evaluate(()=>window.NavigationShellV1.navigate('report'));
    await expect(page.locator('#workspaceReportPanel')).toBeVisible();
    await expect(page.locator('#navigationShellModeSwitcher')).toHaveCount(0);
    await page.waitForFunction(()=>window.WorkspaceReportHF13&&window.WorkspaceReportHF13.getLastModel());
    await page.emulateMedia({media:'print'});
    const state=await page.evaluate(()=>({
      nav:getComputedStyle(document.getElementById('navigationShell')).display,
      fallback:getComputedStyle(document.getElementById('navigationShellLongReturn')).display,
      report:getComputedStyle(document.querySelector('.workspace-report-document')).display
    }));
    expect(state.nav).toBe('none');
    expect(state.fallback).toBe('none');
    expect(state.report).not.toBe('none');
    if(browserName==='chromium'){
      const pdf=await page.pdf({format:'A4',printBackground:true});
      expect(pdf.length).toBeGreaterThan(10000);
    }
  });
});
