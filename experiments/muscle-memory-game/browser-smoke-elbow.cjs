const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:elbow] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 920 } });
  const errors = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  try {
    await page.goto('http://127.0.0.1:4173/?mode=explore&scope=arm-anterior', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('is-hidden'), null, { timeout: 150000 });
    await page.fill('#structure-search', 'двуглавая');
    await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0, null, { timeout: 15000 });
    await page.locator('.search-result').first().click();
    await page.click('#mode-motion');
    await page.waitForFunction(() => document.querySelector('#motion-viewer')?.dataset.motionState === 'source-native-elbow-ready', null, { timeout: 30000 });
    const canvas = page.locator('#motion-viewer');
    assert.equal(await canvas.getAttribute('data-motion-authority'), 'myoarm-mujoco-source');
    assert.equal(await canvas.getAttribute('data-motion-geometry-runtime-bones'), 'myoarm-native-bones');
    assert.equal(await canvas.getAttribute('data-motion-muscle-path-mode'), 'mujoco-wrap-segments');
    assert.equal(await canvas.getAttribute('data-motion-bones'), '3');
    assert.ok(Number(await canvas.getAttribute('data-motion-muscles')) >= 1);
    assert.equal(await page.locator('#motion-angle').count(), 0);
    assert.equal(await page.locator('#motion-elbow-play').count(), 1);
    const startLength = Number(await canvas.getAttribute('data-motion-tendon-length'));
    assert.ok(startLength > 0.3);
    await page.click('#motion-elbow-play');
    await page.waitForFunction(() => Number(document.querySelector('#motion-viewer')?.dataset.motionAngle || 0) >= 70, null, { timeout: 5000 });
    const flexedLength = Number(await canvas.getAttribute('data-motion-tendon-length'));
    assert.ok(flexedLength < startLength - 0.015);
    assert.equal(await canvas.getAttribute('data-motion-playing'), 'true');
    assert.match(await page.locator('#motion-state').innerText(), /MyoArm|MuJoCo|wrapping|сгибан/i);
    await page.screenshot({ path: '/tmp/muscle-memory-elbow-source-native.png', fullPage: true });
    if (errors.length) throw new Error('Browser errors: ' + errors.join(' || '));
    console.log('[smoke:elbow] ok');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
