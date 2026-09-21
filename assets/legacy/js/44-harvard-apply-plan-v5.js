// nutrition calculator v5.2.36_harvard_apply_plan
// Responsibility: reviewable application of Harvard Plate what-if correction.
// Safe design: no automatic mutation. The ration changes only after explicit user click + confirmation.
(function () {
    'use strict';
    var VERSION = 'v5.3.36_harvard_inline_plate_details_apply';
    window.__V536_HARVARD_APPLY_PLAN__ = VERSION;
    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function num(v) { var n = Number(v); return Number.isFinite(n) ? n : 0; }
    function fmt(n, d) { if (!Number.isFinite(Number(n)))
        return '—'; return Number(n).toFixed(d == null ? 0 : d).replace(/\.0$/, ''); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, num(v))); }
    var HP_NAMES = [
        'HarvardPlateV549', 'HarvardPlateV548', 'HarvardPlateV547', 'HarvardPlateV546', 'HarvardPlateV545', 'HarvardPlateV544', 'HarvardPlateV543', 'HarvardPlateV542', 'HarvardPlateV541', 'HarvardPlateV540', 'HarvardPlateV539', 'HarvardPlateV538', 'HarvardPlateV537', 'HarvardPlateV536', 'HarvardPlateV535', 'HarvardPlateV534', 'HarvardPlateV531', 'HarvardPlateV530', 'HarvardPlateV5230', 'HarvardPlateV5223', 'HarvardPlateV5221',
        'HarvardPlateV529', 'HarvardPlateV528', 'HarvardPlateV527', 'HarvardPlateV526', 'HarvardPlateV525', 'HarvardPlateV524', 'HarvardPlateV523'
    ];
    var SECTORS = ['vegetables', 'fruits', 'wholeGrains', 'protein'];
    var SECTOR_LABEL = { vegetables: 'Овощи', fruits: 'Фрукты', wholeGrains: 'Цельные злаки', protein: 'Белковые продукты' };
    var PRODUCT_TEMPLATES = {
        veg_mix: { key: 'cucumber_raw', label: 'Овощи без крахмала' },
        leafy_greens: { key: 'spinach_raw', label: 'Зелень/листовые овощи' },
        fruit_fresh: { key: 'apple', label: 'Цельный фрукт' },
        buckwheat_cooked: { key: 'buckwheat_cooked', label: 'Гречневая крупа варёная' },
        oatmeal_cooked: { key: 'oatmeal_cooked', label: 'Овсяная каша на воде' },
        brown_rice_cooked: { key: 'brown_rice_cooked', label: 'Рис бурый варёный' },
        fish: { key: 'cod_baked_spp', label: 'Треска запечённая' },
        chicken: { key: 'chicken_breast_cooked', label: 'Куриная грудка без кожи' },
        beans: { key: 'kidney_beans_boiled', label: 'Фасоль красная варёная' },
        tofu: { key: 'tofu_firm', label: 'Тофу плотный' },
        kefir: { key: 'kefir_1_pct', label: 'Кефир 1%' },
        milk: { key: 'milk_1_5_pct', label: 'Молоко 1,5%' }
    };
    var TEMPLATE_FALLBACKS = {
        veg_mix: ['tomato_raw', 'cucumber_raw', 'tomato_cherry_raw'],
        leafy_greens: ['spinach_raw', 'spinach_boiled'],
        fruit_fresh: ['orange', 'strawberry', 'pineapple'],
        fish: ['pollock_baked_spp', 'tuna_canned_water', 'salmon_atlantic_baked'],
        chicken: ['chicken_breast_cooked', 'chicken_thigh_cooked'],
        beans: ['black_beans_boiled', 'edamame_boiled'],
        tofu: ['tofu_firm_spp', 'green_line_tofu_classic_200g'],
        kefir: ['kefir_plain', 'kefir_3_2_pct'],
        milk: ['milk_0_5_pct', 'milk_3_2_pct']
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
    function dbProduct(key) {
        try {
            if (window.DB && window.DB.byKey && typeof window.DB.byKey.get === 'function')
                return window.DB.byKey.get(key) || null;
        }
        catch (_) { }
        return null;
    }
    function resolveTemplate(tplKey) {
        var t = PRODUCT_TEMPLATES[tplKey];
        if (t && dbProduct(t.key))
            return { key: t.key, label: (dbProduct(t.key).name_ru || t.label) };
        var fall = TEMPLATE_FALLBACKS[tplKey] || [];
        for (var i = 0; i < fall.length; i++) {
            var p = dbProduct(fall[i]);
            if (p)
                return { key: p.key, label: p.name_ru || p.key };
        }
        return t || null;
    }
    function ration() {
        try {
            if (window.State && typeof window.State.get === 'function')
                return window.State.get();
        }
        catch (_) { }
        return [];
    }
    function rationMap() {
        var m = {};
        ration().forEach(function (it) { m[it.key] = Number(it.grams) || 0; });
        return m;
    }
    function sectorDetails(model, sectorId) {
        return model && model.built && Array.isArray(model.built.details)
            ? model.built.details.filter(function (x) { return x.group === sectorId && x.key; })
            : [];
    }
    function stateFromWhatIf() {
        function val(id) { var el = $(id); return el ? Number(el.value) || 0 : 0; }
        function sel(id, fallback) { var el = $(id); return el ? el.value : fallback; }
        return {
            veg: val('hpwiVegetables'),
            vegTpl: sel('hpwiVegetablesTpl', 'veg_mix'),
            fr: val('hpwiFruits'),
            frTpl: sel('hpwiFruitsTpl', 'fruit_fresh'),
            wg: val('hpwiWholeGrains'),
            wgTpl: sel('hpwiWholeGrainsTpl', 'buckwheat_cooked'),
            pr: val('hpwiProtein'),
            prTpl: sel('hpwiProteinTpl', 'fish'),
            dairy: val('hpwiDairy'),
            dairyTpl: sel('hpwiDairyTpl', 'kefir'),
            reduce: val('hpwiReduce'),
            reduceSector: sel('hpwiReduceSector', 'vegetables')
        };
    }
    function aggregateAdditions(st) {
        var items = [];
        function add(tplKey, grams, group) {
            grams = Math.max(0, Number(grams) || 0);
            if (grams < 1)
                return;
            var t = resolveTemplate(tplKey);
            if (!t || !t.key)
                return;
            var existing = items.find(function (x) { return x.key === t.key; });
            if (existing)
                existing.grams += grams;
            else
                items.push({ key: t.key, label: t.label, grams: grams, group: group, template: tplKey });
        }
        add(st.vegTpl, st.veg, 'Овощи');
        add(st.frTpl, st.fr, 'Фрукты');
        add(st.wgTpl, st.wg, 'Цельные злаки');
        add(st.prTpl, st.pr, 'Белковая часть');
        add(st.dairyTpl, st.dairy, 'Молочная группа');
        return items.map(function (x) { x.grams = Math.round(x.grams); return x; }).filter(function (x) { return x.grams > 0; });
    }
    function reductionPlan(model, st) {
        var sector = st.reduceSector;
        var amount = Math.max(0, Number(st.reduce) || 0);
        if (amount < 1 || SECTORS.indexOf(sector) < 0)
            return { sector: sector, amount: 0, items: [] };
        var details = sectorDetails(model, sector);
        var byKey = {};
        details.forEach(function (d) {
            byKey[d.key] = byKey[d.key] || { key: d.key, label: d.name || d.key, detailGrams: 0 };
            byKey[d.key].detailGrams += Math.max(0, Number(d.grams) || 0);
        });
        var list = Object.keys(byKey).map(function (k) { return byKey[k]; });
        var total = list.reduce(function (a, x) { return a + x.detailGrams; }, 0);
        if (!total)
            return { sector: sector, amount: amount, items: [] };
        var rm = rationMap();
        var ratio = Math.min(1, amount / total);
        var items = list.map(function (x) {
            var current = Number(rm[x.key]) || 0;
            var delta = Math.min(current, Math.round(x.detailGrams * ratio));
            var after = Math.max(0, current - delta);
            var p = dbProduct(x.key);
            return {
                key: x.key,
                label: (p && p.name_ru) || x.label || x.key,
                current: Math.round(current),
                reduce: Math.round(delta),
                after: Math.round(after)
            };
        }).filter(function (x) { return x.reduce > 0; });
        return { sector: sector, amount: Math.round(amount), items: items };
    }
    function buildPlan() {
        var model = hpModel();
        var st = stateFromWhatIf();
        return {
            model: model,
            state: st,
            additions: aggregateAdditions(st),
            reduction: reductionPlan(model, st)
        };
    }
    function planText(plan) {
        var lines = [];
        lines.push('План коррекции Гарвардской тарелки');
        if (plan.additions.length) {
            lines.push('');
            lines.push('Добавить:');
            plan.additions.forEach(function (x) { lines.push('- ' + x.label + ': ' + fmt(x.grams, 0) + ' г/мл (' + x.group + ')'); });
        }
        if (plan.reduction && plan.reduction.items.length) {
            lines.push('');
            lines.push('Сократить сектор "' + (SECTOR_LABEL[plan.reduction.sector] || plan.reduction.sector) + '":');
            plan.reduction.items.forEach(function (x) { lines.push('- ' + x.label + ': ' + fmt(x.current, 0) + ' → ' + fmt(x.after, 0) + ' г'); });
        }
        lines.push('');
        lines.push('Важно: это план применения выбранного what-if сценария. После применения HEI и тарелка пересчитаются по фактическим продуктам.');
        return lines.join('\n');
    }
    function renderList(plan) {
        var addHtml = plan.additions.length
            ? '<ul class="hpapply-list">' + plan.additions.map(function (x) {
                var exists = !!dbProduct(x.key);
                return '<li data-ok="' + (exists ? '1' : '0') + '"><span><strong>' + esc(x.label) + '</strong><small>' + esc(x.group + ' · ' + x.key) + '</small></span><b>+' + esc(fmt(x.grams, 0)) + ' г/мл</b></li>';
            }).join('') + '</ul>'
            : '<p class="hpapply-empty">Добавления не выбраны.</p>';
        var red = plan.reduction;
        var redHtml = (red && red.items.length)
            ? '<ul class="hpapply-list hpapply-reduce">' + red.items.map(function (x) {
                return '<li><span><strong>' + esc(x.label) + '</strong><small>' + esc(x.key) + '</small></span><b>' + esc(fmt(x.current, 0) + ' → ' + fmt(x.after, 0)) + ' г</b></li>';
            }).join('') + '</ul>'
            : '<p class="hpapply-empty">Сокращение сектора не выбрано или в секторе нет продуктов для уменьшения.</p>';
        return '<div class="hpapply-cols">' +
            '<section><h4>Добавить в рацион</h4>' + addHtml + '</section>' +
            '<section><h4>Сократить в рационе</h4><p class="hpapply-micro">Сектор: ' + esc(SECTOR_LABEL[red.sector] || red.sector || '—') + '</p>' + redHtml + '</section>' +
            '</div>';
    }
    function ensureHost() {
        var panel = $('harvardPlatePanel');
        if (!panel)
            return null;
        var whatif = $('harvardWhatIfSimulator');
        var smart = $('harvardSmartRebalance');
        var host = $('harvardApplyPlan');
        if (!host) {
            host = document.createElement('section');
            host.id = 'harvardApplyPlan';
            host.className = 'hpapply';
            host.setAttribute('aria-label', 'Применение плана коррекции');
            if (whatif)
                whatif.insertAdjacentElement('afterend', host);
            else if (smart)
                smart.insertAdjacentElement('afterend', host);
            else
                panel.appendChild(host);
        }
        return host;
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
        var model = hpModel();
        var wasOpen = host.querySelector('.hpapply-shell') ? host.querySelector('.hpapply-shell').open : false;
        if (!model || !model.ready || model.empty) {
            stableSetHtml(host, '<div class="hpapply-placeholder">План применения появится после расчёта тарелки и выбора сценария коррекции.</div>');
            return;
        }
        var plan = buildPlan();
        var hasAdd = plan.additions.length > 0;
        var hasReduce = plan.reduction && plan.reduction.items.length > 0;
        if (!hasAdd && !hasReduce) {
            stableSetHtml(host, '<div class="hpapply-placeholder">План применения появится после выбора сценария коррекции. Сейчас нет действий, которые можно безопасно внести в рацион.</div>');
            return;
        }
        var disabled = '';
        stableSetHtml(host, '<details class="hpapply-shell" ' + (wasOpen ? 'open' : '') + '>' +
            '<summary><span>План применения</span><strong>после проверки можно внести в рацион</strong></summary>' +
            '<p class="hpapply-lead">Это безопасный слой применения: рацион изменится только после нажатия кнопки и подтверждения. После применения HEI и Гарвардская тарелка пересчитаются автоматически.</p>' +
            renderList(plan) +
            '<div class="hpapply-actions">' +
            '<button type="button" class="secondary" data-hpapply="copy" ' + disabled + '>Скопировать план</button>' +
            '<button type="button" class="secondary" data-hpapply="add" ' + (!hasAdd ? 'disabled' : '') + '>Добавить выбранные продукты</button>' +
            '<button type="button" class="secondary" data-hpapply="reduce" ' + (!hasReduce ? 'disabled' : '') + '>Применить сокращение</button>' +
            '<button type="button" class="primary" data-hpapply="all" ' + disabled + '>Применить весь план</button>' +
            '</div>' +
            '<div class="hpapply-status" id="hpApplyStatus" role="status" aria-live="polite"></div>' +
            '</details>');
    }
    function confirmText(kind, plan) {
        if (kind === 'add')
            return 'Добавить выбранные продукты в текущий рацион?\n\n' + planText({ additions: plan.additions, reduction: { sector: '', items: [] } });
        if (kind === 'reduce')
            return 'Применить сокращение текущих продуктов в рационе?\n\n' + planText({ additions: [], reduction: plan.reduction });
        return 'Применить весь план коррекции к текущему рациону?\n\n' + planText(plan);
    }
    function afterApplied(msg) {
        status(msg, true);
        try {
            window.dispatchEvent(new CustomEvent('harvard:apply-plan-applied', { detail: { version: VERSION } }));
        }
        catch (_) { }
        setTimeout(render, 500);
    }
    function copyPlan(plan) {
        var text = planText(plan);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { status('План скопирован.', true); }, function () { status(text, true); });
        }
        else {
            status(text, true);
        }
    }
    function handle(action) {
        var plan = buildPlan();
        if (action === 'copy') {
            copyPlan(plan);
            return;
        }
        if (action === 'add') {
            if (!plan.additions.length) {
                status('Нет выбранных добавлений.', false);
                return;
            }
            if (!window.confirm(confirmText('add', plan)))
                return;
            if (applyAdditions(plan))
                afterApplied('Выбранные продукты добавлены. HEI и тарелка пересчитываются.');
            return;
        }
        if (action === 'reduce') {
            if (!plan.reduction.items.length) {
                status('Нет выбранного сокращения.', false);
                return;
            }
            if (!window.confirm(confirmText('reduce', plan)))
                return;
            if (applyReductions(plan))
                afterApplied('Сокращение применено. HEI и тарелка пересчитываются.');
            return;
        }
        if (action === 'all') {
            if (!plan.additions.length && !plan.reduction.items.length) {
                status('План пуст.', false);
                return;
            }
            if (!window.confirm(confirmText('all', plan)))
                return;
            var ok1 = true, ok2 = true;
            if (plan.reduction.items.length)
                ok2 = applyReductions(plan);
            if (plan.additions.length)
                ok1 = applyAdditions(plan);
            if (ok1 && ok2)
                afterApplied('Весь план применён. HEI и тарелка пересчитываются.');
            return;
        }
    }
    function schedule() {
        clearTimeout(schedule._t);
        schedule._t = setTimeout(render, 140);
    }
    function init() {
        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('[data-hpapply]') : null;
            if (!btn)
                return;
            e.preventDefault();
            handle(btn.getAttribute('data-hpapply'));
        });
        ['input', 'change'].forEach(function (ev) {
            document.addEventListener(ev, function (e) {
                if (e.target && e.target.id && e.target.id.indexOf('hpwi') === 0)
                    schedule();
            }, true);
        });
        ['ration:changed', 'hei:rendered', 'hei:watchdog-recomputed', 'hei:forced-recompute', 'needs:changed', 'storage', 'harvard:apply-plan-applied'].forEach(function (ev) {
            window.addEventListener(ev, schedule);
        });
        schedule();
        var bootPulses = 0;
        var bootTimer = setInterval(function () {
            bootPulses += 1;
            schedule();
            if (bootPulses >= 8)
                clearInterval(bootTimer);
        }, 900);
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
