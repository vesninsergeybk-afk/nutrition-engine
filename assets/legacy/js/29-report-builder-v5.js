// nutrition calculator v5.2.23_mobile_first_pass
// Module: 29-report-builder-v5.js
// Responsibility: cached report model + fast print/PDF shell + full macro/micronutrient report.
(function(){
  'use strict';

  var VERSION = 'v5.3.210-p1.4-report';
  var REPORT_TITLE = 'Сводный отчёт по рациону';
  var SECTORS = ['vegetables','fruits','wholeGrains','protein'];
  var SECTOR_RU = { vegetables:'Овощи', fruits:'Фрукты', wholeGrains:'Цельные злаки', protein:'Белковые продукты' };
  var TARGETS = { vegetables:35, fruits:15, wholeGrains:25, protein:25 };
  var COLORS = { vegetables:'#16a34a', fruits:'#dc2626', wholeGrains:'#d97706', protein:'#0284c7' };

  var cachedModel = null;
  var cachedHtml = '';
  var cachedHash = '';
  var cacheDirty = true;
  var cacheTimer = null;
  var personalPanelTimer = null;
  var lastBuildMs = 0;
  var lastHtmlBuildMs = 0;
  var lastScheduledReason = '';
  function calculationCore(){ return window.NutritionCalculationCoreV53155 || window.NutritionCalculationCore || null; }
  function metricSpec(key){
    var c = calculationCore();
    if (c && typeof c.getMetricSpec === 'function') return c.getMetricSpec(key);
    var limiter = /sodium|salt|sfa|added_sugars/.test(String(key || ''));
    var informational = key === 'sugars_g' || key === 'unsat_g';
    return { key:key, mode:informational ? 'informational' : (limiter ? 'upper_limit' : 'adequacy'), title:key, unit:'', target:0, referenceValue:0 };
  }

  var MACRO_SPECS = [
    { key:'kcal', title:'Энергия', unit:'ккал', digits:0, fields:['kcal'] },
    { key:'protein_g', title:'Белки', unit:'г', digits:1, fields:['protein_per_100g','protein'] },
    { key:'fat_g', title:'Жиры', unit:'г', digits:1, fields:['fat_per_100g','fat'] },
    { key:'carbs_g', title:'Углеводы', unit:'г', digits:1, fields:['carbs_per_100g','carbs'] },
    { key:'fiber_g', title:'Клетчатка', unit:'г', digits:1, fields:['fiber_per_100g','fiber'] },
    { key:'sugars_g', title:'Сахара', unit:'г', digits:1, fields:['sugar_per_100g','sugar'] },
    { key:'added_sugars_g', title:'Добавленные сахара', unit:'г', digits:1, fields:['added_sugar','added_sugars_g'] },
    { key:'sfa_g', title:'Насыщенные жиры', unit:'г', digits:1, fields:['sfa'] },
    { key:'unsat_g', title:'Ненасыщенные жиры', unit:'г', digits:1, fields:['unsat'] },
    { key:'salt_g', title:'Соль', unit:'г', digits:1, fields:['salt'] },
    { key:'sodium_mg', title:'Натрий', unit:'мг', digits:0, fields:['sodium_mg'], fallbackSalt:true }
  ];
  var VITAMIN_SPECS = [
    { key:'vitamin_a_mcg', title:'Витамин A', unit:'мкг РЭ', digits:0, fields:['vitamin_a_mcg'] },
    { key:'vitamin_c_mg', title:'Витамин C', unit:'мг', digits:0, fields:['vitamin_c_mg'] },
    { key:'vitamin_d_mcg', title:'Витамин D', unit:'мкг', digits:1, fields:['vitamin_d_mcg'] },
    { key:'vitamin_e_mg', title:'Витамин E', unit:'мг', digits:1, fields:['vitamin_e_mg'] },
    { key:'vitamin_k_mcg', title:'Витамин K', unit:'мкг', digits:0, fields:['vitamin_k_mcg'] },
    { key:'vitamin_b1_mg', title:'Витамин B1', unit:'мг', digits:2, fields:['vitamin_b1_mg'] },
    { key:'vitamin_b2_mg', title:'Витамин B2', unit:'мг', digits:2, fields:['vitamin_b2_mg'] },
    { key:'vitamin_b3_mg', title:'Витамин B3', unit:'мг', digits:1, fields:['vitamin_b3_mg'] },
    { key:'vitamin_b5_mg', title:'Витамин B5', unit:'мг', digits:1, fields:['vitamin_b5_mg'] },
    { key:'vitamin_b6_mg', title:'Витамин B6', unit:'мг', digits:2, fields:['vitamin_b6_mg'] },
    { key:'vitamin_b9_mcg', title:'Фолат (B9)', unit:'мкг', digits:0, fields:['vitamin_b9_mcg'] },
    { key:'vitamin_b12_mcg', title:'Витамин B12', unit:'мкг', digits:1, fields:['vitamin_b12_mcg'] },
    { key:'choline_mg', title:'Холин', unit:'мг', digits:0, fields:['choline_mg'] }
  ];
  var MINERAL_SPECS = [
    { key:'calcium_mg', title:'Кальций', unit:'мг', digits:0, fields:['calcium_mg'] },
    { key:'iron_mg', title:'Железо', unit:'мг', digits:1, fields:['iron_mg'] },
    { key:'magnesium_mg', title:'Магний', unit:'мг', digits:0, fields:['magnesium_mg'] },
    { key:'zinc_mg', title:'Цинк', unit:'мг', digits:1, fields:['zinc_mg'] },
    { key:'potassium_mg', title:'Калий', unit:'мг', digits:0, fields:['potassium_mg'] },
    { key:'phosphorus_mg', title:'Фосфор', unit:'мг', digits:0, fields:['phosphorus_mg'] },
    { key:'iodine_mcg', title:'Йод', unit:'мкг', digits:0, fields:['iodine_mcg','iodine_ug'] },
    { key:'selenium_mcg', title:'Селен', unit:'мкг', digits:0, fields:['selenium_mcg','selenium_ug'] },
    { key:'copper_mg', title:'Медь', unit:'мг', digits:2, fields:['copper_mg'] },
    { key:'manganese_mg', title:'Марганец', unit:'мг', digits:1, fields:['manganese_mg'] }
  ];
  var ALL_SPECS = MACRO_SPECS.concat(VITAMIN_SPECS, MINERAL_SPECS);

  function $(id){ return document.getElementById(id); }
  function now(){ return (window.performance && window.performance.now) ? window.performance.now() : Date.now(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function txt(node){ return node ? String(node.textContent || '').trim() : ''; }
  function safeArray(x){ return Array.isArray(x) ? x : []; }
  function lower(s){ return String(s == null ? '' : s).toLowerCase(); }
  function num(v){ v = Number(String(v == null ? '' : v).replace(',', '.').replace(/[^0-9.\-]/g, '')); return Number.isFinite(v) ? v : 0; }
  function fmt(v, digits){ v = Number(v); if (!Number.isFinite(v)) return '—'; return v.toFixed(digits == null ? 0 : digits).replace(/\.0$/, ''); }
  function nowStamp(){ return new Date().toLocaleDateString('ru-RU'); }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function requestIdle(fn, timeout){
    if (window.requestIdleCallback) return window.requestIdleCallback(fn, { timeout: timeout || 900 });
    return window.setTimeout(function(){ fn({ didTimeout:false, timeRemaining:function(){ return 0; } }); }, Math.min(timeout || 160, 160));
  }

  function getRawRation(){
    if (window.State && typeof window.State.get === 'function') return safeArray(window.State.get());
    if (window.Ration && Array.isArray(window.Ration.current)) return safeArray(window.Ration.current);
    try { return safeArray(JSON.parse(localStorage.getItem('nutri_ration_v1') || '[]')); } catch(_) { return []; }
  }
  function flattenRation(r){
    try {
      var api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377 || window.CompositeFoodDecomposerV5376;
      if (api && typeof api.flattenForCalculation === 'function') return safeArray(api.flattenForCalculation(r));
      if (api && typeof api.flattenCompositeForCalculation === 'function') return safeArray(api.flattenCompositeForCalculation(r));
    } catch(_) {}
    return safeArray(r);
  }
  function getRation(){ return flattenRation(getRawRation()); }
  function nutrientRation(raw){
    raw = safeArray(raw == null ? getRawRation() : raw);
    try {
      if (window.State && typeof window.State.getForNutrients === 'function' && raw === getRawRation()) return safeArray(window.State.getForNutrients());
      var route = window.CompositeNutrientRoutingV53107;
      if (route && typeof route.toNutrientEntries === 'function') return safeArray(route.toNutrientEntries(raw));
    } catch(_) {}
    var out = [];
    raw.forEach(function(it){
      var custom = it && (it.recipe_instance_type === 'customized_recipe_instance' || it.composite_mode === 'customized_recipe_instance' || it.customized === true || it.edited === true || (Array.isArray(it.customization_events) && it.customization_events.length));
      if (custom && it && it.entry_type === 'composite_food') out = out.concat(flattenRation([it])); else if (it) out.push(it);
    });
    return out;
  }
  function product(key){ return window.DB && window.DB.byKey && window.DB.byKey.get ? window.DB.byKey.get(key) : null; }
  function productName(p, fallback){ return (p && (p.name_ru || p.name || p.key)) || fallback || 'Продукт'; }
  function firstNumeric(p, fields){
    if (!p) return { value:0, hit:false };
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (typeof p[f] === 'number') return { value:Number(p[f]) || 0, hit:true, field:f };
      if (typeof p[f + '_per_100g'] === 'number') return { value:Number(p[f + '_per_100g']) || 0, hit:true, field:f + '_per_100g' };
    }
    return { value:0, hit:false };
  }
  function specValuePer100(p, spec){
    var got = firstNumeric(p, spec.fields || [spec.key]);
    if (spec.fallbackSalt && !got.hit && typeof (p && p.salt) === 'number') return { value:Number(p.salt) * 393, hit:true, field:'salt*393' };
    return got;
  }
  function scaledSpec(p, grams, spec){ var got = specValuePer100(p, spec); return got.value * (Number(grams) || 0) / 100; }

  function getNorm(key){
    var v = window.norms && window.norms.values && window.norms.values[key] ? window.norms.values[key] : null;
    var m = metricSpec(key);
    var mode = (v && v.mode) || m.mode || 'adequacy';
    var value = mode === 'informational' ? 0 : Math.max(0, Number(v && v.value) || Number(m.target) || 0);
    return { value:value, unit:(v && v.unit) || m.unit || '', title:(v && v.title) || m.title || nutrientRu(key), mode:mode, referenceValue:Math.max(0, Number(v && (v.reference_value != null ? v.reference_value : v.referenceValue)) || Number(m.referenceValue) || 0) };
  }
  function statusFor(key, value, target){
    var mode = (target && target.mode) || metricSpec(key).mode;
    if (mode === 'informational') return 'информационный показатель';
    if (!target || !target.value) return 'ориентир не задан';
    var pct = value / target.value;
    if (mode === 'upper_limit') {
      if (pct <= 0.8) return 'в пределах ориентира';
      if (pct <= 1) return 'близко к верхнему пределу';
      if (pct <= 1.2) return 'немного выше ориентира';
      return 'выше ориентира';
    }
    if (pct < 0.6) return 'низко';
    if (pct < 0.9) return 'ниже ориентира';
    if (pct <= 1.15) return 'около ориентира';
    return 'выше ориентира';
  }
  function productCoverageForSpec(ration, spec){
    var count = 0, total = 0;
    safeArray(ration).forEach(function(it){ var p = product(it.key); if (!p) return; total++; if (specValuePer100(p, spec).hit) count++; });
    return { count:count, total:total, pct:total ? count / total * 100 : 0 };
  }

  function productReliability(p){
    var status = lower(p && p.nutrition_verification_status);
    var completeness = lower(p && p.nutrient_completeness_status);
    var exactness = lower(p && p.source_exactness_class);
    var text = [status, completeness, exactness].join(' ');
    if (/source_required|review_required|incomplete|needed|candidate|manual_review/.test(text)) return 'low';
    if (/proxy|recipe|model|label/.test(text)) return 'medium';
    if (/verified|exact|complete/.test(text)) return 'high';
    return 'unknown';
  }
  function reliabilitySummary(ration){
    var core = calculationCore();
    if (core && typeof core.sourceQuality === 'function') {
      try { return core.sourceQuality(ration); } catch(_) {}
    }
    var total = 0, high = 0, medium = 0, low = 0, unknown = 0;
    safeArray(ration).forEach(function(it){
      var p = product(it.key); if (!p) return; total++;
      var r = productReliability(p);
      if (r === 'high') high++; else if (r === 'medium') medium++; else if (r === 'low') low++; else unknown++;
    });
    var usable = high + medium;
    var label = !total ? 'нет продуктов' : (low > 0 ? 'есть источники, требующие проверки' : (medium > 0 ? 'часть данных по proxy/label' : 'высокая'));
    return { total:total, high:high, medium:medium, low:low, unknown:unknown, usable:usable, label:label, pct:total ? usable/total*100 : 0 };
  }
  function nutrientRowsFromTotals(totals, specs, ration){
    return specs.map(function(spec){
      var value = Number(totals[spec.key] || 0);
      var norm = getNorm(spec.key);
      var coverage = productCoverageForSpec(ration, spec);
      var target = norm && Number(norm.value) > 0 ? Number(norm.value) : 0;
      return {
        key:spec.key,
        title:(norm && norm.title) || spec.title,
        unit:(norm && norm.unit) || spec.unit,
        digits:spec.digits,
        value:value,
        mode:(norm && norm.mode) || metricSpec(spec.key).mode,
        target:target,
        referenceValue:norm ? Number(norm.referenceValue || 0) : 0,
        pct:target ? (value / target * 100) : 0,
        status:statusFor(spec.key, value, norm),
        coverage:coverage
      };
    });
  }

  function computeTotals(ration){
    var core = calculationCore();
    var coreResult = core && typeof core.totals === 'function' ? core.totals(ration) : null;
    var totals = coreResult && coreResult.t ? Object.assign({}, coreResult.t) : {};
    ALL_SPECS.forEach(function(spec){ if (!Number.isFinite(Number(totals[spec.key]))) totals[spec.key] = 0; });
    var rows = [];
    safeArray(ration).forEach(function(it){
      var p = product(it.key), g = Math.max(0, Number(it.grams) || 0);
      if (!p || !g) return;
      var nutrients = core && typeof core.scaledPerItem === 'function' ? core.scaledPerItem(it) : {};
      if (!nutrients || !Object.keys(nutrients).length) ALL_SPECS.forEach(function(spec){ nutrients[spec.key] = scaledSpec(p, g, spec); });
      rows.push({ key:it.key, name:productName(p, it.name_ru || it.name_fallback), grams:g, nutrients:nutrients });
    });
    return { totals:totals, rows:rows, source:'calculation-core' };
  }

  function buildDisplayRationRows(rawRation){
    var rows = [];
    safeArray(rawRation).forEach(function(it){
      if (!it) return;
      var p = product(it.key), g = Math.max(0, Number(it.grams) || 0);
      if (!p || !g) return;
      function makeRow(kind, level, item, prod, grams, note){
        var nutrients = {};
        ALL_SPECS.forEach(function(spec){ nutrients[spec.key] = scaledSpec(prod, grams, spec); });
        return { kind:kind, level:level, key:item.key, name:productName(prod, item.name_ru || item.name_fallback), grams:grams, nutrients:nutrients, note:note || '' };
      }
      if (it.entry_type === 'composite_food' && Array.isArray(it.children)) {
        rows.push(makeRow('composite_root', 0, it, p, g, 'Этикеточные КБЖУ корневого блюда; HEI и микронутриенты рассчитываются по ингредиентам ниже.'));
        it.children.forEach(function(child){
          var cp = product(child && child.key), cg = Math.max(0, Number(child && child.grams) || 0);
          if (cp && cg) rows.push(makeRow('composite_child', 1, child, cp, cg, child.component_role || 'ингредиент'));
        });
      } else rows.push(makeRow('normal', 0, it, p, g, ''));
    });
    return rows;
  }

  function getPersonName(){ var el = $('needs_person_name'); return el && el.value ? el.value.trim() : ''; }
  function getProductCorrectionState(){
    try { if (window.NutritionProductCorrectionPC1 && typeof window.NutritionProductCorrectionPC1.state === 'function') return window.NutritionProductCorrectionPC1.state(); } catch(_) {}
    var ration=getRation(); return {version:'v5.3.210-rc2',mode:'professional',scope:'current_ration',analysisState:ration.length?'complete':'empty',confirmed:true,rationRows:ration.length};
  }
  function getGoalText(){
    var el = $('needs_goal');
    if (!el) return '';
    var opt = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
    return opt ? txt(opt) : el.value;
  }
  function readTileValue(pattern){
    var out = $('needs_out');
    if (!out) return '';
    var tiles = out.querySelectorAll('.tile');
    for (var i=0;i<tiles.length;i++) {
      var title = txt(tiles[i].querySelector('.title'));
      if (pattern.test(title)) return txt(tiles[i].querySelector('.value'));
    }
    return '';
  }
  function fieldRaw(id){ var el=$(id); return el && el.value != null ? String(el.value).trim() : ''; }
  function selectedLabel(id){ var el=$(id); if (!el) return ''; if (el.options && el.selectedIndex >= 0) return String(el.options[el.selectedIndex].textContent || '').trim(); return fieldRaw(id); }
  function activeRegionLabel(){
    var b = document.querySelector('#regionSeg button.active, #regionSeg button[aria-pressed="true"]');
    return b ? String(b.textContent || '').replace(/\s+/g,' ').trim() : 'не указана';
  }
  function getNeedsModel(){
    var out = $('needs_out');
    var height=fieldRaw('needs_h'), weight=fieldRaw('needs_w'), age=fieldRaw('needs_age'), bmi=fieldRaw('needs_bmi');
    var applied = window.__lastNeedsProfileApplied === true && !!getPersonalNeedsProfile();
    var inputs = [
      { key:'person', label:'Пользователь', value:getPersonName() || 'не указан' },
      { key:'sex', label:'Пол', value:selectedLabel('needs_sex') || 'не указан' },
      { key:'age', label:'Возраст', value:age ? age+' лет' : 'не указан' },
      { key:'height', label:'Рост', value:height ? height+' см' : 'не указан' },
      { key:'weight', label:'Масса тела', value:weight ? weight+' кг' : 'не указана' },
      { key:'bmi', label:'ИМТ', value:bmi || 'не рассчитан' },
      { key:'state', label:'Профиль состояния', value:selectedLabel('needs_state') || 'не указан' },
      { key:'activity', label:'Активность', value:selectedLabel('needs_activity') || 'не указана' },
      { key:'goal', label:'Цель', value:selectedLabel('needs_goal') || getGoalText() || 'не указана' },
      { key:'diet_style', label:'Пищевой стиль', value:selectedLabel('needs_diet_style') || 'не указан' },
      { key:'guardrail', label:'Защитный сценарий', value:selectedLabel('needs_guardrail') || 'не указан' },
      { key:'edema', label:'Отёки / асцит', value:selectedLabel('needs_edema') || 'не указано' },
      { key:'meal_split', label:'Распределение по приёмам пищи', value:selectedLabel('needs_split') || 'не указано' },
      { key:'norm_region', label:'Система норм микронутриентов', value:activeRegionLabel() },
      { key:'norm_profile', label:'Профиль дневных норм', value:selectedLabel('normProfile') || 'не указан' }
    ];
    return {
      person:getPersonName() || 'не указан',
      goal:getGoalText() || selectedLabel('needs_goal') || 'не указана',
      energy:txt($('needs_kcal_range')) || '—',
      protein:txt($('needs_protein_total')) || '—',
      fat:txt($('needs_fat_g')) || '—',
      carbs:txt($('needs_carb_g')) || '—',
      fluid:readTileValue(/Жидкость/i) || '—',
      method:/Mifflin/i.test(txt(out)) ? 'Mifflin–St Jeor / ккал·кг по условиям' : (applied ? 'расчёт потребностей по выбранному профилю' : 'персональный расчёт не применён'),
      formulaAudit:(window.__lastNeedsMeta && window.__lastNeedsMeta.formulaAudit) ? JSON.parse(JSON.stringify(window.__lastNeedsMeta.formulaAudit)) : null,
      inputs:inputs,
      personalizationApplied:applied,
      inputComplete:!!(age && height && weight && fieldRaw('needs_sex'))
    };
  }

  function getHarvardApi(){ return window.HarvardPlateV5221 || window.HarvardPlateV5220 || window.HarvardPlateV5219 || window.HarvardPlateV5216 || window.HarvardPlateV5215 || window.HarvardPlateV5214 || window.HarvardPlateV5213 || window.HarvardPlateV5212 || window.HarvardPlateV5211 || window.HarvardPlateV529 || window.HarvardPlateV528 || window.HarvardPlateV527 || window.HarvardPlateV526 || window.HarvardPlateV525 || window.HarvardPlateV524 || null; }
  function getHarvardModel(){
    var api = getHarvardApi();
    if (!api || typeof api.getModel !== 'function') return { ready:false, message:'Модуль Гарвардской тарелки не загружен.' };
    try { return api.getModel(); } catch(e) { return { ready:false, message:String(e && (e.message || e)) }; }
  }

  function readHeiFromDom(){
    var totalText = txt($('heiTotalCell'));
    var total = num(totalText);
    var tbody = $('heiTableBody');
    var rows = [];
    if (tbody) {
      Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function(tr){
        var tds = tr.querySelectorAll('td');
        if (tds.length >= 5) rows.push({ title:txt(tds[0]), value:txt(tds[1]), norm:txt(tds[2]), delta:txt(tds[3]).replace(/\s+/g,' ').trim(), points:num(txt(tds[4])) });
      });
    }
    var summary = txt($('heiSummary'));
    if (Number.isFinite(total) && total > 0) return { total:total, rows:rows, summary:summary, source:'dom' };
    return null;
  }
  function getHEIModel(totals){
    try {
      if (window.__lastHEIModel && Number.isFinite(Number(window.__lastHEIModel.total))) {
        var liveRows = safeArray(window.__lastHEIRows).map(function(r){ return { title:(r.label || (window.HEI && window.HEI.helpers && window.HEI.helpers.STD && window.HEI.helpers.STD[r.key] && window.HEI.helpers.STD[r.key].label) || nutrientRu(r.key)), value:r.value || '', norm:r.norm || '', delta:r.delta || '', points:Number(r.pts != null ? r.pts : r.points || 0), key:r.key }; });
        return { total:Number(window.__lastHEIModel.total), grade:window.__lastHEIModel.grade || '', methodology:window.__lastHEIModel.methodology || null, rows:liveRows, summary:'HEI рассчитан из единой модели по фактической энергии рациона.', source:'model', assessment:window.__lastDietAssessment ? JSON.parse(JSON.stringify(window.__lastDietAssessment)) : null, formulaAudit:window.__lastHEIModel.formulaAudit ? JSON.parse(JSON.stringify(window.__lastHEIModel.formulaAudit)) : null };
      }
    } catch(_) {}
    var dom = readHeiFromDom();
    if (dom) return dom;
    try {
      if (window.HEI && window.HEI.computeIntake && window.HEI.score) {
        var kcalRef = (getNorm('kcal') && getNorm('kcal').value) || totals.kcal || 2000;
        var model = window.HEI.score(window.HEI.computeIntake(getRation(), window.DB), kcalRef);
        var points = model && model.points ? Object.keys(model.points).map(function(k){ var std = window.HEI && window.HEI.helpers && window.HEI.helpers.STD && window.HEI.helpers.STD[k]; return { title:(std && std.label) || nutrientRu(k), value:'', norm:'', delta:'', points:Number(model.points[k] || 0), key:k }; }) : [];
        return { total:Number(model.total || 0), grade:model && model.grade || '', methodology:model && model.methodology || null, rows:points, summary:'HEI рассчитан из модели по фактической энергии рациона.', source:'model', assessment:window.__lastDietAssessment ? JSON.parse(JSON.stringify(window.__lastDietAssessment)) : null, formulaAudit:model && model.formulaAudit ? JSON.parse(JSON.stringify(model.formulaAudit)) : null };
      }
    } catch(_) {}
    return null;
  }

  function getDietProfileReport(){
    var api = window.DietAnalysisProfileV5337 || window.DietAnalysisProfileV5336 || window.DietAnalysisProfileV5335 || window.DietAnalysisProfileV5334 || window.DietAnalysisProfileV5333 || window.DietAnalysisProfileV5332 || window.DietAnalysisProfileV5331 || window.DietAnalysisProfileV5330 || null;
    if (!api) return { ready:false, message:'Модуль профиля анализа рациона не загружен.' };
    try {
      var model = typeof api.buildPrintReportModel === 'function' ? api.buildPrintReportModel() : null;
      var html = typeof api.buildPrintReportHtml === 'function' ? api.buildPrintReportHtml() : '';
      return { ready:!!html, model:model, html:html, version:api.version || '', message: html ? '' : 'Печатный профиль пока не сформирован.' };
    } catch(e) {
      return { ready:false, message:String(e && (e.message || e)) };
    }
  }

  function buildDataQuality(ration, totals){
    var groups = [
      { label:'Энергия и КБЖУ', specs:MACRO_SPECS.slice(0,4) },
      { label:'Жиры, сахара, клетчатка, натрий', specs:MACRO_SPECS.slice(4) },
      { label:'Витамины', specs:VITAMIN_SPECS },
      { label:'Минералы', specs:MINERAL_SPECS },
      { label:'Гарвардская тарелка', specs:[{ key:'harvard_group', fields:['hei_category_key','category','tags'] }] }
    ];
    var rel = reliabilitySummary(ration);
    return groups.map(function(g){
      var count = 0, total = 0;
      safeArray(ration).forEach(function(it){
        var p = product(it.key); if (!p) return; total++;
        var hits = g.specs.filter(function(s){
          if (s.key === 'harvard_group') return !!(p.hei_category_key || p.category || (Array.isArray(p.tags) && p.tags.length));
          return specValuePer100(p, s).hit;
        }).length;
        if (hits > 0) count++;
      });
      var pct = total ? count/total*100 : 0;
      var note = pct < 80 ? 'карточки заполнены неполно' : rel.label;
      if (rel.low > 0 && /Витамины|Минералы|Гарвардская/.test(g.label)) note = 'часть источников требует проверки';
      return { key:lower(g.label).replace(/\s+/g,'_'), label:g.label, count:count, total:total, pct:pct, reliability:rel, note:note };
    });
  }


  function getPersonalNeedsProfile(){
    try {
      if (window.__lastNeedsProfileApplied !== true) return null;
      if (window.__lastNeedsProfileApplied === true && window.__lastPersonalNeedsProfile) return window.__lastPersonalNeedsProfile;
      if (window.PersonalNeedsProfileV5367 && typeof window.PersonalNeedsProfileV5367.current === 'function') return window.PersonalNeedsProfileV5367.current();
      if (window.PersonalNeedsProfileV5366 && typeof window.PersonalNeedsProfileV5366.current === 'function') return window.PersonalNeedsProfileV5366.current();
      if (window.PersonalNeedsProfileV5363 && typeof window.PersonalNeedsProfileV5363.current === 'function') return window.PersonalNeedsProfileV5363.current();
      if (window.PersonalNeedsProfileV5362 && typeof window.PersonalNeedsProfileV5362.current === 'function') return window.PersonalNeedsProfileV5362.current();
      if (window.PersonalNeedsProfileV5361 && typeof window.PersonalNeedsProfileV5361.current === 'function') return window.PersonalNeedsProfileV5361.current();
      if (window.PersonalNeedsProfileV5360 && typeof window.PersonalNeedsProfileV5360.current === 'function') return window.PersonalNeedsProfileV5360.current();
      if (window.PersonalNeedsProfileV5359 && typeof window.PersonalNeedsProfileV5359.current === 'function') return window.PersonalNeedsProfileV5359.current();
    } catch(_) {}
    return null;
  }

  function personalTargetFor(profile, key){
    if (!profile) return null;
    var meta = profile.targetMeta && profile.targetMeta[key];
    if (meta && Number(meta.value) > 0) return { value:Number(meta.value), unit:meta.unit || '', basis:meta.basis || 'персональный ориентир', label:meta.label || nutrientRu(key) };
    var v = profile.targets && Number(profile.targets[key]);
    if (Number.isFinite(v) && v > 0) return { value:v, unit:'', basis:'персональный ориентир', label:nutrientRu(key) };
    return null;
  }
  function applyPersonalTargetsToRows(profile, groups){
    if (!profile || !groups) return groups;
    Object.keys(groups).forEach(function(name){
      safeArray(groups[name]).forEach(function(row){
        var target = personalTargetFor(profile, row.key);
        if (!target || !Number.isFinite(target.value) || target.value <= 0) return;
        var previous = Number(row.target || 0);
        row.baseTarget = previous || 0;
        row.target = target.value;
        row.personalTarget = true;
        row.personalTargetBasis = target.basis;
        row.personalTargetLabel = target.label;
        if (target.unit && !row.unit) row.unit = target.unit;
        row.pct = row.target ? (Number(row.value || 0) / row.target * 100) : 0;
        row.status = statusFor(row.key, Number(row.value || 0), { value:row.target });
      });
    });
    return groups;
  }
  function personalTargetSummaryHtml(profile, mode){
    if (!profile || !profile.targetMeta) return '';
    var order = ['kcal','protein_g','fiber_g','calcium_mg','vitamin_d_mcg','iron_mg','vitamin_b12_mcg','vitamin_b9_mcg'];
    var names = {kcal:'энергия',protein_g:'белок',fiber_g:'клетчатка',calcium_mg:'кальций',vitamin_d_mcg:'витамин D',iron_mg:'железо',vitamin_b12_mcg:'B12',vitamin_b9_mcg:'фолат'};
    var items = order.map(function(k){
      var t = profile.targetMeta[k];
      if (!t || !(Number(t.value) > 0)) return '';
      return '<span><b>'+esc(names[k] || t.label || nutrientRu(k))+'</b> '+esc(fmt(t.value, k === 'vitamin_b12_mcg' ? 1 : 0))+' '+esc(t.unit || '')+'</span>';
    }).filter(Boolean).join('');
    if (!items) return '';
    var title = mode === 'report' ? 'Персональные ориентиры, которые использует отчёт' : 'Персональные ориентиры для сравнения';
    return '<div class="personal-target-strip"><strong>'+esc(title)+'</strong><div>'+items+'</div></div>';
  }

  function nutrientRu(key){
    var c = calculationCore();
    if (c && typeof c.label === 'function') return c.label(key);
    return {kcal:'Энергия',protein_g:'Белки',fat_g:'Жиры',carbs_g:'Углеводы',fiber_g:'Клетчатка',sugars_g:'Общие сахара',unsat_g:'Ненасыщенные жиры',calcium_mg:'Кальций',vitamin_d_mcg:'Витамин D',iron_mg:'Железо',vitamin_b12_mcg:'Витамин B12',vitamin_b9_mcg:'Фолат',vitamin_c_mg:'Витамин C',sodium_mg:'Натрий',added_sugars_g:'Добавленные сахара',sfa_g:'Насыщенные жиры',potassium_mg:'Калий',magnesium_mg:'Магний',zinc_mg:'Цинк',phosphorus_mg:'Фосфор'}[key] || 'Показатель';
  }
  function personalPriorityWeight(profile, key){
    var w = profile && profile.priorityWeights && Number(profile.priorityWeights[key]);
    return Number.isFinite(w) ? w : 0;
  }
  function personalPriorityReasons(profile, key){
    return safeArray(profile && profile.priorityReasons && profile.priorityReasons[key]);
  }
  function personalPriorityLabel(profile, key){
    var w = personalPriorityWeight(profile, key);
    if (w >= 4) return 'главный профильный приоритет';
    if (w >= 3) return 'важный профильный приоритет';
    if (w >= 1) return 'поддерживать по профилю';
    return 'общая проверка';
  }
  function personalWhyForNutrient(profile, key){
    var reasons = personalPriorityReasons(profile, key);
    if (reasons.length) return reasons.slice(0,2).map(function(x){ return x.title + ': ' + x.why; }).join(' ');
    if (key === 'sodium_mg' || key === 'added_sugars_g' || key === 'sfa_g') return 'Этот показатель влияет на качество рациона и обычно корректируется через продукты вне основной структуры, соусы, сладкие напитки, десерты или жирные добавки.';
    return nutrientRu(key) + ' входит в общий слой нутриентной проверки текущего рациона.';
  }
  function profileIsChild(profile){ return !!(profile && profile.ageGroup && profile.ageGroup.child); }
  function profileIsOlder(profile){ return !!(profile && ((profile.ageGroup && profile.ageGroup.older) || profile.state === 'elderly')); }
  function profileIsActive(profile){ return !!(profile && (profile.activity === 'high' || profile.activity === 'veryhigh')); }
  function rowDeficitText(row){
    if (!row) return '';
    var mode = row.mode || metricSpec(row.key).mode;
    if (mode === 'informational') return 'целевой минимум не задан';
    if (!(Number(row.target) > 0)) return 'ориентир не задан';
    var diff = Number(row.target) - Number(row.value || 0);
    if (mode === 'upper_limit') {
      if (diff > 0) return 'запас до верхнего предела примерно ' + fmt(diff, row.digits) + ' ' + (row.unit || '');
      if (diff < 0) return 'выше верхнего предела примерно на ' + fmt(Math.abs(diff), row.digits) + ' ' + (row.unit || '');
      return 'у верхнего предела';
    }
    if (diff > 0) return 'не хватает примерно ' + fmt(diff, row.digits) + ' ' + (row.unit || '');
    if (diff < 0) return 'выше ориентира примерно на ' + fmt(Math.abs(diff), row.digits) + ' ' + (row.unit || '');
    return 'у ориентира';
  }
  function targetStateText(row, limiter){
    if (!row) return 'ориентир не задан';
    var mode = row.mode || (limiter ? 'upper_limit' : metricSpec(row.key).mode);
    if (mode === 'informational') return 'информационный показатель';
    if (!(Number(row.target) > 0)) return 'ориентир не задан';
    var pct = Number(row.pct || 0);
    if (mode === 'upper_limit') return pct > 100 ? 'выше верхнего предела' : 'в пределах верхнего предела';
    return pct < 95 ? 'ниже персонального ориентира' : 'близко к ориентиру';
  }
  function sourceListForSpec(ration, spec, limit){
    var rows = [];
    safeArray(ration).forEach(function(it){
      var p = product(it.key); var g = Number(it.grams || 0); if (!p || !g) return;
      var val = scaledSpec(p, g, spec);
      if (val > 0) rows.push({ key:it.key, name:productName(p, it.name), grams:g, value:val, product:p });
    });
    rows.sort(function(a,b){ return b.value - a.value; });
    return rows.slice(0, limit || 4);
  }
  function specByKey(key){
    return ALL_SPECS.filter(function(s){ return s.key === key; })[0] || null;
  }
  function rowByKey(rows, key){
    for (var i=0; i<rows.length; i++) if (rows[i].key === key) return rows[i];
    return null;
  }
  function gramsRangeReduced(g){
    g = Number(g) || 0;
    if (g <= 0) return '';
    var step = g < 10 ? 1 : 5;
    var round = function(v){ return Math.max(0, Math.round(v / step) * step); };
    var low = round(g * 0.55), high = round(g * 0.75);
    if (high >= g) high = Math.max(0, round(g - step));
    if (low > high) low = high;
    if (high <= 0 || high >= g) return '';
    return low === high ? String(high) : (low + '–' + high);
  }
  function gramHalf(g){
    return Math.max(5, Math.round((Number(g) || 0) * 0.5 / 5) * 5);
  }
  function readableSources(sources, unit, digits){
    if (!sources || !sources.length) return 'явных источников в текущем рационе почти нет';
    return sources.slice(0,3).map(function(x){ return '«'+x.name+' — '+fmt(x.grams,0)+' г» ('+fmt(x.value,digits == null ? 0 : digits)+' '+unit+')'; }).join('; ');
  }
  function actionForNutrient(key, row, sources, profile){
    var first = sources && sources[0];
    var deficit = row && row.target ? Math.max(0, Number(row.target) - Number(row.value || 0)) : 0;
    var child = profileIsChild(profile);
    var older = profileIsOlder(profile);
    var active = profileIsActive(profile);
    var lose = profile && profile.goal === 'lose';
    var gain = profile && (profile.goal === 'gain' || profile.goal === 'rehab_gain');
    var mode = row && row.mode || metricSpec(key).mode;
    if (mode === 'upper_limit' && row && Number(row.target) > 0 && Number(row.value || 0) <= Number(row.target)) {
      return nutrientRu(key) + ' находится в пределах верхнего предела. Автоматическое сокращение продукта не предлагается; сохранить текущий уровень и контролировать показатель после других изменений рациона.';
    }
    if (mode === 'informational') return nutrientRu(key) + ' показан справочно. Отдельная цель добора в граммах не применяется.';
    if (key === 'protein_g') {
      if (deficit > 0) {
        if (child) return 'Добрать примерно '+fmt(deficit,0)+' г белка без взрослой логики ограничения рациона: добавить к одному из основных приёмов яйцо, творог/йогурт, рыбу, птицу, тофу или бобовые в возрастно переносимой порции. После добавления пересчитать белок и энергию.';
        if (older) return 'Добрать примерно '+fmt(deficit,0)+' г белка и распределить его по основным приёмам: добавить 120–150 г творога, рыбы, птицы, нежирного мяса, тофу или бобовых либо увеличить текущий белковый продукт на 40–60 г.';
        if (active) return 'Добрать примерно '+fmt(deficit,0)+' г белка: добавить 25–35 г белка в приём пищи после нагрузки или увеличить текущий белковый продукт на 40–60 г. После пересчёта проверить также энергию и углеводную основу.';
        return 'Добрать примерно '+fmt(deficit,0)+' г белка: добавить к одному из основных приёмов 120–150 г творога, рыбы, птицы, нежирного мяса, тофу или бобовых. Если белковый продукт уже есть, увеличить его порцию на 40–60 г и пересчитать рацион.';
      }
      return older || active
        ? 'Белок близок к ориентиру. Для этого профиля важно не снижать белковую основу первой и проверить распределение белка между основными приёмами пищи.'
        : 'Белок близок к ориентиру. Сохранить текущие белковые продукты и не сокращать их первыми при коррекции калорийности.';
    }
    if (key === 'fiber_g') {
      return deficit > 0
        ? 'Добавить 120–150 г овощей, зелени или бобовых к основному приёму пищи. Если в рационе есть рафинированная злаковая позиция, заменить половину её порции на цельнозерновой аналог.'
        : 'Клетчатка близка к ориентиру. Сохранить овощную основу и не заменять её одной фруктовой или соковой частью.';
    }
    if (key === 'calcium_mg') {
      if (deficit > 0) {
        if (child) return 'Добрать кальций через пищевые источники роста: добавить 200–250 г йогурта, кефира, творога или другой подходящий кальциевый продукт; при отказе от молочных продуктов — кальций-обогащённую альтернативу. После добавления проверить кальций и общую энергию.';
        if (older) return 'Добрать кальций как возрастной приоритет: добавить 200–250 г кефира, йогурта или творога; при отсутствии молочных продуктов использовать кальций-обогащённый напиток или другой обогащённый продукт. После пересчёта проверить кальций, белок и витамин D.';
        return 'Добавить пищевой источник кальция: 200–250 г кефира, йогурта или творога; при отказе от молочных продуктов — кальций-обогащённый напиток или другой обогащённый продукт. После добавления проверить кальций и молочно-кальциевый вклад.';
      }
      return 'Кальций близок к ориентиру. Сохранить текущие молочные или кальций-обогащённые продукты; у пожилого и детского профиля не снижать этот слой первым.';
    }
    if (key === 'vitamin_d_mcg') {
      return 'Витамин D по рациону часто оценивается неполно. Проверить наличие жирной рыбы, яиц или обогащённых продуктов; вопрос добавок решается отдельно со специалистом, особенно у детей и пожилых.';
    }
    if (key === 'vitamin_b12_mcg') {
      if (deficit > 0) return older
        ? 'Проверить B12 как возрастной приоритет: оставить регулярные животные продукты или B12-обогащённые альтернативы. При сомнениях по всасыванию, лекарствам или анализам нужен очный контроль.'
        : 'Проверить наличие животных продуктов или B12-обогащённых альтернатив. При растительном стиле питания пищевого источника B12 обычно недостаточно без специально обогащённых продуктов или добавок.';
      return 'B12 близок к ориентиру. Сохранить продукты-источники или обогащённые альтернативы.';
    }
    if (key === 'iron_mg') {
      if (deficit > 0) return 'Добавить источник железа: мясо, птицу, рыбу, бобовые, гречку или другие подходящие продукты. Растительные источники лучше сочетать с овощами, фруктами или ягодами как источником витамина C.';
      return 'Железо близко к ориентиру. Для женского, подросткового и детского профиля полезно удерживать регулярные пищевые источники железа.';
    }
    if (key === 'sodium_mg') {
      if (first) { var reduced = gramsRangeReduced(first.grams); if (!reduced) return 'Первый тест сокращения: убрать эту небольшую порцию полностью либо заменить её менее солёным вариантом'; return 'Первый тест сокращения: уменьшить «'+first.name+' — '+fmt(first.grams,0)+' г» до '+reduced+' г или заменить на менее солёный вариант. '+(child ? 'У ребёнка сокращать лучше именно солёные добавки и готовые продукты, не убирая белковую, овощную и молочно-кальциевую основу. ' : '')+'После пересчёта проверить натрий и HEI.'; }
      return 'Проверить соль, соусы, сыры, хлеб и готовые продукты: именно они чаще всего дают избыток натрия.';
    }
    if (key === 'added_sugars_g') {
      if (first) { var reducedSugar = gramsRangeReduced(first.grams); if (!reducedSugar) return 'Первый тест сокращения: убрать эту небольшую порцию либо заменить её продуктом без добавленного сахара.'; return 'Первый тест сокращения: уменьшить «'+first.name+' — '+fmt(first.grams,0)+' г» до '+reducedSugar+' г или заменить на продукт без добавленного сахара. '+(lose ? 'При снижении массы это один из первых источников для коррекции, потому что он меньше защищает структуру тарелки. ' : '')+'После пересчёта проверить добавленные сахара и HEI.'; }
      return 'Проверить сладкие напитки, десерты, сладкие йогурты, батончики и соусы: добавленные сахара лучше сокращать до изменения основных полезных продуктов.';
    }
    if (key === 'sfa_g') {
      if (first) { var reducedSfa = gramsRangeReduced(first.grams); if (!reducedSfa) return 'Первый тест сокращения: убрать эту небольшую порцию либо заменить её менее насыщенным по жирам вариантом.'; return 'Первый тест сокращения: уменьшить «'+first.name+' — '+fmt(first.grams,0)+' г» до '+reducedSfa+' г или заменить на менее жирный/менее насыщенный вариант. После пересчёта проверить насыщенные жиры и HEI.'; }
      return 'Проверить жирные молочные продукты, сыр, колбасы, выпечку, сливочное масло и жирные соусы.';
    }
    if (key === 'carbs_g') {
      if (row && row.target && row.pct < 90) return active || gain
        ? 'Для активного, восстановительного или наборного профиля добавить углеводную основу: крупу, цельнозерновой хлеб, картофель/батат как крахмалистый слой или фрукты вокруг нагрузки. После пересчёта проверить энергию и структуру.'
        : 'Проверить углеводную основу: приоритет за цельными злаками, овощами, фруктами и бобовыми, а не за сладкими продуктами.';
      return 'Углеводы нужно читать вместе с активностью и качеством источников: приоритет за цельными злаками, овощами, фруктами и бобовыми.';
    }
    if (key === 'kcal') {
      if (row && row.target && row.pct < 90) return child
        ? 'Энергия ниже ориентира: детский рацион не корректируют взрослым ограничением. Усилить полноценный приём пищи через белковый продукт, крупу/картофель/цельнозерновой хлеб и овощно-фруктовую часть.'
        : 'Энергия ниже ориентира: увеличить рацион через полноценные продукты, а не только сладкие или жирные добавки. Начать с белкового продукта и углеводной основы в одном из приёмов пищи.';
      return 'Энергия близка к ориентиру. Дальше важнее качество источников и распределение по приёмам пищи.';
    }
    return 'Проверить продукты-источники этого нутриента и пересчитать рацион после изменения граммов.';
  }
  function buildPersonalNutrientActions(profile, rowsByGroup, ration){
    if (!profile) return [];
    var allRows = [].concat(rowsByGroup.macros || [], rowsByGroup.vitamins || [], rowsByGroup.minerals || []);
    var keys = [];
    safeArray(profile && profile.priorities).forEach(function(p){ safeArray(p.nutrients).forEach(function(k){ if (keys.indexOf(k) < 0) keys.push(k); }); });
    ['protein_g','fiber_g','calcium_mg','vitamin_d_mcg','iron_mg','vitamin_b12_mcg','sodium_mg','added_sugars_g','sfa_g','carbs_g','kcal'].forEach(function(k){ if (keys.indexOf(k) < 0) keys.push(k); });
    var rows = [];
    keys.forEach(function(key){
      var spec = specByKey(key); if (!spec) return;
      var row = rowByKey(allRows, key); if (!row) return;
      var mode = row.mode || metricSpec(key).mode;
      var limiter = mode === 'upper_limit';
      var hasTarget = Number(row.target) > 0;
      var pct = hasTarget ? Number(row.pct || 0) : 0;
      var needsAttention = mode === 'informational' ? false : (limiter ? (pct > 100) : (hasTarget ? pct < 95 : false));
      var profileWeight = personalPriorityWeight(profile, key);
      var profilePriority = profileWeight > 0;
      if (mode === 'informational' || (!needsAttention && profileWeight < 3)) return;
      var sources = sourceListForSpec(ration, spec, 4);
      var unit = row.unit || spec.unit || '';
      var level = needsAttention ? (limiter ? 'сократить' : 'добрать') : 'проверить';
      var status = hasTarget ? (fmt(row.value, row.digits)+' '+unit+' из '+fmt(row.target, row.digits)+' '+unit+' · '+fmt(pct,0)+'%' + (row.personalTarget ? ' · персональный ориентир' : '')) : (fmt(row.value, row.digits)+' '+unit);
      var gap = rowDeficitText(row);
      var why = personalWhyForNutrient(profile, key);
      var profileLabel = personalPriorityLabel(profile, key);
      var attentionWeight = needsAttention ? 1000 : 0;
      var gapWeight = limiter ? Math.max(0, pct - 100) : Math.max(0, 100 - pct);
      rows.push({
        key:key,
        title:row.title || spec.title,
        level:level,
        status:status,
        state:targetStateText(row, limiter),
        gap:gap,
        profileLabel:profileLabel,
        profileWhy:why,
        sources:readableSources(sources, unit, row.digits),
        action:actionForNutrient(key, row, sources, profile),
        coverage:row.coverage ? fmt(row.coverage.pct,0)+'%' : '—',
        weight:attentionWeight + profileWeight * 260 + (profilePriority ? 70 : 0) + gapWeight
      });
    });
    rows.sort(function(a,b){ return b.weight - a.weight; });
    return rows.slice(0,8);
  }

  function heiMaxForKey(key){
    return /^(fruits_total|fruits_whole|vegetables_total|greens_beans|protein_total|seafood_plant)$/.test(String(key || '')) ? 5 : 10;
  }
  function profileReportModel(m){ return m && m.dietProfile && m.dietProfile.model ? m.dietProfile.model : null; }
  function profileCore(m){ var x=profileReportModel(m); return x && x.profile ? x.profile : null; }
  function dedupeItems(items, limit){
    var seen={}, out=[];
    safeArray(items).forEach(function(x){
      if (!x) return;
      var k=lower(x.key || x.title || x.label || x.text).replace(/[^a-zа-я0-9]+/gi,' ').trim();
      if (!k || seen[k]) return;
      seen[k]=true; out.push(x);
    });
    return out.slice(0, limit || out.length);
  }
  function reportStrengths(m){
    var p=profileCore(m), items=[];
    var labels={plantBase:'Растительная основа',wholeGrainStarch:'Цельные злаки и крахмалистая часть',proteinAdequacy:'Белковое обеспечение',dairyCalcium:'Молочно-кальциевый вклад',outsideSafety:'Продукты вне основной структуры',balanceDisplacement:'Структурный баланс'};
    if (p && p.domains) Object.keys(labels).forEach(function(k){ var v=Number(p.domains[k]); if (Number.isFinite(v) && v>=85) items.push({key:'domain:'+k,title:labels[k],score:v,detail:fmt(v,0)+'/100; показатель находится в сильной зоне.',kind:'структура'}); });
    safeArray(m && m.hei && m.hei.rows).forEach(function(r){ var max=heiMaxForKey(r.key), pts=Number(r.points); if (Number.isFinite(pts) && max && pts/max>=0.9) items.push({key:'hei:'+r.key,title:r.title || nutrientRu(r.key),score:pts/max*100,detail:fmt(pts,1)+' из '+fmt(max,0)+' баллов HEI; индексный ориентир достигнут или почти достигнут.',kind:'HEI'}); });
    items.sort(function(a,b){ return b.score-a.score; });
    items=dedupeItems(items,3);
    if (!items.length) items.push({key:'baseline',title:'Рацион рассчитан',score:0,detail:'Сильные стороны будут выделены после появления устойчивых показателей.',kind:'обзор'});
    return items;
  }
  function briefHeiAction(row){
    var key=String(row && row.key || ''), delta=String(row && row.delta || '').trim();
    if (key==='dairy') return 'Добавить 150–200 мл/г несладкого молочного продукта; при достаточной калорийности заменить им часть менее ценной позиции, рассчитав массы отдельно.';
    if (key==='fatty_acids_ratio') return 'Часть источников насыщенных жиров заменить рыбой, орехами, семенами или растительным маслом.';
    if (key==='grains_refined') return 'Сократить примерно 40 г рафинированных злаков либо заменить их отдельно рассчитанной порцией цельнозернового продукта.';
    if (key==='grains_whole') return 'Часть рафинированной основы заменить отдельно рассчитанной порцией цельнозернового продукта.';
    if (key==='vegetables_total' || key==='greens_beans') return 'Добавить 120–150 г овощей, зелени или бобовых и повторно проверить компонент.';
    if (key==='fruits_total' || key==='fruits_whole') return 'Добавить 100–150 г цельного фрукта или ягод, не заменяя ими овощную основу.';
    if (key==='protein_total') return 'Добавить отдельно рассчитанную порцию полноценного белкового продукта к основному приёму пищи.';
    if (key==='seafood_plant') return 'Добавить рыбу, бобовые, тофу, орехи или семена в отдельно рассчитанной порции.';
    if (key==='sodium_g') return 'Сократить главный источник натрия и повторно проверить общую сумму.';
    if (key==='added_sugars_pct') return 'Сократить главный источник добавленного сахара либо заменить его несладким вариантом.';
    if (key==='sat_fats_pct') return 'Часть главного источника насыщенных жиров заменить продуктом с преобладанием ненасыщенных жиров.';
    var first=delta.split(/(?<=[.!?])\s+/)[0] || delta;
    return first.length>180 ? first.slice(0,177).replace(/[,:;\s]+$/,'')+'…' : (first || 'Изменить соответствующую продуктовую группу и повторить расчёт.');
  }
  function reportPriorities(m){
    var dp=profileReportModel(m), n=dp && dp.narrative, items=[];
    safeArray(m && m.personalNutrients).forEach(function(x){
      if (!x || /информац/i.test(x.status||'')) return;
      items.push({key:'personal:'+x.key,title:x.title || nutrientRu(x.key),score:Number(x.weight)||0,kind:'персональная норма',reason:(x.state || x.status || '')+(x.gap ? '; '+x.gap : ''),action:x.action || 'Проверить показатель после изменения рациона.'});
    });
    safeArray(m && m.hei && m.hei.rows).forEach(function(r){
      var max=heiMaxForKey(r && r.key), pts=Number(r && r.points), ratio=max ? pts/max : NaN;
      if (!Number.isFinite(ratio) || ratio>=0.995) return;
      var value=String(r.value || '').trim(), norm=String(r.norm || '').trim();
      var reason=(value ? 'Сейчас: '+value+'. ' : '')+(norm ? norm.replace(/^./,function(c){return c.toUpperCase();})+'.' : 'Компонент ещё не достиг максимального балла HEI.');
      items.push({key:'hei:'+r.key,title:r.title || nutrientRu(r.key),score:(1-ratio)*1000,kind:'HEI',reason:reason,action:briefHeiAction(r)});
    });
    safeArray(n && n.weakStructure).forEach(function(x){
      var v=Number(x && x.value); if (!Number.isFinite(v) || v>=70) return;
      items.push({key:'structure:'+x.key,title:x.label,score:(100-v)*10,kind:'структура',reason:fmt(v,0)+'/100; '+(x.why || 'домен ниже рабочей зоны')+'.',action:x.action || 'Изменить продукты, формирующие этот домен, и повторить расчёт.'});
    });
    items.sort(function(a,b){ return b.score-a.score; });
    items=dedupeItems(items,3);
    if (items.length<3) {
      safeArray(n && n.weakStructure).forEach(function(x){
        if (items.length>=3) return; var v=Number(x && x.value); if (!Number.isFinite(v) || v<70 || v>=85) return;
        items.push({key:'support:'+x.key,title:x.label,score:0,kind:'поддержание',reason:fmt(v,0)+'/100; показатель находится в рабочей зоне.',action:'Сохранить текущий вклад и не выбирать этот домен главным объектом увеличения без дополнительных оснований.'});
      });
    }
    if (items.length<3) reportStrengths(m).forEach(function(x){ if (items.length<3) items.push({key:'keep:'+x.key,title:x.title,score:0,kind:'поддержание',reason:x.detail,action:'Сохранить эту сильную сторону при остальных изменениях.'}); });
    return dedupeItems(items,3);
  }
  function actionVerbFromText(text, fallback){
    var t=lower(text);
    if (/заменить|заменой|вместо/.test(t)) return 'заменить';
    if (/уменьшить|сократить|убрать/.test(t)) return 'уменьшить';
    if (/увеличить|добавить|добрать/.test(t)) return 'увеличить';
    if (/сохранить|оставить/.test(t)) return 'сохранить';
    return fallback || 'проверить';
  }
  function firstActionModel(m, priorities){
    var dp=profileReportModel(m), n=dp && dp.narrative, descriptor=dp && dp.action;
    var full=String((n && n.first) || (descriptor && descriptor.instruction) || (priorities[0] && priorities[0].action) || 'Сохранить текущий рацион и повторить расчёт после изменения продуктов.').trim();
    var parts=full.split(/Ожидаемый эффект:\s*/i);
    var instruction=String(parts[0] || full).replace(/[.\s]+$/,'').trim();
    var effect=String(parts[1] || '').replace(/[.\s]+$/,'').trim();
    if (!effect && descriptor && descriptor.shift) effect=descriptor.shift;
    if (!effect) effect='изменение должно отразиться прежде всего на показателе, который выбран причиной первого шага';
    var reason=(priorities[0] && priorities[0].reason) || (n && safeArray(n.reasons)[0]) || 'Это наиболее выраженное направление, найденное в текущем расчёте.';
    return {verb:actionVerbFromText(instruction,descriptor && descriptor.action),title:(descriptor && descriptor.label) || (priorities[0] && priorities[0].title) || 'Первый шаг',product:(descriptor && descriptor.product) || '',instruction:instruction,reason:reason,effect:effect,check:'Внести новые граммы в рацион, повторно рассчитать HEI, структурную ось и дневные нормы; сохранить изменение только после проверки ожидаемого сдвига.'};
  }
  function buildPatientContentModel(m){
    var pc=m && m.productCorrection || getProductCorrectionState();
    if (!pc || pc.analysisState !== 'complete') {
      var preliminary = pc && pc.analysisState === 'meal' ? 'Отчёт отражает один приём пищи. Суточный HEI и выводы о качестве всего дня не применяются.' : 'Отчёт отражает неполный фрагмент суточного ввода. КБЖУ и нутриенты рассчитаны по введённым продуктам, но финальная оценка дня и рекомендации не формируются.';
      return {strengths:[],priorities:[],firstAction:{verb:'продолжить',title:'завершить ввод',instruction:pc && pc.analysisState==='meal'?'Использовать результат как анализ одного приёма пищи':'Добавить остальные продукты дня и подтвердить завершённость ввода',reason:'Без полного суточного состава нельзя корректно интерпретировать HEI и структуру дня',effect:'снижение риска ложного вывода по фрагментарным данным',check:'После изменения продуктов заново подтвердить завершённость дня'},conclusion:preliminary,axisAgreement:null};
    }
    var strengths=reportStrengths(m), priorities=reportPriorities(m), first=firstActionModel(m,priorities);
    var dp=profileReportModel(m), profile=dp && dp.profile, q=dp && dp.quadrant;
    var hei=m && m.hei && Number(m.hei.total), st=profile && Number(profile.dailyStructure), agreement=profile && profile.interpretation && Number(profile.interpretation.axisAgreement);
    var conclusion='Текущий введённый рацион оценён по качеству, структуре и дневным показателям.';
    if (Number.isFinite(hei) && Number.isFinite(st)) conclusion='HEI составляет '+fmt(hei,0)+'/100, структурная ось — '+fmt(st,0)+'/100. '+((q && q.label) ? q.label+'. ' : '')+'Главное направление определяется по трём приоритетам ниже.';
    return {strengths:strengths,priorities:priorities,firstAction:first,conclusion:conclusion,axisAgreement:Number.isFinite(agreement)?agreement:null};
  }
  function deepFreeze(value){
    if (!value || typeof value!=='object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function(k){ deepFreeze(value[k]); });
    try { Object.freeze(value); } catch(_) {}
    return value;
  }
  function buildReportSnapshot(m){
    var dp=profileReportModel(m), p=dp && dp.profile;
    return {
      schemaVersion:'patient-report-snapshot-v2',
      reportVersion:VERSION,
      createdOn:m.generatedAt,
      inputs:safeArray(m.needs && m.needs.inputs).map(function(x){ return {key:x.key,label:x.label,value:x.value}; }),
      personalizationApplied:!!(m.needs && m.needs.personalizationApplied),
      needs:{energy:m.needs.energy,protein:m.needs.protein,fat:m.needs.fat,carbs:m.needs.carbs,fluid:m.needs.fluid,method:m.needs.method},
      totals:Object.assign({},m.totals || {}),
      hei:{total:m.hei && Number(m.hei.total),rows:safeArray(m.hei && m.hei.rows).map(function(x){ return Object.assign({},x); })},
      matrix:{hei:p && Number(p.hei),structure:p && Number(p.dailyStructure),zone:dp && dp.quadrant && dp.quadrant.label,axisAgreement:p && p.interpretation && Number(p.interpretation.axisAgreement)},
      harvard:{score:m.harvard && Number(m.harvard.score),coreMass:m.harvard && Number(m.harvard.coreMass)},
      sourceQuality:Object.assign({},m.sourceQuality || {}),
      provenanceQuality:m.provenanceQuality ? JSON.parse(JSON.stringify(m.provenanceQuality)) : null,
      formulaAudit:m.formulaAudit ? JSON.parse(JSON.stringify(m.formulaAudit)) : null,
      validationEvidence:m.validationEvidence ? JSON.parse(JSON.stringify(m.validationEvidence)) : null,
      productCorrection:m.productCorrection ? JSON.parse(JSON.stringify(m.productCorrection)) : null,
      content:{strengths:safeArray(m.patientContent && m.patientContent.strengths).map(function(x){return Object.assign({},x);}),priorities:safeArray(m.patientContent && m.patientContent.priorities).map(function(x){return Object.assign({},x);}),firstAction:Object.assign({},m.patientContent && m.patientContent.firstAction || {})}
    };
  }
  function snapshotHash(){
    var ration = getRation().map(function(it){ return String(it.key) + ':' + Number(it.grams || 0); }).join('|');
    var needs = ['needs_kcal_range','needs_protein_total','needs_fat_g','needs_carb_g','heiTotalCell'].map(function(id){ return txt($(id)); }).join('|');
    var p = getPersonalNeedsProfile();
    var profile = p ? [p.version, p.ageGroup && p.ageGroup.key, p.sex, p.state, p.activity, p.goal, p.dietStyle, p.guardrail, p.goalGuardrailOverride, p.proteinTargetG, safeArray(p.nutrientFocusKeys).join(','), JSON.stringify(p.priorityWeights || {})].join('|') : '';
    var pc=getProductCorrectionState();
    return ration + '::' + needs + '::' + profile + '::' + JSON.stringify({mode:pc.mode,scope:pc.scope,analysisState:pc.analysisState,confirmed:pc.confirmed,signature:pc.signature||''});
  }
  function buildReportModel(options){
    options = options || {};
    var hash = snapshotHash();
    if (!options.force && cachedModel && cachedHash === hash && !cacheDirty) return cachedModel;
    var t0 = now();
    var core = calculationCore();
    var snapshot = core && typeof core.snapshot === 'function' ? core.snapshot() : null;
    var rawRation = snapshot ? snapshot.rawRation : getRawRation();
    var patternRation = snapshot ? snapshot.foodPatternRation : flattenRation(rawRation);
    var ration = snapshot ? snapshot.nutrientRation : nutrientRation(rawRation);
    var computed = computeTotals(ration);
    if (snapshot && snapshot.totals) computed.totals = Object.assign({}, snapshot.totals);
    var totals = computed.totals;
    var macros = nutrientRowsFromTotals(totals, MACRO_SPECS, ration);
    var vitamins = nutrientRowsFromTotals(totals, VITAMIN_SPECS, ration);
    var minerals = nutrientRowsFromTotals(totals, MINERAL_SPECS, ration);
    var personalNeeds = getPersonalNeedsProfile();
    applyPersonalTargetsToRows(personalNeeds, { macros:macros, vitamins:vitamins, minerals:minerals });
    var needsModel = getNeedsModel();
    var productCorrection = getProductCorrectionState();
    var finalDay = productCorrection && productCorrection.analysisState === 'complete';
    var heiModel = finalDay ? getHEIModel(totals) : null;
    var formulaRegistryVersion = (window.NutritionFormulaRegistryP14 && window.NutritionFormulaRegistryP14.version) || '';
    var formulaAudit = {
      registryVersion:formulaRegistryVersion,
      needs:needsModel && needsModel.formulaAudit ? JSON.parse(JSON.stringify(needsModel.formulaAudit)) : null,
      ration:snapshot && snapshot.formulaAudit ? JSON.parse(JSON.stringify(snapshot.formulaAudit)) : null,
      hei:heiModel && heiModel.formulaAudit ? JSON.parse(JSON.stringify(heiModel.formulaAudit)) : null
    };
    var validationPolicy = window.NutritionValidationEvidenceP20 && window.NutritionValidationEvidenceP20.policy || null;
    var validationEvidence = {
      version:validationPolicy && validationPolicy.release_version || 'v5.3.210-p2.0',
      stageStatus:validationPolicy && validationPolicy.stage_status || 'EXTERNAL_VALIDATION_PENDING',
      labelRu:validationPolicy && validationPolicy.status_label_ru || 'Внешняя клиническая и предметная валидация ожидается',
      externalValidationClaimAllowed:false
    };
    var model = {
      version:VERSION,
      title:REPORT_TITLE,
      generatedAt:nowStamp(),
      hash:hash,
      needs:needsModel,
      personalNeeds:personalNeeds,
      personalNutrients:buildPersonalNutrientActions(personalNeeds, { macros:macros, vitamins:vitamins, minerals:minerals }, ration),
      rawRation:rawRation,
      ration:ration,
      foodPatternRation:patternRation,
      rationRows:computed.rows,
      displayRationRows:buildDisplayRationRows(rawRation),
      rationPositionCount:rawRation.length,
      totals:totals,
      macros:macros,
      vitamins:vitamins,
      minerals:minerals,
      harvard:finalDay ? getHarvardModel() : {ready:false,message:productCorrection.analysisState==='meal'?'Суточная структурная модель не применяется к одному приёму пищи.':'Структурная модель появится после подтверждения полного дня.'},
      hei:heiModel,
      dietAssessment:heiModel && heiModel.assessment ? heiModel.assessment : (window.__lastDietAssessment ? JSON.parse(JSON.stringify(window.__lastDietAssessment)) : null),
      dietProfile:finalDay ? getDietProfileReport() : {ready:false,message:productCorrection.analysisState==='meal'?'Суточный профиль не применяется к одному приёму пищи.':'Профиль появится после подтверждения полного дня.'},
      dataQuality:buildDataQuality(ration, totals),
      calculationSource:'NutritionCalculationCoreV53155',
      sourceQuality:snapshot && snapshot.sourceQuality ? snapshot.sourceQuality : reliabilitySummary(ration),
      provenanceQuality:snapshot && snapshot.dataQuality ? snapshot.dataQuality : (window.ProductDataQualityV13 && window.ProductDataQualityV13.analyzeRation ? window.ProductDataQualityV13.analyzeRation(ration, window.PRODUCT_DB || window.__PRODUCT_DB__ || null) : null),
      formulaAudit:formulaAudit,
      validationEvidence:validationEvidence,
      productCorrection:productCorrection
    };
    model.patientContent = buildPatientContentModel(model);
    model.reportSnapshot = deepFreeze(buildReportSnapshot(model));
    lastBuildMs = Math.round(now() - t0);
    cachedModel = model;
    cachedHash = hash;
    cacheDirty = false;
    return model;
  }

  function section(title, body, cls){ return '<section class="nr-section '+(cls||'')+'"><h2>'+esc(title)+'</h2>'+body+'</section>'; }
  function kv(label, value){ return '<div class="nr-kv"><span>'+esc(label)+'</span><strong>'+esc(value == null || value === '' ? '—' : value)+'</strong></div>'; }
  function table(headers, rows, cls){
    if (!rows || !rows.length) rows = ['<tr><td colspan="'+headers.length+'">Нет данных.</td></tr>'];
    return '<table class="nr-table '+(cls||'')+'"><thead><tr>'+headers.map(function(h){ return '<th>'+esc(h)+'</th>'; }).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';
  }
  function pctText(row){ return row.mode === 'informational' ? 'справочно' : (row.target ? fmt(row.pct,0)+'%' : '—'); }
  function nutrientTable(rows, cls){
    return table(['Показатель','Факт','Ориентир','%','Статус','Покрытие'], rows.map(function(r){
      var targetCell = r.mode === 'informational' ? 'не задан' : (r.target ? fmt(r.target,r.digits)+' '+esc(r.unit) : '—');
      if (r.personalTarget) targetCell += '<small class="nr-personal-target-note">'+esc(r.personalTargetBasis || 'персональный ориентир')+'</small>';
      return '<tr><td>'+esc(r.title)+'</td><td>'+fmt(r.value,r.digits)+' '+esc(r.unit)+'</td><td>'+targetCell+'</td><td>'+pctText(r)+'</td><td>'+esc(r.status)+'</td><td>'+fmt(r.coverage.pct,0)+'%</td></tr>';
    }), cls || '');
  }

  function executiveItemHtml(x, type){
    return '<article class="nr-exec-item" data-kind="'+esc(type || x.kind || '')+'"><span>'+esc(type === 'strength' ? 'Сильная сторона' : (x.kind || 'Направление'))+'</span><strong>'+esc(x.title || '')+'</strong><p>'+esc(x.detail || x.reason || '')+'</p>'+(x.action ? '<em>'+esc(x.action)+'</em>' : '')+'</article>';
  }
  function summaryHtml(m){
    var c=m.patientContent || buildPatientContentModel(m), pc=m.productCorrection || getProductCorrectionState(), dp=profileReportModel(m), p=dp && dp.profile, q=dp && dp.quadrant;
    if (!pc || pc.analysisState !== 'complete') {
      var scopeLabel=pc && pc.analysisState==='meal'?'Один приём пищи':'Неполный суточный ввод';
      return '<section class="nr-first-page"><header class="nr-cover"><div class="nr-cover-heading"><div><div class="nr-kicker">Предварительный отчёт</div><h1>'+esc(m.title)+'</h1></div><p>Дата: '+esc(m.generatedAt)+'</p></div><div class="nr-cover-grid">'+kv('Пользователь',m.needs.person)+kv('Статус ввода',scopeLabel)+kv('Энергия введённых продуктов',fmt(m.totals.kcal,0)+' ккал')+kv('Суточный HEI','не финализирован')+kv('Позиций во вводе',String(Number(m.rationPositionCount||0)))+kv('Режим',pc && pc.mode==='professional'?'Профессиональный':'Простой')+'</div></header><section class="nr-executive-summary"><h2>Предварительный результат</h2><p class="nr-lead">'+esc(c.conclusion||'')+'</p><div class="nr-first-action"><div class="nr-first-action-head"><span>Следующий корректный шаг</span><strong>'+esc(c.firstAction&&c.firstAction.title||'завершить ввод')+'</strong></div><p>'+esc(c.firstAction&&c.firstAction.instruction||'Добавьте остальные продукты дня.')+'.</p></div><p class="nr-note">Этот отчёт нельзя интерпретировать как оценку полноценного суточного рациона. Любые HEI-, структурные и клинически смежные выводы намеренно скрыты.</p></section></section>';
    }
    var heiTotal=m.hei && Number.isFinite(Number(m.hei.total)) ? fmt(m.hei.total,1)+' / 100'+(m.hei.grade?' · '+m.hei.grade:'') : '—';
    var structure=p && Number.isFinite(Number(p.dailyStructure)) ? fmt(p.dailyStructure,0)+' / 100' : '—';
    var agreement=p && p.interpretation && Number.isFinite(Number(p.interpretation.axisAgreement)) ? fmt(p.interpretation.axisAgreement,0)+' / 100' : '—';
    var pq=m.provenanceQuality || {}, ps=pq.summary || {}, sq=m.sourceQuality || {};
    var quality=ps.total ? ((ps.high||0)+' высокой · '+(ps.medium||0)+' средней · '+(ps.low||0)+' низкой достоверности') : (sq.total ? ((sq.high||0)+' высокой · '+(sq.medium||0)+' средней · '+(sq.low||0)+' низкой достоверности') : 'нет данных');
    if(ps.assumed_zero_products) quality += ' · '+ps.assumed_zero_products+' с условными нулями';
    var keyUncertainty=[];
    [['kcal','Энергия','ккал'],['protein','Белок','г'],['fat','Жиры','г'],['carbs','Углеводы','г']].forEach(function(x){var n=pq.nutrients&&pq.nutrients[x[0]],u=n&&Number(n.uncertainty_abs);if(Number.isFinite(u)&&u>0)keyUncertainty.push(x[1]+' ±'+fmt(u,x[0]==='kcal'?0:1)+' '+x[2]);});
    var uncertaintyNote=keyUncertainty.length ? 'Оценочная неопределённость: '+keyUncertainty.join(' · ')+'.' : '';
    if(ps.assumed_zero_products) uncertaintyNote += (uncertaintyNote?' ':'')+'Условный ноль означает отсутствие надёжного значения, а не доказанное отсутствие нутриента.';
    var strengths=safeArray(c.strengths).slice(0,3).map(function(x){ return executiveItemHtml(x,'strength'); }).join('');
    var priorities=safeArray(c.priorities).slice(0,3).map(function(x,i){ return '<article class="nr-priority-card"><span>Направление '+(i+1)+'</span><strong>'+esc(x.title || '')+'</strong><p>'+esc(x.reason || '')+'</p><em>'+esc(x.action || '')+'</em></article>'; }).join('');
    var a=c.firstAction || {};
    return '<section class="nr-first-page">'+
      '<header class="nr-cover"><div class="nr-cover-heading"><div><div class="nr-kicker">Отчёт по рациону</div><h1>'+esc(m.title)+'</h1></div><p>Дата: '+esc(m.generatedAt)+'</p></div>'+
      '<div class="nr-cover-grid">'+kv('Пользователь',m.needs.person)+kv('Энергия рациона',fmt(m.totals.kcal,0)+' ккал')+kv('HEI-2020',heiTotal)+kv('Структура рациона',structure)+kv('Зона профиля',q && q.label ? q.label : '—')+kv('Согласованность осей',agreement)+kv('Качество продуктовых данных',quality)+kv('Позиций в рационе',String(Number(m.rationPositionCount || 0)))+'</div></header>'+
      '<section class="nr-executive-summary"><h2>Краткое заключение</h2><p class="nr-lead">'+esc(c.conclusion || '')+'</p><div class="nr-executive-columns"><div><h3>Что уже хорошо</h3><div class="nr-exec-list">'+strengths+'</div></div><div><h3>Три главных направления</h3><div class="nr-priority-list">'+priorities+'</div></div></div>'+
      '<article class="nr-first-action"><div class="nr-first-action-head"><span>Первое практическое действие</span><strong>'+esc((a.verb || 'проверить')+' · '+(a.title || 'рацион'))+'</strong></div><div class="nr-first-action-grid"><p><b>Что сделать.</b> '+esc(a.instruction || '')+'.</p><p><b>Почему.</b> '+esc(a.reason || '')+'</p><p><b>Ожидаемый эффект.</b> '+esc(a.effect || '')+'.</p><p><b>Как проверить.</b> '+esc(a.check || '')+'</p></div></article>'+
      '<div class="nr-confidence-split"><div><span>Согласованность аналитических осей</span><strong>'+esc(agreement)+'</strong><p>Показывает, насколько близкий сигнал дают HEI и структурная ось.</p></div><div><span>Качество продуктовых данных</span><strong>'+esc(quality)+'</strong><p>Показывает происхождение, точность и полноту карточек продуктов; этот показатель не является согласованностью осей.</p>'+(uncertaintyNote?'<p class="nr-note">'+esc(uncertaintyNote)+'</p>':'')+'</div></div>'+
      '</section></section>';
  }

  function needsHtml(m){
    var n = m.needs;
    return section('Расчётные потребности', '<div class="nr-grid-5">'+
      kv('Энергия', n.energy === '—' ? 'не рассчитана' : n.energy + ' ккал/сут')+kv('Белок', n.protein === '—' ? 'не рассчитан' : n.protein + ' г/сут')+kv('Жиры', n.fat === '—' ? 'не рассчитаны' : n.fat + ' г/сут')+kv('Углеводы', n.carbs === '—' ? 'не рассчитаны' : n.carbs + ' г/сут')+kv('Жидкость', n.fluid === '—' ? 'не рассчитана' : n.fluid + ' мл/сут')+
      '</div><p class="nr-note">Метод: '+esc(n.method)+'. '+(n.personalizationApplied ? 'Персональный профиль применён.' : 'Персональный профиль не применён; персональные выводы в отчёт не добавлены.')+'</p>', 'nr-needs');
  }


  function personalNutrientTone(level){
    level = String(level || '').toLowerCase();
    if (level.indexOf('сократ') >= 0) return 'сократить';
    if (level.indexOf('добр') >= 0) return 'добрать';
    return 'проверить';
  }
  function ensurePersonalNutrientScreenHost(){
    var host = $('personalNutrientActionsPanel');
    if (host) return host;
    var anchor = $('totalsGrid') || $('totalsSection');
    if (!anchor || !anchor.parentNode) return null;
    host = document.createElement('section');
    host.id = 'personalNutrientActionsPanel';
    host.className = 'personal-nutrient-actions-panel';
    if (anchor.id === 'totalsGrid') anchor.insertAdjacentElement('afterend', host);
    else anchor.appendChild(host);
    return host;
  }
  function personalNutrientScreenCard(x, idx){
    var tone = personalNutrientTone(x.level);
    return '<article class="personal-nutrient-action-card" data-level="'+esc(tone)+'">'+
      '<div class="personal-nutrient-action-head"><span>'+esc(idx === 0 ? 'главный шаг' : x.level)+'</span><strong>'+esc(x.title)+'</strong><em>'+esc(x.status)+'</em></div>'+ 
      '<div class="personal-nutrient-action-meta"><span>'+esc(x.profileLabel || 'профиль')+'</span><span>'+esc(x.state || '')+'</span><span>'+esc(x.gap || '')+'</span></div>'+ 
      '<p class="personal-nutrient-action-why"><b>Почему важно именно здесь:</b> '+esc(x.profileWhy || 'Нутриент входит в персональную проверку рациона.')+'</p>'+ 
      '<p><b>Что показывает рацион:</b> '+esc(x.sources)+'.</p>'+ 
      '<div class="personal-nutrient-action-do"><span>Что сделать</span><p>'+esc(x.action)+'</p></div>'+ 
      '<small>Покрытие данных: '+esc(x.coverage)+'. После изменения граммов пересчитайте рацион.</small>'+ 
    '</article>';
  }
  function personalNutrientScreenHtml(model){
    var p = model && model.personalNeeds;
    var actions = safeArray(model && model.personalNutrients).slice(0,6);
    if (!p || (!safeArray(p.priorities).length && !actions.length)) return '';
    var tags = [p.ageGroup && p.ageGroup.label, p.sexLabel, p.stateLabel, p.activityLabel, p.goalLabel].filter(Boolean).map(function(x){ return '<span>'+esc(x)+'</span>'; }).join('');
    var focus = safeArray(p.nutrientFocusKeys).slice(0,8).map(function(k){
      var ru = {kcal:'энергия',protein_g:'белок',fiber_g:'клетчатка',calcium_mg:'кальций',vitamin_d_mcg:'витамин D',iron_mg:'железо',vitamin_b12_mcg:'B12',sodium_mg:'натрий',added_sugars_g:'добавленные сахара',sfa_g:'насыщенные жиры',carbs_g:'углеводы',potassium_mg:'калий',magnesium_mg:'магний',vitamin_b9_mcg:'фолат',vitamin_c_mg:'витамин C'}[k] || nutrientRu(k);
      return '<span>'+esc(ru)+'</span>';
    }).join('');
    var priority = safeArray(p.priorities).slice(0,3).map(function(x){ return '<li><b>'+esc(x.title)+':</b> '+esc(x.action)+'</li>'; }).join('');
    var route = actions.slice(0,3).map(function(x, i){ return '<span><b>'+esc(i === 0 ? 'сначала' : (i === 1 ? 'затем' : 'потом'))+'</b> '+esc(x.title)+' · '+esc(x.level)+'</span>'; }).join('');
    var actionHtml = actions.map(personalNutrientScreenCard).join('');
    return '<div class="personal-nutrient-actions-inner">'+
      '<div class="personal-nutrient-actions-title"><div><span class="step-badge">персонально</span><h3>Персональные рекомендации по нутриентам</h3><p>Блок связывает ваши потребности с фактическими продуктами рациона: что добрать, что сократить и с какой позиции начать.</p></div></div>'+ 
      (route ? '<div class="personal-nutrient-route"><strong>Маршрут коррекции</strong><div>'+route+'</div></div>' : '')+
      '<div class="personal-nutrient-actions-tags">'+tags+'</div>'+ 
      '<div class="personal-nutrient-focus"><strong>Приоритетная проверка</strong><div>'+focus+'</div></div>'+ 
      personalTargetSummaryHtml(p, 'screen')+
      (priority ? '<details class="personal-nutrient-priority"><summary>Почему эти нутриенты выделены</summary><ul>'+priority+'</ul></details>' : '')+
      (actionHtml ? '<div class="personal-nutrient-action-grid">'+actionHtml+'</div>' : '<p class="muted">Когда в рационе появятся продукты и дневные нормы, здесь будут показаны персональные действия с продуктами и граммами.</p>')+
      (p.caution ? '<div class="personal-nutrient-caution">'+esc(p.caution)+'</div>' : '')+
    '</div>';
  }
  function renderPersonalNutrientScreen(options){
    options = options || {};
    var host = ensurePersonalNutrientScreenHost();
    if (!host) return false;
    try {
      var model = buildReportModel({ force: !!options.force });
      var html = personalNutrientScreenHtml(model);
      if (!html) { host.hidden = true; host.innerHTML = ''; return true; }
      host.hidden = false;
      host.innerHTML = html;
      return true;
    } catch(e) {
      try { console.warn('[NutritionReportV5] personal nutrient screen failed', e); } catch(_) {}
      return false;
    }
  }
  function schedulePersonalNutrientScreen(reason){
    if (personalPanelTimer) window.clearTimeout(personalPanelTimer);
    personalPanelTimer = window.setTimeout(function(){
      personalPanelTimer = null;
      renderPersonalNutrientScreen({ force:true, reason:reason || '' });
    }, 140);
  }

  function personalNeedsHtml(m){
    var p = m.personalNeeds;
    if (!p || !p.priorities || !p.priorities.length) return '';
    var cards = p.priorities.slice(0,6).map(function(x){
      return '<article class="nr-personal-card" data-level="'+esc(x.level)+'"><span>'+esc(x.level)+'</span><strong>'+esc(x.title)+'</strong><p>'+esc(x.why)+'</p><em>'+esc(x.action)+'</em></article>';
    }).join('');
    var tags = [p.ageGroup && p.ageGroup.label, p.sexLabel, p.stateLabel, p.activityLabel, p.goalLabel].filter(Boolean).map(function(x){ return '<span>'+esc(x)+'</span>'; }).join('');
    var nutrientRows = safeArray(m.personalNutrients).map(function(x){
      return '<article class="nr-nutrient-action" data-level="'+esc(x.level)+'"><div><span>'+esc(x.level)+'</span><strong>'+esc(x.title)+'</strong><em>'+esc(x.status)+'</em></div><p><b>Профильный смысл:</b> '+esc(x.profileWhy || x.profileLabel || 'персональная проверка')+'</p><p><b>Продукты сейчас:</b> '+esc(x.sources)+'.</p><p><b>Что сделать:</b> '+esc(x.action)+'</p><small>'+esc(x.state || '')+' · '+esc(x.gap || '')+' · покрытие данных: '+esc(x.coverage)+'</small></article>';
    }).join('');
    var body = '<p class="nr-note">Этот раздел связывает расчёт потребностей с фактическим рационом: возраст, пол, активность, цель и профиль состояния задают, какие нутриенты требуют приоритетной проверки.</p><div class="nr-personal-tags">'+tags+'</div>'+personalTargetSummaryHtml(p, 'report')+'<div class="nr-personal-grid">'+cards+'</div>';
    if (p.caution) body += '<div class="nr-personal-caution">'+esc(p.caution)+'</div>';
    body += '<h3>Персональные рекомендации по нутриентам</h3>'+(nutrientRows ? '<div class="nr-nutrient-actions">'+nutrientRows+'</div>' : '<p class="nr-note">После расчёта рациона здесь появятся нутриентные действия с продуктами и граммами.</p>');
    return section('Персональный профиль потребностей', body, 'nr-personal-needs');
  }
  function macrosHtml(m){ return section('Макронутриенты и ключевые показатели', nutrientTable(m.macros, 'nr-macro-table'), 'nr-macros'); }
  function microsHtml(m){
    return section('Микронутриенты', '<h3>Витамины</h3>'+nutrientTable(m.vitamins, 'nr-vitamin-table')+'<h3>Минералы</h3>'+nutrientTable(m.minerals, 'nr-mineral-table')+'<p class="nr-note">Покрытие показывает, у какой доли продуктов в рационе заполнено соответствующее поле базы.</p>', 'nr-micros');
  }

  function detailHasRole(it, role){ return it && Array.isArray(it.roles) && it.roles.indexOf(role) >= 0; }
  function itemUnit(it){ return detailHasRole(it,'waterPlain') || detailHasRole(it,'unsweetenedBeverage') || detailHasRole(it,'dairyDrink') || detailHasRole(it,'juice') || detailHasRole(it,'sweetDrink') ? 'мл' : 'г'; }
  function detailLine(it){ return esc(it.name || it.key || 'продукт') + ' ' + fmt(it.grams,0) + ' ' + itemUnit(it); }
  function harvardDiagramSvg(hp){
    if (!hp || !hp.ready || hp.empty || !hp.stage) return '';
    var y = 18, rows = SECTORS.map(function(id){
      var s = hp.stage.sectors[id] || {};
      var actual = Number(s.actualPercent || 0);
      var target = TARGETS[id];
      var fillW = Math.max(0, Math.min(220, actual / Math.max(target, actual, 1) * 220));
      var targetX = Math.max(0, Math.min(220, target / Math.max(target, actual, 1) * 220));
      var color = COLORS[id];
      var row = '<g transform="translate(0 '+y+')"><text x="0" y="11" font-size="12" font-weight="700" fill="#172033">'+esc(SECTOR_RU[id])+'</text>'+ 
        '<rect x="108" y="0" width="220" height="14" rx="7" fill="#e8eef6"/>'+ 
        '<rect x="108" y="0" width="'+fmt(fillW,1)+'" height="14" rx="7" fill="'+color+'" opacity="0.9"/>'+ 
        '<line x1="'+fmt(108+targetX,1)+'" y1="-3" x2="'+fmt(108+targetX,1)+'" y2="18" stroke="#111827" stroke-width="1.5" opacity="0.7"/>'+ 
        '<text x="338" y="11" font-size="11" fill="#475569">'+fmt(s.grams,0)+' г · '+fmt(actual,1)+'% / цель '+target+'%</text></g>';
      y += 28;
      return row;
    }).join('');
    return '<svg class="nr-harvard-svg" viewBox="0 0 470 138" role="img" aria-label="Диаграмма Гарвардской тарелки: факт и целевая доля по секторам" xmlns="http://www.w3.org/2000/svg">'+
      '<rect x="0" y="0" width="470" height="138" rx="14" fill="#fbfdff" stroke="#dbe7f3"/>'+rows+
      '<text x="108" y="132" font-size="10" fill="#64748b">цвет — фактическая доля, чёрная риска — целевая доля</text></svg>';
  }
  function dietProfileHtml(m){
    var dp = m && m.dietProfile;
    if (dp && dp.ready && dp.html) return dp.html;
    return section('Профиль анализа рациона: качество × структура', '<p class="nr-note">'+esc((dp && dp.message) || 'Профиль анализа пока не рассчитан.')+'</p>', 'nr-diet-profile');
  }

  function harvardHtml(m){
    var hp = m.harvard;
    if (!hp || !hp.ready) return section('Гарвардская тарелка', '<p class="nr-note">'+esc((hp && hp.message) || 'Модуль Гарвардской тарелки не загружен.')+'</p>', 'nr-harvard');
    if (hp.empty || hp.coreMass <= 0) return section('Гарвардская тарелка', '<p class="nr-note">В рационе пока нет продуктов для основной тарелки.</p>', 'nr-harvard');
    var sectorRows = SECTORS.map(function(id){
      var s = hp.stage.sectors[id] || {};
      var adj = s.adjustment && s.adjustment.message ? s.adjustment.message : '';
      return '<tr><td>'+esc(SECTOR_RU[id])+'</td><td>'+fmt(s.grams,0)+' г</td><td>'+fmt(s.actualPercent,1)+'%</td><td>'+TARGETS[id]+'%</td><td>'+fmt(s.fillPercent,0)+'%</td><td>'+esc(adj || 'доля близка к ориентиру')+'</td></tr>';
    });
    var stage = hp.stage || {}, c = stage.companions || {}, grams = stage.grams || {};
    var water = c.water || {}, fats = c.healthyFats || {};
    var separate = '<div class="nr-inline-cards">'+
      kv('Источники полезных жиров', fmt(fats.sourceGrams || fats.grams || 0,0)+' г продуктов')+
      kv('Вода и несладкие напитки', fmt(water.ml || grams.waterMl || 0,0)+' мл')+
      kv('Молочные продукты', fmt(grams.dairyG || 0,0)+' г')+
      kv('Соки и сладкие напитки', fmt((water.juiceMl||0)+(water.sweetDrinkMl||0),0)+' мл')+
    '</div>';
    var details = hp.built && hp.built.details ? hp.built.details : [];
    function listFor(title, pred){
      var items = details.filter(pred).slice(0, 10);
      return '<div class="nr-list-block"><strong>'+esc(title)+'</strong>' + (items.length ? '<p>'+items.map(detailLine).join('; ')+'</p>' : '<p class="nr-muted">не добавлены</p>') + '</div>';
    }
    var detailHtml = '<div class="nr-hp-details">'+
      listFor('Овощи', function(it){ return it.group === 'vegetables'; })+
      listFor('Фрукты', function(it){ return it.group === 'fruits'; })+
      listFor('Цельные злаки', function(it){ return it.group === 'wholeGrains'; })+
      listFor('Белковые продукты', function(it){ return it.group === 'protein'; })+
      listFor('Учитывается отдельно', function(it){ return !it.group; })+
    '</div>';
    var flags = safeArray(stage.qualityFlags).slice(0,7).map(function(f){ return '<li>'+esc(f.message || '')+'</li>'; }).join('');
    var flagHtml = flags ? '<div class="nr-quality"><strong>Качественные замечания</strong><ul>'+flags+'</ul></div>' : '';
    return section('Гарвардская тарелка', '<p class="nr-note">Основная тарелка: <strong>'+fmt(hp.coreMass,0)+' г</strong>. Расчёт показывает граммы и доли четырёх основных групп продуктов.</p>'+harvardDiagramSvg(hp)+table(['Сектор','Факт','Доля','Цель','Заполнение цели','Комментарий'], sectorRows, 'nr-harvard-table')+separate+detailHtml+flagHtml, 'nr-harvard');
  }
  function dietAssessmentReportHtml(m){
    var a=m && (m.dietAssessment || (m.hei && m.hei.assessment));
    if(!a)return '';
    var flags=safeArray(a.upperLimitFlags).concat(safeArray(a.guidelineFlags));
    var limitations=safeArray(a.limitations && a.limitations.length ? a.limitations : a.notEvaluable);
    var body='';
    if(flags.length)body+='<div class="nr-quality"><strong>Отдельные отклонения, не отменяемые общим HEI</strong><ul>'+flags.slice(0,5).map(function(f){return '<li>'+esc(f.title||f.id||'Показатель')+': '+fmt(f.value,1)+' '+esc(f.unit||'')+' при ориентире '+fmt(f.threshold,1)+' '+esc(f.unit||'')+'.</li>';}).join('')+'</ul>'+(flags.length>5?'<p class="nr-note">Ещё отклонений: '+(flags.length-5)+'.</p>':'')+'</div>';
    else body+='<p class="nr-note">Подтверждённых превышений по доступным данным не выявлено.</p>';
    if(limitations.length)body+='<p class="nr-note"><strong>Ограничения данных: '+limitations.length+'.</strong> '+limitations.slice(0,3).map(function(f){return esc(f.title||f.id||'Показатель');}).join('; ')+(limitations.length>3?' и ещё '+(limitations.length-3):'')+'. Они не трактуются как подтверждённые превышения.</p>';
    return body;
  }
  function heiHtml(m){
    var hei = m.hei;
    if (!hei || !Number.isFinite(Number(hei.total))) return section('HEI-2020', '<p class="nr-note">Индекс HEI пока не рассчитан.</p>', 'nr-hei');
    var rows = safeArray(hei.rows).slice().sort(function(a,b){ return Number(a.points || 0) - Number(b.points || 0); }).map(function(r){ return '<tr><td>'+esc(r.title || r.key || '')+'</td><td>'+esc(r.value || '')+'</td><td>'+esc(r.norm || '')+'</td><td>'+esc(r.delta || '')+'</td><td>'+fmt(r.points,1)+'</td></tr>'; });
    return section('HEI-2020', '<div class="nr-score"><strong>'+fmt(hei.total,1)+' / 100'+(hei.grade?' · '+esc(hei.grade):'')+'</strong><span>'+esc(hei.summary || 'Оценка соответствия структуре HEI; отдельные ограничения проверяются независимо.')+'</span></div>'+dietAssessmentReportHtml(m)+table(['Компонент','Факт','Ориентир','Комментарий','Баллы'], rows, 'nr-hei-table'), 'nr-hei');
  }
  function rationHtml(m){
    var sourceRows = safeArray(m.displayRationRows && m.displayRationRows.length ? m.displayRationRows : m.rationRows);
    var rootIndex = 0;
    var rows = sourceRows.map(function(r){
      var isRoot = r.kind === 'composite_root';
      var isChild = r.kind === 'composite_child';
      if (!isChild) rootIndex += 1;
      var number = isChild ? '' : String(rootIndex);
      var label = (isChild ? '↳ ' : '') + esc(r.name);
      if (isRoot) label = '<strong>'+label+'</strong><br><small>'+esc(r.note || 'Этикеточные КБЖУ; расчёт качества — по составу.')+'</small>';
      else if (isChild) label = '<span style="padding-left:14px">'+label+'</span><br><small style="padding-left:14px">'+esc(r.note || 'ингредиент')+'</small>';
      return '<tr class="'+(isRoot?'nr-composite-root':(isChild?'nr-composite-child':''))+'"><td>'+number+'</td><td>'+label+'</td><td>'+fmt(r.grams,1)+' г</td><td>'+fmt(r.nutrients.kcal,0)+' ккал</td><td>Б '+fmt(r.nutrients.protein_g,1)+' г · Ж '+fmt(r.nutrients.fat_g,1)+' г · У '+fmt(r.nutrients.carbs_g,1)+' г</td></tr>';
    });
    return section('Итоговый рацион', table(['#','Продукт и состав','Количество','Энергия','КБЖУ'], rows, 'nr-ration-table'), 'nr-ration');
  }
  function dataQualityHtml(m){
    var rows = safeArray(m.dataQuality).map(function(r){
      var rel = r.reliability || {};
      var source = rel.total ? ('точные: '+(rel.high||0)+', proxy/label: '+(rel.medium||0)+', проверить: '+(rel.low||0)+', неизвестно: '+(rel.unknown||0)) : 'нет продуктов';
      return '<tr><td>'+esc(r.label)+'</td><td>'+r.count+' / '+r.total+'</td><td>'+fmt(r.pct,0)+'%</td><td>'+esc(source)+'</td><td>'+esc(r.note || '')+'</td></tr>';
    });
    return section('Качество данных', table(['Блок','Продуктов с данными','Покрытие','Надёжность источников','Комментарий'], rows)+'<p class="nr-note">Покрытие показывает заполненность карточек. Надёжность источников учитывает статус верификации, полноту нутриентов и точность источника: exact/source, proxy/label/model или требуется проверка.</p>', 'nr-data-quality');
  }
  function formulaAuditHtml(m){
    var audit=m && m.formulaAudit || {}, registry=window.NutritionFormulaRegistryP14 || null, scopes=[['Потребности',audit.needs],['Рацион',audit.ration],['HEI-2020',audit.hei]], byId={};
    scopes.forEach(function(pair){
      safeArray(pair[1] && pair[1].formulaIds).forEach(function(id){
        if(!byId[id]) byId[id]={id:id,scopes:[]};
        if(byId[id].scopes.indexOf(pair[0])<0) byId[id].scopes.push(pair[0]);
      });
    });
    var kindRu={AUTHORITATIVE:'внешняя методика',LOCAL_POLICY:'локальная политика',DECISION_RULE:'правило решения',DERIVED:'производный расчёт',ARITHMETIC:'арифметика'};
    var rows=Object.keys(byId).sort().map(function(id){
      var f=registry && typeof registry.get==='function' ? registry.get(id) : null;
      return '<tr><td>'+esc((f && f.title_ru) || id)+'</td><td><code>'+esc(id)+'</code></td><td>'+esc(kindRu[f && f.kind] || (f && f.kind) || 'не классифицировано')+'</td><td>'+esc(byId[id].scopes.join(', '))+'</td><td>'+esc(safeArray(f && f.source_ids).join(', ') || '—')+'</td></tr>';
    });
    var version=audit.registryVersion || (registry && registry.version) || 'не загружен';
    var note=rows.length ? 'В таблице перечислены формулы, реально участвовавшие в текущем отчёте.' : 'Расчётные действия ещё не выполнены; применённые формулы появятся после расчёта.';
    return section('Трассировка расчётных формул', '<p>Версия реестра: <strong>'+esc(version)+'</strong>. '+esc(note)+'</p>'+table(['Формула','ID','Класс','Участок отчёта','Источники'],rows,'nr-formula-audit-table')+'<p class="nr-note">Локальная политика калькулятора отделена от внешних методик и не должна интерпретироваться как универсальная клиническая норма.</p>', 'nr-formula-audit');
  }
  function validationEvidenceHtml(m){
    var v=m && m.validationEvidence || {}, status=v.stageStatus || 'EXTERNAL_VALIDATION_PENDING';
    var label=v.labelRu || 'Внешняя клиническая и предметная валидация ожидается';
    return section('Статус внешней проверки', '<p><strong>'+esc(label)+'</strong>.</p><p>Нормативы, происхождение данных, формулы, безопасность и интерфейс прошли внутренние автоматизированные проверки. Эти проверки не заменяют независимую клиническую и предметную валидацию или модерируемый пилот.</p><p class="nr-note">Статус: <code>'+esc(status)+'</code>. Утверждение «клинически валидирован» для этой версии не разрешено.</p>', 'nr-validation-evidence');
  }
  function methodNoteHtml(){
    return section('Методическое примечание', '<p>Расчёты являются ориентировочной моделью планирования рациона. Клиническая интерпретация требует учёта диагноза, лабораторных данных, терапии и назначения специалиста.</p>', 'nr-method-note');
  }

  function inputDataHtml(m){
    var rows=safeArray(m.needs && m.needs.inputs).map(function(x){ return '<tr><td>'+esc(x.label)+'</td><td>'+esc(x.value || 'не указано')+'</td></tr>'; });
    var status=m.needs && m.needs.personalizationApplied ? 'Персональный профиль применён к нормам и рекомендациям.' : 'Персональный профиль не применён; отчёт содержит только выводы, допустимые без персонализации.';
    return section('Исходные данные и применённые настройки',table(['Параметр','Значение'],rows,'nr-input-table')+'<p class="nr-note">'+esc(status)+'</p>','nr-inputs');
  }
  function matrixSvgFromProfile(m){
    var dp=profileReportModel(m), p=dp && dp.profile, q=dp && dp.quadrant;
    var hei=Math.max(0,Math.min(100,Number(p && p.hei))), structure=Math.max(0,Math.min(100,Number(p && p.dailyStructure)));
    if (!Number.isFinite(hei) || !Number.isFinite(structure)) return '';
    var x0=58, y0=31, w=312, h=228, threshold=70;
    var tx=x0+w*threshold/100, ty=y0+h*(1-threshold/100);
    var px=x0+w*structure/100, py=y0+h*(1-hei/100);
    var pointLabel=fmt(hei,0)+' / '+fmt(structure,0);
    var zone=(q && q.label) || (hei>=threshold && structure>=threshold ? 'Сильный профиль' : (hei>=threshold ? 'Структура требует внимания' : (structure>=threshold ? 'Качество требует внимания' : 'Обе оси требуют внимания')));
    var labelRight=px<286, lx=labelRight?px+13:px-13, anchor=labelRight?'start':'end';
    return '<svg class="nr-static-matrix nr-diet-matrix-svg" data-export-component="static-matrix-v3" data-hei="'+fmt(hei,2)+'" data-structure="'+fmt(structure,2)+'" viewBox="0 0 430 330" role="img" aria-label="Интегративная матрица: HEI '+fmt(hei,0)+' из 100, структура '+fmt(structure,0)+' из 100, зона '+esc(zone)+'" xmlns="http://www.w3.org/2000/svg">'+
      '<rect class="nr-matrix-frame" x="0.75" y="0.75" width="428.5" height="328.5" rx="14" fill="#ffffff" stroke="#d7e5f2" stroke-width="1.5"/>'+
      '<text class="nr-matrix-zone-title" x="58" y="20" font-size="11" font-weight="700" fill="#334155">Зона: '+esc(zone)+'</text>'+
      '<rect class="nr-matrix-zone nr-matrix-zone-both" x="'+x0+'" y="'+ty+'" width="'+fmt(tx-x0,2)+'" height="'+fmt(y0+h-ty,2)+'" fill="#fff7ed"/>'+
      '<rect class="nr-matrix-zone nr-matrix-zone-structure" x="'+x0+'" y="'+y0+'" width="'+fmt(tx-x0,2)+'" height="'+fmt(ty-y0,2)+'" fill="#fffbeb"/>'+
      '<rect class="nr-matrix-zone nr-matrix-zone-quality" x="'+fmt(tx,2)+'" y="'+ty+'" width="'+fmt(x0+w-tx,2)+'" height="'+fmt(y0+h-ty,2)+'" fill="#eff6ff"/>'+
      '<rect class="nr-matrix-zone nr-matrix-zone-strong" x="'+fmt(tx,2)+'" y="'+y0+'" width="'+fmt(x0+w-tx,2)+'" height="'+fmt(ty-y0,2)+'" fill="#ecfdf5"/>'+
      '<g class="nr-matrix-grid" stroke="#d7e5f2" stroke-width="1">'+
        '<line x1="'+x0+'" y1="'+fmt(y0+h*.5,2)+'" x2="'+(x0+w)+'" y2="'+fmt(y0+h*.5,2)+'"/>'+
        '<line x1="'+fmt(x0+w*.5,2)+'" y1="'+y0+'" x2="'+fmt(x0+w*.5,2)+'" y2="'+(y0+h)+'"/>'+
      '</g>'+
      '<rect class="nr-matrix-plot-border" x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+h+'" fill="none" stroke="#94a3b8" stroke-width="1.2"/>'+
      '<g class="nr-matrix-threshold" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="5 4">'+
        '<line x1="'+fmt(tx,2)+'" y1="'+y0+'" x2="'+fmt(tx,2)+'" y2="'+(y0+h)+'"/>'+
        '<line x1="'+x0+'" y1="'+fmt(ty,2)+'" x2="'+(x0+w)+'" y2="'+fmt(ty,2)+'"/>'+
      '</g>'+
      '<g class="nr-matrix-axis-labels" font-size="10.5" fill="#475569">'+
        '<text x="'+x0+'" y="278" text-anchor="middle">0</text><text x="'+fmt(tx,2)+'" y="278" text-anchor="middle">70+</text><text x="'+(x0+w)+'" y="278" text-anchor="middle">100</text>'+
        '<text x="45" y="'+(y0+h+3)+'" text-anchor="end">0</text><text x="45" y="'+fmt(ty+3,2)+'" text-anchor="end">70+</text><text x="45" y="'+(y0+3)+'" text-anchor="end">100</text>'+
        '<text x="214" y="303" text-anchor="middle" font-size="12" font-weight="700">Структура рациона</text>'+
        '<text x="17" y="145" text-anchor="middle" font-size="12" font-weight="700" transform="rotate(-90 17 145)">HEI-2020</text>'+
      '</g>'+
      '<circle class="nr-matrix-halo" cx="'+fmt(px,2)+'" cy="'+fmt(py,2)+'" r="13" fill="#60a5fa" fill-opacity="0.28"/>'+
      '<circle class="nr-matrix-point" cx="'+fmt(px,2)+'" cy="'+fmt(py,2)+'" r="5.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="2"/>'+
      '<g class="nr-matrix-point-label"><rect class="nr-matrix-label-bg" x="'+fmt(labelRight?lx-4:lx-54,2)+'" y="'+fmt(Math.max(34,py-20),2)+'" width="58" height="17" rx="5" fill="#ffffff" stroke="#93c5fd"/><text x="'+fmt(lx,2)+'" y="'+fmt(Math.max(46,py-8),2)+'" text-anchor="'+anchor+'" font-size="10.5" font-weight="800" fill="#1e3a8a">'+pointLabel+'</text></g>'+
      '<g class="nr-matrix-legend" font-size="9.5" fill="#475569"><text x="58" y="321">Порог рабочей зоны по каждой оси — 70 баллов.</text></g>'+
    '</svg>';
  }
  function dietProfileOverviewHtml(m){
    var dp=profileReportModel(m), p=dp && dp.profile, n=dp && dp.narrative, q=dp && dp.quadrant;
    if (!p || !Number.isFinite(Number(p.hei)) || !Number.isFinite(Number(p.dailyStructure))) return section('Интегративный профиль HEI × структура','<p class="nr-note">Профиль появится после расчёта HEI и структурной оси.</p>','nr-diet-overview');
    var svg=matrixSvgFromProfile(m);
    return section('Интегративный профиль HEI × структура','<div class="nr-analysis-hero">'+(svg ? '<div class="nr-matrix-once">'+svg+'</div>' : '')+'<div><div class="nr-inline-cards">'+kv('HEI',fmt(p.hei,0)+'/100')+kv('Структура',fmt(p.dailyStructure,0)+'/100')+kv('Зона',q && q.label ? q.label : '—')+kv('Согласованность осей',p.interpretation && Number.isFinite(Number(p.interpretation.axisAgreement)) ? fmt(p.interpretation.axisAgreement,0)+'/100' : '—')+'</div><p>'+esc(n && n.summary || '')+'</p><p class="nr-note">Согласованность осей описывает близость двух аналитических сигналов. Точность продуктовых карточек оценивается отдельно.</p></div></div>','nr-diet-overview');
  }
  function heiOverviewHtml(m){
    var hei=m.hei;
    if (!hei || !Number.isFinite(Number(hei.total))) return section('Качество рациона по HEI-2020','<p class="nr-note">HEI пока не рассчитан.</p>','nr-hei-overview');
    var rows=safeArray(hei.rows).map(function(r){ var max=heiMaxForKey(r.key), pts=Number(r.points), ratio=max ? pts/max : 1; return {r:r,max:max,ratio:ratio}; }).filter(function(x){ return Number.isFinite(x.ratio) && x.ratio<0.9; }).sort(function(a,b){return a.ratio-b.ratio;}).slice(0,3).map(function(x){ return '<tr><td>'+esc(x.r.title || nutrientRu(x.r.key))+'</td><td>'+fmt(x.r.points,1)+' / '+fmt(x.max,0)+'</td><td>'+esc(x.r.value || '')+'</td><td>'+esc(briefHeiAction(x.r))+'</td></tr>'; });
    return section('Соответствие рациона HEI-2020','<div class="nr-score"><strong>'+fmt(hei.total,1)+' / 100'+(hei.grade?' · '+esc(hei.grade):'')+'</strong><span>Общая сумма описывает структуру HEI и не отменяет отдельных превышений, показанных ниже.</span></div>'+dietAssessmentReportHtml(m)+table(['Компонент','Баллы','Сейчас','Практический смысл'],rows,'nr-hei-brief'),'nr-hei-overview');
  }
  function harvardOverviewHtml(m){
    var hp=m.harvard;
    if (!hp || !hp.ready || hp.empty || !(Number(hp.coreMass)>0)) return section('Строгая Гарвардская тарелка','<p class="nr-note">Недостаточно продуктов для оценки основной тарелки.</p>','nr-harvard-overview');
    var rows=SECTORS.map(function(id){ var x=hp.stage && hp.stage.sectors && hp.stage.sectors[id] || {}; return '<tr><td>'+esc(SECTOR_RU[id])+'</td><td>'+fmt(x.grams,0)+' г</td><td>'+fmt(x.actualPercent,1)+'%</td><td>'+TARGETS[id]+'%</td></tr>'; });
    return section('Строгая Гарвардская тарелка','<p>Основная тарелка: <strong>'+fmt(hp.coreMass,0)+' г</strong>. Итог соответствия: <strong>'+fmt(hp.score,0)+'%</strong>. Этот блок является дополнительной структурной моделью и не заменяет HEI.</p>'+table(['Группа','Масса','Фактическая доля','Ориентир'],rows,'nr-harvard-brief'),'nr-harvard-overview');
  }
  function personalProfileOverviewHtml(m){
    var p=m.personalNeeds;
    if (!p) return section('Персонализация потребностей','<p class="nr-note">Персональный профиль не применён. Возрастные, половые и клинические выводы не формировались.</p>','nr-personal-overview');
    var tags=[p.ageGroup && p.ageGroup.label,p.sexLabel,p.stateLabel,p.activityLabel,p.goalLabel].filter(Boolean).map(function(x){return '<span>'+esc(x)+'</span>';}).join('');
    var actions=safeArray(m.personalNutrients).slice(0,3).map(function(x){ return '<li><b>'+esc(x.title)+':</b> '+esc(x.action)+'</li>'; }).join('');
    return section('Персонализация потребностей','<div class="nr-personal-tags">'+tags+'</div><p>Персональные ориентиры применены к дневным нормам и приоритетам.</p>'+(actions?'<ul>'+actions+'</ul>':'<p class="nr-note">Отдельных персональных действий сверх общего плана не требуется.</p>'),'nr-personal-overview');
  }
  function dietProfileAppendixHtml(m){
    var dp=profileReportModel(m), p=dp && dp.profile;
    if (!p || !p.domains) return '';
    var labels={plantBase:'Растительная основа',wholeGrainStarch:'Цельные злаки и крахмалистая часть',proteinAdequacy:'Белковое обеспечение',dairyCalcium:'Молочно-кальциевый вклад',outsideSafety:'Продукты вне основной структуры',balanceDisplacement:'Структурный баланс'};
    var rows=Object.keys(labels).map(function(k){ var v=Number(p.domains[k]); return '<tr><td>'+esc(labels[k])+'</td><td>'+fmt(v,1)+'/100</td><td>'+(v<70?'требует коррекции':(v<85?'рабочая зона':'сильная сторона'))+'</td></tr>'; });
    return section('Приложение 3. Домены структурной оси',table(['Домен','Значение','Интерпретация'],rows,'nr-domain-table')+'<p class="nr-note">Доменные значения объясняют структурную координату. Они не являются самостоятельными клиническими диагнозами.</p>','nr-appendix-domain');
  }
  function appendixHtml(m){
    return '<section class="nr-appendix-start"><h2>Приложения</h2><p>Ниже приведены исходный рацион, полные таблицы показателей и методические сведения, на которых основано краткое заключение.</p></section>'+
      rationHtml(m)+needsHtml(m)+section('Приложение 1. Полная таблица HEI-2020',m.hei && Number.isFinite(Number(m.hei.total)) ? table(['Компонент','Факт','Ориентир','Комментарий','Баллы'],safeArray(m.hei.rows).map(function(r){return '<tr><td>'+esc(r.title||r.key||'')+'</td><td>'+esc(r.value||'')+'</td><td>'+esc(r.norm||'')+'</td><td>'+esc(r.delta||'')+'</td><td>'+fmt(r.points,1)+'</td></tr>';}),'nr-hei-table') : '<p class="nr-note">HEI не рассчитан.</p>','nr-appendix-hei')+
      harvardHtml(m)+dietProfileAppendixHtml(m)+macrosHtml(m)+microsHtml(m)+dataQualityHtml(m)+formulaAuditHtml(m)+validationEvidenceHtml(m)+methodNoteHtml();
  }
  function patientReportPass3Styles(){ return '<style>'+ 
    '.nr-first-page{break-after:page;page-break-after:always}.nr-cover-heading{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.nr-cover-heading p{margin:2px 0 0;white-space:nowrap}.nr-executive-summary{border:1px solid #d7e5f2;border-radius:13px;padding:9px;background:#fff}.nr-lead{font-size:12.5px;margin:.2em 0 .55em}.nr-executive-columns{display:grid;grid-template-columns:1fr 1fr;gap:7px}.nr-executive-columns h3{margin:5px 0 4px}.nr-exec-list,.nr-priority-list{display:grid;gap:4px}.nr-exec-item,.nr-priority-card{border:1px solid #dbe7f3;border-radius:8px;padding:5px 6px;break-inside:avoid}.nr-exec-item span,.nr-priority-card span,.nr-first-action-head span,.nr-confidence-split span{display:block;font-size:8.7px;text-transform:uppercase;letter-spacing:.045em;color:#386fa4;font-weight:800}.nr-exec-item strong,.nr-priority-card strong{font-size:11.2px}.nr-exec-item p,.nr-priority-card p,.nr-priority-card em{display:block;margin:.16em 0;color:#475569;font-style:normal;font-size:9.7px;line-height:1.25}.nr-first-action{margin-top:6px;border:2px solid #2563eb;border-radius:10px;padding:7px 8px;background:#f8fbff;break-inside:avoid}.nr-first-action-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.nr-first-action-head strong{display:block;font-size:12.5px}.nr-first-action-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 9px;font-size:10px;line-height:1.27}.nr-first-action-grid p{margin:.16em 0}.nr-confidence-split{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}.nr-confidence-split>div{border:1px solid #dbe7f3;border-radius:8px;padding:5px 6px}.nr-confidence-split strong{display:block;margin:1px 0;font-size:10.5px}.nr-confidence-split p{margin:.12em 0;color:#475569;font-size:9px;line-height:1.22}.nr-analysis-hero{display:grid;grid-template-columns:285px 1fr;gap:12px;align-items:start}.nr-matrix-once svg{width:100%;height:auto;display:block}.nr-static-matrix{overflow:visible}.nr-appendix-start{border-top:3px solid #172033;padding-top:10px;margin-top:14px}.nr-input-table td:first-child{width:38%;font-weight:700}.nr-appendix-hei{break-before:auto;page-break-before:auto}.nr-section>h2,.nr-section>h3{break-after:avoid-page;page-break-after:avoid}.nr-table thead{display:table-header-group}.nr-table tr{break-inside:avoid;page-break-inside:avoid}.nr-ration-table tr{break-inside:auto;page-break-inside:auto}.nr-method-note{break-inside:avoid}.nr-report-meta,.nr-cache-note{display:none!important}'+
    '@media(max-width:720px){.nr-cover-heading{display:block}.nr-executive-columns,.nr-first-action-grid,.nr-confidence-split,.nr-analysis-hero{grid-template-columns:1fr}}'+
    '@media print{body{font-size:11.6px;line-height:1.34}.nr-report{padding:0}.nr-first-page{font-size:10.4px;line-height:1.28;break-after:page}.nr-first-page .nr-cover{padding:9px;margin-bottom:6px}.nr-first-page .nr-cover-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.nr-first-page .nr-kv{padding:4px 5px;border-radius:7px}.nr-first-page .nr-kv span{font-size:8.5px}.nr-first-page .nr-kv strong{font-size:9.8px;margin-top:1px}.nr-first-page h1{font-size:20px}.nr-first-page h2{font-size:14px;margin-bottom:4px}.nr-first-page h3{font-size:11.5px}.nr-appendix-start{break-before:auto;page-break-before:auto}.nr-appendix-hei{break-before:auto;page-break-before:auto}.nr-section{margin:7px 0;padding:9px}.nr-table th,.nr-table td{padding:4px 5px}.nr-inputs,.nr-personal-overview,.nr-diet-overview{break-inside:avoid;page-break-inside:avoid}.nr-analysis-hero{grid-template-columns:270px 1fr}.nr-harvard-overview{break-inside:avoid}.nr-hei-overview{break-inside:avoid}.nr-macro-table,.nr-vitamin-table,.nr-mineral-table,.nr-data-quality .nr-table{font-size:10px;line-height:1.2}.nr-macro-table th,.nr-macro-table td,.nr-vitamin-table th,.nr-vitamin-table td,.nr-mineral-table th,.nr-mineral-table td,.nr-data-quality .nr-table th,.nr-data-quality .nr-table td{padding:3px 4px}}'+
    '</style>'; }
  function reportStyles(){
    return '<style>'+ 
      '@page{size:A4;margin:10mm;}*{box-sizing:border-box}body{margin:0;background:#fff;color:#172033;font:12px/1.38 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.nr-report{max-width:980px;margin:0 auto;padding:12px}.nr-cover{border:1px solid #cfe1f2;border-radius:15px;padding:12px;margin-bottom:8px;background:#f7fbff}.nr-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#386fa4;font-weight:800}h1{margin:.08em 0 .18em;font-size:22px}h2{margin:0 0 7px;font-size:15px;color:#172033}h3{font-size:13px;margin:12px 0 5px}.nr-section{break-inside:auto;page-break-inside:auto;border:1px solid #d7e5f2;border-radius:13px;padding:12px;margin:10px 0;background:#fff}.nr-cover-grid,.nr-grid-5,.nr-inline-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.nr-grid-5{grid-template-columns:repeat(5,minmax(0,1fr))}.nr-kv{border:1px solid #e0ebf5;border-radius:9px;padding:7px;background:#fbfdff}.nr-kv span{display:block;font-size:10.5px;color:#64748b}.nr-kv strong{display:block;margin-top:2px}.nr-table{width:100%;border-collapse:collapse;margin-top:7px}.nr-table th,.nr-table td{border:1px solid #dce8f3;padding:5px 6px;vertical-align:top}.nr-table th{background:#eef6ff;text-align:left;font-size:11px}.nr-note,.nr-muted{color:#64748b}.nr-score{display:flex;gap:10px;align-items:flex-start;border:1px solid #dce8f3;border-radius:11px;padding:9px;background:#fbfdff}.nr-score strong{font-size:21px;white-space:nowrap}.nr-harvard-svg{width:100%;height:auto;margin:6px 0 4px}.nr-hp-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.nr-list-block{border:1px solid #e0ebf5;border-radius:9px;padding:7px}.nr-list-block p{margin:.25em 0 0;color:#475569}.nr-quality{margin-top:9px;border-left:4px solid #f59e0b;padding:7px 9px;background:#fffbeb}.nr-quality ul{margin:.35em 0 0;padding-left:18px}.nr-method-note{background:#fbfbfb}.nr-report-meta{font-size:10.5px;color:#64748b;text-align:right;margin-top:12px}.nr-cache-note{font-size:10.5px;color:#64748b;text-align:right}.nr-cover,.nr-kv,.nr-cover-action{break-inside:avoid;page-break-inside:avoid}.nr-cover-action{margin-top:8px;border:1px solid #cbdff4;border-radius:10px;background:#fff;padding:8px}.nr-cover-action span{display:block;font-size:10.5px;color:#64748b}.nr-cover-action strong{display:block;margin-top:2px}.nr-diet-hero{display:grid;grid-template-columns:265px minmax(0,1fr);gap:12px;align-items:start}.nr-diet-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#386fa4;font-weight:800}.nr-diet-matrix-svg{width:100%;height:auto;border:1px solid #d7e5f2;border-radius:12px;background:#fff}.nr-diet-facts,.nr-diet-method-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:8px 0}.nr-diet-facts>div,.nr-diet-method-grid>div{border:1px solid #e0ebf5;border-radius:9px;background:#fbfdff;padding:7px}.nr-diet-facts span,.nr-diet-method-grid span{display:block;font-size:10.5px;color:#64748b}.nr-diet-facts strong,.nr-diet-method-grid strong{display:block;margin-top:2px}.nr-diet-facts em{display:block;margin-top:2px;color:#64748b;font-size:10.5px;font-style:normal}.nr-diet-first{border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;background:#eff6ff;padding:8px;margin-top:8px}.nr-diet-first span{display:block;font-size:10.5px;color:#1e40af;font-weight:800}.nr-diet-first strong{display:block;margin-top:2px}.nr-diet-first p{margin:.35em 0 0}.nr-diet-bars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:9px}.nr-diet-meter{border:1px solid #e0ebf5;border-radius:10px;padding:7px;background:#fbfdff}.nr-diet-meter span{display:block;font-size:10.5px;color:#64748b}.nr-diet-meter i{display:block;position:relative;height:9px;border-radius:999px;background:#e8eef6;margin:5px 0;overflow:hidden}.nr-diet-meter i b{display:block;height:100%;width:calc(var(--value)*1%);background:#5AA9E6}.nr-diet-meter i em{position:absolute;left:70%;top:-2px;bottom:-2px;border-left:1.5px solid #111827}.nr-diet-meter strong{font-size:12px}.nr-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.nr-action-card{break-inside:avoid;border:1px solid #d7e5f2;border-radius:11px;padding:9px;background:#fff}.nr-action-card[data-kind="главное"]{border-left:4px solid #2563eb;background:#f8fbff}.nr-action-card span{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#386fa4;font-weight:800}.nr-action-card strong{display:block;margin-top:2px}.nr-action-card p{margin:.35em 0}.nr-action-card em{display:block;color:#475569;font-style:normal}.nr-diet-print-block{break-inside:auto;border-top:1px solid #e0ebf5;padding-top:8px;margin-top:9px}.nr-diet-print-type{font-size:10.5px;color:#64748b;margin-top:-4px;margin-bottom:5px}.nr-diet-print-body p{margin:.35em 0}.nr-diet-chip,.diet-acc-chip{display:inline-block;border:1px solid #d7e5f2;border-radius:999px;padding:2px 7px;margin:2px 3px 2px 0;background:#fbfdff;font-size:10.5px;font-weight:700;color:#334155}.nr-diet-chip[data-kind="shift"],.diet-acc-chip[data-chip-kind="shift"]{background:#eff6ff;color:#1d4ed8}.nr-diet-chip[data-kind="reduce"],.diet-acc-chip[data-chip-kind="reduce"]{background:#fff7ed;color:#9a3412}.nr-diet-chip[data-kind="keep"],.diet-acc-chip[data-chip-kind="keep"]{background:#ecfdf5;color:#166534}.diet-zone-explain-grid,.diet-point-passport{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:7px 0}.diet-zone-explain-grid>div,.diet-point-passport>div{border:1px solid #e0ebf5;border-radius:9px;background:#fbfdff;padding:7px}.diet-zone-explain-grid span,.diet-point-passport span{display:block;font-size:10.5px;color:#64748b}.diet-zone-explain-grid b,.diet-point-passport b{display:block}.diet-point-passport em{display:block;color:#64748b;font-size:10.5px;font-style:normal}.diet-personal-list{display:grid;grid-template-columns:1fr;gap:7px}.diet-personal-item,.diet-step-card,.diet-domain-row,.diet-context-help{break-inside:avoid;border:1px solid #e0ebf5;border-radius:10px;background:#fff;padding:8px;margin:7px 0}.diet-personal-item>div:first-child{display:flex;justify-content:space-between;gap:8px}.diet-personal-item span{color:#64748b;font-size:11px}.diet-gram-action{border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;background:#eff6ff;padding:8px;margin-top:7px}.diet-gram-action span{display:block;font-size:10.5px;font-weight:800;color:#1e40af}.diet-gram-action strong{display:block;margin-top:2px}.diet-gram-action p{margin:.35em 0}.diet-gram-action em{display:block;margin-top:3px;color:#475569;font-style:normal}.diet-step-card-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.diet-step-card span{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#386fa4;font-weight:800}.diet-domain-intro{border:1px solid #dbeafe;background:#f8fbff;border-radius:10px;padding:8px;margin-bottom:7px}.diet-domain-intro strong,.diet-domain-section-title strong{display:block}.diet-domain-intro span,.diet-domain-section-title span{color:#64748b;font-size:11px}.diet-domain-section-title{margin:10px 0 5px}.diet-domain-row summary{list-style:none;display:block}.diet-domain-summary{display:block}.diet-domain-label b{display:block}.diet-domain-label small{display:block;color:#64748b}.diet-domain-meter{display:flex;gap:6px;align-items:center;margin-top:5px}.diet-domain-track{flex:1;height:8px;border-radius:999px;background:#e8eef6;overflow:hidden}.diet-domain-fill{display:block;height:100%;width:calc(var(--value)*1%);background:#5AA9E6}.diet-domain-status,.diet-domain-value{font-size:10.5px;color:#475569}.diet-context-help summary{list-style:none;font-weight:800}.diet-context-help summary span{font-size:10px;text-transform:uppercase;color:#386fa4;margin-right:5px}.diet-context-help summary em{display:block;color:#64748b;font-style:normal;font-size:10.5px}.diet-context-help-body p{margin:.35em 0}.diet-context-help-current,.diet-context-help-action{border:1px solid #e0ebf5;border-radius:9px;padding:7px;background:#fbfdff;margin-top:6px}.diet-context-help-current span,.diet-context-help-action span{display:block;font-size:10.5px;color:#64748b;font-weight:800}.nr-personal-tags{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 9px}.nr-personal-tags span{border:1px solid #d7e5f2;border-radius:999px;background:#fbfdff;padding:2px 7px;font-size:10.5px;font-weight:800;color:#334155}.nr-personal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}.nr-personal-card,.nr-nutrient-action{break-inside:avoid;border:1px solid #dbe7f3;border-radius:11px;background:#fff;padding:9px}.nr-personal-card[data-level="главный"],.nr-nutrient-action[data-level="добрать"]{border-left:4px solid #2563eb;background:#f8fbff}.nr-personal-card[data-level="осторожно"],.nr-nutrient-action[data-level="сократить"]{border-left:4px solid #f59e0b;background:#fffaf0}.nr-personal-card span,.nr-nutrient-action span{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#386fa4;font-weight:800}.nr-personal-card strong,.nr-nutrient-action strong{display:block;margin-top:2px}.nr-personal-card p,.nr-nutrient-action p{margin:.35em 0}.nr-personal-card em,.nr-nutrient-action em{display:block;color:#475569;font-style:normal}.nr-personal-caution{border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;color:#7c2d12;padding:8px;margin:7px 0}.nr-nutrient-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.nr-nutrient-action small{display:block;color:#64748b}@media print{.nr-report{padding:0}.nr-section{box-shadow:none}.nr-cover{background:#f7fbff}.nr-ration-table{font-size:10.5px}.nr-grid-5{grid-template-columns:repeat(5,1fr)}.nr-micros{break-before:auto}.nr-ration{break-before:auto}}@media(max-width:720px){.nr-report{padding:10px}.nr-cover-grid,.nr-grid-5,.nr-inline-cards,.nr-hp-details{grid-template-columns:1fr}}'+
    '</style>';
  }
  function buildReportBodyHtml(model){
    var pc=model && model.productCorrection || getProductCorrectionState();
    if (!pc || pc.analysisState !== 'complete') return '<article class="nr-report" data-report-version="'+esc(VERSION)+'" data-report-status="preliminary">'+summaryHtml(model)+inputDataHtml(model)+needsHtml(model)+macrosHtml(model)+microsHtml(model)+formulaAuditHtml(model)+validationEvidenceHtml(model)+methodNoteHtml()+'</article>';
    return '<article class="nr-report" data-report-version="'+esc(VERSION)+'" data-report-status="current-ration">'+summaryHtml(model)+inputDataHtml(model)+personalProfileOverviewHtml(model)+dietProfileOverviewHtml(model)+heiOverviewHtml(model)+harvardOverviewHtml(model)+appendixHtml(model)+'</article>';
  }
  function sanitizeReportHtml(html){ return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+="[^"]*"/gi, ''); }
  function buildReportHtml(model, options){
    var t0 = now();
    var body = buildReportBodyHtml(model || buildReportModel(options), options || {});
    var html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+esc(REPORT_TITLE)+'</title>'+reportStyles()+patientReportPass3Styles()+'</head><body>'+body+'</body></html>';
    html = sanitizeReportHtml(html);
    lastHtmlBuildMs = Math.round(now() - t0);
    return html;
  }
  function getReportHtml(options){
    options = options || {};
    var hash = snapshotHash();
    if (!options.force && cachedHtml && cachedHash === hash && !cacheDirty) return cachedHtml;
    var model = buildReportModel({ force:options.force });
    cachedHtml = buildReportHtml(model, options);
    return cachedHtml;
  }
  function markDirty(reason){
    cacheDirty = true;
    lastScheduledReason = reason || '';
    schedulePrebuild(reason);
    schedulePersonalNutrientScreen(reason);
  }
  function schedulePrebuild(reason){
    if (cacheTimer) window.clearTimeout(cacheTimer);
    cacheTimer = window.setTimeout(function(){
      cacheTimer = null;
      requestIdle(function(){
        try { getReportHtml({ force:true, reason:reason || lastScheduledReason }); }
        catch(e) { try { console.warn('[NutritionReportV5] background report build failed', e); } catch(_) {} }
      }, 500);
    }, 120);
  }

  function reportShellHtml(kind){
    var title = kind === 'pdf' ? 'PDF через окно печати' : 'Подготовка отчёта для печати';
    return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{margin:0;background:#f8fbff;color:#172033;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.nr-shell{max-width:760px;margin:48px auto;padding:22px;border:1px solid #d7e5f2;border-radius:18px;background:#fff;box-shadow:0 16px 38px rgba(15,23,42,.08)}.nr-shell small{display:block;color:#64748b;margin-top:8px}.nr-spinner{width:18px;height:18px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;display:inline-block;vertical-align:-4px;margin-right:8px;animation:nrspin .8s linear infinite}@keyframes nrspin{to{transform:rotate(360deg)}}</style></head><body><div class="nr-shell"><h1><span class="nr-spinner"></span>'+esc(title)+'</h1><p>Окно открыто. Если отчёт уже подготовлен, он появится сразу.</p><small>Для сохранения PDF выберите «Сохранить как PDF» в системном окне печати.</small></div></body></html>';
  }
  function writeWindow(win, html){
    if (!win || win.closed) return false;
    try { win.document.open(); win.document.write(html); win.document.close(); return true; }
    catch(e) { try { console.error('[NutritionReportV5] cannot write report window', e); } catch(_) {} return false; }
  }
  function openReportWindowNow(kind){
    var win = window.open('', '_blank', 'width=1040,height=900,scrollbars=yes,resizable=yes');
    if (!win) { alert('Браузер заблокировал окно отчёта. Разрешите всплывающие окна для этого сайта и повторите действие.'); return null; }
    writeWindow(win, reportShellHtml(kind || 'print'));
    try { win.focus(); } catch(_) {}
    return win;
  }
  function renderReportIntoWindow(win, kind, autoPrint){
    window.setTimeout(function(){
      try {
        var html = getReportHtml({ force:true, mode:kind === 'pdf' ? 'pdf-native' : 'full' });
        if (!writeWindow(win, html)) return;
        try { win.focus(); } catch(_) {}
        if (autoPrint !== false) win.setTimeout(function(){ try { win.print(); } catch(_) {} }, 180);
      } catch (e) {
        var msg = e && (e.stack || e.message || String(e));
        writeWindow(win, '<!doctype html><html><head><meta charset="utf-8"><title>Ошибка отчёта</title><style>body{font:14px/1.5 system-ui;padding:24px;color:#172033}pre{white-space:pre-wrap;background:#fff1f2;border:1px solid #fecaca;border-radius:12px;padding:12px}</style></head><body><h1>Не удалось собрать отчёт</h1><p>Перезагрузите страницу и повторите действие. Если ошибка повторится, отправьте текст из этого окна разработчику.</p><pre>'+esc(msg)+'</pre></body></html>');
      }
    }, cachedHtml && !cacheDirty ? 0 : 20);
  }
  function printReport(){ var win = openReportWindowNow('print'); if (!win) return false; renderReportIntoWindow(win, 'print', true); return true; }
  function savePdfReport(){
    var win = openReportWindowNow('pdf');
    if (!win) return Promise.resolve(false);
    renderReportIntoWindow(win, 'pdf', true);
    return Promise.resolve(true);
  }
  function replaceHandler(id, handler){
    var oldBtn = $(id);
    if (!oldBtn || oldBtn.__nutritionReportV5Bound) return false;
    var newBtn = oldBtn.cloneNode(true);
    newBtn.__nutritionReportV5Bound = true;
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', function(e){ e.preventDefault(); handler(); });
    return true;
  }
  function install(){
    replaceHandler('printAllBtn', printReport);
    replaceHandler('exportAllPdfBtn', savePdfReport);
    ['ration:changed','needs:changed','needs:computed','hei:bridge-updated','hei:rendered','diet:assessment-ready','diet:profile-rendered'].forEach(function(ev){
      window.addEventListener(ev, function(){ markDirty(ev); });
      document.addEventListener(ev, function(){ markDirty(ev); });
    });
    ['input','change'].forEach(function(ev){
      document.addEventListener(ev, function(e){
        var id = e && e.target && e.target.id || '';
        if (/^needs_|^hei/.test(id)) markDirty(ev + ':' + id);
      }, true);
    });
    window.setTimeout(function(){ markDirty('initial'); }, 650);
  }
  function runTests(){
    var rows = [];
    function row(name, pass, detail){ rows.push({ test:name, pass:!!pass, detail:detail || '' }); }
    var model = null, html = '';
    try { model = buildReportModel({ force:true }); row('model builds', !!model, lastBuildMs + ' ms'); } catch(e){ row('model builds', false, e && (e.message || String(e))); }
    try { html = buildReportHtml(model || buildReportModel()); row('html builds', html.length > 2000, html.length + ' chars'); } catch(e2){ row('html builds', false, e2 && (e2.message || String(e2))); }
    row('report has no script tags', !/<script\b/i.test(html));
    row('report has Harvard Plate section', /Гарвардская тарелка/.test(html));
    row('report has Diet Analysis Profile section', /Профиль анализа рациона/.test(html));
    row('report has print action cards', /Практические действия по продуктам/.test(html) || /Профиль анализа пока не рассчитан/.test(html));
    row('report has micronutrients', /Микронутриенты/.test(html) && /Витамин D/.test(html) && /Кальций/.test(html));
    row('report has macro table', /Макронутриенты/.test(html) && /Белки/.test(html) && /Углеводы/.test(html));
    row('report supports composite root plus ingredient rows', /Продукт и состав/.test(html));
    row('report exposes P1.4 formula traceability', /Трассировка расчётных формул/.test(html) && /v5\.3\.210-p1\.4/.test(html));
    row('report exposes P2.0 pending external validation status', /Статус внешней проверки/.test(html) && /EXTERNAL_VALIDATION_PENDING/.test(html) && /не разрешено/.test(html));
    row('Harvard section has no visible cup-eq/oz-eq', !/cup-eq|oz-eq|ounce|унц/i.test(html));
    row('print button exists', !!$('printAllBtn'));
    row('pdf button exists', !!$('exportAllPdfBtn'));
    try { if (console && console.table) console.table(rows); } catch(_) {}
    window.__nutritionReportV5220TestResults = rows;
    return rows.every(function(r){ return !!r.pass; });
  }

  var api = {
    version:VERSION,
    buildReportModel:buildReportModel,
    buildReportHtml:buildReportHtml,
    buildReportBodyHtml:buildReportBodyHtml,
    renderPersonalNutrientScreen:renderPersonalNutrientScreen,
    getReportHtml:getReportHtml,
    schedulePrebuild:schedulePrebuild,
    print:printReport,
    savePdf:savePdfReport,
    install:install,
    runTests:runTests,
    metricSpec:metricSpec,
    rowDeficitText:rowDeficitText,
    gramsRangeReduced:gramsRangeReduced,
    testHelpers:{ actionForNutrient:actionForNutrient, buildPersonalNutrientActions:buildPersonalNutrientActions, targetStateText:targetStateText },
    getCacheInfo:function(){ return { dirty:cacheDirty, hash:cachedHash, hasModel:!!cachedModel, hasHtml:!!cachedHtml, lastBuildMs:lastBuildMs, lastHtmlBuildMs:lastHtmlBuildMs, reason:lastScheduledReason }; }
  };
  window.NutritionReportV5 = api;
  window.NutritionReportV5360 = api;
  window.NutritionReportV5221 = api;
  window.NutritionReportV5220 = api;
  window.NutritionReportV5219 = api;
  window.NutritionReportV5216 = api;
  window.NutritionReportV5215 = api;
  window.NutritionReportV5214 = api;
  window.NutritionReportV5213 = api;
  window.NutritionReportV5212 = api;
  window.NutritionReportV5211 = api;
  window.NutritionReportV5210 = api;
  window.NutritionReportV529 = api;
  window.NutritionReportV528 = api;
  window.NutritionReportV527 = api;
  window.NutritionReportV525 = api;
  window.NutritionReportV524 = api;

  ready(install);
})();
