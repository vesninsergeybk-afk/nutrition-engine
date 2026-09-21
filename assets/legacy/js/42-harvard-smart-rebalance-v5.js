// nutrition calculator v5.2.34_smart_rebalance_hints
// Responsibility: first-pass HEI-aware correction hints for Harvard Plate.
// This module does NOT mutate the ration and does NOT recalculate HEI independently.
// It reads the existing HEI model and Harvard Plate model and produces conservative guidance.
(function () {
    'use strict';
    var VERSION = 'v5.3.155_calculation_core_ssot_pass1';
    window.__V534_SMART_REBALANCE_HINTS__ = VERSION;
    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function num(v) { var n = Number(v); return Number.isFinite(n) ? n : 0; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, num(v))); }
    function fmt(n, d) { if (!Number.isFinite(Number(n)))
        return '—'; var s = Number(n).toFixed(d == null ? 0 : d); return s.replace(/\.0$/, ''); }
    function pct(n) { return fmt(n, n >= 10 ? 0 : 1) + '%'; }
    var HP_NAMES = [
        'HarvardPlateV5329', 'HarvardPlateV5328', 'HarvardPlateV549', 'HarvardPlateV548', 'HarvardPlateV547', 'HarvardPlateV546', 'HarvardPlateV545', 'HarvardPlateV544', 'HarvardPlateV543', 'HarvardPlateV542', 'HarvardPlateV541', 'HarvardPlateV540', 'HarvardPlateV539', 'HarvardPlateV538', 'HarvardPlateV537', 'HarvardPlateV536', 'HarvardPlateV531', 'HarvardPlateV530', 'HarvardPlateV5230', 'HarvardPlateV5223', 'HarvardPlateV5221',
        'HarvardPlateV529', 'HarvardPlateV528', 'HarvardPlateV527', 'HarvardPlateV526',
        'HarvardPlateV525', 'HarvardPlateV524', 'HarvardPlateV523'
    ];
    var TARGETS = { vegetables: 35, fruits: 15, wholeGrains: 25, protein: 25 };
    var UNIT_GRAMS = {
        vegetables_total: 130, greens_beans: 130, fruits_total: 150, fruits_whole: 150,
        dairy: 244, grains_whole: 85, protein_total: 28.35, seafood_plant: 28.35
    };
    var SECTOR_META = {
        vegetables: {
            label: 'Овощи',
            target: 35,
            hei: ['vegetables_total', 'greens_beans'],
            mainHei: 'vegetables_total',
            unitKey: 'vegetables_total',
            addStep: 150,
            addText: 'овощной гарнир или салат',
            reduceText: 'часть овощной порции',
            safeNote: 'если сокращать обычные овощи, сохраняя зелень и бобовые'
        },
        fruits: {
            label: 'Фрукты',
            target: 15,
            hei: ['fruits_total', 'fruits_whole'],
            mainHei: 'fruits_total',
            unitKey: 'fruits_total',
            addStep: 150,
            addText: 'цельный фрукт или ягоды',
            reduceText: 'часть фруктовой порции',
            safeNote: 'если HEI по фруктам уже закрыт'
        },
        wholeGrains: {
            label: 'Цельные злаки',
            target: 25,
            hei: ['grains_whole'],
            mainHei: 'grains_whole',
            unitKey: 'grains_whole',
            addStep: 85,
            addText: 'гречка, овсянка, бурый рис или цельнозерновой хлеб',
            reduceText: 'часть цельнозернового гарнира',
            safeNote: 'если HEI по цельным злакам уже закрыт'
        },
        protein: {
            label: 'Белковые продукты',
            target: 25,
            hei: ['protein_total', 'seafood_plant'],
            mainHei: 'protein_total',
            unitKey: 'protein_total',
            addStep: 120,
            addText: 'рыба, птица, яйца, бобовые или тофу',
            reduceText: 'часть белкового блюда',
            safeNote: 'если HEI по белку уже закрыт; качество белка всё равно проверяется через HEI'
        }
    };
    function hpApi() {
        for (var i = 0; i < HP_NAMES.length; i++) {
            var api = window[HP_NAMES[i]];
            if (api && (typeof api.getModel === 'function' || api.__lastModel))
                return api;
        }
        return null;
    }
    function hpModel() {
        var api = hpApi();
        if (!api)
            return null;
        try {
            if (typeof api.getModel === 'function')
                return api.getModel();
        }
        catch (_) { }
        return api.__lastModel || null;
    }
    function sector(model, id) {
        return model && model.stage && model.stage.sectors ? (model.stage.sectors[id] || {}) : {};
    }
    function sectorGrams(model, id) { return Number(sector(model, id).grams) || 0; }
    function sectorPct(model, id) {
        var s = sector(model, id);
        if (Number.isFinite(Number(s.actualPercent)))
            return Number(s.actualPercent);
        var core = Number(model && model.coreMass) || 0;
        var g = sectorGrams(model, id);
        return core > 0 ? 100 * g / core : 0;
    }
    function heiModel() { return window.__lastHEIModel || null; }
    function heiRows() { return Array.isArray(window.__lastHEIRows) ? window.__lastHEIRows : []; }
    function std() { return window.HEI && window.HEI.helpers && window.HEI.helpers.STD ? window.HEI.helpers.STD : null; }
    function heiScoreFor(key) {
        var m = heiModel();
        return m && m.points && Number.isFinite(Number(m.points[key])) ? Number(m.points[key]) : NaN;
    }
    function heiMaxFor(key) {
        var S = std();
        return S && S[key] && Number.isFinite(Number(S[key].pts)) ? Number(S[key].pts) : (key === 'fruits_total' || key === 'fruits_whole' || key === 'vegetables_total' || key === 'greens_beans' || key === 'protein_total' || key === 'seafood_plant' ? 5 : 10);
    }
    function heiLabel(key) {
        var S = std();
        return S && S[key] && S[key].label ? S[key].label : key;
    }
    function densityFor(key) {
        var m = heiModel();
        return m && m.density && Number.isFinite(Number(m.density[key])) ? Number(m.density[key]) : 0;
    }
    function energyRef() {
        var m = heiModel();
        return Math.max(1, Number(m && m.energyRefKcal) || 2000);
    }
    function isMaxed(key) {
        var s = heiScoreFor(key), max = heiMaxFor(key);
        return Number.isFinite(s) && s >= max - 0.05;
    }
    function isWeak(key) {
        var s = heiScoreFor(key), max = heiMaxFor(key);
        return Number.isFinite(s) && s < max * 0.75;
    }
    function densityMin(key) {
        var S = std();
        return S && S[key] && Number.isFinite(Number(S[key].min)) ? Number(S[key].min) : 0;
    }
    function deficitGrams(key) {
        var d = densityFor(key), min = densityMin(key), e = energyRef(), unit = UNIT_GRAMS[key] || 0;
        return Math.max(0, (min - d) * (e / 1000) * unit);
    }
    function excessGramsAtMax(key) {
        var d = densityFor(key), min = densityMin(key), e = energyRef(), unit = UNIT_GRAMS[key] || 0;
        return Math.max(0, (d - min) * (e / 1000) * unit);
    }
    function simulateAdequacyAdd(key, grams) {
        var m = heiModel();
        if (!m || !window.HEI || typeof window.HEI.scoreFromDensity !== 'function')
            return null;
        var unit = UNIT_GRAMS[key] || 0;
        if (!unit)
            return null;
        var d = Object.assign({}, m.density || {});
        d[key] = Math.max(0, (Number(d[key]) || 0) + (grams / unit) / (energyRef() / 1000));
        try {
            return window.HEI.scoreFromDensity(d, (m.intake && m.intake.energy_kcal) || energyRef(), energyRef());
        }
        catch (_) {
            return null;
        }
    }
    function simulateAdequacyReduce(key, grams) {
        var m = heiModel();
        if (!m || !window.HEI || typeof window.HEI.scoreFromDensity !== 'function')
            return null;
        var unit = UNIT_GRAMS[key] || 0;
        if (!unit)
            return null;
        var d = Object.assign({}, m.density || {});
        d[key] = Math.max(0, (Number(d[key]) || 0) - (grams / unit) / (energyRef() / 1000));
        try {
            return window.HEI.scoreFromDensity(d, (m.intake && m.intake.energy_kcal) || energyRef(), energyRef());
        }
        catch (_) {
            return null;
        }
    }
    function plateAfterAdd(model, id, grams) {
        var core = Number(model && model.coreMass) || 0;
        var out = {};
        ['vegetables', 'fruits', 'wholeGrains', 'protein'].forEach(function (k) {
            var g = sectorGrams(model, k) + (k === id ? grams : 0);
            out[k] = core + grams > 0 ? 100 * g / (core + grams) : 0;
        });
        return out;
    }
    function plateAfterReplace(model, fromId, fromG, toId, toG) {
        var core = Number(model && model.coreMass) || 0;
        var out = {};
        var newCore = Math.max(1, core - fromG + toG);
        ['vegetables', 'fruits', 'wholeGrains', 'protein'].forEach(function (k) {
            var g = sectorGrams(model, k);
            if (k === fromId)
                g = Math.max(0, g - fromG);
            if (k === toId)
                g += toG;
            out[k] = 100 * g / newCore;
        });
        return out;
    }
    function reduceToTargetGrams(model, id) {
        var g = sectorGrams(model, id), core = Number(model && model.coreMass) || 0, target = (TARGETS[id] || 25) / 100;
        var other = Math.max(0, core - g);
        if (!g || !core || target <= 0 || target >= 1)
            return 0;
        var desired = (target / (1 - target)) * other;
        return Math.max(0, g - desired);
    }
    function strongestSurplus(model) {
        var best = null;
        Object.keys(SECTOR_META).forEach(function (id) {
            var share = sectorPct(model, id), target = TARGETS[id] || 25, over = share - target;
            if (over > 8 && (!best || over > best.over))
                best = { id: id, over: over, share: share };
        });
        return best;
    }
    function weakSectors(model) {
        return Object.keys(SECTOR_META).map(function (id) {
            return { id: id, share: sectorPct(model, id), deficit: (TARGETS[id] || 25) - sectorPct(model, id) };
        }).filter(function (x) { return x.deficit > 7; }).sort(function (a, b) { return b.deficit - a.deficit; });
    }
    function makeAddHint(model, id) {
        var meta = SECTOR_META[id], key = meta.mainHei, step = meta.addStep;
        var sim = simulateAdequacyAdd(key, step);
        var cur = heiScoreFor(key), max = heiMaxFor(key);
        var delta = sim && sim.points && Number.isFinite(Number(cur)) ? (Number(sim.points[key]) - cur) : NaN;
        var p = plateAfterAdd(model, id, step);
        var title, body, tone = 'info';
        if (isWeak(key)) {
            title = 'Двойная польза';
            body = '+' + fmt(step, 0) + ' г: ' + meta.addText + ' — улучшит сектор «' + meta.label + '» в тарелке';
            if (Number.isFinite(delta) && delta > 0.05)
                body += ' и повысит HEI-компонент «' + heiLabel(key) + '» примерно на ' + fmt(delta, 1) + ' балла.';
            else
                body += ' и поддержит HEI-компонент «' + heiLabel(key) + '».';
            tone = 'good';
        }
        else {
            title = 'Структурная польза';
            body = '+' + fmt(step, 0) + ' г: ' + meta.addText + ' — улучшит структуру тарелки. HEI-компонент «' + heiLabel(key) + '» уже близок к максимуму, поэтому HEI может почти не измениться.';
            tone = 'neutral';
        }
        body += ' Доля сектора станет примерно ' + pct(p[id]) + '.';
        return { priority: tone === 'good' ? 1 : 2, tone: tone, title: title, body: body, kind: 'add-' + id };
    }
    function makeReduceHint(model, surplus) {
        var id = surplus.id, meta = SECTOR_META[id], key = meta.mainHei;
        var structuralReduce = reduceToTargetGrams(model, id);
        var safe = excessGramsAtMax(key);
        var amount = Math.max(0, Math.min(structuralReduce, safe || structuralReduce, sectorGrams(model, id) * 0.75));
        if (amount < 30)
            return null;
        amount = Math.round(amount / 10) * 10;
        var sim = simulateAdequacyReduce(key, amount);
        var cur = heiScoreFor(key);
        var after = sim && sim.points ? Number(sim.points[key]) : NaN;
        var noLoss = Number.isFinite(cur) && Number.isFinite(after) ? (after >= cur - 0.15) : isMaxed(key);
        var title = noLoss ? 'Можно уменьшить без потери HEI' : 'Уменьшать осторожно';
        var body = 'Сектор «' + meta.label + '» выше ориентира. Можно рассмотреть сокращение примерно на ' + fmt(amount, 0) + ' г';
        if (noLoss)
            body += ': HEI-компонент «' + heiLabel(key) + '» должен остаться около текущего уровня';
        else
            body += ': ниже этого уровня HEI-компонент «' + heiLabel(key) + '» может начать снижаться';
        body += '. ' + meta.safeNote + '.';
        return { priority: noLoss ? 1 : 4, tone: noLoss ? 'good' : 'warn', title: title, body: body, kind: 'reduce-' + id, reduceId: id, reduceGrams: amount };
    }
    function makeOnlyHEIHint(key) {
        var def = deficitGrams(key);
        if (def < 20)
            return null;
        var title = 'Улучшит HEI; структуру тарелки нужно проверить отдельно';
        var body = '', tone = 'neutral';
        if (key === 'dairy') {
            body = 'Молочная группа ниже HEI-ориентира. Практический шаг: 1 молочная порция — 200–250 мл кефира, молока или несладкого йогурта. Это улучшит HEI; дефицит белка или злаков в основной тарелке нужно закрывать отдельным шагом.';
        }
        else if (key === 'grains_refined') {
            body = 'HEI просит снизить рафинированные злаки. Это улучшит качество рациона, но само по себе не добавит цельные злаки в тарелку.';
        }
        else if (key === 'sodium_g') {
            body = 'HEI снижается из-за натрия. Сокращение соли, солёных соусов, сыров и полуфабрикатов улучшит HEI; сектора тарелки нужно выровнять отдельным шагом.';
            tone = 'warn';
        }
        else if (key === 'added_sugars_pct') {
            body = 'HEI снижается из-за добавленного сахара. Сокращение сладких напитков и десертов улучшит HEI; белковую часть и цельные злаки нужно оценить отдельно.';
            tone = 'warn';
        }
        else if (key === 'sat_fats_pct') {
            body = 'HEI снижается из-за насыщенных жиров. Замена жирных сыров, масла и переработанного мяса на более удачные варианты улучшит HEI.';
            tone = 'warn';
        }
        if (!body)
            return null;
        return { priority: 3, tone: tone, title: title, body: body, kind: 'hei-' + key };
    }
    function makeConflictHints(model) {
        var hints = [];
        if (isWeak('dairy') && (isWeak('sat_fats_pct') || isWeak('sodium_g'))) {
            hints.push({ priority: 4, tone: 'warn', title: 'Возможный конфликт', body: 'Добор молочных лучше делать не сыром и не сладкими йогуртами: сыр может ухудшить натрий и насыщенные жиры, сладкие йогурты — добавленный сахар.', kind: 'conflict-dairy' });
        }
        if (sectorPct(model, 'protein') < 18 && (isWeak('sodium_g') || isWeak('sat_fats_pct'))) {
            hints.push({ priority: 4, tone: 'warn', title: 'Возможный конфликт', body: 'Белковую часть лучше добирать рыбой, птицей, яйцами, бобовыми или тофу. Колбасы, сосиски и жирные сыры могут ухудшить натрий и насыщенные жиры.', kind: 'conflict-protein' });
        }
        return hints;
    }
    function makeReplacementHint(model, surplus, weak) {
        if (!surplus || !weak || !weak.length)
            return null;
        var from = surplus.id;
        var to = weak[0].id;
        if (from === to)
            return null;
        var fromAmt = Math.max(50, Math.min(200, Math.round((reduceToTargetGrams(model, from) || 120) / 10) * 10));
        var toMeta = SECTOR_META[to];
        var toAmt = to === 'protein' ? 120 : (to === 'wholeGrains' ? 85 : toMeta.addStep);
        var p = plateAfterReplace(model, from, fromAmt, to, toAmt);
        return {
            priority: 1,
            tone: 'good',
            title: 'Лучший формат — замена вместо добавки сверху',
            body: 'Попробуйте сценарий: −' + fmt(fromAmt, 0) + ' г «' + SECTOR_META[from].label + '» и +' + fmt(toAmt, 0) + ' г «' + toMeta.label + '». Тогда доля «' + toMeta.label + '» станет примерно ' + pct(p[to]) + ', а избыток «' + SECTOR_META[from].label + '» уменьшится. Это не замена грамм в грамм: обе массы рассчитаны отдельно для своих продуктовых групп. HEI-эффект зависит от конкретных продуктов.',
            kind: 'replace'
        };
    }
    function buildHints(model) {
        var hints = [];
        var weak = weakSectors(model);
        var surplus = strongestSurplus(model);
        weak.forEach(function (w) {
            if ((w.id === 'wholeGrains' || w.id === 'protein' || w.id === 'vegetables' || w.id === 'fruits') && hints.length < 4) {
                hints.push(makeAddHint(model, w.id));
            }
        });
        if (surplus) {
            var r = makeReduceHint(model, surplus);
            if (r)
                hints.push(r);
        }
        var repl = makeReplacementHint(model, surplus, weak);
        if (repl)
            hints.push(repl);
        ['dairy', 'sodium_g', 'added_sugars_pct', 'sat_fats_pct', 'grains_refined'].forEach(function (k) {
            if (isWeak(k)) {
                var h = makeOnlyHEIHint(k);
                if (h)
                    hints.push(h);
            }
        });
        hints = hints.concat(makeConflictHints(model));
        return hints.filter(Boolean).sort(function (a, b) { return a.priority - b.priority; }).slice(0, 7);
    }
    function toneClass(t) { return t === 'good' ? 'good' : (t === 'warn' ? 'warn' : (t === 'bad' ? 'bad' : 'neutral')); }
    function card(h) {
        return '<article class="hpsr-card" data-tone="' + esc(toneClass(h.tone)) + '">' +
            '<div class="hpsr-card-title">' + esc(h.title) + '</div>' +
            '<p>' + esc(h.body) + '</p>' +
            '</article>';
    }
    function ensureHost() {
        var panel = $('harvardPlatePanel');
        if (!panel)
            return null;
        var bridge = $('harvardHeiBridge');
        var layout = panel.querySelector('.harvard-plate-layout');
        var host = $('harvardSmartRebalance');
        if (!host) {
            host = document.createElement('section');
            host.id = 'harvardSmartRebalance';
            host.className = 'hpsr';
            host.setAttribute('aria-label', 'Умная коррекция Гарвардской тарелки с учётом HEI');
            if (layout)
                layout.insertAdjacentElement('afterend', host);
            else if (bridge)
                bridge.insertAdjacentElement('afterend', host);
            else
                panel.appendChild(host);
        }
        return host;
    }
    function stableSetHtml(host, html) {
        if (!host)
            return;
        if (host.__lastStableHtml === html)
            return;
        host.innerHTML = html;
        host.__lastStableHtml = html;
    }
    function render() {
        var host = ensureHost();
        if (!host)
            return;
        var model = hpModel(), hm = heiModel();
        var wasOpen = host.querySelector('.hpsr-shell') ? host.querySelector('.hpsr-shell').open : false;
        var moreOpen = host.querySelector('.hpsr-more') ? host.querySelector('.hpsr-more').open : false;
        if (!model || !model.ready || model.empty || !(Number(model.coreMass) > 0) || !hm) {
            stableSetHtml(host, '<details class="hpsr-shell" ' + (wasOpen ? 'open' : '') + '><summary><span>Дополнительный уровень</span><strong>Расширенный подбор ждёт данные</strong></summary><p>Основные рекомендации находятся выше в Гарвардской тарелке. Этот блок нужен только для дополнительных вариантов после расчёта HEI.</p></details>');
            return;
        }
        var hints = buildHints(model);
        window.__lastSmartRebalanceHints = hints;
        if (!hints.length) {
            stableSetHtml(host, '<details class="hpsr-shell" ' + (wasOpen ? 'open' : '') + '><summary><span>Дополнительный уровень</span><strong>Расширенный подбор не нужен</strong></summary><p>Основной блок рекомендаций выше не видит критичного структурного шага. Для тонкой настройки смотрите HEI.</p></details>');
            return;
        }
        var first = hints[0];
        stableSetHtml(host, '<details class="hpsr-shell" data-tone="' + esc(toneClass(first.tone)) + '" ' + (wasOpen ? 'open' : '') + '>' +
            '<summary><span>Дополнительный уровень</span><strong>Расширенный подбор вариантов</strong></summary>' +
            '<p class="hpsr-lead">Это второй уровень после основных рекомендаций выше. Используйте его, когда нужно сравнить несколько вариантов после основного диагноза.</p>' +
            '<div class="hpsr-list">' + hints.slice(0, 3).map(card).join('') + '</div>' +
            '<details class="hpsr-more" ' + (moreOpen ? 'open' : '') + '>' +
            '<summary>Показать остальные подсказки и методику</summary>' +
            '<div class="hpsr-list hpsr-list-extra">' + hints.slice(3).map(card).join('') + '</div>' +
            '<p class="hpsr-method">Этот блок даёт предварительную навигацию по возможным изменениям. Точные изменения HEI зависят от конкретных продуктов: рыба, бобовые, сыр, сосиски и сладкие йогурты дают разные последствия.</p>' +
            '</details>' +
            '</details>');
    }
    function schedule() {
        clearTimeout(schedule._t);
        schedule._t = setTimeout(render, 100);
        setTimeout(render, 360);
    }
    function init() {
        schedule();
        ['ration:changed', 'hei:rendered', 'hei:watchdog-recomputed', 'hei:forced-recompute', 'needs:changed', 'storage'].forEach(function (ev) {
            window.addEventListener(ev, schedule);
        });
        var bootPulses = 0;
        var bootTimer = setInterval(function () {
            bootPulses += 1;
            schedule();
            if (bootPulses >= 8)
                clearInterval(bootTimer);
        }, 700);
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
