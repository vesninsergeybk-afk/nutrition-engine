// nutrition calculator v5.3.194 — Gemini batch commit and HEI flicker guard
// Module: 03-app-core.js
// Responsibility: Main calculator runtime, DB object, UI, search, cart, totals, storage.
// Extracted from v3.8.1 monolithic app.js without changing runtime logic.

// ===== extracted inline script 6; id=none =====
// Global error handlers
  window.addEventListener('error', (e) => {
    try {
      const panel = document.getElementById('devPanel');
      if (panel) panel.classList.add('open');
      const content = document.getElementById('devContent');
      const msg = e && e.error && e.error.stack ? e.error.stack : (e && e.message ? e.message : String(e));
      if (content) content.textContent = msg;
      console.error('GLOBAL_ERROR', e.error || e.message);
    } catch(_) {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      const panel = document.getElementById('devPanel');
      if (panel) panel.classList.add('open');
      const content = document.getElementById('devContent');
      const msg = e.reason && e.reason.stack ? e.reason.stack : (e.reason ? String(e.reason) : 'Promise rejection');
      if (content) content.textContent = msg;
      console.error('GLOBAL_UNHANDLED_REJECTION', e.reason);
    } catch(_) {}
  });

  const DEV = (new URLSearchParams(location.search).get('dev') === '1');
  const Logger = (() => {
    const logs = [];
    const log = (level, event, payload) => {
      const item = { ts: new Date().toISOString(), level, event, payload };
      logs.push(item);
      if (DEV) console[level === 'error' ? 'error':'log'](`[${level}] ${event}`, payload ?? '');
    };
    return ({ info: (e,p)=>log('info',e,p), warn:(e,p)=>log('warn',e,p), error:(e,p)=>log('error',e,p), get:()=>logs.slice() });
  })();

  // v5.2.23: storage-safe wrapper. In some browsers, privacy modes, embedded
  // views, local preview, or strict policies can make window.localStorage throw.
  // The calculator must still search, add products and render the ration in that
  // case; persistence degrades to in-memory storage instead of breaking runtime.
  const SafeStorage = (() => {
    const memory = Object.create(null);
    let native = null;
    try {
      native = window.localStorage;
      const testKey = '__nutri_storage_test__';
      native.setItem(testKey, '1');
      native.removeItem(testKey);
    } catch (_) { native = null; }
    function own(k){ return Object.prototype.hasOwnProperty.call(memory, k); }
    return {
      available: () => !!native,
      getItem: (key) => {
        key = String(key);
        if (native) { try { return native.getItem(key); } catch (_) {} }
        return own(key) ? memory[key] : null;
      },
      setItem: (key, value) => {
        key = String(key); value = String(value);
        if (native) { try { native.setItem(key, value); return true; } catch (_) {} }
        memory[key] = value;
        return false;
      },
      removeItem: (key) => {
        key = String(key);
        if (native) { try { native.removeItem(key); return true; } catch (_) {} }
        delete memory[key];
        return false;
      }
    };
  })();
  window.SafeStorage = SafeStorage;

  const DAILY_NORMS_DEFAULT = {
    kcal: { value: 2000, unit: 'ккал', title: 'Калории' },
    protein_g: { value: 50, unit: 'г', title: 'Белки' },
    fat_g: { value: 70, unit: 'г', title: 'Жиры' },
    carbs_g: { value: 260, unit: 'г', title: 'Углеводы' },
    sugars_g: { value: 0, reference_value: 90, mode: 'informational', unit: 'г', title: 'Общие сахара' },
    fiber_g: { value: 30, unit: 'г', title: 'Клетчатка' },
    sfa_g: { value: 20, unit: 'г', title: 'Насыщенные жиры (чем меньше, тем лучше)' },
    unsat_g: { value: 0, reference_value: 50, mode: 'informational', unit: 'г', title: 'Ненасыщенные жиры' },
    salt_g: { value: 6, unit: 'г', title: 'Соль (чем меньше, тем лучше)' },
    sodium_mg: { value: Math.round(6*393), unit: 'мг', title: 'Натрий (чем меньше, тем лучше)' },
    added_sugars_g: { value: 50, unit: 'г', title: 'Добавленные сахара (чем меньше, тем лучше)' },
    calcium_mg: { value: 800, unit: 'мг', title: 'Кальций' },
    iron_mg: { value: 14, unit: 'мг', title: 'Железо' },
    magnesium_mg: { value: 375, unit: 'мг', title: 'Магний' },
    zinc_mg: { value: 10, unit: 'мг', title: 'Цинк' },
    potassium_mg: { value: 3500, unit: 'мг', title: 'Калий' },
    phosphorus_mg: { value: 700, unit: 'мг', title: 'Фосфор' },
    iodine_mcg: { value: 150, unit: 'мкг', title: 'Йод' },
    selenium_mcg: { value: 55, unit: 'мкг', title: 'Селен' },
    copper_mg: { value: 1, unit: 'мг', title: 'Медь' },
    manganese_mg: { value: 2, unit: 'мг', title: 'Марганец' },
    vitamin_c_mg: { value: 80, unit: 'мг', title: 'Витамин C' },
    vitamin_a_mcg: { value: 800, unit: 'мкг РЭ', title: 'Витамин A' },
    vitamin_d_mcg: { value: 5, unit: 'мкг', title: 'Витамин D' },
    vitamin_e_mg: { value: 12, unit: 'мг', title: 'Витамин E' },
    vitamin_k_mcg: { value: 75, unit: 'мкг', title: 'Витамин K' },
    vitamin_b1_mg: { value: 1.1, unit: 'мг', title: 'Витамин B1' },
    vitamin_b2_mg: { value: 1.4, unit: 'мг', title: 'Витамин B2' },
    vitamin_b3_mg: { value: 16, unit: 'мг', title: 'Витамин B3' },
    vitamin_b5_mg: { value: 6, unit: 'мг', title: 'Витамин B5' },
    vitamin_b6_mg: { value: 1.4, unit: 'мг', title: 'Витамин B6' },
    vitamin_b9_mcg: { value: 200, unit: 'мкг', title: 'Фолат (B9)' },
    vitamin_b12_mcg: { value: 2.5, unit: 'мкг', title: 'Витамин B12' },
    choline_mg: { value: 425, unit: 'мг', title: 'Холин' },
  };

  // Категории (HEI и «Каталог»)
  const HEI_RU = {
    vegetables: 'Овощи',
    fruits: 'Фрукты',
    fruits_berries: 'Фрукты и ягоды',
    dairy: 'Молочные',
    whole_grains: 'Цельные злаки',
    refined_grains: 'Рафинированные злаки',
    seafood_plant_protein: 'Морепродукты и растительные белки',
    protein_foods: 'Мясо, птица и яйца',
    other: 'Другое'
  };
  const CATALOG_RU = {
    // Raw category labels from product JSON. Keep these here so catalog headings never collapse to «Прочее».
    'Vegetables': 'Овощи',
    'Fruits': 'Фрукты и ягоды',
    'Dairy': 'Молочные продукты',
    'Meat': 'Мясо, птица и яйца',
    'Seafood': 'Рыба и морепродукты',
    'Seafood & Plant Protein': 'Рыба, морепродукты и растительные белки',
    'Whole Grains': 'Цельные злаки и крупы',
    'Refined Grains': 'Рафинированные злаки и выпечка',
    'Legumes, Nuts & Seeds': 'Бобовые, орехи и семена',
    'Oils & Fats': 'Масла и жиры',
    'Drinks': 'Напитки',
    'Sweets': 'Сладости и десерты',
    'Other': 'Другое',
    'Ready food / Culinary': 'Готовые блюда и кулинария',
    'Frozen / Semi-finished': 'Заморозка и полуфабрикаты',
    'Bakery / Grains / Breakfast': 'Хлеб, выпечка и завтраки',
    'Sports Protein': 'Спортивное питание',
    'Protein Drink': 'Белковые напитки',
    spices_sauces: 'Соусы и приправы',
    snacks_salty: 'Солёные снеки',
    sweets: 'Сладости и десерты',
    drinks: 'Напитки',
    oils_fats: 'Масла и жиры',
    saturated_fats: 'Источники насыщенных жиров',
    nuts_seeds: 'Орехи, семечки и бобовые',
    vegetables: 'Овощи',
    greens_leafy: 'Зелень',
    starchy_vegetables: 'Крахмалистые овощи',
    mushrooms: 'Грибы',
    allium_aromatic: 'Лук и пряные овощи',
    legume_vegetables: 'Бобовые и стручковые',
    root_vegetables: 'Корнеплоды',
    cruciferous_vegetables: 'Капустные овощи',
    fruits_berries: 'Фрукты и ягоды',
    grains_bakery: 'Крупы, хлеб и выпечка',
    bakery_breakfast: 'Хлеб, выпечка и завтраки',
    dairy: 'Молочные продукты',
    meat_eggs: 'Мясо, птица и яйца',
    seafood_plant: 'Рыба, морепродукты и растительные белки',
    ready_food: 'Готовые блюда',
    ready_fastfood: 'Готовые блюда',
    semi_finished: 'Заморозка и полуфабрикаты',
    sports_protein: 'Спортивное питание',
    protein_drinks: 'Белковые напитки',
    preserves_pickles: 'Консервы и соленья',
    other: 'Другое'
  };


  // Пользовательские подписи для технических ключей.
  // Внутренние значения category/hei_category_key не меняем, чтобы не ломать расчёты и тесты.
  function labelHEI(key) {
    const k = String(key || 'other');
    const mapped = (typeof MAP_BY_CATEGORY !== 'undefined' && MAP_BY_CATEGORY[k]) ||
                   (typeof MAP_BY_HEI !== 'undefined' && MAP_BY_HEI[k]) || '';
    return HEI_RU[k] || HEI_RU[mapped] || CATALOG_RU[mapped] || CATALOG_RU[k] || 'Другое';
  }
  function labelCatalog(key) {
    const k = String(key || 'other');
    const rawMapped = CATALOG_RU[k] || '';
    const mapped = (typeof MAP_BY_CATEGORY !== 'undefined' && MAP_BY_CATEGORY[k]) ||
                   (typeof MAP_BY_HEI !== 'undefined' && MAP_BY_HEI[k]) || '';
    return rawMapped || CATALOG_RU[mapped] || HEI_RU[k] || HEI_RU[mapped] || 'Другое';
  }
  function labelGroup(key, mode) {
    return mode === 'hei' ? labelHEI(key) : labelCatalog(key);
  }
  if (typeof window !== 'undefined') {
    window.UI_RU_LABELS = { HEI_RU, CATALOG_RU, labelHEI, labelCatalog, labelGroup };
    window.labelHEI = labelHEI;
    window.labelCatalog = labelCatalog;
    window.labelGroup = labelGroup;
    window.isSaturatedFatRouteProduct = isSaturatedFatRouteProduct;
  }

  // Лимитеры, per100-поля
  const KNOWN_PER100 = new Set(['kcal','sfa','unsat','salt','added_sugar']);
  const SCALE_SUFFIX = '_per_100g';
  const LIMITERS = new Set(['added_sugars_g','sfa_g','sodium_mg','salt_g']);
  const INFORMATIONAL_METRICS = new Set(['sugars_g','unsat_g']);
  const METRIC_LABELS = Object.freeze({
    kcal:'Энергия', protein_g:'Белки', fat_g:'Жиры', carbs_g:'Углеводы', sugars_g:'Общие сахара',
    fiber_g:'Клетчатка', sfa_g:'Насыщенные жиры', unsat_g:'Ненасыщенные жиры', salt_g:'Соль',
    sodium_mg:'Натрий', added_sugars_g:'Добавленные сахара', calcium_mg:'Кальций', iron_mg:'Железо',
    magnesium_mg:'Магний', zinc_mg:'Цинк', potassium_mg:'Калий', phosphorus_mg:'Фосфор', iodine_mcg:'Йод',
    selenium_mcg:'Селен', copper_mg:'Медь', manganese_mg:'Марганец', vitamin_c_mg:'Витамин C',
    vitamin_a_mcg:'Витамин A', vitamin_d_mcg:'Витамин D', vitamin_e_mg:'Витамин E', vitamin_k_mcg:'Витамин K',
    vitamin_b1_mg:'Витамин B1', vitamin_b2_mg:'Витамин B2', vitamin_b3_mg:'Витамин B3', vitamin_b5_mg:'Витамин B5',
    vitamin_b6_mg:'Витамин B6', vitamin_b9_mcg:'Фолат (B9)', vitamin_b12_mcg:'Витамин B12', choline_mg:'Холин'
  });
  function metricMode(key){
    key = String(key || '');
    if (INFORMATIONAL_METRICS.has(key)) return 'informational';
    if (LIMITERS.has(key)) return 'upper_limit';
    return 'adequacy';
  }
  function metricDefinition(key, normOverride){
    key = String(key || '');
    const norm = normOverride || (typeof window !== 'undefined' && window.norms && window.norms.values && window.norms.values[key]) || DAILY_NORMS_DEFAULT[key] || null;
    const mode = (norm && norm.mode) || metricMode(key);
    const target = mode === 'informational' ? 0 : Math.max(0, Number(norm && norm.value) || 0);
    const referenceValue = Math.max(0, Number(norm && (norm.reference_value != null ? norm.reference_value : norm.referenceValue)) || 0);
    return Object.freeze({
      key:key, mode:mode, title:(norm && norm.title) || METRIC_LABELS[key] || key, unit:(norm && norm.unit) || '',
      target:target, referenceValue:referenceValue,
      comparison:mode === 'upper_limit' ? 'maximum' : (mode === 'adequacy' ? 'minimum_or_target' : 'none')
    });
  }

  // Справочник микронорм (US/EU)
  const MICRO_LIMITS = {
    vitamin_c_mg:{title:'Витамин C',unit:'мг',min:{us:{type:'RDA',value:90},eu:{type:'PRI',value:110}},ul:{us:{value:2000,scope:'total'},eu:null},note:'В ЕС UL не установлен; ориентир достаточности зависит от пола.',risk:'Высокие дозы могут вызывать диарею и спазмы.'},
    vitamin_a_mcg:{title:'Витамин A',unit:'мкг РЭ',min:{us:{type:'RDA',value:900},eu:{type:'PRI',value:750}},ul:{us:{value:3000,scope:'retinol_only'},eu:{value:3000,scope:'retinol_only'}},note:'UL относится к готовому витамину A (ретинолу), а не к пищевому β-каротину.',risk:'Избыток ретинола связан с гепатотоксичностью и тератогенным риском.'},
    vitamin_d_mcg:{title:'Витамин D',unit:'мкг',min:{us:{type:'RDA',value:15},eu:{type:'AI',value:15}},ul:{us:{value:100,scope:'total'},eu:{value:100,scope:'total'}},note:'1 мкг = 40 МЕ. Значения предполагают минимальное образование витамина D в коже.',risk:'Избыток может вызвать гиперкальциемию.'},
    vitamin_e_mg:{title:'Витамин E',unit:'мг',min:{us:{type:'RDA',value:15},eu:{type:'AI',value:13}},ul:{us:{value:1000,scope:'supplemental_synthetic'},eu:{value:300,scope:'total'}},note:'В США UL относится к синтетическим формам из добавок и обогащённых продуктов.',risk:'Высокие дозы могут повышать риск кровотечения.'},
    vitamin_k_mcg:{title:'Витамин K',unit:'мкг',min:{us:{type:'AI',value:120},eu:{type:'AI',value:70}},ul:null,note:'UL не установлен; при терапии антагонистами витамина K важна стабильность потребления.',risk:'—'},
    vitamin_b1_mg:{title:'Витамин B1',unit:'мг',min:{us:{type:'RDA',value:1.2},eu:{type:'AR*',value:1.1}},ul:null,note:'В EFSA потребность энергозависима; показано расчётное взрослое приближение.',risk:'—'},
    vitamin_b2_mg:{title:'Витамин B2',unit:'мг',min:{us:{type:'RDA',value:1.3},eu:{type:'PRI',value:1.6}},ul:null,note:'UL не установлен.',risk:'—'},
    vitamin_b3_mg:{title:'Витамин B3 (ниацин, NE)',unit:'мг',min:{us:{type:'RDA',value:16},eu:{type:'PRI*',value:16}},ul:{us:{value:35,scope:'supplemental_synthetic'},eu:{value:10,scope:'nicotinic_acid_only'}},note:'В EFSA потребность энергозависима; UL зависит от формы ниацина.',risk:'Никотиновая кислота может вызывать приливы; высокие дозы — гепатотоксичность.'},
    vitamin_b5_mg:{title:'Витамин B5',unit:'мг',min:{us:{type:'AI',value:5},eu:{type:'AI',value:5}},ul:null,note:'UL не установлен.',risk:'—'},
    vitamin_b6_mg:{title:'Витамин B6',unit:'мг',min:{us:{type:'RDA',value:1.3},eu:{type:'PRI',value:1.7}},ul:{us:{value:100,scope:'total'},eu:{value:12,scope:'total'}},note:'EFSA установила UL 12 мг/сут для взрослых.',risk:'Хронический избыток может вызвать периферическую нейропатию.'},
    vitamin_b9_mcg:{title:'Фолат (B9)',unit:'мкг DFE',min:{us:{type:'RDA',value:400},eu:{type:'PRI',value:330}},ul:{us:{value:1000,scope:'synthetic_only'},eu:{value:1000,scope:'synthetic_only'}},note:'UL относится к фолиевой кислоте из добавок и фортификации, а не к естественному пищевому фолату.',risk:'Избыток фолиевой кислоты может маскировать дефицит B12.'},
    vitamin_b12_mcg:{title:'Витамин B12',unit:'мкг',min:{us:{type:'RDA',value:2.4},eu:{type:'AI',value:4}},ul:null,note:'UL не установлен.',risk:'—'},
    calcium_mg:{title:'Кальций',unit:'мг',min:{us:{type:'RDA',value:1000},eu:{type:'PRI',value:950}},ul:{us:{value:2500,scope:'total'},eu:{value:2500,scope:'total'}},note:'В США значение зависит от пола и возраста; в EFSA 18–24 года — 1000 мг, с 25 лет — 950 мг.',risk:'Избыток может повышать риск гиперкальциемии и камнеобразования.'},
    iron_mg:{title:'Железо',unit:'мг',min:{us:{type:'RDA',value:8},eu:{type:'PRI',value:11}},ul:{us:{value:45,scope:'total'},eu:null},safe:{eu:{value:40,scope:'total',label:'безопасный уровень'}},note:'В ЕС UL не установлен; 40 мг/сут — безопасный уровень, а не верхняя граница.',risk:'Избыток может вызывать ЖКТ-побочные эффекты и перегрузку железом.'},
    magnesium_mg:{title:'Магний',unit:'мг',min:{us:{type:'RDA',value:400},eu:{type:'AI',value:350}},ul:{us:{value:350,scope:'supplements_only'},eu:{value:250,scope:'supplements_only'}},note:'Оба UL относятся к добавкам/фармакологическим формам и не включают магний обычной пищи.',risk:'Избыток из добавок часто вызывает диарею.'},
    zinc_mg:{title:'Цинк',unit:'мг',min:{us:{type:'RDA',value:11},eu:{type:'PRI†',value:9.4}},ul:{us:{value:40,scope:'total'},eu:{value:25,scope:'total'}},note:'† EFSA задаёт PRI в зависимости от фитата; показан вариант для низкого содержания фитата.',risk:'Хронический избыток может вызвать дефицит меди.'},
    potassium_mg:{title:'Калий',unit:'мг',min:{us:{type:'AI',value:3400},eu:{type:'AI',value:3500}},ul:null,note:'UL для здорового населения не установлен; при ХБП и некоторых лекарствах нужен врачебный контроль.',risk:'При нарушении выведения возможна гиперкалиемия.'},
    phosphorus_mg:{title:'Фосфор',unit:'мг',min:{us:{type:'RDA',value:700},eu:{type:'AI',value:550}},ul:{us:{value:4000,scope:'total'},eu:null},note:'EFSA не располагает достаточными данными для UL.',risk:'Особенно важен контроль при ХБП.'},
    iodine_mcg:{title:'Йод',unit:'мкг',min:{us:{type:'RDA',value:150},eu:{type:'AI',value:150}},ul:{us:{value:1100,scope:'total'},eu:{value:600,scope:'total'}},note:'Беременность и лактация требуют отдельного жизненного профиля.',risk:'Избыток может нарушать функцию щитовидной железы.'},
    selenium_mcg:{title:'Селен',unit:'мкг',min:{us:{type:'RDA',value:55},eu:{type:'AI',value:70}},ul:{us:{value:400,scope:'total'},eu:{value:255,scope:'total'}},note:'EFSA пересмотрела UL до 255 мкг/сут для взрослых.',risk:'Селеноз может проявляться ломкостью волос и ногтей и другими симптомами.'},
    copper_mg:{title:'Медь',unit:'мг',min:{us:{type:'RDA',value:0.9},eu:{type:'AI',value:1.6}},ul:{us:{value:10,scope:'total'},eu:{value:5,scope:'total'}},note:'В EFSA AI различается по полу.',risk:'Избыток может вызывать гастро- и гепатотоксичность.'},
    manganese_mg:{title:'Марганец',unit:'мг',min:{us:{type:'AI',value:2.3},eu:{type:'AI',value:3}},ul:{us:{value:11,scope:'total'},eu:null},safe:{eu:{value:8,scope:'total',label:'безопасный уровень'}},note:'EFSA не установила UL; 8 мг/сут — безопасный уровень для взрослых.',risk:'Хронический избыток может быть нейротоксичным.'},
    choline_mg:{title:'Холин',unit:'мг',min:{us:{type:'AI',value:550},eu:{type:'AI',value:400}},ul:{us:{value:3500,scope:'total'},eu:null},note:'Для ЕС UL не установлен.',risk:'Высокие дозы могут вызывать запах, гипотензию и ЖКТ-симптомы.'}
  };

  var __childAgeNormCache = null;
  function currentNormDemographic(){
    var ageEl=document.getElementById('needs_age'), sexEl=document.getElementById('needs_sex');
    var age=ageEl && ageEl.value!=='' ? Number(ageEl.value) : NaN;
    var raw=String(sexEl ? sexEl.value : 'male').toLowerCase();
    var sex=(raw.indexOf('female')>=0||raw.indexOf('жен')>=0||raw==='ж')?'female':'male';
    return {age:age,sex:sex};
  }
  function childAgeNorm(key,age,sex){
    if(!Number.isFinite(age)||age<1||age>=18)return null;
    if(!__childAgeNormCache){
      try{__childAgeNormCache=JSON.parse((document.getElementById('age_rda_table')||{}).textContent||'[]');}catch(_){__childAgeNormCache=[];}
    }
    var row=__childAgeNormCache.find(function(r){return age>=r.age_min&&age<=r.age_max&&r.sex===sex;})||__childAgeNormCache.find(function(r){return age>=r.age_min&&age<=r.age_max&&r.sex==='any';});
    var n=row&&row.norms&&row.norms[key];
    return n?{min:{type:'Норма РФ',value:Number(n.value)},ul:null,safe:null,basis:n.basis||'МР 2.3.1.0253-21',profile:row.group+(row.sex==='male'?' · мальчики':row.sex==='female'?' · девочки':'')}: {min:null,ul:null,safe:null,basis:'детский профиль РФ',profile:(row&&row.group)||'до 18 лет',note:'Для этого нутриента отдельный детский ориентир в таблице калькулятора не задан.'};
  }
  function resolveAdultRegionalMicro(key,region,age,sex){
    var female=sex==='female', a=Number.isFinite(age)?age:30, older=a>=51;
    var min=null, ul=null, safe=null, note='', basis=region==='eu'?'EFSA DRV':'США/Канада DRI';
    if(region==='us'){
      var usMin={
        vitamin_c_mg:['RDA',female?75:90], vitamin_a_mcg:['RDA',female?700:900], vitamin_d_mcg:['RDA',a>=71?20:15], vitamin_e_mg:['RDA',15], vitamin_k_mcg:['AI',female?90:120],
        vitamin_b1_mg:['RDA',female?1.1:1.2], vitamin_b2_mg:['RDA',female?1.1:1.3], vitamin_b3_mg:['RDA',female?14:16], vitamin_b5_mg:['AI',5],
        vitamin_b6_mg:['RDA',a>=51?(female?1.5:1.7):1.3], vitamin_b9_mcg:['RDA',400], vitamin_b12_mcg:['RDA',2.4],
        calcium_mg:['RDA',(female&&a>=51)||(!female&&a>=71)?1200:1000], iron_mg:['RDA',female&&a<=50?18:8],
        magnesium_mg:['RDA',female?(a<=30?310:320):(a<=30?400:420)], zinc_mg:['RDA',female?8:11], potassium_mg:['AI',female?2600:3400],
        phosphorus_mg:['RDA',700], iodine_mcg:['RDA',150], selenium_mcg:['RDA',55], copper_mg:['RDA',0.9], manganese_mg:['AI',female?1.8:2.3], choline_mg:['AI',female?425:550]
      };
      if(usMin[key])min={type:usMin[key][0],value:usMin[key][1]};
      var usUl={vitamin_c_mg:[2000,'total'],vitamin_a_mcg:[3000,'retinol_only'],vitamin_d_mcg:[100,'total'],vitamin_e_mg:[1000,'supplemental_synthetic'],vitamin_b3_mg:[35,'supplemental_synthetic'],vitamin_b6_mg:[100,'total'],vitamin_b9_mcg:[1000,'synthetic_only'],calcium_mg:[a>=51?2000:2500,'total'],iron_mg:[45,'total'],magnesium_mg:[350,'supplements_only'],zinc_mg:[40,'total'],phosphorus_mg:[a>=71?3000:4000,'total'],iodine_mcg:[1100,'total'],selenium_mcg:[400,'total'],copper_mg:[10,'total'],manganese_mg:[11,'total'],choline_mg:[3500,'total']};
      if(usUl[key])ul={value:usUl[key][0],scope:usUl[key][1]};
    }else{
      var euMin={
        vitamin_c_mg:['PRI',female?95:110], vitamin_a_mcg:['PRI',female?650:750], vitamin_d_mcg:['AI',15], vitamin_e_mg:['AI',female?11:13], vitamin_k_mcg:['AI',70],
        vitamin_b1_mg:['AR*',female?0.9:1.1], vitamin_b2_mg:['PRI',1.6], vitamin_b3_mg:['PRI*',female?14:16], vitamin_b5_mg:['AI',5],
        vitamin_b6_mg:['PRI',female?1.6:1.7], vitamin_b9_mcg:['PRI',330], vitamin_b12_mcg:['AI',4], calcium_mg:['PRI',a<25?1000:950],
        iron_mg:['PRI',female&&a<=50?16:11], magnesium_mg:['AI',female?300:350], zinc_mg:['PRI†',female?7.5:9.4], potassium_mg:['AI',3500],
        phosphorus_mg:['AI',550], iodine_mcg:['AI',150], selenium_mcg:['AI',70], copper_mg:['AI',female?1.3:1.6], manganese_mg:['AI',3], choline_mg:['AI',400]
      };
      if(euMin[key])min={type:euMin[key][0],value:euMin[key][1]};
      var euUl={vitamin_a_mcg:[3000,'retinol_only'],vitamin_d_mcg:[100,'total'],vitamin_e_mg:[300,'total'],vitamin_b3_mg:[10,'nicotinic_acid_only'],vitamin_b6_mg:[12,'total'],vitamin_b9_mcg:[1000,'synthetic_only'],calcium_mg:[2500,'total'],magnesium_mg:[250,'supplements_only'],zinc_mg:[25,'total'],iodine_mcg:[600,'total'],selenium_mcg:[255,'total'],copper_mg:[5,'total']};
      if(euUl[key])ul={value:euUl[key][0],scope:euUl[key][1]};
      if(key==='iron_mg')safe={value:40,scope:'total',label:'безопасный уровень'};
      if(key==='manganese_mg')safe={value:8,scope:'total',label:'безопасный уровень'};
      if(key==='zinc_mg')note='EFSA связывает PRI с фитатом; показано значение для низкофитатного рациона.';
      if(key==='vitamin_b1_mg'||key==='vitamin_b3_mg')note='EFSA задаёт энергозависимый ориентир; показано взрослое расчётное приближение.';
    }
    return {min:min,ul:ul,safe:safe,basis:basis,profile:(region==='eu'?'ЕС · EFSA':'США · DRI')+' · '+(female?'женщина':'мужчина')+' · '+(Number.isFinite(age)?Math.round(age)+' лет':'взрослый 19–50, возраст не указан'),note:note};
  }
  function resolveRegionalMicroLimits(key,region,age,sex){
    var child=childAgeNorm(key,age,sex); if(child)return child;
    return resolveAdultRegionalMicro(key,region,age,sex);
  }
  window.__resolveMicroLimitsForQA=resolveRegionalMicroLimits;

  // --- Helpers ---
  function canonicalizeKey(k) {
    if (k === 'selenium_ug') return 'selenium_mcg';
    if (k === 'added_sugar') return 'added_sugars_g';
    if (k === 'salt') return 'salt_g';
    if (k === 'sfa') return 'sfa_g';
    if (k === 'unsat') return 'unsat_g';
    if (k === 'kcal') return 'kcal';
    return k;
  }
  function normalizeMacroName(base) {
    if (base === 'protein') return 'protein_g';
    if (base === 'fat') return 'fat_g';
    if (base === 'carbs') return 'carbs_g';
    if (base === 'sugar') return 'sugars_g';
    if (base === 'fiber') return 'fiber_g';
    return base;
  }
  function titleRu(k) {
    const m = {
      protein_g:'Белки', fat_g:'Жиры', carbs_g:'Углеводы', sugars_g:'Сахара', fiber_g:'Клетчатка',
      kcal:'Калории', sfa_g:'Насыщенные жиры (чем меньше, тем лучше)', unsat_g:'Ненасыщенные жиры',
      salt_g:'Соль (чем меньше, тем лучше)', sodium_mg:'Натрий (чем меньше, тем лучше)',
      added_sugars_g:'Добавленные сахара (чем меньше, тем лучше)',
      calcium_mg:'Кальций', iron_mg:'Железо', magnesium_mg:'Магний', zinc_mg:'Цинк', potassium_mg:'Калий',
      phosphorus_mg:'Фосфор', iodine_mcg:'Йод', selenium_mcg:'Селен', copper_mg:'Медь', manganese_mg:'Марганец',
      vitamin_c_mg:'Витамин C', vitamin_a_mcg:'Витамин A', vitamin_d_mcg:'Витамин D', vitamin_e_mg:'Витамин E',
      vitamin_k_mcg:'Витамин K', vitamin_b1_mg:'Витамин B1', vitamin_b2_mg:'Витамин B2', vitamin_b3_mg:'Витамин B3',
      vitamin_b5_mg:'Витамин B5', vitamin_b6_mg:'Витамин B6', vitamin_b9_mcg:'Фолат (B9)', vitamin_b12_mcg:'Витамин B12',
      choline_mg:'Холин'
    };
    return m[k] || k;
  }
  function unitOf(k) {
    const lim = ACTIVE_NUTRIENT_LIMITS[k];
    if (lim && lim.unit) return lim.unit;
    if (k === 'kcal') return 'ккал';
    if (k.endsWith('_mcg')) return 'мкг';
    if (k.endsWith('_mg')) return 'мг';
    if (k.endsWith('_g')) return 'г';
    return '';
  }
  function groupOf(k) {
    if (k.startsWith('vitamin_')) return 'vitamins';
    const minerals = new Set(['calcium_mg','iron_mg','magnesium_mg','zinc_mg','potassium_mg','phosphorus_mg','iodine_mcg','selenium_mcg','copper_mg','manganese_mg','sodium_mg']);
    if (minerals.has(k)) return 'minerals';
    if (k === 'choline_mg') return 'other';
    return 'other';
  }
  
