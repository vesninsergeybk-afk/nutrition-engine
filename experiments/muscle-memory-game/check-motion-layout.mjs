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
  html.includes('id="mode-motion"') &&
    html.includes('id="motion-pane"') &&
    html.includes('id="motion-viewer"') &&
    html.includes('id="motion-state"'),
  "Motion comparison UI is incomplete"
);

for (const symbol of [
  "ensureMotionRenderer",
  "buildMotionPreview",
  "prepareMotionComparison",
  "syncMotionCamera",
  "resizeMotionViewer",
  "createMotionMesh",
  "matchMotionMuscleUnit",
]) {
  assert(app.includes(symbol), "Motion comparison integration missing: " + symbol);
}

assert(
  /function setMode\(mode\)[\s\S]*?"motion"/.test(app) &&
    app.includes('document.body.classList.toggle("motion-mode", mode === "motion")'),
  "Motion is not a first-class application mode"
);
assert(
  app.includes('motionCanvas.dataset.motionState = "rest-pose"'),
  "Motion preview does not explicitly identify the non-animated rest pose"
);
assert(
  app.includes("motionCamera.position.copy(camera.position)") &&
    app.includes("motionCamera.quaternion.copy(camera.quaternion)"),
  "Motion and anatomy cameras are not synchronized"
);
assert(
  app.includes("createMotionMesh(anatomyMesh") &&
    app.includes("createMotionMesh(skeletonMesh"),
  "Motion comparison is not built from standalone muscle and bone geometry"
);
assert(
  css.includes(".motion-mode .viewer-wrap") &&
    css.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)") &&
    css.includes("@media (max-width: 760px)"),
  "Motion split view is not responsive"
);
assert(
  /Исходное положение/.test(app) &&
    /после калибровки/.test(app),
  "Motion UI risks presenting the static preview as real simulated movement"
);

console.log("Motion split comparison: static reference + independent motion scene ready");
console.log("Motion camera synchronization: ready");
console.log("Motion simulation labeling: honest rest-pose state");

assert(
  css.includes("body:not(.motion-mode) .comparison-pane-static") &&
    css.includes("position: absolute") &&
    css.includes(".motion-mode .comparison-pane-static"),
  "The split-view wrapper can change normal Atlas/Training canvas sizing"
);
