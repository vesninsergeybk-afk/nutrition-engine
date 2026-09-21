(function(){
  'use strict';
  var VERSION='v5.3.117-ui-ux-consolidation';
  function dedupePills(){
    document.querySelectorAll('.meta').forEach(function(meta){
      var seen=new Set();
      meta.querySelectorAll('.pill').forEach(function(p){
        var key=(p.textContent||'').trim().toLowerCase();
        if(!key)return;
        if(seen.has(key)){if(!p.hidden){p.hidden=true;p.setAttribute('aria-hidden','true');}}
        else{seen.add(key);}
      });
    });
  }
  function brand(){
    var deploy=String(window.__APP_DEPLOY_VERSION__||'v5.3.178');
    var wantedTitle='Калькулятор нутриентов Сергея Веснина '+deploy;if(document.title!==wantedTitle)document.title=wantedTitle;
    var title=document.querySelector('header .title');
    if(title&&!title.querySelector('.app-subtitle')){
      var sub=document.createElement('span');sub.className='app-subtitle';sub.textContent='Рацион · HEI · дневные нормы';title.appendChild(sub);
    }
    var badge=title&&title.querySelector('.version-badge, .badge, span:not(.app-subtitle)');
    if(badge&&/v?\d+\.\d+\.\d+/.test(badge.textContent||'')){if(badge.textContent!==deploy)badge.textContent=deploy;badge.classList.add('version-badge');}
  }
  function buttonHierarchy(){
    ['printNeedsBtn','exportNeedsPdfBtn','printHeiBtn','exportHeiPdfBtn','printTotalsBtn','exportTotalsPdfBtn','printRationBtn','exportRationPdfBtn'].forEach(function(id){
      var b=document.getElementById(id);if(b)b.classList.add('secondary');
    });
    document.querySelectorAll('.ration-row button[data-role="rm"]').forEach(function(b){var label='Удалить продукт из рациона';if(b.getAttribute('aria-label')!==label)b.setAttribute('aria-label',label);});
  }
  function sync(){brand();dedupePills();buttonHierarchy();document.documentElement.dataset.designVersion='5.3.117';}
  var queued=false;function schedule(){if(queued)return;queued=true;setTimeout(function(){queued=false;sync()},45)}
  ['app:ready','ration:changed','hei:rendered','diet:profile-rendered','needs:computed','resize'].forEach(function(n){window.addEventListener(n,schedule)});
  document.addEventListener('DOMContentLoaded',schedule);if(document.readyState!=='loading')schedule();
  new MutationObserver(function(records){for(var i=0;i<records.length;i++){if(records[i].addedNodes.length||records[i].removedNodes.length){schedule();break;}}}).observe(document.documentElement,{childList:true,subtree:true});
  window.__DESIGN_SYSTEM_AUDIT_V53111__={version:VERSION,sync:sync};
})();
