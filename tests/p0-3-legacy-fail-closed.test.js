#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const elements = new Map();
function el(id) {
  if (!elements.has(id)) elements.set(id, {
    id, value: '', checked: false, open: false, className: '', innerHTML: '', parentNode: null
  });
  return elements.get(id);
}
const listeners = {};
const document = {
  readyState: 'complete',
  getElementById: el,
  addEventListener(type, fn, capture) { listeners[type + ':' + !!capture] = fn; }
};
const context = { window: {}, document, String };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'legacy', 'js', '05-protected-modes-v5.3.210.js'), 'utf8'), context);

assert.ok(context.window.ProtectedModesP03);
assert.equal(context.window.ProtectedModesP03.currentPolicy().calculationAllowed, true);
el('needs_guardrail').value = 'pregnancy';
let policy = context.window.ProtectedModesP03.currentPolicy();
assert.equal(policy.status, 'blocked');
assert.equal(policy.calculationAllowed, false);
assert.equal(policy.geminiAllowed, false);

let prevented = false, stopped = false;
const button = el('needs_calc_btn');
listeners['click:true']({
  target: button,
  preventDefault() { prevented = true; },
  stopImmediatePropagation() { stopped = true; }
});
assert.equal(prevented, true);
assert.equal(stopped, true);
assert.match(el('needs_out').innerHTML, /остановлен/i);

el('needs_guardrail').value = 'none';
el('needs_state').value = 'normal';
prevented = false; stopped = false;
listeners['click:true']({ target: button, preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } });
assert.equal(prevented, false);
assert.equal(stopped, false);

console.log(JSON.stringify({status:'PASS', cases:6, mode:'legacy protected profiles fail closed'}, null, 2));
