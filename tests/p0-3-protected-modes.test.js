#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeClassList {
  add() {}
  remove() {}
  toggle() { return false; }
  contains() { return false; }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.innerHTML = '';
    this.textContent = '';
    this.hidden = false;
    this.open = false;
    this.checked = false;
    this.disabled = false;
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.listeners = new Map();
    this.options = [];
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener() {}
  dispatchEvent(event) {
    event.target = event.target || this;
    for (const fn of this.listeners.get(event.type) || []) fn.call(this, event);
    return true;
  }
  click() { this.dispatchEvent({ type: 'click', preventDefault() {}, target: this }); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild() {}
  remove() {}
  focus() {}
  scrollIntoView() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  cloneNode() { return new FakeElement(this.id); }
  get selectedOptions() { return this.options.filter((x) => x.selected); }
}

const elements = new Map();
const getElement = (id) => {
  if (!elements.has(id)) elements.set(id, new FakeElement(id));
  return elements.get(id);
};
const documentListeners = new Map();
const document = {
  hidden: false,
  readyState: 'complete',
  body: new FakeElement('body'),
  documentElement: new FakeElement('html'),
  getElementById: getElement,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => new FakeElement(),
  addEventListener(type, fn) {
    if (!documentListeners.has(type)) documentListeners.set(type, []);
    documentListeners.get(type).push(fn);
  },
  removeEventListener() {},
  dispatchEvent(event) {
    for (const fn of documentListeners.get(event.type) || []) fn.call(document, event);
    return true;
  }
};

class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}
class Event { constructor(type) { this.type = type; } }
class MutationObserver { observe() {} disconnect() {} }

const localStorageMap = new Map();
const localStorage = {
  getItem: (k) => localStorageMap.has(k) ? localStorageMap.get(k) : null,
  setItem: (k, v) => localStorageMap.set(k, String(v)),
  removeItem: (k) => localStorageMap.delete(k)
};

const context = {
  console,
  document,
  CustomEvent,
  Event,
  MutationObserver,
  localStorage,
  navigator: { userAgent: 'node-test' },
  location: { href: 'http://localhost/', protocol: 'http:' },
  alert: () => {},
  confirm: () => true,
  print: () => {},
  open: () => null,
  setTimeout: () => 0,
  clearTimeout: () => {},
  setInterval: () => 0,
  clearInterval: () => {},
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  getComputedStyle: () => ({}),
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
  Blob,
  Math,
  Date,
  Number,
  String,
  Object,
  Array,
  JSON,
  RegExp,
  Map,
  Set,
  Promise
};
context.window = context;
context.globalThis = context;
context.window.addEventListener = () => {};
context.window.removeEventListener = () => {};
context.window.dispatchEvent = () => true;
context.window.State = { getRegion: () => 'us' };
context.window.Logger = { info() {}, warn() {}, error() {} };

vm.createContext(context);
const normativeSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'data', 'normative-registry.v5.3.210-p1.2.js'), 'utf8');
vm.runInContext(normativeSource, context, { filename: 'normative-registry.v5.3.210-p1.2.js' });
const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', '04-needs-norms.js'), 'utf8');
vm.runInContext(source, context, { filename: '04-needs-norms.js' });
const protectedSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', '05-protected-modes-v5.3.210.js'), 'utf8');
vm.runInContext(protectedSource, context, { filename: '05-protected-modes-v5.3.210.js' });

const qa = context.window.NutritionNeedsFormulaQA;
const protectedApi = context.window.ProtectedModesP03;
assert.ok(qa, 'QA API must be exposed');
assert.ok(protectedApi, 'Protected modes API must be exposed');
assert.equal(protectedApi.evidence.nasem_energy_2023.doi,'10.17226/26818');
assert.equal(protectedApi.evidence.nice_maternal_2025.id,'NG247');

