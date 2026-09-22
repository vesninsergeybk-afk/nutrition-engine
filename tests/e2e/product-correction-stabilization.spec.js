const { test, expect } = require('./fixtures');

async function openNeeds(page) {
  if (!(await page.locator('#needs_sex').isVisible())) await page.click('#v40NeedsToggle');
}
async function calculateNeeds(page) {
  await openNeeds(page);
  await page.selectOption('#needs_sex', 'male');
  await page.fill('#needs_h', '180');
  await page.fill('#needs_w', '70');
  await page.fill('#needs_age', '35');
  await page.selectOption('#needs_state', 'normal');
  await page.selectOption('#needs_activity', 'low');
  await page.selectOption('#needs_goal', 'maintain');
  await page.click('#needs_calc_btn');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
}
async function addFirstResult(page, query) {
  await page.fill('#globalSearchInput', query);
  const button = page.locator('#globalResults button[data-role="add-search"], #globalResults button[data-role="add"]').first();
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('#rationBody .ration-row')).toHaveCount(1);
}

test('PC1 product correction critical journey', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await calculateNeeds(page);
  await addFirstResult(page, 'банан');

  // One product is a draft, not a completed day. HEI-2020 must never become 2020/100.
  await expect(page.locator('#pc1AnalysisChip')).toContainText('черновик');
  await expect(page.locator('#p15PrimaryAction')).toHaveText('Продолжить добавление');
  await expect(page.locator('#p15OverviewHei')).toHaveText('Не финализирован');
  await expect(page.locator('#p15OverviewHei')).not.toContainText('2020');
  await page.click('#p15OpenCoreResults');
  await expect(page.locator('#totalsSection')).toBeVisible();
  await expect(page.locator('#heiPanel')).toBeHidden();
  const preliminaryReport = await page.evaluate(() => window.NutritionReportV5.getReportHtml({ force:true }));
  expect(preliminaryReport).toContain('Предварительный отчёт');
  expect(preliminaryReport).toContain('data-report-status="preliminary"');
  expect(preliminaryReport).not.toContain('2020 / 100');

  // Explicit completion unlocks daily HEI; any ration edit returns the state to draft.
  await page.click('#pc1ConfirmComplete');
  await expect(page.locator('body')).toHaveClass(/pc1-analysis-complete/);
  await expect(page.locator('#p15OverviewHei')).toContainText('/ 100');
  const scoreText = await page.locator('#p15OverviewHei').textContent();
  const score = Number.parseFloat(scoreText);
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(100);
  await expect(page.locator('#pc2TabQuality')).toBeEnabled();
  await page.click('#p15OpenCoreResults');
  await page.click('#pc2TabQuality');
  await expect(page.locator('#heiPanel')).toBeVisible();
  const grams = page.locator('#rationBody input[type="number"]').first();
  await grams.fill('120');
  await grams.dispatchEvent('change');
  await expect(page.locator('body')).toHaveClass(/pc1-analysis-preliminary/);
  await expect(page.locator('#heiPanel')).toBeHidden();

  // Simple mode protects consumer users; professional mode is explicit and reversible.
  await expect(page.locator('body')).toHaveAttribute('data-product-mode', 'simple');
  await expect(page.locator('#additionalToolsSection')).toBeHidden();
  await expect(page.locator('option[value="icu"]')).toBeDisabled();
  await page.click('[data-pc-mode="professional"]');
  await expect(page.locator('body')).toHaveAttribute('data-product-mode', 'professional');
  await expect(page.locator('option[value="icu"]')).not.toBeDisabled();
  await expect(page.locator('#additionalToolsSection')).toBeVisible();
  await page.click('[data-pc-mode="simple"]');
  await expect(page.locator('body')).toHaveAttribute('data-product-mode', 'simple');

  // Generic queries rank canonical base products before branded and ready-meal variants.
  for (const [query, expectation] of [
    ['молоко',{key:'milk_1_5_pct'}],
    ['йогурт',{key:'yogurt_plain_1_5_pct'}],
    ['творог',{key:'tvorog_5_pct'}],
    ['гречка',{family:'buckwheat_groats',variant:'buckwheat_cooked'}],
    ['курица',{family:'chicken_breast_skinless',variant:'chicken_breast_boiled_skinless'}]
  ]) {
    await page.fill('#globalSearchInput', query);
    const first = page.locator('#globalResults .search-result-card').first();
    await expect(first).toBeVisible();
    if (expectation.key) {
      await expect.poll(async () => first.evaluate(node => node.getAttribute('data-key') || node.getAttribute('data-unit-quick-key') || node.getAttribute('data-serving-units-key') || '')).toBe(expectation.key);
    } else {
      await expect.poll(async () => first.getAttribute('data-preparation-family-id')).toBe(expectation.family);
      await expect.poll(async () => first.locator('[data-preparation-family-select] option').evaluateAll((nodes, variant) => nodes.some(node => node.value === variant), expectation.variant)).toBe(true);
    }
  }


});
