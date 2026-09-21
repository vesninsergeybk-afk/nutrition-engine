// nutrition calculator v4.6.9_p0_p1_hardening
// Module: 24-unit-quick-input.js
// Responsibility: quick gram input from structured serving_units. Does not change product data or calculation model.
(function () {
    'use strict';
    var VERSION = 'v4.6.9_p0_p1_hardening';
    var ALLOWED_UNIT_TYPES = new Set(['шт', 'ломтик', 'зубчик', 'початок', 'упаковка', 'порция']);
    var ENABLE_PRIORITY = 'P0';
    var ENABLE_CONFIDENCE = new Set(['high', 'medium']);
    function byId(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function n(v) { v = Number(v); return Number.isFinite(v) ? v : 0; }
    function roundGram(v) { return Math.max(1, Math.round(n(v))); }
    function productsArray() { return window.DB && Array.isArray(window.DB.items) ? window.DB.items : []; }
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
    function unitsOf(product) { return product && Array.isArray(product.serving_units) ? product.serving_units : []; }
    function isEnabledRecord(unit) {
        if (!unit)
            return false;
        if (unit.priority !== ENABLE_PRIORITY)
            return false;
        if (!ENABLE_CONFIDENCE.has(String(unit.confidence || '')))
            return false;
        if (!Number.isFinite(Number(unit.grams)) || Number(unit.grams) <= 0)
            return false;
        if (!ALLOWED_UNIT_TYPES.has(String(unit.unit_type || '')))
            return false;
        return true;
    }
    function variantLabel(unit) {
        var label = String((unit && unit.label) || '');
        var display = String((unit && unit.display) || '');
        var text = label + ' ' + display;
        var m = text.match(/С[0-2]/i);
        return m ? m[0].toUpperCase() : (unit && unit.label ? String(unit.label).replace(/^1\s*/, '') : 'вариант');
    }
    function unitWord(unitType, multiplier) {
        var m = Number(multiplier);
        if (unitType === 'ломтик')
            return m === 1 ? 'ломтик' : (m >= 2 && m <= 4 ? 'ломтика' : 'ломтиков');
        if (unitType === 'зубчик')
            return m === 1 ? 'зубчик' : (m >= 2 && m <= 4 ? 'зубчика' : 'зубчиков');
        if (unitType === 'початок')
            return m === 1 ? 'початок' : (m >= 2 && m <= 4 ? 'початка' : 'початков');
        if (unitType === 'упаковка')
            return m === 1 ? 'упаковка' : (m >= 2 && m <= 4 ? 'упаковки' : 'упаковок');
        if (unitType === 'порция')
            return m === 1 ? 'порция' : (m >= 2 && m <= 4 ? 'порции' : 'порций');
        return 'шт';
    }
    function productNameText(product) { return String((product && (product.name_ru || product.name || product.key)) || '').toLowerCase(); }
    function parseRange(text) {
        var s = String(text || '').replace(',', '.');
        var m = s.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
        if (!m)
            return null;
        var a = Number(m[1]), b = Number(m[2]);
        if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0)
            return null;
        if (b < a) {
            var t = a;
            a = b;
            b = t;
        }
        return { min: a, max: b, midpoint: (a + b) / 2, spread: b - a, ratio: (b - a) / ((a + b) / 2) };
    }
    function rangeForUnit(unit) { return parseRange(unit && unit.weight_range_or_variants) || parseRange(unit && unit.display); }
    function highVarianceUnit(unit) {
        var r = rangeForUnit(unit);
        if (!r)
            return false;
        return r.ratio >= 0.35;
    }
    function approxReason(unit) {
        var r = rangeForUnit(unit);
        if (!r)
            return '';
        if (r.ratio >= 0.35)
            return 'Масса заметно варьирует: ' + Math.round(r.min) + '–' + Math.round(r.max) + ' г. Кнопки подставляют ориентир.';
        return '';
    }
    function buttonMultipliers(product, unit) {
        var type = String(unit.unit_type || '');
        var grams = n(unit.grams);
        var name = productNameText(product);
        if (type === 'ломтик' || type === 'зубчик')
            return [1, 2, 3];
        if (type === 'початок')
            return [1, 2];
        if (type === 'упаковка' || type === 'порция')
            return [1, 2];
        if (/хлебец|печень|колбаск|сосиск|сардель|шпикач|сырок|круассан|булочк|тортиль|wrap/.test(name))
            return [1, 2, 3];
        if (grams <= 40)
            return [1, 2, 3];
        if (grams >= 250)
            return [0.5, 1];
        return [0.5, 1, 2];
    }
    function makeButtonPlan(product, unit) {
        var multipliers = buttonMultipliers(product, unit);
        var type = String(unit.unit_type || 'шт');
        return multipliers.map(function (m) {
            var label;
            if (m === 0.5)
                label = '1/2 ' + (type === 'шт' ? 'шт' : unitWord(type, 1));
            else
                label = String(m).replace('.5', '½') + ' ' + unitWord(type, m);
            return { label: label, grams: roundGram(n(unit.grams) * m), multiplier: m, approximate: highVarianceUnit(unit) };
        });
    }
    function disable(reason, detail) { return { enabled: false, status: reason, reason: detail || reason, mode: 'disabled', buttons: [] }; }
    function getQuickUnitPlan(product) {
        if (!product)
            return disable('disabled_missing_product', 'product not found');
        var units = unitsOf(product);
        if (!units.length)
            return disable('not_applicable', 'no serving_units');
        var enabled = units.filter(isEnabledRecord);
        if (!enabled.length) {
            if (units.some(function (u) { return String(u.unit_type || '').indexOf('/') >= 0; }))
                return disable('disabled_ambiguous_unit', 'ambiguous unit_type');
            if (units.every(function (u) { return String(u.confidence || '') === 'low'; }))
                return disable('disabled_low_confidence', 'low confidence');
            if (units.some(function (u) { return String(u.priority || '') === 'P1'; }))
                return disable('disabled_medium_review', 'priority P1 requires manual review');
            if (units.some(function (u) { return String(u.priority || '') === 'P2'; }))
                return disable('disabled_low_priority', 'priority P2');
            return disable('disabled_not_eligible', 'not eligible for quick input');
        }
        if (product.key === 'egg_whole_boiled' && enabled.length >= 2) {
            var variants = enabled.map(function (u) { return { label: variantLabel(u), grams: roundGram(u.grams), display: u.display || u.label || '', approximate: highVarianceUnit(u), range: rangeForUnit(u), unit: u }; });
            variants.sort(function (a, b) { return a.label.localeCompare(b.label, 'ru'); });
            var def = variants.find(function (v) { return v.label === 'С1'; }) || variants[0];
            return { enabled: true, status: 'enabled_p0', mode: 'variant_unit', reason: 'P0 structured egg variants', productKey: product.key, defaultVariant: def.label, variants: variants, multipliers: [1, 2, 3], buttons: [] };
        }
        var unit = enabled[0];
        var type = String(unit.unit_type || 'шт');
        var mode = type === 'ломтик' ? 'slice_unit' : (type === 'зубчик' ? 'clove_unit' : (type === 'початок' ? 'cob_unit' : (type === 'упаковка' || type === 'порция' ? 'portion_unit' : 'single_unit')));
        var approx = approxReason(unit);
        return { enabled: true, status: 'enabled_p0', mode: mode, reason: 'P0 structured serving unit', productKey: product.key, unit: unit, unitType: type, baseGrams: roundGram(unit.grams), approximate: highVarianceUnit(unit), approxReason: approx, range: rangeForUnit(unit), buttons: makeButtonPlan(product, unit) };
    }
    function findInputForContext(root, context) {
        if (!root)
            return null;
        if (context === 'ration')
            return root.querySelector('input[data-ration-key]');
        return root.querySelector('input[data-role="grams"]') || root.querySelector('input[type="number"]');
    }
    function setApplied(btn) {
        if (!btn)
            return;
        btn.classList.add('is-applied');
        window.setTimeout(function () { btn.classList.remove('is-applied'); }, 900);
    }
    function currentRationGrams(key) {
        try {
            if (!key || !window.State || typeof window.State.get !== 'function')
                return null;
            var item = (window.State.get() || []).find(function (x) { return x && x.key === key; });
            return item ? Number(item.grams) : null;
        }
        catch (_) {
            return null;
        }
    }
    function applyGramsToInput(input, grams, button) {
        if (!input)
            return false;
        var g = roundGram(grams);
        input.value = String(g);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        setApplied(button);
        var key = input.getAttribute('data-ration-key');
        if (key && window.State && typeof window.State.update === 'function') {
            window.setTimeout(function () {
                try {
                    var stateG = currentRationGrams(key);
                    if (stateG === null || Math.round(stateG) !== g)
                        window.State.update(key, g);
                }
                catch (_) { }
            }, 330);
        }
        return true;
    }
    function setButtonMeta(button, grams, approximate) {
        var title = 'Подставить ' + (approximate ? 'примерно ' : '') + grams + ' г';
        button.dataset.grams = String(grams);
        button.title = title;
        button.setAttribute('aria-label', title);
        button.classList.toggle('unit-quick-input-btn--approx', !!approximate);
    }
    function appendApproxNote(wrap, planOrUnit) {
        var reason = planOrUnit && (planOrUnit.approxReason || approxReason(planOrUnit.unit || planOrUnit));
        if (!reason)
            return;
        var note = document.createElement('span');
        note.className = 'unit-quick-input-note';
        note.textContent = 'Примерно: ' + reason;
        wrap.appendChild(note);
    }
    function renderVariantControls(plan, input) {
        var wrap = document.createElement('div');
        wrap.className = 'unit-quick-input';
        wrap.dataset.quickMode = plan.mode;
        wrap.dataset.quickKey = plan.productKey;
        var label = document.createElement('span');
        label.className = 'unit-quick-input-label';
        label.textContent = 'Подставить:';
        wrap.appendChild(label);
        var variantBox = document.createElement('span');
        variantBox.className = 'unit-quick-input-actions unit-quick-input-variants';
        var selected = plan.defaultVariant || (plan.variants[0] && plan.variants[0].label);
        plan.variants.forEach(function (v) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'unit-quick-input-variant' + (v.label === selected ? ' is-selected' : '');
            b.textContent = v.label;
            b.title = v.display || (v.grams + ' г');
            b.dataset.variantLabel = v.label;
            b.dataset.grams = String(v.grams);
            b.addEventListener('click', function () {
                selected = v.label;
                Array.prototype.forEach.call(variantBox.querySelectorAll('.unit-quick-input-variant'), function (x) { x.classList.toggle('is-selected', x.dataset.variantLabel === selected); });
                Array.prototype.forEach.call(actions.querySelectorAll('.unit-quick-input-btn'), function (x) {
                    x.dataset.baseGrams = String(v.grams);
                    setButtonMeta(x, roundGram(Number(x.dataset.multiplier) * v.grams), v.approximate);
                });
            });
            variantBox.appendChild(b);
        });
        wrap.appendChild(variantBox);
        var actions = document.createElement('span');
        actions.className = 'unit-quick-input-actions';
        var defaultVariant = plan.variants.find(function (v) { return v.label === selected; }) || plan.variants[0];
        plan.multipliers.forEach(function (m) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'unit-quick-input-btn';
            b.textContent = m + ' шт';
            b.dataset.multiplier = String(m);
            b.dataset.baseGrams = String(defaultVariant.grams);
            setButtonMeta(b, roundGram(defaultVariant.grams * m), defaultVariant.approximate);
            b.addEventListener('click', function () { applyGramsToInput(input, Number(b.dataset.grams), b); });
            actions.appendChild(b);
        });
        wrap.appendChild(actions);
        return wrap;
    }
    function renderButtonControls(plan, input) {
        var wrap = document.createElement('div');
        wrap.className = 'unit-quick-input';
        wrap.dataset.quickMode = plan.mode;
        wrap.dataset.quickKey = plan.productKey;
        var label = document.createElement('span');
        label.className = 'unit-quick-input-label';
        label.textContent = 'Подставить:';
        wrap.appendChild(label);
        var actions = document.createElement('span');
        actions.className = 'unit-quick-input-actions';
        (plan.buttons || []).forEach(function (opt) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'unit-quick-input-btn';
            b.textContent = opt.label;
            setButtonMeta(b, opt.grams, opt.approximate || plan.approximate);
            b.addEventListener('click', function () { applyGramsToInput(input, opt.grams, b); });
            actions.appendChild(b);
        });
        wrap.appendChild(actions);
        appendApproxNote(wrap, plan);
        return wrap;
    }
    function createControls(product, input) {
        var plan = getQuickUnitPlan(product);
        if (!plan.enabled)
            return null;
        return plan.mode === 'variant_unit' ? renderVariantControls(plan, input) : renderButtonControls(plan, input);
    }
    function removeExisting(container) {
        if (!container || !container.querySelectorAll)
            return;
        Array.prototype.forEach.call(container.querySelectorAll('.unit-quick-input'), function (el) { el.remove(); });
        Array.prototype.forEach.call(container.querySelectorAll('.unit-quick-catalog-host'), function (el) { el.remove(); });
    }
    function insertAfter(anchor, node) {
        if (anchor && anchor.parentNode)
            anchor.parentNode.insertBefore(node, anchor.nextSibling);
        return !!(anchor && anchor.parentNode);
    }
    function enhanceSearchCards() {
        Array.prototype.slice.call(document.querySelectorAll('.search-result-card')).forEach(function (card) {
            var key = card.getAttribute('data-key') || '';
            if (!key)
                return;
            var product = productByKey(key);
            var input = findInputForContext(card, 'search');
            if (!product || !input)
                return;
            if (card.dataset.unitQuickKey === key && card.querySelector('.unit-quick-input'))
                return;
            removeExisting(card);
            var controls = createControls(product, input);
            card.dataset.unitQuickKey = key;
            if (!controls)
                return;
            var hint = card.querySelector('.serving-unit-hint');
            var actions = card.querySelector('.search-result-actions');
            if (hint)
                insertAfter(hint, controls);
            else if (actions && actions.parentNode)
                actions.parentNode.insertBefore(controls, actions);
            else {
                var anchor = card.querySelector('.search-result-nutrients') || card.querySelector('[data-role="portion"]') || card.querySelector('.search-result-meta') || card.querySelector('.search-result-title');
                if (!insertAfter(anchor, controls))
                    card.appendChild(controls);
            }
        });
    }
    function enhanceCatalogControls() {
        Array.prototype.slice.call(document.querySelectorAll('select[data-role="select"]')).forEach(function (sel) {
            var key = sel.value || '';
            var body = sel.closest('.accordion-body') || sel.closest('.inline') || sel.parentElement;
            if (!body)
                return;
            var product = productByKey(key);
            var input = body.querySelector('input[data-role="grams"]');
            var existing = body.querySelector('.unit-quick-catalog-host');
            if (existing && existing.dataset.unitQuickKey === key && existing.querySelector('.unit-quick-input') && product && input) {
                if (!sel.dataset.unitQuickObserved) {
                    sel.dataset.unitQuickObserved = '1';
                    sel.addEventListener('change', function () { window.setTimeout(enhanceCatalogControls, 0); });
                }
                return;
            }
            if (existing || body.querySelector('.unit-quick-input'))
                removeExisting(body);
            if (!product || !input)
                return;
            var controls = createControls(product, input);
            if (!controls)
                return;
            var host = document.createElement('div');
            host.className = 'unit-quick-catalog-host';
            host.dataset.unitQuickKey = key;
            host.appendChild(controls);
            var hint = body.querySelector('.catalog-serving-hint');
            if (hint)
                insertAfter(hint, host);
            else {
                var inline = sel.closest('.inline');
                if (inline && inline.parentNode)
                    inline.parentNode.insertBefore(host, inline.nextSibling);
                else
                    body.appendChild(host);
            }
            if (!sel.dataset.unitQuickObserved) {
                sel.dataset.unitQuickObserved = '1';
                sel.addEventListener('change', function () { window.setTimeout(enhanceCatalogControls, 0); });
            }
        });
    }
    function ensureRationTitleStack(row) {
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
    function enhanceRationRows() {
        Array.prototype.slice.call(document.querySelectorAll('#rationBody .ration-row')).forEach(function (row) {
            var input = findInputForContext(row, 'ration');
            if (!input)
                return;
            var key = input.getAttribute('data-ration-key') || '';
            var product = productByKey(key);
            if (!product)
                return;
            if (row.dataset.unitQuickKey === key && row.querySelector('.unit-quick-input'))
                return;
            removeExisting(row);
            row.dataset.unitQuickKey = key;
            var controls = createControls(product, input);
            if (!controls)
                return;
            var stack = ensureRationTitleStack(row);
            var hint = stack && stack.querySelector('.ration-serving-hint');
            if (hint)
                insertAfter(hint, controls);
            else if (stack)
                stack.appendChild(controls);
            else
                (input.closest('td') || row).appendChild(controls);
        });
    }
    function enhanceAll() {
        try {
            if (typeof window.__enhanceServingUnitHints === 'function')
                window.__enhanceServingUnitHints();
        }
        catch (_) { }
        enhanceSearchCards();
        enhanceCatalogControls();
        enhanceRationRows();
    }
    function installObservers() {
        var search = byId('globalResults');
        if (search && !search.dataset.unitQuickObserved) {
            search.dataset.unitQuickObserved = '1';
            new MutationObserver(function () { window.setTimeout(enhanceAll, 0); }).observe(search, { childList: true, subtree: true });
        }
        var cats = byId('categories');
        if (cats && !cats.dataset.unitQuickObserved) {
            cats.dataset.unitQuickObserved = '1';
            new MutationObserver(function () { window.setTimeout(enhanceAll, 30); }).observe(cats, { childList: true, subtree: true });
        }
        var ration = byId('rationBody');
        if (ration && !ration.dataset.unitQuickObserved) {
            ration.dataset.unitQuickObserved = '1';
            new MutationObserver(function () { window.setTimeout(enhanceAll, 0); }).observe(ration, { childList: true, subtree: true });
        }
        document.addEventListener('change', function (e) { if (e.target && e.target.closest && e.target.closest('select[data-role="select"]'))
            window.setTimeout(enhanceAll, 0); }, true);
        window.addEventListener('ration:changed', function () { window.setTimeout(enhanceAll, 0); });
    }
    function quickInputAudit() {
        return productsArray().map(function (p) {
            var plan = getQuickUnitPlan(p);
            return { key: p.key, name_ru: p.name_ru || '', status: plan.status, enabled: !!plan.enabled, mode: plan.mode, reason: plan.reason, approximate: !!plan.approximate, approxReason: plan.approxReason || '', buttons: (plan.buttons || []).map(function (b) { return b.label + '=' + b.grams + 'г'; }).join(';'), variants: (plan.variants || []).map(function (v) { return v.label + '=' + v.grams + 'г'; }).join(';') };
        });
    }
    function runTests() {
        var banana = productByKey('banana');
        var egg = productByKey('egg_whole_boiled');
        var bread = productByKey('white_bread');
        var buckwheat = productByKey('buckwheat_cooked');
        var butter = productByKey('butter_82_5_pct');
        var melon = productByKey('melon');
        var temp = document.createElement('div');
        temp.innerHTML = '<div class="search-result-card" data-key="banana"><div class="search-result-main"><div class="search-result-title">Банан</div><div class="search-result-nutrients" data-role="portion"></div><div class="serving-unit-hint"><strong>Ориентир:</strong><span>1 банан ≈ 118 г</span></div></div><div class="search-result-actions"><label>Граммы</label><input data-role="grams" type="number" value="100"><button type="button" data-role="add-search">Добавить</button></div></div>';
        document.body.appendChild(temp);
        enhanceSearchCards();
        var card = temp.querySelector('.search-result-card');
        var btn = card.querySelector('.unit-quick-input-btn[data-grams="118"]');
        if (btn)
            btn.click();
        var inputVal = temp.querySelector('input').value;
        var beforeDup = card.querySelectorAll('.unit-quick-input').length;
        enhanceSearchCards();
        var afterDup = card.querySelectorAll('.unit-quick-input').length;
        var quick = card.querySelector('.unit-quick-input');
        var hint = card.querySelector('.serving-unit-hint');
        var actions = card.querySelector('.search-result-actions');
        var placedAfterHint = !!(quick && hint && hint.nextElementSibling === quick);
        var placedBeforeActions = !!(quick && actions && (quick.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING));
        temp.remove();
        var rt = document.createElement('table');
        rt.innerHTML = '<tbody id="rationBodyTest"><tr class="ration-row"><td class="ration-name"><span class="ration-title-stack"><span class="ration-title">Банан</span><div class="serving-unit-hint ration-serving-hint"><strong>Ориентир:</strong><span>1 банан ≈ 118 г</span></div></span></td><td></td><td><input data-ration-key="banana" type="number" value="100"></td><td></td></tr></tbody>';
        document.body.appendChild(rt);
        var row = rt.querySelector('.ration-row');
        row.id = 'unitQuickTempRationRow';
        // direct row enhancement is internal; emulate selector root by appending to real rationBody only when available.
        var realRation = byId('rationBody');
        var rationPlaced = true;
        if (realRation) {
            realRation.appendChild(row);
            enhanceRationRows();
            var rq = row.querySelector('.unit-quick-input');
            var rh = row.querySelector('.ration-serving-hint');
            rationPlaced = !!(rq && rh && rh.nextElementSibling === rq);
            if (row.parentNode)
                row.parentNode.removeChild(row);
        }
        if (rt.parentNode)
            rt.parentNode.removeChild(rt);
        var rows = [
            { test: 'v4.6.9 unit quick input loaded', pass: window.__V469_UNIT_QUICK_INPUT__ === VERSION, got: window.__V469_UNIT_QUICK_INPUT__ },
            { test: 'getQuickUnitPlan exposed', pass: typeof window.getQuickUnitPlan === 'function' },
            { test: 'banana enabled with 118g button', pass: !!(banana && getQuickUnitPlan(banana).enabled && (getQuickUnitPlan(banana).buttons || []).some(function (b) { return b.grams === 118; })), got: banana && JSON.stringify(getQuickUnitPlan(banana).buttons) },
            { test: 'banana marked approximate when range is broad', pass: !!(banana && getQuickUnitPlan(banana).approximate), got: banana && getQuickUnitPlan(banana).approxReason },
            { test: 'egg variant mode', pass: !!(egg && getQuickUnitPlan(egg).mode === 'variant_unit' && getQuickUnitPlan(egg).variants.length === 3), got: egg && JSON.stringify(getQuickUnitPlan(egg).variants) },
            { test: 'egg S1 x2 = 108g', pass: !!(egg && (getQuickUnitPlan(egg).variants.find(function (v) { return v.label === 'С1'; }) || {}).grams * 2 === 108) },
            { test: 'white bread slice mode', pass: !!(bread && getQuickUnitPlan(bread).mode === 'slice_unit'), got: bread && getQuickUnitPlan(bread).mode },
            { test: 'buckwheat disabled', pass: !!(buckwheat && !getQuickUnitPlan(buckwheat).enabled), got: buckwheat && getQuickUnitPlan(buckwheat).status },
            { test: 'butter disabled', pass: !!(butter && !getQuickUnitPlan(butter).enabled), got: butter && getQuickUnitPlan(butter).status },
            { test: 'melon low confidence disabled', pass: !!(melon && !getQuickUnitPlan(melon).enabled && getQuickUnitPlan(melon).status === 'disabled_low_confidence'), got: melon && getQuickUnitPlan(melon).status },
            { test: 'button updates grams input', pass: inputVal === '118', got: inputVal },
            { test: 'idempotent render: no duplicate controls', pass: beforeDup === 1 && afterDup === 1, got: beforeDup + '/' + afterDup },
            { test: 'search quick input is after serving hint', pass: placedAfterHint },
            { test: 'search quick input is before actions/add button', pass: placedBeforeActions },
            { test: 'ration quick input is after ration serving hint', pass: rationPlaced }
        ];
        if (console && console.table)
            console.table(rows);
        return rows.every(function (r) { return !!r.pass; });
    }
    function init() {
        window.__V469_UNIT_QUICK_INPUT__ = VERSION;
        window.__V468_UNIT_QUICK_INPUT__ = VERSION;
        window.getQuickUnitPlan = getQuickUnitPlan;
        window.applyQuickUnitGramsToInput = applyGramsToInput;
        window.enhanceUnitQuickInput = enhanceAll;
        window.unitQuickInputAudit = quickInputAudit;
        window.runV469UnitQuickInputHardeningTests = runTests;
        window.runV468UnitQuickInputTests = runTests;
        installObservers();
        window.setTimeout(enhanceAll, 0);
        var prev = window.runSmokeTests;
        window.runSmokeTests = function () {
            var ok = true;
            try {
                ok = prev ? prev() : true;
            }
            catch (e) {
                ok = false;
                window.__v469PreviousSmokeError = String(e && e.message || e);
            }
            return !!ok && runTests();
        };
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
