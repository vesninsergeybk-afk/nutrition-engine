const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:motion] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];

  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=arm-anterior', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden'),
    null,
    { timeout: 150000 }
  );

  assert.equal(await page.locator('#motion-pane').isHidden(), true);
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('motion-mode')), false);

  await page.fill('#structure-search', 'двуглавая');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );

  const result = page.locator('.search-result').first();
  assert.match(await result.innerText(), /двуглав/i);
  await result.click();

  // Motion is a primary workspace, not a nested Display action. Prove the
  // user can enter it in one click even if the auxiliary menu is open.
  if (!(await page.locator('.viewer-settings').evaluate(el => el.open))) {
    await page.locator('.viewer-settings > summary').click();
  }
  assert.equal(await page.locator('.viewer-settings').evaluate(el => el.open), true);

  await page.click('#mode-motion');
  assert.equal(await page.locator('.viewer-settings').evaluate(el => el.open), false);

  await page.waitForFunction(
    () => {
      const pane = document.querySelector('#motion-pane');
      const canvas = document.querySelector('#motion-viewer');
      return pane && !pane.hidden &&
        canvas?.dataset.motionState === 'rest-pose' &&
        Number(canvas?.dataset.motionMuscles || 0) > 0;
    },
    null,
    { timeout: 15000 }
  );

  assert.equal(
    await page.locator('body').evaluate(el => el.classList.contains('motion-mode')),
    true
  );
  assert.equal(await page.locator('#motion-pane').isHidden(), false);
  assert.equal(await page.locator('#motion-viewer').getAttribute('data-motion-state'), 'rest-pose');
  assert.ok(Number(await page.locator('#motion-viewer').getAttribute('data-motion-muscles')) > 0);
  assert.ok(Number(await page.locator('#motion-viewer').getAttribute('data-motion-bones')) > 0);
  assert.equal(await page.locator('#motion-viewer').getAttribute('data-motion-pilot'), 'elbow');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-authority'),
    'kinematic-preview'
  );

  const stateText = await page.locator('#motion-state').innerText();
  assert.match(stateText, /кинематическ/i);
  assert.equal(await page.locator('#motion-angle').count(), 1);
  assert.equal(await page.locator('#motion-play').count(), 1);
  assert.equal(await page.locator('#motion-angle').getAttribute('max'), '146');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-movement'),
    'elbow-flexion'
  );

  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '90';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionAngle === '90' &&
      document.querySelector('#motion-viewer')?.dataset.motionState === 'posed'
  );
  assert.ok(
    Math.abs(
      Number(
        await page.locator('#motion-viewer').getAttribute('data-motion-forearm-rotation')
      )
    ) > 1
  );

  if (await page.locator('#motion-movement').count()) {
    const options = await page.locator('#motion-movement option').evaluateAll(
      nodes => nodes.map(node => node.value)
    );
    assert.ok(options.includes('forearm-supination'));
    await page.selectOption('#motion-movement', 'forearm-supination');
    await page.locator('#motion-angle').evaluate((el) => {
      el.value = '80';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#motion-viewer')?.dataset.motionMovement ===
          'forearm-supination' &&
        Math.abs(
          Number(
            document.querySelector('#motion-viewer')?.dataset
              .motionForearmAxialRotation || 0
          )
        ) > 0.5
    );
    await page.selectOption('#motion-movement', 'elbow-flexion');
  }

  await page.click('#motion-reset');
  assert.equal(await page.locator('#motion-viewer').getAttribute('data-motion-angle'), '0');
  await page.click('#motion-play');
  await page.waitForFunction(
    () => Number(document.querySelector('#motion-viewer')?.dataset.motionAngle || 0) >= 2,
    null,
    { timeout: 5000 }
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-playing'),
    'true'
  );
  await page.click('#motion-play');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-playing'),
    'false'
  );

  const staticBox = await page.locator('#static-pane').boundingBox();
  const motionBox = await page.locator('#motion-pane').boundingBox();
  assert.ok(staticBox && motionBox);
  assert.ok(staticBox.width > 300 && motionBox.width > 300);
  assert.ok(Math.abs(staticBox.width - motionBox.width) < 80);

  await page.screenshot({ path: '/tmp/muscle-memory-motion.png', fullPage: true });

  await page.click('#mode-explore');
  assert.equal(await page.locator('#motion-pane').isHidden(), true);
  assert.equal(
    await page.locator('body').evaluate(el => el.classList.contains('motion-mode')),
    false
  );

  // Shoulder pilot: a deltoid selection must expose its distinct
  // movement components without pretending that humerus-only elevation is
  // a complete scapulohumeral simulation.
  await page.selectOption('#learning-region', 'shoulder');
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
      document.querySelector('#motion-viewer')?.dataset.motionPilot ===
        'shoulder' &&
      document.querySelector('#motion-movement'),
    null,
    { timeout: 15000 }
  );

  const shoulderOptions = await page.locator('#motion-movement option').evaluateAll(
    nodes => nodes.map(node => node.value)
  );
  for (const movement of [
    'shoulder-flexion',
    'shoulder-abduction',
    'shoulder-extension',
    'shoulder-external-rotation',
    'shoulder-internal-rotation',
  ]) {
    assert.ok(shoulderOptions.includes(movement), 'Missing shoulder movement: ' + movement);
  }

  await page.selectOption('#motion-movement', 'shoulder-abduction');
  assert.equal(await page.locator('#motion-angle').getAttribute('max'), '90');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-reference-max'),
    '150'
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-authority'),
    'kinematic-preview'
  );

  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '60';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionMovement ===
        'shoulder-abduction' &&
      Math.abs(
        Number(
          document.querySelector('#motion-viewer')?.dataset.motionShoulderRotation || 0
        )
      ) > 0.5,
    null,
    { timeout: 5000 }
  );
  assert.match(
    await page.locator('#motion-state').innerText(),
    /90°|150°|лопатк|ключиц/i
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-units'),
    /deltoid-acromial/
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-units'),
    /supraspinatus/
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-movers'),
    /deltoid-acromial/
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-movers'),
    /supraspinatus/
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-stabilizers'),
    /infraspinatus/
  );
  assert.match(
    await page.locator('#motion-state').innerText(),
    /Основные двигатели:|Стабилизирующий контекст:/i
  );

  await page.click('#mode-explore');
  await page.selectOption('#learning-region', 'forearm-hand-anterior');
  await page.fill('#structure-search', 'лучевой сгибатель запястья');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  await page.locator('.search-result').first().click();
  await page.click('#mode-motion');
  await page.waitForFunction(
    () => document.querySelector('#motion-viewer')?.dataset.motionPilot === 'wrist',
    null,
    { timeout: 15000 }
  );
  const wristOptions = await page.locator('#motion-movement option').evaluateAll(
    nodes => nodes.map(node => node.value)
  );
  assert.ok(wristOptions.includes('wrist-flexion'));
  assert.ok(wristOptions.includes('wrist-radial-deviation'));
  await page.selectOption('#motion-movement', 'wrist-flexion');
  assert.equal(await page.locator('#motion-angle').getAttribute('max'), '45');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-reference-max'),
    '80'
  );
  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '30';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionMovement ===
        'wrist-flexion' &&
      Math.abs(
        Number(
          document.querySelector('#motion-viewer')?.dataset.motionWristRotation || 0
        )
      ) > 0.25,
    null,
    { timeout: 5000 }
  );

  await page.click('#mode-explore');
  const viewerBox = await page.locator('#viewer').boundingBox();
  assert.ok(viewerBox && viewerBox.width > 700, 'Atlas did not return to a single wide viewer');

  if (errors.length) {
    throw new Error('Browser errors: ' + errors.join(' || '));
  }

  console.log('[smoke:motion] ok');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
