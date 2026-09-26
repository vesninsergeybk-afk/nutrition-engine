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
    // Product loading has the same intentional recovery chain: compressed JSON
    // -> reviewed bundle -> script chunks -> JSON chunks -> embedded fallback.
    // Chromium can abort the gzip request even though the next source succeeds.
    if (url.includes('/assets/data/products.') && url.includes('.compact.json.gz') &&
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
  await waitForInterfacePass1(page);
  const field = page.locator('#needs_sex');
  if (await field.isVisible()) return;
  const toggle = page.locator('#v40NeedsToggle');
  if (await toggle.count()) await toggle.click();
  await expect(field).toBeVisible({ timeout: 12000 });
}

test('canonical V6 needs checkpoint boots as one continuous canvas', async ({ page, loadApp }) => {
  const failures = captureRuntimeFailures(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

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

  await expect(page.locator('#themeSwitcher')).toBeHidden();
  await expect(page.locator('#interfaceSettingsPass1')).toBeVisible();

  const loaderOverlay = page.locator('#runtimeBootStatusOverlay');
  if (await loaderOverlay.count()) {
    await expect(loaderOverlay).toHaveAttribute('aria-hidden', 'true');
  }
  await page.locator('#interfaceSettingsPass1').click();
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

test('immediate move to ration after needs calculation is not undone by delayed profile recovery', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await openNeeds(page);

  await page.selectOption('#needs_sex', 'female');
  await page.fill('#needs_age', '42');
  await page.fill('#needs_h', '168');
  await page.fill('#needs_w', '64');
  await page.selectOption('#needs_activity', 'moderate');

  await page.evaluate(() => {
    window.__needsImmediateRationProbe = false;
    document.addEventListener('needs:computed', () => {
      window.NavigationShellV1.navigate('ration');
      window.__needsImmediateRationProbe = true;
    }, { once: true });
  });

  await page.locator('#profileCalculateContinue').click();
  await page.waitForFunction(() => window.__needsImmediateRationProbe === true);
  await page.waitForTimeout(250);

  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'workspace');
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'ration');
  await expect(page.locator('#globalSearchInput')).toBeVisible();
});

test('all three current themes remain user-selectable in the checkpoint canvas', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  // The switcher is reachable through the settings action rather than always on screen.
  const settingsToggle = page.locator('#interfaceSettingsPass1');
  await expect(settingsToggle).toBeVisible();
  if ((await settingsToggle.getAttribute('aria-expanded')) !== 'true') await settingsToggle.click();
  await expect(page.locator('#themeSwitcher')).toBeVisible();

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
  const viewSwitcher = page.locator('#workspaceViewSwitcher');
  if (await viewSwitcher.count()) await expect(viewSwitcher).toBeHidden();
  await expect(page.locator('#themeSwitcher')).toBeHidden();
  await expect(page.locator('#mainContent > header > .toolbar')).toBeHidden();

  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'true');
  if (await viewSwitcher.count()) await expect(viewSwitcher).toBeVisible();
  await expect(page.locator('#themeSwitcher')).toBeVisible();
  await expect(page.locator('#mainContent > header > .toolbar')).toBeVisible();

  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#themeSwitcher')).toBeHidden();
});

test('desktop workspace exposes only the canonical settings control', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'workspace');
  await expect(page.locator('#interfaceSettingsPass1')).toBeVisible();
  await expect(page.locator('#interfaceSettingsPass1')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#themeSwitcher')).toBeHidden();
  await expect(page.locator('#interfaceSettingsHF2')).toBeHidden();
  await expect(page.locator('#navigationShell [data-navshell-settings-toggle]')).toBeHidden();
});

test('collapsed settings stay collapsed across workspace route changes', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  const routes = ['profile', 'ration', 'analysis/overview', 'analysis/nutrients', 'analysis/hei', 'correction', 'report'];
  for (const route of routes) {
    await page.evaluate(name => window.NavigationShellV1.navigate(name), route);
    await page.waitForTimeout(180);
    await expect(page.locator('#interfaceSettingsPass1')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#themeSwitcher')).toBeHidden();
  }

  await page.locator('#interfaceSettingsPass1').click();
  await expect(page.locator('#interfaceSettingsPass1')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#themeSwitcher')).toBeVisible();
});

test('finished runtime loader stays hidden across workspace route changes', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  const routes = ['ration', 'analysis/overview', 'analysis/nutrients', 'analysis/hei', 'correction', 'report'];
  for (const route of routes) {
    await page.evaluate(name => window.NavigationShellV1.navigate(name), route);
    await page.waitForTimeout(350);
    const overlay = page.locator('#runtimeBootStatusOverlay');
    if (await overlay.count()) {
      await expect(overlay).toHaveAttribute('aria-hidden', 'true');
      await expect(overlay).toHaveClass(/hide/);
    }
  }
});

