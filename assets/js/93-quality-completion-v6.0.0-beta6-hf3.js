/* NutedScope / Nutrition Calculator v6.0.0 beta 6 hotfix 3.
 * Final usability completion. This layer changes navigation and presentation
 * only; nutritional formulae, product data and server credentials are untouched.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta6-hotfix3-quality-completion';
  var RELEASE='6.0.0-beta6-hotfix3';
  var timer=0,observer=null,origin=null;
  var ORIGIN_KEY='nutritionCalculator.analysisOrigin.hf3';

  function byId(id){return d.getElementById(id);}
  function closest(node,selector){return node&&node.closest?node.closest(selector):null;}
  function text(node,fallback){var value=node&&node.textContent?node.textContent.replace(/\s+/g,' ').trim():'';return value||fallback||'—';}
  function setText(node,value){if(node&&node.textContent!==String(value))node.textContent=String(value);}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function state(){var api=shell();try{return api&&api.getState?api.getState():null;}catch(_){return null;}}
  function route(){var s=state();return String(s&&s.route||d.documentElement.getAttribute('data-navigation-route')||'');}
  function navigate(name,target){var api=shell();if(api&&typeof api.navigate==='function')api.navigate(name,target||'');}
  function emit(name,detail){try{w.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){}}
  function scrollToNode(node){if(!node)return;try{node.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{node.scrollIntoView(true);}catch(__){}}try{node.focus({preventScroll:true});}catch(_){}}
  function targetForRoute(name){return {profile:'needsCompact',ration:'globalSearchSection','analysis/overview':'workspaceOverviewPanel','analysis/nutrients':'workspaceNutrientsPanel','analysis/hei':'workspaceHeiPanel',correction:'workspaceCorrectionPanel',report:'globalActions'}[name]||'';}
  function labelForRoute(name){return {profile:'к потребностям',ration:'к рациону','analysis/overview':'к обзору анализа','analysis/nutrients':'к нутриентам','analysis/hei':'к HEI',correction:'к улучшению',report:'к отчёту'}[name]||'назад';}


  function stabilizeInterfaceControls(){
    var bar=byId('interfaceControlsBarHF2'),view=byId('workspaceViewSwitcher'),theme=byId('themeSwitcher'),settings=byId('interfaceSettingsHF2');
    if(!bar)return;
    if(view&&view.parentNode!==bar)bar.appendChild(view);
    if(theme&&theme.parentNode!==bar)bar.appendChild(theme);
    if(settings&&settings.parentNode!==bar)bar.appendChild(settings);
    if(theme)theme.classList.add('theme-switcher--top');
  }

  function syncReleaseMetadata(){
    var root=d.documentElement;
    root.setAttribute('data-ui-version',RELEASE);
    root.setAttribute('data-performance-release','v6-beta6-hotfix3-quality-completion');
    root.setAttribute('data-quality-completion-hotfix','3');
    var badge=d.querySelector('#mainContent>header>.title .version-badge');
    if(badge)setText(badge,'v'+RELEASE);
    if(d.title.indexOf('hotfix 3')<0)d.title='Калькулятор рациона Сергея Веснина — v6.0 beta 6 hotfix 3';
    w.__APP_DEPLOY_VERSION__='v'+RELEASE;
  }

  function icon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0V5Zm-3 6a1 1 0 1 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.08A7 7 0 0 1 5 11Z" fill="currentColor"/></svg>';
  }

  function ensureNativeRecorderChoice(){
    var grid=d.querySelector('#workspaceRationEntryMethods .workspace-ration-entry-methods__grid');
    if(!grid)return;
    var voice=grid.querySelector('[data-ration-entry-method="voice"]');
    if(voice){
      var small=voice.querySelector('small');if(small)setText(small,'Запись в браузере');
      voice.setAttribute('aria-label','Записать голос с микрофона внутри браузера');
    }
    var nativeButton=grid.querySelector('[data-hf3-native-recorder]');
    if(!nativeButton){
      nativeButton=d.createElement('button');nativeButton.type='button';nativeButton.setAttribute('data-hf3-native-recorder','');
      nativeButton.setAttribute('aria-label','Открыть системный диктофон устройства');
      nativeButton.innerHTML=icon()+'<span><b>Диктофон устройства</b><small>Системная запись</small></span>';
      if(voice&&voice.nextSibling)grid.insertBefore(nativeButton,voice.nextSibling);else grid.appendChild(nativeButton);
    }
    var copy=d.querySelector('.workspace-ration-entry-methods__copy>em');
    if(copy)setText(copy,'Для голоса доступны два способа: запись прямо в браузере и системный диктофон устройства. Браузер может один раз запросить разрешение на микрофон.');
  }

  function openNativeRecorder(event){
    if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();}
    var details=byId('workspaceRationSecondary');if(details)details.open=true;
    navigate('ration','geminiRationImportSection');
    var bridge=w.NutritionMediaEntryBridge;
    if(bridge&&typeof bridge.openNativeRecorder==='function'){
      bridge.openNativeRecorder();emit('quality-completion:native-recorder-opened',{version:VERSION});return;
    }
    var fallback=byId('workspaceNativeVoiceFallback');if(fallback)fallback.click();
  }

  function ensureAnalysisCommandCenter(){
    var overview=byId('workspaceOverviewPanel');if(!overview)return;
    var center=byId('analysisCommandCenterHF3');
    if(!center){
      center=d.createElement('section');center.id='analysisCommandCenterHF3';center.className='analysis-command-center-hf3';center.setAttribute('aria-labelledby','analysisCommandCenterTitleHF3');
      center.innerHTML=''+
        '<div class="analysis-command-center-hf3__head"><div><span>Карта аналитики</span><h3 id="analysisCommandCenterTitleHF3">Три слоя оценки рациона</h3><p>Сводная матрица, Гарвардская тарелка и HEI доступны сразу и не скрываются в случайных внутренних вкладках.</p></div></div>'+
        '<div class="analysis-command-center-hf3__grid">'+
          '<button type="button" class="analysis-command-center-hf3__card" data-hf3-analysis-target="matrix"><span>Качество × структура</span><strong id="analysisCommandMatrixValueHF3">—</strong><small id="analysisCommandMatrixNoteHF3">Матрица ждёт рассчитанный рацион</small><em>Открыть сводную матрицу →</em></button>'+
          '<button type="button" class="analysis-command-center-hf3__card" data-hf3-analysis-target="harvard"><span>Гарвардская тарелка</span><strong id="analysisCommandHarvardValueHF3">—</strong><small id="analysisCommandHarvardNoteHF3">Структура пищевых групп</small><em>Открыть тарелку →</em></button>'+
          '<button type="button" class="analysis-command-center-hf3__card" data-hf3-analysis-target="hei"><span>HEI-2020</span><strong id="analysisCommandHeiValueHF3">—</strong><small id="analysisCommandHeiNoteHF3">Все компоненты и их баллы</small><em>Открыть дашборд HEI →</em></button>'+
        '</div>';
      var head=overview.querySelector('.workspace-overview__head');
      if(head&&head.nextSibling)overview.insertBefore(center,head.nextSibling);else overview.insertBefore(center,overview.firstChild);
    }
    var old=byId('analysisOverviewBridgeHF2');if(old)old.hidden=true;
    updateAnalysisCommandCenter();
  }

  function normalizeScore(value,suffix){
    value=String(value||'').replace(/\s+/g,' ').trim();
    if(!value||value==='—')return '—';
    if(suffix&&value.indexOf(suffix)<0&&/^\d+(?:[.,]\d+)?$/.test(value))return value+suffix;
    return value;
  }

  function updateAnalysisCommandCenter(){
    var hei=text(byId('workspaceOverviewHei'),text(byId('dietProfileHeiScore'),'—'));
    var structure=text(byId('workspaceOverviewStructure'),text(byId('dietProfileStructureScore'),'—'));
    var zone=text(byId('dietAxisZoneValue'),text(byId('dietMatrixZoneLabel'),'Матрица ждёт рацион'));
    var matrixValue=(hei!=='—'||structure!=='—')?normalizeScore(hei,'')+' / '+normalizeScore(structure,''):'—';
    setText(byId('analysisCommandMatrixValueHF3'),matrixValue);
    setText(byId('analysisCommandMatrixNoteHF3'),zone==='—'?'Матрица ждёт рассчитанный рацион':zone);
    var plate=text(byId('harvardPlateScoreRing'),'—');
    setText(byId('analysisCommandHarvardValueHF3'),normalizeScore(plate,''));
    var plateText=byId('harvardPlateScoreText');
    setText(byId('analysisCommandHarvardNoteHF3'),text(plateText&&plateText.querySelector('span'),'Структура пищевых групп'));
    setText(byId('analysisCommandHeiValueHF3'),normalizeScore(hei,''));
    setText(byId('analysisCommandHeiNoteHF3'),text(byId('workspaceOverviewHeiNote'),'Все компоненты и их баллы'));
  }

  function currentFocusToken(){
    var active=d.activeElement;if(!active||active===d.body)return '';
    if(active.id)return '#'+active.id;
    var routeAttr=active.getAttribute&&active.getAttribute('data-workspace-route');if(routeAttr)return '[data-workspace-route="'+routeAttr+'"]';
    return '';
  }
  function saveOrigin(){
    var name=route();if(name==='analysis/nutrients'||name==='analysis/hei')return;
    origin={route:name||'analysis/overview',target:targetForRoute(name||'analysis/overview'),scrollY:Math.max(0,w.scrollY||0),focus:currentFocusToken(),savedAt:Date.now()};
    try{w.sessionStorage.setItem(ORIGIN_KEY,JSON.stringify(origin));}catch(_){}
    updateBackNavigation();
  }
  function loadOrigin(){
    if(origin)return origin;
    try{var raw=w.sessionStorage.getItem(ORIGIN_KEY),parsed=raw?JSON.parse(raw):null;if(parsed&&parsed.route)origin=parsed;}catch(_){}
    return origin;
  }

  function ensureContextualBack(panelId,sectionName){
    var panel=byId(panelId);if(!panel)return;
    var actions=panel.querySelector('.hf2-analysis-head-actions');if(!actions)return;
    var button=actions.querySelector('[data-hf2-analysis-back],[data-hf3-analysis-back]');if(!button)return;
    button.removeAttribute('data-hf2-analysis-back');button.setAttribute('data-hf3-analysis-back','');
    button.setAttribute('aria-label','Вернуться в предыдущий раздел без потери контекста');
    var head=panel.querySelector('.workspace-analysis-detail__head>div');
    var context=head&&head.querySelector('.analysis-return-context-hf3');
    if(head&&!context){context=d.createElement('small');context.className='analysis-return-context-hf3';head.appendChild(context);}
    panel.setAttribute('data-hf3-section-name',sectionName);
  }

  function updateBackNavigation(){
    var item=loadOrigin()||{route:'analysis/overview'};
    var label='← Назад '+labelForRoute(item.route);
    var buttons=d.querySelectorAll('[data-hf3-analysis-back]'),i;
    for(i=0;i<buttons.length;i++)setText(buttons[i],label);
    var contexts=d.querySelectorAll('.analysis-return-context-hf3');
    for(i=0;i<contexts.length;i++)setText(contexts[i],'После просмотра вы вернётесь '+labelForRoute(item.route)+'.');
  }

  function restoreOrigin(event){
    if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();}
    var item=loadOrigin()||{route:'analysis/overview',target:'workspaceOverviewPanel',scrollY:0,focus:''};
    navigate(item.route,item.target||targetForRoute(item.route));
    w.setTimeout(function(){
      var focusNode=null;try{if(item.focus)focusNode=d.querySelector(item.focus);}catch(_){}
      if(focusNode){try{focusNode.focus({preventScroll:true});}catch(_){}}
      try{w.scrollTo({top:Math.max(0,Number(item.scrollY)||0),behavior:'smooth'});}catch(_){w.scrollTo(0,Math.max(0,Number(item.scrollY)||0));}
      emit('quality-completion:analysis-origin-restored',{version:VERSION,route:item.route});
    },100);
  }

  function openAnalysisTarget(kind,event){
    if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();}
    if(kind==='hei'){saveOrigin();navigate('analysis/hei','workspaceHeiPanel');w.setTimeout(function(){scrollToNode(byId('workspaceHeiDashboardHF2')||byId('workspaceHeiPanel'));},100);return;}
    navigate('analysis/overview','workspaceOverviewPanel');
    w.setTimeout(function(){
      if(kind==='harvard'){
        var details=byId('strictHarvardPlateDetails');if(details){details.hidden=false;details.open=true;}scrollToNode(details||byId('harvardPlatePanel'));
      }else scrollToNode(byId('dietAnalysisProfilePanel'));
    },100);
  }

  function enteringDetail(target){
    if(!target||!target.closest)return false;
    return !!target.closest('[data-hf2-nutrient-group],[data-hf2-hei-key],[data-workspace-route="analysis/nutrients"],[data-workspace-route="analysis/hei"]');
  }

  function onPointerDown(event){if(enteringDetail(event.target))saveOrigin();}
  function onClick(event){
    var nativeButton=closest(event.target,'[data-hf3-native-recorder]');if(nativeButton){openNativeRecorder(event);return;}
    var back=closest(event.target,'[data-hf3-analysis-back]');if(back){restoreOrigin(event);return;}
    var card=closest(event.target,'[data-hf3-analysis-target]');if(card){openAnalysisTarget(card.getAttribute('data-hf3-analysis-target'),event);return;}
  }

  function refresh(){
    syncReleaseMetadata();stabilizeInterfaceControls();ensureNativeRecorderChoice();ensureAnalysisCommandCenter();
    ensureContextualBack('workspaceNutrientsPanel','Нутриенты');ensureContextualBack('workspaceHeiPanel','HEI-2020');
    updateBackNavigation();updateAnalysisCommandCenter();
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(refresh,60);}

  function init(){
    d.addEventListener('pointerdown',onPointerDown,true);
    d.addEventListener('mousedown',onPointerDown,true);
    d.addEventListener('click',onClick,true);
    w.addEventListener('resize',schedule,false);
    w.addEventListener('orientationchange',schedule,false);
    ['app:ready','navigation-shell:ready','navigation-shell:route-changed','workspace-entry-ux:ready','analysis-workspace:ready','ration:changed','hei:rendered','diet:assessment-ready','diet:profile-rendered','nutrition-ui:view-model','nutrition:themechange','workspace-correction:ready','usability-recovery-hotfix:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    if(w.MutationObserver){try{observer=new MutationObserver(schedule);observer.observe(d.body||d.documentElement,{childList:true,subtree:true,attributes:true,characterData:true,attributeFilter:['hidden','open','data-navigation-route','data-theme','aria-pressed']});}catch(_){}}
    refresh();
    w.NutritionQualityCompletionHotfix={version:VERSION,refresh:refresh,saveOrigin:saveOrigin,restoreOrigin:restoreOrigin,getState:function(){return {route:route(),origin:loadOrigin()};}};
    emit('quality-completion-hotfix:ready',{version:VERSION});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
