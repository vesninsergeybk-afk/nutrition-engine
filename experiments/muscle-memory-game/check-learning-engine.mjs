import {
  buildMuscleCatalog,
  appendSessionHistory,
  confusionPairs,
  learningHistory,
  learningSummary,
  loadLearningStore,
  migrateLearningStoreAliases,
  recordConfusion,
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

const deltoid = catalog.find((item) => item.nameRu === "Дельтовидная мышца");
assert(deltoid, "Deltoid learning target is missing");
assert(
  deltoid.sids.length >= 6,
  "Deltoid subdivisions/sides were not grouped into one learning target"
);
assert(
  !catalog.some((item) => /часть дельтовидной мышцы/i.test(item.nameRu)),
  "Deltoid anatomical parts leaked into the base learning target list"
);

const trapezius = catalog.find((item) => item.nameRu === "Трапециевидная мышца");
assert(trapezius && trapezius.sids.length >= 6, "Trapezius parts were not grouped");

for (const wholeName of [
  "Двуглавая мышца плеча",
  "Трёхглавая мышца плеча",
]) {
  const target = catalog.find((item) => item.nameRu === wholeName);
  assert(target && target.sids.length >= 4, wholeName + ": heads were not grouped");
}

const latinNames = catalog.filter((item) => /[A-Za-z]/.test(item.nameRu));
assert(
  latinNames.length === 0,
  "Learning catalog contains Latin user-facing names: " +
    latinNames.map((item) => item.nameRu).join(" | ")
);

const sidedNames = catalog.filter((item) =>
  /\((?:справа|слева)\)|^(?:правая|левая)\b|\b(?:правой|левой|правую|левую)\b/iu.test(item.nameRu)
);
assert(
  sidedNames.length === 0,
  "Base learning targets must be side-neutral: " +
    sidedNames.map((item) => item.nameRu).join(" | ")
);

const subdivisionNames = catalog.filter((item) =>
  /\b(?:часть|головка|брюшко)\b/iu.test(item.nameRu)
);
assert(
  subdivisionNames.length === 0,
  "Base learning targets still contain anatomical subdivisions: " +
    subdivisionNames.map((item) => item.nameRu).join(" | ")
);


const migrationTarget = catalog.find(
  (item) => item.nameRu === "Дельтовидная мышца" && item.legacyIds?.length
);
assert(migrationTarget, "A grouped target with legacy IDs is required");
const migrationPeer =
  catalog.find((item) => item.region === "shoulder" && item.id !== migrationTarget.id) ||
  catalog.find((item) => item.id !== migrationTarget.id);
assert(migrationPeer, "A peer target is required for migration tests");

const migrationMemory = new Map();
const migrationStorage = {
  getItem(key) {
    return migrationMemory.has(key) ? migrationMemory.get(key) : null;
  },
  setItem(key, value) {
    migrationMemory.set(key, String(value));
  },
};
let migrationStore = loadLearningStore(migrationStorage);
const legacyId = migrationTarget.legacyIds[0];
recordLearningAttempt(migrationStore, legacyId, "find", false, migrationStorage);
recordConfusion(
  migrationStore,
  legacyId,
  migrationPeer.id,
  "find",
  migrationStorage
);
assert(
  migrateLearningStoreAliases(migrationStore, catalog, migrationStorage),
  "Legacy subdivision progress was not migrated"
);

migrationStore = loadLearningStore(migrationStorage);
assert(
  !migrationStore.records[legacyId + "::find"],
  "Legacy subdivision record was not retired after migration"
);
assert(
  migrationStore.records[migrationTarget.id + "::find"]?.attempts === 1 &&
    migrationStore.records[migrationTarget.id + "::find"]?.reviewDebt === 1,
  "Legacy subdivision attempts/debt were not preserved"
);
const migratedConfusion = confusionPairs(migrationStore, {
  skillId: "find",
  limit: 5,
})[0];
assert(
  migratedConfusion?.expectedMuscleId === migrationTarget.id &&
    migratedConfusion?.chosenMuscleId === migrationPeer.id,
  "Legacy confusion pair was not remapped to the whole-muscle target"
);
console.log("Subdivision progress migration: ok");

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

const secondSample =
  catalog.find((item) => item.region === sample.region && item.id !== sample.id) ||
  catalog.find((item) => item.id !== sample.id);
assert(secondSample, "A second learning target is required for confusion tests");

recordConfusion(store, sample.id, secondSample.id, "name", storage);
recordConfusion(store, sample.id, secondSample.id, "name", storage);
appendSessionHistory(
  store,
  {
    completedAt: 1000,
    mode: "name",
    region: sample.region,
    total: 5,
    clean: 3,
    wrongAttempts: 2,
    revealed: 0,
  },
  storage
);

store = loadLearningStore(storage);
const confusions = confusionPairs(store, { skillId: "name", limit: 5 });
assert(confusions.length === 1, "Confusion pair was not persisted");
assert(confusions[0].count === 2, "Repeated confusion count is wrong");
assert(
  confusions[0].expectedMuscleId === sample.id &&
    confusions[0].chosenMuscleId === secondSample.id,
  "Confusion direction was not preserved"
);

const history = learningHistory(store, 5);
assert(history.length === 1, "Session history was not persisted");
assert(history[0].total === 5 && history[0].clean === 3, "Session history summary is wrong");

console.log("Per-skill persistence: ok");
console.log("Confusion persistence: ok");
console.log("Compact session history: ok");
