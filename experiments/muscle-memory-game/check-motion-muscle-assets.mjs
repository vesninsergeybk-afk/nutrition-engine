import {
  MOTION_MUSCLE_ASSET_CANDIDATES,
  MOTION_MUSCLE_ASSET_REQUIREMENTS,
} from "./motion-muscle-assets.js";
import { MOTION_VISUAL_ASSETS } from "./motion-visual-assets.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  MOTION_MUSCLE_ASSET_REQUIREMENTS.includes(
    "independent-from-static-atlas-topology"
  ),
  "Motion muscle selection must not require the static atlas topology"
);
assert(
  MOTION_MUSCLE_ASSET_REQUIREMENTS.includes(
    "compatible-with-source-derived-bone-motion"
  ),
  "Motion muscle selection must follow the biomechanics skeleton"
);

const zBiomech = MOTION_MUSCLE_ASSET_CANDIDATES["z-biomechanics-rig"];
assert(
  zBiomech.status === "binary-audit-required" &&
    zBiomech.path === "Z-Biomechanics.7z",
  "Z-Biomechanics must stay a candidate until its binary rig is inspected"
);

const zGeometry =
  MOTION_MUSCLE_ASSET_CANDIDATES["z-anatomy-muscle-geometry"];
assert(
  zGeometry.status === "geometry-available-rig-not-assumed",
  "Z-Anatomy muscle geometry must not be mislabeled as a verified motion rig"
);

const sourcePath =
  MOTION_MUSCLE_ASSET_CANDIDATES["source-path-muscle-envelope"];
assert(
  sourcePath.status === "architecturally-viable-prototype" &&
    sourcePath.staticAtlasDependency === false,
  "Source-path muscle geometry must remain independent of static atlas meshes"
);

for (const item of Object.values(MOTION_MUSCLE_ASSET_CANDIDATES)) {
  assert(
    item.semanticBinding === "canonical-id",
    item.id + ": muscle candidate must use canonical semantic IDs"
  );
  assert(
    item.staticAtlasDependency === false,
    item.id + ": candidate unexpectedly depends on static atlas topology"
  );
  assert(item.gates?.length, item.id + ": candidate needs explicit validation gates");
}

assert(
  MOTION_VISUAL_ASSETS["motion-muscles-pending"]?.status ===
    "asset-selection-pending",
  "Target motion muscle slot must remain unresolved until candidate audit passes"
);

console.log(
  "Motion muscle assets: candidates registered without prematurely selecting a rig"
);
console.log(
  "Motion muscle assets: static atlas topology is not a selection requirement"
);
