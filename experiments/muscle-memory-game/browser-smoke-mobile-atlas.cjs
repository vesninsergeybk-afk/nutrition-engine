const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:mobile-atlas] start');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=shoulder', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden'),
    null,
    { timeout: 150000 }
  );

  assert.equal(await page.locator('#mode-explore').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#learning-region').inputValue(), 'shoulder');
  assert.equal(await page.locator('#viewer').getAttribute('data-region-isolation'), 'true');
  assert.equal(await page.locator('#viewer').getAttribute('data-camera-scope'), 'regional');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'xray');

  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    overflow.scrollWidth <= overflow.viewport + 2,
    'Mobile atlas has horizontal page overflow: ' + JSON.stringify(overflow)
  );

  const settings = page.locator('.viewer-settings');
  if (!(await settings.evaluate(el => el.open))) {
    await page.locator('.viewer-settings > summary').click();
  }
  const menuBox = await page.locator('.viewer-settings-menu').boundingBox();
  assert.ok(menuBox && menuBox.width <= 390, 'Display popover is wider than mobile viewport');
  await page.locator('.viewer-settings > summary').click();

  await page.selectOption('#view-preset', 'back');
  assert.equal(await page.locator('#viewer').getAttribute('data-camera-scope'), 'regional');

  await page.fill('#structure-search', 'дельтовидная');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  await page.locator('.search-result').first().click();
  assert.match(await page.locator('#question').innerText(), /Дельтовидн/i);

  await page.waitForFunction(
    () => {
      const panel = document.querySelector('#deeper-structures');
      return panel && !panel.hidden &&
        document.querySelectorAll('.deeper-structure').length > 0;
    },
    null,
    { timeout: 15000 }
  );

  const deeperButton = page.locator('.deeper-structure').first();
  const deeperBox = await deeperButton.boundingBox();
  assert.ok(deeperBox && deeperBox.height >= 40, 'Deeper-muscle target is too small for touch');

  await deeperButton.click();
  assert.equal(await page.locator('#viewer').getAttribute('data-deeper-focus'), 'true');
  assert.match(await page.locator('#isolate-selected').innerText(), /Показать окружение/i);
  assert.ok(
    Number(await page.locator('#viewer').getAttribute('data-selected-muscle-visible-bones')) > 0,
    'Isolated muscle lost skeletal landmarks on mobile'
  );

  await page.click('#isolate-selected');
  assert.equal(await page.locator('#viewer').getAttribute('data-deeper-focus'), 'false');
  assert.match(await page.locator('#show-all').innerText(), /Показать весь блок/i);

  const finalOverflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    finalOverflow.scrollWidth <= finalOverflow.viewport + 2,
    'Mobile atlas overflows after interaction: ' + JSON.stringify(finalOverflow)
  );

  await page.screenshot({
    path: '/tmp/muscle-memory-mobile-atlas.png',
    fullPage: true,
  });

  if (errors.length) {
    throw new Error('Browser errors: ' + errors.join(' || '));
  }

  console.log('[smoke:mobile-atlas] ok');
  await context.close();
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
