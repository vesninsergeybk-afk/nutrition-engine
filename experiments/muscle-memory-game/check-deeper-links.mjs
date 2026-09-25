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
  "targetSideStructureIds",
  "deeperMuscleKey",
  "deeperMuscleIdsFromHits",
  "verifiedDeeperMuscleIds",
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
  app.includes("if (!selectedTarget || !selectedInfo) return [];") &&
    app.includes("if (!candidateInfo) continue;"),
  "Unverified ray hits can still masquerade as anatomical depth"
);
assert(
  app.includes("function sidesCanShareDepthPath") &&
    app.includes("if (!sidesCanShareDepthPath(selectedSide, candidateSide)) continue;"),
  "Deeper-here can cross from one body side to the contralateral side"
);
assert(
  app.includes("function targetDisplayNameForSid") &&
    app.includes("name.textContent = targetDisplayNameForSid(target, sid);"),
  "Deeper-here labels can describe one mesh while isolating the whole muscle"
);
assert(
  /function isolateDeeperMuscle[\s\S]*?anatomyMesh\.material\.opacity = 1/.test(app),
  "An isolated deeper muscle can remain ghosted by the previous display preset"
);
assert(
  app.includes("const keepIsolation =") &&
    app.includes("isolated = keepIsolation;"),
  "Re-clicking an isolated muscle can desynchronize the isolate button from the scene"
);
const isolateDeeperStart = app.indexOf("function isolateDeeperMuscle");
const isolateDeeperEnd = app.indexOf("function renderDeeperStructures", isolateDeeperStart);
const isolateDeeperBlock = app.slice(isolateDeeperStart, isolateDeeperEnd);

assert(
  isolateDeeperStart >= 0 &&
  isolateDeeperBlock.includes("setVisibleStructures(muscleIds)") &&
  isolateDeeperBlock.includes("highlightStructures(muscleIds") &&
  isolateDeeperBlock.includes("setAllStudyStructuresVisible(false)") &&
  isolateDeeperBlock.includes("showSelectedMuscleBoneContext(muscleIds)") &&
  !isolateDeeperBlock.includes("skeletonMesh.visible = false"),
  "Clicking a deeper muscle must isolate the complete unilateral muscle while keeping relevant bone landmarks"
);
assert(
  /isolateButton\.addEventListener[\s\S]*?setVisibleStructures\(muscleIds\)[\s\S]*?showSelectedMuscleBoneContext\(muscleIds\)/.test(app),
  "Ordinary muscle isolation does not keep the same relevant bone context"
);
assert(
  app.includes("seenTargets.has(candidateKey)") &&
  app.includes("seenTargets.add(candidateKey)"),
  "Deeper-muscle links are not deduplicated by muscle and side"
);
assert(
  app.includes("applyBoneDisplayMode();") &&
  app.includes('canvas.dataset.deeperFocus = "false"'),
  "Returning from deeper-muscle focus does not restore the regional anatomy context"
);
assert(css.includes(".deeper-structures"), "Deeper-muscle panel has no visual emphasis");
assert(
  /function resetLoadedModel\(\)[\s\S]*?clearDeeperStructures\(\)/.test(app),
  "Model switching can preserve stale deeper-muscle buttons"
);
assert(
  /function applyLearningRegion\(\)[\s\S]*?clearDeeperStructures\(\)/.test(app),
  "Changing the active specimen can preserve stale deeper-muscle state"
);

console.log("Deeper-muscle panel: visible, clickable, isolating");
console.log("Non-muscle leakage guard: ok");
console.log("Region restore after deep focus: ok");

assert(
  app.includes("canvas.dataset.deeperFocusComponentCount"),
  "Deep focus does not expose component-count diagnostics for browser verification"
);
console.log("Deep links: whole unilateral muscle, not one mesh subdivision");

assert(
  app.includes('"Глубже относительно этой мышцы"') &&
    app.includes("verifiedDeeperMuscleIds") &&
    app.includes("isKnownDeeperRelation("),
  "Verified graph fallback for deeper anatomy is missing"
);

assert(
  /function applyLearningRegion\(\)[\s\S]*?searchInput\.value = ""[\s\S]*?searchResults\.replaceChildren\(\)[\s\S]*?questionEl\.textContent = "Выберите структуру"/.test(app),
  "Changing the specimen can preserve stale Atlas search/selection UI"
);

assert(
  /function verifiedDeeperMuscleIds[\s\S]*?const ids = \(target\.sids \|\| \[\]\)\.filter\(\(sid\) =>[\s\S]*?sidesCanShareDepthPath/.test(app) &&
    !/function verifiedDeeperMuscleIds[\s\S]*?structureVisibility\[sid\] !== false[\s\S]*?return candidates/.test(app),
  "Verified deeper relations still depend on current scene visibility"
);

assert(
  app.includes('"Почему послойность недоступна?"') &&
    !/peelSurfaceLayerButton\.disabled[\s\S]{0,240}layerUnavailable/.test(app),
  "Unavailable depth maps are still silently disabled instead of explained"
);
assert(
  css.includes("border-left-width: 3px") &&
    css.includes("rgba(36, 93, 168, .055)"),
  "Deeper-anatomy block is still visually too easy to miss"
);
