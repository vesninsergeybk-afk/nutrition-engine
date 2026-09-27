function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const THORAX_ABDOMEN_REGION = deepFreeze({
  "id": "thorax-abdomen",
  "nameRu": "Грудная клетка и живот",
  "status": "verified-v1",
  "scopeRu": "Передняя и боковая грудная стенка, межрёберные слои, диафрагма и мышцы переднебоковой брюшной стенки.",
  "relatedStructureIds": [
    "serratus-anterior",
    "quadratus-lumborum"
  ],
  "teachingPrinciplesRu": [
    "Для дыхательных движений различать основной вклад диафрагмы, работу межрёберных мышц и дополнительную работу других мышц.",
    "Не обозначать отдельную мышцу как единственную причину вдоха, выдоха или движения туловища.",
    "У плоских мышц брюшной стенки обязательно показывать слой и переход мышечной части в апоневроз.",
    "Не превращать глубокие слои грудной и брюшной стенки в пальпаторные «мишени»."
  ],
  "structures": [
    {
      "id": "pectoralis-major",
      "kind": "muscle",
      "names": {
        "ru": "Большая грудная мышца",
        "latin": "musculus pectoralis major",
        "modelAliases": [
          "pectoralis major",
          "pectoralis_major"
        ]
      },
      "subregions": [
        "anterior-chest",
        "anterior-axillary-fold",
        "shoulder"
      ],
      "layer": "superficial",
      "anatomy": {
        "originRu": [
          "Передняя поверхность медиальной половины ключицы.",
          "Передняя поверхность грудины.",
          "Хрящи верхних рёбер; в разных описаниях граница реберной части несколько различается.",
          "Часть волокон связана с апоневрозом наружной косой мышцы живота."
        ],
        "insertionRu": [
          "Латеральная губа межбугорковой борозды плечевой кости."
        ],
        "fiberDirectionRu": "Веерообразные пучки сходятся латерально к плечевой кости; направление различается у ключичной и грудино-рёберной частей.",
        "actionsRu": [
          "Приводит плечо.",
          "Вращает плечо внутрь.",
          "Ключичная часть участвует в сгибании плеча.",
          "Грудино-рёберная часть помогает разгибать плечо из согнутого положения."
        ],
        "innervationRu": "Латеральный и медиальный грудные нервы."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ключица",
          "грудина",
          "передняя подмышечная складка"
        ],
        "relationsRu": [
          "Образует основной поверхностный мышечный пласт передней грудной стенки.",
          "Перекрывает малую грудную мышцу."
        ]
      },
      "movementCueRu": "Горизонтальное приведение и внутреннее вращение плеча хорошо показывают направление работы мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 1.1 «Большая грудная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-pectoralis-major",
          "locator": "Introduction; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "pectoralis-minor",
      "kind": "muscle",
      "names": {
        "ru": "Малая грудная мышца",
        "latin": "musculus pectoralis minor",
        "modelAliases": [
          "pectoralis minor",
          "pectoralis_minor"
        ]
      },
      "subregions": [
        "anterior-chest",
        "axillary-region"
      ],
      "layer": "deep-to-pectoralis-major",
      "anatomy": {
        "originRu": [
          "Передние поверхности III–V рёбер около их хрящей."
        ],
        "insertionRu": [
          "Клювовидный отросток лопатки."
        ],
        "fiberDirectionRu": "Волокна идут вверх и латерально от рёбер к клювовидному отростку.",
        "actionsRu": [
          "Тянет лопатку вперёд и вниз и помогает удерживать её у грудной клетки.",
          "При фиксированной лопатке может участвовать в подъёме III–V рёбер при усиленном вдохе."
        ],
        "innervationRu": "Медиальный и латеральный грудные нервы; вклад ветвей может варьировать."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Клювовидный отросток",
          "III–V рёбра"
        ],
        "relationsRu": [
          "Расположена глубже большой грудной мышцы.",
          "Находится рядом с сосудисто-нервными структурами подмышечной области; её глубокое положение важно учитывать при практической работе."
        ]
      },
      "movementCueRu": "Движение лопатки вперёд и вниз показывает функциональное направление мышцы лучше, чем попытка найти её контур через большую грудную.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 1.2 «Малая грудная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Muscles — Pectoralis minor",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-pectoral-muscles",
          "locator": "Nerves; Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "subclavius",
      "kind": "muscle",
      "names": {
        "ru": "Подключичная мышца",
        "latin": "musculus subclavius",
        "modelAliases": [
          "subclavius"
        ]
      },
      "subregions": [
        "infraclavicular-region"
      ],
      "layer": "deep",
      "anatomy": {
        "originRu": [
          "Область соединения I ребра с его хрящом."
        ],
        "insertionRu": [
          "Борозда подключичной мышцы на нижней поверхности средней трети ключицы."
        ],
        "fiberDirectionRu": "Короткие волокна идут вверх и латерально от I ребра к ключице.",
        "actionsRu": [
          "Стабилизирует ключицу в грудино-ключичном суставе.",
          "Тянет ключицу несколько вниз и медиально."
        ],
        "innervationRu": "Нерв к подключичной мышце, преимущественно C5–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ключица",
          "I ребро"
        ],
        "relationsRu": [
          "Лежит глубже ключицы; сосудисто-нервный пучок верхней конечности проходит глубже и ниже этой области."
        ]
      },
      "movementCueRu": "В базовом обучении мышца нужна как элемент глубокой карты подключичной области, а не как отдельная поверхностная цель.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 1.3 «Подключичная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Muscles — Subclavius",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-pectoral-muscles",
          "locator": "Nerves — Subclavius",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "external-intercostals",
      "kind": "muscle-group",
      "names": {
        "ru": "Наружные межрёберные мышцы",
        "latin": "musculi intercostales externi",
        "modelAliases": [
          "external intercostals",
          "intercostales externi"
        ]
      },
      "subregions": [
        "thoracic-wall"
      ],
      "layer": "thoracic-wall-superficial",
      "anatomy": {
        "originRu": [
          "Нижний край вышележащего ребра."
        ],
        "insertionRu": [
          "Верхний край нижележащего ребра."
        ],
        "fiberDirectionRu": "Волокна идут вниз и вперёд; спереди мышечный слой переходит в наружную межрёберную мембрану.",
        "actionsRu": [
          "Стабилизируют межрёберные промежутки.",
          "При вдохе участвуют в подъёме рёбер и увеличении размеров грудной клетки."
        ],
        "innervationRu": "Межрёберные нервы соответствующих уровней."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Межрёберные промежутки",
          "углы рёбер",
          "рёберные хрящи"
        ],
        "relationsRu": [
          "Образуют наружный мышечный слой межрёберных промежутков."
        ]
      },
      "movementCueRu": "Их работа рассматривается как часть общей механики грудной клетки при вдохе.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 2.1 «Наружные межрёберные мышцы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-intercostal-wall",
          "locator": "Thoracic wall layers",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "internal-intercostals",
      "kind": "muscle-group",
      "names": {
        "ru": "Внутренние межрёберные мышцы",
        "latin": "musculi intercostales interni",
        "modelAliases": [
          "internal intercostals",
          "intercostales interni"
        ]
      },
      "subregions": [
        "thoracic-wall"
      ],
      "layer": "thoracic-wall-middle",
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность и нижний край вышележащего ребра."
        ],
        "insertionRu": [
          "Верхний край нижележащего ребра."
        ],
        "fiberDirectionRu": "Волокна идут преимущественно вниз и назад, почти перпендикулярно наружным межрёберным.",
        "actionsRu": [
          "Стабилизируют межрёберные промежутки.",
          "Межкостная часть преимущественно участвует в опускании рёбер при активном выдохе.",
          "Межхрящевая часть может участвовать в подъёме рёбер; поэтому всю мышцу нельзя описывать одним движением без оговорки."
        ],
        "innervationRu": "Межрёберные нервы соответствующих уровней."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Межрёберные промежутки",
          "грудина",
          "углы рёбер"
        ],
        "relationsRu": [
          "Лежат глубже наружных межрёберных мышц."
        ]
      },
      "movementCueRu": "Сравнивать межкостную и межхрящевую части: их вклад в движение рёбер различается, поэтому правило «внутренние межрёберные = выдох» слишком грубое.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 2.2 «Внутренние межрёберные мышцы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-intercostal-wall",
          "locator": "Thoracic wall layers and respiratory function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-functional-nuance"
      }
    },
    {
      "id": "innermost-intercostals",
      "kind": "muscle-group",
      "names": {
        "ru": "Самые внутренние межрёберные мышцы",
        "latin": "musculi intercostales intimi",
        "modelAliases": [
          "innermost intercostals",
          "intercostales intimi"
        ]
      },
      "subregions": [
        "thoracic-wall"
      ],
      "layer": "thoracic-wall-deep",
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность вышележащего ребра в пределах межрёберного промежутка."
        ],
        "insertionRu": [
          "Внутренняя поверхность нижележащего ребра."
        ],
        "fiberDirectionRu": "Направление волокон в целом сходно с внутренними межрёберными мышцами.",
        "actionsRu": [
          "Участвуют в стабилизации межрёберного промежутка и движении рёбер совместно с внутренним межрёберным слоем."
        ],
        "innervationRu": "Межрёберные нервы соответствующих уровней."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Внутренняя поверхность межрёберных промежутков"
        ],
        "relationsRu": [
          "Это самый глубокий из трёх основных межрёберных слоёв.",
          "Межрёберный сосудисто-нервный пучок проходит между внутренним и самым внутренним слоями."
        ]
      },
      "movementCueRu": "Структура нужна для точной послойной карты грудной стенки.",
      "sources": [
        {
          "sourceId": "ncbi-intercostal-wall",
          "locator": "Thoracic wall layers",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "subcostales",
      "kind": "muscle-group",
      "names": {
        "ru": "Подрёберные мышцы",
        "latin": "musculi subcostales",
        "modelAliases": [
          "subcostales",
          "subcostal muscles"
        ]
      },
      "subregions": [
        "posterior-thoracic-wall"
      ],
      "layer": "deep",
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность нижних рёбер около их углов."
        ],
        "insertionRu": [
          "Внутренняя поверхность ребра на один или два межрёберных промежутка ниже."
        ],
        "fiberDirectionRu": "Пучки идут вниз и медиально, сходно с внутренними межрёберными мышцами.",
        "actionsRu": [
          "Могут участвовать в опускании рёбер и стабилизации задней части грудной стенки."
        ],
        "innervationRu": "Межрёберные нервы соответствующих уровней."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Углы нижних рёбер"
        ],
        "relationsRu": [
          "Лежат на внутренней поверхности задней грудной стенки."
        ]
      },
      "movementCueRu": "Для базового уровня достаточно понимать их как небольшой глубокий слой задней грудной стенки.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 2.3 «Подрёберные мышцы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Thoracic wall muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "transversus-thoracis",
      "kind": "muscle",
      "names": {
        "ru": "Поперечная мышца груди",
        "latin": "musculus transversus thoracis",
        "modelAliases": [
          "transversus thoracis"
        ]
      },
      "subregions": [
        "anterior-inner-thoracic-wall"
      ],
      "layer": "deep",
      "anatomy": {
        "originRu": [
          "Задняя поверхность нижней части грудины и мечевидного отростка."
        ],
        "insertionRu": [
          "Внутренние поверхности хрящей примерно II–VI рёбер."
        ],
        "fiberDirectionRu": "Пучки расходятся вверх и латерально от грудины к рёберным хрящам.",
        "actionsRu": [
          "Слабо участвует в опускании рёбер и стабилизации передней грудной стенки."
        ],
        "innervationRu": "Межрёберные нервы."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Грудина",
          "II–VI рёберные хрящи"
        ],
        "relationsRu": [
          "Лежит на внутренней поверхности передней грудной стенки и не является поверхностно доступной мышцей."
        ]
      },
      "movementCueRu": "Искать на внутренней поверхности передней грудной стенки между грудиной и рёберными хрящами; с поверхности мышца не видна.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, 2.4 «Поперечная мышца груди»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Thoracic wall muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "diaphragm",
      "kind": "muscle",
      "names": {
        "ru": "Диафрагма",
        "latin": "diaphragma",
        "modelAliases": [
          "diaphragm",
          "diaphragma"
        ]
      },
      "subregions": [
        "inferior-thoracic-aperture"
      ],
      "layer": "deep-cavity-boundary",
      "anatomy": {
        "originRu": [
          "Грудинная часть — от мечевидного отростка.",
          "Рёберная часть — от внутренней поверхности нижних шести рёбер и их хрящей.",
          "Поясничная часть — от правой и левой ножек и дугообразных связок, связанных с поясничными позвонками."
        ],
        "insertionRu": [
          "Все мышечные части сходятся к центральному сухожилию."
        ],
        "fiberDirectionRu": "Периферические мышечные волокна радиально сходятся к центральному сухожилию.",
        "actionsRu": [
          "Главная мышца вдоха: сокращение опускает центральное сухожилие и увеличивает вертикальный размер грудной полости.",
          "Участвует в создании внутрибрюшного давления совместно с мышцами брюшной стенки и тазового дна."
        ],
        "innervationRu": "Двигательная иннервация — диафрагмальные нервы C3–C5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижние рёбра",
          "мечевидный отросток",
          "поясничный отдел позвоночника"
        ],
        "relationsRu": [
          "Разделяет грудную и брюшную полости; большая часть мышцы недоступна непосредственной поверхностной пальпации."
        ]
      },
      "movementCueRu": "Дыхательное движение грудной клетки и передней брюшной стенки отражает работу всей дыхательной системы, а не позволяет напрямую видеть отдельные пучки диафрагмы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел II, «Диафрагма»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-diaphragm",
          "locator": "Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-thorax-muscles",
          "locator": "Diaphragm",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "external-oblique",
      "kind": "muscle",
      "names": {
        "ru": "Наружная косая мышца живота",
        "latin": "musculus obliquus externus abdominis",
        "modelAliases": [
          "external oblique",
          "external abdominal oblique",
          "obliquus externus abdominis"
        ]
      },
      "subregions": [
        "anterolateral-abdominal-wall",
        "lateral-trunk"
      ],
      "layer": "superficial",
      "anatomy": {
        "originRu": [
          "Наружные поверхности V–XII рёбер."
        ],
        "insertionRu": [
          "Белая линия живота через широкий апоневроз.",
          "Лобковый бугорок.",
          "Передняя половина подвздошного гребня."
        ],
        "fiberDirectionRu": "Большинство волокон идёт вниз и медиально; нижние пучки идут более вертикально.",
        "actionsRu": [
          "При двустороннем сокращении участвует в сгибании туловища и повышении внутрибрюшного давления.",
          "При одностороннем сокращении участвует в боковом сгибании и повороте туловища в противоположную сторону."
        ],
        "innervationRu": "Передние ветви нижних грудных спинномозговых нервов, включая грудобрюшные и подрёберный нервы."
      },
      "surfaceMap": {
        "landmarksRu": [
          "V–XII рёбра",
          "передняя часть подвздошного гребня",
          "белая линия живота"
        ],
        "relationsRu": [
          "Самая поверхностная из трёх широких боковых мышц живота.",
          "Под ней лежит внутренняя косая, ещё глубже — поперечная мышца живота."
        ]
      },
      "movementCueRu": "Поворот туловища помогает связать направление волокон с функцией мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел III, 1.1 «Наружная косая мышца живота»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-abdominal-wall",
          "locator": "External Oblique",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-anterolateral-abdominal-wall",
          "locator": "External oblique",
          "role": "verification"
        }
      ],
      "illustrations": [
        {
          "sourceId": "gray-1918-plate-392",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "internal-oblique",
      "kind": "muscle",
      "names": {
        "ru": "Внутренняя косая мышца живота",
        "latin": "musculus obliquus internus abdominis",
        "modelAliases": [
          "internal oblique",
          "internal abdominal oblique",
          "obliquus internus abdominis"
        ]
      },
      "subregions": [
        "anterolateral-abdominal-wall"
      ],
      "layer": "intermediate",
      "anatomy": {
        "originRu": [
          "Грудопоясничная фасция.",
          "Передние две трети подвздошного гребня.",
          "Латеральная часть паховой связки."
        ],
        "insertionRu": [
          "Нижние края X–XII рёбер.",
          "Белая линия живота через апоневроз.",
          "Нижние волокна участвуют в формировании общего сухожилия с поперечной мышцей живота."
        ],
        "fiberDirectionRu": "Большинство волокон идёт вверх и медиально, примерно перпендикулярно наружной косой; нижние волокна имеют более горизонтальное направление.",
        "actionsRu": [
          "При двустороннем сокращении участвует в сгибании туловища и повышении внутрибрюшного давления.",
          "При одностороннем сокращении участвует в боковом сгибании и повороте туловища в свою сторону."
        ],
        "innervationRu": "Передние ветви нижних грудных спинномозговых нервов и L1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвздошный гребень",
          "нижние рёбра",
          "латеральная часть паховой связки"
        ],
        "relationsRu": [
          "Лежит глубже наружной косой и поверхностнее поперечной мышцы живота."
        ]
      },
      "movementCueRu": "Поворот туловища в сторону сокращения помогает понять отличие функции от наружной косой мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел III, 1.2 «Внутренняя косая мышца живота»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-abdominal-wall",
          "locator": "Internal Oblique",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "transversus-abdominis",
      "kind": "muscle",
      "names": {
        "ru": "Поперечная мышца живота",
        "latin": "musculus transversus abdominis",
        "modelAliases": [
          "transversus abdominis",
          "transverse abdominis"
        ]
      },
      "subregions": [
        "anterolateral-abdominal-wall"
      ],
      "layer": "deep",
      "anatomy": {
        "originRu": [
          "Внутренние поверхности нижних рёберных хрящей.",
          "Грудопоясничная фасция.",
          "Подвздошный гребень.",
          "Латеральная часть паховой связки."
        ],
        "insertionRu": [
          "Белая линия живота через апоневроз.",
          "Лобковый гребень и гребенчатая линия через нижние апоневротические волокна."
        ],
        "fiberDirectionRu": "Большая часть волокон идёт почти поперечно.",
        "actionsRu": [
          "Сжимает и поддерживает содержимое брюшной полости.",
          "Участвует в повышении внутрибрюшного давления и стабилизации стенки живота.",
          "Не является главным двигателем сгибания или вращения туловища."
        ],
        "innervationRu": "Передние ветви нижних грудных спинномозговых нервов и L1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижние рёбра",
          "подвздошный гребень",
          "белая линия живота"
        ],
        "relationsRu": [
          "Самый глубокий из трёх широких боковых мышечных слоёв живота."
        ]
      },
      "movementCueRu": "Проследить почти поперечное направление волокон глубже обеих косых мышц и переход в широкий апоневроз.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел III, 1.3 «Поперечная мышца живота»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-abdominal-wall",
          "locator": "Transversus Abdominis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "rectus-abdominis",
      "kind": "muscle",
      "names": {
        "ru": "Прямая мышца живота",
        "latin": "musculus rectus abdominis",
        "modelAliases": [
          "rectus abdominis"
        ]
      },
      "subregions": [
        "anterior-abdominal-wall"
      ],
      "layer": "superficial-within-rectus-sheath",
      "anatomy": {
        "originRu": [
          "Лобковый гребень и область лобкового симфиза."
        ],
        "insertionRu": [
          "Мечевидный отросток и хрящи V–VII рёбер."
        ],
        "fiberDirectionRu": "Вертикальные мышечные пучки прерываются сухожильными перемычками.",
        "actionsRu": [
          "Сгибает туловище при соответствующей фиксации таза.",
          "Участвует в заднем наклоне таза при фиксированной грудной клетке.",
          "Сжимает содержимое брюшной полости и участвует в создании внутрибрюшного давления."
        ],
        "innervationRu": "Грудобрюшные нервы нижних грудных сегментов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Белая линия живота",
          "рёберная дуга",
          "лобковая область"
        ],
        "relationsRu": [
          "Заключена во влагалище прямой мышцы живота, образованное апоневрозами широких мышц."
        ]
      },
      "movementCueRu": "Сгибание туловища показывает общую функцию мышцы, но не требует максимального напряжения для анатомической ориентации.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел III, 2 «Прямая мышца живота»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-abdominal-wall",
          "locator": "Anterolateral abdominal wall muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-anterolateral-abdominal-wall-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-source-index-gap"
      }
    },
    {
      "id": "pyramidalis",
      "kind": "muscle",
      "names": {
        "ru": "Пирамидальная мышца",
        "latin": "musculus pyramidalis",
        "modelAliases": [
          "pyramidalis"
        ]
      },
      "subregions": [
        "lower-anterior-abdominal-wall"
      ],
      "layer": "superficial-within-rectus-sheath",
      "anatomy": {
        "originRu": [
          "Лобковый гребень и область лобкового симфиза."
        ],
        "insertionRu": [
          "Нижняя часть белой линии живота."
        ],
        "fiberDirectionRu": "Короткие пучки идут вверх и медиально.",
        "actionsRu": [
          "Натягивает белую линию живота."
        ],
        "innervationRu": "Обычно подрёберный нерв T12."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая область",
          "нижняя часть белой линии живота"
        ],
        "relationsRu": [
          "Небольшая вариабельная мышца перед прямой мышцей живота в нижней части её влагалища; может отсутствовать."
        ]
      },
      "movementCueRu": "Небольшая вариабельная мышца нижней части влагалища прямой мышцы живота; у части людей отсутствует.",
      "sources": [
        {
          "sourceId": "ncbi-anterolateral-abdominal-wall-nerves",
          "locator": "Muscles; physiologic variants",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variant"
      }
    }
  ]
});

export const THORAX_ABDOMEN_STRUCTURE_COUNT = THORAX_ABDOMEN_REGION.structures.length;

export function thoraxAbdomenStructureById(id) {
  return THORAX_ABDOMEN_REGION.structures.find((item) => item.id === id) || null;
}
