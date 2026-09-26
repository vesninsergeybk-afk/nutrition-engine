import fs from "node:fs";
import { createMotionClip } from "./motion-clip.js";

const files = process.argv.slice(2);
if (!files.length) {
  throw new Error("Pass at least one motion clip JSON file");
}

function quaternionAngularDistance(a, b) {
  const dot = Math.min(
    1,
    Math.abs(a.reduce((sum, value, index) => sum + value * b[index], 0))
  );
  return 2 * Math.acos(dot);
}

function vectorDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function rawQuaternionNorm(q) {
  return Math.hypot(...q);
}

for (const file of files) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));

  let maxRawQuaternionError = 0;
  for (const [frameIndex, frame] of parsed.frames.entries()) {
    for (const [bodyId, pose] of Object.entries(frame.bodies || {})) {
      if (!Array.isArray(pose.quaternion) || pose.quaternion.length !== 4) {
        throw new Error(
          file + ": raw quaternion missing for frame " + frameIndex + "/" + bodyId
        );
      }
      const error = Math.abs(rawQuaternionNorm(pose.quaternion) - 1);
      maxRawQuaternionError = Math.max(maxRawQuaternionError, error);
      if (error > 1e-6) {
        throw new Error(
          file + ": raw quaternion is not normalized before clip parsing"
        );
      }
    }
  }

  const clip = createMotionClip(parsed);

  if (clip.sourceId === "thoracoscapular-shoulder") {
    if (
      clip.coordinateSpace !== "body-relative" ||
      clip.referenceBody !== "thorax"
    ) {
      throw new Error(file + ": TSM clip must be thorax-relative");
    }
    if (
      clip.sourceStage !== "opensim-cmc-kinematics" ||
      Math.abs(clip.desiredKinematicsLowpassHz - 3) > 1e-9
    ) {
      throw new Error(
        file + ": TSM teaching clip must identify the CMC source stage and 3 Hz desired-kinematics filter"
      );
    }
    if (!/Results\/CMC analysis\//.test(clip.sourceMotion || "")) {
      throw new Error(file + ": TSM teaching clip must come from CMC kinematics");
    }
    if (!clip.sourcePhase) {
      throw new Error(file + ": teaching clip is missing sourcePhase metadata");
    }
    if (clip.sourcePhase.progressQuality < 0.9) {
      throw new Error(file + ": teaching phase is not monotonic enough");
    }
    if (
      clip.sourcePhase.peakPolicy !== "dominant-global-peak" ||
      !(clip.sourcePhase.smoothingSeconds > 0)
    ) {
      throw new Error(file + ": teaching phase detector metadata incomplete");
    }
    if (!(clip.duration > 0.2 && clip.duration < 5)) {
      throw new Error(file + ": teaching phase duration is implausible");
    }
    if (!(clip.targetSampleHz >= 50 && clip.targetSampleHz <= 120)) {
      throw new Error(file + ": unexpected teaching clip sample rate");
    }
  }

  let maxTranslationStep = 0;
  let maxRotationStep = 0;
  let maxTranslationSpeed = 0;
  let maxRotationSpeed = 0;
  let maxFrameDt = 0;

  for (let index = 1; index < clip.frames.length; index += 1) {
    const previous = clip.frames[index - 1];
    const current = clip.frames[index];
    const dt = current.time - previous.time;
    if (!(dt > 0)) throw new Error(file + ": non-positive frame dt");
    maxFrameDt = Math.max(maxFrameDt, dt);

    for (const bodyId of Object.keys(current.bodies)) {
      const translationStep = vectorDistance(
        previous.bodies[bodyId].position,
        current.bodies[bodyId].position
      );
      const rotationStep = quaternionAngularDistance(
        previous.bodies[bodyId].quaternion,
        current.bodies[bodyId].quaternion
      );
      maxTranslationStep = Math.max(maxTranslationStep, translationStep);
      maxRotationStep = Math.max(maxRotationStep, rotationStep);
      maxTranslationSpeed = Math.max(
        maxTranslationSpeed,
        translationStep / dt
      );
      maxRotationSpeed = Math.max(maxRotationSpeed, rotationStep / dt);
    }
  }

  // Technical discontinuity guards for these pinned teaching clips.
  // They are not anatomical ROM norms.
  if (clip.targetSampleHz) {
    const nominalDt = 1 / clip.targetSampleHz;
    const minAllowedDt = nominalDt * 0.5;
    const maxAllowedDt = nominalDt * 1.5;
    let minFrameDt = Infinity;
    for (let index = 1; index < clip.frames.length; index += 1) {
      minFrameDt = Math.min(
        minFrameDt,
        clip.frames[index].time - clip.frames[index - 1].time
      );
    }
    if (minFrameDt < minAllowedDt || maxFrameDt > maxAllowedDt) {
      throw new Error(
        file + ": exported cadence deviates too far from target sample rate"
      );
    }
  }
  if (maxTranslationSpeed > 0.25) {
    throw new Error(file + ": body translation speed indicates a discontinuity");
  }
  if (maxRotationSpeed > (180 * Math.PI) / 180) {
    throw new Error(file + ": body rotation speed indicates a discontinuity");
  }

  console.log(
    file +
      ": " +
      clip.frames.length +
      " frames, duration=" +
      clip.duration.toFixed(3) +
      "s, source=" +
      clip.sourceId +
      ", stage=" +
      (clip.sourceStage || "unspecified") +
      ", space=" +
      (clip.coordinateSpace || "unspecified") +
      ", reference=" +
      (clip.referenceBody || "ground") +
      ", dedup=" +
      clip.sourceDuplicateRowsRemoved +
      ", maxRawQErr=" +
      maxRawQuaternionError.toExponential(2) +
      ", maxStep=" +
      (maxTranslationStep * 1000).toFixed(2) +
      "mm/" +
      ((maxRotationStep * 180) / Math.PI).toFixed(2) +
      "deg" +
      ", maxSpeed=" +
      maxTranslationSpeed.toFixed(3) +
      "m/s/" +
      ((maxRotationSpeed * 180) / Math.PI).toFixed(1) +
      "deg/s" +
      (clip.sourcePhase
        ? ", phase=" +
          clip.sourcePhase.coordinate +
          " " +
          clip.sourcePhase.sourceStartTime.toFixed(2) +
          "-" +
          clip.sourcePhase.sourceEndTime.toFixed(2) +
          "s"
        : "")
  );
}
