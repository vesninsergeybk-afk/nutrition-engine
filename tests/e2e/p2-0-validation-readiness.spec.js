const { test, expect } = require('./fixtures');

test('P2.0 keeps external validation pending across UI, runtime and report', async ({ page, loadApp }) => {
  await loadApp();
  await expect(page.locator('#p20ValidationStatus')).toBeAttached();
  await expect(page.locator('#p20ValidationTitle')).toContainText('ещё не завершена');
  await page.fill('#globalSearchInput', 'банан');
  await expect(page.locator('#globalResults button[data-role="add"]').first()).toBeVisible();
  await page.locator('#globalResults button[data-role="add"]').first().click();
  await page.click('[data-pc-mode="professional"]');
  await page.click('#pc1ConfirmComplete');
  await expect(page.locator('body')).toHaveClass(/pc1-analysis-complete/);
  await expect(page.locator('#p15AdvancedAnalysis')).toBeVisible();
  await page.locator('#p15AdvancedAnalysis > summary').click();
  await expect(page.locator('#p20ValidationStatus')).toBeVisible();
  const result = await page.evaluate(() => {
    const audit = window.NutritionValidationP20 && window.NutritionValidationP20.audit();
    const api = window.NutritionReportV5220 || window.NutritionReport;
    const model = api.buildReportModel({ force: true });
    const html = api.buildReportHtml(model);
    return {
      audit,
      hasSection: /Статус внешней проверки/.test(html),
      pending: /EXTERNAL_VALIDATION_PENDING/.test(html),
      explicitLimit: /Утверждение «клинически валидирован»[^.]*не разрешено/.test(html),
      modelClaimAllowed: !!(model.validationEvidence && model.validationEvidence.claimAllowed)
    };
  });
  expect(result.audit).toMatchObject({ ok: true, stageStatus: 'EXTERNAL_VALIDATION_PENDING', claimAllowed: false });
  expect(result).toMatchObject({ hasSection: true, pending: true, explicitLimit: true, modelClaimAllowed: false });
});
