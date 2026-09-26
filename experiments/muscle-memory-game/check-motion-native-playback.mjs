import { readFile } from "node:fs/promises";
import { createMotionClip } from "./motion-clip.js";
import {
  adductionSourceTime,
  sampleTsmAdductionPose,
} from "./motion-native-playback.js";
import { MOTION_VISUAL_ASSETS } from "./motion-visual-assets.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const raw = JSON.parse(
  await readFile(
    new URL("motion-clips/tsm-abduction-teaching-compact.json", import.meta.url),
    "utf8"
  )
);
const clip = createMotionClip(raw);

assert(clip.frames.length === 25, "Compact TSM clip keyframe count changed");
assert(
  clip.sourceStage === "opensim-cmc-kinematics" &&
    clip.referenceBody === "thorax",
  "Compact clip must preserve CMC/thorax-relative provenance"
);
assert(
  adductionSourceTime(clip, 0) === clip.duration &&
    adductionSourceTime(clip, 1) === 0,
  "Adduction demo must reverse the verified abduction path"
);

const start = sampleTsmAdductionPose(clip, 0);
const end = sampleTsmAdductionPose(clip, 1);
const q0 = start.bodies.humerus.quaternion;
const q1 = end.bodies.humerus.quaternion;
const dot = Math.min(
  1,
  Math.abs(q0.reduce((sum, value, index) => sum + value * q1[index], 0))
);
const humeralChangeDeg = (2 * Math.acos(dot) * 180) / Math.PI;
assert(humeralChangeDeg > 60, "Source-derived excursion is unexpectedly small");

const profile = MOTION_VISUAL_ASSETS["tsm-native-bones"];
const modelUrl =
  "https://raw.githubusercontent.com/" +
  profile.repository +
  "/" +
  profile.revision +
  "/OpenSim%20Models/for%20CMC/TSM_subject_CMC_noWeight.osim";
const modelResponse = await fetch(modelUrl);
assert(modelResponse.ok, "Could not fetch pinned OpenSim model for scale audit");
const modelText = await modelResponse.text();

for (const boneId of ["thorax", "clavicle", "scapula", "humerus"]) {
  const registered = profile.scaleFactors?.[boneId];
  assert(registered?.length === 3, "Missing scale factors: " + boneId);
  const bodyStart = modelText.indexOf('<Body name="' + boneId + '">');
  const bodyEnd = modelText.indexOf("</Body>", bodyStart);
  const bodyText = modelText.slice(bodyStart, bodyEnd);
  const meshIndex = bodyText.indexOf("<mesh_file>" + boneId + ".vtp</mesh_file>");
  const scaleMatches = [
    ...bodyText
      .slice(0, meshIndex)
      .matchAll(/<scale_factors>([^<]+)<\/scale_factors>/g),
  ];
  const source = scaleMatches.at(-1)?.[1]
    ?.trim()
    .split(/\s+/)
    .map(Number);
  assert(source?.length === 3, "Source scale factors missing: " + boneId);
  assert(
    registered.every(
      (value, index) => Math.abs(value - source[index]) < 1e-12
    ),
    "Registered scale factors differ from OpenSim: " + boneId
  );
}

console.log(
  "TSM native playback: source-derived shoulder path is reversed only for kinematic adduction"
);
console.log(
  "TSM native playback: OpenSim visual scale factors verified; muscle activation is not inferred"
);
