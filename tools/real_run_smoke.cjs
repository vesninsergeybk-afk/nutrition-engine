#!/usr/bin/env node
/**
 * Real-run smoke for the local build.
 *
 * Unlike tests/e2e/*, this script does NOT intercept network traffic: it drives a
 * real Chromium against a real HTTP server, walks the actual user journey
 * (profile -> needs -> search -> ration -> analysis -> HEI -> report) and reports
 * console errors, failed requests and the rendered state at each step.
 *
 * Start a server first (pick one):
 *   python tools/ci_server.py --port 4173        # static, AI route mocked
 *   php -S 127.0.0.1:8080 -t .                   # real PHP backend + real api/gemini.php
 *
 * Then:
 *   node tools/real_run_smoke.cjs                 # headless, writes screenshots + summary
 *   node tools/real_run_smoke.cjs --headed        # watch it happen
 *   node tools/real_run_smoke.cjs --port=8080
 */

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const keepOpen = args.includes('--keep-open');
const slowMoArg = args.find(a => a.startsWith('--slowmo='));
const portArg = args.find(a => a.startsWith('--port='));
const PORT = portArg ? Number(portArg.split('=')[1]) : 4173;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT = path.join(__dirname, '..', 'reports', 'real-run');

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const steps = [];
let hostingPhaseConsole = 0;
let hostingPhaseFailed = 0;

