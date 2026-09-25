import {
  buildMuscleCatalog,
} from "./learning-engine.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import {
  VIRTUAL_SPECIMENS,
  filterCatalogForSpecimen,
  specimenSceneTargets,
  specimenDepthAvailability,
  specimenVerticalWindow,
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
const bpMuscleParts = bpAtlas.parts.filter(
  (part) => bodyPartsAnatomyKind(part) === "muscle"
);
const bpNames = bpMuscleParts.map((part) => part.name);
const bpPartByName = new Map(bpMuscleParts.map((part) => [part.name, part]));

const bpBodyMinY = Math.min(
  ...bpMuscleParts
    .map((part) => Number(part.bounds?.[0]?.[1]))
    .filter(Number.isFinite)
);
const bpBodyMaxY = Math.max(
  ...bpMuscleParts
    .map((part) => Number(part.bounds?.[1]?.[1]))
    .filter(Number.isFinite)
);
const bpBodyHeight = bpBodyMaxY - bpBodyMinY;
assert(bpBodyHeight > 0, "BodyParts muscle body bounds are invalid");

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
const clippedWindowFailures = [];

const EXPECTED_EXACT_BOTH = Object.freeze({
  shoulder: 13,
  "arm-anterior": 3,
  "arm-posterior": 2,
  "thigh-medial": 6,
  "thigh-posterior": 3,
  "leg-anterior-lateral": 6,
  "leg-posterior": 7,
  "rotator-cuff": 4,
  "scapular-stabilizers": 5,
  "erector-spinae": 4,
  quadriceps: 4,
  "calf-complex": 3,
  suboccipital: 4,
  "hip-flexors": 4,
});

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

  const windowFractions = specimenVerticalWindow(specimen.id);
  assert(windowFractions, specimen.id + ": missing spatial specimen window");
  const windowMinY = bpBodyMinY + bpBodyHeight * windowFractions[0];
  const windowMaxY = bpBodyMinY + bpBodyHeight * windowFractions[1];

  const clippedOutTargets = bpQuestion.filter((target) => {
    const parts = (target.sourceNames || [])
      .map((name) => bpPartByName.get(name))
      .filter(Boolean);

    if (!parts.length) return true;

    return !parts.some((part) => {
      const minY = Number(part.bounds?.[0]?.[1]);
      const maxY = Number(part.bounds?.[1]?.[1]);
      return (
        Number.isFinite(minY) &&
        Number.isFinite(maxY) &&
        maxY >= windowMinY &&
        minY <= windowMaxY
      );
    });
  });

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
    bpClippedOutQuestionTargets: clippedOutTargets.length,
  };
  console.log("Specimen coverage:", JSON.stringify(row));

  if (!zQuestion.length || !bpQuestion.length) emptyTotal += 1;
  semanticMismatchTotal += semanticMismatches.length;

  assert(
    zScene.length >= zQuestion.length && bpScene.length >= bpQuestion.length,
    specimen.id + ": scene targets cannot be smaller than question targets"
  );

  const expectedExact = EXPECTED_EXACT_BOTH[specimen.id];
  if (expectedExact != null) {
    assert(
      zQuestion.length === expectedExact && bpQuestion.length === expectedExact,
      specimen.id +
        ": compact specimen cardinality changed (Z=" +
        zQuestion.length +
        ", BodyParts=" +
        bpQuestion.length +
        ", expected=" +
        expectedExact +
        ")"
    );
  }
  if (clippedOutTargets.length) {
    clippedWindowFailures.push({
      specimenId: specimen.id,
      window: windowFractions,
      targets: clippedOutTargets.map((target) => {
        const parts = (target.sourceNames || [])
          .map((name) => bpPartByName.get(name))
          .filter(Boolean);
        const mins = parts
          .map((part) => Number(part.bounds?.[0]?.[1]))
          .filter(Number.isFinite);
        const maxs = parts
          .map((part) => Number(part.bounds?.[1]?.[1]))
          .filter(Number.isFinite);
        const minFraction = mins.length
          ? (Math.min(...mins) - bpBodyMinY) / bpBodyHeight
          : null;
        const maxFraction = maxs.length
          ? (Math.max(...maxs) - bpBodyMinY) / bpBodyHeight
          : null;
        return {
          nameRu: target.nameRu,
          range:
            minFraction == null || maxFraction == null
              ? null
              : [
                  Math.round(minFraction * 1000) / 1000,
                  Math.round(maxFraction * 1000) / 1000,
                ],
        };
      }),
    });
  }

  if (specimen.id === "abdomen" || specimen.id === "anterior-abdominal-wall") {
    assert(zDepth.supported, specimen.id + ": Z-Anatomy should support full abdominal depth");
    assert(
      !bpDepth.supported && bpDepth.reason === "source-incomplete",
      specimen.id + ": BodyParts3D must be marked incomplete for abdominal depth"
    );
  }

  if (semanticMismatches.length) {
    const details = semanticMismatches.map((id) => {
      const zTarget = sources.z.find((item) => item.id === id);
      const bpTarget = sources.bp.find((item) => item.id === id);
      return {
        id,
        zIncluded: zIds.has(id),
        bpIncluded: bpIds.has(id),
        zName: zTarget?.nameRu || null,
        bpName: bpTarget?.nameRu || null,
        zSources: zTarget?.sourceNames || [],
        bpSources: bpTarget?.sourceNames || [],
      };
    });
    console.log(
      "Specimen semantic mismatch:",
      specimen.id,
      JSON.stringify(details)
    );
  }
}

assert(emptyTotal === 0, "At least one virtual specimen is empty in an anatomy source");
assert(
  semanticMismatchTotal === 0,
  "Shared muscle concepts are assigned inconsistently across virtual specimens"
);
assert(
  clippedWindowFailures.length === 0,
  "Spatial windows completely clip BodyParts learning targets: " +
    clippedWindowFailures
      .map(
        (entry) =>
          entry.specimenId +
          " window=" +
          entry.window.join(":") +
          " => " +
          entry.targets
            .map(
              (target) =>
                target.nameRu +
                (target.range ? " [" + target.range.join(":") + "]" : "")
            )
            .join(" | ")
      )
      .join(" || ")
);

console.log("Virtual specimen cross-source audit: ok");
console.log("BodyParts specimen-window target coverage: ok");
