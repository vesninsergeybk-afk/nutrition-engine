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

for (const file of files) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const clip = createMotionClip(parsed);

  if (clip.sourceId === "thoracoscapular-shoulder") {
    if (clip.coordinateSpace !== "body-relative" || clip.referenceBody !== "thorax") {
      throw new Error(file + ": TSM clip must be thorax-relative");
    }
    if (!clip.sourcePhase) {
      throw new Error(file + ": teaching clip is missing sourcePhase metadata");
    }
    if (clip.sourcePhase.progressQuality < 0.9) {
      throw new Error(file + ": teaching phase is not monotonic enough");
    }
    if (!(clip.duration > 0.2 && clip.duration < 5)) {
      throw new Error(file + ": teaching phase duration is implausible");
    }
  }

  let maxTranslationStep = 0;
  let maxRotationStep = 0;
  for (let index = 1; index < clip.frames.length; index += 1) {
    const previous = clip.frames[index - 1];
    const current = clip.frames[index];
    for (const bodyId of Object.keys(current.bodies)) {
      maxTranslationStep = Math.max(
        maxTranslationStep,
        vectorDistance(
          previous.bodies[bodyId].position,
          current.bodies[bodyId].position
        )
      );
      maxRotationStep = Math.max(
        maxRotationStep,
        quaternionAngularDistance(
          previous.bodies[bodyId].quaternion,
          current.bodies[bodyId].quaternion
        )
      );
    }
  }
  if (maxTranslationStep > 0.02) {
    throw new Error(file + ": discontinuous body translation");
  }
  if (maxRotationStep > (15 * Math.PI) / 180) {
    throw new Error(file + ": discontinuous body rotation");
  }

  console.log(
    file +
      ": " +
      clip.frames.length +
      " frames, duration=" +
      clip.duration.toFixed(3) +
      "s, source=" +
      clip.sourceId +
      ", space=" +
      (clip.coordinateSpace || "unspecified") +
      ", reference=" +
      (clip.referenceBody || "ground") +
      ", maxStep=" +
      maxTranslationStep.toFixed(5) +
      "m/" +
      ((maxRotationStep * 180) / Math.PI).toFixed(2) +
      "deg" +
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
