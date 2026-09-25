import { structureTerm } from "./anatomy-terms-ru.js";
import { bodyPartsMuscleNameRu } from "./bodyparts4-muscles-ru.js";

export const LEARNING_SKILLS = Object.freeze({
  find: {
    id: "find",
    nameRu: "Найти на модели",
    descriptionRu: "По названию найти структуру на 3D-модели.",
  },
  name: {
    id: "name",
    nameRu: "Назвать структуру",
    descriptionRu: "По выделенной структуре вспомнить её название.",
  },
});

export const LEARNING_REGIONS = Object.freeze([
  { id: "all", nameRu: "Всё тело" },
  { id: "head-neck", nameRu: "Голова и шея" },
  { id: "shoulder", nameRu: "Плечевой пояс" },
  { id: "arm", nameRu: "Плечо" },
  { id: "forearm-hand", nameRu: "Предплечье и кисть" },
  { id: "thorax", nameRu: "Грудная клетка" },
  { id: "back", nameRu: "Спина" },
  { id: "abdomen", nameRu: "Живот" },
  { id: "pelvis", nameRu: "Таз и промежность" },
  { id: "gluteal", nameRu: "Ягодичная область" },
  { id: "thigh", nameRu: "Бедро" },
  { id: "leg-foot", nameRu: "Голень и стопа" },
  { id: "heart", nameRu: "Сердце" },
  { id: "other", nameRu: "Другие мышцы" },
]);

const REGION_BY_ID = new Map(LEARNING_REGIONS.map((region) => [region.id, region]));
const STORAGE_KEY = "muscle-memory-learning-v1";
const STORE_VERSION = 1;

