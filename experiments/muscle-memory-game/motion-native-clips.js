import { createMotionClip, sampleMotionClip } from "./motion-clip.js";
import { MOTION_SOURCES } from "./motion-sources.js";

const CLIPS = Object.freeze({
  "shoulder-abduction": Object.freeze({
    path: "./assets/motion/tsm/clips/tsm-abduction-teaching-01.json",
    sourceMovementId: "shoulder-abduction",
    playbackDirection: "forward",
    interpretation:
      "Verified source-derived CMC abduction excursion.",
  }),
  "shoulder-adduction": Object.freeze({
    path: "./assets/motion/tsm/clips/tsm-abduction-teaching-01.json",
    sourceMovementId: "shoulder-abduction",
    playbackDirection: "reverse",
    interpretation:
      "Kinematic reverse of the verified source-derived abduction excursion; not a separately measured active adduction trial.",
  }),
});

export function tsmNativeMotionSpec(movementId) {
  return CLIPS[movementId] || null;
}

export function tsmNativeMotionUrl(movementId) {
  const spec = tsmNativeMotionSpec(movementId);
  if (!spec) throw new Error("Unsupported TSM native movement: " + movementId);
  return new URL(spec.path, import.meta.url).toString();
}

export async function loadTsmNativeMotionClip(
  movementId,
  { fetchFn = globalThis.fetch } = {}
) {
  const spec = tsmNativeMotionSpec(movementId);
  if (!spec) throw new Error("Unsupported TSM native movement: " + movementId);
  if (typeof fetchFn !== "function") {
    throw new Error("A fetch implementation is required");
  }

  const response = await fetchFn(tsmNativeMotionUrl(movementId));
  if (!response?.ok) {
    throw new Error(
      "Could not load TSM native motion clip: HTTP " +
        (response?.status ?? "unknown")
    );
  }
  const raw = await response.json();
  const clip = createMotionClip(raw);
  const source = MOTION_SOURCES["thoracoscapular-shoulder"];

  if (
    clip.sourceId !== source.id ||
    clip.sourceRevision !== source.revision ||
    clip.movementId !== spec.sourceMovementId ||
    clip.coordinateSpace !== "body-relative" ||
    clip.referenceBody !== "thorax"
  ) {
    throw new Error("TSM native motion clip provenance mismatch");
  }

  return Object.freeze({ spec, clip });
}

export function sampleTsmNativeMotion(
  loaded,
  progress
) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0));
  const { clip, spec } = loaded;
  const time =
    spec.playbackDirection === "reverse"
      ? clip.duration * (1 - p)
      : clip.duration * p;
  return sampleMotionClip(clip, time);
}

export function tsmNativeMotionSourceRange(loaded) {
  const phase = loaded?.clip?.sourcePhase;
  if (!phase) return null;
  const start =
    loaded.spec.playbackDirection === "reverse"
      ? phase.endValue
      : phase.startValue;
  const end =
    loaded.spec.playbackDirection === "reverse"
      ? phase.startValue
      : phase.endValue;
  return Object.freeze({ start, end, coordinate: phase.coordinate });
}
