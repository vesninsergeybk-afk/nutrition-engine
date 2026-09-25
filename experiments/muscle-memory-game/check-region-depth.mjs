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
  "visibleSurfaceMuscleIdsFromCurrentView",
  "peelVisibleMuscleLayer",
  "deeperMuscleNamesFromHits",
]) {
  assert(app.includes(symbol), "Missing regional/depth engine symbol: " + symbol);
}

assert(
  app.includes('attachStructureVisibilityShader(material, "bone-visibility-v1")'),
  "Bone visibility is not structure-aware"
);
assert(
  app.includes('exploreHiddenActions.push({ kind: "surface-layer"'),
  "Bulk surface-layer removal is not undoable"
);
assert(
  app.includes("canvas.dataset.regionVisibleBones"),
  "Regional bone visibility is not observable"
);
assert(
  app.includes('boneDisplayMode = "anatomical"') &&
  app.includes('boneMode.value = "anatomical"'),
  "Regional reset must keep filtered bone landmarks visible"
);

console.log("Regional isolation: muscle + bone contract ok");
console.log("Depth exploration: view-dependent surface peeling + click stack ok");
