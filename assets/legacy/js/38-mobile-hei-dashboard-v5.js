// nutrition calculator v5.3.117 — compact mobile HEI dashboard
// Responsibility: one-screen summary, three priority components and on-demand full breakdown.
(function () {
    'use strict';
    var VERSION = 'v5.3.117_mobile_hei_compact_dashboard';
    window.__V53117_MOBILE_HEI_DASHBOARD__ = VERSION;
    function byId(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function text(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
    function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^0-9.+-]/g, '')); return Number.isFinite(n) ? n : NaN; }
    function clamp(v, a, b) { v = Number.isFinite(v) ? v : 0; return Math.max(a, Math.min(b, v)); }
    function fmt(n, d) { return Number.isFinite(Number(n)) ? Number(n).toFixed(d == null ? 1 : d).replace(/\.0$/, '') : '—'; }
    function toneByRatio(r) { if (r >= .95)
        return 'ok'; if (r < .4)
        return 'bad'; return 'warn'; }
    function totalToneByRatio(r) { if (r >= .9)
        return 'ok'; if (r < .5)
        return 'bad'; return 'warn'; }
    function qualityText(total) {
        if (!Number.isFinite(total))
            return 'Добавьте продукты, чтобы рассчитать индекс.';
        if (total >= 90)
            return 'Очень высокий уровень качества рациона.';
        if (total >= 70)
            return 'Хороший уровень, но есть точки улучшения.';
        if (total >= 50)
            return 'Средний уровень: начните с приоритетов ниже.';
        return 'Низкий уровень: начните с трёх приоритетов ниже.';
    }
    function ensureContainer() {
        var panel = byId('heiPanel');
        if (!panel)
            return null;
        var old = byId('heiMobileCards');
        if (old)
            old.remove();
        var wrap = panel.querySelector('.ui-hei-table-fold') || panel.querySelector('.table-wrap');
        var dash = byId('heiMobileDashboard');
        if (!dash) {
            dash = document.createElement('section');
            dash.id = 'heiMobileDashboard';
            dash.className = 'hei-mobile-dashboard';
            dash.setAttribute('aria-label', 'Краткая сводка индекса HEI-2020');
            if (wrap)
                wrap.insertAdjacentElement('beforebegin', dash);
            else
                panel.appendChild(dash);
        }
        return dash;
    }
    function rowDataFromDom() {
        var tbody = byId('heiTableBody');
        if (!tbody)
            return [];
        return Array.prototype.slice.call(tbody.querySelectorAll('tr')).map(function (row) {
            var c = Array.prototype.slice.call(row.children || []);
            if (c.length < 5)
                return null;
            var max = num(row.getAttribute('data-hei-max'));
            if (!Number.isFinite(max) || max <= 0)
                max = 10;
            var score = num(row.getAttribute('data-hei-score'));
            if (!Number.isFinite(score))
                score = num(text(c[4]));
            var ratio = max > 0 ? clamp(score / max, 0, 1) : 0;
            return { key: row.getAttribute('data-hei-key') || '', title: text(c[0]), value: text(c[1]), norm: text(c[2]), action: text(c[3]), score: Number.isFinite(score) ? score : 0, max: max, ratio: ratio, tone: toneByRatio(ratio) };
        }).filter(Boolean);
    }
    function scoreText(item) { return fmt(item.score, 1) + ' из ' + fmt(item.max, 0); }
    function indicatorHtml(item) {
        var pct = clamp(item.ratio * 100, 0, 100), title = item.title || item.key || 'Компонент HEI';
        return '<details class="hei-mobile-indicator" data-tone="' + esc(item.tone) + '" data-hei-key="' + esc(item.key) + '" style="--hei-score-pct:' + pct + '%">' +
            '<summary><span class="hei-mobile-indicator-title">' + esc(title) + '</span><span class="hei-mobile-scorebar" aria-hidden="true"><i></i></span><span class="hei-mobile-indicator-score">' + esc(scoreText(item)) + '</span></summary>' +
            '<div class="hei-mobile-indicator-body">' +
            '<div class="hei-mobile-detail-row"><span>Сейчас</span><strong>' + esc(item.value || '—') + '</strong></div>' +
            '<div class="hei-mobile-detail-row"><span>Ориентир</span><strong>' + esc(item.norm || '—') + '</strong></div>' +
            '<div class="hei-mobile-detail-row"><span>Практический шаг</span><strong>' + esc(item.action || '—') + '</strong></div>' +
            '</div></details>';
    }
    function priorityHtml(item, index) {
        var pct = clamp(item.ratio * 100, 0, 100);
        return '<button class="hei-mobile-priority" type="button" data-hei-open="' + esc(item.key) + '" data-tone="' + esc(item.tone) + '" style="--hei-score-pct:' + pct + '%">' +
            '<span class="hei-mobile-priority-rank">' + (index + 1) + '</span><span class="hei-mobile-priority-main"><b>' + esc(item.title || item.key) + '</b><i><span></span></i></span><strong>' + esc(scoreText(item)) + '</strong></button>';
    }
    var lastSignature = '';
    function signature(rows, total, summary) { try {
        return JSON.stringify({ t: total, s: summary || '', r: rows.map(function (x) { return [x.key, x.score, x.max].join(':'); }) });
    }
    catch (_) {
        return String(Date.now());
    } }
    function renderDashboard() {
        var dash = ensureContainer();
        if (!dash)
            return;
        var rows = rowDataFromDom(), total = num(text(byId('heiTotalCell'))), summary = text(byId('heiSummary'));
        var sig = signature(rows, total, summary);
        if (sig === lastSignature && dash.__rendered)
            return;
        if (!rows.length) {
            dash.innerHTML = '<div class="hei-mobile-empty"><strong>HEI пока не рассчитан</strong><span>Добавьте продукты в рацион, чтобы увидеть общий балл и компоненты индекса.</span></div>';
            lastSignature = sig;
            return;
        }
        var totalRatio = Number.isFinite(total) ? clamp(total / 100, 0, 1) : 0;
        var priorities = rows.slice().sort(function (a, b) { return a.ratio - b.ratio; }).filter(function (x) { return x.ratio < .95; }).slice(0, 3);
        var totalHtml = '<section class="hei-mobile-total" data-tone="' + esc(totalToneByRatio(totalRatio)) + '" style="--hei-score-pct:' + fmt(totalRatio * 100, 1) + '%">' +
            '<div class="hei-mobile-total-head"><span><b>HEI-2020</b><small>Итоговый балл качества</small></span><strong>' + esc(Number.isFinite(total) ? fmt(total, 1) : '—') + ' / 100</strong></div>' +
            '<div class="hei-mobile-total-bar"><i></i></div><p>' + esc(qualityText(total)) + '</p></section>';
        var priorityLead = priorities.length === 1 ? 'Компонент с наибольшим резервом.' : (priorities.length === 2 ? 'Два компонента с наибольшим резервом.' : 'До трёх компонентов с наибольшим резервом.');
        var priorityBlock = priorities.length
            ? '<section class="hei-mobile-priorities"><div class="hei-mobile-dashboard-head"><strong>С чего начать</strong><span>' + priorityLead + '</span></div>' + priorities.map(priorityHtml).join('') + '</section>'
            : '<section class="hei-mobile-priorities hei-mobile-priorities-ok"><div class="hei-mobile-dashboard-head"><strong>Все компоненты достигли ориентира</strong><span>Специальные корректирующие действия не требуются.</span></div></section>';
        var full = '<details class="hei-mobile-components-fold"><summary><span><b>Все 13 компонентов HEI</b><small>Значения, ориентиры и практические шаги</small></span><strong>Показать</strong></summary><div class="hei-mobile-indicator-list">' + rows.map(indicatorHtml).join('') + '</div></details>';
        dash.innerHTML = totalHtml + priorityBlock + full;
        dash.querySelectorAll('[data-hei-open]').forEach(function (btn) { btn.addEventListener('click', function () { var fold = dash.querySelector('.hei-mobile-components-fold'); if (fold)
            fold.open = true; var d = dash.querySelector('[data-hei-key="' + CSS.escape(btn.getAttribute('data-hei-open')) + '"]'); if (d) {
            d.open = true;
            setTimeout(function () { d.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 40);
        } }); });
        lastSignature = sig;
        dash.__rendered = true;
    }
    function install() { var tbody = byId('heiTableBody'); if (!tbody)
        return false; renderDashboard(); try {
        new MutationObserver(renderDashboard).observe(tbody, { childList: true, subtree: true, characterData: true, attributes: true });
    }
    catch (_) { } ; ['hei:rendered', 'hei:bridge-updated', 'ration:changed', 'needs:changed', 'resize', 'ui:hei-folds-ready'].forEach(function (ev) { window.addEventListener(ev, renderDashboard); }); return true; }
    function init() { if (!install())
        setTimeout(install, 350); setTimeout(renderDashboard, 800); setTimeout(renderDashboard, 1500); }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
