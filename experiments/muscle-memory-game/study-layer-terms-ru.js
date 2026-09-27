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


const ORDINAL_ROMAN = Object.freeze({
  first: "I",
  second: "II",
  third: "III",
  fourth: "IV",
  fifth: "V",
  sixth: "VI",
  seventh: "VII",
});

function sideSuffix(side) {
  return side === "right" ? " (справа)" : side === "left" ? " (слева)" : "";
}

function bodyPartsSpecificTerm(sourceName) {
  const source = String(sourceName || "").trim();
  const lower = source.toLocaleLowerCase("en-US");

  const simple = new Map([
    ["skin", "Кожа"],
    ["eyebrow", "Бровь"],
    ["hair of head", "Волосы головы"],
    ["lip", "Губа"],
    ["pubic hair", "Лобковые волосы"],
    ["cricoid cartilage", "Перстневидный хрящ"],
    ["hyo-epiglottic ligament", "Подъязычно-надгортанная связка"],
    ["linea alba", "Белая линия живота"],
    ["median cricothyroid ligament", "Срединная перстнещитовидная связка"],
    ["median thyrohyoid ligament", "Срединная щитоподъязычная связка"],
    ["pharyngeal raphe", "Глоточный шов"],
    ["septal nasal cartilage", "Хрящ перегородки носа"],
    ["tendinous arch of levator ani", "Сухожильная дуга мышцы, поднимающей задний проход"],
    ["thyro-epiglottic ligament", "Щитонадгортанная связка"],
    ["thyroid cartilage", "Щитовидный хрящ"],
  ]);
  if (simple.has(lower)) {
    return { source, nameRu: simple.get(lower), specific: true, aliases: [source] };
  }

  let m = source.match(
    /^Branch of (left|right) anterior choroidal artery to posterior limb of (?:left|right) internal capsule$/i
  );
  if (m) {
    return {
      source,
      nameRu:
        "Ветвь передней ворсинчатой артерии к задней ножке внутренней капсулы" +
        sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  m = source.match(/^Check ligament of (left|right) (lateral|medial) rectus$/i);
  if (m) {
    return {
      source,
      nameRu:
        "Ограничительная связка " +
        (m[2].toLocaleLowerCase("en-US") === "lateral"
          ? "латеральной"
          : "медиальной") +
        " прямой мышцы глаза" +
        sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  m = source.match(/^Flexor retinaculum of (left|right) wrist$/i);
  if (m) {
    return {
      source,
      nameRu: "Удерживатель сгибателей кисти" + sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  m = source.match(/^Interosseous membrane of (left|right) (forearm|leg)$/i);
  if (m) {
    return {
      source,
      nameRu:
        "Межкостная перепонка " +
        (m[2].toLocaleLowerCase("en-US") === "forearm" ? "предплечья" : "голени") +
        sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  m = source.match(/^(Left|Right) (.+)$/i);
  if (m) {
    const side = m[1].toLocaleLowerCase("en-US");
    const rest = m[2].toLocaleLowerCase("en-US");

    const sideTerms = new Map([
      ["arytenoid cartilage", "Черпаловидный хрящ"],
      ["calcaneal tendon", "Пяточное (ахиллово) сухожилие"],
      ["conus elasticus", "Эластический конус гортани"],
      ["corniculate cartilage", "Рожковидный хрящ"],
      ["cuneiform cartilage", "Клиновидный хрящ гортани"],
      ["iliotibial tract", "Подвздошно-большеберцовый тракт"],
      ["internal capsule", "Внутренняя капсула"],
      ["lateral nasal cartilage", "Латеральный хрящ носа"],
      ["lateral thyrohyoid ligament", "Латеральная щитоподъязычная связка"],
      ["long plantar ligament", "Длинная подошвенная связка"],
      ["major alar cartilage", "Большой хрящ крыла носа"],
      ["pterygomandibular raphe", "Крыловидно-нижнечелюстной шов"],
      ["stylohyoid ligament", "Шилоподъязычная связка"],
      ["thyrohyoid membrane", "Щитоподъязычная мембрана"],
      ["vocal ligament", "Голосовая связка"],
      ["intermediate tendon", "Промежуточное сухожилие"],
    ]);

    if (sideTerms.has(rest)) {
      return {
        source,
        nameRu: sideTerms.get(rest) + sideSuffix(side),
        specific: true,
        aliases: [source],
      };
    }

    const costal = rest.match(
      /^(first|second|third|fourth|fifth|sixth|seventh) costal cartilage$/
    );
    if (costal) {
      return {
        source,
        nameRu:
          ORDINAL_ROMAN[costal[1]] +
          " рёберный хрящ" +
          sideSuffix(side),
        specific: true,
        aliases: [source],
      };
    }
  }

  m = source.match(/^Suspensory ligament of (left|right) lens$/i);
  if (m) {
    return {
      source,
      nameRu: "Циннова связка хрусталика" + sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  m = source.match(/^Tendon of (left|right) levator palpebrae superioris$/i);
  if (m) {
    return {
      source,
      nameRu:
        "Сухожилие мышцы, поднимающей верхнее веко" +
        sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  m = source.match(/^Trochlea of (left|right) superior oblique$/i);
  if (m) {
    return {
      source,
      nameRu:
        "Блок верхней косой мышцы глаза" +
        sideSuffix(m[1].toLocaleLowerCase("en-US")),
      specific: true,
      aliases: [source],
    };
  }

  return null;
}

export function studyLayerNameRu(layerKey) {
  return LAYER_NAMES_RU[layerKey] || LAYER_NAMES_RU.other;
}

export function studyStructureTerm(sourceName, layerKey = "other") {
  const source = String(sourceName || "").trim();
  const specificBodyPartsTerm = bodyPartsSpecificTerm(source);
  if (specificBodyPartsTerm) return specificBodyPartsTerm;

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
