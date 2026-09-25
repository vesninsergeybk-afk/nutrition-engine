import { structureTerm } from "./anatomy-terms-ru.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";

const ATLAS_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await fetch(ATLAS_URL);
assert(response.ok, "Could not fetch pinned BodyParts3D atlas");
const atlas = await response.json();
const muscles = atlas.parts.filter(
  (part) => bodyPartsAnatomyKind(part) === "muscle"
);

assert(muscles.length === 416, "Unexpected BodyParts3D muscle mesh count: " + muscles.length);

const missing = [];
const latinLeaks = [];

for (const part of muscles) {
  const term = structureTerm(part.name);
  const nameRu = String(term?.nameRu || "");
  if (!nameRu || nameRu === part.name || !/[А-Яа-яЁё]/u.test(nameRu)) {
    missing.push(part.name);
    continue;
  }
  if (/[A-Za-z]/.test(nameRu)) {
    latinLeaks.push(part.name + " -> " + nameRu);
  }
}

assert(
  missing.length === 0,
  "BodyParts3D Atlas has muscle meshes without Russian UI names: " +
    missing.join(" | ")
);
assert(
  latinLeaks.length === 0,
  "BodyParts3D Atlas has Latin fragments in Russian UI names: " +
    latinLeaks.join(" | ")
);

console.log("BodyParts3D Atlas Russian muscle names:", muscles.length + "/" + muscles.length);
