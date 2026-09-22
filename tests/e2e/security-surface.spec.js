const { test, expect, ORIGIN } = require('./fixtures');

test('virtual browser origin does not expose private or build-time files', async ({ page, loadApp }) => {
  await loadApp();
  for (const target of [
    '/api/gemini-secret.php', '/api/gemini-guard.php', '/tests/p0-4-guard-worker.php',
    '/tools/release_gate.py', '/.github/workflows/quality-gate.yml', '/.htaccess'
  ]) {
    const status = await page.evaluate(async url => (await fetch(new URL(url, document.baseURI))).status, target);
    expect([403, 404], `${target} returned ${status}`).toContain(status);
  }
});

test('health contract is stateless and CSRF header is mandatory', async ({ page, loadApp }) => {
  await loadApp();
  const result = await page.evaluate(async () => {
    const healthResponse = await fetch(new URL('/api/gemini.php', document.baseURI));
    const body = await healthResponse.json();
    const noHeader = await fetch(new URL('/api/gemini.php', document.baseURI), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({csrf_token:body.csrf_token}) });
    const withHeader = await fetch(new URL('/api/gemini.php', document.baseURI), { method:'POST', headers:{'Content-Type':'application/json','X-Nutrition-CSRF':body.csrf_token}, body:JSON.stringify({operation:'planner'}) });
    return { healthStatus:healthResponse.status, body, noHeader:noHeader.status, withHeader:withHeader.status };
  });
  expect(result.healthStatus).toBe(200);
  expect(result.body.version).toBe('v5.3.210-rc2');
  expect(result.body.csrf_token).toMatch(/^[a-f0-9]{64}$/);
  expect(result.noHeader).toBe(403);
  expect(result.withHeader).toBe(503);
});
