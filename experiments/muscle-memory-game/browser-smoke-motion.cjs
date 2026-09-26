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
    assert.equal(
      await page.locator('#motion-viewer').getAttribute('data-motion-forearm-axis'),
      'radial-head>ulnar-head',
      'Forearm rotation must use the radial-head to distal-ulna teaching axis'
    );
    assert.equal(
      await page.locator('#motion-viewer').getAttribute('data-motion-radius-rigid'),
      'true',
      'Radius must remain a rigid bone during pronosupination'
    );
    assert.match(
      await page.locator('#motion-state').innerText(),
      /головк.*луч|локтев.*кост|ось/i,
      'Forearm rotation UI must explain the anatomical rotation axis'
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
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-playback-curve'),
    'cosine-ease-in-out',
    'Automatic teaching playback must ease into and out of each movement limit'
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
    'shoulder-scaption',
    'shoulder-adduction',
    'shoulder-horizontal-adduction',
    'shoulder-horizontal-abduction',
  ]) {
    assert.ok(shoulderOptions.includes(movement), 'Missing shoulder movement: ' + movement);
  }

  await page.selectOption('#motion-movement', 'shoulder-abduction');
  assert.equal(await page.locator('#motion-angle').getAttribute('max'), '150');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-reference-max'),
    '150'
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-authority'),
    'kinematic-preview'
  );

  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '120';
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
    /150°|лопатк|ключиц|Combined/i
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
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-scope'),
    'shoulder-complex-preview'
  );
  assert.ok(
    Number(await page.locator('#motion-viewer').getAttribute('data-motion-scapular-deg')) > 20,
    'Full-range abduction must rotate the scapula'
  );
  const ghDeg = Number(
    await page.locator('#motion-viewer').getAttribute('data-motion-glenohumeral-deg')
  );
  const ghMeshDeg = Number(
    await page.locator('#motion-viewer').getAttribute('data-motion-shoulder-rotation-deg')
  );
  assert.ok(
    ghDeg > 60,
    'Full-range abduction must retain a glenohumeral component'
  );
  assert.ok(
    Math.abs(ghMeshDeg - ghDeg) < 1.1,
    'Humerus rotation must use the residual glenohumeral angle, not the total arm elevation'
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-shoulder-chain'),
    'scapula>glenohumeral',
    'Glenohumeral pivot must follow the moving scapular base'
  );
  assert.ok(
    Number(await page.locator('#motion-viewer').getAttribute('data-motion-clavicle-elevation-deg')) > 0,
    'Full-range abduction must move the clavicle'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-scapular-posterior-tilt-deg')
    ) > 3,
    'Full-range abduction must include scapular posterior tilt'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-scapular-external-rotation-deg')
    ) > 1,
    'Higher-range abduction must include a modest scapular external-rotation component'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-clavicle-posterior-rotation-deg')
    ) > 0,
    'Full-range abduction must include clavicular posterior rotation'
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-scapula-anchor'),
    'clavicle-lateral',
    'Scapular base must follow the lateral clavicle rather than drift independently'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-humeral-external-rotation-deg')
    ) > 15,
    'Frontal abduction must include coupled humeral external rotation'
  );
  assert.match(
    await page.locator('#motion-state').innerText(),
    /наруж|кнаружи|лопатк/i,
    'Teaching UI must explain the coupled 3D shoulder motion'
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-scapular-drivers'),
    /serratus-anterior/
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-scapular-drivers'),
    /trapezius/
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-stabilizers'),
    /infraspinatus/
  );
  assert.match(
    await page.locator('#motion-state').innerText(),
    /Основные двигатели:|Стабилизирующий контекст:/i
  );
  const visualContext = await page
    .locator('#motion-viewer')
    .getAttribute('data-motion-visual-context');
  for (const unitId of [
    'trapezius',
    'serratus-anterior',
    'rhomboid-major',
    'rhomboid-minor',
    'levator-scapulae',
    'pectoralis-minor',
    'subclavius',
  ]) {
    assert.match(
      visualContext || '',
      new RegExp(unitId),
      'Missing shoulder visual context unit: ' + unitId
    );
  }
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-missing-context'),
    '',
    'Shoulder visual-only context must be rendered in the current anatomy source'
  );

  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-pivot-strategy'),
    'bone-end-centroid'
  );
  assert.ok(
    Number(
      await page.locator('#motion-viewer').getAttribute('data-motion-distal-followers')
    ) >= 2,
    'Shoulder preview must move the distal upper-limb chain with a fixed elbow'
  );
  assert.ok(
    Number(
      await page.locator('#motion-viewer').getAttribute('data-motion-distal-followers')
    ) >= 3,
    'Shoulder preview must include at least one hand bone follower'
  );

  await page.selectOption('#motion-movement', 'shoulder-horizontal-adduction');
  assert.equal(await page.locator('#motion-angle').getAttribute('max'), '60');
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-reference-max'),
    '120'
  );
  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '40';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionMovement ===
        'shoulder-horizontal-adduction' &&
      document.querySelector('#motion-viewer')?.dataset.motionReferencePose ===
        'abducted-90' &&
      Math.abs(
        Number(
          document.querySelector('#motion-viewer')?.dataset
            .motionShoulderBaseRotation || 0
        )
      ) > 1.4,
    null,
    { timeout: 5000 }
  );

  await page.selectOption('#motion-movement', 'shoulder-scaption');
  assert.equal(await page.locator('#motion-angle').getAttribute('max'), '150');
  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '60';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionMovement ===
        'shoulder-scaption' &&
      Math.abs(
        Number(
          document.querySelector('#motion-viewer')?.dataset.motionShoulderRotation || 0
        )
      ) > 0.5,
    null,
    { timeout: 5000 }
  );
  assert.match(
    await page.locator('#motion-viewer').getAttribute('data-motion-assistants'),
    /deltoid-clavicular/
  );
  assert.match(
    await page.locator('#motion-state').innerText(),
    /Вспомогательные двигатели:/i
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
  assert.doesNotMatch(
    await page.locator('#motion-state').innerText(),
    /лопатк|ключиц/i,
    'Wrist range note must not mention shoulder-girdle limitations'
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
  await page.selectOption('#learning-region', 'scapular-stabilizers');
  await page.fill('#structure-search', 'передняя зубчатая');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  await page.locator('.search-result').first().click();
  await page.click('#mode-motion');
  await page.waitForFunction(
    () => document.querySelector('#motion-viewer')?.dataset.motionPilot === 'scapula',
    null,
    { timeout: 15000 }
  );

  const scapularOptions = await page.locator('#motion-movement option').evaluateAll(
    nodes => nodes.map(node => node.value)
  );
  assert.ok(scapularOptions.includes('scapular-protraction'));
  assert.ok(scapularOptions.includes('scapular-upward-rotation'));

  await page.selectOption('#motion-movement', 'scapular-protraction');
  assert.equal(await page.locator('#motion-angle-value').innerText(), '0%');
  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '60';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionMovement ===
        'scapular-protraction' &&
      Number(
        document.querySelector('#motion-viewer')?.dataset
          .motionScapularTranslation || 0
      ) > 0,
    null,
    { timeout: 5000 }
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-scapula-anchor'),
    'clavicle-lateral',
    'Standalone scapular motion must share the lateral-clavicle base with combined shoulder motion'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-scapular-external-rotation-deg')
    ) < -3,
    'Protraction must include scapular internal rotation'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-clavicle-retraction-deg')
    ) < -3,
    'Protraction must include clavicular protraction around the medial anchor'
  );
  assert.match(
    await page.locator('#motion-state').innerText(),
    /медиальн.*ключиц|медиальн.*конец|опор/i,
    'Standalone scapular teaching text must explain the medial clavicular anchor'
  );

  await page.selectOption('#motion-movement', 'scapular-upward-rotation');
  await page.locator('#motion-angle').evaluate((el) => {
    el.value = '30';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#motion-viewer')?.dataset.motionMovement ===
        'scapular-upward-rotation' &&
      Math.abs(
        Number(
          document.querySelector('#motion-viewer')?.dataset
            .motionScapularRotation || 0
        )
      ) > 0.4 &&
      Math.abs(
        Number(
          document.querySelector('#motion-viewer')?.dataset
            .motionClavicleRotation || 0
        )
      ) > 0.05,
    null,
    { timeout: 5000 }
  );
  assert.equal(
    await page.locator('#motion-viewer').getAttribute('data-motion-authority'),
    'kinematic-preview'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-scapular-posterior-tilt-deg')
    ) > 4,
    'Standalone upward rotation must include posterior tilt'
  );
  assert.ok(
    Number(
      await page
        .locator('#motion-viewer')
        .getAttribute('data-motion-clavicle-posterior-rotation-deg')
    ) > 5,
    'Standalone upward rotation must include a clavicular posterior-rotation component'
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
