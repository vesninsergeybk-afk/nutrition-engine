// nutrition calculator v5.3.37_harvard_inline_plate_details
// The first-step popup/handoff was intentionally removed.
// Keep this compatibility module so bootstrap script order remains stable.
(function(){
  'use strict';
  var VERSION = 'v5.3.37_harvard_inline_plate_details';
  window.__V5326_FIRST_STEP_POPUP_REMOVED__ = VERSION;
  window.__V44_NEEDS_FIRST_STEP__ = VERSION;
  window.__V545_NEEDS_HINT_HANDOFF__ = VERSION;

  function setNormalDefaults(){
    try {
      var state = document.getElementById('needs_state');
      if (state && (!state.value || state.value === 'rehab')) state.value = 'normal';
      var normal = state && state.querySelector('option[value="normal"]');
      var rehab = state && state.querySelector('option[value="rehab"]');
      if (normal) normal.defaultSelected = true;
      if (rehab) rehab.defaultSelected = false;
    } catch(_) {}
  }

  function removeOldPopup(){
    try {
      var ids = ['needsFirstHint', 'needsFirstHandoffRuntimeStyle'];
      ids.forEach(function(id){
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    } catch(_) {}
  }

  window.NeedsFirstStepHandoff = {
    show:function(){
      // Intentionally no-op since v5.3.37.
      removeOldPopup();
      return false;
    },
    removed:true,
    version:VERSION
  };

  function init(){
    setNormalDefaults();
    removeOldPopup();
    try { sessionStorage.setItem('nutri_v5328_needs_hint_removed', '1'); } catch(_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