test('861-899px seam uses the desktop shell without mobile search overlay', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 880, height: 900 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  const nav = page.locator('#navigationShell');
  await expect(nav).toBeVisible();

  const navGeometry = await nav.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, top: rect.top, bottom: rect.bottom, height: rect.height };
  });
  expect(navGeometry.top).toBeLessThan(300);
  expect(navGeometry.height).toBeGreaterThan(200);

  const search = page.locator('#globalSearchInput');
  await search.fill('банан');
  await page.waitForFunction(() => {
    const results = document.getElementById('globalResults');
    return results && results.classList.contains('has-query') && results.getBoundingClientRect().height > 0;
  });

  const geometry = await page.evaluate(() => {
    const results = document.getElementById('globalResults');
    const searchSection = document.getElementById('globalSearchSection');
    const rr = results.getBoundingClientRect();
    const sr = searchSection.getBoundingClientRect();
    return {
      position: getComputedStyle(results).position,
      resultsLeft: rr.left,
      resultsRight: rr.right,
      sectionLeft: sr.left,
      sectionRight: sr.right,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    };
  });
  expect(geometry.position).not.toBe('fixed');
  expect(geometry.resultsLeft).toBeGreaterThanOrEqual(geometry.sectionLeft - 1);
  expect(geometry.resultsRight).toBeLessThanOrEqual(geometry.sectionRight + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
});

test('mobile ration has no painted empty strip between route context and search', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);
  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));

  const gapElements = await page.evaluate(() => {
    const context = document.getElementById('navigationShellContext');
    const search = document.getElementById('globalSearchSection');
    if (!context || !search) return [{ error: 'missing anchors' }];
    const a = context.getBoundingClientRect();
    const b = search.getBoundingClientRect();
    return Array.from(document.querySelectorAll('body *')).map(node => {
      const rect = node.getBoundingClientRect();
      const cs = getComputedStyle(node);
      const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        cs.backgroundImage !== 'none' ||
        parseFloat(cs.borderTopWidth) > 0 ||
        parseFloat(cs.borderBottomWidth) > 0 ||
        cs.boxShadow !== 'none';
      return {
        node,
        rect,
        cs,
        painted
      };
    }).filter(x =>
      x.painted &&
      x.cs.display !== 'none' &&
      x.cs.visibility !== 'hidden' &&
      x.rect.width > 100 &&
      x.rect.height > 3 &&
      x.rect.top >= a.bottom - 1 &&
      x.rect.bottom <= b.top + 1
    ).map(x => ({
      tag: x.node.tagName,
      id: x.node.id || '',
      cls: typeof x.node.className === 'string' ? x.node.className : '',
      top: Math.round(x.rect.top),
      bottom: Math.round(x.rect.bottom),
      width: Math.round(x.rect.width),
      height: Math.round(x.rect.height),
      background: x.cs.backgroundColor,
      borderTop: x.cs.borderTop,
      borderBottom: x.cs.borderBottom,
      radius: x.cs.borderRadius,
      shadow: x.cs.boxShadow
    }));
  });

  expect(gapElements, JSON.stringify(gapElements, null, 2)).toEqual([]);
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
  await expect(page.locator('#workspaceRationSecondary')).toBeHidden();
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

test('mobile workspace keeps compact header rhythm and finger-sized ration helpers', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('#interfaceSettingsPass1')).toBeVisible();
  await expect(page.locator('#workspacePersonEdit')).toBeVisible();
  await expect(page.locator('#workspaceFocusSearch')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const visible = node => {
      if (!node) return false;
      const cs = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      return !node.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const settings = document.getElementById('interfaceSettingsPass1').getBoundingClientRect();
    const context = document.getElementById('navigationShellContext').getBoundingClientRect();
    const person = document.getElementById('workspacePersonEdit').getBoundingClientRect();
    const focus = document.getElementById('workspaceFocusSearch').getBoundingClientRect();
    const helpers = Array.from(document.querySelectorAll('.quick-searches button, .quick-grams button'))
      .filter(visible)
      .map(node => node.getBoundingClientRect().height);
    return {
      headerGap: Math.round(context.top - settings.bottom),
      personHeight: person.height,
      focusHeight: focus.height,
      helperHeights: helpers
    };
  });

  expect(geometry.headerGap).toBeLessThanOrEqual(36);
  expect(geometry.personHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.focusHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.helperHeights.length).toBeGreaterThan(0);
  expect(Math.min(...geometry.helperHeights)).toBeGreaterThanOrEqual(44);
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
  const help = page.locator('#needsHelpBtn');
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


