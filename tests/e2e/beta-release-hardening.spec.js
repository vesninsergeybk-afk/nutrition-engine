const { test, expect } = require('./fixtures');

test('RC2 provides privacy-safe diagnostics for server beta testing', async ({ page, loadApp }) => {
  await loadApp();
  await page.waitForFunction(() => window.NutritionBetaSupportRC1 && document.getElementById('rc1BetaSupport'));
  await expect(page.locator('#rc1BetaSupport')).toContainText('v5.3.210-rc2');
  await page.evaluate(() => {
    try { localStorage.setItem('private-test-value', 'DO_NOT_EXPORT_THIS_VALUE'); } catch (_) {}
    const name = document.getElementById('needs_person_name');
    if (name) name.value = 'DO_NOT_EXPORT_THIS_NAME';
  });
  await page.evaluate(() => window.NavigationShellV1.setMode('long'));
  await page.locator('#rc1BetaSupport').evaluate(el => { el.open = true; });
  await page.getByRole('button', { name: 'Проверить работу' }).click();
  await expect(page.locator('#rc1DiagnosticResults')).toBeVisible();
  await expect(page.locator('#rc1DiagnosticResults li[data-status="fail"]')).toHaveCount(0);
  const report = await page.evaluate(() => window.NutritionBetaSupportRC1.collect());
  expect(report.release_version).toBe('v5.3.210-rc2');
  expect(report.product_baseline).toBe('v5.3.210-pc2');
  expect(report.contains_user_content).toBe(false);
  expect(report.runtime.manifest_version).toBe('v5.3.210-rc2-hf15');
  expect(report.runtime.products_count).toBeGreaterThanOrEqual(1100);
  expect(report.server.reachable).toBe(true);
  expect(report.summary.FAIL).toBe(0);
  const serialized = JSON.stringify(report);
  expect(serialized).not.toContain('DO_NOT_EXPORT_THIS_VALUE');
  expect(serialized).not.toContain('DO_NOT_EXPORT_THIS_NAME');
  expect(report.privacy.excluded.length).toBeGreaterThanOrEqual(6);
});
