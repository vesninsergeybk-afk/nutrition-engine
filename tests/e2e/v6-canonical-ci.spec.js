const { test, expect } = require('./fixtures');

function captureRuntimeFailures(page) {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // WebKit reports this standards limitation as a console error even though it
    // does not represent an application failure.
    if (text.includes("frame-ancestors") && text.toLowerCase().includes("meta")) return;
    failures.push(`console: ${text}`);
  });
  page.on('requestfailed', request => {
    const url = request.url();
    const reason = request.failure()?.errorText || '';
    // The runtime loader intentionally falls back from the compressed bundle
    // when a browser aborts the .gz fetch. loadApp() verifies that the fallback
    // completed, so this transport-level abort is not an application failure.
    if (url.includes('/assets/runtime/deferred-runtime-') && url.includes('.js.gz') &&
        /ERR_ABORTED|NS_BINDING_ABORTED|cancelled|canceled/i.test(reason)) return;
    failures.push(`requestfailed: ${url} ${reason}`);
  });
  return failures;
}

async function waitForCheckpoint(page) {
  await page.waitForFunction(() => {
    const html = document.documentElement;
    const visible = node => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    return Boolean(
      window.NutritionThemeParityHotfix &&
      window.NutritionThemeParityHotfix.version === 'v6.0.0-beta6-hotfix4-theme-parity' &&
      window.NutritionNeedsCheckpointV1 &&
      window.__NEEDS_CHECKPOINT_MOUNTED__ &&
      html.getAttribute('data-navigation-shell') === 'long' &&
      visible(document.getElementById('needsCompact')) &&
      visible(document.querySelector('.workflow-steps')) &&
      document.getElementById('profileCalculateContinue')
    );
  }, null, { timeout: 25000 });
}

async function openNeeds(page) {
  const toggle = page.locator('#v40NeedsToggle');
  if (await toggle.count() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  await expect(page.locator('#needs_sex')).toBeVisible();
}

test('canonical V6 needs checkpoint boots as one continuous canvas', async ({ page, loadApp }) => {
  const failures = captureRuntimeFailures(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCheckpoint(page);

  await expect(page.locator('html')).toHaveAttribute('data-ui-version', '6.0.0-beta6-hotfix4');
  await expect(page.locator('html')).toHaveAttribute('data-theme-parity-hotfix', '4');
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'long');
  await expect(page.locator('#navigationShellLongReturn')).toBeVisible();

  const workflow = page.locator('.workflow-steps a');
  await expect(workflow).toHaveCount(5);
  await expect(workflow.nth(0)).toContainText('Потребности');
  await expect(workflow.nth(1)).toContainText('Рацион');
  await expect(workflow.nth(2)).toContainText('Анализ');
  await expect(workflow.nth(3)).toContainText('Улучшить');
  await expect(workflow.nth(4)).toContainText('Отчёт');

  await expect(page.locator('#themeSwitcher')).toBeVisible();
  await expect(page.locator('#themeSwitcher [data-theme-value]')).toHaveCount(3);
  await page.waitForTimeout(250);
  expect(failures).toEqual([]);
});

test('mobile checkpoint opens at the needs step without horizontal overflow', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);

  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'long');
  await expect(page.locator('#needsCompact')).toBeVisible();
  await expect(page.locator('.workflow-steps')).toBeVisible();

  const state = await page.evaluate(() => {
    const needs = document.getElementById('needsCompact');
    const rect = needs && needs.getBoundingClientRect();
    return {
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      needsTop: rect && rect.top,
      hash: window.location.hash
    };
  });
  expect(state.scroll).toBeLessThanOrEqual(state.client + 1);
  expect(state.needsTop).not.toBeNull();
  expect(state.needsTop).toBeGreaterThanOrEqual(-2);
  expect(state.needsTop).toBeLessThanOrEqual(80);
  expect(state.hash).toBe('#needsCompact');
});

test('current needs checkpoint calculates and preserves the profile across steps', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await openNeeds(page);

  await page.selectOption('#needs_sex', 'female');
  await page.fill('#needs_age', '42');
  await page.fill('#needs_h', '168');
  await page.fill('#needs_w', '64');
  await page.selectOption('#needs_activity', 'moderate');

  const action = page.locator('#profileCalculateContinue');
  await expect(action).toBeVisible();
  await expect(action).toBeEnabled();
  await expect(action).toContainText(/Рассчитать|Пересчитать/i);
  await action.click();

  await page.waitForFunction(() =>
    window.__lastNeedsMeta &&
    window.__lastNeedsMeta.ok === true &&
    window.__lastNeedsMeta.personalProfile &&
    window.__lastNeedsMeta.personalProfile.mode === 'adult_nasem_checkpoint'
  );

  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'long');
  await expect(page.locator('#consultationNeedsSummary')).toBeVisible();
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
  await expect(page.locator('#needs_print_btn')).toBeEnabled();
  await expect(page.locator('#needs_pdf_btn')).toBeEnabled();

  await page.locator('.workflow-steps a[href="#globalSearchSection"]').click();
  await expect(page.locator('#globalSearchSection')).toBeVisible();
  await page.locator('.workflow-steps a[href="#needsCompact"]').click();
  await expect(page.locator('#needsCompact')).toBeVisible();

  await expect(page.locator('#needs_age')).toHaveValue('42');
  await expect(page.locator('#needs_h')).toHaveValue('168');
  await expect(page.locator('#needs_w')).toHaveValue('64');
  await expect(page.locator('#needs_sex')).toHaveValue('female');
  await expect(page.locator('#needs_activity')).toHaveValue('moderate');
});

