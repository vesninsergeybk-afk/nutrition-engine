function unit(id, nameRu, sourcePatterns, myoActuators = []) {
  return Object.freeze({
    id,
    nameRu,
    sourcePatterns: Object.freeze([...sourcePatterns]),
    myoActuators: Object.freeze([...myoActuators]),
  });
}

function bone(id, nameRu, sourcePatterns) {
  return Object.freeze({
    id,
    nameRu,
    sourcePatterns: Object.freeze([...sourcePatterns]),
  });
}

export const MOTION_VISUAL_UNITS = Object.freeze({
  "biceps-long": unit(
    "biceps-long",
    "Длинная головка двуглавой мышцы плеча",
    [/long head of .*biceps brachii/i],
    ["BIClong"]
  ),
  "biceps-short": unit(
    "biceps-short",
    "Короткая головка двуглавой мышцы плеча",
    [/short head of .*biceps brachii/i],
    ["BICshort"]
  ),
  brachialis: unit(
    "brachialis",
    "Плечевая мышца",
    [/\bbrachialis\b/i],
    ["BRA"]
  ),
  brachioradialis: unit(
    "brachioradialis",
    "Плечелучевая мышца",
    [/brachioradialis/i],
    ["BRD"]
  ),
  "triceps-long": unit(
    "triceps-long",
    "Длинная головка трёхглавой мышцы плеча",
    [/long head of .*triceps brachii/i],
    ["TRIlong"]
  ),
  "triceps-lateral": unit(
    "triceps-lateral",
    "Латеральная головка трёхглавой мышцы плеча",
    [/lateral head of .*triceps brachii/i],
    ["TRIlat"]
  ),
  "triceps-medial": unit(
    "triceps-medial",
    "Медиальная головка трёхглавой мышцы плеча",
    [/medial head of .*triceps brachii/i],
    ["TRImed"]
  ),
  anconeus: unit(
    "anconeus",
    "Локтевая мышца",
    [/\banconeus\b/i],
    ["ANC"]
  ),
  "pronator-teres": unit(
    "pronator-teres",
    "Круглый пронатор",
    [/pronator teres/i],
    ["PT"]
  ),
  "pronator-quadratus": unit(
    "pronator-quadratus",
    "Квадратный пронатор",
    [/pronator quadratus/i],
    ["PQ"]
  ),
  supinator: unit(
    "supinator",
    "Супинатор",
    [/\bsupinator\b/i],
    ["SUP"]
  ),
  "deltoid-clavicular": unit(
    "deltoid-clavicular",
    "Ключичная часть дельтовидной мышцы",
    [/clavicular part of .*deltoid/i],
    ["DELT1"]
  ),
  "deltoid-acromial": unit(
    "deltoid-acromial",
    "Акромиальная часть дельтовидной мышцы",
    [/acromial part of .*deltoid/i],
    ["DELT2"]
  ),
  "deltoid-spinal": unit(
    "deltoid-spinal",
    "Остистая часть дельтовидной мышцы",
    [/spinal part of .*deltoid/i],
    ["DELT3"]
  ),
  supraspinatus: unit(
    "supraspinatus",
    "Надостная мышца",
    [/(?:right |left )?supraspinatus/i],
    ["SUPSP"]
  ),
  infraspinatus: unit(
    "infraspinatus",
    "Подостная мышца",
    [/(?:right |left )?infraspinatus(?: muscle)?/i],
    ["INFSP"]
  ),
  subscapularis: unit(
    "subscapularis",
    "Подлопаточная мышца",
    [/(?:right |left )?subscapularis/i],
    ["SUBSC"]
  ),
  "teres-minor": unit(
    "teres-minor",
    "Малая круглая мышца",
    [/(?:right |left )?teres minor/i],
    ["TMIN"]
  ),
});

export const MOTION_BONE_UNITS = Object.freeze({
  scapula: bone("scapula", "Лопатка", [/scapula/i]),
  clavicle: bone("clavicle", "Ключица", [/clavicle/i]),
  humerus: bone("humerus", "Плечевая кость", [/humerus/i]),
  radius: bone("radius", "Лучевая кость", [/radius/i]),
  ulna: bone("ulna", "Локтевая кость", [/ulna/i]),
});

export const MOTION_PILOTS = Object.freeze({
  elbow: Object.freeze({
    id: "elbow",
    nameRu: "Локоть",
    specimenId: "arm",
    simulatedSide: "right",
    mirrorLeft: true,
    bodies: Object.freeze(["humerus", "radius", "ulna"]),
    muscleUnits: Object.freeze([
      "biceps-long",
      "biceps-short",
      "brachialis",
      "brachioradialis",
      "triceps-long",
      "triceps-lateral",
      "triceps-medial",
      "anconeus",
      "pronator-teres",
      "pronator-quadratus",
      "supinator",
    ]),
    degreesOfFreedom: Object.freeze([
      Object.freeze({
        id: "elbow-flexion",
        nameRu: "Сгибание/разгибание локтя",
        simulationAuthority: "mujoco",
      }),
      Object.freeze({
        id: "forearm-rotation",
        nameRu: "Пронация/супинация предплечья",
        simulationAuthority: "mujoco",
      }),
    ]),
  }),
  shoulder: Object.freeze({
    id: "shoulder",
    nameRu: "Плечевой комплекс",
    specimenId: "shoulder",
    simulatedSide: "right",
    mirrorLeft: true,
    bodies: Object.freeze(["scapula", "clavicle", "humerus"]),
    muscleUnits: Object.freeze([
      "deltoid-clavicular",
      "deltoid-acromial",
      "deltoid-spinal",
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres-minor",
    ]),
    degreesOfFreedom: Object.freeze([
      Object.freeze({
        id: "glenohumeral",
        nameRu: "Плечевой сустав",
        simulationAuthority: "mujoco",
      }),
      Object.freeze({
        id: "scapular-complex",
        nameRu: "Лопаточно-ключичный комплекс",
        simulationAuthority: "mujoco",
      }),
    ]),
  }),
});

function matchesAny(name, patterns) {
  return patterns.some((pattern) => pattern.test(String(name || "")));
}

export function motionVisualUnit(id) {
  return MOTION_VISUAL_UNITS[id] || null;
}

export function motionBoneUnit(id) {
  return MOTION_BONE_UNITS[id] || null;
}

export function motionPilot(id) {
  return MOTION_PILOTS[id] || null;
}

export function matchMotionMuscleUnit(sourceName) {
  return Object.values(MOTION_VISUAL_UNITS).find((item) =>
    matchesAny(sourceName, item.sourcePatterns)
  ) || null;
}

export function matchMotionBoneUnit(sourceName) {
  return Object.values(MOTION_BONE_UNITS).find((item) =>
    matchesAny(sourceName, item.sourcePatterns)
  ) || null;
}

export function sourceNamesForMotionUnit(names, unitId) {
  const item = motionVisualUnit(unitId);
  if (!item) return [];
  return (names || []).filter((name) => matchesAny(name, item.sourcePatterns));
}

export function sourceNamesForMotionBone(names, unitId) {
  const item = motionBoneUnit(unitId);
  if (!item) return [];
  return (names || []).filter((name) => matchesAny(name, item.sourcePatterns));
}
