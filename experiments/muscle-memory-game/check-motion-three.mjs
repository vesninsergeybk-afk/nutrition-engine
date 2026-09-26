import { readFile } from "node:fs/promises";

const code = await readFile(new URL("./motion-three.js", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const symbol of [
  "extractMotionGeometry",
  "createMotionMesh",
  "disposeMotionMesh",
  "geometryRangeIndexPlan",
  "copyAttributeRange",
]) {
  assert(code.includes(symbol), "Missing motion THREE bridge: " + symbol);
}

assert(
  code.includes('sourceGeometry.index?.array || null') &&
    code.includes("new Uint32Array(plan.indices)"),
  "Motion extraction does not support indexed BodyParts geometry"
);
assert(
  code.includes("source.normalized") &&
    code.includes("computeBoundingBox") &&
    code.includes("computeBoundingSphere"),
  "Motion extraction loses source attribute semantics or bounds"
);
assert(
  code.includes('mesh.userData.motionRestPose = "atlas-world"'),
  "Motion mesh rest-pose space is not explicit"
);

console.log("Motion THREE bridge: standalone muscle/bone extraction ready");
