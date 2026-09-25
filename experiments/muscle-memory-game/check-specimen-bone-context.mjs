import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import {
  VIRTUAL_SPECIMENS,
  specimenSupportBoneMatches,
} from "./virtual-specimens.js";

const Z_SKELETON_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/iskelet.glb";
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

const [zr,bpr]=await Promise.all([fetch(Z_SKELETON_URL),fetch(BP_URL)]);
assert(zr.ok && bpr.ok,"Could not fetch pinned skeleton sources");

const zJson=parseGlbJson(await zr.arrayBuffer());
const zBones=[...new Set(
  (zJson.nodes||[])
    .filter(node=>node.mesh!==undefined && node.name)
    .map(node=>node.name.trim())
)];
const bpAtlas=await bpr.json();
const bpBones=bpAtlas.parts
  .filter(part=>bodyPartsAnatomyKind(part)==="bone")
  .map(part=>part.name);

let neither=0;
const pelvicAnchorSpecimens = new Set([
  "abdomen",
  "lower-back",
  "gluteal",
  "thigh-anterior",
  "thigh-medial",
  "thigh-posterior",
  "hamstrings",
  "quadriceps",
  "adductors",
  "gluteal-complex",
  "anterior-abdominal-wall",
  "hip-flexors",
]);

for(const specimen of VIRTUAL_SPECIMENS){
  const z=zBones.filter(name=>specimenSupportBoneMatches(specimen.id,name));
  const bp=bpBones.filter(name=>specimenSupportBoneMatches(specimen.id,name));
  console.log("Specimen bone anchors:",JSON.stringify({
    id:specimen.id,
    z:z.length,
    bp:bp.length,
    zSample:z.slice(0,3),
    bpSample:bp.slice(0,3),
  }));
  if(!z.length && !bp.length) neither+=1;
  assert(z.length > 0, specimen.id + ": Z-Anatomy has no named bone anchors");
  assert(bp.length > 0, specimen.id + ": BodyParts3D has no named bone anchors");

  if (specimen.id === "shoulder" || specimen.id === "rotator-cuff") {
    for (const required of [/scapula/i, /clavicle/i, /humerus/i]) {
      assert(
        z.some((name) => required.test(name)),
        specimen.id + ": Z-Anatomy shoulder anchors are incomplete"
      );
      assert(
        bp.some((name) => required.test(name)),
        specimen.id + ": BodyParts3D shoulder anchors are incomplete"
      );
    }
  }

  if (specimen.id === "forearm-hand-anterior" || specimen.id === "forearm-hand-posterior") {
    assert(
      !z.some((name) => /toe|foot/i.test(name)) &&
      !bp.some((name) => /toe|foot/i.test(name)),
      specimen.id + ": foot phalanges leaked into hand bone anchors"
    );
  }

  if (pelvicAnchorSpecimens.has(specimen.id)) {
    assert(
      bp.some((name) => /hip bone/i.test(name)),
      specimen.id + ": BodyParts3D pelvic context is missing the hip bone"
    );
  }
}
assert(neither===0,"A virtual specimen has no named bone anchors in either source");
console.log("Virtual specimen bone-anchor audit: ok");
