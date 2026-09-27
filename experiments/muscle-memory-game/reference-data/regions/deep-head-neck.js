function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const DEEP_HEAD_NECK_REGION = deepFreeze({
  "id": "deep-head-neck",
  "nameRu": "Внутренние мышцы головы и шеи",
  "status": "verified-v1",
  "scopeRu": "Мышцы языка, мягкого нёба, глотки и гортани, необходимые для полной анатомической карты внутренних областей головы и шеи.",
  "functionalGroups": [
    {
      "id": "tongue-extrinsic",
      "nameRu": "Наружные мышцы языка",
      "members": [
        "genioglossus",
        "hyoglossus",
        "styloglossus",
        "palatoglossus"
      ]
    },
    {
      "id": "tongue-intrinsic",
      "nameRu": "Собственные мышцы языка",
      "members": [
        "superior-longitudinal-tongue",
        "inferior-longitudinal-tongue",
        "transverse-tongue",
        "vertical-tongue"
      ]
    },
    {
      "id": "soft-palate-muscles",
      "nameRu": "Мышцы мягкого нёба",
      "members": [
        "levator-veli-palatini",
        "tensor-veli-palatini",
        "musculus-uvulae",
        "palatoglossus",
        "palatopharyngeus"
      ]
    },
    {
      "id": "pharyngeal-constrictors",
      "nameRu": "Констрикторы глотки",
      "members": [
        "superior-pharyngeal-constrictor",
        "middle-pharyngeal-constrictor",
        "inferior-pharyngeal-constrictor"
      ]
    },
    {
      "id": "pharyngeal-longitudinal",
      "nameRu": "Продольные мышцы глотки",
      "members": [
        "stylopharyngeus",
        "salpingopharyngeus",
        "palatopharyngeus"
      ]
    },
    {
      "id": "intrinsic-laryngeal",
      "nameRu": "Внутренние мышцы гортани",
      "members": [
        "cricothyroid",
        "posterior-cricoarytenoid",
        "lateral-cricoarytenoid",
        "transverse-arytenoid",
        "oblique-arytenoid",
        "aryepiglottic",
        "thyroarytenoid",
        "thyroepiglottic",
        "vocalis"
      ]
    }
  ],
  "teachingPrinciplesRu": [
    "Язык объяснять как систему изменения положения и формы: наружные мышцы преимущественно перемещают язык, собственные — меняют его форму, но в реальном движении группы работают совместно.",
    "Мягкое нёбо рассматривать как функциональную систему из пяти мышц; tensor veli palatini отдельно отмечать из-за иннервации V3.",
    "Глотку показывать как циркулярные констрикторы и продольные мышцы, а не как набор изолированных движений.",
    "В гортани связывать каждую мышцу с конкретным перемещением хрящей и голосовых складок.",
    "Названные части мышц, которые BodyParts3D хранит отдельными mesh-объектами, отмечать как muscle-part и связывать с родительской мышцей."
  ],
  "structures": [
    {
      "id": "genioglossus",
      "kind": "muscle",
      "names": {
        "ru": "Подбородочно-язычная мышца",
        "latin": "musculus genioglossus",
        "modelAliases": [
          "genioglossus"
        ]
      },
      "layer": "extrinsic-tongue",
      "subregions": [
        "tongue",
        "floor-of-mouth"
      ],
      "anatomy": {
        "originRu": [
          "Верхняя подбородочная ость на внутренней поверхности нижней челюсти."
        ],
        "insertionRu": [
          "Веерообразно вплетается в толщу языка от кончика до корня.",
          "Нижние пучки достигают тела подъязычной кости."
        ],
        "fiberDirectionRu": "Веерообразные пучки расходятся назад и вверх от подбородочной ости.",
        "actionsRu": [
          "Основной наружный протрактор языка.",
          "Задние пучки выдвигают язык вперёд; передние могут тянуть кончик назад и вниз; вся мышца помогает формировать положение тела языка."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подбородочная ость",
          "тело подъязычной кости",
          "срединная плоскость языка"
        ],
        "relationsRu": [
          "Крупнейшая наружная мышца языка; лежит медиальнее hyoglossus и образует значительную часть мышечной массы дна полости рта."
        ]
      },
      "movementCueRu": "Веерообразное расположение пучков важно связать с разными действиями: язык не только выдвигается, но и меняет форму и положение.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "hyoglossus",
      "kind": "muscle",
      "names": {
        "ru": "Подъязычно-язычная мышца",
        "latin": "musculus hyoglossus",
        "modelAliases": [
          "hyoglossus"
        ]
      },
      "layer": "extrinsic-tongue",
      "subregions": [
        "tongue",
        "floor-of-mouth"
      ],
      "anatomy": {
        "originRu": [
          "Тело и большой рог подъязычной кости."
        ],
        "insertionRu": [
          "Боковая поверхность задней половины языка."
        ],
        "fiberDirectionRu": "Плоские пучки идут почти вертикально вверх от подъязычной кости к боковой поверхности языка.",
        "actionsRu": [
          "Опускает боковые отделы языка.",
          "Тянет язык назад."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подъязычная кость",
          "латеральная поверхность языка"
        ],
        "relationsRu": [
          "Язычный нерв и поднижнечелюстной проток проходят латеральнее мышцы; язычная артерия проходит глубже неё — важное топографическое отношение."
        ]
      },
      "movementCueRu": "При изучении слоя важно показать, что язычная артерия проходит глубже мышцы, а язычный нерв и поднижнечелюстной проток — латеральнее.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "styloglossus",
      "kind": "muscle",
      "names": {
        "ru": "Шилоязычная мышца",
        "latin": "musculus styloglossus",
        "modelAliases": [
          "styloglossus"
        ]
      },
      "layer": "extrinsic-tongue",
      "subregions": [
        "tongue",
        "styloid-region"
      ],
      "anatomy": {
        "originRu": [
          "Шиловидный отросток височной кости.",
          "Шилонижнечелюстная связка."
        ],
        "insertionRu": [
          "Боковая поверхность языка, где волокна переплетаются с собственными и другими наружными мышцами."
        ],
        "fiberDirectionRu": "Пучки идут вниз, вперёд и медиально от шиловидного отростка к языку.",
        "actionsRu": [
          "Тянет язык назад.",
          "Поднимает боковые края языка."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Шиловидный отросток",
          "боковая поверхность языка"
        ],
        "relationsRu": [
          "Самая латерально расположенная из основных наружных мышц языка."
        ]
      },
      "movementCueRu": "Движение языка назад и вверх отражает работу группы; мышцу не рассматриваем как поверхностную пальпаторную структуру.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "palatoglossus",
      "kind": "muscle",
      "names": {
        "ru": "Нёбно-язычная мышца",
        "latin": "musculus palatoglossus",
        "modelAliases": [
          "palatoglossus"
        ]
      },
      "layer": "soft-palate-to-tongue",
      "subregions": [
        "soft-palate",
        "tongue",
        "oropharyngeal-isthmus"
      ],
      "anatomy": {
        "originRu": [
          "Нёбный апоневроз мягкого нёба."
        ],
        "insertionRu": [
          "Боковая поверхность языка, где волокна переплетаются с поперечной мышцей языка."
        ],
        "fiberDirectionRu": "Пучки идут вниз, вперёд и латерально в составе нёбно-язычной дужки.",
        "actionsRu": [
          "Поднимает заднюю часть языка.",
          "Сближает нёбно-язычные дужки и суживает ротоглоточный перешеек.",
          "Участвует в начале глотания."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Мягкое нёбо",
          "нёбно-язычная дужка",
          "корень языка"
        ],
        "relationsRu": [
          "Одна и та же мышца одновременно входит в функциональную карту мягкого нёба и наружных мышц языка; это два контекста одной структуры."
        ]
      },
      "movementCueRu": "Показывать как границу ротоглоточного перешейка и связующее звено между языком и мягким нёбом.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-palate",
          "locator": "Muscles of the soft palate",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "superior-longitudinal-tongue",
      "kind": "muscle",
      "names": {
        "ru": "Верхняя продольная мышца языка",
        "latin": "musculus longitudinalis superior linguae",
        "modelAliases": [
          "superior longitudinal muscle of tongue",
          "superior longitudinal tongue"
        ]
      },
      "layer": "intrinsic-tongue-superficial",
      "subregions": [
        "tongue"
      ],
      "anatomy": {
        "originRu": [
          "Собственные соединительнотканные структуры корня и перегородки языка; фиксированного костного начала нет."
        ],
        "insertionRu": [
          "Внутренние ткани языка, особенно в области кончика и краёв."
        ],
        "fiberDirectionRu": "Продольные пучки проходят непосредственно под слизистой оболочкой спинки языка.",
        "actionsRu": [
          "Укорачивает и расширяет язык.",
          "Поднимает кончик и края языка."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Спинка языка",
          "кончик языка"
        ],
        "relationsRu": [
          "Собственная мышца: начинается и заканчивается внутри языка, без костного прикрепления."
        ]
      },
      "movementCueRu": "Изучается как часть системы изменения формы языка, а не как отдельное крупное движение.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-intrinsic"
      }
    },
    {
      "id": "inferior-longitudinal-tongue",
      "kind": "muscle",
      "names": {
        "ru": "Нижняя продольная мышца языка",
        "latin": "musculus longitudinalis inferior linguae",
        "modelAliases": [
          "inferior longitudinal muscle of tongue",
          "inferior longitudinal tongue"
        ]
      },
      "layer": "intrinsic-tongue-inferior",
      "subregions": [
        "tongue"
      ],
      "anatomy": {
        "originRu": [
          "Собственные ткани корня языка, без отдельного костного начала."
        ],
        "insertionRu": [
          "Собственные ткани нижней поверхности и кончика языка."
        ],
        "fiberDirectionRu": "Продольные пучки идут вдоль нижней поверхности языка между перегородками и наружными мышцами.",
        "actionsRu": [
          "Укорачивает язык.",
          "Опускает кончик языка."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя поверхность языка",
          "кончик языка"
        ],
        "relationsRu": [
          "Переплетается с волокнами genioglossus, hyoglossus и styloglossus."
        ]
      },
      "movementCueRu": "Нужна для понимания изменения формы языка; отдельной наружной ручной задачи нет.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-intrinsic"
      }
    },
    {
      "id": "transverse-tongue",
      "kind": "muscle",
      "names": {
        "ru": "Поперечная мышца языка",
        "latin": "musculus transversus linguae",
        "modelAliases": [
          "transverse muscle of tongue",
          "transverse tongue"
        ]
      },
      "layer": "intrinsic-tongue-middle",
      "subregions": [
        "tongue"
      ],
      "anatomy": {
        "originRu": [
          "Срединная перегородка языка."
        ],
        "insertionRu": [
          "Фиброзные ткани по боковым краям языка."
        ],
        "fiberDirectionRu": "Пучки идут поперечно от срединной перегородки к краям языка.",
        "actionsRu": [
          "Удлиняет и суживает язык."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Срединная перегородка",
          "боковые края языка"
        ],
        "relationsRu": [
          "Переплетается с вертикальной мышцей и волокнами наружных мышц."
        ]
      },
      "movementCueRu": "Показывать как геометрический антагонист части продольных и вертикальных пучков при изменении формы языка.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-intrinsic"
      }
    },
    {
      "id": "vertical-tongue",
      "kind": "muscle",
      "names": {
        "ru": "Вертикальная мышца языка",
        "latin": "musculus verticalis linguae",
        "modelAliases": [
          "vertical muscle of tongue",
          "vertical tongue"
        ]
      },
      "layer": "intrinsic-tongue-middle",
      "subregions": [
        "tongue"
      ],
      "anatomy": {
        "originRu": [
          "Дорсальные соединительнотканные структуры языка."
        ],
        "insertionRu": [
          "Вентральные соединительнотканные структуры языка."
        ],
        "fiberDirectionRu": "Пучки идут почти вертикально от спинки к нижней поверхности языка.",
        "actionsRu": [
          "Уплощает и расширяет язык."
        ],
        "innervationRu": "Подъязычный нерв (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Спинка языка",
          "нижняя поверхность языка"
        ],
        "relationsRu": [
          "Особенно выражена в передней части языка и переплетается с поперечными пучками."
        ]
      },
      "movementCueRu": "Карточка объясняет изменение толщины языка без попытки свести функцию к одному суставному движению.",
      "sources": [
        {
          "sourceId": "ncbi-tongue",
          "locator": "Muscles — intrinsic and extrinsic muscles of the tongue",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-styloglossus",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-intrinsic"
      }
    },
    {
      "id": "levator-veli-palatini",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, поднимающая нёбную занавеску",
        "latin": "musculus levator veli palatini",
        "modelAliases": [
          "levator veli palatini"
        ]
      },
      "layer": "soft-palate-deep",
      "subregions": [
        "soft-palate",
        "nasopharynx"
      ],
      "anatomy": {
        "originRu": [
          "Каменистая часть височной кости.",
          "Хрящевая часть слуховой трубы."
        ],
        "insertionRu": [
          "Нёбный апоневроз мягкого нёба."
        ],
        "fiberDirectionRu": "Пучки идут вниз, вперёд и медиально к мягкому нёбу.",
        "actionsRu": [
          "Поднимает мягкое нёбо.",
          "Участвует в закрытии носоглотки при глотании."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Слуховая труба",
          "мягкое нёбо"
        ],
        "relationsRu": [
          "Лежит глубже tensor veli palatini и формирует основную поднимающую систему мягкого нёба."
        ]
      },
      "movementCueRu": "Нужна для понимания замыкания носоглотки при глотании, а не как отдельная ручная мишень.",
      "sources": [
        {
          "sourceId": "ncbi-palate",
          "locator": "Muscles of the soft palate",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "tensor-veli-palatini",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, напрягающая нёбную занавеску",
        "latin": "musculus tensor veli palatini",
        "modelAliases": [
          "tensor veli palatini"
        ]
      },
      "layer": "soft-palate-deep",
      "subregions": [
        "soft-palate",
        "pterygoid-region"
      ],
      "anatomy": {
        "originRu": [
          "Ладьевидная ямка и прилежащая область клиновидной кости.",
          "Хрящевая часть слуховой трубы."
        ],
        "insertionRu": [
          "После огибания крючка крыловидного отростка сухожилие вплетается в нёбный апоневроз."
        ],
        "fiberDirectionRu": "Вертикальные пучки переходят в сухожилие, которое меняет направление вокруг hamulus pterygoideus и идёт медиально.",
        "actionsRu": [
          "Напрягает мягкое нёбо.",
          "Помогает открытию слуховой трубы при глотании."
        ],
        "innervationRu": "Нерв медиальной крыловидной мышцы от V3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крыловидный крючок",
          "слуховая труба",
          "мягкое нёбо"
        ],
        "relationsRu": [
          "Единственная из пяти мышц мягкого нёба, иннервируемая не X нервом, а ветвью V3."
        ]
      },
      "movementCueRu": "При послойном просмотре важно показать крыловидный крючок: сухожилие огибает его и меняет направление тяги.",
      "sources": [
        {
          "sourceId": "ncbi-palate",
          "locator": "Muscles of the soft palate",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-tensor-veli-palatini",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-innervation-exception"
      }
    },
    {
      "id": "musculus-uvulae",
      "kind": "muscle",
      "names": {
        "ru": "Мышца язычка",
        "latin": "musculus uvulae",
        "modelAliases": [
          "uvular muscle",
          "musculus uvulae"
        ]
      },
      "layer": "soft-palate-midline",
      "subregions": [
        "soft-palate",
        "uvula"
      ],
      "anatomy": {
        "originRu": [
          "Задняя носовая ость и нёбный апоневроз."
        ],
        "insertionRu": [
          "Слизистая и соединительная ткань язычка."
        ],
        "fiberDirectionRu": "Короткие продольные пучки идут назад внутри язычка.",
        "actionsRu": [
          "Укорачивает и утолщает язычок.",
          "Помогает формировать центральное замыкание мягкого нёба."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Задняя носовая ость",
          "язычок"
        ],
        "relationsRu": [
          "Небольшая парная/сливающаяся срединная мышца мягкого нёба."
        ]
      },
      "movementCueRu": "Изучается как часть нёбно-глоточного закрытия.",
      "sources": [
        {
          "sourceId": "ncbi-palate",
          "locator": "Muscles of the soft palate",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "palatopharyngeus",
      "kind": "muscle",
      "names": {
        "ru": "Нёбно-глоточная мышца",
        "latin": "musculus palatopharyngeus",
        "modelAliases": [
          "palatopharyngeus"
        ]
      },
      "layer": "soft-palate-longitudinal-pharynx",
      "subregions": [
        "soft-palate",
        "pharynx"
      ],
      "anatomy": {
        "originRu": [
          "Твёрдое нёбо и нёбный апоневроз."
        ],
        "insertionRu": [
          "Боковая стенка глотки.",
          "Задний край щитовидного хряща; волокна переплетаются с мышцами глотки."
        ],
        "fiberDirectionRu": "Пучки идут вниз и назад в составе нёбно-глоточной дужки.",
        "actionsRu": [
          "Напрягает мягкое нёбо.",
          "Поднимает и укорачивает глотку при глотании.",
          "Помогает сближению стенок глотки и защите входа в дыхательные пути."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нёбно-глоточная дужка",
          "боковая стенка глотки",
          "щитовидный хрящ"
        ],
        "relationsRu": [
          "Одновременно относится к мышцам мягкого нёба и продольным мышцам глотки."
        ]
      },
      "movementCueRu": "Показывать как продольный связующий путь между мягким нёбом и глоткой.",
      "sources": [
        {
          "sourceId": "ncbi-palate",
          "locator": "Muscles of the soft palate",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-pharynx",
          "locator": "Muscles of the pharynx",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "superior-pharyngeal-constrictor",
      "kind": "muscle",
      "names": {
        "ru": "Верхний констриктор глотки",
        "latin": "musculus constrictor pharyngis superior",
        "modelAliases": [
          "superior pharyngeal constrictor"
        ]
      },
      "layer": "pharyngeal-circular-upper",
      "subregions": [
        "pharynx",
        "nasopharynx",
        "oropharynx"
      ],
      "anatomy": {
        "originRu": [
          "Крыловидный крючок и крылонижнечелюстной шов.",
          "Задняя часть челюстно-подъязычной линии и боковая поверхность языка через соседние фасциальные структуры."
        ],
        "insertionRu": [
          "Срединный шов глотки."
        ],
        "fiberDirectionRu": "Пучки направляются назад и медиально к срединному шву.",
        "actionsRu": [
          "Суживает верхнюю часть глотки и продвигает пищевой комок вниз при глотании."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крылонижнечелюстной шов",
          "срединный шов глотки"
        ],
        "relationsRu": [
          "Самый верхний из трёх циркулярных констрикторов; частично перекрывается средним."
        ]
      },
      "movementCueRu": "Рассматривать вместе со средним и нижним констрикторами как верхний этап последовательного сокращения стенки глотки при глотании.",
      "sources": [
        {
          "sourceId": "ncbi-pharynx",
          "locator": "Muscles of the pharynx",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "middle-pharyngeal-constrictor",
      "kind": "muscle",
      "names": {
        "ru": "Средний констриктор глотки",
        "latin": "musculus constrictor pharyngis medius",
        "modelAliases": [
          "middle pharyngeal constrictor"
        ]
      },
      "layer": "pharyngeal-circular-middle",
      "subregions": [
        "pharynx",
        "oropharynx"
      ],
      "anatomy": {
        "originRu": [
          "Большой и малый рога подъязычной кости.",
          "Шилоподъязычная связка."
        ],
        "insertionRu": [
          "Срединный шов глотки."
        ],
        "fiberDirectionRu": "Веерообразные пучки идут назад от подъязычной кости к срединному шву.",
        "actionsRu": [
          "Суживает среднюю часть глотки при глотании."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подъязычная кость",
          "срединный шов глотки"
        ],
        "relationsRu": [
          "Перекрывает нижнюю часть верхнего констриктора и сам частично перекрывается нижним."
        ]
      },
      "movementCueRu": "Рассматривать как средний этап последовательного сокращения констрикторов глотки.",
      "sources": [
        {
          "sourceId": "ncbi-pharynx",
          "locator": "Muscles of the pharynx",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "inferior-pharyngeal-constrictor",
      "kind": "muscle",
      "names": {
        "ru": "Нижний констриктор глотки",
        "latin": "musculus constrictor pharyngis inferior",
        "modelAliases": [
          "inferior pharyngeal constrictor"
        ]
      },
      "layer": "pharyngeal-circular-lower",
      "subregions": [
        "pharynx",
        "laryngopharynx"
      ],
      "anatomy": {
        "originRu": [
          "Косая линия щитовидного хряща (thyropharyngeus).",
          "Латеральная поверхность перстневидного хряща (cricopharyngeus)."
        ],
        "insertionRu": [
          "Срединный шов глотки; нижние волокна переходят в область верхнего пищеводного сфинктера."
        ],
        "fiberDirectionRu": "Пучки идут назад и медиально; нижняя cricopharyngeal часть имеет более горизонтальное направление.",
        "actionsRu": [
          "Суживает нижнюю часть глотки.",
          "Cricopharyngeus участвует в формировании верхнего пищеводного сфинктера."
        ],
        "innervationRu": "Иннервация неоднородна: щитоглоточная часть получает ветви глоточного сплетения и наружной ветви верхнего гортанного нерва; перстнеглоточная часть получает выраженный вклад возвратного гортанного нерва. Ветвление и анастомозы вариабельны."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Щитовидный и перстневидный хрящи",
          "переход глотки в пищевод"
        ],
        "relationsRu": [
          "Самый нижний констриктор; его две функционально различимые части не следует сводить к одному простому движению."
        ]
      },
      "movementCueRu": "Показывать щитоглоточную и перстнеглоточную части в составе одной мышцы и отдельно отмечать роль перстнеглоточной части в области верхнего пищеводного сфинктера.",
      "sources": [
        {
          "sourceId": "ncbi-pharynx",
          "locator": "Muscles of the pharynx",
          "role": "verification"
        },
        {
          "sourceId": "pubmed-inferior-constrictor-innervation",
          "locator": "Abstract — innervation patterns",
          "role": "evidence-check"
        }
      ],
      "verification": {
        "status": "cross-checked-innervation-and-two-parts"
      }
    },
    {
      "id": "stylopharyngeus",
      "kind": "muscle",
      "names": {
        "ru": "Шилоглоточная мышца",
        "latin": "musculus stylopharyngeus",
        "modelAliases": [
          "stylopharyngeus"
        ]
      },
      "layer": "pharyngeal-longitudinal",
      "subregions": [
        "pharynx",
        "styloid-region"
      ],
      "anatomy": {
        "originRu": [
          "Медиальная поверхность основания шиловидного отростка височной кости."
        ],
        "insertionRu": [
          "Боковая стенка глотки.",
          "Задний край щитовидного хряща; волокна смешиваются с palatopharyngeus."
        ],
        "fiberDirectionRu": "Пучки идут вниз и медиально между верхним и средним констрикторами.",
        "actionsRu": [
          "Поднимает и укорачивает глотку при глотании.",
          "Помогает расширять глотку для прохождения пищевого комка."
        ],
        "innervationRu": "Языкоглоточный нерв (IX)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Шиловидный отросток",
          "боковая стенка глотки",
          "щитовидный хрящ"
        ],
        "relationsRu": [
          "Единственная мышца, получающая двигательную иннервацию непосредственно от IX нерва; входит между констрикторами."
        ]
      },
      "movementCueRu": "Карточка важна для понимания продольной мускулатуры и исключительной иннервации.",
      "sources": [
        {
          "sourceId": "ncbi-pharynx",
          "locator": "Muscles of the pharynx",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-stylopharyngeus",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-innervation-exception"
      }
    },
    {
      "id": "salpingopharyngeus",
      "kind": "muscle",
      "names": {
        "ru": "Трубно-глоточная мышца",
        "latin": "musculus salpingopharyngeus",
        "modelAliases": [
          "salpingopharyngeus"
        ]
      },
      "layer": "pharyngeal-longitudinal",
      "subregions": [
        "nasopharynx",
        "pharynx"
      ],
      "anatomy": {
        "originRu": [
          "Нижняя часть хряща слуховой трубы."
        ],
        "insertionRu": [
          "Боковая стенка глотки, где волокна сливаются с palatopharyngeus."
        ],
        "fiberDirectionRu": "Тонкие продольные пучки идут вниз от слуховой трубы в стенку глотки.",
        "actionsRu": [
          "Поднимает и укорачивает глотку при глотании.",
          "Может помогать открытию слуховой трубы."
        ],
        "innervationRu": "Глоточное сплетение, преимущественно блуждающий нерв (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глоточное отверстие слуховой трубы",
          "боковая стенка глотки"
        ],
        "relationsRu": [
          "Небольшая продольная мышца, тесно связанная с palatopharyngeus."
        ]
      },
      "movementCueRu": "Добавляется для анатомической полноты продольной группы, даже если отдельного mesh-объекта в модели нет.",
      "sources": [
        {
          "sourceId": "ncbi-pharynx",
          "locator": "Muscles of the pharynx",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "cricothyroid",
      "kind": "muscle",
      "names": {
        "ru": "Перстнещитовидная мышца",
        "latin": "musculus cricothyroideus",
        "modelAliases": [
          "cricothyroid"
        ]
      },
      "layer": "intrinsic-larynx-external-surface",
      "subregions": [
        "larynx"
      ],
      "anatomy": {
        "originRu": [
          "Переднелатеральная поверхность дуги перстневидного хряща."
        ],
        "insertionRu": [
          "Нижний край и нижний рог щитовидного хряща.",
          "Мышца имеет прямую и косую части."
        ],
        "fiberDirectionRu": "Прямая часть идёт преимущественно вверх, косая — вверх и назад.",
        "actionsRu": [
          "Наклоняет щитовидный хрящ относительно перстневидного и натягивает/удлиняет голосовые складки.",
          "Повышает их продольное натяжение при фонации."
        ],
        "innervationRu": "Наружная ветвь верхнего гортанного нерва от блуждающего нерва (X)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Перстневидный хрящ",
          "щитовидный хрящ"
        ],
        "relationsRu": [
          "Функционально относится к внутренним мышцам гортани, но лежит на наружной поверхности гортанного скелета.",
          "Единственная основная внутренняя мышца гортани, которую не иннервирует возвратный гортанный нерв."
        ]
      },
      "movementCueRu": "Прямую и косую части сохраняем как части одной мышцы, а не как две самостоятельные мышцы.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-two-parts"
      }
    },
    {
      "id": "posterior-cricoarytenoid",
      "kind": "muscle",
      "names": {
        "ru": "Задняя перстнечерпаловидная мышца",
        "latin": "musculus cricoarytenoideus posterior",
        "modelAliases": [
          "posterior crico-arytenoid",
          "posterior cricoarytenoid"
        ]
      },
      "layer": "intrinsic-larynx-posterior",
      "subregions": [
        "larynx"
      ],
      "anatomy": {
        "originRu": [
          "Задняя поверхность пластинки перстневидного хряща."
        ],
        "insertionRu": [
          "Мышечный отросток черпаловидного хряща."
        ],
        "fiberDirectionRu": "Пучки идут вверх и латерально к мышечному отростку.",
        "actionsRu": [
          "Вращает черпаловидный хрящ так, что голосовой отросток отводится латерально.",
          "Единственная парная мышца, активно отводящая голосовые складки."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Пластинка перстневидного хряща",
          "мышечный отросток черпаловидного хряща"
        ],
        "relationsRu": [
          "Ключевая мышца открытия голосовой щели при дыхании."
        ]
      },
      "movementCueRu": "В карточке основной смысл — единственный активный абдуктор голосовых складок.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "lateral-cricoarytenoid",
      "kind": "muscle",
      "names": {
        "ru": "Латеральная перстнечерпаловидная мышца",
        "latin": "musculus cricoarytenoideus lateralis",
        "modelAliases": [
          "lateral crico-arytenoid",
          "lateral cricoarytenoid"
        ]
      },
      "layer": "intrinsic-larynx-lateral",
      "subregions": [
        "larynx"
      ],
      "anatomy": {
        "originRu": [
          "Верхний край латеральной части дуги перстневидного хряща."
        ],
        "insertionRu": [
          "Мышечный отросток черпаловидного хряща."
        ],
        "fiberDirectionRu": "Пучки идут назад и вверх к мышечному отростку.",
        "actionsRu": [
          "Вращает черпаловидный хрящ медиально и приводит голосовые складки.",
          "Закрывает преимущественно мембранозную часть голосовой щели."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Дуга перстневидного хряща",
          "черпаловидный хрящ"
        ],
        "relationsRu": [
          "Функционально противоположна posterior cricoarytenoid по вращению черпаловидного хряща."
        ]
      },
      "movementCueRu": "Сравнивать с posterior cricoarytenoid как пару противоположных действий вокруг одного сустава.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "transverse-arytenoid",
      "kind": "muscle",
      "names": {
        "ru": "Поперечная черпаловидная мышца",
        "latin": "musculus arytenoideus transversus",
        "modelAliases": [
          "transverse arytenoid"
        ]
      },
      "layer": "intrinsic-larynx-posterior",
      "subregions": [
        "larynx"
      ],
      "anatomy": {
        "originRu": [
          "Задняя поверхность одного черпаловидного хряща."
        ],
        "insertionRu": [
          "Задняя поверхность противоположного черпаловидного хряща."
        ],
        "fiberDirectionRu": "Непарные поперечные пучки соединяют два черпаловидных хряща.",
        "actionsRu": [
          "Сближает черпаловидные хрящи.",
          "Закрывает заднюю межхрящевую часть голосовой щели."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Черпаловидные хрящи",
          "задняя часть голосовой щели"
        ],
        "relationsRu": [
          "Единственная непарная внутренняя мышца гортани."
        ]
      },
      "movementCueRu": "Показывать совместно с oblique arytenoid как систему заднего замыкания.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "oblique-arytenoid",
      "kind": "muscle",
      "names": {
        "ru": "Косая черпаловидная мышца",
        "latin": "musculus arytenoideus obliquus",
        "modelAliases": [
          "oblique arytenoid"
        ]
      },
      "layer": "intrinsic-larynx-posterior",
      "subregions": [
        "larynx"
      ],
      "anatomy": {
        "originRu": [
          "Мышечный отросток одного черпаловидного хряща."
        ],
        "insertionRu": [
          "Верхушка противоположного черпаловидного хряща."
        ],
        "fiberDirectionRu": "Парные пучки перекрещиваются по задней поверхности черпаловидных хрящей.",
        "actionsRu": [
          "Сближает черпаловидные хрящи.",
          "Помогает закрытию входа в гортань; верхние волокна продолжаются в aryepiglottic muscle."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Черпаловидные хрящи",
          "черпалонадгортанная складка"
        ],
        "relationsRu": [
          "Верхнее продолжение волокон образует aryepiglottic component; граница между ними морфологически непрерывна."
        ]
      },
      "movementCueRu": "Показывать вместе с черпалонадгортанной частью как непрерывную систему заднего отдела входа в гортань.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "aryepiglottic",
      "kind": "muscle-part",
      "names": {
        "ru": "Черпалонадгортанная мышца",
        "latin": "musculus aryepiglotticus",
        "modelAliases": [
          "aryepiglotticus",
          "ary-epiglottic part of oblique arytenoid",
          "aryepiglottic muscle"
        ]
      },
      "layer": "intrinsic-larynx-inlet",
      "subregions": [
        "larynx",
        "laryngeal-inlet"
      ],
      "anatomy": {
        "originRu": [
          "Продолжение верхних волокон косой черпаловидной мышцы от верхушки черпаловидного хряща."
        ],
        "insertionRu": [
          "Латеральный край надгортанника и ткани черпалонадгортанной складки."
        ],
        "fiberDirectionRu": "Пучки идут вверх и вперёд внутри черпалонадгортанной складки.",
        "actionsRu": [
          "Суживает вход в гортань и сближает черпалонадгортанные складки."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Верхушка черпаловидного хряща",
          "черпалонадгортанная складка",
          "надгортанник"
        ],
        "relationsRu": [
          "Анатомически является продолжением oblique arytenoid, поэтому тип карточки — muscle-part."
        ]
      },
      "movementCueRu": "При отдельном отображении сохранять связь с косой черпаловидной мышцей: это её верхнее продолжение, а не независимый механизм.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-muscle-part"
      },
      "parentStructureId": "oblique-arytenoid"
    },
    {
      "id": "thyroarytenoid",
      "kind": "muscle",
      "names": {
        "ru": "Щиточерпаловидная мышца",
        "latin": "musculus thyroarytenoideus",
        "modelAliases": [
          "thyro-arytenoid",
          "thyroarytenoid"
        ]
      },
      "layer": "intrinsic-larynx-lateral",
      "subregions": [
        "larynx",
        "vocal-fold"
      ],
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность угла щитовидного хряща и прилежащая перстнещитовидная связка."
        ],
        "insertionRu": [
          "Переднелатеральная поверхность черпаловидного хряща и его голосовой/мышечный отростки.",
          "Медиальные волокна связаны с vocalis, верхние могут продолжаться к надгортаннику."
        ],
        "fiberDirectionRu": "Пучки идут назад почти параллельно голосовой складке.",
        "actionsRu": [
          "Укорачивает и расслабляет голосовые складки.",
          "Помогает их приведению и тонкой настройке формы голосовой щели."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Щитовидный хрящ",
          "черпаловидный хрящ",
          "голосовая складка"
        ],
        "relationsRu": [
          "В мышце выделяют функционально различающиеся медиальные и верхние пучки: медиальные связаны с голосовой мышцей, верхние могут продолжаться к надгортаннику."
        ]
      },
      "movementCueRu": "Не превращать наружную часть mesh в самостоятельную мышцу: это часть thyroarytenoid.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-complex"
      }
    },
    {
      "id": "thyroepiglottic",
      "kind": "muscle-part",
      "names": {
        "ru": "Щитонадгортанная часть щиточерпаловидной мышцы",
        "latin": "pars thyroepiglottica musculi thyroarytenoidei",
        "modelAliases": [
          "thyro-epiglottic part of thyro-arytenoid",
          "thyroepiglottic muscle"
        ]
      },
      "layer": "intrinsic-larynx-inlet",
      "subregions": [
        "larynx",
        "laryngeal-inlet"
      ],
      "anatomy": {
        "originRu": [
          "Верхние волокна щиточерпаловидной мышцы от внутренней поверхности щитовидного хряща."
        ],
        "insertionRu": [
          "Латеральный край надгортанника и черпалонадгортанная складка."
        ],
        "fiberDirectionRu": "Пучки идут вверх и назад от щитовидного хряща к надгортаннику.",
        "actionsRu": [
          "Помогает расширению входа в гортань и изменению положения надгортанника."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Щитовидный хрящ",
          "надгортанник",
          "черпалонадгортанная складка"
        ],
        "relationsRu": [
          "Это продолжение части щиточерпаловидной мышцы к надгортаннику; степень обособленности этой части различается в анатомических описаниях."
        ]
      },
      "movementCueRu": "Сохраняем как muscle-part, потому что BodyParts3D различает эту структуру отдельным mesh.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-muscle-part"
      },
      "parentStructureId": "thyroarytenoid"
    },
    {
      "id": "vocalis",
      "kind": "muscle-part",
      "names": {
        "ru": "Голосовая мышца",
        "latin": "musculus vocalis",
        "modelAliases": [
          "vocalis"
        ]
      },
      "layer": "intrinsic-larynx-medial",
      "subregions": [
        "larynx",
        "vocal-fold"
      ],
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность щитовидного хряща и передняя часть голосовой связки как медиализированная часть thyroarytenoid."
        ],
        "insertionRu": [
          "Голосовой отросток черпаловидного хряща.",
          "Волокна вплетаются вдоль голосовой связки."
        ],
        "fiberDirectionRu": "Короткие пучки проходят вдоль медиального края голосовой складки.",
        "actionsRu": [
          "Тонко изменяет локальное натяжение и форму голосовой складки.",
          "Участвует в точной настройке фонации."
        ],
        "innervationRu": "Возвратный гортанный нерв, ветвь X."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Голосовая связка",
          "голосовой отросток черпаловидного хряща"
        ],
        "relationsRu": [
          "Обычно рассматривается как медиальная специализированная часть щиточерпаловидной мышцы, хотя в ряде описаний выделяется отдельно."
        ]
      },
      "movementCueRu": "Карточка нужна для точного 3D-сопоставления и понимания локальной настройки голосовой складки.",
      "sources": [
        {
          "sourceId": "ncbi-laryngeal-muscles",
          "locator": "Intrinsic laryngeal muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-larynx-rln",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-muscle-part"
      },
      "parentStructureId": "thyroarytenoid"
    }
  ]
});

export const DEEP_HEAD_NECK_STRUCTURE_COUNT = DEEP_HEAD_NECK_REGION.structures.length;

export function deepHeadNeckStructureById(id) {
  return DEEP_HEAD_NECK_REGION.structures.find((item) => item.id === id) || null;
}
