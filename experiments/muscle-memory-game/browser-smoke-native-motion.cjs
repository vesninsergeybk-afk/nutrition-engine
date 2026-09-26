const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:native-motion] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  try {
    await page.goto(
      'http://127.0.0.1:4173/?mode=explore&scope=shoulder&motionBones=tsm-native&motionDemo=adduction',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForFunction(
      () => document.querySelector('#loading')?.classList.contains('is-hidden'),
      null,
      { timeout: 150000 }
    );

    await page.fill('#structure-search', 'большая грудная');
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
          'source-native-motion-playing',
      null,
      { timeout: 30000 }
    );

    const canvas = page.locator('#motion-viewer');
    assert.equal(
      await canvas.getAttribute('data-motion-authority'),
      'source-native-cmc-reverse'
    );
    assert.equal(await canvas.getAttribute('data-motion-bones'), '4');
    assert.equal(await canvas.getAttribute('data-motion-muscles'), '0');
    assert.equal(
      await canvas.getAttribute('data-motion-displayed-movement'),
      'shoulder-adduction'
    );
    assert.equal(
      await canvas.getAttribute('data-motion-source-movement'),
      'shoulder-abduction'
    );
    assert.equal(
      await canvas.getAttribute('data-motion-playback-direction'),
      'reverse'
    );
    assert.equal(
      await canvas.getAttribute('data-motion-scale-source'),
      'opensim-model-scale-factors'
    );

    // The demo may have already advanced while the assertions above were
    // crossing the browser boundary. Restart it explicitly so this checkpoint
    // measures one deterministic playback cycle rather than racing autoplay.
    await page.click('#motion-replay');
    await page.waitForFunction(
      () => {
        const viewer = document.querySelector('#motion-viewer');
        return (
          viewer?.dataset.motionState === 'source-native-motion-playing' &&
          Number(viewer?.dataset.motionNativeProgress || 1) < 0.05
        );
      },
      null,
      { timeout: 1500 }
    );

    const qStart = await canvas.getAttribute(
      'data-motion-native-humerus-quaternion'
    );
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector('#motion-viewer')?.dataset
            .motionNativeProgress || 0
        ) > 0.2,
      null,
      { timeout: 3000 }
    );
    const qMoving = await canvas.getAttribute(
      'data-motion-native-humerus-quaternion'
    );
    assert.notEqual(qMoving, qStart, 'Humerus quaternion did not change');

    await page.waitForFunction(
      () =>
        document.querySelector('#motion-viewer')?.dataset.motionState ===
          'source-native-motion-complete',
      null,
      { timeout: 6000 }
    );
    assert.ok(
      Number(await canvas.getAttribute('data-motion-native-progress')) > 0.99,
      'Source-derived adduction did not reach its endpoint'
    );
    assert.match(
      await page.locator('#motion-state').innerText(),
      /CMC.*обратн|мышечн.*активац/i
    );

    await page.click('#motion-replay');
    await page.waitForFunction(
      () =>
        document.querySelector('#motion-viewer')?.dataset.motionState ===
          'source-native-motion-playing' &&
        Number(
          document.querySelector('#motion-viewer')?.dataset
            .motionNativeProgress || 1
        ) < 0.2,
      null,
      { timeout: 1500 }
    );

    if (errors.length) {
      throw new Error('Browser errors: ' + errors.join(' || '));
    }
    console.log('[smoke:native-motion] ok');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
