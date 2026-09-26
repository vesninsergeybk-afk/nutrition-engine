import {
  ANATOMY_SEMANTICS,
  anatomySemantic,
} from "./anatomy-semantics.js";
import {
  MOTION_BONE_UNITS,
  MOTION_PILOTS,
  MOTION_VISUAL_UNITS,
} from "./motion-readiness.js";
import {
  MOTION_VISUAL_ASSETS,
  MOTION_VISUAL_POLICY,
  motionVisualAsset,
} from "./motion-visual-assets.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const semanticIds = Object.keys(ANATOMY_SEMANTICS);
assert(
  semanticIds.length === new Set(semanticIds).size,
  "Canonical anatomy semantic IDs must be unique"
);

for (const unit of Object.values(MOTION_VISUAL_UNITS)) {
  const semantic = anatomySemantic(unit.semanticId);
  assert(semantic, "Missing semantic entity for muscle: " + unit.id);
  assert(
    semantic.kind === "muscle",
    "Motion muscle semantic kind mismatch: " + unit.id
  );
  assert(
    unit.id === unit.semanticId && unit.nameRu === semantic.nameRu,
    "Motion muscle identity must come from the canonical semantic registry: " +
      unit.id
  );
}

for (const unit of Object.values(MOTION_BONE_UNITS)) {
  const semantic = anatomySemantic(unit.semanticId);
  assert(semantic, "Missing semantic entity for bone: " + unit.id);
  assert(
    semantic.kind.startsWith("bone"),
    "Motion bone semantic kind mismatch: " + unit.id
  );
  assert(
    unit.id === unit.semanticId && unit.nameRu === semantic.nameRu,
    "Motion bone identity must come from the canonical semantic registry: " +
      unit.id
  );
}

for (const pilot of Object.values(MOTION_PILOTS)) {
  const policy = MOTION_VISUAL_POLICY[pilot.id];
  assert(policy, "Missing motion visual asset policy: " + pilot.id);

  const currentBones = motionVisualAsset(policy.current.bones);
  const currentMuscles = motionVisualAsset(policy.current.muscles);
  const targetBones = motionVisualAsset(policy.target.bones);
  const targetMuscles = motionVisualAsset(policy.target.muscles);

  assert(
    currentBones?.id === "atlas-derived-fallback" &&
      currentMuscles?.id === "atlas-derived-fallback",
    pilot.id + ": current atlas-derived geometry must stay explicitly fallback"
  );
  assert(
    targetBones &&
      targetBones.geometryIdentity === "source-native" &&
      targetBones.requiresStaticAtlasGeometry === false,
    pilot.id + ": target bone geometry must be independent of the static atlas"
  );
  assert(
    targetMuscles?.id === "motion-muscles-pending" &&
      targetMuscles.requiresStaticAtlasGeometry === false,
    pilot.id +
      ": target volumetric muscle geometry must remain a separate Motion Lab asset decision"
  );
}

const tsmBones = MOTION_VISUAL_ASSETS["tsm-native-bones"];
for (const [semanticId, path] of Object.entries({
  clavicle: "clavicle.vtp",
  scapula: "scapula.vtp",
  humerus: "humerus.vtp",
  radius: "radius.vtp",
  ulna: "ulna.vtp",
})) {
  assert(
    tsmBones.assets[semanticId]?.endsWith(path),
    "TSM native bone path missing: " + semanticId
  );
}

const myoBones = MOTION_VISUAL_ASSETS["myoarm-native-bones"];
for (const semanticId of ["humerus", "radius", "ulna", "lunate", "scaphoid"]) {
  assert(
    myoBones.assets[semanticId]?.endsWith(".stl"),
    "MyoArm native bone path missing: " + semanticId
  );
}

const fs = await import("node:fs/promises");
const appSource = await fs.readFile(new URL("app.js", import.meta.url), "utf8");
for (const marker of [
  "motionSemanticBinding",
  "motionGeometryCurrentBones",
  "motionGeometryTargetBones",
  "motionGeometryTargetMuscles",
]) {
  assert(
    appSource.includes(marker),
    "Motion UI diagnostics missing semantic/asset separation marker: " + marker
  );
}

console.log(
  "Motion semantics: anatomical identity is canonical and independent of visual geometry"
);
console.log(
  "Motion visual policy: static atlas is explicit fallback; source-native bones are the target"
);
console.log(
  "Motion muscles: target volumetric geometry remains an independent asset-selection step"
);
