#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

class FakeClassList{add(){} remove(){} toggle(){return false;} contains(){return false;}}
class FakeElement{
  constructor(id=''){this.id=id;this.value='';this.innerHTML='';this.textContent='';this.hidden=false;this.open=false;this.checked=false;this.disabled=false;this.style={};this.dataset={};this.classList=new FakeClassList();this.attributes=new Map();this.listeners=new Map();this.options=[];}
  addEventListener(t,f){if(!this.listeners.has(t))this.listeners.set(t,[]);this.listeners.get(t).push(f);}
  dispatchEvent(e){e.target=e.target||this;for(const f of this.listeners.get(e.type)||[])f.call(this,e);return true;}
  click(){this.dispatchEvent({type:'click',preventDefault(){},target:this});}
  setAttribute(k,v){this.attributes.set(k,String(v));} getAttribute(k){return this.attributes.get(k)||null;} removeAttribute(k){this.attributes.delete(k);}
  appendChild(){} remove(){} focus(){} scrollIntoView(){} querySelector(){return null;} querySelectorAll(){return [];} closest(){return null;} cloneNode(){return new FakeElement(this.id);} get selectedOptions(){return [];}
}
const elements=new Map(); const get=(id)=>{if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id);};
const docListeners=new Map();
const document={hidden:false,readyState:'complete',body:new FakeElement('body'),documentElement:new FakeElement('html'),getElementById:get,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>new FakeElement(),addEventListener(t,f){if(!docListeners.has(t))docListeners.set(t,[]);docListeners.get(t).push(f);},dispatchEvent(e){for(const f of docListeners.get(e.type)||[])f.call(document,e);return true;}};
class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}} class Event{constructor(type,init={}){this.type=type;this.bubbles=!!init.bubbles;}} class MutationObserver{observe(){} disconnect(){}}
const ctx={console,document,CustomEvent,Event,MutationObserver,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{userAgent:'node-test'},location:{href:'http://localhost/',protocol:'http:'},alert(){},confirm:()=>true,print(){},open:()=>null,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},getComputedStyle:()=>({}),URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob,Math,Date,Number,String,Object,Array,JSON,RegExp,Map,Set,Promise};
ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=()=>{};ctx.removeEventListener=()=>{};ctx.dispatchEvent=()=>true;ctx.State={getRegion:()=> 'us'};ctx.Logger={info(){},warn(){},error(){}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','data','normative-registry.v5.3.210-p1.2.js'),'utf8'),ctx,{filename:'normative-registry.v5.3.210-p1.2.js'});
for(const f of ['04-needs-norms.js','05-protected-modes-v5.3.210.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js',f),'utf8'),ctx,{filename:f});
const api=ctx.ProtectedModesP03; assert.ok(api);
let cases=0; const check=(name,fn)=>{fn();cases++;};
const set=(o)=>Object.entries(o).forEach(([k,v])=>{get(k).value=String(v);});
const localIso=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return localIso(d);};
function resetDom(){
  set({needs_sex:'male',needs_h:180,needs_w:70,needs_age:35,needs_state:'normal',needs_activity:'low',needs_nasem_pal:'unknown',needs_edema:'no',needs_goal:'maintain',needs_diet_style:'mixed',needs_guardrail:'none',needs_protein_manual:'',needs_prev_w:'',needs_low_intake_days:'',needs_electrolytes:'normal',needs_refeeding_factors:'no',needs_calc_w_manual:'',needs_split:'4|25,35,30,10',needs_gestation_week:'',needs_prepreg_w:'',needs_fetus_count:'unknown',needs_pregnancy_complications:'unknown',needs_postpartum_month:'',needs_lactation_feeding:'unknown',needs_clinical_energy_manual:'',needs_clinical_reference_weight:'',needs_clinical_confirmed_by:'',needs_clinical_confirmed_role:'unknown',needs_clinical_confirmed_at:'',needs_clinical_review_due_at:'',needs_clinical_source_method:'',needs_clinical_phase:'unknown',needs_clinical_route:'unknown',needs_clinical_source_note:'','normInput-kcal':'','normInput-protein_g':'','normInput-fat_g':'','normInput-carbs_g':'','normInput-sfa_g':'','normInput-added_sugars_g':''});
  for(const id of ['needs_clinical_targets_confirmed','needs_additional_ed_risk','needs_additional_medical_restriction','needs_additional_clinical_conditions'])get(id).checked=false;
  ctx.__lastNeedsMeta=null;ctx.__lastPersonalNeedsProfile=null;ctx.__lastNeedsProfileApplied=false;ctx.__needsAutoNormSnapshotV53210=null;get('needs_out').innerHTML='';
}
function validTarget(overrides={}){return Object.assign({state:'icu',age:35,clinicalTargetsConfirmed:true,clinicalEnergyManual:1800,clinicalProteinManual:90,clinicalReferenceWeight:65,clinicalConfirmedBy:'Dr Test',clinicalConfirmedRole:'physician',clinicalConfirmedAt:'2026-07-18',clinicalReviewDueAt:'2026-08-17',clinicalSourceMethod:'indirect calorimetry and clinical prescription',clinicalPhase:'acute_early',clinicalRoute:'enteral',validationToday:'2026-07-18'},overrides);}
function fillValidClinical(){resetDom();set({needs_state:'icu',needs_clinical_energy_manual:1800,needs_protein_manual:90,needs_clinical_reference_weight:65,needs_clinical_confirmed_by:'Dr Test',needs_clinical_confirmed_role:'physician',needs_clinical_confirmed_at:localIso(),needs_clinical_review_due_at:addDays(30),needs_clinical_source_method:'indirect calorimetry and clinical prescription',needs_clinical_phase:'acute_early',needs_clinical_route:'enteral'});get('needs_clinical_targets_confirmed').checked=true;}

