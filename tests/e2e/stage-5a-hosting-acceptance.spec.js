const { test, expect } = require('@playwright/test');

const BASE = (process.env.NUTRITION_STAGING_URL || '').replace(/\/$/, '');
const UI_RELEASE = process.env.NUTRITION_EXPECTED_UI_RELEASE || 'v5.3.210-rc2-hf18';
const API_RELEASE = process.env.NUTRITION_EXPECTED_API_RELEASE || 'v5.3.210-rc2';
const VIEWPORTS = [[360,800],[390,844],[430,932],[768,1024],[1366,768],[1440,900]];

if (!BASE) throw new Error('NUTRITION_STAGING_URL is required');

async function openApp(page, suffix='') {
  const response = await page.goto(`${BASE}/index.html${suffix}`, { waitUntil:'networkidle' });
  expect(response && response.status()).toBe(200);
  await page.waitForFunction(() => {
    const calc = document.getElementById('needs_calc_btn');
    return !!window.__APP_BOOTSTRAP_META__ && !!window.NavigationShellV1 && !!window.State && !!window.DB &&
      !!calc && calc.getAttribute('data-needs-calculation-ready') === '1' && !calc.disabled;
  }, null, { timeout: 45_000 });
  await page.waitForTimeout(350);
}

async function calculateNeeds(page) {
  await page.fill('#needs_person_name','Иван Иванов');
  await page.selectOption('#needs_sex','male');
  await page.fill('#needs_h','175');
  await page.fill('#needs_w','74');
  await page.fill('#needs_age','45');
  await page.selectOption('#needs_state','normal');
  await page.selectOption('#needs_activity','low');
  await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await page.waitForFunction(() => window.__lastNeedsProfileApplied === true && !!window.__lastNeedsMeta, null, {timeout:20_000});
  await page.evaluate(() => window.NavigationShellV1.navigate('ration','globalSearchSection'));
}

async function addFromSearch(page, query, grams) {
  await page.fill('#globalSearchInput', query);
  const card = page.locator('#globalResults .search-result-card').filter({hasText:query.split(' ')[0]}).first();
  await expect(card).toBeVisible({timeout:15_000});
  const amount = card.locator('[data-role="grams"]');
  if (await amount.count()) await amount.fill(String(grams));
  const before = await page.evaluate(() => ({count:State.get().length, route:NavigationShellV1.getState().route}));
  await card.locator('button[data-role="add-search"],button[data-role="add"]').first().click();
  await page.waitForFunction(count => State.get().length === count + 1, before.count, {timeout:10_000});
  await page.waitForTimeout(550);
  return await page.evaluate(() => {
    const input = document.getElementById('globalSearchInput');
    const box = input.getBoundingClientRect();
    const nav = document.getElementById('navigationShell');
    const navBox = nav && nav.getBoundingClientRect();
    return {
      count: State.get().length,
      route: NavigationShellV1.getState().route,
      query: input.value,
      focused: document.activeElement === input,
      visible: box.top >= 0 && box.bottom <= innerHeight,
      covered: !!(navBox && getComputedStyle(nav).position === 'fixed' && box.bottom > navBox.top),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth
    };
  });
}

