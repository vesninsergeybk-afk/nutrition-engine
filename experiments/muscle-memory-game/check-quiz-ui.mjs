import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app, engine, specimens, session] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("learning-engine.js", root), "utf8"),
  readFile(new URL("virtual-specimens.js", root), "utf8"),
  readFile(new URL("learning-session.js", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes("<span>Учебный блок</span>") &&
    html.includes('aria-label="Учебный блок или анатомическая область"'),
  "Regional selector is not presented as a first-class learning block"
);

for (const scope of [
  "upper-limb",
  "lower-limb",
  "neck",
  "neck-collar",
  "foot",
  "erector-spinae",
  "rotator-cuff",
  "scapular-stabilizers",
]) {
  assert(
    engine.includes('id: "' + scope + '"') ||
      specimens.includes('"' + scope + '"'),
    "Missing course-ready scope/specimen: " + scope
  );
}

assert(
  html.includes('id="scope-controls"') &&
    html.includes('id="region-isolation"') &&
    /scope-controls[\s\S]*learning-region/.test(html),
  "Learning block selector is not a persistent scene control"
);
assert(
  app.includes("function regionIsolationActive()") &&
    app.includes("applyRegionScene({ resetLayers: true })") &&
    app.includes("applyRegionMuscleVisibility()") &&
    app.includes("focusLearningRegion();"),
  "Learning block does not control real scene isolation"
);
assert(
  app.includes("buildSmartChoices(item.target, availableTargets"),
  "Recognition choices are not restricted to the active learning block"
);
assert(
  app.includes("function syncLearningSessionSizes()") &&
    app.includes("Весь блок ·"),
  "Quiz size does not adapt to small regional blocks"
);
assert(
  app.includes('params.get("scope") || params.get("region")') &&
    app.includes('url.searchParams.set("scope", selectedLearningRegion)'),
  "Learning blocks are not deep-linkable for course embeds"
);
assert(
  app.includes("focusLearningRegion();") &&
    app.includes('focusShoulderButton.textContent = "К блоку"'),
  "Changing a learning block does not have native camera navigation"
);
assert(
  session.includes("const buckets = new Map()") &&
    session.includes("for (const region of regionOrder)"),
  "Composite-region sessions are not balanced across anatomical subregions"
);
assert(
  session.includes("bySkill") &&
    app.includes("Найти на модели: без ошибок") &&
    app.includes("Назвать: без ошибок"),
  "Session feedback does not separate localization and naming retrieval"
);

console.log("Quiz UI contract: course scopes + active-block choices + adaptive size + deep links");


assert(
  app.includes("applyRegionBoneVisibility()") &&
    app.includes('boneDisplayMode = "xray"') &&
    app.includes('canvas.dataset.boneScope = regionIsolationActive() ? "regional" : "full"'),
  "Regional bone support is not filtered and visible by default"
);
assert(
  app.includes("studyStructureMatchesActiveRegion") &&
    app.includes("applyRegionStudyVisibility"),
  "Tissue layers are not filtered to the selected learning block"
);