// === Catalog classification: strategy v2 (DB-first, robust) ===
// === Catalog classification: strategy v2 (DB-first, robust) ===
const MAP_BY_CATEGORY = {
  "Vegetables": "vegetables",
  "Fruits": "fruits_berries",
  "Dairy": "dairy",
  "Meat": "meat_eggs",
  "Seafood": "seafood_plant",
  "Seafood & Plant Protein": "seafood_plant",
  "Whole Grains": "grains_bakery",
  "Refined Grains": "grains_bakery",
  "Legumes, Nuts & Seeds": "nuts_seeds",
  "Oils & Fats": "oils_fats",
  "Drinks": "drinks",
  "Sweets": "sweets",
  "Other": "other",
  "Ready food / Culinary": "ready_food",
  "Frozen / Semi-finished": "semi_finished",
  "Bakery / Grains / Breakfast": "bakery_breakfast",
  "Sports Protein": "sports_protein",
  "Protein Drink": "protein_drinks"
};

const MAP_BY_HEI = {
  "vegetables": "vegetables",
  "fruits": "fruits_berries",
  "dairy": "dairy",
  "protein_foods": "meat_eggs",
  "seafood_plant_protein": "seafood_plant",
  "whole_grains": "grains_bakery",
  "refined_grains": "grains_bakery",
  "oils_fats": "oils_fats",
  "beverages": "drinks",
  "sweets": "sweets",
  "other": "other"
};

const NAME_RULES = [
  { test: /(капуст|броккол|цветн|пекинск|ромэн|латук|листов(ой|ые)|кейл|мангольд|шпинат|эндив|радиккьо|кресс|пак[-\s]?чой|бак[-\s]?чой|чой)/i, cat: "vegetables" },
  { test: /(морков|св[её]кл|буряк|пастернак|брюкв|реп[аы]|топинамбур|редис|редьк|сельдере(й|я) корнев|фенхел|чайот)/i, cat: "vegetables" },
  { test: /(кабач|цукин|патиссон|тыкв|огурц|томат|помидор|баклажан|перец|стручковый перец)/i, cat: "vegetables" },
  { test: /(эдамаме|сахарн(ый|ые) горох|стручков(ый|ые) горох|молодой горошек)/i, cat: "vegetables" },
  { test: /(шампиньон|в[её]шенн|вешанк|шиитак|лисичк|б[её]лив|волнуш|подбер[её]зов|подосинов|маслят|опят|гриб)/i, cat: "vegetables" },
  { test: /(квашен|маринован|сол[её]н)/i, cat: "preserves_pickles" },
  { test: /(масло|гх[и]|топл[её]н|жир)/i, cat: "oils_fats" },
  { test: /(сок|компот|напиток|чай|кофе|какао|лимонад|морс|квас)/i, cat: "drinks" },
  { test: /(фастфуд|бургер|пицц|ролл|шаурм|готов(ое|ые|ый)|полуфабрикат)/i, cat: "ready_fastfood" }
];

const CATALOG_OVERRIDES = {
  // v4.6.4: пользовательская таксономия каталога. Это только визуальная/поисковая группа, не нутриенты.
  green_onion_raw: "greens_leafy",
  basil_raw: "greens_leafy",
  cilantro_raw: "greens_leafy",
  parsley_leaf_raw: "greens_leafy",
  dill_raw: "greens_leafy"
};

function productTagsArray(product) {
  const raw = product && product.tags;
  if (Array.isArray(raw)) return raw.map(t => String(t).toLowerCase());
  if (typeof raw === 'string') return raw.split('|').map(t => t.trim().toLowerCase()).filter(Boolean);
  return [];
}
function catalogNameText(product) {
  return String(((product && (product.name_ru || product.name || product.key)) || '')).toLowerCase();
}