test('mobile workspace removes duplicate profile chrome without losing profile access', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'workspace');

  const back = page.locator('#workspaceProfileBackAction');
  if (await back.count()) await expect(back).toBeHidden();

  const person = page.locator('#workspacePersonContext');
  await expect(person).toBeVisible();
  await expect(person.locator('#workspacePersonEdit')).toBeVisible();
  await expect(person.locator('.workspace-person-context__targets')).toBeHidden();
  await expect(page.locator('#navigationShellContext .navigation-shell-context__copy p')).toBeHidden();

  await page.evaluate(() => window.NavigationShellV1.navigate('profile'));
  await expect(page.locator('#needs .section-title-row h1')).toBeVisible();
});


test('mobile profile uses one heading surface and removes the orphaned name wrapper', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('profile'));
  await expect(page.locator('html')).toHaveAttribute('data-navigation-shell', 'workspace');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-profile-hierarchy') === 'v2');

  await expect(page.locator('#navigationShellContext')).toBeHidden();
  await expect(page.locator('#needs .section-title-row h1')).toBeVisible();
  await expect(page.locator('#needsHelpBtn')).toBeVisible();

  const orphan = page.locator('#needs > .row:first-child > .row');
  if (await orphan.count()) await expect(orphan).toBeHidden();

  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator('#navigationShellContext')).toBeVisible();
});


test('empty ration prioritizes adding the first product and restores analytics after data appears', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration', 'empty');

  await expect(page.locator('#workspaceFocusSearch')).toBeVisible();
  await expect(page.locator('#workspaceRationAttention')).toBeHidden();
  await expect(page.locator('.workspace-ration-inline__metrics')).toBeHidden();
  await expect(page.locator('#workspaceOpenRation')).toBeHidden();
  const rationAnalytics = page.locator('.theme-parity-ration-hf4');
  if (await rationAnalytics.count()) await expect(rationAnalytics).toBeHidden();

  const geometry = await page.evaluate(() => {
    const search = document.getElementById('globalSearchInput').getBoundingClientRect();
    return { searchTop: Math.round(search.top), viewportHeight: window.innerHeight };
  });
  expect(geometry.searchTop).toBeLessThan(geometry.viewportHeight * 1.5);

  const search = page.locator('#globalSearchInput');
  await search.fill('банан');
  await page.waitForFunction(() => {
    const el = document.getElementById('globalResults');
    return el && el.classList.contains('has-query') && el.getBoundingClientRect().height > 0;
  }, null, { timeout: 10000 });
  const add = page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
  await expect(add).toBeVisible();
  await add.click();

  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration', 'filled', { timeout: 10000 });
  await expect(page.locator('#workspaceRationAttention')).toBeVisible();
  await expect(page.locator('.workspace-ration-inline__metrics')).toBeVisible();
  await expect(page.locator('#workspaceOpenRation')).toBeVisible();
  if (await rationAnalytics.count()) await expect(rationAnalytics).toBeVisible();
});


test('empty analysis overview stays concise and restores the full dashboard after the first product', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/overview'));
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration', 'empty');
  await expect(page.locator('#workspaceOverviewPanel')).toBeVisible();
  await expect(page.locator('#workspaceOverviewConclusion')).toContainText('Добавьте продукты');

  const commandCenter = page.locator('#analysisCommandCenterHF3');
  if (await commandCenter.count()) await expect(commandCenter).toBeHidden();
  await expect(page.locator('#dietAnalysisProfilePanel')).toBeHidden();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__metrics')).toBeHidden();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__issues')).toBeHidden();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__quality')).toBeHidden();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__actions')).toBeHidden();

  const rationAction = page.locator('#workspaceOverviewPanel .workspace-overview__head [data-workspace-route="ration"]');
  await expect(rationAction).toBeVisible();

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  const search = page.locator('#globalSearchInput');
  await search.fill('банан');
  await page.waitForFunction(() => {
    const el = document.getElementById('globalResults');
    return el && el.classList.contains('has-query') && el.getBoundingClientRect().height > 0;
  }, null, { timeout: 10000 });
  const add = page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration', 'filled', { timeout: 10000 });

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/overview'));
  if (await commandCenter.count()) await expect(commandCenter).toBeVisible();
  await expect(page.locator('#dietAnalysisProfilePanel')).toBeVisible();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__metrics')).toBeVisible();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__issues')).toBeVisible();
  await expect(page.locator('#workspaceOverviewPanel .workspace-overview__actions')).toBeVisible();
});


