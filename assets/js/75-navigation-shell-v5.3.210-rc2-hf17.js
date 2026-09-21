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
