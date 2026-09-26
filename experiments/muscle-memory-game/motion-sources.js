const TSM_REVISION = "d40ebd8ba658633993e531e408c0d96df30ff367";
const MYOSIM_REVISION = "93b0ca8f4ec90c9899ee7f05fee561e9911da91b";

function frozenList(values) {
  return Object.freeze([...values]);
}

export const MOTION_SOURCES = Object.freeze({
  "thoracoscapular-shoulder": Object.freeze({
    id: "thoracoscapular-shoulder",
    name: "Thoracoscapular Shoulder Model",
    engine: "OpenSim",
    sourceType: "opensim-offline",
    runtimePolicy: "precomputed-motion-clips",
    repository: "ComputationalBiomechanicsLab/rmr-solver",
    revision: TSM_REVISION,
    license: "CC-BY-4.0",
    citation: "Seth et al. 2019, Frontiers in Neurorobotics 13:90",
    modelPath: "OpenSim Models/for RMR solver/TSM_subject_noWeight.osim",
    sampleMotionPaths: Object.freeze({
      abduction: "Results/IK solutions/ABD01.mot",
      flexion: "Results/IK solutions/FLX01.mot",
      shrug: "Results/IK solutions/SHRUG01.mot",
    }),
    bodies: frozenList(["clavicle", "scapula", "humerus", "ulna", "hand"]),
    coordinates: frozenList([
      "clav_prot",
      "clav_elev",
      "scapula_abduction",
      "scapula_elevation",
      "scapula_upward_rot",
      "scapula_winging",
      "plane_elv",
      "shoulder_elv",
      "axial_rot",
      "elbow_flexion",
      "pro_sup",
    ]),
    authority:
      "Primary shoulder/scapular kinematics. OpenSim is used offline; the browser consumes exported rigid-body transforms.",
  }),
  "myosim-arm": Object.freeze({
    id: "myosim-arm",
    name: "MyoArm / MyoSim",
    engine: "MuJoCo",
    sourceType: "mujoco-model",
    runtimePolicy: "mujoco-wasm-or-precomputed-motion-clips",
    repository: "MyoHub/myo_sim",
    revision: MYOSIM_REVISION,
    license:
      "Apache-2.0 repository; upstream model provenance requires separate product review",
    modelPath: "myo_sim/models/arm/assets/myoarm_r_chain.xml",
    musclePath: "myo_sim/models/arm/assets/myoarm_r_muscle.xml",
    bodies: frozenList(["humerus_r", "ulna_r", "radius_r", "lunate_r"]),
    coordinates: frozenList([
      "elbow_flexion_r",
      "pro_sup_r",
      "flexion_r",
      "deviation_r",
    ]),
    authority:
      "Primary distal-chain candidate for elbow, forearm and wrist. Shoulder coupling is not the production authority.",
  }),
  "kinematic-preview": Object.freeze({
    id: "kinematic-preview",
    name: "Internal teaching fallback",
    engine: "Three.js",
    sourceType: "heuristic-preview",
    runtimePolicy: "browser-fallback-only",
    repository: null,
    revision: null,
    license: null,
    bodies: frozenList([]),
    coordinates: frozenList([]),
    authority:
      "Fallback only. Must not be presented as the production biomechanical source once a verified source clip is available.",
  }),
});

export const PILOT_SOURCE_POLICY = Object.freeze({
  shoulder: Object.freeze({
    primary: "thoracoscapular-shoulder",
    fallback: "kinematic-preview",
  }),
  scapula: Object.freeze({
    primary: "thoracoscapular-shoulder",
    fallback: "kinematic-preview",
  }),
  elbow: Object.freeze({
    primary: "myosim-arm",
    fallback: "kinematic-preview",
  }),
  wrist: Object.freeze({
    primary: "myosim-arm",
    fallback: "kinematic-preview",
  }),
});

export function motionSource(sourceId) {
  return MOTION_SOURCES[sourceId] || null;
}

export function motionSourcePolicy(pilotId) {
  return PILOT_SOURCE_POLICY[pilotId] || null;
}

export function primaryMotionSource(pilotId) {
  const policy = motionSourcePolicy(pilotId);
  return policy ? motionSource(policy.primary) : null;
}

export function fallbackMotionSource(pilotId) {
  const policy = motionSourcePolicy(pilotId);
  return policy ? motionSource(policy.fallback) : null;
}
