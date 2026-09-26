import fs from "node:fs";

const files = process.argv.slice(2);
if (!files.length) {
  throw new Error("Pass at least one muscle-path JSON file");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function finiteVec3(value) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(Number.isFinite)
  );
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

for (const file of files) {
  const path = JSON.parse(fs.readFileSync(file, "utf8"));

  assert(
    path.schema === "motion-muscle-path-v1",
    file + ": unsupported schema"
  );
  assert(
    path.sourceId === "thoracoscapular-shoulder" &&
      path.sourceStage === "opensim-geometry-path",
    file + ": unexpected biomechanics source"
  );
  assert(
    path.coordinateSpace === "body-relative" &&
      path.referenceBody === "thorax",
    file + ": path must be thorax-relative"
  );
  assert(
    path.centerlinePolicy === "source-polyline-arc-length-resample",
    file + ": centerline policy mismatch"
  );
  assert(
    Number.isInteger(path.resampledPointCount) &&
      path.resampledPointCount >= 8,
    file + ": invalid resampled point count"
  );
  assert(
    Array.isArray(path.frames) && path.frames.length >= 3,
    file + ": too few frames"
  );
  assert(
    Array.isArray(path.sourcePointCounts) &&
      path.sourcePointCounts.length >= 1,
    file + ": source point topology metadata missing"
  );

  let previous = null;
  let maxSpeed = 0;
  for (const [frameIndex, frame] of path.frames.entries()) {
    assert(Number.isFinite(frame.time), file + ": non-finite frame time");
    assert(
      Array.isArray(frame.points) &&
        frame.points.length === path.resampledPointCount,
      file + ": unstable resampled point count"
    );
    assert(
      frame.points.every(finiteVec3),
      file + ": invalid centerline point"
    );
    assert(
      Number.isFinite(frame.musculotendonLength) &&
        frame.musculotendonLength > 0.01 &&
        frame.musculotendonLength < 1.5,
      file + ": implausible musculotendon length"
    );

    if (previous) {
      const dt = frame.time - previous.time;
      assert(dt > 0, file + ": non-positive frame interval");
      for (let i = 0; i < frame.points.length; i += 1) {
        maxSpeed = Math.max(
          maxSpeed,
          distance(previous.points[i], frame.points[i]) / dt
        );
      }
    }
    previous = frame;
  }

  assert(
    maxSpeed < 3.0,
    file + ": wrap-aware centerline is discontinuous"
  );
  assert(
    Math.abs(maxSpeed - path.maxResampledPointSpeed) < 1e-6,
    file + ": recorded point-speed QA does not match frames"
  );

  console.log(
    file +
      ": semantic=" +
      path.semanticId +
      ", frames=" +
      path.frames.length +
      ", sourcePoints=" +
      path.sourcePointCounts.join("/") +
      ", fixedPoints=" +
      path.resampledPointCount +
      ", maxPointSpeed=" +
      maxSpeed.toFixed(3) +
      "m/s"
  );
}
