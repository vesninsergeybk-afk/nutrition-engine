/* Ivory & Brass v6 progressive disclosure for specialist profile options.
 * Keeps every existing form control in its original DOM parent and order.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-alpha1-progressive-disclosure';
  var STORAGE='nutritionCalculator.ivoryAdvancedProfile.v1';
  var initialized=false,expanded=false,nodes=[];
  function byId(id){return d.getElementById(id);}
  function readStored(){try{return localStorage.getItem(STORAGE)==='1';}catch(_){return false;}}
  function store(v){try{localStorage.setItem(STORAGE,v?'1':'0');}catch(_){}}
  function control(){return byId('ivoryAdvancedProfileDisclosure');}
  function button(){return byId('ivoryAdvancedProfileButton');}
  function hasSpecialValues(){
    var state=byId('needs_state'),edema=byId('needs_edema'),guard=byId('needs_guardrail'),bmi=byId('needs_bmi');
    return !!((state&&state.value&&state.value!=='normal')||(edema&&edema.value==='yes')||(guard&&guard.value&&guard.value!=='none')||(bmi&&Number(bmi.value)>0&&Number(bmi.value)<18.5));
  }
  function isIvory(){return d.documentElement.getAttribute('data-theme')==='ivory-brass';}
  function labelText(){
    if(!expanded)return 'Показать особые и профессиональные параметры';
    return 'Скрыть особые и профессиональные параметры';
  }
  function apply(options){
    options=options||{};
    var c=control(),b=button();if(!c||!b)return;
    if(hasSpecialValues()&&!expanded){expanded=true;if(options.persist!==false)store(true);}
    var active=isIvory();c.hidden=!active;
    nodes.forEach(function(n){if(n)n.hidden=active?!expanded:false;});
    b.setAttribute('aria-expanded',active&&expanded?'true':'false');
    var label=b.querySelector('span');if(label)label.textContent=labelText();
    var hint=c.querySelector('small');if(hint)hint.textContent=expanded?'Параметры открыты. Они используются только при соответствующем состоянии или ограничении.':'Обычному пользователю эти настройки обычно не требуются.';
  }
  function create(){
    var state=byId('needs_state'),edema=byId('needs_edema'),guard=byId('needs_guardrail');
    if(!state||!state.parentElement||control())return false;
    nodes=[state.parentElement,edema&&edema.parentElement,guard&&guard.parentElement,byId('needsProtectedModeContext'),byId('needsLowWeightSafety')].filter(Boolean);
    nodes.forEach(function(n){n.setAttribute('data-ivory-advanced-profile','1');});
    var c=d.createElement('div');c.id='ivoryAdvancedProfileDisclosure';c.className='ivory-advanced-profile-disclosure';c.hidden=true;
    c.innerHTML='<button id="ivoryAdvancedProfileButton" type="button" aria-expanded="false" aria-controls="needs_state needs_edema needs_guardrail needsProtectedModeContext needsLowWeightSafety"><span>Показать особые и профессиональные параметры</span><i aria-hidden="true"></i></button><small>Обычному пользователю эти настройки обычно не требуются.</small>';
    state.parentElement.parentNode.insertBefore(c,state.parentElement);
    return true;
  }
  function bind(){
    var b=button();if(b)b.addEventListener('click',function(){expanded=!expanded;store(expanded);apply();});
    ['needs_state','needs_edema','needs_guardrail','needs_bmi'].forEach(function(id){var e=byId(id);if(e)e.addEventListener('change',function(){apply();});});
    ['nutrition:themechange','navigation-shell:ready','workspace-profile:ready','app:ready'].forEach(function(name){w.addEventListener(name,function(){if(!control()){create();bind();}apply({persist:false});},false);});
  }
  function init(){if(initialized)return;initialized=true;expanded=readStored();if(create())bind();apply({persist:false});w.IvoryBrassProfileDisclosure={version:VERSION,open:function(){expanded=true;store(true);apply();},close:function(){if(!hasSpecialValues()){expanded=false;store(false);apply();}},refresh:apply};}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
