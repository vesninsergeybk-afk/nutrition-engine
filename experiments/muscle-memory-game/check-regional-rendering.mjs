import { readFile } from "node:fs/promises";

const app = await readFile(
  new URL("./app.js", import.meta.url),
  "utf8"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const skeletonStart = app.indexOf("async function loadSkeletonLayer");
const skeletonEnd = app.indexOf("async function loadZAnatomyModel", skeletonStart);
const skeletonBlock = app.slice(skeletonStart, skeletonEnd);

assert(skeletonStart >= 0 && skeletonEnd > skeletonStart, "Skeleton loader is missing");
assert(
  skeletonBlock.includes("const vertexCounts = []") &&
    skeletonBlock.includes("const boneId = boneNames.length") &&
    skeletonBlock.includes("boneNames.push(") &&
    skeletonBlock.includes("boneLocalBounds.push(") &&
    skeletonBlock.includes("boneRanges = vertexCounts.map"),
  "Z-Anatomy skeleton does not build stable per-bone regional ranges"
);

const referenceStart = app.indexOf("function loadReferenceLayer");
const referenceEnd = app.indexOf("function setReferenceLayerAvailability", referenceStart);
const referenceBlock = app.slice(referenceStart, referenceEnd);

assert(referenceStart >= 0 && referenceEnd > referenceStart, "Reference-layer loader is missing");
assert(
  !referenceBlock.includes("boneNames.push(") &&
    !referenceBlock.includes("boneLocalBounds.push(") &&
    !referenceBlock.includes("const boneId = boneNames.length"),
  "Safety-reference layers are corrupting skeletal regional state"
);

assert(
  app.includes("function applyRegionMuscleVisibility()") &&
    app.includes("function applyRegionStudyVisibility()") &&
    app.includes("function applyRegionBoneVisibility()"),
  "Regional renderer does not independently control muscles, tissue layers and bones"
);
assert(
  app.includes('canvas.dataset.boneMode = "regional-hidden"'),
  "Regional scene no longer guarantees bones are absent by default"
);
assert(
  app.includes("function applyStudyLayerPreset") &&
    app.includes("function peelVisibleMuscleLayer"),
  "Layered anatomy study controls are incomplete"
);
assert(
  app.includes("data-bone-training-hidden") ||
    app.includes("boneTrainingHidden"),
  "Quiz does not explicitly track hidden bone support"
);

console.log("Regional renderer: isolated muscles + independent support layers");
console.log("Skeletal/reference state separation: ok");
