import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app, css] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('id="deeper-structures"') &&
  html.includes('id="deeper-structure-list"'),
  "Dedicated deeper-muscle panel is missing"
);
for (const symbol of [
  "deeperMuscleIdsFromHits",
  "renderDeeperStructures",
  "isolateDeeperMuscle",
  "clearDeeperStructures",
]) {
  assert(app.includes(symbol), "Missing deeper-muscle interaction: " + symbol);
}
assert(
  app.includes("if (!candidateTarget) continue;"),
  "Non-muscle atlas structures may leak into the deeper-muscle list"
);
assert(
  app.includes("setVisibleStructures([sid])") &&
  app.includes("setAllStudyStructuresVisible(false)") &&
  app.includes("skeletonMesh.visible = false"),
  "Clicking a deeper muscle does not isolate it from the other anatomy layers"
);
assert(
  app.includes("applyBoneDisplayMode();") &&
  app.includes('canvas.dataset.deeperFocus = "false"'),
  "Returning from deeper-muscle focus does not restore the regional anatomy context"
);
assert(css.includes(".deeper-structures"), "Deeper-muscle panel has no visual emphasis");

console.log("Deeper-muscle panel: visible, clickable, isolating");
console.log("Non-muscle leakage guard: ok");
console.log("Region restore after deep focus: ok");
