import {
  buildMuscleCatalog,
} from "./learning-engine.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import {
  VIRTUAL_SPECIMENS,
  filterCatalogForSpecimen,
  specimenSceneTargets,
  specimenDepthAvailability,
} from "./virtual-specimens.js";

const Z_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb";
const BP_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";
const COVER_RE =
  /fascia|aponeuros|retinacul|peritone|pleura|dura mater|pericardi|omentum|epicardium/i;
const NON_MUSCLE_RE =
  /bursa|bursae|tendon|tendinous|sheath|ligament|tract|septum|tarsus|linea alba|trochlea|synovial|fibrous sheath|iliopectineal arch|common tendinous ring/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseGlbJson(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Not a GLB file");
  const totalLength = view.getUint32(8, true);
  let offset = 12;
  while (offset + 8 <= totalLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    offset += 8;
    if (chunkType === 0x4e4f534a) {
      const bytes = new Uint8Array(arrayBuffer, offset, chunkLength);
      return JSON.parse(new TextDecoder().decode(bytes).replace(/\u0000+$/g, ""));
    }
    offset += chunkLength;
  }
  throw new Error("GLB JSON chunk not found");
}

const [zr, bpr] = await Promise.all([fetch(Z_URL), fetch(BP_URL)]);
assert(zr.ok && bpr.ok, "Could not fetch pinned anatomy sources");

const zJson = parseGlbJson(await zr.arrayBuffer());
const zNames = [...new Set(
  (zJson.nodes || [])
    .filter(
      (node) =>
        node.mesh !== undefined &&
        node.name &&
        !COVER_RE.test(node.name) &&
        !NON_MUSCLE_RE.test(node.name)
    )
    .map((node) => node.name.trim())
)];
const bpAtlas = await bpr.json();
const bpNames = bpAtlas.parts
  .filter((part) => bodyPartsAnatomyKind(part) === "muscle")
  .map((part) => part.name);

const sources = {
  z: buildMuscleCatalog(zNames),
  bp: buildMuscleCatalog(bpNames),
};
const globalShared = new Set(
  sources.z
    .map((item) => item.id)
    .filter((id) => sources.bp.some((item) => item.id === id))
);

let semanticMismatchTotal = 0;
let emptyTotal = 0;

for (const specimen of VIRTUAL_SPECIMENS) {
  const zQuestion = filterCatalogForSpecimen(sources.z, specimen.id, "question");
  const bpQuestion = filterCatalogForSpecimen(sources.bp, specimen.id, "question");
  const zScene = specimenSceneTargets(sources.z, specimen.id);
  const bpScene = specimenSceneTargets(sources.bp, specimen.id);

  const zIds = new Set(zQuestion.map((item) => item.id));
  const bpIds = new Set(bpQuestion.map((item) => item.id));
  const semanticMismatches = [...globalShared].filter(
    (id) => zIds.has(id) !== bpIds.has(id)
  );

  const zDepth = specimenDepthAvailability(sources.z, specimen.id);
  const bpDepth = specimenDepthAvailability(sources.bp, specimen.id);

  const row = {
    id: specimen.id,
    zQuestion: zQuestion.length,
    bpQuestion: bpQuestion.length,
    zScene: zScene.length,
    bpScene: bpScene.length,
    sharedQuestion: [...zIds].filter((id) => bpIds.has(id)).length,
    semanticMismatches: semanticMismatches.length,
    zDepth: zDepth.reason,
    bpDepth: bpDepth.reason,
  };
  console.log("Specimen coverage:", JSON.stringify(row));

  if (!zQuestion.length || !bpQuestion.length) emptyTotal += 1;
  semanticMismatchTotal += semanticMismatches.length;

  assert(
    zScene.length >= zQuestion.length && bpScene.length >= bpQuestion.length,
    specimen.id + ": scene targets cannot be smaller than question targets"
  );

  if (specimen.id === "abdomen" || specimen.id === "anterior-abdominal-wall") {
    assert(zDepth.supported, specimen.id + ": Z-Anatomy should support full abdominal depth");
    assert(
      !bpDepth.supported && bpDepth.reason === "source-incomplete",
      specimen.id + ": BodyParts3D must be marked incomplete for abdominal depth"
    );
  }

  if (semanticMismatches.length) {
    console.log(
      "Specimen semantic mismatch:",
      specimen.id,
      semanticMismatches.join(" | ")
    );
  }
}

assert(emptyTotal === 0, "At least one virtual specimen is empty in an anatomy source");
assert(
  semanticMismatchTotal === 0,
  "Shared muscle concepts are assigned inconsistently across virtual specimens"
);

console.log("Virtual specimen cross-source audit: ok");
