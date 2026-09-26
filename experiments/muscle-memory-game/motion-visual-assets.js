const TSM_REVISION = "d40ebd8ba658633993e531e408c0d96df30ff367";
const MYOSIM_REVISION = "93b0ca8f4ec90c9899ee7f05fee561e9911da91b";

function profile(value) {
  return Object.freeze(value);
}

export const MOTION_VISUAL_ASSETS = Object.freeze({
  "atlas-derived-fallback": profile({
    id: "atlas-derived-fallback",
    geometryIdentity: "static-atlas-derived",
    status: "active-fallback",
    semanticBinding: "canonical-id",
    requiresStaticAtlasGeometry: true,
    note:
      "Current compatibility path only. Motion meshes are extracted from the static atlas and must not constrain the target Motion Lab architecture.",
  }),

  "tsm-native-bones": profile({
    id: "tsm-native-bones",
    geometryIdentity: "source-native",
    status: "source-native-ready",
    semanticBinding: "canonical-id",
    requiresStaticAtlasGeometry: false,
    sourceId: "thoracoscapular-shoulder",
    repository: "ComputationalBiomechanicsLab/rmr-solver",
    revision: TSM_REVISION,
    format: "vtp",
    assets: Object.freeze({
      thorax: "OpenSim Models/for CMC/Geometry/thorax.vtp",
      clavicle: "OpenSim Models/for CMC/Geometry/clavicle.vtp",
      scapula: "OpenSim Models/for CMC/Geometry/scapula.vtp",
      humerus: "OpenSim Models/for CMC/Geometry/humerus.vtp",
      radius: "OpenSim Models/for CMC/Geometry/radius.vtp",
      ulna: "OpenSim Models/for CMC/Geometry/ulna.vtp",
    }),
    note:
      "These meshes belong to the same Thoracoscapular/OpenSim model that supplies the shoulder motion clips, so no static-atlas registration is required for their own motion.",
  }),

  "myoarm-native-bones": profile({
    id: "myoarm-native-bones",
    geometryIdentity: "source-native",
    status: "source-native-ready",
    semanticBinding: "canonical-id",
    requiresStaticAtlasGeometry: false,
    sourceId: "myosim-arm",
    repository: "MyoHub/myo_sim",
    revision: MYOSIM_REVISION,
    format: "stl",
    assetRoot: "myo_sim/models/meshes",
    assets: Object.freeze({
      humerus: "myo_sim/models/meshes/humerus.stl",
      ulna: "myo_sim/models/meshes/ulna.stl",
      radius: "myo_sim/models/meshes/radius.stl",
      lunate: "myo_sim/models/meshes/lunate.stl",
      scaphoid: "myo_sim/models/meshes/scaphoid.stl",
      pisiform: "myo_sim/models/meshes/pisiform.stl",
      triquetrum: "myo_sim/models/meshes/triquetrum.stl",
      capitate: "myo_sim/models/meshes/capitate.stl",
      trapezium: "myo_sim/models/meshes/trapezium.stl",
      trapezoid: "myo_sim/models/meshes/trapezoid.stl",
      hamate: "myo_sim/models/meshes/hamate.stl",
    }),
    note:
      "Distal-chain bone meshes belong to the MyoArm visual model. Upstream model licensing/provenance remains a production gate.",
  }),

  "motion-muscles-pending": profile({
    id: "motion-muscles-pending",
    geometryIdentity: "motion-specific",
    status: "asset-selection-pending",
    semanticBinding: "canonical-id",
    requiresStaticAtlasGeometry: false,
    note:
      "Target volumetric muscle meshes have not been selected yet. Selection must prioritize riggability, anatomical correspondence, license, and source-path compatibility rather than visual similarity to the static atlas.",
  }),
});

export const MOTION_VISUAL_POLICY = Object.freeze({
  shoulder: Object.freeze({
    current: Object.freeze({
      bones: "atlas-derived-fallback",
      muscles: "atlas-derived-fallback",
    }),
    target: Object.freeze({
      bones: "tsm-native-bones",
      muscles: "motion-muscles-pending",
    }),
  }),
  scapula: Object.freeze({
    current: Object.freeze({
      bones: "atlas-derived-fallback",
      muscles: "atlas-derived-fallback",
    }),
    target: Object.freeze({
      bones: "tsm-native-bones",
      muscles: "motion-muscles-pending",
    }),
  }),
  elbow: Object.freeze({
    current: Object.freeze({
      bones: "atlas-derived-fallback",
      muscles: "atlas-derived-fallback",
    }),
    target: Object.freeze({
      bones: "myoarm-native-bones",
      muscles: "motion-muscles-pending",
    }),
  }),
  wrist: Object.freeze({
    current: Object.freeze({
      bones: "atlas-derived-fallback",
      muscles: "atlas-derived-fallback",
    }),
    target: Object.freeze({
      bones: "myoarm-native-bones",
      muscles: "motion-muscles-pending",
    }),
  }),
});

export function motionVisualAsset(id) {
  return MOTION_VISUAL_ASSETS[id] || null;
}

export function motionVisualAssetPolicy(pilotId) {
  return MOTION_VISUAL_POLICY[pilotId] || null;
}
