import {
  ELBOW_KINEMATIC_LIMITS,
  FOREARM_ROTATION_LIMITS,
  SHOULDER_PREVIEW_LIMITS,
  WRIST_PREVIEW_LIMITS,
  advanceElbowAngle,
  advanceMotionValue,
  clampElbowAngle,
  contractionScale,
  elbowActivation,
  elbowFlexionRadians,
  elbowMotionAction,
  motionActionsForUnits,
  motionActionById,
  motionActionActivation,
  scapularPreviewTransform,
  shoulderComplexElevationPreview,
  shoulderPreviewRotation,
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

const wristFlexorActions = motionActionsForUnits(["flexor-carpi-radialis"]);
assert(
  wristFlexorActions.some((item) => item.movementId === "wrist-flexion") &&
    wristFlexorActions.some(
      (item) => item.movementId === "wrist-radial-deviation"
    ),
  "Flexor carpi radialis must expose wrist flexion and radial deviation"
);
const wristExtensorActions = motionActionsForUnits(["extensor-carpi-ulnaris"]);
assert(
  wristExtensorActions.some((item) => item.movementId === "wrist-extension") &&
    wristExtensorActions.some(
      (item) => item.movementId === "wrist-ulnar-deviation"
    ),
  "Extensor carpi ulnaris must expose wrist extension and ulnar deviation"
);
assert(
  WRIST_PREVIEW_LIMITS.flexion.previewMaxDeg === 45 &&
    WRIST_PREVIEW_LIMITS.flexion.referenceMaxDeg === 80 &&
    WRIST_PREVIEW_LIMITS.radialDeviation.previewMaxDeg === 10 &&
    WRIST_PREVIEW_LIMITS.ulnarDeviation.previewMaxDeg === 25,
  "Wrist preview must preserve MyoArm limits separately from clinical references"
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
  "shoulder-scaption",
  "shoulder-horizontal-adduction",
  "shoulder-horizontal-abduction",
]) {
  assert(
    deltoidActions.some((item) => item.movementId === movementId),
    "Deltoid action missing: " + movementId
  );
}
assert(
  SHOULDER_PREVIEW_LIMITS.flexion.previewMaxDeg === 160 &&
    SHOULDER_PREVIEW_LIMITS.flexion.referenceMaxDeg === 180 &&
    SHOULDER_PREVIEW_LIMITS.abduction.previewMaxDeg === 150 &&
    SHOULDER_PREVIEW_LIMITS.abduction.referenceMaxDeg === 150 &&
    SHOULDER_PREVIEW_LIMITS.scaption.previewMaxDeg === 150 &&
    SHOULDER_PREVIEW_LIMITS.horizontalAdduction.previewMaxDeg === 60 &&
    SHOULDER_PREVIEW_LIMITS.horizontalAdduction.referenceMaxDeg === 120 &&
    SHOULDER_PREVIEW_LIMITS.horizontalAbduction.previewMaxDeg === 30 &&
    SHOULDER_PREVIEW_LIMITS.horizontalAbduction.referenceMaxDeg === 45,
  "Shoulder-complex preview ranges must preserve combined elevation and separate clinical references"
);
const abductionAction = deltoidActions.find(
  (item) => item.movementId === "shoulder-abduction"
);
assert(
  abductionAction.synergists.includes("deltoid-acromial") &&
    abductionAction.synergists.includes("supraspinatus") &&
    abductionAction.scapularDrivers.includes("trapezius") &&
    abductionAction.scapularDrivers.includes("serratus-anterior") &&
    abductionAction.stabilizers.includes("infraspinatus") &&
    abductionAction.stabilizers.includes("subscapularis") &&
    abductionAction.stabilizers.includes("teres-minor"),
  "Shoulder abduction must separate humeral movers, scapular drivers, and cuff stabilizers"
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
const shoulderAdvance = advanceMotionValue(149, 1, 1, shoulderAction);
assert(
  shoulderAdvance.angleDeg === 150 && shoulderAdvance.direction === -1,
  "Shoulder preview must reverse at its calibrated preview limit"
);

console.log("Upper-limb kinematics: elbow flexion/extension 0–146°");
console.log("Upper-limb kinematics: pronation/supination actions present");
console.log("Upper-limb kinematics: shoulder preview contract ok");
console.log("Upper-limb kinematics: wrist flexion/extension and deviation contract ok");


const scaptionAction = deltoidActions.find(
  (item) => item.movementId === "shoulder-scaption"
);
assert(
  scaptionAction &&
    scaptionAction.maxDeg === 150 &&
    scaptionAction.assistants.includes("deltoid-clavicular"),
  "Scaption preview must expose the scapular-plane elevation contract"
);
const scaptionRotation = shoulderPreviewRotation(scaptionAction, 60, 1);
assert(
  Math.abs(scaptionRotation.axis[0]) > 0.1 &&
    Math.abs(scaptionRotation.axis[2]) > 0.1 &&
    Math.abs(scaptionRotation.angleRad) > 0.5,
  "Scaption must use an oblique axis rather than pure flexion or abduction"
);

const flexionAction = deltoidActions.find(
  (item) => item.movementId === "shoulder-flexion"
);
assert(
  flexionAction.assistants.includes("biceps-long") &&
    flexionAction.assistants.includes("biceps-short"),
  "Biceps heads must be shown as assisting shoulder flexors"
);
const extensionAction = deltoidActions.find(
  (item) => item.movementId === "shoulder-extension"
);
assert(
  extensionAction.assistants.includes("triceps-long"),
  "Long head of triceps must be shown as an assisting shoulder extensor"
);
assert(
  adductionAction.synergists.includes("pectoralis-major") &&
    adductionAction.synergists.includes("teres-major") &&
    adductionAction.assistants.includes("coracobrachialis") &&
    adductionAction.assistants.includes("triceps-long"),
  "Shoulder adduction must separate main and assisting movers"
);
assert(
  adductionAction.referencePose === "abducted-90",
  "Adduction start pose must not masquerade as anatomical rest"
);

console.log("Upper-limb kinematics: scaption and assistant roles ok");

const latissimusActions = motionActionsForUnits(["latissimus-dorsi"]);
assert(
  latissimusActions.some((item) => item.movementId === "shoulder-extension") &&
    latissimusActions.some((item) => item.movementId === "shoulder-adduction") &&
    latissimusActions.some((item) => item.movementId === "shoulder-internal-rotation"),
  "Latissimus dorsi shoulder actions are incomplete"
);
assert(
  abductionAction.scapularDrivers.includes("trapezius") &&
    abductionAction.scapularDrivers.includes("serratus-anterior") &&
    abductionAction.stabilizers.includes("infraspinatus") &&
    abductionAction.stabilizers.includes("subscapularis"),
  "Shoulder elevation must separate scapular drivers from cuff stabilizers"
);
console.log("Upper-limb kinematics: latissimus, scapular drivers, and cuff context ok");

const horizontalAdduction = motionActionsForUnits(["pectoralis-major"]).find(
  (item) => item.movementId === "shoulder-horizontal-adduction"
);
assert(
  horizontalAdduction &&
    horizontalAdduction.referencePose === "abducted-90" &&
    horizontalAdduction.synergists.includes("deltoid-clavicular"),
  "Horizontal adduction must start from 90° abduction with anterior deltoid/pectoralis context"
);
const horizontalAbduction = motionActionsForUnits(["deltoid-spinal"]).find(
  (item) => item.movementId === "shoulder-horizontal-abduction"
);
assert(
  horizontalAbduction &&
    horizontalAbduction.referencePose === "abducted-90" &&
    horizontalAbduction.assistants.includes("infraspinatus") &&
    horizontalAbduction.assistants.includes("teres-minor"),
  "Horizontal abduction must start from 90° abduction with posterior cuff assistance"
);
console.log("Upper-limb kinematics: horizontal shoulder plane actions ok");

const shoulderFlexion = motionActionById("shoulder-flexion");
const shoulderAbduction = motionActionById("shoulder-abduction");
for (const action of [shoulderFlexion, shoulderAbduction]) {
  assert(
    action.combinedShoulderComplex === true &&
      action.scapularDrivers.includes("serratus-anterior") &&
      action.scapularDrivers.includes("trapezius"),
    "Full-range shoulder elevation must declare the scapular component"
  );
}

const shoulder60 = shoulderComplexElevationPreview(shoulderAbduction, 60, 1);
const shoulder120 = shoulderComplexElevationPreview(shoulderAbduction, 120, 1);
const shoulder150 = shoulderComplexElevationPreview(shoulderAbduction, 150, 1);
assert(
  Math.abs(shoulder60.scapularUpwardRotationDeg - 24) < 0.01 &&
    Math.abs(shoulder120.scapularUpwardRotationDeg - 35) < 0.01 &&
    Math.abs(
      shoulder150.glenohumeralDeg +
        shoulder150.scapularUpwardRotationDeg -
        150
    ) < 0.01,
  "Combined shoulder elevation decomposition is broken"
);
assert(
  shoulder60.glenohumeralDeg / shoulder60.scapularUpwardRotationDeg !==
    shoulder120.glenohumeralDeg / shoulder120.scapularUpwardRotationDeg,
  "Scapulohumeral preview must not collapse back to a constant 2:1 ratio"
);
assert(
  shoulder120.scapularPosteriorTiltDeg > 8 &&
    shoulder150.scapularPosteriorTiltDeg > shoulder120.scapularPosteriorTiltDeg,
  "Combined shoulder elevation must add progressive scapular posterior tilt"
);
assert(
  shoulder120.scapularExternalRotationDeg > 1 &&
    shoulder150.scapularExternalRotationDeg >
      shoulder120.scapularExternalRotationDeg,
  "Combined shoulder elevation must add a modest high-range external-rotation trend"
);
const scaption120 = shoulderComplexElevationPreview(scaptionAction, 120, 1);
const flexion120 = shoulderComplexElevationPreview(flexionAction, 120, 1);
assert(
  shoulder120.humeralExternalRotationDeg > 20 &&
    scaption120.humeralExternalRotationDeg > 8 &&
    flexion120.humeralExternalRotationDeg <= 5 &&
    shoulder120.humeralExternalRotationDeg >
      scaption120.humeralExternalRotationDeg &&
    scaption120.humeralExternalRotationDeg >
      flexion120.humeralExternalRotationDeg,
  "Coupled humeral external rotation must vary conservatively with the plane of elevation"
);
assert(
  shoulder150.clavicleElevationDeg > 0 &&
    shoulder150.clavicleRetractionDeg > 0 &&
    shoulder150.claviclePosteriorRotationDeg > 0,
  "Combined shoulder elevation must include a clavicular component"
);
assert(
  adductionAction.combinedShoulderComplex === true,
  "Return from 90° abduction must preserve the linked shoulder-complex chain"
);
const adduction90 = shoulderComplexElevationPreview(adductionAction, 90, 1);
assert(
  adduction90.scapularUpwardRotationDeg > 0 &&
    Math.abs(
      adduction90.glenohumeralDeg +
        adduction90.scapularUpwardRotationDeg -
        90
    ) < 0.01,
  "Adduction reference pose must include the scapular contribution rather than a humerus-only 90° pose"
);

const scapUp = motionActionById("scapular-upward-rotation");
const scapPro = motionActionById("scapular-protraction");
const scapRet = motionActionById("scapular-retraction");
assert(scapUp?.pilotId === "scapula", "Scapular upward rotation action missing");
assert(scapPro?.displayUnit === "%", "Scapular translation must not masquerade as degrees");
assert(scapRet?.displayUnit === "%", "Scapular retraction must use normalized preview units");
const scapUpPose = scapularPreviewTransform(scapUp, 30, 1);
assert(
  scapUpPose.scapularUpwardRotationDeg === 30 &&
    scapUpPose.scapularPosteriorTiltDeg > 5 &&
    scapUpPose.clavicleElevationDeg > 5 &&
    scapUpPose.claviclePosteriorRotationDeg > 5,
  "Upward rotation must be a coupled 3D scapula-clavicle movement"
);
const scapProPose = scapularPreviewTransform(scapPro, 100, 1);
assert(
  scapProPose.scapularExternalRotationDeg < -5 &&
    scapProPose.scapularPosteriorTiltDeg < 0 &&
    scapProPose.clavicleRetractionDeg < -5 &&
    scapProPose.translationFraction.every((item) => item === 0),
  "Protraction must come from linked SC/AC-like rotations rather than detaching the scapula with an arbitrary translation"
);
const scapRetPose = scapularPreviewTransform(scapRet, 100, 1);
assert(
  scapRetPose.scapularExternalRotationDeg > 5 &&
    scapRetPose.scapularPosteriorTiltDeg > 0 &&
    scapRetPose.clavicleRetractionDeg > 5,
  "Retraction must reverse the linked protraction pattern"
);
const scapElev = scapularPreviewTransform(
  motionActionById("scapular-elevation"),
  100,
  1
);
const scapDep = scapularPreviewTransform(
  motionActionById("scapular-depression"),
  100,
  1
);
assert(
  scapElev.clavicleElevationDeg > 5 &&
    scapDep.clavicleElevationDeg < -5,
  "Scapular elevation/depression must be carried by the clavicle around its medial anchor"
);
for (const id of [
  "scapular-protraction",
  "scapular-retraction",
  "scapular-elevation",
  "scapular-depression",
  "scapular-upward-rotation",
  "scapular-downward-rotation",
]) {
  assert(motionActionById(id), "Missing scapular movement: " + id);
}
console.log("Upper-limb kinematics: scapular translation and rotation preview ok");
