// nutrition calculator v5.3.183 — retro pixel graphics decorator, text-button regression fix
(function () {
    'use strict';
    var VERSION = 'v5.3.183_retro_text_button_fix';
    var sectionMap = {
        needsCompact: 'calculate', globalSearchSection: 'search', rationSection: 'ration', heiPanel: 'hei',
        totalsSection: 'norms', dietAnalysisProfilePanel: 'matrix', harvardPlatePanel: 'plate',
        geminiAiSection: 'ai', geminiRationImportSection: 'camera', globalActions: 'print'
    };
    var observer = null, scheduled = 0, pending = [];
    function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); }
    function active() { return document.documentElement.getAttribute('data-theme') === 'retro-2bit'; }
    function classify(el) {
        var id = norm(el.id), cls = norm(el.className), text = norm(el.textContent), aria = norm(el.getAttribute && ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')));
        var all = id + ' ' + cls + ' ' + text + ' ' + aria;
        if (/close|закрыть|✕|×/.test(all))
            return 'close';
        if (/справк|help|информац|подробнее/.test(all) || /(^|\s)[?i](\s|$)/.test(text))
            return 'info';
        if (/удал|очист|trash/.test(all))
            return 'remove';
        if (/сброс|reset|заново/.test(all))
            return 'reset';
        if (/печать|print/.test(all))
            return 'print';
        if (/pdf/.test(all))
            return 'pdf';
        if (/фото|камер|image/.test(all))
            return 'camera';
        if (/аудио|микроф|голос/.test(all))
            return 'audio';
        if (/загруз|импорт|upload|файл/.test(all))
            return 'upload';
        if (/gemini|ии-|искусственн|стратеги/.test(all))
            return 'ai';
        if (/поиск|найти|search/.test(all))
            return 'search';
        if (/добав|подтверд|применить|сохранить/.test(all))
            return 'add';
        if (/редакт|измен|настро/.test(all))
            return 'edit';
        if (/рассчит|сформир|вычисл/.test(all))
            return 'calculate';
        if (/рацион|прием пищи|приём пищи/.test(all))
            return 'ration';
        if (/hei|индекс качества/.test(all))
            return 'hei';
        return '';
    }
    function isIconOnly(el) {
        var cls = norm(el.className), aria = norm(el.getAttribute && el.getAttribute('aria-label')), text = norm(el.textContent);
        var compactClass = /icon-btn|close-btn|help-button/.test(cls);
        return (compactClass && text.length <= 2) || (/закрыть|справк/.test(aria) && text.length <= 2);
    }
    function decorateButton(el) {
        if (!active() || !el || el.nodeType !== 1 || el.getAttribute('data-retro-decorated') === '1')
            return;
        var icon = classify(el);
        if (!icon)
            return;
        if (!el.hasAttribute('data-retro-icon')) {
            el.setAttribute('data-retro-icon', icon);
            el.setAttribute('data-retro-owned-icon', '1');
        }
        if (norm(el.textContent).length > 2 && el.classList.contains('retro-icon-only')) {
            el.classList.remove('retro-icon-only');
            el.removeAttribute('data-retro-owned-icon-only');
        }
        if (isIconOnly(el) && !el.classList.contains('retro-icon-only')) {
            el.classList.add('retro-icon-only');
            el.setAttribute('data-retro-owned-icon-only', '1');
        }
        el.setAttribute('data-retro-decorated', '1');
    }
    function decorateHeading(section, icon) {
        if (!active() || !section)
            return;
        var h = section.querySelector('h1,h2,h3,.section-title');
        if (h && !h.hasAttribute('data-retro-section-icon')) {
            h.setAttribute('data-retro-section-icon', icon);
            h.setAttribute('data-retro-owned-section-icon', '1');
        }
    }
    function decorateStates(root) {
        root.querySelectorAll && root.querySelectorAll('.alert,[data-state],.search-status,.gemini-ai-status,.gemini-ration-import__status').forEach(function (el) {
            if (el.hasAttribute('data-retro-state-glyph'))
                return;
            var s = norm((el.getAttribute('data-state') || '') + ' ' + el.className + ' ' + el.textContent);
            el.setAttribute('data-retro-state-glyph', /ошиб|error|bad|danger/.test(s) ? '!' : (/готов|успеш|success|good|добавлен/.test(s) ? '✓' : '·'));
            el.setAttribute('data-retro-owned-state-glyph', '1');
        });
    }
    function scanSections(root) {
        Object.keys(sectionMap).forEach(function (id) {
            var section = null;
            if (root.nodeType === 9)
                section = document.getElementById(id);
            else if (root.id === id)
                section = root;
            else if (root.querySelector)
                section = root.querySelector('#' + id);
            decorateHeading(section, sectionMap[id]);
        });
    }
    function scan(root) {
        if (!active() || !root || (root.nodeType !== 1 && root.nodeType !== 9))
            return;
        if (root.matches && root.matches('button,.btn,[role="button"]'))
            decorateButton(root);
        root.querySelectorAll && root.querySelectorAll('button,.btn,[role="button"]').forEach(decorateButton);
        scanSections(root);
        decorateStates(root);
    }
    function flush() {
        scheduled = 0;
        if (!active()) {
            pending = [];
            return;
        }
        var roots = pending.slice();
        pending = [];
        roots.forEach(scan);
    }
    function queue(root) {
        if (!active() || !root || root.nodeType !== 1)
            return;
        pending.push(root);
        if (scheduled)
            return;
        var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 0); };
        scheduled = raf(flush);
    }
    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        pending = [];
        scheduled = 0;
        document.querySelectorAll('[data-retro-decorated="1"]').forEach(function (el) { el.removeAttribute('data-retro-decorated'); });
        document.querySelectorAll('[data-retro-owned-icon="1"]').forEach(function (el) { el.removeAttribute('data-retro-icon'); el.removeAttribute('data-retro-owned-icon'); });
        document.querySelectorAll('[data-retro-owned-icon-only="1"]').forEach(function (el) { el.classList.remove('retro-icon-only'); el.removeAttribute('data-retro-owned-icon-only'); });
        document.querySelectorAll('[data-retro-owned-section-icon="1"]').forEach(function (el) { el.removeAttribute('data-retro-section-icon'); el.removeAttribute('data-retro-owned-section-icon'); });
        document.querySelectorAll('[data-retro-owned-state-glyph="1"]').forEach(function (el) { el.removeAttribute('data-retro-state-glyph'); el.removeAttribute('data-retro-owned-state-glyph'); });
    }
    function enable() {
        if (!active())
            return;
        scan(document);
        if (typeof MutationObserver !== 'undefined' && !observer) {
            observer = new MutationObserver(function (records) { records.forEach(function (r) { r.addedNodes && r.addedNodes.forEach(queue); }); });
            observer.observe(document.body, { childList: true, subtree: true });
            try {
                window.__RETRO_GRAPHICS_OBSERVER__ = observer;
            }
            catch (_) { }
        }
    }
    function apply() { if (active())
        enable();
    else
        cleanup(); }
    function bind() {
        apply();
        window.addEventListener('nutrition:themechange', apply);
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', bind, { once: true });
    else
        bind();
    window.NutritionRetroGraphicsV1 = { version: VERSION, isActive: active, classifyText: function (text) { return classify({ id: '', className: '', textContent: text, getAttribute: function () { return ''; } }); }, scan: scan, enable: enable, cleanup: cleanup };
})();
