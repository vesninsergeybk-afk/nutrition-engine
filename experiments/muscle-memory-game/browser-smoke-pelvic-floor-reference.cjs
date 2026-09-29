const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  console.log('[smoke:pelvic-reference] start');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(120000);
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

  async function openCard(query, expectedId) {
    await page.fill('#structure-search', query);
    await page.waitForFunction(
      () => document.querySelectorAll('.search-result').length > 0,
      null,
      { timeout: 30000 }
    );
    await page.locator('.search-result').first().click({ timeout: 120000 });
    await page.waitForFunction(
      id => document.querySelector('#structure-reference')?.getAttribute('data-reference-id') === id,
      expectedId,
      { timeout: 30000 }
    );
    assert.equal(
      await page.locator('#structure-reference').getAttribute('data-reference-id'),
      expectedId
    );
    assert.equal(await page.locator('#structure-reference').isHidden(), false);
    assert.equal(await page.locator('#structure-reference-functional-details').isHidden(), false);
  }

  async function gallerySources() {
    return page.locator('#structure-reference-illustrations img')
      .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
  }

  async function visibleFunctionalText() {
    const details = page.locator('#structure-reference-functional-details');
    assert.equal(await details.isHidden(), false);
    await details.evaluate(element => { element.open = false; });
    await details.locator('summary').click();
    assert.equal(
      await details.evaluate(element => element.open),
      true,
      'Functional relations section did not open'
    );
    return (await page.locator('#structure-reference-functional').textContent()) || '';
  }

  console.log('[smoke:pelvic-reference] puborectalis');
  await openCard('puborectalis', 'puborectalis');

  const puborectalisModuleDiagnostic = await page.evaluate(async () => {
    const module = await import('./muscle-reference-data.js');
    const reference = module.muscleReferenceFor('Left puborectalis');
    return {
      id: reference?.id || null,
      functionalRelations: (reference?.functionalRelations || []).map(row => ({
        movementId: row.movementId,
        movementRu: row.movementRu,
        synergists: (row.synergists || []).map(item => item.nameRu),
        antagonists: (row.antagonists || []).map(item => item.nameRu),
        noteRu: row.noteRu || '',
      })),
    };
  });
  const puborectalisDomDiagnostic = await page.locator('#structure-reference-functional-details')
    .evaluate(details => ({
      hidden: details.hidden,
      open: details.open,
      functionalHtml: details.querySelector('#structure-reference-functional')?.innerHTML || '',
      functionalText: details.querySelector('#structure-reference-functional')?.textContent || '',
      childCount: details.querySelector('#structure-reference-functional')?.children.length || 0,
    }));
  console.log('[smoke:pelvic-reference] module diagnostic', JSON.stringify(puborectalisModuleDiagnostic));
  console.log('[smoke:pelvic-reference] DOM diagnostic', JSON.stringify(puborectalisDomDiagnostic));

  assert.equal(puborectalisModuleDiagnostic.id, 'puborectalis');
  assert.ok(
    puborectalisModuleDiagnostic.functionalRelations.some(
      row => row.movementId === 'anal-continence' &&
        row.synergists.some(name => /Наружный сфинктер заднего прохода/i.test(name))
    ),
    'Browser module lost puborectalis continence synergy'
  );

  let srcs = await gallerySources();
  assert.ok(
    srcs.some(src => /Pelvic_Muscles_.*Female_Inferior/i.test(src)),
    'Puborectalis labeled anatomical image is missing'
  );
  assert.ok(
    srcs.some(src => /Stylized_depiction_of_action_of_puborectalis_sling/i.test(src)),
    'Puborectalis focused sling diagram is missing'
  );
  const puborectalisFunctional = await page.locator('#structure-reference-functional').innerText();
  assert.match(puborectalisFunctional, /Наружный сфинктер заднего прохода/i);
  assert.match(puborectalisFunctional, /отдельн.*антагонист/i);

  console.log('[smoke:pelvic-reference] pubococcygeus');
  await openCard('pubococcygeus', 'pubococcygeus');
  srcs = await gallerySources();
  assert.ok(
    srcs.some(src => /Pelvic_Muscles_.*Female_Inferior/i.test(src)),
    'Pubococcygeus labeled anatomical image is missing'
  );
  assert.match(
    await visibleFunctionalText(),
    /Лобково-прямокишечная|Подвздошно-копчиковая|Копчиковая/i
  );

  console.log('[smoke:pelvic-reference] iliococcygeus');
  await openCard('iliococcygeus', 'iliococcygeus');
  srcs = await gallerySources();
  assert.ok(
    srcs.some(src => /Pelvic_Muscles_.*Female_Inferior/i.test(src)),
    'Iliococcygeus labeled anatomical image is missing'
  );
  assert.match(
    await visibleFunctionalText(),
    /Лобково-прямокишечная|Лобково-копчиковая|Копчиковая/i
  );

  console.log('[smoke:pelvic-reference] coccygeus');
  await openCard('coccygeus', 'coccygeus');
  srcs = await gallerySources();
  assert.ok(
    srcs.some(src => /Gray404\.png/i.test(src)),
    'Coccygeus Gray 404 image is missing'
  );
  assert.match(
    await visibleFunctionalText(),
    /Лобково-прямокишечная|Лобково-копчиковая|Подвздошно-копчиковая/i
  );

  assert.equal(errors.length, 0, errors.join(' || '));
  console.log('[smoke:pelvic-reference] four mesh-backed pelvic-floor cards ok; levator ani is verified as reference-only group card');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
