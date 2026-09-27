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
  /function resetRegionSupportLayers\(\)[\s\S]*?boneDisplayMode = "xray"/.test(app),
  "An isolated region does not default to xray bone landmarks"
);
assert(
  /preset === "muscles"[\s\S]*?regionIsolationActive\(\) \? "xray" : "anatomical"/.test(app),
  "Muscle preset hides bones inside an isolated region"
);
assert(
  app.includes("function applySelectedMuscleBoneVisibility") &&
    app.includes("function showSelectedMuscleBoneContext") &&
    /function showSelectedMuscleBoneContext[sS]*?boneDisplayMode = "anatomical"[sS]*?applySelectedMuscleBoneVisibility(ids)/.test(app),
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
  "Regional xray bones do not have the intended default visibility"
);
console.log("Regional/default bone landmarks: xray");
console.log("Single-muscle isolation: local bone context preserved");
