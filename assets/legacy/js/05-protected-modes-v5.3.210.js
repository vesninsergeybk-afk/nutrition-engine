/* Nutrition Calculator v5.3.210-p0.3.2.1 — legacy protected-mode fail-closed gate.
 * The fully validated protected-mode calculation runs only in the primary runtime.
 * Older compatibility browsers may use standard factual ration analysis, but must
 * not execute pregnancy, lactation, ED-risk or clinician-supervised calculations.
 */
(function (w, d) {
    'use strict';
    var CLINICAL = { preop: 1, postop: 1, icu: 1, ckd: 1, dialysis: 1, oncology: 1 };
    var GUARDED = { pregnancy: 1, lactation: 1, ed_risk: 1, medical_restriction: 1 };
    function byId(id) { return d.getElementById(id); }
    function value(id, fallback) { var el = byId(id); return el ? String(el.value || '') : (fallback || ''); }
    function checked(id) { var el = byId(id); return !!(el && el.checked); }
    function isProtected() {
        return !!CLINICAL[value('needs_state', 'normal')] ||
            !!GUARDED[value('needs_guardrail', 'none')] ||
            checked('needs_additional_ed_risk') ||
            checked('needs_additional_medical_restriction') ||
            checked('needs_additional_clinical_conditions');
    }
    function render() {
        var root = byId('needsProtectedModeContext');
        var status = byId('needsProtectedModeStatus');
        if (!root || !status) return;
        if (isProtected()) {
            root.open = true;
            status.className = 'alert alert-danger';
            status.innerHTML = '<strong>Защищённый режим требует основного runtime</strong><div class="small" style="margin-top:4px;">Обновите браузер или откройте калькулятор в актуальной версии Chrome, Edge, Firefox или Safari. В compatibility-runtime автоматический расчёт этого профиля намеренно заблокирован.</div>';
        }
    }
    function blockProtectedCalculation(event) {
        var target = event && event.target;
        while (target && target !== d && target.id !== 'needs_calc_btn') target = target.parentNode;
        if (!target || target.id !== 'needs_calc_btn' || !isProtected()) return;
        if (event.preventDefault) event.preventDefault();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        else if (event.stopPropagation) event.stopPropagation();
        render();
        var out = byId('needs_out');
        if (out) out.innerHTML = '<div class="alert alert-danger"><strong>Расчёт защищённого профиля остановлен.</strong><div class="small" style="margin-top:4px;">Compatibility-runtime не сертифицирован для беременности, лактации, риска РПП, медицинских ограничений и клинических состояний. Фактический анализ уже введённого рациона остаётся доступен.</div></div>';
    }
    function policy() {
        var active = isProtected();
        return {
            version: 'v5.3.210-p0.3.2.1-legacy-fail-closed',
            protectedMode: active,
            status: active ? 'blocked' : 'standard',
            calculationAllowed: !active,
            goalFactorAllowed: !active,
            normsSyncAllowed: !active,
            mealSplitAllowed: !active,
            automaticPlannerAllowed: !active,
            geminiAllowed: !active,
            localRecommendationsAllowed: !active,
            fluidEstimateAllowed: !active,
            primaryReason: active ? 'Защищённый профиль заблокирован в compatibility-runtime.' : ''
        };
    }
    w.ProtectedModesP03 = {
        version: 'v5.3.210-p0.3.2.1-legacy-fail-closed',
        currentPolicy: policy,
        evaluate: policy,
        renderUi: render,
        isClinicalState: function (state) { return !!CLINICAL[String(state || '')]; }
    };
    function init() {
        d.addEventListener('click', blockProtectedCalculation, true);
        d.addEventListener('change', render, true);
        d.addEventListener('input', render, true);
        render();
    }
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init, false);
    else init();
})(window, document);
