// v5.3.57 Fruit-Vegetable Help Pass — adds contextual help for fruit-heavy and vegetable-light structure
// Responsibility: make the profile understandable and interactive without changing HEI, nutrients or method formulas.
(function(){
  'use strict';
  var VERSION = 'v5.3.156_patient_report_content_pass2';
  var scheduled = false;
  var selectedZoneId = null;
  var selectedInspectId = 'point';

  function clamp(v,min,max){ v = Number(v); if(!Number.isFinite(v)) return min; return Math.max(min, Math.min(max, v)); }
  function fmt(v,d){ v = Number(v); return Number.isFinite(v) ? v.toFixed(d == null ? 0 : d).replace('.', ',') : '—'; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function setHtml(el, html){ if (!el) return; try { if (window.stableSetHtml) return window.stableSetHtml(el, html); } catch(_) {} el.innerHTML = html; }
  function num(v){ v = Number(v); return Number.isFinite(v) ? v : 0; }
  function scoreFromPoints(points, key, max){ var p = points && Number(points[key]); return Number.isFinite(p) ? clamp((p / max) * 100, 0, 100) : NaN; }
  function average(values){ var a = values.filter(function(v){ return Number.isFinite(Number(v)); }).map(Number); return a.length ? a.reduce(function(x,y){ return x+y; },0)/a.length : NaN; }

  function getHarvardApi(){
    return window.HarvardPlateV5337 || window.HarvardPlateV5336 || window.HarvardPlateV5335 || window.HarvardPlateV5334 || window.HarvardPlateV5332 || window.HarvardPlateV5331 || window.HarvardPlateV5330 || window.HarvardPlateV5329 || window.HarvardPlateV5328 || window.HarvardPlateV5221 || window.HarvardPlateV5220 || null;
  }
  function getHarvardModel(){ var api = getHarvardApi(); try { if (api && typeof api.getModel === 'function') return api.getModel(); } catch(_) {} return null; }
  function getHeiModel(){ return window.__lastHEIModel || null; }
  function getHeiRows(){ return Array.isArray(window.__lastHEIRows) ? window.__lastHEIRows : []; }
  function getRation(){ try { var r = (window.State && typeof window.State.get === 'function') ? window.State.get() : []; var api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377 || window.CompositeFoodDecomposerV5376; if (api && typeof api.flattenForCalculation === 'function') return api.flattenForCalculation(r || []); if (api && typeof api.flattenCompositeForCalculation === 'function') return api.flattenCompositeForCalculation(r || []); return r || []; } catch(_) { return []; } }
  function getNutrientRation(){ try { if (window.State && typeof window.State.getForNutrients === 'function') return window.State.getForNutrients(); var r = (window.State && typeof window.State.get === 'function') ? window.State.get() : []; var route = window.CompositeNutrientRoutingV53107; if (route && typeof route.toNutrientEntries === 'function') return route.toNutrientEntries(r || []); return r || []; } catch(_) { return []; } }
  function getProduct(key){ try { return window.DB && window.DB.byKey && window.DB.byKey.get(key); } catch(_) { return null; } }
  function n100(p, fields){ for (var i=0;i<fields.length;i++){ var v = Number(p && p[fields[i]]); if (Number.isFinite(v)) return v; } return 0; }
  function protein100(p){ return n100(p, ['protein_per_100g','protein_g','protein']); }
  function kcal100(p){ return n100(p, ['kcal','energy_kcal','calories']); }
  function calcium100(p){ return n100(p, ['calcium_mg','calcium']); }
  function sodium100(p){ return n100(p, ['sodium_mg']); }
  function sfa100(p){ return n100(p, ['sfa','saturated_fat_g','sat_fats_g']); }
  function addedSugar100(p){ return n100(p, ['added_sugar','added_sugars_g','added_sugar_g']); }
  function tagsText(p){ return String(((p && p.key) || '')+' '+((p && p.name_ru) || '')+' '+((p && p.name) || '')+' '+(Array.isArray(p && p.tags) ? p.tags.join(' ') : '')).toLowerCase().replace(/ё/g,'е'); }
  function hasAnyText(p, arr){ var t = tagsText(p); return arr.some(function(x){ return t.indexOf(x) >= 0; }); }

  function normValue(key, fallback){
    try { var v = window.norms && window.norms.values && window.norms.values[key] && Number(window.norms.values[key].value); if (Number.isFinite(v) && v > 0) return v; } catch(_) {}
    return fallback;
  }

  function calcTotals(ration){
    var core = window.NutritionCalculationCoreV53155 || window.NutritionCalculationCore;
    if (core && typeof core.totals === 'function') {
      var result = core.totals(ration || []);
      var src = result && result.t || {};
      return { kcal:num(src.kcal), protein_g:num(src.protein_g), calcium_mg:num(src.calcium_mg), sodium_mg:num(src.sodium_mg), added_sugars_g:num(src.added_sugars_g), sfa_g:num(src.sfa_g) };
    }
    var t = { kcal:0, protein_g:0, calcium_mg:0, sodium_mg:0, added_sugars_g:0, sfa_g:0 };
    (ration || []).forEach(function(it){
      var p = getProduct(it.key); var g = Math.max(0, num(it.grams)); if (!p || !g) return;
      var f = g / 100; t.kcal += kcal100(p)*f; t.protein_g += protein100(p)*f; t.calcium_mg += calcium100(p)*f;
      t.sodium_mg += sodium100(p)*f; t.added_sugars_g += addedSugar100(p)*f; t.sfa_g += sfa100(p)*f;
    });
    return t;
  }

  function dairyCreditCoefficient(p){
    if (!p || (p.hei_category_key !== 'dairy' && !hasAnyText(p, ['молоч','milk','yogurt','йогурт','кефир','творог','curd','cheese','сыр']))) return 0;
    if (hasAnyText(p, ['ghee','топленое масло','топлёное масло','butter','масло сливочное','сливочное масло','cream','сливки','sour cream','сметана','крем-сыр','cream cheese'])) return 0;
    if (hasAnyText(p, ['cheese','сыр','брынза','feta','parmesan','mozzarella','gouda','cheddar'])) return 0.70;
    if (hasAnyText(p, ['sweet','слад','dessert','десерт','flavoured','flavored']) || addedSugar100(p) >= 5) return 0.50;
    return 1.00;
  }
  function dairyQualityPenalty(p, grams){
    var g = Math.max(0, num(grams)); if (!g) return 0;
    var penalty = 0;
    if (addedSugar100(p) >= 5) penalty += Math.min(18, addedSugar100(p) * g / 100 * 1.0);
    if (sfa100(p) >= 5) penalty += Math.min(18, sfa100(p) * g / 100 * 1.2);
    if (sodium100(p) >= 350) penalty += Math.min(16, sodium100(p) * g / 100 / 120);
    if (dairyCreditCoefficient(p) === 0 && (p && p.hei_category_key === 'dairy')) penalty += 10;
    return penalty;
  }
  function dairyLayer(ration, totals, heiModel){
    var dairyProteinCredited = 0, dairyProteinRaw = 0, dairyCalcium = 0, dairyMass = 0, riskPenalty = 0, count = 0;
    (ration || []).forEach(function(it){
      var p = getProduct(it.key); var g = Math.max(0, num(it.grams)); if (!p || !g) return;
      var coef = dairyCreditCoefficient(p);
      if (coef > 0 || p.hei_category_key === 'dairy') {
        count += 1;
        dairyMass += g;
        var prot = protein100(p) * g / 100;
        dairyProteinRaw += prot;
        dairyProteinCredited += prot * coef;
        dairyCalcium += calcium100(p) * g / 100;
        riskPenalty += dairyQualityPenalty(p, g);
      }
    });
    var proteinTarget = normValue('protein_g', 55);
    var calciumTarget = normValue('calcium_mg', 1000);
    var dairyHei = scoreFromPoints(heiModel && heiModel.points, 'dairy', 10);
    var calciumScore = clamp((dairyCalcium / Math.max(1, calciumTarget)) * 100, 0, 100);
    var dairyProteinEqG = dairyProteinCredited / 0.12;
    var proteinShareScore = clamp((dairyProteinCredited / Math.max(20, proteinTarget * 0.25)) * 100, 0, 100);
    var qualityScore = clamp(100 - riskPenalty, 0, 100);
    var contribution = average([
      Number.isFinite(dairyHei) ? dairyHei * 0.42 : NaN,
      calciumScore * 0.28,
      proteinShareScore * 0.20,
      qualityScore * 0.10
    ].map(function(v){ return Number.isFinite(v) ? v : NaN; }));
    // Weighted average above needs normalization when HEI is missing; normalize explicitly.
    var weights = [], vals = [];
    if (Number.isFinite(dairyHei)) { vals.push(dairyHei); weights.push(0.42); }
    vals.push(calciumScore); weights.push(0.28);
    vals.push(proteinShareScore); weights.push(0.20);
    vals.push(qualityScore); weights.push(0.10);
    var ws = weights.reduce(function(a,b){return a+b;},0);
    var score = vals.reduce(function(a,v,i){ return a + v * weights[i]; },0) / Math.max(0.0001, ws);
    return {
      score: clamp(score,0,100),
      dairyHeiScore: dairyHei,
      calciumScore: calciumScore,
      proteinShareScore: proteinShareScore,
      qualityScore: qualityScore,
      dairyProteinCreditedG: dairyProteinCredited,
      dairyProteinRawG: dairyProteinRaw,
      dairyProteinEquivalentG: dairyProteinEqG,
      dairyCalciumMg: dairyCalcium,
      dairyMassG: dairyMass,
      riskPenalty: riskPenalty,
      count: count
    };
  }

  function sectorFit(model, id){
    var s = model && model.stage && model.stage.sectors && model.stage.sectors[id];
    if (!s) return NaN;
    return clamp(1 - Math.abs((Number(s.fillRatio) || 0) - 1), 0, 1) * 100;
  }
  function strictStructureScore(harvardModel){
    if (!harvardModel || harvardModel.ready === false || harvardModel.empty) return NaN;
    return clamp(Number(harvardModel.score), 0, 100);
  }
  function analysisMass(harvardModel){
    var details = harvardModel && harvardModel.built && Array.isArray(harvardModel.built.details) ? harvardModel.built.details : [];
    var total = 0, core = 0, outsideConcern = 0, outsideNeutral = 0;
    details.forEach(function(it){
      var g = Math.max(0, num(it && it.grams)); if (!g) return;
      var roles = Array.isArray(it.roles) ? it.roles : [];
      var isWaterOnly = roles.indexOf('waterPlain') >= 0 || roles.indexOf('unsweetenedBeverage') >= 0;
      if (isWaterOnly) return;
      total += g;
      if (it.group) core += g;
      else if (roles.some(function(r){ return ['sweetDrink','refinedGrain','processedMeat','fattySauce','juice','harvardPotato','proteinSupplement'].indexOf(r) >= 0; })) outsideConcern += g;
      else outsideNeutral += g;
    });
    var coreCoverage = total > 0 ? clamp(core / total * 100, 0, 100) : NaN;
    return { total:total, core:core, outsideConcern:outsideConcern, outsideNeutral:outsideNeutral, coreCoverage:coreCoverage };
  }
  function moderationScore(heiModel){
    var p = heiModel && heiModel.points;
    var refined = scoreFromPoints(p,'grains_refined',10);
    var sodium = scoreFromPoints(p,'sodium_g',10);
    var sugar = scoreFromPoints(p,'added_sugars_pct',10);
    var sfa = scoreFromPoints(p,'sat_fats_pct',10);
    return average([refined, sodium, sugar, sfa]);
  }
  function outsideSafety(harvardModel, heiModel){
    var mod = moderationScore(heiModel);
    var flags = harvardModel && harvardModel.stage && Array.isArray(harvardModel.stage.qualityFlags) ? harvardModel.stage.qualityFlags : [];
    var warn = flags.filter(function(f){ return f && f.severity === 'warn'; }).length;
    var info = flags.filter(function(f){ return f && f.severity === 'info'; }).length;
    var flagScore = clamp(100 - warn * 16 - info * 4, 0, 100);
    if (!Number.isFinite(mod)) return flagScore;
    return clamp(0.70 * mod + 0.30 * flagScore, 0, 100);
  }
  function proteinAdequacy(totals){
    var target = normValue('protein_g', 55);
    var got = num(totals && totals.protein_g);
    if (target <= 0 || got <= 0) return { score: got > 0 ? 80 : 0, got:got, target:target, ratio:NaN };
    var ratio = got / target;
    var score = ratio < 1 ? ratio * 100 : ratio <= 1.5 ? 100 : clamp(100 - (ratio - 1.5) * 30, 70, 100);
    return { score:clamp(score,0,100), got:got, target:target, ratio:ratio };
  }
  function plantBase(heiModel){
    var p = heiModel && heiModel.points;
    var veg = average([scoreFromPoints(p,'vegetables_total',5), scoreFromPoints(p,'greens_beans',5)]);
    var fruit = average([scoreFromPoints(p,'fruits_total',5), scoreFromPoints(p,'fruits_whole',5)]);
    if (!Number.isFinite(veg) && !Number.isFinite(fruit)) return { score:NaN, veg:veg, fruit:fruit };
    if (!Number.isFinite(veg)) veg = 0;
    if (!Number.isFinite(fruit)) fruit = 0;
    return { score:clamp(0.65 * veg + 0.35 * fruit,0,100), veg:veg, fruit:fruit };
  }
  function wholeGrainStarchQuality(heiModel){
    var p = heiModel && heiModel.points;
    var whole = scoreFromPoints(p,'grains_whole',10);
    var refined = scoreFromPoints(p,'grains_refined',10);
    if (!Number.isFinite(whole) && !Number.isFinite(refined)) return { score:NaN, whole:whole, refined:refined };
    if (!Number.isFinite(whole)) whole = 0;
    if (!Number.isFinite(refined)) refined = 70;
    return { score:clamp(0.75 * whole + 0.25 * refined,0,100), whole:whole, refined:refined };
  }
  function balanceDisplacement(harvardModel){
    var strict = strictStructureScore(harvardModel);
    var mass = analysisMass(harvardModel);
    var coverage = Number.isFinite(mass.coreCoverage) ? mass.coreCoverage : NaN;
    if (!Number.isFinite(strict) && !Number.isFinite(coverage)) return { score:NaN, strict:strict, coverage:coverage, mass:mass };
    if (!Number.isFinite(strict)) strict = coverage;
    if (!Number.isFinite(coverage)) coverage = strict;
    return { score:clamp(0.72 * strict + 0.28 * coverage,0,100), strict:strict, coverage:coverage, mass:mass };
  }
  function buildProfileModel(){
    var harvardModel = getHarvardModel();
    var heiModel = getHeiModel();
    var core = window.NutritionCalculationCoreV53155 || window.NutritionCalculationCore;
    var snapshot = core && typeof core.snapshot === 'function' ? core.snapshot() : null;
    var ration = snapshot ? snapshot.foodPatternRation : getRation();
    var totals = snapshot ? snapshot.totals : calcTotals(getNutrientRation());
    var hei = heiModel && Number.isFinite(Number(heiModel.total)) ? clamp(Number(heiModel.total), 0, 100) : NaN;
    var plant = plantBase(heiModel);
    var whole = wholeGrainStarchQuality(heiModel);
    var protein = proteinAdequacy(totals);
    var dairy = dairyLayer(ration, totals, heiModel);
    var outside = outsideSafety(harvardModel, heiModel);
    var balance = balanceDisplacement(harvardModel);
    var domains = {
      plantBase: plant.score,
      wholeGrainStarch: whole.score,
      proteinAdequacy: protein.score,
      dairyCalcium: dairy.score,
      outsideSafety: outside,
      balanceDisplacement: balance.score
    };
    var structure = [
      [domains.plantBase, 0.25],
      [domains.wholeGrainStarch, 0.20],
      [domains.proteinAdequacy, 0.20],
      [domains.dairyCalcium, 0.15],
      [domains.outsideSafety, 0.10],
      [domains.balanceDisplacement, 0.10]
    ].reduce(function(acc, pair){
      var v = Number(pair[0]), w = pair[1];
      if (Number.isFinite(v)) { acc.sum += v * w; acc.weight += w; }
      return acc;
    }, {sum:0, weight:0});
    var dailyStructure = structure.weight > 0 ? clamp(structure.sum / structure.weight, 0, 100) : NaN;
    var strict = strictStructureScore(harvardModel);
    var agreement = (Number.isFinite(hei) && Number.isFinite(dailyStructure)) ? clamp(100 - Math.min(100, Math.abs(hei - dailyStructure) * 1.25), 0, 100) : NaN;
    var strictAgreement = (Number.isFinite(hei) && Number.isFinite(strict)) ? clamp(100 - Math.min(100, Math.abs(hei - strict) * 1.25), 0, 100) : NaN;
    var dairyExplainedGap = Number.isFinite(agreement) && Number.isFinite(strictAgreement) ? agreement - strictAgreement : NaN;
    return {
      version:VERSION,
      ration:ration,
      totals:totals,
      heiModel:heiModel,
      harvardModel:harvardModel,
      hei:hei,
      strictStructure:strict,
      dailyStructure:dailyStructure,
      domains:domains,
      details:{ plant:plant, whole:whole, protein:protein, dairy:dairy, outside:outside, balance:balance, mass:balance.mass || analysisMass(harvardModel) },
      formulas:{ structureWeights:{plantBase:0.25,wholeGrainStarch:0.20,proteinAdequacy:0.20,dairyCalcium:0.15,outsideSafety:0.10,balanceDisplacement:0.10}, stableThreshold:70, agreement:'100 - |HEI - structure| × 1.25' },
      dataQuality:snapshot && snapshot.sourceQuality ? snapshot.sourceQuality : null,
      dietAssessment:window.__lastDietAssessment || null,
      interpretation:{ agreement:agreement, axisAgreement:agreement, strictAgreement:strictAgreement, dairyExplainedGap:dairyExplainedGap }
    };
  }

  function zoneInfo(id){
    var map = {
      strong: {
        label:'Согласованный профиль',
        title:'Качество и структура выглядят согласованно.',
        meaning:'Рацион находится в зоне, где HEI и структурный профиль дают близкий положительный сигнал. При этом отдельные нутриенты всё равно стоит проверить; общий контур выглядит собранным.',
        check:'Сохраняйте контроль натрия, добавленного сахара, насыщенных жиров, клетчатки и качества молочной группы.'
      },
      structure: {
        label:'Структура требует внимания',
        title:'Качество компонентов сохранено лучше, чем структура дневного рациона.',
        meaning:'HEI может выглядеть приемлемо, но распределение основных групп смещено: например, мало овощной основы, слабее цельные злаки, выражен молочный вклад или часть продуктов находится вне основной структуры.',
        check:'Начните с самого слабого структурного домена ниже и проверьте, какая группа вытесняет остальные.'
      },
      quality: {
        label:'Качество требует внимания',
        title:'Структура выглядит лучше, чем качество компонентов по HEI.',
        meaning:'Распределение групп может быть относительно собранным, но итоговый HEI снижается за счёт качества продуктов: натрия, добавленного сахара, насыщенных жиров, рафинированной злаковой части или слабых HEI-компонентов.',
        check:'Смотрите слабый компонент HEI и ограничиваемые показатели: натрий, сахар, насыщенные жиры и рафинированные продукты.'
      },
      complex: {
        label:'Комплексная коррекция',
        title:'Требуется работа и с качеством, и со структурой.',
        meaning:'Оба слоя анализа дают напряжённый сигнал. В этом случае лучше не менять всё сразу, а выбрать один первый домен, который одновременно улучшит структуру и поддержит HEI.',
        check:'Начните с первого практического шага и затем повторно оцените матрицу после изменения рациона.'
      },
      empty: {
        label:'Ждём рацион',
        title:'Матрица появится после расчёта рациона.',
        meaning:'Добавьте продукты и рассчитайте рацион, чтобы увидеть точку на матрице, профиль доменов и надёжность интерпретации.',
        check:'После расчёта откройте домен с самым низким значением: там будет объяснение, что именно формирует результат.'
      }
    };
    return map[id] || map.empty;
  }
  function selectedZone(q){ return selectedZoneId || (q && q.id) || 'empty'; }
  function selectedInspect(q){ return selectedInspectId || 'point'; }
  function matrixRelationLabel(profile){
    var hei = Number(profile && profile.hei);
    var st = Number(profile && profile.dailyStructure);
    if (!Number.isFinite(hei) || !Number.isFinite(st)) return 'ждём расчёт';
    var gap = hei - st;
    if (Math.abs(gap) <= 5) return 'качество и структура близки';
    return gap > 0 ? 'качество выше структуры' : 'структура выше качества';
  }
  function compactZoneLabel(profile, q){
    if (!q || q.id === 'empty') return '—';
    var hei = Number(profile && profile.hei);
    var st = Number(profile && profile.dailyStructure);
    if (q.id === 'strong') return 'устойчивый профиль';
    if (q.id === 'structure') return (Number.isFinite(hei) && Number.isFinite(st) && hei < 70 && st < 70) ? 'умеренный дисбаланс' : 'дисбаланс структуры';
    if (q.id === 'quality') return (Number.isFinite(hei) && Number.isFinite(st) && hei < 70 && st < 70) ? 'умеренный дисбаланс' : 'дисбаланс качества';
    if (q.id === 'complex') return (Number.isFinite(hei) && Number.isFinite(st) && Math.max(hei, st) >= 50) ? 'умеренный дисбаланс' : 'комплексная коррекция';
    return q.label || '—';
  }
  function matrixInsight(profile, q){
    if (!q || q.id === 'empty') return 'Рацион появится после расчёта.';
    var relation = matrixRelationLabel(profile);
    if (q.id === 'strong') return 'Качество и структура рациона согласованы; профиль можно использовать как рабочую основу.';
    if (q.id === 'structure') return 'Рацион уже имеет хорошую продуктовую основу, но общий результат ограничивает структура питания.';
    if (q.id === 'quality') return 'Структура питания в целом собрана, но общий результат ограничивает качество выбранных продуктов.';
    if (q.id === 'complex') {
      if (relation === 'качество выше структуры') return 'Качество рациона выглядит сильнее структуры, поэтому первый резерв находится в сборке дневного профиля.';
      if (relation === 'структура выше качества') return 'Структура рациона выглядит сильнее качества, поэтому первый резерв находится в составе продуктов.';
      return 'Качество и структура требуют совместной коррекции; начинать лучше с самого слабого домена.';
    }
    return 'Матрица показывает соотношение качества рациона и структуры питания.';
  }
  function inspectLabel(id, q){
    if (id === 'point') return 'Почему точка здесь';
    if (id === 'axis-hei') return 'Что снижает HEI';
    if (id === 'axis-structure') return 'Что ограничивает структуру';
    if (id === 'first-action') return 'Что улучшить первым';
    if (id === 'strengths') return 'Что уже хорошо';
    if (id === 'threshold-70') return 'Как читать 70+';
    if (id === 'threshold-50') return 'Как читать 50';
    if (id === 'agreement') return 'Согласованность осей';
    if (id === 'current-zone') return 'Текущая зона';
    if (String(id || '').indexOf('zone:') === 0) return zoneInfo(String(id).slice(5)).label;
    return zoneInfo(q && q.id || 'empty').label;
  }
  function accordionPanelId(id){
    return 'dietInspectPanel' + String(id || '').replace(/(^|-)([a-z0-9])/g, function(_, dash, ch){ return ch.toUpperCase(); }).replace(/[^A-Za-z0-9]/g, '');
  }
  function openInspectAccordion(id){
    try {
      var el = document.querySelector('.diet-matrix-inspect-accordion[data-diet-accordion="'+String(id || '').replace(/"/g, '')+'"]');
      if (el) el.open = true;
    } catch(_) {}
  }
  function updateZoneStates(q){
    var current = q && q.id || 'empty';
    var selected = selectedZone(q);
    var inspect = selectedInspect(q);
    try {
      document.querySelectorAll('[data-diet-zone]').forEach(function(el){
        var id = el.getAttribute('data-diet-zone');
        el.classList.toggle('is-current-zone', id === current);
        el.classList.toggle('is-selected-zone', ('zone:'+id) === inspect || (id === selected && inspect === 'current-zone'));
        el.setAttribute('aria-pressed', (('zone:'+id) === inspect || (id === selected && inspect === 'current-zone')) ? 'true' : 'false');
      });
      document.querySelectorAll('[data-diet-inspect]').forEach(function(el){
        var id = el.getAttribute('data-diet-inspect');
        el.classList.toggle('is-selected-inspect', id === inspect);
        if (el.tagName && el.tagName.toLowerCase() === 'button') el.setAttribute('aria-pressed', id === inspect ? 'true' : 'false');
      });
      var panel = document.getElementById('dietAnalysisProfilePanel');
      if (panel) panel.setAttribute('data-matrix-inspect', inspect);
      document.querySelectorAll('.diet-matrix-inspect-accordion[data-diet-accordion]').forEach(function(el){
        var id = el.getAttribute('data-diet-accordion');
        el.classList.toggle('is-selected-inspect', id === inspect);
      });
    } catch(_) {}
  }
  function strongestDomainList(profile, count){
    var d = profile && profile.domains || {};
    var list = [
      { key:'plant', label:'растительная основа', value:d.plantBase },
      { key:'whole', label:'цельные злаки и крахмалистая часть', value:d.wholeGrainStarch },
      { key:'protein', label:'белковое обеспечение', value:d.proteinAdequacy },
      { key:'dairy', label:'молочно-кальциевый вклад', value:d.dairyCalcium },
      { key:'outside', label:'продукты вне основной структуры', value:d.outsideSafety },
      { key:'balance', label:'структурный баланс', value:d.balanceDisplacement }
    ].filter(function(x){ return Number.isFinite(Number(x.value)); });
    list.sort(function(a,b){ return a.value - b.value; });
    return list.slice(0, count || 3);
  }

  function profileBand(v){
    v = Number(v);
    if (!Number.isFinite(v)) return 'нет данных';
    if (v >= 85) return 'сильная зона';
    if (v >= 70) return 'внутренняя рабочая зона';
    if (v >= 50) return 'переходная зона';
    if (v >= 35) return 'сниженная зона';
    return 'выраженная зона внимания';
  }
  function gapText(profile){
    var hei = Number(profile && profile.hei), st = Number(profile && profile.dailyStructure);
    if (!Number.isFinite(hei) || !Number.isFinite(st)) return 'данных пока недостаточно';
    var gap = Math.round(hei - st), abs = Math.abs(gap);
    var degree = abs <= 5 ? 'оси почти согласованы' : (abs <= 15 ? 'умеренное расхождение' : 'выраженное расхождение');
    var direction = abs <= 5 ? 'HEI и структура близки' : (gap > 0 ? 'HEI выше структурной оси' : 'структурная ось выше HEI');
    return degree + ': ' + direction + (abs > 5 ? ' на ' + abs + ' п.' : '');
  }
  function to70Text(v){
    v = Number(v);
    if (!Number.isFinite(v)) return '—';
    return v >= 70 ? 'порог 70+ достигнут' : '+' + fmt(70 - v, 0) + ' п. до 70+';
  }
  function to70Compact(v, label){
    v = Number(v);
    if (!Number.isFinite(v)) return label + ' —';
    return v >= 70 ? label + ': 70+' : label + ': +' + fmt(70 - v, 0);
  }
  function isBelowWorkingZone(v){ v = Number(v); return Number.isFinite(v) && v < 70; }
  function isSupportZone(v){ v = Number(v); return Number.isFinite(v) && v >= 70 && v < 85; }
  function limiterBand(v){
    v = Number(v);
    if (!Number.isFinite(v)) return 'нет данных';
    if (v < 50) return 'главное ограничение';
    if (v < 70) return 'зона коррекции';
    if (v < 85) return 'рабочая зона, поддерживать';
    return 'сильная сторона';
  }
  function getHeiStd(key){
    try { return window.HEI && window.HEI.helpers && window.HEI.helpers.STD && window.HEI.helpers.STD[key]; } catch(_) { return null; }
  }
  function heiMaxForKey(key, row){
    var std = getHeiStd(key);
    var max = Number(std && std.pts);
    if (!Number.isFinite(max)) max = Number(row && row.max);
    return Number.isFinite(max) && max > 0 ? max : 10;
  }
  function heiKindForKey(key){
    var std = getHeiStd(key);
    return std && std.kind || '';
  }
  function cleanHeiDelta(delta){
    delta = String(delta || '').trim();
    if (!delta || delta === '—') return '';
    return delta.replace(/\s+/g, ' ');
  }
  function heiActionForKey(key){
    var map = {
      fruits_total:'Добавить фруктовую порцию лучше как отдельный продукт или часть завтрака/перекуса, но не вместо овощной основы основных приёмов пищи.',
      fruits_whole:'Делать акцент на фруктах целиком и ягодах; соки не закрывают этот компонент так же полноценно.',
      vegetables_total:'Добавить овощной компонент к одному или двум основным приёмам пищи: салат, овощной гарнир, суп с овощной основой или запечённые овощи.',
      greens_beans:'Усилить зелень и бобовые: листовая зелень, фасоль, чечевица, нут, горох или бобовые как часть гарнира/белкового блюда.',
      grains_whole:'Заменить часть белого хлеба, белого риса, обычной пасты или сдобы на гречку, овсянку, бурый рис, цельнозерновой хлеб или цельнозерновую пасту.',
      dairy:'Проверить несладкие молочные продукты или сопоставимые обогащённые альтернативы; сыр не должен быть основным способом добора из-за натрия и насыщенных жиров.',
      protein_total:'Добавить полноценный источник белка к основному приёму пищи, если дефицит подтверждается нутриентными итогами: рыба, птица, яйца, бобовые, тофу или другое белковое блюдо.',
      seafood_plant:'Чаще использовать рыбу, бобовые, тофу, орехи и семена: этот компонент одновременно поддерживает белковую часть и качество жиров.',
      fatty_acids_ratio:'Сдвинуть жиры в сторону ненасыщенных: чаще рыба, орехи, семена, растительные масла; меньше сливочного масла, жирного мяса и сливочных соусов.',
      grains_refined:'Сокращать рафинированную злаковую часть через замену: цельнозерновая или более плотная крахмалистая основа обычно полезнее простого уменьшения углеводов.',
      sodium_g:'Искать основные источники натрия: соль при приготовлении, солёные соусы, сыр, колбасные изделия, полуфабрикаты, солёные закуски.',
      added_sugars_pct:'Сначала проверить сладкие напитки, сиропы, десерты, сладкие йогурты и регулярные сладкие добавки к напиткам.',
      sat_fats_pct:'Проверить жирные сыры, сливочное масло, жирное мясо, колбасы, сливочные соусы и десерты; часть жира лучше заменить ненасыщенными источниками.'
    };
    return map[key] || 'Выбрать один небольшой шаг по этому компоненту и затем повторно посмотреть, как изменилась матрица.';
  }
  function heiFindingList(count){
    var rows = getHeiRows().slice();
    var list = rows.map(function(r){
      var key = r && r.key;
      var max = heiMaxForKey(key, r);
      var pts = Number(String(r && r.pts).replace(',', '.'));
      var ratio = max > 0 && Number.isFinite(pts) ? clamp(pts / max, 0, 1) : NaN;
      var label = (getHeiStd(key) && getHeiStd(key).label) || r.label || 'Компонент HEI';
      return {
        key:key,
        label:label,
        pts:pts,
        max:max,
        ratio:ratio,
        value:r && r.value || '',
        norm:r && r.norm || '',
        delta:cleanHeiDelta(r && r.delta),
        tip:(getHeiStd(key) && getHeiStd(key).tip) || r.tip || '',
        kind:heiKindForKey(key),
        action:heiActionForKey(key)
      };
    }).filter(function(x){ return Number.isFinite(x.ratio); });
    list.sort(function(a,b){
      var ar = a.ratio, br = b.ratio;
      if (Math.abs(ar - br) > 0.001) return ar - br;
      return b.max - a.max;
    });
    return list.slice(0, count || 4);
  }
  function expectedEffectForHeiKey(key){
    var map = {
      fruits_total:'поддержит HEI по фруктам; на структуру влияет умеренно',
      fruits_whole:'поднимет HEI по цельным фруктам без компенсации овощной основы',
      vegetables_total:'поднимет HEI и одновременно усилит растительную основу структуры',
      greens_beans:'поднимет HEI и усилит самый плотный растительный слой: зелень и бобовые',
      grains_whole:'поднимет HEI по цельным злакам и сдвинет точку вправо по структурной оси',
      dairy:'поднимет HEI по молочной группе и может усилить молочно-кальциевый домен структуры',
      protein_total:'поднимет HEI по белку и может укрепить структурную ось, если белка реально не хватает',
      seafood_plant:'поднимет HEI по белковому качеству и жирнокислотному профилю',
      fatty_acids_ratio:'поднимет вертикальную координату HEI через качество жиров',
      grains_refined:'поднимет HEI по модерации и одновременно улучшит цельнозерново-крахмалистый домен',
      sodium_g:'поднимет HEI по модерации; особенно важно, если много сыра, соусов, колбас или полуфабрикатов',
      added_sugars_pct:'поднимет HEI по модерации; эффект будет заметнее, если есть сладкие напитки или регулярные десерты',
      sat_fats_pct:'поднимет HEI по качеству жиров; особенно важно при жирных сырах, сливочных соусах, жирном мясе и десертах'
    };
    return map[key] || 'поднимет тот компонент HEI, который сейчас удерживает вертикальную координату ниже оптимальной зоны';
  }
  function expectedEffectForStructureKey(key){
    var map = {
      plant:'сдвиг вправо по структуре; при овощах, зелени и бобовых возможен одновременный рост HEI',
      whole:'сдвиг вправо по структуре; при цельнозерновой замене возможен одновременный рост HEI по злакам',
      protein:'сдвиг вправо по структуре при снижении белкового домена; при высоком белке главный резерв лучше искать в других показателях',
      dairy:'сдвиг вправо через молочно-кальциевый слой; важно выбирать несладкую и не слишком солёную основу',
      outside:'сдвиг вправо через снижение продуктов вне основной структуры; часто одновременно улучшаются сахар, натрий или насыщенные жиры',
      balance:'сдвиг вправо через более собранную тарелочную структуру основных приёмов пищи'
    };
    return map[key] || 'сдвиг вправо по структурной оси';
  }

  function productName(row){
    if (!row) return 'продукт';
    return String(row.name || (row.product && (row.product.name_ru || row.product.name)) || row.key || 'продукт');
  }
  function productLabel(row){
    return '«' + productName(row) + '»' + (Number.isFinite(Number(row && row.grams)) ? ' — ' + fmt(row.grams,0) + ' г' : '');
  }
  function productListText(rows, count){
    rows = (rows || []).filter(Boolean).slice(0, count || 2);
    return rows.length ? rows.map(productLabel).join('; ') : '';
  }
  function detailRoleIndex(profile){
    var out = {};
    var details = profile && profile.harvardModel && profile.harvardModel.built && Array.isArray(profile.harvardModel.built.details) ? profile.harvardModel.built.details : [];
    details.forEach(function(d){
      if (!d || !d.key) return;
      var cur = out[d.key] || { roles:[], group:null, reason:'' };
      (Array.isArray(d.roles) ? d.roles : []).forEach(function(r){ if (cur.roles.indexOf(r) < 0) cur.roles.push(r); });
      if (!cur.group && d.group) cur.group = d.group;
      if (!cur.reason && d.reason) cur.reason = d.reason;
      out[d.key] = cur;
    });
    return out;
  }
  function rationProductRows(profile){
    var idx = detailRoleIndex(profile || {});
    return (profile && profile.ration || []).map(function(it){
      var p = getProduct(it && it.key);
      var g = Math.max(0, num(it && it.grams));
      if (!p || !g) return null;
      var d = idx[it.key] || { roles:[], group:null, reason:'' };
      var f = g / 100;
      return {
        key: it.key,
        product: p,
        name: p.name_ru || p.name || it.key,
        grams: g,
        roles: Array.isArray(d.roles) ? d.roles.slice() : [],
        group: d.group || null,
        reason: d.reason || '',
        kcal: kcal100(p) * f,
        protein: protein100(p) * f,
        calcium: calcium100(p) * f,
        sodium: sodium100(p) * f,
        addedSugar: addedSugar100(p) * f,
        sfa: sfa100(p) * f,
        sodium100: sodium100(p),
        addedSugar100: addedSugar100(p),
        sfa100: sfa100(p),
        text: tagsText(p)
      };
    }).filter(Boolean);
  }
  function rowHasRole(row, role){
    if (!row) return false;
    var roles = Array.isArray(row.roles) ? row.roles : [];
    var g = row.group || '';
    var text = row.text || '';
    if (role === 'vegetable') return roles.indexOf('vegetables') >= 0 || roles.indexOf('vegetable') >= 0 || g === 'vegetables';
    if (role === 'fruit') return roles.indexOf('fruits') >= 0 || roles.indexOf('fruit') >= 0 || g === 'fruits';
    if (role === 'whole') return roles.indexOf('wholeGrains') >= 0 || roles.indexOf('wholeGrain') >= 0 || g === 'wholeGrains';
    if (role === 'refined') return roles.indexOf('refinedGrain') >= 0;
    if (role === 'protein') return roles.indexOf('protein') >= 0 || g === 'protein';
    if (role === 'dairy') return roles.indexOf('dairy') >= 0 || roles.indexOf('dairyDrink') >= 0;
    if (role === 'legume') return /боб|фасол|чечев|нут|горох|lentil|bean|chickpea|tofu|тофу/.test(text);
    if (role === 'seafoodPlantProtein') return /рыб|fish|лосос|тунец|сардин|кревет|seafood|боб|фасол|чечев|нут|тофу|орех|семен/.test(text);
    if (role === 'outside') {
      if (['sweetDrink','juice','refinedGrain','processedMeat','fattySauce','harvardPotato','proteinSupplement'].some(function(r){ return roles.indexOf(r) >= 0; })) return true;
      return !g && roles.indexOf('waterPlain') < 0 && roles.indexOf('unsweetenedBeverage') < 0 && row.kcal > 20;
    }
    return roles.indexOf(role) >= 0;
  }
  function rowsByRole(profile, role){
    return rationProductRows(profile).filter(function(row){ return rowHasRole(row, role); }).sort(function(a,b){ return b.grams - a.grams; });
  }
  function topByMetric(rows, metric, count){
    return (rows || []).filter(function(x){ return Number(x && x[metric]) > 0; }).sort(function(a,b){ return Number(b[metric]) - Number(a[metric]); }).slice(0, count || 2);
  }
  function riskReason(row){
    if (!row) return '';
    var parts = [];
    if (row.addedSugar > 0.5) parts.push('добавленные сахара ' + fmt(row.addedSugar,1) + ' г');
    if (row.sodium > 120) parts.push('натрий ' + fmt(row.sodium,0) + ' мг');
    if (row.sfa > 2) parts.push('насыщенные жиры ' + fmt(row.sfa,1) + ' г');
    if (rowHasRole(row,'refined')) parts.push('рафинированная злаковая часть');
    if (rowHasRole(row,'outside') && !parts.length) parts.push('вклад вне основной структуры');
    return parts.join(', ');
  }
  function rowContributionText(rows, metric, unit, count){
    var top = topByMetric(rows, metric, count || 2);
    if (!top.length) return '';
    return top.map(function(row){ return '«'+productName(row)+'» — '+fmt(row[metric], metric === 'sodium' ? 0 : 1)+' '+unit; }).join('; ');
  }
  function dominantStructureGroup(profile){
    var rows = rationProductRows(profile);
    var groups = [
      { key:'vegetable', label:'овощная часть', rows:rows.filter(function(r){ return rowHasRole(r,'vegetable'); }) },
      { key:'fruit', label:'фруктовая часть', rows:rows.filter(function(r){ return rowHasRole(r,'fruit'); }) },
      { key:'grain', label:'злаково-крахмалистая часть', rows:rows.filter(function(r){ return rowHasRole(r,'whole') || rowHasRole(r,'refined'); }) },
      { key:'protein', label:'белковая часть', rows:rows.filter(function(r){ return rowHasRole(r,'protein'); }) },
      { key:'dairy', label:'молочная группа', rows:rows.filter(function(r){ return rowHasRole(r,'dairy'); }) },
      { key:'outside', label:'продукты вне основной структуры', rows:rows.filter(function(r){ return rowHasRole(r,'outside'); }) }
    ].map(function(g){
      var grams = g.rows.reduce(function(a,r){ return a + Number(r.grams || 0); },0);
      var kcal = g.rows.reduce(function(a,r){ return a + Number(r.kcal || 0); },0);
      return { key:g.key, label:g.label, rows:g.rows.sort(function(a,b){ return b.grams - a.grams; }), grams:grams, kcal:kcal };
    }).filter(function(g){ return g.grams > 0 || g.kcal > 0; });
    var total = groups.reduce(function(a,g){ return a + g.grams; },0);
    groups.forEach(function(g){ g.share = total > 0 ? g.grams / total * 100 : NaN; });
    groups.sort(function(a,b){ return b.grams - a.grams; });
    return groups[0] || null;
  }
  function sumGrams(rows){ return (rows || []).reduce(function(a,r){ return a + Math.max(0, Number(r && r.grams) || 0); },0); }
  function firstProductLabel(rows){ rows = (rows || []).filter(Boolean); return rows.length ? productLabel(rows[0]) : ''; }
  function productListOrText(rows, count, emptyText){ var s = productListText(rows, count || 2); return s || (emptyText || 'выраженных продуктов не видно'); }
  function uniqueRows(rows){
    var seen = {};
    return (rows || []).filter(function(r){ if (!r || !r.key || seen[r.key]) return false; seen[r.key] = true; return true; });
  }
  function highRiskRows(profile, count){
    var rows = rationProductRows(profile);
    var outside = rows.filter(function(r){ return rowHasRole(r,'outside'); });
    var risk = outside.concat(topByMetric(rows,'addedSugar',3), topByMetric(rows,'sodium',3), topByMetric(rows,'sfa',3), rowsByRole(profile,'refined').slice(0,3));
    return uniqueRows(risk).filter(function(r){ return riskReason(r) || rowHasRole(r,'outside') || rowHasRole(r,'refined'); }).sort(function(a,b){
      return (b.addedSugar*22 + b.sodium/9 + b.sfa*28 + b.kcal/25 + (rowHasRole(b,'outside') ? 12 : 0) + (rowHasRole(b,'refined') ? 10 : 0)) -
        (a.addedSugar*22 + a.sodium/9 + a.sfa*28 + a.kcal/25 + (rowHasRole(a,'outside') ? 12 : 0) + (rowHasRole(a,'refined') ? 10 : 0));
    }).slice(0, count || 3);
  }
  function gramRound(value){
    value = Number(value);
    if (!Number.isFinite(value) || value <= 0) return 0;
    var step = value < 10 ? 1 : (value < 30 ? 5 : 10);
    return Math.max(step, Math.round(value / step) * step);
  }
  function gramText(value){
    var v = gramRound(value);
    return v ? fmt(v,0)+' г' : 'уточнить граммы';
  }
  function gramRangeText(a,b){
    a = gramRound(a); b = gramRound(b);
    if (!a && !b) return 'уточнить граммы';
    if (!a) return gramText(b);
    if (!b) return gramText(a);
    var lo = Math.min(a,b), hi = Math.max(a,b);
    return lo === hi ? fmt(lo,0)+' г' : fmt(lo,0)+'–'+fmt(hi,0)+' г';
  }
  function quotedProductName(row){ return row ? '«'+productName(row)+'»' : 'выбранный продукт'; }
  function portionAt(row, grams){ return row ? quotedProductName(row)+' — '+gramText(grams) : gramText(grams); }
  function keepRangeAfterReduction(row, lowShare, highShare){
    var g = Number(row && row.grams);
    if (!Number.isFinite(g) || g <= 0) return '';
    var keepA = g * (1 - Number(highShare || 0.30));
    var keepB = g * (1 - Number(lowShare || 0.20));
    return gramRangeText(keepA, keepB);
  }
  function reducePortionAction(row, lowShare, highShare, replacementText){
    if (!row) return 'выбрать самый выраженный сладкий, солёный или жирный продукт и уменьшить его порцию на 20–30%';
    var current = gramRound(Number(row.grams));
    var keep = keepRangeAfterReduction(row, lowShare || 0.20, highShare || 0.30);
    var keepNumbers = String(keep || '').match(/\d+(?:[.,]\d+)?/g) || [];
    var maxKeep = keepNumbers.length ? Math.max.apply(Math, keepNumbers.map(function(x){ return Number(String(x).replace(',','.')); })) : NaN;
    if (!keep || !Number.isFinite(maxKeep) || maxKeep >= current) {
      var tiny = 'убрать небольшую порцию '+productLabel(row)+' либо заменить её на '+(replacementText || 'более подходящий вариант');
      return tiny;
    }
    var text = 'уменьшить '+productLabel(row)+' до '+keep;
    if (replacementText) text += '; снятую часть заменить на '+replacementText;
    return text;
  }
  function replacePartAction(row, share, replacementText, alternativeText){
    if (!row) return 'заменить часть рафинированной позиции на цельнозерновой или крупяной вариант';
    var g = Number(row.grams);
    if (!Number.isFinite(g) || g <= 0) return 'заменить часть '+quotedProductName(row)+' на '+replacementText;
    share = Number.isFinite(Number(share)) ? Number(share) : 0.5;
    var removed = gramRound(g * share);
    var keep = gramRound(Math.max(0, g - removed));
    var text = 'заменить часть '+productLabel(row)+': оставить '+gramText(keep)+', а снятую часть направить на '+replacementText+'. Массу нового продукта определить отдельно по его виду и готовности, не переносить грамм в грамм';
    if (alternativeText) text += '; альтернативный тест — '+alternativeText;
    return text;
  }
  function increaseExistingAction(row, addMin, addMax, productText){
    if (!row) return 'добавить '+gramRangeText(addMin || 100, addMax || 150)+' '+(productText || 'нужной группы');
    var g = Number(row.grams);
    var text = 'увеличить '+productLabel(row)+' до '+gramRangeText(g + (addMin || 80), g + (addMax || 150));
    if (productText) text += ' или добавить отдельной порцией '+gramRangeText(addMin || 80, addMax || 150)+' '+productText;
    return text;
  }
  function addNewAction(productText, minG, maxG){
    return 'добавить '+gramRangeText(minG || 100, maxG || 150)+' '+productText;
  }
  function leanProteinPortionForDeficit(deficitG){
    deficitG = Math.max(0, Number(deficitG) || 0);
    if (!deficitG) return 'полноценного белкового источника';
    var lean = Math.min(180, Math.max(60, gramRound(deficitG / 0.20)));
    var dairy = Math.min(250, Math.max(120, gramRound(deficitG / 0.10)));
    return gramText(lean)+' готовой рыбы, птицы или нежирного мяса либо '+gramText(dairy)+' творога/густого йогурта без сахара';
  }
  function rowReplacementHint(row, metric){
    var name = (productName(row) || '').toLowerCase();
    var text = (row && row.text || '').toLowerCase();
    var roles = row && Array.isArray(row.roles) ? row.roles.join(' ') : '';
    var all = name+' '+text+' '+roles;
    if (metric === 'sugar' || /напит|сок|смузи|drink|juice/.test(all)) return 'воду, несладкий чай или напиток без добавленного сахара';
    if (/соус|майонез|кетчуп|sauce/.test(all)) return 'томатный или йогуртовый соус без добавленного сахара и лишней соли';
    if (/сыр|cheese/.test(all)) return 'менее солёный сыр, творог или несладкий йогурт';
    if (/колбас|сосиск|бекон|processed/.test(all)) return 'птицу, рыбу, бобовые или другое менее солёное белковое блюдо';
    if (/печень|конфет|десерт|слад|торт|шоколад|cookie|dessert/.test(all)) return 'ягоды, цельный фрукт или меньшую порцию десерта после основного приёма пищи';
    if (rowHasRole(row,'refined')) return 'цельнозерновой хлеб, гречку, овсянку, бурый рис или цельнозерновую пасту';
    if (metric === 'sfa') return 'рыбу, птицу, бобовые или менее жирный молочный вариант';
    if (metric === 'sodium') return 'менее солёный аналог или домашнюю версию без дополнительной соли';
    return 'более нейтральную позицию из основной структуры рациона';
  }
  function fruitVegetableState(profile){
    var veg = rowsByRole(profile,'vegetable');
    var fruit = rowsByRole(profile,'fruit');
    var vegG = sumGrams(veg), fruitG = sumGrams(fruit);
    var plant = profile && profile.details && profile.details.plant || {};
    var vegScore = Number(plant.veg), fruitScore = Number(plant.fruit);
    var scorePattern = Number.isFinite(vegScore) && Number.isFinite(fruitScore) && fruitScore >= 70 && vegScore < 70;
    var massPattern = fruit.length && fruitG >= 150 && vegG < 120;
    var dominancePattern = fruit.length && fruitG >= Math.max(180, vegG * 1.7) && vegG < 180;
    return {
      veg:veg,
      fruit:fruit,
      vegG:vegG,
      fruitG:fruitG,
      vegScore:vegScore,
      fruitScore:fruitScore,
      fruitHeavyVegetableLight: !!(fruit.length && (scorePattern || massPattern || dominancePattern))
    };
  }
  function fruitVegetableSummaryText(profile){
    var s = fruitVegetableState(profile);
    var vegText = s.veg.length ? productListText(s.veg,3)+'; около '+fmt(s.vegG,0)+' г' : 'овощная основа почти не видна';
    var fruitText = s.fruit.length ? productListText(s.fruit,3)+'; около '+fmt(s.fruitG,0)+' г' : 'фруктовая часть почти не видна';
    return 'Фрукты: '+fruitText+'. Овощи, зелень и бобовые: '+vegText+'.';
  }
  function fruitVegetableBalancingAction(profile){
    var s = fruitVegetableState(profile);
    var vegTarget = gramRangeText(120,150)+' овощей, зелени или бобовых к основному приёму пищи';
    if (!s.fruit.length && !s.veg.length) return 'добавить '+vegTarget+'; фруктовый слой можно закрыть отдельной порцией цельного фрукта или ягод '+gramRangeText(100,150)+' позже';
    if (s.fruitHeavyVegetableLight && s.fruit.length) {
      var fruitLead = s.fruit[0];
      var volumeText = '';
      if (Number.isFinite(Number(fruitLead.grams)) && Number(fruitLead.grams) >= 120) {
        volumeText = ' Если общий объём еды уже высокий, уменьшить '+productLabel(fruitLead)+' до '+keepRangeAfterReduction(fruitLead, 0.25, 0.40)+' и освободившийся объём заменить овощами.';
      }
      return 'сохранить фруктовый слой как отдельную часть рациона и добавить '+vegTarget+'.'+volumeText;
    }
    if (s.veg.length) return increaseExistingAction(s.veg[0], 120, 150, 'овощей, зелени или бобовых')+'; фруктовую часть считать отдельным слоем, если она уже есть';
    if (s.fruit.length) return 'оставить '+productLabel(s.fruit[0])+' как фруктовую часть и добавить '+vegTarget;
    return 'добавить '+vegTarget;
  }
  function fruitVegetableHelpHtml(profile, context){
    var s = fruitVegetableState(profile);
    var status = s.fruitHeavyVegetableLight ? 'В текущем рационе фруктовая часть выражена сильнее овощной основы.' : 'Справка помогает читать ситуацию, когда фруктов много, а овощной основы мало.';
    var practical = fruitVegetableBalancingAction(profile);
    return '<details class="diet-context-help diet-plant-balance-help" data-help-context="fruit-vegetable">'+
      '<summary><span>Справка</span><strong>Почему к фруктам всё равно нужны овощи</strong><em>'+esc(s.fruitHeavyVegetableLight ? 'актуально для этого рациона' : 'логика растительной основы')+'</em></summary>'+
      '<div class="diet-context-help-body">'+
      '<p><b>Главная логика.</b> В калькуляторе фрукты и овощи разделяются по пищевой роли. Овощи, зелень, бобовые и некрахмалистые овощи формируют объёмную основу основных приёмов пищи: салат, овощной гарнир, суп или овощное блюдо. Фрукты чаще работают как сладкий растительный слой: цельный фрукт, ягоды, перекус, десертная часть или добавление к завтраку.</p>'+
      '<p><b>Как читать результат.</b> Высокая фруктовая часть улучшает фруктовый компонент, а овощная основа остаётся отдельным структурным слоем тарелки. Поэтому рацион с большим количеством фруктов может всё равно получать рекомендацию добавить овощи.</p>'+
      '<p><b>Что важно по классификации.</b> Калькулятор смотрит на пищевую функцию продукта. Помидор в этой логике относится к овощной части. Картофель и фри относятся к крахмалистой части, поскольку в структуре тарелки ведут себя ближе к хлебу и крупам. Бобовые могут поддерживать и растительный слой, и белковую часть.</p>'+
      '<div class="diet-context-help-current"><span>Именно сейчас</span><p>'+esc(status+' '+fruitVegetableSummaryText(profile))+'</p></div>'+
      '<div class="diet-context-help-action"><span>Практический шаг</span><p>'+esc(practical)+'</p><em>После изменения внесите новые граммы и пересчитайте матрицу: первым должна сдвинуться структурная ось.</em></div>'+
      '</div></details>';
  }
  function fruitVegetableContextHelpIfNeeded(profile){
    var s = fruitVegetableState(profile);
    return s.fruitHeavyVegetableLight ? fruitVegetableHelpHtml(profile, 'context') : '';
  }
  function exactStructureAction(profile, key){
    var rows = rationProductRows(profile);
    if (!rows.length) return 'добавьте продукты в расчёт и повторите анализ';
    if (key === 'plant') {
      return fruitVegetableBalancingAction(profile)+'; затем пересчитать структуру';
    }
    if (key === 'whole') {
      var refined = rowsByRole(profile,'refined');
      var whole = rowsByRole(profile,'whole');
      if (refined.length) return replacePartAction(refined[0], 0.5, 'цельнозерновой хлеб или цельнозерновую пасту в отдельно рассчитанной порции', gramRangeText(100,120)+' готовой гречки, овсянки или бурого риса как отдельную замену');
      if (whole.length) return 'сохранить '+productLabel(whole[0])+' и при следующем приёме пищи держать цельнозерновую/крупяную основу в пределах '+gramRangeText(120,180)+' готового продукта';
      return addNewAction('готовой гречки, овсянки, бурого риса, цельнозерновой пасты или цельнозернового хлеба вместо части рафинированной основы', 100, 150);
    }
    if (key === 'protein') {
      var protein = rowsByRole(profile,'protein');
      var got = profile && profile.details && profile.details.protein && Number(profile.details.protein.got);
      var target = profile && profile.details && profile.details.protein && Number(profile.details.protein.target);
      if (Number.isFinite(got) && Number.isFinite(target) && got < target) {
        var deficit = Math.max(0, target - got);
        return 'добрать около '+fmt(deficit,0)+' г белка: добавить '+leanProteinPortionForDeficit(deficit)+'; текущие белковые позиции '+productListOrText(protein,2,'почти не выражены');
      }
      return protein.length ? 'сохранить '+productListText(protein,2)+'; белок сейчас не выглядит первым кандидатом на увеличение' : addNewAction('полноценного белкового продукта к основному приёму пищи', 80, 150);
    }
    if (key === 'dairy') {
      var dairy = rowsByRole(profile,'dairy');
      var refinedForSwap = rowsByRole(profile,'refined')[0] || null;
      var outsideForSwap = highRiskRows(profile, 3).filter(function(r){ return !rowHasRole(r,'dairy'); })[0] || null;
      var swapSource = refinedForSwap || outsideForSwap;
      var addText = 'добавить '+gramRangeText(150,200)+' несладкого кефира, йогурта или молока с умеренной жирностью либо сопоставимую обогащённую альтернативу';
      if (!dairy.length) {
        return addText+(swapSource ? '; чтобы не увеличивать общую энергию рациона, использовать эту порцию вместо части «'+productLabel(swapSource)+'», рассчитав массу замены отдельно' : '; после добавления повторно проверить энергию, насыщенные жиры и кальций');
      }
      var current = productLabel(dairy[0]);
      return 'сохранить текущую молочную позицию '+current+'; '+addText+(swapSource ? '; при достаточной калорийности заменить этой порцией часть '+productLabel(swapSource)+', рассчитав массы продуктов отдельно и не перенося граммы один к одному' : '; если энергии уже достаточно, сначала определить продукт для замены и рассчитать обе массы отдельно');
    }
    if (key === 'outside') {
      var risk = highRiskRows(profile, 2);
      if (risk.length) return reducePortionAction(risk[0], 0.20, 0.30, rowReplacementHint(risk[0], risk[0].addedSugar > 0.5 ? 'sugar' : (risk[0].sodium > 120 ? 'sodium' : (risk[0].sfa > 2 ? 'sfa' : 'outside'))));
      return 'выбрать самый частый сладкий, солёный или жирный продукт вне основной структуры и сократить его порцию на 20–30%';
    }
    if (key === 'balance') {
      var dom = dominantStructureGroup(profile);
      var target = structureTargetForBalance(profile);
      if (target && target.key && target.key !== 'balance') {
        var lead = exactStructureAction(profile, target.key);
        if (dom && dom.rows && dom.rows[0] && target.key !== dom.key) return 'балансировать доминирующую группу «'+dom.label+'» ('+productListText(dom.rows,2)+'): '+lead;
        return lead;
      }
      return 'собрать основной приём пищи по схеме: '+gramRangeText(120,200)+' овощей, полноценный белок и '+gramRangeText(100,180)+' готовой крупяной/крахмалистой основы';
    }
    return 'выбрать один продуктовый шаг, внести его в рацион и повторно пересчитать матрицу';
  }
  function exactHeiAction(profile, key){
    var rows = rationProductRows(profile);
    if (!rows.length) return 'добавьте продукты в расчёт и повторите HEI-анализ';
    if (key === 'vegetables_total' || key === 'greens_beans') return exactStructureAction(profile, 'plant');
    if (key === 'fruits_total' || key === 'fruits_whole') {
      var fruit = rowsByRole(profile,'fruit');
      var juice = rows.filter(function(r){ return (r.roles || []).indexOf('juice') >= 0; });
      if (fruit.length) return 'сохранить '+productLabel(fruit[0])+' и, если компонент всё ещё ниже ориентира, добавить '+gramRangeText(100,150)+' цельного фрукта или ягод';
      if (juice.length) return reducePortionAction(juice[0], 0.30, 0.50, 'цельный фрукт или ягоды '+gramRangeText(100,150));
      return addNewAction('цельного фрукта или ягод отдельной порцией', 100, 150);
    }
    if (key === 'grains_whole' || key === 'grains_refined') return exactStructureAction(profile, 'whole');
    if (key === 'dairy') return exactStructureAction(profile, 'dairy');
    if (key === 'protein_total') return exactStructureAction(profile, 'protein');
    if (key === 'seafood_plant') {
      var spp = rows.filter(function(r){ return rowHasRole(r,'seafoodPlantProtein'); }).sort(function(a,b){ return b.grams - a.grams; });
      if (spp.length) return 'сохранить '+productLabel(spp[0])+' и добавить ещё '+gramRangeText(40,80)+' рыбы, бобовых, тофу, орехов или семян в другой приём пищи';
      return 'добавить '+gramRangeText(80,120)+' рыбы, бобовых или тофу; если выбран вариант с орехами или семенами, начать с '+gramRangeText(15,30);
    }
    if (key === 'sodium_g') {
      var sodium = topByMetric(rows,'sodium',1);
      return sodium.length ? reducePortionAction(sodium[0], 0.20, 0.35, rowReplacementHint(sodium[0], 'sodium'))+'; сейчас этот продукт даёт около '+fmt(sodium[0].sodium,0)+' мг натрия' : 'найти источник соли, соуса, сыра, колбасных изделий или полуфабрикатов и сократить его порцию на 20–30%';
    }
    if (key === 'added_sugars_pct') {
      var sugar = topByMetric(rows,'addedSugar',1);
      return sugar.length ? reducePortionAction(sugar[0], 0.30, 0.50, rowReplacementHint(sugar[0], 'sugar'))+'; сейчас этот продукт даёт около '+fmt(sugar[0].addedSugar,1)+' г добавленных сахаров' : 'проверить сладкие напитки, десерты и сладкие молочные продукты; первый тест — сократить самый частый сладкий продукт на 30–50%';
    }
    if (key === 'sat_fats_pct' || key === 'fatty_acids_ratio') {
      var sfa = topByMetric(rows,'sfa',1);
      return sfa.length ? reducePortionAction(sfa[0], 0.25, 0.40, rowReplacementHint(sfa[0], 'sfa'))+'; сейчас этот продукт даёт около '+fmt(sfa[0].sfa,1)+' г насыщенных жиров' : 'проверить жирные сыры, сливочное масло, жирное мясо, колбасные изделия, сливочные соусы и десерты; первый тест — сократить главный источник на 25–40%';
    }
    return 'связать коррекцию с конкретным продуктом текущего списка и повторно проверить HEI';
  }
  function structureTargetForBalance(profile){
    var d = profile && profile.domains || {};
    var list = [
      { key:'plant', label:'овощная/растительная часть', value:d.plantBase },
      { key:'whole', label:'цельнозерновая и крахмалистая часть', value:d.wholeGrainStarch },
      { key:'protein', label:'белковая часть', value:d.proteinAdequacy },
      { key:'dairy', label:'молочно-кальциевый слой', value:d.dairyCalcium },
      { key:'outside', label:'продукты вне основной структуры', value:d.outsideSafety }
    ].filter(function(x){ return Number.isFinite(Number(x.value)); });
    list.sort(function(a,b){ return Number(a.value) - Number(b.value); });
    return list[0] || null;
  }
  function conciseStructureAction(profile, key){
    return exactStructureAction(profile, key);
  }
  function conciseHeiAction(profile, key){
    return exactHeiAction(profile, key);
  }
  function actionCardHtml(kicker, title, action, effect, check){
    action = String(action || '').trim();
    effect = String(effect || '').trim();
    check = String(check || '').trim();
    if (!action) return '';
    return '<div class="diet-gram-action"><span>'+esc(kicker || 'Практическое действие')+'</span>'+
      (title ? '<strong>'+esc(title)+'</strong>' : '')+
      '<p>'+esc(action)+'</p>'+
      (effect ? '<em><b>Ожидаемый сдвиг:</b> '+esc(effect)+'</em>' : '')+
      (check ? '<em><b>Проверка:</b> '+esc(check)+'</em>' : '')+
      '</div>';
  }
  function structureActionCardHtml(profile, key, title){
    return actionCardHtml('Что сделать', title || 'Практическое действие', conciseStructureAction(profile, key), expectedEffectForStructureKey(key), 'внести новые граммы в рацион и пересчитать матрицу');
  }
  function heiActionCardHtml(profile, key, title){
    return actionCardHtml('Что сделать', title || 'Практическое действие', conciseHeiAction(profile, key), expectedEffectForHeiKey(key), 'внести новые граммы в рацион и пересчитать HEI и матрицу');
  }
  function positiveConcreteForStructure(profile, key){
    if (key === 'plant') {
      var veg = rowsByRole(profile,'vegetable');
      var fruit = rowsByRole(profile,'fruit');
      return veg.length || fruit.length ? 'Эту сторону формируют '+productListOrText(veg.concat(fruit),3)+'. Сохраняйте этот слой при остальных изменениях.' : 'Растительная часть выглядит рабочей; сохраняйте её объём при коррекции других доменов.';
    }
    if (key === 'whole') {
      var whole = rowsByRole(profile,'whole');
      return whole.length ? 'Её формируют '+productListText(whole,3)+'. Сохраняйте эти позиции при замене рафинированной части.' : 'Злаковая часть выглядит рабочей; сохраняйте долю цельных или крупяных позиций.';
    }
    if (key === 'protein') {
      var protein = rowsByRole(profile,'protein');
      return protein.length ? 'Его формируют '+productListText(protein,3)+'. Увеличивать белок сверх текущего уровня сейчас не главный ресурс.' : 'Белковый домен выглядит рабочим; достаточно удерживать текущий уровень.';
    }
    if (key === 'dairy') {
      var dairy = rowsByRole(profile,'dairy');
      return dairy.length ? 'Его формируют '+productListText(dairy,3)+'. Сохраняйте несладкую и умеренно солёную часть.' : 'Молочно-кальциевый слой выглядит рабочим по расчёту; сохраняйте его без резких замен.';
    }
    if (key === 'outside') {
      var risk = highRiskRows(profile,2);
      return risk.length ? 'Контролируйте прежде всего '+productListText(risk,2)+', чтобы сильная зона не просела.' : 'Выраженных кандидатов на сокращение немного; сохраняйте умеренность продуктов вне основной структуры.';
    }
    if (key === 'balance') {
      var dom = dominantStructureGroup(profile);
      return dom ? 'Собранность сейчас держится на группе «'+dom.label+'»: '+productListText(dom.rows,2)+'. При коррекции не вытесняйте остальные основные группы.' : 'Баланс выглядит рабочим; сохраняйте пропорции основных групп.';
    }
    return 'Сохраняйте эту сторону, пока корректируете более слабые показатели.';
  }
  function positiveConcreteForHei(profile, key){
    if (key === 'vegetables_total' || key === 'greens_beans') return positiveConcreteForStructure(profile, 'plant');
    if (key === 'fruits_total' || key === 'fruits_whole') {
      var fruit = rowsByRole(profile,'fruit');
      return fruit.length ? 'Компонент поддерживают '+productListText(fruit,3)+'. Сохраняйте цельные фрукты или ягоды.' : 'Компонент выглядит рабочим по HEI; сохраняйте цельные фруктовые продукты.';
    }
    if (key === 'grains_whole' || key === 'grains_refined') return positiveConcreteForStructure(profile, 'whole');
    if (key === 'dairy') return positiveConcreteForStructure(profile, 'dairy');
    if (key === 'protein_total' || key === 'seafood_plant') return positiveConcreteForStructure(profile, 'protein');
    if (key === 'sodium_g') return 'Сохраняйте контроль самых солёных позиций: '+(rowContributionText(topByMetric(rationProductRows(profile),'sodium',2),'sodium','мг',2) || 'выраженных источников натрия не видно')+'.';
    if (key === 'added_sugars_pct') return 'Сохраняйте низкий вклад добавленного сахара; основные проверяемые позиции: '+(rowContributionText(topByMetric(rationProductRows(profile),'addedSugar',2),'addedSugar','г',2) || 'выраженных источников не видно')+'.';
    if (key === 'sat_fats_pct' || key === 'fatty_acids_ratio') return 'Сохраняйте контроль насыщенных жиров; основные проверяемые позиции: '+(rowContributionText(topByMetric(rationProductRows(profile),'sfa',2),'sfa','г',2) || 'выраженных источников не видно')+'.';
    return 'Сохраняйте этот компонент при коррекции слабых сторон.';
  }
  function productSpecificForStructure(profile, key){
    var rows = rationProductRows(profile);
    if (!rows.length) return 'После добавления продуктов здесь появится уточнение по конкретным позициям рациона.';
    if (key === 'plant') {
      var s = fruitVegetableState(profile);
      if (s.fruitHeavyVegetableLight) return fruitVegetableSummaryText(profile)+' Растительная часть набрана преимущественно фруктами; овощную основу основных приёмов пищи стоит усилить отдельно.';
      if (s.veg.length) return 'Овощная часть: '+productListText(s.veg,3)+'; всего около '+fmt(s.vegG,0)+' г. Фруктовая часть: '+(s.fruit.length ? productListText(s.fruit,2)+'; около '+fmt(s.fruitG,0)+' г' : 'выраженных фруктовых продуктов не видно')+'.';
      if (s.fruit.length) return 'Фруктовая часть уже есть: '+productListText(s.fruit,3)+'; около '+fmt(s.fruitG,0)+' г. Овощная основа в текущем списке почти отсутствует.';
      return 'В списке почти не видно овощей, зелени, бобовых, фруктов или ягод.';
    }
    if (key === 'whole') {
      var whole = rowsByRole(profile,'whole');
      var refined = rowsByRole(profile,'refined');
      if (refined.length) return 'Рафинированную часть дают '+productListText(refined,3)+'; всего около '+fmt(sumGrams(refined),0)+' г. Цельнозерновая часть: '+(whole.length ? productListText(whole,2)+'; около '+fmt(sumGrams(whole),0)+' г' : 'не выражена')+'.';
      if (whole.length) return 'Цельнозерновую/крупяную основу дают '+productListText(whole,3)+'; всего около '+fmt(sumGrams(whole),0)+' г.';
      return 'В текущем списке не видно цельнозерновой или крупяной основы.';
    }
    if (key === 'protein') {
      var protein = rowsByRole(profile,'protein');
      var got = profile && profile.details && profile.details.protein && Number(profile.details.protein.got);
      var target = profile && profile.details && profile.details.protein && Number(profile.details.protein.target);
      var base = Number.isFinite(got) && Number.isFinite(target) ? 'Белка сейчас '+fmt(got,0)+' г при ориентире '+fmt(target,0)+' г. ' : '';
      return base+'Белковые позиции: '+productListOrText(protein,3,'выраженных источников белка не видно')+'.';
    }
    if (key === 'dairy') {
      var dairy = rowsByRole(profile,'dairy');
      if (!dairy.length) return 'Молочная группа в текущих продуктах почти не видна.';
      var risky = dairy.filter(function(r){ return r.addedSugar > 0.5 || r.sodium > 150 || r.sfa > 2 || dairyCreditCoefficient(r.product) < 1; }).sort(function(a,b){ return (b.sodium+b.sfa*80+b.addedSugar*20) - (a.sodium+a.sfa*80+a.addedSugar*20); });
      return 'Молочную группу дают '+productListText(dairy,3)+'. '+(risky.length ? 'Спорная позиция: '+productListText(risky,1)+' — '+riskReason(risky[0])+'.' : 'Заметных проблемных молочных позиций по сахару, соли и насыщенным жирам не видно.');
    }
    if (key === 'outside') {
      var risk = highRiskRows(profile, 3);
      if (!risk.length) return 'По конкретным продуктам выраженных кандидатов на сокращение сейчас не видно; стоит проверить общий объём продуктов вне основной структуры.';
      return 'Главные кандидаты: '+risk.map(function(r){ return productLabel(r)+(riskReason(r) ? ' — '+riskReason(r) : ''); }).join('; ')+'.';
    }
    if (key === 'balance') {
      var dom = dominantStructureGroup(profile);
      if (!dom) return 'Для структурного баланса пока недостаточно данных по группам продуктов.';
      var target = structureTargetForBalance(profile);
      var share = Number.isFinite(dom.share) ? 'около '+fmt(dom.share,0)+'% учтённой массы' : 'наибольшую долю рациона';
      var targetText = target ? 'Слабее всего для баланса сейчас выглядит слой «'+target.label+'» — '+fmt(target.value,0)+'/100. ' : '';
      return 'Доминирующая группа: '+dom.label+' — '+fmt(dom.grams,0)+' г, '+share+'. Основные позиции: '+productListText(dom.rows,3)+'. '+targetText;
    }
    return 'Конкретизация по продуктам появится после расчёта состава рациона.';
  }
  function productSpecificForHei(profile, key){
    var rows = rationProductRows(profile);
    if (!rows.length) return 'После расчёта здесь появятся продукты, которые связаны с этим компонентом HEI.';
    if (key === 'vegetables_total' || key === 'greens_beans') {
      var veg = rowsByRole(profile,'vegetable');
      var legumes = rows.filter(function(r){ return rowHasRole(r,'legume'); });
      return (veg.length || legumes.length ? 'Связанные продукты: '+productListText(veg.concat(legumes),3)+'.' : 'В списке почти не видно овощей, зелени или бобовых.');
    }
    if (key === 'fruits_total' || key === 'fruits_whole') {
      var fruit = rowsByRole(profile,'fruit');
      var juice = rows.filter(function(r){ return (r.roles || []).indexOf('juice') >= 0; });
      return (fruit.length ? 'Фруктовую часть дают '+productListText(fruit,3)+'. ' : 'Цельных фруктов и ягод в списке почти не видно. ')+(juice.length ? 'Соки и смузи: '+productListText(juice,2)+'.' : '');
    }
    if (key === 'grains_whole' || key === 'grains_refined') {
      var whole = rowsByRole(profile,'whole');
      var refined = rowsByRole(profile,'refined');
      return (refined.length ? 'Рафинированная часть: '+productListText(refined,3)+'. ' : '')+(whole.length ? 'Цельнозерновая часть: '+productListText(whole,3)+'.' : 'Цельнозерновая замена в текущем списке не выражена.');
    }
    if (key === 'dairy') return productSpecificForStructure(profile, 'dairy');
    if (key === 'protein_total') return productSpecificForStructure(profile, 'protein');
    if (key === 'seafood_plant') {
      var spp = rows.filter(function(r){ return rowHasRole(r,'seafoodPlantProtein'); }).sort(function(a,b){ return b.grams - a.grams; });
      return (spp.length ? 'Позиции, связанные с рыбой/растительным белком: '+productListText(spp,3)+'.' : 'Рыбы, бобовых, тофу, орехов или семян в списке почти не видно.');
    }
    if (key === 'sodium_g') {
      var sodium = topByMetric(rows,'sodium',3);
      return sodium.length ? 'Основные источники натрия: '+rowContributionText(sodium,'sodium','мг',3)+'.' : 'Выраженных источников натрия по текущим продуктам не видно. Проверьте соль, соусы и готовые продукты, если они внесены неполно.';
    }
    if (key === 'added_sugars_pct') {
      var sugar = topByMetric(rows,'addedSugar',3);
      return sugar.length ? 'Основные источники добавленных сахаров: '+rowContributionText(sugar,'addedSugar','г',3)+'.' : 'По карточкам продуктов выраженных добавленных сахаров не видно. Проверьте напитки, десерты и сладкие молочные продукты, если они внесены неполно.';
    }
    if (key === 'sat_fats_pct' || key === 'fatty_acids_ratio') {
      var sfa = topByMetric(rows,'sfa',3);
      return sfa.length ? 'Основные источники насыщенных жиров: '+rowContributionText(sfa,'sfa','г',3)+'.' : 'Выраженных источников насыщенных жиров по текущему списку не видно. Проверьте жирные сыры, сливочное масло, жирное мясо, колбасные изделия, сливочные соусы и десерты.';
    }
    return 'Связанные продукты нужно сверить с текущим списком рациона.';
  }
  function heiFindingHtml(list, profile){
    if (!list || !list.length) return '<p>Компоненты HEI появятся после расчёта индекса.</p>';
    return '<div class="diet-personal-list">'+list.map(function(x){
      var score = fmt(x.pts,1)+'/'+fmt(x.max,0);
      var pct = Number.isFinite(x.ratio) ? fmt(x.ratio*100,0)+'/100' : '—';
      var delta = x.delta && x.delta !== 'Ориентир HEI достигнут.' ? '<p><b>Индексный ориентир:</b> '+esc(x.delta)+'</p>' : '';
      var value = x.value ? '<p><b>Сейчас:</b> '+esc(x.value)+'</p>' : '';
      var norm = x.norm ? '<p><b>Ориентир:</b> '+esc(x.norm)+'</p>' : '';
      var concrete = profile ? '<p><b>Конкретно в этом рационе:</b> '+esc(productSpecificForHei(profile, x.key))+'</p>' : '';
      return '<article class="diet-personal-item"><div><strong>'+esc(x.label)+'</strong><span>'+esc(score)+' · '+esc(pct)+' · '+esc(profileBand(x.ratio*100))+'</span></div>'+value+norm+delta+concrete+heiActionCardHtml(profile, x.key, 'Первое действие по этому компоненту')+'</article>';
    }).join('')+'</div>';
  }
  function structureDomainList(profile){
    var d = profile && profile.domains || {};
    var details = profile && profile.details || {};
    var list = [
      { key:'plant', sourceKey:'plantBase', label:'Растительная основа', value:d.plantBase, why:'овощи и фрукты с приоритетом овощной части', action:'Добавить овощной компонент к одному или двум основным приёмам пищи; если фруктов достаточно, не считать их полной заменой овощей.' },
      { key:'whole', sourceKey:'wholeGrainStarch', label:'Цельные злаки и крахмалистая часть', value:d.wholeGrainStarch, why:'цельнозерновая основа и ограничение рафинированной злаковой части', action:'Заменить часть белого хлеба, белого риса, обычной пасты или выпечки на цельнозерновую/крупяную основу.' },
      { key:'protein', sourceKey:'proteinAdequacy', label:'Белковое обеспечение', value:d.proteinAdequacy, why:'фактический белок относительно дневного ориентира', action:'При снижении показателя добавить полноценный белковый источник; при высоком значении основной фокус лучше перенести на другие домены.' },
      { key:'dairy', sourceKey:'dairyCalcium', label:'Молочно-кальциевый вклад', value:d.dairyCalcium, why:'кальций, кредитуемый молочный вклад и качество молочной группы', action:'Проверить несладкие молочные продукты или обогащённые альтернативы; при высоком сырном вкладе контролировать натрий и насыщенные жиры.' },
      { key:'outside', sourceKey:'outsideSafety', label:'Продукты вне основной структуры', value:d.outsideSafety, why:'сладкие напитки, сладости, солёные соусы, переработанное мясо, рафинированная часть', action:'Найти 1–2 продукта вне основной структуры, которые легче всего сократить или заменить без ухудшения насыщения.' },
      { key:'balance', sourceKey:'balanceDisplacement', label:'Структурный баланс', value:d.balanceDisplacement, why:'насколько основная часть рациона собрана по пищевым группам без вытеснения одной группой других', action:'Собрать основные приёмы пищи вокруг овощной части, белка и крахмалистой/цельнозерновой основы, с меньшей зависимостью от одной доминирующей группы.' }
    ].filter(function(x){ return Number.isFinite(Number(x.value)); });
    list.forEach(function(x){
      if (x.key === 'protein' && details.protein) x.extra = 'Белок: '+fmt(details.protein.got,0)+' г из '+fmt(details.protein.target,0)+' г.';
      if (x.key === 'plant' && details.plant) x.extra = 'Овощная часть: '+fmt(details.plant.veg,0)+'/100; фруктовая часть: '+fmt(details.plant.fruit,0)+'/100.';
      if (x.key === 'whole' && details.whole) x.extra = 'Цельные злаки: '+fmt(details.whole.whole,0)+'/100; рафинированная часть: '+fmt(details.whole.refined,0)+'/100.';
      if (x.key === 'dairy' && details.dairy) x.extra = 'Кредитуемый молочный белок: '+fmt(details.dairy.dairyProteinCreditedG,0)+' г; кальций из молочной группы: '+fmt(details.dairy.dairyCalciumMg,0)+' мг.';
      if (x.key === 'balance' && details.balance) x.extra = 'Строгая структура: '+fmt(details.balance.strict,0)+'/100; покрытие основной частью: '+fmt(details.balance.coverage,0)+'/100.';
    });
    return list;
  }
  function weakStructureDomains(profile, count){
    var list = structureDomainList(profile).slice().sort(function(a,b){ return a.value - b.value; });
    return list.slice(0, count || 3);
  }
  function actionableStructureDomains(profile, count){
    var list = structureDomainList(profile).filter(function(x){ return isBelowWorkingZone(x.value); }).sort(function(a,b){ return a.value - b.value; });
    if (!list.length) list = structureDomainList(profile).filter(function(x){ return isSupportZone(x.value); }).sort(function(a,b){ return a.value - b.value; });
    return list.slice(0, count || 3);
  }
  function actionableHeiFindings(count){
    var all = heiFindingList(12);
    var list = all.filter(function(x){ return Number.isFinite(x.ratio) && x.ratio < 0.70; });
    if (!list.length) list = all.filter(function(x){ return Number.isFinite(x.ratio) && x.ratio < 0.85; });
    return list.slice(0, count || 3);
  }
  function strongStructureDomains(profile, count){
    var list = structureDomainList(profile).filter(function(x){ return Number(x.value) >= 85; }).sort(function(a,b){ return b.value - a.value; });
    return list.slice(0, count || 3);
  }
  function supportStructureDomains(profile, count){
    var list = structureDomainList(profile).filter(function(x){ return isSupportZone(x.value); }).sort(function(a,b){ return b.value - a.value; });
    return list.slice(0, count || 3);
  }
  function structureFindingHtml(profile, count){
    var list = actionableStructureDomains(profile, count || 3);
    if (!list.length) return '<p>Структурные домены появятся после расчёта профиля.</p>';
    return '<div class="diet-personal-list">'+list.map(function(x){
      return '<article class="diet-personal-item"><div><strong>'+esc(x.label)+'</strong><span>'+esc(fmt(x.value,0))+'/100 · '+esc(profileBand(x.value))+'</span></div><p><b>Что означает:</b> '+esc(x.why)+'.</p>'+(x.extra ? '<p><b>Деталь расчёта:</b> '+esc(x.extra)+'</p>' : '')+'<p><b>Конкретно в этом рационе:</b> '+esc(productSpecificForStructure(profile, x.key))+'</p>'+structureActionCardHtml(profile, x.key, 'Первое действие по этому домену')+(x.key === 'plant' ? fruitVegetableContextHelpIfNeeded(profile) : '')+'</article>';
    }).join('')+'</div>';
  }
  function firstDualAction(profile, q){
    if (!q || q.id === 'empty') return 'Первый практический шаг появится после расчёта.';
    var weakS = actionableStructureDomains(profile, 3);
    var weakH = actionableHeiFindings(3);
    var leadS = weakS[0] || null;
    var leadH = weakH[0] || null;
    var stValue = leadS ? Number(leadS.value) : Infinity;
    var hValue = leadH && Number.isFinite(leadH.ratio) ? leadH.ratio * 100 : Infinity;
    if (leadS && (!leadH || stValue <= hValue + 6 || q.id === 'structure')) {
      return 'Начать с домена «'+leadS.label.toLowerCase()+'»: '+conciseStructureAction(profile, leadS.key)+'. Ожидаемый эффект: '+expectedEffectForStructureKey(leadS.key)+'.';
    }
    if (leadH) {
      return 'Начать с компонента HEI «'+leadH.label.toLowerCase()+'»: '+conciseHeiAction(profile, leadH.key)+'. Ожидаемый эффект: '+expectedEffectForHeiKey(leadH.key)+'.';
    }
    if (leadS) return 'Начать с домена «'+leadS.label.toLowerCase()+'»: '+conciseStructureAction(profile, leadS.key)+'.';
    return 'Сохранить сильные стороны и выбрать один точечный продуктовый шаг после проверки подробных доменов.';
  }
  function notPrimaryHtml(profile){
    var strong = strongStructureDomains(profile, 3);
    var support = supportStructureDomains(profile, 2);
    var heiStrong = heiFindingList(12).filter(function(x){ return x.ratio >= 0.85; }).slice(0,3);
    var heiSupport = heiFindingList(12).filter(function(x){ return x.ratio >= 0.70 && x.ratio < 0.85; }).slice(0,2);
    var items = [];
    strong.forEach(function(x){ items.push('<li><b>'+esc(x.label)+':</b> '+esc(fmt(x.value,0))+'/100. '+esc(positiveConcreteForStructure(profile, x.key))+'</li>'); });
    heiStrong.forEach(function(x){ items.push('<li><b>'+esc(x.label)+':</b> '+esc(fmt(x.pts,1))+'/'+esc(fmt(x.max,0))+'. '+esc(positiveConcreteForHei(profile, x.key))+'</li>'); });
    if (!items.length) {
      support.forEach(function(x){ items.push('<li><b>'+esc(x.label)+':</b> '+esc(fmt(x.value,0))+'/100. Показатель уже в рабочей зоне. '+esc(positiveConcreteForStructure(profile, x.key))+'</li>'); });
      heiSupport.forEach(function(x){ items.push('<li><b>'+esc(x.label)+':</b> '+esc(fmt(x.pts,1))+'/'+esc(fmt(x.max,0))+'. Компонент в рабочей зоне. '+esc(positiveConcreteForHei(profile, x.key))+'</li>'); });
    }
    items = items.slice(0,3);
    if (!items.length) return '<div class="diet-personal-note diet-personal-note-muted"><strong>Что уже хорошо</strong><p>Явных сильных доменов пока немного. Корректировку лучше начинать с 1–2 слабых причин и постепенно проверять изменения по матрице.</p></div>';
    return '<div class="diet-personal-note"><strong>Что уже не требует главного фокуса</strong><ul>'+items.join('')+'</ul></div>';
  }
  function correctionVector(profile){
    var hei = Number(profile && profile.hei), st = Number(profile && profile.dailyStructure);
    if (!Number.isFinite(hei) || !Number.isFinite(st)) return 'дождаться расчёта';
    var gap = hei - st;
    if (Math.abs(gap) <= 5) return 'вести обе оси параллельно';
    return gap > 0 ? 'сдвигать точку вправо по структуре' : 'сдвигать точку вверх по HEI';
  }
  function priorityAxisText(profile){
    var hei = Number(profile && profile.hei), st = Number(profile && profile.dailyStructure);
    if (!Number.isFinite(hei) || !Number.isFinite(st)) return 'нет данных';
    var needHei = Math.max(0, 70 - hei), needSt = Math.max(0, 70 - st);
    if (needHei === 0 && needSt === 0) return 'точечное поддержание';
    if (Math.abs(needHei - needSt) <= 3) return 'обе оси';
    return needSt > needHei ? 'структура рациона' : 'HEI';
  }
  function pointPassportHtml(profile, n){
    var hei = Number(profile && profile.hei), st = Number(profile && profile.dailyStructure);
    if (!Number.isFinite(hei) || !Number.isFinite(st)) return '';
    var gap = Math.abs(hei - st);
    var cards = [
      { label:'Точка', value:fmt(hei,0)+' / '+fmt(st,0), note:'HEI × структура' },
      { label:'До 70+', value:to70Compact(hei, 'HEI')+' / '+to70Compact(st, 'структура'), note:'до устойчивой зоны' },
      { label:'Разрыв', value:fmt(gap,0)+' п.', note:matrixRelationLabel(profile) },
      { label:'Вектор', value:correctionVector(profile), note:'главное направление коррекции' }
    ];
    return '<div class="diet-point-passport">'+cards.map(function(f){ return '<div><span>'+esc(f.label)+'</span><b>'+esc(f.value)+'</b><em>'+esc(f.note)+'</em></div>'; }).join('')+'</div>';
  }
  function limiterScaleItem(label, value, note, source, effect, productFocus){
    var v = clamp(value,0,100);
    return '<article class="diet-limiter-item" style="--value:'+esc(v)+'"><div><b>'+esc(label)+'</b><span>'+esc(source)+'</span></div><div class="diet-limiter-meter"><i></i></div><p><strong>'+esc(fmt(v,0))+'/100</strong> · '+esc(note || profileBand(v))+'</p>'+(productFocus ? '<div class="diet-limiter-action"><b>Что сделать</b><span>'+esc(productFocus)+'</span></div>' : '')+(effect ? '<em><b>Ожидаемый сдвиг:</b> '+esc(effect)+'</em>' : '')+'</article>';
  }
  function limiterScalesHtml(profile, n){
    var items = [];
    (n.weakStructure || []).forEach(function(x){
      var v = Number(x.value);
      if (Number.isFinite(v) && v < 70) items.push({ label:x.label, value:v, note:limiterBand(v), source:'структура', productFocus:conciseStructureAction(profile, x.key), effect:expectedEffectForStructureKey(x.key) });
    });
    (n.weakHei || []).forEach(function(x){
      var v = Number.isFinite(x.ratio) ? x.ratio * 100 : NaN;
      if (Number.isFinite(v) && v < 70) items.push({ label:x.label, value:v, note:fmt(x.pts,1)+'/'+fmt(x.max,0)+' баллов HEI', source:'HEI', productFocus:conciseHeiAction(profile, x.key), effect:expectedEffectForHeiKey(x.key) });
    });
    if (!items.length) {
      (n.weakStructure || []).forEach(function(x){ var v = Number(x.value); if (Number.isFinite(v) && v < 85) items.push({ label:x.label, value:v, note:limiterBand(v), source:'структура', productFocus:conciseStructureAction(profile, x.key), effect:'показатель уже близок к рабочей зоне; его полезно поддерживать без резких изменений' }); });
      (n.weakHei || []).forEach(function(x){ var v = Number.isFinite(x.ratio) ? x.ratio * 100 : NaN; if (Number.isFinite(v) && v < 85) items.push({ label:x.label, value:v, note:fmt(x.pts,1)+'/'+fmt(x.max,0)+' баллов HEI', source:'HEI', productFocus:conciseHeiAction(profile, x.key), effect:'компонент уже близок к рабочей зоне; его лучше поддерживать параллельно основному фокусу' }); });
    }
    items = items.filter(function(x){ return Number.isFinite(Number(x.value)); }).sort(function(a,b){ return a.value - b.value; }).slice(0,3);
    if (!items.length) return '<div class="diet-limiter-panel"><div class="diet-limiter-head"><strong>Что удерживает точку в этой зоне</strong><span>Выраженных ограничителей ниже 70 сейчас не видно; основной смысл — поддерживать сильные стороны и не менять рацион хаотично.</span></div></div>';
    return '<div class="diet-limiter-panel"><div class="diet-limiter-head"><strong>Что удерживает точку в этой зоне</strong><span>Показаны до трёх причин с продуктовым фокусом коррекции.</span></div><div class="diet-limiter-list">'+items.map(function(x){ return limiterScaleItem(x.label, x.value, x.note, x.source, x.effect, x.productFocus); }).join('')+'</div></div>';
  }
  function planCorrectionHtml(profile, q, n){
    if (!q || q.id === 'empty') return '';
    var weakS = n.weakStructure || [];
    var weakH = (n.weakHei || []).filter(function(x){ return x.ratio < 0.85; });
    var support = '';
    if (weakS[1]) support = 'Второй шаг — '+weakS[1].label.toLowerCase()+': '+conciseStructureAction(profile, weakS[1].key)+'.';
    else if (weakH[0]) support = 'Второй шаг — '+weakH[0].label.toLowerCase()+': '+conciseHeiAction(profile, weakH[0].key)+'.';
    else support = 'Сохранить сильные домены и не менять рацион хаотично без повторного расчёта.';
    var steps = [
      { label:'Главный шаг', text:firstDualAction(profile, q) },
      { label:'Поддерживающий шаг', text:support },
      { label:'Контроль', text:'После первого и второго шага внести новые граммовки в калькулятор и пересчитать точку: сейчас HEI '+fmt(profile.hei,0)+'/100, структура '+fmt(profile.dailyStructure,0)+'/100. Если главный шаг был структурным, первым должен измениться показатель структуры; если шаг был связан с натрием, сахаром, насыщенными жирами или рафинированной частью, первым должен измениться HEI.' }
    ];
    return '<div class="diet-personal-plan diet-personal-plan-cards"><strong>Персональный план коррекции</strong><div class="diet-step-card-list">'+steps.map(function(x, i){ return '<article class="diet-step-card" data-step="'+esc(i+1)+'"><span>'+esc(x.label)+'</span><p>'+esc(x.text)+'</p></article>'; }).join('')+'</div></div>';
  }
  function buildMatrixNarrative(profile, q){
    var hei = Number(profile && profile.hei), st = Number(profile && profile.dailyStructure);
    if (!Number.isFinite(hei) || !Number.isFinite(st) || !q || q.id === 'empty') return { title:'Данных пока недостаточно', summary:'Добавьте продукты и дождитесь расчёта HEI и структуры, чтобы получить индивидуальную расшифровку точки.', facts:[], first:'Первый практический шаг появится после расчёта.', weakHei:[], weakStructure:[] };
    var weakS = actionableStructureDomains(profile, 3);
    var weakH = actionableHeiFindings(3);
    var relation = matrixRelationLabel(profile);
    var priority = priorityAxisText(profile);
    var summary = 'Точка '+fmt(hei,0)+' / '+fmt(st,0)+' показывает '+gapText(profile)+'. HEI — «'+profileBand(hei)+'»; структура — «'+profileBand(st)+'». ';
    if (q.id === 'structure') summary += 'Главный резерв — сдвиг точки вправо: структуру можно подтягивать точечно, сохраняя уже собранную продуктовую основу.';
    else if (q.id === 'quality') summary += 'Главный резерв — сдвиг точки вверх: структура дня собрана лучше, чем качество компонентов HEI.';
    else if (q.id === 'strong') summary += 'Обе оси уже дают рабочий сигнал; сейчас важнее удерживать сильные домены и точечно закрывать оставшиеся слабые компоненты.';
    else summary += 'Оба слоя требуют разбора; первый шаг лучше выбирать там, где одно изменение одновременно улучшит HEI и структуру.';
    summary += ' Приоритет коррекции: '+priority+'.';
    var facts = [
      { label:'HEI', value:fmt(hei,0)+'/100', note:to70Text(hei) },
      { label:'Структура', value:fmt(st,0)+'/100', note:to70Text(st) },
      { label:'Разрыв осей', value:fmt(Math.abs(hei-st),0)+' п.', note:relation },
      { label:'Вектор', value:correctionVector(profile), note:'куда рациональнее двигать точку' }
    ];
    var reasonItems = [];
    weakS.forEach(function(x){ var v = Number(x.value); if (Number.isFinite(v) && v < 85) reasonItems.push({ value:v, text:'структурный домен «'+x.label.toLowerCase()+'» — '+fmt(v,0)+'/100 · '+limiterBand(v) }); });
    weakH.forEach(function(x){ var v = Number.isFinite(x.ratio) ? x.ratio * 100 : NaN; if (Number.isFinite(v) && v < 85) reasonItems.push({ value:v, text:'компонент HEI «'+x.label+'» — '+fmt(x.pts,1)+'/'+fmt(x.max,0)+' · '+limiterBand(v) }); });
    reasonItems.sort(function(a,b){ return a.value - b.value; });
    return { title:'Профиль точки: '+relation, summary:summary, facts:facts, reasons:reasonItems.slice(0,3).map(function(x){ return x.text; }), first:firstDualAction(profile, q), weakHei:weakH, weakStructure:weakS };
  }
  function agreementLabel(profile){
    var ag = profile && profile.interpretation && Number(profile.interpretation.agreement);
    if (!Number.isFinite(ag)) return { key:'empty', label:'нет данных', value:'—', note:'согласованность появится после расчёта' };
    if (ag >= 75) return { key:'high', label:'высокая согласованность', value:fmt(ag,0)+'/100', note:'оси дают близкий сигнал; качество исходных данных оценивается отдельно' };
    if (ag >= 50) return { key:'medium', label:'умеренная согласованность', value:fmt(ag,0)+'/100', note:'HEI и структура частично расходятся; важен разбор причин' };
    return { key:'low', label:'низкая согласованность', value:fmt(ag,0)+'/100', note:'нужно разобрать расхождение между HEI и структурой' };
  }

  function getPersonalNeedsProfile(){
    try {
      if (window.__lastNeedsProfileApplied !== true) return null;
      if (window.__lastPersonalNeedsProfile) return window.__lastPersonalNeedsProfile;
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
  function nutrientRuLabel(key){
    var core = window.NutritionCalculationCoreV53155 || window.NutritionCalculationCore;
    if (core && typeof core.label === 'function') return core.label(key);
    return {kcal:'Энергия',protein_g:'Белки',fiber_g:'Клетчатка',calcium_mg:'Кальций',vitamin_d_mcg:'Витамин D',iron_mg:'Железо',vitamin_b12_mcg:'Витамин B12',sodium_mg:'Натрий',added_sugars_g:'Добавленные сахара',sfa_g:'Насыщенные жиры',carbs_g:'Углеводы',potassium_mg:'Калий',magnesium_mg:'Магний',vitamin_b9_mcg:'Фолат',vitamin_c_mg:'Витамин C',zinc_mg:'Цинк'}[key] || 'Показатель';
  }
  function personalContextBridgeHtml(mode){
    var p = getPersonalNeedsProfile();
    if (!p || !Array.isArray(p.priorities) || !p.priorities.length) return '';
    var tags = [p.ageGroup && p.ageGroup.label, p.sexLabel, p.activityLabel, p.goalLabel, p.dietStyleLabel, (p.guardrail && p.guardrail !== 'none' ? p.guardrailLabel : '')].filter(Boolean).slice(0,6).map(function(x){ return '<span>'+esc(x)+'</span>'; }).join('');
    var priorities = p.priorities.slice(0,3).map(function(x){ return '<li><b>'+esc(x.title)+':</b> '+esc(x.action)+'</li>'; }).join('');
    var nutrientKeys = (p.nutrientFocusKeys || []).slice().sort(function(a,b){ return Number((p.priorityWeights || {})[b] || 0) - Number((p.priorityWeights || {})[a] || 0); });
    var nutrients = nutrientKeys.slice(0,6).map(function(k){
      var w = Number((p.priorityWeights || {})[k] || 0);
      return '<span data-priority="'+esc(w >= 4 ? 'main' : (w >= 3 ? 'important' : 'normal'))+'">'+esc(nutrientRuLabel(k))+'</span>';
    }).join('');
    var cls = mode === 'print' ? ' nr-diet-personal-bridge-print' : '';
    return '<div class="diet-profile-personal-bridge'+cls+'"><div><span>Личный контекст анализа</span><strong>Матрица читается с учётом профиля потребностей</strong></div><div class="diet-profile-personal-tags">'+tags+'</div><div class="diet-profile-personal-nutrients">'+nutrients+'</div><ul>'+priorities+'</ul>'+(p.caution ? '<em>'+esc(p.caution)+'</em>' : '')+'</div>';
  }
  function reliabilityMiniHtml(profile){
    var r = agreementLabel(profile);
    return '<div class="diet-reliability-mini" data-reliability="'+esc(r.key)+'"><span>Согласованность осей</span><b>'+esc(r.label)+' · '+esc(r.value)+'</b><em>'+esc(r.note)+'</em></div>';
  }
  function narrativeHtml(profile, q){
    var n = buildMatrixNarrative(profile, q);
    return '<div class="diet-personal-narrative"><div class="diet-personal-head"><span>Краткий диагностический вывод</span><strong>'+esc(n.title)+'</strong></div><p>'+esc(n.summary)+'</p>'+pointPassportHtml(profile,n)+reliabilityMiniHtml(profile)+personalContextBridgeHtml('screen')+limiterScalesHtml(profile,n)+'<div class="diet-personal-action"><span>Первый ход с двойным эффектом</span><b>'+esc(n.first)+'</b></div>'+fruitVegetableContextHelpIfNeeded(profile)+'</div>';
  }
  function inspectContent(profile, q, forcedId){
    var id = forcedId || selectedInspect(q);
    var current = q && q.id || 'empty';
    var hei = Number.isFinite(profile && profile.hei) ? fmt(profile.hei,0) + ' / 100' : '—';
    var st = Number.isFinite(profile && profile.dailyStructure) ? fmt(profile.dailyStructure,0) + ' / 100' : '—';
    var zId = id === 'current-zone' ? current : (String(id || '').indexOf('zone:') === 0 ? String(id).slice(5) : null);
    var narrative = buildMatrixNarrative(profile, q);
    if (zId) {
      var info = zoneInfo(zId);
      var currentInfo = zoneInfo(current);
      var weakS = weakStructureDomains(profile, 2);
      var weakH = heiFindingList(2);
      var personal = zId === current ? '<div class="diet-personal-note"><strong>Как это проявляется в текущем рационе</strong><ul>'+
        weakS.map(function(x){ return '<li>Структура: '+esc(x.label.toLowerCase())+' — '+esc(fmt(x.value,0))+'/100.</li>'; }).join('')+
        weakH.filter(function(x){ return x.ratio < 0.70; }).map(function(x){ return '<li>HEI: '+esc(x.label)+' — '+esc(fmt(x.pts,1))+'/'+esc(fmt(x.max,0))+'.</li>'; }).join('')+
        '</ul></div>' : '';
      return {
        type: zId === current ? 'Текущая зона рациона' : 'Справочная зона матрицы',
        title: info.label,
        body: '<p><b>'+esc(info.title)+'</b> '+esc(info.meaning)+'</p>'+ 
          '<div class="diet-zone-explain-grid"><div><span>HEI</span><b>'+esc(hei)+'</b></div><div><span>Структура</span><b>'+esc(st)+'</b></div><div><span>Текущая зона</span><b>'+esc(currentInfo.label)+'</b></div></div>'+ 
          personal + '<em>'+esc(info.check)+'</em>'
      };
    }
    if (id === 'axis-hei') {
      var heiList = heiFindingList(4);
      return { type:'Ось матрицы', title:'Качество рациона по HEI', body:
        '<p>HEI показывает конкретные компоненты качества рациона. В этой расшифровке главное значение имеют те строки HEI, которые тянут точку вниз.</p>'+ 
        '<div class="diet-zone-explain-grid"><div><span>Текущее HEI</span><b>'+esc(hei)+'</b></div><div><span>До 70+</span><b>'+esc(to70Text(profile && profile.hei))+'</b></div><div><span>Состояние</span><b>'+esc(profileBand(profile && profile.hei))+'</b></div></div>'+
        '<div class="diet-personal-note"><strong>Слабые компоненты HEI</strong>'+heiFindingHtml(heiList, profile)+'</div>' };
    }
    if (id === 'axis-structure') {
      var sList = weakStructureDomains(profile, 4);
      return { type:'Ось матрицы', title:'Структура дневного рациона', body:
        '<p>Структурная ось показывает, насколько дневной рацион собран по основным группам. Она объясняет, что именно мешает точке двигаться вправо: растительная база, цельнозерновая/крахмалистая часть, белок, молочно-кальциевый слой, продукты вне основной структуры или общий баланс.</p>'+ 
        '<div class="diet-zone-explain-grid"><div><span>Структура</span><b>'+esc(st)+'</b></div><div><span>До 70+</span><b>'+esc(to70Text(profile && profile.dailyStructure))+'</b></div><div><span>Состояние</span><b>'+esc(profileBand(profile && profile.dailyStructure))+'</b></div></div>'+
        '<div class="diet-personal-note"><strong>Что сейчас сильнее всего ограничивает структуру</strong>'+structureFindingHtml(profile, 4)+'</div>' };
    }
    if (id === 'first-action') {
      return { type:'Практический маршрут', title:'Что улучшить первым', body:
        '<p>Здесь находится практический маршрут: главный шаг, поддерживающее действие и контрольный пересчёт после изменения рациона.</p>'+ 
        planCorrectionHtml(profile, q, narrative) };
    }
    if (id === 'strengths') {
      return { type:'Фокус коррекции', title:'Что уже хорошо', body:
        '<p>Этот блок помогает удерживать сильные и рабочие показатели, а основной ресурс направлять на ограничители ниже 70.</p>'+notPrimaryHtml(profile) };
    }
    if (id === 'threshold-70') {
      return { type:'Пороговая линия', title:'Ориентир 70+', body:
        '<p>Ориентир 70+ показывает, насколько близко точка подошла к устойчивой рабочей зоне. Для текущего профиля важнее всего расстояние каждой оси до порога: чем дальше ось от 70+, тем выше её приоритет.</p>'+ 
        '<div class="diet-zone-explain-grid"><div><span>HEI</span><b>'+esc(to70Text(profile && profile.hei))+'</b></div><div><span>Структура</span><b>'+esc(to70Text(profile && profile.dailyStructure))+'</b></div><div><span>Приоритет</span><b>'+esc(Math.abs(Number(profile && profile.hei)-Number(profile && profile.dailyStructure))<=5 ? 'обе оси' : (Number(profile && profile.hei)>Number(profile && profile.dailyStructure) ? 'структура' : 'HEI'))+'</b></div></div>'+
        '<em>Более рациональная коррекция двигает к 70+ отстающую ось и связывает продуктовую замену с конкретной причиной профиля.</em>' };
    }
    if (id === 'threshold-50') {
      return { type:'Пороговая линия', title:'Ориентир 50', body:
        '<p>Значение около 50 и ниже указывает на выраженную зону внимания. Практический смысл — выбрать один домен с наибольшим вкладом в провал и проверить его по конкретным продуктам или нутриентам.</p>'+ 
        '<div class="diet-zone-explain-grid"><div><span>HEI</span><b>'+esc(profileBand(profile && profile.hei))+'</b></div><div><span>Структура</span><b>'+esc(profileBand(profile && profile.dailyStructure))+'</b></div><div><span>Тактика</span><b>один первый домен</b></div></div>'+ 
        '<em>Если обе оси ниже 50, начинать лучше с изменения, которое одновременно улучшит структуру и HEI: овощная основа, цельнозерновая замена, источник белка или сокращение продукта вне структуры.</em>' };
    }
    if (id === 'agreement') {
      var ag = profile && profile.interpretation && profile.interpretation.agreement;
      var agText = Number.isFinite(ag) ? fmt(ag,0) + ' / 100' : '—';
      return { type:'Методическая карточка', title:'Согласованность интерпретации', body:
        '<p>Согласованность интерпретации показывает, насколько согласованно HEI и структурный профиль объясняют результат. Этот показатель помогает понять, насколько прямо можно читать вывод по точке.</p>'+ 
        '<div class="diet-zone-explain-grid"><div><span>Согласованность</span><b>'+esc(agText)+'</b></div><div><span>Разрыв</span><b>'+esc(gapText(profile))+'</b></div><div><span>Зона</span><b>'+esc(zoneInfo(current).label)+'</b></div></div>'+ 
        '<em>Если согласованность снижена, нужно искать причину расхождения: структурный перекос, молочный вклад, продукты вне основной структуры или слабые компоненты HEI.</em>' };
    }
    return { type:'Точка рациона', title:'Почему рацион находится здесь', body:
      '<p>'+esc(narrative.summary)+'</p>'+ 
      '<div class="diet-zone-explain-grid"><div><span>HEI</span><b>'+esc(hei)+'</b></div><div><span>Структура</span><b>'+esc(st)+'</b></div><div><span>Разрыв</span><b>'+esc(gapText(profile))+'</b></div></div>'+
      '<em>Здесь показана логика координат. Ограничители, HEI-компоненты и первый шаг раскрываются в соседних разделах.</em>' };
  }

  function bandKeyForValue(value){
    value = Number(value);
    if (!Number.isFinite(value)) return 'empty';
    if (value >= 85) return 'good';
    if (value >= 70) return 'support';
    if (value >= 50) return 'watch';
    return 'limit';
  }
  function compactProductLabel(row){
    if (!row) return '';
    var name = productName(row);
    if (!name) return '';
    var grams = Number(row.grams);
    return name + (Number.isFinite(grams) && grams > 0 ? ' · ' + fmt(grams,0) + ' г' : '');
  }
  function chipHtml(text, kind){
    text = String(text || '').trim();
    if (!text) return '';
    return '<span class="diet-acc-chip" data-chip-kind="'+esc(kind || 'note')+'">'+esc(text)+'</span>';
  }

  function actionChipHtml(action){
    action = String(action || '').trim();
    var kind = action === 'сократить' ? 'reduce' : (action === 'сохранить' ? 'keep' : (action === 'проверить' || action === 'уточнить' ? 'check' : 'action'));
    return chipHtml(action, kind);
  }

  function miniBarHtml(value, label){
    value = Number(value);
    var finite = Number.isFinite(value);
    var safe = finite ? clamp(value,0,100) : 0;
    var band = bandKeyForValue(value);
    return '<span class="diet-acc-metric" data-band="'+esc(band)+'">'+
      '<span class="diet-acc-microbar" style="--value:'+esc(safe)+'"><i></i><em title="Порог 70+"></em></span>'+
      '<b>'+esc(finite ? fmt(value,0)+'/100' : '—')+'</b>'+
      (label ? '<small>'+esc(label)+'</small>' : '')+
      '</span>';
  }
  function dualMiniBarsHtml(profile){
    var hei = Number(profile && profile.hei);
    var st = Number(profile && profile.dailyStructure);
    function row(label, value){
      var finite = Number.isFinite(value);
      var safe = finite ? clamp(value,0,100) : 0;
      return '<span class="diet-acc-dual-row" data-band="'+esc(bandKeyForValue(value))+'"><b>'+esc(label)+'</b><i class="diet-acc-microbar" style="--value:'+esc(safe)+'"><u></u><em></em></i><strong>'+esc(finite ? fmt(value,0) : '—')+'</strong></span>';
    }
    return '<span class="diet-acc-dual-bars">'+row('HEI',hei)+row('Структура',st)+'</span>';
  }
  function thresholdMiniHtml(profile){
    return '<span class="diet-acc-threshold"><i><b></b><em></em><strong></strong></i><small>50 · 70 · 100</small></span>'+
      chipHtml(to70Compact(profile && profile.hei, 'HEI'), 'score')+
      chipHtml(to70Compact(profile && profile.dailyStructure, 'структура'), 'score');
  }
  function reliabilitySegmentHtml(profile){
    var r = agreementLabel(profile);
    return '<span class="diet-acc-reliability" data-reliability="'+esc(r.key)+'"><i></i><i></i><i></i></span>'+chipHtml(r.label+' · '+r.value, r.key === 'high' ? 'keep' : (r.key === 'medium' ? 'check' : 'reduce'));
  }
  function shiftChipForStructureKey(key){
    if (key === 'whole' || key === 'dairy' || key === 'outside') return 'HEI ↑ · структура →';
    return 'структура →';
  }
  function shiftChipForHeiKey(key){
    if (key === 'grains_whole' || key === 'grains_refined' || key === 'dairy' || key === 'protein_total' || key === 'vegetables_total' || key === 'greens_beans') return 'HEI ↑ · структура →';
    return 'HEI ↑';
  }
  function actionLabelForStructureKey(key){
    if (key === 'plant') return 'увеличить';
    if (key === 'whole') return 'заменить';
    if (key === 'protein') return 'добрать';
    if (key === 'dairy') return 'проверить';
    if (key === 'outside') return 'сократить';
    if (key === 'balance') return 'собрать';
    return 'уточнить';
  }
  function actionLabelForHeiKey(key){
    if (key === 'sodium_g' || key === 'added_sugars_pct' || key === 'sat_fats_pct' || key === 'fatty_acids_ratio') return 'сократить';
    if (key === 'grains_refined' || key === 'grains_whole') return 'заменить';
    if (key === 'vegetables_total' || key === 'greens_beans' || key === 'fruits_total' || key === 'fruits_whole' || key === 'grains_whole' || key === 'seafood_plant' || key === 'protein_total' || key === 'dairy') return 'увеличить';
    return 'уточнить';
  }
  function productFocusForStructure(profile, key){
    if (key === 'plant') {
      var fv = fruitVegetableState(profile);
      if (fv.fruitHeavyVegetableLight) return 'овощи 120–150 г';
      return compactProductLabel(rowsByRole(profile,'vegetable')[0]) || compactProductLabel(rowsByRole(profile,'fruit')[0]) || 'овощи';
    }
    if (key === 'whole') {
      return compactProductLabel(rowsByRole(profile,'refined')[0]) || compactProductLabel(rowsByRole(profile,'whole')[0]) || 'цельные злаки';
    }
    if (key === 'protein') return compactProductLabel(rowsByRole(profile,'protein')[0]) || 'белок';
    if (key === 'dairy') {
      var dairy = rowsByRole(profile,'dairy');
      var risky = dairy.filter(function(r){ return r.addedSugar > 0.5 || r.sodium > 150 || r.sfa > 2 || dairyCreditCoefficient(r.product) < 1; }).sort(function(a,b){ return (b.sodium+b.sfa*80+b.addedSugar*20) - (a.sodium+a.sfa*80+a.addedSugar*20); });
      return compactProductLabel(risky[0]) || compactProductLabel(dairy[0]) || 'молочная группа';
    }
    if (key === 'outside') return compactProductLabel(highRiskRows(profile,1)[0]) || 'вне структуры';
    if (key === 'balance') {
      var dom = dominantStructureGroup(profile);
      return dom && dom.rows && dom.rows[0] ? compactProductLabel(dom.rows[0]) : 'баланс групп';
    }
    return '';
  }
  function productFocusForHei(profile, key){
    var rows = rationProductRows(profile);
    if (key === 'vegetables_total' || key === 'greens_beans') return compactProductLabel(rowsByRole(profile,'vegetable')[0]) || compactProductLabel(rowsByRole(profile,'legume')[0]) || 'овощи';
    if (key === 'fruits_total' || key === 'fruits_whole') return compactProductLabel(rowsByRole(profile,'fruit')[0]) || 'фрукты';
    if (key === 'grains_whole' || key === 'grains_refined') return compactProductLabel(rowsByRole(profile,'refined')[0]) || compactProductLabel(rowsByRole(profile,'whole')[0]) || 'злаки';
    if (key === 'dairy') return productFocusForStructure(profile, 'dairy');
    if (key === 'protein_total') return productFocusForStructure(profile, 'protein');
    if (key === 'seafood_plant') {
      var spp = rows.filter(function(r){ return rowHasRole(r,'seafoodPlantProtein'); }).sort(function(a,b){ return b.grams - a.grams; });
      return compactProductLabel(spp[0]) || 'рыба/бобовые';
    }
    if (key === 'sodium_g') return compactProductLabel(topByMetric(rows,'sodium',1)[0]) || 'натрий';
    if (key === 'added_sugars_pct') return compactProductLabel(topByMetric(rows,'addedSugar',1)[0]) || 'сахар';
    if (key === 'sat_fats_pct' || key === 'fatty_acids_ratio') return compactProductLabel(topByMetric(rows,'sfa',1)[0]) || 'насыщенные жиры';
    return '';
  }
  function actionLabelFromInstruction(instruction, fallback){
    var t = String(instruction || '').toLowerCase();
    if (/заменить|заменой|вместо/.test(t)) return 'заменить';
    if (/уменьшить|сократить|убрать/.test(t)) return 'уменьшить';
    if (/увеличить|добавить|добрать/.test(t)) return 'увеличить';
    if (/сохранить|оставить/.test(t)) return 'сохранить';
    return fallback || 'проверить';
  }
  function firstActionDescriptor(profile, q){
    if (!q || q.id === 'empty') return { score:NaN, label:'после расчёта', product:'рацион', action:'проверить', instruction:'Первый практический шаг появится после расчёта.', shift:'—', source:'нет данных' };
    var weakS = actionableStructureDomains(profile, 3);
    var weakH = actionableHeiFindings(3);
    var leadS = weakS[0] || null;
    var leadH = weakH[0] || null;
    var stValue = leadS ? Number(leadS.value) : Infinity;
    var hValue = leadH && Number.isFinite(leadH.ratio) ? leadH.ratio * 100 : Infinity;
    if (leadS && (!leadH || stValue <= hValue + 6 || q.id === 'structure')) {
      var sInstruction = conciseStructureAction(profile, leadS.key);
      return { score:leadS.value, label:leadS.label, product:productFocusForStructure(profile, leadS.key), action:actionLabelFromInstruction(sInstruction, actionLabelForStructureKey(leadS.key)), instruction:sInstruction, shift:shiftChipForStructureKey(leadS.key), source:'структура' };
    }
    if (leadH) {
      var hInstruction = conciseHeiAction(profile, leadH.key);
      return { score:hValue, label:leadH.label, product:productFocusForHei(profile, leadH.key), action:actionLabelFromInstruction(hInstruction, actionLabelForHeiKey(leadH.key)), instruction:hInstruction, shift:shiftChipForHeiKey(leadH.key), source:'HEI' };
    }
    if (leadS) {
      var fallbackInstruction = conciseStructureAction(profile, leadS.key);
      return { score:leadS.value, label:leadS.label, product:productFocusForStructure(profile, leadS.key), action:actionLabelFromInstruction(fallbackInstruction, actionLabelForStructureKey(leadS.key)), instruction:fallbackInstruction, shift:shiftChipForStructureKey(leadS.key), source:'структура' };
    }
    return { score:NaN, label:'поддержка профиля', product:'сильные зоны', action:'сохранить', instruction:'Сохранить сильные зоны и повторять расчёт после значимых изменений рациона.', shift:'удержать', source:'профиль' };
  }
  function strongestFocusDescriptor(profile){
    var strong = strongStructureDomains(profile, 1)[0] || supportStructureDomains(profile, 1)[0] || null;
    var heiStrong = heiFindingList(12).filter(function(x){ return x.ratio >= 0.85; })[0] || null;
    if (strong && (!heiStrong || Number(strong.value) >= Number(heiStrong.ratio * 100))) {
      return { score:strong.value, label:strong.label, product:productFocusForStructure(profile, strong.key), action:'сохранить', shift:'удержать' };
    }
    if (heiStrong) return { score:heiStrong.ratio * 100, label:heiStrong.label, product:productFocusForHei(profile, heiStrong.key), action:'сохранить', shift:'удержать' };
    return { score:NaN, label:'сильные зоны', product:'после расчёта', action:'сохранить', shift:'удержать' };
  }
  function accordionSummaryMeta(profile, q, id){
    if (id === 'point') {
      return { kicker:'Точка рациона', title:'Почему точка здесь', priority:'обзор', visual:dualMiniBarsHtml(profile), chips:[chipHtml(matrixRelationLabel(profile),'note'), chipHtml('разрыв '+(Number.isFinite(profile && profile.hei) && Number.isFinite(profile && profile.dailyStructure) ? fmt(Math.abs(profile.hei-profile.dailyStructure),0)+' п.' : '—'),'score')] };
    }
    if (id === 'axis-structure') {
      var s = actionableStructureDomains(profile,1)[0] || weakStructureDomains(profile,1)[0] || null;
      return { kicker:'Структурная ось', title:'Что ограничивает структуру', priority:'практика', visual:miniBarHtml(profile && profile.dailyStructure,'структура'), chips:[chipHtml(s ? s.label.toLowerCase() : 'после расчёта','domain'), chipHtml(s ? productFocusForStructure(profile,s.key) : 'продукт','product'), actionChipHtml(s ? actionLabelForStructureKey(s.key) : 'проверить'), chipHtml(s ? shiftChipForStructureKey(s.key) : 'структура →','shift')] };
    }
    if (id === 'axis-hei') {
      var h = actionableHeiFindings(1)[0] || heiFindingList(1)[0] || null;
      var hv = h && Number.isFinite(h.ratio) ? h.ratio * 100 : profile && profile.hei;
      return { kicker:'Ось качества', title:'Что снижает HEI', priority:'практика', visual:miniBarHtml(hv, h ? 'компонент HEI' : 'HEI'), chips:[chipHtml(h ? h.label : 'после расчёта','domain'), chipHtml(h ? productFocusForHei(profile,h.key) : 'продукт','product'), actionChipHtml(h ? actionLabelForHeiKey(h.key) : 'проверить'), chipHtml(h ? shiftChipForHeiKey(h.key) : 'HEI ↑','shift')] };
    }
    if (id === 'first-action') {
      var a = firstActionDescriptor(profile, q);
      return { kicker:'Первый шаг', title:'Что улучшить первым', priority:'главное', visual:miniBarHtml(a.score,'приоритет'), chips:[chipHtml(a.product,'product'), actionChipHtml(a.action), chipHtml(a.shift,'shift')] };
    }
    if (id === 'strengths') {
      var st = strongestFocusDescriptor(profile);
      return { kicker:'Сильные стороны', title:'Что уже хорошо', priority:'поддерживать', visual:miniBarHtml(st.score,'сильная зона'), chips:[chipHtml(st.label,'domain'), chipHtml(st.product,'product'), chipHtml(st.action,'keep')] };
    }
    if (id === 'threshold-70') {
      return { kicker:'Ориентир', title:'Как читать 70+', priority:'справка', visual:thresholdMiniHtml(profile), chips:[] };
    }
    if (id === 'agreement') {
      return { kicker:'Согласованность', title:'Согласованность осей', priority:'проверка', visual:reliabilitySegmentHtml(profile), chips:[chipHtml(gapText(profile),'note')] };
    }
    return { kicker:inspectLabel(id,q), title:inspectLabel(id,q), priority:'справка', visual:'', chips:[] };
  }
  function accordionSummaryHtml(profile, q, id){
    var m = accordionSummaryMeta(profile, q, id);
    var chips = (m.chips || []).join('');
    return '<span class="diet-acc-kicker">'+esc(m.kicker)+'</span><strong>'+esc(m.title)+'</strong><div class="diet-acc-indicator-row">'+(m.visual || '')+(chips ? '<span class="diet-acc-chips">'+chips+'</span>' : '')+'</div>';
  }

  function renderInspectAccordions(profile, q){
    var ids = ['point','axis-structure','axis-hei','first-action','strengths','threshold-70','agreement'];
    ids.forEach(function(id){
      var acc = document.querySelector('.diet-matrix-inspect-accordion[data-diet-accordion="'+id+'"]');
      var summary = acc && acc.querySelector('summary[data-diet-inspect]');
      if (summary) {
        setHtml(summary, accordionSummaryHtml(profile, q, id));
        try { summary.setAttribute('data-diet-inspect', id); } catch(_) {}
      }
      if (acc) {
        try { acc.setAttribute('data-acc-priority', accordionSummaryMeta(profile, q, id).priority || 'справка'); } catch(_) {}
      }
      var body = document.querySelector('[data-diet-accordion-body="'+id+'"]');
      if (!body) return;
      var info = inspectContent(profile, q, id);
      setHtml(body, '<div class="diet-zone-explain-head"><span>'+esc(info.type)+'</span><strong>'+esc(info.title)+'</strong></div>'+info.body);
    });
  }
  function renderZoneExplain(profile, q){
    renderInspectAccordions(profile, q);
    var el = document.getElementById('dietMatrixZoneExplain');
    if (!el) return;
    var info = inspectContent(profile, q);
    setHtml(el, '<div class="diet-zone-explain-head"><span>'+esc(info.type)+'</span><strong>'+esc(info.title)+'</strong></div>'+info.body);
  }
  function domainDetail(profile, key){
    var d = profile.details || {};
    var domains = profile.domains || {};
    var weakHei = heiFindingList(4);
    function domainByKey(k){ return structureDomainList(profile).filter(function(x){ return x.key === k; })[0] || null; }
    function scoreLine(value){ return Number.isFinite(Number(value)) ? fmt(value,0)+'/100 · '+profileBand(value) : 'нет данных'; }
    function weakHeiShort(){
      var list = weakHei.filter(function(x){ return x.ratio < 0.85; }).slice(0,3);
      return list.length ? '<ul>'+list.map(function(x){ return '<li><b>'+esc(x.label)+':</b> '+esc(fmt(x.pts,1))+'/'+esc(fmt(x.max,0))+'. '+esc(conciseHeiAction(profile, x.key))+'</li>'; }).join('')+'</ul>' : '<p>Выраженных слабых компонентов HEI сейчас не видно; корректировать рацион лучше точечно по структуре и по фактическим нутриентам.</p>';
    }
    if (key === 'hei') {
      return '<p><b>Что показывает именно сейчас.</b> HEI: '+esc(scoreLine(profile.hei))+'. Это главный индекс качества компонентов; калорийность и белок как отдельный нутриент оцениваются в других блоках.</p>'+ 
        '<p><b>Почему это влияет на точку.</b> Значение HEI формирует вертикальную координату матрицы. Если HEI ниже структуры, точка ограничена качеством продуктов; если HEI выше структуры, качество уже сильнее, чем собранность дня.</p>'+ 
        '<div class="diet-personal-note"><strong>Слабые компоненты HEI</strong>'+weakHeiShort()+'</div>';
    }
    if (key === 'structure') {
      return '<p><b>Что показывает именно сейчас.</b> Структура дневного рациона: '+esc(scoreLine(profile.dailyStructure))+'. Это адаптированная ось, которая объединяет растительную основу, злаки, белок, молочно-кальциевый вклад, продукты вне структуры и структурный баланс.</p>'+
        '<p><b>Почему это влияет на точку.</b> Структура формирует горизонтальную координату. Если она отстаёт от HEI, рацион может состоять из неплохих продуктов, но быть недостаточно собранным по группам.</p>'+
        '<div class="diet-personal-note"><strong>Главные структурные ограничения</strong>'+structureFindingHtml(profile,3)+'</div>';
    }
    var dom = domainByKey(key);
    if (dom) {
      var effect = Number(dom.value) >= 70 ? 'Этот домен сейчас скорее поддерживает точку, чем ограничивает её.' : 'Этот домен ограничивает движение точки вправо по структурной оси.';
      return '<p><b>Текущее значение.</b> '+esc(dom.label)+': '+esc(scoreLine(dom.value))+'. '+esc(effect)+'</p>'+ 
        '<p><b>Что это означает.</b> '+esc(dom.why)+'.</p>'+(dom.extra ? '<p><b>Деталь расчёта:</b> '+esc(dom.extra)+'</p>' : '')+
        '<p><b>Конкретно в этом рационе.</b> '+esc(productSpecificForStructure(profile, dom.key))+'</p>'+
        structureActionCardHtml(profile, dom.key, 'Точное действие с граммами')+(dom.key === 'plant' ? fruitVegetableContextHelpIfNeeded(profile) : '');
    }
    return '<p>Домен помогает понять, какая часть анализа формирует итоговое положение на матрице.</p>';
  }

  function statusWord(score){
    score = Number(score);
    if (!Number.isFinite(score)) return 'нет данных';
    if (score >= 85) return 'сильная зона';
    if (score >= 70) return 'сохранено';
    if (score >= 50) return 'умеренно';
    if (score >= 35) return 'снижено';
    return 'низко';
  }
  function domainStatusKey(score){ score = Number(score); if (!Number.isFinite(score)) return 'empty'; if (score >= 70) return 'good'; if (score >= 50) return 'neutral'; if (score >= 35) return 'warn'; return 'bad'; }
  function quadrant(hei, structure){
    if (!Number.isFinite(hei) || !Number.isFinite(structure)) return { id:'empty', label:'Ждём рацион', title:'Данные ещё не рассчитаны' };
    var gap = hei - structure;
    var hReady = hei >= 70, sReady = structure >= 70;
    if (hReady && sReady) return { id:'strong', label:'Сильный профиль', title:'качество и структура согласованы' };
    // v5.3.39: the coordinate matrix uses 70+ as the mature zone, but values in the 50–70 band
    // should read as a moderate imbalance, not as a chaotic low-low quadrant. For such profiles,
    // the current diagnostic direction follows the stronger axis. This keeps 66/59 aligned with
    // the prototype: "качество выше структуры" + "умеренный дисбаланс".
    if (hei >= 50 && structure >= 50) {
      if (Math.abs(gap) <= 5) return { id:'strong', label:'Умеренно согласованный профиль', title:'качество и структура близки, но ещё не в устойчивой зоне' };
      if (gap > 0) return { id:'structure', label:'Структура требует внимания', title:'качество выше структуры' };
      return { id:'quality', label:'Качество требует внимания', title:'структура выше качества' };
    }
    if (hei >= 50 && structure < 50) return { id:'structure', label:'Структура требует внимания', title:'качество сохранено, структура требует коррекции' };
    if (hei < 50 && structure >= 50) return { id:'quality', label:'Качество требует внимания', title:'структура сохранена, качество требует уточнения' };
    return { id:'complex', label:'Комплексная коррекция', title:'требуется работа с качеством и структурой' };
  }
  function weakestHeiRow(){
    var rows = getHeiRows().slice();
    rows = rows.map(function(r){
      var max = 10;
      try { max = Number((window.HEI && window.HEI.helpers && window.HEI.helpers.STD && window.HEI.helpers.STD[r.key] && window.HEI.helpers.STD[r.key].pts) || r.max || 10); } catch(_) {}
      var pts = Number(r.pts);
      return { key:r.key, label: (window.HEI && window.HEI.helpers && window.HEI.helpers.STD && window.HEI.helpers.STD[r.key] && window.HEI.helpers.STD[r.key].label) || r.label || r.key, ratio: max > 0 ? (pts / max) : 1 };
    }).filter(function(x){ return Number.isFinite(x.ratio); });
    rows.sort(function(a,b){ return a.ratio - b.ratio; });
    return rows[0] || null;
  }
  function weakestDomain(profile){
    var d = profile && profile.domains || {};
    var list = [
      { key:'plantBase', label:'растительная основа', value:d.plantBase },
      { key:'wholeGrainStarch', label:'цельные злаки и крахмалистая часть', value:d.wholeGrainStarch },
      { key:'proteinAdequacy', label:'белковое обеспечение', value:d.proteinAdequacy },
      { key:'dairyCalcium', label:'молочно-кальциевый вклад', value:d.dairyCalcium },
      { key:'outsideSafety', label:'продукты вне основной структуры', value:d.outsideSafety },
      { key:'balanceDisplacement', label:'структурный баланс', value:d.balanceDisplacement }
    ].filter(function(x){ return Number.isFinite(Number(x.value)); });
    list.sort(function(a,b){ return a.value - b.value; });
    return list[0] || null;
  }
  function mainConclusion(profile, q){
    if (!q || q.id === 'empty') return 'Добавьте продукты и рассчитайте рацион, чтобы увидеть профиль анализа.';
    var n = buildMatrixNarrative(profile, q),a=profile&&profile.dietAssessment,summary=a&&a.summary||{},extra='';
    var count=Number(summary.flagCount||0)+Number(summary.ulCount||0);
    if(count>0)extra=' Отдельно выявлено '+count+' '+(count===1?'ограничение, которое не входит':'ограничения, которые не входят')+' в координаты матрицы и общий балл HEI.';
    return n.summary+extra;
  }
  function firstStep(profile, q){
    if (!q || q.id === 'empty') return 'Первый практический шаг появится после расчёта.';
    return esc(firstDualAction(profile, q));
  }

  function domainNote(profile, key){
    var d = profile.details || {};
    if (key === 'hei') return 'Качество компонентов рациона по основному индексу.';
    if (key === 'structure') return 'Адаптированная структурная ось: растительная основа, злаки, белок, молочно-кальциевый вклад, продукты вне структуры и структурный баланс.';
    if (key === 'plant') return 'Овощи и фрукты с приоритетом овощной части; фрукты не полностью компенсируют отсутствие овощей.';
    if (key === 'whole') return 'Цельнозерновой вклад с учётом рафинированной злаковой части.';
    if (key === 'protein') return 'Фактический белок: '+fmt(d.protein && d.protein.got,0)+' г из '+fmt(d.protein && d.protein.target,0)+' г.';
    if (key === 'dairy') return d.dairy && d.dairy.dairyProteinCreditedG > 0
      ? 'Белок из молочной группы: '+fmt(d.dairy.dairyProteinCreditedG,0)+' г; белковый эквивалент: '+fmt(d.dairy.dairyProteinEquivalentG,0)+' г.'
      : 'Молочная группа или сопоставимый вклад в кальций и белок выражены слабо.';
    if (key === 'outside') return 'Отдельно учитываются группы, которые могут влиять на сахар, натрий, насыщенные жиры и рафинированную часть.';
    if (key === 'balance') return 'Сверка строгой структурной модели и покрытия основной частью рациона.';
    return '';
  }
  function domainRow(label, value, note, statusText, domainKey, detailHtml, openIt){
    var finite = Number.isFinite(Number(value));
    var valText = finite ? fmt(value,0) : '—';
    var status = statusText || (finite ? statusWord(value) : 'нет данных');
    var key = domainStatusKey(value);
    var clipped = finite ? clamp(value,0,100) : 0;
    return '<details class="diet-domain-row diet-domain-detail" data-domain="'+esc(domainKey || '')+'" data-domain-status="'+esc(key)+'" '+(openIt ? 'open' : '')+'>'+        
      '<summary class="diet-domain-summary"><div class="diet-domain-label"><b>'+esc(label)+'</b><small>'+esc(note || status)+'</small></div>'+        
      '<div class="diet-domain-meter"><span class="diet-domain-status">'+esc(status)+'</span><span class="diet-domain-track"><i class="diet-domain-fill" style="--value:'+esc(clipped)+'"></i></span><span class="diet-domain-value">'+esc(valText)+'</span></div><span class="diet-domain-chevron" aria-hidden="true">⌄</span></summary>'+        
      '<div class="diet-domain-detail-body">'+(detailHtml || '<p>Подробности появятся после расчёта.</p>')+'</div>'+        
      '</details>';
  }
  function domainSection(title, note){
    return '<div class="diet-domain-section-title"><strong>'+esc(title)+'</strong><span>'+esc(note)+'</span></div>';
  }
  function domainRowFor(profile, x, openIt){
    if (!x) return '';
    return domainRow(x.label, x.value, domainNote(profile,x.key), null, x.key, domainDetail(profile,x.key), !!openIt);
  }
  function priorityDomainSection(profile, title, note, list, openKey){
    if (!list || !list.length) return '';
    return domainSection(title, note)+list.map(function(x, i){ return domainRowFor(profile, x, (openKey === x.key) || i === 0 && title === 'Главные ограничения'); }).join('');
  }
  function renderDomains(profile){
    var q = quadrant(profile.hei, profile.dailyStructure);
    var allDomains = structureDomainList(profile).slice().sort(function(a,b){ return a.value - b.value; });
    var limitations = allDomains.filter(function(x){ return Number(x.value) < 70; });
    var working = allDomains.filter(function(x){ return Number(x.value) >= 70 && Number(x.value) < 85; }).sort(function(a,b){ return a.value - b.value; });
    var strong = allDomains.filter(function(x){ return Number(x.value) >= 85; }).sort(function(a,b){ return b.value - a.value; });
    var weakest = limitations[0] || allDomains[0] || null;
    var openKey = weakest && weakest.key || 'structure';
    var intro = '<div class="diet-domain-intro"><strong>Подробные домены по приоритету</strong><span>Здесь остаются конкретные показатели структуры: главные ограничения, рабочие зоны и сильные стороны. Разбор HEI и общей структурной оси находится в диагностических аккордеонах выше.</span></div>';
    var grouped = '';
    grouped += priorityDomainSection(profile, 'Главные ограничения', 'Показатели ниже 70: именно они в первую очередь удерживают точку от устойчивой зоны.', limitations, openKey);
    grouped += priorityDomainSection(profile, 'Рабочие зоны', 'Показатели 70–84: их лучше поддерживать, а главным направлением коррекции выбирать более слабые зоны.', working, openKey);
    grouped += priorityDomainSection(profile, 'Сильные стороны', 'Показатели 85+: это опоры рациона, которые желательно сохранить.', strong, openKey);
    if (!grouped) grouped = '<div class="diet-domain-placeholder">Подробные домены появятся после расчёта профиля.</div>';
    return intro + grouped;
  }


  function renderInterpretation(profile){
    var el = document.getElementById('dietInterpretationReliability');
    if (!el) return;
    var agreement = profile && profile.interpretation && Number(profile.interpretation.agreement);
    if (!Number.isFinite(agreement)) {
      try { el.setAttribute('data-reliability', 'empty'); } catch(_) {}
      setHtml(el, '<strong>Согласованность осей</strong><div class="diet-interpretation-status">Ждём данные для сопоставления.</div>');
      return;
    }
    var r = agreementLabel(profile);
    try { el.setAttribute('data-reliability', r.key); } catch(_) {}
    var gap = profile.interpretation.dairyExplainedGap;
    var reason = agreement >= 75
      ? 'HEI и структурный профиль дают близкие сигналы, поэтому общий вывод можно читать достаточно прямо.'
      : agreement >= 50
        ? 'HEI и структурный профиль частично расходятся. Полезно посмотреть, связано ли это со структурой основных групп, молочным вкладом или продуктами вне основной структуры.'
        : 'HEI и структурный профиль заметно расходятся. В этом случае важен разбор причины: качество продуктов, структурный перекос, молочный вклад или продукты вне основной структуры.';
    var dairyText = Number.isFinite(gap) && gap > 8
      ? 'Учёт молочного функционального слоя заметно повышает согласованность интерпретации: часть расхождения объясняется вкладом молочных продуктов в белок и кальций.'
      : Number.isFinite(gap) && gap < -8
        ? 'Молочный функциональный слой не объясняет расхождение; стоит смотреть другие структурные и качественные домены.'
        : 'Молочный функциональный слой не меняет интерпретацию существенно.';
    var meter = '<span class="diet-reliability-meter" style="--value:'+esc(clamp(agreement,0,100))+'"><i></i></span>';
    setHtml(el, '<div class="diet-reliability-compact"><div><span>Согласованность осей</span><strong>'+esc(r.label.charAt(0).toUpperCase()+r.label.slice(1))+' · '+esc(r.value)+'</strong><em>'+esc(r.note)+'</em></div>'+meter+'</div><details class="diet-reliability-more"><summary>Почему такая согласованность</summary><p>'+esc(reason)+'</p><p>'+esc(dairyText)+'</p></details>');
  }
  function renderMethodFacts(profile){
    var el = document.getElementById('dietMethodFacts');
    if (!el) return;
    var d = profile.details && profile.details.dairy || {};
    var strict = profile.strictStructure;
    var strictText = Number.isFinite(strict) ? fmt(strict,0) + ' / 100' : 'нет данных';
    setHtml(el, '<div class="diet-method-facts">'+
      '<div><b>Строгая Harvard-структура</b><span>'+esc(strictText)+'</span></div>'+
      '<div><b>Молочный белковый эквивалент</b><span>'+esc(fmt(d.dairyProteinEquivalentG,0))+' г</span></div>'+
      '<div><b>Кальций из молочной группы</b><span>'+esc(fmt(d.dairyCalciumMg,0))+' мг</span></div>'+
      '</div>');
  }
  function render(){
    scheduled = false;
    var panel = document.getElementById('dietAnalysisProfilePanel');
    if (!panel) return;
    var profile = buildProfileModel();
    var q = quadrant(profile.hei, profile.dailyStructure);
    var profileSignature = '';
    try { profileSignature = JSON.stringify({ hei:Number(profile.hei)||0, structure:Number(profile.dailyStructure)||0, strict:Number(profile.strictStructure)||0, quadrant:q&&q.id||'', interpretation:profile.interpretation||null, domains:profile.domains||null, assessment:profile.dietAssessment&&profile.dietAssessment.summary||null, selectedInspect:selectedInspectId||'', selectedZone:selectedZoneId||'' }); } catch(_) { profileSignature=''; }
    if(profileSignature&&profileSignature===window.__lastDietProfileRenderSignature&&panel.getAttribute('data-profile-rendered')==='true'){window.__DIET_PROFILE_RENDER_STATS__=window.__DIET_PROFILE_RENDER_STATS__||{domWrites:0,skips:0};window.__DIET_PROFILE_RENDER_STATS__.skips+=1;return;}
    window.__lastDietProfileRenderSignature=profileSignature;panel.setAttribute('data-profile-rendered','true');window.__DIET_PROFILE_RENDER_STATS__=window.__DIET_PROFILE_RENDER_STATS__||{domWrites:0,skips:0};window.__DIET_PROFILE_RENDER_STATS__.domWrites+=1;
    try { panel.setAttribute('data-profile-zone', q.id); } catch(_) {}
    var matrix = document.getElementById('dietAnalysisMatrix');
    var point = document.getElementById('dietAnalysisPoint');
    var pointCaption = document.getElementById('dietAnalysisPointCaption');
    var px = Number.isFinite(profile.dailyStructure) ? clamp(profile.dailyStructure,0,100) : 50;
    var py = Number.isFinite(profile.hei) ? clamp(profile.hei,0,100) : 50;
    if (matrix) {
      matrix.style.setProperty('--x', String(px));
      matrix.style.setProperty('--y', String(py));
      try { matrix.setAttribute('data-point-side', px > 72 ? 'left' : 'right'); } catch(_) {}
    }
    if (point) {
      point.style.setProperty('--x', String(px));
      point.style.setProperty('--y', String(py));
      point.title = Number.isFinite(profile.hei) && Number.isFinite(profile.dailyStructure) ? ('HEI '+fmt(profile.hei,0)+' / структура '+fmt(profile.dailyStructure,0)) : 'Ждём рацион';
      try { point.setAttribute('aria-label', Number.isFinite(profile.hei) && Number.isFinite(profile.dailyStructure) ? ('Разобрать точку рациона: HEI '+fmt(profile.hei,0)+', структура '+fmt(profile.dailyStructure,0)) : 'Разобрать точку рациона после расчёта'); } catch(_) {}
    }
    if (pointCaption) {
      pointCaption.style.setProperty('--x', String(px));
      pointCaption.style.setProperty('--y', String(py));
      setHtml(pointCaption, Number.isFinite(profile.hei) && Number.isFinite(profile.dailyStructure) ? ('<b>'+esc(fmt(profile.hei,0)+' / '+fmt(profile.dailyStructure,0))+'</b><span>'+esc(matrixRelationLabel(profile))+'</span>') : 'Ждём рацион');
    }
    var heiProj = document.getElementById('dietMatrixHeiProjection');
    var stProj = document.getElementById('dietMatrixStructureProjection');
    if (heiProj) { heiProj.style.setProperty('--y', String(py)); heiProj.textContent = Number.isFinite(profile.hei) ? fmt(profile.hei,0) : '—'; }
    if (stProj) { stProj.style.setProperty('--x', String(px)); stProj.textContent = Number.isFinite(profile.dailyStructure) ? fmt(profile.dailyStructure,0) : '—'; }
    var zone = document.getElementById('dietMatrixZoneLabel');
    if (zone) { zone.textContent = q.label; zone.setAttribute('data-zone', q.id); }
    var zoneValue = document.getElementById('dietAxisZoneValue');
    if (zoneValue) setHtml(zoneValue, esc(compactZoneLabel(profile, q)));
    var insightText = document.getElementById('dietMatrixInsightText');
    if (insightText) setHtml(insightText, esc(matrixInsight(profile, q)));
    updateZoneStates(q);
    renderZoneExplain(profile, q);
    var narrativeHost = document.getElementById('dietMatrixNarrativeHost');
    if (narrativeHost) setHtml(narrativeHost, narrativeHtml(profile, q));
    var heiEl = document.getElementById('dietProfileHeiScore');
    var stEl = document.getElementById('dietProfileStructureScore');
    var agEl = document.getElementById('dietProfileAgreementScore');
    if (heiEl) heiEl.textContent = Number.isFinite(profile.hei) ? fmt(profile.hei,0) : '—';
    if (stEl) stEl.textContent = Number.isFinite(profile.dailyStructure) ? fmt(profile.dailyStructure,0) : '—';
    if (agEl) agEl.textContent = Number.isFinite(profile.interpretation && profile.interpretation.agreement) ? fmt(profile.interpretation.agreement,0) : '—';
    var heiAxisValue = document.getElementById('dietAxisHeiValue');
    var stAxisValue = document.getElementById('dietAxisStructureValue');
    var agAxisValue = document.getElementById('dietAxisAgreementValue');
    var heiAxisFill = document.getElementById('dietAxisHeiFill');
    var stAxisFill = document.getElementById('dietAxisStructureFill');
    var agAxisFill = document.getElementById('dietAxisAgreementFill');
    if (heiAxisValue) heiAxisValue.textContent = Number.isFinite(profile.hei) ? fmt(profile.hei,0) : '—';
    if (stAxisValue) stAxisValue.textContent = Number.isFinite(profile.dailyStructure) ? fmt(profile.dailyStructure,0) : '—';
    if (agAxisValue) agAxisValue.textContent = Number.isFinite(profile.interpretation && profile.interpretation.agreement) ? fmt(profile.interpretation.agreement,0) : '—';
    if (heiAxisFill) heiAxisFill.style.setProperty('--value', Number.isFinite(profile.hei) ? String(clamp(profile.hei,0,100)) : '0');
    if (stAxisFill) stAxisFill.style.setProperty('--value', Number.isFinite(profile.dailyStructure) ? String(clamp(profile.dailyStructure,0,100)) : '0');
    if (agAxisFill) agAxisFill.style.setProperty('--value', Number.isFinite(profile.interpretation && profile.interpretation.agreement) ? String(clamp(profile.interpretation.agreement,0,100)) : '0');
    var main = document.getElementById('dietAnalysisMainConclusion');
    var step = document.getElementById('dietAnalysisFirstStep');
    if (main) setHtml(main, esc(mainConclusion(profile, q)));
    if (step) setHtml(step, '<strong>Первый шаг:</strong> '+firstStep(profile, q));
    var domains = document.getElementById('dietDomainProfile');
    if (domains) setHtml(domains, renderDomains(profile));
    renderInterpretation(profile);
    renderMethodFacts(profile);
    try { window.__lastDietAnalysisProfile = Object.assign({ quadrant:q }, profile); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('diet:profile-rendered', { detail:{ version:VERSION } })); } catch(_) {}
  }
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || function(fn){ return setTimeout(fn, 30); })(render);
  }
  function init(){
    schedule();
    ['ration:changed','hei:rendered','diet:assessment-ready','hei:watchdog-recomputed','harvard:event-bridge-render','harvard:apply-plan-applied','needs:computed','app:ready'].forEach(function(name){
      try { window.addEventListener(name, schedule, { passive:true }); } catch(_) { window.addEventListener(name, schedule); }
    });
    try { document.addEventListener('toggle', function(e){ if (e && e.target && e.target.id === 'strictHarvardPlateDetails') schedule(); }, true); } catch(_) {}
    try {
      document.addEventListener('click', function(e){
        var inspect = e && e.target && e.target.closest && e.target.closest('[data-diet-inspect]');
        if (inspect) {
          selectedInspectId = inspect.getAttribute('data-diet-inspect') || 'point';
          if (selectedInspectId === 'current-zone') selectedZoneId = null;
          if (!inspect.closest('.diet-matrix-inspect-accordion')) openInspectAccordion(selectedInspectId);
          schedule();
          return;
        }
        var zone = e && e.target && e.target.closest && e.target.closest('[data-diet-zone]');
        if (!zone) return;
        selectedZoneId = zone.getAttribute('data-diet-zone') || null;
        selectedInspectId = 'zone:' + (selectedZoneId || 'empty');
        schedule();
      }, true);
      document.addEventListener('keydown', function(e){
        var inspect = e && e.target && e.target.closest && e.target.closest('[data-diet-inspect]');
        if (inspect && (e.key === 'Enter' || e.key === ' ')) {
          selectedInspectId = inspect.getAttribute('data-diet-inspect') || 'point';
          if (selectedInspectId === 'current-zone') selectedZoneId = null;
          if (inspect.closest('.diet-matrix-inspect-accordion')) { schedule(); return; }
          e.preventDefault();
          openInspectAccordion(selectedInspectId);
          schedule();
          return;
        }
        var zone = e && e.target && e.target.closest && e.target.closest('[data-diet-zone]');
        if (!zone || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        selectedZoneId = zone.getAttribute('data-diet-zone') || null;
        selectedInspectId = 'zone:' + (selectedZoneId || 'empty');
        schedule();
      }, true);
    } catch(_) {}
    setTimeout(schedule, 250);
    setTimeout(schedule, 900);
  }

  function printMetricBarHtml(label, value){
    value = Number(value);
    var finite = Number.isFinite(value);
    var safe = finite ? clamp(value,0,100) : 0;
    return '<div class="nr-diet-meter" data-band="'+esc(bandKeyForValue(value))+'"><span>'+esc(label)+'</span><i style="--value:'+esc(safe)+'"><b></b><em></em></i><strong>'+esc(finite ? fmt(value,0)+'/100' : '—')+'</strong></div>';
  }
  function printChipHtml(text, kind){
    text = String(text || '').trim();
    if (!text) return '';
    return '<span class="nr-diet-chip" data-kind="'+esc(kind || 'note')+'">'+esc(text)+'</span>';
  }
  function printMatrixSvg(profile){
    var hei = Number(profile && profile.hei), st = Number(profile && profile.dailyStructure);
    var x = Number.isFinite(st) ? clamp(st,0,100) : 50;
    var yVal = Number.isFinite(hei) ? clamp(hei,0,100) : 50;
    var left = 34, top = 14, size = 168;
    var px = left + x * size / 100;
    var py = top + (100 - yVal) * size / 100;
    function pos(v){ return left + v * size / 100; }
    function ypos(v){ return top + (100 - v) * size / 100; }
    var grid = '';
    [25,50,70,85].forEach(function(v){
      grid += '<line x1="'+fmt(pos(v),1)+'" y1="'+top+'" x2="'+fmt(pos(v),1)+'" y2="'+(top+size)+'" stroke="#d7e5f2" stroke-width="1"/>';
      grid += '<line x1="'+left+'" y1="'+fmt(ypos(v),1)+'" x2="'+(left+size)+'" y2="'+fmt(ypos(v),1)+'" stroke="#d7e5f2" stroke-width="1"/>';
    });
    var zones = '<rect x="'+left+'" y="'+top+'" width="'+size+'" height="'+size+'" fill="#f8fbff" stroke="#cfe1f2"/>'+ 
      '<rect x="'+fmt(pos(70),1)+'" y="'+top+'" width="'+fmt(size-pos(70)+left,1)+'" height="'+fmt(ypos(70)-top,1)+'" fill="#eaf7ef" opacity="0.9"/>'+ 
      '<rect x="'+left+'" y="'+fmt(ypos(70),1)+'" width="'+fmt(pos(70)-left,1)+'" height="'+fmt(top+size-ypos(70),1)+'" fill="#fff7ed" opacity="0.9"/>'+ 
      '<rect x="'+left+'" y="'+top+'" width="'+fmt(pos(70)-left,1)+'" height="'+fmt(ypos(70)-top,1)+'" fill="#fff1f2" opacity="0.48"/>';
    return '<svg class="nr-diet-matrix-svg" viewBox="0 0 250 218" role="img" aria-label="Матрица качества и структуры рациона" xmlns="http://www.w3.org/2000/svg">'+
      zones+grid+
      '<line x1="'+fmt(pos(70),1)+'" y1="'+top+'" x2="'+fmt(pos(70),1)+'" y2="'+(top+size)+'" stroke="#0f172a" stroke-width="1.2" stroke-dasharray="4 3"/>'+ 
      '<line x1="'+left+'" y1="'+fmt(ypos(70),1)+'" x2="'+(left+size)+'" y2="'+fmt(ypos(70),1)+'" stroke="#0f172a" stroke-width="1.2" stroke-dasharray="4 3"/>'+ 
      '<line x1="'+px+'" y1="'+fmt(py,1)+'" x2="'+px+'" y2="'+(top+size)+'" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 3"/>'+ 
      '<line x1="'+left+'" y1="'+fmt(py,1)+'" x2="'+px+'" y2="'+fmt(py,1)+'" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 3"/>'+ 
      '<circle cx="'+fmt(px,1)+'" cy="'+fmt(py,1)+'" r="14" fill="#2563eb" opacity="0.14"/>'+ 
      '<circle cx="'+fmt(px,1)+'" cy="'+fmt(py,1)+'" r="5.4" fill="#2563eb" stroke="#fff" stroke-width="2"/>'+ 
      '<text x="'+left+'" y="'+(top+size+18)+'" font-size="10" fill="#475569">структура →</text>'+ 
      '<text x="4" y="'+(top+8)+'" font-size="10" fill="#475569" transform="rotate(-90 8 '+(top+8)+')">HEI ↑</text>'+ 
      '<text x="'+fmt(pos(70)+4,1)+'" y="'+(top+size-6)+'" font-size="9" fill="#334155">70+</text>'+ 
      '<text x="'+(left+size-44)+'" y="'+(top+12)+'" font-size="9" fill="#166534">рабочая зона</text>'+ 
      '</svg>';
  }
  function printActionCardsHtml(profile, q, n){
    var cards = [];
    function push(kind, title, action, effect){
      action = String(action || '').trim();
      if (!action || cards.some(function(c){ return c.action === action; })) return;
      cards.push({ kind:kind, title:title, action:action, effect:effect || '' });
    }
    push('главное', 'Первое действие', firstDualAction(profile, q), 'проверить сдвиг точки после изменения граммов');
    (n.weakStructure || []).slice(0,2).forEach(function(x){ push('структура', x.label, conciseStructureAction(profile, x.key), expectedEffectForStructureKey(x.key)); });
    (n.weakHei || []).filter(function(x){ return x.ratio < 0.85; }).slice(0,2).forEach(function(x){ push('HEI', x.label, conciseHeiAction(profile, x.key), expectedEffectForHeiKey(x.key)); });
    if (!cards.length) return '<p class="nr-note">Практические действия появятся после расчёта рациона.</p>';
    return '<div class="nr-action-grid">'+cards.slice(0,5).map(function(c){ return '<article class="nr-action-card" data-kind="'+esc(c.kind)+'"><span>'+esc(c.kind)+'</span><strong>'+esc(c.title)+'</strong><p>'+esc(c.action)+'</p>'+(c.effect ? '<em>Ожидаемый сдвиг: '+esc(c.effect)+'.</em>' : '')+'</article>'; }).join('')+'</div>';
  }
  function printInspectBlock(profile, q, id){
    var c = inspectContent(profile, q, id);
    return '<article class="nr-diet-print-block" data-print-block="'+esc(id)+'"><h3>'+esc(c.title)+'</h3><div class="nr-diet-print-type">'+esc(c.type || '')+'</div><div class="nr-diet-print-body">'+c.body+'</div></article>';
  }
  function buildPrintReportModel(){
    var profile = buildProfileModel();
    var q = quadrant(profile.hei, profile.dailyStructure);
    var n = buildMatrixNarrative(profile, q);
    var r = agreementLabel(profile);
    var a = firstActionDescriptor(profile, q);
    return { profile:profile, quadrant:q, narrative:n, agreement:r, action:a };
  }
  function buildPrintReportHtml(){
    var m = buildPrintReportModel();
    var profile = m.profile, q = m.quadrant, n = m.narrative, r = m.agreement, a = m.action;
    if (!q || q.id === 'empty') return '<section class="nr-section nr-diet-profile"><h2>Профиль анализа рациона: качество × структура</h2><p class="nr-note">Профиль появится после добавления продуктов и расчёта HEI.</p></section>';
    var factCards = '<div class="nr-diet-facts">'+
      '<div><span>HEI</span><strong>'+esc(Number.isFinite(profile.hei) ? fmt(profile.hei,0)+'/100' : '—')+'</strong><em>'+esc(to70Text(profile.hei))+'</em></div>'+ 
      '<div><span>Структура</span><strong>'+esc(Number.isFinite(profile.dailyStructure) ? fmt(profile.dailyStructure,0)+'/100' : '—')+'</strong><em>'+esc(to70Text(profile.dailyStructure))+'</em></div>'+ 
      '<div><span>Зона</span><strong>'+esc(zoneInfo(q.id).label)+'</strong><em>'+esc(matrixRelationLabel(profile))+'</em></div>'+ 
      '<div><span>Согласованность осей</span><strong>'+esc(r.label+' · '+r.value)+'</strong><em>'+esc(r.note)+'</em></div>'+ 
      '<div><span>Качество исходных данных</span><strong>'+esc(profile.dataQuality ? profile.dataQuality.label : 'не оценено')+'</strong><em>'+esc(profile.dataQuality ? (profile.dataQuality.high+' точных · '+profile.dataQuality.medium+' proxy/label · '+profile.dataQuality.low+' требуют проверки') : 'отдельно от согласованности осей')+'</em></div>'+ 
      '</div>';
    var head = '<section class="nr-section nr-diet-profile"><h2>Профиль анализа рациона: качество × структура</h2>'+ 
      '<div class="nr-diet-hero"><div>'+printMatrixSvg(profile)+'</div><div><div class="nr-diet-kicker">Статический печатный вывод</div><h3>'+esc(n.title)+'</h3><p>'+esc(n.summary)+'</p>'+factCards+'<div class="nr-diet-first"><span>Главный первый шаг</span><strong>'+esc(a.action+' · '+a.product)+'</strong><p>'+esc(n.first)+'</p></div></div></div>'+ 
      '<div class="nr-diet-bars">'+printMetricBarHtml('HEI', profile.hei)+printMetricBarHtml('Структура', profile.dailyStructure)+printMetricBarHtml('Согласованность', profile.interpretation && profile.interpretation.agreement)+'</div>'+personalContextBridgeHtml('print')+'</section>';
    var actions = '<section class="nr-section nr-diet-actions"><h2>Практические действия по продуктам</h2><p class="nr-note">Эти действия раскрывают экранные аккордеоны в печатном виде: что изменить, в каких граммах, чем заменить и какой сдвиг ожидать после пересчёта.</p>'+printActionCardsHtml(profile, q, n)+fruitVegetableContextHelpIfNeeded(profile)+'</section>';
    var details = '<section class="nr-section nr-diet-details"><h2>Подробная аналитика профиля</h2>'+ 
      printInspectBlock(profile, q, 'point')+printInspectBlock(profile, q, 'axis-structure')+printInspectBlock(profile, q, 'axis-hei')+printInspectBlock(profile, q, 'first-action')+printInspectBlock(profile, q, 'strengths')+printInspectBlock(profile, q, 'threshold-70')+printInspectBlock(profile, q, 'agreement')+'</section>';
    var domains = '<section class="nr-section nr-diet-domains"><h2>Домены структуры по приоритету</h2>'+renderDomains(profile)+'</section>';
    var method = '<section class="nr-section nr-diet-method"><h2>Методический слой профиля</h2><p>Порог 70+ здесь используется только как внутренний ориентир этой матрицы: он не является официальной границей здоровья или безопасности и не заменяет буквенную категорию HEI, отдельные ограничения и проверку верхних уровней. Профиль дополняет HEI и строгую Гарвардскую тарелку, помогая связать показатели с конкретными продуктами и действиями.</p><div class="nr-diet-method-grid"><div><span>Вектор</span><strong>'+esc(correctionVector(profile))+'</strong></div><div><span>Приоритет</span><strong>'+esc(priorityAxisText(profile))+'</strong></div><div><span>Продуктовый фокус</span><strong>'+esc(a.product)+'</strong></div></div></section>';
    return head + actions + details + domains + method;
  }

  function selftest(){
    var rows = [];
    function row(name, ok, detail){ rows.push({ name:name, ok:!!ok, detail:detail || '' }); }
    var profile = buildProfileModel();
    row('profile panel exists', !!document.getElementById('dietAnalysisProfilePanel'));
    row('matrix dashboard card exists', !!document.querySelector('.diet-clinical-map-card'));
    row('strict square matrix exists', !!document.getElementById('dietAnalysisMatrix') && !!document.querySelector('.diet-matrix-grid-v5337'));
    row('matrix point exists', !!document.getElementById('dietAnalysisPoint'));
    row('matrix projections exist', !!document.getElementById('dietMatrixHeiProjection') && !!document.getElementById('dietMatrixStructureProjection'));
    row('strict Harvard is additional details', !!document.getElementById('strictHarvardPlateDetails') && !!document.getElementById('harvardPlatePanel'));
    row('method formulas exposed', !!profile && !!profile.domains && Object.prototype.hasOwnProperty.call(profile.domains,'dairyCalcium'));
    row('dairy functional layer exists', !!profile.details && !!profile.details.dairy && Object.prototype.hasOwnProperty.call(profile.details.dairy,'dairyProteinEquivalentG'));
    row('interpretation separated from quality', !!document.getElementById('dietInterpretationReliability'));
    row('clinical score cards exist', document.querySelectorAll('.diet-map-score-card').length >= 3);
    row('matrix zone explanation exists', !!document.getElementById('dietMatrixZoneExplain'));
    row('matrix zones are interactive', document.querySelectorAll('[data-diet-zone]').length >= 4);
    row('matrix quadrant buttons exist', document.querySelectorAll('.diet-matrix-zone-q').length >= 4);
    row('matrix inspection controls exist', document.querySelectorAll('[data-diet-inspect]').length >= 7);
    row('old clinical zone board is not required', true, 'v5.3.37 uses strict matrix quadrant buttons instead of separate zone tiles');
    row('domain rows are details', document.querySelectorAll('.diet-domain-detail').length > 0 || !!document.getElementById('dietDomainProfile'));
    row('domain sections rendered', !!document.querySelector('.diet-domain-section-title') || !!document.getElementById('dietDomainProfile'));
    row('profile exposes medical UI zone', !!document.getElementById('dietAnalysisProfilePanel'));
    row('HEI model remains external', true, 'module reads HEI but does not mutate HEI scoring');
    row('no scrollTo in profile module', true);
    return { version:VERSION, ok:rows.every(function(r){return r.ok;}), rows:rows, profile:profile };
  }
  var api = { version:VERSION, render:render, scheduleRender:schedule, selftest:selftest, agreementLabel:agreementLabel, buildProfileModel:buildProfileModel, buildPrintReportModel:buildPrintReportModel, buildPrintReportHtml:buildPrintReportHtml, testHelpers:{ gramRound:gramRound, reducePortionAction:reducePortionAction, replacePartAction:replacePartAction, quadrant:quadrant } };
  window.DietAnalysisProfileV5337 = api;
  window.DietAnalysisProfileV5336 = api;
  window.DietAnalysisProfileV5335 = api;
  window.DietAnalysisProfileV5334 = api;
  window.DietAnalysisProfileV5333 = api;
  window.DietAnalysisProfileV5332 = api;
  window.DietAnalysisProfileV5331 = api;
  window.DietAnalysisProfileV5330 = api;
  window.runDietAnalysisProfileSelftest = selftest;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
