import { readFile } from "node:fs/promises";
import {
  muscleReferenceFor,
  muscleReferenceSource,
} from "./muscle-reference-data.js";
import { COURSE_ART_PRIMARY } from "./reference-data/course-art.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    trapeziusPart.primaryIllustration == null,
  "A whole-muscle illustration must not be presented as an exact image of a muscle part"
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

const supraspinatus = muscleReferenceFor("Right supraspinatus");
assert(
  supraspinatus.illustrations.some(
    (item) =>
      item.src === "./assets/reference/gray412-shoulder.png" &&
      item.rightsStatus === "public-domain"
  ),
  "Verified Gray shoulder plate is not wired as a local public-domain illustration"
);
assert(
  app.includes('image.loading = "lazy"') &&
    app.includes('figure.className = "structure-reference-figure"'),
  "Local reference illustrations are not rendered lazily"
);
assert(
  !html.includes("goldfinger") &&
    !html.includes("samusev") &&
    !html.includes("1O2V_frFY36-2gqnVF1DB2rOl6wPx1xRK") &&
    !html.includes("upload.wikimedia.org"),
  "Reference-only or remote source identifiers leaked into public markup"
);

console.log("Muscle reference: provenance + rights gates + exact course art ok");
