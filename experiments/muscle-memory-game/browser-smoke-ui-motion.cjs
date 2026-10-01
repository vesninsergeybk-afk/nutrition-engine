const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');

// Real HTML, styles, motion module, reference controller and relation data.
// Only scene initialization is replaced: this checkpoint does not test 3D.
const fixture = `
import { createReferenceUI } from './reference-ui.js';
import { functionalPartsForStructure } from './reference-data/functional-parts.js';
import { functionalRelationsForStructure } from './reference-data/functional-relations.js';
const find = id => document.getElementById(id);
find('loading').classList.add('is-hidden');
find('structure-reference').hidden = false;
find('structure-reference-facts').hidden = false;
find('structure-reference-empty').hidden = true;
find('mobile-muscle-card').hidden = false;
find('question').textContent = find('mobile-muscle-name').textContent = 'Трапециевидная мышца';
find('structure-reference-heading').textContent = 'Трапециевидная мышца';
const quick = find('atlas-relations');
const reference = createReferenceUI(find('structure-reference'), {
  quickRoot: quick,
  onShowGroup: items => ({ shown: true, availability: items.map(() => ({ state: 'visible' })) }),
  onClearGroup() {}, onSelectItem() {},
});
reference.render({ id: 'trapezius', functionalParts: functionalPartsForStructure('trapezius'),
  functionalRelations: functionalRelationsForStructure('trapezius') }, 'Ascending part of trapezius muscle.l');
const mobile = matchMedia('(max-width: 920px)');
function placeQuick() {
  (mobile.matches ? find('mobile-muscle-card') : find('atlas-relations-desktop-slot')).append(quick);
}
mobile.addEventListener('change', placeQuick);
placeQuick();
for (const button of document.querySelectorAll('.mode-switch > button:not([hidden])')) {
  button.addEventListener('click', () => {
    for (const item of document.querySelectorAll('.mode-switch > button')) {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    }
    find('learning-controls').hidden = button.id !== 'mode-quiz';
  });
}
find('display-panel-toggle').addEventListener('click', () => {
  find('display-panel').hidden = !find('display-panel').hidden;
  find('display-panel-toggle').setAttribute('aria-expanded', String(!find('display-panel').hidden));
});
find('display-panel-close').addEventListener('click', () => {
  find('display-panel').hidden = true;
  find('display-panel-toggle').setAttribute('aria-expanded', 'false');
});
document.documentElement.dataset.motionFixture = 'ready';
`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(8000);
    const errors = [];
    const modelRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/\.(glb|gltf|vtp)(\?|$)/i.test(request.url())) modelRequests.push(request.url()); });
    await page.route('**/app.js', route => route.fulfill({ contentType: 'text/javascript', body: fixture }));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.motionFixture === 'ready');
    await page.waitForSelector('.mode-switch.ui-motion-ready');

    // Rapid input must settle on the last selection, without delaying its state.
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) document.getElementById(i % 2 ? 'mode-quiz' : 'mode-explore').click();
    });
    assert.equal(await page.locator('#mode-quiz').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#learning-controls').isVisible(), true);
    await page.waitForTimeout(260);
    async function checkIndicator(group, active) {
      const indicator = await page.locator(group + ' > .ui-selection-indicator').boundingBox();
      const selected = await page.locator(active).boundingBox();
      assert.ok(indicator && selected);
      for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(indicator[key] - selected[key]) <= 2, group + ': ' + key);
    }
    await checkIndicator('.mode-switch', '#mode-quiz');
    await page.click('#mode-explore');

    // Roving keyboard focus and the active marker agree after a tab transition.
    await page.locator('#reference-tab-overview').focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#reference-tab-detail').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#reference-tab-detail').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#reference-overview').isHidden(), true);
    await page.waitForTimeout(260);
    await checkIndicator('.reference-tabs', '#reference-tab-detail');
    await page.keyboard.press('Home');

    // A visible text update is animated; a hidden panel is never animated into view.
    const textMotion = await page.evaluate(async () => {
      document.getElementById('question').textContent = 'Трапециевидная мышца · верхние пучки';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return document.getElementById('question').getAnimations().some(animation => animation.playState === 'running');
    });
    assert.equal(textMotion, true);
    await page.click('#display-panel-toggle');
    assert.equal(await page.locator('#display-panel').isVisible(), true);
    await page.click('#display-panel-close');
    assert.equal(await page.locator('#display-panel').isHidden(), true);

    // Desktop quick expansion uses the real controller, then Escape closes immediately.
    const openingMotion = await page.evaluate(async () => {
      document.querySelector('[data-quick-role="synergists"]').click();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return document.getElementById('atlas-relations').getAnimations().some(animation => animation.playState === 'running');
    });
    assert.equal(openingMotion, true);
    await page.locator('#atlas-relations-movement').focus();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
    assert.equal(await page.locator('[data-quick-role="synergists"]').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#atlas-relations').evaluate(el => el.getAnimations().length), 0);
    await page.waitForTimeout(260);
    await page.screenshot({ path: '/tmp/muscle-memory-ui-motion-desktop.png', fullPage: true });

    // Both phone sizes retain an unobstructed canvas and fit horizontally.
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
      await page.setViewportSize(viewport);
      await page.click('[data-quick-role="antagonists"]');
      await page.selectOption('#atlas-relations-part', 'lower');
      await page.selectOption('#atlas-relations-movement', { label: 'Опускание лопатки' });
      await page.waitForTimeout(260);
      await page.evaluate(() => scrollTo(0, 0));
      const geometry = await page.evaluate(() => ({
        width: innerWidth, pageWidth: document.documentElement.scrollWidth,
        viewer: document.getElementById('viewer').getBoundingClientRect().bottom,
        viewerHeight: document.getElementById('viewer').getBoundingClientRect().height,
        menu: document.getElementById('mobile-muscle-card').getBoundingClientRect().top,
      }));
      assert.ok(geometry.pageWidth <= geometry.width + 2, 'Horizontal overflow');
      assert.ok(geometry.menu >= geometry.viewer - 2, 'Quick menu overlaps the canvas');
      assert.ok(geometry.viewerHeight >= 260, 'Canvas is too small for touch');
      await checkIndicator('.mode-switch', '#mode-explore');
      await page.screenshot({ path: '/tmp/muscle-memory-ui-motion-mobile-' + viewport.width + '.png', fullPage: false });
      await page.locator('#atlas-relations-movement').focus();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#atlas-relations-body').isHidden(), true);
    }

    // Changing the system preference also cancels an animation already in flight.
    await page.evaluate(async () => {
      document.querySelector('[data-quick-role="synergists"]').click();
      document.getElementById('mobile-muscle-name').textContent = 'Трапециевидная мышца · нижние пучки';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
    await page.locator('#atlas-relations-movement').focus();
    await page.keyboard.press('Escape');
    await page.click('[data-quick-role="antagonists"]');
    assert.equal(await page.locator('#atlas-relations-body').isVisible(), true);
    assert.equal(await page.locator('#atlas-relations').evaluate(el => el.getAnimations().length), 0);
    assert.equal(await page.locator('.ui-selection-indicator').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    assert.deepEqual(modelRequests, [], 'UI checkpoint unexpectedly loaded 3D assets');
    assert.deepEqual(errors, [], 'UI motion produced browser exceptions');
    console.log('[smoke:ui-motion] rapid switching, keyboard, desktop/390/320 layout, immediate close and reduced motion passed; no 3D assets loaded');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
