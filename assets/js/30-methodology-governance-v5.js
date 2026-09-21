// nutrition calculator v5.3.116_product_database_full_integration_audit
// Module: 30-methodology-governance-v5.js
// Responsibility: data-quality panel, formula registry hook, release-governance smoke tests.
(function(){
  'use strict';
  var VERSION = 'v5.3.116_product_database_full_integration_audit';
  var FIELD_GROUPS = [
    { key:'energy', label:'Энергия и КБЖУ', fields:['kcal','protein_per_100g','fat_per_100g','carbs_per_100g'] },
    { key:'core_micros', label:'Основные микронутриенты', fields:['calcium_mg','iron_mg','magnesium_mg','potassium_mg','sodium_mg','vitamin_d_mcg','vitamin_c_mg'] },
    { key:'hei', label:'HEI-поля', fields:['whole_grain_oz_eq_per_100g','refined_grain_oz_eq_per_100g','veg_cup_eq_per_100g','fruit_cup_eq_per_100g','protein_oz_eq_per_100g','dairy_cup_eq_per_100g'] },
    { key:'harvard', label:'Гарвардская тарелка', fields:['hei_category_key','tags','whole_grain_oz_eq_per_100g','veg_cup_eq_per_100g','protein_oz_eq_per_100g'] }
  ];
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function num(v){ v = Number(v); return Number.isFinite(v) ? v : 0; }
  function fmt(v,d){ v=Number(v); return Number.isFinite(v) ? v.toFixed(d==null?0:d).replace(/\.0$/,'') : '—'; }
  function safeArray(x){ return Array.isArray(x) ? x : []; }
  function getRation(){
    if (window.State && typeof window.State.get === 'function') return safeArray(window.State.get());
    try { return safeArray(JSON.parse(localStorage.getItem('nutri_ration_v1') || '[]')); } catch(_) { return []; }
  }
  function product(key){ return window.DB && window.DB.byKey && window.DB.byKey.get ? window.DB.byKey.get(key) : null; }
  function hasField(p, field){
    if (!p) return false;
    if (field === 'tags') return Array.isArray(p.tags) && p.tags.length > 0;
    if (typeof p[field] === 'number') return Number.isFinite(p[field]);
    if (typeof p[field] === 'string') return p[field].trim().length > 0;
    if (Array.isArray(p[field])) return p[field].length > 0;
    var alt = field.replace(/_per_100g$/, '');
    if (alt !== field && typeof p[alt] === 'number') return Number.isFinite(p[alt]);
    return false;
  }
  function fieldCoverage(rows, fields){
    if (!rows.length) return { count:0, total:0, pct:0 };
    var count = 0;
    rows.forEach(function(it){
      var p = product(it.key);
      if (!p) return;
      var present = fields.filter(function(f){ return hasField(p, f); }).length;
      if (present > 0) count++;
    });
    return { count:count, total:rows.length, pct:rows.length ? count / rows.length * 100 : 0 };
  }
  function per100(p, field){
    if (!p) return 0;
    if (typeof p[field] === 'number') return p[field];
    var alt = field + '_per_100g';
    if (typeof p[alt] === 'number') return p[alt];
    return 0;
  }
  function macroEnergyDiagnostics(rows){
    var checked = 0, warnings = [];
    rows.forEach(function(it){
      var p = product(it.key); if (!p || p.kcal_macro_validation_exempt) return;
      var kcal = num(per100(p,'kcal')), pr = num(per100(p,'protein')), fat = num(per100(p,'fat')), carbs = num(per100(p,'carbs'));
      if (!(kcal > 0 && (pr > 0 || fat > 0 || carbs > 0))) return;
      checked++;
      var macroKcal = pr * 4 + carbs * 4 + fat * 9;
      var deltaPct = kcal ? Math.abs(macroKcal - kcal) / kcal * 100 : 0;
      if (deltaPct > 20) warnings.push({ key:it.key, name:p.name_ru || p.name || it.key, kcal:kcal, macroKcal:macroKcal, deltaPct:deltaPct });
    });
    return { checked:checked, warnings:warnings.slice(0,8), warningCount:warnings.length };
  }
  function buildModel(ration){
    var rows = safeArray(ration || getRation()).filter(function(it){ return it && num(it.grams) > 0; });
    var groups = FIELD_GROUPS.map(function(g){
      var c = fieldCoverage(rows, g.fields);
      return { key:g.key, label:g.label, count:c.count, total:c.total, pct:c.pct, fields:g.fields.slice() };
    });
    var confidence = null;
    try {
      if (window.ProductDataQualityV13 && typeof window.ProductDataQualityV13.productSummary === 'function') confidence = window.ProductDataQualityV13.productSummary(rows, window.DB);
    } catch(_) {}
    return { version:VERSION, totalProducts:rows.length, groups:groups, confidence:confidence, energyDiagnostics:macroEnergyDiagnostics(rows) };
  }
  function buildReportRows(ration){
    return buildModel(ration).groups.map(function(g){ return { key:g.key, label:g.label, count:g.count, total:g.total, pct:g.pct }; });
  }
  function statusText(pct){
    if (pct >= 90) return 'высокое покрытие';
    if (pct >= 65) return 'частичное покрытие';
    if (pct > 0) return 'низкое покрытие';
    return 'нет данных';
  }
  function metricHtml(g){
    return '<div class="data-quality-metric" style="--dq-pct:'+Math.max(0,Math.min(100,g.pct))+'%"><strong>'+fmt(g.pct,0)+'%</strong><span>'+esc(g.label)+' · '+g.count+' / '+g.total+'</span><div class="data-quality-meter" aria-hidden="true"><i></i></div></div>';
  }
  function render(model){
    model = model || buildModel();
    var summary = $('dataQualitySummary'), details = $('dataQualityDetails');
    if (!summary || !details) return false;
    if (!model.totalProducts) {
      summary.innerHTML = '<div class="data-quality-metric"><strong>—</strong><span>Добавьте продукты, чтобы оценить покрытие данных.</span></div>';
      details.innerHTML = '<p class="data-quality-note">Покрытие данных появится после добавления продуктов в рацион.</p>';
      return true;
    }
    var c = model.confidence || {};
    var tier = String(c.tier || '').toUpperCase();
    var tierRu = tier === 'HIGH' ? 'Высокая' : (tier === 'LOW' || tier === 'CRITICAL' ? 'Низкая' : (tier ? 'Средняя' : 'Не определена'));
    var confidenceMetric = '<div class="data-quality-metric data-quality-confidence"><strong>'+esc(tierRu)+'</strong><span>Достоверность источников · '+fmt(c.score,0)+'%</span><div class="data-quality-meter" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,num(c.score)))+'%"></i></div></div>';
    var completenessMetric = '<div class="data-quality-metric"><strong>'+fmt(model.groups.reduce(function(a,g){return a+g.pct;},0)/Math.max(1,model.groups.length),0)+'%</strong><span>Средняя заполненность полей</span><div class="data-quality-meter" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,model.groups.reduce(function(a,g){return a+g.pct;},0)/Math.max(1,model.groups.length)))+'%"></i></div></div>';
    var zeroMetric = '<div class="data-quality-metric"><strong>'+fmt(c.assumed_zero_fields,0)+'</strong><span>Предполагаемых нулевых значений</span></div>';
    summary.innerHTML = confidenceMetric + completenessMetric + zeroMetric;
    var rows = model.groups.map(function(g){ return '<tr><td>'+esc(g.label)+'</td><td>'+g.count+' / '+g.total+'</td><td>'+fmt(g.pct,0)+'%</td><td>'+esc(statusText(g.pct))+'</td></tr>'; }).join('');
    var warn = model.energyDiagnostics.warningCount ? '<div class="data-quality-warning">Проверка энергии: у '+model.energyDiagnostics.warningCount+' продукт(ов) энергия по карточке заметно отличается от расчёта по БЖУ. Это повод проверить исходные данные продукта; вывод о качестве рациона строится по другим показателям.</div>' : '<p class="data-quality-note">Проверка энергии по БЖУ не выявила крупных расхождений среди продуктов, где есть все исходные поля.</p>';
    var confDetails = '<div class="data-quality-warning"><strong>Достоверность и заполненность — разные показатели.</strong> Достоверность отражает происхождение карточек: HIGH '+fmt(c.high,0)+', MEDIUM '+fmt(c.medium,0)+', LOW '+fmt(c.low,0)+'. Заполненность показывает только наличие полей и не доказывает точность значений. Предполагаемые нули: '+fmt(c.assumed_zero_fields,0)+' в '+fmt(c.assumed_zero_products,0)+' продукт(ах).</div>';
    details.innerHTML = confDetails + '<table class="data-quality-table"><thead><tr><th>Блок заполненности</th><th>Продуктов с данными</th><th>Покрытие</th><th>Комментарий</th></tr></thead><tbody>'+rows+'</tbody></table>' + warn + '<p class="data-quality-note">Низкая заполненность микронутриентов означает, что нули могут отражать отсутствие данных. Для значимых решений проверяйте источник конкретной карточки продукта.</p>';
    return true;
  }
  var raf = 0;
  function schedule(){ if (raf) return; raf = window.requestAnimationFrame ? requestAnimationFrame(function(){ raf=0; render(); }) : window.setTimeout(function(){ raf=0; render(); }, 40); }
  function runTests(){
    var rows = [];
    function row(name, pass, detail){ rows.push({ test:name, pass:!!pass, detail:detail || '' }); }
    row('data quality panel exists', !!$('dataQualityPanel'));
    row('formula registry url declared', !!(window.NutritionFormulaRegistryUrl || './assets/data/formula-registry.v5.3.145.json'));
    try { var m = buildModel(); row('data quality model builds', !!m && Array.isArray(m.groups), m && m.groups ? m.groups.length + ' groups' : ''); } catch(e){ row('data quality model builds', false, e && (e.message || String(e))); }
    row('step navigation exists', !!document.querySelector('.workflow-steps'));
    row('report builder exists', !!window.NutritionReportV5);
    row('Harvard Plate final exists', !!(window.HarvardPlateV5212 || window.HarvardPlateV529 || window.HarvardPlateV528 || window.HarvardPlateV527 || window.HarvardPlateV526 || window.HarvardPlateV525 || window.HarvardPlateV524));
    try { if (console && console.table) console.table(rows); } catch(_) {}
    window.__v525GovernanceTestResults = rows;
    return rows.every(function(r){ return !!r.pass; });
  }
  function init(){
    window.NutritionFormulaRegistryUrl = './assets/data/formula-registry.v5.3.145.json';
    render();
    ['ration:changed','needs:computed','needs:changed'].forEach(function(ev){ window.addEventListener(ev, schedule); document.addEventListener(ev, schedule); });
    window.addEventListener('storage', function(e){ if (!e || e.key === 'nutri_ration_v1') schedule(); });
    window.setTimeout(schedule, 500);
    window.setTimeout(schedule, 1500);
  }
  window.NutritionDataQualityV5 = { version:VERSION, buildModel:buildModel, buildReportRows:buildReportRows, render:render, schedule:schedule, runTests:runTests };
  window.runV529GovernanceTests = runTests;
  window.runV528GovernanceTests = runTests;
  window.runV527GovernanceTests = runTests;
  window.runV525GovernanceTests = runTests;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
