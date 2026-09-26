import {
  MOTION_PILOTS,
  motionVisualUnit,
} from "./motion-readiness.js";
import {
  MOTION_REGISTRATION_SPECS,
  MOTION_CALIBRATION,
  requiredSimulationBodies,
  requiredSimulationJoints,
  requiredAtlasLandmarks,
  registrationReady,
} from "./motion-registration.js";
import {
  createActivationFrame,
  createMotionSnapshot,
  pilotActuators,
} from "./motion-contract.js";
import {
  MOTION_SOURCES,
  primaryMotionSource,
} from "./motion-sources.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const MYO = MOTION_SOURCES["myosim-arm"];
const TSM = MOTION_SOURCES["thoracoscapular-shoulder"];

function rawUrl(source, path) {
  return (
    "https://raw.githubusercontent.com/" +
    source.repository +
    "/" +
    source.revision +
    "/" +
    path.split("/").map(encodeURIComponent).join("/")
  );
}

const [chainResponse, muscleResponse, tsmResponse] = await Promise.all([
  fetch(rawUrl(MYO, MYO.modelPath)),
  fetch(rawUrl(MYO, MYO.musclePath)),
  fetch(rawUrl(TSM, TSM.modelPath)),
]);
assert(
  chainResponse.ok && muscleResponse.ok && tsmResponse.ok,
  "Could not fetch pinned biomechanics models"
);
const chain = await chainResponse.text();
const muscle = await muscleResponse.text();
const tsmModel = await tsmResponse.text();

for (const pilot of Object.values(MOTION_PILOTS)) {
  const spec = MOTION_REGISTRATION_SPECS[pilot.id];
  assert(spec, "Missing registration spec for " + pilot.id);

  const source = primaryMotionSource(pilot.id);
  assert(source, pilot.id + ": primary motion source missing");
  const sourceText =
    source.id === "thoracoscapular-shoulder" ? tsmModel : chain;

  for (const bodyName of requiredSimulationBodies(pilot.id)) {
    assert(
      sourceText.includes('name="' + bodyName + '"'),
      pilot.id + ": source body missing: " + bodyName
    );
  }

  for (const jointName of requiredSimulationJoints(pilot.id)) {
    assert(
      sourceText.includes('name="' + jointName + '"'),
      pilot.id + ": source coordinate/joint missing: " + jointName
    );
  }

  if (source.id === "myosim-arm") {
    for (const unitId of pilot.muscleUnits) {
      const unit = motionVisualUnit(unitId);
      for (const actuator of unit.myoActuators) {
        assert(
          muscle.includes('name="' + actuator + '"'),
          pilot.id + ": MyoSim actuator missing: " + actuator
        );
      }
    }
  }

  const landmarks = requiredAtlasLandmarks(pilot.id);
  for (const [bodyId, names] of Object.entries(landmarks)) {
    assert(
      names.length >= 3,
      pilot.id + ": " + bodyId + " needs >=3 rest-pose registration landmarks"
    );
    assert(
      new Set(names).size === names.length,
      pilot.id + ": duplicate registration landmark on " + bodyId
    );
  }

  if (pilot.requiresMyoActuators !== false) {
    const frame = createActivationFrame(pilot.id, {});
    assert(
      Object.keys(frame.actuators).length === pilotActuators(pilot.id).length,
      pilot.id + ": activation frame does not cover all pilot actuators"
    );
  }
}

for (const source of ["z-anatomy", "bodyparts4"]) {
  for (const pilotId of Object.keys(MOTION_REGISTRATION_SPECS)) {
    assert(
      !registrationReady(source, pilotId),
      source + "/" + pilotId + ": uncalibrated registration must not be reported as verified"
    );
    assert(
      MOTION_CALIBRATION[source][pilotId]?.status ===
        "pending-landmark-calibration",
      source + "/" + pilotId + ": calibration state must remain explicit"
    );
  }
}

const snapshot = createMotionSnapshot("elbow", {
  time: 0.01,
  bodies: {
    humerus: { position: [0, 0, 0], quaternion: [1, 0, 0, 0] },
    ulna: { position: [0, -0.3, 0], quaternion: [1, 0, 0, 0] },
  },
});
assert(snapshot.bodies.ulna.position[1] === -0.3, "Motion snapshot normalization failed");

let rejected = false;
try {
  createActivationFrame("elbow", { NOT_A_MUSCLE: 1 });
} catch {
  rejected = true;
}
assert(rejected, "Unknown simulation actuator must be rejected");

console.log("Motion simulation contract: TSM shoulder/scapula + MyoArm distal source contracts verified");
console.log("Motion registration contract: explicit landmark calibration required");
console.log("Motion frame contract: activations and body transforms normalized");
