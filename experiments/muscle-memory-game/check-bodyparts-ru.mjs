import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import {
  bodyPartsMuscleNameRu,
  bodyPartsMuscleTranslationCoverage,
} from "./bodyparts4-muscles-ru.js";

const BP_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await fetch(BP_URL);
assert(response.ok, "Could not fetch pinned BodyParts3D atlas");
const atlas = await response.json();

const names = atlas.parts
  .filter((part) => bodyPartsAnatomyKind(part) === "muscle")
  .map((part) => part.name);

const coverage = bodyPartsMuscleTranslationCoverage(names);
console.log("BodyParts3D muscle parts:", coverage.total);
console.log(
  "BodyParts3D Russian names:",
  coverage.total - coverage.missing.length + "/" + coverage.total
);

if (coverage.missing.length) {
  console.log("Missing Russian names:");
  for (const name of coverage.missing) console.log(name);
}

const latinUserFacing = names
  .map((source) => ({ source, nameRu: bodyPartsMuscleNameRu(source) }))
  .filter(
    ({ nameRu }) =>
      !nameRu ||
      /[A-Za-z]/.test(nameRu)
  );

if (latinUserFacing.length) {
  console.log("Latin fragments leaked into Russian BodyParts3D labels:");
  for (const item of latinUserFacing) {
    console.log(item.source + " -> " + String(item.nameRu));
  }
}

assert(
  coverage.missing.length === 0,
  "BodyParts3D contains muscle parts without Russian labels"
);
assert(
  latinUserFacing.length === 0,
  "BodyParts3D Russian muscle labels contain Latin fragments"
);

console.log("BodyParts3D Russian muscle coverage: complete");
