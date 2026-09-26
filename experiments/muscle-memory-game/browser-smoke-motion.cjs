const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:motion] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];

  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=arm-anterior', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden'),
    null,
    { timeout: 150000 }
  );

  assert.equal(await page.locator('#motion-pane').isHidden(), true);
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('motion-mode')), false);

  await page.fill('#structure-search', 'двуглавая');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );

  const result = page.locator('.search-result').first();
  assert.match(await result.innerText(), /двуглав/i);
  await result.click();

  await page.click('#mode-motion');

  await page.waitForFunction(
    () => {
      const pane = document.querySelector('#motion-pane');
      const canvas = document.querySelector('#motion-viewer');
      return pane && !pane.hidden &&
        canvas?.dataset.motionState === 'rest-pose' &&
        Number(canvas?.dataset.motionMuscles || 0) > 0;
    },
    null,
    { timeout: 15000 }
  );

  assert.equal(
    await page.locator('body').evaluate(el => el.classList.contains('motion-mode')),
    true
  );
  assert.equal(await page.locator('#motion-pane').isHidden(), false);
  assert.equal(await page.locator('#motion-viewer').getAttribute('data-motion-state'), 'rest-pose');
  assert.ok(Number(await page.locator('#motion-viewer').getAttribute('data-motion-muscles')) > 0);
  assert.ok(Number(await page.locator('#motion-viewer').getAttribute('data-motion-bones')) > 0);

  const stateText = await page.locator('#motion-state').innerText();
  assert.match(stateText, /Исходное положение/i);
  assert.match(stateText, /движение подключится|сопоставление ещё не подготовлено/i);

  const staticBox = await page.locator('#static-pane').boundingBox();
  const motionBox = await page.locator('#motion-pane').boundingBox();
  assert.ok(staticBox && motionBox);
  assert.ok(staticBox.width > 300 && motionBox.width > 300);
  assert.ok(Math.abs(staticBox.width - motionBox.width) < 80);

  await page.screenshot({ path: '/tmp/muscle-memory-motion.png', fullPage: true });

  await page.click('#mode-explore');
  assert.equal(await page.locator('#motion-pane').isHidden(), true);
  assert.equal(
    await page.locator('body').evaluate(el => el.classList.contains('motion-mode')),
    false
  );

  const viewerBox = await page.locator('#viewer').boundingBox();
  assert.ok(viewerBox && viewerBox.width > 700, 'Atlas did not return to a single wide viewer');

  if (errors.length) {
    throw new Error('Browser errors: ' + errors.join(' || '));
  }

  console.log('[smoke:motion] ok');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
