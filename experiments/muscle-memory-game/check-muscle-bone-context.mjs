import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [app, html] = await Promise.all([
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("index.html", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /function resetRegionSupportLayers\(\)[\s\S]*?boneDisplayMode = "anatomical"/.test(app),
  "Regional atlas context must start with solid bone landmarks visible"
);
assert(
  app.includes('boneDisplayMode = "anatomical"') &&
    !/preset === "muscles"[\s\S]*?muscleDisplayMode = "ghost"/.test(app),
  "Muscle-first atlas context must keep solid skeletal context without forcing x-ray bones or ghost muscles"
);
const selectedBoneContextStart = app.indexOf("function showSelectedMuscleBoneContext");
const selectedBoneContextEnd = app.indexOf("function applyBoneDisplayMode", selectedBoneContextStart);
const selectedBoneContextBlock = app.slice(selectedBoneContextStart, selectedBoneContextEnd);
assert(
  app.includes("function applySelectedMuscleBoneVisibility") &&
    selectedBoneContextBlock.includes('boneDisplayMode = "anatomical"') &&
    selectedBoneContextBlock.includes("applySelectedMuscleBoneVisibility(ids)"),
  "Single-muscle isolation must keep a local solid-bone anatomical context"
);
assert(
  /function isolateDeeperMuscle[\s\S]*?showSelectedMuscleBoneContext\(muscleIds\)/.test(app),
  "Deeper-muscle isolation still removes skeletal landmarks"
);
assert(
  /isolateButton\.addEventListener[\s\S]*?targetSideStructureIds[\s\S]*?showSelectedMuscleBoneContext\(muscleIds\)/.test(app),
  "Regular muscle isolation does not preserve the whole side-specific muscle with bone context"
);
assert(
  /function restoreExploreContext[\s\S]*?boneDisplayModeBeforeMuscleIsolation/.test(app),
  "Leaving single-muscle isolation does not restore the previous bone mode"
);
assert(
  html.includes('id="bone-opacity"') && html.includes('value="0.17"'),
  "Optional xray bone mode must retain an explicit opacity control"
);
console.log("Regional/default bone landmarks: visible");
console.log("Single-muscle isolation: local bone context preserved");
