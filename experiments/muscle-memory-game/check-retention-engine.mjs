import {
  RETENTION_OUTCOMES,
  buildTodayQueue,
  recordReviewOutcome,
  retentionRecord,
  retentionStatus,
  retentionSummary,
} from "./retention-engine.js";
import {
  loadLearningStore,
  recordLearningAttempt,
} from "./learning-engine.js";

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
];

let store = loadLearningStore(storage);
const t0 = Date.UTC(2026, 8, 25, 9, 0, 0);

assert(retentionStatus(store, "a", "find", t0) === "new", "Untouched skill must be new");

recordLearningAttempt(store, "a", "find", true, storage);
store = loadLearningStore(storage);
assert(
  retentionStatus(store, "a", "find", t0) === "due",
  "Legacy practised skill must enter the new scheduler as due"
);

const first = recordReviewOutcome(
  store,
  "a",
  "find",
  RETENTION_OUTCOMES.clean,
  storage,
  { now: t0 }
);
assert(first.reviewCount === 1, "Review count was not stored");
assert(first.cleanStreak === 1, "Clean streak did not start");
assert(first.stabilityDays === 1, "First clean review should start at policy stability");
assert(first.dueAt > t0, "Clean review did not schedule the next review");
assert(retentionStatus(store, "a", "find", t0) === "scheduled", "Fresh review must be scheduled");

const second = recordReviewOutcome(
  store,
  "a",
  "find",
  RETENTION_OUTCOMES.clean,
  storage,
  { now: first.dueAt }
);
assert(second.stabilityDays > first.stabilityDays, "Clean recall must grow stability");
assert(second.cleanStreak === 2, "Clean streak did not grow");

const corrected = recordReviewOutcome(
  store,
  "a",
  "find",
  RETENTION_OUTCOMES.corrected,
  storage,
  { now: second.dueAt }
);
assert(corrected.cleanStreak === 0, "Corrected recall must reset clean streak");
assert(corrected.lapses === 1, "Corrected recall must record a lapse");
assert(
  corrected.stabilityDays < second.stabilityDays,
  "Corrected recall must shorten the interval"
);

recordLearningAttempt(store, "b", "name", false, storage, { addReviewDebt: true });
store = loadLearningStore(storage);
const today = buildTodayQueue(store, catalog, { now: t0, limit: 10 });
assert(
  today[0]?.target.id === "b" && today[0]?.skillId === "name",
  "Explicit mistake debt must have highest review priority"
);

const summary = retentionSummary(store, catalog, "find", t0);
assert(summary.total === 2, "Retention summary total is wrong");
assert(summary.new + summary.due + summary.scheduled === 2, "Retention summary categories overlap");

console.log("Retention scheduling: adaptive intervals ok");
console.log("Legacy progress migration: ok");
console.log("Today queue priority: ok");
console.log("Retention summary: ok");
