import { readFile } from "node:fs/promises";
import { tsmNativeMotionSpec } from "./motion-native-clips.js";
import {
  tsmMusclePathSpec,
  validateTsmMusclePathData,
  sampleTsmMusclePath,
} from "./motion-tsm-muscle-path.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const motionSpec = tsmNativeMotionSpec("shoulder-abduction");
assert(
  motionSpec?.playbackDirection === "forward" &&
    motionSpec.sourceMovementId === "shoulder-abduction",
  "Standard deltoid Motion must use the verified forward TSM abduction clip"
);

const pathSpec = tsmMusclePathSpec(
  "deltoid-acromial",
  "shoulder-abduction"
);
assert(pathSpec, "Standard deltoid source path is not registered");

const raw = JSON.parse(
  await readFile(new URL(pathSpec.path, import.meta.url), "utf8")
);
const path = validateTsmMusclePathData(raw, pathSpec);

assert(
  path.resampledPointCount === 24 &&
    path.frames.length === 165 &&
    Math.abs(path.duration - 2.73818604) < 1e-6,
  "Standard deltoid path structure changed unexpectedly"
);
assert(
  path.frames[0].musculotendonLength >
    path.frames[path.frames.length - 1].musculotendonLength,
  "Recorded deltoid path should shorten across this source excursion"
);

const half = sampleTsmMusclePath({ data: path }, 0.5);
assert(
  half.points.length === 24 &&
    Number.isFinite(half.musculotendonLength),
  "Standard deltoid path sampling failed"
);

const appSource = await readFile(new URL("app.js", import.meta.url), "utf8");
for (const marker of [
  "loadTsmMusclePath",
  "source-path-muscle-envelope",
  "opensim-geometry-path",
  "source-native-abduction-ready",
]) {
  assert(
    appSource.includes(marker),
    "Standard Motion runtime wiring missing: " + marker
  );
}

console.log(
  "Standard Motion asset: TSM-native bones + CMC abduction + deltoid-acromial OpenSim GeometryPath"
);
