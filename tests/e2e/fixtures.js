const base = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = process.env.NUTRITION_APP_ROOT ? path.resolve(process.env.NUTRITION_APP_ROOT) : path.resolve(__dirname, '../..');
const ORIGIN = process.env.NUTRITION_TEST_ORIGIN || 'https://nutrition-ci.test';
const deniedPrefixes = ['/.git', '/.github', '/tests', '/tools', '/quality', '/reports', '/release', '/node_modules'];
const deniedNames = new Set(['.htaccess', '_headers', 'gemini-secret.php', 'gemini-guard.php', 'gemini-disabled.flag', 'integrity-failed.flag']);

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
    '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
    '.webp':'image/webp', '.ico':'image/x-icon', '.md':'text/markdown; charset=utf-8'
  })[ext] || 'application/octet-stream';
}

function denied(urlPath) {
  const normalized = path.posix.normalize('/' + decodeURIComponent(urlPath).replace(/^\/+/, ''));
  if (deniedPrefixes.some(prefix => normalized === prefix || normalized.startsWith(prefix + '/'))) return true;
  const name = path.posix.basename(normalized);
  return name.startsWith('.') || deniedNames.has(name) || normalized.endsWith('.php');
}

function appHtml() {
  const raw = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!raw.includes('<head>')) throw new Error('index.html has no <head> element');
  return raw.replace('<head>', `<head><base href="${ORIGIN}/">`);
}

const test = base.test.extend({
  page: async ({ page }, use) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    await page.context().addCookies([{ name:'nutrition_ai_csrf', value:csrfToken, url:ORIGIN, sameSite:'Lax' }]);
    await page.route(`${ORIGIN}/**`, async route => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const coreHeaders = {
        'cache-control': 'no-store, max-age=0',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'same-origin',
        'x-frame-options': 'SAMEORIGIN',
        'x-robots-tag': 'noindex, nofollow, noarchive',
        'cross-origin-resource-policy': 'same-origin'
      };
      if (pathname === '/api/gemini.php') {
        if (request.method() === 'GET') {
          const token = csrfToken;
          return route.fulfill({ status: 200, contentType: 'application/json', headers: {
            ...coreHeaders, 'set-cookie': `nutrition_ai_csrf=${token}; Path=/; SameSite=Lax`
          }, body: JSON.stringify({
            ok: true, version: 'v5.3.210-rc2',
            protocol_version: 'nutrition-ai-comprehensive-planner-v7', configured: true,
            ai_available: false, availability_code: 'ci_mock_provider_disabled', retry_after_seconds: 0,
            csrf_token: token, limits: { max_images: 4, max_image_bytes: 7340032, max_audio_bytes: 7340032 }
          }) });
        }
        if (request.method() === 'POST') {
          const token = request.headers()['x-nutrition-csrf'] || '';
          const cookie = request.headers()['cookie'] || '';
          const match = cookie.match(/(?:^|;\s*)nutrition_ai_csrf=([a-f0-9]{64})(?:;|$)/);
          const localOpaqueOrigin = process.env.PLAYWRIGHT_USE_SYSTEM_CHROMIUM === '1';
          const cookieMatches = !!(match && token === match[1]);
          if (token !== csrfToken || (!localOpaqueOrigin && !cookieMatches)) {
            return route.fulfill({ status: 403, contentType: 'application/json', headers: coreHeaders,
              body: JSON.stringify({ ok:false, error_code:'csrf_failed', error:'CSRF check failed' }) });
          }
          return route.fulfill({ status: 503, contentType: 'application/json', headers: coreHeaders,
            body: JSON.stringify({ ok:false, retryable:false, error_code:'ci_mock_provider_disabled', error:'AI disabled in CI' }) });
        }
        return route.fulfill({ status: 405, headers: coreHeaders, body: '' });
      }
      if (denied(pathname)) return route.fulfill({ status: 404, headers: coreHeaders, body: 'Not found' });
      const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
      const file = path.resolve(ROOT, rel);
      if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        return route.fulfill({ status: 404, headers: coreHeaders, body: 'Not found' });
      }
      return route.fulfill({ status: 200, contentType: mime(file), headers: coreHeaders, body: fs.readFileSync(file) });
    });
    await use(page);
  },
  loadApp: async ({ page }, use) => {
    await use(async () => {
      if (process.env.PLAYWRIGHT_USE_SYSTEM_CHROMIUM === '1' && !process.env.NUTRITION_TEST_ORIGIN) {
        await page.setContent(appHtml(), { waitUntil: 'networkidle' });
        await page.waitForFunction(() => document.readyState === 'complete');
        // Managed Chromium in this environment reloads about:blank on hash navigation.
        // CI browsers navigate the virtual HTTPS origin normally; this local-only shim
        // preserves keyboard activation, scrolling and focus without masking app errors.
        await page.evaluate(() => {
          document.addEventListener('click', event => {
            const link = event.target && event.target.closest && event.target.closest('a.skip-link[href^="#"]');
            if (!link) return;
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.scrollIntoView({ block: 'start' });
            target.focus({ preventScroll: true });
          });
        });
      } else {
        const response = await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'networkidle' });
        if (!response || response.status() !== 200) throw new Error(`virtual app load failed: ${response && response.status()}`);
      }
      // User scenarios begin only after the application's own readiness contract,
      // not merely after the static HTML has appeared. This mirrors the production
      // loader and prevents local setContent timing from creating false first-tap failures.
      await page.waitForFunction(() => {
        const calc = document.getElementById('needs_calc_btn');
        return !!window.__APP_BOOTSTRAP_META__ && !!calc && calc.getAttribute('data-needs-calculation-ready') === '1' && !calc.disabled;
      }, null, { timeout: 30000 });
    });
  }
});

module.exports = { test, expect: base.expect, ORIGIN };
