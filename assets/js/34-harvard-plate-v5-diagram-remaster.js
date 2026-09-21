// Harvard Plate v5.2.23 classification/events hardening
// Diagram-first interactive plate: fixed target sectors, live fill, outside labels, report-safe semantics.
(function(){
  'use strict';

  var VERSION = 'v5.3.37_diet_profile_clarity_ui_base';
  var ASSET_ROOT = './assets/images/harvard-plate/v5/';
  var SECTOR_IDS = ['vegetables', 'fruits', 'wholeGrains', 'protein'];
  var DIAGRAM_GEOMETRY = {
    wholeGrains:{ start:-90, sweep:90, labelX:700, labelY:188, anchor:'start' },
    protein:{ start:0, sweep:90, labelX:700, labelY:488, anchor:'start' },
    fruits:{ start:90, sweep:54, labelX:80, labelY:512, anchor:'start' },
    vegetables:{ start:144, sweep:126, labelX:80, labelY:188, anchor:'start' }
  };
  var DIAGRAM_ORDER = ['wholeGrains','protein','fruits','vegetables'];
  var activeSector = null;
  var userSelectedSector = false;
  var renderScheduled = false;

  var SAMPLE = [
    { key:'spinach_raw', grams:120 },
    { key:'cucumber_raw', grams:140 },
    { key:'tomato_raw', grams:120 },
    { key:'apple', grams:120 },
    { key:'buckwheat_cooked', grams:170 },
    { key:'oatmeal_cooked', grams:120 },
    { key:'chicken_breast_cooked', grams:140 },
    { key:'lentils_cooked', grams:80 },
    { key:'olive_oil_evoo_other', grams:15 },
    { key:'tea_black_brewed_other', grams:350 },
    { key:'water_plain', grams:1250 }
  ];
  var FALLBACK_SAMPLE_NAMES = [
    ['шпинат', 120], ['огур', 140], ['помидор', 120], ['яблок', 120],
    ['греч', 170], ['овсян', 120], ['куриная груд', 140], ['чечевиц', 80],
    ['масло оливков', 15], ['чай ч', 350], ['вода', 1250]
  ];

  function $(id){ return document.getElementById(id); }
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
      name: p.name_ru || p.name || p.key
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

  function strongestDeviationSector(stage){
    var best = null;
    SECTOR_IDS.forEach(function(id){
      var s = stage && stage.sectors && stage.sectors[id];
      if (!s) return;
      var d = Math.abs((s.fillRatio || 0) - 1);
      if (!best || d > best.deviation) best = { id:id, deviation:d };
    });
    return best ? best.id : 'vegetables';
  }

  function getModel(){
    var ration = getRation();
    var empty = !ration.length;
    var ready = !!(window.DB && window.DB.byKey && window.HarvardPlateV5StageEngine && window.HarvardPlateV5Masks);
    if (!ready) return { ready:false, empty:empty, message:'База продуктов или модуль визуализации ещё загружаются.' };
    var built = buildV5Input(ration);
    var stage = window.HarvardPlateV5StageEngine.deriveModel(built.input, { proteinCountingMode:'harvard-strict' });
    var coreMass = stage.coreMass || 0;
    var fit = SECTOR_IDS.map(function(id){ var s = stage.sectors[id]; return clamp(1 - Math.abs((s.fillRatio || 0) - 1), 0, 1); });
    var warnCount = (stage.qualityFlags || []).filter(function(f){ return f.severity === 'warn'; }).length;
    var score = Math.max(0, Math.round((fit.reduce(function(a,b){ return a + b; }, 0) / fit.length) * 100 - warnCount * 4));
    var weakest = strongestDeviationSector(stage);
    if (!activeSector || !stage.sectors[activeSector] || (!userSelectedSector && activeSector !== weakest)) activeSector = weakest;
    return { ready:true, empty:empty, ration:ration, built:built, stage:stage, coreMass:coreMass, score:score, weakest:weakest, activeSector:activeSector, fluidTargetMl:readFluidTarget() };
  }

  function itemsFor(model, sectorId){
    return (model.built.details || []).filter(function(x){ return x.group === sectorId; });
  }
  function otherItems(model){
    return (model.built.details || []).filter(function(x){ return !x.group; });
  }
  function sumItems(items){
    return (items || []).reduce(function(a,it){ return a + Math.max(0, num(it && it.grams)); }, 0);
  }
  function totalRationMass(model){
    return sumItems(model && model.built ? model.built.details : []);
  }
  function outsideMainMass(model){
    return sumItems(otherItems(model));
  }
  function uniqueItems(items){
    var seen = {};
    return (items || []).filter(function(it){
      var k = (it && it.key ? it.key : '') + '|' + (it && it.name ? it.name : '') + '|' + String(it && it.grams);
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }
  function itemUnit(it){
    if (!it || !Array.isArray(it.roles)) return 'г';
    return (it.roles.indexOf('waterPlain') >= 0 || it.roles.indexOf('unsweetenedBeverage') >= 0 || it.roles.indexOf('dairyDrink') >= 0 || it.roles.indexOf('juice') >= 0 || it.roles.indexOf('sweetDrink') >= 0) ? 'мл' : 'г';
  }
  function itemAmount(it){ return fmt(it && it.grams,0)+' '+itemUnit(it); }

  function itemListHtml(items, emptyText){
    if (!items.length) return '<p class="hp-mini-empty">'+esc(emptyText || 'Пока нет продуктов.')+'</p>';
    return '<ul class="hp-items-list">' + items.slice(0, 8).map(function(it){ return '<li><span>'+esc(it.name)+'</span><strong>'+esc(itemAmount(it))+'</strong></li>'; }).join('') + (items.length > 8 ? '<li><span>Ещё продуктов</span><strong>'+esc(String(items.length - 8))+'</strong></li>' : '') + '</ul>';
  }

  function itemListWithReasonHtml(items, emptyText){
    if (!items.length) return '<p class="hp-mini-empty">'+esc(emptyText || 'Пока нет продуктов.')+'</p>';
    return '<ul class="hp-items-list hp-items-list-reason">' + items.slice(0, 10).map(function(it){
      var reason = it.reason ? '<small>'+esc(it.reason)+'</small>' : '';
      return '<li><span>'+esc(it.name)+reason+'</span><strong>'+esc(itemAmount(it))+'</strong></li>';
    }).join('') + (items.length > 10 ? '<li><span>Ещё продуктов</span><strong>'+esc(String(items.length - 10))+'</strong></li>' : '') + '</ul>';
  }

  function outsideItemsWithoutRoles(model, roleList){
    return otherItems(model).filter(function(it){
      return !(roleList || []).some(function(role){ return hasRole(it, role); });
    });
  }
  function outsideGroupRows(model){
    var usedRoles = ['dairy','dairyDrink','healthyFatSource','waterPlain','unsweetenedBeverage','juice','sweetDrink','refinedGrain','processedMeat','proteinSupplement','harvardPotato','fattySauce'];
    var rows = [
      {
        id:'dairy',
        title:'Молочные продукты',
        note:'учтены отдельно; не заполняют белковую четверть основной Гарвардской тарелки',
        items: uniqueItems(itemsWithRole(model,'dairy').concat(itemsWithRole(model,'dairyDrink')))
      },
      {
        id:'healthy-fats',
        title:'Источники полезных жиров',
        note:'важны для качества рациона, но не являются отдельным сектором основной тарелки',
        items: uniqueItems(itemsWithRole(model,'healthyFatSource'))
      },
      {
        id:'water',
        title:'Вода и несладкие напитки',
        note:'учитываются отдельным индикатором жидкости',
        items: uniqueItems(itemsWithRole(model,'waterPlain').concat(itemsWithRole(model,'unsweetenedBeverage')))
      },
      {
        id:'refined-grains',
        title:'Рафинированные злаки',
        note:'показаны отдельно и не заполняют сектор цельных злаков',
        items: uniqueItems(itemsWithRole(model,'refinedGrain'))
      },
      {
        id:'sweets-drinks',
        title:'Соки, сладкие напитки и сладкие продукты',
        note:'не заполняют сектора фруктов, овощей или воды',
        items: uniqueItems(itemsWithRole(model,'juice').concat(itemsWithRole(model,'sweetDrink')))
      },
      {
        id:'limited-protein',
        title:'Белковые продукты вне основного сектора',
        note:'обработанное мясо, протеиновые добавки и спорные источники показаны отдельно',
        items: uniqueItems(itemsWithRole(model,'processedMeat').concat(itemsWithRole(model,'proteinSupplement')))
      },
      {
        id:'sauces-extras',
        title:'Соусы, приправы и жирные закуски',
        note:'учтены в энергии, соли, сахаре и жирах, но не заполняют четыре сектора основной тарелки',
        items: uniqueItems(itemsWithRole(model,'fattySauce'))
      },
      {
        id:'other',
        title:'Прочее вне основной тарелки',
        note:'продукты, которые не входят в четыре основных сектора',
        items: uniqueItems(outsideItemsWithoutRoles(model, usedRoles))
      }
    ];
    return rows.filter(function(row){ return row.items && row.items.length; });
  }
  function outsideImpactText(id){
    return ({
      dairy:'Влияет на HEI-компонент молочной группы, кальций/белок и общую пищевую ценность, но не увеличивает белковый сектор основной тарелки.',
      'healthy-fats':'Влияет на качество жиров и соотношение ненасыщенных/насыщенных жиров; отдельный сектор основной тарелки не заполняет.',
      water:'Влияет на водный ориентир и анализ напитков; сладкие напитки учитываются отдельно от водного ориентира.',
      'refined-grains':'Влияет на качество злаковой части и HEI-компонент рафинированных злаков; сектор цельных злаков не заполняет.',
      potatoes:'Картофель вынесен отдельно и не засчитывается как овощная часть строгой модели.',
      'sweets-drinks':'Может ухудшать картину по добавленному сахару, энергии и напиткам; не заполняет фрукты, овощи или воду.',
      'limited-protein':'Белок есть, но источник спорный для качества рациона; для сектора лучше рыба, птица, бобовые, яйца или тофу.',
      'sauces-extras':'Влияет на энергию, натрий, добавленный сахар и качество жиров; количество оценивается отдельно от основной тарелки.',
      other:'Продукт учитывается в энергии и нутриентах, но не относится к четырём секторам основной тарелки.'
    })[id] || 'Учитывается в рационе, но не изменяет площадь основного круга.';
  }

  function outsideGroupsHtml(model){
    if (!model || !model.ready || model.empty) return '';
    var rows = outsideGroupRows(model);
    if (!rows.length) return '';
    var total = rows.reduce(function(a,row){ return a + sumItems(row.items); }, 0);
    var cards = rows.map(function(row){
      var amount = sumItems(row.items);
      return '<article class="hp-outside-card hp-outside-card-compact" data-outside-group="'+esc(row.id)+'">' +
        '<div class="hp-outside-card-head"><strong>'+esc(row.title)+'</strong><b>'+fmt(amount,0)+' г</b></div>' +
        '<p><strong>Почему отдельно:</strong> '+esc(row.note)+'</p>' +
        '<div class="hp-outside-impact"><strong>На что влияет:</strong><span>'+esc(outsideImpactText(row.id))+'</span></div>' +
        '<details class="hp-outside-products"><summary>Показать продукты ('+esc(String(row.items.length))+')</summary>' + itemListWithReasonHtml(row.items, '') + '</details>' +
      '</article>';
    }).join('');
    return '<section class="hp-outside-summary hp-outside-summary-compact" aria-label="Группы вне основной Гарвардской тарелки">' +
      '<div class="hp-outside-summary-head"><div><span>Учтено отдельно</span><h3>Вне основной тарелки</h3></div><b>'+fmt(total,0)+' г</b></div>' +
      '<p>Это штатная логика классификации: продукты остаются в рационе, могут влиять на HEI, калории и нутриенты, а четыре сектора круга отражают только основную тарелку.</p>' +
      '<div class="hp-outside-rules"><span>не заполняет круг</span><span>видно по группам</span><span>может влиять на HEI</span></div>' +
      '<div class="hp-outside-grid">'+cards+'</div>' +
    '</section>';
  }
  function hasRole(item, role){ return item && Array.isArray(item.roles) && item.roles.indexOf(role) >= 0; }
  function itemsWithRole(model, role){ return (model.built.details || []).filter(function(it){ return hasRole(it, role); }); }
  function separateItemsForSector(model, sectorId){
    var details = model.built.details || [];
    if (sectorId === 'protein') return details.filter(function(it){ return !it.group && (hasRole(it,'dairy') || hasRole(it,'processedMeat')); });
    if (sectorId === 'wholeGrains') return details.filter(function(it){ return hasRole(it,'refinedGrain'); });
    if (sectorId === 'vegetables') return details.filter(function(it){ return hasRole(it,'fruits') && !hasRole(it,'vegetables'); });
    if (sectorId === 'fruits') return details.filter(function(it){ return hasRole(it,'vegetables') && !hasRole(it,'fruits'); });
    return [];
  }
  function separateLabelForSector(sectorId){
    return ({
      protein:'Учитывается отдельно от белковой четверти',
      wholeGrains:'Не заполняет сектор цельных злаков',
      vegetables:'Фруктовая часть считается отдельно',
      fruits:'Овощная часть считается отдельно'
    })[sectorId] || 'Учитывается отдельно';
  }
  function explainGroup(title, items, emptyText){
    return '<section class="hp-explain-group"><h4>'+esc(title)+'</h4>'+itemListWithReasonHtml(items, emptyText)+'</section>';
  }
  function explainHtml(model){
    if (!model.ready) return '<p class="hp-mini-empty">Модуль ещё загружается.</p>';
    if (model.empty) return '<p class="hp-mini-empty">Добавьте продукты, чтобы увидеть распределение по группам.</p>';
    var d = model.built.details || [];
    var separate = d.filter(function(it){ return !it.group && !hasRole(it,'waterPlain') && !hasRole(it,'unsweetenedBeverage') && !hasRole(it,'dairy') && !hasRole(it,'healthyFatSource') && !hasRole(it,'refinedGrain') && !hasRole(it,'juice') && !hasRole(it,'sweetDrink'); });
    return '<div class="hp-explain-grid">' +
      explainGroup('Овощи', itemsFor(model,'vegetables'), 'Овощи не добавлены.') +
      explainGroup('Фрукты', itemsFor(model,'fruits'), 'Фрукты не добавлены.') +
      explainGroup('Цельные злаки', itemsFor(model,'wholeGrains'), 'Цельные злаки не добавлены.') +
      explainGroup('Белковые продукты', itemsFor(model,'protein'), 'Белковые продукты не добавлены.') +
      explainGroup('Источники полезных жиров', itemsWithRole(model,'healthyFatSource'), 'Источники полезных жиров не добавлены.') +
      explainGroup('Вода и несладкие напитки', itemsWithRole(model,'waterPlain').concat(itemsWithRole(model,'unsweetenedBeverage')), 'Вода и несладкие напитки не добавлены.') +
      explainGroup('Молочные продукты', itemsWithRole(model,'dairy'), 'Молочные продукты не добавлены.') +
      explainGroup('Соки и сладкие напитки', itemsWithRole(model,'juice').concat(itemsWithRole(model,'sweetDrink')), 'Соки и сладкие напитки не добавлены.') +
      explainGroup('Рафинированные злаки', itemsWithRole(model,'refinedGrain'), 'Рафинированные злаки не добавлены.') +
      explainGroup('Прочее', separate, 'Нет нераспределённых продуктов.') +
    '</div>';
  }

  function adviceSentence(sector){
    var a = sector && sector.adjustment ? sector.adjustment : { type:'none', grams:0 };
    if (!sector || sector.state === 'empty') return 'Добавьте продукты, чтобы сектор появился в расчёте.';
    if (a.type === 'add') return 'Добавьте примерно '+fmt(a.grams,0)+' г: так доля сектора приблизится к ориентиру.';
    if (a.type === 'reduce') return 'Сократите примерно на '+fmt(a.grams,0)+' г или увеличьте группы, которые сейчас отстают.';
    return 'Доля близка к ориентиру.';
  }


  function missingSectorLabels(model){
    if (!model || !model.stage || !model.stage.sectors) return [];
    return SECTOR_IDS.filter(function(id){
      var s = model.stage.sectors[id];
      return !s || s.state === 'empty' || s.state === 'low' || num(s.grams) <= 1;
    }).map(function(id){ return sectorTitle(id); });
  }
  function dominantSector(model){
    if (!model || !model.stage || !model.stage.sectors) return null;
    var best = null;
    SECTOR_IDS.forEach(function(id){
      var s = model.stage.sectors[id];
      if (!s) return;
      if (!best || num(s.actualPercent) > num(best.actualPercent)) best = { id:id, actualPercent:num(s.actualPercent), grams:num(s.grams) };
    });
    return best;
  }
  function plateDiagnosisText(model){
    if (!model || !model.ready) return 'Ждём загрузку данных.';
    if (model.empty) return 'Добавьте продукты, чтобы оценить структуру тарелки.';
    if (model.coreMass <= 0) return 'Основная тарелка пока пуста: продукты есть, но они относятся к группам вне основного круга.';
    var total = totalRationMass(model);
    var coreShare = total > 0 ? model.coreMass / total : 0;
    var missing = missingSectorLabels(model);
    var dom = dominantSector(model);
    if (missing.length >= 2) return 'Структура основной тарелки заметно неполная: не хватает '+missing.slice(0,3).join(', ').toLowerCase()+'.';
    if (dom && dom.actualPercent >= 70) return 'Основная тарелка перекошена: большую часть занимает сектор «'+sectorTitle(dom.id)+'».';
    if (coreShare < 0.5) return 'Большая часть рациона учтена вне основной тарелки, поэтому основной круг показывает только часть питания.';
    if (model.score >= 80) return 'Структура основной тарелки близка к ориентиру.';
    return 'Структура основной тарелки требует небольшой коррекции.';
  }
  function heiSummaryForBridge(){
    var hei = window.__lastHEIModel || null;
    var total = hei && Number.isFinite(Number(hei.total)) ? Number(hei.total) : null;
    var tone = total == null ? 'unknown' : total >= 80 ? 'good' : total >= 60 ? 'mid' : 'low';
    var text = total == null ? 'HEI ещё не рассчитан' : 'HEI '+fmt(total,1)+'/100';
    return { total:total, tone:tone, text:text };
  }
  function structureTone(score){
    score = Number(score);
    if (!Number.isFinite(score)) return 'unknown';
    if (score >= 80) return 'good';
    if (score >= 60) return 'mid';
    return 'low';
  }
  function firstActionText(model){
    var items = firstActionItems(model);
    if (items && items.length) return items[0].text;
    if (model && model.score >= 80) return 'Критичных структурных действий нет: можно смотреть качество продуктов через HEI.';
    return 'Проверьте самый слабый сектор и продукты, которые учтены отдельно.';
  }
  function topSummaryHtml(model){
    if (!model || !model.ready || model.empty) return '';
    var total = totalRationMass(model);
    var outside = outsideMainMass(model);
    var missing = missingSectorLabels(model);
    var dom = dominantSector(model);
    var hei = heiSummaryForBridge();
    var structure = Number(model.score) || 0;
    var chips = [];
    chips.push('<span data-tone="'+esc(hei.tone)+'"><b>'+esc(hei.text)+'</b><small>качество рациона</small></span>');
    chips.push('<span data-tone="'+esc(structureTone(structure))+'"><b>'+fmt(structure,0)+'%</b><small>структура тарелки</small></span>');
    chips.push('<span><b>'+fmt(model.coreMass,0)+' г</b><small>в основной тарелке</small></span>');
    chips.push('<span><b>'+fmt(outside,0)+' г</b><small>учтено отдельно</small></span>');
    var mismatch = '';
    if (hei.total != null) {
      if (hei.total >= 70 && structure < 60) mismatch = 'HEI может быть приемлемым, но структура тарелки всё равно перекошена: проверьте доли основных секторов.';
      else if (hei.total < 60 && structure >= 70) mismatch = 'Структура похожа на тарелку, но качество продуктов по HEI требует проверки.';
      else mismatch = 'HEI оценивает качество, а Гарвардская тарелка — структуру. Эти два вывода нужно читать вместе.';
    } else {
      mismatch = 'Когда HEI будет рассчитан, здесь появится связка качества рациона и структуры тарелки.';
    }
    var cause = plateDiagnosisText(model);
    if (missing.length) cause += ' Не хватает: '+missing.slice(0,4).join(', ').toLowerCase()+'.';
    else if (dom && model.coreMass > 0) cause += ' Самый крупный сектор: '+sectorTitle(dom.id).toLowerCase()+' — '+fmt(dom.actualPercent,0)+'%.';
    return '<section class="hp-diagnostic-hub" aria-label="Главный вывод Гарвардской тарелки">' +
      '<div class="hp-diagnostic-head"><span>Главный вывод</span><strong>'+esc(cause)+'</strong></div>' +
      '<div class="hp-diagnostic-chips">'+chips.join('')+'</div>' +
      '<div class="hp-diagnostic-bridge"><strong>Как читать вместе с HEI:</strong><span>'+esc(mismatch)+'</span></div>' +
      '<div class="hp-diagnostic-action"><strong>Первый шаг:</strong><span>'+esc(firstActionText(model))+'</span></div>' +
    '</section>';
  }

  function interactionGuideHtml(model){
    if (!model || !model.ready || model.empty || model.coreMass <= 0) return '';
    var id = model.activeSector || model.weakest || 'vegetables';
    var s = model.stage && model.stage.sectors ? model.stage.sectors[id] : null;
    var label = sectorTitle(id);
    var status = s ? shortStateLabel(s.state) : 'нет данных';
    var clickText = userSelectedSector ? 'Клик обработан: выбран сектор «'+label+'», и разбор выше обновлён.' : 'Сейчас автоматически открыт самый слабый сектор. Нажмите сектор на диаграмме или карточку, чтобы сменить разбор выше.';
    return '<section class="hp-click-feedback" id="harvardPlateInteractionGuide" aria-live="polite">' +
      '<div><span>Интерактивность диаграммы</span><strong><i style="--hp-dot:'+esc(swatchColor(id))+'"></i>'+esc(clickText)+'</strong></div>' +
      '<b>'+esc(status)+' · '+esc(s ? fmt(s.grams,0)+' г · '+fmt(s.actualPercent,1)+'%' : '—')+'</b>' +
    '</section>';
  }

  function sectorExample(id){
    return ({
      vegetables:'овощи 150–250 г: салат, тушёные овощи, брокколи, огурцы/помидоры',
      fruits:'фрукт 120–180 г: яблоко, ягоды, груша, цитрус',
      wholeGrains:'цельные злаки 100–150 г готового продукта: гречка, овсянка, бурый рис',
      protein:'белковая часть 100–150 г: рыба, птица, яйца, бобовые, тофу'
    })[id] || 'подходящий продукт из выбранной группы';
  }
  function sectorWhatIfTemplate(id){
    return ({
      vegetables:'veg_mix',
      fruits:'fruit_fresh',
      wholeGrains:'buckwheat_cooked',
      protein:'fish'
    })[id] || '';
  }
  function sectorDefaultAddGrams(id){
    return ({ vegetables:180, fruits:140, wholeGrains:120, protein:120 })[id] || 120;
  }

  function sectorHeiImpact(id){
    return ({
      vegetables:'может улучшить компоненты HEI по овощам и зелени/бобовым, если это овощная группа',
      fruits:'может улучшить компонент HEI по фруктам; сок не даёт такой же логики насыщения',
      wholeGrains:'может улучшить компонент HEI по цельным злакам; рафинированные злаки идут отдельной строкой оценки',
      protein:'может улучшить общий белковый компонент, а рыба/бобовые/тофу — ещё и seafood/plant proteins'
    })[id] || 'влияние на HEI зависит от конкретного продукта';
  }
  function sectorKcalImpact(id, grams){
    grams = Number(grams) || 0;
    var per100 = ({ vegetables:35, fruits:55, wholeGrains:115, protein:150 })[id] || 100;
    var kcal = Math.round(per100 * grams / 100);
    if (!grams) return 'энергия зависит от выбранного продукта';
    return 'примерно +' + fmt(kcal,0) + ' ккал, уточняется конкретным продуктом';
  }
  function recommendationItems(model){
    if (!model || !model.stage || !model.stage.sectors) return [];
    var items = [];

    SECTOR_IDS.forEach(function(id){
      var s = model.stage.sectors[id];
      if (!s) return;
      var addGrams = 0;
      if (s.state === 'empty') addGrams = sectorDefaultAddGrams(id);
      else if (s.state === 'low' && s.adjustment && s.adjustment.type === 'add') addGrams = Number(s.adjustment.grams) || 0;
      if (!addGrams) return;
      items.push({
        tone:'need',
        sector:id,
        title:'Добавить ' + sectorTitle(id).toLowerCase(),
        text:s.state === 'empty' ? 'Сектор сейчас пуст или почти пуст.' : 'Сектор ниже ориентира для основной тарелки.',
        plate:'+' + fmt(addGrams,0) + ' г в сектор «' + sectorTitle(id) + '»; доля сектора станет ближе к цели ' + sectorTargetText(id) + '.',
        hei:sectorHeiImpact(id),
        kcal:sectorKcalImpact(id, addGrams),
        example:sectorExample(id),
        check:'Проверить вариант',
        action:'add',
        grams:addGrams,
        template:sectorWhatIfTemplate(id)
      });
    });

    var dom = dominantSector(model);
    if (dom && dom.actualPercent >= 70) {
      items.push({
        tone:'balance',
        sector:dom.id,
        title:'Снизить перекос сектора «' + sectorTitle(dom.id) + '»',
        text:'Сектор занимает слишком большую часть основной тарелки.',
        plate:'сначала добавить отстающие группы; цель — вернуть баланс четырёх частей.',
        hei:'HEI может не ухудшаться от самого факта перекоса, поэтому важно читать структуру отдельно от качества.',
        kcal:'сокращение может снизить энергию, если уменьшается калорийная группа',
        example:'уменьшить порцию доминирующего продукта или добавить недостающий сектор вместо него',
        check:'Проверить сокращение',
        action:'reduce',
        grams:Math.max(80, Math.min(250, Math.round((dom.grams || 120) * 0.25 / 10) * 10)),
        template:''
      });
    }

    var outside = outsideMainMass(model);
    if (outside > Math.max(model.coreMass * 0.75, 250)) {
      items.push({
        tone:'separate',
        sector:'outside',
        title:'Проверить продукты вне основной тарелки',
        text:'Значимая часть рациона находится за пределами четырёх секторов круга.',
        plate:'эти продукты не меняют площадь основной тарелки, но объясняют расхождение между массой рациона и кругом.',
        hei:'молочные продукты, жиры, сладкие напитки, рафинированные злаки и натрий могут заметно влиять на HEI.',
        kcal:'энергия уже учтена в рационе; важно понять, какие продукты находятся вне структуры круга',
        example:'молочные продукты, вода, масла, сладкие напитки, рафинированные злаки',
        check:'Смотреть блок ниже'
      });
    }

    if (!items.length && model.score >= 80) {
      items.push({
        tone:'ok',
        sector:model.activeSector || model.weakest || 'vegetables',
        title:'Критичных структурных действий нет',
        text:'Основная тарелка близка к ориентиру. Дальше важнее смотреть качество продуктов.',
        plate:'сохранять текущий баланс четырёх секторов.',
        hei:'проверьте слабые компоненты HEI: натрий, добавленный сахар, насыщенные жиры, цельные злаки.',
        kcal:'изменения не требуются без задачи по энергии или массе тела',
        example:'точечная замена продукта может быть полезнее, чем увеличение порций',
        check:'Смотреть HEI',
        action:'none',
        focus:'hei'
      });
    }

    return items.slice(0,3);
  }
  function firstActionItems(model){
    return recommendationItems(model).map(function(x){
      return { tone:x.tone, text:x.title + ': ' + x.text };
    });
  }
  function firstActionText(model){
    var items = recommendationItems(model);
    if (items && items.length) return items[0].title + '. ' + items[0].text;
    if (model && model.score >= 80) return 'Критичных структурных действий нет: можно смотреть качество продуктов через HEI.';
    return 'Проверьте самый слабый сектор и продукты, которые учтены отдельно.';
  }
  function recommendationCardHtml(rec, i){
    var btn = '';
    if (rec.sector === 'outside') {
      btn = '<button type="button" class="secondary hp-rec-check" data-hp-jump-outside="1">Смотреть отдельно учтённые продукты</button>';
    } else if (rec.focus === 'hei' || rec.action === 'none') {
      btn = '<button type="button" class="secondary hp-rec-check" data-hp-jump-hei="1">'+esc(rec.check || 'Смотреть HEI')+'</button>';
    } else {
      var actionAttr =
        ' data-hp-open-whatif="'+esc(rec.sector || '')+'"' +
        ' data-hp-rec-action="'+esc(rec.action || 'add')+'"' +
        ' data-hp-rec-grams="'+esc(String(Math.round(Number(rec.grams) || 0)))+'"' +
        ' data-hp-rec-template="'+esc(rec.template || '')+'"';
      btn = '<button type="button" class="secondary hp-rec-check"'+actionAttr+'>'+esc(rec.check || 'Проверить вариант')+'</button>';
    }
    return '<article class="hp-rec-card" data-tone="'+esc(rec.tone)+'">' +
      '<div class="hp-rec-index">'+esc(String(i+1))+'</div>' +
      '<div class="hp-rec-body">' +
        '<h4>'+esc(rec.title)+'</h4>' +
        '<p>'+esc(rec.text)+'</p>' +
        '<dl class="hp-rec-effects">' +
          '<div><dt>Тарелка</dt><dd>'+esc(rec.plate)+'</dd></div>' +
          '<div><dt>HEI</dt><dd>'+esc(rec.hei)+'</dd></div>' +
          '<div><dt>Ккал</dt><dd>'+esc(rec.kcal)+'</dd></div>' +
        '</dl>' +
        '<div class="hp-rec-example"><strong>Пример:</strong><span>'+esc(rec.example)+'</span></div>' +
        '<div class="hp-rec-actions">'+btn+'</div>' +
      '</div>' +
    '</article>';
  }
  function recommendationFlowHtml(model){
    if (!model || !model.ready || model.empty) return '';
    var items = recommendationItems(model);
    if (!items.length) return '';
    return '<section class="hp-recommendation-flow" aria-label="Рекомендации по Гарвардской тарелке">' +
      '<div class="hp-rec-head"><span>Что делать дальше</span><h3>Рекомендации с влиянием на тарелку и HEI</h3><p>Это основной рабочий блок: сначала смотрим действие, затем при необходимости проверяем вариант в симуляторе.</p></div>' +
      '<div class="hp-rec-grid">' + items.map(recommendationCardHtml).join('') + '</div>' +
    '</section>';
  }
  function firstActionsHtml(model){
    return recommendationFlowHtml(model);
  }

  function qualityFlagsHtml(model){
    var flags = (model.stage && model.stage.qualityFlags) || [];
    if (!flags.length) return '<section class="hp-quality-card" data-empty="true"><strong>Качественные замечания</strong><p>Сейчас явных замечаний нет.</p></section>';
    return '<section class="hp-quality-card"><strong>Качественные замечания</strong><ul>' + flags.slice(0, 5).map(function(f){
      return '<li data-severity="'+esc(f.severity || 'info')+'">'+esc(f.message || '')+'</li>';
    }).join('') + (flags.length > 5 ? '<li>Ещё замечаний: '+esc(String(flags.length - 5))+'</li>' : '') + '</ul></section>';
  }

  function plateSummaryHtml(model){
    if (!model.ready || model.empty) return '';
    var total = totalRationMass(model);
    var outside = outsideMainMass(model);
    return '<section class="hp-plate-summary-line"><strong>Основная тарелка: '+fmt(model.coreMass,0)+' г из '+fmt(total,0)+' г</strong><span>Основной круг показывает только четыре сектора: овощи, фрукты, цельные злаки и белковые продукты. Остальные продукты сохраняются в расчёте и разбираются ниже как элементы вне основной тарелки: '+fmt(outside,0)+' г.</span></section>';
  }

  function activePanelHtml(model){
    if (!model.ready || model.empty || model.coreMass <= 0) return '<div class="hp-active-panel hp-empty-panel"><h3>Тарелка готова к расчёту</h3><p>Добавьте продукты или загрузите пример. После изменения рациона блок обновится сам.</p></div>';
    var id = model.activeSector;
    var s = model.stage.sectors[id];
    var adjustment = s.adjustment || { message:'ориентир достигнут' };
    var state = stateLabel(s.state);
    var items = itemsFor(model, id);
    return '<section class="hp-active-panel hp-active-panel-selected" id="harvardPlateActivePanel" data-sector="'+esc(id)+'" data-state="'+esc(s.state)+'" aria-live="polite">' +
      '<div class="hp-active-selected-row"><div><div class="hp-active-kicker">Разбор выбранного сектора</div>' +
      '<h3><span class="hp-dot" style="--hp-dot:'+swatchColor(id)+'"></span>'+esc(sectorTitle(id))+'</h3></div><span class="hp-active-click-badge">'+esc(userSelectedSector ? 'выбрано кликом' : 'самый слабый сектор')+'</span></div>' +
      '<div class="hp-active-numbers"><strong>'+fmt(s.grams,0)+' г</strong><span>'+fmt(s.actualPercent,1)+'% основной тарелки</span><span>цель '+esc(sectorTargetText(id))+'</span></div>' +
      '<div class="hp-active-bar" style="--hp-progress:'+clamp(s.fillRatio,0,1)+'"><span></span></div>' +
      '<p class="hp-active-note">Заполнение цели: '+fmt(s.fillPercent,0)+'%. Статус: '+esc(state)+'. '+esc(adviceSentence(s))+'</p>' +
      '<div class="hp-active-howto"><strong>Как читать:</strong><span>граммы показывают массу продуктов в секторе, процент — долю от основной тарелки; общий рацион показан отдельно.</span></div>' +
      '<div class="hp-active-list"><strong>В расчёт вошли в этот сектор</strong>'+itemListHtml(items, 'В этом секторе пока нет продуктов.')+'</div>' +
      (separateItemsForSector(model, id).length ? '<div class="hp-active-list hp-active-list-separate"><strong>'+esc(separateLabelForSector(id))+'</strong>'+itemListWithReasonHtml(separateItemsForSector(model, id), '')+'</div>' : '') +
    '</section>';
  }

  function sectorCardHtml(model, id){
    var s = model.stage.sectors[id];
    var active = id === model.activeSector;
    var tone = statusTone(s.state);
    var aria = sectorTitle(id)+': '+fmt(s.grams,0)+' г, '+fmt(s.actualPercent,1)+'% основной тарелки, цель '+fmt(s.targetPercent,0)+'%, '+shortStateLabel(s.state);
    return '<button type="button" class="hp-sector-card hp-sector-card-simple'+(active ? ' is-active' : '')+'" data-hp-sector-card="'+esc(id)+'" data-tone="'+esc(tone)+'" aria-pressed="'+(active ? 'true' : 'false')+'" aria-controls="harvardPlateActivePanel" aria-label="'+esc(aria)+'">' +
      '<span class="hp-sector-card-head"><span><i style="--hp-dot:'+swatchColor(id)+'"></i>'+esc(sectorTitle(id))+'</span><b>'+fmt(s.actualPercent,0)+'%</b></span>' +
      '<span class="hp-sector-card-meta">'+fmt(s.grams,0)+' г · цель '+fmt(s.targetPercent,0)+'%</span>' +
      '<span class="hp-sector-card-status">'+esc(shortStateLabel(s.state))+'</span>' +
    '</button>';
  }

  function sectorCardsHtml(model){
    if (!model.ready || model.empty || model.coreMass <= 0) return '';
    return '<div class="hp-sector-cards" id="harvardPlateSectorCards">' + SECTOR_IDS.map(function(id){ return sectorCardHtml(model, id); }).join('') + '</div>';
  }

  function companionIconSvg(kind){
    var stroke = kind === 'fruits' ? '#dc2626' : kind === 'healthyFats' ? '#b45309' : kind === 'water' ? '#2563eb' : '#64748b';
    var fill = kind === 'fruits' ? '#fee2e2' : kind === 'healthyFats' ? '#fef3c7' : kind === 'water' ? '#dbeafe' : '#f1f5f9';
    if (kind === 'water') return '<svg class="hp-companion-inline-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 7C23 20 17 29 17 39a15 15 0 0 0 30 0C47 29 41 20 32 7Z" fill="'+fill+'" stroke="'+stroke+'" stroke-width="4"/><path d="M25 43c4 5 11 5 15 0" fill="none" stroke="'+stroke+'" stroke-width="3" stroke-linecap="round" opacity=".55"/></svg>';
    if (kind === 'healthyFats') return '<svg class="hp-companion-inline-icon" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="31" cy="35" rx="18" ry="22" fill="'+fill+'" stroke="'+stroke+'" stroke-width="4"/><circle cx="33" cy="36" r="7" fill="#fff7ed" stroke="'+stroke+'" stroke-width="3"/><path d="M41 16c7-5 13-4 16-1-2 6-8 10-16 9" fill="#dcfce7" stroke="#16a34a" stroke-width="3" stroke-linejoin="round"/></svg>';
    if (kind === 'dairy') return '<svg class="hp-companion-inline-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M23 10h18l-3 11 8 8v22a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V29l8-8-3-11Z" fill="'+fill+'" stroke="'+stroke+'" stroke-width="4" stroke-linejoin="round"/><path d="M21 37h22" stroke="'+stroke+'" stroke-width="3" opacity=".45"/></svg>';
    return '<svg class="hp-companion-inline-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="23" cy="25" r="10" fill="#fca5a5" stroke="#dc2626" stroke-width="3"/><circle cx="40" cy="34" r="13" fill="#fde68a" stroke="#d97706" stroke-width="3"/><circle cx="27" cy="42" r="8" fill="#86efac" stroke="#16a34a" stroke-width="3"/></svg>';
  }

  function companionCard(title, value, note, visualKind, image, stateIcon){
    return '<article class="harvard-plate-companion">' +
      '<div class="harvard-plate-companion-visual hp-companion-inline" data-kind="'+esc(visualKind)+'">' + companionIconSvg(visualKind) + (stateIcon ? '<span class="hp-companion-state-dot" aria-hidden="true"></span>' : '') + '</div>' +
      '<div class="harvard-plate-companion-body"><strong>'+esc(title)+'</strong><div class="hp-companion-value">'+esc(value)+'</div><div class="hp-companion-note">'+esc(note)+'</div></div>' +
    '</article>';
  }
  function companionStateIcon(kind, state){
    if (kind === 'water') return ASSET_ROOT + 'companions/states/' + (state === 'target' ? 'water-target-v5.svg' : state === 'mid' ? 'water-mid-v5.svg' : 'water-low-v5.svg');
    if (kind === 'healthyFats') return ASSET_ROOT + 'companions/states/' + (state === 'target' ? 'healthy-fats-target-v5.svg' : state === 'over' ? 'healthy-fats-over-v5.svg' : 'healthy-fats-low-v5.svg');
    if (kind === 'dairy') return ASSET_ROOT + 'companions/states/dairy-separate-v5.svg';
    return ASSET_ROOT + 'badges/info-v5.svg';
  }
  function companionsHtml(model){
    if (!model.ready || model.empty) return '';
    var stage = model.stage;
    var waterTarget = model.fluidTargetMl || 1800;
    var water = stage.companions.water;
    var fats = stage.companions.healthyFats;
    var unsatText = fats.unsaturatedFatG > 0 ? ' Ненасыщенные жиры: примерно '+fmt(fats.unsaturatedFatG,1)+' г.' : '';
    var waterNote = 'Учитываются вода, чай, кофе и несладкие напитки. Ориентир: '+fmt(waterTarget,0)+' мл.';
    if ((water.juiceMl || 0) > 0 || (water.sweetDrinkMl || 0) > 0) waterNote += ' Соки и сладкие напитки показаны отдельно.';
    return companionCard('Источники полезных жиров', fmt(fats.sourceGrams || fats.grams,0)+' г продуктов', 'Масла, орехи, семечки и авокадо показаны как продукты-источники.'+unsatText, 'healthyFats', ASSET_ROOT+'companions/healthy-fats-v5.png', companionStateIcon('healthyFats', fats.status)) +
      companionCard('Вода и несладкие напитки', fmt(water.ml,0)+' мл', waterNote, 'water', ASSET_ROOT+'companions/water-v5.png', companionStateIcon('water', water.status)) +
      companionCard('Молочные продукты', fmt(stage.grams.dairyG,0)+' г', 'Молочная группа ведётся отдельной строкой в строгой модели Гарвардской тарелки.', 'dairy', ASSET_ROOT+'badges/info-v5.svg', companionStateIcon('dairy', 'separate'));
  }

  function polarPoint(cx, cy, r, angleDeg){
    var a = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  function arcFlag(sweep){ return Math.abs(sweep) > 180 ? 1 : 0; }
  function ringSectorPath(cx, cy, rOuter, rInner, start, sweep){
    if (!Number.isFinite(sweep) || Math.abs(sweep) < 0.001 || rOuter <= rInner) return '';
    var end = start + sweep;
    var p1 = polarPoint(cx, cy, rOuter, start);
    var p2 = polarPoint(cx, cy, rOuter, end);
    var p3 = polarPoint(cx, cy, rInner, end);
    var p4 = polarPoint(cx, cy, rInner, start);
    var laf = arcFlag(sweep);
    return 'M '+fmt(p1.x,2)+' '+fmt(p1.y,2)+' A '+fmt(rOuter,2)+' '+fmt(rOuter,2)+' 0 '+laf+' 1 '+fmt(p2.x,2)+' '+fmt(p2.y,2)+' L '+fmt(p3.x,2)+' '+fmt(p3.y,2)+' A '+fmt(rInner,2)+' '+fmt(rInner,2)+' 0 '+laf+' 0 '+fmt(p4.x,2)+' '+fmt(p4.y,2)+' Z';
  }
  function arcPath(cx, cy, r, start, sweep){
    var end = start + sweep;
    var p1 = polarPoint(cx, cy, r, start);
    var p2 = polarPoint(cx, cy, r, end);
    return 'M '+fmt(p1.x,2)+' '+fmt(p1.y,2)+' A '+fmt(r,2)+' '+fmt(r,2)+' 0 '+arcFlag(sweep)+' 1 '+fmt(p2.x,2)+' '+fmt(p2.y,2);
  }
  function diagramGeom(id){ return DIAGRAM_GEOMETRY[id] || { start:0, sweep:90, labelX:0, labelY:0 }; }
  function fillRadiusForSector(sector, innerR, outerR){
    var fill = clamp(sector && sector.fillRatio, 0, 1);
    // Square-root compensation keeps perceived filled area closer to the actual progress of the target slot.
    return innerR + (outerR - innerR) * Math.sqrt(fill);
  }
  function svgSectorLayer(id, sector){
    var cx = 500, cy = 360, outerR = 260, innerR = 92;
    var g = diagramGeom(id);
    var color = swatchColor(id);
    var base = ringSectorPath(cx, cy, outerR, innerR, g.start, g.sweep);
    var rFill = fillRadiusForSector(sector, innerR, outerR);
    var fillPath = ringSectorPath(cx, cy, rFill, innerR, g.start, g.sweep);
    var state = sector && sector.state || 'empty';
    var fillOpacity = state === 'target' ? 0.82 : (state === 'over' || state === 'strong-over' ? 0.88 : 0.72);
    var lowCue = (sector && sector.fillRatio > 0 && sector.fillRatio < 0.62) ? '<path class="hp-diagram-low-cue" d="'+esc(base)+'" fill="none" stroke="'+esc(color)+'" stroke-width="7" stroke-dasharray="9 12" opacity="0.28" />' : '';
    return '<g class="hp-diagram-sector" data-sector="'+esc(id)+'" data-state="'+esc(state)+'">' +
      '<path class="hp-diagram-target" d="'+esc(base)+'" fill="'+esc(color)+'" opacity="0.115" />' +
      (fillPath ? '<path class="hp-diagram-fill" d="'+esc(fillPath)+'" fill="'+esc(color)+'" opacity="'+fmt(fillOpacity,2)+'" />' : '') +
      lowCue +
    '</g>';
  }
  function svgOverfillArc(id, sector){
    if (!sector || sector.fillRatio <= 1.05) return '';
    var cx = 500, cy = 360, outerR = 272;
    var g = diagramGeom(id);
    var width = sector.fillRatio > 1.4 ? 13 : 10;
    var opacity = sector.fillRatio > 1.4 ? 0.78 : 0.58;
    return '<path class="hp-diagram-over-arc" data-sector="'+esc(id)+'" d="'+esc(arcPath(cx,cy,outerR,g.start+3,g.sweep-6))+'" fill="none" stroke="#d97706" stroke-width="'+width+'" stroke-linecap="round" opacity="'+opacity+'" />';
  }
  function svgActiveOutline(id, sector){
    if (!sector || id !== activeSector) return '';
    var cx = 500, cy = 360, outerR = 286, innerR = 80;
    var g = diagramGeom(id);
    return '<path class="hp-diagram-active-outline" d="'+esc(ringSectorPath(cx,cy,outerR,innerR,g.start,g.sweep))+'" fill="none" stroke="'+esc(swatchColor(id))+'" stroke-width="10" opacity="0.72" />';
  }
  function sectorAriaLabel(id, sector){
    if (!sector) return sectorTitle(id);
    return sectorTitle(id)+': '+fmt(sector.grams,0)+' г, '+fmt(sector.actualPercent,1)+'% основной тарелки, цель '+fmt(sector.targetPercent,0)+'%, '+stateLabel(sector.state);
  }
  function svgClickTarget(id, sector){
    var cx = 500, cy = 360, outerR = 292, innerR = 62;
    var g = diagramGeom(id);
    var path = ringSectorPath(cx, cy, outerR, innerR, g.start, g.sweep);
    return '<path class="hp-sector-click hp-diagram-click" data-hp-sector="'+esc(id)+'" tabindex="0" role="button" aria-label="'+esc(sectorAriaLabel(id, sector))+'" aria-controls="harvardPlateActivePanel" aria-pressed="'+(id === activeSector ? 'true' : 'false')+'" d="'+esc(path)+'" fill="transparent" />';
  }
  function svgLabel(id, sector){
    var g = diagramGeom(id);
    var mid = g.start + g.sweep / 2;
    var p = polarPoint(500, 360, 302, mid);
    var lx = g.labelX, ly = g.labelY;
    var color = swatchColor(id);
    var tone = statusTone(sector && sector.state);
    var pctText = fmt(sector && sector.actualPercent,1)+'%';
    var gramsText = fmt(sector && sector.grams,0)+' г';
    var status = shortStateLabel(sector && sector.state);
    var connectorX = lx < 500 ? lx + 196 : lx;
    var connectorY = ly + 44;
    return '<g class="hp-diagram-label" data-sector="'+esc(id)+'" data-tone="'+esc(tone)+'">' +
      '<path class="hp-diagram-connector" d="M '+fmt(p.x,1)+' '+fmt(p.y,1)+' L '+fmt(connectorX,1)+' '+fmt(connectorY,1)+'" stroke="'+esc(color)+'" stroke-width="2" opacity="0.34" fill="none" />' +
      '<rect x="'+fmt(lx,0)+'" y="'+fmt(ly,0)+'" width="220" height="94" rx="18" fill="#ffffff" stroke="'+esc(color)+'" stroke-opacity="0.28" />' +
      '<circle cx="'+fmt(lx+18,0)+'" cy="'+fmt(ly+24,0)+'" r="7" fill="'+esc(color)+'" />' +
      '<text x="'+fmt(lx+32,0)+'" y="'+fmt(ly+28,0)+'" class="hp-diagram-label-title">'+esc(sectorTitle(id))+'</text>' +
      '<text x="'+fmt(lx+16,0)+'" y="'+fmt(ly+55,0)+'" class="hp-diagram-label-value">'+esc(gramsText)+' · '+esc(pctText)+'</text>' +
      '<text x="'+fmt(lx+16,0)+'" y="'+fmt(ly+78,0)+'" class="hp-diagram-label-note">цель '+esc(sectorTargetText(id))+' · '+esc(status)+' · нажмите</text>' +
    '</g>';
  }

  function isMobileActualMode(){
    try { return window.matchMedia && window.matchMedia('(max-width: 760px)').matches; }
    catch(_) { return false; }
  }
  function percentFromMass(model, id){
    var s = model && model.stage && model.stage.sectors && model.stage.sectors[id];
    var core = num(model && model.coreMass);
    if (!s || core <= 0) return 0;
    return Math.max(0, num(s.grams) / core * 100);
  }
  function renderMobileActualSvg(model){
    var stage = model.stage;
    var cx = 500, cy = 360, outerR = 242, innerR = 116;
    var start = -90;
    var total = Math.max(0, num(model.coreMass));
    var sectors = [];
    DIAGRAM_ORDER.forEach(function(id){
      var s = stage.sectors[id] || {};
      var pct = percentFromMass(model, id);
      sectors.push({ id:id, sector:s, pct:pct, grams:num(s.grams), target:num(s.targetPercent) });
    });
    var paths = sectors.map(function(x, idx){
      if (x.pct <= 0.01) return '';
      var sweep = Math.min(359.99, x.pct / 100 * 360);
      var d = ringSectorPath(cx, cy, outerR, innerR, start, sweep);
      var out = '<path class="hp-mobile-actual-sector hp-sector-click" data-sector="'+esc(x.id)+'" data-hp-sector="'+esc(x.id)+'" tabindex="0" role="button" aria-controls="hpSectorAcc-'+esc(x.id)+' harvardPlateActivePanel" aria-label="'+esc(sectorAriaLabel(x.id, x.sector))+'" d="'+esc(d)+'" fill="'+esc(swatchColor(x.id))+'" opacity="0.86" />';
      start += sweep;
      return out;
    }).join('');
    var labels = sectors.map(function(x){
      return '<button type="button" class="hp-mobile-actual-legend-item" data-hp-sector-card="'+esc(x.id)+'" aria-controls="hpSectorAcc-'+esc(x.id)+' harvardPlateActivePanel" aria-label="Раскрыть подробности сектора '+esc(sectorTitle(x.id))+'"><i class="hp-mobile-actual-dot" style="--hp-dot:'+esc(swatchColor(x.id))+'"></i><span class="hp-mobile-actual-title"><strong>'+esc(sectorTitle(x.id))+'</strong><small>цель '+fmt(x.target,0)+'%</small></span><b>'+fmt(x.grams,0)+' г · '+fmt(x.pct,1)+'%</b><span class="hp-mobile-actual-action">раскрыть</span></button>';
    }).join('');
    return '<div class="harvard-plate-svg-shell hp-mobile-actual-shell"><svg viewBox="0 0 1000 760" xmlns="http://www.w3.org/2000/svg" aria-label="Фактическая диаграмма Гарвардской тарелки" role="img"><title>Фактическая диаграмма Гарвардской тарелки</title><desc>На мобильном экране площадь сектора соответствует фактической доле группы в основной тарелке.</desc>'+
      '<rect x="18" y="18" width="964" height="724" rx="32" fill="#f8fbff" stroke="#dbeafe" />'+
      '<circle cx="500" cy="360" r="278" fill="#ffffff" opacity="0.94" />'+
      (paths || '<circle cx="500" cy="360" r="210" fill="#eef6ff" />')+
      '<circle cx="500" cy="360" r="116" fill="#ffffff" stroke="#dbeafe" stroke-width="2" />'+
      '<text x="500" y="334" text-anchor="middle" class="hp-diagram-center-kicker">Фактическая тарелка</text>'+
      '<text x="500" y="365" text-anchor="middle" class="hp-diagram-center-value">'+esc(fmt(total,0))+' г</text>'+
      '<text x="500" y="394" text-anchor="middle" class="hp-diagram-center-note">секторы = реальные %</text>'+
      '<text x="500" y="710" text-anchor="middle" class="hp-diagram-caption-svg">Круг показывает только основную тарелку; вода, молочные продукты, масла и сладкие напитки учитываются отдельно ниже.</text>'+
      '</svg><div class="hp-mobile-actual-legend">'+labels+'</div></div>';
  }

  function renderSvg(model){
    if (isMobileActualMode()) return renderMobileActualSvg(model);
    var stage = model.stage;
    var coreText = fmt(model.coreMass,0)+' г';
    var scoreText = fmt(model.score,0)+'%';
    var sectors = DIAGRAM_ORDER.map(function(id){ return svgSectorLayer(id, stage.sectors[id]); }).join('');
    var over = DIAGRAM_ORDER.map(function(id){ return svgOverfillArc(id, stage.sectors[id]); }).join('');
    var active = DIAGRAM_ORDER.map(function(id){ return svgActiveOutline(id, stage.sectors[id]); }).join('');
    var clicks = DIAGRAM_ORDER.map(function(id){ return svgClickTarget(id, stage.sectors[id]); }).join('');
    var labels = DIAGRAM_ORDER.map(function(id){ return svgLabel(id, stage.sectors[id]); }).join('');
    var separators = DIAGRAM_ORDER.map(function(id){ var g=diagramGeom(id); return '<path class="hp-diagram-separator" d="'+esc(arcPath(500,360,260,g.start,0.01))+'" />'; }).join('');
    var center = '<g class="hp-diagram-center">' +
      '<circle cx="500" cy="360" r="86" fill="#ffffff" stroke="#dbeafe" stroke-width="2" />' +
      '<text x="500" y="334" text-anchor="middle" class="hp-diagram-center-kicker">Основная тарелка</text>' +
      '<text x="500" y="365" text-anchor="middle" class="hp-diagram-center-value">'+esc(coreText)+'</text>' +
      '<text x="500" y="394" text-anchor="middle" class="hp-diagram-center-note">баланс '+esc(scoreText)+'</text>' +
    '</g>';
    var legend = '<g class="hp-diagram-caption-svg"><text x="500" y="710" text-anchor="middle">Цветная толщина сектора показывает заполнение цели. Оранжевый ободок отмечает перебор.</text></g>';
    return '<div class="harvard-plate-svg-shell hp-diagram-remaster-shell"><svg viewBox="0 0 1000 760" xmlns="http://www.w3.org/2000/svg" data-hp-diagram-remaster="true" aria-label="Диаграмма Гарвардской тарелки" role="img"><title>Диаграмма Гарвардской тарелки</title><desc>Фиксированные сектора показывают целевые доли. Заполнение внутри каждого сектора показывает, насколько текущий рацион приблизился к цели.</desc>' +
      '<rect x="18" y="18" width="964" height="724" rx="32" fill="#f8fbff" stroke="#dbeafe" />' +
      '<circle cx="500" cy="360" r="304" fill="#ffffff" opacity="0.92" />' +
      '<g class="hp-diagram-targets">'+sectors+'</g>' +
      '<circle cx="500" cy="360" r="260" fill="none" stroke="rgba(15,23,42,.10)" stroke-width="2" />' +
      '<circle cx="500" cy="360" r="92" fill="none" stroke="rgba(15,23,42,.10)" stroke-width="2" />' +
      over + active + center + labels + clicks + legend + '</svg></div>';
  }

  function stableSetHtml(el, html){
    if (!el) return false;
    if (el.__lastStableHtml === html) return false;
    el.innerHTML = html;
    el.__lastStableHtml = html;
    return true;
  }
  function setStableTextHtml(el, html){
    return stableSetHtml(el, html);
  }

  function renderVisual(model){
    var host = $('harvardPlateVisual');
    var companions = $('harvardPlateCompanions');
    if (!host || !companions) return;
    if (!model.ready) {
      stableSetHtml(host, '<div class="harvard-plate-stage-empty">'+esc(model.message || 'Модуль визуализации загружается.')+'</div>');
      stableSetHtml(companions, '');
      return;
    }
    if (model.empty || model.coreMass <= 0) {
      stableSetHtml(host, '<div class="harvard-plate-stage-empty"><strong>Структура тарелки появится после добавления продуктов.</strong><span>Добавьте продукты вручную или загрузите пример. Расчёт обновится автоматически.</span></div>');
      stableSetHtml(companions, '');
      return;
    }
    stableSetHtml(host, renderSvg(model));
    stableSetHtml(companions, companionsHtml(model));
  }

  function renderStatus(model){
    var scoreRing = $('harvardPlateScoreRing');
    var scoreText = $('harvardPlateScoreText');
    var metrics = $('harvardPlateMetrics');
    if (!scoreRing || !scoreText || !metrics) return;
    if (!model.ready) {
      scoreRing.style.setProperty('--plate-score', '0'); scoreRing.textContent = '—';
      setStableTextHtml(scoreText, '<strong>Ждём загрузку данных</strong><span>После загрузки базы появится визуализация в граммах.</span>');
      stableSetHtml(metrics, '<div class="harvard-plate-empty">'+esc(model.message || 'Модуль ещё загружается.')+'</div>');
      return;
    }
    if (model.empty) {
      scoreRing.style.setProperty('--plate-score', '0'); scoreRing.textContent = '—';
      setStableTextHtml(scoreText, '<strong>Готово к расчёту</strong><span>Добавьте продукты. Тарелка покажет доли овощей, фруктов, цельных злаков и белковых продуктов.</span>');
      stableSetHtml(metrics, '<div class="harvard-plate-empty">В рационе пока нет продуктов для основной тарелки.</div>');
      return;
    }
    if (model.coreMass <= 0) {
      scoreRing.style.setProperty('--plate-score', '0'); scoreRing.textContent = '0%';
      setStableTextHtml(scoreText, '<strong>Основная тарелка пока пуста</strong><span>Продукты в рационе есть; сейчас они относятся к группам вне основной Гарвардской тарелки.</span>');
      stableSetHtml(metrics, topSummaryHtml(model) + firstActionsHtml(model));
      return;
    }
    scoreRing.style.setProperty('--plate-score', String(clamp(model.score,0,100))); scoreRing.textContent = model.score + '%';
    setStableTextHtml(scoreText, '<strong>Визуальный баланс: '+model.score+'%</strong><span>Главное отклонение сейчас: «'+esc(sectorTitle(model.weakest))+'». Расчёт показывает структуру тарелки по граммам.</span>');
    stableSetHtml(metrics, topSummaryHtml(model) + activePanelHtml(model) + firstActionsHtml(model) + sectorCardsHtml(model) + interactionGuideHtml(model) + qualityFlagsHtml(model));
  }

  function renderExplain(model){
    var host = $('harvardPlateExplainBody');
    if (!host) return;
    stableSetHtml(host, explainHtml(model));
  }

  function render(){
    var model = getModel();
    try { ['HarvardPlateV5337','HarvardPlateV5336','HarvardPlateV5335','HarvardPlateV5332','HarvardPlateV5331','HarvardPlateV5330','HarvardPlateV5329','HarvardPlateV5328','HarvardPlateV5221','HarvardPlateV5220','HarvardPlateV5219','HarvardPlateV5214','HarvardPlateV5213','HarvardPlateV5212','HarvardPlateV5211','HarvardPlateV529','HarvardPlateV528','HarvardPlateV527','HarvardPlateV526','HarvardPlateV525','HarvardPlateV524','HarvardPlateV523'].forEach(function(name){ if (window[name]) window[name].__lastModel = model; }); } catch(_) {}
    renderVisual(model);
    renderStatus(model);
    renderExplain(model);
    return !!model.ready;
  }
  function scheduleRender(reason){
    if (reason === 'ration-change') userSelectedSector = false;
    if (renderScheduled) return;
    renderScheduled = true;
    (window.requestAnimationFrame || window.setTimeout)(function(){ renderScheduled = false; render(); }, 16);
  }
  function selectSector(id){
    if (SECTOR_IDS.indexOf(id) < 0) return;
    activeSector = id;
    userSelectedSector = true;
    try {
      window.__HARVARD_LAST_SELECTED_SECTOR__ = { id:id, title:sectorTitle(id), at:new Date().toISOString() };
      window.dispatchEvent(new CustomEvent('harvard:sector-selected', { detail:window.__HARVARD_LAST_SELECTED_SECTOR__ }));
    } catch(_) {}
    scheduleRender('sector-select');
  }
  function moveSector(delta){
    var current = SECTOR_IDS.indexOf(activeSector);
    if (current < 0) current = 0;
    var next = (current + delta + SECTOR_IDS.length) % SECTOR_IDS.length;
    selectSector(SECTOR_IDS[next]);
  }

  function bindDynamicClicks(){
    document.addEventListener('click', function(e){
      var sector = e.target && e.target.closest ? e.target.closest('[data-hp-sector]') : null;
      var card = e.target && e.target.closest ? e.target.closest('[data-hp-sector-card]') : null;
      var whatif = e.target && e.target.closest ? e.target.closest('[data-hp-open-whatif]') : null;
      var outside = e.target && e.target.closest ? e.target.closest('[data-hp-jump-outside]') : null;
      var heiJump = e.target && e.target.closest ? e.target.closest('[data-hp-jump-hei]') : null;
      if (whatif) {
        e.preventDefault();
        var wid = whatif.getAttribute('data-hp-open-whatif');
        var action = whatif.getAttribute('data-hp-rec-action') || 'add';
        var grams = Number(whatif.getAttribute('data-hp-rec-grams')) || sectorDefaultAddGrams(wid);
        var template = whatif.getAttribute('data-hp-rec-template') || sectorWhatIfTemplate(wid);
        if (wid && SECTOR_IDS.indexOf(wid) >= 0) selectSector(wid);
        try {
          var detail = { sector:wid || '', action:action, grams:grams, template:template, at:new Date().toISOString() };
          window.__HARVARD_RECOMMENDATION_SCENARIO__ = detail;
          var shell = document.querySelector('#harvardWhatIfSimulator .hpwi-shell');
          if (shell) shell.open = true;
          window.dispatchEvent(new CustomEvent('harvard:recommendation-check', { detail:detail }));
        } catch(_) {}
        return;
      }
      if (outside) {
        e.preventDefault();
        try {
          var box = document.querySelector('.hp-outside-summary');
          if (box) box.setAttribute('data-highlight','1');
          setTimeout(function(){ if (box) box.removeAttribute('data-highlight'); }, 1600);
        } catch(_) {}
        return;
      }
      if (heiJump) {
        e.preventDefault();
        try {
          var hei = document.getElementById('heiPanel');
          if (hei) {
            hei.setAttribute('data-highlight','1');
            setTimeout(function(){ hei.removeAttribute('data-highlight'); }, 1600);
          }
        } catch(_) {}
        return;
      }
      if (sector) { e.preventDefault(); selectSector(sector.getAttribute('data-hp-sector')); }
      else if (card) { e.preventDefault(); selectSector(card.getAttribute('data-hp-sector-card')); }
    });
    document.addEventListener('keydown', function(e){
      var sector = e.target && e.target.closest ? e.target.closest('[data-hp-sector]') : null;
      if (!sector) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSector(sector.getAttribute('data-hp-sector')); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveSector(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveSector(-1); }
      else if (e.key === 'Home') { e.preventDefault(); selectSector(SECTOR_IDS[0]); }
      else if (e.key === 'End') { e.preventDefault(); selectSector(SECTOR_IDS[SECTOR_IDS.length-1]); }
    });
  }

  function patchStateForEvents(){
    var api = window.State;
    if (!api) return false;
    // v5.2.23: State already emits one canonical window-level ration:changed event.
    // Harvard Plate must not wrap State.add/update/remove/clear, otherwise one user action
    // produces duplicate renders and delayed UI.
    api.__harvardV525Events = true;
    return true;
  }

  function findFallbackProduct(query){
    var q = lower(query), items = allProducts();
    for (var i = 0; i < items.length; i++) if (textOf(items[i]).indexOf(q) >= 0) return items[i];
    return null;
  }
  function loadSample(){
    var btn = $('harvardPlateSampleBtn');
    var rows = [], added = 0;
    SAMPLE.forEach(function(it){ var p = product(it.key); if (p) rows.push({ key:p.key, name_ru:p.name_ru, hei_category_key:p.hei_category_key, catalog_category_key:p.catalog_category_key, grams:it.grams }); });
    if (rows.length < 7) {
      FALLBACK_SAMPLE_NAMES.forEach(function(pair){ var p = findFallbackProduct(pair[0]); if (p && !rows.some(function(r){ return r.key === p.key; })) rows.push({ key:p.key, name_ru:p.name_ru, hei_category_key:p.hei_category_key, catalog_category_key:p.catalog_category_key, grams:pair[1] }); });
    }
    if (window.State && typeof window.State.clear === 'function' && typeof window.State.add === 'function') {
      patchStateForEvents(); window.State.clear(); rows.forEach(function(r){ if (product(r.key)) { window.State.add(r.key, r.grams); added++; } });
    } else { saveRationFallback(rows); added = rows.length; }
    userSelectedSector = false;
    if (btn) { btn.textContent = added ? 'Пример загружен' : 'Не удалось загрузить пример'; window.setTimeout(function(){ btn.textContent = 'Показать пример сбалансированной тарелки'; }, 1800); }
    try {
      var panel = $('harvardPlatePanel');
      if (panel) {
        panel.setAttribute('data-scroll-intent','true');
        try { panel.scrollIntoView({ behavior:'auto', block:'start' }); }
        finally { setTimeout(function(){ try { panel.removeAttribute('data-scroll-intent'); } catch(_){} }, 600); }
      }
    } catch(_) {}
    scheduleRender('ration-change');
    return added > 0;
  }

  function bind(){
    bindDynamicClicks();
    var btn = $('harvardPlateSampleBtn');
    if (btn && !btn.__harvardBound) { btn.__harvardBound = true; btn.addEventListener('click', function(e){ e.preventDefault(); loadSample(); }); }
    var refresh = $('harvardPlateRefreshBtn');
    if (refresh && !refresh.__harvardBound) { refresh.__harvardBound = true; refresh.addEventListener('click', function(e){ e.preventDefault(); scheduleRender('manual'); }); }
    ['ration:changed','needs:computed','needs:changed'].forEach(function(eventName){
      window.addEventListener(eventName, function(){ scheduleRender(eventName === 'ration:changed' ? 'ration-change' : eventName); });
    });
    window.addEventListener('storage', function(e){ if (!e || e.key === 'nutri_ration_v1') scheduleRender('ration-change'); });
    var tries = 0;
    (function waitState(){ tries++; if (!patchStateForEvents() && tries < 20) window.setTimeout(waitState, 150); })();
  }

  function runClassificationTests(){
    var rows = [];
    function row(name, pass, detail){ rows.push({ test:name, pass:!!pass, detail:detail || '' }); }
    function findByName(re){
      var items = allProducts();
      for (var i=0;i<items.length;i++) if (re.test(textOf(items[i]))) return items[i];
      return null;
    }
    function classifySingle(p){
      if (!p) return null;
      var fakeKey = p.key || '__test__';
      var oldDB = window.DB;
      try {
        var byKey = new Map(); byKey.set(fakeKey, p);
        window.DB = Object.assign({}, oldDB || {}, { byKey: byKey, items:[p] });
        return buildV5Input([{ key:fakeKey, grams:100 }]);
      } finally { window.DB = oldDB; }
    }
    var yogurt = findByName(/йогурт.*(виш|черник)|yogurt.*(cherry|blueberry)/i);
    var y = classifySingle(yogurt);
    row('fruit yogurt is dairy, not fruit sector', !!(y && y.input.dairyG === 100 && y.input.fruitsG === 0), yogurt ? (yogurt.name_ru || yogurt.key) : 'not found');
    var apple = findByName(/яблок|apple/i);
    var a = classifySingle(apple);
    row('plain fruit remains fruit sector', !!(a && a.input.fruitsG === 100 && a.input.dairyG === 0), apple ? (apple.name_ru || apple.key) : 'not found');
    var chicken = findByName(/куриная груд|chicken breast/i);
    var c = classifySingle(chicken);
    row('chicken remains protein sector', !!(c && c.input.proteinG === 100), chicken ? (chicken.name_ru || chicken.key) : 'not found');

    var oatCookie = findByName(/печенье овсяное|oatmeal.*cookie/i);
    var oc = classifySingle(oatCookie);
    row('oatmeal cookie is not whole-grain sector', !!(oc && oc.input.wholeGrainsG === 0 && oc.input.refinedGrainsG > 0), oatCookie ? (oatCookie.name_ru || oatCookie.key) : 'not found');

    var mayo = findByName(/майонез|mayonnaise/i);
    var my = classifySingle(mayo);
    row('mayonnaise is outside healthy-fat sources', !!(my && my.input.healthyFatSourceG === 0 && my.input.fattySauceG > 0), mayo ? (mayo.name_ru || mayo.key) : 'not found');

    var buckwheat = findByName(/гречневая крупа|buckwheat.*cooked/i);
    var bw = classifySingle(buckwheat);
    row('buckwheat remains whole-grain sector', !!(bw && bw.input.wholeGrainsG === 100), buckwheat ? (buckwheat.name_ru || buckwheat.key) : 'not found');

    var greenPeas = findByName(/горошек.*заморож|green peas.*frozen/i);
    var gp = classifySingle(greenPeas);
    row('frozen green peas are vegetables, not dessert false-positive', !!(gp && gp.input.vegetablesG === 100), greenPeas ? (greenPeas.name_ru || greenPeas.key) : 'not found');

    var beefLiver = findByName(/печень говяж|beef liver/i);
    var bl = classifySingle(beefLiver);
    row('liver is protein, not cookie false-positive', !!(bl && bl.input.proteinG === 100), beefLiver ? (beefLiver.name_ru || beefLiver.key) : 'not found');

    var saury = findByName(/сайра.*соку|saury.*juice/i);
    var sy = classifySingle(saury);
    row('fish in own juice is protein, not juice beverage', !!(sy && sy.input.proteinG === 100 && sy.input.juiceMl === 0), saury ? (saury.name_ru || saury.key) : 'not found');

    var milkSausage = findByName(/сосиски молоч|milk.*sausage/i);
    var ms = classifySingle(milkSausage);
    row('milk-style sausages are not dairy sector', !!(ms && ms.input.dairyG === 0 && ms.input.processedMeatG === 100 && ms.input.proteinG === 0), milkSausage ? (milkSausage.name_ru || milkSausage.key) : 'not found');

    var potato = findByName(/картофель отварной|potato.*boiled/i);
    var pt = classifySingle(potato);
    row('plain potato does not fill Harvard vegetable sector', !!(pt && pt.input.vegetablesG === 0), potato ? (potato.name_ru || potato.key) : 'not found');

    var whiteRice = findByName(/рис басмати.*белый|basmati.*white/i);
    var wr = classifySingle(whiteRice);
    row('white/basmati rice is refined, not whole-grain sector', !!(wr && wr.input.wholeGrainsG === 0 && wr.input.refinedGrainsG > 0), whiteRice ? (whiteRice.name_ru || whiteRice.key) : 'not found');

    var fishCutlet = findByName(/котлета рыбная.*картофель|fish cutlet.*potato/i);
    var fc = classifySingle(fishCutlet);
    row('fish cutlet meal is not dairy because of small dairy equivalent', !!(fc && fc.input.proteinG === 100), fishCutlet ? (fishCutlet.name_ru || fishCutlet.key) : 'not found');

    var oatmealCookie = findByName(/овсяное.*печенье|oatmeal.*cookie/i);
    var oc = classifySingle(oatmealCookie);
    row('oatmeal cookies do not fill whole-grain sector', !!(oc && oc.input.wholeGrainsG === 0 && oc.input.refinedGrainsG > 0), oatmealCookie ? (oatmealCookie.name_ru || oatmealCookie.key) : 'not found');
    var mayo = findByName(/майонез|mayonnaise/i);
    var my = classifySingle(mayo);
    row('mayonnaise is not a healthy-fat source', !!(my && my.input.healthyFatSourceG === 0 && my.input.fattySauceG > 0), mayo ? (mayo.name_ru || mayo.key) : 'not found');
    var buckwheatReady = findByName(/гречка.*гриб|buckwheat.*mushroom/i);
    var bw = classifySingle(buckwheatReady);
    row('buckwheat mixed dishes fill whole-grain sector when whole-grain equivalent is explicit', !!(bw && bw.input.wholeGrainsG > 0), buckwheatReady ? (buckwheatReady.name_ru || buckwheatReady.key) : 'not found');
    try { if (console && console.table) console.table(rows); } catch(_) {}
    window.__harvardPlateV5220ClassificationTests = rows;
    return rows.every(function(r){ return r.pass; });
  }

  function runTests(){
    var rows = [];
    function row(test, pass, detail){ rows.push({ test:test, pass:!!pass, detail:detail || '' }); }
    row('visual container exists', !!$('harvardPlateVisual'));
    row('metrics container exists', !!$('harvardPlateMetrics'));
    row('v5 engine loaded', !!window.HarvardPlateV5StageEngine);
    row('v5 masks loaded', !!window.HarvardPlateV5Masks);
    row('diagram/classification renderer available', /diagram|classification_events/.test(VERSION));
    try { var model = getModel(); row('model computes', !!model); row('model uses four sectors', !!(model.stage && SECTOR_IDS.every(function(id){ return !!model.stage.sectors[id]; }))); } catch(e){ row('model computes', false, e && (e.message || String(e))); }
    try { row('render runs', typeof render() === 'boolean'); } catch(e2){ row('render runs', false, e2 && (e2.message || String(e2))); }
    if (console && console.table) console.table(rows);
    return rows.every(function(r){ return !!r.pass; });
  }

  function init(){ bind(); scheduleRender('init'); window.setTimeout(function(){ scheduleRender('late-init'); }, 500); window.setTimeout(function(){ scheduleRender('late-db'); }, 1200); }
  var api = { version:VERSION, getModel:getModel, render:render, scheduleRender:scheduleRender, loadSample:loadSample, outsideGroupRows:outsideGroupRows, firstActionItems:firstActionItems, selectSector:selectSector, runTests:runTests, runClassificationTests:runClassificationTests };
  window.HarvardPlateV5230 = api;
  window.HarvardPlateV5223 = api;
  window.HarvardPlateV5221 = api;
  window.HarvardPlateV5220 = api;
  window.HarvardPlateV5219 = api;
  window.HarvardPlateV5216 = api;
  window.HarvardPlateV5215 = api;
  window.HarvardPlateV5214 = api;
  window.HarvardPlateV5213 = api;
  window.HarvardPlateV5212 = api;
  window.HarvardPlateV5211 = api;
  window.HarvardPlateV532 = api;
  window.HarvardPlateV549 = api;
  window.HarvardPlateV548 = api;
  window.HarvardPlateV547 = api;
  window.HarvardPlateV546 = api;
  window.HarvardPlateV545 = api;
  window.HarvardPlateV544 = api;
  window.HarvardPlateV543 = api;
  window.HarvardPlateV542 = api;
  window.HarvardPlateV541 = api;
  window.HarvardPlateV540 = api;
  window.HarvardPlateV5337 = api;
  window.HarvardPlateV5336 = api;
  window.HarvardPlateV5335 = api;
  window.HarvardPlateV5334 = api;
  window.HarvardPlateV5332 = api;
  window.HarvardPlateV5331 = api;
  window.HarvardPlateV5330 = api;
  window.HarvardPlateV5329 = api;
  window.HarvardPlateV5328 = api;
  window.HarvardPlateV5326 = api;
  window.HarvardPlateV5318 = api;
  window.HarvardPlateV5317 = api;
  window.HarvardPlateV5316 = api;
  window.HarvardPlateV5315 = api;
  window.HarvardPlateV5314 = api;
  window.HarvardPlateV5313 = api;
  window.HarvardPlateV5312 = api;
  window.HarvardPlateV5311 = api;
  window.HarvardPlateV5310 = api;
  window.HarvardPlateV539 = api;
  window.HarvardPlateV538 = api;
  window.HarvardPlateV537 = api;
  window.HarvardPlateV536 = api;
  window.HarvardPlateV535 = api;
  window.HarvardPlateV534 = api;
  window.HarvardPlateV533 = api;
  window.HarvardPlateV531 = api;
  window.HarvardPlateV530 = api;
  window.HarvardPlateV529 = api;
  window.HarvardPlateV528 = api;
  window.HarvardPlateV527 = api;
  window.HarvardPlateV526 = api;
  window.HarvardPlateV525 = api;
  window.HarvardPlateV524 = api;
  window.HarvardPlateV523 = api;
  window.HarvardPlateV522 = api;
  window.HarvardPlateV521 = api;
  window.HarvardPlateV520 = api;
  window.HarvardPlateV512 = api;
  window.runV5216HarvardPlateTests = runTests;
  window.runV5215HarvardPlateTests = runTests;
  window.runV5214HarvardPlateTests = runTests;
  window.runV5213HarvardPlateTests = runTests;
  window.runV5212HarvardPlateTests = runTests;
  window.runV5211HarvardPlateTests = runTests;
  window.runV529HarvardPlateTests = runTests;
  window.runV528HarvardPlateTests = runTests;
  window.runV527HarvardPlateTests = runTests;
  window.runV526HarvardPlateTests = runTests;
  window.runV525HarvardPlateTests = runTests;
  window.runV524HarvardPlateTests = runTests;
  window.runV523HarvardPlateTests = runTests;
  window.runV522HarvardPlateTests = runTests;
  window.runV521HarvardPlateTests = runTests;
  window.runV520HarvardPlateTests = runTests;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
