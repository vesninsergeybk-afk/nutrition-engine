function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const PELVIC_FLOOR_REGION = deepFreeze({
  "id": "pelvic-floor",
  "nameRu": "Тазовое дно и промежность",
  "status": "verified-v1",
  "scopeRu": "Тазовая диафрагма, мышцы вокруг анального канала и поверхностные/глубокие мышцы промежности.",
  "functionalGroups": [
    {
      "id": "levator-ani-components",
      "nameRu": "Компоненты levator ani",
      "members": [
        "puborectalis",
        "pubococcygeus",
        "iliococcygeus",
        "pubo-analis"
      ]
    },
    {
      "id": "superficial-perineal-muscles",
      "nameRu": "Поверхностные мышцы промежности",
      "members": [
        "ischiocavernosus",
        "bulbospongiosus",
        "superficial-transverse-perineal"
      ]
    },
    {
      "id": "anal-continence-muscles",
      "nameRu": "Поперечнополосатые мышцы аноректального контроля",
      "members": [
        "puborectalis",
        "external-anal-sphincter"
      ]
    }
  ],
  "teachingPrinciplesRu": [
    "Тазовое дно показывать как многослойную мышечно-фасциальную систему, а не как одну «мышцу Кегеля».",
    "Levator ani хранить и как общий комплекс, и как три основных компонента; дополнительные названия вроде puboanalis отмечать как подчасти, если 3D-модель их различает.",
    "Не смешивать тазовую диафрагму с поверхностным промежностным пространством: это разные уровни.",
    "Половые различия прикреплений отражать внутри карточки одной гомологичной мышцы, когда отдельные мужские и женские сущности не нужны.",
    "Функции континенции описывать как совместную работу нескольких мышц и сфинктеров, а не приписывать одному элементу."
  ],
  "structures": [
    {
      "id": "levator-ani",
      "kind": "muscle-group",
      "names": {
        "ru": "Мышца, поднимающая задний проход",
        "latin": "musculus levator ani",
        "modelAliases": [
          "levator ani"
        ]
      },
      "layer": "pelvic-diaphragm",
      "subregions": [
        "pelvic-floor"
      ],
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность лобковой кости.",
          "Сухожильная дуга мышцы, поднимающей задний проход, на фасции внутренней запирательной мышцы.",
          "Область седалищной ости."
        ],
        "insertionRu": [
          "Промежностное тело, стенки тазовых органов и прямой кишки.",
          "Анально-копчиковый шов и копчик; точные прикрепления различаются между частями."
        ],
        "fiberDirectionRu": "Широкая парная мышечная пластинка направляется вниз, назад и медиально, формируя основную часть тазовой диафрагмы.",
        "actionsRu": [
          "Поддерживает органы малого таза.",
          "Поднимает тазовое дно и участвует в поддержании мочевой и анальной континенции.",
          "Координированно расслабляется при мочеиспускании и дефекации."
        ],
        "innervationRu": "Преимущественно нерв мышцы, поднимающей задний проход, S3–S4; возможен вклад ветвей полового нерва и соседних крестцовых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "седалищная ость",
          "сухожильная дуга",
          "копчик",
          "анально-копчиковый шов"
        ],
        "relationsRu": [
          "Комплекс состоит прежде всего из puborectalis, pubococcygeus и iliococcygeus; границы между компонентами не всегда резкие."
        ]
      },
      "movementCueRu": "Сначала показывать общую чашеобразную геометрию тазовой диафрагмы, затем разбирать лобково-прямокишечную, лобково-копчиковую и подвздошно-копчиковую части.",
      "sourceNotesRu": [
        "Puborectalis, pubococcygeus и iliococcygeus работают как взаимосвязанные компоненты levator ani; их границы в современной литературе описываются не полностью одинаково.",
        "Для общей опорной функции тазового дна отдельную мышцу-антагонист обычно не выделяют: расслабление комплекса при мочеиспускании и дефекации является фазовым изменением активности той же системы."
      ],
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-levator-ani",
          "locator": "Structure and Function; Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      },
      "members": [
        "puborectalis",
        "pubococcygeus",
        "iliococcygeus"
      ]
    },
    {
      "id": "puborectalis",
      "kind": "muscle",
      "names": {
        "ru": "Лобково-прямокишечная мышца",
        "latin": "musculus puborectalis",
        "modelAliases": [
          "puborectalis"
        ]
      },
      "layer": "pelvic-diaphragm-medial",
      "subregions": [
        "pelvic-floor",
        "anorectal-region"
      ],
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность лобковой кости по обе стороны от срединной линии, вблизи лобкового симфиза."
        ],
        "insertionRu": [
          "Правая и левая части соединяются позади аноректального перехода, образуя мышечную петлю."
        ],
        "fiberDirectionRu": "Пучки идут назад от лобковой кости и огибают аноректальный переход.",
        "actionsRu": [
          "Поддерживает аноректальный угол и участвует в удержании кала.",
          "Как часть levator ani участвует в поддержке тазового дна.",
          "Расслабляется при дефекации, позволяя аноректальному углу выпрямляться."
        ],
        "innervationRu": "Нерв мышцы, поднимающей задний проход, S3–S4; возможен дополнительный вклад полового нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "аноректальный переход"
        ],
        "relationsRu": [
          "Самая медиальная и функционально специализированная часть levator ani; петля окружает прямую кишку сзади."
        ]
      },
      "movementCueRu": "Главный ориентир — U-образная мышечная петля позади аноректального перехода.",
      "sourceNotesRu": [
        "При удержании кала puborectalis действует совместно со сфинктерным аппаратом анального канала; в разделе синергистов показан наружный анальный сфинктер как отдельная структура нашей базы.",
        "Расслабление puborectalis при дефекации не означает работу отдельной мышцы-антагониста: это смена режима активности самой мышцы."
      ],
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-levator-ani",
          "locator": "Structure and Function; Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "pubococcygeus",
      "kind": "muscle",
      "names": {
        "ru": "Лобково-копчиковая мышца",
        "latin": "musculus pubococcygeus",
        "modelAliases": [
          "pubococcygeus"
        ]
      },
      "layer": "pelvic-diaphragm-medial",
      "subregions": [
        "pelvic-floor"
      ],
      "anatomy": {
        "originRu": [
          "Задняя поверхность лобковой кости.",
          "Передняя часть сухожильной дуги levator ani."
        ],
        "insertionRu": [
          "Промежностное тело и стенки тазовых органов.",
          "Анально-копчиковый шов и копчик; медиальные пучки образуют несколько описываемых подчастей."
        ],
        "fiberDirectionRu": "Пучки идут назад и медиально от лобковой кости.",
        "actionsRu": [
          "Поддерживает тазовые органы.",
          "Поднимает тазовое дно.",
          "Участвует в контроле отверстий тазового дна и распределении внутрибрюшного давления."
        ],
        "innervationRu": "Нерв мышцы, поднимающей задний проход, преимущественно S3–S4; возможен вклад полового нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "промежностное тело",
          "копчик"
        ],
        "relationsRu": [
          "Медиальная часть комплекса мышцы, поднимающей задний проход.",
          "В разных анатомических школах внутри неё описывают пучки, связанные с уретрой, влагалищем или простатой, промежностным телом и анальным каналом; границы и названия этих подчастей не полностью унифицированы."
        ]
      },
      "movementCueRu": "Рассматривать как медиальную часть мышцы, поднимающей задний проход; именованные висцеральные пучки не всегда имеют чёткие границы.",
      "sourceNotesRu": [
        "Pubococcygeus функционально непрерывна с другими частями levator ani и участвует в общей поддержке тазовых органов.",
        "Для этой опорной функции отдельную прямую мышцу-антагонист обычно не выделяют."
      ],
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-levator-ani",
          "locator": "Structure and Function; Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-subdivision-caution"
      }
    },
    {
      "id": "pubo-analis",
      "kind": "muscle-part",
      "names": {
        "ru": "Лобково-анальная часть лобково-копчиковой мышцы",
        "latin": "pars puboanalis musculi pubococcygei",
        "modelAliases": [
          "pubo-analis",
          "puboanalis"
        ]
      },
      "layer": "pelvic-diaphragm-medial",
      "subregions": [
        "pelvic-floor",
        "anal-region"
      ],
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность лобковой кости; puboanalis относится к медиальным пучкам pubovisceral/pubococcygeus-комплекса."
        ],
        "insertionRu": [
          "Межсфинктерная борозда между внутренним и наружным анальными сфинктерами; пучки продолжаются к тканям анального канала и анодерме."
        ],
        "fiberDirectionRu": "Пучки идут назад и медиально от лобковой кости к анальному каналу.",
        "actionsRu": [
          "Поднимает и поддерживает анальный канал как часть pubovisceral-комплекса.",
          "Участвует в общей поддержке тазового дна и аноректальной области."
        ],
        "innervationRu": "Как часть levator ani — преимущественно S3–S4, с возможным вкладом полового нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "анальный канал"
        ],
        "relationsRu": [
          "В современных описаниях puboanal часто рассматривается как подчасть pubococcygeus, а не как самостоятельная мышца."
        ]
      },
      "movementCueRu": "Рассматривать как именованную подчасть pubovisceral/pubococcygeus-комплекса: у неё есть воспроизводимая зона прикрепления к анальному каналу, но границы с соседними пучками у места начала выражены не всегда.",
      "sourceNotesRu": [
        "Puboanalis описывается как подчасть pubovisceral/pubococcygeus-комплекса, а не как изолированная от levator ani самостоятельная мышца.",
        "Современные исследования визуализации позволяют воспроизводимо выделять puboanal muscle по ходу к анальному каналу; терминология соседних пучков в литературе исторически неоднородна.",
        "Отдельную прямую мышцу-антагонист для её опорной функции не выделяют; функциональные партнёры рассматриваются в составе общего аноректального и levator ani комплекса."
      ],
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-levator-ani",
          "locator": "Structure and Function; Muscles",
          "role": "verification"
        },
        {
          "sourceId": "manzini-2021-puboanal-3d",
          "locator": "Figure 4; Results — 3D segmentation of LAM subdivisions",
          "role": "modern-imaging-verification"
        }
      ],
      "verification": {
        "status": "cross-checked-muscle-part"
      },
      "parentStructureId": "pubococcygeus"
    },
    {
      "id": "iliococcygeus",
      "kind": "muscle",
      "names": {
        "ru": "Подвздошно-копчиковая мышца",
        "latin": "musculus iliococcygeus",
        "modelAliases": [
          "iliococcygeus"
        ]
      },
      "layer": "pelvic-diaphragm-lateral",
      "subregions": [
        "pelvic-floor"
      ],
      "anatomy": {
        "originRu": [
          "Сухожильная дуга levator ani.",
          "Седалищная ость."
        ],
        "insertionRu": [
          "Анально-копчиковый шов.",
          "Копчик."
        ],
        "fiberDirectionRu": "Тонкие веерообразные пучки идут назад и медиально от латеральной стенки таза.",
        "actionsRu": [
          "Поддерживает тазовые органы.",
          "Поднимает и стабилизирует тазовое дно."
        ],
        "innervationRu": "Нерв мышцы, поднимающей задний проход, преимущественно S3–S4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищная ость",
          "сухожильная дуга",
          "копчик"
        ],
        "relationsRu": [
          "Более тонкая латеральная часть levator ani; соединяется с противоположной стороной по срединному шву."
        ]
      },
      "movementCueRu": "Сравнивать с лобково-копчиковой мышцей: подвздошно-копчиковая часть расположена латеральнее и формирует более тонкую пластинку.",
      "sourceNotesRu": [
        "Iliococcygeus работает совместно с другими компонентами levator ani и coccygeus, поддерживая и стабилизируя тазовое дно.",
        "Для этой опорной функции отдельную прямую мышцу-антагонист обычно не выделяют."
      ],
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-levator-ani",
          "locator": "Structure and Function; Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "coccygeus",
      "kind": "muscle",
      "names": {
        "ru": "Копчиковая мышца",
        "latin": "musculus coccygeus (ischiococcygeus)",
        "modelAliases": [
          "coccygeus",
          "ischiococcygeus"
        ]
      },
      "layer": "pelvic-diaphragm-posterior",
      "subregions": [
        "pelvic-floor"
      ],
      "anatomy": {
        "originRu": [
          "Седалищная ость."
        ],
        "insertionRu": [
          "Латеральные края нижней части крестца.",
          "Латеральный край копчика."
        ],
        "fiberDirectionRu": "Треугольные пучки идут медиально и назад, прилегая к крестцово-остистой связке.",
        "actionsRu": [
          "Поддерживает тазовые органы и дополняет levator ani в составе тазовой диафрагмы.",
          "Может тянуть копчик вперёд после его смещения назад."
        ],
        "innervationRu": "Передние ветви S4–S5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищная ость",
          "крестцово-остистая связка",
          "крестец",
          "копчик"
        ],
        "relationsRu": [
          "Лежит кзади от levator ani и тесно связан с крестцово-остистой связкой."
        ]
      },
      "movementCueRu": "Искать кзади от мышцы, поднимающей задний проход, вдоль крестцово-остистой связки.",
      "sourceNotesRu": [
        "Coccygeus функционально дополняет levator ani в поддержке и подъёме тазового дна.",
        "Для этой опорной функции отдельную прямую мышцу-антагонист обычно не выделяют."
      ],
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Pelvic diaphragm; Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-pelvis-muscles",
          "locator": "Pelvic floor",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "external-anal-sphincter",
      "kind": "muscle",
      "names": {
        "ru": "Наружный сфинктер заднего прохода",
        "latin": "musculus sphincter ani externus",
        "modelAliases": [
          "external anal sphincter"
        ]
      },
      "layer": "perineum-anal-triangle",
      "subregions": [
        "perineum",
        "anal-region"
      ],
      "anatomy": {
        "originRu": [
          "Промежностное тело и соседние фиброзные структуры спереди.",
          "Анально-копчиковая связка/шов сзади; часть пучков окружает анальный канал без отдельного костного начала."
        ],
        "insertionRu": [
          "Кольцевые волокна окружают анальный канал и переплетаются с соседними мышцами промежности и levator ani."
        ],
        "fiberDirectionRu": "Кольцевые и дугообразные пучки окружают анальный канал.",
        "actionsRu": [
          "Произвольно сжимает анальный канал и участвует в удержании кала.",
          "Работает совместно с внутренним сфинктером и puborectalis."
        ],
        "innervationRu": "Нижние прямокишечные ветви полового нерва, преимущественно S2–S4; возможен дополнительный прямой сакральный вклад."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Анальный канал",
          "промежностное тело",
          "анально-копчиковая область"
        ],
        "relationsRu": [
          "Находится ниже тазовой диафрагмы и функционально связан с puborectalis, но является отдельной поперечнополосатой мышцей."
        ]
      },
      "movementCueRu": "Рассматривать совместно с лобково-прямокишечной мышцей и внутренним сфинктером: удержание содержимого не обеспечивается одной мышцей.",
      "sources": [
        {
          "sourceId": "ncbi-pelvic-floor",
          "locator": "Posterior compartment and continence mechanisms",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-perineal-body",
          "locator": "Muscles and perineal body relationships",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "superficial-transverse-perineal",
      "kind": "muscle",
      "names": {
        "ru": "Поверхностная поперечная мышца промежности",
        "latin": "musculus transversus perinei superficialis",
        "modelAliases": [
          "superficial transverse perineal muscle"
        ]
      },
      "layer": "superficial-perineal-pouch",
      "subregions": [
        "perineum",
        "urogenital-triangle"
      ],
      "anatomy": {
        "originRu": [
          "Переднемедиальная поверхность седалищного бугра и прилежащая седалищная ветвь."
        ],
        "insertionRu": [
          "Промежностное тело, где волокна переплетаются с противоположной мышцей и соседними структурами."
        ],
        "fiberDirectionRu": "Тонкие поперечные пучки идут медиально от седалищного бугра к промежностному телу.",
        "actionsRu": [
          "Стабилизирует промежностное тело.",
          "Помогает поддержке задней части поверхностного промежностного комплекса."
        ],
        "innervationRu": "Глубокая ветвь промежностного нерва от полового нерва, S2–S4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "промежностное тело"
        ],
        "relationsRu": [
          "Одна из трёх пар мышц поверхностного промежностного пространства вместе с bulbospongiosus и ischiocavernosus."
        ]
      },
      "movementCueRu": "Проследить тонкую поперечную мышцу от седалищного бугра к промежностному телу и отличать её от двух других мышц поверхностного промежностного пространства.",
      "sources": [
        {
          "sourceId": "ncbi-superficial-perineum",
          "locator": "Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-perineal-body",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "ischiocavernosus",
      "kind": "muscle",
      "names": {
        "ru": "Седалищно-пещеристая мышца",
        "latin": "musculus ischiocavernosus",
        "modelAliases": [
          "ischiocavernosus"
        ]
      },
      "layer": "superficial-perineal-pouch",
      "subregions": [
        "perineum",
        "urogenital-triangle"
      ],
      "anatomy": {
        "originRu": [
          "Седалищный бугор.",
          "Седалищно-лобковая ветвь."
        ],
        "insertionRu": [
          "Оболочка ножки полового члена или клитора."
        ],
        "fiberDirectionRu": "Пучки идут вперёд вдоль ножки соответствующего кавернозного тела.",
        "actionsRu": [
          "Сдавливает ножку кавернозного тела и уменьшает венозный отток.",
          "Участвует в поддержании эрекции."
        ],
        "innervationRu": "Глубокая ветвь промежностного нерва от полового нерва, S2–S4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищно-лобковая ветвь",
          "ножка полового члена или клитора"
        ],
        "relationsRu": [
          "Латеральная мышца поверхностного промежностного пространства; анатомическая организация сходна у обоих полов при различии размеров и отношений."
        ]
      },
      "movementCueRu": "Связать мышцу с ножкой кавернозного тела; форма различается у мужчин и женщин, но анатомическая структура гомологична.",
      "sources": [
        {
          "sourceId": "ncbi-superficial-perineum",
          "locator": "Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-perineal-body",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "bulbospongiosus",
      "kind": "muscle",
      "names": {
        "ru": "Луковично-губчатая мышца",
        "latin": "musculus bulbospongiosus",
        "modelAliases": [
          "bulbospongiosus",
          "bulbocavernosus"
        ]
      },
      "layer": "superficial-perineal-pouch",
      "subregions": [
        "perineum",
        "urogenital-triangle"
      ],
      "anatomy": {
        "originRu": [
          "Промежностное тело и срединный шов; точное начало различается у мужчин и женщин."
        ],
        "insertionRu": [
          "У мужчин — фасции и ткани луковицы и губчатого тела полового члена.",
          "У женщин — ткани луковиц преддверия и область тела/ножек клитора; часть волокон окружает вход во влагалище."
        ],
        "fiberDirectionRu": "Пучки огибают срединные эректильные структуры поверхностного промежностного пространства.",
        "actionsRu": [
          "Сдавливает луковицу/луковицы преддверия и способствует перемещению крови в эректильные ткани.",
          "У мужчин помогает опорожнению губчатой части уретры при мочеиспускании и эякуляции; у женщин участвует в сужении входа во влагалище."
        ],
        "innervationRu": "Глубокая ветвь промежностного нерва от полового нерва, S2–S4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Промежностное тело",
          "луковица полового члена или луковицы преддверия",
          "клитор/губчатое тело"
        ],
        "relationsRu": [
          "Выраженный половой диморфизм формы и прикреплений, но это гомологичная мышца поверхностного промежностного пространства."
        ]
      },
      "movementCueRu": "Сравнивать мужскую и женскую формы как варианты одной гомологичной мышцы с различными прикреплениями и отношениями.",
      "sources": [
        {
          "sourceId": "ncbi-superficial-perineum",
          "locator": "Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-perineal-body",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-sexual-dimorphism"
      }
    },
    {
      "id": "deep-transverse-perineal",
      "kind": "controversial-muscular-structure",
      "names": {
        "ru": "Глубокая поперечная структура промежности (традиционно — глубокая поперечная мышца)",
        "latin": "musculus transversus perinei profundus",
        "modelAliases": [
          "deep transverse perineal muscle"
        ]
      },
      "layer": "deep-perineal-space",
      "subregions": [
        "perineum",
        "urogenital-triangle"
      ],
      "anatomy": {
        "originRu": [
          "Классически описывалась как поперечнополосатая мышца от медиальной поверхности седалищно-лобковой ветви.",
          "В исследовании 2025 года основным мышечным компонентом глубокого промежностного пространства оказалась поперечно ориентированная гладкомышечная пластинка, латерально достигающая седалищно-лобковой ветви и непрерывная с продольной мышцей прямой кишки."
        ],
        "insertionRu": [
          "Классически указывали промежностное тело и соединение с противоположными пучками.",
          "Для современно описанной гладкомышечной пластинки отдельное сухожильное прикрепление не показано; у женщин она также непрерывна с мышечной стенкой влагалища."
        ],
        "fiberDirectionRu": "В глубоком промежностном пространстве описана поперечно ориентированная пластинка; современные гистологические данные указывают преимущественно на гладкую мышечную ткань, а не на постоянную самостоятельную поперечнополосатую мышцу.",
        "actionsRu": [
          "Авторы современной морфологической работы предполагают участие гладкомышечной пластинки в поддержке урогенитального треугольника и ограничении расширения урогенитального отверстия.",
          "Классические функции отдельной поперечнополосатой «глубокой поперечной мышцы» нельзя без оговорок переносить на эту современно описанную структуру."
        ],
        "innervationRu": "Надёжную единую схему иннервации для традиционно описываемой DTP указывать нельзя: её тканевой состав и самостоятельность пересматриваются, а современная работа описывает преимущественно гладкомышечный компонент."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищно-лобковая ветвь",
          "промежностное тело",
          "промежностная мембрана"
        ],
        "relationsRu": [
          "Исторически её помещали в глубокое промежностное пространство.",
          "Исследования женского тазового дна нередко не находят самостоятельной глубокой поперечной поперечнополосатой мышцы; более новые гистологические данные описывают здесь гладкомышечный компонент, связанный со стенкой прямой кишки и, у женщин, влагалища."
        ]
      },
      "movementCueRu": "Сначала сравнить классическую пластину с современной морфологической схемой: они изображают одну исторически связанную область, но по-разному трактуют ткань, которую раньше называли deep transverse perineal muscle.",
      "sourceNotesRu": [
        "Карточка намеренно не представляет DTP как бесспорную постоянную поперечнополосатую мышцу.",
        "В женской анатомии ряд исследований не подтверждает классическую глубокую поперечную мышцу; работа 2025 года в обоих полах описывает в этом пространстве преимущественно гладкомышечную пластинку, непрерывную с прямой кишкой, а у женщин также со стенкой влагалища.",
        "Достоверные прямые синергисты и антагонисты для этой спорной структуры не установлены, поэтому они не должны назначаться по аналогии с поверхностными мышцами промежности."
      ],
      "sources": [
        {
          "sourceId": "ncbi-deep-perineum",
          "locator": "Deep perineal space — traditional regional anatomy",
          "role": "background"
        },
        {
          "sourceId": "pmc-female-perineal-membrane",
          "locator": "Gross and microscopic anatomy — female deep perineal region",
          "role": "evidence-check"
        },
        {
          "sourceId": "pmc-deep-transverse-perineal-2025",
          "locator": "Abstract; Introduction; Discussion",
          "role": "evidence-check"
        }
      ],
      "verification": {
        "status": "anatomically-contested"
      }
    }
  ]
});

export const PELVIC_FLOOR_STRUCTURE_COUNT = PELVIC_FLOOR_REGION.structures.length;

export function pelvicFloorStructureById(id) {
  return PELVIC_FLOOR_REGION.structures.find((item) => item.id === id) || null;
}
