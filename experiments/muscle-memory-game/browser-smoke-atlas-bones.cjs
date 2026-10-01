const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(20000);
    const click = selector => page.locator(selector).first().evaluate(el => el.click());
    await page.goto('http://127.0.0.1:4173/?mode=explore&scope=all', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('is-hidden') && !document.getElementById('atlas-bones-toggle').disabled, null, { timeout: 150000 });
    await click('#atlas-bones-toggle');
    assert.equal(await page.locator('#viewer').getAttribute('data-atlas-view'), 'bones');
    await page.fill('#structure-search', 'плечевая');
    await click('.search-result');
    assert.match(await page.locator('#mobile-muscle-name').textContent(), /Плечевая кость/);
    assert.match(await page.locator('#bone-reference').textContent(), /локтевым суставами/);
    await click('#focus-selected');
    // Clear the selection while preserving the camera, then tap real geometry.
    await click('#atlas-bones-toggle');
    await click('#atlas-bones-toggle');
    await page.evaluate(() => scrollTo(0, 0));
    const box = await page.locator('#viewer').boundingBox();
    for (const dx of [0, -15, 15, -30, 30]) {
      await page.touchscreen.tap(box.x + box.width / 2 + dx, box.y + box.height / 2);
      if (await page.locator('#viewer').getAttribute('data-selected-bone')) break;
    }
    assert.ok(await page.locator('#viewer').getAttribute('data-selected-bone'), 'Touch did not select real bone geometry');
    assert.match(await page.locator('#mobile-muscle-name').textContent(), /Плечевая кость/);
    await click('#mobile-bone-reference summary');
    const card = await page.locator('#mobile-muscle-card').boundingBox();
    const viewer = await page.locator('.viewer-wrap').boundingBox();
    assert.ok(card.y >= viewer.y + viewer.height - 1, 'Bone card overlaps the 3D workspace');
    assert.ok(await page.locator('#mobile-hide-muscle').isHidden());
    assert.ok(await page.locator('#atlas-relations').isHidden());
    await page.screenshot({ path: '/tmp/muscle-memory-bones-mobile.png', fullPage: true, scale: 'css', animations: 'disabled' });
    console.log('[smoke:bones] mobile geometry tap + Russian card + layout OK');
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.fill('#structure-search', 'лопатка');
    await click('.search-result');
    assert.match(await page.locator('#bone-reference').textContent(), /Суставная впадина/);
    assert.ok(await page.locator('#mobile-muscle-card').isHidden());
    await page.screenshot({ path: '/tmp/muscle-memory-bones-desktop.png', scale: 'css', animations: 'disabled' });
    await click('#atlas-bones-toggle');
    assert.equal(await page.locator('#viewer').getAttribute('data-selected-bone'), '');
    await page.fill('#structure-search', 'широчайшая');
    await click('.search-result');
    assert.ok(await page.locator('#structure-reference-facts').isVisible(), 'Muscle reference was not restored');
    assert.ok(await page.locator('#bone-reference').isHidden());
    assert.deepEqual(errors, []);
    console.log('[smoke:bones] desktop search + muscle view restored OK');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
