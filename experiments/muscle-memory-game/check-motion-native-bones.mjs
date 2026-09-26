import { readFile } from "node:fs/promises";
import {
  MOTION_VISUAL_ASSETS,
  MOTION_VISUAL_POLICY,
} from "./motion-visual-assets.js";
import { parseAsciiVtpPolyData } from "./motion-vtp.js";

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

const appSource = await readFile(new URL("app.js", import.meta.url), "utf8");
for (const marker of [
  "motionBones",
  "buildTsmNativeBoneProbeScene",
  "motionGeometryRuntimeBones",
  "source-native-rest-pose",
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
