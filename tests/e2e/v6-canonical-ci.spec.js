const { test, expect } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');

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


async function waitForPost3AuditReady(page) {
  await page.waitForFunction(() =>
    document.documentElement.getAttribute('data-interface-simplification') === '1' &&
    window.NutritionInterfaceSimplification &&
    window.__APP_BOOTSTRAP_META__ &&
    window.__APP_BOOTSTRAP_META__.status === 'ready' &&
    window.__RUNTIME_LOADER_CLOSED__ === true,
    null, { timeout: 30000 }
  );
  await page.waitForTimeout(300);
}

async function post3Route(page, name) {
  await page.evaluate(routeName => {
    if (!window.NavigationShellV1 || typeof window.NavigationShellV1.navigate !== 'function') {
      throw new Error('NavigationShellV1.navigate is unavailable');
    }
    window.NavigationShellV1.navigate(routeName);
  }, name);
  await page.waitForFunction(routeName =>
    document.documentElement.getAttribute('data-navigation-route') === routeName,
    name, { timeout: 10000 }
  );
  await page.waitForTimeout(180);
}

async function savePost3Audit(page, name) {
  const dir = path.resolve(process.cwd(), 'reports/playwright-artifacts/post3-audit');
  fs.mkdirSync(dir, { recursive: true });
  const safe = name.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  const metrics = await page.evaluate(() => {
    const visible = el => {
      if (!el) return false;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return !el.hidden && st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const compact = el => {
      const r = el.getBoundingClientRect();
      return {
        id: el.id || null,
        cls: typeof el.className === 'string' ? el.className.slice(0,160) : null,
        text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g,' ').slice(0,120),
        left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom),
        width: Math.round(r.width), height: Math.round(r.height),
        position: getComputedStyle(el).position,
        z: getComputedStyle(el).zIndex
      };
    };
    const all = [...document.querySelectorAll('body *')].filter(visible);
    return {
      viewport:{width:innerWidth,height:innerHeight},
      shell:document.documentElement.getAttribute('data-navigation-shell'),
      route:document.documentElement.getAttribute('data-navigation-route'),
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      scrollHeight:document.documentElement.scrollHeight,
      dialogs:[...document.querySelectorAll('dialog[open]')].filter(visible).map(compact),
      fixed:all.filter(el=>getComputedStyle(el).position==='fixed').slice(0,30).map(compact),
      clipped:all.filter(el=>el.clientWidth>0 && el.scrollWidth>el.clientWidth+2).slice(0,30).map(compact)
    };
  });
  fs.writeFileSync(path.join(dir, safe + '.json'), JSON.stringify(metrics, null, 2));
  await page.screenshot({ path:path.join(dir, safe + '.png'), fullPage:false });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  return metrics;
}

async function fillPost3AuditProfile(page) {
  const toggle = page.locator('#v40NeedsToggle');
  if (await toggle.count() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  await page.selectOption('#needs_sex','female');
  await page.fill('#needs_age','42');
  await page.fill('#needs_h','168');
  await page.fill('#needs_w','64');
  await page.selectOption('#needs_activity','moderate');
  const action = page.locator('#profileCalculateContinue');
  await expect(action).toBeVisible();
  await action.click();
  await page.waitForFunction(() => window.__lastNeedsMeta && window.__lastNeedsMeta.ok === true, null, { timeout:30000 });
  await page.waitForTimeout(220);
}

for (const vp of [
  { name:'mobile-390', width:390, height:844 },
  { name:'tablet-768', width:768, height:1024 },
  { name:'desktop-1440', width:1440, height:900 }
]) {
  test('post3 visual audit ' + vp.name, async ({ page, loadApp, browserName }) => {
    test.skip(browserName !== 'chromium', 'visual audit artifacts are captured once in Chromium');
    await page.setViewportSize({ width:vp.width, height:vp.height });
    await loadApp();
    await waitForCheckpoint(page);
    await waitForPost3AuditReady(page);

    await savePost3Audit(page, vp.name + '-initial-checkpoint');

    await post3Route(page,'profile');
    await savePost3Audit(page, vp.name + '-profile');

    const settings = page.locator('#interfaceSettingsPass1');
    if (await settings.count() && await settings.isVisible()) {
      await settings.click();
      await page.waitForTimeout(120);
      await savePost3Audit(page, vp.name + '-profile-settings-open');
      await settings.click();
    }

    const help = page.locator('#needsHelpBtn');
    if (await help.count() && await help.isVisible()) {
      await help.click();
      const dialog = page.locator('dialog[open]').last();
      await expect(dialog).toBeVisible();
      const m = await savePost3Audit(page, vp.name + '-profile-help');
      expect(m.dialogs.length).toBe(1);
      const d = m.dialogs[0];
      expect(d.left).toBeGreaterThanOrEqual(-1);
      expect(d.right).toBeLessThanOrEqual(vp.width + 1);
      expect(d.top).toBeGreaterThanOrEqual(-1);
      expect(d.bottom).toBeLessThanOrEqual(vp.height + 1);
      await page.keyboard.press('Escape');
    }

    if (vp.width === 390) {
      await fillPost3AuditProfile(page);
      await savePost3Audit(page, vp.name + '-profile-calculated');
    }

    await post3Route(page,'ration');
    await savePost3Audit(page, vp.name + '-ration-empty');

    const search = page.locator('#globalSearchInput');
    if (await search.count() && await search.isVisible()) {
      await search.fill('банан');
      await page.waitForFunction(() => {
        const el=document.getElementById('globalResults');
        return el && el.classList.contains('has-query') && el.getBoundingClientRect().height>0;
      }, null, { timeout:10000 });
      await savePost3Audit(page, vp.name + '-ration-search');
      await search.fill('');
    }

    await post3Route(page,'analysis/overview');
    await savePost3Audit(page, vp.name + '-analysis-overview');
  });
}
