// nutrition calculator v4.5.3_catalog_group_labels_fix
// Responsibility: final robust repair of catalog group titles; prevents repeated «Прочее» headings.
(function(){
  'use strict';
  var VERSION = 'v4.5.3_catalog_group_labels_fix';
  var RAW_CATALOG_LABELS = {
    'Vegetables':'Овощи',
    'Fruits':'Фрукты и ягоды',
    'Dairy':'Молочные продукты',
    'Meat':'Мясо, птица и яйца',
    'Seafood':'Рыба и морепродукты',
    'Seafood & Plant Protein':'Рыба, морепродукты и растительные белки',
    'Whole Grains':'Цельные злаки и крупы',
    'Refined Grains':'Рафинированные злаки и выпечка',
    'Legumes, Nuts & Seeds':'Бобовые, орехи и семена',
    'Oils & Fats':'Масла и жиры',
    'Drinks':'Напитки',
    'Sweets':'Сладости и десерты',
    'Other':'Другое',
    'Ready food / Culinary':'Готовые блюда и кулинария',
    'Frozen / Semi-finished':'Заморозка и полуфабрикаты',
    'Bakery / Grains / Breakfast':'Хлеб, выпечка и завтраки',
    'Sports Protein':'Спортивное питание',
    'Protein Drink':'Белковые напитки',
    'vegetables':'Овощи',
    'greens_leafy':'Зелень',
    'starchy_vegetables':'Крахмалистые овощи',
    'mushrooms':'Грибы',
    'allium_aromatic':'Лук и пряные овощи',
    'legume_vegetables':'Бобовые и стручковые',
    'root_vegetables':'Корнеплоды',
    'cruciferous_vegetables':'Капустные овощи',
    'fruits_berries':'Фрукты и ягоды',
    'dairy':'Молочные продукты',
    'meat_eggs':'Мясо, птица и яйца',
    'seafood_plant':'Рыба, морепродукты и растительные белки',
    'grains_bakery':'Крупы, хлеб и выпечка',
    'bakery_breakfast':'Хлеб, выпечка и завтраки',
    'nuts_seeds':'Бобовые, орехи и семена',
    'oils_fats':'Масла и жиры','saturated_fats':'Источники насыщенных жиров',
    'spices_sauces':'Соусы и приправы',
    'snacks_salty':'Солёные снеки',
    'drinks':'Напитки',
    'sweets':'Сладости и десерты',
    'ready_food':'Готовые блюда и кулинария',
    'ready_fastfood':'Готовые блюда',
    'semi_finished':'Заморозка и полуфабрикаты',
    'sports_protein':'Спортивное питание',
    'protein_drinks':'Белковые напитки',
    'other':'Другое',
    'fruits':'Фрукты',
    'whole_grains':'Цельные злаки',
    'refined_grains':'Рафинированные злаки',
    'seafood_plant_protein':'Морепродукты и растительные белки',
    'protein_foods':'Мясо, птица и яйца'
  };
  function byId(id){ return document.getElementById(id); }
  function getMode(){
    var active = document.querySelector('#groupingSeg button.active');
    return active && active.dataset && active.dataset.mode === 'hei' ? 'hei' : 'catalog';
  }
  function labelKey(key, mode){
    var k = String(key || 'other');
    if (mode !== 'hei' && RAW_CATALOG_LABELS[k]) return RAW_CATALOG_LABELS[k];
    if (mode === 'hei' && RAW_CATALOG_LABELS[k]) return RAW_CATALOG_LABELS[k];
    if (window.UI_RU_LABELS) {
      var fn = mode === 'hei' ? window.UI_RU_LABELS.labelHEI : window.UI_RU_LABELS.labelCatalog;
      if (typeof fn === 'function') {
        var label = fn(k);
        if (label && !/^Прочее$|^Другое$/.test(label)) return label;
      }
    }
    return mode === 'hei' ? 'Другое' : 'Другое';
  }
  function keysInCurrentDomOrder(mode, count){
    var db = window.DB;
    if (!db) return [];
    var map = mode === 'hei' ? db.byCatHEI : db.byCatCatalog;
    if (!map || typeof map.keys !== 'function') return [];
    var keys = Array.from(map.keys());
    // If app-core wrote data-group-key, prefer it; otherwise use Map insertion order because legacy broken sorting preserves this order.
    var heads = Array.prototype.slice.call(document.querySelectorAll('#categories .accordion-head'));
    var fromData = heads.map(function(h){ return h.dataset && h.dataset.groupKey; }).filter(Boolean);
    if (fromData.length === heads.length && fromData.length) return fromData;
    return keys.slice(0, count || keys.length);
  }
  var repairing = false;
  function repairCatalogLabels(){
    if (repairing) return false;
    var categories = byId('categories');
    if (!categories || !window.DB) return false;
    var heads = Array.prototype.slice.call(categories.querySelectorAll('.accordion-head'));
    if (!heads.length) return false;
    var mode = getMode();
    var keys = keysInCurrentDomOrder(mode, heads.length);
    if (!keys.length) return false;
    repairing = true;
    heads.forEach(function(head, idx){
      var key = keys[idx] || (head.dataset && head.dataset.groupKey) || 'other';
      var groupMap = mode === 'hei' ? window.DB.byCatHEI : window.DB.byCatCatalog;
      var n = 0;
      try { n = groupMap && groupMap.get && groupMap.get(key) ? groupMap.get(key).length : Number((head.querySelector('.cat-count') || {}).textContent || 0); } catch(_) {}
      head.dataset.groupKey = key;
      head.dataset.groupMode = mode;
      head.innerHTML = labelKey(key, mode) + ' <span class="cat-count">' + n + '</span>';
    });
    repairing = false;
    return true;
  }
  function scheduleRepair(){
    window.requestAnimationFrame ? window.requestAnimationFrame(repairCatalogLabels) : window.setTimeout(repairCatalogLabels, 0);
  }
  function installObserver(){
    var categories = byId('categories');
    if (!categories || categories.dataset.v453Observed === '1') return;
    categories.dataset.v453Observed = '1';
    var mo = new MutationObserver(function(){ scheduleRepair(); });
    mo.observe(categories, {childList:true, subtree:false});
  }
  function runTests(){
    repairCatalogLabels();
    var heads = Array.prototype.slice.call(document.querySelectorAll('#categories .accordion-head')).map(function(h){ return h.textContent.trim(); });
    var generic = heads.filter(function(t){ return /^(Прочее|Другое)\s+\d+$/.test(t); });
    var repeatedGeneric = generic.length > 1;
    var distinctLabels = new Set(heads.map(function(t){ return t.replace(/\s+\d+$/, ''); })).size;
    var rows = [
      {test:'v4.5.3 JS loaded', pass:window.__V453_CATALOG_GROUP_LABELS_FIX__ === VERSION},
      {test:'catalog has multiple distinct human-readable labels', pass:distinctLabels >= Math.min(5, heads.length), detail:String(distinctLabels)},
      {test:'catalog does not show repeated generic labels', pass:!repeatedGeneric, detail:generic.join(', ')},
      {test:'catalog labels include expected groups', pass:heads.some(function(h){return /^Молочные продукты\b/.test(h);}) && heads.some(function(h){return /^Овощи\b/.test(h);})}
    ];
    if (console && console.table) console.table(rows);
    return rows.every(function(r){ return !!r.pass; });
  }
  function init(){
    window.__V453_CATALOG_GROUP_LABELS_FIX__ = VERSION;
    scheduleRepair();
    window.setTimeout(scheduleRepair, 120);
    window.setTimeout(scheduleRepair, 500);
    installObserver();
    var seg = byId('groupingSeg');
    if (seg) seg.addEventListener('click', function(){ window.setTimeout(scheduleRepair, 0); window.setTimeout(scheduleRepair, 80); }, true);
    var additional = byId('additionalToolsSection');
    if (additional) additional.addEventListener('toggle', function(){ window.setTimeout(scheduleRepair, 0); }, true);
    var select = byId('selectSection');
    if (select) select.addEventListener('toggle', function(){ window.setTimeout(scheduleRepair, 0); }, true);
    window.runV453CatalogGroupLabelsTests = runTests;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
