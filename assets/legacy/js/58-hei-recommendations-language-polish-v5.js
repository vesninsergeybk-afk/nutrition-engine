// nutrition calculator v5.3.115_hei_recommendations_regression_hardening
// Responsibility: final Russian-language typography, readable hierarchy and language regression checks for HEI recommendations.
(function () {
    'use strict';
    var VERSION = 'v5.3.115_hei_recommendations_regression_hardening';
    window.__V53115_HEI_RECOMMENDATIONS_LANGUAGE_REGRESSION_HARDENING__ = VERSION;
    function normalizeText(value) {
        return String(value == null ? '' : value)
            .replace(/(\d)\s*[-–]\s*(\d)/g, '$1–$2')
            .replace(/(\d)\s+(г|мг|мл|ккал|%)/gi, '$1\u00a0$2')
            .replace(/\s+([,.;:!?])/g, '$1')
            .replace(/ {2,}/g, ' ')
            .replace(/\bHEI\s*[-—]\s*/g, 'HEI — ');
    }
    function polishTextNodes(root) {
        if (!root || !document.createTreeWalker)
            return;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
        while ((n = walker.nextNode()))
            nodes.push(n);
        nodes.forEach(function (node) {
            if (!node.parentNode || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(node.parentNode.nodeName))
                return;
            var next = normalizeText(node.nodeValue);
            if (next !== node.nodeValue)
                node.nodeValue = next;
        });
    }
    function polish() {
        ['heiLevers', 'heiRecs', 'heiTableBody'].forEach(function (id) { polishTextNodes(document.getElementById(id)); });
        var details = document.querySelectorAll('#heiLevers details,#heiRecs details');
        for (var i = 0; i < details.length; i++)
            if (details[i].getAttribute('data-hei-language-polished') !== 'true') details[i].setAttribute('data-hei-language-polished', 'true');
    }
    function languageAudit(text) {
        text = String(text || '');
        var issues = [], lines = text.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
        var rules = [
            [/\bОК\b/i, 'разговорный статус «ОК»'],
            [/\d\s*\/\s*\d/, 'техническая запись баллов через косую черту'],
            [/(?:~|≈)\s*[+−-]?\d/, 'смешанное обозначение приблизительности'],
            [/\/(?:сут|нед)\b|\bр\/нед\b/i, 'сокращение периода через косую черту'],
            [/Ориентировочный объём\s*[—-]\s*(?:возрастную|одну|порцию|объём)/i, 'грамматически несогласованная подпись количества'],
            [/\s{2,}/, 'повторяющиеся пробелы']
        ];
        rules.forEach(function (r) { if (r[0].test(text))
            issues.push(r[1]); });
        if (lines.some(function (line) { return /^(?:добавить|заменить|сократить|увеличить|изменить)(?=\s|[.,;:!?—-]|$)/i.test(line); }))
            issues.push('заголовок в неопределённой форме');
        return issues.filter(function (x, i, a) { return a.indexOf(x) === i; });
    }
    function semanticAudit(plan) {
        var issues = [];
        if (!plan)
            return issues;
        (plan.actions || []).forEach(function (a) {
            var t = String(a.personalPractical || ''), b = String(a.operationBadge || '');
            if (/^(?:Замените|Перераспределите|Не увеличивая)(?=\s|[.,;:!?—-]|$)/.test(t) && b !== 'Выбрана замена')
                issues.push('метка действия не соответствует замене');
            if (/^(?:Уменьшите|Сократите|Снизьте)(?=\s|[.,;:!?—-]|$)/.test(t) && b !== 'Выбрано сокращение')
                issues.push('метка действия не соответствует сокращению');
            if (/^(?:Добавьте|Увеличьте)(?=\s|[.,;:!?—-]|$)/.test(t) && b !== 'Выбрано добавление')
                issues.push('метка действия не соответствует добавлению');
        });
        if (plan.energy && plan.energy.mode === 'cautious') {
            (plan.actions || []).forEach(function (a) {
                if (/При цели снижения массы|Выбрано сокращение|Выбрана замена/.test(String(a.profileNote || '') + ' ' + String(a.operationBadge || '')))
                    issues.push('защитный сценарий содержит ограничительную рекомендацию');
            });
        }
        return issues.filter(function (x, i, a) { return a.indexOf(x) === i; });
    }
    function runSelfTest() {
        var text = ['heiLevers', 'heiRecs'].map(function (id) { var x = document.getElementById(id); return x ? x.innerText : ''; }).join('\n');
        var issues = languageAudit(text), headings = document.querySelectorAll('#heiLevers .hei-p1-action h4');
        for (var i = 0; i < headings.length; i++)
            if (!/^(?:Добавьте|Замените|Сократите|Увеличьте|Измените|Начните|Пересмотрите|Снизьте|Рассматривайте|Сверьте)(?=\s|[.,;:!?—-]|$)/.test(headings[i].textContent.trim()))
                issues.push('заголовок рекомендации не начинается с прямого действия');
        issues = issues.concat(semanticAudit(window.__lastHEIRecommendationPlanPersonalized)).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return { ok: issues.length === 0, version: VERSION, issues: issues, textLength: text.length, headingsChecked: headings.length };
    }
    function injectStyles() {
        if (document.getElementById('heiRecommendationsLanguagePass3Styles'))
            return;
        var s = document.createElement('style');
        s.id = 'heiRecommendationsLanguagePass3Styles';
        s.textContent = '\
#heiLevers,#heiRecs{font-kerning:normal}.hei-p1-heading span,.hei-p1-strengths span,.hei-p1-step span,.hei-p2-grounding p>span,.hei-p2-component-context>span,.hei-p2-profile-context>span{text-transform:none!important;letter-spacing:.01em!important}.hei-p1-heading span,.hei-p1-strengths span{font-size:12px!important}.hei-p1-action h4{font-size:16px;line-height:1.35}.hei-p1-reason,.hei-p1-step strong,.hei-p2-grounding p,.hei-p2-component-context p{max-width:68ch}.hei-p1-potential{white-space:normal;text-align:center;line-height:1.25}.hei-p1-calculation dd,.hei-p1-component dd,.hei-p1-component>summary>b{font-variant-numeric:tabular-nums}.hei-p1-component>summary>b{white-space:nowrap}.hei-p1-component-body>p{max-width:76ch}.hei-p2-badges b,.hei-p2-badges em,.hei-p2-profile-context b{font-size:11px;line-height:1.35}.hei-p1-table-line{max-width:78ch}@media(max-width:900px){.hei-p1-heading h3{font-size:19px}.hei-p1-action h4{font-size:15px}.hei-p1-potential{text-align:left}.hei-p1-component>summary{align-items:flex-start}.hei-p1-component>summary>b{font-size:11px}}@media print{.hei-p1-reason,.hei-p1-step strong,.hei-p2-grounding p,.hei-p2-component-context p{max-width:none}}';
        document.head.appendChild(s);
    }
    var timer = 0;
    function schedule() { clearTimeout(timer); timer = setTimeout(polish, 20); }
    function init() { injectStyles(); ['hei:recommendations-updated', 'hei:recommendations-personalized', 'hei:rendered', 'app:ready'].forEach(function (n) { window.addEventListener(n, schedule); }); setTimeout(polish, 500); setTimeout(polish, 1400); }
    window.HEIRecommendationLanguagePass3 = { version: VERSION, normalizeText: normalizeText, languageAudit: languageAudit, semanticAudit: semanticAudit, polish: polish, runSelfTest: runSelfTest };
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init, { once: true });
    else
        init();
})();
