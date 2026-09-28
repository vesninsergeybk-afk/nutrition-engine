import {
  studyLayerNameRu,
  studyStructureSearchText,
  studyStructureTerm,
} from "./study-layer-terms-ru.js";
import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('id="skin-overlay-toggle"') &&
    html.includes('id="skin-mode" hidden'),
  "Skin must be exposed as a lightweight context overlay, not a full-scene preset"
);
assert(
  html.includes('data-connective-layer="subcutaneous"') &&
  html.includes('data-connective-layer="fascia"') &&
  html.includes('data-connective-layer="tendon"') &&
  html.includes('data-connective-layer="ligament"') &&
  html.includes('data-connective-layer="joint"') &&
  html.includes('data-connective-layer="cartilage"') &&
  html.includes('data-connective-layer="other"'),
  "Massage-relevant connective sublayers are incomplete"
);

for (const layer of ["nervous", "vascular", "lymphatic"]) {
  assert(
    html.includes('data-reference-layer="' + layer + '"'),
    "Reference layer control is missing: " + layer
  );
  assert(
    app.includes(layer + ': "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/'),
    "Reference layer source is not pinned: " + layer
  );
}

assert(
  /skinDisplayMode\s*=\s*"off"/.test(app),
  "Skin must remain opt-in so it cannot cover the muscle atlas by default"
);
assert(
  app.includes("applyTrainingDisplayOverride") &&
  app.includes("referenceTrainingHidden") &&
  app.includes("skinTrainingHidden") &&
  app.includes("connectiveTrainingHidden"),
  "Training display does not explicitly protect muscle visibility from study layers"
);
assert(
  app.includes("CONNECTIVE_DISPLAY_NAME_RE") &&
  app.includes("iliotibial tract"),
  "Known connective-source recovery rule is missing"
);
assert(
  html.includes('id="clear-support-layers"') &&
    app.includes('selectedConnectiveLayers().size > 0 ? "anatomical" : "off"') &&
    app.includes("clearSupportLayersButton?.addEventListener"),
  "Connective tissues must be explicit additive layers with a one-click reset"
);
assert(
  app.includes('part.system === "connective" ||') &&
    app.includes("CONNECTIVE_DISPLAY_NAME_RE.test(part.name)"),
  "Known connective structures with incorrect BodyParts system tags are still excluded"
);
assert(
  html.indexOf('id="selected-structure-actions"') <
    html.indexOf('id="structure-reference"'),
  "Selected-structure actions must remain visible above the long reference card"
);
assert(
  html.includes('id="hide-selected" type="button" disabled>Скрыть мышцу</button>'),
  "Atlas must expose an explicit hide-selected-muscle action"
);
assert(
  app.includes('highlightStructures([sid], "selected");') &&
    app.includes('highlightStructures(parentContextIds, "parentContext");') &&
    app.includes('parentContext: 0x8fc9e8') &&
    app.includes('canvas.dataset.selectedMuscleCoverage = selectedMuscleReference?.modelCoverage || "exact"') &&
    app.includes("functional part stays dark blue"),
  "Selected muscle parts must stay dark blue while the rest of the parent muscle is shown in light-blue context"
);

console.log("Massage study layers: static contract ok");
console.log("Skin: opt-in");
console.log("Connective sublayers: 7");
console.log("Lazy safety-reference layers: 3");

assert(
  html.includes('id="show-nearest-muscle"'),
  "Nearest-muscle navigation is missing from the atlas"
);
assert(
  app.includes("studyStructureIdFromHit") &&
  app.includes("selectStudyStructure") &&
  app.includes("isolateSelectedStudyStructure"),
  "Study-layer structures are not individually selectable/isolatable"
);
assert(
  app.includes("Ближайшая мышечная структура в этой 3D-модели") &&
  app.includes("Это пространственный ориентир, а не утверждение о прикреплении"),
  "Nearest-muscle relation is not qualified carefully enough"
);
console.log("Study-layer interaction: selectable, isolatable, searchable");

