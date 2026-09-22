const { test, expect } = require('./fixtures');

async function openNeeds(page){ if(!(await page.locator('#needs_sex').isVisible())) await page.click('#v40NeedsToggle'); }
async function calculateNeeds(page){
  await openNeeds(page); await page.selectOption('#needs_sex','female'); await page.fill('#needs_h','168'); await page.fill('#needs_w','62'); await page.fill('#needs_age','34');
  await page.selectOption('#needs_state','normal'); await page.selectOption('#needs_activity','low'); await page.selectOption('#needs_goal','maintain'); await page.click('#needs_calc_btn');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
}
async function searchFirstTitle(page,query){
  await page.fill('#globalSearchInput',query); const first=page.locator('#globalResults .search-result-card').first(); await expect(first).toBeVisible();
  const title=first.locator('.search-result-title').first(); return ((await title.count())?await title.textContent():await first.textContent())||'';
}
async function addFirst(page,query){
  await page.fill('#globalSearchInput',query); const b=page.locator('#globalResults button[data-role="add-search"], #globalResults button[data-role="add"]').first(); await expect(b).toBeVisible(); await b.click();
}

test('PC2 focused result and editorial search journey', async ({page,loadApp})=>{
  await page.setViewportSize({width:1440,height:1000}); await loadApp(); await calculateNeeds(page); await addFirst(page,'банан');
  await expect(page.locator('#pc2PriorityPanel')).toBeVisible();
  const preliminaryCount=await page.locator('#pc2PriorityList .pc2-priority-item').count(); expect(preliminaryCount).toBeGreaterThan(0); expect(preliminaryCount).toBeLessThanOrEqual(5);
  await expect(page.locator('#pc2TabQuality')).toBeDisabled();
  await page.click('#pc1ConfirmComplete');
  await expect(page.locator('#pc2TabQuality')).toBeEnabled();
  const count=await page.locator('#pc2PriorityList .pc2-priority-item').count(); expect(count).toBeGreaterThan(0); expect(count).toBeLessThanOrEqual(5);
  await page.click('#p15OpenCoreResults'); await expect(page.locator('#pc2CoreTabs')).toBeVisible();
  await page.click('#pc2TabQuality'); await expect(page.locator('#heiPanel')).toBeVisible(); await expect(page.locator('#totalsSection')).toBeHidden();
  await page.click('#pc2TabNutrition'); await expect(page.locator('#totalsSection')).toBeVisible(); await expect(page.locator('#heiPanel')).toBeHidden();
  for(const [q,pattern] of [
    ['помидор',/томат/i],['огурец',/огур/i],['макароны',/макарон|паста/i],
    ['яйцо',/яйцо/i],['хлеб',/^хлеб/i],['сыр',/^сыр/i]
  ]) expect(await searchFirstTitle(page,q)).toMatch(pattern);
  await expect(page.locator('body')).toHaveAttribute('data-product-mode','simple');
  await page.fill('#globalSearchInput','курица'); const card=page.locator('#globalResults .search-result-card').first(); await expect(card).toBeVisible();
  const height=await card.evaluate(n=>n.getBoundingClientRect().height); expect(height).toBeLessThan(700);
  const audit=await page.evaluate(()=>window.NutritionProductCorrectionPC2.audit()); expect(audit.ok).toBe(true); expect(audit.version).toBe('v5.3.210-pc2');
  await page.close();
});