test.describe('Stage 5A real-hosting acceptance', () => {
  test('public surface, release identity and server protections are correct', async ({request}) => {
    const index = await request.get(`${BASE}/index.html`);
    expect(index.status()).toBe(200);
    const html = await index.text();
    expect(html).toContain(`data-runtime-manifest="${UI_RELEASE}"`);
    expect(html).toContain(`runtime-bundle-v5.3.210-rc2-hf18.css?v=${UI_RELEASE}`);
    const ih = index.headers();
    expect((ih['x-content-type-options'] || '').toLowerCase()).toBe('nosniff');
    expect((ih['x-robots-tag'] || '').toLowerCase()).toContain('noindex');

    const health = await request.get(`${BASE}/api/gemini.php`);
    expect(health.status()).toBe(200);
    const body = await health.json();
    expect(body.ok).toBe(true);
    expect(body.version).toBe(API_RELEASE);
    expect(body.csrf_token).toMatch(/^[a-f0-9]{64}$/);

    for (const path of ['/api/gemini-secret.php','/api/gemini-guard.php','/tests/','/tools/','/.git/HEAD','/hosting-check.html']) {
      const response = await request.get(`${BASE}${path}`);
      expect([403,404]).toContain(response.status());
    }
    const robots = await request.get(`${BASE}/robots.txt`);
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain('Disallow: /');
    const asset = await request.get(`${BASE}/assets/js/69-release-support-v5.3.210-rc2.js`);
    expect(asset.status()).toBe(200);
    expect((asset.headers()['cache-control'] || '')).toMatch(/max-age=31536000/i);
    expect((asset.headers()['cache-control'] || '')).toMatch(/immutable/i);
  });

  test('ordinary startup, real browser history and technical fallback roundtrip are stable', async ({page}) => {
    await openApp(page);
    await page.evaluate(() => localStorage.setItem('nutritionCalculator.navigationShell.mode.v2','long'));
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(() => !!window.NavigationShellV1 && NavigationShellV1.getState().mode === 'workspace');
    expect(await page.evaluate(() => localStorage.getItem('nutritionCalculator.navigationShell.mode.v2'))).toBeNull();

    await page.evaluate(() => NavigationShellV1.navigate('analysis/overview'));
    await expect(page).toHaveURL(/#analysis\/overview$/);
    await page.evaluate(() => NavigationShellV1.navigate('analysis/hei'));
    await expect(page).toHaveURL(/#analysis\/hei$/);
    await page.evaluate(() => NavigationShellV1.navigate('report'));
    await expect(page).toHaveURL(/#report$/);

    await page.goBack();
    await expect(page).toHaveURL(/#analysis\/hei$/);
    await expect(page.locator('html')).toHaveAttribute('data-navigation-route','analysis/hei');
    await page.goBack();
    await expect(page).toHaveURL(/#analysis\/overview$/);
    await page.goForward();
    await expect(page).toHaveURL(/#analysis\/hei$/);

    const before = await page.evaluate(() => ({history:history.length, route:NavigationShellV1.getState().route}));
    await page.evaluate(() => NavigationShellV1.setMode('long'));
    await expect(page).toHaveURL(/\?ui=long#heiPanel$/);
    await expect(page.locator('[data-navshell-return-workspace]')).toHaveCount(1);
    expect(await page.evaluate(() => history.length)).toBe(before.history);
    await page.locator('[data-navshell-return-workspace]').click();
    await expect(page).toHaveURL(/#analysis\/hei$/);
    expect(await page.evaluate(() => history.length)).toBe(before.history);
    expect(await page.evaluate(() => localStorage.getItem('nutritionCalculator.navigationShell.mode.v2'))).toBeNull();
  });

  test('daily workflow survives reload and keeps search context', async ({page}) => {
    await page.setViewportSize({width:390,height:844});
    await openApp(page);
    await calculateNeeds(page);
    const rows = [['сыр российский',100],['масло сливочное',40],['банан',160]];
    for (const [query, grams] of rows) {
      const after = await addFromSearch(page, query, grams);
      expect(after.route).toBe('ration');
      expect(after.query).toBe(query);
      expect(after.focused).toBeTruthy();
      expect(after.visible).toBeTruthy();
      expect(after.covered).toBeFalsy();
      expect(after.scrollWidth).toBeLessThanOrEqual(after.innerWidth);
      await expect(page.locator('#searchAddedToast [data-search-open-ration]')).toBeVisible();
    }
    const stateBefore = await page.evaluate(() => JSON.stringify(State.get()));
    const countBefore = await page.evaluate(() => State.get().length);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(count => !!window.State && State.get().length === count, countBefore, {timeout:45_000});
    expect(await page.evaluate(() => JSON.stringify(State.get()))).toBe(stateBefore);
    await page.evaluate(() => NavigationShellV1.navigate('ration','rationSection'));
    await expect(page.locator('#rationSection')).toBeVisible();
    const input = page.locator('#rationBody input[data-ration-ref]').first();
    await expect(input).toBeVisible();
    const oldValue = Number(await input.inputValue());
    await input.fill(String(oldValue + 17));
    await input.dispatchEvent('input');
    await page.waitForTimeout(400);
    expect(Number(await input.inputValue())).toBe(oldValue + 17);
  });

  test('full document becomes quiescent and remains accessible at accepted sizes', async ({page}) => {
    await openApp(page);
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      window.__allMutations = 0;
      window.__allObserver = new MutationObserver(list => window.__allMutations += list.length);
      window.__allObserver.observe(document.documentElement,{subtree:true,attributes:true,childList:true,characterData:true});
    });
    await page.waitForTimeout(3000);
    expect(await page.evaluate(() => window.__allMutations)).toBeLessThanOrEqual(2);

    for (const [width,height] of VIEWPORTS) {
      await page.setViewportSize({width,height});
      for (const route of ['ration','analysis/overview','analysis/nutrients','analysis/hei','correction','report','profile']) {
        await page.evaluate(r => NavigationShellV1.navigate(r), route);
        await page.waitForTimeout(100);
        const metrics = await page.evaluate(() => ({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
        expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner + 1);
      }
    }

    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => { document.documentElement.style.fontSize='200%'; });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth + 1));
    await page.evaluate(() => { document.documentElement.style.fontSize=''; });

    const accessibility = await page.evaluate(() => {
      const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
      const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
      const current=[...document.querySelectorAll('#navigationShell [aria-current=\"page\"]')].length;
      const unlabeled=[...document.querySelectorAll('button,input,select,textarea')].filter(el=>{
        if(el.disabled||el.hidden||getComputedStyle(el).display==='none')return false;
        return !((el.getAttribute('aria-label')||'').trim()||(el.textContent||'').trim()||el.labels&&el.labels.length||el.title);
      }).length;
      return {duplicates:[...new Set(duplicates)],current,unlabeled};
    });
    expect(accessibility.duplicates).toEqual([]);
    expect(accessibility.current).toBe(1);
    expect(accessibility.unlabeled).toBe(0);
  });

  test('report is printable on the actual HTTP origin', async ({page,browserName}) => {
    await openApp(page);
    await page.evaluate(() => NavigationShellV1.navigate('report'));
    await page.waitForFunction(() => !!(window.WorkspaceReportHF13 && WorkspaceReportHF13.getLastModel && WorkspaceReportHF13.getLastModel()), null, {timeout:20_000});
    await page.emulateMedia({media:'print'});
    const state = await page.evaluate(() => ({
      nav:getComputedStyle(document.getElementById('navigationShell')).display,
      fallback:getComputedStyle(document.getElementById('navigationShellLongReturn')).display,
      report:getComputedStyle(document.querySelector('.workspace-report-document')).display
    }));
    expect(state.nav).toBe('none');
    expect(state.fallback).toBe('none');
    expect(state.report).not.toBe('none');
    if (browserName === 'chromium') {
      const out = process.env.NUTRITION_STAGING_PDF || 'reports/stage-5a-hosting-print.pdf';
      const pdf = await page.pdf({format:'A4',printBackground:true,path:out});
      expect(pdf.length).toBeGreaterThan(10000);
    }
  });
});
