import { readFile } from "node:fs/promises";
import {
  muscleReferenceFor,
  muscleReferenceSource,
} from "./muscle-reference-data.js";
import { COURSE_ART_PRIMARY } from "./reference-data/course-art.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const sourceName of [
  "Descending part of right trapezius muscle",
  "Transverse part of left trapezius",
  "Ascending part of trapezius muscle",
]) {
  const reference = muscleReferenceFor(sourceName);
  assert(
    reference?.id === "trapezius" && reference?.modelCoverage === "part",
    sourceName + " must resolve to the parent trapezius reference card as a selected part"
  );
}


const root = new URL("./", import.meta.url);
const [html, app] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
]);

for (const [sourceName, expectedId] of [
  ["Right supraspinatus", "supraspinatus"],
  ["Left infraspinatus", "infraspinatus"],
  ["Right subscapularis", "subscapularis"],
  ["Right teres minor", "teres-minor"],
  ["Acromial part of right deltoid", "deltoid"],
  ["Right biceps brachii", "biceps-brachii"],
  ["Abductor digiti minimi of right hand", "abductor-digiti-minimi-hand"],
  ["Abductor digiti minimi of left hand", "abductor-digiti-minimi-hand"],
  ["Flexor digiti minimi brevis of right hand", "flexor-digiti-minimi-brevis-hand"],
  ["Opponens digiti minimi of left hand", "opponens-digiti-minimi"],
  ["Set of palmar interossei of right hand", "palmar-interossei"],
  ["Set of dorsal interossei of left hand", "dorsal-interossei"],
]) {
  const reference = muscleReferenceFor(sourceName);
  assert(reference?.id === expectedId, sourceName + " did not resolve to " + expectedId);
  assert(reference.originRu && reference.insertionRu, expectedId + " lacks attachments");
  assert(reference.actionsRu?.length, expectedId + " lacks actions");
  assert(reference.sources?.length, expectedId + " lacks provenance");
}

const miology = muscleReferenceSource("miology-igma-2018");
assert(miology?.year === 2018, "MIOL source metadata is incomplete");
assert(
  miology?.rightsStatus === "review" &&
    /открытая лицензия не установлена/i.test(miology?.rights?.note || ""),
  "MIOL illustration reuse must remain rights-gated"
);

const samusev = muscleReferenceSource("samusev-lipchenko-2003");
assert(
  samusev?.rightsStatus === "review" &&
    /публичное воспроизведение.*требует отдельного основания/i.test(
      samusev?.rights?.note || ""
    ),
  "Copyrighted atlas images must remain reference-only by default"
);


for (const sourceId of [
  "course-method-back-lesson8",
  "course-method-posterior-leg-lesson9",
  "course-method-anterior-leg-lesson15",
]) {
  const source = muscleReferenceSource(sourceId);
  assert(
    source?.rightsStatus === "review" &&
      /право на открытую публикацию.*требуют отдельной проверки/i.test(
        source?.rights?.note || ""
      ),
    sourceId + " must remain rights-gated for public release"
  );
}

assert(COURSE_ART_PRIMARY.length === 18, "Course-art exact set must contain 18 illustrations");
assert(
  new Set(COURSE_ART_PRIMARY.map((item) => item.structureId)).size === 18 &&
    COURSE_ART_PRIMARY.every(
      (item) =>
        item.match === "exact" &&
        item.spritePath &&
        item.spriteColumns === 6 &&
        Number.isInteger(item.column)
    ),
  "Course-art registry contains duplicate or non-exact entries"
);

const trapeziusArt = muscleReferenceFor("Right trapezius");
assert(
  trapeziusArt?.primaryIllustration?.structureId === "trapezius" &&
    trapeziusArt.primaryIllustration.locator === "стр. 1",
  "Exact trapezius course illustration is not wired to the reference card"
);

const trapeziusPart = muscleReferenceFor("Ascending part of trapezius");
assert(
  trapeziusPart?.modelCoverage === "part" &&
    trapeziusPart.primaryIllustration?.displayMatch === "parent-muscle" &&
    trapeziusPart.primaryIllustration?.selectedPartLabelRu,
  "A named muscle part should reuse the parent-muscle illustration only with an explicit whole-muscle/selected-part disclosure"
);

