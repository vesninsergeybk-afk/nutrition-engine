/* Nutrition Calculator v6.0.0 alpha 1 — three-theme controller.
 * Owns only html[data-theme], persistence and accessible theme controls.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-alpha1-theme-system-v2';
  var STORAGE_KEY='nutritionCalculator.uiTheme.v1';
  var THEMES=['modern','retro-2bit','ivory-brass'];
  var LABELS={modern:'Современная','retro-2bit':'2-bit','ivory-brass':'Ivory & Brass'};
  var STATUS={modern:'Современное оформление включено', 'retro-2bit':'Двухбитное оформление включено','ivory-brass':'Премиальное оформление Ivory & Brass включено'};
  var COLORS={modern:'#f7fbff','retro-2bit':'#111111','ivory-brass':'#f4efe5'};

  function valid(value){return THEMES.indexOf(String(value||''))!==-1;}
  function current(){var value=d.documentElement.getAttribute('data-theme');return valid(value)?value:'modern';}
  function queryTheme(){
    try{var value=new URL(w.location.href).searchParams.get('theme')||'';return valid(value)?value:'';}catch(_){return '';}
  }
  function syncControls(theme){
    var controls=d.querySelectorAll('[data-theme-value]'),i,selected;
    for(i=0;i<controls.length;i++){
      selected=controls[i].getAttribute('data-theme-value')===theme;
      controls[i].setAttribute('aria-pressed',selected?'true':'false');
      controls[i].classList.toggle('active',selected);
      controls[i].classList.toggle('is-active',selected);
    }
    var toggle=d.querySelector('[data-theme-toggle]');
    if(toggle){
      var next=theme==='modern'?'retro-2bit':theme==='retro-2bit'?'ivory-brass':'modern';
      toggle.setAttribute('aria-checked',theme==='retro-2bit'?'true':'false');
      toggle.setAttribute('data-theme-current',theme);
      toggle.setAttribute('aria-label','Текущая тема: '+LABELS[theme]+'. Переключить на '+LABELS[next]);
      toggle.setAttribute('title','Текущая тема: '+LABELS[theme]);
    }
    var text=d.getElementById('themeToggleText');if(text)text.textContent=LABELS[theme];
    var status=d.getElementById('themeStatus');if(status)status.textContent=STATUS[theme];
    var meta=d.querySelector('meta[name="theme-color"]');
    if(!meta){meta=d.createElement('meta');meta.setAttribute('name','theme-color');d.head.appendChild(meta);}
    meta.setAttribute('content',COLORS[theme]);
    d.documentElement.setAttribute('data-theme-ready','1');
  }
  function setTheme(theme,options){
    options=options||{};if(!valid(theme))theme='modern';
    if(w.__LEGACY_COMPAT_MODE__&&theme!=='modern')theme='modern';
    var previous=current();
    d.documentElement.setAttribute('data-theme',theme);
    if(options.persist!==false){try{w.localStorage.setItem(STORAGE_KEY,theme);}catch(_){}}
    syncControls(theme);
    if(previous!==theme&&options.silent!==true){
      try{w.dispatchEvent(new CustomEvent('nutrition:themechange',{detail:{theme:theme,previous:previous,version:VERSION}}));}catch(_){}
    }
    return theme;
  }
  function cycle(){var now=current(),idx=THEMES.indexOf(now);return setTheme(THEMES[(idx+1)%THEMES.length]);}
  function reset(){try{w.localStorage.removeItem(STORAGE_KEY);}catch(_){}return setTheme('modern',{persist:false});}
  function bind(){
    var requested=queryTheme();if(requested&&requested!==current())setTheme(requested,{persist:true,silent:true});else syncControls(current());
    d.addEventListener('click',function(event){
      var button=event.target&&event.target.closest?event.target.closest('[data-theme-value]'):null;
      if(button){var next=button.getAttribute('data-theme-value');if(valid(next)){event.preventDefault();setTheme(next);}return;}
      var toggle=event.target&&event.target.closest?event.target.closest('[data-theme-toggle]'):null;
      if(toggle){event.preventDefault();cycle();}
    },false);
    w.addEventListener('storage',function(event){if(event&&event.key===STORAGE_KEY&&valid(event.newValue)&&event.newValue!==current())setTheme(event.newValue,{persist:false});},false);
  }
  w.NutritionTheme={version:VERSION,storageKey:STORAGE_KEY,themes:THEMES.slice(),labels:LABELS,get:current,set:setTheme,cycle:cycle,reset:reset};
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})(window,document);
