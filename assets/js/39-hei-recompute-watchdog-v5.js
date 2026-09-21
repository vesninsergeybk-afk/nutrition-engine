// nutrition calculator v5.3.194_hei_fallback_watchdog
// Responsibility: last-line HEI refresh guard. It watches the authoritative ration state and forces HEI recompute when it changes.
(function(){
  'use strict';
  var VERSION = 'v5.3.194_hei_fallback_watchdog';
  window.__V528_HEI_RECOMPUTE_WATCHDOG__ = VERSION;
  var lastSnapshot = null;
  var timer = null;
  var scheduleToken = 0;
  function safeRation(){
    try {
      if (window.State && typeof window.State.get === 'function') return window.State.get() || [];
    } catch(_) {}
    try {
      if (window.Ration && Array.isArray(window.Ration.current)) return window.Ration.current || [];
    } catch(_) {}
    try {
      if (window.STATE && Array.isArray(window.STATE.ration)) return window.STATE.ration || [];
    } catch(_) {}
    try {
      var raw = localStorage.getItem('nutri_ration_v1');
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch(_) {}
    return [];
  }
  function snapshot(){
    var r = safeRation().map(function(x){ return { key: x && x.key, grams: +(x && x.grams) || 0 }; })
      .filter(function(x){ return x.key && x.grams > 0; })
      .sort(function(a,b){ return String(a.key).localeCompare(String(b.key)); });
    return JSON.stringify(r);
  }
  function doRecompute(reason){
    try {
      if (!window.__heiInst && typeof window.initHEI === 'function') window.initHEI();
      if (window.__heiInst && typeof window.__heiInst.recompute === 'function') {
        window.__heiInst.recompute();
        try { window.dispatchEvent(new CustomEvent('hei:watchdog-recomputed', { detail: { reason: reason || 'unknown' } })); } catch(_) {}
      }
    } catch (e) {
      console.error('HEI watchdog recompute failed', e);
    }
  }
  function schedule(reason){
    clearTimeout(timer);
    var token = ++scheduleToken;
    var requestedAt = Date.now();
    timer = setTimeout(function(){
      if (token !== scheduleToken) return;
      if ((Number(window.__lastHEIRenderedAt) || 0) >= requestedAt) return;
      doRecompute(reason + ':fallback');
    }, 260);
  }
  function check(reason){
    var snap = snapshot();
    if (snap !== lastSnapshot) {
      lastSnapshot = snap;
      schedule(reason || 'snapshot-change');
    }
  }
  ['ration:changed','hei:bridge-updated','storage','needs:changed'].forEach(function(ev){
    window.addEventListener(ev, function(){ check(ev); });
  });
  document.addEventListener('input', function(e){
    var t = e && e.target;
    if (t && t.matches && t.matches('[data-ration-key], .ration-row input, input[type="number"]')) setTimeout(function(){ check('input'); }, 280);
  }, true);
  document.addEventListener('click', function(e){
    var t = e && e.target;
    if (t && t.closest && (t.closest('[data-role="rm"]') || t.closest('#clearRationBtn') || t.closest('#resetBtn') || t.closest('button[data-role="add"]'))) {
      setTimeout(function(){ check('click'); }, 80);
      setTimeout(function(){ check('click-late'); }, 350);
    }
  }, true);
  function init(){
    lastSnapshot = snapshot();
    schedule('init');
    setInterval(function(){ check('poll'); }, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
