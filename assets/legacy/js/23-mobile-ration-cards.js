// nutrition calculator v4.6.7_stability_mobile_packaging
// Module: 23-mobile-ration-cards.js
// Responsibility: mobile-only presentation aid for Итоговый рацион. It does not change ration data or calculations.
(function () {
    'use strict';
    var VERSION = 'v4.6.7_stability_mobile_packaging';
    function byId(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function productByKey(key) {
        if (!key)
            return null;
        try {
            if (window.DB && window.DB.byKey && typeof window.DB.byKey.get === 'function')
                return window.DB.byKey.get(key) || null;
        }
        catch (_) { }
        return null;
    }
    function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
    function f1(v) { return String(Math.round(num(v) * 10) / 10).replace('.', ','); }
    function macroSummary(product, grams) {
        if (!product)
            return '';
        var g = num(grams);
        if (g <= 0)
            return '0 г · 0 ккал';
        var k = Math.round(num(product.kcal) * g / 100);
        var p = num(product.protein_per_100g) * g / 100;
        var fat = num(product.fat_per_100g) * g / 100;
        var c = num(product.carbs_per_100g) * g / 100;
        return Math.round(g) + ' г · ' + k + ' ккал · Б ' + f1(p) + ' · Ж ' + f1(fat) + ' · У ' + f1(c);
    }
    function ensureTitleStack(row) {
        var nameCell = row && row.querySelector ? row.querySelector('.ration-name') : null;
        if (!nameCell)
            return null;
        var title = nameCell.querySelector('.ration-title');
        if (!title)
            return nameCell.querySelector('.ration-title-stack');
        var stack = nameCell.querySelector('.ration-title-stack');
        if (!stack) {
            stack = document.createElement('span');
            stack.className = 'ration-title-stack';
            nameCell.insertBefore(stack, title);
            stack.appendChild(title);
        }
        return stack;
    }
    function enhanceRow(row) {
        if (!row || !row.querySelector)
            return false;
        var input = row.querySelector('input[data-ration-key]');
        if (!input)
            return false;
        var key = input.getAttribute('data-ration-key') || '';
        var product = productByKey(key);
        var stack = ensureTitleStack(row);
        if (!stack)
            return false;
        var summary = stack.querySelector('.mobile-ration-summary');
        if (!summary) {
            summary = document.createElement('span');
            summary.className = 'mobile-ration-summary';
            stack.appendChild(summary);
        }
        summary.innerHTML = esc(macroSummary(product, input.value));
        input.setAttribute('inputmode', 'decimal');
        input.setAttribute('aria-label', 'Граммы: ' + (product && product.name_ru ? product.name_ru : key));
        var rm = row.querySelector('button[data-role="rm"]');
        if (rm)
            rm.setAttribute('aria-label', 'Удалить из рациона: ' + (product && product.name_ru ? product.name_ru : key));
        if (!input.dataset.mobileRationSummaryObserved) {
            input.dataset.mobileRationSummaryObserved = '1';
            input.addEventListener('input', function () {
                window.setTimeout(function () {
                    var p = productByKey(key);
                    summary.innerHTML = esc(macroSummary(p, input.value));
                }, 0);
            });
        }
        row.dataset.mobileRationCard = '1';
        return true;
    }
    function enhance() {
        var rows = Array.prototype.slice.call(document.querySelectorAll('#rationBody .ration-row'));
        var count = 0;
        rows.forEach(function (row) { if (enhanceRow(row))
            count++; });
        return count;
    }
    function install() {
        var body = byId('rationBody');
        if (body && !body.dataset.mobileRationCardsObserved) {
            body.dataset.mobileRationCardsObserved = '1';
            new MutationObserver(function () { window.setTimeout(enhance, 0); }).observe(body, { childList: true, subtree: true });
        }
        window.addEventListener('ration:changed', function () { window.setTimeout(enhance, 0); });
        enhance();
    }
    function tests() {
        var rows = [];
        var rb = byId('rationBody');
        var banana = productByKey('banana');
        var tempPass = true;
        var detail = 'rationBody отсутствует';
        if (rb && banana) {
            var tr = document.createElement('tr');
            tr.className = 'ration-row';
            tr.innerHTML = '<td class="ration-name"><span class="expander">▸</span><span class="ration-title">Банан (сырой)</span></td><td><div class="meta"><span class="pill">Фрукты</span><span class="pill">Фрукты и ягоды</span></div></td><td><input data-ration-key="banana" type="number" value="120"></td><td><button data-role="rm" class="danger">Удалить</button></td>';
            rb.appendChild(tr);
            try {
                enhance();
                var s = tr.querySelector('.mobile-ration-summary');
                tempPass = !!(s && /120\s*г/.test(s.textContent || '') && /ккал/.test(s.textContent || '') && /Б/.test(s.textContent || ''));
                detail = s ? s.textContent.replace(/\s+/g, ' ').trim() : 'mobile summary missing';
            }
            finally {
                if (tr.parentNode)
                    tr.parentNode.removeChild(tr);
            }
        }
        rows.push({ test: 'v4.6.7 mobile ration CSS linked', pass: !!document.querySelector('link[href$="mobile-ration-cards.css"],link[data-css-bundle="5.3.117"]') });
        rows.push({ test: 'v4.6.7 mobile ration JS loaded', pass: window.__V467_MOBILE_RATION_CARDS__ === VERSION, detail: window.__V467_MOBILE_RATION_CARDS__ });
        rows.push({ test: 'mobile ration summary can render', pass: tempPass, detail: detail });
        rows.push({ test: 'desktop table remains in DOM', pass: !!document.getElementById('rationTable') && !!document.getElementById('rationBody') });
        if (console && console.table)
            console.table(rows);
        return rows.every(function (r) { return !!r.pass; });
    }
    function init() {
        window.__V467_MOBILE_RATION_CARDS__ = VERSION;
        window.enhanceMobileRationCards = enhance;
        window.runV467MobileRationCardsTests = tests;
        install();
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
