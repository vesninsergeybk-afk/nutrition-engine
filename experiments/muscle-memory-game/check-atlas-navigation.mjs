import { readFile } from "node:fs/promises";
import { bestRegionalSpecimenIdForTarget } from "./virtual-specimens.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [target, expected] of [
  [{ region: "thigh", sourceNames: ["Biceps femoris"], nameRu: "Двуглавая мышца бедра" }, "thigh-posterior"],
  [{ region: "leg-foot", sourceNames: ["Gastrocnemius"], nameRu: "Икроножная мышца" }, "leg-posterior"],
  [{ region: "abdomen", sourceNames: ["External oblique"], nameRu: "Наружная косая мышца живота" }, "abdomen"],
  [{ region: "thigh", sourceNames: ["Rectus femoris"], nameRu: "Прямая мышца бедра" }, "thigh-anterior"],
]) {
  assert(
    bestRegionalSpecimenIdForTarget(target) === expected,
    target.sourceNames[0] + " must navigate to " + expected
  );
}

const app = await readFile(new URL("app.js", import.meta.url), "utf8");

assert(
  app.includes('let selectedLearningRegion = "all"') &&
    app.includes('const restoreTrainingArea =') &&
    app.includes('requestedMode === "quiz"') &&
    app.includes('selectedLearningRegion = "all";') &&
    app.includes("syncLearningAreaQuery();"),
  "Atlas reload must start from the whole body instead of restoring sticky regional navigation"
);

assert(
  app.includes("function selectedMuscleRegionForNavigation()") &&
    app.includes("bestRegionalSpecimenIdForTarget(target)") &&
    app.includes("activateRegionForNavigation(regionId)"),
  "Area navigation is not derived from the selected muscle"
);

const searchMuscleStart = app.indexOf('if (match.kind === "muscle")');
const searchStudyStart = app.indexOf("} else {", searchMuscleStart);
const searchMuscleBlock = app.slice(searchMuscleStart, searchStudyStart);
assert(
  searchMuscleBlock.includes("selectExploreStructure(sid)") &&
    !searchMuscleBlock.includes("focusSelectedStructures("),
  "Selecting a muscle from search must not move the camera"
);

const exploreModeStart = app.indexOf('} else if (mode === "explore")');
const motionModeStart = app.indexOf("} else {", exploreModeStart);
const exploreModeBlock = app.slice(exploreModeStart, motionModeStart);
assert(
  exploreModeBlock.includes("selectExploreStructure(preservedSid)") &&
    !exploreModeBlock.includes("focusSelectedStructures("),
  "Returning to Atlas with a selected muscle must not move the camera"
);

assert(
  app.includes('focusSelectedButton.addEventListener("click", () => focusSelectedStructures())'),
  "Selected-structure camera focus must remain an explicit user command"
);

console.log("Atlas navigation: full-body start, stable selection and muscle-specific area focus ok");
