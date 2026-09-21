// nutrition calculator v5.3.150 — isolated retro print/PDF presentation adapter
(function () {
    'use strict';
    var VERSION = 'v5.3.157_retro_2bit_pdf_visual_pass3';
    var ids = { needs_print_btn: 'needs', needs_pdf_btn: 'needs', printRationBtn: 'ration', exportRationPdfBtn: 'ration', heiPdfBtn: 'hei', printTotalsBtn: 'totals', exportTotalsPdfBtn: 'totals', printAllBtn: 'all', exportAllPdfBtn: 'all' };
    function retro() { return document.documentElement.getAttribute('data-theme') === 'retro-2bit'; }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function clean(node) {
        if (!node)
            return null;
        var c = node.cloneNode(true);
        c.querySelectorAll('button,.toolbar,.theme-switcher,.dev-only,script,#runtimeBootStatusOverlay').forEach(function (n) { n.remove(); });
        c.querySelectorAll('details').forEach(function (d) { d.setAttribute('open', ''); });
        c.querySelectorAll('input,select,textarea').forEach(function (el) { var sp = document.createElement('span'); sp.className = 'pdf-field-value'; sp.textContent = el.tagName === 'SELECT' && el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].textContent : (el.value || ''); el.replaceWith(sp); });
        return c;
    }
    function css() { return `@page{size:A4;margin:10mm}html,body{color:#111;background:#f4f4ef;font-family:ui-monospace,"SFMono-Regular",Consolas,"Liberation Mono",monospace;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{margin:0;padding:0;font-size:11px;line-height:1.34}h1{font-size:18px;margin:0 0 6px;padding:6px 8px;border:3px solid #111;background:#b8b8b8}h2{font-size:15px;margin:12px 0 7px;padding-bottom:4px;border-bottom:3px double #111}h3{font-size:11px}.retro-meta{font-size:12px;margin:3px 0;color:#4a4a4a}.retro-print-note{padding:8px;border:2px dashed #111;background:#f4f4ef;margin:10px 0}.pdf-section,.card,.section,.tile,.total-card,details,.alert{break-inside:avoid;border:2px solid #111!important;border-radius:0!important;background:#f4f4ef!important;box-shadow:none!important;padding:8px;margin:7px 0;color:#111!important}.nr-section{break-inside:auto!important;page-break-inside:auto!important;border:2px solid #111!important;border-radius:0!important;background:#f4f4ef!important;box-shadow:none!important;padding:8px!important;margin:7px 0!important;color:#111!important}details>summary{list-style:none;border-bottom:1px solid #4a4a4a;padding-bottom:4px;font-weight:900}table{width:100%;border-collapse:collapse}th{color:#f4f4ef!important;background:#111!important;border:1px solid #111!important;padding:4px 5px!important;font-size:10px!important;line-height:1.22!important}td{color:#111!important;background:#f4f4ef!important;border:1px solid #4a4a4a!important;padding:4px 5px!important;font-size:10px!important;line-height:1.22!important}tbody tr:nth-child(even) td{background:#b8b8b8!important}.progress,[class*="track"],[class*="meter"]{border:1px solid #111!important;border-radius:0!important;background:#f4f4ef!important}.bar,[class*="fill"]{background:#4a4a4a!important}.muted,small{color:#4a4a4a!important}button,.toolbar,.theme-switcher,.retro-print-note{display:none!important}svg,canvas,img{filter:grayscale(1) contrast(1.18)}.nr-report,.nr-report *{color:#111!important;border-color:#111!important;box-shadow:none!important}.nr-report *{background-color:transparent!important;background-image:none!important}.nr-report,.nr-cover,.nr-executive-summary,.nr-first-action,.nr-confidence-split>div,.nr-kv,.nr-score,.nr-list-block,.nr-quality,.nr-personal-card,.nr-nutrient-action{color:#111!important;background:#f4f4ef!important;border-color:#111!important;border-radius:0!important;box-shadow:none!important}.nr-kicker,.nr-exec-item span,.nr-priority-card span,.nr-first-action-head span,.nr-confidence-split span,.nr-note,.nr-muted,.nr-kv span{color:#4a4a4a!important}.nr-exec-item,.nr-priority-card{background:#b8b8b8!important;border:2px solid #111!important;border-radius:0!important}.nr-first-action{border-width:3px!important}.nr-static-matrix{filter:none!important;background:#f4f4ef!important}.nr-static-matrix .nr-matrix-frame,.nr-static-matrix .nr-matrix-label-bg{fill:#f4f4ef!important;stroke:#111!important}.nr-static-matrix .nr-matrix-zone-both{fill:#f4f4ef!important}.nr-static-matrix .nr-matrix-zone-structure{fill:#b8b8b8!important}.nr-static-matrix .nr-matrix-zone-quality{fill:#b8b8b8!important}.nr-static-matrix .nr-matrix-zone-strong{fill:#4a4a4a!important}.nr-static-matrix .nr-matrix-grid,.nr-static-matrix .nr-matrix-plot-border,.nr-static-matrix .nr-matrix-threshold{stroke:#111!important}.nr-static-matrix .nr-matrix-halo{fill:#b8b8b8!important;fill-opacity:1!important}.nr-static-matrix .nr-matrix-point{fill:#111!important;stroke:#f4f4ef!important}.nr-static-matrix text{fill:#111!important}.nr-harvard-svg{filter:grayscale(1) contrast(1.6)!important}@media print{.retro-print-note{display:none!important}}`; }
    function inject(html) {
        html = String(html || '');
        if (!html)
            return html;
        html = html.replace(/<html(?![^>]*data-theme)/i, '<html data-theme="retro-2bit"');
        var style = '<style data-retro-print-export="v1">' + css() + '</style>';
        return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, style + '</head>') : style + html;
    }
    function sectionNode(kind) {
        var id = { needs: 'needsCompact', ration: 'rationSection', hei: 'heiPanel', totals: 'totalsSection' }[kind];
        return id ? document.getElementById(id) : null;
    }
    function title(kind) { return { needs: 'Расчёт потребностей', ration: 'Итоговый рацион', hei: 'HEI-2020', totals: 'Итоги и дневные нормы', all: 'Сводный отчёт по рациону' }[kind] || 'Отчёт'; }
    function fallbackBody(kind) {
        if (kind === 'all') {
            return ['needs', 'ration', 'hei', 'totals'].map(function (k) { var c = clean(sectionNode(k)); return c ? '<section class="pdf-section"><h2>' + esc(title(k)) + '</h2>' + c.outerHTML + '</section>' : ''; }).join('');
        }
        var c = clean(sectionNode(kind));
        return c ? '<section class="pdf-section">' + c.outerHTML + '</section>' : '<p>Раздел не найден.</p>';
    }
    function fullDocument(kind) {
        if (kind === 'all' && window.NutritionReportV5 && typeof window.NutritionReportV5.getReportHtml === 'function') {
            try {
                return inject(window.NutritionReportV5.getReportHtml({ force: true, mode: 'retro-pdf-native' }));
            }
            catch (_) { }
        }
        var name = (document.getElementById('needs_person_name') || {}).value || '';
        return '<!doctype html><html data-theme="retro-2bit"><head><meta charset="utf-8"><title>' + esc(title(kind)) + '</title><style>' + css() + '</style></head><body><h1>' + esc(title(kind)) + '</h1>' + (name ? '<div class="retro-meta"><strong>Пациент:</strong> ' + esc(name) + '</div>' : '') + '<div class="retro-meta"><strong>Дата:</strong> ' + esc(new Date().toLocaleString('ru-RU')) + '</div><div class="retro-print-note">В системном диалоге можно выбрать печать или сохранение в PDF.</div>' + fallbackBody(kind) + '</body></html>';
    }
    function open(kind) {
        var w = window.open('', '_blank', 'width=1020,height=920,scrollbars=yes');
        if (!w) {
            alert('Разрешите всплывающие окна для печати или сохранения PDF.');
            return false;
        }
        var html = fullDocument(kind).replace(/<\/body>/i, '<script>window.onload=function(){setTimeout(function(){try{window.focus();window.print()}catch(e){}},250)};</script></body>');
        w.document.open();
        w.document.write(html);
        w.document.close();
        try {
            w.focus();
        }
        catch (_) { }
        try {
            window.__LAST_RETRO_PRINT_EXPORT__ = { kind: kind, at: new Date().toISOString(), version: VERSION };
        }
        catch (_) { }
        return true;
    }
    document.addEventListener('click', function (e) {
        if (!retro())
            return;
        var hit = e.target && e.target.closest ? e.target.closest(Object.keys(ids).map(function (id) { return '#' + id; }).join(',')) : null;
        if (!hit)
            return;
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation)
            e.stopImmediatePropagation();
        open(ids[hit.id]);
    }, true);
    window.NutritionRetroPrintV1 = { version: VERSION, open: open, buildDocument: fullDocument, inject: inject, css: css };
})();
