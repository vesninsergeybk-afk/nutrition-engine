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
    assert.ok(stateBox && stateBox.height <= viewport.height * 0.44,
      'Motion controls sheet must leave most of the moving model visible');
    assert.ok(sliderBox && sliderBox.y >= stateBox.y &&
      sliderBox.y + sliderBox.height <= stateBox.y + stateBox.height,
      'Motion slider must be immediately reachable inside the controls sheet');

    const controlsTop = await page.locator('.motion-controls').evaluate(el => el.offsetTop);
    const rolesTop = await page.locator('.motion-role-summary').evaluate(el => el.offsetTop);
    assert.ok(controlsTop <= rolesTop,
      'Primary motion controls must precede long explanatory role text');

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
