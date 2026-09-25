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

console.log("Regional anatomical depth maps: shoulder/back/abdomen ok");
console.log("Deep-but-exposed muscle preservation: ok");
console.log("Local cover graph: ok");
