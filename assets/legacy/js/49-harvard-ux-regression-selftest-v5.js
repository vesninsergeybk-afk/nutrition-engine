// nutrition calculator v5.3.37_harvard_ux_regression_selftest
// Passive selftest for Harvard Plate UX contract. Does not alter layout, scrolling, focus, or calculations.
(function () {
    'use strict';
    var VERSION = 'v5.3.37_harvard_ux_regression_selftest';
    window.__V5329_HARVARD_UX_REGRESSION_SELFTEST__ = VERSION;
    var HP_NAMES = [
        'HarvardPlateV5332', 'HarvardPlateV5331', 'HarvardPlateV5329', 'HarvardPlateV5328', 'HarvardPlateV5326', 'HarvardPlateV5325', 'HarvardPlateV5324', 'HarvardPlateV5323',
        'HarvardPlateV5322', 'HarvardPlateV5321', 'HarvardPlateV5320', 'HarvardPlateV5319', 'HarvardPlateV5318',
        'HarvardPlateV5317', 'HarvardPlateV5316', 'HarvardPlateV5315', 'HarvardPlateV5314', 'HarvardPlateV5313',
        'HarvardPlateV5312', 'HarvardPlateV5311', 'HarvardPlateV5310', 'HarvardPlateV539', 'HarvardPlateV538',
        'HarvardPlateV537', 'HarvardPlateV536', 'HarvardPlateV535', 'HarvardPlateV534', 'HarvardPlateV533',
        'HarvardPlateV532', 'HarvardPlateV531', 'HarvardPlateV530', 'HarvardPlateV529', 'HarvardPlateV528',
        'HarvardPlateV527', 'HarvardPlateV526', 'HarvardPlateV525', 'HarvardPlateV524', 'HarvardPlateV523',
        'HarvardPlateV522', 'HarvardPlateV521', 'HarvardPlateV520'
    ];
    function api() {
        for (var i = 0; i < HP_NAMES.length; i++)
            if (window[HP_NAMES[i]])
                return window[HP_NAMES[i]];
        return null;
    }
    function text(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
    function row(rows, test, pass, detail) {
        rows.push({ test: test, pass: !!pass, detail: detail || '', version: VERSION });
    }
    function detailsNativeSanity() {
        try {
            var d = document.createElement('details');
            d.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
            d.innerHTML = '<summary>test</summary><p>ok</p>';
            document.body.appendChild(d);
            d.open = true;
            var openOk = d.open === true;
            d.open = false;
            var closeOk = d.open === false;
            d.remove();
            return openOk && closeOk;
        }
        catch (_) {
            return false;
        }
    }
    function recommendationButtonsValid() {
        var buttons = [].slice.call(document.querySelectorAll('[data-hp-open-whatif]'));
        if (!buttons.length)
            return true;
        return buttons.every(function (btn) {
            var sector = btn.getAttribute('data-hp-open-whatif');
            var action = btn.getAttribute('data-hp-rec-action');
            var grams = Number(btn.getAttribute('data-hp-rec-grams'));
            return !!sector && !!action && Number.isFinite(grams) && grams > 0;
        });
    }
    function outsideImpactsPrecise() {
        var cards = [].slice.call(document.querySelectorAll('.hp-outside-card'));
        if (!cards.length)
            return true;
        return cards.every(function (card) {
            var t = text(card.querySelector('.hp-outside-impact'));
            return t && t.indexOf('Учитывается в рационе, но не изменяет площадь основного круга') < 0;
        });
    }
    function noFruitCompanionDuplicate() {
        var labels = [].slice.call(document.querySelectorAll('.harvard-plate-companion-body strong')).map(text);
        return labels.indexOf('Фрукты') < 0 && labels.indexOf('Фруктовая часть') < 0;
    }
    function inlineSectorControlsVisible() {
        var host = document.querySelector('#harvardPlateAccordions.hpacc-inline-under-plate');
        var sectors = [].slice.call(document.querySelectorAll('#harvardPlateAccordions .hpacc-sector > summary[data-hp-sector-card]'));
        return !!host && sectors.length >= 4 && sectors.every(function (s) { return !!s.querySelector('.hpacc-toggle-text') && !!s.querySelector('.hpacc-value-wrap'); });
    }
    function outsideGroupsSeparated() {
        return !!document.querySelector('.hpacc-extra-cluster[data-cluster="separate"]') && !!document.querySelector('.hpacc-extra-cluster[data-cluster="attention"]');
    }
    function noOldUserVisibleVersion() {
        return document.title.indexOf('v5.2.23') < 0 && !/v5\.2\.23/.test(text(document.querySelector('header .title')));
    }
    function loaderMetadataCurrent() {
        var spec = window.__LOADER_ART_SPEC__ || {};
        return !spec.version || String(spec.version).indexOf('v5.3.37') >= 0;
    }
    function run() {
        var rows = [];
        var hp = api();
        var model = null;
        try {
            model = hp && typeof hp.getModel === 'function' ? hp.getModel() : null;
        }
        catch (e) {
            model = null;
        }
        row(rows, 'Harvard API доступен', !!hp, hp && hp.version ? hp.version : 'missing');
        row(rows, 'Harvard API содержит актуальную алиас-версию', !!window.HarvardPlateV5332, window.HarvardPlateV5332 ? 'HarvardPlateV5332 ok' : 'missing HarvardPlateV5332');
        row(rows, 'Модель Гарвардской тарелки строится', !!model && typeof model.ready === 'boolean', model ? JSON.stringify({ ready: model.ready, empty: model.empty, score: model.score, activeSector: model.activeSector }) : 'no model');
        row(rows, 'Диагностический хаб присутствует при наличии данных', !model || model.empty || model.coreMass <= 0 || !!document.querySelector('.hp-diagnostic-hub'), 'hp-diagnostic-hub');
        row(rows, 'Разбор выбранного сектора присутствует при наличии основной тарелки', !model || model.empty || model.coreMass <= 0 || !!document.querySelector('#harvardPlateActivePanel'), 'harvardPlateActivePanel');
        row(rows, 'Рекомендации не имеют неполных сценариев what-if', recommendationButtonsValid(), 'data-hp-open-whatif/data-hp-rec-*');
        row(rows, 'Продукты вне тарелки получают точные пояснения', outsideImpactsPrecise(), 'no generic outsideImpactText fallback');
        row(rows, 'Фрукты не дублируются как отдельная companion-card', noFruitCompanionDuplicate(), 'fruits stay inside the main plate');
        row(rows, 'Секторные подробности находятся под диаграммой и выглядят как кнопки', inlineSectorControlsVisible(), 'hpacc-inline-under-plate + hpacc-toggle-text');
        row(rows, 'Продукты вне основной тарелки разделены по смыслу', outsideGroupsSeparated(), 'separate/attention clusters');
        row(rows, 'Старый пользовательский бейдж v5.2.23 не показывается', noOldUserVisibleVersion(), document.title);
        row(rows, 'Loader metadata соответствует текущей версии', loaderMetadataCurrent(), JSON.stringify(window.__LOADER_ART_SPEC__ || {}));
        row(rows, 'Профиль анализа рациона присутствует', !!document.getElementById('dietAnalysisProfilePanel'), 'dietAnalysisProfilePanel');
        row(rows, 'Матрица качество × структура присутствует', !!document.getElementById('dietAnalysisMatrix'), 'dietAnalysisMatrix');
        row(rows, 'Строгая Гарвардская тарелка перенесена в дополнительный раскрываемый блок', !!document.getElementById('strictHarvardPlateDetails') && !!document.querySelector('#strictHarvardPlateDetails #harvardPlatePanel'), 'strictHarvardPlateDetails');
        row(rows, 'Отдельная карточка надёжности интерпретации присутствует', !!document.getElementById('dietInterpretationReliability'), 'dietInterpretationReliability');
        row(rows, 'Нативный details работает без глобального перехвата', detailsNativeSanity(), 'open/close property sanity');
        row(rows, 'Нет известных ошибок загрузки ресурсов', !(window.__RESOURCE_LOAD_ERRORS__ && window.__RESOURCE_LOAD_ERRORS__.length), JSON.stringify(window.__RESOURCE_LOAD_ERRORS__ || []));
        window.__HARVARD_UX_REGRESSION_ROWS__ = rows;
        try {
            console.table(rows);
        }
        catch (_) { }
        return rows;
    }
    window.runHarvardUXRegressionSelftest = run;
})();