function normalizeSource(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\.(l|r)$/i, "")
    .replace(/\b(right|left)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRussianSide(value) {
  return String(value || "")
    .replace(/\s*\((?:справа|слева)\)\s*$/iu, "")
    .replace(/^(?:правая|левая)\s+/iu, "")
    .replace(
      /\b(?:прав(?:ая|ой|ую|ого|ому|ым|ом)|лев(?:ая|ой|ую|ого|ому|ым|ом))\b/giu,
      ""
    )
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function neutralSourceName(value) {
  return String(value || "")
    .trim()
    .replace(/\.(l|r)$/i, "")
    .replace(/\b(right|left)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalRussianName(sourceName) {
  const neutralSource = neutralSourceName(sourceName);
  const neutralTranslation = bodyPartsMuscleNameRu(neutralSource);
  if (neutralTranslation) return stripRussianSide(neutralTranslation);

  return stripRussianSide(structureTerm(sourceName).nameRu || sourceName);
}

function baseRussianName(value) {
  return stripRussianSide(value);
}

function stableIdFromRussian(nameRu) {
  const slug = baseRussianName(nameRu)
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, "-")
    .replace(/^-+|-+$/g, "");
  return "muscle:" + slug;
}

function has(text, re) {
  return re.test(text);
}

export function inferMuscleRegion(sourceName, nameRu = "") {
  const source = normalizeSource(sourceName);
  const ru = baseRussianName(nameRu).toLocaleLowerCase("ru-RU");
  const text = source + " " + ru;

  if (has(text, /papillary muscle|сосочков.*мышц/u)) return "heart";

  if (
    has(
      text,
      /frontalis|occipitalis|temporalis|temporoparietalis|masseter|pterygoid|bucinator|buccinator|zygomatic|orbicularis|corrugator|procerus|nasalis|mentalis|risorius|depressor|levator (?:anguli|labii|palpebrae|nasolabialis)|rectus capitis|rectus (?:anterior|lateralis|posterior (?:major|minor)) capitis|obliquus capitis|obliquus (?:inferior|superior) capitis|longus capitis|longus colli|splenius capitis|splenius cervicis|splenius colli|semispinalis capitis|semispinalis cervicis|semispinalis colli|spinalis capitis|spinalis colli|longissimus capitis|longissimus cervicis|longissimus colli|iliocostalis cervicis|iliocostalis colli|sternocleidomastoid|scalenus|platysma|digastric|mylohyoid|geniohyoid|genioglossus|hyoglossus|stylohyoid|omohyoid|sternohyoid|sternothyroid|thyrohyoid|pharyngeal|pharyngeus|arytenoid|aryepiglotticus|crico|thyro-arytenoid|thyroarytenoid|vocalis|palatini|uvular|intertransversarii cervicis|cervical intertransversarii|interspinales cervicis|multifidus colli|superior rectus|inferior rectus|medial rectus|lateral rectus|superior oblique|inferior oblique|глаз|глот|гортан|языч|подъязыч|жеватель|прямая мышца головы|косая мышца головы|длиннейшая мышца шеи|межостистые мышцы шеи|подвздошно-р[её]берная мышца шеи|ременная мышца шеи|крыловид|скулов|круговая мышца рта|круговая мышца глаза/u
    )
  ) return "head-neck";

  if (
    has(
      text,
      /deltoid|supraspinatus|infraspinatus|subscapularis|teres major|teres minor|levator scapulae|rhomboid|trapezius|serratus anterior|pectoralis minor|subclavius|дельтовид|надостн|подостн|подлопаточ|кругл.*мышц|поднимающ.*лопат|ромбовид|трапециевид|передн.*зубчат|малая грудная|подключич/u
    )
  ) return "shoulder";

  if (
    has(
      text,
      /biceps brachii|triceps brachii|brachialis|coracobrachialis|anconeus|двуглав.*плеч|тр[её]хглав.*плеч|плечевая мышца|клювовидно-плеч|локтевая мышца/u
    )
  ) return "arm";

  if (
    has(
      text,
      /brachioradialis|pronator|supinator|carpi|palmaris|pollicis|indicis|digiti minimi(?: brevis)? of hand|extensor digiti minimi|digitorum profundus|digitorum superficialis|extensor digitorum(?! longus| brevis)|lumbrical.*hand|interossei.*hand|palmar interossei|opponens.*hand|adductor pollicis|сгибател.*запяст|разгибател.*запяст|пронатор|супинатор|плечелучев|ладонн|кисти|больш.*палец кист|указательн.*пальц/u
    )
  ) return "forearm-hand";

  if (
    has(
      text,
      /pectoralis major|intercostal|transversus thoracis|diaphragm|грудн.*мышц|межр[её]бер|поперечная мышца груди|диафрагм/u
    )
  ) return "thorax";

  if (
    has(
      text,
      /latissimus|iliocostalis (?:thoracis|lumborum)|longissimus thoracis|spinalis(?: thoracis)?|multifidus (?:thoracis|lumborum)|rotator|rotatores|interspinalis thoracis|interspinales thoracis|interspinales lumborum|intertransversarius|intertransversarii lumborum|quadratus lumborum|serratus posterior|levatores costarum|широчайш|подвздошно-р[её]бер.*(?:груди|поясниц)|длиннейш.*груди|остист.*груди|многораздель|вращател.*(?:груд|пояс)|межостист.*(?:груд|пояс)|межпопереч.*пояс|квадратная мышца поясницы|задн.*зубчат|поднимающ.*р[её]бр/u
    )
  ) return "back";

  if (
    has(
      text,
      /rectus abdominis|external (?:abdominal )?oblique|internal (?:abdominal )?oblique|transversus abdominis|pyramidalis|прямая мышца живота|косая мышца живота|поперечная мышца живота|пирамидальная мышца/u
    )
  ) return "abdomen";

  if (
    has(
      text,
      /coccygeus|iliococcygeus|pubococcygeus|puborectalis|pubo-analis|superficial perineal|external anal sphincter|копчиков|лобково-копчиков|лобково-прямокиш|лобково-аналь|промежност|сфинктер заднего прохода/u
    )
  ) return "pelvis";

  if (
    has(
      text,
      /gluteus|piriformis|gemellus|obturator|quadratus femoris|ягодич|грушевид|близнецов|запирательн|квадратная мышца бедра/u
    )
  ) return "gluteal";

  if (
    has(
      text,
      /adductor (?:brevis|longus|magnus|minimus)|pectineus|gracilis|sartorius|rectus femoris|vastus|biceps femoris|semimembranosus|semitendinosus|iliacus|psoas major|приводящ.*мышц|гребенчат|тонкая мышца|портняж|прямая мышца бедра|широкая мышца бедра|двуглав.*бедра|полуперепончат|полусухожиль|подвздошная мышца|поясничная мышца/u
    )
  ) return "thigh";

  if (
    has(
      text,
      /gastrocnemius|soleus|plantaris|popliteus|tibialis|fibularis|hallucis|digitorum longus|digitorum brevis|digiti minimi(?: brevis)? of foot|lumbrical.*foot|interossei.*foot|plantar interossei|plantar interosseous.*foot|opponens.*foot|abductor.*foot|quadratus plantae|flexor accessorius|икронож|камбаловид|подошвен|подколенн|большеберцов|малоберцов|палец стопы|пальцев стопы|мизинец стопы|межкостн.*стоп|червеобразн.*стоп|квадратная мышца подошвы/u
    )
  ) return "leg-foot";

  return "other";
}

function makeTarget(group) {
  const first = group.items[0];
  return {
    id: group.id,
    nameRu: group.nameRu,
    region: group.region,
    sids: group.items.map((item) => item.sid),
    sourceNames: group.items.map((item) => item.sourceName),
    skillIds: ["find", "name"],
  };
}

export function buildMuscleCatalog(structureNames) {
  const grouped = new Map();

  (structureNames || []).forEach((sourceName, sid) => {
    const nameRu = canonicalRussianName(sourceName);
    const id = stableIdFromRussian(nameRu);
    const region = inferMuscleRegion(sourceName, nameRu);

    if (!grouped.has(id)) {
      grouped.set(id, { id, nameRu, region, items: [] });
    }

    const group = grouped.get(id);
    group.items.push({
      sid,
      sourceName,
      side: /\bright\b|\.r$/i.test(sourceName)
        ? "right"
        : /\bleft\b|\.l$/i.test(sourceName)
          ? "left"
          : null,
    });

    if (group.region === "other" && region !== "other") group.region = region;
  });

  return [...grouped.values()]
    .map(makeTarget)
    .sort((a, b) => a.nameRu.localeCompare(b.nameRu, "ru"));
}

export function filterCatalogByRegion(catalog, regionId) {
  if (!regionId || regionId === "all") return [...(catalog || [])];
  return (catalog || []).filter((item) => item.region === regionId);
}

export function regionCounts(catalog) {
  const counts = Object.fromEntries(LEARNING_REGIONS.map((region) => [region.id, 0]));
  for (const item of catalog || []) {
    counts.all += 1;
    counts[item.region] = (counts[item.region] || 0) + 1;
  }
  return counts;
}

export function regionNameRu(regionId) {
  return REGION_BY_ID.get(regionId)?.nameRu || "Другие мышцы";
}

function emptyStore() {
  return {
    version: STORE_VERSION,
    updatedAt: 0,
    records: {},
  };
}

export function loadLearningStore(storage = globalThis.localStorage) {
  if (!storage) return emptyStore();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORE_VERSION || typeof parsed.records !== "object") {
      return emptyStore();
    }
    return {
      version: STORE_VERSION,
      updatedAt: Number(parsed.updatedAt) || 0,
      records: parsed.records || {},
    };
  } catch {
    return emptyStore();
  }
}

export function saveLearningStore(store, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    store.updatedAt = Date.now();
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Прогресс не должен ломать тренировку, если storage недоступен.
  }
}

