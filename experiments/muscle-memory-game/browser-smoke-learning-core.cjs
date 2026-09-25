const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
    console.log('[smoke:learning-core] start');
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

  console.log('[smoke:learning-core] scopes');
    await page.click('#mode-quiz');
  assert.equal(await page.locator('#learning-controls').isVisible(), true);

  await page.selectOption('#learning-region', 'upper-limb');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-scope'), 'upper-limb');
  assert.ok(
    Number(await page.locator('#viewer').getAttribute('data-learning-target-count')) > 30
  );
  assert.match(await page.locator('#learning-summary').innerText(), /Верхняя конечность/);
  assert.equal(await page.locator('#region-isolation').isChecked(), true);
  assert.equal(await page.locator('#viewer').getAttribute('data-region-isolation'), 'true');
  assert.ok(
    Number(await page.locator('#viewer').getAttribute('data-region-visible-muscles')) >=
    Number(await page.locator('#viewer').getAttribute('data-learning-target-count'))
  );
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-mode'), 'off');
  assert.equal(await page.locator('#viewer').getAttribute('data-bone-scope'), 'regional');
  assert.ok(
    Number(await page.locator('#viewer').getAttribute('data-region-visible-bones')) > 0
  );
  await page.waitForTimeout(350);
  await page.screenshot({
    path: '/tmp/muscle-memory-learning-upper-limb.png',
    fullPage: true,
  });

  await page.selectOption('#learning-region', 'rotator-cuff');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-learning-target-count'),
    '4'
  );
  assert.equal(await page.locator('#learning-session-size').inputValue(), '4');
  assert.match(await page.locator('#learning-session-size option').first().innerText(), /Весь блок.*4/i);

  await page.selectOption('#learning-region', 'neck');
  const neckCount = Number(
    await page.locator('#viewer').getAttribute('data-learning-target-count')
  );
  assert.ok(neckCount >= 8);

  await page.selectOption('#learning-region', 'neck-collar');
  const neckCollarCount = Number(
    await page.locator('#viewer').getAttribute('data-learning-target-count')
  );
  assert.ok(neckCollarCount > neckCount);
  await page.waitForTimeout(350);
  await page.screenshot({
    path: '/tmp/muscle-memory-learning-neck-collar.png',
    fullPage: true,
  });

  await page.selectOption('#learning-region', 'shoulder');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-region'), 'shoulder');
  assert.equal(await page.locator('#focus-shoulder').isVisible(), true);
  assert.equal(
    await page.locator('#viewer').getAttribute('data-learning-target-count'),
    '13'
  );
  assert.match(await page.locator('#learning-summary').innerText(), /Плечевой пояс/);

  await page.selectOption('#learning-region', 'all');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-region'), 'all');
  assert.equal(
    await page.locator('#viewer').getAttribute('data-specimen-clip'),
    'none'
  );

  console.log('[smoke:learning-core] find/name/retention');
    // Pass 2: finite learning sessions must work as real flows.
  await page.selectOption('#learning-region', 'shoulder');
  await page.selectOption('#learning-session-size', '5');

  // FIND: start, reveal one answer, advance.
  await page.click('[data-learning-mode="find"]');
  await page.click('#start-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'find');
  assert.equal(await page.locator('#model-source-field').isHidden(), true);
  assert.equal(await page.locator('.viewer-settings').isHidden(), true);
  assert.equal(await page.locator('.viewer-hint').isHidden(), true);
  assert.equal(await page.locator('.attribution').isHidden(), true);
  assert.equal(await page.locator('#exit-learning-session').isVisible(), true);
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-total'), '5');
  assert.match(await page.locator('#question').innerText(), /Найдите:/);
  await page.click('#show-answer');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-done'), '1');
  assert.match(await page.locator('#session-progress').innerText(), /1 из 5/i);
  let storedLearning = await page.evaluate(() =>
    localStorage.getItem('muscle-memory-learning-v1')
  );
  assert.ok(storedLearning && storedLearning.includes('::find'));

  // Finish the whole five-item session and open its result.
  for (let done = 1; done < 5; done += 1) {
    await page.click('#next-question');
    await page.click('#show-answer');
    assert.equal(
      await page.locator('#viewer').getAttribute('data-learning-session-done'),
      String(done + 1)
    );
  }
  await page.click('#next-question');
  assert.match(await page.locator('#question-label').innerText(), /Сессия завершена/i);
  assert.match(await page.locator('#next-question').innerText(), /Повторить ошибки/);

  // The result screen must start a mistake-review session directly.
  await page.click('#next-question');
  assert.equal(await page.locator('#learning-session-mode').inputValue(), 'mistakes');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'mistakes');
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-learning-session-total')) > 0);
  assert.equal(await page.locator('#exit-learning-session').isVisible(), true);
  await page.click('#exit-learning-session');

  assert.equal(await page.locator('#learning-progress').isVisible(), true);
  await page.locator('#learning-progress > summary').click();
  assert.match(await page.locator('#learning-progress-content').innerText(), /Слабые места|Выбранная область|Плечевой пояс/i);

  // Pass 3: due work is offered as one action, not as a statistics dashboard.
  assert.equal(await page.locator('#today-learning-session').isVisible(), true);
  assert.match(await page.locator('#today-learning-session').innerText(), /Повторить сегодня/i);
  await page.click('#today-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'today');
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-learning-session-total')) > 0);
  await page.click('#exit-learning-session');

  // NAME: four smart choices, eventually one must complete the item.
  await page.click('[data-learning-mode="name"]');
  await page.click('#start-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'name');
  assert.equal(await page.locator('.name-choice').count(), 4);
  assert.match(await page.locator('#question').innerText(), /Назовите выделенную мышцу/);
  assert.equal(await page.locator('#viewer').getAttribute('data-name-target-visible'), 'true');
  assert.ok(
    Number(await page.locator('#viewer').getAttribute('data-name-target-component-count')) >= 1
  );
  assert.match(
    await page.locator('#viewer').getAttribute('data-name-target-presentation'),
    /^(context|isolated)$/
  );
  const currentTargetId = await page.locator('#viewer').getAttribute('data-learning-current-target-id');
  const wrongChoice = page.locator('.name-choice').filter({ hasNot: page.locator('[data-target-id="' + currentTargetId + '"]') }).first();
  const wrongButtons = page.locator('.name-choice');
  let wrongIndex = -1;
  for (let i = 0; i < await wrongButtons.count(); i += 1) {
    if ((await wrongButtons.nth(i).getAttribute('data-target-id')) !== currentTargetId) {
      wrongIndex = i;
      break;
    }
  }
  assert.ok(wrongIndex >= 0);
  const wrongLabel = await wrongButtons.nth(wrongIndex).innerText();
  const correctLabel = await page.locator(
    '.name-choice[data-target-id="' + currentTargetId + '"]'
  ).innerText();
  await wrongButtons.nth(wrongIndex).click();
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-done'), '0');
  const correctionFeedback = await page.locator('#feedback').innerText();
  assert.ok(correctionFeedback.includes(wrongLabel));
  assert.equal(correctionFeedback.includes(correctLabel), false);
  await page.locator('.name-choice[data-target-id="' + currentTargetId + '"]').click();
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-done'), '1');
  assert.match(await page.locator('#feedback').innerText(), /Верно после коррекции/i);
  storedLearning = await page.evaluate(() =>
    localStorage.getItem('muscle-memory-learning-v1')
  );
  assert.ok(storedLearning && storedLearning.includes('::name'));
  await page.click('#exit-learning-session');

  // Pass 3: due work becomes one direct action, not another dashboard.
  assert.equal(await page.locator('#today-learning-session').isVisible(), true);
  assert.match(await page.locator('#today-learning-session').innerText(), /Повторить сегодня/i);
  assert.equal(await page.locator('#learning-progress').isVisible(), true);
  if (!(await page.locator('#learning-progress').evaluate(el => el.open))) {
    await page.locator('#learning-progress > summary').click();
  }
  assert.match(await page.locator('#learning-progress-content').innerText(), /Найти:|Назвать:/i);
  assert.ok((await page.locator('.progress-confusion').count()) > 0);
  await page.screenshot({ path: '/tmp/muscle-memory-learning-progress.png', fullPage: true });
  await page.locator('.progress-confusion').first().click();
  assert.equal(await page.locator('#mode-explore').getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('#question-label').innerText(), /Сравнение/i);
  await page.click('#mode-quiz');

  assert.equal(await page.locator('#today-learning-session').isVisible(), true);
  await page.click('#today-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'today');
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-learning-session-total')) > 0);
  assert.match(await page.locator('#question-label').innerText(), /На сегодня/i);
  await page.click('#exit-learning-session');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('[smoke:learning-core] passed');
    await browser.close();
  })().catch(error => {
    console.error(error);
    process.exit(1);
  });
