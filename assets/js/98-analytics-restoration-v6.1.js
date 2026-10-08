/* Progressive analytics for the continuous ration interface.
 * Presentation only: all nutrient values, HEI scores, structure values and
 * contributors come from existing calculation APIs. No normative math here.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.1-analytics-restoration-20261009', timer=0, busy=false;
  var GROUPS=[['basic','Основные показатели'],['vitamins','Витамины'],['minerals','Минералы'],['limits','Показатели с ограничениями'],['other','Другие показатели']];
  function el(id){return d.getElementById(id);}
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(x){if(x===null||x===undefined||x==='')return NaN;var v=Number(x);return isFinite(v)?v:NaN;}
  function bounded(x){return Math.max(0,Math.min(100,x));}
  function fmt(x,digits){return isFinite(x)?Number(x).toLocaleString('ru-RU',{maximumFractionDigits:digits==null?1:digits}):'—';}
  function validTarget(v){return isFinite(v)&&v>0;}
  function pctBar(p,label){var n=isFinite(p)?bounded(p):0;return '<span class="ar-meter" role="img" aria-label="'+esc(label||'Заполнение шкалы')+'"><i style="width:'+n.toFixed(2)+'%"></i></span>';}
  function fromState(){try{return w.State&&w.State.get?w.State.get():[];}catch(_){return [];}}
  function detail(){
    var api=w.NutritionAnalysisWorkspaceHF7;
    if(!api||!api.getViewModel)return null;
    try{if(api.refresh)api.refresh(true);return api.getViewModel();}catch(_){return null;}
  }
  function needsCurrent(){return d.documentElement.getAttribute('data-profile-calculation-state')==='current';}
  function currentNeeds(){return needsCurrent()&&w.__lastNeedsMeta&&w.__lastNeedsMeta.ok?w.__lastNeedsMeta:null;}
  function panel(){
    var anchor=el('heiPanel'),main=el('mainContent');if(!anchor||!main)return null;
    var node=el('nutritionInsightDashboard');
    if(!node){
      node=d.createElement('section');node.id='nutritionInsightDashboard';
      node.className='card ar-dashboard';node.setAttribute('aria-labelledby','arTitle');
      node.innerHTML='<div class="ar-heading"><div><span class="ar-kicker">АНАЛИЗ РАЦИОНА</span><h2 id="arTitle">Что показывает ваш рацион</h2><p>Значения и графики обновляются при изменении продуктов. Нажмите на показатель, чтобы увидеть источники.</p></div><button type="button" class="secondary ar-print" data-ar-print>Полный отчёт · PDF</button></div><div id="arBody" aria-live="polite"></div>';
      main.insertBefore(node,anchor);
    }
    return node;
  }
  function waterText(ref){
    if(!ref)return 'Ориентир не определён';
    if(ref.kind==='range'&&isFinite(number(ref.lowL))&&isFinite(number(ref.highL)))return fmt(number(ref.lowL),1)+'–'+fmt(number(ref.highL),1)+' л/сут';
    if(isFinite(number(ref.valueL)))return fmt(number(ref.valueL),1)+' л/сут';
    return 'Нужно уточнить условия';
  }
  function mealRows(meta,chosen){
    var raw=String(chosen||'').split('|'),percent=(raw[1]||'').split(',').map(Number);
    if(!percent.length||percent.some(function(v){return !isFinite(v)||v<0;}))return '';
    var energy=number(meta&&meta.workingEnergyTargetKcal);
    var canMacro=!!(meta&&meta.macroCalculationAvailable===true&&meta.normsSyncAllowed===true);
    var protein=canMacro?number(meta.totalProtein):NaN,fat=canMacro?number(meta.fatGrams):NaN,carbs=canMacro?number(meta.carbGrams):NaN;
    var cols=percent.map(function(p,i){
      var part=isFinite(energy)?'<small>'+fmt(energy*p/100,0)+' ккал</small>':'';
      var macro=isFinite(protein)&&isFinite(fat)&&isFinite(carbs)?'<small>Б '+fmt(protein*p/100,1)+' г · Ж '+fmt(fat*p/100,1)+' г · У '+fmt(carbs*p/100,1)+' г</small>':'';
      return '<span><b>'+(i+1)+'-й приём · '+fmt(p,0)+'%</b>'+part+macro+'</span>';
    });
    return '<div class="ar-meals">'+cols.join('')+'</div>';
  }
  function needsExtra(){
    var source=el('needs_split'),out=el('needs_out');if(!source||!out)return;
    var host=el('arNeedsExtra');
    if(!host){host=d.createElement('section');host.id='arNeedsExtra';host.className='ar-needs-extra';out.parentNode.insertBefore(host,out.nextSibling);}
    var meta=currentNeeds(),selected=source.value,options=[['3|30,40,30','3 приёма'],['4|25,35,30,10','4 приёма'],['5|20,30,25,15,10','5 приёмов']];
    var choice='<select id="arMealSplit" aria-label="Количество и доля энергии по приёмам пищи">'+options.map(function(o){return '<option value="'+esc(o[0])+'"'+(selected===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>';
    host.innerHTML='<div class="ar-needs-head"><div><strong>Вода и распределение по приёмам пищи</strong><p>Расчётные ориентиры и способ распределить выбранную энергию по приёмам.</p></div></div>'+
      '<div class="ar-water"><span>Общее поступление воды — из пищи и напитков</span><strong>'+waterText(meta&&meta.waterReference)+'</strong><small>'+(meta?'Справочный ориентир, а не обязательный объём выпиваемой воды.':'Ориентир появится после расчёта потребностей.')+'</small></div>'+
      '<div class="ar-meal-select"><label for="arMealSplit">Распределение энергии</label>'+choice+'</div>'+
      mealRows(meta,selected)+'<p class="ar-note">Доли по приёмам — выбираемая схема, а не физиологическая норма. Энергия и БЖУ распределяются по одной выбранной схеме только при наличии соответствующих расчётных целей.</p>';
  }
  function metricSpec(detail,source,key,short,unit){
    var totals=detail&&detail.snapshot&&detail.snapshot.totals||{};
    var value=number(totals[key]),target=number(el('normInput-'+key)&&el('normInput-'+key).value),known=validTarget(target);
    var text=isFinite(value)?fmt(value,key==='kcal'?0:1)+' '+unit:'нет данных';
    var ratio=known&&isFinite(value)?value/target*100:NaN;
    return '<article class="ar-metric"><div class="ar-metric-head"><strong>'+esc(short)+'</strong><b>'+esc(text)+'</b></div>'+
      (known&&isFinite(value)?pctBar(ratio,short+': '+fmt(ratio,0)+'% от ориентира'):'<span class="ar-meter is-unknown"></span>')+
      '<small>'+(known?(isFinite(value)?'Ориентир: '+fmt(target,0)+' '+unit+' · '+fmt(ratio,0)+'%':'Ориентир: '+fmt(target,0)+' '+unit+' · данных о поступлении нет'):'Ориентир не задан')+'</small></article>';
  }
  function macros(vm){
    return '<div class="ar-metrics">'+metricSpec(vm,null,'kcal','Энергия','ккал')+
      metricSpec(vm,null,'protein_g','Белки','г')+metricSpec(vm,null,'fat_g','Жиры','г')+
      metricSpec(vm,null,'carbs_g','Углеводы','г')+metricSpec(vm,null,'water_ml','Вода в рационе','мл')+'</div>';
  }
  function contributorRows(coverage,unit){
    var items=coverage&&coverage.items||[];
    if(!items.length)return '<p class="ar-note">Для введённых продуктов подтверждённый вклад не найден.</p>';
    return '<div class="ar-contributors">'+items.map(function(x){
      var share=number(x.share),fill=isFinite(share)?bounded(share):0;
      return '<div class="ar-contributor-entry"><div><strong>'+esc(x.name)+'</strong><span>'+fmt(number(x.value),2)+' '+esc(unit||'')+' · '+fmt(share,0)+'% рассчитанного вклада</span></div>'+pctBar(share,'Доля продукта: '+fmt(share,0)+'%')+'</div>';
    }).join('')+'</div>';
  }
  function nutrientRow(row){
    var value=number(row.actual),target=number(row.target),c=row.coverage||{},coverage=number(c.covered),total=number(c.total);
    var complete=isFinite(total)&&total>0&&coverage===total,any=isFinite(coverage)&&coverage>0;
    var valueText=any&&isFinite(value)?fmt(value,2)+' '+esc(row.unit||''):'нет данных';
    var label=row.status&&row.status.label||'Оценка недоступна';
    var isUpper=row.mode==='upper_limit';
    var canBar=any&&validTarget(target)&&row.mode!=='informational';
    var percent=canBar?value/target*100:NaN;
    var unit=esc(row.unit||''),limitLabel=isUpper?'верхний предел':'ориентир';
    var quality=row.quality&&row.quality.label?'<span class="ar-quality-label">Достоверность: '+esc(row.quality.label)+'</span>':'';
    return '<details class="ar-detail-row"><summary><span class="ar-row-main"><b>'+esc(row.title)+'</b><small>'+esc(label)+(complete?'':' · неполные данные')+'</small></span>'+
      '<span class="ar-row-value"><strong>'+valueText+'</strong><small>'+(validTarget(target)?limitLabel+' '+fmt(target,2)+' '+unit:'ориентир не задан')+'</small>'+ 
      (canBar?pctBar(percent,fmt(percent,0)+'% '+(isUpper?'от верхнего предела':'от референсного значения')):'<span class="ar-meter is-unknown"></span>')+'</span></summary>'+
      '<div class="ar-row-content"><p>'+esc(row.status&&row.status.note||'Числа оцениваются с учётом типа референсного значения; верхний допустимый уровень не является целью.')+'</p>'+(isUpper?'<p><strong>Верхний предел — не цель потребления.</strong> Заполнение шкалы показывает приближение к указанной границе.</p>':'')+quality+
      (!complete?'<p>Данные имеются для '+fmt(coverage,0)+' из '+fmt(total,0)+' позиций: отсутствующие значения не считаются нулями.</p>':'')+
      '<h4>Источники в вашем рационе</h4>'+contributorRows(c,row.unit)+'<button type="button" class="secondary ar-source-open" data-ar-source-key="'+esc(row.key)+'">Посмотреть продукты в справочнике</button>'+
      '<p class="ar-note">Показаны только добавленные продукты. Список не является рейтингом продуктов в общем каталоге.</p></div></details>';
  }
  function nutrientGroups(vm){
    var html='<section class="ar-block"><div class="ar-block-title"><h3>Нутриенты и минералы</h3><p>Выберите группу, затем показатель. Шкала показывает отношение к референсному значению; превышение 100% не всегда означает улучшение.</p></div>';
    GROUPS.forEach(function(group,i){
      var rows=(vm.nutrients||[]).filter(function(x){return x.group===group[0];});
      if(!rows.length)return;
      html+='<details class="ar-group"'+(i===0?' open':'')+'><summary><b>'+esc(group[1])+'</b><span>'+rows.length+' показателей</span></summary>'+
        '<div class="ar-group-list">'+rows.map(nutrientRow).join('')+'</div></details>';
    });
    return html+'</section>';
  }
  function heiRow(row){
    var pts=number(row.points),max=number(row.maxPoints),percent=validTarget(max)?pts/max*100:NaN;
    var contributors=row.contributors&&row.contributors.positive||row.contributors||{};
    var negative=row.key==='fatty_acids_ratio'&&row.contributors&&row.contributors.negative?'<h4>Вклад насыщенных жиров</h4>'+contributorRows(row.contributors.negative,''):'';
    return '<details class="ar-detail-row"><summary><span class="ar-row-main"><b>'+esc(row.title)+'</b><small>'+esc(row.status&&row.status.label||'HEI‑2020')+'</small></span>'+
      '<span class="ar-row-value"><strong>'+fmt(pts,1)+' / '+fmt(max,0)+'</strong>'+
      pctBar(percent,fmt(percent,0)+'% от возможного балла')+'</span></summary><div class="ar-row-content">'+
      '<p>Фактический показатель: '+esc(row.actual||'—')+'. Ориентир: '+esc(row.norm||'—')+'.</p>'+
      (row.action?'<p>'+esc(row.action)+'</p>':'')+'<h4>Учтённые продукты</h4>'+contributorRows(contributors,'')+negative+
      '<p class="ar-note">HEI оценивает соответствие структуре пищевых рекомендаций; показатель сам по себе не диагностирует дефициты.</p></div></details>';
  }
  function heiBlock(vm){
    var has=vm.items>0&&vm.hei&&vm.hei.model&&isFinite(number(vm.hei.model.total));
    var total=has?number(vm.hei.model.total):NaN;
    var rows=has&&Array.isArray(vm.hei.rows)?vm.hei.rows:[];
    return '<section class="ar-block"><div class="ar-block-title"><h3>Индекс HEI‑2020</h3><p>Общий результат и вклад 13 компонентов; можно раскрыть каждый показатель.</p></div>'+
      '<div class="ar-hei-total"><strong>'+(has?fmt(total,1)+' <small>из 100</small>':'Пока нет расчёта')+'</strong>'+
      pctBar(total,has?'HEI '+fmt(total,1)+' из 100':'HEI не рассчитан')+
      '<p>'+(has?'Оценка пищевой структуры. Ограничения по отдельным нутриентам проверяются независимо.':'Добавьте продукты для оценки структуры питания.')+'</p></div>'+
      (rows.length?'<details class="ar-group ar-hei-list"><summary><b>Все компоненты HEI</b><span>'+rows.length+' показателей</span></summary><div class="ar-group-list">'+rows.map(heiRow).join('')+'</div></details>':'')+'</section>';
  }
  function matrix(vm){
    var p=w.__lastDietAnalysisProfile||{},hei=number(p.hei),structure=number(p.dailyStructure);
    var has=vm.items>0&&isFinite(hei)&&isFinite(structure);
    var x=has?bounded(structure):50,y=has?bounded(hei):50;
    return '<section class="ar-block"><div class="ar-block-title"><h3>Качество × структура</h3><p>Две самостоятельные оценки: HEI‑2020 по вертикали и авторская структурная модель по горизонтали.</p></div>'+
      '<div class="ar-matrix-layout"><div class="ar-matrix" role="img" aria-label="'+(has?'HEI '+fmt(hei,0)+' из 100; структурная оценка '+fmt(structure,0)+' из 100':'Матрица появится после расчёта')+'"><span class="ar-matrix-point" style="left:'+x+'%;bottom:'+y+'%"></span><span class="ar-axis ar-axis-y">HEI ↑</span><span class="ar-axis ar-axis-x">Структура →</span><span class="ar-tick ar-tick-y100">100</span><span class="ar-tick ar-tick-zero">0</span><span class="ar-tick ar-tick-x100">100</span></div>'+
      '<div class="ar-matrix-copy"><b>'+(has?'HEI '+fmt(hei,0)+' / структура '+fmt(structure,0):'Ожидаем данные')+'</b>'+
      '<p>'+(has?'Точка отображает два показателя текущего рациона. Сопоставляйте их с подробным разбором, а не как медицинский диагноз.':'Профиль появится после ввода продуктов и расчёта обеих осей.')+'</p>'+
      '<p class="ar-note">Структурный показатель является дополнительной моделью данного калькулятора и не тождественен HEI.</p></div></div></section>';
  }
  function render(){
    if(busy)return;busy=true;
    try{
      needsExtra();
      var host=panel(),body=el('arBody');
      if(!host||!body)return;
      var vm=detail(),items=vm&&number(vm.items);
      if(!vm||!(items>0)){body.innerHTML='<div class="ar-empty"><strong>Графики появятся вместе с рационом</strong><p>Добавьте хотя бы один продукт. Затем вы увидите поступление нутриентов, состав HEI и источники каждого показателя.</p></div>';return;}
      var open={};Array.prototype.forEach.call(body.querySelectorAll('details[open]'),function(x){var key=x.getAttribute('data-ar-key');if(key)open[key]=true;});
      body.innerHTML='<div class="ar-primary">'+macros(vm)+heiBlock(vm)+'</div>'+nutrientGroups(vm)+matrix(vm)+
        '<p class="ar-note">Точность результатов зависит от заполненности и источников карточек продуктов. При неполном покрытии нельзя считать неизвестные количества нулевыми.</p>';
      Array.prototype.forEach.call(body.querySelectorAll('details'),function(x,i){if(!x.hasAttribute('data-ar-key'))x.setAttribute('data-ar-key',x.classList.contains('ar-group')?'group-'+x.querySelector('summary b').textContent:'row-'+x.querySelector('summary b').textContent);if(open[x.getAttribute('data-ar-key')])x.open=true;});
    }finally{busy=false;}
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(render,180);}
  function detailedPrint(){
    var api=w.WorkspaceReportHF13;
    if(!api||!api.buildDocumentHtml||!api.buildReportModel)return false;
    var win=w.open('','_blank','width=1040,height=880,scrollbars=yes,resizable=yes');
    if(!win)return true;
    try{
      var opts={detailedNutrients:true,fullHei:true,contributors:true,appliedChanges:true,methodology:true};
      var model=api.buildReportModel(opts),vm=detail();
      var n=currentNeeds(),chosen=el('needs_split');
      var needsGraphic='<section class="ar-print-block"><h2>Вода и приёмы пищи</h2><p>Общее поступление воды: '+waterText(n&&n.waterReference)+'</p>'+mealRows(n,chosen&&chosen.value)+'<p>Доли приёмов являются выбираемой схемой, а не нормативом.</p></section>';
      var graphs=needsGraphic+(vm&&vm.items>0?'<section class="ar-print-block"><h2>Наглядный разбор показателей</h2>'+macros(vm)+heiBlock(vm)+nutrientGroups(vm)+matrix(vm)+'</section>':'');
      var style='<style>.ar-print-block{margin:16px 0;font:10pt/1.4 Arial,sans-serif}.ar-primary{display:block}.ar-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ar-metric,.ar-block{padding:9px;margin:8px 0;border:1px solid #d5dde7;break-inside:avoid}.ar-meter{display:block;height:7px;margin:5px 0;background:#e5eaf0;border-radius:7px;overflow:hidden}.ar-meter i{display:block;height:100%;background:#486a94}.ar-detail-row{padding:5px;border-bottom:1px solid #e5eaf0}.ar-detail-row summary{display:flex;justify-content:space-between;gap:12px}.ar-detail-row small,.ar-note,.ar-matrix-copy p{color:#596579;font-size:9pt}.ar-detail-row .ar-row-content{padding:4px 8px}.ar-contributors>div{display:flex;gap:12px;justify-content:space-between}.ar-matrix{position:relative;width:190px;height:190px;border:1px solid #a9b8cd;background:linear-gradient(to right,transparent 49.7%,#cdd5df 50%,transparent 50.3%),linear-gradient(to top,transparent 49.7%,#cdd5df 50%,transparent 50.3%)}.ar-matrix-point{position:absolute;transform:translate(-50%,50%);border:5px solid #284f7d;border-radius:50%;width:12px;height:12px}.ar-matrix-layout{display:flex;gap:20px}.ar-axis{font-size:8pt}.ar-axis-x{position:absolute;bottom:3px;right:4px}.ar-axis-y{position:absolute;top:4px;left:4px}.ar-hei-total strong{font-size:18pt}.ar-block-title p,.ar-hei-total p{color:#596579}.ar-group>summary{font-weight:bold}.ar-print{display:none}</style>';
      var full=api.buildDocumentHtml(model);
      if(graphs){graphs=graphs.replace(/<details(?=[ >])/g,'<details open');full=full.replace('</head>',style+'</head>');full=full.replace('</body>',graphs+'</body>');}
      win.document.open();win.document.write(full);win.document.close();
      win.focus();win.setTimeout(function(){try{win.print();}catch(_){}},250);
    }catch(error){try{win.document.body.textContent='Не удалось подготовить отчёт: '+String(error&&error.message||error);}catch(_){}}
    return true;
  }
  function handleClick(e){
    var button=e.target&&e.target.closest?e.target.closest('[data-ar-print],#printAllBtn,#exportAllPdfBtn,[data-workspace-report-print],[data-workspace-report-pdf]'):null;
    if(!button)return;
    if(!w.WorkspaceReportHF13)return;
    e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    detailedPrint();
  }
  function handleChange(e){
    if(!e.target||e.target.id!=='arMealSplit')return;
    var source=el('needs_split');if(!source)return;
    source.value=e.target.value;
    try{source.dispatchEvent(new Event('change',{bubbles:true}));}catch(_){}
    schedule();
  }
  function init(){
    d.addEventListener('click',handleClick,true);
    d.addEventListener('change',handleChange,false);
    /* Needs checkpoint dispatches needs:computed on document, without bubbling. */
    d.addEventListener('needs:computed',schedule,false);
    d.addEventListener('needs:invalidated',schedule,false);
    ['app:ready','ration:changed','needs:computed','needs:invalidated','needs:changed','hei:rendered','diet:profile-rendered','analysis-workspace:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    w.NutritionAnalyticsRestorationV1={version:VERSION,refresh:render,print:detailedPrint};
    schedule();
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
