import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { REFERENCE_REGIONS } from "./regions/index.js";
import { BODYPARTS3D_REFERENCE_ALIASES } from "./model-aliases.js";

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("en-US")
    .replace(/\bright\b|\bleft\b/g, " ")
    .replace(/\bset of\b/g, " ")
    .replace(/\bparts? of\b/g, " ")
    .replace(/\bmuscles?\b/g, " ")
    .replace(/\bmusculi?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const expectedNonSkeletal = new Set([
  "anterolateral head of lateral papillary muscle of left ventricle",
  "anterior papillary muscle of right ventricle",
  "lateral papillary muscle of left ventricle",
  "posterior papillary muscle of right ventricle",
  "septal papillary muscle of right ventricle",
]);

const canonicalTerms = [];
for (const region of REFERENCE_REGIONS) {
  for (const structure of region.structures || []) {
    canonicalTerms.push({
      id: structure.id,
      terms: [
        structure.names?.latin,
        ...(structure.names?.modelAliases || []),
      ]
        .filter(Boolean)
        .map(normalize),
    });
  }
}

const technicalAliasKeys = new Set(
  Object.keys(BODYPARTS3D_REFERENCE_ALIASES).map(normalize)
);

const dictionaryPath = fileURLToPath(
  new URL("../bodyparts4-muscles-ru.js", import.meta.url)
);
const dictionarySource = fs.readFileSync(dictionaryPath, "utf8");

const entries = [
  ...dictionarySource.matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g),
].map((match) => ({
  sourceName: match[1],
  nameRu: match[2],
  key: normalize(match[1]),
}));

const uniqueEntries = [];
const seen = new Set();
for (const entry of entries) {
  if (seen.has(entry.key)) continue;
  seen.add(entry.key);
  uniqueEntries.push(entry);
}

const unmatched = [];
for (const entry of uniqueEntries) {
  const direct = canonicalTerms.some((record) =>
    record.terms.some(
      (term) =>
        term === entry.key ||
        term.includes(entry.key) ||
        entry.key.includes(term)
    )
  );
  if (!direct && !technicalAliasKeys.has(entry.key)) unmatched.push(entry);
}

const expected = unmatched.filter((entry) =>
  expectedNonSkeletal.has(entry.sourceName)
);
const unexpected = unmatched.filter(
  (entry) => !expectedNonSkeletal.has(entry.sourceName)
);
const missingExpectedExclusions = [...expectedNonSkeletal].filter(
  (name) => !unmatched.some((entry) => entry.sourceName === name)
);

if (unexpected.length || missingExpectedExclusions.length) {
  console.error("BodyParts3D reference coverage audit failed.");

  if (unexpected.length) {
    console.error("\nUnexpected uncovered structures:");
    for (const entry of unexpected) {
      console.error(`- ${entry.sourceName} — ${entry.nameRu}`);
    }
  }

  if (missingExpectedExclusions.length) {
    console.error("\nExpected cardiac exclusions changed:");
    for (const name of missingExpectedExclusions) console.error(`- ${name}`);
  }

  process.exitCode = 1;
} else {
  console.log(
    `BodyParts3D coverage OK: ${uniqueEntries.length} unique dictionary names; ` +
    `${unmatched.length} explicit non-skeletal exclusions (papillary muscles of the heart); ` +
    "0 uncovered skeletal-muscle names."
  );
}
