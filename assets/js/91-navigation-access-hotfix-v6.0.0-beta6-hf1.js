/* Nutrition Calculator — Release 1 navigation reversibility.
 * Extends the existing navigation-access layer without introducing another overlay:
 * - semantic route context in history/session storage;
 * - Back/Forward + reload restoration for analysis context;
 * - compact return-to-analysis action for the analysis -> ration/correction loop.
 * Presentation/navigation only. No nutrition values are copied or recalculated here.
 */
(function(w,d){
  'use strict';
  var VERSION='release1-navigation-reversibility-2026-09-26';
  var CONTEXT_KEY='nutritionCalculator.navigationContext.v1';
  var RETURN_KEY='nutritionCalculator.navigationReturn.v1';
  var timer=0,contextTimer=0,observer=null,shellPatched=false;
  var routeContexts={},targetByRoute={},returnContext=null,pendingHistorySemantic=null,pendingManualContext=null;

  function byId(id){return d.getElementById(id);}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function shellState(){var api=shell();try{return api&&api.getState?api.getState():null;}catch(_){return null;}}
  function shellMode(){var s=shellState();return s&&s.mode?s.mode:(d.documentElement.getAttribute('data-navigation-shell')||'workspace');}
  function route(){var s=shellState();return s&&s.route?s.route:(d.documentElement.getAttribute('data-navigation-route')||'');}
  function setAttr(node,name,value){if(node&&node.getAttribute(name)!==String(value))node.setAttribute(name,String(value));}
  function toggle(node,name,on){if(node&&node.classList.contains(name)!==!!on)node.classList.toggle(name,!!on);}
  function storage(){try{return w.sessionStorage||null;}catch(_){return null;}}
  function safeGet(key){var s=storage();try{return s&&s.getItem?s.getItem(key):null;}catch(_){return null;}}
  function safeSet(key,value){var s=storage();try{if(s&&s.setItem)s.setItem(key,value);}catch(_){}}
  function safeRemove(key){var s=storage();try{if(s&&s.removeItem)s.removeItem(key);}catch(_){}}
  function parse(raw,fallback){try{var x=JSON.parse(raw||'');return x&&typeof x==='object'?x:fallback;}catch(_){return fallback;}}
  function clone(x){try{return JSON.parse(JSON.stringify(x));}catch(_){return x||null;}}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o||{},k);}
  function workspaceFor(r){r=normalizeRoute(r);return r.indexOf('analysis/')===0?'analysis':r;}
  function normalizeRoute(raw){
    raw=String(raw||'').replace(/^#/,'').replace(/^workspace\//,'').replace(/^\/+|\/+$/g,'');
    if(raw==='profile'||raw==='needs'||raw==='person')return 'profile';
    if(raw==='analysis'||raw==='overview')return 'analysis/overview';
    if(raw==='nutrients'||raw==='norms')return 'analysis/nutrients';
    if(raw==='hei')return 'analysis/hei';
    if(raw==='improve'||raw==='correction')return 'correction';
    if(raw==='report')return 'report';
    if(raw==='ration')return 'ration';
    if(/^analysis\/(overview|nutrients|hei)$/.test(raw))return raw;
    return raw;
  }

  function analysisApi(){try{return w.NutritionAnalysisWorkspaceHF7||null;}catch(_){return null;}}
  function visibleOpenKeys(selector,attr){
    var out=[],nodes=d.querySelectorAll(selector),i,key;
    for(i=0;i<nodes.length;i++){if(nodes[i].open){key=nodes[i].getAttribute(attr);if(key)out.push(key);}}
    return out.slice(0,20);
  }
  function captureAnalysisContext(r){
    var api=analysisApi(),filters=null;
    try{filters=api&&api.getFilters?api.getFilters():null;}catch(_){filters=null;}
    return {
      route:r,
      targetId:targetByRoute[r]||'',
      filters:filters?{
        nutrientFilter:String(filters.nutrientFilter||'all'),
        nutrientGroup:String(filters.nutrientGroup||'all'),
        heiFilter:String(filters.heiFilter||'all'),
        heiGroup:String(filters.heiGroup||'all'),
        nutrientPage:Math.max(0,Number(filters.nutrientPage)||0),
        heiPage:Math.max(0,Number(filters.heiPage)||0)
      }:null,
      openNutrients:visibleOpenKeys('details[open][data-contributor-key]','data-contributor-key'),
      openHei:visibleOpenKeys('details[open][data-hei-contributor-key]','data-hei-contributor-key')
    };
  }
  function captureContext(r){
    r=normalizeRoute(r||route());
    if(!r)return null;
    var ctx={schema:1,route:r,targetId:targetByRoute[r]||''};
    if(workspaceFor(r)==='analysis')ctx.analysis=captureAnalysisContext(r);
    return ctx;
  }
  function loadStored(){
    routeContexts=parse(safeGet(CONTEXT_KEY),{})||{};
    returnContext=parse(safeGet(RETURN_KEY),null);
  }
  function saveStored(){
    safeSet(CONTEXT_KEY,JSON.stringify(routeContexts||{}));
    if(returnContext)safeSet(RETURN_KEY,JSON.stringify(returnContext));else safeRemove(RETURN_KEY);
  }
  function mergeState(base,semantic){
    var out={},k;
    if(base&&typeof base==='object')for(k in base)if(own(base,k))out[k]=base[k];
    out.navigationSemantic=semantic;
    return out;
  }
  function replaceHistorySemantic(ctx){
    if(!ctx)return;
    var semantic={schema:1,route:ctx.route,context:ctx,returnContext:returnContext?clone(returnContext):null};
    try{if(w.history&&w.history.replaceState)w.history.replaceState(mergeState(w.history.state,semantic),'',w.location.href);}catch(_){}
  }
  function persistCurrent(){
    var r=route(),ctx;
    if(!r||shellMode()!=='workspace')return null;
    ctx=captureContext(r);if(!ctx)return null;
    routeContexts[r]=ctx;saveStored();replaceHistorySemantic(ctx);return ctx;
  }
  function scheduleContextCapture(delay){
    w.clearTimeout(contextTimer);
    contextTimer=w.setTimeout(function(){persistCurrent();updateSemanticReturn();},delay==null?90:delay);
  }

  function contextTitle(ctx){
    var target=ctx&&ctx.targetId||'',node,title,key,vm,i,row;
    if(target){node=byId(target);if(node){title=node.querySelector('h4,strong');if(title&&String(title.textContent||'').trim())return String(title.textContent||'').trim();}}
    try{
      vm=analysisApi()&&analysisApi().getViewModel?analysisApi().getViewModel():null;
      if(target.indexOf('workspaceNutrientRow-')===0&&vm&&vm.nutrients){
        key=target.replace('workspaceNutrientRow-','');
        for(i=0;i<vm.nutrients.length;i++){row=vm.nutrients[i];if(row&&row.key===key)return row.title||key;}
      }
      if(target.indexOf('workspaceHeiRow-')===0&&vm&&vm.hei&&vm.hei.rows){
        key=target.replace('workspaceHeiRow-','');
        for(i=0;i<vm.hei.rows.length;i++){row=vm.hei.rows[i];if(row&&row.key===key)return row.title||key;}
      }
    }catch(_){}
    return '';
  }
  function prepareTransition(destination){
    var source=route(),dest=normalizeRoute(destination),sourceCtx;
    if(!source||!dest||source===dest)return;
    sourceCtx=persistCurrent();
    if(workspaceFor(source)==='analysis'&&(dest==='ration'||dest==='correction')){
      returnContext=sourceCtx||captureContext(source);
      if(returnContext)returnContext.label=contextTitle(returnContext);
    }else if(dest==='profile'||dest==='report'){
      returnContext=null;
    }
    saveStored();
  }

  function clickControl(selector,value,attr){
    var nodes=d.querySelectorAll(selector),i;
    for(i=0;i<nodes.length;i++){
      if(nodes[i].getAttribute(attr)===String(value)){
        try{nodes[i].click();return true;}catch(_){return false;}
      }
    }
    return false;
  }
  function restoreOpen(keys,selector,attr){
    var wanted={},nodes,i,key;
    keys=keys||[];for(i=0;i<keys.length;i++)wanted[keys[i]]=1;
    nodes=d.querySelectorAll(selector);
    for(i=0;i<nodes.length;i++){key=nodes[i].getAttribute(attr);if(wanted[key])nodes[i].open=true;}
  }
  function focusTarget(ctx){
    var id=ctx&&ctx.targetId||'',node=id&&byId(id);
    if(!node)return;
    try{node.scrollIntoView({block:'center'});}catch(_){try{node.scrollIntoView(true);}catch(__){}}
  }
  function restorePages(kind,target,done,attempt){
    var api=analysisApi(),f,current,selector;
    attempt=attempt||0;if(!api||!api.getFilters||attempt>30){done();return;}
    try{f=api.getFilters();}catch(_){done();return;}
    current=kind==='nutrient'?Number(f.nutrientPage||0):Number(f.heiPage||0);
    target=Math.max(0,Number(target)||0);
    if(current===target){done();return;}
    selector=kind==='nutrient'?'[data-nutrient-page="'+(current<target?'next':'prev')+'"]':'[data-hei-page="'+(current<target?'next':'prev')+'"]';
    var button=d.querySelector(selector);
    if(!button||button.disabled){done();return;}
    try{button.click();}catch(_){done();return;}
    w.setTimeout(function(){restorePages(kind,target,done,attempt+1);},25);
  }
  function restoreAnalysisContext(ctx,attempt){
    attempt=attempt||0;
    if(!ctx||workspaceFor(route())!=='analysis')return;
    var api=analysisApi(),a=ctx.analysis||ctx,filters=a.filters||null;
    if(!api||!api.getFilters){if(attempt<20)w.setTimeout(function(){restoreAnalysisContext(ctx,attempt+1);},80);return;}
    if(filters){
      var current;try{current=api.getFilters();}catch(_){current={};}
      if(route()==='analysis/nutrients'){
        if(filters.nutrientFilter&&current.nutrientFilter!==filters.nutrientFilter)clickControl('[data-nutrient-filter]',filters.nutrientFilter,'data-nutrient-filter');
        try{current=api.getFilters();}catch(_){}
        if(filters.nutrientGroup&&current.nutrientGroup!==filters.nutrientGroup)clickControl('[data-nutrient-group]',filters.nutrientGroup,'data-nutrient-group');
        restorePages('nutrient',filters.nutrientPage,function(){
          w.setTimeout(function(){restoreOpen(a.openNutrients,'details[data-contributor-key]','data-contributor-key');focusTarget(a);scheduleContextCapture(20);},80);
        });
        return;
      }
      if(route()==='analysis/hei'){
        if(filters.heiFilter&&current.heiFilter!==filters.heiFilter)clickControl('[data-hei-filter]',filters.heiFilter,'data-hei-filter');
        try{current=api.getFilters();}catch(_){}
        if(filters.heiGroup&&current.heiGroup!==filters.heiGroup)clickControl('[data-hei-group]',filters.heiGroup,'data-hei-group');
        restorePages('hei',filters.heiPage,function(){
          w.setTimeout(function(){restoreOpen(a.openHei,'details[data-hei-contributor-key]','data-hei-contributor-key');focusTarget(a);scheduleContextCapture(20);},80);
        });
        return;
      }
    }
    w.setTimeout(function(){focusTarget(a);scheduleContextCapture(20);},50);
  }
  function restoreContext(ctx){
    if(!ctx)return false;
    var r=normalizeRoute(ctx.route||'');
    if(!r)return false;
    if(route()!==r){pendingManualContext=ctx;var api=shell();if(api&&api.navigate)api.navigate(r,ctx.targetId||'');return true;}
    targetByRoute[r]=ctx.targetId||targetByRoute[r]||'';
    if(workspaceFor(r)==='analysis')restoreAnalysisContext(ctx,0);
    return true;
  }

  function ensureSemanticReturnControl(){
    var context=byId('navigationShellContext'),box=byId('navigationSemanticReturn'),button;
    if(!context)return null;
    if(!box){
      box=d.createElement('div');box.id='navigationSemanticReturn';box.className='navigation-shell-context__links';box.hidden=true;
      box.innerHTML='<button type="button" class="secondary" data-navigation-semantic-return>Вернуться к анализу</button>';
      context.appendChild(box);
    }
    button=box.querySelector('[data-navigation-semantic-return]');
    return {box:box,button:button};
  }
  function updateSemanticReturn(){
    var ui=ensureSemanticReturnControl(),r=route(),show=!!(returnContext&&(r==='ration'||r==='correction'));
    if(!ui)return;
    ui.box.hidden=!show;
    if(show){
      var label=returnContext.label||contextTitle(returnContext);
      ui.button.textContent=label?'Вернуться: '+label:'Вернуться к анализу';
      ui.button.setAttribute('aria-label',label?'Вернуться к анализу: '+label:'Вернуться к предыдущему месту в анализе');
    }
  }
  function useSemanticReturn(e){
    var button=e.target&&e.target.closest?e.target.closest('[data-navigation-semantic-return]'):null,ctx,api;
    if(!button||!returnContext)return false;
    e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    ctx=clone(returnContext);returnContext=null;saveStored();pendingManualContext=ctx;
    api=shell();if(api&&api.navigate)api.navigate(ctx.route,ctx.targetId||'');else restoreContext(ctx);
    updateSemanticReturn();return true;
  }

  function exposeThemeSwitcher(){
    var header=d.querySelector('#mainContent>header'),theme=byId('themeSwitcher'),toolbar=header&&header.querySelector('.toolbar');
    if(!header||!theme)return;
    theme.classList.add('theme-switcher--top');
    if(theme.parentNode!==header){try{header.insertBefore(theme,toolbar||null);}catch(_){header.appendChild(theme);}}
    theme.removeAttribute('hidden');setAttr(theme,'aria-label','Выбор дизайна калькулятора');
    var label=theme.querySelector('.theme-switcher__label');if(label)label.textContent='Дизайн';
  }
  function profileIcon(){return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.2"></circle><path d="M5.5 20c.6-4.1 3-6.2 6.5-6.2s5.9 2.1 6.5 6.2"></path><path d="M4 4v5M1.5 6.5h5"></path></svg>';}
  function ensureNeedsNavigation(){
    var nav=byId('navigationShell'),items=nav&&nav.querySelector('.navigation-shell__items');if(!items)return;
    var link=items.querySelector('[data-navshell-primary-profile]');
    if(!link){
      link=d.createElement('a');link.href='#profile';link.setAttribute('data-navshell-route','profile');link.setAttribute('data-navshell-primary-profile','');link.setAttribute('aria-label','Расчёт потребностей');link.innerHTML=profileIcon()+'<span>Потребности</span>';items.insertBefore(link,items.firstChild);
    }
    var secondary=nav.querySelector('.navigation-shell__secondary [data-navshell-route="profile"]');if(secondary)secondary.setAttribute('aria-hidden','true');
    var s=shellState(),active=!!(s&&s.route==='profile');toggle(link,'is-active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
  function normalizeCanvasControl(){
    var box=byId('workspaceViewSwitcher');if(!box)return;
    box.setAttribute('aria-label','Способ просмотра калькулятора');
    var buttons=box.querySelectorAll('button'),sections=null,canvas=null,i,text;
    for(i=0;i<buttons.length;i++){text=(buttons[i].textContent||'').replace(/^\s+|\s+$/g,'');if(text==='Разделы'||buttons[i].getAttribute('data-workspace-view-mode')==='workspace'||buttons[i].getAttribute('data-workspace-view-mode')==='sections')sections=buttons[i];if(text==='Полотно'||buttons[i].getAttribute('data-workspace-view-mode')==='long'||buttons[i].getAttribute('data-workspace-view-mode')==='canvas')canvas=buttons[i];}
    if(sections){sections.setAttribute('data-workspace-view-mode','workspace');sections.disabled=false;sections.removeAttribute('disabled');sections.setAttribute('aria-disabled','false');sections.title='Показывать основные разделы по отдельности';}
    if(canvas){canvas.setAttribute('data-workspace-view-mode','long');canvas.disabled=false;canvas.removeAttribute('disabled');canvas.setAttribute('aria-disabled','false');canvas.title='Показать все разделы одной непрерывной страницей';}
    var mode=shellMode();if(sections){setAttr(sections,'aria-pressed',mode==='workspace'?'true':'false');toggle(sections,'is-active',mode==='workspace');}if(canvas){setAttr(canvas,'aria-pressed',mode==='long'?'true':'false');toggle(canvas,'is-active',mode==='long');}
  }
  function normalizeLongCanvasNotice(){
    var notice=byId('navigationShellLongReturn');if(!notice)return;
    notice.setAttribute('aria-label','Режим непрерывного полотна');
    var strong=notice.querySelector('strong'),span=notice.querySelector('span'),button=notice.querySelector('button');
    if(strong)strong.textContent='Полотно';if(span)span.textContent='Все разделы калькулятора показаны на одной непрерывной странице.';if(button)button.textContent='Вернуться к разделам';
  }

  function patchShell(){
    var api=shell(),originalNavigate,originalSetMode;
    if(!api||shellPatched||api.__release1SemanticPatched)return;
    originalNavigate=api.navigate;
    originalSetMode=api.setMode;
    if(typeof originalNavigate==='function'){
      api.navigate=function(destination,targetId){
        destination=normalizeRoute(destination);prepareTransition(destination);
        if(targetId)targetByRoute[destination]=String(targetId);
        return originalNavigate.call(api,destination,targetId);
      };
    }
    if(typeof originalSetMode==='function'){
      api.setMode=function(mode){persistCurrent();return originalSetMode.call(api,mode);};
    }
    api.__release1SemanticPatched=true;shellPatched=true;
  }

  function refresh(){
    exposeThemeSwitcher();ensureNeedsNavigation();normalizeCanvasControl();normalizeLongCanvasNotice();ensureSemanticReturnControl();patchShell();updateSemanticReturn();
    d.documentElement.setAttribute('data-navigation-access-hotfix','1');d.documentElement.setAttribute('data-navigation-release','1');
    if(observer&&byId('themeSwitcher')&&byId('navigationShell')&&byId('workspaceViewSwitcher')&&byId('navigationShellLongReturn')){try{observer.disconnect();}catch(_){}observer=null;}
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(refresh,55);}

  function handleViewClick(e){
    var button=e.target&&e.target.closest?e.target.closest('#workspaceViewSwitcher [data-workspace-view-mode]'):null;if(!button)return;
    var raw=button.getAttribute('data-workspace-view-mode'),target=(raw==='long'||raw==='canvas')?'long':'workspace',api=shell();
    persistCurrent();e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    if(api&&typeof api.setMode==='function')api.setMode(target);else d.documentElement.setAttribute('data-navigation-shell',target);
    w.setTimeout(refresh,20);
  }
  function navigationDestination(node){
    if(!node||!node.closest)return '';
    var el=node.closest('[data-navshell-route],[data-navshell-analysis-view],[data-workspace-route]');
    if(el)return normalizeRoute(el.getAttribute('data-navshell-route')||el.getAttribute('data-navshell-analysis-view')||el.getAttribute('data-workspace-route'));
    return '';
  }
  function captureBeforeNavigation(e){
    if(useSemanticReturn(e))return;
    var destination=navigationDestination(e.target);
    if(destination)prepareTransition(destination);
  }
  function contextMutation(e){
    var el=e.target;
    if(!el||!el.closest)return;
    if(el.closest('[data-nutrient-filter],[data-nutrient-group],[data-nutrient-select-group],[data-nutrient-page],[data-hei-filter],[data-hei-group],[data-hei-page],[data-reset-nutrient-filters],[data-reset-hei-filters]'))scheduleContextCapture(120);
  }
  function detailToggle(e){
    var el=e.target;if(el&&el.tagName==='DETAILS'&&(el.hasAttribute('data-contributor-key')||el.hasAttribute('data-hei-contributor-key')))scheduleContextCapture(60);
  }
  function routeChanged(e){
    var detail=e&&e.detail||{},r=normalizeRoute(detail.route||route()),ctx=null;
    if(detail.targetId)targetByRoute[r]=String(detail.targetId);
    if(pendingHistorySemantic&&normalizeRoute(pendingHistorySemantic.route)===r){ctx=pendingHistorySemantic.context||null;returnContext=pendingHistorySemantic.returnContext||null;pendingHistorySemantic=null;}
    else if(pendingManualContext&&normalizeRoute(pendingManualContext.route)===r){ctx=pendingManualContext;pendingManualContext=null;returnContext=null;}
    else if(routeContexts[r]&&workspaceFor(r)==='analysis'&&!detail.targetId){ctx=routeContexts[r];}
    if(workspaceFor(r)==='analysis')returnContext=null;
    else if(r!=='ration'&&r!=='correction')returnContext=null;
    if(ctx)w.setTimeout(function(){restoreContext(ctx);},60);
    scheduleContextCapture(140);updateSemanticReturn();
  }
  function onPopState(e){
    var semantic=e&&e.state&&e.state.navigationSemantic||null;
    pendingHistorySemantic=semantic&&semantic.schema===1?semantic:null;
    if(pendingHistorySemantic)returnContext=pendingHistorySemantic.returnContext||null;
    updateSemanticReturn();
    w.setTimeout(function(){if(pendingHistorySemantic&&normalizeRoute(pendingHistorySemantic.route)===route()){var x=pendingHistorySemantic.context;returnContext=pendingHistorySemantic.returnContext||null;pendingHistorySemantic=null;if(x)restoreContext(x);updateSemanticReturn();}},180);
  }

  function init(){
    loadStored();
    d.addEventListener('click',handleViewClick,true);
    d.addEventListener('click',captureBeforeNavigation,true);
    d.addEventListener('click',contextMutation,false);
    d.addEventListener('toggle',detailToggle,true);
    w.addEventListener('popstate',onPopState,false);
    w.addEventListener('pagehide',persistCurrent,false);
    w.addEventListener('navigation-shell:route-changed',routeChanged,false);
    ['navigation-shell:ready','navigation-shell:mode-changed','workspace-entry-ux:ready','nutrition:themechange','analysis-workspace:ready','app:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    w.addEventListener('resize',schedule,false);
    if(w.MutationObserver){try{observer=new MutationObserver(schedule);observer.observe(d.body||d.documentElement,{childList:true,subtree:true});}catch(_){}}
    refresh();
    var existing=w.history&&w.history.state&&w.history.state.navigationSemantic;
    if(existing&&existing.schema===1)pendingHistorySemantic=existing;
    w.NutritionNavigationAccessHotfix={
      version:VERSION,
      refresh:refresh,
      getSemanticContext:function(){return captureContext(route());},
      restoreSemanticContext:restoreContext,
      getReturnContext:function(){return clone(returnContext);},
      clearReturnContext:function(){returnContext=null;saveStored();updateSemanticReturn();}
    };
    w.setTimeout(function(){
      var r=route(),ctx=(pendingHistorySemantic&&pendingHistorySemantic.context)||routeContexts[r]||null;
      if(ctx&&workspaceFor(r)==='analysis')restoreContext(ctx);
      scheduleContextCapture(30);updateSemanticReturn();
    },220);
    try{w.dispatchEvent(new CustomEvent('navigation-access-hotfix:ready',{detail:{version:VERSION,release:1}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
