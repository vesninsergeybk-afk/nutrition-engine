#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const worker=path.join(__dirname,'p0-4-guard-worker.php');
const lockHolder=path.join(__dirname,'p0-4-lock-holder.php');
const healthWorker=path.join(__dirname,'p0-4-health-worker.php');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'nutrition-p04-xproc-'));
const baseEnv={...process.env,NUTRITION_GEMINI_GUARD_DIR:root,NUTRITION_GEMINI_GUARD_LOG:'0',NUTRITION_GEMINI_ENABLED:'1',NUTRITION_GEMINI_PLANNER_CLIENT_MINUTE:'100',NUTRITION_GEMINI_PLANNER_SUBNET_MINUTE:'100',NUTRITION_GEMINI_PLANNER_GLOBAL_MINUTE:'100',NUTRITION_GEMINI_PLANNER_CLIENT_10M:'100',NUTRITION_GEMINI_PLANNER_CLIENT_HOUR:'100',NUTRITION_GEMINI_PLANNER_CLIENT_DAY:'100',NUTRITION_GEMINI_PLANNER_SUBNET_10M:'100',NUTRITION_GEMINI_PLANNER_SUBNET_HOUR:'100',NUTRITION_GEMINI_PLANNER_GLOBAL_10M:'100',NUTRITION_GEMINI_PLANNER_GLOBAL_HOUR:'100',NUTRITION_GEMINI_PLANNER_GLOBAL_DAY:'100',NUTRITION_GEMINI_GLOBAL_CONCURRENCY:'1',NUTRITION_GEMINI_CLIENT_CONCURRENCY:'1',NUTRITION_GEMINI_TOKENS_PER_MINUTE:'1000000',NUTRITION_GEMINI_PLANNER_TOKENS_PER_MINUTE:'1000000',NUTRITION_GEMINI_TOKENS_PER_HOUR:'1000000',NUTRITION_GEMINI_TOKENS_PER_DAY:'5000000'};
function run(ip,hold=0,env=baseEnv,onLine){return new Promise(resolve=>{const p=spawn('php',[worker,root,ip,String(hold)],{env});let out='',err='';p.stdout.on('data',b=>{out+=b;for(const line of out.split(/\n/).slice(0,-1))if(onLine)onLine(line,p);});p.stderr.on('data',b=>err+=b);p.on('close',code=>resolve({code,out,err}));});}
function runHealth(){return new Promise(resolve=>{const p=spawn('php',[healthWorker,root],{env:baseEnv});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('close',code=>resolve({code,out,err}));});}
function waitForAcquire(ip,hold,env){return new Promise((resolve,reject)=>{const p=spawn('php',[worker,root,ip,String(hold)],{env});let out='',err='',done=false;p.stdout.on('data',b=>{out+=b;if(!done&&out.includes('ACQUIRED')){done=true;resolve({p,get:()=>({out,err})});}});p.stderr.on('data',b=>err+=b);p.on('close',code=>{if(!done)reject(new Error(`holder exited ${code}: ${out} ${err}`));});});}
function clear(){for(const name of fs.readdirSync(root))fs.rmSync(path.join(root,name),{force:true,recursive:true});}
function waitForFileLock(hold=2200){return new Promise((resolve,reject)=>{const p=spawn('php',[lockHolder,root,String(hold)],{env:baseEnv});let out='',err='',done=false;p.stdout.on('data',b=>{out+=b;if(!done&&out.includes('LOCKED')){done=true;resolve({p,get:()=>({out,err})});}});p.stderr.on('data',b=>err+=b);p.on('close',code=>{if(!done)reject(new Error(`lock holder exited ${code}: ${out} ${err}`));});});}
(async()=>{
 let assertions=0;
 clear();
 const holder=await waitForAcquire('198.51.100.10',1000,baseEnv);
 const same=await run('198.51.100.10',0,baseEnv);assert.equal(same.code,2);assert.match(same.out,/guard_client_concurrency/);assertions++;
 const other=await run('203.0.113.10',0,baseEnv);assert.equal(other.code,2);assert.match(other.out,/guard_global_concurrency/);assertions++;
 await new Promise(r=>holder.p.on('close',r));
 const after=await run('203.0.113.10',0,baseEnv);assert.equal(after.code,0,after.out+after.err);assertions++;
 clear();
 const raceEnv={...baseEnv,NUTRITION_GEMINI_GLOBAL_CONCURRENCY:'20',NUTRITION_GEMINI_CLIENT_CONCURRENCY:'3',NUTRITION_GEMINI_PLANNER_GLOBAL_10M:'3'};
 const ips=Array.from({length:12},(_,i)=>`198.51.${Math.floor(i/250)}.${10+i}`);
 const rows=await Promise.all(ips.map(ip=>run(ip,0,raceEnv)));
 const allowed=rows.filter(x=>x.code===0).length;
 const denied=rows.filter(x=>x.code===2&&/guard_global_10m/.test(x.out)).length;
 assert.equal(allowed,3,JSON.stringify(rows));assert.equal(denied,9,JSON.stringify(rows));assertions+=2;
 const state=JSON.parse(fs.readFileSync(path.join(root,'state.json'),'utf8'));
 const raw=JSON.stringify(state);for(const ip of ips)assert.equal(raw.includes(ip),false);assertions++;
 clear();
 const locker=await waitForFileLock(2200);
 const healthWhileLocked=await runHealth();
 assert.equal(healthWhileLocked.code,0,healthWhileLocked.out+healthWhileLocked.err);
 const healthPayload=JSON.parse(healthWhileLocked.out.trim());
 assert.equal(healthPayload.status.available,true);assert.ok(healthPayload.elapsed_ms<500,`health blocked ${healthPayload.elapsed_ms}ms`);assertions++;
 const lockedWorker=await run('198.51.100.10',0,baseEnv);
 assert.equal(lockedWorker.code,2,lockedWorker.out+lockedWorker.err);assert.match(lockedWorker.out,/guard_storage_unavailable/);assertions++;
 await new Promise(r=>locker.p.on('close',r));
 const afterLock=await run('198.51.100.10',0,baseEnv);assert.equal(afterLock.code,0,afterLock.out+afterLock.err);assertions++;
 fs.rmSync(root,{recursive:true,force:true});
 console.log(JSON.stringify({status:'PASS',assertions,allowed,denied},null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
