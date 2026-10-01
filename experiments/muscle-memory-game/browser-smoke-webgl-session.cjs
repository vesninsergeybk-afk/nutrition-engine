const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

// One real mobile 3D session: no substituted app, geometry or renderer.
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      window.__webglContexts = [];
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const context = getContext.call(this, type, ...args);
        if (context && /^webgl/.test(type) && !window.__webglContexts.some(item => item.context === context)) {
          window.__webglContexts.push({ canvas: this, context });
        }
        return context;
      };
    });
    await page.goto('http://127.0.0.1:4173/?mode=explore&scope=back', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('is-hidden') &&
      document.getElementById('viewer').dataset.webglSessionState === 'ready', null, { timeout: 150000 });
    console.log('[smoke:webgl] real anatomy loaded');
    const pixelRatio = await page.locator('#viewer').evaluate(el => el.width / el.clientWidth);
    assert.ok(pixelRatio > 1 && pixelRatio <= 1.51, 'Mobile framebuffer exceeds its pixel budget');
    assert.equal(await page.locator('.viewer-wrap').evaluate(el => getComputedStyle(el).transitionDuration), '0s');

    await page.fill('#structure-search', 'широчайшая');
    await page.locator('.search-result').first().click();
    await page.waitForFunction(() => window.__webglContexts.some(item => item.canvas !== document.getElementById('viewer') && !item.context.isContextLost()));
    await page.fill('#structure-search', 'трапециевидная');
    await page.locator('.search-result').first().click();
    await page.waitForFunction(() => {
      const extras = window.__webglContexts.filter(item => item.canvas !== document.getElementById('viewer'));
      return extras.length >= 2 && extras.slice(0, -1).every(item => item.context.isContextLost()) && !extras.at(-1).context.isContextLost();
    });
    console.log('[smoke:webgl] retired gallery context released');
    await page.click('[data-quick-role="antagonists"]');
    await page.selectOption('#atlas-relations-part', 'lower');
    await page.selectOption('#atlas-relations-movement', { label: 'Опускание лопатки' });
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      question: document.getElementById('question').textContent,
      part: document.getElementById('atlas-relations-part').value,
      movement: document.getElementById('atlas-relations-movement').value,
      group: document.getElementById('viewer').dataset.functionalGroupIds,
    }));
    const before = await page.locator('#viewer').screenshot({ path: '/tmp/muscle-memory-webgl-before.png' });

    // Exercise the browser's real lost/restored events, not synthetic DOM events.
    await page.evaluate(() => {
      window.__mainContext = window.__webglContexts.find(item => item.canvas.id === 'viewer').context;
      window.__loseContext = window.__mainContext.getExtension('WEBGL_lose_context');
      if (!window.__loseContext) throw new Error('WEBGL_lose_context is unavailable');
      window.__loseContext.loseContext();
    });
    await page.waitForFunction(() => document.getElementById('viewer').dataset.webglSessionState === 'lost');
    assert.equal(await page.locator('#webgl-status').isVisible(), true);
    assert.equal(await page.locator('#webgl-reload').isHidden(), true);
    const lost = await page.locator('#viewer').screenshot();
    assert.notDeepEqual(lost, before, 'Context loss did not affect the canvas');
    await page.evaluate(() => window.__loseContext.restoreContext());
    await page.waitForFunction(() => document.getElementById('viewer').dataset.webglSessionState === 'ready' &&
      document.getElementById('webgl-status').hidden && !window.__mainContext.isContextLost());
    const after = await page.locator('#viewer').screenshot({ path: '/tmp/muscle-memory-webgl-restored.png' });
    assert.notDeepEqual(after, lost, 'The restored renderer remains blank');
    assert.deepEqual(await page.evaluate(() => ({
      question: document.getElementById('question').textContent,
      part: document.getElementById('atlas-relations-part').value,
      movement: document.getElementById('atlas-relations-movement').value,
      group: document.getElementById('viewer').dataset.functionalGroupIds,
    })), state, 'Recovery reset the selected muscle or movement');
    assert.equal(await page.locator('#atlas-relations-body').isVisible(), true);
    await page.locator('#atlas-relations-movement').focus();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
    assert.deepEqual(errors, [], '3D recovery produced browser exceptions');
    console.log('[smoke:webgl] real GPU context loss/restoration, visible anatomy, preserved comparison, mobile pixel budget and gallery cleanup passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
