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

  const visibleInitialText = await page.locator('body').innerText();
  assert.doesNotMatch(visibleInitialText, /Учебный каталог|треугольник|mesh|FMA\d+/i);

    console.log('[smoke:z-anatomy] search/depth/deeper-links');
  await page.fill('#structure-search', 'deltoid');
  await page.waitForFunction(
    () => document.querySelectorAll('.search-result').length > 0,
    null,
    { timeout: 15000 }
  );
  assert.ok((await page.locator('.search-result').count()) > 0);
  const zDeltoidLabel = await page.locator('.search-result').first().innerText();
  assert.match(zDeltoidLabel, /Дельтовидн/i);
  assert.match(zDeltoidLabel, /\((справа|слева)\)$/i);
  assert.doesNotMatch(zDeltoidLabel, /deltoid/i);

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
  assert.match(
    await page.locator('#isolate-selected').innerText(),
    /Показать окружение/i
  );
  await page.click('#isolate-selected');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-deeper-focus'),
    'false'
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
