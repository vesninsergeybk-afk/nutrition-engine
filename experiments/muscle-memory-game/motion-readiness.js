function unit(
  id,
  nameRu,
  sourcePatterns,
  myoActuators = [],
  requiredSources = ["z-anatomy", "bodyparts4"]
) {
  return Object.freeze({
    id,
    nameRu,
    sourcePatterns: Object.freeze([...sourcePatterns]),
    myoActuators: Object.freeze([...myoActuators]),
    requiredSources: Object.freeze([...requiredSources]),
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
  "flexor-carpi-radialis": unit(
    "flexor-carpi-radialis",
    "Лучевой сгибатель запястья",
    [/flexor carpi radialis/i],
    ["FCR"]
  ),
  "flexor-carpi-ulnaris": unit(
    "flexor-carpi-ulnaris",
    "Локтевой сгибатель запястья",
    [/flexor carpi ulnaris/i],
    ["FCU"]
  ),
  "extensor-carpi-radialis-longus": unit(
    "extensor-carpi-radialis-longus",
    "Длинный лучевой разгибатель запястья",
    [/extensor carpi radialis longus/i],
    ["ECRL"]
  ),
  "extensor-carpi-radialis-brevis": unit(
    "extensor-carpi-radialis-brevis",
    "Короткий лучевой разгибатель запястья",
    [/extensor carpi radialis brevis/i],
    ["ECRB"]
  ),
  "extensor-carpi-ulnaris": unit(
    "extensor-carpi-ulnaris",
    "Локтевой разгибатель запястья",
    [/extensor carpi ulnaris/i],
    ["ECU"]
  ),
  "palmaris-longus": unit(
    "palmaris-longus",
    "Длинная ладонная мышца",
    [/palmaris longus/i],
    ["PL"]
  ),
  "pectoralis-major": unit(
    "pectoralis-major",
    "Большая грудная мышца",
    [/pectoralis major/i],
    ["PECM1", "PECM2", "PECM3"]
  ),
  "latissimus-dorsi": unit(
    "latissimus-dorsi",
    "Широчайшая мышца спины",
    [/latissimus dorsi/i],
    ["LAT1", "LAT2", "LAT3"],
    ["z-anatomy"]
  ),
  trapezius: unit(
    "trapezius",
    "Трапециевидная мышца",
    [/trapezius/i]
  ),
  "serratus-anterior": unit(
    "serratus-anterior",
    "Передняя зубчатая мышца",
    [/serratus anterior/i]
  ),
  "rhomboid-major": unit(
    "rhomboid-major",
    "Большая ромбовидная мышца",
    [/rhomboid major/i]
  ),
  "rhomboid-minor": unit(
    "rhomboid-minor",
    "Малая ромбовидная мышца",
    [/rhomboid minor/i]
  ),
  "levator-scapulae": unit(
    "levator-scapulae",
    "Мышца, поднимающая лопатку",
    [/levator scapulae/i]
  ),
  "pectoralis-minor": unit(
    "pectoralis-minor",
    "Малая грудная мышца",
    [/pectoralis minor/i]
  ),
  subclavius: unit(
    "subclavius",
    "Подключичная мышца",
    [/\bsubclavius\b/i]
  ),
  coracobrachialis: unit(
    "coracobrachialis",
    "Клювовидно-плечевая мышца",
    [/\bcoracobrachialis\b/i],
    ["CORB"]
  ),
  "teres-major": unit(
    "teres-major",
    "Большая круглая мышца",
    [/(?:right |left )?teres major/i],
    ["TMAJ"]
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
  hand: bone(
    "hand",
    "Кости кисти",
    [
      /carpal|metacarp/i,
      /\b(?:scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate)\b/i,
      /phalanx.*(?:thumb|finger|hand)|(?:thumb|finger|hand).*phalanx/i,
    ]
  ),
});

export const MOTION_PILOTS = Object.freeze({
  elbow: Object.freeze({
    id: "elbow",
    nameRu: "Локоть",
    sourceId: "myosim-arm",
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
  wrist: Object.freeze({
    id: "wrist",
    nameRu: "Запястье",
    sourceId: "myosim-arm",
    specimenId: "forearm-hand-anterior",
    simulatedSide: "right",
    mirrorLeft: true,
    bodies: Object.freeze(["radius", "ulna", "hand"]),
    muscleUnits: Object.freeze([
      "flexor-carpi-radialis",
      "flexor-carpi-ulnaris",
      "extensor-carpi-radialis-longus",
      "extensor-carpi-radialis-brevis",
      "extensor-carpi-ulnaris",
      "palmaris-longus",
    ]),
    degreesOfFreedom: Object.freeze([
      Object.freeze({
        id: "wrist-flexion-extension",
        nameRu: "Сгибание/разгибание запястья",
        simulationAuthority: "mujoco",
      }),
      Object.freeze({
        id: "wrist-deviation",
        nameRu: "Лучевое/локтевое отклонение",
        simulationAuthority: "mujoco",
      }),
    ]),
  }),
  shoulder: Object.freeze({
    id: "shoulder",
    nameRu: "Плечевой комплекс",
    sourceId: "thoracoscapular-shoulder",
    requiresMyoActuators: false,
    specimenId: "shoulder",
    simulatedSide: "right",
    mirrorLeft: true,
    bodies: Object.freeze(["scapula", "clavicle", "humerus"]),
    muscleUnits: Object.freeze([
      "deltoid-clavicular",
      "deltoid-acromial",
      "deltoid-spinal",
      "biceps-long",
      "biceps-short",
      "triceps-long",
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres-minor",
      "pectoralis-major",
      "latissimus-dorsi",
      "coracobrachialis",
      "teres-major",
    ]),
    visualContextUnits: Object.freeze([
      "trapezius",
      "serratus-anterior",
      "rhomboid-major",
      "rhomboid-minor",
      "levator-scapulae",
      "pectoralis-minor",
      "subclavius",
    ]),
    degreesOfFreedom: Object.freeze([
      Object.freeze({
        id: "glenohumeral",
        nameRu: "Плечевой сустав",
        simulationAuthority: "opensim-motion-clip",
      }),
      Object.freeze({
        id: "scapular-complex",
        nameRu: "Лопаточно-ключичный комплекс",
        simulationAuthority: "opensim-motion-clip",
      }),
    ]),
  }),
  scapula: Object.freeze({
    id: "scapula",
    nameRu: "Лопаточно-ключичный комплекс",
    sourceId: "thoracoscapular-shoulder",
    specimenId: "scapular-stabilizers",
    simulatedSide: "right",
    mirrorLeft: true,
    requiresMyoActuators: false,
    bodies: Object.freeze(["scapula", "clavicle", "humerus"]),
    muscleUnits: Object.freeze([
      "trapezius",
      "serratus-anterior",
      "rhomboid-major",
      "rhomboid-minor",
      "levator-scapulae",
      "pectoralis-minor",
    ]),
    visualContextUnits: Object.freeze([
      "deltoid-acromial",
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres-minor",
      "subclavius",
    ]),
    degreesOfFreedom: Object.freeze([
      Object.freeze({
        id: "scapular-translation",
        nameRu: "Протракция/ретракция и подъём/опускание",
        simulationAuthority: "opensim-motion-clip",
      }),
      Object.freeze({
        id: "scapular-rotation",
        nameRu: "Верхняя/нижняя ротация",
        simulationAuthority: "opensim-motion-clip",
      }),
    ]),
  })
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
