/* Entry-first UX pass: make the calculator self-explanatory on first open.
 * No calculation formulas are changed.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.1-entry-first-2026-10-06';
  var timer=0,observer=null,canvasRequested=false;

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
    var api=null,current='';
    try{api=w.NutritionNavigationRecoveryV1||null;current=api&&api.getView?api.getView():'';}catch(_){}
    if(api&&typeof api.setView==='function'&&current!=='canvas'&&!canvasRequested){
      canvasRequested=true;
      try{api.setView('canvas');}catch(_){}
      w.setTimeout(function(){canvasRequested=false;},250);
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

  function improvePrimaryAction(){
    var btn=byId('profileCalculateContinue');
    if(!btn)return;
    var count=byId('profileContinuityCount');
    var complete=count&&/^5\s*из\s*5/i.test(String(count.textContent||'').trim());
    if(complete&&!btn.disabled&&/заполн|рассч/i.test(String(btn.textContent||'')))setText(btn,'Рассчитать потребности');
  }

  function refresh(){
    mark();
    ensureHeader();
    ensureCanvas();
    forceNeedsOpen();
    moveNameToBasics();
    clarifyNeeds();
    cleanLegacyLanding();
    improvePrimaryAction();
  }

  function schedule(){
    w.clearTimeout(timer);
    timer=w.setTimeout(refresh,70);
  }

  function init(){
    mark();
    rememberCanvas();
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
