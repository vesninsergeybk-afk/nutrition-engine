#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
let assertions=0;function check(name,fn){fn();assertions++;}
const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'config/formula-registry.v5.3.210-p1.4.json'),'utf8'));
const golden=JSON.parse(fs.readFileSync(path.join(ROOT,'data/formula-golden-cases.v5.3.210-p1.4.json'),'utf8'));
const formulas=new Map(registry.formulas.map(x=>[x.id,x]));
check('registry version',()=>assert.equal(registry.registry_version,'v5.3.210-p1.4'));
check('formula IDs unique',()=>assert.equal(formulas.size,registry.formulas.length));
check('all golden formula IDs exist',()=>assert.ok(golden.cases.every(c=>formulas.has(c.formula_id))));
check('all material formulas have two cases',()=>{for(const f of registry.formulas.filter(x=>x.golden_case_required)){assert.ok(golden.cases.filter(c=>c.formula_id===f.id).length>=2,f.id)}});
check('authoritative formulas have sources',()=>{for(const f of registry.formulas.filter(x=>x.kind==='AUTHORITATIVE'))assert.ok(f.source_ids.length,f.id)});
check('local policies are explicitly labelled',()=>{for(const f of registry.formulas.filter(x=>x.kind==='LOCAL_POLICY'))assert.ok(f.source_ids.includes('internal_local_policy')&&f.notes_ru.length>0,f.id)});
check('decision rules have boundary cases',()=>{for(const f of registry.formulas.filter(x=>x.kind==='DECISION_RULE'))assert.ok(golden.cases.some(c=>c.formula_id===f.id&&(c.tags||[]).includes('boundary')),f.id)});
check('implementation files and symbols exist',()=>{for(const f of registry.formulas){for(const binding of f.implementation){const [rel,symbol='']=binding.split('::');const full=path.join(ROOT,rel);assert.ok(fs.existsSync(full),binding);const text=fs.readFileSync(full,'utf8');const token=symbol.replace(/\(.*/, '').split('.').pop();assert.ok(!token||text.includes(token),binding)}}});
check('stale protein expectations removed',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/14-protein-formula-tests.js'),'utf8');assert.ok(!s.includes('expected:1.75'));assert.ok(!s.includes("state:'ckd'"));assert.ok(s.includes('NutritionFormulaRegistryP14'))});
check('report builder exposes formula traceability',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/29-report-builder-v5.js'),'utf8');assert.ok(s.includes('Трассировка расчётных формул'));assert.ok(s.includes('formulaAuditHtml'));assert.ok(s.includes('v5.3.210-p1.4-report'))});
check('modern and legacy report builders match',()=>assert.equal(fs.readFileSync(path.join(ROOT,'assets/js/29-report-builder-v5.js'),'utf8'),fs.readFileSync(path.join(ROOT,'assets/legacy/js/29-report-builder-v5.js'),'utf8')));

class FakeClassList{add(){}remove(){}toggle(){return false}contains(){return false}}
class FakeElement{constructor(id=''){this.id=id;this.value='';this.innerHTML='';this.textContent=id==='hei_map'?'{}':'';this.hidden=false;this.open=false;this.checked=false;this.disabled=false;this.style={};this.dataset={};this.classList=new FakeClassList();this.attributes=new Map();this.listeners=new Map();this.options=[];}addEventListener(t,f){if(!this.listeners.has(t))this.listeners.set(t,[]);this.listeners.get(t).push(f)}removeEventListener(){}dispatchEvent(e){e.target=e.target||this;for(const f of this.listeners.get(e.type)||[])f.call(this,e);return true}click(){this.dispatchEvent({type:'click',preventDefault(){},target:this})}setAttribute(n,v){this.attributes.set(n,String(v))}getAttribute(n){return this.attributes.has(n)?this.attributes.get(n):null}removeAttribute(n){this.attributes.delete(n)}appendChild(){}remove(){}focus(){}scrollIntoView(){}querySelector(){return null}querySelectorAll(){return []}closest(){return null}cloneNode(){return new FakeElement(this.id)}get selectedOptions(){return this.options.filter(x=>x.selected)}}
const elements=new Map();const getElement=id=>{if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id)};
const docListeners=new Map();const document={hidden:false,readyState:'complete',body:new FakeElement('body'),documentElement:new FakeElement('html'),head:new FakeElement('head'),getElementById:getElement,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>new FakeElement(),addEventListener(t,f){if(!docListeners.has(t))docListeners.set(t,[]);docListeners.get(t).push(f)},removeEventListener(){},dispatchEvent(e){for(const f of docListeners.get(e.type)||[])f.call(document,e);return true}};
class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}}class Event{constructor(type){this.type=type}}class MutationObserver{observe(){}disconnect(){}}
const storage=new Map(),localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const ctx={console,document,CustomEvent,Event,MutationObserver,localStorage,navigator:{userAgent:'node'},location:{href:'http://localhost/',protocol:'http:'},alert(){},confirm(){return true},print(){},open(){return null},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame(){return 0},cancelAnimationFrame(){},getComputedStyle(){return{}},URL:{createObjectURL(){return'blob:test'},revokeObjectURL(){}},Blob,Math,Date,Number,String,Object,Array,JSON,RegExp,Map,Set,Promise};ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=()=>{};ctx.removeEventListener=()=>{};ctx.dispatchEvent=()=>true;ctx.State={getRegion:()=> 'eu'};ctx.Logger={info(){},warn(){},error(){}};vm.createContext(ctx);
for(const rel of ['assets/data/formula-registry.v5.3.210-p1.4.js','assets/data/normative-registry.v5.3.210-p1.2.js','assets/js/04-needs-norms.js','assets/js/05-protected-modes-v5.3.210.js','assets/js/01-hei-module.js','assets/js/14-protein-formula-tests.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),ctx,{filename:rel});
const qa=ctx.NutritionNeedsFormulaQA,pm=ctx.ProtectedModesP03,hei=ctx.HEI;
check('runtime registry exact JSON',()=>assert.deepEqual(JSON.parse(JSON.stringify(ctx.NutritionFormulaRegistryP14.data)),registry));
check('runtime golden exact JSON',()=>assert.deepEqual(JSON.parse(JSON.stringify(ctx.NutritionFormulaRegistryP14.golden)),golden));
check('needs QA version',()=>assert.equal(qa.version,'v5.3.210-p1.4'));
function close(a,b,t=1e-8){assert.ok(Math.abs(Number(a)-Number(b))<=t,`${a} != ${b}`)}
for(const c of golden.cases){const i=c.inputs,e=c.expected,t=c.tolerance||1e-9;switch(c.formula_id){
case'anthropometry.bmi':check(c.case_id,()=>close(qa.computeBMI(i.height_cm,i.weight_kg),e,t));break;
case'anthropometry.devine_ibw':check(c.case_id,()=>assert.equal(qa.computeIBW(i.sex,i.height_cm),e));break;
case'anthropometry.adjusted_weight':check(c.case_id,()=>close(qa.computeAdjusted(i.ibw_kg,i.actual_weight_kg,i.factor),e,t));break;
case'anthropometry.weight_loss_pct':check(c.case_id,()=>close(qa.computeUnintentionalWeightLossPct(i.previous_weight_kg,i.current_weight_kg),e,t));break;
case'safety.nice_refeeding_screen':check(c.case_id,()=>{const pct=i.weight_loss_pct,prev=100,current=100*(1-pct/100);const o=qa.assessAdultRefeedingRisk({age:i.age,bmi:i.bmi,currentWeight:current,previousWeight:prev,lowIntakeDays:i.low_intake_days,electrolytes:i.electrolytes,additionalFactors:i.additional_factors});assert.equal(o.highRisk,e.highRisk);assert.equal(o.extremeRisk,e.extremeRisk)});break;
case'energy.mifflin_st_jeor':check(c.case_id,()=>close(qa.mifflinBMR(i.sex,i.weight_kg,i.height_cm,i.age_years).bmr,e,t));break;
case'energy.ordinary_pal':check(c.case_id,()=>{const o=qa.energyByMifflinSF('normal',i.sex,i.height_cm,i.weight_kg,i.age_years,i.activity);assert.equal(o.low,e.low);assert.equal(o.high,e.high)});break;
case'energy.weight_screen':check(c.case_id,()=>{const o=qa.energyByWeightMethod(i.state,i.activity,i.weight_kg);assert.equal(o.low,e.low);assert.equal(o.high,e.high)});break;
case'energy.goal_factor':check(c.case_id,()=>close(qa.goalFactorByKey(i.goal),e,t));break;
case'protein.ordinary_target':check(c.case_id,()=>close(qa.proteinPerKgFor(i.state,i.activity,i.age,i.goal,i.weight_kg,i.sex),e,t));break;
case'energy.nasem_adult_female_2023':check(c.case_id,()=>close(pm.adultFemaleTee(i.pal,i.age_years,i.height_cm,i.weight_kg),e,t));break;
case'energy.nasem_pregnancy_2023':check(c.case_id,()=>{const o=pm.pregnancyTee(i.pal,i.age_years,i.height_cm,i.current_weight_kg,i.gestation_week,i.prepreg_weight_kg);assert.equal(o.target,e.target);assert.equal(o.deposition,e.deposition);assert.equal(o.trimester,e.trimester);assert.equal(o.provenance.registryVersion,'v5.3.210-p1.4')});break;
case'energy.nasem_lactation_2023':check(c.case_id,()=>{const o=pm.lactationTee(i.pal,i.age_years,i.height_cm,i.current_weight_kg,i.postpartum_month,i.feeding);assert.equal(o.target,e.target);assert.equal(o.increment,e.increment);assert.equal(o.provenance.registryVersion,'v5.3.210-p1.4')});break;
case'protein.efsa_pregnancy':check(c.case_id,()=>{const o=ctx.NutritionNormativeRegistry.resolveLifeStageProfile({region:'eu',stage:'pregnancy',age:30,sex:'female',gestationWeek:i.gestation_week,prepregWeight:i.prepreg_weight_kg});close(o.protein_g.value,e,.05)});break;
case'protein.efsa_lactation':check(c.case_id,()=>{const o=ctx.NutritionNormativeRegistry.resolveLifeStageProfile({region:'eu',stage:'lactation',age:30,sex:'female',postpartumMonth:i.postpartum_month,currentWeight:i.current_weight_kg});close(o.protein_g.value,e,.05)});break;
case'hei.adequacy_component':check(c.case_id,()=>{const d={fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,dairy:0,protein_total:0,seafood_plant:0,fatty_acids_ratio:1.2,grains_refined:4.3,sodium_g:2,added_sugars_pct:26,sat_fats_pct:16};d[i.component]=i.density;close(hei.scoreFromDensity(d,2000,2000).points[i.component],e,t)});break;
case'hei.moderation_component':check(c.case_id,()=>{const d={fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,dairy:0,protein_total:0,seafood_plant:0,fatty_acids_ratio:1.2,grains_refined:4.3,sodium_g:2,added_sugars_pct:26,sat_fats_pct:16};d[i.component]=i.density;close(hei.scoreFromDensity(d,2000,2000).points[i.component],e,t)});break;
case'hei.fatty_acid_ratio':check(c.case_id,()=>{const d={fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,dairy:0,protein_total:0,seafood_plant:0,fatty_acids_ratio:i.ratio,grains_refined:4.3,sodium_g:2,added_sugars_pct:26,sat_fats_pct:16};close(hei.scoreFromDensity(d,2000,2000).points.fatty_acids_ratio,e,t)});break;
case'hei.total':check(c.case_id,()=>close(i.component_points.reduce((a,b)=>a+b,0),e,t));break;
}}
check('current protein diagnostic passes',()=>assert.equal(ctx.runP14ProteinFormulaTests(),true));
check('HEI exposes formula audit',()=>{const d={fruits_total:.8,fruits_whole:.4,vegetables_total:1.1,greens_beans:.2,grains_whole:1.5,dairy:1.3,protein_total:2.5,seafood_plant:.8,fatty_acids_ratio:2.5,grains_refined:1.8,sodium_g:1.1,added_sugars_pct:6.5,sat_fats_pct:8};const o=hei.scoreFromDensity(d,2000,2000);assert.equal(o.total,100);assert.equal(o.formulaAudit.registryVersion,'v5.3.210-p1.4')});
console.log(JSON.stringify({ok:true,assertions,formulas:registry.formulas.length,golden_cases:golden.cases.length},null,2));
