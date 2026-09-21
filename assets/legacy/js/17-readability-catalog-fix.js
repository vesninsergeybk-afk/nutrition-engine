// nutrition calculator v4.5.2_readability_catalog_fix
// Responsibility: verify final readability pass and repair catalog headers if legacy raw categories leaked into UI.
(function () {
    'use strict';
    var VERSION = 'v4.5.2_readability_catalog_fix';
    function byId(id) { return document.getElementById(id); }
    function labelCatalog(key) {
        if (window.UI_RU_LABELS && typeof window.UI_RU_LABELS.labelCatalog === 'function')
            return window.UI_RU_LABELS.labelCatalog(key);
        var map = {
            'Vegetables': 'Овощи', 'Fruits': 'Фрукты и ягоды', 'Dairy': 'Молочные продукты', 'Meat': 'Мясо, птица и яйца',
            'Seafood & Plant Protein': 'Рыба, морепродукты и растительные белки', 'Whole Grains': 'Крупы, хлеб и выпечка',
            'Refined Grains': 'Крупы, хлеб и выпечка', 'Legumes, Nuts & Seeds': 'Орехи, семечки и бобовые',
            'Ready food / Culinary': 'Готовые блюда', 'Frozen / Semi-finished': 'Заморозка и полуфабрикаты',
            'Bakery / Grains / Breakfast': 'Хлеб, выпечка и завтраки', 'Sports Protein': 'Спортивное питание',
            'Protein Drink': 'Белковые напитки', 'Other': 'Другое', 'other': 'Другое'
        };
        return map[String(key || 'other')] || String(key || 'Другое');
    }
    function repairCatalogHeads() {
        var categories = byId('categories');
        if (!categories || !window.DB || !window.DB.byCatCatalog)
            return false;
        var heads = categories.querySelectorAll('.accordion-head');
        if (!heads.length)
            return false;
        var keys = Array.from(window.DB.byCatCatalog.keys()).sort(function (a, b) { return labelCatalog(a).localeCompare(labelCatalog(b)); });
        if (keys.length !== heads.length)
            return false;
        heads.forEach(function (head, idx) {
            var key = keys[idx];
            var products = window.DB.byCatCatalog.get(key) || [];
            var label = labelCatalog(key);
            head.innerHTML = label + ' <span class="cat-count">' + products.length + '</span>';
        });
        return true;
    }
    function removeStrayHints() {
        Array.prototype.slice.call(document.querySelectorAll('section.card')).forEach(function (section) {
            var h3 = section.querySelector('h3');
            if (h3 && h3.textContent.trim() === 'Подсказки')
                section.remove();
        });
    }
    function runTests() {
        repairCatalogHeads();
        var heads = Array.prototype.slice.call(document.querySelectorAll('#categories .accordion-head')).map(function (h) { return h.textContent.trim(); });
        var repeatedOther = heads.filter(function (t) { return /^Прочее\s+\d+/.test(t); });
        var paleNotice = byId('heiFpedApproxNotice');
        var color = paleNotice ? getComputedStyle(paleNotice).color : '';
        var rows = [
            { test: 'v4.5.2 CSS linked', pass: !!document.querySelector('link[href$="readability-catalog-fix.css"],link[data-css-bundle="5.3.117"]') },
            { test: 'v4.5.2 JS loaded', pass: window.__V452_READABILITY_CATALOG_FIX__ === VERSION },
            { test: 'catalog headers do not repeat raw Прочее groups', pass: repeatedOther.length === 0, detail: repeatedOther.join(', ') },
            { test: 'HEI approximation notice is present and styled', pass: !!paleNotice && !!color },
            { test: 'bottom hints section absent', pass: !Array.prototype.some.call(document.querySelectorAll('section.card h3'), function (h) { return h.textContent.trim() === 'Подсказки'; }) }
        ];
        if (console && console.table)
            console.table(rows);
        return rows.every(function (r) { return !!r.pass; });
    }
    function init() {
        window.__V452_READABILITY_CATALOG_FIX__ = VERSION;
        removeStrayHints();
        repairCatalogHeads();
        window.setTimeout(repairCatalogHeads, 150);
        window.runV452ReadabilityCatalogTests = runTests;
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
