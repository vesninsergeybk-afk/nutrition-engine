// nutrition calculator v5.3.36_harvard_event_bridge_only
// Keeps Harvard Plate reactive after State changes.
// Does NOT patch programmatic scrolling API, programmatic input activation, scroll, or <details>.
(function(){
  'use strict';

  var VERSION = 'v5.3.208_harvard_event_bridge_dedup';
  window.__V5326_HARVARD_EVENT_BRIDGE_ONLY__ = VERSION;
  window.__V5326_SCROLL_FOCUS_PATCHES_REMOVED__ = true;

  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  function harvardApis(){
    var out = [];
    [
      'HarvardPlateV5329','HarvardPlateV5326','HarvardPlateV5326','HarvardPlateV5317','HarvardPlateV5316','HarvardPlateV5315',
      'HarvardPlateV5314','HarvardPlateV5313','HarvardPlateV5312','HarvardPlateV5311','HarvardPlateV5310',
      'HarvardPlateV539','HarvardPlateV538','HarvardPlateV537','HarvardPlateV536','HarvardPlateV535',
      'HarvardPlateV534','HarvardPlateV533','HarvardPlateV532','HarvardPlateV531','HarvardPlateV530',
      'HarvardPlateV529','HarvardPlateV528','HarvardPlateV527','HarvardPlateV526','HarvardPlateV525',
      'HarvardPlateV524','HarvardPlateV523','HarvardPlateV522','HarvardPlateV521','HarvardPlateV520'
    ].forEach(function(name){
      if (window[name] && out.indexOf(window[name]) < 0) out.push(window[name]);
    });
    return out;
  }

  var scheduleTimer = 0;
  function renderHarvardNow(reason){
    var apis = harvardApis();
    var ok = false;
    apis.forEach(function(api){
      try {
        if (api && typeof api.scheduleRender === 'function') { api.scheduleRender(reason || 'event-bridge'); ok = true; }
        else if (api && typeof api.render === 'function') { api.render(); ok = true; }
      } catch(e) { try { console.warn('[v5.3.36] Harvard render failed', e); } catch(_) {} }
    });
    try {
      window.dispatchEvent(new CustomEvent('harvard:event-bridge-render', { detail:{ reason:reason || 'event-bridge', ok:ok, version:VERSION } }));
    } catch(_) {}
    return ok;
  }

  function harvardInputSignature(){
    try {
      var ration = window.State && typeof window.State.get === 'function' ? window.State.get() : [];
      var compact = (ration || []).map(function(x){return [x.id||x.key||x.productKey||'',Number(x.grams)||0,x.preparation||x.state||''];});
      var hei = window.__lastHEIModel || {}; var needs = window.__lastNeedsResult || window.__lastNeedsComputed || {};
      return JSON.stringify({ration:compact,hei:[Number(hei.total)||0,Number(hei.energyRefKcal)||0],needs:[Number(needs.appliedKcal)||0,Number(needs.kcal)||0]});
    } catch(_) { return ''; }
  }
  function scheduleHarvard(reason){
    clearTimeout(scheduleTimer);
    scheduleTimer=setTimeout(function(){
      var signature=harvardInputSignature();
      if(signature&&signature===window.__lastHarvardEventBridgeSignature){window.__HARVARD_EVENT_BRIDGE_STATS__=window.__HARVARD_EVENT_BRIDGE_STATS__||{renders:0,skips:0};window.__HARVARD_EVENT_BRIDGE_STATS__.skips+=1;return;}
      window.__lastHarvardEventBridgeSignature=signature;window.__HARVARD_EVENT_BRIDGE_STATS__=window.__HARVARD_EVENT_BRIDGE_STATS__||{renders:0,skips:0};window.__HARVARD_EVENT_BRIDGE_STATS__.renders+=1;renderHarvardNow(reason);
    },80);
  }

    function patchStateMethods(){
    var api = window.State;
    if (!api || api.__v5319HarvardPatched) return false;
    ['add','update','remove','clear'].forEach(function(method){
      if (typeof api[method] !== 'function') return;
      var original = api[method];
      api[method] = function(){
        var ret = original.apply(this, arguments);
        scheduleHarvard('State.' + method);
        return ret;
      };
    });
    api.__v5319HarvardPatched = true;
    return true;
  }

  function initHarvardBridge(){
    var tries = 0;
    (function waitState(){
      tries += 1;
      if (!patchStateMethods() && tries < 60) setTimeout(waitState, 100);
    })();

    ['products:loaded','runtime:loader-closed','ration:changed','hei:rendered','hei:forced-recompute','hei:watchdog-recomputed','storage','visibilitychange'].forEach(function(ev){
      window.addEventListener(ev, function(){ scheduleHarvard(ev); });
    });

    setTimeout(function(){ scheduleHarvard('late-init-1'); }, 500);
    setTimeout(function(){ scheduleHarvard('late-init-2'); }, 1500);
  }

  onReady(initHarvardBridge);
})();
