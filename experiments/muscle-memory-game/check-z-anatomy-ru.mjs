import { structureTerm } from "./anatomy-terms-ru.js";
import { buildMuscleCatalog, regionCounts } from "./learning-engine.js";

const MUSCLE_MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb";

const COVER_RE =
  /fascia|aponeuros|retinacul|peritone|pleura|dura mater|pericardi|omentum|epicardium/i;

const NON_MUSCLE_RE =
  /bursa|bursae|tendon|tendinous|sheath|ligament|tract|septum|tarsus|linea alba|trochlea|synovial|fibrous sheath|iliopectineal arch|common tendinous ring/i;

function parseGlbJson(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0, true) !== 0x46546c67) {
    throw new Error("Not a GLB file");
  }
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

const response = await fetch(MUSCLE_MODEL_URL);
if (!response.ok) throw new Error("Could not fetch pinned Z-Anatomy muscle GLB");
const json = parseGlbJson(await response.arrayBuffer());

const names = [...new Set(
  (json.nodes || [])
    .filter(
      node =>
        node.mesh !== undefined &&
        node.name &&
        !COVER_RE.test(node.name) &&
        !NON_MUSCLE_RE.test(node.name)
    )
    .map(node => node.name.trim())
)].sort((a, b) => a.localeCompare(b));

const missing = names.filter(name => {
  const term = structureTerm(name);
  return !term.nameRu || term.nameRu === name || !/[А-Яа-яЁё]/.test(term.nameRu);
});

console.log("Z-Anatomy muscle meshes:", names.length);
console.log("Russian names:", names.length - missing.length + "/" + names.length);
if (missing.length) {
  console.log("Missing Russian names:");
  for (const name of missing) console.log(name);
  process.exitCode = 1;
}


const learningCatalog = buildMuscleCatalog(names);
const represented = learningCatalog.reduce((sum, item) => sum + item.sids.length, 0);
const learningRegions = regionCounts(learningCatalog);
const unclassified = learningCatalog.filter((item) => item.region === "other");

console.log("Z-Anatomy learning targets:", learningCatalog.length);
console.log("Z-Anatomy learning regions:", JSON.stringify(learningRegions));
console.log("Z-Anatomy unclassified targets:", unclassified.length);

if (represented !== names.length) {
  console.error("Z-Anatomy learning catalog lost meshes:", represented + "/" + names.length);
  process.exitCode = 1;
}

if (unclassified.length) {
  console.error(
    "Z-Anatomy unclassified learning targets:",
    unclassified.map((item) => item.nameRu).join(" | ")
  );
  process.exitCode = 1;
}
