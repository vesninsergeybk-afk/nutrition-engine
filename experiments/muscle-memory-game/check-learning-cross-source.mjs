import {
  buildMuscleCatalog,
  filterCatalogByRegion,
} from "./learning-engine.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";

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

const [zResponse, bpResponse] = await Promise.all([fetch(Z_URL), fetch(BP_URL)]);
assert(zResponse.ok && bpResponse.ok, "Could not fetch pinned anatomy sources");

const zJson = parseGlbJson(await zResponse.arrayBuffer());
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

const bpAtlas = await bpResponse.json();
const bpNames = bpAtlas.parts
  .filter((part) => bodyPartsAnatomyKind(part) === "muscle")
  .map((part) => part.name);

const zCatalog = buildMuscleCatalog(zNames);
const bpCatalog = buildMuscleCatalog(bpNames);

const zIds = new Set(zCatalog.map((item) => item.id));
const bpIds = new Set(bpCatalog.map((item) => item.id));
const shared = [...zIds].filter((id) => bpIds.has(id));

const zShoulder = zCatalog.filter((item) => item.region === "shoulder");
const bpShoulder = bpCatalog.filter((item) => item.region === "shoulder");
const zShoulderIds = new Set(zShoulder.map((item) => item.id));
const bpShoulderIds = new Set(bpShoulder.map((item) => item.id));
const sharedShoulder = [...zShoulderIds].filter((id) => bpShoulderIds.has(id));

const onlyZShoulder = zShoulder.filter((item) => !bpShoulderIds.has(item.id));
const onlyBpShoulder = bpShoulder.filter((item) => !zShoulderIds.has(item.id));

console.log("Cross-source learning targets:", {
  z: zCatalog.length,
  bodyParts: bpCatalog.length,
  shared: shared.length,
  commonCoverage: Math.round(
    (shared.length / Math.max(1, Math.min(zCatalog.length, bpCatalog.length))) * 1000
  ) / 10 + "%",
});
console.log("Shoulder overlap:", {
  z: zShoulder.length,
  bodyParts: bpShoulder.length,
  shared: sharedShoulder.length,
});
console.log("Only Z shoulder:", onlyZShoulder.map((item) => item.nameRu).join(" | ") || "none");
console.log("Only BodyParts shoulder:", onlyBpShoulder.map((item) => item.nameRu).join(" | ") || "none");

const commonCoverage =
  shared.length / Math.max(1, Math.min(zCatalog.length, bpCatalog.length));

assert(
  commonCoverage >= 0.84,
  "Too little cross-source catalog overlap for common concepts: " +
    shared.length + "/" + Math.min(zCatalog.length, bpCatalog.length)
);
assert(
  sharedShoulder.length >= Math.min(zShoulder.length, bpShoulder.length) - 1,
  "Shoulder learning IDs diverge across model sources"
);

for (const expectedName of [
  "Надостная мышца",
  "Подостная мышца",
  "Подлопаточная мышца",
  "Большая круглая мышца",
  "Малая круглая мышца",
]) {
  const z = zCatalog.find((item) => item.nameRu === expectedName);
  const bp = bpCatalog.find((item) => item.nameRu === expectedName);
  assert(z && bp, "Missing cross-source muscle: " + expectedName);
  assert(z.id === bp.id, "Cross-source ID mismatch: " + expectedName);
}

console.log("Cross-source stable IDs: ok");

function scopeOverlap(scopeId) {
  const zScope = filterCatalogByRegion(zCatalog, scopeId);
  const bpScope = filterCatalogByRegion(bpCatalog, scopeId);
  const zScopeIds = new Set(zScope.map((item) => item.id));
  const bpScopeIds = new Set(bpScope.map((item) => item.id));
  const common = [...zScopeIds].filter((id) => bpScopeIds.has(id));
  const denominator = Math.max(1, Math.min(zScope.length, bpScope.length));

  return {
    scopeId,
    z: zScope,
    bp: bpScope,
    shared: common,
    coverage: common.length / denominator,
  };
}

const scopeContracts = [
  ["shoulder", 0.90],
  ["upper-limb", 0.80],
  ["lower-limb", 0.80],
  ["neck", 0.70],
  ["neck-collar", 0.70],
  ["foot", 0.70],
  ["erector-spinae", 0.70],
  ["rotator-cuff", 1.00],
  ["scapular-stabilizers", 0.80],
];

for (const [scopeId, minimumCoverage] of scopeContracts) {
  const result = scopeOverlap(scopeId);

  console.log("Scope overlap:", {
    scope: scopeId,
    z: result.z.length,
    bodyParts: result.bp.length,
    shared: result.shared.length,
    coverage:
      Math.round(result.coverage * 1000) / 10 + "%",
  });

  assert(result.z.length > 0, "Z-Anatomy scope is empty: " + scopeId);
  assert(result.bp.length > 0, "BodyParts scope is empty: " + scopeId);
  assert(
    result.coverage >= minimumCoverage,
    "Cross-source scope divergence for " + scopeId + ": " +
      result.shared.length + "/" +
      Math.min(result.z.length, result.bp.length)
  );

  if (scopeId === "rotator-cuff") {
    assert(
      result.z.length === 4 &&
      result.bp.length === 4 &&
      result.shared.length === 4,
      "Rotator-cuff scope must be exactly 4/4 in both sources"
    );
  }
}

console.log("Cross-source regional scopes: ok");
