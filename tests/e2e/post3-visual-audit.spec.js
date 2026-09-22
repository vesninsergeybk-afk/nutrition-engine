const { test, expect } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');

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
      window.NutritionNeedsCheckpointV1 &&
      window.__NEEDS_CHECKPOINT_MOUNTED__ &&
      html.getAttribute('data-navigation-shell') === 'long' &&
      visible(document.getElementById('needsCompact')) &&
      document.getElementById('profileCalculateContinue')
    );
  }, null, { timeout: 25000 });
}

async function waitForInterface(page) {
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

async function route(page, name) {
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

async function capture(page, name) {
  const dir = path.resolve(process.cwd(), 'reports/playwright-artifacts/post3-audit');
  fs.mkdirSync(dir, { recursive: true });
  const safe = name.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();

  const metrics = await page.evaluate(() => {
    const visible = el => {
      if (!el) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
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

async function fillProfile(page) {
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

const viewports = [
  { name:'mobile-390', width:390, height:844 },
  { name:'tablet-768', width:768, height:1024 },
  { name:'desktop-1440', width:1440, height:900 }
];

for (const vp of viewports) {
  test('post3 visual audit ' + vp.name, async ({ page, loadApp, browserName }) => {
    test.skip(browserName !== 'chromium', 'visual audit artifacts are captured once in Chromium');
    await page.setViewportSize({ width:vp.width, height:vp.height });
    await loadApp();
    await waitForCheckpoint(page);
    await waitForInterface(page);

    await capture(page, vp.name + '-initial-checkpoint');

    await route(page,'profile');
    await capture(page, vp.name + '-profile');

    const settings = page.locator('#interfaceSettingsPass1');
    if (await settings.count() && await settings.isVisible()) {
      await settings.click();
      await page.waitForTimeout(120);
      await capture(page, vp.name + '-profile-settings-open');
      await settings.click();
    }

    const help = page.locator('#needsHelpBtn');
    if (await help.count() && await help.isVisible()) {
      await help.click();
      const dialog = page.locator('dialog[open]').last();
      await expect(dialog).toBeVisible();
      const m = await capture(page, vp.name + '-profile-help');
      expect(m.dialogs.length).toBe(1);
      const d = m.dialogs[0];
      expect(d.left).toBeGreaterThanOrEqual(-1);
      expect(d.right).toBeLessThanOrEqual(vp.width + 1);
      expect(d.top).toBeGreaterThanOrEqual(-1);
      expect(d.bottom).toBeLessThanOrEqual(vp.height + 1);
      await page.keyboard.press('Escape');
    }

    if (vp.width === 390) {
      await fillProfile(page);
      await capture(page, vp.name + '-profile-calculated');
    }

    await route(page,'ration');
    await capture(page, vp.name + '-ration-empty');

    const search = page.locator('#globalSearchInput');
    if (await search.count() && await search.isVisible()) {
      await search.fill('банан');
      await page.waitForFunction(() => {
        const el=document.getElementById('globalResults');
        return el && el.classList.contains('has-query') && el.getBoundingClientRect().height>0;
      }, null, { timeout:10000 });
      await capture(page, vp.name + '-ration-search');
      await search.fill('');
    }

    await route(page,'analysis/overview');
    await capture(page, vp.name + '-analysis-overview');
  });
}
