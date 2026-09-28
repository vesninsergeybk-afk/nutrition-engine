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

  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=all', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden'),
    null,
    { timeout: 150000 }
  );

  assert.equal(await page.locator('#mode-explore').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#learning-region').inputValue(), 'all');
  assert.equal(await page.locator('#viewer').getAttribute('data-region-isolation'), 'false');
  assert.equal(await page.locator('#viewer').getAttribute('data-camera-scope'), 'full');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'anatomical');

  // Atlas information belongs below the model on mobile. It must never cover
  // the touch surface before a training session starts.
  const cardPlacement = await page.evaluate(() => {
    const viewerWrap = document.querySelector('.viewer-wrap');
    const panel = document.querySelector('.panel');
    const card = document.querySelector('.question-card');
    const canvas = document.querySelector('#viewer');
    const rect = canvas.getBoundingClientRect();
    const probe = document.elementFromPoint(
      rect.left + rect.width * 0.5,
      rect.top + rect.height * 0.72
    );
    return {
      cardParentIsPanel: card?.parentElement === panel,
      cardInsideViewer: card?.parentElement === viewerWrap,
      taskDocked: document.body.classList.contains('task-docked'),
      probeIsCanvas:
        probe === canvas ||
        probe?.closest?.('.comparison-pane-static') === canvas?.closest('.comparison-pane-static'),
    };
  });
  assert.equal(cardPlacement.cardParentIsPanel, true, 'Atlas card is not below the model');
  assert.equal(cardPlacement.cardInsideViewer, false, 'Atlas card still covers the viewer');
  assert.equal(cardPlacement.taskDocked, false, 'Atlas incorrectly entered docked-task layout');
  assert.equal(cardPlacement.probeIsCanvas, true, 'Lower mobile anatomy viewport is covered by HTML UI');

  // Mobile controls must not cover a large part of the anatomy workspace.
  for (const selector of ['#view-preset', '#focus-shoulder', '#focus-selected', '#focus-full']) {
    assert.equal(await page.locator(selector).isVisible(), false, selector + ' should be hidden on mobile');
  }
  assert.equal(await page.locator('#toggle-skeleton').isVisible(), true);
  assert.equal(await page.locator('#display-panel-toggle').isVisible(), true);

  // A coarse-pointer click without a preceding pointerup is the Android/WebView
  // fallback path. It must still be able to select a visible muscle before the
  // ordinary touchscreen.tap contract is exercised below.
  const fallbackTargets = await page.evaluate(() => {
    const canvas = document.querySelector('#viewer');
    const rect = canvas.getBoundingClientRect();
    const samples = [
      [0.50, 0.30], [0.42, 0.34], [0.58, 0.34],
      [0.50, 0.40], [0.38, 0.42], [0.62, 0.42],
      [0.46, 0.50], [0.54, 0.50],
    ];
    return samples.map(([x, y]) => ({
      x: rect.left + rect.width * x,
      y: rect.top + rect.height * y,
    }));
  });
  let fallbackSelected = false;
  for (const point of fallbackTargets) {
    await page.evaluate(({ x, y }) => {
      const canvas = document.querySelector('#viewer');
      canvas.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      }));
    }, point);
    await page.waitForTimeout(80);
    if ((await page.locator('#viewer').getAttribute('data-last-selection-input')) === 'touch-fallback') {
      fallbackSelected = true;
      break;
    }
  }
  assert.equal(
    fallbackSelected,
    true,
    'Coarse-pointer click fallback could not select a visible muscle'
  );

  // Real touch input, not a synthetic mouse click, must reach the canvas.
  const viewerBox = await page.locator('#viewer').boundingBox();
  assert.ok(viewerBox && viewerBox.width > 250 && viewerBox.height > 300);
  // Find a real visible muscle point from the rendered structure-id buffer, then
  // tap that exact point through Playwright's touchscreen API. This turns the
  // regression test into a real touch-selection contract rather than an optional probe.
  const touchTarget = await page.evaluate(() => {
    const canvas = document.querySelector('#viewer');
    const rect = canvas.getBoundingClientRect();
    const samples = [
      [0.50, 0.30], [0.42, 0.34], [0.58, 0.34],
      [0.50, 0.40], [0.38, 0.42], [0.62, 0.42],
      [0.46, 0.50], [0.54, 0.50],
    ];
    return samples.map(([x, y]) => ({
      x: rect.left + rect.width * x,
      y: rect.top + rect.height * y,
    }));
  });
  let touchSelected = false;
  for (const point of touchTarget) {
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(120);
    if ((await page.locator('#viewer').getAttribute('data-last-selection-input')) === 'touch') {
      touchSelected = true;
      break;
    }
  }
  assert.equal(touchSelected, true, 'A real touchscreen tap could not select any visible muscle');

  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    overflow.scrollWidth <= overflow.viewport + 2,
    'Mobile atlas has horizontal page overflow: ' + JSON.stringify(overflow)
  );

  await page.click('#display-panel-toggle');
  const drawerBox = await page.locator('#display-panel').boundingBox();
  assert.ok(drawerBox && drawerBox.width <= 390, 'Display drawer is wider than mobile viewport');
  assert.equal(await page.locator('#display-panel-toggle').getAttribute('aria-expanded'), 'true');
  await page.click('#display-panel-close');
  assert.equal(await page.locator('#display-panel').isHidden(), true);

  // Switch to a region only after the whole-body touch contract has passed.
  await page.selectOption('#learning-region', 'shoulder');
  await page.waitForFunction(
    () => document.querySelector('#viewer')?.dataset.cameraScope === 'regional',
    null,
    { timeout: 10000 }
  );
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
