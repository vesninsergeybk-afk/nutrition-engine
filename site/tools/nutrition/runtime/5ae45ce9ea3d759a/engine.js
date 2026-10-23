// Application boundary for the pinned Nutrition engine. No UI or browser globals.
// The assembler inserts audited, byte-identical declarations at the markers.
export function createNutritionEngine(products) {
  let fields = new Map(), messages = [], region = 'us', ration = [];
  const window = { __PRODUCTS_ARRAY__: products, addEventListener() {}, dispatchEvent() {} };
  const State = { get: () => ration, getRegion: () => region };
  window.State = State;
  const $ = id => fields.get(id) || null;
  const document = { readyState: 'loading', getElementById: $, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [], dispatchEvent() {} };
  const alert = text => messages.push(String(text));
  const CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
  function renderReport() {}
  function renderNeedsAgeProfileIndicator() {}
  fields.set('hei_map', { textContent: "{\n  \"cup_eq\": {\n    \"vegetables.leafy_raw\": 70,\n    \"vegetables.leafy_cooked\": 130,\n    \"vegetables.generic_raw\": 130,\n    \"vegetables.generic_cooked\": 130,\n    \"vegetables.legumes_cooked\": 170,\n    \"fruits.generic\": 150,\n    \"fruits.dried\": 40,\n    \"dairy.milk_yogurt\": 244,\n    \"dairy.cheese\": 42\n  },\n  \"oz_eq\": {\n    \"grains.whole_cooked\": 85,\n    \"grains.refined_cooked\": 85,\n    \"grains.dry\": 28.35,\n    \"protein.meat_fish_eggs\": 28.35,\n    \"protein.legume_cooked\": 43,\n    \"protein.nuts_seeds\": 14.0\n  }\n}" });
  /* Generated normative registry v5.3.210-p1.2. Do not edit directly. */
(function(w){'use strict';
var DATA={"schema_version":"1.0.0","registry_version":"v5.3.210-p1.2","released_at":"2026-07-18","reviewed_at":"2026-07-18","applicability":{"population":"Reference values for generally healthy populations unless a profile explicitly states otherwise.","not_individual_prescription":true,"clinical_profiles":"External-target-only; registry does not prescribe clinical nutrition."},"sources":{"nasem_dri_tables":{"title":"Dietary Reference Intakes Tables and Application","publisher":"National Academies of Sciences, Engineering, and Medicine","jurisdiction":"US/Canada","kind":"primary_consensus","url":"https://www.nationalacademies.org/our-work/dietary-reference-intakes","reviewed_at":"2026-07-18"},"nasem_energy_2023":{"title":"Dietary Reference Intakes for Energy","publisher":"National Academies of Sciences, Engineering, and Medicine","year":2023,"doi":"10.17226/26818","kind":"primary_consensus","url":"https://www.ncbi.nlm.nih.gov/books/NBK591034/","reviewed_at":"2026-07-18"},"nasem_sodium_potassium_2019":{"title":"Dietary Reference Intakes for Sodium and Potassium","publisher":"National Academies of Sciences, Engineering, and Medicine","year":2019,"doi":"10.17226/25353","kind":"primary_consensus","url":"https://nap.nationalacademies.org/catalog/25353/dietary-reference-intakes-for-sodium-and-potassium","reviewed_at":"2026-07-18"},"nih_ods_pregnancy":{"title":"Dietary Supplements and Life Stages: Pregnancy — Health Professional Fact Sheet","publisher":"NIH Office of Dietary Supplements","kind":"official_summary","url":"https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/","reviewed_at":"2026-07-18"},"efsa_drv_finder":{"title":"Dietary Reference Values for the EU","publisher":"European Food Safety Authority","jurisdiction":"EU","kind":"primary_scientific_opinion_index","url":"https://multimedia.efsa.europa.eu/drvs/index.htm","reviewed_at":"2026-07-18"},"efsa_b6_ul_2023":{"title":"Scientific opinion on the tolerable upper intake level for vitamin B6","publisher":"European Food Safety Authority","year":2023,"kind":"primary_scientific_opinion","url":"https://www.efsa.europa.eu/en/efsajournal/pub/8006","reviewed_at":"2026-07-18"},"efsa_ul_summary":{"title":"Summary of tolerable upper intake levels","publisher":"European Food Safety Authority","kind":"official_summary","url":"https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values","reviewed_at":"2026-07-18"},"efsa_thiamin":{"title":"Dietary reference values for thiamin","publisher":"European Food Safety Authority","kind":"primary_scientific_opinion","url":"https://www.efsa.europa.eu/en/efsajournal/pub/4653","reviewed_at":"2026-07-18"},"efsa_niacin":{"title":"Dietary reference values for niacin","publisher":"European Food Safety Authority","kind":"primary_scientific_opinion","url":"https://www.efsa.europa.eu/en/efsajournal/pub/3759","reviewed_at":"2026-07-18"},"efsa_potassium":{"title":"Dietary reference values for potassium","publisher":"European Food Safety Authority","kind":"primary_scientific_opinion","url":"https://www.efsa.europa.eu/en/efsajournal/pub/4592","reviewed_at":"2026-07-18"},"efsa_protein":{"title":"Dietary reference values for protein","publisher":"European Food Safety Authority","kind":"primary_scientific_opinion","url":"https://www.efsa.europa.eu/en/efsajournal/pub/2557","reviewed_at":"2026-07-18"},"efsa_life_stage_subset":{"title":"EFSA dietary reference values: verified pregnancy and lactation subset","publisher":"European Food Safety Authority","kind":"derived_primary_set","url":"https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values","reviewed_at":"2026-07-18"},"ru_mr_2_3_1_0253_21":{"title":"МР 2.3.1.0253-21. Нормы физиологических потребностей в энергии и пищевых веществах","publisher":"Роспотребнадзор","year":2021,"jurisdiction":"RU","kind":"official_guideline","url":"https://www.rospotrebnadzor.ru/documents/details.php?ELEMENT_ID=18979","reviewed_at":"2026-07-18"},"who_sfa_2023":{"title":"Saturated fatty acid and trans-fatty acid intake for adults and children","publisher":"World Health Organization","year":2023,"kind":"guideline","url":"https://www.who.int/publications/i/item/9789240073630","reviewed_at":"2026-07-18"},"who_sugars_2015":{"title":"Guideline: Sugars intake for adults and children","publisher":"World Health Organization","year":2015,"kind":"guideline","url":"https://www.who.int/publications/i/item/9789241549028","reviewed_at":"2026-07-18"},"who_sodium_2026":{"title":"Sodium reduction","publisher":"World Health Organization","year":2026,"kind":"official_fact_sheet","url":"https://www.who.int/news-room/fact-sheets/detail/sodium-reduction","reviewed_at":"2026-07-18"},"efsa_fibre":{"title":"Dietary reference values for carbohydrates and dietary fibre","publisher":"European Food Safety Authority","kind":"primary_scientific_opinion","url":"https://www.efsa.europa.eu/en/efsajournal/pub/1462","reviewed_at":"2026-07-18"},"nice_maternal_2025":{"title":"Maternal and child nutrition: nutrition and weight management in pregnancy","publisher":"NICE","year":2025,"id":"NG247","kind":"clinical_guideline","url":"https://www.nice.org.uk/guidance/ng247","reviewed_at":"2026-07-18"},"nice_eating_disorders":{"title":"Eating disorders: recognition and treatment","publisher":"NICE","id":"NG69","kind":"clinical_guideline","url":"https://www.nice.org.uk/guidance/ng69","reviewed_at":"2026-07-18"}},"nutrients":{"vitamin_c_mg":{"title":"Витамин C","unit":"мг","note":"Высокие дозы могут вызывать диарею и спазмы."},"vitamin_a_mcg":{"title":"Витамин A","unit":"мкг РЭ","note":"UL относится к готовому витамину A (ретинолу), а не к пищевому β-каротину."},"vitamin_d_mcg":{"title":"Витамин D","unit":"мкг","note":"1 мкг = 40 МЕ; ориентир предполагает минимальное образование в коже."},"vitamin_e_mg":{"title":"Витамин E","unit":"мг","note":"UL и единицы зависят от формы витамина E."},"vitamin_k_mcg":{"title":"Витамин K","unit":"мкг","note":"UL не установлен; при антагонистах витамина K важна стабильность потребления."},"vitamin_b1_mg":{"title":"Витамин B1","unit":"мг","note":"Ориентир EFSA зависит от энергопотребления."},"vitamin_b2_mg":{"title":"Витамин B2","unit":"мг","note":"UL не установлен."},"vitamin_b3_mg":{"title":"Витамин B3 (ниацин, NE)","unit":"мг","note":"Ориентир EFSA зависит от энергии; UL зависит от формы ниацина."},"vitamin_b5_mg":{"title":"Витамин B5","unit":"мг","note":"UL не установлен."},"vitamin_b6_mg":{"title":"Витамин B6","unit":"мг","note":"Хронический избыток может вызвать периферическую нейропатию."},"vitamin_b9_mcg":{"title":"Фолат (B9)","unit":"мкг DFE","note":"UL относится к фолиевой кислоте из добавок и фортификации."},"vitamin_b12_mcg":{"title":"Витамин B12","unit":"мкг","note":"UL не установлен."},"calcium_mg":{"title":"Кальций","unit":"мг","note":"Возраст и пол влияют на ориентир."},"iron_mg":{"title":"Железо","unit":"мг","note":"Безопасный уровень EFSA не является UL."},"magnesium_mg":{"title":"Магний","unit":"мг","note":"UL относится только к добавкам/фармакологическим формам."},"zinc_mg":{"title":"Цинк","unit":"мг","note":"EFSA PRI зависит от содержания фитата; показан низкофитатный вариант."},"potassium_mg":{"title":"Калий","unit":"мг","note":"При ХБП и некоторых лекарствах требуется клиническая оценка."},"phosphorus_mg":{"title":"Фосфор","unit":"мг","note":"Особенно важен контроль при ХБП."},"iodine_mcg":{"title":"Йод","unit":"мкг","note":"Беременность и лактация используют отдельный жизненный профиль."},"selenium_mcg":{"title":"Селен","unit":"мкг","note":"EFSA пересмотрела UL для взрослых."},"copper_mg":{"title":"Медь","unit":"мг","note":"AI EFSA различается по полу."},"manganese_mg":{"title":"Марганец","unit":"мг","note":"Безопасный уровень EFSA не является UL."},"choline_mg":{"title":"Холин","unit":"мг","note":"Для ЕС UL не установлен."}},"adult_rules":{"us":{"vitamin_c_mg":{"min_rules":[{"value":75,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":90,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":2000,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_a_mcg":{"min_rules":[{"value":700,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":900,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":3000,"scope":"retinol_only","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_d_mcg":{"min_rules":[{"value":20,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"age_min":71}},{"value":15,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":100,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_e_mg":{"min_rules":[{"value":15,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":1000,"scope":"supplemental_synthetic","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_k_mcg":{"min_rules":[{"value":90,"type":"AI","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":120,"type":"AI","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b1_mg":{"min_rules":[{"value":1.1,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":1.2,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b2_mg":{"min_rules":[{"value":1.1,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":1.3,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b3_mg":{"min_rules":[{"value":14,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":16,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":35,"scope":"supplemental_synthetic","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b5_mg":{"min_rules":[{"value":5,"type":"AI","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b6_mg":{"min_rules":[{"value":1.5,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female","age_min":51}},{"value":1.7,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male","age_min":51}},{"value":1.3,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":100,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b9_mcg":{"min_rules":[{"value":400,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":1000,"scope":"synthetic_only","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"vitamin_b12_mcg":{"min_rules":[{"value":2.4,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"US/Canada DRI"},"calcium_mg":{"min_rules":[{"value":1200,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female","age_min":51}},{"value":1200,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male","age_min":71}},{"value":1000,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":2000,"scope":"total","source_ids":["nasem_dri_tables"],"when":{"age_min":51}},{"value":2500,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"iron_mg":{"min_rules":[{"value":18,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female","age_max":50}},{"value":8,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":45,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"magnesium_mg":{"min_rules":[{"value":310,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female","age_max":30}},{"value":320,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":400,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male","age_max":30}},{"value":420,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":350,"scope":"supplements_only","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"zinc_mg":{"min_rules":[{"value":8,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":11,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":40,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"potassium_mg":{"min_rules":[{"value":2600,"type":"AI","source_ids":["nasem_sodium_potassium_2019"],"when":{"sex":"female"}},{"value":3400,"type":"AI","source_ids":["nasem_sodium_potassium_2019"],"when":{"sex":"male"}}],"ul_rules":[],"safe_rules":[],"basis":"US/Canada DRI"},"phosphorus_mg":{"min_rules":[{"value":700,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":3000,"scope":"total","source_ids":["nasem_dri_tables"],"when":{"age_min":71}},{"value":4000,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"iodine_mcg":{"min_rules":[{"value":150,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":1100,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"selenium_mcg":{"min_rules":[{"value":55,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":400,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"copper_mg":{"min_rules":[{"value":0.9,"type":"RDA","source_ids":["nasem_dri_tables"],"when":{}}],"ul_rules":[{"value":10,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"manganese_mg":{"min_rules":[{"value":1.8,"type":"AI","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":2.3,"type":"AI","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":11,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"},"choline_mg":{"min_rules":[{"value":425,"type":"AI","source_ids":["nasem_dri_tables"],"when":{"sex":"female"}},{"value":550,"type":"AI","source_ids":["nasem_dri_tables"],"when":{"sex":"male"}}],"ul_rules":[{"value":3500,"scope":"total","source_ids":["nasem_dri_tables"],"when":{}}],"safe_rules":[],"basis":"US/Canada DRI"}},"eu":{"vitamin_c_mg":{"min_rules":[{"value":95,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":110,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_a_mcg":{"min_rules":[{"value":650,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":750,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[{"value":3000,"scope":"retinol_only","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_d_mcg":{"min_rules":[{"value":15,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[{"value":100,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_e_mg":{"min_rules":[{"value":11,"type":"AI","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":13,"type":"AI","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[{"value":300,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_k_mcg":{"min_rules":[{"value":70,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b1_mg":{"min_rules":[{"formula":{"kind":"per_mj_energy","factor":0.1},"type":"AR","source_ids":["efsa_thiamin"],"formula_label":"0,1 мг/МДж","when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b2_mg":{"min_rules":[{"value":1.6,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b3_mg":{"min_rules":[{"formula":{"kind":"per_mj_energy","factor":1.6},"type":"PRI","source_ids":["efsa_niacin"],"formula_label":"1,6 мг NE/МДж","when":{}}],"ul_rules":[{"value":10,"scope":"nicotinic_acid_only","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b5_mg":{"min_rules":[{"value":5,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b6_mg":{"min_rules":[{"value":1.6,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":1.7,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[{"value":12.5,"scope":"total","source_ids":["efsa_b6_ul_2023"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b9_mcg":{"min_rules":[{"value":330,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[{"value":1000,"scope":"synthetic_only","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"vitamin_b12_mcg":{"min_rules":[{"value":4,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"calcium_mg":{"min_rules":[{"value":1000,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"age_max":24}},{"value":950,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[{"value":2500,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"iron_mg":{"min_rules":[{"value":16,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{"sex":"female","age_max":50}},{"value":11,"type":"PRI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[{"value":40,"scope":"total","label":"безопасный уровень","source_ids":["efsa_ul_summary"],"when":{}}],"basis":"EFSA DRV"},"magnesium_mg":{"min_rules":[{"value":300,"type":"AI","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":350,"type":"AI","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[{"value":250,"scope":"supplements_only","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"zinc_mg":{"min_rules":[{"value":7.5,"type":"PRI†","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":9.4,"type":"PRI†","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[{"value":25,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"potassium_mg":{"min_rules":[{"value":3500,"type":"AI","source_ids":["efsa_potassium"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"phosphorus_mg":{"min_rules":[{"value":550,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"},"iodine_mcg":{"min_rules":[{"value":150,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[{"value":600,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"selenium_mcg":{"min_rules":[{"value":70,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[{"value":255,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"copper_mg":{"min_rules":[{"value":1.3,"type":"AI","source_ids":["efsa_drv_finder"],"when":{"sex":"female"}},{"value":1.6,"type":"AI","source_ids":["efsa_drv_finder"],"when":{"sex":"male"}}],"ul_rules":[{"value":5,"scope":"total","source_ids":["efsa_ul_summary"],"when":{}}],"safe_rules":[],"basis":"EFSA DRV"},"manganese_mg":{"min_rules":[{"value":3,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[{"value":8,"scope":"total","label":"безопасный уровень","source_ids":["efsa_ul_summary"],"when":{}}],"basis":"EFSA DRV"},"choline_mg":{"min_rules":[{"value":400,"type":"AI","source_ids":["efsa_drv_finder"],"when":{}}],"ul_rules":[],"safe_rules":[],"basis":"EFSA DRV"}}},"pediatric_ru_rules":[{"group":"1–2 года РФ","age_min":1,"age_max":2,"sex":"any","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":800,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":10,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":45,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":0.7,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":200,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":80,"unit":"mg","basis":"МР 2.3.1.0253-21"}}},{"group":"3–6 лет РФ","age_min":3,"age_max":6,"sex":"any","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":900,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":12,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":50,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":1.5,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":300,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":200,"unit":"mg","basis":"МР 2.3.1.0253-21"}}},{"group":"7–10 лет РФ","age_min":7,"age_max":10,"sex":"any","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":1100,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":15,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":60,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":2.0,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":350,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":250,"unit":"mg","basis":"МР 2.3.1.0253-21"}}},{"group":"11–14 лет РФ","age_min":11,"age_max":14,"sex":"male","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":1200,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":18,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":70,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":3.0,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":400,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":300,"unit":"mg","basis":"МР 2.3.1.0253-21"}}},{"group":"11–14 лет РФ","age_min":11,"age_max":14,"sex":"female","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":1200,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":18,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":60,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":3.0,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":400,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":300,"unit":"mg","basis":"МР 2.3.1.0253-21"}}},{"group":"15–17 лет РФ","age_min":15,"age_max":17,"sex":"male","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":1200,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":18,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":90,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":3.0,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":400,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":400,"unit":"mg","basis":"МР 2.3.1.0253-21"}}},{"group":"15–17 лет РФ","age_min":15,"age_max":17,"sex":"female","norms":{"vitamin_d_mcg":{"value":15,"unit":"µg","basis":"МР 2.3.1.0253-21"},"calcium_mg":{"value":1200,"unit":"mg","basis":"МР 2.3.1.0253-21"},"iron_mg":{"value":18,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_c_mg":{"value":70,"unit":"mg","basis":"МР 2.3.1.0253-21"},"vitamin_b12_mcg":{"value":3.0,"unit":"µg","basis":"МР 2.3.1.0253-21"},"vitamin_b9_mcg":{"value":400,"unit":"µg","basis":"МР 2.3.1.0253-21"},"magnesium_mg":{"value":400,"unit":"mg","basis":"МР 2.3.1.0253-21"}}}],"life_stage_profiles":{"us":{"pregnancy_19_50":{"stage":"pregnancy","age_min":19,"age_max":50,"items":{"protein_g":{"value":71,"unit":"г","type":"RDA","source_ids":["nasem_dri_tables"]},"fiber_g":{"value":28,"unit":"г","type":"AI","source_ids":["nasem_dri_tables"]},"calcium_mg":{"value":1000,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"choline_mg":{"value":450,"unit":"мг","type":"AI","source_ids":["nasem_dri_tables"]},"vitamin_b9_mcg":{"value":600,"unit":"мкг DFE","type":"RDA","source_ids":["nih_ods_pregnancy"]},"iodine_mcg":{"value":220,"unit":"мкг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"iron_mg":{"value":27,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"potassium_mg":{"value":2900,"unit":"мг","type":"AI","source_ids":["nasem_sodium_potassium_2019"]},"sodium_mg":{"value":1500,"unit":"мг","type":"AI","source_ids":["nasem_sodium_potassium_2019"]},"phosphorus_mg":{"value":700,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_a_mcg":{"value":770,"unit":"мкг RAE","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_b1_mg":{"value":1.4,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_b2_mg":{"value":1.4,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_b3_mg":{"value":18,"unit":"мг NE","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_b5_mg":{"value":6,"unit":"мг","type":"AI","source_ids":["nih_ods_pregnancy"]},"vitamin_b6_mg":{"value":1.9,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_b12_mcg":{"value":2.6,"unit":"мкг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_c_mg":{"value":85,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_d_mcg":{"value":15,"unit":"мкг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_e_mg":{"value":15,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"vitamin_k_mcg":{"value":90,"unit":"мкг","type":"AI","source_ids":["nih_ods_pregnancy"]},"zinc_mg":{"value":11,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"selenium_mcg":{"value":60,"unit":"мкг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"copper_mg":{"value":1,"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]},"manganese_mg":{"value":2,"unit":"мг","type":"AI","source_ids":["nasem_dri_tables"]},"magnesium_mg":{"formula":{"kind":"age_threshold","threshold":30,"at_or_below":350,"above":360},"unit":"мг","type":"RDA","source_ids":["nih_ods_pregnancy"]}},"constraints":{"carbohydrate_minimum_g":175,"source_ids":["nasem_dri_tables"]},"upper_limits":{"phosphorus_mg":{"value":3500,"scope":"total","source_ids":["nasem_dri_tables"]}}},"lactation_19_50":{"stage":"lactation","age_min":19,"age_max":50,"items":{"protein_g":{"value":71,"unit":"г","type":"RDA","source_ids":["nasem_dri_tables"]},"fiber_g":{"value":29,"unit":"г","type":"AI","source_ids":["nasem_dri_tables"]},"calcium_mg":{"value":1000,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"choline_mg":{"value":550,"unit":"мг","type":"AI","source_ids":["nasem_dri_tables"]},"vitamin_b9_mcg":{"value":500,"unit":"мкг DFE","type":"RDA","source_ids":["nasem_dri_tables"]},"iodine_mcg":{"value":290,"unit":"мкг","type":"RDA","source_ids":["nasem_dri_tables"]},"iron_mg":{"value":9,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"potassium_mg":{"value":2800,"unit":"мг","type":"AI","source_ids":["nasem_sodium_potassium_2019"]},"sodium_mg":{"value":1500,"unit":"мг","type":"AI","source_ids":["nasem_sodium_potassium_2019"]},"phosphorus_mg":{"value":700,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_a_mcg":{"value":1300,"unit":"мкг RAE","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_b1_mg":{"value":1.4,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_b2_mg":{"value":1.6,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_b3_mg":{"value":17,"unit":"мг NE","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_b5_mg":{"value":7,"unit":"мг","type":"AI","source_ids":["nasem_dri_tables"]},"vitamin_b6_mg":{"value":2,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_b12_mcg":{"value":2.8,"unit":"мкг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_c_mg":{"value":120,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_d_mcg":{"value":15,"unit":"мкг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_e_mg":{"value":19,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"vitamin_k_mcg":{"value":90,"unit":"мкг","type":"AI","source_ids":["nasem_dri_tables"]},"zinc_mg":{"value":12,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"selenium_mcg":{"value":70,"unit":"мкг","type":"RDA","source_ids":["nasem_dri_tables"]},"copper_mg":{"value":1.3,"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]},"manganese_mg":{"value":2.6,"unit":"мг","type":"AI","source_ids":["nasem_dri_tables"]},"magnesium_mg":{"formula":{"kind":"age_threshold","threshold":30,"at_or_below":310,"above":320},"unit":"мг","type":"RDA","source_ids":["nasem_dri_tables"]}},"constraints":{"carbohydrate_minimum_g":210,"source_ids":["nasem_dri_tables"]}}},"eu":{"pregnancy":{"stage":"pregnancy","items":{"protein_g":{"formula":{"kind":"pregnancy_protein_efsa","base_g_per_kg":0.83,"trimester_additions_g":{"1":1,"2":9,"3":28}},"unit":"г","type":"PRI","source_ids":["efsa_protein"]},"choline_mg":{"value":480,"unit":"мг","type":"AI","source_ids":["efsa_life_stage_subset"]},"vitamin_b5_mg":{"value":5,"unit":"мг","type":"AI","source_ids":["efsa_life_stage_subset"]},"vitamin_b6_mg":{"value":1.8,"unit":"мг","type":"PRI","source_ids":["efsa_life_stage_subset"]},"vitamin_d_mcg":{"value":15,"unit":"мкг","type":"AI","source_ids":["efsa_life_stage_subset"]}}},"lactation":{"stage":"lactation","items":{"protein_g":{"formula":{"kind":"lactation_protein_efsa","base_g_per_kg":0.83,"first_6_months_addition_g":19,"later_addition_g":13},"unit":"г","type":"PRI","source_ids":["efsa_protein"]},"choline_mg":{"value":520,"unit":"мг","type":"AI","source_ids":["efsa_life_stage_subset"]},"potassium_mg":{"value":4000,"unit":"мг","type":"AI","source_ids":["efsa_potassium"]},"vitamin_b5_mg":{"value":7,"unit":"мг","type":"AI","source_ids":["efsa_life_stage_subset"]},"vitamin_b6_mg":{"value":1.7,"unit":"мг","type":"PRI","source_ids":["efsa_life_stage_subset"]},"vitamin_d_mcg":{"value":15,"unit":"мкг","type":"AI","source_ids":["efsa_life_stage_subset"]}}}}},"energy_formulas":{"nasem_adult_female_2023":{"source_ids":["nasem_energy_2023"],"pal_categories":["inactive","low_active","active","very_active"]},"nasem_pregnancy_2023":{"source_ids":["nasem_energy_2023"]},"nasem_lactation_2023":{"source_ids":["nasem_energy_2023"],"increments_kcal":{"exclusive_0_6":404,"partial_7_12":380}}},"derived_guardrails":{"sfa_g":{"formula":{"kind":"percent_energy_to_grams","percent":10,"kcal_per_g":9},"type":"maximum","source_ids":["who_sfa_2023"],"note":"Не более 10% энергии из насыщенных жирных кислот."},"added_sugars_g":{"formula":{"kind":"percent_energy_to_grams","percent":10,"kcal_per_g":4},"type":"maximum_proxy","source_ids":["who_sugars_2015"],"note":"Добавленные сахара используются как отслеживаемая часть свободных сахаров; это не полное тождество."},"sodium_mg_public_health_max":{"value":2000,"unit":"мг","type":"maximum","source_ids":["who_sodium_2026"]},"fiber_g_adult_ai":{"value":25,"unit":"г","type":"AI","source_ids":["efsa_fibre"]}},"tracked_life_stage_keys":["protein_g","fiber_g","calcium_mg","choline_mg","vitamin_b9_mcg","iodine_mcg","iron_mg","magnesium_mg","potassium_mg","sodium_mg","phosphorus_mg","vitamin_a_mcg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg","vitamin_b6_mg","vitamin_b12_mcg","vitamin_c_mg","vitamin_d_mcg","vitamin_e_mg","vitamin_k_mcg","zinc_mg","selenium_mcg","copper_mg","manganese_mg"],"review_due_at":"2027-07-18","supersedes":"distributed normative constants through v5.3.210-p1.1"};
var SOURCE_SHA="49d41874155382ae6d1d97c226076a9b701815c0a51dd08d6bb6f780cd892264";
function finite(v){v=Number(v);return isFinite(v)?v:null;}
function clone(v){if(v==null)return v;return JSON.parse(JSON.stringify(v));}
function match(when,c){when=when||{};c=c||{};if(when.sex&&String(c.sex)!==String(when.sex))return false;var a=finite(c.age);if(when.age_min!=null&&(a==null||a<Number(when.age_min)))return false;if(when.age_max!=null&&(a==null||a>Number(when.age_max)))return false;return true;}
function select(rules,c){rules=rules||[];for(var i=0;i<rules.length;i++)if(match(rules[i].when,c))return rules[i];return null;}
function provenance(rule,ruleId){return {registryVersion:DATA.registry_version,registrySha256:SOURCE_SHA,reviewedAt:DATA.reviewed_at,reviewDueAt:DATA.review_due_at,ruleId:ruleId,sourceIds:(rule&&rule.source_ids||[]).slice()};}
function evaluateRule(rule,c,ruleId){if(!rule)return null;var out=clone(rule);delete out.when;var f=rule.formula||null;if(f){var value=null;if(f.kind==='per_mj_energy'){var kcal=finite(c&&c.energyKcal);if(kcal!=null)value=kcal*4.184/1000*Number(f.factor);}else if(f.kind==='percent_energy_to_grams'){var e=finite(c&&c.energyKcal);if(e!=null)value=e*Number(f.percent)/100/Number(f.kcal_per_g);}if(value!=null)out.value=Math.round(value*100)/100;else{out.value=null;out.requires=['energyKcal'];}}
out.provenance=provenance(rule,ruleId);return out;}
function profile(c,region){var age=finite(c&&c.age),sex=String(c&&c.sex||'male');return (region==='eu'?'ЕС · EFSA':'США · DRI')+' · '+(sex==='female'?'женщина':'мужчина')+' · '+(age!=null?Math.round(age)+' лет':'возраст не указан');}
function childRow(c){var age=finite(c&&c.age),sex=String(c&&c.sex||'male');if(age==null||age<1||age>=18)return null;var rows=DATA.pediatric_ru_rules||[];for(var i=0;i<rows.length;i++){var r=rows[i];if(age>=r.age_min&&age<=r.age_max&&(r.sex===sex||r.sex==='any'))return r;}return null;}
function resolveChild(key,c){var row=childRow(c);if(!row)return null;var n=row.norms&&row.norms[key];var base={min:null,ul:null,safe:null,basis:'МР 2.3.1.0253-21',profile:row.group+(row.sex==='male'?' · мальчики':row.sex==='female'?' · девочки':''),note:'',coverageStatus:n?'verified':'unavailable',provenance:{registryVersion:DATA.registry_version,reviewedAt:DATA.reviewed_at,ruleId:'pediatric_ru.'+row.age_min+'_'+row.age_max+'.'+row.sex+'.'+key,sourceIds:['ru_mr_2_3_1_0253_21']}};if(n)base.min={type:'Норма РФ',value:Number(n.value),provenance:base.provenance};else base.note='Для этого нутриента отдельный детский ориентир в текущем реестре не задан.';return base;}
function resolveAdult(key,region,c){region=region==='eu'?'eu':'us';var bucket=DATA.adult_rules[region]&&DATA.adult_rules[region][key];if(!bucket)return {min:null,ul:null,safe:null,basis:'реестр недоступен',profile:profile(c,region),note:'Норматив не найден.',coverageStatus:'unavailable',provenance:{registryVersion:DATA.registry_version,reviewedAt:DATA.reviewed_at,ruleId:'missing.'+region+'.'+key,sourceIds:[]}};var minRule=select(bucket.min_rules,c),ulRule=select(bucket.ul_rules,c),safeRule=select(bucket.safe_rules,c);var min=evaluateRule(minRule,c,'adult.'+region+'.'+key+'.min'),ul=evaluateRule(ulRule,c,'adult.'+region+'.'+key+'.ul'),safe=evaluateRule(safeRule,c,'adult.'+region+'.'+key+'.safe');var meta=DATA.nutrients[key]||{};return {min:min,ul:ul,safe:safe,basis:bucket.basis,profile:profile(c,region),note:meta.note||'',coverageStatus:min?'verified':'unavailable',provenance:provenance(minRule,'adult.'+region+'.'+key)};}
function resolveMicro(key,region,c){return resolveChild(key,c)||resolveAdult(key,region,c||{});}
function calcLifeItem(item,c,stage,key){var out=clone(item),f=item&&item.formula;if(f){var v=null;if(f.kind==='pregnancy_protein_efsa'){var wt=finite(c.prepregWeight),week=finite(c.gestationWeek),tr=week==null?null:(week<=13?1:week<=27?2:3);if(wt!=null&&tr!=null)v=Number(f.base_g_per_kg)*wt+Number(f.trimester_additions_g[String(tr)]);}else if(f.kind==='lactation_protein_efsa'){var cw=finite(c.currentWeight),m=finite(c.postpartumMonth);if(cw!=null&&m!=null)v=Number(f.base_g_per_kg)*cw+Number(m<=6?f.first_6_months_addition_g:f.later_addition_g);}else if(f.kind==='age_threshold'){var a=finite(c.age);if(a!=null)v=Number(a<=Number(f.threshold)?f.at_or_below:f.above);}if(v!=null)out.value=Math.round(v*10)/10;else{out.value=null;out.requires=['life_stage_inputs'];}}out.provenance=provenance(item,'life_stage.'+String(c.region)+'.'+stage+'.'+key);out.basis=String(out.type||'ориентир')+' · '+(out.provenance.sourceIds||[]).join(', ');return out;}
function resolveLifeStage(c){c=c||{};var region=c.region==='eu'?'eu':'us',stage=String(c.stage||'');var group=DATA.life_stage_profiles[region]||{},p;if(region==='us')p=group[stage+'_19_50'];else p=group[stage];if(!p)return null;var items={},coverage={},keys=(DATA.tracked_life_stage_keys||[]).slice();for(var i=0;i<keys.length;i++){var k=keys[i],raw=p.items&&p.items[k];if(raw){var it=calcLifeItem(raw,c,stage,k);if(it.value!=null){items[k]=it;coverage[k]={status:'verified',sourceId:(it.provenance.sourceIds||[])[0]||null,sourceIds:it.provenance.sourceIds,basis:it.basis};}else coverage[k]={status:'unavailable',sourceIds:it.provenance.sourceIds,note:'Для расчёта не хватает входных данных.'};}else coverage[k]={status:'unavailable',sourceIds:[],note:'Жизненное значение не подтверждено; взрослая норма не подставляется.'};}
var verified=Object.keys(coverage).filter(function(k){return coverage[k].status==='verified';});items._coverage=coverage;items._verifiedKeys=verified;items._coverageSummary={tracked:keys.length,verified:verified.length,unavailable:keys.length-verified.length,complete:verified.length===keys.length};items._constraints=clone(p.constraints||{});items._upperLimits=clone(p.upper_limits||{});items._lifeStage={region:region,stage:stage,completeness:verified.length===keys.length?'tracked_dri_complete':'verified_subset',registryVersion:DATA.registry_version,reviewedAt:DATA.reviewed_at,note:region==='us'?'US DRI жизненный профиль из централизованного реестра.':'Показан только проверенный поднабор EFSA; отсутствующие взрослые нормы не подставляются.'};return items;}
function resolveDerived(key,c){var rule=DATA.derived_guardrails[key];if(!rule)return null;return evaluateRule(rule,c||{},'derived.'+key);}
function getMicroLimitsMap(){var out={};Object.keys(DATA.nutrients).forEach(function(k){var m=DATA.nutrients[k];out[k]={title:m.title,unit:m.unit,note:m.note||'',min:{us:{type:'registry'},eu:{type:'registry'}},ul:null,registryManaged:true};});return out;}
function audit(){var errs=[],today=(new Date()).toISOString().slice(0,10),stale=!!(DATA.review_due_at&&today>DATA.review_due_at);Object.keys(DATA.adult_rules).forEach(function(r){Object.keys(DATA.nutrients).forEach(function(k){var b=DATA.adult_rules[r][k];if(!b||!b.min_rules||!b.min_rules.length)errs.push('missing:'+r+':'+k);});});return {ok:errs.length===0&&!stale,stale:stale,errors:errs,registryVersion:DATA.registry_version,registrySha256:SOURCE_SHA,reviewedAt:DATA.reviewed_at,reviewDueAt:DATA.review_due_at,sourceCount:Object.keys(DATA.sources).length,nutrientCount:Object.keys(DATA.nutrients).length};}
function deepFreeze(o){if(!o||typeof o!=='object'||!Object.freeze)return o;Object.keys(o).forEach(function(k){deepFreeze(o[k]);});try{Object.freeze(o);}catch(_){}return o;}deepFreeze(DATA);
var API={version:DATA.registry_version,schemaVersion:DATA.schema_version,sourceSha256:SOURCE_SHA,reviewedAt:DATA.reviewed_at,reviewDueAt:DATA.review_due_at,data:DATA,resolveMicro:resolveMicro,resolveAdult:resolveAdult,resolveLifeStageProfile:resolveLifeStage,resolveDerived:resolveDerived,getMicroLimitsMap:getMicroLimitsMap,getNutrientMeta:function(k){return clone(DATA.nutrients[k]||null);},getSource:function(id){return clone(DATA.sources[id]||null);},audit:audit};
try{if(Object.freeze)Object.freeze(API);}catch(_){}w.NutritionNormativeRegistry=API;
})(window);

/* Generated P1.4 formula registry. Do not edit by hand. */
(function(){
'use strict';
var registry={"schema_version":1,"registry_version":"v5.3.210-p1.4","released_at":"2026-07-18","reviewed_at":"2026-07-18","review_due_at":"2027-07-18","scope":"Material, user-observable calculation and decision formulas. Search ranking and visual heuristics are excluded.","sources":{"mifflin_1990":{"title":"Mifflin–St Jeor resting energy equation","authority":"peer_reviewed_primary","url":"https://pubmed.ncbi.nlm.nih.gov/2305711/","reviewed_at":"2026-07-18"},"nasem_energy_2023":{"title":"Dietary Reference Intakes for Energy, NASEM 2023","authority":"authoritative_report","url":"https://www.ncbi.nlm.nih.gov/books/NBK591024/","doi":"10.17226/26818","reviewed_at":"2026-07-18"},"nice_cg32":{"title":"NICE CG32 Nutrition support for adults","authority":"official_guideline","url":"https://www.nice.org.uk/guidance/cg32","reviewed_at":"2026-07-18"},"nci_hei_2020":{"title":"Healthy Eating Index 2020 scoring standards","authority":"official_methodology","url":"https://epi.grants.cancer.gov/hei/hei-2020-scoring-metric.html","reviewed_at":"2026-07-18"},"efsa_dietary_reference_values":{"title":"EFSA dietary reference values and life-stage additions","authority":"official_scientific_opinion","url":"https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values","reviewed_at":"2026-07-18"},"devine_1974":{"title":"Devine ideal body weight equation (historical dosage rule)","authority":"historical_peer_reviewed","citation":"Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650–655.","reviewed_at":"2026-07-18"},"internal_local_policy":{"title":"Nutrition Calculator local screening policy","authority":"internal_policy","document":"NUTRITION_CALCULATOR_V5_3_210_P1_4_FORMULA_REGISTRY_REPORT_RU.md","reviewed_at":"2026-07-18"},"arithmetic_identity":{"title":"Dimensional arithmetic identity","authority":"mathematical_identity","reviewed_at":"2026-07-18"}},"formulas":[{"id":"anthropometry.bmi","title_ru":"Индекс массы тела","kind":"AUTHORITATIVE","source_ids":["arithmetic_identity"],"implementation":["assets/js/04-needs-norms.js::computeBMI"],"equation":"weight_kg/(height_m^2)","inputs":["height_cm","weight_kg"],"outputs":["bmi_kg_m2"],"rounding":"0.1","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"anthropometry.devine_ibw","title_ru":"Расчётная масса Devine","kind":"AUTHORITATIVE","source_ids":["devine_1974"],"implementation":["assets/js/04-needs-norms.js::computeIBW"],"equation":"male: 50+0.9*(height_cm-152); female:45.5+0.9*(height_cm-152); undefined below 152 cm","inputs":["sex","height_cm"],"outputs":["ibw_kg"],"rounding":"none","status":"active","materiality":"material","notes_ru":"Историческая формула для расчётной массы; не является универсальной целью массы.","golden_case_required":true},{"id":"anthropometry.adjusted_weight","title_ru":"Скорректированная масса","kind":"LOCAL_POLICY","source_ids":["internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::computeAdjusted"],"equation":"ibw+factor*(actual-ibw)","inputs":["ibw_kg","actual_weight_kg","factor"],"outputs":["adjusted_weight_kg"],"rounding":"none","status":"active","materiality":"material","notes_ru":"Локальная расчётная политика, не самостоятельная клиническая рекомендация.","golden_case_required":true},{"id":"anthropometry.weight_loss_pct","title_ru":"Непреднамеренная потеря массы","kind":"AUTHORITATIVE","source_ids":["nice_cg32"],"implementation":["assets/js/04-needs-norms.js::computeUnintentionalWeightLossPct"],"equation":"max(0,(previous-current)/previous*100)","inputs":["previous_weight_kg","current_weight_kg"],"outputs":["weight_loss_pct"],"rounding":"0.1","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"safety.nice_refeeding_screen","title_ru":"Скрининг риска рефидинга NICE","kind":"DECISION_RULE","source_ids":["nice_cg32"],"implementation":["assets/js/04-needs-norms.js::assessAdultRefeedingRisk"],"equation":"one major OR two minor criteria; extreme if BMI<14 or intake>15 days","inputs":["age","bmi","weight_loss_pct","low_intake_days","electrolytes","additional_factors"],"outputs":["risk_level","high_risk","extreme_risk"],"rounding":"categorical","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"energy.mifflin_st_jeor","title_ru":"Основной обмен Mifflin–St Jeor","kind":"AUTHORITATIVE","source_ids":["mifflin_1990"],"implementation":["assets/js/04-needs-norms.js::mifflinBMR"],"equation":"10*w+6.25*h-5*age+s; s=5 male, -161 female","inputs":["sex","weight_kg","height_cm","age_years"],"outputs":["bmr_kcal_day"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"energy.ordinary_pal","title_ru":"Оценка TEE через PAL","kind":"LOCAL_POLICY","source_ids":["mifflin_1990","internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::energyByMifflinSF"],"equation":"BMR*PAL*state_factor","inputs":["bmr_kcal_day","pal","state_factor"],"outputs":["tee_low_kcal","tee_high_kcal"],"rounding":"integer","status":"active","materiality":"material","notes_ru":"PAL и диапазон +10% являются локальной политикой калькулятора.","golden_case_required":true},{"id":"energy.weight_screen","title_ru":"Весовой скрининговый диапазон энергии","kind":"LOCAL_POLICY","source_ids":["internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::energyByWeightMethod"],"equation":"kcal_per_kg*weight*activity_scale*state_factor; high=low*1.15","inputs":["state","activity","weight_kg"],"outputs":["energy_low_kcal","energy_high_kcal"],"rounding":"integer","status":"active","materiality":"material","notes_ru":"Скрининговая, а не лечебная формула; клинические режимы исключены.","golden_case_required":true},{"id":"energy.goal_factor","title_ru":"Целевой множитель энергии","kind":"LOCAL_POLICY","source_ids":["internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::goalFactorByKey"],"equation":"maintain 1.00; lose 0.85; gain 1.10; rehab_gain 1.10","inputs":["goal"],"outputs":["factor"],"rounding":"none","status":"active","materiality":"material","notes_ru":"Локальная настройка; блокируется защитными режимами.","golden_case_required":true},{"id":"protein.ordinary_target","title_ru":"Обычная цель белка","kind":"LOCAL_POLICY","source_ids":["internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::proteinPerKgFor"],"equation":"state/activity table + goal bump + age floor, clamped to state corridor","inputs":["state","activity","age","goal","weight_kg","sex"],"outputs":["protein_g_kg_day"],"rounding":"0.01","status":"active","materiality":"material","notes_ru":"Локальная политика. Клинические состояния требуют внешней цели.","golden_case_required":true},{"id":"macros.fat_share","title_ru":"Жиры из доли энергии","kind":"DERIVED","source_ids":["arithmetic_identity","internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::calcNeeds_internal"],"equation":"energy_kcal*fat_percent/100/9","inputs":["energy_kcal","fat_percent"],"outputs":["fat_g"],"rounding":"0.1","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"macros.carb_residual","title_ru":"Углеводы как остаток энергии","kind":"DERIVED","source_ids":["arithmetic_identity","internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::calcNeeds_internal"],"equation":"max(0,(energy-protein_g*4-fat_g*9)/4)","inputs":["energy_kcal","protein_g","fat_g"],"outputs":["carbs_g"],"rounding":"0.1","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"fluids.ordinary_screen","title_ru":"Обычная оценка жидкости","kind":"LOCAL_POLICY","source_ids":["internal_local_policy"],"implementation":["assets/js/04-needs-norms.js::calcNeeds_internal"],"equation":"fluid_ml_per_kg*calculation_weight","inputs":["fluid_ml_per_kg","weight_kg"],"outputs":["fluid_ml_day"],"rounding":"integer","status":"active","materiality":"material","notes_ru":"Не применяется при клинических ограничениях жидкости.","golden_case_required":true},{"id":"meals.energy_split","title_ru":"Распределение по приёмам","kind":"DERIVED","source_ids":["arithmetic_identity"],"implementation":["assets/js/04-needs-norms.js::parseSplit","assets/js/04-needs-norms.js::calcNeeds_internal"],"equation":"daily_target*meal_percent/100","inputs":["daily_targets","meal_percentages"],"outputs":["meal_targets"],"rounding":"mixed","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"energy.nasem_adult_female_2023","title_ru":"NASEM 2023 EER для взрослых женщин","kind":"AUTHORITATIVE","source_ids":["nasem_energy_2023"],"implementation":["assets/js/05-protected-modes-v5.3.210.js::adultFemaleTee"],"equation":"PAL-specific linear equation in age, height and weight","inputs":["pal","age_years","height_cm","weight_kg"],"outputs":["tee_kcal_day"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"energy.nasem_pregnancy_2023","title_ru":"NASEM 2023 энергия при беременности","kind":"AUTHORITATIVE","source_ids":["nasem_energy_2023"],"implementation":["assets/js/05-protected-modes-v5.3.210.js::pregnancyTee"],"equation":"trimester/PAL-specific equation plus BMI-dependent deposition","inputs":["pal","age_years","height_cm","current_weight_kg","gestation_week","prepreg_weight_kg"],"outputs":["target_kcal_day","deposition_kcal","trimester"],"rounding":"integer","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"energy.nasem_lactation_2023","title_ru":"NASEM 2023 энергия при лактации","kind":"AUTHORITATIVE","source_ids":["nasem_energy_2023"],"implementation":["assets/js/05-protected-modes-v5.3.210.js::lactationTee"],"equation":"adult female EER +404 (exclusive 0-6) or +380 (partial 7-12)","inputs":["pal","age_years","height_cm","current_weight_kg","postpartum_month","feeding"],"outputs":["target_kcal_day"],"rounding":"integer","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"product.per100_scaling","title_ru":"Масштабирование значений на массу продукта","kind":"ARITHMETIC","source_ids":["arithmetic_identity"],"implementation":["assets/js/03-app-core-v5.3.208.js::Calc.scaledPerItem","assets/legacy/js/03-app-core-v5.3.208.js::Calc.scaledPerItem"],"equation":"per100_value*grams/100","inputs":["per100_value","grams"],"outputs":["scaled_value"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"product.salt_to_sodium","title_ru":"Fallback соли в натрий","kind":"LOCAL_POLICY","source_ids":["internal_local_policy"],"implementation":["assets/js/03-app-core-v5.3.208.js::Calc.scaledPerItem","assets/legacy/js/03-app-core-v5.3.208.js::Calc.scaledPerItem"],"equation":"sodium_mg=salt_g*393 when sodium is absent","inputs":["salt_g"],"outputs":["sodium_mg"],"rounding":"none","status":"active","materiality":"material","notes_ru":"Коэффициент соответствует 39.3% натрия в NaCl; применяется только как fallback.","golden_case_required":true},{"id":"ration.nutrient_sum","title_ru":"Суммирование нутриентов рациона","kind":"ARITHMETIC","source_ids":["arithmetic_identity"],"implementation":["assets/js/03-app-core-v5.3.208.js::Calc.totals","assets/legacy/js/03-app-core-v5.3.208.js::Calc.totals"],"equation":"sum(scaled product values)","inputs":["ration_items"],"outputs":["nutrient_totals"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"norm.per_mj","title_ru":"Норма на мегаджоуль","kind":"DERIVED","source_ids":["arithmetic_identity"],"implementation":["assets/data/normative-registry.v5.3.210-p1.2.js::evaluateRule(per_mj_energy)"],"equation":"energy_kcal*4.184/1000*value_per_mj","inputs":["energy_kcal","value_per_mj"],"outputs":["target_value"],"rounding":"0.01","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"norm.percent_energy_to_grams","title_ru":"Процент энергии в граммы","kind":"DERIVED","source_ids":["arithmetic_identity"],"implementation":["assets/data/normative-registry.v5.3.210-p1.2.js::evaluateRule(percent_energy_to_grams)"],"equation":"energy_kcal*percent/100/kcal_per_g","inputs":["energy_kcal","percent","kcal_per_g"],"outputs":["grams"],"rounding":"0.01","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"protein.efsa_pregnancy","title_ru":"Белок EFSA при беременности","kind":"AUTHORITATIVE","source_ids":["efsa_dietary_reference_values"],"implementation":["assets/data/normative-registry.v5.3.210-p1.2.js::resolveLifeStageProfile"],"equation":"0.83*prepreg_weight + trimester addition (1/9/28 g)","inputs":["prepreg_weight_kg","gestation_week"],"outputs":["protein_g_day"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"protein.efsa_lactation","title_ru":"Белок EFSA при лактации","kind":"AUTHORITATIVE","source_ids":["efsa_dietary_reference_values"],"implementation":["assets/data/normative-registry.v5.3.210-p1.2.js::resolveLifeStageProfile"],"equation":"0.83*current_weight +19 g first 6 months, +13 g thereafter","inputs":["current_weight_kg","postpartum_month"],"outputs":["protein_g_day"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"hei.density","title_ru":"HEI плотность на 1000 ккал","kind":"AUTHORITATIVE","source_ids":["nci_hei_2020"],"implementation":["assets/js/01-hei-module.js::score","assets/legacy/js/01-hei-module.js::score"],"equation":"component_amount*1000/reference_energy_kcal","inputs":["component_amount","energy_ref_kcal"],"outputs":["density_per_1000_kcal"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"hei.adequacy_component","title_ru":"HEI adequacy interpolation","kind":"AUTHORITATIVE","source_ids":["nci_hei_2020"],"implementation":["assets/js/01-hei-module.js::scoreFromDensity","assets/legacy/js/01-hei-module.js::scoreFromDensity"],"equation":"linear from 0 points at zero to max points at standard","inputs":["density","standard","max_points"],"outputs":["points"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"hei.moderation_component","title_ru":"HEI moderation interpolation","kind":"AUTHORITATIVE","source_ids":["nci_hei_2020"],"implementation":["assets/js/01-hei-module.js::scoreFromDensity","assets/legacy/js/01-hei-module.js::scoreFromDensity"],"equation":"max points <= max standard; zero >= minimum standard; linear between","inputs":["density","max_standard","zero_standard","max_points"],"outputs":["points"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"hei.fatty_acid_ratio","title_ru":"HEI отношение ненасыщенных к насыщенным жирам","kind":"AUTHORITATIVE","source_ids":["nci_hei_2020"],"implementation":["assets/js/01-hei-module.js::score","assets/legacy/js/01-hei-module.js::score"],"equation":"(MUFA+PUFA)/SFA; max standard 2.5, zero standard 1.2","inputs":["unsaturated_fat_g","saturated_fat_g"],"outputs":["ratio","points"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true},{"id":"hei.total","title_ru":"Суммарный HEI-2020","kind":"AUTHORITATIVE","source_ids":["nci_hei_2020"],"implementation":["assets/js/01-hei-module.js::scoreFromDensity","assets/legacy/js/01-hei-module.js::scoreFromDensity"],"equation":"sum of 13 component scores, range 0-100","inputs":["component_points"],"outputs":["hei_total"],"rounding":"none","status":"active","materiality":"material","notes_ru":"","golden_case_required":true}],"quality_policy":{"authoritative_requires_source":true,"material_requires_golden_cases":true,"local_policy_must_be_labeled":true,"clinical_profiles_external_target_only":true,"minimum_cases_per_material_formula":2,"boundary_case_required_for_decision_rules":true}};
var golden={"schema_version":1,"cases_version":"v5.3.210-p1.4","generated_by":"independent_python_reference_implementations","generated_at":"2026-07-18","cases":[{"case_id":"bmi_normal","formula_id":"anthropometry.bmi","inputs":{"height_cm":180,"weight_kg":81},"expected":25.0,"tolerance":0.01,"tags":[]},{"case_id":"bmi_low","formula_id":"anthropometry.bmi","inputs":{"height_cm":165,"weight_kg":50},"expected":18.4,"tolerance":0.01,"tags":[]},{"case_id":"bmi_obese","formula_id":"anthropometry.bmi","inputs":{"height_cm":160,"weight_kg":102.4},"expected":40.0,"tolerance":0.01,"tags":[]},{"case_id":"devine_male_152","formula_id":"anthropometry.devine_ibw","inputs":{"sex":"male","height_cm":152},"expected":50,"tolerance":1e-09,"tags":[]},{"case_id":"devine_female_170","formula_id":"anthropometry.devine_ibw","inputs":{"sex":"female","height_cm":170},"expected":61.7,"tolerance":1e-09,"tags":[]},{"case_id":"devine_below_domain","formula_id":"anthropometry.devine_ibw","inputs":{"sex":"male","height_cm":151},"expected":null,"tolerance":1e-09,"tags":["boundary"]},{"case_id":"adj_quarter","formula_id":"anthropometry.adjusted_weight","inputs":{"ibw_kg":70,"actual_weight_kg":110,"factor":0.25},"expected":80,"tolerance":1e-09,"tags":[]},{"case_id":"adj_point4","formula_id":"anthropometry.adjusted_weight","inputs":{"ibw_kg":70,"actual_weight_kg":120,"factor":0.4},"expected":90,"tolerance":1e-09,"tags":[]},{"case_id":"loss_10","formula_id":"anthropometry.weight_loss_pct","inputs":{"previous_weight_kg":50,"current_weight_kg":45},"expected":10.0,"tolerance":1e-09,"tags":[]},{"case_id":"loss_no_gain_negative","formula_id":"anthropometry.weight_loss_pct","inputs":{"previous_weight_kg":50,"current_weight_kg":55},"expected":0.0,"tolerance":1e-09,"tags":[]},{"case_id":"refeed_bmi_16_not_major","formula_id":"safety.nice_refeeding_screen","inputs":{"age":40,"bmi":16,"weight_loss_pct":0,"low_intake_days":0,"electrolytes":"normal","additional_factors":"no"},"expected":{"highRisk":false,"extremeRisk":false},"tolerance":1e-09,"tags":["boundary"]},{"case_id":"refeed_bmi_15_9_major","formula_id":"safety.nice_refeeding_screen","inputs":{"age":40,"bmi":15.9,"weight_loss_pct":0,"low_intake_days":0,"electrolytes":"normal","additional_factors":"no"},"expected":{"highRisk":true,"extremeRisk":false},"tolerance":1e-09,"tags":["boundary"]},{"case_id":"refeed_two_minor","formula_id":"safety.nice_refeeding_screen","inputs":{"age":40,"bmi":18.4,"weight_loss_pct":10.1,"low_intake_days":0,"electrolytes":"normal","additional_factors":"no"},"expected":{"highRisk":true,"extremeRisk":false},"tolerance":1e-09,"tags":[]},{"case_id":"refeed_extreme_intake","formula_id":"safety.nice_refeeding_screen","inputs":{"age":40,"bmi":20,"weight_loss_pct":0,"low_intake_days":15.1,"electrolytes":"normal","additional_factors":"no"},"expected":{"highRisk":true,"extremeRisk":true},"tolerance":1e-09,"tags":["boundary"]},{"case_id":"mifflin_male_70_40","formula_id":"energy.mifflin_st_jeor","inputs":{"sex":"male","weight_kg":70,"height_cm":175,"age_years":40},"expected":1598.75,"tolerance":1e-09,"tags":[]},{"case_id":"mifflin_female_60_30","formula_id":"energy.mifflin_st_jeor","inputs":{"sex":"female","weight_kg":60,"height_cm":165,"age_years":30},"expected":1320.25,"tolerance":1e-09,"tags":[]},{"case_id":"mifflin_female_90_65","formula_id":"energy.mifflin_st_jeor","inputs":{"sex":"female","weight_kg":90,"height_cm":170,"age_years":65},"expected":1476.5,"tolerance":1e-09,"tags":[]},{"case_id":"ordinary_pal_sedentary","formula_id":"energy.ordinary_pal","inputs":{"sex":"male","weight_kg":70,"height_cm":175,"age_years":40,"activity":"sedentary","state_factor":1},"expected":{"low":1919,"high":2111},"tolerance":1e-09,"tags":[]},{"case_id":"ordinary_pal_low","formula_id":"energy.ordinary_pal","inputs":{"sex":"male","weight_kg":70,"height_cm":175,"age_years":40,"activity":"low","state_factor":1},"expected":{"low":2158,"high":2374},"tolerance":1e-09,"tags":[]},{"case_id":"ordinary_pal_moderate","formula_id":"energy.ordinary_pal","inputs":{"sex":"male","weight_kg":70,"height_cm":175,"age_years":40,"activity":"moderate","state_factor":1},"expected":{"low":2398,"high":2638},"tolerance":1e-09,"tags":[]},{"case_id":"ordinary_pal_high","formula_id":"energy.ordinary_pal","inputs":{"sex":"male","weight_kg":70,"height_cm":175,"age_years":40,"activity":"high","state_factor":1},"expected":{"low":2718,"high":2990},"tolerance":1e-09,"tags":[]},{"case_id":"ordinary_pal_veryhigh","formula_id":"energy.ordinary_pal","inputs":{"sex":"male","weight_kg":70,"height_cm":175,"age_years":40,"activity":"veryhigh","state_factor":1},"expected":{"low":3038,"high":3342},"tolerance":1e-09,"tags":[]},{"case_id":"weight_screen_normal_low","formula_id":"energy.weight_screen","inputs":{"state":"normal","activity":"low","weight_kg":70},"expected":{"low":1750,"high":2012},"tolerance":1e-09,"tags":[]},{"case_id":"weight_screen_rehab_low","formula_id":"energy.weight_screen","inputs":{"state":"rehab","activity":"low","weight_kg":70},"expected":{"low":1985,"high":2282},"tolerance":1e-09,"tags":[]},{"case_id":"weight_screen_elderly_low","formula_id":"energy.weight_screen","inputs":{"state":"elderly","activity":"low","weight_kg":70},"expected":{"low":1750,"high":2012},"tolerance":1e-09,"tags":[]},{"case_id":"goal_maintain","formula_id":"energy.goal_factor","inputs":{"goal":"maintain"},"expected":1,"tolerance":1e-09,"tags":[]},{"case_id":"goal_lose","formula_id":"energy.goal_factor","inputs":{"goal":"lose"},"expected":0.85,"tolerance":1e-09,"tags":[]},{"case_id":"goal_gain","formula_id":"energy.goal_factor","inputs":{"goal":"gain"},"expected":1.1,"tolerance":1e-09,"tags":[]},{"case_id":"goal_rehab_gain","formula_id":"energy.goal_factor","inputs":{"goal":"rehab_gain"},"expected":1.1,"tolerance":1e-09,"tags":[]},{"case_id":"protein_1","formula_id":"protein.ordinary_target","inputs":{"state":"normal","activity":"low","age":40,"goal":"maintain","weight_kg":70,"sex":"male"},"expected":0.9,"tolerance":1e-09,"tags":[]},{"case_id":"protein_2","formula_id":"protein.ordinary_target","inputs":{"state":"normal","activity":"moderate","age":40,"goal":"maintain","weight_kg":70,"sex":"male"},"expected":1.05,"tolerance":1e-09,"tags":[]},{"case_id":"protein_3","formula_id":"protein.ordinary_target","inputs":{"state":"normal","activity":"high","age":40,"goal":"lose","weight_kg":70,"sex":"male"},"expected":1.3,"tolerance":1e-09,"tags":[]},{"case_id":"protein_4","formula_id":"protein.ordinary_target","inputs":{"state":"rehab","activity":"moderate","age":40,"goal":"rehab_gain","weight_kg":70,"sex":"male"},"expected":1.3,"tolerance":1e-09,"tags":[]},{"case_id":"protein_5","formula_id":"protein.ordinary_target","inputs":{"state":"elderly","activity":"moderate","age":70,"goal":"maintain","weight_kg":70,"sex":"male"},"expected":1.2,"tolerance":1e-09,"tags":[]},{"case_id":"protein_6","formula_id":"protein.ordinary_target","inputs":{"state":"normal","activity":"low","age":70,"goal":"maintain","weight_kg":70,"sex":"male"},"expected":1.0,"tolerance":1e-09,"tags":[]},{"case_id":"fat_30pct_2000","formula_id":"macros.fat_share","inputs":{"energy_kcal":2000,"fat_percent":30},"expected":66.7,"tolerance":0.05,"tags":[]},{"case_id":"fat_25pct_1800","formula_id":"macros.fat_share","inputs":{"energy_kcal":1800,"fat_percent":25},"expected":50,"tolerance":0.05,"tags":[]},{"case_id":"carb_residual_standard","formula_id":"macros.carb_residual","inputs":{"energy_kcal":2000,"protein_g":100,"fat_g":66.7},"expected":249.9,"tolerance":0.1,"tags":[]},{"case_id":"carb_residual_floor","formula_id":"macros.carb_residual","inputs":{"energy_kcal":1000,"protein_g":200,"fat_g":50},"expected":0,"tolerance":0.01,"tags":[]},{"case_id":"fluid_70","formula_id":"fluids.ordinary_screen","inputs":{"fluid_ml_per_kg":30,"weight_kg":70},"expected":2100,"tolerance":1e-09,"tags":[]},{"case_id":"fluid_55","formula_id":"fluids.ordinary_screen","inputs":{"fluid_ml_per_kg":30,"weight_kg":55},"expected":1650,"tolerance":1e-09,"tags":[]},{"case_id":"split_four","formula_id":"meals.energy_split","inputs":{"daily_target":2000,"percentages":[25,35,30,10]},"expected":[500,700,600,200],"tolerance":1e-09,"tags":[]},{"case_id":"split_three","formula_id":"meals.energy_split","inputs":{"daily_target":1800,"percentages":[30,40,30]},"expected":[540,720,540],"tolerance":1e-09,"tags":[]},{"case_id":"nasem_adult_inactive","formula_id":"energy.nasem_adult_female_2023","inputs":{"pal":"inactive","age_years":30,"height_cm":165,"weight_kg":60},"expected":2021.0,"tolerance":1e-06,"tags":[]},{"case_id":"nasem_adult_low_active","formula_id":"energy.nasem_adult_female_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"weight_kg":60},"expected":2182.87,"tolerance":1e-06,"tags":[]},{"case_id":"nasem_adult_active","formula_id":"energy.nasem_adult_female_2023","inputs":{"pal":"active","age_years":30,"height_cm":165,"weight_kg":60},"expected":2319.45,"tolerance":1e-06,"tags":[]},{"case_id":"nasem_adult_very_active","formula_id":"energy.nasem_adult_female_2023","inputs":{"pal":"very_active","age_years":30,"height_cm":165,"weight_kg":60},"expected":2551.68,"tolerance":1e-06,"tags":[]},{"case_id":"preg_first","formula_id":"energy.nasem_pregnancy_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":62,"gestation_week":12,"prepreg_weight_kg":60},"expected":{"target":2207,"deposition":0,"trimester":1},"tolerance":1e-09,"tags":[]},{"case_id":"preg_under","formula_id":"energy.nasem_pregnancy_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":70,"gestation_week":24,"prepreg_weight_kg":48},"expected":{"target":2811,"deposition":300,"trimester":2},"tolerance":1e-09,"tags":[]},{"case_id":"preg_normal","formula_id":"energy.nasem_pregnancy_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":70,"gestation_week":24,"prepreg_weight_kg":60},"expected":{"target":2711,"deposition":200,"trimester":2},"tolerance":1e-09,"tags":[]},{"case_id":"preg_over","formula_id":"energy.nasem_pregnancy_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":75,"gestation_week":30,"prepreg_weight_kg":72},"expected":{"target":2767,"deposition":150,"trimester":3},"tolerance":1e-09,"tags":[]},{"case_id":"preg_obese","formula_id":"energy.nasem_pregnancy_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":85,"gestation_week":30,"prepreg_weight_kg":85},"expected":{"target":2669,"deposition":-50,"trimester":3},"tolerance":1e-09,"tags":[]},{"case_id":"lact_3_exclusive","formula_id":"energy.nasem_lactation_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":62,"postpartum_month":3,"feeding":"exclusive"},"expected":{"target":2611,"increment":404},"tolerance":1e-09,"tags":[]},{"case_id":"lact_8_partial","formula_id":"energy.nasem_lactation_2023","inputs":{"pal":"low_active","age_years":30,"height_cm":165,"current_weight_kg":62,"postpartum_month":8,"feeding":"partial"},"expected":{"target":2587,"increment":380},"tolerance":1e-09,"tags":[]},{"case_id":"scale_100_50","formula_id":"product.per100_scaling","inputs":{"per100_value":100,"grams":50},"expected":50.0,"tolerance":1e-09,"tags":[]},{"case_id":"scale_12.3_250","formula_id":"product.per100_scaling","inputs":{"per100_value":12.3,"grams":250},"expected":30.75,"tolerance":1e-09,"tags":[]},{"case_id":"scale_0_80","formula_id":"product.per100_scaling","inputs":{"per100_value":0,"grams":80},"expected":0.0,"tolerance":1e-09,"tags":[]},{"case_id":"salt_1g","formula_id":"product.salt_to_sodium","inputs":{"salt_g":1},"expected":393,"tolerance":1e-09,"tags":[]},{"case_id":"salt_2_5g","formula_id":"product.salt_to_sodium","inputs":{"salt_g":2.5},"expected":982.5,"tolerance":1e-09,"tags":[]},{"case_id":"sum_basic","formula_id":"ration.nutrient_sum","inputs":{"values":[10,20.5,0,3]},"expected":33.5,"tolerance":1e-09,"tags":[]},{"case_id":"sum_empty","formula_id":"ration.nutrient_sum","inputs":{"values":[]},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"per_mj_2000","formula_id":"norm.per_mj","inputs":{"energy_kcal":2000,"value_per_mj":0.1},"expected":0.84,"tolerance":1e-09,"tags":[]},{"case_id":"per_mj_2500","formula_id":"norm.per_mj","inputs":{"energy_kcal":2500,"value_per_mj":1.6},"expected":16.74,"tolerance":1e-09,"tags":[]},{"case_id":"pct_energy_fat","formula_id":"norm.percent_energy_to_grams","inputs":{"energy_kcal":2000,"percent":30,"kcal_per_g":9},"expected":66.67,"tolerance":1e-09,"tags":[]},{"case_id":"pct_energy_carb","formula_id":"norm.percent_energy_to_grams","inputs":{"energy_kcal":1800,"percent":50,"kcal_per_g":4},"expected":225,"tolerance":1e-09,"tags":[]},{"case_id":"efsa_preg_10","formula_id":"protein.efsa_pregnancy","inputs":{"prepreg_weight_kg":60,"gestation_week":10},"expected":50.8,"tolerance":1e-09,"tags":[]},{"case_id":"efsa_preg_20","formula_id":"protein.efsa_pregnancy","inputs":{"prepreg_weight_kg":60,"gestation_week":20},"expected":58.8,"tolerance":1e-09,"tags":[]},{"case_id":"efsa_preg_30","formula_id":"protein.efsa_pregnancy","inputs":{"prepreg_weight_kg":60,"gestation_week":30},"expected":77.8,"tolerance":1e-09,"tags":[]},{"case_id":"efsa_lact_3","formula_id":"protein.efsa_lactation","inputs":{"current_weight_kg":62,"postpartum_month":3},"expected":70.46000000000001,"tolerance":1e-09,"tags":[]},{"case_id":"efsa_lact_8","formula_id":"protein.efsa_lactation","inputs":{"current_weight_kg":62,"postpartum_month":8},"expected":64.46000000000001,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_fruits_total_zero","formula_id":"hei.adequacy_component","inputs":{"component":"fruits_total","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_fruits_total_mid","formula_id":"hei.adequacy_component","inputs":{"component":"fruits_total","density":0.4},"expected":2.5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_fruits_total_max","formula_id":"hei.adequacy_component","inputs":{"component":"fruits_total","density":0.8},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_fruits_whole_zero","formula_id":"hei.adequacy_component","inputs":{"component":"fruits_whole","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_fruits_whole_mid","formula_id":"hei.adequacy_component","inputs":{"component":"fruits_whole","density":0.2},"expected":2.5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_fruits_whole_max","formula_id":"hei.adequacy_component","inputs":{"component":"fruits_whole","density":0.4},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_vegetables_total_zero","formula_id":"hei.adequacy_component","inputs":{"component":"vegetables_total","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_vegetables_total_mid","formula_id":"hei.adequacy_component","inputs":{"component":"vegetables_total","density":0.55},"expected":2.5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_vegetables_total_max","formula_id":"hei.adequacy_component","inputs":{"component":"vegetables_total","density":1.1},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_greens_beans_zero","formula_id":"hei.adequacy_component","inputs":{"component":"greens_beans","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_greens_beans_mid","formula_id":"hei.adequacy_component","inputs":{"component":"greens_beans","density":0.1},"expected":2.5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_greens_beans_max","formula_id":"hei.adequacy_component","inputs":{"component":"greens_beans","density":0.2},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_grains_whole_zero","formula_id":"hei.adequacy_component","inputs":{"component":"grains_whole","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_grains_whole_mid","formula_id":"hei.adequacy_component","inputs":{"component":"grains_whole","density":0.75},"expected":5.0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_grains_whole_max","formula_id":"hei.adequacy_component","inputs":{"component":"grains_whole","density":1.5},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_dairy_zero","formula_id":"hei.adequacy_component","inputs":{"component":"dairy","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_dairy_mid","formula_id":"hei.adequacy_component","inputs":{"component":"dairy","density":0.65},"expected":5.0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_dairy_max","formula_id":"hei.adequacy_component","inputs":{"component":"dairy","density":1.3},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_protein_total_zero","formula_id":"hei.adequacy_component","inputs":{"component":"protein_total","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_protein_total_mid","formula_id":"hei.adequacy_component","inputs":{"component":"protein_total","density":1.25},"expected":2.5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_protein_total_max","formula_id":"hei.adequacy_component","inputs":{"component":"protein_total","density":2.5},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_seafood_plant_zero","formula_id":"hei.adequacy_component","inputs":{"component":"seafood_plant","density":0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_seafood_plant_mid","formula_id":"hei.adequacy_component","inputs":{"component":"seafood_plant","density":0.4},"expected":2.5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_adeq_seafood_plant_max","formula_id":"hei.adequacy_component","inputs":{"component":"seafood_plant","density":0.8},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_grains_refined_max","formula_id":"hei.moderation_component","inputs":{"component":"grains_refined","density":1.8},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_grains_refined_mid","formula_id":"hei.moderation_component","inputs":{"component":"grains_refined","density":3.05},"expected":5.0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_grains_refined_zero","formula_id":"hei.moderation_component","inputs":{"component":"grains_refined","density":4.3},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_sodium_g_max","formula_id":"hei.moderation_component","inputs":{"component":"sodium_g","density":1.1},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_sodium_g_mid","formula_id":"hei.moderation_component","inputs":{"component":"sodium_g","density":1.55},"expected":5.0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_sodium_g_zero","formula_id":"hei.moderation_component","inputs":{"component":"sodium_g","density":2.0},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_added_sugars_pct_max","formula_id":"hei.moderation_component","inputs":{"component":"added_sugars_pct","density":6.5},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_added_sugars_pct_mid","formula_id":"hei.moderation_component","inputs":{"component":"added_sugars_pct","density":16.25},"expected":5.0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_added_sugars_pct_zero","formula_id":"hei.moderation_component","inputs":{"component":"added_sugars_pct","density":26},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_sat_fats_pct_max","formula_id":"hei.moderation_component","inputs":{"component":"sat_fats_pct","density":8},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_sat_fats_pct_mid","formula_id":"hei.moderation_component","inputs":{"component":"sat_fats_pct","density":12.0},"expected":5.0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_mod_sat_fats_pct_zero","formula_id":"hei.moderation_component","inputs":{"component":"sat_fats_pct","density":16},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_fat_ratio_zero","formula_id":"hei.fatty_acid_ratio","inputs":{"ratio":1.2},"expected":0,"tolerance":1e-09,"tags":[]},{"case_id":"hei_fat_ratio_mid","formula_id":"hei.fatty_acid_ratio","inputs":{"ratio":1.85},"expected":5,"tolerance":1e-09,"tags":[]},{"case_id":"hei_fat_ratio_max","formula_id":"hei.fatty_acid_ratio","inputs":{"ratio":2.5},"expected":10,"tolerance":1e-09,"tags":[]},{"case_id":"hei_density_basic","formula_id":"hei.density","inputs":{"component_amount":2,"energy_ref_kcal":2000},"expected":1,"tolerance":1e-09,"tags":[]},{"case_id":"hei_density_1500","formula_id":"hei.density","inputs":{"component_amount":1.2,"energy_ref_kcal":1500},"expected":0.8,"tolerance":1e-09,"tags":[]},{"case_id":"hei_total_perfect","formula_id":"hei.total","inputs":{"component_points":[5,5,5,5,10,10,5,5,10,10,10,10,10]},"expected":100,"tolerance":1e-09,"tags":[]},{"case_id":"hei_total_zero","formula_id":"hei.total","inputs":{"component_points":[0,0,0,0,0,0,0,0,0,0,0,0,0]},"expected":0,"tolerance":1e-09,"tags":[]}]};
var byId=Object.create(null);registry.formulas.forEach(function(f){byId[f.id]=f;});
function ids(list){return (list||[]).filter(function(id){return !!byId[id];});}
function audit(idsList){var clean=ids(idsList);return Object.freeze({registryVersion:registry.registry_version,registrySha256:'0c76dd35635cf8decade487e24d7556fba556251b048415f27c8a4c3f32c60c4',formulaIds:Object.freeze(clean.slice()),formulas:Object.freeze(clean.map(function(id){return byId[id];}))});}
window.NutritionFormulaRegistryP14=Object.freeze({version:registry.registry_version,sourceSha256:'0c76dd35635cf8decade487e24d7556fba556251b048415f27c8a4c3f32c60c4',data:registry,golden:golden,get:function(id){return byId[id]||null;},ids:ids,audit:audit});
})();

/* Generated product provenance registry; do not edit. */
(function(w){'use strict';w.__PRODUCT_PROVENANCE_REGISTRY__={"schema_version":1,"registry_version":"v5.3.210-p1.3","generated_at":"2026-07-18T00:00:00Z","policy_path":"config/product-provenance-policy.v5.3.210-p1.3.json","source_registry_path":"config/product-source-registry.v5.3.210-p1.3.json","baseline_version":"v5.3.190","products_count":1105,"nutrient_fields":["kcal","protein_per_100g","fat_per_100g","carbs_per_100g","sugar_per_100g","fiber_per_100g","sfa","unsat","added_sugar","salt","calcium_mg","iron_mg","magnesium_mg","phosphorus_mg","potassium_mg","sodium_mg","zinc_mg","copper_mg","manganese_mg","selenium_ug","vitamin_a_mcg","vitamin_e_mg","vitamin_d_mcg","vitamin_c_mg","vitamin_b1_mg","vitamin_b2_mg","vitamin_b3_mg","vitamin_b5_mg","vitamin_b6_mg","vitamin_b9_mcg","vitamin_b12_mcg","choline_mg","vitamin_k_mcg"],"method_relative_uncertainty":{"MEASURED":0.05,"LABEL":0.1,"CALCULATED":0.15,"BORROWED":0.25,"IMPUTED":0.35,"SOURCE_REPORTED_ZERO":0.03,"ASSUMED_ZERO":1.0,"MISSING":1.0},"statistics":{"products":1105,"source_kinds":{"BORROWED_PROXY":289,"DERIVED_MODEL":116,"MIXED_SOURCE":275,"OFFICIAL_LABEL":54,"PRIMARY_DATASET":263,"RECIPE_MODEL":108},"confidence_tiers":{"HIGH":263,"LOW":28,"MEDIUM":814},"review_statuses":{"CONDITIONALLY_ACCEPTED":818,"REVIEW_REQUIRED":28,"VERIFIED":259},"nutrient_methods":{"ASSUMED_ZERO":3577,"BORROWED":13465,"CALCULATED":3387,"IMPUTED":4099,"LABEL":3228,"MEASURED":7468,"SOURCE_REPORTED_ZERO":1241},"issues":{"ENERGY_MACRO_FORMULA_NOT_APPLICABLE":8,"LABEL_WITHOUT_STABLE_REFERENCE":34},"assumed_zero_products":775,"assumed_zero_fields":3577},"chunks":[{"json":"data/products.v5.3.210-p1.3.part-01.json","script":"assets/data/products.v5.3.210-p1.3.part-01.js","count":143,"json_bytes":863442,"json_sha256":"d60333af065558052b401f14abfc28d9d7b1a7e21c86f33161952f544da0b750","script_bytes":863617,"script_sha256":"ade3b3b1498a8b4a0edc0281b353632055c970fcc6f329dfebe35d15901eca41"},{"json":"data/products.v5.3.210-p1.3.part-02.json","script":"assets/data/products.v5.3.210-p1.3.part-02.js","count":101,"json_bytes":797284,"json_sha256":"59ecd8f1ba4d02cef0c25ea1353e2ccc43a95cca0776c0a37e3779bc49d718a9","script_bytes":797459,"script_sha256":"2df07070f2ea2fd52883f08c7f0c5b664f48368530eba6ab4b0d9c9016cc983f"},{"json":"data/products.v5.3.210-p1.3.part-03.json","script":"assets/data/products.v5.3.210-p1.3.part-03.js","count":139,"json_bytes":867197,"json_sha256":"b84f337f691c724f1aabdcc47232df1541d756b28500a9f9acc6d1622000c0e9","script_bytes":867372,"script_sha256":"748461bae95f29a59c2228ee5697656dab2e629b894e15e343e7a4c59ecab0f7"},{"json":"data/products.v5.3.210-p1.3.part-04.json","script":"assets/data/products.v5.3.210-p1.3.part-04.js","count":119,"json_bytes":830988,"json_sha256":"c6b8927f0998febf1b65b5ae8fe3dd0a9a2ea22849dd310bb79ae3b57d8d882a","script_bytes":831163,"script_sha256":"fd7ab84b46b6d0b7581cf4930f41953a84e9756baac4e6786c663dfd4cc33060"},{"json":"data/products.v5.3.210-p1.3.part-05.json","script":"assets/data/products.v5.3.210-p1.3.part-05.js","count":63,"json_bytes":745583,"json_sha256":"2707db503bb849007d03e2586f387aa74093ef9824a61a1b9d21a47621701232","script_bytes":745758,"script_sha256":"b3b95cfb5054ce170e929613aa3946be26c7dffc8c6996ffbd91d66807c6e92a"},{"json":"data/products.v5.3.210-p1.3.part-06.json","script":"assets/data/products.v5.3.210-p1.3.part-06.js","count":62,"json_bytes":746232,"json_sha256":"0f19812d8027db5636357065a1cfb2482268e0fc80799e95274d08a96c6ddf40","script_bytes":746407,"script_sha256":"8370d545eb46f960cda9853428b8c51803439b8dd13c99fdac6e23879d280463"},{"json":"data/products.v5.3.210-p1.3.part-07.json","script":"assets/data/products.v5.3.210-p1.3.part-07.js","count":49,"json_bytes":706965,"json_sha256":"d6f0e4d97421eb010ade2ec8bc27735d6000f9a42c85fa32248a82fbc80ce5d9","script_bytes":707140,"script_sha256":"7f3619751906ed6aa619839b836c8e6ca933af03289f0be9c248371776a96c39"},{"json":"data/products.v5.3.210-p1.3.part-08.json","script":"assets/data/products.v5.3.210-p1.3.part-08.js","count":139,"json_bytes":882782,"json_sha256":"bb512e383923cdba5cab75a27e0cfb26d1974ed9676c1aa28a1323d1372b60d4","script_bytes":882957,"script_sha256":"852fb50458994fb305c52480f2d16cca195a509986995d7dd908fa2fc327be7b"},{"json":"data/products.v5.3.210-p1.3.part-09.json","script":"assets/data/products.v5.3.210-p1.3.part-09.js","count":72,"json_bytes":763036,"json_sha256":"0f9e1e714fe8ed225f4039c929ba4f1b46dd3adf8eccfa122d5f49cf14ebf120","script_bytes":763211,"script_sha256":"a661df129938b83bcdb1b9b5735f2ff79d4badcf2910a25dfc18f81a627233bc"},{"json":"data/products.v5.3.210-p1.3.part-10.json","script":"assets/data/products.v5.3.210-p1.3.part-10.js","count":134,"json_bytes":860053,"json_sha256":"8e965bd181990f380115e4b539cbe263bd1ded672577ebb6755273ee33ef6112","script_bytes":860229,"script_sha256":"651288aa33fe8c2dc2b0e9f0e7f527b480e46cfb9dcd23dadf37e646777d5d2c"},{"json":"data/products.v5.3.210-p1.3.part-11.json","script":"assets/data/products.v5.3.210-p1.3.part-11.js","count":79,"json_bytes":627371,"json_sha256":"48a66dfe33e1edbb2d1e054aee2d5416947fcaf8c767077aa925e83db4fbfcc4","script_bytes":627548,"script_sha256":"f6eab8396a30d5bd46c379f6fe10e074df13f7d2d5d7b7606cb1ef6865c22207"},{"json":"data/products.v5.3.210-p1.3.part-12.json","script":"assets/data/products.v5.3.210-p1.3.part-12.js","count":5,"json_bytes":33446,"json_sha256":"abd780d652fc97b96a1732fb2054caf3b705bbfbe02e05cb51cc004e060a9bcc","script_bytes":33623,"script_sha256":"3c68ebbea4029a4eb328230546b28f5beb54d733af4bf8533c05465ef055035b"}],"sources":[{"id":"USDA_FDC","name":"USDA FoodData Central","authority":"USDA Agricultural Research Service","kind":"PRIMARY_DATASET","official_url":"https://fdc.nal.usda.gov/","data_url":"https://fdc.nal.usda.gov/download-datasets","version_policy":"Record the FDC data type, download release or access date, and concrete FDC ID.","priority":1},{"id":"USDA_FNDDS","name":"Food and Nutrient Database for Dietary Studies","authority":"USDA Agricultural Research Service","kind":"PRIMARY_DATASET","official_url":"https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/food-surveys-research-group/docs/fndds/","version_policy":"Record the exact survey release and FNDDS food code or linked FDC ID.","priority":1},{"id":"USDA_FPED","name":"Food Patterns Equivalents Database","authority":"USDA Agricultural Research Service","kind":"PRIMARY_DATASET","official_url":"https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/food-surveys-research-group/docs/fped-databases/","version_policy":"FPED/FPID release must match the associated FNDDS/WWEIA release.","priority":1},{"id":"ANSES_CIQUAL","name":"ANSES-CIQUAL food composition table","authority":"ANSES","kind":"PRIMARY_DATASET","official_url":"https://ciqual.anses.fr/","version_policy":"Record CIQUAL edition and food item identifier; current registry reference is the 2025 table.","priority":2},{"id":"UK_COFID","name":"Composition of Foods Integrated Dataset","authority":"UK public health food composition programme","kind":"PRIMARY_DATASET","official_url":"https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid","version_policy":"Record the published CoFID edition and food code; registry reference is the 2021 update.","priority":2},{"id":"FRIDA","name":"Frida food composition databank","authority":"Technical University of Denmark food data service","kind":"PRIMARY_DATASET","official_url":"https://frida.fooddata.dk/data?lang=en","version_policy":"Record download/access date and concrete food identifier.","priority":2},{"id":"MATVARETABELLEN","name":"Norwegian Food Composition Table","authority":"Norwegian Food Safety Authority","kind":"PRIMARY_DATASET","official_url":"https://www.matvaretabellen.no/en/","data_url":"https://www.matvaretabellen.no/en/api/","version_policy":"Record annual table edition or retrieval date and concrete food identifier; registry reference updated January 2026.","priority":2},{"id":"NZFCD","name":"New Zealand Food Composition Database FOODfiles","authority":"Plant & Food Research and New Zealand Ministry of Health","kind":"PRIMARY_DATASET","official_url":"https://www.foodcomposition.co.nz/foodfiles","version_policy":"Record FOODfiles release and concrete food record; registry reference is FOODfiles 2024.","priority":2},{"id":"OFFICIAL_LABEL","name":"Manufacturer or retailer nutrition declaration","authority":"Named manufacturer or retailer","kind":"OFFICIAL_LABEL","version_policy":"Capture product/SKU, market, URL or image reference, declared basis, and access date.","priority":3},{"id":"INTERNAL_RECIPE_MODEL","name":"Source-backed recipe calculation","authority":"Nutrition calculator governed model","kind":"RECIPE_MODEL","version_policy":"Record ingredient source IDs, mass fractions, yield/retention assumptions and model version.","priority":4},{"id":"INTERNAL_PROXY_MODEL","name":"Declared proxy or imputation model","authority":"Nutrition calculator governed model","kind":"BORROWED_PROXY","version_policy":"Record donor product/source, matching rationale, adjusted fields, uncertainty and review owner.","priority":5}]};})(window);

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
function labelCatalog(key) {
    const k = String(key || 'other');
    const rawMapped = CATALOG_RU[k] || '';
    const mapped = (typeof MAP_BY_CATEGORY !== 'undefined' && MAP_BY_CATEGORY[k]) ||
                   (typeof MAP_BY_HEI !== 'undefined' && MAP_BY_HEI[k]) || '';
    return rawMapped || CATALOG_RU[mapped] || HEI_RU[k] || HEI_RU[mapped] || 'Другое';
  }
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
const MICRO_LIMITS = (window.NutritionNormativeRegistry && typeof window.NutritionNormativeRegistry.getMicroLimitsMap === 'function')
    ? window.NutritionNormativeRegistry.getMicroLimitsMap() : {};
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
function rationForCalculationV5377(ration){
  try {
    const api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377 || window.CompositeFoodDecomposerV5376;
    if (api && typeof api.flattenForCalculation === 'function') return api.flattenForCalculation(ration || []);
    if (api && typeof api.flattenCompositeForCalculation === 'function') return api.flattenCompositeForCalculation(ration || []);
  } catch(_) {}
  return Array.isArray(ration) ? ration : [];
}
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
function isCompositeEntryV5377(entry){
  return !!(entry && (entry.entry_type === 'composite_food' || (entry.children && Array.isArray(entry.children))));
}
const ACTIVE_NUTRIENT_LIMITS = MICRO_LIMITS;
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
    const engine = window.ProductDataQualityV13;
    if (engine && typeof engine.classifyProduct === 'function') {
      const tier = String((engine.classifyProduct(p) || {}).tier || '').toLowerCase();
      return tier === 'high' || tier === 'medium' || tier === 'low' ? tier : 'unknown';
    }
    return 'unknown';
  }
function sourceQualityV53155(ration){
    const clean = rationForNutrientCalculationV53107(ration || []);
    const engine = window.ProductDataQualityV13;
    if (engine && typeof engine.productSummary === 'function') return engine.productSummary(clean, DB);
    const out = { total:0, high:0, medium:0, low:0, unknown:0, usable:0, pct:0, score:0, tier:'LOW', label:'нет продуктов' };
    for (const it of clean) {
      const p = DB.byKey.get(it && it.key); if (!p) continue;
      out.total += 1; const cls = productSourceClassV53155(p); out[cls] += 1;
    }
    out.usable = out.high + out.medium; out.pct = out.total ? out.usable / out.total * 100 : 0;
    out.label = !out.total ? 'нет продуктов' : (out.low ? 'есть источники, требующие проверки' : (out.medium ? 'часть данных модельные или proxy' : 'высокая достоверность'));
    return out;
  }
const CalculationCoreV53155 = Object.freeze({
    version:'v5.3.210-p1.4-calculation-core',
    formulaRegistryVersion:(window.NutritionFormulaRegistryP14&&window.NutritionFormulaRegistryP14.version)||null,
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
        version:'v5.3.210-p1.4-calculation-core', formulaAudit:(window.NutritionFormulaRegistryP14?window.NutritionFormulaRegistryP14.audit(['product.per100_scaling','product.salt_to_sodium','ration.nutrient_sum']):null), rawRation:raw,
        nutrientRation:rationForNutrientCalculationV53107(raw), foodPatternRation:rationForCalculationV5377(raw),
        totals:computed.t, items:computed.items, sourceQuality:sourceQualityV53155(raw),
        dataQuality:(window.ProductDataQualityV13 && typeof window.ProductDataQualityV13.analyzeRation === 'function') ? window.ProductDataQualityV13.analyzeRation(rationForNutrientCalculationV53107(raw), DB) : null
      });
    }
  });
  window.DB = DB;
  window.__resolveMicroLimitsForQA = (key, selectedRegion, age, sex) => {
    const context = { age, sex, energyKcal: window.NeedsNormSyncV53155?.selectedEnergy() || null };
    return window.NutritionNormativeRegistry.resolveMicro(key, selectedRegion, context);
  };
  /* v5.3.210-p1.3 — product provenance, nutrient confidence and uncertainty runtime. ES5-safe. */
(function(w){'use strict';
var VERSION='v5.3.210-p1.3';
var DEFAULT_UNCERTAINTY={MEASURED:0.05,LABEL:0.10,CALCULATED:0.15,BORROWED:0.25,IMPUTED:0.35,SOURCE_REPORTED_ZERO:0.03,ASSUMED_ZERO:1.0,MISSING:1.0};
var FIELD_ALIASES={protein:'protein_per_100g',protein_g:'protein_per_100g',fat:'fat_per_100g',fat_g:'fat_per_100g',carbs:'carbs_per_100g',carbs_g:'carbs_per_100g',sugar:'sugar_per_100g',sugar_g:'sugar_per_100g',fiber:'fiber_per_100g',fiber_g:'fiber_per_100g',sfa_g:'sfa',unsaturated_fat_g:'unsat',added_sugars_g:'added_sugar',salt_g:'salt',selenium_mcg:'selenium_ug',vitamin_a_mcg_rae:'vitamin_a_mcg',folate_mcg:'vitamin_b9_mcg'};
function num(v,d){v=Number(v);return isFinite(v)?v:(d||0);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function quality(p){return p&&p.data_quality_v1_3&&typeof p.data_quality_v1_3==='object'?p.data_quality_v1_3:null;}
function groups(p){return p&&p.nutrient_provenance_v1_3&&typeof p.nutrient_provenance_v1_3==='object'?p.nutrient_provenance_v1_3:{};}
function fieldName(key){key=String(key||'');return FIELD_ALIASES[key]||key;}
function methodFor(p,key){var f=fieldName(key),g=groups(p),m,arr,i;for(m in g){if(!Object.prototype.hasOwnProperty.call(g,m))continue;arr=g[m];if(!Array.isArray(arr))continue;for(i=0;i<arr.length;i++)if(arr[i]===f)return m;}return 'MISSING';}
function methodUncertainty(method){var reg=w.__PRODUCT_PROVENANCE_REGISTRY__,map=reg&&reg.method_relative_uncertainty;return num(map&&map[method],DEFAULT_UNCERTAINTY[method]==null?1:DEFAULT_UNCERTAINTY[method]);}
function productScore(p,key){var q=quality(p),base=q?num(q.confidence_score,0.25):0.25;if(key){var method=methodFor(p,key),methodScore=1-methodUncertainty(method);if(method==='ASSUMED_ZERO'||method==='MISSING')methodScore=0.15;base=Math.min(base,methodScore);}return clamp(base,0,1);}
function tierForScore(score){return score>=0.82?'HIGH':(score>=0.55?'MEDIUM':'LOW');}
function classifyProduct(p){var q=quality(p),score=productScore(p);return {tier:q&&q.confidence_tier||tierForScore(score),score:score,source_kind:q&&q.source_kind||'UNRESOLVED',review_status:q&&q.review_status||'REVIEW_REQUIRED',issues:q&&Array.isArray(q.issues)?q.issues.slice():[]};}
function resolve(db,key){if(!db)return null;if(db.byKey&&typeof db.byKey.get==='function')return db.byKey.get(key)||null;if(typeof db.get==='function')return db.get(key)||null;if(db[key])return db[key];if(Array.isArray(db.items)){for(var i=0;i<db.items.length;i++)if(db.items[i]&&db.items[i].key===key)return db.items[i];}return null;}
function productSummary(ration,db){var out={total:0,high:0,medium:0,low:0,unknown:0,verified:0,conditional:0,review_required:0,blocked:0,assumed_zero_products:0,assumed_zero_fields:0,weighted_score:0,weight_total:0,usable:0,pct:0,score:0,tier:'LOW',label:'нет продуктов',version:VERSION};ration=Array.isArray(ration)?ration:[];for(var i=0;i<ration.length;i++){var it=ration[i]||{},p=resolve(db,it.key);if(!p)continue;var c=classifyProduct(p),weight=Math.max(1,num(it.grams,0));out.total++;if(c.tier==='HIGH')out.high++;else if(c.tier==='MEDIUM')out.medium++;else out.low++;if(c.review_status==='VERIFIED')out.verified++;else if(c.review_status==='CONDITIONALLY_ACCEPTED')out.conditional++;else if(c.review_status==='BLOCKED')out.blocked++;else out.review_required++;var zeros=Array.isArray(p.unknown_zero_fields_v1_3)?p.unknown_zero_fields_v1_3.length:0;if(zeros){out.assumed_zero_products++;out.assumed_zero_fields+=zeros;}out.weighted_score+=c.score*weight;out.weight_total+=weight;}out.usable=out.high+out.medium;out.pct=out.total?out.usable/out.total*100:0;out.score=out.weight_total?out.weighted_score/out.weight_total:0;out.tier=tierForScore(out.score);out.label=!out.total?'нет продуктов':(out.blocked?'есть заблокированные карточки':(out.review_required?'есть карточки, требующие проверки':(out.low?'часть данных низкой достоверности':(out.medium?'часть данных модельные или proxy':'высокая достоверность'))));delete out.weighted_score;delete out.weight_total;return out;}
function nutrientAnalysis(ration,db,key){var field=fieldName(key),sum=0,rss=0,weighted=0,absWeight=0,assumed=0,missing=0,methods={},items=0;ration=Array.isArray(ration)?ration:[];for(var i=0;i<ration.length;i++){var it=ration[i]||{},p=resolve(db,it.key);if(!p)continue;var grams=Math.max(0,num(it.grams,0)),raw=p[field],method=methodFor(p,field);methods[method]=(methods[method]||0)+1;if(method==='ASSUMED_ZERO')assumed++;if(method==='MISSING'||typeof raw!=='number'||!isFinite(raw)){missing++;continue;}var value=raw*grams/100,rel=methodUncertainty(method),score=productScore(p,field);sum+=value;rss+=Math.pow(Math.abs(value)*rel,2);weighted+=Math.abs(value)*score;absWeight+=Math.abs(value);items++;}
var abs=Math.sqrt(rss),score=absWeight?weighted/absWeight:(assumed||missing?0.15:1);if(assumed)score=Math.min(score,clamp(1-assumed/Math.max(1,items+assumed)*0.7,0.15,1));if(missing)score=Math.min(score,0.2);return {key:key,field:field,value:sum,uncertainty_abs:abs,uncertainty_relative:sum?abs/Math.abs(sum):0,confidence_score:clamp(score,0,1),confidence_tier:tierForScore(score),assumed_zero_products:assumed,missing_products:missing,method_counts:methods};}
function analyzeRation(ration,db,keys){var summary=productSummary(ration,db),out={version:VERSION,summary:summary,nutrients:{}};keys=Array.isArray(keys)&&keys.length?keys:['kcal','protein','fat','carbs','fiber','sodium_mg','sfa','calcium_mg','iron_mg','magnesium_mg','potassium_mg','vitamin_d_mcg','vitamin_b9_mcg','vitamin_b12_mcg'];for(var i=0;i<keys.length;i++)out.nutrients[keys[i]]=nutrientAnalysis(ration,db,keys[i]);return out;}
function describePrecision(p,key){var method=methodFor(p,key),score=productScore(p,key),tier=tierForScore(score);return {method:method,score:score,tier:tier,may_state_exact_value:tier==='HIGH'&&method!=='ASSUMED_ZERO'&&method!=='MISSING',wording:tier==='HIGH'?'оценка высокой достоверности':(tier==='MEDIUM'?'приближённая оценка':'ориентировочная оценка; требуется проверка')};}
var api={version:VERSION,fieldName:fieldName,methodFor:methodFor,methodUncertainty:methodUncertainty,productScore:productScore,classifyProduct:classifyProduct,productSummary:productSummary,nutrientAnalysis:nutrientAnalysis,analyzeRation:analyzeRation,describePrecision:describePrecision};
try{if(Object.freeze)Object.freeze(api);}catch(_){}w.ProductDataQualityV13=api;
})(window);

window.__COMPOSITE_FOOD_MODELS_V5_3_144__ = {"schema_version":"v5.3.145","module":"CompositeFoodDecomposer + v5.3.143 composite decomposition consolidation","created_at":"2026-07-12","purpose_ru":"Единый реестр последних моделей и трёх составных продуктов второй волны; корневые HEI-поля отключены, расчёт идёт по редактируемым компонентам.","reverse_recipe_estimator":{"method":"typical_recipe_grams_to_component_sum","confidence_levels":["HIGH","MEDIUM","MEDIUM_LOW","LOW"],"do_not_overstate_precision":true},"dish_archetypes":{"mayonnaise_salad":{"guardrail_ru":"Майонез, солёные компоненты, ветчину/копчёности/яичные блинчики/орехи/сухофрукты не прятать в овощной или белковой группе."},"seafood_salad":{"guardrail_ru":"Тунец, кальмар, креветки и заправки считать отдельно; не считать монолитом."}},"models":[{"root_key":"ladies_caprice_chicken_prune_salad_homemade","model_key":"ladies_caprice_chicken_prune_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_ladies_caprice_chicken_prune","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"chicken_breast_cooked","name_ru":"Куриная грудка, запечённая (без кожи)","role":"plain_cooked_chicken","g_per_100g":22.0,"processing_context_v5_3_93":"plain_poultry_component","quality_route_v5_3_93":"ordinary poultry protein component"},{"key":"prunes","name_ru":"Чернослив","role":"prunes_dried_fruit","g_per_100g":12.0,"processing_context_v5_3_93":"dried_fruit_component","quality_route_v5_3_93":"whole fruit/dried fruit sugars separated"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":15.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"boiled_egg","g_per_100g":18.0,"processing_context_v5_3_93":"egg_component"},{"key":"cheese_russian","name_ru":"Сыр Российский","role":"cheese_dairy_sfa_sodium_context","g_per_100g":12.0,"processing_context_v5_3_93":"dairy_cheese_component","quality_route_v5_3_93":"cheese dairy + saturated fat + sodium context"},{"key":"walnuts","name_ru":"Грецкие орехи","role":"walnuts","g_per_100g":6.0,"processing_context_v5_3_93":"nuts_unsaturated_fat_context"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":15.0,"processing_context_v5_3_93":"mayonnaise_dressing","quality_route_v5_3_93":"added fat/SFA/sodium context; not vegetable or dairy adequacy credit"}],"source_ingredients_ru":["Куриная грудка, запечённая (без кожи)","Чернослив","Огурцы (сырые)","Яйцо куриное, сваренное вкрутую","Сыр Российский","Грецкие орехи","Майонез, классический"],"ingredient_to_hei_channels":{"chicken_breast_cooked":["protein_foods","sodium","sfa"],"prunes":["fruits","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"cheese_russian":["dairy","sodium","sfa"],"walnuts":["protein_foods","seafood_plant_protein","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":279.36,"protein_per_100g":13.501,"fat_per_100g":21.174,"carbs_per_100g":9.5835,"sugar_per_100g":5.5365,"fiber_per_100g":1.329,"added_sugar":0.0855,"sfa":5.0576,"unsat":15.11,"salt":0.5913,"sodium_mg":232.79,"calcium_mg":110.94,"iron_mg":0.8309,"magnesium_mg":28.16,"phosphorus_mg":182.43,"potassium_mg":232.87,"zinc_mg":1.1683,"copper_mg":0.1559,"manganese_mg":0.2564,"selenium_ug":14.076,"vitamin_a_mcg":55.83,"vitamin_e_mg":0.8637,"vitamin_d_mcg":0.508,"vitamin_c_mg":0.57,"vitamin_b1_mg":0.0628,"vitamin_b2_mg":0.1971,"vitamin_b3_mg":3.3418,"vitamin_b5_mg":0.6616,"vitamin_b6_mg":0.2282,"vitamin_b9_mcg":19.48,"vitamin_b12_mcg":0.4774,"choline_mg":83.296,"vitamin_k_mcg":34.608,"fruit_cup_eq_per_100g":0.3,"whole_fruit_cup_eq_per_100g":0.3,"veg_cup_eq_per_100g":0.1154,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.2857,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.5646,"seafood_plant_oz_eq_per_100g":0.4286,"added_sugars_tsp_eq_per_100g":0.0204,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":279.36,"protein_per_100g":13.501,"fat_per_100g":21.174,"carbs_per_100g":9.5835,"sugar_per_100g":5.5365,"fiber_per_100g":1.329,"added_sugar":0.0855,"sfa":5.0576,"unsat":15.11,"salt":0.5913,"sodium_mg":232.79,"calcium_mg":110.94,"iron_mg":0.8309,"magnesium_mg":28.16,"phosphorus_mg":182.43,"potassium_mg":232.87,"zinc_mg":1.1683,"copper_mg":0.1559,"manganese_mg":0.2564,"selenium_ug":14.076,"vitamin_a_mcg":55.83,"vitamin_e_mg":0.8637,"vitamin_d_mcg":0.508,"vitamin_c_mg":0.57,"vitamin_b1_mg":0.0628,"vitamin_b2_mg":0.1971,"vitamin_b3_mg":3.3418,"vitamin_b5_mg":0.6616,"vitamin_b6_mg":0.2282,"vitamin_b9_mcg":19.48,"vitamin_b12_mcg":0.4774,"choline_mg":83.296,"vitamin_k_mcg":34.608,"fruit_cup_eq_per_100g":0.3,"whole_fruit_cup_eq_per_100g":0.3,"veg_cup_eq_per_100g":0.1154,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.2857,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.5646,"seafood_plant_oz_eq_per_100g":0.4286,"added_sugars_tsp_eq_per_100g":0.0204,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.3,"whole_fruit_cup_eq":0.3,"total_vegetables_cup_eq":0.1154,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.2857,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":1.5646,"seafood_and_plant_proteins_oz_eq":0.4286,"added_sugars_tsp_eq":0.0204,"sodium_mg":232.79,"saturated_fat_g":5.0576,"fatty_acids_unsat_to_sfa_ratio":2.9876},"source_url":"recipe-model://homemade-salads/ladies-caprice-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"birch_chicken_prune_mushroom_salad_homemade","model_key":"birch_chicken_prune_mushroom_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_birch_chicken_prune_mushroom","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"chicken_breast_cooked","name_ru":"Куриная грудка, запечённая (без кожи)","role":"plain_cooked_chicken","g_per_100g":20.0,"processing_context_v5_3_93":"plain_poultry_component"},{"key":"mushroom_white_boiled","name_ru":"Шампиньоны отварные","role":"mushrooms","g_per_100g":18.0,"processing_context_v5_3_93":"mushroom_component"},{"key":"prunes","name_ru":"Чернослив","role":"prunes_dried_fruit","g_per_100g":10.0,"processing_context_v5_3_93":"dried_fruit_component"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":14.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"boiled_egg","g_per_100g":16.0,"processing_context_v5_3_93":"egg_component"},{"key":"onion_yellow_raw","name_ru":"Лук репчатый жёлтый (сырой)","role":"onion","g_per_100g":5.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":17.0,"processing_context_v5_3_93":"mayonnaise_dressing","quality_route_v5_3_93":"added fat/SFA/sodium context; not vegetable or dairy adequacy credit"}],"source_ingredients_ru":["Куриная грудка, запечённая (без кожи)","Шампиньоны отварные","Чернослив","Огурцы (сырые)","Яйцо куриное, сваренное вкрутую","Лук репчатый жёлтый (сырой)","Майонез, классический"],"ingredient_to_hei_channels":{"chicken_breast_cooked":["protein_foods","sodium","sfa"],"mushroom_white_boiled":["vegetables","sodium","sfa"],"prunes":["fruits","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"onion_yellow_raw":["vegetables","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":206.68,"protein_per_100g":9.1428,"fat_per_100g":15.2676,"carbs_per_100g":8.5873,"sugar_per_100g":4.9553,"fiber_per_100g":1.261,"added_sugar":0.0969,"sfa":2.738,"unsat":11.7965,"salt":0.3648,"sodium_mg":143.63,"calcium_mg":21.13,"iron_mg":0.89,"magnesium_mg":16.15,"phosphorus_mg":104.06,"potassium_mg":239.92,"zinc_mg":0.6306,"copper_mg":0.1414,"manganese_mg":0.0701,"selenium_ug":13.078,"vitamin_a_mcg":32.36,"vitamin_e_mg":0.8264,"vitamin_d_mcg":0.442,"vitamin_c_mg":1.542,"vitamin_b1_mg":0.0505,"vitamin_b2_mg":0.1871,"vitamin_b3_mg":3.7626,"vitamin_b5_mg":0.9195,"vitamin_b6_mg":0.1904,"vitamin_b9_mcg":14.26,"vitamin_b12_mcg":0.266,"choline_mg":75.909,"vitamin_k_mcg":36.084,"fruit_cup_eq_per_100g":0.25,"whole_fruit_cup_eq_per_100g":0.25,"veg_cup_eq_per_100g":0.2846,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.0255,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0231,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":206.68,"protein_per_100g":9.1428,"fat_per_100g":15.2676,"carbs_per_100g":8.5873,"sugar_per_100g":4.9553,"fiber_per_100g":1.261,"added_sugar":0.0969,"sfa":2.738,"unsat":11.7965,"salt":0.3648,"sodium_mg":143.63,"calcium_mg":21.13,"iron_mg":0.89,"magnesium_mg":16.15,"phosphorus_mg":104.06,"potassium_mg":239.92,"zinc_mg":0.6306,"copper_mg":0.1414,"manganese_mg":0.0701,"selenium_ug":13.078,"vitamin_a_mcg":32.36,"vitamin_e_mg":0.8264,"vitamin_d_mcg":0.442,"vitamin_c_mg":1.542,"vitamin_b1_mg":0.0505,"vitamin_b2_mg":0.1871,"vitamin_b3_mg":3.7626,"vitamin_b5_mg":0.9195,"vitamin_b6_mg":0.1904,"vitamin_b9_mcg":14.26,"vitamin_b12_mcg":0.266,"choline_mg":75.909,"vitamin_k_mcg":36.084,"fruit_cup_eq_per_100g":0.25,"whole_fruit_cup_eq_per_100g":0.25,"veg_cup_eq_per_100g":0.2846,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.0255,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0231,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.25,"whole_fruit_cup_eq":0.25,"total_vegetables_cup_eq":0.2846,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":1.0255,"seafood_and_plant_proteins_oz_eq":0.0,"added_sugars_tsp_eq":0.0231,"sodium_mg":143.63,"saturated_fat_g":2.738,"fatty_acids_unsat_to_sfa_ratio":4.3084},"source_url":"recipe-model://homemade-salads/birch-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"ministerial_beef_egg_pancake_salad_homemade","model_key":"ministerial_beef_egg_pancake_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_ministerial_beef_egg_pancake","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"beef_lean_cooked","name_ru":"Говядина постная (верхняя часть бедра), запечённая","role":"plain_cooked_beef","g_per_100g":25.0,"processing_context_v5_3_93":"plain_meat_component","quality_route_v5_3_93":"ordinary cooked beef component; not processed meat"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"egg_pancake_egg_fraction","g_per_100g":18.0,"processing_context_v5_3_93":"egg_pancake_component"},{"key":"milk_3_2_pct","name_ru":"Молоко 3,2% жирности","role":"egg_pancake_milk_fraction","g_per_100g":8.0,"processing_context_v5_3_93":"dairy_in_pancake_batter"},{"key":"ap_flour","name_ru":"Мука пшеничная в/с (универсальная, без обогащения)","role":"egg_pancake_flour_fraction","g_per_100g":6.0,"processing_context_v5_3_93":"refined_flour_in_pancake_batter","quality_route_v5_3_93":"refined grain contribution separated"},{"key":"sunflower_oil_other","name_ru":"Масло подсолнечное, рафинированное","role":"oil_for_pancake_frying","g_per_100g":4.0,"processing_context_v5_3_93":"added_frying_oil"},{"key":"pickles_dill_other","name_ru":"Огурцы маринованные (солёные), без рассола","role":"pickled_cucumber","g_per_100g":10.0,"processing_context_v5_3_93":"pickled_vegetable_sodium_context"},{"key":"onion_yellow_raw","name_ru":"Лук репчатый жёлтый (сырой)","role":"onion","g_per_100g":5.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":23.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"added_salt","g_per_100g":1.0,"processing_context_v5_3_93":"added_salt_sodium_limiter"}],"source_ingredients_ru":["Говядина постная (верхняя часть бедра), запечённая","Яйцо куриное, сваренное вкрутую","Молоко 3,2% жирности","Мука пшеничная в/с (универсальная, без обогащения)","Масло подсолнечное, рафинированное","Огурцы маринованные (солёные), без рассола","Лук репчатый жёлтый (сырой)","Майонез, классический","Соль поваренная (хлорид натрия)"],"ingredient_to_hei_channels":{"beef_lean_cooked":["protein_foods","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"milk_3_2_pct":["dairy","sodium","sfa"],"ap_flour":["refined_grains","sodium","sfa"],"sunflower_oil_other":["sodium","sfa"],"pickles_dill_other":["sodium"],"onion_yellow_raw":["vegetables","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"table_salt_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":289.0,"protein_per_100g":11.0098,"fat_per_100g":24.4793,"carbs_per_100g":6.0147,"sugar_per_100g":1.0447,"fiber_per_100g":0.367,"added_sugar":0.1311,"sfa":4.2669,"unsat":19.3822,"salt":1.7789,"sodium_mg":700.34,"calcium_mg":28.63,"iron_mg":1.1071,"magnesium_mg":9.69,"phosphorus_mg":121.22,"potassium_mg":161.83,"zinc_mg":1.4929,"copper_mg":0.033,"manganese_mg":0.0598,"selenium_ug":14.844,"vitamin_a_mcg":35.08,"vitamin_e_mg":2.6942,"vitamin_d_mcg":0.442,"vitamin_c_mg":0.49,"vitamin_b1_mg":0.0474,"vitamin_b2_mg":0.1881,"vitamin_b3_mg":2.1708,"vitamin_b5_mg":0.4743,"vitamin_b6_mg":0.2362,"vitamin_b9_mcg":13.83,"vitamin_b12_mcg":0.7759,"choline_mg":83.506,"vitamin_k_mcg":39.997,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.0385,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0328,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.2116,"protein_oz_eq_per_100g":1.2418,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0312,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":289.0,"protein_per_100g":11.0098,"fat_per_100g":24.4793,"carbs_per_100g":6.0147,"sugar_per_100g":1.0447,"fiber_per_100g":0.367,"added_sugar":0.1311,"sfa":4.2669,"unsat":19.3822,"salt":1.7789,"sodium_mg":700.34,"calcium_mg":28.63,"iron_mg":1.1071,"magnesium_mg":9.69,"phosphorus_mg":121.22,"potassium_mg":161.83,"zinc_mg":1.4929,"copper_mg":0.033,"manganese_mg":0.0598,"selenium_ug":14.844,"vitamin_a_mcg":35.08,"vitamin_e_mg":2.6942,"vitamin_d_mcg":0.442,"vitamin_c_mg":0.49,"vitamin_b1_mg":0.0474,"vitamin_b2_mg":0.1881,"vitamin_b3_mg":2.1708,"vitamin_b5_mg":0.4743,"vitamin_b6_mg":0.2362,"vitamin_b9_mcg":13.83,"vitamin_b12_mcg":0.7759,"choline_mg":83.506,"vitamin_k_mcg":39.997,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.0385,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0328,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.2116,"protein_oz_eq_per_100g":1.2418,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0312,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.0385,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.0328,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.2116,"total_protein_foods_oz_eq":1.2418,"seafood_and_plant_proteins_oz_eq":0.0,"added_sugars_tsp_eq":0.0312,"sodium_mg":700.34,"saturated_fat_g":4.2669,"fatty_acids_unsat_to_sfa_ratio":4.5425},"source_url":"recipe-model://homemade-salads/ministerial-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"merchant_pork_pea_salad_homemade","model_key":"merchant_pork_pea_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_merchant_pork_green_pea","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"pork_tenderloin_cooked","name_ru":"Свинина, вырезка, запечённая (постная)","role":"plain_cooked_pork","g_per_100g":25.0,"processing_context_v5_3_93":"plain_pork_component","quality_route_v5_3_93":"ordinary cooked pork component; not processed meat"},{"key":"green_peas_frozen","name_ru":"Горошек зелёный замороженный (отварной)","role":"green_peas","g_per_100g":20.0,"processing_context_v5_3_93":"starchy_legume_vegetable_component"},{"key":"carrot_boiled","name_ru":"Морковь отварная","role":"boiled_carrot","g_per_100g":14.0,"processing_context_v5_3_93":"boiled_vegetable"},{"key":"pickles_dill_other","name_ru":"Огурцы маринованные (солёные), без рассола","role":"pickled_cucumber","g_per_100g":10.0,"processing_context_v5_3_93":"pickled_vegetable_sodium_context"},{"key":"onion_yellow_raw","name_ru":"Лук репчатый жёлтый (сырой)","role":"onion","g_per_100g":7.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":23.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"added_salt","g_per_100g":1.0,"processing_context_v5_3_93":"added_salt_sodium_limiter"}],"source_ingredients_ru":["Свинина, вырезка, запечённая (постная)","Горошек зелёный замороженный (отварной)","Морковь отварная","Огурцы маринованные (солёные), без рассола","Лук репчатый жёлтый (сырой)","Майонез, классический","Соль поваренная (хлорид натрия)"],"ingredient_to_hei_channels":{"pork_tenderloin_cooked":["protein_foods","sodium","sfa"],"green_peas_frozen":["vegetables","greens_beans","sodium","sfa"],"carrot_boiled":["vegetables","sodium","sfa"],"pickles_dill_other":["sodium"],"onion_yellow_raw":["vegetables","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"table_salt_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":216.65,"protein_per_100g":8.0342,"fat_per_100g":18.1877,"carbs_per_100g":5.0329,"sugar_per_100g":1.8881,"fiber_per_100g":1.559,"added_sugar":0.1311,"sfa":3.0064,"unsat":14.6535,"salt":1.7625,"sodium_mg":693.9,"calcium_mg":16.09,"iron_mg":0.7351,"magnesium_mg":15.19,"phosphorus_mg":95.11,"potassium_mg":188.55,"zinc_mg":0.8344,"copper_mg":0.0604,"manganese_mg":0.0945,"selenium_ug":10.442,"vitamin_a_mcg":144.36,"vitamin_e_mg":0.952,"vitamin_d_mcg":0.096,"vitamin_c_mg":3.122,"vitamin_b1_mg":0.3109,"vitamin_b2_mg":0.1312,"vitamin_b3_mg":2.2619,"vitamin_b5_mg":0.3765,"vitamin_b6_mg":0.242,"vitamin_b9_mcg":16.84,"vitamin_b12_mcg":0.1701,"choline_mg":37.65,"vitamin_k_mcg":45.936,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.3154,"greens_beans_cup_eq_per_100g":0.1176,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":0.8818,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0312,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":216.65,"protein_per_100g":8.0342,"fat_per_100g":18.1877,"carbs_per_100g":5.0329,"sugar_per_100g":1.8881,"fiber_per_100g":1.559,"added_sugar":0.1311,"sfa":3.0064,"unsat":14.6535,"salt":1.7625,"sodium_mg":693.9,"calcium_mg":16.09,"iron_mg":0.7351,"magnesium_mg":15.19,"phosphorus_mg":95.11,"potassium_mg":188.55,"zinc_mg":0.8344,"copper_mg":0.0604,"manganese_mg":0.0945,"selenium_ug":10.442,"vitamin_a_mcg":144.36,"vitamin_e_mg":0.952,"vitamin_d_mcg":0.096,"vitamin_c_mg":3.122,"vitamin_b1_mg":0.3109,"vitamin_b2_mg":0.1312,"vitamin_b3_mg":2.2619,"vitamin_b5_mg":0.3765,"vitamin_b6_mg":0.242,"vitamin_b9_mcg":16.84,"vitamin_b12_mcg":0.1701,"choline_mg":37.65,"vitamin_k_mcg":45.936,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.3154,"greens_beans_cup_eq_per_100g":0.1176,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":0.8818,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0312,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.3154,"greens_and_beans_cup_eq":0.1176,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":0.8818,"seafood_and_plant_proteins_oz_eq":0.0,"added_sugars_tsp_eq":0.0312,"sodium_mg":693.9,"saturated_fat_g":3.0064,"fatty_acids_unsat_to_sfa_ratio":4.8741},"source_url":"recipe-model://homemade-salads/merchant-pork-pea-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"tuna_egg_cucumber_corn_salad_homemade","model_key":"tuna_egg_cucumber_corn_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_tuna_egg_cucumber_corn","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"tuna_canned_water","name_ru":"Тунец консервированный в воде, без жидкости","role":"tuna_canned_water","g_per_100g":25.0,"processing_context_v5_3_93":"canned_seafood_component","quality_route_v5_3_93":"seafood/protein component with sodium context"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"boiled_egg","g_per_100g":20.0,"processing_context_v5_3_93":"egg_component"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":20.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"sweet_corn_kernels_boiled","name_ru":"Кукуруза сахарная (зёрна, отварная)","role":"sweet_corn","g_per_100g":15.0,"processing_context_v5_3_93":"starchy_vegetable_corn"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":15.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"green_onion_raw","name_ru":"Лук зелёный (перо, сырой)","role":"green_onion","g_per_100g":4.0,"processing_context_v5_3_93":"herb_vegetable_component"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"added_salt","g_per_100g":1.0,"processing_context_v5_3_93":"added_salt_sodium_limiter"}],"source_ingredients_ru":["Тунец консервированный в воде, без жидкости","Яйцо куриное, сваренное вкрутую","Огурцы (сырые)","Кукуруза сахарная (зёрна, отварная)","Майонез, классический","Лук зелёный (перо, сырой)","Соль поваренная (хлорид натрия)"],"ingredient_to_hei_channels":{"tuna_canned_water":["protein_foods","seafood_plant_protein","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"sweet_corn_kernels_boiled":["vegetables","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"green_onion_raw":["vegetables","greens_beans","sodium","sfa"],"table_salt_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":178.33,"protein_per_100g":9.7585,"fat_per_100g":13.7185,"carbs_per_100g":4.1265,"sugar_per_100g":1.202,"fiber_per_100g":0.564,"added_sugar":0.0855,"sfa":2.5241,"unsat":10.5451,"salt":1.4563,"sodium_mg":573.34,"calcium_mg":19.97,"iron_mg":0.7082,"magnesium_mg":18.51,"phosphorus_mg":110.68,"potassium_mg":162.92,"zinc_mg":0.5836,"copper_mg":0.0389,"manganese_mg":0.0444,"selenium_ug":26.694,"vitamin_a_mcg":41.7,"vitamin_e_mg":0.7865,"vitamin_d_mcg":0.97,"vitamin_c_mg":1.837,"vitamin_b1_mg":0.0518,"vitamin_b2_mg":0.1496,"vitamin_b3_mg":2.7499,"vitamin_b5_mg":0.5582,"vitamin_b6_mg":0.1507,"vitamin_b9_mcg":20.26,"vitamin_b12_mcg":0.79,"choline_mg":85.164,"vitamin_k_mcg":36.165,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.3264,"greens_beans_cup_eq_per_100g":0.0571,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.2818,"seafood_plant_oz_eq_per_100g":0.8818,"added_sugars_tsp_eq_per_100g":0.0204,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":178.33,"protein_per_100g":9.7585,"fat_per_100g":13.7185,"carbs_per_100g":4.1265,"sugar_per_100g":1.202,"fiber_per_100g":0.564,"added_sugar":0.0855,"sfa":2.5241,"unsat":10.5451,"salt":1.4563,"sodium_mg":573.34,"calcium_mg":19.97,"iron_mg":0.7082,"magnesium_mg":18.51,"phosphorus_mg":110.68,"potassium_mg":162.92,"zinc_mg":0.5836,"copper_mg":0.0389,"manganese_mg":0.0444,"selenium_ug":26.694,"vitamin_a_mcg":41.7,"vitamin_e_mg":0.7865,"vitamin_d_mcg":0.97,"vitamin_c_mg":1.837,"vitamin_b1_mg":0.0518,"vitamin_b2_mg":0.1496,"vitamin_b3_mg":2.7499,"vitamin_b5_mg":0.5582,"vitamin_b6_mg":0.1507,"vitamin_b9_mcg":20.26,"vitamin_b12_mcg":0.79,"choline_mg":85.164,"vitamin_k_mcg":36.165,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.3264,"greens_beans_cup_eq_per_100g":0.0571,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.2818,"seafood_plant_oz_eq_per_100g":0.8818,"added_sugars_tsp_eq_per_100g":0.0204,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.3264,"greens_and_beans_cup_eq":0.0571,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":1.2818,"seafood_and_plant_proteins_oz_eq":0.8818,"added_sugars_tsp_eq":0.0204,"sodium_mg":573.34,"saturated_fat_g":2.5241,"fatty_acids_unsat_to_sfa_ratio":4.1778},"source_url":"recipe-model://homemade-salads/tuna-egg-cucumber-corn-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"squid_egg_cucumber_salad_homemade","model_key":"squid_egg_cucumber_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_squid_egg_cucumber","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"squid_boiled_spp","name_ru":"Кальмар, отварной","role":"boiled_squid","g_per_100g":28.0,"processing_context_v5_3_93":"seafood_component","quality_route_v5_3_93":"seafood/protein component"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"boiled_egg","g_per_100g":22.0,"processing_context_v5_3_93":"egg_component"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":22.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"onion_yellow_raw","name_ru":"Лук репчатый жёлтый (сырой)","role":"onion","g_per_100g":4.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":20.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"dill_raw","name_ru":"Укроп (зелень, сырой)","role":"dill","g_per_100g":3.0,"processing_context_v5_3_93":"herb_component"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"added_salt","g_per_100g":1.0,"processing_context_v5_3_93":"added_salt_sodium_limiter"}],"source_ingredients_ru":["Кальмар, отварной","Яйцо куриное, сваренное вкрутую","Огурцы (сырые)","Лук репчатый жёлтый (сырой)","Майонез, классический","Укроп (зелень, сырой)","Соль поваренная (хлорид натрия)"],"ingredient_to_hei_channels":{"squid_boiled_spp":["protein_foods","seafood_plant_protein","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"onion_yellow_raw":["vegetables","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"dill_raw":["vegetables","greens_beans","sodium","sfa"],"table_salt_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":219.91,"protein_per_100g":8.6978,"fat_per_100g":19.1016,"carbs_per_100g":2.8074,"sugar_per_100g":0.9052,"fiber_per_100g":0.241,"added_sugar":0.114,"sfa":3.5228,"unsat":14.5887,"salt":1.5807,"sodium_mg":622.31,"calcium_mg":34.72,"iron_mg":0.8125,"magnesium_mg":18.8,"phosphorus_mg":127.46,"potassium_mg":177.8,"zinc_mg":0.8721,"copper_mg":0.6795,"manganese_mg":0.0623,"selenium_ug":22.917,"vitamin_a_mcg":57.62,"vitamin_e_mg":1.5456,"vitamin_d_mcg":0.524,"vitamin_c_mg":4.778,"vitamin_b1_mg":0.0319,"vitamin_b2_mg":0.27,"vitamin_b3_mg":0.807,"vitamin_b5_mg":0.5562,"vitamin_b6_mg":0.0731,"vitamin_b9_mcg":18.88,"vitamin_b12_mcg":0.6518,"choline_mg":96.416,"vitamin_k_mcg":41.886,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.2429,"greens_beans_cup_eq_per_100g":0.0429,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.4276,"seafood_plant_oz_eq_per_100g":0.9876,"added_sugars_tsp_eq_per_100g":0.0271,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":219.91,"protein_per_100g":8.6978,"fat_per_100g":19.1016,"carbs_per_100g":2.8074,"sugar_per_100g":0.9052,"fiber_per_100g":0.241,"added_sugar":0.114,"sfa":3.5228,"unsat":14.5887,"salt":1.5807,"sodium_mg":622.31,"calcium_mg":34.72,"iron_mg":0.8125,"magnesium_mg":18.8,"phosphorus_mg":127.46,"potassium_mg":177.8,"zinc_mg":0.8721,"copper_mg":0.6795,"manganese_mg":0.0623,"selenium_ug":22.917,"vitamin_a_mcg":57.62,"vitamin_e_mg":1.5456,"vitamin_d_mcg":0.524,"vitamin_c_mg":4.778,"vitamin_b1_mg":0.0319,"vitamin_b2_mg":0.27,"vitamin_b3_mg":0.807,"vitamin_b5_mg":0.5562,"vitamin_b6_mg":0.0731,"vitamin_b9_mcg":18.88,"vitamin_b12_mcg":0.6518,"choline_mg":96.416,"vitamin_k_mcg":41.886,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.2429,"greens_beans_cup_eq_per_100g":0.0429,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.4276,"seafood_plant_oz_eq_per_100g":0.9876,"added_sugars_tsp_eq_per_100g":0.0271,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.2429,"greens_and_beans_cup_eq":0.0429,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":1.4276,"seafood_and_plant_proteins_oz_eq":0.9876,"added_sugars_tsp_eq":0.0271,"sodium_mg":622.31,"saturated_fat_g":3.5228,"fatty_acids_unsat_to_sfa_ratio":4.1412},"source_url":"recipe-model://homemade-salads/squid-egg-cucumber-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"shrimp_avocado_cucumber_salad_homemade","model_key":"shrimp_avocado_cucumber_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_shrimp_avocado_cucumber","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"shrimp_boiled","name_ru":"Креветки, отварные","role":"boiled_shrimp","g_per_100g":25.0,"processing_context_v5_3_93":"seafood_component","quality_route_v5_3_93":"seafood/protein component"},{"key":"avocado","name_ru":"Авокадо (сырой)","role":"avocado_vegetable_healthy_fat_context","g_per_100g":25.0,"processing_context_v5_3_93":"avocado_component","quality_route_v5_3_93":"vegetable/unsaturated fat context; not ordinary fruit"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":20.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"lettuce_leaf_green_raw","name_ru":"Салат листовой зелёный (сырой)","role":"leaf_lettuce","g_per_100g":15.0,"processing_context_v5_3_93":"leafy_vegetable"},{"key":"tomato_raw","name_ru":"Томаты (сырые)","role":"tomato","g_per_100g":10.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"olive_oil_evoo_other","name_ru":"Масло оливковое, extra virgin","role":"olive_oil_dressing","g_per_100g":4.0,"processing_context_v5_3_93":"added_oil_dressing","quality_route_v5_3_93":"unsaturated oil component"},{"key":"vinegar_apple_other","name_ru":"Уксус яблочный","role":"acid_dressing","g_per_100g":1.0,"processing_context_v5_3_93":"acid_dressing"}],"source_ingredients_ru":["Креветки, отварные","Авокадо (сырой)","Огурцы (сырые)","Салат листовой зелёный (сырой)","Томаты (сырые)","Масло оливковое, extra virgin","Уксус яблочный"],"ingredient_to_hei_channels":{"shrimp_boiled":["protein_foods","seafood_plant_protein","sodium","sfa"],"avocado":["vegetables","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"lettuce_leaf_green_raw":["vegetables","greens_beans","sodium","sfa"],"tomato_raw":["vegetables","sodium","sfa"],"olive_oil_evoo_other":["sodium","sfa"],"vinegar_apple_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":112.57,"protein_per_100g":6.64,"fat_per_100g":8.17,"carbs_per_100g":4.0668,"sugar_per_100g":0.889,"fiber_per_100g":2.09,"added_sugar":0.0,"sfa":1.2342,"unsat":6.5612,"salt":0.6191,"sodium_mg":243.73,"calcium_mg":35.46,"iron_mg":0.5065,"magnesium_mg":22.2,"phosphorus_mg":101.13,"potassium_mg":246.72,"zinc_mg":0.6549,"copper_mg":0.1306,"manganese_mg":0.1184,"selenium_ug":12.636,"vitamin_a_mcg":84.95,"vitamin_e_mg":1.723,"vitamin_d_mcg":0.025,"vitamin_c_mg":5.84,"vitamin_b1_mg":0.0424,"vitamin_b2_mg":0.059,"vitamin_b3_mg":1.2402,"vitamin_b5_mg":0.5602,"vitamin_b6_mg":0.1543,"vitamin_b9_mcg":34.85,"vitamin_b12_mcg":0.415,"choline_mg":40.91,"vitamin_k_mcg":30.72,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.6117,"greens_beans_cup_eq_per_100g":0.2143,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":0.8818,"seafood_plant_oz_eq_per_100g":0.8818,"added_sugars_tsp_eq_per_100g":0.0,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":112.57,"protein_per_100g":6.64,"fat_per_100g":8.17,"carbs_per_100g":4.0668,"sugar_per_100g":0.889,"fiber_per_100g":2.09,"added_sugar":0.0,"sfa":1.2342,"unsat":6.5612,"salt":0.6191,"sodium_mg":243.73,"calcium_mg":35.46,"iron_mg":0.5065,"magnesium_mg":22.2,"phosphorus_mg":101.13,"potassium_mg":246.72,"zinc_mg":0.6549,"copper_mg":0.1306,"manganese_mg":0.1184,"selenium_ug":12.636,"vitamin_a_mcg":84.95,"vitamin_e_mg":1.723,"vitamin_d_mcg":0.025,"vitamin_c_mg":5.84,"vitamin_b1_mg":0.0424,"vitamin_b2_mg":0.059,"vitamin_b3_mg":1.2402,"vitamin_b5_mg":0.5602,"vitamin_b6_mg":0.1543,"vitamin_b9_mcg":34.85,"vitamin_b12_mcg":0.415,"choline_mg":40.91,"vitamin_k_mcg":30.72,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.6117,"greens_beans_cup_eq_per_100g":0.2143,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":0.8818,"seafood_plant_oz_eq_per_100g":0.8818,"added_sugars_tsp_eq_per_100g":0.0,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.6117,"greens_and_beans_cup_eq":0.2143,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":0.8818,"seafood_and_plant_proteins_oz_eq":0.8818,"added_sugars_tsp_eq":0.0,"sodium_mg":243.73,"saturated_fat_g":1.2342,"fatty_acids_unsat_to_sfa_ratio":5.3162},"source_url":"recipe-model://homemade-salads/shrimp-avocado-cucumber-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"ham_cheese_cucumber_egg_salad_homemade","model_key":"ham_cheese_cucumber_egg_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_ham_cheese_cucumber_egg","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"ham_pork_sliced_cooked","name_ru":"Ветчина свиная нарезка","role":"ham_processed_meat","g_per_100g":25.0,"processing_context_v5_3_93":"processed_meat_in_mixed_salad","quality_route_v5_3_93":"not plain meat equivalent; sodium/SFA context"},{"key":"cheese_russian","name_ru":"Сыр Российский","role":"cheese_dairy_sfa_sodium_context","g_per_100g":18.0,"processing_context_v5_3_93":"dairy_cheese_component"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":20.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"boiled_egg","g_per_100g":15.0,"processing_context_v5_3_93":"egg_component"},{"key":"sweet_corn_kernels_boiled","name_ru":"Кукуруза сахарная (зёрна, отварная)","role":"sweet_corn","g_per_100g":10.0,"processing_context_v5_3_93":"starchy_vegetable_corn"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":11.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"added_salt","g_per_100g":1.0,"processing_context_v5_3_93":"added_salt_sodium_limiter"}],"source_ingredients_ru":["Ветчина свиная нарезка","Сыр Российский","Огурцы (сырые)","Яйцо куриное, сваренное вкрутую","Кукуруза сахарная (зёрна, отварная)","Майонез, классический","Соль поваренная (хлорид натрия)"],"ingredient_to_hei_channels":{"ham_pork_sliced_cooked":["protein_foods","sodium","sfa"],"cheese_russian":["dairy","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"sweet_corn_kernels_boiled":["vegetables","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"table_salt_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":209.48,"protein_per_100g":11.3726,"fat_per_100g":16.587,"carbs_per_100g":3.7203,"sugar_per_100g":1.5273,"fiber_per_100g":0.34,"added_sugar":0.0627,"sfa":5.5811,"unsat":10.1507,"salt":2.253,"sodium_mg":886.9905,"calcium_mg":169.37,"iron_mg":0.6608,"magnesium_mg":15.99,"phosphorus_mg":192.09,"potassium_mg":175.66,"zinc_mg":1.245,"copper_mg":0.0322,"manganese_mg":0.0393,"selenium_ug":11.213,"vitamin_a_mcg":55.81,"vitamin_e_mg":0.719,"vitamin_d_mcg":0.642,"vitamin_c_mg":0.91,"vitamin_b1_mg":0.0365,"vitamin_b2_mg":0.1915,"vitamin_b3_mg":0.969,"vitamin_b5_mg":0.5606,"vitamin_b6_mg":0.0996,"vitamin_b9_mcg":17.58,"vitamin_b12_mcg":0.5744,"choline_mg":69.099,"vitamin_k_mcg":22.124,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.2308,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.4286,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.1818,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0149,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":209.48,"protein_per_100g":11.3726,"fat_per_100g":16.587,"carbs_per_100g":3.7203,"sugar_per_100g":1.5273,"fiber_per_100g":0.34,"added_sugar":0.0627,"sfa":5.5811,"unsat":10.1507,"salt":2.253,"sodium_mg":886.9905,"calcium_mg":169.37,"iron_mg":0.6608,"magnesium_mg":15.99,"phosphorus_mg":192.09,"potassium_mg":175.66,"zinc_mg":1.245,"copper_mg":0.0322,"manganese_mg":0.0393,"selenium_ug":11.213,"vitamin_a_mcg":55.81,"vitamin_e_mg":0.719,"vitamin_d_mcg":0.642,"vitamin_c_mg":0.91,"vitamin_b1_mg":0.0365,"vitamin_b2_mg":0.1915,"vitamin_b3_mg":0.969,"vitamin_b5_mg":0.5606,"vitamin_b6_mg":0.0996,"vitamin_b9_mcg":17.58,"vitamin_b12_mcg":0.5744,"choline_mg":69.099,"vitamin_k_mcg":22.124,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.2308,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.4286,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.1818,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0149,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.2308,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.4286,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":1.1818,"seafood_and_plant_proteins_oz_eq":0.0,"added_sugars_tsp_eq":0.0149,"sodium_mg":886.9905,"saturated_fat_g":5.5811,"fatty_acids_unsat_to_sfa_ratio":1.8188},"source_url":"recipe-model://homemade-salads/ham-cheese-cucumber-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"chicken_korean_carrot_corn_salad_homemade","model_key":"chicken_korean_carrot_corn_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_chicken_korean_carrot_corn","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"chicken_breast_cooked","name_ru":"Куриная грудка, запечённая (без кожи)","role":"plain_cooked_chicken","g_per_100g":25.0,"processing_context_v5_3_93":"plain_poultry_component"},{"key":"carrot_raw","name_ru":"Морковь (сырая)","role":"korean_carrot_base_carrot","g_per_100g":20.0,"processing_context_v5_3_93":"korean_carrot_base_component","quality_route_v5_3_93":"carrot part of Korean-style carrot separated from oil/salt/sugar"},{"key":"sunflower_oil_other","name_ru":"Масло подсолнечное, рафинированное","role":"korean_carrot_oil","g_per_100g":3.0,"processing_context_v5_3_93":"added_oil_in_korean_carrot"},{"key":"garlic_raw","name_ru":"Чеснок (сырой)","role":"korean_carrot_garlic","g_per_100g":0.5,"processing_context_v5_3_93":"garlic_spice_component"},{"key":"vinegar_apple_other","name_ru":"Уксус яблочный","role":"korean_carrot_acid","g_per_100g":0.5,"processing_context_v5_3_93":"acid_marinade"},{"key":"sugar_white_other","name_ru":"Сахар белый (песок)","role":"korean_carrot_added_sugar","g_per_100g":0.5,"processing_context_v5_3_93":"added_sugar_marinade"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"korean_carrot_added_salt","g_per_100g":0.5,"processing_context_v5_3_93":"added_salt_sodium_limiter"},{"key":"sweet_corn_kernels_boiled","name_ru":"Кукуруза сахарная (зёрна, отварная)","role":"sweet_corn","g_per_100g":18.0,"processing_context_v5_3_93":"starchy_vegetable_corn"},{"key":"cucumber_raw","name_ru":"Огурцы (сырые)","role":"fresh_cucumber","g_per_100g":10.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"cheese_russian","name_ru":"Сыр Российский","role":"cheese_dairy_sfa_sodium_context","g_per_100g":10.0,"processing_context_v5_3_93":"dairy_cheese_component"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":11.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"dill_raw","name_ru":"Укроп (зелень, сырой)","role":"dill","g_per_100g":1.0,"processing_context_v5_3_93":"herb_component"}],"source_ingredients_ru":["Куриная грудка, запечённая (без кожи)","Морковь (сырая)","Масло подсолнечное, рафинированное","Чеснок (сырой)","Уксус яблочный","Сахар белый (песок)","Соль поваренная (хлорид натрия)","Кукуруза сахарная (зёрна, отварная)","Огурцы (сырые)","Сыр Российский","Майонез, классический","Укроп (зелень, сырой)"],"ingredient_to_hei_channels":{"chicken_breast_cooked":["protein_foods","sodium","sfa"],"carrot_raw":["vegetables","sodium","sfa"],"sunflower_oil_other":["sodium","sfa"],"garlic_raw":["vegetables","sodium","sfa"],"vinegar_apple_other":["sodium"],"sugar_white_other":["added_sugar","sodium"],"table_salt_other":["sodium"],"sweet_corn_kernels_boiled":["vegetables","sodium","sfa"],"cucumber_raw":["vegetables","sodium","sfa"],"cheese_russian":["dairy","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"dill_raw":["vegetables","greens_beans","sodium","sfa"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":205.405,"protein_per_100g":11.1272,"fat_per_100g":15.0528,"carbs_per_100g":6.6671,"sugar_per_100g":2.4623,"fiber_per_100g":1.0735,"added_sugar":0.5627,"sfa":3.6494,"unsat":10.8994,"salt":1.0773,"sodium_mg":424.135,"calcium_mg":86.515,"iron_mg":0.5566,"magnesium_mg":19.705,"phosphorus_mg":138.995,"potassium_mg":208.74,"zinc_mg":0.8535,"copper_mg":0.0436,"manganese_mg":0.0881,"selenium_ug":8.8595,"vitamin_a_mcg":192.92,"vitamin_e_mg":1.8493,"vitamin_d_mcg":0.097,"vitamin_c_mg":3.096,"vitamin_b1_mg":0.0445,"vitamin_b2_mg":0.0936,"vitamin_b3_mg":3.8927,"vitamin_b5_mg":0.4148,"vitamin_b6_mg":0.2163,"vitamin_b9_mcg":15.965,"vitamin_b12_mcg":0.2522,"choline_mg":33.303,"vitamin_k_mcg":24.2595,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.3873,"greens_beans_cup_eq_per_100g":0.0143,"dairy_cup_eq_per_100g":0.2381,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":0.8818,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.134,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":205.405,"protein_per_100g":11.1272,"fat_per_100g":15.0528,"carbs_per_100g":6.6671,"sugar_per_100g":2.4623,"fiber_per_100g":1.0735,"added_sugar":0.5627,"sfa":3.6494,"unsat":10.8994,"salt":1.0773,"sodium_mg":424.135,"calcium_mg":86.515,"iron_mg":0.5566,"magnesium_mg":19.705,"phosphorus_mg":138.995,"potassium_mg":208.74,"zinc_mg":0.8535,"copper_mg":0.0436,"manganese_mg":0.0881,"selenium_ug":8.8595,"vitamin_a_mcg":192.92,"vitamin_e_mg":1.8493,"vitamin_d_mcg":0.097,"vitamin_c_mg":3.096,"vitamin_b1_mg":0.0445,"vitamin_b2_mg":0.0936,"vitamin_b3_mg":3.8927,"vitamin_b5_mg":0.4148,"vitamin_b6_mg":0.2163,"vitamin_b9_mcg":15.965,"vitamin_b12_mcg":0.2522,"choline_mg":33.303,"vitamin_k_mcg":24.2595,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.3873,"greens_beans_cup_eq_per_100g":0.0143,"dairy_cup_eq_per_100g":0.2381,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":0.8818,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.134,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.3873,"greens_and_beans_cup_eq":0.0143,"dairy_cup_eq":0.2381,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":0.8818,"seafood_and_plant_proteins_oz_eq":0.0,"added_sugars_tsp_eq":0.134,"sodium_mg":424.135,"saturated_fat_g":3.6494,"fatty_acids_unsat_to_sfa_ratio":2.9866},"source_url":"recipe-model://homemade-salads/chicken-korean-carrot-corn-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"root_key":"ham_mushroom_cheese_salad_homemade","model_key":"ham_mushroom_cheese_salad_homemade_reverse_recipe_v1","dish_type":"homemade_salad_ham_mushroom_cheese","root_weight_g":250,"priority":"homemade_complex_salads_candidate_v3","confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component-sum from typical home recipe, not label or lab measurement","ingredient_weights":"medium: типовая домашняя рецептура; пользователь может заменить/удалить/добавить компоненты после добавления","micronutrients":"medium: component-sum from calculator product DB","food_pattern_equivalents":"medium_high: HEI/plate channels come from child components, not root monolith"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"ham_pork_sliced_cooked","name_ru":"Ветчина свиная нарезка","role":"ham_processed_meat","g_per_100g":22.0,"processing_context_v5_3_93":"processed_meat_in_mixed_salad","quality_route_v5_3_93":"not plain meat equivalent; sodium/SFA context"},{"key":"mushroom_white_boiled","name_ru":"Шампиньоны отварные","role":"mushrooms","g_per_100g":20.0,"processing_context_v5_3_93":"mushroom_component"},{"key":"cheese_russian","name_ru":"Сыр Российский","role":"cheese_dairy_sfa_sodium_context","g_per_100g":18.0,"processing_context_v5_3_93":"dairy_cheese_component"},{"key":"egg_whole_boiled","name_ru":"Яйцо куриное, сваренное вкрутую","role":"boiled_egg","g_per_100g":16.0,"processing_context_v5_3_93":"egg_component"},{"key":"mayonnaise_classic_other","name_ru":"Майонез, классический","role":"mayonnaise_dressing","g_per_100g":20.0,"processing_context_v5_3_93":"mayonnaise_dressing"},{"key":"onion_yellow_raw","name_ru":"Лук репчатый жёлтый (сырой)","role":"onion","g_per_100g":3.0,"processing_context_v5_3_93":"raw_vegetable"},{"key":"table_salt_other","name_ru":"Соль поваренная (хлорид натрия)","role":"added_salt","g_per_100g":1.0,"processing_context_v5_3_93":"added_salt_sodium_limiter"}],"source_ingredients_ru":["Ветчина свиная нарезка","Шампиньоны отварные","Сыр Российский","Яйцо куриное, сваренное вкрутую","Майонез, классический","Лук репчатый жёлтый (сырой)","Соль поваренная (хлорид натрия)"],"ingredient_to_hei_channels":{"ham_pork_sliced_cooked":["protein_foods","sodium","sfa"],"mushroom_white_boiled":["vegetables","sodium","sfa"],"cheese_russian":["dairy","sodium","sfa"],"egg_whole_boiled":["protein_foods","sodium","sfa"],"mayonnaise_classic_other":["added_sugar","sodium","sfa"],"onion_yellow_raw":["vegetables","sodium","sfa"],"table_salt_other":["sodium"]},"reference_recipe_yield_g":250,"component_estimated_nutrients_per_100g":{"kcal":263.58,"protein_per_100g":11.117,"fat_per_100g":23.225,"carbs_per_100g":2.4698,"sugar_per_100g":1.5068,"fiber_per_100g":0.491,"added_sugar":0.114,"sfa":6.594,"unsat":15.6123,"salt":2.2674,"sodium_mg":892.654,"calcium_mg":165.23,"iron_mg":0.9057,"magnesium_mg":13.03,"phosphorus_mg":194.91,"potassium_mg":192.0,"zinc_mg":1.3133,"copper_mg":0.1222,"manganese_mg":0.0444,"selenium_ug":13.561,"vitamin_a_mcg":56.74,"vitamin_e_mg":0.9964,"vitamin_d_mcg":0.698,"vitamin_c_mg":1.022,"vitamin_b1_mg":0.0443,"vitamin_b2_mg":0.2416,"vitamin_b3_mg":1.6189,"vitamin_b5_mg":0.9357,"vitamin_b6_mg":0.1004,"vitamin_b9_mcg":17.53,"vitamin_b12_mcg":0.5822,"choline_mg":73.961,"vitamin_k_mcg":33.448,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.1769,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.4286,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.096,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0271,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"estimated_nutrients_per_100g":{"kcal":263.58,"protein_per_100g":11.117,"fat_per_100g":23.225,"carbs_per_100g":2.4698,"sugar_per_100g":1.5068,"fiber_per_100g":0.491,"added_sugar":0.114,"sfa":6.594,"unsat":15.6123,"salt":2.2674,"sodium_mg":892.654,"calcium_mg":165.23,"iron_mg":0.9057,"magnesium_mg":13.03,"phosphorus_mg":194.91,"potassium_mg":192.0,"zinc_mg":1.3133,"copper_mg":0.1222,"manganese_mg":0.0444,"selenium_ug":13.561,"vitamin_a_mcg":56.74,"vitamin_e_mg":0.9964,"vitamin_d_mcg":0.698,"vitamin_c_mg":1.022,"vitamin_b1_mg":0.0443,"vitamin_b2_mg":0.2416,"vitamin_b3_mg":1.6189,"vitamin_b5_mg":0.9357,"vitamin_b6_mg":0.1004,"vitamin_b9_mcg":17.53,"vitamin_b12_mcg":0.5822,"choline_mg":73.961,"vitamin_k_mcg":33.448,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.1769,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.4286,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":1.096,"seafood_plant_oz_eq_per_100g":0.0,"added_sugars_tsp_eq_per_100g":0.0271,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.1769,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.4286,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":1.096,"seafood_and_plant_proteins_oz_eq":0.0,"added_sugars_tsp_eq":0.0271,"sodium_mg":892.654,"saturated_fat_g":6.594,"fatty_acids_unsat_to_sfa_ratio":2.3677},"source_url":"recipe-model://homemade-salads/ham-mushroom-cheese-v5.3.93","source_ref":"internal_recipe_model_v5_3_93","decomposition_pass":"v5.3.93_COMPOSITE_HOMEMADE_SALADS_THIRD10_RECIPE_DECOMPOSITION_PASS","quality_flags":["child_projection_only","editable_recipe","homemade_recipe_model","homemade_salad_candidate","salad","search_preview_full_composition","v5_3_93"],"customization_support_v5_3_93":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"}},{"model_key":"squid_rings_breaded_reverse_recipe_v1","dish_type":"breaded_seafood","root_weight_g":100,"confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: component model is aligned with the former generic profile; exact retail product may differ","ingredient_weights":"medium: 65% squid, 25% breading and 10% retained frying oil; editable after adding","micronutrients":"medium_low: component sum from calculator product DB","food_pattern_equivalents":"high for routing: seafood, refined grain and oil are counted separately"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"squid_raw_cleaned","name_ru":"Кальмар, съедобная часть","role":"seafood_squid_base","g_per_100g":65.0},{"key":"wheat_corn_breadcrumbs","name_ru":"Сухари панировочные пшенично-кукурузные","role":"refined_grain_breading","g_per_100g":25.0},{"key":"sunflower_oil_other","name_ru":"Масло подсолнечное, рафинированное","role":"absorbed_frying_oil","g_per_100g":10.0}],"source_ingredients_ru":["Кальмар, съедобная часть — 65 г","Сухари панировочные пшенично-кукурузные — 25 г","Масло подсолнечное, рафинированное — 10 г"],"ingredient_to_hei_channels":{"squid_raw_cleaned":["Total Protein Foods","Seafood and Plant Proteins","Sodium","Fatty Acids/SFA"],"wheat_corn_breadcrumbs":["Refined Grains","Sodium","Fatty Acids/SFA"],"sunflower_oil_other":["Sodium","Fatty Acids/SFA"]},"reference_recipe_yield_g":100,"estimated_nutrients_per_100g":{"kcal":246.95,"protein_per_100g":12.64,"fat_per_100g":12.41,"carbs_per_100g":20.765,"sugar_per_100g":1.0,"fiber_per_100g":1.0,"added_sugar":0.5,"sfa":1.574,"unsat":10.4575,"salt":0.44796,"sodium_mg":176.3,"calcium_mg":56.22,"iron_mg":1.1478,"magnesium_mg":27.938,"phosphorus_mg":161.2,"potassium_mg":188.208,"zinc_mg":1.1892,"copper_mg":1.1373,"manganese_mg":0.18436,"selenium_ug":32.2708,"vitamin_a_mcg":14.976,"vitamin_e_mg":5.27556,"vitamin_d_mcg":0.0,"vitamin_c_mg":2.1996,"vitamin_b1_mg":0.122328,"vitamin_b2_mg":0.277448,"vitamin_b3_mg":2.32776,"vitamin_b5_mg":0.359,"vitamin_b6_mg":0.073056,"vitamin_b9_mcg":24.84,"vitamin_b12_mcg":0.64116,"choline_mg":41.7048,"vitamin_k_mcg":2.3966,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.0,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.881825,"protein_oz_eq_per_100g":1.860031,"seafood_plant_oz_eq_per_100g":1.860031,"added_sugars_tsp_eq_per_100g":0.11905,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.881825,"added_sugars_tsp_per_100g":0.11905},"component_estimated_nutrients_per_100g":{"kcal":246.95,"protein_per_100g":12.64,"fat_per_100g":12.41,"carbs_per_100g":20.765,"sugar_per_100g":1.0,"fiber_per_100g":1.0,"added_sugar":0.5,"sfa":1.574,"unsat":10.4575,"salt":0.44796,"sodium_mg":176.3,"calcium_mg":56.22,"iron_mg":1.1478,"magnesium_mg":27.938,"phosphorus_mg":161.2,"potassium_mg":188.208,"zinc_mg":1.1892,"copper_mg":1.1373,"manganese_mg":0.18436,"selenium_ug":32.2708,"vitamin_a_mcg":14.976,"vitamin_e_mg":5.27556,"vitamin_d_mcg":0.0,"vitamin_c_mg":2.1996,"vitamin_b1_mg":0.122328,"vitamin_b2_mg":0.277448,"vitamin_b3_mg":2.32776,"vitamin_b5_mg":0.359,"vitamin_b6_mg":0.073056,"vitamin_b9_mcg":24.84,"vitamin_b12_mcg":0.64116,"choline_mg":41.7048,"vitamin_k_mcg":2.3966,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.0,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.881825,"protein_oz_eq_per_100g":1.860031,"seafood_plant_oz_eq_per_100g":1.860031,"added_sugars_tsp_eq_per_100g":0.11905,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.881825,"added_sugars_tsp_per_100g":0.11905},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.0,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.881825,"total_protein_foods_oz_eq":1.860031,"seafood_and_plant_proteins_oz_eq":1.860031,"added_sugars_tsp_eq":0.11905,"sodium_mg":176.3,"saturated_fat_g":1.574,"fatty_acids_unsat_to_sfa_ratio":6.643901},"source_ref":"internal_component_model_v5_3_143","source_url":"recipe-model://composite-consolidation/squid_rings_breaded","decomposition_pass":"v5.3.143_COMPOSITE_DECOMPOSITION_CONSOLIDATION","quality_flags":["child_projection_only","editable_recipe","component_sum","v5_3_143"],"customization_support_v5_3_143":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"},"verification_note_ru":"Разложено на 65 г кальмара, 25 г панировки и 10 г удержанного масла на 100 г готового продукта. Доли доступны для редактирования.","root_key":"squid_rings_breaded"},{"model_key":"mussels_cream_sauce_reverse_recipe_v1","dish_type":"seafood_with_cream_sauce","root_weight_g":100,"confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium: typical 70/25/5 component model, not an exact manufacturer recipe","ingredient_weights":"medium: mussels, cream and onion are editable after adding","micronutrients":"medium: component sum from calculator product DB","food_pattern_equivalents":"high for routing: seafood and onion are separated; cream contributes nutrients and saturated fat without full dairy adequacy credit"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"mussels_steamed_spp","name_ru":"Мидии, приготовленные на пару","role":"seafood_mussels","g_per_100g":70.0},{"key":"cream_20_pct","name_ru":"Сливки 20% жирности","role":"cream_sauce","g_per_100g":25.0},{"key":"onion_yellow_raw","name_ru":"Лук репчатый жёлтый","role":"vegetable_onion","g_per_100g":5.0}],"source_ingredients_ru":["Мидии, приготовленные на пару — 70 г","Сливки 20% жирности — 25 г","Лук репчатый жёлтый — 5 г"],"ingredient_to_hei_channels":{"mussels_steamed_spp":["Total Protein Foods","Seafood and Plant Proteins","Sodium","Fatty Acids/SFA"],"cream_20_pct":["Sodium","Fatty Acids/SFA"],"onion_yellow_raw":["Total Vegetables","Sodium","Fatty Acids/SFA"]},"reference_recipe_yield_g":100,"estimated_nutrients_per_100g":{"kcal":171.15,"protein_per_100g":17.455,"fat_per_100g":7.916,"carbs_per_100g":6.553,"sugar_per_100g":1.125,"fiber_per_100g":0.085,"added_sugar":0.0,"sfa":3.146,"unsat":2.88525,"salt":0.702345,"sodium_mg":276.5,"calcium_mg":47.0,"iron_mg":4.727,"magnesium_mg":28.65,"phosphorus_mg":223.95,"potassium_mg":228.9,"zinc_mg":1.9575,"copper_mg":0.1093,"manganese_mg":4.769,"selenium_ug":63.895,"vitamin_a_mcg":93.7,"vitamin_e_mg":0.731,"vitamin_d_mcg":0.275,"vitamin_c_mg":10.09,"vitamin_b1_mg":0.21805,"vitamin_b2_mg":0.34285,"vitamin_b3_mg":2.1283,"vitamin_b5_mg":0.75865,"vitamin_b6_mg":0.087,"vitamin_b9_mcg":54.65,"vitamin_b12_mcg":16.835,"choline_mg":50.155,"vitamin_k_mcg":0.515,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.03846,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":2.46911,"seafood_plant_oz_eq_per_100g":2.46911,"added_sugars_tsp_eq_per_100g":0.0,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"component_estimated_nutrients_per_100g":{"kcal":171.15,"protein_per_100g":17.455,"fat_per_100g":7.916,"carbs_per_100g":6.553,"sugar_per_100g":1.125,"fiber_per_100g":0.085,"added_sugar":0.0,"sfa":3.146,"unsat":2.88525,"salt":0.702345,"sodium_mg":276.5,"calcium_mg":47.0,"iron_mg":4.727,"magnesium_mg":28.65,"phosphorus_mg":223.95,"potassium_mg":228.9,"zinc_mg":1.9575,"copper_mg":0.1093,"manganese_mg":4.769,"selenium_ug":63.895,"vitamin_a_mcg":93.7,"vitamin_e_mg":0.731,"vitamin_d_mcg":0.275,"vitamin_c_mg":10.09,"vitamin_b1_mg":0.21805,"vitamin_b2_mg":0.34285,"vitamin_b3_mg":2.1283,"vitamin_b5_mg":0.75865,"vitamin_b6_mg":0.087,"vitamin_b9_mcg":54.65,"vitamin_b12_mcg":16.835,"choline_mg":50.155,"vitamin_k_mcg":0.515,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.03846,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":2.46911,"seafood_plant_oz_eq_per_100g":2.46911,"added_sugars_tsp_eq_per_100g":0.0,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.03846,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":2.46911,"seafood_and_plant_proteins_oz_eq":2.46911,"added_sugars_tsp_eq":0.0,"sodium_mg":276.5,"saturated_fat_g":3.146,"fatty_acids_unsat_to_sfa_ratio":0.917117},"source_ref":"internal_component_model_v5_3_143","source_url":"recipe-model://composite-consolidation/mussels_cream_sauce","decomposition_pass":"v5.3.143_COMPOSITE_DECOMPOSITION_CONSOLIDATION","quality_flags":["child_projection_only","editable_recipe","component_sum","v5_3_143"],"customization_support_v5_3_143":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"},"verification_note_ru":"Разложено на 70 г мидий, 25 г сливок и 5 г лука на 100 г блюда. Соус можно уменьшить или заменить в редакторе состава.","root_key":"mussels_cream_sauce"},{"model_key":"seafood_cocktail_cooked_reverse_recipe_v1","dish_type":"mixed_seafood","root_weight_g":100,"confidence":"MEDIUM","accuracy":{"energy_and_macros":"medium_high: component sum reproduces the established generic profile closely","ingredient_weights":"medium: canonical 40/30/30 mix; editable after adding","micronutrients":"medium: actual retail mixture may use different proportions","food_pattern_equivalents":"high for routing: all components are seafood, but micronutrients remain component-specific"},"macro_priority":"component_sum","hei_priority":"component_decomposition","nutrient_priority":"component_sum_from_product_db","root_hei_direct_counting_disabled":true,"calculation_projection":"child_components_only","components":[{"key":"shrimp_boiled_spp","name_ru":"Креветки, отварные","role":"seafood_shrimp","g_per_100g":40.0},{"key":"squid_boiled_spp","name_ru":"Кальмар, отварной","role":"seafood_squid","g_per_100g":30.0},{"key":"mussels_steamed_spp","name_ru":"Мидии, приготовленные на пару","role":"seafood_mussels","g_per_100g":30.0}],"source_ingredients_ru":["Креветки, отварные — 40 г","Кальмар, отварной — 30 г","Мидии, приготовленные на пару — 30 г"],"ingredient_to_hei_channels":{"shrimp_boiled_spp":["Total Protein Foods","Seafood and Plant Proteins","Sodium","Fatty Acids/SFA"],"squid_boiled_spp":["Total Protein Foods","Seafood and Plant Proteins","Sodium","Fatty Acids/SFA"],"mussels_steamed_spp":["Total Protein Foods","Seafood and Plant Proteins","Sodium","Fatty Acids/SFA"]},"reference_recipe_yield_g":100,"estimated_nutrients_per_100g":{"kcal":137.7,"protein_per_100g":22.56,"fat_per_100g":3.331,"carbs_per_100g":3.446,"sugar_per_100g":0.003,"fiber_per_100g":0.0,"added_sugar":0.0,"sfa":0.7664,"unsat":1.8238,"salt":0.59969,"sodium_mg":236.1,"calcium_mg":49.9,"iron_mg":2.475,"magnesium_mg":39.0,"phosphorus_mg":262.8,"potassium_mg":275.8,"zinc_mg":2.027,"copper_mg":0.9013,"manganese_mg":2.0592,"selenium_ug":63.36,"vitamin_a_mcg":72.9,"vitamin_e_mg":1.831,"vitamin_d_mcg":0.04,"vitamin_c_mg":5.49,"vitamin_b1_mg":0.1083,"vitamin_b2_mg":0.2798,"vitamin_b3_mg":2.751,"vitamin_b5_mg":0.643,"vitamin_b6_mg":0.1536,"vitamin_b9_mcg":33.9,"vitamin_b12_mcg":8.291,"choline_mg":97.99,"vitamin_k_mcg":1.3,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.0,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":3.5273,"seafood_plant_oz_eq_per_100g":3.5273,"added_sugars_tsp_eq_per_100g":0.0,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"component_estimated_nutrients_per_100g":{"kcal":137.7,"protein_per_100g":22.56,"fat_per_100g":3.331,"carbs_per_100g":3.446,"sugar_per_100g":0.003,"fiber_per_100g":0.0,"added_sugar":0.0,"sfa":0.7664,"unsat":1.8238,"salt":0.59969,"sodium_mg":236.1,"calcium_mg":49.9,"iron_mg":2.475,"magnesium_mg":39.0,"phosphorus_mg":262.8,"potassium_mg":275.8,"zinc_mg":2.027,"copper_mg":0.9013,"manganese_mg":2.0592,"selenium_ug":63.36,"vitamin_a_mcg":72.9,"vitamin_e_mg":1.831,"vitamin_d_mcg":0.04,"vitamin_c_mg":5.49,"vitamin_b1_mg":0.1083,"vitamin_b2_mg":0.2798,"vitamin_b3_mg":2.751,"vitamin_b5_mg":0.643,"vitamin_b6_mg":0.1536,"vitamin_b9_mcg":33.9,"vitamin_b12_mcg":8.291,"choline_mg":97.99,"vitamin_k_mcg":1.3,"fruit_cup_eq_per_100g":0.0,"whole_fruit_cup_eq_per_100g":0.0,"veg_cup_eq_per_100g":0.0,"greens_beans_cup_eq_per_100g":0.0,"dairy_cup_eq_per_100g":0.0,"whole_grain_oz_eq_per_100g":0.0,"refined_grain_oz_eq_per_100g":0.0,"protein_oz_eq_per_100g":3.5273,"seafood_plant_oz_eq_per_100g":3.5273,"added_sugars_tsp_eq_per_100g":0.0,"whole_grains_oz_eq_per_100g":0.0,"refined_grains_oz_eq_per_100g":0.0,"added_sugars_tsp_per_100g":0.0},"hei_mapping_proxy_per_100g":{"fruit_cup_eq":0.0,"whole_fruit_cup_eq":0.0,"total_vegetables_cup_eq":0.0,"greens_and_beans_cup_eq":0.0,"dairy_cup_eq":0.0,"whole_grain_oz_eq":0.0,"refined_grain_oz_eq":0.0,"total_protein_foods_oz_eq":3.5273,"seafood_and_plant_proteins_oz_eq":3.5273,"added_sugars_tsp_eq":0.0,"sodium_mg":236.1,"saturated_fat_g":0.7664,"fatty_acids_unsat_to_sfa_ratio":2.379697},"source_ref":"internal_component_model_v5_3_143","source_url":"recipe-model://composite-consolidation/seafood_cocktail_cooked","decomposition_pass":"v5.3.143_COMPOSITE_DECOMPOSITION_CONSOLIDATION","quality_flags":["child_projection_only","editable_recipe","component_sum","v5_3_143"],"customization_support_v5_3_143":{"search_preview":"full_ingredient_table_before_add","after_add_editor":"ingredient_replace_delete_add_inside_composite_folder","custom_instance_status":"customized_recipe_instance"},"verification_note_ru":"Разложено на 40 г креветок, 30 г кальмара и 30 г мидий на 100 г смеси. Пропорции можно исправить по конкретной упаковке.","root_key":"seafood_cocktail_cooked"}]};
window.__COMPOSITE_FOOD_MODELS__ = window.__COMPOSITE_FOOD_MODELS_V5_3_144__;

// nutrition calculator v5.3.78 — CompositeFoodDecomposer + ReverseRecipeEstimator foundation
// This module is intentionally non-invasive: it registers a deterministic API for future UI/runtime integration.
(function(){
  'use strict';
  var VERSION = 'v5.3.78_composite_reverse_recipe_estimator';

  function num(x, fallback){
    var v = Number(x);
    return Number.isFinite(v) ? v : (fallback || 0);
  }
  function clamp(v, min, max){
    v = num(v, 0); min = num(min, 0); max = num(max, 100);
    return Math.max(min, Math.min(max, v));
  }
  function lowerText(value){ return String(value || '').toLowerCase(); }

  var DISH_ARCHETYPE_KEYWORDS = [
    { key:'leafy_salad', words:['салат','salad','зелён','зелен','айсберг','брокколи','греческий'] },
    { key:'mayonnaise_salad', words:['оливье','мимоза','под шубой','крабовый салат','майонезный'] },
    { key:'okroshka', words:['окрошка','okroshka'] },
    { key:'pizza', words:['пицца','pizza'] },
    { key:'pasta_or_rice_ready_meal', words:['паста','макароны','плов','рис с','карбонара','по-флотски'] },
    { key:'dumpling_filled_dough', words:['пельмени','вареники','хинкали','манты','dumpling'] },
    { key:'dessert_bakery_composite', words:['сырники','запеканка','блины','пирог','десерт','торт'] }
  ];

  function classifyDishType(input){
    var text = lowerText([input && input.name_ru, input && input.name, input && input.dish_type, (input && input.ingredient_order_label || []).join(' ')].join(' '));
    for (var i=0; i<DISH_ARCHETYPE_KEYWORDS.length; i++){
      var row = DISH_ARCHETYPE_KEYWORDS[i];
      for (var j=0; j<row.words.length; j++){
        if (text.indexOf(row.words[j]) >= 0) return row.key;
      }
    }
    return (input && input.dish_type) || 'generic_composite';
  }

  function getRegistry(){
    return window.__COMPOSITE_FOOD_MODELS__ || window.__COMPOSITE_FOOD_MODELS_V5_3_93__ || window.__COMPOSITE_FOOD_MODELS_V5_3_91__ || window.__COMPOSITE_FOOD_MODELS_V5_3_87__ || window.__COMPOSITE_FOOD_MODELS_V5_3_78__ || window.__COMPOSITE_FOOD_MODELS_V5_3_76__ || null;
  }

  function getArchetype(dishType){
    var registry = getRegistry();
    return registry && registry.dish_archetypes ? registry.dish_archetypes[dishType] : null;
  }

  function makeInitialWeights(components, dishType){
    components = Array.isArray(components) ? components.slice() : [];
    if (!components.length) return [];
    var archetype = getArchetype(dishType) || {};
    var roles = archetype.roles_g_per_100g || {};
    var weights = [];
    var remaining = 100;
    for (var i=0; i<components.length; i++){
      var c = components[i] || {};
      var role = c.role || c.component_role || 'unknown';
      var range = roles[role] || c.range_g_per_100g || [0, Math.max(0, remaining)];
      var prior = Number.isFinite(Number(c.prior_g_per_100g)) ? Number(c.prior_g_per_100g) : ((num(range[0],0) + num(range[1],0)) / 2);
      weights.push(clamp(prior, num(range[0],0), num(range[1],100)));
    }
    var sum = weights.reduce(function(a,b){ return a+b; }, 0) || 1;
    return weights.map(function(w){ return w / sum * 100; });
  }

  function weightedMacros(components, weights){
    var out = { energy_kcal:0, protein_g:0, fat_g:0, carbohydrate_g:0 };
    for (var i=0; i<components.length; i++){
      var c = components[i] || {}, w = num(weights[i],0) / 100;
      out.energy_kcal += w * num(c.energy_kcal || c.kcal, 0);
      out.protein_g += w * num(c.protein_g || c.protein_per_100g, 0);
      out.fat_g += w * num(c.fat_g || c.fat_per_100g, 0);
      out.carbohydrate_g += w * num(c.carbohydrate_g || c.carbs_per_100g, 0);
    }
    Object.keys(out).forEach(function(k){ out[k] = Math.round(out[k] * 100) / 100; });
    return out;
  }

  function macroError(model, target){
    target = target || {};
    var keys = ['protein_g','fat_g','carbohydrate_g'];
    var err = 0;
    keys.forEach(function(k){
      var t = num(target[k], 0);
      var denom = Math.max(1, Math.abs(t));
      err += Math.pow((num(model[k],0) - t) / denom, 2);
    });
    if (Number.isFinite(Number(target.energy_kcal))){
      var kt = num(target.energy_kcal, 0);
      err += 0.35 * Math.pow((num(model.energy_kcal,0) - kt) / Math.max(10, Math.abs(kt)), 2);
    }
    return Math.sqrt(err);
  }

  function estimateRecipe(input){
    input = input || {};
    var dishType = classifyDishType(input);
    var components = Array.isArray(input.candidate_ingredients) ? input.candidate_ingredients : [];
    var weights = makeInitialWeights(components, dishType);
    var target = input.manufacturer_macros_per_100g || input.label_macros_per_100g || {};
    var model = weightedMacros(components, weights);
    var err = macroError(model, target);
    var confidence = err <= 0.08 ? 'MEDIUM' : (err <= 0.18 ? 'MEDIUM_LOW' : 'LOW');
    // This foundation intentionally returns a deterministic archetype-prior estimate. Full optimization will be added in the UI/runtime pass.
    var recipe = {};
    for (var i=0; i<components.length; i++){
      var key = components[i] && (components[i].key || components[i].name || ('component_' + (i+1)));
      recipe[key] = Math.round(num(weights[i],0) * 10) / 10;
    }
    return {
      schema_version: 'v5.3.76',
      record_type: 'reverse_recipe_estimate_preview',
      dish_type: dishType,
      estimated_recipe_g_per_100g: recipe,
      macro_check_by_estimated_recipe_per_100g: model,
      target_macros_per_100g: target,
      macro_error_score: Math.round(err * 10000) / 10000,
      confidence: confidence,
      qa_flags: err > 0.18 ? ['REVERSE_MODEL_REQUIRES_MANUAL_REVIEW'] : []
    };
  }

  function scaleCompositeChildren(children, oldRootGrams, newRootGrams){
    var ratio = num(newRootGrams, 0) / Math.max(0.0001, num(oldRootGrams, 0));
    return (Array.isArray(children) ? children : []).map(function(child){
      var clone = Object.assign({}, child || {});
      if (!clone.manual_locked) clone.grams = Math.round(num(clone.grams,0) * ratio * 10) / 10;
      return clone;
    });
  }

  function flattenCompositeForCalculation(entries){
    var out = [];
    function walk(entry, parentId){
      if (!entry) return;
      if (entry.entry_type === 'composite_food' && Array.isArray(entry.children)){
        entry.children.forEach(function(child){
          var clone = Object.assign({}, child, { parent_composite_id: entry.id || parentId || null });
          walk(clone, entry.id || parentId || null);
        });
      } else {
        out.push(entry);
      }
    }
    (Array.isArray(entries) ? entries : []).forEach(function(e){ walk(e, null); });
    return out;
  }

  window.CompositeFoodDecomposerV5376 = {
    version: VERSION,
    classifyDishType: classifyDishType,
    estimateRecipe: estimateRecipe,
    scaleCompositeChildren: scaleCompositeChildren,
    flattenCompositeForCalculation: flattenCompositeForCalculation,
    getRegistry: getRegistry
  };
})();

/* HEI-2020 canonical scoring core — RC2 HOTFIX3. Pure math, no DOM. */
(function(w){'use strict';
var VERSION='v5.3.210-rc2-hf3-hei-core';
var STD={
 fruits_total:{min:0.8,pts:5,kind:'adequacy'},fruits_whole:{min:0.4,pts:5,kind:'adequacy'},
 vegetables_total:{min:1.1,pts:5,kind:'adequacy'},greens_beans:{min:0.2,pts:5,kind:'adequacy'},
 grains_whole:{min:1.5,pts:10,kind:'adequacy'},dairy:{min:1.3,pts:10,kind:'adequacy'},
 protein_total:{min:2.5,pts:5,kind:'adequacy'},seafood_plant:{min:0.8,pts:5,kind:'adequacy'},
 fatty_acids_ratio:{min:1.2,max:2.5,pts:10,kind:'adequacy_ratio'},
 grains_refined:{max:1.8,maxBad:4.3,pts:10,kind:'moderation'},
 sodium_g:{max:1.1,maxBad:2.0,pts:10,kind:'moderation'},
 added_sugars_pct:{max:6.5,maxBad:26,pts:10,kind:'moderation'},
 sat_fats_pct:{max:8,maxBad:16,pts:10,kind:'moderation'}
};
function num(v,d){v=Number(v);return isFinite(v)?v:(d==null?0:d);}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function per1000(v,e){return e>0?num(v)*1000/e:0;}function pct(k,e){return e>0?100*num(k)/e:0;}
function grade(total){total=num(total);return total>=90?'A':total>=80?'B':total>=70?'C':total>=60?'D':'F';}
function pointsAdequacy(value,s){return clamp(num(value)/s.min,0,1)*s.pts;}
function pointsModeration(value,s){value=num(value);if(value<=s.max)return s.pts;if(value>=s.maxBad)return 0;return (s.maxBad-value)/(s.maxBad-s.max)*s.pts;}
function componentObjects(density,points){var out={},k;for(k in STD){if(!Object.prototype.hasOwnProperty.call(STD,k))continue;out[k]={value:num(density[k]),points:num(points[k]),maxPoints:STD[k].pts,scorePct:STD[k].pts?num(points[k])/STD[k].pts*100:0,standard:STD[k]};}return out;}
function formulaAudit(){return w.NutritionFormulaRegistryP14?w.NutritionFormulaRegistryP14.audit(['hei.density','hei.adequacy_component','hei.moderation_component','hei.fatty_acid_ratio','hei.total']):null;}
function scoreDensity(density,intake,options){
 density=density||{};intake=intake||{};options=options||{};var energy=num(intake.energy_kcal,0),p={},k;
 if(!(energy>0)){for(k in STD)if(Object.prototype.hasOwnProperty.call(STD,k))p[k]=0;return {schemaVersion:2,version:VERSION,methodology:{id:'HEI-2020',energyBasis:'actual_ration_energy',canonical:options.canonical!==false,canonicalScoringFormula:options.canonical!==false,inputMapping:options.inputMapping||'adapter_reported'},density:density,points:p,components:componentObjects(density,p),total:0,grade:'F',energyRefKcal:0,intake:intake,valid:false,invalidReason:'empty_ration',formulaAudit:formulaAudit(),calculationWarnings:[]};}
 ['fruits_total','fruits_whole','vegetables_total','greens_beans','grains_whole','dairy','protein_total','seafood_plant'].forEach(function(n){p[n]=pointsAdequacy(density[n],STD[n]);});
 p.fatty_acids_ratio=clamp((num(density.fatty_acids_ratio)-STD.fatty_acids_ratio.min)/(STD.fatty_acids_ratio.max-STD.fatty_acids_ratio.min),0,1)*STD.fatty_acids_ratio.pts;
 ['grains_refined','sodium_g','added_sugars_pct','sat_fats_pct'].forEach(function(n){p[n]=pointsModeration(density[n],STD[n]);});
 var total=0;for(k in p)if(Object.prototype.hasOwnProperty.call(p,k))total+=num(p[k]);
 var warnings=[];if(options.requestedEnergyRefKcal!=null&&Math.abs(num(options.requestedEnergyRefKcal)-energy)>0.01)warnings.push({code:'REQUESTED_ENERGY_IGNORED',requested:num(options.requestedEnergyRefKcal),used:energy});
 return {schemaVersion:2,version:VERSION,methodology:{id:'HEI-2020',energyBasis:'actual_ration_energy',canonical:options.canonical!==false,canonicalScoringFormula:options.canonical!==false,inputMapping:options.inputMapping||'adapter_reported',addedSugarEnergy:'16_kcal_per_tsp_eq'},density:density,points:p,components:componentObjects(density,p),total:total,grade:grade(total),energyRefKcal:energy,intake:intake,valid:true,formulaAudit:formulaAudit(),calculationWarnings:warnings,compat:{requestedEnergyRefKcal:options.requestedEnergyRefKcal==null?null:num(options.requestedEnergyRefKcal),actualEnergyKcal:energy,requestedEnergyIgnored:warnings.length>0}};
}
function scoreIntake(intake,options){
 intake=intake||{};options=options||{};var energy=num(intake.energy_kcal,0);
 var protein=num(intake.protein_excl_legumes)+num(intake.legumes_as_protein);
 var vegetables=num(intake.vegetables_total)+num(intake.legumes_veg_total);
 var greens=num(intake.greens_beans)+num(intake.legumes_greens_beans);
 var sugarKcal,kcalField=Number(intake.added_sugars_kcal),tspEq=Number(intake.added_sugars_tsp_eq),tsp=Number(intake.added_sugars_tsp),grams=Number(intake.added_sugars_g);
 /* Positive source values take precedence over a stale derived zero. A literal zero is used only when no positive source exists. */
 /* HEI's native added-sugar input is teaspoon-equivalents. Prefer it, then grams, and use a direct kcal field only as a compatibility fallback. */
 if(isFinite(tspEq)&&tspEq>0)sugarKcal=tspEq*16;
 else if(isFinite(tsp)&&tsp>0)sugarKcal=tsp*16;
 else if(isFinite(grams)&&grams>0)sugarKcal=grams*4;
 else if(isFinite(kcalField)&&kcalField>0)sugarKcal=kcalField;
 else if(isFinite(tspEq))sugarKcal=Math.max(0,tspEq)*16;
 else if(isFinite(tsp))sugarKcal=Math.max(0,tsp)*16;
 else if(isFinite(grams))sugarKcal=Math.max(0,grams)*4;
 else sugarKcal=Math.max(0,num(kcalField));
 var sfa=num(intake.fatty_sfa_g),unsat=num(intake.fatty_unsat_g);
 var d={fruits_total:per1000(intake.fruits_total,energy),fruits_whole:per1000(intake.fruits_whole,energy),vegetables_total:per1000(vegetables,energy),greens_beans:per1000(greens,energy),grains_whole:per1000(intake.grains_whole,energy),grains_refined:per1000(intake.grains_refined,energy),dairy:per1000(intake.dairy,energy),protein_total:per1000(protein,energy),seafood_plant:per1000(intake.seafood_plant,energy),sodium_g:per1000(num(intake.sodium_mg)/1000,energy),added_sugars_pct:pct(sugarKcal,energy),sat_fats_pct:pct(sfa*9,energy),fatty_acids_ratio:sfa>0?unsat/sfa:(unsat>0?STD.fatty_acids_ratio.max:0)};
 var normalized={};Object.keys(intake).forEach(function(k){normalized[k]=intake[k];});normalized.energy_kcal=energy;normalized.added_sugars_kcal=sugarKcal;if(!isFinite(Number(normalized.added_sugars_g)))normalized.added_sugars_g=sugarKcal/4;
 return scoreDensity(d,normalized,{requestedEnergyRefKcal:options.requestedEnergyRefKcal,canonical:true,inputMapping:options.inputMapping||'adapter_reported'});
}
var api={version:VERSION,standards:STD,grade:grade,scoreIntake:scoreIntake,scoreDensity:scoreDensity};try{if(Object.freeze)Object.freeze(api);}catch(_){}w.HEI2020CoreV2=api;
})(window);

/* HEI-2020 input adapter — explicit equivalents first, audited fallbacks second. */
(function(w){'use strict';
var VERSION='v5.3.210-rc2-hf3-hei-adapter';
function num(v,d){v=Number(v);return isFinite(v)?v:(d==null?0:d);}function finite(v){return v!==null&&v!==''&&typeof v!=='boolean'&&isFinite(Number(v));}
function dbGet(db,key){if(!db)return null;if(db.byKey&&typeof db.byKey.get==='function')return db.byKey.get(key)||null;if(typeof db.get==='function')return db.get(key)||null;return db[key]||null;}
function mapData(){try{var el=document.getElementById('hei_map');return el?JSON.parse(el.textContent||'{}'):{};}catch(_){return {};}}
function methodFor(p,field){var q=w.ProductDataQualityV13;return q&&typeof q.methodFor==='function'?q.methodFor(p,field):(finite(p&&p[field])?'UNSPECIFIED':'MISSING');}
function field(p,field){return finite(p&&p[field])?Number(p[field]):null;}
function eqValue(p,fieldName,audit){var v=field(p,fieldName),method=methodFor(p,fieldName);audit.methods[method]=(audit.methods[method]||0)+1;if(v==null){audit.missing++;return null;}if(method==='ASSUMED_ZERO')audit.assumedZero++;else if(method==='MISSING'||method==='UNSPECIFIED'){audit.fallback++;}else audit.explicit++;return {value:v,method:method};}
function createAudit(){return {explicit:0,fallback:0,assumedZero:0,missing:0,conflicts:[],methods:{},derivedMassFromTsp:0};}
function confidence(a){var total=a.explicit+a.fallback+a.assumedZero+a.missing;if(!total)return 'LOW';var score=(a.explicit+0.65*a.fallback+0.1*a.assumedZero)/(total||1);return a.missing||score<0.45?'LOW':score<0.82?'MEDIUM':'HIGH';}
function adapt(ration,db){
 var c=w.__HEIClassifiers||{},hm=mapData();var audits={foodEquivalents:createAudit(),addedSugars:createAudit()};
 var acc={fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,grains_refined:0,dairy:0,protein_excl_legumes:0,legumes_as_protein:0,legumes_veg_total:0,legumes_greens_beans:0,seafood_plant:0,sodium_mg:0,fatty_sfa_g:0,fatty_unsat_g:0,added_sugars_g:0,added_sugars_tsp_eq:0,added_sugars_tsp:0,added_sugars_kcal:0,energy_kcal:0};
 function is(fn,p){try{return typeof c[fn]==='function'&&c[fn](p);}catch(_){return false;}}
 function fallback(target,g,denom){if(denom&&isFinite(denom)&&denom>0){acc[target]+=g/denom;audits.foodEquivalents.fallback++;return true;}return false;}
 function explicit(p,g,fieldName,target){var q=eqValue(p,fieldName,audits.foodEquivalents);if(!q)return false;acc[target]+=g*q.value/100;return true;}
 (Array.isArray(ration)?ration:[]).forEach(function(it){var g=Math.max(0,num(it&&it.grams)),p=dbGet(db,it&&it.key);if(!(g>0)||!p)return;
  acc.energy_kcal+=g*num(p.kcal)/100;acc.sodium_mg+=g*num(p.sodium_mg)/100;acc.fatty_sfa_g+=g*num(p.sfa)/100;acc.fatty_unsat_g+=g*num(p.unsat)/100;
  var legume=is('isLegume',p),veg=is('isVeg',p),fruit=is('isFruit',p),leafy=is('isLeafy',p),wholeGrain=is('isWholeGrain',p),refined=is('isRefinedGrain',p),protein=is('isProteinFood',p),seaPlant=is('isSeafoodPlantProtein',p);
  var fruitUsed=explicit(p,g,'fruit_cup_eq_per_100g','fruits_total');var wholeFruitUsed=explicit(p,g,'whole_fruit_cup_eq_per_100g','fruits_whole');
  var v=eqValue(p,'veg_cup_eq_per_100g',audits.foodEquivalents);var vegUsed=!!v;if(v){if(legume)acc.legumes_veg_total+=g*v.value/100;else acc.vegetables_total+=g*v.value/100;}
  var gb=eqValue(p,'greens_beans_cup_eq_per_100g',audits.foodEquivalents);var greensUsed=!!gb;if(gb){if(legume)acc.legumes_greens_beans+=g*gb.value/100;else acc.greens_beans+=g*gb.value/100;}
  var dairyUsed=explicit(p,g,'dairy_cup_eq_per_100g','dairy'),wgUsed=explicit(p,g,'whole_grain_oz_eq_per_100g','grains_whole'),rgUsed=explicit(p,g,'refined_grain_oz_eq_per_100g','grains_refined');
  var pr=eqValue(p,'protein_oz_eq_per_100g',audits.foodEquivalents);if(pr){if(legume)acc.legumes_as_protein+=g*pr.value/100;else acc.protein_excl_legumes+=g*pr.value/100;}
  var spUsed=explicit(p,g,'seafood_plant_oz_eq_per_100g','seafood_plant');
  var tsp=eqValue(p,'added_sugars_tsp_eq_per_100g',audits.addedSugars),grams=field(p,'added_sugar'),gramsMethod=methodFor(p,'added_sugar');
  var useTsp=!!tsp&&!(tsp.value===0&&(tsp.method==='ASSUMED_ZERO'||tsp.method==='MISSING'||tsp.method==='UNSPECIFIED')&&grams>0);
  if(useTsp){var t=g*tsp.value/100;acc.added_sugars_tsp_eq+=t;acc.added_sugars_tsp+=t;acc.added_sugars_kcal+=t*16;acc.added_sugars_g+=t*4;audits.addedSugars.derivedMassFromTsp+=t*4;if(grams!=null&&Math.abs(g*grams/100-t*4)>0.5)audits.addedSugars.conflicts.push({key:it.key,selected:'tsp_equivalent'});}
  else if(grams!=null){var sg=g*grams/100;acc.added_sugars_g+=sg;acc.added_sugars_kcal+=sg*4;acc.added_sugars_tsp_eq+=sg/4;acc.added_sugars_tsp+=sg/4;audits.addedSugars.methods[gramsMethod]=(audits.addedSugars.methods[gramsMethod]||0)+1;if(gramsMethod==='ASSUMED_ZERO')audits.addedSugars.assumedZero++;else if(gramsMethod==='MISSING'||gramsMethod==='UNSPECIFIED')audits.addedSugars.fallback++;else audits.addedSugars.explicit++;}
  else {audits.addedSugars.missing++;}
  if(!vegUsed&&veg)fallback('vegetables_total',g,typeof c.vegetableCupEqGrams==='function'?c.vegetableCupEqGrams(p):130);
  if(!greensUsed&&leafy)fallback('greens_beans',g,typeof c.greensBeansCupEqGrams==='function'?c.greensBeansCupEqGrams(p):130);
  if(!vegUsed&&legume&&!veg)fallback('legumes_veg_total',g,typeof c.legumeCupEqGrams==='function'?c.legumeCupEqGrams(p):172);
  if(!greensUsed&&legume&&!leafy)fallback('legumes_greens_beans',g,typeof c.legumeCupEqGrams==='function'?c.legumeCupEqGrams(p):172);
  if(!fruitUsed&&fruit)fallback('fruits_total',g,typeof c.fruitCupEqGrams==='function'?c.fruitCupEqGrams(p):150);
  if(!wholeFruitUsed&&fruit)fallback('fruits_whole',g,typeof c.fruitCupEqGrams==='function'?c.fruitCupEqGrams(p):150);
  if(!dairyUsed){var de=typeof c.dairyCupEqGrams==='function'?c.dairyCupEqGrams(p):null;if(de)fallback('dairy',g,de);}
  if(!wgUsed&&wholeGrain)fallback('grains_whole',g,typeof c.grainOzEqGrams==='function'?c.grainOzEqGrams(p):(hm.oz_eq&&hm.oz_eq['grain.cooked']||85));
  if(!rgUsed&&refined)fallback('grains_refined',g,typeof c.grainOzEqGrams==='function'?c.grainOzEqGrams(p):(hm.oz_eq&&hm.oz_eq['grain.cooked']||85));
  if(!pr&&protein){var ozg=typeof c.proteinOzEqGrams==='function'?c.proteinOzEqGrams(p):28.35;if(legume)fallback('legumes_as_protein',g,ozg);else fallback('protein_excl_legumes',g,ozg);}
  if(!spUsed&&seaPlant)fallback('seafood_plant',g,typeof c.proteinOzEqGrams==='function'?c.proteinOzEqGrams(p):28.35);
 });
 audits.foodEquivalents.confidence=confidence(audits.foodEquivalents);audits.addedSugars.confidence=confidence(audits.addedSugars);
 var dq=w.ProductDataQualityV13,quality={foodEquivalents:audits.foodEquivalents,addedSugars:audits.addedSugars};
 if(dq&&typeof dq.nutrientAnalysis==='function'){quality.sodium=dq.nutrientAnalysis(ration,db,'sodium_mg');quality.saturatedFat=dq.nutrientAnalysis(ration,db,'sfa');quality.addedSugarNutrient=dq.nutrientAnalysis(ration,db,'added_sugar');}
 acc.fieldAudit=audits;acc.dataQuality=quality;acc.adapterVersion=VERSION;return acc;
}
var api={version:VERSION,adapt:adapt};try{if(Object.freeze)Object.freeze(api);}catch(_){}w.HEI2020InputAdapterV2=api;
})(window);

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


/* Nutrition Calculator v5.3.210-p0.3.2.1 — Independent Safety Revalidation & Stability Hardening
 * Central capability policy for pregnancy, lactation, eating-disorder risk,
 * medical restrictions and clinician-supervised states.
 * Clinical states are external-target-only: this module never creates a treatment target.
 */
(function(){
  'use strict';

  var CLINICAL_STATES = Object.freeze({preop:1,postop:1,icu:1,ckd:1,dialysis:1,oncology:1});
  var PROTECTED_GUARDRAILS = Object.freeze({pregnancy:1,lactation:1,ed_risk:1,medical_restriction:1});
  var NASEM_PAL = Object.freeze({inactive:'inactive',low_active:'low',active:'active',very_active:'very'});
  var CLINICAL_ROLES = Object.freeze({physician:1,clinical_dietitian:1,multidisciplinary_team:1,other_clinician:1});
  var CLINICAL_PHASES = Object.freeze({stable:1,acute_early:1,acute_late:1,recovery:1,preoperative:1,postoperative:1,active_treatment:1,other:1});
  var CLINICAL_ROUTES = Object.freeze({oral:1,enteral:1,parenteral:1,mixed:1});
  var CLINICAL_TARGET_MAX_AGE_DAYS = 366;
  var DAY_MS = 86400000;
  var LIFE_STAGE_TRACKED_KEYS = Object.freeze(((window.NutritionNormativeRegistry && window.NutritionNormativeRegistry.data && window.NutritionNormativeRegistry.data.tracked_life_stage_keys) || []).slice());
  var EVIDENCE_REGISTRY = (window.NutritionNormativeRegistry && window.NutritionNormativeRegistry.data && window.NutritionNormativeRegistry.data.sources) || Object.freeze({});
  function formulaProvenance(id){var map={nasem_pregnancy_2023:'energy.nasem_pregnancy_2023',nasem_lactation_2023:'energy.nasem_lactation_2023',nasem_adult_female_2023:'energy.nasem_adult_female_2023'};var fr=window.NutritionFormulaRegistryP14,fid=map[id]||id;if(fr&&fr.get){var f=fr.get(fid);return {registryVersion:fr.version,registrySha256:fr.sourceSha256,reviewedAt:fr.data&&fr.data.reviewed_at||null,formulaId:fid,sourceIds:f?(f.source_ids||[]).slice():[]};}var r=window.NutritionNormativeRegistry;return {registryVersion:r&&r.version||null,registrySha256:r&&r.sourceSha256||null,reviewedAt:r&&r.reviewedAt||null,formulaId:id,sourceIds:(r&&r.data&&r.data.energy_formulas&&r.data.energy_formulas[id]&&r.data.energy_formulas[id].source_ids||[]).slice()};}

  function finite(v){ if(v==null||String(v).trim()==='')return null; v=Number(v); return Number.isFinite(v)?v:null; }
  function round(v,d){ var p=Math.pow(10,d||0); return Math.round((Number(v)+Number.EPSILON)*p)/p; }
  function text(id, fallback){ var el=document.getElementById(id); return el ? String(el.value||'') : (fallback||''); }
  function checked(id){ var el=document.getElementById(id); return !!(el && el.checked); }
  function bmi(weight,height){ weight=finite(weight);height=finite(height);return weight&&height?weight/Math.pow(height/100,2):null; }
  function region(){ try{return window.State&&State.getRegion?String(State.getRegion()||'us'):'us';}catch(_){return 'us';} }
  function nonEmpty(v){ return String(v==null?'':v).trim(); }
  function dateValue(v){
    v=nonEmpty(v); var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v); if(!m)return null;
    var y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
    if(y<1900||y>2200||mo<1||mo>12||d<1||d>31)return null;
    var ts=Date.UTC(y,mo-1,d), check=new Date(ts);
    if(check.getUTCFullYear()!==y||check.getUTCMonth()!==mo-1||check.getUTCDate()!==d)return null;
    return ts;
  }
  function localTodayValue(){ var d=new Date(); return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()); }
  function validationToday(input){ var explicit=input&&dateValue(input.validationToday); return explicit!=null?explicit:localTodayValue(); }

  function equationLevel(pal){ return NASEM_PAL[String(pal||'')] || null; }
  function adultFemaleTee(pal, age, height, weight){
    age=finite(age);height=finite(height);weight=finite(weight);
    var level=equationLevel(pal);
    if(age==null||height==null||weight==null||!level)return null;
    var equations={
      inactive:function(){return 584.90-7.01*age+5.72*height+11.71*weight;},
      low:function(){return 575.77-7.01*age+6.60*height+12.14*weight;},
      active:function(){return 710.25-7.01*age+6.54*height+12.34*weight;},
      very:function(){return 511.83-7.01*age+9.07*height+12.56*weight;}
    };
    return Math.max(0,equations[level]());
  }

  function pregnancyTee(pal, age, height, currentWeight, gestationWeek, prepregWeight){
    age=finite(age);height=finite(height);currentWeight=finite(currentWeight);gestationWeek=finite(gestationWeek);prepregWeight=finite(prepregWeight);
    var level=equationLevel(pal);
    if([age,height,currentWeight,gestationWeek,prepregWeight].some(function(v){return v==null;})||!level)return null;
    if(gestationWeek<=13){
      var first=adultFemaleTee(pal,age,height,currentWeight);
      return first==null?null:{target:round(first,0),deposition:0,prepregBmi:round(bmi(prepregWeight,height),1),trimester:1,pal:String(pal),method:'nasem_2023_pregnancy_first_trimester',provenance:formulaProvenance('nasem_pregnancy_2023')};
    }
    var base;
    if(level==='inactive') base=1131.20-2.04*age+0.34*height+12.15*currentWeight+9.16*gestationWeek;
    else if(level==='low') base=693.35-2.04*age+5.73*height+10.20*currentWeight+9.16*gestationWeek;
    else if(level==='active') base=-223.84-2.04*age+13.23*height+8.15*currentWeight+9.16*gestationWeek;
    else base=-779.72-2.04*age+18.45*height+8.73*currentWeight+9.16*gestationWeek;
    var pbmi=bmi(prepregWeight,height), dep=200;
    if(pbmi!=null&&pbmi<18.5)dep=300;
    else if(pbmi!=null&&pbmi>=25&&pbmi<30)dep=150;
    else if(pbmi!=null&&pbmi>=30)dep=-50;
    return {target:round(Math.max(0,base+dep),0),deposition:dep,prepregBmi:pbmi==null?null:round(pbmi,1),trimester:gestationWeek<=27?2:3,pal:String(pal),method:'nasem_2023_pregnancy_second_third',provenance:formulaProvenance('nasem_pregnancy_2023')};
  }

  function lactationTee(pal, age, height, currentWeight, postpartumMonth, feeding){
    var base=adultFemaleTee(pal,age,height,currentWeight), month=finite(postpartumMonth);
    if(base==null||month==null)return null;
    var increment=null, phase='';
    if(month<=6 && feeding==='exclusive'){ increment=404; phase='exclusive_0_6'; }
    else if(month>6 && month<=12 && feeding==='partial'){ increment=380; phase='partial_7_12'; }
    if(increment==null)return null;
    return {target:round(base+increment,0),base:round(base,0),increment:increment,phase:phase,pal:String(pal),method:'nasem_2023_lactation',provenance:formulaProvenance('nasem_lactation_2023')};
  }

  function lifeStageTargetsFromRegistry(input, stage){
    var registry=window.NutritionNormativeRegistry;
    if(!registry||typeof registry.resolveLifeStageProfile!=='function')return null;
    return registry.resolveLifeStageProfile({
      region:String(input.region||'us'), stage:stage, age:finite(input.age), sex:'female',
      gestationWeek:finite(input.gestationWeek), prepregWeight:finite(input.prepregWeight),
      currentWeight:finite(input.currentWeight), postpartumMonth:finite(input.postpartumMonth), feeding:String(input.feeding||'unknown')
    });
  }
  function pregnancyTargets(input){ return lifeStageTargetsFromRegistry(input||{},'pregnancy'); }
  function lactationTargets(input){ return lifeStageTargetsFromRegistry(input||{},'lactation'); }

  function clinicalTargetFrom(input){
    var target={
      energy:finite(input.clinicalEnergyManual), protein:finite(input.clinicalProteinManual), referenceWeightKg:finite(input.clinicalReferenceWeight),
      confirmedBy:nonEmpty(input.clinicalConfirmedBy), confirmedRole:nonEmpty(input.clinicalConfirmedRole), confirmedAt:nonEmpty(input.clinicalConfirmedAt),
      reviewDueAt:nonEmpty(input.clinicalReviewDueAt), sourceMethod:nonEmpty(input.clinicalSourceMethod), phase:nonEmpty(input.clinicalPhase),
      route:nonEmpty(input.clinicalRoute), sourceNote:nonEmpty(input.clinicalSourceNote)
    };
    target.confirmedAtTs=dateValue(target.confirmedAt); target.reviewDueAtTs=dateValue(target.reviewDueAt);
    return target;
  }

  function validateClinicalTarget(input, required){
    input=input||{};
    var t=clinicalTargetFrom(input), errors=[], warnings=[], today=validationToday(input);
    var minConfirmed=today-CLINICAL_TARGET_MAX_AGE_DAYS*DAY_MS, maxReviewSpan=CLINICAL_TARGET_MAX_AGE_DAYS*DAY_MS;
    if(!input.clinicalTargetsConfirmed)errors.push('Подтвердите, что внешняя клиническая цель введена из назначения специалиста.');
    if(t.energy==null||t.energy<300||t.energy>10000)errors.push('Укажите внешнюю цель энергии в техническом диапазоне 300–10000 ккал/сут.');
    if(t.protein==null||t.protein<1||t.protein>500)errors.push('Укажите внешнюю цель белка в техническом диапазоне 1–500 г/сут.');
    if(t.referenceWeightKg==null||t.referenceWeightKg<15||t.referenceWeightKg>400)errors.push('Укажите расчётную/сухую массу, к которой относится внешняя цель.');
    if(t.confirmedBy.length<2)errors.push('Укажите имя или идентификатор специалиста, подтвердившего цель.');
    if(!CLINICAL_ROLES[t.confirmedRole])errors.push('Выберите допустимую роль специалиста из списка.');
    if(!t.confirmedAt)errors.push('Укажите дату подтверждения внешней цели.');
    else if(!t.confirmedAtTs)errors.push('Дата подтверждения внешней цели календарно некорректна.');
    if(t.confirmedAtTs&&t.confirmedAtTs>today)errors.push('Дата подтверждения внешней цели не может быть в будущем.');
    if(t.confirmedAtTs&&t.confirmedAtTs<minConfirmed)errors.push('Внешняя цель подтверждена более 366 дней назад; требуется актуализация.');
    if(!t.reviewDueAt)errors.push('Укажите дату обязательного пересмотра цели.');
    else if(!t.reviewDueAtTs)errors.push('Дата обязательного пересмотра календарно некорректна.');
    if(t.confirmedAtTs&&t.reviewDueAtTs&&t.reviewDueAtTs<t.confirmedAtTs)errors.push('Дата пересмотра не может быть раньше даты подтверждения.');
    if(t.reviewDueAtTs&&t.reviewDueAtTs<today)errors.push('Срок действия внешней цели истёк; требуется актуальное подтверждение.');
    if(t.confirmedAtTs&&t.reviewDueAtTs&&t.reviewDueAtTs-t.confirmedAtTs>maxReviewSpan)errors.push('Срок действия цели превышает технический предел 366 дней; задайте дату пересмотра не позднее года от подтверждения.');
    if(t.sourceMethod.length<5)errors.push('Укажите источник или метод формирования цели.');
    if(!CLINICAL_PHASES[t.phase])errors.push('Выберите допустимую клиническую фазу из списка.');
    if(!CLINICAL_ROUTES[t.route])errors.push('Выберите допустимый путь питания из списка.');
    if((t.confirmedRole==='other_clinician'||t.phase==='other')&&t.sourceNote.length<5)errors.push('Для варианта «другой специалист» или «другая фаза» уточните контекст в примечании.');
    t.valid=errors.length===0; t.errors=errors; t.warnings=warnings; t.required=!!required;
    return t;
  }

  function evaluate(input){
    input=input||{};
    var state=String(input.state||'normal'), guardrail=String(input.guardrail||'none');
    var additionalEdRisk=!!input.additionalEdRisk, additionalMedicalRestriction=!!input.additionalMedicalRestriction, additionalClinicalConditions=!!input.additionalClinicalConditions;
    var edRiskActive=guardrail==='ed_risk'||additionalEdRisk;
    var medicalRestrictionActive=guardrail==='medical_restriction'||additionalMedicalRestriction;
    var reasons=[],errors=[],warnings=[], lifeStage=null, clinical=!!CLINICAL_STATES[state];
    var lifeStageGuardrail=guardrail==='pregnancy'||guardrail==='lactation';
    var externalTargetOnly=clinical||(!lifeStageGuardrail&&(edRiskActive||medicalRestrictionActive));
    var protectedMode=clinical||!!PROTECTED_GUARDRAILS[guardrail]||edRiskActive||medicalRestrictionActive||additionalClinicalConditions;
    var policy={
      version:'v5.3.210-p0.3.2.1', protectedMode:protectedMode, state:state, guardrail:guardrail, externalTargetOnly:externalTargetOnly,
      additionalEdRisk:additionalEdRisk, additionalMedicalRestriction:additionalMedicalRestriction, additionalClinicalConditions:additionalClinicalConditions,
      edRiskActive:edRiskActive, medicalRestrictionActive:medicalRestrictionActive,
      status:protectedMode?'protected':'standard', estimateOnly:protectedMode,
      goalFactorAllowed:!protectedMode, normsSyncAllowed:!protectedMode, mealSplitAllowed:!protectedMode,
      automaticPlannerAllowed:!protectedMode, geminiAllowed:!protectedMode, localRecommendationsAllowed:!protectedMode, fluidEstimateAllowed:!protectedMode,
      calculationAllowed:true, lifeStageCalculationAllowed:true,
      manualClinicalEnergyReady:false, manualClinicalEnergy:null, manualClinicalProteinReady:false, manualClinicalProtein:null,
      clinicalTargetReady:false, clinicalTarget:null, reasons:reasons,warnings:warnings,errors:errors
    };

    if(additionalClinicalConditions){
      errors.push('Отмечены дополнительные клинические состояния. До внедрения модели clinicalContexts[] автоматический расчёт потребностей выполняться не может.');
      policy.calculationAllowed=false; policy.status='blocked';
    }

    if(externalTargetOnly){
      if(clinical) reasons.push('Профиль «'+state+'» работает только с внешней клинической целью; универсальные коэффициенты энергии и белка удалены из рабочего пути.');
      else if(edRiskActive) reasons.push('При текущем или недавнем риске РПП автоматическая энергетическая и белковая цель не формируется; для числового сопоставления требуется внешняя цель специалиста.');
      else reasons.push('При неуточнённых медицинских ограничениях автоматическая цель потребностей не формируется; для числового сопоставления требуется внешняя цель специалиста.');
      var clinicalAge=finite(input.age);
      if(clinicalAge!=null&&clinicalAge<18)errors.push('Защищённые внешние цели для пациентов младше 18 лет требуют отдельного педиатрического клинического контура.');
      var validated=validateClinicalTarget(input,true);
      policy.clinicalTarget=validated;
      if(validated.valid&&!additionalClinicalConditions){
        policy.clinicalTargetReady=true;
        policy.manualClinicalEnergyReady=true; policy.manualClinicalEnergy=validated.energy;
        policy.manualClinicalProteinReady=true; policy.manualClinicalProtein=validated.protein;
        reasons.push('Применяется актуальная внешняя цель с указанным происхождением и сроком пересмотра; калькулятор не выводит её из состояния, диагноза или универсального коэффициента.');
      }else{
        validated.errors.forEach(function(x){errors.push(x);});
        policy.calculationAllowed=false; policy.status='blocked';
      }
    }

    if(edRiskActive)reasons.push('При риске РПП отключены дефицит/профицит, распределение по приёмам, автоматические замены и AI-планирование.');
    if(medicalRestrictionActive)reasons.push('Неуточнённые медицинские ограничения переводят калькулятор в режим фактического анализа без автоматических назначений.');

    if(guardrail==='pregnancy'||guardrail==='lactation'){
      lifeStage=guardrail; policy.lifeStage=lifeStage;
      var normativeRegistry=window.NutritionNormativeRegistry, normativeAudit=normativeRegistry&&typeof normativeRegistry.audit==='function'?normativeRegistry.audit():null;
      if(!normativeAudit||!normativeAudit.ok)errors.push('Нормативный реестр отсутствует, просрочен или не прошёл самопроверку; жизненный расчёт заблокирован.');
      policy.normsSyncAllowed=false; policy.automaticPlannerAllowed=false; policy.geminiAllowed=false; policy.localRecommendationsAllowed=false;
      policy.goalFactorAllowed=false; policy.estimateOnly=true; policy.fluidEstimateAllowed=false; policy.mealSplitAllowed=false;
      var sex=String(input.sex||''), age=finite(input.age), nasemPal=String(input.nasemPal||'unknown');
      if(sex!=='female')errors.push('Для профиля «'+(guardrail==='pregnancy'?'Беременность':'Лактация')+'» выберите женский пол.');
      if(age==null||age<19||age>50)errors.push('Автоматический жизненный расчёт реализован для диапазона 19–50 лет; вне него нужен отдельный профиль.');
      if(!NASEM_PAL[nasemPal])errors.push('Выберите отдельную категорию активности NASEM: inactive, low active, active или very active.');
      if(clinical)errors.push('Сочетание жизненного и клинического профиля не рассчитывается автоматически. Используйте фактический анализ и индивидуальную клиническую цель.');
      if(edRiskActive)errors.push('Сочетание беременности или лактации с текущим/недавним риском РПП требует отдельного наблюдения; автоматическая энергетическая цель не формируется.');
      if(medicalRestrictionActive)errors.push('Сочетание беременности или лактации с неуточнёнными медицинскими ограничениями требует индивидуальной проверки; автоматическая энергетическая цель не формируется.');
      if(additionalClinicalConditions)errors.push('Дополнительные клинические состояния требуют отдельной многоконтекстной модели; жизненная EER не формируется.');
      if(String(input.edema||'no')==='yes')errors.push('При отёках или асците текущая масса может быть ненадёжной, поэтому автоматический жизненный EER не рассчитывается.');
      if(input.refeedingHighRisk)errors.push('При высоком риске рефидинга жизненный профиль не формирует автоматическую энергетическую цель.');
      if(guardrail==='pregnancy'){
        var week=finite(input.gestationWeek), pw=finite(input.prepregWeight), fetus=String(input.fetusCount||'unknown');
        if(week==null||week<1||week>42)errors.push('Укажите срок беременности от 1 до 42 недель.');
        if(pw==null||pw<15||pw>300)errors.push('Укажите добеременную массу: она нужна для классификации исходного ИМТ и белкового ориентира.');
        if(pw!=null&&finite(input.currentWeight)!=null&&finite(input.currentWeight)<pw)warnings.push('Текущая масса ниже добеременной: проверьте ввод и интерпретируйте результат только вместе с динамикой массы и акушерским контекстом.');
        if(fetus==='unknown')errors.push('Подтвердите число плодов; одноплодность не устанавливается по умолчанию.');
        else if(fetus!=='singleton')errors.push('Многоплодная беременность требует отдельного расчёта; стандартная формула не применяется.');
        if(String(input.pregnancyComplications||'unknown')!=='none')errors.push('При осложнениях или неизвестном статусе осложнений автоматический расчёт беременности отключён.');
      } else {
        var month=finite(input.postpartumMonth), feeding=String(input.feeding||'unknown');
        if(month==null||month<0||month>12)errors.push('Укажите месяц после родов от 0 до 12; более поздняя лактация требует отдельной оценки.');
        if(!((month!=null&&month<=6&&feeding==='exclusive')||(month!=null&&month>6&&feeding==='partial'))){
          errors.push('Автоматическая энергетическая поправка доступна для исключительно грудного вскармливания 0–6 месяцев или частичного вскармливания 7–12 месяцев. Для другого объёма лактации требуется индивидуальная оценка продукции молока.');
        }
      }
      if(errors.length){policy.lifeStageCalculationAllowed=false;policy.calculationAllowed=false;policy.status='blocked';}
      else reasons.push('Жизненный профиль рассчитан как справочный EER/DRI для неосложнённого сценария с явно выбранной категорией NASEM PAL; цель изменения массы не применяется.');
    }
    if(input.refeedingHighRisk){
      policy.protectedMode=true;policy.estimateOnly=true;policy.goalFactorAllowed=false;policy.normsSyncAllowed=false;policy.mealSplitAllowed=false;policy.automaticPlannerAllowed=false;policy.geminiAllowed=false;policy.localRecommendationsAllowed=false;policy.fluidEstimateAllowed=false;
      reasons.push('Высокий риск рефидинга имеет приоритет над всеми другими режимами.');
    }
    policy.status=(errors.length||policy.calculationAllowed===false)?'blocked':(policy.protectedMode?'protected':'standard');
    policy.primaryReason=errors[0]||reasons[0]||'';
    return policy;
  }

  function currentRefeedingHighRisk(){
    try{
      var qa=window.NutritionNeedsFormulaQA;
      if(qa&&typeof qa.assessAdultRefeedingRisk==='function'){
        var h=finite(text('needs_h','')),w=finite(text('needs_w',''));
        var result=qa.assessAdultRefeedingRisk({
          age:finite(text('needs_age','')),bmi:bmi(w,h),currentWeight:w,previousWeight:finite(text('needs_prev_w','')),
          lowIntakeDays:finite(text('needs_low_intake_days','')),electrolytes:text('needs_electrolytes','unknown'),additionalFactors:text('needs_refeeding_factors','unknown')
        });
        return !!(result&&result.highRisk);
      }
    }catch(_){}
    return !!(window.__lastNeedsMeta&&window.__lastNeedsMeta.refeedingRisk&&window.__lastNeedsMeta.refeedingRisk.highRisk);
  }

  function readContext(){
    return {
      state:text('needs_state','normal'),guardrail:text('needs_guardrail','none'),sex:text('needs_sex','male'),edema:text('needs_edema','no'),
      age:finite(text('needs_age','')),height:finite(text('needs_h','')),currentWeight:finite(text('needs_w','')),activity:text('needs_activity','low'),nasemPal:text('needs_nasem_pal','unknown'),
      gestationWeek:finite(text('needs_gestation_week','')),prepregWeight:finite(text('needs_prepreg_w','')),fetusCount:text('needs_fetus_count','unknown'),pregnancyComplications:text('needs_pregnancy_complications','unknown'),
      additionalEdRisk:checked('needs_additional_ed_risk'),additionalMedicalRestriction:checked('needs_additional_medical_restriction'),additionalClinicalConditions:checked('needs_additional_clinical_conditions'),
      postpartumMonth:finite(text('needs_postpartum_month','')),feeding:text('needs_lactation_feeding','unknown'),
      clinicalTargetsConfirmed:checked('needs_clinical_targets_confirmed'),clinicalEnergyManual:finite(text('needs_clinical_energy_manual','')),clinicalProteinManual:finite(text('needs_protein_manual','')),
      clinicalReferenceWeight:finite(text('needs_clinical_reference_weight','')),clinicalConfirmedBy:text('needs_clinical_confirmed_by',''),clinicalConfirmedRole:text('needs_clinical_confirmed_role','unknown'),
      clinicalConfirmedAt:text('needs_clinical_confirmed_at',''),clinicalReviewDueAt:text('needs_clinical_review_due_at',''),clinicalSourceMethod:text('needs_clinical_source_method',''),
      clinicalPhase:text('needs_clinical_phase','unknown'),clinicalRoute:text('needs_clinical_route','unknown'),clinicalSourceNote:text('needs_clinical_source_note',''),region:region(),
      refeedingHighRisk:currentRefeedingHighRisk()
    };
  }

  function calculateLifeStage(input){
    input=Object.assign({},input||{}); var p=evaluate(input); if(!p.calculationAllowed||!p.lifeStage)return null;
    var e=p.lifeStage==='pregnancy'
      ? pregnancyTee(input.nasemPal,input.age,input.height,input.currentWeight,input.gestationWeek,input.prepregWeight)
      : lactationTee(input.nasemPal,input.age,input.height,input.currentWeight,input.postpartumMonth,input.feeding);
    if(!e)return null;
    var targets=p.lifeStage==='pregnancy'?pregnancyTargets(input):lactationTargets(input);
    return {lifeStage:p.lifeStage,energy:e,targets:targets,policy:p};
  }

  function lifeStageNutrientReference(key,input){
    input=Object.assign({},input||readContext());
    var p=evaluate(input), active=p.lifeStage==='pregnancy'||p.lifeStage==='lactation';
    if(!active)return null;
    var stageLabel=p.lifeStage==='pregnancy'?'беременность':'лактация';
    if(!p.calculationAllowed)return {active:true,valid:false,suppressAdult:true,allowAdultUpperLimit:false,min:null,ul:null,safe:null,coverageStatus:'blocked',profile:'Защищённый жизненный профиль: '+stageLabel,basis:'жизненный профиль не завершён',note:(p.errors||[]).join(' ')};
    var ls=calculateLifeStage(input), targets=ls&&ls.targets?ls.targets:null;
    if(!targets)return {active:true,valid:false,suppressAdult:true,allowAdultUpperLimit:false,min:null,ul:null,safe:null,coverageStatus:'unavailable',profile:'Защищённый жизненный профиль: '+stageLabel,basis:'жизненный профиль',note:'Расчёт жизненных ориентиров недоступен.'};
    var target=targets[key], stageMeta=targets._lifeStage||{}, regionCode=String(input.region||region()), coverage=targets._coverage&&targets._coverage[key]?targets._coverage[key]:{status:'unavailable'};
    var upper=targets._upperLimits&&targets._upperLimits[key]?targets._upperLimits[key]:undefined;
    if(target&&Number.isFinite(Number(target.value)))return {active:true,valid:true,suppressAdult:true,allowAdultUpperLimit:regionCode==='us',min:{type:target.type||(regionCode==='eu'?'EFSA DRV':'US DRI'),value:Number(target.value),provenance:target.provenance||null},ul:upper,safe:null,coverageStatus:coverage.status,basis:target.basis||'жизненный профиль',profile:'Защищённый жизненный профиль: '+stageLabel,note:stageMeta.note||'',provenance:target.provenance||null};
    return {active:true,valid:true,suppressAdult:true,allowAdultUpperLimit:regionCode==='us',min:null,ul:upper,safe:null,coverageStatus:coverage.status,basis:regionCode==='eu'?'EFSA DRV — проверенный поднабор':'US DRI — жизненный профиль',profile:'Защищённый жизненный профиль: '+stageLabel,note:coverage.note||'Для этого показателя жизненное значение не подтверждено; обычная взрослая норма намеренно не подставляется.'};
  }

  function currentPolicy(){return evaluate(readContext());}

  function htmlEscape(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function renderUi(){
    var root=document.getElementById('needsProtectedModeContext'); if(!root)return;
    var c=readContext(), p=evaluate(c), preg=document.getElementById('needsPregnancyFields'), lact=document.getElementById('needsLactationFields'), lifePal=document.getElementById('needsLifeStagePalField'), clinical=document.getElementById('needsClinicalModeFields');
    if(preg)preg.hidden=c.guardrail!=='pregnancy'; if(lact)lact.hidden=c.guardrail!=='lactation'; if(lifePal)lifePal.hidden=!(c.guardrail==='pregnancy'||c.guardrail==='lactation');
    if(clinical)clinical.hidden=!p.externalTargetOnly;
    root.open=!!(p.protectedMode||p.errors.length);
    var status=document.getElementById('needsProtectedModeStatus'); if(status){
      var label=p.status==='blocked'?'Автоматический расчёт заблокирован':(p.protectedMode?'Защищённый режим активен':'Обычный режим');
      var details=(p.errors.length?p.errors:p.reasons.concat(p.warnings||[])).slice(0,4).join(' ');
      status.innerHTML='<strong>'+htmlEscape(label)+'</strong><div class="small" style="margin-top:4px;">'+htmlEscape(details||'Ограничения не активны.')+'</div>';
      status.className='alert'+(p.status==='blocked'?' alert-danger':'');
    }
  }

  function init(){
    ['needs_state','needs_guardrail','needs_sex','needs_age','needs_h','needs_w','needs_activity','needs_nasem_pal','needs_gestation_week','needs_prepreg_w','needs_fetus_count','needs_pregnancy_complications','needs_postpartum_month','needs_lactation_feeding','needs_additional_ed_risk','needs_additional_medical_restriction','needs_additional_clinical_conditions','needs_clinical_energy_manual','needs_protein_manual','needs_clinical_reference_weight','needs_clinical_confirmed_by','needs_clinical_confirmed_role','needs_clinical_confirmed_at','needs_clinical_review_due_at','needs_clinical_source_method','needs_clinical_phase','needs_clinical_route','needs_clinical_source_note','needs_clinical_targets_confirmed'].forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      el.addEventListener('change',renderUi);el.addEventListener('input',renderUi);
    });
    window.addEventListener('norm:region-changed',renderUi);renderUi();
  }

  window.ProtectedModesP03=Object.freeze({
    version:'v5.3.210-p0.3.2.1',evaluate:evaluate,readContext:readContext,currentPolicy:currentPolicy,
    calculateLifeStage:calculateLifeStage,adultFemaleTee:adultFemaleTee,pregnancyTee:pregnancyTee,lactationTee:lactationTee,
    pregnancyTargets:pregnancyTargets,lactationTargets:lactationTargets,lifeStageNutrientReference:lifeStageNutrientReference,renderUi:renderUi,
    validateClinicalTarget:validateClinicalTarget,trackedLifeStageKeys:LIFE_STAGE_TRACKED_KEYS,evidence:EVIDENCE_REGISTRY,dateValue:dateValue,clinicalTargetMaxAgeDays:CLINICAL_TARGET_MAX_AGE_DAYS,
    isClinicalState:function(s){return !!CLINICAL_STATES[String(s||'')];}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

  (function(){
  var state = { kcalMode:'avg', selectedEnergyKcal:0 };
  function finite(v){ v=Number(v); return Number.isFinite(v) ? v : 0; }
  function choose(low, high){
    low=finite(low); high=finite(high);
    if (!(high > 0)) high=low;
    if (!(low > 0)) low=high;
    var value = state.kcalMode === 'low' ? low : (state.kcalMode === 'high' ? high : Math.round((low + high) / 2));
    state.selectedEnergyKcal = Math.max(0, value || 0);
    return state.selectedEnergyKcal;
  }
  window.NeedsNormSyncV53155 = {
    version:'v5.3.155_calculation_core_ssot_pass1',
    chooseEnergy:function(meta){ meta=meta||{}; return choose(meta.energyLow, meta.energyHigh); },
    selectedEnergy:function(){ return state.selectedEnergyKcal; },
    selectedMode:function(){ return state.kcalMode; },
    setKcalMode:function(mode){ if (['low','avg','high'].indexOf(mode) >= 0) state.kcalMode=mode; return state.kcalMode; },
    upperLimitsForEnergy:function(kcal){
      kcal=finite(kcal);
      var registry=window.NutritionNormativeRegistry;
      var sfa=registry&&typeof registry.resolveDerived==='function'?registry.resolveDerived('sfa_g',{energyKcal:kcal}):null;
      var sugar=registry&&typeof registry.resolveDerived==='function'?registry.resolveDerived('added_sugars_g',{energyKcal:kcal}):null;
      return {
        sfa_g:sfa&&Number.isFinite(Number(sfa.value))?Number(sfa.value):0,
        added_sugars_g:sugar&&Number.isFinite(Number(sugar.value))?Number(sugar.value):0,
        provenance:{sfa_g:sfa&&sfa.provenance||null,added_sugars_g:sugar&&sugar.provenance||null,registryMissing:!registry}
      };
    }
  };
})();
const toNum = (v) => (v===''||v==null||v===undefined||isNaN(Number(v)))? null : Number(v);
const round1 = (v) => Math.round((v+Number.EPSILON)*10)/10;
const round0 = (v) => Math.round((v+Number.EPSILON));
function computeBMI(h, w){
    h = toNum(h); w = toNum(w); if(!h || !w) return NaN;
    return round1(w / Math.pow(h/100,2));
  }
const DEVINE_MIN_HEIGHT_CM = 152;
function computeIBW(sex, h){
    h = toNum(h); if(!h || h < DEVINE_MIN_HEIGHT_CM) return null;
    const delta = h - DEVINE_MIN_HEIGHT_CM;
    return (sex==='male') ? (50 + 0.9*delta) : (45.5 + 0.9*delta);
  }
function computeAdjusted(ibw, w, f=0.25){
    if(ibw==null || w==null) return null;
    return ibw + f*(w-ibw);
  }
function computeUnintentionalWeightLossPct(previousWeight, currentWeight){
    previousWeight = toNum(previousWeight); currentWeight = toNum(currentWeight);
    if (!(previousWeight > 0) || !(currentWeight > 0)) return null;
    return round1(Math.max(0, (previousWeight - currentWeight) / previousWeight * 100));
  }
function assessAdultRefeedingRisk(input){
    input = input || {};
    const age = toNum(input.age), bmi = toNum(input.bmi), currentWeight = toNum(input.currentWeight);
    const previousWeight = toNum(input.previousWeight), intakeDays = toNum(input.lowIntakeDays);
    const electrolytes = String(input.electrolytes || 'unknown');
    const additionalFactors = String(input.additionalFactors || 'unknown');
    const applicable = Number.isFinite(age) && age >= 18;
    const weightLossPct = computeUnintentionalWeightLossPct(previousWeight, currentWeight);
    const major = [], minor = [], reasons = [], missing = [];
    if (!applicable) return { version:'nice_cg32_adult_screen_v1', applicable:false, level:'not_applicable', label:'не применяется', highRisk:false, extremeRisk:false, malnutritionScreenPositive:false, weightLossPct:weightLossPct, majorCriteria:[], minorCriteria:[], reasons:[], missing:[], normsSyncAllowed:true, automaticPlannerAllowed:true };
    if (Number.isFinite(bmi) && bmi < 16) major.push('ИМТ ниже 16 кг/м²');
    if (Number.isFinite(weightLossPct) && weightLossPct > 15) major.push('непреднамеренная потеря массы более 15% за 3–6 месяцев');
    if (Number.isFinite(intakeDays) && intakeDays > 10) major.push('очень малое или отсутствующее питание более 10 дней');
    if (electrolytes === 'low') major.push('снижен калий, фосфат или магний до начала питания');
    if (Number.isFinite(bmi) && bmi < 18.5) minor.push('ИМТ ниже 18,5 кг/м²');
    if (Number.isFinite(weightLossPct) && weightLossPct > 10) minor.push('непреднамеренная потеря массы более 10% за 3–6 месяцев');
    if (Number.isFinite(intakeDays) && intakeDays > 5) minor.push('очень малое или отсутствующее питание более 5 дней');
    if (additionalFactors === 'yes') minor.push('есть дополнительный фактор риска');
    const extremeRisk = (Number.isFinite(bmi) && bmi < 14) || (Number.isFinite(intakeDays) && intakeDays > 15);
    const highRisk = extremeRisk || major.length >= 1 || minor.length >= 2;
    const malnutritionScreenPositive = (Number.isFinite(bmi) && bmi < 18.5) || (Number.isFinite(weightLossPct) && weightLossPct > 10) || (Number.isFinite(bmi) && bmi < 20 && Number.isFinite(weightLossPct) && weightLossPct > 5);
    if (extremeRisk) reasons.push('Экстремальный критерий риска: ИМТ ниже 14 кг/м² или почти отсутствующее питание более 15 дней.');
    reasons.push.apply(reasons, major);
    if (!major.length && highRisk) reasons.push.apply(reasons, minor);
    if (previousWeight == null && (Number.isFinite(bmi) && bmi < 18.5)) missing.push('динамика массы за 3–6 месяцев');
    if (intakeDays == null && (Number.isFinite(bmi) && bmi < 18.5)) missing.push('длительность очень малого питания');
    if (electrolytes === 'unknown' && (Number.isFinite(bmi) && bmi < 18.5)) missing.push('калий, фосфат и магний');
    if (additionalFactors === 'unknown' && (Number.isFinite(bmi) && bmi < 18.5)) missing.push('дополнительные факторы риска');
    let level = 'none', label = 'критерии высокого риска не выявлены';
    if (extremeRisk) { level = 'extreme'; label = 'экстремально высокий риск рефидинга'; }
    else if (highRisk) { level = 'high'; label = 'высокий риск рефидинга'; }
    else if (malnutritionScreenPositive) { level = 'malnutrition'; label = 'положительный скрининг недостаточности питания'; }
    else if (missing.length) { level = 'incomplete'; label = 'данных недостаточно для полного скрининга'; }
    return {
      version:'nice_cg32_adult_screen_v1', applicable:true, level:level, label:label, highRisk:highRisk, extremeRisk:extremeRisk,
      malnutritionScreenPositive:malnutritionScreenPositive, weightLossPct:weightLossPct, majorCriteria:major, minorCriteria:minor, reasons:reasons, missing:missing,
      normsSyncAllowed:!highRisk, automaticPlannerAllowed:!highRisk, estimateOnly:highRisk
    };
  }
function mifflinBMR(sex, w, h, age){
  const _sx = (sex||'').toString().toLowerCase();
  sex = (_sx.startsWith('m') || _sx.startsWith('м')) ? 'male' : 'female';
  if([w,h,age].some(x=>x==null || isNaN(x))) return null;
    const s = (sex==='male') ? 5 : -161;
    const bmr = (10*w + 6.25*h - 5*age + s);
    return { bmr: bmr, s };
  }
const ACT = {
    sedentary: { energy: 1.20, protein: 1.00, label:'Малоподвижный' },
    low:       { energy: 1.35, protein: 1.00, label:'Низкая' },
    moderate:  { energy: 1.50, protein: 1.00, label:'Умеренная' },
    high:      { energy: 1.70, protein: 1.00, label:'Высокая' },
    veryhigh:  { energy: 1.90, protein: 1.00, label:'Очень высокая' }
  };
const STATE = {
    normal:   { teeAdj:1.00, kcalPerKg:25, pRange:[0.8,1.2], fluidMlPerKg:30, label:'Обычное' },
    rehab:    { teeAdj:1.05, kcalPerKg:27, pRange:[1.2,1.5], fluidMlPerKg:30, label:'Реабилитация/набор' },
    preop:    { label:'Предоперационный', clinicianOnly:true, externalTargetOnly:true },
    postop:   { label:'Послеоперационный', clinicianOnly:true, externalTargetOnly:true },
    icu:      { label:'Критическое состояние (ОРИТ)', clinicianOnly:true, externalTargetOnly:true, ignoreActivity:true },
    elderly:  { teeAdj:1.00, kcalPerKg:25, pRange:[1.0,1.2], fluidMlPerKg:30, label:'Пожилой' },
    ckd:      { label:'ХБП без диализа', clinicianOnly:true, externalTargetOnly:true, ignoreActivity:true },
    dialysis: { label:'Диализ / заместительная почечная терапия', clinicianOnly:true, externalTargetOnly:true, ignoreActivity:true },
    oncology: { label:'Онкологический профиль', clinicianOnly:true, externalTargetOnly:true }
  };
const DIET_STYLE_V5367 = {
    mixed:         { label:'Смешанный рацион', short:'смешанный', meaning:'Обычный смешанный рацион: пищевые приоритеты задаются возрастом, полом, активностью, целью и фактической структурой.' },
    no_dairy:      { label:'Без молочных продуктов', short:'без молочных', meaning:'При рационе без молочных продуктов особенно внимательно оцениваются кальций, витамин D, B12 и белок. Основными источниками могут быть обогащённые продукты и другие подходящие пищевые источники кальция.' },
    plant_forward: { label:'Преимущественно растительный', short:'растительный акцент', meaning:'Преимущественно растительный рацион: важны белок, железо, цинк, кальций, B12 и сочетание растительных источников железа с витамином C.' },
    vegetarian:    { label:'Вегетарианский', short:'вегетарианский', meaning:'При вегетарианском рационе отдельно оцениваются белок, железо, цинк, кальций, витамин B12, витамин D и достаточность энергии.' },
    low_appetite:  { label:'Сниженный аппетит / малый объём еды', short:'малый объём еды', meaning:'При сниженном аппетите важна нутриентная плотность: больше белка, кальция, энергии и микронутриентов в меньшем объёме еды.' }
  };
const GUARDRAIL_PROFILE_V5367 = {
    none:                { label:'Нет', short:'без защитного сценария', meaning:'Дополнительный защитный сценарий не выбран.' },
    pregnancy:           { label:'Беременность', short:'беременность', meaning:'Беременность: для взрослой неосложнённой одноплодной беременности используется отдельный справочный жизненный профиль; цели снижения/набора, автоперенос норм и автоматическое планирование отключены.' },
    lactation:           { label:'Лактация', short:'лактация', meaning:'Лактация: справочная энергетическая поправка применяется только для поддерживаемых периодов грудного вскармливания; автодефицит, перенос норм и автоматическое планирование отключены.' },
    ed_risk:             { label:'Риск РПП / выраженные ограничения', short:'риск РПП', meaning:'При риске РПП или выраженных ограничениях калькулятор не усиливает ограничительную логику; приоритет — регулярность, достаточность и очная помощь.' },
    medical_restriction: { label:'Есть медицинские ограничения', short:'медицинские ограничения', meaning:'Медицинские ограничения требуют очной индивидуализации; калькулятор показывает структуру рациона, но не заменяет назначения.' }
  };
function labelFromRegistry(registry, key, fallback){
    var item = registry && registry[String(key || '')];
    return (item && item.label) || fallback || String(key || '');
  }
function guardrailBlocksAutoDeficit(guardrail){
    return guardrail === 'pregnancy' || guardrail === 'lactation' || guardrail === 'ed_risk' || guardrail === 'medical_restriction';
  }
function pediatricAgeForNeeds(age){
    age = Number(age);
    return Number.isFinite(age) && age >= 1 && age < 18;
  }
function automaticChildNormAllowedForState(state){
    // In renal replacement/ICU contexts a child needs a specialist clinical calculation.
    return ['ckd','dialysis','icu'].indexOf(String(state || '')) < 0;
  }
const PROTEIN_TARGETS_V44 = {
    normal:   { sedentary:0.80, low:0.90, moderate:1.05, high:1.20, veryhigh:1.40, floor:0.80, cap:1.60, note:'Здоровый взрослый: 0,8 г/кг — базовая RDA; более высокие значения применяются как практический ориентир при активности или цели, а не как обязательная норма.' },
    rehab:    { sedentary:1.20, low:1.20, moderate:1.30, high:1.40, veryhigh:1.50, floor:1.20, cap:1.50, note:'Реабилитация: ориентировочно 1,2–1,5 г/кг при достаточной энергии и отсутствии противопоказаний.' },
    elderly:  { sedentary:1.00, low:1.00, moderate:1.10, high:1.20, veryhigh:1.20, floor:1.00, cap:1.50, note:'Пожилой возраст: не менее 1,0 г/кг; 1,2–1,5 г/кг возможно при болезни, восстановлении или риске недостаточности.' }
  };
const RUS_CHILD_NORMS_0253_21 = [
    { key:'child_1_2',  ageMin:1,  ageMax:2,  sex:'any',    label:'1–2 года',   kcal:1300, protein_g:39, fat_g:44, carbs_g:188, fiber_g:10, calcium_mg:800,  phosphorus_mg:600, magnesium_mg:80,  potassium_mg:1000, sodium_mg:500,  iron_mg:10, zinc_mg:8,  vitamin_c_mg:45, vitamin_d_mcg:15, vitamin_b12_mcg:0.7, vitamin_b9_mcg:200, animalProteinPct:70 },
    { key:'child_3_6',  ageMin:3,  ageMax:6,  sex:'any',    label:'3–6 лет',    kcal:1800, protein_g:54, fat_g:60, carbs_g:261, fiber_g:12, calcium_mg:900,  phosphorus_mg:700, magnesium_mg:200, potassium_mg:1500, sodium_mg:700,  iron_mg:12, zinc_mg:10, vitamin_c_mg:50, vitamin_d_mcg:15, vitamin_b12_mcg:1.5, vitamin_b9_mcg:300, animalProteinPct:65 },
    { key:'child_7_10', ageMin:7,  ageMax:10, sex:'any',    label:'7–10 лет',   kcal:2100, protein_g:63, fat_g:70, carbs_g:305, fiber_g:16, calcium_mg:1100, phosphorus_mg:800, magnesium_mg:250, potassium_mg:2000, sodium_mg:1000, iron_mg:15, zinc_mg:12, vitamin_c_mg:60, vitamin_d_mcg:15, vitamin_b12_mcg:2.0, vitamin_b9_mcg:350, animalProteinPct:60 },
    { key:'child_11_14_male', ageMin:11, ageMax:14, sex:'male',   label:'11–14 лет, мальчики', kcal:2500, protein_g:75, fat_g:83, carbs_g:363, fiber_g:20, calcium_mg:1200, phosphorus_mg:900, magnesium_mg:300, potassium_mg:2500, sodium_mg:1100, iron_mg:18, zinc_mg:12, vitamin_c_mg:70, vitamin_d_mcg:15, vitamin_b12_mcg:3.0, vitamin_b9_mcg:400, animalProteinPct:60 },
    { key:'child_11_14_female', ageMin:11, ageMax:14, sex:'female', label:'11–14 лет, девочки',  kcal:2300, protein_g:69, fat_g:77, carbs_g:334, fiber_g:20, calcium_mg:1200, phosphorus_mg:900, magnesium_mg:300, potassium_mg:2500, sodium_mg:1100, iron_mg:18, zinc_mg:12, vitamin_c_mg:60, vitamin_d_mcg:15, vitamin_b12_mcg:3.0, vitamin_b9_mcg:400, animalProteinPct:60 },
    { key:'child_15_17_male', ageMin:15, ageMax:17, sex:'male',   label:'15–17 лет, юноши',    kcal:2900, protein_g:87, fat_g:97, carbs_g:421, fiber_g:22, calcium_mg:1200, phosphorus_mg:900, magnesium_mg:400, potassium_mg:3200, sodium_mg:1300, iron_mg:18, zinc_mg:12, vitamin_c_mg:90, vitamin_d_mcg:15, vitamin_b12_mcg:3.0, vitamin_b9_mcg:400, animalProteinPct:60 },
    { key:'child_15_17_female', ageMin:15, ageMax:17, sex:'female', label:'15–17 лет, девушки',  kcal:2500, protein_g:75, fat_g:83, carbs_g:363, fiber_g:22, calcium_mg:1200, phosphorus_mg:900, magnesium_mg:400, potassium_mg:3200, sodium_mg:1300, iron_mg:18, zinc_mg:12, vitamin_c_mg:70, vitamin_d_mcg:15, vitamin_b12_mcg:3.0, vitamin_b9_mcg:400, animalProteinPct:60 }
  ];
function normalizedSexForNeeds(sex){
    sex = String(sex || '').toLowerCase();
    if (sex.indexOf('female') >= 0 || sex.indexOf('жен') >= 0 || sex === 'ж') return 'female';
    if (sex.indexOf('male') >= 0 || sex.indexOf('муж') >= 0 || sex === 'м') return 'male';
    return 'any';
  }
function russianChildNormFor(age, sex){
    age = Number(age);
    if (!Number.isFinite(age) || age < 1 || age >= 18) return null;
    var ageWhole = Math.floor(age);
    var sx = normalizedSexForNeeds(sex);
    return RUS_CHILD_NORMS_0253_21.find(function(r){ return ageWhole >= r.ageMin && ageWhole <= r.ageMax && r.sex === sx; }) ||
           RUS_CHILD_NORMS_0253_21.find(function(r){ return ageWhole >= r.ageMin && ageWhole <= r.ageMax && r.sex === 'any'; }) || null;
  }
function russianChildNormBasis(){ return 'МР 2.3.1.0253-21, табл. 21'; }
function parseSplit(value){
    // format: "n|p1,p2,..."
    const [n, plist] = value.split('|');
    const parts = plist.split(',').map(x=>Number(x.trim()));
    const sum = parts.reduce((a,b)=>a+b,0);
    return { n: Number(n), parts, sum };
  }
function computeAutoParams({sex,h,w,age,state,activity,edema,manualCalculationWeight,refeedingRisk}){
  const reason = [];
  const bmi = computeBMI(h,w);
  const pediatricAge = pediatricAgeForNeeds(age);
  const childNorm = russianChildNormFor(age, sex);
  const manualWeight = toNum(manualCalculationWeight);
  const lowWeightAdult = !pediatricAge && bmi != null && bmi < 18.5;

  // v5.3.67: for children/adolescents the adult BMI/IBW/AdjBW branch is blocked before it can choose calculation weight.
  if (pediatricAge) {
    let method = (childNorm && automaticChildNormAllowedForState(state)) ? 'rus_child_norm' : 'weight';
    reason.push('Детский профиль: взрослая BMI/IBW/AdjBW-логика выбора массы отключена');
    reason.push('Используется фактическая масса; значения в г/кг и расчёт жидкости приводятся как справочные ориентиры');
    if (childNorm && automaticChildNormAllowedForState(state)) reason.push('КБЖУ берутся из российской возрастно-половой нормы');
    else reason.push('Клинически чувствительный детский профиль: нужен очный расчёт, автоматическая взрослая логика не применяется');
    return { weightChoice:'actual', f:0.25, method, reason: reason.join('; '), lowBMIOverride:false, pediatricWeightLogic:true };
  }

  // --- выбор массы (взрослая логика) ---
  let weightChoice = 'actual';
  if (lowWeightAdult && edema === 'yes') {
    if (manualWeight != null) { weightChoice = 'manual'; reason.push('Низкий ИМТ и отёки: используется вручную заданная расчётная/сухая масса'); }
    else { weightChoice = 'manual_required'; reason.push('Низкий ИМТ и отёки: Devine не подменяет сухую массу; требуется вручную подтверждённая расчётная масса'); }
  } else if (lowWeightAdult && ['ckd','dialysis'].includes(state)) {
    if (manualWeight != null) { weightChoice = 'manual'; reason.push('Низкий ИМТ и почечный профиль: используется вручную подтверждённая расчётная масса'); }
    else { weightChoice = 'manual_required'; reason.push('Низкий ИМТ и почечный профиль: автоматическая подстановка IBW отключена; требуется расчётная масса специалиста'); }
  } else if (edema === 'yes'){
    if (bmi!=null && bmi >= 30){ weightChoice = 'adjusted'; reason.push('Отёки → скорректированная масса (ИМТ≥30)'); }
    else { weightChoice = 'ibw'; reason.push('Отёки → идеальная масса (IBW)'); }
  } else if (state === 'ckd'){
    if (bmi!=null && bmi >= 30){ weightChoice = 'adjusted'; reason.push('ХБП: используем скорректированную массу при ИМТ≥30'); }
    else { weightChoice = 'ibw'; reason.push('ХБП: используем идеальную массу (IBW)'); }
  } else if (bmi!=null && bmi >= 30){
    weightChoice = 'adjusted'; reason.push('Ожирение (ИМТ≥30) → скорректированная масса');
  } else {
    weightChoice = 'actual'; reason.push(lowWeightAdult ? 'Недостаточная масса без отёков → сохраняем фактическую массу' : 'Масса надёжна → фактическая');
  }

  let f = 0.25;
  if (bmi!=null && bmi>=40) { f = 0.40; reason.push('Морбидное ожирение → f=0.40'); }
  else if (bmi!=null && bmi>=30) { f = 0.25; reason.push('Ожирение → f=0.25'); }

  let method = 'mifflin';
  reason.push('По умолчанию Mifflin–St Jeor');
  if (!(h && w && age!=null)) {
    method = 'weight';
    reason.push('Недостаточно данных для Mifflin → расчёт по массе (ккал/кг)');
  }
  if (bmi != null && bmi < 18.5) {
    if (method !== 'weight') reason.push('ИМТ<18,5 → переходим на расчёт по фактической/подтверждённой массе (ккал/кг)');
    method = 'weight';
  }
  if (refeedingRisk && refeedingRisk.highRisk) reason.push('Высокий риск рефидинга: числовой результат является оценкой полной потребности, а не стартовой схемой питания');

  return { weightChoice, f, method, reason: reason.join('; '), lowBMIOverride: (bmi != null && bmi < 18.5), pediatricWeightLogic:false };

}
function energyByWeightMethod(state, activity, usedWeight){
    const s = STATE[state] || STATE.normal;
    if (s.externalTargetOnly || !Number.isFinite(Number(s.kcalPerKg))) return null;
    const act = ACT[activity] || ACT.low;
    const sf = (typeof s.teeAdj==='number') ? s.teeAdj : 1.0;
    const activityScale = s.ignoreActivity ? 1 : Math.max(0.9, act.energy / 1.35);
    const base = s.kcalPerKg * usedWeight * activityScale * sf;
    return { low: Math.round(base), high: Math.round(base*1.15), kcalPerKg: s.kcalPerKg, act: act.energy, sf };
  }
function childProteinRangeFor(age, activity, state, goal, weight, sex){
  age = Number(age);
  if (!Number.isFinite(age) || age >= 18 || age < 1) return null;
  if (state === 'ckd' || state === 'dialysis' || state === 'icu') return null;
  var norm = russianChildNormFor(age, sex);
  if (norm){
    var w = Number(weight);
    var target = (Number.isFinite(w) && w > 0) ? +(norm.protein_g / w).toFixed(2) : null;
    return { target:target, proteinG:norm.protein_g, floor:target || 0, cap:target || 0, norm:norm, fixed:true, basis:russianChildNormBasis(), note:'Детский профиль: белок берётся из российских возрастно-половых норм, без взрослой автоматической прибавки при снижении массы.' };
  }
  var base = age <= 3 ? 1.05 : (age <= 13 ? 0.95 : 0.85);
  var activityBump = (activity === 'high' || activity === 'veryhigh') ? 0.15 : (activity === 'moderate' ? 0.05 : 0);
  var recoveryBump = (state === 'rehab' || state === 'postop' || goal === 'rehab_gain') ? 0.20 : 0;
  var target = +(base + activityBump + recoveryBump).toFixed(2);
  var cap = age <= 13 ? 1.35 : 1.50;
  if (state === 'oncology') cap = Math.min(cap, 1.45);
  target = Math.max(base, Math.min(cap, target));
  return { target:+target.toFixed(2), floor:base, cap:cap, note:'Детский профиль: белок рассчитывается по возрастной логике г/кг, без взрослой автоматической прибавки для снижения массы.' };
}
function proteinPerKgFor(state, activity, age, goal, weight, sex){
  if (STATE[state] && STATE[state].externalTargetOnly) return null;
  const childRange = childProteinRangeFor(age, activity, state, goal, weight, sex);
  if (childRange && childRange.target) return childRange.target;
  const cfg = PROTEIN_TARGETS_V44[state] || PROTEIN_TARGETS_V44.normal;
  activity = activity || 'low';
  goal = goal || 'maintain';

  let gkg = Number(cfg[activity]);
  if (!Number.isFinite(gkg)) gkg = Number(cfg.low || cfg.sedentary || cfg.floor || 1.2);

  // Goal-specific adjustment. CKD non-dialysis is deliberately excluded from automatic upward bumps.
  let goalBump = 0;
  if (state !== 'ckd') {
    if (['normal','elderly'].includes(state)) {
      if (goal === 'lose') goalBump = 0.10;
      else if (goal === 'gain') goalBump = 0.10;
      else if (goal === 'rehab_gain') goalBump = 0.15;
    }
  }
  gkg = +(gkg + goalBump).toFixed(2);

  // Older adults: keep a minimum target unless renal restriction is selected.
  if (age != null && age >= 65 && state !== 'ckd' && state !== 'dialysis') {
    if (state === 'normal' && goal === 'maintain') gkg = Math.max(gkg, 1.00);
    else gkg = Math.max(gkg, 1.20);
  }

  // State-specific clinical floors and caps.
  let floor = Number(cfg.floor);
  let cap = Number(cfg.cap);
  if (!Number.isFinite(floor)) floor = 0.8;
  if (!Number.isFinite(cap)) cap = 2.0;

  // Oncology without explicit cachexia status remains conservative; rehab_gain may reach 2.0.
  if (state === 'oncology') cap = Math.min(cap, 1.50);
  // Elderly profile has room for higher target with rehab_gain, but avoids automatic 2.0 without a severe-illness flag.
  if (state === 'elderly') cap = Math.min(cap, 1.50);
  // Dialysis and CKD use renal-specific caps.
  if (state === 'dialysis') cap = Math.min(cap, 1.20);
  if (state === 'ckd') { floor = 0.80; cap = 0.80; }

  gkg = Math.max(floor, Math.min(cap, gkg));
  return +gkg.toFixed(2);
}
function proteinNoteFor(meta){
  if (STATE[meta.state] && STATE[meta.state].externalTargetOnly) return 'Клинический профиль работает только с актуальной внешней целью. Универсальный белковый коридор калькулятором не создаётся.';
  const childRange = childProteinRangeFor(meta.age, meta.activity, meta.state, meta.goal, meta.usedWeight || meta.w, meta.sex);
  if (childRange) {
    if (childRange.fixed && childRange.norm) {
      return childRange.note + ' Ориентир: ' + childRange.norm.protein_g + ' г/сут для группы «' + childRange.norm.label + '»; при текущей массе это около ' + (childRange.target || 0) + ' г/кг. Доля животного белка в российских нормах для этой группы: ' + childRange.norm.animalProteinPct + '%. При нарушениях роста, массы, аппетита или хронических заболеваниях расчёт требует очной проверки.';
    }
    return childRange.note + ' Текущий ориентир: ' + childRange.floor + '–' + childRange.cap + ' г/кг/сут с учётом возраста, активности и восстановительного профиля. При нарушениях роста, массы, аппетита или хронических заболеваниях расчёт требует очной проверки.';
  }
  const cfg = PROTEIN_TARGETS_V44[meta.state] || PROTEIN_TARGETS_V44.normal;
  const pRange = STATE[meta.state]?.pRange || [cfg.floor, cfg.cap];
  let pieces = [];
  pieces.push('Методика v5.3.127: выбран профиль «' + (meta.stateLabel || meta.state) + '», активность «' + (meta.activityLabel || meta.activity) + '», цель «' + (meta.goalLabel || meta.goal) + '».');
  pieces.push('Ориентировочный коридор для профиля: ' + pRange[0] + '–' + pRange[1] + ' г/кг/сут. ' + (cfg.note || ''));
  if (meta.state === 'ckd') pieces.push('Важно: при ХБП без диализа калькулятор не повышает белок автоматически; требуется врачебный контроль функции почек, стадии ХБП и нутритивного статуса.');
  else if (meta.state === 'dialysis') pieces.push('Для диализа используется отдельный коридор, потому что потери белка и катаболизм выше, чем при ХБП без диализа.');
  else pieces.push('При хронической болезни почек, декомпенсированных печёночных состояниях и тяжёлой острой патологии белок нельзя повышать без клинического контроля.');
  return pieces.join(' ');
}
function ageGroupForPersonalProfile(age, sex){
  age = Number(age);
  if (!Number.isFinite(age)) return { key:'unknown', label:'возраст не указан', stage:'unknown', child:false, adolescent:false, older:false, norm:null };
  if (age < 1) return { key:'infant', label:'до 1 года', stage:'infant', child:true, adolescent:false, older:false, norm:null, needsSpecialist:true };
  var childNorm = russianChildNormFor(age, sex);
  if (childNorm) return { key:childNorm.key, label:childNorm.label, stage:(age >= 11 ? 'adolescent' : 'child'), child:true, adolescent:age >= 11, older:false, norm:childNorm, basis:russianChildNormBasis() };
  if (age < 18) return { key:'child_undefined', label:'до 18 лет', stage:'child', child:true, adolescent:age >= 11, older:false, norm:null, needsSpecialist:true };
  if (age <= 29) return { key:'adult_18_29', label:'18–29 лет', stage:'adult_young', child:false, adolescent:false, older:false };
  if (age <= 44) return { key:'adult_30_44', label:'30–44 года', stage:'adult_middle', child:false, adolescent:false, older:false };
  if (age <= 64) return { key:'adult_45_64', label:'45–64 года', stage:'adult_later', child:false, adolescent:false, older:false };
  if (age <= 74) return { key:'older_65_74', label:'65–74 года', stage:'older_early', child:false, adolescent:false, older:true };
  return { key:'older_75_plus', label:'75+ лет', stage:'older_late', child:false, adolescent:false, older:true };
}
function personalRegionalTarget(key, group, age, sex, fallback){
  if(group && group.norm && group.norm[key]) return group.norm[key];
  try{
    var region=(window.State&&State.getRegion)?State.getRegion():'us';
    var r=window.__resolveMicroLimitsForQA&&window.__resolveMicroLimitsForQA(key,region,Number(age),sex);
    if(r&&r.min&&Number.isFinite(Number(r.min.value)))return Number(r.min.value);
  }catch(_){}
  return fallback;
}
function personalCalciumTarget(group, isFemale, age){return personalRegionalTarget('calcium_mg',group,age,isFemale?'female':'male',1000);}
function personalVitaminDTarget(group, age, isFemale){return personalRegionalTarget('vitamin_d_mcg',group,age,isFemale?'female':'male',15);}
function personalIronTarget(group, isFemale, age){return personalRegionalTarget('iron_mg',group,age,isFemale?'female':'male',isFemale&&Number(age)<=50?18:8);}
function personalFiberTarget(group, isFemale, isMale, age){
  if (group && group.norm && group.norm.fiber_g) return group.norm.fiber_g;
  if (Number.isFinite(Number(age)) && Number(age) >= 51) return isFemale ? 21 : 30;
  return isFemale ? 25 : (isMale ? 38 : 30);
}
function personalB12Target(group, age, isFemale){return personalRegionalTarget('vitamin_b12_mcg',group,age,isFemale?'female':'male',2.4);}
function personalFolateTarget(group, age, isFemale){return personalRegionalTarget('vitamin_b9_mcg',group,age,isFemale?'female':'male',400);}
function profileAgeMeaning(group, state){
  group = group || {};
  if (group.needsSpecialist) return 'Для этого возраста требуется индивидуальный расчёт с учётом месяцев жизни, характера питания и динамики роста.';
  if (group.child) return 'Возрастная группа определяет нормы энергии, белков, жиров, углеводов и ключевых микронутриентов. Для детей и подростков используются российские возрастно-половые нормативы.';
  if (group.stage === 'adult_young') return 'Возраст 18–29 лет задаёт базовые взрослые ориентиры. Итоговые значения уточняются по массе тела, активности, цели и полу.';
  if (group.stage === 'adult_middle') return 'Возраст 30–44 года задаёт базовые взрослые ориентиры. В рекомендациях особое внимание получают структура рациона, клетчатка и качество источников энергии.';
  if (group.stage === 'adult_later') return 'Возраст 45–64 года повышает приоритет белка, клетчатки, кальция, контроля натрия и насыщенных жиров.';
  if (group.stage === 'older_early') return 'В возрасте 65–74 лет особенно важны достаточность белка и энергии, кальций, витамин D, B12 и распределение белковых продуктов в течение дня.';
  if (group.stage === 'older_late') return 'В возрасте 75 лет и старше особенно важны достаточность энергии и белка, кальций, витамин D, B12, переносимость пищи и удобный режим питания.';
  if (state === 'elderly') return 'Выбран профиль пожилого пациента. В оценке рациона повышается приоритет белка, кальция, витамина D, B12 и общей питательной ценности.';
  return 'Возраст задаёт исходную группу потребностей. Остальные параметры уточняют расчёт и порядок рекомендаций.';
}
function profileSexMeaning(isFemale, isMale, age, group){
  age = Number(age);
  if (isFemale && group && group.child && group.adolescent) return 'Для девушек подросткового возраста особенно внимательно оцениваются железо, фолат, кальций, витамин D и достаточность энергии.';
  if (isMale && group && group.child && group.adolescent) return 'Для юношей подросткового возраста выше ориентиры энергии и белка; дополнительно оцениваются кальций, витамин D и регулярность белковых продуктов.';
  if (isFemale && Number.isFinite(age) && age >= 14 && age <= 50) return 'Для женщин репродуктивного возраста отдельное внимание получают железо и фолат; кальций и витамин D также остаются в числе приоритетных показателей.';
  if (isFemale && Number.isFinite(age) && age >= 51) return 'Для женщин старше 50 лет особенно внимательно оцениваются кальций, витамин D, белок и витамин B12.';
  if (isMale && Number.isFinite(age) && age >= 45) return 'Для мужчин старше 45 лет особенно внимательно оцениваются клетчатка, натрий, насыщенные жиры, достаточность белка и качество источников энергии.';
  if (isMale) return 'Пол участвует в расчёте энергии и части нормативов. Остальные приоритеты уточняются по активности, цели, массе тела и состоянию.';
  if (isFemale) return 'Пол участвует в расчёте энергии и нормативов железа, фолата и кальция в соответствующих возрастных группах.';
  return 'Пол не указан, поэтому используются общие ориентиры без половых уточнений.';
}
function profileStateMeaning(state){
  var map = {
    normal:'При обычном состоянии специальные клинические поправки не добавляются. Ориентиры уточняются по возрасту, полу, активности и цели.',
    rehab:'В период реабилитации повышается приоритет белка, энергии, кальция, цинка и регулярного питания.',
    preop:'Перед операцией особенно важны достаточность белка и энергии, общая питательная ценность рациона и осторожность при ограничениях.',
    postop:'После операции особенно внимательно оцениваются белок, энергия и микронутриенты, необходимые для восстановления.',
    icu:'Для пациентов ОРИТ расчёт носит справочный характер и требует клинического контроля.',
    elderly:'Профиль пожилого пациента повышает приоритет белка, кальция, витамина D, B12 и общей питательной ценности.',
    ckd:'При хронической болезни почек белок, натрий, фосфор и калий оцениваются с учётом стадии заболевания и назначений.',
    dialysis:'При диализе повышается потребность в белке; фосфор, калий, натрий и жидкость требуют клинического контроля.',
    oncology:'При онкологическом заболевании особенно важны белок, энергия и общая питательная ценность; рекомендации требуют клинической осторожности.'
  };
  return map[state] || 'Выбранное состояние уточняет приоритеты белка, энергии, микронутриентов и безопасность рекомендаций.';
}
function profileGoalMeaning(goal, group){
  if (group && group.child && goal === 'lose') return 'Для ребёнка цель снижения массы не создаёт автоматического дефицита энергии. Основное внимание уделяется росту, развитию, регулярности питания и качеству продуктов.';
  var map = {
    maintain:'При поддержании массы рекомендации направлены на сохранение полноценной структуры рациона и достаточности ключевых нутриентов.',
    lose:'При снижении массы калькулятор защищает белок, клетчатку и кальций; источники избыточной энергии рассматриваются в первую очередь.',
    gain:'При наборе массы энергия увеличивается за счёт полноценных продуктов, достаточного белка и углеводной основы.',
    rehab_gain:'При восстановлении и наборе массы повышается приоритет энергии, белка и нутриентов, участвующих в восстановлении тканей.'
  };
  return map[goal] || 'Цель уточняет энергетический ориентир и порядок рекомендаций.';
}
function profileActivityMeaning(activity){
  var map = {
    sedentary:'При малоподвижном образе жизни расчётная потребность в энергии ниже, поэтому особенно важна питательная ценность каждого приёма пищи.',
    low:'При низкой активности основное внимание получают качество источников энергии, белок, клетчатка и структура рациона.',
    moderate:'При умеренной активности дополнительно оцениваются энергия, белок, углеводная основа и восстановление после нагрузки.',
    high:'При высокой активности особенно важны достаточность энергии, белка и углеводов, а также жидкость и восстановление.',
    veryhigh:'При очень высокой активности особенно важны энергия, углеводы, белок, жидкость и электролиты.'
  };
  return map[activity] || 'Активность уточняет потребность в энергии, белке, углеводах и восстановлении.';
}
function profileDietStyleMeaning(dietStyle){
  var item = DIET_STYLE_V5367[String(dietStyle || 'mixed')] || DIET_STYLE_V5367.mixed;
  return item.meaning || 'Пищевой стиль уточняет, какие нутриенты и варианты продуктовых замен требуют дополнительной проверки.';
}
function profileGuardrailMeaning(guardrail){
  var item = GUARDRAIL_PROFILE_V5367[String(guardrail || 'none')] || GUARDRAIL_PROFILE_V5367.none;
  return item.meaning || 'Защитный сценарий ограничивает автоматические выводы и напоминает о необходимости очной индивидуализации.';
}
function buildScenarioFactors(ctx){
  ctx = ctx || {};
  return [
    { key:'age', label:'Возраст', value:(ctx.group && ctx.group.label) || 'не указан', effect:profileAgeMeaning(ctx.group, ctx.state) },
    { key:'sex', label:'Пол', value:ctx.sexLabel || 'не указан', effect:profileSexMeaning(ctx.isFemale, ctx.isMale, ctx.age, ctx.group) },
    { key:'state', label:'Состояние', value:ctx.stateLabel || 'обычное', effect:profileStateMeaning(ctx.state) },
    { key:'activity', label:'Активность', value:ctx.actLabel || 'не указана', effect:profileActivityMeaning(ctx.activity) },
    { key:'goal', label:'Цель', value:ctx.goalLabel || 'поддержание', effect:(ctx.refeedingRisk && ctx.refeedingRisk.highRisk) ? 'Цель сохранена как контекст, но автоматический дефицит или профицит отключён. Числовой результат является оценкой полной потребности, а не стартовой схемой питания.' : profileGoalMeaning(ctx.goal, ctx.group) },
    { key:'dietStyle', label:'Пищевой стиль', value:ctx.dietStyleLabel || 'Смешанный рацион', effect:profileDietStyleMeaning(ctx.dietStyle) },
    { key:'guardrail', label:'Защитный сценарий', value:ctx.guardrailLabel || 'Нет', effect:profileGuardrailMeaning(ctx.guardrail) }
  ];
}
function personalTargetMeta(meta, group, isFemale, isMale, age){
  if (group && group.needsSpecialist) return {};
  function item(value, unit, label, basis){ return { value:value, unit:unit, label:label, basis:basis || 'персональный ориентир' }; }
  if (meta.externalClinicalTargetApplied && meta.clinicalTarget) {
    return {
      kcal:item(Number(meta.energyTarget), 'ккал', 'энергия', 'актуальная внешняя клиническая цель'),
      protein_g:item(Number(meta.totalProtein), 'г', 'белок', 'актуальная внешняя клиническая цель'),
      _clinicalTarget:Object.assign({}, meta.clinicalTarget),
      _protected:true
    };
  }
  var childNorm = group && group.norm ? group.norm : null;
  var basis = childNorm ? russianChildNormBasis() : 'персональный ориентир';
  var safetyBasis = meta.refeedingRisk && meta.refeedingRisk.highRisk ? 'оценка полной потребности; не стартовая схема питания' : '';
  var selectedEnergy = Number(childNorm ? childNorm.kcal : (meta.energyTarget || (window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.chooseEnergy(meta) : Math.round((Number(meta.energyLow||0)+Number(meta.energyHigh||meta.energyLow||0))/2))));
  var energyLimits = window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.upperLimitsForEnergy(selectedEnergy) : {sfa_g:0,added_sugars_g:0,provenance:{registryMissing:true}};
  var out = {
    kcal: item(selectedEnergy, 'ккал', 'энергия', childNorm ? basis : (safetyBasis || 'расчёт потребностей')),
    protein_g: item(Number(childNorm ? childNorm.protein_g : (meta.totalProtein || 0)), 'г', 'белок', childNorm ? basis : (safetyBasis || 'г/кг с учётом профиля')),
    fat_g: item(Number(childNorm ? childNorm.fat_g : (meta.fatGrams || 0)), 'г', 'жиры', childNorm ? basis : (safetyBasis || 'расчёт потребностей')),
    carbs_g: item(Number(childNorm ? childNorm.carbs_g : (meta.carbGrams || 0)), 'г', 'углеводы', childNorm ? basis : (safetyBasis || 'расчёт потребностей')),
    fiber_g: item(personalFiberTarget(group, isFemale, isMale, age), 'г', 'клетчатка', childNorm ? basis : 'возраст и пол'),
    calcium_mg: item(personalCalciumTarget(group, isFemale, age), 'мг', 'кальций', childNorm ? basis : 'возрастной профиль'),
    vitamin_d_mcg: item(personalVitaminDTarget(group, age, isFemale), 'мкг', 'витамин D', childNorm ? basis : 'возрастной профиль'),
    iron_mg: item(personalIronTarget(group, isFemale, age), 'мг', 'железо', childNorm ? basis : 'возраст и пол'),
    vitamin_b12_mcg: item(personalB12Target(group, age, isFemale), 'мкг', 'B12', childNorm ? basis : 'возрастной профиль'),
    vitamin_b9_mcg: item(personalFolateTarget(group, age, isFemale), 'мкг', 'фолат', childNorm ? basis : 'возрастной профиль'),
    sfa_g: item(energyLimits.sfa_g, 'г', 'насыщенные жиры', 'расчётный верхний предел: не более 10% выбранной энергии'),
    added_sugars_g: item(energyLimits.added_sugars_g, 'г', 'добавленные сахара', 'расчётный верхний предел: не более 10% энергии; добавленные сахара используются как отслеживаемая часть свободных сахаров')
  };
  if (meta.lifeStageTargets) {
    var verifiedLifeStageKeys = Array.isArray(meta.lifeStageTargets._verifiedKeys) ? meta.lifeStageTargets._verifiedKeys.slice() : [];
    if (verifiedLifeStageKeys.length) {
      var keepCalculated = {kcal:1,protein_g:1,fat_g:1,carbs_g:1,sfa_g:1,added_sugars_g:1};
      Object.keys(out).forEach(function(key){
        if (key.charAt(0)==='_') return;
        if (!keepCalculated[key] && verifiedLifeStageKeys.indexOf(key)<0) delete out[key];
      });
    }
    Object.keys(meta.lifeStageTargets).forEach(function(key){
      if (key.charAt(0) === '_') return;
      var src = meta.lifeStageTargets[key];
      if (!src || !Number.isFinite(Number(src.value))) return;
      out[key] = item(Number(src.value), src.unit || (out[key] && out[key].unit) || '', src.label || (out[key] && out[key].label) || key, src.basis || 'жизненный профиль');
    });
    out._lifeStage = Object.assign({}, meta.lifeStageTargets._lifeStage || {stage:meta.guardrail,basis:'жизненный профиль'}, {
      verifiedKeys:verifiedLifeStageKeys,
      constraints:meta.lifeStageTargets._constraints || null
    });
  }
  if (safetyBasis) out._safety = { highRisk:true, extremeRisk:!!meta.refeedingRisk.extremeRisk, basis:safetyBasis };
  out.sfa_g.mode = 'upper_limit';
  out.added_sugars_g.mode = 'upper_limit';
  if (childNorm){
    out.phosphorus_mg = item(childNorm.phosphorus_mg, 'мг', 'фосфор', basis);
    out.magnesium_mg = item(childNorm.magnesium_mg, 'мг', 'магний', basis);
    out.potassium_mg = item(childNorm.potassium_mg, 'мг', 'калий', basis);
    out.sodium_mg = item(childNorm.sodium_mg, 'мг', 'натрий', basis);
    out.zinc_mg = item(childNorm.zinc_mg, 'мг', 'цинк', basis);
    out.vitamin_c_mg = item(childNorm.vitamin_c_mg, 'мг', 'витамин C', basis);
    out._childRussianNorm = { group:childNorm.label, basis:basis, animalProteinPct:childNorm.animalProteinPct };
  }
  return out;
}
function numericTargetMap(targetMeta){
  var out = {};
  Object.keys(targetMeta || {}).forEach(function(k){ var v = Number(targetMeta[k] && targetMeta[k].value); if (Number.isFinite(v) && v > 0) out[k] = v; });
  return out;
}
function buildPersonalNeedsProfile(meta){
  meta = meta || {};
  var rawAge = meta.age;
  var age = (rawAge === '' || rawAge === null || rawAge === undefined) ? NaN : Number(rawAge);
  var sex = String(meta.sex || '').toLowerCase();
  var state = String(meta.state || 'normal');
  var activity = String(meta.activity || 'low');
  var goal = String(meta.goal || 'maintain');
  var dietStyle = String(meta.dietStyle || 'mixed');
  var guardrail = String(meta.guardrail || 'none');
  var bmi = Number(meta.bmi);
  var group = ageGroupForPersonalProfile(age, sex);
  var isFemale = sex === 'female' || sex === 'женский' || sex === 'ж';
  var isMale = sex === 'male' || sex === 'мужской' || sex === 'м';
  var sexLabel = isFemale ? 'женский' : (isMale ? 'мужской' : 'пол не указан');
  var priorities = [];
  var map = {};
  function add(key, level, title, why, action, nutrients){
    if (map[key]) return;
    var item = { key:key, level:level, title:title, why:why, action:action, nutrients:nutrients || [] };
    priorities.push(item);
    map[key] = item;
  }
  var stateLabel = meta.stateLabel || ((STATE[state] && STATE[state].label) || state);
  var actLabel = meta.activityLabel || ((ACT[activity] && ACT[activity].label) || activity);
  var goalLabel = meta.goalLabel || ({maintain:'Поддержание',lose:'Снижение',gain:'Набор',rehab_gain:'Реабилитация/набор'}[goal] || goal);
  var dietStyleLabel = meta.dietStyleLabel || labelFromRegistry(DIET_STYLE_V5367, dietStyle, 'Смешанный рацион');
  var guardrailLabel = meta.guardrailLabel || labelFromRegistry(GUARDRAIL_PROFILE_V5367, guardrail, 'Нет');
  var refeedingRisk = meta.refeedingRisk || null;

  if (!group.child && refeedingRisk && refeedingRisk.highRisk) {
    add('refeeding_safety_gate', 'главный', refeedingRisk.extremeRisk ? 'Экстремальный нутритивный риск' : 'Высокий риск рефидинга', 'Скрининг выявил критерии, при которых оценку полной потребности нельзя автоматически превращать в стартовую схему питания.', 'Сохранить фактический анализ рациона, но не применять автоматический профицит, распределение по приёмам или AI-перестройку без индивидуальной тактики и мониторинга.', ['kcal','protein_g','potassium_mg','phosphorus_mg','magnesium_mg']);
  } else if (!group.child && refeedingRisk && refeedingRisk.malnutritionScreenPositive) {
    add('malnutrition_screen', 'главный', 'Недостаточность питания требует отдельной оценки', 'ИМТ или динамика массы соответствуют положительному скринингу недостаточности питания.', 'Уточнить динамику массы, фактическое потребление, переносимость пищи и причины дефицита массы; не создавать автоматический дефицит энергии.', ['kcal','protein_g']);
  }

  if (group.needsSpecialist) {
    add('specialist_age_profile', 'осторожно', 'Возраст требует отдельного расчёта', 'В возрасте до одного года потребности меняются по месяцам жизни и зависят от вида вскармливания, роста и состояния здоровья. Требуется отдельный педиатрический расчёт.', 'Использовать этот раздел как предупреждение и провести индивидуальную педиатрическую оценку.', []);
  } else if (group.child) {
    add('child_growth', 'главный', 'Рост и развитие', 'Для детского рациона используются российские возрастно-половые нормы. Энергия, белок, кальций, железо, витамин D и регулярность питания оцениваются с учётом роста и развития.', 'Проверить регулярность питания, достаточность белковых продуктов, овощей, фруктов и источников кальция. Сладкие напитки и частые сладкие перекусы оценить отдельно.', ['protein_g','calcium_mg','iron_mg','vitamin_d_mcg']);
    if (group.adolescent) {
      add('adolescent_growth_spurt', 'главный', 'Подростковый скачок роста', 'В подростковом возрасте повышается значение энергии, белка, кальция, железа, витамина D и регулярного питания; для 11–17 лет пол уже влияет на норму.', 'Сопоставить рацион с возрастными нормами энергии, белка, кальция, железа и витамина D; проверить регулярность основных приёмов пищи.', ['kcal','protein_g','calcium_mg','iron_mg','vitamin_d_mcg']);
    }
  }
  if (!group.child && group.stage === 'adult_middle') {
    add('adult_stability', 'поддерживать', 'Устойчивый взрослый рацион', 'В 30–44 года возрастная группа задаёт базовые ориентиры, а активность, цель, масса тела и качество источников энергии уточняют рекомендации.', 'Проверить структуру рациона, клетчатку, натрий, насыщенные жиры, сладкие напитки, десерты и соусы.', ['fiber_g','sodium_mg','sfa_g','added_sugars_g']);
  }
  if (!group.child && group.stage === 'adult_later') {
    add('midlife_nutrient_density', 'важный', 'Возрастной профиль 45–64', 'В 45–64 года повышается приоритет белка, клетчатки, кальция, контроля натрия, насыщенных жиров и качества углеводной основы.', 'Проверить достаточность белка, овощную основу, цельнозерновые продукты, источники кальция, натрий и насыщенные жиры.', ['protein_g','fiber_g','calcium_mg','sodium_mg','sfa_g']);
  }
  if (isFemale && !group.child && Number.isFinite(age) && age >= 51) {
    add('female_51_bone_priority', 'главный', 'Кальций и витамин D после 51 года', 'После 50 лет повышается значение кальция, витамина D, белка и витамина B12.', 'Проверить поступление кальция с пищей, витамин D, белок и витамин B12.', ['calcium_mg','vitamin_d_mcg','protein_g','vitamin_b12_mcg']);
  }
  if (isMale && !group.child && Number.isFinite(age) && age >= 45) {
    add('male_45_cardiometabolic_quality', 'важный', 'Клетчатка, натрий и жиры после 45 лет', 'Для мужчин старше 45 лет повышается значение клетчатки, контроля натрия и насыщенных жиров, достаточности белка и качества источников энергии.', 'Проверить количество овощей и цельнозерновых продуктов, натрий, насыщенные жиры, сладкие напитки, десерты и соусы.', ['fiber_g','sodium_mg','sfa_g','protein_g']);
  }
  if (group.older || state === 'elderly') {
    add('older_muscle_bone', 'главный', 'Белок, кости и мышечная ткань', 'В пожилом возрасте особенно важны достаточность белка и энергии, кальций, витамин D и витамин B12.', 'Проверить суточное количество белка, источники кальция и распределение белковых продуктов между основными приёмами пищи.', ['protein_g','calcium_mg','vitamin_d_mcg','vitamin_b12_mcg']);
    if (group.stage === 'older_late') {
      add('older_75_energy_safety', 'главный', 'Достаточность питания 75+', 'После 75 лет особенно важны достаточность энергии и белка, кальций, витамин B12 и переносимость объёма пищи.', 'Сначала проверить достаточность питания, переносимость порций и регулярность белковых продуктов и источников кальция. Ограничения требуют особой осторожности.', ['kcal','protein_g','calcium_mg','vitamin_b12_mcg']);
    }
  }
  if (state === 'ckd') {
    add('renal_caution', 'осторожно', 'Белок только с клиническим контролем', 'При ХБП без диализа автоматическое повышение белка не используется.', 'Оценивать белок вместе со стадией ХБП, функцией почек и назначениями врача.', ['protein_g','phosphorus_mg','sodium_mg']);
  } else if (state === 'dialysis') {
    add('dialysis_protein', 'главный', 'Белок и потери на диализе', 'Диализ требует отдельной белковой логики и контроля электролитов.', 'Проверить белок, фосфор, натрий и калий с учётом клинических назначений.', ['protein_g','phosphorus_mg','sodium_mg','potassium_mg']);
  } else if (['rehab','postop','oncology'].indexOf(state) >= 0) {
    add('recovery_protein', 'главный', 'Восстановление тканей', 'В период восстановления повышается значение белка, энергии, кальция и общей питательной ценности рациона.', 'Проверить, закрывает ли рацион белок и есть ли белковый продукт в каждом основном приёме пищи.', ['protein_g','kcal','calcium_mg','zinc_mg']);
  }
  if (activity === 'high' || activity === 'veryhigh') {
    add('activity_recovery', 'главный', 'Нагрузка и восстановление', 'При высокой активности необходимо оценить достаточность энергии, белка и углеводов, а также жидкость и восстановление после нагрузки.', 'Проверить суточное количество белка, углеводы до и после нагрузки и общую достаточность энергии. Сладкие и жирные продукты оценить отдельно.', ['protein_g','carbs_g','kcal','potassium_mg','magnesium_mg']);
  } else if (activity === 'sedentary') {
    add('nutrient_density', 'важный', 'Нутриентная плотность', 'При малоподвижном образе жизни потребность в энергии ниже, поэтому особенно важна питательная ценность каждого приёма пищи.', 'Увеличить долю овощей, белковых продуктов и источников клетчатки и кальция; отдельно оценить сладкие напитки, десерты, соусы и жирные добавки.', ['fiber_g','protein_g','calcium_mg','sodium_mg','added_sugars_g']);
  }
  if (refeedingRisk && refeedingRisk.highRisk) {
    // The selected goal remains visible as context, but no ordinary gain/loss recommendation is generated.
  } else if (meta.protectedPolicy && meta.protectedPolicy.localRecommendationsAllowed === false) {
    add('protected_mode_priority', 'главный', 'Защищённый режим', 'Автоматические цели изменения массы и продуктовые перестройки отключены, чтобы справочный расчёт не воспринимался как назначение.', 'Использовать фактический анализ рациона и жизненные/клинические ориентиры как материал для профессиональной проверки.', ['kcal','protein_g']);
  } else if (goal === 'lose') {
    if (group.child) {
      add('child_weight_caution', 'осторожно', 'Детская масса: без взрослого дефицита', 'При вопросах о массе ребёнка основными ориентирами остаются рост, развитие, регулярность питания, белок, кальций, овощи и фрукты. Сладкие напитки оцениваются отдельно.', 'Использовать отчёт для мягкой коррекции качества рациона. Вопросы по массе, росту или аппетиту требуют оценки специалиста.', ['kcal','protein_g','calcium_mg','iron_mg','vitamin_d_mcg','fiber_g']);
    } else if (guardrailBlocksAutoDeficit(guardrail)) {
      add('guarded_weight_goal', 'осторожно', 'Снижение массы: защитный режим', 'Выбран чувствительный сценарий. Расчёт сосредоточен на регулярности питания, достаточности нутриентов и безопасности рекомендаций.', 'Проверить регулярность питания, достаточность белка, кальция, железа и клетчатки, а также качество продуктовых источников. Изменение массы требует очной тактики.', ['kcal','protein_g','fiber_g','calcium_mg','iron_mg']);
    } else {
      add('weight_loss_quality', 'главный', 'Снижение массы без потери качества', 'При снижении массы особенно важно сохранять достаточность белка, клетчатки и кальция и полноценную структуру рациона.', 'В первую очередь оценить сладкие напитки, десерты, соусы и жирные добавки. Белковые продукты и овощная основа должны сохраняться.', ['protein_g','fiber_g','calcium_mg','added_sugars_g','sfa_g']);
    }
  } else if (goal === 'gain' || goal === 'rehab_gain') {
    add('gain_quality', 'главный', 'Качественный набор массы', 'Для набора массы важны достаточность энергии, белка и углеводов, а также полноценный микронутриентный состав рациона.', 'Добавлять калорийность через полноценные продукты: крупы, белковые продукты, молочные или обогащённые альтернативы, орехи и масла в разумной порции.', ['kcal','protein_g','carbs_g','calcium_mg']);
  }
  if (isFemale && Number.isFinite(age) && age >= 14 && age <= 50) {
    add('female_iron_folate', 'важный', 'Железо и фолат', 'Для женского профиля репродуктивного возраста железо и фолат требуют отдельного внимания.', 'Сопоставить фактическое поступление железа и фолата с ориентирами. Растительные источники железа сочетать с продуктами, богатыми витамином C.', ['iron_mg','vitamin_b9_mcg','vitamin_c_mg']);
  }
  if (!(refeedingRisk && refeedingRisk.highRisk) && !group.child && !group.needsSpecialist && ((Number.isFinite(bmi) && bmi < 18.5) || meta.lowBMIOverride)) {
    add('low_bmi_safety', 'осторожно', 'Недостаточная масса', 'При низком ИМТ приоритетом становится постепенное повышение достаточности питания и переносимости увеличенного рациона.', 'Проверить энергию, белок и переносимость увеличения рациона; выраженный дефицит массы требует очной оценки.', ['kcal','protein_g','phosphorus_mg','magnesium_mg']);
  }
  if (dietStyle === 'no_dairy') {
    add('no_dairy_calcium_layer', 'главный', 'Кальций без молочных продуктов', 'При рационе без молочных продуктов кальций, витамин D, витамин B12 и белок необходимо обеспечивать другими пищевыми источниками или обогащёнными альтернативами.', 'Проверить кальций, витамин D, витамин B12 и белок. В качестве источников кальция рассмотреть обогащённые напитки и йогурты, тофу с кальцием, рыбу с костями и другие подходящие продукты.', ['calcium_mg','vitamin_d_mcg','vitamin_b12_mcg','protein_g']);
  }
  if (dietStyle === 'plant_forward' || dietStyle === 'vegetarian') {
    add('plant_forward_micronutrients', 'важный', dietStyle === 'vegetarian' ? 'Вегетарианский профиль' : 'Растительный акцент', 'Чем выше доля растительных продуктов, тем внимательнее следует оценивать белок, железо, цинк, кальций, B12 и витамин D.', 'Проверить сочетание бобовых, соевых продуктов, круп, орехов и семян. Источники растительного железа сочетать с продуктами, богатыми витамином C.', ['protein_g','iron_mg','zinc_mg','calcium_mg','vitamin_b12_mcg','vitamin_d_mcg','vitamin_c_mg']);
  }
  if (dietStyle === 'low_appetite') {
    add('low_appetite_density', 'главный', 'Малый объём еды', 'При сниженном аппетите особенно важна питательная ценность небольших порций: белок, энергия, кальций и ключевые микронутриенты.', 'Добавить в небольшие порции белковый продукт, кисломолочный или обогащённый кальцием вариант и подходящий источник жиров; проверить удобство режима и переносимость.', ['kcal','protein_g','calcium_mg','vitamin_d_mcg','vitamin_b12_mcg','zinc_mg']);
  }
  if (guardrail === 'pregnancy') {
    add('pregnancy_guardrail', 'осторожно', 'Беременность: отдельный жизненный профиль', 'Для взрослой неосложнённой одноплодной беременности калькулятор использует отдельную справочную EER и жизненные нутриентные ориентиры, но не рассчитывает целевую прибавку массы и не формирует назначение.', 'Использовать расчёт как обзор рациона: проверить регулярность, белок, железо, фолат, кальций и витамин D, а добавки и лечебные ограничения согласовывать со специалистом.', ['kcal','protein_g','iron_mg','vitamin_b9_mcg','calcium_mg','vitamin_d_mcg']);
  } else if (guardrail === 'lactation') {
    add('lactation_guardrail', 'осторожно', 'Лактация: отдельный жизненный профиль', 'Для поддерживаемого периода лактации калькулятор учитывает отдельную энергетическую поправку и ключевые жизненные ориентиры, но не оценивает индивидуальную продукцию молока.', 'Не начинать с дефицита; использовать отчёт для поиска слабых мест рациона и обсуждать выраженные ограничения со специалистом.', ['kcal','protein_g','calcium_mg','vitamin_d_mcg','iron_mg']);
  } else if (guardrail === 'ed_risk') {
    add('ed_guardrail', 'осторожно', 'Риск РПП или выраженных ограничений', 'При риске нарушений пищевого поведения опасна автоматическая ограничительная логика: подсказки должны поддерживать регулярность и достаточность, а не усиливать контроль.', 'Не использовать снижение калорийности как автоматическую цель; оценивать регулярность, белок, энергию и безопасность рекомендаций вместе со специалистом.', ['kcal','protein_g','calcium_mg','iron_mg','vitamin_b12_mcg']);
  } else if (guardrail === 'medical_restriction') {
    add('medical_restriction_guardrail', 'осторожно', 'Медицинские ограничения', 'При медицинских ограничениях рацион нельзя исправлять только общими правилами качества: часть продуктовых замен может быть противопоказана.', 'Использовать калькулятор как карту фактического рациона и сверять изменения с диагнозом, анализами и назначениями специалиста.', ['protein_g','sodium_mg','potassium_mg','phosphorus_mg','calcium_mg']);
  }
  if (!map.plant_fiber && !group.child) {
    add('plant_fiber', 'поддерживать', 'Овощи, фрукты и клетчатка', 'Клетчатка, овощи, фрукты и цельнозерновые продукты поддерживают структуру рациона и его общую питательную ценность.', 'Проверить овощную основу, количество фруктов и долю цельнозерновых продуктов. Овощи и фрукты оцениваются раздельно.', ['fiber_g','potassium_mg','vitamin_c_mg']);
  }

  var nutrientFocusKeys = [];
  var priorityWeights = {};
  var priorityReasons = {};
  function levelWeight(level){
    level = String(level || '').toLowerCase();
    if (level.indexOf('глав') >= 0) return 4;
    if (level.indexOf('осторож') >= 0) return 3;
    if (level.indexOf('важ') >= 0) return 3;
    if (level.indexOf('поддерж') >= 0) return 1;
    return 2;
  }
  priorities.forEach(function(p){
    (p.nutrients || []).forEach(function(k){
      if (nutrientFocusKeys.indexOf(k) < 0) nutrientFocusKeys.push(k);
      priorityWeights[k] = Math.max(Number(priorityWeights[k] || 0), levelWeight(p.level));
      if (!priorityReasons[k]) priorityReasons[k] = [];
      if (priorityReasons[k].length < 3) priorityReasons[k].push({ title:p.title, level:p.level, why:p.why, action:p.action });
    });
  });
  if (!(group && group.needsSpecialist)) {
    ['protein_g','fiber_g','calcium_mg','vitamin_d_mcg','iron_mg','vitamin_b12_mcg','sodium_mg','added_sugars_g','sfa_g'].forEach(function(k){ if (nutrientFocusKeys.indexOf(k) < 0) nutrientFocusKeys.push(k); });
  }
  var targetMeta = personalTargetMeta(meta, group, isFemale, isMale, age);
  var childNorm = group && group.norm ? group.norm : null;
  var scenarioFactors = buildScenarioFactors({ group:group, isFemale:isFemale, isMale:isMale, age:age, sexLabel:sexLabel, state:state, stateLabel:stateLabel, activity:activity, actLabel:actLabel, goal:goal, goalLabel:goalLabel, dietStyle:dietStyle, dietStyleLabel:dietStyleLabel, guardrail:guardrail, guardrailLabel:guardrailLabel, refeedingRisk:refeedingRisk });
  return {
    version:'v5.3.155_calculation_core_ssot_pass1',
    age:Number.isFinite(age) ? age : null,
    ageGroup:group,
    sex:sex,
    sexLabel:sexLabel,
    state:state,
    stateLabel:stateLabel,
    activity:activity,
    activityLabel:actLabel,
    goal:goal,
    goalLabel:goalLabel,
    dietStyle:dietStyle,
    dietStyleLabel:dietStyleLabel,
    guardrail:guardrail,
    guardrailLabel:guardrailLabel,
    method:meta.method || '',
    lifeStageResult:meta.lifeStageResult || null,
    lifeStageTargets:meta.lifeStageTargets || null,
    clinicalManualEnergyApplied:!!meta.clinicalManualEnergyApplied,
    manualClinicalEnergy:meta.manualClinicalEnergy || null,
    clinicalManualProteinApplied:!!meta.clinicalManualProteinApplied,
    manualClinicalProtein:meta.manualClinicalProtein || null,
    goalGuardrailOverride: meta.goalGuardrailOverride || '',
    refeedingRisk:refeedingRisk,
    proteinTargetG: Number(meta.totalProtein || 0),
    proteinPerKg: Number(meta.proteinPerKg || 0),
    targets:numericTargetMap(targetMeta),
    targetMeta:targetMeta,
    priorities:priorities,
    nutrientFocusKeys:nutrientFocusKeys,
    priorityWeights:priorityWeights,
    priorityReasons:priorityReasons,
    scenarioFactors:scenarioFactors,
    scenarioSignature:scenarioFactors.map(function(f){ return f.value; }).filter(Boolean).join(' · '),
    childRussianNorm:childNorm,
    normBasis:childNorm ? russianChildNormBasis() : '',
    caution: buildPersonalProfileCautionV5367(group, state, guardrail, meta.goalGuardrailOverride, refeedingRisk)
  };
}
function buildPersonalProfileCautionV5367(group, state, guardrail, goalGuardrailOverride, refeedingRisk){
  var parts = [];
  group = group || {};
  if (group.needsSpecialist) parts.push('Для возраста до 1 года автоматический расчёт потребностей в этой версии не применяется: нужны месяцы жизни, тип вскармливания, динамика роста и очная педиатрическая оценка.');
  else if (group.child) parts.push('Детский рацион рассчитан по возрастно-половым российским нормам МР 2.3.1.0253-21. Его нельзя оценивать как уменьшенную взрослую модель: взрослая BMI/IBW/AdjBW-логика выбора массы отключена; при сомнениях по росту, массе, аппетиту или заболеванию нужна очная оценка специалиста.');
  if (state === 'ckd' || state === 'dialysis') parts.push('Почечный профиль требует клинического контроля. Расчёт помогает увидеть рацион, но не заменяет назначения.');
  if (guardrail === 'pregnancy') parts.push('Беременность: справочный EER/DRI предназначен только для поддерживаемого неосложнённого одноплодного сценария, не задаёт целевую прибавку массы и не должен использоваться для самостоятельного снижения массы или назначения добавок.');
  if (guardrail === 'lactation') parts.push('Лактация: справочный EER/DRI не оценивает индивидуальную продукцию молока и не заменяет индивидуальный расчёт энергии, жидкости, микронутриентов или назначения добавок.');
  if (guardrail === 'ed_risk') parts.push('Риск РПП/выраженных ограничений: не использовать отчёт для усиления ограничительного поведения; нужна поддерживающая, очная тактика.');
  if (guardrail === 'medical_restriction') parts.push('Медицинские ограничения: продуктовые замены нужно сверять с диагнозом, анализами и назначениями.');
  if (refeedingRisk && refeedingRisk.highRisk) parts.push('Высокий риск рефидинга: показанные КБЖУ являются оценкой полной потребности и не должны автоматически использоваться как начальная схема питания. Требуются индивидуальная тактика и мониторинг специалистом.');
  if (goalGuardrailOverride) parts.push(goalGuardrailOverride);
  return parts.join(' ');
}
const GOAL_FACTOR = {
  maintain:   { gf: 1.00, note: 'без уклона' },
  lose:       { gf: 0.85, note: 'дефицит ~15%' },
  gain:       { gf: 1.10, note: 'профицит ~10%' },
  rehab_gain: { gf: 1.10, note: 'профицит ~10%' }
};
function goalFactorByKey(goalKey){
  const cfg = GOAL_FACTOR[goalKey] || GOAL_FACTOR.maintain;
  let s = Number(cfg.gf) || 1.0;
  if (s < 0.75) s = 0.75; if (s > 1.25) s = 1.25;
  return s;
}
function energyByMifflinSF(state, sex, h, w, age, activity){
    const st = (STATE && STATE[state]) ? STATE[state] : null;
    if (st && st.externalTargetOnly) return null;
    const sf = (st && typeof st.teeAdj==='number') ? st.teeAdj : 1.0;
    const r = mifflinBMR(sex, w, h, age);
    if(!r) return null;
    const act = ACT[activity] || ACT.low;
    // TEE = BMR × PAL × state factor. Clinical states never enter this path.
    const teeCore = act.energy * sf;
    const tee = Math.round(r.bmr * teeCore);
    return { low: tee, high: Math.round(tee*1.10), bmr: r.bmr, s:r.s, act: act.energy, sf };
  }
function formulaAuditP14(ids){
    var r=window.NutritionFormulaRegistryP14;
    return r&&typeof r.audit==='function' ? r.audit(ids) : {registryVersion:null,registrySha256:null,formulaIds:(ids||[]).slice(),formulas:[]};
  }
function calcNeeds_internal(){
    /* RC1 mobile first-tap hardening: settle the deferred age-profile selector
       before reading inputs so a late debounce cannot supersede this calculation. */
    try { if (typeof window.__cancelNeedsAgeProfilePending === 'function') window.__cancelNeedsAgeProfilePending({render:false}); } catch(_) {}
    const sex = $('needs_sex').value;
    const h = toNum($('needs_h').value);
    const w = toNum($('needs_w').value);
    const age = toNum($('needs_age').value);
    const state = $('needs_state').value;
    const activity = $('needs_activity').value;
    const edema = $('needs_edema').value;
    const goal = $('needs_goal').value;
    const dietStyle = $('needs_diet_style') ? $('needs_diet_style').value : 'mixed';
    const guardrail = $('needs_guardrail') ? $('needs_guardrail').value : 'none';
    const dietStyleLabel = labelFromRegistry(DIET_STYLE_V5367, dietStyle, 'Смешанный рацион');
    const guardrailLabel = labelFromRegistry(GUARDRAIL_PROFILE_V5367, guardrail, 'Нет');
    const manualProt = toNum($('needs_protein_manual').value);
    const manualClinicalEnergy = $('needs_clinical_energy_manual') ? toNum($('needs_clinical_energy_manual').value) : null;
    const previousWeight = $('needs_prev_w') ? toNum($('needs_prev_w').value) : null;
    const lowIntakeDays = $('needs_low_intake_days') ? toNum($('needs_low_intake_days').value) : null;
    const electrolytes = $('needs_electrolytes') ? $('needs_electrolytes').value : 'unknown';
    const additionalRefeedingFactors = $('needs_refeeding_factors') ? $('needs_refeeding_factors').value : 'unknown';
    const manualCalculationWeight = $('needs_calc_w_manual') ? toNum($('needs_calc_w_manual').value) : null;
    const splitRaw = $('needs_split').value;
    const split = parseSplit(splitRaw);

    if(!h || !w){ alert('Укажите рост и массу.'); return null; }
    if(!Number.isFinite(age) || age < 1 || age > 120){ alert('Укажите возраст от 1 до 120 лет: он нужен для энергии и возрастных норм.'); return null; }
    if(h < 80 || h > 250 || w < 15 || w > 400){ alert('Проверьте рост и массу: введённые значения выходят за рабочий диапазон калькулятора.'); return null; }
    const bmi = computeBMI(h,w);
    $('needs_bmi').value = isNaN(bmi)? '' : bmi;
    const refeedingRisk = assessAdultRefeedingRisk({ age:age, bmi:bmi, currentWeight:w, previousWeight:previousWeight, lowIntakeDays:lowIntakeDays, electrolytes:electrolytes, additionalFactors:additionalRefeedingFactors });
    if ($('needs_weight_loss_pct')) $('needs_weight_loss_pct').value = refeedingRisk.weightLossPct==null ? '—' : (refeedingRisk.weightLossPct.toFixed(1).replace('.0','') + ' %');
    const protectedContext = window.ProtectedModesP03 ? Object.assign({}, window.ProtectedModesP03.readContext(), {
      state:state, guardrail:guardrail, sex:sex, age:age, height:h, currentWeight:w, activity:activity, edema:edema,
      clinicalEnergyManual:manualClinicalEnergy, clinicalProteinManual:manualProt,
      refeedingHighRisk:!!refeedingRisk.highRisk
    }) : {state:state,guardrail:guardrail,sex:sex,age:age,height:h,currentWeight:w,activity:activity,refeedingHighRisk:!!refeedingRisk.highRisk};
    const protectedPolicy = window.ProtectedModesP03 ? window.ProtectedModesP03.evaluate(protectedContext) : {
      protectedMode:false,estimateOnly:false,goalFactorAllowed:true,normsSyncAllowed:true,mealSplitAllowed:true,automaticPlannerAllowed:true,geminiAllowed:true,localRecommendationsAllowed:true,calculationAllowed:true,reasons:[],errors:[]
    };
    const protectedScenarioLabels = [];
    if (guardrail !== 'none') protectedScenarioLabels.push(guardrailLabel);
    if (protectedPolicy.additionalEdRisk && guardrail !== 'ed_risk') protectedScenarioLabels.push('текущий/недавний риск РПП');
    if (protectedPolicy.additionalMedicalRestriction && guardrail !== 'medical_restriction') protectedScenarioLabels.push('дополнительные медицинские ограничения');
    const effectiveGuardrailLabel = protectedScenarioLabels.length ? protectedScenarioLabels.join(' + ') : guardrailLabel;
    if (window.ProtectedModesP03) window.ProtectedModesP03.renderUi();
    if (protectedPolicy.calculationAllowed === false) {
      const items = (protectedPolicy.errors || []).map(x=>'<li>'+x+'</li>').join('');
      try { if(window.NeedsCalculationStateV53211) window.NeedsCalculationStateV53211.invalidate('protected_calculation_blocked'); window.__lastNeedsMeta = {protectedPolicy:protectedPolicy,guardrail:guardrail,state:state,refeedingRisk:refeedingRisk,automaticPlannerAllowed:false,normsSyncAllowed:false,geminiAllowed:false}; } catch(_) {}
      $('needs_out').innerHTML = '<div class="alert alert-danger"><b>Автоматический расчёт защищённого режима остановлен.</b><ul style="margin:8px 0 0 18px;">'+items+'</ul><div class="small" style="margin-top:8px;">Фактический анализ введённого рациона остаётся доступным. Исправьте исходные данные либо используйте индивидуально подтверждённые клинические цели.</div></div>';
      return null;
    }

    if (Number.isFinite(age) && age > 0 && age < 1) {
      var infantProfile = buildPersonalNeedsProfile({ sex:sex, h:h, w:w, age:age, state:state, activity:activity, goal:goal, dietStyle:dietStyle, guardrail:guardrail, dietStyleLabel:dietStyleLabel, guardrailLabel:effectiveGuardrailLabel, bmi:bmi, stateLabel:STATE[state]?.label || state, activityLabel:ACT[activity]?.label || activity, goalLabel:{maintain:'Поддержание',lose:'Снижение',gain:'Набор',rehab_gain:'Реабилитация/набор'}[goal] || goal });
      try { window.__lastNeedsMeta = null; window.__lastPersonalNeedsProfile = infantProfile; window.__lastNeedsProfileApplied = true; window.NeedsCalculationStateV53211.setActionsEnabled(true); } catch(_) {}
      try { renderNeedsAgeProfileIndicator(infantProfile, 'applied'); } catch(_) {}
      $('needs_out').innerHTML = '<div class="alert"><b>Возраст требует отдельного расчёта.</b><br>Для детей до 1 года автоматическая взрослая и стандартная детская логика не применяется. Нужен педиатрический расчёт с учётом месяцев жизни, вскармливания, роста, массы и медицинского контекста.</div>';
      try{ document.dispatchEvent(new CustomEvent('needs:computed', { detail: { personalProfile: infantProfile, age:age, sex:sex, state:state, activity:activity, goal:goal, dietStyle:dietStyle, guardrail:guardrail, unsupportedAge:true } })); }catch(_){ }
      return null;
    }

    const clinicalExternalTargetApplied = !!(protectedPolicy.clinicalTargetReady && protectedPolicy.clinicalTarget && protectedPolicy.externalTargetOnly === true);
    const clinicalTarget = clinicalExternalTargetApplied ? protectedPolicy.clinicalTarget : null;
    const auto = clinicalExternalTargetApplied
      ? {weightChoice:'clinical_reference', f:0, method:'clinical_external', reason:'Используется расчётная/сухая масса, указанная во внешней клинической цели; формула выбора массы калькулятора не применяется.', lowBMIOverride:false, pediatricWeightLogic:false}
      : computeAutoParams({sex,h,w,age,state,activity,edema,manualCalculationWeight,refeedingRisk});
    if (auto.weightChoice === 'manual_required') {
      $('needs_out').innerHTML = '<div class="alert alert-danger"><b>Автоматический расчёт остановлен.</b><br>При сочетании низкого ИМТ с отёками/асцитом или сложным почечным профилем калькулятор не подменяет сухую или клиническую расчётную массу значением Devine. Укажите подтверждённую специалистом расчётную/сухую массу либо используйте только фактический анализ рациона без автоматических потребностей.</div>';
      try { if(window.NeedsCalculationStateV53211) window.NeedsCalculationStateV53211.invalidate('calculation_blocked'); else { window.__lastNeedsMeta=null; window.__lastPersonalNeedsProfile=null; window.__lastNeedsProfileApplied=false; } } catch(_) {}
      return null;
    }
    const ibw = computeIBW(sex,h);
    const requiresDevineWeight = auto.weightChoice==='ibw' || auto.weightChoice==='adjusted';
    if (requiresDevineWeight && ibw==null) {
      $('needs_out').innerHTML = '<div class="alert"><b>Автоматический расчёт остановлен.</b><br>Для роста ниже 152 см калькулятор не экстраполирует формулу Devine. В выбранном состоянии требуется идеальная или скорректированная масса тела, поэтому массу для расчёта должен определить специалист или утверждённая отдельная методика.</div>';
      try { if(window.NeedsCalculationStateV53211) window.NeedsCalculationStateV53211.invalidate('calculation_blocked'); else { window.__lastNeedsMeta=null; window.__lastPersonalNeedsProfile=null; window.__lastNeedsProfileApplied=false; } } catch(_) {}
      return null;
    }
    const adjW = (ibw!=null) ? computeAdjusted(ibw,w,auto.f) : null;
    let usedWeight = clinicalExternalTargetApplied ? Number(clinicalTarget.referenceWeightKg) : w;
    if(!clinicalExternalTargetApplied){
      if(auto.weightChoice==='adjusted' && adjW!=null) usedWeight = adjW;
      else if(auto.weightChoice==='ibw' && ibw!=null) usedWeight = ibw;
      else if(auto.weightChoice==='manual' && manualCalculationWeight!=null) usedWeight = manualCalculationWeight;
    }

    // Energy: clinical states never enter a generic formula. Their only working value is the validated external target.
    const childNorm = russianChildNormFor(age, sex);
    const lifeStageResult = window.ProtectedModesP03 ? window.ProtectedModesP03.calculateLifeStage(protectedContext) : null;
    const clinicalWeightOnly = !clinicalExternalTargetApplied && edema === 'yes';
    let e;
    if(clinicalExternalTargetApplied){
      e = {low:Math.round(clinicalTarget.energy), high:Math.round(clinicalTarget.energy), act:null, sf:null, bmr:null, kcalPerKg:+(clinicalTarget.energy/usedWeight).toFixed(1)};
    }else{
      const eWeight = energyByWeightMethod(state,activity,usedWeight);
      const eMiff = energyByMifflinSF(state, sex, h, w, age, activity);
      e = (!clinicalWeightOnly && auto.method==='mifflin' && eMiff) ? eMiff : eWeight;
      if (lifeStageResult && lifeStageResult.energy) {
        e = {low:lifeStageResult.energy.target, high:lifeStageResult.energy.target, act:null, sf:1, bmr:null, kcalPerKg:+(lifeStageResult.energy.target/usedWeight).toFixed(1)};
      }
      if(!e){
        $('needs_out').innerHTML = '<div class="alert alert-danger"><b>Расчёт остановлен.</b><br>Для выбранного профиля нет допустимой локальной формулы. Используйте актуальную внешнюю клиническую цель.</div>';
        return null;
      }
    }
    const clinicalManualEnergyApplied = clinicalExternalTargetApplied;
    let GF = protectedPolicy.goalFactorAllowed === false ? 1.00 : goalFactorByKey(goal);
    let goalGuardrailOverride = '';
    if (refeedingRisk.highRisk && goal !== 'maintain') {
      GF = 1.00;
      goalGuardrailOverride = (refeedingRisk.extremeRisk ? 'Экстремальный' : 'Высокий') + ' риск рефидинга: автоматический дефицит или профицит отключён. Ниже показана только оценка полной потребности, не стартовая схема питания.';
    } else if (guardrail === 'pregnancy' && goal === 'lose') {
      GF = 1.00;
      goalGuardrailOverride = 'Беременность: автоматическая цель снижения массы отключена. Намеренное снижение массы во время беременности не формируется калькулятором; динамика массы оценивается индивидуально специалистом.';
    } else if (guardrail === 'lactation' && goal === 'lose') {
      GF = 1.00;
      goalGuardrailOverride = 'Лактация: автоматический дефицит отключён. Энергетическая тактика зависит от послеродовой динамики массы, объёма грудного вскармливания и клинического контекста.';
    } else if (protectedPolicy.goalFactorAllowed === false && goal !== 'maintain') {
      GF = 1.00;
      goalGuardrailOverride = 'Активный защищённый режим («' + effectiveGuardrailLabel + '») или клинический профиль отключает автоматический дефицит и профицит. Выбранная цель сохраняется только как контекст.';
    } else if (goal === 'lose' && (guardrailBlocksAutoDeficit(guardrail) || (Number.isFinite(bmi) && bmi < 18.5))) {
      GF = 1.00;
      goalGuardrailOverride = (Number.isFinite(bmi) && bmi < 18.5 ? 'ИМТ ниже 18,5: ' : 'Выбран защитный сценарий «' + effectiveGuardrailLabel + '»: ') + 'автоматический дефицит калорий для цели снижения массы отключён. Калькулятор оставляет обзор качества рациона, а изменение массы требует очной тактики.';
    }
    if (STATE[state] && STATE[state].clinicianOnly && goal !== 'maintain') {
      GF = 1.00;
      goalGuardrailOverride = 'Для клинического профиля «' + (STATE[state].label || state) + '» автоматический дефицит или профицит отключён: энергетическую цель должен подтвердить лечащий специалист.';
    }
    let method = clinicalExternalTargetApplied ? 'clinical_external' : (lifeStageResult ? 'life_stage' : (clinicalWeightOnly ? 'weight' : auto.method));
    let energyLow = Math.round(e.low * GF), energyHigh = Math.round(e.high * GF);
    let actEnergy = e.act;
    let kcalPerKg = e.kcalPerKg || Math.round(energyLow/usedWeight);
    const bmr = e.bmr || null;
    let stateEnergyAdj = e.sf ?? 1;
    const sSign = (sex==='male')?'+5':'−161';

    // Детский профиль: базовые КБЖУ берутся из российских возрастно-половых норм, а не из взрослой формулы Mifflin/г/кг.
    if (childNorm && state !== 'ckd' && state !== 'dialysis' && state !== 'icu') {
      method = 'rus_child_norm';
      GF = 1.00;
      energyLow = childNorm.kcal;
      energyHigh = childNorm.kcal;
      actEnergy = 1;
      stateEnergyAdj = 1;
      kcalPerKg = Math.round(energyLow / usedWeight);
    }

    // Белок: для клинического профиля используется только внешняя подтверждённая цель.
    let proteinPerKg = clinicalExternalTargetApplied ? +(clinicalTarget.protein / usedWeight).toFixed(2) : proteinPerKgFor(state,activity,age,goal,usedWeight,sex);
    let totalProtein = clinicalExternalTargetApplied ? Number(clinicalTarget.protein) : (childNorm && method === 'rus_child_norm' ? childNorm.protein_g : +(proteinPerKg * usedWeight).toFixed(1));
    if (!clinicalExternalTargetApplied && lifeStageResult && lifeStageResult.targets && lifeStageResult.targets.protein_g) {
      totalProtein = Number(lifeStageResult.targets.protein_g.value);
      proteinPerKg = +(totalProtein / usedWeight).toFixed(2);
    }
    const clinicalManualProteinApplied = clinicalExternalTargetApplied;
    if (!clinicalExternalTargetApplied && manualProt!=null && !protectedPolicy.protectedMode) {
      totalProtein = manualProt;
      proteinPerKg = +(totalProtein / usedWeight).toFixed(2);
    }

    // Единая рабочая энергетическая цель: по умолчанию середина рассчитанного коридора.
    // Она используется одновременно в профиле, экранных нормах, макронутриентах и модели отчёта.
    const energyTarget = childNorm && method === 'rus_child_norm'
      ? childNorm.kcal
      : (window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.chooseEnergy({energyLow, energyHigh}) : Math.round((energyLow + energyHigh) / 2));

    // Макрораспределение не выводится из клинической цели: энергия + белок не определяют жиры и углеводы однозначно.
    let fatPct = clinicalExternalTargetApplied ? null : 0.30;
    let fatKcal = clinicalExternalTargetApplied ? null : Math.round(energyTarget * fatPct);
    let fatGrams = clinicalExternalTargetApplied ? null : +(fatKcal/9).toFixed(1);
    const protKcal = Math.round(totalProtein * 4);
    let carbKcal = clinicalExternalTargetApplied ? null : Math.max(0, energyTarget - protKcal - fatKcal);
    let carbGrams = clinicalExternalTargetApplied ? null : +(carbKcal/4).toFixed(1);
    if (!clinicalExternalTargetApplied && childNorm && method === 'rus_child_norm') {
      fatGrams = childNorm.fat_g;
      carbGrams = childNorm.carbs_g;
      fatKcal = Math.round(fatGrams * 9);
      carbKcal = Math.round(carbGrams * 4);
      fatPct = energyTarget ? +(fatKcal / energyTarget).toFixed(3) : fatPct;
    }
    const lifeStageCarbMinimum = lifeStageResult && lifeStageResult.targets && lifeStageResult.targets._constraints
      ? Number(lifeStageResult.targets._constraints.carbohydrateMinimumG) : null;
    const lifeStageCarbMinimumShortfall = Number.isFinite(lifeStageCarbMinimum) && Number.isFinite(carbGrams) && carbGrams < lifeStageCarbMinimum;

    // Жидкость
    const fluidPerKg = protectedPolicy.fluidEstimateAllowed === false ? null : (STATE[state]?.fluidMlPerKg || 30);
    const fluidMl = fluidPerKg==null ? null : Math.round(fluidPerKg * usedWeight);

    // Распределение
    const parts = split.parts.map(x=>x/100);
    const meals = (protectedPolicy.mealSplitAllowed === false || clinicalExternalTargetApplied) ? [] : parts.map(pct => ({
      pct,
      kcal: Math.round(energyTarget * pct),
      protein: +(totalProtein * pct).toFixed(1),
      fat: +(fatGrams * pct).toFixed(1),
      carbs: +(carbGrams * pct).toFixed(1)
    }));

    const meta = {
      // inputs
      sex,h,w,age,state,activity,edema,goal,dietStyle,guardrail,
      previousWeight,lowIntakeDays,electrolytes,additionalRefeedingFactors,manualCalculationWeight,refeedingRisk,
      stateLabel: STATE[state]?.label || state,
      activityLabel: ACT[activity]?.label || activity,
      goalLabel: {maintain:'Поддержание',lose:'Снижение',gain:'Набор',rehab_gain:'Реабилитация/набор'}[goal],
      dietStyleLabel:dietStyleLabel,
      guardrailLabel:effectiveGuardrailLabel,
      goalGuardrailOverride:goalGuardrailOverride,
      goalFactor: GF,
      formulaAudit: formulaAuditP14((function(){
        var ids=['anthropometry.bmi','anthropometry.devine_ibw','anthropometry.adjusted_weight','anthropometry.weight_loss_pct','safety.nice_refeeding_screen','energy.goal_factor','meals.energy_split'];
        if(method==='mifflin') ids.push('energy.mifflin_st_jeor','energy.ordinary_pal');
        if(method==='weight') ids.push('energy.weight_screen');
        if(!clinicalExternalTargetApplied) ids.push('protein.ordinary_target','macros.fat_share','macros.carb_residual','fluids.ordinary_screen');
        if(lifeStageResult&&lifeStageResult.mode==='pregnancy') ids.push('energy.nasem_pregnancy_2023','protein.efsa_pregnancy');
        if(lifeStageResult&&lifeStageResult.mode==='lactation') ids.push('energy.nasem_lactation_2023','protein.efsa_lactation');
        return ids;
      })()),
      // intermediates
      bmi, ibw, adjusted: adjW, f:auto.f, weightChoice:auto.weightChoice, usedWeight, pediatricWeightLogic:!!auto.pediatricWeightLogic,
      method:method, childNorm:childNorm, actEnergy, kcalPerKg, energyPerKg: round0(energyTarget/usedWeight),
      // energy details
      bmr, sSign, energyLow, energyHigh, energyTarget, stateEnergyAdj,
      // protein
      proteinPerKg, totalProtein, pRange: clinicalExternalTargetApplied ? null : (childProteinRangeFor(age, activity, state, goal, usedWeight, sex) ? [childProteinRangeFor(age, activity, state, goal, usedWeight, sex).floor, childProteinRangeFor(age, activity, state, goal, usedWeight, sex).cap] : (STATE[state]?.pRange || [1.0,1.4])), proteinNote: proteinNoteFor({sex, w, usedWeight, state, activity, age, goal, stateLabel: STATE[state]?.label || state, activityLabel: ACT[activity]?.label || activity, goalLabel: {maintain:'Поддержание',lose:'Снижение',gain:'Набор',rehab_gain:'Реабилитация/набор'}[goal]}), manualProt: manualProt,
      // fat/carb
      fatPct, fatKcal, fatGrams, protKcal, carbKcal, carbGrams,
      // fluids
      fluidPerKg, fluidMl,
      // split
      splitLabel: splitRaw.split('|')[1].replaceAll(',',' / ') + ' %',
      meals,
      // notes
      autoReason: auto.reason + (clinicalWeightOnly ? '; при отёках используется весовой метод без PAL' : ''),
      lowBMIOverride: !!auto.lowBMIOverride,
      protectedPolicy:protectedPolicy,
      protectedContext:protectedContext,
      clinicalManualEnergyApplied:clinicalManualEnergyApplied,
      externalClinicalTargetApplied:clinicalExternalTargetApplied,
      clinicalTarget:clinicalTarget,
      manualClinicalEnergy:manualClinicalEnergy,
      clinicalManualProteinApplied:clinicalManualProteinApplied,
      manualClinicalProtein:clinicalManualProteinApplied?Number(protectedPolicy.manualClinicalProtein):null,
      lifeStageResult:lifeStageResult,
      lifeStageTargets:lifeStageResult && lifeStageResult.targets ? lifeStageResult.targets : null,
      lifeStageCarbMinimum:Number.isFinite(lifeStageCarbMinimum)?lifeStageCarbMinimum:null,
      lifeStageCarbMinimumShortfall:lifeStageCarbMinimumShortfall,
      normsSyncAllowed: !!refeedingRisk.normsSyncAllowed && protectedPolicy.normsSyncAllowed !== false,
      normsSyncBlockReason: refeedingRisk.highRisk ? 'high_refeeding_risk' : (protectedPolicy.normsSyncAllowed === false ? 'protected_mode' : ''),
      mealSplitAllowed: protectedPolicy.mealSplitAllowed !== false && !refeedingRisk.highRisk,
      automaticPlannerAllowed: !!refeedingRisk.automaticPlannerAllowed && protectedPolicy.automaticPlannerAllowed !== false,
      geminiAllowed: protectedPolicy.geminiAllowed !== false && !refeedingRisk.highRisk,
      localRecommendationsAllowed: protectedPolicy.localRecommendationsAllowed !== false && !refeedingRisk.highRisk,
      energyEstimateOnly: !!refeedingRisk.estimateOnly || protectedPolicy.estimateOnly === true
    };

    meta.personalProfile = buildPersonalNeedsProfile(meta);
    try { window.__lastNeedsMeta = meta; window.__lastPersonalNeedsProfile = meta.personalProfile; window.__lastNeedsProfileApplied = true; window.NeedsCalculationStateV53211.setActionsEnabled(true); } catch(_) {}
    try { renderNeedsAgeProfileIndicator(meta, 'applied'); } catch(_) {}
    renderReport(meta);
    return meta;
  }
  const qa = Object.freeze({ computeBMI, computeIBW, computeAdjusted, computeUnintentionalWeightLossPct,
    assessAdultRefeedingRisk, mifflinBMR, energyByWeightMethod, energyByMifflinSF,
    proteinPerKgFor, goalFactorByKey, parseSplit });
  function needs(profile = {}) {
    messages = []; fields.clear();
    fields.set('hei_map', { textContent: "{\n  \"cup_eq\": {\n    \"vegetables.leafy_raw\": 70,\n    \"vegetables.leafy_cooked\": 130,\n    \"vegetables.generic_raw\": 130,\n    \"vegetables.generic_cooked\": 130,\n    \"vegetables.legumes_cooked\": 170,\n    \"fruits.generic\": 150,\n    \"fruits.dried\": 40,\n    \"dairy.milk_yogurt\": 244,\n    \"dairy.cheese\": 42\n  },\n  \"oz_eq\": {\n    \"grains.whole_cooked\": 85,\n    \"grains.refined_cooked\": 85,\n    \"grains.dry\": 28.35,\n    \"protein.meat_fish_eggs\": 28.35,\n    \"protein.legume_cooked\": 43,\n    \"protein.nuts_seeds\": 14.0\n  }\n}" });
    const defaults = { sex:'male', state:'normal', activity:'low', edema:'no', goal:'maintain',
      diet_style:'mixed', guardrail:'none', split:'4|25,35,30,10', electrolytes:'unknown', refeeding_factors:'unknown' };
    for (const [key, value] of Object.entries({ ...defaults, ...profile })) {
      if (['region', 'kcalMode'].includes(key)) continue;
      fields.set('needs_'+key, { value:typeof value==='boolean'?'':String(value??''), checked:value===true,
        innerHTML:'', textContent:'', style:{}, dataset:{}, addEventListener(){} });
    }
    for (const key of ['h','w','age','protein_manual','clinical_energy_manual','prev_w','low_intake_days','calc_w_manual','bmi','weight_loss_pct','out']) {
      if (!fields.has('needs_'+key)) fields.set('needs_'+key,{value:'',innerHTML:'',textContent:''});
    }
    region = profile.region === 'eu' ? 'eu' : 'us';
    window.NeedsNormSyncV53155.setKcalMode(profile.kcalMode || 'avg');
    window.__lastNeedsMeta = null;
    const meta = calcNeeds_internal();
    const blocked = String($('needs_out').innerHTML || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    return { meta, errors:messages, reason:blocked, policy:meta?.protectedPolicy || window.__lastNeedsMeta?.protectedPolicy || null };
  }
  function analyze(entries) {
    ration = entries;
    const snapshot = CalculationCoreV53155.snapshot(entries);
    const intake = window.HEI.computeIntake(snapshot.foodPatternRation, DB);
    return { ...snapshot, hei:window.HEI.score(intake), sourceCommit:'4e8f51d28acc7c2c842dd859e03c3aa5e8eb22bf' };
  }
  function references(needsResult, profile) {
    const meta = needsResult?.meta;
    if (!meta || meta.normsSyncAllowed === false) return {};
    const targets = meta.personalProfile?.targetMeta || meta.personalProfile?.targetsMeta || {};
    const out = {};
    for (const [key,value] of Object.entries(targets)) {
      if (!key.startsWith('_') && Number.isFinite(value?.value)) out[key] = value;
    }
    // Registry-backed values retain regional, pediatric and life-stage coverage.
    for (const key of Object.keys(DAILY_NORMS_DEFAULT)) {
      if (out[key] || ['kcal','protein_g','fat_g','carbs_g','sugars_g','unsat_g'].includes(key)) continue;
      const context = { age:Number(profile.age), sex:profile.sex, energyKcal:meta.energyTarget };
      const life = window.ProtectedModesP03.lifeStageNutrientReference(key);
      const resolved = life?.active ? life : window.NutritionNormativeRegistry.resolveMicro(key,profile.region==='eu'?'eu':'us',context);
      if (resolved?.min && Number.isFinite(resolved.min.value)) out[key] = { ...resolved.min, unit:DAILY_NORMS_DEFAULT[key].unit, basis:resolved.basis };
    }
    return out;
  }
  return Object.freeze({ db:DB, analyze, needs, references, qa,
    defaults:DAILY_NORMS_DEFAULT, metric:metricDefinition, unit:unitOf,
    activity:ACT, states:STATE, dietStyles:DIET_STYLE_V5367, guardrails:GUARDRAIL_PROFILE_V5367,
    hei:window.HEI, protectedModes:window.ProtectedModesP03, normative:window.NutritionNormativeRegistry,
    formulas:window.NutritionFormulaRegistryP14, quality:window.ProductDataQualityV13,
    composites:window.CompositeFoodDecomposerV5376 });
}
