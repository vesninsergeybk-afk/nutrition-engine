const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:mobile-training] start');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });

  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=shoulder', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden'),
    null,
    { timeout: 150000 }
  );

  await page.click('#mode-quiz');
  await page.selectOption('#learning-region', 'shoulder');
  await page.click('[data-learning-mode="find"]');
  await page.click('#start-learning-session');

  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('session-active')), true);
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('task-docked')), false);

  const placement = await page.evaluate(() => {
    const panel = document.querySelector('.panel');
    const viewerWrap = document.querySelector('.viewer-wrap');
    const card = document.querySelector('.question-card');
    const tools = document.querySelector('.viewer-tools');
    const canvas = document.querySelector('#viewer');
    const rect = canvas.getBoundingClientRect();
    const probe = document.elementFromPoint(
      rect.left + rect.width * 0.5,
      rect.top + rect.height * 0.76
    );
    return {
      cardParentIsPanel: card?.parentElement === panel,
      cardInsideViewer: card?.parentElement === viewerWrap,
      panelDisplay: getComputedStyle(panel).display,
      toolsDisplay: getComputedStyle(tools).display,
      probeIsCanvas:
        probe === canvas ||
        probe?.closest?.('.comparison-pane-static') === canvas?.closest('.comparison-pane-static'),
    };
  });

  assert.equal(placement.cardParentIsPanel, true, 'Training task card must stay below the model');
  assert.equal(placement.cardInsideViewer, false, 'Training task card still overlays the model');
  assert.notEqual(placement.panelDisplay, 'none', 'Training task panel disappeared instead of moving below the model');
  assert.equal(placement.toolsDisplay, 'none', 'Mobile training controls still cover the anatomy');
  assert.equal(placement.probeIsCanvas, true, 'Lower mobile training viewport is covered by HTML UI');

  const samplePoints = await page.evaluate(() => {
    const canvas = document.querySelector('#viewer');
    const rect = canvas.getBoundingClientRect();
    return [
      [0.50, 0.28], [0.42, 0.32], [0.58, 0.32],
      [0.50, 0.40], [0.38, 0.43], [0.62, 0.43],
      [0.46, 0.52], [0.54, 0.52], [0.34, 0.55], [0.66, 0.55],
    ].map(([x, y]) => ({
      x: rect.left + rect.width * x,
      y: rect.top + rect.height * y,
    }));
  });

  async function openTapAction() {
    for (const point of samplePoints) {
      await page.touchscreen.tap(point.x, point.y);
      await page.waitForTimeout(120);
      if (await page.locator('#quiz-muscle-actions').isVisible()) {
        return await page.locator('#viewer').getAttribute('data-quiz-action-candidate-sid');
      }
    }
    return null;
  }

  const firstSid = await openTapAction();
  assert.ok(firstSid, 'Touching a visible muscle did not open choose/hide actions');
  assert.ok((await page.locator('#quiz-muscle-actions-name').innerText()).trim());
  assert.equal(await page.locator('#quiz-muscle-select').isVisible(), true);
  assert.equal(await page.locator('#quiz-muscle-hide').isVisible(), true);

  const wrongBeforeHide = Number(await page.locator('#score-wrong').innerText());
  const navigationBeforeHide = Number(
    await page.locator('#viewer').getAttribute('data-find-navigation-actions') || 0
  );

  await page.click('#quiz-muscle-hide');
  assert.equal(await page.locator('#quiz-muscle-actions').isHidden(), true);
  assert.equal(await page.locator('#viewer').getAttribute('data-quiz-last-hidden-sid'), firstSid);
  assert.equal(Number(await page.locator('#score-wrong').innerText()), wrongBeforeHide);
  assert.equal(
    Number(await page.locator('#viewer').getAttribute('data-find-navigation-actions') || 0),
    navigationBeforeHide + 1
  );
  assert.match(await page.locator('#feedback').innerText(), /не засчитывается как ошибка/i);

  const secondSid = await openTapAction();
  assert.ok(secondSid, 'Could not reach another muscle after hiding the first layer');
  await page.click('#quiz-muscle-select');
  assert.equal(await page.locator('#quiz-muscle-actions').isHidden(), true);
  assert.match(
    await page.locator('#viewer').getAttribute('data-find-selection-state'),
    /^(correct|wrong)$/,
    'Explicit Select must be graded as an answer, not interpreted as layer navigation'
  );

  await page.screenshot({
    path: '/tmp/muscle-memory-mobile-training.png',
    fullPage: true,
  });

  if (errors.length) throw new Error(errors.join(' || '));
  console.log('[smoke:mobile-training] ok');
  await context.close();
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
