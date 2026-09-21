/* Nutrition Calculator v5.3.207 — ration state recovery and consistency watchdog. */
(function(){
  'use strict';
  var VERSION='v5.3.207_ration_state_recovery';
  var STORAGE_KEY='nutri_ration_v1';
  var recovered=false;
  function parseItems(raw){
    if(!raw)return [];
    try{
      var data=JSON.parse(String(raw));
      if(Array.isArray(data))return data;
      if(data&&Array.isArray(data.items))return data.items;
      if(data&&Array.isArray(data.ration))return data.ration;
    }catch(_){}
    return [];
  }
  function nativeItems(){
    try{return parseItems(window.localStorage&&window.localStorage.getItem(STORAGE_KEY));}
    catch(_){return [];}
  }
  function refreshUi(){
    try{if(window.NutritionRationUI&&typeof window.NutritionRationUI.refresh==='function')window.NutritionRationUI.refresh('v5.3.207-recovery');}catch(_){}
    try{if(typeof window.__v35UpdateRationKpi==='function')window.__v35UpdateRationKpi();}catch(_){}
    try{window.dispatchEvent(new CustomEvent('ration:state-consistency-checked',{detail:{version:VERSION,recovered:recovered}}));}catch(_){}
  }
  function recover(reason){
    var state=window.State;
    if(!state||typeof state.get!=='function')return {ok:false,reason:'state_unavailable'};
    var current=[];
    try{current=state.get()||[];}catch(_){current=[];}
    if(current.length)return {ok:true,recovered:false,count:current.length,reason:'state_not_empty'};
    var stored=nativeItems();
    if(!stored.length)return {ok:true,recovered:false,count:0,reason:'storage_empty'};
    var result=null;
    try{
      if(typeof state.replaceAll==='function')result=state.replaceAll(stored,'storage_recovery_'+String(reason||'watchdog'));
      else{
        var imported=0;
        stored.forEach(function(it){if(it&&state.add&&state.add(it.key||it.id,it.grams,it.ai_import||null))imported+=1;});
        result={ok:imported>0,imported:imported,skipped:stored.length-imported};
      }
    }catch(e){result={ok:false,error:String(e&&e.message||e)};}
    if(result&&result.ok){
      recovered=true;
      try{window.__RATION_STATE_RECOVERY_V53207__={version:VERSION,recovered:true,reason:String(reason||''),imported:Number(result.imported)||0,at:new Date().toISOString()};}catch(_){}
      refreshUi();
      return {ok:true,recovered:true,count:Number(result.imported)||0};
    }
    try{window.__RATION_STATE_RECOVERY_V53207__={version:VERSION,recovered:false,reason:String(reason||''),error:result&&result.error||'recovery_failed',at:new Date().toISOString()};}catch(_){}
    return {ok:false,recovered:false,reason:'recovery_failed',detail:result};
  }
  function checkPersistence(){
    try{
      var status=window.State&&typeof window.State.getPersistenceStatus==='function'?window.State.getPersistenceStatus():null;
      window.__RATION_PERSISTENCE_STATUS_V53207__=status;
      if(status&&status.readable&&!status.writable){
        window.dispatchEvent(new CustomEvent('ration:persistence-degraded',{detail:status}));
      }
    }catch(_){}
  }
  function init(){
    recover('init');
    checkPersistence();
    setTimeout(function(){recover('delayed');refreshUi();},350);
  }
  window.RationStateRecoveryV53207={version:VERSION,recover:recover,checkPersistence:checkPersistence,nativeItems:nativeItems};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('app:ready',function(){setTimeout(init,0);});
  window.addEventListener('ration:add-failed',function(){setTimeout(checkPersistence,0);});
})();
