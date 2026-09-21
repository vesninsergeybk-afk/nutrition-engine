// nutrition calculator v4.6.4_category_taxonomy_audit_fix
// Runtime audit tests for product taxonomy labels and HEI-equivalent corrections.
(function(){
  'use strict';
  var VERSION = 'v4.6.4_category_taxonomy_audit_fix';
  function n(v){ return Number(v || 0); }
  function ok(name, pass, got, expected){ return { test:name, pass:!!pass, got:got, expected:expected }; }
  function tagsOf(p){
    if (!p) return '';
    if (Array.isArray(p.tags)) return p.tags.join(' ').toLowerCase();
    return String(p.tags || '').toLowerCase();
  }
  function byKey(k){ return window.DB && window.DB.byKey && window.DB.byKey.get(k); }
  function run(){
    var tests = [];
    var greenOnion = byKey('green_onion_raw');
    var basil = byKey('basil_raw');
    tests.push(ok('v4.6.4 loaded', window.__V464_CATEGORY_TAXONOMY_TESTS__ === VERSION, window.__V464_CATEGORY_TAXONOMY_TESTS__, VERSION));
    tests.push(ok('labelHEI не отдаёт сырой ключ vegetables', typeof window.labelHEI === 'function' && window.labelHEI('vegetables') === 'Овощи', window.labelHEI && window.labelHEI('vegetables'), 'Овощи'));
    tests.push(ok('labelCatalog знает группу Зелень', typeof window.labelCatalog === 'function' && window.labelCatalog('greens_leafy') === 'Зелень', window.labelCatalog && window.labelCatalog('greens_leafy'), 'Зелень'));
    tests.push(ok('Лук зелёный отображается как Зелень', greenOnion && greenOnion.catalog_category_key === 'greens_leafy', greenOnion && greenOnion.catalog_category_key, 'greens_leafy'));
    tests.push(ok('Базилик отображается как Зелень', basil && basil.catalog_category_key === 'greens_leafy', basil && basil.catalog_category_key, 'greens_leafy'));
    ['pear','pear_1','asian_pear','peach'].forEach(function(k){
      var p = byKey(k);
      tests.push(ok(k + ': фрукт не даёт овощной/белковый вклад', p && n(p.veg_cup_eq_per_100g)===0 && n(p.greens_beans_cup_eq_per_100g)===0 && n(p.protein_oz_eq_per_100g)===0 && n(p.seafood_plant_oz_eq_per_100g)===0, p && [p.veg_cup_eq_per_100g,p.greens_beans_cup_eq_per_100g,p.protein_oz_eq_per_100g,p.seafood_plant_oz_eq_per_100g].join('/'), '0/0/0/0'));
    });
    ['pearl_barley_cooked','farro'].forEach(function(k){
      var p = byKey(k);
      tests.push(ok(k + ': злак не даёт овощной/белковый вклад', p && n(p.veg_cup_eq_per_100g)===0 && n(p.greens_beans_cup_eq_per_100g)===0 && n(p.protein_oz_eq_per_100g)===0 && n(p.seafood_plant_oz_eq_per_100g)===0, p && [p.veg_cup_eq_per_100g,p.greens_beans_cup_eq_per_100g,p.protein_oz_eq_per_100g,p.seafood_plant_oz_eq_per_100g].join('/'), '0/0/0/0'));
    });
    ['eggplant_raw','eggplant_baked'].forEach(function(k){
      var p = byKey(k);
      tests.push(ok(k + ': баклажан не даёт белковый HEI-вклад', p && n(p.protein_oz_eq_per_100g)===0, p && p.protein_oz_eq_per_100g, 0));
    });
    var items = (window.DB && window.DB.items) || [];
    var badFruit = items.filter(function(p){ return p.hei_category_key === 'fruits_berries' && (n(p.veg_cup_eq_per_100g)>0 || n(p.greens_beans_cup_eq_per_100g)>0 || n(p.protein_oz_eq_per_100g)>0 || n(p.seafood_plant_oz_eq_per_100g)>0); }).map(function(p){ return p.key; });
    tests.push(ok('Чистые фрукты не попадают в овощи/белок', badFruit.length === 0, badFruit, []));
    var badVegProtein = items.filter(function(p){
      if (!(p.category === 'Vegetables' && p.hei_category_key === 'vegetables')) return false;
      if (n(p.protein_oz_eq_per_100g) <= 0) return false;
      var t = tagsOf(p);
      return !/(legume|beans|peas|edamame|soy)/.test(t);
    }).map(function(p){ return p.key; });
    tests.push(ok('Овощи без бобовой роли не дают белковый HEI-вклад', badVegProtein.length === 0, badVegProtein, []));
    return tests;
  }
  window.__V464_CATEGORY_TAXONOMY_TESTS__ = VERSION;
  window.runV464CategoryTaxonomyTests = run;
})();
