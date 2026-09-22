const { test, expect } = require('./fixtures');
async function openNeeds(page){const toggle=page.locator('#v40NeedsToggle');if(await toggle.count()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();}
async function calculateNeeds(page){await openNeeds(page);await page.fill('#needs_person_name','Иван Иванов');await page.selectOption('#needs_sex','male');await page.fill('#needs_h','175');await page.fill('#needs_w','74');await page.fill('#needs_age','45');await page.selectOption('#needs_state','normal');await page.selectOption('#needs_activity','low');await page.selectOption('#needs_goal','maintain');await page.click('#needs_calc_btn');await page.waitForFunction(()=>window.__lastNeedsProfileApplied===true&&!!window.__lastNeedsMeta);await expect(page.locator('#normInput-kcal')).not.toHaveValue('');await page.evaluate(()=>window.NavigationShellV1.navigate('ration'));}
async function addFirst(page,query){await page.fill('#globalSearchInput',query);const add=page.locator('#globalResults button[data-role="add-search"],#globalResults button[data-role="add"]').first();await expect(add).toBeVisible();await add.click();await expect(page.locator('#rationBody .ration-row').first()).toBeVisible();}

test.describe('HF7 ration and overview workspace slice',()=>{
 test('route isolation remains correct after the whole application is ready',async({page,loadApp})=>{
   await loadApp();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-route','profile');
   await expect(page.locator('#workspaceProfilePanel')).toBeVisible();
   await expect(page.locator('#needsCompact')).toBeVisible();
   await expect(page.locator('#globalSearchSection')).toBeHidden();
   for(const selector of ['#heiPanel','#totalsSection','#dietAnalysisProfilePanel','#dataQualityPanel','#workspaceOverviewPanel'])await expect(page.locator(selector)).toBeHidden();
   const state=await page.evaluate(()=>({hei:document.getElementById('heiPanel').hidden,totals:document.getElementById('totalsSection').hidden,profile:document.getElementById('dietAnalysisProfilePanel').hidden}));
   expect(state).toEqual({hei:true,totals:true,profile:true});
 });

 test('mobile ration starts with search, compact summary and one secondary disclosure',async({page,loadApp})=>{
   await page.setViewportSize({width:390,height:844});await loadApp();await calculateNeeds(page);
   await expect(page.locator('#workspaceRationInlineSummary')).toBeVisible();
   await expect(page.locator('#workspaceRationEmpty')).toBeVisible();
   await expect(page.locator('#workspaceRationSecondary')).toBeVisible();
   await expect(page.locator('#geminiRationImportSection')).toBeHidden();
   await expect(page.locator('#needsCompact')).toBeHidden();
   await expect(page.locator('#workspacePersonContext')).toContainText('Иван Иванов');
   const order=await page.evaluate(()=>{const a=document.getElementById('globalSearchSection').getBoundingClientRect().top,b=document.getElementById('rationSection').getBoundingClientRect().top;return {a,b,width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth};});
   expect(order.a).toBeLessThan(order.b);expect(order.width).toBeLessThanOrEqual(order.client+1);
   await expect(page.locator('body>.skip-link').first()).toHaveAttribute('href','#globalSearchSection');
 });

 test('editing ration updates summary and concise overview without duplicate calculation blocks',async({page,loadApp})=>{
   await page.setViewportSize({width:390,height:844});await loadApp();await calculateNeeds(page);await addFirst(page,'банан');
   await expect(page.locator('#workspaceRationTitle')).toContainText(/1 позиция/);
   await expect(page.locator('#workspaceMetricKcal')).toContainText(/89/);
   await expect(page.locator('#workspaceRationEmpty')).toBeHidden();
   await expect(page.locator('#globalSearchInput')).toHaveValue('');
   await expect(page.locator('#needsCompact')).toBeHidden();
   await page.locator('#workspaceRationAttention').click();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-route','analysis/overview');
   await expect(page.locator('#workspaceOverviewPanel')).toBeVisible();
   await expect(page.locator('#workspaceOverviewEnergy')).toContainText(/89/);
   await expect(page.locator('#workspaceOverviewHei')).toContainText('/100');
   await expect(page.locator('#workspaceOverviewIssueList .workspace-issue').first()).toBeVisible();
   for(const selector of ['#totalsSection','#heiPanel','#dietAnalysisProfilePanel'])await expect(page.locator(selector)).toBeHidden();
   await expect(page.locator('#rationTable')).toHaveCount(1);await expect(page.locator('#totalsGrid')).toHaveCount(1);
   await page.getByRole('button',{name:'Все нутриенты'}).click();await expect(page.locator('#workspaceNutrientsPanel')).toBeVisible();await expect(page.locator('#totalsSection')).toBeHidden();await expect(page.locator('#workspaceOverviewPanel')).toBeHidden();
   await page.locator('#navigationShell [data-navshell-route="ration"]').click();await expect(page.locator('#rationBody .ration-row')).toHaveCount(1);
 });

 test('long page remains a reversible fallback and excludes workspace-only panels',async({page,loadApp})=>{
   await loadApp();await page.locator('#navigationShell [data-navshell-mode="long"]').click();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-shell','long');
   await expect(page.locator('#navigationShell')).toBeHidden();
   await expect(page.locator('#workspaceOverviewPanel')).toBeHidden();
   await expect(page.locator('#workspaceRationSecondary')).toBeHidden();
   for(const selector of ['#globalSearchSection','#rationSection','#heiPanel','#totalsSection','#dietAnalysisProfilePanel'])await expect(page.locator(selector)).toBeVisible();
 });
});
