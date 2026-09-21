var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// nutrition calculator v5.3.190 — hosting and final cross-chain preparation diagnostics
(function () {
    'use strict';
    var VERSION = 'v5.3.210-p1.3_product_provenance_confidence', EXPECTED_PRODUCTS = 1105, EXPECTED_CHUNKS = 12, EXPECTED_COMPOSITES = 118;
    var PRODUCT_CHUNKS = Array.from({ length: 12 }, function (_, i) { return './data/products.v5.3.210-p1.3.part-' + String(i + 1).padStart(2, '0') + '.json?v=v5.3.210-p1.3'; });
    var REQUIRED_ASSETS=[
     './index.html','./assets/runtime/runtime-manifest-v5.3.210-p1.3.js?v=v5.3.210-p1.3','./assets/css/runtime-bundle-v5.3.210-p1.3.css?v=v5.3.210-p1.3',
     './assets/data/normative-registry.v5.3.210-p1.2.json?v=v5.3.210-p1.2','./assets/legacy/data/normative-registry.v5.3.210-p1.2.js?v=v5.3.210-p1.2',
 './data/products.v5.3.210-p1.3.manifest.json?v=v5.3.210-p1.3',
     './data/preparation-calculation-guard.v5.3.190.json?v=v5.3.190','./assets/data/preparation-calculation-guard.v5.3.190.js?v=v5.3.190',
     './data/preparation-family-registry.v5.3.190.json?v=v5.3.190','./assets/data/preparation-family-registry.v5.3.190.js?v=v5.3.190',
     './data/preparation-database-map.v5.3.190.json?v=v5.3.190','./data/preparation-final-cross-pass5.v5.3.190.json?v=v5.3.190',
     './assets/js/03-app-core-v5.3.208.js?v=5.3.210-p0.5','./assets/js/63-preparation-family-foundation-v5.js?v=v5.3.190',
     './assets/js/64-preparation-aware-gemini-matching-v5.js?v=v5.3.190','./assets/js/65-preparation-family-ui-v5.js?v=v5.3.190'
    ].concat(PRODUCT_CHUNKS);
    var NUMERIC_FIELDS = ["kcal", "sfa", "unsat", "added_sugar", "salt", "protein_per_100g", "fat_per_100g", "carbs_per_100g", "sugar_per_100g", "fiber_per_100g", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg", "potassium_mg", "sodium_mg", "zinc_mg", "copper_mg", "manganese_mg", "selenium_ug", "vitamin_a_mcg", "vitamin_e_mg", "vitamin_d_mcg", "vitamin_c_mg", "vitamin_b1_mg", "vitamin_b2_mg", "vitamin_b3_mg", "vitamin_b5_mg", "vitamin_b6_mg", "vitamin_b9_mcg", "vitamin_b12_mcg", "choline_mg", "vitamin_k_mcg", "fruit_cup_eq_per_100g", "whole_fruit_cup_eq_per_100g", "veg_cup_eq_per_100g", "greens_beans_cup_eq_per_100g", "dairy_cup_eq_per_100g", "whole_grain_oz_eq_per_100g", "refined_grain_oz_eq_per_100g", "protein_oz_eq_per_100g", "seafood_plant_oz_eq_per_100g", "added_sugars_tsp_eq_per_100g"];
    function R(name, pass, detail, severity) { return { name: name, pass: !!pass, detail: String(detail == null ? '' : detail), severity: severity || (pass ? 'pass' : 'fail') }; }
    function jsn(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok)
        throw Error('HTTP ' + r.status + ' ' + url); return r.json(); }); }
    function txt(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok)
        throw Error('HTTP ' + r.status + ' ' + url); return r.text(); }); }
    function products() { return window.DB && Array.isArray(window.DB.items) ? window.DB.items : []; }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function loadChunks(urls) {
        return __awaiter(this, void 0, void 0, function* () { var all = []; for (var i = 0; i < urls.length; i++) {
            var a = yield jsn(urls[i]);
            if (!Array.isArray(a))
                throw Error('chunk ' + (i + 1) + ' not array');
            all = all.concat(a);
        } return all; });
    }
    function summarize(rs) { return { total: rs.length, pass: rs.filter(function (x) { return x.pass && x.severity !== 'warn'; }).length, warn: rs.filter(function (x) { return x.severity === 'warn'; }).length, fail: rs.filter(function (x) { return !x.pass && x.severity !== 'warn'; }).length }; }
    function runHostingSelfTest() {
        return __awaiter(this, void 0, void 0, function* () {
            var o = [];
            o.push(R('Версия self-test', VERSION.indexOf('v5.3.210-p1.3') === 0, VERSION));
            try {
                var ps = products(), uniq = new Set(ps.map(function (p) { return p && p.key; })), by = new Map(ps.map(function (p) { return [p.key, p]; }));
                o.push(R('Runtime: 1105 продуктов', ps.length === EXPECTED_PRODUCTS, String(ps.length)));
                o.push(R('Runtime: ключи уникальны', uniq.size === ps.length, String(uniq.size)));
                o.push(R('Runtime meta: v5.3.210-p1.3 / 12 частей', !!(window.__PRODUCTS_META__ && String(window.__PRODUCTS_META__.app_version || '').indexOf('v5.3.210-p1.3') === 0 && Number(window.__PRODUCTS_META__.products_count) === EXPECTED_PRODUCTS && Number(window.__PRODUCTS_META__.chunk_count) === EXPECTED_CHUNKS), JSON.stringify(window.__PRODUCTS_META__ || {})));
                o.push(R('Составные модели сохранены', ps.filter(function (p) { return p && p.composite_food_model_latest; }).length === EXPECTED_COMPOSITES, String(ps.filter(function (p) { return p && p.composite_food_model_latest; }).length)));
                var disabledMembers = (window.__PREPARATION_FAMILY_REGISTRY_V53190__ && Array.isArray(window.__PREPARATION_FAMILY_REGISTRY_V53190__.families) ? window.__PREPARATION_FAMILY_REGISTRY_V53190__.families : []).reduce(function (acc, f) { return acc.concat((f.members || []).filter(function (m) { return m.selectable === false; })); }, []);
                var disabledVisible = disabledMembers.filter(function (m) { var p = by.get(m.product_key); return !p || p.hidden_from_search !== true; });
                o.push(R('23 отключённые карточки семейного реестра скрыты', disabledMembers.length === 23 && disabledVisible.length === 0, String(disabledMembers.length) + (disabledVisible.length ? ' · не скрыты: ' + disabledVisible.map(function (m) { return m.product_key; }).join(', ') : '')));
                var selectableMembers = (window.__PREPARATION_FAMILY_REGISTRY_V53190__ && Array.isArray(window.__PREPARATION_FAMILY_REGISTRY_V53190__.families) ? window.__PREPARATION_FAMILY_REGISTRY_V53190__.families : []).reduce(function (acc, f) { return acc.concat((f.members || []).filter(function (m) { return m.selectable !== false; })); }, []);
                var selectableHidden = selectableMembers.filter(function (m) { var p = by.get(m.product_key); return !p || p.hidden_from_search === true; });
                o.push(R('Все 257 выбираемых карточек семейного реестра доступны обычному поиску', selectableMembers.length === 257 && selectableHidden.length === 0, String(selectableMembers.length) + (selectableHidden.length ? ' · скрыты: ' + selectableHidden.map(function (m) { return m.product_key; }).join(', ') : '')));
                o.push(R('Расчётный рацион не содержит отключённых ключей', !!window.State && typeof window.State.get === 'function' && window.State.get().every(function (x) { return !x || !x.key || !by.get(x.key) || by.get(x.key).hidden_from_search !== true; }), window.State && window.State.get ? window.State.get().map(function (x) { return x.key; }).join(', ') : 'State отсутствует'));
            }
            catch (e) {
                o.push(R('Runtime database', false, e.message));
            }
            try {
                var guard = window.__PREPARATION_CALCULATION_GUARD_V53190__;
                o.push(R('Расчётный guard загружен: 20 перенаправлений / 3 блока', !!guard && Number(guard.redirect_count) === 20 && Number(guard.blocked_count) === 3, guard ? JSON.stringify({ redirects: guard.redirect_count, blocked: guard.blocked_count }) : 'guard отсутствует'));
                o.push(R('State публикует отчёт миграции', !!window.State && typeof window.State.getPreparationMigrationReport === 'function', window.State && window.State.getPreparationMigrationReport ? JSON.stringify(window.State.getPreparationMigrationReport()) : 'API отсутствует'));
            }
            catch (e) {
                o.push(R('Расчётный guard runtime', false, e.message));
            }
            try {
                var mf = yield jsn('./data/products.v5.3.210-p1.3.manifest.json?v=v5.3.210-p1.3'), fresh = yield loadChunks(PRODUCT_CHUNKS);
                o.push(R('Манифест v5.3.210-p1.3 согласован', mf.app_version === 'v5.3.210-p1.3' && mf.chunk_count === 12 && mf.products_count === 1105 && fresh.length === 1105, JSON.stringify({ manifest: mf.products_count, chunks: mf.chunk_count, total: fresh.length })));
            }
            catch (e) {
                o.push(R('Манифест v5.3.210-p1.3 согласован', false, e.message));
            }
            try {
                var reg = yield jsn('./data/preparation-family-registry.v5.3.190.json?v=v5.3.190'), ms = [];
                reg.families.forEach(function (f) { f.members.forEach(function (m) { ms.push({ family: f, member: m }); }); });
                var disabled = ms.filter(function (x) { return x.member.selectable === false; }), bad = disabled.filter(function (x) { return x.member.automatic_selection_policy !== 'disabled'; }), sigBad = [];
                reg.families.forEach(function (f) { var seen = {}; f.members.filter(function (m) { return m.selectable !== false; }).forEach(function (m) { var s = [m.preparation_method, m.added_fat_mode, m.skin_state, m.breading_state, m.drain_state, m.doneness_state, m.storage_state].join('|'); if (seen[s])
                    sigBad.push(f.food_family_id + ':' + seen[s] + '+' + m.product_key);
                else
                    seen[s] = m.product_key; }); });
                o.push(R('Реестр v5.3.190: 184/280/257', reg.version === 'v5.3.190' && reg.family_count === 184 && reg.member_count === 280 && reg.selectable_member_count === 257, JSON.stringify({ f: reg.family_count, m: reg.member_count, s: reg.selectable_member_count })));
                o.push(R('Реестр содержит 23 отключённых члена', disabled.length === 23, String(disabled.length)));
                o.push(R('Невыбираемые члены имеют политику disabled', bad.length === 0, bad.map(function (x) { return x.member.product_key; }).join(', ') || 'нарушений нет'));
                o.push(R('Нет дублирующих активных сигнатур', sigBad.length === 0, sigBad.join(', ') || 'нарушений нет'));
            }
            catch (e) {
                o.push(R('Реестр v5.3.190', false, e.message));
            }
            try {
                var api = window.NutritionPreparationFamilies, guardRuntime = window.__PREPARATION_CALCULATION_GUARD_V53190__, redirectKeys = Object.keys(guardRuntime.redirects || {}), blockedKeys = guardRuntime.blocked_keys || [];
                var redirectBad = redirectKeys.filter(function (k) { var x = api.resolveProductKey(k); return !x || x.status !== 'disabled_redirect' || !x.product || x.product.key !== guardRuntime.redirects[k]; });
                var blockBad = blockedKeys.filter(function (k) { var x = api.resolveProductKey(k); return !x || x.status !== 'disabled_unsupported' || x.product !== null; });
                o.push(R('Runtime API семейств здоров', api && api.isHealthy === true && api.familyCount === 184 && api.variantCount === 280, api ? JSON.stringify({ healthy: api.isHealthy, families: api.familyCount, variants: api.variantCount, errors: api.errors }) : 'API отсутствует'));
                o.push(R('Все 20 старых ключей ведут к каноническим карточкам', redirectBad.length === 0, redirectBad.join(', ') || '20/20'));
                o.push(R('Все 3 неподдерживаемых профиля заблокированы', blockBad.length === 0, blockBad.join(', ') || '3/3'));
            }
            catch (e) {
                o.push(R('Runtime redirect/block API', false, e.message));
            }
            try {
                var ui = window.NutritionPreparationFamilyUI, api2 = window.NutritionPreparationFamilies, plan = ui.selectionPlan(api2.getFamilyForProduct('rice_basmati'), 'rice_basmati', 'рис басмати');
                o.push(R('Одиночный manual-профиль требует доступного подтверждения', plan.key === 'rice_basmati' && plan.manualConfirmation === true && String(plan.message || '').length > 0, JSON.stringify({ key: plan.key, status: plan.status, manual: plan.manualConfirmation, message: plan.message })));
            }
            catch (e) {
                o.push(R('UI подтверждения одиночного профиля', false, e.message));
            }
            try {
                var matcher = window.NutritionPreparationMatching;
                var automatic = matcher.resolveRecognition({ food_family_id: 'buckwheat_groats', preparation_method: 'boiled', preparation_confidence: 1 }, 'гречка варёная');
                var manual = matcher.resolveRecognition({ food_family_id: 'white_rice_basmati', preparation_method: 'boiled', preparation_confidence: 1 }, 'рис басмати варёный');
                o.push(R('Matcher: точный автоматический профиль', automatic.status === 'exact' && automatic.exactKey === 'buckwheat_cooked' && automatic.requiresConfirmation === false, JSON.stringify({ status: automatic.status, key: automatic.exactKey, confirm: automatic.requiresConfirmation })));
                o.push(R('Matcher: приближённый профиль требует подтверждения', manual.status === 'exact_requires_confirmation' && manual.exactKey === 'rice_basmati' && manual.requiresConfirmation === true, JSON.stringify({ status: manual.status, key: manual.exactKey, confirm: manual.requiresConfirmation })));
            }
            catch (e) {
                o.push(R('Matcher способов приготовления', false, e.message));
            }
            try {
                var map = yield jsn('./data/preparation-database-map.v5.3.190.json?v=v5.3.190');
                o.push(R('Карта после проходов 1–5', map.rows.length === 1105 && map.summary.coverage_group_counts.existing_family === 280 && !map.summary.coverage_group_counts.requires_family && map.summary.pass5_completed === true && map.summary.pass5_safe_redirect_count === 20 && map.summary.pass5_unsupported_block_count === 3, JSON.stringify({ groups: map.summary.coverage_group_counts, pass5: map.summary.pass5_completed, redirects: map.summary.pass5_safe_redirect_count, blocked: map.summary.pass5_unsupported_block_count })));
            }
            catch (e) {
                o.push(R('Текущая карта', false, e.message));
            }
            try {
                var cross = yield jsn('./data/preparation-final-cross-pass5.v5.3.190.json?v=v5.3.190');
                o.push(R('Контракт пятого прохода полный', cross.version === 'v5.3.190' && cross.chain.length === 8 && cross.counts.safe_redirects === 20 && cross.counts.unsupported_blocks === 3 && cross.fixed_defects.length === 5 && Object.keys(cross.invariants || {}).every(function (k) { return cross.invariants[k] === true; }), JSON.stringify({ chain: cross.chain.length, defects: cross.fixed_defects.length, counts: cross.counts })));
            }
            catch (e) {
                o.push(R('Контракт пятого прохода', false, e.message));
            }
            try {
                var oldp = yield loadChunks(OLD_PRODUCT_CHUNKS), newp = yield loadChunks(PRODUCT_CHUNKS), oldBy = new Map(oldp.map(function (p) { return [p.key, p]; })), diff = [];
                newp.forEach(function (p) { var q = oldBy.get(p.key); if (!q) {
                    diff.push(p.key + ':missing_old');
                    return;
                } for (var i = 0; i < NUMERIC_FIELDS.length; i++) {
                    var f = NUMERIC_FIELDS[i];
                    if (p[f] !== q[f]) {
                        diff.push(p.key + ':' + f);
                        break;
                    }
                } });
                o.push(R('43 числовых поля у 1105 карточек не изменены', diff.length === 0, diff.slice(0, 8).join(', ') || '0 расхождений'));
            }
            catch (e) {
                o.push(R('Числовая сохранность v5.3.184→v5.3.190', false, e.message));
            }
            try {
                var prev = yield loadChunks(PREVIOUS_PRODUCT_CHUNKS), cur = yield loadChunks(PRODUCT_CHUNKS), orderSame = prev.length === cur.length && prev.every(function (p, i) { return p.key === cur[i].key; }), recordDiff = [];
                cur.forEach(function (p, i) { if (JSON.stringify(p) !== JSON.stringify(prev[i]))
                    recordDiff.push(p.key); });
                var expectedDiff = ['black_beans_boiled', 'black_beans_boiled_spp', 'chickpeas_boiled', 'chickpeas_boiled_spp', 'lentils_boiled', 'lentils_boiled_spp', 'shrimp_boiled', 'shrimp_boiled_spp'];
                var diffOk = recordDiff.slice().sort().join('|') === expectedDiff.slice().sort().join('|');
                o.push(R('Порядок базы сохранён; изменены только 8 записей поисковой идентичности', orderSame && diffOk, recordDiff.join(', ') || 'нет изменений'));
                var curBy = new Map(cur.map(function (p) { return [p.key, p]; })), pairs = { black_beans_boiled: 'black_beans_boiled_spp', chickpeas_boiled: 'chickpeas_boiled_spp', lentils_boiled: 'lentils_boiled_spp', shrimp_boiled: 'shrimp_boiled_spp' }, visibilityBad = [];
                Object.keys(pairs).forEach(function (k) { var active = curBy.get(k), legacy = curBy.get(pairs[k]); if (!active || active.hidden_from_search === true || active.alias_of)
                    visibilityBad.push(k); if (!legacy || legacy.hidden_from_search !== true || legacy.alias_of !== k)
                    visibilityBad.push(pairs[k]); });
                o.push(R('4 канонических профиля возвращены в поиск, 4 legacy-алиаса скрыты', visibilityBad.length === 0, visibilityBad.join(', ') || '8/8 согласованы'));
            }
            catch (e) {
                o.push(R('Полная сохранность базы v5.3.189→v5.3.190', false, e.message));
            }
            try {
                var core = yield txt('./assets/js/03-app-core.js?v=v5.3.190');
                o.push(R('State.add использует единый redirect/block guard', core.indexOf("resolveRuntimePreparationKey(key, 'State.add')") >= 0 && core.indexOf("decision.status === 'blocked'") >= 0 && core.indexOf('normalizeStoredPreparationEntry') >= 0, 'guard найден в State.add, загрузке и составных позициях'));
                o.push(R('Составные дочерние позиции проходят тот же guard', core.indexOf("resolveRuntimePreparationKey(productKey, 'State.addCompositeChild')") >= 0 && core.indexOf("resolveRuntimePreparationKey(productKey, 'State.replaceCompositeChild')") >= 0, 'add/replace защищены'));
            }
            catch (e) {
                o.push(R('Статический guard State', false, e.message));
            }
            for (var i = 0; i < REQUIRED_ASSETS.length; i++) {
                try {
                    var r = yield fetch(REQUIRED_ASSETS[i], { cache: 'no-store' });
                    if (!r.ok)
                        throw Error('HTTP ' + r.status);
                    var b = yield r.arrayBuffer();
                    o.push(R('Файл доступен: ' + REQUIRED_ASSETS[i], b.byteLength > 0, b.byteLength + ' байт'));
                }
                catch (e) {
                    o.push(R('Файл доступен: ' + REQUIRED_ASSETS[i], false, e.message));
                }
            }
            window.__HOSTING_SELFTEST_RESULTS__ = o;
            return o;
        });
    }
    function render(rs) { var old = document.getElementById('hostingSelfTestPanel'); if (old)
        old.remove(); var s = summarize(rs), p = document.createElement('aside'); p.id = 'hostingSelfTestPanel'; p.className = 'hosting-test-panel'; p.innerHTML = '<header><h2>Проверка хостинга v5.3.190</h2><button class="hosting-test-close" type="button">Закрыть</button></header><div class="hosting-test-body"><div class="hosting-test-summary"><div class="hosting-test-metric"><strong>' + s.pass + '</strong><span>пройдено</span></div><div class="hosting-test-metric"><strong>' + s.warn + '</strong><span>предупреждения</span></div><div class="hosting-test-metric"><strong>' + s.fail + '</strong><span>ошибки</span></div></div><div class="hosting-test-actions"><button class="primary" type="button" data-run>Повторить проверку</button></div><div class="hosting-test-list">' + rs.map(function (r) { var c = r.severity === 'warn' ? 'warn' : (r.pass ? 'pass' : 'fail'); return '<div class="hosting-test-row ' + c + '"><div class="hosting-test-dot"></div><div><div class="hosting-test-row-title">' + esc((r.pass ? '✓ ' : '× ') + r.name) + '</div><div class="hosting-test-row-detail">' + esc(r.detail) + '</div></div></div>'; }).join('') + '</div></div>'; document.body.appendChild(p); p.querySelector('.hosting-test-close').onclick = function () { p.remove(); }; p.querySelector('[data-run]').onclick = runAndRender; p.dataset.pass = String(s.pass); p.dataset.fail = String(s.fail); p.dataset.total = String(s.total); }
    function runAndRender() {
        return __awaiter(this, void 0, void 0, function* () { var rs = yield runHostingSelfTest(); render(rs); return rs; });
    }
    window.runHostingSelfTest = runHostingSelfTest;
    window.runHostingSelfTestAndRender = runAndRender;
    if (new URLSearchParams(location.search).get('selftest') === '1') {
        if (document.readyState === 'loading')
            document.addEventListener('DOMContentLoaded', function () { setTimeout(runAndRender, 400); }, { once: true });
        else
            setTimeout(runAndRender, 400);
    }
})();
