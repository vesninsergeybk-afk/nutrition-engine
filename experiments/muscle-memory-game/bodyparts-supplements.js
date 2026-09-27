import * as THREE from "three";

export const BODYPARTS_V3_TRUNK_REGISTRATION = Object.freeze({
  sourceVersion: "BodyParts3D 3.0",
  method:
    "Translation-only registration to BodyParts3D 4.0 using bilateral external oblique as shared references",
  translationMeters: Object.freeze([
    0.0006517015998415034,
    -0.01245280118938296,
    0.00021022610881320748,
  ]),
  fittedReferenceRmsMm: Object.freeze([
    2.5130374596213065,
    2.504056138925666,
  ]),
  independentReferenceRmsMm: Object.freeze({
    teresMajor: [5.272167351663051, 5.462379488750765],
    pectoralis: [3.5409694398051217, 3.667527872175079],
  }),
});

export const BODYPARTS_TRUNK_PACK = Object.freeze({
  manifestUrl:
    "https://raw.githubusercontent.com/japan4415/training-logger/65da3a5a9477645842df857598bd938438a8a143/public/models/human-atlas/atlas.json",
  bufferUrl:
    "https://raw.githubusercontent.com/japan4415/training-logger/65da3a5a9477645842df857598bd938438a8a143/public/models/human-atlas/muscles.bin.gz",
  ids: Object.freeze(["FMA13358", "FMA13359", "FMA13377", "FMA13378"]),
  attribution:
    "BodyParts3D 3.0 supplemental meshes registered to the BodyParts3D 4.0 frame",
});

const V3_OBJ_ROOT =
  "https://raw.githubusercontent.com/zlatnaspirala/matrix-engine-starter/0a3d121ece6b265bddf0173c3d0dd65aca22f3c8/projects/web-anatomy/res/3d-objects/human2/muscular-decimate/";

export const BODYPARTS_TRUNK_OBJ_SUPPLEMENTS = Object.freeze([
  Object.freeze({
    id: "FMA13892",
    name: "Right internal oblique",
    url: V3_OBJ_ROOT + "FJ136_BP4589_FMA13892_Right_internal_oblique.obj",
  }),
  Object.freeze({
    id: "FMA13893",
    name: "Left internal oblique",
    url: V3_OBJ_ROOT + "FJ464_BP4594_FMA13893_Left_internal_oblique.obj",
  }),
  Object.freeze({
    id: "FMA22344",
    name: "Right transversus abdominis",
    url: V3_OBJ_ROOT + "FJ160_BP4586_FMA22344_Right_transversus_abdominis.obj",
  }),
  Object.freeze({
    id: "FMA22345",
    name: "Left transversus abdominis",
    url: V3_OBJ_ROOT + "FJ357_BP4591_FMA22345_Left_transversus_abdominis.obj",
  }),
]);

function sourceIndex(value, length) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed === 0) return null;
  return parsed > 0 ? parsed - 1 : length + parsed;
}

function registeredPosition([x, y, z]) {
  const [tx, ty, tz] = BODYPARTS_V3_TRUNK_REGISTRATION.translationMeters;
  return [
    x * 0.001 + tx,
    z * 0.001 + 0.0781112 + ty,
    -y * 0.001 - 0.1 + tz,
  ];
}

function registeredNormal([x, y, z]) {
  const nx = x;
  const ny = z;
  const nz = -y;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

export function registeredBodyPartsV3ObjGeometry(text, sid, color) {
  const sourcePositions = [];
  const sourceNormals = [];

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("v ")) {
      const values = line.split(/\s+/).slice(1, 4).map(Number);
      if (values.every(Number.isFinite)) sourcePositions.push(values);
    } else if (line.startsWith("vn ")) {
      const values = line.split(/\s+/).slice(1, 4).map(Number);
      if (values.every(Number.isFinite)) sourceNormals.push(values);
    }
  }

  const positions = [];
  const normals = [];
  const indices = [];

  const appendCorner = (token) => {
    const fields = token.split("/");
    const pIndex = sourceIndex(fields[0], sourcePositions.length);
    const nIndex = sourceIndex(fields[2] || fields[1], sourceNormals.length);
    const sourcePosition = pIndex == null ? null : sourcePositions[pIndex];
    if (!sourcePosition) throw new Error("BodyParts3D 3.0 OBJ contains an invalid position index.");

    const position = registeredPosition(sourcePosition);
    const normal =
      nIndex == null || !sourceNormals[nIndex]
        ? [0, 0, 0]
        : registeredNormal(sourceNormals[nIndex]);

    const index = positions.length / 3;
    positions.push(...position);
    normals.push(...normal);
    indices.push(index);
  };

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("f ")) continue;
    const corners = line.split(/\s+/).slice(1);
    for (let i = 1; i < corners.length - 1; i += 1) {
      appendCorner(corners[0]);
      appendCorner(corners[i]);
      appendCorner(corners[i + 1]);
    }
  }

  if (!positions.length || positions.some((value) => !Number.isFinite(value))) {
    throw new Error("BodyParts3D 3.0 supplemental geometry is empty or invalid.");
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );

  const packedNormals = new Int16Array(normals.length);
  for (let i = 0; i < normals.length; i += 1) {
    packedNormals[i] = Math.round(Math.max(-1, Math.min(1, normals[i])) * 32767);
  }
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(packedNormals, 3, true)
  );
  geometry.setIndex(
    new THREE.BufferAttribute(new Uint32Array(indices), 1)
  );

  const vertexCount = positions.length / 3;
  geometry.setAttribute(
    "structureId",
    new THREE.BufferAttribute(new Float32Array(vertexCount).fill(sid), 1)
  );
  geometry.setAttribute(
    "structureVisible",
    new THREE.BufferAttribute(new Float32Array(vertexCount).fill(1), 1)
  );

  const colors = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i += 1) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingBox();

  return geometry;
}
