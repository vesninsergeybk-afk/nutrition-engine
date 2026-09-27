import * as THREE from "three";

const topologyCache = new WeakMap();

function triangleSpansForGeometry(geometry) {
  if (!geometry) return new Map();
  const cached = topologyCache.get(geometry);
  if (cached) return cached;

  const structureId = geometry.getAttribute("structureId");
  const map = new Map();
  if (!structureId) {
    topologyCache.set(geometry, map);
    return map;
  }

  const indexed = Boolean(geometry.index);
  const triangleVertexCount = indexed
    ? geometry.index.count
    : geometry.getAttribute("position")?.count || 0;

  let activeSid = null;
  let activeStart = 0;

  const closeSpan = (end) => {
    if (activeSid == null || end <= activeStart) return;
    if (!map.has(activeSid)) map.set(activeSid, []);
    map.get(activeSid).push([activeStart, end]);
  };

  for (let i = 0; i + 2 < triangleVertexCount; i += 3) {
    const vertexIndex = indexed ? geometry.index.getX(i) : i;
    const sid = Math.round(structureId.getX(vertexIndex));

    if (activeSid == null) {
      activeSid = sid;
      activeStart = i;
      continue;
    }

    if (sid !== activeSid) {
      closeSpan(i);
      activeSid = sid;
      activeStart = i;
    }
  }

  closeSpan(triangleVertexCount);
  topologyCache.set(geometry, map);
  return map;
}

