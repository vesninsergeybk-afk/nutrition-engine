import { createMotionClip, sampleMotionClip } from "./motion-clip.js";

const TSM_ADDUCTION_SOURCE_URL =
  "./motion-clips/tsm-abduction-teaching-compact.json";

export async function loadTsmAdductionDemoClip({
  fetchFn = globalThis.fetch,
} = {}) {
  if (typeof fetchFn !== "function") {
    throw new Error("A fetch implementation is required");
  }
  const response = await fetchFn(TSM_ADDUCTION_SOURCE_URL);
  if (!response?.ok) {
    throw new Error(
      "Could not load compact TSM shoulder clip: HTTP " +
        (response?.status ?? "unknown")
    );
  }
  const clip = createMotionClip(await response.json());
  if (
    clip.sourceId !== "thoracoscapular-shoulder" ||
    clip.sourceStage !== "opensim-cmc-kinematics" ||
    clip.movementId !== "shoulder-abduction" ||
    clip.referenceBody !== "thorax"
  ) {
    throw new Error("Unexpected TSM shoulder demo clip provenance");
  }
  return clip;
}

export function adductionSourceTime(clip, progress) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0));
  return clip.duration * (1 - p);
}

export function sampleTsmAdductionPose(clip, progress) {
  return sampleMotionClip(clip, adductionSourceTime(clip, progress));
}

export function applyTsmBodyPose(mesh, pose) {
  if (!mesh || !pose) return;
  mesh.position.set(...pose.position);
  const [w, x, y, z] = pose.quaternion;
  mesh.quaternion.set(x, y, z, w);
  mesh.updateMatrixWorld(true);
}
