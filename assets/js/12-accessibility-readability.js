// nutrition calculator v4.5_search_usability_tuning
// Responsibility: accessibility/readability affordances without changing product data or nutrition calculations.
(function(){
  'use strict';
  var VERSION = 'v4.5_search_usability_tuning';
  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>'"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function ensureLiveRegion(){
    var el = byId('a11yLiveRegion');
    if (!el) {
      el = document.createElement('div');
      el.id = 'a11yLiveRegion';
      el.className = 'a11y-live-region';
      el.setAttribute('aria-live','polite');
      el.setAttribute('aria-atomic','true');
      document.body.appendChild(el);
    }
    return el;
  }
  function announce(text){
    var el = ensureLiveRegion();
    el.textContent = '';
    window.setTimeout(function(){ el.textContent = text; }, 40);
  }
  function setAttr(el, name, value){ if (el && !el.hasAttribute(name)) el.setAttribute(name, value); }
  function initStaticA11y(){
    var container = document.querySelector('.container');
    if (container) {
      if (!container.id) container.id = 'mainContent';
      setAttr(container, 'role', 'main');
    }
    setAttr(byId('globalSearchStatus'), 'aria-live', 'polite');
    setAttr(byId('globalSearchStatus'), 'aria-atomic', 'true');
    var hint = document.querySelector('.search-field-hint');
    if (hint && !hint.id) hint.id = 'globalSearchHint';
    var search = byId('globalSearchInput');
    if (search) {
      setAttr(search, 'aria-describedby', 'globalSearchHint globalSearchStatus');
      setAttr(search, 'aria-label', 'Поиск продукта по базе');
      search.setAttribute('autocomplete','off');
      search.setAttribute('enterkeyhint','search');
    }
    var results = byId('globalResults');
    if (results) {
      setAttr(results, 'role', 'list');
      setAttr(results, 'aria-label', 'Результаты поиска продуктов');
      setAttr(results, 'aria-live', 'polite');
    }
    var clear = byId('globalSearchClear');
    if (clear) setAttr(clear, 'aria-label', 'Очистить строку поиска');
    var grams = byId('globalSearchGrams');
    if (grams) {
      setAttr(grams, 'aria-label', 'Граммы по умолчанию для добавления продукта');
      grams.setAttribute('inputmode','decimal');
    }
    document.querySelectorAll('input[type="number"]').forEach(function(input){ input.setAttribute('inputmode','decimal'); });
    var ration = byId('rationSection');
    if (ration) setAttr(ration, 'aria-label', 'Итоговый рацион');
    var totals = byId('totalsSection');
    if (totals) setAttr(totals, 'aria-label', 'Итоги и дневные нормы');
    var hei = byId('heiPanel');
    if (hei) setAttr(hei, 'aria-label', 'Индекс качества рациона HEI-2020');
    var mobileAnchor = byId('mobileSearchResultsAnchor');
    if (mobileAnchor) {
      setAttr(mobileAnchor, 'aria-live', 'polite');
      setAttr(mobileAnchor, 'aria-label', 'Мобильные результаты поиска');
    }
    var needsToggle = byId('v40NeedsToggle');
    if (needsToggle) {
      needsToggle.setAttribute('aria-controls','needs');
      needsToggle.setAttribute('aria-expanded', String(!byId('needsCompact')?.classList.contains('v40-needs-collapsed')));
      needsToggle.addEventListener('click', function(){
        window.setTimeout(function(){
          needsToggle.setAttribute('aria-expanded', String(!byId('needsCompact')?.classList.contains('v40-needs-collapsed')));
        }, 0);
      });
    }
    var namedControls = {
      normProfile:'Профиль норм',
      mealsAutoToggle:'Обновлять черновик распределения по приёмам пищи при изменении рациона',
      heiEnergyActual:'Нормировать HEI на калории рациона',
      heiEnergyTarget:'Нормировать HEI на целевые калории',
      heiManualRadio:'Нормировать HEI на ручной целевой калораж',
      heiManualKcal:'Ручной целевой калораж для HEI',
      presetJsonFile:'Файл JSON с сохранённым рационом'
    };
    Object.keys(namedControls).forEach(function(id){ var el = byId(id); if (el) el.setAttribute('aria-label', namedControls[id]); });
    var totalsPdf = byId('exportTotalsPdfBtn');
    if (totalsPdf && totalsPdf.textContent.trim() === 'PDF') totalsPdf.textContent = 'Сохранить PDF';
    var needsPdf = byId('needs_pdf_btn');
    if (needsPdf && needsPdf.textContent.trim() === 'PDF') needsPdf.textContent = 'Сохранить PDF';
  }
  function enhanceSearchCards(){
    var out = byId('globalResults');
    if (!out) return;
    out.setAttribute('role','list');
    var cards = out.querySelectorAll('.search-result-card');
    cards.forEach(function(card, idx){
      card.setAttribute('role','listitem');
      var title = card.querySelector('.search-result-title');
      var name = title ? title.textContent.trim() : 'продукт ' + (idx+1);
      var input = card.querySelector('[data-role="grams"]');
      if (input) {
        input.setAttribute('aria-label','Граммы для продукта: ' + name);
        input.setAttribute('inputmode','decimal');
      }
      var btn = card.querySelector('[data-role="add-search"]');
      if (btn) btn.setAttribute('aria-label','Добавить в рацион: ' + name);
    });
  }
  function initDynamicObservers(){
    var out = byId('globalResults');
    if (out && !out.dataset.a11yObserved) {
      out.dataset.a11yObserved = '1';
      var mo = new MutationObserver(enhanceSearchCards);
      mo.observe(out, { childList:true, subtree:true });
      enhanceSearchCards();
    }
    document.addEventListener('click', function(e){
      var add = e.target && e.target.closest && e.target.closest('[data-role="add-search"]');
      if (add) {
        var card = add.closest('.search-result-card');
        var title = card && card.querySelector('.search-result-title');
        var grams = card && card.querySelector('[data-role="grams"]');
        var text = title ? title.textContent.trim() : 'продукт';
        var g = grams ? grams.value : '';
        announce('Добавлено в рацион: ' + text + (g ? ', ' + g + ' граммов' : ''));
      }
    }, true);
  }
  function auditA11y(){
    var rows = [];
    function add(name, pass, detail, severity){ rows.push({name:name, pass:!!pass, detail:detail||'', severity:severity || (pass ? 'pass' : 'fail')}); }
    var dup = [];
    var map = Object.create(null);
    document.querySelectorAll('[id]').forEach(function(el){ map[el.id] = (map[el.id] || 0) + 1; });
    Object.keys(map).forEach(function(id){ if (map[id] > 1) dup.push(id + '×' + map[id]); });
    add('Уникальные id в DOM', dup.length === 0, dup.length ? dup.join(', ') : 'дублей нет');
    add('Skip-link доступен', !!document.querySelector('.skip-link'), document.querySelector('.skip-link') ? 'есть ссылка перехода к поиску' : 'нет skip-link');
    add('Основной контейнер main/role=main', !!document.querySelector('[role="main"], main'), document.querySelector('[role="main"], main') ? 'есть основной landmark' : 'нет landmark');
    add('Строка поиска имеет label/aria', !!(byId('globalSearchInput') && (byId('globalSearchInput').labels?.length || byId('globalSearchInput').getAttribute('aria-label'))), 'globalSearchInput');
    var controls = Array.prototype.slice.call(document.querySelectorAll('button,input,select,textarea,a[href]')).filter(function(el){ return el.offsetParent !== null; });
    var small = controls.filter(function(el){ var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32); });
    add('Минимальный размер видимых интерактивных элементов', small.length === 0, small.length ? small.slice(0,6).map(function(el){return el.id || el.textContent.trim().slice(0,20) || el.tagName;}).join(', ') : 'критически малых элементов не найдено', small.length ? 'warn' : 'pass');
    add('Live-region для сообщений', !!byId('a11yLiveRegion'), byId('a11yLiveRegion') ? 'есть aria-live' : 'нет');
    add('Результаты поиска размечены как список', !!(byId('globalResults') && byId('globalResults').getAttribute('role') === 'list'), 'globalResults');
    add('Горизонтальная прокрутка страницы', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2, document.documentElement.scrollWidth + ' / ' + document.documentElement.clientWidth, document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2 ? 'pass' : 'warn');
    add('Версия слоя доступности', true, VERSION);
    return rows;
  }
  function renderA11yAudit(){
    var old = byId('a11yAuditPanel');
    if (old) old.remove();
    var rows = auditA11y();
    var pass = rows.filter(function(r){return r.severity !== 'warn' && r.pass;}).length;
    var warn = rows.filter(function(r){return r.severity === 'warn';}).length;
    var fail = rows.filter(function(r){return r.severity !== 'warn' && !r.pass;}).length;
    var panel = document.createElement('aside');
    panel.id = 'a11yAuditPanel';
    panel.className = 'a11y-audit-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','Проверка доступности и читаемости');
    panel.innerHTML = '<header><h2>Доступность и читаемость v4.5</h2><button type="button" class="secondary" data-close>Закрыть</button></header>'+
      '<div class="a11y-audit-body"><div><strong>Итог:</strong> пройдено '+pass+', предупреждений '+warn+', ошибок '+fail+'.</div>'+
      rows.map(function(r){ var cls = r.severity === 'warn' ? 'warn' : (r.pass ? 'pass' : 'fail'); var mark = r.severity === 'warn' ? '!' : (r.pass ? '✓' : '×'); return '<div class="a11y-audit-row '+cls+'"><strong>'+esc(mark+' '+r.name)+'</strong><span>'+esc(r.detail)+'</span></div>'; }).join('')+
      '<div class="a11y-audit-actions"><button type="button" data-rerun>Повторить</button><button type="button" data-copy>Скопировать отчёт</button></div></div>';
    document.body.appendChild(panel);
    panel.querySelector('[data-close]').addEventListener('click', function(){ panel.remove(); });
    panel.querySelector('[data-rerun]').addEventListener('click', renderA11yAudit);
    panel.querySelector('[data-copy]').addEventListener('click', function(){
      var text = 'A11y audit '+VERSION+'\n' + rows.map(function(r){ return '['+(r.severity === 'warn' ? 'WARN' : (r.pass ? 'PASS' : 'FAIL'))+'] '+r.name+' — '+r.detail; }).join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
    });
    return rows;
  }
  window.runAccessibilityReadabilityAudit = auditA11y;
  window.renderAccessibilityReadabilityAudit = renderA11yAudit;
  document.addEventListener('DOMContentLoaded', function(){
    ensureLiveRegion();
    initStaticA11y();
    initDynamicObservers();
    try {
      var params = new URLSearchParams(location.search);
      if (params.has('a11y')) window.setTimeout(renderA11yAudit, 250);
    } catch(_) {}
  });
})();
