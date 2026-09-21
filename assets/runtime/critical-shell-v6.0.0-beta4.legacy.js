/* v6 beta 4 legacy critical shell; generated. */

/* BEGIN assets/legacy/js/75-navigation-shell-v5.3.210-rc2-hf17.js */
/* Nutrition Calculator v5.3.210 RC2 HF17
 * Stage 5A unified user interface. Workspace sections are the only ordinary interface; the long page remains a query-only technical fallback.
 * ES5-safe: used by both modern and compatibility runtimes.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf17';
  var LEGACY_MODE_KEY='nutritionCalculator.navigationShell.mode.v2';
  var ROUTE_KEY='nutritionCalculator.navigationShell.route.v1';
  var SCROLL_KEY='nutritionCalculator.navigationShell.scroll.v1';
  var MODE_LONG='long';
  var MODE_WORKSPACE='workspace';
  var currentMode=MODE_LONG;
  var currentRoute='ration';
  var currentTargetId='';
  var routeScroll={};
  var initialized=false;
  var routeSyncTimer=0;
  var settingsOpen=false;
  var visibilityGuardTimer=0;
  var visibilityObservers=[];

  var ROUTES={
    profile:{
      hash:'#profile',
      workspace:'profile',
      title:'Профиль и потребности',
      eyebrow:'Первый шаг',
      description:'Введите данные человека и рассчитайте его ориентиры. После этого переходите к рациону.',
      ids:['workspaceProfilePanel','needsCompact']
    },
    ration:{
      hash:'#ration',
      workspace:'ration',
      title:'Рацион',
      eyebrow:'Рабочая область',
      description:'Добавляйте продукты, меняйте граммовки и сразу сверяйте текущие итоги.',
      ids:['globalSearchSection','rationSection','workspaceRationSecondary','geminiRationImportSection','rc2AlternativeInput','additionalToolsSection']
    },
    'analysis/overview':{
      hash:'#analysis/overview',
      workspace:'analysis',
      view:'overview',
      title:'Анализ рациона',
      eyebrow:'Обзор',
      description:'Краткая картина КБЖУ, структуры рациона, ключевых отклонений и качества данных.',
      ids:['workspaceOverviewPanel']
    },
    'analysis/nutrients':{
      hash:'#analysis/nutrients',
      workspace:'analysis',
      view:'nutrients',
      title:'Нутриенты и нормы',
      eyebrow:'Подробный анализ',
      description:'Фактическое поступление макро- и микронутриентов, ориентиры и достоверность расчёта.',
      ids:['workspaceNutrientsPanel']
    },
    'analysis/hei':{
      hash:'#analysis/hei',
      workspace:'analysis',
      view:'hei',
      title:'HEI-2020',
      eyebrow:'Качество структуры рациона',
      description:'Итоговый индекс, все компоненты, отдельные ограничения и причины снижения балла.',
      ids:['workspaceHeiPanel']
    },
    correction:{
      hash:'#correction',
      workspace:'correction',
      title:'Улучшить рацион',
      eyebrow:'Коррекция',
      description:'Выберите направление, оцените проверяемый вариант и применяйте только осмысленное изменение.',
      ids:['workspaceCorrectionPanel']
    },
    report:{
      hash:'#report',
      workspace:'report',
      title:'Отчёт',
      eyebrow:'Полный результат',
      description:'Последовательная сводка рациона для просмотра, печати, PDF и передачи специалисту.',
      ids:['workspaceReportPanel']
    }
  };

  var WORKSPACE_HIDDEN_IDS=['rc1BetaSupport','geminiAiSection','globalActions','legal-note'];
  var MANAGED_IDS=(function(){
    var seen={},out=[],key,i,id;
    for(key in ROUTES){if(!Object.prototype.hasOwnProperty.call(ROUTES,key))continue;
      for(i=0;i<ROUTES[key].ids.length;i++){id=ROUTES[key].ids[i];if(!seen[id]){seen[id]=1;out.push(id);}}
    }
    for(i=0;i<WORKSPACE_HIDDEN_IDS.length;i++){id=WORKSPACE_HIDDEN_IDS[i];if(!seen[id]){seen[id]=1;out.push(id);}}
    return out;
  })();

  var TARGET_ROUTE={
    needsCompact:'profile',needs:'profile',needs_person_name:'profile',needs_calc_btn:'profile',needs_out:'profile',workspaceProfilePanel:'profile',geminiRationImportSection:'ration',globalSearchSection:'ration',rationSection:'ration',additionalToolsSection:'ration',mealsSection:'ration',
    heiPanel:'analysis/hei',heiSummary:'analysis/hei',heiAssessment:'analysis/hei',heiTable:'analysis/hei',heiReference:'analysis/hei',
    totalsSection:'analysis/nutrients',workspaceNutrientsPanel:'analysis/nutrients',workspaceHeiPanel:'analysis/hei',dietAnalysisProfilePanel:'analysis/overview',strictHarvardPlateDetails:'analysis/overview',dataQualityPanel:'analysis/overview',
    workspaceCorrectionPanel:'correction',workspaceCorrectionPriorities:'correction',workspaceCorrectionWorkbench:'correction',heiLevers:'correction',heiRecs:'correction',geminiAiSection:'correction',
    globalActions:'report','legal-note':'report',workspaceReportPanel:'report',workspaceReportActions:'report'
  };

  var ICONS={
    ration:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>',
    analysis:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    correction:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/></svg>',
    report:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6zM9 11h6M9 15h6M9 7h3"/></svg>'
  };

  function byId(id){return d.getElementById(id);}
  function storageRef(name){try{return w[name]||null;}catch(_){return null;}}
  function safeGet(storage,key){try{return storage&&storage.getItem?storage.getItem(key):null;}catch(_){return null;}}
  function safeSet(storage,key,value){try{if(storage&&storage.setItem)storage.setItem(key,value);}catch(_){} }
  function safeRemove(storage,key){try{if(storage&&storage.removeItem)storage.removeItem(key);}catch(_){} }
  function safeJson(raw,fallback){try{var x=JSON.parse(raw);return x&&typeof x==='object'?x:fallback;}catch(_){return fallback;}}
  function dispatch(name,detail){try{w.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){} }
  function unique(list){var seen={},out=[],i,x;for(i=0;i<list.length;i++){x=list[i];if(!seen[x]){seen[x]=1;out.push(x);}}return out;}
  function closestAnchor(node){while(node&&node!==d){if(node.nodeType===1&&String(node.tagName).toLowerCase()==='a')return node;node=node.parentNode;}return null;}
  function setText(node,text){if(node)node.textContent=text;}
  function jumpTo(top){var root=d.documentElement,prev='';try{prev=root.style.scrollBehavior;root.style.scrollBehavior='auto';w.scrollTo(0,Math.max(0,top||0));root.style.scrollBehavior=prev;}catch(_){try{w.scrollTo(0,Math.max(0,top||0));}catch(__){}}}

  function urlAdapter(){try{return w.__NAVIGATION_SHELL_URL_ADAPTER__||null;}catch(_){return null;}}
  function currentUrl(){
    var adapter=urlAdapter(),href='';
    try{href=adapter&&adapter.href?String(adapter.href):String(w.location.href||'');}catch(_){}
    try{return new URL(href||'https://navigation-shell.invalid/');}catch(_){return new URL('https://navigation-shell.invalid/');}
  }
  function commitUrl(url,replace,state){
    var adapter=urlAdapter(),relative=url.pathname+url.search+url.hash;
    try{
      if(adapter){
        if(replace&&typeof adapter.replace==='function'){adapter.replace(relative,url.href,state);return;}
        if(!replace&&typeof adapter.push==='function'){adapter.push(relative,url.href,state);return;}
      }
      if(replace)w.history.replaceState(state===undefined?w.history.state:state,'',relative);
      else w.history.pushState(state===undefined?w.history.state:state,'',relative);
    }catch(_){}
  }

  function queryMode(){
    var value='';
    try{value=currentUrl().searchParams.get('ui')||'';}catch(_){}
    return value===MODE_LONG?MODE_LONG:'';
  }

  function resolveInitialMode(){
    /* Stage 5A migration: a previously saved long-page preference must never
       override the unified workspace. The technical fallback is URL-scoped. */
    safeRemove(storageRef('localStorage'),LEGACY_MODE_KEY);
    return queryMode()===MODE_LONG?MODE_LONG:MODE_WORKSPACE;
  }

  function replaceLocation(mode,route){
    var url,hash='';
    try{
      url=currentUrl();
      if(mode===MODE_LONG)url.searchParams.set('ui',MODE_LONG);else url.searchParams.delete('ui');
      if(mode===MODE_WORKSPACE&&ROUTES[route])hash=ROUTES[route].hash;
      else hash=url.hash||'';
      url.hash=hash;
      commitUrl(url,true,w.history&&w.history.state);
    }catch(_){}
  }

  function normalizeRoute(raw){
    raw=String(raw||'').replace(/^#/,'').replace(/^workspace\//,'').replace(/^\/+|\/+$/g,'');
    if(raw==='profile'||raw==='needs'||raw==='person')return 'profile';
    if(raw==='analysis'||raw==='overview')return 'analysis/overview';
    if(raw==='nutrients'||raw==='norms')return 'analysis/nutrients';
    if(raw==='hei')return 'analysis/hei';
    if(raw==='improve'||raw==='correction')return 'correction';
    if(raw==='report')return 'report';
    if(raw==='ration')return 'ration';
    if(ROUTES[raw])return raw;
    return '';
  }

  function routeFromHash(){return normalizeRoute(currentUrl().hash);}

  function routeFromLegacyHash(){
    var id=String(currentUrl().hash||'').replace(/^#/,'');
    return TARGET_ROUTE[id]||'';
  }

  function needsReady(){
    try{if(w.__lastNeedsProfileApplied===true&&w.__lastNeedsMeta)return true;}catch(_){}
    try{if(w.NutritionProfilePersistenceV1&&typeof w.NutritionProfilePersistenceV1.hasRestorableAppliedProfile==='function'&&w.NutritionProfilePersistenceV1.hasRestorableAppliedProfile())return true;}catch(_){}
    var out=byId('needs_out'),raw=out?String(out.textContent||'').replace(/\s+/g,' ').trim():'';
    return !!raw&&!/введите исходные данные|нажмите «?рассчитать|расч[её]т.*остановлен|защищ[её]нного режима остановлен/i.test(raw);
  }

  function resolveInitialRoute(){
    var explicit=routeFromHash()||routeFromLegacyHash();
    if(explicit)return explicit;
    var saved=normalizeRoute(safeGet(storageRef('localStorage'),ROUTE_KEY))||'ration';
    return needsReady()?saved:'profile';
  }

  function scheduleVisibilityGuard(){
    if(currentMode!==MODE_WORKSPACE)return;
    w.clearTimeout(visibilityGuardTimer);
    visibilityGuardTimer=w.setTimeout(function(){if(currentMode===MODE_WORKSPACE&&ROUTES[currentRoute])setWorkspaceVisibility(currentRoute);},0);
  }

  function observeManaged(el){
    if(!el||!w.MutationObserver||el.getAttribute('data-navshell-observed')==='1')return;
    el.setAttribute('data-navshell-observed','1');
    try{var observer=new MutationObserver(function(){scheduleVisibilityGuard();});observer.observe(el,{attributes:true,attributeFilter:['hidden','aria-hidden']});visibilityObservers.push(observer);}catch(_){}
  }

  function registerManaged(id,originalHidden){
    id=String(id||'');if(!id)return false;
    if(MANAGED_IDS.indexOf(id)<0)MANAGED_IDS.push(id);
    var el=byId(id);if(!el)return false;
    el.classList.add('navshell-managed');
    if(!el.hasAttribute('data-navshell-original-hidden'))el.setAttribute('data-navshell-original-hidden',originalHidden===true?'1':(el.hidden?'1':'0'));
    observeManaged(el);
    if(currentMode===MODE_WORKSPACE&&ROUTES[currentRoute])setWorkspaceVisibility(currentRoute);
    return true;
  }

  function recordOriginalState(){
    var i;
    for(i=0;i<MANAGED_IDS.length;i++)registerManaged(MANAGED_IDS[i]);
  }

  function applyManagedState(el,hidden,routeVisible){
    /* Idempotent writes are required here. MutationObserver watches the same
       attributes so unconditional assignments would feed the guard back into
       itself and keep the page busy while nothing is changing. */
    hidden=!!hidden;routeVisible=!!routeVisible;
    if(el.hidden!==hidden)el.hidden=hidden;
    if(hidden){
      if(el.getAttribute('aria-hidden')!=='true')el.setAttribute('aria-hidden','true');
    }else if(el.hasAttribute('aria-hidden'))el.removeAttribute('aria-hidden');
    if(routeVisible){if(!el.classList.contains('navshell-route-visible'))el.classList.add('navshell-route-visible');}
    else if(el.classList.contains('navshell-route-visible'))el.classList.remove('navshell-route-visible');
  }

  function restoreLongPage(){
    var i,el,wasHidden;
    for(i=0;i<MANAGED_IDS.length;i++){
      el=byId(MANAGED_IDS[i]);if(!el)continue;
      wasHidden=el.getAttribute('data-navshell-original-hidden')==='1';
      applyManagedState(el,wasHidden,false);
    }
  }

  function setWorkspaceVisibility(route){
    var visible={},ids=ROUTES[route].ids,i,id,el;
    for(i=0;i<ids.length;i++)visible[ids[i]]=1;
    for(i=0;i<MANAGED_IDS.length;i++){
      id=MANAGED_IDS[i];el=byId(id);if(!el)continue;
      applyManagedState(el,!visible[id],!!visible[id]);
    }
    d.documentElement.setAttribute('data-navigation-route',route);
    d.documentElement.setAttribute('data-navigation-workspace',ROUTES[route].workspace);
    d.documentElement.setAttribute('data-navigation-analysis-view',ROUTES[route].view||'');
  }

  function saveScroll(route){
    if(currentMode!==MODE_WORKSPACE||!route)return;
    routeScroll[route]=Math.max(0,w.pageYOffset||d.documentElement.scrollTop||0);
    safeSet(storageRef('sessionStorage'),SCROLL_KEY,JSON.stringify(routeScroll));
  }

  function restoreScroll(route,targetId,restore){
    w.setTimeout(function(){
      var target=targetId&&byId(targetId);
      if(target&&!target.hidden){
        jumpTo(target.getBoundingClientRect().top+(w.pageYOffset||0)-10);
        return;
      }
      if(restore&&typeof routeScroll[route]==='number')jumpTo(routeScroll[route]);
      else{
        var context=byId('navigationShellContext');
        if(context)jumpTo(context.getBoundingClientRect().top+(w.pageYOffset||0)-10);
        else jumpTo(0);
      }
    },35);
  }

  function setHash(route,replace){
    var hash=ROUTES[route].hash,url=currentUrl();
    if(url.hash===hash)return;
    url.hash=hash;
    commitUrl(url,!!replace,{navigationShellRoute:route});
  }

  function updateTechnicalFallbackControl(){
    var control=byId('navigationShellLongReturn');
    if(control)control.hidden=currentMode!==MODE_LONG;
  }

  function updateSettingsControls(){
    var buttons=d.querySelectorAll('[data-navshell-settings-toggle]'),i;
    for(i=0;i<buttons.length;i++)buttons[i].setAttribute('aria-expanded',settingsOpen?'true':'false');
    var header=d.querySelector('#mainContent > header');
    if(header)header.classList.toggle('navshell-settings-open',settingsOpen);
  }

  function updateNavControls(){
    var links=d.querySelectorAll('[data-navshell-route]'),i,route,active;
    for(i=0;i<links.length;i++){
      route=links[i].getAttribute('data-navshell-route');
      active=(ROUTES[route]&&ROUTES[route].workspace===ROUTES[currentRoute].workspace);
      links[i].classList.toggle('is-active',active);
      if(active)links[i].setAttribute('aria-current','page');else links[i].removeAttribute('aria-current');
    }
    var viewButtons=d.querySelectorAll('[data-navshell-analysis-view]');
    for(i=0;i<viewButtons.length;i++){
      route=viewButtons[i].getAttribute('data-navshell-analysis-view');
      active=route===currentRoute;
      viewButtons[i].classList.toggle('is-active',active);viewButtons[i].setAttribute('aria-pressed',active?'true':'false');
    }
  }

  function updateContext(){
    var cfg=ROUTES[currentRoute];
    setText(byId('navigationShellEyebrow'),cfg.eyebrow);
    setText(byId('navigationShellTitle'),cfg.title);
    setText(byId('navigationShellDescription'),cfg.description);
    var analysis=byId('navigationShellAnalysisViews');
    if(analysis)analysis.hidden=cfg.workspace!=='analysis';
    var kpi=byId('navigationShellRationKpi');
    if(kpi)kpi.hidden=cfg.workspace!=='ration';
    var correction=byId('navigationShellCorrectionLinks');
    if(correction)correction.hidden=true;
    var report=byId('navigationShellReportActions');
    if(report)report.hidden=cfg.workspace!=='report';
    updateNavControls();
  }

  function refreshRationKpi(){
    var source=byId('rationKpiStrip')||d.querySelector('.v40-mini-cart-text');
    var text=source?String(source.textContent||'').replace(/\s+/g,' ').trim():'Рацион пока пуст';
    if(!text)text='Рацион пока пуст';
    setText(byId('navigationShellRationKpiText'),text);
  }

  function focusContext(){
    var title=byId('navigationShellTitle');
    if(!title)return;
    try{title.focus({preventScroll:true});}catch(_){try{title.focus();}catch(__){}}
  }

  function activateRoute(route,options){
    options=options||{};route=normalizeRoute(route)||'ration';
    if(!ROUTES[route])route='ration';
    if(currentMode!==MODE_WORKSPACE){setMode(MODE_WORKSPACE,{route:route,replace:!!options.replace});return;}
    if(currentRoute!==route)saveScroll(currentRoute);
    currentRoute=route;currentTargetId=options.targetId||'';
    safeSet(storageRef('localStorage'),ROUTE_KEY,route);
    setWorkspaceVisibility(route);updateContext();refreshRationKpi();
    if(options.updateHash!==false)setHash(route,!!options.replace);
    restoreScroll(route,currentTargetId,!!options.restoreScroll);
    if(options.focus)w.setTimeout(focusContext,55);
    dispatch('navigation-shell:route-changed',{version:VERSION,route:route,workspace:ROUTES[route].workspace,view:ROUTES[route].view||'',targetId:currentTargetId});
    w.setTimeout(function(){dispatch('navigation-shell:section-activated',{route:route});try{w.dispatchEvent(new Event('resize'));}catch(_){}},80);
  }

  function equivalentLegacyAnchor(route){
    if(route==='profile')return 'needsCompact';
    if(route==='analysis/hei')return 'heiPanel';
    if(route==='analysis/nutrients')return 'totalsSection';
    if(route==='analysis/overview')return 'dietAnalysisProfilePanel';
    if(route==='correction')return 'geminiAiSection';
    if(route==='report')return 'globalActions';
    return 'globalSearchSection';
  }

  function setMode(mode,options){
    options=options||{};mode=mode===MODE_LONG?MODE_LONG:MODE_WORKSPACE;
    if(mode===currentMode&&initialized){if(mode===MODE_WORKSPACE&&options.route)activateRoute(options.route,options);return;}
    if(currentMode===MODE_WORKSPACE)saveScroll(currentRoute);
    if(!options.fromLocation)replaceLocation(mode,normalizeRoute(options.route)||currentRoute);
    currentMode=mode;
    d.documentElement.setAttribute('data-navigation-shell',mode);
    if(mode===MODE_LONG)d.documentElement.setAttribute('data-navigation-long-fallback','technical');else d.documentElement.removeAttribute('data-navigation-long-fallback');
    settingsOpen=false;updateSettingsControls();updateTechnicalFallbackControl();
    if(mode===MODE_WORKSPACE){
      currentRoute=normalizeRoute(options.route)||routeFromHash()||resolveInitialRoute();
      activateRoute(currentRoute,{replace:options.replace!==false,updateHash:options.fromLocation?false:true,restoreScroll:!!options.restoreScroll,focus:!!options.focus});
      w.setTimeout(function(){if(currentMode===MODE_WORKSPACE)restoreScroll(currentRoute,'',false);},240);
    }else{
      restoreLongPage();
      d.documentElement.removeAttribute('data-navigation-route');
      d.documentElement.removeAttribute('data-navigation-workspace');
      d.documentElement.removeAttribute('data-navigation-analysis-view');
      var anchor=options.anchor||equivalentLegacyAnchor(currentRoute),target=byId(anchor),longUrl=currentUrl();
      longUrl.hash=anchor?'#'+anchor:'';commitUrl(longUrl,true,w.history&&w.history.state);
      w.setTimeout(function(){if(target)jumpTo(target.getBoundingClientRect().top+(w.pageYOffset||0)-10);},35);
    }
    dispatch('navigation-shell:mode-changed',{version:VERSION,mode:mode,route:currentRoute,technicalFallback:mode===MODE_LONG});
  }

  function returnToWorkspace(){
    replaceLocation(MODE_WORKSPACE,currentRoute);
    setMode(MODE_WORKSPACE,{route:currentRoute,replace:true,focus:true,fromLocation:true});
  }

  function toggleSettings(){
    settingsOpen=!settingsOpen;updateSettingsControls();
    if(settingsOpen){var header=d.querySelector('#mainContent > header');if(header)w.setTimeout(function(){try{header.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){header.scrollIntoView(true);}},20);}
  }

  function createTechnicalFallbackControl(){
    var main=byId('mainContent'),header=main&&main.querySelector('header');
    if(!main||!header||byId('navigationShellLongReturn'))return;
    var control=d.createElement('aside');control.id='navigationShellLongReturn';control.className='navigation-shell-long-return';control.hidden=true;
    control.setAttribute('aria-label','Технический резервный режим');
    control.innerHTML='<div><strong>Технический режим</strong><span>Длинное полотно оставлено только как резерв для проверки совместимости.</span></div><button type="button" data-navshell-return-workspace>Вернуться к рабочим разделам</button>';
    main.insertBefore(control,header);
  }

  function navLink(route,label,icon){
    return '<a href="'+ROUTES[route].hash+'" data-navshell-route="'+route+'">'+icon+'<span>'+label+'</span></a>';
  }

  function createShell(){
    var main=byId('mainContent'),header=main&&main.querySelector('header');
    if(!main||!header||byId('navigationShell'))return;
    var nav=d.createElement('nav');nav.id='navigationShell';nav.className='navigation-shell';nav.setAttribute('aria-label','Разделы калькулятора');
    nav.innerHTML='<div class="navigation-shell__brand"><strong>Калькулятор</strong><span>Рабочие разделы</span></div><div class="navigation-shell__items">'+
      navLink('ration','Рацион',ICONS.ration)+navLink('analysis/overview','Анализ',ICONS.analysis)+navLink('correction','Улучшить',ICONS.correction)+navLink('report','Отчёт',ICONS.report)+
      '</div><div class="navigation-shell__secondary"><button type="button" data-navshell-route="profile">Профиль и потребности</button><button type="button" data-navshell-settings-toggle aria-expanded="false">Настройки интерфейса</button></div>';

    var context=d.createElement('section');context.id='navigationShellContext';context.className='navigation-shell-context';context.setAttribute('aria-labelledby','navigationShellTitle');
    context.innerHTML='<div class="navigation-shell-context__copy"><span id="navigationShellEyebrow"></span><h2 id="navigationShellTitle" tabindex="-1"></h2><p id="navigationShellDescription"></p></div>'+
      '<button class="navigation-shell-context__kpi" id="navigationShellRationKpi" type="button" hidden><span>Текущий рацион</span><strong id="navigationShellRationKpiText">Рацион пока пуст</strong></button>'+
      '<div class="navigation-shell-context__views" id="navigationShellAnalysisViews" role="group" aria-label="Представление анализа" hidden><button type="button" data-navshell-analysis-view="analysis/overview">Обзор</button><button type="button" data-navshell-analysis-view="analysis/nutrients">Нутриенты</button><button type="button" data-navshell-analysis-view="analysis/hei">HEI</button></div>'+
      '<div class="navigation-shell-context__links" id="navigationShellCorrectionLinks" hidden></div>'+
      '<div class="navigation-shell-context__links" id="navigationShellReportActions" hidden><button type="button" data-navshell-jump="workspaceReportActions">Печать и PDF</button></div>';

    if(header.nextSibling)main.insertBefore(nav,header.nextSibling);else main.appendChild(nav);
    if(nav.nextSibling)main.insertBefore(context,nav.nextSibling);else main.appendChild(context);
  }

  function bind(){
    d.addEventListener('click',function(e){
      var returnButton=e.target&&e.target.closest?e.target.closest('[data-navshell-return-workspace]'):null;
      if(returnButton){e.preventDefault();returnToWorkspace();return;}
      var settingsButton=e.target&&e.target.closest?e.target.closest('[data-navshell-settings-toggle]'):null;
      if(settingsButton){e.preventDefault();toggleSettings();return;}
      var routeButton=e.target&&e.target.closest?e.target.closest('[data-navshell-route]'):null;
      if(routeButton){e.preventDefault();activateRoute(routeButton.getAttribute('data-navshell-route'),{focus:true});return;}
      var analysisButton=e.target&&e.target.closest?e.target.closest('[data-navshell-analysis-view]'):null;
      if(analysisButton){e.preventDefault();activateRoute(analysisButton.getAttribute('data-navshell-analysis-view'),{focus:true});return;}
      var jump=e.target&&e.target.closest?e.target.closest('[data-navshell-jump]'):null;
      if(jump){e.preventDefault();var jumpId=jump.getAttribute('data-navshell-jump');var route=TARGET_ROUTE[jumpId]||currentRoute;activateRoute(route,{targetId:jumpId,focus:false});return;}
      if(e.target&&e.target.closest&&e.target.closest('#navigationShellRationKpi')){e.preventDefault();activateRoute('ration',{targetId:'rationSection'});return;}
      if(currentMode===MODE_WORKSPACE){
        var anchor=closestAnchor(e.target),href=anchor&&anchor.getAttribute('href');
        if(anchor&&href&&href.charAt(0)==='#'){
          var id=href.slice(1),targetRoute=TARGET_ROUTE[id],isSkip=anchor.classList&&anchor.classList.contains('skip-link');
          if(targetRoute&&isSkip){e.preventDefault();activateRoute(targetRoute,{targetId:id,focus:false});w.setTimeout(function(){var target=byId(id);if(target){if(!target.hasAttribute('tabindex')&&!/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName))target.setAttribute('tabindex','-1');try{target.focus({preventScroll:true});}catch(_){try{target.focus();}catch(__){}}}},80);return;}
          if(targetRoute){e.preventDefault();activateRoute(targetRoute,{targetId:id,focus:true});}
        }
      }
    },false);

    function syncFromLocation(){
      w.clearTimeout(routeSyncTimer);routeSyncTimer=w.setTimeout(function(){
        var requested=queryMode(),route=routeFromHash()||routeFromLegacyHash()||currentRoute;
        if(requested===MODE_LONG&&currentMode!==MODE_LONG){setMode(MODE_LONG,{route:route,fromLocation:true});return;}
        if(requested!==MODE_LONG&&currentMode!==MODE_WORKSPACE){setMode(MODE_WORKSPACE,{route:route,fromLocation:true,replace:true,restoreScroll:true});return;}
        if(currentMode===MODE_WORKSPACE&&route&&route!==currentRoute)activateRoute(route,{updateHash:false,restoreScroll:true,focus:false});
      },10);
    }
    w.addEventListener('popstate',syncFromLocation,false);
    w.addEventListener('hashchange',syncFromLocation,false);
    w.addEventListener('pagehide',function(){saveScroll(currentRoute);},false);
    w.addEventListener('ration:changed',function(){w.setTimeout(refreshRationKpi,40);},false);
    w.addEventListener('app:ready',function(){w.setTimeout(function(){refreshRationKpi();scheduleVisibilityGuard();},80);},false);
    d.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#rationSection'))w.setTimeout(refreshRationKpi,60);},true);
    d.addEventListener('click',function(e){if(e.target&&e.target.closest&&(e.target.closest('[data-role="add-search"]')||e.target.closest('[data-role="add"]')||e.target.closest('#clearRationBtn')))w.setTimeout(refreshRationKpi,160);},true);
    if(w.MutationObserver){
      var source=byId('rationKpiStrip');
      if(source){try{new MutationObserver(refreshRationKpi).observe(source,{childList:true,characterData:true,subtree:true});}catch(_){} }
    }
  }

  function init(){
    if(initialized)return;initialized=true;
    routeScroll=safeJson(safeGet(storageRef('sessionStorage'),SCROLL_KEY),{});
    createTechnicalFallbackControl();createShell();recordOriginalState();bind();
    currentMode=resolveInitialMode();currentRoute=resolveInitialRoute();
    d.documentElement.setAttribute('data-navigation-shell',currentMode);
    updateTechnicalFallbackControl();updateSettingsControls();
    if(currentMode===MODE_WORKSPACE){d.documentElement.removeAttribute('data-navigation-long-fallback');replaceLocation(MODE_WORKSPACE,currentRoute);activateRoute(currentRoute,{replace:true,updateHash:true,restoreScroll:true});}
    else{d.documentElement.setAttribute('data-navigation-long-fallback','technical');restoreLongPage();updateTechnicalFallbackControl();var initialAnchor=equivalentLegacyAnchor(currentRoute),initialUrl=currentUrl();initialUrl.hash=initialAnchor?'#'+initialAnchor:'';commitUrl(initialUrl,true,w.history&&w.history.state);}
    refreshRationKpi();
    w.NavigationShellV1={
      version:VERSION,
      setMode:function(mode){setMode(mode,{focus:true,route:currentRoute});},
      returnToWorkspace:returnToWorkspace,
      navigate:function(route,targetId){activateRoute(route,{targetId:targetId||'',focus:true});},
      getState:function(){return {version:VERSION,mode:currentMode,route:currentRoute,workspace:ROUTES[currentRoute]?ROUTES[currentRoute].workspace:'',settingsOpen:settingsOpen,needsReady:needsReady(),technicalFallback:currentMode===MODE_LONG};},
      registerManaged:registerManaged,
      refresh:function(){if(currentMode===MODE_WORKSPACE)setWorkspaceVisibility(currentRoute);updateContext();refreshRationKpi();},
      routes:ROUTES
    };
    dispatch('navigation-shell:ready',w.NavigationShellV1.getState());
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
/* END assets/legacy/js/75-navigation-shell-v5.3.210-rc2-hf17.js */

/* BEGIN assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js */
/* Nutrition Calculator v5.3.210 RC2 HF18
 * Profile-first workspace flow. The person's anthropometric profile and calculated
 * needs precede ration editing, while the four main work areas remain unchanged.
 * Reads the existing needs calculation state; does not duplicate formulas.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf18-profile-needs';
  var initialized=false;
  var refreshTimer=0;
  var observers=[];

  function byId(id){return d.getElementById(id);}
  function text(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim():'';}
  function setText(node,value){value=String(value==null?'':value);if(node&&node.textContent!==value)node.textContent=value;}
  function setAttr(node,name,value){value=String(value);if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);}
  function setHidden(node,value){value=!!value;if(node&&node.hidden!==value)node.hidden=value;}
  function toggleClass(node,name,value){if(!node)return;value=!!value;if(node.classList.contains(name)!==value)node.classList.toggle(name,value);}
  function removeAttr(node,name){if(node&&node.hasAttribute(name))node.removeAttribute(name);}
  function value(id){var el=byId(id);return el?String(el.value||'').trim():'';}
  function number(id){var n=Number(value(id).replace(',','.'));return isFinite(n)?n:NaN;}
  function fmt(n,digits){n=Number(n);if(!isFinite(n))return '—';return n.toLocaleString('ru-RU',{maximumFractionDigits:digits==null?0:digits,minimumFractionDigits:0});}
  function route(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'';}catch(_){return '';}}
  function workspace(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().mode==='workspace':false;}catch(_){return false;}}
  function meta(){try{return w.__lastNeedsProfileApplied===true&&w.__lastNeedsMeta?w.__lastNeedsMeta:null;}catch(_){return null;}}
  function ready(){return !!meta();}
  function sexLabel(v){return v==='female'?'женщина':v==='male'?'мужчина':'пол не указан';}
  function personName(){return value('needs_person_name');}
  function profileLine(m){
    var parts=[];
    if(m&&m.sex)parts.push(sexLabel(m.sex));
    if(m&&isFinite(Number(m.age)))parts.push(fmt(m.age,0)+' лет');
    if(m&&isFinite(Number(m.h)))parts.push(fmt(m.h,0)+' см');
    if(m&&isFinite(Number(m.w)))parts.push(fmt(m.w,1)+' кг');
    return parts.join(' · ');
  }
  function targetsLine(m){
    if(!m)return 'Потребности ещё не рассчитаны';
    var parts=[];
    if(isFinite(Number(m.energyTarget)))parts.push(fmt(m.energyTarget,0)+' ккал');
    if(isFinite(Number(m.totalProtein)))parts.push('Б '+fmt(m.totalProtein,1)+' г');
    if(isFinite(Number(m.fatGrams)))parts.push('Ж '+fmt(m.fatGrams,1)+' г');
    if(isFinite(Number(m.carbGrams)))parts.push('У '+fmt(m.carbGrams,1)+' г');
    if(isFinite(Number(m.fluidMl)))parts.push('вода '+fmt(m.fluidMl/1000,1)+' л');
    return parts.length?parts.join(' · '):'Расчёт выполнен с ограничениями выбранного профиля';
  }

  function createProfilePanel(){
    var main=byId('mainContent'),needs=byId('needsCompact');
    if(!main||!needs||byId('workspaceProfilePanel'))return;
    var panel=d.createElement('section');
    panel.id='workspaceProfilePanel';panel.className='card workspace-profile-panel';panel.hidden=true;panel.setAttribute('data-navshell-original-hidden','1');panel.setAttribute('aria-labelledby','workspaceProfileTitle');
    panel.innerHTML=''+
      '<div class="workspace-profile-panel__tools"><span id="workspaceProfileTitle">Этапы работы</span><button type="button" class="secondary" data-navshell-settings-toggle aria-expanded="false">Настройки</button></div>'+
      '<ol class="workspace-profile-steps" aria-label="Этапы работы"><li data-profile-step="profile" class="is-current" aria-current="step"><b>1</b><span><strong>Профиль</strong><small>исходные данные</small></span></li><li data-profile-step="needs"><b>2</b><span><strong>Потребности</strong><small>калории, БЖУ и вода</small></span></li><li data-profile-step="ration"><b>3</b><span><strong>Рацион</strong><small>продукты и анализ</small></span></li></ol>'+
      '<div class="workspace-profile-status" id="workspaceProfileStatus" role="status" aria-live="polite"><div><span>Статус</span><strong id="workspaceProfileStatusTitle">Профиль не заполнен</strong><small id="workspaceProfileStatusText">Заполните основные поля и нажмите «Рассчитать».</small></div><button type="button" id="workspaceProfilePrimaryAction" data-profile-action="focus">Перейти к данным</button></div>';
    main.insertBefore(panel,needs);
  }

  function createPersonContext(){
    var context=byId('navigationShellContext');
    if(!context||byId('workspacePersonContext'))return;
    var panel=d.createElement('section');panel.id='workspacePersonContext';panel.className='workspace-person-context';panel.setAttribute('aria-label','Профиль человека и рассчитанные потребности');
    panel.innerHTML='<div class="workspace-person-context__copy"><span>Текущий профиль</span><strong id="workspacePersonName">Профиль не заполнен</strong><small id="workspacePersonDetails">Сначала рассчитайте потребности</small></div><div class="workspace-person-context__targets" id="workspacePersonTargets">Потребности не рассчитаны</div><button type="button" data-workspace-route="profile" id="workspacePersonEdit">Рассчитать</button>';
    var summary=byId('workspaceRationInlineSummary');
    if(summary&&summary.parentNode===context)context.insertBefore(panel,summary);else context.appendChild(panel);
  }

  function createNextAction(){
    var out=byId('needs_out'),needs=byId('needs');
    if(!out||!needs||byId('workspaceProfileNext'))return;
    var box=d.createElement('div');box.id='workspaceProfileNext';box.className='workspace-profile-next';box.hidden=true;
    box.innerHTML='<div><span>Следующий шаг</span><strong id="workspaceProfileNextTitle">Потребности рассчитаны</strong><small id="workspaceProfileNextText">Теперь можно составлять рацион этого человека.</small></div><button type="button" data-workspace-route="ration">Перейти к рациону</button>';
    if(out.nextSibling)out.parentNode.insertBefore(box,out.nextSibling);else out.parentNode.appendChild(box);
  }

  function normalizeCopy(){
    var label=d.querySelector('label[for="needs_person_name"]'),input=byId('needs_person_name'),heading=d.querySelector('#needs .section-title-row h1'),status=byId('v40NeedsStatus');
    setText(label,'Имя или ФИО (необязательно)');
    setAttr(input,'placeholder','Иван Иванов');
    setText(heading,'Профиль и расчёт потребностей');
    setText(status,ready()?'Потребности рассчитаны. При изменении исходных данных выполните расчёт повторно.':'Сначала заполните данные человека и рассчитайте потребности. Затем переходите к его рациону.');
  }

  function ensureNeedsOpen(){
    if(!workspace()||route()!=='profile')return;
    var section=byId('needsCompact'),toggle=byId('v40NeedsToggle');
    if(section&&section.classList.contains('v40-needs-collapsed')&&toggle){try{toggle.click();}catch(_){section.classList.remove('v40-needs-collapsed');}}
  }

  function focusForm(){
    ensureNeedsOpen();
    var input=byId('needs_person_name')||byId('needs_h')||byId('needs');
    if(!input)return;
    try{input.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){input.scrollIntoView(true);}
    w.setTimeout(function(){try{input.focus({preventScroll:true});}catch(_){try{input.focus();}catch(__){}}},180);
  }

  function refreshProfilePanel(){
    var m=meta(),name=personName(),statusTitle=byId('workspaceProfileStatusTitle'),statusText=byId('workspaceProfileStatusText'),action=byId('workspaceProfilePrimaryAction'),panel=byId('workspaceProfilePanel');
    toggleClass(panel,'is-ready',!!m);
    var steps=d.querySelectorAll('[data-profile-step]'),i,step,key,isCurrent,isComplete;
    for(i=0;i<steps.length;i++){
      step=steps[i];key=step.getAttribute('data-profile-step');isCurrent=!!m?key==='ration':key==='profile';isComplete=!!m&&key!=='ration';
      toggleClass(step,'is-current',isCurrent);toggleClass(step,'is-complete',isComplete);
      if(isCurrent)setAttr(step,'aria-current','step');else removeAttr(step,'aria-current');
    }
    setText(statusTitle,m?(name||'Профиль без имени'):'Профиль не заполнен');
    setText(statusText,m?(profileLine(m)+' · '+targetsLine(m)):'Заполните основные поля и нажмите «Рассчитать».');
    setText(action,m?'Перейти к рациону':'Перейти к данным');setAttr(action,'data-profile-action',m?'ration':'focus');
    var next=byId('workspaceProfileNext');setHidden(next,!m);
    setText(byId('workspaceProfileNextTitle'),(name||'Профиль')+': потребности рассчитаны');
    setText(byId('workspaceProfileNextText'),targetsLine(m)+'. Теперь можно составлять и анализировать рацион.');
  }

  function refreshPersonContext(){
    var m=meta(),name=personName(),box=byId('workspacePersonContext');
    if(!box)return;
    toggleClass(box,'is-pending',!m);setHidden(box,!workspace()||route()==='profile');
    setText(byId('workspacePersonName'),m?(name||'Профиль без имени'):'Потребности не рассчитаны');
    setText(byId('workspacePersonDetails'),m?profileLine(m):'Рацион пока не привязан к рассчитанному профилю');
    setText(byId('workspacePersonTargets'),m?targetsLine(m):'Сначала введите рост, массу, возраст и активность');
    setText(byId('workspacePersonEdit'),m?'Изменить профиль':'Рассчитать');
  }

  function updateSkipLinks(){
    if(!workspace()||route()!=='profile')return;
    var links=d.querySelectorAll('body>.skip-link');
    if(links[0]){setAttr(links[0],'href','#needs_person_name');setText(links[0],'Перейти к данным человека');}
    if(links[1]){setAttr(links[1],'href','#needs_calc_btn');setText(links[1],'Перейти к расчёту потребностей');}
  }

  function refresh(){normalizeCopy();ensureNeedsOpen();refreshProfilePanel();refreshPersonContext();updateSkipLinks();}
  function schedule(){w.clearTimeout(refreshTimer);refreshTimer=w.setTimeout(refresh,45);}

  function bind(){
    d.addEventListener('click',function(e){
      var action=e.target&&e.target.closest?e.target.closest('[data-profile-action]'):null;
      if(action){e.preventDefault();if(action.getAttribute('data-profile-action')==='ration'&&w.NavigationShellV1)w.NavigationShellV1.navigate('ration');else focusForm();return;}
    },false);
    ['needs:computed','needs:invalidated','navigation-shell:route-changed','navigation-shell:mode-changed','app:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    d.addEventListener('needs:computed',schedule,false);d.addEventListener('needs:invalidated',schedule,false);
    d.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#needsCompact'))schedule();},true);
    d.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#needsCompact'))schedule();},true);
    if(w.MutationObserver){['needs_out','v40NeedsStatus'].forEach(function(id){var node=byId(id);if(!node)return;try{var observer=new MutationObserver(schedule);observer.observe(node,{childList:true,subtree:true,characterData:true});observers.push(observer);}catch(_){}});}
  }

  function register(){
    if(!w.NavigationShellV1)return;
    if(typeof w.NavigationShellV1.registerManaged==='function')w.NavigationShellV1.registerManaged('workspaceProfilePanel',true);
    if(typeof w.NavigationShellV1.refresh==='function')w.NavigationShellV1.refresh();
  }

  function init(){
    if(initialized)return;initialized=true;
    createProfilePanel();createPersonContext();createNextAction();normalizeCopy();register();bind();schedule();
    w.NutritionWorkspaceProfileHF8={version:VERSION,refresh:refresh,isReady:ready,getState:function(){var m=meta();return {version:VERSION,ready:!!m,name:personName(),route:route(),targets:m?{kcal:m.energyTarget,protein:m.totalProtein,fat:m.fatGrams,carbs:m.carbGrams,water:m.fluidMl}:null};}};
    try{w.dispatchEvent(new CustomEvent('workspace-profile:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
/* END assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js */

/* BEGIN assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js */
/* Nutrition Calculator v5.3.210 RC2 HF28
 * Resilient trusted-gesture bridge for camera, files and microphone entry.
 * Keeps permission feedback visible in the entry card, releases stuck requests,
 * and provides a native recorder fallback for constrained mobile WebViews.
 */
(function(w,d){
  'use strict';
  var VERSION='v5.3.210-rc2-hf28-gemini-reliability';
  var loadPromise=null,voicePending=false,installed=false,voiceToken=0;
  var softTimer=0,hardTimer=0,statusMirror=null;

  function byId(id){return d.getElementById(id);}
  function api(){return w.NutritionGeminiRationImport||null;}
  function numberSetting(name,fallback,min,max){var n=Number(w[name]);return isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
  function softTimeout(){return numberSetting('__NUTRITION_MIC_SOFT_TIMEOUT_MS__',2800,250,15000);}
  function hardTimeout(){return numberSetting('__NUTRITION_MIC_HARD_TIMEOUT_MS__',18000,1500,60000);}
  function moduleUrl(){
    var m=w.__NUTRITION_RUNTIME_MANIFEST__||{},lazy=m.lazyFeatureScripts||{};
    return lazy.geminiMediaImport||'./assets/js/62-gemini-ration-import-v5.js?v=v5.3.210-rc2-hf28-gemini-reliability';
  }
  function openTools(){var details=byId('workspaceRationSecondary');if(details){details.open=true;try{d.documentElement.setAttribute('data-workspace-secondary-open','1');}catch(_){}}}
  function reveal(){
    openTools();var section=byId('geminiRationImportSection');
    if(section){try{section.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{section.scrollIntoView(true);}catch(__){}}}
  }
  function setStatus(message,state){var el=byId('geminiRationStatus');if(el){el.textContent=message||'';el.dataset.state=state||'idle';}}
  function entryButton(){return d.querySelector('[data-ration-entry-method="voice"]');}
  function directRecordButton(){return byId('geminiRationRecordAudio');}
  function setDirectRecordState(state,label){var button=directRecordButton();if(!button)return;button.dataset.actionState=state||'idle';button.setAttribute('aria-busy',state==='working'?'true':'false');button.setAttribute('aria-pressed',state==='recording'?'true':'false');if(label)button.innerHTML=(state==='recording'?'<span aria-hidden="true">●</span> ':'')+label;}
  function setEntryStatus(message,state,showFallback){
    var box=byId('workspaceMediaEntryStatus'),text=byId('workspaceMediaEntryStatusText'),fallback=byId('workspaceNativeVoiceFallback'),button=entryButton();
    if(box){box.hidden=!message;box.dataset.state=state||'idle';}
    if(text)text.textContent=message||'';
    if(fallback)fallback.hidden=!showFallback;
    if(button){button.setAttribute('aria-busy',state==='working'?'true':'false');button.dataset.mediaState=state||'idle';}
  }
  function pendingPanel(on,message){
    var panel=byId('geminiRationRecorderPanel'),label=byId('geminiRationRecorderState'),timer=byId('geminiRationRecorderTimer');
    if(panel){panel.hidden=!on;panel.dataset.recorderState=on?'starting':'idle';}
    if(label&&message)label.textContent=message;
    if(timer&&on)timer.textContent='0:00 / 5:00';
  }
  function policyAllowsMicrophone(){
    try{var p=d.permissionsPolicy||d.featurePolicy;if(p&&typeof p.allowsFeature==='function')return p.allowsFeature('microphone');}catch(_){}
    return true;
  }
  function stopStream(stream){try{if(stream&&typeof stream.getTracks==='function')stream.getTracks().forEach(function(t){try{t.stop();}catch(_){}});}catch(_){}}
  function clearVoiceTimers(){if(softTimer){w.clearTimeout(softTimer);softTimer=0;}if(hardTimer){w.clearTimeout(hardTimer);hardTimer=0;}}
  function microphoneError(error){
    var name=error&&error.name||'',message=error&&error.message||'';
    if(name==='NotAllowedError'||name==='PermissionDeniedError'){
      if(!policyAllowsMicrophone())return 'Браузер или контейнер страницы запретил микрофон. Откройте калькулятор в обычной вкладке браузера либо разрешите microphone для iframe.';
      return 'Доступ к микрофону не разрешён. В настройках сайта разрешите микрофон и повторите запись.';
    }
    if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'На устройстве не найден доступный микрофон.';
    if(name==='NotReadableError'||name==='TrackStartError')return 'Микрофон занят другим приложением или недоступен системе.';
    if(name==='OverconstrainedError'||name==='ConstraintNotSatisfiedError')return 'Браузер не смог применить параметры микрофона. Используйте системный диктофон или готовый аудиофайл.';
    if(name==='SecurityError')return 'Браузер заблокировал микрофон из-за настроек безопасности страницы.';
    if(name==='AbortError')return 'Подключение микрофона было прервано. Повторите попытку.';
    if(message&&/HTTPS|secure context/i.test(message))return message;
    return message?'Не удалось открыть микрофон: '+message:'Не удалось открыть микрофон.';
  }
  function finishFailure(error,token){
    if(token!=null&&token!==voiceToken)return false;
    clearVoiceTimers();voicePending=false;pendingPanel(false);
    var message=microphoneError(error);setStatus(message,'error');setEntryStatus(message,'error',true);setDirectRecordState('error','Повторить запись');return false;
  }
  function nativeVoiceInput(){
    var input=byId('workspaceNativeVoiceCaptureInput');if(input)return input;
    input=d.createElement('input');input.id='workspaceNativeVoiceCaptureInput';input.type='file';input.accept='audio/*';input.setAttribute('capture','microphone');input.hidden=true;
    input.addEventListener('change',function(){var files=Array.prototype.slice.call(input.files||[]);input.value='';if(files.length)ingest(files,'audio','microphone-native');});
    (d.body||d.documentElement).appendChild(input);return input;
  }
  function openNativeRecorder(){
    var input=nativeVoiceInput();setDirectRecordState('working','Открываем диктофон…');setEntryStatus('Открываем системный диктофон или выбор аудиозаписи…','working',false);
    try{input.click();return true;}catch(error){finishFailure(new Error('Браузер не открыл системный диктофон. Выберите «Аудиофайл» или откройте калькулятор в обычном Chrome/Firefox.'));return false;}
  }
  function ensureModule(){
    if(api())return Promise.resolve(api());
    if(loadPromise)return loadPromise;
    loadPromise=new Promise(function(resolve,reject){
      var existing=d.querySelector('script[data-gemini-media-lazy-module]'),script=existing||d.createElement('script'),done=false;
      var timer=w.setTimeout(function(){if(done)return;done=true;loadPromise=null;reject(new Error('Модуль фото и голоса загружается слишком долго. Обновите страницу и повторите попытку.'));},20000);
      function finish(error){
        if(done)return;done=true;w.clearTimeout(timer);
        if(error){loadPromise=null;reject(error);return;}
        var ready=api();if(ready)resolve(ready);else{loadPromise=null;reject(new Error('Модуль фото и голоса загрузился некорректно.'));}
      }
      if(existing){
        if(api()){finish();return;}
        existing.addEventListener('load',function(){finish();},{once:true});existing.addEventListener('error',function(){finish(new Error('Не удалось загрузить модуль фото и голоса.'));},{once:true});return;
      }
      script.src=moduleUrl();script.async=true;script.setAttribute('data-gemini-media-lazy-module',VERSION);
      script.onload=function(){finish();};script.onerror=function(){finish(new Error('Не удалось загрузить модуль фото и голоса. Проверьте файлы на хостинге.'));};
      (d.head||d.documentElement).appendChild(script);
    });
    return loadPromise;
  }
  function ingest(files,kind,source){
    files=Array.prototype.slice.call(files||[]);if(!files.length){setEntryStatus('', 'idle', false);return Promise.resolve([]);}
    var preparing=kind==='image'?'Подготавливаем фотографию…':'Подготавливаем аудиозапись…';setStatus(preparing,'working');setEntryStatus(preparing,'working',false);
    return ensureModule().then(function(mod){
      if(!mod||typeof mod.ingestFiles!=='function')throw new Error('Модуль импорта не готов принимать файлы.');
      return mod.ingestFiles(files,kind,source);
    }).then(function(items){
      var ok=items&&items.length;setEntryStatus(ok?(kind==='image'?'Фотография подготовлена. Перейдите к блоку ИИ для распознавания.':'Аудиозапись подготовлена. Перейдите к блоку ИИ для распознавания.'):'Файл не был выбран.',ok?'success':'idle',false);if(ok)reveal();return items||[];
    }).catch(function(error){var message=error&&error.message?error.message:'Не удалось подготовить файл.';setStatus(message,'error');setEntryStatus(message,'error',kind==='audio');return [];});
  }
  function choose(inputId,kind){
    reveal();var input=byId(inputId);if(!input){var missing='Элемент выбора файла не найден. Обновите страницу.';setStatus(missing,'error');setEntryStatus(missing,'error',false);return;}
    setEntryStatus(kind==='image'?'Открываем выбор фотографии…':'Открываем выбор аудиофайла…','working',false);
    ensureModule().catch(function(error){setStatus(error.message,'error');setEntryStatus(error.message,'error',kind==='audio');});
    try{input.click();}catch(error){var message='Браузер не открыл выбор файла. Повторите попытку.';setStatus(message,'error');setEntryStatus(message,'error',false);}
  }
  function startVoice(){
    if(voicePending){
      /* Keep the explicit repeated-click response visible instead of allowing
         an almost-expired soft watchdog to overwrite it immediately. */
      if(softTimer)w.clearTimeout(softTimer);
      var repeatedToken=voiceToken;
      softTimer=w.setTimeout(function(){if(voicePending&&repeatedToken===voiceToken)setEntryStatus('Браузер всё ещё ожидает разрешение на микрофон. Если окно не появилось, нажмите «Открыть диктофон».','working',true);},softTimeout());
      setDirectRecordState('working','Ожидаем разрешение…');setEntryStatus('Ожидаем ответ браузера на запрос микрофона. Если окно разрешения не появилось, откройте системный диктофон.','working',true);return false;
    }
    if(!w.isSecureContext||!navigator.mediaDevices||typeof navigator.mediaDevices.getUserMedia!=='function'){
      var unsupported='Прямая запись недоступна в этом режиме браузера. Открываем системный диктофон; также можно выбрать готовый аудиофайл.';setDirectRecordState('error','Открыть диктофон');setStatus(unsupported,'error');setEntryStatus(unsupported,'error',true);return openNativeRecorder();
    }
    voicePending=true;var token=++voiceToken;setDirectRecordState('working','Подключаем микрофон…');pendingPanel(true,'Подключаем микрофон…');setStatus('Запрашиваем доступ к микрофону…','working');setEntryStatus('Запрашиваем доступ к микрофону… Разрешите его во всплывающем окне браузера.','working',true);
    var streamPromise,modulePromise;
    try{
      /* Do not pre-block on document.featurePolicy: several Android WebViews report
         a false negative. The actual getUserMedia result is the source of truth. */
      streamPromise=navigator.mediaDevices.getUserMedia({audio:true});
    }catch(error){return finishFailure(error,token);}
    modulePromise=ensureModule();
    softTimer=w.setTimeout(function(){if(voicePending&&token===voiceToken)setEntryStatus('Браузер всё ещё ожидает разрешение на микрофон. Если окно не появилось, нажмите «Открыть диктофон».','working',true);},softTimeout());
    hardTimer=w.setTimeout(function(){
      if(!voicePending||token!==voiceToken)return;voicePending=false;voiceToken++;clearVoiceTimers();pendingPanel(false);
      var message='Браузер не ответил на запрос микрофона. Откройте калькулятор в обычной вкладке Chrome/Firefox либо используйте системный диктофон.';setDirectRecordState('error','Повторить запись');setStatus(message,'error');setEntryStatus(message,'error',true);
    },hardTimeout());
    Promise.all([Promise.resolve(streamPromise),modulePromise]).then(function(values){
      var stream=values[0],mod=values[1];if(token!==voiceToken||!voicePending){stopStream(stream);return false;}
      clearVoiceTimers();voicePending=false;
      if(!mod||typeof mod.startLiveRecordingWithStream!=='function'){stopStream(stream);throw new Error('Модуль записи загружен без совместимого обработчика микрофона.');}
      return Promise.resolve(mod.startLiveRecordingWithStream(stream)).then(function(started){
        if(started){setEntryStatus('Микрофон включён. Запись идёт; остановить её можно в открывшемся блоке ИИ.','success',false);setDirectRecordState('recording','Запись идёт');reveal();}
        else{var lower=byId('geminiRationStatus'),message=lower&&lower.textContent?lower.textContent:'Запись не запустилась. Используйте системный диктофон или готовый аудиофайл.';setEntryStatus(message,'error',true);}
        return started;
      });
    }).catch(function(error){
      finishFailure(error,token);
      Promise.resolve(modulePromise).then(function(){if(!voicePending&&token===voiceToken)setDirectRecordState('error','Повторить запись');}).catch(function(){});
    });
    return true;
  }
  function clickHandler(e){
    var target=e.currentTarget,id=target&&target.id||'';
    /* A second press while the browser permission request is still pending must
       remain owned by the bridge even if the lazy media module has already
       finished loading. Otherwise two getUserMedia requests can race and the
       explicit "Ожидаем ответ браузера" feedback disappears. */
    if(id==='geminiRationRecordAudio'&&voicePending){
      e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();startVoice();return;
    }
    if(api())return;
    e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    if(id==='geminiRationRecordAudio')startVoice();
    else if(id==='geminiRationChoosePhotos')choose('geminiRationPhotoInput','image');
    else if(id==='geminiRationTakePhoto')choose('geminiRationCameraInput','image');
    else if(id==='geminiRationChooseAudio')choose('geminiRationAudioInput','audio');
  }
  function changeHandler(e){
    if(api())return;var input=e.currentTarget,files=Array.prototype.slice.call(input.files||[]);if(!files.length)return;
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();input.value='';
    if(input.id==='geminiRationPhotoInput')ingest(files,'image','upload');
    else if(input.id==='geminiRationCameraInput')ingest(files,'image','camera');
    else ingest(files,'audio','upload');
  }
  function bindStatusMirror(){
    var status=byId('geminiRationStatus');if(!status||!w.MutationObserver||statusMirror)return;
    statusMirror=new MutationObserver(function(){var text=String(status.textContent||'').trim(),state=status.dataset.state||'idle';if(text&&!voicePending)setEntryStatus(text,state,state==='error');});
    try{statusMirror.observe(status,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-state']});}catch(_){statusMirror=null;}
  }
  function bind(){
    if(installed)return;installed=true;nativeVoiceInput();
    ['geminiRationChoosePhotos','geminiRationTakePhoto','geminiRationChooseAudio','geminiRationRecordAudio'].forEach(function(id){var el=byId(id);if(el){el.setAttribute('data-media-resilient-bridge','1');el.addEventListener('click',clickHandler,false);}});
    ['geminiRationPhotoInput','geminiRationCameraInput','geminiRationAudioInput'].forEach(function(id){var el=byId(id);if(el)el.addEventListener('change',changeHandler,false);});
    var fallback=byId('workspaceNativeVoiceFallback');if(fallback)fallback.addEventListener('click',function(e){e.preventDefault();openNativeRecorder();},false);
    bindStatusMirror();
  }
  function ready(fn){if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',fn,false);else fn();}
  w.NutritionMediaEntryBridge={version:VERSION,ensureModule:ensureModule,choosePhotos:function(){choose('geminiRationPhotoInput','image');},takePhoto:function(){choose('geminiRationCameraInput','image');},chooseAudio:function(){choose('geminiRationAudioInput','audio');},startVoice:startVoice,openNativeRecorder:openNativeRecorder,ingestFiles:ingest,policyAllowsMicrophone:policyAllowsMicrophone,isVoicePending:function(){return voicePending;},resetVoicePending:function(){voiceToken++;voicePending=false;clearVoiceTimers();pendingPanel(false);}};
  ready(bind);
})(window,document);
/* END assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js */

/* BEGIN assets/legacy/js/89-workspace-entry-ux-v6.0.0-alpha1.js */
/* Nutrition Calculator v5.3.210 RC2 HF28
 * Restores an explicit view switcher, provides a reliable return to profile,
 * and makes photo/voice ration entry visible at the point where products are added.
 * ES5-safe and shared by modern and compatibility runtimes.
 */
(function(w,d){
  'use strict';

  var VERSION='v6.0.0-alpha1-responsive-layout';
  var LAYOUT_KEY='nutritionCalculator.workspaceLayout.v1';
  var initialized=false;
  var syncTimer=0;

  function byId(id){return d.getElementById(id);}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function shellState(){var api=shell();try{return api&&api.getState?api.getState():null;}catch(_){return null;}}
  function setText(node,value){value=String(value==null?'':value);if(node&&node.textContent!==value)node.textContent=value;}
  function setAttr(node,name,value){value=String(value);if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);}
  function toggle(node,name,on){if(node&&node.classList.contains(name)!==!!on)node.classList.toggle(name,!!on);}

  function createModeSwitcher(){
    var header=d.querySelector('#mainContent>header'),title=header&&header.querySelector('.title');
    if(!header||byId('workspaceViewSwitcher'))return;
    var box=d.createElement('div');
    box.id='workspaceViewSwitcher';
    box.className='workspace-view-switcher';
    box.setAttribute('role','group');
    box.setAttribute('aria-label','Режим отображения калькулятора');
    box.innerHTML='<span>Вид</span><button type="button" data-workspace-view-mode="sections" aria-pressed="false">Разделы</button><button type="button" data-workspace-view-mode="canvas" aria-pressed="false">Полотно</button>';
    if(title&&title.nextSibling)header.insertBefore(box,title.nextSibling);else header.appendChild(box);
  }

  function createProfileBackAction(){
    var context=byId('navigationShellContext'),copy=context&&context.querySelector('.navigation-shell-context__copy');
    if(!context||byId('workspaceProfileBackAction'))return;
    var button=d.createElement('button');
    button.type='button';
    button.id='workspaceProfileBackAction';
    button.className='workspace-profile-back-action';
    button.setAttribute('data-workspace-profile-back','');
    button.innerHTML='<span aria-hidden="true">←</span> Профиль и потребности';
    if(copy&&copy.nextSibling)context.insertBefore(button,copy.nextSibling);else context.appendChild(button);
  }

  function methodIcon(kind){
    if(kind==='search')return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>';
    if(kind==='photo')return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>';
    if(kind==='voice')return '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"></rect><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"></path></svg>';
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v5h5"></path><path d="M9 15c1.2-2 4.8-2 6 0"></path></svg>';
  }

  function ensureMediaEntryStyles(){
    if(byId('workspaceMediaEntryStatusStyles'))return;
    var style=d.createElement('style');style.id='workspaceMediaEntryStatusStyles';
    style.textContent="#workspaceMediaEntryStatus{grid-column:1/-1;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-top:8px;padding:10px 12px;border:1px solid #b8cbe0;border-radius:12px;background:#f7faff;color:#29455f;font-size:12px;line-height:1.4}#workspaceMediaEntryStatus[hidden]{display:none!important}#workspaceMediaEntryStatus[data-state=working]{border-color:#8db9e5;background:#edf6ff;color:#174f80}#workspaceMediaEntryStatus[data-state=success]{border-color:#9bc9ae;background:#f1faf4;color:#245c39}#workspaceMediaEntryStatus[data-state=error]{border-color:#e0b3ad;background:#fff6f4;color:#7a3028}#workspaceMediaEntryStatusText{min-width:0;flex:1}#workspaceNativeVoiceFallback{flex:0 0 auto;min-height:38px!important;padding:7px 10px!important;border:1px solid currentColor!important;border-radius:9px!important;background:#fff!important;color:inherit!important;font-size:11px!important;font-weight:800!important}.workspace-ration-entry-methods__grid button[aria-busy=true]{filter:saturate(.82);box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)!important}.workspace-ration-entry-methods__grid button[data-media-state=error]{outline:2px solid rgba(153,55,43,.28);outline-offset:2px}@media(max-width:520px){#workspaceMediaEntryStatus{display:grid}#workspaceNativeVoiceFallback{width:100%}}";
    (d.head||d.documentElement).appendChild(style);
  }

  function createRationEntryMethods(){
    var search=byId('globalSearchSection'),head=search&&search.querySelector('.search-hero-head');
    if(!search||byId('workspaceRationEntryMethods'))return;
    var panel=d.createElement('section');
    panel.id='workspaceRationEntryMethods';
    panel.className='workspace-ration-entry-methods';
    panel.setAttribute('aria-labelledby','workspaceRationEntryMethodsTitle');
    panel.innerHTML=''+
      '<div class="workspace-ration-entry-methods__copy"><span>Добавление продуктов</span><strong id="workspaceRationEntryMethodsTitle">Поиск или ИИ-распознавание</strong><small>ИИ может распознать продукты по фотографии, голосу или готовому аудиофайлу.</small><em>Нажатие сразу открывает выбор фотографии, аудиофайла или запись голоса. Калькулятор не запрашивает пароли и платёжные данные.</em></div>'+
      '<div class="workspace-ration-entry-methods__grid">'+
        '<button type="button" data-ration-entry-method="search">'+methodIcon('search')+'<span><b>По названию</b><small>Поиск в базе</small></span></button>'+
        '<button type="button" data-ration-entry-method="photo">'+methodIcon('photo')+'<span><b>По фотографии</b><small>Распознать с ИИ</small></span></button>'+
        '<button type="button" data-ration-entry-method="voice">'+methodIcon('voice')+'<span><b>Записать голос</b><small>Распознать с ИИ</small></span></button>'+
        '<button type="button" data-ration-entry-method="audio">'+methodIcon('audio')+'<span><b>Аудиофайл</b><small>Распознать с ИИ</small></span></button>'+
      '</div>'+
      '<div id="workspaceMediaEntryStatus" role="status" aria-live="polite" data-state="idle" hidden><span id="workspaceMediaEntryStatusText"></span><button type="button" id="workspaceNativeVoiceFallback" hidden>Открыть диктофон</button></div>';
    if(head&&head.nextSibling)search.insertBefore(panel,head.nextSibling);else search.insertBefore(panel,search.firstChild);
  }

  function normalizeProfileCopy(){
    var label=d.querySelector('label[for="needs_person_name"]'),helper=label&&label.parentNode?label.parentNode.querySelector('.small'):null;
    setText(label,'Имя или ФИО (необязательно)');
    setText(helper,'Используется только в локальном отчёте; поле можно оставить пустым.');
  }

  function openSecondaryTools(){
    var details=byId('workspaceRationSecondary');
    if(details){details.open=true;d.documentElement.setAttribute('data-workspace-secondary-open','1');}
  }

  function revealAiSection(focusTarget){
    openSecondaryTools();
    var section=byId('geminiRationImportSection');
    if(section){
      try{section.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{section.scrollIntoView(true);}catch(__){}}
    }
    if(focusTarget){try{focusTarget.focus({preventScroll:true});}catch(_){try{focusTarget.focus();}catch(__){}}}
  }

  function handleEntryMethod(kind){
    if(kind==='search'){
      var input=byId('globalSearchInput');
      if(input){try{input.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){input.scrollIntoView(true);}try{input.focus({preventScroll:true});}catch(_){try{input.focus();}catch(__){}}}
      return;
    }
    openSecondaryTools();
    var target=kind==='photo'?byId('geminiRationChoosePhotos'):kind==='voice'?byId('geminiRationRecordAudio'):byId('geminiRationChooseAudio');
    revealAiSection(target);
    if(!target)return;
    toggle(target,'workspace-entry-target',true);
    setAttr(target,'data-entry-guided','true');
    w.setTimeout(function(){toggle(target,'workspace-entry-target',false);try{target.removeAttribute('data-entry-guided');}catch(_){}},1200);
    if(target.disabled)return;
    /* Keep media acquisition inside the trusted click while loading the full
       AI module only on demand. This preserves mobile permissions and fast startup. */
    try{
      var bridge=w.NutritionMediaEntryBridge;
      if(bridge){
        if(kind==='photo'&&typeof bridge.choosePhotos==='function')bridge.choosePhotos();
        else if(kind==='voice'&&typeof bridge.startVoice==='function')bridge.startVoice();
        else if(kind==='audio'&&typeof bridge.chooseAudio==='function')bridge.chooseAudio();
        else target.click();
      }else target.click();
    }catch(_){
      try{target.focus();}catch(__){}
    }
  }

  function goToProfile(){
    var api=shell();
    if(api&&typeof api.navigate==='function'){api.navigate('profile');return;}
    try{w.location.hash='#profile';}catch(_){}
  }

  function preferredLayout(){
    var saved='';try{saved=w.localStorage.getItem(LAYOUT_KEY)||'';}catch(_){}
    if(saved!=='canvas'&&saved!=='sections')saved=(d.documentElement.getAttribute('data-theme')==='ivory-brass'&&w.innerWidth>=1080)?'canvas':'sections';
    return saved;
  }

  function effectiveLayout(value){
    value=value==='canvas'?'canvas':'sections';
    return w.innerWidth<900?'sections':value;
  }

  function setMode(mode,options){
    options=options||{};var requested=mode==='canvas'?'canvas':'sections',actual=effectiveLayout(requested),api=shell(),previous=d.documentElement.getAttribute('data-workspace-layout')||'sections';
    if(options.persist!==false){try{w.localStorage.setItem(LAYOUT_KEY,requested);}catch(_){} }
    d.documentElement.setAttribute('data-workspace-layout',actual);
    d.documentElement.setAttribute('data-workspace-layout-preference',requested);
    if(api&&typeof api.setMode==='function'&&(!api.getState||api.getState().mode!=='workspace'))api.setMode('workspace');
    if(previous!==actual||options.force){try{w.dispatchEvent(new CustomEvent('workspace-layout:changed',{detail:{version:VERSION,layout:actual,preference:requested,previous:previous,forcedByViewport:actual!==requested}}));}catch(_){} }
    scheduleSync();return actual;
  }

  function sync(){
    normalizeProfileCopy();
    var state=shellState(),route=state&&state.route?state.route:(d.documentElement.getAttribute('data-navigation-route')||''),layout=d.documentElement.getAttribute('data-workspace-layout')||effectiveLayout(preferredLayout());
    var buttons=d.querySelectorAll('[data-workspace-view-mode]'),i,value,active,canvasUnavailable=w.innerWidth<900;
    for(i=0;i<buttons.length;i++){
      value=buttons[i].getAttribute('data-workspace-view-mode');active=value===layout;
      setAttr(buttons[i],'aria-pressed',active?'true':'false');toggle(buttons[i],'is-active',active);
      if(value==='canvas'){setAttr(buttons[i],'aria-disabled',canvasUnavailable?'true':'false');buttons[i].disabled=canvasUnavailable;buttons[i].title=canvasUnavailable?'На телефоне используется последовательный режим разделов':'Показать пространственное рабочее полотно';}
    }
    var back=byId('workspaceProfileBackAction');
    if(back)back.hidden=route==='profile';
  }

  function scheduleSync(){w.clearTimeout(syncTimer);syncTimer=w.setTimeout(sync,20);}

  function bind(){
    d.addEventListener('click',function(e){
      var mode=e.target&&e.target.closest?e.target.closest('[data-workspace-view-mode]'):null;
      if(mode){e.preventDefault();if(mode.getAttribute('aria-disabled')!=='true')setMode(mode.getAttribute('data-workspace-view-mode'));return;}
      var back=e.target&&e.target.closest?e.target.closest('[data-workspace-profile-back],#workspacePersonEdit'):null;
      if(back){e.preventDefault();goToProfile();return;}
      var nativeVoice=e.target&&e.target.closest?e.target.closest('#workspaceNativeVoiceFallback'):null;
      if(nativeVoice){e.preventDefault();var mediaBridge=w.NutritionMediaEntryBridge;if(mediaBridge&&typeof mediaBridge.openNativeRecorder==='function')mediaBridge.openNativeRecorder();return;}
      var entry=e.target&&e.target.closest?e.target.closest('[data-ration-entry-method]'):null;
      if(entry){e.preventDefault();handleEntryMethod(entry.getAttribute('data-ration-entry-method'));return;}
    },false);
    ['navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','workspace-profile:ready','workspace-slice:ready','app:ready','nutrition:themechange'].forEach(function(name){w.addEventListener(name,scheduleSync,false);});
    d.addEventListener('input',function(e){if(e.target&&e.target.id==='needs_person_name')scheduleSync();},true);
    w.addEventListener('resize',function(){setMode(preferredLayout(),{persist:false});},false);
  }

  function init(){
    if(initialized)return;initialized=true;
    ensureMediaEntryStyles();createModeSwitcher();createProfileBackAction();createRationEntryMethods();normalizeProfileCopy();bind();setMode(preferredLayout(),{persist:false,force:true});sync();
    w.NutritionWorkspaceEntryUXHF28={version:VERSION,refresh:sync,goToProfile:goToProfile,setMode:setMode,setLayout:setMode,getLayout:function(){return d.documentElement.getAttribute('data-workspace-layout')||'sections';},revealAiSection:revealAiSection};
    try{w.dispatchEvent(new CustomEvent('workspace-entry-ux:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
/* END assets/legacy/js/89-workspace-entry-ux-v6.0.0-alpha1.js */
