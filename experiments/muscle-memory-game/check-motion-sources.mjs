import {
  MOTION_SOURCES,
  PILOT_SOURCE_POLICY,
  primaryMotionSource,
} from "./motion-sources.js";
import { createMotionClip, sampleMotionClip } from "./motion-clip.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tsm = MOTION_SOURCES["thoracoscapular-shoulder"];
const myo = MOTION_SOURCES["myosim-arm"];

assert(
  PILOT_SOURCE_POLICY.shoulder.primary === tsm.id,
  "Shoulder primary source must be TSM"
);
assert(
  PILOT_SOURCE_POLICY.scapula.primary === tsm.id,
  "Scapula primary source must be TSM"
);
assert(
  PILOT_SOURCE_POLICY.elbow.primary === myo.id,
  "Elbow primary source must be MyoArm"
);
assert(
  PILOT_SOURCE_POLICY.wrist.primary === myo.id,
  "Wrist primary source must be MyoArm"
);
assert(
  tsm.runtimePolicy === "precomputed-motion-clips",
  "TSM must stay offline at runtime"
);

const raw = (source, path) =>
  "https://raw.githubusercontent.com/" +
  source.repository +
  "/" +
  source.revision +
  "/" +
  path.split("/").map(encodeURIComponent).join("/");

const [tsmModel, abd, flx, shrug, myoChain] = await Promise.all([
  fetch(raw(tsm, tsm.modelPath)),
  fetch(raw(tsm, tsm.sampleMotionPaths.abduction)),
  fetch(raw(tsm, tsm.sampleMotionPaths.flexion)),
  fetch(raw(tsm, tsm.sampleMotionPaths.shrug)),
  fetch(raw(myo, myo.modelPath)),
]);

assert(
  [tsmModel, abd, flx, shrug, myoChain].every((response) => response.ok),
  "Could not fetch one or more pinned biomechanics sources"
);

const modelText = await tsmModel.text();
for (const token of [
  'Model name="ThoracoscapularShoulderModel-scaled"',
  "<ScapulothoracicJoint",
  'name="sternoclavicular"',
  'name="GlenoHumeral"',
  'Body name="clavicle"',
  'Body name="scapula"',
  'Body name="humerus"',
]) {
  assert(modelText.includes(token), "TSM model contract missing: " + token);
}
for (const coordinate of tsm.coordinates) {
  assert(
    modelText.includes('name="' + coordinate + '"'),
    "TSM coordinate missing: " + coordinate
  );
}

for (const [label, response] of [
  ["ABD01", abd],
  ["FLX01", flx],
  ["SHRUG01", shrug],
]) {
  const text = await response.text();
  assert(/endheader/i.test(text), label + ": .mot header incomplete");
  for (const coordinate of [
    "clav_prot",
    "clav_elev",
    "scapula_abduction",
    "scapula_elevation",
    "scapula_upward_rot",
    "scapula_winging",
    "plane_elv",
    "shoulder_elv",
    "axial_rot",
  ]) {
    assert(
      text.includes(coordinate),
      label + ": coordinate missing: " + coordinate
    );
  }
}

const myoText = await myoChain.text();
for (const token of [
  'name="humerus_r"',
  'name="ulna_r"',
  'name="radius_r"',
  'name="elbow_flexion_r"',
  'name="pro_sup_r"',
  'name="flexion_r"',
  'name="deviation_r"',
]) {
  assert(myoText.includes(token), "MyoArm distal contract missing: " + token);
}

const identity = [1, 0, 0, 0];
const clip = createMotionClip({
  id: "test-shoulder",
  pilotId: "shoulder",
  movementId: "shoulder-abduction",
  sourceId: tsm.id,
  sourceRevision: tsm.revision,
  frames: [
    {
      time: 0,
      bodies: {
        scapula: { position: [0, 0, 0], quaternion: identity },
        clavicle: { position: [0, 0, 0], quaternion: identity },
        humerus: { position: [0, 0, 0], quaternion: identity },
      },
    },
    {
      time: 1,
      bodies: {
        scapula: { position: [0, 1, 0], quaternion: identity },
        clavicle: { position: [1, 0, 0], quaternion: identity },
        humerus: { position: [0, 0, 1], quaternion: identity },
      },
    },
  ],
});
const half = sampleMotionClip(clip, 0.5);
assert(
  Math.abs(half.bodies.scapula.position[1] - 0.5) < 1e-9,
  "Clip interpolation failed"
);
assert(
  primaryMotionSource("shoulder")?.id === tsm.id,
  "Primary source lookup failed"
);

console.log(
  "Motion sources: pinned TSM shoulder + pinned MyoArm distal chain verified"
);
console.log(
  "Motion clip contract: rigid-body source transforms validated and interpolated"
);
