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
  }

  console.log('[smoke:pelvic-reference] puborectalis');
  await openCard('puborectalis', 'puborectalis');
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  const puborectalisSrcs = await page.locator('#structure-reference-illustrations img')
    .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
  assert.ok(
    puborectalisSrcs.some(src => /Pelvic_Muscles_.*Female_Inferior/i.test(src)),
    'Puborectalis labeled anatomical image is missing'
  );
  assert.ok(
    puborectalisSrcs.some(src => /Stylized_depiction_of_action_of_puborectalis_sling/i.test(src)),
    'Puborectalis focused sling diagram is missing'
  );
  assert.equal(await page.locator('#structure-reference-functional-details').isHidden(), false);
  const puborectalisFunctional = await page.locator('#structure-reference-functional').innerText();
  assert.match(puborectalisFunctional, /Наружный сфинктер заднего прохода/i);
  assert.match(puborectalisFunctional, /отдельн.*антагонист/i);

  console.log('[smoke:pelvic-reference] levator ani');
  await openCard('levator ani', 'levator-ani');
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  const levatorSrcs = await page.locator('#structure-reference-illustrations img')
    .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
  assert.ok(
    levatorSrcs.some(src => /Gray404\.png/i.test(src)),
    'Levator ani Gray 404 image is missing'
  );
  assert.equal(await page.locator('#structure-reference-functional-details').isHidden(), false);
  const levatorFunctional = await page.locator('#structure-reference-functional').innerText();
  assert.match(levatorFunctional, /Копчиковая мышца/i);
  assert.match(levatorFunctional, /отдельн.*антагонист/i);

  assert.equal(errors.length, 0, errors.join(' || '));
  console.log('[smoke:pelvic-reference] pelvic-floor cards, images and functional relations ok');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
