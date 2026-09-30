const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
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

  async function search(query) {
    await page.fill('#structure-search', query);
    await page.waitForFunction(
      () => document.querySelectorAll('.search-result').length > 0,
      null,
      { timeout: 15000 }
    );
  }

  async function assertCard(id) {
    await page.click("#reference-tab-overview");
    assert.equal(await page.locator('#structure-reference').isHidden(), false);
    assert.equal(
      await page.locator('#structure-reference').getAttribute('data-reference-id'),
      id
    );
    assert.match(
      await page.locator('#structure-reference-heading').innerText(),
      /Справка по мышце/i
    );
  }

  async function bestEffortScreenshot(path) {
    try {
      await page.screenshot({ path, fullPage: true, timeout: 15000 });
    } catch (error) {
      console.warn('[reference-smoke] screenshot skipped:', path, error.message);
    }
  }

  console.log('[reference-smoke] trapezius part -> parent muscle');
  await search('трапециевидная');
  let trapeziusPart = page.locator('.search-result').filter({
    hasText: /часть.*трапециевид/i,
  }).first();
  if (await trapeziusPart.count() === 0) {
    trapeziusPart = page.locator('.search-result').filter({
      hasText: /трапециевид/i,
    }).first();
  }
  assert.equal(await trapeziusPart.count(), 1);
  await trapeziusPart.click();
  await assertCard('trapezius');
  assert.equal(
    await page.locator('#structure-reference').getAttribute('data-reference-has-primary-art'),
    'true'
  );
  if (/часть/i.test(await page.locator('#question-label').innerText())) {
    assert.match(await page.locator('#structure-reference-context').innerText(), /(?:Выбранная часть|Выбрана часть).*справка.*мышц/i);
    assert.ok(Number(await page.locator('#viewer').getAttribute('data-selected-parent-context-count')) >= 1);
  }
  await bestEffortScreenshot('/tmp/muscle-memory-reference-trapezius.png');

  console.log('[reference-smoke] infraspinatus -> Gray 412');
  await search('подостная');
  const infraspinatus = page.locator('.search-result').filter({ hasText: /Подостн/i }).first();
  assert.equal(await infraspinatus.count(), 1);
  await infraspinatus.click();
  await assertCard('infraspinatus');
  assert.equal(await page.locator('#structure-reference-primary-art').isHidden(), true);
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  assert.match(
    (await page.locator('#structure-reference-illustrations img').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')).join(' '))),
    /gray412-shoulder\.png/
  );
  await bestEffortScreenshot('/tmp/muscle-memory-reference-infraspinatus.png');

  console.log('[reference-smoke] latissimus -> exact course art; no stale Gray 412');
  await search('широчайшая');
  const latissimus = page.locator('.search-result').filter({ hasText: /Широчайш/i }).first();
  assert.equal(await latissimus.count(), 1);
  await latissimus.click();
  await assertCard('latissimus-dorsi');
  assert.equal(
    await page.locator('#structure-reference').getAttribute('data-reference-has-primary-art'),
    'true'
  );
  assert.equal(await page.locator('#structure-reference-primary-art').isHidden(), true);
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  await bestEffortScreenshot('/tmp/muscle-memory-reference-latissimus.png');

  console.log('[reference-smoke] external oblique -> local Gray 392');
  await search('external oblique');
  const external = page.locator('.search-result').filter({ hasText: /Наружн.*кос/i }).first();
  assert.equal(await external.count(), 1);
  await external.click();
  await assertCard('external-oblique');
  assert.equal(await page.locator('#structure-reference-primary-art').isHidden(), true);
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  assert.match(
    await page.locator('#structure-reference-illustrations img').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')).join(' ')),
    /gray392-external-oblique\.png/
  );
  await bestEffortScreenshot('/tmp/muscle-memory-reference-external-oblique.png');

  // The pinned Z GLB has no puborectalis or levator ani muscle mesh. Verify
  // these canonical cards on the model that actually includes them.
  await page.click('#display-panel-toggle');
  await page.selectOption('#model-source', 'bodyparts4');
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('is-hidden') &&
      document.querySelector('#viewer')?.dataset.modelSource === 'bodyparts4',
    null,
    { timeout: 150000 }
  );
  await page.click('#display-panel-close');

  console.log('[reference-smoke] puborectalis -> exact labeled art + continence synergy');
  await search('puborectalis');
  const puborectalis = page.locator('.search-result').filter({ hasText: /Лобково-прямокишечн/i }).first();
  assert.equal(await puborectalis.count(), 1);
  await puborectalis.click();
  await assertCard('puborectalis');
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  assert.ok(
    Number(await page.locator('#structure-reference').getAttribute('data-reference-atlas-illustration-count')) >= 2
  );
  const puborectalisImageSources = await page.locator('#structure-reference-illustrations img')
    .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
  assert.ok(
    puborectalisImageSources.some(src => /Pelvic_Muscles_.*Female_Inferior/i.test(src)) &&
      puborectalisImageSources.some(src => /Stylized_depiction_of_action_of_puborectalis_sling/i.test(src)),
    'Puborectalis must show both the labeled anatomical plate and focused sling diagram'
  );
  await page.click('#reference-tab-movement');
  await page.selectOption('#functional-movement', { label: 'Поддержание анальной континенции' });
  assert.equal(await page.locator('#structure-reference-functional-details').isHidden(), false);
  assert.match(
    await page.locator('#structure-reference-functional').innerText(),
    /Наружный сфинктер заднего прохода/i
  );
  assert.match(
    await page.locator('#structure-reference-functional').innerText(),
    /антагонист/i
  );
  await bestEffortScreenshot('/tmp/muscle-memory-reference-puborectalis.png');

  // BodyParts exposes the levator ani components separately, not a whole
  // levator ani mesh. The canonical whole-complex card is checked in the
  // data suite; use actual coccygeus geometry to verify this shared plate.
  console.log('[reference-smoke] coccygeus -> Gray 404 + curated pelvic-floor relation');
  await search('coccygeus');
  const coccygeus = page.locator('.search-result').filter({ hasText: /^Копчиковая мышца/i }).first();
  assert.equal(await coccygeus.count(), 1);
  await coccygeus.click();
  await assertCard('coccygeus');
  assert.equal(await page.locator('#structure-reference-atlas-block').isHidden(), false);
  const levatorImageSources = await page.locator('#structure-reference-illustrations img')
    .evaluateAll(nodes => nodes.map(node => node.getAttribute('src') || ''));
  assert.ok(
    levatorImageSources.some(src => /Gray404\.png/i.test(src)),
    'Coccygeus must show the verified Gray 404 plate'
  );
  await page.click('#reference-tab-movement');
  assert.match(
    await page.locator('#structure-reference-functional').innerText(),
    /Лобково-прямокишечная мышца/i
  );
  await bestEffortScreenshot('/tmp/muscle-memory-reference-coccygeus.png');

  assert.equal(errors.length, 0, errors.join(' || '));
  console.log('[reference-smoke] six representative reference cards ok');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
