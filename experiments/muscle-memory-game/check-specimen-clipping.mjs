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
  "activeSpecimenVerticalClipBounds",
  "applyRegionalClipWindow",
  "hitWithinRegionalClip",
  "setMaterialClipPlanes",
]) {
  assert(app.includes(symbol), "Missing specimen clipping symbol: " + symbol);
}
assert(
  /function structureIdFromHit\(hit\)[\s\S]{0,180}hitWithinRegionalClip/.test(app) &&
    /function studyStructureIdFromHit\(hit\)[\s\S]{0,180}hitWithinRegionalClip/.test(app),
  "Raycaster can still select visually clipped anatomy"
);
assert(
  app.includes('canvas.dataset.specimenClip = "vertical"') &&
    app.includes("canvas.dataset.specimenClipY"),
  "Browser verification cannot observe the active specimen crop"
);

console.log("Virtual specimen spatial windows:", VIRTUAL_SPECIMENS.length);
console.log("Render clipping + ray-hit clipping: ok");
