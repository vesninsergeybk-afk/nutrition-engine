#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function response(body,status=200){return {ok:status>=200&&status<300,status,text:async()=>JSON.stringify(body)};}
function load(rel){
  let fetchCount=0;
  const replies=[];
  const storage=new Map();
  const context={
    console,
    Promise,
    setTimeout,clearTimeout,setInterval,clearInterval,
    AbortController,
    Blob:global.Blob,
    File:global.File||class File{},
    FormData:global.FormData||class FormData{},
    URL:global.URL,
    TextEncoder:global.TextEncoder,
    TextDecoder:global.TextDecoder,
    Uint8Array,Int16Array,ArrayBuffer,DataView,Math,Date,JSON,Number,String,Boolean,Object,RegExp,Error,TypeError,Set,Map,
    CustomEvent:class CustomEvent{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    navigator:{hardwareConcurrency:4},
    sessionStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
    document:{readyState:'loading',addEventListener(){},getElementById(){return null;},querySelector(){return null;},createElement(){return {};},visibilityState:'visible'},
  };
  context.window=context;
  context.fetch=async()=>{fetchCount++; if(!replies.length)throw new Error('unexpected fetch'); return replies.shift();};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',rel),'utf8'),context,{filename:rel});
  return {context,api:context.NutritionGeminiRationImport,replies,getFetchCount:()=>fetchCount};
}

(async()=>{
  let assertions=0;
  for(const rel of ['assets/js/62-gemini-ration-import-v5.js','assets/legacy/js/62-gemini-ration-import-v5.js']){
    const h=load(rel);const api=h.api;assert.ok(api,rel+' export missing');
    let p=api.packetRetryPolicy({response:{status:503},data:{retryable:true,error_code:'ai_kill_switch_env',retry_after_seconds:60,error:'disabled'}});
    assert.equal(p.retry,false);assert.equal(p.maxAttempts,1);assertions+=2;
    p=api.packetRetryPolicy({response:{status:503},data:{retryable:true,error_code:'guard_storage_unavailable',retry_after_seconds:5,error:'storage'}});
    assert.equal(p.retry,false);assertions++;
    p=api.packetRetryPolicy({response:{status:503},data:{retryable:true,error_code:'temporary_service_error',retry_after_seconds:3,error:'provider'}});
    assert.equal(p.retry,true);assertions++;
    p=api.exceptionRetryPolicy({code:'guard_circuit_open',retryable:true,retryAfter:30,message:'circuit'});
    assert.equal(p.retry,false);assert.equal(p.maxAttempts,1);assertions+=2;
    h.replies.push(response({ok:true,configured:true,ai_available:true,csrf_token:'token-a',limits:{}}));
    await api.loadHostingLimits(true);
    h.replies.push(response({ok:true,configured:true,ai_available:false,availability_code:'guard_tokens_day',retry_after_seconds:300,csrf_token:'token-b',limits:{}}));
    await assert.rejects(()=>api.ensureServiceReady(),e=>e&&e.code==='guard_tokens_day'&&e.retryAfter===300);
    assert.equal(h.getFetchCount(),2,rel+' did not refresh health before upload');assertions+=2;
  }
  console.log(JSON.stringify({status:'PASS',assertions,files:2},null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