function extractStructureGeometry(mesh, structureIds) {
  if (!mesh?.geometry || !structureIds?.length) return null;

  const source = mesh.geometry;
  const position = source.getAttribute("position");
  const normal = source.getAttribute("normal");
  const topology = triangleSpansForGeometry(source);
  if (!position || !topology.size) return null;

  const spans = [];
  let outputVertexCount = 0;

  for (const sid of structureIds) {
    for (const span of topology.get(sid) || []) {
      spans.push(span);
      outputVertexCount += span[1] - span[0];
    }
  }

  if (!outputVertexCount) return null;

  const positions = new Float32Array(outputVertexCount * 3);
  const normals = normal ? new Float32Array(outputVertexCount * 3) : null;
  const indexed = Boolean(source.index);
  let outputIndex = 0;

  for (const [start, end] of spans) {
    for (let i = start; i < end; i += 1) {
      const sourceIndex = indexed ? source.index.getX(i) : i;

      positions[outputIndex * 3] = position.getX(sourceIndex);
      positions[outputIndex * 3 + 1] = position.getY(sourceIndex);
      positions[outputIndex * 3 + 2] = position.getZ(sourceIndex);

      if (normals) {
        normals[outputIndex * 3] = normal.getX(sourceIndex);
        normals[outputIndex * 3 + 1] = normal.getY(sourceIndex);
        normals[outputIndex * 3 + 2] = normal.getZ(sourceIndex);
      }
      outputIndex += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (normals) {
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  } else {
    geometry.computeVertexNormals();
  }

  mesh.updateMatrixWorld(true);
  geometry.applyMatrix4(mesh.matrixWorld);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function fitPreviewCamera(camera, box, direction, aspect, padding = 1.34) {
  if (!box || box.isEmpty()) return false;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.01);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const fitHeight = size.y / (2 * Math.tan(verticalFov / 2));
  const fitWidth = size.x / (2 * Math.tan(verticalFov / 2) * Math.max(aspect, 0.2));
  const distance = Math.max(fitHeight, fitWidth, size.z * 1.2, maxDimension * 0.7) * padding;

  const view = direction?.clone?.() || new THREE.Vector3(0.28, 0.05, 1);
  if (view.lengthSq() < 1e-8) view.set(0.28, 0.05, 1);
  view.normalize();

  camera.position.copy(center).addScaledVector(view, distance);
  camera.near = Math.max(distance / 250, 0.001);
  camera.far = Math.max(distance * 12, 10);
  camera.aspect = aspect;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  return true;
}

function paintPixelsToCanvas(canvas, pixels, width, height) {
  const context = canvas?.getContext?.("2d", { alpha: false });
  if (!context) return false;

  canvas.width = width;
  canvas.height = height;

  const imageData = context.createImageData(width, height);
  const target = imageData.data;
  const rowBytes = width * 4;

  for (let y = 0; y < height; y += 1) {
    const sourceOffset = (height - 1 - y) * rowBytes;
    const targetOffset = y * rowBytes;
    target.set(
      pixels.subarray(sourceOffset, sourceOffset + rowBytes),
      targetOffset
    );
  }

  context.putImageData(imageData, 0, 0);
  return true;
}

export function renderMuscleReferencePreview({
  outputCanvas,
  renderer,
  anatomyMesh,
  skeletonMesh = null,
  muscleIds = [],
  boneIds = [],
  viewDirection = null,
  width = 640,
  height = 440,
}) {
  if (!outputCanvas || !renderer || !anatomyMesh || !muscleIds.length) {
    return { rendered: false, reason: "missing-input" };
  }

  const muscleGeometry = extractStructureGeometry(anatomyMesh, muscleIds);
  if (!muscleGeometry) {
    return { rendered: false, reason: "muscle-geometry-unavailable" };
  }

  const boneGeometry =
    skeletonMesh && boneIds.length
      ? extractStructureGeometry(skeletonMesh, boneIds)
      : null;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f2ed);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b867d, 1.65));

  const key = new THREE.DirectionalLight(0xffffff, 2.25);
  key.position.set(3.8, 5.2, 4.6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.72);
  fill.position.set(-4.2, 1.6, -2.8);
  scene.add(fill);

  const muscleMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6655c,
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const muscle = new THREE.Mesh(muscleGeometry, muscleMaterial);
  muscle.renderOrder = 1;
  scene.add(muscle);

  let boneMaterial = null;
  let bones = null;
  if (boneGeometry) {
    boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d2c7,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    bones = new THREE.Mesh(boneGeometry, boneMaterial);
    bones.renderOrder = 2;
    scene.add(bones);
  }

  const muscleBox = muscleGeometry.boundingBox?.clone() || new THREE.Box3().setFromObject(muscle);
  const contextBox = muscleBox.clone();
  if (boneGeometry?.boundingBox) {
    const boneBox = boneGeometry.boundingBox.clone();
    const muscleSize = muscleBox.getSize(new THREE.Vector3());
    const center = muscleBox.getCenter(new THREE.Vector3());
    const limit = new THREE.Box3(
      center.clone().sub(muscleSize.clone().multiplyScalar(1.15)),
      center.clone().add(muscleSize.clone().multiplyScalar(1.15))
    );
    if (limit.intersectsBox(boneBox)) {
      contextBox.union(boneBox.intersect(limit));
    }
  }

  const camera = new THREE.PerspectiveCamera(32, width / height, 0.001, 10000);
  const fitted = fitPreviewCamera(
    camera,
    contextBox,
    viewDirection,
    width / height
  );

  if (!fitted) {
    muscleGeometry.dispose();
    boneGeometry?.dispose();
    muscleMaterial.dispose();
    boneMaterial?.dispose();
    return { rendered: false, reason: "empty-bounds" };
  }

  const target = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
  });
  target.texture.colorSpace = THREE.SRGBColorSpace;

  const previousTarget = renderer.getRenderTarget();
  const previousAutoClear = renderer.autoClear;

  try {
    renderer.autoClear = true;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);

    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);

    const painted = paintPixelsToCanvas(
      outputCanvas,
      pixels,
      width,
      height
    );

    return {
      rendered: painted,
      reason: painted ? null : "canvas-2d-unavailable",
      boneCount: boneIds.length,
      muscleTriangleCount: Math.floor(
        muscleGeometry.getAttribute("position").count / 3
      ),
    };
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.autoClear = previousAutoClear;
    target.dispose();
    muscleGeometry.dispose();
    boneGeometry?.dispose();
    muscleMaterial.dispose();
    boneMaterial?.dispose();
  }
}

export function clearMuscleReferencePreview(outputCanvas) {
  const context = outputCanvas?.getContext?.("2d");
  if (!context) return;
  context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
}
