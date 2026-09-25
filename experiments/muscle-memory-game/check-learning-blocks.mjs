import {
  buildMuscleCatalog,
} from "./learning-engine.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import {
  filterCatalogForSpecimen,
  specimenById,
} from "./virtual-specimens.js";

const Z_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb";
const BP_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";

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
    .filter((node) => node.mesh !== undefined && node.name)
    .map((node) => node.name.trim())
)];
const bpAtlas = await bpr.json();
const bpNames = bpAtlas.parts
  .filter((part) => bodyPartsAnatomyKind(part) === "muscle")
  .map((part) => part.name);

const sources = {
  "Z-Anatomy": buildMuscleCatalog(zNames),
  "BodyParts3D": buildMuscleCatalog(bpNames),
};

for (const required of [
  "head-neck",
  "shoulder",
  "arm",
  "forearm-hand",
  "thorax",
  "back",
  "abdomen",
  "pelvis",
  "gluteal",
  "thigh",
  "leg-foot",
]) {
  assert(specimenById(required), "Curated broad block is missing: " + required);
}

function textOf(target) {
  return [target.nameRu, ...(target.sourceNames || [])].join(" ");
}
function has(block, re) {
  return block.some((target) => re.test(textOf(target)));
}

for (const [sourceName, catalog] of Object.entries(sources)) {
  const back = filterCatalogForSpecimen(catalog, "back", "question");
  for (const [label, re] of [
    ["trapezius", /trapezius|трапециевид/i],
    ["latissimus dorsi", /latissimus dorsi|широчайш/i],
    ["rhomboid", /rhomboid|ромбовид/i],
    ["levator scapulae", /levator scapulae|поднимающ.*лопат/i],
    ["erector-spinae component", /iliocostalis|longissimus thoracis|spinalis thoracis|подвздошно-р[её]бер|длиннейш.*груди|остистая мышца груди/iu],
    ["deep intrinsic back", /multifidus|rotator|interspinal|intertransversar|многораздель|вращател|межостист|межпопереч/iu],
  ]) {
    assert(has(back, re), sourceName + " back block is missing " + label);
  }
  assert(
    !has(back, /pectoralis major|большая грудная/i),
    sourceName + " back block leaked pectoralis major"
  );

  const thorax = filterCatalogForSpecimen(catalog, "thorax", "question");
  for (const [label, re] of [
    ["pectoralis major", /pectoralis major|большая грудная/i],
    ["pectoralis minor", /pectoralis minor|малая грудная/i],
    ["serratus anterior", /serratus anterior|передн.*зубчат/iu],
    ["subclavius", /subclavius|подключич/iu],
    ["intercostal", /intercostal|межр[её]бер/iu],
  ]) {
    assert(has(thorax, re), sourceName + " thorax block is missing " + label);
  }

  const thigh = filterCatalogForSpecimen(catalog, "thigh", "question");
  for (const re of [
    /rectus femoris|прямая мышца бедра/i,
    /adductor|приводящ/iu,
    /biceps femoris|двуглав.*бедра/iu,
  ]) {
    assert(has(thigh, re), sourceName + " whole-thigh block lost a major compartment");
  }

  const leg = filterCatalogForSpecimen(catalog, "leg-foot", "question");
  for (const re of [
    /tibialis anterior|передн.*большеберц/iu,
    /fibularis|peroneus|малоберцов/iu,
    /gastrocnemius|икронож/iu,
    /soleus|камбаловид/iu,
  ]) {
    assert(has(leg, re), sourceName + " leg/foot block lost a major compartment");
  }

  console.log(
    "Curated broad blocks:",
    sourceName,
    JSON.stringify({
      headNeck: filterCatalogForSpecimen(catalog, "head-neck").length,
      arm: filterCatalogForSpecimen(catalog, "arm").length,
      forearmHand: filterCatalogForSpecimen(catalog, "forearm-hand").length,
      thorax: thorax.length,
      back: back.length,
      pelvis: filterCatalogForSpecimen(catalog, "pelvis").length,
      thigh: thigh.length,
      legFoot: leg.length,
    })
  );
}

console.log("Curated learning-block anatomy: ok");