test('empty nutrient and HEI routes do not turn missing data into zero scores', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/nutrients'));
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration', 'empty');
  await expect(page.locator('#workspaceNutrientGuidance')).toContainText('Рацион пока пуст');
  await expect(page.locator('#workspaceNutrientAttentionCount')).toHaveText('—');
  await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-summary')).toBeHidden();
  await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-toolbar')).toBeHidden();
  await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-actions')).toBeHidden();

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/hei'));
  await expect(page.locator('#workspaceHeiTotal')).toHaveText('—');
  await expect(page.locator('#workspaceHeiGrade')).toHaveText('нет расчёта');
  await expect(page.locator('#workspaceHeiAttentionCount')).toHaveText('—');
  await expect(page.locator('#workspaceHeiPanel .workspace-analysis-summary')).toBeHidden();
  await expect(page.locator('#workspaceHeiPanel .workspace-guardrails')).toBeHidden();
  await expect(page.locator('#workspaceHeiPanel .workspace-analysis-toolbar')).toBeHidden();
  await expect(page.locator('#workspaceHeiPanel .workspace-analysis-actions')).toBeHidden();
  await expect(page.locator('#workspaceHeiDashboardHF2')).toBeHidden();
  await expect(page.locator('#workspaceHeiPanel [data-hf2-hei-key]:visible')).toHaveCount(0);

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  const search = page.locator('#globalSearchInput');
  await search.fill('банан');
  await page.waitForFunction(() => {
    const el = document.getElementById('globalResults');
    return el && el.classList.contains('has-query') && el.getBoundingClientRect().height > 0;
  }, null, { timeout: 10000 });
  const add = page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration', 'filled', { timeout: 10000 });

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/nutrients'));
  await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-summary')).toBeVisible();
  await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-toolbar')).toBeVisible();

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/hei'));
  await expect(page.locator('#workspaceHeiTotal')).not.toHaveText('—');
  await expect(page.locator('#workspaceHeiPanel .workspace-analysis-summary')).toBeVisible();
  await expect(page.locator('#workspaceHeiPanel .workspace-analysis-toolbar')).toBeVisible();
});

test('empty report does not present missing ration data as measured zeros', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);

  await page.evaluate(() => window.NavigationShellV1.navigate('report'));
  await page.waitForFunction(() =>
    window.WorkspaceReportHF13 &&
    window.WorkspaceReportHF13.getLastModel &&
    window.WorkspaceReportHF13.getLastModel() &&
    document.querySelector('#workspaceReportPreview .workspace-report-document')
  );
  await page.waitForFunction(() =>
    window.WorkspaceReportHF13 &&
    window.WorkspaceReportHF13.__emptySemanticPatch === 'v6-ui-audit-2026-09-25'
  );

  const model = await page.evaluate(() => {
    const m = window.WorkspaceReportHF13.getLastModel();
    return { rationCount: m.ration.count, heiAvailable: m.hei.available };
  });
  expect(model.rationCount).toBe(0);
  expect(model.heiAvailable).toBe(false);

  const preview = page.locator('#workspaceReportPreview');
  await expect(preview).toContainText('Рацион пока пуст');
  await expect(preview).not.toContainText('0/100');
  await expect(preview.locator('.workspace-report-mobile-row')).toHaveCount(0);

  const energy = preview.locator('.workspace-report-cover .workspace-report-kv').filter({ hasText: 'Энергия' });
  const hei = preview.locator('.workspace-report-cover .workspace-report-kv').filter({ hasText: 'HEI' });
  await expect(energy.locator('strong')).toHaveText('—');
  await expect(hei.locator('strong')).toHaveText('не рассчитан');
  await expect(preview).toContainText('Нет данных для анализа нутриентов');
});


