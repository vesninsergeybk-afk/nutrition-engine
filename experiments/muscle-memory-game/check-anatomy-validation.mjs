import { readFile } from "node:fs/promises";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";

const MANIFEST_URL = new URL("./anatomy-validation-shoulder.json", import.meta.url);
const ATLAS_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";

const BONE_KEYS = new Set(["scapula", "clavicle", "humerus"]);
const REVIEW_VALUES = new Set(["pending", "verified", "not_applicable"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("en-US")
    .replace(/\b(right|left)\b/g, " ")
    .replace(/\bmuscle\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const manifest = JSON.parse(await readFile(MANIFEST_URL, "utf8"));
const structures = manifest.structures || [];

assert(structures.length === 19, "Shoulder validation manifest must contain 19 structures");
assert(
  manifest.audit_status?.total_structures === structures.length,
  "Audit total does not match manifest length"
);

const keys = structures.map((entry) => entry.canonical_key);
assert(new Set(keys).size === keys.length, "Canonical keys must be unique");

for (const entry of structures) {
  assert(entry.canonical_key, "Validation entry is missing canonical_key");
  assert(REVIEW_VALUES.has(entry.terminology_review), entry.canonical_key + ": invalid terminology_review");
  assert(REVIEW_VALUES.has(entry.geometry_review), entry.canonical_key + ": invalid geometry_review");
  assert(REVIEW_VALUES.has(entry.relation_review), entry.canonical_key + ": invalid relation_review");

  if (entry.status === "verified_for_teaching") {
    assert(
      entry.terminology_review === "verified" &&
      entry.geometry_review === "verified" &&
      entry.relation_review === "verified",
      entry.canonical_key + ": verified_for_teaching requires all review gates"
    );
  }
}

const verifiedCount = structures.filter(
  (entry) => entry.status === "verified_for_teaching"
).length;
assert(
  manifest.audit_status?.verified_for_teaching === verifiedCount,
  "Audit verified count does not match structure statuses"
);

const response = await fetch(ATLAS_URL);
assert(response.ok, "Could not fetch pinned BodyParts3D atlas");
const atlas = await response.json();

for (const entry of structures) {
  const expectedKind = BONE_KEYS.has(entry.canonical_key) ? "bone" : "muscle";
  const key = normalize(entry.canonical_key);
  const matches = atlas.parts.filter(
    (part) =>
      bodyPartsAnatomyKind(part) === expectedKind &&
      normalize(part.name).includes(key)
  );

  assert(
    matches.length > 0,
    entry.canonical_key + ": no matching " + expectedKind + " in pinned BodyParts3D atlas"
  );
}

console.log("Shoulder validation manifest: 19/19 entries structurally valid");
console.log("BodyParts3D coverage: 19/19 canonical structures found");
console.log("Verified for teaching:", verifiedCount + "/19");
