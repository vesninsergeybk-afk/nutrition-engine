// nutrition calculator v5.2.33_product_logic_guardrails
// Responsibility: replace legacy Harvard Plate lower blocks with coherent accordions:
// sectors of the main plate + elements outside the main plate + compact quality/diagnostic details.
(function () {
    'use strict';
    var VERSION = 'v5.3.36_diet_profile_medical_ui';
    window.__V531_HARVARD_PLATE_ACCORDION_CLEANUP__ = VERSION;
    window.__V5329_HARVARD_MOBILE_CLARITY_POLISH__ = VERSION;
    window.__V533_HARVARD_PRODUCT_LOGIC_GUARDRAILS__ = VERSION;
    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function num(v) { var n = Number(v); return Number.isFinite(n) ? n : 0; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, num(v))); }
    function fmt(n, d) {
        if (!Number.isFinite(Number(n)))
            return '—';
        var s = Number(n).toFixed(d == null ? 0 : d);
        return s.replace(/\.0$/, '');
    }
    function pct(n) { return fmt(n, n >= 10 ? 0 : 1) + '%'; }
    var HP_NAMES = [
        'HarvardPlateV5329', 'HarvardPlateV5328', 'HarvardPlateV5326', 'HarvardPlateV5318', 'HarvardPlateV5317', 'HarvardPlateV5316', 'HarvardPlateV5315', 'HarvardPlateV5314', 'HarvardPlateV5313', 'HarvardPlateV5312', 'HarvardPlateV5311', 'HarvardPlateV5310', 'HarvardPlateV539', 'HarvardPlateV538', 'HarvardPlateV537', 'HarvardPlateV536', 'HarvardPlateV535', 'HarvardPlateV534', 'HarvardPlateV533', 'HarvardPlateV532', 'HarvardPlateV531', 'HarvardPlateV530', 'HarvardPlateV5230', 'HarvardPlateV5223', 'HarvardPlateV5221',
        'HarvardPlateV529', 'HarvardPlateV528', 'HarvardPlateV527', 'HarvardPlateV526',
        'HarvardPlateV525', 'HarvardPlateV524', 'HarvardPlateV523'
    ];
    var SECTORS = ['vegetables', 'fruits', 'wholeGrains', 'protein'];
    var TITLES = {
        vegetables: 'Овощи',
        fruits: 'Фрукты',
        wholeGrains: 'Цельные злаки',
        protein: 'Белковые продукты'
    };
    var TARGETS = { vegetables: 35, fruits: 15, wholeGrains: 25, protein: 25 };
    var COLORS = { vegetables: '#16a34a', fruits: '#dc2626', wholeGrains: '#d97706', protein: '#0ea5e9' };
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
    function hasRole(it, role) { return it && Array.isArray(it.roles) && it.roles.indexOf(role) >= 0; }
    function details(model) { return model && model.built && Array.isArray(model.built.details) ? model.built.details : []; }
    function itemsForSector(model, id) { return details(model).filter(function (it) { return it.group === id; }); }
    function itemsWithRole(model, role) { return details(model).filter(function (it) { return hasRole(it, role); }); }
    function groupItems(model, predicate) { return details(model).filter(predicate); }
    function sumGrams(items) { return items.reduce(function (a, it) { return a + (Number(it && it.grams) || 0); }, 0); }
    function unitFor(it) {
        return hasRole(it, 'waterPlain') || hasRole(it, 'unsweetenedBeverage') || hasRole(it, 'dairyDrink') || hasRole(it, 'juice') || hasRole(it, 'sweetDrink') ? 'мл' : 'г';
    }
    function itemName(it) { return it && (it.name || it.name_ru || it.key) || 'Продукт'; }
    function itemList(items, emptyText) {
        if (!items || !items.length)
            return '<p class="hpacc-empty">' + esc(emptyText || 'Пока нет продуктов.') + '</p>';
        return '<ul class="hpacc-items">' + items.slice(0, 10).map(function (it) {
            var reason = it.reason ? '<small>' + esc(it.reason) + '</small>' : '';
            return '<li><span>' + esc(itemName(it)) + reason + '</span><strong>' + esc(fmt(it.grams, 0) + ' ' + unitFor(it)) + '</strong></li>';
        }).join('') + (items.length > 10 ? '<li><span>Ещё продуктов</span><strong>' + esc(String(items.length - 10)) + '</strong></li>' : '') + '</ul>';
    }
    function sector(model, id) { return model && model.stage && model.stage.sectors ? (model.stage.sectors[id] || {}) : {}; }
    function sectorPercent(model, id) {
        var s = sector(model, id);
        if (Number.isFinite(Number(s.actualPercent)))
            return Number(s.actualPercent);
        var g = Number(s.grams) || 0;
        var core = Number(model && model.coreMass) || 0;
        return core > 0 ? 100 * g / core : 0;
    }
    function stateText(id, share) {
        var target = TARGETS[id] || 25;
        if (share <= 0.1)
            return 'нет в тарелке';
        if (share < target * 0.4)
            return 'очень мало';
        if (share < target * 0.72)
            return 'мало';
        if (share < target * 0.9)
            return 'ниже ориентира';
        if (share <= target * 1.2)
            return 'около ориентира';
        if (share <= target * 1.7)
            return 'выше ориентира';
        return 'заметно выше ориентира';
    }
    function toneByShare(id, share) {
        var target = TARGETS[id] || 25;
        if (share <= 0.1)
            return 'empty';
        if (share >= target * 0.9 && share <= target * 1.2)
            return 'ok';
        if (share < target * 0.4 || share > target * 1.7)
            return 'bad';
        return 'warn';
    }
    function sectorComment(id, share) {
        if (id === 'vegetables') {
            if (share > 55)
                return 'Овощная часть уже очень высокая. Следующий шаг — выровнять белковую часть и цельные злаки.';
            if (share < 25)
                return 'Овощная часть ниже рабочего ориентира. Можно добавить овощной гарнир или салат.';
            return 'Овощная часть близка к рабочему ориентиру. Следите, чтобы остальные сектора тоже сохраняли свою долю.';
        }
        if (id === 'fruits') {
            if (share > 25)
                return 'Фруктовая часть выше рабочей цели. Следующую растительную порцию лучше сделать овощной.';
            if (share < 8)
                return 'Фруктовая часть низкая. Можно добавить цельный фрукт или ягоды, если это подходит рациону.';
            return 'Фруктовая часть представлена. В модели тарелки она отделена от овощной части.';
        }
        if (id === 'wholeGrains') {
            if (share < 10)
                return 'Цельных злаков мало. Добавьте порцию гречки, овсянки, бурого риса или цельнозернового хлеба.';
            if (share > 35)
                return 'Цельных злаков больше ориентира. Проверьте, сохраняются ли белковая и овощная части.';
            return 'Цельные злаки представлены близко к ориентиру.';
        }
        if (id === 'protein') {
            if (share < 12)
                return 'Белковая часть низкая. Добавьте рыбу, птицу, яйца, бобовые, тофу или другой подходящий белковый продукт.';
            if (share > 35)
                return 'Белковая часть выше ориентира. Важно проверить качество белка, насыщенные жиры и натрий по HEI.';
            return 'Белковая часть представлена близко к ориентиру. Качество белка уточняет HEI.';
        }
        return 'Сектор показывает долю группы в основной тарелке.';
    }
    function sectorActionLabel(open) { return open ? 'открыто' : 'раскрыть'; }
    function sectorButtonHint(id, share) {
        return stateText(id, share) + ' · нажмите, чтобы раскрыть';
    }
    function sectorAccordion(model, id) {
        var s = sector(model, id);
        var grams = Number(s.grams) || 0;
        var share = sectorPercent(model, id);
        var target = TARGETS[id] || 25;
        var tone = toneByShare(id, share);
        var items = itemsForSector(model, id);
        var width = clamp(share, 0, 100);
        var status = stateText(id, share);
        return '<details class="hpacc-item hpacc-sector" id="hpSectorAcc-' + esc(id) + '" data-hpacc-sector="' + esc(id) + '" data-tone="' + esc(tone) + '">' +
            '<summary data-hp-sector-card="' + esc(id) + '" aria-controls="hpSectorAcc-' + esc(id) + ' harvardPlateActivePanel" aria-label="' + esc(TITLES[id] + ': ' + fmt(grams, 0) + ' г, ' + pct(share) + ', цель ' + target + '%. Раскрыть подробности') + '">' +
            '<span class="hpacc-dot" style="--hpacc-dot:' + esc(COLORS[id] || '#64748b') + '"></span>' +
            '<span class="hpacc-main"><strong>' + esc(TITLES[id]) + '</strong><small>' + esc(sectorButtonHint(id, share)) + '</small></span>' +
            '<span class="hpacc-value-wrap"><span class="hpacc-value">' + esc(fmt(grams, 0) + ' г · ' + pct(share)) + '</span><span class="hpacc-target">цель ' + esc(target) + '%</span><span class="hpacc-toggle-text">раскрыть</span></span>' +
            '<span class="hpacc-chevron" aria-hidden="true">▾</span>' +
            '</summary>' +
            '<div class="hpacc-body">' +
            '<p class="hpacc-sector-conclusion"><strong>Вывод:</strong> ' + esc(sectorComment(id, share)) + '</p>' +
            '<div class="hpacc-bar" style="--hpacc-pct:' + width + '%;--hpacc-target:' + clamp(target, 0, 100) + '%"><i></i><em></em></div>' +
            '<p class="hpacc-note">Ориентир: около ' + esc(target) + '% основной тарелки. Сейчас: ' + esc(fmt(grams, 0) + ' г, ' + pct(share)) + '. Статус: ' + esc(status) + '.</p>' +
            '<h4>В расчёт вошли</h4>' +
            itemList(items, 'В этом секторе пока нет продуктов.') +
            '</div>' +
            '</details>';
    }
    function additionalStatus(kind, grams, target) {
        if (kind === 'fats') {
            if (grams < 2)
                return 'практически не представлены';
            if (grams < 10)
                return 'есть немного';
            if (grams <= 30)
                return 'представлены умеренно';
            return 'много, проверьте калорийность';
        }
        if (kind === 'water') {
            if (!target)
                return fmt(grams, 0) + ' мл';
            if (grams < target * 0.35)
                return 'мало: ' + fmt(grams, 0) + ' / ' + fmt(target, 0) + ' мл';
            if (grams < target * 0.75)
                return 'частично: ' + fmt(grams, 0) + ' / ' + fmt(target, 0) + ' мл';
            return 'близко к ориентиру: ' + fmt(grams, 0) + ' / ' + fmt(target, 0) + ' мл';
        }
        if (kind === 'dairy') {
            if (grams < 1)
                return 'не представлены';
            return 'отдельная группа: ' + fmt(grams, 0) + ' г/мл';
        }
        if (kind === 'fattySauce') {
            if (grams < 1)
                return 'не обнаружены';
            return 'есть: ' + fmt(grams, 0) + ' г';
        }
        if (kind === 'potato') {
            if (grams < 1)
                return 'не обнаружены';
            return 'отдельно от овощей: ' + fmt(grams, 0) + ' г';
        }
        if (kind === 'processedMeat') {
            if (grams < 1)
                return 'не обнаружено';
            return 'лучше ограничить: ' + fmt(grams, 0) + ' г';
        }
        if (kind === 'proteinSupplement') {
            if (grams < 1)
                return 'не обнаружены';
            return 'добавки: ' + fmt(grams, 0) + ' г';
        }
        if (kind === 'sweet') {
            if (grams < 1)
                return 'не обнаружены';
            return 'есть: ' + fmt(grams, 0) + ' мл/г';
        }
        if (kind === 'refined') {
            if (grams < 1)
                return 'не обнаружены';
            return 'есть: ' + fmt(grams, 0) + ' г';
        }
        return fmt(grams, 0) + ' г';
    }
    function addAccordion(id, title, status, tone, note, items, emptyText, extraHtml) {
        return '<details class="hpacc-item hpacc-extra" id="' + esc(id) + '" data-tone="' + esc(tone || 'neutral') + '">' +
            '<summary>' +
            '<span class="hpacc-main"><strong>' + esc(title) + '</strong><small>' + esc(status) + '</small></span>' +
            '<span class="hpacc-chevron">▾</span>' +
            '</summary>' +
            '<div class="hpacc-body">' +
            '<p class="hpacc-note">' + esc(note) + '</p>' +
            (extraHtml || '') +
            '<h4>В расчёт вошли</h4>' +
            itemList(items, emptyText || 'Нет продуктов в этой группе.') +
            '</div>' +
            '</details>';
    }
    function extrasHtml(model) {
        var fats = itemsWithRole(model, 'healthyFatSource');
        var water = itemsWithRole(model, 'waterPlain').concat(itemsWithRole(model, 'unsweetenedBeverage'));
        var dairy = itemsWithRole(model, 'dairy');
        var sweet = itemsWithRole(model, 'juice').concat(itemsWithRole(model, 'sweetDrink'));
        var refined = itemsWithRole(model, 'refinedGrain');
        var fattySauce = itemsWithRole(model, 'fattySauce');
        var potatoes = itemsWithRole(model, 'harvardPotato');
        var processedMeat = itemsWithRole(model, 'processedMeat');
        var proteinSupp = itemsWithRole(model, 'proteinSupplement');
        var fluidTarget = Number(model && model.fluidTargetMl) || 2400;
        var normal = '';
        var attention = '';
        normal += addAccordion('hpExtraFats', 'Полезные жиры', additionalStatus('fats', sumGrams(fats)), sumGrams(fats) < 2 ? 'warn' : 'ok', 'Масла, орехи, семечки и авокадо показаны отдельно от секторов основной тарелки и важны для качества жиров. Их лучше интерпретировать вместе с HEI: соотношение жиров и насыщенные жиры.', fats, 'Источники полезных жиров не добавлены.');
        normal += addAccordion('hpExtraWater', 'Вода и несладкие напитки', additionalStatus('water', sumGrams(water), fluidTarget), sumGrams(water) < fluidTarget * 0.35 ? 'warn' : 'ok', 'Учитываются вода, чай, кофе и несладкие напитки. Сладкие напитки учитываются отдельно от водного ориентира.', water, 'Вода и несладкие напитки не добавлены.');
        normal += addAccordion('hpExtraDairy', 'Молочные продукты', additionalStatus('dairy', sumGrams(dairy)), 'neutral', 'Молочная группа ведётся отдельно от основной тарелки. Её вклад лучше смотреть вместе с компонентом HEI «Молочные».', dairy, 'Молочные продукты не добавлены.');
        if (proteinSupp.length) {
            normal += addAccordion('hpExtraProteinSupp', 'Протеиновые добавки', additionalStatus('proteinSupplement', sumGrams(proteinSupp)), 'neutral', 'Протеиновые добавки показаны отдельно: они могут давать белок, а сектор здоровых белковых продуктов лучше собирать из обычных пищевых источников.', proteinSupp, 'Протеиновые добавки не добавлены.');
        }
        if (fattySauce.length) {
            attention += addAccordion('hpExtraFattySauce', 'Соусы, закуски и жирные добавки', additionalStatus('fattySauce', sumGrams(fattySauce)), 'warn', 'Эти продукты оцениваются отдельно от источников полезных жиров в модели тарелки. Их влияние лучше оценивать вместе с HEI: натрий, насыщенные жиры, добавленный сахар и общая калорийность.', fattySauce, 'Соусы, закуски и жирные добавки не добавлены.');
        }
        if (potatoes.length) {
            attention += addAccordion('hpExtraPotatoes', 'Картофель и картофельные блюда', additionalStatus('potato', sumGrams(potatoes)), 'warn', 'Картофель показан отдельно от овощного сектора Гарвардской тарелки, чтобы овощная часть оставалась точной.', potatoes, 'Картофельные продукты не добавлены.');
        }
        if (processedMeat.length) {
            attention += addAccordion('hpExtraProcessedMeat', 'Обработанное мясо', additionalStatus('processedMeat', sumGrams(processedMeat)), 'bad', 'Колбасы, сосиски, бекон и похожие продукты относятся к позициям повышенного внимания внутри белковой группы. Их качество проверяйте через HEI: натрий, насыщенные жиры и обработанное мясо.', processedMeat, 'Обработанное мясо не добавлено.');
        }
        if (sweet.length) {
            attention += addAccordion('hpExtraSweet', 'Соки и сладкие напитки', additionalStatus('sweet', sumGrams(sweet)), 'bad', 'Соки и сладкие напитки учитываются отдельно от водного ориентира. Их влияние дополнительно видно в HEI через добавленный сахар.', sweet, 'Соки и сладкие напитки не добавлены.');
        }
        if (refined.length) {
            attention += addAccordion('hpExtraRefined', 'Рафинированные злаки', additionalStatus('refined', sumGrams(refined)), 'warn', 'Рафинированные злаки не заполняют сектор цельных злаков. Их качество дополнительно оценивается в HEI.', refined, 'Рафинированные злаки не добавлены.');
        }
        return '<div class="hpacc-extra-cluster" data-cluster="separate"><h4>Учтено отдельно</h4><p>Эти продукты есть в рационе и показаны отдельно от цветных секторов основной тарелки.</p>' + normal + '</div>' +
            '<div class="hpacc-extra-cluster" data-cluster="attention"><h4>Требует внимания</h4><p>Эти позиции не заполняют основной круг и могут ухудшать качество рациона через сахар, натрий, насыщенные жиры или рафинированные продукты.</p>' + (attention || '<p class="hpacc-empty">Таких продуктов сейчас не обнаружено.</p>') + '</div>';
    }
    function qualityHtml(model) {
        var flags = (model && model.stage && Array.isArray(model.stage.qualityFlags)) ? model.stage.qualityFlags : [];
        if (!flags.length) {
            return '<details class="hpacc-item hpacc-tech"><summary><span class="hpacc-main"><strong>Качественные замечания</strong><small>явных замечаний нет</small></span><span class="hpacc-chevron">▾</span></summary><div class="hpacc-body"><p class="hpacc-note">Сейчас явных качественных замечаний по Гарвардской тарелке нет. Детальную оценку качества смотрите в HEI.</p></div></details>';
        }
        return '<details class="hpacc-item hpacc-tech" open><summary><span class="hpacc-main"><strong>Качественные замечания</strong><small>' + esc(flags.length) + ' замеч.</small></span><span class="hpacc-chevron">▾</span></summary><div class="hpacc-body"><ul class="hpacc-flags">' +
            flags.slice(0, 6).map(function (f) { return '<li data-severity="' + esc(f.severity || 'info') + '">' + esc(f.message || '') + '</li>'; }).join('') +
            (flags.length > 6 ? '<li>Ещё замечаний: ' + esc(String(flags.length - 6)) + '</li>' : '') +
            '</ul></div></details>';
    }
    function diagnosticsHtml() {
        return '<details class="hpacc-item hpacc-tech"><summary><span class="hpacc-main"><strong>Диагностика визуализации</strong><small>технический блок</small></span><span class="hpacc-chevron">▾</span></summary><div class="hpacc-body"><p class="hpacc-note">Обычный сценарий обновляется автоматически после добавления, удаления или изменения продукта.</p><button class="ghost" id="harvardPlateAccordionRefreshBtn" type="button">Пересчитать тарелку вручную</button></div></details>';
    }
    function ensureHost() {
        var panel = $('harvardPlatePanel');
        if (!panel)
            return null;
        var visualWrap = panel.querySelector('.harvard-plate-visual-wrap');
        var caption = panel.querySelector('.harvard-plate-caption');
        var layout = panel.querySelector('.harvard-plate-layout');
        var host = $('harvardPlateAccordions');
        if (!host) {
            host = document.createElement('section');
            host.id = 'harvardPlateAccordions';
            host.className = 'hpacc hpacc-inline-under-plate';
            host.setAttribute('aria-label', 'Подробности прямо под Гарвардской тарелкой');
        }
        else if (host.className.indexOf('hpacc-inline-under-plate') < 0) {
            host.className += ' hpacc-inline-under-plate';
        }
        if (visualWrap && host.parentNode !== visualWrap) {
            if (caption && caption.parentNode === visualWrap)
                caption.insertAdjacentElement('afterend', host);
            else
                visualWrap.appendChild(host);
        }
        else if (!visualWrap && !host.parentNode) {
            if (layout)
                layout.insertAdjacentElement('afterend', host);
            else
                panel.appendChild(host);
        }
        return host;
    }
    var lastRenderSignature = '';
    var lastAccordionPointerAt = 0;
    function modelSignature(model) {
        try {
            var out = {
                core: Number(model && model.coreMass) || 0,
                total: Number(model && model.totalMass) || 0,
                sectors: SECTORS.map(function (id) {
                    var s = sector(model, id);
                    return [id, Number(s.grams) || 0, sectorPercent(model, id)].join(':');
                }),
                extras: [
                    sumGrams(itemsWithRole(model, 'healthyFatSource')),
                    sumGrams(itemsWithRole(model, 'waterPlain').concat(itemsWithRole(model, 'unsweetenedBeverage'))),
                    sumGrams(itemsWithRole(model, 'dairy')),
                    sumGrams(itemsWithRole(model, 'refinedGrain'))
                ]
            };
            return JSON.stringify(out);
        }
        catch (_) {
            return String(Date.now());
        }
    }
    function markAccordionPointer(e) {
        var t = e && e.target;
        if (t && t.closest && t.closest('#harvardPlateAccordions details'))
            lastAccordionPointerAt = Date.now ? Date.now() : new Date().getTime();
    }
    function captureOpenState(host) {
        var out = {};
        if (!host || !host.querySelectorAll)
            return out;
        var list = host.querySelectorAll('details');
        for (var i = 0; i < list.length; i++) {
            var d = list[i];
            var key = d.id || d.getAttribute('data-hpacc-sector');
            if (key)
                out[key] = !!d.open;
        }
        return out;
    }
    function applyOpenState(host, state) {
        if (!host || !host.querySelectorAll || !state)
            return;
        var list = host.querySelectorAll('details');
        for (var i = 0; i < list.length; i++) {
            var d = list[i];
            var key = d.id || d.getAttribute('data-hpacc-sector');
            if (key && Object.prototype.hasOwnProperty.call(state, key))
                d.open = !!state[key];
        }
    }
    function render() {
        var host = ensureHost();
        if (!host)
            return;
        var previousOpenState = captureOpenState(host);
        var model = hpModel();
        var signature = modelSignature(model);
        if (signature === lastRenderSignature && host.__hpaccRenderedOnce)
            return;
        if ((Date.now ? Date.now() : new Date().getTime()) - lastAccordionPointerAt < 260 && host.__hpaccRenderedOnce) {
            setTimeout(render, 280);
            return;
        }
        if (!model || !model.ready || model.empty || !(Number(model.coreMass) > 0)) {
            host.innerHTML = '<section class="hpacc-section"><h3>Сектора основной тарелки</h3><p class="hpacc-empty">Добавьте продукты, чтобы увидеть сектора и дополнительные элементы модели.</p></section>';
            return;
        }
        host.innerHTML =
            '<section class="hpacc-section hpacc-main-sectors">' +
                '<div class="hpacc-section-head"><h3>Подробности по секторам</h3><p>Строки ниже работают как кнопки: нажмите сектор, чтобы увидеть вывод, продукты и статус.</p></div>' +
                '<div class="hpacc-inline-feedback" aria-live="polite"><strong>Выберите сектор</strong><span>Нажмите цветной сектор или строку ниже — разбор откроется прямо под тарелкой.</span></div>' +
                SECTORS.map(function (id) { return sectorAccordion(model, id); }).join('') +
                '</section>' +
                '<section class="hpacc-section hpacc-outside" id="harvardPlateOutsideInline">' +
                '<div class="hpacc-section-head"><h3>Продукты вне основной тарелки</h3><p>Они есть в рационе и показаны за пределами цветного круга. Ниже разделены нейтрально учтённые элементы и позиции, требующие внимания.</p></div>' +
                extrasHtml(model) +
                '</section>' +
                '<section class="hpacc-section hpacc-technical">' +
                qualityHtml(model) +
                diagnosticsHtml() +
                '</section>';
        applyOpenState(host, previousOpenState);
        lastRenderSignature = signature;
        host.__hpaccRenderedOnce = true;
        var btn = $('harvardPlateAccordionRefreshBtn');
        if (btn && !btn.__hpaccBound) {
            btn.__hpaccBound = true;
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var api = hpApi();
                if (api && typeof api.scheduleRender === 'function')
                    api.scheduleRender('manual-accordion-refresh');
                setTimeout(render, 120);
            });
        }
        if (!host.__hpaccToggleBound) {
            host.__hpaccToggleBound = true;
            host.addEventListener('toggle', function (e) {
                var d = e && e.target;
                if (!d || !d.matches || !d.matches('.hpacc-sector'))
                    return;
                var id = d.getAttribute('data-hpacc-sector');
                if (!id)
                    return;
                if (d.open) {
                    SECTORS.forEach(function (sid) {
                        var other = $('hpSectorAcc-' + sid);
                        if (other && other !== d) {
                            other.open = false;
                            other.removeAttribute('data-hpacc-selected');
                        }
                    });
                    d.setAttribute('data-hpacc-selected', '1');
                }
                else {
                    d.removeAttribute('data-hpacc-selected');
                }
            }, true);
        }
    }
    function setSectorDetailState(id, mode) {
        if (SECTORS.indexOf(id) < 0)
            return;
        var host = ensureHost();
        if (!host)
            return;
        var target = $('hpSectorAcc-' + id);
        if (!target)
            return;
        var shouldOpen = mode === 'open' ? true : mode === 'close' ? false : !target.open;
        SECTORS.forEach(function (sid) {
            var el = $('hpSectorAcc-' + sid);
            if (el && el !== target) {
                el.open = false;
                el.removeAttribute('data-hpacc-selected');
            }
        });
        target.open = shouldOpen;
        if (shouldOpen)
            target.setAttribute('data-hpacc-selected', '1');
        else
            target.removeAttribute('data-hpacc-selected');
        try {
            var note = host.querySelector('.hpacc-inline-feedback');
            if (note) {
                var model = hpModel();
                var ss = sector(model, id);
                var share = sectorPercent(model, id);
                if (shouldOpen)
                    note.innerHTML = '<strong>Открыт сектор: ' + esc(TITLES[id] || id) + '</strong><span>' + esc(fmt(Number(ss.grams) || 0, 0) + ' г · ' + pct(share) + ' основной тарелки · цель ' + (TARGETS[id] || 25) + '%') + '</span>';
                else
                    note.innerHTML = '<strong>Сектор закрыт: ' + esc(TITLES[id] || id) + '</strong><span>Нажмите сектор или строку, чтобы снова открыть подробности.</span>';
            }
        }
        catch (_) { }
    }
    function openSector(id) {
        setSectorDetailState(id, 'toggle');
    }
    function schedule() {
        clearTimeout(schedule._t);
        schedule._t = setTimeout(render, 90);
        setTimeout(render, 340);
    }
    function bind() {
        document.addEventListener('pointerdown', markAccordionPointer, true);
        document.addEventListener('touchstart', markAccordionPointer, true);
        document.addEventListener('click', markAccordionPointer, true);
        window.addEventListener('harvard:sector-selected', function (e) {
            var id = e && e.detail && e.detail.id;
            if (id)
                setTimeout(function () { setSectorDetailState(id, 'toggle'); }, 0);
        });
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
    function init() { bind(); schedule(); }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
