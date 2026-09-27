function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const BACK_SHOULDER_REGION = deepFreeze({
  "id": "back-shoulder",
  "nameRu": "Спина и плечевой пояс",
  "status": "verified-v1",
  "scopeRu": "Поверхностные и более глубокие слои спины, мышцы лопаточного комплекса и мышцы, непосредственно действующие на плечевой сустав.",
  "teachingPrinciplesRu": [
    "Сначала показывать область и слой, затем отдельную мышцу.",
    "Не приписывать сложное движение одной мышце, если оно создаётся совместной работой нескольких структур.",
    "Не считать глубокую мышцу надёжно изолируемой пальпацией только потому, что известна её анатомическая проекция.",
    "Для групп глубоких мышц хранить отдельную карточку группы, если это точнее и полезнее, чем искусственное дробление."
  ],
  "structures": [
    {
      "id": "trapezius",
      "kind": "muscle",
      "names": {
        "ru": "Трапециевидная мышца",
        "latin": "musculus trapezius",
        "modelAliases": [
          "trapezius"
        ]
      },
      "subregions": [
        "upper-back",
        "posterior-neck",
        "scapular-region"
      ],
      "layer": "superficial",
      "anatomy": {
        "originRu": [
          "Наружный затылочный выступ и медиальная часть верхней выйной линии.",
          "Выйная связка.",
          "Остистые отростки C7–T12 и связанные с ними надостистые связки."
        ],
        "insertionRu": [
          "Латеральная треть ключицы.",
          "Акромион.",
          "Ость лопатки."
        ],
        "fiberDirectionRu": "Верхние пучки идут вниз и латерально, средние — преимущественно поперечно, нижние — вверх и латерально к ости лопатки.",
        "actionsRu": [
          "Верхние пучки поднимают лопатку и участвуют в её вращении вверх.",
          "Средние пучки приводят лопатку к позвоночнику.",
          "Нижние пучки опускают лопатку и вместе с верхними участвуют в её вращении вверх.",
          "Мышца стабилизирует лопатку при движениях верхней конечности."
        ],
        "innervationRu": "Двигательная иннервация — добавочный нерв (XI); чувствительно-проприоцептивные волокна — шейные нервы C3–C4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Наружный затылочный выступ",
          "ключица",
          "акромион",
          "ость лопатки",
          "срединная линия грудного отдела"
        ],
        "relationsRu": [
          "Образует крупный поверхностный пласт верхней части спины.",
          "Перекрывает ромбовидные мышцы и часть мышцы, поднимающей лопатку.",
          "Перекрывает часть надостной мышцы."
        ]
      },
      "movementCueRu": "Подъём плечевого пояса, сведение лопаток и подъём руки над головой показывают разные направления работы пучков.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 1.1 «Трапециевидная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "course-anatomy-map-m6",
          "locator": "4.2 «Поверхностный слой спины»",
          "role": "pedagogy"
        },
        {
          "sourceId": "ncbi-trapezius",
          "locator": "Introduction; Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "latissimus-dorsi",
      "kind": "muscle",
      "names": {
        "ru": "Широчайшая мышца спины",
        "latin": "musculus latissimus dorsi",
        "modelAliases": [
          "latissimus dorsi",
          "latissimus_dorsi"
        ]
      },
      "subregions": [
        "lower-back",
        "lateral-back",
        "posterior-axillary-fold"
      ],
      "layer": "superficial",
      "anatomy": {
        "originRu": [
          "Остистые отростки нижних грудных позвонков через грудопоясничную фасцию.",
          "Грудопоясничная фасция и связанные с ней пояснично-крестцовые прикрепления.",
          "Задняя часть подвздошного гребня.",
          "Нижние 3–4 ребра."
        ],
        "insertionRu": [
          "Дно межбугорковой борозды плечевой кости."
        ],
        "fiberDirectionRu": "Волокна сходятся вверх и латерально к плечевой кости.",
        "actionsRu": [
          "Разгибает плечо.",
          "Приводит плечо.",
          "Вращает плечо внутрь.",
          "При фиксированных верхних конечностях помогает подтягивать туловище к рукам."
        ],
        "innervationRu": "Грудоспинной нерв, преимущественно C6–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвздошный гребень",
          "нижние рёбра",
          "задняя подмышечная складка"
        ],
        "relationsRu": [
          "Формирует широкий поверхностный пласт нижней и боковой части спины.",
          "Вместе с большой круглой мышцей участвует в формировании задней подмышечной складки.",
          "Перекрывает часть разгибателей позвоночника."
        ]
      },
      "movementCueRu": "Приведение и разгибание плеча хорошо показывают направление тяги мышцы.",
      "sourceNotesRu": [
        "В «Миологии» ИГМА прикрепление описано как гребень малого бугорка. В справочнике принято современное описание — дно межбугорковой борозды плечевой кости."
      ],
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 1.2 «Широчайшая мышца спины»",
          "role": "teaching-source"
        },
        {
          "sourceId": "course-anatomy-map-m6",
          "locator": "4.2 «Поверхностный слой спины»",
          "role": "pedagogy"
        },
        {
          "sourceId": "ncbi-latissimus-dorsi",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "illustrations": [
        {
          "sourceId": "gray-1918-plate-409",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ],
      "verification": {
        "status": "cross-checked-with-correction"
      }
    },
    {
      "id": "rhomboid-minor",
      "kind": "muscle",
      "names": {
        "ru": "Малая ромбовидная мышца",
        "latin": "musculus rhomboideus minor",
        "modelAliases": [
          "rhomboid minor",
          "rhomboideus minor"
        ]
      },
      "subregions": [
        "scapular-region",
        "interscapular-region"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Нижняя часть выйной связки и остистые отростки C7–T1."
        ],
        "insertionRu": [
          "Медиальный конец ости лопатки."
        ],
        "fiberDirectionRu": "Волокна идут вниз и латерально от позвоночника к лопатке.",
        "actionsRu": [
          "Приводит лопатку к позвоночнику.",
          "Участвует во вращении лопатки вниз.",
          "Помогает удерживать медиальный край лопатки у грудной клетки."
        ],
        "innervationRu": "Дорсальный нерв лопатки, преимущественно C4–C5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ость лопатки",
          "медиальный край лопатки"
        ],
        "relationsRu": [
          "Лежит глубже трапециевидной мышцы и выше большой ромбовидной."
        ]
      },
      "movementCueRu": "Приведение лопаток делает направление тяги группы понятнее, но не изолирует малую ромбовидную мышцу от большой.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, ромбовидные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-rhomboids",
          "locator": "Structure and Function; Nerves",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "rhomboid-major",
      "kind": "muscle",
      "names": {
        "ru": "Большая ромбовидная мышца",
        "latin": "musculus rhomboideus major",
        "modelAliases": [
          "rhomboid major",
          "rhomboideus major"
        ]
      },
      "subregions": [
        "scapular-region",
        "interscapular-region"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Остистые отростки T2–T5 и прилежащие надостистые связки."
        ],
        "insertionRu": [
          "Медиальный край лопатки от уровня ости до нижнего угла."
        ],
        "fiberDirectionRu": "Волокна идут вниз и латерально к медиальному краю лопатки.",
        "actionsRu": [
          "Приводит лопатку к позвоночнику.",
          "Участвует во вращении лопатки вниз.",
          "Стабилизирует лопатку на грудной клетке."
        ],
        "innervationRu": "Дорсальный нерв лопатки, преимущественно C4–C5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальный край лопатки",
          "нижний угол лопатки",
          "ость лопатки"
        ],
        "relationsRu": [
          "Лежит глубже трапециевидной мышцы и ниже малой ромбовидной."
        ]
      },
      "movementCueRu": "Приведение лопатки к позвоночнику показывает функцию ромбовидной группы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 1.3 «Большая ромбовидная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-rhomboids",
          "locator": "Structure and Function; Nerves",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "levator-scapulae",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, поднимающая лопатку",
        "latin": "musculus levator scapulae",
        "modelAliases": [
          "levator scapulae"
        ]
      },
      "subregions": [
        "posterolateral-neck",
        "superior-scapular-region"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Поперечные отростки C1–C4."
        ],
        "insertionRu": [
          "Медиальный край лопатки между верхним углом и корнем ости лопатки."
        ],
        "fiberDirectionRu": "Волокна идут вниз и латерально от верхних шейных позвонков к верхнему углу лопатки.",
        "actionsRu": [
          "Поднимает лопатку.",
          "Участвует во вращении лопатки вниз.",
          "При фиксированной лопатке участвует в разгибании и ипсилатеральном боковом сгибании шеи."
        ],
        "innervationRu": "Дорсальный нерв лопатки и передние ветви C3–C4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Верхний угол лопатки",
          "медиальный край лопатки",
          "верхнебоковая поверхность шеи"
        ],
        "relationsRu": [
          "Нижняя часть перекрыта трапециевидной мышцей; верхняя располагается глубже грудино-ключично-сосцевидной и ременной мышцы головы."
        ]
      },
      "movementCueRu": "Подъём лопатки показывает основное действие; точное выделение мышцы по рельефу ограничено перекрывающими структурами.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 1.4 «Мышца, поднимающая лопатку»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-levator-scapulae",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "deltoid",
      "kind": "muscle",
      "names": {
        "ru": "Дельтовидная мышца",
        "latin": "musculus deltoideus",
        "modelAliases": [
          "deltoid"
        ]
      },
      "subregions": [
        "shoulder"
      ],
      "layer": "superficial",
      "anatomy": {
        "originRu": [
          "Латеральная треть ключицы.",
          "Акромион.",
          "Ость лопатки."
        ],
        "insertionRu": [
          "Дельтовидная бугристость плечевой кости."
        ],
        "fiberDirectionRu": "Передняя, средняя и задняя части имеют различное направление волокон и различный вклад в движение плеча.",
        "actionsRu": [
          "Средняя часть преимущественно отводит плечо.",
          "Передняя часть участвует в сгибании и внутреннем вращении плеча.",
          "Задняя часть участвует в разгибании и наружном вращении плеча."
        ],
        "innervationRu": "Подмышечный нерв, преимущественно C5–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Акромион",
          "латеральная ключица",
          "ость лопатки"
        ],
        "relationsRu": [
          "Покрывает плечевой сустав и часть сухожилий вращательной манжеты."
        ]
      },
      "movementCueRu": "Отведение плеча делает среднюю часть мышцы наиболее заметной.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, дельтовидная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "course-anatomy-map-m5",
          "locator": "4.5 «Область плечевого сустава»",
          "role": "pedagogy"
        },
        {
          "sourceId": "ncbi-shoulder-muscles",
          "locator": "Scapulohumeral muscles — Deltoid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "supraspinatus",
      "kind": "muscle",
      "names": {
        "ru": "Надостная мышца",
        "latin": "musculus supraspinatus",
        "modelAliases": [
          "supraspinatus"
        ]
      },
      "subregions": [
        "posterior-shoulder",
        "rotator-cuff"
      ],
      "layer": "deep-to-trapezius",
      "anatomy": {
        "originRu": [
          "Надостная ямка лопатки."
        ],
        "insertionRu": [
          "Верхняя площадка большого бугорка плечевой кости."
        ],
        "fiberDirectionRu": "Волокна сходятся латерально к сухожилию, проходящему под акромионом.",
        "actionsRu": [
          "Участвует в отведении плеча.",
          "Как часть вращательной манжеты помогает удерживать головку плечевой кости в суставной впадине."
        ],
        "innervationRu": "Надлопаточный нерв, преимущественно C5–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ость лопатки",
          "акромион",
          "надостная ямка"
        ],
        "relationsRu": [
          "Лежит глубже трапециевидной мышцы; сухожилие проходит под акромионом."
        ]
      },
      "movementCueRu": "Отведение плеча демонстрирует функцию мышцы, но не позволяет изолировать её работу от дельтовидной и остальных стабилизаторов.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, надостная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-shoulder-muscles",
          "locator": "Supraspinatus",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-rotator-cuff",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "infraspinatus",
      "kind": "muscle",
      "names": {
        "ru": "Подостная мышца",
        "latin": "musculus infraspinatus",
        "modelAliases": [
          "infraspinatus"
        ]
      },
      "subregions": [
        "posterior-shoulder",
        "rotator-cuff"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Подостная ямка лопатки."
        ],
        "insertionRu": [
          "Средняя площадка большого бугорка плечевой кости."
        ],
        "fiberDirectionRu": "Волокна сходятся латерально к задней поверхности плечевого сустава.",
        "actionsRu": [
          "Наружно вращает плечо.",
          "Как часть вращательной манжеты стабилизирует головку плечевой кости."
        ],
        "innervationRu": "Надлопаточный нерв, преимущественно C5–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ость лопатки",
          "подостная ямка",
          "латеральный край лопатки"
        ],
        "relationsRu": [
          "Большая часть мышечного брюшка располагается ниже ости лопатки; латерально прикрывается дельтовидной мышцей."
        ]
      },
      "movementCueRu": "Наружное вращение плеча показывает основное направление действия.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, подостная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-infraspinatus",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "teres-minor",
      "kind": "muscle",
      "names": {
        "ru": "Малая круглая мышца",
        "latin": "musculus teres minor",
        "modelAliases": [
          "teres minor"
        ]
      },
      "subregions": [
        "posterior-shoulder",
        "rotator-cuff"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Верхние две трети латерального края лопатки."
        ],
        "insertionRu": [
          "Нижняя площадка большого бугорка плечевой кости и прилежащая часть проксимального отдела плечевой кости."
        ],
        "fiberDirectionRu": "Волокна идут латерально и несколько вверх от края лопатки к плечевой кости.",
        "actionsRu": [
          "Наружно вращает плечо.",
          "Участвует в приведении плеча.",
          "Как часть вращательной манжеты стабилизирует головку плечевой кости."
        ],
        "innervationRu": "Подмышечный нерв, преимущественно C5–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный край лопатки",
          "нижний край подостной мышцы"
        ],
        "relationsRu": [
          "Лежит ниже подостной мышцы и выше большой круглой; латеральная часть прикрыта дельтовидной мышцей."
        ]
      },
      "movementCueRu": "Наружное вращение плеча помогает связать положение мышцы с её действием.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, малая круглая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-teres-minor",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "subscapularis",
      "kind": "muscle",
      "names": {
        "ru": "Подлопаточная мышца",
        "latin": "musculus subscapularis",
        "modelAliases": [
          "subscapularis"
        ]
      },
      "subregions": [
        "anterior-scapular-region",
        "rotator-cuff",
        "axillary-wall"
      ],
      "layer": "deep",
      "anatomy": {
        "originRu": [
          "Подлопаточная ямка на передней поверхности лопатки."
        ],
        "insertionRu": [
          "Малый бугорок плечевой кости; часть волокон и сухожилия связана с капсулой плечевого сустава."
        ],
        "fiberDirectionRu": "Волокна сходятся латерально от передней поверхности лопатки к плечевой кости.",
        "actionsRu": [
          "Вращает плечо внутрь.",
          "Участвует в приведении плеча.",
          "Как часть вращательной манжеты стабилизирует головку плечевой кости."
        ],
        "innervationRu": "Верхний и нижний подлопаточные нервы, преимущественно C5–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность лопатки",
          "подмышечная область"
        ],
        "relationsRu": [
          "Большая часть мышцы лежит между лопаткой и грудной клеткой и не относится к поверхностно доступным структурам."
        ]
      },
      "movementCueRu": "Внутреннее вращение плеча показывает функцию мышцы, но не даёт основания считать её изолированно доступной для пальпации.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, подлопаточная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-subscapularis",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-rotator-cuff",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "teres-major",
      "kind": "muscle",
      "names": {
        "ru": "Большая круглая мышца",
        "latin": "musculus teres major",
        "modelAliases": [
          "teres major"
        ]
      },
      "subregions": [
        "posterior-shoulder",
        "posterior-axillary-fold"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Задняя поверхность нижнего угла и прилежащей части латерального края лопатки."
        ],
        "insertionRu": [
          "Медиальная губа межбугорковой борозды плечевой кости."
        ],
        "fiberDirectionRu": "Волокна направляются вверх и латерально к переднемедиальной поверхности проксимальной плечевой кости.",
        "actionsRu": [
          "Разгибает плечо.",
          "Приводит плечо.",
          "Вращает плечо внутрь."
        ],
        "innervationRu": "Нижний подлопаточный нерв, обычно C5–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижний угол лопатки",
          "задняя подмышечная складка"
        ],
        "relationsRu": [
          "Лежит ниже малой круглой мышцы.",
          "Вместе с широчайшей мышцей участвует в формировании задней подмышечной складки."
        ]
      },
      "movementCueRu": "Приведение и внутреннее вращение плеча помогают понять направление тяги.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, большая круглая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-teres-major",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "serratus-anterior",
      "kind": "muscle",
      "names": {
        "ru": "Передняя зубчатая мышца",
        "latin": "musculus serratus anterior",
        "modelAliases": [
          "serratus anterior",
          "serratus_anterior"
        ]
      },
      "subregions": [
        "lateral-thorax",
        "scapular-region"
      ],
      "layer": "deep-to-scapula-superficially-visible-laterally",
      "anatomy": {
        "originRu": [
          "Наружные поверхности верхних 8–9 рёбер."
        ],
        "insertionRu": [
          "Передняя поверхность медиального края лопатки, особенно выраженно в области нижнего угла."
        ],
        "fiberDirectionRu": "Пучки идут назад от боковой поверхности грудной клетки к медиальному краю лопатки.",
        "actionsRu": [
          "Тянет лопатку вперёд по грудной клетке.",
          "Участвует во вращении лопатки вверх.",
          "Удерживает медиальный край лопатки прилежащим к грудной клетке."
        ],
        "innervationRu": "Длинный грудной нерв, преимущественно C5–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Боковая поверхность верхних рёбер",
          "медиальный край лопатки",
          "нижний угол лопатки"
        ],
        "relationsRu": [
          "Большая часть мышцы располагается между лопаткой и грудной клеткой.",
          "Отдельные зубцы видны и доступны сбоку там, где их не перекрывают крупные поверхностные мышцы."
        ]
      },
      "movementCueRu": "Вытягивание руки вперёд и подъём руки над головой показывают движение лопатки, в котором участвует передняя зубчатая мышца.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 1.4 «Передняя зубчатая мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "course-anatomy-map-m5",
          "locator": "4.6 «Лопатка и мышцы плечевого пояса»",
          "role": "pedagogy"
        },
        {
          "sourceId": "ncbi-serratus-anterior",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "illustrations": [
        {
          "sourceId": "gray-1918-plate-411",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "erector-spinae",
      "kind": "muscle-group",
      "names": {
        "ru": "Мышца, выпрямляющая позвоночник",
        "latin": "musculus erector spinae",
        "modelAliases": [
          "erector spinae"
        ]
      },
      "members": [
        "iliocostalis",
        "longissimus",
        "spinalis"
      ],
      "subregions": [
        "thoracic-back",
        "lumbar-back",
        "posterior-neck"
      ],
      "layer": "intrinsic-intermediate",
      "anatomy": {
        "originRu": [
          "Широкое общее сухожильное начало связано с задней частью подвздошного гребня, крестцом, крестцово-подвздошными связками и нижними поясничными остистыми отростками."
        ],
        "insertionRu": [
          "Пучки трёх колонн прикрепляются к рёбрам, поперечным и остистым отросткам позвонков и, для части длиннейшей мышцы, к сосцевидному отростку."
        ],
        "fiberDirectionRu": "Три продольные колонны идут преимущественно вдоль позвоночника: подвздошно-рёберная латерально, длиннейшая промежуточно, остистая медиально.",
        "actionsRu": [
          "При двустороннем сокращении разгибает позвоночник и помогает удерживать вертикальное положение.",
          "При одностороннем сокращении участвует в боковом сгибании позвоночника."
        ],
        "innervationRu": "Задние ветви спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крестец",
          "подвздошный гребень",
          "остистые отростки",
          "углы рёбер"
        ],
        "relationsRu": [
          "В поясничной и нижнегрудной областях образует выраженную продольную мышечную массу глубже грудопоясничной фасции и поверхностных мышц.",
          "Подразделение на три колонны полезно для анатомии, но в базовой работе не требует попытки пальпаторно изолировать каждую часть."
        ]
      },
      "movementCueRu": "Разгибание туловища показывает общую функцию группы; отдельные части не следует трактовать как независимые двигатели.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.3 «Мышца, выпрямляющая позвоночник»",
          "role": "teaching-source"
        },
        {
          "sourceId": "course-anatomy-map-m6",
          "locator": "4.4 «Разгибатели позвоночника»",
          "role": "pedagogy"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "transversospinalis",
      "kind": "muscle-group",
      "names": {
        "ru": "Поперечно-остистая группа",
        "latin": "musculi transversospinales",
        "modelAliases": [
          "transversospinalis",
          "transversospinalis group"
        ]
      },
      "members": [
        "semispinalis",
        "multifidus",
        "rotatores"
      ],
      "subregions": [
        "deep-back",
        "posterior-neck"
      ],
      "layer": "intrinsic-deep",
      "anatomy": {
        "originRu": [
          "В целом пучки начинаются от поперечных отростков и соседних задних элементов позвонков."
        ],
        "insertionRu": [
          "В целом пучки идут к остистым отросткам вышележащих позвонков, пересекая различное число сегментов."
        ],
        "fiberDirectionRu": "Пучки направлены вверх и медиально от поперечных отростков к остистым.",
        "actionsRu": [
          "Участвуют в разгибании позвоночника.",
          "При односторонней работе участвуют во вращении позвоночника в противоположную сторону.",
          "Вносят вклад в сегментарную стабилизацию и проприоцептивный контроль."
        ],
        "innervationRu": "Задние ветви спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Остистые и поперечные отростки позвоночника"
        ],
        "relationsRu": [
          "Лежат глубже мышцы, выпрямляющей позвоночник.",
          "На живом человеке не следует обещать надёжную изоляцию отдельных глубоких пучков только по пальпации."
        ]
      },
      "movementCueRu": "Эта группа нужна прежде всего для понимания глубокого слоя и управления позвоночником, а не как набор отдельных поверхностных «мишеней».",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.4 «Поперечно-остистая мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Structure and Function — deep intrinsic muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "serratus-posterior-superior",
      "kind": "muscle",
      "names": {
        "ru": "Верхняя задняя зубчатая мышца",
        "latin": "musculus serratus posterior superior",
        "modelAliases": [
          "serratus posterior superior"
        ]
      },
      "subregions": [
        "upper-thoracic-back"
      ],
      "layer": "intermediate-extrinsic",
      "anatomy": {
        "originRu": [
          "Нижняя часть выйной связки и остистые отростки C7–T3."
        ],
        "insertionRu": [
          "Верхние края II–V рёбер латеральнее их углов."
        ],
        "fiberDirectionRu": "Волокна идут вниз и латерально от позвоночника к верхним рёбрам.",
        "actionsRu": [
          "По направлению волокон может создавать подъём прикреплённых рёбер.",
          "Доказательств значимой роли мышцы в нормальном дыхании недостаточно; её традиционное описание как дыхательной мышцы не следует подавать как установленный факт."
        ],
        "innervationRu": "Передние ветви верхних грудных спинномозговых нервов / межрёберные нервы соответствующих уровней."
      },
      "surfaceMap": {
        "landmarksRu": [
          "C7–T3",
          "II–V рёбра"
        ],
        "relationsRu": [
          "Лежит глубже ромбовидных мышц и поверхностнее части собственных мышц спины."
        ]
      },
      "movementCueRu": "Сначала определить слой под ромбовидными мышцами и связь с II–V рёбрами; значимую дыхательную роль не считать установленной.",
      "sourceNotesRu": [
        "Классические учебники приписывают мышце подъём рёбер при вдохе. Электромиографические и анатомические данные ставят значимую дыхательную роль под сомнение."
      ],
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 1.5",
          "role": "teaching-source"
        },
        {
          "sourceId": "pubmed-serratus-posterior-function",
          "locator": "Abstract",
          "role": "evidence-check"
        }
      ],
      "verification": {
        "status": "corrected-traditional-function"
      }
    },
    {
      "id": "serratus-posterior-inferior",
      "kind": "muscle",
      "names": {
        "ru": "Нижняя задняя зубчатая мышца",
        "latin": "musculus serratus posterior inferior",
        "modelAliases": [
          "serratus posterior inferior"
        ]
      },
      "subregions": [
        "thoracolumbar-back"
      ],
      "layer": "intermediate-extrinsic",
      "anatomy": {
        "originRu": [
          "Остистые отростки T11–L2 и грудопоясничная фасция."
        ],
        "insertionRu": [
          "Нижние края IX–XII рёбер латеральнее их углов."
        ],
        "fiberDirectionRu": "Волокна идут вверх и латерально от грудопоясничной области к нижним рёбрам.",
        "actionsRu": [
          "По направлению волокон может создавать опускание нижних рёбер.",
          "Доказательств значимой роли мышцы в нормальном или форсированном дыхании недостаточно; дыхательную функцию нельзя подавать как установленную."
        ],
        "innervationRu": "Передние ветви нижних грудных спинномозговых нервов / межрёберные и подрёберный нервы соответствующих уровней."
      },
      "surfaceMap": {
        "landmarksRu": [
          "T11–L2",
          "IX–XII рёбра",
          "грудопоясничная фасция"
        ],
        "relationsRu": [
          "Лежит глубже широчайшей мышцы спины и поверхностнее части собственных мышц спины."
        ]
      },
      "movementCueRu": "Ориентироваться на слой под широчайшей мышцей и прикрепления к IX–XII рёбрам; не сводить функцию к правилу «мышца выдоха».",
      "sourceNotesRu": [
        "Традиционное описание как мышцы выдоха не подтверждается достаточно надёжными функциональными данными."
      ],
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 1.6",
          "role": "teaching-source"
        },
        {
          "sourceId": "pubmed-serratus-posterior-function",
          "locator": "Abstract",
          "role": "evidence-check"
        }
      ],
      "verification": {
        "status": "corrected-traditional-function"
      }
    },
    {
      "id": "splenius-capitis",
      "kind": "muscle",
      "names": {
        "ru": "Ременная мышца головы",
        "latin": "musculus splenius capitis",
        "modelAliases": [
          "splenius capitis"
        ]
      },
      "subregions": [
        "posterior-neck"
      ],
      "layer": "intrinsic-superficial",
      "anatomy": {
        "originRu": [
          "Нижняя половина выйной связки и остистые отростки C7–T3/T4."
        ],
        "insertionRu": [
          "Сосцевидный отросток височной кости и латеральная часть верхней выйной линии."
        ],
        "fiberDirectionRu": "Волокна идут вверх и латерально.",
        "actionsRu": [
          "При двустороннем сокращении разгибает голову и шею.",
          "При одностороннем сокращении поворачивает и наклоняет голову в свою сторону."
        ],
        "innervationRu": "Задние ветви верхних шейных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Сосцевидный отросток",
          "верхняя выйная линия",
          "заднебоковая поверхность шеи"
        ],
        "relationsRu": [
          "Лежит глубже трапециевидной мышцы и частично грудино-ключично-сосцевидной, поверхностнее более глубоких разгибателей головы."
        ]
      },
      "movementCueRu": "Поворот головы в ту же сторону и разгибание шеи показывают направление действия группы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.1 «Ременная мышца головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "kenhub-splenius-capitis",
          "locator": "Origin and insertion; Functions",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "splenius-cervicis",
      "kind": "muscle",
      "names": {
        "ru": "Ременная мышца шеи",
        "latin": "musculus splenius cervicis",
        "modelAliases": [
          "splenius cervicis"
        ]
      },
      "subregions": [
        "posterior-neck"
      ],
      "layer": "intrinsic-superficial",
      "anatomy": {
        "originRu": [
          "Остистые отростки T3–T6."
        ],
        "insertionRu": [
          "Поперечные отростки C1–C3, иногда C4."
        ],
        "fiberDirectionRu": "Волокна идут вверх и латерально.",
        "actionsRu": [
          "При двустороннем сокращении разгибает шейный отдел.",
          "При одностороннем сокращении поворачивает и наклоняет шею в свою сторону."
        ],
        "innervationRu": "Задние ветви нижних шейных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя часть задней поверхности шеи",
          "верхнегрудные остистые отростки"
        ],
        "relationsRu": [
          "Лежит глубже трапециевидной мышцы и тесно связана с ременной мышцей головы."
        ]
      },
      "movementCueRu": "Поворот и боковое сгибание шеи в сторону сокращения помогают понять функцию мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.2 «Ременная мышца шеи»",
          "role": "teaching-source"
        },
        {
          "sourceId": "kenhub-splenius-cervicis",
          "locator": "Origin and insertion; Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "quadratus-lumborum",
      "kind": "muscle",
      "names": {
        "ru": "Квадратная мышца поясницы",
        "latin": "musculus quadratus lumborum",
        "modelAliases": [
          "quadratus lumborum"
        ]
      },
      "subregions": [
        "posterior-abdominal-wall",
        "lumbar-region"
      ],
      "layer": "deep",
      "anatomy": {
        "originRu": [
          "Подвздошно-поясничная связка и задняя часть подвздошного гребня."
        ],
        "insertionRu": [
          "Нижний край XII ребра и поперечные отростки верхних поясничных позвонков."
        ],
        "fiberDirectionRu": "Мышца состоит из нескольких направлений пучков между подвздошным гребнем, XII ребром и поясничными поперечными отростками.",
        "actionsRu": [
          "Участвует в боковом сгибании поясничного отдела.",
          "Может фиксировать XII ребро при движениях туловища и дыхании.",
          "Точный вклад отдельных пучков зависит от положения тела и задачи; упрощённое описание одной-единственной функции недостаточно."
        ],
        "innervationRu": "Подрёберный нерв и передние ветви верхних поясничных нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "XII ребро",
          "подвздошный гребень",
          "латеральная поясничная область"
        ],
        "relationsRu": [
          "Располагается глубоко в задней брюшной стенке; не следует считать её надёжно изолируемой при обычной поверхностной пальпации."
        ]
      },
      "movementCueRu": "Ориентироваться на XII ребро, подвздошный гребень и поперечные отростки поясничных позвонков; мышца лежит глубоко и плохо изолируется с поверхности.",
      "sources": [
        {
          "sourceId": "course-anatomy-map-m6",
          "locator": "4.5 «Глубокий латеральный слой»",
          "role": "pedagogy"
        },
        {
          "sourceId": "ncbi-quadratus-lumborum",
          "locator": "Introduction; Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-functional-caution"
      }
    },
    {
      "id": "iliocostalis",
      "kind": "muscle-group",
      "names": {
        "ru": "Подвздошно-рёберная мышца",
        "latin": "musculus iliocostalis",
        "modelAliases": [
          "iliocostalis",
          "iliocostalis lumborum",
          "iliocostalis thoracis",
          "iliocostalis cervicis"
        ]
      },
      "members": [
        "iliocostalis-lumborum",
        "iliocostalis-thoracis",
        "iliocostalis-cervicis"
      ],
      "subregions": [
        "lumbar-back",
        "thoracic-back",
        "lower-cervical-back"
      ],
      "layer": "erector-spinae-lateral-column",
      "anatomy": {
        "originRu": [
          "Нижние пучки входят в общее сухожильное начало erector spinae от крестца, подвздошного гребня и пояснично-крестцовой области."
        ],
        "insertionRu": [
          "Последовательно прикрепляется к углам рёбер и поперечным отросткам нижних шейных позвонков; конкретные уровни различаются у lumborum, thoracis и cervicis."
        ],
        "fiberDirectionRu": "Самая латеральная продольная колонна erector spinae; пучки идут вверх вдоль углов рёбер.",
        "actionsRu": [
          "Двусторонне участвует в разгибании позвоночника.",
          "Односторонне участвует в ипсилатеральном боковом сгибании.",
          "Региональные пучки также участвуют в контроле положения рёбер и позвоночника."
        ],
        "innervationRu": "Задние ветви соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвздошный гребень",
          "углы рёбер",
          "поперечные отростки нижних шейных позвонков"
        ],
        "relationsRu": [
          "Латеральная из трёх продольных колонн erector spinae; медиальнее располагается longissimus."
        ]
      },
      "movementCueRu": "Сравнивать с длиннейшей и остистой мышцами как латеральную колонну мышцы, выпрямляющей позвоночник.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.3 «Мышца, выпрямляющая позвоночник» — подвздошно-рёберная часть",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Erector spinae — Iliocostalis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "longissimus",
      "kind": "muscle-group",
      "names": {
        "ru": "Длиннейшая мышца",
        "latin": "musculus longissimus",
        "modelAliases": [
          "longissimus",
          "longissimus thoracis",
          "longissimus cervicis",
          "longissimus capitis"
        ]
      },
      "members": [
        "longissimus-thoracis",
        "longissimus-cervicis",
        "longissimus-capitis"
      ],
      "subregions": [
        "thoracic-back",
        "posterior-neck"
      ],
      "layer": "erector-spinae-intermediate-column",
      "anatomy": {
        "originRu": [
          "Грудная часть связана с общим сухожильным началом erector spinae; шейная и головная части начинаются от поперечных отростков нижележащих грудных и шейных позвонков."
        ],
        "insertionRu": [
          "Прикрепляется к рёбрам и поперечным отросткам вышележащих позвонков; longissimus capitis заканчивается на сосцевидном отростке."
        ],
        "fiberDirectionRu": "Промежуточная продольная колонна erector spinae между iliocostalis и spinalis.",
        "actionsRu": [
          "Двусторонне участвует в разгибании позвоночника и головы.",
          "Односторонне участвует в ипсилатеральном боковом сгибании; головная часть также участвует в повороте головы в свою сторону."
        ],
        "innervationRu": "Задние ветви соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечные отростки",
          "рёбра",
          "сосцевидный отросток"
        ],
        "relationsRu": [
          "Средняя колонна erector spinae: латеральнее spinalis и медиальнее iliocostalis."
        ]
      },
      "movementCueRu": "Для 3D-карточек различать thoracis, cervicis и capitis, но сохранять общую связь с erector spinae.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.3 — длиннейшая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Erector spinae — Longissimus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "spinalis",
      "kind": "muscle-group",
      "names": {
        "ru": "Остистая мышца",
        "latin": "musculus spinalis",
        "modelAliases": [
          "spinalis",
          "spinalis thoracis",
          "spinalis cervicis",
          "spinalis capitis"
        ]
      },
      "members": [
        "spinalis-thoracis",
        "spinalis-cervicis",
        "spinalis-capitis"
      ],
      "subregions": [
        "thoracic-back",
        "posterior-neck"
      ],
      "layer": "erector-spinae-medial-column",
      "anatomy": {
        "originRu": [
          "Преимущественно остистые отростки нижних грудных и верхних поясничных позвонков; шейные пучки имеют отдельные региональные начала."
        ],
        "insertionRu": [
          "Остистые отростки вышележащих грудных и шейных позвонков; spinalis capitis обычно слабо обособлена и может сливаться с semispinalis capitis."
        ],
        "fiberDirectionRu": "Самая медиальная продольная колонна erector spinae рядом с остистыми отростками.",
        "actionsRu": [
          "Участвует в разгибании позвоночника.",
          "Региональные части невелики и работают совместно с остальными собственными мышцами спины."
        ],
        "innervationRu": "Задние ветви соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Остистые отростки грудных и шейных позвонков"
        ],
        "relationsRu": [
          "Медиальная колонна erector spinae; шейная и головная части могут быть слабо развиты или отсутствовать как чётко отдельные мышцы."
        ]
      },
      "movementCueRu": "Не изображать spinalis как одинаково мощную непрерывную колонну во всех отделах: региональная выраженность различается.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.3 — остистая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Erector spinae — Spinalis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-variation"
      }
    },
    {
      "id": "semispinalis",
      "kind": "muscle-group",
      "names": {
        "ru": "Полуостистая мышца",
        "latin": "musculus semispinalis",
        "modelAliases": [
          "semispinalis",
          "semispinalis thoracis",
          "semispinalis cervicis",
          "semispinalis capitis"
        ]
      },
      "members": [
        "semispinalis-thoracis",
        "semispinalis-cervicis",
        "semispinalis-capitis"
      ],
      "subregions": [
        "thoracic-back",
        "posterior-neck",
        "occipital-region"
      ],
      "layer": "transversospinalis-superficial",
      "anatomy": {
        "originRu": [
          "Поперечные отростки грудных и нижних шейных позвонков."
        ],
        "insertionRu": [
          "Остистые отростки на 4–6 сегментов выше; semispinalis capitis прикрепляется к затылочной кости."
        ],
        "fiberDirectionRu": "Пучки идут вверх и медиально, пересекая больше сегментов, чем multifidus и rotatores.",
        "actionsRu": [
          "Двусторонне разгибает позвоночник и голову.",
          "Односторонне участвует в повороте соответствующего отдела в противоположную сторону."
        ],
        "innervationRu": "Задние ветви соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечные и остистые отростки",
          "затылочная кость"
        ],
        "relationsRu": [
          "Самая поверхностная и длинная часть transversospinalis; глубже лежат multifidus и rotatores."
        ]
      },
      "movementCueRu": "Сравнивать с многораздельными мышцами и мышцами-вращателями по глубине и числу перекрываемых сегментов.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.4 — полуостистая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Transversospinalis — Semispinalis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "multifidus",
      "kind": "muscle-group",
      "names": {
        "ru": "Многораздельные мышцы",
        "latin": "musculi multifidi",
        "modelAliases": [
          "multifidus",
          "multifidi",
          "multifidus lumborum",
          "multifidus thoracis",
          "multifidus cervicis"
        ]
      },
      "subregions": [
        "lumbar-back",
        "thoracic-back",
        "cervical-back"
      ],
      "layer": "transversospinalis-intermediate",
      "anatomy": {
        "originRu": [
          "Крестец и задняя часть таза, поперечные отростки поясничных и грудных позвонков, суставные отростки нижних шейных позвонков."
        ],
        "insertionRu": [
          "Остистые отростки примерно на 2–4 сегмента выше начала соответствующих пучков."
        ],
        "fiberDirectionRu": "Короткие косые пучки идут вверх и медиально и особенно хорошо развиты в поясничном отделе.",
        "actionsRu": [
          "Участвуют в разгибании и контралатеральной ротации позвоночника.",
          "Играют существенную роль в сегментарной стабилизации и контроле межпозвонковых движений."
        ],
        "innervationRu": "Медиальные ветви задних ветвей соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крестец",
          "поперечные/суставные отростки",
          "остистые отростки"
        ],
        "relationsRu": [
          "Лежат глубже semispinalis и поверхностнее rotatores; в поясничной области формируют значительную часть глубокой паравертебральной массы."
        ]
      },
      "movementCueRu": "Для обучения важнее сегментарный контроль и глубина, чем попытка приписать наружный рельеф конкретному пучку multifidus.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.4 — многораздельные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Transversospinalis — Multifidus",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-lumbar-vertebrae",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "rotatores",
      "kind": "muscle-group",
      "names": {
        "ru": "Мышцы-вращатели",
        "latin": "musculi rotatores",
        "modelAliases": [
          "rotatores",
          "rotatores breves",
          "rotatores longi",
          "rotator brevis",
          "rotator longus"
        ]
      },
      "subregions": [
        "deep-thoracic-back",
        "deep-cervical-back",
        "deep-lumbar-back"
      ],
      "layer": "transversospinalis-deepest",
      "anatomy": {
        "originRu": [
          "Поперечные отростки позвонков."
        ],
        "insertionRu": [
          "Короткие rotatores идут к дуге/основанию остистого отростка соседнего вышележащего позвонка; длинные — через один сегмент."
        ],
        "fiberDirectionRu": "Самые короткие пучки transversospinalis идут вверх и медиально и наиболее выражены в грудном отделе.",
        "actionsRu": [
          "Могут помогать разгибанию и контралатеральной ротации.",
          "Из-за малого рычага и богатой проприоцептивной иннервации особенно важны для сегментарного контроля и восприятия положения позвоночника."
        ],
        "innervationRu": "Задние ветви соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечные отростки",
          "дуги и остистые отростки соседних позвонков"
        ],
        "relationsRu": [
          "Самая глубокая и короткая часть transversospinalis; отдельные пары могут отсутствовать, особенно на краях грудной серии."
        ]
      },
      "movementCueRu": "Искать в самом глубоком сегментарном слое между поперечными и остистыми отростками; поверхностно отдельные пучки не изолируются.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.4 — мышцы-вращатели",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-back-muscles",
          "locator": "Transversospinalis — Rotatores",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-variation"
      }
    },
    {
      "id": "interspinales",
      "kind": "muscle-group",
      "names": {
        "ru": "Межостистые мышцы",
        "latin": "musculi interspinales",
        "modelAliases": [
          "interspinales",
          "interspinalis"
        ]
      },
      "subregions": [
        "deep-cervical-back",
        "deep-lumbar-back"
      ],
      "layer": "intrinsic-deepest-segmental",
      "anatomy": {
        "originRu": [
          "Парные короткие пучки начинаются от верхней поверхности остистого отростка нижележащего позвонка."
        ],
        "insertionRu": [
          "Прикрепляются к нижней поверхности остистого отростка соседнего вышележащего позвонка."
        ],
        "fiberDirectionRu": "Короткие почти вертикальные пучки соединяют соседние остистые отростки.",
        "actionsRu": [
          "Помогают разгибанию шейного и поясничного отделов.",
          "Их более важная роль — сегментарная стабилизация и проприоцептивный контроль, а не создание большого движения."
        ],
        "innervationRu": "Задние ветви соответствующих спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Остистые отростки соседних позвонков"
        ],
        "relationsRu": [
          "Относятся к самому глубокому сегментарному слою собственных мышц спины.",
          "Хорошо развиты главным образом в шейном и поясничном отделах; в грудном отделе выражены слабо и могут отсутствовать на отдельных уровнях."
        ]
      },
      "movementCueRu": "Расположены между соседними остистыми отростками и относятся к коротким сегментарным мышцам, а не к крупным поверхностным двигателям.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.5 «Межостистые мышцы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "kenhub-deep-back",
          "locator": "Deepest layer — Interspinales",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-thoracic-vertebrae",
          "locator": "Muscles — short intersegmental muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-functional-caution"
      }
    },
    {
      "id": "intertransversarii",
      "kind": "muscle-group",
      "names": {
        "ru": "Межпоперечные мышцы",
        "latin": "musculi intertransversarii",
        "modelAliases": [
          "intertransversarii",
          "intertransversarius"
        ]
      },
      "subregions": [
        "deep-cervical-back",
        "deep-lumbar-back"
      ],
      "layer": "intrinsic-deepest-segmental",
      "anatomy": {
        "originRu": [
          "Короткие пучки начинаются от поперечных и связанных с ними добавочных отростков одного позвонка."
        ],
        "insertionRu": [
          "Соединяются с поперечным, добавочным или сосцевидным отростком соседнего позвонка; точная организация зависит от отдела позвоночника."
        ],
        "fiberDirectionRu": "Короткие вертикальные или слегка косые пучки соединяют соседние поперечные элементы позвонков.",
        "actionsRu": [
          "Участвуют в ипсилатеральном боковом сгибании шейного и поясничного отделов.",
          "Существенна их роль в сегментарной стабилизации и проприоцептивном контроле."
        ],
        "innervationRu": "Иннервация зависит от части и уровня: используются передние и задние ветви соответствующих шейных и поясничных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечные отростки соседних позвонков"
        ],
        "relationsRu": [
          "Относятся к самому глубокому сегментарному слою.",
          "Лучше развиты в шейном и поясничном отделах; отдельные компоненты имеют различную иннервацию, поэтому их нельзя без оговорок описывать как единую типичную собственную мышцу спины."
        ]
      },
      "movementCueRu": "Основная учебная ценность — показать сегментарный глубокий слой и стабилизацию, а не создавать отдельную ручную задачу.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, 2.6 «Межпоперечные мышцы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "kenhub-deep-back",
          "locator": "Deepest layer — Intertransversarii",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-lumbar-vertebrae",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-innervation-nuance"
      }
    },
    {
      "id": "levatores-costarum",
      "kind": "muscle-group",
      "names": {
        "ru": "Мышцы, поднимающие рёбра",
        "latin": "musculi levatores costarum",
        "modelAliases": [
          "levatores costarum",
          "levatores costarum breves",
          "levatores costarum longi"
        ]
      },
      "subregions": [
        "deep-thoracic-back"
      ],
      "layer": "intrinsic-deepest-segmental",
      "anatomy": {
        "originRu": [
          "Поперечные отростки C7–T11."
        ],
        "insertionRu": [
          "Короткие мышцы прикрепляются к верхнему краю и наружной поверхности следующего нижележащего ребра между бугорком и углом.",
          "Длинные пучки, когда присутствуют, перекидываются через одно ребро."
        ],
        "fiberDirectionRu": "Пучки идут вниз и латерально от поперечных отростков к рёбрам.",
        "actionsRu": [
          "Могут поднимать рёбра.",
          "Участвуют в небольшом боковом сгибании и вращении грудного отдела.",
          "Вклад в дыхание возможен, но его не следует представлять как основную или хорошо количественно установленную дыхательную функцию."
        ],
        "innervationRu": "Латеральные ветви задних ветвей грудных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечные отростки C7–T11",
          "углы рёбер"
        ],
        "relationsRu": [
          "Лежат в самом глубоком слое грудной части спины, латеральнее rotatores и медиальнее наружных межрёберных мышц."
        ]
      },
      "movementCueRu": "Проследить короткие пучки от поперечных отростков к нижележащим рёбрам в глубоком грудном слое; дыхательную роль трактовать осторожно.",
      "sources": [
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Posterior thorax — levatores costarum",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-deep-back",
          "locator": "Deepest layer — Levatores costarum",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-respiratory-caution"
      }
    }
  ]
});

export const BACK_SHOULDER_STRUCTURE_COUNT = BACK_SHOULDER_REGION.structures.length;

export function backShoulderStructureById(id) {
  return BACK_SHOULDER_REGION.structures.find((item) => item.id === id) || null;
}
