const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:native-bones] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];

  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  try {
    await page.goto(
      'http://127.0.0.1:4173/?mode=explore&scope=shoulder&motionBones=tsm-native',
      { waitUntil: 'domcontentloaded' }
    );

    await page.waitForFunction(
      () => document.querySelector('#loading')?.classList.contains('is-hidden'),
      null,
      { timeout: 150000 }
    );

    await page.fill('#structure-search', 'дельтовидная');
    await page.waitForFunction(
      () => document.querySelectorAll('.search-result').length > 0,
      null,
      { timeout: 15000 }
    );
    await page.locator('.search-result').first().click();
    await page.click('#mode-motion');

    await page.waitForFunction(
      () =>
        document.querySelector('#motion-viewer')?.dataset.motionState ===
          'source-native-rest-pose',
      null,
      { timeout: 30000 }
    );

    const canvas = page.locator('#motion-viewer');
    assert.equal(
      await canvas.getAttribute('data-motion-geometry-runtime-bones'),
      'tsm-native-bones'
    );
    assert.equal(await canvas.getAttribute('data-motion-bones'), '4');
    assert.equal(await canvas.getAttribute('data-motion-muscles'), '0');
    assert.equal(
      await canvas.getAttribute('data-motion-authority'),
      'source-native-geometry-probe'
    );
    assert.match(
      await canvas.getAttribute('data-motion-native-bone-ids'),
      /thorax.*clavicle.*scapula.*humerus/
    );
    assert.equal(await page.locator('#motion-angle').count(), 0);
    assert.match(
      await page.locator('#motion-state').innerText(),
      /Source-native TSM|статическ.*атлас/i
    );

    if (errors.length) {
      throw new Error('Browser errors: ' + errors.join(' || '));
    }

    console.log('[smoke:native-bones] ok');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
