// nutrition calculator v5.3.194_hei_recommendation_render_stability
// Responsibility: critical HEI recommendation hierarchy, merged actions, honest statuses and metric deltas.
(function () {
    'use strict';
    var VERSION = 'v5.3.194_hei_recommendation_render_stability';
    window.__V53115_HEI_RECOMMENDATIONS_REGRESSION_HARDENING__ = VERSION;
    var UNIT_GRAMS = {
        fruits_total: 150, fruits_whole: 150, vegetables_total: 130, greens_beans: 130,
        grains_whole: 85, dairy: 244, protein_total: 28.35, seafood_plant: 28.35,
        grains_refined: 85
    };
    var LABELS = {
        fruits_total: 'Фрукты — всего', fruits_whole: 'Цельные фрукты', vegetables_total: 'Овощи — всего',
        greens_beans: 'Зелень и бобовые', grains_whole: 'Цельные злаки', dairy: 'Молочные продукты',
        protein_total: 'Белковые продукты — всего', seafood_plant: 'Рыба и растительные источники белка',
        fatty_acids_ratio: 'Соотношение жиров', grains_refined: 'Рафинированные злаки',
        sodium_g: 'Натрий', added_sugars_pct: 'Добавленный сахар', sat_fats_pct: 'Насыщённые жиры'
    };
    var ORDER = ['fruits_total', 'fruits_whole', 'vegetables_total', 'greens_beans', 'grains_whole', 'dairy', 'protein_total', 'seafood_plant', 'fatty_acids_ratio', 'grains_refined', 'sodium_g', 'added_sugars_pct', 'sat_fats_pct'];
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function clamp(v, a, b) { v = Number(v); if (!Number.isFinite(v))
        v = 0; return Math.max(a, Math.min(b, v)); }
    function fmt(v, d) { v = Number(v); if (!Number.isFinite(v))
        return '—'; var n = v.toFixed(d == null ? 0 : d).replace('.', ','); return n.replace(/,0$/, ''); }
    function nbspUnit(v, unit, d) { return fmt(v, d) + '\u00a0' + unit; }
    function maxPts(key, std) { return Number(std && std[key] && std[key].pts) || 10; }
    function ratioFor(key, model, std) { return clamp((Number(model && model.points && model.points[key]) || 0) / maxPts(key, std), 0, 1); }
    function lostFor(key, model, std) { return Math.max(0, maxPts(key, std) - (Number(model && model.points && model.points[key]) || 0)); }
    function densityForModerationPoints(rule, pts) {
        pts = clamp(pts, 0, Number(rule.pts) || 10);
        if (pts >= rule.pts)
            return rule.max;
        if (pts <= 0)
            return rule.maxBad;
        return rule.maxBad - (pts / rule.pts) * (rule.maxBad - rule.max);
    }
    function componentMetric(key, model, std) {
        var rule = std[key] || {};
        var d = Number(model.density && model.density[key]) || 0;
        var pts = Number(model.points && model.points[key]) || 0;
        var max = Number(rule.pts) || 10;
        var ratio = clamp(pts / max, 0, 1);
        var energyRef = Math.max(1, Number(model.energyRefKcal) || 2000);
        var intakeEnergy = Math.max(1, Number(model.intake && model.intake.energy_kcal) || energyRef);
        var out = { key: key, pts: pts, max: max, ratio: ratio, lost: Math.max(0, max - pts), achieved: ratio >= 0.95, near: ratio >= 0.75, next: 0, target: 0, unit: '', sign: '+', current: '', orientation: '', nextText: '', targetText: '' };
        if (rule.kind === 'adequacy' && key !== 'fatty_acids_ratio') {
            var targetDensity = Number(rule.min) || 0;
            var nextPts = Math.min(max, Math.floor(pts + 1e-9) + 1);
            if (nextPts <= pts + 1e-6)
                nextPts = Math.min(max, pts + 1);
            var nextDensity = targetDensity * clamp(nextPts / max, 0, 1);
            var unitWeight = UNIT_GRAMS[key] || 0;
            var currentUnits = d * energyRef / 1000;
            var targetUnits = targetDensity * energyRef / 1000;
            out.next = Math.max(0, (nextDensity - d) * energyRef / 1000 * unitWeight);
            out.target = Math.max(0, (targetDensity - d) * energyRef / 1000 * unitWeight);
            out.current = currentUnits * unitWeight;
            out.orientation = targetUnits * unitWeight;
            out.unit = key === 'dairy' ? 'мл или г' : 'г';
            out.nextText = out.next > 0 ? 'добавить около ' + nbspUnit(out.next, out.unit, 0) : 'дополнительное количество не требуется';
            out.targetText = out.target > 0 ? 'добавить около ' + nbspUnit(out.target, out.unit, 0) : 'ориентир достигнут';
            return out;
        }
        if (key === 'fatty_acids_ratio') {
            var nextRatio = Number(rule.min) || 1.2;
            if (pts < max) {
                var targetPts = Math.min(max, Math.floor(pts + 1e-9) + 1);
                nextRatio = rule.min + (targetPts / max) * (rule.max - rule.min);
            }
            else
                nextRatio = rule.max;
            out.current = d;
            out.orientation = rule.max;
            out.next = Math.max(0, nextRatio - d);
            out.target = Math.max(0, rule.max - d);
            out.unit = '';
            out.nextText = out.next > 0 ? 'повысить примерно на ' + fmt(out.next, 2) : 'изменение не требуется';
            out.targetText = out.target > 0 ? 'повысить примерно на ' + fmt(out.target, 2) : 'ориентир достигнут';
            return out;
        }
        var nextPoint = Math.min(max, Math.floor(pts + 1e-9) + 1);
        if (nextPoint <= pts + 1e-6)
            nextPoint = Math.min(max, pts + 1);
        var nextD = densityForModerationPoints(rule, nextPoint);
        var targetD = Number(rule.max) || 0;
        var deltaNext = Math.max(0, d - nextD);
        var deltaTarget = Math.max(0, d - targetD);
        if (key === 'grains_refined') {
            out.current = d * energyRef / 1000 * 85;
            out.orientation = targetD * energyRef / 1000 * 85;
            out.next = deltaNext * energyRef / 1000 * 85;
            out.target = deltaTarget * energyRef / 1000 * 85;
            out.unit = 'г';
            out.sign = '−';
        }
        else if (key === 'sodium_g') {
            out.current = d * energyRef;
            out.orientation = targetD * energyRef;
            out.next = deltaNext * energyRef;
            out.target = deltaTarget * energyRef;
            out.unit = 'мг';
            out.sign = '−';
        }
        else if (key === 'added_sugars_pct') {
            out.current = d * intakeEnergy / 100 / 4;
            out.orientation = targetD * intakeEnergy / 100 / 4;
            out.next = deltaNext * intakeEnergy / 100 / 4;
            out.target = deltaTarget * intakeEnergy / 100 / 4;
            out.unit = 'г';
            out.sign = '−';
        }
        else if (key === 'sat_fats_pct') {
            out.current = d * intakeEnergy / 100 / 9;
            out.orientation = targetD * intakeEnergy / 100 / 9;
            out.next = deltaNext * intakeEnergy / 100 / 9;
            out.target = deltaTarget * intakeEnergy / 100 / 9;
            out.unit = 'г';
            out.sign = '−';
        }
        out.nextText = out.next > 0 ? 'сократить примерно на ' + nbspUnit(out.next, out.unit, 0) : 'сокращение не требуется';
        out.targetText = out.target > 0 ? 'сократить примерно на ' + nbspUnit(out.target, out.unit, 0) : 'ориентир достигнут';
        return out;
    }
    function stateLabel(metric) {
        if (metric.achieved)
            return 'Ориентир достигнут';
        if (metric.ratio >= 0.75)
            return 'Близко к ориентиру';
        if (metric.ratio < 0.4)
            return 'Высокий приоритет';
        return 'Требует внимания';
    }
    function stateClass(metric) { if (metric.achieved)
        return 'achieved'; if (metric.ratio >= 0.75)
        return 'near'; if (metric.ratio < 0.4)
        return 'priority'; return 'attention'; }
    function practicalByKey(key) {
        var map = {
            fruits_total: 'Добавьте около 150\u00a0г фруктов целиком или ягод.',
            fruits_whole: 'Замените сок или фруктовое пюре фруктом целиком либо добавьте около 150\u00a0г цельных фруктов.',
            vegetables_total: 'Добавьте к основному приёму пищи 130–150\u00a0г овощей.',
            greens_beans: 'Добавьте листовую зелень либо порцию готовых бобовых; бобовые улучшат сразу несколько компонентов HEI.',
            grains_whole: 'Замените часть очищенных злаков на 80–100\u00a0г готовой цельной крупы или на цельнозерновой хлеб.',
            dairy: 'Используйте 200–250\u00a0мл несладкого молочного продукта или подходящей обогащённой альтернативы.',
            protein_total: 'Добавьте порцию белкового блюда — примерно 80–150\u00a0г готового продукта.',
            seafood_plant: 'Замените часть мясного блюда рыбой, готовыми бобовыми, тофу, орехами или семенами.',
            fatty_acids_ratio: 'Замените часть продуктов с высоким содержанием насыщенных жиров рыбой, орехами, семенами или растительным маслом.',
            grains_refined: 'Замените часть белого хлеба, выпечки, белого риса или обычной пасты цельнозерновым вариантом.',
            sodium_g: 'Сократите досаливание и долю солёных соусов, сыров и готовых продуктов.',
            added_sugars_pct: 'Сократите сладкие напитки, сиропы, сладкую выпечку и десерты с добавленным сахаром.',
            sat_fats_pct: 'Замените часть жирных сыров, сливочного масла и жирного мяса источниками ненасыщенных жиров.'
        };
        return map[key] || 'Измените продукты, которые вносят основной вклад в этот показатель.';
    }
    function group(id, title, keys, headline, practical, reason, synergy) {
        return { id: id, title: title, keys: keys, headline: headline, practical: practical, reason: reason, synergy: synergy || 0 };
    }
    function candidateGroups(metrics) {
        var m = metrics, groups = [];
        var fruitBad = !m.fruits_total.achieved || !m.fruits_whole.achieved;
        if (fruitBad) {
            if (!m.fruits_total.achieved && !m.fruits_whole.achieved)
                groups.push(group('fruit', 'Фруктовая часть', 'fruits_total,fruits_whole'.split(','), 'Добавьте одну порцию цельных фруктов', 'Добавьте около 150\u00a0г фруктов целиком или ягод. Такой шаг улучшит одновременно показатели общего количества фруктов и доли цельных фруктов.', 'И общая фруктовая группа, и доля цельных фруктов пока ниже ориентира.', 2));
            else if (m.fruits_total.achieved && !m.fruits_whole.achieved)
                groups.push(group('fruit-whole', 'Цельные фрукты', ['fruits_whole'], 'Замените сок или пюре цельным фруктом', 'Замените сок или пюре фруктом целиком либо ягодами; увеличивать общее количество фруктов необязательно.', 'Общего количества фруктов достаточно, но вклад цельных фруктов остаётся ниже ориентира.', 1));
            else
                groups.push(group('fruit-total', 'Все фрукты', ['fruits_total'], 'Немного увеличьте фруктовую часть', 'Добавьте фрукт или ягоды, отдавая предпочтение цельным продуктам.', 'Цельные фрукты уже дают заметный вклад, но общего количества фруктов пока недостаточно.', 0));
        }
        if (!m.vegetables_total.achieved || !m.greens_beans.achieved) {
            if (!m.vegetables_total.achieved && !m.greens_beans.achieved)
                groups.push(group('veg', 'Овощная основа', ['vegetables_total', 'greens_beans'], 'Добавьте овощи, зелень или бобовые', 'Добавьте 130–150\u00a0г овощей. Часть порции можно составить из листовой зелени или готовых бобовых — это улучшит оба показателя.', 'И общее количество овощей, и вклад зелени с бобовыми пока ниже ориентира.', 2));
            else if (m.vegetables_total.achieved && !m.greens_beans.achieved)
                groups.push(group('greens', 'Зелень и бобовые', ['greens_beans'], 'Добавьте к овощной части зелень или бобовые', 'Общий объём овощей увеличивать необязательно: замените часть обычного гарнира листовой зеленью или готовыми бобовыми.', 'Общего количества овощей достаточно, однако зелень и бобовые представлены слабее.', 1));
            else
                groups.push(group('veg-total', 'Все овощи', ['vegetables_total'], 'Увеличьте долю овощей', 'Добавьте 130–150\u00a0г некрахмалистых овощей к одному из основных приёмов пищи.', 'Зелень и бобовые уже дают заметный вклад, но общего количества овощей пока недостаточно.', 0));
        }
        if (!m.grains_whole.achieved || !m.grains_refined.achieved) {
            if (!m.grains_whole.achieved && !m.grains_refined.achieved)
                groups.push(group('grains', 'Злаковая основа', ['grains_whole', 'grains_refined'], 'Замените очищенные злаки цельнозерновыми', 'Замените одну привычную порцию белого хлеба, выпечки, белого риса или обычной пасты на 80–100\u00a0г готовой цельной крупы либо цельнозерновой хлеб.', 'Одна замена одновременно уменьшит рафинированные злаки и увеличит цельные.', 3));
            else if (!m.grains_whole.achieved)
                groups.push(group('whole-grain', 'Цельные злаки', ['grains_whole'], 'Добавьте цельнозерновой продукт', 'Добавьте 80–100\u00a0г готовой гречки, овсянки, бурого риса или другую цельнозерновую основу.', 'Доля очищенных злаков находится в допустимом диапазоне, однако цельных злаков пока недостаточно.', 0));
            else
                groups.push(group('refined', 'Рафинированные злаки', ['grains_refined'], 'Сократите долю очищенных злаков', 'Замените часть белого хлеба, выпечки, белого риса или обычной пасты цельнозерновым вариантом.', 'Цельных злаков достаточно, однако доля рафинированных остаётся выше ориентира.', 1));
        }
        if (!m.protein_total.achieved || !m.seafood_plant.achieved) {
            if (!m.protein_total.achieved && !m.seafood_plant.achieved)
                groups.push(group('protein', 'Белковая часть', ['protein_total', 'seafood_plant'], 'Добавьте источник белка, полезный для обоих показателей', 'Добавьте порцию рыбы, готовых бобовых или тофу; такой выбор увеличит общий белковый вклад и долю рыбы с растительными источниками.', 'И общий вклад белковых продуктов, и доля рыбы с растительными источниками белка пока ниже ориентира.', 2));
            else if (m.protein_total.achieved && !m.seafood_plant.achieved)
                groups.push(group('protein-quality', 'Структура белковых продуктов', ['seafood_plant'], 'Измените источники белка, не увеличивая его общий объём', 'Общий объём белковых продуктов увеличивать не требуется: замените часть мяса рыбой, бобовыми, тофу, орехами или семенами.', 'Общий белковый компонент уже достиг ориентира, однако его состав можно улучшить.', 2));
            else
                groups.push(group('protein-total', 'Все белковые продукты', ['protein_total'], 'Немного увеличьте долю белковых продуктов', 'Добавьте порцию белкового блюда — примерно 80–150\u00a0г готового продукта.', 'Рыба и растительные источники белка уже дают заметный вклад, но общего количества белковых продуктов пока недостаточно.', 0));
        }
        if (!m.dairy.achieved)
            groups.push(group('dairy', 'Молочная группа', ['dairy'], 'Увеличьте вклад молочных продуктов или обогащённой альтернативы', 'Используйте 200–250\u00a0мл несладкого молочного продукта или подходящей обогащённой альтернативы. Если калорийность уже достаточна, замените этим продуктом другую позицию, а не добавляйте его к рациону.', 'Вклад молочных продуктов или сопоставимой обогащённой альтернативы ниже расчётного ориентира HEI.', 0));
        if (!m.sodium_g.achieved)
            groups.push(group('sodium', 'Натрий', ['sodium_g'], 'Сократите основные источники натрия', 'Сократите досаливание и долю солёных соусов, сыров, колбас и готовых продуктов.', 'Количество натрия относительно калорийности рациона выше благоприятного диапазона HEI.', 0));
        if (!m.added_sugars_pct.achieved)
            groups.push(group('sugar', 'Добавленный сахар', ['added_sugars_pct'], 'Сократите продукты с добавленным сахаром', 'Уменьшите сладкие напитки, сиропы, сладкую выпечку и десерты; природные сахара цельных фруктов сюда не относятся.', 'Доля энергии, поступающей из добавленного сахара, выше благоприятного диапазона HEI.', 0));
        if (!m.sat_fats_pct.achieved || !m.fatty_acids_ratio.achieved) {
            if (!m.sat_fats_pct.achieved && !m.fatty_acids_ratio.achieved)
                groups.push(group('fats', 'Качество жиров', ['sat_fats_pct', 'fatty_acids_ratio'], 'Замените часть насыщенных жиров ненасыщенными', 'Сократите часть жирных сыров, сливочного масла и жирного мяса, заменив их рыбой, орехами, семенами или растительным маслом.', 'Одна замена одновременно снизит насыщенные жиры и улучшит их соотношение с ненасыщенными.', 3));
            else if (!m.sat_fats_pct.achieved)
                groups.push(group('sat-fat', 'Насыщённые жиры', ['sat_fats_pct'], 'Снизьте долю насыщенных жиров', 'Замените часть жирных сыров, сливочного масла и жирного мяса более постными продуктами или источниками ненасыщенных жиров.', 'Доля энергии, поступающей из насыщенных жиров, выше благоприятного диапазона.', 1));
            else
                groups.push(group('fat-ratio', 'Соотношение жиров', ['fatty_acids_ratio'], 'Измените источники жиров, не сокращая их общее количество без необходимости', 'Замените часть продуктов с насыщенными жирами рыбой, орехами, семенами или растительным маслом.', 'Насыщённые жиры удерживаются в диапазоне, но соотношение жиров можно улучшить.', 1));
        }
        return groups;
    }
    function groupMetricText(group, metrics, field) {
        var parts = group.keys.map(function (k) { var m = metrics[k]; return LABELS[k] + ': ' + m[field + 'Text']; }).filter(Boolean);
        return parts.join('; ');
    }
    function buildPlan(model, rows) {
        var std = window.HEI && window.HEI.helpers && window.HEI.helpers.STD || {};
        var metrics = {};
        ORDER.forEach(function (k) { metrics[k] = componentMetric(k, model, std); });
        var candidates = candidateGroups(metrics).map(function (g) {
            g.lost = g.keys.reduce(function (s, k) { return s + metrics[k].lost; }, 0);
            g.minRatio = Math.min.apply(Math, g.keys.map(function (k) { return metrics[k].ratio; }));
            g.priorityScore = g.lost + g.synergy + (1 - g.minRatio) * 2;
            g.next = groupMetricText(g, metrics, 'next');
            g.target = groupMetricText(g, metrics, 'target');
            return g;
        }).sort(function (a, b) { return b.priorityScore - a.priorityScore || b.lost - a.lost; });
        var achieved = ORDER.filter(function (k) { return metrics[k].achieved; });
        var near = ORDER.filter(function (k) { return !metrics[k].achieved && metrics[k].near; });
        return { metrics: metrics, actions: candidates.slice(0, 3), allActions: candidates, achieved: achieved, near: near, rows: rows || [] };
    }
    function pointWord(v) { var n = Math.abs(Number(v) || 0); var i = Math.floor(n); if (Math.abs(n - i) > 1e-9)
        return 'балла'; var m10 = i % 10, m100 = i % 100; if (m10 === 1 && m100 !== 11)
        return 'балл'; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14))
        return 'балла'; return 'баллов'; }
    function componentWord(v) { var n = Math.abs(Math.floor(Number(v) || 0)), m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11)
        return 'компонент'; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14))
        return 'компонента'; return 'компонентов'; }
    function reachedText(v) { v = Math.floor(Number(v) || 0); return v + ' из 13 компонентов ' + (v === 1 ? 'достиг' : 'достигли') + ' ориентира'; }
    function attentionText(v) { v = Math.floor(Number(v) || 0); return v + ' ' + componentWord(v) + ' ' + (v === 1 ? 'требует' : 'требуют') + ' внимания'; }
    function actionCard(g, index) {
        var potential = fmt(g.lost, 1), potentialWord = pointWord(g.lost);
        return '<article class="hei-p1-action" data-priority="' + (index + 1) + '">' +
            '<div class="hei-p1-action-head"><span class="hei-p1-order">' + (index + 1) + '</span><div><small>' + esc(g.title) + '</small><h4>' + esc(g.headline) + '</h4></div><span class="hei-p1-potential">возможный прирост — до ' + esc(potential) + ' ' + potentialWord + '</span></div>' +
            '<p class="hei-p1-reason">' + esc(g.reason) + '</p>' +
            '<div class="hei-p1-step"><span>Практический шаг</span><strong>' + esc(g.practical) + '</strong></div>' +
            '<details class="hei-p1-calculation"><summary>Расчётный ориентир</summary><dl><div><dt>До следующего балла</dt><dd>' + esc(g.next || '—') + '</dd></div><div><dt>До полного ориентира</dt><dd>' + esc(g.target || '—') + '</dd></div><div><dt>Возможный прирост</dt><dd>до ' + esc(potential) + ' ' + potentialWord + ' по HEI</dd></div></dl></details>' +
            '</article>';
    }
    function componentAdvice(key, metric) {
        if (metric.achieved)
            return 'Ориентир достигнут. Дополнительная корректировка этого показателя сейчас не требуется.';
        return practicalByKey(key);
    }
    function componentCard(key, metric, open) {
        return '<details class="hei-p1-component ' + stateClass(metric) + '" data-hei-key="' + esc(key) + '"' + (open ? ' open' : '') + '><summary><span><strong>' + esc(LABELS[key] || key) + '</strong><small>' + esc(stateLabel(metric)) + '</small></span><b>' + esc(fmt(metric.pts, 1)) + ' из ' + esc(fmt(metric.max, 0)) + ' баллов</b></summary><div class="hei-p1-component-body"><p>' + esc(componentAdvice(key, metric)) + '</p>' +
            (!metric.achieved ? '<dl><div><dt>До следующего балла</dt><dd>' + esc(metric.nextText) + '</dd></div><div><dt>До полного ориентира</dt><dd>' + esc(metric.targetText) + '</dd></div></dl>' : '') +
            (key === 'fatty_acids_ratio' ? '<details class="hei-p1-method"><summary>Как считается соотношение жиров</summary><p>Показатель равен отношению суммы мононенасыщенных и полиненасыщенных жиров к насыщенным. Максимальный балл начисляется при значении 2,5 и выше.</p></details>' : '') +
            '</div></details>';
    }
    function tableActionHtml(key, metric) {
        if (metric.achieved)
            return '<span class="hei-p1-table-achieved">Ориентир достигнут. Дополнительная корректировка не требуется.</span>';
        return '<span class="hei-p1-table-line"><b>До следующего балла:</b> ' + esc(metric.nextText) + '</span><span class="hei-p1-table-line"><b>До полного ориентира:</b> ' + esc(metric.targetText) + '</span><span class="hei-p1-table-line"><b>Практический шаг:</b> ' + esc(practicalByKey(key)) + '</span>';
    }
    function updateTable(plan) {
        var tbody = document.getElementById('heiTableBody');
        if (!tbody)
            return;
        ORDER.forEach(function (key) {
            var row = tbody.querySelector('tr[data-hei-key="' + key + '"]');
            if (!row || row.children.length < 5)
                return;
            var m = plan.metrics[key];
            row.children[3].innerHTML = tableActionHtml(key, m);
            row.classList.remove('ok', 'warn', 'bad');
            row.classList.add(m.achieved ? 'ok' : (m.ratio < 0.4 ? 'bad' : 'warn'));
            row.setAttribute('data-hei-status', stateClass(m));
            if (key === 'added_sugars_pct')
                row.children[2].textContent = 'желательно ≤ ' + nbspUnit(m.orientation, 'г', 0);
            if (key === 'sat_fats_pct')
                row.children[2].textContent = 'желательно ≤ ' + nbspUnit(m.orientation, 'г', 0);
        });
    }
    function recommendationPlanSignature(plan) {
        try {
            var metricKeys = Object.keys(plan.metrics || {}).sort();
            return JSON.stringify({
                achieved: (plan.achieved || []).slice().sort(),
                actions: (plan.actions || []).map(function (a) { return { id: a.id || '', keys: (a.keys || []).slice().sort(), headline: a.headline || '', reason: a.reason || '', practical: a.practical || '', potential: a.potential || '' }; }),
                metrics: metricKeys.map(function (k) { var m = plan.metrics[k] || {}; return [k, !!m.achieved, Number(m.ratio) || 0, m.nextText || '', m.targetText || '']; })
            });
        }
        catch (_) { return ''; }
    }
    function render(model, rows) {
        if (!model || model.valid === false)
            return;
        var plan = buildPlan(model, rows);
        var levers = document.getElementById('heiLevers');
        var recs = document.getElementById('heiRecs');
        var planSignature = '';
        planSignature = recommendationPlanSignature(plan);
        if (planSignature && planSignature === window.__lastHEIRecommendationBaseSignature && levers && levers.querySelector('.hei-p1-start')) {
            window.__lastHEIRecommendationPlan = plan;
      window.__HEI_RECOMMENDATION_RENDER_STATS__=window.__HEI_RECOMMENDATION_RENDER_STATS__||{domWrites:0,skips:0};
      window.__HEI_RECOMMENDATION_RENDER_STATS__.skips+=1;
            return;
        }
        window.__lastHEIRecommendationBaseSignature = planSignature;
        window.__HEI_RECOMMENDATION_RENDER_STATS__ = window.__HEI_RECOMMENDATION_RENDER_STATS__ || { domWrites: 0, skips: 0 };
        window.__HEI_RECOMMENDATION_RENDER_STATS__.domWrites += 1;
        if (levers) {
            if (plan.actions.length) {
                levers.innerHTML = '<section class="hei-p1-start"><div class="hei-p1-heading"><div><span>Главные шаги</span><h3>С чего начать</h3></div><p>Сначала показаны действия, которые могут заметнее всего улучшить общий результат. Связанные показатели объединены, чтобы одна рекомендация не повторялась в нескольких карточках.</p></div><div class="hei-p1-actions">' + plan.actions.map(actionCard).join('') + '</div></section>';
            }
            else {
                levers.innerHTML = '<section class="hei-p1-start complete"><div class="hei-p1-heading"><div><span>Главные шаги</span><h3>Основные ориентиры достигнуты</h3></div><p>Сохраняйте сложившуюся структуру рациона. Обязательная корректировка по компонентам HEI сейчас не требуется.</p></div></section>';
            }
        }
        if (recs) {
            var achievedNames = plan.achieved.map(function (k) { return LABELS[k]; });
            var strengths = achievedNames.length ? '<section class="hei-p1-strengths"><div><span>Сильные стороны рациона</span><strong>' + esc(reachedText(achievedNames.length)) + '</strong></div><div class="hei-p1-chips">' + achievedNames.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div></section>' : '';
            var attention = ORDER.filter(function (k) { return !plan.metrics[k].achieved; });
            var attentionCards = attention.map(function (k, i) { return componentCard(k, plan.metrics[k], i === 0); }).join('');
            var achievedCards = plan.achieved.map(function (k) { return componentCard(k, plan.metrics[k], false); }).join('');
            recs.innerHTML = strengths + '<section class="hei-p1-all"><details class="hei-p1-all-fold"><summary><span><strong>Все компоненты HEI</strong><small>Откройте раздел, чтобы посмотреть расчёт, ориентир и рекомендацию по каждому показателю.</small></span><b>' + esc(attentionText(attention.length)) + '</b></summary><div class="hei-p1-groups">' +
                (attentionCards ? '<div class="hei-p1-group"><h4>Требуют внимания</h4>' + attentionCards + '</div>' : '') +
                (achievedCards ? '<div class="hei-p1-group achieved"><h4>Ориентиры достигнуты</h4>' + achievedCards + '</div>' : '') +
                '</div></details></section>';
        }
        updateTable(plan);
        window.__lastHEIRecommendationPlan = plan;
        try {
            window.dispatchEvent(new CustomEvent('hei:recommendations-updated', { detail: { plan: plan } }));
        }
        catch (_) { }
    }
    function injectStyles() {
        if (document.getElementById('heiRecommendationsCriticalPass1Styles'))
            return;
        var s = document.createElement('style');
        s.id = 'heiRecommendationsCriticalPass1Styles';
        s.textContent = '\
#heiLevers,#heiRecs{margin-top:14px}.hei-p1-start,.hei-p1-strengths,.hei-p1-all{border:1px solid #dbe5ef;border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.045)}\
.hei-p1-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:18px 20px 14px}.hei-p1-heading span,.hei-p1-strengths span{display:block;color:#356b94;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.hei-p1-heading h3{margin:3px 0 0;font-size:20px;color:#17283a}.hei-p1-heading p{max-width:620px;margin:0;color:#526579;font-size:13px;line-height:1.5}.hei-p1-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:0 14px 14px}.hei-p1-action{display:flex;flex-direction:column;min-width:0;border:1px solid #dbe5ef;border-radius:14px;background:#f8fbfe;padding:14px}.hei-p1-action-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:start}.hei-p1-order{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#176fa9;color:#fff;font-weight:900}.hei-p1-action-head small{display:block;color:#62758a;font-weight:700}.hei-p1-action h4{margin:2px 0 0;color:#17283a;font-size:15px;line-height:1.3}.hei-p1-potential{white-space:nowrap;border-radius:999px;background:#e8f3fa;color:#17618f;padding:4px 7px;font-size:11px;font-weight:800}.hei-p1-reason{margin:12px 0;color:#526579;font-size:13px;line-height:1.5}.hei-p1-step{margin-top:auto;border-left:3px solid #2d8b67;background:#f2faf6;border-radius:0 10px 10px 0;padding:10px 11px}.hei-p1-step span{display:block;color:#297358;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.hei-p1-step strong{display:block;margin-top:3px;color:#213a30;font-size:13px;line-height:1.45}.hei-p1-calculation{margin-top:10px}.hei-p1-calculation>summary{cursor:pointer;color:#466176;font-size:12px;font-weight:750}.hei-p1-calculation dl,.hei-p1-component dl{margin:9px 0 0}.hei-p1-calculation dl>div,.hei-p1-component dl>div{display:grid;grid-template-columns:130px minmax(0,1fr);gap:10px;padding:7px 0;border-top:1px solid #e6edf3}.hei-p1-calculation dt,.hei-p1-component dt{color:#6a7c8d;font-size:11px}.hei-p1-calculation dd,.hei-p1-component dd{margin:0;color:#283e52;font-size:12px;line-height:1.4}.hei-p1-strengths{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:15px 18px}.hei-p1-strengths strong{display:block;margin-top:3px;color:#214333}.hei-p1-chips{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.hei-p1-chips span{border:1px solid #cde5d8;border-radius:999px;background:#f2faf6;color:#27684f;padding:5px 8px;font-size:11px;font-weight:750}.hei-p1-all{margin-top:12px;overflow:hidden}.hei-p1-all-fold>summary{display:flex;justify-content:space-between;gap:16px;cursor:pointer;padding:16px 18px;list-style:none}.hei-p1-all-fold>summary::-webkit-details-marker{display:none}.hei-p1-all-fold>summary span strong,.hei-p1-all-fold>summary span small{display:block}.hei-p1-all-fold>summary span small{margin-top:3px;color:#657789;font-weight:500}.hei-p1-all-fold>summary>b{align-self:center;border-radius:999px;background:#fff3df;color:#86560d;padding:6px 9px;font-size:11px}.hei-p1-groups{padding:0 14px 14px}.hei-p1-group h4{margin:8px 2px;color:#344b5f;font-size:13px}.hei-p1-component{margin:7px 0;border:1px solid #dfe7ee;border-radius:11px;background:#fff}.hei-p1-component>summary{display:flex;justify-content:space-between;gap:12px;cursor:pointer;padding:11px 12px;list-style:none}.hei-p1-component>summary::-webkit-details-marker{display:none}.hei-p1-component>summary span strong,.hei-p1-component>summary span small{display:block}.hei-p1-component>summary span small{margin-top:2px;color:#6a7c8e;font-size:11px}.hei-p1-component>summary>b{font-size:12px;color:#40566b}.hei-p1-component.priority{border-left:4px solid #c55353}.hei-p1-component.attention{border-left:4px solid #d59424}.hei-p1-component.near{border-left:4px solid #6b94b2}.hei-p1-component.achieved{border-left:4px solid #3f936e;background:#fbfefc}.hei-p1-component-body{padding:0 12px 12px}.hei-p1-component-body>p{margin:2px 0 8px;color:#40566b;font-size:13px;line-height:1.5}.hei-p1-method{margin-top:9px}.hei-p1-method summary{cursor:pointer;color:#315f82;font-size:12px;font-weight:750}.hei-p1-table-line{display:block;margin:3px 0;line-height:1.42}.hei-p1-table-line b{color:#41586c}.hei-p1-table-achieved{color:#287052;font-weight:650}\
@media(max-width:900px){.hei-p1-heading{display:block}.hei-p1-heading p{margin-top:8px}.hei-p1-actions{grid-template-columns:1fr}.hei-p1-strengths{display:block}.hei-p1-chips{justify-content:flex-start;margin-top:10px}.hei-p1-action-head{grid-template-columns:auto minmax(0,1fr)}.hei-p1-potential{grid-column:2;justify-self:start}.hei-p1-calculation dl>div,.hei-p1-component dl>div{grid-template-columns:1fr;gap:2px}.hei-p1-all-fold>summary{align-items:flex-start}.hei-p1-all-fold>summary>b{white-space:nowrap}}\
@media print{.hei-p1-calculation,.hei-p1-all-fold{display:block!important}.hei-p1-calculation>summary,.hei-p1-all-fold>summary{list-style:none}.hei-p1-actions{grid-template-columns:1fr 1fr}.hei-p1-action{break-inside:avoid}.hei-p1-component{break-inside:avoid}}';
        document.head.appendChild(s);
    }
    var busy = false, refreshTimer = 0;
    function refresh() {
        if (busy)
            return;
        var model = window.__lastHEIModel, rows = window.__lastHEIRows;
        if (!model || model.valid === false)
            return;
        busy = true;
        try {
            render(model, rows);
        }
        finally {
            busy = false;
        }
    }
    function scheduleRefresh(delay) { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, delay == null ? 90 : delay); }
    function init() { injectStyles(); window.addEventListener('hei:rendered', function () { scheduleRefresh(90); }); setTimeout(function () { scheduleRefresh(0); }, 300); setTimeout(function () { scheduleRefresh(0); }, 1000); }
    window.HEIRecommendationPass1 = { version: VERSION, componentMetric: componentMetric, buildPlan: buildPlan, render: render, refresh: refresh };
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
