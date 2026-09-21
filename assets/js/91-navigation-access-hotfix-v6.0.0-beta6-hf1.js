/* Nutrition Calculator v6.0.0 beta 6 hotfix 1 — navigation and theme access recovery.
 * Restores the user-facing continuous canvas, keeps theme selection visible,
 * and promotes needs calculation to the permanent primary navigation.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta6-hotfix1-navigation-recovery';
  var timer=0,observer=null;

  function byId(id){return d.getElementById(id);}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function shellMode(){var api=shell();try{return api&&api.getState?api.getState().mode:(d.documentElement.getAttribute('data-navigation-shell')||'workspace');}catch(_){return d.documentElement.getAttribute('data-navigation-shell')||'workspace';}}
  function setAttr(node,name,value){if(node&&node.getAttribute(name)!==String(value))node.setAttribute(name,String(value));}
  function toggle(node,name,on){if(node&&node.classList.contains(name)!==!!on)node.classList.toggle(name,!!on);}

  function exposeThemeSwitcher(){
    var header=d.querySelector('#mainContent>header'),theme=byId('themeSwitcher'),toolbar=header&&header.querySelector('.toolbar');
    if(!header||!theme)return;
    theme.classList.add('theme-switcher--top');
    if(theme.parentNode!==header){
      try{header.insertBefore(theme,toolbar||null);}catch(_){header.appendChild(theme);}
    }
    theme.removeAttribute('hidden');
    setAttr(theme,'aria-label','Выбор дизайна калькулятора');
    var label=theme.querySelector('.theme-switcher__label');if(label)label.textContent='Дизайн';
  }

  function profileIcon(){
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.2"></circle><path d="M5.5 20c.6-4.1 3-6.2 6.5-6.2s5.9 2.1 6.5 6.2"></path><path d="M4 4v5M1.5 6.5h5"></path></svg>';
  }

  function ensureNeedsNavigation(){
    var nav=byId('navigationShell'),items=nav&&nav.querySelector('.navigation-shell__items');
    if(!items)return;
    var link=items.querySelector('[data-navshell-primary-profile]');
    if(!link){
      link=d.createElement('a');
      link.href='#profile';
      link.setAttribute('data-navshell-route','profile');
      link.setAttribute('data-navshell-primary-profile','');
      link.setAttribute('aria-label','Расчёт потребностей');
      link.innerHTML=profileIcon()+'<span>Потребности</span>';
      items.insertBefore(link,items.firstChild);
    }
    var secondary=nav.querySelector('.navigation-shell__secondary [data-navshell-route="profile"]');
    if(secondary)secondary.setAttribute('aria-hidden','true');
    var state=null;try{state=shell()&&shell().getState?shell().getState():null;}catch(_){}
    var active=!!(state&&state.route==='profile');
    toggle(link,'is-active',active);
    if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }

  function normalizeCanvasControl(){
    var box=byId('workspaceViewSwitcher');if(!box)return;
    box.setAttribute('aria-label','Способ просмотра калькулятора');
    var buttons=box.querySelectorAll('button'),sections=null,canvas=null,i,text;
    for(i=0;i<buttons.length;i++){
      text=(buttons[i].textContent||'').replace(/^\s+|\s+$/g,'');
      if(text==='Разделы'||buttons[i].getAttribute('data-workspace-view-mode')==='workspace'||buttons[i].getAttribute('data-workspace-view-mode')==='sections')sections=buttons[i];
      if(text==='Полотно'||buttons[i].getAttribute('data-workspace-view-mode')==='long'||buttons[i].getAttribute('data-workspace-view-mode')==='canvas')canvas=buttons[i];
    }
    if(sections){sections.setAttribute('data-workspace-view-mode','workspace');sections.disabled=false;sections.removeAttribute('disabled');sections.setAttribute('aria-disabled','false');sections.title='Показывать основные разделы по отдельности';}
    if(canvas){canvas.setAttribute('data-workspace-view-mode','long');canvas.disabled=false;canvas.removeAttribute('disabled');canvas.setAttribute('aria-disabled','false');canvas.title='Показать все разделы одной непрерывной страницей';}
    var mode=shellMode();
    if(sections){setAttr(sections,'aria-pressed',mode==='workspace'?'true':'false');toggle(sections,'is-active',mode==='workspace');}
    if(canvas){setAttr(canvas,'aria-pressed',mode==='long'?'true':'false');toggle(canvas,'is-active',mode==='long');}
  }

  function normalizeLongCanvasNotice(){
    var notice=byId('navigationShellLongReturn');if(!notice)return;
    notice.setAttribute('aria-label','Режим непрерывного полотна');
    var strong=notice.querySelector('strong'),span=notice.querySelector('span'),button=notice.querySelector('button');
    if(strong)strong.textContent='Полотно';
    if(span)span.textContent='Все разделы калькулятора показаны на одной непрерывной странице.';
    if(button)button.textContent='Вернуться к разделам';
  }

  function refresh(){
    exposeThemeSwitcher();
    ensureNeedsNavigation();
    normalizeCanvasControl();
    normalizeLongCanvasNotice();
    d.documentElement.setAttribute('data-navigation-access-hotfix','1');
    if(observer&&byId('themeSwitcher')&&byId('navigationShell')&&byId('workspaceViewSwitcher')&&byId('navigationShellLongReturn')){try{observer.disconnect();}catch(_){}observer=null;}
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(refresh,55);}

  function handleViewClick(e){
    var button=e.target&&e.target.closest?e.target.closest('#workspaceViewSwitcher [data-workspace-view-mode]'):null;
    if(!button)return;
    var raw=button.getAttribute('data-workspace-view-mode'),target=(raw==='long'||raw==='canvas')?'long':'workspace',api=shell();
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    if(api&&typeof api.setMode==='function')api.setMode(target);
    else d.documentElement.setAttribute('data-navigation-shell',target);
    w.setTimeout(refresh,20);
  }

  function init(){
    d.addEventListener('click',handleViewClick,true);
    ['navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','workspace-entry-ux:ready','nutrition:themechange','app:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    w.addEventListener('resize',schedule,false);
    if(w.MutationObserver){
      try{observer=new MutationObserver(schedule);observer.observe(d.body||d.documentElement,{childList:true,subtree:true});}catch(_){}
    }
    refresh();
    w.NutritionNavigationAccessHotfix={version:VERSION,refresh:refresh};
    try{w.dispatchEvent(new CustomEvent('navigation-access-hotfix:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
