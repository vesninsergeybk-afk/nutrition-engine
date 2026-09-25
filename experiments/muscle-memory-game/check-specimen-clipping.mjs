import { readFile } from "node:fs/promises";
import {
  VIRTUAL_SPECIMENS,
  specimenVerticalWindow,
} from "./virtual-specimens.js";

const app = await readFile(new URL("./app.js", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const specimen of VIRTUAL_SPECIMENS) {
  const window = specimenVerticalWindow(specimen.id);
  assert(window, "Missing vertical specimen window: " + specimen.id);
  assert(
    window.length === 2 &&
      Number.isFinite(window[0]) &&
      Number.isFinite(window[1]) &&
      window[0] >= 0 &&
      window[1] <= 1 &&
      window[0] < window[1],
    "Invalid vertical specimen window: " + specimen.id
  );
}

assert(
  app.includes("renderer.localClippingEnabled = true"),
  "Three.js local clipping is not enabled"
);
for (const symbol of [
  "activeSpecimenClipBounds",
  "unclippedBoxForStructures",
  "applyRegionalClipWindow",
  "hitWithinRegionalClip",
  "setMaterialClipPlanes",
]) {
  assert(app.includes(symbol), "Missing specimen clipping symbol: " + symbol);
}
assert(
  !/function structureIdFromHit\(hit\)[\s\S]{0,220}hitWithinRegionalClip/.test(app) &&
    !/function studyStructureIdFromHit\(hit\)[\s\S]{0,220}hitWithinRegionalClip/.test(app),
  "Whole visible structures still contain unclickable regions outside the logical specimen box"
);
assert(
  app.includes('canvas.dataset.specimenClip = "logical-box"') &&
    app.includes("canvas.dataset.specimenClipX") &&
    app.includes("canvas.dataset.specimenClipY") &&
    app.includes("canvas.dataset.specimenClipZ"),
  "Browser verification cannot observe the active 3D specimen crop"
);

console.log("Virtual specimen spatial windows:", VIRTUAL_SPECIMENS.length);
console.log("Whole-structure rendering + whole-structure hit testing: ok");

assert(
  /function pointWithinRegionalClip[\s\S]*?point\.x[\s\S]*?point\.y[\s\S]*?point\.z/.test(app),
  "Specimen hit-testing is still only vertical"
);
assert(
  app.includes("regionalClipPlanes = [];") &&
    /function applyClipPlanesToLoadedAnatomy\(\)[\s\S]*?const noPlanes = \[\]/.test(app),
  "Normal virtual specimens can still hard-slice anatomical meshes"
);
assert(
  /function pointWithinRegionalClip[\s\S]*?point\.x[\s\S]*?point\.y[\s\S]*?point\.z/.test(app),
  "Logical specimen bounds no longer constrain interaction in 3D"
);
console.log("Whole-structure specimen rendering with logical 3D bounds: ok");

assert(
  /function applyLearningRegion\(\)[\s\S]*?selectedExploreSid = null[\s\S]*?questionLabelEl\.textContent = "Атлас"[\s\S]*?questionEl\.textContent = "Выберите структуру"/.test(app),
  "Changing virtual specimens can leave stale selected-muscle text in the Atlas card"
);
console.log("Atlas card resets when the virtual specimen changes");
