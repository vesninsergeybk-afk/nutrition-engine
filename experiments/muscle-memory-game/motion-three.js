import * as THREE from "three";
import {
  copyAttributeRange,
  geometryRangeIndexPlan,
} from "./motion-geometry.js";

export function extractMotionGeometry(
  sourceGeometry,
  range,
  {
    attributes = ["position", "normal", "color"],
    computeBounds = true,
  } = {}
) {
  if (!sourceGeometry) throw new Error("Source geometry is required");

  const sourceIndex = sourceGeometry.index?.array || null;
  const plan = geometryRangeIndexPlan(range, sourceIndex);
  const geometry = new THREE.BufferGeometry();

  for (const name of attributes) {
    const source = sourceGeometry.getAttribute(name);
    if (!source) continue;

    const copied = copyAttributeRange(
      source.array,
      source.itemSize,
      plan.vertexStart,
      plan.vertexCount
    );
    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(
        copied,
        source.itemSize,
        source.normalized
      )
    );
  }

  if (!geometry.getAttribute("position")) {
    geometry.dispose();
    throw new Error("Extracted motion geometry has no position attribute");
  }

  if (plan.indexed) {
    geometry.setIndex(
      new THREE.BufferAttribute(new Uint32Array(plan.indices), 1)
    );
  }

  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  if (computeBounds) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  return geometry;
}

export function createMotionMesh(
  sourceMesh,
  range,
  {
    material = null,
    name = "",
    kind = "structure",
  } = {}
) {
  if (!sourceMesh?.geometry) throw new Error("Source mesh is required");

  const geometry = extractMotionGeometry(sourceMesh.geometry, range);
  const resolvedMaterial =
    material ||
    (Array.isArray(sourceMesh.material)
      ? sourceMesh.material[0]?.clone()
      : sourceMesh.material?.clone());

  if (!resolvedMaterial) {
    geometry.dispose();
    throw new Error("Motion mesh needs a material");
  }

  const mesh = new THREE.Mesh(geometry, resolvedMaterial);
  mesh.name = name;
  mesh.userData.motionKind = kind;
  mesh.userData.motionRestPose = "atlas-world";
  mesh.matrixAutoUpdate = true;
  return mesh;
}

export function disposeMotionMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  if (Array.isArray(mesh.material)) {
    for (const material of mesh.material) material?.dispose?.();
  } else {
    mesh.material?.dispose?.();
  }
}