// v5.3.75: единый защитный предикат для молочных жиров и других явных источников насыщенных жиров.
// Это пользовательский/аналитический маршрут: HEI-dairy credit не даётся, но sfa остаётся в нутриентных лимитерах.
function isSaturatedFatRouteProduct(product) {
  const tags = productTagsArray(product);
  const name = catalogNameText(product);
  const catalog = String((product && product.catalog_category_key) || '').toLowerCase();
  const fatQuality = String((product && product.fat_quality_class) || '').toLowerCase();
  const limitGroup = String((product && product.limit_group_key) || '').toLowerCase();
  if (catalog === 'saturated_fats' || fatQuality === 'saturated_fat_source' || limitGroup === 'saturated_fats') return true;
  if (tags.includes('saturated_fat_source') || tags.includes('limit_saturated_fat')) return true;
  const excluded = /морожен|ice\s*cream|чипс|chips|соус|sauce|nut\s*butter|seed\s*butter|peanut\s*butter|almond\s*butter|орехов[а-я\s]*паст|арахисов[а-я\s]*паст|миндальн[а-я\s]*паст|паста\s+из\s+тыквен/.test(name);
  const dairyFatName = /масло\s+сливочн|сливочн[а-я\s]*масло|топл[её]н[а-я\s]*масло|(^|[^a-zа-яё])гхи([^a-zа-яё]|$)|(^|[^a-z])ghee([^a-z]|$)|(^|[^a-z])butter([^a-z]|$)|сливки|сметан|sour\s*cream|heavy\s*cream|whipping\s*cream|light\s*cream|cream\s*cheese|крем[-\s]?чиз|сыр\s*творож|маскарпоне|mascarpone/.test(name);
  return dairyFatName && !excluded;
}
function isSoyProteinWithHeiCredit(product) {
  const tags = productTagsArray(product);
  const name = catalogNameText(product);
  const hei = String((product && product.hei_category_key) || '').toLowerCase();
  const pEq = Number((product && product.protein_oz_eq_per_100g) || 0);
  const spEq = Number((product && product.seafood_plant_oz_eq_per_100g) || 0);
  return hei === 'seafood_plant_protein' && (pEq > 0 || spEq > 0) &&
    (tags.includes('hei_soy_protein_credit') || tags.includes('soy_protein_isolate') ||
     ((tags.includes('soy') || /соев|soy/.test(name)) && /протеин|изолят|концентрат|protein|isolate|concentrate/.test(name)));
}
function isProteinSupplementRouteProduct(product) {
  if (isSoyProteinWithHeiCredit(product)) return false;
  const tags = productTagsArray(product);
  const name = catalogNameText(product);
  const catalog = String((product && product.catalog_category_key) || '').toLowerCase();
  if (catalog === 'protein_supplements') return true;
  if (tags.includes('protein_supplement') || tags.includes('sports_protein') || tags.includes('no_hei_protein_food_credit')) return true;
  return /сывороточн[а-я\s]*протеин|казеин|коллаген|говяж[а-я\s]*протеин|гейнер|whey|casein|collagen|beef\s*protein|protein\s*powder|mass\s*gainer|(^|[^a-z])bcaa([^a-z]|$)|(^|[^a-z])isolate([^a-z]|$)/i.test(name);
}
function classifySpecialCatalog(product) {
  const key = String((product && product.key) || '');
  if (CATALOG_OVERRIDES[key]) return CATALOG_OVERRIDES[key];

  const tags = productTagsArray(product);
  const name = catalogNameText(product);
  const category = String((product && product.category) || '');
  const state = String((product && product.state) || '').toLowerCase();

  // v4.6.5: сначала убираем явные пользовательские категории, которые старые raw category/state
  // показывали слишком грубо: масла, напитки, соусы, сладости, снеки. Это только слой каталога.
  if (category === 'Protein Drink') return 'protein_drinks';
  if (category === 'Sports Protein') return 'sports_protein';
  const isVegLike = category === 'Vegetables' || (!category && String((product && product.hei_category_key) || '') === 'vegetables');
  if (isVegLike) {
    if (tags.includes('herbs') || tags.includes('leafy') || /зелень|листов|шпинат|руккол|салат|латук|кейл|мангольд|кресс|мизуна|щавел|кинза|петрушк|укроп|базилик|лук зел[её]н/i.test(name)) return 'greens_leafy';
    if (tags.includes('starchy-veg') || /картоф|батат|кукуруз/i.test(name)) return 'starchy_vegetables';
    if (tags.includes('fungi') || /гриб|шампиньон|в[её]шен|шиитак|эноки|белые/i.test(name)) return 'mushrooms';
    if (tags.includes('legumes') || /горошек|горох сахарн|фасоль стручков|эдамаме/i.test(name)) return 'legume_vegetables';
    if (/лук|чеснок|имбир|хрен|порей/i.test(name)) return 'allium_aromatic';
    if (tags.includes('root') || /морков|св[её]кл|редис|редьк|реп[аы]|брюкв|дайкон|пастернак|топинамбур/i.test(name)) return 'root_vegetables';
    if (tags.includes('brassica') || /капуст|броккол|кольраби/i.test(name)) return 'cruciferous_vegetables';
    return '';
  }

  if (isSaturatedFatRouteProduct(product)) return 'saturated_fats';

  if (tags.includes('salty_snack') || /чипс|попкорн|картофел[ья]\s+фри/.test(name)) return 'snacks_salty';

  if (/блинчики|блины с |пельмен|вареник|хинкал|чебурек|манты|наггетс|пицц.*заморож|заморож.*(блинчики|блины|пельмен|вареник|хинкал|чебурек|манты|наггетс|пицц)|полуфабрикат/.test(name)) {
    return 'semi_finished';
  }

  if (tags.includes('ready_food') || category === 'Ready food / Culinary') return 'ready_food';
  if (tags.includes('prepared') && /фалафель|лапша быстрого приготовления|готов/.test(name)) return 'ready_food';

  if (tags.some(t => ['condiment','sauce','spice','seasoning'].includes(t)) ||
      /соус|кетчуп|майонез|горчиц|уксус|(?:^|\s)соль(?:\s|$|[(),])|песто|томатн(ая|ую) паст|срирач|терияки|барбекю|тахини\s*\(/.test(name)) {
    return 'spices_sauces';
  }

  if ((category === 'Other' || tags.includes('plant_drink') || state === 'ready_to_drink' || state === 'brewed' || state === 'liquid') &&
      (tags.some(t => ['beverage','drink','plant_drink'].includes(t)) || /напиток|квас|кола|чай|кофе|какао|морс|лимонад|изотоник|энергетическ/.test(name))) {
    return 'drinks';
  }

  if ((category === 'Other' || category === 'Dairy' || category === '') &&
      (tags.some(t => ['oil_fat','oil','butter','margarine'].includes(t)) || /^(гхи|масло\s+(сливочное|оливковое|подсолнечное|рапсовое)|маргарин)/.test(name))) {
    return 'oils_fats';
  }

  if ((category === 'Other' || category === '') && (tags.includes('pickled') || tags.includes('fermented') || /квашен|маринован|сол[её]н/.test(name))) return 'preserves_pickles';

  if (tags.includes('fruit_snack') || /смоква яблочн/.test(name)) return 'fruits_berries';

  const isExplicitlyUnsweetened = tags.includes('no_sugar') ||
    /без\s+(?:добавленн(?:ого|ых)\s+)?сахар(?:а|ов)?/.test(name);
  if (!isExplicitlyUnsweetened && (tags.some(t => ['sweet','dessert','confectionery','sweetener'].includes(t)) ||
      /вафл|шоколад|десерт|зефир|пастил|карамел|желе|(^|\s)морожен|сахар|м[её]д|сироп|варень|сгущ[её]н|сырок творожн/.test(name))) {
    return 'sweets';
  }

  return '';
}

const CatalogDiag = { otherCount: 0, unknowns: [] };

function classifyCatalog(product) {
  try {
    if (product.catalog_category_key && typeof product.catalog_category_key === "string") {
      return product.catalog_category_key;
    }
    const key = (product.key || "").toString();
    const special = classifySpecialCatalog(product);
    if (special) return special;

    const st = (product.state || "").toLowerCase();
    if (st === "pickled" || st === "fermented") return "preserves_pickles";
    if (st === "oil" || st === "butter") return "oils_fats";
    if (st === "fastfood") return "ready_fastfood";

    const cat = (product.category || "").trim();
    if (MAP_BY_CATEGORY[cat]) return MAP_BY_CATEGORY[cat];

    const hei = (product.hei_category_key || "").trim().toLowerCase();
    if (MAP_BY_HEI[hei]) return MAP_BY_HEI[hei];

    const tags = productTagsArray(product);
    if (tags.includes("pickled") || tags.includes("fermented")) return "preserves_pickles";
    if (tags.includes("oil") || tags.includes("butter")) return "oils_fats";
    if (tags.some(t => ["vegetables","leafy","root","brassica","starchy-veg","legume-veg","fungi"].includes(t))) return "vegetables";
    if (tags.includes("drink")) return "drinks";
    if (tags.some(t => ["nuts","seeds","legume"].includes(t))) return "nuts_seeds";

    const name = ((product.name_ru || product.name || "")).toString().toLowerCase();
    for (const rule of NAME_RULES) {
      if (rule.test.test(name)) return rule.cat;
    }
    CatalogDiag.otherCount++;
    CatalogDiag.unknowns.push({ key, name_ru: product.name_ru || "", cat, hei, st, tags });
    return "other";
  } catch (e) {
    CatalogDiag.otherCount++;
    CatalogDiag.unknowns.push({ key: product?.key || "", error: String(e) });
    return "other";
  }
}

// === DB indices & catalog grouping (clean IIFE) ===
const DB = (() => {
  // 1) Read products from the async bootstrap when available.
  // v5.2.23 avoids the previous double JSON stringify/parse path.
  const bootstrapItems = Array.isArray(window.__PRODUCTS_ARRAY__) ? window.__PRODUCTS_ARRAY__ : null;
  const raw = bootstrapItems ? '' : ((document.getElementById('db') && document.getElementById('db').textContent.trim()) || '[]');
  const items = bootstrapItems || JSON.parse(raw);

  // 2) Compute catalog category once
  for (const o of items) {
    o.catalog_category_key = classifyCatalog(o);
  }

  // 3) Indices
  const byKey = new Map(items.map(o => [o.key, o]));
    const byCatHEI = new Map();
  const byCatCatalog = new Map();
for (const o of items) {
    const hei = o.hei_category_key || 'other';
    if (!byCatHEI.has(hei)) byCatHEI.set(hei, []);
    byCatHEI.get(hei).push(o);

    const cat = o.catalog_category_key || 'other';
    if (!byCatCatalog.has(cat)) byCatCatalog.set(cat, []);
    byCatCatalog.get(cat).push(o);
  }

  // 4) Sort inside groups by Russian name
  const byName = (a,b)=> (a.name_ru||'').localeCompare(b.name_ru||'');
  for (const arr of byCatHEI.values()) arr.sort(byName);
  for (const arr of byCatCatalog.values()) arr.sort(byName);

  return { items, byKey, byCatHEI, byCatCatalog };
})();
window.DB = DB;
try {
  window.__DB_READY_META__ = {
    version: 'v5.3.37_harvard_inline_plate_details',
    items: DB && Array.isArray(DB.items) ? DB.items.length : 0,
    byKey: DB && DB.byKey ? DB.byKey.size : 0,
    source: window.__PRODUCTS_META__ || null,
    search_selftest_molo: (DB && Array.isArray(DB.items)) ? DB.items.filter(function(p){
      var text = String((p && (p.name_ru || p.name || p.key)) || '').toLowerCase().replace(/ё/g,'е');
      return text.indexOf('моло') >= 0 || text.indexOf('milk') >= 0;
    }).length : 0
  };
} catch(_) {}


// === DB v1.2 safe helpers: validation and controlled upsert ===
window.upsertFood = function upsertFood(product){
  if (!product || !product.key || !window.DB || !Array.isArray(window.DB.items) || !window.DB.byKey) return null;
  let item = window.DB.byKey.get(product.key);
  if (item) {
    Object.assign(item, product);
  } else {
    item = Object.assign({}, product);
    window.DB.items.push(item);
    window.DB.byKey.set(item.key, item);
  }
  if (typeof classifyCatalog === 'function') item.catalog_category_key = classifyCatalog(item);

  // Rebuild category indexes after controlled insert/update to avoid stale group membership.
  window.DB.byCatHEI = new Map();
  window.DB.byCatCatalog = new Map();
  for (const o of window.DB.items) {
    const hei = o.hei_category_key || 'other';
    if (!window.DB.byCatHEI.has(hei)) window.DB.byCatHEI.set(hei, []);
    window.DB.byCatHEI.get(hei).push(o);
    const cat = o.catalog_category_key || 'other';
    if (!window.DB.byCatCatalog.has(cat)) window.DB.byCatCatalog.set(cat, []);
    window.DB.byCatCatalog.get(cat).push(o);
  }
  const byName = (a,b)=> (a.name_ru||'').localeCompare(b.name_ru||'', 'ru');
  for (const arr of window.DB.byCatHEI.values()) arr.sort(byName);
  for (const arr of window.DB.byCatCatalog.values()) arr.sort(byName);
  return item;
};

// v5.3.116: retain the historical prunes rescue only for truly incomplete legacy databases.
// The active chunked database already contains a complete, audited record and must remain authoritative.
try {
  const existingPrunes = window.DB && window.DB.byKey ? window.DB.byKey.get('prunes') : null;
  const existingProtein = Number(existingPrunes && (existingPrunes.protein_per_100g ?? existingPrunes.protein_g ?? existingPrunes.protein)) || 0;
  const existingFat = Number(existingPrunes && (existingPrunes.fat_per_100g ?? existingPrunes.fat_g ?? existingPrunes.fat)) || 0;
  const existingCarbs = Number(existingPrunes && (existingPrunes.carbs_per_100g ?? existingPrunes.carbohydrate_g ?? existingPrunes.carbs)) || 0;
  if (!existingPrunes || ((Number(existingPrunes.kcal)||0) > 20 && existingProtein === 0 && existingFat === 0 && existingCarbs === 0)) {
    window.upsertFood({
      key:'prunes', name:'Plums, dried (prunes), uncooked', name_ru:'Чернослив (сухофрукты)',
      category:'Fruits', hei_category_key:'fruits_berries', state:'dried',
      tags:['prunes','чернослив','сухофрукты','fruits','dried_fruit'],
      kcal:240, protein_per_100g:2.18, fat_per_100g:0.38, carbs_per_100g:63.88,
      sugar_per_100g:38.13, fiber_per_100g:7.1,
      sfa:0.088, unsat:0.176, added_sugar:0, sodium_mg:2, potassium_mg:732,
      source:'USDA FoodData Central / SR Legacy-style dried plums values',
      source_note:'Legacy rescue only: applied because the loaded record had zero macros.'
    });
  }
} catch(e) { console.warn('Prunes legacy rescue failed', e); }


window.validateFoodDb = function validateFoodDb(items){
  items = Array.isArray(items) ? items : (window.DB && Array.isArray(window.DB.items) ? window.DB.items : []);
  const critical = [];
  const warnings = [];
  const seen = new Set();
  const required = ['key','name_ru','category','hei_category_key'];
  const C = window.__HEIClassifiers || {};
  const norm = C.normalizeTag || (tag => String(tag || '').toLowerCase().trim());
  const tagsOfLocal = p => Array.isArray(p && p.tags) ? p.tags.map(norm) : [];
  const hasAnyLocal = (p, list) => {
    const tags = tagsOfLocal(p);
    return (list || []).map(norm).some(t => tags.includes(t));
  };
  const proteinClassifier = C.isProteinFood || (() => false);
  const sppClassifier = C.isSeafoodPlantProtein || (() => false);
  const legumeClassifier = C.isLegume || (() => false);

  for (const p of items){
    if (!p || typeof p !== 'object') { critical.push({ type:'bad-record', item:p }); continue; }
    for (const k of required){ if (!p[k]) warnings.push({ type:'missing-field', key:p.key || '', field:k }); }
    if (p.key){
      if (seen.has(p.key)) critical.push({ type:'duplicate-key', key:p.key });
      seen.add(p.key);
    } else {
      critical.push({ type:'missing-key', name_ru:p.name_ru || '' });
    }
    const kcal = Number(p.kcal) || 0;
    const protein = Number(p.protein_per_100g ?? p.protein_g ?? p.protein) || 0;
    const fat = Number(p.fat_per_100g ?? p.fat_g ?? p.fat) || 0;
    const carbs = Number(p.carbs_per_100g ?? p.carbohydrate_g ?? p.carb_g ?? p.carbs) || 0;
    const isPureFat = fat >= 95 && protein === 0 && carbs === 0;
    if (kcal > 20 && protein === 0 && fat === 0 && carbs === 0 && !isPureFat){
      critical.push({ type:'kcal-with-zero-macros', key:p.key, name_ru:p.name_ru || '', kcal:kcal });
    }
    if (kcal > 20 && (protein > 0 || fat > 0 || carbs > 0) && !p.kcal_macro_validation_exempt){
      const fiber = Number(p.fiber_per_100g ?? p.fiber_g ?? p.fiber) || 0;
      const candidates = [protein*4 + fat*9 + carbs*4];
      if (fiber > 0 && carbs >= fiber) {
        candidates.push(protein*4 + fat*9 + Math.max(0, carbs - fiber)*4);
        candidates.push(protein*4 + fat*9 + Math.max(0, carbs - fiber)*4 + fiber*2);
      }
      const estimated = candidates.reduce((best, x) => Math.abs(kcal - x) < Math.abs(kcal - best) ? x : best, candidates[0]);
      const rel = estimated > 0 ? Math.abs(kcal - estimated) / Math.max(kcal, estimated) : 0;
      if (rel > 0.40) warnings.push({ type:'kcal-macro-mismatch', key:p.key, kcal:kcal, estimated_kcal:Math.round(estimated), relative_delta:Number(rel.toFixed(2)) });
    }
    const name = String(p.name_ru || '').toLowerCase();
    if (/\bсыр(ой|ая|ое|ые)\b/i.test(name) && p.category === 'Dairy'){
      critical.push({ type:'raw-word-in-dairy-category', key:p.key, name_ru:p.name_ru || '' });
    }
    const tagsRaw = Array.isArray(p.tags) ? p.tags.map(x => String(x || '').toLowerCase().trim()) : [];
    for (const bad of ['fruit','vegetable','whole_grain','refined_grain','legume','fish','shellfish','nut','seed']){
      if (tagsRaw.includes(bad)) warnings.push({ type:'legacy-tag-normalized', key:p.key, tag:bad, normalized:norm(bad) });
    }
    const tagsNorm = tagsOfLocal(p);
    if ((p.category === 'Dairy' || p.hei_category_key === 'dairy') && !tagsNorm.some(t => ['dairy','cheese','milk','yogurt','kefir','curd','fermented','butter','ghee','cream'].includes(t))){
      warnings.push({ type:'dairy-without-specific-dairy-tag', key:p.key, tags:p.tags || [] });
    }
    if ((p.hei_category_key === 'protein_foods' || p.category === 'Meat') && !proteinClassifier(p)){
      critical.push({ type:'protein-classification-miss', key:p.key, name_ru:p.name_ru || '', hei_category_key:p.hei_category_key, category:p.category });
    }
    if ((p.hei_category_key === 'seafood_plant_protein' || p.category === 'Seafood & Plant Protein') && !sppClassifier(p)){
      critical.push({ type:'seafood-plant-classification-miss', key:p.key, name_ru:p.name_ru || '', hei_category_key:p.hei_category_key, category:p.category, tags:p.tags || [] });
    }
    if (hasAnyLocal(p, ['seafood','fish','shellfish','soy','tofu','natto','tempeh','nuts','seeds','nuts_seeds']) && !sppClassifier(p)){
      critical.push({ type:'spp-tag-classification-miss', key:p.key, name_ru:p.name_ru || '', tags:p.tags || [] });
    }
    if (hasAnyLocal(p, ['legumes','beans','peas','lentils','chickpeas']) && !legumeClassifier(p)){
      critical.push({ type:'legume-classification-miss', key:p.key, name_ru:p.name_ru || '', tags:p.tags || [] });
    }
    if (p.salt != null && p.sodium_mg != null){
      const expectedNa = Number(p.salt) * 393;
      const actualNa = Number(p.sodium_mg);
      if (Number.isFinite(expectedNa) && Number.isFinite(actualNa) && expectedNa > 0 && Math.abs(actualNa - expectedNa) / expectedNa > 0.60){
        warnings.push({ type:'salt-sodium-mismatch', key:p.key, salt:p.salt, sodium_mg:p.sodium_mg, expected_sodium_mg:Math.round(expectedNa) });
      }
    }
  }
  const report = { critical, warnings, errors:critical, errorCount:critical.length, warningCount:warnings.length };
  window.__lastFoodDbValidation = report;
  return report;
};
try { window.validateFoodDb(); } catch(e) { console.warn('DB validation failed', e); }



// === Composite food projection helpers v5.3.77 ===
function rationForCalculationV5377(ration){
  try {
    const api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377 || window.CompositeFoodDecomposerV5376;
    if (api && typeof api.flattenForCalculation === 'function') return api.flattenForCalculation(ration || []);
    if (api && typeof api.flattenCompositeForCalculation === 'function') return api.flattenCompositeForCalculation(ration || []);
  } catch(_) {}
  return Array.isArray(ration) ? ration : [];
}
// === Hybrid nutrient route v5.3.108 ===
// Unchanged branded composites keep manufacturer/retailer KБЖУ from the root record,
// while their root micronutrients are the audited child-component estimate stored in DB.
// Once a user edits a recipe, the label no longer describes that instance, so every
// nutrient is recalculated from the current children. HEI/Harvard always use the
// child-only rationForCalculationV5377 route above.
function isCustomizedCompositeV53107(entry){
  return !!(entry && (
    entry.recipe_instance_type === 'customized_recipe_instance' ||
    entry.composite_mode === 'customized_recipe_instance' ||
    entry.customized === true || entry.edited === true ||
    (Array.isArray(entry.customization_events) && entry.customization_events.length > 0)
  ));
}
function rationForNutrientCalculationV53107(ration){
  const out = [];
  for (const entry of (Array.isArray(ration) ? ration : [])) {
    if (!entry) continue;
    if (isCompositeEntryV5377(entry) && isCustomizedCompositeV53107(entry)) {
      out.push(...rationForCalculationV5377([entry]));
    } else out.push(entry);
  }
  return out;
}
window.CompositeNutrientRoutingV53107 = Object.freeze({
  version:'v5.3.108',
  toFoodPatternEntries:rationForCalculationV5377,
  toNutrientEntries:rationForNutrientCalculationV53107,
  isCustomizedComposite:isCustomizedCompositeV53107
});
function isCompositeEntryV5377(entry){
  return !!(entry && (entry.entry_type === 'composite_food' || (entry.children && Array.isArray(entry.children))));
}
function rationEntryRefV5377(entry){ return (entry && (entry.id || entry.key)) || ''; }
function domSafeIdV5377(value){ return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_'); }

// === HEI v1.1 stable single initialization ===
window.initHEI = function initHEI(){
  const container = document.getElementById('heiPanel');
  if (!container || !window.HEI || !window.DB || !window.DB.byKey) return null;
  if (window.__heiInst && typeof window.__heiInst.recompute === 'function') return window.__heiInst;

  function getRation(){
    // v5.2.27: read the authoritative app state first.
    // Earlier builds sometimes recomputed HEI from stale bridge copies (window.Ration/window.STATE),
    // so the HEI score could stay unchanged after adding/removing products.
    try {
      if (window.State && typeof window.State.get === 'function') return rationForCalculationV5377(window.State.get());
      if (typeof State !== 'undefined' && State && typeof State.get === 'function') return rationForCalculationV5377(State.get());
    } catch(_) {}
    if (window.Ration && Array.isArray(window.Ration.current)) return window.Ration.current;
    if (window.STATE && Array.isArray(window.STATE.ration)) return window.STATE.ration;
    return [];
  }
  function calcKcalFromRation(){
    const r = rationForNutrientCalculationV53107((window.State && typeof window.State.get === 'function') ? window.State.get() : getRation()); let kcal = 0;
    if (!window.DB || !window.DB.byKey) return 0;
    for (const {key, grams} of (r || [])){
      const p = window.DB.byKey.get(key); if (!p) continue;
      kcal += (+grams || 0) * (p.kcal || 0) / 100;
    }
    return kcal;
  }
  function readKcalInput(id){
    const el = document.getElementById(id);
    const v = Number(el && String(el.value).replace(',', '.'));
    return Number.isFinite(v) ? v : NaN;
  }
  function getEnergyRef(){
    const actualRadio = document.getElementById('heiEnergyActual');
    const targetRadio = document.getElementById('heiEnergyTarget');
    const manualRadio = document.getElementById('heiManualRadio');

    if (actualRadio && actualRadio.checked) {
      const kcal = calcKcalFromRation();
      return Number.isFinite(kcal) && kcal > 0 ? kcal : 2000;
    }
    if (manualRadio && manualRadio.checked) {
      const v = readKcalInput('heiManualKcal');
      return Number.isFinite(v) && v >= 800 && v <= 5000 ? v : 2000;
    }
    if (targetRadio && targetRadio.checked) {
      const v = readKcalInput('heiTargetKcal');
      if (Number.isFinite(v) && v >= 800 && v <= 5000) return v;
      if (window.Needs && Number.isFinite(window.Needs.targetKcal)) return window.Needs.targetKcal;
      return 2000;
    }
    if (window.Needs && Number.isFinite(window.Needs.targetKcal)) return window.Needs.targetKcal;
    return 2000;
  }

  const inst = window.HEI.mount({ db: window.DB, container, getRation, getEnergyRef, onPrint: null });
  window.__heiInst = inst;

  let heiRecomputeTimer = null;
  const recomputeNow = () => { try { inst.recompute(); } catch(e) { console.error('HEI recompute error', e); } };
  const recompute = () => {
    clearTimeout(heiRecomputeTimer);
    heiRecomputeTimer = setTimeout(recomputeNow, 90);
  };
  window.addEventListener('ration:changed', recompute);
  window.addEventListener('needs:changed', recompute);
  window.addEventListener('hei:bridge-updated', recompute);
  ['heiEnergyActual','heiEnergyTarget','heiManualRadio','heiTargetKcal','heiManualKcal'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.__heiV11Bound) return;
    el.__heiV11Bound = true;
    const ev = (el.tagName === 'INPUT' && el.type === 'number') ? 'input' : 'change';
    el.addEventListener(ev, recompute);
  });
  recomputeNow();
  return inst;
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initHEI());
} else {
  window.initHEI();
}


  const Schema = (() => {
    function validate() {
      const req = ['key','name_ru','hei_category_key'];
      const issues = [];
      const seen = new Set();
      for (const o of DB.items) {
        for (const k of req) if (!(k in o)) issues.push({ key:o.key, type:'missing', field:k });
        if (seen.has(o.key)) issues.push({ key:o.key, type:'duplicate', field:'key' });
        seen.add(o.key);
        for (const [k,v] of Object.entries(o)) if (typeof v === 'number' && !Number.isFinite(v)) issues.push({ key:o.key, type:'nan', field:k });
      }
      return issues;
    }
    return { validate };
  })();

  const State = (() => {
    const LS = 'nutri_ration_v1';
    let ration = [];
    let region = 'us';
    let addBatchDepth = 0;
    let addBatchChanged = false;
    let addBatchMutationCount = 0;
    let addBatchLabel = '';
    const PREPARATION_GUARD = (window.__PREPARATION_CALCULATION_GUARD_V53190__ && typeof window.__PREPARATION_CALCULATION_GUARD_V53190__ === 'object') ? window.__PREPARATION_CALCULATION_GUARD_V53190__ : { version:'v5.3.190', redirects:{}, blocked_keys:[] };
    const PREPARATION_REDIRECTS = PREPARATION_GUARD.redirects && typeof PREPARATION_GUARD.redirects === 'object' ? PREPARATION_GUARD.redirects : {};
    const PREPARATION_BLOCKED = new Set(Array.isArray(PREPARATION_GUARD.blocked_keys) ? PREPARATION_GUARD.blocked_keys : []);
    const preparationMigrationReport = {
      version:'v5.3.190', guard_version:String(PREPARATION_GUARD.version || ''),
      saved_redirects:[], saved_blocked:[], composite_child_redirects:[], composite_child_blocked:[], merged_entries:[],
      runtime_redirects:[], runtime_blocked:[], changed:false
    };
    function hasOwn(object, key) { return !!object && Object.prototype.hasOwnProperty.call(object, key); }
    function boundedPush(list, value, max) {
      if (!Array.isArray(list)) return;
      const signature = JSON.stringify(value);
      if (!list.some(item => JSON.stringify(item) === signature) && list.length < (max || 80)) list.push(value);
    }
    function publishPreparationMigrationReport() {
      try { window.__PREPARATION_RATION_MIGRATION_REPORT_V53190__ = JSON.parse(JSON.stringify(preparationMigrationReport)); } catch(_) {}
    }
    function preparationKeyDecision(rawKey) {
      const key = String(rawKey == null ? '' : rawKey);
      if (!key) return { status:'missing', requested_key:key, key:'' };
      if (hasOwn(PREPARATION_REDIRECTS, key)) {
        const target = String(PREPARATION_REDIRECTS[key] || '');
        if (target && target !== key && DB.byKey.has(target)) return { status:'redirect', requested_key:key, key:target };
        return { status:'blocked', requested_key:key, key:'', reason:'redirect_target_missing' };
      }
      if (PREPARATION_BLOCKED.has(key)) return { status:'blocked', requested_key:key, key:'', reason:'unsupported_profile' };
      return { status:'exact', requested_key:key, key:key };
    }
    function applyCanonicalProductIdentity(entry, decision, context) {
      if (!entry || !decision || decision.status !== 'redirect') return entry;
      const oldKey = String(entry.key || decision.requested_key || '');
      const product = DB.byKey.get(decision.key);
      if (!product) return null;
      entry.key = product.key;
      if (!entry.id || entry.id === oldKey) entry.id = product.key;
      entry.name_ru = product.name_ru;
      entry.hei_category_key = product.hei_category_key;
      entry.catalog_category_key = product.catalog_category_key;
      entry.preparation_migration_v5_3_190 = {
        from_key:oldKey, to_key:product.key, context:String(context || 'saved_ration'), guard_version:String(PREPARATION_GUARD.version || 'v5.3.190')
      };
      preparationMigrationReport.changed = true;
      return entry;
    }
    function mergeStoredAiImport(target, source) {
      if (!target || !source || !source.ai_import || typeof source.ai_import !== 'object') return target;
      if (!target.ai_import || typeof target.ai_import !== 'object') { target.ai_import = source.ai_import; return target; }
      const listFields = ['meal_labels','observed_names','source_ids','source_transcripts','food_family_ids','preparation_methods','nutritional_process_classes','nutrition_effect_modes','automatic_selection_policies','nutritional_effect_dimensions','preparation_states','preparation_match_statuses','exact_variant_keys','weight_basis_hints','consumption_scopes','recognition_issue_codes','attribution_statuses','selection_reasons'];
      listFields.forEach(field => {
        target.ai_import[field] = Array.from(new Set([].concat(target.ai_import[field] || [], source.ai_import[field] || []).filter(Boolean))).slice(0, field === 'nutritional_effect_dimensions' || field === 'recognition_issue_codes' ? 12 : 8);
      });
      const a = Number(target.ai_import.confidence), b = Number(source.ai_import.confidence);
      if (Number.isFinite(a) && Number.isFinite(b)) target.ai_import.confidence = Math.min(a,b);
      else if (!Number.isFinite(a) && Number.isFinite(b)) target.ai_import.confidence = b;
      if (target.ai_import.source_type && source.ai_import.source_type && target.ai_import.source_type !== source.ai_import.source_type) target.ai_import.source_type = 'mixed';
      return target;
    }
    function normalizeStoredPreparationEntry(entry, context) {
      if (!entry || typeof entry !== 'object') return null;
      const decision = preparationKeyDecision(entry.key);
      if (decision.status === 'blocked') {
        boundedPush(context === 'composite_child' ? preparationMigrationReport.composite_child_blocked : preparationMigrationReport.saved_blocked, { key:decision.requested_key, reason:decision.reason || 'blocked' });
        preparationMigrationReport.changed = true;
        return null;
      }
      if (decision.status === 'redirect') {
        const list = context === 'composite_child' ? preparationMigrationReport.composite_child_redirects : preparationMigrationReport.saved_redirects;
        boundedPush(list, { from_key:decision.requested_key, to_key:decision.key });
        if (!applyCanonicalProductIdentity(entry, decision, context)) return null;
      }
      if (Array.isArray(entry.children)) {
        entry.children = entry.children.map(child => normalizeStoredPreparationEntry(child, 'composite_child')).filter(Boolean);
      }
      return entry;
    }
    function consolidateStoredRation(entries) {
      const out = [], byKey = new Map();
      (Array.isArray(entries) ? entries : []).forEach(entry => {
        if (!entry || typeof entry !== 'object') return;
        if (!isCompositeEntryV5377(entry) && entry.key) {
          const existing = byKey.get(entry.key);
          if (existing) {
            const before = Number(existing.grams) || 0;
            existing.grams = Math.min(5000, before + (Number(entry.grams) || 0));
            mergeStoredAiImport(existing, entry);
            boundedPush(preparationMigrationReport.merged_entries, { key:entry.key, from_grams:before, added_grams:Number(entry.grams)||0, to_grams:existing.grams });
            preparationMigrationReport.changed = true;
            return;
          }
          byKey.set(entry.key, entry);
        }
        out.push(entry);
      });
      return out;
    }
    function resolveRuntimePreparationKey(rawKey, context) {
      const decision = preparationKeyDecision(rawKey);
      if (decision.status === 'redirect') {
        boundedPush(preparationMigrationReport.runtime_redirects, { from_key:decision.requested_key, to_key:decision.key, context:String(context || 'State.add') });
        publishPreparationMigrationReport();
      } else if (decision.status === 'blocked') {
        boundedPush(preparationMigrationReport.runtime_blocked, { key:decision.requested_key, reason:decision.reason || 'blocked', context:String(context || 'State.add') });
        publishPreparationMigrationReport();
      }
      return decision;
    }
    function normalizeStoredList(value, maxItems, maxChars) {
      const src = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
      const out = [];
      src.forEach(v => {
        const text = String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, maxChars || 500);
        if (text && !out.includes(text) && out.length < (maxItems || 8)) out.push(text);
      });
      return out;
    }
    function normalizeStoredAiImport(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const ai = Object.assign({}, raw);
      const listFields = {
        meal_labels:[8,60], observed_names:[8,120], source_ids:[8,80], source_transcripts:[8,500],
        food_family_ids:[4,80], preparation_methods:[4,40], nutritional_process_classes:[4,60],
        nutrition_effect_modes:[4,60], automatic_selection_policies:[4,50], nutritional_effect_dimensions:[12,80],
        preparation_states:[4,100], preparation_match_statuses:[4,50], exact_variant_keys:[4,120],
        weight_basis_hints:[4,50], consumption_scopes:[4,50], recognition_issue_codes:[12,80],
        attribution_statuses:[4,50], selection_reasons:[4,80]
      };
      Object.keys(listFields).forEach(key => {
        const limits = listFields[key];
        let value = ai[key];
        if (key === 'meal_labels' && (value == null || value === '')) value = ai.meal_label || ai.meal || '';
        if (key === 'observed_names' && (value == null || value === '')) value = ai.observed_name || ai.original_name || '';
        if (key === 'source_transcripts' && (value == null || value === '')) value = ai.source_transcript || '';
        ai[key] = normalizeStoredList(value, limits[0], limits[1]);
      });
      ai.source = String(ai.source || 'gemini_media').replace(/\s+/g, ' ').trim().slice(0, 40) || 'gemini_media';
      const confidence = Number(ai.confidence);
      ai.confidence = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null;
      return ai;
    }
    function normalizeStoredRationEntry(entry) {
      if (!entry || typeof entry !== 'object') return null;
      if (entry.ai_import) entry.ai_import = normalizeStoredAiImport(entry.ai_import);
      return normalizeStoredPreparationEntry(entry, 'saved_ration');
    }
    function load() {
      try {
        const parsed = JSON.parse(SafeStorage.getItem(LS) || '[]');
        const normalized = Array.isArray(parsed) ? parsed.map(normalizeStoredRationEntry).filter(Boolean) : [];
        ration = consolidateStoredRation(normalized);
      } catch { ration = []; }
      try { region = SafeStorage.getItem(LS+'_region') || 'us'; } catch { region = 'us'; }
      if (preparationMigrationReport.changed) {
        try { save(); } catch(_) {}
      }
      publishPreparationMigrationReport();
    }
    function save() { SafeStorage.setItem(LS, JSON.stringify(ration)); SafeStorage.setItem(LS+'_region', region); }
    function forceHEIRecompute(reason) {
      const requestedAt = Date.now();
      setTimeout(() => {
        try {
          if ((Number(window.__lastHEIRenderedAt) || 0) >= requestedAt) return;
          if (window.__heiInst && typeof window.__heiInst.recompute === 'function') {
            window.__heiInst.recompute();
          } else if (typeof window.initHEI === 'function') {
            window.initHEI();
            if ((Number(window.__lastHEIRenderedAt) || 0) < requestedAt && window.__heiInst && typeof window.__heiInst.recompute === 'function') window.__heiInst.recompute();
          }
          try { window.dispatchEvent(new CustomEvent('hei:forced-recompute', { detail: { reason, fallback: true } })); } catch(_) {}
        } catch (e) { console.error('HEI forced recompute failed', e); }
      }, 220);
    }
    function emitRationChanged(action, detail) {
      const payload = Object.assign({ action, source: 'State.' + action, version: 'v5.2.28' }, detail || {});
      try { window.dispatchEvent(new CustomEvent('ration:changed', { detail: payload })); } catch {}
      forceHEIRecompute(action);
    }
    function commitAddMutation(action, detail) {
      if (addBatchDepth > 0) {
        addBatchChanged = true;
        addBatchMutationCount += 1;
        return;
      }
      save(); Events.emit('change'); emitRationChanged(action, detail);
    }
    function beginAddBatch(label) {
      addBatchDepth += 1;
      if (addBatchDepth === 1) {
        addBatchChanged = false;
        addBatchMutationCount = 0;
        addBatchLabel = String(label || 'batch');
      }
      return addBatchDepth;
    }
    function endAddBatch(action, detail) {
      if (addBatchDepth <= 0) return false;
      addBatchDepth -= 1;
      if (addBatchDepth > 0) return true;
      const changed = addBatchChanged;
      const mutationCount = addBatchMutationCount;
      const label = addBatchLabel;
      addBatchChanged = false;
      addBatchMutationCount = 0;
      addBatchLabel = '';
      if (!changed) return false;
      save();
      Events.emit('change');
      emitRationChanged(action || 'batchAdd', Object.assign({ batch_label:label, mutation_count:mutationCount }, detail || {}));
      return true;
    }
    function findIndex(ref) {
      return ration.findIndex(r => (r && (r.id === ref || r.key === ref)));
    }
    function buildCompositeEntryIfNeeded(p, grams) {
      try {
        const api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377;
        if (api && typeof api.createEntryFromProduct === 'function') return api.createEntryFromProduct(p, grams);
      } catch(e) { console.warn('Composite entry creation failed', e); }
      return null;
    }
    function sanitizeImportMeta(meta) {
      if (!meta || typeof meta !== 'object') return null;
      const trim = (value, max) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
      const meal = trim(meta.meal_label || meta.meal || '', 60);
      const observed = trim(meta.observed_name || meta.original_name || '', 120);
      const sourceType = trim(meta.source_type || '', 20);
      const confidence = Number(meta.confidence);
      const list = (value, maxItems, maxChars) => {
        const src = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
        return Array.from(new Set(src.map(v => trim(v, maxChars)).filter(Boolean))).slice(0, maxItems);
      };
      const out = {
        source: 'gemini_media',
        batch_id: trim(meta.batch_id || '', 80),
        source_type: ['image','audio','mixed'].includes(sourceType) ? sourceType : 'mixed',
        meal_labels: meal ? [meal] : [],
        observed_names: observed ? [observed] : [],
        source_ids: list(meta.source_ids, 8, 80),
        source_transcripts: list((Array.isArray(meta.source_transcripts) && meta.source_transcripts.length) ? meta.source_transcripts : meta.source_transcript, 8, 500),
        food_family_ids: list(meta.food_family_id, 4, 80),
        preparation_methods: list(meta.preparation_method, 4, 40),
        nutritional_process_classes: list(meta.nutritional_process_class, 4, 60),
        nutrition_effect_modes: list(meta.nutrition_effect_mode, 4, 60),
        automatic_selection_policies: list(meta.automatic_selection_policy, 4, 50),
        nutritional_effect_dimensions: list(meta.nutritional_effect_dimensions, 12, 80),
        preparation_states: list(meta.preparation_state, 4, 100),
        preparation_match_statuses: list(meta.preparation_match_status, 4, 50),
        exact_variant_keys: list(meta.exact_variant_key, 4, 120),
        weight_basis_hints: list(meta.weight_basis_hint, 4, 50),
        consumption_scopes: list(meta.consumption_scope, 4, 50),
        recognition_issue_codes: list(meta.recognition_issue_codes, 12, 80),
        attribution_statuses: list(meta.attribution_status, 4, 50),
        selection_reasons: list(meta.candidate_selection_reason, 4, 80),
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
        imported_at: trim(meta.imported_at || new Date().toISOString(), 40)
      };
      return out;
    }
    function mergeImportMeta(target, rawMeta) {
      const meta = sanitizeImportMeta(rawMeta);
      if (!target || !meta) return target;
      const prev = target.ai_import && typeof target.ai_import === 'object' ? target.ai_import : {};
      const uniq = arr => Array.from(new Set((Array.isArray(arr) ? arr : []).filter(Boolean))).slice(0, 8);
      const prevConfidence = Number(prev.confidence);
      target.ai_import = {
        source: 'gemini_media',
        batch_id: meta.batch_id || prev.batch_id || '',
        source_type: prev.source_type && prev.source_type !== meta.source_type ? 'mixed' : (meta.source_type || prev.source_type || 'mixed'),
        meal_labels: uniq([].concat(prev.meal_labels || [], meta.meal_labels || [])),
        observed_names: uniq([].concat(prev.observed_names || [], meta.observed_names || [])),
        source_ids: uniq([].concat(prev.source_ids || [], meta.source_ids || [])),
        source_transcripts: uniq([].concat(prev.source_transcripts || [], meta.source_transcripts || [])),
        food_family_ids: uniq([].concat(prev.food_family_ids || [], meta.food_family_ids || [])),
        preparation_methods: uniq([].concat(prev.preparation_methods || [], meta.preparation_methods || [])),
        nutritional_process_classes: uniq([].concat(prev.nutritional_process_classes || [], meta.nutritional_process_classes || [])),
        nutrition_effect_modes: uniq([].concat(prev.nutrition_effect_modes || [], meta.nutrition_effect_modes || [])),
        automatic_selection_policies: uniq([].concat(prev.automatic_selection_policies || [], meta.automatic_selection_policies || [])),
        nutritional_effect_dimensions: uniq([].concat(prev.nutritional_effect_dimensions || [], meta.nutritional_effect_dimensions || [])).slice(0, 12),
        preparation_states: uniq([].concat(prev.preparation_states || [], meta.preparation_states || [])),
        preparation_match_statuses: uniq([].concat(prev.preparation_match_statuses || [], meta.preparation_match_statuses || [])),
        exact_variant_keys: uniq([].concat(prev.exact_variant_keys || [], meta.exact_variant_keys || [])),
        weight_basis_hints: uniq([].concat(prev.weight_basis_hints || [], meta.weight_basis_hints || [])),
        consumption_scopes: uniq([].concat(prev.consumption_scopes || [], meta.consumption_scopes || [])),
        recognition_issue_codes: uniq([].concat(prev.recognition_issue_codes || [], meta.recognition_issue_codes || [])).slice(0, 12),
        attribution_statuses: uniq([].concat(prev.attribution_statuses || [], meta.attribution_statuses || [])),
        selection_reasons: uniq([].concat(prev.selection_reasons || [], meta.selection_reasons || [])),
        confidence: Number.isFinite(meta.confidence) && Number.isFinite(prevConfidence) ? Math.min(meta.confidence, prevConfidence) : (Number.isFinite(meta.confidence) ? meta.confidence : (Number.isFinite(prevConfidence) ? prevConfidence : null)),
        imported_at: meta.imported_at || prev.imported_at || new Date().toISOString()
      };
      return target;
    }
    function add(key, grams, importMeta) {
      const decision = resolveRuntimePreparationKey(key, 'State.add');
      if (decision.status === 'blocked' || !decision.key) { Logger.warn('PREPARATION_PROFILE_BLOCKED', { key:String(key || ''), context:'State.add' }); return null; }
      key = decision.key;
      const p = DB.byKey.get(key); if (!p) return null;
      const g = Math.max(0, Math.min(5000, Number(grams)||0));
      if (!(g > 0)) return null;
      const composite = buildCompositeEntryIfNeeded(p, g);
      let committedEntry = null;
      if (composite) {
        mergeImportMeta(composite, importMeta);
        ration.push(composite);
        committedEntry = composite;
      } else {
        const existing = ration.find(r => r.key === key && !isCompositeEntryV5377(r));
        if (existing) {
          existing.grams = Math.min(5000, (existing.grams||0) + g);
          mergeImportMeta(existing, importMeta);
          committedEntry = existing;
        } else {
          const entry = { id:key, key, name_ru: p.name_ru, hei_category_key: p.hei_category_key, catalog_category_key: p.catalog_category_key, grams:g };
          mergeImportMeta(entry, importMeta);
          ration.push(entry);
          committedEntry = entry;
        }
      }
      Logger.info('ADD_ITEM', { key, grams:g, composite:!!composite, imported:!!importMeta });
      commitAddMutation('add', { key, grams:g, composite:!!composite, imported:!!importMeta });
      return committedEntry;
    }
    function update(ref, grams) {
      const idx = findIndex(ref); if (idx < 0) return;
      const it = ration[idx];
      const oldGrams = Number(it.grams)||0;
      const nextGrams = Math.max(0, Math.min(5000, Number(grams)||0));
      if (isCompositeEntryV5377(it) && window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.scaleChildren === 'function') {
        it.children = window.CompositeFoodFolderV5377.scaleChildren(it.children || [], oldGrams, nextGrams);
        it.edited = !!it.edited;
      }
      it.grams = nextGrams; save(); Events.emit('change'); Logger.info('UPDATE_ITEM', { ref, grams:nextGrams }); emitRationChanged('update', { ref, grams:nextGrams });
    }
    function markCompositeCustomized(parent, event) {
      if (!parent) return parent;
      if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.markCustomized === 'function') return window.CompositeFoodFolderV5377.markCustomized(parent, event);
      parent.edited = true;
      parent.customized = true;
      parent.recipe_instance_type = 'customized_recipe_instance';
      if (!Array.isArray(parent.customization_events)) parent.customization_events = [];
      if (event) parent.customization_events.push(Object.assign({ at:new Date().toISOString(), pass:'v5.3.88' }, event));
      return parent;
    }
    function updateCompositeChild(parentRef, childRef, grams) {
      const idx = findIndex(parentRef); if (idx < 0) return;
      const parent = ration[idx]; if (!isCompositeEntryV5377(parent) || !Array.isArray(parent.children)) return;
      const child = parent.children.find(c => c && (c.id === childRef || c.key === childRef)); if (!child) return;
      const oldGrams = Number(child.grams)||0;
      child.grams = Math.max(0, Math.min(5000, Number(grams)||0));
      child.manual_locked = true;
      markCompositeCustomized(parent, { type:'update_child_grams', child_key:child.key, from_g:oldGrams, to_g:child.grams });
      if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.recalculateRootWeight === 'function') parent.grams = window.CompositeFoodFolderV5377.recalculateRootWeight(parent.children);
      save(); Events.emit('change'); Logger.info('UPDATE_COMPOSITE_CHILD', { parentRef, childRef, grams:child.grams }); emitRationChanged('updateCompositeChild', { parentRef, childRef, grams:child.grams });
    }
    function removeCompositeChild(parentRef, childRef) {
      const idx = findIndex(parentRef); if (idx < 0) return;
      const parent = ration[idx]; if (!isCompositeEntryV5377(parent) || !Array.isArray(parent.children)) return;
      if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.removeChildFromEntry === 'function') {
        window.CompositeFoodFolderV5377.removeChildFromEntry(parent, childRef);
      } else {
        const old = parent.children.find(c => c && (c.id === childRef || c.key === childRef));
        parent.children = parent.children.filter(c => !(c && (c.id === childRef || c.key === childRef)));
        markCompositeCustomized(parent, { type:'remove_child', removed_key:old && old.key });
        if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.recalculateRootWeight === 'function') parent.grams = window.CompositeFoodFolderV5377.recalculateRootWeight(parent.children);
      }
      save(); Events.emit('change'); Logger.info('REMOVE_COMPOSITE_CHILD', { parentRef, childRef }); emitRationChanged('removeCompositeChild', { parentRef, childRef });
    }
    function addCompositeChild(parentRef, productKey, grams) {
      const idx = findIndex(parentRef); if (idx < 0) return;
      const parent = ration[idx]; if (!isCompositeEntryV5377(parent)) return;
      const decision = resolveRuntimePreparationKey(productKey, 'State.addCompositeChild');
      if (decision.status === 'blocked' || !decision.key) return;
      productKey = decision.key;
      const p = DB.byKey.get(productKey); if (!p || p.hidden_from_search === true) return;
      const g = Math.max(0, Math.min(5000, Number(grams)||0)); if (!(g > 0)) return;
      if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.addChildToEntry === 'function') {
        window.CompositeFoodFolderV5377.addChildToEntry(parent, p, g, 'custom_added_component');
      } else {
        const child = { id:String(parent.id || parent.key)+'_child_custom_'+Date.now(), key:p.key, name_ru:p.name_ru||p.name||p.key, grams:g, manual_locked:true, custom_added:true, parent_composite_id:parent.id||parent.key };
        if (!Array.isArray(parent.children)) parent.children = [];
        parent.children.push(child);
        markCompositeCustomized(parent, { type:'add_child', added_key:p.key, grams:g });
        if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.recalculateRootWeight === 'function') parent.grams = window.CompositeFoodFolderV5377.recalculateRootWeight(parent.children);
      }
      save(); Events.emit('change'); Logger.info('ADD_COMPOSITE_CHILD', { parentRef, productKey, grams:g }); emitRationChanged('addCompositeChild', { parentRef, productKey, grams:g });
    }
    function replaceCompositeChild(parentRef, childRef, productKey, grams) {
      const idx = findIndex(parentRef); if (idx < 0) return;
      const parent = ration[idx]; if (!isCompositeEntryV5377(parent) || !Array.isArray(parent.children)) return;
      const decision = resolveRuntimePreparationKey(productKey, 'State.replaceCompositeChild');
      if (decision.status === 'blocked' || !decision.key) return;
      productKey = decision.key;
      const p = DB.byKey.get(productKey); if (!p || p.hidden_from_search === true) return;
      const old = parent.children.find(c => c && (c.id === childRef || c.key === childRef)); if (!old) return;
      const g = Math.max(0, Math.min(5000, Number(grams)||Number(old.grams)||0)); if (!(g > 0)) return;
      if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.replaceChildInEntry === 'function') {
        window.CompositeFoodFolderV5377.replaceChildInEntry(parent, childRef, p, g);
      } else {
        const child = { id:String(parent.id || parent.key)+'_child_repl_'+Date.now(), key:p.key, name_ru:p.name_ru||p.name||p.key, grams:g, manual_locked:true, custom_added:true, replaces_key:old.key, parent_composite_id:parent.id||parent.key };
        const i = parent.children.findIndex(c => c && (c.id === childRef || c.key === childRef));
        if (i >= 0) parent.children[i] = child;
        markCompositeCustomized(parent, { type:'replace_child', removed_key:old.key, added_key:p.key, grams:g });
        if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.recalculateRootWeight === 'function') parent.grams = window.CompositeFoodFolderV5377.recalculateRootWeight(parent.children);
      }
      save(); Events.emit('change'); Logger.info('REPLACE_COMPOSITE_CHILD', { parentRef, childRef, productKey, grams:g }); emitRationChanged('replaceCompositeChild', { parentRef, childRef, productKey, grams:g });
    }
    function resetCompositeEntry(parentRef) {
      const idx = findIndex(parentRef); if (idx < 0) return;
      const parent = ration[idx]; if (!isCompositeEntryV5377(parent)) return;
      const p = DB.byKey.get(parent.key); if (!p) return;
      const grams = Number(parent.grams)||Number(p.serving_weight_g)||100;
      let reset = null;
      if (window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.resetEntryFromTemplate === 'function') reset = window.CompositeFoodFolderV5377.resetEntryFromTemplate(parent, grams);
      if (!reset && window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.createEntryFromProduct === 'function') reset = window.CompositeFoodFolderV5377.createEntryFromProduct(p, grams);
      if (!reset) return;
      if (parent.id) {
        reset.id = parent.id;
        if (Array.isArray(reset.children)) reset.children.forEach(c => { c.parent_composite_id = parent.id; });
      }
      if (parent.ai_import) reset.ai_import = parent.ai_import;
      ration[idx] = reset;
      save(); Events.emit('change'); Logger.info('RESET_COMPOSITE_ENTRY', { parentRef }); emitRationChanged('resetCompositeEntry', { parentRef });
    }
    function setRegion(r) { region = r; save(); Events.emit('region'); }
    function remove(ref) { ration = ration.filter(r => !(r && (r.id === ref || r.key === ref))); save(); Events.emit('change'); Logger.info('REMOVE_ITEM', { ref }); emitRationChanged('remove', { ref }); }
    function clear() { ration = []; save(); Events.emit('change'); Logger.info('CLEAR', null); emitRationChanged('clear', {}); }
    function get() { return ration.slice(); }
    function getForCalculation() { return rationForCalculationV5377(ration); }
    function getForFoodPattern() { return rationForCalculationV5377(ration); }
    function getForNutrients() { return rationForNutrientCalculationV53107(ration); }
    function getRegion() { return region; }
    function getPreparationMigrationReport() { try { return JSON.parse(JSON.stringify(preparationMigrationReport)); } catch(_) { return Object.assign({}, preparationMigrationReport); } }
    load(); const api = { add, beginAddBatch, endAddBatch, update, updateCompositeChild, removeCompositeChild, addCompositeChild, replaceCompositeChild, resetCompositeEntry, remove, clear, get, getForCalculation, getForFoodPattern, getForNutrients, setRegion, getRegion, getPreparationMigrationReport }; window.State = api; return api;
  })();

  const Events = (() => {
    const h = new Map();
    return {
      on: (e, fn) => { if(!h.has(e)) h.set(e, []); h.get(e).push(fn); },
      off: (e, fn) => { if(!h.has(e)) return; h.set(e, (h.get(e)||[]).filter(x => x !== fn)); },
      emit: (e, payload) => {
        (h.get(e)||[]).slice().forEach(fn => {
          try { fn(payload); }
          catch (error) {
            try { Logger.error('EVENT_LISTENER_ERROR', { event:e, message:error && error.message ? error.message : String(error) }); } catch(_) {}
            try { console.error('Event listener failed:', e, error); } catch(_) {}
          }
        });
      }
    };
  })();
  window.Events = Events;
  /* ===== PRESETS & Preset Application ===== */
  const PRESETS = {
    "A_Пожилые_65+": [
      {key:"oatmeal_cooked", grams:170},
      {key:"butter_82_5_pct", grams:5},
      {key:"egg_whole_boiled", grams:50},
      {key:"rye_bread", grams:260},
      {key:"yogurt_plain_1_5_pct", grams:150},
      {key:"chicken_breast_cooked", grams:100},
      {key:"rice_cooked", grams:140},
      {key:"sauerkraut_other", grams:100},
      {key:"sunflower_oil_other", grams:10},
      {key:"apple", grams:120},
      {key:"cod_baked_spp", grams:70},
      {key:"buckwheat_cooked", grams:200},
      {key:"curd_5_pct", grams:40},
      {key:"sunflower_seeds", grams:15},
      {key:"tea_black_brewed_other", grams:200},
      {key:"sugar_white_other", grams:15}
    ],
    "B_Мужчины_16_59": [
      {key:"oatmeal_cooked", grams:200},
      {key:"butter_82_5_pct", grams:5},
      {key:"egg_whole_boiled", grams:100},
      {key:"white_bread", grams:200},
      {key:"rye_bread", grams:150},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"chicken_breast_cooked", grams:120},
      {key:"rice_cooked", grams:140},
      {key:"sauerkraut_other", grams:120},
      {key:"sunflower_oil_other", grams:12},
      {key:"apple", grams:150},
      {key:"banana", grams:150},
      {key:"cod_baked_spp", grams:90},
      {key:"buckwheat_cooked", grams:200},
      {key:"tea_black_brewed_other", grams:350},
      {key:"sugar_white_other", grams:20}
    ],
    "C_Женщины_16_54": [
      {key:"oatmeal_cooked", grams:180},
      {key:"butter_82_5_pct", grams:5},
      {key:"egg_whole_boiled", grams:50},
      {key:"white_bread", grams:160},
      {key:"rye_bread", grams:120},
      {key:"yogurt_plain_1_5_pct", grams:150},
      {key:"chicken_breast_cooked", grams:100},
      {key:"rice_cooked", grams:140},
      {key:"sauerkraut_other", grams:100},
      {key:"sunflower_oil_other", grams:10},
      {key:"apple", grams:150},
      {key:"banana", grams:120},
      {key:"cod_baked_spp", grams:65},
      {key:"buckwheat_cooked", grams:180},
      {key:"tea_black_brewed_other", grams:300},
      {key:"sugar_white_other", grams:15}
    ],
    "D_Сутки_по_Приказ_614": [
      {key:"white_bread", grams:150},
      {key:"oatmeal", grams:40},
      {key:"rice_cooked", grams:230},
      {key:"sauerkraut_other", grams:200},
      {key:"apple", grams:150},
      {key:"banana", grams:150},
      {key:"chicken_breast_cooked", grams:150},
      {key:"cod_baked_spp", grams:80},
      {key:"milk_1_5_pct", grams:200},
      {key:"yogurt_plain_1_5_pct", grams:400},
      {key:"curd_5_pct", grams:100},
      {key:"cheese_gouda", grams:30},
      {key:"egg_whole_boiled", grams:50},
      {key:"sunflower_oil_other", grams:30},
      {key:"sugar_white_other", grams:20}
    ],
    "E_Порции_Роспотребнадзор": [
      {key:"oatmeal_cooked", grams:200},
      {key:"buckwheat_cooked", grams:150},
      {key:"rice_cooked", grams:150},
      {key:"white_bread", grams:120},
      {key:"sauerkraut_other", grams:200},
      {key:"apple", grams:150},
      {key:"banana", grams:150},
      {key:"yogurt_plain_1_5_pct", grams:450},
      {key:"cheese_gouda", grams:30},
      {key:"chicken_breast_cooked", grams:90},
      {key:"cod_baked_spp", grams:90},
      {key:"egg_whole_boiled", grams:50},
      {key:"sunflower_oil_other", grams:20},
      {key:"sunflower_seeds", grams:25}
    ],
    "F_Гарвард_тарелка_база": [
      {key:"oatmeal_cooked", grams:200},
      {key:"banana", grams:120},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"sunflower_seeds", grams:20},
      {key:"chicken_breast_cooked", grams:120},
      {key:"buckwheat_cooked", grams:150},
      {key:"apple", grams:150},
      {key:"sunflower_seeds", grams:15},
      {key:"lentils_cooked", grams:200},
      {key:"sauerkraut_other", grams:150},
      {key:"olive_oil_evoo_other", grams:15},
      {key:"rye_bread", grams:60}
    ],
    "G_Гарвард_песко_средизем": [
      {key:"pearl_barley_cooked", grams:200},
      {key:"apple", grams:150},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"sunflower_seeds", grams:15},
      {key:"atlantic_salmon_baked_spp", grams:120},
      {key:"barley_groats_cooked", grams:150},
      {key:"banana", grams:120},
      {key:"lentils_cooked", grams:200},
      {key:"sauerkraut_other", grams:250},
      {key:"olive_oil_evoo_other", grams:15},
      {key:"rye_bread", grams:40}
    ],
    "H_Гарвард_курица_бобовые": [
      {key:"oatmeal_cooked", grams:200},
      {key:"banana", grams:120},
      {key:"sunflower_seeds", grams:20},
      {key:"sauerkraut_other", grams:300},
      {key:"chicken_breast_cooked", grams:130},
      {key:"rice_cooked", grams:150},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"lentils_cooked", grams:220},
      {key:"sauerkraut_other", grams:250},
      {key:"sunflower_oil_other", grams:8},
      {key:"rye_bread", grams:60}
    ],
    "I_Гарвард_лакто_ово": [
      {key:"buckwheat_cooked", grams:200},
      {key:"egg_whole_boiled", grams:100},
      {key:"sauerkraut_other", grams:220},
      {key:"olive_oil_evoo_other", grams:5},
      {key:"lentils_cooked", grams:200},
      {key:"pearl_barley_cooked", grams:150},
      {key:"apple", grams:150},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"curd_5_pct", grams:120},
      {key:"sauerkraut_other", grams:270},
      {key:"olive_oil_evoo_other", grams:8},
      {key:"rye_bread", grams:50}
    ],
    "R_Рыбный_день": [
      {key:"buckwheat_cooked", grams:200},
      {key:"butter_82_5_pct", grams:5},
      {key:"rye_bread", grams:40},
      {key:"apple", grams:150},
      {key:"atlantic_salmon_baked_spp", grams:120},
      {key:"barley_groats_cooked", grams:150},
      {key:"sauerkraut_other", grams:200},
      {key:"olive_oil_evoo_other", grams:7},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"cod_baked_spp", grams:120},
      {key:"rice_cooked", grams:200},
      {key:"sauerkraut_other", grams:150},
      {key:"olive_oil_evoo_other", grams:5}
    ],
    "L_Лакто_вегетарианский": [
      {key:"oatmeal_cooked", grams:200},
      {key:"curd_5_pct", grams:60},
      {key:"banana", grams:140},
      {key:"lentils_cooked", grams:200},
      {key:"buckwheat_cooked", grams:150},
      {key:"sauerkraut_other", grams:200},
      {key:"sunflower_oil_other", grams:7},
      {key:"yogurt_plain_1_5_pct", grams:200},
      {key:"buckwheat_cooked", grams:180},
      {key:"sunflower_seeds", grams:20}
    ]
  };

  function clip(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function roundToStep(x, step){ return Math.round(x/step)*step; }
  function n100(p, field){ const v = Number(p && p[field]); return Number.isFinite(v) ? v : 0; }
  function protein100(p){ return n100(p, 'protein_per_100g') || n100(p, 'protein_g') || n100(p, 'protein'); }
  function fat100(p){ return n100(p, 'fat_per_100g') || n100(p, 'fat_g') || n100(p, 'fat'); }
  function carbs100(p){ return n100(p, 'carbs_per_100g') || n100(p, 'carbohydrate_g') || n100(p, 'carb_g') || n100(p, 'carbs'); }
  function kcal100(p){ return n100(p, 'kcal') || n100(p, 'energy_kcal') || n100(p, 'calories'); }

  
  
  function computeTotalsLocal(){
    const list = rationForNutrientCalculationV53107(State.get()||[]);
    let kcal = 0, protein=0, fat=0, carb=0;
    function get(p, names, def=0){
      for (const n of names){ if (typeof p[n] === 'number') return p[n]; }
      return def;
    }
    for (const it of list){
      const p = DB.byKey.get(it.key); if (!p) continue;
      const per100 = (it.grams||0)/100;
      kcal   += get(p, ['kcal','energy_kcal','calories'], 0) * per100;
      protein+= get(p, ['protein_per_100g','protein_g','protein'], 0) * per100;
      fat    += get(p, ['fat_per_100g','fat_g','fat'], 0) * per100;
      carb   += get(p, ['carbs_per_100g','carbohydrate_g','carb_g','carbs'], 0) * per100;
    }
    return { t: { kcal, protein_g: protein, fat_g: fat, carbohydrate_g: carb } };
  }

    
  function sumProtein(items){
    let sum = 0;
    for (const it of rationForNutrientCalculationV53107(items)){
      const p = DB.byKey.get(it.key); if (!p) continue;
      const f = (it.grams||0)/100.0;
      sum += protein100(p) * f;
    }
    return sum;
  }
  function proteinDensity(p){
    if (!p) return 0;
    const kcal = kcal100(p); const prot = protein100(p);
    return (kcal>0) ? (prot / kcal) : prot;
  }

  function fitByKcal(){
    const totals = computeTotalsLocal();
    const Ktarget = (window.norms?.values?.kcal?.value) || 0;
    const Kcurr   = totals.t.kcal || 0;
    if (Ktarget <= 0 || Kcurr <= 0) return;
    const s = Ktarget / Kcurr;
    const ration = State.get();
    for (const it of ration){
      const g = clip(roundToStep((it.grams||0) * s, 5), 1, 5000);
      State.update(it.key, g);
    }
  }

  function fitByProtein(){
    const ration = State.get().map(it => ({...it}));
    const Ptarget = (window.norms?.values?.protein_g?.value) || 0;
    if (Ptarget <= 0) return;
    const proteinHEI = new Set(['protein_foods','seafood_plant_protein','dairy']);
    const fixed = []; const vari = [];
    for (const it of ration){
      const p = DB.byKey.get(it.key);
      if (!p) continue;
      if (proteinHEI.has(p.hei_category_key)) vari.push(it); else fixed.push(it);
    }
    const Pfixed = sumProtein(fixed);
    const Pvar   = sumProtein(vari);
    if (Pvar <= 0) return;
    let s = (Ptarget - Pfixed) / Pvar;
    s = clip(s, 0.5, 2.5);
    for (const it of vari){
      const g = clip(roundToStep((it.grams||0) * s, 5), 1, 5000);
      State.update(it.key, g);
    }
    // fine tuning
    let left = Ptarget - (Pfixed + sumProtein(vari));
    if (Math.abs(left) < 1.0) return;
    const sorted = vari.map(v => ({...v, p: DB.byKey.get(v.key)})).filter(x=>x.p);
    sorted.sort((a,b)=>proteinDensity(b.p)-proteinDensity(a.p));
    const step = 10; const maxIters = 400;
    let iter = 0;
    while (Math.abs(left) >= 1.0 && iter++ < maxIters){
      for (const it of sorted){
        if (Math.abs(left) < 1.0) break;
        const deltaProtPerStep = protein100(it.p) * (step/100.0);
        let gNew = it.grams;
        if (left > 0){ gNew = clip(it.grams + step, 1, 5000); left -= deltaProtPerStep; }
        else { gNew = clip(it.grams - step, 1, 5000); left += deltaProtPerStep; }
        it.grams = gNew;
        State.update(it.key, roundToStep(gNew, 5));
      }
    }
  }

  function applyPreset(presetId, fitMode){
    const list = PRESETS[presetId] || [];
    if (!list.length) return;
    State.clear();
    for (const {key, grams} of list){
      if (DB.byKey.has(key)) State.add(key, grams);
    }
    if (fitMode === 'protein') fitByProtein(); else fitByKcal();
  }

  (function initPresetsUI(){
    const sel = document.getElementById('presetSelect');
    const btn = document.getElementById('applyPresetBtn');
    const seg = document.getElementById('fitModeSeg');
    if (!sel || !btn) return;
    Object.keys(PRESETS).forEach(id => {
      const opt = document.createElement('option'); opt.value = id; opt.textContent = id; sel.appendChild(opt);
    });
    let fitMode = 'kcal';
    if (seg) seg.addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if (!b) return;
      seg.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); fitMode = b.getAttribute('data-fit') || 'kcal';
    });
    btn.addEventListener('click', ()=>{ const id = sel.value; if (!id) return; applyPreset(id, fitMode); });
    document.addEventListener('needs:computed', ()=>{ sel.disabled = false; btn.disabled = false; });
  })();