test('Release 1 restores semantic analysis context through ration, browser history and reload', async ({ page, loadApp }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await loadApp();
  await waitForCheckpoint(page);
  await waitForInterfacePass1(page);
  await page.waitForFunction(() =>
    window.NutritionNavigationAccessHotfix &&
    window.NutritionNavigationAccessHotfix.version === 'release1-navigation-reversibility-2026-09-26'
  );

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await page.waitForFunction(() => window.State && window.DB && Array.isArray(window.DB.items) && window.DB.items.length > 10);

  await page.evaluate(() => {
    const first = window.DB.items.find(p => p && p.key);
    if (!first) throw new Error('No product available for Release 1 setup');
    window.State.add(first.key, 150);
  });
  await page.waitForFunction(() => window.State.get().length >= 1);

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/nutrients'));
  await page.waitForFunction(() =>
    window.NutritionAnalysisWorkspaceHF7 &&
    window.NutritionAnalysisWorkspaceHF7.getViewModel &&
    window.NutritionAnalysisWorkspaceHF7.getViewModel().nutrients.length > 0
  );

  const target = await page.evaluate(() => {
    const api = window.NutritionAnalysisWorkspaceHF7;
    const rows = api.getViewModel().nutrients || [];
    let row = rows.find(x => x && x.group === 'vitamins' && x.key);
    if (!row) row = rows.find(x => x && x.key);
    if (!row) throw new Error('No nutrient row available');
    api.openNutrient(row.key);
    return { id: 'workspaceNutrientRow-' + row.key, key: row.key, title: row.title || row.key };
  });

  await page.waitForFunction(id => {
    const el = document.getElementById(id);
    return document.documentElement.getAttribute('data-navigation-route') === 'analysis/nutrients' &&
      el && el.getBoundingClientRect().height > 0;
  }, target.id);

  await page.waitForTimeout(250);
  const before = await page.evaluate(() => ({
    filters: window.NutritionAnalysisWorkspaceHF7.getFilters(),
    semantic: window.history.state && window.history.state.navigationSemantic,
    apiContext: window.NutritionNavigationAccessHotfix.getSemanticContext()
  }));
  expect(before.semantic).toBeTruthy();
  expect(before.semantic.context.route).toBe('analysis/nutrients');
  expect(before.apiContext.targetId).toContain('workspaceNutrientRow-');

  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'ration');
  await expect(page.locator('#navigationSemanticReturn')).toBeVisible();
  await expect(page.locator('[data-navigation-semantic-return]')).toContainText(/Вернуться/);

  await page.evaluate(() => {
    const used = new Set(window.State.get().map(x => x.key || x.id));
    const next = window.DB.items.find(p => p && p.key && !used.has(p.key));
    if (next) window.State.add(next.key, 80);
  });
  await page.waitForTimeout(250);

  await page.locator('[data-navigation-semantic-return]').click();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'analysis/nutrients');
  await page.waitForFunction(id => {
    const el = document.getElementById(id);
    return el && el.getBoundingClientRect().height > 0;
  }, target.id);

  const afterReturn = await page.evaluate(() => window.NutritionAnalysisWorkspaceHF7.getFilters());
  expect(afterReturn.nutrientGroup).toBe(before.filters.nutrientGroup);
  expect(afterReturn.nutrientFilter).toBe(before.filters.nutrientFilter);

  await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'ration');
  await expect(page.locator('#navigationSemanticReturn')).toBeVisible();

  await page.goForward();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route', 'analysis/nutrients');
  await page.waitForFunction(id => {
    const el = document.getElementById(id);
    return el && el.getBoundingClientRect().height > 0;
  }, target.id);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    window.__RUNTIME_LOADER_CLOSED__ === true &&
    window.NutritionNavigationAccessHotfix &&
    window.NutritionNavigationAccessHotfix.version === 'release1-navigation-reversibility-2026-09-26'
  , null, { timeout: 70000 });

  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/nutrients'));
  await page.waitForFunction(id => {
    const el = document.getElementById(id);
    return el && el.getBoundingClientRect().height > 0;
  }, target.id, { timeout: 15000 });

  const afterReload = await page.evaluate(() => ({
    filters: window.NutritionAnalysisWorkspaceHF7.getFilters(),
    context: window.NutritionNavigationAccessHotfix.getSemanticContext()
  }));
  expect(afterReload.filters.nutrientGroup).toBe(before.filters.nutrientGroup);
  expect(afterReload.filters.nutrientFilter).toBe(before.filters.nutrientFilter);
  expect(afterReload.context.targetId).toBe(target.id);
});
