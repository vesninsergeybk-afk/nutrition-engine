import assert from 'node:assert/strict';
import fs from 'node:fs';
import { boneTermRu } from './bone-terms-ru.js';
import { boneCardForTerm } from './bone-reference-data.js';
import { SUPPLEMENT_ILLUSTRATIONS, SUPPLEMENT_SOURCES } from './reference-data/supplement-illustrations.js';
import { muscleReferenceFor } from './muscle-reference-data.js';
import { REFERENCE_REGIONS } from './reference-data/regions/index.js';
const names = JSON.parse(fs.readFileSync(new URL('./reference-data/skeleton-model-names.json', import.meta.url)));
assert.equal(names.length, 277, 'Pinned Z-Anatomy skeleton inventory changed');
for (const name of names) {
  const term = boneTermRu(name);
  assert.equal(term.specific, true, name);
  assert.match(term.nameRu, /[А-Яа-яЁё]/, name);
  const card = boneCardForTerm(term);
  assert.ok(card?.descriptionRu && card.latin && card.landmarksRu.length && card.source.url, name);
}
assert.equal(boneTermRu('Scapula.l').nameRu, 'Лопатка (слева)');
assert.equal(boneTermRu('left scapula').nameRu, 'Лопатка (слева)');
assert.equal(boneTermRu('Proximal_phalanx_of_first_finger_of_hand.r').nameRu, 'Проксимальная фаланга I пальца кисти (справа)');
assert.equal(boneTermRu('Costal cartilage of first rib.r').kindRu, 'Хрящ');
assert.equal(boneTermRu('Upper medial incisor.l').kindRu, 'Зуб');
assert.equal(boneTermRu('Sinus of frontal bone.l').kindRu, 'Воздухоносная полость');
assert.match(boneCardForTerm(boneTermRu('Eleventh rib.r')).descriptionRu, /не соединён с грудиной/);
assert.equal(boneTermRu('unknown source object').specific, false);
const structures = new Map(REFERENCE_REGIONS.flatMap(r => r.structures).map(s => [s.id, s]));
for (const image of SUPPLEMENT_ILLUSTRATIONS) {
  assert.ok(SUPPLEMENT_SOURCES[image.sourceId]?.url, image.id);
  assert.ok(['public-domain', 'cc-by-sa-2.1-jp'].includes(image.rightsStatus), image.id);
  assert.ok(image.captionRu && image.altRu, image.id);
  assert.ok(fs.readFileSync(new URL(image.assetPath, import.meta.url)).subarray(0, 4).equals(Buffer.from([137,80,78,71])), image.id);
  for (const id of image.focusStructureIds) assert.ok(structures.has(id), id);
}
console.log('Skeleton: 277 Russian labels and reference cards; illustration assets and source rights OK');

assert.equal(muscleReferenceFor('Anterior papillary muscle of right ventricle').typeRu, 'Сердечная мышца');
assert.deepEqual(muscleReferenceFor('Anterior papillary muscle of right ventricle').functionalRelations, []);