/* ===== Meal Planner Intelligence v4.6.3 ===== */
(function(){
  'use strict';
  const VERSION = 'v4.6.3_meal_planner_intelligence';
  const STORAGE_KEY = 'nutri_meal_planner_v463';
  const AUTO_KEY = 'nutri_meal_planner_auto_v463';
  const SCHEME_KEY = 'nutri_meal_planner_scheme_v463';

  const MEAL_SCHEMES = {
    '3': {
      id:'3', label:'3 приёма',
      meals:[
        {id:'breakfast', title:'Завтрак', quota:0.30, main:true},
        {id:'lunch', title:'Обед', quota:0.40, main:true},
        {id:'dinner', title:'Ужин', quota:0.30, main:true}
      ]
    },
    '4': {
      id:'4', label:'4 приёма',
      meals:[
        {id:'breakfast', title:'Завтрак', quota:0.25, main:true},
        {id:'lunch', title:'Обед', quota:0.35, main:true},
        {id:'snack', title:'Перекус', quota:0.10, main:false},
        {id:'dinner', title:'Ужин', quota:0.30, main:true}
      ]
    },
    '5': {
      id:'5', label:'5 приёмов',
      meals:[
        {id:'breakfast', title:'Завтрак', quota:0.20, main:true},
        {id:'second_breakfast', title:'Второй завтрак', quota:0.10, main:false},
        {id:'lunch', title:'Обед', quota:0.35, main:true},
        {id:'afternoon', title:'Полдник', quota:0.10, main:false},
        {id:'dinner', title:'Ужин', quota:0.25, main:true}
      ]
    },
    '5_late': {
      id:'5_late', label:'5 приёмов + поздний перекус',
      meals:[
        {id:'breakfast', title:'Завтрак', quota:0.20, main:true},
        {id:'second_breakfast', title:'Второй завтрак', quota:0.10, main:false},
        {id:'lunch', title:'Обед', quota:0.30, main:true},
        {id:'afternoon', title:'Полдник', quota:0.10, main:false},
        {id:'dinner', title:'Ужин', quota:0.25, main:true},
        {id:'late_snack', title:'Поздний перекус', quota:0.05, main:false, late:true}
      ]
    }
  };

  let needsTargets = null;
  let currentModel = null;
  let allocCounter = 1;
  let recalcTimer = null;

  document.addEventListener('needs:computed', function(ev){
    const d = ev && ev.detail ? ev.detail : {};
    const kcal = Number(d.energyLow || d.kcal || 0);
    const protein = Number(d.totalProtein || d.protein || 0);
    const fat = Number(d.fatGrams || d.fat || 0);
    const carbs = Number(d.carbGrams || d.carbs || 0);
    if (kcal > 0 || protein > 0) {
      needsTargets = { kcal, protein, fat, carbs, source:'needs' };
      if (currentModel) {
        try {
          const scheme = MEAL_SCHEMES[currentModel.schemeId] || MEAL_SCHEMES['4'];
          currentModel.targets = getTargets(currentModel.total || emptyNutrients(), scheme);
          analyzeModel(currentModel);
          saveModel(currentModel);
          renderMeals(currentModel);
        } catch(_) {}
      }
    }
  });

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
    });
  }
  function cssEsc(s){
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
    return String(s).replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
  }
  function round(n, d=0){ const x = Number(n) || 0; const p = Math.pow(10, d); return Math.round(x*p)/p; }
  function roundStep(n, step=5){ return Math.max(0, Math.round((Number(n)||0)/step)*step); }
  function grams(item){ return Math.max(0, Number(item && item.grams) || 0); }
  function byKey(key){ return DB && DB.byKey ? DB.byKey.get(key) : null; }
  function productName(p, fallback){ return (p && (p.name_ru || p.name)) || fallback || 'Продукт'; }
  function productText(p){
    if (!p) return '';
    const tags = Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags || '');
    return [p.key, p.name_ru, p.name, p.category, p.catalog_category_key, p.hei_category_key, Array.isArray(p.search_aliases) ? p.search_aliases.join(' ') : '', tags].filter(Boolean).join(' ').toLowerCase();
  }
  function per100(p, names){
    if (!p) return 0;
    for (const n of names){ const v = p[n]; if (typeof v === 'number' && Number.isFinite(v)) return v; }
    return 0;
  }
  function nutrientOf(key, g){
    const p = byKey(key); if (!p) return emptyNutrients();
    const f = (Number(g)||0) / 100;
    const salt = per100(p, ['salt_g','salt']);
    const sodium = per100(p, ['sodium_mg','sodium']);
    return {
      kcal: per100(p, ['kcal']) * f,
      protein_g: per100(p, ['protein_per_100g','protein_g','protein']) * f,
      fat_g: per100(p, ['fat_per_100g','fat_g','fat']) * f,
      carbs_g: per100(p, ['carbs_per_100g','carb_per_100g','carbs_g','carbs']) * f,
      sugars_g: per100(p, ['sugar_per_100g','sugars_per_100g','sugars_g','sugar']) * f,
      fiber_g: per100(p, ['fiber_per_100g','fiber_g','fiber']) * f,
      sfa_g: per100(p, ['sfa_per_100g','sfa_g','sfa']) * f,
      unsat_g: per100(p, ['unsat_per_100g','unsat_g','unsat']) * f,
      added_sugars_g: per100(p, ['added_sugars_per_100g','added_sugars_g','added_sugar']) * f,
      salt_g: salt * f,
      sodium_mg: (sodium || salt*393) * f,
      veg_cup_eq: Math.max(per100(p, ['veg_cup_eq_per_100g']), per100(p, ['greens_beans_cup_eq_per_100g'])) * f,
      fruit_cup_eq: Math.max(per100(p, ['fruit_cup_eq_per_100g']), per100(p, ['whole_fruit_cup_eq_per_100g'])) * f,
      whole_grain_oz_eq: per100(p, ['whole_grain_oz_eq_per_100g']) * f,
      refined_grain_oz_eq: per100(p, ['refined_grain_oz_eq_per_100g']) * f,
      protein_oz_eq: Math.max(per100(p, ['protein_oz_eq_per_100g']), per100(p, ['seafood_plant_oz_eq_per_100g'])) * f,
      dairy_cup_eq: per100(p, ['dairy_cup_eq_per_100g']) * f
    };
  }
  function emptyNutrients(){
    return {kcal:0,protein_g:0,fat_g:0,carbs_g:0,sugars_g:0,fiber_g:0,sfa_g:0,unsat_g:0,added_sugars_g:0,salt_g:0,sodium_mg:0,veg_cup_eq:0,fruit_cup_eq:0,whole_grain_oz_eq:0,refined_grain_oz_eq:0,protein_oz_eq:0,dairy_cup_eq:0};
  }
  function addNutrients(a,b){ for (const k of Object.keys(emptyNutrients())) a[k] = (a[k]||0) + (b[k]||0); return a; }
  function sumAllocations(list){ const t = emptyNutrients(); (list||[]).forEach(a => addNutrients(t, nutrientOf(a.key, a.g))); return t; }
  function currentRation(){ return rationForCalculationV5377(State && State.get ? State.get() : []).map(x=>({ key:x.key, grams:grams(x), parent_composite_id:x.parent_composite_id||null })).filter(x=>x.key && x.grams>0 && byKey(x.key)); }
  function rationHash(list){
    const src = list || currentRation();
    return JSON.stringify(src.map(x=>[x.key, Math.round(grams(x)*10)/10]).sort((a,b)=>a[0].localeCompare(b[0])));
  }
  function currentSchemeId(){
    const sel = document.getElementById('mealScheme');
    const raw = (sel && sel.value) || SafeStorage.getItem(SCHEME_KEY) || '4';
    return MEAL_SCHEMES[raw] ? raw : '4';
  }

  function classifyMealProduct(p){
    const text = productText(p);
    const hei = String((p && p.hei_category_key) || '').toLowerCase();
    const cat = String((p && (p.catalog_category_key || p.category)) || '').toLowerCase();
    const vegEq = Math.max(per100(p, ['veg_cup_eq_per_100g']), per100(p, ['greens_beans_cup_eq_per_100g']));
    const fruitEq = Math.max(per100(p, ['fruit_cup_eq_per_100g']), per100(p, ['whole_fruit_cup_eq_per_100g']));
    const wholeGrainEq = per100(p, ['whole_grain_oz_eq_per_100g']);
    const refinedGrainEq = per100(p, ['refined_grain_oz_eq_per_100g']);
    const proteinEq = Math.max(per100(p, ['protein_oz_eq_per_100g']), per100(p, ['seafood_plant_oz_eq_per_100g']));
    const dairyEq = per100(p, ['dairy_cup_eq_per_100g']);
    const protein100 = per100(p, ['protein_per_100g','protein_g','protein']);
    const addedSugar = per100(p, ['added_sugars_per_100g','added_sugars_g','added_sugar']);
    const sodium = per100(p, ['sodium_mg','sodium']) || per100(p, ['salt_g','salt'])*393;
    const fat = per100(p, ['fat_per_100g','fat_g','fat']);
    const sfa = per100(p, ['sfa_per_100g','sfa_g','sfa']);
    const saturatedFatRoute = isSaturatedFatRouteProduct(p);
    const proteinSupplementRoute = isProteinSupplementRouteProduct(p);
    const roles = {
      vegetable: vegEq > 0 || /овощ|vegetable|томат|помидор|огур|капуст|броккол|зелень|салат|морков|свекл|кабач|перец/.test(text) || hei === 'vegetables',
      fruit: fruitEq > 0 || /фрукт|fruit|яблок|банан|апельсин|мандарин|киви|груш|ягод|клубник|черник|виноград/.test(text) || hei === 'fruits_berries' || hei === 'fruits',
      wholeGrain: wholeGrainEq > 0 || hei === 'whole_grains' || /греч|овсян|булгур|киноа|бурый рис|цельнозерн/.test(text),
      refinedGrain: refinedGrainEq > 0 || hei === 'refined_grains' || /макарон|лапш|хлеб|рис|паста|булоч/.test(text),
      protein: !proteinSupplementRoute && (proteinEq > 0 || hei === 'protein_foods' || hei === 'seafood_plant_protein' || protein100 >= 10 || /яйц|куриц|индейк|говяд|рыб|лосос|тунец|треск|мяс|нут|чечевиц|фасол|тофу/.test(text)),
      dairy: !saturatedFatRoute && (dairyEq > 0 || hei === 'dairy' || (!proteinSupplementRoute && /творог|йогурт|кефир|молок|сыр|dairy|yogurt|milk|cheese|cottage/.test(text))),
      drink: /напит|вода|чай|кофе|сок|компот|drink|water|juice|tea|coffee/.test(text) || cat === 'drinks',
      condiment: (saturatedFatRoute || /масло|соль|сахар|соус|майонез|кетчуп|мед|мёд|варень/.test(text) || /(^|[_\s-])(oil|salt|sugar|sauce)([_\s-]|$)/.test(text) || ['olive_oil_evoo_other','sunflower_oil_other','sugar_white_other'].includes(p && p.key)),
      sweet: addedSugar >= 15 || cat === 'sweets' || /вафл|печен|конфет|шоколад|десерт|пирож|морожен|слад|зефир|мармелад|sweet|cookie|candy|dessert/.test(text),
      mixed: !proteinSupplementRoute && /пицц|шаурм|бургер|сэндвич|сырник|готов|кулинар|полуфабрикат|салат.*майонез|fast.?food|ready|pizza|shawarma|burger/.test(text) || cat === 'ready food / culinary' || cat === 'frozen / semi-finished' || cat === 'ready_food' || cat === 'semi_finished',
      fatAddon: (!saturatedFatRoute && (/орех|семеч|авокад|масло|олив/.test(text) || /(^|[_\s-])(nuts?|seeds?|oil|avocado|olive)([_\s-]|$)/.test(text) || (fat >= 30 && sfa < fat*0.45))),
      processedMeat: /колбас|сосиск|сардельк|бекон|ветчин|salami|sausage|bacon|ham/.test(text)
    };
    const explicitSugarAddon = /сахар|мед|мёд|варень/.test(text) || /(^|[_\s-])sugar([_\s-]|$)/.test(text) || (p && p.key === 'sugar_white_other');
    if ((roles.sweet || roles.mixed) && !explicitSugarAddon) roles.condiment = false;
    if (roles.sweet) roles.fatAddon = false;
    const mainRole = roles.condiment ? 'condiment' : roles.mixed ? 'mixed' : roles.sweet ? 'sweet' : roles.drink ? 'drink' : roles.fruit ? 'fruit' : roles.vegetable ? 'vegetable' : roles.dairy && protein100 < 12 ? 'dairy' : roles.protein ? 'protein' : roles.wholeGrain ? 'whole_grain' : roles.refinedGrain ? 'refined_grain' : roles.fatAddon ? 'fat_addon' : roles.dairy ? 'dairy' : 'other';
    return { roles, mainRole, addedSugar, sodium, vegEq, fruitEq, wholeGrainEq, refinedGrainEq, proteinEq, dairyEq, protein100, fat, sfa };
  }

  function hasServingUnits(p){ return !!(p && Array.isArray(p.serving_units) && p.serving_units.length); }
  function servingUnitLooksPieceLike(p){
    if (!hasServingUnits(p)) return false;
    return p.serving_units.some(u => /шт|яйц|филе|ломтик|кусок|батончик|булоч|сосиск|мандари|банан|яблок|порц/i.test([u.unit_type,u.label,u.display].filter(Boolean).join(' ')));
  }
  function isLikelyUndividable(p, g){
    const text = productText(p);
    if (servingUnitLooksPieceLike(p)) return true;
    if (/яйц|egg|банан|яблок|мандарин|апельсин|киви|груш|сырок|булоч|круассан|хлебец|сосиск|сардельк|печень|батончик/.test(text)) return true;
    if ((Number(g)||0) < 60) return true;
    return false;
  }
  function canAutoSplit(p, g){
    const c = classifyMealProduct(p);
    if (!p || (Number(g)||0) <= 0) return false;
    if (c.roles.condiment) return true;
    if (isLikelyUndividable(p, g)) return false;
    if (c.roles.sweet) return false;
    if (c.roles.dairy && /творог|йогурт|кефир|yogurt|cottage/.test(productText(p))) return true;
    if (c.roles.vegetable || c.roles.wholeGrain || c.roles.refinedGrain) return true;
    if (c.roles.mixed && (Number(g)||0) >= 350) return true;
    return (Number(g)||0) >= 280 && !c.roles.drink;
  }
  function canManualSplit(p, g){ if (!p || (Number(g)||0) < 20) return false; return canAutoSplit(p, g); }

  function deriveMealRole(p){
    const c = classifyMealProduct(p);
    const text = productText(p);
    let id = 'other', label = 'прочий продукт', anchor = false, addon = false;
    if (c.roles.condiment) { id = 'addon'; label = 'добавка к блюду'; addon = true; }
    else if (c.roles.mixed) { id = 'mixed_dish'; label = 'сложное блюдо'; anchor = true; }
    else if (c.roles.sweet) { id = 'sweet'; label = 'сладкий продукт'; }
    else if (c.roles.drink) { id = 'drink'; label = 'напиток'; }
    else if (c.roles.fruit) { id = 'fruit'; label = 'фруктовая часть'; }
    else if (c.roles.vegetable) { id = 'vegetable_side'; label = 'овощная часть'; }
    else if (c.roles.fatAddon) { id = 'fat_addon'; label = 'полезный жир / добавка'; addon = true; }
    else if (c.roles.dairy && /творог|йогурт|кефир|молок|cottage|yogurt|milk/.test(text)) { id = 'dairy_snack'; label = 'молочная основа'; anchor = true; }
    else if (c.roles.protein) { id = 'anchor_protein'; label = 'белковая основа'; anchor = true; }
    else if (c.roles.wholeGrain || c.roles.refinedGrain) { id = 'anchor_carb'; label = c.roles.wholeGrain ? 'углеводная основа' : 'злаковая основа'; anchor = true; }
    return { id, label, anchor, addon, roles:c.roles, mainRole:c.mainRole };
  }
  function roleLabel(p){ return deriveMealRole(p).label; }

  function getTargets(total, scheme){
    const hasNeeds = !!(needsTargets && (needsTargets.kcal > 0 || needsTargets.protein > 0));
    let targetKcal = hasNeeds && needsTargets.kcal > 0 ? needsTargets.kcal : total.kcal;
    if (!targetKcal || targetKcal < 1) targetKcal = total.kcal || 0;
    let targetProtein = hasNeeds && needsTargets.protein > 0 ? needsTargets.protein : total.protein_g;
    if (!targetProtein || targetProtein < 1) targetProtein = total.protein_g || 0;
    const perMeal = {};
    const mainCount = Math.max(1, scheme.meals.filter(m=>m.main).length);
    scheme.meals.forEach(m => {
      const proteinQuota = m.main ? Math.max(0.18, Math.min(0.38, m.quota + 0.04)) : Math.max(0.05, Math.min(0.18, m.quota * 0.7));
      perMeal[m.id] = { kcal: targetKcal * m.quota, pct:m.quota, protein: targetProtein * proteinQuota, mainProteinMin: m.main ? Math.max(14, targetProtein/mainCount*0.45) : 0 };
    });
    return { hasNeeds, kcal:targetKcal, protein:targetProtein, perMeal };
  }

  function emptyModel(schemeId, hash){
    const scheme = MEAL_SCHEMES[schemeId] || MEAL_SCHEMES['4'];
    return {
      version: VERSION,
      schemeId: scheme.id,
      rationHash: hash || rationHash(),
      createdAt: new Date().toISOString(),
      meals: scheme.meals.map(m => ({ id:m.id, title:m.title, targetKcalPct:m.quota, main:!!m.main, late:!!m.late, allocations:[] })),
      unassigned: [], warnings: [], suggestions: [], manualTouched: false
    };
  }
  function mealById(model, id){ return (model.meals||[]).find(m=>m.id===id) || null; }
  function addAllocation(model, mealId, allocation){
    const a = Object.assign({ id:'mpa_' + (allocCounter++), manual:false, origin:'auto' }, allocation);
    if (mealId === 'unassigned') model.unassigned.push(a);
    else {
      const meal = mealById(model, mealId) || model.meals[0];
      if (meal) meal.allocations.push(a); else model.unassigned.push(a);
    }
    return a;
  }
  function mealKcal(model, mealId){ const meal = mealById(model, mealId); return meal ? meal.allocations.reduce((sum,a)=>sum + nutrientOf(a.key, a.g).kcal, 0) : 0; }
  function mealTotals(model, mealId){ const meal = mealById(model, mealId); return meal ? sumAllocations(meal.allocations||[]) : emptyNutrients(); }
  function mealHasRole(model, mealId, role){
    const meal = mealById(model, mealId); if (!meal) return false;
    return (meal.allocations||[]).some(a=>{
      const p = byKey(a.key); const c = classifyMealProduct(p); const r = deriveMealRole(p);
      return c.mainRole === role || c.roles[role] || r.id === role;
    });
  }
  function mealRoleCount(model, mealId, role){
    const meal = mealById(model, mealId); if (!meal) return 0;
    return (meal.allocations||[]).filter(a=>{ const p=byKey(a.key); const c=classifyMealProduct(p); const r=deriveMealRole(p); return c.mainRole===role || c.roles[role] || r.id===role; }).length;
  }
  function isSnackMealId(id){ return id === 'snack' || id === 'afternoon' || id === 'second_breakfast' || id === 'late_snack'; }

  function baseAffinityForMeal(p, mealId){
    const c = classifyMealProduct(p); const text = productText(p); let s = 0.05;
    if (mealId === 'breakfast') {
      if (c.roles.dairy) s += 1.8;
      if (c.roles.wholeGrain || /овсян|каша|хлоп|тост|хлеб/.test(text)) s += 2.0;
      if (/яйц|egg/.test(text)) s += 2.5;
      if (c.roles.fruit) s += 1.1;
      if (c.roles.drink) s += 0.7;
      if (c.roles.vegetable) s += 0.6;
      if (c.roles.processedMeat) s += 0.4;
    }
    if (mealId === 'second_breakfast' || mealId === 'snack' || mealId === 'afternoon') {
      if (c.roles.fruit) s += 2.2;
      if (c.roles.dairy) s += 2.0;
      if (c.roles.sweet) s += 1.7;
      if (c.roles.fatAddon && !c.roles.condiment) s += 1.6;
      if (c.roles.drink) s += 0.8;
      if (c.roles.protein && !c.roles.mixed && !/мяс|куриц|говяд|рыб|fish|chicken|meat/.test(text)) s += 0.7;
      if (c.roles.vegetable) s += 0.3;
    }
    if (mealId === 'lunch') {
      if (c.roles.protein) s += 2.5;
      if (c.roles.vegetable) s += 2.2;
      if (c.roles.wholeGrain || c.roles.refinedGrain) s += 1.8;
      if (c.roles.mixed) s += 1.7;
      if (c.roles.condiment || c.roles.fatAddon) s += 1.0;
      if (c.roles.processedMeat) s += 0.5;
    }
    if (mealId === 'dinner') {
      if (c.roles.protein) s += 2.2;
      if (c.roles.vegetable) s += 2.3;
      if (c.roles.wholeGrain || c.roles.refinedGrain) s += 1.1;
      if (c.roles.mixed) s += 1.3;
      if (c.roles.condiment || c.roles.fatAddon) s += 1.0;
      if (c.roles.fruit) s += 0.4;
    }
    if (mealId === 'late_snack') {
      if (c.roles.dairy) s += 2.4;
      if (c.roles.fruit) s += 0.8;
      if (c.roles.fatAddon && !c.roles.condiment) s += 0.6;
      if (c.roles.sweet) s -= 0.1;
      if (c.roles.mixed || (c.roles.protein && /мяс|куриц|говяд|рыб|fish|chicken|meat/.test(text))) s -= 1.2;
    }
    if (c.roles.sweet && !isSnackMealId(mealId)) s -= 0.25;
    if ((c.roles.condiment || c.roles.fatAddon) && mealId === 'late_snack') s -= 0.9;
    if (c.roles.mixed && mealId === 'late_snack') s -= 1.5;
    return Math.max(0.01, s);
  }

  function scoreProductForMeal(model, scheme, item, mealId){
    const p = byKey(item.key); if (!p) return -Infinity;
    const c = classifyMealProduct(p); const r = deriveMealRole(p); const n = nutrientOf(item.key, item.grams || item.g || 0);
    const target = model.targets && model.targets.perMeal && model.targets.perMeal[mealId] ? model.targets.perMeal[mealId] : {kcal:0, protein:0};
    const current = mealTotals(model, mealId);
    const targetK = target.kcal || 0;
    let score = baseAffinityForMeal(p, mealId);
    if (targetK > 0){
      const projected = current.kcal + n.kcal;
      const ratioAfter = projected / targetK;
      if (ratioAfter <= 1.05) score += 0.65 * (1.05 - ratioAfter);
      if (ratioAfter > 1.18) score -= Math.min(1.4, (ratioAfter - 1.18) * 1.8);
      if (current.kcal < targetK * 0.55 && n.kcal > 80) score += 0.25;
    }
    if (r.id === 'anchor_protein'){
      if (!mealHasRole(model, mealId, 'protein')) score += 0.7;
      if (target.protein && current.protein_g > target.protein * 1.15) score -= 0.6;
    }
    if (r.id === 'anchor_carb'){
      if (mealHasRole(model, mealId, 'protein')) score += 0.35;
      if (mealHasRole(model, mealId, 'vegetable')) score += 0.25;
    }
    if (r.id === 'vegetable_side'){
      if (mealHasRole(model, mealId, 'protein') || mealHasRole(model, mealId, 'whole_grain') || mealHasRole(model, mealId, 'refined_grain') || mealHasRole(model, mealId, 'mixed_dish')) score += 0.75;
      if (mealId === 'lunch' || mealId === 'dinner') score += mealRoleCount(model, mealId, 'vegetable') ? 0.1 : 0.45;
    }
    if (r.id === 'fruit'){
      if (isSnackMealId(mealId) && !mealHasRole(model, mealId, 'fruit')) score += 0.55;
      if (mealHasRole(model, mealId, 'dairy')) score += 0.3;
    }
    if (r.id === 'dairy_snack'){
      if (isSnackMealId(mealId) || mealId === 'breakfast') score += 0.35;
      if (mealHasRole(model, mealId, 'fruit')) score += 0.25;
    }
    if (r.id === 'sweet'){
      if (isSnackMealId(mealId)) score += 1.15;
      else score -= 0.85;
      if (mealHasRole(model, mealId, 'dairy') || mealHasRole(model, mealId, 'fruit')) score += 0.35;
      if (current.added_sugars_g > 10) score -= 0.55;
    }
    if (r.addon){
      if (mealHasRole(model, mealId, 'vegetable') || mealHasRole(model, mealId, 'protein') || mealHasRole(model, mealId, 'whole_grain') || mealHasRole(model, mealId, 'refined_grain') || mealHasRole(model, mealId, 'mixed_dish')) score += 1.0;
      if (!(mealHasRole(model, mealId, 'vegetable') || mealHasRole(model, mealId, 'protein') || mealHasRole(model, mealId, 'whole_grain') || mealHasRole(model, mealId, 'refined_grain') || mealHasRole(model, mealId, 'mixed_dish'))) score -= 0.9;
    }
    if (mealId === 'late_snack' && n.kcal > 180) score -= 1.0;
    return score;
  }
  function chooseBestMeal(model, scheme, item, opts){
    opts = opts || {};
    let best = 'unassigned', bestScore = -Infinity;
    scheme.meals.forEach(m => {
      const score = scoreProductForMeal(model, scheme, item, m.id);
      if (score > bestScore){ bestScore = score; best = m.id; }
    });
    const p = byKey(item.key); const r = deriveMealRole(p);
    const minScore = opts.minScore != null ? opts.minScore : (r.id === 'other' ? 0.65 : 0.25);
    return bestScore >= minScore ? best : 'unassigned';
  }
  function chooseTopMeals(model, scheme, item, count){
    return scheme.meals.map(m=>({ id:m.id, score:scoreProductForMeal(model, scheme, item, m.id) })).sort((a,b)=>b.score-a.score).slice(0, count).map(x=>x.id);
  }
  function allocationReason(p, mealId){
    const c = classifyMealProduct(p); const r = deriveMealRole(p); const where = mealId && mealId !== 'unassigned' ? ' в этот приём' : '';
    if (r.id === 'addon') return 'добавка: прикреплена к блюду или приёму, где есть основа; сама по себе не образует приём пищи';
    if (r.id === 'mixed_dish') return 'сложное блюдо: размещено как самостоятельная основа, состав оценивается приблизительно';
    if (r.id === 'sweet') return 'сладкий продукт: чаще попадает в перекус и требует проверки добавленного сахара';
    if (r.id === 'fruit') return 'фруктовая часть: чаще подходит к завтраку или перекусу';
    if (r.id === 'vegetable_side') return 'овощная часть: алгоритм старается присоединить её к обеду или ужину';
    if (r.id === 'dairy_snack') return 'молочная основа: подходит к завтраку, перекусу или позднему перекусу';
    if (r.id === 'anchor_protein') return 'белковая основа: алгоритм распределяет такие продукты между основными приёмами';
    if (r.id === 'anchor_carb') return 'углеводная основа: размещена с учётом калорийной квоты и возможного сочетания с белком/овощами';
    if (r.id === 'fat_addon') return 'жировая добавка: лучше сочетать с салатом, гарниром или основным блюдом';
    if (c.roles.drink) return 'напиток: размещён отдельно от основной еды, проверьте фактический режим';
    return 'размещено' + where + ' по калорийной квоте и общим признакам продукта';
  }

  function generateMealDraft(schemeId, previousModel, preserveManual){
    const scheme = MEAL_SCHEMES[schemeId] || MEAL_SCHEMES['4'];
    const ration = currentRation();
    const hash = rationHash(ration);
    const model = emptyModel(scheme.id, hash);
    const total = sumAllocations(ration.map(x=>({key:x.key, g:x.grams})));
    model.total = total;
    model.targets = getTargets(total, scheme);
    if (!ration.length){ model.empty = true; return model; }

    const previousManual = preserveManual ? collectManualAllocations(previousModel, ration) : null;
    const handled = new Set();
    if (previousManual){
      previousManual.forEach(group => { group.allocations.forEach(a => addAllocation(model, a.mealId, a)); handled.add(group.key); });
    }

    const items = ration.filter(x => !handled.has(x.key)).map(x => ({ key:x.key, grams:roundStep(x.grams, 5) || x.grams, role:deriveMealRole(byKey(x.key)), n:nutrientOf(x.key, x.grams) }));
    const anchors = items.filter(x => x.role.anchor && !x.role.addon).sort((a,b)=>b.n.kcal-a.n.kcal);
    const sides = items.filter(x => !x.role.anchor && !x.role.addon && (x.role.id === 'vegetable_side' || x.role.id === 'fruit' || x.role.id === 'sweet' || x.role.id === 'drink')).sort((a,b)=>b.n.kcal-a.n.kcal);
    const other = items.filter(x => !x.role.anchor && !x.role.addon && !sides.includes(x)).sort((a,b)=>b.n.kcal-a.n.kcal);
    const addons = items.filter(x => x.role.addon).sort((a,b)=>b.n.kcal-a.n.kcal);

    anchors.forEach(item => placeSmartItem(model, scheme, item, { allowSplit:true, phase:'anchor' }));
    sides.forEach(item => placeSmartItem(model, scheme, item, { allowSplit:true, phase:'side' }));
    other.forEach(item => placeSmartItem(model, scheme, item, { allowSplit:false, phase:'other' }));
    addons.forEach(item => placeCondiment(model, scheme, item));

    normalizeAllocations(model);
    analyzeModel(model);
    return model;
  }

  function placeSmartItem(model, scheme, item, opts){
    const p = byKey(item.key); const g = item.grams; const n = nutrientOf(item.key, g); const r = deriveMealRole(p);
    const allowSplit = opts && opts.allowSplit;
    if (allowSplit && canAutoSplit(p, g) && g >= 240 && n.kcal >= 220 && r.id !== 'mixed_dish'){
      const top = chooseTopMeals(model, scheme, item, 2).filter(Boolean);
      const firstG = roundStep(g * 0.6, 5);
      const secondG = Math.max(0, roundStep(g - firstG, 5));
      addAllocation(model, top[0] || chooseBestMeal(model, scheme, item), { key:item.key, g:firstG, productKind:classifyMealProduct(p).mainRole, mealRole:r.id, split:true, reason:allocationReason(p, top[0]), roleLabel:r.label });
      if (secondG > 0) addAllocation(model, top[1] || top[0] || chooseBestMeal(model, scheme, item), { key:item.key, g:secondG, productKind:classifyMealProduct(p).mainRole, mealRole:r.id, split:true, reason:allocationReason(p, top[1] || top[0]), roleLabel:r.label });
    } else {
      const slot = chooseBestMeal(model, scheme, item, { minScore:r.id==='other'?0.75:0.2 });
      addAllocation(model, slot, { key:item.key, g:g, productKind:classifyMealProduct(p).mainRole, mealRole:r.id, reason: slot==='unassigned' ? 'оставлено для ручной проверки: алгоритм не нашёл уверенного места' : allocationReason(p, slot), noAutoSplit: !canAutoSplit(p,g), roleLabel:r.label });
    }
  }

  function collectManualAllocations(previousModel, ration){
    if (!previousModel || !Array.isArray(previousModel.meals)) return null;
    const rationMap = new Map(ration.map(x=>[x.key, x.grams]));
    const grouped = new Map();
    function take(list, mealId){
      (list||[]).forEach(a=>{
        if (!a || !a.key || !a.manual || !rationMap.has(a.key)) return;
        if (!grouped.has(a.key)) grouped.set(a.key, []);
        grouped.get(a.key).push(Object.assign({}, a, { mealId }));
      });
    }
    previousModel.meals.forEach(m => take(m.allocations, m.id));
    take(previousModel.unassigned, 'unassigned');
    const out = [];
    grouped.forEach((list, key)=>{
      const oldTotal = list.reduce((s,a)=>s+(Number(a.g)||0),0);
      const newTotal = Number(rationMap.get(key)) || 0;
      if (oldTotal <= 0 || newTotal <= 0) return;
      let used = 0;
      const scaled = list.map((a, idx)=>{
        const g = idx === list.length-1 ? Math.max(0, roundStep(newTotal - used, 5)) : roundStep((Number(a.g)||0) * newTotal / oldTotal, 5);
        used += g;
        return Object.assign({}, a, { id:'mpa_' + (allocCounter++), g, manual:true, origin:'manual_saved', reason:'ручное размещение сохранено после обновления' });
      }).filter(a=>a.g>0);
      if (scaled.length) out.push({ key, allocations:scaled });
    });
    return out;
  }

  function placeCondiment(model, scheme, item){
    const p = byKey(item.key); const text = productText(p);
    let candidates = [];
    if ((/сахар|мед|мёд|варень/.test(text) || /(^|[_\s-])sugar([_\s-]|$)/.test(text))){
      candidates = mealsWithRole(model, 'drink').concat(mealsWithRole(model, 'dairy'), mealsWithRole(model, 'fruit'));
      if (!candidates.length) candidates = scheme.meals.filter(m=>['snack','afternoon','second_breakfast','breakfast'].includes(m.id)).map(m=>m.id);
    } else if ((/масло|соус|соль|майонез|кетчуп/.test(text) || /(^|[_\s-])(oil|sauce|salt)([_\s-]|$)/.test(text))){
      candidates = mealsWithRole(model, 'vegetable').concat(mealsWithRole(model, 'whole_grain'), mealsWithRole(model, 'refined_grain'), mealsWithRole(model, 'protein'), mealsWithRole(model, 'mixed_dish'));
      candidates = Array.from(new Set(candidates)).filter(Boolean);
      if (!candidates.length) candidates = scheme.meals.filter(m=>['lunch','dinner'].includes(m.id)).map(m=>m.id);
    } else if ((/орех|семеч|авокад/.test(text) || /(^|[_\s-])(nuts?|seeds?|avocado)([_\s-]|$)/.test(text))){
      candidates = scheme.meals.filter(m=>isSnackMealId(m.id) || m.id==='breakfast').map(m=>m.id);
    }
    candidates = Array.from(new Set(candidates)).filter(Boolean);
    if (!candidates.length){
      addAllocation(model, 'unassigned', { key:item.key, g:item.grams, productKind:classifyMealProduct(p).mainRole, mealRole:deriveMealRole(p).id, reason:'добавка оставлена для ручной привязки к блюду', roleLabel:roleLabel(p) });
      return;
    }
    let left = roundStep(item.grams, 1) || item.grams;
    const step = (/сахар|масло|соль/.test(text) || /(^|[_\s-])(sugar|oil|salt)([_\s-]|$)/.test(text)) ? 5 : Math.max(5, Math.round(left / candidates.length));
    let i = 0;
    while (left > 0 && candidates.length && i < 200){
      const mealId = candidates[i % candidates.length];
      const g = Math.min(step, left);
      addAllocation(model, mealId, { key:item.key, g, productKind:classifyMealProduct(p).mainRole, mealRole:deriveMealRole(p).id, reason:allocationReason(p, mealId), roleLabel:roleLabel(p) });
      left = round(left - g, 2); i++;
    }
  }
  function mealsWithRole(model, role){
    const out=[];
    (model.meals||[]).forEach(m=>{ if (mealHasRole(model, m.id, role)) out.push(m.id); });
    return out;
  }
  function normalizeAllocations(model){
    function normalizeList(list){ const out=[]; (list||[]).forEach(a=>{ a.g = Math.max(0, roundStep(a.g, 1)); if (a.g > 0) out.push(a); }); return out; }
    model.meals.forEach(m=>m.allocations = normalizeList(m.allocations));
    model.unassigned = normalizeList(model.unassigned);
  }

  function analyzeModel(model){
    const scheme = MEAL_SCHEMES[model.schemeId] || MEAL_SCHEMES['4'];
    const total = sumAllocations([].concat(...model.meals.map(m=>m.allocations), model.unassigned||[]));
    model.total = total;
    model.targets = model.targets || getTargets(total, scheme);
    const daySodium = total.sodium_mg || 0, daySfa = total.sfa_g || 0, dayProtein = total.protein_g || 0, dayAddedSugar = total.added_sugars_g || 0;
    const lunchDinner = new Set(['lunch','dinner']);

    model.meals.forEach(meal => {
      const t = sumAllocations(meal.allocations || []);
      const target = model.targets.perMeal && model.targets.perMeal[meal.id] ? model.targets.perMeal[meal.id] : {kcal:0,pct:meal.targetKcalPct,protein:0};
      const warn = [], info = [];
      const mealHasItems = (meal.allocations||[]).length > 0;
      const targetK = target.kcal || 0;
      const ratio = targetK > 0 ? t.kcal / targetK : 0;
      const sweetItems = (meal.allocations||[]).filter(a => classifyMealProduct(byKey(a.key)).roles.sweet);
      const hasProtein = mealHasRole(model, meal.id, 'protein') || mealHasRole(model, meal.id, 'anchor_protein') || t.protein_g >= 12;
      const hasVeg = t.veg_cup_eq >= 0.05;
      const hasFruit = t.fruit_cup_eq >= 0.05;
      if (mealHasItems && targetK > 0 && ratio < 0.70) warn.push('Калорийность заметно ниже ориентира для этой схемы дня.');
      if (mealHasItems && targetK > 0 && ratio > 1.30) warn.push('Калорийность заметно выше ориентира для этой схемы дня.');
      if (meal.main && mealHasItems){
        const proteinThreshold = target.mainProteinMin || (model.targets.protein ? Math.max(14, model.targets.protein / Math.max(3, scheme.meals.filter(m=>m.main).length) * 0.45) : 14);
        if (t.protein_g < proteinThreshold) warn.push('Белка маловато для основного приёма пищи.');
      }
      if (lunchDinner.has(meal.id) && mealHasItems && total.veg_cup_eq > 0.15 && !hasVeg) warn.push('Овощей нет или почти нет в этом основном приёме.');
      if (t.added_sugars_g >= 15 || (t.kcal > 0 && t.added_sugars_g*4/t.kcal > 0.20)) warn.push('Высокая доля добавленного сахара в этом приёме.');
      if (isSnackMealId(meal.id) && mealHasItems && sweetItems.length && (!hasProtein && !hasFruit) && t.kcal > 120) warn.push('Перекус почти полностью сладкий: лучше соединить его с молочным, белковым или фруктовым продуктом, если это соответствует реальному приёму пищи.');
      if (daySodium > 0 && t.sodium_mg > Math.max(800, daySodium*0.40)) warn.push('Этот приём даёт много натрия. Проверьте сыр, колбасу, соусы или готовые продукты.');
      if (daySfa > 0 && t.sfa_g > Math.max(8, daySfa*0.40)) warn.push('Высокая доля насыщенных жиров в этом приёме.');
      if (meal.late && t.kcal > Math.max(180, targetK*1.3)) warn.push('Поздний перекус получился тяжёлым. Проверьте, не лучше ли перенести часть продуктов в ужин или полдник.');
      if ((meal.allocations||[]).some(a => classifyMealProduct(byKey(a.key)).roles.mixed)) info.push('Есть сложное блюдо: оценка состава приёма приблизительная.');
      if ((meal.allocations||[]).some(a => a.noAutoSplit)) info.push('Штучные или порционные продукты не дробились автоматически.');
      if (mealHasItems && (hasProtein || hasVeg || hasFruit)) info.push(['структура:', hasProtein?'есть белковая часть':null, hasVeg?'есть овощная часть':null, hasFruit?'есть фруктовая часть':null].filter(Boolean).join(' '));
      if (!mealHasItems) info.push('Приём пока пустой. При необходимости переместите сюда продукты вручную.');
      meal.totals = t; meal.targetKcal = targetK; meal.kcalRatio = ratio; meal.warnings = warn; meal.info = info; meal.status = warn.length >= 2 ? 'bad' : warn.length ? 'warn' : 'ok';
    });

    const summary = [], suggestions = [];
    const proteinByMeal = model.meals.map(m=>({ title:m.title, id:m.id, protein:(m.totals&&m.totals.protein_g)||0 })).sort((a,b)=>b.protein-a.protein);
    if (dayProtein > 0 && proteinByMeal[0] && proteinByMeal[0].protein/dayProtein > 0.55) {
      summary.push('Белок распределён неравномерно: большая часть пришлась на ' + proteinByMeal[0].title.toLowerCase() + '.');
      suggestions.push('Белок сосредоточен в одном приёме. Если это расходится с реальным днём, перенесите часть делимого белкового продукта в завтрак или обед.');
    } else if (dayProtein > 0) summary.push('Белок распределён без выраженной концентрации в одном приёме.');
    const vegMainCount = model.meals.filter(m=>lunchDinner.has(m.id) && m.totals && m.totals.veg_cup_eq >= 0.05).length;
    if (total.veg_cup_eq > 0.15) {
      summary.push('Овощи есть в ' + vegMainCount + ' из 2 основных приёмов обед/ужин.');
      if (vegMainCount < 2) suggestions.push('Овощная часть распределена неравномерно. Можно вручную перенести часть овощей к тому основному приёму, где их нет.');
    }
    const sweetMeals = model.meals.filter(m=>m.totals && m.totals.added_sugars_g >= 10);
    if (dayAddedSugar > 0 && sweetMeals.length) {
      summary.push('Добавленный сахар заметнее всего в приёмах: ' + sweetMeals.map(m=>m.title.toLowerCase()).join(', ') + '.');
      if (sweetMeals.some(m=>isSnackMealId(m.id))) suggestions.push('Сладкий перекус лучше проверить вручную: при наличии йогурта, творога или фрукта его можно соединить с ними вместо отдельного сладкого блока.');
    }
    const sodiumTop = model.meals.map(m=>({title:m.title, sodium:(m.totals&&m.totals.sodium_mg)||0})).sort((a,b)=>b.sodium-a.sodium)[0];
    if (daySodium > 0 && sodiumTop && sodiumTop.sodium/daySodium > 0.45) {
      summary.push('Натрий сильно сконцентрирован в приёме: ' + sodiumTop.title.toLowerCase() + '.');
      suggestions.push('Проверьте приём с высоким натрием: чаще всего вклад дают сыр, колбаса, соусы, полуфабрикаты или готовые блюда.');
    }
    const allAllocs = [].concat(...model.meals.map(m=>m.allocations), model.unassigned||[]);
    const complexCount = allAllocs.filter(a=>classifyMealProduct(byKey(a.key)).roles.mixed).length;
    if (complexCount) {
      summary.push('Есть сложные блюда: ' + complexCount + ' поз.; их распределение нужно проверить вручную.');
      suggestions.push('Сложные блюда лучше оставлять цельными приёмами или вручную проверять их сочетание с овощами и гарниром.');
    }
    const condimentUnassigned = (model.unassigned||[]).filter(a=>deriveMealRole(byKey(a.key)).addon).length;
    if (condimentUnassigned) suggestions.push('Часть добавок не привязалась к блюдам. Их лучше вручную прикрепить к салату, гарниру или основному продукту.');
    if (!summary.length) summary.push('Выраженных перекосов по распределению дня не найдено.');
    if (!suggestions.length) suggestions.push('Грубых действий для исправления не найдено. Проверьте вручную, совпадает ли черновик с реальными блюдами и режимом дня.');
    model.daySummary = summary;
    model.suggestions = suggestions.slice(0, 6);
    model.warnings = model.meals.flatMap(m => (m.warnings||[]).map(w => ({ mealId:m.id, meal:m.title, text:w })));
    return model;
  }

  function findAllocation(model, id){
    for (const meal of model.meals || []){ const idx = (meal.allocations||[]).findIndex(a=>a.id===id); if (idx >= 0) return { container:meal, list:meal.allocations, idx, allocation:meal.allocations[idx], mealId:meal.id }; }
    const ui = (model.unassigned||[]).findIndex(a=>a.id===id); if (ui >= 0) return { container:null, list:model.unassigned, idx:ui, allocation:model.unassigned[ui], mealId:'unassigned' };
    return null;
  }
  function moveAllocation(id, targetMealId){
    if (!currentModel) return;
    const found = findAllocation(currentModel, id); if (!found) return;
    const a = found.list.splice(found.idx,1)[0];
    a.manual = true; a.origin = 'manual'; a.reason = 'перемещено вручную';
    addAllocation(currentModel, targetMealId, a);
    analyzeModel(currentModel); saveModel(currentModel); renderMeals(currentModel);
  }
  function splitAllocation(id, gramsToMove, targetMealId){
    if (!currentModel) return;
    const found = findAllocation(currentModel, id); if (!found) return;
    const a = found.allocation; const p = byKey(a.key);
    if (!canManualSplit(p, a.g)) return;
    let g = roundStep(Number(gramsToMove)||0, 5); if (g <= 0 || g >= a.g) return;
    a.g = roundStep(a.g - g, 5); a.manual = true; a.origin = 'manual';
    addAllocation(currentModel, targetMealId, Object.assign({}, a, { id:'mpa_' + (allocCounter++), g, manual:true, origin:'manual_split', reason:'часть порции перенесена вручную' }));
    normalizeAllocations(currentModel); analyzeModel(currentModel); saveModel(currentModel); renderMeals(currentModel);
  }

  function saveModel(model){ try { SafeStorage.setItem(STORAGE_KEY, JSON.stringify(model)); } catch(_) {} }
  function loadModel(){
    try { const raw = SafeStorage.getItem(STORAGE_KEY); if (!raw) return null; const model = JSON.parse(raw); if (!model || model.version !== VERSION || !Array.isArray(model.meals)) return null; return model; } catch(_) { return null; }
  }
  function resetModel(){ currentModel = null; try { SafeStorage.removeItem(STORAGE_KEY); } catch(_) {} renderMeals(null); updateControls(); }
  function updateControls(){
    const has = currentRation().length > 0;
    ['distributeBtn','mealRefreshBtn','mealResetBtn'].forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled = id==='mealResetBtn' ? !currentModel : !has; });
    const badge = document.getElementById('mealsStaleBadge'); if (badge) badge.style.display = currentModel && currentModel.rationHash !== rationHash() ? 'inline-flex' : 'none';
  }
  function scheduleAutoRefresh(){
    const auto = SafeStorage.getItem(AUTO_KEY) === '1'; if (!auto || !currentModel) return;
    clearTimeout(recalcTimer); recalcTimer = setTimeout(()=>{ currentModel = generateMealDraft(currentModel.schemeId || currentSchemeId(), currentModel, true); saveModel(currentModel); renderMeals(currentModel); }, 350);
  }

  function targetOptionsHtml(current){
    const scheme = MEAL_SCHEMES[currentModel && currentModel.schemeId || currentSchemeId()] || MEAL_SCHEMES['4'];
    const opts = scheme.meals.map(m=>`<option value="${esc(m.id)}"${m.id===current?' selected':''}>${esc(m.title)}</option>`).join('');
    return opts + `<option value="unassigned"${current==='unassigned'?' selected':''}>Нераспределённые</option>`;
  }
  function mealStatusLabel(status){ if (status === 'ok') return 'близко к цели'; if (status === 'bad') return 'выраженный перекос'; return 'нужно проверить'; }
  function fmtTotals(t){ return `${round(t.kcal,0)} ккал · Б ${round(t.protein_g,1)} г · Ж ${round(t.fat_g,1)} г · У ${round(t.carbs_g,1)} г`; }
  function renderAllocation(a, currentMealId){
    const p = byKey(a.key); const name = productName(p, a.key); const n = nutrientOf(a.key, a.g); const c = classifyMealProduct(p); const canSplit = canManualSplit(p, a.g); const r = deriveMealRole(p);
    const splitHtml = canSplit ? `
      <details class="meal-split-box">
        <summary>Разделить порцию</summary>
        <div class="meal-split-controls">
          <input class="meal-split-grams" data-split-grams-for="${esc(a.id)}" type="number" min="5" max="${Math.max(5, roundStep(a.g-5,5))}" step="5" value="${Math.min(50, Math.max(5, roundStep(a.g/2,5)))}" aria-label="Граммы для переноса">
          <select data-split-target-for="${esc(a.id)}" aria-label="Куда перенести часть порции">${targetOptionsHtml(currentMealId)}</select>
          <button class="secondary meal-action-btn" data-meal-action="split" data-allocation-id="${esc(a.id)}" type="button">Перенести часть</button>
        </div>
      </details>` : `<div class="meal-item-note">Этот продукт лучше не делить автоматически: он штучный, порционный или слишком маленький.</div>`;
    const badges = [a.roleLabel || r.label];
    if (c.roles.mixed) badges.push('сложное блюдо');
    if (c.roles.sweet) badges.push('сахар');
    if (a.manual) badges.push('вручную');
    if (a.split) badges.push('разделено');
    return `
      <article class="meal-item meal-planner-item" data-allocation-id="${esc(a.id)}">
        <div class="meal-item-main">
          <div>
            <div class="meal-item-name">${esc(name)}</div>
            <div class="meal-item-meta">${round(a.g,0)} г · ${round(n.kcal,0)} ккал · ${badges.map(x=>`<span class="meal-role-badge">${esc(x)}</span>`).join(' ')}</div>
          </div>
          <div class="meal-move-controls">
            <select data-move-target-for="${esc(a.id)}" aria-label="Куда переместить продукт">${targetOptionsHtml(currentMealId)}</select>
            <button class="secondary meal-action-btn" data-meal-action="move" data-allocation-id="${esc(a.id)}" type="button">Переместить</button>
          </div>
        </div>
        <details class="meal-why"><summary>Почему здесь?</summary><div>${esc(a.reason || allocationReason(p, currentMealId))}</div></details>
        ${splitHtml}
      </article>`;
  }
  function renderMealCard(meal){
    const t = meal.totals || sumAllocations(meal.allocations || []);
    const pct = currentModel && currentModel.total && currentModel.total.kcal ? Math.round(t.kcal/currentModel.total.kcal*100) : 0;
    const warnings = (meal.warnings||[]).map(w=>`<li>${esc(w)}</li>`).join('');
    const info = (meal.info||[]).map(w=>`<li>${esc(w)}</li>`).join('');
    const items = (meal.allocations||[]).map(a=>renderAllocation(a, meal.id)).join('') || '<div class="meal-empty">Продукты не распределены.</div>';
    return `
      <section class="card meal-slot meal-slot--${esc(meal.status||'ok')}">
        <div class="meal-slot-head">
          <div>
            <h3>${esc(meal.title)}</h3>
            <div class="meal-target-line">Цель: ${round((meal.targetKcalPct||0)*100,0)}% калорий дня · факт: ${pct}%</div>
          </div>
          <div class="meal-slot-kpi">
            <strong>${fmtTotals(t)}</strong>
            <span class="meal-status meal-status--${esc(meal.status||'ok')}">${esc(mealStatusLabel(meal.status))}</span>
          </div>
        </div>
        ${warnings ? `<ul class="meal-warnings">${warnings}</ul>` : ''}
        ${info ? `<ul class="meal-info">${info}</ul>` : ''}
        <div class="meal-items-list">${items}</div>
      </section>`;
  }
  function renderUnassigned(model){
    const list = model && model.unassigned ? model.unassigned : [];
    if (!list.length) return '';
    return `
      <section class="card meal-unassigned">
        <h3>Нераспределённые продукты</h3>
        <p class="meal-muted">Эти продукты учтены в общем рационе, но не попали в черновик распределения или были вынесены вручную.</p>
        <div class="meal-items-list">${list.map(a=>renderAllocation(a, 'unassigned')).join('')}</div>
      </section>`;
  }
  function renderMeals(model){
    const root = document.getElementById('mealsOut'); if (!root) return;
    updateControls();
    const ration = currentRation();
    if (!ration.length){ root.innerHTML = '<div class="meal-empty-state">Добавьте продукты в итоговый рацион, чтобы сделать черновик распределения по приёмам пищи.</div>'; return; }
    if (!model){ root.innerHTML = '<div class="meal-empty-state">Рацион уже собран. Нажмите «Сделать черновик», чтобы примерно разложить его по дню.</div>'; return; }
    analyzeModel(model);
    const stale = model.rationHash !== rationHash();
    const targetNote = model.targets && model.targets.hasNeeds ? 'Ориентиры сверяются с рассчитанными потребностями.' : 'Потребности не рассчитаны: ориентиры построены от фактической калорийности текущего рациона.';
    const summary = (model.daySummary||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    const suggestions = (model.suggestions||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    const staleHtml = stale ? `
      <div class="meal-stale-box">
        <strong>Черновик устарел:</strong> рацион изменился после распределения.
        <div class="meal-stale-actions">
          <button class="secondary" data-meal-action="update-preserve" type="button">Обновить с сохранением ручных перемещений</button>
          <button class="secondary" data-meal-action="update-new" type="button">Создать заново</button>
          <button class="ghost" data-meal-action="keep-stale" type="button">Оставить как есть</button>
        </div>
      </div>` : '';
    root.innerHTML = `
      ${staleHtml}
      <section class="meal-day-summary">
        <div class="meal-day-summary-head"><strong>По распределению дня</strong><span>${esc(targetNote)}</span></div>
        <ul>${summary}</ul>
      </section>
      <section class="meal-suggestions"><strong>Что можно поправить вручную</strong><ul>${suggestions}</ul></section>
      <div class="meal-grid">${model.meals.map(renderMealCard).join('')}</div>
      ${renderUnassigned(model)}
      <p class="meal-footnote">Черновик построен автоматически. Проверьте блюда, порции и удобство вручную: алгоритм не учитывает ваш фактический режим, рецепты и предпочтения.</p>`;
    updateControls();
  }

  function initMeals(){
    const section = document.getElementById('mealsSection');
    const sel = document.getElementById('mealScheme');
    const btn = document.getElementById('distributeBtn');
    const refreshBtn = document.getElementById('mealRefreshBtn');
    const resetBtn = document.getElementById('mealResetBtn');
    const autoTgl = document.getElementById('mealsAutoToggle');
    const out = document.getElementById('mealsOut');
    if (!section || !sel || !btn || !out) return;
    const savedScheme = SafeStorage.getItem(SCHEME_KEY);
    sel.value = MEAL_SCHEMES[savedScheme] ? savedScheme : '4';
    if (autoTgl) autoTgl.checked = SafeStorage.getItem(AUTO_KEY) === '1';
    currentModel = loadModel();
    if (currentModel){ if (!MEAL_SCHEMES[currentModel.schemeId]) currentModel.schemeId = '4'; sel.value = currentModel.schemeId; analyzeModel(currentModel); }
    renderMeals(currentModel);
    btn.addEventListener('click', function(){ const schemeId = currentSchemeId(); SafeStorage.setItem(SCHEME_KEY, schemeId); currentModel = generateMealDraft(schemeId, null, false); saveModel(currentModel); renderMeals(currentModel); });
    if (refreshBtn) refreshBtn.addEventListener('click', function(){ const schemeId = currentSchemeId(); currentModel = generateMealDraft(schemeId, currentModel, true); saveModel(currentModel); renderMeals(currentModel); });
    if (resetBtn) resetBtn.addEventListener('click', resetModel);
    sel.addEventListener('change', function(){ SafeStorage.setItem(SCHEME_KEY, currentSchemeId()); if (currentModel){ currentModel = generateMealDraft(currentSchemeId(), currentModel, true); saveModel(currentModel); renderMeals(currentModel); } });
    if (autoTgl) autoTgl.addEventListener('change', function(){ SafeStorage.setItem(AUTO_KEY, autoTgl.checked ? '1' : '0'); if (autoTgl.checked) scheduleAutoRefresh(); });
    out.addEventListener('click', function(e){
      const b = e.target.closest('[data-meal-action]'); if (!b) return;
      const action = b.getAttribute('data-meal-action'); const id = b.getAttribute('data-allocation-id');
      if (action === 'move'){ const target = out.querySelector(`[data-move-target-for="${cssEsc(id)}"]`); moveAllocation(id, target ? target.value : 'unassigned'); }
      if (action === 'split'){ const gramsEl = out.querySelector(`[data-split-grams-for="${cssEsc(id)}"]`); const targetEl = out.querySelector(`[data-split-target-for="${cssEsc(id)}"]`); splitAllocation(id, gramsEl ? gramsEl.value : 0, targetEl ? targetEl.value : 'unassigned'); }
      if (action === 'update-preserve'){ currentModel = generateMealDraft(currentSchemeId(), currentModel, true); saveModel(currentModel); renderMeals(currentModel); }
      if (action === 'update-new'){ currentModel = generateMealDraft(currentSchemeId(), null, false); saveModel(currentModel); renderMeals(currentModel); }
      if (action === 'keep-stale'){ const box = out.querySelector('.meal-stale-box'); if (box) box.style.display = 'none'; }
    });
    Events.on('change', function(){ updateControls(); if (SafeStorage.getItem(AUTO_KEY) === '1') scheduleAutoRefresh(); else renderMeals(currentModel); });
  }

  function runTests(){
    const tests = [];
    function push(name, pass, detail){ tests.push({test:name, pass:!!pass, detail:detail||''}); }
    const egg = DB.items.find(p=>/яйц|egg/i.test(p.name_ru||p.name||''));
    const banana = DB.items.find(p=>/банан|banana/i.test(p.name_ru||p.name||''));
    const oil = DB.items.find(p=>/масло|oil/i.test(p.name_ru||p.name||''));
    const sweet = DB.items.find(p=>/вафл|шоколад|десерт|слад/i.test(p.name_ru||p.name||'') || /waffle|dessert|sweet|cookie/i.test(p.key||p.name||''));
    push('v4.6.3 meal planner intelligence loaded', window.__V463_MEAL_PLANNER__ === VERSION, window.__V463_MEAL_PLANNER__);
    push('meal planner section is inside Дополнительно', !!(document.getElementById('additionalToolsSection') && document.getElementById('additionalToolsSection').contains(document.getElementById('mealsSection'))));
    push('default scheme can be 4 meals', !!MEAL_SCHEMES['4'] && MEAL_SCHEMES['4'].meals.length === 4);
    push('late snack is separate scheme', !!MEAL_SCHEMES['5_late'] && MEAL_SCHEMES['5_late'].meals.some(m=>m.id==='late_snack'));
    push('egg is not auto-splittable', egg ? !canAutoSplit(egg, 110) : true, egg && egg.key);
    push('banana is not auto-splittable', banana ? !canAutoSplit(banana, 118) : true, banana && banana.key);
    push('deriveMealRole available', typeof deriveMealRole === 'function', typeof deriveMealRole);
    push('oil recognized as addon when present', oil ? deriveMealRole(oil).addon === true : true, oil && oil.key);
    push('sweet recognized as sweet when present', sweet ? deriveMealRole(sweet).id === 'sweet' || classifyMealProduct(sweet).roles.sweet : true, sweet && sweet.key);
    push('planner does not mutate State API', !!(State && typeof State.get === 'function' && typeof State.update === 'function'));
    return tests;
  }

  window.__V463_MEAL_PLANNER__ = VERSION;
  window.MealPlannerV463 = { schemes:MEAL_SCHEMES, classifyMealProduct, deriveMealRole, canAutoSplit, canManualSplit, generateMealDraft, renderMeals, rationHash, scoreProductForMeal };
  window.runV463MealPlannerTests = runTests;
  window.runV462MealPlannerTests = runTests;
  initMeals();
})(); // end meal planner v4.6.3


  const ACTIVE_NUTRIENT_LIMITS = MICRO_LIMITS;

  const MicroIndex = (() => {
    const set = new Set();
    for (const o of DB.items) {
      for (const [k,v] of Object.entries(o)) {
        if (typeof v !== 'number') continue;
        const kk = canonicalizeKey(k);
        if (kk.endsWith('_mg') || kk.endsWith('_mcg') || kk.startsWith('vitamin_')) set.add(kk);
      }
    }
    const main = new Set(['kcal','protein_g','fat_g','carbs_g','sugars_g','fiber_g','sfa_g','unsat_g','salt_g','sodium_mg','added_sugars_g']);
    main.forEach(k => set.delete(k));
    const all = Array.from(set);
    all.sort((a,b) => {
      const ga = groupOf(a), gb = groupOf(b);
      if (ga !== gb) return (ga==='vitamins'?0:ga==='minerals'?1:2) - (gb==='vitamins'?0:gb==='minerals'?1:2);
      return titleRu(a).localeCompare(titleRu(b));
    });
    const vitamins = all.filter(k => groupOf(k)==='vitamins');
    const minerals = all.filter(k => groupOf(k)==='minerals');
    const other = all.filter(k => groupOf(k)==='other');
    return { keys: all, vitamins, minerals, other };
  })();

  const Calc = (() => {
    function isPer100FieldName(name) {
      if (name.endsWith(SCALE_SUFFIX) || KNOWN_PER100.has(name)) return true;
      const kk = canonicalizeKey(name);
      if (kk.endsWith('_mg') || kk.endsWith('_mcg') || kk.startsWith('vitamin_')) return true;
      return false;
    }
    function scaledPerItem(item) {
      const p = DB.byKey.get(item.key); if (!p) return {};
      const f = (item.grams||0) / 100.0;
      const out = {};
      for (const [k,v] of Object.entries(p)) {
        if (typeof v !== 'number') continue;
        if (!isPer100FieldName(k)) continue;
        let baseName = k;
        if (k.endsWith(SCALE_SUFFIX)) baseName = k.slice(0, -SCALE_SUFFIX.length).replace('_per100g','');
        baseName = canonicalizeKey(baseName);
        baseName = normalizeMacroName(baseName);
        const val = v * f;
        out[baseName] = (out[baseName]||0) + val;
      }
      if (out.sodium_mg == null) { if (out.salt_g != null) out.sodium_mg = out.salt_g * 393.0; }
      return out;
    }
    function totals(ration) {
      const t = {}, items = [];
      for (const it of rationForNutrientCalculationV53107(ration)) {
        const s = scaledPerItem(it);
        items.push(s);
        for (const [k,v] of Object.entries(s)) t[k] = (t[k]||0) + v;
      }
      return { t, items };
    }
    return { scaledPerItem, totals };
  })();

  function productSourceClassV53155(p){
    const text = [p && p.nutrition_verification_status, p && p.nutrient_completeness_status, p && p.source_exactness_class]
      .map(x => String(x || '').toLowerCase()).join(' ');
    if (/source_required|review_required|incomplete|needed|candidate|manual_review/.test(text)) return 'low';
    if (/proxy|recipe|model|label/.test(text)) return 'medium';
    if (/verified|exact|complete/.test(text)) return 'high';
    return 'unknown';
  }
  function sourceQualityV53155(ration){
    const out = { total:0, high:0, medium:0, low:0, unknown:0, usable:0, pct:0, label:'нет продуктов' };
    for (const it of rationForNutrientCalculationV53107(ration || [])) {
      const p = DB.byKey.get(it && it.key); if (!p) continue;
      out.total += 1; const cls = productSourceClassV53155(p); out[cls] += 1;
    }
    out.usable = out.high + out.medium;
    out.pct = out.total ? out.usable / out.total * 100 : 0;
    out.label = !out.total ? 'нет продуктов' : (out.low ? 'есть источники, требующие проверки' : (out.medium ? 'часть данных по proxy/label' : (out.unknown ? 'часть источников не классифицирована' : 'высокая')));
    return out;
  }
  const CalculationCoreV53155 = Object.freeze({
    version:'v5.3.155_calculation_core_ssot_pass1',
    metricMode:metricMode,
    getMetricSpec:function(key){ return metricDefinition(key); },
    label:function(key){ return metricDefinition(key).title; },
    scaledPerItem:Calc.scaledPerItem,
    totals:function(ration){ return Calc.totals(Array.isArray(ration) ? ration : State.get()); },
    sourceQuality:function(ration){ return sourceQualityV53155(Array.isArray(ration) ? ration : State.get()); },
    snapshot:function(ration){
      const raw = Array.isArray(ration) ? ration.slice() : State.get();
      const computed = Calc.totals(raw);
      return Object.freeze({
        version:'v5.3.155_calculation_core_ssot_pass1', rawRation:raw,
        nutrientRation:rationForNutrientCalculationV53107(raw), foodPatternRation:rationForCalculationV5377(raw),
        totals:computed.t, items:computed.items, sourceQuality:sourceQualityV53155(raw)
      });
    }
  });
  window.NutritionCalculationCoreV53155 = CalculationCoreV53155;
  window.NutritionCalculationCore = CalculationCoreV53155;
  window.NutritionMetricRegistryV53155 = Object.freeze({ version:CalculationCoreV53155.version, get:metricDefinition, mode:metricMode, labels:METRIC_LABELS });

  const UI = (() => {
    const categoriesEl = document.getElementById('categories');
    const rationBody = document.getElementById('rationBody');
    let totalsGrid = document.getElementById('totalsGrid');
    const microsGroups = document.getElementById('microsGroups');
    const resetBtn = document.getElementById('resetBtn');
    const devToggle = document.getElementById('devToggle');
    const normProfile = document.getElementById('normProfile');
    const editNormsBtn = document.getElementById('editNormsBtn');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const globalSearchGrams = document.getElementById('globalSearchGrams');
    const globalResults = document.getElementById('globalResults');
    const globalSearchClear = document.getElementById('globalSearchClear');
    const globalSearchStatus = document.getElementById('globalSearchStatus');
    const uxDbCount = document.getElementById('uxDbCount');
    const uxSearchExamples = Array.from(document.querySelectorAll('[data-search-example]'));
    const uxGramButtons = Array.from(document.querySelectorAll('[data-search-grams]'));
    const groupingSeg = document.getElementById('groupingSeg');
    const groupingTitle = document.getElementById('groupingTitle');
    const regionSeg = document.getElementById('regionSeg');
    const clearRationBtn = document.getElementById('clearRationBtn');

    let norms = { profile: 'adult', values: JSON.parse(JSON.stringify(DAILY_NORMS_DEFAULT)) };
    
    window.norms = norms; // expose for integration

    // v3.4.1: единая нормализация поиска для всей страницы.
    // Пользователь может писать е вместо ё; регистр, лишние пробелы и базовая пунктуация не влияют на поиск.
    function normalizeSearchText(value) {
      return String(value == null ? '' : value)
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[.,;:!?()«»"'`´’‘“”\[\]{}<>\/\|_+*=~]/g, ' ')
        .replace(/[-–—]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    function searchTerms(value) {
      return normalizeSearchText(value).split(' ').filter(Boolean);
    }
    function productSearchText(p) {
      if (!p) return '';
      // v4.6.1: searchable text is restricted to product identity.
      // Каталог и HEI-группа не должны превращать запрос «яйцо» в выдачу всей группы «Мясо, птица и яйца».
      return normalizeSearchText([
        p.name_ru || '',
        p.name || '',
        p.key || '',
        Array.isArray(p.search_aliases) ? p.search_aliases.join(' ') : '',
        Array.isArray(p.tags) ? p.tags.join(' ') : ''
      ].join(' '));
    }
    function productSearchMetaText(p) {
      if (!p) return '';
      return normalizeSearchText([
        labelCatalog(p.catalog_category_key || p.category || ''),
        labelHEI(p.hei_category_key || '')
      ].join(' '));
    }
    window.__productSearchMetaText = productSearchMetaText;
    function searchTermVariants(t) {
      if (t === 'курица') return ['курица','куриц','курин','chicken'];
      if (t === 'яйцо') return ['яйцо','яйц','яич','egg'];
      if (t === 'яблоко') return ['яблоко','яблок','apple'];
      if (t === 'молоко') return ['молоко','молоч','milk'];
      if (t === 'творог') return ['творог','творож','curd','cottage'];
      if (t === 'кефир') return ['кефир','kefir'];
      if (t === 'йогурт') return ['йогурт','yogurt'];
      if (t === 'гречка') return ['гречка','гречк','гречнев','buckwheat'];
      if (t === 'рис') return ['рис','rice'];
      if (t === 'индейка') return ['индейка','индей','turkey'];
      if (t === 'рыба') return ['рыба','рыб','fish'];
      if (t === 'лосось') return ['лосось','лосос','salmon'];
      if (t === 'картофель') return ['картофель','картоф','potato'];
      if (t === 'овсянка') return ['овсянка','овсян','oat'];
      if (t === 'хлеб') return ['хлеб','bread'];
      return [t];
    }
    function searchTermMatches(text, t) {
      // v5.3.69: короткие/омонимичные запросы не должны давать ложные совпадения:
      // «сыр» ≠ «сырой», «гречка» ≠ «греческий», oat ≠ groats.
      if (t === 'сыр') return /(^|\s)сыр($|\s)/.test(text) || /(^|\s)cheese($|\s)/.test(text);
            return searchTermVariants(t).some(v => {
        const vv = String(v || '');
        if (/^[a-z]{1,3}$/.test(vv)) return (' ' + text + ' ').includes(' ' + vv + ' ');
        return text.includes(vv);
      });
    }
    window.__searchTermVariants = searchTermVariants;
    window.__searchTermMatches = searchTermMatches;
    window.normalizeSearchText = normalizeSearchText;
    window.__productSearchText = productSearchText;
let groupingMode = 'catalog'; // 'catalog' or 'hei'

    function buildAccordion() {
      categoriesEl.innerHTML = '';
      const groups = groupingMode === 'hei' ? DB.byCatHEI : DB.byCatCatalog;
      const titleMap = groupingMode === 'hei' ? HEI_RU : CATALOG_RU;
      const keys = Array.from(groups.keys()).sort((a,b)=> labelGroup(a, groupingMode).localeCompare(labelGroup(b, groupingMode)));
      for (const cat of keys) {
        const products = (groups.get(cat) || []).filter(p => !(p && p.hidden_from_search === true));
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.dataset.groupKey = String(cat || 'other');
        item.dataset.groupMode = groupingMode;
        item.innerHTML = `
          <div class="accordion-head" role="button" aria-expanded="false" data-group-key="${String(cat || 'other').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}" data-group-mode="${groupingMode}">${labelGroup(cat, groupingMode)} <span class="cat-count">${products.length}</span></div>
          <div class="accordion-body">
            <div class="inline">
              <div>
                <label>Поиск в секции</label>
                <input type="text" placeholder="Поиск внутри этой группы" data-role="search" />
              </div>
              <div>
                <label>Продукт</label>
                <select data-role="select"></select>
              </div>
              <div>
                <label>Граммы</label>
                <input type="number" min="0" max="5000" step="1" value="100" data-role="grams"/>
              </div>
              <div class="actions">
                <button data-role="add">Добавить</button>
              </div>
            </div>
          </div>`;
        const head = item.querySelector('.accordion-head');
        head.addEventListener('click', () => {
          const isOpen = item.classList.toggle('open');
          head.setAttribute('aria-expanded', isOpen ? 'true':'false');
        });

        const sel = item.querySelector('select[data-role="select"]');
        const search = item.querySelector('input[data-role="search"]');
        const gramsInput = item.querySelector('input[data-role="grams"]');
        const addBtn = item.querySelector('button[data-role="add"]');

        function fillOptions(filter='') {
          sel.innerHTML = '';
          const terms = searchTerms(filter);
          const list = !terms.length ? products : products.filter(p => {
            const text = productSearchText(p);
            return terms.every(t => searchTermMatches(text, t));
          });
          if (!list.length) {
            const opt = document.createElement('option');
            opt.value = ''; opt.textContent = 'В этой группе ничего не найдено';
            sel.appendChild(opt);
            return;
          }
          for (const p of list) {
            const opt = document.createElement('option');
            opt.value = p.key; opt.textContent = p.name_ru || p.name || p.key;
            sel.appendChild(opt);
          }
        }
        fillOptions();
        search.addEventListener('input', () => fillOptions(search.value));
        addBtn.addEventListener('click', () => {
          const key = sel.value;
          const grams = Math.max(0, Math.min(5000, parseFloat(gramsInput.value)||0));
          if (!key || grams<=0) return;
          State.add(key, grams);
        });

        categoriesEl.appendChild(item);
      }
      groupingTitle.textContent = groupingMode === 'hei' ? 'HEI-группы' : 'каталог';
    }

    function renderRation() {
  // не перерисовываем таблицу, если пользователь вводит граммы
  const active = document.activeElement;
  const isRationInput = active && active.tagName === 'INPUT' && active.type === 'number' &&
                        active.closest && active.closest('#rationTable');
  if (isRationInput) {
    if (typeof clearRationBtn !== 'undefined' && clearRationBtn) {
      const rationNow = State.get();
      clearRationBtn.disabled = (rationNow.length === 0);
    }
    return;
  }

  const ration = State.get();
  rationBody.innerHTML = '';
  if (clearRationBtn) clearRationBtn.disabled = (ration.length === 0);

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function compositeChildren(entry){ return Array.isArray(entry && entry.children) ? entry.children : []; }
  function confidenceLabel(entry){
    const c = String(entry && (entry.confidence || entry.recipe_confidence || '')).toUpperCase();
    if (c === 'HIGH') return 'точность высокая';
    if (c === 'MEDIUM') return 'точность средняя';
    if (c === 'MEDIUM_LOW') return 'точность средне-низкая';
    if (c === 'LOW') return 'требует проверки';
    return 'модель';
  }
  function aiImportMealLabel(entry){
    const ai = entry && entry.ai_import;
    if (!ai || ai.source !== 'gemini_media') return '';
    const raw = ai.meal_labels != null ? ai.meal_labels : (ai.meal_label || ai.meal || '');
    const labels = (Array.isArray(raw) ? raw : (raw === '' ? [] : [raw]))
      .map(value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 2);
    return labels.join(' / ') || 'медиа';
  }

  // v5.3.100: compact, non-diagnostic analytics for the ration list.
  // We show only moderation indicators with clear daily reference values:
  // sodium, saturated fat and added sugar. Total carbohydrates are deliberately
  // excluded because they do not have a universal upper limit for every user.
  function rationLimiterConfig(){
    return [
      { key:'sodium_mg', label:'Натрий', short:'натрий' },
      { key:'sfa_g', label:'Насыщенные жиры', short:'НЖК' },
      { key:'added_sugars_g', label:'Добавленный сахар', short:'добавленный сахар' }
    ];
  }
  function currentRationTotalsForInsights(){
    try { return (Calc && Calc.totals) ? (Calc.totals(State.get()).t || {}) : {}; }
    catch(_) { return {}; }
  }
  function entryNutrientsForInsights(entry){
    try {
      const direct = Calc.scaledPerItem({ key:entry.key, grams:Number(entry.grams)||0 });
      const hasLimiter = rationLimiterConfig().some(cfg => Number(direct[cfg.key]) > 0);
      if (hasLimiter || !isCompositeEntryV5377(entry)) return direct;
      const sum = {};
      compositeChildren(entry).forEach(child => {
        const n = Calc.scaledPerItem({ key:child.key, grams:Number(child.grams)||0 });
        Object.keys(n).forEach(k => { sum[k] = (sum[k]||0) + (Number(n[k])||0); });
      });
      return sum;
    } catch(_) { return {}; }
  }
  function limiterInsightsHtml(nutrients, totals, maxItems){
    const rows = rationLimiterConfig().map(cfg => {
      const target = Number(norms && norms.values && norms.values[cfg.key] && norms.values[cfg.key].value) || 0;
      const value = Number(nutrients && nutrients[cfg.key]) || 0;
      const total = Number(totals && totals[cfg.key]) || 0;
      if (!(target > 0) || !(value > 0)) return null;
      const share = value / target;
      const totalShare = total / target;
      if (share < 0.15) return null;
      const pct = Math.max(1, Math.round(share * 100));
      let level = share >= 0.25 ? 'high' : 'notice';
      if (totalShare > 1 && share >= 0.10) level = 'over';
      return { cfg, share, totalShare, pct, level };
    }).filter(Boolean).sort((a,b) => b.share - a.share);
    const limit = Math.max(1, Number(maxItems)||2);
    const visible = rows.slice(0, limit);
    const chips = visible.map(row => {
      const title = row.totalShare > 1
        ? `В текущем рационе превышен дневной ориентир. Эта позиция даёт около ${row.pct}% ориентира.`
        : `Эта позиция даёт около ${row.pct}% дневного ориентира.`;
      return `<span class="ration-impact-chip ration-impact-${row.level}" title="${esc(title)}"><span class="ration-impact-dot" aria-hidden="true"></span>${esc(row.cfg.label)}: ${row.pct}%</span>`;
    });
    if (rows.length > visible.length) chips.push(`<span class="ration-impact-more">+${rows.length-visible.length}</span>`);
    return chips.join('');
  }
  function compositeImpactSummary(entry, totals){
    const nutrients = entryNutrientsForInsights(entry);
    const html = limiterInsightsHtml(nutrients, totals, 3);
    if (!html) return '<div class="composite-impact-summary is-quiet"><strong>По текущей порции:</strong> выраженного вклада в показатели умеренности не выявлено.</div>';
    return `<div class="composite-impact-summary"><strong>По текущей порции:</strong><div class="composite-impact-chips">${html}</div><div class="composite-impact-caption">Метки относятся только к натрию, насыщенным жирам и добавленному сахару; они не оценивают блюдо целиком.</div></div>`;
  }
  function renderCompositeDetails(host, entry){
    if (!host) return;
    const children = compositeChildren(entry);
    const rootRef = rationEntryRefV5377(entry);
    const notes = entry.accuracy || {};
    const miniId = 'mini-' + domSafeIdV5377(rootRef);
    const editorId = 'composite-editor-' + domSafeIdV5377(rootRef);
    const rows = children.map(child => {
      const cp = DB.byKey.get(child.key) || child;
      const cref = child.id || child.key;
      const flags = [];
      if (child.custom_added) flags.push('добавлено');
      if (child.replaces_key) flags.push('замена');
      if (child.manual_locked) flags.push('ручная масса');
      const childImpact = limiterInsightsHtml(Calc.scaledPerItem({ key:child.key, grams:Number(child.grams)||0 }), currentRationTotalsForInsights(), 1);
      return `<tr class="composite-child-row" data-child-ref="${esc(cref)}">
        <td><span class="composite-child-name">${esc(child.name_ru || cp.name_ru || cp.name || child.key)}</span>${flags.length ? `<div class="composite-child-flags">${esc(flags.join(' · '))}</div>` : ''}${childImpact ? `<div class="composite-child-impact">${childImpact}</div>` : ''}</td>
        <td><span class="pill">${esc(labelHEI(cp.hei_category_key || child.hei_category_key || 'other'))}</span> <span class="pill">${esc(labelCatalog(cp.catalog_category_key || cp.category || child.catalog_category_key || 'other'))}</span></td>
        <td><input data-composite-parent="${esc(rootRef)}" data-composite-child="${esc(cref)}" type="number" min="0" max="5000" step="0.1" value="${Number(child.grams || 0)}" /></td>
        <td class="composite-child-actions">
          <button class="secondary composite-child-replace" data-composite-parent="${esc(rootRef)}" data-composite-child="${esc(cref)}" type="button">Заменить</button>
          <button class="secondary composite-child-remove" data-composite-parent="${esc(rootRef)}" data-composite-child="${esc(cref)}" type="button">Удалить</button>
        </td>
      </tr>`;
    }).join('');
    const editedLabel = (entry.edited || entry.customized || entry.recipe_instance_type === 'customized_recipe_instance')
      ? '<span class="warn-text">Пользовательская версия: состав изменён.</span>'
      : '<span class="muted">Типовая рецептура: состав можно изменить.</span>';
    const currentTotals = currentRationTotalsForInsights();
    host.innerHTML = `<div class="composite-folder-details">
      <div class="composite-folder-note"><strong>Состав комплексного блюда.</strong> Ингредиенты учитываются отдельно при расчёте HEI и нутриентов. ${editedLabel}</div>
      ${compositeImpactSummary(entry, currentTotals)}
      <div class="composite-folder-actions">
        <button class="secondary composite-inner-add" data-composite-parent="${esc(rootRef)}" type="button">+ Добавить ингредиент в это блюдо</button>
        <button class="secondary composite-reset-recipe" data-composite-parent="${esc(rootRef)}" type="button">Сбросить к типовой рецептуре</button>
      </div>
      <table class="composite-child-table"><thead><tr><th>Ингредиент</th><th>Маршрут расчёта</th><th>Граммы</th><th>Действия</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="composite-inner-editor" id="${editorId}" hidden>
        <div class="composite-inner-editor-title" data-role="title">Добавить ингредиент</div>
        <div class="composite-inner-editor-grid">
          <label>Поиск продукта внутри блюда<input type="text" data-role="search" placeholder="Например: редька, свинина, йогурт, зелень" /></label>
          <label>Выбранный продукт<select data-role="select"></select></label>
          <label>Граммы<input type="number" data-role="grams" min="0" max="5000" step="0.1" value="50" /></label>
        </div>
        <div class="composite-inner-editor-help" data-role="help">Продукт будет добавлен внутрь этой папки, а не в общий список дня.</div>
        <div class="composite-inner-editor-actions">
          <button type="button" data-role="confirm">Добавить</button>
          <button type="button" class="secondary" data-role="cancel">Отмена</button>
        </div>
      </div>
      <div class="composite-confidence"><span class="pill">КБЖУ: ${esc(notes.energy_and_macros || 'этикетка/модель')}</span><span class="pill">ингредиенты: ${esc(notes.ingredient_weights || entry.confidence || 'model')}</span><span class="pill">расчёт: ${esc(confidenceLabel(entry))}</span></div>
      <div class="mini-nutrients" id="${miniId}"></div>
    </div>`;

    function productSearchForComposite(filter){
      const terms = searchTerms(filter || '');
      return DB.items.filter(p => p && p.hidden_from_search !== true).map(p => {
        const text = [normalizeSearchText(p.name_ru || p.name || p.key), productSearchText(p), productSearchMetaText(p)].join(' ');
        if (terms.length && !terms.every(t => searchTermMatches(text, t))) return null;
        let score = 0;
        const name = normalizeSearchText(p.name_ru || p.name || p.key);
        for (const t of terms) {
          if (name.startsWith(t)) score += 100;
          if (name.includes(t)) score += 50;
          if (searchTermMatches(productSearchMetaText(p), t)) score += 3;
        }
        return { p, score };
      }).filter(Boolean).sort((a,b) => (b.score-a.score) || String(a.p.name_ru||'').localeCompare(String(b.p.name_ru||''))).slice(0, 80).map(x => x.p);
    }
    const editor = host.querySelector('#' + editorId);
    let editorMode = 'add';
    let editorChildRef = '';
    function fillInnerOptions(filter){
      const sel = editor && editor.querySelector('select[data-role="select"]');
      if (!sel) return;
      sel.innerHTML = '';
      const list = productSearchForComposite(filter);
      if (!list.length) {
        const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'Ничего не найдено'; sel.appendChild(opt); return;
      }
      list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.key;
        opt.textContent = `${p.name_ru || p.name || p.key} — ${labelCatalog(p.catalog_category_key || p.category || 'other')}`;
        sel.appendChild(opt);
      });
    }
    function openInnerEditor(mode, childRef, grams){
      if (!editor) return;
      editorMode = mode || 'add';
      editorChildRef = childRef || '';
      const title = editor.querySelector('[data-role="title"]');
      const help = editor.querySelector('[data-role="help"]');
      const confirm = editor.querySelector('button[data-role="confirm"]');
      const search = editor.querySelector('input[data-role="search"]');
      const gramsInput = editor.querySelector('input[data-role="grams"]');
      if (title) title.textContent = editorMode === 'replace' ? 'Заменить ингредиент внутри блюда' : 'Добавить ингредиент внутрь блюда';
      if (help) help.textContent = editorMode === 'replace' ? 'Выбранный продукт заменит текущий ингредиент и останется внутри этой же папки.' : 'Продукт будет добавлен внутрь этой папки, а не в общий список дня.';
      if (confirm) confirm.textContent = editorMode === 'replace' ? 'Заменить' : 'Добавить';
      if (gramsInput) gramsInput.value = Math.max(0, Number(grams)||50);
      if (search) search.value = '';
      fillInnerOptions('');
      editor.hidden = false;
      setTimeout(() => { try { if (search) search.focus({ preventScroll:true }); } catch(_) { if (search) search.focus(); } }, 0);
    }
    host.querySelectorAll('input[data-composite-child]').forEach(input => {
      let timer = null;
      input.addEventListener('input', () => {
        const g = Math.max(0, Math.min(5000, parseFloat(input.value)||0));
        clearTimeout(timer);
        timer = setTimeout(() => State.updateCompositeChild(input.dataset.compositeParent, input.dataset.compositeChild, g), 250);
      });
    });
    host.querySelectorAll('.composite-child-remove').forEach(btn => {
      btn.addEventListener('click', () => State.removeCompositeChild(btn.dataset.compositeParent, btn.dataset.compositeChild));
    });
    host.querySelectorAll('.composite-child-replace').forEach(btn => {
      btn.addEventListener('click', () => {
        const child = children.find(c => c && ((c.id || c.key) === btn.dataset.compositeChild || c.key === btn.dataset.compositeChild));
        openInnerEditor('replace', btn.dataset.compositeChild, child && child.grams);
      });
    });
    const addBtn = host.querySelector('.composite-inner-add');
    if (addBtn) addBtn.addEventListener('click', () => openInnerEditor('add', '', 50));
    const resetBtn = host.querySelector('.composite-reset-recipe');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      if (confirm('Вернуть типовую рецептуру блюда и удалить пользовательские изменения?')) State.resetCompositeEntry(rootRef);
    });
    if (editor) {
      const search = editor.querySelector('input[data-role="search"]');
      const gramsInput = editor.querySelector('input[data-role="grams"]');
      const sel = editor.querySelector('select[data-role="select"]');
      const confirmBtn = editor.querySelector('button[data-role="confirm"]');
      const cancelBtn = editor.querySelector('button[data-role="cancel"]');
      let st = null;
      if (search) search.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => fillInnerOptions(search.value), 120); });
      if (confirmBtn) confirmBtn.addEventListener('click', () => {
        const key = sel && sel.value;
        const g = Math.max(0, Math.min(5000, parseFloat(gramsInput && gramsInput.value)||0));
        if (!key || !(g > 0)) return;
        if (editorMode === 'replace') State.replaceCompositeChild(rootRef, editorChildRef, key, g);
        else State.addCompositeChild(rootRef, key, g);
      });
      if (cancelBtn) cancelBtn.addEventListener('click', () => { editor.hidden = true; });
    }
    renderMiniNutrientsForEntry(entry, miniId);
  }

  for (const it of ration) {
    const p = DB.byKey.get(it.key) || it;
    const ref = rationEntryRefV5377(it);
    const isComposite = isCompositeEntryV5377(it);
    const tr = document.createElement('tr');
    const entryInsights = limiterInsightsHtml(entryNutrientsForInsights(it), currentRationTotalsForInsights(), 2);
    const hasOver = /ration-impact-over/.test(entryInsights);
    tr.className = (isComposite ? 'ration-row composite-folder-row' : 'ration-row') + (hasOver ? ' ration-row-attention' : '');
    const childrenCount = compositeChildren(it).length;
    const compositeIcon = '<span class="composite-leading-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 5.75A1.75 1.75 0 0 1 6.75 4h3.05c.47 0 .92.19 1.25.52l.93.93c.14.14.33.22.53.22h4.74A1.75 1.75 0 0 1 19 7.42v8.83A1.75 1.75 0 0 1 17.25 18H6.75A1.75 1.75 0 0 1 5 16.25V5.75Z"/><path d="M8 9.25h8M8 12h8M8 14.75h5"/></svg></span>';
    tr.innerHTML = `
      <td class="ration-name">
        <div class="ration-name-main">
          ${isComposite ? compositeIcon : '<button class="regular-nutrition-toggle" type="button" aria-expanded="false" title="Показать пищевую ценность"><span aria-hidden="true">i</span><span class="sr-only">Показать пищевую ценность</span></button>'}
          <span class="ration-title">${esc(it.name_ru || p.name_ru || p.name || it.key)}</span>
          ${isComposite ? '<span class="composite-badge"><span class="composite-badge-dot" aria-hidden="true"></span>Комплексное блюдо</span>' : ''}
          ${isComposite && (it.edited || it.customized || it.recipe_instance_type === 'customized_recipe_instance') ? '<span class="composite-badge composite-custom-badge">Состав изменён</span>' : ''}
          ${it.ai_import && it.ai_import.source === 'gemini_media' ? `<span class="ration-ai-import-badge" title="Добавлено по фото или аудио. Проверьте продукт и массу.">ИИ · ${esc(aiImportMealLabel(it))}</span>` : ''}
        </div>
        ${isComposite ? `<button class="composite-compose-toggle" type="button" aria-expanded="false"><span>Состав · ${childrenCount}</span><span class="composite-toggle-chevron" aria-hidden="true">▾</span></button>` : ''}
        ${entryInsights ? `<div class="ration-impact-row">${entryInsights}</div>` : ''}
      </td>
      <td>
        <div class="meta">
          <span class="pill">${esc(isComposite ? 'Расчёт по ингредиентам' : labelHEI(p.hei_category_key || it.hei_category_key))}</span>
          <span class="pill">${esc(isComposite ? confidenceLabel(it) : labelCatalog(p.catalog_category_key || p.category || it.catalog_category_key))}</span>
        </div>
      </td>
      <td><input data-ration-ref="${esc(ref)}" type="number" min="0" max="5000" step="1" value="${Number(it.grams || 0)}" /></td>
      <td><button class="danger" data-role="rm">Удалить</button></td>
    `;

    const detailsTr = document.createElement('tr');
    detailsTr.className = isComposite ? 'ration-details composite-folder-details-row' : 'ration-details';
    detailsTr.style.display = 'none';
    const detailsId = 'details-' + domSafeIdV5377(ref);
    const miniId = 'mini-' + domSafeIdV5377(ref);
    detailsTr.innerHTML = `<td colspan="4"><div class="mini-nutrients" id="${isComposite ? detailsId : miniId}"></div></td>`;

    const gramsInput = tr.querySelector('input[data-ration-ref]');
    let timer = null;
    gramsInput.addEventListener('input', () => {
      const v = Math.max(0, Math.min(5000, parseFloat(gramsInput.value)||0));
      clearTimeout(timer);
      timer = setTimeout(() => State.update(ref, v), 250);
      if (detailsTr.style.display !== 'none') {
        if (isComposite) {
          const draft = Object.assign({}, it, { grams:v }, window.CompositeFoodFolderV5377 && typeof window.CompositeFoodFolderV5377.scaleChildren === 'function' ? { children: window.CompositeFoodFolderV5377.scaleChildren(it.children || [], it.grams || 0, v) } : {});
          renderCompositeDetails(document.getElementById(detailsId), draft);
        } else {
          renderMiniNutrients(it.key, v);
        }
      }
    });
    tr.querySelector('button[data-role="rm"]').addEventListener('click', () => State.remove(ref));

    const nameCell = tr.querySelector('.ration-name');
    nameCell.addEventListener('click', (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest('input')) return;
      const isOpen = detailsTr.style.display !== 'none';
      detailsTr.style.display = isOpen ? 'none' : '';
      const infoToggle = tr.querySelector('.regular-nutrition-toggle');
      if (infoToggle) {
        infoToggle.setAttribute('aria-expanded', String(!isOpen));
        infoToggle.title = isOpen ? 'Показать пищевую ценность' : 'Скрыть пищевую ценность';
      }
      const toggle = tr.querySelector('.composite-compose-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', String(!isOpen));
      tr.classList.toggle('is-expanded', !isOpen);
      if (!isOpen) {
        if (isComposite) renderCompositeDetails(document.getElementById(detailsId), it);
        else renderMiniNutrients(it.key, parseFloat(gramsInput.value)||0);
      }
    });

    rationBody.appendChild(tr);
    rationBody.appendChild(detailsTr);
  }
}

