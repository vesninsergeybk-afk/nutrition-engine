import { supplementalReferenceName } from "./reference-structure-names.js";
const LAYER_RU = Object.freeze({
  nervous: "Нервная структура",
  vascular: "Сосудистая структура",
  lymphatic: "Лимфатическая структура",
  organs: "Внутренний орган",
  joints: "Суставная структура",
});

const LAYER_LABEL_RU = Object.freeze({
  nervous: "Нервная система",
  vascular: "Кровеносные сосуды",
  lymphatic: "Лимфатическая система",
  organs: "Внутренние органы",
  joints: "Суставы и связки",
});

const EXACT = Object.freeze({
  "oesophagus": "Пищевод",
  "trachea": "Трахея",
  "stomach": "Желудок",
  "liver": "Печень",
  "gallbladder": "Жёлчный пузырь",
  "pancreas": "Поджелудочная железа",
  "duodenum": "Двенадцатиперстная кишка",
  "jejunum": "Тощая кишка",
  "ascending colon": "Восходящая ободочная кишка",
  "transverse colon": "Поперечная ободочная кишка",
  "descending colon": "Нисходящая ободочная кишка",
  "sigmoid colon": "Сигмовидная ободочная кишка",
  "vermiform appendix": "Червеобразный отросток",
  "kidney": "Почка",
  "renal pelvis": "Почечная лоханка",
  "ureter": "Мочеточник",
  "urethra": "Мочеиспускательный канал",
  "urinary bladder": "Мочевой пузырь",
  "thyroid gland": "Щитовидная железа",
  "suprarenal gland": "Надпочечник",
  "parotid gland": "Околоушная слюнная железа",
  "submandibular gland": "Поднижнечелюстная слюнная железа",
  "sublingual gland": "Подъязычная слюнная железа",
  "tongue": "Язык",
  "epiglottis": "Надгортанник",
  "superior lobe of left lung": "Верхняя доля левого лёгкого",
  "inferior lobe of left lung": "Нижняя доля левого лёгкого",
  "superior lobe of right lung": "Верхняя доля правого лёгкого",
  "middle lobe of right lung": "Средняя доля правого лёгкого",
  "inferior lobe of right lung": "Нижняя доля правого лёгкого",
  "left main bronchus": "Левый главный бронх",
  "right main bronchus": "Правый главный бронх",
  "bile duct": "Жёлчный проток",
  "pancreatic duct": "Проток поджелудочной железы",
  "prostate": "Предстательная железа",
  "testis": "Яичко",
  "epididymis": "Придаток яичка",
  "spinal ganglion": "Спинномозговой узел",
  "cauda equina": "Конский хвост",
  "anterior root of spinal nerve": "Передний корешок спинномозгового нерва",
  "posterior root of spinal nerve": "Задний корешок спинномозгового нерва",
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
  "dorsal scapular nerve": "Дорсальный нерв лопатки",
  "suprascapular nerve": "Надлопаточный нерв",
  "long thoracic nerve": "Длинный грудной нерв",
  "thoracodorsal nerve": "Грудоспинной нерв",
  "medial pectoral nerve": "Медиальный грудной нерв",
  "lateral pectoral nerve": "Латеральный грудной нерв",
  "intercostobrachial nerve": "Межрёберно-плечевой нерв",
  "medial antebrachial cutaneous nerve": "Медиальный кожный нерв предплечья",
  "lateral antebrachial cutaneous nerve": "Латеральный кожный нерв предплечья",
  "posterior femoral cutaneous nerve": "Задний кожный нерв бедра",
  "lateral femoral cutaneous nerve": "Латеральный кожный нерв бедра",
  "superior gluteal nerve": "Верхний ягодичный нерв",
  "inferior gluteal nerve": "Нижний ягодичный нерв",
  "genitofemoral nerve": "Бедренно-половой нерв",
  "ilioinguinal nerve": "Подвздошно-паховый нерв",
  "iliohypogastric nerve": "Подвздошно-подчревный нерв",
  "saphenous nerve": "Подкожный нерв",
  "medial plantar nerve": "Медиальный подошвенный нерв",
  "lateral plantar nerve": "Латеральный подошвенный нерв",
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
  "vertebral artery": "Позвоночная артерия",
  "facial artery": "Лицевая артерия",
  "occipital artery": "Затылочная артерия",
  "superficial temporal artery": "Поверхностная височная артерия",
  "suprascapular artery": "Надлопаточная артерия",
  "thoracodorsal artery": "Грудоспинная артерия",
  "superior gluteal artery": "Верхняя ягодичная артерия",
  "inferior gluteal artery": "Нижняя ягодичная артерия",
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
  "vertebral vein": "Позвоночная вена",
  "superficial temporal veins": "Поверхностные височные вены",
  "thoracodorsal vein": "Грудоспинная вена",
  "thoracic duct": "Грудной проток",
  "right lymphatic duct": "Правый лимфатический проток",
  "cisterna chyli": "Цистерна грудного протока",
  "anterior axillary nodes": "Передние подмышечные лимфатические узлы",
  "posterior axillary nodes": "Задние подмышечные лимфатические узлы",
  "lateral axillary nodes": "Латеральные подмышечные лимфатические узлы",
  "central axillary nodes": "Центральные подмышечные лимфатические узлы",
  "apical axillary nodes": "Верхушечные подмышечные лимфатические узлы",
  "cubital nodes": "Локтевые лимфатические узлы",
  "superficial popliteal nodes": "Поверхностные подколенные лимфатические узлы",
  "deep popliteal nodes": "Глубокие подколенные лимфатические узлы",
  "supraclavicular nodes": "Надключичные лимфатические узлы",
  "submandibular nodes": "Поднижнечелюстные лимфатические узлы",
  "submental nodes": "Подподбородочные лимфатические узлы",
  "superficial lateral cervical nodes": "Поверхностные латеральные шейные лимфатические узлы",
});

function splitSide(value) {
  const source = String(value || "").trim();
  let side = "";
  let core = source.replace(/_/g, " ")
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
  const unsided = source.replace(/_/g, " ").replace(/\.[lr]$/i, "").replace(/\s+/g, " ").trim();
  // Try the complete anatomical name before removing a leading side word.
  // "Left main bronchus" and liver segment names encode the side themselves.
  const fullExact = EXACT[unsided.toLowerCase()] || supplementalReferenceName(unsided);
  const normalizedCore = core.replace(/\s+\((?:I|V|X)+\)$/i, "").trim().toLowerCase();
  const exact = fullExact || EXACT[normalizedCore] || supplementalReferenceName(core);
  if (exact) {
    const embeddedSide = /^(left|right)\s/i.test(unsided) && Boolean(fullExact);
    const segment = /\((B[IVX]+(?:\+B[IVX]+)?)\)/i.exec(source);
    return {source, nameRu: exact + (segment ? " (" + segment[1].toUpperCase() + ")" : "") + (embeddedSide ? "" : sideSuffix(side)), side, specific: true};
  }

  return {
    source,
    nameRu: "Структура с нерасшифрованным названием" + sideSuffix(side),
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
