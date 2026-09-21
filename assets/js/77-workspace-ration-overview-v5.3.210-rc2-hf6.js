/* Nutrition Calculator v5.3.210 RC2 HF6
 * First complete workspace slice: compact ration workflow + concise analysis overview.
 * Reads the existing application state and rendered calculation results; it does not
 * replace formulas, product data, HEI or nutrient calculations.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf6-workspace-slice';
  var initialized=false;
  var refreshTimer=0;
  var mutationObservers=[];
  var HEI_LABELS={
    fruits_total:'Фрукты в целом',fruits_whole:'Цельные фрукты',vegetables_total:'Овощи',greens_beans:'Зелень и бобовые',
    grains_whole:'Цельные злаки',dairy:'Молочные продукты',protein_total:'Источники белка',seafood_plant:'Рыба, морепродукты и растительный белок',
    fatty_acids_ratio:'Соотношение жирных кислот',grains_refined:'Рафинированные злаки',sodium_g:'Натрий',added_sugars_pct:'Добавленный сахар',sat_fats_pct:'Насыщённые жиры'
  };
  var GRADE_LABELS={A:'A — очень высокое соответствие',B:'B — высокое соответствие',C:'C — среднее соответствие',D:'D — низкое соответствие',F:'F — очень низкое соответствие'};

  function byId(id){return d.getElementById(id);}
  function text(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim():'';}
  function num(value,fallback){var n=Number(value);return isFinite(n)?n:(fallback==null?0:fallback);}
  function fmt(value,digits){var n=Number(value);if(!isFinite(n))return '—';return n.toLocaleString('ru-RU',{maximumFractionDigits:digits==null?1:digits,minimumFractionDigits:0});}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function plural(count,one,few,many){var n=Math.abs(count)%100,n1=n%10;if(n>10&&n<20)return many;if(n1>1&&n1<5)return few;if(n1===1)return one;return many;}
  function route(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'';}catch(_){return '';}}
  function workspace(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().mode==='workspace':false;}catch(_){return false;}}
  function stateItems(){try{return w.State&&typeof w.State.get==='function'?w.State.get().filter(function(item){return item&&num(item.grams)>0;}):[];}catch(_){return [];}}

  function createRationSummary(){
    var context=byId('navigationShellContext');
    if(!context||byId('workspaceRationInlineSummary'))return;
    var section=d.createElement('section');
    section.id='workspaceRationInlineSummary';section.className='workspace-ration-inline';section.setAttribute('aria-label','Краткие итоги текущего рациона');
    section.innerHTML=''+
      '<div class="workspace-ration-inline__head"><div><span>Текущий рацион</span><strong id="workspaceRationTitle">Рацион пока пуст</strong><small id="workspaceRationStatus">Добавьте первый продукт через поиск ниже.</small></div><button type="button" class="workspace-ration-inline__attention" id="workspaceRationAttention">Перейти к анализу</button></div>'+
      '<div class="workspace-ration-inline__metrics" aria-live="polite">'+
        '<div><span>Калории</span><strong id="workspaceMetricKcal">—</strong><small id="workspaceMetricKcalTarget">ориентир не задан</small></div>'+
        '<div><span>Белки</span><strong id="workspaceMetricProtein">—</strong><small>г</small></div>'+
        '<div><span>Жиры</span><strong id="workspaceMetricFat">—</strong><small>г</small></div>'+
        '<div><span>Углеводы</span><strong id="workspaceMetricCarbs">—</strong><small>г</small></div>'+
      '</div>'+
      '<div class="workspace-ration-inline__actions"><button type="button" id="workspaceFocusSearch">Добавить продукт</button><button type="button" class="secondary" id="workspaceOpenRation">К составу рациона</button></div>';
    context.appendChild(section);
  }

  function createRationEmptyState(){
    var ration=byId('rationSection'),table=byId('rationTable');
    if(!ration||!table||byId('workspaceRationEmpty'))return;
    var empty=d.createElement('div');empty.id='workspaceRationEmpty';empty.className='workspace-ration-empty';
    empty.innerHTML='<strong>Рацион пока пуст</strong><p>Найдите продукт выше, укажите количество и добавьте его. Итоги обновятся автоматически.</p><button type="button" data-workspace-focus-search>Найти первый продукт</button>';
    ration.insertBefore(empty,table);
  }

  function createSecondaryDisclosure(){
    var main=byId('mainContent'),needs=byId('needsCompact');
    if(!main||!needs||byId('workspaceRationSecondary'))return;
    var details=d.createElement('details');details.id='workspaceRationSecondary';details.className='card workspace-ration-secondary';
    details.innerHTML='<summary><span><strong>Другие способы добавления и инструменты</strong><small>Фото, голос, импорт, каталог, распределение по приёмам пищи</small></span><b>Открыть</b></summary><div class="workspace-ration-secondary__note">Дополнительные блоки откроются ниже. Обычный поиск остаётся основным способом составить рацион.</div>';
    main.insertBefore(details,needs);
    details.addEventListener('toggle',function(){d.documentElement.setAttribute('data-workspace-secondary-open',details.open?'1':'0');if(details.open){setTimeout(function(){var target=byId('geminiRationImportSection')||byId('rc2AlternativeInput')||byId('additionalToolsSection');if(target){try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){target.scrollIntoView(true);}}},80);}});
  }

  function createOverview(){
    var main=byId('mainContent'),totals=byId('totalsSection');
    if(!main||!totals||byId('workspaceOverviewPanel'))return;
    var panel=d.createElement('section');panel.id='workspaceOverviewPanel';panel.className='card workspace-overview';panel.hidden=true;panel.setAttribute('data-navshell-original-hidden','1');panel.setAttribute('aria-labelledby','workspaceOverviewTitle');
    panel.innerHTML=''+
      '<div class="workspace-overview__head"><div><span>Краткий итог</span><h2 id="workspaceOverviewTitle">Что сейчас происходит с рационом</h2><p id="workspaceOverviewConclusion">Добавьте продукты, чтобы получить краткий разбор.</p></div><button type="button" class="secondary" data-workspace-route="ration">Изменить рацион</button></div>'+
      '<div class="workspace-overview__metrics" aria-live="polite">'+
        '<article><span>Энергия</span><strong id="workspaceOverviewEnergy">—</strong><small id="workspaceOverviewEnergyNote">цель не рассчитана</small></article>'+
        '<article><span>HEI-2020</span><strong id="workspaceOverviewHei">—</strong><small id="workspaceOverviewHeiNote">нет расчёта</small></article>'+
        '<article><span>Структура</span><strong id="workspaceOverviewStructure">—</strong><small>из 100</small></article>'+
        '<article><span>Достоверность</span><strong id="workspaceOverviewConfidence">—</strong><small id="workspaceOverviewConfidenceNote">ожидает данных</small></article>'+
      '</div>'+
      '<section class="workspace-overview__issues" aria-labelledby="workspaceOverviewIssuesTitle"><div class="workspace-overview__section-head"><div><span>Приоритеты</span><h3 id="workspaceOverviewIssuesTitle">На что обратить внимание</h3></div><small id="workspaceOverviewIssueCount">—</small></div><div id="workspaceOverviewIssueList"></div></section>'+
      '<div class="workspace-overview__quality" id="workspaceOverviewQuality"></div>'+
      '<div class="workspace-overview__actions"><button type="button" data-workspace-route="analysis/nutrients">Все нутриенты</button><button type="button" class="secondary" data-workspace-route="analysis/hei">Открыть HEI</button><button type="button" class="secondary" data-workspace-route="correction">Перейти к улучшению</button></div>';
    main.insertBefore(panel,totals);
  }

  function registerWorkspaceNodes(){
    if(!w.NavigationShellV1)return;
    if(typeof w.NavigationShellV1.registerManaged==='function'){
      w.NavigationShellV1.registerManaged('workspaceOverviewPanel',true);
      w.NavigationShellV1.registerManaged('workspaceRationSecondary',true);
    }
    if(typeof w.NavigationShellV1.refresh==='function')w.NavigationShellV1.refresh();
    else if(typeof w.NavigationShellV1.navigate==='function')w.NavigationShellV1.navigate(route()||'ration');
  }

  function parseKpi(){
    var raw=text(byId('rationKpiStrip'));
    var result={count:stateItems().length,kcal:NaN,protein:NaN,fat:NaN,carbs:NaN};
    var m=raw.match(/(\d+)\s*поз[^·]*·\s*([\d\s.,]+)\s*ккал\s*·\s*Б\s*([\d\s.,]+)\s*·\s*Ж\s*([\d\s.,]+)\s*·\s*У\s*([\d\s.,]+)/i);
    function read(v){return Number(String(v||'').replace(/\s/g,'').replace(',','.'));}
    if(m){result.count=read(m[1]);result.kcal=read(m[2]);result.protein=read(m[3]);result.fat=read(m[4]);result.carbs=read(m[5]);}
    return result;
  }

  function targetValue(id){var el=byId(id),n=Number(el&&String(el.value||'').replace(',','.'));return isFinite(n)&&n>0?n:NaN;}
  function confidenceRu(value){value=String(value||'').toUpperCase();return value==='HIGH'?'Высокая':value==='MEDIUM'?'Средняя':value==='LOW'?'Ограниченная':'—';}
  function issue(kind,title,body,action,score){return {kind:kind,title:title,body:body,action:action||'',score:num(score)};}
  function currentHei(){
    var model=w.__lastHEIModel,profile=w.__lastDietAnalysisProfile||{},assessment=w.__lastDietAssessment||{};
    if(model&&model.components&&isFinite(num(model.total,NaN)))return model;
    if(profile.heiModel&&profile.heiModel.components&&isFinite(num(profile.heiModel.total,NaN)))return profile.heiModel;
    return assessment.hei||{};
  }

  function macroIssues(kpi){
    var out=[],energyTarget=targetValue('normInput-kcal'),energy=num(kpi.kcal,NaN),energyRatio=isFinite(energyTarget)&&energyTarget>0&&isFinite(energy)?energy/energyTarget:NaN;
    if(isFinite(energyRatio)){
      if(energyRatio<.7)out.push(issue('low','Рацион пока заметно ниже ориентира по энергии',fmt(energy,0)+' ккал при ориентире '+fmt(energyTarget,0)+' ккал.','Сначала завершите ввод рациона; отдельные БЖУ пока не выводятся как самостоятельные проблемы.',110));
      else if(energyRatio>1.25)out.push(issue('high','Энергия заметно выше ориентира',fmt(energy,0)+' ккал при ориентире '+fmt(energyTarget,0)+' ккал.','Проверьте количества и продукты с наибольшим вкладом.',105));
    }
    /* When the ration contains less than 70% of target energy, low protein, fat and
       carbohydrate values mostly repeat the same incompleteness signal. */
    if(isFinite(energyRatio)&&energyRatio<.7)return out;
    [
      {key:'protein',title:'Белки',target:targetValue('normInput-protein_g'),unit:'г'},
      {key:'fat',title:'Жиры',target:targetValue('normInput-fat_g'),unit:'г'},
      {key:'carbs',title:'Углеводы',target:targetValue('normInput-carbs_g'),unit:'г'}
    ].forEach(function(spec){var actual=num(kpi[spec.key],NaN),target=spec.target;if(!isFinite(actual)||!isFinite(target)||!(target>0))return;var ratio=actual/target;if(ratio<.7)out.push(issue('low',spec.title+' заметно ниже ориентира',fmt(actual,1)+' '+spec.unit+' при ориентире '+fmt(target,1)+' '+spec.unit+'.','Откройте нутриенты и проверьте вклад продуктов.',80+Math.round((1-ratio)*20)));else if(ratio>1.25)out.push(issue('high',spec.title+' заметно выше ориентира',fmt(actual,1)+' '+spec.unit+' при ориентире '+fmt(target,1)+' '+spec.unit+'.','Проверьте продукты с наибольшим вкладом.',85+Math.round((ratio-1)*15)));});
    return out;
  }

  function assessmentIssues(){
    var a=w.__lastDietAssessment||{},out=[],structure=[],comps=currentHei().components||{};
    (a.upperLimitFlags||[]).forEach(function(f){out.push(issue('critical',f.title||'Превышение верхнего уровня',fmt(f.value,1)+' '+(f.unit||'')+' при границе '+fmt(f.threshold,1)+' '+(f.unit||'')+'.','Откройте подробности и проверьте источники.',140));});
    (a.guidelineFlags||[]).forEach(function(f){out.push(issue('high',f.title||'Показатель выше ориентира',fmt(f.value,1)+' '+(f.unit||'')+' при ориентире '+fmt(f.threshold,1)+' '+(f.unit||'')+'.','Откройте подробности и проверьте основные вкладчики.',125));});
    Object.keys(comps).forEach(function(key){var c=comps[key],pct=num(c&&c.scorePct,100);if(pct>=50)return;structure.push(issue('structure','Низкий балл: «'+(HEI_LABELS[key]||key)+'»','Набрано '+fmt(c.points,1)+' из '+fmt(c.maxPoints,0)+' баллов HEI.','Откройте HEI, чтобы увидеть порог и вкладчики.',70+num(c.maxPoints,0)+(100-pct)/10));});
    structure.sort(function(a,b){return b.score-a.score;});
    return out.concat(structure.slice(0,3));
  }

  function priorityIssues(kpi){
    if(!kpi.count)return [];
    var list=macroIssues(kpi).concat(assessmentIssues()),seen={},dedup=[];
    list.sort(function(a,b){return b.score-a.score;});
    list.forEach(function(item){var key=item.title.toLowerCase();if(!seen[key]){seen[key]=1;dedup.push(item);}});
    return dedup;
  }

  function renderIssues(kpi){
    var dedup=priorityIssues(kpi).slice(0,5);
    var host=byId('workspaceOverviewIssueList'),count=byId('workspaceOverviewIssueCount');
    if(count)count.textContent=dedup.length?dedup.length+' '+plural(dedup.length,'пункт','пункта','пунктов'):'нет выраженных отклонений';
    if(!host)return;
    if(!kpi.count){host.innerHTML='<div class="workspace-overview__empty"><strong>Рацион пока пуст</strong><p>Добавьте продукты — обзор соберёт до пяти наиболее важных отклонений.</p><button type="button" data-workspace-route="ration">Перейти к рациону</button></div>';return;}
    if(!dedup.length){host.innerHTML='<article class="workspace-issue is-ok"><span aria-hidden="true">✓</span><div><strong>Выраженных отклонений по доступным данным не найдено</strong><p>Откройте подробные нутриенты и HEI, чтобы проверить весь расчёт.</p></div></article>';return;}
    host.innerHTML=dedup.map(function(item,index){return '<article class="workspace-issue is-'+esc(item.kind)+'"><span aria-hidden="true">'+(index+1)+'</span><div><strong>'+esc(item.title)+'</strong><p>'+esc(item.body)+'</p>'+(item.action?'<small>'+esc(item.action)+'</small>':'')+'</div></article>';}).join('');
  }

  function refreshRation(){
    var kpi=parseKpi(),count=kpi.count,target=targetValue('normInput-kcal');
    var title=byId('workspaceRationTitle'),status=byId('workspaceRationStatus'),attention=byId('workspaceRationAttention');
    if(title)title.textContent=count?count+' '+plural(count,'позиция','позиции','позиций'):'Рацион пока пуст';
    if(status){if(!count)status.textContent='Добавьте первый продукт через поиск ниже.';else if(isFinite(target)&&isFinite(kpi.kcal)){var pct=Math.round(kpi.kcal/target*100);status.textContent=fmt(kpi.kcal,0)+' из '+fmt(target,0)+' ккал · '+pct+'% от ориентира';}else status.textContent='Краткие итоги обновляются после каждого изменения.';}
    if(byId('workspaceMetricKcal'))byId('workspaceMetricKcal').textContent=isFinite(kpi.kcal)?fmt(kpi.kcal,0)+' ккал':'—';
    if(byId('workspaceMetricKcalTarget'))byId('workspaceMetricKcalTarget').textContent=isFinite(target)?'ориентир '+fmt(target,0)+' ккал':'ориентир не задан';
    if(byId('workspaceMetricProtein'))byId('workspaceMetricProtein').textContent=isFinite(kpi.protein)?fmt(kpi.protein,1):'—';
    if(byId('workspaceMetricFat'))byId('workspaceMetricFat').textContent=isFinite(kpi.fat)?fmt(kpi.fat,1):'—';
    if(byId('workspaceMetricCarbs'))byId('workspaceMetricCarbs').textContent=isFinite(kpi.carbs)?fmt(kpi.carbs,1):'—';
    var issueCount=count?priorityIssues(kpi).length:0,shown=Math.min(5,issueCount);
    if(attention){attention.textContent=count?(shown?(issueCount>5?'5 главных приоритетов в анализе':shown+' '+plural(shown,'приоритет в анализе','приоритета в анализе','приоритетов в анализе')):'Открыть краткий анализ'):'Перейти к анализу';attention.classList.toggle('has-attention',shown>0);}
    var empty=byId('workspaceRationEmpty'),table=byId('rationTable');if(empty)empty.hidden=count>0;if(table)table.classList.toggle('workspace-ration-table-empty',count===0);
  }

  function overviewConclusion(kpi,target,hei){
    if(!kpi.count)return 'Добавьте продукты, чтобы получить краткий разбор.';
    var ratio=isFinite(target)&&target>0&&isFinite(kpi.kcal)?kpi.kcal/target:NaN,issueCount=priorityIssues(kpi).length;
    if(isFinite(ratio)&&ratio<.7)return 'Рацион заполнен примерно на '+Math.round(ratio*100)+'% от ориентира по энергии. HEI и структура пока дают предварительный сигнал: сначала добавьте остальные продукты.';
    if(isFinite(ratio)&&ratio>1.25)return 'Энергия выше ориентира примерно на '+Math.round((ratio-1)*100)+'%. Проверьте количества, затем разберите остальные приоритеты.';
    if(issueCount)return 'Обзор выделяет '+Math.min(5,issueCount)+' '+plural(Math.min(5,issueCount),'главный приоритет','главных приоритета','главных приоритетов')+'. Подробные значения остаются в разделах «Нутриенты» и «HEI».';
    if(isFinite(num(hei.total,NaN)))return 'По доступным данным выраженных отклонений в кратком обзоре не найдено. Для полной проверки откройте нутриенты и HEI.';
    return 'Краткий разбор обновлён по текущему составу рациона.';
  }

  function refreshOverview(){
    var kpi=parseKpi(),target=targetValue('normInput-kcal'),a=kpi.count?(w.__lastDietAssessment||{}):{},profile=kpi.count?(w.__lastDietAnalysisProfile||{}):{},hei=kpi.count?currentHei():{};
    if(byId('workspaceOverviewConclusion'))byId('workspaceOverviewConclusion').textContent=overviewConclusion(kpi,target,hei);
    if(byId('workspaceOverviewEnergy'))byId('workspaceOverviewEnergy').textContent=isFinite(kpi.kcal)?fmt(kpi.kcal,0)+' ккал':'—';
    if(byId('workspaceOverviewEnergyNote'))byId('workspaceOverviewEnergyNote').textContent=isFinite(target)&&isFinite(kpi.kcal)?Math.round(kpi.kcal/target*100)+'% от ориентира':(isFinite(target)?'ориентир '+fmt(target,0)+' ккал':'цель не рассчитана');
    if(byId('workspaceOverviewHei'))byId('workspaceOverviewHei').textContent=isFinite(num(hei.total,NaN))?fmt(hei.total,0)+'/100':'—';
    if(byId('workspaceOverviewHeiNote'))byId('workspaceOverviewHeiNote').textContent=hei.grade?(GRADE_LABELS[hei.grade]||('категория '+hei.grade)):'нет расчёта';
    if(byId('workspaceOverviewStructure'))byId('workspaceOverviewStructure').textContent=isFinite(num(profile.dailyStructure,NaN))?fmt(profile.dailyStructure,0):'—';
    var confidence=a.confidence&&a.confidence.overall;
    if(byId('workspaceOverviewConfidence'))byId('workspaceOverviewConfidence').textContent=confidenceRu(confidence);
    var limitations=(a.limitations||a.notEvaluable||[]).length;
    if(byId('workspaceOverviewConfidenceNote'))byId('workspaceOverviewConfidenceNote').textContent=limitations?limitations+' '+plural(limitations,'ограничение данных','ограничения данных','ограничений данных'):'существенных ограничений не отмечено';
    renderIssues(kpi);
    var quality=byId('workspaceOverviewQuality');
    if(quality){if(!kpi.count)quality.innerHTML='<strong>Качество исходных данных</strong><span>Будет оценено после добавления продуктов.</span>';else quality.innerHTML='<strong>Качество исходных данных: '+esc(confidenceRu(confidence).toLowerCase())+'</strong><span>'+(limitations?esc('Ограничений или неоцениваемых показателей: '+limitations+'. Они не считаются нулевыми.'):'По ключевым ограничениям доступных данных достаточно для текущей оценки.')+'</span>';}
  }

  function updateSkipLinks(){
    var links=d.querySelectorAll('body>.skip-link'),first=links[0],second=links[1],isWorkspace=workspace();
    [first,second].forEach(function(link){if(!link)return;if(!link.getAttribute('data-workspace-original-href')){link.setAttribute('data-workspace-original-href',link.getAttribute('href')||'');link.setAttribute('data-workspace-original-text',text(link));}});
    if(isWorkspace){if(first){first.setAttribute('href','#globalSearchSection');first.textContent='Перейти к поиску продуктов';}if(second){second.setAttribute('href','#rationSection');second.textContent='Перейти к составу рациона';}}
    else{[first,second].forEach(function(link){if(!link)return;link.setAttribute('href',link.getAttribute('data-workspace-original-href')||'#mainContent');link.textContent=link.getAttribute('data-workspace-original-text')||'Перейти к содержимому';});}
  }
  function collapseNeedsAfterCalculation(){
    if(!workspace()||route()!=='ration')return;
    w.setTimeout(function(){var toggle=byId('v40NeedsToggle');if(toggle&&toggle.getAttribute('aria-expanded')==='true'){try{toggle.click();}catch(_){}}},120);
  }
  function refresh(){updateSkipLinks();refreshRation();refreshOverview();}
  function schedule(){w.clearTimeout(refreshTimer);refreshTimer=w.setTimeout(refresh,45);}
  function focusSearch(){var input=byId('globalSearchInput');if(!input)return;if(w.NavigationShellV1&&typeof w.NavigationShellV1.navigate==='function')w.NavigationShellV1.navigate('ration','globalSearchSection');setTimeout(function(){try{input.focus({preventScroll:true});}catch(_){input.focus();}},80);}

  function bind(){
    d.addEventListener('click',function(e){
      var addButton=e.target&&e.target.closest?e.target.closest('#globalResults button[data-role="add-search"],#globalResults button[data-role="add"]'):null;
      if(addButton){w.setTimeout(function(){var input=byId('globalSearchInput');if(input){input.value='';try{input.dispatchEvent(new Event('input',{bubbles:true}));}catch(_){}}if(workspace()&&route()==='ration'&&w.NavigationShellV1)w.NavigationShellV1.navigate('ration','rationSection');},100);return;}
      var target=e.target&&e.target.closest?e.target.closest('[data-workspace-route]'):null;
      if(target&&w.NavigationShellV1){e.preventDefault();w.NavigationShellV1.navigate(target.getAttribute('data-workspace-route'));return;}
      if(e.target&&e.target.closest&&(e.target.closest('#workspaceFocusSearch')||e.target.closest('[data-workspace-focus-search]'))){e.preventDefault();focusSearch();return;}
      if(e.target&&e.target.closest&&e.target.closest('#workspaceOpenRation')){e.preventDefault();if(w.NavigationShellV1)w.NavigationShellV1.navigate('ration','rationSection');return;}
      if(e.target&&e.target.closest&&e.target.closest('#workspaceRationAttention')){e.preventDefault();if(w.NavigationShellV1)w.NavigationShellV1.navigate('analysis/overview');return;}
    },false);
    ['ration:changed','needs:computed','needs:changed','hei:rendered','diet:assessment-ready','diet:profile-rendered','app:ready','navigation-shell:route-changed','navigation-shell:mode-changed'].forEach(function(name){w.addEventListener(name,schedule,false);});
    w.addEventListener('needs:computed',collapseNeedsAfterCalculation,false);
    d.addEventListener('input',schedule,true);d.addEventListener('change',schedule,true);
    if(w.MutationObserver){['rationKpiStrip','rationBody','normInput-kcal','dietAnalysisMainConclusion','dietProfileStructureScore'].forEach(function(id){var node=byId(id);if(!node)return;try{var obs=new MutationObserver(schedule);obs.observe(node,{childList:true,subtree:true,characterData:true,attributes:true});mutationObservers.push(obs);}catch(_){}});}
  }

  function init(){
    if(initialized)return;initialized=true;
    createRationSummary();createRationEmptyState();createSecondaryDisclosure();createOverview();registerWorkspaceNodes();bind();schedule();
    w.NutritionWorkspaceSliceHF6={version:VERSION,refresh:refresh,getSummary:function(){var kpi=parseKpi(),a=w.__lastDietAssessment||{};return {version:VERSION,route:route(),workspace:workspace(),items:kpi.count,kcal:kpi.kcal,hei:a.hei&&a.hei.total,limitations:(a.limitations||[]).length};}};
    try{w.dispatchEvent(new CustomEvent('workspace-slice:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
