import assert from "node:assert/strict";
import { originalAnatomyName } from "./anatomy-model-names.js";
import { muscleReferenceFor } from "./muscle-reference-data.js";

const parent = { name: "Infraspinatus_muscle_l", parent: null };
const primitive = { name: "Infraspinatus_muscle_l_0", parent };
const parser = {
  json: { nodes: [{ name: "Infraspinatus muscle.l", mesh: 4 }] },
  associations: new Map([[parent, { nodes: 0 }], [primitive, { meshes: 4, primitives: 0 }]]),
};
assert.equal(originalAnatomyName(primitive, parser), "Infraspinatus muscle.l");
assert.equal(muscleReferenceFor(originalAnatomyName(primitive, parser)).id, "infraspinatus");
// A regional/group ancestor must never supply a different mesh's identity.
parser.json.nodes[0].mesh = 5;
assert.equal(originalAnatomyName(primitive, parser), "Infraspinatus muscle l 0");
assert.equal(originalAnatomyName({ name: "Axillary_nerve.l", userData: { name: "Axillary nerve.l" } }), "Axillary nerve.l");
console.log("GLTF anatomy names: raw owning node + multi-primitive groups + guarded fallback ok");
