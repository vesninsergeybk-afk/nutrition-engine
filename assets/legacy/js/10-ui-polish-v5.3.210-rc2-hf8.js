// nutrition calculator v5.2.23_mobile_first_pass
// Module: 10-ui-polish.js
// Responsibility: user-facing UX polish without changing product data or nutrient calculations.
(function(){
  'use strict';
  var VERSION = 'v5.3.99_age_profile_popover_explanation_ux';
  function byId(id){ return document.getElementById(id); }
  function safeText(s){ return String(s == null ? '' : s); }
  function fmt1(n){ n = Number(n); return Number.isFinite(n) ? (Math.round(n * 10) / 10).toString() : '0'; }
  function escapeHtml(s){ return safeText(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function getRationItems(){
    try {
      if (window.State && typeof window.State.get === 'function') {
        var stateItems = window.State.get();
        return Array.isArray(stateItems) ? stateItems : [];
      }
    } catch(_) {}
    try { var items = JSON.parse(localStorage.getItem('nutri_ration_v1') || '[]'); return Array.isArray(items) ? items : []; }
    catch(_) { return []; }
  }
  function productMacro(p, keys){
    for (var i=0;i<keys.length;i++) {
      var v = p && p[keys[i]];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return 0;
  }
  function calcRationKpi(){
    var items = getRationItems();
    var DB = window.DB;
    var total = {count: items.length, kcal:0, protein:0, fat:0, carbs:0};
    if (!DB || !DB.byKey) return total;
    items.forEach(function(it){
      var p = DB.byKey.get(it.key) || it;
      var g = Math.max(0, Number(it.grams) || 0);
      total.kcal += g * productMacro(p, ['kcal']) / 100;
      total.protein += g * productMacro(p, ['protein_per_100g','protein_g','protein']) / 100;
      total.fat += g * productMacro(p, ['fat_per_100g','fat_g','fat']) / 100;
      total.carbs += g * productMacro(p, ['carbs_per_100g','carbs_g','carbs']) / 100;
    });
    return total;
  }
  function kpiText(kpi){
    if (!kpi.count) return 'Рацион пока пуст';
    return kpi.count + ' поз. · ' + fmt1(kpi.kcal) + ' ккал · Б ' + fmt1(kpi.protein) + ' · Ж ' + fmt1(kpi.fat) + ' · У ' + fmt1(kpi.carbs);
  }
  function updateMiniCart(){
    var bar = byId('v40MiniCart');
    if (!bar) return;
    var kpi = calcRationKpi();
    var text = bar.querySelector('.v40-mini-cart-text');
    if (text) text.textContent = kpiText(kpi);
    bar.classList.toggle('is-visible', !!kpi.count);
  }
  function initMiniCart(){
    if (byId('v40MiniCart')) return;
    var bar = document.createElement('div');
    bar.id = 'v40MiniCart';
    bar.className = 'v40-mini-cart';
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = '<div class="v40-mini-cart-text">Рацион пока пуст</div><button type="button" class="secondary">К рациону</button>';
    document.body.appendChild(bar);
    bar.querySelector('button').addEventListener('click', function(){
      var target = byId('rationSection');
      if (target) {
        target.setAttribute('data-scroll-intent','true');
        try { target.scrollIntoView({behavior:'auto', block:'start'}); }
        finally { setTimeout(function(){ try { target.removeAttribute('data-scroll-intent'); } catch(_){} }, 600); }
      }
    });
    document.addEventListener('click', function(e){
      if (e.target && (e.target.closest('[data-role="add-search"]') || e.target.closest('[data-role="add"]') || e.target.closest('#clearRationBtn'))) {
        setTimeout(updateMiniCart, 80);
        setTimeout(updateMiniCart, 350);
      }
    }, true);
    document.addEventListener('input', function(e){
      if (e.target && e.target.closest('#rationSection')) setTimeout(updateMiniCart, 80);
    }, true);
    window.addEventListener('storage', updateMiniCart);
    window.addEventListener('ration:changed', updateMiniCart);
    setTimeout(updateMiniCart, 250);
  }
  function initNeedsCompact(){
    var section = byId('needsCompact');
    var needs = byId('needs');
    if (!section || !needs || byId('v40NeedsSummary')) return;
    var summary = document.createElement('div');
    summary.id = 'v40NeedsSummary';
    summary.className = 'v40-needs-summary';
    summary.innerHTML = '<div><div class="v40-needs-summary-title">Потребности и нормы</div><div class="v40-needs-summary-text" id="v40NeedsStatus">Сначала заполните данные человека и рассчитайте потребности. Затем переходите к его рациону.</div></div><button type="button" class="secondary v40-needs-toggle" id="v40NeedsToggle">Открыть калькулятор</button>';
    section.insertBefore(summary, section.firstChild);
    var toggle = byId('v40NeedsToggle');
    function setOpen(open){
      section.classList.toggle('v40-needs-collapsed', !open);
      if (toggle) toggle.textContent = open ? 'Свернуть калькулятор' : 'Открыть калькулятор';
      try { localStorage.setItem('nutri_v40_needs_open', open ? '1' : '0'); } catch(_) {}
    }
    function updateStatus(calculated){
      var out = byId('needs_out');
      var status = byId('v40NeedsStatus');
      if (!status) return;
      var text = out ? out.textContent.replace(/\s+/g,' ').trim() : '';
      if (calculated || (text && !/Введите исходные данные|нажмите «Рассчитать»/i.test(text))) {
        status.textContent = 'Потребности рассчитаны. Теперь можно составлять рацион и сопоставлять его с рассчитанными ориентирами.';
      } else {
        status.textContent = 'Сначала заполните данные человека и рассчитайте потребности. Затем переходите к его рациону.';
      }
    }
    var urlOpen = false;
    try { urlOpen = new URL(window.location.href).searchParams.get('needs') === '1'; } catch(_) {}
    var savedOpen = true;
    try {
      var rawOpen = localStorage.getItem('nutri_v40_needs_open');
      savedOpen = rawOpen === null ? true : rawOpen === '1';
    } catch(_) {}
    setOpen(urlOpen || savedOpen);
    if (toggle) toggle.addEventListener('click', function(){ setOpen(section.classList.contains('v40-needs-collapsed')); });
    var calc = byId('needs_calc_btn');
    if (calc) calc.addEventListener('click', function(){ setTimeout(function(){ updateStatus(true); }, 220); }, true);
    updateStatus(false);
  }
  function initDevMode(){
    var enabled = false;
    try {
      var params = new URL(window.location.href).searchParams;
      enabled = params.get('dev') === '1' || localStorage.getItem('nutri_dev_enabled') === '1';
      if (params.get('dev') === '1') localStorage.setItem('nutri_dev_enabled', '1');
    } catch(_) {}
    document.body.classList.toggle('dev-enabled', !!enabled);
    var labels = {
      state:'Состояние', logs:'Журнал', data:'Качество данных', perf:'Производительность', tests:'Проверки', norms:'Покрытие норм', catalogqa:'Проверка каталога'
    };
    document.querySelectorAll('#devTabs [data-tab]').forEach(function(btn){
      var key = btn.getAttribute('data-tab');
      if (labels[key]) btn.textContent = labels[key];
    });
  }
  function initTotalsCompact(){
    var details = document.querySelector('#totalsSection details.norms');
    if (details && !details.dataset.v40Touched) {
      details.dataset.v40Touched = '1';
      details.removeAttribute('open');
      var summary = details.querySelector('summary strong');
      if (summary) summary.textContent = 'Расширенные нутриенты и витамины/минералы — раскрыть';
    }
  }
  function initClearConfirm(){
    var btn = byId('clearRationBtn');
    if (!btn || btn.dataset.v40ConfirmBound) return;
    btn.dataset.v40ConfirmBound = '1';
    btn.addEventListener('click', function(e){
      var items = getRationItems();
      if (!items.length) return;
      var ok = window.confirm('Очистить весь итоговый рацион? Это удалит все добавленные позиции из текущего браузера.');
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      }
    }, true);
  }
  function initCopyText(){
    var deployVersion=String(window.__APP_DEPLOY_VERSION__||'v5.3.178'); document.title = 'Калькулятор нутриентов Сергея Веснина '+deployVersion;
    var title = document.querySelector('header .title');
    if (title && !title.querySelector('.badge')) {
      var span = document.createElement('span');
      span.className = 'badge version-badge';
      span.textContent = deployVersion;
      span.style.marginLeft = '8px';
      title.appendChild(span);
    }
    var lead = document.querySelector('#globalSearchSection .search-lead');
    if (lead) lead.textContent = 'Начните вводить продукт, укажите граммы и добавьте позицию в рацион. На телефоне найденные продукты появляются сразу под строкой поиска.';
    var status = byId('globalSearchStatus');
    if (status && /Начните вводить/.test(status.textContent)) {
      status.textContent = 'Введите минимум 2 символа. Поиск работает по названию, категории, HEI-группе и техническим меткам продукта.';
    }
    var pdfBtn = byId('exportTotalsPdfBtn');
    if (pdfBtn && pdfBtn.textContent.trim() === 'PDF') pdfBtn.textContent = 'Сохранить PDF';
    var needsPdf = byId('needs_pdf_btn');
    if (needsPdf && needsPdf.textContent.trim() === 'PDF') needsPdf.textContent = 'Сохранить PDF';
  }
  function initTopNote(){
    var search = byId('globalSearchSection');
    if (!search || byId('v40TopNote')) return;
    var note = document.createElement('p');
    note.id = 'v40TopNote';
    note.className = 'v40-top-note';
    note.textContent = 'Основной сценарий: поиск → граммы → добавить в рацион → проверить итоги. Разделы, HEI-группы и примеры находятся ниже в «Дополнительно».';
    search.insertBefore(note, search.firstChild);
  }
  function initTests(){
    var prev = window.runSmokeTests;
    window.runV40UiPolishTests = function(){
      var rows = [
        {test:'v4.5 UI polish CSS linked', pass:!!document.querySelector('link[href$="ui-polish.css"],link[data-css-bundle="5.3.117"]')},
        {test:'v4.5 UI polish JS loaded', pass:!!window.__V40_UI_POLISH__},
        {test:'v4.5 needs compact summary exists', pass:!!byId('v40NeedsSummary')},
        {test:'v4.4 mobile mini cart exists', pass:!!byId('v40MiniCart')},
        {test:'v4.4 dev hidden unless enabled', pass:!document.body.classList.contains('dev-enabled') ? getComputedStyle(byId('devToggle')).display === 'none' : true},
        {test:'v4.6 product meta expects 4.6', pass:!!(window.__PRODUCTS_META__ && String(window.__PRODUCTS_META__.schema_version).indexOf('4.6') === 0)}
      ];
      if (console && console.table) console.table(rows);
      return rows.every(function(r){ return !!r.pass; });
    };
    window.runSmokeTests = function(){
      var ok = true;
      try { ok = prev ? prev() : true; } catch(e) { ok = false; window.__v40PreviousSmokeError = String(e && e.message || e); }
      return !!ok && window.runV40UiPolishTests();
    };
  }
  function init(){
    window.__V40_UI_POLISH__ = VERSION;
    initDevMode();
    initCopyText();
    initTopNote();
    initNeedsCompact();
    initTotalsCompact();
    initClearConfirm();
    initMiniCart();
    initTests();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
