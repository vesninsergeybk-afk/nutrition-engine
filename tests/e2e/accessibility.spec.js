const { test, expect } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');

const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const tags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

async function runAxe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async ({ tags }) => window.axe.run(document, {
    runOnly: { type: 'tag', values: tags }
  }), { tags });
}

async function openNeeds(page) {
  const toggle = page.locator('#v40NeedsToggle');
  if (!(await toggle.count())) return;
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}

// Most measured violations only exist once the app holds data, which the original
// scenarios never produced. These helpers seed a realistic filled state.
async function seedProfile(page) {
  await openNeeds(page);
  await page.selectOption('#needs_sex', 'female');
  await page.fill('#needs_age', '42');
  await page.fill('#needs_h', '168');
  await page.fill('#needs_w', '64');
  await page.selectOption('#needs_activity', 'moderate');
  await page.locator('#profileCalculateContinue').click();
  await page.waitForFunction(
    () => window.__lastNeedsMeta && window.__lastNeedsMeta.ok === true,
    null,
    { timeout: 30000 }
  );
}

// After the calculation the app stays in the long canvas, where the search is
// revealed by a link in the workflow steps rather than being visible already.
async function seedRation(page) {
  await seedProfile(page);
  const step = page.locator('.workflow-steps a[href="#globalSearchSection"]');
  if (await step.count()) {
    // A real click is unreliable here on narrow viewports; the link only needs to
    // trigger its own handler, so invoke it directly.
    await step.first().evaluate(node => node.click()).catch(() => {});
    await page.waitForTimeout(400);
  }
  const input = page.locator('#globalSearchInput');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill('банан');
  await page.waitForFunction(() => {
    const el = document.getElementById('globalResults');
    return el && el.classList.contains('has-query') && el.getBoundingClientRect().height > 0;
  }, null, { timeout: 15000 });
  const add = page.locator('#globalResults button[data-role="add"], #globalResults button[data-role="add-search"]').first();
  await expect(add).toBeVisible();
  await add.click();
  await page.waitForTimeout(700);
}

async function openRoute(page, route) {
  await page.evaluate(name => {
    window.NavigationShellV1.setMode('workspace');
    window.NavigationShellV1.navigate(name);
  }, route);
  await page.waitForTimeout(400);
}

async function audit(page, label, testInfo) {
  const results = await runAxe(page);
  const outDir = path.resolve('reports/axe');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${testInfo.project.name}-${label}.json`),
    JSON.stringify(results, null, 2)
  );
  return results.violations
    .filter(v => ['critical', 'serious'].includes(v.impact))
    .map(v => ({
      label,
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes[0] && v.nodes[0].target
    }));
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

const EMPTY_SCENARIOS = [
  { name: 'long', route: '' },
  { name: 'workspace-ration', route: 'ration' },
  { name: 'workspace-overview', route: 'analysis/overview' },
  { name: 'workspace-nutrients', route: 'analysis/nutrients' },
  { name: 'workspace-hei', route: 'analysis/hei' },
  { name: 'workspace-correction', route: 'correction' },
  { name: 'workspace-report', route: 'report' }
];

const FILLED_SCENARIOS = [
  { name: 'filled-ration', route: 'ration' },
  { name: 'filled-overview', route: 'analysis/overview' },
  { name: 'filled-hei', route: 'analysis/hei' },
  { name: 'filled-correction', route: 'correction' },
  { name: 'filled-report', route: 'report' }
];

for (const viewport of VIEWPORTS) {
  test(`WCAG 2.2 empty-state matrix has no serious or critical violations (${viewport.name})`, async ({ page, loadApp }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loadApp();

    const failures = [];
    for (const scenario of EMPTY_SCENARIOS) {
      if (scenario.route) {
        await openRoute(page, scenario.route);
      } else {
        await page.evaluate(() => window.NavigationShellV1.setMode('long'));
      }
      await page.waitForTimeout(120);
      failures.push(...await audit(page, `${viewport.name}-${scenario.name}`, testInfo));
    }
    expect(failures).toEqual([]);
  });

  test(`WCAG 2.2 filled-state matrix has no serious or critical violations (${viewport.name})`, async ({ page, loadApp }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loadApp();
    await seedRation(page);

    const failures = [];
    for (const scenario of FILLED_SCENARIOS) {
      await openRoute(page, scenario.route);
      await page.waitForTimeout(120);
      failures.push(...await audit(page, `${viewport.name}-${scenario.name}`, testInfo));
    }
    expect(failures).toEqual([]);
  });
}
