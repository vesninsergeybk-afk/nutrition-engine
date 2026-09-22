const { test, expect } = require('./fixtures');

async function openNeeds(page){const toggle=page.locator('#v40NeedsToggle');if(await toggle.count()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();}
async function calculateNeeds(page){await openNeeds(page);await page.fill('#needs_person_name','Иван Иванов');await page.selectOption('#needs_sex','male');await page.fill('#needs_h','175');await page.fill('#needs_w','74');await page.fill('#needs_age','45');await page.selectOption('#needs_state','normal');await page.selectOption('#needs_activity','low');await page.selectOption('#needs_goal','maintain');await page.click('#needs_calc_btn');await page.waitForFunction(()=>window.__lastNeedsProfileApplied===true&&!!window.__lastNeedsMeta);await expect(page.locator('#normInput-kcal')).not.toHaveValue('');await page.evaluate(()=>window.NavigationShellV1.navigate('ration'));}
async function addFirst(page,query){await page.fill('#globalSearchInput',query);const add=page.locator('#globalResults button[data-role="add-search"]:not([disabled]),#globalResults button[data-role="add"]:not([disabled])').first();await expect(add).toBeVisible();await expect(add).toBeEnabled();await add.click();await page.waitForTimeout(120);}
async function prepareRation(page){await calculateNeeds(page);for(const query of ['банан','молоко','лосось'])await addFirst(page,query);await expect(page.locator('#rationBody .ration-row')).toHaveCount(3);await page.waitForFunction(()=>window.__lastHEIModel&&window.__lastHEIModel.components);}

test.describe('HF7 dedicated nutrient and HEI workspace views',()=>{
 test('nutrient detail shows actual, target, status and canonical contributors',async({page,loadApp})=>{
   await page.setViewportSize({width:390,height:844});await loadApp();await prepareRation(page);
   await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/nutrients'));
   await expect(page.locator('#workspaceNutrientsPanel')).toBeVisible();
   await expect(page.locator('#totalsSection')).toBeHidden();
   await expect(page.locator('#heiPanel')).toBeHidden();
   await page.locator('[data-nutrient-filter="all"]').click();
   await expect(page.locator('.workspace-analysis-group-picker')).toBeVisible();
   await page.locator('[data-nutrient-select-group="basic"]').click();
   const protein=page.locator('#workspaceNutrientRow-protein_g');
   await expect(protein).toBeVisible();
   await expect(protein.locator('.workspace-analysis-row__values')).toContainText('Фактическое значение');
   await expect(protein.locator('.workspace-analysis-row__values')).toContainText('Ориентир');
   await protein.locator('summary').click();
   await expect(protein.locator('.workspace-contributor').first()).toBeVisible();
   await expect(protein.locator('.workspace-contributor').first()).toContainText(/г · \d+% вклада/);
   await page.locator('[data-nutrient-group="vitamins"]').click();
   await expect(page.locator('#workspaceNutrientList .workspace-analysis-group')).toContainText('Витамины');
   const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   expect(widths.scroll).toBeLessThanOrEqual(widths.client+1);
 });

 test('HEI detail keeps score, 13 components, contributors and independent restrictions together',async({page,loadApp})=>{
   await page.setViewportSize({width:390,height:844});await loadApp();await prepareRation(page);
   await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/hei'));
   await expect(page.locator('#workspaceHeiPanel')).toBeVisible();
   await expect(page.locator('#heiPanel')).toBeHidden();
   await expect(page.locator('#workspaceHeiTotal')).toContainText('/100');
   await expect(page.locator('#workspaceGuardrailList')).toBeVisible();
   await page.locator('[data-hei-filter="all"]').click();
   await expect(page.locator('#workspaceHeiComponentList .workspace-hei-row')).toHaveCount(2);
   await expect(page.locator('.workspace-analysis-pager')).toContainText('1–2 из 13');
   await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/hei','workspaceHeiRow-protein_total'));
   const protein=page.locator('#workspaceHeiRow-protein_total');
   await expect(protein).toBeVisible();
   await expect(protein).toContainText(/из \d+ баллов/);
   await expect(protein).toContainText('Фактическое значение');
   await expect(protein).toContainText('Ориентир HEI');
   await protein.locator('summary').click();
   await expect(protein.locator('.workspace-contributor').first()).toBeVisible();
   await page.locator('[data-hei-group="moderation"]').click();
   await expect(page.locator('#workspaceHeiComponentList .workspace-hei-row')).toHaveCount(2);
   await expect(page.locator('.workspace-analysis-pager')).toContainText('1–2 из 4');
 });

 test('overview priority opens the exact detailed row and browser history restores analysis views',async({page,loadApp})=>{
   await loadApp();await prepareRation(page);
   await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/overview'));
   const link=page.locator('#workspaceOverviewIssueList [data-workspace-target]').first();
   await expect(link).toBeVisible();
   const target=await link.getAttribute('data-workspace-target');
   const route=await link.getAttribute('data-workspace-route');
   await link.click();
   await expect(page.locator('html')).toHaveAttribute('data-navigation-route',route);
   await expect(page.locator('#'+target)).toBeVisible();
   await page.goBack();
   await page.waitForFunction(()=>window.NavigationShellV1.getState().route==='analysis/overview');
   await expect(page.locator('#workspaceOverviewPanel')).toBeVisible();
   await page.goForward();
   await page.waitForFunction(expected=>window.NavigationShellV1.getState().route===expected,route);
   await expect(page.locator('#'+target)).toBeVisible();
 });

 test('incomplete ration gives one completion explanation instead of ranking provisional micronutrient shortages',async({page,loadApp})=>{
   await loadApp();await calculateNeeds(page);await addFirst(page,'банан');
   await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/nutrients'));
   await expect(page.locator('#workspaceNutrientGuidance')).toContainText('Рацион заполнен примерно');
   await expect(page.locator('#workspaceNutrientList .is-provisional')).toHaveCount(0);
   await page.locator('[data-nutrient-filter="all"]').click();
   await expect(page.locator('.workspace-analysis-group-picker')).toBeVisible();
   await page.locator('[data-nutrient-select-group="vitamins"]').click();
   await expect(page.locator('#workspaceNutrientList .is-provisional').first()).toBeVisible();
 });
});
