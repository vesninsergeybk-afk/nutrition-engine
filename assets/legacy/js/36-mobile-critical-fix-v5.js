// nutrition calculator v5.2.23_mobile_first_pass
// Module: 36-mobile-critical-fix-v5.js
// Responsibility: mobile viewport hardening + robust live BMI refresh. Nutrition formulas/data are untouched.
(function () {
    'use strict';
    var VERSION = 'v5.2.23_mobile_first_pass';
    function byId(id) { return document.getElementById(id); }
    function toNum(v) {
        var n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^0-9.\-]/g, ''));
        return Number.isFinite(n) ? n : NaN;
    }
    function computeBmiValue() {
        var h = toNum(byId('needs_h') && byId('needs_h').value);
        var w = toNum(byId('needs_w') && byId('needs_w').value);
        if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0)
            return '';
        var m = h > 3 ? h / 100 : h;
        if (!m)
            return '';
        return (w / (m * m)).toFixed(1);
    }
    function refreshBmi() {
        var out = byId('needs_bmi');
        if (!out)
            return;
        var next = computeBmiValue();
        if (out.value !== next)
            out.value = next;
    }
    function markViewport() {
        if (!document.documentElement || !document.body)
            return;
        var w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        var mobile = w <= 760;
        document.body.classList.toggle('mobile-critical-viewport', mobile);
        document.documentElement.style.setProperty('--critical-vw', String(w) + 'px');
    }
    function installBmi() {
        ['needs_h', 'needs_w', 'needs_age', 'needs_sex', 'needs_state', 'needs_activity', 'needs_edema', 'needs_goal'].forEach(function (id) {
            var el = byId(id);
            if (!el || el.dataset.v5222BmiObserved)
                return;
            el.dataset.v5222BmiObserved = '1';
            ['input', 'change', 'keyup', 'blur'].forEach(function (ev) { el.addEventListener(ev, refreshBmi, true); });
        });
        refreshBmi();
        window.setTimeout(refreshBmi, 150);
        window.setTimeout(refreshBmi, 500);
        window.setTimeout(refreshBmi, 1200);
    }
    function install() {
        markViewport();
        installBmi();
        window.addEventListener('resize', function () { markViewport(); window.setTimeout(refreshBmi, 0); }, { passive: true });
        window.addEventListener('orientationchange', function () { window.setTimeout(markViewport, 60); window.setTimeout(refreshBmi, 120); }, { passive: true });
        document.addEventListener('visibilitychange', function () { markViewport(); refreshBmi(); }, true);
        window.__V5222_MOBILE_CRITICAL_HOTFIX__ = VERSION;
        window.runV5222MobileCriticalTests = function () {
            return {
                version: VERSION,
                cssLinked: !!document.querySelector('link[href*="mobile-critical-fix-v5.css"],link[data-css-bundle="5.3.117"]'),
                bmiField: !!byId('needs_bmi'),
                viewportClass: !!(document.body && document.body.classList.contains('mobile-critical-viewport')),
                documentWidth: document.documentElement ? document.documentElement.scrollWidth : null,
                innerWidth: window.innerWidth || null
            };
        };
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', install, { once: true });
    else
        install();
})();
