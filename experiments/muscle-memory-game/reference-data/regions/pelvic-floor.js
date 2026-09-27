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
      "movementCueRu": "В тренажёре group-карточка нужна для общей геометрии тазовой диафрагмы, а компоненты остаются отдельными карточками.",
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
          "Задняя поверхность тела лобковой кости по обе стороны от срединной линии."
        ],
        "insertionRu": [
          "Правая и левая части соединяются позади аноректального перехода, образуя мышечную петлю."
        ],
        "fiberDirectionRu": "Пучки идут назад от лобковой кости и огибают аноректальный переход.",
        "actionsRu": [
          "Поддерживает аноректальный угол и участвует в удержании кала.",
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
      "movementCueRu": "Нужно показывать именно петлеобразную геометрию вокруг аноректального перехода.",
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
          "Медиальная часть комплекса levator ani; в литературе выделяют pubovaginalis/puboprostaticus, puboperinealis и puboanalis, но границы и терминология неодинаковы."
        ]
      },
      "movementCueRu": "Не превращать все описанные подчасти в независимые мышцы; отдельный 3D-mesh pubo-analis связываем с этой карточкой.",
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
          "Медиальные пучки pubococcygeus от задней поверхности лобковой кости."
        ],
        "insertionRu": [
          "Ткани вокруг анального канала и соседние волокна комплекса levator ani."
        ],
        "fiberDirectionRu": "Пучки идут назад и медиально к анальному каналу.",
        "actionsRu": [
          "Участвует в поддержке анального канала и общей функции levator ani."
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
      "movementCueRu": "Отдельная карточка существует только потому, что BodyParts3D различает mesh; в интерфейсе должна быть пометка «часть pubococcygeus».",
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
      "movementCueRu": "В 3D полезно сравнивать её более латеральное положение с pubococcygeus и puborectalis.",
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
      "movementCueRu": "Показывать как заднюю часть тазовой диафрагмы, а не смешивать с ягодичными мышцами.",
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
      "movementCueRu": "В справочнике показывать как часть многоуровневой системы континенции, а не как единственный «запирающий» механизм.",
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
      "movementCueRu": "Mesh BodyParts3D с общим названием «superficial perineal muscle» сопоставляем именно с этой стандартно называемой мышцей.",
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
      "movementCueRu": "Карточка описывает общую гомологичную структуру, а половые различия отражаются в прикреплении и соседях.",
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
      "movementCueRu": "Не создавать отдельные мужскую и женскую «мышцы» в справочнике; различия хранить внутри одной карточки.",
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
      "kind": "muscle",
      "names": {
        "ru": "Глубокая поперечная мышца промежности",
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
          "Медиальная поверхность седалищно-лобковой ветви."
        ],
        "insertionRu": [
          "Промежностное тело и противоположные волокна; выраженность и конфигурация имеют половые и индивидуальные различия."
        ],
        "fiberDirectionRu": "Поперечные пучки идут медиально в глубоком промежностном пространстве.",
        "actionsRu": [
          "Стабилизирует промежностное тело и поддерживает структуры глубокого промежностного пространства."
        ],
        "innervationRu": "Ветви полового нерва, преимущественно S2–S4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищно-лобковая ветвь",
          "промежностное тело",
          "промежностная мембрана"
        ],
        "relationsRu": [
          "Располагается глубже промежностной мембраны/в глубоком промежностном пространстве; современное описание этой области подчёркивает вариабельность и половой диморфизм."
        ]
      },
      "movementCueRu": "Добавлена для анатомической полноты региона, даже если отдельного BodyParts3D mesh сейчас нет.",
      "sources": [
        {
          "sourceId": "ncbi-deep-perineum",
          "locator": "Deep perineal space",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-perineal-body",
          "locator": "Deep transverse muscle and perineal body",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-variation"
      }
    }
  ]
});

export const PELVIC_FLOOR_STRUCTURE_COUNT = PELVIC_FLOOR_REGION.structures.length;

export function pelvicFloorStructureById(id) {
  return PELVIC_FLOOR_REGION.structures.find((item) => item.id === id) || null;
}
