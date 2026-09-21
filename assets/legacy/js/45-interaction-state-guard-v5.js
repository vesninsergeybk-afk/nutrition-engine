// nutrition calculator v5.3.36_harvard_inline_plate_details
// Browser Native Interaction Reset.
// This module intentionally does NOT control <details>, programmatic input activation, scroll, or programmatic scrolling API.
// It only clears stale accordion state left by older versions.
(function () {
    'use strict';
    var VERSION = 'v5.3.36_harvard_inline_plate_details';
    window.__V5326_BROWSER_NATIVE_INTERACTION_RESET__ = VERSION;
    window.__V5326_GLOBAL_DETAILS_RESTORE_DISABLED__ = true;
    window.__V5326_SCROLL_PATCHES_DISABLED__ = true;
    function clearOldState() {
        try {
            [
                'nutri_v538_details_open_state',
                'nutri_v5314_details_open_state',
                'nutri_v5315_details_open_state',
                'nutri_v5316_details_open_state',
                'nutri_v5317_details_open_state'
            ].forEach(function (k) { sessionStorage.removeItem(k); });
            sessionStorage.setItem('nutri_v5328_native_interaction_reset_done', '1');
        }
        catch (_) { }
    }
    function init() { clearOldState(); }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
