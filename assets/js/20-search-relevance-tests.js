// nutrition calculator v4.6.1_search_relevance_fix
// Module: 20-search-relevance-tests.js
// Responsibility: verify that product search matches product identity, not HEI/category labels.
(function(){
  'use strict';
  var VERSION = 'v4.6.1_search_relevance_fix';
  function norm(v){
    if (typeof window.normalizeSearchText === 'function') return window.normalizeSearchText(v);
    return String(v == null ? '' : v).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  }
  function searchText(p){
    if (typeof window.__productSearchText === 'function') return window.__productSearchText(p);
    return norm([p && p.name_ru, p && p.name, p && p.key, Array.isArray(p && p.search_aliases) ? p.search_aliases.join(' ') : '', Array.isArray(p && p.tags) ? p.tags.join(' ') : ''].filter(Boolean).join(' '));
  }
  function hits(query){
    var db = window.DB && window.DB.items ? window.DB.items : [];
    var terms = norm(query).split(' ').filter(Boolean);
    return db.filter(function(p){ var t = searchText(p); return terms.every(function(x){ return t.indexOf(x) !== -1; }); });
  }
  window.runV461SearchRelevanceTests = function(){
    var egg = hits('яйцо');
    var chicken = hits('курица');
    var yogurt = hits('йогурт');
    var rows = [
      { test:'v4.6.1 search relevance JS loaded', pass:window.__V461_SEARCH_RELEVANCE__ === VERSION },
      { test:'query яйцо is narrow', pass:egg.length > 0 && egg.length < 10, detail:egg.map(function(p){return p.name_ru || p.name || p.key;}).slice(0,8).join(' | ') },
      { test:'query яйцо does not return all meat/protein foods', pass:egg.length < 10, detail:String(egg.length) },
      { test:'query курица still works', pass:chicken.length > 0, detail:String(chicken.length) },
      { test:'query йогурт still works', pass:yogurt.length > 0, detail:String(yogurt.length) }
    ];
    if (console && console.table) console.table(rows);
    window.__V461_SEARCH_RELEVANCE_TESTS__ = rows;
    return rows.every(function(r){ return !!r.pass; });
  };
  window.__V461_SEARCH_RELEVANCE__ = VERSION;
})();
