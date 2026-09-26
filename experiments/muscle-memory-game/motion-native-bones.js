import * as THREE from "three";
import { MOTION_VISUAL_ASSETS } from "./motion-visual-assets.js";
import { parseAsciiVtpPolyData } from "./motion-vtp.js";

const DEFAULT_TSM_BONES = Object.freeze([
  "thorax",
  "clavicle",
  "scapula",
  "humerus",
]);

function rawGitHubUrl(profile, path) {
  const encodedPath = String(path)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return (
    "https://raw.githubusercontent.com/" +
    profile.repository +
    "/" +
    profile.revision +
    "/" +
    encodedPath
  );
}

export function tsmNativeBoneUrl(boneId) {
  const profile = MOTION_VISUAL_ASSETS["tsm-native-bones"];
  const path = profile?.assets?.[boneId];
  if (!profile || !path) {
    throw new Error("Unknown TSM native bone asset: " + boneId);
  }
  return rawGitHubUrl(profile, path);
}

export async function loadTsmNativeBoneGeometries({
  boneIds = DEFAULT_TSM_BONES,
  fetchFn = globalThis.fetch,
} = {}) {
  if (typeof fetchFn !== "function") {
    throw new Error("A fetch implementation is required");
  }

  const entries = await Promise.all(
    boneIds.map(async (boneId) => {
      const response = await fetchFn(tsmNativeBoneUrl(boneId));
      if (!response?.ok) {
        throw new Error(
          "Could not load TSM native bone " +
            boneId +
            ": HTTP " +
            (response?.status ?? "unknown")
        );
      }
      const parsed = parseAsciiVtpPolyData(await response.text());
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(parsed.positions, 3)
      );
      geometry.setIndex(new THREE.BufferAttribute(parsed.indices, 1));
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      geometry.userData.motionSemanticId = boneId;
      geometry.userData.motionAssetId = "tsm-native-bones";
      geometry.userData.motionSourcePointCount = parsed.pointCount;
      geometry.userData.motionSourcePolygonCount = parsed.polygonCount;
      return [boneId, geometry];
    })
  );

  return new Map(entries);
}

export function defaultTsmNativeBoneIds() {
  return [...DEFAULT_TSM_BONES];
}
