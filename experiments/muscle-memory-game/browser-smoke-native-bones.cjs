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
          'source-native-reference-pose',
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
      /опорн.*поз|не использует геометр.*атлас/i
    );
    assert.equal(
      await canvas.getAttribute('data-motion-reference-clip'),
      'tsm-abduction-teaching-01'
    );
    assert.equal(
      await canvas.getAttribute('data-motion-reference-progress'),
      '1'
    );

    if (errors.length) {
      throw new Error('Browser errors: ' + errors.join(' || '));
    }

    const adductionPage = await browser.newPage({
      viewport: { width: 1280, height: 900 }
    });
    const adductionErrors = [];
    adductionPage.on('pageerror', error =>
      adductionErrors.push('pageerror: ' + error.message)
    );
    adductionPage.on('console', msg => {
      if (msg.type() === 'error') {
        adductionErrors.push('console: ' + msg.text());
      }
    });

    await adductionPage.goto(
      'http://127.0.0.1:4173/?mode=explore&scope=shoulder&motionBones=tsm-native&motionMovement=shoulder-adduction',
      { waitUntil: 'domcontentloaded' }
    );
    await adductionPage.waitForFunction(
      () => document.querySelector('#loading')?.classList.contains('is-hidden'),
      null,
      { timeout: 150000 }
    );
    await adductionPage.fill('#structure-search', 'большая грудная');
    await adductionPage.waitForFunction(
      () => document.querySelectorAll('.search-result').length > 0,
      null,
      { timeout: 15000 }
    );
    await adductionPage.locator('.search-result').first().click();
    await adductionPage.click('#mode-motion');
    await adductionPage.waitForFunction(
      () =>
        document.querySelector('#motion-viewer')?.dataset.motionState ===
          'source-native-adduction-ready',
      null,
      { timeout: 30000 }
    );

    const adductionCanvas = adductionPage.locator('#motion-viewer');
    assert.equal(
      await adductionCanvas.getAttribute('data-motion-authority'),
      'source-derived-clip'
    );
    assert.equal(
      await adductionCanvas.getAttribute('data-motion-source-clip'),
      'tsm-abduction-teaching-01'
    );
    assert.equal(
      await adductionCanvas.getAttribute('data-motion-source-playback-direction'),
      'reverse'
    );
    assert.match(
      await adductionPage.locator('#motion-state').innerText(),
      /Сведение плеча|движется к туловищу/i
    );
    assert.match(
      await adductionPage.locator('#motion-state').innerText(),
      /примерно от 97° до 23°|проверенн.*участок/i
    );
    const rangeStart = Number(
      await adductionCanvas.getAttribute('data-motion-source-range-start')
    );
    const rangeEnd = Number(
      await adductionCanvas.getAttribute('data-motion-source-range-end')
    );
    assert.ok(
      Number.isFinite(rangeStart) &&
        Math.abs(rangeStart - 96.95) < 0.05,
      'Unexpected source-derived adduction start: ' + rangeStart
    );
    assert.ok(
      Number.isFinite(rangeEnd) &&
        Math.abs(rangeEnd - 22.52) < 0.05,
      'Unexpected source-derived adduction end: ' + rangeEnd
    );
    assert.ok(
      rangeStart > rangeEnd,
      'Adduction must traverse the verified source excursion in reverse'
    );
    assert.equal(
      await adductionCanvas.getAttribute('data-motion-source-coordinate'),
      'shoulder_elv'
    );

    const before = Number(
      await adductionCanvas.getAttribute('data-motion-native-progress') || 0
    );
    await adductionPage.click('#motion-native-play');
    await adductionPage.waitForFunction(
      () =>
        Number(
          document.querySelector('#motion-viewer')?.dataset
            .motionNativeProgress || 0
        ) > 0.05,
      null,
      { timeout: 3000 }
    );
    const after = Number(
      await adductionCanvas.getAttribute('data-motion-native-progress')
    );
    assert.ok(after > before, 'Source-native adduction did not advance');

    if (adductionErrors.length) {
      throw new Error(
        'Native adduction browser errors: ' + adductionErrors.join(' || ')
      );
    }
    await adductionPage.close();

    console.log('[smoke:native-bones] ok');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
