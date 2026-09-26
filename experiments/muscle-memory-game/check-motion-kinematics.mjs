import {
  ELBOW_KINEMATIC_LIMITS,
  FOREARM_ROTATION_LIMITS,
  SHOULDER_PREVIEW_LIMITS,
  advanceElbowAngle,
  advanceMotionValue,
  clampElbowAngle,
  contractionScale,
  elbowActivation,
  elbowFlexionRadians,
  elbowMotionAction,
  motionActionsForUnits,
  motionActionActivation,
} from "./motion-kinematics.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const biceps = elbowMotionAction(["biceps-long", "biceps-short"]);
assert(biceps?.pilotId === "elbow", "Biceps must resolve to elbow pilot");
assert(biceps.direction === "flexion", "Biceps must resolve to flexion");
assert(biceps.startDeg === 0, "Flexion preview must start in extension");
assert(biceps.maxDeg === 146, "Elbow flexion preview must use the adult active reference range");

const bicepsActions = motionActionsForUnits(["biceps-long"]);
assert(
  bicepsActions.some((item) => item.movementId === "elbow-flexion") &&
    bicepsActions.some((item) => item.movementId === "forearm-supination"),
  "Biceps must expose flexion and supination"
);

const pronatorActions = motionActionsForUnits(["pronator-teres"]);
assert(
  pronatorActions.length === 1 &&
    pronatorActions[0].movementId === "forearm-pronation" &&
    pronatorActions[0].maxDeg === FOREARM_ROTATION_LIMITS.pronationMaxDeg,
  "Pronator teres must expose pronation"
);

const deltoidActions = motionActionsForUnits([
  "deltoid-clavicular",
  "deltoid-acromial",
  "deltoid-spinal",
]);
for (const movementId of [
  "shoulder-flexion",
  "shoulder-abduction",
  "shoulder-extension",
  "shoulder-external-rotation",
  "shoulder-internal-rotation",
]) {
  assert(
    deltoidActions.some((item) => item.movementId === movementId),
    "Deltoid action missing: " + movementId
  );
}
assert(
  SHOULDER_PREVIEW_LIMITS.flexion.previewMaxDeg === 90 &&
    SHOULDER_PREVIEW_LIMITS.flexion.referenceMaxDeg === 160 &&
    SHOULDER_PREVIEW_LIMITS.abduction.previewMaxDeg === 90 &&
    SHOULDER_PREVIEW_LIMITS.abduction.referenceMaxDeg === 150,
  "Shoulder elevation preview must remain honest about the uncalibrated scapular component"
);
const abductionAction = deltoidActions.find(
  (item) => item.movementId === "shoulder-abduction"
);
assert(
  abductionAction.synergists.includes("deltoid-acromial") &&
    abductionAction.synergists.includes("supraspinatus") &&
    abductionAction.stabilizers.includes("infraspinatus") &&
    abductionAction.stabilizers.includes("subscapularis") &&
    abductionAction.stabilizers.includes("teres-minor"),
  "Shoulder abduction must distinguish movers from rotator-cuff stabilizing context"
);


const pectoralisActions = motionActionsForUnits(["pectoralis-major"]);
assert(
  pectoralisActions.some((item) => item.movementId === "shoulder-flexion") &&
    pectoralisActions.some((item) => item.movementId === "shoulder-adduction") &&
    pectoralisActions.some(
      (item) => item.movementId === "shoulder-internal-rotation"
    ),
  "Pectoralis major must contribute to shoulder flexion/adduction/internal rotation preview"
);
const coracobrachialisActions = motionActionsForUnits(["coracobrachialis"]);
assert(
  coracobrachialisActions.some((item) => item.movementId === "shoulder-flexion") &&
    coracobrachialisActions.some((item) => item.movementId === "shoulder-adduction"),
  "Coracobrachialis must contribute to shoulder flexion/adduction preview"
);
const teresMajorActions = motionActionsForUnits(["teres-major"]);
assert(
  teresMajorActions.some((item) => item.movementId === "shoulder-extension") &&
    teresMajorActions.some((item) => item.movementId === "shoulder-adduction") &&
    teresMajorActions.some(
      (item) => item.movementId === "shoulder-internal-rotation"
    ),
  "Teres major must contribute to shoulder extension/adduction/internal rotation preview"
);

const adductionAction = motionActionsForUnits(["pectoralis-major"]).find(
  (item) => item.movementId === "shoulder-adduction"
);
assert(adductionAction, "Shoulder adduction preview is missing");
assert(
  adductionAction.startDeg === 90 &&
    adductionAction.playDirection === -1 &&
    adductionAction.maxDeg === 90,
  "Shoulder adduction must run from 90° abduction back to neutral"
);
assert(
  motionActionActivation(adductionAction, 90) === 0 &&
    motionActionActivation(adductionAction, 0) === 1,
  "Adductor activation direction is reversed incorrectly"
);

const shoulderBiceps = motionActionsForUnits(["biceps-long"]);
assert(
  shoulderBiceps.some((item) => item.movementId === "shoulder-flexion"),
  "Biceps long head should expose its shoulder-flexion contribution"
);
const shoulderTriceps = motionActionsForUnits(["triceps-long"]);
assert(
  shoulderTriceps.some((item) => item.movementId === "shoulder-extension") &&
    shoulderTriceps.some((item) => item.movementId === "shoulder-adduction"),
  "Triceps long head shoulder contribution is incomplete"
);

const triceps = elbowMotionAction(["triceps-long"]);
assert(triceps?.direction === "extension", "Triceps must resolve to extension");
assert(triceps.startDeg === 146, "Extension preview must start flexed");

assert(
  elbowMotionAction(["biceps-long", "triceps-long"]) === null,
  "Competing antagonist activation must wait for the simulation engine"
);
assert(clampElbowAngle(-10) === 0 && clampElbowAngle(170) === 146, "Angle clamp failed");
assert(
  Math.abs(elbowFlexionRadians(90) + Math.PI / 2) < 1e-9,
  "Elbow flexion rotation convention changed"
);
assert(elbowActivation(0, "flexion") === 0, "Flexor activation at rest must be zero");
assert(elbowActivation(146, "flexion") === 1, "Flexor activation at flexion must be one");
assert(elbowActivation(0, "extension") === 1, "Extensor activation convention failed");

const contracted = contractionScale(146, "flexion");
assert(contracted.y < 1 && contracted.x > 1 && contracted.z > 1, "Contraction visual cue is broken");

const advanced = advanceElbowAngle(144, 1, 1, ELBOW_KINEMATIC_LIMITS);
assert(
  advanced.angleDeg === 146 && advanced.direction === -1,
  "Playback must reverse at the flexion limit"
);

const shoulderAction = deltoidActions.find(
  (item) => item.movementId === "shoulder-abduction"
);
const shoulderAdvance = advanceMotionValue(89, 1, 1, shoulderAction);
assert(
  shoulderAdvance.angleDeg === 90 && shoulderAdvance.direction === -1,
  "Shoulder preview must reverse at its calibrated preview limit"
);

console.log("Upper-limb kinematics: elbow flexion/extension 0–146°");
console.log("Upper-limb kinematics: pronation/supination actions present");
console.log("Upper-limb kinematics: shoulder five-movement preview contract ok");
