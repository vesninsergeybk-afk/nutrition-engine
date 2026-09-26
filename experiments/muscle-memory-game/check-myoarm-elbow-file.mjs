import fs from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("Pass MyoArm elbow JSON");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(data.schema === "myoarm-elbow-motion-v1", "Unexpected schema");
assert(data.sourceId === "myosim-arm", "Wrong source ID");
assert(
  data.sourceRevision === "93b0ca8f4ec90c9899ee7f05fee561e9911da91b",
  "MyoArm source must be pinned"
);
assert(
  data.sourceStage === "mujoco-forward-kinematics",
  "Wrong source stage"
);
assert(data.movementId === "elbow-flexion", "Wrong movement");
assert(Array.isArray(data.frames) && data.frames.length >= 60, "Too few frames");

let previousAngle = -Infinity;
let maxBodyStep = 0;
for (const [index, frame] of data.frames.entries()) {
  assert(frame.elbowFlexionRad > previousAngle, "Elbow angle must increase");
  previousAngle = frame.elbowFlexionRad;

  for (const bodyId of ["humerus", "ulna", "radius"]) {
    const pose = frame.bodies?.[bodyId];
    assert(pose, "Missing body pose: " + bodyId);
    assert(
      pose.position.length === 3 &&
        pose.position.every(Number.isFinite) &&
        pose.quaternion.length === 4 &&
        pose.quaternion.every(Number.isFinite),
      "Invalid body pose: " + bodyId
    );
    const qn = Math.hypot(...pose.quaternion);
    assert(Math.abs(qn - 1) < 1e-6, "Body quaternion not normalized: " + bodyId);
  }

  for (const muscleId of ["biceps-long", "biceps-short"]) {
    const path = frame.musclePaths?.[muscleId];
    assert(path && path.length > 0, "Missing tendon path: " + muscleId);
    assert(
      Array.isArray(path.points) &&
        path.points.length >= 2 &&
        path.points.every(
          point =>
            Array.isArray(point) &&
            point.length === 3 &&
            point.every(Number.isFinite)
        ),
      "Invalid tendon points: " + muscleId
    );
  }

  if (index > 0) {
    const previous = data.frames[index - 1];
    for (const bodyId of ["humerus", "ulna", "radius"]) {
      const a = previous.bodies[bodyId].position;
      const b = frame.bodies[bodyId].position;
      maxBodyStep = Math.max(
        maxBodyStep,
        Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
      );
    }
  }
}

for (const muscleId of ["biceps-long", "biceps-short"]) {
  const start = data.frames[0].musclePaths[muscleId].length;
  const end = data.frames.at(-1).musclePaths[muscleId].length;
  assert(end < start, muscleId + " must shorten during flexion");
}

assert(maxBodyStep < 0.02, "Body transform discontinuity");
console.log(
  "MyoArm elbow clip verified:",
  data.frames.length,
  "frames, range",
  data.joint.minDeg.toFixed(1) + "-" + data.joint.maxDeg.toFixed(1),
  "deg"
);