function setValues(values) {
  for (const [id, value] of Object.entries(values)) getElement(id).value = String(value);
}
function baseValues(overrides = {}) {
  setValues({
    needs_sex: 'male', needs_h: 180, needs_w: 45, needs_age: 35,
    needs_state: 'normal', needs_activity: 'low', needs_edema: 'no',
    needs_goal: 'gain', needs_diet_style: 'mixed', needs_guardrail: 'none',
    needs_protein_manual: '', needs_prev_w: '', needs_low_intake_days: '',
    needs_electrolytes: 'normal', needs_refeeding_factors: 'no', needs_calc_w_manual: '',
    needs_split: '4|25,35,30,10', needs_gestation_week:'', needs_prepreg_w:'', needs_fetus_count:'singleton', needs_pregnancy_complications:'unknown', needs_postpartum_month:'', needs_lactation_feeding:'unknown', needs_clinical_energy_manual:'', 'normInput-kcal': 9999,
    'normInput-protein_g': 9999, 'normInput-fat_g': 9999, 'normInput-carbs_g': 9999
  });
  getElement('needs_clinical_targets_confirmed').checked = false;
  getElement('needs_additional_ed_risk').checked = false;
  getElement('needs_additional_medical_restriction').checked = false;
  setValues(overrides);
  getElement('needs_out').innerHTML = '';
  context.window.__lastNeedsMeta = null;
}
function calculate() {
  getElement('needs_calc_btn').click();
  return context.window.__lastNeedsMeta;
}

