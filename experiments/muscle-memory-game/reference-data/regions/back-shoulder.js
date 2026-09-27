export const BACK_SHOULDER_REGION = Object.freeze({
  id: "back-shoulder",
  nameRu: "Спина и плечевой пояс",
  status: "verified-v1",
  scopeRu: "Поверхностные и более глубокие слои спины, мышцы лопаточного комплекса и мышцы, непосредственно действующие на плечевой сустав.",
  teachingPrinciplesRu: Object.freeze([
    "Сначала показывать область и слой, затем отдельную мышцу.",
    "Не приписывать сложное движение одной мышце, если оно создаётся совместной работой нескольких структур.",
    "Не считать глубокую мышцу надёжно изолируемой пальпацией только потому, что известна её анатомическая проекция.",
    "Для групп глубоких мышц хранить отдельную карточку группы, если это точнее и полезнее, чем искусственное дробление.",
  ]),
  structures: Object.freeze([
    Object.freeze({
      id: "trapezius",
      kind: "muscle",
      names: Object.freeze({
        ru: "Трапециевидная мышца",
        latin: "musculus trapezius",
        modelAliases: Object.freeze(["trapezius"]),
      }),
      subregions: Object.freeze(["upper-back", "posterior-neck", "scapular-region"]),
      layer: "superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Наружный затылочный выступ и медиальная часть верхней выйной линии.",
          "Выйная связка.",
          "Остистые отростки C7–T12 и связанные с ними надостистые связки.",
        ]),
        insertionRu: Object.freeze([
          "Латеральная треть ключицы.",
          "Акромион.",
          "Ость лопатки.",
        ]),
        fiberDirectionRu: "Верхние пучки идут вниз и латерально, средние — преимущественно поперечно, нижние — вверх и латерально к ости лопатки.",
        actionsRu: Object.freeze([
          "Верхние пучки поднимают лопатку и участвуют в её вращении вверх.",
          "Средние пучки приводят лопатку к позвоночнику.",
          "Нижние пучки опускают лопатку и вместе с верхними участвуют в её вращении вверх.",
          "Мышца стабилизирует лопатку при движениях верхней конечности.",
        ]),
        innervationRu: "Двигательная иннервация — добавочный нерв (XI); чувствительно-проприоцептивные волокна — шейные нервы C3–C4.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Наружный затылочный выступ", "ключица", "акромион", "ость лопатки", "срединная линия грудного отдела"]),
        relationsRu: Object.freeze([
          "Образует крупный поверхностный пласт верхней части спины.",
          "Перекрывает ромбовидные мышцы и часть мышцы, поднимающей лопатку.",
          "Перекрывает часть надостной мышцы.",
        ]),
      }),
      movementCueRu: "Подъём плечевого пояса, сведение лопаток и подъём руки над головой показывают разные направления работы пучков.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 1.1 «Трапециевидная мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "course-anatomy-map-m6", locator: "4.2 «Поверхностный слой спины»", role: "pedagogy" }),
        Object.freeze({ sourceId: "ncbi-trapezius", locator: "Introduction; Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "latissimus-dorsi",
      kind: "muscle",
      names: Object.freeze({
        ru: "Широчайшая мышца спины",
        latin: "musculus latissimus dorsi",
        modelAliases: Object.freeze(["latissimus dorsi", "latissimus_dorsi"]),
      }),
      subregions: Object.freeze(["lower-back", "lateral-back", "posterior-axillary-fold"]),
      layer: "superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Остистые отростки нижних грудных позвонков через грудопоясничную фасцию.",
          "Грудопоясничная фасция и связанные с ней пояснично-крестцовые прикрепления.",
          "Задняя часть подвздошного гребня.",
          "Нижние 3–4 ребра.",
        ]),
        insertionRu: Object.freeze(["Дно межбугорковой борозды плечевой кости."]),
        fiberDirectionRu: "Волокна сходятся вверх и латерально к плечевой кости.",
        actionsRu: Object.freeze([
          "Разгибает плечо.",
          "Приводит плечо.",
          "Вращает плечо внутрь.",
          "При фиксированных верхних конечностях помогает подтягивать туловище к рукам.",
        ]),
        innervationRu: "Грудоспинной нерв, преимущественно C6–C8.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Подвздошный гребень", "нижние рёбра", "задняя подмышечная складка"]),
        relationsRu: Object.freeze([
          "Формирует широкий поверхностный пласт нижней и боковой части спины.",
          "Вместе с большой круглой мышцей участвует в формировании задней подмышечной складки.",
          "Перекрывает часть разгибателей позвоночника.",
        ]),
      }),
      movementCueRu: "Приведение и разгибание плеча хорошо показывают направление тяги мышцы.",
      sourceNotesRu: Object.freeze([
        "В «Миологии» ИГМА прикрепление описано как гребень малого бугорка. В справочнике принято современное описание — дно межбугорковой борозды плечевой кости.",
      ]),
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 1.2 «Широчайшая мышца спины»", role: "teaching-source" }),
        Object.freeze({ sourceId: "course-anatomy-map-m6", locator: "4.2 «Поверхностный слой спины»", role: "pedagogy" }),
        Object.freeze({ sourceId: "ncbi-latissimus-dorsi", locator: "Structure and Function", role: "verification" }),
      ]),
      illustrations: Object.freeze([
        Object.freeze({ sourceId: "gray-1918-plate-409", rightsStatus: "public-domain", purpose: "candidate-for-local-copy" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-correction" }),
    }),

    Object.freeze({
      id: "rhomboid-minor",
      kind: "muscle",
      names: Object.freeze({
        ru: "Малая ромбовидная мышца",
        latin: "musculus rhomboideus minor",
        modelAliases: Object.freeze(["rhomboid minor", "rhomboideus minor"]),
      }),
      subregions: Object.freeze(["scapular-region", "interscapular-region"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Нижняя часть выйной связки и остистые отростки C7–T1."]),
        insertionRu: Object.freeze(["Медиальный конец ости лопатки."]),
        fiberDirectionRu: "Волокна идут вниз и латерально от позвоночника к лопатке.",
        actionsRu: Object.freeze([
          "Приводит лопатку к позвоночнику.",
          "Участвует во вращении лопатки вниз.",
          "Помогает удерживать медиальный край лопатки у грудной клетки.",
        ]),
        innervationRu: "Дорсальный нерв лопатки, преимущественно C4–C5.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Ость лопатки", "медиальный край лопатки"]),
        relationsRu: Object.freeze(["Лежит глубже трапециевидной мышцы и выше большой ромбовидной."]),
      }),
      movementCueRu: "Приведение лопаток делает направление тяги группы понятнее, но не изолирует малую ромбовидную мышцу от большой.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, ромбовидные мышцы", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-rhomboids", locator: "Structure and Function; Nerves", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "rhomboid-major",
      kind: "muscle",
      names: Object.freeze({
        ru: "Большая ромбовидная мышца",
        latin: "musculus rhomboideus major",
        modelAliases: Object.freeze(["rhomboid major", "rhomboideus major"]),
      }),
      subregions: Object.freeze(["scapular-region", "interscapular-region"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Остистые отростки T2–T5 и прилежащие надостистые связки."]),
        insertionRu: Object.freeze(["Медиальный край лопатки от уровня ости до нижнего угла."]),
        fiberDirectionRu: "Волокна идут вниз и латерально к медиальному краю лопатки.",
        actionsRu: Object.freeze([
          "Приводит лопатку к позвоночнику.",
          "Участвует во вращении лопатки вниз.",
          "Стабилизирует лопатку на грудной клетке.",
        ]),
        innervationRu: "Дорсальный нерв лопатки, преимущественно C4–C5.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Медиальный край лопатки", "нижний угол лопатки", "ость лопатки"]),
        relationsRu: Object.freeze(["Лежит глубже трапециевидной мышцы и ниже малой ромбовидной."]),
      }),
      movementCueRu: "Приведение лопатки к позвоночнику показывает функцию ромбовидной группы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 1.3 «Большая ромбовидная мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-rhomboids", locator: "Structure and Function; Nerves", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "levator-scapulae",
      kind: "muscle",
      names: Object.freeze({
        ru: "Мышца, поднимающая лопатку",
        latin: "musculus levator scapulae",
        modelAliases: Object.freeze(["levator scapulae"]),
      }),
      subregions: Object.freeze(["posterolateral-neck", "superior-scapular-region"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Поперечные отростки C1–C4."]),
        insertionRu: Object.freeze(["Медиальный край лопатки между верхним углом и корнем ости лопатки."]),
        fiberDirectionRu: "Волокна идут вниз и латерально от верхних шейных позвонков к верхнему углу лопатки.",
        actionsRu: Object.freeze([
          "Поднимает лопатку.",
          "Участвует во вращении лопатки вниз.",
          "При фиксированной лопатке участвует в разгибании и ипсилатеральном боковом сгибании шеи.",
        ]),
        innervationRu: "Дорсальный нерв лопатки и передние ветви C3–C4.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Верхний угол лопатки", "медиальный край лопатки", "верхнебоковая поверхность шеи"]),
        relationsRu: Object.freeze(["Нижняя часть перекрыта трапециевидной мышцей; верхняя располагается глубже грудино-ключично-сосцевидной и ременной мышцы головы."]),
      }),
      movementCueRu: "Подъём лопатки показывает основное действие; точное выделение мышцы по рельефу ограничено перекрывающими структурами.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 1.4 «Мышца, поднимающая лопатку»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-levator-scapulae", locator: "Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "deltoid",
      kind: "muscle",
      names: Object.freeze({
        ru: "Дельтовидная мышца",
        latin: "musculus deltoideus",
        modelAliases: Object.freeze(["deltoid"]),
      }),
      subregions: Object.freeze(["shoulder"]),
      layer: "superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Латеральная треть ключицы.", "Акромион.", "Ость лопатки."]),
        insertionRu: Object.freeze(["Дельтовидная бугристость плечевой кости."]),
        fiberDirectionRu: "Передняя, средняя и задняя части имеют различное направление волокон и различный вклад в движение плеча.",
        actionsRu: Object.freeze([
          "Средняя часть преимущественно отводит плечо.",
          "Передняя часть участвует в сгибании и внутреннем вращении плеча.",
          "Задняя часть участвует в разгибании и наружном вращении плеча.",
        ]),
        innervationRu: "Подмышечный нерв, преимущественно C5–C6.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Акромион", "латеральная ключица", "ость лопатки"]),
        relationsRu: Object.freeze(["Покрывает плечевой сустав и часть сухожилий вращательной манжеты."]),
      }),
      movementCueRu: "Отведение плеча делает среднюю часть мышцы наиболее заметной.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, дельтовидная мышца", role: "teaching-source" }),
        Object.freeze({ sourceId: "course-anatomy-map-m5", locator: "4.5 «Область плечевого сустава»", role: "pedagogy" }),
        Object.freeze({ sourceId: "ncbi-shoulder-muscles", locator: "Scapulohumeral muscles — Deltoid", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "supraspinatus",
      kind: "muscle",
      names: Object.freeze({
        ru: "Надостная мышца",
        latin: "musculus supraspinatus",
        modelAliases: Object.freeze(["supraspinatus"]),
      }),
      subregions: Object.freeze(["posterior-shoulder", "rotator-cuff"]),
      layer: "deep-to-trapezius",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Надостная ямка лопатки."]),
        insertionRu: Object.freeze(["Верхняя площадка большого бугорка плечевой кости."]),
        fiberDirectionRu: "Волокна сходятся латерально к сухожилию, проходящему под акромионом.",
        actionsRu: Object.freeze([
          "Участвует в отведении плеча.",
          "Как часть вращательной манжеты помогает удерживать головку плечевой кости в суставной впадине.",
        ]),
        innervationRu: "Надлопаточный нерв, преимущественно C5–C6.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Ость лопатки", "акромион", "надостная ямка"]),
        relationsRu: Object.freeze(["Лежит глубже трапециевидной мышцы; сухожилие проходит под акромионом."]),
      }),
      movementCueRu: "Отведение плеча демонстрирует функцию мышцы, но не позволяет изолировать её работу от дельтовидной и остальных стабилизаторов.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, надостная мышца", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-shoulder-muscles", locator: "Supraspinatus", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-rotator-cuff", locator: "Muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "infraspinatus",
      kind: "muscle",
      names: Object.freeze({
        ru: "Подостная мышца",
        latin: "musculus infraspinatus",
        modelAliases: Object.freeze(["infraspinatus"]),
      }),
      subregions: Object.freeze(["posterior-shoulder", "rotator-cuff"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Подостная ямка лопатки."]),
        insertionRu: Object.freeze(["Средняя площадка большого бугорка плечевой кости."]),
        fiberDirectionRu: "Волокна сходятся латерально к задней поверхности плечевого сустава.",
        actionsRu: Object.freeze([
          "Наружно вращает плечо.",
          "Как часть вращательной манжеты стабилизирует головку плечевой кости.",
        ]),
        innervationRu: "Надлопаточный нерв, преимущественно C5–C6.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Ость лопатки", "подостная ямка", "латеральный край лопатки"]),
        relationsRu: Object.freeze(["Большая часть мышечного брюшка располагается ниже ости лопатки; латерально прикрывается дельтовидной мышцей."]),
      }),
      movementCueRu: "Наружное вращение плеча показывает основное направление действия.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, подостная мышца", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-infraspinatus", locator: "Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "teres-minor",
      kind: "muscle",
      names: Object.freeze({
        ru: "Малая круглая мышца",
        latin: "musculus teres minor",
        modelAliases: Object.freeze(["teres minor"]),
      }),
      subregions: Object.freeze(["posterior-shoulder", "rotator-cuff"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Верхние две трети латерального края лопатки."]),
        insertionRu: Object.freeze(["Нижняя площадка большого бугорка плечевой кости и прилежащая часть проксимального отдела плечевой кости."]),
        fiberDirectionRu: "Волокна идут латерально и несколько вверх от края лопатки к плечевой кости.",
        actionsRu: Object.freeze([
          "Наружно вращает плечо.",
          "Участвует в приведении плеча.",
          "Как часть вращательной манжеты стабилизирует головку плечевой кости.",
        ]),
        innervationRu: "Подмышечный нерв, преимущественно C5–C6.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Латеральный край лопатки", "нижний край подостной мышцы"]),
        relationsRu: Object.freeze(["Лежит ниже подостной мышцы и выше большой круглой; латеральная часть прикрыта дельтовидной мышцей."]),
      }),
      movementCueRu: "Наружное вращение плеча помогает связать положение мышцы с её действием.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, малая круглая мышца", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-teres-minor", locator: "Muscles; Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "subscapularis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Подлопаточная мышца",
        latin: "musculus subscapularis",
        modelAliases: Object.freeze(["subscapularis"]),
      }),
      subregions: Object.freeze(["anterior-scapular-region", "rotator-cuff", "axillary-wall"]),
      layer: "deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Подлопаточная ямка на передней поверхности лопатки."]),
        insertionRu: Object.freeze(["Малый бугорок плечевой кости; часть волокон и сухожилия связана с капсулой плечевого сустава."]),
        fiberDirectionRu: "Волокна сходятся латерально от передней поверхности лопатки к плечевой кости.",
        actionsRu: Object.freeze([
          "Вращает плечо внутрь.",
          "Участвует в приведении плеча.",
          "Как часть вращательной манжеты стабилизирует головку плечевой кости.",
        ]),
        innervationRu: "Верхний и нижний подлопаточные нервы, преимущественно C5–C7.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Передняя поверхность лопатки", "подмышечная область"]),
        relationsRu: Object.freeze(["Большая часть мышцы лежит между лопаткой и грудной клеткой и не относится к поверхностно доступным структурам."]),
      }),
      movementCueRu: "Внутреннее вращение плеча показывает функцию мышцы, но не даёт основания считать её изолированно доступной для пальпации.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, подлопаточная мышца", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-subscapularis", locator: "Structure and Function", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-rotator-cuff", locator: "Muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "teres-major",
      kind: "muscle",
      names: Object.freeze({
        ru: "Большая круглая мышца",
        latin: "musculus teres major",
        modelAliases: Object.freeze(["teres major"]),
      }),
      subregions: Object.freeze(["posterior-shoulder", "posterior-axillary-fold"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Задняя поверхность нижнего угла и прилежащей части латерального края лопатки."]),
        insertionRu: Object.freeze(["Медиальная губа межбугорковой борозды плечевой кости."]),
        fiberDirectionRu: "Волокна направляются вверх и латерально к переднемедиальной поверхности проксимальной плечевой кости.",
        actionsRu: Object.freeze([
          "Разгибает плечо.",
          "Приводит плечо.",
          "Вращает плечо внутрь.",
        ]),
        innervationRu: "Нижний подлопаточный нерв, обычно C5–C7.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Нижний угол лопатки", "задняя подмышечная складка"]),
        relationsRu: Object.freeze([
          "Лежит ниже малой круглой мышцы.",
          "Вместе с широчайшей мышцей участвует в формировании задней подмышечной складки.",
        ]),
      }),
      movementCueRu: "Приведение и внутреннее вращение плеча помогают понять направление тяги.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел VI, большая круглая мышца", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-teres-major", locator: "Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "serratus-anterior",
      kind: "muscle",
      names: Object.freeze({
        ru: "Передняя зубчатая мышца",
        latin: "musculus serratus anterior",
        modelAliases: Object.freeze(["serratus anterior", "serratus_anterior"]),
      }),
      subregions: Object.freeze(["lateral-thorax", "scapular-region"]),
      layer: "deep-to-scapula-superficially-visible-laterally",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Наружные поверхности верхних 8–9 рёбер."]),
        insertionRu: Object.freeze(["Передняя поверхность медиального края лопатки, особенно выраженно в области нижнего угла."]),
        fiberDirectionRu: "Пучки идут назад от боковой поверхности грудной клетки к медиальному краю лопатки.",
        actionsRu: Object.freeze([
          "Тянет лопатку вперёд по грудной клетке.",
          "Участвует во вращении лопатки вверх.",
          "Удерживает медиальный край лопатки прилежащим к грудной клетке.",
        ]),
        innervationRu: "Длинный грудной нерв, преимущественно C5–C7.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Боковая поверхность верхних рёбер", "медиальный край лопатки", "нижний угол лопатки"]),
        relationsRu: Object.freeze([
          "Большая часть мышцы располагается между лопаткой и грудной клеткой.",
          "Отдельные зубцы видны и доступны сбоку там, где их не перекрывают крупные поверхностные мышцы.",
        ]),
      }),
      movementCueRu: "Вытягивание руки вперёд и подъём руки над головой показывают движение лопатки, в котором участвует передняя зубчатая мышца.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 1.4 «Передняя зубчатая мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "course-anatomy-map-m5", locator: "4.6 «Лопатка и мышцы плечевого пояса»", role: "pedagogy" }),
        Object.freeze({ sourceId: "ncbi-serratus-anterior", locator: "Structure and Function", role: "verification" }),
      ]),
      illustrations: Object.freeze([
        Object.freeze({ sourceId: "gray-1918-plate-411", rightsStatus: "public-domain", purpose: "candidate-for-local-copy" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "erector-spinae",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Мышца, выпрямляющая позвоночник",
        latin: "musculus erector spinae",
        modelAliases: Object.freeze(["erector spinae", "iliocostalis", "longissimus", "spinalis"]),
      }),
      members: Object.freeze(["iliocostalis", "longissimus", "spinalis"]),
      subregions: Object.freeze(["thoracic-back", "lumbar-back", "posterior-neck"]),
      layer: "intrinsic-intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Широкое общее сухожильное начало связано с задней частью подвздошного гребня, крестцом, крестцово-подвздошными связками и нижними поясничными остистыми отростками.",
        ]),
        insertionRu: Object.freeze([
          "Пучки трёх колонн прикрепляются к рёбрам, поперечным и остистым отросткам позвонков и, для части длиннейшей мышцы, к сосцевидному отростку.",
        ]),
        fiberDirectionRu: "Три продольные колонны идут преимущественно вдоль позвоночника: подвздошно-рёберная латерально, длиннейшая промежуточно, остистая медиально.",
        actionsRu: Object.freeze([
          "При двустороннем сокращении разгибает позвоночник и помогает удерживать вертикальное положение.",
          "При одностороннем сокращении участвует в боковом сгибании позвоночника.",
        ]),
        innervationRu: "Задние ветви спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Крестец", "подвздошный гребень", "остистые отростки", "углы рёбер"]),
        relationsRu: Object.freeze([
          "В поясничной и нижнегрудной областях образует выраженную продольную мышечную массу глубже грудопоясничной фасции и поверхностных мышц.",
          "Подразделение на три колонны полезно для анатомии, но в базовой работе не требует попытки пальпаторно изолировать каждую часть.",
        ]),
      }),
      movementCueRu: "Разгибание туловища показывает общую функцию группы; отдельные части не следует трактовать как независимые двигатели.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 2.3 «Мышца, выпрямляющая позвоночник»", role: "teaching-source" }),
        Object.freeze({ sourceId: "course-anatomy-map-m6", locator: "4.4 «Разгибатели позвоночника»", role: "pedagogy" }),
        Object.freeze({ sourceId: "ncbi-back-muscles", locator: "Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-group" }),
    }),

    Object.freeze({
      id: "transversospinalis",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Поперечно-остистая группа",
        latin: "musculi transversospinales",
        modelAliases: Object.freeze(["semispinalis", "multifidus", "rotatores", "transversospinalis"]),
      }),
      members: Object.freeze(["semispinalis", "multifidus", "rotatores"]),
      subregions: Object.freeze(["deep-back", "posterior-neck"]),
      layer: "intrinsic-deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["В целом пучки начинаются от поперечных отростков и соседних задних элементов позвонков."]),
        insertionRu: Object.freeze(["В целом пучки идут к остистым отросткам вышележащих позвонков, пересекая различное число сегментов."]),
        fiberDirectionRu: "Пучки направлены вверх и медиально от поперечных отростков к остистым.",
        actionsRu: Object.freeze([
          "Участвуют в разгибании позвоночника.",
          "При односторонней работе участвуют во вращении позвоночника в противоположную сторону.",
          "Вносят вклад в сегментарную стабилизацию и проприоцептивный контроль.",
        ]),
        innervationRu: "Задние ветви спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Остистые и поперечные отростки позвоночника"]),
        relationsRu: Object.freeze([
          "Лежат глубже мышцы, выпрямляющей позвоночник.",
          "На живом человеке не следует обещать надёжную изоляцию отдельных глубоких пучков только по пальпации.",
        ]),
      }),
      movementCueRu: "Эта группа нужна прежде всего для понимания глубокого слоя и управления позвоночником, а не как набор отдельных поверхностных «мишеней».",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 2.4 «Поперечно-остистая мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-back-muscles", locator: "Structure and Function — deep intrinsic muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-group" }),
    }),

    Object.freeze({
      id: "serratus-posterior-superior",
      kind: "muscle",
      names: Object.freeze({
        ru: "Верхняя задняя зубчатая мышца",
        latin: "musculus serratus posterior superior",
        modelAliases: Object.freeze(["serratus posterior superior"]),
      }),
      subregions: Object.freeze(["upper-thoracic-back"]),
      layer: "intermediate-extrinsic",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Нижняя часть выйной связки и остистые отростки C7–T3."]),
        insertionRu: Object.freeze(["Верхние края II–V рёбер латеральнее их углов."]),
        fiberDirectionRu: "Волокна идут вниз и латерально от позвоночника к верхним рёбрам.",
        actionsRu: Object.freeze([
          "По направлению волокон может создавать подъём прикреплённых рёбер.",
          "Доказательств значимой роли мышцы в нормальном дыхании недостаточно; её традиционное описание как дыхательной мышцы не следует подавать как установленный факт.",
        ]),
        innervationRu: "Передние ветви верхних грудных спинномозговых нервов / межрёберные нервы соответствующих уровней.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["C7–T3", "II–V рёбра"]),
        relationsRu: Object.freeze(["Лежит глубже ромбовидных мышц и поверхностнее части собственных мышц спины."]),
      }),
      movementCueRu: "В справочнике мышца нужна для понимания слоя; отдельную дыхательную функцию демонстрировать как доказанную не следует.",
      sourceNotesRu: Object.freeze([
        "Классические учебники приписывают мышце подъём рёбер при вдохе. Электромиографические и анатомические данные ставят значимую дыхательную роль под сомнение.",
      ]),
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 1.5", role: "teaching-source" }),
        Object.freeze({ sourceId: "pubmed-serratus-posterior-function", locator: "Abstract", role: "evidence-check" }),
      ]),
      verification: Object.freeze({ status: "corrected-traditional-function" }),
    }),

    Object.freeze({
      id: "serratus-posterior-inferior",
      kind: "muscle",
      names: Object.freeze({
        ru: "Нижняя задняя зубчатая мышца",
        latin: "musculus serratus posterior inferior",
        modelAliases: Object.freeze(["serratus posterior inferior"]),
      }),
      subregions: Object.freeze(["thoracolumbar-back"]),
      layer: "intermediate-extrinsic",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Остистые отростки T11–L2 и грудопоясничная фасция."]),
        insertionRu: Object.freeze(["Нижние края IX–XII рёбер латеральнее их углов."]),
        fiberDirectionRu: "Волокна идут вверх и латерально от грудопоясничной области к нижним рёбрам.",
        actionsRu: Object.freeze([
          "По направлению волокон может создавать опускание нижних рёбер.",
          "Доказательств значимой роли мышцы в нормальном или форсированном дыхании недостаточно; дыхательную функцию нельзя подавать как установленную.",
        ]),
        innervationRu: "Передние ветви нижних грудных спинномозговых нервов / межрёберные и подрёберный нервы соответствующих уровней.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["T11–L2", "IX–XII рёбра", "грудопоясничная фасция"]),
        relationsRu: Object.freeze(["Лежит глубже широчайшей мышцы спины и поверхностнее части собственных мышц спины."]),
      }),
      movementCueRu: "Карточка нужна прежде всего для понимания слоёв грудопоясничной области.",
      sourceNotesRu: Object.freeze([
        "Традиционное описание как мышцы выдоха не подтверждается достаточно надёжными функциональными данными.",
      ]),
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 1.6", role: "teaching-source" }),
        Object.freeze({ sourceId: "pubmed-serratus-posterior-function", locator: "Abstract", role: "evidence-check" }),
      ]),
      verification: Object.freeze({ status: "corrected-traditional-function" }),
    }),

    Object.freeze({
      id: "splenius-capitis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Ременная мышца головы",
        latin: "musculus splenius capitis",
        modelAliases: Object.freeze(["splenius capitis"]),
      }),
      subregions: Object.freeze(["posterior-neck"]),
      layer: "intrinsic-superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Нижняя половина выйной связки и остистые отростки C7–T3/T4."]),
        insertionRu: Object.freeze(["Сосцевидный отросток височной кости и латеральная часть верхней выйной линии."]),
        fiberDirectionRu: "Волокна идут вверх и латерально.",
        actionsRu: Object.freeze([
          "При двустороннем сокращении разгибает голову и шею.",
          "При одностороннем сокращении поворачивает и наклоняет голову в свою сторону.",
        ]),
        innervationRu: "Задние ветви верхних шейных спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Сосцевидный отросток", "верхняя выйная линия", "заднебоковая поверхность шеи"]),
        relationsRu: Object.freeze(["Лежит глубже трапециевидной мышцы и частично грудино-ключично-сосцевидной, поверхностнее более глубоких разгибателей головы."]),
      }),
      movementCueRu: "Поворот головы в ту же сторону и разгибание шеи показывают направление действия группы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 2.1 «Ременная мышца головы»", role: "teaching-source" }),
        Object.freeze({ sourceId: "kenhub-splenius-capitis", locator: "Origin and insertion; Functions", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "splenius-cervicis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Ременная мышца шеи",
        latin: "musculus splenius cervicis",
        modelAliases: Object.freeze(["splenius cervicis"]),
      }),
      subregions: Object.freeze(["posterior-neck"]),
      layer: "intrinsic-superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Остистые отростки T3–T6."]),
        insertionRu: Object.freeze(["Поперечные отростки C1–C3, иногда C4."]),
        fiberDirectionRu: "Волокна идут вверх и латерально.",
        actionsRu: Object.freeze([
          "При двустороннем сокращении разгибает шейный отдел.",
          "При одностороннем сокращении поворачивает и наклоняет шею в свою сторону.",
        ]),
        innervationRu: "Задние ветви нижних шейных спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Нижняя часть задней поверхности шеи", "верхнегрудные остистые отростки"]),
        relationsRu: Object.freeze(["Лежит глубже трапециевидной мышцы и тесно связана с ременной мышцей головы."]),
      }),
      movementCueRu: "Поворот и боковое сгибание шеи в сторону сокращения помогают понять функцию мышцы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 2.2 «Ременная мышца шеи»", role: "teaching-source" }),
        Object.freeze({ sourceId: "kenhub-splenius-cervicis", locator: "Origin and insertion; Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "quadratus-lumborum",
      kind: "muscle",
      names: Object.freeze({
        ru: "Квадратная мышца поясницы",
        latin: "musculus quadratus lumborum",
        modelAliases: Object.freeze(["quadratus lumborum"]),
      }),
      subregions: Object.freeze(["posterior-abdominal-wall", "lumbar-region"]),
      layer: "deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Подвздошно-поясничная связка и задняя часть подвздошного гребня."]),
        insertionRu: Object.freeze(["Нижний край XII ребра и поперечные отростки верхних поясничных позвонков."]),
        fiberDirectionRu: "Мышца состоит из нескольких направлений пучков между подвздошным гребнем, XII ребром и поясничными поперечными отростками.",
        actionsRu: Object.freeze([
          "Участвует в боковом сгибании поясничного отдела.",
          "Может фиксировать XII ребро при движениях туловища и дыхании.",
          "Точный вклад отдельных пучков зависит от положения тела и задачи; упрощённое описание одной-единственной функции недостаточно.",
        ]),
        innervationRu: "Подрёберный нерв и передние ветви верхних поясничных нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["XII ребро", "подвздошный гребень", "латеральная поясничная область"]),
        relationsRu: Object.freeze(["Располагается глубоко в задней брюшной стенке; не следует считать её надёжно изолируемой при обычной поверхностной пальпации."]),
      }),
      movementCueRu: "Карточка нужна для понимания глубокого латерального слоя поясничной области, а не как инструкция по поиску отдельной «болезненной мышцы».",
      sources: Object.freeze([
        Object.freeze({ sourceId: "course-anatomy-map-m6", locator: "4.5 «Глубокий латеральный слой»", role: "pedagogy" }),
        Object.freeze({ sourceId: "ncbi-quadratus-lumborum", locator: "Introduction; Structure and Function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-functional-caution" }),
    }),

    Object.freeze({
      id: "interspinales",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Межостистые мышцы",
        latin: "musculi interspinales",
        modelAliases: Object.freeze(["interspinales", "interspinalis"]),
      }),
      subregions: Object.freeze(["deep-cervical-back", "deep-lumbar-back"]),
      layer: "intrinsic-deepest-segmental",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Парные короткие пучки начинаются от верхней поверхности остистого отростка нижележащего позвонка."]),
        insertionRu: Object.freeze(["Прикрепляются к нижней поверхности остистого отростка соседнего вышележащего позвонка."]),
        fiberDirectionRu: "Короткие почти вертикальные пучки соединяют соседние остистые отростки.",
        actionsRu: Object.freeze([
          "Помогают разгибанию шейного и поясничного отделов.",
          "Их более важная роль — сегментарная стабилизация и проприоцептивный контроль, а не создание большого движения.",
        ]),
        innervationRu: "Задние ветви соответствующих спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Остистые отростки соседних позвонков"]),
        relationsRu: Object.freeze([
          "Относятся к самому глубокому сегментарному слою собственных мышц спины.",
          "Хорошо развиты главным образом в шейном и поясничном отделах; в грудном отделе выражены слабо и могут отсутствовать на отдельных уровнях.",
        ]),
      }),
      movementCueRu: "В тренажёре нужны для точной послойной карты; отдельную поверхностную пальпацию или самостоятельное крупное движение им не приписываем.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 2.5 «Межостистые мышцы»", role: "teaching-source" }),
        Object.freeze({ sourceId: "kenhub-deep-back", locator: "Deepest layer — Interspinales", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-thoracic-vertebrae", locator: "Muscles — short intersegmental muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-functional-caution" }),
    }),

    Object.freeze({
      id: "intertransversarii",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Межпоперечные мышцы",
        latin: "musculi intertransversarii",
        modelAliases: Object.freeze(["intertransversarii", "intertransversarius"]),
      }),
      subregions: Object.freeze(["deep-cervical-back", "deep-lumbar-back"]),
      layer: "intrinsic-deepest-segmental",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Короткие пучки начинаются от поперечных и связанных с ними добавочных отростков одного позвонка."]),
        insertionRu: Object.freeze(["Соединяются с поперечным, добавочным или сосцевидным отростком соседнего позвонка; точная организация зависит от отдела позвоночника."]),
        fiberDirectionRu: "Короткие вертикальные или слегка косые пучки соединяют соседние поперечные элементы позвонков.",
        actionsRu: Object.freeze([
          "Участвуют в ипсилатеральном боковом сгибании шейного и поясничного отделов.",
          "Существенна их роль в сегментарной стабилизации и проприоцептивном контроле.",
        ]),
        innervationRu: "Иннервация зависит от части и уровня: используются передние и задние ветви соответствующих шейных и поясничных спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Поперечные отростки соседних позвонков"]),
        relationsRu: Object.freeze([
          "Относятся к самому глубокому сегментарному слою.",
          "Лучше развиты в шейном и поясничном отделах; отдельные компоненты имеют различную иннервацию, поэтому их нельзя без оговорок описывать как единую типичную собственную мышцу спины.",
        ]),
      }),
      movementCueRu: "Основная учебная ценность — показать сегментарный глубокий слой и стабилизацию, а не создавать отдельную ручную задачу.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел I, 2.6 «Межпоперечные мышцы»", role: "teaching-source" }),
        Object.freeze({ sourceId: "kenhub-deep-back", locator: "Deepest layer — Intertransversarii", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-lumbar-vertebrae", locator: "Muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-innervation-nuance" }),
    }),

    Object.freeze({
      id: "levatores-costarum",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Мышцы, поднимающие рёбра",
        latin: "musculi levatores costarum",
        modelAliases: Object.freeze(["levatores costarum", "levatores costarum breves", "levatores costarum longi"]),
      }),
      subregions: Object.freeze(["deep-thoracic-back"]),
      layer: "intrinsic-deepest-segmental",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Поперечные отростки C7–T11."]),
        insertionRu: Object.freeze([
          "Короткие мышцы прикрепляются к верхнему краю и наружной поверхности следующего нижележащего ребра между бугорком и углом.",
          "Длинные пучки, когда присутствуют, перекидываются через одно ребро.",
        ]),
        fiberDirectionRu: "Пучки идут вниз и латерально от поперечных отростков к рёбрам.",
        actionsRu: Object.freeze([
          "Могут поднимать рёбра.",
          "Участвуют в небольшом боковом сгибании и вращении грудного отдела.",
          "Вклад в дыхание возможен, но его не следует представлять как основную или хорошо количественно установленную дыхательную функцию.",
        ]),
        innervationRu: "Латеральные ветви задних ветвей грудных спинномозговых нервов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Поперечные отростки C7–T11", "углы рёбер"]),
        relationsRu: Object.freeze([
          "Лежат в самом глубоком слое грудной части спины, латеральнее rotatores и медиальнее наружных межрёберных мышц.",
        ]),
      }),
      movementCueRu: "Карточка нужна для завершения глубокого слоя грудной области; отдельную дыхательную «мишень» из этих мышц не создаём.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Posterior thorax — levatores costarum", role: "verification" }),
        Object.freeze({ sourceId: "kenhub-deep-back", locator: "Deepest layer — Levatores costarum", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-respiratory-caution" }),
    }),

  ]),
});

export const BACK_SHOULDER_STRUCTURE_COUNT = BACK_SHOULDER_REGION.structures.length;

export function backShoulderStructureById(id) {
  return BACK_SHOULDER_REGION.structures.find((item) => item.id === id) || null;
}
