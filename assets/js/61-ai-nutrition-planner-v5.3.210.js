/* Nutrition Calculator v5.3.210 — deep multi-action AI ration correction. */
(function () {
  "use strict";
  var VERSION = "v5_3_210_p0_4_1_api_cost_abuse_guard";
  var BUILD = "v5.3.210";
  var FEATURE_LEVEL = 7;
  var API = "./api/gemini.php?v=5.3.210-p0.5";
  var STORAGE = "nutri_ai_planner_preferences_v5_3_210";
  var AI_ATTESTATION_KEY = "nutri_ai_nonclinical_transfer_consent_v2";
  var LEGACY_AI_ATTESTATION_KEY = "nutri_ai_user_18_attestation_v1";
  var serviceSessionPromise = null;
  var activeController = null,
    currentResult = null,
    running = false,
    calculationRevision = 0;

  var METRICS = [
    {
      key: "kcal",
      label: "Энергия",
      mode: "target",
      unit: "ккал",
      weight: 1.25,
      group: "macros"
    },
    {
      key: "protein_g",
      label: "Белок",
      mode: "min",
      unit: "г",
      weight: 1.35,
      group: "macros"
    },
    {
      key: "fat_g",
      label: "Жиры",
      mode: "target",
      unit: "г",
      weight: 1.05,
      group: "macros"
    },
    {
      key: "carbs_g",
      label: "Углеводы",
      mode: "target",
      unit: "г",
      weight: 1.0,
      group: "macros"
    },
    {
      key: "fiber_g",
      label: "Клетчатка",
      mode: "min",
      unit: "г",
      weight: 1.25,
      group: "macros"
    },
    {
      key: "sugars_g",
      label: "Общие сахара",
      mode: "info",
      unit: "г",
      weight: 0,
      group: "macros"
    },
    {
      key: "unsat_g",
      label: "Ненасыщенные жиры",
      mode: "info",
      unit: "г",
      weight: 0,
      group: "macros"
    },
    {
      key: "calcium_mg",
      label: "Кальций",
      mode: "min",
      unit: "мг",
      weight: 1.1,
      group: "minerals"
    },
    {
      key: "iron_mg",
      label: "Железо",
      mode: "min",
      unit: "мг",
      weight: 0.95,
      group: "minerals"
    },
    {
      key: "magnesium_mg",
      label: "Магний",
      mode: "min",
      unit: "мг",
      weight: 1.0,
      group: "minerals"
    },
    {
      key: "potassium_mg",
      label: "Калий",
      mode: "min",
      unit: "мг",
      weight: 1.0,
      group: "minerals"
    },
    {
      key: "phosphorus_mg",
      label: "Фосфор",
      mode: "min",
      unit: "мг",
      weight: 0.7,
      group: "minerals"
    },
    {
      key: "zinc_mg",
      label: "Цинк",
      mode: "min",
      unit: "мг",
      weight: 0.85,
      group: "minerals"
    },
    {
      key: "iodine_mcg",
      label: "Йод",
      mode: "min",
      unit: "мкг",
      weight: 0.9,
      group: "minerals"
    },
    {
      key: "selenium_mcg",
      label: "Селен",
      mode: "min",
      unit: "мкг",
      weight: 0.8,
      group: "minerals"
    },
    {
      key: "copper_mg",
      label: "Медь",
      mode: "min",
      unit: "мг",
      weight: 0.7,
      group: "minerals"
    },
    {
      key: "manganese_mg",
      label: "Марганец",
      mode: "min",
      unit: "мг",
      weight: 0.7,
      group: "minerals"
    },
    {
      key: "vitamin_a_mcg",
      label: "Витамин A",
      mode: "min",
      unit: "мкг",
      weight: 1.15,
      group: "vitamins"
    },
    {
      key: "vitamin_c_mg",
      label: "Витамин C",
      mode: "min",
      unit: "мг",
      weight: 0.9,
      group: "vitamins"
    },
    {
      key: "vitamin_d_mcg",
      label: "Витамин D",
      mode: "min",
      unit: "мкг",
      weight: 1.05,
      group: "vitamins"
    },
    {
      key: "vitamin_e_mg",
      label: "Витамин E",
      mode: "min",
      unit: "мг",
      weight: 0.85,
      group: "vitamins"
    },
    {
      key: "vitamin_k_mcg",
      label: "Витамин K",
      mode: "min",
      unit: "мкг",
      weight: 0.8,
      group: "vitamins"
    },
    {
      key: "vitamin_b1_mg",
      label: "Витамин B1",
      mode: "min",
      unit: "мг",
      weight: 0.75,
      group: "vitamins"
    },
    {
      key: "vitamin_b2_mg",
      label: "Витамин B2",
      mode: "min",
      unit: "мг",
      weight: 0.75,
      group: "vitamins"
    },
    {
      key: "vitamin_b3_mg",
      label: "Витамин B3",
      mode: "min",
      unit: "мг",
      weight: 0.7,
      group: "vitamins"
    },
    {
      key: "vitamin_b5_mg",
      label: "Витамин B5",
      mode: "min",
      unit: "мг",
      weight: 0.7,
      group: "vitamins"
    },
    {
      key: "vitamin_b6_mg",
      label: "Витамин B6",
      mode: "min",
      unit: "мг",
      weight: 0.75,
      group: "vitamins"
    },
    {
      key: "vitamin_b9_mcg",
      label: "Фолат",
      mode: "min",
      unit: "мкг",
      weight: 0.95,
      group: "vitamins"
    },
    {
      key: "vitamin_b12_mcg",
      label: "Витамин B12",
      mode: "min",
      unit: "мкг",
      weight: 0.9,
      group: "vitamins"
    },
    {
      key: "choline_mg",
      label: "Холин",
      mode: "min",
      unit: "мг",
      weight: 0.8,
      group: "other"
    },
    {
      key: "sodium_mg",
      label: "Натрий",
      mode: "max",
      unit: "мг",
      weight: 1.3,
      group: "limiters"
    },
    {
      key: "salt_g",
      label: "Соль (расчётно)",
      mode: "info",
      unit: "г",
      weight: 0,
      group: "limiters"
    },
    {
      key: "sfa_g",
      label: "Насыщенные жиры",
      mode: "max",
      unit: "г",
      weight: 1.2,
      group: "limiters"
    },
    {
      key: "added_sugars_g",
      label: "Добавленный сахар",
      mode: "max",
      unit: "г",
      weight: 1.1,
      group: "limiters"
    }
  ];
  var METRIC_BY_KEY = {};
  METRICS.forEach(function (m) {
    METRIC_BY_KEY[m.key] = m;
  });
  var MACRO_KEYS = ["kcal", "protein_g", "fat_g", "carbs_g"];

  function arr(x) {
    return Array.isArray(x) ? x : [];
  }
  function list(x) {
    try {
      return Array.prototype.slice.call(x || []);
    } catch (_) {
      return [];
    }
  }
  function num(x, d) {
    x = Number(x);
    return Number.isFinite(x) ? x : d == null ? 0 : d;
  }
  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }
  function round(x, d) {
    var m = Math.pow(10, d == null ? 1 : d);
    return Math.round(num(x) * m) / m;
  }
  function text(x, max) {
    var s = String(x == null ? "" : x)
      .replace(/\s+/g, " ")
      .trim();
    return max && s.length > max ? s.slice(0, max) : s;
  }
  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }
  function clone(x) {
    try {
      return JSON.parse(JSON.stringify(x));
    } catch (_) {
      return x;
    }
  }
  function uniq(a) {
    var o = [];
    arr(a).forEach(function (x) {
      if (x != null && o.indexOf(x) < 0) o.push(x);
    });
    return o;
  }
  function $(id) {
    return document.getElementById(id);
  }
  function dbProduct(key) {
    try {
      return window.DB && window.DB.byKey && window.DB.byKey.get
        ? window.DB.byKey.get(key)
        : null;
    } catch (_) {
      return null;
    }
  }
  function dbItems() {
    try {
      return window.DB && Array.isArray(window.DB.items) ? window.DB.items : [];
    } catch (_) {
      return [];
    }
  }
  function ration() {
    try {
      return window.State && typeof window.State.get === "function"
        ? arr(window.State.get())
        : [];
    } catch (_) {
      return [];
    }
  }
  function core() {
    return (
      window.NutritionCalculationCore ||
      window.NutritionCalculationCoreV53155 ||
      null
    );
  }
  function activeRegion() {
    try {
      return localStorage.getItem("nutri_norm_region") === "eu" ? "eu" : "us";
    } catch (_) {
      return "us";
    }
  }
  function profile() {
    return {
      age: num($("needs_age") && $("needs_age").value, 30),
      sex: text($("needs_sex") && $("needs_sex").value, 20) || "male"
    };
  }
  function aiAttested() {
    var box = $("geminiAiEligibility");
    if (box && box.checked) return true;
    try { return sessionStorage.getItem(AI_ATTESTATION_KEY) === "1" || sessionStorage.getItem(LEGACY_AI_ATTESTATION_KEY) === "1"; } catch (_) { return false; }
  }
  function setAiAttestation(value) {
    value = !!value;
    try { if (value) sessionStorage.setItem(AI_ATTESTATION_KEY, "1"); else { sessionStorage.removeItem(AI_ATTESTATION_KEY); sessionStorage.removeItem(LEGACY_AI_ATTESTATION_KEY); } } catch (_) {}
    ["geminiAiEligibility", "geminiRationAiEligibility"].forEach(function (id) { var el=$(id); if(el) el.checked=value; });
  }
  function aiUsageContext() {
    var stateEl=$("needs_state"), guardEl=$("needs_guardrail");
    var state=text(stateEl && stateEl.value,40) || "normal";
    var guardrail=text(guardEl && guardEl.value,40) || "none";
    var nutritionSafety=window.__lastNeedsMeta&&window.__lastNeedsMeta.refeedingRisk||null;
    var policy=window.ProtectedModesP03?window.ProtectedModesP03.currentPolicy():null;
    var clinical=policy ? policy.geminiAllowed===false : (["preop","postop","icu","ckd","dialysis","oncology"].indexOf(state)>=0 || guardrail!=="none" || !!(nutritionSafety&&nutritionSafety.highRisk));
    var confirmed=aiAttested();
    return {
      user_confirmed_18: confirmed,
      non_clinical_use: confirmed,
      media_transfer_consent: confirmed,
      professional_business_use: false,
      profile_state: state,
      clinical_profile: clinical,
      protected_mode: !!(policy&&policy.protectedMode),
      protected_reason: policy&&policy.primaryReason||"",
      gemini_allowed: confirmed && !clinical
    };
  }
  function aiLocalOnlyReason(ctx) {
    if (!ctx.user_confirmed_18 || !ctx.non_clinical_use || !ctx.media_transfer_consent) return "Не подтверждены возраст 18+, немедицинское использование и согласие на передачу данных: варианты будут рассчитаны локально без отправки данных в Gemini.";
    if (ctx.clinical_profile) return ctx.protected_reason || "Для выбранного защищённого профиля варианты будут рассчитаны локально без отправки данных в Gemini.";
    return "";
  }
  function ensureServiceSession() {
    if (serviceSessionPromise) return serviceSessionPromise;
    serviceSessionPromise=fetch(API,{method:"GET",credentials:"same-origin",headers:{Accept:"application/json"},cache:"no-store"}).then(function(r){return r.json();}).then(function(data){
      if(!data || data.ok!==true || !data.csrf_token) throw new Error("Серверная сессия Gemini недоступна");
      if(data.ai_available===false){var guardError=new Error("Gemini временно недоступен по серверному защитному бюджету; локальная коррекция продолжит работать без AI.");guardError.code=text(data.availability_code,80)||"guard_unavailable";guardError.retryAfter=Math.max(0,Number(data.retry_after_seconds)||0);throw guardError;}
      return text(data.csrf_token,160);
    }).finally(function(){serviceSessionPromise=null;});
    return serviceSessionPromise;
  }
  function metricSpec(key) {
    var own = METRIC_BY_KEY[key],
      c = core(),
      raw = null;
    try {
      if (c && typeof c.getMetricSpec === "function")
        raw = c.getMetricSpec(key);
    } catch (_) {}
    return {
      key: key,
      label: (own && own.label) || (raw && raw.title) || key,
      mode:
        (own && own.mode) ||
        ((raw && raw.mode) === "upper_limit"
          ? "max"
          : (raw && raw.mode) === "informational"
            ? "info"
            : "min"),
      unit:
        (own && own.unit) ||
        (raw && raw.unit) ||
        (/_mcg$/.test(key)
          ? "мкг"
          : /_mg$/.test(key)
            ? "мг"
            : /_g$/.test(key)
              ? "г"
              : ""),
      weight: num(own && own.weight, 0.65),
      group:
        (own && own.group) ||
        (/^vitamin_/.test(key)
          ? "vitamins"
          : /_mg$|_mcg$/.test(key)
            ? "minerals"
            : "other")
    };
  }
  function normRaw(key) {
    var values = (window.norms && window.norms.values) || {},
      v = values[key];
    if (v && typeof v === "object") v = v.value;
    v = num(v, 0);
    if (v > 0) return v;
    var fall = {
      kcal: 2000,
      protein_g: 60,
      fat_g: 70,
      carbs_g: 260,
      fiber_g: 25,
      sodium_mg: 2300,
      salt_g: 5.8,
      sfa_g: 22,
      added_sugars_g: 50
    };
    return num(fall[key], 0);
  }
  function upperLimitRaw(key) {
    try {
      if (typeof window.__resolveMicroLimitsForQA === "function") {
        var p = profile(),
          r = window.__resolveMicroLimitsForQA(
            key,
            activeRegion(),
            p.age,
            p.sex
          ),
          scope = text(r && r.ul && r.ul.scope, 40).toLowerCase();
        var u = r && r.ul && num(r.ul.value, 0);
        if (u > 0 && (!scope || scope === "total")) return u;
        var safe = r && r.safe && num(r.safe.value, 0);
        if (safe > 0) return safe;
      }
    } catch (_) {}
    var fall = {
      vitamin_d_mcg: 100,
      calcium_mg: 2500,
      iron_mg: 45,
      zinc_mg: 25,
      iodine_mcg: 600,
      selenium_mcg: 255,
      copper_mg: 5,
      phosphorus_mg: 4000
    };
    return num(fall[key], 0);
  }
  function sourceQuality(p, nutrientKey) {
    var engine = window.ProductDataQualityV13;
    if (engine && typeof engine.productScore === "function")
      return engine.productScore(p, nutrientKey || "");
    return 0.25;
  }
  function productRole(p) {
    var c = (
        text(p && p.catalog_category_key, 80) +
        " " +
        text(p && p.category, 80) +
        " " +
        text(p && p.hei_category_key, 80)
      ).toLowerCase(),
      n = text(p && (p.name_ru || p.name), 160).toLowerCase();
    if (
      /veget|овощ|root|green|mushroom|crucifer|starchy/.test(c) ||
      /морков|тыкв|капуст|броккол|св[её]кл|кабач|баклаж|томат|огурц/.test(n)
    )
      return "vegetable";
    if (/fruit|фрукт|ягод/.test(c)) return "fruit";
    if (/whole_grain|refined_grain|grain|bakery|круп|злак|хлеб/.test(c))
      return "grain";
    if (/seafood|protein|meat|legume|nuts|seed|рыб|мяс|боб|орех/.test(c))
      return "protein";
    if (/dairy|молоч/.test(c)) return "dairy";
    if (/oil|fat|масл|жир/.test(c)) return "fat";
    if (/sweet|snack|ready_food|fastfood|dessert|слад|снек/.test(c))
      return "discretionary";
    if (/drink|напит/.test(c)) return "drink";
    return "other";
  }
  function productFlags(p) {
    var blob = (
      text(p && (p.name_ru || p.name), 180) +
      " " +
      text(p && p.category, 100) +
      " " +
      text(p && p.state, 60) +
      " " +
      arr(p && p.tags).join(" ")
    ).toLowerCase();
    return {
      excluded:
        /supplement|sports[_ ]protein|protein[_ ]supplement|mass[_ ]gainer|гейнер|бад\b|витаминн.{0,8}комплекс/.test(
          blob
        ),
      herb: /\bherbs?\b|зелень|петруш|укроп|базилик|кинз/.test(blob),
      spice: /spice|seasoning|прян|спец|порошок/.test(blob),
      dried: /dried|dehydrated|суш[её]н|вялен/.test(blob),
      seeds: /nuts_seeds|seed|семен|орех/.test(blob),
      organ: /offal|\bliver\b|печен/.test(blob),
      concentratedRetinol:
        /rich_vitamin_a|high_vitamin_a|\bliver\b|печен|cod liver|треск.{0,15}печен/.test(
          blob
        ),
      processed:
        /processed|ultra_processed|плавлен|колбас|сосиск|fastfood/.test(blob),
      powder: /powder|сухое молоко|молоко сухое|порошк/.test(blob),
      ingredient:
        /\bbran\b|отруб|\bflour\b|мука|крахмал|starch|текстурирован|текстурат|protein isolate|protein concentrate|изолят|концентрат белка|\bdry\b/.test(
          blob
        ),
      cheese: /cheese|сыр/.test(blob),
      familiar:
        /морков|тыкв|батат|картоф|броккол|капуст|шпинат|св[её]кл|кабач|томат|перец|яблок|банан|апельс|смород|чечев|фасол|нут|греч|овся|рис|творог|йогурт|кефир|яйц|куриц|индей|лосос|форел|треск|сардин|тофу/.test(
          blob
        ),
      niche:
        /листья репы|листовая горчица|угорь|помело|гуава|окра|мангольд|маитаке|шиитаке|хикама|тефф/.test(
          blob
        ),
      dairy: productRole(p) === "dairy",
      fish: /fish|seafood|рыб|треск|лосос|тунец|угор/.test(blob),
      meat: /meat|poultry|chicken|beef|pork|мяс|куриц|индей|говяд|свин/.test(
        blob
      ),
      egg: /\begg\b|яйц/.test(blob),
      legumes: /legume|lentil|bean|pea|нут|чечев|фасол|горох/.test(blob),
      gluten: /wheat|barley|rye|пшен|ячмен|рож/.test(blob)
    };
  }
  function productSubrole(p) {
    var role = productRole(p),
      f = productFlags(p),
      blob = (
        text(p && (p.name_ru || p.name), 180) +
        " " +
        text(p && p.category, 100) +
        " " +
        text(p && p.state, 50) +
        " " +
        arr(p && p.tags).join(" ")
      ).toLowerCase();
    if (f.ingredient || f.powder) return "ingredient";
    if (role === "grain") {
      if (/bread|хлеб|лаваш|булоч/.test(blob)) return "bread";
      if (/pasta|макарон|лапш/.test(blob)) return "pasta";
      if (/cooked|boiled|вар[её]н|готов/.test(blob)) return "cooked_grain";
      return "grain_other";
    }
    if (role === "dairy") {
      if (/yog|кефир|айран|йогур/.test(blob)) return "fermented_dairy";
      if (f.cheese) return "cheese";
      if (/curd|творог/.test(blob)) return "curd";
      return "dairy_other";
    }
    if (role === "protein") {
      if (f.fish) return "fish";
      if (f.legumes) return "legumes";
      if (f.egg) return "egg";
      if (f.meat) return "meat";
      return "protein_other";
    }
    return role;
  }
  function blockedByConstraint(p, preferences) {
    var q = text(preferences && preferences.constraint, 600).toLowerCase(),
      f = productFlags(p);
    if (!q) return false;
    function denied(re) {
      return re.test(q);
    }
    if (
      f.dairy &&
      denied(
        /без\s+(молоч|сыра|молока)|не\s+(добавлять|использовать|хочу)\s+.{0,20}(молоч|сыр|молок)/
      )
    )
      return true;
    if (
      f.fish &&
      denied(/без\s+рыб|не\s+(добавлять|использовать|хочу)\s+.{0,15}рыб/)
    )
      return true;
    if (
      f.meat &&
      denied(/без\s+мяс|не\s+(добавлять|использовать|хочу)\s+.{0,15}мяс/)
    )
      return true;
    if (
      f.egg &&
      denied(/без\s+яиц|без\s+яйц|не\s+(добавлять|использовать)\s+.{0,15}яйц/)
    )
      return true;
    if (
      f.seeds &&
      denied(
        /без\s+(орех|семен)|не\s+(добавлять|использовать)\s+.{0,20}(орех|семен)/
      )
    )
      return true;
    if (
      f.legumes &&
      denied(
        /без\s+боб|не\s+(добавлять|использовать)\s+.{0,15}(боб|чечев|фасол|горох)/
      )
    )
      return true;
    if (f.gluten && denied(/без\s+глютен|глютен\s+исключ/)) return true;
    return false;
  }
  function practicalPortions(p, role) {
    var f = productFlags(p),
      vals = [];
    arr(p && p.serving_units).forEach(function (u) {
      var g = num(u && u.grams, 0);
      if (g >= 2 && g <= 500) vals.push(round(g, 1));
    });
    if (vals.length) {
      vals.sort(function (a, b) {
        return a - b;
      });
      var mid = vals[Math.floor(vals.length / 2)],
        cap =
          role === "fruit"
            ? 250
            : role === "fat"
              ? 30
              : role === "protein"
                ? 200
                : role === "grain"
                  ? 250
                  : 300;
      return uniq([
        Math.max(2, round(Math.min(mid * 0.6, cap), 1)),
        round(Math.min(mid, cap), 1),
        round(Math.min(mid * 1.4, cap), 1)
      ]).filter(function (g) {
        return g >= 2;
      });
    }
    if (f.herb) return [5, 10, 15];
    if (f.spice) return [2, 5, 10];
    if (f.organ) return [15, 25, 35];
    if (f.powder) return [10, 20, 30];
    if (f.cheese) return [20, 30, 50];
    if (f.dried) return [15, 25, 40];
    if (f.seeds) return [10, 20, 30];
    if (role === "fat") return [5, 10, 15];
    if (role === "dairy") return [100, 150, 200];
    if (role === "protein" || role === "grain") return [50, 75, 100, 150];
    if (role === "fruit") return [75, 100, 150, 200];
    return [50, 100, 150, 200];
  }
  function nutrient100(p) {
    var c = core();
    if (!c || typeof c.scaledPerItem !== "function" || !p) return {};
    try {
      return c.scaledPerItem({ key: p.key, grams: 100 }) || {};
    } catch (_) {
      return {};
    }
  }
  function nutrientCoverage(raw, key, before) {
    var list = arr(before && before.snapshot && before.snapshot.nutrientRation);
    if (!list.length) list = normalizeRation(raw);
    var total = 0,
      covered = 0;
    list.forEach(function (it) {
      var g = Math.max(0, num(it && it.grams, 0)),
        p = dbProduct(it && it.key);
      if (!(g > 0) || !p) return;
      total += g;
      var n = nutrient100(p);
      if (Object.prototype.hasOwnProperty.call(n, key))
        covered += g * sourceQuality(p, key);
    });
    return total ? clamp(covered / total, 0, 1) : 0;
  }
  function calc(r) {
    var c = core();
    if (!c || typeof c.snapshot !== "function")
      throw new Error("Расчётное ядро не готово.");
    var snap = c.snapshot(r),
      tot = snap.totals || {},
      energyRef = normRaw("kcal") || num(tot.kcal, 2000),
      hei = null;
    try {
      if (window.HEIRuntimeV2 && typeof window.HEIRuntimeV2.calculateFromSnapshot === 'function')
        hei = window.HEIRuntimeV2.calculateFromSnapshot(snap, energyRef);
      else if (window.HEI && window.HEI.computeIntake && window.HEI.score)
        hei = window.HEI.score(
          window.HEI.computeIntake(snap.foodPatternRation || r, window.DB),
          energyRef
        );
    } catch (_) {
      hei = null;
    }
    var assessment = null;
    try {
      if (window.DietInterpretationEngineV1 && typeof window.DietInterpretationEngineV1.build === 'function')
        assessment = window.DietInterpretationEngineV1.build(hei, snap);
    } catch (_) { assessment = null; }
    return {
      ration: r,
      snapshot: snap,
      totals: tot,
      hei: hei,
      hei_total: hei ? num(hei.total, 0) : null,
      diet_assessment: assessment
    };
  }
  function normalizeRation(raw) {
    return arr(raw)
      .filter(function (x) {
        return x && x.key && num(x.grams) > 0;
      })
      .map(function (x) {
        return clone(x);
      });
  }
  function addToVirtual(raw, key, grams) {
    var r = normalizeRation(raw),
      found = null;
    for (var i = 0; i < r.length; i++)
      if (r[i].key === key && !Array.isArray(r[i].children)) {
        found = r[i];
        break;
      }
    if (found) found.grams = clamp(num(found.grams) + num(grams), 0, 5000);
    else {
      var p = dbProduct(key);
      r.push({
        id: key,
        key: key,
        name_ru: (p && (p.name_ru || p.name)) || key,
        hei_category_key: (p && p.hei_category_key) || "other",
        catalog_category_key: (p && p.catalog_category_key) || "other",
        grams: num(grams)
      });
    }
    return r;
  }
  function reduceVirtual(raw, ref, grams) {
    var r = normalizeRation(raw);
    for (var i = 0; i < r.length; i++) {
      var it = r[i];
      if ((it.id === ref || it.key === ref) && !Array.isArray(it.children)) {
        it.grams = Math.max(0, num(it.grams) - num(grams));
        break;
      }
    }
    return r.filter(function (x) {
      return num(x.grams) > 0;
    });
  }
  function applyOpsVirtual(raw, ops) {
    var r = normalizeRation(raw);
    arr(ops).forEach(function (op) {
      if (op.type === "add") r = addToVirtual(r, op.product_id, op.grams);
      else if (op.type === "reduce")
        r = reduceVirtual(r, op.ref || op.product_id, op.grams);
      else if (op.type === "replace") {
        r = reduceVirtual(r, op.from_ref || op.from_product_id, op.from_grams);
        r = addToVirtual(r, op.to_product_id, op.to_grams);
      }
    });
    return r;
  }
  function statusFor(value, spec, norm) {
    if (spec.mode === "info" || !(norm > 0)) return "info";
    var ratio = value / norm;
    if (spec.mode === "max") return ratio > 1.05 ? "high" : "ok";
    if (spec.mode === "target")
      return ratio < 0.9 ? "low" : ratio > 1.1 ? "high" : "ok";
    return ratio < 0.9 ? "low" : "ok";
  }
  function distanceToRange(value, spec, norm) {
    if (!(norm > 0) || spec.mode === "info") return 0;
    var r = value / norm;
    if (spec.mode === "max") return Math.max(0, r - 1);
    if (spec.mode === "target")
      return r < 0.9 ? 0.9 - r : r > 1.1 ? r - 1.1 : 0;
    return Math.max(0, 0.9 - r);
  }
  function allMetricKeys(before, after) {
    var keys = METRICS.map(function (m) {
        return m.key;
      }),
      objs = [before && before.totals, after && after.totals];
    objs.forEach(function (o) {
      Object.keys(o || {}).forEach(function (k) {
        if (
          (/^vitamin_/.test(k) || /_mg$|_mcg$|_g$/.test(k) || k === "kcal") &&
          keys.indexOf(k) < 0
        )
          keys.push(k);
      });
    });
    return keys;
  }
  function analysisOf(raw, preferences) {
    var before = calc(raw),
      tot = before.totals,
      all = [],
      def = [],
      exc = [],
      caveats = [],
      by = {};
    allMetricKeys(before, null).forEach(function (k) {
      var spec = metricSpec(k),
        norm = normRaw(k),
        value = num(tot[k], 0),
        coverage = nutrientCoverage(raw, k, before),
        status = statusFor(value, spec, norm),
        ratio = norm > 0 ? value / norm : null,
        upper = upperLimitRaw(k),
        row = {
          key: k,
          label: spec.label,
          unit: spec.unit,
          mode: spec.mode,
          group: spec.group,
          weight: spec.weight,
          value: round(value, 3),
          norm: round(norm, 3),
          upper: round(upper, 3),
          ratio: ratio == null ? null : round(ratio, 4),
          status: status,
          coverage: round(coverage, 2),
          distance: round(distanceToRange(value, spec, norm), 4)
        };
      by[k] = row;
      all.push(row);
      if (spec.mode === "info" || !(norm > 0)) return;
      if ((spec.mode === "min" || spec.mode === "target") && status === "low") {
        if (coverage < 0.55 && spec.group !== "macros") {
          caveats.push({
            key: k,
            label: spec.label,
            coverage: round(coverage, 2),
            reason: "Недостаточное покрытие продуктовых карточек"
          });
          return;
        }
        row.gap = round(Math.max(0, norm - value), 3);
        row.severity = round(clamp(row.distance / 0.9, 0, 1), 3);
        def.push(row);
      }
      if (
        (spec.mode === "max" || spec.mode === "target") &&
        status === "high"
      ) {
        row.excess = round(Math.max(0, value - norm), 3);
        row.severity = round(clamp(row.distance / 1.5, 0, 1), 3);
        exc.push(row);
      }
    });
    def.sort(function (a, b) {
      return b.severity * b.weight - a.severity * a.weight;
    });
    exc.sort(function (a, b) {
      return b.severity * b.weight - a.severity * a.weight;
    });
    var selected =
      (preferences && preferences.target_key && by[preferences.target_key]) ||
      null;
    return {
      before: before,
      metrics: all,
      by_key: by,
      deficits: def,
      excesses: exc,
      data_caveats: caveats,
      selected_target: selected,
      primary: def
        .concat(exc)
        .sort(function (a, b) {
          return b.severity * b.weight - a.severity * a.weight;
        })
        .slice(0, 10)
    };
  }
  function structuralBenefits(p) {
    var role = productRole(p),
      out = [];
    if (role === "vegetable") out.push("vegetables");
    if (role === "fruit") out.push("fruits");
    if (role === "grain" && /whole/.test(String(p.hei_category_key || "")))
      out.push("whole_grains");
    if (
      role === "protein" &&
      /seafood|plant/.test(String(p.hei_category_key || ""))
    )
      out.push("seafood_plant");
    return out;
  }
  function candidateObjectives(analysis, preferences) {
    if (preferences.task === "metric" && analysis.selected_target) {
      var t = analysis.selected_target;
      if (t.status === "low") return [t];
      if (t.status === "high" && t.mode === "target")
        return analysis.deficits.slice(0, 5);
      return analysis.deficits.slice(0, 6);
    }
    return analysis.deficits.slice(0, 10);
  }
  function candidateMatrix(analysis, preferences) {
    var currentKeys = {};
    ration().forEach(function (x) {
      currentKeys[x.key] = true;
    });
    var objectives = candidateObjectives(analysis, preferences),
      excessMap = {};
    analysis.excesses.forEach(function (x) {
      excessMap[x.key] = x;
    });
    var selected = analysis.selected_target,
      candidates = [];
    dbItems().forEach(function (p) {
      if (
        !p ||
        !p.key ||
        p.hidden_from_search === true ||
        p.is_composite_food === true
      )
        return;
      var flags = productFlags(p),
        role = productRole(p);
      if (
        flags.excluded ||
        flags.ingredient ||
        blockedByConstraint(p, preferences) ||
        role === "discretionary" ||
        role === "drink" ||
        role === "other"
      )
        return;
      if (
        role === "protein" &&
        String(p.state || "").toLowerCase() === "raw" &&
        (flags.meat || flags.fish || flags.egg)
      )
        return;
      var n = nutrient100(p),
        quality = sourceQuality(p),
        portionList = practicalPortions(p, role),
        referencePortion =
          portionList[Math.min(1, portionList.length - 1)] || 100,
        benefits = [],
        benefitScore = 0;
      objectives.forEach(function (d) {
        var v = num(n[d.key], 0),
          atPortion = (v * referencePortion) / 100;
        if (v <= 0) return;
        var need = Math.max(num(d.gap, 0), num(d.norm, 0) * 0.08, 0.01),
          frac = clamp(atPortion / need, 0, 1);
        if (frac >= 0.04) {
          benefits.push({
            key: d.key,
            label: d.label,
            per100: round(v, 3),
            per_portion: round(atPortion, 3),
            gap_share: round(frac, 2)
          });
          benefitScore += frac * d.weight * (0.8 + num(d.severity, 0.2));
        }
      });
      var structural = structuralBenefits(p);
      benefitScore += structural.length * 0.14;
      var kcal = num(n.kcal, 0),
        sodium = num(n.sodium_mg, 0),
        sfa = num(n.sfa_g, 0),
        sugar = num(n.added_sugars_g, 0),
        penalty = 0;
      if (excessMap.sodium_mg)
        penalty += clamp((sodium * referencePortion) / 100 / 500, 0, 2) * 0.9;
      if (excessMap.sfa_g)
        penalty += clamp((sfa * referencePortion) / 100 / 6, 0, 2) * 0.9;
      if (excessMap.added_sugars_g)
        penalty += clamp((sugar * referencePortion) / 100 / 15, 0, 2) * 0.9;
      if (preferences.preserve_energy)
        penalty += clamp((kcal * referencePortion) / 100 / 300, 0, 1.5) * 0.45;
      if (selected && selected.status === "high") {
        var sv = (num(n[selected.key], 0) * referencePortion) / 100,
          den = Math.max(num(selected.norm, 1) * 0.12, 0.01);
        penalty += clamp(sv / den, 0, 2) * selected.weight;
      }
      if (flags.herb || flags.spice) penalty += 0.34;
      if (flags.organ) penalty += 1.15;
      if (flags.concentratedRetinol) penalty += 1.35;
      if (flags.powder) penalty += 0.5;
      if (flags.processed) penalty += 0.28;
      if (flags.niche) penalty += 0.55;
      if (quality < 0.5) penalty += 0.8;
      var practicality = 1;
      if (flags.herb || flags.spice) practicality *= 0.55;
      if (flags.organ) practicality *= 0.62;
      if (flags.powder) practicality *= 0.55;
      if (flags.dried) practicality *= 0.78;
      if (flags.processed) practicality *= 0.82;
      if (flags.niche) practicality *= 0.62;
      if (flags.familiar) practicality = Math.min(1.12, practicality + 0.12);
      if (
        !benefits.length &&
        !structural.length &&
        !(preferences.task === "replace")
      )
        return;
      var score =
        benefitScore * quality * practicality -
        penalty +
        (currentKeys[p.key] ? -0.08 : 0.08);
      if (preferences.task === "replace" && score <= 0)
        score = quality * 0.2 - penalty;
      if (score <= -0.2) return;
      candidates.push({
        product_id: p.key,
        name: text(p.name_ru || p.name || p.key, 120),
        role: role,
        subrole: productSubrole(p),
        quality: round(quality, 2),
        practicality: round(practicality, 2),
        score: round(score, 4),
        benefits: benefits.slice(0, 7),
        structural: structural,
        portions: portionList,
        reference_portion_g: referencePortion,
        cautions: uniq([
          flags.organ
            ? "Концентрированный продукт: оценивается только умеренная порция."
            : "",
          flags.processed
            ? "Следует учитывать степень переработки продукта."
            : ""
        ]).filter(Boolean),
        risks: {
          kcal_per100: round(kcal, 1),
          protein_g_per100: round(num(n.protein_g), 2),
          fat_g_per100: round(num(n.fat_g), 2),
          carbs_g_per100: round(num(n.carbs_g), 2),
          sodium_mg_per100: round(sodium, 1),
          sfa_g_per100: round(sfa, 2),
          added_sugars_g_per100: round(sugar, 2)
        },
        already_in_ration: !!currentKeys[p.key]
      });
    });
    candidates.sort(function (a, b) {
      return b.score - a.score || b.quality - a.quality;
    });
    var seen = {},
      out = [];
    candidates.forEach(function (c) {
      var sig = c.name
        .toLowerCase()
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/[^a-zа-яё0-9]+/g, " ");
      if (seen[sig]) return;
      seen[sig] = true;
      out.push(c);
    });
    return out.slice(0, 40);
  }
  function portions(candidate) {
    return arr(candidate && candidate.portions).length
      ? candidate.portions
      : practicalPortions(
          dbProduct(candidate && candidate.product_id),
          candidate && candidate.role
        );
  }
  function itemMetricValue(it, key) {
    var p = dbProduct(it && it.key);
    if (!p) return 0;
    return (num(nutrient100(p)[key], 0) / 100) * num(it.grams);
  }
  function itemEnergyPerGram(it) {
    return itemMetricValue({ key: it.key, grams: 100 }, "kcal") / 100;
  }
  function compensationOperation(raw, addedKcal, targetKeys, excludeRefs) {
    if (!(addedKcal > 3)) return null;
    var excluded = {};
    arr(Array.isArray(excludeRefs) ? excludeRefs : [excludeRefs]).forEach(
      function (ref) {
        if (ref) excluded[ref] = true;
      }
    );
    var list = normalizeRation(raw).filter(function (it) {
      var ref = it.id || it.key;
      return (
        !Array.isArray(it.children) &&
        num(it.grams) >= 20 &&
        itemEnergyPerGram(it) > 0.2 &&
        !excluded[ref] &&
        !excluded[it.key]
      );
    });
    list.sort(function (a, b) {
      var pa = dbProduct(a.key),
        pb = dbProduct(b.key),
        ra = productRole(pa),
        rb = productRole(pb),
        wa =
          ra === "discretionary"
            ? 3.4
            : ra === "fat"
              ? 2.6
              : ra === "grain"
                ? 1.45
                : 1,
        wb =
          rb === "discretionary"
            ? 3.4
            : rb === "fat"
              ? 2.6
              : rb === "grain"
                ? 1.45
                : 1;
      arr(targetKeys).forEach(function (k) {
        wa -= itemMetricValue(a, k) * 0.00012;
        wb -= itemMetricValue(b, k) * 0.00012;
      });
      return wb - wa;
    });
    for (var i = 0; i < list.length; i++) {
      var it = list[i],
        kpg = itemEnergyPerGram(it),
        g = round(addedKcal / kpg, 1),
        max = num(it.grams) * 0.65;
      g = Math.min(g, max);
      if (g >= 5) {
        return {
          type: "reduce",
          ref: it.id || it.key,
          product_id: it.key,
          grams: round(g, 1),
          name: text(
            (dbProduct(it.key) || {}).name_ru || it.name_ru || it.key,
            120
          )
        };
      }
    }
    return null;
  }
  function compensationOperations(
    raw,
    addedKcal,
    targetKeys,
    excludeRefs,
    slots
  ) {
    var out = [],
      remaining = Math.max(0, num(addedKcal)),
      excluded = arr(excludeRefs).slice(),
      virtual = normalizeRation(raw),
      maxSlots = Math.max(0, num(slots, 0));
    while (
      remaining > Math.max(20, normRaw("kcal") * 0.01) &&
      out.length < maxSlots
    ) {
      var op = compensationOperation(virtual, remaining, targetKeys, excluded);
      if (!op) break;
      out.push(op);
      excluded.push(op.ref || op.product_id);
      remaining = Math.max(
        0,
        remaining - itemEnergyPerGram({ key: op.product_id }) * num(op.grams)
      );
      virtual = reduceVirtual(virtual, op.ref || op.product_id, op.grams);
    }
    return { operations: out, remaining_kcal: round(remaining, 1) };
  }
  function fullMetricState(before, after, analysis) {
    var out = {};
    allMetricKeys(before, after).forEach(function (k) {
      var spec = metricSpec(k),
        a = num(before.totals[k], 0),
        b = num(after.totals[k], 0),
        norm = normRaw(k),
        upper = upperLimitRaw(k);
      out[k] = {
        key: k,
        label: spec.label,
        unit: spec.unit,
        mode: spec.mode,
        group: spec.group,
        before: round(a, 3),
        after: round(b, 3),
        delta: round(b - a, 3),
        norm: round(norm, 3),
        upper: round(upper, 3),
        status_before: statusFor(a, spec, norm),
        status_after: statusFor(b, spec, norm),
        distance_before: round(distanceToRange(a, spec, norm), 4),
        distance_after: round(distanceToRange(b, spec, norm), 4)
      };
    });
    out.hei_total = {
      key: "hei_total",
      label: "HEI‑2020",
      unit: "балла",
      mode: "score",
      group: "models",
      before: before.hei_total == null ? null : round(before.hei_total, 1),
      after: after.hei_total == null ? null : round(after.hei_total, 1),
      delta:
        before.hei_total == null || after.hei_total == null
          ? null
          : round(after.hei_total - before.hei_total, 1),
      norm: 100,
      upper: 0,
      status_before: "info",
      status_after: "info"
    };
    return out;
  }
  function constraintViolations(metrics, preferences) {
    var v = [];
    function m(k) {
      return metrics[k] || {};
    }
    var energyTol = Math.max(50, normRaw("kcal") * 0.03),
      proteinTol = Math.max(2, num(m("protein_g").before) * 0.03),
      fatTol = Math.max(2, normRaw("fat_g") * 0.03),
      carbTol = Math.max(5, normRaw("carbs_g") * 0.03);
    if (
      preferences.preserve_energy &&
      Math.abs(num(m("kcal").delta)) > energyTol
    )
      v.push("energy");
    if (
      preferences.preserve_protein &&
      num(m("protein_g").after) < num(m("protein_g").before) - proteinTol
    )
      v.push("protein");
    if (
      preferences.no_raise_fat &&
      num(m("fat_g").after) > num(m("fat_g").before) + fatTol
    )
      v.push("fat");
    if (
      preferences.no_raise_carbs &&
      num(m("carbs_g").after) > num(m("carbs_g").before) + carbTol
    )
      v.push("carbs");
    if (
      preferences.no_raise_sodium &&
      num(m("sodium_mg").after) > num(m("sodium_mg").before) + 50
    )
      v.push("sodium");
    Object.keys(metrics).forEach(function (k) {
      var x = metrics[k];
      if (!x || k === "hei_total") return;
      if (x.upper > 0 && x.before <= x.upper && x.after > x.upper * 1.01)
        v.push("upper:" + k);
      if (
        x.mode === "min" &&
        x.status_before === "ok" &&
        x.status_after === "low" &&
        x.after < x.before
      )
        v.push("new_low:" + k);
      if (
        x.mode === "max" &&
        x.status_before === "ok" &&
        x.status_after === "high" &&
        x.after > x.before
      )
        v.push("new_high:" + k);
    });
    return uniq(v);
  }
  function scenarioScore(metrics, analysis, ops, quality, preferences) {
    var score = 0,
      improved = [],
      worsened = [],
      unresolved = [],
      changes = [];
    analysis.metrics.forEach(function (row) {
      var m = metrics[row.key];
      if (!m || row.mode === "info") return;
      var beforeD = num(m.distance_before),
        afterD = num(m.distance_after),
        progress = beforeD - afterD;
      if (progress > 0.015) improved.push(row.key);
      if (progress < -0.015) worsened.push(row.key);
      if (m.status_after !== "ok") unresolved.push(row.key);
      score += clamp(progress, -1, 1) * row.weight * (1 + Math.min(1, beforeD));
      if (Math.abs(num(m.delta)) > Math.max(num(m.norm) * 0.015, 0.01))
        changes.push(row.key);
    });
    var selected = preferences.target_key && metrics[preferences.target_key];
    if (preferences.task === "metric" && selected) {
      var targeted =
        num(selected.distance_before) - num(selected.distance_after);
      score += targeted * 3;
      if (targeted <= 0.01) score -= 2;
    }
    if (
      preferences.task === "replace" &&
      preferences.replace_target_key &&
      preferences.replace_target_key !== "overall"
    ) {
      var rm = metrics[preferences.replace_target_key];
      if (rm) {
        var rp = num(rm.distance_before) - num(rm.distance_after);
        if (rm.mode === "info")
          rp =
            Math.abs(num(rm.before)) > 0
              ? (num(rm.after) - num(rm.before)) / Math.abs(num(rm.before))
              : 0;
        score += rp * 2.5;
        if (rp <= 0.005) score -= 0.7;
      }
    }
    var hei = metrics.hei_total && metrics.hei_total.delta;
    if (hei != null) score += clamp(hei / 5, -1, 1) * 0.45;
    var energy = Math.abs(num(metrics.kcal && metrics.kcal.delta, 0));
    score -= preferences.preserve_energy
      ? (energy / Math.max(normRaw("kcal"), 1000)) * 8
      : (energy / 1000) * 0.2;
    var deepMode = num(preferences.max_changes, 2) >= 5;
    score -=
      Math.max(0, ops.length - 1) *
      (preferences.max_changes === 1 ? 0.5 : deepMode ? 0.045 : 0.14);
    score += quality * 0.28;
    if (uniq(improved).length >= 2) score += 0.18;
    if (uniq(improved).length >= 4) score += 0.24;
    if (deepMode && ops.length >= 4) score += 0.32;
    if (deepMode && uniq(improved).length >= 6) score += 0.28;
    return {
      score: round(score, 4),
      improved: uniq(improved),
      worsened: uniq(worsened),
      unresolved: uniq(unresolved),
      changes: uniq(changes)
    };
  }
  function opLabel(op) {
    if (op.type === "add")
      return "Добавить " + op.name + " — " + round(op.grams, 1) + " г";
    if (op.type === "reduce")
      return "Уменьшить " + op.name + " — на " + round(op.grams, 1) + " г";
    return (
      "Заменить " +
      op.from_name +
      " (" +
      round(op.from_grams, 1) +
      " г) на " +
      op.to_name +
      " (" +
      round(op.to_grams, 1) +
      " г)"
    );
  }
  function scenarioTitle(ops, kind) {
    if (kind === "deep") return "Глубокая комплексная коррекция рациона";
    if (kind === "multi") return "Комплексная коррекция нескольких показателей";
    var main =
      arr(ops).filter(function (o) {
        return o.type !== "reduce";
      })[0] || ops[0];
    if (!main) return "Проверенный вариант";
    if (main.type === "replace")
      return main.to_name + " вместо " + main.from_name;
    if (main.type === "add") return "Добавить " + main.name;
    if (kind === "reduce") return "Сократить " + main.name;
    return "Проверенный вариант";
  }
  function targetImproved(metrics, preferences) {
    var key =
      preferences.task === "metric"
        ? preferences.target_key
        : preferences.task === "replace"
          ? preferences.replace_target_key
          : "overall";
    if (!key || key === "overall") return true;
    var m = metrics[key];
    if (!m) return false;
    if (m.mode === "info") return Math.abs(num(m.delta)) > 0.01;
    if (m.status_after === "ok" && m.status_before !== "ok") return true;
    var norm = Math.max(num(m.norm), 0.01),
      absoluteProgress = 0;
    if (m.status_before === "low")
      absoluteProgress = num(m.after) - num(m.before);
    else if (m.status_before === "high")
      absoluteProgress = num(m.before) - num(m.after);
    else absoluteProgress = Math.abs(num(m.delta));
    var minimum =
      norm * (m.group === "macros" && m.mode === "target" ? 0.05 : 0.1);
    return (
      absoluteProgress >= minimum &&
      num(m.distance_after) < num(m.distance_before) - 0.01
    );
  }
  function buildScenario(
    raw,
    analysis,
    ops,
    quality,
    preferences,
    kind,
    label
  ) {
    if (ops.length > Math.max(1, num(preferences.max_changes, 2))) return null;
    var virtual = applyOpsVirtual(raw, ops),
      after = calc(virtual),
      metrics = fullMetricState(analysis.before, after, analysis),
      ss = scenarioScore(metrics, analysis, ops, quality, preferences),
      violations =
        FEATURE_LEVEL >= 4 ? constraintViolations(metrics, preferences) : [];
    if (violations.length) return null;
    if (!targetImproved(metrics, preferences)) return null;
    if (!ss.improved.length && preferences.task !== "replace") return null;
    if (ss.score <= 0.01) return null;
    var concentrated = ops.some(function (o) {
        return productFlags(dbProduct(o.product_id || o.to_product_id))
          .concentratedRetinol;
      }),
      a = metrics.vitamin_a_mcg;
    if (concentrated && a && a.after > 3000) return null;
    var id =
        "sc_" +
        kind +
        "_" +
        ops
          .map(function (o) {
            return (
              o.type +
              ":" +
              (o.product_id || o.to_product_id || "") +
              ":" +
              round(o.grams || o.to_grams || 0, 0)
            );
          })
          .join("_")
          .replace(/[^a-zA-Z0-9_:.-]/g, "_"),
      cautions = [];
    ops.forEach(function (o) {
      var f = productFlags(dbProduct(o.product_id || o.to_product_id));
      if (f.organ)
        cautions.push(
          "Концентрированный субпродукт рассматривается только как умеренная пищевая порция, не как ежедневное назначение."
        );
    });
    return {
      scenario_id: id,
      kind: kind,
      label: label || scenarioTitle(ops, kind),
      title:
        kind === "deep"
          ? label || scenarioTitle(ops, kind)
          : scenarioTitle(ops, kind),
      operations: ops,
      operation_labels: ops.map(opLabel),
      metrics: metrics,
      score: ss.score,
      improved: ss.improved,
      worsened: ss.worsened,
      unresolved: ss.unresolved,
      changed_metrics: ss.changes,
      cautions: uniq(cautions),
      quality: round(quality, 2),
      virtual_ration: virtual,
      verified: true,
      calculation_source: "NutritionCalculationCore+HEI",
      feature_level: FEATURE_LEVEL,
      correction_depth:
        ops.length >= 5 ? "deep" : ops.length >= 3 ? "optimal" : "minimal",
      operation_count: ops.length,
      constraint_violations: violations
    };
  }
  function replacementCandidatePool(fromP, analysis, candidates, preferences) {
    var role = productRole(fromP),
      sub = productSubrole(fromP),
      by = {};
    candidates.forEach(function (c) {
      by[c.product_id] = c;
    });
    dbItems().forEach(function (p) {
      if (
        !p ||
        !p.key ||
        p.hidden_from_search ||
        p.is_composite_food ||
        productRole(p) !== role ||
        blockedByConstraint(p, preferences)
      )
        return;
      var f = productFlags(p);
      if (
        f.excluded ||
        f.ingredient ||
        f.powder ||
        f.herb ||
        f.spice ||
        f.organ
      )
        return;
      if ((role === "grain" || role === "dairy") && productSubrole(p) !== sub)
        return;
      if (!by[p.key]) {
        var n = nutrient100(p);
        by[p.key] = {
          product_id: p.key,
          name: text(p.name_ru || p.name || p.key, 120),
          role: role,
          subrole: productSubrole(p),
          quality: sourceQuality(p),
          practicality: f.processed ? 0.8 : 1,
          score: 0,
          benefits: [],
          risks: {
            kcal_per100: num(n.kcal),
            protein_g_per100: num(n.protein_g),
            fat_g_per100: num(n.fat_g),
            carbs_g_per100: num(n.carbs_g),
            sodium_mg_per100: num(n.sodium_mg),
            sfa_g_per100: num(n.sfa_g),
            added_sugars_g_per100: num(n.added_sugars_g)
          }
        };
      }
    });
    return Object.keys(by)
      .map(function (k) {
        return by[k];
      })
      .filter(function (c) {
        return c.product_id !== fromP.key && c.role === role;
      });
  }
  function replacementScenarios(raw, analysis, candidates, preferences) {
    var out = [],
      current = normalizeRation(raw).filter(function (x) {
        return !Array.isArray(x.children) && num(x.grams) >= 20;
      }),
      selected = preferences.replace_ref;
    if (preferences.task === "replace")
      current = current.filter(function (x) {
        return (x.id || x.key) === selected || x.key === selected;
      });
    current.forEach(function (it) {
      var fromP = dbProduct(it.key);
      if (!fromP) return;
      var role = productRole(fromP),
        from100 = nutrient100(fromP),
        pool = replacementCandidatePool(
          fromP,
          analysis,
          candidates,
          preferences
        );
      pool.slice(0, 80).forEach(function (c) {
        var toP = dbProduct(c.product_id),
          to100 = nutrient100(toP),
          fromG = Math.min(num(it.grams), role === "fat" ? 20 : 150),
          basis = "same_mass",
          toG = fromG;
        if (
          (preferences.preserve_protein || role === "protein") &&
          num(from100.protein_g) > 2 &&
          num(to100.protein_g) > 2
        ) {
          basis = "protein";
          toG =
            (fromG * num(from100.protein_g)) /
            Math.max(num(to100.protein_g), 0.1);
        } else if (
          preferences.preserve_energy &&
          num(from100.kcal) > 0 &&
          num(to100.kcal) > 0
        ) {
          basis = "energy";
          toG = (fromG * num(from100.kcal)) / Math.max(num(to100.kcal), 1);
        }
        toG = round(
          clamp(toG, role === "fat" ? 3 : 15, role === "fat" ? 35 : 300),
          1
        );
        var op = {
          type: "replace",
          from_ref: it.id || it.key,
          from_product_id: it.key,
          from_name: text(
            fromP.name_ru || fromP.name || it.name_ru || it.key,
            120
          ),
          from_grams: round(fromG, 1),
          to_product_id: c.product_id,
          to_name: c.name,
          to_grams: toG,
          basis: basis
        };
        var sc = buildScenario(
          raw,
          analysis,
          [op],
          Math.min(sourceQuality(fromP), c.quality) * num(c.practicality, 1),
          preferences,
          "replace",
          "Замена с сохранением роли продукта"
        );
        if (sc) out.push(sc);
      });
    });
    return out;
  }
  function reductionScenarios(raw, analysis, preferences) {
    var out = [],
      targetKey = "";
    if (
      preferences.task === "metric" &&
      analysis.selected_target &&
      analysis.selected_target.status === "high"
    )
      targetKey = analysis.selected_target.key;
    else if (analysis.excesses.length) targetKey = analysis.excesses[0].key;
    if (!targetKey || preferences.preserve_energy) return out;
    var list = normalizeRation(raw)
      .map(function (it) {
        return { it: it, value: itemMetricValue(it, targetKey) };
      })
      .sort(function (a, b) {
        return b.value - a.value;
      })
      .slice(0, 5);
    list.forEach(function (x) {
      [0.2, 0.3].forEach(function (fr) {
        var p = dbProduct(x.it.key),
          g = round(num(x.it.grams) * fr, 1),
          op = {
            type: "reduce",
            ref: x.it.id || x.it.key,
            product_id: x.it.key,
            grams: g,
            name: text(
              (p && (p.name_ru || p.name)) || x.it.name_ru || x.it.key,
              120
            )
          },
          sc = buildScenario(
            raw,
            analysis,
            [op],
            sourceQuality(p),
            preferences,
            "reduce",
            "Сокращение главного источника " +
              metricSpec(targetKey).label.toLowerCase()
          );
        if (sc) out.push(sc);
      });
    });
    return out;
  }
  function additionScenarios(raw, analysis, candidates, preferences) {
    var out = [],
      targetKeys = analysis.deficits.slice(0, 6).map(function (x) {
        return x.key;
      });
    candidates.slice(0, 24).forEach(function (c) {
      portions(c).forEach(function (g) {
        var ops = [
          { type: "add", product_id: c.product_id, name: c.name, grams: g }
        ];
        if (preferences.preserve_energy) {
          var kcal = (num(c.risks.kcal_per100) * g) / 100,
            comp = compensationOperation(raw, kcal, targetKeys, "");
          if (comp) ops.push(comp);
          else return;
        }
        var sc = buildScenario(
          raw,
          analysis,
          ops,
          c.quality * num(c.practicality, 1),
          preferences,
          "add",
          preferences.preserve_energy
            ? "Добавление с сохранением калорийности"
            : "Точечное добавление"
        );
        if (sc) out.push(sc);
      });
    });
    return out;
  }
  function multiScenarios(raw, analysis, candidates, preferences) {
    if (num(preferences.max_changes) < 2) return [];
    var out = [],
      top = candidates.slice(0, 12);
    for (var i = 0; i < top.length; i++)
      for (var j = i + 1; j < top.length; j++) {
        var a = top[i],
          b = top[j],
          fa = productFlags(dbProduct(a.product_id)),
          fb = productFlags(dbProduct(b.product_id));
        if (
          a.role === b.role ||
          fa.ingredient ||
          fb.ingredient ||
          fa.organ ||
          fb.organ ||
          fa.concentratedRetinol ||
          fb.concentratedRetinol
        )
          continue;
        var pa = portions(a)[0],
          pb = portions(b)[0];
        if (a.role === "vegetable" || a.role === "fruit") pa = 100;
        if (b.role === "vegetable" || b.role === "fruit") pb = 100;
        var ops = [
          { type: "add", product_id: a.product_id, name: a.name, grams: pa },
          { type: "add", product_id: b.product_id, name: b.name, grams: pb }
        ];
        if (preferences.preserve_energy) {
          var tmp = calc(applyOpsVirtual(raw, ops)),
            added = num(tmp.totals.kcal) - num(analysis.before.totals.kcal),
            comp = compensationOperation(
              raw,
              added,
              analysis.deficits.slice(0, 6).map(function (x) {
                return x.key;
              }),
              ""
            );
          if (comp && preferences.max_changes >= 3) ops.push(comp);
          else if (added > Math.max(50, normRaw("kcal") * 0.03)) continue;
        }
        var sc = buildScenario(
          raw,
          analysis,
          ops,
          Math.min(
            a.quality * num(a.practicality, 1),
            b.quality * num(b.practicality, 1)
          ),
          preferences,
          "multi",
          "Комбинация для нескольких слабых показателей"
        );
        if (sc) out.push(sc);
      }
    return out;
  }
  function deepPortion(candidate) {
    var ps = portions(candidate)
      .slice()
      .sort(function (a, b) {
        return a - b;
      });
    var role = candidate.role,
      value = ps[0] || 50;
    if (role === "vegetable") value = Math.max(80, Math.min(150, ps[1] || 100));
    else if (role === "fruit")
      value = Math.max(75, Math.min(150, ps[0] || 100));
    else if (role === "dairy")
      value = Math.max(100, Math.min(180, ps[0] || 120));
    else if (role === "protein")
      value = Math.max(50, Math.min(120, ps[0] || 75));
    else if (role === "grain") value = Math.max(45, Math.min(110, ps[0] || 60));
    else if (role === "fat") value = Math.max(5, Math.min(15, ps[0] || 10));
    return round(value, 1);
  }
  function operationRefs(ops) {
    var refs = [];
    arr(ops).forEach(function (op) {
      [
        op.ref,
        op.from_ref,
        op.product_id,
        op.from_product_id,
        op.to_product_id
      ].forEach(function (x) {
        if (x && refs.indexOf(x) < 0) refs.push(x);
      });
    });
    return refs;
  }
  function candidateBenefitBreadth(candidate, covered) {
    var total = 0,
      fresh = 0;
    arr(candidate.benefits).forEach(function (b) {
      var share = num(b.gap_share, 0);
      total += share;
      if (!covered[b.key]) fresh += 0.7 + share;
    });
    return { total: total, fresh: fresh };
  }
  function pickDeepCandidates(candidates, count, strategy, seedOps) {
    var chosen = [],
      covered = {},
      roles = {},
      blocked = {};
    operationRefs(seedOps).forEach(function (x) {
      blocked[x] = true;
    });
    while (chosen.length < count) {
      var best = null,
        bestScore = -999;
      candidates.slice(0, 28).forEach(function (c) {
        if (!c || blocked[c.product_id]) return;
        var flags = productFlags(dbProduct(c.product_id));
        if (
          flags.organ ||
          flags.concentratedRetinol ||
          flags.ingredient ||
          flags.powder ||
          flags.niche
        )
          return;
        var breadth = candidateBenefitBreadth(c, covered),
          roleCount = num(roles[c.role], 0),
          roleNovelty = roleCount === 0 ? 0.65 : roleCount === 1 ? 0.1 : -1.2,
          score;
        if (strategy === "coverage")
          score =
            breadth.fresh * 1.7 +
            breadth.total * 0.7 +
            arr(c.benefits).length * 0.2 +
            c.quality * 0.45;
        else if (strategy === "practical")
          score =
            c.quality * 1.1 +
            num(c.practicality, 1) * 0.9 +
            breadth.fresh * 0.9 +
            roleNovelty;
        else
          score =
            num(c.score, 0) +
            breadth.fresh * 1.15 +
            roleNovelty +
            c.quality * 0.25;
        if (c.already_in_ration) score -= 0.22;
        if (roleCount >= 2) score -= 1.5;
        if (!breadth.fresh && chosen.length >= 2) score -= 0.65;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      });
      if (!best) break;
      chosen.push(best);
      blocked[best.product_id] = true;
      roles[best.role] = num(roles[best.role], 0) + 1;
      arr(best.benefits).forEach(function (b) {
        covered[b.key] = true;
      });
    }
    return chosen;
  }
  function deepScenarioFromCandidates(
    raw,
    analysis,
    candidates,
    preferences,
    strategy,
    seedOps,
    label
  ) {
    var maxChanges = Math.max(4, num(preferences.max_changes, 6)),
      base = clone(arr(seedOps)),
      reserve = preferences.preserve_energy
        ? 1
        : analysis.excesses.length
          ? 1
          : 0,
      addLimit = Math.max(2, maxChanges - base.length - reserve),
      selected = pickDeepCandidates(candidates, addLimit, strategy, base),
      targetKeys = analysis.deficits.slice(0, 8).map(function (x) {
        return x.key;
      });
    selected.forEach(function (c) {
      base.push({
        type: "add",
        product_id: c.product_id,
        name: c.name,
        grams: deepPortion(c)
      });
    });
    while (base.length >= 3) {
      var ops = clone(base),
        virtualBeforeComp = calc(applyOpsVirtual(raw, ops)),
        energyDelta =
          num(virtualBeforeComp.totals.kcal) - num(analysis.before.totals.kcal),
        slots = Math.max(0, maxChanges - ops.length);
      if (
        preferences.preserve_energy &&
        energyDelta > Math.max(25, normRaw("kcal") * 0.012) &&
        slots > 0
      ) {
        var comp = compensationOperations(
          raw,
          energyDelta,
          targetKeys,
          operationRefs(ops),
          slots
        );
        ops = ops.concat(comp.operations);
      } else if (
        !preferences.preserve_energy &&
        analysis.excesses.length &&
        slots > 0
      ) {
        var redPrefs = clone(preferences);
        redPrefs.preserve_energy = false;
        redPrefs.max_changes = 1;
        var reductions = reductionScenarios(raw, analysis, redPrefs);
        if (reductions.length) ops.push(clone(reductions[0].operations[0]));
      }
      var sc = buildScenario(
        raw,
        analysis,
        ops,
        selected.length
          ? selected.reduce(function (q, c) {
              return Math.min(q, c.quality * num(c.practicality, 1));
            }, 1)
          : 0.8,
        preferences,
        "deep",
        label
      );
      if (sc && sc.operations.length >= 4) return sc;
      var removed = false;
      for (var i = base.length - 1; i >= 0; i--) {
        if (base[i].type === "add") {
          base.splice(i, 1);
          removed = true;
          break;
        }
      }
      if (!removed) break;
    }
    return null;
  }
  function deepScenarios(raw, analysis, candidates, preferences, replacements) {
    if (preferences.task !== "overall" || num(preferences.max_changes, 0) < 4)
      return [];
    var out = [],
      variants = [
        {
          strategy: "balanced",
          seed: [],
          label: "Глубокая коррекция: сбалансированный комплекс"
        },
        {
          strategy: "coverage",
          seed: [],
          label: "Глубокая коррекция: максимальный охват слабых показателей"
        },
        {
          strategy: "practical",
          seed: [],
          label: "Глубокая коррекция: практичный набор изменений"
        }
      ];
    var replacement = arr(replacements)
      .slice()
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .filter(function (s) {
        return s && s.operations && s.operations.length === 1;
      })[0];
    if (replacement) {
      variants.push({
        strategy: "balanced",
        seed: clone(replacement.operations),
        label: "Глубокая коррекция: замена и согласованные добавления"
      });
    }
    variants.forEach(function (v) {
      var sc = deepScenarioFromCandidates(
        raw,
        analysis,
        candidates,
        preferences,
        v.strategy,
        v.seed,
        v.label
      );
      if (sc) out.push(sc);
    });
    return out;
  }
  function meaningfulDifferent(a, b) {
    if (!a || !b) return true;
    var pa = a.operations
        .map(function (o) {
          return o.to_product_id || o.product_id;
        })
        .filter(Boolean),
      pb = b.operations
        .map(function (o) {
          return o.to_product_id || o.product_id;
        })
        .filter(Boolean),
      same = pa.some(function (k) {
        return pb.indexOf(k) >= 0;
      });
    if (a.kind !== b.kind && !same) return true;
    if (!same) return true;
    var ai = a.improved.slice().sort().join("|"),
      bi = b.improved.slice().sort().join("|");
    return ai !== bi && Math.abs(a.score - b.score) > 0.08;
  }
  function selectFinal(pool, preferences) {
    var deepMode =
      preferences.task === "overall" && num(preferences.max_changes, 0) >= 5;
    pool.sort(function (a, b) {
      if (deepMode && a.kind !== b.kind) {
        if (a.kind === "deep") return -1;
        if (b.kind === "deep") return 1;
      }
      return b.score - a.score || b.operations.length - a.operations.length;
    });
    var final = [];
    function everyday(s) {
      return !s.operations.some(function (o) {
        var f = productFlags(dbProduct(o.to_product_id || o.product_id));
        return (
          f.organ ||
          f.concentratedRetinol ||
          f.niche ||
          f.powder ||
          f.ingredient
        );
      });
    }
    function take(test) {
      for (var i = 0; i < pool.length; i++) {
        var s = pool[i],
          ok = test(s);
        if (!ok || final.indexOf(s) >= 0) continue;
        var distinct = true;
        for (var j = 0; j < final.length; j++)
          if (!meaningfulDifferent(s, final[j])) distinct = false;
        if (distinct) {
          final.push(s);
          return true;
        }
      }
      return false;
    }
    if (preferences.task === "replace") {
      take(function (s) {
        return s.kind === "replace" && everyday(s);
      });
      take(function (s) {
        return s.kind === "replace" && everyday(s);
      });
      take(function (s) {
        return s.kind === "replace";
      });
    } else if (deepMode) {
      take(function (s) {
        return s.kind === "deep" && s.operations.length >= 5 && everyday(s);
      });
      take(function (s) {
        return s.kind === "deep" && everyday(s);
      });
      take(function (s) {
        return (s.kind === "multi" || s.operations.length >= 3) && everyday(s);
      });
    } else {
      take(function (s) {
        return (s.kind === "multi" || s.operations.length > 1) && everyday(s);
      });
      take(function (s) {
        return s.operations.length === 1 && everyday(s);
      });
      take(function (s) {
        return everyday(s);
      });
    }
    for (var k = 0; k < pool.length && final.length < 3; k++) {
      var x = pool[k],
        d = everyday(x);
      for (var q = 0; q < final.length; q++)
        if (!meaningfulDifferent(x, final[q])) d = false;
      if (d) final.push(x);
    }
    if (!final.length && pool.length) final.push(pool[0]);
    return final.slice(0, 3);
  }
  function generateScenarios(raw, analysis, candidates, preferences) {
    var out = [],
      replacements = replacementScenarios(
        raw,
        analysis,
        candidates,
        preferences
      );
    if (preferences.task !== "replace")
      out = out.concat(
        additionScenarios(raw, analysis, candidates, preferences),
        reductionScenarios(raw, analysis, preferences)
      );
    out = out.concat(replacements);
    if (FEATURE_LEVEL >= 6 && preferences.task === "overall")
      out = out.concat(multiScenarios(raw, analysis, candidates, preferences));
    if (FEATURE_LEVEL >= 7 && preferences.task === "overall")
      out = out.concat(
        deepScenarios(raw, analysis, candidates, preferences, replacements)
      );
    var seen = {},
      pool = [];
    out.forEach(function (s) {
      var sig = s.operations
        .map(function (o) {
          return (
            o.type +
            ":" +
            (o.product_id || o.to_product_id || "") +
            ":" +
            (o.from_product_id || "") +
            ":" +
            round(o.grams || o.to_grams || 0, 0)
          );
        })
        .sort()
        .join("|");
      if (seen[sig]) return;
      seen[sig] = true;
      pool.push(s);
    });
    return selectFinal(pool, preferences);
  }
  function localPattern(analysis) {
    if (!analysis.deficits.length && !analysis.excesses.length)
      return "По доступным нормам выраженных отклонений не найдено; планировщик оценивает структуру и возможные точечные улучшения.";
    var a = analysis.deficits.slice(0, 4).map(function (x) {
        return x.label;
      }),
      b = analysis.excesses.slice(0, 3).map(function (x) {
        return x.label;
      }),
      s = [];
    if (a.length) s.push("Ниже ориентира: " + a.join(", ") + ".");
    if (b.length) s.push("Выше ориентира: " + b.join(", ") + ".");
    if (analysis.data_caveats.length)
      s.push(
        "Часть низких значений исключена из целей из-за неполного покрытия данных."
      );
    return s.join(" ");
  }
  function localNote(s) {
    var names = s.operations
        .map(function (o) {
          return o.name || o.to_name;
        })
        .filter(Boolean),
      improved = s.improved.slice(0, 4).map(function (k) {
        return metricSpec(k).label;
      });
    return (
      (names.length ? "Вариант использует " + names.join(" и ") + ". " : "") +
      (improved.length
        ? "По пересчёту улучшаются " + improved.join(", ") + "."
        : "")
    );
  }
  function plannerPayload(raw, analysis, candidates, scenarios, preferences) {
    return {
      protocol_version: "nutrition-ai-comprehensive-planner-v" + FEATURE_LEVEL,
      client_build: BUILD,
      feature_level: FEATURE_LEVEL,
      task: preferences.task,
      correction_mode:
        num(preferences.max_changes, 0) >= 5
          ? "deep"
          : num(preferences.max_changes, 0) >= 3
            ? "optimal"
            : "minimal",
      target_key: preferences.target_key,
      replace_ref: preferences.replace_ref,
      replace_target_key: preferences.replace_target_key,
      constraint_text: preferences.constraint,
      constraints: {
        preserve_energy: preferences.preserve_energy,
        preserve_protein: preferences.preserve_protein,
        no_raise_fat: preferences.no_raise_fat,
        no_raise_carbs: preferences.no_raise_carbs,
        no_raise_sodium: preferences.no_raise_sodium,
        max_changes: preferences.max_changes
      },
      ration: normalizeRation(raw).map(function (x) {
        return {
          key: x.key,
          name: text(
            (dbProduct(x.key) || {}).name_ru || x.name_ru || x.key,
            100
          ),
          grams: round(x.grams, 1),
          role: productRole(dbProduct(x.key)),
          data_quality: (function(p){ var e=window.ProductDataQualityV13; return e&&p?e.classifyProduct(p):null; })(dbProduct(x.key))
        };
      }),
      pattern: {
        local_summary: localPattern(analysis),
        deficits: analysis.deficits.slice(0, 10),
        excesses: analysis.excesses.slice(0, 8),
        data_caveats: analysis.data_caveats.slice(0, 6),
        metrics_reviewed: analysis.metrics.length
      },
      diet_assessment: (analysis.before && analysis.before.diet_assessment) || null,
      interpretation_contract: {
        hei_is_diet_pattern_score: true,
        hei_does_not_cancel_separate_flags: true,
        do_not_call_ration_safe_or_healthy_from_hei_alone: true,
        preserve_not_evaluable_status: true
      },
      data_quality: (function(){
        var e=window.ProductDataQualityV13, c=core();
        if(!e || typeof e.analyzeRation!=="function") return null;
        try { return e.analyzeRation(normalizeRation(raw), window.DB, ["kcal","protein","fat","carbs","fiber","sodium_mg","sfa","calcium_mg","iron_mg","potassium_mg","vitamin_d_mcg","vitamin_b9_mcg","vitamin_b12_mcg"]); } catch(_) { return null; }
      })(),
      candidate_matrix: candidates.slice(0, 24),
      usage_context: aiUsageContext(),
      verified_scenarios: scenarios.map(function (s) {
        return {
          scenario_id: s.scenario_id,
          label: s.title,
          kind: s.kind,
          operations: s.operations,
          operation_count: s.operations.length,
          correction_depth: s.correction_depth,
          score: s.score,
          improved: s.improved,
          worsened: s.worsened,
          unresolved: s.unresolved,
          metrics: s.metrics
        };
      })
    };
  }
  function callGemini(payload) {
    if (typeof fetch !== "function" || !(payload && payload.usage_context && payload.usage_context.gemini_allowed)) return Promise.resolve(null);
    activeController =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      try {
        if (activeController) activeController.abort();
      } catch (_) {}
    }, 30000);
    return ensureServiceSession().then(function(csrfToken){ return fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Nutrition-CSRF": csrfToken
      },
      body: JSON.stringify({ action: "plan_ration", csrf_token: csrfToken, payload: payload }),
      signal: activeController ? activeController.signal : undefined
    }); })
      .then(function (r) {
        return r.text().then(function (t) {
          var d = null;
          try {
            d = JSON.parse(t);
          } catch (_) {}
          if (!r.ok || !d || d.ok !== true)
            throw new Error((d && d.error) || "Gemini недоступен");
          return d.result || null;
        });
      })
      .catch(function () {
        return null;
      })
      .then(function (x) {
        clearTimeout(timer);
        return x;
      });
  }
  function mergeGemini(scenarios, g, preferences) {
    var by = {};
    scenarios.forEach(function (s) {
      by[s.scenario_id] = s;
    });
    var order = [];
    arr(g && g.ranked_scenario_ids).forEach(function (id) {
      if (by[id] && order.indexOf(id) < 0) order.push(id);
    });
    scenarios.forEach(function (s) {
      if (order.indexOf(s.scenario_id) < 0) order.push(s.scenario_id);
    });
    var notes = {};
    arr(g && g.scenario_notes).forEach(function (n) {
      if (n && by[n.scenario_id])
        notes[n.scenario_id] = {
          why: text(n.why, 700),
          tradeoff: text(n.tradeoff, 600)
        };
    });
    var merged = order.map(function (id) {
      var s = by[id];
      s.ai_note = notes[id] || { why: "", tradeoff: "" };
      return s;
    });
    if (
      preferences &&
      preferences.task === "overall" &&
      num(preferences.max_changes, 0) >= 5
    ) {
      merged.sort(function (a, b) {
        var ad = a && a.kind === "deep" ? 0 : 1,
          bd = b && b.kind === "deep" ? 0 : 1;
        return ad - bd;
      });
    }
    return merged;
  }
  function selectedTask() {
    var n = document.querySelector('input[name="aiPlannerTask"]:checked');
    return n ? n.value : "overall";
  }
  function preferencesFromUi() {
    return {
      task: selectedTask(),
      target_key:
        ($("aiPlannerTargetMetric") && $("aiPlannerTargetMetric").value) ||
        "protein_g",
      replace_ref:
        ($("aiPlannerReplaceProduct") && $("aiPlannerReplaceProduct").value) ||
        "",
      replace_target_key:
        ($("aiPlannerReplaceCriterion") &&
          $("aiPlannerReplaceCriterion").value) ||
        "overall",
      constraint: text(
        $("geminiAiConstraint") && $("geminiAiConstraint").value,
        600
      ),
      preserve_energy: !!(
        $("aiPlannerPreserveEnergy") && $("aiPlannerPreserveEnergy").checked
      ),
      preserve_protein: !!(
        $("aiPlannerPreserveProtein") && $("aiPlannerPreserveProtein").checked
      ),
      no_raise_fat: !!(
        $("aiPlannerNoRaiseFat") && $("aiPlannerNoRaiseFat").checked
      ),
      no_raise_carbs: !!(
        $("aiPlannerNoRaiseCarbs") && $("aiPlannerNoRaiseCarbs").checked
      ),
      no_raise_sodium: !!(
        $("aiPlannerNoRaiseSodium") && $("aiPlannerNoRaiseSodium").checked
      ),
      max_changes: num(
        document.querySelector('input[name="aiPlannerScale"]:checked') &&
          document.querySelector('input[name="aiPlannerScale"]:checked').value,
        6
      )
    };
  }
  function savePreferences(p) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(p));
    } catch (_) {}
  }
  function setRadio(name, value) {
    var n = document.querySelector(
      'input[name="' + name + '"][value="' + value + '"]'
    );
    if (n) n.checked = true;
  }
  function loadPreferences() {
    try {
      var p = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if (!p) return;
      setRadio("aiPlannerTask", p.task || "overall");
      setRadio("aiPlannerScale", String(p.max_changes || 6));
      if ($("aiPlannerTargetMetric") && p.target_key)
        $("aiPlannerTargetMetric").value = p.target_key;
      if ($("aiPlannerReplaceProduct") && p.replace_ref)
        $("aiPlannerReplaceProduct").value = p.replace_ref;
      if ($("aiPlannerReplaceCriterion") && p.replace_target_key)
        $("aiPlannerReplaceCriterion").value = p.replace_target_key;
      if ($("geminiAiConstraint"))
        $("geminiAiConstraint").value = p.constraint || "";
      [
        ["aiPlannerPreserveEnergy", "preserve_energy"],
        ["aiPlannerPreserveProtein", "preserve_protein"],
        ["aiPlannerNoRaiseFat", "no_raise_fat"],
        ["aiPlannerNoRaiseCarbs", "no_raise_carbs"],
        ["aiPlannerNoRaiseSodium", "no_raise_sodium"]
      ].forEach(function (x) {
        if ($(x[0])) $(x[0]).checked = !!p[x[1]];
      });
    } catch (_) {}
    updateTaskVisibility();
  }
  function populateMetricSelect(id, includeOverall) {
    var el = $(id);
    if (!el) return;
    var current = el.value,
      groups = {
        macros: "КБЖУ и клетчатка",
        vitamins: "Витамины",
        minerals: "Минералы",
        limiters: "Ограничиваемые показатели",
        other: "Другие"
      };
    el.innerHTML = includeOverall
      ? '<option value="overall">Комплексный профиль</option>'
      : "";
    Object.keys(groups).forEach(function (g) {
      var list = METRICS.filter(function (m) {
        return m.group === g && m.mode !== "info";
      });
      if (!list.length) return;
      var opt = document.createElement("optgroup");
      opt.label = groups[g];
      list.forEach(function (m) {
        var o = document.createElement("option");
        o.value = m.key;
        o.textContent = m.label;
        opt.appendChild(o);
      });
      el.appendChild(opt);
    });
    if (current) el.value = current;
  }
  function populateReplaceProducts() {
    var el = $("aiPlannerReplaceProduct");
    if (!el) return;
    var old = el.value,
      html = '<option value="">Выберите продукт из текущего рациона</option>';
    normalizeRation(ration()).forEach(function (it) {
      var p = dbProduct(it.key);
      html +=
        '<option value="' +
        esc(it.id || it.key) +
        '">' +
        esc(text((p && (p.name_ru || p.name)) || it.name_ru || it.key, 100)) +
        " — " +
        round(it.grams, 1) +
        " г</option>";
    });
    el.innerHTML = html;
    if (old) el.value = old;
  }
  function updateTaskVisibility() {
    var task = selectedTask(),
      tw = $("aiPlannerTargetWrap"),
      rw = $("aiPlannerReplaceWrap"),
      cw = $("aiPlannerReplaceCriterionWrap");
    if (tw) tw.hidden = task !== "metric";
    if (rw) rw.hidden = task !== "replace";
    if (cw) cw.hidden = task !== "replace";
    var run = $("geminiAiRunBtn");
    if (run)
      run.textContent =
        task === "replace"
          ? "Подобрать и пересчитать замены"
          : task === "metric"
            ? "Исправить выбранный показатель"
            : "Построить глубокую коррекцию";
  }
  function fmt(v, unit) {
    if (v == null || !Number.isFinite(Number(v))) return "—";
    var n = Number(v),
      d = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
    return round(n, d) + (unit ? " " + unit : "");
  }
  function deltaText(m) {
    if (!m || m.delta == null) return "";
    return (m.delta > 0 ? "+" : "") + fmt(m.delta, m.unit);
  }
  function statusLabel(s) {
    return s === "low"
      ? "ниже ориентира"
      : s === "high"
        ? "выше ориентира"
        : s === "ok"
          ? "в диапазоне"
          : "справочно";
  }
  function normText(m) {
    if (!m || !(num(m.norm) > 0) || m.mode === "info") return "—";
    var sign = m.mode === "max" ? "≤ " : m.mode === "min" ? "≥ " : "≈ ";
    return sign + fmt(m.norm, m.unit);
  }
  function macroTable(s) {
    var html =
      '<div class="ai-plan-macro-title">КБЖУ всего рациона</div><div class="ai-plan-macro-grid"><div class="head">Показатель</div><div class="head">Сейчас</div><div class="head">После</div><div class="head">Изменение</div><div class="head">Статус</div>';
    MACRO_KEYS.forEach(function (k) {
      var m = s.metrics[k];
      if (!m) return;
      var cls =
        m.status_after === "ok"
          ? "good"
          : m.status_after === "low" || m.status_after === "high"
            ? "warn"
            : "";
      html +=
        "<div>" +
        esc(m.label) +
        "</div><div>" +
        esc(fmt(m.before, m.unit)) +
        '</div><div class="' +
        cls +
        '">' +
        esc(fmt(m.after, m.unit)) +
        "</div><div>" +
        esc(deltaText(m)) +
        '</div><div class="' +
        cls +
        '">' +
        esc(statusLabel(m.status_after)) +
        "</div>";
    });
    return html + "</div>";
  }
  function metricList(keys, s, emptyText, max) {
    var list = arr(keys).slice(0, max || 6);
    if (!list.length)
      return '<span class="ai-plan-none">' + esc(emptyText) + "</span>";
    return (
      "<ul>" +
      list
        .map(function (k) {
          var m = s.metrics[k];
          return m
            ? "<li><strong>" +
                esc(m.label) +
                ":</strong> " +
                esc(fmt(m.before, m.unit)) +
                " → " +
                esc(fmt(m.after, m.unit)) +
                " <span>(" +
                esc(statusLabel(m.status_after)) +
                ")</span></li>"
            : "";
        })
        .join("") +
      "</ul>"
    );
  }
  function fullTable(s) {
    var rows = Object.keys(s.metrics)
      .filter(function (k) {
        return k !== "hei_total";
      })
      .sort(function (a, b) {
        var ga = metricSpec(a).group,
          gb = metricSpec(b).group,
          order = {
            macros: 0,
            vitamins: 1,
            minerals: 2,
            limiters: 3,
            other: 4
          };
        var oa = Object.prototype.hasOwnProperty.call(order, ga)
            ? order[ga]
            : 9,
          ob = Object.prototype.hasOwnProperty.call(order, gb) ? order[gb] : 9;
        return (
          oa - ob || metricSpec(a).label.localeCompare(metricSpec(b).label)
        );
      });
    return (
      '<details class="ai-plan-full"><summary>Показать полный пересчёт нутриентов</summary><div class="ai-plan-full-scroll"><table><thead><tr><th>Показатель</th><th>Ориентир</th><th>Сейчас</th><th>После</th><th>Δ</th><th>Статус</th></tr></thead><tbody>' +
      rows
        .map(function (k) {
          var m = s.metrics[k];
          return (
            '<tr class="status-' +
            esc(m.status_after) +
            '"><td>' +
            esc(m.label) +
            "</td><td>" +
            esc(normText(m)) +
            "</td><td>" +
            esc(fmt(m.before, m.unit)) +
            "</td><td>" +
            esc(fmt(m.after, m.unit)) +
            "</td><td>" +
            esc(deltaText(m)) +
            "</td><td>" +
            esc(statusLabel(m.status_after)) +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div></details>"
    );
  }
  function operationEditor(op, index) {
    var checked = " checked",
      prefix =
        '<div class="ai-plan-op-row" data-op-index="' +
        index +
        '"><label class="ai-plan-op-enable"><input type="checkbox" data-op-enabled' +
        checked +
        '/><span class="ai-plan-op-check" aria-hidden="true"></span><span class="ai-plan-op-text">',
      suffix = "</span></label>";
    if (op.type === "add") {
      return (
        prefix +
        "Добавить <strong>" +
        esc(op.name) +
        "</strong>" +
        suffix +
        '<label class="ai-plan-op-amount"><span>Количество</span><input type="number" min="0.1" max="5000" step="1" inputmode="decimal" data-op-field="grams" value="' +
        esc(round(op.grams, 1)) +
        '"/><em>г</em></label></div>'
      );
    }
    if (op.type === "reduce") {
      return (
        prefix +
        "Уменьшить <strong>" +
        esc(op.name) +
        "</strong>" +
        suffix +
        '<label class="ai-plan-op-amount"><span>На сколько</span><input type="number" min="0.1" max="5000" step="1" inputmode="decimal" data-op-field="grams" value="' +
        esc(round(op.grams, 1)) +
        '"/><em>г</em></label></div>'
      );
    }
    return (
      prefix +
      "Заменить <strong>" +
      esc(op.from_name) +
      "</strong> на <strong>" +
      esc(op.to_name) +
      "</strong>" +
      suffix +
      '<div class="ai-plan-op-replace-amounts"><label class="ai-plan-op-amount"><span>Убрать</span><input type="number" min="0.1" max="5000" step="1" inputmode="decimal" data-op-field="from_grams" value="' +
      esc(round(op.from_grams, 1)) +
      '"/><em>г</em></label><label class="ai-plan-op-amount"><span>Добавить</span><input type="number" min="0.1" max="5000" step="1" inputmode="decimal" data-op-field="to_grams" value="' +
      esc(round(op.to_grams, 1)) +
      '"/><em>г</em></label></div></div>'
    );
  }
  function scenarioById(id) {
    var found = null;
    if (!currentResult) return null;
    currentResult.scenarios.forEach(function (s) {
      if (s.scenario_id === id) found = s;
    });
    return found;
  }
  function selectedOpsFromCard(card, scenario) {
    if (!card || !scenario) return clone(arr(scenario && scenario.operations));
    var selected = [];
    list(card.querySelectorAll(".ai-plan-op-row")).forEach(function (row) {
      var index = num(row.getAttribute("data-op-index"), -1),
        source = scenario.operations[index],
        enabled = row.querySelector("[data-op-enabled]");
      if (!source || !enabled || !enabled.checked) return;
      var op = clone(source);
      list(row.querySelectorAll("[data-op-field]")).forEach(function (input) {
        var field = input.getAttribute("data-op-field"),
          value = Math.max(0.1, num(input.value, num(op[field], 0.1)));
        op[field] = round(value, 1);
      });
      selected.push(op);
    });
    return selected;
  }
  function previewScenario(scenario, operations) {
    var base =
        currentResult && currentResult.base_ration
          ? currentResult.base_ration
          : ration(),
      prefs =
        (currentResult && currentResult.preferences) || preferencesFromUi(),
      ops = clone(arr(operations));
    if (!ops.length)
      return {
        operations: [],
        metrics: scenario.metrics,
        improved: [],
        worsened: [],
        unresolved: scenario.unresolved,
        violations: ["empty"],
        score: 0
      };
    var after = calc(applyOpsVirtual(base, ops)),
      metrics = fullMetricState(
        currentResult.analysis.before,
        after,
        currentResult.analysis
      ),
      ss = scenarioScore(
        metrics,
        currentResult.analysis,
        ops,
        scenario.quality,
        prefs
      ),
      violations = constraintViolations(metrics, prefs);
    return {
      operations: ops,
      metrics: metrics,
      improved: ss.improved,
      worsened: ss.worsened,
      unresolved: ss.unresolved,
      changed_metrics: ss.changes,
      violations: violations,
      score: ss.score,
      virtual_ration: after.ration
    };
  }
  function violationLabel(code) {
    if (code === "empty") return "Не выбрано ни одного действия.";
    if (code === "energy")
      return "Выбранный набор слишком сильно изменяет калорийность.";
    if (code === "protein")
      return "Выбранный набор снижает белок сильнее допустимого.";
    if (code === "fat")
      return "Выбранный набор повышает жиры вопреки ограничению.";
    if (code === "carbs")
      return "Выбранный набор повышает углеводы вопреки ограничению.";
    if (code === "sodium")
      return "Выбранный набор повышает натрий вопреки ограничению.";
    if (String(code).indexOf("upper:") === 0)
      return (
        "После изменений пересекается верхний допустимый уровень: " +
        metricSpec(String(code).slice(6)).label +
        "."
      );
    if (String(code).indexOf("new_low:") === 0)
      return (
        "Появляется новый недостаток: " +
        metricSpec(String(code).slice(8)).label +
        "."
      );
    if (String(code).indexOf("new_high:") === 0)
      return (
        "Появляется новое превышение: " +
        metricSpec(String(code).slice(9)).label +
        "."
      );
    return "Нарушено защитное ограничение расчёта.";
  }
  function previewHtml(view) {
    if (!view.operations.length)
      return '<div class="ai-plan-preview-warning"><strong>Предварительный расчёт не выполнен</strong><p>Отметьте хотя бы одно действие.</p></div>';
    var warning = view.violations.length
      ? '<div class="ai-plan-preview-warning"><strong>Выбранный набор нельзя применить автоматически</strong><ul>' +
        view.violations
          .map(function (x) {
            return "<li>" + esc(violationLabel(x)) + "</li>";
          })
          .join("") +
        "</ul></div>"
      : '<div class="ai-plan-preview-ok"><strong>Комплекс проверен</strong><span>Выбрано действий: ' +
        view.operations.length +
        ". Все значения ниже пересчитаны для выбранного набора.</span></div>";
    return (
      warning +
      macroTable(view) +
      '<div class="ai-plan-outcomes"><section><h4>Что улучшится</h4>' +
      metricList(view.improved, view, "Значимых улучшений не найдено.", 8) +
      "</section><section><h4>Что ухудшится</h4>" +
      metricList(view.worsened, view, "Значимых ухудшений не обнаружено.", 7) +
      "</section><section><h4>Что останется нерешённым</h4>" +
      metricList(
        view.unresolved,
        view,
        "Основные показатели после изменения находятся в диапазоне.",
        7
      ) +
      "</section></div>" +
      fullTable(view)
    );
  }
  function updateScenarioCard(card) {
    if (!card || !currentResult) return;
    var id = card.getAttribute("data-scenario-id"),
      scenario = scenarioById(id),
      preview = card.querySelector(".ai-plan-live-preview"),
      button = card.querySelector("[data-apply-scenario]");
    if (!scenario || !preview) return;
    var operations = selectedOpsFromCard(card, scenario),
      view;
    try {
      view = previewScenario(scenario, operations);
      preview.innerHTML = previewHtml(view);
      card.__aiScenarioPreview = view;
    } catch (e) {
      card.__aiScenarioPreview = null;
      preview.innerHTML =
        '<div class="ai-plan-preview-warning"><strong>Не удалось пересчитать выбранный набор</strong><p>' +
        esc(text(e && e.message ? e.message : e, 240)) +
        "</p></div>";
    }
    if (button) {
      var allSelected = operations.length === scenario.operations.length;
      button.textContent = allSelected
        ? "Применить весь комплекс"
        : "Применить выбранные изменения";
      button.disabled =
        !card.__aiScenarioPreview ||
        !operations.length ||
        card.__aiScenarioPreview.violations.length > 0;
    }
  }
  function scheduleScenarioCardUpdate(card) {
    if (!card) return;
    if (card.__aiPreviewTimer) clearTimeout(card.__aiPreviewTimer);
    card.__aiPreviewTimer = setTimeout(function () {
      updateScenarioCard(card);
    }, 120);
  }
  function render(result) {
    var out = $("geminiAiOutput");
    if (!out) return;
    var g = result.gemini || {},
      deepDefault =
        result.preferences && num(result.preferences.max_changes, 0) >= 5,
      html =
        '<div class="ai-plan-summary"><strong>Комплексный анализ</strong><p>' +
        esc(text(g.pattern_summary, 1000) || localPattern(result.analysis)) +
        '</p><div class="ai-plan-summary-stats"><span>Проверено показателей: ' +
        result.analysis.metrics.length +
        "</span><span>Ниже ориентира: " +
        result.analysis.deficits.length +
        "</span><span>Выше ориентира: " +
        result.analysis.excesses.length +
        "</span><span>Режим: " +
        (deepDefault ? "глубокая коррекция" : "ограниченная коррекция") +
        "</span></div></div>";
    if (!result.scenarios.length)
      html +=
        '<div class="ai-plan-empty"><strong>Подходящий проверенный комплекс не найден</strong><p>Текущие ограничения не позволяют одновременно улучшить рацион без нежелательных последствий. Измените масштаб или снимите одно из условий.</p></div>';
    result.scenarios.forEach(function (s, index) {
      var note = s.ai_note || {},
        trade =
          note.tradeoff ||
          (s.worsened.length
            ? "Некоторые показатели ухудшаются; они перечислены в предварительном расчёте."
            : "Критических ухудшений по рассчитанным показателям не обнаружено."),
        label =
          index === 0 && s.kind === "deep"
            ? "Основной глубокий план"
            : "Вариант " + (index + 1),
        initialView = previewScenario(s, s.operations);
      html +=
        '<article class="ai-plan-card" data-scenario-id="' +
        esc(s.scenario_id) +
        '"><header><span>' +
        esc(label) +
        "</span><h3>" +
        esc(s.title) +
        "</h3><b>" +
        s.operations.length +
        " действий · проверено ядром</b></header>" +
        '<p class="ai-plan-fixed-note">Все действия отмечены по умолчанию. Можно снять отдельные пункты или изменить граммы; предварительный расчёт обновится автоматически.</p>' +
        '<div class="ai-plan-ops ai-plan-ops-editable">' +
        s.operations.map(operationEditor).join("") +
        "</div>" +
        '<p class="ai-plan-why">' +
        esc(note.why || localNote(s)) +
        "</p>" +
        '<div class="ai-plan-live-preview">' +
        previewHtml(initialView) +
        "</div>" +
        (s.cautions.length
          ? '<p class="ai-plan-caution"><strong>Важно:</strong> ' +
            esc(s.cautions.join(" ")) +
            "</p>"
          : "") +
        '<p class="ai-plan-tradeoff"><strong>Компромисс полного комплекса:</strong> ' +
        esc(trade) +
        "</p>" +
        '<button type="button" class="ai-plan-apply" data-apply-scenario="' +
        esc(s.scenario_id) +
        '">Применить весь комплекс</button></article>';
    });
    if (result.candidates.length)
      html +=
        '<details class="ai-plan-candidates"><summary>Какие продукты рассматривались</summary>' +
        result.candidates
          .slice(0, 10)
          .map(function (c) {
            return (
              "<div><strong>" +
              esc(c.name) +
              "</strong><span>" +
              esc(
                c.benefits
                  .slice(0, 4)
                  .map(function (b) {
                    return b.label;
                  })
                  .join(", ") || "кандидат для замены"
              ) +
              "</span><em>качество " +
              esc(String(c.quality)) +
              "</em></div>"
            );
          })
          .join("") +
        "</details>";
    out.innerHTML = html;
    out.hidden = false;
    list(out.querySelectorAll(".ai-plan-card")).forEach(function (card) {
      var scenario = scenarioById(card.getAttribute("data-scenario-id"));
      if (scenario)
        card.__aiScenarioPreview = previewScenario(
          scenario,
          scenario.operations
        );
    });
    var clear = $("geminiAiClearBtn");
    if (clear) clear.hidden = false;
  }
  function applyScenario(id, card) {
    if (!currentResult) return false;
    var s = scenarioById(id);
    if (!s || !window.State) return false;
    var operations = card ? selectedOpsFromCard(card, s) : clone(s.operations),
      view = previewScenario(s, operations);
    if (!operations.length || view.violations.length) return false;
    var api = window.State,
      beforeHash = JSON.stringify(
        normalizeRation(api.get())
          .map(function (x) {
            return [x.key, round(x.grams, 2)];
          })
          .sort()
      ),
      batch =
        typeof api.beginAddBatch === "function" &&
        typeof api.endAddBatch === "function";
    if (batch) api.beginAddBatch("ai-nutrition-planner");
    try {
      operations.forEach(function (op) {
        if (op.type === "add") {
          api.add(op.product_id, op.grams, {
            source_type: "ai_verified_planner",
            planner_version: BUILD
          });
        } else if (op.type === "reduce") {
          var list1 = api.get(),
            it = null;
          arr(list1).forEach(function (x) {
            if (
              !it &&
              (x.id === op.ref || x.key === op.ref || x.key === op.product_id)
            )
              it = x;
          });
          if (it) {
            var next = Math.max(0, num(it.grams) - num(op.grams));
            if (next > 0) api.update(it.id || it.key, next);
            else api.remove(it.id || it.key);
          }
        } else if (op.type === "replace") {
          var list2 = api.get(),
            from = null;
          arr(list2).forEach(function (x) {
            if (
              !from &&
              (x.id === op.from_ref ||
                x.key === op.from_ref ||
                x.key === op.from_product_id)
            )
              from = x;
          });
          if (from) {
            var next2 = Math.max(0, num(from.grams) - num(op.from_grams));
            if (next2 > 0) api.update(from.id || from.key, next2);
            else api.remove(from.id || from.key);
          }
          api.add(op.to_product_id, op.to_grams, {
            source_type: "ai_verified_planner",
            planner_version: BUILD
          });
        }
      });
    } finally {
      if (batch)
        api.endAddBatch("ai-nutrition-planner", {
          scenario_id: id,
          operation_count: operations.length,
          correction_depth:
            operations.length >= 5
              ? "deep"
              : operations.length >= 3
                ? "optimal"
                : "minimal"
        });
    }
    setTimeout(function () {
      var actual = calc(api.get()),
        expected = view.metrics,
        keys = ["kcal", "protein_g", "fat_g", "carbs_g"],
        ok = true;
      keys.forEach(function (k) {
        var tol = k === "kcal" ? 2 : 0.2;
        if (
          Math.abs(
            num(actual.totals[k]) - num(expected[k] && expected[k].after)
          ) > tol
        )
          ok = false;
      });
      var status = $("geminiAiStatus");
      if (status)
        status.textContent = ok
          ? "Комплекс из " +
            operations.length +
            " действий применён. Основной расчёт совпал с предварительным пересчётом."
          : "Комплекс применён, но итог отличается от предварительного расчёта; проверьте составные продукты и повторите анализ.";
      if ($("geminiAiOutput")) $("geminiAiOutput").classList.add("is-stale");
      populateReplaceProducts();
    }, 100);
    return beforeHash !== "";
  }
  function validatePreferences(p, analysis) {
    if (p.task === "replace" && !p.replace_ref)
      return "Выберите продукт, который нужно заменить.";
    if (p.task === "metric") {
      var t = analysis.by_key[p.target_key];
      if (!t) return "Выбранный показатель недоступен в расчёте.";
      if (t.status === "ok")
        return "Выбранный показатель уже находится в целевом диапазоне. Можно выбрать другой показатель или комплексное улучшение.";
    }
    return "";
  }
  function run() {
    if (running) return;
    var nutritionSafety=window.__lastNeedsMeta&&window.__lastNeedsMeta.refeedingRisk||null;
    var protectedPolicy=window.ProtectedModesP03?window.ProtectedModesP03.currentPolicy():null;
    if ((nutritionSafety && nutritionSafety.highRisk) || (protectedPolicy && protectedPolicy.automaticPlannerAllowed===false)) {
      var blockedStatus=$("geminiAiStatus");
      if(blockedStatus) blockedStatus.textContent=(protectedPolicy&&protectedPolicy.primaryReason)||"Автоматическая глубокая коррекция отключена защищённым режимом. Доступен фактический анализ рациона без автоматической схемы изменения питания.";
      return;
    }
    var raw = ration(),
      status = $("geminiAiStatus"),
      out = $("geminiAiOutput");
    if (!raw.length) {
      if (status) status.textContent = "Сначала добавьте продукты в рацион.";
      return;
    }
    running = true;
    var runRevision = calculationRevision;
    if (out) {
      out.hidden = true;
      out.innerHTML = "";
      out.classList.remove("is-stale");
    }
    var prefs = preferencesFromUi();
    savePreferences(prefs);
    var usageContext = aiUsageContext();
    var localOnlyReason = aiLocalOnlyReason(usageContext);
    if (status)
      status.textContent = localOnlyReason ||
        "Анализируются КБЖУ, витамины, минералы и ограничиваемые компоненты…";
    setTimeout(function () {
      if (runRevision !== calculationRevision) { running = false; return; }
      try {
        var analysis = analysisOf(raw, prefs),
          validation = validatePreferences(prefs, analysis);
        if (validation) {
          running = false;
          if (status) status.textContent = validation;
          return;
        }
        var candidates = candidateMatrix(analysis, prefs);
        if (status)
          status.textContent =
            "Подбираются конкретные продукты и полностью пересчитываются варианты…";
        var scenarios = generateScenarios(raw, analysis, candidates, prefs),
          payload = plannerPayload(raw, analysis, candidates, scenarios, prefs);
        callGemini(payload).then(function (g) {
          if (runRevision !== calculationRevision) { running = false; return; }
          scenarios = mergeGemini(scenarios, g, prefs);
          currentResult = {
            analysis: analysis,
            candidates: candidates,
            scenarios: scenarios,
            gemini: g || null,
            payload: payload,
            preferences: prefs,
            base_ration: clone(raw)
          };
          render(currentResult);
          if (status)
            status.textContent = g
              ? "Готово: построен проверенный комплекс изменений, Gemini объяснил выбор."
              : (localOnlyReason
                ? "Готово: построен локально рассчитанный комплекс. " + localOnlyReason
                : "Готово: построен локально рассчитанный комплекс; Gemini сейчас недоступен.");
          running = false;
        });
      } catch (e) {
        if (runRevision !== calculationRevision) { running = false; return; }
        running = false;
        if (status)
          status.textContent =
            "Не удалось построить варианты: " +
            text((e && e.message) || e, 300);
      }
    }, 30);
  }
  function clearOutput() {
    currentResult = null;
    var o = $("geminiAiOutput");
    if (o) {
      o.hidden = true;
      o.innerHTML = "";
      o.classList.remove("is-stale");
    }
    var s = $("geminiAiStatus");
    if (s) s.textContent = "";
    var c = $("geminiAiClearBtn");
    if (c) c.hidden = true;
  }
  function bind() {
    populateMetricSelect("aiPlannerTargetMetric", false);
    populateMetricSelect("aiPlannerReplaceCriterion", true);
    populateReplaceProducts();
    loadPreferences();
    var runBtn = $("geminiAiRunBtn"),
      clear = $("geminiAiClearBtn"),
      out = $("geminiAiOutput");
    var eligibility=$("geminiAiEligibility");
    if(eligibility){ eligibility.checked=aiAttested(); eligibility.addEventListener("change",function(){setAiAttestation(eligibility.checked);}); }
    if (runBtn) runBtn.addEventListener("click", run);
    if (clear) clear.addEventListener("click", clearOutput);
    document.addEventListener("needs:invalidated", function () {
      calculationRevision += 1;
      try { if (activeController) activeController.abort(); } catch (_) {}
      activeController = null;
      running = false;
      clearOutput();
      var status = $("geminiAiStatus");
      if (status) status.textContent = "Профиль потребностей изменён. Предыдущий AI-план удалён; выполните новый расчёт перед построением коррекции.";
    });
    if (out)
      out.addEventListener("click", function (e) {
        var b =
          e.target &&
          e.target.closest &&
          e.target.closest("[data-apply-scenario]");
        if (b) {
          var card = b.closest ? b.closest(".ai-plan-card") : null;
          applyScenario(b.getAttribute("data-apply-scenario"), card);
        }
      });
    if (out)
      out.addEventListener("input", function (e) {
        var card =
          e.target && e.target.closest && e.target.closest(".ai-plan-card");
        if (
          card &&
          (e.target.hasAttribute("data-op-field") ||
            e.target.hasAttribute("data-op-enabled"))
        )
          scheduleScenarioCardUpdate(card);
      });
    if (out)
      out.addEventListener("change", function (e) {
        var card =
          e.target && e.target.closest && e.target.closest(".ai-plan-card");
        if (
          card &&
          (e.target.hasAttribute("data-op-field") ||
            e.target.hasAttribute("data-op-enabled"))
        )
          updateScenarioCard(card);
      });
    list(document.querySelectorAll('input[name="aiPlannerTask"]')).forEach(
      function (x) {
        x.addEventListener("change", updateTaskVisibility);
      }
    );
    ["ration:changed", "needs:changed", "norm:region-changed"].forEach(
      function (ev) {
        window.addEventListener(ev, function () {
          populateReplaceProducts();
          if (currentResult && $("geminiAiOutput"))
            $("geminiAiOutput").classList.add("is-stale");
        });
      }
    );
    updateTaskVisibility();
  }
  var API_PUBLIC = {
    version: VERSION,
    build: BUILD,
    featureLevel: FEATURE_LEVEL,
    analysisOf: analysisOf,
    candidateMatrix: candidateMatrix,
    generateScenarios: generateScenarios,
    applyOpsVirtual: applyOpsVirtual,
    applyScenario: applyScenario,
    productRole: productRole,
    run: run,
    getCurrentResult: function () {
      return currentResult;
    },
    metricSpec: metricSpec,
    constraintViolations: constraintViolations
  };
  window["AINutritionPlannerV" + BUILD.replace(/\D/g, "")] = API_PUBLIC;
  window.AINutritionPlanner = API_PUBLIC;
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
