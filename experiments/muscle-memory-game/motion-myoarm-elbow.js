import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

const ASSET_ROOT = "./assets/motion/myoarm/elbow";
const DATA_URL = ASSET_ROOT + "/myoarm-elbow-flexion.json";
const BONE_URLS = Object.freeze({
  humerus: ASSET_ROOT + "/humerus.stl",
  ulna: ASSET_ROOT + "/ulna.stl",
  radius: ASSET_ROOT + "/radius.stl",
});

function validatePose(pose, label) {
  if (!pose || !Array.isArray(pose.position) || pose.position.length !== 3 ||
      !Array.isArray(pose.quaternion) || pose.quaternion.length !== 4) {
    throw new Error("Invalid MyoArm body pose: " + label);
  }
}

function validateMusclePath(path, label) {
  if (!path || !Number.isFinite(path.length) || !Array.isArray(path.wrapRows) || !path.wrapRows.length) {
    throw new Error("Invalid MyoArm muscle path: " + label);
  }
  for (const row of path.wrapRows) {
    if (!Array.isArray(row.from) || row.from.length !== 3 || !Array.isArray(row.to) || row.to.length !== 3) {
      throw new Error("Invalid MyoArm wrap segment: " + label);
    }
  }
}

export async function loadMyoArmElbowRuntime() {
  const loader = new STLLoader();
  const [response, humerus, ulna, radius] = await Promise.all([
    fetch(DATA_URL),
    loader.loadAsync(BONE_URLS.humerus),
    loader.loadAsync(BONE_URLS.ulna),
    loader.loadAsync(BONE_URLS.radius),
  ]);
  if (!response.ok) {
    throw new Error("Could not load MyoArm elbow motion data: HTTP " + response.status);
  }
  const data = await response.json();
  if (data?.schema !== "myoarm-elbow-motion-v1" ||
      data?.sourceRevision !== "93b0ca8f4ec90c9899ee7f05fee561e9911da91b" ||
      !Array.isArray(data?.frames) || data.frames.length < 2) {
    throw new Error("Unexpected MyoArm elbow runtime data");
  }
  for (const frame of data.frames) {
    for (const bodyId of ["humerus", "ulna", "radius"]) validatePose(frame.bodies?.[bodyId], bodyId);
    validateMusclePath(frame.musclePaths?.["biceps-long"], "biceps-long");
    validateMusclePath(frame.musclePaths?.["biceps-short"], "biceps-short");
  }
  const geometries = new Map([["humerus", humerus], ["ulna", ulna], ["radius", radius]]);
  for (const [bodyId, geometry] of geometries) {
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.userData.motionSemanticId = bodyId;
    geometry.userData.motionAssetId = "myoarm-native-bones";
  }
  return Object.freeze({ data, geometries });
}

export function myoArmElbowFrameAtProgress(runtime, progress) {
  const frames = runtime?.data?.frames || [];
  if (!frames.length) throw new Error("MyoArm elbow runtime has no frames");
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const index = Math.min(frames.length - 1, Math.max(0, Math.round(p * (frames.length - 1))));
  return frames[index];
}

export function myoArmElbowRange(runtime) {
  const joint = runtime?.data?.joint;
  if (!joint) return null;
  return Object.freeze({ minDeg: Number(joint.minDeg), maxDeg: Number(joint.maxDeg) });
}

export function myoArmElbowSelectedHeads(selectedUnits) {
  const selected = new Set(selectedUnits || []);
  const heads = ["biceps-long", "biceps-short"].filter((id) => selected.has(id));
  return heads.length ? heads : ["biceps-long", "biceps-short"];
}

export function myoArmElbowMaxWrapSegments(runtime, muscleId) {
  return Math.max(0, ...(runtime?.data?.frames || []).map((frame) => frame.musclePaths?.[muscleId]?.wrapRows?.length || 0));
}

export function myoArmElbowBoneIds() {
  return ["humerus", "ulna", "radius"];
}
