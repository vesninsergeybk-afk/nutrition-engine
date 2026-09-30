const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=back', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('is-hidden'), null, { timeout: 150000 });
  assert.match(await page.locator('h1').innerText(), /Анатомический тренажёр\s+Сергея Веснина/);
  await page.selectOption('#view-preset', 'back');
  await page.fill('#structure-search', 'трапециевидная');
  await page.locator('.search-result').first().click();
  const initialViewer = await page.locator('#viewer').boundingBox();
  assert.equal(await page.locator('#reference-overview').isVisible(), true);
  assert.equal(await page.locator('#structure-reference-actions').isVisible(), true);
  await page.click('#reference-tab-movement');
  assert.equal(await page.locator('#structure-reference-context').isHidden(), true);
  await page.selectOption('#functional-part', 'lower');
  await page.selectOption('#functional-movement', { label: 'Опускание лопатки' });
  await page.click('button[data-functional-role="antagonists"]');
  assert.match(await page.locator('#structure-reference-functional').innerText(), /верхние.*нисходящие/i);
  await page.click('#functional-show-group');
  assert.ok((await page.locator('#functional-model-status').innerText()).length > 0);
  await page.selectOption('#functional-movement', { label: 'Вращение лопатки вверх' });
  assert.equal(await page.locator('#functional-show-group').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), '');
  await page.click('button[data-functional-role="synergists"]');
  assert.match(await page.locator('#structure-reference-functional').innerText(), /верхние.*нисходящие/i);
  await page.click('#functional-show-group');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), 'synergists');
  assert.match(await page.locator('#viewer').getAttribute('data-functional-subject-names'), /descending/i);
  assert.match(await page.locator('#viewer').getAttribute('data-functional-group-names'), /ascending/i);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: '/tmp/muscle-memory-reference-ui-desktop.png', fullPage: true });
  await page.click('#reference-tab-detail');
  assert.equal(await page.locator('#structure-reference-origin').isVisible(), true);
  assert.equal(await page.locator('#structure-reference-innervation').isVisible(), true);
  assert.equal(await page.locator('#structure-reference-sources').isVisible(), true);
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), '');
  const detailViewer = await page.locator('#viewer').boundingBox();
  assert.ok(Math.abs(initialViewer.height - detailViewer.height) <= 2, 'Reference content resizes the desktop anatomy workspace');
  await page.locator('#reference-tab-detail').focus();
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#reference-tab-overview').getAttribute('aria-selected'), 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('#reference-overview').evaluate(el => getComputedStyle(el).animationName), 'none');

  // A selected reference remains below the touch workspace, including its tabs.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#reference-tab-movement');
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    width: document.documentElement.scrollWidth,
    viewer: document.querySelector('#viewer').getBoundingClientRect().bottom,
    panel: document.querySelector('.panel').getBoundingClientRect().top,
    tabs: document.querySelector('.reference-tabs').getBoundingClientRect().top,
  }));
  assert.ok(geometry.width <= geometry.viewport + 2, 'Reference introduces mobile horizontal overflow');
  assert.ok(geometry.panel >= geometry.viewer - 2, 'Reference covers the mobile anatomy canvas');
  assert.ok(geometry.tabs >= geometry.viewer - 2, 'Reference tabs cover the mobile anatomy canvas');
  for (const selector of ['#reference-tab-overview', 'button[data-functional-role="synergists"]', '#functional-show-group']) {
    const box = await page.locator(selector).boundingBox();
    assert.ok(box?.height >= 44, selector + ' is too small for touch');
  }
  await page.screenshot({ path: '/tmp/muscle-memory-reference-ui-mobile.png', fullPage: true });
  assert.deepEqual(errors, [], 'Reference UI produces browser exceptions');
  console.log('[smoke:reference-ui] tabs + functional parts + reversible highlights + fixed desktop viewer + mobile layout + reduced motion passed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
