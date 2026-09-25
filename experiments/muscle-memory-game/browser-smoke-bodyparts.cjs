const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
    console.log('[smoke:bodyparts] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];

  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  await page.goto('http://127.0.0.1:4173/?mode=explore', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const loading = document.querySelector('#loading');
      const question = document.querySelector('#question')?.textContent || '';
      return loading?.classList.contains('is-hidden') ||
        /Не удалось загрузить|Ошибка загрузки/.test((loading?.textContent || '') + ' ' + question);
    },
    null,
    { timeout: 150000 }
  );

  const initialLoadingHidden = await page.locator('#loading').evaluate(
    el => el.classList.contains('is-hidden')
  );
  if (!initialLoadingHidden) {
    throw new Error(
      'Initial model load failed: ' +
      await page.locator('#loading').innerText() +
      ' | ' +
      await page.locator('#diagnostics').innerText() +
      ' | browser errors: ' +
      errors.join(' || ')
    );
  }

  assert.equal(new URL(page.url()).pathname, '/');
  assert.equal(await page.locator('#model-source').inputValue(), 'z-anatomy');
  assert.equal(await page.locator('#viewer').getAttribute('data-model-source'), 'z-anatomy');
  assert.equal(await page.locator('#learning-region').isDisabled(), false);
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-learning-catalog-count')) > 140);
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-learning-target-count')) > 140);
  assert.equal(await page.locator('#learning-controls').isHidden(), true);
  assert.equal(await page.locator('#debug-panel').isHidden(), true);
  assert.equal(await page.locator('#score').isHidden(), true);
  assert.equal(await page.locator('#learning-session-mode').isHidden(), true);
  assert.equal(await page.locator('#model-source option').count(), 2);
  assert.equal(await page.locator('.status-card').count(), 0);
  assert.equal(await page.locator('#focus-shoulder').isHidden(), true);

  const visibleInitialText = await page.locator('body').innerText();
  assert.doesNotMatch(visibleInitialText, /Учебный каталог|треугольник|mesh|FMA\d+/i);

    console.log('[smoke:bodyparts] source/tissues/round-trip');
  await page.selectOption('#learning-region', 'shoulder');

  const pathnameBefore = new URL(page.url()).pathname;
  await page.locator('.viewer-settings > summary').click();
  await page.selectOption('#model-source', 'bodyparts4');

  await page.waitForFunction(
    () =>
      document.querySelector('#loading')?.classList.contains('is-hidden') &&
      document.querySelector('#viewer')?.dataset.modelSource === 'bodyparts4',
    null,
    { timeout: 150000 }
  );

  assert.equal(new URL(page.url()).pathname, pathnameBefore, 'Model switch must not navigate away');
  assert.equal(await page.locator('#model-source').inputValue(), 'bodyparts4');
  assert.equal(await page.locator('#mode-explore').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#learning-region').isDisabled(), false);
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-learning-catalog-count')) > 140);
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-region'), 'shoulder');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-learning-target-count'),
    '13'
  );
  assert.equal(await page.locator('#region-isolation').isChecked(), true);
  assert.equal(await page.locator('#viewer').getAttribute('data-region-isolation'), 'true');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip'),
    'logical-box'
  );
  assert.equal(await page.locator('#bone-mode').isDisabled(), false);
  assert.equal(await page.locator('#bone-mode').inputValue(), 'xray');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'xray');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-transparent'), 'true');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-scope'), 'regional');
  const regionalBoneCount = Number(
    await page.locator('#viewer').getAttribute('data-region-visible-bones')
  );
  assert.ok(regionalBoneCount > 0);

  // BodyParts3D is intentionally incomplete for the abdominal muscle
  // wall. It must not present one external-oblique target as a full
  // anatomical depth stack.
  await page.selectOption('#learning-region', 'abdomen');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-learning-target-count'),
    '1'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-depth-source-capability'),
    'source-incomplete'
  );
  assert.equal(await page.locator('#source-coverage-note').isVisible(), true);
  assert.match(
    await page.locator('#source-coverage-note').innerText(),
    /неполон.*1 из 5.*Z-Anatomy/i
  );
  assert.equal(await page.locator('#peel-surface-layer').isDisabled(), false);
  assert.match(
    await page.locator('#peel-surface-layer').innerText(),
    /Почему послойность недоступна/i
  );
  assert.match(
    (await page.locator('#peel-surface-layer').getAttribute('title')) || '',
    /неполон.*1 из 5|послойност/i
  );
  await page.click('#peel-surface-layer');
  assert.match(
    await page.locator('#feedback').innerText(),
    /неполон.*1 из 5|послойност/i
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip'),
    'logical-box'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip-y'),
    '0.31:0.62'
  );
  await page.screenshot({
    path: '/tmp/muscle-memory-bodyparts-abdomen-incomplete.png',
    fullPage: true,
  });
  await page.selectOption('#learning-region', 'shoulder');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip'),
    'logical-box'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip-y'),
    '0.54:0.90'
  );

  // Layer presets operate inside the isolated region. The field itself must
  // exist and be enabled; a closed "Отображение" disclosure is ordinary UI
  // state and should be reopened rather than mistaken for a missing control.
  assert.equal(await page.locator('#layer-preset-field').getAttribute('hidden'), null);
  assert.equal(await page.locator('#layer-preset').isDisabled(), false);
  const settingsOpen = await page.locator('.viewer-settings').evaluate(el => el.open);
  if (!settingsOpen) await page.locator('.viewer-settings > summary').click();

  await page.selectOption('#layer-preset', 'bones');
  assert.equal(await page.locator('#viewer').getAttribute('data-layer-preset'), 'bones');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'anatomical');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-scope'), 'regional');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'ghost');
  assert.equal(
    Number(await page.locator('#viewer').getAttribute('data-region-visible-bones')),
    regionalBoneCount
  );
  await page.waitForTimeout(350);
  await page.screenshot({
    path: '/tmp/muscle-memory-bodyparts-shoulder-bones.png',
    fullPage: true,
  });

  await page.selectOption('#layer-preset', 'muscles');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'off');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'anatomical');
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-connective-count')) > 0);
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-skin-count')) > 0);

  await page.selectOption('#layer-preset', 'fascia');
  assert.equal(await page.locator('#viewer').getAttribute('data-layer-preset'), 'fascia');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'ghost');
  assert.equal(await page.locator('#connective-mode').inputValue(), 'anatomical');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-connective-visible-layers'),
    'fascia'
  );
  await page.waitForTimeout(350);
  await page.screenshot({
    path: '/tmp/muscle-memory-bodyparts-shoulder-fascia.png',
    fullPage: true,
  });

  await page.selectOption('#layer-preset', 'skin');
  assert.equal(await page.locator('#viewer').getAttribute('data-layer-preset'), 'skin');
  assert.equal(await page.locator('#viewer').getAttribute('data-skin-mode'), 'anatomical');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'ghost');

  // Training temporarily strips all support layers but restores the
  // selected regional layer when the learner leaves the session.
  await page.selectOption('#layer-preset', 'fascia');
  await page.click('#mode-quiz');
  await page.click('[data-learning-mode="find"]');
  await page.click('#start-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-training-display'), 'true');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-training-hidden'), 'true');
  assert.equal(await page.locator('#viewer').getAttribute('data-connective-training-hidden'), 'true');
  assert.equal(await page.locator('#viewer').getAttribute('data-skin-training-hidden'), 'true');
  await page.click('#exit-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-training-display'), 'false');
  assert.equal(await page.locator('#viewer').getAttribute('data-layer-preset'), 'fascia');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'ghost');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-connective-visible-layers'),
    'fascia'
  );
  await page.click('#mode-explore');

  // Switch to a lower-limb block before searching for the iliotibial tract:
  // regional search must not leak structures from unrelated areas.
  await page.selectOption('#learning-region', 'lower-limb');
  assert.equal(await page.locator('#viewer').getAttribute('data-region-isolation'), 'true');
  if (!(await page.locator('.viewer-settings').evaluate(el => el.open))) {
    await page.locator('.viewer-settings > summary').click();
  }
  await page.selectOption('#layer-preset', 'fascia');
  await page.fill('#structure-search', 'подвздошно-большеберцовый');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  const fasciaResult = page.locator('.search-result').first();
  const fasciaLabel = await fasciaResult.innerText();
  assert.match(fasciaLabel, /Подвздошно-большеберцовый тракт/i);
  assert.doesNotMatch(fasciaLabel, /iliotibial/i);
  await fasciaResult.click();
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-study-layer'),
    'fascia'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-study-specific'),
    'true'
  );
  assert.match(await page.locator('#question').innerText(), /Подвздошно-большеберцовый тракт/i);
  assert.equal(await page.locator('#show-nearest-muscle').isVisible(), true);
  assert.match(await page.locator('#feedback').innerText(), /пространственный ориентир/i);

  await page.click('#isolate-selected');
  assert.match(await page.locator('#isolate-selected').innerText(), /Показать окружение/i);
  await page.click('#isolate-selected');
  assert.match(await page.locator('#isolate-selected').innerText(), /Изолировать/i);
  await page.click('#show-nearest-muscle');
  assert.match(await page.locator('#question-label').innerText(), /Мышца/i);

  await page.click('#isolate-selected');
  assert.match(await page.locator('#isolate-selected').innerText(), /Показать окружение/i);
  assert.equal(
    await page.locator('#viewer').getAttribute('data-bone-mode'),
    'xray'
  );
  assert.ok(
    Number(
      await page.locator('#viewer').getAttribute('data-selected-muscle-visible-bones')
    ) > 0,
    'Ordinary muscle isolation must keep relevant BodyParts3D bone landmarks'
  );
  await page.click('#isolate-selected');
  assert.match(await page.locator('#isolate-selected').innerText(), /Изолировать/i);
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-muscle-visible-bones'),
    ''
  );

  await page.fill('#structure-search', 'передняя большеберцовая');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  const tibialisLabel = await page.locator('.search-result').first().innerText();
  assert.match(tibialisLabel, /Передняя большеберцовая/i);
  assert.doesNotMatch(tibialisLabel, /tibialis anterior/i);

  await page.selectOption('#learning-region', 'all');
  if (await page.locator('#region-isolation').isChecked()) {
    await page.locator('#region-isolation').uncheck();
  }
  assert.equal(await page.locator('#viewer').getAttribute('data-region-isolation'), 'false');

  // Whole-atlas search after explicit exit from regional isolation.
  const translationCases = [
    ['gluteus maximus', /Большая ягодичная/i],
    ['supraspinatus', /Надостная/i],
    ['biceps brachii', /двуглав/i],
    ['sternocleidomastoid', /Грудино-ключично-сосцевидная/i],
  ];
  for (const [query, expected] of translationCases) {
    await page.fill('#structure-search', query);
    await page.waitForFunction(
      () => document.querySelectorAll('.search-result').length > 0,
      null,
      { timeout: 15000 }
    );
    const label = await page.locator('.search-result').first().innerText();
    assert.match(label, expected);
    assert.match(label, /\((справа|слева)\)$/i);
    assert.doesNotMatch(label, new RegExp(query, 'i'));
  }

  await page.fill('#structure-search', 'дельтовидная');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  assert.ok((await page.locator('.search-result').count()) > 0);

  await page.selectOption('#view-preset', 'front');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/muscle-memory-bodyparts-front.png', fullPage: true });

  await page.selectOption('#connective-mode', 'off');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/muscle-memory-bodyparts-front-no-connective.png', fullPage: true });
  await page.selectOption('#connective-mode', 'anatomical');
  await page.waitForTimeout(400);

  await page.selectOption('#view-preset', 'back');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/muscle-memory-bodyparts-back.png', fullPage: true });

  await page.locator('#focus-shoulder').dispatchEvent('click');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/muscle-memory-bodyparts-shoulder.png', fullPage: true });

  // Source round-trip: incompatible BodyParts tissue presets must not
  // leak into Z-Anatomy, while the selected learning block survives.
  await page.selectOption('#learning-region', 'shoulder');
  await page.selectOption('#layer-preset', 'fascia');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'ghost');
  await page.selectOption('#model-source', 'z-anatomy');
  await page.waitForFunction(
    () =>
      document.querySelector('#loading')?.classList.contains('is-hidden') &&
      document.querySelector('#viewer')?.dataset.modelSource === 'z-anatomy',
    null,
    { timeout: 150000 }
  );
  assert.equal(await page.locator('#learning-region').inputValue(), 'shoulder');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-scope'), 'shoulder');
  assert.equal(await page.locator('#viewer').getAttribute('data-muscle-mode'), 'anatomical');
  assert.equal(await page.locator('#layer-preset').inputValue(), 'muscles');
  assert.equal(await page.locator('#layer-preset').isDisabled(), true);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('[smoke:bodyparts] passed');
    await browser.close();
  })().catch(error => {
    console.error(error);
    process.exit(1);
  });
