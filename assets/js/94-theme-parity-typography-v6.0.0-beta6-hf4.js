/* NutedScope / Nutrition Calculator v6.0.0 beta 6 hotfix 4.
 * Cross-theme information parity, HEI executive dashboard and typography completion.
 * Presentation and navigation only; calculations and source data remain untouched.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta6-hotfix4-theme-parity';
  var RELEASE='6.0.0-beta6-hotfix4';
  var timer=0,observer=null,lastModelKey='',lastHeiKey='';
  var ADEQUACY={fruits_total:1,fruits_whole:1,vegetables_total:1,greens_beans:1,grains_whole:1,dairy:1,protein_total:1,seafood_plant:1,fatty_acids_ratio:1};
  var MODERATION={grains_refined:1,sodium_g:1,added_sugars_pct:1,sat_fats_pct:1};

  function byId(id){return d.getElementById(id);}
  function closest(node,selector){return node&&node.closest?node.closest(selector):null;}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function num(v,f){var n=Number(v);return isFinite(n)?n:(f==null?NaN:f);}
  function fmt(v,digits){var n=num(v,NaN);return isFinite(n)?n.toLocaleString('ru-RU',{minimumFractionDigits:digits||0,maximumFractionDigits:digits||0}):'—';}
  function text(node,fallback){var s=node&&node.textContent?String(node.textContent).replace(/\s+/g,' ').trim():'';return s||fallback||'—';}
  function setText(node,value){if(node&&node.textContent!==String(value))node.textContent=String(value);}
  function setImportant(node,name,value){if(node&&node.style)node.style.setProperty(name,value,'important');}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function navigate(route,target){var api=shell();if(api&&typeof api.navigate==='function')api.navigate(route,target||'');}
  function emit(name,detail){try{w.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){} }
  function model(){try{return w.NutritionUIViewModel&&w.NutritionUIViewModel.get?w.NutritionUIViewModel.get():null;}catch(_){return null;}}
  function analysisVM(){try{return w.NutritionAnalysisWorkspaceHF7&&w.NutritionAnalysisWorkspaceHF7.getViewModel?w.NutritionAnalysisWorkspaceHF7.getViewModel():null;}catch(_){return null;}}
  function route(){var api=shell();try{return api&&api.getState?String(api.getState().route||''):String(d.documentElement.getAttribute('data-navigation-route')||'');}catch(_){return '';}}
  function scrollToNode(node){if(!node)return;try{node.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{node.scrollIntoView(true);}catch(__){}}}

  function syncRelease(){
    var root=d.documentElement;root.setAttribute('data-theme-parity-hotfix','4');root.setAttribute('data-ui-version',RELEASE);root.setAttribute('data-performance-release','v6-beta6-hotfix4-theme-parity');
    var badge=d.querySelector('#mainContent>header>.title .version-badge');if(badge)setText(badge,'v'+RELEASE);
    d.title='Калькулятор рациона Сергея Веснина — v6.0 beta 6 hotfix 4';w.__APP_DEPLOY_VERSION__='v'+RELEASE;
  }

  function stabilizeHeader(){
    var theme=byId('themeSwitcher'),status=byId('themeStatus'),options=theme&&theme.querySelector('.theme-switcher__options'),label=theme&&theme.querySelector('.theme-switcher__label');
    if(status){setImportant(status,'position','absolute');setImportant(status,'width','1px');setImportant(status,'height','1px');setImportant(status,'overflow','hidden');setImportant(status,'clip-path','inset(50%)');setImportant(status,'white-space','nowrap');}
    if(theme){setImportant(theme,'display','grid');setImportant(theme,'grid-template-columns','58px minmax(0,1fr)');setImportant(theme,'grid-template-rows','1fr');}
    if(label){setText(label,'Дизайн');setImportant(label,'grid-column','1');setImportant(label,'grid-row','1');setImportant(label,'width','auto');}
    if(options){setImportant(options,'grid-column','2');setImportant(options,'grid-row','1');setImportant(options,'display','grid');setImportant(options,'grid-template-columns','repeat(3,minmax(76px,1fr))');setImportant(options,'width','100%');}
    var buttons=theme?theme.querySelectorAll('.theme-switcher__option'):[],visible=['Modern','2-bit','Ivory'],full=['Современное оформление','Двухбитное оформление','Ivory & Brass — премиальное оформление'],i,span;
    for(i=0;i<buttons.length&&i<visible.length;i++){
      span=buttons[i].querySelector('span')||buttons[i];setText(span,visible[i]);buttons[i].setAttribute('aria-label',full[i]);buttons[i].setAttribute('title',full[i]);
      setImportant(buttons[i],'min-width','0');setImportant(buttons[i],'width','100%');setImportant(buttons[i],'white-space','nowrap');
    }
    var duplicate=byId('ivoryNavTheme');if(duplicate){duplicate.hidden=true;duplicate.setAttribute('aria-hidden','true');}
  }

  function groupState(group){
    if(!group||!group.total)return {code:'unknown',label:'Нет данных'};
    if(group.above>0)return {code:'above',label:group.above+' выше предела'};
    if(group.below>0)return {code:'below',label:group.below+' ниже ориентира'};
    if(group.review>0)return {code:'review',label:group.review+' требуют проверки'};
    if(group.target>0)return {code:'target',label:'В целевом диапазоне'};
    return {code:'unknown',label:'Не оценивается'};
  }

  function ensureSummaryMetrics(){
    var host=d.querySelector('#workspaceRationInlineSummary .workspace-ration-inline__metrics');if(!host)return;
    if(!byId('workspaceMetricHeiHF4')){
      var hei=d.createElement('div');hei.setAttribute('data-hf4-summary-metric','hei');hei.innerHTML='<span>HEI-2020</span><strong id="workspaceMetricHeiHF4">—</strong><small id="workspaceMetricHeiNoteHF4">качество</small>';host.appendChild(hei);
      var structure=d.createElement('div');structure.setAttribute('data-hf4-summary-metric','structure');structure.innerHTML='<span>Структура</span><strong id="workspaceMetricStructureHF4">—</strong><small>из 100</small>';host.appendChild(structure);
    }
  }

  function ensureParityDeck(){
    var context=byId('navigationShellContext'),summary=byId('workspaceRationInlineSummary'),deck=byId('themeParityRationHF4');if(!context)return;
    if(!deck){
      deck=d.createElement('section');deck.id='themeParityRationHF4';deck.className='theme-parity-ration-hf4';deck.setAttribute('aria-labelledby','themeParityRationTitleHF4');
      deck.innerHTML=''+
        '<div class="theme-parity-ration-hf4__head"><div><span>Краткая аналитика</span><h3 id="themeParityRationTitleHF4">Рацион одним взглядом</h3><p>Те же рабочие сведения, которые показывает премиальная тема: группы нутриентов, приоритеты, HEI и структура.</p></div><button type="button" class="secondary" data-hf4-route="analysis/overview">Открыть полный анализ</button></div>'+
        '<div class="theme-parity-ration-hf4__grid">'+
          '<article class="theme-parity-ration-hf4__card"><header><h4>Обзор нутриентов</h4><button type="button" class="secondary" data-hf4-route="analysis/nutrients">Таблица</button></header><div id="themeParityGroupsHF4" class="theme-parity-groups-hf4"></div></article>'+
          '<article class="theme-parity-ration-hf4__card"><header><h4>На что обратить внимание</h4><button type="button" class="secondary" data-hf4-route="analysis/overview">Подробнее</button></header><div id="themeParityIssuesHF4" class="theme-parity-issues-hf4"></div></article>'+
          '<article class="theme-parity-ration-hf4__card"><header><h4>Качество и структура</h4><button type="button" class="secondary" data-hf4-open-harvard>Тарелка</button></header><div class="theme-parity-score-hf4"><div><span>HEI-2020</span><strong id="themeParityHeiHF4">—</strong></div><div><span>Структура</span><strong id="themeParityStructureHF4">—</strong></div></div><p id="themeParityStructureNoteHF4" class="theme-parity-structure-note-hf4">Оценки появятся после расчёта рациона.</p><button type="button" class="secondary" data-hf4-open-matrix>Сводная матрица</button></article>'+
        '</div>';
      if(summary&&summary.parentNode===context&&summary.nextSibling)context.insertBefore(deck,summary.nextSibling);else context.appendChild(deck);
    }
    if(summary&&summary.parentNode===context&&summary.nextElementSibling!==deck)context.insertBefore(deck,summary.nextSibling);
  }

  function updateParityDeck(){
    var m=model();if(!m)return;
    setText(byId('workspaceMetricHeiHF4'),isFinite(num(m.analysis&&m.analysis.hei,NaN))?fmt(m.analysis.hei,0):'—');
    setText(byId('workspaceMetricStructureHF4'),isFinite(num(m.analysis&&m.analysis.structure,NaN))?fmt(m.analysis.structure,0):'—');
    setText(byId('themeParityHeiHF4'),isFinite(num(m.analysis&&m.analysis.hei,NaN))?fmt(m.analysis.hei,0)+'/100':'—');
    setText(byId('themeParityStructureHF4'),isFinite(num(m.analysis&&m.analysis.structure,NaN))?fmt(m.analysis.structure,0)+'/100':'—');
    var note='Оценки появятся после расчёта рациона.';
    if(!m.ration.empty&&isFinite(num(m.analysis&&m.analysis.structure,NaN)))note='Структура: '+fmt(m.analysis.structure,0)+' из 100. Нажмите «Сводная матрица», чтобы сопоставить её с качеством HEI.';
    setText(byId('themeParityStructureNoteHF4'),note);
    var groups=byId('themeParityGroupsHF4'),items=m.analysis&&m.analysis.nutrientGroups||[];
    if(groups){
      var gkey=JSON.stringify(items.map(function(g){return [g.key,g.targetPercent,g.below,g.review,g.above,g.total];}));
      if(groups.getAttribute('data-key')!==gkey){groups.setAttribute('data-key',gkey);groups.innerHTML=items.length?items.map(function(g){var s=groupState(g),pct=g.targetPercent==null?'—':g.targetPercent+'%';return '<button type="button" class="theme-parity-group-hf4 is-'+esc(s.code)+'" data-hf4-group="'+esc(g.key)+'"><span>'+esc(g.label)+'</span><strong>'+esc(pct)+'</strong><small>'+esc(s.label)+'</small></button>';}).join(''):'<div class="theme-parity-empty-hf4"><strong>Обзор появится после расчёта</strong><br><span>Добавьте продукты — группы обновятся автоматически.</span></div>';}
    }
    var issues=byId('themeParityIssuesHF4'),rows=m.analysis&&m.analysis.issues||[];
    if(issues){
      var ikey=JSON.stringify(rows.map(function(x){return [x.kind,x.title,x.body];}));
      if(issues.getAttribute('data-key')!==ikey){issues.setAttribute('data-key',ikey);issues.innerHTML=rows.length?rows.slice(0,4).map(function(x){return '<article class="theme-parity-issue-hf4 is-'+esc(x.kind||'neutral')+'"><i></i><div><strong>'+esc(x.title||'Показатель требует внимания')+'</strong><p>'+esc(x.body||'Откройте подробный анализ.')+'</p></div></article>';}).join(''):'<div class="theme-parity-empty-hf4"><strong>'+(m.ration.empty?'Рацион пока пуст':'Выраженных приоритетов не найдено')+'</strong><br><span>'+(m.ration.empty?'Добавьте первый продукт.':'Для полной проверки откройте анализ.')+'</span></div>';}
    }
  }

  function rowPct(row){var pct=num(row&&row.pct,NaN),max=num(row&&row.maxPoints,NaN),points=num(row&&row.points,NaN);return isFinite(pct)?pct:(isFinite(points)&&isFinite(max)&&max>0?points/max*100:NaN);}
  function scoreStatus(pct){if(!isFinite(pct))return {code:'unknown',label:'нет расчёта'};if(pct>=90)return {code:'target',label:'высокий балл'};if(pct>=50)return {code:'review',label:'можно улучшить'};return {code:'below',label:'приоритет'};}
  function sumRows(rows){var p=0,m=0;rows.forEach(function(r){p+=num(r.points,0);m+=num(r.maxPoints,0);});return {points:p,max:m,pct:m>0?p/m*100:NaN};}
  function interpretation(total){if(!isFinite(total))return {title:'HEI пока не рассчитан',body:'Добавьте продукты, чтобы получить общий балл и увидеть вклад всех компонентов.'};if(total>=80)return {title:'Высокое качество рациона',body:'Рацион в целом хорошо согласован с компонентами HEI. Смотрите на отдельные карточки, чтобы сохранить сильные стороны и найти оставшиеся точки роста.'};if(total>=60)return {title:'Умеренное качество рациона',body:'Базовая структура уже сформирована, но несколько компонентов заметно ограничивают итоговый балл.'};return {title:'Качество рациона требует улучшения',body:'Сначала работайте с двумя–тремя компонентами с самым низким процентом, а затем пересчитайте рацион.'};}

  function heiCard(row){
    var pct=rowPct(row),s=scoreStatus(pct),points=fmt(row.points,1)+' / '+fmt(row.maxPoints,0),percent=isFinite(pct)?Math.round(pct)+'%':'—';
    return '<button type="button" class="hei-card-hf4 is-'+esc(s.code)+'" data-hf2-hei-key="'+esc(row.key)+'" aria-label="'+esc(row.title)+': '+esc(points)+'"><span>'+esc(row.title)+'</span><strong>'+esc(points)+'</strong><i aria-hidden="true"><b style="width:'+(isFinite(pct)?Math.max(0,Math.min(100,pct)):0)+'%"></b></i><small>'+esc(percent)+' · '+esc(s.label)+'</small></button>';
  }

  function ensureHeiExecutive(){
    var section=byId('workspaceHeiDashboardHF2');if(!section)return;
    var vm=analysisVM(),rows=vm&&vm.hei&&vm.hei.rows||[];
    var sig=JSON.stringify(rows.map(function(r){return [r.key,r.points,r.maxPoints,r.pct,r.title];}));
    if(sig===lastHeiKey&&byId('workspaceHeiExecutiveHF4'))return;lastHeiKey=sig;
    section.setAttribute('data-hf4-enhanced','1');
    var executive=byId('workspaceHeiExecutiveHF4');if(!executive){executive=d.createElement('div');executive.id='workspaceHeiExecutiveHF4';section.appendChild(executive);}
    if(!rows.length){executive.innerHTML='<div class="hei-executive-hf4"><div class="hei-executive-hf4__summary" style="grid-column:1/-1"><span class="hei-executive-hf4__eyebrow">Общий вывод</span><h4>HEI пока не рассчитан</h4><p>Добавьте продукты — затем здесь появятся общий балл, две группы компонентов и приоритеты улучшения.</p></div></div>';return;}
    var adequacy=rows.filter(function(r){return ADEQUACY[r.key];}),moderation=rows.filter(function(r){return MODERATION[r.key];}),other=rows.filter(function(r){return !ADEQUACY[r.key]&&!MODERATION[r.key];});
    var total=sumRows(rows),a=sumRows(adequacy),m=sumRows(moderation),totalPoints=Math.max(0,Math.min(100,total.points)),interp=interpretation(totalPoints);
    var ranked=rows.slice().filter(function(r){return isFinite(rowPct(r));}).sort(function(x,y){return rowPct(x)-rowPct(y);});
    var weak=ranked.slice(0,3),strong=ranked.slice().reverse().slice(0,2);
    function list(items){return items.length?'<ul>'+items.map(function(r){return '<li>'+esc(r.title)+' — '+Math.round(rowPct(r))+'%</li>';}).join('')+'</ul>':'<span>Нет данных</span>';}
    function group(title,kicker,copy,items){if(!items.length)return '';return '<section class="hei-group-hf4"><div class="hei-group-hf4__head"><div><span>'+esc(kicker)+'</span><h4>'+esc(title)+'</h4></div><p>'+esc(copy)+'</p></div><div class="hei-group-hf4__cards">'+items.map(heiCard).join('')+'</div></section>';}
    executive.innerHTML=''+
      '<div class="hei-executive-hf4">'+
        '<section class="hei-executive-hf4__score"><div class="hei-score-dial-hf4" style="--hf4-score:'+totalPoints+'"><span><strong>'+fmt(totalPoints,0)+'</strong><small>из 100</small></span></div><div class="hei-executive-hf4__grade"><strong>'+esc(interp.title)+'</strong><span>'+rows.length+' компонентов рассчитано</span></div></section>'+
        '<section class="hei-executive-hf4__summary"><span class="hei-executive-hf4__eyebrow">Общий вывод</span><h4>'+esc(interp.title)+'</h4><p>'+esc(interp.body)+'</p><div class="hei-executive-hf4__stats"><div><span>Компоненты достаточности</span><strong>'+fmt(a.points,1)+' / '+fmt(a.max,0)+'</strong></div><div><span>Компоненты умеренности</span><strong>'+fmt(m.points,1)+' / '+fmt(m.max,0)+'</strong></div></div><div class="hei-executive-hf4__focus"><div><b>Главные точки роста</b>'+list(weak)+'</div><div><b>Сильные компоненты</b>'+list(strong)+'</div></div></section>'+
        '<p class="hei-executive-hf4__method"><strong>Как читать:</strong> более высокий балл всегда лучше. Для компонентов достаточности баллы растут при достаточном количестве полезных групп; для компонентов умеренности — при меньшей доле рафинированных злаков, натрия, добавленного сахара и насыщённых жиров.</p>'+
      '</div><div class="hei-groups-hf4">'+
        group('Компоненты достаточности','Что стоит набирать','Овощи, фрукты, цельные злаки, молочная и белковая группы, а также качество жиров.',adequacy)+
        group('Компоненты умеренности','Что стоит ограничивать','Чем ниже доля ограничиваемого компонента, тем выше его балл HEI.',moderation)+
        group('Другие компоненты','Дополнительная группа','Компоненты, не отнесённые к двум основным группам текущей методики.',other)+
      '</div>';
  }

  function placeFlagshipAnalysis(){
    var overview=byId('workspaceOverviewPanel'),matrix=byId('dietAnalysisProfilePanel'),harvard=byId('strictHarvardPlateDetails');
    if(!overview||!matrix||!overview.parentNode)return;
    if(matrix.previousElementSibling!==overview)overview.parentNode.insertBefore(matrix,overview.nextSibling);
    if(harvard&&harvard.previousElementSibling!==matrix)matrix.parentNode.insertBefore(harvard,matrix.nextSibling);
    matrix.setAttribute('data-hf4-flagship-order','2');if(harvard)harvard.setAttribute('data-hf4-flagship-order','3');
  }

  function openGroup(key){navigate('analysis/nutrients','workspaceNutrientsPanel');w.setTimeout(function(){var all=d.querySelector('#workspaceNutrientsPanel [data-nutrient-filter="all"]'),group=d.querySelector('#workspaceNutrientsPanel [data-nutrient-group="'+key+'"]');if(all)all.click();if(group)group.click();scrollToNode(byId('workspaceNutrientsPanel'));},120);}
  function onClick(event){
    var routeButton=closest(event.target,'[data-hf4-route]');if(routeButton){event.preventDefault();navigate(routeButton.getAttribute('data-hf4-route'));return;}
    var group=closest(event.target,'[data-hf4-group]');if(group){event.preventDefault();openGroup(group.getAttribute('data-hf4-group'));return;}
    var matrix=closest(event.target,'[data-hf4-open-matrix]');if(matrix){event.preventDefault();navigate('analysis/overview','dietAnalysisProfilePanel');w.setTimeout(function(){scrollToNode(byId('dietAnalysisProfilePanel'));},100);return;}
    var harvard=closest(event.target,'[data-hf4-open-harvard]');if(harvard){event.preventDefault();navigate('analysis/overview','strictHarvardPlateDetails');w.setTimeout(function(){var x=byId('strictHarvardPlateDetails');if(x)x.open=true;scrollToNode(x);},100);}
  }

  function refresh(){
    syncRelease();stabilizeHeader();ensureSummaryMetrics();ensureParityDeck();updateParityDeck();ensureHeiExecutive();placeFlagshipAnalysis();
    var m=model(),key=m?JSON.stringify({t:d.documentElement.getAttribute('data-theme'),r:route(),c:m.ration.count,h:m.analysis.hei,s:m.analysis.structure,g:(m.analysis.nutrientGroups||[]).map(function(x){return [x.key,x.targetPercent,x.below,x.review,x.above];}),i:(m.analysis.issues||[]).map(function(x){return x.title;})}):'';
    if(key!==lastModelKey){lastModelKey=key;emit('theme-parity-hotfix:updated',{version:VERSION,route:route()});}
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(refresh,70);}
  function init(){
    d.addEventListener('click',onClick,true);w.addEventListener('resize',schedule,false);w.addEventListener('orientationchange',schedule,false);
    ['app:ready','navigation-shell:ready','navigation-shell:route-changed','nutrition-ui:view-model','nutrition:themechange','ration:changed','hei:rendered','diet:assessment-ready','diet:profile-rendered','analysis-workspace:ready','workspace-entry-ux:ready','workspace-correction:ready','usability-recovery-hotfix:ready','quality-completion-hotfix:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    if(w.MutationObserver){try{observer=new MutationObserver(schedule);observer.observe(d.body||d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','data-theme','data-navigation-route','aria-pressed']});}catch(_){} }
    refresh();w.NutritionThemeParityHotfix={version:VERSION,refresh:refresh};emit('theme-parity-hotfix:ready',{version:VERSION});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
