/* Nutrition Calculator v5.3.210 RC2 HF8
 * Profile-first workspace flow. The person's anthropometric profile and calculated
 * needs precede ration editing, while the four main work areas remain unchanged.
 * Reads the existing needs calculation state; does not duplicate formulas.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf8-profile-needs';
  var initialized=false;
  var refreshTimer=0;
  var observers=[];

  function byId(id){return d.getElementById(id);}
  function text(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim():'';}
  function value(id){var el=byId(id);return el?String(el.value||'').trim():'';}
  function number(id){var n=Number(value(id).replace(',','.'));return isFinite(n)?n:NaN;}
  function fmt(n,digits){n=Number(n);if(!isFinite(n))return '—';return n.toLocaleString('ru-RU',{maximumFractionDigits:digits==null?0:digits,minimumFractionDigits:0});}
  function route(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'';}catch(_){return '';}}
  function workspace(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().mode==='workspace':false;}catch(_){return false;}}
  function meta(){try{return w.__lastNeedsProfileApplied===true&&w.__lastNeedsMeta?w.__lastNeedsMeta:null;}catch(_){return null;}}
  function ready(){return !!meta();}
  function sexLabel(v){return v==='female'?'женщина':v==='male'?'мужчина':'пол не указан';}
  function personName(){return value('needs_person_name');}
  function profileLine(m){
    var parts=[];
    if(m&&m.sex)parts.push(sexLabel(m.sex));
    if(m&&isFinite(Number(m.age)))parts.push(fmt(m.age,0)+' лет');
    if(m&&isFinite(Number(m.h)))parts.push(fmt(m.h,0)+' см');
    if(m&&isFinite(Number(m.w)))parts.push(fmt(m.w,1)+' кг');
    return parts.join(' · ');
  }
  function targetsLine(m){
    if(!m)return 'Потребности ещё не рассчитаны';
    var parts=[];
    if(isFinite(Number(m.energyTarget)))parts.push(fmt(m.energyTarget,0)+' ккал');
    if(isFinite(Number(m.totalProtein)))parts.push('Б '+fmt(m.totalProtein,1)+' г');
    if(isFinite(Number(m.fatGrams)))parts.push('Ж '+fmt(m.fatGrams,1)+' г');
    if(isFinite(Number(m.carbGrams)))parts.push('У '+fmt(m.carbGrams,1)+' г');
    if(isFinite(Number(m.fluidMl)))parts.push('вода '+fmt(m.fluidMl/1000,1)+' л');
    return parts.length?parts.join(' · '):'Расчёт выполнен с ограничениями выбранного профиля';
  }

  function createProfilePanel(){
    var main=byId('mainContent'),needs=byId('needsCompact');
    if(!main||!needs||byId('workspaceProfilePanel'))return;
    var panel=d.createElement('section');
    panel.id='workspaceProfilePanel';panel.className='card workspace-profile-panel';panel.hidden=true;panel.setAttribute('data-navshell-original-hidden','1');panel.setAttribute('aria-labelledby','workspaceProfileTitle');
    panel.innerHTML=''+
      '<div class="workspace-profile-panel__tools"><span id="workspaceProfileTitle">Этапы работы</span><button type="button" class="secondary" data-navshell-settings-toggle aria-expanded="false">Настройки</button></div>'+
      '<ol class="workspace-profile-steps" aria-label="Этапы работы"><li data-profile-step="profile" class="is-current" aria-current="step"><b>1</b><span><strong>Профиль</strong><small>исходные данные</small></span></li><li data-profile-step="needs"><b>2</b><span><strong>Потребности</strong><small>калории, БЖУ и вода</small></span></li><li data-profile-step="ration"><b>3</b><span><strong>Рацион</strong><small>продукты и анализ</small></span></li></ol>'+
      '<div class="workspace-profile-status" id="workspaceProfileStatus" role="status" aria-live="polite"><div><span>Статус</span><strong id="workspaceProfileStatusTitle">Профиль не заполнен</strong><small id="workspaceProfileStatusText">Заполните основные поля и нажмите «Рассчитать».</small></div><button type="button" id="workspaceProfilePrimaryAction" data-profile-action="focus">Перейти к данным</button></div>';
    main.insertBefore(panel,needs);
  }

  function createPersonContext(){
    var context=byId('navigationShellContext');
    if(!context||byId('workspacePersonContext'))return;
    var panel=d.createElement('section');panel.id='workspacePersonContext';panel.className='workspace-person-context';panel.setAttribute('aria-label','Профиль человека и рассчитанные потребности');
    panel.innerHTML='<div class="workspace-person-context__copy"><span>Текущий профиль</span><strong id="workspacePersonName">Профиль не заполнен</strong><small id="workspacePersonDetails">Сначала рассчитайте потребности</small></div><div class="workspace-person-context__targets" id="workspacePersonTargets">Потребности не рассчитаны</div><button type="button" data-workspace-route="profile" id="workspacePersonEdit">Рассчитать</button>';
    var summary=byId('workspaceRationInlineSummary');
    if(summary&&summary.parentNode===context)context.insertBefore(panel,summary);else context.appendChild(panel);
  }

  function createNextAction(){
    var out=byId('needs_out'),needs=byId('needs');
    if(!out||!needs||byId('workspaceProfileNext'))return;
    var box=d.createElement('div');box.id='workspaceProfileNext';box.className='workspace-profile-next';box.hidden=true;
    box.innerHTML='<div><span>Следующий шаг</span><strong id="workspaceProfileNextTitle">Потребности рассчитаны</strong><small id="workspaceProfileNextText">Теперь можно составлять рацион этого человека.</small></div><button type="button" data-workspace-route="ration">Перейти к рациону</button>';
    if(out.nextSibling)out.parentNode.insertBefore(box,out.nextSibling);else out.parentNode.appendChild(box);
  }

  function normalizeCopy(){
    var label=d.querySelector('label[for="needs_person_name"]'),input=byId('needs_person_name'),heading=d.querySelector('#needs .section-title-row h1'),status=byId('v40NeedsStatus');
    if(label)label.textContent='Имя человека (необязательно)';
    if(input)input.placeholder='Иван Иванов';
    if(heading)heading.textContent='Профиль и расчёт потребностей';
    if(status)status.textContent=ready()?'Потребности рассчитаны. При изменении исходных данных выполните расчёт повторно.':'Сначала заполните данные человека и рассчитайте потребности. Затем переходите к его рациону.';
  }

  function ensureNeedsOpen(){
    if(!workspace()||route()!=='profile')return;
    var section=byId('needsCompact'),toggle=byId('v40NeedsToggle');
    if(section&&section.classList.contains('v40-needs-collapsed')&&toggle){try{toggle.click();}catch(_){section.classList.remove('v40-needs-collapsed');}}
  }

  function focusForm(){
    ensureNeedsOpen();
    var input=byId('needs_person_name')||byId('needs_h')||byId('needs');
    if(!input)return;
    try{input.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){input.scrollIntoView(true);}
    w.setTimeout(function(){try{input.focus({preventScroll:true});}catch(_){try{input.focus();}catch(__){}}},180);
  }

  function refreshProfilePanel(){
    var m=meta(),name=personName(),statusTitle=byId('workspaceProfileStatusTitle'),statusText=byId('workspaceProfileStatusText'),action=byId('workspaceProfilePrimaryAction'),panel=byId('workspaceProfilePanel');
    if(panel)panel.classList.toggle('is-ready',!!m);
    var steps=d.querySelectorAll('[data-profile-step]'),i,step;
    for(i=0;i<steps.length;i++){step=steps[i];step.classList.remove('is-current','is-complete');step.removeAttribute('aria-current');if(m){if(step.getAttribute('data-profile-step')==='ration'){step.classList.add('is-current');step.setAttribute('aria-current','step');}else step.classList.add('is-complete');}else if(step.getAttribute('data-profile-step')==='profile'){step.classList.add('is-current');step.setAttribute('aria-current','step');}}
    if(statusTitle)statusTitle.textContent=m?(name||'Профиль без имени'):'Профиль не заполнен';
    if(statusText)statusText.textContent=m?(profileLine(m)+' · '+targetsLine(m)):'Заполните основные поля и нажмите «Рассчитать».';
    if(action){action.textContent=m?'Перейти к рациону':'Перейти к данным';action.setAttribute('data-profile-action',m?'ration':'focus');}
    var next=byId('workspaceProfileNext');if(next)next.hidden=!m;
    var nextTitle=byId('workspaceProfileNextTitle');if(nextTitle)nextTitle.textContent=(name||'Профиль')+': потребности рассчитаны';
    var nextText=byId('workspaceProfileNextText');if(nextText)nextText.textContent=targetsLine(m)+'. Теперь можно составлять и анализировать рацион.';
  }

  function refreshPersonContext(){
    var m=meta(),name=personName(),box=byId('workspacePersonContext');
    if(!box)return;
    box.classList.toggle('is-pending',!m);box.hidden=!workspace()||route()==='profile';
    var n=byId('workspacePersonName'),details=byId('workspacePersonDetails'),targets=byId('workspacePersonTargets'),edit=byId('workspacePersonEdit');
    if(n)n.textContent=m?(name||'Профиль без имени'):'Потребности не рассчитаны';
    if(details)details.textContent=m?profileLine(m):'Рацион пока не привязан к рассчитанному профилю';
    if(targets)targets.textContent=m?targetsLine(m):'Сначала введите рост, массу, возраст и активность';
    if(edit)edit.textContent=m?'Изменить профиль':'Рассчитать';
  }

  function updateSkipLinks(){
    if(!workspace()||route()!=='profile')return;
    var links=d.querySelectorAll('body>.skip-link');
    if(links[0]){links[0].setAttribute('href','#needs_person_name');links[0].textContent='Перейти к данным человека';}
    if(links[1]){links[1].setAttribute('href','#needs_calc_btn');links[1].textContent='Перейти к расчёту потребностей';}
  }

  function refresh(){normalizeCopy();ensureNeedsOpen();refreshProfilePanel();refreshPersonContext();updateSkipLinks();}
  function schedule(){w.clearTimeout(refreshTimer);refreshTimer=w.setTimeout(refresh,45);}

  function bind(){
    d.addEventListener('click',function(e){
      var action=e.target&&e.target.closest?e.target.closest('[data-profile-action]'):null;
      if(action){e.preventDefault();if(action.getAttribute('data-profile-action')==='ration'&&w.NavigationShellV1)w.NavigationShellV1.navigate('ration');else focusForm();return;}
    },false);
    ['needs:computed','needs:invalidated','navigation-shell:route-changed','navigation-shell:mode-changed','app:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
    d.addEventListener('needs:computed',schedule,false);d.addEventListener('needs:invalidated',schedule,false);
    d.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#needsCompact'))schedule();},true);
    d.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#needsCompact'))schedule();},true);
    if(w.MutationObserver){['needs_out','v40NeedsStatus'].forEach(function(id){var node=byId(id);if(!node)return;try{var observer=new MutationObserver(schedule);observer.observe(node,{childList:true,subtree:true,characterData:true});observers.push(observer);}catch(_){}});}
  }

  function register(){
    if(!w.NavigationShellV1)return;
    if(typeof w.NavigationShellV1.registerManaged==='function')w.NavigationShellV1.registerManaged('workspaceProfilePanel',true);
    if(typeof w.NavigationShellV1.refresh==='function')w.NavigationShellV1.refresh();
  }

  function init(){
    if(initialized)return;initialized=true;
    createProfilePanel();createPersonContext();createNextAction();normalizeCopy();register();bind();schedule();
    w.NutritionWorkspaceProfileHF8={version:VERSION,refresh:refresh,isReady:ready,getState:function(){var m=meta();return {version:VERSION,ready:!!m,name:personName(),route:route(),targets:m?{kcal:m.energyTarget,protein:m.totalProtein,fat:m.fatGrams,carbs:m.carbGrams,water:m.fluidMl}:null};}};
    try{w.dispatchEvent(new CustomEvent('workspace-profile:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
