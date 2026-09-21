// nutrition calculator v5.2.23_mobile_first_pass
// Module: 32-performance-selftest-v5.js
// Responsibility: lightweight in-browser performance diagnostics for ?perf=1.
(function(){
  'use strict';
  var VERSION = 'v5.2.23_mobile_first_pass';
  function fmtBytes(n){ n=Number(n)||0; if(n>1048576) return (n/1048576).toFixed(2)+' МБ'; if(n>1024) return (n/1024).toFixed(1)+' КБ'; return n+' Б'; }
  function byName(name){ return (performance.getEntriesByType('resource') || []).filter(function(r){ return String(r.name||'').indexOf(name) >= 0; }); }
  function collect(){
    var nav = performance.getEntriesByType('navigation')[0] || null;
    var resources = performance.getEntriesByType('resource') || [];
    var totalTransfer = resources.reduce(function(a,r){ return a + (Number(r.transferSize)||0); },0);
    var js = resources.filter(function(r){ return /\.js(\?|$)/.test(r.name||''); });
    var css = resources.filter(function(r){ return /\.css(\?|$)/.test(r.name||''); });
    var json = resources.filter(function(r){ return /products\.|formula-registry|\.json(\?|$)/.test(r.name||''); });
    var images = resources.filter(function(r){ return /\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(r.name||''); });
    var top = resources.slice().sort(function(a,b){ return (Number(b.transferSize)||0) - (Number(a.transferSize)||0); }).slice(0,10).map(function(r){ return { name:String(r.name||'').split('/').slice(-2).join('/'), transferSize:Number(r.transferSize)||0, duration:Math.round(Number(r.duration)||0) }; });
    return {
      version: VERSION,
      nav_load_ms: nav ? Math.round(nav.loadEventEnd || nav.duration || 0) : null,
      bootstrap: window.__APP_BOOTSTRAP_META__ || null,
      products: window.__PRODUCTS_META__ || null,
      counts: { resources:resources.length, js:js.length, css:css.length, json:json.length, images:images.length },
      transfer_total: totalTransfer,
      transfer_js: js.reduce(function(a,r){ return a+(Number(r.transferSize)||0); },0),
      transfer_css: css.reduce(function(a,r){ return a+(Number(r.transferSize)||0); },0),
      transfer_json: json.reduce(function(a,r){ return a+(Number(r.transferSize)||0); },0),
      transfer_images: images.reduce(function(a,r){ return a+(Number(r.transferSize)||0); },0),
      top_resources: top
    };
  }
  function render(){
    var data = collect();
    window.__NUTRITION_PERF_REPORT__ = data;
    var box = document.createElement('section');
    box.className = 'card';
    box.id = 'performanceSelfTestPanel';
    box.style.cssText = 'max-width:1040px;margin:16px auto;border:1px solid #bfdbfe;background:#f8fbff;';
    var rows = data.top_resources.map(function(r){ return '<tr><td>'+r.name+'</td><td>'+fmtBytes(r.transferSize)+'</td><td>'+r.duration+' мс</td></tr>'; }).join('');
    box.innerHTML = '<h2>Performance self-test</h2>'+
      '<p>Версия: <strong>'+VERSION+'</strong>. Начальная диагностика ресурсов в текущем браузере.</p>'+
      '<div class="row" style="gap:8px;flex-wrap:wrap"><span class="pill">Всего: '+fmtBytes(data.transfer_total)+'</span><span class="pill">JS: '+fmtBytes(data.transfer_js)+'</span><span class="pill">JSON: '+fmtBytes(data.transfer_json)+'</span><span class="pill">Изображения: '+fmtBytes(data.transfer_images)+'</span><span class="pill">Ресурсов: '+data.counts.resources+'</span></div>'+
      '<pre style="white-space:pre-wrap;background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:10px;max-height:220px;overflow:auto">'+JSON.stringify(data.bootstrap || {}, null, 2)+'</pre>'+
      '<table class="nr-table"><thead><tr><th>Ресурс</th><th>Передано</th><th>Время</th></tr></thead><tbody>'+rows+'</tbody></table>';
    var anchor = document.getElementById('reportSection') || document.body.lastElementChild;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling); else document.body.appendChild(box);
    try { console.info('[v5.2.23 perf]', data); } catch(_) {}
  }
  window.NutritionPerformanceV5 = { version:VERSION, collect:collect, render:render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(render, 1000); }, { once:true }); else setTimeout(render, 1000);
})();
