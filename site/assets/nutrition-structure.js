// Port original Harvard Plate + 6-domain Nutrition diet profile for VesninMed.
// Source (unchanged algorithm blocks): nutrition-engine assets/js/26-harvard-plate-v5-stage-engine.js;
// assets/js/34-harvard-plate-v5-diagram-remaster.js; assets/js/50-integrated-diet-analysis-profile-v5.js.
// Author model: not a diagnosis or independent validation of HEI.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clampDisplay=x=>Math.max(0,Math.min(100,x));
const DOMAINS=[['plantBase','Растительная основа',.25],['wholeGrainStarch','Цельные и очищенные злаки',.20],['proteinAdequacy','Белковая обеспеченность',.20],['dairyCalcium','Молочные продукты и кальций',.15],['outsideSafety','Что стоит ограничивать',.10],['balanceDisplacement','Соотношение пищевых групп',.10]];
// Public-language definitions are separate from the exact historical arithmetic.
const DOMAIN_METHODS={
 plantBase:{
   short:'Показывает, насколько в рационе представлены овощи, фрукты, зелень и бобовые. Балл рассчитывается по соответствующим показателям HEI-2020.',
   how:'В расчёте участвуют четыре показателя HEI-2020: два для овощей и зелени с бобовыми, два для фруктов. Вместе овощные показатели дают 65% балла, фруктовые — 35%. Эти проценты относятся к баллам, а не к массе продуктов.'
 },
 wholeGrainStarch:{
   short:'Показывает, насколько хорошо в рационе представлены цельнозерновые продукты и как оценивается содержание очищенных злаков, например изделий из белой муки.',
   how:'75% балла даёт компонент HEI за цельные злаки. Ещё 25% — компонент за ограничение рафинированных злаков. Наличие одних только рафинированных злаков не заменяет цельнозерновые продукты.'
 },
 proteinAdequacy:{
   short:'Сколько белка содержится во введённых продуктах по сравнению с расчётным ориентиром? Это ещё не оценка того, достаточно ли белка человеку за весь день.',
   how:'До расчётного ориентира балл растёт вместе с количеством белка. От 100 до 150% ориентира он равен 100. Выше 150% балл постепенно уменьшается — это правило самой модели, а не общепринятый медицинский предел.'
 },
 dairyCalcium:{
   short:'Показывает вклад молочных продуктов, которые удалось распознать в рационе. Кроме принадлежности к группе, модель учитывает содержащиеся в них кальций и белок.',
   how:'42% балла составляет молочный показатель HEI-2020. Ещё 28% дают сведения о кальции из молочных продуктов, 20% — о белке из них и 10% — дополнительные правила модели. Кальций из других продуктов здесь полностью не учитывается. Даже без молочных продуктов модель может начислять 10 баллов за отсутствие штрафов. Для оценки всего кальция смотрите раздел нутриентов.'
 },
 outsideSafety:{
   short:'Показывает, как введённые продукты оцениваются по содержанию натрия, добавленных сахаров, насыщенных жиров и некоторым другим признакам состава.',
   how:'70% балла зависит от четырёх показателей HEI-2020: очищенные злаки, натрий, добавленные сахара и насыщенные жиры. Ещё 30% — дополнительные правила модели. Высокий балл означает меньше замечаний по выбранным признакам, но не доказывает безопасность питания.'
 },
 balanceDisplacement:{
   short:'Как соотносятся овощи, фрукты, цельные злаки и белковые продукты? И какую часть массы рациона составляют эти группы?',
   how:'Система распределяет продукты по четырём группам и сравнивает их доли по массе с условной схемой: 35% овощей, 15% фруктов, 25% цельных злаков и 25% белковых продуктов. За такое соотношение можно получить 72% балла. Остальные 28% зависят от того, какая часть общей массы рациона вообще относится к этим четырём группам. Гарвардская тарелка задаёт приблизительные пропорции на рисунке, а не точные нормы в граммах. Поэтому этот расчёт — наше приближение, а не официальный гарвардский показатель.'
 }
};
const legacyStage=(()=>{const window={};
// Harvard Plate v5 State Engine
// v5.2.3 final polish support: stable states, explainability, accessible UI model.
(function(global){
  'use strict';

  const VERSION = 'v5.2.3-final-polish';
  const TARGETS = Object.freeze({
    vegetables: 0.35,
    fruits: 0.15,
    wholeGrains: 0.25,
    protein: 0.25
  });
  const STATE_BANDS = Object.freeze([
    { id: 'empty', min: 0, max: 0, label: 'нет данных' },
    { id: 'very-low', min: 0.000001, max: 0.24, label: 'очень мало' },
    { id: 'low', min: 0.25, max: 0.59, label: 'мало' },
    { id: 'below-target', min: 0.60, max: 0.89, label: 'ниже ориентира' },
    { id: 'target', min: 0.90, max: 1.10, label: 'около ориентира' },
    { id: 'over', min: 1.11, max: 1.40, label: 'выше ориентира' },
    { id: 'strong-over', min: 1.400001, max: Infinity, label: 'сильный перебор' }
  ]);

  function toNumber(value){
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function round(value, digits){
    const p = Math.pow(10, digits == null ? 1 : digits);
    return Math.round((Number(value) || 0) * p) / p;
  }
  function clamp(value, min, max){ return Math.max(min, Math.min(max, value)); }

  function classifyFillRatio(fillRatio){
    const x = Number(fillRatio) || 0;
    if (x <= 0) return STATE_BANDS[0];
    for (const band of STATE_BANDS){ if (x >= band.min && x <= band.max) return band; }
    return STATE_BANDS[STATE_BANDS.length - 1];
  }

  function computeAdjustment(currentG, coreMass, targetShare){
    currentG = toNumber(currentG);
    coreMass = toNumber(coreMass);
    targetShare = Number(targetShare) || 0;
    if (!coreMass || !targetShare || targetShare >= 1){
      return { type: 'none', grams: 0, message: 'добавьте продукты в рацион' };
    }
    const targetCurrent = targetShare * coreMass;
    if (currentG < targetCurrent){
      const addG = (targetCurrent - currentG) / (1 - targetShare);
      return { type: 'add', grams: Math.max(0, Math.round(addG)), message: 'добавьте примерно ' + Math.max(0, Math.round(addG)) + ' г' };
    }
    if (currentG > targetCurrent){
      const reduceG = (currentG - targetCurrent) / (1 - targetShare);
      return { type: 'reduce', grams: Math.max(0, Math.round(reduceG)), message: 'уменьшите примерно на ' + Math.max(0, Math.round(reduceG)) + ' г' };
    }
    return { type: 'none', grams: 0, message: 'ориентир достигнут' };
  }

  function buildSector(id, grams, coreMass, targetShare){
    grams = toNumber(grams);
    const actualShare = coreMass > 0 ? grams / coreMass : 0;
    const fillRatio = targetShare > 0 ? actualShare / targetShare : 0;
    const band = classifyFillRatio(fillRatio);
    const adjustment = computeAdjustment(grams, coreMass, targetShare);
    const cappedFill = clamp(fillRatio, 0, 1);
    const overPct = fillRatio > 1 ? Math.round((fillRatio - 1) * 100) : 0;
    return {
      id,
      grams: round(grams, 0),
      targetShare,
      targetPercent: Math.round(targetShare * 100),
      actualShare,
      actualPercent: round(actualShare * 100, 1),
      fillRatio,
      fillPercent: Math.round(clamp(fillRatio * 100, 0, 100)),
      cappedFill,
      state: band.id,
      stateLabel: band.label,
      overPercent: overPct,
      adjustment
    };
  }

  function deriveQualityFlags(input, sectors, options){
    const flags = [];
    const vegetablesG = toNumber(input.vegetablesG);
    const fruitsG = toNumber(input.fruitsG);
    const refinedG = toNumber(input.refinedGrainsG);
    const dairyG = toNumber(input.dairyG);
    const processedMeatG = toNumber(input.processedMeatG);
    const saturatedFatG = toNumber(input.saturatedFatG);
    const unsaturatedFatG = toNumber(input.unsaturatedFatG);
    const juiceMl = toNumber(input.juiceMl);
    const sweetDrinkMl = toNumber(input.sweetDrinkMl);

    if (fruitsG > 0 && fruitsG > vegetablesG){
      flags.push({ id: 'fruit-heavy', severity: 'warn', message: 'фруктовая часть превышает овощную' });
    }
    if (sectors.vegetables.fillRatio < 0.6){
      flags.push({ id: 'vegetables-low', severity: 'warn', message: 'овощная часть заметно ниже ориентира' });
    }
    if (refinedG > 0){
      flags.push({ id: 'refined-grains-present', severity: 'info', message: 'рафинированные злаки учитываются отдельно от цельнозернового сектора' });
    }
    if (dairyG > 0 && (options.proteinCountingMode || 'harvard-strict') === 'harvard-strict'){
      flags.push({ id: 'dairy-separate', severity: 'info', message: 'молочные продукты учитываются отдельно от белковой четверти' });
    }
    if (processedMeatG > 0){
      flags.push({ id: 'processed-meat-warning', severity: 'warn', message: 'переработанное мясо требует отдельной оценки качества белкового сектора' });
    }
    if (saturatedFatG > 0 && unsaturatedFatG > 0 && (unsaturatedFatG / saturatedFatG) < 2.5){
      flags.push({ id: 'saturated-high', severity: 'warn', message: 'соотношение ненасыщенных и насыщенных жиров ниже ориентира' });
    }
    if (juiceMl > 0){
      flags.push({ id: 'juice-separate', severity: 'info', message: 'соки и смузи показаны отдельно от воды' });
    }
    if (sweetDrinkMl > 0){
      flags.push({ id: 'sweet-drink-separate', severity: 'warn', message: 'сладкие напитки показаны отдельно от воды и несладких напитков' });
    }
    return flags;
  }

  const VISUAL_STATE_ASSETS = Object.freeze({
    sectorBadge: {
      empty: 'badges/empty-v5.svg',
      'very-low': 'badges/minus-v5.svg',
      low: 'badges/minus-v5.svg',
      'below-target': 'badges/minus-v5.svg',
      target: 'badges/check-v5.svg',
      over: 'badges/plus-v5.svg',
      'strong-over': 'badges/plus-v5.svg'
    },
    deficitOverlay: {
      vegetables: 'overlays/deficit/vegetables-deficit-hatch-v5.svg',
      fruits: 'overlays/deficit/fruits-deficit-hatch-v5.svg',
      wholeGrains: 'overlays/deficit/wholeGrains-deficit-hatch-v5.svg',
      protein: 'overlays/deficit/protein-deficit-hatch-v5.svg'
    },
    overfillOverlay: {
      vegetables: 'overlays/overfill/vegetables-overfill-rim-v5.svg',
      fruits: 'overlays/overfill/fruits-overfill-rim-v5.svg',
      wholeGrains: 'overlays/overfill/wholeGrains-overfill-rim-v5.svg',
      protein: 'overlays/overfill/protein-overfill-rim-v5.svg'
    },
    quality: {
      'fruit-heavy': 'overlays/quality/fruit-heavy-warning-v5.svg',
      'vegetables-low': 'overlays/quality/vegetables-low-warning-v5.svg',
      'refined-grains-present': 'overlays/quality/refined-grains-warning-v5.svg',
      'dairy-separate': 'overlays/quality/dairy-separate-info-v5.svg',
      'processed-meat-warning': 'overlays/quality/processed-protein-warning-v5.svg',
      'saturated-high': 'overlays/quality/saturated-fat-warning-v5.svg'
    }
  });

  function buildVisualPlan(model){
    const sectors = {};
    Object.keys(model.sectors || {}).forEach(function(key){
      const s = model.sectors[key];
      const needsDeficit = ['very-low','low'].indexOf(s.state) >= 0;
      const needsOver = ['over','strong-over'].indexOf(s.state) >= 0;
      sectors[key] = {
        fill: s.cappedFill,
        state: s.state,
        badge: VISUAL_STATE_ASSETS.sectorBadge[s.state] || VISUAL_STATE_ASSETS.sectorBadge.empty,
        deficitOverlay: needsDeficit ? VISUAL_STATE_ASSETS.deficitOverlay[key] : null,
        overfillOverlay: needsOver ? VISUAL_STATE_ASSETS.overfillOverlay[key] : null,
        ariaLabel: s.id + ': ' + s.grams + ' г, ' + s.fillPercent + '% цели, ' + s.stateLabel
      };
    });
    return {
      sectors,
      qualityOverlays: (model.qualityFlags || []).map(function(f){ return { id: f.id, severity: f.severity, asset: VISUAL_STATE_ASSETS.quality[f.id] || null, message: f.message }; }),
      globalOverlay: model.balanced ? 'overlays/global/balance-glow-v5.svg' : null
    };
  }

  function deriveModel(input, options){
    input = input || {};
    options = options || {};
    const waterIndicatorMl = toNumber(input.waterIndicatorMl) || (toNumber(input.waterPlainMl) + toNumber(input.unsweetenedBeverageMl)) || toNumber(input.waterMl);
    const healthyFatSourceG = toNumber(input.healthyFatSourceG) || toNumber(input.fatsG);
    const unsatFromSources = toNumber(input.unsaturatedFatFromSourcesG);
    const satFromSources = toNumber(input.saturatedFatFromSourcesG);
    const grams = {
      vegetablesG: toNumber(input.vegetablesG),
      fruitsG: toNumber(input.fruitsG),
      wholeGrainsG: toNumber(input.wholeGrainsG),
      refinedGrainsG: toNumber(input.refinedGrainsG),
      proteinG: toNumber(input.proteinG),
      dairyG: toNumber(input.dairyG),
      dairyDrinkMl: toNumber(input.dairyDrinkMl),
      healthyFatSourceG,
      fatsG: healthyFatSourceG,
      unsaturatedFatG: toNumber(input.unsaturatedFatG),
      saturatedFatG: toNumber(input.saturatedFatG),
      unsaturatedFatFromSourcesG: unsatFromSources,
      saturatedFatFromSourcesG: satFromSources,
      waterPlainMl: toNumber(input.waterPlainMl),
      unsweetenedBeverageMl: toNumber(input.unsweetenedBeverageMl),
      waterIndicatorMl,
      waterMl: waterIndicatorMl,
      juiceMl: toNumber(input.juiceMl),
      sweetDrinkMl: toNumber(input.sweetDrinkMl),
      processedMeatG: toNumber(input.processedMeatG)
    };

    const proteinForPlate = grams.proteinG + ((options.proteinCountingMode === 'practical-ru') ? grams.dairyG : 0);
    const coreMass = grams.vegetablesG + grams.fruitsG + grams.wholeGrainsG + proteinForPlate;
    const sectors = {
      vegetables: buildSector('vegetables', grams.vegetablesG, coreMass, TARGETS.vegetables),
      fruits: buildSector('fruits', grams.fruitsG, coreMass, TARGETS.fruits),
      wholeGrains: buildSector('wholeGrains', grams.wholeGrainsG, coreMass, TARGETS.wholeGrains),
      protein: buildSector('protein', proteinForPlate, coreMass, TARGETS.protein)
    };
    const flags = deriveQualityFlags(grams, sectors, options);
    const balanced = coreMass > 0 && Object.keys(sectors).every(k => sectors[k].state === 'target') && !flags.some(f => f.severity === 'warn');
    const fatQualityRatio = grams.saturatedFatG > 0 ? grams.unsaturatedFatG / grams.saturatedFatG : (grams.unsaturatedFatG > 0 ? Infinity : 0);
    const sourceFatQualityRatio = grams.saturatedFatFromSourcesG > 0 ? grams.unsaturatedFatFromSourcesG / grams.saturatedFatFromSourcesG : (grams.unsaturatedFatFromSourcesG > 0 ? Infinity : 0);
    const model = {
      version: VERSION,
      proteinCountingMode: options.proteinCountingMode || 'harvard-strict',
      targets: TARGETS,
      grams,
      coreMass: round(coreMass, 0),
      sectors,
      companions: {
        healthyFats: {
          grams: grams.healthyFatSourceG,
          sourceGrams: grams.healthyFatSourceG,
          unsaturatedFatG: round(grams.unsaturatedFatFromSourcesG || grams.unsaturatedFatG, 1),
          saturatedFatG: round(grams.saturatedFatFromSourcesG || grams.saturatedFatG, 1),
          fatQualityRatio: Number.isFinite(sourceFatQualityRatio) && sourceFatQualityRatio > 0 ? round(sourceFatQualityRatio, 2) : round(fatQualityRatio, 2),
          status: grams.healthyFatSourceG <= 0 ? 'empty' : (grams.healthyFatSourceG < 10 ? 'low' : (grams.healthyFatSourceG <= 70 ? 'target' : 'over'))
        },
        water: {
          ml: grams.waterIndicatorMl,
          waterPlainMl: grams.waterPlainMl,
          unsweetenedBeverageMl: grams.unsweetenedBeverageMl,
          juiceMl: grams.juiceMl,
          sweetDrinkMl: grams.sweetDrinkMl,
          status: grams.waterIndicatorMl <= 0 ? 'empty' : (grams.waterIndicatorMl < 900 ? 'low' : (grams.waterIndicatorMl < 1600 ? 'mid' : 'target'))
        },
        dairy: { grams: grams.dairyG, dairyDrinkMl: grams.dairyDrinkMl, status: grams.dairyG <= 0 ? 'empty' : 'separate' },
        drinksSeparate: { juiceMl: grams.juiceMl, sweetDrinkMl: grams.sweetDrinkMl }
      },
      qualityFlags: flags,
      balanced
    };
    model.visualPlan = buildVisualPlan(model);
    return model;
  }

  function getDemoRations(){
    return Object.freeze({
      balanced: { vegetablesG: 280, fruitsG: 120, wholeGrainsG: 200, proteinG: 200, dairyG: 0, healthyFatSourceG: 18, waterPlainMl: 1200, unsweetenedBeverageMl: 300, waterIndicatorMl: 1500 },
      vegetableDeficit: { vegetablesG: 70, fruitsG: 160, wholeGrainsG: 260, proteinG: 190, healthyFatSourceG: 20, waterIndicatorMl: 500 },
      fruitHeavy: { vegetablesG: 80, fruitsG: 260, wholeGrainsG: 160, proteinG: 160, healthyFatSourceG: 12, waterIndicatorMl: 700 },
      grainExcess: { vegetablesG: 150, fruitsG: 80, wholeGrainsG: 420, proteinG: 120, refinedGrainsG: 100, healthyFatSourceG: 15, waterIndicatorMl: 1000 },
      proteinDeficit: { vegetablesG: 220, fruitsG: 90, wholeGrainsG: 220, proteinG: 55, dairyG: 180, healthyFatSourceG: 12, waterIndicatorMl: 1100 }
    });
  }

  global.HarvardPlateV5StageEngine = Object.freeze({
    version: VERSION,
    targets: TARGETS,
    stateBands: STATE_BANDS,
    deriveModel,
    classifyFillRatio,
    computeAdjustment,
    getDemoRations,
    buildVisualPlan
  });
})(window);

return window.HarvardPlateV5StageEngine;})();
export function calculateStructureProfile(result,engine,ration){
 const protectedPolicy=result?.needs?.policy||result?.needs?.meta?.protectedPolicy;
 if(protectedPolicy?.protectedMode===true||result?.needs?.meta?.normsSyncAllowed===false)return {unavailableReason:'В защищённом клиническом режиме эта авторская структурная оценка не рассчитывается: в неё входит белковый компонент с обычным нормативом, который здесь нельзя автоматически применять. Доступны фактический состав рациона и отдельно допустимые расчёты.'};
 if(!result?.hei?.valid||!finite(result.hei.total)||!engine?.db?.byKey||!Array.isArray(ration)||!ration.length)return null;
 const foodRation=Array.isArray(result.foodPatternRation)?result.foodPatternRation:ration;
 if(!foodRation.length)return null;
 const harvardModel=(()=>{const window={DB:engine.db};
  function num(v){ v = Number(v); return Number.isFinite(v) ? v : 0; }
  function clamp(v,a,b){ v = num(v); return Math.max(a, Math.min(b, v)); }
  function lower(s){ return String(s == null ? '' : s).toLowerCase(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmt(n, digits){ return Number.isFinite(Number(n)) ? Number(n).toFixed(digits == null ? 0 : digits).replace(/\.0$/, '') : '—'; }
  function anyWord(t, re){ return re.test(t); }

  function sectorTitle(id){ return ({vegetables:'Овощи', fruits:'Фрукты', wholeGrains:'Цельные злаки', protein:'Белковые продукты'})[id] || id; }
  function sectorTargetText(id){ return ({vegetables:'35%', fruits:'15%', wholeGrains:'25%', protein:'25%'})[id] || ''; }
  function swatchColor(id){ return ({vegetables:'#16a34a', fruits:'#dc2626', wholeGrains:'#d97706', protein:'#0ea5e9'})[id] || '#64748b'; }
  function stateLabel(state){
    return ({empty:'нет данных','very-low':'очень мало',low:'мало','below-target':'ниже ориентира',target:'доля близка к цели',over:'выше ориентира','strong-over':'заметно выше ориентира'})[state] || 'нет данных';
  }
  function shortStateLabel(state){
    return ({empty:'нет данных','very-low':'очень мало',low:'мало','below-target':'ниже цели',target:'цель близко',over:'выше цели','strong-over':'заметно выше'})[state] || 'нет данных';
  }
  function statusTone(state){
    if (state === 'target') return 'ok';
    if (state === 'over' || state === 'strong-over') return 'over';
    if (state === 'very-low' || state === 'low' || state === 'below-target') return 'low';
    return 'empty';
  }

  function getRation(){
    function flat(r){ try { var api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377 || window.CompositeFoodDecomposerV5376; if (api && typeof api.flattenForCalculation === 'function') return api.flattenForCalculation(r||[]); if (api && typeof api.flattenCompositeForCalculation === 'function') return api.flattenCompositeForCalculation(r||[]); } catch(_) {} return r || []; }
    if (window.State && typeof window.State.get === 'function') return flat(window.State.get() || []);
    if (window.Ration && Array.isArray(window.Ration.current)) return window.Ration.current || [];
    try { return JSON.parse(localStorage.getItem('nutri_ration_v1') || '[]'); } catch(_) { return []; }
  }
  function saveRationFallback(ration){ try { localStorage.setItem('nutri_ration_v1', JSON.stringify(ration || [])); } catch(_) {} }
  function product(key){ return window.DB && window.DB.byKey && window.DB.byKey.get ? window.DB.byKey.get(key) : null; }
  function allProducts(){ return window.DB && Array.isArray(window.DB.items) ? window.DB.items : []; }
  function tagsOf(p){
    var raw = p && p.tags;
    if (Array.isArray(raw)) return raw.map(function(t){ return lower(t); }).filter(Boolean);
    // v5.2.33: imported retail products sometimes had tags as "a|b|c" strings.
    // Treat them as tags instead of silently dropping all tags.
    if (typeof raw === 'string') return raw.split(/[|,;]+/).map(function(t){ return lower(t).trim(); }).filter(Boolean);
    return [];
  }
  function textOf(p){ return lower([(p && p.key)||'', (p && p.name)||'', (p && p.name_ru)||'', (p && p.category)||'', (p && p.hei_category_key)||'', tagsOf(p).join(' ')].join(' ')); }
  function productKeyName(p){ return lower(((p && p.key) || '') + ' ' + ((p && p.name) || '') + ' ' + ((p && p.name_ru) || '')); }
  function hasTag(p, re){ return tagsOf(p).some(function(t){ return re.test(t); }); }

  function isSoyProteinWithHeiCredit(p){
    var tagList = tagsOf(p), t = textOf(p), hei = lower(p && p.hei_category_key);
    return hei === 'seafood_plant_protein' && (num(p && p.protein_oz_eq_per_100g) > 0 || num(p && p.seafood_plant_oz_eq_per_100g) > 0) &&
      (tagList.indexOf('hei_soy_protein_credit') >= 0 || tagList.indexOf('soy_protein_isolate') >= 0 ||
       ((tagList.indexOf('soy') >= 0 || anyWord(t, /соев|soy/)) && anyWord(t, /протеин|изолят|концентрат|protein|isolate|concentrate/)));
  }
  function isProcessedMeat(p){
    return anyWord(textOf(p), /колбас|сосиск|ветчин|бекон|салями|сервелат|мортаделл|salami|sausage|ham|bacon|cervelat|mortadella|processed_meat/);
  }
  function isProteinSupplement(p){
    if (isSoyProteinWithHeiCredit(p)) return false;
    var t = textOf(p);
    return hasTag(p, /^(sports_protein|protein_supplement|whey|casein|collagen|beef_protein|gainer|bcaa|isolate|multi_protein|no_hei_protein_food_credit)$/)
      || anyWord(t, /сывороточн.*протеин|казеин|коллаген|говяж.*протеин|гейнер|whey|casein|collagen|beef protein|protein powder|mass gainer|bcaa|isolate/);
  }

  function isSaturatedFatRouteProduct(p){
    var tagList = tagsOf(p), t = productKeyName(p);
    var catalog = lower(p && p.catalog_category_key);
    var fatQuality = lower(p && p.fat_quality_class);
    var limitGroup = lower(p && p.limit_group_key);
    if (catalog === 'saturated_fats' || fatQuality === 'saturated_fat_source' || limitGroup === 'saturated_fats') return true;
    if (tagList.indexOf('saturated_fat_source') >= 0 || tagList.indexOf('limit_saturated_fat') >= 0) return true;
    if (anyWord(t, /морожен|ice\s*cream|чипс|chips|соус|sauce|nut\s*butter|seed\s*butter|peanut\s*butter|almond\s*butter|орехов[а-я\s]*паст|арахисов[а-я\s]*паст|миндальн[а-я\s]*паст|паста\s+из\s+тыквен/)) return false;
    return anyWord(t, /масло\s+сливочн|сливочн.*масло|топл[её]н.*масло|(^|[^a-zа-яё])гхи([^a-zа-яё]|$)|(^|[^a-z])ghee([^a-z]|$)|(^|[^a-z])butter([^a-z]|$)|сливки|сметан|sour\s*cream|heavy\s*cream|whipping\s*cream|light\s*cream|cream\s*cheese|крем[-\s]?чиз|сыр\s*творож|маскарпоне|mascarpone/);
  }
  function isExplicitDairyName(p){
    var t = productKeyName(p);
    if (isSaturatedFatRouteProduct(p)) return false;
    if (anyWord(t, /сосиск|колбас|котлет|meatball|sausage|salami|bacon/)) return false;
    if (anyWord(t, /молоко|йогурт|творог|кефир|айран|ряженк|простокваш|сметан|сливки|сырок|ск[иі]р|milk|yogurt|curd|cottage|kefir|ayran|sour cream|cream|cheese/)) return true;
    return /(^|[^а-яё])сыр($|[^а-яё])/i.test(t);
  }
  function isDairyPrimary(p){
    var hei = lower(p && p.hei_category_key), cat = lower(p && p.category);
    var tagList = tagsOf(p);
    if (isSaturatedFatRouteProduct(p) || isProteinSupplement(p) || isProcessedMeat(p) || isFattySauceOrNonRecommendedFat(p)) return false;
    if (hei === 'dairy' || cat === 'dairy') return true;
    // v5.3.119: an egg/meat/fish dish with a small dairy component remains a protein dish.
    // The dairy equivalent is still retained by hasDairyComponent() as a secondary role.
    if ((hei === 'protein_foods' || hei === 'seafood_plant_protein') &&
        (num(p && p.protein_oz_eq_per_100g) > 0 || num(p && p.seafood_plant_oz_eq_per_100g) > 0)) return false;
    // A small dairy equivalent in a mixed dish is a component, not the main group.
    if (tagList.indexOf('dairy') >= 0 && tagList.indexOf('ready_meal') < 0 && tagList.indexOf('ready_food') < 0 && tagList.indexOf('dairy_derived') < 0) return true;
    return isExplicitDairyName(p);
  }
  function hasDairyComponent(p){
    if (isSaturatedFatRouteProduct(p)) return false;
    return isDairyPrimary(p) || num(p && p.dairy_cup_eq_per_100g) > 0 || (tagsOf(p).indexOf('dairy') >= 0 && !isProteinSupplement(p));
  }
  function isSoyProteinDairyAlternative(p){
    var t = textOf(p), tagList = tagsOf(p), hei = lower(p && p.hei_category_key);
    return hei === 'seafood_plant_protein' && (tagList.indexOf('soy') >= 0 || anyWord(t, /соев|soy/)) &&
      (num(p && p.protein_oz_eq_per_100g) > 0 || num(p && p.seafood_plant_oz_eq_per_100g) > 0);
  }
  // Compatibility alias: in old code "isDairy" meant "primary dairy". Use hasDairyComponent() where a role is needed.
  function isDairy(p){ return isDairyPrimary(p); }

  function isDessertOrSweetMainProduct(p){
    var t = textOf(p);
    if (isDairyPrimary(p) && anyWord(t, /десерт|слад|глазирован|мёд|мед|джем|варень|шоколад|(^|[^a-z])(sweet|sweetened)($|[^a-z])|glazed|honey|jam|chocolate/i)) return true;
    // v5.2.33: do not match "замороженный" and do not match "печень" (liver) as cookie.
    return anyWord(t, /десерт|мороженое|пирож|торт|печенье|вафл|конфет|шоколад|джем|варень|пастил|зефир|батончик|dessert|ice cream|cake|cookie|biscuit|waffle|chocolate|jam|confectionery|(^|[^a-z])sweetened($|[^a-z])|sweet dessert|sweet snack/i);
  }

  function blocksMainPlateFruitVegByMatrix(p){
    return isDairyPrimary(p) || isDessertOrSweetMainProduct(p) || isJuiceOrSmoothie(p) || isSweetDrink(p);
  }

  function isPlainWaterProduct(p){
    var tagList = tagsOf(p), t = productKeyName(p);
    if (tagList.indexOf('water') >= 0) return true;
    return anyWord(t, /(^|[_\s-])water_plain|plain water|still water|drinking water|питьевая вода|вода питьевая|^вода$/);
  }

  function isJuiceOrSmoothie(p){
    var t = productKeyName(p), tagList = tagsOf(p);
    if (tagList.indexOf('juice') >= 0 || tagList.indexOf('smoothie') >= 0 || tagList.indexOf('nectar') >= 0) return true;
    // v5.2.33: "рыба в собственном соку" must not become juice/beverage.
    if (anyWord(t, /в\s+собственн.*сок|в\s+соку|own juice|in juice/)) return false;
    return anyWord(t, /(^|[^а-яё])сок($|[^а-яё])|смузи|нектар|\bjuice\b|smoothie|nectar/);
  }

  function isSweetDrink(p){
    var t = productKeyName(p), tagList = tagsOf(p);
    if (tagList.indexOf('sweet_drink') >= 0 || tagList.indexOf('soda') >= 0) return true;
    if (anyWord(t, /газиров|лимонад|cola|soda|soft drink|sweet drink/)) return true;
    return false;
  }
  function isUnsweetenedBeverage(p){
    var t = productKeyName(p), tagList = tagsOf(p);
    if (isPlainWaterProduct(p) || isJuiceOrSmoothie(p) || isSweetDrink(p)) return false;
    if (tagList.indexOf('unsweetened_beverage') >= 0 || tagList.indexOf('tea') >= 0 || tagList.indexOf('coffee') >= 0) return true;
    if (anyWord(t, /(^|[^a-zа-яё])(чай|кофе|tea|coffee)($|[^a-zа-яё])/i)) return !anyWord(t, /сахар|sweet|sugar|латте|капучино|молок|milk/);
    return false;
  }
  function isDairyDrink(p){ return isDairyPrimary(p) && anyWord(productKeyName(p), /молоко|кефир|айран|тан|напиток|milk|kefir|ayran|drink/); }

  function isWhiteRiceRefined(p){
    var t = productKeyName(p);
    if (!anyWord(t, /рис|rice|basmati|басмати/)) return false;
    if (anyWord(t, /бурый|коричнев|дикий|brown|wild|whole/)) return false;
    return anyWord(t, /белый|басмати|basmati|круглоз[её]рн|short grain|пропар|parboiled|white rice/);
  }
  function isHarvardExcludedPotato(p){
    var t = productKeyName(p), tagList = tagsOf(p);
    // v5.3.122: generic 'chips' is insufficient; corn/tortilla/fruit chips are not potatoes.
    if (tagList.indexOf('potato') < 0 && !anyWord(t, /картоф|potato|(^|[^а-яё])фри($|[^а-яё])|(^|[^a-z])fries($|[^a-z])/)) return false;
    if (anyWord(t, /батат|sweet potato/)) return false;
    // If the product is clearly a protein dish with a small potato side, keep the protein sector.
    if ((lower(p && p.hei_category_key) === 'protein_foods' || lower(p && p.hei_category_key) === 'seafood_plant_protein')
        && num(p && p.protein_oz_eq_per_100g) > 0) return false;
    return true;
  }

  function isFruitLike(p){
    var t = textOf(p), hei = lower(p && p.hei_category_key), cat = lower(p && p.category);
    var fruitEq = num(p && p.fruit_cup_eq_per_100g), wholeFruitEq = num(p && p.whole_fruit_cup_eq_per_100g);
    var vegEq = num(p && p.veg_cup_eq_per_100g) + num(p && p.greens_beans_cup_eq_per_100g);
    if (isSaturatedFatRouteProduct(p) || hasTag(p, /^(not_fruit_credit|avocado|healthy_fat_source)$/) || anyWord(productKeyName(p), /авокад|avocado|масло|(^|[^a-z])oil($|[^a-z])/)) return false;
    if (fruitEq > 0 || wholeFruitEq > 0) return true;
    // Explicit vegetable equivalents take precedence over category/name substrings such as
    // "banana blossom", "cooking banana" and other botanical names.
    if (vegEq > 0) return false;
    return hei === 'fruits_berries' || hei === 'fruits' || cat === 'fruits' || anyWord(t, /фрукт|яблок|банан|апельс|ягод|виноград|груш|fruit|apple|banana|orange|berry|grape|pear/);
  }
  function isVegetableLike(p){
    var t = textOf(p), hei = lower(p && p.hei_category_key), cat = lower(p && p.category);
    var vegEq = num(p && p.veg_cup_eq_per_100g) + num(p && p.greens_beans_cup_eq_per_100g);
    var fruitEq = num(p && p.fruit_cup_eq_per_100g) + num(p && p.whole_fruit_cup_eq_per_100g);
    if (hasTag(p, /^(healthy_fat_source|not_vegetable_credit|avocado)$/) || anyWord(productKeyName(p), /авокад|avocado/)) return false;
    if (vegEq > 0) return true;
    if (fruitEq > 0) return false;
    return hei === 'vegetables' || cat === 'vegetables' || anyWord(t, /овощ|зелень|салат|брокк|капуст|огур|помид|томат|перец|морков|кабач|свекл|spinach|broccoli|cucumber|tomato|pepper|vegetable/);
  }
  function isFattySauceOrNonRecommendedFat(p){
    var t = textOf(p), k = productKeyName(p);
    if (hasTag(p, /^(not_fatty_sauce)$/)) return false;
    return isSaturatedFatRouteProduct(p)
      || anyWord(t, /майонез|mayonnaise|соус(?!\s+тахини)|sauce(?!\s+tahini)|dressing|заправ|песто|pesto|чипс|chips|начос|nacho|сухарик|crouton|cracker|попкорн|popcorn|сло[её]н.*тест|puff pastry|колбас|сосиск|бекон|bacon|salami|sausage|mortadella|сервелат|мортаделл|вафл|waffle/)
      || anyWord(k, /mayonnaise|mayo|caesar_dressing|garlic_sauce/);
  }

  function isWholeGrainLike(p){
    var t = textOf(p), hei = lower(p && p.hei_category_key);
    if (hasTag(p, /^(not_whole_grain_plate_credit|processed_snack)$/)) return false;
    var wholeEq = num(p && p.whole_grain_oz_eq_per_100g);
    var refinedEq = num(p && p.refined_grain_oz_eq_per_100g);
    if (isWhiteRiceRefined(p)) return false;
    if (isDessertOrSweetMainProduct(p) && wholeEq <= 0) return false;
    if ((hei === 'refined_grains' || refinedEq > 0) && wholeEq <= 0) return false;
    return wholeEq > 0 || hei === 'whole_grains' || anyWord(t, /цельнозерн|гречк|гречне|овсян(?!.*печенье)|рожь\s+цельн|цельн.*рож|перлов|бурый рис|buckwheat|whole grain|wholegrain|whole wheat|rye\s+whole/);
  }
  function isRefinedGrainLike(p){
    var t = textOf(p), hei = lower(p && p.hei_category_key);
    return isWhiteRiceRefined(p) || num(p && p.refined_grain_oz_eq_per_100g) > 0 || hei === 'refined_grains' || anyWord(t, /white bread|белый хлеб|батон|рафинирован|манк|макарон|(^|[^a-z])pasta($|[^a-z])/);
  }
  function isHealthyFatSource(p){
    var t = textOf(p), tagList = tagsOf(p);
    if (tagList.indexOf('not_healthy_fat_source') >= 0) return false;
    if (tagList.indexOf('healthy_fat_source') >= 0) return true;
    // v5.3.121: bread or a grain snack containing seeds remains a grain product, not 100 g of a fat source.
    if (num(p && p.whole_grain_oz_eq_per_100g) > 0 || num(p && p.refined_grain_oz_eq_per_100g) > 0) return false;
    if (isFattySauceOrNonRecommendedFat(p)) return false;
    if (anyWord(t, /масло олив|olive oil|масло подсолнеч|sunflower oil|масло рапс|canola oil|авокад|avocado|тахини|tahini|almond|миндал|грецк|walnut|cashew|кешью|pumpkin seed|тыквен|sunflower seed|семеч|nuts|орех/)) return true;
    if (anyWord(t, /butter|сливочн|маргарин|ghee|сало/)) return false;
    return false;
  }
  function isProteinLike(p){
    var t = textOf(p), hei = lower(p && p.hei_category_key), tagList = tagsOf(p);
    if (isProteinSupplement(p) || isProcessedMeat(p) || isDairyPrimary(p)) return false;
    var explicitProteinEq = num(p && p.protein_oz_eq_per_100g) > 0 || num(p && p.seafood_plant_oz_eq_per_100g) > 0;
    if (!explicitProteinEq && anyWord(t, /масло|(^|[^a-z])oil($|[^a-z])|сливочн|маргарин|ghee/)) return false;
    if (tagList.indexOf('nuts') >= 0 || tagList.indexOf('nut') >= 0 || tagList.indexOf('nut_butter') >= 0 || tagList.indexOf('seeds') >= 0 || tagList.indexOf('seed') >= 0 || anyWord(t, /орех|семеч|семян|миндаль|грецк|кешью|nuts?|seeds?|almond|walnut|cashew/)) return true;
    return hei === 'protein_foods' || hei === 'seafood_plant_protein' || num(p && p.protein_oz_eq_per_100g) > 0 || num(p && p.seafood_plant_oz_eq_per_100g) > 0 || anyWord(t, /рыб|куриц|индей|мяс|яйц|чечев|нут|фасол|тофу|морепродукт|fish|chicken|meat|egg|lentil|beans|tofu/);
  }
  function isProteinDominantForPlate(p){
    if (lower(p && p.harvard_plate_group) === 'protein') return true;
    var hei = lower(p && p.hei_category_key);
    if (!(hei === 'protein_foods' || hei === 'seafood_plant_protein')) return false;
    return num(p && p.protein_oz_eq_per_100g) > 0 || num(p && p.seafood_plant_oz_eq_per_100g) > 0;
  }

  function readFluidTarget(){
    var out = $('needs_out');
    if (!out) return 1800;
    var tiles = out.querySelectorAll('.tile');
    for (var i = 0; i < tiles.length; i++) {
      var title = tiles[i].querySelector('.title');
      var value = tiles[i].querySelector('.value');
      if (!title || !value) continue;
      if (/жидк/i.test(title.textContent || '')) {
        var n = parseFloat(String(value.textContent || '').replace(',', '.').replace(/[^0-9.]/g, ''));
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    return 1800;
  }

  function addDetail(details, p, grams, mainGroup, roles, reason){
    details.push({
      key: p.key,
      grams: grams,
      group: mainGroup || null,
      roles: roles || [],
      reason: reason || '',
      name: (document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru || p.name || p.key)
    });
  }

  function buildV5Input(ration){
    var input = {
      vegetablesG:0, fruitsG:0, wholeGrainsG:0, refinedGrainsG:0, proteinG:0,
      dairyG:0, dairyDrinkMl:0, healthyFatSourceG:0, fatsG:0, fattySauceG:0,
      waterPlainMl:0, unsweetenedBeverageMl:0, waterIndicatorMl:0, waterMl:0,
      juiceMl:0, sweetDrinkMl:0, processedMeatG:0,
      saturatedFatG:0, unsaturatedFatG:0, saturatedFatFromSourcesG:0, unsaturatedFatFromSourcesG:0
    };
    var details = [];
    (ration || []).forEach(function(it){
      var p = product(it.key);
      var g = Math.max(0, num(it.grams));
      if (!p || !g) return;
      var roles = [];
      var plainWater = isPlainWaterProduct(p);
      var unsweetened = isUnsweetenedBeverage(p) && !plainWater;
      var dairyDrink = isDairyDrink(p);
      var juice = isJuiceOrSmoothie(p);
      var sweetDrink = isSweetDrink(p);
      var beverage = plainWater || unsweetened || dairyDrink || juice || sweetDrink;
      var fattySauce = isFattySauceOrNonRecommendedFat(p);
      var healthyFat = isHealthyFatSource(p);
      var soyProteinDairyAlt = isSoyProteinDairyAlternative(p);
      var dairyPrimary = isDairyPrimary(p) && !soyProteinDairyAlt;
      var dairy = hasDairyComponent(p) && !soyProteinDairyAlt;
      var proteinSupplement = isProteinSupplement(p);
      var processedMeat = isProcessedMeat(p);
      var harvardPotato = isHarvardExcludedPotato(p);
      var mixedBlocksFruitVeg = blocksMainPlateFruitVegByMatrix(p);
      var mixedRetailAggregate = hasTag(p, /^(mixed_retail_aggregate)$/);
      var fruit = isFruitLike(p) && !beverage && !mixedBlocksFruitVeg && !mixedRetailAggregate;
      var vegetable = isVegetableLike(p) && !beverage && !mixedBlocksFruitVeg && !mixedRetailAggregate && !harvardPotato;
      var wholeGrain = isWholeGrainLike(p) && !beverage && !dairyPrimary && !proteinSupplement && !mixedRetailAggregate;
      var refinedGrain = isRefinedGrainLike(p) && !wholeGrain && !beverage && !dairyPrimary && !proteinSupplement && !mixedRetailAggregate;
      var protein = (soyProteinDairyAlt || isProteinLike(p)) && !beverage && !dairyPrimary && !proteinSupplement && !mixedRetailAggregate;
      var sat = num(p.sfa) * g / 100;
      var unsat = num(p.unsat) * g / 100;
      input.saturatedFatG += sat;
      input.unsaturatedFatG += unsat;
      if (plainWater) { input.waterPlainMl += g; roles.push('waterPlain'); }
      if (unsweetened) { input.unsweetenedBeverageMl += g; roles.push('unsweetenedBeverage'); }
      if (dairyDrink) { input.dairyDrinkMl += g; roles.push('dairyDrink'); }
      if (juice) { input.juiceMl += g; roles.push('juice'); }
      if (sweetDrink) { input.sweetDrinkMl += g; roles.push('sweetDrink'); }
      if (fattySauce) { input.fattySauceG += g; roles.push('fattySauce'); }
      if (healthyFat) {
        input.healthyFatSourceG += g;
        input.fatsG += g;
        input.saturatedFatFromSourcesG += sat;
        input.unsaturatedFatFromSourcesG += unsat;
        roles.push('healthyFatSource');
      }
      if (dairy) { input.dairyG += g; roles.push('dairy'); }
      if (refinedGrain) { input.refinedGrainsG += g; roles.push('refinedGrain'); }
      if (processedMeat) { input.processedMeatG += g; roles.push('processedMeat'); }
      if (soyProteinDairyAlt) { roles.push('soyProteinDairyAlternative'); }
      if (proteinSupplement) { roles.push('proteinSupplement'); }
      if (harvardPotato) { roles.push('harvardPotato'); }

      var mainGroup = null;
      var reason = '';
      if (wholeGrain) { input.wholeGrainsG += g; mainGroup = 'wholeGrains'; roles.push('wholeGrains'); }
      else if (fruit) { input.fruitsG += g; mainGroup = 'fruits'; roles.push('fruits'); }
      else if (protein && isProteinDominantForPlate(p)) { input.proteinG += g; mainGroup = 'protein'; roles.push('protein'); }
      else if (vegetable) { input.vegetablesG += g; mainGroup = 'vegetables'; roles.push('vegetables'); }
      else if (protein) { input.proteinG += g; mainGroup = 'protein'; roles.push('protein'); }
      else if (refinedGrain) reason = 'рафинированные злаки учитываются отдельно от цельнозернового сектора';
      else if (harvardPotato) reason = 'картофель и картофельные блюда показаны отдельно от овощного сектора Гарвардской тарелки';
      else if (proteinSupplement) reason = 'протеиновые добавки показаны вне основной тарелки и не заменяют сектор здорового белка';
      else if (processedMeat) reason = 'обработанное мясо показано вне основной тарелки: Гарвардская тарелка рекомендует избегать таких источников белка';
      else if (dairy) reason = 'молочные продукты учитываются отдельной строкой и не заполняют фруктовый или белковый сектор';
      else if (mixedRetailAggregate) reason = 'смешанный товарный продукт имеет раздельные HEI-вклады и не относится целиком к одному сектору без декомпозиции';
      else if (mixedBlocksFruitVeg) reason = 'смешанный сладкий продукт не заполняет сектор фруктов или овощей';
      else if (juice) reason = 'соки и смузи не входят в водный индикатор';
      else if (sweetDrink) reason = 'сладкие напитки не входят в водный индикатор';
      else if (fattySauce) reason = 'соус, жирная закуска или обработанный продукт учитывается вне основной тарелки';
      else if (healthyFat && !protein) reason = 'источник жиров учитывается вне основной площади тарелки';
      else if (plainWater || unsweetened) reason = 'вода и несладкие напитки учитываются отдельным индикатором';
      addDetail(details, p, g, mainGroup, roles, reason);
    });
    input.waterIndicatorMl = input.waterPlainMl + input.unsweetenedBeverageMl;
    input.waterMl = input.waterIndicatorMl;
    return { input:input, details:details };
  }


 const built=buildV5Input(foodRation);
 if(!built.details.length)return null;
 const stage=legacyStage.deriveModel(built.input,{proteinCountingMode:'harvard-strict'});
 if(stage.coreMass<=0)return null;
 const ids=['vegetables','fruits','wholeGrains','protein'];
 const score=Math.max(0,Math.round(ids.reduce((sum,id)=>sum+Math.max(0,Math.min(1,1-Math.abs(stage.sectors[id].fillRatio-1))),0)/4*100-(stage.qualityFlags||[]).filter(f=>f.severity==='warn').length*4));
 return {ready:true,empty:false,score,stage,built,coreMass:stage.coreMass};
 })();
 if(!harvardModel)return null;
 const profile=(()=>{
 const VERSION='legacy-six-domain-profile-v5.3.156';
 const window={DB:engine.db,__lastHEIModel:result.hei,HarvardPlateV5337:{getModel:()=>harvardModel},State:{get:()=>foodRation},NutritionCalculationCoreV53155:{snapshot:()=>result},norms:{values:result.references||{}}};
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
    // This legacy layer has a separate scope from the Harvard classifier above.
    // Prefer explicit food-group metadata, with a tightly bounded name fallback.
    // An incidental substring «сыр» in «сырой» must never create dairy credit.
    if (!p) return 0;
    var hei=String(p.hei_category_key||'').toLowerCase(),cat=String(p.category||'').toLowerCase();
    var tagged=Array.isArray(p.tags)&&p.tags.some(function(t){return String(t).toLowerCase()==='dairy';});
    var structured=hei==='dairy'||cat==='dairy'||(Number(p.dairy_cup_eq_per_100g)>0)||tagged;
    var named=!(hei&&hei!=='other'&&hei!=='unknown')&&
      /(?:^|[\s,;(])(?:сыр(?:ок|ники)?|брынза|творог|молоко|йогурт|кефир|айран|ряженка|простокваша|milk|cheese|yogurt|curd|kefir)(?:[\s,;)]|$)/i.test(String(p.name_ru||p.name||''));
    if (!structured&&!named) return 0;
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


 return buildProfileModel();})();
 if(!finite(profile?.dailyStructure)||!finite(profile?.hei))return null;
 return {hei:profile.hei,structure:profile.dailyStructure,strict:profile.strictStructure,agreement:profile.interpretation?.agreement,domains:DOMAINS.map(([key,label,weight])=>({key,label,weight,value:profile.domains[key]})),modelNote:'Авторская структурная модель частично использует компоненты HEI; оси не являются независимыми.',personalProteinReference:finite(result.references?.protein_g?.value)&&result.references.protein_g.value>0,version:'six-domain-explained-v1'};
}
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderStructureMatrix(m,fmt,options={}){
 if(m?.unavailableReason)return '<section class="nut-viz-panel nut-viz-structure" aria-label="Ограничения структурной диаграммы"><h3>Качество и структура рациона</h3><p>'+escapeHtml(m.unavailableReason)+'</p></section>';
 if(!m)return '<section class="nut-viz-panel nut-viz-structure"><h3>Качество и структура рациона</h3><p>Диаграмма пока недоступна. Нужны сведения о продуктах и достаточные данные для двух оценок. Отсутствующие значения нельзя заменять вымышленными баллами.</p></section>';
 const fmtScore=n=>escapeHtml(fmt(n,1));
 const heatId=options.print?'nut-structure-heat-print':'nut-structure-heat-screen';
 const x=(48+2.64*clampDisplay(m.structure)).toFixed(2),y=(312-2.64*clampDisplay(m.hei)).toFixed(2);
 const chart='<svg class="nut-viz-structure-svg" viewBox="0 0 382 360" role="img" aria-label="'+escapeHtml('Координаты рациона: HEI-2020 '+fmt(m.hei,1)+' из 100, структура рациона '+fmt(m.structure,1)+' из 100')+'" xmlns="http://www.w3.org/2000/svg">'+
 '<defs><linearGradient id="'+heatId+'" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f4c9c4"/><stop offset="45%" stop-color="#f8e8c9"/><stop offset="75%" stop-color="#eff0ce"/><stop offset="100%" stop-color="#cae8d6"/></linearGradient></defs>'+
 '<rect x="48" y="48" width="264" height="264" rx="8" fill="url(#'+heatId+')" stroke="#b6c4cd"/>'+
 '<rect x="232.8" y="48" width="79.2" height="79.2" rx="3" fill="#8ccda6" fill-opacity=".27" stroke="#78b894" stroke-opacity=".45"/>'+
 '<path d="M114 48V312 M180 48V312 M246 48V312 M48 114H312 M48 180H312 M48 246H312" stroke="#fff" stroke-opacity=".72" stroke-width="1"/>'+
 '<path d="M232.8 48V312 M48 127.2H312" stroke="#405f72" stroke-width="1.4" stroke-dasharray="5 5" stroke-opacity=".7"/>'+
 '<path d="M48 48V312H312" stroke="#40586a" fill="none" stroke-width="1.6"/>'+
 '<g fill="#344c5e" font-family="Arial,sans-serif" font-size="12"><text x="44" y="330">0</text><text x="233" y="330" text-anchor="middle">70</text><text x="312" y="330" text-anchor="end">100</text><text x="38" y="315" text-anchor="end">0</text><text x="38" y="130" text-anchor="end">70</text><text x="38" y="52" text-anchor="end">100</text><text x="180" y="353" text-anchor="middle">Структура рациона</text><text transform="translate(16 180) rotate(-90)" text-anchor="middle">HEI-2020</text></g>'+
 '<path d="M48 '+y+'H'+x+'V312" stroke="#315d78" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>'+
 '<g class="nut-structure-marker" role="group" tabindex="0" aria-label="'+escapeHtml('Показать точные координаты: HEI-2020 '+fmt(m.hei,1)+', структура рациона '+fmt(m.structure,1))+'">'+
 '<circle class="nut-structure-target" cx="'+x+'" cy="'+y+'" r="24" fill="transparent"/>'+
 '<circle class="nut-structure-ring" cx="'+x+'" cy="'+y+'" r="14" stroke="#285d7f" stroke-width="1.6" fill="none"/>'+
 '<circle cx="'+x+'" cy="'+y+'" r="8.7" fill="#183f61" stroke="#fff" stroke-width="3"/>'+
 '<g class="nut-structure-tooltip" pointer-events="none"><rect x="65" y="59" width="195" height="60" rx="8" fill="#173c55"/><text x="77" y="82" font-size="12" fill="#fff" font-weight="bold">HEI-2020: '+fmtScore(m.hei)+'</text><text x="77" y="103" font-size="12" fill="#fff">Структура рациона: '+fmtScore(m.structure)+'</text></g></g></svg>';
 const highHei=m.hei>=70,highStructure=m.structure>=70;
 const zone=highHei&&highStructure?'Обе оценки выше условной линии 70 баллов':highHei?'HEI выше 70, структура рациона ниже':highStructure?'Структура рациона выше 70, HEI ниже':'Обе оценки ниже условной линии 70 баллов';
 const originHelp=options.print?'':' <button type="button" data-structure-help="structure" aria-haspopup="dialog">Как устроена эта оценка? ↗</button>';
 const methodButtons=options.print?'':'<div class="nut-structure-help-links"><button type="button" data-structure-help="hei" aria-haspopup="dialog">Что такое HEI-2020? <span aria-hidden="true">↗</span></button><button type="button" data-structure-help="structure" aria-haspopup="dialog">Как считается структура рациона? <span aria-hidden="true">↗</span></button></div>';
 const largestGap=m.domains.filter(d=>finite(d.value)).slice().sort((a,b)=>(100-b.value)*b.weight-(100-a.value)*a.weight)[0];
 const gapText=largestGap?'<p class="nut-structure-leading-gap">Сильнее всего общую оценку сейчас снижает раздел «'+escapeHtml(largestGap.label)+'»: он приносит '+fmtScore(largestGap.value*largestGap.weight)+' из возможных '+fmtScore(largestGap.weight*100)+' баллов. Это помогает понять расчёт, но не означает недостатка пищевых веществ.</p>':'';
 const domains=m.domains.map(d=>{
   const has=finite(d.value),weight=d.weight,portion=has?d.value*weight:NaN;
   const info=DOMAIN_METHODS[d.key]||{short:'Одна из частей структурной оценки.',how:'Метод расчёта описан в исходном алгоритме.'};
   return '<details class="nut-viz-structure-domain" data-structure-domain="'+escapeHtml(d.key)+'"'+(options.print?' open':'')+'><summary><span class="nut-structure-domain-top"><span class="nut-structure-name">'+escapeHtml(d.label)+'</span><strong>'+(has?fmtScore(d.value)+'/100':'Нет данных')+'</strong></span>'+
   '<span class="nut-viz-track'+(has?'':' is-unknown')+'" aria-hidden="true">'+(has?'<span style="width:'+clampDisplay(d.value).toFixed(2)+'%"></span>':'')+'</span>'+
   '<span class="nut-structure-domain-foot"><span>Вес в общей оценке: '+escapeHtml(fmt(weight*100,0))+'%</span><b>'+(has?'Даёт '+fmtScore(portion)+' из '+fmtScore(weight*100)+' баллов':'Вклад неизвестен')+'</b></span>'+
   '<span class="nut-structure-expand-label">Как это считается? <span aria-hidden="true">⌄</span></span></summary>'+
   '<div class="nut-structure-domain-explain"><p>'+escapeHtml(info.short)+'</p><p class="nut-structure-domain-math"><strong>Как считают балл.</strong> '+escapeHtml(info.how)+'</p></div></details>';
 }).join('');
 const proteinInfo=m.personalProteinReference?'Белковый показатель сравнивается с рассчитанным ориентиром для вашего профиля.':'Индивидуальный ориентир белка не задан. Пока используется запасное значение 55 г/сут, поэтому белковая часть оценки не персонализирована.';
 const explanation='<details class="nut-viz-structure-insight"'+(options.print?' open':'')+'><summary>Как читать точку и линии</summary><p><strong>'+escapeHtml(zone)+'.</strong> Пунктир на 70 баллах нужен только для наглядности: это не граница между здоровым и нездоровым питанием.</p><p>Оценки основаны на части общих данных и не подтверждают друг друга независимо. Цвета помогают ориентироваться на рисунке, но не показывают медицинский риск.</p><p>Баллы характеризуют введённые продукты. Если вы записали не весь день, по ним нельзя оценивать полноценность суточного питания.</p></details>';
 return '<section class="nut-viz-panel nut-viz-structure" id="nutrition-structure-section">'+
 '<div class="nut-viz-panel-heading"><div><span class="nut-viz-eyebrow">АНАЛИЗ ПИЩЕВЫХ ГРУПП</span><h3>Качество и структура рациона</h3>'+
 '<p>Здесь два способа оценить введённые продукты. HEI-2020 использует 13 показателей качества питания. Структура рациона — отдельная модель из шести составляющих, разработанная с опорой на принципы Гарвардской тарелки.</p></div></div>'+
 '<div class="nut-viz-structure-layout"><div class="nut-structure-chart">'+chart+'<p class="nut-structure-legend"><span aria-hidden="true"></span>Цветной фон — условная шкала. Зелёный квадрат — область, где обе оценки не ниже 70. Наведите на точку или выберите её, чтобы узнать точные значения.</p></div>'+
 '<div class="nut-viz-structure-copy"><div class="nut-viz-structure-scores"><div><span>HEI-2020</span><strong>'+fmtScore(m.hei)+'</strong><small>из 100</small></div><div><span>Структура рациона</span><strong>'+fmtScore(m.structure)+'</strong><small>из 100</small></div></div>'+
 '<p><strong>Что означает точка?</strong> По вертикали отложен HEI-2020, по горизонтали — структура рациона. Чем выше и правее точка, тем больше баллов начисляют правила двух моделей.</p>'+ '<p class="nut-structure-origin"><strong>Что мы называем структурой рациона?</strong> Это соотношение пищевых групп и отдельные особенности состава продуктов. За основу взята идея Гарвардской тарелки: овощи и фрукты, цельные злаки, источники белка. VesninMed дополнительно сравнивает пищевые группы по их массе, учитывает отдельные показатели HEI и количество белка относительно расчётного ориентира.'+originHelp+'</p>'+
 methodButtons+'<p class="nut-structure-context">'+escapeHtml(proteinInfo)+'</p>'+explanation+'</div></div>'+
 '<div class="nut-structure-domain-heading"><h4>Из чего складывается оценка структуры рациона</h4><p>Здесь шесть частей. У каждой свой вес: чем он выше, тем сильнее эта часть влияет на общий балл. Нажмите на карточку, чтобы прочитать объяснение.</p>'+gapText+'</div>'+
 '<div class="nut-viz-structure-domains">'+domains+'</div>'+
 '<p class="nut-viz-disclaimer">Вес шести частей — 25%, 20%, 20%, 15%, 10% и 10%. Он задан в модели VesninMed и пока не прошёл независимую научную проверку. Результат носит справочный характер и не является клинической оценкой состояния здоровья. <a href="https://epi.grants.cancer.gov/hei/hei-2020-table1.html" target="_blank" rel="noopener noreferrer">Официальная методика HEI-2020 ↗</a></p></section>';
}