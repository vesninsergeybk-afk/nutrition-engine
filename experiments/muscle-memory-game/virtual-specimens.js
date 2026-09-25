function specimen(
  id,
  type,
  nameRu,
  descriptionRu,
  {
    questionRegionIds = [],
    questionPatterns = [],
    contextPatterns = [],
    excludePatterns = [],
    supportBonePatterns = [],
    depthProfile = null,
    minDepthQuestionTargets = 0,
    defaultViews = ["threeQuarter"],
    padding = 1.28,
  } = {}
) {
  return Object.freeze({
    id,
    type,
    nameRu,
    descriptionRu,
    questionRegionIds: Object.freeze([...questionRegionIds]),
    questionPatterns: Object.freeze([...questionPatterns]),
    contextPatterns: Object.freeze([...contextPatterns]),
    excludePatterns: Object.freeze([...excludePatterns]),
    supportBonePatterns: Object.freeze([...supportBonePatterns]),
    depthProfile,
    minDepthQuestionTargets,
    defaultViews: Object.freeze([...defaultViews]),
    padding,
  });
}

export const VIRTUAL_SPECIMENS = Object.freeze([
  // Topographic specimens
  specimen(
    "neck-collar",
    "region",
    "Шейно-воротниковая зона",
    "Шея, подзатылочная область и лопаточно-шейный переход.",
    {
      questionPatterns: [
        /sternocleidomastoid|scalenus|splenius|semispinalis (?:capitis|cervicis|colli)|longissimus (?:capitis|cervicis|colli)|iliocostalis (?:cervicis|colli)|longus (?:capitis|colli)|rectus (?:posterior (?:major|minor)|lateralis|anterior) capitis|obliquus (?:capitis|inferior capitis|superior capitis)|multifidus (?:cervicis|colli)|interspinales cervicis|intertransversarii cervicis|трапециевид|поднимающ.*лопат|ромбовид|грудино-ключично-сосцевид|лестничн|ременн.*(?:голов|ше)|полуостист.*(?:голов|ше)|длиннейш.*(?:голов|ше)|подвздошно-р[её]берн.*ше|длинн.*мышц.*(?:голов|ше)|прям.*мышц.*голов|кос.*мышц.*голов|многораздельн.*ше|межостист.*ше|межпоперечн.*ше/u,
        /trapezius|levator scapulae|rhomboid/i,
      ],
      contextPatterns: [/deltoid/i],
      supportBonePatterns: [/cervical|vertebra|occip|clavicle|scapula/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "shoulder",
    "region",
    "Плечевой пояс",
    "Лопаточный комплекс, мышцы плечевого пояса и глубокий контекст плечевого сустава.",
    {
      questionRegionIds: ["shoulder"],
      contextPatterns: [/pectoralis major|latissimus dorsi/i],
      supportBonePatterns: [/scapula|clavicle|humerus|rib|thoracic vertebra/i],
      depthProfile: "shoulder",
      minDepthQuestionTargets: 13,
      defaultViews: ["back", "threeQuarter", "front"],
      padding: 1.22,
    }
  ),
  specimen(
    "arm-anterior",
    "region",
    "Плечо — передняя группа",
    "Передняя мышечная группа плеча и локтевой переход.",
    {
      questionPatterns: [/biceps brachii|brachialis|coracobrachialis/i],
      contextPatterns: [/deltoid/i],
      supportBonePatterns: [/humerus|radius|ulna/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "arm-posterior",
    "region",
    "Плечо — задняя группа",
    "Задняя мышечная группа плеча и локтевой переход.",
    {
      questionPatterns: [/triceps brachii|anconeus/i],
      contextPatterns: [/deltoid/i],
      supportBonePatterns: [/humerus|radius|ulna|olecranon/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "forearm-hand-anterior",
    "region",
    "Предплечье и кисть — передняя поверхность",
    "Сгибатели, пронаторы и ладонный мышечный контекст.",
    {
      questionPatterns: [
        /pronator|flexor carpi|flexor digitorum (?:profundus|superficialis)|flexor pollicis|palmaris longus|lumbrical.*hand|palmar interosse|interosse.*hand|opponens pollicis|opponens digiti minimi|adductor pollicis|abductor pollicis brevis|flexor digiti minimi|abductor digiti minimi|ладонн.*межкостн.*кист/iu,
      ],
      excludePatterns: [/foot|toe|plantar|стоп|подошв/iu],
      supportBonePatterns: [
        /radius|ulna|carpal|metacarp/i,
        /^(?!.*(?:toe|foot)).*phalanx.*(?:finger|thumb)/i,
      ],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "forearm-hand-posterior",
    "region",
    "Предплечье и кисть — задняя поверхность",
    "Разгибатели, супинатор и тыльный мышечный контекст.",
    {
      questionPatterns: [
        /supinator|extensor carpi|extensor digitorum|extensor digiti minimi|extensor pollicis|abductor pollicis longus|extensor indicis|brachioradialis/i,
      ],
      excludePatterns: [/foot|toe|plantar|стоп|подошв/iu],
      supportBonePatterns: [
        /radius|ulna|carpal|metacarp/i,
        /^(?!.*(?:toe|foot)).*phalanx.*(?:finger|thumb)/i,
      ],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "thorax-anterior",
    "region",
    "Передняя грудная стенка",
    "Грудные мышцы, передняя зубчатая и межрёберный контекст.",
    {
      questionPatterns: [
        /pectoralis major|pectoralis minor|subclavius|serratus anterior|intercostal|transversus thoracis/i,
      ],
      supportBonePatterns: [/sternum|rib|clavicle|thoracic vertebra/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "abdomen",
    "region",
    "Переднебоковая брюшная стенка",
    "Прямая, косые и поперечная мышцы живота с региональной послойностью.",
    {
      questionRegionIds: ["abdomen"],
      supportBonePatterns: [/rib|sternum|ilium|pubis|hip bone|os cox|lumbar vertebra/i],
      depthProfile: "abdomen",
      minDepthQuestionTargets: 5,
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "upper-back",
    "region",
    "Верхняя часть спины",
    "Лопаточная область и верхнегрудной мышечный контекст.",
    {
      questionPatterns: [
        /trapezius|rhomboid|levator scapulae|serratus posterior superior|supraspinatus|infraspinatus|teres major|teres minor/i,
      ],
      contextPatterns: [/latissimus dorsi|deltoid/i],
      supportBonePatterns: [/scapula|clavicle|rib|thoracic vertebra|humerus/i],
      depthProfile: null,
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "lower-back",
    "region",
    "Поясничная и нижнегрудная область",
    "Поверхностные и собственные мышцы нижней части спины.",
    {
      questionPatterns: [
        /latissimus dorsi|serratus posterior inferior|iliocostalis (?:thoracis|lumborum)|longissimus thoracis|(?:\bspinalis thoracis\b|(?:^|\s)остистая мышца груди)|quadratus lumborum|multifidus (?:thoracis|lumborum)|lumbar rotator|(?:set of )?interspinales lumborum|(?:lateral|medial) lumbar intertransversarius|(?:dorsal|ventral) parts of lateral intertransversarii lumborum/iu,
      ],
      excludePatterns: [/cervic|colli|шеи|шея/iu],
      supportBonePatterns: [/rib|thoracic vertebra|lumbar vertebra|sacrum|ilium|hip bone|os cox/i],
      depthProfile: "back",
      minDepthQuestionTargets: 6,
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "gluteal",
    "region",
    "Ягодичная область",
    "Ягодичные мышцы и глубокие наружные ротаторы тазобедренной области.",
    {
      questionRegionIds: ["gluteal"],
      contextPatterns: [/tensor fasciae latae/i],
      supportBonePatterns: [/sacrum|ilium|ischium|hip bone|os cox|femur/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "thigh-anterior",
    "region",
    "Бедро — передняя поверхность",
    "Четырёхглавая мышца, портняжная и передний тазобедренный переход.",
    {
      questionPatterns: [
        /rectus femoris|vastus (?:lateralis|medialis|intermedius)|sartorius|tensor fasciae latae/i,
      ],
      contextPatterns: [/iliacus|psoas major|pectineus/i],
      supportBonePatterns: [/femur|patella|ilium|pubis|hip bone|os cox/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "thigh-medial",
    "region",
    "Бедро — медиальная группа",
    "Приводящие мышцы, тонкая и гребенчатая.",
    {
      questionPatterns: [/adductor (?:longus|brevis|magnus|minimus)|gracilis|pectineus/i],
      supportBonePatterns: [/femur|pubis|ischium|hip bone|os cox/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "thigh-posterior",
    "region",
    "Бедро — задняя поверхность",
    "Задняя группа бедра с ягодичным покровом и соседним приводящим контекстом.",
    {
      questionPatterns: [/biceps femoris|semitendinosus|semimembranosus/i],
      contextPatterns: [/gluteus maximus|adductor magnus/i],
      supportBonePatterns: [/femur|ischium|hip bone|os cox|tibia|fibula/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "leg-anterior-lateral",
    "region",
    "Голень — переднелатеральная группа",
    "Передняя и латеральная мышечные группы голени.",
    {
      questionPatterns: [
        /tibialis anterior|extensor digitorum longus|extensor hallucis longus|fibularis|peroneus/i,
      ],
      supportBonePatterns: [/tibia|fibula|talus|calcaneus/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "leg-posterior",
    "region",
    "Голень — задняя группа",
    "Поверхностная и глубокая задние группы голени.",
    {
      questionPatterns: [
        /gastrocnemius|soleus|plantaris|popliteus|tibialis posterior|flexor digitorum longus|flexor hallucis longus/i,
      ],
      supportBonePatterns: [/tibia|fibula|talus|calcaneus/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "foot",
    "region",
    "Стопа",
    "Собственные мышцы тыла и подошвы стопы.",
    {
      questionPatterns: [
        /abductor hallucis|adductor hallucis|flexor hallucis brevis|extensor hallucis brevis|flexor digitorum brevis|extensor digitorum brevis|quadratus plantae|flexor accessorius|abductor digiti minimi.*foot|flexor digiti minimi.*foot|opponens digiti minimi.*foot|lumbrical.*foot|interosse.*foot/i,
      ],
      supportBonePatterns: [
        /talus|calcaneus|tarsal|metatars/i,
        /phalanx.*(?:toe|big toe)|phalanx.*foot/i,
      ],
      defaultViews: ["threeQuarter", "front"],
    }
  ),

  // Thematic / functional specimens
  specimen(
    "rotator-cuff",
    "group",
    "Ротаторная манжета плеча",
    "Четыре мышцы ротаторной манжеты в лопаточно-плечевом контексте.",
    {
      questionPatterns: [/supraspinatus|infraspinatus|subscapularis|teres minor/i],
      contextPatterns: [/deltoid|teres major/i],
      supportBonePatterns: [/scapula|clavicle|humerus/i],
      depthProfile: "shoulder",
      minDepthQuestionTargets: 4,
      defaultViews: ["back", "threeQuarter", "front"],
      padding: 1.16,
    }
  ),
  specimen(
    "scapular-stabilizers",
    "group",
    "Лопаточный комплекс",
    "Основные мышцы положения и движения лопатки.",
    {
      questionPatterns: [/trapezius|rhomboid|levator scapulae|serratus anterior/i],
      contextPatterns: [/deltoid|latissimus dorsi|pectoralis major|pectoralis minor/i],
      supportBonePatterns: [/scapula|clavicle|rib|thoracic vertebra/i],
      depthProfile: "shoulder",
      minDepthQuestionTargets: 5,
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "erector-spinae",
    "group",
    "Мышца, выпрямляющая позвоночник",
    "Подвздошно-рёберная, длиннейшая и остистая части комплекса.",
    {
      questionPatterns: [
        /\biliocostalis\b|\blongissimus thoracis\b|\bspinalis thoracis\b|(?:^|\s)остистая мышца груди|подвздошно-р[её]бер|длиннейш.*груди/iu,
      ],
      contextPatterns: [/latissimus dorsi|serratus posterior/i],
      supportBonePatterns: [/rib|vertebra|sacrum|ilium/i],
      depthProfile: "back",
      minDepthQuestionTargets: 5,
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "deep-back",
    "group",
    "Глубокие мышцы спины",
    "Многораздельные, вращатели и короткие сегментарные мышцы.",
    {
      questionPatterns: [
        /multifidus|(?:lumbar|thoracic) rotator|rotatores|interspinal|intertransversar|levator(?:es)?(?:\s+(?:breves|longi))?\s+costar|levator(?:es)?\s+costarum\s+(?:breves|longi)|поднимающ.*р[её]бр/iu,
      ],
      excludePatterns: [/cervic|colli|шеи|шея/iu],
      contextPatterns: [/erector|iliocostalis|longissimus thoracis|spinalis|latissimus dorsi/i],
      supportBonePatterns: [/rib|vertebra|sacrum|ilium/i],
      depthProfile: "back",
      minDepthQuestionTargets: 4,
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "hamstrings",
    "group",
    "Мышцы задней поверхности бедра",
    "Двуглавая, полусухожильная и полуперепончатая мышцы.",
    {
      questionPatterns: [/biceps femoris|semitendinosus|semimembranosus/i],
      contextPatterns: [/gluteus maximus|adductor magnus/i],
      supportBonePatterns: [/femur|ischium|hip bone|os cox|tibia|fibula/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "quadriceps",
    "group",
    "Четырёхглавая мышца бедра",
    "Прямая и три широкие мышцы передней поверхности бедра.",
    {
      questionPatterns: [/rectus femoris|vastus (?:lateralis|medialis|intermedius)/i],
      contextPatterns: [/sartorius|tensor fasciae latae/i],
      supportBonePatterns: [/femur|patella|ilium|hip bone|os cox/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "adductors",
    "group",
    "Приводящая группа бедра",
    "Приводящие мышцы, тонкая и гребенчатая.",
    {
      questionPatterns: [/adductor (?:longus|brevis|magnus|minimus)|gracilis|pectineus/i],
      supportBonePatterns: [/femur|pubis|ischium|hip bone|os cox/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "gluteal-complex",
    "group",
    "Ягодичный комплекс",
    "Ягодичные мышцы, напрягатель широкой фасции и глубокие наружные ротаторы.",
    {
      questionPatterns: [
        /gluteus|tensor fasciae latae|piriformis|gemellus|obturator|quadratus femoris/i,
      ],
      supportBonePatterns: [/sacrum|ilium|ischium|hip bone|os cox|femur/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "calf-complex",
    "group",
    "Икроножно-камбаловидный комплекс",
    "Икроножная, камбаловидная и подошвенная мышцы.",
    {
      questionPatterns: [/gastrocnemius|soleus|plantaris/i],
      contextPatterns: [/popliteus|tibialis posterior/i],
      supportBonePatterns: [/tibia|fibula|calcaneus/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "anterior-abdominal-wall",
    "group",
    "Переднебоковая брюшная стенка",
    "Прямая, наружная и внутренняя косые, поперечная и пирамидальная мышцы.",
    {
      questionRegionIds: ["abdomen"],
      supportBonePatterns: [/rib|sternum|ilium|pubis|hip bone|os cox|lumbar vertebra/i],
      depthProfile: "abdomen",
      minDepthQuestionTargets: 5,
      defaultViews: ["front", "threeQuarter"],
    }
  ),
  specimen(
    "suboccipital",
    "group",
    "Подзатылочный комплекс",
    "Короткие глубокие мышцы подзатылочной области.",
    {
      questionPatterns: [
        /rectus (?:capitis posterior (?:major|minor)|posterior (?:major|minor) capitis)|obliquus (?:(?:superior|inferior) capitis|capitis (?:superior|inferior))|(?:большая|малая)?\s*задн.*прям.*мышц.*голов|кос.*мышц.*голов/iu,
      ],
      contextPatterns: [/splenius capitis|semispinalis capitis|trapezius/i],
      supportBonePatterns: [/occip|cervical vertebra|atlas|axis/i],
      defaultViews: ["back", "threeQuarter"],
    }
  ),
  specimen(
    "hip-flexors",
    "group",
    "Передний тазобедренный комплекс",
    "Основные сгибатели тазобедренного сустава в переднем тазовом контексте.",
    {
      questionPatterns: [/iliacus|psoas major|rectus femoris|sartorius|tensor fasciae latae/i],
      supportBonePatterns: [/ilium|pubis|hip bone|os cox|femur|lumbar vertebra/i],
      defaultViews: ["front", "threeQuarter"],
    }
  ),
]);


const SPECIMEN_VERTICAL_WINDOWS = Object.freeze({
  "neck-collar": Object.freeze([0.70, 1.00]),
  shoulder: Object.freeze([0.54, 0.90]),
  "arm-anterior": Object.freeze([0.42, 0.80]),
  "arm-posterior": Object.freeze([0.42, 0.80]),
  "forearm-hand-anterior": Object.freeze([0.22, 0.64]),
  "forearm-hand-posterior": Object.freeze([0.22, 0.64]),
  "thorax-anterior": Object.freeze([0.48, 0.88]),
  abdomen: Object.freeze([0.31, 0.62]),
  "upper-back": Object.freeze([0.50, 0.97]),
  "lower-back": Object.freeze([0.58, 0.78]),
  gluteal: Object.freeze([0.47, 0.66]),
  "thigh-anterior": Object.freeze([0.11, 0.62]),
  "thigh-medial": Object.freeze([0.11, 0.56]),
  "thigh-posterior": Object.freeze([0.11, 0.43]),
  "leg-anterior-lateral": Object.freeze([0.01, 0.30]),
  "leg-posterior": Object.freeze([0.01, 0.30]),
  foot: Object.freeze([0.00, 0.12]),

  "rotator-cuff": Object.freeze([0.55, 0.89]),
  "scapular-stabilizers": Object.freeze([0.49, 0.89]),
  "erector-spinae": Object.freeze([0.45, 0.96]),
  "deep-back": Object.freeze([0.48, 0.92]),
  hamstrings: Object.freeze([0.11, 0.43]),
  quadriceps: Object.freeze([0.11, 0.43]),
  adductors: Object.freeze([0.11, 0.56]),
  "gluteal-complex": Object.freeze([0.47, 0.66]),
  "calf-complex": Object.freeze([0.01, 0.30]),
  "anterior-abdominal-wall": Object.freeze([0.31, 0.62]),
  suboccipital: Object.freeze([0.83, 1.00]),
  "hip-flexors": Object.freeze([0.20, 0.53]),
});

export function specimenVerticalWindow(specimenId) {
  const window = SPECIMEN_VERTICAL_WINDOWS[specimenId];
  return window ? [...window] : null;
}

const SPECIMEN_BY_ID = new Map(VIRTUAL_SPECIMENS.map((item) => [item.id, item]));

function targetText(target) {
  return [
    ...(target?.sourceNames || []),
    target?.nameRu || "",
  ]
    .join(" ")
    .toLocaleLowerCase("en-US");
}

function matchesPatterns(text, patterns) {
  return (patterns || []).some((pattern) => pattern.test(text));
}

export function specimenById(id) {
  return SPECIMEN_BY_ID.get(id) || null;
}

export function specimenMatchesTarget(target, specimenOrId, mode = "question") {
  const item =
    typeof specimenOrId === "string" ? specimenById(specimenOrId) : specimenOrId;
  if (!item || !target) return false;

  const text = targetText(target);
  if (matchesPatterns(text, item.excludePatterns)) return false;

  const question =
    item.questionRegionIds.includes(target.region) ||
    matchesPatterns(text, item.questionPatterns);

  if (mode === "question") return question;
  return question || matchesPatterns(text, item.contextPatterns);
}

export function filterCatalogForSpecimen(catalog, specimenId, mode = "question") {
  const item = specimenById(specimenId);
  if (!item) return [];
  return (catalog || []).filter((target) =>
    specimenMatchesTarget(target, item, mode)
  );
}

export function specimenSceneTargets(catalog, specimenId) {
  return filterCatalogForSpecimen(catalog, specimenId, "scene");
}

export function specimenSupportBoneMatches(specimenId, boneName) {
  const item = specimenById(specimenId);
  if (!item?.supportBonePatterns?.length) return false;
  const text = String(boneName || "").toLocaleLowerCase("en-US");
  return item.supportBonePatterns.some((pattern) => pattern.test(text));
}

export function specimenLearningScopes() {
  return VIRTUAL_SPECIMENS.map((item) => ({
    id: item.id,
    nameRu: item.nameRu,
    descriptionRu: item.descriptionRu,
    group: item.type === "region" ? "specimen-region" : "specimen-group",
    specimenType: item.type,
  }));
}

export function specimenDepthProfileId(specimenId) {
  return specimenById(specimenId)?.depthProfile || null;
}

export function specimenDepthAvailability(catalog, specimenId) {
  const item = specimenById(specimenId);
  if (!item?.depthProfile) {
    return {
      supported: false,
      reason: "unverified",
      actual: 0,
      required: 0,
      profileId: null,
    };
  }

  const actual = filterCatalogForSpecimen(catalog, specimenId, "question").length;
  const required = Math.max(1, Number(item.minDepthQuestionTargets) || 1);

  return {
    supported: actual >= required,
    reason: actual >= required ? "ok" : "source-incomplete",
    actual,
    required,
    profileId: item.depthProfile,
  };
}

export function specimenPrimaryView(specimenId) {
  return specimenById(specimenId)?.defaultViews?.[0] || null;
}

export function specimenPadding(specimenId) {
  return Number(specimenById(specimenId)?.padding) || 1.28;
}
