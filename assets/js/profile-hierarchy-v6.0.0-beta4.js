/* Nutrition Calculator v6 beta 4 — HOTFIX30 final profile hierarchy.
 * Establishes one stable profile DOM after startup. It never re-parents fields
 * again on theme or layout changes. Basic anthropometrics stay visible;
 * preferences and professional/clinical inputs use explicit disclosure.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta4-profile-hierarchy';
  var PREF_KEY='nutritionCalculator.profileDisclosure.v2';
  var initialized=false,root=null,basic=null,preferences=null,advanced=null,utilities=null;
  var BASIC_IDS=['needs_sex','needs_age','needs_h','needs_w','needs_activity','needs_bmi'];
  var PREFERENCE_IDS=['needs_person_name','needs_goal','needs_diet_style','needs_split'];
  var ADVANCED_IDS=['needs_state','needs_edema','needs_guardrail','needs_protein_manual'];
  var PURPOSES={
    needs_sex:'Используется в формуле энергозатрат и при выборе возрастно-половых ориентиров.',
    needs_age:'Определяет возрастную группу норм и применимые расчётные правила.',
    needs_h:'Используется вместе с массой для расчёта ИМТ и энергетического ориентира.',
    needs_w:'Используется для расчёта энергии, белка, жидкости и относительных показателей.',
    needs_activity:'Корректирует ориентир суточных энергозатрат. Выберите наиболее близкий обычный уровень.',
    needs_bmi:'Рассчитывается автоматически после ввода роста и массы.'
  };
  function byId(id){return d.getElementById(id);}
  function safeParse(raw){try{var x=JSON.parse(raw||'{}');return x&&typeof x==='object'?x:{};}catch(_){return {};}}
  function readPrefs(){try{return safeParse(localStorage.getItem(PREF_KEY));}catch(_){return {};}}
  function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify({preferences:!!(preferences&&preferences.open),advanced:!!(advanced&&advanced.open),utilities:!!(utilities&&utilities.open)}));}catch(_){}}
  function fieldWrapper(id){
    var el=byId(id);if(!el)return null;
    if(id==='needs_person_name')return el.parentElement;
    var n=el.parentElement;
    return n;
  }
  function makeHeader(kicker,title,copy){
    var h=d.createElement('header');h.className='profile-hierarchy__header';
    h.innerHTML='<span>'+kicker+'</span><div><h3>'+title+'</h3><p>'+copy+'</p></div>';
    return h;
  }
  function makeDetails(id,title,copy,status){
    var el=d.createElement('details');el.id=id;el.className='profile-hierarchy__details';
    el.innerHTML='<summary><span class="profile-hierarchy__summary-copy"><b>'+title+'</b><small>'+copy+'</small></span><span class="profile-hierarchy__summary-status" data-profile-summary-status>'+status+'</span><i aria-hidden="true"></i></summary><div class="grid profile-hierarchy__fields"></div>';
    return el;
  }
  function appendUnique(parent,node){if(node&&node.parentNode!==parent)parent.appendChild(node);}
  function addPurpose(id){
    var el=byId(id),wrap=fieldWrapper(id);if(!el||!wrap||!PURPOSES[id]||wrap.querySelector('[data-profile-purpose="'+id+'"]'))return;
    var s=d.createElement('div');s.className='small profile-hierarchy__purpose';s.id=id+'Purpose';s.setAttribute('data-profile-purpose',id);s.textContent=PURPOSES[id];
    wrap.appendChild(s);
    var described=(el.getAttribute('aria-describedby')||'').trim().split(/\s+/).filter(Boolean);if(described.indexOf(s.id)<0)described.push(s.id);el.setAttribute('aria-describedby',described.join(' '));
  }
  function specialValues(){
    var state=byId('needs_state'),edema=byId('needs_edema'),guard=byId('needs_guardrail'),protein=byId('needs_protein_manual');
    return !!((state&&state.value&&state.value!=='normal')||(edema&&edema.value==='yes')||(guard&&guard.value&&guard.value!=='none')||(protein&&String(protein.value||'').trim())||
      (byId('needs_additional_ed_risk')&&byId('needs_additional_ed_risk').checked)||(byId('needs_additional_medical_restriction')&&byId('needs_additional_medical_restriction').checked)||(byId('needs_additional_clinical_conditions')&&byId('needs_additional_clinical_conditions').checked));
  }
  function preferencesChanged(){
    var goal=byId('needs_goal'),diet=byId('needs_diet_style'),split=byId('needs_split'),name=byId('needs_person_name');
    return !!((goal&&goal.value&&goal.value!=='maintain')||(diet&&diet.value&&diet.value!=='mixed')||(split&&split.value&&split.value!=='4|25,35,30,10')||(name&&String(name.value||'').trim()));
  }
  function updateSummary(){
    if(!preferences||!advanced)return;
    var ps=preferences.querySelector('[data-profile-summary-status]'),as=advanced.querySelector('[data-profile-summary-status]');
    if(ps)ps.textContent=preferencesChanged()?'Настроено':'Необязательно';
    if(as)as.textContent=specialValues()?'Особые параметры выбраны':'Обычный профиль';
    if(specialValues()&&!advanced.open)advanced.open=true;
    d.documentElement.setAttribute('data-profile-advanced-active',specialValues()?'1':'0');
  }
  function revealFor(el){
    if(!el)return;
    var p=el.closest&&el.closest('details.profile-hierarchy__details');if(p&&!p.open)p.open=true;
  }
  function createMethodDisclosure(needs){
    var notice=byId('needs-method-notice');if(!notice||byId('profileMethodDetails'))return;
    var details=d.createElement('details');details.id='profileMethodDetails';details.className='profile-hierarchy__method';details.innerHTML='<summary><span><b>Как рассчитываются ориентиры</b><small>Метод, ограничения и случаи, когда нужна внешняя клиническая цель</small></span><i aria-hidden="true"></i></summary>';
    notice.parentNode.insertBefore(details,notice);details.appendChild(notice);
  }
  function createStructure(){
    var needs=byId('needs'),oldGrid=needs&&needs.querySelector(':scope > .grid');if(!needs||!oldGrid||byId('profileHierarchyRoot'))return false;
    root=oldGrid;root.id='profileHierarchyRoot';root.classList.add('profile-hierarchy');
    basic=d.createElement('section');basic.id='profileBasicSection';basic.className='profile-hierarchy__basic';basic.appendChild(makeHeader('Обязательный минимум','Основные данные','Пять полей нужны для персональных ориентиров. Остальные настройки можно не открывать.'));
    var basicGrid=d.createElement('div');basicGrid.className='grid profile-hierarchy__fields';basic.appendChild(basicGrid);
    preferences=makeDetails('profilePreferencesSection','Цель и пищевые предпочтения','Необязательные настройки для более точной интерпретации рациона.','Необязательно');
    advanced=makeDetails('profileAdvancedSection','Особые и профессиональные параметры','Беременность, клинические состояния, отёки, риск рефидинга и внешние цели специалиста.','Обычный профиль');
    utilities=makeDetails('profileUtilitiesSection','Дополнительные действия','Сброс профиля, печать, PDF и технические сведения.','Скрыто');utilities.classList.add('profile-hierarchy__utilities-section');
    root.insertBefore(basic,root.firstChild);root.appendChild(preferences);root.appendChild(advanced);root.appendChild(utilities);
    BASIC_IDS.forEach(function(id){var n=fieldWrapper(id);if(n){n.setAttribute('data-profile-tier','basic');appendUnique(basicGrid,n);addPurpose(id);}});
    var prefGrid=preferences.querySelector('.profile-hierarchy__fields');PREFERENCE_IDS.forEach(function(id){var n=fieldWrapper(id);if(n){n.setAttribute('data-profile-tier','preferences');appendUnique(prefGrid,n);}});
    var advGrid=advanced.querySelector('.profile-hierarchy__fields');ADVANCED_IDS.forEach(function(id){var n=fieldWrapper(id);if(n){n.setAttribute('data-profile-tier','advanced');appendUnique(advGrid,n);}});
    ['needsProtectedModeContext','needsLowWeightSafety'].forEach(function(id){var n=byId(id);if(n){n.setAttribute('data-profile-tier','advanced');appendUnique(advGrid,n);}});
    var canonical=byId('needs_calc_btn'),action=canonical&&canonical.parentElement;if(action){action.classList.add('profile-hierarchy__legacy-actions');canonical.hidden=true;canonical.setAttribute('aria-hidden','true');canonical.tabIndex=-1;appendUnique(utilities.querySelector('.profile-hierarchy__fields'),action);}
    var dbg=byId('dbg');if(dbg)appendUnique(utilities.querySelector('.profile-hierarchy__fields'),dbg);
    var prefs=readPrefs();preferences.open=!!prefs.preferences||preferencesChanged();advanced.open=!!prefs.advanced||specialValues();utilities.open=!!prefs.utilities;
    [preferences,advanced,utilities].forEach(function(x){x.addEventListener('toggle',function(){savePrefs();updateSummary();},false);});
    createMethodDisclosure(needs);updateSummary();return true;
  }
  function enhancePanel(){
    var panel=byId('profileContinuityPanel');if(!panel||panel.querySelector('.profile-hierarchy__journey'))return;
    var journey=d.createElement('div');journey.className='profile-hierarchy__journey';journey.setAttribute('aria-label','Путь работы с калькулятором');
    journey.innerHTML='<span class="is-current"><b>1</b> Основные данные</span><span><b>2</b> Персональные ориентиры</span><span><b>3</b> Рацион и анализ</span>';
    var head=panel.querySelector('.profile-continuity__head');if(head)head.insertAdjacentElement('afterend',journey);
    var title=byId('profileContinuityTitle');if(title)title.textContent='Начните с основных данных';
    var paragraph=head&&head.querySelector('p');if(paragraph)paragraph.textContent='Укажите пол, возраст, рост, массу и активность. Цель питания, пищевые предпочтения и специальные условия вынесены ниже и не мешают первому шагу.';
  }
  function onInvalid(e){var el=e.target;if(!el||!el.id)return;revealFor(el);}
  function bind(){
    d.addEventListener('invalid',onInvalid,true);
    PREFERENCE_IDS.concat(ADVANCED_IDS,['needs_additional_ed_risk','needs_additional_medical_restriction','needs_additional_clinical_conditions']).forEach(function(id){var el=byId(id);if(el){el.addEventListener('input',updateSummary,false);el.addEventListener('change',updateSummary,false);}});
    d.addEventListener('needs:invalidated',function(){updateSummary();},false);
    d.addEventListener('needs:computed',function(){updateSummary();},false);
    var reset=byId('needs_reset_btn');if(reset)reset.addEventListener('click',function(){w.setTimeout(function(){preferences.open=false;advanced.open=false;utilities.open=false;savePrefs();updateSummary();},0);},false);
  }
  function init(){
    if(initialized)return;initialized=true;
    if(!createStructure()){w.setTimeout(function(){initialized=false;init();},80);return;}
    enhancePanel();bind();updateSummary();
    d.documentElement.setAttribute('data-profile-hierarchy','v2');
    w.NutritionProfileHierarchyV2={version:VERSION,openPreferences:function(){preferences.open=true;preferences.scrollIntoView({behavior:'smooth',block:'start'});},openAdvanced:function(){advanced.open=true;advanced.scrollIntoView({behavior:'smooth',block:'start'});},status:function(){return {preferencesOpen:preferences.open,advancedOpen:advanced.open,utilitiesOpen:utilities.open,special:specialValues(),preferencesChanged:preferencesChanged(),basicFields:BASIC_IDS.slice()};},refresh:updateSummary};
    try{w.dispatchEvent(new CustomEvent('profile:hierarchy-ready',{detail:{version:VERSION}}));}catch(_){}
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
