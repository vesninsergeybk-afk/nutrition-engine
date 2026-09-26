function frozenList(values) {
  return Object.freeze([...values]);
}

function body(id, simulationBody, landmarks) {
  return Object.freeze({
    id,
    simulationBody,
    landmarks: frozenList(landmarks),
  });
}

function joint(id, simulationJoints) {
  return Object.freeze({
    id,
    simulationJoints: frozenList(simulationJoints),
  });
}

export const MOTION_REGISTRATION_SPECS = Object.freeze({
  elbow: Object.freeze({
    pilotId: "elbow",
    method: "rest-pose-landmarks-plus-rigid-refinement",
    scalePolicy: "uniform-per-pilot",
    atlasSpace: "atlas-world",
    simulationSpace: "myoarm-right",
    bodies: Object.freeze({
      humerus: body("humerus", "humerus_r", [
        "humeral-head-center",
        "medial-epicondyle",
        "lateral-epicondyle",
      ]),
      ulna: body("ulna", "ulna_r", [
        "olecranon",
        "trochlear-notch-center",
        "ulnar-styloid",
      ]),
      radius: body("radius", "radius_r", [
        "radial-head-center",
        "radial-styloid",
        "dorsal-tubercle",
      ]),
    }),
    joints: Object.freeze({
      elbow: joint("elbow", ["elbow_flexion_r"]),
      forearmRotation: joint("forearmRotation", ["pro_sup_r"]),
    }),
  }),
  wrist: Object.freeze({
    pilotId: "wrist",
    method: "rest-pose-landmarks-plus-rigid-refinement",
    scalePolicy: "uniform-per-pilot",
    atlasSpace: "atlas-world",
    simulationSpace: "myoarm-right",
    bodies: Object.freeze({
      radius: body("radius", "radius_r", [
        "radial-head-center",
        "radial-styloid",
        "dorsal-tubercle",
      ]),
      ulna: body("ulna", "ulna_r", [
        "olecranon",
        "ulnar-head-center",
        "ulnar-styloid",
      ]),
      hand: body("hand", "lunate_r", [
        "lunate-center",
        "capitate-center",
        "third-metacarpal-base",
      ]),
    }),
    joints: Object.freeze({
      wristFlexionExtension: joint("wristFlexionExtension", ["flexion_r"]),
      wristDeviation: joint("wristDeviation", ["deviation_r"]),
    }),
  }),
  shoulder: Object.freeze({
    pilotId: "shoulder",
    method: "rest-pose-landmarks-plus-rigid-refinement",
    scalePolicy: "uniform-per-pilot",
    atlasSpace: "atlas-world",
    simulationSpace: "myoarm-right",
    bodies: Object.freeze({
      clavicle: body("clavicle", "clavicle_r", [
        "sternal-end-center",
        "acromial-end-center",
        "clavicle-shaft-reference",
      ]),
      scapula: body("scapula", "scapula_r", [
        "acromion",
        "inferior-angle",
        "root-of-scapular-spine",
      ]),
      humerus: body("humerus", "humerus_r", [
        "humeral-head-center",
        "medial-epicondyle",
        "lateral-epicondyle",
      ]),
    }),
    joints: Object.freeze({
      sternoclavicular: joint("sternoclavicular", [
        "sternoclavicular_r2_r",
        "sternoclavicular_r3_r",
      ]),
      acromioclavicular: joint("acromioclavicular", [
        "acromioclavicular_r1_r",
        "acromioclavicular_r2_r",
        "acromioclavicular_r3_r",
      ]),
      glenohumeral: joint("glenohumeral", [
        "elv_angle_r",
        "shoulder_elv_r",
        "shoulder1_r2_r",
        "shoulder_rot_r",
      ]),
    }),
  }),
  scapula: Object.freeze({
    pilotId: "scapula",
    method: "rest-pose-landmarks-plus-rigid-refinement",
    scalePolicy: "uniform-per-pilot",
    atlasSpace: "atlas-world",
    simulationSpace: "myoarm-right",
    bodies: Object.freeze({
      clavicle: body("clavicle", "clavicle_r", [
        "sternal-end-center",
        "acromial-end-center",
        "clavicle-shaft-reference",
      ]),
      scapula: body("scapula", "scapula_r", [
        "acromion",
        "inferior-angle",
        "root-of-scapular-spine",
      ]),
      humerus: body("humerus", "humerus_r", [
        "humeral-head-center",
        "medial-epicondyle",
        "lateral-epicondyle",
      ]),
    }),
    joints: Object.freeze({
      sternoclavicular: joint("sternoclavicular", [
        "sternoclavicular_r2_r",
        "sternoclavicular_r3_r",
      ]),
      acromioclavicular: joint("acromioclavicular", [
        "acromioclavicular_r1_r",
        "acromioclavicular_r2_r",
        "acromioclavicular_r3_r",
      ]),
    }),
  }),
});

export const MOTION_CALIBRATION = Object.freeze({
  "z-anatomy": Object.freeze({
    elbow: Object.freeze({ status: "pending-landmark-calibration" }),
    wrist: Object.freeze({ status: "pending-landmark-calibration" }),
    shoulder: Object.freeze({ status: "pending-landmark-calibration" }),
    scapula: Object.freeze({ status: "pending-landmark-calibration" }),
  }),
  bodyparts4: Object.freeze({
    elbow: Object.freeze({ status: "pending-landmark-calibration" }),
    wrist: Object.freeze({ status: "pending-landmark-calibration" }),
    shoulder: Object.freeze({ status: "pending-landmark-calibration" }),
    scapula: Object.freeze({ status: "pending-landmark-calibration" }),
  }),
});

export function registrationSpec(pilotId) {
  return MOTION_REGISTRATION_SPECS[pilotId] || null;
}

export function calibrationState(sourceId, pilotId) {
  return MOTION_CALIBRATION[sourceId]?.[pilotId] || null;
}

export function registrationReady(sourceId, pilotId) {
  return calibrationState(sourceId, pilotId)?.status === "verified";
}

export function requiredSimulationBodies(pilotId) {
  const spec = registrationSpec(pilotId);
  if (!spec) return [];
  return Object.values(spec.bodies).map((item) => item.simulationBody);
}

export function requiredSimulationJoints(pilotId) {
  const spec = registrationSpec(pilotId);
  if (!spec) return [];
  return Object.values(spec.joints).flatMap((item) => item.simulationJoints);
}

export function requiredAtlasLandmarks(pilotId) {
  const spec = registrationSpec(pilotId);
  if (!spec) return [];
  return Object.fromEntries(
    Object.entries(spec.bodies).map(([id, item]) => [id, [...item.landmarks]])
  );
}
