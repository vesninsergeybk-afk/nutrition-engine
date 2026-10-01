import { readFile } from "node:fs/promises";
import { boneTermRu } from "./bone-terms-ru.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import { studyStructureTerm } from "./study-layer-terms-ru.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await fetch(
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json"
);
if (!response.ok) throw new Error("Could not fetch pinned BodyParts3D atlas");
const atlas = await response.json();

const connectiveNameRe =
  /ligament|fascia|tendon|aponeuros|retinacul|cartilage|bursa|capsule|synovial|subcutaneous|adipose|iliotibial tract/i;

const bones = atlas.parts.filter(
  (part) => bodyPartsAnatomyKind(part) === "bone"
);
const connective = atlas.parts.filter(
  (part) =>
    !bodyPartsAnatomyKind(part) &&
    (part.system === "connective" || connectiveNameRe.test(part.name))
);
const connectiveIds = new Set(connective.map((part) => part.id));
const skin = atlas.parts.filter(
  (part) => part.system === "integumentary" && !connectiveIds.has(part.id)
);

const hasUnexpectedLatin = (value) =>
  /[A-Za-z]/.test(String(value || "").replace(/\b[IVX]+\b/g, "").replace(/\b[CTL]\d+\b/g, ""));

const missingBones = bones.filter((part) => {
  const term = boneTermRu(part.name);
  return !term.specific || !/[А-Яа-яЁё]/.test(term.nameRu) || hasUnexpectedLatin(term.nameRu);
});
assert(
  missingBones.length === 0,
  "BodyParts3D bones without specific Russian names: " +
    missingBones.map((part) => part.name).join(" | ")
);

const layerFor = (name) => {
  const value = String(name || "");
  if (/subcutaneous|adipose/i.test(value)) return "subcutaneous";
  if (/fascia|retinacul|iliotibial tract/i.test(value)) return "fascia";
  if (/tendon|aponeuros|tendinous/i.test(value)) return "tendon";
  if (/ligament/i.test(value)) return "ligament";
  if (/bursa|capsule|synovial/i.test(value)) return "joint";
  if (/cartilage/i.test(value)) return "cartilage";
  return "other";
};

const supportParts = [
  ...connective.map((part) => ({ ...part, layerKey: layerFor(part.name) })),
  ...skin.map((part) => ({ ...part, layerKey: "skin" })),
];

const missingSupport = supportParts.filter((part) => {
  const term = studyStructureTerm(part.name, part.layerKey);
  return !term.specific || !/[А-Яа-яЁё]/.test(term.nameRu) || hasUnexpectedLatin(term.nameRu);
});
assert(
  missingSupport.length === 0,
  "BodyParts3D displayed tissues without specific Russian names: " +
    missingSupport.map((part) => part.name).join(" | ")
);

const app = await readFile(new URL("app.js", import.meta.url), "utf8");
assert(
  app.includes('import { boneTermRu } from "./bone-terms-ru.js"') &&
    app.includes("function selectBoneStructure") &&
    app.includes("skeletonMesh?.visible ? skeletonMesh : null") &&
    app.includes("selectBoneStructure(boneId)"),
  "Displayed bones are not connected to Atlas picking"
);
assert(
  app.includes("function boneSearchText") &&
    app.includes('matches.push({ kind: "bone", id: boneId })') &&
    app.includes('button.textContent = term.nameRu + " · " + term.kindRu') &&
    app.includes('boneDisplayMode = "anatomical"'),
  "Russian bone names are not connected to Atlas search"
);

const studyStart = app.indexOf("function selectStudyStructure");
const studyEnd = app.indexOf("function referencePartIdFromHit", studyStart);
const studyBlock = app.slice(studyStart, studyEnd);
assert(
  studyStart >= 0 &&
    studyBlock.includes("studyStructureTerm(entry.sourceName, entry.layerKey)") &&
    studyBlock.includes("questionEl.textContent = term.nameRu") &&
    app.includes('matches.push({ kind: "study", id: entry.id })') &&
    app.includes("ensureStudyLayerShown(entry)"),
  "Russian fascia/ligament/tendon labels are not connected to Atlas selection and search"
);

const referenceStart = app.indexOf("function selectReferenceStructure");
const referenceEnd = app.indexOf("function boneIdFromHit", referenceStart);
const referenceBlock = app.slice(referenceStart, referenceEnd);
assert(
  referenceStart >= 0 &&
    referenceBlock.includes("referenceStructureTerm(sourceName, layerKey)") &&
    referenceBlock.includes("questionEl.textContent = term.nameRu") &&
    app.includes('matches.push({ kind: "reference", layerKey, partId })') &&
    app.includes("referencePartIsInteractive(mesh, partId)"),
  "Russian safety-landmark labels are not connected to Atlas selection and search"
);

console.log(
  "Russian support terms: " +
    bones.length +
    " bones + " +
    supportParts.length +
    " displayed tissues covered"
);