// Мини‑блок нутриентов для строки рациона
const MINI_KEYS = ['kcal','protein_g','fat_g','carbs_g','fiber_g','sugars_g',
  'calcium_mg','iron_mg','magnesium_mg','potassium_mg','sodium_mg',
  'vitamin_c_mg','vitamin_a_mcg','vitamin_d_mcg','vitamin_b12_mcg','vitamin_b9_mcg','zinc_mg'
];

function titleOfKey(key){
  if (norms && norms.values && norms.values[key] && norms.values[key].title) return norms.values[key].title;
  const map = { kcal:'Калории', protein_g:'Белки', fat_g:'Жиры', carbs_g:'Углеводы', fiber_g:'Клетчатка',
    sugars_g:'Сахара', calcium_mg:'Кальций', iron_mg:'Железо', magnesium_mg:'Магний', potassium_mg:'Калий',
    sodium_mg:'Натрий', vitamin_c_mg:'Витамин C', vitamin_a_mcg:'Витамин A', vitamin_d_mcg:'Витамин D',
    vitamin_b12_mcg:'Витамин B12', vitamin_b9_mcg:'Фолат (B9)', zinc_mg:'Цинк'
  };
  return map[key]||key;
}
function unitOfKey(key){
  if (norms && norms.values && norms.values[key] && norms.values[key].unit) return norms.values[key].unit;
  const map = { kcal:'ккал', protein_g:'г', fat_g:'г', carbs_g:'г', fiber_g:'г', sugars_g:'г',
    calcium_mg:'мг', iron_mg:'мг', magnesium_mg:'мг', potassium_mg:'мг', sodium_mg:'мг',
    vitamin_c_mg:'мг', vitamin_a_mcg:'мкг', vitamin_d_mcg:'мкг', vitamin_b12_mcg:'мкг', vitamin_b9_mcg:'мкг', zinc_mg:'мг'
  };
  return map[key]||'';
}

