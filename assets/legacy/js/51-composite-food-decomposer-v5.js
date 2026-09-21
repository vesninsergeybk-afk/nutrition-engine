// nutrition calculator v5.3.78 — CompositeFoodDecomposer + ReverseRecipeEstimator foundation
// This module is intentionally non-invasive: it registers a deterministic API for future UI/runtime integration.
(function () {
    'use strict';
    var VERSION = 'v5.3.78_composite_reverse_recipe_estimator';
    function num(x, fallback) {
        var v = Number(x);
        return Number.isFinite(v) ? v : (fallback || 0);
    }
    function clamp(v, min, max) {
        v = num(v, 0);
        min = num(min, 0);
        max = num(max, 100);
        return Math.max(min, Math.min(max, v));
    }
    function lowerText(value) { return String(value || '').toLowerCase(); }
    var DISH_ARCHETYPE_KEYWORDS = [
        { key: 'leafy_salad', words: ['салат', 'salad', 'зелён', 'зелен', 'айсберг', 'брокколи', 'греческий'] },
        { key: 'mayonnaise_salad', words: ['оливье', 'мимоза', 'под шубой', 'крабовый салат', 'майонезный'] },
        { key: 'okroshka', words: ['окрошка', 'okroshka'] },
        { key: 'pizza', words: ['пицца', 'pizza'] },
        { key: 'pasta_or_rice_ready_meal', words: ['паста', 'макароны', 'плов', 'рис с', 'карбонара', 'по-флотски'] },
        { key: 'dumpling_filled_dough', words: ['пельмени', 'вареники', 'хинкали', 'манты', 'dumpling'] },
        { key: 'dessert_bakery_composite', words: ['сырники', 'запеканка', 'блины', 'пирог', 'десерт', 'торт'] }
    ];
    function classifyDishType(input) {
        var text = lowerText([input && input.name_ru, input && input.name, input && input.dish_type, (input && input.ingredient_order_label || []).join(' ')].join(' '));
        for (var i = 0; i < DISH_ARCHETYPE_KEYWORDS.length; i++) {
            var row = DISH_ARCHETYPE_KEYWORDS[i];
            for (var j = 0; j < row.words.length; j++) {
                if (text.indexOf(row.words[j]) >= 0)
                    return row.key;
            }
        }
        return (input && input.dish_type) || 'generic_composite';
    }
    function getRegistry() {
        return window.__COMPOSITE_FOOD_MODELS__ || window.__COMPOSITE_FOOD_MODELS_V5_3_93__ || window.__COMPOSITE_FOOD_MODELS_V5_3_91__ || window.__COMPOSITE_FOOD_MODELS_V5_3_87__ || window.__COMPOSITE_FOOD_MODELS_V5_3_78__ || window.__COMPOSITE_FOOD_MODELS_V5_3_76__ || null;
    }
    function getArchetype(dishType) {
        var registry = getRegistry();
        return registry && registry.dish_archetypes ? registry.dish_archetypes[dishType] : null;
    }
    function makeInitialWeights(components, dishType) {
        components = Array.isArray(components) ? components.slice() : [];
        if (!components.length)
            return [];
        var archetype = getArchetype(dishType) || {};
        var roles = archetype.roles_g_per_100g || {};
        var weights = [];
        var remaining = 100;
        for (var i = 0; i < components.length; i++) {
            var c = components[i] || {};
            var role = c.role || c.component_role || 'unknown';
            var range = roles[role] || c.range_g_per_100g || [0, Math.max(0, remaining)];
            var prior = Number.isFinite(Number(c.prior_g_per_100g)) ? Number(c.prior_g_per_100g) : ((num(range[0], 0) + num(range[1], 0)) / 2);
            weights.push(clamp(prior, num(range[0], 0), num(range[1], 100)));
        }
        var sum = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
        return weights.map(function (w) { return w / sum * 100; });
    }
    function weightedMacros(components, weights) {
        var out = { energy_kcal: 0, protein_g: 0, fat_g: 0, carbohydrate_g: 0 };
        for (var i = 0; i < components.length; i++) {
            var c = components[i] || {}, w = num(weights[i], 0) / 100;
            out.energy_kcal += w * num(c.energy_kcal || c.kcal, 0);
            out.protein_g += w * num(c.protein_g || c.protein_per_100g, 0);
            out.fat_g += w * num(c.fat_g || c.fat_per_100g, 0);
            out.carbohydrate_g += w * num(c.carbohydrate_g || c.carbs_per_100g, 0);
        }
        Object.keys(out).forEach(function (k) { out[k] = Math.round(out[k] * 100) / 100; });
        return out;
    }
    function macroError(model, target) {
        target = target || {};
        var keys = ['protein_g', 'fat_g', 'carbohydrate_g'];
        var err = 0;
        keys.forEach(function (k) {
            var t = num(target[k], 0);
            var denom = Math.max(1, Math.abs(t));
            err += Math.pow((num(model[k], 0) - t) / denom, 2);
        });
        if (Number.isFinite(Number(target.energy_kcal))) {
            var kt = num(target.energy_kcal, 0);
            err += 0.35 * Math.pow((num(model.energy_kcal, 0) - kt) / Math.max(10, Math.abs(kt)), 2);
        }
        return Math.sqrt(err);
    }
    function estimateRecipe(input) {
        input = input || {};
        var dishType = classifyDishType(input);
        var components = Array.isArray(input.candidate_ingredients) ? input.candidate_ingredients : [];
        var weights = makeInitialWeights(components, dishType);
        var target = input.manufacturer_macros_per_100g || input.label_macros_per_100g || {};
        var model = weightedMacros(components, weights);
        var err = macroError(model, target);
        var confidence = err <= 0.08 ? 'MEDIUM' : (err <= 0.18 ? 'MEDIUM_LOW' : 'LOW');
        // This foundation intentionally returns a deterministic archetype-prior estimate. Full optimization will be added in the UI/runtime pass.
        var recipe = {};
        for (var i = 0; i < components.length; i++) {
            var key = components[i] && (components[i].key || components[i].name || ('component_' + (i + 1)));
            recipe[key] = Math.round(num(weights[i], 0) * 10) / 10;
        }
        return {
            schema_version: 'v5.3.76',
            record_type: 'reverse_recipe_estimate_preview',
            dish_type: dishType,
            estimated_recipe_g_per_100g: recipe,
            macro_check_by_estimated_recipe_per_100g: model,
            target_macros_per_100g: target,
            macro_error_score: Math.round(err * 10000) / 10000,
            confidence: confidence,
            qa_flags: err > 0.18 ? ['REVERSE_MODEL_REQUIRES_MANUAL_REVIEW'] : []
        };
    }
    function scaleCompositeChildren(children, oldRootGrams, newRootGrams) {
        var ratio = num(newRootGrams, 0) / Math.max(0.0001, num(oldRootGrams, 0));
        return (Array.isArray(children) ? children : []).map(function (child) {
            var clone = Object.assign({}, child || {});
            if (!clone.manual_locked)
                clone.grams = Math.round(num(clone.grams, 0) * ratio * 10) / 10;
            return clone;
        });
    }
    function flattenCompositeForCalculation(entries) {
        var out = [];
        function walk(entry, parentId) {
            if (!entry)
                return;
            if (entry.entry_type === 'composite_food' && Array.isArray(entry.children)) {
                entry.children.forEach(function (child) {
                    var clone = Object.assign({}, child, { parent_composite_id: entry.id || parentId || null });
                    walk(clone, entry.id || parentId || null);
                });
            }
            else {
                out.push(entry);
            }
        }
        (Array.isArray(entries) ? entries : []).forEach(function (e) { walk(e, null); });
        return out;
    }
    window.CompositeFoodDecomposerV5376 = {
        version: VERSION,
        classifyDishType: classifyDishType,
        estimateRecipe: estimateRecipe,
        scaleCompositeChildren: scaleCompositeChildren,
        flattenCompositeForCalculation: flattenCompositeForCalculation,
        getRegistry: getRegistry
    };
})();
