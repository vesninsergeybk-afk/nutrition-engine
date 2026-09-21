/* Nutrition Calculator v6 beta 1 — local profile continuity.
 * Persists profile inputs only in the current browser, restores them before
 * runtime initialization, and re-runs the canonical needs calculation only
 * when the stored profile was previously calculated and has not been edited.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta4-profile-hierarchy';
  var KEY='nutritionCalculator.profile.v1';
  var PREF_KEY='nutritionCalculator.profileRemember.v1';
  var SCHEMA=1;
  var SAVE_DELAY=220;
  var BASIC_REQUIRED=['needs_sex','needs_age','needs_h','needs_w','needs_activity'];
  var MATERIAL_IDS=[
    'needs_h','needs_w','needs_age','needs_sex','needs_activity','needs_state','needs_edema','needs_goal','needs_diet_style','needs_guardrail',
    'needs_protein_manual','needs_prev_w','needs_low_intake_days','needs_electrolytes','needs_refeeding_factors','needs_calc_w_manual','needs_split',
    'needs_nasem_pal','needs_gestation_week','needs_prepreg_w','needs_fetus_count','needs_pregnancy_complications','needs_postpartum_month',
    'needs_lactation_feeding','needs_additional_ed_risk','needs_additional_medical_restriction','needs_additional_clinical_conditions',
    'needs_clinical_energy_manual','needs_clinical_reference_weight','needs_clinical_confirmed_by','needs_clinical_confirmed_role',
    'needs_clinical_confirmed_at','needs_clinical_review_due_at','needs_clinical_source_method','needs_clinical_phase','needs_clinical_route',
    'needs_clinical_source_note','needs_clinical_targets_confirmed'
  ];
  var FIELD_IDS=['needs_person_name'].concat(MATERIAL_IDS);
  var initialized=false,restored=false,restoringCalculation=false,autoCalculationTriggered=false,startupHydrating=false,appReady=false,saveTimer=0,pendingContinue=false,restoreDestination='',restoreSnapshot=null,lastPayload=null;

  function byId(id){return d.getElementById(id);}
  function storage(){try{return w.SafeStorage||w.localStorage||null;}catch(_){return null;}}
  function nativeStorage(){try{return w.localStorage||null;}catch(_){return null;}}
  function safeGet(key){var s=storage();try{return s&&s.getItem?s.getItem(key):null;}catch(_){return null;}}
  function safeSet(key,value){var s=storage();try{return !!(s&&s.setItem&&s.setItem(key,value)!==false);}catch(_){return false;}}
  function safeRemove(key){var s=storage();try{if(s&&s.removeItem)s.removeItem(key);return true;}catch(_){return false;}}
  function parse(raw){try{var x=JSON.parse(raw||'null');return x&&typeof x==='object'?x:null;}catch(_){return null;}}
  function now(){return new Date().toISOString();}
  function rememberEnabled(){var raw=safeGet(PREF_KEY);return raw!=='0';}
  function setRemember(v){safeSet(PREF_KEY,v?'1':'0');}
  function fieldType(el){return el&&el.type==='checkbox'?'checkbox':(el&&el.tagName==='SELECT'?'select':'value');}
  function readField(el){if(!el)return null;return fieldType(el)==='checkbox'?!!el.checked:String(el.value==null?'':el.value);}
  function validSelect(el,value){if(!el||el.tagName!=='SELECT')return true;return Array.prototype.some.call(el.options,function(o){return String(o.value)===String(value);});}
  function clampText(el,value){var s=String(value==null?'':value);var max=Number(el&&el.maxLength);return max>0?s.slice(0,max):s.slice(0,1000);}
  function validNumeric(id,value){
    var numericIds=['needs_age','needs_h','needs_w','needs_prev_w','needs_low_intake_days','needs_calc_w_manual','needs_gestation_week','needs_prepreg_w','needs_postpartum_month','needs_clinical_energy_manual','needs_clinical_reference_weight'];
    if(numericIds.indexOf(id)<0)return true;
    if(value==='')return true;
    var n=Number(String(value).replace(',','.'));if(!isFinite(n))return false;
    if(id==='needs_age')return n>=1&&n<=120&&Math.floor(n)===n;
    if(id==='needs_h')return n>=80&&n<=250;
    if(id==='needs_w'||id==='needs_prev_w'||id==='needs_calc_w_manual'||id==='needs_prepreg_w'||id==='needs_clinical_reference_weight')return n>=15&&n<=400;
    if(id==='needs_low_intake_days')return n>=0&&n<=365;
    if(id==='needs_gestation_week')return n>=1&&n<=45;
    if(id==='needs_postpartum_month')return n>=0&&n<=60;
    if(id==='needs_clinical_energy_manual')return n>=100&&n<=10000;
    return true;
  }
  function applyField(id,value){
    var el=byId(id);if(!el)return false;
    if(fieldType(el)==='checkbox'){el.checked=!!value;return true;}
    if(!validSelect(el,value)||!validNumeric(id,value))return false;
    el.value=clampText(el,value);
    return true;
  }
  function values(){var out={};FIELD_IDS.forEach(function(id){var el=byId(id);if(el)out[id]=readField(el);});return out;}
  function materialSignature(data){data=data||values();return MATERIAL_IDS.map(function(id){var v=Object.prototype.hasOwnProperty.call(data,id)?data[id]:'';return id+'='+String(v==null?'':v);}).join('|');}
  function isRequiredValid(id){
    var el=byId(id);if(!el)return false;var v=String(el.value||'').trim();if(!v)return false;
    if(id==='needs_age'||id==='needs_h'||id==='needs_w')return validNumeric(id,v);
    return true;
  }
  function completion(){var completed=BASIC_REQUIRED.filter(isRequiredValid);return {done:completed.length,total:BASIC_REQUIRED.length,missing:BASIC_REQUIRED.filter(function(id){return completed.indexOf(id)<0;}),complete:completed.length===BASIC_REQUIRED.length};}
  function payload(applied){
    var data=values(),signature=materialSignature(data);
    return {schema:SCHEMA,version:VERSION,savedAt:now(),remember:true,fields:data,materialSignature:signature,applied:applied===true,appliedSignature:applied===true?signature:'',lastRoute:(function(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'';}catch(_){return '';}})()};
  }
  function write(applied){
    if(!rememberEnabled())return false;
    var p=payload(applied);lastPayload=p;var ok=safeSet(KEY,JSON.stringify(p));renderStatus(ok?'saved':'memory');return ok;
  }
  function scheduleSave(applied){w.clearTimeout(saveTimer);saveTimer=w.setTimeout(function(){write(applied===true);},SAVE_DELAY);}
  function flush(){w.clearTimeout(saveTimer);if(rememberEnabled())write(!!(lastPayload&&lastPayload.applied&&lastPayload.appliedSignature===materialSignature()));}
  function stored(){var p=parse(safeGet(KEY));if(!p||p.schema!==SCHEMA||!p.fields)return null;return p;}
  function canRestoreApplied(p){p=p||stored();return !!(p&&p.applied===true&&p.appliedSignature&&p.appliedSignature===p.materialSignature);}
  function updateBmi(){var h=Number(String((byId('needs_h')||{}).value||'').replace(',','.')),kg=Number(String((byId('needs_w')||{}).value||'').replace(',','.')),b=byId('needs_bmi');if(!b)return;if(isFinite(h)&&h>0&&isFinite(kg)&&kg>0)b.value=(kg/Math.pow(h/100,2)).toFixed(1);else b.value='';}
  function ensureChoicePrompt(id,text){
    var el=byId(id);if(!el||el.tagName!=='SELECT')return;
    var option=Array.prototype.find.call(el.options,function(o){return String(o.value)==='';});
    if(!option){option=d.createElement('option');option.value='';option.textContent=text;option.disabled=true;el.insertBefore(option,el.firstChild);}
    el.value='';
  }
  function prepareFirstRunChoices(){
    if(stored()||w.__lastNeedsProfileApplied===true)return;
    ensureChoicePrompt('needs_sex','Выберите пол');
    ensureChoicePrompt('needs_activity','Выберите уровень активности');
  }
  function reconcileStoredFields(p){
    if(!p||!p.fields)return false;
    var count=0;FIELD_IDS.forEach(function(id){if(Object.prototype.hasOwnProperty.call(p.fields,id)&&applyField(id,p.fields[id]))count++;});
    updateBmi();return count>0;
  }
  function restore(){
    var p=stored();lastPayload=p;
    if(!p||!rememberEnabled())return false;
    try{restoreSnapshot=JSON.parse(JSON.stringify(p));}catch(_){restoreSnapshot=p;}
    restored=reconcileStoredFields(p);
    if(restored){
      /* Protect both calculated profiles and unfinished drafts from historical
         startup defaults. Drafts are re-applied after app:ready but are never
         auto-calculated. */
      startupHydrating=true;d.documentElement.setAttribute('data-profile-hydrating','1');
      d.documentElement.setAttribute('data-profile-restored','1');
      if(canRestoreApplied(p))d.documentElement.setAttribute('data-profile-restoring','1');
    }
    return restored;
  }
  function humanTime(value){try{return new Date(value).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_){return '';}}
  function labelFor(id){var label=d.querySelector('label[for="'+id+'"]');return label?String(label.textContent||'').replace(/\s+/g,' ').trim():id;}
  function createPanel(){
    var needs=byId('needs'),grid=needs&&needs.querySelector('.grid');if(!needs||!grid||byId('profileContinuityPanel'))return;
    var panel=d.createElement('section');panel.id='profileContinuityPanel';panel.className='profile-continuity';panel.setAttribute('aria-labelledby','profileContinuityTitle');
    panel.innerHTML='<div class="profile-continuity__head"><div><span>Первый шаг</span><h2 id="profileContinuityTitle">Начните с основных данных</h2><p>Укажите пол, возраст, рост, массу и активность. Дополнительные цели и специальные условия находятся ниже и не мешают первому шагу.</p></div><div class="profile-continuity__progress" aria-label="Заполнение основных данных"><strong id="profileContinuityCount">0 из 5</strong><div><i id="profileContinuityBar"></i></div></div></div><div id="profileContinuityMissing" class="profile-continuity__missing"></div><div class="profile-continuity__actions"><button id="profileCalculateContinue" type="button">Заполните основные данные</button><button id="profileFocusMissing" class="secondary" type="button">Перейти к первому незаполненному полю</button></div><div class="profile-continuity__storage"><label><input id="profileRememberToggle" type="checkbox" checked> Запоминать данные на этом устройстве</label><span id="profileStorageStatus" role="status" aria-live="polite">Данные сохраняются только в этом браузере.</span><button id="profileClearSaved" class="ghost" type="button">Удалить сохранённый профиль</button></div>';
    needs.insertBefore(panel,grid);
    try{w.dispatchEvent(new CustomEvent('profile:panel-created',{detail:{version:VERSION}}));}catch(_){}
  }
  function renderStatus(kind){
    var node=byId('profileStorageStatus');if(!node)return;
    var p=lastPayload||stored();
    if(!rememberEnabled()){node.textContent='Автосохранение выключено.';return;}
    if(kind==='memory'){node.textContent='Браузер запретил постоянное хранение: данные сохранятся только до закрытия страницы.';return;}
    if(p&&p.savedAt)node.textContent=(p.applied?'Профиль рассчитан и сохранён · ':'Черновик сохранён · ')+humanTime(p.savedAt);
    else node.textContent='Данные сохраняются только в этом браузере.';
  }
  function isCurrentApplied(){var p=lastPayload||stored();return !!(p&&p.applied===true&&p.appliedSignature&&p.appliedSignature===materialSignature());}
  function renderProgress(){
    var c=completion(),count=byId('profileContinuityCount'),bar=byId('profileContinuityBar'),box=byId('profileContinuityMissing'),calc=byId('profileCalculateContinue'),focus=byId('profileFocusMissing'),current=isCurrentApplied(),hadApplied=!!((lastPayload||stored())&&(lastPayload||stored()).appliedSignature);
    if(count)count.textContent=c.done+' из '+c.total;if(bar)bar.style.width=Math.round(c.done/c.total*100)+'%';
    if(box){
      if(!c.complete)box.innerHTML=c.missing.map(function(id){return '<button type="button" data-profile-focus="'+id+'">'+labelFor(id)+'</button>';}).join('');
      else if(current)box.innerHTML='<span class="is-complete">Профиль рассчитан. Персональные ориентиры актуальны.</span>';
      else box.innerHTML='<span class="is-complete">Основные данные заполнены. Рассчитайте персональные ориентиры.</span>';
    }
    if(calc){calc.disabled=!c.complete;calc.setAttribute('aria-disabled',c.complete?'false':'true');calc.textContent=!c.complete?'Заполните основные данные':(current?'Перейти к рациону':(hadApplied?'Пересчитать и перейти к рациону':'Рассчитать и перейти к рациону'));}
    if(focus){focus.hidden=c.complete;}
    d.documentElement.setAttribute('data-profile-basic-complete',c.complete?'1':'0');
    d.documentElement.setAttribute('data-profile-calculation-state',current?'current':(c.complete?'draft':'incomplete'));
  }
  function focusFirstMissing(){var c=completion(),id=c.missing[0]||'needs_calc_btn',el=byId(id);if(el){try{el.focus({preventScroll:true});}catch(_){el.focus();}try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){}}}
  function clearSaved(options){options=options||{};safeRemove(KEY);lastPayload=null;d.documentElement.removeAttribute('data-profile-restored');d.documentElement.removeAttribute('data-profile-restoring');d.documentElement.removeAttribute('data-profile-hydrating');renderStatus();if(options.reset){var b=byId('needs_reset_btn');if(b)b.click();}}
  function calculateAndContinue(){
    var c=completion();if(!c.complete){focusFirstMissing();return;}
    if(isCurrentApplied()){navigateRation();return;}
    var b=byId('needs_calc_btn');if(!b||b.disabled){renderStatus();return;}
    pendingContinue=true;b.click();
  }
  function navigateRation(){try{if(w.NavigationShellV1&&typeof w.NavigationShellV1.navigate==='function')w.NavigationShellV1.navigate('ration','globalSearchSection');}catch(_){} }
  function attemptAutoCalculation(){
    var p=restoreSnapshot||stored();
    if(autoCalculationTriggered||!appReady||!canRestoreApplied(p))return;
    /* Older modules initialise select defaults during runtime startup. Restore
       the authoritative saved values again immediately before calculation. */
    reconcileStoredFields(p);renderProgress();
    if(!completion().complete)return;
    restoreDestination=String(p.lastRoute||'');
    var tries=0;
    function run(){
      if(autoCalculationTriggered)return;
      var b=byId('needs_calc_btn'),meta=w.__APP_BOOTSTRAP_META__||null;
      var runtimeReady=!!(w.__RUNTIME_LOADER_CLOSED__||(meta&&meta.status==='ready'));
      var calculatorReady=!!(b&&b.getAttribute('data-needs-calculation-ready')==='1');
      tries++;
      if(b&&!b.disabled&&calculatorReady&&runtimeReady){
        autoCalculationTriggered=true;
        restoringCalculation=true;
        try{b.click();}catch(_){autoCalculationTriggered=false;restoringCalculation=false;}
        return;
      }
      if(tries<60)w.setTimeout(run,150);
      else{startupHydrating=false;d.documentElement.removeAttribute('data-profile-restoring');d.documentElement.removeAttribute('data-profile-hydrating');renderStatus();}
    }
    run();
  }
  function markDirty(){
    if(restoringCalculation||startupHydrating)return;
    var sig=materialSignature(),baseline=lastPayload&&lastPayload.appliedSignature;
    /* Several canonical modules emit synthetic input/change events while
       synchronising derived fields. An event without a material signature
       change must not invalidate an already calculated profile. */
    if(lastPayload&&lastPayload.applied===true&&baseline&&baseline===sig){renderProgress();return;}
    if(lastPayload){lastPayload.applied=false;lastPayload.appliedSignature='';}
    scheduleSave(false);renderProgress();
  }
  function onComputed(){
    /* A canonical age-profile synchronisation may emit a final input event
       immediately before needs:computed. Cancel its queued draft write so it
       cannot overwrite the newly confirmed applied profile. */
    w.clearTimeout(saveTimer);saveTimer=0;
    var wasRestoring=restoringCalculation,destination=restoreDestination;
    restoringCalculation=false;startupHydrating=false;restoreDestination='';restoreSnapshot=null;d.documentElement.removeAttribute('data-profile-restoring');d.documentElement.removeAttribute('data-profile-hydrating');write(true);renderProgress();
    try{w.dispatchEvent(new CustomEvent('profile:persistence-ready',{detail:{version:VERSION,restored:restored,applied:true}}));}catch(_){}
    if(pendingContinue){pendingContinue=false;w.setTimeout(navigateRation,80);}
    else if(wasRestoring&&destination&&destination!=='profile')w.setTimeout(function(){try{if(w.NavigationShellV1&&typeof w.NavigationShellV1.navigate==='function')w.NavigationShellV1.navigate(destination);}catch(_){}},80);
  }
  function bind(){
    FIELD_IDS.forEach(function(id){var el=byId(id);if(!el||el.getAttribute('data-profile-persistence-bound')==='1')return;el.setAttribute('data-profile-persistence-bound','1');el.addEventListener('input',markDirty,false);el.addEventListener('change',markDirty,false);});
    d.addEventListener('needs:computed',onComputed,false);
    d.addEventListener('needs:invalidated',function(e){
      if(e&&e.detail&&e.detail.reason==='reset'){clearSaved();renderProgress();return;}
      if(startupHydrating)return;
      var sig=materialSignature(),baseline=lastPayload&&lastPayload.appliedSignature;
      if(lastPayload&&lastPayload.applied===true&&baseline&&baseline===sig)return;
      markDirty();
    },false);
    var calculate=byId('profileCalculateContinue');if(calculate)calculate.addEventListener('click',calculateAndContinue,false);
    var focus=byId('profileFocusMissing');if(focus)focus.addEventListener('click',focusFirstMissing,false);
    var missing=byId('profileContinuityMissing');if(missing)missing.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-profile-focus]'):null;if(b){var el=byId(b.getAttribute('data-profile-focus'));if(el){el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});}}},false);
    var remember=byId('profileRememberToggle');if(remember){remember.checked=rememberEnabled();remember.addEventListener('change',function(){setRemember(remember.checked);if(remember.checked)write(!!(lastPayload&&lastPayload.applied));else clearSaved();renderStatus();});}
    var clear=byId('profileClearSaved');if(clear)clear.addEventListener('click',function(){clearSaved({reset:true});},false);
    var reset=byId('needs_reset_btn');if(reset)reset.addEventListener('click',function(){w.setTimeout(function(){clearSaved();renderProgress();},0);},false);
    w.addEventListener('beforeunload',flush,false);
    var onAppReady=function(){
      appReady=true;
      if(restoreSnapshot){
        reconcileStoredFields(restoreSnapshot);
        if(!canRestoreApplied(restoreSnapshot)){startupHydrating=false;d.documentElement.removeAttribute('data-profile-hydrating');}
      } else if(!stored())prepareFirstRunChoices();
      renderProgress();renderStatus();attemptAutoCalculation();
    };
    w.addEventListener('app:ready',onAppReady,false);
    d.addEventListener('app:ready',onAppReady,false);
    w.addEventListener('navigation-shell:ready',attemptAutoCalculation,false);
    w.addEventListener('navigation-shell:route-changed',function(){if(!startupHydrating&&lastPayload&&lastPayload.applied===true)scheduleSave(true);},false);
    w.addEventListener('storage',function(e){if(e&&e.key===KEY)renderStatus();},false);
  }
  function init(){
    if(initialized)return;initialized=true;prepareFirstRunChoices();restore();createPanel();bind();renderProgress();renderStatus();
    w.NutritionProfilePersistenceV1={version:VERSION,key:KEY,hasStoredProfile:function(){return !!stored();},hasRestorableAppliedProfile:function(){return canRestoreApplied(restoreSnapshot||stored());},isCurrentApplied:isCurrentApplied,completion:completion,save:function(){return write(!!(lastPayload&&lastPayload.applied));},clear:function(){clearSaved();},getStored:function(){return stored();},attemptRestoreCalculation:attemptAutoCalculation,reapplyStored:function(){return reconcileStoredFields(restoreSnapshot||stored());},status:function(){return {initialized:initialized,restored:restored,restoringCalculation:restoringCalculation,autoCalculationTriggered:autoCalculationTriggered,startupHydrating:startupHydrating,appReady:appReady,currentApplied:isCurrentApplied(),restoreDestination:restoreDestination,snapshot:restoreSnapshot?{applied:restoreSnapshot.applied,lastRoute:restoreSnapshot.lastRoute,sex:restoreSnapshot.fields&&restoreSnapshot.fields.needs_sex,activity:restoreSnapshot.fields&&restoreSnapshot.fields.needs_activity}:null};}};
    try{w.dispatchEvent(new CustomEvent('profile:persistence-initialized',{detail:{version:VERSION,restored:restored,restorableApplied:canRestoreApplied(stored())}}));}catch(_){}
    if(canRestoreApplied(restoreSnapshot||stored()))w.setTimeout(attemptAutoCalculation,500);
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
