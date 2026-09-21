// nutrition calculator v5.3.36_pdf_export_safe_buttons
// Safe PDF export buttons: uses the browser's native print-to-PDF dialog when html2pdf is absent or unreliable.
(function(){
  'use strict';
  var VERSION = 'v5.3.67_child_weight_diet_guardrails_pass';
  window.__V5326_PDF_EXPORT_SAFE_BUTTONS__ = VERSION;

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>'"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function text(node){ return node ? String(node.textContent || '').trim() : ''; }
  function patientName(){ var el=$('needs_person_name'); return el && el.value ? el.value.trim() : ''; }
  function stamp(){ return new Date().toLocaleString('ru-RU'); }
  function expandDetailsHtml(html){
    return String(html || '').replace(/<details([^>]*)>/gi, function(m, attrs){ return /\bopen\b/i.test(attrs) ? '<details' + attrs + '>' : '<details' + attrs + ' open>'; });
  }
  function cleanClone(node){
    if (!node || !node.cloneNode) return null;
    var clone = node.cloneNode(true);
    clone.querySelectorAll('button,.toolbar,#totalsActions,.harvard-plate-actions,.hpapply-actions,.dev-only,.hosting-test-panel,.a11y-audit-panel,script').forEach(function(n){ try{ n.remove(); }catch(_){} });
    clone.querySelectorAll('details').forEach(function(d){ try{ d.setAttribute('open',''); }catch(_){} });
    clone.querySelectorAll('input,select,textarea').forEach(function(el){
      try {
        var span = document.createElement('span');
        if (el.tagName === 'SELECT') span.textContent = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].textContent : el.value;
        else span.textContent = el.value || '';
        span.className = 'pdf-field-value';
        el.parentNode && el.parentNode.replaceChild(span, el);
      } catch(_) {}
    });
    return clone;
  }
  function section(title, bodyHtml){
    return '<section class="pdf-section"><h2>'+esc(title)+'</h2>'+bodyHtml+'</section>';
  }
  function needsHtml(){
    var out=$('needs_out');
    var body = out ? expandDetailsHtml(out.innerHTML) : '<p>Расчёт потребностей не найден.</p>';
    return section('Расчёт потребностей', body);
  }
  function totalsHtml(){
    var node = $('totalsSection') || $('totals');
    var clone = cleanClone(node);
    return clone ? section('Итоги и дневные нормы', clone.outerHTML) : '';
  }
  function rationHtml(){
    var node = $('rationSection');
    var clone = cleanClone(node);
    return clone ? section('Итоговый рацион', clone.outerHTML) : '';
  }
  function heiHtml(){
    var node = $('heiPanel');
    var clone = cleanClone(node);
    return clone ? section('HEI-2020', clone.outerHTML) : '';
  }
  function reportHtml(kind){
    if (kind === 'needs') return needsHtml();
    if (kind === 'totals') return totalsHtml() || '<p>Секция итогов не найдена.</p>';
    if (kind === 'hei') return heiHtml() || '<p>Секция HEI не найдена.</p>';
    if (kind === 'all') return [needsHtml(), totalsHtml(), rationHtml(), heiHtml()].filter(Boolean).join('');
    return '<p>Раздел не найден.</p>';
  }
  function titleFor(kind){
    if (kind === 'needs') return 'PDF: расчёт потребностей';
    if (kind === 'totals') return 'PDF: итоги и дневные нормы';
    if (kind === 'hei') return 'PDF: HEI-2020';
    return 'PDF: сводный отчёт';
  }
  function openNativePdf(kind){
    var w = window.open('', '_blank', 'width=1020,height=920,scrollbars=yes');
    if (!w) { alert('Разрешите всплывающие окна: PDF формируется через системный диалог печати.'); return false; }
    if (kind === 'all' && window.NutritionReportV5 && typeof window.NutritionReportV5.getReportHtml === 'function') {
      try {
        var fullHtml = window.NutritionReportV5.getReportHtml({ force:true, mode:'pdf-native' });
        var auto = '<script>window.onload=function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},250)};<\/script>';
        if (/<\/body>/i.test(fullHtml)) fullHtml = fullHtml.replace(/<\/body>/i, auto + '</body>'); else fullHtml += auto;
        w.document.open(); w.document.write(fullHtml); w.document.close();
        try { w.focus(); } catch(_) {}
        try { window.__LAST_NATIVE_PDF_EXPORT__ = { kind:kind, at:new Date().toISOString(), version:VERSION, source:'NutritionReportV5' }; } catch(_) {}
        return true;
      } catch(err) {
        try { console.warn('[NutritionPdfExportSafe] report builder fallback failed', err); } catch(_) {}
      }
    }
    var name = patientName();
    var head = '<h1>'+esc(titleFor(kind).replace(/^PDF:\s*/,''))+'</h1>' +
      (name ? '<div class="pdf-meta"><strong>Пациент:</strong> '+esc(name)+'</div>' : '') +
      '<div class="pdf-meta"><strong>Дата и время:</strong> '+esc(stamp())+'</div>' +
      '<div class="pdf-note">Для сохранения файла выберите в диалоге печати «Сохранить в PDF». Кнопки управления скрыты из печатной версии.</div>';
    var styles = '<style>' +
      '@media print{@page{size:A4;margin:14mm;} .pdf-note{display:none!important;} body{background:#fff!important;} details>summary{list-style:none;}}' +
      'body{margin:0;padding:16px 18px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;line-height:1.45;background:#fff;}' +
      'h1{font-size:22px;margin:0 0 10px;color:#0b61d6;} h2{font-size:17px;margin:18px 0 10px;color:#0b61d6;} h3{font-size:14px;margin:12px 0 6px;color:#123b64;}' +
      '.pdf-meta{font-size:13px;margin:3px 0;color:#334155}.pdf-note{margin:12px 0;padding:10px 12px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:13px;}' +
      '.pdf-section{break-inside:avoid;margin:0 0 18px;} .card,.section,.tile,.total-card,details.fold,.alert{break-inside:avoid;border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:10px;margin:8px 0;box-shadow:none!important;}' +
      '.kpi,.totals-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0;} .tile .title{font-size:12px;color:#475569}.tile .value{font-size:17px;font-weight:800;color:#0f172a;}' +
      'table,.tbl{width:100%;border-collapse:collapse;margin:8px 0;} th,td{border-bottom:1px solid #e2e8f0;padding:6px 7px;text-align:left;font-size:12px;vertical-align:top;} th{background:#f8fafc;color:#123b64;}' +
      'details{break-inside:avoid;} details>summary{font-weight:800;color:#0b61d6;margin-bottom:8px;}.small,.muted,.pdf-field-value{color:#475569;font-size:12px;}' +
      '.progress{height:10px;border-radius:999px;background:#e9f2fb;overflow:hidden}.bar{height:100%;background:#5AA9E6}.bar.warn{background:#F59E0B}.bar.danger{background:#EF4444}' +
      '</style>';
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(titleFor(kind))+'</title>'+styles+'</head><body>'+head+reportHtml(kind)+'<script>window.onload=function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},250)};<\/script></body></html>';
    w.document.open(); w.document.write(html); w.document.close();
    try { w.focus(); } catch(_) {}
    try { window.__LAST_NATIVE_PDF_EXPORT__ = { kind:kind, at:new Date().toISOString(), version:VERSION }; } catch(_) {}
    return true;
  }
  function kindFromTarget(t){
    var hit = t && t.closest ? t.closest('#needs_pdf_btn,#exportTotalsPdfBtn,#heiPdfBtn,#exportAllPdfBtn') : null;
    if (!hit) return '';
    if (hit.id === 'needs_pdf_btn') return 'needs';
    if (hit.id === 'exportTotalsPdfBtn') return 'totals';
    if (hit.id === 'heiPdfBtn') return 'hei';
    if (hit.id === 'exportAllPdfBtn') return 'all';
    return '';
  }
  function onClick(e){
    var kind = kindFromTarget(e.target);
    if (!kind) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    openNativePdf(kind);
  }
  function improveLabels(){
    var labels = {
      needs_pdf_btn:'Сохранить PDF',
      exportTotalsPdfBtn:'Сохранить PDF',
      heiPdfBtn:'Сохранить PDF',
      exportAllPdfBtn:'Сохранить PDF'
    };
    Object.keys(labels).forEach(function(id){ var b=$(id); if (b) { b.textContent = labels[id]; b.setAttribute('type','button'); b.setAttribute('title','Открыть печатную версию и сохранить через системный диалог PDF'); } });
  }
  function init(){
    improveLabels();
    document.addEventListener('click', onClick, true);
    setTimeout(improveLabels, 600);
    setTimeout(improveLabels, 1600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();

  window.NutritionPdfExportSafe = { openNativePdf:openNativePdf, version:VERSION };
})();
