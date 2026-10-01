import { BONE_CATALOG } from "./bone-reference-data.js";
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

function legacyBoneTermRu(sourceName) {
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


const SOURCE_ALIASES = Object.freeze({ atlas: "atlas (c1)", axis: "axis (c2)", ethmoid: "ethmoid bone", capitate: "capitate bone", hamate: "hamate bone", lunate: "lunate bone", pisiform: "pisiform bone", scaphoid: "scaphoid bone", trapezium: "trapezium bone", trapezoid: "trapezoid bone", triquetral: "triquetrum bone", "inferior nasal concha": "inferior nasal concha bone" });

export function boneTermRu(sourceName) {
  const source = String(sourceName || "").trim();
  let name = source.replace(/_/g, " ").toLowerCase();
  let side = "";
  const suffix = name.match(/\.([lr])$/);
  if (suffix) { side = suffix[1] === "l" ? "left" : "right"; name = name.slice(0, -2); }
  const leading = extractLeadingSide(name);
  if (leading) { side = leading.side; name = leading.rest; }
  function result(canonicalKey, nameRu = BONE_CATALOG[canonicalKey]?.nameRu, extra = {}) {
    return { source, nameRu: withSide(nameRu, side), canonicalKey, kindRu: BONE_CATALOG[canonicalKey]?.kindRu || "Кость", specific: true, ...extra };
  }
  const key = SOURCE_ALIASES[name] || name;
  if (BONE_CATALOG[key]) return result(key);
  const vertebra = name.match(/^vertebra ([ctl])(\d+)$/);
  if (vertebra) {
    const region = { c: "шейный", t: "грудной", l: "поясничный" }[vertebra[1]];
    const family = { c: "cervical", t: "thoracic", l: "lumbar" }[vertebra[1]];
    return result("vertebra " + family, vertebra[1].toUpperCase() + vertebra[2] + " — " + region + " позвонок");
  }
  const rib = name.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) rib$/);
  if (rib) return result("rib", ORDINAL_ROMAN[rib[1]] + " ребро", { ribNumber: Object.keys(ORDINAL_ROMAN).indexOf(rib[1]) + 1 });
  const cartilage = name.match(/^costal cartilage of (\w+) rib$/);
  if (cartilage && ORDINAL_ROMAN[cartilage[1]]) return result("costal cartilage", "Рёберный хрящ " + ORDINAL_ROMAN[cartilage[1]] + " ребра");
  const metacarpal = name.match(/^(first|second|third|fourth|fifth) (metacarpal|metatarsal) bone$/);
  if (metacarpal) return result(metacarpal[2], ORDINAL_ROMAN[metacarpal[1]] + " " + BONE_CATALOG[metacarpal[2]].nameRu.toLowerCase());
  const phalanx = name.match(/^(proximal|middle|distal) phalanx of (first|second|third|fourth|fifth) finger of (hand|foot)$/);
  if (phalanx) return result("phalanx " + phalanx[3], PHALANX_RU[phalanx[1]] + " " + ORDINAL_ROMAN[phalanx[2]] + " пальца " + (phalanx[3] === "hand" ? "кисти" : "стопы"));
  const tooth = name.match(/^(upper|lower) (canine|(?:first|second) premolar|(?:first|second) molar tooth|(?:lateral|medial) incisor)$/);
  if (tooth) {
    const kind = tooth[2].includes("incisor") ? "incisor" : tooth[2].includes("premolar") ? "premolar" : tooth[2].includes("molar") ? "molar" : "canine";
    const prefix = tooth[2].includes("medial") ? "Центральный резец" : tooth[2].includes("lateral") ? "Боковой резец" : (tooth[2].startsWith("first") ? "I " : tooth[2].startsWith("second") ? "II " : "") + BONE_CATALOG[kind].nameRu.toLowerCase();
    return result(kind, prefix.charAt(0).toUpperCase() + prefix.slice(1) + (tooth[1] === "upper" ? " верхней челюсти" : " нижней челюсти"));
  }
  const legacy = legacyBoneTermRu(source);
  if (legacy.specific) {
    let canonicalKey = Object.keys(BONE_CATALOG).find(k => BONE_CATALOG[k].nameRu === legacy.nameRu.replace(/ \(.*\)$/, ""));
    if (/phalanx/.test(name)) canonicalKey = /toe/.test(name) ? "phalanx foot" : "phalanx hand";
    if (/navicular bone of/.test(name)) canonicalKey = "navicular bone";
    if (/sesamoid bone of/.test(name)) canonicalKey = "sesamoid bones of foot";
    const v = name.match(/(cervical|thoracic|lumbar) vertebra$/);
    if (v) canonicalKey = "vertebra " + v[1];
    return { ...legacy, canonicalKey, kindRu: "Кость" };
  }
  return { ...legacy, kindRu: "Структура скелета" };
}
