const SIDE_RU = Object.freeze({
  left: "слева",
  right: "справа",
});

const ORDINAL_ROMAN = Object.freeze({
  first: "I",
  second: "II",
  third: "III",
  fourth: "IV",
  fifth: "V",
  sixth: "VI",
  seventh: "VII",
  eighth: "VIII",
  ninth: "IX",
  tenth: "X",
  eleventh: "XI",
  twelfth: "XII",
});

const SIMPLE_BONES = Object.freeze({
  atlas: "Атлант",
  axis: "Осевой позвонок",
  ethmoid: "Решётчатая кость",
  "frontal bone": "Лобная кость",
  "hyoid bone": "Подъязычная кость",
  mandible: "Нижняя челюсть",
  "occipital bone": "Затылочная кость",
  "sphenoid bone": "Клиновидная кость",
  vomer: "Сошник",
  calcaneus: "Пяточная кость",
  capitate: "Головчатая кость",
  clavicle: "Ключица",
  "cuboid bone": "Кубовидная кость",
  femur: "Бедренная кость",
  fibula: "Малоберцовая кость",
  hamate: "Крючковидная кость",
  "hip bone": "Тазовая кость",
  humerus: "Плечевая кость",
  "inferior nasal concha": "Нижняя носовая раковина",
  "intermediate cuneiform bone": "Промежуточная клиновидная кость стопы",
  "lacrimal bone": "Слёзная кость",
  "lateral cuneiform bone": "Латеральная клиновидная кость стопы",
  lunate: "Полулунная кость",
  maxilla: "Верхняя челюсть",
  "medial cuneiform bone": "Медиальная клиновидная кость стопы",
  "nasal bone": "Носовая кость",
  "palatine bone": "Нёбная кость",
  "parietal bone": "Теменная кость",
  patella: "Надколенник",
  pisiform: "Гороховидная кость",
  radius: "Лучевая кость",
  scaphoid: "Ладьевидная кость кисти",
  scapula: "Лопатка",
  talus: "Таранная кость",
  "temporal bone": "Височная кость",
  tibia: "Большеберцовая кость",
  trapezium: "Кость-трапеция",
  trapezoid: "Трапециевидная кость",
  triquetral: "Трёхгранная кость",
  ulna: "Локтевая кость",
  "zygomatic bone": "Скуловая кость",
});

const DIGIT_RU = Object.freeze({
  "big toe": "большого пальца стопы",
  "second toe": "II пальца стопы",
  "third toe": "III пальца стопы",
  "fourth toe": "IV пальца стопы",
  "little toe": "V пальца стопы",
  thumb: "большого пальца кисти",
  "index finger": "указательного пальца кисти",
  "middle finger": "среднего пальца кисти",
  "ring finger": "безымянного пальца кисти",
  "little finger": "мизинца кисти",
});

const PHALANX_RU = Object.freeze({
  proximal: "Проксимальная фаланга",
  middle: "Средняя фаланга",
  distal: "Дистальная фаланга",
});

function withSide(name, side) {
  const value = SIDE_RU[String(side || "").toLocaleLowerCase("en-US")];
  return value ? name + " (" + value + ")" : name;
}

function extractLeadingSide(source) {
  const match = String(source || "").match(/^(left|right)\s+(.+)$/i);
  if (!match) return null;
  return { side: match[1].toLocaleLowerCase("en-US"), rest: match[2].trim() };
}

export function boneTermRu(sourceName) {
  const source = String(sourceName || "").trim();
  if (!source) return { source, nameRu: "Костная структура", specific: false };

  const phalanx = source.match(
    /^(proximal|middle|distal) phalanx of (left|right) (big toe|second toe|third toe|fourth toe|little toe|thumb|index finger|middle finger|ring finger|little finger)$/i
  );
  if (phalanx) {
    const level = PHALANX_RU[phalanx[1].toLocaleLowerCase("en-US")];
    const digit = DIGIT_RU[phalanx[3].toLocaleLowerCase("en-US")];
    return {
      source,
      nameRu: withSide(level + " " + digit, phalanx[2]),
      specific: true,
    };
  }

  const footBone = source.match(/^(navicular|sesamoid) bone of (left|right) foot$/i);
  if (footBone) {
    const name =
      footBone[1].toLocaleLowerCase("en-US") === "navicular"
        ? "Ладьевидная кость стопы"
        : "Сесамовидная кость стопы";
    return { source, nameRu: withSide(name, footBone[2]), specific: true };
  }

  const vertebra = source.match(
    /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (cervical|thoracic|lumbar) vertebra$/i
  );
  if (vertebra) {
    const region = {
      cervical: "шейный",
      thoracic: "грудной",
      lumbar: "поясничный",
    }[vertebra[2].toLocaleLowerCase("en-US")];
    return {
      source,
      nameRu:
        ORDINAL_ROMAN[vertebra[1].toLocaleLowerCase("en-US")] +
        " " +
        region +
        " позвонок",
      specific: true,
    };
  }

  const side = extractLeadingSide(source);
  if (side) {
    const lower = side.rest.toLocaleLowerCase("en-US");

    const rib = lower.match(
      /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) rib$/
    );
    if (rib) {
      return {
        source,
        nameRu: withSide(
          ORDINAL_ROMAN[rib[1]] + " ребро",
          side.side
        ),
        specific: true,
      };
    }

    const longBone = SIMPLE_BONES[lower];
    if (longBone) {
      return { source, nameRu: withSide(longBone, side.side), specific: true };
    }

    const handFoot = lower.match(
      /^(first|second|third|fourth|fifth) (metacarpal|metatarsal) bone$/
    );
    if (handFoot) {
      const region =
        handFoot[2] === "metacarpal" ? "пястная кость" : "плюсневая кость";
      return {
        source,
        nameRu: withSide(
          ORDINAL_ROMAN[handFoot[1]] + " " + region,
          side.side
        ),
        specific: true,
      };
    }
  }

  const exact = SIMPLE_BONES[source.toLocaleLowerCase("en-US")];
  if (exact) return { source, nameRu: exact, specific: true };

  return {
    source,
    nameRu: "Костная структура",
    specific: false,
  };
}
