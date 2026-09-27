export const MUSCLE_REFERENCE_SOURCES = Object.freeze({
  "miology-igma-2018": Object.freeze({
    title: "Растегаева Л. И. и др. Миология",
    year: 2018,
    publisher: "Ижевская государственная медицинская академия",
    use: "Анатомические факты и указатели на учебные иллюстрации",
    rightsStatus: "Иллюстрации требуют отдельной проверки прав перед публичным встраиванием",
  }),
  "gray-1918": Object.freeze({
    title: "Gray's Anatomy of the Human Body, 20th U.S. edition",
    year: 1918,
    use: "Кандидаты на публично доступные атласные иллюстрации",
    rightsStatus: "Public domain для проверенных сканов/производных, отмеченных как Public Domain",
  }),
  "z-anatomy": Object.freeze({
    title: "Z-Anatomy",
    use: "3D-анатомия",
    rightsStatus: "CC BY-SA 4.0; требуется атрибуция и соблюдение ShareAlike",
  }),
  "goldfinger-1991": Object.freeze({
    title: "Eliot Goldfinger — Human Anatomy for Artists",
    year: 1991,
    use: "Сверка формы, поверхностных ориентиров и взаимного наложения",
    rightsStatus: "Справочный источник; изображения не включать в публичный релиз без отдельного разрешения",
  }),
  "samusev-lipchenko-2003": Object.freeze({
    title: "Р. П. Самусев, В. Я. Липченко — Атлас анатомии человека",
    year: 2003,
    use: "Контроль анатомических названий и пространственных отношений",
    rightsStatus: "Справочный источник; изображения не включать в публичный релиз без отдельного разрешения",
  }),
});

const REFERENCES = Object.freeze([
  Object.freeze({
    id: "deltoid",
    match: /deltoid/i,
    originRu: "Ость лопатки, акромион и ключица.",
    insertionRu: "Дельтовидная бугристость плечевой кости.",
    actionsRu: Object.freeze([
      "Передняя часть сгибает плечо и участвует во внутреннем вращении.",
      "Задняя часть разгибает плечо и участвует в наружном вращении.",
      "Совместное сокращение пучков отводит плечо.",
    ]),
    sources: Object.freeze([
      Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, мышцы пояса верхней конечности; дельтовидная мышца" }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел VI, рис. 1 — пояс верхней конечности и задняя поверхность плеча",
        rightsStatus: "review",
      }),
      Object.freeze({
        sourceId: "gray-1918",
        locator: "Плечевой пояс / дельтовидная область — подобрать локальный Public Domain файл после визуальной сверки",
        rightsStatus: "public-domain-candidate",
      }),
    ]),
  }),
  Object.freeze({
    id: "supraspinatus",
    match: /supraspinatus/i,
    originRu: "Надостная ямка лопатки и надостная фасция.",
    insertionRu: "Большой бугорок плечевой кости; часть сухожилия вплетается в капсулу плечевого сустава.",
    actionsRu: Object.freeze([
      "Участвует в отведении плеча.",
      "Натягивает капсулу плечевого сустава.",
    ]),
    sources: Object.freeze([
      Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, мышцы пояса верхней конечности; надостная мышца" }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "gray-1918",
        locator: "Ротаторная манжета / задняя поверхность лопатки — подобрать Public Domain файл после визуальной сверки",
        rightsStatus: "public-domain-candidate",
      }),
    ]),
  }),
  Object.freeze({
    id: "infraspinatus",
    match: /infraspinatus/i,
    originRu: "Подостная ямка лопатки и подостная фасция.",
    insertionRu: "Большой бугорок плечевой кости; сухожилие проходит позади плечевого сустава.",
    actionsRu: Object.freeze([
      "Наружно вращает плечо.",
      "Участвует в приведении плеча.",
    ]),
    sources: Object.freeze([
      Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, мышцы пояса верхней конечности; подостная мышца" }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "gray-1918",
        locator: "Задняя поверхность лопатки — подобрать Public Domain файл после визуальной сверки",
        rightsStatus: "public-domain-candidate",
      }),
    ]),
  }),
  Object.freeze({
    id: "teres-minor",
    match: /teres.?minor/i,
    originRu: "Латеральный край лопатки и подостная фасция.",
    insertionRu: "Большой бугорок плечевой кости; сухожилие проходит позади плечевого сустава.",
    actionsRu: Object.freeze([
      "Наружно вращает плечо.",
      "Участвует в приведении плеча.",
      "Оттягивает капсулу плечевого сустава.",
    ]),
    sources: Object.freeze([
      Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, мышцы пояса верхней конечности; малая круглая мышца" }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "gray-1918",
        locator: "Задняя поверхность плечевого пояса — подобрать Public Domain файл после визуальной сверки",
        rightsStatus: "public-domain-candidate",
      }),
    ]),
  }),
  Object.freeze({
    id: "subscapularis",
    match: /subscapularis/i,
    originRu: "Подлопаточная ямка и подлопаточная фасция.",
    insertionRu: "Малый бугорок и гребень малого бугорка плечевой кости.",
    actionsRu: Object.freeze([
      "Приводит плечо.",
      "Внутренне вращает плечо.",
    ]),
    sources: Object.freeze([
      Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, мышцы пояса верхней конечности; подлопаточная мышца" }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "gray-1918",
        locator: "Передняя поверхность лопатки / подлопаточная область — подобрать Public Domain файл после визуальной сверки",
        rightsStatus: "public-domain-candidate",
      }),
    ]),
  }),
  Object.freeze({
    id: "biceps-brachii",
    match: /biceps.*brachii|biceps.*arm/i,
    originRu: "Длинная головка — надсуставной бугорок лопатки; короткая головка — клювовидный отросток лопатки.",
    insertionRu: "Бугристость лучевой кости; апоневроз вплетается в фасцию предплечья с медиальной стороны.",
    actionsRu: Object.freeze([
      "Сгибает предплечье в локтевом суставе.",
      "Супинирует предплечье.",
      "Участвует в сгибании плеча; короткая головка также участвует в приведении плеча.",
    ]),
    sources: Object.freeze([
      Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, мышцы плеча; двуглавая мышца плеча" }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел VI, рис. 2 — передняя поверхность плеча",
        rightsStatus: "review",
      }),
      Object.freeze({
        sourceId: "gray-1918",
        locator: "Передняя поверхность плеча — подобрать локальный Public Domain файл после визуальной сверки",
        rightsStatus: "public-domain-candidate",
      }),
    ]),
  }),
]);

export function muscleReferenceFor(sourceName) {
  const value = String(sourceName || "");
  return REFERENCES.find((item) => item.match.test(value)) || null;
}

export function muscleReferenceSource(sourceId) {
  return MUSCLE_REFERENCE_SOURCES[sourceId] || null;
}
