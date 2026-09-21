/* Ivory & Brass v6 compact search results.
 * Limits the first scan without changing matching, ranking or product data.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta3-search-compact-coherence';
  var PAGE=8,shown=PAGE,lastQuery='',timer=0,observer=null;
  function byId(id){return d.getElementById(id);}
  function active(){return d.documentElement.getAttribute('data-theme')==='ivory-brass';}
  function cards(){return Array.prototype.slice.call(d.querySelectorAll('#globalResults .search-result-card'));}
  function control(){
    var c=byId('ivorySearchMore');if(c)return c;
    var results=byId('globalResults');if(!results||!results.parentElement)return null;
    c=d.createElement('div');c.id='ivorySearchMore';c.className='ivory-search-more';c.hidden=true;
    c.innerHTML='<button type="button" aria-controls="globalResults"><span>Показать ещё</span><small></small></button>';
    results.parentElement.insertBefore(c,results.nextSibling);
    c.querySelector('button').addEventListener('click',function(){shown+=PAGE;apply(false,true);});
    return c;
  }
  function restore(){cards().forEach(function(x){x.hidden=false;x.removeAttribute('data-ivory-search-hidden');});var c=control();if(c)c.hidden=true;}
  function render(reset){
    var input=byId('globalSearchInput'),query=String(input&&input.value||'').trim();if(reset||query!==lastQuery){shown=PAGE;lastQuery=query;}
    var all=cards(),c=control();if(!active()||!query){restore();return;}
    all.forEach(function(x,i){var hide=i>=shown;x.hidden=hide;if(hide)x.setAttribute('data-ivory-search-hidden','1');else x.removeAttribute('data-ivory-search-hidden');});
    if(!c)return;var remaining=Math.max(0,all.length-shown);c.hidden=remaining===0;
    if(!c.hidden){c.querySelector('span').textContent='Показать ещё';c.querySelector('small').textContent='ещё '+remaining+' '+(remaining===1?'результат':remaining<5?'результата':'результатов');}
    var host=byId('globalResults');if(host)host.setAttribute('aria-label','Результаты поиска продуктов. Показано '+Math.min(shown,all.length)+' из '+all.length+'.');
  }
  function apply(reset,immediate){
    w.clearTimeout(timer);if(immediate){render(reset);return;}timer=w.setTimeout(function(){render(reset);},35);
  }
  function observe(){
    var host=byId('globalResults');if(!host||observer)return false;
    observer=new MutationObserver(function(records){
      if(records.some(function(r){return r.type==='childList'&&r.target===host;}))apply(false,true);
    });
    observer.observe(host,{childList:true,subtree:false});return true;
  }
  function init(){
    var input=byId('globalSearchInput');if(input)input.addEventListener('input',function(){apply(true);});
    observe();control();apply(true);
    w.addEventListener('nutrition:themechange',function(e){observe();if(e&&e.detail&&e.detail.theme!=='ivory-brass')restore();else apply(false);},false);
    ['navigation-shell:ready','app:ready'].forEach(function(n){w.addEventListener(n,function(){observe();apply(false);},false);});
    try{new MutationObserver(function(records){if(records.some(function(r){return r.attributeName==='data-theme';})){if(active())apply(false);else restore();}}).observe(d.documentElement,{attributes:true,attributeFilter:['data-theme']});}catch(_){}
    w.IvoryBrassSearchCompact={version:VERSION,refresh:function(){if(active())apply(false);else restore();},reset:function(){shown=PAGE;apply(true);}};
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
