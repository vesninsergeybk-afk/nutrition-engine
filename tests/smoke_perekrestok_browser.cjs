/* Browser smoke check for the website's 1105-core + 6-reviewed-products load. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.gz': 'application/gzip', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let target;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Bad path');
    if (target === root) target = path.join(root, 'index.html');
  } catch (_) { res.writeHead(400); return res.end(); }
  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(res);
  });
});

(async function main() {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const fatal = [];
    page.on('pageerror', error => fatal.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => Array.isArray(window.__PRODUCTS_ARRAY__)
        && window.__PRODUCTS_ARRAY__.length === 1111, { timeout: 120000 });
    const info = await page.evaluate(() => ({
      count: window.__PRODUCTS_ARRAY__.length,
      extras: window.__PRODUCTS_SUPPLEMENTAL_META__,
      fixes: window.__PRODUCTS_CORRECTIONS_META__,
      names: window.__PRODUCTS_ARRAY__
        .filter(p => ['sour_cherry_raw_sr_173954', 'artichoke_raw_sr_169205',
          'mung_beans_dry_sr_174256', 'sea_bass_raw_sr_175142',
          'pork_tenderloin_raw_sr_168312', 'cherry'].includes(p.key))
        .map(p => ({ key: p.key, name_ru: p.name_ru, vitamin_c_mg: p.vitamin_c_mg })),
    }));
    assert.equal(info.count, 1111);
    assert.equal(info.extras.count, 6);
    assert.equal(info.extras.expected, 6);
    assert.equal(info.fixes.count, 1);
    assert.deepEqual(info.fixes.warnings, []);
    assert.equal(info.names.find(p => p.key === 'cherry').name_ru, 'Черешня, свежая (сырая)');
    assert.equal(info.names.length, 6);
    const input = page.locator('#globalSearchInput');
    if (await input.count()) {
      await input.fill('сибас');
      await page.waitForTimeout(600);
      const visible = await page.locator('body').innerText();
      assert(visible.includes('Сибас'), 'Search UI does not contain raw sea bass');
    }
    console.log(JSON.stringify({ status: 'OK', count: info.count,
      supplemental: info.extras.count, corrections: info.fixes.count,
      new_names: info.names, page_errors: fatal.slice(0, 5) }, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
