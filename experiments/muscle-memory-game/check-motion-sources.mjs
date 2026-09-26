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
assert(
  tsm.sourceStage === "opensim-cmc-kinematics" &&
    tsm.desiredKinematicsLowpassHz === 3,
  "TSM teaching source must be the CMC kinematics with documented 3 Hz desired-kinematics filter"
);

const raw = (source, path) =>
  "https://raw.githubusercontent.com/" +
  source.repository +
  "/" +
  source.revision +
  "/" +
  path.split("/").map(encodeURIComponent).join("/");

const sourceRequests = [
  fetch(raw(tsm, tsm.modelPath)),
  ...Object.values(tsm.sampleMotionPaths).map((path) => fetch(raw(tsm, path))),
  ...Object.values(tsm.rawIkMotionPaths).map((path) => fetch(raw(tsm, path))),
  ...Object.values(tsm.cmcSetupPaths).map((path) => fetch(raw(tsm, path))),
  fetch(raw(myo, myo.modelPath)),
];
const responses = await Promise.all(sourceRequests);
assert(
  responses.every((response) => response.ok),
  "Could not fetch one or more pinned biomechanics sources"
);

const [
  tsmModel,
  abd,
  flx,
  shrug,
  rawAbd,
  rawFlx,
  rawShrug,
  setupAbd,
  setupFlx,
  setupShrug,
  myoChain,
] = responses;

const modelText = await tsmModel.text();
for (const token of [
  'Model name="ThoracoscapularShoulderModel-scaled"',
  "<ScapulothoracicJoint",
  'name="sternoclavicular"',
  'name="GlenoHumeral"',
  'Body name="thorax"',
  'Body name="clavicle"',
  'Body name="scapula"',
  'Body name="humerus"',
]) {
  assert(modelText.includes(token), "TSM CMC model contract missing: " + token);
}
for (const coordinate of tsm.coordinates) {
  assert(
    modelText.includes('name="' + coordinate + '"'),
    "TSM coordinate missing: " + coordinate
  );
}

for (const [label, response] of [
  ["ABD CMC", abd],
  ["FLX CMC", flx],
  ["SHRUG CMC", shrug],
  ["ABD raw IK provenance", rawAbd],
  ["FLX raw IK provenance", rawFlx],
  ["SHRUG raw IK provenance", rawShrug],
]) {
  const text = await response.text();
  assert(/endheader/i.test(text), label + ": storage header incomplete");
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

for (const [label, response] of [
  ["ABD CMC setup", setupAbd],
  ["FLX CMC setup", setupFlx],
  ["SHRUG CMC setup", setupShrug],
]) {
  const text = await response.text();
  assert(
    /<lowpass_cutoff_frequency>\s*3(?:\.0+)?\s*<\/lowpass_cutoff_frequency>/.test(
      text
    ),
    label + ": expected 3 Hz desired-kinematics low-pass setting"
  );
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
const ninetyZ = [
  Math.SQRT1_2,
  0,
  0,
  Math.SQRT1_2,
];
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
        humerus: { position: [0, 0, 1], quaternion: ninetyZ },
      },
    },
  ],
});
const half = sampleMotionClip(clip, 0.5);
assert(
  Math.abs(half.bodies.scapula.position[1] - 0.5) < 1e-9,
  "Clip translation interpolation failed"
);
const expectedHalfAngle = Math.PI / 4;
const halfHumerus = half.bodies.humerus.quaternion;
assert(
  Math.abs(2 * Math.acos(Math.min(1, Math.abs(halfHumerus[0]))) - expectedHalfAngle) <
    1e-9,
  "Clip quaternion interpolation must use the spherical shortest path"
);
assert(
  primaryMotionSource("shoulder")?.id === tsm.id,
  "Primary source lookup failed"
);

console.log(
  "Motion sources: pinned TSM CMC shoulder + pinned MyoArm distal chain verified"
);
console.log(
  "Motion source provenance: raw IK retained, CMC setup confirms 3 Hz desired-kinematics low-pass"
);
console.log(
  "Motion clip contract: rigid-body transforms validated with SLERP interpolation"
);
