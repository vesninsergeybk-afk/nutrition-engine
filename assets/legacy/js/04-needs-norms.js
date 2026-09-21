// nutrition calculator v5.3.155_calculation_core_ssot_pass1
// Module: 04-needs-norms.js
// Responsibility: Needs calculator, RDA/UL helpers, automatic norm synchronization.
// v5.3.127 corrects healthy-adult protein, explicit PAL energy logic, regional micronutrient profiles and clinical guardrails.
// v5.3.132: fast adaptive debounce, duplicate-input guard and immediate commit on blur/change/Enter.
// v5.3.155: one selected energy target for the needs profile, screen norms and report; energy-linked upper limits.
(function () {
    var state = { kcalMode: 'avg', selectedEnergyKcal: 0 };
    function finite(v) { v = Number(v); return Number.isFinite(v) ? v : 0; }
    function choose(low, high) {
        low = finite(low);
        high = finite(high);
        if (!(high > 0))
            high = low;
        if (!(low > 0))
            low = high;
        var value = state.kcalMode === 'low' ? low : (state.kcalMode === 'high' ? high : Math.round((low + high) / 2));
        state.selectedEnergyKcal = Math.max(0, value || 0);
        return state.selectedEnergyKcal;
    }
    window.NeedsNormSyncV53155 = {
        version: 'v5.3.155_calculation_core_ssot_pass1',
        chooseEnergy: function (meta) { meta = meta || {}; return choose(meta.energyLow, meta.energyHigh); },
        selectedEnergy: function () { return state.selectedEnergyKcal; },
        selectedMode: function () { return state.kcalMode; },
        setKcalMode: function (mode) { if (['low', 'avg', 'high'].indexOf(mode) >= 0)
            state.kcalMode = mode; return state.kcalMode; },
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
(function () {
    function current() {
        var ageEl = document.getElementById('needs_age'), sexEl = document.getElementById('needs_sex');
        var age = ageEl && ageEl.value !== '' ? Number(ageEl.value) : NaN;
        var raw = String(sexEl ? sexEl.value : 'male').toLowerCase();
        var sex = (raw.indexOf('female') >= 0 || raw.indexOf('жен') >= 0) ? 'женщина' : 'мужчина';
        var region = 'us';
        try {
            region = window.State && State.getRegion ? State.getRegion() : 'us';
        }
        catch (_) { }
        return { age: age, sex: sex, region: region };
    }
    function renderProfileLabel() {
        var h = document.querySelector('#totalsSection h2');
        if (!h)
            return;
        var el = document.getElementById('norms_profile_label');
        if (!el) {
            el = document.createElement('span');
            el.id = 'norms_profile_label';
            el.className = 'muted';
            el.style.marginLeft = '8px';
            h.appendChild(el);
        }
        var c = current();
        if (Number.isFinite(c.age) && c.age < 18) {
            el.textContent = 'Профиль: детские нормы РФ · ' + c.sex + ' · ' + Math.round(c.age) + ' лет';
        }
        else {
            el.textContent = 'Профиль: ' + (c.region === 'eu' ? 'ЕС · EFSA' : 'США · DRI') + ' · ' + c.sex + ' · ' + (Number.isFinite(c.age) ? Math.round(c.age) + ' лет' : 'возраст не указан');
        }
    }
    function refresh() { renderProfileLabel(); try {
        if (window.renderTotals)
            window.renderTotals();
    }
    catch (_) { } }
    function init() { ['needs_age', 'needs_sex'].forEach(function (id) { var e = document.getElementById(id); if (e)
        e.addEventListener('change', refresh); }); window.addEventListener('norm:region-changed', refresh); window.addEventListener('app:ready', refresh); renderProfileLabel(); }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
// ===== extracted inline script 10; id=none =====
// Auto-apply Needs results into editable norm inputs and norms.values
(function () {
    function normNumber(key, value) {
        var n = Number(value) || 0;
        return (key === 'sfa_g' || key === 'added_sugars_g') ? Math.round(n * 10) / 10 : Math.round(n);
    }
    function setNorm(key, value, unit) {
        if (!window.norms)
            return;
        if (!window.norms.values)
            window.norms.values = {};
        if (!window.norms.values[key])
            window.norms.values[key] = { value: 0, unit: unit || (key === 'kcal' ? 'ккал' : 'г') };
        window.norms.values[key].value = normNumber(key, value);
    }
    function setInput(key, value) {
        var el = document.getElementById('normInput-' + key);
        if (el)
            el.value = String(normNumber(key, value));
    }
    document.addEventListener('needs:computed', function (ev) {
        try {
            var d = ev.detail || {};
            var kcal = window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.chooseEnergy(d) : Math.round((Number(d.energyLow || 0) + Number(d.energyHigh || d.energyLow || 0)) / 2);
            var protein = Math.round(Number(d.totalProtein || 0));
            var fat = Math.round(Number(d.fatGrams || 0));
            var carbs = Math.round(Number(d.carbGrams || 0));
            var limits = window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.upperLimitsForEnergy(kcal) : {sfa_g:0,added_sugars_g:0,provenance:{registryMissing:true}};
            // Update norms first
            setNorm('kcal', kcal, 'ккал');
            setNorm('protein_g', protein, 'г');
            setNorm('fat_g', fat, 'г');
            setNorm('carbs_g', carbs, 'г');
            setNorm('sfa_g', limits.sfa_g, 'г');
            setNorm('added_sugars_g', limits.added_sugars_g, 'г');
            // Then update inputs (if the current render is still on screen)
            setInput('kcal', kcal);
            setInput('protein_g', protein);
            setInput('fat_g', fat);
            setInput('carbs_g', carbs);
            setInput('sfa_g', limits.sfa_g);
            setInput('added_sugars_g', limits.added_sugars_g);
            // Re-render totals to refresh bars, captions and inputs
            if (typeof renderTotals === 'function')
                renderTotals();
            // Set sync note if present
            var note = document.getElementById('needsSyncNote');
            if (note)
                note.textContent = 'Нормы Б/Ж/У и ккал автоматически установлены из калькулятора потребностей.';
            // Dev trace
            if (window.Logger && Logger.info)
                Logger.info('Needs→TotalsInputs applied', { kcal, protein, fat, carbs, sfa_g: limits.sfa_g, added_sugars_g: limits.added_sugars_g });
        }
        catch (e) {
            try {
                console.error(e);
            }
            catch (_) { }
        }
    });
})();
;
// ===== extracted inline script 11; id=none =====
(function () {
    'use strict';
    // ---------- helpers ----------
    const $ = (id) => document.getElementById(id);
    const toNum = (v) => (v === '' || v == null || v === undefined || isNaN(Number(v))) ? null : Number(v);
    const round1 = (v) => Math.round((v + Number.EPSILON) * 10) / 10;
    const round0 = (v) => Math.round((v + Number.EPSILON));
    function computeBMI(h, w) {
        h = toNum(h);
        w = toNum(w);
        if (!h || !w)
            return NaN;
        return round1(w / Math.pow(h / 100, 2));
    }
    // Devine IBW
    function computeIBW(sex, h) {
        h = toNum(h);
        if (!h)
            return null;
        const delta = Math.max(0, h - 152);
        return (sex === 'male') ? (50 + 0.9 * delta) : (45.5 + 0.9 * delta);
    }
    function computeAdjusted(ibw, w, f = 0.25) {
        if (ibw == null || w == null)
            return null;
        return ibw + f * (w - ibw);
    }
    function mifflinBMR(sex, w, h, age) {
        const _sx = (sex || '').toString().toLowerCase();
        sex = (_sx.startsWith('m') || _sx.startsWith('м')) ? 'male' : 'female';
        if ([w, h, age].some(x => x == null || isNaN(x)))
            return null;
        const s = (sex === 'male') ? 5 : -161;
        const bmr = (10 * w + 6.25 * h - 5 * age + s);
        return { bmr: bmr, s };
    }
    // Explicit physical-activity levels (PAL) used directly with Mifflin–St Jeor.
    const ACT = {
        sedentary: { energy: 1.20, protein: 1.00, label: 'Малоподвижный' },
        low: { energy: 1.35, protein: 1.00, label: 'Низкая' },
        moderate: { energy: 1.50, protein: 1.00, label: 'Умеренная' },
        high: { energy: 1.70, protein: 1.00, label: 'Высокая' },
        veryhigh: { energy: 1.90, protein: 1.00, label: 'Очень высокая' }
    };
    // State profiles are screening corridors, not prescriptions. Activity is ignored for ICU.
    const STATE = {
        normal: { teeAdj: 1.00, kcalPerKg: 25, pRange: [0.8, 1.2], fluidMlPerKg: 30, label: 'Обычное' },
        rehab: { teeAdj: 1.05, kcalPerKg: 27, pRange: [1.2, 1.5], fluidMlPerKg: 30, label: 'Реабилитация/набор' },
        preop: { teeAdj: 1.00, kcalPerKg: 25, pRange: [1.0, 1.5], fluidMlPerKg: 30, label: 'Предоперационный' },
        postop: { teeAdj: 1.05, kcalPerKg: 27, pRange: [1.2, 1.5], fluidMlPerKg: 30, label: 'Послеоперационный' },
        icu: { teeAdj: 1.00, kcalPerKg: 22, pRange: [1.2, 1.3], fluidMlPerKg: 25, label: 'Критическое (ОРИТ)', clinicianOnly: true, ignoreActivity: true },
        elderly: { teeAdj: 1.00, kcalPerKg: 25, pRange: [1.0, 1.2], fluidMlPerKg: 30, label: 'Пожилой' },
        ckd: { teeAdj: 1.00, kcalPerKg: 25, pRange: [0.8, 0.8], fluidMlPerKg: 25, label: 'ХБП G3–G5 без диализа', clinicianOnly: true, ignoreActivity: true },
        dialysis: { teeAdj: 1.00, kcalPerKg: 30, pRange: [1.0, 1.2], fluidMlPerKg: 30, label: 'Диализ', clinicianOnly: true, ignoreActivity: true },
        oncology: { teeAdj: 1.00, kcalPerKg: 25, pRange: [1.0, 1.5], fluidMlPerKg: 30, label: 'Онкология', clinicianOnly: true },
    };
    // v5.3.67 explicit diet-style and safety-guardrail layer.
    // These flags change interpretation and safeguards; they do not diagnose or prescribe treatment.
    const DIET_STYLE_V5367 = {
        mixed: { label: 'Смешанный рацион', short: 'смешанный', meaning: 'Обычный смешанный рацион: пищевые приоритеты задаются возрастом, полом, активностью, целью и фактической структурой.' },
        no_dairy: { label: 'Без молочных продуктов', short: 'без молочных', meaning: 'При рационе без молочных продуктов особенно внимательно оцениваются кальций, витамин D, B12 и белок. Основными источниками могут быть обогащённые продукты и другие подходящие пищевые источники кальция.' },
        plant_forward: { label: 'Преимущественно растительный', short: 'растительный акцент', meaning: 'Преимущественно растительный рацион: важны белок, железо, цинк, кальций, B12 и сочетание растительных источников железа с витамином C.' },
        vegetarian: { label: 'Вегетарианский', short: 'вегетарианский', meaning: 'При вегетарианском рационе отдельно оцениваются белок, железо, цинк, кальций, витамин B12, витамин D и достаточность энергии.' },
        low_appetite: { label: 'Сниженный аппетит / малый объём еды', short: 'малый объём еды', meaning: 'При сниженном аппетите важна нутриентная плотность: больше белка, кальция, энергии и микронутриентов в меньшем объёме еды.' }
    };
    const GUARDRAIL_PROFILE_V5367 = {
        none: { label: 'Нет', short: 'без защитного сценария', meaning: 'Дополнительный защитный сценарий не выбран.' },
        pregnancy: { label: 'Беременность', short: 'беременность', meaning: 'Беременность: калькулятор не строит лечебный или акушерский расчёт; дефицит калорий автоматически не применяется, нужны очные рекомендации специалиста.' },
        lactation: { label: 'Лактация', short: 'лактация', meaning: 'Лактация: калькулятор не заменяет индивидуальный расчёт; дефицит калорий автоматически не применяется, важны энергия, белок, кальций, витамин D, йод/железо по назначению.' },
        ed_risk: { label: 'Риск РПП / выраженные ограничения', short: 'риск РПП', meaning: 'При риске РПП или выраженных ограничениях калькулятор не усиливает ограничительную логику; приоритет — регулярность, достаточность и очная помощь.' },
        medical_restriction: { label: 'Есть медицинские ограничения', short: 'медицинские ограничения', meaning: 'Медицинские ограничения требуют очной индивидуализации; калькулятор показывает структуру рациона, но не заменяет назначения.' }
    };
    function labelFromRegistry(registry, key, fallback) {
        var item = registry && registry[String(key || '')];
        return (item && item.label) || fallback || String(key || '');
    }
    function guardrailBlocksAutoDeficit(guardrail) {
        return guardrail === 'pregnancy' || guardrail === 'lactation' || guardrail === 'ed_risk';
    }
    function pediatricAgeForNeeds(age) {
        age = Number(age);
        return Number.isFinite(age) && age >= 1 && age < 18;
    }
    function automaticChildNormAllowedForState(state) {
        // In renal replacement/ICU contexts a child needs a specialist clinical calculation.
        return ['ckd', 'dialysis', 'icu'].indexOf(String(state || '')) < 0;
    }
    // Protein targets in g/kg/day. Healthy-adult RDA is 0.8 g/kg; higher values are conditional targets.
    const PROTEIN_TARGETS_V44 = {
        normal: { sedentary: 0.80, low: 0.90, moderate: 1.05, high: 1.20, veryhigh: 1.40, floor: 0.80, cap: 1.60, note: 'Здоровый взрослый: 0,8 г/кг — базовая RDA; более высокие значения применяются как практический ориентир при активности или цели, а не как обязательная норма.' },
        rehab: { sedentary: 1.20, low: 1.20, moderate: 1.30, high: 1.40, veryhigh: 1.50, floor: 1.20, cap: 1.50, note: 'Реабилитация: ориентировочно 1,2–1,5 г/кг при достаточной энергии и отсутствии противопоказаний.' },
        preop: { sedentary: 1.00, low: 1.10, moderate: 1.20, high: 1.30, veryhigh: 1.40, floor: 1.00, cap: 1.50, note: 'Предоперационный профиль: 1,0–1,5 г/кг в зависимости от нутритивного риска и состояния.' },
        postop: { sedentary: 1.20, low: 1.20, moderate: 1.30, high: 1.40, veryhigh: 1.50, floor: 1.20, cap: 1.50, note: 'Послеоперационный профиль: 1,2–1,5 г/кг как ориентировочный коридор.' },
        icu: { sedentary: 1.30, low: 1.30, moderate: 1.30, high: 1.30, veryhigh: 1.30, floor: 1.20, cap: 1.30, note: 'ОРИТ: около 1,3 г/кг белковых эквивалентов вводится постепенно и только в клиническом контексте.' },
        elderly: { sedentary: 1.00, low: 1.00, moderate: 1.10, high: 1.20, veryhigh: 1.20, floor: 1.00, cap: 1.50, note: 'Пожилой возраст: не менее 1,0 г/кг; 1,2–1,5 г/кг возможно при болезни, восстановлении или риске недостаточности.' },
        ckd: { sedentary: 0.80, low: 0.80, moderate: 0.80, high: 0.80, veryhigh: 0.80, floor: 0.80, cap: 0.80, note: 'ХБП G3–G5 без диализа: 0,8 г/кг по KDIGO 2024; более глубокое ограничение допускается только под наблюдением.' },
        dialysis: { sedentary: 1.00, low: 1.00, moderate: 1.10, high: 1.20, veryhigh: 1.20, floor: 1.00, cap: 1.20, note: 'Диализ: отдельный клинический расчёт; калькулятор показывает консервативный коридор 1,0–1,2 г/кг.' },
        oncology: { sedentary: 1.00, low: 1.10, moderate: 1.20, high: 1.30, veryhigh: 1.50, floor: 1.00, cap: 1.50, note: 'Онкология: ESPEN рекомендует более 1,0 и, если возможно, до 1,5 г/кг.' }
    };
    // Russian pediatric physiological norms (МР 2.3.1.0253-21, table 21).
    // Used for children and adolescents as a national-reference layer instead of adult g/kg extrapolation.
    const RUS_CHILD_NORMS_0253_21 = [
        { key: 'child_1_2', ageMin: 1, ageMax: 2, sex: 'any', label: '1–2 года', kcal: 1300, protein_g: 39, fat_g: 44, carbs_g: 188, fiber_g: 10, calcium_mg: 800, phosphorus_mg: 600, magnesium_mg: 80, potassium_mg: 1000, sodium_mg: 500, iron_mg: 10, zinc_mg: 8, vitamin_c_mg: 45, vitamin_d_mcg: 15, vitamin_b12_mcg: 0.7, vitamin_b9_mcg: 200, animalProteinPct: 70 },
        { key: 'child_3_6', ageMin: 3, ageMax: 6, sex: 'any', label: '3–6 лет', kcal: 1800, protein_g: 54, fat_g: 60, carbs_g: 261, fiber_g: 12, calcium_mg: 900, phosphorus_mg: 700, magnesium_mg: 200, potassium_mg: 1500, sodium_mg: 700, iron_mg: 12, zinc_mg: 10, vitamin_c_mg: 50, vitamin_d_mcg: 15, vitamin_b12_mcg: 1.5, vitamin_b9_mcg: 300, animalProteinPct: 65 },
        { key: 'child_7_10', ageMin: 7, ageMax: 10, sex: 'any', label: '7–10 лет', kcal: 2100, protein_g: 63, fat_g: 70, carbs_g: 305, fiber_g: 16, calcium_mg: 1100, phosphorus_mg: 800, magnesium_mg: 250, potassium_mg: 2000, sodium_mg: 1000, iron_mg: 15, zinc_mg: 12, vitamin_c_mg: 60, vitamin_d_mcg: 15, vitamin_b12_mcg: 2.0, vitamin_b9_mcg: 350, animalProteinPct: 60 },
        { key: 'child_11_14_male', ageMin: 11, ageMax: 14, sex: 'male', label: '11–14 лет, мальчики', kcal: 2500, protein_g: 75, fat_g: 83, carbs_g: 363, fiber_g: 20, calcium_mg: 1200, phosphorus_mg: 900, magnesium_mg: 300, potassium_mg: 2500, sodium_mg: 1100, iron_mg: 18, zinc_mg: 12, vitamin_c_mg: 70, vitamin_d_mcg: 15, vitamin_b12_mcg: 3.0, vitamin_b9_mcg: 400, animalProteinPct: 60 },
        { key: 'child_11_14_female', ageMin: 11, ageMax: 14, sex: 'female', label: '11–14 лет, девочки', kcal: 2300, protein_g: 69, fat_g: 77, carbs_g: 334, fiber_g: 20, calcium_mg: 1200, phosphorus_mg: 900, magnesium_mg: 300, potassium_mg: 2500, sodium_mg: 1100, iron_mg: 18, zinc_mg: 12, vitamin_c_mg: 60, vitamin_d_mcg: 15, vitamin_b12_mcg: 3.0, vitamin_b9_mcg: 400, animalProteinPct: 60 },
        { key: 'child_15_17_male', ageMin: 15, ageMax: 17, sex: 'male', label: '15–17 лет, юноши', kcal: 2900, protein_g: 87, fat_g: 97, carbs_g: 421, fiber_g: 22, calcium_mg: 1200, phosphorus_mg: 900, magnesium_mg: 400, potassium_mg: 3200, sodium_mg: 1300, iron_mg: 18, zinc_mg: 12, vitamin_c_mg: 90, vitamin_d_mcg: 15, vitamin_b12_mcg: 3.0, vitamin_b9_mcg: 400, animalProteinPct: 60 },
        { key: 'child_15_17_female', ageMin: 15, ageMax: 17, sex: 'female', label: '15–17 лет, девушки', kcal: 2500, protein_g: 75, fat_g: 83, carbs_g: 363, fiber_g: 22, calcium_mg: 1200, phosphorus_mg: 900, magnesium_mg: 400, potassium_mg: 3200, sodium_mg: 1300, iron_mg: 18, zinc_mg: 12, vitamin_c_mg: 70, vitamin_d_mcg: 15, vitamin_b12_mcg: 3.0, vitamin_b9_mcg: 400, animalProteinPct: 60 }
    ];
    function normalizedSexForNeeds(sex) {
        sex = String(sex || '').toLowerCase();
        if (sex.indexOf('female') >= 0 || sex.indexOf('жен') >= 0 || sex === 'ж')
            return 'female';
        if (sex.indexOf('male') >= 0 || sex.indexOf('муж') >= 0 || sex === 'м')
            return 'male';
        return 'any';
    }
    function russianChildNormFor(age, sex) {
        age = Number(age);
        if (!Number.isFinite(age) || age < 1 || age >= 18)
            return null;
        var ageWhole = Math.floor(age);
        var sx = normalizedSexForNeeds(sex);
        return RUS_CHILD_NORMS_0253_21.find(function (r) { return ageWhole >= r.ageMin && ageWhole <= r.ageMax && r.sex === sx; }) ||
            RUS_CHILD_NORMS_0253_21.find(function (r) { return ageWhole >= r.ageMin && ageWhole <= r.ageMax && r.sex === 'any'; }) || null;
    }
    function russianChildNormBasis() { return 'МР 2.3.1.0253-21, табл. 21'; }
    function parseSplit(value) {
        // format: "n|p1,p2,..."
        const [n, plist] = value.split('|');
        const parts = plist.split(',').map(x => Number(x.trim()));
        const sum = parts.reduce((a, b) => a + b, 0);
        return { n: Number(n), parts, sum };
    }
    // auto params
    function computeAutoParams({ sex, h, w, age, state, activity, edema }) {
        const reason = [];
        const bmi = computeBMI(h, w);
        const pediatricAge = pediatricAgeForNeeds(age);
        const childNorm = russianChildNormFor(age, sex);
        // v5.3.67: for children/adolescents the adult BMI/IBW/AdjBW branch is blocked before it can choose calculation weight.
        if (pediatricAge) {
            let method = (childNorm && automaticChildNormAllowedForState(state)) ? 'rus_child_norm' : 'weight';
            reason.push('Детский профиль: взрослая BMI/IBW/AdjBW-логика выбора массы отключена');
            reason.push('Используется фактическая масса; значения в г/кг и расчёт жидкости приводятся как справочные ориентиры');
            if (childNorm && automaticChildNormAllowedForState(state))
                reason.push('КБЖУ берутся из российской возрастно-половой нормы');
            else
                reason.push('Клинически чувствительный детский профиль: нужен очный расчёт, автоматическая взрослая логика не применяется');
            return { weightChoice: 'actual', f: 0.25, method, reason: reason.join('; '), lowBMIOverride: false, pediatricWeightLogic: true };
        }
        // --- выбор массы (взрослая логика) ---
        let weightChoice = 'actual';
        if (edema === 'yes') {
            if (bmi != null && bmi >= 30) {
                weightChoice = 'adjusted';
                reason.push('Отёки → скорректированная масса (ИМТ≥30)');
            }
            else {
                weightChoice = 'ibw';
                reason.push('Отёки → идеальная масса (IBW)');
            }
        }
        else if (state === 'ckd') {
            if (bmi != null && bmi >= 30) {
                weightChoice = 'adjusted';
                reason.push('ХБП: используем скорректированную массу при ИМТ≥30');
            }
            else {
                weightChoice = 'ibw';
                reason.push('ХБП: используем идеальную массу (IBW)');
            }
        }
        else if (bmi != null && bmi >= 30) {
            weightChoice = 'adjusted';
            reason.push('Ожирение (ИМТ≥30) → скорректированная масса');
        }
        else {
            weightChoice = 'actual';
            reason.push('Масса надёжна → фактическая');
        }
        // --- коэффициент f (как было) ---
        let f = 0.25;
        if (bmi != null && bmi >= 40) {
            f = 0.40;
            reason.push('Морбидное ожирение → f=0.40');
        }
        else if (bmi != null && bmi >= 30) {
            f = 0.25;
            reason.push('Ожирение → f=0.25');
        }
        // --- МЕТОД ЭНЕРГИИ: по умолчанию Mifflin ---
        let method = 'mifflin';
        reason.push('По умолчанию Mifflin–St Jeor');
        // Fallback: нет входных для Mifflin → по массе
        if (!(h && w && age != null)) {
            method = 'weight';
            reason.push('Недостаточно данных для Mifflin → расчёт по массе (ккал/кг)');
        }
        // Правило безопасности: низкий ИМТ → по массе
        if (bmi != null && bmi < 18) {
            if (method !== 'weight')
                reason.push('ИМТ<18 → переходим на расчёт по массе (ккал/кг)');
            method = 'weight';
        }
        return { weightChoice, f, method, reason: reason.join('; '), lowBMIOverride: (bmi != null && bmi < 18) };
    }
    function renderReport(meta) {
        var _a, _b, _c;
        const out = $('needs_out');
        if (!out) {
            return;
        }
        const mealNames = ['Завтрак', 'Обед', 'Ужин', 'Перекус 1', 'Перекус 2'];
        const fmt = (v, n = 1) => (v == null || isNaN(v)) ? '—' : (n === 0 ? round0(v) : round1(v));
        const yesno = (v) => v === 'yes' ? 'Да' : 'Нет';
        // Headers KPI
        const kpi = `
    <div class="kpi">
      <div class="tile"><div class="title">Энергия (ккал/сут)</div><div class="value"><span id=\"needs_kcal_range\"><span id=\"needs_kcal_low\">${meta.energyLow}</span>–<span id=\"needs_kcal_high\">${meta.energyHigh}</span></span></div><div class="small">Рабочая цель: <span id=\"needs_kcal_target\">${meta.energyTarget}</span> ккал</div></div>
      <div class="tile"><div class="title">Белок (г/сут)</div><div class="value"><span id=\"needs_protein_total\">${fmt(meta.totalProtein)}</span></div></div>
      <div class="tile"><div class="title">Жиры (г/сут)</div><div class="value"><span id="needs_fat_g">${fmt(meta.fatGrams, 0)}</span></div></div>
      <div class="tile"><div class="title">Углеводы (г/сут)</div><div class="value"><span id="needs_carb_g">${fmt(meta.carbGrams, 0)}</span></div></div>

      <div class="tile"><div class="title">Жидкость (мл/сут)</div><div class="value">${fmt(meta.fluidMl, 0)}</div></div>
    </div>`;
        // 1. Inputs & params
        let alertBox = '';
        if (meta.lowBMIOverride && meta.method === 'weight') {
            const bmiTxt = isNaN(meta.bmi) ? '—' : meta.bmi;
            alertBox = `<div class="alert alert-danger">
        <div><strong>Почему выбран расчёт по массе (ккал/кг)</strong></div>
        <div style="margin-top:6px;">
          Уравнения наподобие Mifflin–St Jeor валидировались преимущественно на людях с нормальным ИМТ. 
          При выраженном дефиците массы они могут давать нестабильные или систематически смещённые оценки энергозатрат.
        </div>
        <div style="margin-top:6px;">
          В группах с недостаточной массой тела клинически безопаснее и удобнее опираться на пошаговую энергетическую цель в ккал/кг, 
          которую можно гибко наращивать (учёт риска рефидинга, переносимости, сопутствующих состояний). Такой подход предсказуемо управляет планом питания.
        </div>
        <div style="margin-top:6px;">
          Поэтому некоторые протоколы задают «триггер» выбора метода при ИМТ ниже 20 как более консервативный порог. 
          В данной версии калькулятора мы ужесточили правило до <strong>ИМТ &lt; 18</strong>, чтобы реже игнорировать преимущества Mifflin в зоне пограничной недостаточности 
          и при этом всегда переходить на расчёт в ккал/кг при выраженной худобе.
        </div>
        <div class="note" style="margin-top:6px;">Это окно показано, потому что рассчитанный ИМТ = <strong>${bmiTxt}</strong>, а метод — «ккал/кг».</div>
      </div>`;
        }
        if (meta.goalGuardrailOverride) {
            alertBox += `<div class="alert">
        <div><strong>Защитный сценарий изменил расчёт цели</strong></div>
        <div style="margin-top:6px;">${meta.goalGuardrailOverride}</div>
      </div>`;
        }
        const sec1 = `
    <div class="section">
      <h2>1) Входные данные и использованные параметры</h2>
      <table class="tbl">
        <tr><th style="width:40%">Параметр</th><th>Значение</th></tr>
        <tr><td>Пол</td><td>${meta.sex === 'male' ? 'Мужской' : 'Женский'}</td></tr>
        <tr><td>Рост, см</td><td>${fmt(meta.h, 1)}</td></tr>
        <tr><td>Масса, кг</td><td>${fmt(meta.w, 1)}</td></tr>
        <tr><td>Возраст, лет</td><td>${fmt(meta.age, 0)}</td></tr>
        <tr><td>ИМТ</td><td>${isNaN(meta.bmi) ? '—' : meta.bmi}</td></tr>
        <tr><td>Профиль</td><td>${meta.stateLabel}</td></tr>
        <tr><td>Активность</td><td>${meta.activityLabel}</td></tr>
        <tr><td>Отёки/асцит</td><td>${yesno(meta.edema)}</td></tr>
        <tr><td>Цель</td><td>${meta.goalLabel}</td></tr>
        <tr><td>Пищевой стиль</td><td>${meta.dietStyleLabel || 'Смешанный рацион'}</td></tr>
        <tr><td>Защитный сценарий</td><td>${meta.guardrailLabel || 'Нет'}${meta.goalGuardrailOverride ? ' <span class="badge green">дефицит отключён</span>' : ''}</td></tr>
      </table>

      <table class="tbl">
        <tr><th style="width:40%">Расчётные параметры</th><th>Значение</th></tr>
        <tr><td>Масса для расчёта</td><td><b>${fmt(meta.usedWeight, 1)} кг</b> <span class="badge green">${meta.pediatricWeightLogic ? 'детская: фактическая' : (meta.weightChoice === 'actual' ? 'фактическая' : 'скорректированная/идеальная')}</span></td></tr>
        <tr><td>IBW (идеальная), кг</td><td>${meta.ibw != null ? fmt(meta.ibw, 1) : '—'}</td></tr>
        <tr><td>AdjBW (скоррект.), кг</td><td>${meta.adjusted != null ? fmt(meta.adjusted, 1) : '—'} ${meta.adjusted != null ? `<span class="small">(f=${meta.f})</span>` : ''}</td></tr>
        <tr><td>Метод энергии</td><td>${meta.method === 'mifflin' ? 'Mifflin–St Jeor' : (meta.method === 'rus_child_norm' ? 'детская норма РФ' : 'ккал/кг')}; PAL = ${meta.actEnergy}, SF (профиль состояния) = ${(_a = meta.stateEnergyAdj) !== null && _a !== void 0 ? _a : 1}</td></tr>
        <tr><td>Энергия, ккал/кг</td><td>~${fmt(meta.energyPerKg, 0)}</td></tr>
        <tr><td>Белок, г/кг</td><td>${fmt(meta.proteinPerKg, 2)}</td></tr>
        <tr><td>Жиры, % ккал</td><td>${fmt(meta.fatPct * 100, 0)}%</td></tr>
        <tr><td>Жидкость, мл/кг</td><td>${fmt(meta.fluidPerKg, 0)}</td></tr>
      </table>
      <div class="note">${meta.autoReason}</div>
    </div>`;
        // 2. Step-by-step energy
        let sec2Inner = '';
        if (meta.method === 'rus_child_norm' && meta.childNorm) {
            sec2Inner = `
    <h3>Детская норма РФ (МР 2.3.1.0253-21)</h3>
    <ol>
      <li>Возрастно-половая группа: <b>${meta.childNorm.label}</b>.</li>
      <li>Энергия: <b>${meta.childNorm.kcal}</b> ккал/сут.</li>
      <li>Белок: <b>${meta.childNorm.protein_g}</b> г/сут, при текущей массе около <b>${fmt(meta.proteinPerKg, 2)}</b> г/кг.</li>
      <li>Жиры: <b>${meta.childNorm.fat_g}</b> г/сут; углеводы: <b>${meta.childNorm.carbs_g}</b> г/сут; пищевые волокна: <b>${meta.childNorm.fiber_g}</b> г/сут.</li>
      <li>Молочно-кальциевая и минеральная часть рациона: кальций <b>${meta.childNorm.calcium_mg}</b> мг, витамин D <b>${meta.childNorm.vitamin_d_mcg}</b> мкг, железо <b>${meta.childNorm.iron_mg}</b> мг.</li>
    </ol>
    <div class="note">Для детского профиля цель снижения массы не создаёт автоматический взрослый дефицит калорий, а взрослая BMI/IBW/AdjBW-логика выбора массы отключена. При вопросах по массе, росту, аппетиту или заболеванию нужна очная оценка педиатра или детского диетолога.</div>`;
        }
        else if (meta.method === 'mifflin') {
            sec2Inner = `
    <h3>Метод Mifflin–St Jeor (подробно)</h3>
    <ol class="explain">
      <li><b>Исходные данные:</b> пол = <b>${meta.sex === 'male' ? 'мужской' : 'женский'}</b>, возраст = <b>${fmt(meta.age, 0)}</b> лет; рост = <b>${fmt(meta.h, 0)} см</b>; используемая масса = <b>${fmt(meta.usedWeight, 1)} кг</b>${meta.usedWeight !== meta.w ? ` (вместо фактической ${fmt(meta.w, 1)} кг)` : ''}.</li>
      <li><b>Базальный обмен (BMR):</b> <code class="inline">BMR = 10×W + 6.25×H − 5×Age + S</code>, где <code>S</code> = ${meta.sex === 'male' ? '+5' : '−161'}.
        Подстановка: <code>10×${fmt(meta.w, 1)} + 6.25×${fmt(meta.h, 0)} − 5×${fmt(meta.age, 0)} ${meta.sSign.replace('−', '-').startsWith('+') ? '+' : '−'} ${meta.sSign.replace('−', '-').replace('+', '')}</code> = <b>${fmt(meta.bmr, 0)}</b> ккал/сут.</li>
      <li><b>PAL — коэффициент общей физической активности:</b> выбран профиль активности <b>${(ACT[meta.activity] || {}).label || meta.activity}</b>, AF = <b>${meta.actEnergy}</b>.</li>
      <li><b>Фактор клинического профиля (SF):</b> <b>${(STATE[meta.state] || {}).label || meta.state}</b>; SF = <b>${(_b = meta.stateEnergyAdj) !== null && _b !== void 0 ? _b : 1}</b> — отражает потребности при данном состоянии (например, ОРИТ → целевой гипокалораж ≈70–100% REE; реабилитация/набор → умеренное повышение энергии).</li>
      <li><b>Итого энергия:</b> <code class="inline">TEE (Total Energy Expenditure — суммарные суточные энергозатраты) = BMR × PAL × SF</code> →
        <code>${fmt(meta.bmr, 0)} × ${meta.actEnergy} × ${meta.stateEnergyAdj}</code> = <b>${fmt(meta.energyLow, 0)}</b> ккал/сут.</li>
      <li class="callout-corridor"><b>Плановый коридор:</b> ${fmt(meta.energyLow, 0)}–${fmt(meta.energyHigh, 0)} ккал/сут (±10%) — нормальные суточные колебания и безопасность титрации.</li>
    </ol>
  `;
        }
        else {
            sec2Inner = `
    <h3>Метод «ккал/кг» (подробно)</h3>
    <ol class="explain">
      <li><b>Базовое значение по профилю:</b> <b>${meta.kcalPerKg}</b> ккал/кг (профиль: <b>${(STATE[meta.state] || {}).label || meta.state}</b>).</li>
      <li><b>Используемая масса:</b> <b>${fmt(meta.usedWeight, 1)} кг</b>${meta.usedWeight !== meta.w ? ` (вместо фактической ${fmt(meta.w, 1)} кг)` : ''}.</li>
      <li><b>Фактор активности (AF):</b> <b>${(ACT[meta.activity] || {}).label || meta.activity}</b>, AF = <b>${meta.actEnergy}</b>.</li>
      <li><b>Фактор клинического профиля (SF):</b> SF = <b>${(_c = meta.stateEnergyAdj) !== null && _c !== void 0 ? _c : 1}</b>.</li>
      <li><b>Итого энергия:</b> <code class="inline">TEE (Total Energy Expenditure — суммарные суточные энергозатраты) = ккал/кг × W × AF × SF</code> →
        <code>${meta.kcalPerKg} × ${fmt(meta.usedWeight, 1)} × ${meta.actEnergy} × ${meta.stateEnergyAdj}</code> = <b>${fmt(meta.energyLow, 0)}</b> ккал/сут.</li>
      <li class="callout-corridor"><b>Плановый коридор:</b> ${fmt(meta.energyLow, 0)}–${fmt(meta.energyHigh, 0)} ккал/сут (±15%) — учитывает вариабельность и клиническую осторожность.</li>
    </ol>
  `;
        }
        let protNote = meta.proteinNote || '';
        const sec2 = `
      <div class="section">
        <h2>2) Пошаговый расчёт энергии</h2>
        ${sec2Inner}
      </div>
    `;
        const sec3 = meta.method === 'rus_child_norm' && meta.childNorm ? `
      <div class="section">
        <h2>3) Потребности в белке — расчёт и интерпретация</h2>
        <div><b>Белок по детской норме РФ:</b> ${fmt(meta.childNorm.protein_g, 0)} г/сут для группы «${meta.childNorm.label}».</div>
        <div class="note">${protNote}</div>
        <table class="tbl" style="margin-top:10px;">
          <tr><th style="width:40%">Методический параметр</th><th>Значение</th></tr>
          <tr><td>Основа сравнения</td><td>МР 2.3.1.0253-21, табл. 21</td></tr>
          <tr><td>Эквивалент на текущую массу</td><td>${fmt(meta.proteinPerKg, 2)} г/кг/сут при массе ${fmt(meta.usedWeight, 1)} кг</td></tr>
          <tr><td>Доля животного белка в норме</td><td>${meta.childNorm.animalProteinPct || '—'}%</td></tr>
          <tr><td>Калорийность белка</td><td>${fmt(meta.protKcal, 0)} ккал/сут</td></tr>
        </table>
        <div class="small">В детском профиле белок не повышается автоматически из-за цели снижения массы или активности. При заболеваниях, выраженном дефиците или избытке массы и нарушениях роста нужен очный расчёт специалиста.</div>
      </div>
    ` : `
      <div class="section">
        <h2>3) Потребности в белке — расчёт и интерпретация</h2>
        <div>Выбрано: <b>${fmt(meta.proteinPerKg, 2)} г/кг</b> × ${fmt(meta.usedWeight, 1)} кг = <b>${fmt(meta.totalProtein, 1)} г/сут</b></div>
        <div class="note">${protNote}</div>
        <table class="tbl" style="margin-top:10px;">
          <tr><th style="width:40%">Методический параметр</th><th>Значение</th></tr>
          <tr><td>Коридор профиля</td><td>${(meta.pRange || [])[0]}–${(meta.pRange || [])[1]} г/кг/сут</td></tr>
          <tr><td>Масса для расчёта</td><td>${fmt(meta.usedWeight, 1)} кг</td></tr>
          <tr><td>Калорийность белка</td><td>${fmt(meta.protKcal, 0)} ккал/сут</td></tr>
        </table>
        <div class="small">Это расчётный ориентир для планирования питания. При ХБП, диализе, онкологии, ОРИТ, выраженной саркопении, кахексии, тяжёлой печёночной недостаточности и других состояниях белок задаётся индивидуально под врачебным контролем.</div>
      </div>
    `;
        // 4. Fats & Carbs
        const sec4 = `
      <div class="section">
        <h2>4) Жиры и углеводы — расчёт</h2>
        <table class="tbl">
          <tr><th>Компонент</th><th>Ккал</th><th>Граммы</th><th>Комментарий</th></tr>
          <tr><td>Белок</td><td><span id=\"needs_protein_kcal\">${fmt(meta.protKcal, 0)}</span></td><td><span id=\"needs_protein_g\">${fmt(meta.totalProtein, 1)}</span></td><td>4 ккал/г</td></tr>
          <tr><td>Жир</td><td><span id=\"needs_fat_kcal\">${fmt(meta.fatKcal, 0)}</span></td><td><span id=\"needs_fat_g\">${fmt(meta.fatGrams, 1)}</span></td><td><span id=\"needs_fat_pct\">${fmt(meta.fatPct * 100, 0)}</span>% от ${fmt(meta.energyTarget, 0)} ккал</td></tr>
          <tr><td>Углеводы</td><td><span id=\"needs_carb_kcal\">${fmt(meta.carbKcal, 0)}</span></td><td><span id=\"needs_carb_g\">${fmt(meta.carbGrams, 1)}</span></td><td>остаток ккал → 4 ккал/г</td></tr>
        </table>
        <div class="small">Сумма ккал: ${fmt(meta.protKcal + meta.fatKcal + meta.carbKcal, 0)} (рабочая цель ${fmt(meta.energyTarget, 0)} ккал)</div>
      </div>
    `;
        // 5. Distribution by meals
        let rows = '';
        meta.meals.forEach((m, i) => {
            rows += `<tr>
        <td>${mealNames[i] || ('Приём ' + (i + 1))}</td>
        <td>${fmt(m.pct * 100, 0)}%</td>
        <td>${fmt(m.kcal, 0)}</td>
        <td>${fmt(m.protein, 1)}</td>
        <td>${fmt(m.fat, 1)}</td>
        <td>${fmt(m.carbs, 1)}</td>
      </tr>`;
        });
        const sec5 = `
      <div class="section">
        <h2>5) Детальное распределение по приёмам</h2>
        <div class="small">Шаблон: ${meta.splitLabel} (по ккал; макрораспределение пропорционально)</div>
        <table class="tbl">
          <tr><th>Приём</th><th>%</th><th>Ккал</th><th>Белок, г</th><th>Жиры, г</th><th>Углеводы, г</th></tr>
          ${rows}
        </table>
      </div>
    `;
        const d1 = `<details class="fold"><summary>1) Входные данные и использованные параметры</summary><div>${sec1}</div></details>`;
        const d2 = `<details class="fold"><summary>2) Пошаговый расчёт энергии</summary><div>${sec2}</div></details>`;
        const d3 = `<details class="fold"><summary>3) Потребности в белке — расчёт и интерпретация</summary><div>${sec3}</div></details>`;
        const d4 = `<details class="fold"><summary>4) Жиры и углеводы — расчёт</summary><div>${sec4}</div></details>`;
        const d5 = `<details class="fold"><summary>5) Детальное распределение по приёмам</summary><div>${sec5}</div></details>`;
        const personalNeeds = renderPersonalNeedsHtml(meta.personalProfile || buildPersonalNeedsProfile(meta));
        out.innerHTML = `${kpi}<div class="hr"></div>${personalNeeds}${alertBox}${d1}${d2}${d3}${d4}${d5}`;
        try {
            var needsDetail = Object.assign({}, meta, { personalProfile: meta.personalProfile, energyLow: meta.energyLow, energyHigh: meta.energyHigh, totalProtein: meta.totalProtein, fatGrams: meta.fatGrams, carbGrams: meta.carbGrams });
            document.dispatchEvent(new CustomEvent('needs:computed', { detail: needsDetail }));
            window.dispatchEvent(new CustomEvent('needs:computed', { detail: needsDetail }));
        }
        catch (_) { }
        try {
            $('dbg_json').textContent = JSON.stringify(meta, null, 2);
        }
        catch (_d) { }
    }
    // Injected missing energy helpers from backup
    function energyByWeightMethod(state, activity, usedWeight) {
        const s = STATE[state] || STATE.normal;
        const act = ACT[activity] || ACT.low;
        const sf = (typeof s.teeAdj === 'number') ? s.teeAdj : 1.0;
        const activityScale = s.ignoreActivity ? 1 : Math.max(0.9, act.energy / 1.35);
        const base = s.kcalPerKg * usedWeight * activityScale * sf;
        return { low: Math.round(base), high: Math.round(base * 1.15), kcalPerKg: s.kcalPerKg, act: act.energy, sf };
    }
    function energyByMifflin(sex, h, w, age, activity) {
        const r = mifflinBMR(sex, w, h, age);
        if (!r)
            return null;
        const act = ACT[activity] || ACT.low;
        const tee = Math.round(r.bmr * act.energy);
        return { low: tee, high: Math.round(tee * 1.10), bmr: r.bmr, s: r.s, act: act.energy };
    }
    // Protein helper v4.4: modernized target selection with renal exceptions and clinical caps.
    function childProteinRangeFor(age, activity, state, goal, weight, sex) {
        age = Number(age);
        if (!Number.isFinite(age) || age >= 18 || age < 1)
            return null;
        if (state === 'ckd' || state === 'dialysis' || state === 'icu')
            return null;
        var norm = russianChildNormFor(age, sex);
        if (norm) {
            var w = Number(weight);
            var target = (Number.isFinite(w) && w > 0) ? +(norm.protein_g / w).toFixed(2) : null;
            return { target: target, proteinG: norm.protein_g, floor: target || 0, cap: target || 0, norm: norm, fixed: true, basis: russianChildNormBasis(), note: 'Детский профиль: белок берётся из российских возрастно-половых норм, без взрослой автоматической прибавки при снижении массы.' };
        }
        var base = age <= 3 ? 1.05 : (age <= 13 ? 0.95 : 0.85);
        var activityBump = (activity === 'high' || activity === 'veryhigh') ? 0.15 : (activity === 'moderate' ? 0.05 : 0);
        var recoveryBump = (state === 'rehab' || state === 'postop' || goal === 'rehab_gain') ? 0.20 : 0;
        var target = +(base + activityBump + recoveryBump).toFixed(2);
        var cap = age <= 13 ? 1.35 : 1.50;
        if (state === 'oncology')
            cap = Math.min(cap, 1.45);
        target = Math.max(base, Math.min(cap, target));
        return { target: +target.toFixed(2), floor: base, cap: cap, note: 'Детский профиль: белок рассчитывается по возрастной логике г/кг, без взрослой автоматической прибавки для снижения массы.' };
    }
    function proteinPerKgFor(state, activity, age, goal, weight, sex) {
        const childRange = childProteinRangeFor(age, activity, state, goal, weight, sex);
        if (childRange && childRange.target)
            return childRange.target;
        const cfg = PROTEIN_TARGETS_V44[state] || PROTEIN_TARGETS_V44.normal;
        activity = activity || 'low';
        goal = goal || 'maintain';
        let gkg = Number(cfg[activity]);
        if (!Number.isFinite(gkg))
            gkg = Number(cfg.low || cfg.sedentary || cfg.floor || 1.2);
        // Goal-specific adjustment. CKD non-dialysis is deliberately excluded from automatic upward bumps.
        let goalBump = 0;
        if (state !== 'ckd') {
            if (['normal', 'elderly'].includes(state)) {
                if (goal === 'lose')
                    goalBump = 0.10;
                else if (goal === 'gain')
                    goalBump = 0.10;
                else if (goal === 'rehab_gain')
                    goalBump = 0.15;
            }
        }
        gkg = +(gkg + goalBump).toFixed(2);
        // Older adults: keep a minimum target unless renal restriction is selected.
        if (age != null && age >= 65 && state !== 'ckd' && state !== 'dialysis') {
            if (state === 'normal' && goal === 'maintain')
                gkg = Math.max(gkg, 1.00);
            else
                gkg = Math.max(gkg, 1.20);
        }
        // State-specific clinical floors and caps.
        let floor = Number(cfg.floor);
        let cap = Number(cfg.cap);
        if (!Number.isFinite(floor))
            floor = 0.8;
        if (!Number.isFinite(cap))
            cap = 2.0;
        // Oncology without explicit cachexia status remains conservative; rehab_gain may reach 2.0.
        if (state === 'oncology')
            cap = Math.min(cap, 1.50);
        // Elderly profile has room for higher target with rehab_gain, but avoids automatic 2.0 without a severe-illness flag.
        if (state === 'elderly')
            cap = Math.min(cap, 1.50);
        // Dialysis and CKD use renal-specific caps.
        if (state === 'dialysis')
            cap = Math.min(cap, 1.20);
        if (state === 'ckd') {
            floor = 0.80;
            cap = 0.80;
        }
        gkg = Math.max(floor, Math.min(cap, gkg));
        return +gkg.toFixed(2);
    }
    function proteinNoteFor(meta) {
        var _a;
        const childRange = childProteinRangeFor(meta.age, meta.activity, meta.state, meta.goal, meta.usedWeight || meta.w, meta.sex);
        if (childRange) {
            if (childRange.fixed && childRange.norm) {
                return childRange.note + ' Ориентир: ' + childRange.norm.protein_g + ' г/сут для группы «' + childRange.norm.label + '»; при текущей массе это около ' + (childRange.target || 0) + ' г/кг. Доля животного белка в российских нормах для этой группы: ' + childRange.norm.animalProteinPct + '%. При нарушениях роста, массы, аппетита или хронических заболеваниях расчёт требует очной проверки.';
            }
            return childRange.note + ' Текущий ориентир: ' + childRange.floor + '–' + childRange.cap + ' г/кг/сут с учётом возраста, активности и восстановительного профиля. При нарушениях роста, массы, аппетита или хронических заболеваниях расчёт требует очной проверки.';
        }
        const cfg = PROTEIN_TARGETS_V44[meta.state] || PROTEIN_TARGETS_V44.normal;
        const pRange = ((_a = STATE[meta.state]) === null || _a === void 0 ? void 0 : _a.pRange) || [cfg.floor, cfg.cap];
        let pieces = [];
        pieces.push('Методика v5.3.127: выбран профиль «' + (meta.stateLabel || meta.state) + '», активность «' + (meta.activityLabel || meta.activity) + '», цель «' + (meta.goalLabel || meta.goal) + '».');
        pieces.push('Ориентировочный коридор для профиля: ' + pRange[0] + '–' + pRange[1] + ' г/кг/сут. ' + (cfg.note || ''));
        if (meta.state === 'ckd')
            pieces.push('Важно: при ХБП без диализа калькулятор не повышает белок автоматически; требуется врачебный контроль функции почек, стадии ХБП и нутритивного статуса.');
        else if (meta.state === 'dialysis')
            pieces.push('Для диализа используется отдельный коридор, потому что потери белка и катаболизм выше, чем при ХБП без диализа.');
        else
            pieces.push('При хронической болезни почек, декомпенсированных печёночных состояниях и тяжёлой острой патологии белок нельзя повышать без клинического контроля.');
        return pieces.join(' ');
    }
    // Personal needs profile v5.3.67: a cross-sectional layer that turns age, sex,
    // activity, goal and clinical profile into practical nutrient priorities.
    function htmlEscape(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }
    function ageGroupForPersonalProfile(age, sex) {
        age = Number(age);
        if (!Number.isFinite(age))
            return { key: 'unknown', label: 'возраст не указан', stage: 'unknown', child: false, adolescent: false, older: false, norm: null };
        if (age < 1)
            return { key: 'infant', label: 'до 1 года', stage: 'infant', child: true, adolescent: false, older: false, norm: null, needsSpecialist: true };
        var childNorm = russianChildNormFor(age, sex);
        if (childNorm)
            return { key: childNorm.key, label: childNorm.label, stage: (age >= 11 ? 'adolescent' : 'child'), child: true, adolescent: age >= 11, older: false, norm: childNorm, basis: russianChildNormBasis() };
        if (age < 18)
            return { key: 'child_undefined', label: 'до 18 лет', stage: 'child', child: true, adolescent: age >= 11, older: false, norm: null, needsSpecialist: true };
        if (age <= 29)
            return { key: 'adult_18_29', label: '18–29 лет', stage: 'adult_young', child: false, adolescent: false, older: false };
        if (age <= 44)
            return { key: 'adult_30_44', label: '30–44 года', stage: 'adult_middle', child: false, adolescent: false, older: false };
        if (age <= 64)
            return { key: 'adult_45_64', label: '45–64 года', stage: 'adult_later', child: false, adolescent: false, older: false };
        if (age <= 74)
            return { key: 'older_65_74', label: '65–74 года', stage: 'older_early', child: false, adolescent: false, older: true };
        return { key: 'older_75_plus', label: '75+ лет', stage: 'older_late', child: false, adolescent: false, older: true };
    }
    function getNormTargetForPersonal(key, fallback) {
        try {
            var v = window.norms && window.norms.values && window.norms.values[key] && Number(window.norms.values[key].value);
            if (Number.isFinite(v) && v > 0)
                return v;
        }
        catch (_) { }
        return fallback;
    }
    function personalRegionalTarget(key, group, age, sex, fallback) {
        if (group && group.norm && group.norm[key])
            return group.norm[key];
        try {
            var region = (window.State && State.getRegion) ? State.getRegion() : 'us';
            var r = window.__resolveMicroLimitsForQA && window.__resolveMicroLimitsForQA(key, region, Number(age), sex);
            if (r && r.min && Number.isFinite(Number(r.min.value)))
                return Number(r.min.value);
        }
        catch (_) { }
        return fallback;
    }
    function personalCalciumTarget(group, isFemale, age) { return personalRegionalTarget('calcium_mg', group, age, isFemale ? 'female' : 'male', 1000); }
    function personalVitaminDTarget(group, age, isFemale) { return personalRegionalTarget('vitamin_d_mcg', group, age, isFemale ? 'female' : 'male', 15); }
    function personalIronTarget(group, isFemale, age) { return personalRegionalTarget('iron_mg', group, age, isFemale ? 'female' : 'male', isFemale && Number(age) <= 50 ? 18 : 8); }
    function personalFiberTarget(group, isFemale, isMale, age) {
        if (group && group.norm && group.norm.fiber_g)
            return group.norm.fiber_g;
        if (Number.isFinite(Number(age)) && Number(age) >= 51)
            return isFemale ? 21 : 30;
        return isFemale ? 25 : (isMale ? 38 : 30);
    }
    function personalB12Target(group, age, isFemale) { return personalRegionalTarget('vitamin_b12_mcg', group, age, isFemale ? 'female' : 'male', 2.4); }
    function personalFolateTarget(group, age, isFemale) { return personalRegionalTarget('vitamin_b9_mcg', group, age, isFemale ? 'female' : 'male', 400); }
    function profileAgeMeaning(group, state) {
        group = group || {};
        if (group.needsSpecialist)
            return 'Для этого возраста требуется индивидуальный расчёт с учётом месяцев жизни, характера питания и динамики роста.';
        if (group.child)
            return 'Возрастная группа определяет нормы энергии, белков, жиров, углеводов и ключевых микронутриентов. Для детей и подростков используются российские возрастно-половые нормативы.';
        if (group.stage === 'adult_young')
            return 'Возраст 18–29 лет задаёт базовые взрослые ориентиры. Итоговые значения уточняются по массе тела, активности, цели и полу.';
        if (group.stage === 'adult_middle')
            return 'Возраст 30–44 года задаёт базовые взрослые ориентиры. В рекомендациях особое внимание получают структура рациона, клетчатка и качество источников энергии.';
        if (group.stage === 'adult_later')
            return 'Возраст 45–64 года повышает приоритет белка, клетчатки, кальция, контроля натрия и насыщенных жиров.';
        if (group.stage === 'older_early')
            return 'В возрасте 65–74 лет особенно важны достаточность белка и энергии, кальций, витамин D, B12 и распределение белковых продуктов в течение дня.';
        if (group.stage === 'older_late')
            return 'В возрасте 75 лет и старше особенно важны достаточность энергии и белка, кальций, витамин D, B12, переносимость пищи и удобный режим питания.';
        if (state === 'elderly')
            return 'Выбран профиль пожилого пациента. В оценке рациона повышается приоритет белка, кальция, витамина D, B12 и общей питательной ценности.';
        return 'Возраст задаёт исходную группу потребностей. Остальные параметры уточняют расчёт и порядок рекомендаций.';
    }
    function profileSexMeaning(isFemale, isMale, age, group) {
        age = Number(age);
        if (isFemale && group && group.child && group.adolescent)
            return 'Для девушек подросткового возраста особенно внимательно оцениваются железо, фолат, кальций, витамин D и достаточность энергии.';
        if (isMale && group && group.child && group.adolescent)
            return 'Для юношей подросткового возраста выше ориентиры энергии и белка; дополнительно оцениваются кальций, витамин D и регулярность белковых продуктов.';
        if (isFemale && Number.isFinite(age) && age >= 14 && age <= 50)
            return 'Для женщин репродуктивного возраста отдельное внимание получают железо и фолат; кальций и витамин D также остаются в числе приоритетных показателей.';
        if (isFemale && Number.isFinite(age) && age >= 51)
            return 'Для женщин старше 50 лет особенно внимательно оцениваются кальций, витамин D, белок и витамин B12.';
        if (isMale && Number.isFinite(age) && age >= 45)
            return 'Для мужчин старше 45 лет особенно внимательно оцениваются клетчатка, натрий, насыщенные жиры, достаточность белка и качество источников энергии.';
        if (isMale)
            return 'Пол участвует в расчёте энергии и части нормативов. Остальные приоритеты уточняются по активности, цели, массе тела и состоянию.';
        if (isFemale)
            return 'Пол участвует в расчёте энергии и нормативов железа, фолата и кальция в соответствующих возрастных группах.';
        return 'Пол не указан, поэтому используются общие ориентиры без половых уточнений.';
    }
    function profileStateMeaning(state) {
        var map = {
            normal: 'При обычном состоянии специальные клинические поправки не добавляются. Ориентиры уточняются по возрасту, полу, активности и цели.',
            rehab: 'В период реабилитации повышается приоритет белка, энергии, кальция, цинка и регулярного питания.',
            preop: 'Перед операцией особенно важны достаточность белка и энергии, общая питательная ценность рациона и осторожность при ограничениях.',
            postop: 'После операции особенно внимательно оцениваются белок, энергия и микронутриенты, необходимые для восстановления.',
            icu: 'Для пациентов ОРИТ расчёт носит справочный характер и требует клинического контроля.',
            elderly: 'Профиль пожилого пациента повышает приоритет белка, кальция, витамина D, B12 и общей питательной ценности.',
            ckd: 'При хронической болезни почек белок, натрий, фосфор и калий оцениваются с учётом стадии заболевания и назначений.',
            dialysis: 'При диализе повышается потребность в белке; фосфор, калий, натрий и жидкость требуют клинического контроля.',
            oncology: 'При онкологическом заболевании особенно важны белок, энергия и общая питательная ценность; рекомендации требуют клинической осторожности.'
        };
        return map[state] || 'Выбранное состояние уточняет приоритеты белка, энергии, микронутриентов и безопасность рекомендаций.';
    }
    function profileGoalMeaning(goal, group) {
        if (group && group.child && goal === 'lose')
            return 'Для ребёнка цель снижения массы не создаёт автоматического дефицита энергии. Основное внимание уделяется росту, развитию, регулярности питания и качеству продуктов.';
        var map = {
            maintain: 'При поддержании массы рекомендации направлены на сохранение полноценной структуры рациона и достаточности ключевых нутриентов.',
            lose: 'При снижении массы калькулятор защищает белок, клетчатку и кальций; источники избыточной энергии рассматриваются в первую очередь.',
            gain: 'При наборе массы энергия увеличивается за счёт полноценных продуктов, достаточного белка и углеводной основы.',
            rehab_gain: 'При восстановлении и наборе массы повышается приоритет энергии, белка и нутриентов, участвующих в восстановлении тканей.'
        };
        return map[goal] || 'Цель уточняет энергетический ориентир и порядок рекомендаций.';
    }
    function profileActivityMeaning(activity) {
        var map = {
            sedentary: 'При малоподвижном образе жизни расчётная потребность в энергии ниже, поэтому особенно важна питательная ценность каждого приёма пищи.',
            low: 'При низкой активности основное внимание получают качество источников энергии, белок, клетчатка и структура рациона.',
            moderate: 'При умеренной активности дополнительно оцениваются энергия, белок, углеводная основа и восстановление после нагрузки.',
            high: 'При высокой активности особенно важны достаточность энергии, белка и углеводов, а также жидкость и восстановление.',
            veryhigh: 'При очень высокой активности особенно важны энергия, углеводы, белок, жидкость и электролиты.'
        };
        return map[activity] || 'Активность уточняет потребность в энергии, белке, углеводах и восстановлении.';
    }
    function profileDietStyleMeaning(dietStyle) {
        var item = DIET_STYLE_V5367[String(dietStyle || 'mixed')] || DIET_STYLE_V5367.mixed;
        return item.meaning || 'Пищевой стиль уточняет, какие нутриенты и варианты продуктовых замен требуют дополнительной проверки.';
    }
    function profileGuardrailMeaning(guardrail) {
        var item = GUARDRAIL_PROFILE_V5367[String(guardrail || 'none')] || GUARDRAIL_PROFILE_V5367.none;
        return item.meaning || 'Защитный сценарий ограничивает автоматические выводы и напоминает о необходимости очной индивидуализации.';
    }
    function buildScenarioFactors(ctx) {
        ctx = ctx || {};
        return [
            { key: 'age', label: 'Возраст', value: (ctx.group && ctx.group.label) || 'не указан', effect: profileAgeMeaning(ctx.group, ctx.state) },
            { key: 'sex', label: 'Пол', value: ctx.sexLabel || 'не указан', effect: profileSexMeaning(ctx.isFemale, ctx.isMale, ctx.age, ctx.group) },
            { key: 'state', label: 'Состояние', value: ctx.stateLabel || 'обычное', effect: profileStateMeaning(ctx.state) },
            { key: 'activity', label: 'Активность', value: ctx.actLabel || 'не указана', effect: profileActivityMeaning(ctx.activity) },
            { key: 'goal', label: 'Цель', value: ctx.goalLabel || 'поддержание', effect: profileGoalMeaning(ctx.goal, ctx.group) },
            { key: 'dietStyle', label: 'Пищевой стиль', value: ctx.dietStyleLabel || 'Смешанный рацион', effect: profileDietStyleMeaning(ctx.dietStyle) },
            { key: 'guardrail', label: 'Защитный сценарий', value: ctx.guardrailLabel || 'Нет', effect: profileGuardrailMeaning(ctx.guardrail) }
        ];
    }
    function scenarioSignatureForProfile(group, isFemale, isMale, state, activity, goal, dietStyle, guardrail) {
        var ageKey = group && group.key ? group.key : 'unknown';
        var sexKey = isFemale ? 'female' : (isMale ? 'male' : 'any');
        return [ageKey, sexKey, state || 'normal', activity || 'low', goal || 'maintain', dietStyle || 'mixed', guardrail || 'none'].join(' · ');
    }
    function personalTargetMeta(meta, group, isFemale, isMale, age) {
        if (group && group.needsSpecialist)
            return {};
        function item(value, unit, label, basis) { return { value: value, unit: unit, label: label, basis: basis || 'персональный ориентир' }; }
        var childNorm = group && group.norm ? group.norm : null;
        var basis = childNorm ? russianChildNormBasis() : 'персональный ориентир';
        var selectedEnergy = Number(childNorm ? childNorm.kcal : (meta.energyTarget || (window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.chooseEnergy(meta) : Math.round((Number(meta.energyLow || 0) + Number(meta.energyHigh || meta.energyLow || 0)) / 2))));
        var energyLimits = window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.upperLimitsForEnergy(selectedEnergy) : {sfa_g:0,added_sugars_g:0,provenance:{registryMissing:true}};
        var out = {
            kcal: item(selectedEnergy, 'ккал', 'энергия', childNorm ? basis : 'расчёт потребностей'),
            protein_g: item(Number(childNorm ? childNorm.protein_g : (meta.totalProtein || 0)), 'г', 'белок', childNorm ? basis : 'г/кг с учётом профиля'),
            fat_g: item(Number(childNorm ? childNorm.fat_g : (meta.fatGrams || 0)), 'г', 'жиры', childNorm ? basis : 'расчёт потребностей'),
            carbs_g: item(Number(childNorm ? childNorm.carbs_g : (meta.carbGrams || 0)), 'г', 'углеводы', childNorm ? basis : 'расчёт потребностей'),
            fiber_g: item(personalFiberTarget(group, isFemale, isMale, age), 'г', 'клетчатка', childNorm ? basis : 'возраст и пол'),
            calcium_mg: item(personalCalciumTarget(group, isFemale, age), 'мг', 'кальций', childNorm ? basis : 'возрастной профиль'),
            vitamin_d_mcg: item(personalVitaminDTarget(group, age, isFemale), 'мкг', 'витамин D', childNorm ? basis : 'возрастной профиль'),
            iron_mg: item(personalIronTarget(group, isFemale, age), 'мг', 'железо', childNorm ? basis : 'возраст и пол'),
            vitamin_b12_mcg: item(personalB12Target(group, age, isFemale), 'мкг', 'B12', childNorm ? basis : 'возрастной профиль'),
            vitamin_b9_mcg: item(personalFolateTarget(group, age, isFemale), 'мкг', 'фолат', childNorm ? basis : 'возрастной профиль'),
            sfa_g: item(energyLimits.sfa_g, 'г', 'насыщенные жиры', 'расчётный верхний предел: не более 10% выбранной энергии'),
            added_sugars_g: item(energyLimits.added_sugars_g, 'г', 'добавленные сахара', 'расчётный верхний предел: не более 10% энергии; добавленные сахара используются как отслеживаемая часть свободных сахаров')
        };
        out.sfa_g.mode = 'upper_limit';
        out.added_sugars_g.mode = 'upper_limit';
        if (childNorm) {
            out.phosphorus_mg = item(childNorm.phosphorus_mg, 'мг', 'фосфор', basis);
            out.magnesium_mg = item(childNorm.magnesium_mg, 'мг', 'магний', basis);
            out.potassium_mg = item(childNorm.potassium_mg, 'мг', 'калий', basis);
            out.sodium_mg = item(childNorm.sodium_mg, 'мг', 'натрий', basis);
            out.zinc_mg = item(childNorm.zinc_mg, 'мг', 'цинк', basis);
            out.vitamin_c_mg = item(childNorm.vitamin_c_mg, 'мг', 'витамин C', basis);
            out._childRussianNorm = { group: childNorm.label, basis: basis, animalProteinPct: childNorm.animalProteinPct };
        }
        return out;
    }
    function numericTargetMap(targetMeta) {
        var out = {};
        Object.keys(targetMeta || {}).forEach(function (k) { var v = Number(targetMeta[k] && targetMeta[k].value); if (Number.isFinite(v) && v > 0)
            out[k] = v; });
        return out;
    }
    function buildPersonalNeedsProfile(meta) {
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
        function add(key, level, title, why, action, nutrients) {
            if (map[key])
                return;
            var item = { key: key, level: level, title: title, why: why, action: action, nutrients: nutrients || [] };
            priorities.push(item);
            map[key] = item;
        }
        var stateLabel = meta.stateLabel || ((STATE[state] && STATE[state].label) || state);
        var actLabel = meta.activityLabel || ((ACT[activity] && ACT[activity].label) || activity);
        var goalLabel = meta.goalLabel || ({ maintain: 'Поддержание', lose: 'Снижение', gain: 'Набор', rehab_gain: 'Реабилитация/набор' }[goal] || goal);
        var dietStyleLabel = meta.dietStyleLabel || labelFromRegistry(DIET_STYLE_V5367, dietStyle, 'Смешанный рацион');
        var guardrailLabel = meta.guardrailLabel || labelFromRegistry(GUARDRAIL_PROFILE_V5367, guardrail, 'Нет');
        if (group.needsSpecialist) {
            add('specialist_age_profile', 'осторожно', 'Возраст требует отдельного расчёта', 'В возрасте до одного года потребности меняются по месяцам жизни и зависят от вида вскармливания, роста и состояния здоровья. Требуется отдельный педиатрический расчёт.', 'Использовать этот раздел как предупреждение и провести индивидуальную педиатрическую оценку.', []);
        }
        else if (group.child) {
            add('child_growth', 'главный', 'Рост и развитие', 'Для детского рациона используются российские возрастно-половые нормы. Энергия, белок, кальций, железо, витамин D и регулярность питания оцениваются с учётом роста и развития.', 'Проверить регулярность питания, достаточность белковых продуктов, овощей, фруктов и источников кальция. Сладкие напитки и частые сладкие перекусы оценить отдельно.', ['protein_g', 'calcium_mg', 'iron_mg', 'vitamin_d_mcg']);
            if (group.adolescent) {
                add('adolescent_growth_spurt', 'главный', 'Подростковый скачок роста', 'В подростковом возрасте повышается значение энергии, белка, кальция, железа, витамина D и регулярного питания; для 11–17 лет пол уже влияет на норму.', 'Сопоставить рацион с возрастными нормами энергии, белка, кальция, железа и витамина D; проверить регулярность основных приёмов пищи.', ['kcal', 'protein_g', 'calcium_mg', 'iron_mg', 'vitamin_d_mcg']);
            }
        }
        if (!group.child && group.stage === 'adult_middle') {
            add('adult_stability', 'поддерживать', 'Устойчивый взрослый рацион', 'В 30–44 года возрастная группа задаёт базовые ориентиры, а активность, цель, масса тела и качество источников энергии уточняют рекомендации.', 'Проверить структуру рациона, клетчатку, натрий, насыщенные жиры, сладкие напитки, десерты и соусы.', ['fiber_g', 'sodium_mg', 'sfa_g', 'added_sugars_g']);
        }
        if (!group.child && group.stage === 'adult_later') {
            add('midlife_nutrient_density', 'важный', 'Возрастной профиль 45–64', 'В 45–64 года повышается приоритет белка, клетчатки, кальция, контроля натрия, насыщенных жиров и качества углеводной основы.', 'Проверить достаточность белка, овощную основу, цельнозерновые продукты, источники кальция, натрий и насыщенные жиры.', ['protein_g', 'fiber_g', 'calcium_mg', 'sodium_mg', 'sfa_g']);
        }
        if (isFemale && !group.child && Number.isFinite(age) && age >= 51) {
            add('female_51_bone_priority', 'главный', 'Кальций и витамин D после 51 года', 'После 50 лет повышается значение кальция, витамина D, белка и витамина B12.', 'Проверить поступление кальция с пищей, витамин D, белок и витамин B12.', ['calcium_mg', 'vitamin_d_mcg', 'protein_g', 'vitamin_b12_mcg']);
        }
        if (isMale && !group.child && Number.isFinite(age) && age >= 45) {
            add('male_45_cardiometabolic_quality', 'важный', 'Клетчатка, натрий и жиры после 45 лет', 'Для мужчин старше 45 лет повышается значение клетчатки, контроля натрия и насыщенных жиров, достаточности белка и качества источников энергии.', 'Проверить количество овощей и цельнозерновых продуктов, натрий, насыщенные жиры, сладкие напитки, десерты и соусы.', ['fiber_g', 'sodium_mg', 'sfa_g', 'protein_g']);
        }
        if (group.older || state === 'elderly') {
            add('older_muscle_bone', 'главный', 'Белок, кости и мышечная ткань', 'В пожилом возрасте особенно важны достаточность белка и энергии, кальций, витамин D и витамин B12.', 'Проверить суточное количество белка, источники кальция и распределение белковых продуктов между основными приёмами пищи.', ['protein_g', 'calcium_mg', 'vitamin_d_mcg', 'vitamin_b12_mcg']);
            if (group.stage === 'older_late') {
                add('older_75_energy_safety', 'главный', 'Достаточность питания 75+', 'После 75 лет особенно важны достаточность энергии и белка, кальций, витамин B12 и переносимость объёма пищи.', 'Сначала проверить достаточность питания, переносимость порций и регулярность белковых продуктов и источников кальция. Ограничения требуют особой осторожности.', ['kcal', 'protein_g', 'calcium_mg', 'vitamin_b12_mcg']);
            }
        }
        if (state === 'ckd') {
            add('renal_caution', 'осторожно', 'Белок только с клиническим контролем', 'При ХБП без диализа автоматическое повышение белка не используется.', 'Оценивать белок вместе со стадией ХБП, функцией почек и назначениями врача.', ['protein_g', 'phosphorus_mg', 'sodium_mg']);
        }
        else if (state === 'dialysis') {
            add('dialysis_protein', 'главный', 'Белок и потери на диализе', 'Диализ требует отдельной белковой логики и контроля электролитов.', 'Проверить белок, фосфор, натрий и калий с учётом клинических назначений.', ['protein_g', 'phosphorus_mg', 'sodium_mg', 'potassium_mg']);
        }
        else if (['rehab', 'postop', 'oncology'].indexOf(state) >= 0) {
            add('recovery_protein', 'главный', 'Восстановление тканей', 'В период восстановления повышается значение белка, энергии, кальция и общей питательной ценности рациона.', 'Проверить, закрывает ли рацион белок и есть ли белковый продукт в каждом основном приёме пищи.', ['protein_g', 'kcal', 'calcium_mg', 'zinc_mg']);
        }
        if (activity === 'high' || activity === 'veryhigh') {
            add('activity_recovery', 'главный', 'Нагрузка и восстановление', 'При высокой активности необходимо оценить достаточность энергии, белка и углеводов, а также жидкость и восстановление после нагрузки.', 'Проверить суточное количество белка, углеводы до и после нагрузки и общую достаточность энергии. Сладкие и жирные продукты оценить отдельно.', ['protein_g', 'carbs_g', 'kcal', 'potassium_mg', 'magnesium_mg']);
        }
        else if (activity === 'sedentary') {
            add('nutrient_density', 'важный', 'Нутриентная плотность', 'При малоподвижном образе жизни потребность в энергии ниже, поэтому особенно важна питательная ценность каждого приёма пищи.', 'Увеличить долю овощей, белковых продуктов и источников клетчатки и кальция; отдельно оценить сладкие напитки, десерты, соусы и жирные добавки.', ['fiber_g', 'protein_g', 'calcium_mg', 'sodium_mg', 'added_sugars_g']);
        }
        if (goal === 'lose') {
            if (group.child) {
                add('child_weight_caution', 'осторожно', 'Детская масса: без взрослого дефицита', 'При вопросах о массе ребёнка основными ориентирами остаются рост, развитие, регулярность питания, белок, кальций, овощи и фрукты. Сладкие напитки оцениваются отдельно.', 'Использовать отчёт для мягкой коррекции качества рациона. Вопросы по массе, росту или аппетиту требуют оценки специалиста.', ['kcal', 'protein_g', 'calcium_mg', 'iron_mg', 'vitamin_d_mcg', 'fiber_g']);
            }
            else if (guardrailBlocksAutoDeficit(guardrail)) {
                add('guarded_weight_goal', 'осторожно', 'Снижение массы: защитный режим', 'Выбран чувствительный сценарий. Расчёт сосредоточен на регулярности питания, достаточности нутриентов и безопасности рекомендаций.', 'Проверить регулярность питания, достаточность белка, кальция, железа и клетчатки, а также качество продуктовых источников. Изменение массы требует очной тактики.', ['kcal', 'protein_g', 'fiber_g', 'calcium_mg', 'iron_mg']);
            }
            else {
                add('weight_loss_quality', 'главный', 'Снижение массы без потери качества', 'При снижении массы особенно важно сохранять достаточность белка, клетчатки и кальция и полноценную структуру рациона.', 'В первую очередь оценить сладкие напитки, десерты, соусы и жирные добавки. Белковые продукты и овощная основа должны сохраняться.', ['protein_g', 'fiber_g', 'calcium_mg', 'added_sugars_g', 'sfa_g']);
            }
        }
        else if (goal === 'gain' || goal === 'rehab_gain') {
            add('gain_quality', 'главный', 'Качественный набор массы', 'Для набора массы важны достаточность энергии, белка и углеводов, а также полноценный микронутриентный состав рациона.', 'Добавлять калорийность через полноценные продукты: крупы, белковые продукты, молочные или обогащённые альтернативы, орехи и масла в разумной порции.', ['kcal', 'protein_g', 'carbs_g', 'calcium_mg']);
        }
        if (isFemale && Number.isFinite(age) && age >= 14 && age <= 50) {
            add('female_iron_folate', 'важный', 'Железо и фолат', 'Для женского профиля репродуктивного возраста железо и фолат требуют отдельного внимания.', 'Сопоставить фактическое поступление железа и фолата с ориентирами. Растительные источники железа сочетать с продуктами, богатыми витамином C.', ['iron_mg', 'vitamin_b9_mcg', 'vitamin_c_mg']);
        }
        if (!group.child && !group.needsSpecialist && ((Number.isFinite(bmi) && bmi < 18.5) || meta.lowBMIOverride)) {
            add('low_bmi_safety', 'осторожно', 'Недостаточная масса', 'При низком ИМТ приоритетом становится постепенное повышение достаточности питания и переносимости увеличенного рациона.', 'Проверить энергию, белок и переносимость увеличения рациона; выраженный дефицит массы требует очной оценки.', ['kcal', 'protein_g', 'phosphorus_mg', 'magnesium_mg']);
        }
        if (dietStyle === 'no_dairy') {
            add('no_dairy_calcium_layer', 'главный', 'Кальций без молочных продуктов', 'При рационе без молочных продуктов кальций, витамин D, витамин B12 и белок необходимо обеспечивать другими пищевыми источниками или обогащёнными альтернативами.', 'Проверить кальций, витамин D, витамин B12 и белок. В качестве источников кальция рассмотреть обогащённые напитки и йогурты, тофу с кальцием, рыбу с костями и другие подходящие продукты.', ['calcium_mg', 'vitamin_d_mcg', 'vitamin_b12_mcg', 'protein_g']);
        }
        if (dietStyle === 'plant_forward' || dietStyle === 'vegetarian') {
            add('plant_forward_micronutrients', 'важный', dietStyle === 'vegetarian' ? 'Вегетарианский профиль' : 'Растительный акцент', 'Чем выше доля растительных продуктов, тем внимательнее следует оценивать белок, железо, цинк, кальций, B12 и витамин D.', 'Проверить сочетание бобовых, соевых продуктов, круп, орехов и семян. Источники растительного железа сочетать с продуктами, богатыми витамином C.', ['protein_g', 'iron_mg', 'zinc_mg', 'calcium_mg', 'vitamin_b12_mcg', 'vitamin_d_mcg', 'vitamin_c_mg']);
        }
        if (dietStyle === 'low_appetite') {
            add('low_appetite_density', 'главный', 'Малый объём еды', 'При сниженном аппетите особенно важна питательная ценность небольших порций: белок, энергия, кальций и ключевые микронутриенты.', 'Добавить в небольшие порции белковый продукт, кисломолочный или обогащённый кальцием вариант и подходящий источник жиров; проверить удобство режима и переносимость.', ['kcal', 'protein_g', 'calcium_mg', 'vitamin_d_mcg', 'vitamin_b12_mcg', 'zinc_mg']);
        }
        if (guardrail === 'pregnancy') {
            add('pregnancy_guardrail', 'осторожно', 'Беременность: без автоматического дефицита', 'Беременность требует очной индивидуализации; калькулятор не рассчитывает акушерские прибавки и не должен подталкивать к снижению калорийности.', 'Использовать расчёт как обзор рациона: проверить регулярность, белок, железо, фолат, кальций и витамин D, а добавки и лечебные ограничения согласовывать со специалистом.', ['kcal', 'protein_g', 'iron_mg', 'vitamin_b9_mcg', 'calcium_mg', 'vitamin_d_mcg']);
        }
        else if (guardrail === 'lactation') {
            add('lactation_guardrail', 'осторожно', 'Лактация: без автоматического дефицита', 'При лактации важны достаточность энергии, жидкости, белка, кальция и микронутриентов; калькулятор не заменяет индивидуальный расчёт.', 'Не начинать с дефицита; использовать отчёт для поиска слабых мест рациона и обсуждать выраженные ограничения со специалистом.', ['kcal', 'protein_g', 'calcium_mg', 'vitamin_d_mcg', 'iron_mg']);
        }
        else if (guardrail === 'ed_risk') {
            add('ed_guardrail', 'осторожно', 'Риск РПП или выраженных ограничений', 'При риске нарушений пищевого поведения опасна автоматическая ограничительная логика: подсказки должны поддерживать регулярность и достаточность, а не усиливать контроль.', 'Не использовать снижение калорийности как автоматическую цель; оценивать регулярность, белок, энергию и безопасность рекомендаций вместе со специалистом.', ['kcal', 'protein_g', 'calcium_mg', 'iron_mg', 'vitamin_b12_mcg']);
        }
        else if (guardrail === 'medical_restriction') {
            add('medical_restriction_guardrail', 'осторожно', 'Медицинские ограничения', 'При медицинских ограничениях рацион нельзя исправлять только общими правилами качества: часть продуктовых замен может быть противопоказана.', 'Использовать калькулятор как карту фактического рациона и сверять изменения с диагнозом, анализами и назначениями специалиста.', ['protein_g', 'sodium_mg', 'potassium_mg', 'phosphorus_mg', 'calcium_mg']);
        }
        if (!map.plant_fiber && !group.child) {
            add('plant_fiber', 'поддерживать', 'Овощи, фрукты и клетчатка', 'Клетчатка, овощи, фрукты и цельнозерновые продукты поддерживают структуру рациона и его общую питательную ценность.', 'Проверить овощную основу, количество фруктов и долю цельнозерновых продуктов. Овощи и фрукты оцениваются раздельно.', ['fiber_g', 'potassium_mg', 'vitamin_c_mg']);
        }
        var nutrientFocusKeys = [];
        var priorityWeights = {};
        var priorityReasons = {};
        function levelWeight(level) {
            level = String(level || '').toLowerCase();
            if (level.indexOf('глав') >= 0)
                return 4;
            if (level.indexOf('осторож') >= 0)
                return 3;
            if (level.indexOf('важ') >= 0)
                return 3;
            if (level.indexOf('поддерж') >= 0)
                return 1;
            return 2;
        }
        priorities.forEach(function (p) {
            (p.nutrients || []).forEach(function (k) {
                if (nutrientFocusKeys.indexOf(k) < 0)
                    nutrientFocusKeys.push(k);
                priorityWeights[k] = Math.max(Number(priorityWeights[k] || 0), levelWeight(p.level));
                if (!priorityReasons[k])
                    priorityReasons[k] = [];
                if (priorityReasons[k].length < 3)
                    priorityReasons[k].push({ title: p.title, level: p.level, why: p.why, action: p.action });
            });
        });
        if (!(group && group.needsSpecialist)) {
            ['protein_g', 'fiber_g', 'calcium_mg', 'vitamin_d_mcg', 'iron_mg', 'vitamin_b12_mcg', 'sodium_mg', 'added_sugars_g', 'sfa_g'].forEach(function (k) { if (nutrientFocusKeys.indexOf(k) < 0)
                nutrientFocusKeys.push(k); });
        }
        var targetMeta = personalTargetMeta(meta, group, isFemale, isMale, age);
        var childNorm = group && group.norm ? group.norm : null;
        var scenarioFactors = buildScenarioFactors({ group: group, isFemale: isFemale, isMale: isMale, age: age, sexLabel: sexLabel, state: state, stateLabel: stateLabel, activity: activity, actLabel: actLabel, goal: goal, goalLabel: goalLabel, dietStyle: dietStyle, dietStyleLabel: dietStyleLabel, guardrail: guardrail, guardrailLabel: guardrailLabel });
        return {
            version: 'v5.3.155_calculation_core_ssot_pass1',
            age: Number.isFinite(age) ? age : null,
            ageGroup: group,
            sex: sex,
            sexLabel: sexLabel,
            state: state,
            stateLabel: stateLabel,
            activity: activity,
            activityLabel: actLabel,
            goal: goal,
            goalLabel: goalLabel,
            dietStyle: dietStyle,
            dietStyleLabel: dietStyleLabel,
            guardrail: guardrail,
            guardrailLabel: guardrailLabel,
            goalGuardrailOverride: meta.goalGuardrailOverride || '',
            proteinTargetG: Number(meta.totalProtein || 0),
            proteinPerKg: Number(meta.proteinPerKg || 0),
            targets: numericTargetMap(targetMeta),
            targetMeta: targetMeta,
            priorities: priorities,
            nutrientFocusKeys: nutrientFocusKeys,
            priorityWeights: priorityWeights,
            priorityReasons: priorityReasons,
            scenarioFactors: scenarioFactors,
            scenarioSignature: scenarioFactors.map(function (f) { return f.value; }).filter(Boolean).join(' · '),
            childRussianNorm: childNorm,
            normBasis: childNorm ? russianChildNormBasis() : '',
            caution: buildPersonalProfileCautionV5367(group, state, guardrail, meta.goalGuardrailOverride)
        };
    }
    function buildPersonalProfileCautionV5367(group, state, guardrail, goalGuardrailOverride) {
        var parts = [];
        group = group || {};
        if (group.needsSpecialist)
            parts.push('Для возраста до 1 года автоматический расчёт потребностей в этой версии не применяется: нужны месяцы жизни, тип вскармливания, динамика роста и очная педиатрическая оценка.');
        else if (group.child)
            parts.push('Детский рацион рассчитан по возрастно-половым российским нормам МР 2.3.1.0253-21. Его нельзя оценивать как уменьшенную взрослую модель: взрослая BMI/IBW/AdjBW-логика выбора массы отключена; при сомнениях по росту, массе, аппетиту или заболеванию нужна очная оценка специалиста.');
        if (state === 'ckd' || state === 'dialysis')
            parts.push('Почечный профиль требует клинического контроля. Расчёт помогает увидеть рацион, но не заменяет назначения.');
        if (guardrail === 'pregnancy')
            parts.push('Беременность: калькулятор не выполняет акушерский расчёт и не должен использоваться для самостоятельного снижения массы.');
        if (guardrail === 'lactation')
            parts.push('Лактация: калькулятор не заменяет индивидуальный расчёт энергии, жидкости и микронутриентов.');
        if (guardrail === 'ed_risk')
            parts.push('Риск РПП/выраженных ограничений: не использовать отчёт для усиления ограничительного поведения; нужна поддерживающая, очная тактика.');
        if (guardrail === 'medical_restriction')
            parts.push('Медицинские ограничения: продуктовые замены нужно сверять с диагнозом, анализами и назначениями.');
        if (goalGuardrailOverride)
            parts.push(goalGuardrailOverride);
        return parts.join(' ');
    }
    function needsProfileDisplayTitle(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        var stage = needsProfileStageLabel(profile);
        var label = profile.ageGroup && profile.ageGroup.label ? profile.ageGroup.label : '';
        return stage + (label ? ' — ' + label : '');
    }
    function needsProfileContextChips(profile) {
        if (!profile)
            return [];
        var out = [];
        if (profile.sexLabel)
            out.push(profile.sexLabel === 'мужской' ? 'Мужской пол' : (profile.sexLabel === 'женский' ? 'Женский пол' : profile.sexLabel));
        if (profile.state && profile.state !== 'normal' && profile.stateLabel)
            out.push('Состояние: ' + profile.stateLabel);
        if (profile.activityLabel)
            out.push('Активность: ' + profile.activityLabel);
        if (profile.goalLabel)
            out.push('Цель: ' + profile.goalLabel);
        if (profile.dietStyleLabel)
            out.push(profile.dietStyleLabel);
        if (profile.guardrail && profile.guardrail !== 'none' && profile.guardrailLabel)
            out.push('Защитный сценарий: ' + profile.guardrailLabel);
        return out;
    }
    function needsProfileLevelLabel(level) {
        var map = { 'главный': 'В первую очередь', 'важный': 'Проверить', 'осторожно': 'Требует осторожности', 'поддерживать': 'Поддерживать' };
        return map[String(level || '').toLowerCase()] || 'Обратить внимание';
    }
    function needsProfileMethodHtml(profile) {
        var childText = profile && profile.ageGroup && profile.ageGroup.child
            ? 'Для детей и подростков исходные нормы берутся из российских возрастно-половых нормативов.'
            : 'Для взрослых исходные ориентиры рассчитываются по возрасту, полу, росту, массе тела и активности.';
        return '<details class="needs-profile-method"><summary><span>Как формируется профиль</span><small>Показать логику расчёта</small></summary><div class="needs-profile-method-body"><ol><li><strong>Возраст задаёт основу.</strong><p>' + htmlEscape(childText) + '</p></li><li><strong>Параметры уточняют расчёт.</strong><p>Пол, масса тела, активность, цель и выбранное состояние изменяют итоговые ориентиры и порядок рекомендаций.</p></li><li><strong>Отчёт расставляет приоритеты.</strong><p>В начале показаны показатели, которые стоит проверить в текущем рационе. Подробные нормы и расчёты остаются в соответствующих разделах.</p></li></ol><p class="needs-profile-method-note">Профиль объясняет ход расчёта и помогает понимать результаты. Клинические решения принимаются с учётом диагноза, анализов и назначений.</p></div></details>';
    }
    function renderPersonalNeedsHtml(profile) {
        if (!profile || !profile.priorities || !profile.priorities.length)
            return '';
        var main = profile.priorities.slice(0, 6).map(function (p, index) {
            return '<article class="needs-personal-card" data-level="' + htmlEscape(p.level) + '"><div class="needs-personal-card-head"><span class="needs-personal-order" aria-hidden="true">' + (index + 1) + '</span><div><span class="needs-personal-level">' + htmlEscape(needsProfileLevelLabel(p.level)) + '</span><strong>' + htmlEscape(p.title) + '</strong></div></div><p class="needs-personal-reason">' + htmlEscape(p.why) + '</p><div class="needs-personal-action"><span>Практический шаг</span><p>' + htmlEscape(p.action) + '</p></div></article>';
        }).join('');
        var contextChips = needsProfileContextChips(profile).map(function (x) { return '<span>' + htmlEscape(x) + '</span>'; }).join('');
        var nutrientChips = (profile.nutrientFocusKeys || []).slice(0, 9).map(function (k) {
            var ru = { kcal: 'энергия', protein_g: 'белок', fiber_g: 'клетчатка', calcium_mg: 'кальций', vitamin_d_mcg: 'витамин D', iron_mg: 'железо', vitamin_b12_mcg: 'витамин B12', sodium_mg: 'натрий', added_sugars_g: 'добавленные сахара', sfa_g: 'насыщенные жиры', potassium_mg: 'калий', magnesium_mg: 'магний', carbs_g: 'углеводы', vitamin_b9_mcg: 'фолат', vitamin_c_mg: 'витамин C', zinc_mg: 'цинк', phosphorus_mg: 'фосфор' }[k] || ((window.NutritionCalculationCoreV53155 && window.NutritionCalculationCoreV53155.label) ? window.NutritionCalculationCoreV53155.label(k) : 'показатель');
            return '<span>' + htmlEscape(ru) + '</span>';
        }).join('');
        var primaryTitle = needsProfileDisplayTitle(profile);
        var primaryBasis = needsProfileBasisText(profile);
        var primary = '<div class="needs-profile-primary"><div class="needs-profile-primary-heading"><span class="needs-profile-primary-icon" aria-hidden="true"></span><div><span class="needs-profile-primary-kicker">Возрастная основа расчёта</span><strong>' + htmlEscape(primaryTitle) + '</strong></div></div><p>' + htmlEscape(primaryBasis) + '</p>' + (contextChips ? '<div class="needs-profile-context-wrap"><span class="needs-profile-context-label">Также учтены</span><div class="needs-profile-context" aria-label="Параметры, уточняющие расчёт">' + contextChips + '</div></div>' : '') + '</div>';
        var childNormBox = profile.childRussianNorm ? '<div class="needs-personal-child-norm"><strong>Нормы для этой возрастно-половой группы</strong><span>' + htmlEscape(profile.childRussianNorm.label) + ' · ' + htmlEscape(profile.normBasis || '') + '</span><span>Энергия: ' + htmlEscape(profile.childRussianNorm.kcal) + ' ккал · белок: ' + htmlEscape(profile.childRussianNorm.protein_g) + ' г/сут · доля животного белка: ' + htmlEscape(profile.childRussianNorm.animalProteinPct) + '%</span></div>' : '';
        var visibleFactors = (profile.scenarioFactors || []).filter(function (f) {
            if (!f || f.key === 'age')
                return false;
            if (f.key === 'state' && profile.state === 'normal')
                return false;
            if (f.key === 'guardrail' && (!profile.guardrail || profile.guardrail === 'none'))
                return false;
            return true;
        });
        var factors = visibleFactors.map(function (f) {
            return '<article class="needs-scenario-factor" data-factor="' + htmlEscape(f.key) + '"><span>' + htmlEscape(f.label) + '</span><strong>' + htmlEscape(f.value) + '</strong><p>' + htmlEscape(f.effect) + '</p></article>';
        }).join('');
        var scenario = factors ? '<details class="needs-scenario-router"><summary><span><b>Какие параметры уточнили расчёт</b><small>Пол, активность, цель, пищевой стиль и состояние</small></span><em>' + visibleFactors.length + '</em></summary><div class="needs-scenario-grid">' + factors + '</div></details>' : '';
        var priorities = '<section class="needs-priority-section"><div class="needs-priority-heading"><div><span>Практическая интерпретация</span><h3>На что обратить внимание в текущем рационе</h3></div><p>Пункты расположены по степени значимости для выбранных параметров. Они помогают выбрать порядок проверки и не являются диагнозом.</p></div><div class="needs-personal-grid">' + main + '</div></section>';
        var focus = '<div class="needs-personal-focus"><strong>Показатели для проверки</strong><p>Эти показатели получили повышенный приоритет в текущем профиле.</p><div>' + nutrientChips + '</div></div>';
        var caution = profile.caution ? '<div class="needs-personal-caution"><strong>Важное ограничение</strong><p>' + htmlEscape(profile.caution) + '</p></div>' : '';
        return '<section class="section needs-personal-profile"><header class="needs-personal-profile-heading"><span>Расчёт потребностей</span><h2>Профиль потребностей</h2><p>В расчёте используется один возрастной профиль. Пол, масса тела, активность, цель и выбранное состояние уточняют нормы и порядок рекомендаций.</p></header>' + primary + needsProfileMethodHtml(profile) + childNormBox + scenario + priorities + focus + caution + '</section>';
    }
    function needsProfileStageLabel(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        var g = profile.ageGroup || {};
        if (g.needsSpecialist)
            return 'Отдельный возрастной расчёт';
        if (g.child && g.adolescent)
            return 'Подростковый профиль РФ';
        if (g.child)
            return 'Детский профиль РФ';
        if (profile.state === 'elderly' && !g.older)
            return 'Пожилой профиль по состоянию';
        if (g.stage === 'older_late' || g.stage === 'older_early' || g.stage === 'adult_later')
            return 'Возрастной профиль';
        if (g.stage === 'adult_middle' || g.stage === 'adult_young')
            return 'Взрослый профиль';
        return 'Взрослый профиль';
    }
    function needsProfileBasisText(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        var g = profile.ageGroup || {};
        if (g.needsSpecialist)
            return 'Автоматический расчёт для этого возраста ограничен. Нужен индивидуальный расчёт с учётом особенностей питания и развития.';
        if (g.child)
            return 'Для этой возрастно-половой группы используются российские нормы энергии, БЖУ и ключевых микронутриентов.';
        if (profile.state === 'elderly' && !g.older)
            return 'Выбран профиль пожилого пациента. В рекомендациях повышен приоритет белка, кальция, витамина D, B12 и общей питательной ценности.';
        if (g.stage === 'older_late')
            return 'Возрастная группа повышает внимание к достаточности энергии и белка, кальцию, витамину D, B12 и переносимости рациона.';
        if (g.stage === 'older_early')
            return 'Возрастная группа повышает внимание к белку, кальцию, витамину D, B12 и распределению белковых продуктов в течение дня.';
        if (g.stage === 'adult_later')
            return 'Возрастная группа повышает внимание к белку, клетчатке, кальцию, натрию, насыщенным жирам и общей питательной ценности.';
        if (g.stage === 'adult_middle')
            return 'Возрастная группа задаёт базовые взрослые ориентиры. Масса тела, активность и цель уточняют итоговые значения.';
        if (g.stage === 'adult_young')
            return 'Возрастная группа задаёт базовые взрослые ориентиры. Итоговые значения уточняются по полу, массе тела, активности и цели.';
        return 'Возраст определяет исходную группу потребностей. Остальные параметры уточняют расчёт и рекомендации.';
    }
    function needsProfileShortChips(profile) {
        if (!profile)
            return [];
        return needsProfileContextChips(profile).slice(0, 5);
    }
    function needsProfileSelectionReason(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        var g = profile.ageGroup || {};
        var ageText = Number(profile.age) > 0 ? 'Возраст ' + Number(profile.age) + ' ' + ruYears(Number(profile.age)) + ' относится' : 'Введённый возраст относится';
        if (g.needsSpecialist)
            return ageText + ' к группе, для которой требуется индивидуальный расчёт.';
        if (g.child)
            return ageText + ' к группе «' + g.label + '». Для неё используются российские возрастно-половые нормы.';
        return ageText + ' к группе «' + g.label + '». Она задаёт возрастную основу расчёта; остальные параметры уточняют итоговые ориентиры.';
    }
    function needsProfileIndicatorIcon() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 11.2a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.2 1.1a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM2.8 20c.3-4 2.2-6.1 5.7-6.1s5.4 2.1 5.7 6.1m-.7-4.2c.6-.7 1.4-1 2.4-1 2.9 0 4.5 1.7 4.8 5.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
    }
    function ruYears(n) {
        n = Math.abs(Number(n));
        if (!Number.isFinite(n))
            return 'лет';
        var whole = Math.floor(n), mod100 = whole % 100, mod10 = whole % 10;
        if (mod100 >= 11 && mod100 <= 14)
            return 'лет';
        if (mod10 === 1)
            return 'год';
        if (mod10 >= 2 && mod10 <= 4)
            return 'года';
        return 'лет';
    }
    function needsProfileNormSystemLabel(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        if (profile.ageGroup.child)
            return 'РФ · возрастно-половые нормы';
        var region = 'us';
        try {
            region = (window.State && State.getRegion) ? State.getRegion() : 'us';
        }
        catch (_) { }
        return region === 'eu' ? 'ЕС · EFSA' : 'США · DRI';
    }
    function needsProfileActivityBasis(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        if (profile.ageGroup.needsSpecialist)
            return 'Отдельный педиатрический расчёт';
        if (profile.ageGroup.child)
            return 'Российская возрастно-половая таблица';
        var act = (ACT && ACT[profile.activity]) ? ACT[profile.activity] : ACT.low;
        var pal = act && Number.isFinite(Number(act.energy)) ? Number(act.energy) : 1.35;
        return 'Mifflin–St Jeor × PAL ' + String(pal.toFixed(2)).replace('.', ',');
    }
    function needsProfileProteinBasis(profile) {
        if (!profile || !profile.ageGroup)
            return '';
        if (profile.ageGroup.needsSpecialist)
            return 'Не рассчитывается автоматически';
        if (profile.ageGroup.child)
            return 'Возрастно-половая норма РФ';
        if (profile.state === 'ckd')
            return '0,8 г/кг без автоматического повышения';
        if (profile.state === 'dialysis')
            return 'Диализный белковый коридор';
        if (profile.state === 'icu')
            return 'Клинический ориентир ОРИТ';
        return 'Базовый взрослый ориентир с поправками по активности, цели и состоянию';
    }
    function needsProfileShortSummary(profile, applied) {
        var g = profile.ageGroup || {};
        var age = Number(profile.age);
        var ageLabel = Number.isFinite(age) && age > 0 ? String(age).replace('.', ',') + ' ' + ruYears(age) : 'введённый возраст';
        if (g.needsSpecialist)
            return 'Для возраста ' + ageLabel + ' стандартный автоматический профиль не применяется: нужен отдельный педиатрический расчёт.';
        if (g.child)
            return 'Для возраста ' + ageLabel + ' применена группа «' + g.label + '» и российские возрастно-половые нормы.';
        return 'Для возраста ' + ageLabel + ' применена группа «' + g.label + '». Пол, активность, цель и состояние уточняют итоговые значения.';
    }
    function needsProfileSpecificationRows(profile) {
        var g = profile.ageGroup || {};
        var stateText = profile.state === 'normal' ? 'Специальные клинические поправки не применяются' : (profile.stateLabel || profile.state || '—');
        return [
            ['Возрастная группа', g.label || '—'],
            ['Энергия', needsProfileActivityBasis(profile)],
            ['Белок', needsProfileProteinBasis(profile)],
            ['Микронутриенты', needsProfileNormSystemLabel(profile)],
            ['Уточняющие параметры', (profile.sexLabel || 'пол не указан') + '; ' + (profile.activityLabel || 'активность не указана') + '; ' + (profile.goalLabel || 'цель не указана')],
            ['Состояние', stateText]
        ];
    }
    function renderNeedsAgeProfileIndicator(metaOrProfile, mode) {
        if (mode === 'applied' && window.__cancelNeedsAgeProfilePending) {
            try {
                window.__cancelNeedsAgeProfilePending();
            }
            catch (_) { }
        }
        var el = document.getElementById('needsAgeProfileIndicator');
        if (!el)
            return;
        var ageEl = document.getElementById('needs_age');
        var rawAge = ageEl ? String(ageEl.value || '').trim() : '';
        var currentAge = rawAge === '' ? NaN : Number(rawAge);
        if (!Number.isFinite(currentAge) || currentAge < 1 || currentAge > 120) {
            el.hidden = true;
            el.innerHTML = '';
            el.className = 'needs-age-profile-indicator';
            return;
        }
        var profile = null;
        if (metaOrProfile && metaOrProfile.ageGroup && metaOrProfile.priorities)
            profile = metaOrProfile;
        else if (metaOrProfile && metaOrProfile.personalProfile)
            profile = metaOrProfile.personalProfile;
        else
            profile = buildPersonalNeedsProfile(currentNeedsInputsForPersonalProfile());
        if (!profile || !profile.ageGroup || profile.ageGroup.stage === 'unknown') {
            el.hidden = true;
            el.innerHTML = '';
            return;
        }
        var applied = mode === 'applied';
        var status = applied ? 'Применён в расчёте' : 'Профиль выбран';
        var title = needsProfileDisplayTitle(profile);
        var basis = needsProfileShortSummary(profile, applied);
        var normLabel = needsProfileNormSystemLabel(profile);
        var chips = [
            'Возраст: ' + String(profile.age).replace('.', ',') + ' ' + ruYears(Number(profile.age)),
            'Группа: ' + (profile.ageGroup.label || '—'),
            'Энергия: ' + needsProfileActivityBasis(profile),
            'Нормы: ' + normLabel
        ];
        var chipHtml = chips.map(function (v) { return '<span>' + htmlEscape(v) + '</span>'; }).join('');
        var rows = needsProfileSpecificationRows(profile).map(function (row) {
            return '<div class="needs-age-profile-spec-row"><span>' + htmlEscape(row[0]) + '</span><strong>' + htmlEscape(row[1]) + '</strong></div>';
        }).join('');
        var groupLabel = profile.ageGroup.child ? 'Детский нормативный профиль' : 'Возрастная группа потребностей';
        el.hidden = false;
        el.className = 'needs-age-profile-indicator' + (applied ? ' is-applied' : ' is-preview') + (profile.ageGroup.child ? ' is-child' : '') + (profile.ageGroup.older ? ' is-older' : '') + (profile.ageGroup.needsSpecialist ? ' is-special' : '');
        el.innerHTML = '<div class="needs-age-profile-card"><div class="needs-age-profile-mark">' + needsProfileIndicatorIcon() + '</div><div class="needs-age-profile-content"><div class="needs-age-profile-topline"><span>' + htmlEscape(status) + '</span><small>' + htmlEscape(groupLabel) + '</small></div><strong>' + htmlEscape(title) + '</strong><p>' + htmlEscape(basis) + '</p><div class="needs-age-profile-chips" aria-label="Краткая спецификация профиля">' + chipHtml + '</div></div></div><details class="needs-age-profile-why"><summary>Что именно задаёт этот профиль</summary><div class="needs-age-profile-why-body"><p>' + htmlEscape(needsProfileSelectionReason(profile)) + '</p><div class="needs-age-profile-spec-list">' + rows + '</div></div></details>';
        window.requestAnimationFrame(function () { el.classList.add('is-visible'); });
    }
    function bindNeedsAgeProfileIndicator() {
        var ids = ['needs_age', 'needs_sex', 'needs_state', 'needs_activity', 'needs_goal', 'needs_diet_style', 'needs_guardrail', 'needs_h', 'needs_w'];
        var AGE_SETTLE_SINGLE_MS = 760;
        var AGE_SETTLE_MULTI_MS = 420;
        var AGE_STEPS = 5;
        var ageTimer = 0;
        var ageStepTimer = 0;
        var ageGeneration = 0;
        var agePending = false;
        var pendingAge = NaN;
        var pendingRaw = '';
        var committedRaw = '';
        var lastSignature = '';
        var lastObservedAge = '';
        function ageNode() { return document.getElementById('needs_age'); }
        function indicatorNode() { return document.getElementById('needsAgeProfileIndicator'); }
        function progressNode() { return document.getElementById('needsAgeProfileProgress'); }
        function progressTrack() { return document.getElementById('needsAgeProfileProgressTrack'); }
        function progressText() { return document.getElementById('needsAgeProfileProgressText'); }
        function rawAge() { var n = ageNode(); return n ? String(n.value || '').trim() : ''; }
        function parsedValidAge() {
            var n = ageNode(), raw = rawAge(), value = raw === '' ? NaN : Number(raw);
            if (!n || !Number.isFinite(value) || value < 1 || value > 120 || Math.floor(value) !== value)
                return NaN;
            if (n.validity && n.validity.valid === false)
                return NaN;
            return value;
        }
        function delayFor(raw) {
            var digits = String(raw || '').replace(/\D/g, '').length;
            return digits <= 1 ? AGE_SETTLE_SINGLE_MS : AGE_SETTLE_MULTI_MS;
        }
        function clearAgeTimers() {
            window.clearTimeout(ageTimer);
            window.clearInterval(ageStepTimer);
            ageTimer = 0;
            ageStepTimer = 0;
        }
        function setProgressStep(step, age) {
            var track = progressTrack(), text = progressText();
            if (!track)
                return;
            var safeStep = Math.max(0, Math.min(AGE_STEPS, Number(step) || 0));
            Array.prototype.slice.call(track.querySelectorAll('i')).forEach(function (cell, index) {
                cell.classList.toggle('is-filled', index < safeStep);
                cell.classList.toggle('is-current', index === safeStep - 1 && safeStep < AGE_STEPS);
            });
            track.setAttribute('aria-valuenow', String(safeStep));
            if (text) {
                if (safeStep <= 1)
                    text.textContent = 'Возраст принят — ждём окончания ввода';
                else if (safeStep <= 3)
                    text.textContent = 'Определяем возрастную группу';
                else if (safeStep < AGE_STEPS)
                    text.textContent = 'Уточняем нормативный профиль';
                else
                    text.textContent = 'Профиль выбран для ' + age + ' ' + ruYears(age);
            }
        }
        function showProgress(age) {
            var box = progressNode();
            if (!box)
                return;
            box.hidden = false;
            box.classList.add('is-active');
            setProgressStep(1, age);
        }
        function hideProgress() {
            var box = progressNode();
            if (box) {
                box.hidden = true;
                box.classList.remove('is-active');
            }
            var track = progressTrack();
            if (track)
                track.setAttribute('aria-valuenow', '0');
        }
        function hideStaleIndicator() {
            var el = indicatorNode();
            if (!el)
                return;
            el.hidden = true;
            el.classList.add('is-stale');
            el.setAttribute('aria-busy', 'true');
        }
        function revealIndicator() {
            var el = indicatorNode();
            if (!el)
                return;
            el.classList.remove('is-stale');
            el.removeAttribute('aria-busy');
        }
        function signature() {
            return ids.map(function (id) { var n = document.getElementById(id); return n ? String(n.value || '') : ''; }).join('|') + '|' + (window.__lastNeedsProfileApplied ? '1' : '0');
        }
        function sync(force) {
            if (agePending)
                return;
            var sig = signature();
            if (!force && sig === lastSignature)
                return;
            lastSignature = sig;
            revealIndicator();
            try {
                renderNeedsAgeProfileIndicator(null, window.__lastNeedsProfileApplied ? 'applied' : 'preview');
            }
            catch (e) { }
        }
        function clearIndicator() {
            var el = indicatorNode();
            if (el) {
                el.hidden = true;
                el.innerHTML = '';
                el.className = 'needs-age-profile-indicator';
                el.removeAttribute('aria-busy');
            }
        }
        function invalidateAndHide() {
            clearAgeTimers();
            ageGeneration++;
            agePending = false;
            pendingAge = NaN;
            pendingRaw = '';
            committedRaw = '';
            hideProgress();
            clearIndicator();
            lastSignature = '';
        }
        function finishAgeSelection(generation, expectedRaw, age) {
            if (generation !== ageGeneration)
                return;
            var latestRaw = rawAge();
            var latest = parsedValidAge();
            if (!Number.isFinite(latest) || latestRaw !== expectedRaw || latest !== age) {
                scheduleAgeSelection('changed-during-wait');
                return;
            }
            clearAgeTimers();
            setProgressStep(AGE_STEPS, age);
            agePending = false;
            pendingAge = NaN;
            pendingRaw = '';
            committedRaw = latestRaw;
            lastObservedAge = latestRaw;
            revealIndicator();
            try {
                renderNeedsAgeProfileIndicator(null, 'preview');
            }
            catch (e) { }
            window.setTimeout(function () {
                if (generation !== ageGeneration || agePending)
                    return;
                hideProgress();
            }, 90);
            lastSignature = signature();
        }
        function commitPendingNow() {
            if (!agePending || !Number.isFinite(pendingAge))
                return false;
            finishAgeSelection(ageGeneration, pendingRaw, pendingAge);
            return true;
        }
        function scheduleAgeSelection(reason) {
            var raw = rawAge();
            var age = parsedValidAge();
            lastObservedAge = raw;
            try {
                window.__lastNeedsProfileApplied = false;
            }
            catch (_) { }
            if (!Number.isFinite(age)) {
                invalidateAndHide();
                return;
            }
            /* Android keyboards and autofill helpers can emit duplicate input events
               without changing the value. They must not restart the debounce forever. */
            if (agePending && raw === pendingRaw && age === pendingAge)
                return;
            if (!agePending && raw === committedRaw) {
                sync(false);
                return;
            }
            clearAgeTimers();
            ageGeneration++;
            var generation = ageGeneration;
            var delay = delayFor(raw);
            agePending = true;
            pendingAge = age;
            pendingRaw = raw;
            hideStaleIndicator();
            showProgress(age);
            var step = 1;
            var stepEvery = Math.max(70, Math.floor(delay / AGE_STEPS));
            ageStepTimer = window.setInterval(function () {
                if (generation !== ageGeneration) {
                    window.clearInterval(ageStepTimer);
                    return;
                }
                step = Math.min(AGE_STEPS - 1, step + 1);
                setProgressStep(step, age);
                if (step >= AGE_STEPS - 1) {
                    window.clearInterval(ageStepTimer);
                    ageStepTimer = 0;
                }
            }, stepEvery);
            ageTimer = window.setTimeout(function () { finishAgeSelection(generation, raw, age); }, delay);
        }
        window.__cancelNeedsAgeProfilePending = function (options) {
            clearAgeTimers();
            ageGeneration++;
            agePending = false;
            pendingAge = NaN;
            pendingRaw = '';
            committedRaw = rawAge();
            hideProgress();
            revealIndicator();
            if (options && options.render)
                sync(true);
        };
        ids.forEach(function (id) {
            var node = document.getElementById(id);
            if (!node || node.__needsProfileIndicatorBound)
                return;
            node.__needsProfileIndicatorBound = true;
            if (id === 'needs_age') {
                node.addEventListener('input', function () {
                    var raw = rawAge();
                    if (agePending && raw === pendingRaw)
                        return;
                    if (!agePending && raw === committedRaw)
                        return;
                    scheduleAgeSelection('input');
                });
                node.addEventListener('change', function () {
                    if (!commitPendingNow() && rawAge() !== committedRaw)
                        scheduleAgeSelection('change');
                });
                node.addEventListener('blur', function () {
                    if (!commitPendingNow() && rawAge() !== committedRaw)
                        scheduleAgeSelection('blur');
                });
                node.addEventListener('keydown', function (evt) {
                    if (evt.key === 'Enter') {
                        if (!commitPendingNow() && rawAge() !== committedRaw)
                            scheduleAgeSelection('enter');
                    }
                });
            }
            else {
                ['input', 'change', 'blur'].forEach(function (evt) {
                    node.addEventListener(evt, function () {
                        try {
                            window.__lastNeedsProfileApplied = false;
                        }
                        catch (_) { }
                        /* RC1 mobile stability: moving beyond the age field is an
                           explicit end-of-entry signal. Commit before the form can
                           reflow under the next control or calculation tap. */
                        if (agePending)
                            commitPendingNow();
                        sync(true);
                    });
                });
            }
        });
        lastObservedAge = rawAge();
        if (Number.isFinite(parsedValidAge())) {
            committedRaw = rawAge();
            revealIndicator();
            try {
                renderNeedsAgeProfileIndicator(null, 'preview');
            }
            catch (e) { }
            lastSignature = signature();
        }
        else
            invalidateAndHide();
        window.addEventListener('pageshow', function () {
            if (rawAge() !== lastObservedAge)
                scheduleAgeSelection('pageshow-change');
            else if (!agePending)
                sync(true);
        });
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden && rawAge() !== lastObservedAge)
                scheduleAgeSelection('visibility-change');
        });
        window.setInterval(function () {
            var now = rawAge();
            if (now !== lastObservedAge)
                scheduleAgeSelection('programmatic-change');
        }, 500);
    }
    function currentNeedsInputsForPersonalProfile() {
        var read = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var meta = {
            sex: read('needs_sex'), h: toNum(read('needs_h')), w: toNum(read('needs_w')), age: toNum(read('needs_age')),
            state: read('needs_state') || 'normal', activity: read('needs_activity') || 'low', goal: read('needs_goal') || 'maintain', edema: read('needs_edema') || 'no',
            dietStyle: read('needs_diet_style') || 'mixed', guardrail: read('needs_guardrail') || 'none',
            bmi: computeBMI(read('needs_h'), read('needs_w')),
            stateLabel: (STATE[read('needs_state')] && STATE[read('needs_state')].label) || read('needs_state'),
            activityLabel: (ACT[read('needs_activity')] && ACT[read('needs_activity')].label) || read('needs_activity'),
            goalLabel: { maintain: 'Поддержание', lose: 'Снижение', gain: 'Набор', rehab_gain: 'Реабилитация/набор' }[read('needs_goal')] || read('needs_goal'),
            dietStyleLabel: labelFromRegistry(DIET_STYLE_V5367, read('needs_diet_style') || 'mixed', 'Смешанный рацион'),
            guardrailLabel: labelFromRegistry(GUARDRAIL_PROFILE_V5367, read('needs_guardrail') || 'none', 'Нет')
        };
        return meta;
    }
    var PersonalNeedsProfileApiV5367 = {
        version: 'v5.3.155_calculation_core_ssot_pass1',
        build: buildPersonalNeedsProfile,
        buildFromDom: function () { return buildPersonalNeedsProfile(currentNeedsInputsForPersonalProfile()); },
        current: function () { return window.__lastPersonalNeedsProfile || buildPersonalNeedsProfile(currentNeedsInputsForPersonalProfile()); }
    };
    window.PersonalNeedsProfileV5367 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5366 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5365 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5364 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5363 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5362 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5361 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5360 = PersonalNeedsProfileApiV5367;
    window.PersonalNeedsProfileV5359 = PersonalNeedsProfileApiV5367;
    // Added: state-specific energy factor (SF) for Mifflin TEE
    // ---- Goal factor (целевой множитель TEE) ----
    const GOAL_FACTOR = {
        maintain: { gf: 1.00, note: 'без уклона' },
        lose: { gf: 0.85, note: 'дефицит ~15%' },
        gain: { gf: 1.10, note: 'профицит ~10%' },
        rehab_gain: { gf: 1.10, note: 'профицит ~10%' }
    };
    function goalFactorByKey(goalKey) {
        const cfg = GOAL_FACTOR[goalKey] || GOAL_FACTOR.maintain;
        let s = Number(cfg.gf) || 1.0;
        if (s < 0.75)
            s = 0.75;
        if (s > 1.25)
            s = 1.25;
        return s;
    }
    function energyByMifflinSF(state, sex, h, w, age, activity) {
        const st = (STATE && STATE[state]) ? STATE[state] : null;
        const sf = (st && typeof st.teeAdj === 'number') ? st.teeAdj : 1.0;
        const r = mifflinBMR(sex, w, h, age);
        if (!r)
            return null;
        const act = ACT[activity] || ACT.low;
        // TEE = BMR × PAL × state factor. ICU/renal profiles use weight-based screening estimates.
        const teeCore = act.energy * sf;
        const tee = Math.round(r.bmr * teeCore);
        return { low: tee, high: Math.round(tee * 1.10), bmr: r.bmr, s: r.s, act: act.energy, sf };
    }
    function calcNeeds_internal() {
        /* RC1 mobile first-tap hardening: settle the deferred age-profile selector
           before reading inputs so a late debounce cannot supersede this calculation. */
        try {
            if (typeof window.__cancelNeedsAgeProfilePending === 'function')
                window.__cancelNeedsAgeProfilePending({ render: false });
        }
        catch (_) { }
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
        const splitRaw = $('needs_split').value;
        const split = parseSplit(splitRaw);
        if (!h || !w) {
            alert('Укажите рост и массу.');
            return null;
        }
        if (!Number.isFinite(age) || age < 1 || age > 120) {
            alert('Укажите возраст от 1 до 120 лет: он нужен для энергии и возрастных норм.');
            return null;
        }
        if (h < 80 || h > 250 || w < 15 || w > 400) {
            alert('Проверьте рост и массу: введённые значения выходят за рабочий диапазон калькулятора.');
            return null;
        }
        const bmi = computeBMI(h, w);
        $('needs_bmi').value = isNaN(bmi) ? '' : bmi;
        if (Number.isFinite(age) && age > 0 && age < 1) {
            var infantProfile = buildPersonalNeedsProfile({ sex: sex, h: h, w: w, age: age, state: state, activity: activity, goal: goal, dietStyle: dietStyle, guardrail: guardrail, dietStyleLabel: dietStyleLabel, guardrailLabel: guardrailLabel, bmi: bmi, stateLabel: ((_a = STATE[state]) === null || _a === void 0 ? void 0 : _a.label) || state, activityLabel: ((_b = ACT[activity]) === null || _b === void 0 ? void 0 : _b.label) || activity, goalLabel: { maintain: 'Поддержание', lose: 'Снижение', gain: 'Набор', rehab_gain: 'Реабилитация/набор' }[goal] || goal });
            try {
                window.__lastNeedsMeta = null;
                window.__lastPersonalNeedsProfile = infantProfile;
                window.__lastNeedsProfileApplied = true;
            }
            catch (_) { }
            try {
                renderNeedsAgeProfileIndicator(infantProfile, 'applied');
            }
            catch (_) { }
            $('needs_out').innerHTML = '<div class="alert"><b>Возраст требует отдельного расчёта.</b><br>Для детей до 1 года автоматическая взрослая и стандартная детская логика не применяется. Нужен педиатрический расчёт с учётом месяцев жизни, вскармливания, роста, массы и медицинского контекста.</div>';
            try {
                document.dispatchEvent(new CustomEvent('needs:computed', { detail: { personalProfile: infantProfile, age: age, sex: sex, state: state, activity: activity, goal: goal, dietStyle: dietStyle, guardrail: guardrail, unsupportedAge: true } }));
            }
            catch (_) { }
            return null;
        }
        const auto = computeAutoParams({ sex, h, w, age, state, activity, edema });
        const ibw = computeIBW(sex, h);
        const adjW = (ibw != null) ? computeAdjusted(ibw, w, auto.f) : null;
        let usedWeight = w;
        if (auto.weightChoice === 'adjusted' && adjW != null)
            usedWeight = adjW;
        else if (auto.weightChoice === 'ibw' && ibw != null)
            usedWeight = ibw;
        // Энергия
        const childNorm = russianChildNormFor(age, sex);
        const eWeight = energyByWeightMethod(state, activity, usedWeight);
        const eMiff = energyByMifflinSF(state, sex, h, w, age, activity);
        const clinicalWeightOnly = ['icu', 'ckd', 'dialysis'].includes(state) || edema === 'yes';
        const e = (!clinicalWeightOnly && auto.method === 'mifflin' && eMiff) ? eMiff : eWeight;
        let GF = goalFactorByKey(goal);
        let goalGuardrailOverride = '';
        if (goal === 'lose' && (guardrailBlocksAutoDeficit(guardrail) || (Number.isFinite(bmi) && bmi < 18.5))) {
            GF = 1.00;
            goalGuardrailOverride = (Number.isFinite(bmi) && bmi < 18.5 ? 'ИМТ ниже 18,5: ' : 'Выбран защитный сценарий «' + guardrailLabel + '»: ') + 'автоматический дефицит калорий для цели снижения массы отключён. Калькулятор оставляет обзор качества рациона, а изменение массы требует очной тактики.';
        }
        if (STATE[state] && STATE[state].clinicianOnly && goal !== 'maintain') {
            GF = 1.00;
            goalGuardrailOverride = 'Для клинического профиля «' + (STATE[state].label || state) + '» автоматический дефицит или профицит отключён: энергетическую цель должен подтвердить лечащий специалист.';
        }
        let method = clinicalWeightOnly ? 'weight' : auto.method;
        let energyLow = Math.round(e.low * GF), energyHigh = Math.round(e.high * GF);
        let actEnergy = e.act;
        let kcalPerKg = e.kcalPerKg || Math.round(energyLow / usedWeight);
        const bmr = e.bmr || null;
        let stateEnergyAdj = (_c = e.sf) !== null && _c !== void 0 ? _c : 1;
        const sSign = (sex === 'male') ? '+5' : '−161';
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
        // Белок
        let proteinPerKg = proteinPerKgFor(state, activity, age, goal, usedWeight, sex);
        let totalProtein = childNorm && method === 'rus_child_norm' ? childNorm.protein_g : +(proteinPerKg * usedWeight).toFixed(1);
        if (manualProt != null) {
            totalProtein = manualProt;
            proteinPerKg = +(totalProtein / usedWeight).toFixed(2);
        }
        // Единая рабочая энергетическая цель: по умолчанию середина рассчитанного коридора.
        // Она используется одновременно в профиле, экранных нормах, макронутриентах и модели отчёта.
        const energyTarget = childNorm && method === 'rus_child_norm'
            ? childNorm.kcal
            : (window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.chooseEnergy({ energyLow, energyHigh }) : Math.round((energyLow + energyHigh) / 2));
        // Жиры/угли из единой рабочей цели или из детской таблицы МР 2.3.1.0253-21
        let fatPct = (state === 'icu') ? 0.25 : 0.30;
        let fatKcal = Math.round(energyTarget * fatPct);
        let fatGrams = +(fatKcal / 9).toFixed(1);
        const protKcal = Math.round(totalProtein * 4);
        let carbKcal = Math.max(0, energyTarget - protKcal - fatKcal);
        let carbGrams = +(carbKcal / 4).toFixed(1);
        if (childNorm && method === 'rus_child_norm') {
            fatGrams = childNorm.fat_g;
            carbGrams = childNorm.carbs_g;
            fatKcal = Math.round(fatGrams * 9);
            carbKcal = Math.round(carbGrams * 4);
            fatPct = energyTarget ? +(fatKcal / energyTarget).toFixed(3) : fatPct;
        }
        // Жидкость
        const fluidPerKg = (((_d = STATE[state]) === null || _d === void 0 ? void 0 : _d.fluidMlPerKg) || 30);
        const fluidMl = Math.round(fluidPerKg * usedWeight);
        // Распределение
        const parts = split.parts.map(x => x / 100);
        const meals = parts.map(pct => ({
            pct,
            kcal: Math.round(energyTarget * pct),
            protein: +(totalProtein * pct).toFixed(1),
            fat: +(fatGrams * pct).toFixed(1),
            carbs: +(carbGrams * pct).toFixed(1)
        }));
        const meta = {
            // inputs
            sex, h, w, age, state, activity, edema, goal, dietStyle, guardrail,
            stateLabel: ((_e = STATE[state]) === null || _e === void 0 ? void 0 : _e.label) || state,
            activityLabel: ((_f = ACT[activity]) === null || _f === void 0 ? void 0 : _f.label) || activity,
            goalLabel: { maintain: 'Поддержание', lose: 'Снижение', gain: 'Набор', rehab_gain: 'Реабилитация/набор' }[goal],
            dietStyleLabel: dietStyleLabel,
            guardrailLabel: guardrailLabel,
            goalGuardrailOverride: goalGuardrailOverride,
            goalFactor: GF,
            // intermediates
            bmi, ibw, adjusted: adjW, f: auto.f, weightChoice: auto.weightChoice, usedWeight, pediatricWeightLogic: !!auto.pediatricWeightLogic,
            method: method, childNorm: childNorm, actEnergy, kcalPerKg, energyPerKg: round0(energyTarget / usedWeight),
            // energy details
            bmr, sSign, energyLow, energyHigh, energyTarget, stateEnergyAdj,
            // protein
            proteinPerKg, totalProtein, pRange: (childProteinRangeFor(age, activity, state, goal, usedWeight, sex) ? [childProteinRangeFor(age, activity, state, goal, usedWeight, sex).floor, childProteinRangeFor(age, activity, state, goal, usedWeight, sex).cap] : (((_g = STATE[state]) === null || _g === void 0 ? void 0 : _g.pRange) || [1.0, 1.4])), proteinNote: proteinNoteFor({ sex, w, usedWeight, state, activity, age, goal, stateLabel: ((_h = STATE[state]) === null || _h === void 0 ? void 0 : _h.label) || state, activityLabel: ((_j = ACT[activity]) === null || _j === void 0 ? void 0 : _j.label) || activity, goalLabel: { maintain: 'Поддержание', lose: 'Снижение', gain: 'Набор', rehab_gain: 'Реабилитация/набор' }[goal] }), manualProt: manualProt,
            // fat/carb
            fatPct, fatKcal, fatGrams, protKcal, carbKcal, carbGrams,
            // fluids
            fluidPerKg, fluidMl,
            // split
            splitLabel: splitRaw.split('|')[1].replaceAll(',', ' / ') + ' %',
            meals,
            // notes
            autoReason: auto.reason + (clinicalWeightOnly ? '; для выбранного клинического профиля/отёков используется весовой метод без PAL' : ''),
            lowBMIOverride: !!auto.lowBMIOverride
        };
        meta.personalProfile = buildPersonalNeedsProfile(meta);
        try {
            window.__lastNeedsMeta = meta;
            window.__lastPersonalNeedsProfile = meta.personalProfile;
            window.__lastNeedsProfileApplied = true;
        }
        catch (_) { }
        try {
            renderNeedsAgeProfileIndicator(meta, 'applied');
        }
        catch (_) { }
        renderReport(meta);
        return meta;
    }
    function resetNeeds() {
        ['needs_h', 'needs_w', 'needs_age', 'needs_protein_manual'].forEach(id => { const el = $(id); if (el)
            el.value = ''; });
        $('needs_bmi').value = '';
        $('needs_sex').value = 'male';
        $('needs_state').value = 'normal';
        $('needs_activity').value = 'low';
        $('needs_edema').value = 'no';
        $('needs_goal').value = 'maintain';
        if ($('needs_diet_style'))
            $('needs_diet_style').value = 'mixed';
        if ($('needs_guardrail'))
            $('needs_guardrail').value = 'none';
        $('needs_split').value = '4|25,35,30,10';
        $('needs_out').innerHTML = 'Введите исходные данные и нажмите «Рассчитать».';
        $('dbg_json').textContent = '';
        try {
            window.__lastNeedsMeta = null;
            window.__lastPersonalNeedsProfile = null;
            window.__lastNeedsProfileApplied = false;
        }
        catch (_) { }
        try {
            renderNeedsAgeProfileIndicator(null, 'preview');
        }
        catch (_) { }
    }
    function printNeeds() {
        var out = document.getElementById('needs_out');
        var nameEl = document.getElementById('needs_person_name');
        var name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : '';
        var dt = (new Date()).toLocaleString();
        var content = out ? out.innerHTML : '<p>Нет данных</p>';
        // принудительно раскрываем все свернутые блоки <details> ... </details>
        content = content.replace(/<details([^>]*)>/gi, function (m, attrs) {
            return /open/gi.test(attrs) ? '<details' + attrs + '>' : '<details' + attrs + ' open>';
        });
        var headHtml = document.head ? document.head.innerHTML : '';
        var w = window.open('', '_blank', 'width=960,height=900,scrollbars=yes');
        if (!w) {
            alert('Разрешите всплывающие окна для печати');
            return;
        }
        var html = '<!doctype html><html><head>' + headHtml +
            '<meta charset="utf-8"><title>Отчёт по потребностям</title>' +
            '<style>@media print{@page{size:A4;margin:14mm;} .print-btn{display:none;} details>summary{list-style:none;}}</style>' +
            '</head><body style="margin:0;padding:12px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">';
        html += '<h2 style="margin-top:0;">Подробный отчёт по нутритивным потребностям</h2>';
        if (name)
            html += '<div style="font-weight:600;margin-bottom:4px;">Пациент: ' + name + '</div>';
        html += '<div style="font-size:12px;margin-bottom:12px;">Дата и время: ' + dt + '</div>';
        html += '<button class="print-btn" onclick="window.print()" style="margin-bottom:12px;">Печать (Ctrl+P)</button>';
        html += content;
        html += '</body></html>';
        w.document.open();
        w.document.write(html);
        w.document.close();
        try {
            w.focus();
        }
        catch (e) { }
    }
    function buildNeedsPdfHtml() {
        var out = document.getElementById('needs_out');
        var nameEl = document.getElementById('needs_person_name');
        var name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : '';
        var dt = (new Date()).toLocaleString();
        var content = out ? out.innerHTML : '<p>Нет данных</p>';
        content = content.replace(/<details([^>]*)>/gi, function (m, attrs) {
            return /open/gi.test(attrs) ? '<details' + attrs + '>' : '<details' + attrs + ' open>';
        });
        var html = '<div class="needs-pdf-report">';
        html += '<h1>Подробный отчёт по нутритивным потребностям</h1>';
        if (name)
            html += '<div class="meta"><strong>Пациент:</strong> ' + name.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</div>';
        html += '<div class="meta"><strong>Дата и время:</strong> ' + dt + '</div>';
        html += '<div class="native-pdf-note">Для сохранения PDF выберите в диалоге печати пункт «Сохранить в PDF».</div>';
        html += content;
        html += '</div>';
        return html;
    }
    function openNeedsNativePdf() {
        var w = window.open('', '_blank', 'width=960,height=900,scrollbars=yes');
        if (!w) {
            alert('Разрешите всплывающие окна: PDF формируется через системный диалог печати.');
            return false;
        }
        var styles = '' +
            '<style>' +
            '@media print{@page{size:A4;margin:14mm;} .native-pdf-note{display:none!important;} details>summary{list-style:none;} body{background:#fff!important;}}' +
            'body{margin:0;padding:16px 18px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;line-height:1.45;background:#fff;}' +
            'h1{font-size:22px;margin:0 0 10px;color:#0b61d6;}' +
            'h2{font-size:16px;margin:16px 0 8px;color:#0b61d6;}' +
            'h3{font-size:14px;margin:12px 0 6px;color:#123b64;}' +
            '.meta{font-size:13px;margin:3px 0;color:#334155;}' +
            '.native-pdf-note{margin:12px 0;padding:10px 12px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:13px;}' +
            '.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;}' +
            '.tile,.section,.alert,details.fold{break-inside:avoid;border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:10px;margin:8px 0;}' +
            '.tile .title{font-size:12px;color:#475569;}.tile .value{font-size:17px;font-weight:800;color:#0f172a;}' +
            'table,.tbl{width:100%;border-collapse:collapse;margin:8px 0;} th,td{border-bottom:1px solid #e2e8f0;padding:6px 7px;text-align:left;font-size:12px;} th{background:#f8fafc;color:#123b64;}' +
            'details{break-inside:avoid;} details>summary{font-weight:800;color:#0b61d6;margin-bottom:8px;}' +
            '.small,.muted{color:#475569;font-size:12px;}' +
            '</style>';
        var html = '<!doctype html><html><head><meta charset="utf-8"><title>PDF: расчёт потребностей</title>' + styles + '</head><body>' + buildNeedsPdfHtml() + '<script>window.onload=function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},250)};<\/script></body></html>';
        w.document.open();
        w.document.write(html);
        w.document.close();
        try {
            w.focus();
        }
        catch (e) { }
        return true;
    }
    function saveNeedsPdf() {
        var out = document.getElementById('needs_out');
        if (!out) {
            alert('Блок расчёта потребностей не найден.');
            return;
        }
        if (typeof html2pdf === 'undefined') {
            openNeedsNativePdf();
            return;
        }
        var wrapper = document.createElement('div');
        wrapper.style.padding = '12px';
        wrapper.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
        wrapper.innerHTML = buildNeedsPdfHtml();
        var opt = {
            margin: 10,
            filename: 'needs_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        try {
            html2pdf().set(opt).from(wrapper).save();
        }
        catch (e) {
            openNeedsNativePdf();
        }
    }
    bindNeedsAgeProfileIndicator();
    // events
    var needsCalcButton = $('needs_calc_btn');
    needsCalcButton.addEventListener('click', calcNeeds_internal);
    /* RC1 readiness gate: the button becomes interactive only after the complete
       runtime has finished booting. This prevents later optional modules from
       superseding a calculation triggered during parallel startup. */
    var enableNeedsCalculation = function () {
        if (needsCalcButton.getAttribute('data-needs-calculation-ready') === '1')
            return;
        needsCalcButton.disabled = false;
        needsCalcButton.setAttribute('aria-disabled', 'false');
        needsCalcButton.setAttribute('data-needs-calculation-ready', '1');
    };
    if (window.__APP_BOOTSTRAP_META__)
        enableNeedsCalculation();
    else if (window.addEventListener)
        window.addEventListener('app:ready', enableNeedsCalculation, { once: true });
    else
        enableNeedsCalculation();
    $('needs_reset_btn').addEventListener('click', resetNeeds);
    $('needs_print_btn').addEventListener('click', printNeeds);
    if ($('needs_pdf_btn'))
        $('needs_pdf_btn').addEventListener('click', saveNeedsPdf);
    // live BMI
    ['needs_h', 'needs_w', 'needs_age', 'needs_activity', 'needs_state', 'needs_edema', 'needs_goal'].forEach(id => {
        const el = $(id);
        if (!el)
            return;
        el.addEventListener('input', () => {
            const bmi = computeBMI($('needs_h').value, $('needs_w').value);
            $('needs_bmi').value = isNaN(bmi) ? '' : bmi;
        });
    });
})();
;
// ===== extracted inline script 12; id=none =====
(() => {
    const IN = { kcal: 'normInput-kcal', protein_g: 'normInput-protein_g', fat_g: 'normInput-fat_g', carbs_g: 'normInput-carbs_g' };
    const OUT = { kcalLow: 'needs_kcal_low', kcalHigh: 'needs_kcal_high', protein: 'needs_protein_total', fatG: 'needs_fat_g', carbG: 'needs_carb_g' };
    let linked = true;
    let isSyncing = false;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const $ = (id) => document.getElementById(id);
    const toNum = (x) => { if (typeof x === 'number')
        return x; const s = String(x !== null && x !== void 0 ? x : '').replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, ''); const n = parseFloat(s); return Number.isFinite(n) ? n : 0; };
    const fmt = (v, d = 0) => Number.isFinite(v) ? (d ? v.toFixed(d) : String(Math.round(v))) : '';
    function setInput(id, value, decimals = 0) {
        const el = $(id);
        if (!el)
            return;
        const str = fmt(value, decimals);
        if (el.value !== str) {
            isSyncing = true;
            el.value = str;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            isSyncing = false;
        }
    }
    function setNormKey(key, val, unit) {
        if (!window.norms || !window.norms.values)
            return;
        const v = clamp(val, 0, 100000);
        window.norms.values[key] = { value: v, unit: unit };
    }
    function chooseKcal(low, high) {
        if (window.NeedsNormSyncV53155)
            return window.NeedsNormSyncV53155.chooseEnergy({ energyLow: low, energyHigh: high });
        if (!Number.isFinite(low))
            low = 0;
        if (!Number.isFinite(high))
            high = low;
        return Math.round((low + high) / 2);
    }
    function applyNeeds(meta) {
        if (!linked)
            return;
        const kcal = chooseKcal(toNum(meta.energyLow), toNum(meta.energyHigh));
        const protein = clamp(toNum(meta.totalProtein), 0, 1000);
        const fat = clamp(toNum(meta.fatGrams), 0, 1000);
        const carbs = clamp(toNum(meta.carbGrams), 0, 1000);
        const limits = window.NeedsNormSyncV53155 ? window.NeedsNormSyncV53155.upperLimitsForEnergy(kcal) : {sfa_g:0,added_sugars_g:0,provenance:{registryMissing:true}};
        setInput(IN.kcal, kcal, 0);
        setInput(IN.protein_g, protein, 0);
        setInput(IN.fat_g, fat, 0);
        setInput(IN.carbs_g, carbs, 0);
        setInput('normInput-sfa_g', limits.sfa_g, 1);
        setInput('normInput-added_sugars_g', limits.added_sugars_g, 1);
        setNormKey('kcal', kcal, 'ккал');
        setNormKey('protein_g', protein, 'г');
        setNormKey('fat_g', fat, 'г');
        setNormKey('carbs_g', carbs, 'г');
        setNormKey('sfa_g', limits.sfa_g, 'г');
        setNormKey('added_sugars_g', limits.added_sugars_g, 'г');
        if (typeof window.renderTotals === 'function' && !isSyncing) {
            try {
                window.renderTotals();
            }
            catch (e) {
                console.warn(e);
            }
        }
    }
    document.addEventListener('needs:computed', (e) => {
        if (isSyncing)
            return;
        try {
            applyNeeds(e.detail || {});
        }
        catch (err) {
            console.error(err);
        }
    });
    const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
    const readFromReport = debounce(() => {
        const meta = {
            energyLow: $(OUT.kcalLow) && $(OUT.kcalLow).textContent,
            energyHigh: $(OUT.kcalHigh) && $(OUT.kcalHigh).textContent,
            totalProtein: $(OUT.protein) && $(OUT.protein).textContent,
            fatGrams: $(OUT.fatG) && $(OUT.fatG).textContent,
            carbGrams: $(OUT.carbG) && $(OUT.carbG).textContent,
        };
        applyNeeds(meta);
    }, 120);
    const out = $('needs_out');
    if (out && 'MutationObserver' in window) {
        const mo = new MutationObserver(() => { if (!isSyncing)
            readFromReport(); });
        mo.observe(out, { childList: true, subtree: true });
    }
    window.NeedsLink = {
        enable(v) { linked = !!v; },
        setKcalMode(m) { if (window.NeedsNormSyncV53155)
            return window.NeedsNormSyncV53155.setKcalMode(m); return m; },
        syncOnce() { readFromReport(); }
    };
})();
;
