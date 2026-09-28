const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:bodyparts-hand] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];

  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  await page.goto('http://127.0.0.1:4173/?mode=explore', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden'),
    null,
    { timeout: 150000 }
  );

  if (await page.locator('#display-panel').isHidden()) {
    await page.click('#display-panel-toggle');
  }
  await page.selectOption('#model-source', 'bodyparts4');
  await page.waitForFunction(
    () =>
      document.querySelector('#loading')?.classList.contains('is-hidden') &&
      document.querySelector('#viewer')?.dataset.modelSource === 'bodyparts4',
    null,
    { timeout: 180000 }
  );

  await page.selectOption('#learning-region', 'all');

  async function selectMuscle(query, referenceId) {
    await page.fill('#structure-search', query);
    await page.waitForFunction(
      () => document.querySelectorAll('.search-result').length > 0,
      null,
      { timeout: 15000 }
    );
    const result = page.locator('.search-result').first();
    assert.equal(await result.count(), 1, query + ': search result missing');
    await result.click({ noWaitAfter: true });
    await page.waitForFunction(
      expectedId =>
        document.querySelector('#structure-reference')?.getAttribute('data-reference-id') === expectedId,
      referenceId,
      { timeout: 15000 }
    );

    assert.equal(
      await page.locator('#structure-reference').getAttribute('data-reference-id'),
      referenceId,
      query + ': wrong canonical reference card'
    );
    await page.waitForFunction(
      () => document.querySelector('[data-reference-3d="true"] canvas'),
      null,
      { timeout: 15000 }
    );
    assert.equal(
      await page.locator('[data-reference-3d="true"] canvas').count(),
      1,
      query + ': interactive 3D card missing'
    );
  }

  console.log('[smoke:bodyparts-hand] five canonical interactive 3D cards');
  for (const [query, referenceId] of [
    ['abductor digiti minimi of right hand', 'abductor-digiti-minimi-hand'],
    ['flexor digiti minimi brevis of left hand', 'flexor-digiti-minimi-brevis-hand'],
    ['opponens digiti minimi of right hand', 'opponens-digiti-minimi'],
    ['set of palmar interossei of left hand', 'palmar-interossei'],
    ['set of dorsal interossei of right hand', 'dorsal-interossei'],
  ]) {
    console.log('[smoke:bodyparts-hand] interactive 3D card: ' + query);
    await selectMuscle(query, referenceId);
  }

  await page.fill('#structure-search', 'palmaris brevis');
  await page.waitForTimeout(250);
  assert.equal(
    await page.locator('.search-result').count(),
    0,
    'Palmaris brevis must not be synthesized from a neighbouring BodyParts3D mesh'
  );
  assert.match(
    await page.locator('#search-results').innerText(),
    /Совпадений не найдено/i
  );

  await page.screenshot({
    path: '/tmp/muscle-memory-bodyparts-hand.png',
    fullPage: true,
  });

  assert.equal(errors.length, 0, errors.join(' || '));
  console.log('[smoke:bodyparts-hand] intrinsic hand 3D mappings ok; palmaris brevis remains reference-only');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
