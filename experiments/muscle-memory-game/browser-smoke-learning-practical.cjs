const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
    console.log('[smoke:learning-practical] start');
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

    await page.click('#mode-quiz');
    await page.selectOption('#learning-region', 'shoulder');
    await page.selectOption('#learning-session-size', '5');
    console.log('[smoke:learning-practical] practical/control/mobile');
  // PRACTICAL: mixed finite practice, not a duplicate FIND flow.
  await page.click('[data-learning-mode="practical"]');
  await page.click('#start-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'practical');
  assert.match(await page.locator('#question-label').innerText(), /Практикум/i);
  assert.match(await page.locator('#session-progress').innerText(), /1 из 5/i);
  for (let done = 0; done < 5; done += 1) {
    await page.click('#show-answer');
    assert.equal(
      await page.locator('#viewer').getAttribute('data-learning-session-done'),
      String(done + 1)
    );
    if (done < 4) await page.click('#next-question');
  }
  const storedAfterPracticalCompletion = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('muscle-memory-learning-v1') || '{}')
  );
  assert.ok(
    (storedAfterPracticalCompletion.sessions || []).some(
      entry => entry.mode === 'practical' && entry.total === 5
    ),
    'Completed session must be in history before the learner opens the summary'
  );
  await page.click('#next-question');
  assert.match(await page.locator('#question-label').innerText(), /Сессия завершена/i);
  await page.screenshot({ path: '/tmp/muscle-memory-learning-summary.png', fullPage: true });

  // CONTROL: one timed attempt, no reveal or layer hint before the answer.
  await page.click('#mode-explore');
  await page.click('#mode-quiz');
  await page.click('[data-learning-mode="exam"]');
  assert.equal(await page.locator('#exam-time-field').isVisible(), true);
  await page.selectOption('#exam-item-seconds', '30');
  await page.click('#start-learning-session');
  assert.equal(await page.locator('#viewer').getAttribute('data-learning-session-mode'), 'exam');
  assert.equal(await page.locator('#show-answer').isHidden(), true);
  assert.equal(await page.locator('#reveal-deeper').isHidden(), true);
  const examSeconds = Number(await page.locator('#viewer').getAttribute('data-exam-seconds'));
  assert.ok(examSeconds > 0 && examSeconds <= 30);
  assert.match(await page.locator('#session-progress').innerText(), /\d+ с/);
  const examSkill = await page.locator('#viewer').getAttribute('data-learning-current-skill');
  if (examSkill === 'find') {
    assert.equal(
      await page.locator('#viewer').getAttribute('data-exam-find-accessible'),
      'true'
    );
  }
  await page.screenshot({ path: '/tmp/muscle-memory-learning-control.png', fullPage: true });
  await page.click('#exit-learning-session');

  // Return to setup before checking the mobile NAME flow.
  await page.click('#mode-explore');
  await page.click('#mode-quiz');

  // Mobile training becomes a task sheet attached to the 3D viewer.
  await page.setViewportSize({ width: 412, height: 915 });
  await page.click('[data-learning-mode="name"]');
  await page.click('#start-learning-session');
  assert.equal(await page.locator('#learning-controls').isHidden(), true);
  assert.equal(await page.locator('.name-choice').count(), 4);
  assert.equal(await page.locator('#viewer').getAttribute('data-name-target-visible'), 'true');
  assert.equal(
    await page.locator('.question-card').evaluate(el => el.parentElement?.classList.contains('viewer-wrap')),
    true
  );
  assert.equal(await page.locator('#score').isHidden(), true);
  assert.equal(await page.locator('.topbar').isHidden(), true);
  assert.equal(await page.locator('.attribution').isHidden(), true);
  assert.match(await page.locator('#session-progress').innerText(), /1 из 5/i);
  await page.screenshot({ path: '/tmp/muscle-memory-learning-mobile-name.png', fullPage: true });

  // Active mobile training intentionally hides the top bar. Exit the
  // session first, then switch to the atlas through the visible mode control.
  await page.click('#exit-learning-session');
  assert.equal(await page.locator('.topbar').isVisible(), true);
  await page.click('#mode-explore');
  assert.equal(
    await page.locator('.question-card').evaluate(el => el.parentElement?.classList.contains('viewer-wrap')),
    true
  );
  assert.equal(await page.locator('#explore-controls').isVisible(), true);
  assert.equal(await page.locator('#structure-search').isVisible(), true);
  await page.screenshot({ path: '/tmp/muscle-memory-atlas-mobile.png', fullPage: true });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('[smoke:learning-practical] passed');
    await browser.close();
  })().catch(error => {
    console.error(error);
    process.exit(1);
  });