test('all three current themes remain user-selectable in the checkpoint canvas', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCheckpoint(page);

  for (const theme of ['modern', 'retro-2bit', 'ivory-brass']) {
    const button = page.locator(`#themeSwitcher [data-theme-value="${theme}"]`);
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'long');
  }
});


async function waitForInterfacePass1(page) {
  await page.waitForFunction(() =>
    document.documentElement.getAttribute('data-interface-simplification') === '1' &&
    window.NutritionInterfaceSimplification &&
    window.__APP_BOOTSTRAP_META__ &&
    window.__APP_BOOTSTRAP_META__.status === 'ready' &&
    window.__RUNTIME_LOADER_CLOSED__ === true,
    null, { timeout: 30000 }
  );
}

test('mobile interface keeps secondary display controls behind one settings action', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  const settings = page.locator('#interfaceSettingsPass1');
  await expect(settings).toBeVisible();
  await expect(settings).toHaveText('Настройки');
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#workspaceViewSwitcher')).toBeHidden();
  await expect(page.locator('#themeSwitcher')).toBeHidden();
  await expect(page.locator('#mainContent > header > .toolbar')).toBeHidden();

  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#workspaceViewSwitcher')).toBeVisible();
  await expect(page.locator('#themeSwitcher')).toBeVisible();
  await expect(page.locator('#mainContent > header > .toolbar')).toBeVisible();

  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#themeSwitcher')).toBeHidden();
});

test('mobile ration starts with text search and keeps alternatives collapsed', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'workspace');
  await expect(page.locator('#globalSearchInput')).toBeVisible();

  const alternative = page.locator('#workspaceAltEntryMethods');
  await expect(alternative).toBeVisible();
  await expect(alternative).not.toHaveAttribute('open', '');
  await expect(alternative.locator('button[data-ration-entry-method]')).toHaveCount(3);

  const order = await page.evaluate(() => ({
    search: document.getElementById('globalSearchInput').getBoundingClientRect().top,
    alternatives: document.getElementById('workspaceAltEntryMethods').getBoundingClientRect().top
  }));
  expect(order.search).toBeLessThan(order.alternatives);

  await alternative.locator('summary').click();
  await expect(alternative).toHaveAttribute('open', '');
  await expect(alternative.locator('[data-ration-entry-method="photo"]')).toBeVisible();
  await expect(alternative.locator('[data-ration-entry-method="voice"]')).toBeVisible();
  await expect(alternative.locator('[data-ration-entry-method="audio"]')).toBeVisible();
});

test('mobile search results and help dialog stay inside their usable viewport', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  const search = page.locator('#globalSearchInput');
  await search.fill('банан');
  await page.waitForFunction(() => {
    const results = document.getElementById('globalResults');
    return results && results.classList.contains('has-query') && results.getBoundingClientRect().height > 0;
  });

  const geometry = await page.evaluate(() => {
    const results = document.getElementById('globalResults').getBoundingClientRect();
    const nav = document.getElementById('navigationShell').getBoundingClientRect();
    return {
      resultsBottom: results.bottom,
      navTop: nav.top,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    };
  });
  expect(geometry.resultsBottom).toBeLessThanOrEqual(geometry.navTop + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  await page.evaluate(() => window.NavigationShellV1.navigate('profile'));
  const help = page.locator('#needsHelpNeedsBtn');
  await expect(help).toBeVisible();
  await help.click();
  const dialog = page.locator('dialog[open]').last();
  await expect(dialog).toBeVisible();

  const dialogGeometry = await dialog.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
  });
  expect(dialogGeometry.left).toBeGreaterThanOrEqual(7);
  expect(dialogGeometry.right).toBeLessThanOrEqual(383);
  expect(dialogGeometry.top).toBeGreaterThanOrEqual(7);
  expect(dialogGeometry.bottom).toBeLessThanOrEqual(837);

  await dialog.locator('.close-btn').click();
  await expect(dialog).toBeHidden();
});
