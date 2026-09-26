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
    referencePose: "rest",
    ...config,
    synergists: Object.freeze([...(config.synergists || [])]),
    assistants: Object.freeze([...(config.assistants || [])]),
    stabilizers: Object.freeze([...(config.stabilizers || [])]),
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

export const WRIST_PREVIEW_LIMITS = Object.freeze({
  flexion: Object.freeze({ previewMaxDeg: 45, referenceMaxDeg: 80 }),
  extension: Object.freeze({ previewMaxDeg: 45, referenceMaxDeg: 70 }),
  radialDeviation: Object.freeze({ previewMaxDeg: 10, referenceMaxDeg: 20 }),
  ulnarDeviation: Object.freeze({ previewMaxDeg: 25, referenceMaxDeg: 35 }),
  speedDegPerSecond: 40,
});

export const SHOULDER_PREVIEW_LIMITS = Object.freeze({
  flexion: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 160 }),
  abduction: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 150 }),
  scaption: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 150 }),
  adduction: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 90 }),
  horizontalAdduction: Object.freeze({ previewMaxDeg: 60, referenceMaxDeg: 120 }),
  horizontalAbduction: Object.freeze({ previewMaxDeg: 30, referenceMaxDeg: 45 }),
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
  "wrist-flexion": frozenAction({
    pilotId: "wrist",
    movementId: "wrist-flexion",
    direction: "flexion",
    nameRu: "Сгибание запястья",
    controlLabelRu: "Сгибание запястья",
    descriptionRu:
      "Сгибание кисти относительно предплечья. Исполняемый preview ограничен диапазоном текущей MyoArm-модели; рядом показан клинический референс.",
    maxDeg: WRIST_PREVIEW_LIMITS.flexion.previewMaxDeg,
    referenceMaxDeg: WRIST_PREVIEW_LIMITS.flexion.referenceMaxDeg,
    speedDegPerSecond: WRIST_PREVIEW_LIMITS.speedDegPerSecond,
    synergists: ["flexor-carpi-radialis", "flexor-carpi-ulnaris", "palmaris-longus"],
  }),
  "wrist-extension": frozenAction({
    pilotId: "wrist",
    movementId: "wrist-extension",
    direction: "extension",
    nameRu: "Разгибание запястья",
    controlLabelRu: "Разгибание запястья",
    descriptionRu:
      "Разгибание кисти относительно предплечья в учебном кинематическом preview.",
    maxDeg: WRIST_PREVIEW_LIMITS.extension.previewMaxDeg,
    referenceMaxDeg: WRIST_PREVIEW_LIMITS.extension.referenceMaxDeg,
    speedDegPerSecond: WRIST_PREVIEW_LIMITS.speedDegPerSecond,
    synergists: [
      "extensor-carpi-radialis-longus",
      "extensor-carpi-radialis-brevis",
      "extensor-carpi-ulnaris",
    ],
  }),
  "wrist-radial-deviation": frozenAction({
    pilotId: "wrist",
    movementId: "wrist-radial-deviation",
    direction: "radial-deviation",
    nameRu: "Лучевое отклонение кисти",
    controlLabelRu: "Лучевое отклонение",
    descriptionRu:
      "Отклонение кисти в лучевую сторону. Preview ограничен диапазоном текущего MyoArm wrist joint.",
    maxDeg: WRIST_PREVIEW_LIMITS.radialDeviation.previewMaxDeg,
    referenceMaxDeg: WRIST_PREVIEW_LIMITS.radialDeviation.referenceMaxDeg,
    speedDegPerSecond: 28,
    synergists: [
      "flexor-carpi-radialis",
      "extensor-carpi-radialis-longus",
      "extensor-carpi-radialis-brevis",
    ],
  }),
  "wrist-ulnar-deviation": frozenAction({
    pilotId: "wrist",
    movementId: "wrist-ulnar-deviation",
    direction: "ulnar-deviation",
    nameRu: "Локтевое отклонение кисти",
    controlLabelRu: "Локтевое отклонение",
    descriptionRu:
      "Отклонение кисти в локтевую сторону. Preview ограничен диапазоном текущего MyoArm wrist joint.",
    maxDeg: WRIST_PREVIEW_LIMITS.ulnarDeviation.previewMaxDeg,
    referenceMaxDeg: WRIST_PREVIEW_LIMITS.ulnarDeviation.referenceMaxDeg,
    speedDegPerSecond: 28,
    synergists: ["flexor-carpi-ulnaris", "extensor-carpi-ulnaris"],
  }),
  "shoulder-flexion": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-flexion",
    direction: "flexion",
    nameRu: "Сгибание плеча",
    controlLabelRu: "Сгибание плеча",
    descriptionRu:
      "Показан только гленогумеральный компонент сгибания. Лопатка и ключица участвуют в реальном подъёме руки уже в пределах этого диапазона, но их движение пока не моделируется без проверенной регистрации.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.flexion.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.flexion.referenceMaxDeg,
    synergists: ["deltoid-clavicular", "coracobrachialis", "pectoralis-major"],
    assistants: ["biceps-long", "biceps-short"],
    stabilizers: [
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres-minor",
      "trapezius",
      "serratus-anterior",
    ],
  }),
  "shoulder-abduction": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-abduction",
    direction: "abduction",
    nameRu: "Отведение плеча",
    controlLabelRu: "Отведение плеча",
    descriptionRu:
      "Показан только гленогумеральный компонент отведения. Надостная и дельтовидная участвуют в подъёме плечевой кости, а движение лопатки и ключицы в этом preview пока не моделируется.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.abduction.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.abduction.referenceMaxDeg,
    synergists: ["supraspinatus", "deltoid-acromial"],
    stabilizers: [
      "infraspinatus",
      "subscapularis",
      "teres-minor",
      "trapezius",
      "serratus-anterior",
    ],
  }),
  "shoulder-scaption": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-scaption",
    direction: "scaption",
    nameRu: "Подъём в плоскости лопатки",
    controlLabelRu: "Подъём в плоскости лопатки",
    descriptionRu:
      "Подъём плечевой кости примерно на 30° кпереди от фронтальной плоскости. Показан гленогумеральный компонент; лопаточно-ключичный вклад пока не моделируется, поэтому preview ограничен 90°.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.scaption.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.scaption.referenceMaxDeg,
    synergists: ["supraspinatus", "deltoid-acromial"],
    assistants: ["deltoid-clavicular"],
    stabilizers: [
      "infraspinatus",
      "subscapularis",
      "teres-minor",
      "trapezius",
      "serratus-anterior",
    ],
  }),
  "shoulder-adduction": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-adduction",
    direction: "adduction",
    nameRu: "Приведение плеча",
    controlLabelRu: "Положение плеча при приведении",
    descriptionRu:
      "Приведение показано как возврат плеча из 90° отведения к нейтральному положению. Это позволяет не изображать сомнительное приведение через туловище.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.adduction.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.adduction.referenceMaxDeg,
    startDeg: SHOULDER_PREVIEW_LIMITS.adduction.previewMaxDeg,
    playDirection: -1,
    speedDegPerSecond: 40,
    referencePose: "abducted-90",
    synergists: ["pectoralis-major", "latissimus-dorsi", "teres-major"],
    assistants: ["coracobrachialis", "triceps-long"],
    stabilizers: ["supraspinatus", "infraspinatus", "subscapularis", "teres-minor"],
  }),
  "shoulder-horizontal-adduction": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-horizontal-adduction",
    direction: "horizontal-adduction",
    nameRu: "Горизонтальное приведение плеча",
    controlLabelRu: "Горизонтальное приведение",
    descriptionRu:
      "Движение начинается из референсного положения 90° отведения. Preview ограничен 60° и не выдаёт нерассчитанный лопаточно-грудной вклад за полный клинический диапазон.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.horizontalAdduction.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.horizontalAdduction.referenceMaxDeg,
    speedDegPerSecond: 35,
    referencePose: "abducted-90",
    synergists: ["pectoralis-major", "deltoid-clavicular"],
    assistants: ["coracobrachialis"],
    stabilizers: ["supraspinatus", "infraspinatus", "subscapularis", "teres-minor"],
  }),
  "shoulder-horizontal-abduction": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-horizontal-abduction",
    direction: "horizontal-abduction",
    nameRu: "Горизонтальное отведение плеча",
    controlLabelRu: "Горизонтальное отведение",
    descriptionRu:
      "Движение начинается из референсного положения 90° отведения. Preview ограничен 30° до проверки полного лопаточно-грудного вклада.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.horizontalAbduction.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.horizontalAbduction.referenceMaxDeg,
    speedDegPerSecond: 32,
    referencePose: "abducted-90",
    synergists: ["deltoid-spinal"],
    assistants: ["infraspinatus", "teres-minor"],
    stabilizers: ["supraspinatus", "subscapularis"],
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
    synergists: ["deltoid-spinal", "latissimus-dorsi", "teres-major"],
    assistants: ["triceps-long"],
    stabilizers: ["supraspinatus", "infraspinatus", "subscapularis", "teres-minor"],
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
    stabilizers: ["supraspinatus", "subscapularis"],
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
      "latissimus-dorsi",
      "teres-major",
    ],
    stabilizers: ["supraspinatus", "infraspinatus", "teres-minor"],
  }),
});

