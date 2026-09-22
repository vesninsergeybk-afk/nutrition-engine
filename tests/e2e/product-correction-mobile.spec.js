const { test, expect } = require('./fixtures');

test('PC1 mobile needs calculation remains functional', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  if (!(await page.locator('#needs_sex').isVisible())) await page.click('#v40NeedsToggle');
  await expect(page.locator('#needs_sex')).toBeVisible();
  await page.selectOption('#needs_sex','male');
  await page.fill('#needs_h','180');
  await page.fill('#needs_w','70');
  await page.fill('#needs_age','35');
  await page.selectOption('#needs_state','normal');
  await page.selectOption('#needs_activity','low');
  await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await expect(page.locator('#needs_out')).not.toContainText('Введите исходные данные и нажмите');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(100);
  await page.close();
});
