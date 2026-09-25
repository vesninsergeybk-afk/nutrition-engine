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

// Course-facing scopes are filters over the stable muscle catalog, not new
// muscle identities. A learner can move between a regional lesson, a whole
// limb and the full atlas without fragmenting progress for the same muscle.
export const LEARNING_SCOPES = Object.freeze([
  {
    id: "all",
    nameRu: "Всё тело",
    descriptionRu: "Все доступные мышечные цели.",
    regionIds: ["all"],
  },
  {
    id: "shoulder",
    nameRu: "Плечевой пояс",
    descriptionRu: "Мышцы плечевого пояса и лопаточного комплекса.",
    regionIds: ["shoulder"],
  },
  {
    id: "upper-limb",
    nameRu: "Верхняя конечность",
    descriptionRu: "Плечевой пояс, плечо, предплечье и кисть.",
    regionIds: ["shoulder", "arm", "forearm-hand"],
  },
  {
    id: "lower-limb",
    nameRu: "Нижняя конечность",
    descriptionRu: "Ягодичная область, бедро, голень и стопа.",
    regionIds: ["gluteal", "thigh", "leg-foot"],
  },
  {
    id: "neck-collar",
    nameRu: "Шейно-воротниковая зона",
    descriptionRu: "Мышцы шеи, подзатылочной области и лопаточно-шейного перехода.",
    match: "neck-collar",
  },
  {
    id: "foot",
    nameRu: "Стопа",
    descriptionRu: "Собственные мышцы тыла и подошвы стопы.",
    match: "foot",
  },
  {
    id: "erector-spinae",
    nameRu: "Мышца, выпрямляющая позвоночник",
    descriptionRu: "Подвздошно-рёберная, длиннейшая и остистая части комплекса.",
    match: "erector-spinae",
  },
  {
    id: "rotator-cuff",
    nameRu: "Ротаторная манжета плеча",
    descriptionRu: "Надостная, подостная, подлопаточная и малая круглая мышцы.",
    match: "rotator-cuff",
  },
  {
    id: "scapular-stabilizers",
    nameRu: "Лопаточный комплекс",
    descriptionRu: "Трапециевидная, ромбовидные, передняя зубчатая и мышца, поднимающая лопатку.",
    match: "scapular-stabilizers",
  },
]);

const REGION_BY_ID = new Map(LEARNING_REGIONS.map((region) => [region.id, region]));
const SCOPE_BY_ID = new Map(LEARNING_SCOPES.map((scope) => [scope.id, scope]));
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
  const RIGHT_VENTRICLE = "__RIGHT_VENTRICLE__";
  const LEFT_VENTRICLE = "__LEFT_VENTRICLE__";

  return String(value || "")
    .replace(/правого желудочка/giu, RIGHT_VENTRICLE)
    .replace(/левого желудочка/giu, LEFT_VENTRICLE)
    .replace(/\s*\((?:справа|слева)\)\s*$/iu, "")
    .replace(/^(?:правая|левая)\s+/iu, "")
    .replace(
      /\b(?:прав(?:ая|ой|ую|ого|ому|ым|ом)|лев(?:ая|ой|ую|ого|ому|ым|ом))\b/giu,
      ""
    )
    .replace(new RegExp(RIGHT_VENTRICLE, "g"), "правого желудочка")
    .replace(new RegExp(LEFT_VENTRICLE, "g"), "левого желудочка")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function neutralSourceName(value) {
  const RIGHT_VENTRICLE = "__right_ventricle__";
  const LEFT_VENTRICLE = "__left_ventricle__";

  return String(value || "")
    .trim()
    .replace(/\bright ventricle\b/gi, RIGHT_VENTRICLE)
    .replace(/\bleft ventricle\b/gi, LEFT_VENTRICLE)
    .replace(/\.(l|r)$/i, "")
    .replace(/\b(right|left)\b/gi, "")
    .replace(new RegExp(RIGHT_VENTRICLE, "g"), "right ventricle")
    .replace(new RegExp(LEFT_VENTRICLE, "g"), "left ventricle")
    .replace(/\s+/g, " ")
    .trim();
}

export function learningConceptSourceName(sourceName) {
  const neutral = neutralSourceName(sourceName);
  const subdivision = neutral.match(
    /^(?:.+?\s+)?(?:part|head|belly) of (.+)$/i
  );

  if (!subdivision) return neutral;

  const parent = subdivision[1].trim();
  const translatedParent =
    bodyPartsMuscleNameRu(parent) || structureTerm(parent).nameRu || "";

  // Only collapse a subdivision when the parent muscle itself has a known
  // user-facing Russian name. Atlas mode still keeps the exact source mesh;
  // this grouping affects the learning concept, not anatomical exploration.
  if (
    translatedParent &&
    translatedParent !== parent &&
    /[А-Яа-яЁё]/u.test(translatedParent)
  ) {
    return parent;
  }

  return neutral;
}

