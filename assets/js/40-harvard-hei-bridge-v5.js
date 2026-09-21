// nutrition calculator v5.2.33_product_logic_guardrails
// Responsibility: compact structural triage for Harvard Plate + HEI bridge.
// This module DOES NOT recalculate HEI. It reads the existing HEI model/rows and the existing Harvard Plate model.
(function(){
  'use strict';

  var VERSION = 'v5.2.33_product_logic_guardrails';
  window.__V530_HARVARD_TRIAGE_BRIDGE__ = VERSION;
  window.__V529_HARVARD_HEI_BRIDGE__ = VERSION; // compatibility marker

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function num(v){ var n = Number(v); return Number.isFinite(n) ? n : 0; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, num(v))); }
  function fmt(n,d){
    if (!Number.isFinite(Number(n))) return '—';
    var x = Number(n);
    var s = x.toFixed(d == null ? 1 : d);
    return s.replace(/\.0$/, '');
  }
  function pctText(n){ return fmt(n, n >= 10 ? 0 : 1) + '%'; }

  var HP_NAMES = [
    'HarvardPlateV5329','HarvardPlateV5328','HarvardPlateV5326','HarvardPlateV5318','HarvardPlateV5317','HarvardPlateV5316','HarvardPlateV5315','HarvardPlateV5314','HarvardPlateV5313','HarvardPlateV5312','HarvardPlateV5311','HarvardPlateV5310','HarvardPlateV539','HarvardPlateV538','HarvardPlateV537','HarvardPlateV536','HarvardPlateV535','HarvardPlateV534','HarvardPlateV533','HarvardPlateV532','HarvardPlateV531','HarvardPlateV530','HarvardPlateV5230','HarvardPlateV5223','HarvardPlateV5221',
    'HarvardPlateV530','HarvardPlateV529','HarvardPlateV528','HarvardPlateV527',
    'HarvardPlateV526','HarvardPlateV525','HarvardPlateV524','HarvardPlateV523'
  ];

  function hpApi(){
    for (var i=0;i<HP_NAMES.length;i++){
      var api = window[HP_NAMES[i]];
      if (api && (typeof api.getModel === 'function' || api.__lastModel)) return api;
    }
    return null;
  }
  function hpModel(){
    var api = hpApi();
    if (!api) return null;
    try { if (typeof api.getModel === 'function') return api.getModel(); } catch(_) {}
    return api.__lastModel || null;
  }

  function heiData(){
    var model = window.__lastHEIModel || null;
    var rows = Array.isArray(window.__lastHEIRows) ? window.__lastHEIRows : [];
    var total = NaN;
    if (model && Number.isFinite(Number(model.total))) total = Number(model.total);
    if (!Number.isFinite(total)) {
      var t = $('heiTotalCell');
      if (t) total = Number(String(t.textContent || '').replace(',', '.').replace(/[^0-9.+-]/g,''));
    }
    if (!rows.length) {
      var tbody = $('heiTableBody');
      if (tbody) {
        rows = Array.prototype.slice.call(tbody.querySelectorAll('tr')).map(function(row){
          var c = Array.prototype.slice.call(row.children || []);
          var max = Number(row.getAttribute('data-hei-max')) || 10;
          var score = Number(row.getAttribute('data-hei-score'));
          if (!Number.isFinite(score) && c[4]) score = Number(String(c[4].textContent||'').replace(',', '.').replace(/[^0-9.+-]/g,''));
          return { key: row.getAttribute('data-hei-key') || '', label: c[0] ? c[0].textContent.trim() : '', pts: score, max:max };
        }).filter(function(r){ return r.label; });
      }
    }
    return { total: Number.isFinite(total) ? total : NaN, rows: rows };
  }

  function sector(model, id){
    return model && model.stage && model.stage.sectors ? (model.stage.sectors[id] || {}) : {};
  }
  function sectorPct(model, id){
    var s = sector(model, id);
    if (Number.isFinite(Number(s.actualPercent))) return Number(s.actualPercent);
    var core = Number(model && model.coreMass) || 0;
    var g = Number(s.grams) || 0;
    return core > 0 ? 100 * g / core : 0;
  }
  function sectorGrams(model, id){ return Number(sector(model,id).grams) || 0; }
  function componentScore(value, target, maxPts, hardDeviation){
    return clamp(maxPts * (1 - Math.abs(value - target) / hardDeviation), 0, maxPts);
  }

  function capScore(base, facts){
    var cap = 100;
    if (facts.vegFruit > 70 || facts.vegFruit < 35) cap = Math.min(cap, 60);
    if (facts.wholeGrains < 10) cap = Math.min(cap, 55);
    if (facts.protein < 12) cap = Math.min(cap, 55);
    if (facts.maxShare > 65) cap = Math.min(cap, 55);
    if (facts.vegFruit > 70 && facts.wholeGrains < 10 && facts.protein < 12) cap = Math.min(cap, 40);
    if (facts.maxShare > 75) cap = Math.min(cap, 38);
    if (facts.vegFruit > 80 && (facts.wholeGrains < 10 || facts.protein < 12)) cap = Math.min(cap, 42);
    return Math.round(Math.min(base, cap));
  }

  function plateStructure(model){
    if (!model || !model.ready || model.empty || !(Number(model.coreMass) > 0)) {
      return { ready:false, status:'empty', statusText:'нет данных', score:0, reason:'Добавьте продукты, чтобы оценить структуру основной тарелки.' };
    }

    var vegetables = sectorPct(model,'vegetables');
    var fruits = sectorPct(model,'fruits');
    var wholeGrains = sectorPct(model,'wholeGrains');
    var protein = sectorPct(model,'protein');
    var vegFruit = vegetables + fruits;
    var maxShare = Math.max(vegetables, fruits, wholeGrains, protein);
    var dominant = [
      ['vegetables', vegetables], ['fruits', fruits], ['wholeGrains', wholeGrains], ['protein', protein]
    ].sort(function(a,b){ return b[1]-a[1]; })[0];

    var baseScore =
      componentScore(vegFruit, 50, 40, 50) +
      componentScore(wholeGrains, 25, 25, 25) +
      componentScore(protein, 25, 25, 25) +
      (vegetables >= fruits ? 10 : clamp(10 - (fruits - vegetables), 0, 10));
    var score = capScore(baseScore, { vegFruit:vegFruit, wholeGrains:wholeGrains, protein:protein, maxShare:maxShare });

    var close = vegFruit >= 45 && vegFruit <= 60 && wholeGrains >= 18 && wholeGrains <= 32 && protein >= 18 && protein <= 32 && vegetables >= fruits;
    var strong = vegFruit > 70 || vegFruit < 35 || wholeGrains < 10 || protein < 12 || maxShare > 65;
    var status = close ? 'ok' : (strong ? 'strong' : 'moderate');
    var statusText = close ? 'близко к ориентиру' : (strong ? 'выраженный перекос' : 'умеренный перекос');

    var issues = [];
    if (vegFruit > 60) issues.push('овощи и фрукты занимают слишком большую долю основной тарелки');
    if (vegFruit < 45) issues.push('овощей и фруктов меньше половины основной тарелки');
    if (wholeGrains < 18) issues.push('цельных злаков мало относительно ориентира');
    if (wholeGrains > 32) issues.push('цельных злаков больше ориентира');
    if (protein < 18) issues.push('белковая часть ниже ориентира');
    if (protein > 32) issues.push('белковая часть выше ориентира');
    if (fruits > vegetables) issues.push('фруктовая часть больше овощной; в модели тарелки овощи обычно преобладают');
    if (!issues.length) issues.push('основные сектора близки к рабочему ориентиру');

    var actions = [];
    if (protein < 18) actions.push('добавить белковую часть к одному приёму пищи');
    if (wholeGrains < 18) actions.push('добавить порцию цельных злаков');
    if (vegFruit > 60) actions.push('сейчас важнее выровнять остальные сектора');
    if (vegFruit < 45) actions.push('добавить овощную часть к одному-двум приёмам пищи');
    if (fruits > vegetables) actions.push('следующую растительную порцию сделать овощной');
    if (!actions.length) actions.push('сохранять структуру и проверять качество продуктов по HEI');

    return {
      ready:true,
      status:status,
      statusText:statusText,
      score:score,
      vegetables:vegetables,
      fruits:fruits,
      vegFruit:vegFruit,
      wholeGrains:wholeGrains,
      protein:protein,
      grams:{
        vegetables:sectorGrams(model,'vegetables'),
        fruits:sectorGrams(model,'fruits'),
        wholeGrains:sectorGrams(model,'wholeGrains'),
        protein:sectorGrams(model,'protein')
      },
      dominant:dominant[0],
      dominantShare:dominant[1],
      issues:issues,
      actions:actions
    };
  }

  function heiStatus(hei){
    var total = hei && Number.isFinite(hei.total) ? hei.total : NaN;
    if (!Number.isFinite(total)) return { status:'unknown', text:'HEI ещё не рассчитан', total:NaN };
    if (total >= 80) return { status:'good', text:'HEI высокий', total:total };
    if (total >= 70) return { status:'good', text:'HEI хороший', total:total };
    if (total >= 50) return { status:'medium', text:'HEI средний', total:total };
    return { status:'low', text:'HEI низкий', total:total };
  }
  function weakHEIComponents(hei){
    var rows = (hei && hei.rows) || [];
    return rows.map(function(r){
      var max = Number(r.max || r.maxPts || 10);
      var score = Number(r.score != null ? r.score : (r.pts != null ? r.pts : 0));
      var ratio = max > 0 ? score/max : 0;
      return { key:r.key || '', label:r.label || r.name || '', score:score, max:max, ratio:ratio };
    }).filter(function(r){ return r.label && r.ratio < 0.6; })
      .sort(function(a,b){ return a.ratio - b.ratio; })
      .slice(0,4);
  }

  function mainConclusion(plate){
    if (!plate.ready) return plate.reason || 'Добавьте продукты, чтобы оценить структуру тарелки.';
    if (plate.status === 'ok') return 'Основная тарелка близка к модели: растительная половина, цельные злаки и белковая часть представлены сбалансированно.';
    if (plate.vegFruit > 70 && plate.protein < 18 && plate.wholeGrains < 18) {
      return 'Овощи и фрукты занимают почти всю основную тарелку. Белковой части и цельных злаков мало.';
    }
    if (plate.protein < 18 && plate.wholeGrains < 18) return 'Белковая часть и цельные злаки ниже ориентира для основной тарелки.';
    if (plate.vegFruit > 60) return 'Растительная часть слишком велика относительно белковой части и цельных злаков.';
    if (plate.vegFruit < 45) return 'Овощей и фруктов меньше половины основной тарелки.';
    if (plate.protein < 18) return 'Белковая часть ниже ориентира основной тарелки.';
    if (plate.wholeGrains < 18) return 'Цельных злаков мало относительно ориентира основной тарелки.';
    return plate.issues[0] || 'Структуру тарелки стоит немного выровнять.';
  }

  function bridgeText(plate, hei){
    var hs = heiStatus(hei);
    if (!plate.ready) return 'HEI оценивает качество компонентов, а Гарвардская тарелка начнёт оценивать структуру после добавления продуктов.';
    if (hs.status === 'unknown') return 'Гарвардская тарелка уже показывает структуру основной части рациона. HEI появится после расчёта качества компонентов.';
    var goodHEI = hs.status === 'good';
    var goodPlate = plate.status === 'ok';
    if (goodHEI && goodPlate) return 'HEI и Гарвардская тарелка согласуются: рацион выглядит качественным и структурно близким к модели тарелки.';
    if (goodHEI && !goodPlate) return 'HEI может быть хорошим по компонентам, но тарелка показывает перекос структуры: отдельные продукты качественные, а распределение основной тарелки стоит выровнять.';
    if (!goodHEI && goodPlate) return 'Тарелка выглядит близко к ориентиру, но HEI снижается качеством компонентов: проверьте натрий, добавленный сахар, насыщенные жиры, рафинированные злаки и слабые группы HEI.';
    return 'Есть и структурный перекос, и проблемы качества. Тарелка показывает распределение основной части рациона, HEI уточняет качество продуктов и слабые компоненты.';
  }

  function tone(status){
    if (status === 'ok') return 'ok';
    if (status === 'moderate') return 'warn';
    if (status === 'strong') return 'bad';
    return 'empty';
  }
  function ensureBridge(){
    var panel = $('harvardPlatePanel');
    if (!panel) return null;
    var head = panel.querySelector('.harvard-plate-head');
    var layout = panel.querySelector('.harvard-plate-layout');
    var box = $('harvardHeiBridge');
    if (!box) {
      box = document.createElement('section');
      box.id = 'harvardHeiBridge';
      box.className = 'harvard-hei-bridge hhb-v530';
      box.setAttribute('aria-label', 'Структурная проверка Гарвардской тарелки и связь с HEI');
      if (layout) layout.insertAdjacentElement('beforebegin', box);
      else if (head) head.insertAdjacentElement('afterend', box);
      else panel.insertAdjacentElement('afterbegin', box);
    }
    return box;
  }

  function bar(title, value, target, toneName, note){
    var safeVal = clamp(value, 0, 100);
    return '<div class="hhb-bar" data-tone="'+esc(toneName || 'neutral')+'">' +
      '<div class="hhb-bar-head"><strong>'+esc(title)+'</strong><span>'+esc(pctText(value))+'</span></div>' +
      '<div class="hhb-track" style="--hhb-pct:'+safeVal+'%"><i></i><em style="left:'+clamp(target,0,100)+'%"></em></div>' +
      '<div class="hhb-bar-note">'+esc(note || ('ориентир около '+pctText(target)))+'</div>' +
    '</div>';
  }

  function actionList(plate){
    return '<ol class="hhb-action-list">' + plate.actions.slice(0,3).map(function(x){
      return '<li>'+esc(x)+'</li>';
    }).join('') + '</ol>';
  }

  function captureOpenState(root){
    var out = {};
    if (!root || !root.querySelectorAll) return out;
    var list = root.querySelectorAll('details');
    for (var i=0;i<list.length;i++){
      var d=list[i];
      var sm=d.querySelector('summary');
      var key=d.className + '|' + (sm ? sm.textContent.replace(/\s+/g,' ').trim() : i);
      out[key]=!!d.open;
    }
    return out;
  }
  function applyOpenState(root, state){
    if (!root || !root.querySelectorAll || !state) return;
    var list=root.querySelectorAll('details');
    for (var i=0;i<list.length;i++){
      var d=list[i];
      var sm=d.querySelector('summary');
      var key=d.className + '|' + (sm ? sm.textContent.replace(/\s+/g,' ').trim() : i);
      if (Object.prototype.hasOwnProperty.call(state,key)) d.open=!!state[key];
    }
  }
  function stableSetHtml(box, html){
    if (!box) return;
    if (box.__lastStableHtml === html) return;
    var st=captureOpenState(box);
    box.innerHTML=html;
    applyOpenState(box, st);
    box.__lastStableHtml=html;
  }

  function render(){
    var box = ensureBridge();
    if (!box) return;
    var model = hpModel();
    var plate = plateStructure(model);
    var hei = heiData();
    var hs = heiStatus(hei);
    var weak = weakHEIComponents(hei);
    window.__lastHarvardPlateStructure = plate;

    if (!plate.ready) {
      stableSetHtml(box, '<details class="hhb-compact hhb-empty"><summary><span>Связь с HEI</span><strong>структурная проверка ждёт данные</strong></summary><p>'+esc(plate.reason)+'</p></details>');
      return;
    }

    var vfTone = plate.vegFruit >= 45 && plate.vegFruit <= 60 ? 'ok' : (plate.vegFruit > 70 || plate.vegFruit < 35 ? 'bad' : 'warn');
    var wgTone = plate.wholeGrains >= 18 && plate.wholeGrains <= 32 ? 'ok' : (plate.wholeGrains < 10 ? 'bad' : 'warn');
    var prTone = plate.protein >= 18 && plate.protein <= 32 ? 'ok' : (plate.protein < 12 ? 'bad' : 'warn');

    var weakHtml = weak.length
      ? '<ul class="hhb-weak-list">'+weak.slice(0,4).map(function(x){ return '<li>'+esc(x.label)+' '+fmt(x.score,1)+'/'+fmt(x.max,0)+'</li>'; }).join('')+'</ul>'
      : '<p class="hhb-weak">Слабые компоненты HEI не выделены или HEI ещё не рассчитан.</p>';

    stableSetHtml(box,
      '<details class="hhb-compact">' +
        '<summary><span>Связь с HEI</span><strong>'+esc(hs.text)+' · структура '+esc(plate.statusText)+'</strong></summary>' +
        '<div class="hhb-compact-body">' +
          '<p><strong>Зачем этот блок:</strong> HEI оценивает качество продуктов, а Гарвардская тарелка — структуру основной части рациона. Поэтому высокий HEI не всегда означает ровную тарелку, и наоборот.</p>' +
          '<div class="hhb-compact-bars">' +
            bar('Овощи + фрукты', plate.vegFruit, 50, vfTone, 'ориентир: около 50%; овощей желательно больше, чем фруктов') +
            bar('Цельные злаки', plate.wholeGrains, 25, wgTone, 'ориентир: около 25% основной тарелки') +
            bar('Белковые продукты', plate.protein, 25, prTone, 'ориентир: около 25% основной тарелки') +
          '</div>' +
          '<div class="hhb-compact-weak"><strong>Что проверять в HEI:</strong>'+weakHtml+'</div>' +
        '</div>' +
      '</details>');
  }

  function schedule(){
    clearTimeout(schedule._t);
    schedule._t = setTimeout(render, 80);
    setTimeout(render, 320);
  }
  function init(){
    schedule();
    ['ration:changed','hei:rendered','hei:watchdog-recomputed','hei:forced-recompute','needs:changed','storage'].forEach(function(ev){
      window.addEventListener(ev, schedule);
    });
    var bootPulses = 0;
    var bootTimer = setInterval(function(){
      bootPulses += 1;
      schedule();
      if (bootPulses >= 8) clearInterval(bootTimer);
    }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
