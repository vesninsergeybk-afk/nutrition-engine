import { readFile } from "node:fs/promises";
import { nerveMentionMatches } from "./nerve-muscle-links.js";
import { muscleReferenceFor } from "./muscle-reference-data.js";
import {
  referenceLayerNameRu,
  referenceStructureSearchText,
  referenceStructureTerm,
} from "./reference-terms-ru.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [source, layer, expected] of [
  ["Left median nerve", "nervous", "Срединный нерв (слева)"],
  ["Right sciatic nerve", "nervous", "Седалищный нерв (справа)"],
  ["Left femoral artery", "vascular", "Бедренная артерия (слева)"],
  ["Right great saphenous vein", "vascular", "Большая подкожная вена (справа)"],
  ["Thoracic duct", "lymphatic", "Грудной проток"],
  ["Kidney.l", "organs", "Почка (слева)"],
  ["Inferior lobe of right lung", "organs", "Нижняя доля правого лёгкого"],
  ["Left suprascapular nerve", "nervous", "Надлопаточный нерв (слева)"],
  ["Right vertebral artery", "vascular", "Позвоночная артерия (справа)"],
  ["Left supraclavicular nodes", "lymphatic", "Надключичные лимфатические узлы (слева)"],
  ["Facial nerve (VII).r", "nervous", "Лицевой нерв (справа)"],
]) {
  const term = referenceStructureTerm(source, layer);
  assert(term.specific, source + ": expected a specific Russian term");
  assert(term.nameRu === expected, source + ": unexpected Russian term: " + term.nameRu);
  assert(!/[A-Za-z]/.test(term.nameRu), source + ": Latin leaked into Russian UI");
  assert(
    referenceStructureSearchText(source, layer).includes(source.toLocaleLowerCase("ru-RU")),
    source + ": source synonym missing from search text"
  );
}

const fallback = referenceStructureTerm("Unmapped source object 17", "nervous");
assert(!fallback.specific, "Unknown source object must remain explicitly unspecific");
assert(
  fallback.nameRu === "Структура с нерасшифрованным названием",
  "Unknown nervous object must use a neutral Russian fallback"
);
assert(
  referenceLayerNameRu("vascular") === "Кровеносные сосуды",
  "Vascular layer label changed unexpectedly"
);

const app = await readFile(new URL("app.js", import.meta.url), "utf8");

for (const required of [
  'from "./reference-terms-ru.js"',
  "let selectedReference = null",
  "function referencePartIdFromHit",
  "function referencePartIsVisible",
  "function referencePartIsInteractive",
  "function selectReferenceStructure",
  "mesh.userData.referenceNames = sourceNames",
  "...[...referenceMeshes.values()].filter((mesh) => mesh.visible)",
  'matches.push({ kind: "reference", layerKey, partId })',
  'match.kind === "reference"',
  "referenceStructureSearchText(names[partId], layerKey)",
  "referenceWorldBox(mesh, selectedReference.partId)",
]) {
  assert(app.includes(required), "Safety-landmark interaction contract missing: " + required);
}

assert(
  app.includes("hit.object?.userData?.referenceLayer") &&
    app.includes("referencePartIsInteractive(hit.object, partId)") &&
    app.includes("selectReferenceStructure(hit.object.userData.referenceLayer, partId)"),
  "Mapped safety landmarks are not connected to Atlas picking"
);
assert(
  app.includes("if (!referencePartIsInteractive(mesh, partId)) continue;"),
  "Hidden source objects must stay out of the user-facing Atlas search"
);

assert(
  app.includes('canvas.dataset.selectedReferenceLayer = layerKey') &&
    app.includes('canvas.dataset.selectedReferenceSpecific = String(term.specific)'),
  "Selected safety-landmark state is not exposed consistently"
);
assert(
  app.includes("function renderSimpleAtlasReference") &&
    app.includes('structureReferenceEl.dataset.referenceKind = "context"') &&
    app.includes('function renderBoneReference(term)') &&
    app.includes('boneCardForTerm(term)'),
  "Bone and safety selections must surface their context in the Atlas information panel"
);

console.log(
  "Z-Anatomy safety landmarks: Russian labels + click + search + focus contract ok"
);

assert(referenceStructureTerm("Axillary_nerve.l", "nervous").specific, "GLTF-sanitized nerve names must remain searchable and selectable");
assert(nerveMentionMatches("Axillary_nerve.l", muscleReferenceFor("Deltoid muscle.l").innervationRu), "The deltoid card must be reachable from its named nerve");
assert(nerveMentionMatches("Accessory nerve (XI).r", muscleReferenceFor("Trapezius muscle.r").innervationRu), "Cranial nerve suffix must not prevent a reference link");
assert(!nerveMentionMatches("Radial nerve.l", "Лучевая половина мышцы; локтевой нерв."), "Directional words must not be interpreted as innervation");