check('strict impossible date',()=>assert.equal(api.dateValue('2026-02-31'),null));
check('leap date accepted',()=>assert.ok(api.dateValue('2028-02-29')!==null));
check('non-leap rejected',()=>assert.equal(api.dateValue('2027-02-29'),null));
check('valid target',()=>assert.equal(api.validateClinicalTarget(validTarget(),true).valid,true));
check('invalid confirmation date',()=>{const t=api.validateClinicalTarget(validTarget({clinicalConfirmedAt:'2026-02-31'}),true);assert.equal(t.valid,false);assert.ok(t.errors.some(x=>/календарно/.test(x)));});
check('invalid review date',()=>{const t=api.validateClinicalTarget(validTarget({clinicalReviewDueAt:'2026-02-31'}),true);assert.equal(t.valid,false);assert.ok(t.errors.some(x=>/календарно/.test(x)));});
check('future confirmation',()=>assert.equal(api.validateClinicalTarget(validTarget({clinicalConfirmedAt:'2026-07-19'}),true).valid,false));
check('expired review',()=>assert.equal(api.validateClinicalTarget(validTarget({clinicalReviewDueAt:'2026-07-17'}),true).valid,false));
check('366-day horizon accepted',()=>assert.equal(api.validateClinicalTarget(validTarget({clinicalReviewDueAt:'2027-07-19'}),true).valid,true));
check('beyond horizon rejected',()=>{const t=api.validateClinicalTarget(validTarget({clinicalReviewDueAt:'2027-07-20'}),true);assert.equal(t.valid,false);assert.ok(t.errors.some(x=>/366/.test(x)));});
check('old confirmation rejected',()=>{const t=api.validateClinicalTarget(validTarget({clinicalConfirmedAt:'2025-07-16',clinicalReviewDueAt:'2026-07-18'}),true);assert.equal(t.valid,false);assert.ok(t.errors.some(x=>/366/.test(x)));});
for(const [key,value] of [['clinicalConfirmedRole','administrator'],['clinicalPhase','acute'],['clinicalRoute','intravenous_magic']])check('allowlist '+key,()=>assert.equal(api.validateClinicalTarget(validTarget({[key]:value}),true).valid,false));
check('other clinician requires context note',()=>{const t=api.validateClinicalTarget(validTarget({clinicalConfirmedRole:'other_clinician',clinicalSourceNote:''}),true);assert.equal(t.valid,false);assert.ok(t.errors.some(x=>/уточните контекст/.test(x)));});
check('other phase requires context note',()=>{const t=api.validateClinicalTarget(validTarget({clinicalPhase:'other',clinicalSourceNote:''}),true);assert.equal(t.valid,false);assert.ok(t.errors.some(x=>/уточните контекст/.test(x)));});
check('other clinician with note accepted',()=>assert.equal(api.validateClinicalTarget(validTarget({clinicalConfirmedRole:'other_clinician',clinicalSourceNote:'specialist role clarified in local clinical record'}),true).valid,true));
check('blocked status precedence',()=>{const p=api.evaluate({state:'icu',age:35,refeedingHighRisk:true});assert.equal(p.calculationAllowed,false);assert.equal(p.status,'blocked');});
for(const guardrail of ['ed_risk','medical_restriction']) check(guardrail+' blocks without external target',()=>{const p=api.evaluate({state:'normal',guardrail,age:35});assert.equal(p.externalTargetOnly,true);assert.equal(p.calculationAllowed,false);assert.equal(p.status,'blocked');});
check('pregnancy plus ED stays life-stage blocked without demanding external-target mode',()=>{const p=api.evaluate({state:'normal',guardrail:'pregnancy',additionalEdRisk:true,sex:'female',age:30,nasemPal:'low_active',gestationWeek:20,prepregWeight:60,fetusCount:'singleton',pregnancyComplications:'none',height:165,currentWeight:68});assert.equal(p.externalTargetOnly,false);assert.equal(p.calculationAllowed,false);assert.ok(p.errors.some(x=>/РПП/.test(x)));});
check('pregnancy evidence attribution',()=>{const t=api.pregnancyTargets({region:'us',age:30,prepregWeight:60,gestationWeek:24});for(const key of t._verifiedKeys){assert.ok(t._coverage[key].sourceIds.length);assert.ok(t[key].provenance.registryVersion);}});
check('lactation evidence attribution',()=>{const t=api.lactationTargets({region:'us',age:31,currentWeight:62});for(const key of t._verifiedKeys){assert.ok(t._coverage[key].sourceIds.length);assert.ok(t[key].provenance.registryVersion);}});
check('applied profile invalidated on material edit',()=>{
  resetDom();get('needs_calc_btn').click();assert.equal(ctx.__lastNeedsProfileApplied,true);assert.ok(ctx.__lastPersonalNeedsProfile);assert.ok(ctx.__needsAutoNormSnapshotV53210);
  get('needs_guardrail').value='pregnancy';get('needs_guardrail').dispatchEvent(new Event('change'));
  assert.equal(ctx.__lastNeedsProfileApplied,false);assert.equal(ctx.__lastPersonalNeedsProfile,null);assert.equal(ctx.__lastNeedsMeta,null);assert.equal(ctx.__needsAutoNormSnapshotV53210,null);
  assert.match(get('needs_out').innerHTML,/устарел/);assert.equal(get('needs_print_btn').disabled,true);assert.equal(get('needs_pdf_btn').disabled,true);
});
check('blocked recalculation clears prior profile',()=>{
  resetDom();get('needs_calc_btn').click();assert.equal(ctx.__lastNeedsProfileApplied,true);
  get('needs_state').value='icu';get('needs_calc_btn').click();
  assert.equal(ctx.__lastNeedsProfileApplied,false);assert.equal(ctx.__lastPersonalNeedsProfile,null);assert.equal(ctx.__lastNeedsMeta.protectedPolicy.calculationAllowed,false);
});
check('valid clinical edit invalidates atomically',()=>{
  fillValidClinical();get('needs_calc_btn').click();assert.equal(ctx.__lastNeedsProfileApplied,true);assert.equal(ctx.__lastNeedsMeta.method,'clinical_external');assert.equal(get('needs_print_btn').disabled,false);assert.equal(get('needs_pdf_btn').disabled,false);
  get('needs_clinical_reference_weight').value='66';get('needs_clinical_reference_weight').dispatchEvent(new Event('input'));
  assert.equal(ctx.__lastNeedsProfileApplied,false);assert.equal(ctx.__lastPersonalNeedsProfile,null);assert.equal(ctx.__lastNeedsMeta,null);
});
for(const guardrail of ['ed_risk','medical_restriction']) check(guardrail+' applies valid external target',()=>{
  fillValidClinical();get('needs_state').value='normal';get('needs_guardrail').value=guardrail;get('needs_calc_btn').click();
  assert.equal(ctx.__lastNeedsProfileApplied,true);assert.equal(ctx.__lastNeedsMeta.method,'clinical_external');assert.equal(ctx.__lastNeedsMeta.energyTarget,1800);assert.equal(ctx.__lastNeedsMeta.geminiAllowed,false);
});
check('manual norm survives auto clear',()=>{
  resetDom();get('needs_calc_btn').click();const auto=get('normInput-kcal').value;assert.ok(auto);
  get('normInput-kcal').value='2222';get('needs_age').value='36';get('needs_age').dispatchEvent(new Event('input'));
  assert.equal(get('normInput-kcal').value,'2222');
});
check('refeeding safety survives state invalidation',()=>{
  resetDom();get('needs_w').value='45';get('needs_calc_btn').click();assert.equal(ctx.__lastNeedsMeta.refeedingRisk.highRisk,true);
  get('needs_age').value='36';get('needs_age').dispatchEvent(new Event('input'));assert.equal(ctx.__lastNeedsMeta,null);
  const p=api.currentPolicy();assert.equal(p.protectedMode,true);assert.equal(p.geminiAllowed,false);assert.equal(p.automaticPlannerAllowed,false);
});
check('source-level timezone and date guards',()=>{const s=fs.readFileSync(path.join(__dirname,'..','assets','js','05-protected-modes-v5.3.210.js'),'utf8');assert.equal(s.includes('todayUtc'),false);assert.equal(s.includes('Date.parse('),false);assert.ok(s.includes('getFullYear()'));});
check('AI planner clears stale plan on needs invalidation',()=>{const s=fs.readFileSync(path.join(__dirname,'..','assets','js','61-ai-nutrition-planner-v5.3.210.js'),'utf8');assert.ok(s.includes('document.addEventListener("needs:invalidated"'));assert.ok(s.includes('calculationRevision'));assert.ok(s.includes('activeController.abort()'));});
check('render mutation cannot restore norms after invalidation',()=>{const s=fs.readFileSync(path.join(__dirname,'..','assets','js','04-needs-norms.js'),'utf8');assert.ok(s.includes('window.__lastNeedsProfileApplied !== true || !window.__lastNeedsMeta'));});
check('legacy gate precedes needs core',()=>{const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','config','runtime-assets.v5.3.210-pc2.json'),'utf8'));const gate=cfg.legacy_core_scripts.findIndex(x=>x.includes('/05-protected-modes-v5.3.210.js')),core=cfg.legacy_core_scripts.findIndex(x=>x.includes('/04-needs-norms.js'));assert.ok(gate>=0&&core>=0&&gate<core);assert.equal(cfg.legacy_core_scripts.some(x=>x==='./assets/js/05-protected-modes-v5.3.210.js'),false);});

console.log(JSON.stringify({status:'PASS',cases,release:api.version,mode:'independent safety revalidation'},null,2));
