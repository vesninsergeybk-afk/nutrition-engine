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

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  for (const scenario of [
    { name: 'long', route: '' },
    { name: 'workspace-ration', route: 'ration' },
    { name: 'workspace-overview', route: 'analysis/overview' },
    { name: 'workspace-nutrients', route: 'analysis/nutrients' },
    { name: 'workspace-hei', route: 'analysis/hei' },
    { name: 'workspace-correction', route: 'correction' }
  ]) {
    test(`WCAG 2.2 automated audit has no serious or critical violations (${viewport.name}, ${scenario.name})`, async ({ page, loadApp }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp();
      if (scenario.route) {
        await page.evaluate(route => {
          window.NavigationShellV1.setMode('workspace');
          window.NavigationShellV1.navigate(route);
        }, scenario.route);
      } else {
        await page.evaluate(() => window.NavigationShellV1.setMode('long'));
      }
      await page.waitForTimeout(120);
      const results = await runAxe(page);
      const blocking = results.violations.filter(v => ['critical', 'serious'].includes(v.impact));
      const outDir = path.resolve('reports/axe');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${testInfo.project.name}-${viewport.name}-${scenario.name}.json`), JSON.stringify(results, null, 2));
      expect(blocking.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }))).toEqual([]);
    });
  }
}
