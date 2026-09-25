import {
  buildTopographyChoices,
  buildTopographyRelations,
  createTopographySession,
} from "./topography-learning.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function target(id, nameRu, sourceName) {
  return {
    id,
    nameRu,
    region: "shoulder",
    sourceNames: [sourceName],
    sids: [1],
  };
}

const catalog = [
  target("trap", "Трапециевидная мышца", "trapezius"),
  target("rhom-major", "Большая ромбовидная мышца", "rhomboid major"),
  target("supra", "Надостная мышца", "supraspinatus"),
  target("deltoid", "Дельтовидная мышца", "deltoid"),
  target("infra", "Подостная мышца", "infraspinatus"),
  target("subscap", "Подлопаточная мышца", "subscapularis"),
];

const relations = buildTopographyRelations(catalog, "shoulder");
assert(relations.length >= 3, "Shoulder topography relations were not built");
assert(
  relations.some(
    (item) =>
      item.upperTarget.id === "trap" &&
      item.deeperTarget.id === "rhom-major"
  ),
  "Trapezius -> rhomboid relation is missing"
);
assert(
  relations.some(
    (item) =>
      item.upperTarget.id === "deltoid" &&
      item.deeperTarget.id === "infra"
  ),
  "Deltoid -> infraspinatus relation is missing"
);

const session = createTopographySession({
  catalog,
  profileId: "shoulder",
  size: 3,
  rng: () => 0.25,
});
assert(session.mode === "topography", "Topography session mode is wrong");
assert(session.items.length === 3, "Topography session size is wrong");
assert(
  session.items.every(
    (item) =>
      item.skillId === "topography" &&
      item.promptTarget &&
      item.answerTarget
  ),
  "Topography session items are incomplete"
);

const choices = buildTopographyChoices(
  session.items[0],
  catalog,
  "shoulder",
  4,
  () => 0.3
);
assert(
  choices.some((choice) => choice.id === session.items[0].target.id),
  "Topography choices do not contain the correct answer"
);
assert(
  new Set(choices.map((choice) => choice.id)).size === choices.length,
  "Topography choices contain duplicates"
);

console.log("Topography relations/session/choices: ok");
