import {
  depthProfileCoverage,
  hasCoverageRules,
  isKnownDeeperRelation,
  muscleDepthInfo,
  nextDepthRank,
  regionHasDepthProfile,
} from "./regional-depth-map.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(regionHasDepthProfile("shoulder"), "Shoulder depth profile is missing");
assert(regionHasDepthProfile("back"), "Back depth profile is missing");
assert(regionHasDepthProfile("abdomen"), "Abdominal depth profile is missing");
assert(!regionHasDepthProfile("forearm-hand"), "Unverified forearm depth profile must not be invented");

for (const concept of [
  "multifidus thoracis",
  "thoracic rotator",
  "lateral lumbar intertransversarius",
  "set of interspinales lumborum",
  "dorsal parts of lateral intertransversarii lumborum",
]) {
  assert(
    muscleDepthInfo("back", concept)?.rank === 4,
    "Deep back source-name variant is not mapped: " + concept
  );
}

const trapezius = muscleDepthInfo("shoulder", "trapezius");
const infraspinatus = muscleDepthInfo("shoulder", "infraspinatus");
const subscapularis = muscleDepthInfo("shoulder", "subscapularis");
assert(trapezius?.rank === 1, "Trapezius must be superficial in shoulder depth profile");
assert(infraspinatus?.rank === 2, "Infraspinatus must remain deeper than the superficial shoulder layer");
assert(subscapularis?.rank === 3, "Subscapularis must remain in the deep shoulder layer");
assert(
  nextDepthRank([trapezius, infraspinatus, subscapularis]) === 1,
  "An exposed deep muscle must not be peeled with the superficial layer"
);

assert(
  isKnownDeeperRelation("shoulder", "trapezius", "rhomboid-major"),
  "Trapezius -> rhomboid relationship is missing"
);
assert(
  isKnownDeeperRelation("shoulder", "deltoid", "infraspinatus"),
  "Deltoid -> infraspinatus relationship is missing"
);

const external = muscleDepthInfo("abdomen", "external oblique");
const internal = muscleDepthInfo("abdomen", "internal oblique");
const transverse = muscleDepthInfo("abdomen", "transversus abdominis");
const rectus = muscleDepthInfo("abdomen", "rectus abdominis");
assert(external?.rank === 1 && internal?.rank === 2 && transverse?.rank === 3, "Abdominal lateral wall order is broken");
assert(rectus?.rank === 1, "Rectus abdominis is a separate superficial midline compartment, not a deep continuation of the oblique stack");
assert(
  isKnownDeeperRelation("abdomen", "external-oblique", "transversus-abdominis"),
  "Abdominal depth relation must be transitive"
);
assert(
  !isKnownDeeperRelation("abdomen", "external-oblique", "rectus-abdominis"),
  "Rectus abdominis must not be presented as lying under external oblique globally"
);

const shoulderCoverage = depthProfileCoverage("shoulder", [
  "trapezius",
  "deltoid",
  "supraspinatus",
  "infraspinatus",
  "teres minor",
  "teres major",
  "levator scapulae",
  "rhomboid major",
  "rhomboid minor",
  "subscapularis",
  "serratus anterior",
  "pectoralis minor",
  "subclavius",
]);
assert(shoulderCoverage.complete, "Shoulder 13/13 depth map is incomplete");

assert(regionHasDepthProfile("gluteal"), "Gluteal depth profile is missing");
assert(regionHasDepthProfile("medial-thigh"), "Medial-thigh depth profile is missing");
assert(regionHasDepthProfile("posterior-thigh"), "Posterior-thigh depth profile is missing");
assert(regionHasDepthProfile("posterior-leg"), "Posterior-leg depth profile is missing");

assert(
  muscleDepthInfo("gluteal", "gluteus maximus")?.rank === 1 &&
    muscleDepthInfo("gluteal", "gluteus medius")?.rank === 2 &&
    muscleDepthInfo("gluteal", "gluteus minimus")?.rank === 3,
  "Gluteal depth order is broken"
);
assert(
  isKnownDeeperRelation("gluteal", "gluteus-maximus", "piriformis") &&
    isKnownDeeperRelation("gluteal", "gluteus-medius", "gluteus-minimus"),
  "Gluteal local cover graph is incomplete"
);

assert(
  muscleDepthInfo("medial-thigh", "adductor longus")?.rank === 1 &&
    muscleDepthInfo("medial-thigh", "adductor brevis")?.rank === 2 &&
    muscleDepthInfo("medial-thigh", "adductor magnus")?.rank === 3,
  "Medial-thigh adductor layering is broken"
);
assert(
  isKnownDeeperRelation("medial-thigh", "adductor-longus", "adductor-magnus"),
  "Medial-thigh cover graph must be transitive"
);

assert(
  muscleDepthInfo("posterior-leg", "gastrocnemius")?.rank === 1 &&
    muscleDepthInfo("posterior-leg", "soleus")?.rank === 2 &&
    muscleDepthInfo("posterior-leg", "tibialis posterior")?.rank === 3,
  "Posterior-leg layering is broken"
);
assert(
  isKnownDeeperRelation("posterior-leg", "gastrocnemius", "tibialis-posterior"),
  "Posterior-leg cover graph must be transitive"
);

console.log("Regional anatomical depth maps: shoulder/back/abdomen/gluteal/thigh/leg ok");
console.log("Deep-but-exposed muscle preservation: ok");
console.log("Local cover graph: ok");
