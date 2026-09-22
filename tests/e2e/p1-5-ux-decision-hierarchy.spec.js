const { test, expect } = require('./fixtures');

async function calculateStandardNeeds(page) {
  if (!(await page.locator('#needs_sex').isVisible())) await page.click('#v40NeedsToggle');
  await page.selectOption('#needs_sex','male');
  await page.fill('#needs_h','180');
  await page.fill('#needs_w','70');
  await page.fill('#needs_age','35');
  await page.selectOption('#needs_state','normal');
  await page.selectOption('#needs_activity','low');
  await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
}

test('P1.5 route is retained and refined by PC2 result tabs', async ({ page, loadApp }) => {
  await page.setViewportSize({ width:1440, height:1000 });
  await loadApp();
  await expect(page.locator('#p15Workflow')).toBeVisible();
  await expect(page.locator('.workflow-steps')).toBeHidden();
  await expect(page.locator('#p15DecisionSummary')).toBeVisible();
  await expect(page.locator('#totalsSection')).toBeHidden();
  await expect(page.locator('#heiPanel')).toBeHidden();
  let state=await page.evaluate(()=>window.NutritionUxP15.audit());
  expect(state).toMatchObject({ok:true,version:'v5.3.210-pc2',contractVersion:'v5.3.210-p1.5',stages:4,rationRows:0,analysisState:'empty'});
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThan(5000);

  await calculateStandardNeeds(page);
  await page.fill('#globalSearchInput','банан');
  const add=page.locator('#globalResults button[data-role="add-search"],#globalResults button[data-role="add"]').first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('#rationBody .ration-row')).toHaveCount(1);
  await expect(page.locator('#p15ResultOverview')).toBeVisible();
  await expect(page.locator('#p15CoreResults')).toBeVisible();
  await expect(page.locator('#heiPanel')).toBeHidden();
  await expect(page.locator('#p15AdvancedAnalysis')).toBeHidden();
  await expect(page.locator('#p15PrimaryAction')).toHaveText('Продолжить добавление');

  await page.click('#pc1ConfirmComplete');
  await expect(page.locator('body')).toHaveClass(/pc1-analysis-complete/);
  await page.click('#p15OpenCoreResults');
  await expect(page.locator('#totalsSection')).toBeVisible();
  await expect(page.locator('#heiPanel')).toBeHidden();
  await page.click('#pc2TabQuality');
  await expect(page.locator('#heiPanel')).toBeVisible();
  await expect(page.locator('#totalsSection')).toBeHidden();
  state=await page.evaluate(()=>window.NutritionUxP15.audit());
  expect(state).toMatchObject({ok:true,needsReady:true,rationRows:1,analysisState:'complete'});
});
