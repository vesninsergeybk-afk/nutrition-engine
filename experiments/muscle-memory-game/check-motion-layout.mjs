import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app, css, kinematics] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("motion-kinematics.js", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const staticAtlasRelease = app.includes("const MOTION_UI_ENABLED = false");

if (staticAtlasRelease) {
  assert(
    /id="mode-motion"[^>]*hidden[^>]*disabled/.test(html),
    "Static atlas release must keep Motion hidden and disabled"
  );
  assert(
    app.includes('mode === "motion" && !MOTION_UI_ENABLED'),
    "Static atlas release must guard the disabled Motion workspace"
  );
  console.log("Motion layout checks skipped: Motion is intentionally outside the static atlas release");
  process.exit(0);
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
  app.includes('motionCanvas.dataset.motionAuthority = action.authority') &&
    app.includes('action.referenceMaxDeg > action.maxDeg') &&
    /кинематическ.*preview/i.test(kinematics) &&
    /без проверенной регистрации|не расч[её]т мышечной силы|не силовая симуляция/i.test(kinematics),
  "Motion UI does not distinguish the kinematic preview from calibrated MyoSim simulation"
);
assert(
  app.includes('"kinematic-preview"') ||
    app.includes("action.authority"),
  "Motion authority is not explicit"
);

console.log("Motion split comparison: static reference + independent motion scene ready");
console.log("Motion camera synchronization: ready");
console.log("Motion simulation labeling: kinematic preview is explicitly not MyoSim");

assert(
  css.includes("body:not(.motion-mode) .comparison-pane-static") &&
    css.includes("position: absolute") &&
    css.includes(".motion-mode .comparison-pane-static"),
  "The split-view wrapper can change normal Atlas/Training canvas sizing"
);

const motionButtonIndex = html.indexOf('id="mode-motion"');
const modeSwitchStart = html.indexOf('<div class="mode-switch"');
const modeSwitchEnd = html.indexOf('</div>', modeSwitchStart);

if (staticAtlasRelease) {
  assert(
    /id="mode-motion"[^>]*hidden[^>]*disabled/.test(html),
    "Static atlas release must keep Motion hidden and disabled"
  );
  assert(
    app.includes('mode === "motion" && !MOTION_UI_ENABLED'),
    "Static atlas release must guard the disabled Motion workspace"
  );
  console.log("Motion navigation: intentionally absent from the static atlas release");
} else {
  const settingsIndex = html.indexOf('id="display-panel-toggle"');
  assert(
    motionButtonIndex > modeSwitchStart &&
      motionButtonIndex < modeSwitchEnd &&
      motionButtonIndex < settingsIndex,
    "Motion must remain a direct top-level mode, not a display action"
  );
  assert(
    app.includes("setDisplayPanelOpen(false)"),
    "Primary mode switching does not dismiss the display drawer"
  );
  console.log("Motion primary navigation: direct one-click top-level mode");
}

assert(
  app.includes('forearm-radius-hand-rotation-pivot') &&
    app.includes('motionMeshEndCentroid(radius, "max", 0.12)') &&
    app.includes('motionMeshEndCentroid(ulna, "min", 0.12)') &&
    app.includes('motionCanvas.dataset.motionRadiusRigid = "true"') &&
    !app.includes("deformRadiusForForearmRotation"),
  "Forearm pronosupination must rotate a rigid radius/hand chain around a bone-derived axis"
);

console.log("Forearm pronosupination: rigid radius + hand around radial-head/ulnar-head axis");

assert(
  app.includes("<strong>Анатомический контекст:</strong>") &&
    app.includes("visualContextNames"),
  "Motion UI does not explain visual-only anatomical context"
);


assert(
  app.includes("shouldUseTsmNativeMotion") &&
    app.includes('action.movementId === "shoulder-adduction"'),
  "Verified TSM shoulder adduction is still hidden behind a diagnostic URL flag"
);
assert(
  css.includes("motion-state-controls") &&
    css.includes("max-height: min(26dvh, 205px)") &&
    css.includes("motion-state.motion-state-controls > span"),
  "Mobile Motion controls are not compact enough for movement-first teaching"
);
console.log("Motion mobile UX: compact controls and normal-flow TSM adduction");
