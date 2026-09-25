import {
  VIRTUAL_SPECIMENS,
  filterCatalogForSpecimen,
  specimenById,
  specimenDepthProfileId,
  specimenSceneTargets,
} from "./virtual-specimens.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function target(concept, region) {
  return {
    id: "test:" + concept,
    region,
    nameRu: concept,
    sourceNames: [concept],
    sids: [1],
  };
}

const ids = VIRTUAL_SPECIMENS.map((item) => item.id);
assert(new Set(ids).size === ids.length, "Virtual specimen IDs must be unique");
assert(
  VIRTUAL_SPECIMENS.filter((item) => item.type === "region").length >= 15,
  "Too few topographic virtual specimens"
);
assert(
  VIRTUAL_SPECIMENS.filter((item) => item.type === "group").length >= 10,
  "Too few thematic virtual specimens"
);

for (const item of VIRTUAL_SPECIMENS) {
  assert(item.nameRu && item.descriptionRu, item.id + ": missing Russian metadata");
  assert(item.defaultViews.length > 0, item.id + ": missing default view");
  assert(item.supportBonePatterns.length > 0, item.id + ": missing bone landmarks");
}

const handVsFootCatalog = [
  target("opponens digiti minimi of hand", "forearm-hand"),
  target("opponens digiti minimi of foot", "leg-foot"),
  target("flexor digitorum profundus", "forearm-hand"),
  target("flexor digitorum brevis", "leg-foot"),
];
const anteriorHand = filterCatalogForSpecimen(
  handVsFootCatalog,
  "forearm-hand-anterior",
  "question"
);
assert(
  anteriorHand.length === 2 &&
    anteriorHand.every((item) => !/foot|стоп/i.test([...(item.sourceNames || []), item.nameRu].join(" "))),
  "Foot muscles leaked into the anterior forearm/hand specimen"
);

const shoulderCatalog = [
  target("deltoid", "shoulder"),
  target("supraspinatus", "shoulder"),
  target("infraspinatus", "shoulder"),
  target("subscapularis", "shoulder"),
  target("teres minor", "shoulder"),
  target("pectoralis major", "thorax"),
  target("latissimus dorsi", "back"),
];
assert(
  filterCatalogForSpecimen(shoulderCatalog, "shoulder", "question").length === 5,
  "Shoulder question set must not absorb context cover muscles"
);
assert(
  specimenSceneTargets(shoulderCatalog, "shoulder").length === 7,
  "Shoulder scene must retain pectoralis major/latissimus context"
);
assert(specimenDepthProfileId("shoulder") === "shoulder", "Shoulder depth profile missing");

const cuffCatalog = [
  target("supraspinatus", "shoulder"),
  target("infraspinatus", "shoulder"),
  target("subscapularis", "shoulder"),
  target("teres minor", "shoulder"),
  target("deltoid", "shoulder"),
  target("teres major", "shoulder"),
];
assert(
  filterCatalogForSpecimen(cuffCatalog, "rotator-cuff", "question").length === 4,
  "Rotator cuff must contain exactly four learning concepts"
);
assert(
  specimenSceneTargets(cuffCatalog, "rotator-cuff").length === 6,
  "Rotator cuff scene must retain deltoid/teres major context"
);

const thighCatalog = [
  target("biceps femoris", "thigh"),
  target("semitendinosus", "thigh"),
  target("semimembranosus", "thigh"),
  target("gluteus maximus", "gluteal"),
  target("adductor magnus", "thigh"),
];
assert(
  filterCatalogForSpecimen(thighCatalog, "thigh-posterior", "question").length === 3,
  "Posterior thigh question set must be hamstrings"
);
assert(
  specimenSceneTargets(thighCatalog, "thigh-posterior").length === 5,
  "Posterior thigh scene must preserve gluteal/adductor context"
);

const spinalisCatalog = [
  target("spinalis thoracis", "back"),
  target("spinalis", "back"),
  target("spinalis capitis", "head-neck"),
  target("spinalis colli", "head-neck"),
  target("Остистая мышца груди", "back"),
  target("Остистая мышца", "back"),
  target("Остистая мышца головы", "head-neck"),
  target("Остистая мышца шеи", "head-neck"),
];

for (const specimenId of ["erector-spinae", "lower-back"]) {
  const names = filterCatalogForSpecimen(
    spinalisCatalog,
    specimenId,
    "question"
  ).map((item) => item.nameRu);

  assert(
    names.includes("spinalis thoracis") &&
      names.includes("spinalis") &&
      names.includes("Остистая мышца груди") &&
      names.includes("Остистая мышца"),
    specimenId + ": thoracic/generic spinalis coverage is incomplete"
  );
  assert(
    !names.some((name) => /capitis|colli|головы|шеи/i.test(name)),
    specimenId + ": cervical/head spinalis leaked into back specimen"
  );
}

for (const required of [
  "neck-collar",
  "shoulder",
  "rotator-cuff",
  "erector-spinae",
  "thigh-anterior",
  "thigh-posterior",
  "hamstrings",
  "quadriceps",
  "gluteal",
  "leg-posterior",
  "foot",
]) {
  assert(specimenById(required), "Required massage specimen missing: " + required);
}

console.log("Virtual anatomy specimens:", VIRTUAL_SPECIMENS.length);
console.log("Topographic + thematic specimen contract: ok");
console.log("Question targets are separated from scene context: ok");
