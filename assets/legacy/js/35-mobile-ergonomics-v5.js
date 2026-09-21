// nutrition calculator v5.2.23_mobile_first_pass
// Module: 35-mobile-ergonomics-v5.js
// Responsibility: mobile search ergonomics only. Does not alter nutrition data, ration state or formulas.
(function () {
    'use strict';
    var VERSION = 'v5.2.38_mobile_scroll_guard';
    var MQ = '(max-width: 760px)';
    var lastDirectSearchPointer = 0;
    function byId(id) { return document.getElementById(id); }
    function isMobile() { return !!(window.matchMedia && window.matchMedia(MQ).matches); }
    function q() { var input = byId('globalSearchInput'); return input ? String(input.value || '').trim() : ''; }
    function hasQuery() { return q().length >= 2; }
    function resultHasCards() { var r = byId('globalResults'); return !!(r && (r.querySelector('.search-result-card') || r.classList.contains('has-query'))); }
    function setBodyFlag(cls, on) { if (document.body)
        document.body.classList.toggle(cls, !!(on && isMobile())); }
    function syncSearchMode() {
        var input = byId('globalSearchInput');
        var active = document.activeElement;
        var focusedInsideSearch = !!(active && active.closest && active.closest('#globalSearchSection'));
        setBodyFlag('mobile-search-mode', focusedInsideSearch || hasQuery());
        setBodyFlag('search-results-visible', hasQuery() && resultHasCards());
    }
    function updateViewportVars() {
        if (!document.documentElement)
            return;
        var vv = window.visualViewport;
        var h = vv && vv.height ? vv.height : window.innerHeight;
        document.documentElement.style.setProperty('--mobile-vvh', Math.round(h) + 'px');
    }
    function updateKeyboardClass() {
        if (!document.body)
            return;
        updateViewportVars();
        var vv = window.visualViewport;
        var baseH = window.innerHeight || (vv && vv.height) || 1;
        var visibleH = vv && vv.height ? vv.height : baseH;
        var ratio = visibleH / Math.max(baseH, 1);
        var keyboardLikely = isMobile() && (ratio < 0.82 || (baseH - visibleH) > 120);
        document.body.classList.toggle('keyboard-open', !!keyboardLikely);
    }
    function scrollSearchIntoView(reason) {
        // v5.3.36: disabled. Search focus must not move the page automatically.
        return;
    }
    function afterUiChange(delay) {
        window.setTimeout(function () { updateKeyboardClass(); syncSearchMode(); }, delay || 0);
    }
    function install() {
        var input = byId('globalSearchInput');
        var clear = byId('globalSearchClear');
        var results = byId('globalResults');
        if (input && !input.dataset.v5221MobileObserved) {
            input.dataset.v5221MobileObserved = '1';
            input.addEventListener('pointerdown', function () { lastDirectSearchPointer = Date.now(); }, true);
            input.addEventListener('touchstart', function () { lastDirectSearchPointer = Date.now(); }, true);
            input.addEventListener('focus', function () {
                afterUiChange(0);
                if (Date.now() - lastDirectSearchPointer < 900)
                    scrollSearchIntoView('direct-input');
            }, true);
            input.addEventListener('input', function () { afterUiChange(0); afterUiChange(120); }, true);
            input.addEventListener('blur', function () { afterUiChange(160); }, true);
        }
        if (clear && !clear.dataset.v5221MobileObserved) {
            clear.dataset.v5221MobileObserved = '1';
            clear.addEventListener('click', function () { afterUiChange(40); afterUiChange(180); }, true);
        }
        if (results && !results.dataset.v5221MobileObserved) {
            results.dataset.v5221MobileObserved = '1';
            results.addEventListener('pointerdown', function () { afterUiChange(0); }, true);
            results.addEventListener('click', function (e) {
                var add = e.target && e.target.closest && e.target.closest('[data-role="add-search"], [data-role="add"]');
                if (add) {
                    var input = byId('globalSearchInput');
                    if (input && input.blur)
                        window.setTimeout(function () { input.blur(); }, 80);
                    afterUiChange(120);
                    afterUiChange(320);
                }
            }, true);
            try {
                new MutationObserver(function () { afterUiChange(0); afterUiChange(120); }).observe(results, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
            }
            catch (_) { }
        }
        document.addEventListener('focusin', function (e) {
            if (e.target && e.target.closest && e.target.closest('#globalSearchSection'))
                afterUiChange(0);
        }, true);
        document.addEventListener('focusout', function () { afterUiChange(180); }, true);
        document.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('[data-search-example], [data-search-grams], #globalSearchSection'))
                afterUiChange(60);
        }, true);
        window.addEventListener('ration:changed', function () { afterUiChange(100); });
        if (window.visualViewport && !window.__V5221_VISUAL_VIEWPORT_OBSERVED__) {
            window.__V5221_VISUAL_VIEWPORT_OBSERVED__ = true;
            window.visualViewport.addEventListener('resize', function () { afterUiChange(0); });
        }
        window.addEventListener('resize', function () { afterUiChange(60); });
        document.addEventListener('visibilitychange', function () { afterUiChange(0); });
        afterUiChange(0);
    }
    function tests() {
        var rows = [
            { test: 'v5.2.23 mobile CSS linked', pass: !!document.querySelector('link[href*="mobile-ergonomics-v5.css"],link[data-css-bundle="5.3.117"]') },
            { test: 'v5.2.23 mobile JS loaded', pass: window.__V5221_MOBILE_ERGONOMICS__ === VERSION, detail: window.__V5221_MOBILE_ERGONOMICS__ || 'missing' },
            { test: 'global search input exists', pass: !!byId('globalSearchInput') },
            { test: 'global search results exists', pass: !!byId('globalResults') },
            { test: 'mini cart can be controlled by mobile classes', pass: !!document.body && typeof document.body.classList.toggle === 'function' },
            { test: 'CSS :has fallback rule expected in stylesheet', pass: [].some.call(document.styleSheets || [], function (ss) { try {
                    return [].some.call(ss.cssRules || [], function (r) { return String(r.cssText || '').indexOf(':has(#globalSearchInput:focus)') >= 0; });
                }
                catch (_) {
                    return false;
                } }) }
        ];
        if (console && console.table)
            console.table(rows);
        return rows.every(function (r) { return !!r.pass; });
    }
    function init() {
        window.__V5221_MOBILE_ERGONOMICS__ = VERSION;
        window.__V5220_MOBILE_ERGONOMICS__ = VERSION; // compatibility for older self-test labels
        window.runV5220MobileErgonomicsTests = tests;
        window.runV5221MobileErgonomicsTests = tests;
        install();
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
