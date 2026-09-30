const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=back', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('is-hidden'), null, { timeout: 150000 });
  console.log('[smoke:reference-ui] model loaded');
  assert.match(await page.locator('h1').innerText(), /Анатомический тренажёр\s+Сергея Веснина/);
  await page.selectOption('#view-preset', 'back');
  await page.fill('#structure-search', 'трапециевидная');
  await page.locator('.search-result').first().click();
  const initialViewer = await page.locator('#viewer').boundingBox();
  assert.equal(await page.locator('#atlas-relations').isVisible(), true);
  assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
  assert.equal(await page.locator('#atlas-relations').evaluate(el => el.parentElement.id), 'atlas-relations-desktop-slot');
  await page.click('[data-quick-role="antagonists"]');
  await page.selectOption('#atlas-relations-part', 'lower');
  await page.selectOption('#atlas-relations-movement', { label: 'Опускание лопатки' });
  assert.match(await page.locator('#atlas-relations-list').innerText(), /верхние.*нисходящие/i);
  assert.equal(await page.locator('#functional-part').inputValue(), 'lower');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), 'antagonists');
  await page.selectOption('#atlas-relations-movement', { label: 'Вращение лопатки вверх' });
  await page.click('[data-quick-role="synergists"]');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), 'synergists');
  assert.match(await page.locator('#viewer').getAttribute('data-functional-subject-names'), /descending/i);
  assert.match(await page.locator('#viewer').getAttribute('data-functional-group-names'), /ascending/i);
  assert.equal(await page.locator('#reference-overview').isVisible(), true, 'Quick comparison must not require opening the reference Movement tab');
  const quickViewer = await page.locator('#viewer').boundingBox();
  assert.ok(Math.abs(initialViewer.height - quickViewer.height) <= 2);
  await page.locator('.panel').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: '/tmp/muscle-memory-quick-relations-desktop.png', fullPage: true });
  await page.click('#atlas-relations-close');
  console.log('[smoke:reference-ui] desktop quick comparison passed');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), '');
  assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
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
  console.log('[smoke:reference-ui] full reference passed');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('#atlas-relations').evaluate(el => el.parentElement.id), 'mobile-muscle-card');
  await page.click('[data-quick-role="synergists"]');
  await page.selectOption('#atlas-relations-movement', { label: 'Вращение лопатки вверх' });
  await page.locator('.stage').scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, 0));
  const quickGeometry = await page.evaluate(() => {
    const viewer = document.querySelector('#viewer').getBoundingClientRect();
    const menu = document.querySelector('#mobile-muscle-card').getBoundingClientRect();
    return { viewer: { top: viewer.top, bottom: viewer.bottom, height: viewer.height }, menu: { top: menu.top, bottom: menu.bottom }, height: innerHeight, width: innerWidth, pageWidth: document.documentElement.scrollWidth };
  });
  console.log('[smoke:reference-ui] mobile comparison geometry', JSON.stringify(quickGeometry));
  await page.screenshot({ path: '/tmp/muscle-memory-quick-relations-mobile.png', fullPage: false });
  assert.ok(quickGeometry.menu.top >= quickGeometry.viewer.bottom, 'Quick relations cover the mobile model');
  assert.ok(quickGeometry.viewer.height >= 260, 'Quick relations leave too little space for rotation');
  assert.ok(quickGeometry.menu.bottom <= quickGeometry.height + 30, 'Quick relations require leaving the model far behind');
  assert.ok(quickGeometry.pageWidth <= quickGeometry.width + 2);
  const highlightIds = await page.locator('#viewer').getAttribute('data-functional-group-ids');
  const mobileViewer = await page.locator('#viewer').boundingBox();
  const beforeRotation = await page.locator('#viewer').screenshot();
  await page.mouse.move(mobileViewer.x + mobileViewer.width * .45, mobileViewer.y + mobileViewer.height * .5);
  await page.mouse.down();
  await page.mouse.move(mobileViewer.x + mobileViewer.width * .7, mobileViewer.y + mobileViewer.height * .5, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  assert.notDeepEqual(await page.locator('#viewer').screenshot(), beforeRotation, 'The model does not rotate while quick comparison is open');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-ids'), highlightIds, 'Rotation clears the movement comparison');
  assert.equal(await page.locator('#atlas-relations-body').isVisible(), true);
  await page.screenshot({ path: '/tmp/muscle-memory-quick-relations-mobile.png', fullPage: false });
  await page.locator('#atlas-relations-movement').focus();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), '');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.click('[data-quick-role="antagonists"]');
  await page.evaluate(() => scrollTo(0, 0));
  const smallGeometry = await page.evaluate(() => ({
    width: innerWidth, pageWidth: document.documentElement.scrollWidth,
    viewer: document.querySelector('#viewer').getBoundingClientRect().bottom,
    menu: document.querySelector('#mobile-muscle-card').getBoundingClientRect().top,
  }));
  assert.ok(smallGeometry.pageWidth <= smallGeometry.width + 2);
  assert.ok(smallGeometry.menu >= smallGeometry.viewer);
  await page.click('[data-quick-role="antagonists"]');
  assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
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
  await page.click('[data-quick-role="synergists"]');
  await page.fill('#structure-search', 'широчайшая');
  await page.locator('.search-result').first().click();
  assert.equal(await page.locator('#atlas-relations-body').isHidden(), true, 'A new muscle keeps the previous comparison open');
  assert.equal(await page.locator('#viewer').getAttribute('data-functional-group-role'), '');
  assert.match(await page.locator('#question').innerText(), /широчайш/i);
  assert.deepEqual(errors, [], 'Reference UI produces browser exceptions');
  console.log('[smoke:reference-ui] quick roles + movements + parts + rotation + shared reference state + reversible highlights + desktop/mobile layout + reduced motion passed');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