for (const id of [
  "structure-reference-facts",
  "structure-reference-origin",
  "structure-reference-insertion",
  "structure-reference-actions",
  "structure-reference-primary-art",
  "structure-reference-primary-art-image",
  "structure-reference-primary-art-title",
  "structure-reference-primary-art-caption",
  "structure-reference-sources",
  "structure-reference-illustrations",
]) {
  assert(html.includes(`id="${id}"`), "Reference UI missing: " + id);
}

assert(
  app.includes('from "./muscle-reference-data.js"') &&
    app.includes("muscleReferenceFor(sourceName)") &&
    app.includes("renderReferenceItems(") &&
    app.includes("renderStructureReferencePrimaryArt(reference)") &&
    !app.includes("renderMuscleReferencePreview") &&
    !html.includes("structure-reference-preview-canvas"),
  "Atlas card is not wired to exact 2D primary illustration data"
);
assert(
  html.includes('id="structure-reference-heading">Справка по структуре</strong>') &&
    (html.match(/data-reference-default-open/g) || []).length >= 2 &&
    app.includes("function openDefaultStructureReferenceDetails()") &&
    app.includes('structureReferenceHeading.textContent = "Справка по мышце"'),
  "Reference card must surface the key muscle facts without requiring the learner to discover collapsed sections"
);
assert(
  app.includes("selectedReferenceIllustration") &&
    app.includes("referenceAtlasIllustrationCount"),
  "Reference-card illustration state is not exposed for browser verification"
);
assert(
  app.includes('structureReferenceEl.dataset.referenceId = ""') &&
    app.includes('structureReferenceEl.dataset.referenceAtlasIllustrationCount = "0"') &&
    app.includes("clearStructureReferencePrimaryArt()"),
  "Switching structures must clear stale reference-card identity and illustration state"
);

const trapezius = muscleReferenceFor("trapezius");
assert(
  trapezius?.primaryIllustration?.kind === "course-art-exact" &&
    trapezius.primaryIllustration.spritePath?.includes("reference-data/assets/course-art/"),
  "Exact course artwork is not wired as the primary muscle illustration"
);

const infraspinatus = muscleReferenceFor("Right infraspinatus");
assert(
  infraspinatus?.illustrations?.some(
    (item) =>
      item.sourceId === "gray-1918-plate-412" &&
      item.src === "./assets/reference/gray412-shoulder.png" &&
      item.rightsStatus === "public-domain"
  ),
  "Local public-domain Gray 412 shoulder plate is not wired to the infraspinatus card"
);

const latissimus = muscleReferenceFor("Right latissimus dorsi");
assert(
  latissimus?.id === "latissimus-dorsi" &&
    latissimus.primaryIllustration?.kind === "course-art-exact" &&
    latissimus.primaryIllustration?.structureId === "latissimus-dorsi",
  "Latissimus dorsi must keep its exact drawn course illustration"
);

const externalOblique = muscleReferenceFor("Right external oblique");
assert(
  externalOblique?.id === "external-oblique" &&
    externalOblique.illustrations?.some(
      (item) =>
        item.sourceId === "gray-1918-plate-392" &&
        item.src === "./assets/reference/gray392-external-oblique.png" &&
        item.rightsStatus === "public-domain"
    ),
  "Local public-domain Gray 392 plate is not wired to the external oblique card"
);

const gray392Bytes = await readFile(
  new URL("assets/reference/gray392-external-oblique.png", root)
);
assert(
  gray392Bytes.length > 10000 &&
    gray392Bytes[0] === 0x89 &&
    gray392Bytes[1] === 0x50 &&
    gray392Bytes[2] === 0x4e &&
    gray392Bytes[3] === 0x47,
  "Gray 392 local asset is missing or not a valid PNG"
);
assert(
  app.includes("renderStructureReferencePrimaryArt(reference)") &&
    app.includes("structureReferencePrimaryArtImage.style.backgroundImage"),
  "Primary course artwork is not rendered by the muscle reference card"
);
assert(
  !html.includes("goldfinger") &&
    !html.includes("samusev") &&
    !html.includes("1O2V_frFY36-2gqnVF1DB2rOl6wPx1xRK") &&
    !html.includes("upload.wikimedia.org"),
  "Reference-only or remote source identifiers leaked into public markup"
);

console.log("Muscle reference: provenance + rights gates + exact course art ok");
