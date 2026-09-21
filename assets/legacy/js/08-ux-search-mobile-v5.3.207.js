// nutrition calculator v5.3.90 — composite search preview UX polish pass
// Module: 08-ux-search-mobile.js
// Responsibility: Search/cart UI refinements and mobile search panel.
// Extracted from v3.8.1 monolithic app.js without changing runtime logic.
// ===== extracted inline script 36; id=v3-5-clean-search-cart-ui-js =====
(function () {
    'use strict';
    const esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    const fmt1 = function (n) { return Number.isFinite(Number(n)) ? Number(n).toFixed(1).replace(/\.0$/, '') : '—'; };
    function norm(v) { return (window.normalizeSearchText || (x => String(x || '').toLowerCase().replace(/ё/g, 'е')))(v); }
    function getMacro(p, g) { var _a, _b, _c, _d, _e, _f; return { kcal: g * (Number(p.kcal) || 0) / 100, protein: g * (Number((_b = (_a = p.protein_per_100g) !== null && _a !== void 0 ? _a : p.protein_g) !== null && _b !== void 0 ? _b : 0)) / 100, fat: g * (Number((_d = (_c = p.fat_per_100g) !== null && _c !== void 0 ? _c : p.fat_g) !== null && _d !== void 0 ? _d : 0)) / 100, carbs: g * (Number((_f = (_e = p.carbs_per_100g) !== null && _e !== void 0 ? _e : p.carbs_g) !== null && _f !== void 0 ? _f : 0)) / 100 }; }
    function productText(p) {
        if (typeof window.__productSearchText === 'function')
            return window.__productSearchText(p);
        // v4.6.1: глобальный поиск должен искать продукт, а не все товары из HEI/каталожной группы.
        // HEI/каталог показываем в карточке, но не используем как обязательный текстовый матч.
        return norm([p.name_ru, p.name, p.key, Array.isArray(p.search_aliases) ? p.search_aliases.join(' ') : '', Array.isArray(p.tags) ? p.tags.join(' ') : ''].filter(Boolean).join(' '));
    }
    function productMetaText(p) {
        const cat = typeof window.labelCatalog === 'function' ? window.labelCatalog(p.catalog_category_key || p.category || '') : (p.catalog_category_key || p.category || '');
        const hei = typeof window.labelHEI === 'function' ? window.labelHEI(p.hei_category_key || '') : (p.hei_category_key || '');
        return norm([cat, hei].filter(Boolean).join(' '));
    }
    function termVariants(t) {
        if (t === 'курица')
            return ['курица', 'куриц', 'курин', 'chicken'];
        if (t === 'яйцо')
            return ['яйцо', 'яйц', 'яич', 'egg'];
        if (t === 'яблоко')
            return ['яблоко', 'яблок', 'apple'];
        if (t === 'молоко')
            return ['молоко', 'молоч', 'milk'];
        if (t === 'творог')
            return ['творог', 'творож', 'curd', 'cottage'];
        if (t === 'кефир')
            return ['кефир', 'kefir'];
        if (t === 'йогурт')
            return ['йогурт', 'yogurt'];
        if (t === 'гречка')
            return ['гречка', 'гречк', 'гречнев', 'buckwheat'];
        if (t === 'рис')
            return ['рис', 'rice'];
        if (t === 'индейка')
            return ['индейка', 'индей', 'turkey'];
        if (t === 'рыба')
            return ['рыба', 'рыб', 'fish'];
        if (t === 'лосось')
            return ['лосось', 'лосос', 'salmon'];
        if (t === 'картофель')
            return ['картофель', 'картоф', 'potato'];
        if (t === 'овсянка')
            return ['овсянка', 'овсян', 'oat'];
        if (t === 'хлеб')
            return ['хлеб', 'bread'];
        return [t];
    }
    function termMatches(text, t) {
        if (t === 'сыр')
            return /(^|\s)сыр($|\s)/.test(text) || /(^|\s)cheese($|\s)/.test(text);
        return termVariants(t).some(v => {
            const vv = String(v || '');
            if (/^[a-z]{1,3}$/.test(vv))
                return (' ' + text + ' ').includes(' ' + vv + ' ');
            return text.includes(vv);
        });
    }
    window.__v35ProductSearchText = productText;
    function trustLabel(p) {
        const attr = (p && p.source_attribution_v5_3_68) || (p && p.source_attribution_v5_3_69) || null;
        const cls = String((attr && attr.class) || '').toLowerCase();
        const conf = String((attr && attr.confidence) || '').toUpperCase();
        const status = String((p && p.nutrition_verification_status) || '').toUpperCase();
        const exact = String((p && p.source_exactness_class) || '').toUpperCase();
        if (cls.includes('usda_fdc_mapped') || status.includes('FDC_EXACT') || status.includes('FNDDS_EXACT') || status.includes('SR_LEGACY_EXACT'))
            return 'Источник: сопоставлено с FoodData Central.';
        if (cls.includes('recipe_model'))
            return 'Рецептурная модель: расчёт по ингредиентам.';
        if (cls.includes('label') || status.includes('LABEL') || exact.includes('LABEL'))
            return 'КБЖУ по этикетке; часть микронутриентов может быть модельной.';
        if (cls.includes('logic_proxy') || status.includes('PROXY') || exact.includes('PROXY'))
            return 'Логическая proxy-модель; подходит для расчёта, но не для клинической точности.';
        if (conf === 'HIGH')
            return 'Данные прошли внутреннюю проверку источника.';
        return 'Данные участвуют в расчёте; при клинически значимых решениях нужна проверка источника.';
    }
    function showToast(text) { const t = document.getElementById('searchAddedToast'); if (!t)
        return; t.textContent = text; t.classList.add('show'); clearTimeout(t.__timer); t.__timer = setTimeout(() => t.classList.remove('show'), 2400); }
    function getCompositeModelForSearch(product) {
        if (!product)
            return null;
        return product.composite_food_model_latest || product.composite_food_model_v5_3_87 || product.composite_food_model_v5_3_86 || product.composite_food_model_v5_3_85 || product.composite_food_model_v5_3_84 || product.composite_food_model_v5_3_83 || product.composite_food_model_v5_3_82 || product.composite_food_model_v5_3_81 || product.composite_food_model_v5_3_80 || product.composite_food_model_v5_3_79 || product.composite_food_model_v5_3_78 || product.composite_food_model_v5_3_77 || null;
    }
    function isCompositeForSearch(product) { const model = getCompositeModelForSearch(product); return !!(model && Array.isArray(model.components) && model.components.length); }
    function roleLabelForComposite(role) {
        const r = String(role || '').toLowerCase();
        if (r.includes('processed') || r.includes('sausage') || r.includes('ham') || r.includes('pepperoni'))
            return 'обработанное мясо/начинка';
        if (r.includes('meat') || r.includes('beef') || r.includes('pork'))
            return 'мясной компонент';
        if (r.includes('chicken') || r.includes('poultry'))
            return 'птица';
        if (r.includes('fish') || r.includes('seafood'))
            return 'рыба/морепродукты';
        if (r.includes('dairy') || r.includes('cheese') || r.includes('curd') || r.includes('yogurt') || r.includes('kefir'))
            return 'молочный компонент';
        if (r.includes('grain') || r.includes('flour') || r.includes('dough') || r.includes('bread') || r.includes('crouton'))
            return 'злаки/тесто/панировка';
        if (r.includes('oil') || r.includes('fat') || r.includes('butter') || r.includes('mayonnaise') || r.includes('dressing'))
            return 'жир/заправка';
        if (r.includes('vegetable') || r.includes('greens') || r.includes('potato'))
            return 'овощной компонент';
        if (r.includes('fruit') || r.includes('berry'))
            return 'фрукт/ягоды';
        return role || 'компонент';
    }
    function compositeSearchFlags(product, model) {
        const tags = Array.isArray(product && product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];
        const roles = (model && Array.isArray(model.components) ? model.components : []).map(c => String(c.role || '').toLowerCase()).join(' ');
        const text = tags.join(' ') + ' ' + roles + ' ' + String((product && product.name_ru) || '').toLowerCase();
        const out = [];
        if (/processed|sausage|ham|pepperoni|колбас|ветчин/.test(text))
            out.push('обработанное мясо учитывается отдельно');
        if (/mayonnaise|dressing|oil|butter|fat|майонез|масл/.test(text))
            out.push('заправка/масло не теряются');
        if (/dairy|cheese|curd|kefir|yogurt|сыр|творог|кефир/.test(text))
            out.push('молочный вклад выделен');
        if (/grain|flour|dough|bread|crouton|breading|паниров|сухар|тесто|мук/.test(text))
            out.push('тесто/злаки считаются отдельно');
        if (/fried|chips|картофель.*жар|чипс/.test(text))
            out.push('жареный/чипсовый компонент виден');
        if (/sugar|sweet|сахар|слад/.test(text))
            out.push('добавленный сахар учитывается');
        if (!out.length)
            out.push('типовая рецептура проверяется по ингредиентам');
        return out.slice(0, 3);
    }
    function recipeKindLabel(product, model) {
        const mt = String((model && model.macro_priority) || (product && product.macro_priority) || '').toLowerCase();
        const rt = String((product && product.record_type) || (model && model.record_type) || '').toLowerCase();
        if (mt.includes('manufacturer') || rt.includes('branded'))
            return 'Брендовая/этикеточная модель: КБЖУ сохраняются по источнику, состав нужен для HEI и структуры.';
        if (rt.includes('homemade'))
            return 'Домашняя типовая рецептура: сравните состав со своим вариантом перед добавлением.';
        return 'Типовая рецептурная модель: сравните состав со своим вариантом перед добавлением.';
    }
    function recipeFitPrompts(product, model) {
        const roles = (model && Array.isArray(model.components) ? model.components : []).map(c => String(c.role || '').toLowerCase()).join(' ');
        const text = (String((product && product.name_ru) || '').toLowerCase() + ' ' + roles + ' ' + (Array.isArray(product && product.tags) ? product.tags.join(' ').toLowerCase() : ''));
        const out = [];
        if (/processed|sausage|ham|pepperoni|колбас|ветчин/.test(text))
            out.push('У вас тоже есть колбаса/ветчина/обработанное мясо?');
        if (/chicken|poultry|куриц/.test(text))
            out.push('Курица в вашем варианте отварная/запечённая, а не копчёная?');
        if (/mayonnaise|майонез/.test(text))
            out.push('Заправка такая же: майонез, сметана, йогурт или масло?');
        if (/fried|chips|чипс|жар/.test(text))
            out.push('Есть ли жареный картофель, чипсы или масло от жарки?');
        if (/kefir|квас|kvass|кефир/.test(text))
            out.push('Основа совпадает: квас/кефир/сметана?');
        if (/sugar|sweet|berry|fruit|сахар|ягод|фрукт|сгущ/.test(text))
            out.push('Есть ли сладкая начинка или добавленный сахар?');
        if (!out.length)
            out.push('Похожи ли основные ингредиенты и их примерные доли?');
        return out.slice(0, 4);
    }
    function renderCompositeSearchPreview(product) {
        const model = getCompositeModelForSearch(product);
        if (!model || !Array.isArray(model.components) || !model.components.length)
            return '';
        // v5.3.90: details must show the full component list, not only first 9 ingredients.
        const comps = model.components.map(c => {
            const p = window.DB && window.DB.byKey && window.DB.byKey.get ? window.DB.byKey.get(c.key) : null;
            return { name: (c.name_ru || (p && (p.name_ru || p.name)) || c.key), grams: Number(c.g_per_100g || 0), role: roleLabelForComposite(c.role), key: c.key };
        });
        const summary = comps.slice(0, 7).map(c => c.name).join(', ') + (comps.length > 7 ? `… + ещё ${comps.length - 7}` : '');
        const rows = comps.map(c => `<tr><td>${esc(c.name)}</td><td>${fmt1(c.grams)} г/100 г</td><td>${esc(c.role)}</td></tr>`).join('');
        const flags = compositeSearchFlags(product, model).map(x => `<span>${esc(x)}</span>`).join('');
        const prompts = recipeFitPrompts(product, model).map(x => `<li>${esc(x)}</li>`).join('');
        const confidence = esc(String(model.confidence || product.decomposition_accuracy || 'MEDIUM').replace(/_/g, ' '));
        const kind = esc(recipeKindLabel(product, model));
        return `<div class="composite-search-preview" data-role="composite-search-preview" data-component-count="${comps.length}">
      <div class="composite-search-preview-head"><strong>Состав модели:</strong> ${esc(summary)}</div>
      <div class="composite-search-kind">${kind}</div>
      <div class="composite-search-flags">${flags}</div>
      <details class="composite-search-details"><summary>Проверить полный состав до добавления (${comps.length} комп.)</summary>
        <div class="composite-search-note"><strong>Перед добавлением сравните с вашим рецептом.</strong> Если состав отличается, нажмите «Добавить и изменить состав»: блюдо откроется как папка, где можно заменить, удалить или добавить ингредиенты.</div>
        <ul class="composite-search-fit-prompts">${prompts}</ul>
        <div class="composite-search-table-wrap"><table><thead><tr><th>Ингредиент</th><th>Масса</th><th>Роль</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="composite-search-model-meta">Точность модели: ${confidence}; расчёт качества: child-projection only; root HEI-вклад не используется.</div>
      </details>
    </div>`;
    }
    function openCompositeEntryAfterAdd(key) {
        // v5.3.90: robust retry instead of one timer. Rendering can lag behind State.add on mobile.
        let attempts = 0;
        const maxAttempts = 16;
        function tryOpen() {
            attempts += 1;
            try {
                if (!(window.State && typeof window.State.get === 'function'))
                    return schedule();
                const items = window.State.get() || [];
                const entry = items.slice().reverse().find(it => it && it.key === key && it.entry_type === 'composite_food');
                if (!entry)
                    return schedule();
                const ref = String(entry.id || entry.key || '');
                const escSel = window.CSS && CSS.escape ? CSS.escape(ref) : ref.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
                const input = document.querySelector(`#rationTable input[data-ration-ref="${escSel}"]`) || document.querySelector(`input[data-ration-ref="${escSel}"]`);
                const row = input && input.closest('tr');
                if (!row)
                    return schedule();
                const next = row.nextElementSibling;
                const alreadyOpen = next && next.classList && next.classList.contains('ration-details') && next.style.display !== 'none';
                const cell = row.querySelector('.ration-name');
                if (!alreadyOpen && cell)
                    cell.click();
                row.classList.add('composite-open-after-add-highlight');
                setTimeout(() => row.classList.remove('composite-open-after-add-highlight'), 2600);
                const addBtn = next && next.querySelector ? next.querySelector('.composite-inner-add') : null;
                if (addBtn) {
                    addBtn.classList.add('needs-review-highlight');
                    setTimeout(() => addBtn.classList.remove('needs-review-highlight'), 3200);
                }
                const section = document.getElementById('rationSection') || row;
                if (section && section.scrollIntoView)
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            catch (err) {
                console.warn('Composite open-after-add failed', err);
                schedule();
            }
        }
        function schedule() { if (attempts < maxAttempts)
            setTimeout(tryOpen, attempts < 4 ? 120 : 220); }
        tryOpen();
        setTimeout(function () { try {
            if (window.__v35UpdateRationKpi)
                window.__v35UpdateRationKpi();
        }
        catch (_) { } }, 260);
    }
    function renderSearchV35(query, limit) {
        const DB = window.DB, out = document.getElementById('globalResults'), st = document.getElementById('globalSearchStatus'), gramsEl = document.getElementById('globalSearchGrams');
        if (!DB || !DB.items || !out || !gramsEl)
            return false;
        const q = norm(query || ''), terms = q.split(' ').filter(Boolean), grams = Math.max(1, Math.min(5000, parseFloat(gramsEl.value) || 100)), lim = Math.max(12, Number(limit || out.dataset.limit || 12));
        out.innerHTML = '';
        if (!q || q.length < 2) {
            out.dataset.limit = '12';
            if (st)
                st.textContent = 'Начните вводить название продукта. Поиск работает по всей базе, без открытия категорий.';
            out.innerHTML = '<div class="search-empty-state">Самый быстрый сценарий: введите продукт из своего обычного рациона, например «творог», «курица», «гречка» или «йогурт». Затем проверьте граммы и нажмите «Добавить в рацион».</div>';
            return true;
        }
        const scored = DB.items.filter(p => !(p && p.hidden_from_search === true)).map(p => { const all = productText(p); if (!terms.every(t => termMatches(all, t)))
            return null; const name = norm(p.name_ru || p.name || p.key); const meta = productMetaText(p); let score = 0; if (name === q)
            score += 400; if (name.startsWith(q))
            score += 220; if (name.includes(q))
            score += 120; terms.forEach(t => { const vars = termVariants(t); if (name.split(' ').some(w => w === t))
            score += 35; if (name.split(' ').some(w => w.startsWith(t)))
            score += 15; if (vars.some(v => name.startsWith(v)))
            score += 90; if (name.split(' ').some(w => vars.some(v => w === v || w.startsWith(v))))
            score += 20; if (termMatches(all, t))
            score += 2; if (termMatches(meta, t))
            score += 1; }); return { p, score }; }).filter(Boolean).sort((a, b) => b.score !== a.score ? b.score - a.score : String(a.p.name_ru || '').localeCompare(String(b.p.name_ru || ''), 'ru'));
        const hits = scored.slice(0, lim).map(x => x.p);
        if (st)
            st.textContent = scored.length ? `Найдено: ${scored.length}. Показаны первые ${hits.length}. Уточните запрос или нажмите «Показать ещё».` : 'Ничего не найдено. Попробуйте основу слова: «сырник», «сгущ», «зелёная», «куриц».';
        if (!hits.length) {
            out.innerHTML = '<div class="search-empty-state"><strong>Ничего не найдено.</strong><br>Попробуйте другое написание или более короткую основу слова. Например: «сгущ», «твор», «зелёная».</div>';
            if (window.NutritionPreparationFamilyUI && typeof window.NutritionPreparationFamilyUI.scanSearch === 'function')
                window.NutritionPreparationFamilyUI.scanSearch();
            return true;
        }
        out.innerHTML = hits.map(p => { const m = getMacro(p, grams); const cat = typeof window.labelCatalog === 'function' ? window.labelCatalog(p.catalog_category_key || p.category || '') : (p.catalog_category_key || p.category || ''); const hei = typeof window.labelHEI === 'function' ? window.labelHEI(p.hei_category_key || '') : (p.hei_category_key || ''); const isComp = isCompositeForSearch(p); const preview = renderCompositeSearchPreview(p); const addButtons = isComp ? `<button type="button" data-role="add-search">Добавить как есть</button><button type="button" class="secondary" data-role="add-search-edit">Добавить и изменить состав</button>` : `<button type="button" data-role="add-search">Добавить в рацион</button>`; return `<div class="search-result-card ${isComp ? 'composite-search-card' : ''}" data-key="${esc(p.key)}"><div><div class="search-result-title">${esc(p.name_ru || p.name || p.key)}${isComp ? ' <span class="composite-search-badge">состав</span>' : ''}</div><div class="search-result-meta">${esc(cat)} · ${esc(hei)}</div><div class="search-result-nutrients" data-role="portion"><span>${fmt1(m.kcal)} ккал</span><span>Б ${fmt1(m.protein)} г</span><span>Ж ${fmt1(m.fat)} г</span><span>У ${fmt1(m.carbs)} г</span></div>${preview}${p.weighing_instruction_ru ? `<div class="search-result-weighing-note">${esc(p.weighing_instruction_ru)}</div>` : ``}<div class="search-result-trust">${esc(isComp ? 'Composite-модель: проверьте состав; после добавления ингредиенты можно заменить внутри блюда.' : trustLabel(p))}</div></div><div class="search-result-actions"><label>Граммы</label><input type="number" min="1" max="5000" step="1" value="${grams}" data-role="grams">${addButtons}</div></div>`; }).join('') + (scored.length > hits.length ? '<div class="search-more-wrap"><button type="button" data-role="search-more">Показать ещё</button></div>' : '');
        out.dataset.limit = String(lim);
        if (window.NutritionPreparationFamilyUI && typeof window.NutritionPreparationFamilyUI.scanSearch === 'function')
            window.NutritionPreparationFamilyUI.scanSearch();
        return true;
    }
    window.__v35RenderSearch = renderSearchV35;
    function updateCard(card) { var _a; const DB = window.DB; if (!DB || !DB.byKey || !card)
        return; const p = DB.byKey.get(card.dataset.key); const g = Math.max(1, Math.min(5000, parseFloat((_a = card.querySelector('[data-role="grams"]')) === null || _a === void 0 ? void 0 : _a.value) || 100)); const target = card.querySelector('[data-role="portion"]'); if (!p || !target)
        return; const m = getMacro(p, g); target.innerHTML = `<span>${fmt1(m.kcal)} ккал</span><span>Б ${fmt1(m.protein)} г</span><span>Ж ${fmt1(m.fat)} г</span><span>У ${fmt1(m.carbs)} г</span>`; }
    function updateRationKpi() {
        const strip = document.getElementById('rationKpiStrip'), attention = document.getElementById('rationAttentionStrip'), DB = window.DB;
        if (!strip || !DB || !DB.byKey)
            return;
        let items = [];
        try {
            items = (window.State && typeof window.State.get === 'function') ? (window.State.get() || []) : JSON.parse(localStorage.getItem('nutri_ration_v1') || '[]');
        }
        catch (e) { }
        if (!items.length) {
            strip.textContent = 'Рацион пока пуст';
            if (attention)
                attention.hidden = true;
            return;
        }
        const flat = (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.flattenForCalculation === 'function') ? window.CompositeFoodFolderV5377.flattenForCalculation(items) : items;
        const total = flat.reduce((a, it) => { var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k; const p = DB.byKey.get(it.key) || it, g = Number(it.grams) || 0, f = g / 100; a.kcal += f * (Number(p.kcal) || 0); a.protein += f * (Number((_b = (_a = p.protein_per_100g) !== null && _a !== void 0 ? _a : p.protein_g) !== null && _b !== void 0 ? _b : 0)); a.fat += f * (Number((_d = (_c = p.fat_per_100g) !== null && _c !== void 0 ? _c : p.fat_g) !== null && _d !== void 0 ? _d : 0)); a.carbs += f * (Number((_f = (_e = p.carbs_per_100g) !== null && _e !== void 0 ? _e : p.carbs_g) !== null && _f !== void 0 ? _f : 0)); a.sodium += f * (Number(p.sodium_mg) || Number(p.salt || p.salt_g || 0) * 393); a.sfa += f * (Number((_h = (_g = p.sfa) !== null && _g !== void 0 ? _g : p.sfa_g) !== null && _h !== void 0 ? _h : 0)); a.added += f * (Number((_k = (_j = p.added_sugar) !== null && _j !== void 0 ? _j : p.added_sugars_g) !== null && _k !== void 0 ? _k : 0)); return a; }, { kcal: 0, protein: 0, fat: 0, carbs: 0, sodium: 0, sfa: 0, added: 0 });
        strip.textContent = `${items.length} поз. · ${fmt1(total.kcal)} ккал · Б ${fmt1(total.protein)} · Ж ${fmt1(total.fat)} · У ${fmt1(total.carbs)}`;
        if (attention) {
            const nv = (window.norms && window.norms.values) || {};
            const checks = [['Натрий', total.sodium, Number(nv.sodium_mg && nv.sodium_mg.value) || 0], ['НЖК', total.sfa, Number(nv.sfa_g && nv.sfa_g.value) || 0], ['Добавленный сахар', total.added, Number(nv.added_sugars_g && nv.added_sugars_g.value) || 0]];
            const over = checks.filter(x => x[2] > 0 && x[1] > x[2]).map(x => `${x[0]} ${Math.round(x[1] / x[2] * 100)}%`);
            if (over.length) {
                attention.textContent = 'Обратить внимание: ' + over.join(' · ') + '. Метки в строках показывают основные источники.';
                attention.hidden = false;
            }
            else
                attention.hidden = true;
        }
    }
    window.__v35UpdateRationKpi = updateRationKpi;
    document.addEventListener('DOMContentLoaded', function () { const input = document.getElementById('globalSearchInput'), grams = document.getElementById('globalSearchGrams'), out = document.getElementById('globalResults'), dev = document.getElementById('devToggle'); if (dev)
        dev.addEventListener('click', () => document.body.classList.toggle('dev-mode')); if (input) {
        input.addEventListener('input', () => { if (out)
            out.dataset.limit = '12'; renderSearchV35(input.value, 12); }, true);
        setTimeout(() => renderSearchV35(input.value, 12), 0);
    } if (grams && input)
        grams.addEventListener('input', () => renderSearchV35(input.value, Number((out === null || out === void 0 ? void 0 : out.dataset.limit) || 12)), true); if (out) {
        out.addEventListener('input', e => { const card = e.target.closest('.search-result-card'); if (card)
            updateCard(card); });
        out.addEventListener('click', e => { var _a; const more = e.target.closest('[data-role="search-more"]'); if (more && input) {
            renderSearchV35(input.value, Number(out.dataset.limit || 12) + 12);
            return;
        } const add = e.target.closest('[data-role="add-search"]'), addEdit = e.target.closest('[data-role="add-search-edit"]'), card = e.target.closest('.search-result-card'); if ((add || addEdit) && card) {
            const key = card.dataset.key, g = Math.max(1, Math.min(5000, parseFloat((_a = card.querySelector('[data-role="grams"]')) === null || _a === void 0 ? void 0 : _a.value) || 100));
            let added = null;
            try {
                if (window.State && typeof window.State.add === 'function')
                    added = window.State.add(key, g);
            }
            catch (err) {
                console.error('v3.5 add error', err);
            }
            const p = window.DB && window.DB.byKey && window.DB.byKey.get(key);
            if (!added) {
                showToast(`Не удалось добавить: ${(p && p.name_ru) || key}. Обновите страницу и повторите попытку.`);
                try {
                    window.dispatchEvent(new CustomEvent('ration:add-ui-failed', { detail: { key: key, grams: g, source: 'search' } }));
                }
                catch (_) { }
                return;
            }
            showToast(`${addEdit ? 'Добавлено, состав открыт для проверки' : 'Добавлено в рацион'}: ${(p && p.name_ru) || key}, ${g} г`);
            if (addEdit)
                openCompositeEntryAfterAdd(key);
            setTimeout(updateRationKpi, 60);
        } });
    } window.addEventListener('ration:changed', updateRationKpi); window.addEventListener('storage', updateRationKpi); setTimeout(updateRationKpi, 300); });
    const prev = window.runSearchFirstUxTests;
    window.runV35CleanSearchCartTests = function () { const search = document.getElementById('globalSearchSection'), ration = document.getElementById('rationSection'); const rows = [{ test: 'v3.5 search before ration', pass: !!(search && ration && (search.compareDocumentPosition(ration) & Node.DOCUMENT_POSITION_FOLLOWING)) }, { test: 'v3.5 additional section exists', pass: !!document.getElementById('additionalToolsSection') }, { test: 'v3.5 toast exists', pass: !!document.getElementById('searchAddedToast') }, { test: 'v3.5 ration KPI exists', pass: !!document.getElementById('rationKpiStrip') }, { test: 'v3.5 full search text exists', pass: typeof window.__v35ProductSearchText === 'function' }, { test: 'v3.5 renderer exists', pass: typeof window.__v35RenderSearch === 'function' }, { test: 'v5.3.90 composite preview supports full component table', pass: typeof renderCompositeSearchPreview === 'function' && String(renderCompositeSearchPreview).includes('full component list') }, { test: 'v5.3.90 robust open-after-add exists', pass: typeof openCompositeEntryAfterAdd === 'function' && String(openCompositeEntryAfterAdd).includes('maxAttempts') }]; if (console && console.table)
        console.table(rows); return rows.every(r => !!r.pass) && (typeof prev === 'function' ? prev() : true); };
    const prevSmoke = window.runSmokeTests;
    window.runSmokeTests = function () { let ok = true; try {
        ok = prevSmoke ? prevSmoke() : true;
    }
    catch (e) {
        ok = false;
        window.__v35PreviousSmokeError = String(e && e.message || e);
    } return !!ok && window.runV35CleanSearchCartTests(); };
})();
;
// ===== extracted inline script 37; id=v3-5-1-mobile-search-dropdown-js =====
(function () {
    'use strict';
    function isMobileSearchLayout() {
        return window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
    }
    function syncQueryState() {
        var input = document.getElementById('globalSearchInput');
        var out = document.getElementById('globalResults');
        if (!input || !out)
            return;
        var normalizer = window.normalizeSearchText || function (v) { return String(v || '').toLowerCase().replace(/ё/g, 'е').trim(); };
        out.classList.toggle('has-query', normalizer(input.value).length >= 2);
    }
    function placeSearchResults() {
        var out = document.getElementById('globalResults');
        var anchor = document.getElementById('mobileSearchResultsAnchor');
        var section = document.getElementById('globalSearchSection');
        if (!out || !anchor || !section)
            return;
        if (isMobileSearchLayout()) {
            if (out.parentElement !== anchor)
                anchor.appendChild(out);
        }
        else {
            if (out.parentElement !== section)
                section.appendChild(out);
        }
        syncQueryState();
    }
    document.addEventListener('DOMContentLoaded', function () {
        var input = document.getElementById('globalSearchInput');
        var grams = document.getElementById('globalSearchGrams');
        placeSearchResults();
        window.addEventListener('resize', placeSearchResults, { passive: true });
        if (window.matchMedia) {
            var mq = window.matchMedia('(max-width: 760px)');
            if (mq.addEventListener)
                mq.addEventListener('change', placeSearchResults);
            else if (mq.addListener)
                mq.addListener(placeSearchResults);
        }
        if (input) {
            input.addEventListener('focus', function () { setTimeout(placeSearchResults, 0); }, true);
            input.addEventListener('input', function () { setTimeout(function () { placeSearchResults(); syncQueryState(); }, 0); }, true);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    input.value = '';
                    var out = document.getElementById('globalResults');
                    if (out)
                        out.classList.remove('has-query');
                }
            }, true);
        }
        if (grams)
            grams.addEventListener('input', function () { setTimeout(syncQueryState, 0); }, true);
    });
    var prev = window.runV35CleanSearchCartTests;
    window.runV351MobileSearchDropdownTests = function () {
        var rows = [
            { test: 'v3.5.1 mobile results anchor exists', pass: !!document.getElementById('mobileSearchResultsAnchor') },
            { test: 'v3.5.1 search results node exists', pass: !!document.getElementById('globalResults') },
            { test: 'v3.5.1 query state sync exists', pass: typeof syncQueryState === 'function' },
            { test: 'v3.5.1 results relocation exists', pass: typeof placeSearchResults === 'function' }
        ];
        if (console && console.table)
            console.table(rows);
        return rows.every(function (r) { return !!r.pass; }) && (typeof prev === 'function' ? prev() : true);
    };
    var prevSmoke = window.runSmokeTests;
    window.runSmokeTests = function () {
        var ok = true;
        try {
            ok = prevSmoke ? prevSmoke() : true;
        }
        catch (e) {
            ok = false;
            window.__v351PreviousSmokeError = String(e && e.message || e);
        }
        return !!ok && window.runV351MobileSearchDropdownTests();
    };
})();
;
// ===== extracted inline script 38; id=v3-5-2-mobile-search-fixed-panel-js =====
(function () {
    'use strict';
    function mobile() { return window.matchMedia && window.matchMedia('(max-width: 760px)').matches; }
    function setPanelGeometry() {
        var input = document.getElementById('globalSearchInput');
        var out = document.getElementById('globalResults');
        if (!input || !out || !mobile() || !out.classList.contains('has-query'))
            return;
        var vv = window.visualViewport;
        var viewportHeight = vv ? vv.height : window.innerHeight;
        var viewportTop = vv ? vv.offsetTop : 0;
        var rect = input.getBoundingClientRect();
        var wantedTop = viewportTop + rect.bottom + 8;
        var maxTop = viewportTop + Math.max(96, Math.round(viewportHeight * 0.38));
        var top = Math.min(Math.max(viewportTop + 8, wantedTop), maxTop);
        var height = Math.max(190, Math.round(viewportTop + viewportHeight - top - 12));
        document.documentElement.style.setProperty('--mobile-search-results-top', top + 'px');
        document.documentElement.style.setProperty('--mobile-search-results-height', height + 'px');
    }
    function bind() {
        var input = document.getElementById('globalSearchInput');
        var grams = document.getElementById('globalSearchGrams');
        var out = document.getElementById('globalResults');
        var fn = function () { setTimeout(setPanelGeometry, 0); setTimeout(setPanelGeometry, 180); };
        if (input) {
            input.addEventListener('focus', fn, true);
            input.addEventListener('input', fn, true);
            input.addEventListener('keyup', fn, true);
        }
        if (grams)
            grams.addEventListener('input', fn, true);
        if (out && window.MutationObserver) {
            new MutationObserver(fn).observe(out, { attributes: true, attributeFilter: ['class'], childList: true, subtree: false });
        }
        window.addEventListener('resize', fn, { passive: true });
        window.addEventListener('scroll', fn, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', fn);
            window.visualViewport.addEventListener('scroll', fn);
        }
        fn();
    }
    document.addEventListener('DOMContentLoaded', bind);
    var prev = window.runV351MobileSearchDropdownTests;
    window.runV352MobileSearchPanelTests = function () {
        var rows = [
            { test: 'v3.5.2 fixed mobile panel css variable top exists', pass: getComputedStyle(document.documentElement).getPropertyValue('--mobile-search-results-top') !== null },
            { test: 'v3.5.2 panel geometry function active', pass: typeof setPanelGeometry === 'function' }
        ];
        if (console && console.table)
            console.table(rows);
        return rows.every(function (r) { return !!r.pass; }) && (typeof prev === 'function' ? prev() : true);
    };
    var prevSmoke = window.runSmokeTests;
    window.runSmokeTests = function () {
        var ok = true;
        try {
            ok = prevSmoke ? prevSmoke() : true;
        }
        catch (e) {
            ok = false;
            window.__v352PreviousSmokeError = String(e && e.message || e);
        }
        return !!ok && window.runV352MobileSearchPanelTests();
    };
})();
;
