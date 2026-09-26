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
    displayUnit: "°",
    ...config,
    synergists: Object.freeze([...(config.synergists || [])]),
    assistants: Object.freeze([...(config.assistants || [])]),
    stabilizers: Object.freeze([...(config.stabilizers || [])]),
    scapularDrivers: Object.freeze([...(config.scapularDrivers || [])]),
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
  flexion: Object.freeze({ previewMaxDeg: 160, referenceMaxDeg: 180 }),
  abduction: Object.freeze({ previewMaxDeg: 150, referenceMaxDeg: 150 }),
  scaption: Object.freeze({ previewMaxDeg: 150, referenceMaxDeg: 150 }),
  adduction: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 90 }),
  horizontalAdduction: Object.freeze({ previewMaxDeg: 60, referenceMaxDeg: 120 }),
  horizontalAbduction: Object.freeze({ previewMaxDeg: 30, referenceMaxDeg: 45 }),
  extension: Object.freeze({ previewMaxDeg: 45, referenceMaxDeg: 45 }),
  externalRotation: Object.freeze({ previewMaxDeg: 60, referenceMaxDeg: 60 }),
  internalRotation: Object.freeze({ previewMaxDeg: 90, referenceMaxDeg: 90 }),
});

export const SCAPULAR_PREVIEW_LIMITS = Object.freeze({
  translationPercent: 100,
  upwardRotationDeg: 45,
  upwardRotationReferenceDeg: 60,
  downwardRotationDeg: 30,
  speedPercentPerSecond: 42,
  speedDegPerSecond: 32,
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
      "Совместный учебный preview подъёма руки: движение плечевой кости сочетается с верхней ротацией лопатки и ключичным компонентом. Это кинематическая модель, а не индивидуальная норма или расчёт силы.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.flexion.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.flexion.referenceMaxDeg,
    combinedShoulderComplex: true,
    rangeNoteRu:
      "Combined preview до 160°: вклад лопатки меняется по диапазону, а не задаётся постоянным 2:1. Клинический референс сгибания около 180°.",
    synergists: ["deltoid-clavicular", "coracobrachialis", "pectoralis-major"],
    assistants: ["biceps-long", "biceps-short"],
    scapularDrivers: ["serratus-anterior", "trapezius"],
    stabilizers: [
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres-minor",
    ],
  }),
  "shoulder-abduction": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-abduction",
    direction: "abduction",
    nameRu: "Отведение плеча",
    controlLabelRu: "Отведение плеча",
    descriptionRu:
      "Совместное отведение плечевого комплекса: плечевая кость, лопатка и ключица движутся согласованно. Надостная и акромиальная часть дельтовидной поднимают плечевую кость; передняя зубчатая и трапециевидная обеспечивают лопаточный компонент.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.abduction.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.abduction.referenceMaxDeg,
    combinedShoulderComplex: true,
    rangeNoteRu:
      "Combined preview до 150°. Верхняя ротация лопатки нарастает нелинейно и к верхнему диапазону приближается к опубликованному ориентиру около 60°.",
    synergists: ["supraspinatus", "deltoid-acromial"],
    scapularDrivers: ["serratus-anterior", "trapezius"],
    stabilizers: [
      "infraspinatus",
      "subscapularis",
      "teres-minor",
    ],
  }),
  "shoulder-scaption": frozenAction({
    pilotId: "shoulder",
    movementId: "shoulder-scaption",
    direction: "scaption",
    nameRu: "Подъём в плоскости лопатки",
    controlLabelRu: "Подъём в плоскости лопатки",
    descriptionRu:
      "Подъём примерно на 30° кпереди от фронтальной плоскости с согласованным лопаточно-ключичным компонентом.",
    maxDeg: SHOULDER_PREVIEW_LIMITS.scaption.previewMaxDeg,
    referenceMaxDeg: SHOULDER_PREVIEW_LIMITS.scaption.referenceMaxDeg,
    combinedShoulderComplex: true,
    rangeNoteRu:
      "Combined preview до 150° в плоскости лопатки; вклад лопатки меняется по диапазону.",
    synergists: ["supraspinatus", "deltoid-acromial"],
    assistants: ["deltoid-clavicular"],
    scapularDrivers: ["serratus-anterior", "trapezius"],
    stabilizers: [
      "infraspinatus",
      "subscapularis",
      "teres-minor",
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
    combinedShoulderComplex: true,
    rangeNoteRu:
      "Возврат из 90° отведения к нейтрали показан как связное движение плечевой кости, лопатки и ключицы; точная индивидуальная траектория не заявляется.",
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
  "scapular-protraction": frozenAction({
    pilotId: "scapula",
    movementId: "scapular-protraction",
    direction: "protraction",
    nameRu: "Протракция лопатки",
    controlLabelRu: "Протракция",
    descriptionRu:
      "Протракция показана как связанное трёхмерное движение плечевого пояса: ключица движется в грудино-ключичном сочленении, а лопатка относительно её латеральной базы ротируется внутрь и слегка наклоняется кпереди.",
    maxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    referenceMaxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    speedDegPerSecond: SCAPULAR_PREVIEW_LIMITS.speedPercentPerSecond,
    displayUnit: "%",
    rangeNoteRu:
      "0–100% консервативной учебной амплитуды протракции; это не измерение в миллиметрах.",
    synergists: ["serratus-anterior", "pectoralis-minor"],
    stabilizers: ["trapezius"],
  }),
  "scapular-retraction": frozenAction({
    pilotId: "scapula",
    movementId: "scapular-retraction",
    direction: "retraction",
    nameRu: "Ретракция лопатки",
    controlLabelRu: "Ретракция",
    descriptionRu:
      "Ретракция показана как связанное движение ключицы и лопатки: плечевой пояс уходит кзади, а лопатка относительно латеральной ключичной базы ротируется кнаружи и слегка наклоняется кзади.",
    maxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    referenceMaxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    speedDegPerSecond: SCAPULAR_PREVIEW_LIMITS.speedPercentPerSecond,
    displayUnit: "%",
    rangeNoteRu:
      "0–100% консервативной учебной амплитуды ретракции; точное линейное смещение не заявляется.",
    synergists: ["rhomboid-major", "rhomboid-minor", "trapezius"],
    stabilizers: ["serratus-anterior"],
  }),
  "scapular-elevation": frozenAction({
    pilotId: "scapula",
    movementId: "scapular-elevation",
    direction: "elevation",
    nameRu: "Подъём лопатки",
    controlLabelRu: "Подъём",
    descriptionRu:
      "Подъём плечевого пояса показан через движение ключицы вокруг её медиальной опоры; латеральный конец ключицы переносит основание лопатки вверх.",
    maxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    referenceMaxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    speedDegPerSecond: SCAPULAR_PREVIEW_LIMITS.speedPercentPerSecond,
    displayUnit: "%",
    rangeNoteRu:
      "0–100% консервативной учебной амплитуды подъёма плечевого пояса.",
    synergists: ["levator-scapulae", "trapezius"],
    assistants: ["rhomboid-major", "rhomboid-minor"],
  }),
  "scapular-depression": frozenAction({
    pilotId: "scapula",
    movementId: "scapular-depression",
    direction: "depression",
    nameRu: "Опускание лопатки",
    controlLabelRu: "Опускание",
    descriptionRu:
      "Опускание плечевого пояса показано как связанное движение ключицы и лопатки вниз; это кинематический preview без расчёта мышечной силы.",
    maxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    referenceMaxDeg: SCAPULAR_PREVIEW_LIMITS.translationPercent,
    speedDegPerSecond: SCAPULAR_PREVIEW_LIMITS.speedPercentPerSecond,
    displayUnit: "%",
    rangeNoteRu:
      "0–100% консервативной учебной амплитуды опускания плечевого пояса.",
    synergists: ["pectoralis-minor", "trapezius"],
    stabilizers: ["serratus-anterior"],
  }),
  "scapular-upward-rotation": frozenAction({
    pilotId: "scapula",
    movementId: "scapular-upward-rotation",
    direction: "upward-rotation",
    nameRu: "Верхняя ротация лопатки",
    controlLabelRu: "Верхняя ротация",
    descriptionRu:
      "Верхняя ротация лопатки показана вместе с небольшим задним наклоном и ключичным компонентом. Передняя зубчатая и трапециевидная выделены как основные двигатели этого учебного движения.",
    maxDeg: SCAPULAR_PREVIEW_LIMITS.upwardRotationDeg,
    referenceMaxDeg: SCAPULAR_PREVIEW_LIMITS.upwardRotationReferenceDeg,
    speedDegPerSecond: SCAPULAR_PREVIEW_LIMITS.speedDegPerSecond,
    synergists: ["serratus-anterior", "trapezius"],
    stabilizers: ["rhomboid-major", "rhomboid-minor", "levator-scapulae"],
  }),
  "scapular-downward-rotation": frozenAction({
    pilotId: "scapula",
    movementId: "scapular-downward-rotation",
    direction: "downward-rotation",
    nameRu: "Нижняя ротация лопатки",
    controlLabelRu: "Нижняя ротация",
    descriptionRu:
      "Нижняя ротация лопатки показана как обратное связанное движение лопаточно-ключичного комплекса в консервативном учебном диапазоне.",
    maxDeg: SCAPULAR_PREVIEW_LIMITS.downwardRotationDeg,
    referenceMaxDeg: SCAPULAR_PREVIEW_LIMITS.downwardRotationDeg,
    speedDegPerSecond: SCAPULAR_PREVIEW_LIMITS.speedDegPerSecond,
    synergists: ["rhomboid-major", "rhomboid-minor", "levator-scapulae", "pectoralis-minor"],
    stabilizers: ["serratus-anterior", "trapezius"],
  })
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
  trapezius: Object.freeze([
    "shoulder-flexion",
    "shoulder-abduction",
    "shoulder-scaption",
    "scapular-retraction",
    "scapular-elevation",
    "scapular-depression",
    "scapular-upward-rotation",
    "scapular-downward-rotation",
  ]),
  "serratus-anterior": Object.freeze([
    "shoulder-flexion",
    "shoulder-abduction",
    "shoulder-scaption",
    "scapular-protraction",
    "scapular-upward-rotation",
  ]),
  "rhomboid-major": Object.freeze([
    "scapular-retraction",
    "scapular-elevation",
    "scapular-downward-rotation",
  ]),
  "rhomboid-minor": Object.freeze([
    "scapular-retraction",
    "scapular-elevation",
    "scapular-downward-rotation",
  ]),
  "levator-scapulae": Object.freeze([
    "scapular-elevation",
    "scapular-downward-rotation",
  ]),
  "pectoralis-minor": Object.freeze([
    "scapular-protraction",
    "scapular-depression",
    "scapular-downward-rotation",
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

const SHOULDER_ELEVATION_SCAPULA_POINTS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([30, 5]),
  Object.freeze([60, 24]),
  Object.freeze([90, 30]),
  Object.freeze([120, 35]),
  Object.freeze([150, 52]),
  Object.freeze([160, 56]),
  Object.freeze([180, 61]),
]);

// These are deliberately conservative deltas from the model's rest pose,
// not normative "ideal" values. The robust teaching pattern is 3D:
// upward rotation + posterior tilt throughout elevation, with a modest
// trend toward external rotation in the upper range. Healthy variability
// is too large to present one exact trajectory as normal.
const SHOULDER_ELEVATION_POSTERIOR_TILT_POINTS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([30, 2]),
  Object.freeze([60, 5]),
  Object.freeze([90, 8]),
  Object.freeze([120, 12]),
  Object.freeze([150, 16]),
  Object.freeze([160, 17]),
  Object.freeze([180, 18]),
]);

const SHOULDER_ELEVATION_EXTERNAL_ROTATION_POINTS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([30, 0]),
  Object.freeze([60, 0.5]),
  Object.freeze([90, 2]),
  Object.freeze([120, 4]),
  Object.freeze([150, 6]),
  Object.freeze([160, 6.5]),
  Object.freeze([180, 7]),
]);

