const { test, expect } = require('./fixtures');

async function enableWorkspace(page, route='ration'){
  await page.evaluate(({route})=>{
    window.NavigationShellV1.setMode('workspace');
    window.NavigationShellV1.navigate(route);
  },{route});
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','workspace');
}

test.describe('parallel navigation shell',()=>{
 test('workspace shell is visible by default and long page remains available',async({page,loadApp})=>{
   await loadApp();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','workspace');
   await expect(page.locator('#navigationShell')).toBeVisible();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-route','profile');
   await expect(page.locator('#workspaceProfilePanel')).toBeVisible();
   await expect(page.locator('#needsCompact')).toBeVisible();
   await expect(page.locator('#globalSearchSection')).toBeHidden();
   await expect(page.locator('#heiPanel')).toBeHidden();
   await expect(page.locator('.workflow-steps')).toBeHidden();
   await page.locator('#navigationShell [data-navshell-mode="long"]').click();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','long');
   await expect(page.locator('.workflow-steps')).toBeVisible();
   await expect(page.locator('#navigationShell')).toBeHidden();
 });

 test('routes, local analysis views, history and input state survive',async({page,loadApp})=>{
   await loadApp();await enableWorkspace(page);
   const search=page.locator('#globalSearchInput');await search.fill('греч');
   await page.locator('[data-navshell-route="analysis/overview"]').click();
   await expect(page.locator('#workspaceOverviewPanel')).toBeVisible();
   await expect(page.locator('#dietAnalysisProfilePanel')).toBeHidden();
   await expect(page.locator('#globalSearchSection')).toBeHidden();
   await page.locator('[data-navshell-analysis-view="analysis/hei"]').click();
   await expect(page.locator('#workspaceHeiPanel')).toBeVisible();
   await expect(page.locator('#heiPanel')).toBeHidden();
   await expect(page.locator('#totalsSection')).toBeHidden();
   const beforeBack=await page.evaluate(()=>window.NavigationShellV1.getState().route);
   expect(beforeBack).toBe('analysis/hei');
   await page.goBack();
   await page.waitForFunction(()=>window.NavigationShellV1.getState().route==='analysis/overview');
   await page.goBack();
   await page.waitForFunction(()=>window.NavigationShellV1.getState().route==='ration');
   await expect(search).toHaveValue('греч');
 });

 test('correction route uses the dedicated reviewable workspace and keeps legacy tools separate',async({page,loadApp})=>{
   await loadApp();await enableWorkspace(page,'correction');
   await expect(page.locator('#workspaceCorrectionPanel')).toBeVisible();
   await expect(page.locator('#heiPanel')).toBeHidden();
   await expect(page.locator('#geminiAiSection')).toBeHidden();
   await expect(page.locator('#workspaceCorrectionPriorities')).toBeVisible();
   await expect(page.locator('#workspaceCorrectionPreview')).toBeVisible();
 });

 test('mobile bottom navigation has no horizontal overflow or second mini-cart layer',async({page,loadApp})=>{
   await page.setViewportSize({width:390,height:844});await loadApp();await enableWorkspace(page);
   const metrics=await page.evaluate(()=>{
     const nav=document.getElementById('navigationShell').getBoundingClientRect();
     const mini=document.getElementById('v40MiniCart');
     return {inner:window.innerWidth,scroll:document.documentElement.scrollWidth,left:nav.left,right:nav.right,mini:mini?window.getComputedStyle(mini).display:'missing'};
   });
   expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner);
   expect(metrics.left).toBeGreaterThanOrEqual(0);
   expect(metrics.right).toBeLessThanOrEqual(metrics.inner);
   expect(metrics.mini).toBe('none');
   await expect(page.locator('#navigationShell .navigation-shell__items [data-navshell-route]')).toHaveCount(4);
 });

 test('settings and return to long page are reversible',async({page,loadApp})=>{
   await loadApp();await enableWorkspace(page,'analysis/hei');
   const toolbar=page.locator('#mainContent>header>.toolbar');await expect(toolbar).toBeHidden();
   await page.locator('[data-navshell-settings-toggle]').first().click();await expect(toolbar).toBeVisible();
   await page.locator('#navigationShell [data-navshell-mode="long"]').click();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','long');
   await expect(page.locator('#globalSearchSection')).toBeVisible();
   await expect(page.locator('#heiPanel')).toBeVisible();
   await expect(page.locator('.workflow-steps')).toBeVisible();
 });
});