const studyTermCases = [
  ["right iliotibial tract", "fascia", /Подвздошно-большеберцовый тракт \(справа\)/],
  ["left thoracolumbar fascia", "fascia", /Грудопоясничная фасция \(слева\)/],
  ["right calcaneal tendon", "tendon", /Пяточное \(ахиллово\) сухожилие \(справа\)/],
  ["left coracoacromial ligament", "ligament", /Клювовидно-акромиальная связка \(слева\)/],
];
for (const [source, layer, expected] of studyTermCases) {
  const term = studyStructureTerm(source, layer);
  assert(expected.test(term.nameRu), source + ": unexpected Russian study label " + term.nameRu);
  assert(!/[A-Za-z]/.test(term.nameRu), source + ": Latin leaked into visible study label");
  assert(
    studyStructureSearchText(source, layer).includes(source.toLowerCase()),
    source + ": English source alias must remain searchable without being user-facing"
  );
}
assert(
  studyLayerNameRu("joint") === "Суставные капсулы и сумки",
  "Joint study layer label is wrong"
);
console.log("Study-layer Russian terminology: representative contract ok");


assert(
  app.includes("hiddenStack.length = 0") &&
    app.includes("exploreHiddenActions.length = 0"),
  "Restoring atlas context must clear both hide stacks"
);
assert(
  app.includes("const keepIsolation = isolated && selectedStudyId === studyId"),
  "Selecting an isolated study structure must preserve isolation state"
);
assert(
  app.includes('isolatedEntry.layerKey !== "skin"') &&
    app.includes("layerKey === isolatedEntry.layerKey"),
  "Layer controls can break study-structure isolation"
);
console.log("Study-layer state restoration: ok");

assert(
  app.includes("studyRanges = new Map()") &&
    app.includes("indexStudyRanges(mesh)") &&
    app.includes("range.start + range.count"),
  "Study-layer selection still scans full merged geometry instead of indexed ranges"
);
assert(
  app.includes("bounds: part.bounds || null") &&
    app.includes("boxForStudyStructure"),
  "Study-layer camera focus is not using stored anatomical bounds"
);
console.log("Study-layer indexed interaction: ok");


assert(
  app.includes("const skinIds = new Set(skinParts.map((part) => part.id))") &&
    app.includes("skinIds.has(part.id)"),
  "Connective integumentary structures can still be duplicated into the skin layer"
);
assert(
  app.includes("name === entry.nearestMuscleSourceName"),
  "Nearest-muscle navigation does not preserve the exact source side/component"
);
assert(
  app.includes("selectedReference != null") &&
    app.includes("restoreExploreContext();") &&
    app.includes("match.kind === \"reference\"") &&
    app.includes("if (isolated || selectedBoneId != null || selectedReference != null)"),
  "Atlas search can leave the model stuck when switching between muscle, bone, study tissue, and safety-landmark selections"
);
console.log("Study-layer deduplication and navigation state: ok");


assert(
  html.includes('id="layer-preset-field" hidden') &&
    html.includes('id="layer-preset"') &&
    !html.includes('value="all-tissues"'),
  "Obsolete mutually exclusive tissue presets must not remain user-facing"
);
assert(
  html.includes(">Скелет и костные ориентиры<") &&
    html.includes("Контур кожи") &&
    html.includes("Дополнительные ткани"),
  "Display drawer must present bones, skin and connective tissues by their actual learning roles"
);
assert(
  app.includes('boneDisplayMode = "anatomical"') &&
    app.includes('skinOverlayToggle.checked ? "ghost" : "off"') &&
    app.includes('skinMesh && skinDisplayMode === "anatomical"'),
  "Skeletal context must stay visible by default without making the working muscle model translucent or letting ghost skin intercept muscle picking"
);
assert(
  !app.includes('muscleDisplayMode = "ghost";'),
  "Support-layer controls must never make the working muscle model translucent"
);
assert(
  app.includes("applyRegionStudyVisibility();") &&
    app.includes("studyStructureMatchesActiveRegion"),
  "Study layers ignore the active regional block"
);


assert(
  app.includes("applyReferenceRegionVisibility") &&
    app.includes("referenceRanges") &&
    app.includes("referenceBounds"),
  "Safety-reference layers are not region-filtered"
);
