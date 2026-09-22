const { test, expect } = require('./fixtures');

function captureRuntimeFailures(page) {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') failures.push(`console: ${msg.text()}`);
  });
  page.on('requestfailed', request => failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`));
  return failures;
}

async function waitForCurrentV6(page) {
  await page.waitForFunction(() =>
    window.NutritionThemeParityHotfix &&
    window.NutritionThemeParityHotfix.version === 'v6.0.0-beta6-hotfix4-theme-parity'
  );
}

test('canonical V6 Hotfix 4 boots with current navigation and design controls', async ({ page, loadApp }) => {
  const failures = captureRuntimeFailures(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCurrentV6(page);

  await expect(page.locator('html')).toHaveAttribute('data-ui-version', '6.0.0-beta6-hotfix4');
  await expect(page.locator('html')).toHaveAttribute('data-theme-parity-hotfix', '4');
  await expect(page.locator('#interfaceControlsBarHF2')).toBeVisible();
  await expect(page.locator('#workspaceViewSwitcher')).toBeVisible();
  await expect(page.locator('#themeSwitcher')).toBeVisible();
  await expect(page.locator('#themeSwitcher [data-theme-value]')).toHaveCount(3);
  await expect(page.locator('#workspaceViewSwitcher [data-workspace-view-mode]')).toHaveCount(2);

  const routes = await page.locator('#navigationShell .navigation-shell__items [data-navshell-route]').evaluateAll(nodes =>
    nodes.filter(node => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).map(node => node.getAttribute('data-navshell-route'))
  );
  expect(routes[0]).toBe('profile');
  expect(routes).toContain('ration');
  expect(routes).toContain('analysis/overview');
  expect(routes).toContain('correction');
  expect(routes).toContain('report');

  await page.waitForTimeout(250);
  expect(failures).toEqual([]);
});

test('mobile Sections and Canvas remain reversible without horizontal overflow', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCurrentV6(page);

  const canvas = page.locator('#workspaceViewSwitcher [data-workspace-view-mode="long"]');
  const sections = page.locator('#workspaceViewSwitcher [data-workspace-view-mode="workspace"]');
  await expect(canvas).toBeVisible();
  await expect(canvas).toBeEnabled();
  await expect(sections).toBeVisible();

  await canvas.click();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'long');
  await expect(page.locator('#navigationShellLongReturn')).toBeVisible();

  const longMetrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth
  }));
  expect(longMetrics.scroll).toBeLessThanOrEqual(longMetrics.client + 1);

  const returnButton = page.locator('[data-navshell-return-workspace]');
  if (await returnButton.isVisible()) await returnButton.click();
  else await sections.click();

  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'workspace');
  const workspaceMetrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth
  }));
  expect(workspaceMetrics.scroll).toBeLessThanOrEqual(workspaceMetrics.client + 1);
});

test('current needs flow calculates in profile, then allows explicit ration transition and return', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCurrentV6(page);

  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'profile');
  for (const selector of ['#needs_sex', '#needs_age', '#needs_h', '#needs_w', '#needs_activity']) {
    await expect(page.locator(selector)).toBeVisible();
  }

  await page.selectOption('#needs_sex', 'female');
  await page.fill('#needs_age', '42');
  await page.fill('#needs_h', '168');
  await page.fill('#needs_w', '64');
  await page.selectOption('#needs_activity', 'moderate');

  const action = page.locator('#profileCalculateContinue');
  await expect(action).toBeEnabled();
  await expect(action).toContainText(/Рассчитать|Пересчитать/i);
  await action.click();

  await page.waitForFunction(() => document.documentElement.getAttribute('data-profile-calculation-state') === 'current');
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'profile');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
  await expect(page.locator('#needs_print_btn')).toBeEnabled();
  await expect(page.locator('#needs_pdf_btn')).toBeEnabled();

  const next = page.locator('#workspaceProfileNext');
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'ration');

  await page.locator('#navigationShell [data-navshell-route="profile"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'profile');
  await expect(page.locator('#needs_age')).toHaveValue('42');
  await expect(page.locator('#needs_h')).toHaveValue('168');
  await expect(page.locator('#needs_w')).toHaveValue('64');
  await expect(page.locator('#needs_sex')).toHaveValue('female');
  await expect(page.locator('#needs_activity')).toHaveValue('moderate');
});

test('all three current themes remain user-selectable', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCurrentV6(page);

  for (const theme of ['modern', 'retro-2bit', 'ivory-brass']) {
    const button = page.locator(`#themeSwitcher [data-theme-value="${theme}"]`);
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
});
