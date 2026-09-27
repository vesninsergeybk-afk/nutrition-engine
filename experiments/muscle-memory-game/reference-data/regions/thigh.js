function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const THIGH_REGION = deepFreeze({
  "id": "thigh",
  "nameRu": "Бедро",
  "status": "verified-v1",
  "scopeRu": "Передняя, медиальная и задняя мышечные группы бедра от тазобедренного сустава до колена.",
  "functionalGroups": [
    {
      "id": "quadriceps-femoris",
      "nameRu": "Четырёхглавая мышца бедра",
      "members": [
        "rectus-femoris",
        "vastus-lateralis",
        "vastus-medialis",
        "vastus-intermedius"
      ]
    },
    {
      "id": "hamstrings",
      "nameRu": "Задняя группа бедра (hamstrings)",
      "members": [
        "biceps-femoris",
        "semitendinosus",
        "semimembranosus"
      ]
    },
    {
      "id": "adductor-group",
      "nameRu": "Приводящая группа",
      "members": [
        "adductor-longus",
        "adductor-brevis",
        "adductor-magnus",
        "gracilis",
        "pectineus",
        "adductor-minimus"
      ]
    }
  ],
  "relatedStructureIds": [
    "tensor-fasciae-latae",
    "gluteus-maximus",
    "gluteus-medius",
    "gluteus-minimus",
    "obturator-externus"
  ],
  "teachingPrinciplesRu": [
    "Сначала делить бедро на передний, медиальный и задний компартменты, затем разбирать отдельные мышцы.",
    "Четырёхглавую мышцу показывать как единую систему разгибания колена с одной двухсуставной частью — rectus femoris.",
    "Заднюю группу объяснять через различие двухсуставных мышц и короткой головки biceps femoris, которая тазобедренный сустав не пересекает.",
    "Большую приводящую мышцу обязательно делить на приводящую и заднюю части, потому что у них различаются функция и иннервация.",
    "Подколенную и проксимальную медиальную области связывать с сосудисто-нервными границами, не превращая их в зоны глубокой ручной работы."
  ],
  "structures": [
    {
      "id": "sartorius",
      "kind": "muscle",
      "names": {
        "ru": "Портняжная мышца",
        "latin": "musculus sartorius",
        "modelAliases": [
          "sartorius"
        ]
      },
      "layer": "anterior-superficial",
      "subregions": [
        "anterior-thigh",
        "medial-knee"
      ],
      "anatomy": {
        "originRu": [
          "Передняя верхняя подвздошная ость."
        ],
        "insertionRu": [
          "Медиальная поверхность проксимальной большеберцовой кости в составе «гусиной лапки»."
        ],
        "fiberDirectionRu": "Длинная лентовидная мышца идёт косо сверху-латерально вниз-медиально через переднюю поверхность бедра.",
        "actionsRu": [
          "Сгибает бедро.",
          "Отводит и вращает бедро наружу.",
          "Сгибает колено и при согнутом колене помогает внутреннему вращению голени."
        ],
        "innervationRu": "Бедренный нерв, L2–L3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя верхняя подвздошная ость",
          "медиальная поверхность колена",
          "гусиная лапка"
        ],
        "relationsRu": [
          "Самая длинная мышца тела; поверхностно пересекает переднюю поверхность бедра и формирует латеральную границу бедренного треугольника в проксимальном отделе."
        ]
      },
      "movementCueRu": "Положение «пятка к противоположному колену» сочетает несколько её действий, но не является тестом изолированной функции.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, портняжная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-medial-thigh",
          "locator": "Sartorius",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "rectus-femoris",
      "kind": "muscle",
      "names": {
        "ru": "Прямая мышца бедра",
        "latin": "musculus rectus femoris",
        "modelAliases": [
          "rectus femoris"
        ]
      },
      "layer": "anterior-superficial",
      "subregions": [
        "anterior-thigh",
        "quadriceps"
      ],
      "anatomy": {
        "originRu": [
          "Передняя нижняя подвздошная ость.",
          "Область над вертлужной впадиной и капсула тазобедренного сустава через отражённую головку."
        ],
        "insertionRu": [
          "Основание надколенника через сухожилие четырёхглавой мышцы.",
          "Через связку надколенника — бугристость большеберцовой кости."
        ],
        "fiberDirectionRu": "Длинные волокна идут почти вертикально по центру передней поверхности бедра.",
        "actionsRu": [
          "Разгибает колено.",
          "Сгибает бедро в тазобедренном суставе."
        ],
        "innervationRu": "Бедренный нерв, L2–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя нижняя подвздошная ость",
          "надколенник",
          "бугристость большеберцовой кости"
        ],
        "relationsRu": [
          "Единственная часть четырёхглавой мышцы, пересекающая и тазобедренный, и коленный сустав."
        ]
      },
      "movementCueRu": "Разгибание колена и сгибание бедра показывают её двухсуставную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, четырёхглавая мышца бедра — прямая",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thigh-muscles",
          "locator": "Anterior compartment",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "vastus-lateralis",
      "kind": "muscle",
      "names": {
        "ru": "Латеральная широкая мышца бедра",
        "latin": "musculus vastus lateralis",
        "modelAliases": [
          "vastus lateralis"
        ]
      },
      "layer": "anterior-lateral",
      "subregions": [
        "anterolateral-thigh",
        "quadriceps"
      ],
      "anatomy": {
        "originRu": [
          "Большой вертел.",
          "Латеральная губа шероховатой линии и прилежащая латеральная поверхность бедренной кости."
        ],
        "insertionRu": [
          "Латеральный край надколенника через сухожилие четырёхглавой мышцы.",
          "Через связку надколенника — бугристость большеберцовой кости."
        ],
        "fiberDirectionRu": "Пучки идут вниз и медиально к надколеннику.",
        "actionsRu": [
          "Разгибает колено.",
          "Участвует в динамической стабилизации надколенника совместно с другими частями четырёхглавой мышцы."
        ],
        "innervationRu": "Бедренный нерв, L2–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Большой вертел",
          "латеральная поверхность бедра",
          "надколенник"
        ],
        "relationsRu": [
          "Крупная поверхностная мышечная масса латеральной части бедра; глубже частично лежит промежуточная широкая."
        ]
      },
      "movementCueRu": "Разгибание колена делает латеральный массив четырёхглавой мышцы заметнее.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, четырёхглавая мышца бедра — латеральная широкая",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thigh-muscles",
          "locator": "Quadriceps",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "vastus-medialis",
      "kind": "muscle",
      "names": {
        "ru": "Медиальная широкая мышца бедра",
        "latin": "musculus vastus medialis",
        "modelAliases": [
          "vastus medialis"
        ]
      },
      "layer": "anterior-medial",
      "subregions": [
        "anteromedial-thigh",
        "quadriceps"
      ],
      "anatomy": {
        "originRu": [
          "Межвертельная линия.",
          "Медиальная губа шероховатой линии и медиальная надмыщелковая линия бедренной кости."
        ],
        "insertionRu": [
          "Медиальный край надколенника и сухожилие четырёхглавой мышцы.",
          "Через связку надколенника — бугристость большеберцовой кости."
        ],
        "fiberDirectionRu": "Пучки идут вниз к надколеннику; дистальные волокна имеют более косое направление.",
        "actionsRu": [
          "Разгибает колено.",
          "Совместно с остальными частями четырёхглавой мышцы участвует в контроле положения надколенника."
        ],
        "innervationRu": "Бедренный нерв, L2–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальная поверхность бедра",
          "медиальный край надколенника"
        ],
        "relationsRu": [
          "Дистальная часть образует заметный рельеф над медиальной стороной колена."
        ]
      },
      "movementCueRu": "Разгибание колена показывает мышцу, но не позволяет оценивать «баланс» надколенника по одному видимому сокращению.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, четырёхглавая мышца бедра — медиальная широкая",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thigh-muscles",
          "locator": "Quadriceps",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "vastus-intermedius",
      "kind": "muscle",
      "names": {
        "ru": "Промежуточная широкая мышца бедра",
        "latin": "musculus vastus intermedius",
        "modelAliases": [
          "vastus intermedius"
        ]
      },
      "layer": "anterior-deep",
      "subregions": [
        "anterior-thigh",
        "quadriceps"
      ],
      "anatomy": {
        "originRu": [
          "Передняя и латеральная поверхности проксимальных двух третей бедренной кости."
        ],
        "insertionRu": [
          "Глубокая часть сухожилия четырёхглавой мышцы к надколеннику.",
          "Через связку надколенника — бугристость большеберцовой кости."
        ],
        "fiberDirectionRu": "Пучки идут вниз по передней поверхности бедренной кости.",
        "actionsRu": [
          "Разгибает колено."
        ],
        "innervationRu": "Бедренный нерв, L2–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность бедренной кости",
          "надколенник"
        ],
        "relationsRu": [
          "Лежит глубже прямой мышцы бедра между медиальной и латеральной широкими; на поверхности не выделяется как отдельное брюшко."
        ]
      },
      "movementCueRu": "Искать глубже прямой мышцы бедра между медиальной и латеральной широкими мышцами.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, четырёхглавая мышца бедра — промежуточная широкая",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-thigh-muscles",
          "locator": "Quadriceps",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "biceps-femoris",
      "kind": "muscle",
      "names": {
        "ru": "Двуглавая мышца бедра",
        "latin": "musculus biceps femoris",
        "modelAliases": [
          "biceps femoris"
        ]
      },
      "layer": "posterior-lateral",
      "subregions": [
        "posterior-thigh",
        "hamstrings"
      ],
      "anatomy": {
        "originRu": [
          "Длинная головка — седалищный бугор.",
          "Короткая головка — латеральная губа шероховатой линии и латеральная надмыщелковая линия бедренной кости."
        ],
        "insertionRu": [
          "Головка малоберцовой кости; часть волокон связана с латеральным мыщелком большеберцовой кости и фасцией голени."
        ],
        "fiberDirectionRu": "Две головки сходятся дистально к латеральной стороне колена.",
        "actionsRu": [
          "Обе головки сгибают колено и при согнутом колене вращают голень наружу.",
          "Длинная головка также разгибает бедро; короткая головка тазобедренный сустав не пересекает."
        ],
        "innervationRu": "Длинная головка — большеберцовая часть седалищного нерва; короткая — общая малоберцовая часть."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "латеральная задняя поверхность бедра",
          "головка малоберцовой кости"
        ],
        "relationsRu": [
          "Формирует верхнелатеральную границу подколенной ямки; общий малоберцовый нерв проходит рядом с её дистальным сухожилием."
        ]
      },
      "movementCueRu": "Сгибание колена с наружным вращением голени помогает понять латеральную функцию группы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, двуглавая мышца бедра",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hamstrings",
          "locator": "Biceps femoris",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-dual-innervation"
      }
    },
    {
      "id": "semitendinosus",
      "kind": "muscle",
      "names": {
        "ru": "Полусухожильная мышца",
        "latin": "musculus semitendinosus",
        "modelAliases": [
          "semitendinosus"
        ]
      },
      "layer": "posterior-superficial-medial",
      "subregions": [
        "posterior-thigh",
        "hamstrings",
        "medial-knee"
      ],
      "anatomy": {
        "originRu": [
          "Седалищный бугор общим проксимальным апоневрозом с длинной головкой двуглавой мышцы."
        ],
        "insertionRu": [
          "Медиальная поверхность проксимальной большеберцовой кости в составе «гусиной лапки»."
        ],
        "fiberDirectionRu": "Длинное мышечное брюшко переходит в выраженное дистальное сухожилие.",
        "actionsRu": [
          "Разгибает бедро.",
          "Сгибает колено.",
          "При согнутом колене вращает голень внутрь."
        ],
        "innervationRu": "Большеберцовая часть седалищного нерва, преимущественно L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "заднемедиальная поверхность бедра",
          "гусиная лапка"
        ],
        "relationsRu": [
          "Лежит поверхностнее полуперепончатой; формирует верхнемедиальную границу подколенной ямки."
        ]
      },
      "movementCueRu": "Сгибание колена с внутренним вращением голени показывает медиальную функцию задней группы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, полусухожильная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hamstrings",
          "locator": "Semitendinosus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "semimembranosus",
      "kind": "muscle",
      "names": {
        "ru": "Полуперепончатая мышца",
        "latin": "musculus semimembranosus",
        "modelAliases": [
          "semimembranosus"
        ]
      },
      "layer": "posterior-deep-medial",
      "subregions": [
        "posterior-thigh",
        "hamstrings",
        "medial-knee"
      ],
      "anatomy": {
        "originRu": [
          "Верхнелатеральная часть седалищного бугра."
        ],
        "insertionRu": [
          "Задняя поверхность медиального мыщелка большеберцовой кости.",
          "Сухожильные расширения участвуют в формировании косой подколенной связки и других заднемедиальных структур колена."
        ],
        "fiberDirectionRu": "Проксимально широкое плоское сухожилие переходит в мышечное брюшко, затем в сложное дистальное сухожилие.",
        "actionsRu": [
          "Разгибает бедро.",
          "Сгибает колено.",
          "При согнутом колене вращает голень внутрь."
        ],
        "innervationRu": "Большеберцовая часть седалищного нерва, преимущественно L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "медиальный мыщелок большеберцовой кости",
          "подколенная ямка"
        ],
        "relationsRu": [
          "Лежит глубже полусухожильной и образует часть верхнемедиальной границы подколенной ямки."
        ]
      },
      "movementCueRu": "Отличать от полусухожильной мышцы по более глубокому положению и широкому проксимальному сухожилию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, полуперепончатая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hamstrings",
          "locator": "Semimembranosus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "adductor-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинная приводящая мышца",
        "latin": "musculus adductor longus",
        "modelAliases": [
          "adductor longus"
        ]
      },
      "layer": "medial-superficial",
      "subregions": [
        "medial-thigh",
        "adductors"
      ],
      "anatomy": {
        "originRu": [
          "Тело лобковой кости ниже лобкового гребня."
        ],
        "insertionRu": [
          "Средняя треть медиальной губы шероховатой линии бедренной кости."
        ],
        "fiberDirectionRu": "Треугольная мышца расширяется от узкого проксимального начала к бедренной кости.",
        "actionsRu": [
          "Приводит бедро.",
          "Участвует в сгибании бедра, особенно из разгибания; вклад в ротацию зависит от положения."
        ],
        "innervationRu": "Передняя ветвь запирательного нерва, L2–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "медиальная поверхность бедра",
          "шероховатая линия"
        ],
        "relationsRu": [
          "Формирует медиальную границу бедренного треугольника и лежит поверхностнее короткой приводящей."
        ]
      },
      "movementCueRu": "Приведение бедра показывает общую функцию приводящей группы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, длинная приводящая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-medial-thigh",
          "locator": "Adductor longus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-action-caution"
      }
    },
    {
      "id": "adductor-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткая приводящая мышца",
        "latin": "musculus adductor brevis",
        "modelAliases": [
          "adductor brevis"
        ]
      },
      "layer": "medial-intermediate",
      "subregions": [
        "medial-thigh",
        "adductors"
      ],
      "anatomy": {
        "originRu": [
          "Тело и нижняя ветвь лобковой кости."
        ],
        "insertionRu": [
          "Гребенчатая линия бедренной кости.",
          "Проксимальная часть шероховатой линии."
        ],
        "fiberDirectionRu": "Короткие пучки идут вниз и латерально.",
        "actionsRu": [
          "Приводит бедро.",
          "Помогает сгибанию бедра."
        ],
        "innervationRu": "Запирательный нерв L2–L4; ветвь может отходить от передней или задней части нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "проксимальная медиальная поверхность бедра"
        ],
        "relationsRu": [
          "Лежит глубже длинной приводящей и гребенчатой, поверхностнее части большой приводящей."
        ]
      },
      "movementCueRu": "Структура важна для слоёв медиальной группы; отдельная наружная изоляция ограничена.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткая приводящая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-medial-thigh",
          "locator": "Adductor brevis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-innervation-variation"
      }
    },
    {
      "id": "adductor-magnus",
      "kind": "muscle",
      "names": {
        "ru": "Большая приводящая мышца",
        "latin": "musculus adductor magnus",
        "modelAliases": [
          "adductor magnus"
        ]
      },
      "layer": "medial-deep",
      "subregions": [
        "medial-thigh",
        "posterior-thigh",
        "adductors"
      ],
      "anatomy": {
        "originRu": [
          "Приводящая часть — нижняя ветвь лобковой и ветвь седалищной кости.",
          "Задняя (hamstring) часть — седалищный бугор."
        ],
        "insertionRu": [
          "Приводящая часть — ягодичная бугристость, шероховатая линия и медиальная надмыщелковая линия.",
          "Задняя часть — приводящий бугорок бедренной кости."
        ],
        "fiberDirectionRu": "Большая веерообразная мышца охватывает значительную часть медиально-задней поверхности бедра.",
        "actionsRu": [
          "Обе части приводят бедро.",
          "Приводящая часть преимущественно помогает сгибанию бедра.",
          "Задняя часть разгибает бедро."
        ],
        "innervationRu": "Приводящая часть — задняя ветвь запирательного нерва L2–L4; задняя часть — большеберцовая часть седалищного нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "лобковая кость",
          "шероховатая линия",
          "приводящий бугорок"
        ],
        "relationsRu": [
          "В мышце имеется сухожильное отверстие — hiatus adductorius — для перехода бедренных сосудов в подколенную ямку."
        ]
      },
      "movementCueRu": "Обязательно различать приводящую и заднюю части: у них различаются направление волокон, функция и иннервация.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, большая приводящая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-adductor-magnus",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-two-parts"
      }
    },
    {
      "id": "gracilis",
      "kind": "muscle",
      "names": {
        "ru": "Тонкая мышца",
        "latin": "musculus gracilis",
        "modelAliases": [
          "gracilis"
        ]
      },
      "layer": "medial-superficial",
      "subregions": [
        "medial-thigh",
        "medial-knee"
      ],
      "anatomy": {
        "originRu": [
          "Тело и нижняя ветвь лобковой кости."
        ],
        "insertionRu": [
          "Медиальная поверхность проксимальной большеберцовой кости в составе «гусиной лапки»."
        ],
        "fiberDirectionRu": "Длинная тонкая мышца идёт почти вертикально по медиальной поверхности бедра.",
        "actionsRu": [
          "Приводит бедро.",
          "Сгибает колено.",
          "При согнутом колене помогает внутреннему вращению голени."
        ],
        "innervationRu": "Передняя ветвь запирательного нерва, L2–L3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковая кость",
          "медиальная поверхность бедра",
          "гусиная лапка"
        ],
        "relationsRu": [
          "Единственная из основной приводящей группы пересекает коленный сустав."
        ]
      },
      "movementCueRu": "Приведение бедра и сгибание колена помогают понять её двухсуставную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, тонкая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-medial-thigh",
          "locator": "Gracilis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "pectineus",
      "kind": "muscle",
      "names": {
        "ru": "Гребенчатая мышца",
        "latin": "musculus pectineus",
        "modelAliases": [
          "pectineus"
        ]
      },
      "layer": "proximal-medial-superficial",
      "subregions": [
        "proximal-medial-thigh",
        "femoral-triangle"
      ],
      "anatomy": {
        "originRu": [
          "Гребень и верхняя ветвь лобковой кости."
        ],
        "insertionRu": [
          "Гребенчатая линия бедренной кости ниже малого вертела."
        ],
        "fiberDirectionRu": "Короткие плоские пучки идут вниз и латерально.",
        "actionsRu": [
          "Сгибает и приводит бедро.",
          "Может участвовать во внутреннем вращении в зависимости от положения бедра."
        ],
        "innervationRu": "Обычно бедренный нерв L2–L3; возможны ветви запирательного или добавочного запирательного нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лобковый гребень",
          "малый вертел",
          "бедренный треугольник"
        ],
        "relationsRu": [
          "Лежит в дне бедренного треугольника, латеральнее длинной приводящей; рядом проходят бедренные сосуды."
        ]
      },
      "movementCueRu": "Ориентироваться на дно бедренного треугольника между подвздошно-поясничной и длинной приводящей мышцами; рядом проходят бедренные сосуды.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, гребенчатая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-medial-thigh",
          "locator": "Pectineus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-innervation-variation"
      }
    },
    {
      "id": "adductor-minimus",
      "kind": "variable-muscle-part",
      "names": {
        "ru": "Малая приводящая мышца",
        "latin": "musculus adductor minimus",
        "modelAliases": [
          "adductor minimus"
        ]
      },
      "layer": "medial-deep-proximal",
      "subregions": [
        "proximal-medial-thigh",
        "deep-hip"
      ],
      "anatomy": {
        "originRu": [
          "Верхняя часть нижней ветви лобковой кости; часть волокон может продолжаться от прилежащей ветви седалищной кости."
        ],
        "insertionRu": [
          "Медиальный край ягодичной бугристости и самая верхняя часть шероховатой линии бедренной кости."
        ],
        "fiberDirectionRu": "Короткие почти горизонтальные пучки идут латерально от лобковой области к проксимальной бедренной кости.",
        "actionsRu": [
          "Приводит бедро.",
          "Может помогать сгибанию бедра как верхняя часть приводящего отдела большой приводящей мышцы."
        ],
        "innervationRu": "Задняя ветвь запирательного нерва, преимущественно L2–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя ветвь лобковой кости",
          "ягодичная бугристость",
          "проксимальная шероховатая линия"
        ],
        "relationsRu": [
          "Нередко рассматривается не как самостоятельная мышца, а как верхняя горизонтальная часть приводящего отдела adductor magnus.",
          "Лежит глубже и проксимальнее основной массы длинной и короткой приводящих мышц."
        ]
      },
      "movementCueRu": "Рассматривать как вариабельно выделяемую верхнюю часть приводящего отдела большой приводящей мышцы.",
      "sources": [
        {
          "sourceId": "ncbi-adductor-magnus",
          "locator": "Adductor portion — superior segment",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-adductor-magnus",
          "locator": "Superior portion / adductor minimus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable-subdivision"
      }
    }
  ]
});

export const THIGH_STRUCTURE_COUNT = THIGH_REGION.structures.length;

export function thighStructureById(id) {
  return THIGH_REGION.structures.find((item) => item.id === id) || null;
}
