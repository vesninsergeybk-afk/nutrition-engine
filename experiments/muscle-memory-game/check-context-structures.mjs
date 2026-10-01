import assert from 'node:assert/strict';
import fs from 'node:fs';
import {referenceStructureTerm} from './reference-terms-ru.js';
const manifest = JSON.parse(fs.readFileSync(new URL('./reference-data/context-model-names.json',import.meta.url)));
const unknown = [];
for (const [layer,names] of Object.entries(manifest.layers)) {
  for (const source of names) {
    const term=referenceStructureTerm(source,layer);
    assert.match(term.nameRu, /[А-Яа-яЁё]/u, source);
    if (!term.specific) unknown.push(source);
  }
}
assert.deepEqual(unknown, ['????????','?x.r','?x.l'], 'A named source structure lost its Russian label');
for (const [source,layer,expected] of [
  ['Greater omentum','organs','Большой сальник'],
  ['Left main bronchus','organs','Левый главный бронх'],
  ['Anterior root of spinal nerve.r','nervous','Передний корешок спинномозгового нерва (справа)'],
  ['Cauda equina','nervous','Конский хвост'],
  ['Deep femoral vein.l','vascular','Глубокая вена бедра (слева)'],
  ['Left atrium','vascular','Левое предсердие'],
  ['Anterior circumflex humeral vein.r','vascular','Передняя вена, огибающая плечевую кость (справа)'],
  ['Articular capsule of sternoclavicular joint.l','joints','Капсула грудино-ключичного сустава (слева)'],
  ['Intervertebral disc C2-C3','joints','Межпозвоночный диск C2-C3'],
]) assert.equal(referenceStructureTerm(source,layer).nameRu, expected, source);
assert.equal(manifest.layers.lymphatic.some(name=>/duct|vessel|trunk/i.test(name)),false);
console.log('Context labels: 1951 named objects covered; 3 corrupted source names explicitly marked.');
