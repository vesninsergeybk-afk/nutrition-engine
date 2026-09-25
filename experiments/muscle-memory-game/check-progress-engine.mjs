import {
  appendSessionHistory,
  loadLearningStore,
  recordConfusion,
  recordLearningAttempt,
} from "./learning-engine.js";
import {
  RETENTION_OUTCOMES,
  recordReviewOutcome,
} from "./retention-engine.js";
import {
  currentAreaProgress,
  recentSessionHistory,
  regionProgress,
  topConfusions,
  weakSkills,
} from "./progress-engine.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const memory = new Map();
const storage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, String(value));
  },
};

const catalog = [
  { id: "a", nameRu: "Надостная мышца", region: "shoulder", skillIds: ["find", "name"] },
  { id: "b", nameRu: "Подостная мышца", region: "shoulder", skillIds: ["find", "name"] },
  { id: "c", nameRu: "Икроножная мышца", region: "leg-foot", skillIds: ["find", "name"] },
];

const t0 = Date.UTC(2026, 8, 25, 9, 0, 0);
let store = loadLearningStore(storage);

recordLearningAttempt(store, "a", "find", false, storage, { addReviewDebt: true });
recordLearningAttempt(store, "a", "name", true, storage);
recordLearningAttempt(store, "b", "find", true, storage);
recordReviewOutcome(store, "b", "find", RETENTION_OUTCOMES.clean, storage, { now: t0 });

recordConfusion(store, "a", "b", "find", storage, t0);
recordConfusion(store, "a", "b", "find", storage, t0 + 1000);
recordConfusion(store, "a", "c", "name", storage, t0 + 2000);

store = loadLearningStore(storage);

const confusions = topConfusions(store, catalog, { limit: 3 });
assert(confusions.length === 2, "Confusion pairs were not persisted");
assert(confusions[0].target.id === "a" && confusions[0].chosen.id === "b", "Top confusion ordering is wrong");
assert(confusions[0].count === 2, "Confusion frequency is wrong");

const area = currentAreaProgress(store, catalog.slice(0, 2), t0);
assert(area.find.total === 2 && area.name.total === 2, "Current area totals are wrong");
assert(area.find.due >= 1, "Explicit mistake was not counted as due");
assert(area.find.scheduled >= 1, "Scheduled skill was not counted");

const rows = regionProgress(store, catalog, t0);
const shoulder = rows.find((row) => row.regionId === "shoulder");
const leg = rows.find((row) => row.regionId === "leg-foot");
assert(shoulder?.total === 2, "Shoulder progress total is wrong");
assert(leg?.total === 1, "Leg progress total is wrong");

const weak = weakSkills(store, catalog, { limit: 5, now: t0 });
assert(
  weak[0]?.target.id === "a" && weak[0]?.skillId === "find",
  "Explicit review debt must lead weak-skill ordering"
);
assert(/ошибка|повторения/.test(weak[0].reason), "Weak-skill reason is missing");

const session = {
  mode: "practical",
  startedAt: t0,
  finishedAt: t0 + 60000,
  items: [
    { target: catalog[0], skillId: "find" },
    { target: catalog[1], skillId: "name" },
  ],
  results: [
    { correct: true, wrongAttempts: 0, revealed: false },
    { correct: false, wrongAttempts: 1, revealed: true },
  ],
};

const historyEntry = appendSessionHistory(
  store,
  {
    completedAt: session.finishedAt,
    mode: session.mode,
    region: "shoulder",
    total: session.items.length,
    clean: 1,
    wrongAttempts: 1,
    revealed: 1,
  },
  storage
);
assert(historyEntry?.clean === 1, "Session clean count is wrong");
assert(historyEntry?.revealed === 1, "Session revealed count is wrong");
store = loadLearningStore(storage);
assert(recentSessionHistory(store, 5).length === 1, "Session history was not persisted");
assert(Object.keys(store.confusions).length === 2, "Confusions disappeared after reload");

console.log("Progress by region and skill: ok");
console.log("Weak-skill prioritization: ok");
console.log("Confusion pairs: ok");
console.log("Session history persistence: ok");
