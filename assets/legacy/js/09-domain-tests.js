// nutrition calculator v3.9_split_js_modules
// Module: 09-domain-tests.js
// Responsibility: Perekrestok and Green Line domain regression tests.
// Extracted from v3.8.1 monolithic app.js without changing runtime logic.
// ===== extracted inline script 39; id=v3-0-perekrestok-complex-p0-tests =====
(function () {
    'use strict';
    var KEYS = ["servelat_boiled_smoked", "krakowskaya_sausage", "hunting_sausages_smoked", "frankfurters_vienna_style", "chicken_sausages", "ham_pork_sliced_cooked", "ham_turkey_chicken_sliced", "chicken_roll_deli", "tvorog_lowfat_0_1_8_pct", "tvorog_5_pct", "tvorog_9_pct", "grainy_cottage_cheese_5_pct", "soft_curd_plain", "sweet_curd_vanilla", "kids_fruit_curd", "sour_cream_10_pct", "olivier_salad_ready", "herring_under_fur_coat_ready", "mimosa_salad_ready", "crab_salad_ready", "caesar_chicken_salad_ready", "caesar_shrimp_salad_ready", "vinaigrette_ready", "korean_carrot_salad", "pilaf_chicken_ready", "pasta_carbonara_ready", "macaroni_navy_ready", "meat_hedgehogs_rice_ready", "stuffed_peppers_meat_rice", "pelmeni_beef_pork_category_b", "khinkali_beef_pork", "chebureki_meat", "blini_meat", "blini_cottage_cheese", "vareniki_cottage_cheese", "chicken_nuggets_frozen", "ketchup_classic", "soy_sauce_classic", "teriyaki_sauce", "caesar_dressing", "hummus_classic"];
    var REQUIRED = ["kcal", "sfa", "unsat", "added_sugar", "salt", "protein_per_100g", "fat_per_100g", "carbs_per_100g", "sugar_per_100g", "fiber_per_100g", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg", "potassium_mg", "sodium_mg", "zinc_mg", "copper_mg", "manganese_mg", "selenium_ug", "vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg", "vitamin_c_mg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg", "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg", "choline_mg", "vitamin_k_mcg", "fruit_cup_eq_per_100g", "whole_fruit_cup_eq_per_100g", "veg_cup_eq_per_100g", "greens_beans_cup_eq_per_100g", "dairy_cup_eq_per_100g", "whole_grain_oz_eq_per_100g", "refined_grain_oz_eq_per_100g", "protein_oz_eq_per_100g", "seafood_plant_oz_eq_per_100g", "added_sugars_tsp_eq_per_100g"];
    function product(key) { return window.DB && window.DB.byKey ? window.DB.byKey.get(key) : null; }
    function finiteNonNegative(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }
    window.runPerekrestokComplexP0Tests = function () {
        var rows = [];
        var missing = [];
        var bad = [];
        KEYS.forEach(function (k) {
            var p = product(k);
            if (!p) {
                missing.push(k);
                rows.push({ key: k, pass: false, issue: 'missing' });
                return;
            }
            var badFields = REQUIRED.filter(function (f) { return !finiteNonNegative(p[f]); });
            var hasHei = REQUIRED.filter(function (f) { return f.indexOf('_eq_per_100g') >= 0 || f === 'added_sugars_tsp_eq_per_100g'; }).every(function (f) { return finiteNonNegative(p[f]); });
            if (badFields.length)
                bad.push({ key: k, fields: badFields });
            rows.push({ key: k, pass: badFields.length === 0 && hasHei, kcal: p.kcal, protein: p.protein_per_100g, fat: p.fat_per_100g, carbs: p.carbs_per_100g, status: p.nutrition_verification_status, hei: p.hei_equiv_status });
        });
        var duplicateCount = window.DB && window.DB.raw ? (window.DB.raw.length - new Set(window.DB.raw.map(function (p) { return p.key; })).size) : 0;
        var ok = missing.length === 0 && bad.length === 0 && duplicateCount === 0;
        window.__v30PerekrestokComplexP0Report = { count: KEYS.length, missing: missing, bad: bad, duplicateCount: duplicateCount, rows: rows };
        if (console && console.table)
            console.table(rows);
        return ok;
    };
    var previousSmoke = window.runSmokeTests;
    window.runSmokeTests = function () {
        var base = true;
        try {
            base = previousSmoke ? previousSmoke() : true;
        }
        catch (e) {
            base = false;
            window.__v30PreviousSmokeError = String(e && e.message || e);
        }
        return !!base && window.runPerekrestokComplexP0Tests();
    };
})();
;
// ===== extracted inline script 40; id=v3-2-green-line-expansion-tests =====
(function () {
    'use strict';
    var KEYS = ["green_line_waffles_lemon_150g", "green_line_waffles_cocoa_150g", "green_line_waffles_hazelnut_150g", "green_line_milk_1_pct_900g", "green_line_milk_2_5_pct_900ml", "green_line_milk_3_2_pct_900ml", "green_line_selected_milk_3_2_6_pct_1l", "green_line_goat_milk_2_8_5_6_pct_500ml", "green_line_baked_milk_2_5_pct_900ml", "green_line_milk_cocktail_strawberry_2_5_pct_205ml", "green_line_greek_yogurt_natural_4_pct_190g", "green_line_greek_yogurt_honey_walnut_3_pct_190g", "green_line_greek_yogurt_fig_apricot_3_pct_190g", "green_line_greek_yogurt_raspberry_3_pct_190g", "green_line_greek_yogurt_pineapple_coconut_3_pct_190g", "green_line_yogurt_peach_1_5_pct_250g", "green_line_yogurt_apple_cereals_1_5_pct_250g", "green_line_yogurt_cherry_2_8_pct_315g", "green_line_yogurt_blueberry_2_8_pct_315g", "green_line_yogurt_strawberry_2_8_pct_315g", "green_line_yogurt_peach_passionfruit_2_8_pct_315g", "green_line_skyr_natural_1_5_pct_150g", "green_line_skyr_baked_apple_1_2_pct_150g", "green_line_skyr_blueberry_raspberry_1_2_pct_150g", "green_line_syrniki_tvorozhnye_340g", "green_line_syrniki_tvorozhnye_5_pct", "green_line_syrnichki_cherry_120g", "green_line_syrnichki_pear_peach_120g", "green_line_syrnichki_condensed_milk_120g", "green_line_curd_casserole_plain_200g", "green_line_curd_casserole_blackcurrant_200g", "green_line_curd_casserole_pear_200g", "green_line_curd_casserole_apple_cinnamon_200g", "green_line_ricotta_casserole_200g", "green_line_ricotta_casserole_mango_passionfruit_200g", "green_line_curd_casserole_strawberry_papaya_200g", "green_line_tofu_classic_200g", "green_line_tofu_italian_200g", "green_line_tofu_dill_garlic_200g", "green_line_tofu_paste_white_mushrooms_200g", "green_line_hazelnut_plant_drink_1l", "green_line_coconut_plant_drink_1l", "green_line_fish_cutlet_mashed_potato_broccoli_260g", "green_line_wholegrain_sliced_bread_300g", "green_line_fruit_sticks_apple_cherry_60g", "green_line_fruit_sticks_apple_prune_60g", "green_line_puree_apple_banana_90g", "green_line_puree_pear_apple_90g", "green_line_puree_apple_strawberry_raspberry_90g", "green_line_pineapple_fresh_cut_170g", "green_line_cocoa_dessert_95g"];
    var REQUIRED = ["kcal", "sfa", "unsat", "added_sugar", "salt", "protein_per_100g", "fat_per_100g", "carbs_per_100g", "sugar_per_100g", "fiber_per_100g", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg", "potassium_mg", "sodium_mg", "zinc_mg", "copper_mg", "manganese_mg", "selenium_ug", "vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg", "vitamin_c_mg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg", "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg", "choline_mg", "vitamin_k_mcg", "fruit_cup_eq_per_100g", "whole_fruit_cup_eq_per_100g", "veg_cup_eq_per_100g", "greens_beans_cup_eq_per_100g", "dairy_cup_eq_per_100g", "whole_grain_oz_eq_per_100g", "refined_grain_oz_eq_per_100g", "protein_oz_eq_per_100g", "seafood_plant_oz_eq_per_100g", "added_sugars_tsp_eq_per_100g"];
    function product(key) { return window.DB && window.DB.byKey ? window.DB.byKey.get(key) : null; }
    function finiteNonNegative(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }
    window.runGreenLineV32Tests = function () {
        var rows = [];
        var missing = [];
        var bad = [];
        KEYS.forEach(function (k) {
            var p = product(k);
            if (!p) {
                missing.push(k);
                rows.push({ key: k, pass: false, issue: 'missing' });
                return;
            }
            var badFields = REQUIRED.filter(function (f) { return !finiteNonNegative(p[f]); });
            if (!p.source_url || !p.verification_note || p.perekrestok_expansion_version !== 'v3.2')
                badFields.push('metadata');
            if (!String(p.nutrition_verification_status || '').match(/^GREEN_LINE_LABEL_KBJU_PROXY_MICROS$/))
                badFields.push('status');
            if (badFields.length)
                bad.push({ key: k, fields: badFields });
            rows.push({ key: k, pass: badFields.length === 0, kcal: p.kcal, protein: p.protein_per_100g, fat: p.fat_per_100g, carbs: p.carbs_per_100g, category: p.category, status: p.nutrition_verification_status });
        });
        var duplicateCount = window.DB && window.DB.items ? (window.DB.items.length - new Set(window.DB.items.map(function (p) { return p.key; })).size) : -1;
        var count = window.DB && window.DB.items ? window.DB.items.length : 0;
        var results = [
            { test: 'v3.2 Green Line keys present', pass: missing.length === 0, details: missing },
            { test: 'v3.2 numeric/metainfo fields valid', pass: bad.length === 0, details: bad.slice(0, 20) },
            { test: 'DB unique keys', pass: duplicateCount === 0, details: duplicateCount },
            { test: 'DB count >= 646', pass: count >= 646, details: count }
        ];
        window.__v32GreenLineExpansionReport = { count: KEYS.length, missing: missing, bad: bad, duplicateCount: duplicateCount, rows: rows, results: results };
        if (console && console.table)
            console.table(results.map(function (r) { return { test: r.test, pass: r.pass, details: Array.isArray(r.details) ? r.details.length : r.details }; }));
        return results.every(function (r) { return !!r.pass; });
    };
    var previousSmoke = window.runSmokeTests;
    window.runSmokeTests = function () {
        var base = true;
        try {
            base = previousSmoke ? previousSmoke() : true;
        }
        catch (e) {
            base = false;
            window.__v32PreviousSmokeError = String(e && e.message || e);
        }
        return !!base && window.runGreenLineV32Tests();
    };
})();
;
// ===== extracted inline script 41; id=v3-2-line-audit-tests =====
(function () {
    'use strict';
    var KEYS = ["green_line_waffles_lemon_150g", "green_line_waffles_cocoa_150g", "green_line_waffles_hazelnut_150g", "green_line_milk_1_pct_900g", "green_line_milk_2_5_pct_900ml", "green_line_milk_3_2_pct_900ml", "green_line_selected_milk_3_2_6_pct_1l", "green_line_goat_milk_2_8_5_6_pct_500ml", "green_line_baked_milk_2_5_pct_900ml", "green_line_milk_cocktail_strawberry_2_5_pct_205ml", "green_line_greek_yogurt_natural_4_pct_190g", "green_line_greek_yogurt_honey_walnut_3_pct_190g", "green_line_greek_yogurt_fig_apricot_3_pct_190g", "green_line_greek_yogurt_raspberry_3_pct_190g", "green_line_greek_yogurt_pineapple_coconut_3_pct_190g", "green_line_yogurt_peach_1_5_pct_250g", "green_line_yogurt_apple_cereals_1_5_pct_250g", "green_line_yogurt_cherry_2_8_pct_315g", "green_line_yogurt_blueberry_2_8_pct_315g", "green_line_yogurt_strawberry_2_8_pct_315g", "green_line_yogurt_peach_passionfruit_2_8_pct_315g", "green_line_skyr_natural_1_5_pct_150g", "green_line_skyr_baked_apple_1_2_pct_150g", "green_line_skyr_blueberry_raspberry_1_2_pct_150g", "green_line_syrniki_tvorozhnye_340g", "green_line_syrniki_tvorozhnye_5_pct", "green_line_syrnichki_cherry_120g", "green_line_syrnichki_pear_peach_120g", "green_line_syrnichki_condensed_milk_120g", "green_line_curd_casserole_plain_200g", "green_line_curd_casserole_blackcurrant_200g", "green_line_curd_casserole_pear_200g", "green_line_curd_casserole_apple_cinnamon_200g", "green_line_ricotta_casserole_200g", "green_line_ricotta_casserole_mango_passionfruit_200g", "green_line_curd_casserole_strawberry_papaya_200g", "green_line_tofu_classic_200g", "green_line_tofu_italian_200g", "green_line_tofu_dill_garlic_200g", "green_line_tofu_paste_white_mushrooms_200g", "green_line_hazelnut_plant_drink_1l", "green_line_coconut_plant_drink_1l", "green_line_fish_cutlet_mashed_potato_broccoli_260g", "green_line_wholegrain_sliced_bread_300g", "green_line_fruit_sticks_apple_cherry_60g", "green_line_fruit_sticks_apple_prune_60g", "green_line_puree_apple_banana_90g", "green_line_puree_pear_apple_90g", "green_line_puree_apple_strawberry_raspberry_90g", "green_line_pineapple_fresh_cut_170g", "green_line_cocoa_dessert_95g"];
    var PATCHED = ["green_line_yogurt_peach_1_5_pct_250g", "green_line_skyr_natural_1_5_pct_150g", "green_line_syrnichki_condensed_milk_120g", "green_line_curd_casserole_strawberry_papaya_200g", "green_line_fruit_sticks_apple_prune_60g", "green_line_wholegrain_sliced_bread_300g", "green_line_milk_cocktail_strawberry_2_5_pct_205ml", "green_line_fish_cutlet_mashed_potato_broccoli_260g"];
    function p(k) { return window.DB && window.DB.byKey ? window.DB.byKey.get(k) : null; }
    function finite(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }
    window.runGreenLineV32LineAuditTests = function () {
        var missing = [], bad = [], patchedMissing = [];
        KEYS.forEach(function (k) {
            var x = p(k);
            if (!x) {
                missing.push(k);
                return;
            }
            ['kcal', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g', 'sugar_per_100g', 'added_sugar', 'salt', 'sodium_mg', 'sfa', 'unsat', 'added_sugars_tsp_eq_per_100g'].forEach(function (f) { if (!finite(x[f]))
                bad.push(k + ':' + f); });
            if (x.sugar_per_100g > x.carbs_per_100g + 1e-9)
                bad.push(k + ':sugar>carbs');
            if (x.added_sugar > x.sugar_per_100g + 1e-9)
                bad.push(k + ':added>sugar');
            if (Math.abs(x.sodium_mg - x.salt * 393) > 0.75)
                bad.push(k + ':saltNa');
            if (Math.abs((x.added_sugars_tsp_eq_per_100g || 0) - (x.added_sugar || 0) / 4.2) > 0.012)
                bad.push(k + ':addedTsp');
        });
        PATCHED.forEach(function (k) { var x = p(k); if (!x || x.line_audit_version !== 'v3.2_line_audited_2026-06-29')
            patchedMissing.push(k); });
        var duplicateCount = window.DB && window.DB.items ? (window.DB.items.length - new Set(window.DB.items.map(function (x) { return x.key; })).size) : -1;
        var results = [
            { test: 'line audit all 51 Green Line rows present', pass: missing.length === 0, details: missing },
            { test: 'line audit numeric logic', pass: bad.length === 0, details: bad.slice(0, 20) },
            { test: 'line audit patched rows tagged', pass: patchedMissing.length === 0, details: patchedMissing },
            { test: 'line audit duplicate keys', pass: duplicateCount === 0, details: duplicateCount }
        ];
        window.__v32LineAuditReport = { missing: missing, bad: bad, patchedMissing: patchedMissing, duplicateCount: duplicateCount, results: results };
        if (console && console.table)
            console.table(results.map(function (r) { return { test: r.test, pass: r.pass, details: Array.isArray(r.details) ? r.details.length : r.details }; }));
        return results.every(function (r) { return !!r.pass; });
    };
    var prevSmoke = window.runSmokeTests;
    window.runSmokeTests = function () {
        var base = true;
        try {
            base = prevSmoke ? prevSmoke() : true;
        }
        catch (e) {
            base = false;
            window.__v32LineAuditPreviousSmokeError = String(e && e.message || e);
        }
        return !!base && window.runGreenLineV32LineAuditTests();
    };
})();