// P0.3.2 safety-correction regression suite.
function setValues(values) { for (const [id, value] of Object.entries(values)) getElement(id).value = String(value); }
function baseValues(overrides = {}) {
  setValues({
    needs_sex:'male', needs_h:180, needs_w:70, needs_age:35,
    needs_state:'normal', needs_activity:'low', needs_nasem_pal:'unknown', needs_edema:'no', needs_goal:'maintain',
    needs_diet_style:'mixed', needs_guardrail:'none', needs_protein_manual:'', needs_prev_w:'', needs_low_intake_days:'',
    needs_electrolytes:'normal', needs_refeeding_factors:'no', needs_calc_w_manual:'', needs_split:'4|25,35,30,10',
    needs_gestation_week:'', needs_prepreg_w:'', needs_fetus_count:'unknown', needs_pregnancy_complications:'unknown',
    needs_postpartum_month:'', needs_lactation_feeding:'unknown', needs_clinical_energy_manual:'', needs_clinical_reference_weight:'',
    needs_clinical_confirmed_by:'', needs_clinical_confirmed_role:'unknown', needs_clinical_confirmed_at:'', needs_clinical_review_due_at:'',
    needs_clinical_source_method:'', needs_clinical_phase:'unknown', needs_clinical_route:'unknown', needs_clinical_source_note:'',
    'normInput-kcal':9999, 'normInput-protein_g':9999, 'normInput-fat_g':9999, 'normInput-carbs_g':9999
  });
  for (const id of ['needs_clinical_targets_confirmed','needs_additional_ed_risk','needs_additional_medical_restriction','needs_additional_clinical_conditions']) getElement(id).checked=false;
  setValues(overrides);
  getElement('needs_out').innerHTML=''; context.window.__lastNeedsMeta=null; context.window.__lastPersonalNeedsProfile=null; context.window.__lastNeedsProfileApplied=false;
}
function calculate(){ getElement('needs_calc_btn').click(); return context.window.__lastNeedsMeta; }
function localIso(d=new Date()){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function todayIso(){ return localIso(new Date()); }
function addDaysIso(days){ const d=new Date(); d.setDate(d.getDate()+days); return localIso(d); }
function validClinical(overrides={}){
  baseValues(Object.assign({
    needs_state:'icu', needs_clinical_energy_manual:1800, needs_protein_manual:90, needs_clinical_reference_weight:65,
    needs_clinical_confirmed_by:'Dr Test', needs_clinical_confirmed_role:'physician', needs_clinical_confirmed_at:todayIso(),
    needs_clinical_review_due_at:addDaysIso(30), needs_clinical_source_method:'indirect calorimetry and clinical prescription',
    needs_clinical_phase:'acute_early', needs_clinical_route:'enteral', needs_clinical_source_note:'test target'
  },overrides));
  getElement('needs_clinical_targets_confirmed').checked=true;
}
let cases=0; const check=(fn)=>{fn();cases++;};

check(()=>{ assert.equal(protectedApi.version,'v5.3.210-p0.3.2.1'); assert.equal(protectedApi.evidence.nasem_energy_2023.doi,'10.17226/26818'); });
check(()=>{ assert.equal(qa.computeIBW('male',151),null); assert.equal(qa.computeIBW('male',152),50); });

// Clinical states are truly external-target-only.
for (const state of ['preop','postop','icu','ckd','dialysis','oncology']) {
  check(()=>{
    baseValues({needs_state:state}); const meta=calculate();
    assert.equal(meta && meta.protectedPolicy && meta.protectedPolicy.calculationAllowed,false, state+' must not calculate without an external target');
    assert.match(getElement('needs_out').innerHTML,/внешн|остановлен/i);
    const policy=protectedApi.evaluate({state,age:35});
    assert.equal(policy.externalTargetOnly,true); assert.equal(policy.calculationAllowed,false);
  });
}
check(()=>{
  baseValues({needs_state:'icu',needs_clinical_energy_manual:1800,needs_protein_manual:90});
  getElement('needs_clinical_targets_confirmed').checked=true;
  { const blocked=calculate(); assert.equal(blocked.protectedPolicy.calculationAllowed,false); } assert.match(getElement('needs_out').innerHTML,/расчётную|источник|подтверд/i);
});
check(()=>{
  validClinical(); const meta=calculate(); assert.ok(meta);
  assert.equal(meta.method,'clinical_external'); assert.equal(meta.externalClinicalTargetApplied,true);
  assert.equal(meta.energyTarget,1800); assert.equal(meta.totalProtein,90); assert.equal(meta.usedWeight,65); assert.equal(meta.weightChoice,'clinical_reference');
  assert.equal(meta.fatGrams,null); assert.equal(meta.carbGrams,null); assert.equal(meta.fluidMl,null); assert.equal(meta.meals.length,0); assert.equal(meta.pRange,null);
  assert.equal(meta.normsSyncAllowed,false); assert.equal(meta.automaticPlannerAllowed,false); assert.equal(meta.geminiAllowed,false);
  assert.equal(Object.keys(meta.personalProfile.targetMeta).filter(k=>!k.startsWith('_')).sort().join(','),'kcal,protein_g');
  assert.match(getElement('needs_out').innerHTML,/не рассчитываются автоматически/i);
  assert.doesNotMatch(getElement('needs_out').innerHTML,/22\s*ккал\/кг|1[,.]2[–-]1[,.]3/i);
});
check(()=>{
  validClinical({needs_clinical_review_due_at:'2020-01-01'}); { const blocked=calculate(); assert.equal(blocked.protectedPolicy.calculationAllowed,false); } assert.match(getElement('needs_out').innerHTML,/истёк/i);
});
check(()=>{
  validClinical(); getElement('needs_additional_clinical_conditions').checked=true; { const blocked=calculate(); assert.equal(blocked.protectedPolicy.calculationAllowed,false); } assert.match(getElement('needs_out').innerHTML,/clinicalContexts/i);
});

// Source-level guard: obsolete generic clinical corridors cannot silently return.
check(()=>{
  const core=fs.readFileSync(path.join(__dirname,'..','assets','js','04-needs-norms.js'),'utf8');
  for(const token of ["icu:      { teeAdj","ckd:      { teeAdj","dialysis: { teeAdj","oncology: { teeAdj","preop:    { teeAdj","postop:   { teeAdj"]) assert.equal(core.includes(token),false,token);
  for(const token of ['kcalPerKg:22','kcalPerKg:30, pRange:[1.0,1.2]']) assert.equal(core.includes(token),false,token);
});

// Life-stage inputs fail closed until explicit clinical facts are selected.
check(()=>{
  baseValues({needs_sex:'female',needs_guardrail:'pregnancy',needs_h:165,needs_w:70,needs_age:30,needs_gestation_week:24,needs_prepreg_w:60,needs_pregnancy_complications:'none'});
  { const blocked=calculate(); assert.equal(blocked.protectedPolicy.calculationAllowed,false); } assert.match(getElement('needs_out').innerHTML,/число плодов|категорию активности NASEM/i);
});
check(()=>{
  baseValues({needs_sex:'female',needs_guardrail:'pregnancy',needs_h:165,needs_w:70,needs_age:30,needs_nasem_pal:'low_active',needs_gestation_week:24,needs_prepreg_w:60,needs_fetus_count:'singleton',needs_pregnancy_complications:'none'});
  const meta=calculate(); assert.ok(meta); assert.equal(meta.method,'life_stage'); assert.equal(meta.lifeStageTargets.sodium_mg.value,1500);
  assert.equal(meta.lifeStageTargets._verifiedKeys.length,26); assert.equal(meta.lifeStageTargets._lifeStage.completeness,'tracked_dri_complete');
  assert.equal(Object.keys(meta.lifeStageTargets._coverage).length,26); assert.ok(Object.values(meta.lifeStageTargets._coverage).every(x=>x.status==='verified'));
});
check(()=>{
  baseValues({needs_sex:'female',needs_guardrail:'lactation',needs_h:165,needs_w:62,needs_age:31,needs_nasem_pal:'low_active',needs_postpartum_month:3,needs_lactation_feeding:'exclusive'});
  const meta=calculate(); assert.ok(meta); assert.equal(meta.lifeStageTargets.sodium_mg.value,1500); assert.equal(meta.lifeStageTargets._verifiedKeys.length,26);
});
check(()=>{
  const p=protectedApi.pregnancyTargets({region:'eu',age:30,currentWeight:70,prepregWeight:60,gestationWeek:24});
  assert.equal(p._verifiedKeys.length,5); assert.equal(p._lifeStage.completeness,'verified_subset'); assert.equal(Object.keys(p._coverage).length,26);
});

// NASEM PAL is separate from the ordinary activity selector.
check(()=>{ assert.equal(protectedApi.adultFemaleTee('low',30,165,60),null); assert.ok(protectedApi.adultFemaleTee('low_active',30,165,60)>0); });
check(()=>{ assert.equal(protectedApi.pregnancyTee('low_active',30,165,70,24,60).target,2711); });
check(()=>{ assert.equal(protectedApi.lactationTee('low_active',31,165,62,3,'exclusive').increment,404); });

// Ordinary and low-weight safety paths remain available.
check(()=>{ baseValues(); const meta=calculate(); assert.ok(meta); assert.notEqual(meta.method,'clinical_external'); assert.equal(meta.normsSyncAllowed,true); });
check(()=>{ baseValues({needs_w:45,needs_goal:'gain'}); const meta=calculate(); assert.ok(meta); assert.equal(meta.usedWeight,45); assert.equal(meta.refeedingRisk.level,'extreme'); assert.equal(meta.goalFactor,1); assert.equal(meta.fluidMl,null); });


// Every declared clinical state accepts the same complete target contract and never adds its own corridor.
for (const state of ['preop','postop','icu','ckd','dialysis','oncology']) {
  check(()=>{
    validClinical({needs_state:state}); const meta=calculate(); assert.ok(meta); assert.equal(meta.method,'clinical_external');
    assert.equal(meta.energyTarget,1800); assert.equal(meta.totalProtein,90); assert.equal(meta.usedWeight,65);
  });
}
// Each provenance field is mandatory.
for (const [field,value,pattern] of [
  ['needs_clinical_confirmed_by','',/имя|идентификатор/i],
  ['needs_clinical_confirmed_role','unknown',/роль/i],
  ['needs_clinical_confirmed_at','',/дату подтверждения/i],
  ['needs_clinical_confirmed_at',addDaysIso(1),/будущем/i],
  ['needs_clinical_review_due_at','',/дату обязательного пересмотра/i],
  ['needs_clinical_source_method','x',/источник|метод/i],
  ['needs_clinical_phase','unknown',/фазу/i],
  ['needs_clinical_route','unknown',/путь питания/i],
  ['needs_clinical_reference_weight','',/расчётную|сухую массу/i]
]) {
  check(()=>{
    validClinical({[field]:value}); const blocked=calculate(); assert.equal(blocked.protectedPolicy.calculationAllowed,false); assert.match(getElement('needs_out').innerHTML,pattern);
  });
}

console.log(JSON.stringify({status:'PASS',cases,release:'v5.3.210-p0.3.2.1',mode:'independently revalidated protected modes'},null,2));
