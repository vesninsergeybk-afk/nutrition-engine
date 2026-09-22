const { test, expect } = require('./fixtures');

async function openNeeds(page) {
  const toggle = page.locator('#v40NeedsToggle');
  if (await toggle.count() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}

function captureRuntimeFailures(page) {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') failures.push(`console: ${msg.text()}`);
  });
  page.on('requestfailed', request => failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`));
  return failures;
}

test('application loads with complete runtime and no browser errors', async ({ page, loadApp }) => {
  const failures = captureRuntimeFailures(page);
  await loadApp();
  await expect(page).toHaveTitle(/Калькулятор нутриентов/);
  await expect(page.locator('#navigationShellTitle')).toHaveText('Профиль и потребности');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('#needsCompact')).toBeVisible();
  await expect(page.locator('#globalSearchSection')).toBeHidden();
  await expect(page.locator('#needs_calc_btn')).toBeEnabled();
  await page.waitForTimeout(500);
  expect(failures).toEqual([]);
});

test('standard needs calculation remains functional', async ({ page, loadApp }) => {
  await loadApp();
  await openNeeds(page);
  await page.selectOption('#needs_sex', 'male');
  await page.fill('#needs_h', '180');
  await page.fill('#needs_w', '70');
  await page.fill('#needs_age', '35');
  await page.selectOption('#needs_state', 'normal');
  await page.selectOption('#needs_activity', 'low');
  await page.selectOption('#needs_edema', 'no');
  await page.selectOption('#needs_goal', 'maintain');
  await page.selectOption('#needs_guardrail', 'none');
  await page.click('#needs_calc_btn');
  await expect(page.locator('#needs_out')).toContainText(/ккал|Энерг/i);
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
  await expect(page.locator('#needs_print_btn')).toBeEnabled();
});

test('protected profile invalidates prior calculation and disables export', async ({ page, loadApp }) => {
  await loadApp();
  await openNeeds(page);
  await page.selectOption('#needs_sex', 'male');
  await page.fill('#needs_h', '180');
  await page.fill('#needs_w', '70');
  await page.fill('#needs_age', '35');
  await page.selectOption('#needs_state', 'normal');
  await page.selectOption('#needs_activity', 'low');
  await page.selectOption('#needs_edema', 'no');
  await page.selectOption('#needs_goal', 'maintain');
  await page.selectOption('#needs_guardrail', 'none');
  await page.click('#needs_calc_btn');
  await openNeeds(page);
  await page.selectOption('#needs_guardrail', 'pregnancy');
  await page.waitForTimeout(300);
  await expect(page.locator('#needs_out')).toContainText(/устарел/i);
  await expect(page.locator('#needs_print_btn')).toBeDisabled();
  await expect(page.locator('#needs_pdf_btn')).toBeDisabled();
  await expect(page.locator('#normInput-kcal')).toHaveValue('');
});

test('layout has no horizontal overflow on desktop and narrow mobile', async ({ page, loadApp }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport);
    await loadApp();
    const dimensions = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      body: document.body.scrollWidth
    }));
    expect(dimensions.doc, JSON.stringify({ viewport, dimensions })).toBeLessThanOrEqual(dimensions.client + 1);
    expect(dimensions.body, JSON.stringify({ viewport, dimensions })).toBeLessThanOrEqual(dimensions.client + 1);
  }
});

test('skip navigation and primary keyboard path work', async ({ page, loadApp }) => {
  await loadApp();
  await page.keyboard.press('Tab');
  const first = page.locator(':focus');
  await expect(first).toHaveClass(/skip-link/);
  await expect(first).toHaveAttribute('href', '#needs_person_name');
  await first.press('Enter');
  await expect(page.locator('#needs_person_name')).toBeInViewport();
  await page.locator('#needs_person_name').focus();
  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA', 'A']).toContain(focusedTag);
});
