import { readFile } from "node:fs/promises";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import { bodyPartsMuscleNameRu } from "./bodyparts4-muscles-ru.js";

const root = new URL("./", import.meta.url);
const coverage = JSON.parse(await readFile(new URL("bodyparts-muscle-coverage.json", root), "utf8"));
const supplements = await readFile(new URL("bodyparts-supplements.js", root), "utf8");
const app = await readFile(new URL("app.js", root), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  coverage.counts.v3MirrorMuscleMeshes === 293,
  "Historical BodyParts3D 3.0 muscle tree count changed unexpectedly"
);
assert(
  coverage.counts.v3MirrorFmaIdsMissingFromV4AnySystem === 49,
  "The corrected 3.0 -> 4.0 FMA gap count changed unexpectedly"
);
assert(
  coverage.counts.confirmedMissingUnion === 65,
  "Confirmed missing-union count must include the independent facial pack"
);
assert(
  coverage.counts.restoredInTrainer === 65 && coverage.counts.unresolved === 0,
  "Every confirmed missing BodyParts3D muscle must have a registered supplement"
);
assert(
  supplements.includes("BODYPARTS_V3_FOOT_REGISTRATION") &&
    supplements.includes("fittedBoneCenterRmsMm") &&
    supplements.includes("BODYPARTS_FOOT_OBJ_SUPPLEMENTS"),
  "Foot-specific registration or the last two foot muscles are missing"
);
assert(
  app.includes("loadBodyPartsTrunkSupplements") &&
    app.includes("loadBodyPartsFaceSupplements") &&
    app.includes("loadBodyPartsFootSupplements"),
  "One of the registered BodyParts3D supplement loaders is disconnected"
);
assert(
  !supplements.includes("BODYPARTS_UNVALIDATED_REGIONAL_SUPPLEMENTS"),
  "Validated foot supplements are still marked as unvalidated"
);

const untranslatedRestored = coverage.restored.filter(
  (item) => !bodyPartsMuscleNameRu(item.name)
);
assert(
  untranslatedRestored.length === 0,
  "Restored BodyParts3D muscles missing Russian names: " +
    untranslatedRestored.map((item) => item.name).join(", ")
);
assert(
  bodyPartsMuscleNameRu("Right tensor fasciae latae") &&
    bodyPartsMuscleNameRu("Left tensor fasciae latae"),
  "Tensor fasciae latae is rendered as muscle but has no Russian user-facing name"
);

assert(
  bodyPartsAnatomyKind({
    conceptId: "FMA22425",
    system: "connective",
    name: "Right tensor fasciae latae",
  }) === "muscle" &&
  bodyPartsAnatomyKind({
    conceptId: "FMA22426",
    system: "connective",
    name: "Left tensor fasciae latae",
  }) === "muscle",
  "Tensor fasciae latae is present in v4 but still excluded from the rendered muscle layer"
);

console.log("BodyParts3D muscle restoration: 65/65 confirmed geometry gaps covered");
console.log("BodyParts3D v4 mis-tagged tensor fasciae latae restored to the muscle layer");
console.log("Corrected v3 mirror gap: 49 FMA IDs missing from v4 across all systems");
