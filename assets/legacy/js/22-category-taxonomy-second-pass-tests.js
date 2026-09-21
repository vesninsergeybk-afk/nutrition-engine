// nutrition calculator v4.6.5_category_taxonomy_second_pass
// Runtime audit tests for the second pass of user-facing product categories and obvious HEI-equivalent leaks.
(function () {
    'use strict';
    var VERSION = 'v4.6.5_category_taxonomy_second_pass';
    function n(v) { return Number(v || 0); }
    function ok(name, pass, got, expected) { return { test: name, pass: !!pass, got: got, expected: expected }; }
    function byKey(k) { return window.DB && window.DB.byKey && window.DB.byKey.get(k); }
    function tagsOf(p) {
        if (!p)
            return '';
        if (Array.isArray(p.tags))
            return p.tags.join('|').toLowerCase();
        return String(p.tags || '').toLowerCase();
    }
    function catOf(k) { var p = byKey(k); return p && p.catalog_category_key; }
    function noProteinLeak(k) {
        var p = byKey(k);
        return p && n(p.protein_oz_eq_per_100g) === 0 && n(p.seafood_plant_oz_eq_per_100g) === 0;
    }
    function run() {
        var tests = [];
        tests.push(ok('v4.6.5 loaded', window.__V465_CATEGORY_TAXONOMY_SECOND_PASS__ === VERSION, window.__V465_CATEGORY_TAXONOMY_SECOND_PASS__, VERSION));
        tests.push(ok('labelCatalog знает группу Соусы и приправы', typeof window.labelCatalog === 'function' && window.labelCatalog('spices_sauces') === 'Соусы и приправы', window.labelCatalog && window.labelCatalog('spices_sauces'), 'Соусы и приправы'));
        tests.push(ok('labelCatalog знает группу Солёные снеки', typeof window.labelCatalog === 'function' && window.labelCatalog('snacks_salty') === 'Солёные снеки', window.labelCatalog && window.labelCatalog('snacks_salty'), 'Солёные снеки'));
        [['ghee', 'oils_fats'], ['butter_82_5_pct', 'oils_fats'], ['green_line_hazelnut_plant_drink_1l', 'drinks'], ['kvass_bottled', 'drinks'], ['sweet_chili_sauce', 'spices_sauces'], ['garlic_sauce', 'spices_sauces'], ['green_line_waffles_lemon_150g', 'sweets'], ['green_line_cocoa_dessert_95g', 'sweets'], ['potato_chips_sour_cream_onion', 'snacks_salty'], ['fruit_leather_apple', 'fruits_berries'], ['pelmeni_cooked', 'semi_finished'], ['frozen_crepes_meat', 'semi_finished'], ['beet_garlic_mayo_salad', 'ready_food'], ['meatballs_tomato_sauce_ready', 'ready_food'], ['kidney_beans_boiled', 'nuts_seeds']].forEach(function (pair) {
            tests.push(ok(pair[0] + ': уточнённая пользовательская категория', catOf(pair[0]) === pair[1], catOf(pair[0]), pair[1]));
        });
        ['snow_peas_raw', 'green_peas_raw', 'green_peas_frozen', 'green_beans_raw', 'green_beans_frozen'].forEach(function (k) {
            var p = byKey(k);
            tests.push(ok(k + ': стручковые/зелёный горошек не дают protein/seafood HEI-вклад', noProteinLeak(k), p && [p.protein_oz_eq_per_100g, p.seafood_plant_oz_eq_per_100g].join('/'), '0/0'));
        });
        ['cream_cheese_spread', 'mascarpone_cheese', 'ricotta_cheese', 'adyghe_cheese', 'suluguni_cheese', 'processed_cheese_slices'].forEach(function (k) {
            var p = byKey(k);
            tests.push(ok(k + ': чистый сыр не даёт белковый HEI-вклад поверх dairy', p && n(p.protein_oz_eq_per_100g) === 0, p && p.protein_oz_eq_per_100g, 0));
        });
        var garlic = byKey('garlic_sauce');
        tests.push(ok('garlic_sauce: нет фруктового HEI-вклада', garlic && n(garlic.fruit_cup_eq_per_100g) === 0 && n(garlic.whole_fruit_cup_eq_per_100g) === 0, garlic && [garlic.fruit_cup_eq_per_100g, garlic.whole_fruit_cup_eq_per_100g].join('/'), '0/0'));
        var banana = byKey('banana');
        tests.push(ok('banana: нет ошибочного тега starchy_vegetable', banana && tagsOf(banana).indexOf('starchy_vegetable') === -1, tagsOf(banana), 'без starchy_vegetable'));
        return tests;
    }
    window.__V465_CATEGORY_TAXONOMY_SECOND_PASS__ = VERSION;
    window.runV465CategoryTaxonomySecondPassTests = run;
})();
