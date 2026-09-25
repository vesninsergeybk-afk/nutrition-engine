import {
  buildMuscleCatalog,
  learningSummary,
  loadLearningStore,
  recordLearningAttempt,
  regionCounts,
} from "./learning-engine.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";

const ATLAS_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await fetch(ATLAS_URL);
assert(response.ok, "Could not fetch pinned BodyParts3D atlas");
const atlas = await response.json();

const muscleParts = atlas.parts.filter((part) => bodyPartsAnatomyKind(part) === "muscle");
assert(muscleParts.length === 416, "Unexpected muscle mesh count: " + muscleParts.length);

const catalog = buildMuscleCatalog(muscleParts.map((part) => part.name));
const representedMeshes = catalog.reduce((sum, item) => sum + item.sids.length, 0);
assert(
  representedMeshes === muscleParts.length,
  `Learning catalog lost meshes: ${representedMeshes}/${muscleParts.length}`
);

const ids = new Set(catalog.map((item) => item.id));
assert(ids.size === catalog.length, "Learning catalog IDs are not unique");
assert(catalog.length < muscleParts.length, "Left/right structures were not grouped");
assert(catalog.length > 140, "Learning catalog collapsed too aggressively: " + catalog.length);

const paired = catalog.filter((item) => item.sids.length >= 2);
assert(paired.length > 80, "Too few bilateral learning targets: " + paired.length);

const supraspinatus = catalog.find((item) => /Надостная мышца/i.test(item.nameRu));
assert(supraspinatus, "Supraspinatus learning target is missing");
assert(
  supraspinatus.sids.length >= 2,
  "Right/left supraspinatus were not grouped into one learning target"
);

const deltoidAcromial = catalog.find((item) =>
  /Акромиальная часть дельтовидной мышцы/i.test(item.nameRu)
);
assert(deltoidAcromial, "Acromial deltoid learning target is missing");
assert(
  deltoidAcromial.sids.length >= 2,
  "Right/left acromial deltoid parts were not grouped"
);

const counts = regionCounts(catalog);
assert(counts.all === catalog.length, "Region totals do not match catalog size");

for (const region of [
  "head-neck",
  "shoulder",
  "arm",
  "forearm-hand",
  "thorax",
  "back",
  "abdomen",
  "pelvis",
  "gluteal",
  "thigh",
  "leg-foot",
]) {
  assert((counts[region] || 0) > 0, "Region unexpectedly empty: " + region);
}

const other = catalog.filter((item) => item.region === "other");
console.log("Learning catalog:", catalog.length, "targets from", muscleParts.length, "muscle meshes");
console.log("Bilateral targets:", paired.length);
console.log("Region counts:", JSON.stringify(counts));
console.log("Unclassified targets:", other.length);
if (other.length) {
  console.log("Unclassified names:", other.map((item) => item.nameRu).join(" | "));
}
assert(other.length === 0, "Learning catalog still has unclassified muscles");

// Storage model: progress is per (muscle, skill), not per whole muscle.
const memory = new Map();
const storage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, String(value));
  },
};

let store = loadLearningStore(storage);
const sample = catalog.find((item) => item.region === "shoulder") || catalog[0];
recordLearningAttempt(store, sample.id, "find", false, storage);
recordLearningAttempt(store, sample.id, "find", true, storage);
recordLearningAttempt(store, sample.id, "name", true, storage);

store = loadLearningStore(storage);
const findSummary = learningSummary(store, [sample], "find");
const nameSummary = learningSummary(store, [sample], "name");

assert(findSummary.attempts === 2, "Find attempts were not persisted");
assert(findSummary.correct === 1 && findSummary.wrong === 1, "Find result counts are wrong");
assert(nameSummary.attempts === 1 && nameSummary.correct === 1, "Name skill is not independent");
assert(findSummary.accuracy === 50, "Find accuracy should be 50%");

console.log("Per-skill persistence: ok");
