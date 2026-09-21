/* Nutrition Calculator v6.0.0 beta 6 hotfix 2 — usability and analysis recovery.
 * Restores a deliberate needs flow, one-click voice entry, flagship analysis,
 * bounded interface controls, contextual back navigation and compact dashboards.
 * Presentation-only: does not calculate nutritional values or change formulae.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta6-hotfix2-usability-recovery';
  var timer=0,observer=null,needsCalculationRequested=false,lastHeiKey='',lastGroupKey='';

  function byId(id){return d.getElementById(id);}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function route(){var api=shell();try{return api&&api.getState?String(api.getState().route||''):String(d.documentElement.getAttribute('data-navigation-route')||'');}catch(_){return String(d.documentElement.getAttribute('data-navigation-route')||'');}}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function num(value,fallback){var n=Number(value);return isFinite(n)?n:(fallback==null?NaN:fallback);}
  function fmt(value,digits){var n=num(value,NaN);return isFinite(n)?n.toLocaleString('ru-RU',{minimumFractionDigits:digits||0,maximumFractionDigits:digits||0}):'—';}
  function setText(node,value){if(node&&node.textContent!==String(value))node.textContent=String(value);}
  function setHTML(node,value){value=String(value);if(node&&node.innerHTML!==value)node.innerHTML=value;}
  function dispatch(name,detail){try{w.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){}}
  function navigate(name,target){var api=shell();if(api&&typeof api.navigate==='function')api.navigate(name,target||'');}
  function scrollToNode(node){if(!node)return;try{node.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{node.scrollIntoView(true);}catch(__){}}try{node.focus({preventScroll:true});}catch(_){}}
  function closest(target,selector){return target&&target.closest?target.closest(selector):null;}

  function buildInterfaceControls(){
    var header=d.querySelector('#mainContent>header'),title=header&&header.querySelector('.title'),toolbar=header&&header.querySelector('.toolbar'),view=byId('workspaceViewSwitcher'),theme=byId('themeSwitcher'),bar=byId('interfaceControlsBarHF2');
    if(!header||!view||!theme)return;
    if(!bar){
      bar=d.createElement('div');bar.id='interfaceControlsBarHF2';bar.className='interface-controls-hf2';bar.setAttribute('aria-label','Вид и дизайн калькулятора');
      if(toolbar&&toolbar.parentNode===header)header.insertBefore(bar,toolbar);else if(title&&title.nextSibling)header.insertBefore(bar,title.nextSibling);else header.appendChild(bar);
    }
    if(view.parentNode!==bar)bar.appendChild(view);
    if(theme.parentNode!==bar)bar.appendChild(theme);
    var viewLabel=view.querySelector('.workspace-view-switcher__label, [data-workspace-view-label]');
    if(viewLabel)setText(viewLabel,'Вид');
    var themeLabel=theme.querySelector('.theme-switcher__label');if(themeLabel)setText(themeLabel,'Дизайн');
    var labels=theme.querySelectorAll('.theme-switcher__option span'),themeNames=['Современный','2-bit','Ivory & Brass'],i;
    for(i=0;i<labels.length&&i<themeNames.length;i++)setText(labels[i],themeNames[i]);
    var settings=byId('interfaceSettingsHF2');
    if(!settings){settings=d.createElement('button');settings.id='interfaceSettingsHF2';settings.type='button';settings.className='secondary interface-controls-hf2__settings';settings.setAttribute('data-navshell-settings-toggle','');settings.setAttribute('aria-expanded','false');settings.textContent='Доп. настройки';bar.appendChild(settings);}
    var old=d.querySelectorAll('#navigationShell [data-navshell-settings-toggle], [data-navshell-settings-toggle]'),j;
    for(j=0;j<old.length;j++){
      if(old[j]===settings)continue;
      old[j].setAttribute('data-hf2-settings-replaced','1');
      old[j].setAttribute('aria-label','Показать или скрыть дополнительные настройки');
      setText(old[j],'Доп. настройки');
    }
    if(toolbar){toolbar.setAttribute('aria-label','Дополнительные настройки калькулятора');}
  }

  function patchNeedsFlow(){
    var button=byId('profileCalculateContinue'),state=d.documentElement.getAttribute('data-profile-calculation-state')||'incomplete';
    if(button){
      button.setAttribute('data-hf2-needs-action','stay');
      if(state==='current')setText(button,'Показать рассчитанные потребности');
      else if(state==='draft')setText(button,'Пересчитать потребности');
      else setText(button,'Рассчитать потребности');
    }
    var next=byId('workspaceProfileNext'),nextText=byId('workspaceProfileNextText');
    if(nextText&&state==='current')setText(nextText,'Проверьте энергию, белки, жиры, углеводы, воду и пояснения ниже. К рациону переходите, когда будете готовы.');
    if(next&&state==='current')next.hidden=false;
  }

  function handleNeedsClick(event,button){
    event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    if(button.disabled||button.getAttribute('aria-disabled')==='true'){
      var focus=byId('profileFocusMissing');if(focus)focus.click();return;
    }
    var state=d.documentElement.getAttribute('data-profile-calculation-state')||'incomplete',out=byId('needs_out');
    if(state==='current'){scrollToNode(out||byId('workspaceProfileNext'));return;}
    var canonical=byId('needs_calc_btn');
    if(!canonical||canonical.disabled)return;
    needsCalculationRequested=true;
    canonical.click();
  }

  function afterNeedsComputed(){
    if(!needsCalculationRequested){w.setTimeout(patchNeedsFlow,0);return;}
    needsCalculationRequested=false;
    w.setTimeout(function(){patchNeedsFlow();navigate('profile','needs_out');scrollToNode(byId('needs_out')||byId('workspaceProfileNext'));},90);
  }

  function openVoiceDirectly(event){
    event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    var details=byId('workspaceRationSecondary');if(details)details.open=true;
    navigate('ration','geminiRationImportSection');
    var bridge=w.NutritionMediaEntryBridge;
    if(bridge&&typeof bridge.startVoice==='function'){
      bridge.startVoice();
      dispatch('usability-recovery:voice-started',{version:VERSION,method:'direct'});
      return;
    }
    var direct=byId('geminiRationRecordAudio');if(direct)direct.click();
  }

  function patchVoiceCopy(){
    var voice=d.querySelector('[data-ration-entry-method="voice"] small');if(voice)setText(voice,'Начать запись');
    var copy=d.querySelector('.workspace-ration-entry-methods__copy>em');
    if(copy)setText(copy,'Фото, голос и аудиофайл открываются напрямую. Браузер может один раз запросить разрешение на микрофон или камеру.');
  }

  function ensureOverviewBridge(){
    var overview=byId('workspaceOverviewPanel'),bridge=byId('analysisOverviewBridgeHF2');if(!overview)return;
    if(!bridge){
      bridge=d.createElement('section');bridge.id='analysisOverviewBridgeHF2';bridge.className='analysis-overview-bridge-hf2';bridge.setAttribute('aria-labelledby','analysisOverviewBridgeTitleHF2');
      bridge.innerHTML='<div><span>Полная сводная аналитика</span><h3 id="analysisOverviewBridgeTitleHF2">Структура и качество рациона</h3><p>Ниже восстановлена сводная матрица — совместная оценка структуры и качества. Гарвардская тарелка доступна рядом как отдельная модель состава.</p></div><div class="analysis-overview-bridge-hf2__actions"><button type="button" data-hf2-analysis-jump="matrix">К сводной матрице</button><button type="button" class="secondary" data-hf2-analysis-jump="harvard">К Гарвардской тарелке</button></div>';
      var actions=overview.querySelector('.workspace-overview__actions');if(actions)overview.insertBefore(bridge,actions);else overview.appendChild(bridge);
    }
  }

  function restoreFlagshipAnalysis(){
    var panel=byId('dietAnalysisProfilePanel');if(!panel)return;
    if(route()==='analysis/overview'){
      panel.hidden=false;panel.removeAttribute('aria-hidden');panel.setAttribute('data-hf2-analysis-restored','1');
      var harvard=byId('strictHarvardPlateDetails');if(harvard){harvard.hidden=false;harvard.removeAttribute('aria-hidden');}
    }
  }

  function addBackNavigation(panelId,label){
    var panel=byId(panelId);if(!panel)return;
    var head=panel.querySelector('.workspace-analysis-detail__head');if(!head)return;
    var copy=head.querySelector('div'),eyebrow=copy&&copy.querySelector('span');if(eyebrow)setText(eyebrow,'Анализ → '+label);
    var actions=head.querySelector('.hf2-analysis-head-actions');
    if(!actions){
      actions=d.createElement('div');actions.className='hf2-analysis-head-actions';
      var existing=null,children=head.children,i;for(i=0;i<children.length;i++){if(children[i].tagName==='BUTTON'&&children[i].getAttribute('data-workspace-route')==='ration'){existing=children[i];break;}}
      var back=d.createElement('button');back.type='button';back.className='secondary hf2-analysis-back';back.setAttribute('data-hf2-analysis-back','');back.textContent='← Назад к обзору';actions.appendChild(back);
      if(existing)actions.appendChild(existing);
      head.appendChild(actions);
    }
  }

  function groupStatus(group){
    if(!group||!group.total)return {code:'unknown',label:'Нет данных'};
    if(group.above>0)return {code:'above',label:group.above+' выше предела'};
    if(group.below>0)return {code:'below',label:group.below+' ниже ориентира'};
    if(group.review>0)return {code:'review',label:group.review+' требуют проверки'};
    if(group.target>0)return {code:'target',label:'Целевой диапазон'};
    return {code:'unknown',label:'Не оценивается'};
  }

  function ensureCorrectionGroupOverview(){
    var panel=byId('workspaceCorrectionPanel'),status=byId('workspaceCorrectionStatus'),section=byId('workspaceCorrectionGroupOverviewHF2');if(!panel)return;
    if(!section){
      section=d.createElement('section');section.id='workspaceCorrectionGroupOverviewHF2';section.className='workspace-group-overview-hf2';section.setAttribute('aria-labelledby','workspaceGroupOverviewTitleHF2');
      section.innerHTML='<div class="workspace-group-overview-hf2__head"><div><span>Нутриенты</span><h3 id="workspaceGroupOverviewTitleHF2">Обзор по группам</h3></div><button type="button" class="secondary" data-workspace-route="analysis/nutrients">Полная таблица</button></div><p>Краткая карта показывает, в каких группах сосредоточены отклонения. Нажмите группу, чтобы открыть её показатели.</p><div id="workspaceGroupOverviewListHF2" class="workspace-group-overview-hf2__list"></div>';
      if(status&&status.nextSibling)panel.insertBefore(section,status.nextSibling);else panel.insertBefore(section,panel.firstChild);
    }
    var host=byId('workspaceGroupOverviewListHF2'),model=null,groups=[];
    try{model=w.NutritionUIViewModel&&w.NutritionUIViewModel.get?w.NutritionUIViewModel.get():null;groups=model&&model.analysis&&model.analysis.nutrientGroups||[];}catch(_){}
    if(!host)return;
    if(!groups.length){setHTML(host,'<div class="workspace-group-overview-hf2__empty"><strong>Обзор появится после расчёта</strong><span>Добавьте продукты и откройте анализ.</span></div>');return;}
    setHTML(host,groups.map(function(group){var s=groupStatus(group),pct=group.targetPercent==null?'—':group.targetPercent+'%';return '<button type="button" class="is-'+esc(s.code)+'" data-hf2-nutrient-group="'+esc(group.key)+'"><span>'+esc(group.label)+'</span><strong>'+esc(pct)+'</strong><small>'+esc(s.label)+'</small></button>';}).join(''));
  }

  function heiStatus(row){var pct=num(row&&row.pct,NaN);if(!isFinite(pct))return {code:'unknown',label:'Нет расчёта'};if(pct>=90)return {code:'target',label:'Высокий балл'};if(pct>=50)return {code:'review',label:'Можно улучшить'};return {code:'below',label:'Приоритет'};}

  function ensureHeiDashboard(){
    var panel=byId('workspaceHeiPanel'),toolbar=panel&&panel.querySelector('.workspace-analysis-toolbar'),section=byId('workspaceHeiDashboardHF2');if(!panel)return;
    if(!section){
      section=d.createElement('section');section.id='workspaceHeiDashboardHF2';section.className='workspace-hei-dashboard-hf2';section.setAttribute('aria-labelledby','workspaceHeiDashboardTitleHF2');
      section.innerHTML='<div class="workspace-hei-dashboard-hf2__head"><div><span>Все компоненты одним взглядом</span><h3 id="workspaceHeiDashboardTitleHF2">Дашборд HEI-2020</h3><p>Баллы всех компонентов показаны сразу. Нажмите карточку, чтобы открыть подробности и вкладчики.</p></div><button type="button" class="secondary" data-hf2-hei-all>Показать все подробно</button></div><div id="workspaceHeiDashboardListHF2" class="workspace-hei-dashboard-hf2__list"></div>';
      if(toolbar)panel.insertBefore(section,toolbar);else panel.appendChild(section);
    }
    var host=byId('workspaceHeiDashboardListHF2'),vm=null,rows=[];
    try{vm=w.NutritionAnalysisWorkspaceHF7&&w.NutritionAnalysisWorkspaceHF7.getViewModel?w.NutritionAnalysisWorkspaceHF7.getViewModel():null;rows=vm&&vm.hei&&vm.hei.rows||[];}catch(_){}
    if(!host)return;
    if(!rows.length){setHTML(host,'<div class="workspace-hei-dashboard-hf2__empty"><strong>HEI пока не рассчитан</strong><span>Добавьте продукты — здесь появятся баллы всех компонентов.</span></div>');return;}
    setHTML(host,rows.map(function(row){var s=heiStatus(row),points=fmt(row.points,1)+' / '+fmt(row.maxPoints,0),pct=isFinite(num(row.pct,NaN))?Math.round(num(row.pct))+'%':'—';return '<button type="button" class="is-'+esc(s.code)+'" data-hf2-hei-key="'+esc(row.key)+'" aria-label="'+esc(row.title)+': '+esc(points)+'"><span>'+esc(row.title)+'</span><strong>'+esc(points)+'</strong><i aria-hidden="true"><b style="width:'+esc(isFinite(num(row.pct,NaN))?Math.max(0,Math.min(100,num(row.pct))):0)+'%"></b></i><small>'+esc(pct)+' · '+esc(s.label)+'</small></button>';}).join(''));
  }

  function openNutrientGroup(key){
    lastGroupKey=key;
    navigate('analysis/nutrients','workspaceNutrientsPanel');
    w.setTimeout(function(){
      var all=d.querySelector('#workspaceNutrientsPanel [data-nutrient-filter="all"]'),group=d.querySelector('#workspaceNutrientsPanel [data-nutrient-group="'+key+'"]');
      if(all)all.click();if(group)group.click();scrollToNode(byId('workspaceNutrientsPanel'));
    },120);
  }

  function openHeiComponent(key){
    lastHeiKey=key;
    var all=d.querySelector('#workspaceHeiPanel [data-hei-filter="all"]'),allGroup=d.querySelector('#workspaceHeiPanel [data-hei-group="all"]');
    if(all)all.click();if(allGroup)allGroup.click();
    navigate('analysis/hei','workspaceHeiRow-'+key);
  }

  function showAllHei(){
    var all=d.querySelector('#workspaceHeiPanel [data-hei-filter="all"]'),allGroup=d.querySelector('#workspaceHeiPanel [data-hei-group="all"]');
    if(all)all.click();if(allGroup)allGroup.click();scrollToNode(byId('workspaceHeiComponentList'));
  }

  function handleClick(event){
    var needs=closest(event.target,'#profileCalculateContinue');if(needs){handleNeedsClick(event,needs);return;}
    var voice=closest(event.target,'[data-ration-entry-method="voice"]');if(voice){openVoiceDirectly(event);return;}
    var jump=closest(event.target,'[data-hf2-analysis-jump]');if(jump){
      event.preventDefault();var kind=jump.getAttribute('data-hf2-analysis-jump');
      if(kind==='harvard'){var details=byId('strictHarvardPlateDetails');if(details)details.open=true;scrollToNode(details||byId('harvardPlatePanel'));}
      else scrollToNode(byId('dietAnalysisProfilePanel'));
      return;
    }
    var back=closest(event.target,'[data-hf2-analysis-back]');if(back){event.preventDefault();navigate('analysis/overview','workspaceOverviewPanel');return;}
    var group=closest(event.target,'[data-hf2-nutrient-group]');if(group){event.preventDefault();openNutrientGroup(group.getAttribute('data-hf2-nutrient-group'));return;}
    var hei=closest(event.target,'[data-hf2-hei-key]');if(hei){event.preventDefault();openHeiComponent(hei.getAttribute('data-hf2-hei-key'));return;}
    var allHei=closest(event.target,'[data-hf2-hei-all]');if(allHei){event.preventDefault();showAllHei();return;}
  }

  function refresh(){
    buildInterfaceControls();patchNeedsFlow();patchVoiceCopy();ensureOverviewBridge();restoreFlagshipAnalysis();addBackNavigation('workspaceNutrientsPanel','Нутриенты');addBackNavigation('workspaceHeiPanel','HEI-2020');ensureCorrectionGroupOverview();ensureHeiDashboard();
    d.documentElement.setAttribute('data-usability-recovery-hotfix','2');
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(refresh,75);}

  function init(){
    d.addEventListener('click',handleClick,true);
    d.addEventListener('needs:computed',afterNeedsComputed,false);
    ['app:ready','navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','workspace-entry-ux:ready','analysis-workspace:ready','ration:changed','hei:rendered','diet:assessment-ready','diet:profile-rendered','nutrition-ui:view-model','nutrition:themechange','workspace-correction:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    if(w.MutationObserver){try{observer=new MutationObserver(schedule);observer.observe(d.body||d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','data-profile-calculation-state']});}catch(_){}}
    refresh();
    w.NutritionUsabilityRecoveryHotfix={version:VERSION,refresh:refresh,openNutrientGroup:openNutrientGroup,openHeiComponent:openHeiComponent,getState:function(){return {route:route(),lastHeiKey:lastHeiKey,lastGroupKey:lastGroupKey};}};
    dispatch('usability-recovery-hotfix:ready',{version:VERSION});
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
