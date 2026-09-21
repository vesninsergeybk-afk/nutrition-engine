// nutrition calculator v5.2.35_harvard_whatif_simulator
// Responsibility: non-mutating preview for Harvard Plate corrections with approximate HEI deltas.
// This is a safe second pass: no ration mutation, no independent HEI engine, no auto-apply.
(function () {
    'use strict';
    var VERSION = 'v5.2.38_harvard_whatif_state_safe';
    window.__V535_HARVARD_WHATIF_SIMULATOR__ = VERSION;
    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function num(v) { var n = Number(v); return Number.isFinite(n) ? n : 0; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, num(v))); }
    function fmt(n, d) { if (!Number.isFinite(Number(n)))
        return '—'; var s = Number(n).toFixed(d == null ? 0 : d); return s.replace(/\.0$/, ''); }
    function pct(n) { return fmt(n, n >= 10 ? 0 : 1) + '%'; }
    var HP_NAMES = [
        'HarvardPlateV549', 'HarvardPlateV548', 'HarvardPlateV547', 'HarvardPlateV546', 'HarvardPlateV545', 'HarvardPlateV544', 'HarvardPlateV543', 'HarvardPlateV542', 'HarvardPlateV541', 'HarvardPlateV540', 'HarvardPlateV539', 'HarvardPlateV538', 'HarvardPlateV537', 'HarvardPlateV536', 'HarvardPlateV534', 'HarvardPlateV531', 'HarvardPlateV530', 'HarvardPlateV5230', 'HarvardPlateV5223', 'HarvardPlateV5221',
        'HarvardPlateV529', 'HarvardPlateV528', 'HarvardPlateV527', 'HarvardPlateV526', 'HarvardPlateV525', 'HarvardPlateV524', 'HarvardPlateV523'
    ];
    var SECTORS = ['vegetables', 'fruits', 'wholeGrains', 'protein'];
    var SECTOR_LABEL = { vegetables: 'Овощи', fruits: 'Фрукты', wholeGrains: 'Цельные злаки', protein: 'Белковые продукты' };
    var TARGET = { vegetables: 35, fruits: 15, wholeGrains: 25, protein: 25 };
    var UNIT_GRAMS = {
        fruits_total: 150, fruits_whole: 150, vegetables_total: 130, greens_beans: 130,
        grains_whole: 85, dairy: 244, protein_total: 28.35, seafood_plant: 28.35,
        grains_refined: 85
    };
    // Conservative practical templates. Values are intentionally approximate;
    // exact result should be checked by adding a real product to the ration.
    var TEMPLATES = {
        veg_mix: { label: 'овощи без крахмала', plate: 'vegetables', kcal: 35, sodium: 20, sfa: 0.05, unsat: 0.2, sugar: 0, vegetables_total: 100 / 130, greens_beans: 45 / 130 },
        leafy_greens: { label: 'зелень/листовые овощи', plate: 'vegetables', kcal: 25, sodium: 25, sfa: 0.05, unsat: 0.2, sugar: 0, vegetables_total: 100 / 130, greens_beans: 100 / 130 },
        fruit_fresh: { label: 'цельный фрукт/ягоды', plate: 'fruits', kcal: 55, sodium: 2, sfa: 0.05, unsat: 0.1, sugar: 0, fruits_total: 100 / 150, fruits_whole: 100 / 150 },
        buckwheat_cooked: { label: 'гречка варёная', plate: 'wholeGrains', kcal: 110, sodium: 2, sfa: 0.1, unsat: 0.7, sugar: 0, grains_whole: 100 / 85 },
        oatmeal_cooked: { label: 'овсянка на воде', plate: 'wholeGrains', kcal: 70, sodium: 2, sfa: 0.2, unsat: 1.2, sugar: 0, grains_whole: 100 / 85 },
        brown_rice_cooked: { label: 'бурый рис варёный', plate: 'wholeGrains', kcal: 112, sodium: 1, sfa: 0.2, unsat: 0.8, sugar: 0, grains_whole: 100 / 85 },
        fish: { label: 'рыба нежирная/умеренная', plate: 'protein', kcal: 130, sodium: 70, sfa: 0.8, unsat: 3.5, sugar: 0, protein_total: 100 / 28.35, seafood_plant: 100 / 28.35 },
        chicken: { label: 'птица без кожи', plate: 'protein', kcal: 165, sodium: 70, sfa: 1.1, unsat: 3.0, sugar: 0, protein_total: 100 / 28.35 },
        beans: { label: 'бобовые готовые', plate: 'protein', kcal: 125, sodium: 5, sfa: 0.1, unsat: 0.5, sugar: 0, protein_total: 100 / 28.35, seafood_plant: 100 / 28.35, vegetables_total: 70 / 130, greens_beans: 70 / 130 },
        tofu: { label: 'тофу', plate: 'protein', kcal: 90, sodium: 15, sfa: 0.7, unsat: 3.8, sugar: 0, protein_total: 100 / 28.35, seafood_plant: 100 / 28.35 },
        kefir: { label: 'кефир/йогурт без сахара', plate: null, kcal: 55, sodium: 45, sfa: 1.1, unsat: 0.5, sugar: 0, dairy: 100 / 244 },
        milk: { label: 'молоко', plate: null, kcal: 55, sodium: 40, sfa: 1.0, unsat: 0.5, sugar: 0, dairy: 100 / 244 }
    };
    var REDUCE_PROFILE = {
        vegetables: { kcal: 30, sodium: 20, sfa: 0.05, unsat: 0.15, sugar: 0, vegetables_total: 100 / 130 },
        fruits: { kcal: 60, sodium: 2, sfa: 0.05, unsat: 0.1, sugar: 0, fruits_total: 100 / 150, fruits_whole: 100 / 150 },
        wholeGrains: { kcal: 110, sodium: 2, sfa: 0.1, unsat: 0.8, sugar: 0, grains_whole: 100 / 85 },
        protein: { kcal: 150, sodium: 70, sfa: 1.0, unsat: 2.5, sugar: 0, protein_total: 100 / 28.35 }
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
    function heiModel() { return window.__lastHEIModel || null; }
    function std() { return window.HEI && window.HEI.helpers && window.HEI.helpers.STD ? window.HEI.helpers.STD : null; }
    function sector(model, id) { return model && model.stage && model.stage.sectors ? (model.stage.sectors[id] || {}) : {}; }
    function sectorGrams(model, id) { return Number(sector(model, id).grams) || 0; }
    function sectorPct(model, id) {
        var s = sector(model, id);
        if (Number.isFinite(Number(s.actualPercent)))
            return Number(s.actualPercent);
        var core = Number(model && model.coreMass) || 0, g = sectorGrams(model, id);
        return core > 0 ? 100 * g / core : 0;
    }
    function currentCore(model) { return Math.max(0, SECTORS.reduce(function (a, k) { return a + sectorGrams(model, k); }, 0)); }
    function maxSurplusSector(model) {
        var best = 'vegetables', bestOver = -999;
        SECTORS.forEach(function (id) {
            var over = sectorPct(model, id) - (TARGET[id] || 25);
            if (over > bestOver) {
                bestOver = over;
                best = id;
            }
        });
        return best;
    }
    function baseRaw(hei) {
        var eRef = Math.max(1, Number(hei.energyRefKcal) || 2000);
        var d = hei.density || {};
        var intake = hei.intake || {};
        return {
            eRef: eRef,
            energy: Math.max(1, Number(intake.energy_kcal) || eRef),
            fruits_total: (Number(d.fruits_total) || 0) * (eRef / 1000),
            fruits_whole: (Number(d.fruits_whole) || 0) * (eRef / 1000),
            vegetables_total: (Number(d.vegetables_total) || 0) * (eRef / 1000),
            greens_beans: (Number(d.greens_beans) || 0) * (eRef / 1000),
            grains_whole: (Number(d.grains_whole) || 0) * (eRef / 1000),
            grains_refined: (Number(d.grains_refined) || 0) * (eRef / 1000),
            dairy: (Number(d.dairy) || 0) * (eRef / 1000),
            protein_total: (Number(d.protein_total) || 0) * (eRef / 1000),
            seafood_plant: (Number(d.seafood_plant) || 0) * (eRef / 1000),
            sodium_mg: Math.max(0, Number(intake.sodium_mg) || 0),
            sfa_g: Math.max(0, Number(intake.fatty_sfa_g) || 0),
            unsat_g: Math.max(0, Number(intake.fatty_unsat_g) || 0),
            added_sugars_g: Math.max(0, Number(intake.added_sugars_g) || 0)
        };
    }
    function applyTemplate(raw, tpl, grams, sign) {
        grams = Math.max(0, Number(grams) || 0);
        sign = sign || 1;
        var f = sign * grams / 100;
        raw.energy = Math.max(1, raw.energy + f * (tpl.kcal || 0));
        raw.sodium_mg = Math.max(0, raw.sodium_mg + f * (tpl.sodium || 0));
        raw.sfa_g = Math.max(0, raw.sfa_g + f * (tpl.sfa || 0));
        raw.unsat_g = Math.max(0, raw.unsat_g + f * (tpl.unsat || 0));
        raw.added_sugars_g = Math.max(0, raw.added_sugars_g + f * (tpl.sugar || 0));
        ['fruits_total', 'fruits_whole', 'vegetables_total', 'greens_beans', 'grains_whole', 'grains_refined', 'dairy', 'protein_total', 'seafood_plant'].forEach(function (k) {
            if (tpl[k])
                raw[k] = Math.max(0, raw[k] + f * tpl[k]);
        });
    }
    function rawToDensity(raw) {
        var eRef = raw.eRef;
        var d = {
            fruits_total: raw.fruits_total / (eRef / 1000),
            fruits_whole: raw.fruits_whole / (eRef / 1000),
            vegetables_total: raw.vegetables_total / (eRef / 1000),
            greens_beans: raw.greens_beans / (eRef / 1000),
            grains_whole: raw.grains_whole / (eRef / 1000),
            grains_refined: raw.grains_refined / (eRef / 1000),
            dairy: raw.dairy / (eRef / 1000),
            protein_total: raw.protein_total / (eRef / 1000),
            seafood_plant: raw.seafood_plant / (eRef / 1000),
            sodium_g: (raw.sodium_mg / 1000) / (eRef / 1000),
            added_sugars_pct: (raw.added_sugars_g * 4) / Math.max(1, raw.energy) * 100,
            sat_fats_pct: (raw.sfa_g * 9) / Math.max(1, raw.energy) * 100,
            fatty_acids_ratio: raw.sfa_g > 0 ? raw.unsat_g / raw.sfa_g : (raw.unsat_g > 0 ? 99 : 0)
        };
        return d;
    }
    function scoreRaw(raw) {
        if (!window.HEI || typeof window.HEI.scoreFromDensity !== 'function')
            return null;
        try {
            return window.HEI.scoreFromDensity(rawToDensity(raw), raw.energy, raw.eRef);
        }
        catch (_) {
            return null;
        }
    }
    function platePreview(model, actions) {
        var grams = {};
        SECTORS.forEach(function (k) { grams[k] = sectorGrams(model, k); });
        actions.forEach(function (a) {
            if (a.type === 'add') {
                var tpl = TEMPLATES[a.template];
                if (tpl && tpl.plate)
                    grams[tpl.plate] += Math.max(0, Number(a.grams) || 0);
            }
            else if (a.type === 'reduce') {
                grams[a.sector] = Math.max(0, grams[a.sector] - (Number(a.grams) || 0));
            }
        });
        var core = SECTORS.reduce(function (a, k) { return a + grams[k]; }, 0);
        var pct = {};
        SECTORS.forEach(function (k) { pct[k] = core > 0 ? 100 * grams[k] / core : 0; });
        pct.vegFruit = (pct.vegetables || 0) + (pct.fruits || 0);
        return { grams: grams, core: core, pct: pct };
    }
    function structureStatus(p) {
        var vf = p.vegFruit, wg = p.wholeGrains || 0, pr = p.protein || 0;
        if (vf >= 45 && vf <= 60 && wg >= 18 && wg <= 32 && pr >= 18 && pr <= 32)
            return 'близко к ориентиру';
        if (vf > 70 || vf < 35 || wg < 10 || pr < 12)
            return 'выраженный перекос';
        return 'умеренный перекос';
    }
    function diff(a, b, d) { return (b - a >= 0 ? '+' : '') + fmt(b - a, d == null ? 1 : d); }
    function defaultState(model) {
        var surplus = maxSurplusSector(model);
        var veg = sectorPct(model, 'vegetables') < 32 ? 180 : 0;
        var fr = sectorPct(model, 'fruits') < 8 ? 140 : 0;
        var wg = sectorPct(model, 'wholeGrains') < 18 ? 120 : 0;
        var pr = sectorPct(model, 'protein') < 18 ? 120 : 0;
        var reduce = 0;
        if (surplus && sectorPct(model, surplus) > (TARGET[surplus] || 25) + 10)
            reduce = Math.min(200, Math.round(sectorGrams(model, surplus) * 0.25 / 10) * 10);
        return { veg: veg, vegTpl: 'veg_mix', fr: fr, frTpl: 'fruit_fresh', wg: wg, wgTpl: 'buckwheat_cooked', pr: pr, prTpl: 'fish', dairy: 0, dairyTpl: 'kefir', reduce: reduce, reduceSector: surplus || 'vegetables' };
    }
    function ensureHost() {
        var panel = $('harvardPlatePanel');
        if (!panel)
            return null;
        var smart = $('harvardSmartRebalance');
        var layout = panel.querySelector('.harvard-plate-layout');
        var host = $('harvardWhatIfSimulator');
        if (!host) {
            host = document.createElement('section');
            host.id = 'harvardWhatIfSimulator';
            host.className = 'hpwi';
            host.setAttribute('aria-label', 'Симулятор коррекции Гарвардской тарелки');
            if (smart)
                smart.insertAdjacentElement('afterend', host);
            else if (layout)
                layout.insertAdjacentElement('afterend', host);
            else
                panel.appendChild(host);
        }
        return host;
    }
    function optionHtml(group, selected) {
        return group.map(function (k) {
            return '<option value="' + esc(k) + '" ' + (k === selected ? 'selected' : '') + '>' + esc(TEMPLATES[k].label) + '</option>';
        }).join('');
    }
    function sectorOptions(selected) {
        return SECTORS.map(function (k) {
            return '<option value="' + esc(k) + '" ' + (k === selected ? 'selected' : '') + '>' + esc(SECTOR_LABEL[k]) + '</option>';
        }).join('');
    }
    function controlRange(id, label, value, max, suffix) {
        return '<label class="hpwi-control"><span>' + esc(label) + '</span><output id="' + esc(id) + 'Out">' + esc(fmt(value, 0) + ' ' + suffix) + '</output><input id="' + esc(id) + '" type="range" min="0" max="' + esc(max) + '" step="10" value="' + esc(value) + '"></label>';
    }
    function stateFromScenario(model, base) {
        var st = Object.assign({}, base || defaultState(model));
        var sc = window.__HARVARD_RECOMMENDATION_SCENARIO__;
        if (!sc || !sc.sector)
            return st;
        // Recommendation check should show one clear scenario, not a pile of unrelated default sliders.
        st.veg = 0;
        st.fr = 0;
        st.wg = 0;
        st.pr = 0;
        st.dairy = 0;
        st.reduce = 0;
        var grams = Math.max(0, Number(sc.grams) || 0);
        if (sc.action === 'reduce') {
            st.reduce = grams || 120;
            st.reduceSector = sc.sector || st.reduceSector;
            return st;
        }
        if (sc.sector === 'vegetables') {
            st.veg = grams || 180;
            st.vegTpl = sc.template || 'veg_mix';
        }
        else if (sc.sector === 'fruits') {
            st.fr = grams || 140;
            st.frTpl = sc.template || 'fruit_fresh';
        }
        else if (sc.sector === 'wholeGrains') {
            st.wg = grams || 120;
            st.wgTpl = sc.template || 'buckwheat_cooked';
        }
        else if (sc.sector === 'protein') {
            st.pr = grams || 120;
            st.prTpl = sc.template || 'fish';
        }
        return st;
    }
    function readState(model) {
        var d = stateFromScenario(model, defaultState(model));
        var host = $('harvardWhatIfSimulator');
        if (!host)
            return d;
        function val(id, fallback) { var el = $(id); return el ? Number(el.value) || 0 : fallback; }
        function sel(id, fallback) { var el = $(id); return el ? el.value : fallback; }
        return {
            veg: val('hpwiVegetables', d.veg), vegTpl: sel('hpwiVegetablesTpl', d.vegTpl),
            fr: val('hpwiFruits', d.fr), frTpl: sel('hpwiFruitsTpl', d.frTpl),
            wg: val('hpwiWholeGrains', d.wg), wgTpl: sel('hpwiWholeGrainsTpl', d.wgTpl),
            pr: val('hpwiProtein', d.pr), prTpl: sel('hpwiProteinTpl', d.prTpl),
            dairy: val('hpwiDairy', d.dairy), dairyTpl: sel('hpwiDairyTpl', d.dairyTpl),
            reduce: val('hpwiReduce', d.reduce), reduceSector: sel('hpwiReduceSector', d.reduceSector)
        };
    }
    function actionsFromState(st) {
        var actions = [];
        if (st.veg > 0)
            actions.push({ type: 'add', template: st.vegTpl, grams: st.veg });
        if (st.fr > 0)
            actions.push({ type: 'add', template: st.frTpl, grams: st.fr });
        if (st.wg > 0)
            actions.push({ type: 'add', template: st.wgTpl, grams: st.wg });
        if (st.pr > 0)
            actions.push({ type: 'add', template: st.prTpl, grams: st.pr });
        if (st.dairy > 0)
            actions.push({ type: 'add', template: st.dairyTpl, grams: st.dairy });
        if (st.reduce > 0)
            actions.push({ type: 'reduce', sector: st.reduceSector, grams: st.reduce });
        return actions;
    }
    function simulate(model, hei, st) {
        var raw = baseRaw(hei);
        var actions = actionsFromState(st);
        actions.forEach(function (a) {
            if (a.type === 'add') {
                applyTemplate(raw, TEMPLATES[a.template], a.grams, 1);
            }
            else if (a.type === 'reduce') {
                applyTemplate(raw, REDUCE_PROFILE[a.sector] || REDUCE_PROFILE.vegetables, a.grams, -1);
            }
        });
        var scored = scoreRaw(raw);
        var plate = platePreview(model, actions);
        return { raw: raw, score: scored, plate: plate, actions: actions };
    }
    function smallBar(label, before, after, target) {
        var w = clamp(after, 0, 100);
        return '<div class="hpwi-bar"><div><strong>' + esc(label) + '</strong><span>' + esc(pct(before) + ' → ' + pct(after)) + '</span></div><i style="--hpwi-pct:' + w + '%;--hpwi-target:' + clamp(target, 0, 100) + '%"><b></b><em></em></i></div>';
    }
    function renderPreview(model, hei, st) {
        var sim = simulate(model, hei, st);
        var before = {
            vegFruit: sectorPct(model, 'vegetables') + sectorPct(model, 'fruits'),
            wholeGrains: sectorPct(model, 'wholeGrains'),
            protein: sectorPct(model, 'protein')
        };
        var p = sim.plate.pct;
        var oldTotal = Number(hei.total) || 0;
        var newTotal = sim.score ? Number(sim.score.total) || oldTotal : oldTotal;
        var kcalDelta = sim.raw.energy - ((hei.intake && Number(hei.intake.energy_kcal)) || sim.raw.eRef);
        var sodiumDelta = sim.raw.sodium_mg - ((hei.intake && Number(hei.intake.sodium_mg)) || 0);
        var sfaDelta = sim.raw.sfa_g - ((hei.intake && Number(hei.intake.fatty_sfa_g)) || 0);
        var keyDeltas = '';
        if (sim.score && sim.score.points && hei.points) {
            ['grains_whole', 'protein_total', 'seafood_plant', 'dairy', 'sodium_g', 'sat_fats_pct', 'added_sugars_pct'].forEach(function (k) {
                var a = Number(hei.points[k]), b = Number(sim.score.points[k]);
                if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) >= 0.15) {
                    var label = std() && std()[k] ? std()[k].label : k;
                    keyDeltas += '<li><span>' + esc(label) + '</span><strong>' + (b - a >= 0 ? '+' : '') + esc(fmt(b - a, 1)) + '</strong></li>';
                }
            });
        }
        if (!keyDeltas)
            keyDeltas = '<li><span>Крупных изменений компонентов HEI</span><strong>нет</strong></li>';
        return '<div class="hpwi-preview">' +
            '<div class="hpwi-result-head"><strong>Прогноз без изменения рациона</strong><span>HEI ' + esc(fmt(oldTotal, 1)) + ' → ' + esc(fmt(newTotal, 1)) + ' (' + esc(diff(oldTotal, newTotal, 1)) + ')</span></div>' +
            '<div class="hpwi-bars">' +
            smallBar('Овощи + фрукты', before.vegFruit, p.vegFruit, 50) +
            smallBar('Цельные злаки', before.wholeGrains, p.wholeGrains, 25) +
            smallBar('Белковые продукты', before.protein, p.protein, 25) +
            '</div>' +
            '<div class="hpwi-status"><span>Структура станет: <b>' + esc(structureStatus(p)) + '</b></span><span>Ккал: ' + esc((kcalDelta >= 0 ? '+' : '') + fmt(kcalDelta, 0)) + '</span><span>Натрий: ' + esc((sodiumDelta >= 0 ? '+' : '') + fmt(sodiumDelta, 0)) + ' мг</span><span>НЖК: ' + esc((sfaDelta >= 0 ? '+' : '') + fmt(sfaDelta, 1)) + ' г</span></div>' +
            '<details class="hpwi-deltas" ' + ((window.__HPWI_DELTAS_OPEN__) ? 'open' : '') + '><summary>Компоненты HEI, которые заметно изменятся</summary><ul>' + keyDeltas + '</ul></details>' +
            '<p class="hpwi-note"><strong>Важно:</strong> это только пробный расчёт по шаблонам. Рацион не изменится, пока вы не примените план ниже или не добавите продукты вручную.</p>' +
            '</div>';
    }
    function bindControls(host, model, hei) {
        if (host.__hpwiBound)
            return;
        host.__hpwiBound = true;
        host.addEventListener('input', function (e) {
            if (!e.target || !e.target.id || e.target.id.indexOf('hpwi') !== 0)
                return;
            updatePreview();
        });
        host.addEventListener('change', function (e) {
            if (!e.target || !e.target.id || e.target.id.indexOf('hpwi') !== 0)
                return;
            updatePreview();
        });
    }
    function updateOutputs(st) {
        [
            ['hpwiVegetables', st.veg, 'г'], ['hpwiFruits', st.fr, 'г'],
            ['hpwiWholeGrains', st.wg, 'г'], ['hpwiProtein', st.pr, 'г'], ['hpwiDairy', st.dairy, 'мл/г'], ['hpwiReduce', st.reduce, 'г']
        ].forEach(function (x) {
            var o = $(x[0] + 'Out');
            if (o)
                o.textContent = fmt(x[1], 0) + ' ' + x[2];
        });
    }
    function updatePreview() {
        var model = hpModel(), hei = heiModel();
        if (!model || !hei)
            return;
        var st = readState(model);
        updateOutputs(st);
        var box = $('hpwiPreview');
        if (box)
            box.innerHTML = renderPreview(model, hei, st);
    }
    function stableSetHtml(host, html) {
        if (!host)
            return false;
        if (host.__lastStableHtml === html)
            return false;
        host.innerHTML = html;
        host.__lastStableHtml = html;
        return true;
    }
    function render() {
        var host = ensureHost();
        if (!host)
            return;
        var model = hpModel(), hei = heiModel();
        var opened = host.querySelector('.hpwi-shell') ? host.querySelector('.hpwi-shell').open : false;
        var deltasOpen = host.querySelector('.hpwi-deltas') ? host.querySelector('.hpwi-deltas').open : false;
        window.__HPWI_DELTAS_OPEN__ = !!deltasOpen;
        if (!model || !model.ready || model.empty || !(Number(model.coreMass) > 0) || !hei) {
            stableSetHtml(host, '<details class="hpwi-shell" ' + (opened ? 'open' : '') + '><summary><span>Дополнительно</span><strong>проверка варианта ждёт данные</strong></summary><div class="hpwi-intro"><strong>Что это:</strong><span>необязательный симулятор: показывает возможный эффект, но сам рацион не меняет.</span></div><p>Добавьте продукты и дождитесь расчёта HEI.</p></details>');
            return;
        }
        var st = readState(model); // preserve user-selected sliders/selects across safe refreshes
        var html = '<details class="hpwi-shell" ' + (opened ? 'open' : '') + '>' +
            '<summary><span>Дополнительно</span><strong>проверить вариант из рекомендации</strong></summary>' +
            '<div class="hpwi-intro"><strong>Когда использовать:</strong><span>открывайте этот блок после карточки рекомендации выше: здесь можно проверить эффект до изменения рациона.</span></div>' +
            (window.__HARVARD_RECOMMENDATION_SCENARIO__ ? '<div class="hpwi-selected-scenario">Выбран вариант из рекомендации: ' + esc(SECTOR_LABEL[window.__HARVARD_RECOMMENDATION_SCENARIO__.sector] || window.__HARVARD_RECOMMENDATION_SCENARIO__.sector) + ' · ' + esc(window.__HARVARD_RECOMMENDATION_SCENARIO__.action === 'reduce' ? 'сокращение' : 'добавление') + ' ' + esc(fmt(window.__HARVARD_RECOMMENDATION_SCENARIO__.grams, 0)) + ' г</div>' : '') +
            '<ol class="hpwi-steps"><li>Выберите, что добавить или уменьшить.</li><li>Смотрите прогноз по тарелке, HEI, калориям, натрию и НЖК.</li><li>Если вариант подходит, примените его через блок «План применения» или добавьте продукты вручную.</li></ol>' +
            '<div class="hpwi-grid">' +
            '<div class="hpwi-controls">' +
            '<div class="hpwi-row"><label><span>Овощи</span><select id="hpwiVegetablesTpl">' + optionHtml(['veg_mix', 'leafy_greens'], st.vegTpl) + '</select></label>' + controlRange('hpwiVegetables', 'Добавить', st.veg, 400, 'г') + '</div>' +
            '<div class="hpwi-row"><label><span>Фрукты</span><select id="hpwiFruitsTpl">' + optionHtml(['fruit_fresh'], st.frTpl) + '</select></label>' + controlRange('hpwiFruits', 'Добавить', st.fr, 300, 'г') + '</div>' +
            '<div class="hpwi-row"><label><span>Цельные злаки</span><select id="hpwiWholeGrainsTpl">' + optionHtml(['buckwheat_cooked', 'oatmeal_cooked', 'brown_rice_cooked'], st.wgTpl) + '</select></label>' + controlRange('hpwiWholeGrains', 'Добавить', st.wg, 250, 'г') + '</div>' +
            '<div class="hpwi-row"><label><span>Белковая часть</span><select id="hpwiProteinTpl">' + optionHtml(['fish', 'chicken', 'beans', 'tofu'], st.prTpl) + '</select></label>' + controlRange('hpwiProtein', 'Добавить', st.pr, 250, 'г') + '</div>' +
            '<div class="hpwi-row"><label><span>Молочная группа</span><select id="hpwiDairyTpl">' + optionHtml(['kefir', 'milk'], st.dairyTpl) + '</select></label>' + controlRange('hpwiDairy', 'Добавить', st.dairy, 500, 'мл/г') + '</div>' +
            '<div class="hpwi-row"><label><span>Сократить сектор</span><select id="hpwiReduceSector">' + sectorOptions(st.reduceSector) + '</select></label>' + controlRange('hpwiReduce', 'Уменьшить', st.reduce, 400, 'г') + '</div>' +
            '</div>' +
            '<div id="hpwiPreview">' + renderPreview(model, hei, st) + '</div>' +
            '</div>' +
            '</details>';
        var changed = stableSetHtml(host, html);
        if (changed)
            bindControls(host, model, hei);
    }
    function schedule() {
        clearTimeout(schedule._t);
        schedule._t = setTimeout(render, 120);
        setTimeout(updatePreview, 380);
    }
    function init() {
        window.addEventListener('harvard:recommendation-check', function (e) {
            try {
                if (e && e.detail)
                    window.__HARVARD_RECOMMENDATION_SCENARIO__ = e.detail;
                render();
                var shell = $('harvardWhatIfSimulator') && $('harvardWhatIfSimulator').querySelector('.hpwi-shell');
                if (shell)
                    shell.open = true;
                updatePreview();
            }
            catch (_) { }
        });
        schedule();
        ['ration:changed', 'hei:rendered', 'hei:watchdog-recomputed', 'hei:forced-recompute', 'needs:changed', 'storage'].forEach(function (ev) { window.addEventListener(ev, schedule); });
        var bootPulses = 0;
        var bootTimer = setInterval(function () {
            bootPulses += 1;
            schedule();
            if (bootPulses >= 8)
                clearInterval(bootTimer);
        }, 800);
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
