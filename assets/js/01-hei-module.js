// nutrition calculator v5.3.194 — enhanced HEI renderer ownership and render timestamp
// nutrition calculator v3.9_split_js_modules
// Module: 01-hei-module.js
// Responsibility: HEI scoring, classifiers, recommendations, renderer.
// Extracted from v3.8.1 monolithic app.js without changing runtime logic.

// ===== extracted inline script 3; id=none =====
// ================= HEI MODULE (расширенный) ====================
window.HEI = (() => {
  const STD = {
    fruits_total:       { min: 0.8,  pts: 5,  unit: 'условн. порц./1000',   kind:'adequacy', label:'Все фрукты', tip:'Свежие/замороженные/консервированные фрукты без сахара.' },
    fruits_whole:       { min: 0.4,  pts: 5,  unit: 'условн. порц./1000',   kind:'adequacy', label:'Цельные фрукты', tip:'Учитываются фрукты целиком; соки идут отдельной строкой.' },
    vegetables_total:   { min: 1.1,  pts: 5,  unit: 'условн. порц./1000',   kind:'adequacy', label:'Все овощи', tip:'Овощи любой обработки; картофель учитывается в крахмалистых, но включён в «все».' },
    greens_beans:       { min: 0.2,  pts: 5,  unit: 'условн. порц./1000',   kind:'adequacy', label:'Зелень и бобовые', tip:'Листовые овощи и зрелые бобовые; бобовые учитываются во всех применимых компонентах HEI.' },
    grains_whole:       { min: 1.5,  pts: 10, unit: 'условн. порц./1000',    kind:'adequacy', label:'Цельные зёрна', tip:'Гречка, овсянка, бурый рис, цельнозерновой хлеб/макароны; в интерфейсе — граммы готового продукта/порции.' },
    dairy:              { min: 1.3,  pts: 10, unit: 'условн. порц./1000',   kind:'adequacy', label:'Молочные', tip:'Молоко, кефир, йогурт и другие молочные продукты: в интерфейсе показываются метрические порции.' },
    protein_total:      { min: 2.5,  pts: 5,  unit: 'условн. порц./1000',    kind:'adequacy', label:'Все белковые продукты', tip:'Мясо, рыба, яйца, бобовые, орехи/семечки, соя/тофу.' },
    seafood_plant:      { min: 0.8,  pts: 5,  unit: 'условн. порц./1000',    kind:'adequacy', label:'Рыба и растительный белок', tip:'Рыба, бобовые, соя/тофу, орехи/семечки.' },
    fatty_acids_ratio: { min: 1.2, max: 2.5, pts: 10, unit: 'отношение', kind:'adequacy', label:'Соотношение жиров', tip:'(MUFA+PUFA)/SFA: чем выше, тем лучше.' },
    grains_refined:     { max: 1.8,  maxBad: 4.3,  pts: 10, unit: 'условн. порц./1000', kind:'moderation', label:'Рафинированные зёрна', tip:'Белый рис/хлеб/паста, сдоба.' },
    sodium_g:           { max: 1.1,  maxBad: 2.0,  pts: 10, unit: 'г/1000',     kind:'moderation', label:'Натрий', tip:'Меньше соли/солёных продуктов и соусов.' },
    added_sugars_pct:   { max: 6.5,  maxBad: 26,   pts: 10, unit: '% ккал',      kind:'moderation_pct', label:'Добавленный сахар', tip:'Учитываются сахар и сиропы; природные сахара фруктов и молока относятся к другим компонентам.' },
    sat_fats_pct:       { max: 8,    maxBad: 16,   pts: 10, unit: '% энергии', kind:'moderation', label:'Насыщённые жиры', tip:'Заменяем на ненасыщенные (рыба, орехи, растительные масла).' },
  };

  const HEI_MAP = JSON.parse(document.getElementById('hei_map').textContent);
  const fmt = (n, d=1) => (isFinite(n) ? Number(n).toFixed(d) : '—');
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp = (x0,x1,v,y0,y1)=>{ if(x0===x1)return v>=x1?y1:y0; const t=clamp((v-x0)/(x1-x0),0,1); return y0+(y1-y0)*t; };
  const per1000 = (value, kcalRef)=> value * 1000 / Math.max(1, kcalRef);
  const kcalFromFat = g => g*9;
  const kcalFromCarb = g => g*4;
  const pctEnergyOf = (kcalPart, kcalTotal)=> kcalTotal>0 ? (100*kcalPart/kcalTotal) : 0;

  // v1.3: unified HEI product classification layer.
  // NOTE: this calculator still uses approximate gram-to-equivalent conversions.
  // A fully precise HEI implementation should use per-product FPED equivalents:
  // fruit_cup_eq_per_100g, veg_cup_eq_per_100g, dairy_cup_eq_per_100g,
  // whole_grain_oz_eq_per_100g, refined_grain_oz_eq_per_100g,
  // protein_oz_eq_per_100g, seafood_plant_oz_eq_per_100g.
  const normalizeTag = tag => {
    const t = String(tag || '').toLowerCase().trim();
    const map = {
      fruit: 'fruits',
      vegetable: 'vegetables',
      whole_grain: 'whole_grains',
      refined_grain: 'refined_grains',
      nut: 'nuts',
      seed: 'seeds',
      seed_paste: 'seeds',
      nuts_seeds: 'nuts_seeds',
      fish: 'seafood',
      shellfish: 'seafood',
      seafoods: 'seafood',
      soya: 'soy',
      soybean: 'soy',
      soybeans: 'soy',
      tofu_firm: 'tofu',
      legume: 'legumes',
      legumes: 'legumes',
      legume_veg: 'legumes',
      'legume-veg': 'legumes',
      beans: 'legumes',
      bean: 'legumes',
      peas: 'legumes',
      pea: 'legumes',
      lentil: 'legumes',
      lentils: 'legumes',
      chickpea: 'legumes',
      chickpeas: 'legumes',
      protein_food: 'protein_foods',
      animal_protein: 'animal_protein',
      seafood_plant: 'seafood_plant_protein',
      seafood_plant_proteins: 'seafood_plant_protein',
      fresh_cheese: 'curd',
      cottage_cheese: 'curd'
    };
    return map[t] || t;
  };
  const tagsOf = p => Array.isArray(p && p.tags) ? p.tags.map(normalizeTag) : [];
  const hasTag = (p, t) => tagsOf(p).includes(normalizeTag(t));
  const hasAnyTag = (p, arr) => (arr || []).some(t => hasTag(p, t));
  const normState = p => String(p && p.state || '').toLowerCase().trim();
  const textOf = p => String(((p && p.name_ru) || '') + ' ' + ((p && p.name) || '')).toLowerCase();
  const nameAll = p => textOf(p);

  const isVeg = p => (p && p.category === 'Vegetables') || p?.hei_category_key === 'vegetables' || hasTag(p,'vegetables');
  const isLeafy = p => hasTag(p,'leafy') || /ромэн|латук|шпинат|кресс|кейл|мангольд|эндив|радиккьо|arugula|mizuna/i.test(textOf(p));
  const isCooked = p => (normState(p)==='boiled'||normState(p)==='cooked');
  const isFruit = p => (p && p.category === 'Fruits') || p?.hei_category_key === 'fruits_berries' || hasTag(p,'fruits');
  const isDriedFruit = p => isFruit(p) && (normState(p)==='dry' || normState(p)==='dried' || hasAnyTag(p, ['dried_fruit','dried','dry']));

  const isDairy = p =>
    p?.category === 'Dairy' ||
    p?.hei_category_key === 'dairy' ||
    hasAnyTag(p, ['dairy','cheese','milk','yogurt','kefir','curd']);
  const isDairyCheese = p =>
    isDairy(p) && (
      hasTag(p, 'cheese') ||
      /\bcheese\b/i.test(p?.name || '') ||
      /(^|[\s(«"'])сыр($|[\s),.:;»"'-])/iu.test(p?.name_ru || '')
    );
  const isDairyMilkYog = p =>
    isDairy(p) &&
    !isDairyCheese(p) &&
    (
      hasAnyTag(p, ['milk','yogurt','kefir','fermented','curd']) ||
      /молок|йогурт|кефир|ряженк|айран|тан|пахт|сыворотк|творог|ricotta|рикотт/i.test(textOf(p))
    );
  const isSaturatedFatRouteProduct = p => {
    const text = textOf(p);
    const catalog = String(p && p.catalog_category_key || '').toLowerCase();
    const fatQuality = String(p && p.fat_quality_class || '').toLowerCase();
    const limitGroup = String(p && p.limit_group_key || '').toLowerCase();
    if (catalog === 'saturated_fats' || fatQuality === 'saturated_fat_source' || limitGroup === 'saturated_fats') return true;
    if (hasAnyTag(p, ['saturated_fat_source','limit_saturated_fat'])) return true;
    if (/морожен|ice\s*cream|чипс|chips|соус|sauce|nut\s*butter|seed\s*butter|peanut\s*butter|almond\s*butter|орехов[а-я\s]*паст|арахисов[а-я\s]*паст|миндальн[а-я\s]*паст|паста\s+из\s+тыквен/i.test(text)) return false;
    return /сливочн[а-я\s]*масло|топл[её]н[а-я\s]*масло|(^|[^a-zа-яё])гхи([^a-zа-яё]|$)|(^|[^a-z])ghee([^a-z]|$)|(^|[^a-z])butter([^a-z]|$)|сливки|сметан|sour\s*cream|heavy\s*cream|whipping\s*cream|light\s*cream|cream\s*cheese|крем[-\s]?чиз|сыр\s*творож|маскарпоне|mascarpone/i.test(text);
  };
  const isDairyExcludedFromHEI = p => isSaturatedFatRouteProduct(p) || hasAnyTag(p, ['butter','ghee','cream']) || /сливочн[а-я\s]*масло|топл[её]н[а-я\s]*масло|\bghee\b|сливки|сметан/i.test(textOf(p));

  const isWholeGrain = p => hasTag(p,'whole_grains') || p?.hei_category_key === 'whole_grains';
  const isRefinedGrain = p => hasTag(p,'refined_grains') || p?.hei_category_key === 'refined_grains';

  const isEgg = p => hasAnyTag(p, ['egg','eggs']) || /яйц|egg/.test(textOf(p));
  const isSeafood = p =>
    hasAnyTag(p, ['seafood','fish','shellfish']) ||
    /рыб|лосос|семг|сёмг|кета|нерк|кижуч|чавыч|горбуш|форел|сом|окун|судак|карп|щук|лещ|сайр|минтай|хек|мерлуз|треск|путасс|камбал|палтус|сардин|сардинел|сельд|селед|мойв|кильк|тунец|скумбр|кревет|кальмар|осьминог|мидии|устриц|краб|омар|лангуст|дорадо|сибас|хариус|сайда|наваг|толстолобик|пангасиус|tilapia|seafood|fish|salmon|tuna|sardine|anchov|cod|hake|pollock|trout|halibut|shrimp|prawn|mussel|oyster|crab|lobster/.test(textOf(p));
  const isSoyProduct = p =>
    hasAnyTag(p, ['soy','tofu','tempeh','natto']) ||
    /соя|соев|тофу|темпе|натто|soy|tofu|tempeh|natto/.test(textOf(p));
  const isNutsSeeds = p =>
    hasAnyTag(p, ['nuts','seeds','nuts_seeds']) ||
    /орех|миндал|кешью|фисташ|фундук|арахис|семеч|семена|кунжут|чиа|(?:^|\\s)л[её]н(?:\\s|$)|\\bnut\\b|almond|cashew|pistachio|hazelnut|peanut|\\bseed\\b|sesame|chia|flax/.test(textOf(p));
  const isLegume = p => {
    // Soy products (tofu, natto, soy yogurt, tempeh) count for Seafood/Plant Protein,
    // but should not automatically be counted as vegetable/greens-beans in this approximation.
    if (isSoyProduct(p) && !hasAnyTag(p, ['legumes','beans','peas','lentils','chickpeas'])) return false;
    return hasAnyTag(p, ['legumes','beans','peas','lentils','chickpeas']) ||
      /боб|фасол|горох|нут|чечев|маш|эдамаме|legume|bean|pea|lentil|chickpea/.test(textOf(p));
  };

  const isProteinFood = p => (
    p?.hei_category_key === 'protein_foods' ||
    p?.hei_category_key === 'seafood_plant_protein' ||
    p?.category === 'Meat' ||
    p?.category === 'Seafood & Plant Protein' ||
    hasAnyTag(p, [
      'protein_foods','animal_protein','meat','poultry','chicken','turkey','beef','pork','lamb','veal','rabbit',
      'egg','eggs','seafood','soy','tofu','tempeh','natto','legumes','beans','peas','lentils','chickpeas','nuts','seeds','nuts_seeds'
    ]) || isEgg(p) || isSeafood(p) || isSoyProduct(p) || isNutsSeeds(p) || isLegume(p)
  );

  const isSeafoodPlantProtein = p => (
    p?.hei_category_key === 'seafood_plant_protein' ||
    hasTag(p, 'seafood_plant_protein') ||
    isSeafood(p) || isSoyProduct(p) || isNutsSeeds(p) || isLegume(p)
  );

  const isWholeFruit = p => isFruit(p);

  const vegCupKey = p => isLeafy(p) ? (isCooked(p)?'vegetables.leafy_cooked':'vegetables.leafy_raw')
                                    : (isCooked(p)?'vegetables.generic_cooked':'vegetables.generic_raw');
  const vegetableCupEqGrams = p => HEI_MAP.cup_eq[vegCupKey(p)] || 130;
  const greensBeansCupEqGrams = p => HEI_MAP.cup_eq[vegCupKey(p)] || 130;
  const legumeCupEqGrams = p => HEI_MAP.cup_eq['vegetables.legumes_cooked'] || 170;
  const fruitCupEqGrams = p => isDriedFruit(p) ? (HEI_MAP.cup_eq['fruits.dried'] || 40)
                                                : (HEI_MAP.cup_eq['fruits.generic'] || 150);
  const grainOzEqGrams = p => {
    const st = normState(p);
    if (st === 'dry' || st === 'dried' || hasAnyTag(p, ['dry','flour','cereal_dry'])) return HEI_MAP.oz_eq['grains.dry'] || 28.35;
    if (st === 'baked' || hasAnyTag(p, ['bread','crispbread','bakery','cracker'])) return HEI_MAP.oz_eq['grains.dry'] || 28.35;
    return HEI_MAP.oz_eq['grains.whole_cooked'] || 85;
  };
  const proteinOzEqGrams = p => {
    if (isEgg(p)) return 50;
    if (isLegume(p)) return HEI_MAP.oz_eq['protein.legume_cooked'] || 43;
    if (isNutsSeeds(p)) return HEI_MAP.oz_eq['protein.nuts_seeds'] || 14.0;
    return HEI_MAP.oz_eq['protein.meat_fish_eggs'] || 28.35;
  };
  const dairyCupEqGrams = p => {
    if (!isDairy(p) || isDairyExcludedFromHEI(p)) return null;
    if (isDairyCheese(p)) return HEI_MAP.cup_eq['dairy.cheese'] || 42;
    if (hasTag(p, 'ice_cream')) return 134; // Approximation until product-level FPED equivalents are added.
    if (hasTag(p, 'curd') || /творог|ricotta|рикотт/i.test(textOf(p))) return HEI_MAP.cup_eq['dairy.milk_yogurt'] || 244; // Approximation.
    return HEI_MAP.cup_eq['dairy.milk_yogurt'] || 244;
  };

  if (typeof window !== 'undefined') {
    window.__HEIClassifiers = {
      normalizeTag, tagsOf, hasTag, hasAnyTag, textOf,
      isDairy, isDairyCheese, isDairyMilkYog, isFruit, isVeg, isLeafy, isDriedFruit,
      isWholeGrain, isRefinedGrain, isEgg, isSeafood, isSoyProduct, isNutsSeeds, isLegume,
      isProteinFood, isSeafoodPlantProtein,
      fruitCupEqGrams, vegetableCupEqGrams, greensBeansCupEqGrams, legumeCupEqGrams, grainOzEqGrams, proteinOzEqGrams, dairyCupEqGrams
    };
  }

  function computeIntake(ration, DB){
    if (window.HEI2020InputAdapterV2 && typeof window.HEI2020InputAdapterV2.adapt === 'function') {
      return window.HEI2020InputAdapterV2.adapt(ration, DB);
    }
    const acc = { fruits_total:0, fruits_whole:0, vegetables_total:0, greens_beans:0,
      grains_whole:0, grains_refined:0, dairy:0, protein_excl_legumes:0, legumes_as_protein:0,
      legumes_veg_total:0, legumes_greens_beans:0, seafood_plant:0,
      sodium_mg:0, fatty_sfa_g:0, fatty_unsat_g:0, added_sugars_g:0, added_sugars_tsp:0, energy_kcal:0 };

    const hasEq = (p, field) => {
      const raw = p && p[field];
      return raw !== null && raw !== '' && typeof raw !== 'boolean'
        && Number.isFinite(Number(raw)) && Number(raw) >= 0;
    };
    const eq = (p, field) => hasEq(p, field) ? Number(p[field]) : null;
    const addEq = (p, g, field, target) => {
      const per100 = eq(p, field);
      if (per100 === null) return false;
      acc[target] += g * per100 / 100;
      return true;
    };

    for (const {key, grams} of (ration||[])){
      if (!grams || grams<=0) continue;
      const p = DB.byKey.get(key); if (!p) continue;
      const g = grams;

      acc.energy_kcal   += g*(p.kcal||0)/100;
      acc.sodium_mg     += g*(p.sodium_mg||0)/100;
      acc.fatty_sfa_g   += g*(p.sfa||0)/100;
      acc.fatty_unsat_g += g*(p.unsat||0)/100;

      const vegetableMatched = isVeg(p);
      const greensMatched = isLeafy(p);
      const legumeMatched = isLegume(p);

      const fruitUsed = addEq(p, g, 'fruit_cup_eq_per_100g', 'fruits_total');
      const wholeFruitUsed = addEq(p, g, 'whole_fruit_cup_eq_per_100g', 'fruits_whole');
      let vegUsed = false;
      let greensUsed = false;
      const vegPer100 = eq(p, 'veg_cup_eq_per_100g');
      if (vegPer100 !== null){
        if (legumeMatched) acc.legumes_veg_total += g * vegPer100 / 100;
        else acc.vegetables_total += g * vegPer100 / 100;
        vegUsed = true;
      }
      const greensPer100 = eq(p, 'greens_beans_cup_eq_per_100g');
      if (greensPer100 !== null){
        if (legumeMatched) acc.legumes_greens_beans += g * greensPer100 / 100;
        else acc.greens_beans += g * greensPer100 / 100;
        greensUsed = true;
      }
      const dairyUsed = addEq(p, g, 'dairy_cup_eq_per_100g', 'dairy');
      const wholeGrainUsed = addEq(p, g, 'whole_grain_oz_eq_per_100g', 'grains_whole');
      const refinedGrainUsed = addEq(p, g, 'refined_grain_oz_eq_per_100g', 'grains_refined');

      const proteinPer100 = eq(p, 'protein_oz_eq_per_100g');
      if (proteinPer100 !== null){
        const oz = g * proteinPer100 / 100;
        if (legumeMatched) acc.legumes_as_protein += oz;
        else acc.protein_excl_legumes += oz;
      }
      const seafoodPlantUsed = addEq(p, g, 'seafood_plant_oz_eq_per_100g', 'seafood_plant');

      const addedSugarTspPer100 = eq(p, 'added_sugars_tsp_eq_per_100g');
      const addedSugarGramsPer100 = Math.max(0, Number(p.added_sugar) || 0);
      const useTspEquivalent = addedSugarTspPer100 !== null
        && (addedSugarTspPer100 > 0 || addedSugarGramsPer100 <= 0);
      if (useTspEquivalent){
        const tsp = g * addedSugarTspPer100 / 100;
        acc.added_sugars_tsp += tsp;
        acc.added_sugars_g += tsp * 4;
      } else {
        const sugarGrams = g * addedSugarGramsPer100 / 100;
        acc.added_sugars_g += sugarGrams;
        acc.added_sugars_tsp += sugarGrams / 4;
      }

      // Fallbacks remain available only for records without explicit HEI-equivalent fields.
      if (!vegUsed && vegetableMatched) acc.vegetables_total += g / vegetableCupEqGrams(p);
      if (!greensUsed && greensMatched) acc.greens_beans += g / greensBeansCupEqGrams(p);
      if (!vegUsed && legumeMatched && !vegetableMatched) acc.legumes_veg_total += g / legumeCupEqGrams(p);
      if (!greensUsed && legumeMatched && !greensMatched) acc.legumes_greens_beans += g / legumeCupEqGrams(p);

      if (!fruitUsed && isFruit(p)) acc.fruits_total += g / fruitCupEqGrams(p);
      if (!wholeFruitUsed && isFruit(p) && isWholeFruit(p)) acc.fruits_whole += g / fruitCupEqGrams(p);

      if (!dairyUsed){ const dairyEq = dairyCupEqGrams(p); if (dairyEq) acc.dairy += g / dairyEq; }
      if (!wholeGrainUsed && isWholeGrain(p)) acc.grains_whole += g / grainOzEqGrams(p);
      if (!refinedGrainUsed && isRefinedGrain(p)) acc.grains_refined += g / grainOzEqGrams(p);

      if (proteinPer100 === null && isProteinFood(p)) {
        const oz = g / proteinOzEqGrams(p);
        if (legumeMatched) acc.legumes_as_protein += oz;
        else acc.protein_excl_legumes += oz;
      }
      if (!seafoodPlantUsed && isSeafoodPlantProtein(p)) acc.seafood_plant += g / proteinOzEqGrams(p);
    }
    return acc;
  }

  function scoreFromDensity(density, intakeEnergyKcal, energyRefKcal){
    const intakeEnergy = Number(intakeEnergyKcal);
    if (!Number.isFinite(intakeEnergy) || intakeEnergy <= 0) {
      const P = {};
      Object.keys(STD).forEach(key => { P[key] = 0; });
      return { density, points:P, total:0, grade:'F', energyRefKcal:0, intake:{ energy_kcal:0, sodium_mg:0, fatty_sfa_g:0, fatty_unsat_g:0, added_sugars_g:0 }, methodology:{id:'HEI-2020',canonical:false,energyBasis:'density_simulation'}, simulation:{mode:'density_only',canonical:false}, valid:false, invalidReason:'empty_ration', formulaAudit:(window.NutritionFormulaRegistryP14?window.NutritionFormulaRegistryP14.audit(['hei.density','hei.adequacy_component','hei.moderation_component','hei.fatty_acid_ratio','hei.total']):null) };
    }
    const P = {};
    const adeq = n => P[n] = lerp(0, STD[n].min, density[n], 0, STD[n].pts);
    adeq('fruits_total'); adeq('fruits_whole'); adeq('vegetables_total'); adeq('greens_beans');
    adeq('grains_whole'); adeq('dairy'); adeq('protein_total'); adeq('seafood_plant');
    P.fatty_acids_ratio = lerp(STD.fatty_acids_ratio.min, STD.fatty_acids_ratio.max, density.fatty_acids_ratio, 0, STD.fatty_acids_ratio.pts);
    const mod = n => P[n] =
      (density[n] <= STD[n].max) ? STD[n].pts :
      (density[n] >= STD[n].maxBad) ? 0 :
      lerp(STD[n].maxBad, STD[n].max, density[n], 0, STD[n].pts);
    mod('grains_refined'); mod('sodium_g'); mod('added_sugars_pct'); mod('sat_fats_pct');
    const total = Object.values(P).reduce((a,b)=>a+b,0);

    const intake = {
      energy_kcal: intakeEnergyKcal,
      sodium_mg: density.sodium_g * energyRefKcal, // г/1000 * (kcalRef/1000) * 1000 мг
      fatty_sfa_g: density.sat_fats_pct * intakeEnergyKcal / 100 / 9,
      fatty_unsat_g: density.fatty_acids_ratio * (density.sat_fats_pct * intakeEnergyKcal / 100 / 9),
      added_sugars_g: density.added_sugars_pct * intakeEnergyKcal / 100 / 4
    };
    return {density, points:P, total, grade:(window.HEI2020CoreV2?window.HEI2020CoreV2.grade(total):''), energyRefKcal, intake, valid:true, methodology:{id:'HEI-2020',canonical:false,energyBasis:'density_simulation'}, simulation:{mode:'density_only',canonical:false,limitations:['energy_not_recalculated','cross_component_effects_not_recalculated']}, formulaAudit:(window.NutritionFormulaRegistryP14?window.NutritionFormulaRegistryP14.audit(['hei.density','hei.adequacy_component','hei.moderation_component','hei.fatty_acid_ratio','hei.total']):null)};
  }

  function score(intake, energyRefKcal){
    if (window.HEIRuntimeV2 && typeof window.HEIRuntimeV2.calculateFromIntake === 'function' && window.__HEI_V2_CONFIG__?.mode !== 'off') {
      return window.HEIRuntimeV2.calculateFromIntake(intake, energyRefKcal);
    }
    const eRef = Math.max(1, Number(intake && intake.energy_kcal) || 1);
    // v5.3.106: HEI-2015/HEI-2020 legume allocation.
    // NCI/USDA count mature legumes in all four applicable adequacy components:
    // Total Protein Foods, Seafood & Plant Proteins, Total Vegetables, and Greens & Beans.
    const protein_total_oz = Number(intake.protein_excl_legumes || 0) + Number(intake.legumes_as_protein || 0);
    const vegetablesTotalWithLegumes = Number(intake.vegetables_total || 0) + Number(intake.legumes_veg_total || 0);
    const greensBeansWithLegumes = Number(intake.greens_beans || 0) + Number(intake.legumes_greens_beans || 0);

    const d = {
      fruits_total:     per1000(intake.fruits_total, eRef),
      fruits_whole:     per1000(intake.fruits_whole, eRef),
      vegetables_total: per1000(vegetablesTotalWithLegumes, eRef),
      greens_beans:     per1000(greensBeansWithLegumes, eRef),
      grains_whole:     per1000(intake.grains_whole, eRef),
      grains_refined:   per1000(intake.grains_refined, eRef),
      dairy:            per1000(intake.dairy, eRef),
      protein_total:    per1000(protein_total_oz, eRef),
      seafood_plant:    per1000(intake.seafood_plant, eRef),
      sodium_g:         per1000(intake.sodium_mg/1000, eRef),
      added_sugars_pct: pctEnergyOf(kcalFromCarb(intake.added_sugars_g), Math.max(intake.energy_kcal,1)),
      sat_fats_pct:     pctEnergyOf(kcalFromFat(intake.fatty_sfa_g), Math.max(intake.energy_kcal,1)),
      fatty_acids_ratio:(intake.fatty_sfa_g>0) ? (intake.fatty_unsat_g/intake.fatty_sfa_g) : (intake.fatty_unsat_g>0 ? STD.fatty_acids_ratio.max : 0)
    };
    return scoreFromDensity(d, intake.energy_kcal, eRef);
  }

  // ==== Доп. тексты (похвала/польза) ====
  const PRAISE = {
    vegetables_total: 'Отлично с овощами — это повышает плотность клетчатки, калия и магния. Продолжайте добавлять овощи в каждый приём пищи.',
    fruits_total: 'Хороший уровень фруктов — это источник витамина C, калия и биоактивных веществ. Поддерживайте разнообразие: яблоки/цитрусы/ягоды.',
    grains_whole: 'Цельные зёрна на хорошем уровне — это больше клетчатки и микронутриентов, ниже гликемическая нагрузка.',
    dairy: 'Молочные в норме — источник кальция и белка.',
    protein_total: 'Белковая группа сбалансирована — оставляйте разнообразие источников.',
    seafood_plant: 'Отлично: рыба/растительный белок — это качественные жиры и микроэлементы.',
    sodium_g: 'Плотность натрия соответствует максимальному баллу HEI; абсолютное суточное количество проверяется отдельно.',
    added_sugars_pct: 'Добавленный сахар соответствует максимальному баллу HEI по доступным данным; полнота исходных данных проверяется отдельно.',
    sat_fats_pct: 'Насыщённые жиры соответствуют максимальному баллу HEI; отдельная проверка общих рекомендаций показана ниже.',
    fruits_whole: 'Цельные фрукты — молодцы: клетчатка и низкая калорийная плотность помогают насыщению.',
    greens_beans: 'Зелень и бобовые — сильная сторона рациона, сохраняйте привычку.'
  };

  // ==== Микро-плейбуки, быстрые действия и замены ====
  const PLAYBOOKS = {
    vegetables_total: {
      actions: [
        {type:'add', tag:'vegetables', grams:150, label:'Добавить салат 150 г', portion:'150 г овощей', meal:'dinner' },
        {type:'add', tag:'vegetables', grams:130, label:'Овощной гарнир 130 г', portion:'~1 порция', meal:'lunch' }
      ]
    },
    fruits_total: {
      actions: [
        {type:'add', tag:'fruits', grams:150, label:'Яблоко/груша 150 г', portion:'~1 шт', meal:'snack' }
      ]
    },
    grains_whole: {
      actions: [
        {type:'add', tag:'whole_grains', grams:40, label:'Овсянка 40 г (сух.)', portion:'40 г сухой крупы', meal:'breakfast' }
      ],
      swaps: [
        {from:{tag:'refined_grains', grams:60, label:'− булочка 60 г'},
         to:{tag:'whole_grains', grams:35, label:'+ хлеб цельнозерн. 35 г'}}
      ]
    },
    dairy: {
      actions: [
        {type:'add', tag:'dairy', grams:200, label:'Кефир/йогурт 200 г', portion:'200 г продукта', meal:'evening' }
      ]
    },
    protein_total: {
      actions: [
        {type:'add', tag:'animal_protein', grams:120, label:'Курица/индейка 120 г', portion:'~1 филе', meal:'lunch' },
        {type:'add', tag:'legume-veg', grams:150, label:'Чечевица/нут 150 г вар.', portion:'~1 порция', meal:'dinner' }
      ]
    },
    seafood_plant: {
      actions: [
        {type:'add', tag:'seafood_plant', grams:150, label:'Рыба 150 г', portion:'~1 стейк', meal:'dinner' },
        {type:'add', tag:'nuts_seeds', grams:25, label:'Орехи 25 г', portion:'~мал. горсть', meal:'snack' }
      ]
    },
    grains_refined: {
      actions: [
        {type:'reduce', tag:'refined_grains', grams:30, label:'− хлеб белый 1 ломтик', portion:'~30 г', meal:'lunch' }
      ],
      swaps: [
        {from:{tag:'refined_grains', grams:60, label:'− булочка 60 г'},
         to:{tag:'whole_grains', grams:35, label:'+ хлеб цельнозерн. 35 г'}}
      ]
    },
    sodium_g: {
      actions: [
        {type:'reduceNa', mg:500, label:'− натрий ≈500 мг', hint:'менее солёные соусы, специи вместо соли' }
      ]
    },
    added_sugars_pct: {
      actions: [
        {type:'reduce', tag:'added_sugar', grams:10, label:'− сахар 10 г', hint:'меньше сладких напитков/десертов' }
      ]
    },
    sat_fats_pct: {
      swaps: [
        {from:{tag:'sat_fats', grams:10, label:'− жирный сыр/масло 10 г'},
         to:{tag:'unsat_fats', grams:10, label:'+ оливковое масло/орехи 10 г'}}
      ]
    }
  };

  // ==== Юнит‑граммы для основных компонентов (для конверсии дельт) ====
  const UNIT_GRAMS = {
    vegetables_total:130, greens_beans:130, fruits_total:150, fruits_whole:150,
    dairy:244, grains_whole:85, protein_total:28.35, seafood_plant:28.35
  };

  // ====== Вспом. вычисления для порогов «до +1 балла / до максимума» ======
  function pointsAdeq(d, key){
    const min = STD[key].min, maxPts = STD[key].pts;
    return clamp(d/min, 0, 1) * maxPts;
  }
  function densityForPointsAdeq(key, pts){
    const min = STD[key].min, maxPts = STD[key].pts;
    const ratio = clamp(pts/maxPts, 0, 1);
    return min * ratio;
  }
  function pointsMod(d, key){
    const {max, maxBad, pts} = STD[key];
    if (d <= max) return pts;
    if (d >= maxBad) return 0;
    return (maxBad - d)/(maxBad - max) * pts;
    }
  function densityForPointsMod(key, ptsTarget){
    const {max, maxBad, pts} = STD[key];
    ptsTarget = clamp(ptsTarget, 0, pts);
    if (ptsTarget === pts) return max;
    if (ptsTarget === 0) return maxBad;
    return maxBad - (ptsTarget/pts)*(maxBad - max);
  }

  function gramsToNextAndMax(key, model){
    const d = model.density[key]||0;
    const eRef = model.energyRefKcal;
    const intakeE = Math.max(1, model.intake.energy_kcal||eRef);
    const maxPts = STD[key].pts||10;
    let toNext=0, toMax=0, unit='г', sign='+';

    if (STD[key].kind==='adequacy'){
      const curPts = pointsAdeq(d, key);
      if (curPts >= maxPts-1e-6){
        toNext = 0; toMax = 0;
      } else {
        const dNext = densityForPointsAdeq(key, Math.min(maxPts, curPts+1));
        const deltaUnitNext = Math.max(0, dNext - d);
        const deltaUnitMax = Math.max(0, STD[key].min - d);
        toNext = (UNIT_GRAMS[key]||0) * (eRef/1000) * deltaUnitNext;
        toMax  = (UNIT_GRAMS[key]||0) * (eRef/1000) * deltaUnitMax;
      }
      unit='г'; sign='+';
    } else if (key==='grains_refined'){
      const curPts = pointsMod(d, key);
      if (curPts >= maxPts-1e-6){ toNext=0; toMax=0; }
      else {
        const dNext = densityForPointsMod(key, Math.min(maxPts, curPts+1));
        const deltaUnitNext = Math.max(0, d - dNext);
        const dMax = densityForPointsMod(key, maxPts);
        const deltaUnitMax = Math.max(0, d - dMax);
        toNext = deltaUnitNext * (eRef/1000) * 85;
        toMax  = deltaUnitMax  * (eRef/1000) * 85;
      }
      unit='г'; sign='−';
    } else if (key==='sodium_g'){
      const curPts = pointsMod(d, key);
      if (curPts >= maxPts-1e-6){ toNext=0; toMax=0; }
      else {
        const dNext = densityForPointsMod(key, Math.min(maxPts, curPts+1));
        const deltaUnitNext = Math.max(0, d - dNext);
        const dMax = densityForPointsMod(key, maxPts);
        const deltaUnitMax = Math.max(0, d - dMax);
        toNext = deltaUnitNext * (eRef);     // мг
        toMax  = deltaUnitMax  * (eRef);     // мг
      }
      unit='мг'; sign='−';
    } else if (key==='added_sugars_pct'){
      const curPts = pointsMod(d, key);
      if (curPts >= maxPts-1e-6){ toNext=0; toMax=0; }
      else {
        const dNext = densityForPointsMod(key, Math.min(maxPts, curPts+1));
        const deltaPctNext = Math.max(0, d - dNext);
        const dMax = densityForPointsMod(key, maxPts);
        const deltaPctMax = Math.max(0, d - dMax);
        toNext = deltaPctNext * intakeE / 100 / 4; // г добавленного сахара
        toMax  = deltaPctMax * intakeE / 100 / 4;
      }
      unit='г'; sign='−';
    } else if (key==='sat_fats_pct'){
      const curPts = pointsMod(d, key);
      if (curPts >= maxPts-1e-6){ toNext=0; toMax=0; }
      else {
        const dNext = densityForPointsMod(key, Math.min(maxPts, curPts+1));
        const deltaPctNext = Math.max(0, d - dNext);
        const dMax = densityForPointsMod(key, maxPts);
        const deltaPctMax = Math.max(0, d - dMax);
        toNext = deltaPctNext * intakeE / 100 / 9; // г SFA
        toMax  = deltaPctMax * intakeE / 100 / 9;
      }
      unit='г'; sign='−';
    } else {
      // ratio и прочие — не считаем граммы
      toNext=0; toMax=0; unit=''; sign='';
    }
    return {toNext, toMax, unit, sign};
  }

  // ==== HEI metric recommendation adapter ====
  // Internal HEI math still uses the official density units.
  // The UI below translates them into Russian metric food portions, so users do not see cup-eq / oz-eq as primary units.
  const HEI_METRIC = {
    fruits_total: {
      noun:'фруктов',
      portionName:'фруктовая порция',
      portionShort:'1 порция фруктов',
      portionMetric:'≈ 150 г фруктов',
      current:g => `≈ ${fmt(g,0)} г фруктов`,
      target:g => `≈ ${fmt(g,0)} г фруктов`,
      next:g => `+${fmt(g,0)} г фруктов до +1 балла; практический шаг: 1 фруктовая порция (≈ 150 г)`
    },
    fruits_whole: {
      noun:'цельных фруктов',
      portionName:'порция цельных фруктов',
      portionShort:'1 порция цельных фруктов',
      portionMetric:'≈ 150 г фруктов целиком, не сок',
      current:g => `≈ ${fmt(g,0)} г цельных фруктов`,
      target:g => `≈ ${fmt(g,0)} г цельных фруктов`,
      next:g => `+${fmt(g,0)} г цельных фруктов до +1 балла; практический шаг: фрукт целиком/ягоды (≈ 150 г)`
    },
    vegetables_total: {
      noun:'овощей',
      portionName:'овощная порция',
      portionShort:'1 порция овощей',
      portionMetric:'≈ 130–150 г обычных овощей',
      current:g => `≈ ${fmt(g,0)} г овощей`,
      target:g => `≈ ${fmt(g,0)} г овощей`,
      next:g => `+${fmt(g,0)} г овощей до +1 балла; практический шаг: салат/овощной гарнир (≈ 130–150 г)`
    },
    greens_beans: {
      noun:'зелени и бобовых',
      portionName:'порция зелени/бобовых',
      portionShort:'1 порция зелени или бобовых',
      portionMetric:'≈ 70 г листовой зелени или 130–170 г готовых бобовых',
      current:g => `≈ ${fmt(g,0)} г в пересчёте зелени/бобовых`,
      target:g => `≈ ${fmt(g,0)} г в пересчёте зелени/бобовых`,
      next:g => `+${fmt(g,0)} г до +1 балла; практический шаг: зелень или бобовые к приёму пищи`
    },
    grains_whole: {
      noun:'цельных злаков',
      portionName:'порция цельных злаков',
      portionShort:'1 порция цельных злаков',
      portionMetric:'≈ 80–100 г готовой каши/крупы или 1 ломтик цельнозернового хлеба',
      current:g => `≈ ${fmt(g,0)} г готовых цельных злаков`,
      target:g => `≈ ${fmt(g,0)} г готовых цельных злаков`,
      next:g => `+${fmt(g,0)} г цельных злаков до +1 балла; практический шаг: 80–100 г готовой каши/крупы`
    },
    dairy: {
      noun:'молочных продуктов',
      portionName:'молочная порция',
      portionShort:'1 молочная порция',
      portionMetric:'≈ 200–250 мл молока, кефира или несладкого йогурта',
      current:g => `≈ ${fmt(g,0)} мл/г молочных продуктов`,
      target:g => `≈ ${fmt(g,0)} мл молока/кефира/йогурта`,
      next:g => `+${fmt(g,0)} мл/г до +1 балла; практический шаг: 1 молочная порция (200–250 мл)`,
      caution:'Если рацион уже калорийный, молочные продукты лучше использовать как замену менее ценным позициям. Сыр подходит для контроля, но как основной способ добора может повышать насыщенные жиры и натрий.'
    },
    protein_total: {
      noun:'белковых продуктов',
      portionName:'порция белкового продукта',
      portionShort:'1 порция белкового блюда',
      portionMetric:'обычно 80–150 г рыбы/птицы/мяса/тофу/бобового блюда',
      current:g => `≈ ${fmt(g,0)} г белковых продуктов в HEI-пересчёте`,
      target:g => `≈ ${fmt(g,0)} г белковых продуктов в HEI-пересчёте`,
      next:g => `+${fmt(g,0)} г в HEI-пересчёте до +1 балла; практический шаг: порция белкового блюда 80–150 г`
    },
    seafood_plant: {
      noun:'рыбы и растительного белка',
      portionName:'порция рыбы/растительного белка',
      portionShort:'1 порция рыбы или растительного белка',
      portionMetric:'обычно 80–150 г рыбы/тофу/бобового блюда или умеренная порция орехов/семян',
      current:g => `≈ ${fmt(g,0)} г рыбы/растительного белка в HEI-пересчёте`,
      target:g => `≈ ${fmt(g,0)} г рыбы/растительного белка в HEI-пересчёте`,
      next:g => `+${fmt(g,0)} г в HEI-пересчёте до +1 балла; практический шаг: рыба, бобовые, тофу, орехи/семена`
    }
  };

  function adequacyUnitsNow(key, model){ return (model.density[key] || 0) * model.energyRefKcal / 1000; }
  function adequacyUnitsNeed(key, model){ return (STD[key].min || 0) * model.energyRefKcal / 1000; }
  function adequacyUnitDeficit(key, model){ return Math.max(0, adequacyUnitsNeed(key, model) - adequacyUnitsNow(key, model)); }
  function metricGramsForUnits(key, units){ return (UNIT_GRAMS[key] || 0) * Math.max(0, units || 0); }
  function fmtUnits(n){ return fmt(n, n >= 10 ? 0 : 1); }
  function metricMeta(key){ return HEI_METRIC[key] || null; }

  function buildAdequacyMetricRow(key, model){
    const meta = metricMeta(key);
    const d = model.density;
    const P = model.points;
    const eRef = model.energyRefKcal;
    const nowUnits = adequacyUnitsNow(key, model);
    const needUnits = adequacyUnitsNeed(key, model);
    const deficitUnits = adequacyUnitDeficit(key, model);
    const gNow = metricGramsForUnits(key, nowUnits);
    const gNeed = metricGramsForUnits(key, needUnits);
    const gDef = metricGramsForUnits(key, deficitUnits);
    const next = gramsToNextAndMax(key, model);
    const maxPts = STD[key].pts || 10;
    const isMax = (P[key] || 0) >= maxPts - 1e-6;

    let value, norm, delta;
    if (meta) {
      value = meta.current(gNow);
      norm = `ориентир HEI: ${meta.target(gNeed)}`;
      if (isMax || gDef < 1) {
        delta = 'Ориентир HEI достигнут.';
      } else {
        const nextText = next.toNext > 1 ? meta.next(next.toNext) : `практический шаг: ${meta.portionShort} (${meta.portionMetric})`;
        const maxText = `до максимального балла HEI остаётся ${meta.target(gDef)}. Это индексный ориентир для выбора замены или добавления; чаще удобнее работать через замену, чем через прибавку «сверху».`;
        delta = `${nextText}. ${maxText}`;
        if (meta.caution) delta += ` ${meta.caution}`;
      }
    } else {
      value = `${fmt(gNow,0)} г`;
      norm = `≥ ${fmt(gNeed,0)} г`;
      delta = (next.toNext>1||next.toMax>1)
        ? `${next.sign}${fmt(next.toNext,0)} ${next.unit} до +1 балла; ${next.sign}${fmt(next.toMax,0)} ${next.unit} до максимума`
        : '—';
    }
    return {
      key,
      label: STD[key].label,
      tip: STD[key].tip,
      value,
      norm,
      delta,
      pts: fmt(P[key],1)
    };
  }

  function buildRows(model){
    const d = model.density, P=model.points, eRef=model.energyRefKcal;
    const rows=[];
    const pushAdeq = (key)=> rows.push(buildAdequacyMetricRow(key, model));

    pushAdeq('fruits_total'); pushAdeq('fruits_whole'); pushAdeq('vegetables_total'); pushAdeq('greens_beans');
    pushAdeq('grains_whole'); pushAdeq('dairy'); pushAdeq('protein_total'); pushAdeq('seafood_plant');

    // ratio
    rows.push({ key:'fatty_acids_ratio', label:STD.fatty_acids_ratio.label, tip:STD.fatty_acids_ratio.tip,
      value:`${fmt(d.fatty_acids_ratio,2)}`, norm:`желательно ≥ ${STD.fatty_acids_ratio.max.toFixed(1)}`,
      delta:'Улучшайте заменой насыщенных жиров на ненасыщенные: рыба, орехи, семена, растительные масла.', pts:fmt(P.fatty_acids_ratio,1) });

    // moderation
    const m1 = gramsToNextAndMax('grains_refined', model);
    const _gr_now = 85*(eRef/1000)*d.grains_refined; const _gr_max = 85*(eRef/1000)*STD.grains_refined.max;
    rows.push({ key:'grains_refined', label:STD.grains_refined.label, tip:STD.grains_refined.tip,
      value:`≈ ${fmt(_gr_now,0)} г рафинированных злаков`, norm:`желательно ≤ ${fmt(_gr_max,0)} г`,
      delta: (m1.toNext>1||m1.toMax>1)?`${m1.sign}${fmt(m1.toNext,0)} ${m1.unit} до +1 балла; ${m1.sign}${fmt(m1.toMax,0)} ${m1.unit} до максимума. Практически: меньше белого хлеба, сдобы, белого риса/пасты.`:'Ориентир HEI достигнут.',
      pts:fmt(P.grains_refined,1) });

    const m2 = gramsToNextAndMax('sodium_g', model);
    const _na_now = d.sodium_g * eRef / 1000; const _na_max = STD.sodium_g.max * eRef / 1000;
    rows.push({ key:'sodium_g', label:STD.sodium_g.label, tip:STD.sodium_g.tip,
      value:`≈ ${fmt(_na_now,1)} г натрия`, norm:`желательно ≤ ${fmt(_na_max,1)} г натрия`,
      delta: (m2.toNext>1||m2.toMax>1)?`${m2.sign}${fmt(m2.toNext,0)} ${m2.unit} натрия до +1 балла; ${m2.sign}${fmt(m2.toMax,0)} ${m2.unit} до максимума. Практически: меньше соли, солёных соусов, сыров и полуфабрикатов.`:'Ориентир HEI достигнут.',
      pts:fmt(P.sodium_g,1) });

    const m3 = gramsToNextAndMax('added_sugars_pct', model);
    const _sug_energy = Math.max(1, model.intake.energy_kcal||eRef); const _sug_now = d.added_sugars_pct * _sug_energy / 100 / 4; const _sug_max = STD.added_sugars_pct.max * _sug_energy / 100 / 4;
    rows.push({ key:'added_sugars_pct', label:STD.added_sugars_pct.label, tip:STD.added_sugars_pct.tip,
      value:`≈ ${fmt(_sug_now,0)} г добавленного сахара`, norm:`желательно ≤ ${fmt(_sug_max,0)} г`,
      delta: (m3.toNext>0.5||m3.toMax>0.5)?`${m3.sign}${fmt(m3.toNext,0)} ${m3.unit} до +1 балла; ${m3.sign}${fmt(m3.toMax,0)} ${m3.unit} до максимума. Практически: меньше сладких напитков, сиропов и десертов.`:'Ориентир HEI достигнут.',
      pts:fmt(P.added_sugars_pct,1) });

    const m4 = gramsToNextAndMax('sat_fats_pct', model);
    const _sfa_energy = Math.max(1, model.intake.energy_kcal||eRef); const _sfa_now = d.sat_fats_pct * _sfa_energy / 100 / 9; const _sfa_max = STD.sat_fats_pct.max * _sfa_energy / 100 / 9;
    rows.push({ key:'sat_fats_pct', label:STD.sat_fats_pct.label, tip:STD.sat_fats_pct.tip,
      value:`≈ ${fmt(_sfa_now,0)} г насыщенных жиров`, norm:`желательно ≤ ${fmt(_sfa_max,0)} г`,
      delta: (m4.toNext>0.5||m4.toMax>0.5)?`${m4.sign}${fmt(m4.toNext,0)} ${m4.unit} до +1 балла; ${m4.sign}${fmt(m4.toMax,0)} ${m4.unit} до максимума. Практически: меньше жирных сыров, сливочного масла и жирного мяса; чаще рыба, орехи, растительные масла.`:'Ориентир HEI достигнут.',
      pts:fmt(P.sat_fats_pct,1) });

    return rows;
  }

  // ==== Топ‑рычаги (минимум граммов на +1 балл) ====
  function computeLevers(model){
    const keys = ['vegetables_total','greens_beans','fruits_total','fruits_whole','grains_whole','dairy','protein_total','seafood_plant',
      'grains_refined','sodium_g','added_sugars_pct','sat_fats_pct'];
    const list = [];
    for (const k of keys){
      const {toNext, unit, sign} = gramsToNextAndMax(k, model);
      const maxPts = STD[k].pts||10;
      const cur = parseFloat(model.points[k])||0;
      if (toNext>1 && cur < maxPts-1e-6){
        list.push({key:k, grams:toNext, unit, sign, label:STD[k].label});
      }
    }
    // Нормализуем: для натрия переводим мг в г для сортировки (но оставим отображение в мг)
    const gramsForSort = (x)=> (x.unit==='мг' ? x.grams/1000 : x.grams);
    list.sort((a,b)=> gramsForSort(a) - gramsForSort(b));
    return list.slice(0,4);
  }

  // ==== Рекомендации ====
  const RECS = {
    vegetables_total: {
      severe:g => `Недостаточно овощей. Добавьте ≈ ${fmt(g,0)} г/сутки (листовые салаты, брокколи, огурцы).`,
      mild:  g => `Чуть не хватает овощей: +${fmt(g,0)} г; добавьте салат к обеду и ужину.`,
      ok:    () => `Овощи — в норме.`
    },
    greens_beans: {
      severe:g => `Добавьте зелень и бобовые ≈ ${fmt(g,0)} г: шпинат, фасоль/нут/чечевица.`,
      mild:  g => `Нарастите зелень/бобовые на +${fmt(g,0)} г.`,
      ok:    () => `Зелень и бобовые — ок.`
    },
    fruits_total: {
      severe:g => `Добавьте фрукты ≈ ${fmt(g,0)} г: яблоки, ягоды, цитрусовые.`,
      mild:  g => `Немного увеличьте фрукты: +${fmt(g,0)} г.`,
      ok:    () => `Фрукты — в норме.`
    },
    fruits_whole: {
      severe:g => `Увеличьте цельные фрукты ≈ ${fmt(g,0)} г (не соки).`,
      mild:  g => `Добавьте цельных фруктов на +${fmt(g,0)} г.`,
      ok:    () => `Цельные фрукты — ок.`
    },
    grains_whole: {
      severe:g => `Не хватает цельных зёрен: +${fmt(g,0)} г (гречка, овсянка, бурый рис).`,
      mild:  g => `Добавьте цельных зёрен на +${fmt(g,0)} г.`,
      ok:    () => `Цельные зёрна — в норме.`
    },
    dairy: {
      severe:() => `Молочная группа низко. Следующий практический шаг: 1 молочная порция — 200–250 мл молока, кефира или несладкого йогурта; лучше использовать её как замену менее ценным продуктам.`,
      mild:  () => `Можно немного усилить молочную группу: 1 порция молока/кефира/йогурта или подходящая обогащённая альтернатива.`,
      ok:    () => `Молочные — ок.`
    },
    protein_total: {
      severe:g => `Добавьте белковых ≈ ${fmt(g,0)} г (птица/рыба/яйца/бобовые/тофу/орехи).`,
      mild:  g => `Нарастите белок: +${fmt(g,0)} г.`,
      ok:    () => `Белковая группа — ок.`
    },
    seafood_plant: {
      severe:g => `Увеличьте рыбу и растительный белок ≈ ${fmt(g,0)} г: рыба 2–3р/нед, бобовые/тофу/орехи.`,
      mild:  g => `Добавьте рыбу/растительный белок: +${fmt(g,0)} г.`,
      ok:    () => `Рыба и растительный белок — ок.`
    },
    grains_refined: {
      severe:g => `Снизьте рафинированные зёрна на −${fmt(g,0)} г: меньше белого хлеба/сдобы/белого риса.`,
      mild:  g => `Чуть сократите рафинированные зёрна: −${fmt(g,0)} г.`,
      ok:    () => `Рафинированные зёрна — в норме.`
    },
    sodium_g: {
      severe:g => `Натрий высок: −${fmt(g,0)} мг. Меньше солёного/соусов, больше специй вместо соли.`,
      mild:  g => `Сократите натрий на −${fmt(g,0)} мг.`,
      ok:    () => `Натрий — ок.`
    },
    added_sugars_pct: {
      severe:g => `Снизьте добавленный сахар ~−${fmt(g,0)} г/сутки: меньше сладких напитков и выпечки.`,
      mild:  g => `Чуть уменьшите сахар: −${fmt(g,0)} г.`,
      ok:    () => `Добавленный сахар — в норме.`
    },
    sat_fats_pct: {
      severe:g => `Снизьте насыщённые жиры ~−${fmt(g,0)} г/сутки: меньше жирных сыров/масла, чаще рыба/орехи/масла.`,
      mild:  g => `Немного уменьшите насыщённые жиры: −${fmt(g,0)} г.`,
      ok:    () => `Насыщённые жиры — ок.`
    },
    fatty_acids_ratio: {
      severe:() => `Улучшите баланс жиров: больше ненасыщённых (рыба, орехи, масла), меньше насыщённых.`,
      mild:  () => `Чуть улучшите соотношение жиров в пользу ненасыщённых.`,
      ok:    () => `Баланс ненасыщенных/насыщённых — хороший.`
    }
  };
  function buildRecommendations(model){
    const rows=buildRows(model); const parts=[];
    for (const r of rows){
      const maxPts = STD[r.key]?.pts || 10;
      const pts = parseFloat(r.pts)||0;
      let sev='ok';
      if (pts<=0.01) sev='severe'; else if (pts < maxPts*0.6) sev='mild';

      let grams=0;
      try {
        const gm = gramsToNextAndMax(r.key, model);
        grams = gm && isFinite(gm.toNext) ? gm.toNext : 0;
      } catch(_) { grams = 0; }
      const rec=RECS[r.key]?.[sev];
      const praise = (sev==='ok' && PRAISE[r.key]) ? `<div class="micro">💡 ${PRAISE[r.key]}</div>` : '';

      // Микро‑плейбуки
      const pb = PLAYBOOKS[r.key]||{};
      const plays = [];
      const MEAL_RU={breakfast:'завтрак',lunch:'обед',dinner:'ужин',evening:'вечером',snack:'перекус'};
      if (Array.isArray(pb.actions)){
        const items = pb.actions.map(a => {
          if (a.type==='add') return `<li>➕ ${a.label} <span class=\"micro\">${[a.portion||'', (a.meal?(MEAL_RU[a.meal]||a.meal):'')].filter(Boolean).join(', ')}</span></li>`;
          if (a.type==='reduce') return `<li><span class=\"micro\">что можно сократить в этой категории:</span> ${a.label}</li>`;
          if (a.type==='reduceNa') return `<li><span class=\"micro\">что можно сократить в этой категории:</span> ${a.label} <span class=\"micro\">−${a.mg} мг натрия</span></li>`;
          return '';
        }).join('');
        if (items) plays.push(`<ul class="play">${items}</ul>`);
      }
      if (Array.isArray(pb.swaps)){
        const items = pb.swaps.map(s => `<li><span class="micro">здоровая замена продуктов:</span> ${s.from.label} → ${s.to.label}</li>`).join('');
        if (items) plays.push(`<ul class="play">${items}</ul>`);
      }

      const txt = typeof rec==='function' ? rec(grams) : (rec||'');
      parts.push({ key:r.key, sev, html: `${txt}${praise}${plays.join('')}` });
    }
    return parts;
  }

  function rowClassByPts(key, pts){
    const p=parseFloat(pts)||0; const max=STD[key]?.pts||10;
    const ratio = max>0 ? p/max : 0;
    if (ratio>=0.95) return 'ok';
    if (ratio<0.4) return 'bad';
    return 'warn';
  }

  function humanLeverText(l){
    const key = l && l.key;
    if (key === 'dairy') return `1 молочная порция (200–250 мл) — <span class="micro">${STD[key].label}</span>`;
    if (key === 'grains_whole') return `80–100 г готовой крупы/каши — <span class="micro">${STD[key].label}</span>`;
    if (key === 'fruits_total' || key === 'fruits_whole') return `≈150 г фруктов — <span class="micro">${STD[key].label}</span>`;
    if (key === 'vegetables_total') return `≈130–150 г овощей — <span class="micro">${STD[key].label}</span>`;
    if (key === 'greens_beans') return `зелень/бобовые к приёму пищи — <span class="micro">${STD[key].label}</span>`;
    if (key === 'protein_total') return `порция белкового блюда — <span class="micro">${STD[key].label}</span>`;
    if (key === 'seafood_plant') return `рыба/бобовые/тофу/орехи — <span class="micro">${STD[key].label}</span>`;
    return `${l.sign}${fmt(l.grams, l.unit==='мг'?0:0)} ${l.unit} — <span class="micro">${STD[key].label}</span>`;
  }
  function renderLevers(model, root){
    const box = root && root.querySelector ? root.querySelector('#heiLevers') : null;
    if (!box || window.HEIRecommendationPass1) return;
    const levers = computeLevers(model);
    if (!levers.length){ box.innerHTML=''; return; }
    box.innerHTML = `<div class="lever"><b>Топ‑рычаги улучшения (ближайший практический шаг):</b><br>
      ${levers.map(humanLeverText).join(' · ')}
    </div>`;
  }

  function heiCoreRenderSignature(model, rows){
    try{
      const intake=model&&model.intake||{};
      const density=model&&model.density||{};
      return JSON.stringify({
        valid:!(model&&model.valid===false),
        total:Number(model&&model.total||0).toFixed(4),
        energyRef:Number(model&&model.energyRefKcal||0).toFixed(3),
        energy:Number(intake.energy_kcal||0).toFixed(3),
        density:Object.keys(density).sort().map(k=>[k,Number(density[k]||0).toFixed(6)]),
        rows:(rows||[]).map(r=>[r.key,String(r.value),String(r.norm),String(r.delta),String(r.pts)])
      });
    }catch(_){return '';}
  }
  function render(model, root){
    const rows=buildRows(model);
    const tbody=root && root.querySelector ? root.querySelector('#heiTableBody') : null;
    const totalCell=root && root.querySelector ? root.querySelector('#heiTotalCell') : null;
    const summary=root && root.querySelector ? root.querySelector('#heiSummary') : null;
    const recsWrap=root && root.querySelector ? root.querySelector('#heiRecs') : null;
    const coreSignature=heiCoreRenderSignature(model,rows);
    if(coreSignature&&coreSignature===window.__lastHEICoreRenderSignature&&window.__lastHEICoreRenderRoot===root&&tbody&&tbody.childElementCount){
      window.__lastHEIModel=model;
      window.__lastHEIRows=rows;
      window.__lastHEIRenderedAt=Date.now();
      window.__HEI_CORE_RENDER_STATS__=window.__HEI_CORE_RENDER_STATS__||{domWrites:0,skips:0};
      window.__HEI_CORE_RENDER_STATS__.skips+=1;
      return;
    }
    window.__lastHEICoreRenderSignature=coreSignature;
    window.__lastHEICoreRenderRoot=root;
    window.__HEI_CORE_RENDER_STATS__=window.__HEI_CORE_RENDER_STATS__||{domWrites:0,skips:0};
    window.__HEI_CORE_RENDER_STATS__.domWrites+=1;

    if (tbody) tbody.innerHTML = rows.map(r=>`
      <tr class="${rowClassByPts(r.key,r.pts)}" data-hei-key="${r.key}" data-hei-score="${parseFloat(r.pts)||0}" data-hei-max="${STD[r.key]?.pts||10}" title="${(STD[r.key]?.tip||'').replace(/"/g,'&quot;')}">
        <td>${STD[r.key]?.label||r.key}</td>
        <td>${r.value}</td>
        <td>${r.norm}</td>
        <td>${r.delta}
          ${whatIfControls(r.key)}
        </td>
        <td>${r.pts}</td>
      </tr>
    `).join('');

    if (model.valid === false) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="muted">Добавьте продукты в рацион, чтобы рассчитать HEI.</td></tr>';
      if (totalCell) totalCell.textContent = '—';
      if (summary) { summary.className = 'alert neutral'; summary.innerHTML = 'HEI не рассчитывается для пустого рациона. Добавьте хотя бы один продукт с ненулевой массой.'; }
      const leversBox = root && root.querySelector ? root.querySelector('#heiLevers') : null;
      if (leversBox) leversBox.innerHTML = '';
      if (recsWrap) recsWrap.innerHTML = '';
      try { window.__lastHEIModel = model; window.__lastHEIRows = []; window.__lastHEIRenderedAt = Date.now(); window.dispatchEvent(new CustomEvent('hei:rendered', { detail: { model, rows:[] } })); } catch(_) {}
      return;
    }

    if (totalCell) totalCell.textContent = fmt(model.total,1);
    if (summary) {
      const grade = model.grade || (window.HEI2020CoreV2 ? window.HEI2020CoreV2.grade(model.total) : (model.total>=90?'A':model.total>=80?'B':model.total>=70?'C':model.total>=60?'D':'F'));
      const wording = grade==='A' ? 'Очень высокое соответствие структуре HEI.' : grade==='B' ? 'Высокое соответствие структуре HEI.' : grade==='C' ? 'Умеренное соответствие структуре HEI.' : grade==='D' ? 'Низкое соответствие структуре HEI.' : 'Выраженное несоответствие структуре HEI.';
      summary.className = 'alert ' + (grade==='D' || grade==='F' ? 'bad' : 'neutral');
      summary.innerHTML = `HEI‑2020: <b>${fmt(model.total,1)} / 100</b> — категория <b>${grade}</b>. ${wording}
      Расчёт основан на фактической энергии введённого рациона — <b>${fmt(model.intake.energy_kcal,0)} ккал</b>. Отдельные ограничения показаны ниже.`;
    }

    // Топ‑рычаги
    renderLevers(model, root);

    // Рекомендации
    const recs=buildRecommendations(model);
    (function(){
      // Build top priorities (non-ok first, by order of rows)
      const bad = recs.filter(r=>r.sev!=='ok');
      const top = bad.slice(0,3).map(r=>`<li><strong>${STD[r.key]?.label||r.key}</strong> — ${r.html}</li>`).join('');
      const list = recs.map(r=>`
        <div class="rec ${r.sev}">
          <div class="rec-head"><strong>${STD[r.key]?.label||r.key}</strong> <span class="tag ${r.sev}">${r.sev==='ok'?'ОК':r.sev==='mild'?'Нужно улучшить':'Приоритет'}</span></div>
          <div class="rec-body">${r.html}${r.key==='fatty_acids_ratio'?'<div class=\"hei-help fatty-accordion\" style=\"margin:8px 0 4px;\"><details><summary class=\"btn-link\" style=\"cursor:pointer; user-select:none;\">О соотношении жиров</summary><div class=\"help-body\" style=\"margin-top:8px; line-height:1.5;\"><p><strong>Что это за критерий?</strong></p><p>В HEI «соотношение жиров» — это показатель качества жиров в рационе: (мононенасыщенные + полиненасыщенные) / насыщенные жиры. Он важен, потому что показывает, насколько насыщённые жиры замещаются более полезными источниками (рыба, орехи и семена, оливковое/рапсовое масло), что связано с лучшими сердечно-сосудистыми исходами. Расчёт прямой: граммы МНЖК и ПНЖК складываются и делятся на граммы НЖК; чем результат выше, тем лучше.</p><p>По этому показателю вы получаете тем больше баллов, чем выше доля «хороших» жиров. Если отношение (МНЖК+ПНЖК)/НЖК 2,5 и выше — начисляется максимум баллов; если 1,2 и ниже — 0 баллов; если значение между 1,2 и 2,5, баллы считаются пропорционально: чем ближе к 2,5, тем больше (например, 1,85 — примерно середина и даст около 5 из 10).</p><p><strong>Как считается?</strong></p><p>Цифра «соотношение жиров» считается так: берём граммы мононенасыщенных (МНЖК) и полиненасыщенных (ПНЖК) жиров за сутки, складываем их и делим на граммы насыщенных жиров (НЖК) за те же сутки:<br/><code>R = (МНЖК + ПНЖК) / НЖК</code>.<br/>Напр., если МНЖК=35 г, ПНЖК=15 г, НЖК=20 г → R = (35+15)/20 = 2,5. Если НЖК=0, отношение математически бесконечное — в практике считаем, что это максимум (показываем «&gt; 10»/«∞» и начисляем максимум баллов). Этот показатель считается как отношение в граммах и используется без пересчёта на 1000 ккал.</p></div></details></div>':''}</div>
        </div>
      `).join('');
      if (recsWrap && !window.HEIRecommendationPass1) recsWrap.innerHTML = `
        ${bad.length?`<div class="rec-top"><div class="muted">Приоритеты:</div><ul>${top}</ul></div>`:''}
        <div class="rec-list">${list}</div>`;
    })();

    try {
      window.__lastHEIModel = model;
      window.__lastHEIRows = rows;
      window.__lastHEIRenderedAt = Date.now();
      window.dispatchEvent(new CustomEvent('hei:rendered', { detail: { model, rows } }));
    } catch(_) {}
  }

  // ==== What‑if кнопки ====
  function whatIfControls(key){ return ""; }

function simulateWhatIf(model, key, action){
    const d = {...model.density};
    const eRef = model.energyRefKcal;
    const intakeE = Math.max(1, model.intake.energy_kcal||eRef);

    if (action.type==='plus'){ // добавляем граммы к адекватности
      const g = action.grams;
      const unitG = UNIT_GRAMS[key]; if (!unitG) return null;
      const deltaUnit = g / unitG / (eRef/1000);
      d[key] = Math.max(0, d[key] + deltaUnit);
    } else if (action.type==='minus'){ // уменьшаем граммы у модераторов (в г)
      // grains_refined / added_sugars_pct / sat_fats_pct
      if (key==='grains_refined'){
        const deltaUnit = (action.grams) / 85 / (eRef/1000);
        d[key] = Math.max(0, d[key] - deltaUnit);
      } else if (key==='added_sugars_pct'){
        const deltaPct = (action.grams*4*100)/intakeE;
        d[key] = Math.max(0, d[key] - deltaPct);
      } else if (key==='sat_fats_pct'){
        const deltaPct = (action.grams*9*100)/intakeE;
        d[key] = Math.max(0, d[key] - deltaPct);
      }
    } else if (action.type==='minusMg' && key==='sodium_g'){
      const deltaUnit = (action.mg) / eRef; // см. gramsToNextAndMax
      d[key] = Math.max(0, d[key] - deltaUnit);
    } else {
      return null;
    }
    return scoreFromDensity(d, model.intake.energy_kcal, eRef);
  }

  // ==== Публичный API ====
  function mount({ db, container, getRation, getEnergyRef, onPrint }){
    const root = container || document.getElementById('heiPanel');
    const DB = db || window.DB;
    const badge = document.getElementById('heiBadge');
    const leversBox = root.querySelector('#heiLevers');
    const whatifHint = root.querySelector('#whatifHint');

    const recompute = () => {
      if (badge) badge.textContent = 'фактическая энергия рациона';
      const ration = (typeof getRation==='function') ? getRation() : [];
      const energyRef = (typeof getEnergyRef==='function') ? getEnergyRef() : 2000;

      if (!DB || !DB.byKey){
        const dummy = scoreFromDensity({
          fruits_total:0, fruits_whole:0, vegetables_total:0, greens_beans:0, grains_whole:0, dairy:0,
          protein_total:0, seafood_plant:0, grains_refined:0, sodium_g:0, added_sugars_pct:0, sat_fats_pct:0, fatty_acids_ratio:0
        }, 0, energyRef);
        render(dummy, root);
        return dummy;
      }
      const model = (window.HEIRuntimeV2 && typeof window.HEIRuntimeV2.calculate === 'function' && window.__HEI_V2_CONFIG__?.mode !== 'off')
        ? window.HEIRuntimeV2.calculate({ ration, db: DB, requestedEnergyRefKcal: energyRef })
        : score(computeIntake(ration, DB), energyRef);
      render(model, root);
      return model;
    };

    // Печать HEI подключается отдельным стабильным обработчиком ниже.
    const btn = root.querySelector('#heiPrintBtn');
    if (btn && typeof onPrint === 'function') btn.onclick = () => onPrint();

    // Слушатели быстрых действий и замен
    root.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-act]');
      if (btn){
        const act = btn.dataset.act;
        if (act==='add'){
          window.dispatchEvent(new CustomEvent('hei:quick-add',{detail:{tag:btn.dataset.tag, grams:+btn.dataset.grams}}));
        } else if (act==='reduce'){
          window.dispatchEvent(new CustomEvent('hei:quick-reduce',{detail:{tag:btn.dataset.tag, grams:+btn.dataset.grams}}));
        } else if (act==='reduceNa'){
          window.dispatchEvent(new CustomEvent('hei:reduce-sodium',{detail:{mg:+btn.dataset.mg}}));
        } else if (act==='swap'){
          window.dispatchEvent(new CustomEvent('hei:swap',{
            detail:{
              from:{tag:btn.dataset.fromTag, grams:+btn.dataset.fromGrams},
              to:{tag:btn.dataset.toTag, grams:+btn.dataset.toGrams}
            }
          }));
        }
      }

      const w = e.target.closest('[data-whatif]');
      if (w){
        const key = w.dataset.key;
        const modelNow = recompute();
        let sim=null;
        if (w.dataset.whatif==='plus'){
          sim = simulateWhatIf(modelNow, key, {type:'plus', grams:+w.dataset.grams});
        } else if (w.dataset.whatif==='minus'){
          sim = simulateWhatIf(modelNow, key, {type:'minus', grams:+w.dataset.grams});
        } else if (w.dataset.whatif==='minusMg'){
          sim = simulateWhatIf(modelNow, key, {type:'minusMg', mg:+w.dataset.mg});
        }
        if (sim){
          const delta = (sim.total - modelNow.total);
          whatifHint.style.display='block';
          whatifHint.innerHTML = `Предварительный сценарий по компоненту <b>${STD[key].label}</b>: ${w.textContent.trim()}. 
            Оценка HEI по плотности: <b>${fmt(sim.total,1)}</b> (${delta>=0?'+':''}${fmt(delta,1)}). Для точного результата изменение нужно применить к продуктам и полностью пересчитать рацион.`;
        }
      }
    });

    return { recompute };
  }

  function printPanel(root){
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(n => n.outerHTML)
      .join('\n');
    const panel = root ? root.cloneNode(true) : null;
    if (panel) {
      panel.querySelectorAll('script, dialog, button, input, select, textarea').forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const span = document.createElement('span');
          span.textContent = el.value || '';
          el.replaceWith(span);
        } else if (el.tagName === 'SELECT') {
          const span = document.createElement('span');
          span.textContent = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].textContent : '';
          el.replaceWith(span);
        } else if (el.tagName === 'BUTTON' || el.tagName === 'DIALOG' || el.tagName === 'SCRIPT') {
          el.remove();
        }
      });
    }
    const html = '<!doctype html>' +
      '<html lang="ru"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>HEI‑2020</title>' + styles +
      '<style>@page{margin:14mm} body{padding:10px;background:#fff;} .card{box-shadow:none!important;} button{display:none!important;}</style>' +
      '</head><body>' + (panel ? panel.outerHTML : '') + '</body></html>';
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return { version:'v5.3.210-rc2-hf3-hei', mount, computeIntake, score, scoreFromDensity, helpers: { STD, HEI_MAP } };
})();

;

