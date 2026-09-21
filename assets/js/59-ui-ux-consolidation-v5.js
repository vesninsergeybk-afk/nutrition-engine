// nutrition calculator v5.3.117 — UI/UX consolidation and regression hardening
(function(){
  'use strict';
  var VERSION='v5.3.117_ui_ux_consolidation';
  window.__UI_UX_CONSOLIDATION_V53117__={version:VERSION};
  function byId(id){return document.getElementById(id);}
  function ensureVersion(){
    var version=String(window.__APP_DEPLOY_VERSION__||'v5.3.178');
    var wantedTitle='Калькулятор нутриентов Сергея Веснина '+version;if(document.title!==wantedTitle)document.title=wantedTitle;
    var title=document.querySelector('header .title');
    if(!title)return;
    var candidates=Array.from(title.querySelectorAll('span:not(.app-subtitle)'));
    var badge=title.querySelector('.version-badge')||candidates.find(function(x){return /v?\d+\.\d+\.\d+/.test(x.textContent||'');});
    if(!badge){badge=document.createElement('span');var subtitle=title.querySelector('.app-subtitle');if(subtitle)title.insertBefore(badge,subtitle);else title.appendChild(badge);}
    badge.classList.add('version-badge');if(badge.textContent!==version)badge.textContent=version;
    candidates.forEach(function(x){if(x!==badge&&/v?\d+\.\d+\.\d+/.test(x.textContent||''))x.remove();});
    document.documentElement.dataset.uiVersion=version.replace(/^v/,'');
  }
  function syncRegion(){
    var seg=byId('regionSeg');if(!seg)return;
    var current=(window.State&&State.getRegion?State.getRegion():'us')||'us';
    seg.setAttribute('role','group');seg.setAttribute('aria-label','Региональные нормы микронутриентов');
    seg.querySelectorAll('button[data-region]').forEach(function(btn){var active=btn.getAttribute('data-region')===current;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
  }
  function createFold(id,summaryText,summaryHint,child,openDesktop){
    if(!child||byId(id))return byId(id);
    var fold=document.createElement('details');fold.id=id;fold.className='ui-analysis-fold';
    if(openDesktop&&matchMedia('(min-width:761px)').matches)fold.open=true;
    var summary=document.createElement('summary');summary.innerHTML='<span><b>'+summaryText+'</b>'+(summaryHint?'<small>'+summaryHint+'</small>':'')+'</span><strong aria-hidden="true">Подробнее</strong>';
    child.parentNode.insertBefore(fold,child);fold.appendChild(summary);fold.appendChild(child);return fold;
  }
  function ensureHeiFolds(){
    var panel=byId('heiPanel');if(!panel)return;
    var mobile=matchMedia('(max-width:760px)').matches;
    var before=[!!byId('heiSettingsFold'),!!byId('heiTableFold'),!!byId('heiFullRecsFold'),mobile].join('|');
    var settingsFold=byId('heiSettingsFold');
    if(mobile){
      var settings=settingsFold?settingsFold.querySelector(':scope > .row'):Array.prototype.find.call(panel.children,function(el){return el.classList&&el.classList.contains('row');});
      createFold('heiSettingsFold','Методика расчёта HEI','Автоматически по фактической энергии введённого рациона',settings,false);
    }else if(settingsFold){
      var settingsRow=settingsFold.querySelector(':scope > .row');
      if(settingsRow){settingsFold.parentNode.insertBefore(settingsRow,settingsFold);}
      settingsFold.remove();
    }
    var table=panel.querySelector(':scope > .table-wrap');
    createFold('heiTableFold','Таблица всех компонентов','Подробные значения, нормативы и баллы по 13 компонентам',table,false);
    var recs=byId('heiRecs');
    createFold('heiFullRecsFold','Полный разбор всех компонентов','Карточки с причинами, ориентирами и практическими шагами',recs,false);
    var after=[!!byId('heiSettingsFold'),!!byId('heiTableFold'),!!byId('heiFullRecsFold'),mobile].join('|');
    if(before!==after){try{window.dispatchEvent(new CustomEvent('ui:hei-folds-ready'));}catch(_){}}
  }
  function normalizeLabel(s){
    return String(s||'').toLowerCase().replace(/[ё]/g,'е').replace(/[^а-яa-z0-9]+/g,' ').trim()
      .replace(/ продукты$/,'').replace(/ и ягоды$/,'').replace(/^рыба морепродукты и /,'').replace(/^крупы хлеб и /,'');
  }
  function dedupeRationPills(){
    document.querySelectorAll('#rationBody .meta').forEach(function(meta){
      var pills=Array.from(meta.querySelectorAll('.pill')).filter(function(x){return !x.hidden;});
      var seen=[];
      pills.forEach(function(p,index){
        var key=normalizeLabel(p.textContent);var duplicate=seen.some(function(prev){return key===prev||key.indexOf(prev)>=0||prev.indexOf(key)>=0;});
        if(duplicate){p.hidden=true;p.setAttribute('aria-hidden','true');}else seen.push(key);
      });
      meta.classList.toggle('has-single-pill',meta.querySelectorAll('.pill:not([hidden])').length===1);
    });
  }
  function syncOrdinaryToggles(){
    document.querySelectorAll('#rationBody .ration-row:not(.composite-folder-row)').forEach(function(row){
      var btn=row.querySelector('.regular-nutrition-toggle');if(!btn)return;
      var details=row.nextElementSibling;var open=!!(details&&details.style.display!=='none');var expanded=String(open);if(btn.getAttribute('aria-expanded')!==expanded)btn.setAttribute('aria-expanded',expanded);
    });
  }
  function improveDetailsLabels(){
    document.querySelectorAll('.ui-analysis-fold').forEach(function(d){var action=d.querySelector(':scope>summary>strong');var text=d.open?'Свернуть':'Подробнее';if(action&&action.textContent!==text)action.textContent=text;});
  }
  var recommendationRepairBusy=false;
  function ensureRecommendationLayer(){
    var host=byId('heiLevers');
    var model=window.__lastHEIModel;
    if(recommendationRepairBusy||!host||!model||model.valid===false||host.querySelector('.hei-p1-start'))return;
    var pass1=window.HEIRecommendationPass1;
    if(!pass1||typeof pass1.refresh!=='function')return;
    recommendationRepairBusy=true;
    try{pass1.refresh();}catch(_){recommendationRepairBusy=false;return;}
    setTimeout(function(){
      try{if(window.HEIRecommendationPass2&&typeof window.HEIRecommendationPass2.refresh==='function')window.HEIRecommendationPass2.refresh();}catch(_){}
      try{if(window.HEIRecommendationLanguagePass3&&typeof window.HEIRecommendationLanguagePass3.polish==='function')window.HEIRecommendationLanguagePass3.polish();}catch(_){}
      recommendationRepairBusy=false;
    },40);
  }
  function sync(){ensureVersion();syncRegion();ensureHeiFolds();dedupeRationPills();syncOrdinaryToggles();improveDetailsLabels();ensureRecommendationLayer();}
  document.addEventListener('toggle',function(e){if(e.target&&e.target.classList&&e.target.classList.contains('ui-analysis-fold'))improveDetailsLabels();},true);
  var printOpenState=[];
  window.addEventListener('beforeprint',function(){
    printOpenState=Array.from(document.querySelectorAll('#heiPanel details')).map(function(d){return {node:d,open:d.open};});
    printOpenState.forEach(function(x){x.node.open=true;});
  });
  window.addEventListener('afterprint',function(){
    printOpenState.forEach(function(x){if(x.node&&x.node.isConnected)x.node.open=x.open;});
    printOpenState=[];improveDetailsLabels();
  });
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#regionSeg button[data-region]');if(b)setTimeout(syncRegion,30);});
  var queued=false;function schedule(){if(queued)return;queued=true;setTimeout(function(){queued=false;sync();},60);}
  ['app:ready','ration:changed','needs:computed','diet:profile-rendered','resize'].forEach(function(ev){window.addEventListener(ev,schedule);});
  window.addEventListener('hei:rendered',function(){ensureRecommendationLayer();schedule();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  try{new MutationObserver(function(records){for(var i=0;i<records.length;i++){if(records[i].addedNodes.length||records[i].removedNodes.length){schedule();break;}}}).observe(document.documentElement,{childList:true,subtree:true});}catch(_){}
})();
