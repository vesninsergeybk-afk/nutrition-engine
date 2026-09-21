(function () {
    'use strict';
    var VERSION = 'v5.3.110-ui-design-audit';
    var autoCollapsed = false;
    function byId(id) { return document.getElementById(id); }
    function ration() {
        try {
            if (window.State && typeof window.State.get === 'function') {
                var r = window.State.get();
                if (Array.isArray(r))
                    return r.filter(function (x) { return Number(x && x.grams) > 0; });
            }
        }
        catch (_) { }
        if (window.STATE && Array.isArray(window.STATE.ration))
            return window.STATE.ration.filter(function (x) { return Number(x && x.grams) > 0; });
        return Array.prototype.slice.call(document.querySelectorAll('#rationBody .ration-row')).filter(function (row) { var i = row.querySelector('input[type=number]'); return !i || Number(i.value) > 0; });
    }
    function ensureMethodDetails() {
        var notice = byId('needs-method-notice');
        if (!notice || notice.closest('.ui-method-details'))
            return;
        var d = document.createElement('details');
        d.className = 'ui-method-details';
        d.innerHTML = '<summary>Методика расчёта и ограничения</summary>';
        notice.parentNode.insertBefore(d, notice);
        d.appendChild(notice);
    }
    function ensureRationTools() {
        var sec = byId('rationSection');
        if (!sec || sec.querySelector('.ui-ration-tools'))
            return;
        var bar = Array.prototype.find.call(sec.children, function (x) { return x.classList && x.classList.contains('toolbar'); });
        if (!bar)
            return;
        var d = document.createElement('details');
        d.className = 'ui-ration-tools';
        d.innerHTML = '<summary>Данные, печать и экспорт</summary>';
        sec.insertBefore(d, bar);
        d.appendChild(bar);
        var foot = sec.querySelector(':scope > .footer-note');
        if (foot)
            d.appendChild(foot);
    }
    function ensureEmptyStates() {
        var hei = byId('heiPanel');
        if (hei && !hei.querySelector('.ui-hei-empty-state')) {
            var e = document.createElement('div');
            e.className = 'ui-hei-empty-state';
            e.innerHTML = '<span class="ui-empty-icon" aria-hidden="true">3</span><div><strong>HEI появится после добавления продуктов</strong><span>Соберите рацион через поиск. Индекс, приоритеты и рекомендации рассчитаются автоматически.</span></div>';
            var title = hei.querySelector('.section-title-block');
            title && title.insertAdjacentElement('afterend', e);
        }
        var p = byId('dietAnalysisProfilePanel');
        if (p && !p.querySelector('.ui-profile-empty-state')) {
            var x = document.createElement('div');
            x.className = 'ui-profile-empty-state';
            x.innerHTML = '<h2>Профиль анализа рациона</h2><p>Матрица качества и структуры станет доступна после добавления продуктов. До этого момента выводы не формируются, чтобы не интерпретировать пустой рацион.</p>';
            p.insertBefore(x, p.firstChild);
        }
    }
    function ensureProfileDisclosure() {
        var panel = byId('dietAnalysisProfilePanel');
        if (!panel)
            return;
        var main = panel.querySelector('details.diet-matrix-diagnostic-details');
        if (main && !main.dataset.ui110) {
            main.open = false;
            main.dataset.ui110 = '1';
        }
        var domain = byId('dietDomainProfile');
        if (domain && !domain.closest('.ui-profile-domains')) {
            var d = document.createElement('details');
            d.className = 'ui-profile-domains';
            d.innerHTML = '<summary>Подробные домены, ограничения и сильные стороны</summary>';
            domain.parentNode.insertBefore(d, domain);
            d.appendChild(domain);
        }
    }
    function fixNeeds() {
        var age = byId('needs_age'), indicator = byId('needsAgeProfileIndicator');
        var empty = !(age && String(age.value || '').trim());
        document.body.classList.toggle('ui-age-empty', empty);
        if (indicator && empty)
            indicator.hidden = true;
        var icon = byId('needsHelpNeedsBtn');
        if (icon)
            icon.hidden = true;
        var btn = byId('needsHelpBtn');
        if (btn) {
            btn.setAttribute('aria-controls', 'needsHelpNeeds');
            btn.dataset.dialog = 'needsHelpNeeds';
        }
        if (innerWidth <= 720 && !autoCollapsed) {
            var t = byId('v40NeedsToggle');
            if (t && t.getAttribute('aria-expanded') === 'true') {
                autoCollapsed = true;
                t.click();
            }
        }
    }
    function syncSearch() { var out = byId('globalResults'); if (!out)
        return; out.classList.toggle('is-empty', !!out.querySelector('.search-empty-state') && !out.querySelector('.search-result-card')); }
    function accessibleNames() {
        var known = { harvardPlateSampleBtn: 'Показать пример Гарвардской тарелки', harvardPlateRefreshBtn: 'Обновить Гарвардскую тарелку', applyPresetBtn: 'Применить шаблон', distributeBtn: 'Распределить по приёмам пищи', mealRefreshBtn: 'Обновить распределение', mealResetBtn: 'Сбросить распределение' };
        document.querySelectorAll('input,select,textarea').forEach(function (el) { if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'))
            return; if (el.id) {
            var l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
            if (l)
                return;
        } var context = el.placeholder || el.title || el.name || ''; if (!context) {
            var box = el.closest('details,.card,section,div');
            var h = box && box.querySelector('summary,h2,h3,h4,strong');
            context = h && h.textContent;
        } el.setAttribute('aria-label', (context || 'Поле ввода').trim().slice(0, 120)); });
        document.querySelectorAll('button').forEach(function (el) { if ((el.textContent || '').trim() || el.getAttribute('aria-label') || el.title)
            return; var name = known[el.id] || el.getAttribute('data-label') || el.getAttribute('data-role'); if (!name) {
            var c = el.closest('details,.card,section,div');
            var h = c && c.querySelector('summary,h2,h3,h4,strong');
            name = (h && h.textContent ? ('Действие: ' + h.textContent.trim()) : 'Открыть действие');
        } el.setAttribute('aria-label', name.slice(0, 120)); });
    }
    function sync() {
        ensureMethodDetails();
        ensureRationTools();
        ensureEmptyStates();
        ensureProfileDisclosure();
        fixNeeds();
        syncSearch();
        accessibleNames();
        var empty = ration().length === 0;
        document.body.classList.toggle('ration-empty', empty);
        ['rationSection', 'heiPanel', 'dietAnalysisProfilePanel'].forEach(function (id) { var e = byId(id); if (e)
            e.classList.toggle('ui-empty', empty); });
    }
    var queued = false;
    function schedule() { if (queued)
        return; queued = true; setTimeout(function () { queued = false; sync(); }, 40); }
    ['app:ready', 'ration:changed', 'hei:rendered', 'diet:profile-rendered', 'needs:computed', 'storage', 'resize'].forEach(function (n) { window.addEventListener(n, schedule); });
    document.addEventListener('input', function (e) { if (e.target && e.target.id === 'needs_age')
        schedule(); }, true);
    document.addEventListener('DOMContentLoaded', schedule);
    if (document.readyState !== 'loading')
        schedule();
    var obs = new MutationObserver(schedule);
    setTimeout(function () { try {
        obs.observe(document.body, { childList: true, subtree: true });
    }
    catch (_) { } }, 0);
    window.__UI_DESIGN_AUDIT_V53110__ = { version: VERSION, sync: sync };
})();