// Arm elevation is also accompanied by axial humeral rotation. The amount
// depends strongly on the plane of elevation, so the teaching preview uses
// deliberately conservative plane-specific trajectories instead of one
// universal value. Frontal abduction gets the largest external-rotation
// component, scaption an intermediate one, and sagittal flexion only a small
// component. These are visual deltas from the source model's rest pose.
const SHOULDER_ABDUCTION_HUMERAL_EXTERNAL_ROTATION_POINTS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([30, 4]),
  Object.freeze([60, 11]),
  Object.freeze([90, 19]),
  Object.freeze([120, 26]),
  Object.freeze([150, 24]),
  Object.freeze([180, 22]),
]);

const SHOULDER_SCAPTION_HUMERAL_EXTERNAL_ROTATION_POINTS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([30, 2]),
  Object.freeze([60, 5]),
  Object.freeze([90, 9]),
  Object.freeze([120, 13]),
  Object.freeze([150, 12]),
  Object.freeze([180, 11]),
]);

const SHOULDER_FLEXION_HUMERAL_EXTERNAL_ROTATION_POINTS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([30, 0.5]),
  Object.freeze([60, 1]),
  Object.freeze([90, 2]),
  Object.freeze([120, 3]),
  Object.freeze([150, 3]),
  Object.freeze([180, 3]),
]);

