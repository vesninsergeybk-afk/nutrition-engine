const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:mobile-motion] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  try {
    await page.goto(
      'http://127.0.0.1:4173/?mode=explore&scope=shoulder',
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
      () => document.body.classList.contains('motion-mode') &&
        !document.querySelector('#motion-pane')?.hidden,
      null,
      { timeout: 15000 }
    );
    await page.waitForTimeout(500);

    const viewport = page.viewportSize();
    const motionBox = await page.locator('#motion-pane').boundingBox();
    const staticBox = await page.locator('#static-pane').boundingBox();
    const stateBox = await page.locator('#motion-state').boundingBox();
    const sliderBox = await page.locator('#motion-angle').boundingBox();

    assert.ok(motionBox && motionBox.height > viewport.height * 0.65,
      'Motion viewport must be the dominant mobile workspace');
    assert.ok(staticBox && staticBox.width < viewport.width * 0.42,
      'Static atlas must be a compact mobile preview');
    assert.ok(staticBox.height < viewport.height * 0.28,
      'Static atlas preview is too tall on mobile');
    assert.equal(
      await page.locator('.panel').evaluate(el => getComputedStyle(el).display),
      'none',
      'Training panel must not occupy the mobile Motion workspace'
    );
    assert.equal(
      await page.locator('.viewer-tools').evaluate(el => getComputedStyle(el).display),
      'none',
      'Atlas viewer tools must not cover mobile Motion'
    );
    assert.ok(stateBox && stateBox.height <= viewport.height * 0.30,
      'Motion controls sheet must stay compact and leave the moving model dominant');
    assert.ok(sliderBox && sliderBox.y >= stateBox.y &&
      sliderBox.y + sliderBox.height <= stateBox.y + stateBox.height,
      'Motion slider must be immediately reachable inside the controls sheet');

    assert.equal(
      await page.locator('.motion-role-summary').evaluate(
        el => getComputedStyle(el).display
      ),
      'none',
      'Long role explanation must not cover the mobile movement scene'
    );
    assert.equal(
      await page.locator('#motion-kinematic-summary').evaluate(
        el => getComputedStyle(el).display
      ),
      'none',
      'Kinematic explanation must stay out of the compact mobile controls sheet'
    );

    const motionCanvas = page.locator('#motion-viewer');
    const boneCount = Number(await motionCanvas.getAttribute('data-motion-bones') || 0);
    assert.ok(boneCount > 0,
      'Motion must contain bone context before playback starts');

    const startAngle = Number(await motionCanvas.getAttribute('data-motion-angle') || 0);
    await page.click('#motion-play');
    await page.waitForFunction(
      () =>
        document.querySelector('#motion-viewer')?.dataset.motionPlaying === 'true',
      null,
      { timeout: 5000 }
    );
    await page.waitForFunction(
      start =>
        Number(document.querySelector('#motion-viewer')?.dataset.motionAngle || 0) !== start,
      startAngle,
      { timeout: 5000 }
    );
    await page.click('#motion-play');
    assert.equal(
      await motionCanvas.getAttribute('data-motion-playing'),
      'false',
      'Second Play/Pause click must stop playback'
    );

    await page.click('#motion-atlas-return');
    await page.waitForFunction(
      () => document.body.classList.contains('explore-mode') &&
        !document.body.classList.contains('motion-mode'),
      null,
      { timeout: 5000 }
    );

    if (errors.length) {
      throw new Error('Browser errors: ' + errors.join(' || '));
    }
    console.log('[smoke:mobile-motion] ok');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
