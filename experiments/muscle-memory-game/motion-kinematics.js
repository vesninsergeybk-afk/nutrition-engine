const FLEXOR_UNITS = new Set([
  "biceps-long",
  "biceps-short",
  "brachialis",
  "brachioradialis",
]);

const EXTENSOR_UNITS = new Set([
  "triceps-long",
  "triceps-lateral",
  "triceps-medial",
  "anconeus",
]);

function frozenAction(config) {
  return Object.freeze({
    authority: "kinematic-preview",
    minDeg: 0,
    startDeg: 0,
    playDirection: 1,
    speedDegPerSecond: 55,
    referenceMaxDeg: config.maxDeg,
    synergists: Object.freeze([...(config.synergists || [])]),
    ...config,
  });
}

export const ELBOW_KINEMATIC_LIMITS = Object.freeze({
  minDeg: 0,
  maxDeg: 146,
  speedDegPerSecond: 55,
});

export const FOREARM_ROTATION_LIMITS = Object.freeze({
  pronationMaxDeg: 80,
  supinationMaxDeg: 87,
  speedDegPerSecond: 50,
});

export const SHOULDER_PREVIEW_LIMITS = Object.freeze({
  flexion: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 160 }),
  abduction: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 150 }),
  extension: Object.freeze({ previewMaxDeg: 45, referenceMaxDeg: 45 }),
  externalRotation: Object.freeze({ previewMaxDeg: 60, referenceMaxDeg: 60 }),
  internalRotation: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 90 }),
});

