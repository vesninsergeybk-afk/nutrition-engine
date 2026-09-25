import {
  buildSmartChoices,
  completeSessionItem,
  createLearningSession,
  currentSessionItem,
  mistakeTargets,
  sessionProgress,
  sessionSummary,
} from "./learning-session.js";
import { loadLearningStore, recordLearningAttempt } from "./learning-engine.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const catalog = [
  { id: "a", nameRu: "Большая круглая мышца", region: "shoulder", sids: [0] },
  { id: "b", nameRu: "Малая круглая мышца", region: "shoulder", sids: [1] },
  { id: "c", nameRu: "Надостная мышца", region: "shoulder", sids: [2] },
  { id: "d", nameRu: "Подостная мышца", region: "shoulder", sids: [3] },
  { id: "e", nameRu: "Дельтовидная мышца", region: "shoulder", sids: [4] },
  { id: "f", nameRu: "Икроножная мышца", region: "leg-foot", sids: [5] },
];

const deterministic = (() => {
  let n = 0;
  return () => ((n++ * 37) % 100) / 100;
})();

const findSession = createLearningSession({
  mode: "find",
  catalog,
  store: { records: {} },
  size: 5,
  rng: deterministic,
});
assert(findSession.items.length === 5, "Find session size is wrong");
assert(new Set(findSession.items.map((item) => item.target.id)).size === 5, "Session repeats targets");
assert(findSession.items.every((item) => item.skillId === "find"), "Find session has wrong skill");

const sequenceRng = (() => {
  let n = 0;
  return () => ((n++ * 19 + 11) % 97) / 97;
})();
const spreadSession = createLearningSession({
  mode: "find",
  catalog,
  store: { records: {} },
  size: 6,
  rng: sequenceRng,
});
const spreadIds = spreadSession.items.map((item) => item.target.id);
assert(
  Math.abs(spreadIds.indexOf("a") - spreadIds.indexOf("b")) > 1,
  "Confusable large/small teres targets were placed consecutively"
);

completeSessionItem(findSession, { correct: true, wrongAttempts: 1 });
assert(sessionProgress(findSession).done === 1, "Session progress did not advance");

const nameSession = createLearningSession({
  mode: "name",
  catalog,
  store: { records: {} },
  size: 4,
  rng: deterministic,
});
assert(nameSession.items.every((item) => item.skillId === "name"), "Name session has wrong skill");

const target = catalog[0];
const choices = buildSmartChoices(target, catalog, 4, () => 0.25);
assert(choices.length === 4, "Name choices count is wrong");
assert(choices.some((item) => item.id === target.id), "Correct answer is missing from choices");
assert(
  choices.some((item) => item.id === "b"),
  "Similar same-region distractor was not preferred"
);

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
recordLearningAttempt(store, "a", "find", false, storage, { addReviewDebt: true });
recordLearningAttempt(store, "a", "find", false, storage, { addReviewDebt: true });
recordLearningAttempt(store, "a", "find", true, storage, { retireMistake: false });
recordLearningAttempt(store, "a", "name", false, storage, { addReviewDebt: true });
recordLearningAttempt(store, "b", "name", false, storage, { addReviewDebt: true });
store = loadLearningStore(storage);

let mistakes = mistakeTargets(store, catalog);
const aFindMistake = mistakes.find((item) => item.target.id === "a" && item.skillId === "find");
const aNameMistake = mistakes.find((item) => item.target.id === "a" && item.skillId === "name");
const bNameMistake = mistakes.find((item) => item.target.id === "b" && item.skillId === "name");
assert(
  aFindMistake?.debt === 1,
  "Repeated errors must keep one pending review item, not multiply review debt"
);
assert(aNameMistake?.debt === 1, "The same muscle must retain an independent name-review debt");
assert(bNameMistake?.debt === 1, "Name mistake debt is wrong");

const mixedReview = createLearningSession({
  mode: "mistakes",
  catalog,
  store,
  size: 5,
  rng: () => 0.3,
});
assert(
  mixedReview.items.some((item) => item.target.id === "a" && item.skillId === "find") &&
    mixedReview.items.some((item) => item.target.id === "a" && item.skillId === "name"),
  "Mistake review collapsed two skills of one muscle into a single item"
);

recordLearningAttempt(store, "a", "find", true, storage, { retireMistake: true });
recordLearningAttempt(store, "a", "name", true, storage, { retireMistake: true });
recordLearningAttempt(store, "b", "name", true, storage, { retireMistake: true });
store = loadLearningStore(storage);
mistakes = mistakeTargets(store, catalog);
assert(!mistakes.some((item) => item.target.id === "a"), "Resolved muscle skills stayed in review queue");
assert(!mistakes.some((item) => item.target.id === "b"), "Resolved name mistake stayed in queue");

const practical = createLearningSession({
  mode: "practical",
  catalog,
  store,
  size: 3,
  rng: deterministic,
});
while (currentSessionItem(practical)) {
  completeSessionItem(practical, { correct: true, wrongAttempts: 0 });
}
const summary = sessionSummary(practical);
assert(summary.total === 3 && summary.clean === 3, "Practical summary is wrong");
assert(sessionProgress(practical).finished, "Practical session did not finish");

console.log("Learning sessions: finite unique targets ok");
console.log("Confusable target spacing: ok");
console.log("Smart distractors: ok");
console.log("Mistake debt retirement: ok");
console.log("Independent skill review: ok");
console.log("Session summary: ok");
