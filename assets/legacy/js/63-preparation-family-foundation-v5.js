// nutrition calculator v5.3.190 — final preparation family foundation
// Preserves non-enumerable metadata while enabling the reviewed family UI and matching layers.
(function () {
    'use strict';
    var VERSION = 'v5.3.190_preparation_final_cross_chain';
    var registry = window.__PREPARATION_FAMILY_REGISTRY_V53190__;
    var errors = [];
    function norm(value) {
        var s = String(value == null ? '' : value).toLowerCase().replace(/ё/g, 'е');
        try {
            s = s.replace(/[^\p{L}\p{N}]+/gu, ' ');
        }
        catch (_) {
            s = s.replace(/[^a-zа-я0-9]+/g, ' ');
        }
        return s.replace(/\s+/g, ' ').trim();
    }
    function deepFreeze(value, seen) {
        if (!value || (typeof value !== 'object' && typeof value !== 'function'))
            return value;
        seen = seen || new Set();
        if (seen.has(value))
            return value;
        seen.add(value);
        Object.getOwnPropertyNames(value).forEach(function (k) { try {
            deepFreeze(value[k], seen);
        }
        catch (_) { } });
        try {
            return Object.freeze(value);
        }
        catch (_) {
            return value;
        }
    }
    function invariant(condition, message) { if (!condition)
        errors.push(message); return !!condition; }
    function defineMeta(target, key, value, productKey) {
        if (!target || value === undefined)
            return false;
        try {
            Object.defineProperty(target, key, { value: value, writable: false, configurable: false, enumerable: false });
            return true;
        }
        catch (err) {
            errors.push('metadata_attach_failed:' + String(productKey || 'unknown') + ':' + key);
            return false;
        }
    }
    function phraseContained(query, alias) {
        if (!query || !alias)
            return false;
        return (' ' + query + ' ').indexOf(' ' + alias + ' ') >= 0;
    }
    function frozenResult(value) { try {
        return Object.freeze(value);
    }
    catch (_) {
        return value;
    } }
    var existingFlags = (window.NutritionFeatureFlags && typeof window.NutritionFeatureFlags === 'object') ? window.NutritionFeatureFlags : {};
    var flags = Object.assign({}, existingFlags, {
        preparation_families_enabled: true,
        preparation_family_metadata_enabled: true,
        preparation_family_ui_enabled: true,
        preparation_family_matching_enabled: true,
        preparation_family_gemini_enabled: true
    });
    window.NutritionFeatureFlags = deepFreeze(flags);
    invariant(registry && typeof registry === 'object', 'registry_missing');
    invariant(registry && registry.schema === 'preparation-family-registry-v4', 'registry_schema_invalid');
    invariant(registry && registry.contract_version === 'v5.3.190', 'registry_contract_version_invalid');
    invariant(window.DB && Array.isArray(window.DB.items) && window.DB.byKey, 'runtime_database_missing');
    var familyById = new Map();
    var variantByKey = new Map();
    var aliasEntries = [];
    var attachedCount = 0;
    var snapshots = {};
    var enumSets = {};
    var enumFields = ['preparation_method', 'weight_basis', 'added_fat_mode', 'skin_state', 'breading_state', 'drain_state', 'doneness_state', 'storage_state', 'data_origin', 'variant_status', 'nutritional_process_class', 'nutrition_effect_mode', 'automatic_selection_policy'];
    if (registry && registry.enums) {
        enumFields.forEach(function (field) { enumSets[field] = new Set(Array.isArray(registry.enums[field]) ? registry.enums[field] : []); });
    }
    function addAlias(alias, fid) {
        var key = norm(alias);
        if (!key)
            return;
        invariant(key.length >= 3, 'alias_too_short:' + fid + ':' + key);
        aliasEntries.push({ alias: key, familyId: fid });
    }
    if (registry && Array.isArray(registry.families)) {
        registry.families.forEach(function (family) {
            if (!family || !family.food_family_id)
                return;
            var fid = family.food_family_id;
            invariant(!familyById.has(fid), 'duplicate_family_id:' + fid);
            familyById.set(fid, family);
            addAlias(family.family_display_name_ru, fid);
            (family.aliases_ru || []).forEach(function (a) { addAlias(a, fid); });
            var memberKeys = new Set((family.members || []).map(function (v) { return v.product_key; }));
            invariant(memberKeys.has(family.reference_variant_key), 'reference_variant_missing:' + fid + ':' + family.reference_variant_key);
            var activeSignatures = new Map();
            (family.members || []).forEach(function (variant) {
                var key = variant && variant.product_key;
                if (!key)
                    return;
                invariant(!variantByKey.has(key), 'product_in_multiple_families:' + key);
                enumFields.forEach(function (field) {
                    invariant(enumSets[field] && enumSets[field].has(variant[field]), 'enum_invalid:' + key + ':' + field + ':' + variant[field]);
                });
                if (variant.base_variant_key)
                    invariant(memberKeys.has(variant.base_variant_key), 'base_variant_outside_family:' + key);
                if (variant.legacy_equivalent_of)
                    invariant(memberKeys.has(variant.legacy_equivalent_of), 'legacy_equivalent_outside_family:' + key);
                var product = window.DB && window.DB.byKey ? window.DB.byKey.get(key) : null;
                invariant(!!product, 'family_product_missing:' + key);
                invariant(variant.complete_nutrient_profile === true, 'family_product_nutrients_incomplete:' + key);
                invariant(variant.complete_hei_profile === true, 'family_product_hei_incomplete:' + key);
                if (!product)
                    return;
                snapshots[key] = { json: JSON.stringify(product), keys: Object.keys(product).slice().sort() };
                var signature = [variant.preparation_method, variant.added_fat_mode, variant.skin_state, variant.breading_state, variant.drain_state, variant.doneness_state, variant.storage_state].join('|');
                if (variant.selectable !== false) {
                    invariant(!activeSignatures.has(signature), 'duplicate_active_variant_signature:' + fid + ':' + signature);
                    activeSignatures.set(signature, key);
                }
                variantByKey.set(key, { family: family, variant: variant, product: product, signature: signature });
                var metadata = {
                    food_family_id: fid,
                    preparation_method: variant.preparation_method,
                    weight_basis: variant.weight_basis,
                    added_fat_mode: variant.added_fat_mode,
                    skin_state: variant.skin_state,
                    breading_state: variant.breading_state,
                    drain_state: variant.drain_state,
                    doneness_state: variant.doneness_state,
                    storage_state: variant.storage_state,
                    preparation_data_origin: variant.data_origin,
                    preparation_variant_status: variant.variant_status,
                    preparation_variant_selectable: variant.selectable !== false,
                    preparation_legacy_equivalent_of: variant.legacy_equivalent_of || null,
                    nutritional_process_class: variant.nutritional_process_class,
                    nutrition_effect_mode: variant.nutrition_effect_mode,
                    automatic_selection_policy: variant.automatic_selection_policy,
                    preparation_auto_select_allowed: variant.auto_select_allowed === true,
                    preparation_calculation_profile_key: variant.calculation_profile_key || key,
                    preparation_nutritional_alias_of: variant.nutritional_alias_of || null,
                    preparation_effect_dimensions: variant.nutritional_effect_dimensions || [],
                    preparation_effect_summary_ru: variant.nutritional_effect_summary_ru || '',
                    preparation_family_version: 'v5.3.190'
                };
                Object.keys(metadata).forEach(function (metaKey) { defineMeta(product, metaKey, metadata[metaKey], key); });
                attachedCount++;
            });
        });
    }
    Object.keys(snapshots).forEach(function (key) {
        var product = window.DB.byKey.get(key), before = snapshots[key];
        invariant(JSON.stringify(Object.keys(product).slice().sort()) === JSON.stringify(before.keys), 'enumerable_product_shape_changed:' + key);
        invariant(JSON.stringify(product) === before.json, 'enumerable_product_data_changed:' + key);
        ['food_family_id', 'preparation_method', 'weight_basis', 'added_fat_mode'].forEach(function (metaKey) {
            var desc = Object.getOwnPropertyDescriptor(product, metaKey);
            invariant(!!desc && desc.enumerable === false && desc.writable === false && desc.configurable === false, 'metadata_descriptor_invalid:' + key + ':' + metaKey);
        });
    });
    invariant(familyById.size === Number(registry.family_count), 'family_count_mismatch');
    invariant(variantByKey.size === Number(registry.member_count), 'member_count_mismatch');
    invariant(attachedCount === Number(registry.member_count), 'attached_count_mismatch');
    // Freeze registry only after validation and index construction.
    deepFreeze(registry);
    aliasEntries = deepFreeze(aliasEntries.slice());
    function getFamily(id) { return familyById.get(String(id || '')) || null; }
    function getVariantMeta(productKey) { var hit = variantByKey.get(String(productKey || '')); return hit ? hit.variant : null; }
    function getFamilyForProduct(productKey) { var hit = variantByKey.get(String(productKey || '')); return hit ? hit.family : null; }
    function listVariants(familyId, options) {
        var family = getFamily(familyId);
        if (!family)
            return frozenResult([]);
        options = options || {};
        return frozenResult((family.members || []).filter(function (v) { return options.includeLegacy === true || v.selectable !== false; }).map(function (v) {
            return frozenResult({ product: window.DB.byKey.get(v.product_key) || null, meta: v });
        }));
    }
    function resolveFamilyCandidates(text) {
        var q = norm(text);
        if (q.length < 3)
            return frozenResult([]);
        var byFamily = new Map();
        aliasEntries.forEach(function (entry) {
            var quality = '';
            if (q === entry.alias)
                quality = 'exact_alias';
            else if (phraseContained(q, entry.alias))
                quality = 'contained_phrase';
            if (!quality)
                return;
            var score = quality === 'exact_alias' ? 100 : 80;
            var prev = byFamily.get(entry.familyId);
            if (!prev || score > prev.score)
                byFamily.set(entry.familyId, { family: getFamily(entry.familyId), score: score, quality: quality, alias: entry.alias });
        });
        return frozenResult(Array.from(byFamily.values()).sort(function (a, b) { return b.score - a.score || String(a.family.food_family_id).localeCompare(String(b.family.food_family_id)); }));
    }
    function familiesByAlias(text) { return frozenResult(resolveFamilyCandidates(text).map(function (x) { return x.family; })); }
    function acceptedMethods(meta) {
        var rows = meta && Array.isArray(meta.accepted_preparation_methods) ? meta.accepted_preparation_methods : [];
        if (!rows.length && meta && meta.preparation_method)
            rows = [meta.preparation_method];
        return rows;
    }
    function fieldMatches(field, actual, wanted, meta) {
        if (wanted == null || wanted === '' || wanted === 'unspecified' || wanted === 'unknown')
            return true;
        if (field === 'preparation_method') {
            var accepted = acceptedMethods(meta);
            if (wanted === 'fried_unspecified')
                return accepted.some(function (x) { return x === 'fried_unspecified' || x === 'pan_fried' || x === 'deep_fried'; });
            return accepted.indexOf(wanted) >= 0;
        }
        return actual === wanted;
    }
    function constraintMatch(meta, constraints, allowMethodClass) {
        constraints = constraints || {};
        var fields = ['preparation_method', 'added_fat_mode', 'skin_state', 'breading_state', 'drain_state', 'doneness_state', 'storage_state', 'weight_basis'];
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i], wanted = constraints[field];
            if (field === 'preparation_method' && wanted === 'fried_unspecified' && !allowMethodClass) {
                if (acceptedMethods(meta).indexOf(wanted) < 0)
                    return false;
                continue;
            }
            if (!fieldMatches(field, meta[field], wanted, meta))
                return false;
        }
        return true;
    }
    function resolveExactVariant(familyId, constraints) {
        var variants = listVariants(familyId);
        var exact = variants.filter(function (x) { return x.product && constraintMatch(x.meta, constraints, false); });
        if (exact.length === 1) {
            var one = exact[0], policy = one.meta.automatic_selection_policy || 'automatic', mode = one.meta.nutrition_effect_mode || 'exact_variant';
            if (policy === 'disabled' || mode === 'unsupported')
                return frozenResult({ status: 'not_found', product: null, meta: null, candidates: [], requiresConfirmation: true, reason: 'nutritional_effect_unsupported' });
            if (policy !== 'automatic')
                return frozenResult({ status: 'exact_requires_confirmation', product: one.product, meta: one.meta, candidates: exact, requiresConfirmation: true, reason: 'nutritional_effect_confirmation_required' });
            return frozenResult({ status: 'exact', product: one.product, meta: one.meta, candidates: exact });
        }
        if (exact.length > 1)
            return frozenResult({ status: 'ambiguous', product: null, meta: null, candidates: exact });
        var wanted = constraints && constraints.preparation_method;
        if (wanted === 'fried_unspecified') {
            var compatible = variants.filter(function (x) { return x.product && constraintMatch(x.meta, constraints, true); });
            if (compatible.length === 1)
                return frozenResult({ status: 'compatible_method_class', product: compatible[0].product, meta: compatible[0].meta, candidates: compatible, requiresConfirmation: true });
            if (compatible.length > 1)
                return frozenResult({ status: 'ambiguous', product: null, meta: null, candidates: compatible, requiresConfirmation: true });
        }
        return frozenResult({ status: 'not_found', product: null, meta: null, candidates: [] });
    }
    function resolveProductKey(key) {
        var hit = variantByKey.get(String(key || ''));
        if (!hit)
            return frozenResult({ status: 'unmanaged', product: window.DB.byKey.get(String(key || '')) || null, meta: null, family: null });
        var disabled = hit.variant.selectable === false || hit.variant.automatic_selection_policy === 'disabled' || hit.variant.nutrition_effect_mode === 'unsupported';
        if (disabled) {
            var target = hit.variant.calculation_profile_key || hit.variant.legacy_equivalent_of || '';
            if (target && target !== hit.variant.product_key) {
                var canonical = window.DB.byKey.get(target) || null, canonicalHit = variantByKey.get(target);
                if (canonical && canonicalHit && canonicalHit.variant.selectable !== false && canonicalHit.variant.automatic_selection_policy !== 'disabled' && canonicalHit.variant.nutrition_effect_mode !== 'unsupported')
                    return frozenResult({ status: 'disabled_redirect', product: canonical, requestedProduct: hit.product, meta: hit.variant, family: hit.family, calculationKey: target });
            }
            return frozenResult({ status: 'disabled_unsupported', product: null, requestedProduct: hit.product, meta: hit.variant, family: hit.family, calculationKey: '' });
        }
        if (hit.variant.legacy_equivalent_of) {
            var canonical = window.DB.byKey.get(hit.variant.legacy_equivalent_of) || null;
            return frozenResult({ status: 'legacy_equivalent', product: canonical || hit.product, requestedProduct: hit.product, meta: hit.variant, family: hit.family, calculationKey: hit.variant.legacy_equivalent_of });
        }
        return frozenResult({ status: 'exact_key', product: hit.product, meta: hit.variant, family: hit.family, calculationKey: hit.variant.product_key });
    }
    var api = {
        version: VERSION,
        enabled: true,
        metadataEnabled: true,
        uiEnabled: true,
        matchingEnabled: true,
        geminiEnabled: true,
        registry: registry,
        familyCount: familyById.size,
        variantCount: variantByKey.size,
        attachedCount: attachedCount,
        errors: deepFreeze(errors.slice()),
        isHealthy: errors.length === 0,
        isEnabled: function () { return true; },
        isMetadataEnabled: function () { return true; },
        normalizeText: norm,
        getFamily: getFamily,
        getVariantMeta: getVariantMeta,
        getFamilyForProduct: getFamilyForProduct,
        listVariants: listVariants,
        resolveFamilyCandidates: resolveFamilyCandidates,
        familiesByAlias: familiesByAlias,
        resolveExactVariant: resolveExactVariant,
        resolveProductKey: resolveProductKey,
        acceptedMethods: acceptedMethods,
        getNutritionalImpact: function (productKey) { var meta = getVariantMeta(productKey); return meta ? frozenResult({ nutritional_process_class: meta.nutritional_process_class, nutrition_effect_mode: meta.nutrition_effect_mode, automatic_selection_policy: meta.automatic_selection_policy, calculation_profile_key: meta.calculation_profile_key, nutritional_alias_of: meta.nutritional_alias_of, effect_dimensions: meta.nutritional_effect_dimensions || [], summary_ru: meta.nutritional_effect_summary_ru || '', weight_basis: meta.weight_basis, added_fat_mode: meta.added_fat_mode }) : null; }
    };
    window.NutritionPreparationFamilies = deepFreeze(api);
    // Compatibility facade for any code written against pass 1.
    window.NutritionPreparationFoundationV53166 = deepFreeze({
        version: 'v5.3.166_compat_v5.3.190',
        enabled: true,
        contractUrl: './data/preparation-family-contract.v5.3.190.json',
        migrationManifestUrl: './data/preparation-family-migration-manifest.v5.3.190.json',
        invariants: registry.invariants,
        isEnabled: function () { return true; },
        api: window.NutritionPreparationFamilies
    });
    try {
        window.dispatchEvent(new CustomEvent('nutrition:preparationfamilyready', { detail: { version: VERSION, families: familyById.size, variants: variantByKey.size, errors: errors.slice() } }));
    }
    catch (_) { }
})();
