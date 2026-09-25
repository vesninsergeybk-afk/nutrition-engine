const LAYER_NAMES_RU = Object.freeze({
  skin: "Кожа и наружные покровы",
  subcutaneous: "Подкожная клетчатка",
  fascia: "Фасции и удерживатели",
  tendon: "Сухожилия и апоневрозы",
  ligament: "Связки",
  joint: "Суставные капсулы и сумки",
  cartilage: "Хрящевые структуры",
  other: "Соединительная ткань",
});

const EXACT_TERMS = [
  [/iliotibial tract/i, "Подвздошно-большеберцовый тракт"],
  [/thoracolumbar fascia/i, "Грудопоясничная фасция"],
  [/fascia lata/i, "Широкая фасция бедра"],
  [/brachial fascia/i, "Фасция плеча"],
  [/antebrachial fascia/i, "Фасция предплечья"],
  [/crural fascia/i, "Фасция голени"],
  [/plantar aponeurosis/i, "Подошвенный апоневроз"],
  [/palmar aponeurosis/i, "Ладонный апоневроз"],
  [/flexor retinaculum/i, "Удерживатель сгибателей"],
  [/extensor retinaculum/i, "Удерживатель разгибателей"],
  [/(?:achilles|calcaneal) tendon/i, "Пяточное (ахиллово) сухожилие"],
  [/patellar ligament/i, "Связка надколенника"],
  [/anterior cruciate ligament/i, "Передняя крестообразная связка"],
  [/posterior cruciate ligament/i, "Задняя крестообразная связка"],
  [/medial collateral ligament/i, "Медиальная коллатеральная связка"],
  [/lateral collateral ligament/i, "Латеральная коллатеральная связка"],
  [/coracoacromial ligament/i, "Клювовидно-акромиальная связка"],
  [/acromioclavicular ligament/i, "Акромиально-ключичная связка"],
  [/coracoclavicular ligament/i, "Клювовидно-ключичная связка"],
  [/coracohumeral ligament/i, "Клювовидно-плечевая связка"],
  [/transverse humeral ligament/i, "Поперечная связка плеча"],
  [/superior transverse scapular ligament/i, "Верхняя поперечная связка лопатки"],
  [/inferior transverse scapular ligament/i, "Нижняя поперечная связка лопатки"],
  [/inguinal ligament/i, "Паховая связка"],
  [/sacrotuberous ligament/i, "Крестцово-бугорная связка"],
  [/sacrospinous ligament/i, "Крестцово-остистая связка"],
  [/iliolumbar ligament/i, "Подвздошно-поясничная связка"],
  [/anterior longitudinal ligament/i, "Передняя продольная связка"],
  [/posterior longitudinal ligament/i, "Задняя продольная связка"],
  [/ligamentum flavum|yellow ligament/i, "Жёлтая связка"],
  [/capsule of (?:the )?shoulder joint|shoulder joint capsule/i, "Капсула плечевого сустава"],
  [/subacromial(?:-subdeltoid)? bursa/i, "Подакромиальная сумка"],
  [/subdeltoid bursa/i, "Поддельтовидная сумка"],
  [/subscapular bursa/i, "Подлопаточная сумка"],
  [/olecranon bursa/i, "Локтевая сумка"],
  [/prepatellar bursa/i, "Преднадколенниковая сумка"],
  [/trochanteric bursa/i, "Вертельная сумка"],
  [/articular cartilage/i, "Суставной хрящ"],
  [/subcutaneous tissue|subcutis|hypodermis/i, "Подкожная клетчатка"],
  [/skin|body surface/i, "Кожа"],
];

function sideOf(sourceName) {
  const source = String(sourceName || "");
  if (/\bright\b|\.r$/i.test(source)) return "справа";
  if (/\bleft\b|\.l$/i.test(source)) return "слева";
  return "";
}

function removeSourceSide(sourceName) {
  return String(sourceName || "")
    .replace(/\.(l|r)$/i, "")
    .replace(/\b(right|left)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function studyLayerNameRu(layerKey) {
  return LAYER_NAMES_RU[layerKey] || LAYER_NAMES_RU.other;
}

export function studyStructureTerm(sourceName, layerKey = "other") {
  const source = String(sourceName || "").trim();
  const neutral = removeSourceSide(source);
  const side = sideOf(source);

  for (const [pattern, nameRu] of EXACT_TERMS) {
    if (!pattern.test(neutral)) continue;
    return {
      source,
      nameRu: side ? nameRu + " (" + side + ")" : nameRu,
      specific: true,
      aliases: [source, neutral],
    };
  }

  const fallback = studyLayerNameRu(layerKey);
  return {
    source,
    nameRu: side ? fallback + " (" + side + ")" : fallback,
    specific: false,
    aliases: [source, neutral],
  };
}

export function studyStructureSearchText(sourceName, layerKey) {
  const term = studyStructureTerm(sourceName, layerKey);
  return [term.nameRu, term.source, ...term.aliases]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}
