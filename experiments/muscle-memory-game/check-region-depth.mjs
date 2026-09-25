import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('id="region-isolation"') &&
  html.includes('id="peel-surface-layer"'),
  "Regional isolation/depth controls are incomplete"
);

for (const symbol of [
  "applyRegionBoneVisibility",
  "regionalBoneContextBox",
  "targetDepthInfo",
  "nextRegionalAnatomicalLayer",
  "peelAnatomicalMuscleLayer",
  "deeperMuscleNamesFromHits",
]) {
  assert(app.includes(symbol), "Missing regional/depth engine symbol: " + symbol);
}

assert(
  app.includes('attachStructureVisibilityShader(material, "bone-visibility-v1")'),
  "Bone visibility is not structure-aware"
);
assert(
  app.includes('kind: "anatomical-layer"'),
  "Anatomical layer removal is not undoable"
);
assert(
  !app.includes("function peelVisibleMuscleLayer"),
  "Camera-visible ray sampling must not drive anatomical layer removal"
);
assert(
  app.includes("canvas.dataset.regionVisibleBones"),
  "Regional bone visibility is not observable"
);
assert(
  app.includes('boneDisplayMode = "off"') &&
    app.includes('preset === "bones"') &&
    app.includes("applyRegionBoneVisibility()"),
  "Regional bones must be hidden by default and available as an explicit filtered layer"
);

console.log("Regional isolation: muscles default + opt-in regional bones ok");
console.log("Depth exploration: regional anatomical peeling + constrained click stack ok");


assert(
  app.includes('activeDepthAvailability?.reason === "source-incomplete"') &&
    app.includes("Послойный режим отключён"),
  "Incomplete anatomy-source coverage is not explained to the learner"
);
assert(
  app.includes("layerUnavailable") &&
    app.includes("peelSurfaceLayerButton.title"),
  "Unsupported anatomical depth can still look like an available layer action"
);
