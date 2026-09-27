import { readFile } from "node:fs/promises";
import {
  isKnownDeeperRelation,
  muscleDepthInfo,
} from "./regional-depth-map.js";

const root = new URL("./", import.meta.url);
const [app, html] = await Promise.all([
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("index.html", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  muscleDepthInfo("back", "latissimus dorsi")?.rank <
    muscleDepthInfo("back", "iliocostalis lumborum")?.rank,
  "Latissimus must remain superficial to iliocostalis lumborum"
);
assert(
  isKnownDeeperRelation("back", "latissimus-dorsi", "erector-spinae"),
  "Back depth profile lost latissimus -> erector spinae relation"
);
assert(
  isKnownDeeperRelation("back", "latissimus-dorsi", "serratus-posterior"),
  "Back depth profile lost latissimus -> serratus posterior relation"
);

for (const phrase of [
  'cover: /^right latissimus dorsi$/i',
  'cover: /^left latissimus dorsi$/i',
  '/^right serratus posterior inferior$/i',
  '/^left serratus posterior inferior$/i',
  '/^right iliocostalis lumborum$/i',
  '/^left iliocostalis lumborum$/i',
]) {
  assert(app.includes(phrase), "BodyParts back surface guard missing: " + phrase);
}

assert(
  app.includes("function verifiedCoveringStructureIds") &&
    app.includes("function revealSelectedMuscle") &&
    app.includes('canvas.dataset.selectedCovered = coveringIds.length ? "true" : "false"'),
  "Covered deep-muscle selection guard is disconnected"
);
assert(
  app.includes("if (!coveringIds.length) {") &&
    app.includes('highlightStructures([sid], "selected")') &&
    app.includes("Мышца находится глубже видимых покрывающих структур."),
  "Deep selection can again be highlighted through visible covering muscles"
);
assert(
  html.includes('id="reveal-selected"') &&
    html.includes(">Открыть мышцу<"),
  "Atlas lacks an explicit action to reveal a covered muscle"
);
assert(
  app.includes('action?.kind === "verified-cover"') &&
    app.includes("applyBodyPartsSurfaceConflictGuards()"),
  "Covered-layer reveal cannot be safely undone"
);

console.log("BodyParts back occlusion: verified surface/deep conflicts guarded");