export function skillRecord(store, muscleId, skillId) {
  const key = muscleId + "::" + skillId;
  return store.records[key] || {
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastSeen: 0,
  };
}

export function recordLearningAttempt(
  store,
  muscleId,
  skillId,
  wasCorrect,
  storage = globalThis.localStorage
) {
  const key = muscleId + "::" + skillId;
  const current = skillRecord(store, muscleId, skillId);
  store.records[key] = {
    attempts: current.attempts + 1,
    correct: current.correct + (wasCorrect ? 1 : 0),
    wrong: current.wrong + (wasCorrect ? 0 : 1),
    lastSeen: Date.now(),
  };
  saveLearningStore(store, storage);
  return store.records[key];
}

export function learningSummary(store, catalog, skillId = "find") {
  let attempts = 0;
  let correct = 0;
  let wrong = 0;
  let touched = 0;

  for (const muscle of catalog || []) {
    const record = skillRecord(store, muscle.id, skillId);
    attempts += record.attempts;
    correct += record.correct;
    wrong += record.wrong;
    if (record.attempts > 0) touched += 1;
  }

  return {
    muscles: (catalog || []).length,
    touched,
    attempts,
    correct,
    wrong,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
  };
}

export function resetLearningStore(storage = globalThis.localStorage) {
  const store = emptyStore();
  saveLearningStore(store, storage);
  return store;
}