const MOTION_ACTIONS = Object.freeze({
  "elbow-flexion": frozenAction({
    pilotId: "elbow",
    movementId: "elbow-flexion",
    direction: "flexion",
    nameRu: "Сгибание в локте",
    controlLabelRu: "Сгибание локтя",
    descriptionRu:
      "Сгибание предплечья. Движение костей и деформация мышц показаны как учебный кинематический preview.",
    maxDeg: ELBOW_KINEMATIC_LIMITS.maxDeg,
    speedDegPerSecond: ELBOW_KINEMATIC_LIMITS.speedDegPerSecond,
    synergists: [...FLEXOR_UNITS],
  }),
  "elbow-extension": frozenAction({
    pilotId: "elbow",
    movementId: "elbow-extension",
    direction: "extension",
    nameRu: "Разгибание в локте",
    controlLabelRu: "Сгибание локтя",
    descriptionRu:
      "Разгибание предплечья из согнутого положения. Это кинематический preview, а не расчёт мышечной силы.",
    maxDeg: ELBOW_KINEMATIC_LIMITS.maxDeg,
    startDeg: ELBOW_KINEMATIC_LIMITS.maxDeg,
    playDirection: -1,
    speedDegPerSecond: ELBOW_KINEMATIC_LIMITS.speedDegPerSecond,
    synergists: [...EXTENSOR_UNITS],
  }),
  "forearm-supination": frozenAction({
    pilotId: "elbow",
    movementId: "forearm-supination",
    direction: "supination",
    nameRu: "Супинация предплечья",
    controlLabelRu: "Супинация",
    descriptionRu:
      "Поворот лучевой кости вокруг продольной оси предплечья из нейтрального положения.",
    maxDeg: FOREARM_ROTATION_LIMITS.supinationMaxDeg,
    speedDegPerSecond: FOREARM_ROTATION_LIMITS.speedDegPerSecond,
    synergists: ["supinator", "biceps-long", "biceps-short"],
  }),
  "forearm-pronation": frozenAction({
    pilotId: "elbow",
    movementId: "forearm-pronation",
    direction: "pronation",
    nameRu: "Пронация предплечья",
    controlLabelRu: "Пронация",
    descriptionRu:
      "Поворот лучевой кости относительно локтевой из нейтрального положения.",
    maxDeg: FOREARM_ROTATION_LIMITS.pronationMaxDeg,
    speedDegPerSecond: FOREARM_ROTATION_LIMITS.speedDegPerSecond,
    synergists: ["pronator-teres", "pronator-quadratus"],
  }),
  "shoulder-flexion": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-flexion",
    direction: "flexion",
    nameRu: "Сгибание плеча",
    controlLabelRu: "Сгибание плеча",
    descriptionRu:
      "Гленогумеральный компонент сгибания. Выше 90° движение лопатки и ключицы пока не моделируется без проверенной регистрации.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.flexion.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.flexion.referenceMaxDeg,
    synergists: ["deltoid-clavicular", "coracobrachialis", "pectoralis-major"],
  }),
  "shoulder-abduction": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-abduction",
    direction: "abduction",
    nameRu: "Отведение плеча",
    controlLabelRu: "Отведение плеча",
    descriptionRu:
      "Гленогумеральный компонент отведения. Надостная особенно важна в начале движения, далее возрастает вклад дельтовидной.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.abduction.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.abduction.referenceMaxDeg,
    synergists: ["supraspinatus", "deltoid-acromial"],
  }),
  "shoulder-extension": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-extension",
    direction: "extension",
    nameRu: "Разгибание плеча",
    controlLabelRu: "Разгибание плеча",
    descriptionRu:
      "Разгибание плечевой кости кзади в учебном кинематическом preview.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.extension.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.extension.referenceMaxDeg,
    speedDegPerSecond: 35,
    synergists: ["deltoid-spinal", "teres-major"],
  }),
  "shoulder-external-rotation": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-external-rotation",
    direction: "external-rotation",
    nameRu: "Наружная ротация плеча",
    controlLabelRu: "Наружная ротация",
    descriptionRu:
      "Наружная ротация плечевой кости при приведённой руке.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.externalRotation.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.externalRotation.referenceMaxDeg,
    speedDegPerSecond: 40,
    synergists: ["infraspinatus", "teres-minor", "deltoid-spinal"],
  }),
  "shoulder-internal-rotation": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-internal-rotation",
    direction: "internal-rotation",
    nameRu: "Внутренняя ротация плеча",
    controlLabelRu: "Внутренняя ротация",
    descriptionRu:
      "Внутренняя ротация плечевой кости при приведённой руке.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.internalRotation.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.internalRotation.referenceMaxDeg,
    speedDegPerSecond: 40,
    synergists: [
      "subscapularis",
      "deltoid-clavicular",
      "pectoralis-major",
      "teres-major",
    ],
  }),
});

