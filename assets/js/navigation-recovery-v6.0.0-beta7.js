/* Nutrition Calculator v6.0.0 beta 7 — navigation and presentation recovery.
 * Restores an always reachable three-theme selector, a working Sections/Canvas
 * control and a permanent Needs route. Presentation only; calculations untouched.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta7-navigation-recovery';
  var VIEW_KEY='nutritionCalculator.primaryView.v2';
  var initialized=false,syncTimer=0;
  function byId(id){return d.getElementById(id);}
  function api(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function state(){var a=api();try{return a&&a.getState?a.getState():null;}catch(_){return null;}}
  function theme(){return d.documentElement.getAttribute('data-theme')||'modern';}
  function savedView(){var v='',legacy='';try{v=w.localStorage.getItem(VIEW_KEY)||'';legacy=w.localStorage.getItem('nutritionCalculator.workspaceLayout.v1')||'';}catch(_){}if(v==='canvas'||v==='sections')return v;return legacy==='canvas'?'canvas':'sections';}
  function storeView(v){try{w.localStorage.setItem(VIEW_KEY,v);}catch(_){} }
  function iconProfile(){return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 21c.7-4.4 3-6.5 7-6.5s6.3 2.1 7 6.5"></path></svg>';}

  function ensurePrimaryNeedsRoute(){
    var items=d.querySelector('#navigationShell .navigation-shell__items');
    if(!items||items.querySelector('[data-navshell-route="profile"]'))return;
    var link=d.createElement('a');
    link.href='#profile';link.setAttribute('data-navshell-route','profile');link.setAttribute('data-primary-needs-route','1');
    link.innerHTML=iconProfile()+'<span>Потребности</span>';
    items.insertBefore(link,items.firstChild);
  }

  function controlMarkup(){
    return '<div class="primary-display-controls__group primary-display-controls__themes" role="group" aria-label="Дизайн приложения">'+
      '<span>Дизайн</span><div class="primary-display-controls__buttons">'+
      '<button type="button" data-theme-value="modern" aria-pressed="false">Стандартный</button>'+
      '<button type="button" data-theme-value="retro-2bit" aria-pressed="false">2-bit</button>'+
      '<button type="button" data-theme-value="ivory-brass" aria-pressed="false">Ivory</button></div></div>'+
      '<div class="primary-display-controls__group primary-display-controls__views" role="group" aria-label="Режим отображения">'+
      '<span>Режим</span><div class="primary-display-controls__buttons">'+
      '<button type="button" data-primary-view-mode="sections" aria-pressed="false">Разделы</button>'+
      '<button type="button" data-primary-view-mode="canvas" aria-pressed="false">Полотно</button></div></div>'+
      '<span class="visually-hidden" id="primaryDisplayStatus" aria-live="polite"></span>';
  }

  function ensureControls(){
    var box=byId('primaryDisplayControls');
    if(!box){box=d.createElement('section');box.id='primaryDisplayControls';box.className='primary-display-controls';box.setAttribute('aria-label','Дизайн и режим отображения');box.innerHTML=controlMarkup();}
    placeControls(box);return box;
  }

  function placeControls(box){
    box=box||byId('primaryDisplayControls');if(!box)return;
    var st=state(),context=byId('navigationShellContext'),header=d.querySelector('#mainContent>header'),longControl=byId('navigationShellLongReturn');
    if(st&&st.mode==='long'){
      if(longControl&&box.parentNode!==longControl){var back=longControl.querySelector('[data-navshell-return-workspace]');if(back)longControl.insertBefore(box,back);else longControl.appendChild(box);}
      else if(!longControl&&header&&box.parentNode!==header){var title=header.querySelector('.title');if(title&&title.nextSibling)header.insertBefore(box,title.nextSibling);else header.appendChild(box);}
    }else if(context&&box.parentNode!==context){
      var copy=context.querySelector('.navigation-shell-context__copy');
      if(copy&&copy.nextSibling)context.insertBefore(box,copy.nextSibling);else context.appendChild(box);
    }else if(!context&&header&&box.parentNode!==header){header.appendChild(box);}
  }

  function setLayout(value){
    value=value==='canvas'?'canvas':'sections';
    d.documentElement.setAttribute('data-workspace-layout',value);
    d.documentElement.setAttribute('data-workspace-layout-preference',value);
    try{w.localStorage.setItem('nutritionCalculator.workspaceLayout.v1',value);}catch(_){}
  }

  function applyView(view,options){
    options=options||{};view=view==='canvas'?'canvas':'sections';if(options.persist!==false)storeView(view);
    var a=api(),st=state(),mobile=w.innerWidth<900,ivory=theme()==='ivory-brass';
    if(view==='sections'){
      setLayout('sections');
      if(a&&typeof a.setMode==='function'&&(!st||st.mode!=='workspace'))a.setMode('workspace');
    }else if(mobile||!ivory){
      setLayout('canvas');
      if(a&&typeof a.setMode==='function'&&(!st||st.mode!=='long'))a.setMode('long');
    }else{
      if(a&&typeof a.setMode==='function'&&(!st||st.mode!=='workspace'))a.setMode('workspace');
      setLayout('canvas');
    }
    d.documentElement.setAttribute('data-primary-view',view);
    scheduleSync();
    try{w.dispatchEvent(new CustomEvent('primary-display:view-changed',{detail:{version:VERSION,view:view,mobile:mobile,theme:theme()}}));}catch(_){}
    return view;
  }

  function currentView(){var st=state();if(st&&st.mode==='long')return 'canvas';return d.documentElement.getAttribute('data-primary-view')||d.documentElement.getAttribute('data-workspace-layout-preference')||savedView();}

  function sync(){
    ensurePrimaryNeedsRoute();var box=ensureControls();placeControls(box);
    var currentTheme=theme(),view=currentView(),buttons=d.querySelectorAll('#primaryDisplayControls [data-theme-value]'),i,v,on;
    for(i=0;i<buttons.length;i++){v=buttons[i].getAttribute('data-theme-value');on=v===currentTheme;buttons[i].setAttribute('aria-pressed',on?'true':'false');buttons[i].classList.toggle('is-active',on);}
    buttons=d.querySelectorAll('#primaryDisplayControls [data-primary-view-mode]');
    for(i=0;i<buttons.length;i++){v=buttons[i].getAttribute('data-primary-view-mode');on=v===view;buttons[i].disabled=false;buttons[i].removeAttribute('aria-disabled');buttons[i].setAttribute('aria-pressed',on?'true':'false');buttons[i].classList.toggle('is-active',on);buttons[i].title=v==='canvas'?(w.innerWidth<900?'Показать все разделы одной последовательной страницей':(currentTheme==='ivory-brass'?'Открыть пространственное рабочее полотно':'Показать все разделы одной страницей')):'Работать по отдельным разделам';}
    var status=byId('primaryDisplayStatus');if(status)status.textContent='Дизайн: '+(currentTheme==='modern'?'стандартный':currentTheme==='retro-2bit'?'2-bit':'Ivory & Brass')+'. Режим: '+(view==='canvas'?'полотно':'разделы')+'.';
    d.documentElement.setAttribute('data-primary-view',view);
    var old=byId('workspaceViewSwitcher');if(old)old.setAttribute('aria-hidden','true');
    var longControl=byId('navigationShellLongReturn');if(longControl){longControl.setAttribute('aria-label','Режим «Полотно»');var strong=longControl.querySelector('strong'),copy=longControl.querySelector('span'),back=longControl.querySelector('[data-navshell-return-workspace]');if(strong)strong.textContent='Режим «Полотно»';if(copy)copy.textContent='Все разделы доступны на одной последовательной странице.';if(back)back.textContent='Вернуться к разделам';}
  }
  function scheduleSync(){w.clearTimeout(syncTimer);syncTimer=w.setTimeout(sync,30);}

  function focusNeeds(){
    var a=api();if(a&&typeof a.navigate==='function')a.navigate('profile','needsCompact');
    w.setTimeout(function(){var el=byId('needs_sex')||byId('needsCompact');if(el){try{el.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){el.scrollIntoView(true);}try{el.focus({preventScroll:true});}catch(_){}}},100);
  }


  function reinforceNutrientGroup(group,attempt){
    group=String(group||'');attempt=Number(attempt||0);if(['basic','vitamins','minerals','limits'].indexOf(group)<0)return;
    w.setTimeout(function(){
      var st=state(),analysis=w.NutritionAnalysisWorkspaceHF7,filters=analysis&&analysis.getFilters?analysis.getFilters():null;
      if(st&&st.route==='analysis/nutrients'){
        var all=d.querySelector('[data-nutrient-filter="all"]'),button=d.querySelector('[data-nutrient-group="'+group+'"]');
        if(!filters||filters.nutrientFilter!=='all'){if(all)all.click();}
        if(!filters||filters.nutrientGroup!==group){if(button)button.click();}
        filters=analysis&&analysis.getFilters?analysis.getFilters():null;
        if((!filters||filters.nutrientFilter!=='all'||filters.nutrientGroup!==group)&&attempt<5)reinforceNutrientGroup(group,attempt+1);
      }else if(attempt<5)reinforceNutrientGroup(group,attempt+1);
    },attempt===0?220:180+attempt*100);
  }
  function bind(){
    d.addEventListener('click',function(e){
      var nutrientGroup=e.target&&e.target.closest?e.target.closest('[data-ivory-nutrient-group]'):null;if(nutrientGroup)reinforceNutrientGroup(nutrientGroup.getAttribute('data-ivory-nutrient-group'),0);
      var mode=e.target&&e.target.closest?e.target.closest('#primaryDisplayControls [data-primary-view-mode]'):null;
      if(mode){e.preventDefault();e.stopPropagation();applyView(mode.getAttribute('data-primary-view-mode'));return;}
      var needs=e.target&&e.target.closest?e.target.closest('[data-primary-needs-action]'):null;
      if(needs){e.preventDefault();focusNeeds();}
    },true);
    d.addEventListener('keydown',function(e){var group=e.target&&e.target.closest?e.target.closest('[data-ivory-nutrient-group]'):null;if(group&&(e.key==='Enter'||e.key===' '))reinforceNutrientGroup(group.getAttribute('data-ivory-nutrient-group'),0);},true);
    ['navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','nutrition:themechange','workspace-layout:changed','app:ready'].forEach(function(name){w.addEventListener(name,function(e){
      if(name==='nutrition:themechange'&&currentView()==='canvas')applyView('canvas',{persist:false});else scheduleSync();
    },false);});
    w.addEventListener('resize',function(){if(currentView()==='canvas')applyView('canvas',{persist:false});else scheduleSync();},false);
  }

  function init(){if(initialized)return;initialized=true;ensureControls();ensurePrimaryNeedsRoute();bind();
    var initial=savedView();
    /* Preserve an explicitly restored legacy/long state; otherwise use the stored primary view. */
    w.setTimeout(function(){var st=state();if(st&&st.mode==='long')d.documentElement.setAttribute('data-primary-view','canvas');else applyView(initial,{persist:false});sync();},80);
    w.NutritionNavigationRecoveryV1={version:VERSION,setView:applyView,getView:currentView,openNeeds:focusNeeds,refresh:sync};
    try{w.dispatchEvent(new CustomEvent('navigation-recovery:ready',{detail:{version:VERSION}}));}catch(_){}
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
