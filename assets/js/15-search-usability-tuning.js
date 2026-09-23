// nutrition calculator v4.5_search_usability_tuning
// Module: 15-search-usability-tuning.js
// Responsibility: safer search UX overlay. Mobile = scrollable result panel without a manual "show more" step.
(function(){
  'use strict';
  var VERSION = 'v5.3.171_search_family_coordination';
  var MOBILE_QUERY = '(max-width: 760px)';
  var MOBILE_TARGET_RESULTS = 30;
  var autoExpandLock = false;
  function byId(id){ return document.getElementById(id); }
  function isMobile(){ return window.matchMedia && window.matchMedia(MOBILE_QUERY).matches; }
  function normText(s){ return String(s || '').replace(/\s+/g,' ').trim(); }
  function resultRoot(){ return byId('globalResults'); }
  function cards(){ var root = resultRoot(); return root ? Array.prototype.slice.call(root.querySelectorAll('.search-result-card')) : []; }
  function visibleCards(){ return cards().filter(function(card){ return card.offsetParent !== null || getComputedStyle(card).display !== 'none'; }); }
  function looksLikeShowMore(btn){
    if (!btn) return false;
    var txt = normText(btn.textContent).toLowerCase();
    return /показать\s+ещ[её]|show\s+more|more\s+results/.test(txt) || btn.dataset.role === 'show-more' || btn.classList.contains('show-more');
  }
  function findShowMoreButtons(){
    var root = resultRoot();
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll('button')).filter(looksLikeShowMore);
  }
  function parseFoundCount(){
    var status = byId('globalSearchStatus');
    var txt = status ? normText(status.textContent) : '';
    var m = txt.match(/найден[оаы]?\s*(\d+)/i) || txt.match(/(\d+)\s*(?:продукт|результ)/i);
    return m ? Number(m[1]) : null;
  }
  function createHead(){
    var root = resultRoot();
    if (!root) return null;
    var head = root.querySelector('.v45-search-panel-head');
    if (!head) {
      head = document.createElement('div');
      head.className = 'v45-search-panel-head';
      // role="status" is not an allowed child of the results container, which
      // declares role="list"; keep the live region behaviour and list validity.
      head.setAttribute('role','listitem');
      head.setAttribute('aria-live','polite');
      root.insertBefore(head, root.firstChild);
    }
    return head;
  }
  function updatePanelHead(){
    var root = resultRoot();
    var input = byId('globalSearchInput');
    if (!root || !input) return;
    var query = normText(input.value || '');
    var head = root.querySelector('.v45-search-panel-head');
    if (query.length < 2 || cards().length === 0) {
      if (head) head.remove();
      return;
    }
    head = createHead();
    var shown = cards().length;
    var found = parseFoundCount();
    var totalText = found && found >= shown ? 'Найдено ' + found + ' · показаны лучшие совпадения' : 'Показаны лучшие совпадения';
    var hint = found && found > shown ? 'Уточните запрос, чтобы сузить список.' : 'Выберите продукт, укажите граммы и добавьте в рацион.';
    head.innerHTML = '<strong>' + totalText + '</strong><span class="v45-search-hint">' + hint + '</span>';
  }
  function markShowMoreButtons(){
    findShowMoreButtons().forEach(function(btn){
      btn.classList.add('v45-show-more');
      btn.setAttribute('data-role', btn.dataset.role || 'show-more');
      if (!isMobile()) {
        btn.textContent = 'Показать ещё результаты';
        btn.hidden = false;
        btn.style.display = '';
      }
    });
  }
  function addScrollNote(){
    var root = resultRoot();
    if (!root || !isMobile()) return;
    if (cards().length < 8) return;
    if (!root.querySelector('.v45-scroll-note')) {
      var note = document.createElement('div');
      note.className = 'v45-scroll-note';
      note.textContent = 'Прокручивайте список внутри панели. Для более точного результата уточните запрос.';
      root.appendChild(note);
    }
  }
  function removeScrollNoteIfNeeded(){
    var root = resultRoot();
    if (!root) return;
    if (!isMobile() || cards().length < 8) {
      var note = root.querySelector('.v45-scroll-note');
      if (note) note.remove();
    }
  }
  function autoExpandMobileResults(){
    var familyRoot = resultRoot();
    if (familyRoot && familyRoot.dataset.preparationFamilyGrouped === 'true') return;
    if (!isMobile() || autoExpandLock) return;
    var buttons = findShowMoreButtons();
    if (!buttons.length) return;
    var count = cards().length;
    if (count >= MOBILE_TARGET_RESULTS) return;
    autoExpandLock = true;
    var guard = 0;
    function step(){
      var btn = findShowMoreButtons()[0];
      if (!btn || cards().length >= MOBILE_TARGET_RESULTS || guard++ > 5) {
        autoExpandLock = false;
        postProcessSearch();
        return;
      }
      btn.click();
      window.setTimeout(step, 70);
    }
    window.setTimeout(step, 0);
  }
  function enhanceCards(){
    cards().forEach(function(card){
      card.setAttribute('role','listitem');
      if (!card.dataset.v45Enhanced) {
        card.dataset.v45Enhanced = '1';
      }
      var add = card.querySelector('[data-role="add-search"], button');
      var title = card.querySelector('.search-result-title');
      var name = title ? normText(title.textContent) : 'продукт';
      var grams = card.querySelector('[data-role="grams"], input[type="number"]');
      if (add && !looksLikeShowMore(add)) add.setAttribute('aria-label', 'Добавить в рацион: ' + name);
      if (grams) {
        grams.setAttribute('aria-label', 'Граммы для продукта: ' + name);
        grams.setAttribute('inputmode','decimal');
      }
    });
  }
  function localAddedFeedback(btn){
    if (!btn || looksLikeShowMore(btn)) return;
    var old = btn.dataset.v45OldText || btn.textContent;
    btn.dataset.v45OldText = old;
    var card = btn.closest('.search-result-card');
    btn.classList.add('v45-added');
    btn.textContent = 'Добавлено';
    if (card) card.classList.add('v45-just-added','v45-card-added');
    window.setTimeout(function(){
      btn.classList.remove('v45-added');
      btn.textContent = old;
      if (card) card.classList.remove('v45-just-added');
    }, 1800);
  }
  function postProcessSearch(){
    var root = resultRoot();
    if (!root) return;
    root.setAttribute('role','list');
    root.setAttribute('aria-label','Результаты поиска продуктов');
    markShowMoreButtons();
    enhanceCards();
    updatePanelHead();
    addScrollNote();
    removeScrollNoteIfNeeded();
    autoExpandMobileResults();
  }
  function installObservers(){
    var root = resultRoot();
    if (root && !root.dataset.v45Observed) {
      root.dataset.v45Observed = '1';
      new MutationObserver(function(){ window.setTimeout(postProcessSearch, 0); }).observe(root, {childList:true, subtree:true, characterData:true});
    }
    var input = byId('globalSearchInput');
    if (input && !input.dataset.v45Observed) {
      input.dataset.v45Observed = '1';
      ['input','change','keyup'].forEach(function(evt){ input.addEventListener(evt, function(){ window.setTimeout(postProcessSearch, 30); }); });
    }
    document.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('[data-role="add-search"], .search-result-card button');
      if (btn && !looksLikeShowMore(btn)) localAddedFeedback(btn);
    }, true);
    if (window.matchMedia) {
      var mq = window.matchMedia(MOBILE_QUERY);
      if (mq.addEventListener) mq.addEventListener('change', function(){ window.setTimeout(postProcessSearch, 80); });
      else if (mq.addListener) mq.addListener(function(){ window.setTimeout(postProcessSearch, 80); });
    }
  }
  function installTests(){
    window.runV45SearchUsabilityTests = function(){
      var root = resultRoot();
      var queryInput = byId('globalSearchInput');
      var rows = [
        {test:'v4.5 search CSS linked', pass:!!document.querySelector('link[href$="search-usability-tuning.css"],link[data-css-bundle="5.3.117"]')},
        {test:'v4.5 search JS loaded', pass:window.__V45_SEARCH_USABILITY__ === VERSION},
        {test:'global search input exists', pass:!!queryInput},
        {test:'global results container exists', pass:!!root},
        {test:'result container has list role after processing', pass:!!(root && root.getAttribute('role') === 'list')},
        {test:'desktop show-more text normalized or absent', pass:findShowMoreButtons().every(function(btn){ return isMobile() || normText(btn.textContent) === 'Показать ещё результаты'; })}
      ];
      if (console && console.table) console.table(rows);
      return rows.every(function(r){ return !!r.pass; });
    };
    var prev = window.runSmokeTests;
    window.runSmokeTests = function(){
      var ok = true;
      try { ok = prev ? prev() : true; } catch(e) { ok = false; window.__v45PreviousSmokeError = String(e && e.message || e); }
      return !!ok && window.runV45SearchUsabilityTests();
    };
  }
  function init(){
    window.__V45_SEARCH_USABILITY__ = VERSION;
    installObservers();
    installTests();
    postProcessSearch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