function renderMiniNutrients(key, grams){
  const host = document.getElementById('mini-' + key);
  if (!host || !Calc || !Calc.scaledPerItem) return;
  const data = Calc.scaledPerItem({key, grams});
  const grid = document.createElement('div');
  grid.className = 'mini-grid';
  for (const k of MINI_KEYS){
    const val = data[k] || 0;
    if (!isFinite(val) || val<=0) continue;
    const unit = unitOfKey(k);
    const title = titleOfKey(k);
    const baseNorm = norms && norms.values ? norms.values[k] : null;
    const metric = metricDefinition(k, baseNorm);
    const pct = metric.target > 0 ? Math.round((val / metric.target) * 100) : 0;
    const context = metric.mode === 'informational' ? 'информационный показатель' : (metric.mode === 'upper_limit' ? `${pct}% от верхнего предела` : `${pct}% от ориентира`);
    const row = document.createElement('div'); row.className='mini-row';
    row.innerHTML = `<div class="mini-left">${title}</div>
                     <div class="mini-right"><strong>${fmt(val, unit)}</strong> <span class="muted">${context}</span></div>`;
    grid.appendChild(row);
  }
  host.innerHTML = '';
  host.appendChild(grid);
}
function renderMiniNutrientsForEntry(entry, hostId){
  const host = document.getElementById(hostId);
  if (!host || !Calc || !Calc.totals) return;
  const data = Calc.totals([entry]).t || {};
  const grid = document.createElement('div');
  grid.className = 'mini-grid';
  for (const k of MINI_KEYS){
    const val = data[k] || 0;
    if (!isFinite(val) || val<=0) continue;
    const unit = unitOfKey(k);
    const title = titleOfKey(k);
    const baseNorm = norms && norms.values ? norms.values[k] : null;
    const metric = metricDefinition(k, baseNorm);
    const pct = metric.target > 0 ? Math.round((val / metric.target) * 100) : 0;
    const context = metric.mode === 'informational' ? 'информационный показатель' : (metric.mode === 'upper_limit' ? `${pct}% от верхнего предела` : `${pct}% от ориентира`);
    const row = document.createElement('div'); row.className='mini-row';
    row.innerHTML = `<div class="mini-left">${title}</div>
                     <div class="mini-right"><strong>${fmt(val, unit)}</strong> <span class="muted">${context}</span></div>`;
    grid.appendChild(row);
  }
  host.innerHTML = '';
  host.appendChild(grid);
}
function percentile(val, norm) { if (!norm || norm.value<=0) return 0; return (val / norm.value) * 100; }
    function fmt(val, unit) {
      if (val == null || isNaN(val)) return '0 ' + (unit||'');
      if (unit === 'мкг' || unit === 'мкг РЭ' || unit === 'мг') {
        const n = Math.abs(val) < 0.1 ? '<0.1 ' + unit : (Math.round(val*10)/10).toString() + ' ' + unit;
        return n;
      }
      if (unit === 'г') return (Math.round(val*10)/10).toString() + ' г';
      if (unit === 'ккал') return Math.round(val).toString() + ' ккал';
      return (Math.round(val*10)/10).toString() + (unit?(' '+unit):'');
    }
    function iuForVitaminD(mcg) { return Math.round((mcg||0)*40); }

    const KEY_CARDS = [
      ['kcal','Калории','ккал'],
      ['protein_g','Белки','г'],
      ['fat_g','Жиры','г'],
      ['carbs_g','Углеводы','г'],
      ['sugars_g','Сахара','г'],
      ['fiber_g','Клетчатка','г'],
      ['sfa_g','Насыщенные жиры (чем меньше, тем лучше)','г'],
      ['unsat_g','Ненасыщенные жиры','г'],
      ['salt_g','Соль (чем меньше, тем лучше)','г'],
      ['sodium_mg','Натрий (чем меньше, тем лучше)','мг'],
      ['added_sugars_g','Добавленные сахара (чем меньше, тем лучше)','г'],
    ];

    function buildNormCaption(key, norm) {
      const metric = metricDefinition(key, norm);
      if (metric.mode === 'informational') return 'информационный показатель; целевой минимум не задан';
      if (!metric.target) return 'ориентир не задан';
      if (metric.mode === 'upper_limit') return 'верхний предел: ' + fmt(metric.target, metric.unit);
      return 'ориентир: ' + fmt(metric.target, metric.unit);
    }

    function microGetLimits(key) {
      const lim = MICRO_LIMITS[key] || null;
      const region = State.getRegion();
      if (!lim) return null;
      const d = currentNormDemographic();
      const resolved = resolveRegionalMicroLimits(key, region, d.age, d.sex) || {};
      return {
        title: lim.title || titleRu(key),
        unit: lim.unit || unitOf(key),
        min: resolved.min !== undefined ? resolved.min : (lim.min && (lim.min[region] || lim.min)),
        ul: resolved.ul !== undefined ? resolved.ul : (lim.ul && (lim.ul[region] || lim.ul)),
        safe: resolved.safe !== undefined ? resolved.safe : (lim.safe && (lim.safe[region] || lim.safe)),
        basis: resolved.basis || (region === 'eu' ? 'EFSA DRV' : 'США/Канада DRI'),
        profile: resolved.profile || '',
        note: [lim.note, resolved.note].filter(Boolean).join(' '),
        risk: lim.risk || null
      };
    }

    function capMin(minObj) {
      if (!minObj) return '—';
      return `Мин. рекомендация (${minObj.type}): ${minObj.value}`;
    }
    function capUL(ulObj, safeObj) {
      if (!ulObj) return safeObj ? ('UL не установлен; ' + (safeObj.label || 'безопасный уровень') + ': ' + safeObj.value) : 'UL не установлен';
      const scopeMap = {
        total:'весь рацион', supplements_only:'только добавки', supplemental_synthetic:'синтетические формы из добавок/фортификации', synthetic_only:'только синтетическая форма', retinol_only:'только ретинол', nicotinic_acid_only:'только никотиновая кислота'
      };
      const scope = ulObj.scope ? `, применим к: ${scopeMap[ulObj.scope]||ulObj.scope}` : '';
      return `UL: ${ulObj.value}${scope}`;
    }

    function computeBar(val, minVal, ulVal, isLimiter) {
      let maxRef = 0;
      if (ulVal != null) maxRef = ulVal;
      else if (minVal != null) maxRef = Math.max(minVal*2, val);
      else maxRef = val || 1;
      const widthPct = Math.min(200, (val / maxRef) * 100);
      const minPct = (minVal != null) ? Math.min(100, (minVal / maxRef) * 100) : null;
      const ulPct  = (ulVal  != null) ? Math.min(100, (ulVal  / maxRef) * 100) : null;
      let barClass = '';
      if (isLimiter) barClass = 'warn';
      else if (ulVal != null && val > ulVal) barClass = 'danger';
      else if (minVal != null && val < minVal) barClass = '';
      else barClass = '';
      return { widthPct, minPct, ulPct, barClass };
    }

    function renderTicks(container, bar) {
      const ticks = document.createElement('div');
      ticks.className = 'ticks';
      if (bar.minPct != null) {
        const t = document.createElement('div');
        t.className = 'tick';
        t.style.left = bar.minPct + '%';
        const lab = document.createElement('div');
        lab.className = 'tick-label';
        lab.style.left = bar.minPct + '%';
        lab.textContent = 'min';
        ticks.appendChild(t); ticks.appendChild(lab);
      }
      if (bar.ulPct != null) {
        const t = document.createElement('div');
        t.className = 'tick';
        t.style.left = bar.ulPct + '%';
        const lab = document.createElement('div');
        lab.className = 'tick-label';
        lab.style.left = bar.ulPct + '%';
        lab.textContent = 'UL';
        ticks.appendChild(t); ticks.appendChild(lab);
      }
      container.appendChild(ticks);
    }

    function microCard(key, val, meta) {
      const region = State.getRegion();
      const lim = microGetLimits(key);
      const unit = unitOf(key);
      const title = (lim && lim.title) || titleRu(key);
      const minObj = lim ? lim.min : null;
      const ulObj  = lim ? lim.ul  : null;
      const safeObj = lim ? lim.safe : null;
      const minVal = minObj ? minObj.value : null;
      const ulVal  = ulObj  ? ulObj.value  : null;
      const isLimiter = false;
      const bar = computeBar(val, minVal, ulVal, isLimiter);

      const card = document.createElement('div');
      card.className = 'total-card';

      const head = document.createElement('div');
      head.className = 'total-row';
      const titleEl = document.createElement('div');
      titleEl.innerHTML = `<strong>${title}</strong>`;
      const capRight = document.createElement('div');
      capRight.className = 'muted';
      capRight.textContent = (minObj ? `${minObj.type}: ${minObj.value} ${unit}` : 'ориентир не задан') + ' • ' + (ulObj ? `UL: ${ulObj.value} ${unit}` : (safeObj ? `UL не установлен · ${safeObj.label || 'безопасный уровень'}: ${safeObj.value} ${unit}` : 'UL не установлен'));
      head.appendChild(titleEl); head.appendChild(capRight);

      const progRow = document.createElement('div');
      progRow.className = 'total-row';
      progRow.style.marginTop = '6px';
      const prog = document.createElement('div');
      prog.className = 'progress';
      const barEl = document.createElement('div');
      barEl.className = 'bar ' + (bar.barClass || '');
      barEl.style.width = Math.min(bar.widthPct, 100) + '%';
      prog.appendChild(barEl);
      renderTicks(prog, bar);

      const fact = document.createElement('div');
      if (key === 'vitamin_d_mcg') {
        fact.innerHTML = `<strong>${fmt(val, unit)} (${iuForVitaminD(val)} МЕ)</strong>`;
      } else {
        fact.innerHTML = `<strong>${fmt(val, unit)}</strong>`;
      }
      progRow.appendChild(prog); progRow.appendChild(fact);

      const foot = document.createElement('div');
      foot.className = 'muted';
      foot.style.fontSize = '12px';
      let ulCap = capUL(ulObj, safeObj);
      let minCap = capMin(minObj);
      if (key === 'vitamin_d_mcg') {
        const minIU = minObj ? ` (${minObj.value*40} МЕ)` : '';
        const ulIU  = ulObj  ? ` (${ulObj.value*40} МЕ)` : '';
        minCap = minObj ? `Мин. рекомендация (${minObj.type}): ${minObj.value} ${unit}${minIU}` : '—';
        ulCap  = ulObj  ? `UL: ${ulObj.value} ${unit}${ulIU}` : (safeObj ? `UL не установлен; ${safeObj.label || 'безопасный уровень'}: ${safeObj.value} ${unit}` : 'UL не установлен');
      }
      const note = (lim && lim.note) ? ` • ${lim.note}` : '';
      const risk = (lim && lim.risk) ? ` • Риски: ${lim.risk}` : '';
      const basis = lim && lim.basis ? ` • Основание: ${lim.basis}` : '';
      const profile = lim && lim.profile ? ` • Профиль: ${lim.profile}` : '';
      foot.textContent = `${minCap} • ${ulCap}` + basis + profile + note + risk;

      card.appendChild(head);
      card.appendChild(progRow);
      card.appendChild(foot);
      return card;
    }

    function renderTotals() {
      // Ensure totalsGrid is available
      if (!totalsGrid) totalsGrid = document.getElementById('totalsGrid');
      if (!totalsGrid) { try{ console.warn('renderTotals: #totalsGrid not found'); }catch(_){ } return; }
    
      const t0 = performance.now();
      const ration = State.get();
      const { t } = Calc.totals(ration);

      totalsGrid.innerHTML = '';
      
      for (const [key, _title, unit] of KEY_CARDS) {
        const val = t[key] || 0;
        const baseNorm = norms.values[key] || null;
        const metric = metricDefinition(key, baseNorm);
        const target = metric.target;
        const pct = Math.min(200, target>0 ? (val / target) * 100 : 0);
        const isLimiter = metric.mode === 'upper_limit';
        const isInformational = metric.mode === 'informational';
        const title = metric.title || titleRu(key);
        const barClass = isInformational ? 'info' : (isLimiter ? (pct <= 80 ? '' : (pct <= 100 ? 'warn' : 'danger')) : (pct <= 100 ? '' : (pct <= 120 ? 'warn' : 'danger')));
        const caption = buildNormCaption(key, baseNorm);

        const card = document.createElement('div'); card.className = 'total-card';
        const head = document.createElement('div'); head.className = 'total-row';
        const left = document.createElement('div'); left.innerHTML = `<strong>${title}</strong>`;
        const right = document.createElement('div');
        head.appendChild(left); head.appendChild(right);

        const EDITABLE = new Set(['kcal','protein_g','fat_g','carbs_g']);
        if (EDITABLE.has(key)) {
          const wrap = document.createElement('div'); wrap.className = 'norm-input-wrap';
          const inp = document.createElement('input'); inp.type='number'; inp.className='norm-input'; inp.min='0'; inp.step='1';
          inp.id = 'normInput-' + key;
          inp.value = (target || 0);
          const u = document.createElement('span'); u.className='unit-tag'; u.textContent = unit;
          wrap.appendChild(inp); wrap.appendChild(u); right.appendChild(wrap);

          const applyVal = (v)=>{
            const n = Number(v); if (!isFinite(n) || n < 0) return;
            if (!norms.values[key]) norms.values[key] = {value:0, unit:unit};
            norms.values[key].value = n;
            if (typeof renderTotals === 'function') renderTotals();
          };
          inp.addEventListener('change', (e)=> applyVal(e.target.value));
          inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); applyVal(e.target.value); }});
        } else {
          right.className = 'muted'; right.textContent = caption;
        }

        const progRow = document.createElement('div'); progRow.className = 'total-row'; progRow.style.marginTop = '6px';
        const prog = document.createElement('div'); prog.className = 'progress';
        const bar = document.createElement('div'); bar.className = 'bar ' + barClass; bar.style.width = (isInformational ? 0 : pct) + '%';
        prog.appendChild(bar);
        const valDiv = document.createElement('div'); valDiv.innerHTML = `<strong>${fmt(val, unit)}</strong>`;
        progRow.appendChild(prog); progRow.appendChild(valDiv);
        const foot = document.createElement('div'); foot.className = 'muted'; foot.style.cssText = 'font-size:12px;margin-top:4px;';
        foot.textContent = isInformational ? 'Показан факт; добирать до справочного числа не требуется' : (isLimiter ? `${Math.round(pct)}% от верхнего предела` : `${Math.round(pct)}% от ориентира`);
        card.appendChild(head); card.appendChild(progRow); card.appendChild(foot);
        totalsGrid.appendChild(card);
      }


      if (microsGroups) microsGroups.innerHTML = '';
      const groups = [
        ['vitamins','Витамины', MicroIndex.vitamins],
        ['minerals','Минералы', MicroIndex.minerals],
        ['other','Прочее', MicroIndex.other],
      ];
      for (const [gkey, gtitle, arr] of groups) {
        if (!arr.length) continue;
        const h = document.createElement('div');
        h.className = 'micro-group-title';
        h.textContent = gtitle;
        if (microsGroups) microsGroups.appendChild(h);
        const grid = document.createElement('div');
        grid.className = 'totals-grid';
        for (const k of arr) {
          const val = t[k] || 0;
          grid.appendChild(microCard(k, val, null));
        }
        if (microsGroups) microsGroups.appendChild(grid);
      }

      const t1 = performance.now();
      Debug.perf({ calc_ms: Math.round((t1-t0)) });
    }

    function safeFocusNoScroll(el){
      if (!el || typeof el.focus !== 'function') return;
      try {
        const mobile = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
        if (mobile) el.focus({ preventScroll: true });
        else el.focus();
      } catch(_) {
        try { el.focus(); } catch(__) {}
      }
    }

    // Global search
    function renderGlobalResults(query) {
      if (!globalResults) return;
      globalResults.innerHTML = '';
      const raw = String(query || '');
      const esc = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const fmt1 = n => Number.isFinite(Number(n)) ? Number(n).toFixed(1).replace(/\.0$/, '') : '—';

      const q = normalizeSearchText(raw);
      const grams = Math.max(1, Math.min(5000, parseFloat(globalSearchGrams.value)||100));
      if (!DB || !Array.isArray(DB.items) || DB.items.length < 100) {
        if (globalSearchStatus) globalSearchStatus.textContent = 'База продуктов не загружена. Обновите страницу после полной загрузки файлов хостинга.';
        globalResults.innerHTML = '<div class="search-empty-state">База продуктов сейчас не загрузилась, поэтому поиск и расчёты временно недоступны. После загрузки базы продукт может появиться в поиске.</div>';
        return;
      }
      if (!q || q.length < 2) {
        if (globalSearchStatus) globalSearchStatus.textContent = 'Начните вводить название продукта. Поиск работает по всей базе, без открытия категорий.';
        globalResults.innerHTML = '<div class="search-empty-state">Самый быстрый сценарий: введите продукт из своего обычного рациона, например «творог», «курица», «гречка» или «йогурт». Затем проверьте граммы и нажмите «Добавить в рацион».</div>';
        return;
      }

      const terms = searchTerms(q);
      const scored = DB.items.filter(p => !(p && p.hidden_from_search === true)).map(p => {
        const name = normalizeSearchText(p.name_ru || p.name || p.key);
        const techName = normalizeSearchText(p.name || '');
        const meta = productSearchMetaText(p);
        const text = [name, techName, productSearchText(p)].join(' ');
        if (!terms.every(t => searchTermMatches(text, t))) return null;
        let score = 0;
        if (name === q) score += 300;
        if (name.startsWith(q)) score += 180;
        if (name.includes(q)) score += 90;
        for (const t of terms) {
          const vars = searchTermVariants(t);
          if (name.split(' ').some(w => w === t)) score += 25;
          if (name.split(' ').some(w => w.startsWith(t))) score += 10;
          if (vars.some(v => name.startsWith(v))) score += 80;
          if (name.split(' ').some(w => vars.some(v => w === v || w.startsWith(v)))) score += 18;
          if (searchTermMatches(meta, t)) score += 1;
        }
        // Пользователь чаще ищет по русскому названию; технические совпадения ниже.
        if (!name.includes(q) && techName.includes(q)) score -= 20;
        return { p, score };
      }).filter(Boolean).sort((a,b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.p.name_ru || '').localeCompare(String(b.p.name_ru || ''));
      });

      const hits = scored.slice(0, 50).map(x => x.p);
      if (globalSearchStatus) {
        globalSearchStatus.textContent = scored.length
          ? `Найдено: ${scored.length}. Показаны первые ${hits.length}. Уточните запрос, если нужного продукта нет вверху.`
          : 'Ничего не найдено. Попробуйте другое слово или более короткую часть названия.';
      }
      if (!hits.length) {
        globalResults.innerHTML = '<div class="search-empty-state">По этому запросу ничего не найдено. Попробуйте ввести основу слова: например, вместо «сырники со сгущёнкой» — «сырник» или «сгущ».</div>';
        return;
      }
      for (const p of hits) {
        const row = document.createElement('div');
        row.className = 'search-result-card';
        row.dataset.key = p.key;
        const kcal = Number(p.kcal || 0) * grams / 100;
        const protein = Number(p.protein_per_100g || p.protein || 0) * grams / 100;
        const fat = Number(p.fat_per_100g || p.fat || 0) * grams / 100;
        const carbs = Number(p.carbs_per_100g || p.carbs || 0) * grams / 100;
        row.innerHTML = `
          <div class="search-result-main">
            <div class="search-result-title">${esc(p.name_ru || p.name || p.key)}</div>
            <div class="meta">
              <span class="pill">${esc(labelHEI(p.hei_category_key))}</span>
              <span class="pill">${esc(labelCatalog(p.catalog_category_key || p.category))}</span>
            </div>
            <div class="search-result-nutrients" title="Расчёт по выбранным граммам">
              <span>${fmt1(grams)} г</span>
              <span>${fmt1(kcal)} ккал</span>
              <span>Б ${fmt1(protein)} г</span>
              <span>Ж ${fmt1(fat)} г</span>
              <span>У ${fmt1(carbs)} г</span>
            </div>
            ${p.weighing_instruction_ru ? `<div class="search-result-weighing-note">${esc(p.weighing_instruction_ru)}</div>` : ''}
          </div>
          <div class="search-result-actions">
            <label>Граммы</label>
            <input type="number" min="1" max="5000" step="1" value="${grams}" data-role="grams"/>
            <button data-role="add" type="button">Добавить</button>
          </div>
        `;
        const gramsEl = row.querySelector('input[data-role="grams"]');
        gramsEl.addEventListener('input', () => {
          // Обновляем расчёт по карточке без повторного поиска.
          const g = Math.max(1, Math.min(5000, parseFloat(gramsEl.value)||grams));
          const kcal2 = Number(p.kcal || 0) * g / 100;
          const protein2 = Number(p.protein_per_100g || p.protein || 0) * g / 100;
          const fat2 = Number(p.fat_per_100g || p.fat || 0) * g / 100;
          const carbs2 = Number(p.carbs_per_100g || p.carbs || 0) * g / 100;
          const box = row.querySelector('.search-result-nutrients');
          if (box) box.innerHTML = `<span>${fmt1(g)} г</span><span>${fmt1(kcal2)} ккал</span><span>Б ${fmt1(protein2)} г</span><span>Ж ${fmt1(fat2)} г</span><span>У ${fmt1(carbs2)} г</span>`;
        });
        row.querySelector('button[data-role="add"]').addEventListener('click', () => {
          const g = Math.max(1, Math.min(5000, parseFloat(gramsEl.value)||grams));
          State.add(p.key, g);
        });
        globalResults.appendChild(row);
      }
    }

    function attachEvents() {
      let mainRenderScheduled = false;
      function scheduleMainRender(reason) {
        if (mainRenderScheduled) return;
        mainRenderScheduled = true;
        (window.requestAnimationFrame || window.setTimeout)(() => {
          mainRenderScheduled = false;
          renderRation();
          renderTotals();
          // HEI is refreshed by the authoritative ration:changed pipeline; do not recompute from a visual render.
          Debug.snap();
        }, 16);
      }
      window.NutritionRationUI = Object.assign({}, window.NutritionRationUI || {}, {
        version: 'v5.3.194_gemini_batch_commit_flicker_fix',
        refresh: reason => scheduleMainRender(reason || 'external')
      });
      window.addEventListener('gemini:ration-imported', () => {
        scheduleMainRender('gemini:ration-imported');
        setTimeout(() => {
          try { if (window.__UI_DESIGN_AUDIT_V53110__ && typeof window.__UI_DESIGN_AUDIT_V53110__.sync === 'function') window.__UI_DESIGN_AUDIT_V53110__.sync(); } catch(_) {}
        }, 60);
      });
      Events.on('change', () => { scheduleMainRender('change'); });
      Events.on('region', () => { (window.requestAnimationFrame || window.setTimeout)(() => { renderTotals(); Debug.snap(); }, 16); });
      resetBtn.addEventListener('click', () => { if (confirm('Очистить рацион и сбросить данные калькулятора потребностей?')) { State.clear(); const nrb = document.getElementById('needs_reset_btn'); if (nrb) nrb.click(); else if (window.resetNeeds) window.resetNeeds(); } });
      if (clearRationBtn) {
        clearRationBtn.addEventListener('click', () => {
          const hasItems = State.get().length > 0;
          if (!hasItems) { alert('Рацион уже пуст.'); return; }
          if (confirm('Очистить Итоговый рацион?')) State.clear();
        });
      }
      devToggle.addEventListener('click', () => Debug.toggle());
      normProfile.addEventListener('change', (e) => {
  if (e.target.value === 'custom') { editNorms(); }
  else if (e.target.value === 'needs') { norms.profile='needs'; renderTotals(); Debug.snap(); }
  else { norms.profile='adult'; norms.values = JSON.parse(JSON.stringify(DAILY_NORMS_DEFAULT)); renderTotals(); Debug.snap(); }
});
      editNormsBtn.addEventListener('click', editNorms);

      let gsTimer = null;
      globalSearchInput.addEventListener('input', () => {
        clearTimeout(gsTimer);
        gsTimer = setTimeout(() => renderGlobalResults(globalSearchInput.value), 160);
      });
      globalSearchInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const firstAdd = globalResults && globalResults.querySelector('.search-result-card button[data-role="add"]');
        if (firstAdd) firstAdd.click();
      });
      globalSearchGrams.addEventListener('input', () => renderGlobalResults(globalSearchInput.value));
      globalSearchClear.addEventListener('click', () => {
        globalSearchInput.value = '';
        renderGlobalResults('');
        safeFocusNoScroll(globalSearchInput);
      });
      uxSearchExamples.forEach(btn => btn.addEventListener('click', () => {
        globalSearchInput.value = btn.dataset.searchExample || '';
        renderGlobalResults(globalSearchInput.value);
        safeFocusNoScroll(globalSearchInput);
      }));
      uxGramButtons.forEach(btn => btn.addEventListener('click', () => {
        globalSearchGrams.value = btn.dataset.searchGrams || '100';
        renderGlobalResults(globalSearchInput.value);
      }));

      groupingSeg.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-mode]'); if (!btn) return;
        groupingSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b===btn));
        groupingMode = btn.dataset.mode;
        buildAccordion();
      });

      regionSeg.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-region]'); if (!btn) return;
        regionSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b===btn));
        State.setRegion(btn.dataset.region);
      });
    }

    function editNorms() {
      const current = JSON.stringify(norms.values, null, 2);
      const next = prompt('Отредактируйте JSON с дневными нормами:', current);
      if (!next) return;
      try {
        const obj = JSON.parse(next);
        norms.profile = 'custom';
        norms.values = obj;
        normProfile.value = 'custom';
        renderTotals(); Debug.snap();
      } catch(e) {
        alert('Ошибка в JSON норм: ' + e.message);
      }
    }

    function init() {
      buildAccordion();
      if (uxDbCount) uxDbCount.textContent = DB.items.length;
      renderGlobalResults('');
      renderRation();
      renderTotals();
      attachEvents();
      if (DEV) Debug.open();
      const issues = Schema.validate();
      if (issues.length) Logger.warn('SCHEMA_ISSUES', issues.slice(0,5));
      Debug.snap();
      const region = State.getRegion();
      document.querySelectorAll('#regionSeg [data-region]').forEach(b=>b.classList.toggle('active', b.dataset.region===region));
    }

    return { init };
  })();

  const Debug = (() => {
    const panel = document.getElementById('devPanel');
    const content = document.getElementById('devContent');
    const tabs = document.getElementById('devTabs');
    let activeTab = 'state';
    const perf = [];
    function open() { panel.classList.add('open'); }
    function toggle() { panel.classList.toggle('open'); }
    function snap() { render(); }
    function perfPush(p) { perf.push({ ts: Date.now(), ...p }); }
    function render() {
      const ration = State.get();
      const logs = Logger.get();
      const issues = Schema.validate();
      const catCountsHEI = Object.fromEntries(Array.from(DB.byCatHEI.entries()).map(([k,v]) => [k, v.length]));
      const catCountsCatalog = Object.fromEntries(Array.from(DB.byCatCatalog.entries()).map(([k,v]) => [k, v.length]));
      const region = State.getRegion();
      let normCoverage = [];
      for (const k of MicroIndex.keys) {
        const lim = ACTIVE_NUTRIENT_LIMITS[k];
        normCoverage.push({ key:k, has: !!lim, min: !!(lim && lim.min), ul: (lim && (lim.ul!==undefined)), unit: unitOf(k) });
      }
      let html = '';
      if (activeTab === 'state') {
        html = `<h4>State</h4><pre>${JSON.stringify({ration, region}, null, 2)}</pre>`;
      } else if (activeTab === 'logs') {
        html = `<h4>Logs</h4><pre>${JSON.stringify(logs.slice(-200), null, 2)}</pre>`;
      } else if (activeTab === 'data') {
        html = `<h4>Data Quality</h4><pre>${JSON.stringify({issues, catCountsHEI, catCountsCatalog}, null, 2)}</pre>`;
      } else if (activeTab === 'perf') {
        html = `<h4>Performance</h4><pre>${JSON.stringify(perf.slice(-100), null, 2)}</pre>`;
      } else if (activeTab === 'tests') {
        html = `<h4>Tests</h4><pre>${JSON.stringify(Tests.run(), null, 2)}</pre>`;
      } else if (activeTab === 'norms') {
        html = `<h4>Norm Coverage (микро)</h4><pre>${JSON.stringify(normCoverage, null, 2)}</pre>`;
      }
      content.innerHTML = html;
    }
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tab]'); if (!btn) return;
      activeTab = btn.dataset.tab; render();
    });
    return { open, toggle, snap, perf: perfPush };
  })();

  const Tests = (() => {
    function approx(a,b,eps=1e-6) { return Math.abs(a-b) <= eps; }
    function run() {
      const out = [];
      const sample = DB.items.find(x => typeof x.kcal === 'number');
      if (sample) {
        const key = sample.key;
        const it100 = { key, grams: 100 };
        const s100 = Calc.scaledPerItem(it100);
        out.push({ name:'100g equals per100', pass: Object.keys(s100).length>0 });
        const it50 = { key, grams: 50 };
        const s50 = Calc.scaledPerItem(it50);
        const kcalHalf = approx((s100.kcal||0)/2, (s50.kcal||0));
        out.push({ name:'50g equals half (kcal)', pass: kcalHalf });
      } else {
        out.push({ name:'sample exists', pass:false });
      }
      const fake = { key:'_fake', grams: 100 };
      const p = { kcal:0, salt: 1.0 };
      DB.byKey.set('_fake', p);
      const s = Calc.scaledPerItem(fake);
      out.push({ name:'Sodium from salt', pass: approx(s.sodium_mg || 0, 393) });
      DB.byKey.delete('_fake');

      const coverageOK = MicroIndex.keys.every(k => !!MICRO_LIMITS[k] || k==='sodium_mg');
      out.push({ name:'MICRO_LIMITS coverage (best-effort)', pass: coverageOK });
      return out;
    }
    return { run };
  })();

  window.addEventListener('DOMContentLoaded', () => { UI.init(); });

;

