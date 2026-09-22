const { test, expect, ORIGIN } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');

test.describe.configure({ mode: 'serial' });

async function openNeeds(page){const toggle=page.locator('#v40NeedsToggle');if(await toggle.count()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();}

function captureRuntimeFailures(page) {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', msg => { if (msg.type() === 'error') failures.push(`console: ${msg.text()}`); });
  page.on('requestfailed', request => failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`));
  return failures;
}

async function assertAxe(page, testInfo, label) {
  await page.addScriptTag({content:axeSource});
  const results = await page.evaluate(async tags => window.axe.run(document,{runOnly:{type:'tag',values:tags}}), ['wcag2a','wcag2aa','wcag21aa','wcag22aa']);
  const dir = path.resolve('reports/axe'); fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(path.join(dir, `${testInfo.project.name}-${label}.json`), JSON.stringify(results,null,2));
  const blocking = results.violations.filter(v => ['critical','serious'].includes(v.impact));
  expect(blocking.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help}))).toEqual([]);
}

test('desktop clinical safety, keyboard path and automated accessibility', async ({ page, loadApp }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.setViewportSize({width:1440,height:1000});
  await loadApp();
  await expect(page).toHaveTitle(/Калькулятор нутриентов/);
  await expect(page.locator('main#mainContent')).toHaveCount(1);
  await page.keyboard.press('Tab');
  const skip = page.locator(':focus'); await expect(skip).toHaveClass(/skip-link/); await expect(skip).toHaveAttribute('href','#needs_person_name'); await skip.press('Enter');
  await expect(page.locator('#needs_person_name')).toBeFocused();
  await openNeeds(page);
  await page.selectOption('#needs_sex','male'); await page.fill('#needs_h','180'); await page.fill('#needs_w','70'); await page.fill('#needs_age','35');
  await page.selectOption('#needs_state','normal'); await page.selectOption('#needs_activity','low'); await page.selectOption('#needs_edema','no');
  await page.selectOption('#needs_goal','maintain'); await page.selectOption('#needs_guardrail','none'); await page.click('#needs_calc_btn');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue(''); await expect(page.locator('#needs_print_btn')).toBeEnabled();
  await openNeeds(page);
  await page.selectOption('#needs_guardrail','pregnancy'); await page.waitForTimeout(350);
  await expect(page.locator('#needs_out')).toContainText(/устарел/i); await expect(page.locator('#normInput-kcal')).toHaveValue('');
  await expect(page.locator('#needs_print_btn')).toBeDisabled(); await expect(page.locator('#needs_pdf_btn')).toBeDisabled();
  await assertAxe(page,testInfo,'desktop');
  expect(failures).toEqual([]);
});

test('mobile layout and automated accessibility', async ({ page, loadApp }, testInfo) => {
  await page.setViewportSize({width:390,height:844}); await loadApp();
  const dimensions=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,body:document.body.scrollWidth}));
  expect(dimensions.doc).toBeLessThanOrEqual(dimensions.client+1); expect(dimensions.body).toBeLessThanOrEqual(dimensions.client+1);
  await assertAxe(page,testInfo,'mobile');
});

test('private surface and CSRF browser contract', async ({ page, loadApp }) => {
  await loadApp();
  for (const target of ['/api/gemini-secret.php','/api/gemini-guard.php','/tests/p0-4-guard-worker.php','/tools/release_gate.py','/.github/workflows/quality-gate.yml','/.htaccess']) {
    const status=await page.evaluate(async url=>(await fetch(new URL(url,document.baseURI))).status,target);
    expect([403,404],`${target} returned ${status}`).toContain(status);
  }
  const result=await page.evaluate(async()=>{
    const health=await fetch(new URL('/api/gemini.php',document.baseURI)); const body=await health.json();
    const noHeader=await fetch(new URL('/api/gemini.php',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf_token:body.csrf_token})});
    const withHeader=await fetch(new URL('/api/gemini.php',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json','X-Nutrition-CSRF':body.csrf_token},body:JSON.stringify({operation:'planner'})});
    return {health:health.status,body,noHeader:noHeader.status,withHeader:withHeader.status};
  });
  expect(result.health).toBe(200); expect(result.body.version).toBe('v5.3.210-rc2');
  expect(result.body.csrf_token).toMatch(/^[a-f0-9]{64}$/); expect(result.noHeader).toBe(403); expect(result.withHeader).toBe(503);
});

test('normative registry provenance and energy-dependent EFSA values', async ({ page, loadApp }) => {
  await loadApp();
  await openNeeds(page);
  await page.locator('[data-navshell-settings-toggle]').first().click();
  const audit=await page.evaluate(()=>window.NutritionNormativeRegistry&&window.NutritionNormativeRegistry.audit());
  expect(audit?.ok).toBe(true); expect(audit?.registryVersion).toBe('v5.3.210-p1.2');
  await page.selectOption('#needs_sex','female'); await page.fill('#needs_h','165'); await page.fill('#needs_w','60'); await page.fill('#needs_age','30');
  await page.selectOption('#needs_state','normal'); await page.selectOption('#needs_activity','low'); await page.selectOption('#needs_edema','no');
  await page.selectOption('#needs_goal','maintain'); await page.selectOption('#needs_guardrail','none');
  await page.click('#regionSeg button[data-region="eu"]'); await page.click('#needs_calc_btn');
  const values=await page.evaluate(()=>({
    b1:window.__resolveMicroLimitsForQA('vitamin_b1_mg','eu',30,'female'),
    b3:window.__resolveMicroLimitsForQA('vitamin_b3_mg','eu',30,'female'),
    b6:window.__resolveMicroLimitsForQA('vitamin_b6_mg','eu',30,'female')
  }));
  expect(values.b1.min.value).toBeGreaterThan(0); expect(values.b1.min.provenance.sourceIds).toContain('efsa_thiamin');
  expect(values.b3.min.value).toBeGreaterThan(0); expect(values.b3.min.provenance.sourceIds).toContain('efsa_niacin');
  expect(values.b6.ul.value).toBe(12.5); expect(values.b6.ul.provenance.sourceIds).toContain('efsa_b6_ul_2023');
  await page.click('#normRegionHelpBtn'); await expect(page.locator('#normRegistryStatus')).toContainText('v5.3.210-p1.2');
});
