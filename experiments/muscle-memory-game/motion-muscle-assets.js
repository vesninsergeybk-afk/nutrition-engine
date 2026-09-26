function candidate(value) {
  return Object.freeze(value);
}

export const MOTION_MUSCLE_ASSET_CANDIDATES = Object.freeze({
  "z-biomechanics-rig": candidate({
    id: "z-biomechanics-rig",
    class: "existing-rig",
    status: "binary-audit-required",
    repository: "moyacs/Z-Anatomy",
    path: "Z-Biomechanics.7z",
    license: "CC-BY-SA-4.0",
    semanticBinding: "canonical-id",
    staticAtlasDependency: false,
    strengths: Object.freeze([
      "separate biomechanics branch exists",
      "historical project material describes an anatomical armature and pose workflow",
      "same anatomy family as Z-Anatomy may simplify semantic mapping",
    ]),
    gates: Object.freeze([
      "archive contents must be inspected directly",
      "muscle meshes must be confirmed as actually rigged, not only the skeleton",
      "shoulder and radius mechanics must not be trusted as biomechanics authority without comparison to TSM/MyoArm",
      "ShareAlike implications must be acceptable for distributed derivative assets",
    ]),
  }),

  "z-anatomy-muscle-geometry": candidate({
    id: "z-anatomy-muscle-geometry",
    class: "volumetric-geometry-donor",
    status: "geometry-available-rig-not-assumed",
    repository: "LluisV/Z-Anatomy",
    path: "Resources/Models/FBX/MuscularSystem100.fbx",
    license: "CC-BY-SA-4.0",
    semanticBinding: "canonical-id",
    staticAtlasDependency: false,
    strengths: Object.freeze([
      "large named volumetric anatomy set",
      "already familiar semantic anatomy family",
      "can be copied into a completely separate Motion Lab asset pipeline",
    ]),
    gates: Object.freeze([
      "must not assume existing skin weights or correct biomechanics rig",
      "would require binding to TSM/MyoArm or another verified motion skeleton",
      "ShareAlike implications must be acceptable for distributed derivative assets",
    ]),
  }),

  "source-path-muscle-envelope": candidate({
    id: "source-path-muscle-envelope",
    class: "source-derived-procedural-geometry",
    status: "architecturally-viable-prototype",
    repository: null,
    path: null,
    license: "inherits-and-must-document-biomechanics-source",
    semanticBinding: "canonical-id",
    staticAtlasDependency: false,
    strengths: Object.freeze([
      "muscle course follows the same validated biomechanics source as the bones",
      "origin, insertion, via points and wrapping behavior can drive the visual path",
      "no skin-weight transfer from the static atlas is required",
      "robust fallback when no trustworthy volumetric rig exists",
    ]),
    gates: Object.freeze([
      "generated belly shape is an educational envelope, not exact muscle morphology",
      "TSM and MyoArm muscle-path export must be implemented and validated",
      "visual conventions must clearly separate activation highlighting from actual fiber shortening",
    ]),
  }),

  "anatomy-reengineering-framework": candidate({
    id: "anatomy-reengineering-framework",
    class: "authoring-tool",
    status: "research-only-wip",
    repository: "Freedom-of-Form-Foundation/anatomy3d-blender",
    path: null,
    license: "GPL-2.0",
    semanticBinding: "canonical-id",
    staticAtlasDependency: false,
    strengths: Object.freeze([
      "explicit focus on realistic anatomy built with biomechanical principles",
      "may be useful as an offline authoring/reference tool",
    ]),
    gates: Object.freeze([
      "project is work in progress",
      "not yet established as a ready-to-ship upper-limb volumetric muscle asset",
      "GPL implications must be reviewed before integration into the production toolchain",
    ]),
  }),
});

export const MOTION_MUSCLE_ASSET_REQUIREMENTS = Object.freeze([
  "canonical-semantic-mapping",
  "independent-from-static-atlas-topology",
  "compatible-with-source-derived-bone-motion",
  "origin-insertion-path-consistency",
  "acceptable-upper-limb-coverage",
  "stable-web-export-path",
  "license-compatible-with-product-distribution",
  "explicit-provenance",
]);

export function motionMuscleAssetCandidate(id) {
  return MOTION_MUSCLE_ASSET_CANDIDATES[id] || null;
}
