/* Nutrition Calculator v6 beta 3 — unified interaction-state controller.
 * Synchronises presentation state only. Calculation, norms, ration, HEI,
 * Harvard Plate, Gemini transport and profile persistence remain canonical. */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta3-interaction-coherence';
  var INTERACTIVE='button,.btn,[role="button"],summary,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  var FIELD='input,select,textarea';
  var pressed=null,feedbackTimers=new WeakMap(),lastSearchAction=null,observer=null,scanTimer=0;

  function closest(node,selector){try{return node&&node.closest?node.closest(selector):null;}catch(_){return null;}}
  function isSelected(el){
    if(!el||!el.getAttribute)return false;
    return el.getAttribute('aria-pressed')==='true'||el.getAttribute('aria-selected')==='true'||el.getAttribute('aria-current')==='page'||
      el.classList.contains('active')||el.classList.contains('is-active')||el.classList.contains('is-selected')||el.classList.contains('is-selected-zone')||
      (!!el.matches&&el.matches('input[type="checkbox"]:checked,input[type="radio"]:checked'));
  }
  function actionState(el){
    if(!el||!el.dataset)return 'idle';
    var state=String(el.dataset.actionState||el.dataset.mediaState||el.dataset.state||'idle').toLowerCase();
    if(state==='working'||state==='loading'||state==='processing'||state==='preparing'||state==='recognizing'||state==='connecting')return 'working';
    if(state==='recording')return 'recording';
    if(state==='success'||state==='ready'||state==='done')return 'success';
    if(state==='error'||state==='failed'||state==='denied'||state==='blocked')return 'error';
    return 'idle';
  }
  function fieldWrap(el){return closest(el,'label,.field,.form-field,.search-field-card,.search-grams-card,.norm-input-wrap')||el.parentElement;}
  function syncField(el){
    if(!el||!el.matches||!el.matches(FIELD))return;
    var wrap=fieldWrap(el),invalid=el.getAttribute('aria-invalid')==='true'||(el.dataset.uiTouched==='true'&&!el.validity.valid);
    el.dataset.uiInvalid=invalid?'true':'false';
    if(wrap&&wrap.dataset)wrap.dataset.uiInvalid=invalid?'true':'false';
  }
  function syncDetails(summary){
    if(!summary||summary.tagName!=='SUMMARY')return;
    var details=summary.parentElement;if(!details||details.tagName!=='DETAILS')return;
    var expanded=details.open?'true':'false';
    summary.dataset.uiExpanded=expanded;
    if(summary.getAttribute('aria-expanded')!==expanded)summary.setAttribute('aria-expanded',expanded);
    if(!summary.hasAttribute('aria-controls')){
      var bodies=Array.prototype.filter.call(details.children,function(x){return x!==summary;});
      /* aria-controls is only added when one element genuinely contains the whole disclosed region.
         Pointing at the first of several siblings would be formally misleading. */
      if(bodies.length===1){var body=bodies[0];if(!body.id)body.id='ui-details-'+Math.random().toString(36).slice(2,10);summary.setAttribute('aria-controls',body.id);}
    }
  }
  function sync(el){
    if(!el||!el.matches||!el.matches(INTERACTIVE))return;
    el.dataset.uiInteractive='true';
    el.dataset.uiSelected=isSelected(el)?'true':'false';
    var busy=el.getAttribute('aria-busy')==='true'||actionState(el)==='working';
    el.dataset.uiBusy=busy?'true':'false';
    var state=actionState(el);
    if(state!=='idle')el.dataset.uiState=state;else if(!el.dataset.uiFeedback)delete el.dataset.uiState;
    var disabled=!!el.disabled||el.getAttribute('aria-disabled')==='true';
    el.dataset.uiDisabled=disabled?'true':'false';
    syncField(el);syncDetails(el);
  }
  function scan(root){
    if(!root)return;if(root.matches&&root.matches(INTERACTIVE))sync(root);
    if(root.querySelectorAll)root.querySelectorAll(INTERACTIVE).forEach(sync);
    if(root.querySelectorAll)root.querySelectorAll('details > summary').forEach(syncDetails);
  }
  function setPressed(el,on){
    if(pressed&&pressed!==el)pressed.removeAttribute('data-ui-pressed');
    pressed=on?el:null;
    if(el){if(on)el.dataset.uiPressed='true';else el.removeAttribute('data-ui-pressed');}
  }
  function feedback(el,state,duration){
    if(!el)return;var old=feedbackTimers.get(el);if(old)w.clearTimeout(old);
    el.dataset.uiFeedback=state;sync(el);
    feedbackTimers.set(el,w.setTimeout(function(){delete el.dataset.uiFeedback;if(el.dataset.uiState===state)delete el.dataset.uiState;sync(el);},duration||1500));
  }
  function busy(el,on,lock){
    if(!el)return;el.dataset.uiBusy=on?'true':'false';
    if(lock===true)el.dataset.uiLockWhileBusy='true';
    if(on)el.setAttribute('aria-busy','true');else if(el.getAttribute('data-ui-owned-busy')==='true')el.setAttribute('aria-busy','false');
    if(on)el.setAttribute('data-ui-owned-busy','true');sync(el);
  }
  function statusFeedback(node){
    if(!node||!node.dataset)return;var state=String(node.dataset.state||'').toLowerCase(),text=String(node.textContent||'').trim();
    if(node.id==='searchAddedToast'){
      node.dataset.uiFeedback=/не удалось|ошиб|нельзя/i.test(text)?'error':'success';
    }
    if(node.id==='geminiRationStatus'){
      var recognize=d.getElementById('geminiRationRecognizeBtn');
      if(recognize){
        if(state==='working')busy(recognize,true,true);
        else {busy(recognize,false);if(state==='success'||state==='error')feedback(recognize,state,2200);}
      }
    }
    if(node.id==='geminiAiStatus'){
      var run=d.getElementById('geminiAiRunBtn');
      if(run){
        if(state==='working'||state==='loading')busy(run,true,true);
        else {busy(run,false);if(state==='success'||state==='error')feedback(run,state,2200);}
      }
    }
  }
  function onPointerDown(e){var el=closest(e.target,INTERACTIVE);if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;setPressed(el,true);}
  function clearPressed(){if(pressed)setPressed(pressed,false);}
  function onFocusIn(e){
    var el=closest(e.target,INTERACTIVE);if(el)sync(el);
    if(e.target&&e.target.matches&&e.target.matches(FIELD)){var wrap=fieldWrap(e.target);if(wrap&&wrap.dataset)wrap.dataset.uiFocusWithin='true';}
  }
  function onFocusOut(e){
    if(e.target&&e.target.matches&&e.target.matches(FIELD)){
      e.target.dataset.uiTouched='true';var wrap=fieldWrap(e.target);if(wrap&&wrap.dataset)wrap.dataset.uiFocusWithin='false';syncField(e.target);
    }
    clearPressed();
  }
  function onInput(e){
    var el=e.target;if(!el||!el.matches||!el.matches(FIELD))return;
    if(e.type==='change'||e.isTrusted)el.dataset.uiTouched='true';syncField(el);
  }
  function onClick(e){
    var el=closest(e.target,INTERACTIVE);if(!el)return;sync(el);
    if(el.matches('[data-role="add-search"],[data-role="add-search-edit"]')){
      lastSearchAction=el;busy(el,true,true);w.setTimeout(function(){if(lastSearchAction===el){busy(el,false);lastSearchAction=null;}},2200);
    }
    if(el.id==='needs_calc_btn'||el.id==='profileCalculateContinue'){
      busy(el,true,true);w.setTimeout(function(){busy(el,false);},3500);
    }
  }
  function onToggle(e){var details=e.target;if(details&&details.tagName==='DETAILS')syncDetails(details.querySelector(':scope > summary'));}
  function onRationChanged(){
    if(lastSearchAction){var el=lastSearchAction;lastSearchAction=null;busy(el,false);feedback(el,'success',1800);}
  }
  function onRationFailed(){if(lastSearchAction){var el=lastSearchAction;lastSearchAction=null;busy(el,false);feedback(el,'error',2600);}}
  function onNeedsComputed(){
    ['needs_calc_btn','profileCalculateContinue'].forEach(function(id){var el=d.getElementById(id);if(el){busy(el,false);feedback(el,'success',1800);}});
  }
  function setProfileState(){
    var panel=d.getElementById('profileContinuityPanel'),calc=d.getElementById('profileCalculateContinue');if(!panel||!calc)return;
    var ready=!calc.disabled&&calc.getAttribute('aria-disabled')!=='true';panel.dataset.uiProfileState=ready?'ready':'incomplete';sync(calc);
  }
  function scheduleScan(){
    if(scanTimer)return;
    scanTimer=w.setTimeout(function(){scanTimer=0;scan(d);setProfileState();},90);
  }
  function observe(){
    if(!w.MutationObserver)return;
    observer=new MutationObserver(function(records){
      var added=false;
      records.forEach(function(r){
        if(r.type==='childList'){if(r.addedNodes&&r.addedNodes.length)added=true;statusFeedback(r.target);}
        else if(r.type==='attributes'){sync(r.target);if(r.target.tagName==='DETAILS')syncDetails(r.target.querySelector(':scope > summary'));statusFeedback(r.target);}
        else if(r.type==='characterData')statusFeedback(r.target.parentElement);
      });
      if(added)scheduleScan();
    });
    observer.observe(d.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','aria-current','aria-expanded','aria-busy','aria-disabled','disabled','open','class','data-state','data-action-state','data-media-state']});
  }
  function init(){
    scan(d);setProfileState();observe();
    d.addEventListener('pointerdown',onPointerDown,true);d.addEventListener('pointerup',clearPressed,true);d.addEventListener('pointercancel',clearPressed,true);
    d.addEventListener('focusin',onFocusIn,true);d.addEventListener('focusout',onFocusOut,true);
    d.addEventListener('input',onInput,true);d.addEventListener('change',onInput,true);d.addEventListener('click',onClick,true);d.addEventListener('toggle',onToggle,true);
    w.addEventListener('blur',clearPressed,false);w.addEventListener('ration:changed',onRationChanged,false);w.addEventListener('ration:add-ui-failed',onRationFailed,false);
    d.addEventListener('needs:computed',onNeedsComputed,false);d.addEventListener('needs:invalidated',setProfileState,false);
    w.setInterval(setProfileState,1200);
    d.documentElement.setAttribute('data-interaction-system','v1');
    try{w.dispatchEvent(new CustomEvent('interaction-states:ready',{detail:{version:VERSION}}));}catch(_){}
  }
  w.NutritionInteractionStatesV1={version:VERSION,scan:scan,sync:sync,feedback:feedback,setBusy:busy,getState:function(el){return el?{selected:el.dataset.uiSelected,busy:el.dataset.uiBusy,state:el.dataset.uiState,feedback:el.dataset.uiFeedback}:null;}};
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
