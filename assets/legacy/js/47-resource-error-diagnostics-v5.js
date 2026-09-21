// nutrition calculator v5.3.36_resource_error_diagnostics
// Passive diagnostics only. Does not alter UI, scrolling, focus, details, or calculations.
(function () {
    'use strict';
    var VERSION = 'v5.3.36_resource_error_diagnostics';
    window.__V5326_RESOURCE_ERROR_DIAGNOSTICS__ = VERSION;
    window.__RESOURCE_LOAD_ERRORS__ = window.__RESOURCE_LOAD_ERRORS__ || [];
    function srcOf(t) {
        try {
            return t && (t.currentSrc || t.src || t.href || t.getAttribute && (t.getAttribute('src') || t.getAttribute('href')));
        }
        catch (_) {
            return '';
        }
    }
    window.addEventListener('error', function (e) {
        try {
            var t = e && e.target;
            if (!t || t === window)
                return;
            var url = srcOf(t);
            if (!url)
                return;
            var row = {
                tag: (t.tagName || '').toLowerCase(),
                url: url,
                at: new Date().toISOString(),
                version: VERSION
            };
            window.__RESOURCE_LOAD_ERRORS__.push(row);
            try {
                console.warn('[resource-load-error]', row);
            }
            catch (_) { }
        }
        catch (_) { }
    }, true);
    window.__printResourceLoadErrors = function () {
        try {
            return window.__RESOURCE_LOAD_ERRORS__.slice();
        }
        catch (_) {
            return [];
        }
    };
})();