function detailedRussianName(sourceName) {
  const neutralSource = neutralSourceName(sourceName);
  const neutralTranslation = bodyPartsMuscleNameRu(neutralSource);
  if (neutralTranslation) return stripRussianSide(neutralTranslation);

  return stripRussianSide(structureTerm(sourceName).nameRu || sourceName);
}

function canonicalRussianName(sourceName) {
  const conceptSource = learningConceptSourceName(sourceName);
  const neutralTranslation = bodyPartsMuscleNameRu(conceptSource);
  if (neutralTranslation) return stripRussianSide(neutralTranslation);

  return stripRussianSide(structureTerm(conceptSource).nameRu || sourceName);
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
  const legacyIds = [
    ...new Set(
      group.items
        .map((item) => item.legacyId)
        .filter((id) => id && id !== group.id)
    ),
  ];

  const sidsBySide = {
    right: group.items.filter((item) => item.side === "right").map((item) => item.sid),
    left: group.items.filter((item) => item.side === "left").map((item) => item.sid),
    midline: group.items.filter((item) => !item.side).map((item) => item.sid),
  };

  return {
    id: group.id,
    nameRu: group.nameRu,
    region: group.region,
    sids: group.items.map((item) => item.sid),
    sourceNames: group.items.map((item) => item.sourceName),
    sidsBySide,
    legacyIds,
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
      legacyId: stableIdFromRussian(detailedRussianName(sourceName)),
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

function positiveMin(values) {
  const positive = values
    .map((value) => Number(value) || 0)
    .filter((value) => value > 0);
  return positive.length ? Math.min(...positive) : 0;
}

function mergeProgressRecords(records) {
  const items = (records || []).filter(Boolean);
  if (!items.length) return {};

  const latest = [...items].sort(
    (a, b) =>
      Math.max(Number(b.lastReviewedAt) || 0, Number(b.lastSeen) || 0) -
      Math.max(Number(a.lastReviewedAt) || 0, Number(a.lastSeen) || 0)
  )[0];

  const reviewed = items.filter((item) => (Number(item.reviewCount) || 0) > 0);
  const cleanStreak = reviewed.length
    ? Math.min(...reviewed.map((item) => Math.max(0, Number(item.cleanStreak) || 0)))
    : 0;

  return {
    ...latest,
    attempts: items.reduce((sum, item) => sum + (Number(item.attempts) || 0), 0),
    correct: items.reduce((sum, item) => sum + (Number(item.correct) || 0), 0),
    wrong: items.reduce((sum, item) => sum + (Number(item.wrong) || 0), 0),
    lastSeen: Math.max(...items.map((item) => Number(item.lastSeen) || 0)),
    reviewDebt: Math.max(...items.map((item) => Number(item.reviewDebt) || 0)),
    reviewCount: items.reduce((sum, item) => sum + (Number(item.reviewCount) || 0), 0),
    cleanStreak,
    lapses: items.reduce((sum, item) => sum + (Number(item.lapses) || 0), 0),
    stabilityDays: positiveMin(items.map((item) => item.stabilityDays)),
    lastReviewedAt: Math.max(
      ...items.map((item) => Number(item.lastReviewedAt) || 0)
    ),
    dueAt: positiveMin(items.map((item) => item.dueAt)),
    lastOutcome: latest?.lastOutcome || null,
  };
}

export function migrateLearningStoreAliases(
  store,
  catalog,
  storage = globalThis.localStorage
) {
  if (!store || !Array.isArray(catalog)) return false;

  const aliasToCanonical = new Map();
  for (const target of catalog) {
    for (const legacyId of target.legacyIds || []) {
      if (legacyId && legacyId !== target.id) {
        aliasToCanonical.set(legacyId, target.id);
      }
    }
  }

  if (!aliasToCanonical.size) return false;
  let changed = false;

  for (const target of catalog) {
    const ids = [target.id, ...(target.legacyIds || [])];

    for (const skillId of target.skillIds || ["find", "name"]) {
      const keys = ids.map((id) => id + "::" + skillId);
      const existing = keys
        .map((key) => ({ key, record: store.records?.[key] }))
        .filter((item) => item.record);

      const legacyExisting = existing.filter(
        (item) => item.key !== target.id + "::" + skillId
      );
      if (!legacyExisting.length) continue;

      if (!store.records || typeof store.records !== "object") store.records = {};
      const merged = mergeProgressRecords(existing.map((item) => item.record));
      for (const item of existing) delete store.records[item.key];
      store.records[target.id + "::" + skillId] = merged;
      changed = true;
    }
  }

  if (store.confusions && typeof store.confusions === "object") {
    const migrated = {};

    for (const entry of Object.values(store.confusions)) {
      if (!entry) continue;
      const expectedMuscleId =
        aliasToCanonical.get(entry.expectedMuscleId) || entry.expectedMuscleId;
      const chosenMuscleId =
        aliasToCanonical.get(entry.chosenMuscleId) || entry.chosenMuscleId;

      if (!expectedMuscleId || !chosenMuscleId || expectedMuscleId === chosenMuscleId) {
        if (
          expectedMuscleId !== entry.expectedMuscleId ||
          chosenMuscleId !== entry.chosenMuscleId
        ) changed = true;
        continue;
      }

      const key = [entry.skillId, expectedMuscleId, chosenMuscleId].join("::");
      const current = migrated[key];

      migrated[key] = current
        ? {
            ...current,
            count: (Number(current.count) || 0) + (Number(entry.count) || 0),
            lastSeen: Math.max(
              Number(current.lastSeen) || 0,
              Number(entry.lastSeen) || 0
            ),
          }
        : {
            ...entry,
            expectedMuscleId,
            chosenMuscleId,
          };

      if (
        expectedMuscleId !== entry.expectedMuscleId ||
        chosenMuscleId !== entry.chosenMuscleId ||
        key !== [entry.skillId, entry.expectedMuscleId, entry.chosenMuscleId].join("::")
      ) {
        changed = true;
      }
    }

    if (changed) store.confusions = migrated;
  }

  if (changed) saveLearningStore(store, storage);
  return changed;
}

function targetScopeText(target) {
  return [
    target?.nameRu || "",
    ...(target?.sourceNames || []),
  ]
    .join(" ")
    .toLocaleLowerCase("ru-RU");
}

function matchesNamedScope(target, matchId) {
  const text = targetScopeText(target);

  if (matchId === "neck-collar") {
    return /trapezius|levator scapulae|rhomboid|sternocleidomastoid|scalenus|splenius|semispinalis (?:capitis|cervicis|colli)|longissimus (?:capitis|cervicis|colli)|iliocostalis (?:cervicis|colli)|rectus (?:posterior (?:major|minor)|lateralis|anterior) capitis|obliquus (?:capitis|inferior capitis|superior capitis)|multifidus (?:cervicis|colli)|interspinales cervicis|intertransversarii cervicis|трапециевид|поднимающ.*лопат|ромбовид|грудино-ключично-сосцевид|лестничн|ременн.*(?:голов|ше)|полуостист.*(?:голов|ше)|длиннейш.*(?:голов|ше)|подвздошно-р[её]берн.*ше|прям.*мышц.*голов|кос.*мышц.*голов|многораздельн.*ше|межостист.*ше|межпоперечн.*ше/u.test(text);
  }

  if (matchId === "foot") {
    return /abductor hallucis|adductor hallucis|flexor hallucis brevis|extensor hallucis brevis|flexor digitorum brevis|extensor digitorum brevis|quadratus plantae|flexor accessorius|abductor digiti minimi.*foot|flexor digiti minimi.*foot|opponens digiti minimi.*foot|lumbrical.*foot|interosse.*foot|мышц.*больш.*пальц.*стоп|сгибател.*пальц.*стоп.*корот|разгибател.*пальц.*стоп.*корот|квадратн.*мышц.*подошв|мизинц.*стоп|червеобразн.*стоп|межкостн.*стоп/u.test(text);
  }

  if (matchId === "erector-spinae") {
    return /\b(?:iliocostalis|longissimus|spinalis)\b|подвздошно-р[её]берн|длиннейш.*мышц|(?:^|\s)остист(?:ая|ые)\s+мышц/u.test(text);
  }

  if (matchId === "rotator-cuff") {
    return /supraspinatus|infraspinatus|subscapularis|teres minor|надостн|подостн|подлопаточн|малая круглая/u.test(text);
  }

  if (matchId === "scapular-stabilizers") {
    return /trapezius|rhomboid|levator scapulae|serratus anterior|трапециевид|ромбовид|поднимающ.*лопат|передн.*зубчат/u.test(text);
  }

  return false;
}

export function filterCatalogByRegion(catalog, regionId) {
  const items = [...(catalog || [])];
  if (!regionId || regionId === "all") return items;

  const scope = SCOPE_BY_ID.get(regionId);
  if (scope) {
    if (scope.regionIds?.includes("all")) return items;
    if (scope.regionIds?.length) {
      const regions = new Set(scope.regionIds);
      return items.filter((item) => regions.has(item.region));
    }
    if (scope.match) {
      return items.filter((item) => matchesNamedScope(item, scope.match));
    }
  }

  return items.filter((item) => item.region === regionId);
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
  return (
    SCOPE_BY_ID.get(regionId)?.nameRu ||
    REGION_BY_ID.get(regionId)?.nameRu ||
    "Другие мышцы"
  );
}

export function learningScopeDescriptionRu(scopeId) {
  return SCOPE_BY_ID.get(scopeId)?.descriptionRu || "";
}

function emptyStore() {
  return {
    version: STORE_VERSION,
    updatedAt: 0,
    records: {},
    confusions: {},
    sessions: [],
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
      confusions:
        parsed.confusions && typeof parsed.confusions === "object"
          ? parsed.confusions
          : {},
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions.slice(-100)
        : Array.isArray(parsed.sessionHistory)
          ? parsed.sessionHistory.slice(-100)
          : [],
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
  const raw = store.records[key] || {};
  const correct = Number(raw.correct) || 0;
  const wrong = Number(raw.wrong) || 0;

  return {
    attempts: Number(raw.attempts) || 0,
    correct,
    wrong,
    lastSeen: Number(raw.lastSeen) || 0,
    // Во втором проходе это бинарная очередь повторения: навык либо
    // требует повторения, либо нет. Частота ошибок хранится отдельно в wrong.
    reviewDebt:
      raw.reviewDebt == null
        ? wrong > correct
          ? 1
          : 0
        : Number(raw.reviewDebt) > 0
          ? 1
          : 0,
  };
}

export function recordLearningAttempt(
  store,
  muscleId,
  skillId,
  wasCorrect,
  storage = globalThis.localStorage,
  options = {}
) {
  const key = muscleId + "::" + skillId;
  const current = skillRecord(store, muscleId, skillId);
  const retireMistake = options.retireMistake !== false;
  const addReviewDebt = options.addReviewDebt !== false;

  store.records[key] = {
    ...(store.records[key] || {}),
    attempts: current.attempts + 1,
    correct: current.correct + (wasCorrect ? 1 : 0),
    wrong: current.wrong + (wasCorrect ? 0 : 1),
    lastSeen: Date.now(),
    reviewDebt: wasCorrect
      ? retireMistake
        ? 0
        : current.reviewDebt
      : addReviewDebt
        ? 1
        : current.reviewDebt,
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



export function recordConfusion(
  store,
  expectedMuscleId,
  chosenMuscleId,
  skillId,
  storage = globalThis.localStorage
) {
  if (!expectedMuscleId || !chosenMuscleId || expectedMuscleId === chosenMuscleId) return null;

  if (!store.confusions || typeof store.confusions !== "object") store.confusions = {};
  const key = [skillId, expectedMuscleId, chosenMuscleId].join("::");
  const current = store.confusions[key] || {
    skillId,
    expectedMuscleId,
    chosenMuscleId,
    count: 0,
    lastSeen: 0,
  };

  store.confusions[key] = {
    ...current,
    count: (Number(current.count) || 0) + 1,
    lastSeen: Date.now(),
  };
  saveLearningStore(store, storage);
  return store.confusions[key];
}

export function confusionPairs(store, { skillId = null, limit = 10 } = {}) {
  return Object.values(store?.confusions || {})
    .filter((entry) => !skillId || entry.skillId === skillId)
    .sort(
      (a, b) =>
        (Number(b.count) || 0) - (Number(a.count) || 0) ||
        (Number(b.lastSeen) || 0) - (Number(a.lastSeen) || 0)
    )
    .slice(0, Math.max(1, Number(limit) || 10));
}

export function appendSessionHistory(
  store,
  entry,
  storage = globalThis.localStorage
) {
  if (!Array.isArray(store.sessions)) store.sessions = [];

  const normalized = {
    sessionId: entry?.sessionId ? String(entry.sessionId) : "",
    startedAt: Math.max(0, Number(entry?.startedAt) || 0),
    completedAt: Number(entry?.completedAt) || Date.now(),
    mode: String(entry?.mode || ""),
    region: String(entry?.region || "all"),
    modelSource: String(entry?.modelSource || ""),
    total: Math.max(0, Number(entry?.total) || 0),
    clean: Math.max(0, Number(entry?.clean) || 0),
    wrongAttempts: Math.max(0, Number(entry?.wrongAttempts) || 0),
    revealed: Math.max(0, Number(entry?.revealed) || 0),
  };

  if (
    normalized.sessionId &&
    store.sessions.some((item) => item?.sessionId === normalized.sessionId)
  ) {
    return store.sessions.find((item) => item?.sessionId === normalized.sessionId);
  }

  store.sessions.push(normalized);
  if (store.sessions.length > 100) store.sessions = store.sessions.slice(-100);
  saveLearningStore(store, storage);
  return normalized;
}

export function learningHistory(store, limit = 20) {
  return [...(store?.sessions || [])]
    .sort((a, b) => (Number(b.completedAt) || 0) - (Number(a.completedAt) || 0))
    .slice(0, Math.max(1, Number(limit) || 20));
}

export function resetLearningStore(storage = globalThis.localStorage) {
  const store = emptyStore();
  saveLearningStore(store, storage);
  return store;
}
