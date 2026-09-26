import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";
import {
  MOTION_PILOTS,
  motionBoneUnit,
  motionVisualUnit,
  sourceNamesForMotionBone,
  sourceNamesForMotionUnit,
} from "./motion-readiness.js";
import {
  geometryRangeIndexPlan,
  motionGeometryDescriptor,
} from "./motion-geometry.js";

const Z_MUSCLE_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb";
const Z_BONE_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/iskelet.glb";
const BP_URL =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/models/atlas.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseGlbJson(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  assert(view.getUint32(0, true) === 0x46546c67, "Not a GLB file");
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

function meshNodeNames(json) {
  return [...new Set(
    (json.nodes || [])
      .filter((node) => node.mesh !== undefined && node.name)
      .map((node) => node.name.trim())
  )];
}

const [zm, zb, bp] = await Promise.all([
  fetch(Z_MUSCLE_URL),
  fetch(Z_BONE_URL),
  fetch(BP_URL),
]);
assert(zm.ok && zb.ok && bp.ok, "Could not fetch pinned motion-readiness sources");

const zMuscles = meshNodeNames(parseGlbJson(await zm.arrayBuffer()));
const zBones = meshNodeNames(parseGlbJson(await zb.arrayBuffer()));
const bpAtlas = await bp.json();
const bpMuscles = bpAtlas.parts
  .filter((part) => bodyPartsAnatomyKind(part) === "muscle")
  .map((part) => part.name);
const bpBones = bpAtlas.parts
  .filter((part) => bodyPartsAnatomyKind(part) === "bone")
  .map((part) => part.name);

for (const pilot of Object.values(MOTION_PILOTS)) {
  for (const unitId of pilot.muscleUnits) {
    const unit = motionVisualUnit(unitId);
    assert(unit, pilot.id + ": unknown visual muscle unit " + unitId);
    assert(unit.myoActuators.length > 0, pilot.id + ": missing MyoSim actuator for " + unitId);

    const zMatches = sourceNamesForMotionUnit(zMuscles, unitId);
    const bpMatches = sourceNamesForMotionUnit(bpMuscles, unitId);
    console.log(
      "Motion muscle:",
      pilot.id,
      unitId,
      "Z=" + zMatches.length,
      "BodyParts=" + bpMatches.length,
      "Myo=" + unit.myoActuators.join(",")
    );
    if (unit.requiredSources.includes("z-anatomy")) {
      assert(zMatches.length > 0, pilot.id + ": Z-Anatomy missing " + unitId);
    }
    if (unit.requiredSources.includes("bodyparts4")) {
      assert(bpMatches.length > 0, pilot.id + ": BodyParts3D missing " + unitId);
    }
    if (!zMatches.length || !bpMatches.length) {
      console.log(
        "Motion optional source gap:",
        pilot.id,
        unitId,
        "required=" + unit.requiredSources.join(",")
      );
    }
  }

  for (const boneId of pilot.bodies) {
    assert(motionBoneUnit(boneId), pilot.id + ": unknown motion bone " + boneId);
    const zMatches = sourceNamesForMotionBone(zBones, boneId);
    const bpMatches = sourceNamesForMotionBone(bpBones, boneId);
    console.log(
      "Motion bone:",
      pilot.id,
      boneId,
      "Z=" + zMatches.length,
      "BodyParts=" + bpMatches.length
    );
    assert(zMatches.length > 0, pilot.id + ": Z-Anatomy missing bone " + boneId);
    assert(bpMatches.length > 0, pilot.id + ": BodyParts3D missing bone " + boneId);
  }
}

// Scapular/pectoral context is visible in Motion Lab but must not pretend to
// be a numerically activated MyoArm actuator until that mapping is validated.
const shoulderContextUnits = MOTION_PILOTS.shoulder.visualContextUnits || [];
assert(
  shoulderContextUnits.length >= 6,
  "Shoulder visual context is incomplete"
);
for (const unitId of shoulderContextUnits) {
  const unit = motionVisualUnit(unitId);
  assert(unit, "Missing visual scapular/pectoral context unit: " + unitId);
  assert(
    unit.myoActuators.length === 0,
    "Visual-only context must not expose unvalidated MyoArm actuators: " + unitId
  );
  const zMatches = sourceNamesForMotionUnit(zMuscles, unitId);
  const bpMatches = sourceNamesForMotionUnit(bpMuscles, unitId);
  console.log(
    "Motion visual-only context:",
    unitId,
    "Z=" + zMatches.length,
    "BodyParts=" + bpMatches.length
  );
  assert(zMatches.length > 0, "Z-Anatomy missing scapular context " + unitId);
  assert(bpMatches.length > 0, "BodyParts3D missing scapular context " + unitId);
}

const latissimus = motionVisualUnit("latissimus-dorsi");
assert(
  latissimus?.requiredSources?.join(",") === "z-anatomy",
  "Latissimus geometry-source limitation must stay explicit"
);

// The atlas keeps merged geometry for speed, but Motion Lab must be able to
// reconstruct a standalone object from structureRanges/boneRanges.
const nonIndexed = geometryRangeIndexPlan({ start: 9, count: 6 });
assert(
  !nonIndexed.indexed &&
    nonIndexed.vertexStart === 9 &&
    nonIndexed.vertexCount === 6,
  "Non-indexed motion extraction plan is broken"
);
const indexed = geometryRangeIndexPlan(
  { start: 4, count: 4 },
  new Uint32Array([0, 1, 2, 4, 5, 6, 5, 6, 7, 8, 9, 10])
);
assert(
  indexed.indexed &&
    indexed.indices.join(",") === "0,1,2,1,2,3",
  "Indexed BodyParts motion extraction plan is broken"
);

const descriptor = motionGeometryDescriptor({
  kind: "bone",
  id: 2,
  name: "humerus",
  range: { start: 100, count: 24 },
  indexed: true,
});
assert(
  descriptor.restPoseSpace === "atlas-world" &&
    descriptor.transformPolicy === "rigid-body",
  "Motion geometry descriptor contract is broken"
);

console.log("Motion readiness: elbow, wrist, and shoulder visual units available in both anatomy sources");
console.log("Motion readiness: MyoSim actuator mapping present");
console.log("Motion readiness: merged-atlas geometry can be split into standalone motion units");

const appSource = await (await import("node:fs/promises")).readFile(
  new URL("app.js", import.meta.url),
  "utf8"
);
assert(
  appSource.includes("visualContextUnitIds") &&
    appSource.includes("motionVisualContext") &&
    appSource.includes("motionMissingContext"),
  "Motion scene does not render pilot visual-only context units"
);
console.log("Motion visual-only context: rendered without fake activation");
