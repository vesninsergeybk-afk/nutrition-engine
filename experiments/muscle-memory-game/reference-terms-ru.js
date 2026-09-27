const LAYER_RU = Object.freeze({
  nervous: "Нервная структура",
  vascular: "Сосудистая структура",
  lymphatic: "Лимфатическая структура",
});

const LAYER_LABEL_RU = Object.freeze({
  nervous: "Нервная система",
  vascular: "Кровеносные сосуды",
  lymphatic: "Лимфатическая система",
});

const EXACT = Object.freeze({
  "brachial plexus": "Плечевое сплетение",
  "cervical plexus": "Шейное сплетение",
  "lumbosacral plexus": "Пояснично-крестцовое сплетение",
  "axillary nerve": "Подмышечный нерв",
  "musculocutaneous nerve": "Мышечно-кожный нерв",
  "median nerve": "Срединный нерв",
  "ulnar nerve": "Локтевой нерв",
  "radial nerve": "Лучевой нерв",
  "sciatic nerve": "Седалищный нерв",
  "femoral nerve": "Бедренный нерв",
  "obturator nerve": "Запирательный нерв",
  "tibial nerve": "Большеберцовый нерв",
  "common fibular nerve": "Общий малоберцовый нерв",
  "common peroneal nerve": "Общий малоберцовый нерв",
  "superficial fibular nerve": "Поверхностный малоберцовый нерв",
  "deep fibular nerve": "Глубокий малоберцовый нерв",
  "pudendal nerve": "Половой нерв",
  "phrenic nerve": "Диафрагмальный нерв",
  "vagus nerve": "Блуждающий нерв",
  "facial nerve": "Лицевой нерв",
  "trigeminal nerve": "Тройничный нерв",
  "optic nerve": "Зрительный нерв",
  "oculomotor nerve": "Глазодвигательный нерв",
  "trochlear nerve": "Блоковый нерв",
  "abducens nerve": "Отводящий нерв",
  "accessory nerve": "Добавочный нерв",
  "hypoglossal nerve": "Подъязычный нерв",
  "aorta": "Аорта",
  "ascending aorta": "Восходящая аорта",
  "descending aorta": "Нисходящая аорта",
  "aortic arch": "Дуга аорты",
  "pulmonary trunk": "Лёгочный ствол",
  "brachiocephalic trunk": "Плечеголовной ствол",
  "common carotid artery": "Общая сонная артерия",
  "internal carotid artery": "Внутренняя сонная артерия",
  "external carotid artery": "Наружная сонная артерия",
  "subclavian artery": "Подключичная артерия",
  "axillary artery": "Подмышечная артерия",
  "brachial artery": "Плечевая артерия",
  "radial artery": "Лучевая артерия",
  "ulnar artery": "Локтевая артерия",
  "common iliac artery": "Общая подвздошная артерия",
  "internal iliac artery": "Внутренняя подвздошная артерия",
  "external iliac artery": "Наружная подвздошная артерия",
  "femoral artery": "Бедренная артерия",
  "popliteal artery": "Подколенная артерия",
  "anterior tibial artery": "Передняя большеберцовая артерия",
  "posterior tibial artery": "Задняя большеберцовая артерия",
  "fibular artery": "Малоберцовая артерия",
  "peroneal artery": "Малоберцовая артерия",
  "dorsalis pedis artery": "Тыльная артерия стопы",
  "superior vena cava": "Верхняя полая вена",
  "inferior vena cava": "Нижняя полая вена",
  "internal jugular vein": "Внутренняя яремная вена",
  "external jugular vein": "Наружная яремная вена",
  "subclavian vein": "Подключичная вена",
  "axillary vein": "Подмышечная вена",
  "brachial vein": "Плечевая вена",
  "femoral vein": "Бедренная вена",
  "popliteal vein": "Подколенная вена",
  "great saphenous vein": "Большая подкожная вена",
  "small saphenous vein": "Малая подкожная вена",
  "thoracic duct": "Грудной проток",
  "right lymphatic duct": "Правый лимфатический проток",
  "cisterna chyli": "Цистерна грудного протока",
});

function splitSide(value) {
  const source = String(value || "").trim();
  let side = "";
  let core = source
    .replace(/\.(?:l|r)$/i, (match) => {
      side = match.toLocaleLowerCase("en-US") === ".l" ? "left" : "right";
      return "";
    })
    .trim();

  const leading = core.match(/^(left|right)\s+(.+)$/i);
  if (leading) {
    side = leading[1].toLocaleLowerCase("en-US");
    core = leading[2].trim();
  }
  return { source, core, side };
}

function sideSuffix(side) {
  return side === "left" ? " (слева)" : side === "right" ? " (справа)" : "";
}

export function referenceLayerNameRu(layerKey) {
  return LAYER_LABEL_RU[layerKey] || "Анатомический ориентир";
}

export function referenceStructureTerm(sourceName, layerKey) {
  const { source, core, side } = splitSide(sourceName);
  const exact = EXACT[core.toLocaleLowerCase("en-US")];
  if (exact) {
    return {
      source,
      nameRu: exact + sideSuffix(side),
      specific: true,
    };
  }

  return {
    source,
    nameRu: (LAYER_RU[layerKey] || "Анатомический ориентир") + sideSuffix(side),
    specific: false,
  };
}

export function referenceStructureSearchText(sourceName, layerKey) {
  const term = referenceStructureTerm(sourceName, layerKey);
  return [term.nameRu, term.source, referenceLayerNameRu(layerKey)]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}
