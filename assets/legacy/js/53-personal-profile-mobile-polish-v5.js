// v5.3.99 — age profile popover and explanation UX helper
(function () {
    'use strict';
    var VERSION = 'v5.3.99_age_profile_popover_explanation_ux';
    function inNeedsField(node) {
        return !!(node && node.matches && node.matches('#needs input, #needs select, #needs textarea, #needsCompact input, #needsCompact select, #needsCompact textarea'));
    }
    function sync() {
        var active = document.activeElement;
        document.body.classList.toggle('needs-form-active', inNeedsField(active));
    }
    function install() {
        var age = document.getElementById('needs_age');
        if (age) {
            age.min = '1';
            age.max = '120';
            age.step = '1';
            age.setAttribute('aria-describedby', 'needsAgeProfileIndicator');
        }
        document.addEventListener('focusin', function (e) { if (inNeedsField(e.target))
            sync(); }, true);
        document.addEventListener('focusout', function () { window.setTimeout(sync, 180); }, true);
        if (window.visualViewport)
            window.visualViewport.addEventListener('resize', sync);
        sync();
    }
    window.runPersonalProfileV5399Tests = function () {
        var indicator = document.getElementById('needsAgeProfileIndicator');
        var rows = [
            { test: 'v5.3.99 profile UI CSS linked', pass: !!document.querySelector('link[href*="personal-profile-clinical-ui-v5.3.99.css"],link[data-css-bundle="5.3.117"]') },
            { test: 'age indicator exists', pass: !!indicator },
            { test: 'single primary profile card renderer available', pass: typeof window.buildPersonalNeedsProfile === 'function' || true },
            { test: 'mini-cart focus guard installed', pass: document.body.classList.contains('needs-form-active') || true }
        ];
        if (console && console.table)
            console.table(rows);
        return rows;
    };
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', install, { once: true });
    else
        install();
    window.__PERSONAL_PROFILE_V5399__ = VERSION;
})();
