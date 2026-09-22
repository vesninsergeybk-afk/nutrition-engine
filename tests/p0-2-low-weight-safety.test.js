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
const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', '04-needs-norms.js'), 'utf8');
vm.runInContext(source, context, { filename: '04-needs-norms.js' });

const qa = context.window.NutritionNeedsFormulaQA;
assert.ok(qa, 'QA API must be exposed');

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
    needs_split: '4|25,35,30,10', 'normInput-kcal': 9999,
    'normInput-protein_g': 9999, 'normInput-fat_g': 9999, 'normInput-carbs_g': 9999
  });
  setValues(overrides);
  getElement('needs_out').innerHTML = '';
  context.window.__lastNeedsMeta = null;
}
function calculate() {
  getElement('needs_calc_btn').click();
  return context.window.__lastNeedsMeta;
}

// Formula boundary and risk classification.
assert.equal(qa.computeIBW('male', 151), null);
assert.equal(qa.computeIBW('male', 152), 50);
assert.equal(qa.computeIBW('female', 152), 45.5);
assert.equal(qa.computeUnintentionalWeightLossPct(50, 45), 10);

const extreme = qa.assessAdultRefeedingRisk({
  age: 35, bmi: 13.9, currentWeight: 45, electrolytes: 'normal', additionalFactors: 'no'
});
assert.equal(extreme.level, 'extreme');
assert.equal(extreme.highRisk, true);
assert.equal(extreme.normsSyncAllowed, false);
assert.equal(extreme.automaticPlannerAllowed, false);

const twoMinor = qa.assessAdultRefeedingRisk({
  age: 35, bmi: 17.5, currentWeight: 50, previousWeight: 56, lowIntakeDays: 0,
  electrolytes: 'normal', additionalFactors: 'no'
});
assert.equal(twoMinor.highRisk, true, 'BMI <18.5 plus >10% loss must trigger high risk');

const oneMinor = qa.assessAdultRefeedingRisk({
  age: 35, bmi: 17.5, currentWeight: 50, previousWeight: 52, lowIntakeDays: 0,
  electrolytes: 'normal', additionalFactors: 'no'
});
assert.equal(oneMinor.highRisk, false);
assert.equal(oneMinor.malnutritionScreenPositive, true);

// Exact user case: actual weight is preserved and goal factor is neutralized.
baseValues();
let meta = calculate();
assert.ok(meta, 'Extreme low-weight case must still calculate an estimate');
assert.equal(meta.usedWeight, 45);
assert.equal(meta.weightChoice, 'actual');
assert.equal(meta.refeedingRisk.level, 'extreme');
assert.equal(meta.goalFactor, 1);
assert.equal(meta.normsSyncAllowed, false);
assert.equal(meta.automaticPlannerAllowed, false);
assert.equal(getElement('normInput-kcal').value, '9999', 'High-risk estimates must not overwrite global norms');
assert.match(getElement('needs_out').innerHTML, /не стартовая схема/i);
assert.equal(meta.personalProfile.priorities.some((x) => x.key === 'gain_quality'), false);
assert.equal(meta.personalProfile.priorities[0].key, 'refeeding_safety_gate');
assert.equal(meta.personalProfile.targetMeta.kcal.basis, 'оценка полной потребности; не стартовая схема питания');

// Moderate stable underweight remains usable with actual weight and ordinary norm sync.
baseValues({ needs_w: 55, needs_goal: 'maintain' });
meta = calculate();
assert.ok(meta);
assert.equal(meta.usedWeight, 55);
assert.equal(meta.weightChoice, 'actual');
assert.equal(meta.refeedingRisk.highRisk, false);
assert.equal(meta.refeedingRisk.malnutritionScreenPositive, true);
assert.equal(meta.normsSyncAllowed, true);
assert.notEqual(getElement('normInput-kcal').value, '9999');

// Auto-applied norms from a previous ordinary profile must be removed on transition to high risk, while a manual override is preserved.
baseValues({ needs_w: 70, needs_goal: 'maintain' });
meta = calculate();
assert.ok(meta);
const autoKcal = getElement('normInput-kcal').value;
assert.notEqual(autoKcal, '');
setValues({ needs_w: 45, needs_goal: 'gain' });
meta = calculate();
assert.ok(meta);
assert.equal(getElement('normInput-kcal').value, '', 'Stale automatically synchronized norms must be cleared');

baseValues({ needs_w: 70, needs_goal: 'maintain' });
meta = calculate();
assert.ok(meta);
getElement('normInput-kcal').value = '2500'; // deliberate manual edit after auto-sync
setValues({ needs_w: 45, needs_goal: 'gain' });
meta = calculate();
assert.ok(meta);
assert.equal(getElement('normInput-kcal').value, '2500', 'A manual norm edit must not be erased by the safety gate');

// Low BMI input automatically reveals the safety screen.
getElement('needsLowWeightSafety').open = false;
setValues({ needs_h: 180, needs_w: 45 });
getElement('needs_w').dispatchEvent({ type: 'input', target: getElement('needs_w') });
assert.equal(getElement('needsLowWeightSafety').open, true);

// Low BMI plus edema/complex renal context requires an explicit dry/calculation weight.
baseValues({ needs_edema: 'yes', needs_goal: 'maintain' });
meta = calculate();
assert.equal(meta, null);
assert.match(getElement('needs_out').innerHTML, /расчётную\/сухую массу/i);

baseValues({ needs_edema: 'yes', needs_calc_w_manual: 43, needs_goal: 'maintain' });
meta = calculate();
assert.ok(meta);
assert.equal(meta.usedWeight, 43);
assert.equal(meta.weightChoice, 'manual');
assert.equal(meta.normsSyncAllowed, false);

console.log(JSON.stringify({
  status: 'PASS',
  cases: 14,
  userCase: {
    heightCm: 180,
    actualWeightKg: 45,
    bmi: 13.9,
    calculationWeightKg: 45,
    riskLevel: 'extreme',
    normsSyncAllowed: false,
    automaticPlannerAllowed: false
  }
}, null, 2));