const UNIT_ACTION_IDS = Object.freeze({
  "biceps-long": Object.freeze(["elbow-flexion", "forearm-supination"]),
  "biceps-short": Object.freeze(["elbow-flexion", "forearm-supination"]),
  brachialis: Object.freeze(["elbow-flexion"]),
  brachioradialis: Object.freeze(["elbow-flexion"]),
  "triceps-long": Object.freeze(["elbow-extension"]),
  "triceps-lateral": Object.freeze(["elbow-extension"]),
  "triceps-medial": Object.freeze(["elbow-extension"]),
  anconeus: Object.freeze(["elbow-extension"]),
  "pronator-teres": Object.freeze(["forearm-pronation"]),
  "pronator-quadratus": Object.freeze(["forearm-pronation"]),
  supinator: Object.freeze(["forearm-supination"]),
  "deltoid-clavicular": Object.freeze([
    "shoulder-flexion",
    "shoulder-internal-rotation",
  ]),
  "deltoid-acromial": Object.freeze(["shoulder-abduction"]),
  "deltoid-spinal": Object.freeze([
    "shoulder-extension",
    "shoulder-external-rotation",
  ]),
  supraspinatus: Object.freeze(["shoulder-abduction"]),
  infraspinatus: Object.freeze(["shoulder-external-rotation"]),
  subscapularis: Object.freeze(["shoulder-internal-rotation"]),
  "teres-minor": Object.freeze(["shoulder-external-rotation"]),
  "pectoralis-major": Object.freeze([
    "shoulder-flexion",
    "shoulder-internal-rotation",
  ]),
  coracobrachialis: Object.freeze(["shoulder-flexion"]),
  "teres-major": Object.freeze([
    "shoulder-extension",
    "shoulder-internal-rotation",
  ]),
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function motionActionById(id) {
  return MOTION_ACTIONS[id] || null;
}

export function motionActionsForUnits(unitIds = []) {
  const ids = [];
  for (const unitId of unitIds || []) {
    for (const actionId of UNIT_ACTION_IDS[unitId] || []) {
      if (!ids.includes(actionId)) ids.push(actionId);
    }
  }
  return ids.map((id) => MOTION_ACTIONS[id]).filter(Boolean);
}

export function elbowMotionAction(unitIds = []) {
  const units = new Set(unitIds || []);
  const flexor = [...units].some((id) => FLEXOR_UNITS.has(id));
  const extensor = [...units].some((id) => EXTENSOR_UNITS.has(id));
  if (!flexor && !extensor) return null;
  if (flexor && extensor) return null;
  return flexor ? MOTION_ACTIONS["elbow-flexion"] : MOTION_ACTIONS["elbow-extension"];
}

export function clampMotionValue(action, angleDeg) {
  if (!action) return 0;
  return clamp(angleDeg, action.minDeg, action.maxDeg);
}

export function motionActionActivation(action, angleDeg) {
  if (!action) return 0;
  const value = clampMotionValue(action, angleDeg);
  const span = Math.max(1e-6, action.maxDeg - action.minDeg);
  const progress = (value - action.minDeg) / span;
  return action.direction === "extension" ? 1 - progress : progress;
}

export function clampElbowAngle(angleDeg) {
  return clamp(angleDeg, ELBOW_KINEMATIC_LIMITS.minDeg, ELBOW_KINEMATIC_LIMITS.maxDeg);
}

export function elbowFlexionRadians(angleDeg) {
  return (-clampElbowAngle(angleDeg) * Math.PI) / 180;
}

export function elbowActivation(angleDeg, direction = "flexion") {
  const action =
    direction === "extension"
      ? MOTION_ACTIONS["elbow-extension"]
      : MOTION_ACTIONS["elbow-flexion"];
  return motionActionActivation(action, angleDeg);
}

export function contractionScale(
  angleDeg,
  direction = "flexion",
  {
    longitudinalShortening = 0.08,
    transverseBulge = 0.07,
  } = {}
) {
  const activation = elbowActivation(angleDeg, direction);
  return Object.freeze({
    x: 1 + transverseBulge * activation,
    y: 1 - longitudinalShortening * activation,
    z: 1 + transverseBulge * activation,
    activation,
  });
}

export function advanceMotionValue(angleDeg, playDirection, deltaSeconds, action) {
  if (!action) return Object.freeze({ angleDeg: 0, direction: 1 });
  const direction = playDirection >= 0 ? 1 : -1;
  const next =
    Number(angleDeg) +
    direction *
      (action.speedDegPerSecond || 55) *
      Math.max(0, Number(deltaSeconds) || 0);

  if (next >= action.maxDeg) {
    return Object.freeze({ angleDeg: action.maxDeg, direction: -1 });
  }
  if (next <= action.minDeg) {
    return Object.freeze({ angleDeg: action.minDeg, direction: 1 });
  }
  return Object.freeze({ angleDeg: next, direction });
}

export function advanceElbowAngle(
  angleDeg,
  playDirection,
  deltaSeconds,
  limits = ELBOW_KINEMATIC_LIMITS
) {
  return advanceMotionValue(angleDeg, playDirection, deltaSeconds, {
    minDeg: limits.minDeg,
    maxDeg: limits.maxDeg,
    speedDegPerSecond: limits.speedDegPerSecond,
  });
}
