import { motionPilot } from "./motion-readiness.js";
import { motionSource } from "./motion-sources.js";

function finiteNumber(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(label + " must be finite");
  return n;
}

function vector3(value, label) {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error(label + " must be vec3");
  }
  return Object.freeze(
    value.map((n, i) => finiteNumber(n, label + "[" + i + "]"))
  );
}

function quaternion(value, label) {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new Error(label + " must be quaternion");
  }
  const q = value.map((n, i) => finiteNumber(n, label + "[" + i + "]"));
  const norm = Math.hypot(...q);
  if (!(norm > 1e-8)) throw new Error(label + " quaternion has zero norm");
  return Object.freeze(q.map((n) => n / norm));
}

function bodyPose(value, label) {
  if (!value || typeof value !== "object") {
    throw new Error(label + " body pose missing");
  }
  return Object.freeze({
    position: vector3(value.position, label + ".position"),
    quaternion: quaternion(value.quaternion, label + ".quaternion"),
  });
}

export function createMotionClip({
  schema = "motion-clip-v1",
  id,
  pilotId,
  movementId,
  sourceId,
  sourceRevision,
  sourceMotion = null,
  frames,
} = {}) {
  if (schema !== "motion-clip-v1") {
    throw new Error("Unsupported motion clip schema");
  }
  if (!id || !pilotId || !movementId || !sourceId || !sourceRevision) {
    throw new Error("Motion clip metadata incomplete");
  }
  const pilot = motionPilot(pilotId);
  if (!pilot) throw new Error("Unknown motion pilot: " + pilotId);
  const source = motionSource(sourceId);
  if (!source) throw new Error("Unknown motion source: " + sourceId);
  if (source.revision && source.revision !== sourceRevision) {
    throw new Error(
      "Motion clip source revision does not match pinned registry: " +
        sourceRevision +
        " != " +
        source.revision
    );
  }
  if (!Array.isArray(frames) || frames.length < 2) {
    throw new Error("Motion clip needs at least two frames");
  }

  let previousTime = -Infinity;
  const normalizedFrames = frames.map((frame, frameIndex) => {
    const time = finiteNumber(frame?.time, "frame.time");
    if (!(time > previousTime)) {
      throw new Error("Motion clip times must be strictly increasing");
    }
    previousTime = time;
    const bodies = {};
    for (const bodyId of pilot.bodies) {
      bodies[bodyId] = bodyPose(
        frame?.bodies?.[bodyId],
        "frame[" + frameIndex + "]." + bodyId
      );
    }
    return Object.freeze({ time, bodies: Object.freeze(bodies) });
  });

  return Object.freeze({
    schema,
    id,
    pilotId,
    movementId,
    sourceId,
    sourceRevision,
    sourceMotion,
    duration:
      normalizedFrames[normalizedFrames.length - 1].time -
      normalizedFrames[0].time,
    frames: Object.freeze(normalizedFrames),
  });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function nlerpQuaternion(a, b, t) {
  let bx = b[0];
  let by = b[1];
  let bz = b[2];
  let bw = b[3];
  const dot = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (dot < 0) {
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  const q = [
    lerp(a[0], bx, t),
    lerp(a[1], by, t),
    lerp(a[2], bz, t),
    lerp(a[3], bw, t),
  ];
  const norm = Math.hypot(...q);
  return q.map((n) => n / norm);
}

export function sampleMotionClip(clip, time) {
  if (!clip?.frames?.length) throw new Error("Invalid motion clip");
  const frames = clip.frames;
  const t = Number(time);
  if (!Number.isFinite(t)) throw new Error("Sample time must be finite");
  if (t <= frames[0].time) return frames[0];
  const last = frames[frames.length - 1];
  if (t >= last.time) return last;

  let hi = 1;
  while (hi < frames.length && frames[hi].time < t) hi += 1;
  const a = frames[hi - 1];
  const b = frames[hi];
  const alpha = (t - a.time) / Math.max(1e-9, b.time - a.time);
  const bodies = {};
  for (const bodyId of Object.keys(a.bodies)) {
    bodies[bodyId] = Object.freeze({
      position: Object.freeze([
        lerp(
          a.bodies[bodyId].position[0],
          b.bodies[bodyId].position[0],
          alpha
        ),
        lerp(
          a.bodies[bodyId].position[1],
          b.bodies[bodyId].position[1],
          alpha
        ),
        lerp(
          a.bodies[bodyId].position[2],
          b.bodies[bodyId].position[2],
          alpha
        ),
      ]),
      quaternion: Object.freeze(
        nlerpQuaternion(
          a.bodies[bodyId].quaternion,
          b.bodies[bodyId].quaternion,
          alpha
        )
      ),
    });
  }
  return Object.freeze({ time: t, bodies: Object.freeze(bodies) });
}
