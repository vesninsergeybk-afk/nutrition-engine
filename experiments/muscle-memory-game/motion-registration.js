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
    simulationSpace: "thoracoscapular-opensim-right",
    bodies: Object.freeze({
      clavicle: body("clavicle", "clavicle", [
        "sternal-end-center",
        "acromial-end-center",
        "clavicle-shaft-reference",
      ]),
      scapula: body("scapula", "scapula", [
        "acromion",
        "inferior-angle",
        "root-of-scapular-spine",
      ]),
      humerus: body("humerus", "humerus", [
        "humeral-head-center",
        "medial-epicondyle",
        "lateral-epicondyle",
      ]),
    }),
    joints: Object.freeze({
      sternoclavicular: joint("sternoclavicular", [
        "clav_prot",
        "clav_elev",
      ]),
      scapulothoracic: joint("scapulothoracic", [
        "scapula_abduction",
        "scapula_elevation",
        "scapula_upward_rot",
        "scapula_winging",
      ]),
      glenohumeral: joint("glenohumeral", [
        "plane_elv",
        "shoulder_elv",
        "axial_rot",
      ]),
    }),
  }),
  scapula: Object.freeze({
    pilotId: "scapula",
    method: "rest-pose-landmarks-plus-rigid-refinement",
    scalePolicy: "uniform-per-pilot",
    atlasSpace: "atlas-world",
    simulationSpace: "thoracoscapular-opensim-right",
    bodies: Object.freeze({
      clavicle: body("clavicle", "clavicle", [
        "sternal-end-center",
        "acromial-end-center",
        "clavicle-shaft-reference",
      ]),
      scapula: body("scapula", "scapula", [
        "acromion",
        "inferior-angle",
        "root-of-scapular-spine",
      ]),
      humerus: body("humerus", "humerus", [
        "humeral-head-center",
        "medial-epicondyle",
        "lateral-epicondyle",
      ]),
    }),
    joints: Object.freeze({
      sternoclavicular: joint("sternoclavicular", [
        "clav_prot",
        "clav_elev",
      ]),
      scapulothoracic: joint("scapulothoracic", [
        "scapula_abduction",
        "scapula_elevation",
        "scapula_upward_rot",
        "scapula_winging",
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
