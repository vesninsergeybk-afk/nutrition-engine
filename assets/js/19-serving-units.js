// nutrition calculator v5.3.145_serving_units_candy_source_integrity
// Module: 19-serving-units.js
// Responsibility: show advisory piece/portion weights in product cards, catalog selectors and ration rows for products that explicitly have serving_units.
(function(){
  'use strict';
  var VERSION = 'v5.3.145_serving_units_candy_source_integrity';
  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function productsArray(){
    try {
      if (window.DB && Array.isArray(window.DB.items)) return window.DB.items;
      var db = byId('db');
      var parsed = db ? JSON.parse(db.textContent || '[]') : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(_) { return []; }
  }
  function productByKey(key){
    if (!key) return null;
    if (window.DB && window.DB.byKey && typeof window.DB.byKey.get === 'function') {
      var p = window.DB.byKey.get(key);
      if (p) return p;
    }
    var arr = productsArray();
    for (var i=0;i<arr.length;i++) if (arr[i] && arr[i].key === key) return arr[i];
    return null;
  }
  function primaryUnit(product){
    if (!product) return null;
    var units = Array.isArray(product.serving_units) ? product.serving_units : [];
    if (!units.length && !product.serving_unit_hint) return null;
    return units[0] || { display: product.serving_unit_hint, priority:'P2', confidence:'low' };
  }
  function hintText(product){
    if (!product) return '';
    if (product.serving_unit_hint) return String(product.serving_unit_hint).trim();
    var unit = primaryUnit(product);
    return unit && unit.display ? String(unit.display).trim() : '';
  }
  function priority(product){
    var unit = primaryUnit(product);
    return unit && unit.priority ? String(unit.priority) : '';
  }
  function note(product){
    return product && product.serving_units_note ? String(product.serving_units_note).trim() : '';
  }
  function makeHint(product, extraClass, options){
    var text = hintText(product);
    if (!text) return null;
    var opts = options || {};
    var div = document.createElement('div');
    div.className = 'serving-unit-hint' + (extraClass ? ' ' + extraClass : '');
    div.dataset.priority = priority(product) || 'P2';
    div.dataset.servingUnitsFor = product.key || '';
    var n = opts.hideNote ? '' : note(product);
    div.innerHTML = '<strong>Ориентир:</strong><span>' + esc(text) + (n ? '<br><span class="serving-unit-note">' + esc(n) + '</span>' : '') + '</span>';
    return div;
  }
  function enhanceSearchCards(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('.search-result-card[data-key]'));
    cards.forEach(function(card){
      var key = card.dataset.key;
      if (!key || card.dataset.servingUnitsKey === key) return;
      var old = card.querySelector('.serving-unit-hint');
      if (old) old.remove();
      var product = productByKey(key);
      var hint = makeHint(product, 'search-serving-hint');
      if (!hint) { card.dataset.servingUnitsKey = key; return; }
      var anchor = card.querySelector('.search-result-nutrients') || card.querySelector('[data-role="portion"]') || card.querySelector('.search-result-meta') || card.querySelector('.search-result-title');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(hint, anchor.nextSibling);
      else card.appendChild(hint);
      card.dataset.servingUnitsKey = key;
    });
  }
  function enhanceCatalogSelect(select){
    if (!select || !select.value) return;
    var product = productByKey(select.value);
    var body = select.closest('.accordion-body') || select.closest('.inline') || select.parentNode;
    if (!body) return;
    var old = body.querySelector('.catalog-serving-hint');
    var hint = makeHint(product, 'catalog-serving-hint');
    if (!hint) {
      if (old) old.remove();
      return;
    }
    if (old &&
        old.getAttribute('data-serving-units-for') === hint.getAttribute('data-serving-units-for') &&
        old.innerHTML === hint.innerHTML) return;
    if (old) old.remove();
    var inline = select.closest('.inline');
    if (inline && inline.parentNode) inline.parentNode.insertBefore(hint, inline.nextSibling);
    else body.appendChild(hint);
  }
  function enhanceCatalog(){
    Array.prototype.slice.call(document.querySelectorAll('select[data-role="select"]')).forEach(function(sel){
      if (!sel.dataset.servingUnitsObserved) {
        sel.dataset.servingUnitsObserved = '1';
        sel.addEventListener('change', function(){ enhanceCatalogSelect(sel); });
      }
      enhanceCatalogSelect(sel);
    });
  }
  function ensureRationTitleStack(row){
    var nameCell = row && row.querySelector ? row.querySelector('.ration-name') : null;
    if (!nameCell) return null;
    var title = nameCell.querySelector('.ration-title');
    if (!title) return null;
    var stack = nameCell.querySelector('.ration-title-stack');
    if (stack) return stack;
    stack = document.createElement('span');
    stack.className = 'ration-title-stack';
    nameCell.insertBefore(stack, title);
    stack.appendChild(title);
    return stack;
  }
  function enhanceRationRows(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('#rationBody .ration-row'));
    rows.forEach(function(row){
      var input = row.querySelector('input[data-ration-key]');
      var key = input ? input.getAttribute('data-ration-key') : '';
      if (!key) return;
      var product = productByKey(key);
      var hintTextValue = hintText(product);
      var old = row.querySelector('.ration-serving-hint');
      if (!hintTextValue) {
        if (old) old.remove();
        row.dataset.servingUnitsKey = key;
        return;
      }
      if (row.dataset.servingUnitsKey === key && old) return;
      if (old) old.remove();
      var stack = ensureRationTitleStack(row);
      if (!stack) return;
      var hint = makeHint(product, 'ration-serving-hint', { hideNote:true });
      if (!hint) return;
      stack.appendChild(hint);
      row.dataset.servingUnitsKey = key;
    });
  }
  function postProcess(){
    enhanceSearchCards();
    enhanceCatalog();
    enhanceRationRows();
  }
  function install(){
    var root = byId('globalResults');
    if (root && !root.dataset.servingUnitsObserved) {
      root.dataset.servingUnitsObserved = '1';
      new MutationObserver(function(){ window.setTimeout(postProcess, 0); }).observe(root, {childList:true, subtree:true});
    }
    var cats = byId('categories');
    if (cats && !cats.dataset.servingUnitsObserved) {
      cats.dataset.servingUnitsObserved = '1';
      new MutationObserver(function(){ window.setTimeout(postProcess, 30); }).observe(cats, {childList:true, subtree:true});
    }
    var rationBody = byId('rationBody');
    if (rationBody && !rationBody.dataset.servingUnitsObserved) {
      rationBody.dataset.servingUnitsObserved = '1';
      new MutationObserver(function(){ window.setTimeout(postProcess, 0); }).observe(rationBody, {childList:true, subtree:true});
    }
    document.addEventListener('change', function(e){
      var sel = e.target && e.target.closest && e.target.closest('select[data-role="select"]');
      if (sel) enhanceCatalogSelect(sel);
    }, true);
    window.addEventListener('ration:changed', function(){ window.setTimeout(postProcess, 0); });
  }
  function tests(){
    var arr = productsArray();
    var withUnits = arr.filter(function(p){ return p && Array.isArray(p.serving_units) && p.serving_units.length; });
    var egg = productByKey('egg_whole_boiled');
    var banana = productByKey('banana');
    var rationTestPass = true;
    var rationDetail = 'rationBody отсутствует';
    var rb = byId('rationBody');
    if (rb && banana) {
      var tr = document.createElement('tr');
      tr.className = 'ration-row';
      tr.innerHTML = '<td class="ration-name"><span class="expander">▸</span><span class="ration-title">Банан (сырой)</span></td><td></td><td><input data-ration-key="banana" type="number" value="120"></td><td></td>';
      rb.appendChild(tr);
      try {
        enhanceRationRows();
        var hint = tr.querySelector('.ration-serving-hint');
        rationTestPass = !!(hint && /банан/i.test(hint.textContent || '') && /115|120/.test(hint.textContent || ''));
        rationDetail = hint ? hint.textContent.replace(/\s+/g,' ').trim() : 'подсказка не создана';
      } finally {
        if (tr.parentNode) tr.parentNode.removeChild(tr);
      }
    }
    var rows = [
      {test:'v4.6.6 serving units CSS linked', pass:!!document.querySelector('link[href$="serving-units.css"],link[data-css-bundle="5.3.117"]')},
      {test:'v4.6.6 serving units JS loaded', pass:window.__V466_SERVING_UNITS__ === VERSION},
      {test:'serving_units products count', pass:withUnits.length === 274, detail:withUnits.length + ' / 274'},
      {test:'banana has serving hint', pass:!!(banana && banana.serving_unit_hint && /банан/i.test(banana.serving_unit_hint)), detail:banana && banana.serving_unit_hint},
      {test:'egg variants present', pass:!!(egg && Array.isArray(egg.serving_units) && egg.serving_units.length >= 3), detail:egg && egg.serving_unit_hint},
      {test:'ration row serving hint can render', pass:rationTestPass, detail:rationDetail}
    ];
    if (console && console.table) console.table(rows);
    return rows.every(function(r){ return !!r.pass; });
  }
  function init(){
    window.__V46_SERVING_UNITS__ = VERSION;
    window.__V466_SERVING_UNITS__ = VERSION;
    window.__enhanceServingUnitHints = postProcess;
    window.runV46ServingUnitsTests = tests;
    window.runV466ServingUnitCardVisibilityTests = tests;
    install();
    postProcess();
    var prev = window.runSmokeTests;
    window.runSmokeTests = function(){
      var ok = true;
      try { ok = prev ? prev() : true; } catch(e) { ok = false; window.__v466PreviousSmokeError = String(e && e.message || e); }
      return !!ok && window.runV466ServingUnitCardVisibilityTests();
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
