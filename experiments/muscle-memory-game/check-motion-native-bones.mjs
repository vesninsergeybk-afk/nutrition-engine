import { readFile } from "node:fs/promises";
import {
  MOTION_VISUAL_ASSETS,
  MOTION_VISUAL_POLICY,
} from "./motion-visual-assets.js";
import { parseAsciiVtpPolyData } from "./motion-vtp.js";
import { createMotionClip } from "./motion-clip.js";
import {
  tsmNativeMotionSourceRange,
  tsmNativeMotionSpec,
} from "./motion-native-clips.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const profile = MOTION_VISUAL_ASSETS["tsm-native-bones"];
assert(profile?.revision, "TSM native geometry must be pinned to a revision");
assert(
  profile.delivery === "project-local",
  "TSM native geometry must be served from project-local assets"
);
assert(
  MOTION_VISUAL_POLICY.shoulder.target.bones === profile.id &&
    MOTION_VISUAL_POLICY.scapula.target.bones === profile.id,
  "Shoulder/scapula target policy must use TSM-native bones"
);
assert(
  profile.requiresStaticAtlasGeometry === false,
  "TSM-native bones must not depend on static atlas geometry"
);

const expected = {
  thorax: [2771, 5446],
  clavicle: [203, 398],
  scapula: [770, 1550],
  humerus: [309, 588],
};

const expectedScaleFactors = {
  thorax: [1.0612295946419767, 1.0205202882662845, 1.0652798878430603],
  clavicle: [1.2957403918317758, 0.9349803545070169, 1.1327604475172277],
  scapula: [0.8716829718428957, 0.9637981739424081, 0.9551799151227053],
  humerus: [1.21539941612184, 0.8478717777354424, 1.03029990449119],
};

for (const [boneId, expectedScale] of Object.entries(expectedScaleFactors)) {
  const actual = profile.scaleFactors?.[boneId];
  assert(Array.isArray(actual) && actual.length === 3, boneId + ": missing model scale factors");
  for (let axis = 0; axis < 3; axis += 1) {
    assert(
      Math.abs(actual[axis] - expectedScale[axis]) < 1e-12,
      boneId + ": TSM mesh scale factor mismatch"
    );
  }
}

for (const [boneId, [points, polygons]] of Object.entries(expected)) {
  const localUrl = new URL(profile.assets[boneId], import.meta.url);
  const parsed = parseAsciiVtpPolyData(await readFile(localUrl, "utf8"));
  assert(
    parsed.pointCount === points,
    boneId + ": unexpected VTP point count"
  );
  assert(
    parsed.polygonCount === polygons,
    boneId + ": unexpected VTP polygon count"
  );
  assert(
    parsed.triangleCount === polygons,
    boneId + ": pinned source is expected to contain triangular polys"
  );
  assert(
    parsed.positions.every(Number.isFinite) &&
      parsed.indices.every(Number.isInteger),
    boneId + ": parsed geometry contains invalid values"
  );
}

const adductionSpec = tsmNativeMotionSpec("shoulder-adduction");
assert(
  adductionSpec?.playbackDirection === "reverse" &&
    adductionSpec.sourceMovementId === "shoulder-abduction",
  "Shoulder adduction must remain the kinematic reverse of the verified abduction clip"
);
const adductionRaw = JSON.parse(
  await readFile(new URL(adductionSpec.path, import.meta.url), "utf8")
);
const adductionClip = createMotionClip(adductionRaw);
const adductionRange = tsmNativeMotionSourceRange({
  spec: adductionSpec,
  clip: adductionClip,
});
assert(
  adductionClip.coordinateSpace === "body-relative" &&
    adductionClip.referenceBody === "thorax",
  "Native adduction source must remain thorax-relative"
);
assert(
  adductionRange &&
    adductionRange.start > adductionRange.end &&
    Math.abs(adductionRange.start - 96.946) < 0.02 &&
    Math.abs(adductionRange.end - 22.524) < 0.02,
  "Native adduction source range changed unexpectedly"
);

const appSource = await readFile(new URL("app.js", import.meta.url), "utf8");
const nativeLoaderSource = await readFile(
  new URL("motion-native-bones.js", import.meta.url),
  "utf8"
);
assert(
  nativeLoaderSource.includes("geometry.scale(scale[0], scale[1], scale[2])"),
  "TSM native loader must bake OpenSim mesh scale_factors into geometry"
);

for (const marker of [
  "motionBones",
  "buildTsmNativeBoneProbeScene",
  "motionGeometryRuntimeBones",
  "source-native-reference-pose",
  "fitTsmNativeAssembledScene",
]) {
  assert(
    appSource.includes(marker),
    "Motion source-native probe wiring missing: " + marker
  );
}

console.log(
  "TSM native bones: pinned VTP geometry parses independently of static atlas"
);
console.log(
  "TSM native bone scene: diagnostic wiring is present without replacing the default Motion Lab"
);