function record(name, ok, detail) {
  steps.push({ step: name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: !headed,
    slowMo: slowMoArg ? Number(slowMoArg.split('=')[1]) : 0
  });
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('frame-ancestors') && text.toLowerCase().includes('meta')) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const url = request.url();
    const reason = (request.failure() && request.failure().errorText) || '';
    // The loader intentionally falls back when a browser aborts the .gz fetch.
    if (url.includes('/assets/runtime/deferred-runtime-') && url.includes('.js.gz')) return;
    failedRequests.push(`${url} — ${reason}`);
  });

  // 1. Does the server answer at all?
  const health = await page.request.get(`${ORIGIN}/index.html`);
  record('сервер отдаёт index.html', health.status() === 200, `HTTP ${health.status()}`);

  // 2. The project's own asset-closure self-test, run for real.
  try {
    await page.goto(`${ORIGIN}/hosting-check.html?autorun=1`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => {
      const out = document.getElementById('out');
      return out && /Итог/.test(out.textContent || '');
    }, null, { timeout: 60000 });
    const verdict = await page.evaluate(() => {
      const out = document.getElementById('out');
      return { text: out.textContent, bad: out.classList.contains('bad') };
    });
    const errLines = verdict.text.split('\n').filter(l => l.startsWith('ERR'));
    // The CI server intentionally hides .htaccess and _headers, so their 404 is
    // expected locally and must not be read as a broken asset closure.
    const localOnly = errLines.length > 0 && errLines.every(l => /ERR\s+(\.htaccess|_headers)\s/.test(l));
    record('hosting-check: набор ресурсов',
      !verdict.bad || localOnly,
      verdict.bad
        ? (localOnly
          ? `ожидаемо локально: сервер закрывает служебные файлы (${errLines.length} шт.)`
          : `${errLines.length} ошибок: ${errLines.slice(0, 5).join('; ')}`)
        : 'все активные ресурсы доступны и согласованы');
  } catch (error) {
    record('hosting-check: набор ресурсов', false, error.message);
  }

  // Requests made by the self-test page belong to it, not to the application.
  hostingPhaseConsole = consoleErrors.length;
  hostingPhaseFailed = failedRequests.length;
  consoleErrors.length = 0;
  failedRequests.length = 0;

  // 3. The real application.
  await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => {
    const meta = window.__APP_BOOTSTRAP_META__;
    const calc = document.getElementById('needs_calc_btn');
    return !!meta && meta.status === 'ready' && !!calc && calc.getAttribute('data-needs-calculation-ready') === '1';
  }, null, { timeout: 60000 });
  record('приложение загрузилось', true, await page.evaluate(() => `shell=${document.documentElement.getAttribute('data-navigation-shell')}`));

  // 4. Profile -> needs calculation.
  const toggle = page.locator('#v40NeedsToggle');
  if (await toggle.count() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  await page.selectOption('#needs_sex', 'female');
  await page.fill('#needs_age', '42');
  await page.fill('#needs_h', '168');
  await page.fill('#needs_w', '64');
  await page.selectOption('#needs_activity', 'moderate');
  await page.locator('#profileCalculateContinue').click();
  await page.waitForFunction(() => window.__lastNeedsMeta && window.__lastNeedsMeta.ok === true, null, { timeout: 30000 });
  const needs = await page.evaluate(() => ({
    mode: window.__lastNeedsMeta.personalProfile && window.__lastNeedsMeta.personalProfile.mode,
    kcal: document.getElementById('normInput-kcal') ? document.getElementById('normInput-kcal').value : null,
    protein: document.getElementById('normInput-protein_g') ? document.getElementById('normInput-protein_g').value : null
  }));
  record('профиль рассчитан', !!needs.kcal && !!needs.mode, `режим=${needs.mode}, ккал=${needs.kcal}, белок=${needs.protein}`);
  await page.screenshot({ path: path.join(OUT, '01-after-needs.png'), fullPage: false });

  // 5. Search and add a real product through the real search index.
  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await page.waitForTimeout(400);
  await page.locator('#globalSearchInput').fill('банан');
  await page.waitForFunction(() => {
    const el = document.getElementById('globalResults');
    return el && el.classList.contains('has-query') && el.getBoundingClientRect().height > 0;
  }, null, { timeout: 20000 });
  const found = await page.evaluate(() => {
    const root = document.getElementById('globalResults');
    const rows = Array.from(document.querySelectorAll('#globalResults [data-role="add-search"], #globalResults [data-role="add"]'));
    let node = rows[0] || null;
    while (node && node !== root && !/банан/i.test(node.textContent || '')) node = node.parentElement;
    const firstText = node && node !== root ? (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    const resultText = root ? (root.textContent || '').replace(/\s+/g, ' ').trim() : '';
    return { candidates: rows.length, firstText, hasQueryText: /банан/i.test(resultText) };
  });
  record('поиск находит продукт', found.candidates > 0 && found.hasQueryText,
    `вариантов=${found.candidates}, первый="${found.firstText || 'текст результата не найден'}"`);

  const addButton = page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
  await addButton.click();
  await page.waitForTimeout(800);
  const ration = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      items: document.querySelectorAll('#rationBody tr, #rationBody .ration-item, [data-ration-item]').length,
      hasProduct: /банан/i.test(text),
      kcalLine: (text.match(/[\d.,]+\s*ккал[^\n]{0,40}/) || [null])[0]
    };
  });
  record('продукт добавлен в рацион', ration.hasProduct, `строк=${ration.items}, в тексте: ${ration.kcalLine}`);
  await page.screenshot({ path: path.join(OUT, '02-ration-with-product.png'), fullPage: true });

  // 6. Analysis, HEI and report on real data.
  for (const [route, panelId, label, file] of [
    ['analysis/overview', 'workspaceOverviewPanel', 'обзор анализа', '03-analysis-overview.png'],
    ['analysis/hei', 'workspaceHeiPanel', 'дашборд HEI-2020', '04-analysis-hei.png'],
    ['report', 'workspaceReportPanel', 'отчёт', '05-report.png']
  ]) {
    await page.evaluate(name => window.NavigationShellV1.navigate(name), route);
    await page.waitForTimeout(900);
    const state = await page.evaluate(pid => {
      const route = document.documentElement.getAttribute('data-navigation-route');
      const panel = document.getElementById(pid);
      const style = panel ? getComputedStyle(panel) : null;
      const rect = panel ? panel.getBoundingClientRect() : null;
      return {
        route,
        display: style ? style.display : null,
        height: rect ? Math.round(rect.height) : 0,
        chars: panel ? (panel.innerText || '').length : 0
      };
    }, panelId);
    record(`${label} отрисован`, state.route === route && state.height > 0,
      `display=${state.display}, высота=${state.height}px, текста=${state.chars} симв.`);
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  }

  // 7. Print rendering of the report, as the browser would print it.
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '06-report-print.png'), fullPage: true });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  fs.writeFileSync(path.join(OUT, 'report-print.pdf'), pdf);
  record('печатная версия сформирована', pdf.length > 1000, `${Math.round(pdf.length / 1024)} КБ PDF`);
  await page.emulateMedia({ media: 'screen' });

  if (keepOpen) {
    console.log('\nОкно оставлено открытым: приложение в конце сценария открыто на вкладке отчёта.');
    console.log('Пройдитесь по разделам сами — окно закроется, когда вы его закроете.');
    await page.bringToFront().catch(() => {});
    await context.waitForEvent('close', { timeout: 0 }).catch(() => {});
  }

  await browser.close().catch(() => {});

  const summary = {
    origin: ORIGIN,
    mode: headed ? 'headed' : 'headless',
    steps,
    hostingPhase: { consoleErrors: hostingPhaseConsole, failedRequests: hostingPhaseFailed },
    consoleErrors,
    pageErrors,
    failedRequests,
    ok: steps.every(s => s.ok) &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      failedRequests.length === 0
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');

  console.log('\n--- итог ---');
  console.log(`шагов: ${steps.length}, успешных: ${steps.filter(s => s.ok).length}`);
  console.log(`ошибок приложения в консоли: ${consoleErrors.length}, ошибок страницы: ${pageErrors.length}, отказов запросов: ${failedRequests.length}`);
  console.log(`шум страницы self-test: 404 x ${hostingPhaseConsole} (её собственный список файлов)`);
  for (const e of consoleErrors.slice(0, 5)) console.log('  console: ' + e);
  for (const e of pageErrors.slice(0, 5)) console.log('  pageerror: ' + e);
  for (const e of failedRequests.slice(0, 5)) console.log('  requestfailed: ' + e);
  console.log(`артефакты: ${path.relative(process.cwd(), OUT)}`);
  process.exit(summary.ok ? 0 : 1);
}

main().catch(error => {
  console.error('real-run failed: ' + error.stack);
  process.exit(2);
});
