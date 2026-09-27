function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const LEG_FOOT_REGION = deepFreeze({
  "id": "leg-foot",
  "nameRu": "Голень и стопа",
  "status": "verified-v1",
  "scopeRu": "Передний, латеральный и задний компартменты голени, длинные сухожилия, тыл стопы и четыре слоя собственных мышц подошвы.",
  "functionalGroups": [
    {
      "id": "anterior-leg-compartment",
      "nameRu": "Передний компартмент голени",
      "members": [
        "tibialis-anterior",
        "extensor-digitorum-longus",
        "extensor-hallucis-longus",
        "fibularis-tertius"
      ]
    },
    {
      "id": "lateral-leg-compartment",
      "nameRu": "Латеральный компартмент голени",
      "members": [
        "fibularis-longus",
        "fibularis-brevis"
      ]
    },
    {
      "id": "triceps-surae",
      "nameRu": "Трёхглавая мышца голени",
      "members": [
        "gastrocnemius",
        "soleus"
      ]
    },
    {
      "id": "deep-posterior-leg",
      "nameRu": "Глубокий задний компартмент",
      "members": [
        "popliteus",
        "flexor-digitorum-longus-foot",
        "flexor-hallucis-longus-foot",
        "tibialis-posterior"
      ]
    },
    {
      "id": "plantar-layer-1",
      "nameRu": "Первый слой подошвы",
      "members": [
        "abductor-hallucis",
        "flexor-digitorum-brevis-foot",
        "abductor-digiti-minimi-foot"
      ]
    },
    {
      "id": "plantar-layer-2",
      "nameRu": "Второй слой подошвы",
      "members": [
        "quadratus-plantae",
        "lumbricals-foot"
      ]
    },
    {
      "id": "plantar-layer-3",
      "nameRu": "Третий слой подошвы",
      "members": [
        "flexor-hallucis-brevis",
        "adductor-hallucis",
        "flexor-digiti-minimi-brevis-foot",
        "opponens-digiti-minimi-foot"
      ]
    },
    {
      "id": "plantar-layer-4",
      "nameRu": "Четвёртый слой подошвы",
      "members": [
        "plantar-interossei-foot",
        "dorsal-interossei-foot"
      ]
    }
  ],
  "teachingPrinciplesRu": [
    "Голень изучать по компартментам и только затем по отдельным мышцам: это сразу связывает слой, функцию и нерв.",
    "Длинные мышцы голени прослеживать до сухожилий на стопе, иначе движение пальцев и сводов остаётся оторванным от источника тяги.",
    "Gastrocnemius и soleus показывать вместе как triceps surae, но подчёркивать, что только gastrocnemius пересекает коленный сустав.",
    "Popliteus объяснять с учётом открытой и закрытой кинематической цепи, поскольку направление относительного вращения меняется.",
    "На подошве использовать четыре слоя и не превращать небольшие собственные мышцы в обязательные пальпаторные мишени.",
    "Вариабельные структуры, прежде всего plantaris и fibularis tertius, явно отмечать в интерфейсе.",
    "Подошвенный апоневроз и пяточное сухожилие хранить как соединительнотканные структуры, а не мышцы."
  ],
  "structures": [
    {
      "id": "tibialis-anterior",
      "kind": "muscle",
      "names": {
        "ru": "Передняя большеберцовая мышца",
        "latin": "musculus tibialis anterior",
        "modelAliases": [
          "tibialis anterior"
        ]
      },
      "layer": "anterior-leg-superficial",
      "subregions": [
        "anterior-leg",
        "medial-foot"
      ],
      "anatomy": {
        "originRu": [
          "Латеральный мыщелок и проксимальная латеральная поверхность большеберцовой кости.",
          "Межкостная перепонка и фасция голени."
        ],
        "insertionRu": [
          "Медиальная клиновидная кость.",
          "Основание I плюсневой кости с медиально-подошвенной стороны."
        ],
        "fiberDirectionRu": "Длинное брюшко идёт вниз по переднелатеральной поверхности голени; сухожилие проходит спереди от голеностопного сустава к медиальному краю стопы.",
        "actionsRu": [
          "Тыльно сгибает стопу.",
          "Инвертирует стопу.",
          "Участвует в динамической поддержке медиального продольного свода."
        ],
        "innervationRu": "Глубокий малоберцовый нерв, преимущественно L4–L5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный мыщелок большеберцовой кости",
          "передний край большеберцовой кости",
          "медиальная клиновидная кость",
          "основание I плюсневой"
        ],
        "relationsRu": [
          "Самая медиальная и наиболее поверхностная мышца переднего компартмента; сухожилие хорошо различимо спереди от медиальной лодыжки."
        ]
      },
      "movementCueRu": "Тыльное сгибание с лёгкой инверсией подчёркивает сухожилие и направление действия.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, передняя большеберцовая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-tibialis-anterior",
          "locator": "Muscles; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Extrinsic muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-digitorum-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинный разгибатель пальцев",
        "latin": "musculus extensor digitorum longus",
        "modelAliases": [
          "extensor digitorum longus"
        ]
      },
      "layer": "anterior-leg",
      "subregions": [
        "anterior-leg",
        "dorsum-foot",
        "toes"
      ],
      "anatomy": {
        "originRu": [
          "Латеральный мыщелок большеберцовой кости.",
          "Проксимальная переднемедиальная поверхность малоберцовой кости.",
          "Межкостная перепонка и фасциальные перегородки."
        ],
        "insertionRu": [
          "Через четыре сухожилия и разгибательные аппараты — средние и дистальные фаланги II–V пальцев."
        ],
        "fiberDirectionRu": "Волокна идут дистально и переходят в четыре сухожилия на тыле стопы.",
        "actionsRu": [
          "Разгибает II–V пальцы.",
          "Тыльно сгибает стопу.",
          "Может помогать эверсии стопы."
        ],
        "innervationRu": "Глубокий малоберцовый нерв, L5–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный мыщелок большеберцовой",
          "передняя поверхность голени",
          "тыл стопы"
        ],
        "relationsRu": [
          "Лежит латеральнее tibialis anterior; сухожилия проходят под удерживателями разгибателей."
        ]
      },
      "movementCueRu": "Разгибание II–V пальцев и тыльное сгибание показывают его длинный мышечно-сухожильный ход.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, длинный разгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Anterior compartment",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-hallucis-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинный разгибатель большого пальца стопы",
        "latin": "musculus extensor hallucis longus",
        "modelAliases": [
          "extensor hallucis longus"
        ]
      },
      "layer": "anterior-leg-deep-to-superficial-distally",
      "subregions": [
        "anterior-leg",
        "dorsum-foot",
        "hallux"
      ],
      "anatomy": {
        "originRu": [
          "Средняя часть переднемедиальной поверхности малоберцовой кости.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Тыльная поверхность основания дистальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "В верхней части голени лежит глубже соседних мышц; дистально сухожилие выходит к поверхности и идёт к большому пальцу.",
        "actionsRu": [
          "Разгибает большой палец.",
          "Тыльно сгибает стопу.",
          "Может слабо помогать инверсии."
        ],
        "innervationRu": "Глубокий малоберцовый нерв, преимущественно L5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность голени",
          "тыл голеностопного сустава",
          "большой палец"
        ],
        "relationsRu": [
          "Сухожилие проходит между tibialis anterior и extensor digitorum longus в дистальной части голени."
        ]
      },
      "movementCueRu": "Разгибание большого пальца делает сухожилие отчётливым на тыле стопы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, длинный разгибатель большого пальца стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-extensor-hallucis-longus",
          "locator": "Introduction; Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Anterior compartment",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "fibularis-tertius",
      "kind": "muscle",
      "names": {
        "ru": "Третья малоберцовая мышца",
        "latin": "musculus fibularis tertius",
        "modelAliases": [
          "fibularis tertius",
          "peroneus tertius"
        ]
      },
      "layer": "anterior-leg-variable",
      "subregions": [
        "distal-anterior-leg",
        "lateral-dorsum-foot"
      ],
      "anatomy": {
        "originRu": [
          "Дистальная треть передней поверхности малоберцовой кости.",
          "Межкостная перепонка; часто связана с extensor digitorum longus."
        ],
        "insertionRu": [
          "Тыльная поверхность основания V плюсневой кости."
        ],
        "fiberDirectionRu": "Небольшое дистальное брюшко переходит в сухожилие, направленное к латеральному краю тыла стопы.",
        "actionsRu": [
          "Тыльно сгибает стопу.",
          "Помогает эверсии стопы."
        ],
        "innervationRu": "Глубокий малоберцовый нерв, L5–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Дистальная малоберцовая кость",
          "латеральный край тыла стопы",
          "V плюсневая кость"
        ],
        "relationsRu": [
          "Вариабельная мышца переднего компартмента; может отсутствовать примерно у пятой части людей."
        ]
      },
      "movementCueRu": "В интерфейсе должна быть помечена как вариабельная структура, а не обязательный элемент у каждого человека.",
      "sources": [
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Anterior compartment — fibularis tertius",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-fibula",
          "locator": "Muscles; physiologic variants",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable"
      },
      "illustrations": [
        {
          "sourceId": "gray-anterior-leg-foot-public-domain",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ]
    },
    {
      "id": "fibularis-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинная малоберцовая мышца",
        "latin": "musculus fibularis longus",
        "modelAliases": [
          "fibularis longus",
          "peroneus longus"
        ]
      },
      "layer": "lateral-leg-superficial",
      "subregions": [
        "lateral-leg",
        "plantar-foot"
      ],
      "anatomy": {
        "originRu": [
          "Головка и проксимальная часть латеральной поверхности малоберцовой кости.",
          "Фасция и межмышечные перегородки латерального компартмента."
        ],
        "insertionRu": [
          "Подошвенная поверхность медиальной клиновидной кости.",
          "Латеральная сторона основания I плюсневой кости."
        ],
        "fiberDirectionRu": "Сухожилие проходит позади латеральной лодыжки, затем через подошву в борозде кубовидной кости к медиальному краю стопы.",
        "actionsRu": [
          "Эвертирует стопу.",
          "Помогает подошвенному сгибанию.",
          "Участвует в поддержке поперечного и продольных сводов."
        ],
        "innervationRu": "Поверхностный малоберцовый нерв, L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Головка малоберцовой кости",
          "латеральная лодыжка",
          "кубовидная кость",
          "основание I плюсневой"
        ],
        "relationsRu": [
          "Вместе с tibialis anterior образует функциональную «стремяобразную» систему вокруг медиальной части стопы; общий малоберцовый нерв огибает шейку малоберцовой кости проксимальнее мышцы."
        ]
      },
      "movementCueRu": "Эверсия стопы показывает основное направление действия; ход сухожилия под стопой нужно показывать отдельно.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, длинная малоберцовая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Lateral compartment — fibularis longus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "fibularis-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткая малоберцовая мышца",
        "latin": "musculus fibularis brevis",
        "modelAliases": [
          "fibularis brevis",
          "peroneus brevis"
        ]
      },
      "layer": "lateral-leg-deep",
      "subregions": [
        "lateral-leg",
        "lateral-foot"
      ],
      "anatomy": {
        "originRu": [
          "Дистальные две трети латеральной поверхности малоберцовой кости."
        ],
        "insertionRu": [
          "Бугристость основания V плюсневой кости."
        ],
        "fiberDirectionRu": "Пучки идут дистально; сухожилие проходит позади латеральной лодыжки глубже сухожилия fibularis longus.",
        "actionsRu": [
          "Эвертирует стопу.",
          "Помогает подошвенному сгибанию."
        ],
        "innervationRu": "Поверхностный малоберцовый нерв, L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральная малоберцовая кость",
          "латеральная лодыжка",
          "основание V плюсневой"
        ],
        "relationsRu": [
          "Лежит глубже длинной малоберцовой мышцы; её сухожилие заканчивается на латеральном крае стопы."
        ]
      },
      "movementCueRu": "Эверсия стопы помогает понять совместную работу обеих малоберцовых мышц.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткая малоберцовая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Lateral compartment — fibularis brevis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "gastrocnemius",
      "kind": "muscle",
      "names": {
        "ru": "Икроножная мышца",
        "latin": "musculus gastrocnemius",
        "modelAliases": [
          "gastrocnemius"
        ]
      },
      "layer": "posterior-leg-superficial",
      "subregions": [
        "posterior-leg",
        "knee",
        "ankle"
      ],
      "anatomy": {
        "originRu": [
          "Медиальная головка — задняя поверхность бедренной кости над медиальным мыщелком.",
          "Латеральная головка — латеральный мыщелок и прилежащая задняя поверхность бедренной кости."
        ],
        "insertionRu": [
          "Пяточный бугор через общее пяточное сухожилие с камбаловидной мышцей."
        ],
        "fiberDirectionRu": "Две головки формируют поверхностный рельеф икры и сходятся в широкий апоневроз, переходящий в пяточное сухожилие.",
        "actionsRu": [
          "Подошвенно сгибает стопу.",
          "Помогает сгибанию колена.",
          "Как двухсуставная мышца участвует в передаче силы при ходьбе, беге и прыжках."
        ],
        "innervationRu": "Большеберцовый нерв, преимущественно S1–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальный и латеральный мыщелки бедра",
          "подколенная ямка",
          "икра",
          "пяточное сухожилие"
        ],
        "relationsRu": [
          "Вместе с soleus образует triceps surae; перекрывает камбаловидную мышцу."
        ]
      },
      "movementCueRu": "Подъём на носки показывает подошвенное сгибание, но вклад gastrocnemius зависит и от положения колена.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, трёхглавая мышца голени — икроножная",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-gastrocnemius",
          "locator": "Introduction",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-posterior-leg",
          "locator": "Superficial posterior muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "soleus",
      "kind": "muscle",
      "names": {
        "ru": "Камбаловидная мышца",
        "latin": "musculus soleus",
        "modelAliases": [
          "soleus"
        ]
      },
      "layer": "posterior-leg-intermediate",
      "subregions": [
        "posterior-leg",
        "ankle"
      ],
      "anatomy": {
        "originRu": [
          "Задняя поверхность головки и проксимальной части малоберцовой кости.",
          "Камбаловидная линия и медиальный край большеберцовой кости.",
          "Сухожильная дуга между большеберцовой и малоберцовой костями."
        ],
        "insertionRu": [
          "Пяточный бугор через пяточное сухожилие."
        ],
        "fiberDirectionRu": "Широкая плоская многоперистая мышца лежит глубже gastrocnemius.",
        "actionsRu": [
          "Мощно подошвенно сгибает стопу.",
          "Важна для постурального контроля в стойке и при ходьбе."
        ],
        "innervationRu": "Большеберцовый нерв, S1–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Камбаловидная линия",
          "головка малоберцовой кости",
          "пяточное сухожилие"
        ],
        "relationsRu": [
          "Не пересекает коленный сустав; лежит глубже gastrocnemius и вместе с ним формирует triceps surae."
        ]
      },
      "movementCueRu": "Подъём на носки при согнутом колене уменьшает механическое преимущество gastrocnemius и лучше показывает вклад soleus.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, трёхглавая мышца голени — камбаловидная",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-calf",
          "locator": "Muscles; Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-posterior-leg",
          "locator": "Superficial posterior muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "plantaris",
      "kind": "muscle",
      "names": {
        "ru": "Подошвенная мышца",
        "latin": "musculus plantaris",
        "modelAliases": [
          "plantaris"
        ]
      },
      "layer": "posterior-leg-superficial-variable",
      "subregions": [
        "posterior-knee",
        "posterior-leg"
      ],
      "anatomy": {
        "originRu": [
          "Латеральная надмыщелковая линия бедренной кости и косая подколенная связка/капсула колена."
        ],
        "insertionRu": [
          "Длинное тонкое сухожилие идёт к медиальной стороне пяточного сухожилия и пяточной кости; точное соединение вариабельно."
        ],
        "fiberDirectionRu": "Небольшое проксимальное брюшко переходит в очень длинное тонкое сухожилие между gastrocnemius и soleus.",
        "actionsRu": [
          "Слабо помогает подошвенному сгибанию и сгибанию колена; механический вклад невелик."
        ],
        "innervationRu": "Большеберцовый нерв, S1–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральная надмыщелковая область",
          "пространство между gastrocnemius и soleus",
          "пяточная область"
        ],
        "relationsRu": [
          "Может отсутствовать примерно у 10% людей; длинное сухожилие анатомически вариабельно."
        ]
      },
      "movementCueRu": "Структура нужна для полноты слоёв и вариабельности, но не как обязательная функциональная мишень.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, подошвенная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-calf",
          "locator": "Muscles; Physiologic Variants",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable"
      }
    },
    {
      "id": "popliteus",
      "kind": "muscle",
      "names": {
        "ru": "Подколенная мышца",
        "latin": "musculus popliteus",
        "modelAliases": [
          "popliteus"
        ]
      },
      "layer": "posterior-knee-deep",
      "subregions": [
        "posterior-knee",
        "deep-posterior-leg"
      ],
      "anatomy": {
        "originRu": [
          "Латеральный мыщелок бедренной кости внутри капсулы колена; также связана с латеральным мениском."
        ],
        "insertionRu": [
          "Задняя поверхность большеберцовой кости выше камбаловидной линии."
        ],
        "fiberDirectionRu": "Короткие пучки идут вниз и медиально от латеральной стороны колена.",
        "actionsRu": [
          "Помогает начать сгибание из полностью разогнутого колена.",
          "В открытой цепи вращает большеберцовую кость внутрь относительно бедренной.",
          "В закрытой цепи вращает бедренную кость наружу относительно фиксированной большеберцовой.",
          "Стабилизирует заднелатеральную область колена и оттягивает латеральный мениск при сгибании."
        ],
        "innervationRu": "Большеберцовый нерв, преимущественно L4–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный мыщелок бедра",
          "задняя поверхность проксимальной большеберцовой кости",
          "подколенная ямка"
        ],
        "relationsRu": [
          "Формирует часть дна подколенной ямки; действие зависит от того, фиксирована стопа или свободна голень."
        ]
      },
      "movementCueRu": "В тренажёре нужно показывать два варианта движения — открытая и закрытая цепь — вместо правила «вращает голень внутрь».",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, подколенная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-popliteus",
          "locator": "Introduction; Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-chain-dependent-action"
      }
    },
    {
      "id": "flexor-digitorum-longus-foot",
      "kind": "muscle",
      "names": {
        "ru": "Длинный сгибатель пальцев стопы",
        "latin": "musculus flexor digitorum longus",
        "modelAliases": [
          "flexor digitorum longus"
        ]
      },
      "layer": "posterior-leg-deep",
      "subregions": [
        "deep-posterior-leg",
        "plantar-foot",
        "toes"
      ],
      "anatomy": {
        "originRu": [
          "Задняя поверхность большеберцовой кости ниже камбаловидной линии."
        ],
        "insertionRu": [
          "Подошвенные поверхности оснований дистальных фаланг II–V пальцев."
        ],
        "fiberDirectionRu": "Сухожилие проходит позади медиальной лодыжки, затем делится на четыре сухожилия в подошве.",
        "actionsRu": [
          "Сгибает II–V пальцы, особенно дистальные межфаланговые суставы.",
          "Помогает подошвенному сгибанию и поддержке продольных сводов."
        ],
        "innervationRu": "Большеберцовый нерв, L5–S2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Задняя большеберцовая кость",
          "медиальная лодыжка",
          "подошва",
          "дистальные фаланги II–V"
        ],
        "relationsRu": [
          "На подошве его сухожилия дают начало червеобразным мышцам и взаимодействуют с quadratus plantae."
        ]
      },
      "movementCueRu": "Сгибание концевых фаланг II–V показывает основную дистальную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, длинный сгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Deep posterior compartment — flexor digitorum longus",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-hallucis-longus-foot",
      "kind": "muscle",
      "names": {
        "ru": "Длинный сгибатель большого пальца стопы",
        "latin": "musculus flexor hallucis longus",
        "modelAliases": [
          "flexor hallucis longus"
        ]
      },
      "layer": "posterior-leg-deep",
      "subregions": [
        "deep-posterior-leg",
        "plantar-foot",
        "hallux"
      ],
      "anatomy": {
        "originRu": [
          "Дистальные две трети задней поверхности малоберцовой кости.",
          "Межкостная перепонка и задние межмышечные перегородки."
        ],
        "insertionRu": [
          "Подошвенная поверхность основания дистальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "Сухожилие проходит позади медиальной лодыжки, далее под sustentaculum tali и через подошву к большому пальцу.",
        "actionsRu": [
          "Сгибает большой палец.",
          "Помогает подошвенному сгибанию.",
          "Участвует в поддержке медиального продольного свода и отталкивании при ходьбе."
        ],
        "innervationRu": "Большеберцовый нерв, S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Задняя малоберцовая кость",
          "медиальная лодыжка",
          "опора таранной кости",
          "большой палец"
        ],
        "relationsRu": [
          "Глубокая латеральная мышца заднего компартмента; сухожилие пересекается с сухожилием flexor digitorum longus в подошве."
        ]
      },
      "movementCueRu": "Сгибание межфалангового сустава большого пальца показывает основную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, длинный сгибатель большого пальца стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-flexor-hallucis-longus",
          "locator": "Introduction",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Deep posterior compartment",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "tibialis-posterior",
      "kind": "muscle",
      "names": {
        "ru": "Задняя большеберцовая мышца",
        "latin": "musculus tibialis posterior",
        "modelAliases": [
          "tibialis posterior"
        ]
      },
      "layer": "posterior-leg-deep",
      "subregions": [
        "deep-posterior-leg",
        "medial-foot"
      ],
      "anatomy": {
        "originRu": [
          "Задняя поверхность межкостной перепонки.",
          "Прилежащие задние поверхности большеберцовой и малоберцовой костей."
        ],
        "insertionRu": [
          "Основное прикрепление — бугристость ладьевидной кости.",
          "Дополнительные пучки — клиновидные и кубовидная кости, sustentaculum tali и основания II–IV плюсневых костей."
        ],
        "fiberDirectionRu": "Центральная глубокая мышца переходит в сухожилие, проходящее позади медиальной лодыжки к медиальной и подошвенной стороне стопы.",
        "actionsRu": [
          "Инвертирует стопу.",
          "Помогает подошвенному сгибанию.",
          "Поддерживает медиальный продольный свод."
        ],
        "innervationRu": "Большеберцовый нерв, преимущественно L4–L5."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Межкостная перепонка",
          "медиальная лодыжка",
          "ладьевидная кость"
        ],
        "relationsRu": [
          "Самая глубокая центральная мышца заднего компартмента; её сухожилие проходит позади медиальной лодыжки вместе с глубокими сгибателями и сосудисто-нервным пучком."
        ]
      },
      "movementCueRu": "Инверсия с небольшим подошвенным сгибанием помогает понять действие; глубокое брюшко поверхностно не изолируется.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, задняя большеберцовая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-tibialis-posterior",
          "locator": "Muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Deep posterior compartment",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-digitorum-brevis-foot",
      "kind": "muscle",
      "names": {
        "ru": "Короткий разгибатель пальцев стопы",
        "latin": "musculus extensor digitorum brevis",
        "modelAliases": [
          "extensor digitorum brevis"
        ]
      },
      "layer": "dorsal-foot-superficial",
      "subregions": [
        "dorsum-foot"
      ],
      "anatomy": {
        "originRu": [
          "Дорсолатеральная поверхность пяточной кости.",
          "Нижний удерживатель разгибателей и межкостная таранно-пяточная связка."
        ],
        "insertionRu": [
          "В сухожильные расширения длинного разгибателя пальцев к II–IV пальцам."
        ],
        "fiberDirectionRu": "Короткое брюшко на тыле стопы направляет три сухожильных пучка вперёд и медиально.",
        "actionsRu": [
          "Помогает разгибанию II–IV пальцев."
        ],
        "innervationRu": "Глубокий малоберцовый нерв, L5–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Дорсолатеральная пяточная кость",
          "тыл стопы",
          "II–IV пальцы"
        ],
        "relationsRu": [
          "Одна из двух основных собственных мышц тыла стопы."
        ]
      },
      "movementCueRu": "Разгибание пальцев помогает увидеть небольшой мышечный рельеф на латеральной части тыла стопы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткий разгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Dorsal intrinsic muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      },
      "illustrations": [
        {
          "sourceId": "gray-anterior-leg-foot-public-domain",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ]
    },
    {
      "id": "extensor-hallucis-brevis-foot",
      "kind": "muscle",
      "names": {
        "ru": "Короткий разгибатель большого пальца стопы",
        "latin": "musculus extensor hallucis brevis",
        "modelAliases": [
          "extensor hallucis brevis"
        ]
      },
      "layer": "dorsal-foot-superficial",
      "subregions": [
        "dorsum-foot",
        "hallux"
      ],
      "anatomy": {
        "originRu": [
          "Дорсальная поверхность пяточной кости рядом с началом extensor digitorum brevis."
        ],
        "insertionRu": [
          "Тыльная поверхность основания проксимальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "Короткое сухожилие идёт вперёд и медиально к большому пальцу.",
        "actionsRu": [
          "Разгибает большой палец преимущественно в плюснефаланговом суставе."
        ],
        "innervationRu": "Глубокий малоберцовый нерв, L5–S1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Пяточная кость",
          "тыл стопы",
          "основание большого пальца"
        ],
        "relationsRu": [
          "Рассматривается вместе с extensor digitorum brevis как собственная мышца тыла стопы."
        ]
      },
      "movementCueRu": "Разгибание большого пальца помогает различить его короткое сухожилие от длинного разгибателя.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткий разгибатель большого пальца стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Dorsal intrinsic muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "abductor-hallucis",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, отводящая большой палец стопы",
        "latin": "musculus abductor hallucis",
        "modelAliases": [
          "abductor hallucis"
        ]
      },
      "layer": "plantar-layer-1-medial",
      "subregions": [
        "medial-sole",
        "hallux"
      ],
      "anatomy": {
        "originRu": [
          "Медиальный отросток пяточного бугра.",
          "Удерживатель сгибателей.",
          "Подошвенный апоневроз."
        ],
        "insertionRu": [
          "Медиальная сторона основания проксимальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "Поверхностная мышца идёт вдоль медиального края подошвы от пятки к большому пальцу.",
        "actionsRu": [
          "Отводит и сгибает большой палец в плюснефаланговом суставе.",
          "Поддерживает медиальный продольный свод."
        ],
        "innervationRu": "Медиальный подошвенный нерв, S1–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальный пяточный бугор",
          "медиальный край стопы",
          "основание большого пальца"
        ],
        "relationsRu": [
          "Самая медиальная мышца первого подошвенного слоя; под её проксимальной частью проходят медиальный и латеральный подошвенные сосудисто-нервные пучки."
        ]
      },
      "movementCueRu": "Отведение большого пальца в медиальную сторону показывает действие, но амплитуда у большинства людей невелика.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, мышца, отводящая большой палец стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — first layer",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-abductor-hallucis",
          "locator": "Key facts; Origin and insertion",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-digitorum-brevis-foot",
      "kind": "muscle",
      "names": {
        "ru": "Короткий сгибатель пальцев стопы",
        "latin": "musculus flexor digitorum brevis",
        "modelAliases": [
          "flexor digitorum brevis"
        ]
      },
      "layer": "plantar-layer-1-central",
      "subregions": [
        "central-sole",
        "toes"
      ],
      "anatomy": {
        "originRu": [
          "Медиальный отросток пяточного бугра.",
          "Подошвенный апоневроз и межмышечные перегородки."
        ],
        "insertionRu": [
          "Боковые поверхности средних фаланг II–V пальцев."
        ],
        "fiberDirectionRu": "Центральное поверхностное брюшко делится на четыре сухожилия, которые расщепляются вокруг сухожилий длинного сгибателя.",
        "actionsRu": [
          "Сгибает II–V пальцы преимущественно в проксимальных межфаланговых суставах.",
          "Помогает поддерживать продольные своды."
        ],
        "innervationRu": "Медиальный подошвенный нерв, S1–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Пяточный бугор",
          "центр подошвы",
          "средние фаланги II–V"
        ],
        "relationsRu": [
          "Центральная мышца первого подошвенного слоя непосредственно глубже подошвенного апоневроза."
        ]
      },
      "movementCueRu": "Сгибание средних фаланг II–V показывает её основную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткий сгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — first layer",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "abductor-digiti-minimi-foot",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, отводящая мизинец стопы",
        "latin": "musculus abductor digiti minimi",
        "modelAliases": [
          "abductor digiti minimi foot",
          "abductor digiti minimi"
        ]
      },
      "layer": "plantar-layer-1-lateral",
      "modelAliasContext": "foot",
      "subregions": [
        "lateral-sole",
        "little-toe"
      ],
      "anatomy": {
        "originRu": [
          "Медиальный и латеральный отростки пяточного бугра.",
          "Подошвенный апоневроз."
        ],
        "insertionRu": [
          "Латеральная сторона основания проксимальной фаланги V пальца.",
          "Часть волокон может прикрепляться к бугристости V плюсневой кости; этот пучок вариабелен."
        ],
        "fiberDirectionRu": "Поверхностная мышца идёт вдоль латерального края подошвы.",
        "actionsRu": [
          "Отводит и помогает сгибанию V пальца.",
          "Участвует в поддержке латерального продольного свода."
        ],
        "innervationRu": "Латеральный подошвенный нерв, S1–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Пяточный бугор",
          "латеральный край стопы",
          "основание V пальца",
          "V плюсневая кость"
        ],
        "relationsRu": [
          "Самая латеральная мышца первого подошвенного слоя; глубже лежит flexor digiti minimi brevis."
        ]
      },
      "movementCueRu": "Отведение мизинца показывает действие, хотя произвольная амплитуда часто мала.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, мышца, отводящая мизинец стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — first layer",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-abductor-digiti-minimi-foot",
          "locator": "Origin and insertion",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-insertion-variation"
      }
    },
    {
      "id": "quadratus-plantae",
      "kind": "muscle",
      "names": {
        "ru": "Квадратная мышца подошвы",
        "latin": "musculus quadratus plantae",
        "modelAliases": [
          "quadratus plantae",
          "flexor accessorius"
        ]
      },
      "layer": "plantar-layer-2",
      "subregions": [
        "central-sole"
      ],
      "anatomy": {
        "originRu": [
          "Подошвенная поверхность пяточной кости двумя головками."
        ],
        "insertionRu": [
          "Латеральный край и глубокая поверхность сухожилия flexor digitorum longus."
        ],
        "fiberDirectionRu": "Пучки идут вперёд от пятки к сухожилию длинного сгибателя пальцев.",
        "actionsRu": [
          "Помогает flexor digitorum longus сгибать II–V пальцы и изменяет направление его тяги на более продольное."
        ],
        "innervationRu": "Латеральный подошвенный нерв, S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Пяточная кость",
          "сухожилия длинного сгибателя пальцев"
        ],
        "relationsRu": [
          "Лежит во втором подошвенном слое глубже flexor digitorum brevis."
        ]
      },
      "movementCueRu": "Функцию нужно объяснять через взаимодействие с сухожилием FDL, а не как самостоятельный мощный сгибатель.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, квадратная мышца подошвы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — second layer",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      },
      "illustrations": [
        {
          "sourceId": "gray-plantar-foot-layer2-public-domain",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ]
    },
    {
      "id": "lumbricals-foot",
      "kind": "muscle-group",
      "names": {
        "ru": "Червеобразные мышцы стопы",
        "latin": "musculi lumbricales pedis",
        "modelAliases": [
          "lumbricals foot",
          "lumbricales pedis"
        ]
      },
      "layer": "plantar-layer-2",
      "subregions": [
        "central-sole",
        "toes"
      ],
      "anatomy": {
        "originRu": [
          "Сухожилия flexor digitorum longus."
        ],
        "insertionRu": [
          "Медиальные края разгибательных аппаратов II–V пальцев."
        ],
        "fiberDirectionRu": "Четыре тонкие мышцы идут от сгибательных сухожилий к медиальной стороне разгибательного аппарата.",
        "actionsRu": [
          "Сгибают плюснефаланговые суставы II–V.",
          "Помогают разгибанию межфаланговых суставов II–V."
        ],
        "innervationRu": "Первая — медиальный подошвенный нерв; II–IV — латеральный подошвенный нерв."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Сухожилия FDL",
          "II–V пальцы"
        ],
        "relationsRu": [
          "Имеют необычное направление от подошвенного сгибательного аппарата к тыльному разгибательному расширению."
        ]
      },
      "movementCueRu": "Положение с согнутыми MTP и более разогнутыми IP-суставами показывает общий результат работы червеобразных и межкостных.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, червеобразные мышцы стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — second layer",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "flexor-hallucis-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткий сгибатель большого пальца стопы",
        "latin": "musculus flexor hallucis brevis",
        "modelAliases": [
          "flexor hallucis brevis"
        ]
      },
      "layer": "plantar-layer-3-medial",
      "subregions": [
        "medial-sole",
        "hallux"
      ],
      "anatomy": {
        "originRu": [
          "Подошвенные поверхности кубовидной и латеральной клиновидной костей; возможны дополнительные фасциальные прикрепления."
        ],
        "insertionRu": [
          "Основание проксимальной фаланги большого пальца двумя сухожилиями, содержащими сесамовидные кости."
        ],
        "fiberDirectionRu": "Две головки расходятся к медиальной и латеральной сторонам I плюснефалангового сустава.",
        "actionsRu": [
          "Сгибает большой палец в плюснефаланговом суставе.",
          "Участвует в стабилизации первого луча при опоре и отталкивании."
        ],
        "innervationRu": "Медиальный подошвенный нерв; латеральная головка может получать дополнительную ветвь от латерального подошвенного."
      },
      "surfaceMap": {
        "landmarksRu": [
          "I плюснефаланговый сустав",
          "сесамовидные кости",
          "основание большого пальца"
        ],
        "relationsRu": [
          "Лежит глубже abductor hallucis и окружает сухожилие flexor hallucis longus двумя головками."
        ]
      },
      "movementCueRu": "Сгибание большого пальца в MTP-суставе показывает функцию; сесамовидный аппарат нужно показывать вместе с мышцей.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткий сгибатель большого пальца стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — third layer",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-innervation-variation"
      }
    },
    {
      "id": "adductor-hallucis",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, приводящая большой палец стопы",
        "latin": "musculus adductor hallucis",
        "modelAliases": [
          "adductor hallucis"
        ]
      },
      "layer": "plantar-layer-3-deep-central",
      "subregions": [
        "central-sole",
        "hallux"
      ],
      "anatomy": {
        "originRu": [
          "Косая головка — основания II–IV плюсневых костей, кубовидная и латеральная клиновидная кости и сухожилие fibularis longus.",
          "Поперечная головка — подошвенные и глубокие поперечные плюсневые связки в области III–V плюснефаланговых суставов."
        ],
        "insertionRu": [
          "Латеральная сторона основания проксимальной фаланги большого пальца, с включением латеральной сесамовидной кости."
        ],
        "fiberDirectionRu": "Косая головка идёт вперёд и медиально; поперечная — почти поперечно через передний отдел стопы.",
        "actionsRu": [
          "Приводит большой палец к оси II пальца.",
          "Помогает сгибанию большого пальца.",
          "Участвует в поддержке поперечного и продольных сводов."
        ],
        "innervationRu": "Глубокая ветвь латерального подошвенного нерва, S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Основания II–IV плюсневых",
          "I плюснефаланговый сустав",
          "передний отдел стопы"
        ],
        "relationsRu": [
          "Глубокая мышца третьего слоя; поперечная головка вариабельна и иногда может отсутствовать."
        ]
      },
      "movementCueRu": "Две головки нужно показывать раздельно в 3D, потому что их геометрия принципиально различается.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, мышца, приводящая большой палец стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — third layer",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-adductor-hallucis",
          "locator": "Origin and insertion; function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-two-heads-variable"
      }
    },
    {
      "id": "flexor-digiti-minimi-brevis-foot",
      "kind": "muscle",
      "names": {
        "ru": "Короткий сгибатель мизинца стопы",
        "latin": "musculus flexor digiti minimi brevis",
        "modelAliases": [
          "flexor digiti minimi brevis foot"
        ]
      },
      "layer": "plantar-layer-3-lateral",
      "subregions": [
        "lateral-sole",
        "little-toe"
      ],
      "anatomy": {
        "originRu": [
          "Подошвенная поверхность основания V плюсневой кости.",
          "Влагалище сухожилия fibularis longus."
        ],
        "insertionRu": [
          "Латеральная сторона основания проксимальной фаланги V пальца."
        ],
        "fiberDirectionRu": "Короткие пучки идут вперёд вдоль V плюсневой кости.",
        "actionsRu": [
          "Сгибает V палец в плюснефаланговом суставе."
        ],
        "innervationRu": "Поверхностная ветвь латерального подошвенного нерва, S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "V плюсневая кость",
          "основание V пальца"
        ],
        "relationsRu": [
          "Лежит глубже и медиальнее abductor digiti minimi."
        ]
      },
      "movementCueRu": "Сгибание V пальца показывает функцию, но наружный рельеф мышцы невелик.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, короткий сгибатель мизинца стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — third layer",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "plantar-interossei-foot",
      "kind": "muscle-group",
      "names": {
        "ru": "Подошвенные межкостные мышцы стопы",
        "latin": "musculi interossei plantares",
        "modelAliases": [
          "plantar interossei foot"
        ]
      },
      "layer": "plantar-layer-4",
      "subregions": [
        "intermetatarsal-spaces",
        "toes"
      ],
      "anatomy": {
        "originRu": [
          "Медиальные поверхности III–V плюсневых костей."
        ],
        "insertionRu": [
          "Медиальные стороны оснований проксимальных фаланг и разгибательных аппаратов III–V пальцев."
        ],
        "fiberDirectionRu": "Три одно-перистые мышцы идут от плюсневых костей к пальцам.",
        "actionsRu": [
          "Приводят III–V пальцы к оси II пальца.",
          "Помогают сгибанию MTP-суставов и разгибанию межфаланговых суставов."
        ],
        "innervationRu": "Латеральный подошвенный нерв, S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "III–V плюсневые кости",
          "II палец как функциональная ось"
        ],
        "relationsRu": [
          "Самый глубокий подошвенный слой совместно с тыльными межкостными."
        ]
      },
      "movementCueRu": "Мнемоника PAD полезна только после понимания, что осью отведения и приведения стопы считается II палец.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, подошвенные межкостные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Plantar intrinsic muscles — fourth layer",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-plantar-interossei-foot",
          "locator": "Key facts",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "dorsal-interossei-foot",
      "kind": "muscle-group",
      "names": {
        "ru": "Тыльные межкостные мышцы стопы",
        "latin": "musculi interossei dorsales pedis",
        "modelAliases": [
          "dorsal interossei foot"
        ]
      },
      "layer": "plantar-layer-4-intermetatarsal",
      "subregions": [
        "intermetatarsal-spaces",
        "toes"
      ],
      "anatomy": {
        "originRu": [
          "Соседние поверхности I–V плюсневых костей; четыре двуперистые мышцы."
        ],
        "insertionRu": [
          "Основания проксимальных фаланг и разгибательные аппараты II–IV пальцев."
        ],
        "fiberDirectionRu": "Четыре двуперистые мышцы заполняют межплюсневые промежутки.",
        "actionsRu": [
          "Отводят II–IV пальцы от оси II пальца.",
          "Помогают сгибанию MTP-суставов и разгибанию межфаланговых суставов."
        ],
        "innervationRu": "Латеральный подошвенный нерв, S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Межплюсневые промежутки",
          "II палец как функциональная ось"
        ],
        "relationsRu": [
          "Хотя называются тыльными, анатомически относятся к глубоким межкостным структурам и видны с тыла между плюсневыми костями."
        ]
      },
      "movementCueRu": "Понимание оси II пальца важнее попытки демонстрировать широкое разведение пальцев стопы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VII, тыльные межкостные мышцы стопы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-foot-muscles",
          "locator": "Dorsal interossei / fourth layer",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "opponens-digiti-minimi-foot",
      "kind": "variable-muscle",
      "names": {
        "ru": "Мышца, противопоставляющая мизинец стопы",
        "latin": "musculus opponens digiti minimi pedis",
        "modelAliases": [
          "opponens digiti minimi of foot",
          "opponens digiti minimi pedis"
        ]
      },
      "layer": "plantar-layer-3-lateral",
      "subregions": [
        "lateral-sole",
        "little-toe"
      ],
      "anatomy": {
        "originRu": [
          "Длинная подошвенная связка.",
          "Основание V плюсневой кости.",
          "Влагалище сухожилия длинной малоберцовой мышцы."
        ],
        "insertionRu": [
          "Латеральный край V плюсневой кости."
        ],
        "fiberDirectionRu": "Короткие глубокие пучки идут вдоль V плюсневой кости.",
        "actionsRu": [
          "Помогает сгибанию и небольшому отведению V пальца.",
          "Участвует в стабилизации латерального края стопы."
        ],
        "innervationRu": "Поверхностная ветвь латерального подошвенного нерва, преимущественно S2–S3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "V плюсневая кость",
          "латеральный край подошвы"
        ],
        "relationsRu": [
          "Рассматривается как глубокое продолжение flexor digiti minimi brevis.",
          "Может быть выражена не у всех людей; в части современных описаний выделяется не как постоянная самостоятельная мышца."
        ]
      },
      "movementCueRu": "Для тренажёра карточка нужна из-за отдельного 3D-объекта; в базовом обучении относится к глубокой латеральной группе подошвы.",
      "sources": [
        {
          "sourceId": "ncbi-foot-ankle",
          "locator": "Muscles of the little toe — opponens digiti minimi when present",
          "role": "verification"
        },
        {
          "sourceId": "kenhub-opponens-foot",
          "locator": "Origin and insertion; Functions",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable"
      }
    }
  ]
});

export const LEG_FOOT_STRUCTURE_COUNT = LEG_FOOT_REGION.structures.length;

export function legFootStructureById(id) {
  return LEG_FOOT_REGION.structures.find((item) => item.id === id) || null;
}
