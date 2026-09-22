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


async function saveUxAudit(page, name) {
  const dir = path.resolve(process.cwd(), 'reports/playwright-artifacts/ux-audit');
  fs.mkdirSync(dir, { recursive: true });
  const safe = name.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  await page.screenshot({ path: path.join(dir, safe + '.png'), fullPage: true });
  const metrics = await page.evaluate(() => {
    const visible = el => {
      if (!el) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && !el.hidden && r.width > 0 && r.height > 0;
    };
    const compact = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        cls: typeof el.className === 'string' ? el.className.slice(0, 180) : null,
        text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 140),
        position: s.position,
        z: s.zIndex,
        left: Math.round(r.left), top: Math.round(r.top),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        width: Math.round(r.width), height: Math.round(r.height)
      };
    };
    const all = [...document.querySelectorAll('body *')].filter(visible);
    const clipped = all.filter(el => el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0).slice(0, 40).map(compact);
    const positioned = all.filter(el => {
      const p = getComputedStyle(el).position;
      return p === 'fixed' || p === 'sticky';
    }).slice(0, 80).map(compact);
    const dialogs = [...document.querySelectorAll('dialog')].filter(visible).map(compact);
    const smallTargets = all.filter(el => /^(BUTTON|A|INPUT|SELECT|SUMMARY)$/.test(el.tagName)).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).slice(0, 60).map(compact);
    return {
      href: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight
      },
      theme: document.documentElement.getAttribute('data-theme'),
      shell: document.documentElement.getAttribute('data-navigation-shell'),
      route: document.documentElement.getAttribute('data-navigation-route'),
      dialogs,
      positioned,
      clipped,
      smallTargets
    };
  });
  fs.writeFileSync(path.join(dir, safe + '.json'), JSON.stringify(metrics, null, 2));
  return metrics;
}

async function fillAuditProfile(page) {
  await openNeeds(page);
  await page.selectOption('#needs_sex', 'male');
  await page.fill('#needs_age', '45');
  await page.fill('#needs_h', '175');
  await page.fill('#needs_w', '74');
  await page.selectOption('#needs_activity', 'low');
}

test('UX audit captures responsive profile and dialog states', async ({ page, loadApp, browserName }) => {
  const viewports = [
    { width: 360, height: 800, name: 'mobile-360' },
    { width: 390, height: 844, name: 'mobile-390' },
    { width: 768, height: 1024, name: 'tablet-768' },
    { width: 1440, height: 900, name: 'desktop-1440' }
  ];
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await loadApp();
    await waitForCheckpoint(page);
    const base = await saveUxAudit(page, browserName + '-' + vp.name + '-profile');
    expect(base.document.scrollWidth).toBeLessThanOrEqual(base.document.clientWidth + 1);

    const extraSettings = page.getByRole('button', { name: /Доп\. настройки/i });
    if (await extraSettings.count() && await extraSettings.first().isVisible()) {
      await extraSettings.first().click();
      await page.waitForTimeout(120);
      await saveUxAudit(page, browserName + '-' + vp.name + '-extra-settings');
    }

    const normHelp = page.locator('#normRegionHelpBtn');
    if (await normHelp.count() && await normHelp.isVisible()) {
      await normHelp.click();
      await expect(page.locator('#normRegionHelp')).toBeVisible();
      const modal = await saveUxAudit(page, browserName + '-' + vp.name + '-norm-help');
      expect(modal.dialogs.length).toBe(1);
      const d = modal.dialogs[0];
      expect(d.left).toBeGreaterThanOrEqual(-1);
      expect(d.right).toBeLessThanOrEqual(vp.width + 1);
      await page.locator('#normRegionHelp .norm-region-help-close').click();
    }

    const needsHelp = page.locator('#needsHelpBtn');
    if (await needsHelp.count() && await needsHelp.isVisible()) {
      await needsHelp.click();
      const opened = page.locator('dialog[open]').last();
      await expect(opened).toBeVisible();
      const modal = await saveUxAudit(page, browserName + '-' + vp.name + '-needs-help');
      expect(modal.dialogs.length).toBe(1);
      await page.keyboard.press('Escape');
    }
  }
});

test('UX audit captures completed profile, ration and analysis states', async ({ page, loadApp, browserName }) => {
  for (const vp of [
    { width: 390, height: 844, name: 'mobile-390' },
    { width: 768, height: 1024, name: 'tablet-768' },
    { width: 1440, height: 900, name: 'desktop-1440' }
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await loadApp();
    await waitForCheckpoint(page);
    await fillAuditProfile(page);
    const action = page.locator('#profileCalculateContinue');
    await expect(action).toBeVisible();
    await action.click();
    await page.waitForFunction(() => window.__lastNeedsMeta && window.__lastNeedsMeta.ok === true, null, { timeout: 30000 });
    await saveUxAudit(page, browserName + '-' + vp.name + '-profile-calculated');
    await page.evaluate(() => {
      if (window.NavigationShellV1 && typeof window.NavigationShellV1.navigate === 'function') {
        window.NavigationShellV1.navigate('ration');
      } else {
        location.hash = '#globalSearchSection';
        document.getElementById('globalSearchSection')?.scrollIntoView({ block: 'start' });
      }
    });
    await page.waitForTimeout(180);
    await saveUxAudit(page, browserName + '-' + vp.name + '-ration-empty');

    const search = page.locator('#globalSearchInput');
    if (await search.count() && await search.isVisible()) {
      await search.fill('банан');
      await page.waitForTimeout(180);
      await saveUxAudit(page, browserName + '-' + vp.name + '-ration-search');
      const add = page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
      if (await add.count() && await add.isVisible()) {
        await add.click();
        await page.waitForTimeout(180);
        await saveUxAudit(page, browserName + '-' + vp.name + '-ration-one-item');
      }
    }

    await page.evaluate(() => {
      if (window.NavigationShellV1 && typeof window.NavigationShellV1.navigate === 'function') {
        window.NavigationShellV1.navigate('analysis/overview');
      }
    });
    await page.waitForTimeout(180);
    await saveUxAudit(page, browserName + '-' + vp.name + '-analysis-overview');
  }
});
