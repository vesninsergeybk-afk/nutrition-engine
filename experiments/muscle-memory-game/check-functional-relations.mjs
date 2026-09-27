import {
  functionalRelationsCoverage,
  functionalRelationsForStructure,
} from "./reference-data/functional-relations.js";
import { REFERENCE_REGIONS } from "./reference-data/regions/index.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const structures = REFERENCE_REGIONS.flatMap((region) => region.structures || []);
const ids = new Set(structures.map((structure) => structure.id));
const coverage = functionalRelationsCoverage();

assert(
  coverage.canonicalStructures === structures.length,
  "Functional relation index does not cover the canonical reference database"
);
assert(
  coverage.structuresWithFunctionalRelations >= 30,
  "Too few structures received movement-specific functional relations"
);
assert(
  coverage.movementClasses >= 20,
  "Functional movement vocabulary is unexpectedly small"
);

for (const structure of structures) {
  const rows = functionalRelationsForStructure(structure.id);
  for (const row of rows) {
    assert(Boolean(row.movementRu), structure.id + ": relation has no movement label");
    for (const item of [...row.synergists, ...row.antagonists]) {
      assert(ids.has(item.id), structure.id + ": relation points to unknown structure " + item.id);
      assert(item.id !== structure.id, structure.id + ": relation points to itself");
      assert(Boolean(item.nameRu), structure.id + ": related structure has no Russian name");
    }
    const synergistIds = new Set(row.synergists.map(item => item.id));
    for (const antagonist of row.antagonists) {
      assert(
        !synergistIds.has(antagonist.id),
        structure.id + ": " + antagonist.id + " is both synergist and antagonist for " + row.movementId
      );
    }
  }
}

console.log(
  "Functional relations:",
  coverage.structuresWithFunctionalRelations +
    "/" +
    coverage.canonicalStructures +
    " structures across " +
    coverage.movementClasses +
    " movement classes"
);
