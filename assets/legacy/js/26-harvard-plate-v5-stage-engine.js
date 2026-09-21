// Harvard Plate v5 State Engine
// v5.2.3 final polish support: stable states, explainability, accessible UI model.
(function (global) {
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
    function toNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }
    function round(value, digits) {
        const p = Math.pow(10, digits == null ? 1 : digits);
        return Math.round((Number(value) || 0) * p) / p;
    }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function classifyFillRatio(fillRatio) {
        const x = Number(fillRatio) || 0;
        if (x <= 0)
            return STATE_BANDS[0];
        for (const band of STATE_BANDS) {
            if (x >= band.min && x <= band.max)
                return band;
        }
        return STATE_BANDS[STATE_BANDS.length - 1];
    }
    function computeAdjustment(currentG, coreMass, targetShare) {
        currentG = toNumber(currentG);
        coreMass = toNumber(coreMass);
        targetShare = Number(targetShare) || 0;
        if (!coreMass || !targetShare || targetShare >= 1) {
            return { type: 'none', grams: 0, message: 'добавьте продукты в рацион' };
        }
        const targetCurrent = targetShare * coreMass;
        if (currentG < targetCurrent) {
            const addG = (targetCurrent - currentG) / (1 - targetShare);
            return { type: 'add', grams: Math.max(0, Math.round(addG)), message: 'добавьте примерно ' + Math.max(0, Math.round(addG)) + ' г' };
        }
        if (currentG > targetCurrent) {
            const reduceG = (currentG - targetCurrent) / (1 - targetShare);
            return { type: 'reduce', grams: Math.max(0, Math.round(reduceG)), message: 'уменьшите примерно на ' + Math.max(0, Math.round(reduceG)) + ' г' };
        }
        return { type: 'none', grams: 0, message: 'ориентир достигнут' };
    }
    function buildSector(id, grams, coreMass, targetShare) {
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
    function deriveQualityFlags(input, sectors, options) {
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
        if (fruitsG > 0 && fruitsG > vegetablesG) {
            flags.push({ id: 'fruit-heavy', severity: 'warn', message: 'фруктовая часть превышает овощную' });
        }
        if (sectors.vegetables.fillRatio < 0.6) {
            flags.push({ id: 'vegetables-low', severity: 'warn', message: 'овощная часть заметно ниже ориентира' });
        }
        if (refinedG > 0) {
            flags.push({ id: 'refined-grains-present', severity: 'info', message: 'рафинированные злаки учитываются отдельно от цельнозернового сектора' });
        }
        if (dairyG > 0 && (options.proteinCountingMode || 'harvard-strict') === 'harvard-strict') {
            flags.push({ id: 'dairy-separate', severity: 'info', message: 'молочные продукты учитываются отдельно от белковой четверти' });
        }
        if (processedMeatG > 0) {
            flags.push({ id: 'processed-meat-warning', severity: 'warn', message: 'переработанное мясо требует отдельной оценки качества белкового сектора' });
        }
        if (saturatedFatG > 0 && unsaturatedFatG > 0 && (unsaturatedFatG / saturatedFatG) < 2.5) {
            flags.push({ id: 'saturated-high', severity: 'warn', message: 'соотношение ненасыщенных и насыщенных жиров ниже ориентира' });
        }
        if (juiceMl > 0) {
            flags.push({ id: 'juice-separate', severity: 'info', message: 'соки и смузи показаны отдельно от воды' });
        }
        if (sweetDrinkMl > 0) {
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
    function buildVisualPlan(model) {
        const sectors = {};
        Object.keys(model.sectors || {}).forEach(function (key) {
            const s = model.sectors[key];
            const needsDeficit = ['very-low', 'low'].indexOf(s.state) >= 0;
            const needsOver = ['over', 'strong-over'].indexOf(s.state) >= 0;
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
            qualityOverlays: (model.qualityFlags || []).map(function (f) { return { id: f.id, severity: f.severity, asset: VISUAL_STATE_ASSETS.quality[f.id] || null, message: f.message }; }),
            globalOverlay: model.balanced ? 'overlays/global/balance-glow-v5.svg' : null
        };
    }
    function deriveModel(input, options) {
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
    function getDemoRations() {
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
