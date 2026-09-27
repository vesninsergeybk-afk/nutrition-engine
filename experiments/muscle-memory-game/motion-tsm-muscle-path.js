import { MOTION_SOURCES } from "./motion-sources.js";

const SOURCE = MOTION_SOURCES["thoracoscapular-shoulder"];

const PATHS = Object.freeze({
  "deltoid-acromial:shoulder-abduction": Object.freeze({
    semanticId: "deltoid-acromial",
    movementId: "shoulder-abduction",
    path:
      "./assets/motion/tsm/muscles/deltoid-acromial-abduction-path.json",
    sourceMuscleName: "DeltoideusScapula_M",
  }),
});

function key(semanticId, movementId) {
  return String(semanticId || "") + ":" + String(movementId || "");
}

export function tsmMusclePathSpec(semanticId, movementId) {
  return PATHS[key(semanticId, movementId)] || null;
}

export function tsmMusclePathUrl(semanticId, movementId) {
  const spec = tsmMusclePathSpec(semanticId, movementId);
  if (!spec) {
    throw new Error(
      "Unsupported TSM muscle path: " + semanticId + " / " + movementId
    );
  }
  return new URL(spec.path, import.meta.url).toString();
}

function finitePoint(point, label) {
  if (!Array.isArray(point) || point.length !== 3) {
    throw new Error(label + " must be vec3");
  }
  const out = point.map(Number);
  if (out.some((value) => !Number.isFinite(value))) {
    throw new Error(label + " contains a non-finite value");
  }
  return out;
}

export function validateTsmMusclePathData(raw, spec) {
  if (!raw || raw.schema !== "motion-muscle-path-v1") {
    throw new Error("Unexpected TSM muscle-path schema");
  }
  if (
    raw.semanticId !== spec.semanticId ||
    raw.sourceMuscleName !== spec.sourceMuscleName ||
    raw.sourceId !== SOURCE.id ||
    raw.sourceStage !== "opensim-geometry-path" ||
    raw.referenceBody !== "thorax" ||
    raw.coordinateSpace !== "body-relative"
  ) {
    throw new Error("TSM muscle-path provenance mismatch");
  }
  if (!Array.isArray(raw.frames) || raw.frames.length < 2) {
    throw new Error("TSM muscle path needs at least two frames");
  }
  if (!Number.isInteger(raw.resampledPointCount) || raw.resampledPointCount < 2) {
    throw new Error("Invalid TSM muscle-path point count");
  }

  let previousTime = -Infinity;
  const frames = raw.frames.map((frame, frameIndex) => {
    const time = Number(frame.time);
    const length = Number(frame.musculotendonLength);
    if (!Number.isFinite(time) || !(time > previousTime)) {
      throw new Error("TSM muscle-path frame times must increase");
    }
    previousTime = time;
    if (!Number.isFinite(length) || !(length > 0)) {
      throw new Error("Invalid TSM musculotendon length");
    }
    if (
      !Array.isArray(frame.points) ||
      frame.points.length !== raw.resampledPointCount
    ) {
      throw new Error("Unexpected TSM muscle-path point count in frame");
    }
    return Object.freeze({
      time,
      musculotendonLength: length,
      points: Object.freeze(
        frame.points.map((point, pointIndex) =>
          Object.freeze(
            finitePoint(
              point,
              "frame[" + frameIndex + "].points[" + pointIndex + "]"
            )
          )
        )
      ),
    });
  });

  const startTime = frames[0].time;
  const duration = frames[frames.length - 1].time - startTime;
  if (!(duration > 0)) {
    throw new Error("TSM muscle path duration must be positive");
  }

  return Object.freeze({
    schema: raw.schema,
    semanticId: raw.semanticId,
    sourceMuscleName: raw.sourceMuscleName,
    sourceId: raw.sourceId,
    sourceRevision: SOURCE.revision,
    sourceStage: raw.sourceStage,
    referenceBody: raw.referenceBody,
    coordinateSpace: raw.coordinateSpace,
    resampledPointCount: raw.resampledPointCount,
    targetSampleHz: Number(raw.targetSampleHz) || null,
    startTime,
    duration,
    frames: Object.freeze(frames),
  });
}

export async function loadTsmMusclePath(
  semanticId,
  movementId,
  { fetchFn = globalThis.fetch } = {}
) {
  const spec = tsmMusclePathSpec(semanticId, movementId);
  if (!spec) return null;
  if (typeof fetchFn !== "function") {
    throw new Error("A fetch implementation is required");
  }
  const response = await fetchFn(tsmMusclePathUrl(semanticId, movementId));
  if (!response?.ok) {
    throw new Error(
      "Could not load TSM muscle path: HTTP " +
        (response?.status ?? "unknown")
    );
  }
  return Object.freeze({
    spec,
    data: validateTsmMusclePathData(await response.json(), spec),
  });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function sampleTsmMusclePath(loaded, progress) {
  const data = loaded?.data;
  if (!data?.frames?.length) {
    throw new Error("TSM muscle path is not loaded");
  }
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const targetTime = data.startTime + data.duration * p;
  const frames = data.frames;
  if (targetTime <= frames[0].time) return frames[0];
  const last = frames[frames.length - 1];
  if (targetTime >= last.time) return last;

  let hi = 1;
  while (hi < frames.length && frames[hi].time < targetTime) hi += 1;
  const a = frames[hi - 1];
  const b = frames[hi];
  const alpha =
    (targetTime - a.time) / Math.max(1e-9, b.time - a.time);

  return Object.freeze({
    time: targetTime,
    musculotendonLength: lerp(
      a.musculotendonLength,
      b.musculotendonLength,
      alpha
    ),
    points: Object.freeze(
      a.points.map((point, index) =>
        Object.freeze([
          lerp(point[0], b.points[index][0], alpha),
          lerp(point[1], b.points[index][1], alpha),
          lerp(point[2], b.points[index][2], alpha),
        ])
      )
    ),
  });
}
