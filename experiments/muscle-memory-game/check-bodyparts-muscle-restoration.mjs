import { readFile } from "node:fs/promises";

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

console.log("BodyParts3D muscle restoration: 65/65 confirmed gaps covered");
console.log("Corrected v3 mirror gap: 49 FMA IDs missing from v4 across all systems");
