import { readFile } from "node:fs/promises";
import {
  STANDARD_MOTION_MUSCLE_ASSET_ID,
  motionMuscleAssetCandidate,
} from "./motion-muscle-assets.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = await readFile(new URL("index.html", import.meta.url), "utf8");
const app = await readFile(new URL("app.js", import.meta.url), "utf8");

assert(
  html.includes("<title>Анатомический тренажёр Сергея Веснина</title>") &&
    html.includes("<h1>Анатомический тренажёр</h1>") &&
    html.includes('<span class="brand-author">Сергей Веснин</span>'),
  "Product title/heading mismatch"
);
assert(
  !html.includes("Мышцы в движении"),
  "Legacy heading must be removed"
);

const exploreButton = html.indexOf('id="mode-explore"');
const motionButton = html.indexOf('id="mode-motion"');
const quizButton = html.indexOf('id="mode-quiz"');
assert(
  exploreButton >= 0 && exploreButton < motionButton && motionButton < quizButton,
  "Static shell keeps hidden Motion compatibility between Atlas and Training"
);
assert(
  /id="mode-explore"[^>]*class="active"[^>]*aria-pressed="true"/.test(html),
  "Atlas must be active in static markup"
);
assert(
  /id="explore-controls" class="explore-controls">/.test(html) &&
    /id="quiz-actions" class="actions" hidden>/.test(html),
  "Static initial controls must match Atlas mode"
);
assert(
  app.includes('let appMode = "explore";'),
  "Runtime must start in Atlas mode"
);
assert(
  app.includes('const requestedMode = params.get("mode");') &&
    app.includes('if (requestedMode === "quiz") setMode("quiz");'),
  "Explicit quiz deep link must still work"
);
assert(
  !app.includes('function shouldUseMyoArmElbowMotion(action, selectedUnits) {\n  if (!motionExperimentalLegacy) return false;'),
  "Verified MyoArm source-native runtime must not be gated as legacy"
);
assert(
  app.includes('Boolean(tsmNativeMotionSpec(action.movementId))'),
  "Verified TSM clips must be eligible in normal Motion mode"
);

const standard = motionMuscleAssetCandidate(STANDARD_MOTION_MUSCLE_ASSET_ID);
assert(
  standard?.status === "selected-standard-motion-representation" &&
    standard.staticAtlasDependency === false,
  "Standard Motion muscle representation must be source-derived and atlas-independent"
);

console.log("Product shell: branded trainer starts in Atlas mode");
console.log("Motion runtime: verified source-native branches are production-eligible");
console.log("Standard Motion muscle representation:", STANDARD_MOTION_MUSCLE_ASSET_ID);