function interpolateControlPoints(points, value) {
  const x = Number(value) || 0;
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    if (x <= x2) {
      const t = (x - x1) / Math.max(1e-6, x2 - x1);
      return y1 + (y2 - y1) * t;
    }
  }
  return points[points.length - 1][1];
}

function shoulderElevationHumeralExternalRotationDeg(action, totalDeg) {
  const movementId = action?.movementId || "";
  if (
    movementId === "shoulder-abduction" ||
    movementId === "shoulder-adduction"
  ) {
    return interpolateControlPoints(
      SHOULDER_ABDUCTION_HUMERAL_EXTERNAL_ROTATION_POINTS,
      totalDeg
    );
  }
  if (movementId === "shoulder-scaption") {
    return interpolateControlPoints(
      SHOULDER_SCAPTION_HUMERAL_EXTERNAL_ROTATION_POINTS,
      totalDeg
    );
  }
  if (movementId === "shoulder-flexion") {
    return interpolateControlPoints(
      SHOULDER_FLEXION_HUMERAL_EXTERNAL_ROTATION_POINTS,
      totalDeg
    );
  }
  return 0;
}

export function shoulderComplexElevationPreview(
  action,
  totalElevationDeg,
  sideSign = 1
) {
  const totalDeg = clampMotionValue(action, totalElevationDeg);
  const combined = Boolean(action?.combinedShoulderComplex);
  const side = sideSign < 0 ? -1 : 1;

  if (!combined) {
    return Object.freeze({
      totalDeg,
      glenohumeralDeg: totalDeg,
      scapularUpwardRotationDeg: 0,
      scapularPosteriorTiltDeg: 0,
      scapularExternalRotationDeg: 0,
      humeralExternalRotationDeg: 0,
      clavicleElevationDeg: 0,
      clavicleRetractionDeg: 0,
      claviclePosteriorRotationDeg: 0,
      side,
    });
  }

  const scapularUpwardRotationDeg = Math.min(
    totalDeg,
    interpolateControlPoints(SHOULDER_ELEVATION_SCAPULA_POINTS, totalDeg)
  );
  const glenohumeralDeg = Math.max(
    0,
    totalDeg - scapularUpwardRotationDeg
  );
  const scapularPosteriorTiltDeg = interpolateControlPoints(
    SHOULDER_ELEVATION_POSTERIOR_TILT_POINTS,
    totalDeg
  );
  const scapularExternalRotationDeg = interpolateControlPoints(
    SHOULDER_ELEVATION_EXTERNAL_ROTATION_POINTS,
    totalDeg
  );
  const humeralExternalRotationDeg =
    shoulderElevationHumeralExternalRotationDeg(action, totalDeg);

  // Clavicular motion is scaled to the elevation itself rather than to the
  // preview's local maximum. That prevents a 90° teaching action from being
  // assigned the same clavicular excursion as a full overhead raise.
  const elevationProgress = Math.min(1, totalDeg / 180);

  return Object.freeze({
    totalDeg,
    glenohumeralDeg,
    scapularUpwardRotationDeg,
    scapularPosteriorTiltDeg,
    scapularExternalRotationDeg,
    humeralExternalRotationDeg,
    clavicleElevationDeg: 13 * elevationProgress,
    clavicleRetractionDeg: 20 * elevationProgress,
    claviclePosteriorRotationDeg: 24 * elevationProgress,
    side,
  });
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

export function scapularPreviewTransform(action, value, sideSign = 1) {
  const side = sideSign < 0 ? -1 : 1;
  const clamped = clampMotionValue(action, value);
  const progress =
    action.maxDeg > action.minDeg
      ? (clamped - action.minDeg) / (action.maxDeg - action.minDeg)
      : 0;

  // Standalone scapular actions use the same structural idea as the combined
  // shoulder preview: the medial clavicle is the thoracic anchor, its lateral
  // end carries the scapular base, and the scapula then adds AC-like 3D
  // rotation. Values are conservative teaching deltas from the source rest
  // pose, not a universal normative trajectory.
  const result = {
    translationFraction: [0, 0, 0],
    scapularUpwardRotationDeg: 0,
    scapularPosteriorTiltDeg: 0,
    scapularExternalRotationDeg: 0,
    clavicleElevationDeg: 0,
    clavicleRetractionDeg: 0,
    claviclePosteriorRotationDeg: 0,
  };

  if (action.movementId === "scapular-protraction") {
    result.scapularUpwardRotationDeg = -1.5 * progress;
    result.scapularPosteriorTiltDeg = -4 * progress;
    result.scapularExternalRotationDeg = -10 * progress;
    result.clavicleRetractionDeg = -9 * progress;
  } else if (action.movementId === "scapular-retraction") {
    result.scapularUpwardRotationDeg = 1 * progress;
    result.scapularPosteriorTiltDeg = 3 * progress;
    result.scapularExternalRotationDeg = 8 * progress;
    result.clavicleRetractionDeg = 9 * progress;
  } else if (action.movementId === "scapular-elevation") {
    result.scapularUpwardRotationDeg = -3 * progress;
    result.scapularPosteriorTiltDeg = -2 * progress;
    result.scapularExternalRotationDeg = -1 * progress;
    result.clavicleElevationDeg = 9 * progress;
    result.clavicleRetractionDeg = 1 * progress;
    result.claviclePosteriorRotationDeg = 2 * progress;
  } else if (action.movementId === "scapular-depression") {
    result.scapularUpwardRotationDeg = 3 * progress;
    result.scapularPosteriorTiltDeg = 2 * progress;
    result.scapularExternalRotationDeg = 1 * progress;
    result.clavicleElevationDeg = -8 * progress;
    result.clavicleRetractionDeg = -1 * progress;
    result.claviclePosteriorRotationDeg = -2 * progress;
  } else if (action.movementId === "scapular-upward-rotation") {
    result.scapularUpwardRotationDeg = clamped;
    result.scapularPosteriorTiltDeg = clamped * 0.23;
    result.scapularExternalRotationDeg = clamped * 0.08;
    result.clavicleElevationDeg = clamped * 0.22;
    result.clavicleRetractionDeg = clamped * 0.12;
    result.claviclePosteriorRotationDeg = clamped * 0.28;
  } else if (action.movementId === "scapular-downward-rotation") {
    result.scapularUpwardRotationDeg = -clamped;
    result.scapularPosteriorTiltDeg = -clamped * 0.16;
    result.scapularExternalRotationDeg = -clamped * 0.06;
    result.clavicleElevationDeg = -clamped * 0.16;
    result.clavicleRetractionDeg = -clamped * 0.08;
    result.claviclePosteriorRotationDeg = -clamped * 0.20;
  }

  let axis = [0, 0, 1];
  let primaryScapularDeg = result.scapularUpwardRotationDeg;
  if (
    action.movementId === "scapular-protraction" ||
    action.movementId === "scapular-retraction"
  ) {
    axis = [0, 1, 0];
    primaryScapularDeg = result.scapularExternalRotationDeg;
  }

  const clavicleCompositeDeg = Math.hypot(
    result.clavicleElevationDeg,
    result.clavicleRetractionDeg,
    result.claviclePosteriorRotationDeg
  );

  return Object.freeze({
    translationFraction: Object.freeze(result.translationFraction),
    axis: Object.freeze(axis),
    angleRad: (primaryScapularDeg * Math.PI * side) / 180,
    clavicleRotationRad: (clavicleCompositeDeg * Math.PI) / 180,
    clavicleTranslationFraction: Object.freeze([0, 0, 0]),
    scapularUpwardRotationDeg: result.scapularUpwardRotationDeg,
    scapularPosteriorTiltDeg: result.scapularPosteriorTiltDeg,
    scapularExternalRotationDeg: result.scapularExternalRotationDeg,
    clavicleElevationDeg: result.clavicleElevationDeg,
    clavicleRetractionDeg: result.clavicleRetractionDeg,
    claviclePosteriorRotationDeg: result.claviclePosteriorRotationDeg,
    side,
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
