const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
    console.log('[smoke:z-anatomy] start');
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

  assert.equal(
    await page.locator('#viewer').getAttribute('data-bone-mode'),
    'anatomical',
    'Atlas must start with the skeletal context visible'
  );
  assert.equal(await page.locator('#bone-mode').inputValue(), 'anatomical');
  assert.equal(await page.locator('#toggle-skeleton').isDisabled(), false);
  assert.equal(await page.locator('#toggle-skeleton').getAttribute('aria-pressed'), 'true');

  await page.click('#toggle-skeleton');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'off');
  assert.equal(await page.locator('#toggle-skeleton').getAttribute('aria-pressed'), 'false');

  await page.click('#toggle-skeleton');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'anatomical');
  assert.equal(await page.locator('#toggle-skeleton').getAttribute('aria-pressed'), 'true');

  await page.click('#display-panel-toggle');
  assert.equal(await page.locator('#display-panel').isHidden(), false);
  assert.match(await page.locator('#display-panel').innerText(), /Скелет и костные ориентиры/);
  assert.match(await page.locator('#display-panel').innerText(), /Ориентиры безопасности/);
  const nervousToggle = page.locator('[data-reference-layer="nervous"]');
  assert.equal(await nervousToggle.isDisabled(), false);
  await nervousToggle.check();
  await page.waitForFunction(
    () => (document.querySelector('#viewer')?.dataset.referenceLayers || '')
      .split(',')
      .includes('nervous'),
    null,
    { timeout: 150000 }
  );
  await page.click('#display-panel-close');
  assert.equal(await page.locator('#display-panel').isHidden(), true);

  await page.fill('#structure-search', 'подмышечный нерв');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  const nerveResult = page.locator('.search-result').filter({ hasText: /Подмышечный нерв/i }).first();
  assert.equal(await nerveResult.count(), 1, 'Russian safety-landmark search must find axillary nerve');
  assert.doesNotMatch(await nerveResult.innerText(), /axillary nerve/i);
  await nerveResult.click();
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-reference-layer'),
    'nervous'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-reference-specific'),
    'true'
  );
  assert.match(await page.locator('#question-label').innerText(), /Нервная система/i);
  assert.match(await page.locator('#question').innerText(), /Подмышечный нерв/i);
  assert.equal(await page.locator('#focus-selected').isDisabled(), false);

  const visibleInitialText = await page.locator('body').innerText();
  assert.doesNotMatch(visibleInitialText, /Учебный каталог|треугольник|mesh|FMA\d+/i);

  console.log('[smoke:z-anatomy] reference-card');
  await page.fill('#structure-search', 'трапециевидная');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  const trapeziusResult = page.locator('.search-result').filter({ hasText: /Трапециевидн/i }).first();
  assert.equal(await trapeziusResult.count(), 1);
  await trapeziusResult.click();

  assert.equal(await page.locator('#structure-reference').isHidden(), false);
  assert.match(await page.locator('#structure-reference-heading').innerText(), /Справка по мышце/i);
  assert.equal(await page.locator('#structure-reference').getAttribute('data-reference-id'), 'trapezius');
  assert.equal(
    await page.locator('#structure-reference').getAttribute('data-reference-has-primary-art'),
    'true'
  );
  assert.equal(await page.locator('#structure-reference-primary-art').isHidden(), false);
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-reference-illustration'),
    'primary'
  );
  assert.ok(
    await page.locator('#structure-reference details[data-reference-default-open][open]').count() >= 2
  );
  assert.ok((await page.locator('#structure-reference-origin').innerText()).trim().length > 10);
  assert.ok((await page.locator('#structure-reference-insertion').innerText()).trim().length > 10);
  assert.ok((await page.locator('#structure-reference-actions li').count()) > 0);

  await page.fill('#structure-search', 'подостная');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  const infraspinatusResult = page.locator('.search-result').filter({ hasText: /Подостн/i }).first();
  assert.equal(await infraspinatusResult.count(), 1);
  await infraspinatusResult.click();
  assert.equal(await page.locator('#structure-reference').getAttribute('data-reference-id'), 'infraspinatus');
  assert.ok(
    Number(await page.locator('#structure-reference').getAttribute('data-reference-atlas-illustration-count')) >= 1
  );
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  assert.match(
    await page.locator('#structure-reference-illustrations img').first().getAttribute('src'),
    /gray412-shoulder\.png$/
  );

  await page.screenshot({
    path: '/tmp/muscle-memory-reference-card.png',
    fullPage: true,
  });

    console.log('[smoke:z-anatomy] search/depth/deeper-links');
  await page.fill('#structure-search', 'deltoid');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  assert.ok((await page.locator('.search-result').count()) > 0);
  const zDeltoidResult = page.locator('.search-result').first();
  const zDeltoidLabel = await zDeltoidResult.innerText();
  assert.match(zDeltoidLabel, /Дельтовидн/i);
  assert.match(zDeltoidLabel, /\((справа|слева)\)$/i);
  assert.doesNotMatch(zDeltoidLabel, /deltoid/i);

  await zDeltoidResult.click();
  assert.match(await page.locator('#question').innerText(), /Дельтовидн/i);

  // Regression from the specimen audit: changing the virtual specimen must
  // clear the previous selected-muscle card/search instead of showing, e.g.,
  // "Шейно-воротниковая зона" together with a stale deltoid selection.
  await page.selectOption('#learning-region', 'neck-collar');
  assert.match(await page.locator('#question-label').innerText(), /^атлас$/i);
  assert.equal(await page.locator('#question').innerText(), 'Выберите структуру');
  assert.equal(await page.locator('#structure-search').inputValue(), '');
  assert.equal(await page.locator('#deeper-structures').isHidden(), true);
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip'),
    'logical-box'
  );

  // Z-Anatomy has the complete five-target abdominal wall needed for
  // the curated depth profile.
  await page.selectOption('#learning-region', 'abdomen');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-learning-target-count'),
    '5'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-depth-source-capability'),
    'ok'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip'),
    'logical-box'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip-y'),
    '0.31:0.62'
  );

  // Literal atlas path: find a superficial muscle through the user
  // interface, follow a verified deeper relation, isolate it, then restore
  // the regional specimen. Exact point-click depth remains separately
  // constrained by the ray stack in app.js.
  await page.selectOption('#view-preset', 'front');
  await page.fill('#structure-search', 'наружная косая');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  const obliqueResult = page.locator('.search-result').first();
  assert.match(await obliqueResult.innerText(), /Наружная косая/i);
  await obliqueResult.click();

  await page.waitForFunction(
    () => {
      const panel = document.querySelector('#deeper-structures');
      return panel && !panel.hidden &&
        document.querySelectorAll('.deeper-structure').length > 0;
    },
    null,
    { timeout: 15000 }
  );
  assert.match(
    await page.locator('#deeper-structures').innerText(),
    /Глубже относительно этой мышцы|Глубже здесь/i
  );
  assert.match(
    await page.locator('#deeper-structures').innerText(),
    /Внутренняя косая/i
  );

  await page.locator('.deeper-structure').first().click();
  assert.equal(
    await page.locator('#viewer').getAttribute('data-deeper-focus'),
    'true'
  );
  assert.ok(
    Number(
      await page.locator('#viewer').getAttribute('data-deeper-focus-component-count')
    ) >= 1
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-bone-mode'),
    'anatomical'
  );
  assert.ok(
    Number(
      await page.locator('#viewer').getAttribute('data-selected-muscle-visible-bones')
    ) > 0,
    'Deep-muscle isolation must keep at least one relevant bone landmark'
  );
  assert.match(
    await page.locator('#isolate-selected').innerText(),
    /Показать окружение/i
  );
  await page.click('#isolate-selected');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-deeper-focus'),
    'false'
  );
  assert.equal(
    await page.locator('#viewer').getAttribute('data-selected-muscle-visible-bones'),
    ''
  );
  assert.match(
    await page.locator('#isolate-selected').innerText(),
    /Изолировать/i
  );

    if (errors.length) throw new Error(errors.join('\n'));
    console.log('[smoke:z-anatomy] passed');
    await browser.close();
  })().catch(error => {
    console.error(error);
    process.exit(1);
  });
