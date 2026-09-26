function entity(id, kind, nameRu) {
  return Object.freeze({ id, kind, nameRu });
}

export const ANATOMY_SEMANTICS = Object.freeze({
  "biceps-long": entity(
    "biceps-long",
    "muscle",
    "Длинная головка двуглавой мышцы плеча"
  ),
  "biceps-short": entity(
    "biceps-short",
    "muscle",
    "Короткая головка двуглавой мышцы плеча"
  ),
  brachialis: entity("brachialis", "muscle", "Плечевая мышца"),
  brachioradialis: entity(
    "brachioradialis",
    "muscle",
    "Плечелучевая мышца"
  ),
  "triceps-long": entity(
    "triceps-long",
    "muscle",
    "Длинная головка трёхглавой мышцы плеча"
  ),
  "triceps-lateral": entity(
    "triceps-lateral",
    "muscle",
    "Латеральная головка трёхглавой мышцы плеча"
  ),
  "triceps-medial": entity(
    "triceps-medial",
    "muscle",
    "Медиальная головка трёхглавой мышцы плеча"
  ),
  anconeus: entity("anconeus", "muscle", "Локтевая мышца"),
  "pronator-teres": entity(
    "pronator-teres",
    "muscle",
    "Круглый пронатор"
  ),
  "pronator-quadratus": entity(
    "pronator-quadratus",
    "muscle",
    "Квадратный пронатор"
  ),
  supinator: entity("supinator", "muscle", "Супинатор"),
  "flexor-carpi-radialis": entity(
    "flexor-carpi-radialis",
    "muscle",
    "Лучевой сгибатель запястья"
  ),
  "flexor-carpi-ulnaris": entity(
    "flexor-carpi-ulnaris",
    "muscle",
    "Локтевой сгибатель запястья"
  ),
  "extensor-carpi-radialis-longus": entity(
    "extensor-carpi-radialis-longus",
    "muscle",
    "Длинный лучевой разгибатель запястья"
  ),
  "extensor-carpi-radialis-brevis": entity(
    "extensor-carpi-radialis-brevis",
    "muscle",
    "Короткий лучевой разгибатель запястья"
  ),
  "extensor-carpi-ulnaris": entity(
    "extensor-carpi-ulnaris",
    "muscle",
    "Локтевой разгибатель запястья"
  ),
  "palmaris-longus": entity(
    "palmaris-longus",
    "muscle",
    "Длинная ладонная мышца"
  ),
  "pectoralis-major": entity(
    "pectoralis-major",
    "muscle",
    "Большая грудная мышца"
  ),
  "latissimus-dorsi": entity(
    "latissimus-dorsi",
    "muscle",
    "Широчайшая мышца спины"
  ),
  trapezius: entity("trapezius", "muscle", "Трапециевидная мышца"),
  "serratus-anterior": entity(
    "serratus-anterior",
    "muscle",
    "Передняя зубчатая мышца"
  ),
  "rhomboid-major": entity(
    "rhomboid-major",
    "muscle",
    "Большая ромбовидная мышца"
  ),
  "rhomboid-minor": entity(
    "rhomboid-minor",
    "muscle",
    "Малая ромбовидная мышца"
  ),
  "levator-scapulae": entity(
    "levator-scapulae",
    "muscle",
    "Мышца, поднимающая лопатку"
  ),
  "pectoralis-minor": entity(
    "pectoralis-minor",
    "muscle",
    "Малая грудная мышца"
  ),
  subclavius: entity("subclavius", "muscle", "Подключичная мышца"),
  coracobrachialis: entity(
    "coracobrachialis",
    "muscle",
    "Клювовидно-плечевая мышца"
  ),
  "teres-major": entity(
    "teres-major",
    "muscle",
    "Большая круглая мышца"
  ),
  "deltoid-clavicular": entity(
    "deltoid-clavicular",
    "muscle",
    "Ключичная часть дельтовидной мышцы"
  ),
  "deltoid-acromial": entity(
    "deltoid-acromial",
    "muscle",
    "Акромиальная часть дельтовидной мышцы"
  ),
  "deltoid-spinal": entity(
    "deltoid-spinal",
    "muscle",
    "Остистая часть дельтовидной мышцы"
  ),
  supraspinatus: entity(
    "supraspinatus",
    "muscle",
    "Надостная мышца"
  ),
  infraspinatus: entity(
    "infraspinatus",
    "muscle",
    "Подостная мышца"
  ),
  subscapularis: entity(
    "subscapularis",
    "muscle",
    "Подлопаточная мышца"
  ),
  "teres-minor": entity(
    "teres-minor",
    "muscle",
    "Малая круглая мышца"
  ),

  scapula: entity("scapula", "bone", "Лопатка"),
  clavicle: entity("clavicle", "bone", "Ключица"),
  humerus: entity("humerus", "bone", "Плечевая кость"),
  radius: entity("radius", "bone", "Лучевая кость"),
  ulna: entity("ulna", "bone", "Локтевая кость"),
  hand: entity("hand", "bone-group", "Кости кисти"),
});

export function anatomySemantic(id) {
  return ANATOMY_SEMANTICS[id] || null;
}

export function anatomySemanticNameRu(id) {
  return anatomySemantic(id)?.nameRu || id || "";
}
