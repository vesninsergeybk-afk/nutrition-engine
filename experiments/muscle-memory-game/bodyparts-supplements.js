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

export const BODYPARTS_V3_FACE_REGISTRATION = Object.freeze({
  sourceVersion: "BodyParts3D 3.0",
  method:
    "Similarity registration to BodyParts3D 4.0 using mandible, frontal bone and right maxilla; left maxilla held out",
  scale: 1.059369874098004,
  rotation: Object.freeze([
    Object.freeze([0.9999999697814653, -0.00022542358070208187, 0.00009808811509434028]),
    Object.freeze([0.00022540964137606034, 0.9999999644993117, 0.00014209810025212806]),
    Object.freeze([-0.00009812014387505785, -0.000142075985950868, 0.9999999850934261]),
  ]),
  translationMm: Object.freeze([
    -0.15057996010419217,
    15.397670982185474,
    -99.29859059211003,
  ]),
  heldOutSurfaceRmsMm: 0.2583466353828061,
});

export const BODYPARTS_V3_FOOT_REGISTRATION = Object.freeze({
  method:
    "Side-specific similarity registration to BodyParts3D 4.0 fitted on talus, calcaneus and five metatarsal bounding-box centers",
  right: Object.freeze({
    scale: 1.0072436610024298,
    rotation: Object.freeze([
      Object.freeze([0.970926442856524, 0.026225215936868572, -0.23793713583852452]),
      Object.freeze([-0.02815144612239258, 0.999592617162793, -0.0047006164336051955]),
      Object.freeze([0.2377169296520422, 0.011262227253188345, 0.9712691818410087]),
    ]),
    translationMeters: Object.freeze([
      -0.008721814481116821,
      -0.06966149056100757,
      0.030219901503277555,
    ]),
    fittedBoneCenterRmsMm: 0.9102421751609061,
    fittedBoneCenterMaxMm: 1.4727015120975697,
    heldOutMuscleCenterErrorMm: Object.freeze({
      extensorHallucisBrevis: 4.517574705583107,
      abductorHallucis: 0.9344017792334579,
      flexorDigitorumBrevis: 3.06924647297659,
      extensorHallucisLongus: 1.4673723005442152,
    }),
  }),
  left: Object.freeze({
    scale: 1.0052367718567856,
    rotation: Object.freeze([
      Object.freeze([0.9707805233083933, -0.02864897403154174, 0.23825283178174914]),
      Object.freeze([0.03065125050291894, 0.9995190768999241, -0.004702739173193669]),
      Object.freeze([-0.23800352183883666, 0.011868074825507762, 0.9711917794093229]),
    ]),
    translationMeters: Object.freeze([
      0.010503166773752542,
      -0.06963950494293925,
      0.02982062592842824,
    ]),
    fittedBoneCenterRmsMm: 0.9451331032227097,
    fittedBoneCenterMaxMm: 1.5093749110934367,
    heldOutMuscleCenterErrorMm: Object.freeze({
      extensorHallucisBrevis: 4.441553506192821,
      abductorHallucis: 0.9656588798619626,
      flexorDigitorumBrevis: 3.0330546373391924,
      extensorHallucisLongus: 1.1733315499304404,
    }),
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

export const BODYPARTS_FACE_PACK = Object.freeze({
  manifestUrl:
    "https://raw.githubusercontent.com/choxos/OMFAtlas/c835665a9ade09ee0b993cee6eee1b25b7f7311b/public/models/facial/atlas.json",
  bufferUrl:
    "https://raw.githubusercontent.com/choxos/OMFAtlas/c835665a9ade09ee0b993cee6eee1b25b7f7311b/public/models/facial/facial.bin",
  sourceVersion: "BodyParts3D 3.0",
  registration:
    BODYPARTS_V3_FACE_REGISTRATION.method,
  heldOutSurfaceRmsMm: BODYPARTS_V3_FACE_REGISTRATION.heldOutSurfaceRmsMm,
  license: "CC BY-SA 2.1 Japan",
  attribution:
    "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan",
});

const V3_OBJ_ROOT =
  "https://raw.githubusercontent.com/zlatnaspirala/matrix-engine-starter/0a3d121ece6b265bddf0173c3d0dd65aca22f3c8/projects/web-anatomy/res/3d-objects/human2/muscular-decimate/";

function supplement(id, name, file) {
  return Object.freeze({ id, name, url: V3_OBJ_ROOT + file });
}

export const BODYPARTS_TRUNK_OBJ_SUPPLEMENTS = Object.freeze([
  supplement(
    "FMA13892",
    "Right internal oblique",
    "FJ136_BP4589_FMA13892_Right_internal_oblique.obj"
  ),
  supplement(
    "FMA13893",
    "Left internal oblique",
    "FJ464_BP4594_FMA13893_Left_internal_oblique.obj"
  ),
  supplement(
    "FMA22344",
    "Right transversus abdominis",
    "FJ160_BP4586_FMA22344_Right_transversus_abdominis.obj"
  ),
  supplement(
    "FMA22345",
    "Left transversus abdominis",
    "FJ357_BP4591_FMA22345_Left_transversus_abdominis.obj"
  ),
  supplement(
    "FMA22878",
    "Right multifidus",
    "FJ257_BP2313_FMA22878_Right_multifidus.obj"
  ),
  supplement(
    "FMA22879",
    "Left multifidus",
    "FJ811_BP2314_FMA22879_Left_multifidus.obj"
  ),
  supplement(
    "FMA22346",
    "Right pyramidalis",
    "FJ140_BP4588_FMA22346_Right_pyramidalis.obj"
  ),
  supplement(
    "FMA22347",
    "Left pyramidalis",
    "FJ358_BP4593_FMA22347_Left_pyramidalis.obj"
  ),
  supplement(
    "FMA22348",
    "Right quadratus lumborum",
    "FJ651_BP4580_FMA22348_Right_quadratus_lumborum.obj"
  ),
  supplement(
    "FMA22349",
    "Left quadratus lumborum",
    "FJ618_BP4582_FMA22349_Left_quadratus_lumborum.obj"
  ),
]);

export const BODYPARTS_BACK_REPLACEMENTS = Object.freeze([
  Object.freeze({
    ...supplement(
      "FMA22740",
      "Right iliocostalis lumborum",
      "FJ200_BP2353_FMA22740_Right_iliocostalis_lumborum.obj"
    ),
    replacement: true,
    reason:
      "Use the BodyParts3D 3.0 geometry with the restored 3.0 latissimus; the canonical 4.0 iliocostalis is locally displaced and penetrates the superficial layer.",
  }),
  Object.freeze({
    ...supplement(
      "FMA22741",
      "Left iliocostalis lumborum",
      "FJ70_BP2354_FMA22741_Left_iliocostalis_lumborum.obj"
    ),
    replacement: true,
    reason:
      "Use the BodyParts3D 3.0 geometry with the restored 3.0 latissimus; the canonical 4.0 iliocostalis is locally displaced and penetrates the superficial layer.",
  }),
]);

export const BODYPARTS_MUSCLE_REPLACEMENT_IDS = Object.freeze(
  BODYPARTS_BACK_REPLACEMENTS.map((item) => item.id)
);

export const BODYPARTS_FACE_OBJ_SUPPLEMENTS = Object.freeze([
  supplement(
    "FMA55608",
    "Right depressor septi nasi",
    "FJ609_BP2572_FMA55608_Right_depressor_septi_nasi.obj"
  ),
  supplement(
    "FMA55609",
    "Left depressor septi nasi",
    "FJ215_BP2573_FMA55609_Left_depressor_septi_nasi.obj"
  ),
]);

export const BODYPARTS_FOOT_OBJ_SUPPLEMENTS = Object.freeze([
  Object.freeze({
    ...supplement(
      "FMA51142",
      "Right extensor digitorum brevis",
      "FJ934_BP2759_FMA51142_Right_extensor_digitorum_brevis.obj"
    ),
    side: "right",
  }),
  Object.freeze({
    ...supplement(
      "FMA51143",
      "Left extensor digitorum brevis",
      "FJ935_BP2760_FMA51143_Left_extensor_digitorum_brevis.obj"
    ),
    side: "left",
  }),
]);

function sourceIndex(value, length) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed === 0) return null;
  return parsed > 0 ? parsed - 1 : length + parsed;
}

function bodyPartsFrame([x, y, z]) {
  return [x * 0.001, z * 0.001 + 0.0781112, -y * 0.001 - 0.1];
}

function trunkPosition(source) {
  const [x, y, z] = bodyPartsFrame(source);
  const [tx, ty, tz] = BODYPARTS_V3_TRUNK_REGISTRATION.translationMeters;
  return [x + tx, y + ty, z + tz];
}

function axisConvertedNormal([x, y, z]) {
  const nx = x;
  const ny = z;
  const nz = -y;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

function faceRawPosition([x, y, z]) {
  const { scale, rotation, translationMm } = BODYPARTS_V3_FACE_REGISTRATION;
  const sx =
    scale *
      (rotation[0][0] * x + rotation[0][1] * y + rotation[0][2] * z) +
    translationMm[0];
  const sy =
    scale *
      (rotation[1][0] * x + rotation[1][1] * y + rotation[1][2] * z) +
    translationMm[1];
  const sz =
    scale *
      (rotation[2][0] * x + rotation[2][1] * y + rotation[2][2] * z) +
    translationMm[2];
  return [sx, sy, sz];
}

function facePosition(source) {
  return bodyPartsFrame(faceRawPosition(source));
}

function faceNormal([x, y, z]) {
  const { rotation } = BODYPARTS_V3_FACE_REGISTRATION;
  const rx = rotation[0][0] * x + rotation[0][1] * y + rotation[0][2] * z;
  const ry = rotation[1][0] * x + rotation[1][1] * y + rotation[1][2] * z;
  const rz = rotation[2][0] * x + rotation[2][1] * y + rotation[2][2] * z;
  return axisConvertedNormal([rx, ry, rz]);
}

function buildObjGeometry(
  text,
  sid,
  color,
  transformPosition,
  transformNormal
) {
  const sourcePositions = [];
  const sourceNormals = [];
  const lines = String(text || "").split(/\r?\n/);

  for (const rawLine of lines) {
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
    if (!sourcePosition) {
      throw new Error("BodyParts3D 3.0 OBJ contains an invalid position index.");
    }

    const position = transformPosition(sourcePosition);
    const normal =
      nIndex == null || !sourceNormals[nIndex]
        ? [0, 0, 0]
        : transformNormal(sourceNormals[nIndex]);

    const index = positions.length / 3;
    positions.push(...position);
    normals.push(...normal);
    indices.push(index);
  };

  for (const rawLine of lines) {
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
    packedNormals[i] = Math.round(
      Math.max(-1, Math.min(1, normals[i])) * 32767
    );
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

export function registeredBodyPartsV3ObjGeometry(text, sid, color) {
  return buildObjGeometry(
    text,
    sid,
    color,
    trunkPosition,
    axisConvertedNormal
  );
}

function footPosition(source, side) {
  const p = bodyPartsFrame(source);
  const registration = BODYPARTS_V3_FOOT_REGISTRATION[side];
  if (!registration) throw new Error("Unknown BodyParts3D foot side.");

  const r = registration.rotation;
  const scale = registration.scale;
  const t = registration.translationMeters;
  return [
    scale * (r[0][0] * p[0] + r[0][1] * p[1] + r[0][2] * p[2]) + t[0],
    scale * (r[1][0] * p[0] + r[1][1] * p[1] + r[1][2] * p[2]) + t[1],
    scale * (r[2][0] * p[0] + r[2][1] * p[1] + r[2][2] * p[2]) + t[2],
  ];
}

function footNormal(source, side) {
  const p = axisConvertedNormal(source);
  const registration = BODYPARTS_V3_FOOT_REGISTRATION[side];
  const r = registration.rotation;
  const n = [
    r[0][0] * p[0] + r[0][1] * p[1] + r[0][2] * p[2],
    r[1][0] * p[0] + r[1][1] * p[1] + r[1][2] * p[2],
    r[2][0] * p[0] + r[2][1] * p[1] + r[2][2] * p[2],
  ];
  const length = Math.hypot(...n) || 1;
  return n.map((value) => value / length);
}

export function registeredBodyPartsV3FaceObjGeometry(text, sid, color) {
  return buildObjGeometry(text, sid, color, facePosition, faceNormal);
}

export function registeredBodyPartsV3FootObjGeometry(text, sid, color, side) {
  return buildObjGeometry(
    text,
    sid,
    color,
    (source) => footPosition(source, side),
    (source) => footNormal(source, side)
  );
}
