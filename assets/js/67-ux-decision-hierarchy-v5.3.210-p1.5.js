/* P1.5 UX Simplification & Decision Hierarchy. ES5-safe progressive enhancement. */
(function(w,d){
'use strict';
var VERSION='v5.3.210-p1.5';
var apiContract=w.NutritionUxDecisionHierarchyP15;
var contract=apiContract&&apiContract.contract;
var initialized=false,refreshTimer=null,lastRationCount=0;
function byId(id){return d.getElementById(id);}
function text(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim():'';}
function positive(value){var n=Number(value);return isFinite(n)&&n>0;}
function focusTarget(selector){
  if(selector==='#needs'){var compact=byId('needsCompact'),toggle=byId('v40NeedsToggle');if(compact&&compact.classList.contains('v40-needs-collapsed')&&toggle){try{toggle.click();}catch(_){}}}
  var target=d.querySelector(selector);if(!target)return false;
  var parentDetails=target.closest&&target.closest('details');while(parentDetails){parentDetails.open=true;parentDetails=parentDetails.parentElement&&parentDetails.parentElement.closest&&parentDetails.parentElement.closest('details');}
  if(target.tagName==='DETAILS')target.open=true;
  if(target.hidden)target.hidden=false;
  try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){target.scrollIntoView(true);}
  if(/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName)){
    try{target.focus({preventScroll:true});}catch(_){try{target.focus();}catch(__){}}
  }else{
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    try{target.focus({preventScroll:true});}catch(_){try{target.focus();}catch(__){}}
  }
  return true;
}
function needsReady(){
  var kcal=byId('normInput-kcal'),out=byId('needs_out');
  return !!(kcal&&positive(kcal.value)&&!/устарел|введите исходные данные/i.test(text(out)));
}
function rationRows(){
  var root=byId('rationBody');if(!root)return [];
  return Array.prototype.slice.call(root.querySelectorAll('.ration-row')).filter(function(row){
    var input=row.querySelector('input[type="number"]');return !input||positive(input.value);
  });
}
function rationReady(){return rationRows().length>0;}
function el(tag,attrs,html){
  var node=d.createElement(tag),k;
  attrs=attrs||{};
  for(k in attrs)if(Object.prototype.hasOwnProperty.call(attrs,k)){
    if(k==='className')node.className=attrs[k];
    else if(k==='text')node.textContent=attrs[k];
    else node.setAttribute(k,attrs[k]);
  }
  if(html!==undefined)node.innerHTML=html;
  return node;
}
function makeDrawer(id,label,description,badge){
  var details=el('details',{id:id,className:'card p15-drawer'});
  var summary=el('summary',{className:'p15-drawer__summary'});
  var copy=el('span',{className:'p15-drawer__copy'});
  copy.appendChild(el('strong',{text:label}));
  copy.appendChild(el('small',{text:description}));
  summary.appendChild(copy);
  summary.appendChild(el('span',{className:'p15-drawer__badge',text:badge||'Необязательно'}));
  details.appendChild(summary);
  details.appendChild(el('div',{className:'p15-drawer__body'}));
  return details;
}
function moveInto(drawer,node){var body=drawer&&drawer.querySelector('.p15-drawer__body');if(body&&node)body.appendChild(node);}
function buildWorkflow(){
  var main=byId('mainContent'),header=main&&main.querySelector('header');if(!main||!header||byId('p15Workflow'))return;
  var nav=el('nav',{id:'p15Workflow',className:'p15-workflow','aria-label':(contract&&contract.accessibility.navigation_label)||'Этапы работы с калькулятором'});
  var head=el('div',{className:'p15-workflow__head'},'<div><span>Понятный маршрут</span><strong>От исходных данных к практическому решению</strong></div><small>Расширенные инструменты открываются по мере необходимости.</small>');
  var list=el('ol',{className:'p15-workflow__steps'});
  (contract&&contract.stages||[]).forEach(function(stage){
    var li=el('li',{'data-p15-stage':stage.id});
    var a=el('a',{href:stage.target,className:'p15-workflow__step','data-stage-id':stage.id,'data-stage-target':stage.target});
    a.innerHTML='<span class="p15-workflow__number">'+stage.number+'</span><span><strong>'+stage.short_label+'</strong><small>'+stage.label+'</small></span><span class="p15-workflow__state">Ожидает</span>';
    a.addEventListener('click',function(event){
      if((stage.id==='analysis'||stage.id==='action')&&!rationReady()){
        event.preventDefault();focusTarget('#globalSearchInput');announce('Сначала добавьте хотя бы один продукт.');
      }else if(stage.id==='analysis'&&rationReady()){
        event.preventDefault();var core=byId('p15CoreResults');if(core)core.open=true;focusTarget('#totalsSection');
      }
    });
    li.appendChild(a);list.appendChild(li);
  });
  nav.appendChild(head);nav.appendChild(list);
  header.parentNode.insertBefore(nav,header.nextSibling);
}
function buildDecisionSummary(){
  var ration=byId('rationSection');if(!ration||byId('p15DecisionSummary'))return;
  var section=el('section',{id:'p15DecisionSummary',className:'card p15-decision-summary','aria-labelledby':'p15DecisionTitle'});
  section.innerHTML='\
    <div class="p15-decision-summary__head">\
      <div><span class="step-badge">Следующий шаг</span><h2 id="p15DecisionTitle">Что делать сейчас</h2></div>\
      <div class="p15-decision-summary__chips" aria-label="Состояние рабочего процесса">\
        <span id="p15NeedsChip">Потребности: не рассчитаны</span><span id="p15RationChip">Рацион: пуст</span>\
      </div>\
    </div>\
    <p id="p15DecisionMessage" class="p15-decision-summary__message" aria-live="polite"></p>\
    <div class="p15-decision-summary__actions">\
      <button type="button" id="p15PrimaryAction"></button>\
      <button type="button" class="secondary" id="p15SecondaryAction"></button>\
    </div>\
    <p class="p15-decision-summary__note">Калькулятор не блокирует профессиональные функции: они собраны в раскрываемые разделы ниже, чтобы основной путь оставался коротким.</p>';
  ration.parentNode.insertBefore(section,ration.nextSibling);
}
function prepareSearchResults(){
  var results=byId('globalResults'),input=byId('globalSearchInput');if(!results||byId('p15SearchResultsDrawer'))return;
  var drawer=el('details',{id:'p15SearchResultsDrawer',className:'p15-search-results-drawer'});
  drawer.innerHTML='<summary><strong>Результаты поиска</strong><span id="p15SearchResultsState">Откроются после ввода</span></summary><div class="p15-search-results-drawer__body"></div>';
  results.parentNode.insertBefore(drawer,results);drawer.querySelector('.p15-search-results-drawer__body').appendChild(results);
  function sync(){var value=String(input.value||'').trim(),state=byId('p15SearchResultsState');if(value){drawer.open=true;if(state)state.textContent='Показаны совпадения';}else{drawer.open=false;if(state)state.textContent='Откроются после ввода';}}
  input.addEventListener('input',function(){w.setTimeout(sync,0);},false);sync();
}
function buildResultOverview(){
  var decision=byId('p15DecisionSummary');if(!decision||byId('p15ResultOverview'))return;
  var section=el('section',{id:'p15ResultOverview',className:'card p15-result-overview p15-requires-ration','aria-labelledby':'p15ResultOverviewTitle'});
  section.innerHTML='\
    <div class="p15-result-overview__head"><div><span class="step-badge">Краткий итог</span><h2 id="p15ResultOverviewTitle">Сначала главное</h2></div><span class="p15-result-overview__badge">Подробности по запросу</span></div>\
    <div class="p15-result-overview__grid">\
      <div><span>Состав рациона</span><strong id="p15OverviewRation">—</strong><small id="p15OverviewRationNote">Ждём продукты</small></div>\
      <div><span>Качество HEI</span><strong id="p15OverviewHei">—</strong><small>Индекс структуры и качества</small></div>\
      <div><span>Надёжность данных</span><strong id="p15OverviewQuality">—</strong><small>Зависит от карточек продуктов</small></div>\
    </div>\
    <div class="p15-result-overview__actions"><button type="button" id="p15OpenCoreResults">Открыть полный итог</button><button type="button" class="secondary" id="p15OpenAdvancedResults">Расширенный анализ</button></div>';
  decision.parentNode.insertBefore(section,decision.nextSibling);
  byId('p15OpenCoreResults').onclick=function(){var dr=byId('p15CoreResults');if(dr)dr.open=true;focusTarget('#totalsSection');};
  byId('p15OpenAdvancedResults').onclick=function(){var dr=byId('p15AdvancedAnalysis');if(dr)dr.open=true;focusTarget('#p15AdvancedAnalysis');};
}
function prepareCoreResults(){
  var totals=byId('totalsSection'),hei=byId('heiPanel');if(!totals||!hei||byId('p15CoreResults'))return;
  var core=makeDrawer('p15CoreResults','Основной итог рациона','КБЖУ, дневные нормы, HEI и ключевые рекомендации. Полные таблицы открываются только по вашему действию.','Основной результат');
  var overview=byId('p15ResultOverview'),anchor=overview||byId('p15DecisionSummary');
  anchor.parentNode.insertBefore(core,anchor.nextSibling);moveInto(core,totals);moveInto(core,hei);
  var norms=totals.querySelector('details.norms');if(norms){norms.open=false;norms.removeAttribute('open');norms.addEventListener('toggle',function(){if(norms.open)norms.setAttribute('data-p15-user-opened','1');});}
  var recs=byId('heiRecs');if(recs&&!byId('p15HeiRecommendations')){
    var recDrawer=el('details',{id:'p15HeiRecommendations',className:'fold p15-hei-recommendations'});
    recDrawer.innerHTML='<summary><strong>Все рекомендации HEI</strong><span>Открыть подробные карточки</span></summary><div class="p15-hei-recommendations__body"></div>';
    recs.parentNode.insertBefore(recDrawer,recs);recDrawer.querySelector('.p15-hei-recommendations__body').appendChild(recs);
  }
}
function reorganize(){
  prepareSearchResults();
  var search=byId('globalSearchSection'),ration=byId('rationSection'),geminiImport=byId('geminiRationImportSection');
  if(search&&ration&&geminiImport&&!byId('p15AlternativeInput')){
    var alt=makeDrawer('p15AlternativeInput','Другие способы добавить рацион','Фото, аудио и распознавание через Gemini. Каждый результат требует проверки перед добавлением.','Дополнительный ввод');
    search.parentNode.insertBefore(alt,ration);moveInto(alt,geminiImport);
  }
  prepareCoreResults();
  var core=byId('p15CoreResults'),diet=byId('dietAnalysisProfilePanel'),quality=byId('dataQualityPanel'),harvard=byId('strictHarvardPlateDetails');
  if(core&&diet&&!byId('p15AdvancedAnalysis')){
    var advanced=makeDrawer('p15AdvancedAnalysis','Расширенный анализ и методика','Матрица качества и структуры, Гарвардская тарелка, покрытие данных и диагностические пояснения.','После основного итога');
    core.parentNode.insertBefore(advanced,core.nextSibling);moveInto(advanced,diet);moveInto(advanced,harvard);moveInto(advanced,quality);
  }
  var ai=byId('geminiAiSection'),actions=byId('globalActions');
  if(ai&&actions&&!byId('p15AiPlannerDrawer')){
    var aiDrawer=makeDrawer('p15AiPlannerDrawer','ИИ-помощник по перестройке рациона','Варианты изменений с повторным расчётом; открывайте после проверки основного итога.','Необязательно');
    actions.parentNode.insertBefore(aiDrawer,actions);moveInto(aiDrawer,ai);
  }
  var extra=byId('additionalToolsSection'),advancedDrawer=byId('p15AdvancedAnalysis'),aiD=byId('p15AiPlannerDrawer');
  if(extra&&advancedDrawer&&aiD&&extra.nextSibling!==aiD)aiD.parentNode.insertBefore(extra,aiD);
}
function markDeferred(){
  var selectors=contract&&contract.progressive_disclosure&&contract.progressive_disclosure.requires_ration||[];
  selectors.forEach(function(selector){var node=d.querySelector(selector);if(node)node.classList.add('p15-requires-ration');});
}
function announce(message){var node=byId('p15DecisionMessage');if(node&&message)node.textContent=message;}
function setAction(button,label,target,handler){
  if(!button)return;button.textContent=label;button.hidden=false;button.onclick=function(){if(handler)handler();else focusTarget(target);};
}
function updateWorkflow(nReady,rReady){
  var states={profile:nReady?'done':'active',ration:rReady?'done':(nReady?'active':'available'),analysis:rReady?'active':'locked',action:rReady?'available':'locked'};
  Array.prototype.slice.call(d.querySelectorAll('[data-p15-stage]')).forEach(function(item){
    var id=item.getAttribute('data-p15-stage'),state=states[id]||'available',link=item.querySelector('.p15-workflow__step'),label=item.querySelector('.p15-workflow__state');
    item.setAttribute('data-state',state);if(link){link.setAttribute('data-state',state);if(state==='active')link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');if(state==='locked')link.setAttribute('aria-disabled','true');else link.removeAttribute('aria-disabled');}
    if(label)label.textContent=state==='done'?'Готово':state==='active'?'Сейчас':state==='locked'?'Пока недоступно':'Доступно';
  });
}
function refresh(){
  refreshTimer=null;if(!initialized)return;
  var nReady=needsReady(),rows=rationRows(),rReady=rows.length>0,body=d.body;
  if(rows.length>lastRationCount&&rows.length>0){
    var searchDrawer=byId('p15SearchResultsDrawer');if(searchDrawer)searchDrawer.open=false;
    var compact=byId('needsCompact'),toggle=byId('v40NeedsToggle');if(compact&&toggle&&!compact.classList.contains('v40-needs-collapsed')){try{toggle.click();}catch(_){}}
  }
  body.classList.toggle('p15-needs-ready',nReady);body.classList.toggle('p15-needs-pending',!nReady);
  body.classList.toggle('p15-ration-ready',rReady);body.classList.toggle('p15-ration-empty',!rReady);
  var nChip=byId('p15NeedsChip'),rChip=byId('p15RationChip'),message=byId('p15DecisionMessage'),primary=byId('p15PrimaryAction'),secondary=byId('p15SecondaryAction');
  if(nChip){nChip.textContent=nReady?'Потребности: рассчитаны':'Потребности: не рассчитаны';nChip.setAttribute('data-ready',nReady?'true':'false');}
  if(rChip){rChip.textContent=rReady?'Рацион: '+rows.length+' '+(rows.length===1?'позиция':rows.length<5?'позиции':'позиций'):'Рацион: пуст';rChip.setAttribute('data-ready',rReady?'true':'false');}
  if(!nReady){
    if(message)message.textContent='Сначала рассчитайте ориентиры потребностей — так итог рациона будет сравниваться с вашим профилем, а не с обезличенной шкалой.';
    setAction(primary,'Рассчитать потребности','#needs');
    setAction(secondary,'Продолжить без расчёта','#globalSearchInput');
  }else if(!rReady){
    if(message)message.textContent='Ориентиры готовы. Добавьте первый продукт через быстрый поиск — подробные результаты откроются автоматически.';
    setAction(primary,'Добавить первый продукт','#globalSearchInput');
    setAction(secondary,'Добавить по фото или аудио',null,function(){var dr=byId('p15AlternativeInput');if(dr){dr.open=true;focusTarget('#p15AlternativeInput');}});
  }else{
    if(message)message.textContent='Рацион собран. Сначала проверьте итоговые нутриенты и основные отклонения; расширенные матрицы и AI-коррекция остаются вторым уровнем.';
    setAction(primary,'Посмотреть итог',null,function(){var dr=byId('p15CoreResults');if(dr)dr.open=true;focusTarget('#totalsSection');});
    setAction(secondary,'Открыть расширенный анализ',null,function(){var dr=byId('p15AdvancedAnalysis');if(dr){dr.open=true;focusTarget('#p15AdvancedAnalysis');}});
  }
  var overviewRation=byId('p15OverviewRation'),overviewRationNote=byId('p15OverviewRationNote'),overviewHei=byId('p15OverviewHei'),overviewQuality=byId('p15OverviewQuality');
  if(overviewRation)overviewRation.textContent=rReady?(rows.length+' '+(rows.length===1?'позиция':rows.length<5?'позиции':'позиций')):'—';
  if(overviewRationNote){var kpi=text(byId('rationKpiStrip'));overviewRationNote.textContent=kpi&&kpi!=='Рацион пока пуст'?kpi.slice(0,120):'Добавьте продукты';}
  if(overviewHei){var ht=text(byId('heiSummary')),hm=ht.match(/HEI[^0-9]*(\d+(?:[.,]\d+)?)/i);overviewHei.textContent=hm?hm[1].replace(',','.')+' / 100':'Рассчитывается';}
  if(overviewQuality){var qt=text(byId('dataQualitySummary'));overviewQuality.textContent=/высок/i.test(qt)?'Высокая':/низк/i.test(qt)?'Низкая':qt&&qt.length>4?'Средняя':'Оценивается';}
  lastRationCount=rows.length;
  updateWorkflow(nReady,rReady);
}
function scheduleRefresh(){if(refreshTimer)return;refreshTimer=w.setTimeout(refresh,60);}
function bindRefresh(){
  var ration=byId('rationBody'),needs=byId('needs_out');
  if(w.MutationObserver){
    if(ration)new MutationObserver(scheduleRefresh).observe(ration,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['value','class','hidden']});
    if(needs)new MutationObserver(scheduleRefresh).observe(needs,{childList:true,subtree:true,characterData:true});
  }
  d.addEventListener('input',scheduleRefresh,true);d.addEventListener('change',scheduleRefresh,true);d.addEventListener('click',function(event){
    var target=event.target;if(target&&(target.id==='needs_calc_btn'||target.closest&&target.closest('#rationSection,#globalSearchSection')))w.setTimeout(scheduleRefresh,120);
  },true);
}
function audit(){
  var required=['p15Workflow','p15DecisionSummary','p15ResultOverview','p15CoreResults','p15SearchResultsDrawer','p15AlternativeInput','p15AdvancedAnalysis','p15AiPlannerDrawer'];
  var missing=required.filter(function(id){return !byId(id);});
  var stageCount=d.querySelectorAll('[data-p15-stage]').length;
  return {ok:missing.length===0&&stageCount===4,version:VERSION,contractVersion:apiContract&&apiContract.version||null,missing:missing,stages:stageCount,needsReady:needsReady(),rationRows:rationRows().length};
}
function init(){
  if(initialized)return;initialized=true;d.documentElement.setAttribute('data-ux-release',VERSION);d.body.classList.add('p15-ux-active');
  buildWorkflow();buildDecisionSummary();buildResultOverview();reorganize();markDeferred();bindRefresh();refresh();
  w.setTimeout(refresh,500);
}
w.NutritionUxP15={version:VERSION,init:init,refresh:refresh,audit:audit,state:function(){return {needsReady:needsReady(),rationRows:rationRows().length};}};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
