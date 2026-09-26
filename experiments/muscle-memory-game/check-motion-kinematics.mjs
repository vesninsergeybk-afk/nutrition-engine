import {
  ELBOW_KINEMATIC_LIMITS,
  advanceElbowAngle,
  clampElbowAngle,
  contractionScale,
  elbowActivation,
  elbowFlexionRadians,
  elbowMotionAction,
} from "./motion-kinematics.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const biceps = elbowMotionAction(["biceps-long", "biceps-short"]);
assert(biceps?.pilotId === "elbow", "Biceps must resolve to elbow pilot");
assert(biceps.direction === "flexion", "Biceps must resolve to flexion");
assert(biceps.startDeg === 0, "Flexion preview must start in extension");

const triceps = elbowMotionAction(["triceps-long"]);
assert(triceps?.direction === "extension", "Triceps must resolve to extension");
assert(triceps.startDeg === 120, "Extension preview must start flexed");

assert(
  elbowMotionAction(["biceps-long", "triceps-long"]) === null,
  "Competing antagonist activation must wait for the simulation engine"
);
assert(clampElbowAngle(-10) === 0 && clampElbowAngle(160) === 120, "Angle clamp failed");
assert(
  Math.abs(elbowFlexionRadians(90) + Math.PI / 2) < 1e-9,
  "Elbow flexion rotation convention changed"
);
assert(elbowActivation(0, "flexion") === 0, "Flexor activation at rest must be zero");
assert(elbowActivation(120, "flexion") === 1, "Flexor activation at flexion must be one");
assert(elbowActivation(0, "extension") === 1, "Extensor activation convention failed");

const contracted = contractionScale(120, "flexion");
assert(contracted.y < 1 && contracted.x > 1 && contracted.z > 1, "Contraction visual cue is broken");

const advanced = advanceElbowAngle(
  118,
  1,
  1,
  ELBOW_KINEMATIC_LIMITS
);
assert(
  advanced.angleDeg === 120 && advanced.direction === -1,
  "Playback must reverse at the flexion limit"
);

console.log("Elbow kinematic preview: flexion/extension contract ok");
console.log("Elbow kinematic preview: activation/contraction cue ok");
