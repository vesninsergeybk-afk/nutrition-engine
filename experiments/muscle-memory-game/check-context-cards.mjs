import assert from "node:assert/strict";
import {contextCardFor, CONTEXT_CARDS, ATLAS_FIGURES} from "./context-reference-data.js";
assert.equal(contextCardFor("Median nerve.l", "nervous").latin, "Nervus medianus");
assert.equal(contextCardFor("Palmar branch of median nerve.l", "nervous"), null);
assert.equal(contextCardFor("Deep femoral vein.r", "vascular").latin, "Vena profunda femoris");
assert.equal(contextCardFor("Anterior meniscotibial ligament (Medial meniscus).r", "joints"), null);
assert.equal(contextCardFor("Intervertebral disc C2-C3", "joints").id, "intervertebral-disc");
assert.equal(contextCardFor("Intervertebral disc C2-C3", "nervous"), null);
for (const card of Object.values(CONTEXT_CARDS)) {
 assert.ok(card.descriptionRu && card.landmarksRu.length && card.source.url.startsWith("https://"));
 for (const key of card.figures) assert.ok(ATLAS_FIGURES[key]?.page);
}
console.log("Context cards: 15 exact structures and disc family; side handling, separate branches and figure provenance ok.");
