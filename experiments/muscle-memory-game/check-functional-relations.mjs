import { functionalPartForModelName } from "./reference-data/functional-parts.js";
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

for (const [structureId, expectedMovementId] of [
  ["levator-ani", "pelvic-floor-support"],
  ["puborectalis", "anal-continence"],
  ["pubococcygeus", "pelvic-floor-support"],
  ["iliococcygeus", "pelvic-floor-support"],
  ["coccygeus", "pelvic-floor-support"],
]) {
  const rows = functionalRelationsForStructure(structureId);
  assert(rows.length > 0, structureId + ": pelvic-floor functional relations are missing");
  assert(
    rows.some(row => row.movementId === expectedMovementId),
    structureId + ": expected pelvic-floor relation is missing"
  );
  assert(
    rows.some(row => row.method === "curated-from-verified-pelvic-floor-function"),
    structureId + ": pelvic-floor relations must remain explicitly curated"
  );
}

const puborectalisContinence = functionalRelationsForStructure("puborectalis")
  .find(row => row.movementId === "anal-continence");
assert(
  puborectalisContinence?.synergists?.some(item => item.id === "external-anal-sphincter"),
  "Puborectalis continence relation must include the external anal sphincter as a verified synergist"
);
assert(
  puborectalisContinence?.antagonists?.length === 0 &&
    /антагонист/i.test(puborectalisContinence?.noteRu || ""),
  "Puborectalis card must not invent a direct antagonist and must explain why"
);

for (const structure of structures) {
  const rows = functionalRelationsForStructure(structure.id);
  for (const row of rows) {
    assert(Boolean(row.movementRu), structure.id + ": relation has no movement label");
    for (const item of [
      ...row.synergists,
      ...row.antagonists,
      ...(row.contextDependent || []),
    ]) {
      assert(ids.has(item.id), structure.id + ": relation points to unknown structure " + item.id);
      assert(item.id !== structure.id || (item.partId && row.subjectPartId && item.partId !== row.subjectPartId), structure.id + ": relation points to the same functional unit");
      assert(Boolean(item.nameRu), structure.id + ": related structure has no Russian name");
    }

    const synergistIds = new Set(row.synergists.map(item => item.id + "::" + (item.partId || "")));
    const antagonistIds = new Set(row.antagonists.map(item => item.id + "::" + (item.partId || "")));
    const contextIds = new Set((row.contextDependent || []).map(item => item.id + "::" + (item.partId || "")));

    for (const antagonist of row.antagonists) {
      assert(
        !synergistIds.has(antagonist.id + "::" + (antagonist.partId || "")),
        structure.id + ": " + antagonist.id + " is both synergist and antagonist for " + row.movementId
      );
    }
    for (const contextId of contextIds) {
      assert(
        !synergistIds.has(contextId) && !antagonistIds.has(contextId),
        structure.id + ": context-dependent role leaked into a fixed role for " + row.movementId
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

const trapezius = functionalRelationsForStructure("trapezius");
const lowerDepression = trapezius.find(row => row.subjectPartId === "lower" && row.movementId === "scapula-depression");
assert(lowerDepression?.antagonists.some(item => item.id === "trapezius" && item.partId === "upper"), "Lower trapezius must oppose upper trapezius for shoulder-girdle depression");
const lowerRotation = trapezius.find(row => row.subjectPartId === "lower" && row.movementId === "scapula-upward-rotation");
assert(lowerRotation?.synergists.some(item => item.id === "trapezius" && item.partId === "upper"), "Upper and lower trapezius must cooperate for upward rotation");
assert(!lowerRotation?.antagonists.some(item => item.id === "trapezius"), "Trapezius parts are not antagonists for upward rotation");
const deltoid = functionalRelationsForStructure("deltoid");
assert(deltoid.some(row => row.subjectPartId === "anterior" && row.antagonists.some(item => item.id === "deltoid" && item.partId === "posterior")), "Anterior and posterior deltoid roles must be separate");

const middleAbduction = deltoid.find(row => row.subjectPartId === "middle" && row.movementId === "shoulder-abduction");
assert(middleAbduction.synergists.some(item => item.id === "supraspinatus"), "Inflected wording must retain supraspinatus as an abduction synergist");
const posteriorRotation = deltoid.find(row => row.subjectPartId === "posterior" && row.movementId === "shoulder-external-rotation");
assert(posteriorRotation.synergists.some(item => item.id === "infraspinatus"), "External rotation wording must retain infraspinatus");
assert(lowerDepression.synergists.some(item => item.id === "pectoralis-minor"), "Verified downward scapular pull must retain pectoralis minor");

for (const side of ["l", "r"]) {
  assert(functionalPartForModelName("trapezius", "Ascending part of trapezius muscle." + side) === "upper", "Pinned Z-Anatomy upper geometry has a reversed source name");
  assert(functionalPartForModelName("trapezius", "Descending part of trapezius muscle." + side) === "lower", "Pinned Z-Anatomy lower geometry has a reversed source name");
}
assert(functionalPartForModelName("trapezius", "Ascending part of right trapezius muscle") === "lower", "Source correction must not reverse standard anatomical naming");