const UNIT_ACTION_IDS = Object.freeze({
  "biceps-long": Object.freeze([
    "elbow-flexion",
    "forearm-supination",
    "shoulder-flexion",
  ]),
  "biceps-short": Object.freeze([
    "elbow-flexion",
    "forearm-supination",
    "shoulder-flexion",
  ]),
  brachialis: Object.freeze(["elbow-flexion"]),
  brachioradialis: Object.freeze(["elbow-flexion"]),
  "triceps-long": Object.freeze([
    "elbow-extension",
    "shoulder-extension",
    "shoulder-adduction",
  ]),
  "triceps-lateral": Object.freeze(["elbow-extension"]),
  "triceps-medial": Object.freeze(["elbow-extension"]),
  anconeus: Object.freeze(["elbow-extension"]),
  "pronator-teres": Object.freeze(["forearm-pronation"]),
  "pronator-quadratus": Object.freeze(["forearm-pronation"]),
  supinator: Object.freeze(["forearm-supination"]),
  "flexor-carpi-radialis": Object.freeze([
    "wrist-flexion",
    "wrist-radial-deviation",
  ]),
  "flexor-carpi-ulnaris": Object.freeze([
    "wrist-flexion",
    "wrist-ulnar-deviation",
  ]),
  "extensor-carpi-radialis-longus": Object.freeze([
    "wrist-extension",
    "wrist-radial-deviation",
  ]),
  "extensor-carpi-radialis-brevis": Object.freeze([
    "wrist-extension",
    "wrist-radial-deviation",
  ]),
  "extensor-carpi-ulnaris": Object.freeze([
    "wrist-extension",
    "wrist-ulnar-deviation",
  ]),
  "palmaris-longus": Object.freeze(["wrist-flexion"]),
  "deltoid-clavicular": Object.freeze([
    "shoulder-flexion",
    "shoulder-scaption",
    "shoulder-horizontal-adduction",
    "shoulder-internal-rotation",
  ]),
  "deltoid-acromial": Object.freeze([
    "shoulder-abduction",
    "shoulder-scaption",
  ]),
  "deltoid-spinal": Object.freeze([
    "shoulder-extension",
    "shoulder-horizontal-abduction",
    "shoulder-external-rotation",
  ]),
  supraspinatus: Object.freeze(["shoulder-abduction", "shoulder-scaption"]),
  infraspinatus: Object.freeze([
    "shoulder-external-rotation",
    "shoulder-horizontal-abduction",
  ]),
  subscapularis: Object.freeze(["shoulder-internal-rotation"]),
  "teres-minor": Object.freeze([
    "shoulder-external-rotation",
    "shoulder-horizontal-abduction",
  ]),
  "pectoralis-major": Object.freeze([
    "shoulder-flexion",
    "shoulder-adduction",
    "shoulder-horizontal-adduction",
    "shoulder-internal-rotation",
  ]),
  "latissimus-dorsi": Object.freeze([
    "shoulder-extension",
    "shoulder-adduction",
    "shoulder-internal-rotation",
  ]),
  coracobrachialis: Object.freeze([
    "shoulder-flexion",
    "shoulder-adduction",
    "shoulder-horizontal-adduction",
  ]),
  "teres-major": Object.freeze([
    "shoulder-extension",
    "shoulder-adduction",
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
  return action.playDirection < 0 ? 1 - progress : progress;
}

export function shoulderPreviewRotation(action, angleDeg, sideSign = 1) {
  if (!action) {
    return Object.freeze({ axis: Object.freeze([0, 1, 0]), angleRad: 0 });
  }

  const value = clampMotionValue(action, angleDeg);
  const radians = (value * Math.PI) / 180;
  const side = sideSign < 0 ? -1 : 1;

  if (action.movementId === "shoulder-flexion") {
    return Object.freeze({
      axis: Object.freeze([1, 0, 0]),
      angleRad: -radians,
    });
  }
  if (action.movementId === "shoulder-extension") {
    return Object.freeze({
      axis: Object.freeze([1, 0, 0]),
      angleRad: radians,
    });
  }
  if (
    action.movementId === "shoulder-abduction" ||
    action.movementId === "shoulder-adduction"
  ) {
    return Object.freeze({
      axis: Object.freeze([0, 0, 1]),
      angleRad: radians * side,
    });
  }
  if (action.movementId === "shoulder-scaption") {
    const planeRad = Math.PI / 6;
    return Object.freeze({
      axis: Object.freeze([
        -Math.sin(planeRad),
        0,
        Math.cos(planeRad) * side,
      ]),
      angleRad: radians,
    });
  }
  if (action.movementId === "shoulder-horizontal-adduction") {
    return Object.freeze({
      axis: Object.freeze([0, 1, 0]),
      angleRad: -radians * side,
    });
  }
  if (action.movementId === "shoulder-horizontal-abduction") {
    return Object.freeze({
      axis: Object.freeze([0, 1, 0]),
      angleRad: radians * side,
    });
  }
  if (action.movementId === "shoulder-external-rotation") {
    return Object.freeze({
      axis: Object.freeze([0, 1, 0]),
      angleRad: -radians * side,
    });
  }
  return Object.freeze({
    axis: Object.freeze([0, 1, 0]),
    angleRad: radians * side,
  });
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
