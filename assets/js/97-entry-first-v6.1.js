/* Entry-first UX pass: make the calculator self-explanatory on first open.
 * No calculation formulas are changed.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.1-entry-first-2026-10-06';
  var timer=0,observer=null,canvasRequested=false,continueAfterCalculation=false;

  function byId(id){return d.getElementById(id);}
  function setText(node,text){if(node&&node.textContent!==text)node.textContent=text;}

  function mark(){
    d.documentElement.setAttribute('data-entry-first-ui','1');
  }

  function rememberCanvas(){
    try{w.localStorage.setItem('nutritionCalculator.primaryView.v2','canvas');}catch(_){}
    try{w.localStorage.setItem('nutritionCalculator.workspaceLayout.v1','canvas');}catch(_){}
  }

  function ensureCanvas(){
    rememberCanvas();
    var shell=null,state=null,recovery=null,current='';
    try{shell=w.NavigationShellV1||null;state=shell&&shell.getState?shell.getState():null;}catch(_){}
    /* The shipping mobile runtime treats "canvas" only as a layout preference and
       forces the sectioned workspace below 900px. For this entry-first product the
       requested behaviour is the real continuous page, which is NavigationShell's
       long mode. Keep the technical banner hidden in CSS and use the long DOM itself. */
    if(shell&&typeof shell.setMode==='function'&&(!state||state.mode!=='long')&&!canvasRequested){
      canvasRequested=true;
      try{shell.setMode('long');}catch(_){}
      w.setTimeout(function(){canvasRequested=false;},260);
      return;
    }
    /* Compatibility with newer navigation-recovery builds if they are present. */
    try{recovery=w.NutritionNavigationRecoveryV1||null;current=recovery&&recovery.getView?recovery.getView():'';}catch(_){}
    if(!shell&&recovery&&typeof recovery.setView==='function'&&current!=='canvas'&&!canvasRequested){
      canvasRequested=true;
      try{recovery.setView('canvas');}catch(_){}
      w.setTimeout(function(){canvasRequested=false;},260);
    }
  }

  function ensureHeader(){
    var header=d.querySelector('#mainContent>header'),title=header&&header.querySelector('.title');
    if(!header||!title)return;
    var subtitle=byId('entryFirstSubtitle');
    if(!subtitle){
      subtitle=d.createElement('p');
      subtitle.id='entryFirstSubtitle';
      subtitle.className='entry-first-subtitle';
      subtitle.textContent='Сначала заполните данные человека, затем добавьте рацион — вручную, по фото или голосом. Анализ и отчёт появятся ниже на этой же странице.';
      if(title.nextSibling)header.insertBefore(subtitle,title.nextSibling);else header.appendChild(subtitle);
    }
  }

  function forceNeedsOpen(){
    var section=byId('needsCompact'),needs=byId('needs'),toggle=byId('v40NeedsToggle'),summary=byId('v40NeedsSummary');
    if(section)section.classList.remove('v40-needs-collapsed');
    if(needs){
      needs.hidden=false;
      needs.removeAttribute('aria-hidden');
      try{needs.style.removeProperty('display');needs.style.removeProperty('visibility');}catch(_){}
    }
    if(toggle){
      toggle.setAttribute('aria-expanded','true');
      toggle.hidden=true;
      toggle.setAttribute('aria-hidden','true');
      toggle.tabIndex=-1;
    }
    if(summary){
      summary.hidden=true;
      summary.setAttribute('aria-hidden','true');
    }
  }

  function moveNameToBasics(){
    var input=byId('needs_person_name'),basic=byId('profileBasicSection');
    var grid=basic&&basic.querySelector('.profile-hierarchy__fields');
    if(!input||!grid)return;
    var wrap=input.parentElement;
    if(!wrap)return;
    wrap.classList.add('entry-first-name-field');
    wrap.setAttribute('data-profile-tier','basic');
    if(wrap.parentNode!==grid)grid.insertBefore(wrap,grid.firstChild);
    var label=d.querySelector('label[for="needs_person_name"]');
    setText(label,'Имя или ФИО — необязательно');
    input.setAttribute('placeholder','Как вас называть в отчёте');
    var header=basic.querySelector('.profile-hierarchy__header p');
    setText(header,'Введите имя при желании, затем пол, возраст, рост, массу и обычный уровень активности.');
  }

  function clarifyNeeds(){
    var heading=d.querySelector('#needs .section-title-row h1');
    setText(heading,'Ваши данные и потребности');
    var badge=d.querySelector('#needs .section-title-row .step-badge');
    setText(badge,'1 · Потребности');
    var row=d.querySelector('#needs>.row:first-child');
    if(row&&!row.querySelector('.entry-first-needs-lead')){
      var lead=d.createElement('p');
      lead.className='entry-first-needs-lead';
      lead.textContent='Пять основных полей нужны для расчёта. Имя можно оставить пустым. После расчёта сразу переходите ниже к продуктам, фото или голосовому вводу.';
      row.appendChild(lead);
    }
    var canonical=byId('needs_calc_btn');
    if(canonical)setText(canonical,'Рассчитать потребности');
  }

  function cleanLegacyLanding(){
    var summary=byId('v40NeedsSummary'),toggle=byId('v40NeedsToggle');
    if(summary)summary.hidden=true;
    if(toggle)toggle.hidden=true;
    var longReturn=byId('navigationShellLongReturn');
    if(longReturn)longReturn.hidden=true;
  }

  function putAfter(node,reference){
    if(!node||!reference||node===reference||reference.nextSibling===node)return;
    try{reference.parentNode.insertBefore(node,reference.nextSibling);}catch(_){}
  }

  function reorderRationFlow(){
    var needs=byId('needsCompact'),summary=byId('consultationNeedsSummary');
    var search=byId('globalSearchSection'),ration=byId('rationSection'),media=byId('geminiRationImportSection');
    var anchor=summary&&summary.parentNode===needs.parentNode?summary:needs;
    if(anchor&&search)putAfter(search,anchor);
    if(search&&ration)putAfter(ration,search);
    if(ration&&media)putAfter(media,ration);
    if(search){
      var h=search.querySelector('.search-hero-head h2');
      setText(h,'Добавьте продукты в рацион');
      var lead=search.querySelector('.search-lead');
      setText(lead,'Начните вводить название продукта или выберите фото/голос выше. После добавления позиции сразу появятся в рационе и в расчётах ниже.');
      var badge=search.querySelector('.step-badge');
      setText(badge,'2 · Рацион');
    }
  }

  function improvePrimaryAction(){
    var btn=byId('profileCalculateContinue');
    if(!btn)return;
    var state=d.documentElement.getAttribute('data-profile-calculation-state')||'';
    if(!btn.disabled&&state==='current')setText(btn,'Перейти к рациону');
    else if(!btn.disabled)setText(btn,'Рассчитать и перейти к рациону');
  }

  function scrollToRation(){
    var target=byId('globalSearchSection')||byId('geminiRationImportSection')||byId('rationSection');
    if(!target)return;
    try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{target.scrollIntoView(true);}catch(__){}}
    w.setTimeout(function(){
      var input=byId('globalSearchInput');
      if(input){try{input.focus({preventScroll:true});}catch(_){}}
    },420);
  }

  function handlePrimaryContinue(e){
    var btn=e.target&&e.target.closest?e.target.closest('#profileCalculateContinue'):null;
    if(!btn||btn.disabled)return;
    /* In the old sectioned shell this button navigates into a workspace route.
       In the continuous product it must calculate in place, then scroll to the
       ration without changing the page mode. */
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    var state=d.documentElement.getAttribute('data-profile-calculation-state')||'';
    if(state==='current'){scrollToRation();return;}
    var canonical=byId('needs_calc_btn');
    if(!canonical||canonical.disabled)return;
    continueAfterCalculation=true;
    try{canonical.click();}catch(_){continueAfterCalculation=false;}
  }

  function refresh(){
    mark();
    ensureHeader();
    ensureCanvas();
    forceNeedsOpen();
    moveNameToBasics();
    clarifyNeeds();
    cleanLegacyLanding();
    reorderRationFlow();
    improvePrimaryAction();
  }

  function schedule(){
    w.clearTimeout(timer);
    timer=w.setTimeout(refresh,70);
  }

  function init(){
    mark();
    rememberCanvas();
    d.addEventListener('click',handlePrimaryContinue,true);
    w.addEventListener('needs:computed',function(){
      if(!continueAfterCalculation)return;
      continueAfterCalculation=false;
      w.setTimeout(scrollToRation,120);
    },false);
    [
      'app:ready','navigation-recovery:ready','navigation-shell:ready','navigation-shell:mode-changed',
      'profile:hierarchy-ready','needs:computed','needs:invalidated','interface-simplification:ready'
    ].forEach(function(name){w.addEventListener(name,schedule,false);});
    w.addEventListener('resize',schedule,false);
    if(w.MutationObserver){
      try{
        observer=new MutationObserver(schedule);
        observer.observe(d.body||d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-expanded']});
      }catch(_){}
    }
    refresh();
    w.NutritionEntryFirstUX={version:VERSION,refresh:refresh};
    try{w.dispatchEvent(new CustomEvent('entry-first-ui:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
