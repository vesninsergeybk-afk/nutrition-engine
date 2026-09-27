function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const PELVIS_GLUTEAL_REGION = deepFreeze({
  "id": "pelvis-gluteal",
  "nameRu": "Таз и ягодичная область",
  "status": "verified-v1",
  "scopeRu": "Глубокие сгибатели тазобедренного сустава, ягодичные мышцы, напрягатель широкой фасции и короткие наружные ротаторы.",
  "teachingPrinciplesRu": [
    "Сначала показывать костную рамку: подвздошный гребень, крестец, седалищный бугор, большой и малый вертел.",
    "Большую, среднюю и малую ягодичные показывать как последовательные слои, а не как три изолированные мишени.",
    "Короткие наружные ротаторы хранить отдельными карточками для 3D-анатомии, но в базовой практике объяснять как глубокий комплекс.",
    "Подвздошно-большеберцовый тракт классифицировать как фасциальное образование, а не как мышцу.",
    "Отношения грушевидной мышцы и остальных глубоких ротаторов с седалищным нервом считать обязательной частью анатомической карты безопасности."
  ],
  "structures": [
    {
      "id": "psoas-major",
      "kind": "muscle",
      "names": {
        "ru": "Большая поясничная мышца",
        "latin": "musculus psoas major",
        "modelAliases": [
          "psoas major"
        ]
      },
      "layer": "deep-posterior-abdominal-wall",
      "subregions": [
        "posterior-abdominal-wall",
        "hip-flexor"
      ],
      "anatomy": {
        "originRu": [
          "Боковые поверхности тел T12–L5 и межпозвоночных дисков.",
          "Поперечные отростки L1–L5."
        ],
        "insertionRu": [
          "Малый вертел бедренной кости общим сухожилием с подвздошной мышцей."
        ],
        "fiberDirectionRu": "Длинные пучки идут вниз и латерально от поясничного отдела через таз к малому вертелу.",
        "actionsRu": [
          "Сгибает бедро в тазобедренном суставе.",
          "При фиксированной нижней конечности участвует в сгибании и контроле положения поясничного отдела; действие зависит от положения тела."
        ],
        "innervationRu": "Передние ветви поясничных спинномозговых нервов, преимущественно L1–L3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поясничные позвонки",
          "малый вертел",
          "паховая область"
        ],
        "relationsRu": [
          "Глубокая мышца задней брюшной стенки; проходит рядом с поясничным сплетением и соединяется с подвздошной мышцей в комплекс iliopsoas."
        ]
      },
      "movementCueRu": "Карточка нужна для понимания глубокого сгибателя бедра; наружная пальпация не должна подаваться как точная изоляция всей мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, подвздошно-поясничная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-iliopsoas",
          "locator": "Iliopsoas musculotendinous unit",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-functional-caution"
      }
    },
    {
      "id": "iliacus",
      "kind": "muscle",
      "names": {
        "ru": "Подвздошная мышца",
        "latin": "musculus iliacus",
        "modelAliases": [
          "iliacus"
        ]
      },
      "layer": "deep-pelvic-anterior",
      "subregions": [
        "iliac-fossa",
        "hip-flexor"
      ],
      "anatomy": {
        "originRu": [
          "Подвздошная ямка и внутренний край подвздошного гребня.",
          "Передние крестцово-подвздошные связки и прилежащая область крыла крестца."
        ],
        "insertionRu": [
          "Сухожилие большой поясничной мышцы и малый вертел бедренной кости.",
          "Часть волокон может прикрепляться к бедренной кости ниже малого вертела."
        ],
        "fiberDirectionRu": "Веерообразные пучки сходятся вниз и медиально к сухожилию iliopsoas.",
        "actionsRu": [
          "Сгибает бедро.",
          "Помогает стабилизировать тазобедренный сустав в составе iliopsoas."
        ],
        "innervationRu": "Бедренный нерв, преимущественно L2–L3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвздошная ямка",
          "паховая связка",
          "малый вертел"
        ],
        "relationsRu": [
          "Заполняет подвздошную ямку и соединяется с большой поясничной мышцей перед выходом под паховой связкой."
        ]
      },
      "movementCueRu": "Сгибание бедра отражает работу всего iliopsoas, а не позволяет надёжно разделить подвздошную и поясничную мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, подвздошно-поясничная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-iliopsoas",
          "locator": "Iliacus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "psoas-minor",
      "kind": "muscle",
      "names": {
        "ru": "Малая поясничная мышца",
        "latin": "musculus psoas minor",
        "modelAliases": [
          "psoas minor"
        ]
      },
      "layer": "deep-posterior-abdominal-wall-variable",
      "subregions": [
        "posterior-abdominal-wall"
      ],
      "anatomy": {
        "originRu": [
          "Боковые поверхности тел T12–L1 и межпозвоночный диск между ними."
        ],
        "insertionRu": [
          "Подвздошно-лобковое возвышение и фасция подвздошно-поясничной области."
        ],
        "fiberDirectionRu": "Тонкое брюшко переходит в длинное сухожилие впереди большой поясничной мышцы.",
        "actionsRu": [
          "Слабо сгибает поясничный отдел и натягивает подвздошную фасцию; функциональный вклад невелик."
        ],
        "innervationRu": "Передняя ветвь L1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "T12–L1",
          "подвздошно-лобковое возвышение"
        ],
        "relationsRu": [
          "Часто отсутствует; отсутствие является нормальным анатомическим вариантом."
        ]
      },
      "movementCueRu": "В тренажёре структура должна иметь отметку вариабельности и не использоваться как обязательный ориентир.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, малая поясничная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-iliopsoas",
          "locator": "Psoas minor / physiologic variation",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable"
      }
    },
    {
      "id": "gluteus-maximus",
      "kind": "muscle",
      "names": {
        "ru": "Большая ягодичная мышца",
        "latin": "musculus gluteus maximus",
        "modelAliases": [
          "gluteus maximus"
        ]
      },
      "layer": "superficial-gluteal",
      "subregions": [
        "gluteal-region",
        "posterior-hip"
      ],
      "anatomy": {
        "originRu": [
          "Задняя часть подвздошной кости позади задней ягодичной линии.",
          "Дорсальная поверхность крестца и копчика.",
          "Крестцово-бугорная связка и грудопоясничная фасция."
        ],
        "insertionRu": [
          "Большая часть поверхностных волокон — подвздошно-большеберцовый тракт.",
          "Глубокие нижние волокна — ягодичная бугристость бедренной кости."
        ],
        "fiberDirectionRu": "Толстые пучки идут вниз и латерально примерно под углом к продольной оси туловища.",
        "actionsRu": [
          "Разгибает бедро, особенно из согнутого положения.",
          "Вращает бедро наружу.",
          "Верхние и нижние пучки могут по-разному участвовать в отведении и приведении; мышца также помогает стабилизировать таз и бедро через подвздошно-большеберцовый тракт."
        ],
        "innervationRu": "Нижний ягодичный нерв, L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвздошный гребень",
          "крестец",
          "копчик",
          "большой вертел",
          "ягодичная складка"
        ],
        "relationsRu": [
          "Самая поверхностная крупная мышца ягодичной области; перекрывает большую часть коротких наружных ротаторов и седалищного нерва."
        ]
      },
      "movementCueRu": "Разгибание бедра из согнутого положения хорошо показывает основную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, большая ягодичная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-gluteus-maximus",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      },
      "illustrations": [
        {
          "sourceId": "gray-hip-thigh-public-domain",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ]
    },
    {
      "id": "gluteus-medius",
      "kind": "muscle",
      "names": {
        "ru": "Средняя ягодичная мышца",
        "latin": "musculus gluteus medius",
        "modelAliases": [
          "gluteus medius"
        ]
      },
      "layer": "intermediate-gluteal",
      "subregions": [
        "lateral-hip",
        "gluteal-region"
      ],
      "anatomy": {
        "originRu": [
          "Наружная поверхность подвздошной кости между передней и задней ягодичными линиями."
        ],
        "insertionRu": [
          "Латеральная поверхность большого вертела бедренной кости."
        ],
        "fiberDirectionRu": "Веерообразные волокна сходятся вниз и латерально к большому вертелу.",
        "actionsRu": [
          "Отводит бедро.",
          "Во время опоры на одну ногу помогает удерживать таз от падения на противоположную сторону.",
          "Передние пучки преимущественно участвуют во внутреннем вращении; вклад задних пучков зависит от положения бедра и задачи."
        ],
        "innervationRu": "Верхний ягодичный нерв, L4–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвздошный гребень",
          "большой вертел"
        ],
        "relationsRu": [
          "Передние две трети сравнительно поверхностны под фасцией; задняя часть перекрыта большой ягодичной мышцей. Мышца лежит поверх малой ягодичной."
        ]
      },
      "movementCueRu": "Опора на одну ногу показывает функциональную роль абдукторов таза лучше, чем попытка изолировать отдельный пучок.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, средняя ягодичная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-gluteus-medius",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-action-nuance"
      }
    },
    {
      "id": "gluteus-minimus",
      "kind": "muscle",
      "names": {
        "ru": "Малая ягодичная мышца",
        "latin": "musculus gluteus minimus",
        "modelAliases": [
          "gluteus minimus"
        ]
      },
      "layer": "deep-gluteal",
      "subregions": [
        "lateral-hip",
        "gluteal-region"
      ],
      "anatomy": {
        "originRu": [
          "Наружная поверхность подвздошной кости между передней и нижней ягодичными линиями."
        ],
        "insertionRu": [
          "Передняя поверхность большого вертела бедренной кости."
        ],
        "fiberDirectionRu": "Веерообразные волокна сходятся к передней части большого вертела.",
        "actionsRu": [
          "Отводит бедро.",
          "Участвует во внутреннем вращении бедра.",
          "Вместе со средней ягодичной и TFL стабилизирует таз при одноопорной фазе ходьбы."
        ],
        "innervationRu": "Верхний ягодичный нерв, L4–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Большой вертел",
          "наружная поверхность подвздошной кости"
        ],
        "relationsRu": [
          "Лежит глубже средней ягодичной мышцы; между ними проходят ветви верхнего ягодичного нерва и сосудов."
        ]
      },
      "movementCueRu": "Для базового уровня мышцу показывают как глубокого партнёра средней ягодичной в стабилизации таза.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, малая ягодичная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-gluteus-minimus",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "tensor-fasciae-latae",
      "kind": "muscle",
      "names": {
        "ru": "Напрягатель широкой фасции",
        "latin": "musculus tensor fasciae latae",
        "modelAliases": [
          "tensor fasciae latae",
          "tensor fascia lata"
        ]
      },
      "layer": "superficial-anterolateral-hip",
      "subregions": [
        "anterolateral-hip",
        "proximal-thigh"
      ],
      "anatomy": {
        "originRu": [
          "Передняя верхняя подвздошная ость.",
          "Передняя часть наружной губы подвздошного гребня."
        ],
        "insertionRu": [
          "Подвздошно-большеберцовый тракт, который продолжается к латеральному мыщелку большеберцовой кости."
        ],
        "fiberDirectionRu": "Короткое мышечное брюшко идёт вниз и несколько назад, переходя в фасциальный тракт.",
        "actionsRu": [
          "Сгибает, отводит и вращает бедро внутрь.",
          "Через подвздошно-большеберцовый тракт участвует в стабилизации таза и латеральной стороны колена."
        ],
        "innervationRu": "Верхний ягодичный нерв, L4–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя верхняя подвздошная ость",
          "большой вертел",
          "латеральная поверхность бедра"
        ],
        "relationsRu": [
          "Мышца заканчивается в подвздошно-большеберцовом тракте; сам тракт является плотным фасциальным образованием, а не мышцей."
        ]
      },
      "movementCueRu": "Сгибание и отведение бедра помогают увидеть переднелатеральное положение мышечного брюшка.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, напрягатель широкой фасции бедра",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-tensor-fasciae-latae",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-fascia-distinction"
      }
    },
    {
      "id": "piriformis",
      "kind": "muscle",
      "names": {
        "ru": "Грушевидная мышца",
        "latin": "musculus piriformis",
        "modelAliases": [
          "piriformis"
        ]
      },
      "layer": "deep-gluteal",
      "subregions": [
        "deep-gluteal-space",
        "posterior-hip"
      ],
      "anatomy": {
        "originRu": [
          "Передняя поверхность крестца, преимущественно в области S2–S4, и прилежащие структуры."
        ],
        "insertionRu": [
          "Верхний край большого вертела бедренной кости."
        ],
        "fiberDirectionRu": "Пучки идут латерально через большое седалищное отверстие к большому вертелу.",
        "actionsRu": [
          "При разогнутом бедре вращает его наружу.",
          "При согнутом бедре участвует в отведении.",
          "Помогает стабилизировать головку бедренной кости."
        ],
        "innervationRu": "Нерв грушевидной мышцы, преимущественно S1–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крестец",
          "большое седалищное отверстие",
          "большой вертел"
        ],
        "relationsRu": [
          "Ключевой глубокий топографический ориентир: обычно седалищный нерв выходит ниже мышцы, но варианты хода нерва часты и клинически значимы."
        ]
      },
      "movementCueRu": "В справочнике мышца нужна прежде всего для глубокой топографии; нельзя обещать точную поверхностную изоляцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, грушевидная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-piriformis",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-nerve-variation"
      }
    },
    {
      "id": "obturator-internus",
      "kind": "muscle",
      "names": {
        "ru": "Внутренняя запирательная мышца",
        "latin": "musculus obturatorius internus",
        "modelAliases": [
          "obturator internus",
          "obturatorius internus"
        ]
      },
      "layer": "deep-pelvic-gluteal",
      "subregions": [
        "pelvic-wall",
        "deep-gluteal-space"
      ],
      "anatomy": {
        "originRu": [
          "Внутренняя поверхность запирательной мембраны.",
          "Костные края запирательного отверстия на внутренней поверхности таза."
        ],
        "insertionRu": [
          "Медиальная поверхность большого вертела через сухожилие, поворачивающее через малое седалищное отверстие."
        ],
        "fiberDirectionRu": "Пучки сходятся к сухожилию, которое резко меняет направление у малого седалищного отверстия.",
        "actionsRu": [
          "Вращает разогнутое бедро наружу.",
          "Отводит согнутое бедро.",
          "Помогает стабилизировать головку бедренной кости."
        ],
        "innervationRu": "Нерв внутренней запирательной мышцы, L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Запирательное отверстие",
          "малое седалищное отверстие",
          "большой вертел"
        ],
        "relationsRu": [
          "В тазу формирует часть боковой стенки; в ягодичной области сухожилие проходит между верхней и нижней близнецовыми мышцами."
        ]
      },
      "movementCueRu": "Карточка показывает переход мышцы из таза в глубокую ягодичную область; поверхностная пальпация всей мышцы невозможна.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, внутренняя запирательная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-obturator-muscles",
          "locator": "Obturator internus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "obturator-externus",
      "kind": "muscle",
      "names": {
        "ru": "Наружная запирательная мышца",
        "latin": "musculus obturatorius externus",
        "modelAliases": [
          "obturator externus",
          "obturatorius externus"
        ]
      },
      "layer": "deep-anterior-medial-hip",
      "subregions": [
        "obturator-region",
        "deep-hip"
      ],
      "anatomy": {
        "originRu": [
          "Наружная поверхность запирательной мембраны.",
          "Костные края запирательного отверстия."
        ],
        "insertionRu": [
          "Вертельная ямка бедренной кости."
        ],
        "fiberDirectionRu": "Пучки идут назад и латерально под шейкой бедренной кости.",
        "actionsRu": [
          "Вращает бедро наружу.",
          "Может участвовать в приведении, особенно при согнутом бедре.",
          "Помогает стабилизировать тазобедренный сустав."
        ],
        "innervationRu": "Задняя ветвь запирательного нерва, преимущественно L3–L4."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Запирательное отверстие",
          "шейка бедренной кости",
          "вертельная ямка"
        ],
        "relationsRu": [
          "Глубокая мышца переднемедиальной части тазобедренного сустава; не относится к поверхностной ягодичной массе."
        ]
      },
      "movementCueRu": "Нужна для полной карты коротких наружных ротаторов, без отдельной поверхностной ручной задачи.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, наружная запирательная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-obturator-muscles",
          "locator": "Obturator externus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "quadratus-femoris",
      "kind": "muscle",
      "names": {
        "ru": "Квадратная мышца бедра",
        "latin": "musculus quadratus femoris",
        "modelAliases": [
          "quadratus femoris"
        ]
      },
      "layer": "deep-gluteal",
      "subregions": [
        "deep-gluteal-space",
        "posterior-hip"
      ],
      "anatomy": {
        "originRu": [
          "Латеральный край седалищного бугра."
        ],
        "insertionRu": [
          "Квадратный бугорок и прилежащая часть межвертельного гребня бедренной кости."
        ],
        "fiberDirectionRu": "Короткие горизонтальные пучки идут латерально.",
        "actionsRu": [
          "Вращает бедро наружу.",
          "Помогает приведению бедра и стабилизации тазобедренного сустава."
        ],
        "innervationRu": "Нерв квадратной мышцы бедра, L4–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "межвертельный гребень"
        ],
        "relationsRu": [
          "Лежит ниже нижней близнецовой мышцы и глубоких сухожилий коротких ротаторов; седалищный нерв проходит поверхностнее."
        ]
      },
      "movementCueRu": "Глубокая структура для понимания слоя и наружной ротации, не отдельная поверхностная мишень.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, квадратная мышца бедра",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hip",
          "locator": "Quadratus femoris",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "gemellus-superior",
      "kind": "muscle",
      "names": {
        "ru": "Верхняя близнецовая мышца",
        "latin": "musculus gemellus superior",
        "modelAliases": [
          "gemellus superior",
          "superior gemellus"
        ]
      },
      "layer": "deep-gluteal",
      "subregions": [
        "deep-gluteal-space"
      ],
      "anatomy": {
        "originRu": [
          "Седалищная ость."
        ],
        "insertionRu": [
          "Медиальная поверхность большого вертела вместе с сухожилием внутренней запирательной мышцы."
        ],
        "fiberDirectionRu": "Короткие пучки идут латерально вдоль верхнего края сухожилия obturator internus.",
        "actionsRu": [
          "Вращает бедро наружу.",
          "Участвует в отведении согнутого бедра и стабилизации сустава."
        ],
        "innervationRu": "Обычно нерв внутренней запирательной мышцы; возможна двойная иннервация с нервом квадратной мышцы бедра."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищная ость",
          "большой вертел"
        ],
        "relationsRu": [
          "Вместе с внутренней запирательной и нижней близнецовой образует тесный функционально-анатомический комплекс."
        ]
      },
      "movementCueRu": "Отдельная карточка нужна для 3D-слоёв, но в базовой практике мышцы комплекса рассматриваются совместно.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, верхняя близнецовая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-gemelli",
          "locator": "Structure; Nerves",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-innervation-variation"
      }
    },
    {
      "id": "gemellus-inferior",
      "kind": "muscle",
      "names": {
        "ru": "Нижняя близнецовая мышца",
        "latin": "musculus gemellus inferior",
        "modelAliases": [
          "gemellus inferior",
          "inferior gemellus"
        ]
      },
      "layer": "deep-gluteal",
      "subregions": [
        "deep-gluteal-space"
      ],
      "anatomy": {
        "originRu": [
          "Верхняя часть седалищного бугра."
        ],
        "insertionRu": [
          "Медиальная поверхность большого вертела вместе с сухожилием внутренней запирательной мышцы."
        ],
        "fiberDirectionRu": "Короткие пучки идут латерально вдоль нижнего края сухожилия obturator internus.",
        "actionsRu": [
          "Вращает бедро наружу.",
          "Участвует в отведении согнутого бедра и стабилизации сустава."
        ],
        "innervationRu": "Нерв квадратной мышцы бедра, L4–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Седалищный бугор",
          "большой вертел"
        ],
        "relationsRu": [
          "Лежит между сухожилием внутренней запирательной мышцы и квадратной мышцей бедра."
        ]
      },
      "movementCueRu": "В базовом обучении рассматривается вместе с внутренней запирательной и верхней близнецовой.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, нижняя близнецовая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-gemelli",
          "locator": "Structure; Nerves",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    }
  ]
});

export const PELVIS_GLUTEAL_STRUCTURE_COUNT = PELVIS_GLUTEAL_REGION.structures.length;

export function pelvisGlutealStructureById(id) {
  return PELVIS_GLUTEAL_REGION.structures.find((item) => item.id === id) || null;
}
