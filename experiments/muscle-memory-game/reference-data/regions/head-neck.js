function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const HEAD_NECK_REGION = deepFreeze({
  "id": "head-neck",
  "nameRu": "Голова и шея",
  "status": "verified-v1",
  "scopeRu": "Мимические и жевательные мышцы, поверхностные, над- и подподъязычные, лестничные, предпозвоночные и подзатылочные мышцы.",
  "relatedStructureIds": [
    "trapezius",
    "levator-scapulae",
    "splenius-capitis",
    "splenius-cervicis",
    "transversospinalis"
  ],
  "teachingPrinciplesRu": [
    "Различать поверхностные структуры, которые реально формируют рельеф, и глубокие структуры, которые нужны прежде всего для понимания топографии.",
    "Для передней и латеральной шеи всегда показывать рядом сосудисто-нервные и висцеральные структуры, если это меняет безопасную рабочую границу.",
    "Мимические мышцы описывать как взаимосвязанную систему, часто вплетающуюся в кожу и соседние мышцы; не навязывать им схему «одно начало — одно прикрепление» там, где она анатомически искусственна.",
    "Жевательные мышцы связывать с движениями нижней челюсти и ВНЧС, избегая упрощения сложной координации до одной мышцы.",
    "Подзатылочные мышцы показывать послойно и как группу рядом с позвоночной артерией; базовый курс не требует точечного ручного поиска каждой мышцы."
  ],
  "structures": [
    {
      "id": "occipitofrontalis",
      "kind": "muscle",
      "names": {
        "ru": "Затылочно-лобная мышца",
        "latin": "musculus occipitofrontalis",
        "modelAliases": [
          "occipitofrontalis",
          "epicranius",
          "frontalis",
          "occipitalis"
        ]
      },
      "subregions": [
        "scalp",
        "forehead",
        "occipital-region"
      ],
      "layer": "superficial-scalp",
      "anatomy": {
        "originRu": [
          "Лобное брюшко начинается от сухожильного шлема.",
          "Затылочное брюшко начинается от латеральной части верхней выйной линии и соседней сосцевидной области."
        ],
        "insertionRu": [
          "Лобное брюшко вплетается в кожу бровей и корня носа.",
          "Затылочное брюшко вплетается в сухожильный шлем."
        ],
        "fiberDirectionRu": "Лобное брюшко идёт вниз от сухожильного шлема к коже лба; затылочное — вверх к сухожильному шлему.",
        "actionsRu": [
          "Лобное брюшко поднимает брови и образует поперечные складки кожи лба.",
          "Затылочное брюшко тянет сухожильный шлем кзади."
        ],
        "innervationRu": "Лицевой нерв (VII): височные ветви для лобного брюшка, задняя ушная ветвь для затылочного."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Брови",
          "лоб",
          "верхняя выйная линия",
          "сухожильный шлем"
        ],
        "relationsRu": [
          "Мышечные брюшки соединены сухожильным шлемом и относятся к поверхностной мышечно-апоневротической системе головы."
        ]
      },
      "movementCueRu": "Подъём бровей хорошо показывает действие лобного брюшка.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "orbicularis-oculi",
      "kind": "muscle",
      "names": {
        "ru": "Круговая мышца глаза",
        "latin": "musculus orbicularis oculi",
        "modelAliases": [
          "orbicularis oculi"
        ]
      },
      "subregions": [
        "periorbital-region"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Медиальный край глазницы, медиальная связка века и соседняя область слёзной кости; мышца образует кольцевую систему вокруг глазной щели."
        ],
        "insertionRu": [
          "Волокна вплетаются в кожу вокруг глазницы, веки и латеральный шов век; у кольцевой мышцы нет одного линейного места прикрепления."
        ],
        "fiberDirectionRu": "Концентрические и дугообразные пучки окружают глазную щель.",
        "actionsRu": [
          "Закрывает веки.",
          "Глазничная часть обеспечивает более сильное зажмуривание; вековая — мягкое смыкание век."
        ],
        "innervationRu": "Лицевой нерв (VII), преимущественно височные и скуловые ветви."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Края глазницы",
          "медиальный и латеральный углы глаза"
        ],
        "relationsRu": [
          "Тонкая поверхностная мышца непосредственно связана с кожей век и периорбитальной области."
        ]
      },
      "movementCueRu": "Мягкое закрывание глаза и зажмуривание показывают разные режимы работы мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "corrugator-supercilii",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, сморщивающая бровь",
        "latin": "musculus corrugator supercilii",
        "modelAliases": [
          "corrugator supercilii"
        ]
      },
      "subregions": [
        "glabellar-region"
      ],
      "layer": "deep-to-frontalis-medial",
      "anatomy": {
        "originRu": [
          "Медиальная часть надбровной дуги лобной кости."
        ],
        "insertionRu": [
          "Кожа медиальной части брови."
        ],
        "fiberDirectionRu": "Короткие пучки идут латерально и несколько вверх.",
        "actionsRu": [
          "Тянет бровь медиально и вниз, формируя вертикальные складки над корнем носа."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальная часть брови",
          "корень носа"
        ],
        "relationsRu": [
          "Лежит глубже лобного брюшка затылочно-лобной мышцы и круговой мышцы глаза в медиальной надглазничной области."
        ]
      },
      "movementCueRu": "Сведение бровей демонстрирует функцию мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "procerus",
      "kind": "muscle",
      "names": {
        "ru": "Мышца гордецов",
        "latin": "musculus procerus",
        "modelAliases": [
          "procerus"
        ]
      },
      "subregions": [
        "glabellar-region",
        "nasal-root"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Кость и фасциальные структуры в области спинки носа."
        ],
        "insertionRu": [
          "Кожа нижней части лба между бровями."
        ],
        "fiberDirectionRu": "Пучки идут вверх от спинки носа к коже межбровья.",
        "actionsRu": [
          "Опускает медиальные части бровей и образует поперечные складки над переносицей."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Переносица",
          "межбровье"
        ],
        "relationsRu": [
          "Небольшая поверхностная мимическая мышца медиальной части лица."
        ]
      },
      "movementCueRu": "Нахмуривание в области переносицы показывает действие мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "nasalis",
      "kind": "muscle",
      "names": {
        "ru": "Носовая мышца",
        "latin": "musculus nasalis",
        "modelAliases": [
          "nasalis"
        ]
      },
      "subregions": [
        "nasal-region"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Передняя поверхность верхней челюсти латеральнее носового отверстия."
        ],
        "insertionRu": [
          "Апоневроз спинки носа и хрящи/кожа крыла носа; части мышцы имеют различное направление."
        ],
        "fiberDirectionRu": "Поперечная часть проходит к спинке носа, крыльная — к хрящу и коже крыла носа.",
        "actionsRu": [
          "Поперечная часть может суживать носовое отверстие; крыльная часть помогает расширять ноздрю."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Спинка носа",
          "крыло носа"
        ],
        "relationsRu": [
          "Мышца тонкая и вариабельная; её части тесно переплетаются с соседними мимическими мышцами."
        ]
      },
      "movementCueRu": "Изменение ширины ноздрей показывает функцию лучше, чем попытка выделить мышцу пальпацией.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "zygomaticus-major",
      "kind": "muscle",
      "names": {
        "ru": "Большая скуловая мышца",
        "latin": "musculus zygomaticus major",
        "modelAliases": [
          "zygomaticus major"
        ]
      },
      "subregions": [
        "cheek",
        "oral-commissure"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Латеральная поверхность скуловой кости."
        ],
        "insertionRu": [
          "Кожа и мышечный узел угла рта (modiolus)."
        ],
        "fiberDirectionRu": "Пучки идут вниз и медиально к углу рта.",
        "actionsRu": [
          "Поднимает и тянет угол рта латерально."
        ],
        "innervationRu": "Лицевой нерв (VII), скуловые и щёчные ветви."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Скуловая кость",
          "угол рта"
        ],
        "relationsRu": [
          "Проходит поверхностно через щёчную область и вплетается в общий мышечный узел угла рта."
        ]
      },
      "movementCueRu": "Улыбка подчёркивает направление действия мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "zygomaticus-minor",
      "kind": "muscle",
      "names": {
        "ru": "Малая скуловая мышца",
        "latin": "musculus zygomaticus minor",
        "modelAliases": [
          "zygomaticus minor"
        ]
      },
      "subregions": [
        "cheek",
        "upper-lip"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Скуловая кость медиальнее начала большой скуловой мышцы."
        ],
        "insertionRu": [
          "Кожа и мышцы верхней губы."
        ],
        "fiberDirectionRu": "Пучки идут вниз и медиально к верхней губе.",
        "actionsRu": [
          "Поднимает верхнюю губу."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Скуловая область",
          "верхняя губа"
        ],
        "relationsRu": [
          "Лежит медиальнее большой скуловой мышцы и может частично сливаться с мышцей, поднимающей верхнюю губу."
        ]
      },
      "movementCueRu": "Подъём верхней губы показывает действие мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "levator-labii-superioris",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, поднимающая верхнюю губу",
        "latin": "musculus levator labii superioris",
        "modelAliases": [
          "levator labii superioris"
        ]
      },
      "subregions": [
        "infraorbital-region",
        "upper-lip"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Подглазничный край верхней челюсти."
        ],
        "insertionRu": [
          "Кожа и мышечные волокна верхней губы."
        ],
        "fiberDirectionRu": "Пучки идут вниз к верхней губе.",
        "actionsRu": [
          "Поднимает верхнюю губу и углубляет носогубную складку."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подглазничный край",
          "верхняя губа"
        ],
        "relationsRu": [
          "Лежит поверхностно в медиальной части щеки, рядом с малой скуловой мышцей."
        ]
      },
      "movementCueRu": "Подъём верхней губы демонстрирует функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "levator-anguli-oris",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, поднимающая угол рта",
        "latin": "musculus levator anguli oris",
        "modelAliases": [
          "levator anguli oris"
        ]
      },
      "subregions": [
        "midface",
        "oral-commissure"
      ],
      "layer": "deep-facial",
      "anatomy": {
        "originRu": [
          "Клыковая ямка верхней челюсти ниже подглазничного отверстия."
        ],
        "insertionRu": [
          "Мышечный узел угла рта (modiolus)."
        ],
        "fiberDirectionRu": "Пучки идут вниз и латерально к углу рта.",
        "actionsRu": [
          "Поднимает угол рта."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Область клыковой ямки",
          "угол рта"
        ],
        "relationsRu": [
          "Лежит глубже части поверхностных мышц средней зоны лица."
        ]
      },
      "movementCueRu": "Подъём угла рта показывает функцию, но не изолирует мышцу от скуловых.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "risorius",
      "kind": "muscle",
      "names": {
        "ru": "Мышца смеха",
        "latin": "musculus risorius",
        "modelAliases": [
          "risorius"
        ]
      },
      "subregions": [
        "cheek",
        "oral-commissure"
      ],
      "layer": "superficial-face-variable",
      "anatomy": {
        "originRu": [
          "Фасция околоушной железы и жевательной мышцы; начало вариабельно."
        ],
        "insertionRu": [
          "Мышечный узел угла рта."
        ],
        "fiberDirectionRu": "Пучки идут преимущественно горизонтально к углу рта.",
        "actionsRu": [
          "Тянет угол рта латерально."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Угол рта",
          "передний край жевательной мышцы"
        ],
        "relationsRu": [
          "Мышца тонкая и вариабельная; у части людей выражена слабо."
        ]
      },
      "movementCueRu": "Латеральное растягивание углов рта показывает возможное направление её действия.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "buccinator",
      "kind": "muscle",
      "names": {
        "ru": "Щёчная мышца",
        "latin": "musculus buccinator",
        "modelAliases": [
          "buccinator"
        ]
      },
      "subregions": [
        "cheek",
        "oral-wall"
      ],
      "layer": "deep-cheek",
      "anatomy": {
        "originRu": [
          "Альвеолярные части верхней и нижней челюстей в области моляров и крылонижнечелюстной шов."
        ],
        "insertionRu": [
          "Волокна сходятся к углу рта и переплетаются с круговой мышцей рта."
        ],
        "fiberDirectionRu": "Горизонтальные пучки формируют мышечную основу щеки.",
        "actionsRu": [
          "Прижимает щёку к зубам и помогает удерживать пищу между жевательными поверхностями.",
          "Участвует в выдувании воздуха и работе губ при речи."
        ],
        "innervationRu": "Лицевой нерв (VII), щёчные ветви."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Щёчная область",
          "угол рта",
          "моляры"
        ],
        "relationsRu": [
          "Лежит глубже поверхностных мимических мышц; проток околоушной железы проходит через мышцу."
        ]
      },
      "movementCueRu": "Надувание щёк и контролируемое выдувание воздуха демонстрируют функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "orbicularis-oris",
      "kind": "muscle-complex",
      "names": {
        "ru": "Круговая мышца рта",
        "latin": "musculus orbicularis oris",
        "modelAliases": [
          "orbicularis oris"
        ]
      },
      "subregions": [
        "perioral-region"
      ],
      "layer": "superficial-perioral",
      "anatomy": {
        "originRu": [
          "Сложный мышечный комплекс вокруг ротовой щели получает собственные пучки и волокна от соседних мимических мышц и modiolus; одного линейного «начала» у него нет."
        ],
        "insertionRu": [
          "Кожа и слизистая губ, modiolus и взаимно переплетающиеся волокна вокруг ротовой щели."
        ],
        "fiberDirectionRu": "Кольцевые и перекрещивающиеся пучки окружают ротовую щель.",
        "actionsRu": [
          "Смыкает губы.",
          "Выдвигает губы вперёд и изменяет форму ротовой щели."
        ],
        "innervationRu": "Лицевой нерв (VII), преимущественно щёчные и краевая нижнечелюстная ветви."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Верхняя и нижняя губа",
          "углы рта"
        ],
        "relationsRu": [
          "В неё вплетаются многие мышцы, перемещающие губы и угол рта."
        ]
      },
      "movementCueRu": "Смыкание и вытягивание губ показывают разные действия комплекса.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-complex"
      }
    },
    {
      "id": "depressor-anguli-oris",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, опускающая угол рта",
        "latin": "musculus depressor anguli oris",
        "modelAliases": [
          "depressor anguli oris"
        ]
      },
      "subregions": [
        "lower-face",
        "oral-commissure"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Косая линия нижней челюсти."
        ],
        "insertionRu": [
          "Мышечный узел угла рта."
        ],
        "fiberDirectionRu": "Пучки идут вверх и медиально к углу рта.",
        "actionsRu": [
          "Опускает угол рта."
        ],
        "innervationRu": "Лицевой нерв (VII), краевая нижнечелюстная ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя челюсть",
          "угол рта"
        ],
        "relationsRu": [
          "Расположена поверхностно в нижнелатеральной части лица."
        ]
      },
      "movementCueRu": "Опускание угла рта показывает направление действия.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "depressor-labii-inferioris",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, опускающая нижнюю губу",
        "latin": "musculus depressor labii inferioris",
        "modelAliases": [
          "depressor labii inferioris"
        ]
      },
      "subregions": [
        "lower-lip",
        "chin"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Косая линия нижней челюсти между подбородочной областью и подбородочным отверстием."
        ],
        "insertionRu": [
          "Кожа и мышечные волокна нижней губы."
        ],
        "fiberDirectionRu": "Пучки идут вверх и медиально.",
        "actionsRu": [
          "Опускает и несколько выворачивает нижнюю губу."
        ],
        "innervationRu": "Лицевой нерв (VII), краевая нижнечелюстная ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя губа",
          "передняя часть нижней челюсти"
        ],
        "relationsRu": [
          "Лежит медиальнее мышцы, опускающей угол рта, и латеральнее подбородочной мышцы."
        ]
      },
      "movementCueRu": "Опускание нижней губы показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "mentalis",
      "kind": "muscle",
      "names": {
        "ru": "Подбородочная мышца",
        "latin": "musculus mentalis",
        "modelAliases": [
          "mentalis"
        ]
      },
      "subregions": [
        "chin"
      ],
      "layer": "superficial-face",
      "anatomy": {
        "originRu": [
          "Резцовая ямка нижней челюсти."
        ],
        "insertionRu": [
          "Кожа подбородка."
        ],
        "fiberDirectionRu": "Короткие пучки идут вниз к коже подбородка.",
        "actionsRu": [
          "Поднимает и выдвигает нижнюю губу.",
          "Создаёт складки кожи подбородка."
        ],
        "innervationRu": "Лицевой нерв (VII), краевая нижнечелюстная ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подбородок",
          "нижняя губа"
        ],
        "relationsRu": [
          "Парная поверхностная мышца медиальной части подбородка."
        ]
      },
      "movementCueRu": "Выдвижение нижней губы и сморщивание кожи подбородка показывают функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "auricular-muscles",
      "kind": "muscle-group",
      "names": {
        "ru": "Ушные мышцы",
        "latin": "musculi auriculares",
        "modelAliases": [
          "auricularis anterior",
          "auricularis superior",
          "auricularis posterior",
          "auricular muscles"
        ]
      },
      "subregions": [
        "auricular-region"
      ],
      "layer": "superficial-scalp",
      "anatomy": {
        "originRu": [
          "Передняя, верхняя и задняя ушные мышцы начинаются от височной фасции, сухожильного шлема и сосцевидной области соответственно."
        ],
        "insertionRu": [
          "Прикрепляются к ушной раковине."
        ],
        "fiberDirectionRu": "Короткие пучки подходят к ушной раковине с разных направлений.",
        "actionsRu": [
          "Могут слабо перемещать ушную раковину; у человека функция значительно редуцирована и вариабельна."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ушная раковина",
          "височная область",
          "сосцевидная область"
        ],
        "relationsRu": [
          "Небольшие поверхностные мышцы, выраженность и произвольный контроль сильно различаются."
        ]
      },
      "movementCueRu": "Отдельная практическая задача для базового курса не требуется.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV «Мышцы головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-facial-muscles",
          "locator": "Facial muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "masseter",
      "kind": "muscle",
      "names": {
        "ru": "Жевательная мышца",
        "latin": "musculus masseter",
        "modelAliases": [
          "masseter"
        ]
      },
      "subregions": [
        "lateral-face",
        "mandibular-region"
      ],
      "layer": "superficial-mastication",
      "anatomy": {
        "originRu": [
          "Скуловая дуга и прилежащая часть скуловой кости."
        ],
        "insertionRu": [
          "Латеральная поверхность ветви и угла нижней челюсти."
        ],
        "fiberDirectionRu": "Поверхностные волокна идут преимущественно вниз и назад; глубокие — более вертикально.",
        "actionsRu": [
          "Поднимает нижнюю челюсть.",
          "Поверхностные пучки помогают выдвижению нижней челюсти вперёд."
        ],
        "innervationRu": "Жевательный нерв — ветвь нижнечелюстного нерва V3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Скуловая дуга",
          "ветвь нижней челюсти",
          "угол нижней челюсти"
        ],
        "relationsRu": [
          "Поверхностная и хорошо различимая жевательная мышца на боковой поверхности лица."
        ]
      },
      "movementCueRu": "Умеренное смыкание зубов делает контур мышцы заметным.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV, 2.1 «Собственно жевательная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-mastication",
          "locator": "Masseter",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-masseter",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-core"
      }
    },
    {
      "id": "temporalis",
      "kind": "muscle",
      "names": {
        "ru": "Височная мышца",
        "latin": "musculus temporalis",
        "modelAliases": [
          "temporalis"
        ]
      },
      "subregions": [
        "temporal-region"
      ],
      "layer": "superficial-mastication",
      "anatomy": {
        "originRu": [
          "Височная ямка и глубокая поверхность височной фасции."
        ],
        "insertionRu": [
          "Венечный отросток и передний край ветви нижней челюсти."
        ],
        "fiberDirectionRu": "Передние волокна идут почти вертикально, средние — косо, задние — более горизонтально.",
        "actionsRu": [
          "Поднимает нижнюю челюсть.",
          "Задние волокна участвуют в возвращении выдвинутой нижней челюсти назад."
        ],
        "innervationRu": "Глубокие височные нервы — ветви V3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Височная ямка",
          "скуловая дуга",
          "венечный отросток"
        ],
        "relationsRu": [
          "Сухожилие проходит глубже скуловой дуги к венечному отростку."
        ]
      },
      "movementCueRu": "Смыкание зубов делает передние пучки височной мышцы заметнее.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV, 2.2 «Височная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-mastication",
          "locator": "Temporalis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "medial-pterygoid",
      "kind": "muscle",
      "names": {
        "ru": "Медиальная крыловидная мышца",
        "latin": "musculus pterygoideus medialis",
        "modelAliases": [
          "medial pterygoid",
          "pterygoideus medialis"
        ]
      },
      "subregions": [
        "infratemporal-region"
      ],
      "layer": "deep-mastication",
      "anatomy": {
        "originRu": [
          "Преимущественно медиальная поверхность латеральной пластинки крыловидного отростка и прилежащие структуры; поверхностная часть связана с бугром верхней челюсти."
        ],
        "insertionRu": [
          "Медиальная поверхность ветви и угла нижней челюсти."
        ],
        "fiberDirectionRu": "Пучки идут вниз, назад и латерально.",
        "actionsRu": [
          "Поднимает и выдвигает нижнюю челюсть.",
          "При односторонней работе участвует в боковом смещении нижней челюсти."
        ],
        "innervationRu": "Нерв медиальной крыловидной мышцы — ветвь V3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крыловидный отросток",
          "медиальная поверхность ветви нижней челюсти"
        ],
        "relationsRu": [
          "Глубокая мышца; вместе с жевательной формирует мышечную «петлю» вокруг угла нижней челюсти."
        ]
      },
      "movementCueRu": "Функцию изучают через движение нижней челюсти; наружная пальпация не даёт прямого доступа ко всей мышце.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV, 2.4 «Медиальная крыловидная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-mastication",
          "locator": "Medial pterygoid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "lateral-pterygoid",
      "kind": "muscle",
      "names": {
        "ru": "Латеральная крыловидная мышца",
        "latin": "musculus pterygoideus lateralis",
        "modelAliases": [
          "lateral pterygoid",
          "pterygoideus lateralis"
        ]
      },
      "subregions": [
        "infratemporal-region",
        "tmj-region"
      ],
      "layer": "deep-mastication",
      "anatomy": {
        "originRu": [
          "Верхняя головка — подвисочная поверхность большого крыла клиновидной кости; нижняя — латеральная поверхность латеральной пластинки крыловидного отростка."
        ],
        "insertionRu": [
          "Шейка нижней челюсти в области крыловидной ямки; часть верхних волокон связана с капсулой и суставным диском ВНЧС."
        ],
        "fiberDirectionRu": "Пучки идут почти горизонтально назад и латерально.",
        "actionsRu": [
          "Двусторонняя работа участвует в выдвижении нижней челюсти и открывании рта.",
          "Односторонняя работа участвует в смещении нижней челюсти в противоположную сторону.",
          "Функции верхней и нижней головок различаются по фазам движения ВНЧС."
        ],
        "innervationRu": "Нерв латеральной крыловидной мышцы — ветвь V3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подвисочная область",
          "шейка нижней челюсти",
          "ВНЧС"
        ],
        "relationsRu": [
          "Глубокая мышца рядом с ВНЧС и структурами подвисочной ямки; не является поверхностной мышцей для прямой наружной пальпации."
        ]
      },
      "movementCueRu": "Карточка связывает мышцу с кинематикой ВНЧС; упрощение «открывает рот» недостаточно.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел IV, 2.3 «Латеральная крыловидная мышца»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-mastication",
          "locator": "Lateral pterygoid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-functional-nuance"
      }
    },
    {
      "id": "platysma",
      "kind": "muscle",
      "names": {
        "ru": "Подкожная мышца шеи",
        "latin": "platysma",
        "modelAliases": [
          "platysma"
        ]
      },
      "subregions": [
        "anterior-neck",
        "lateral-neck",
        "lower-face"
      ],
      "layer": "most-superficial-neck",
      "anatomy": {
        "originRu": [
          "Фасциальные ткани верхней части грудной клетки над большой грудной и дельтовидной мышцами."
        ],
        "insertionRu": [
          "Нижний край нижней челюсти и кожа/мышцы нижней части лица и угла рта."
        ],
        "fiberDirectionRu": "Тонкие широкие волокна идут вверх через переднебоковую поверхность шеи.",
        "actionsRu": [
          "Натягивает кожу шеи.",
          "Может помогать опусканию нижней губы, угла рта и нижней челюсти; вклад вариабелен."
        ],
        "innervationRu": "Шейная ветвь лицевого нерва (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Ключица",
          "нижний край нижней челюсти",
          "переднебоковая поверхность шеи"
        ],
        "relationsRu": [
          "Самый поверхностный мышечный слой передней и боковой шеи; глубже лежат грудино-ключично-сосцевидная и подподъязычные мышцы."
        ]
      },
      "movementCueRu": "Натяжение кожи передней шеи показывает работу мышцы, но её функция выражена у людей по-разному.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, поверхностные мышцы шеи",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-platysma",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "sternocleidomastoid",
      "kind": "muscle",
      "names": {
        "ru": "Грудино-ключично-сосцевидная мышца",
        "latin": "musculus sternocleidomastoideus",
        "modelAliases": [
          "sternocleidomastoid",
          "sternocleidomastoideus",
          "scm"
        ]
      },
      "subregions": [
        "anterolateral-neck"
      ],
      "layer": "superficial-neck",
      "anatomy": {
        "originRu": [
          "Грудинная головка — передняя поверхность рукоятки грудины.",
          "Ключичная головка — верхняя поверхность медиальной части ключицы."
        ],
        "insertionRu": [
          "Сосцевидный отросток височной кости и латеральная часть верхней выйной линии."
        ],
        "fiberDirectionRu": "Волокна идут вверх, латерально и назад.",
        "actionsRu": [
          "Односторонне наклоняет шею в свою сторону и поворачивает голову в противоположную.",
          "Двусторонне участвует в сгибании нижнешейного отдела и может разгибать голову в верхнешейных суставах в зависимости от положения.",
          "При фиксированной голове может помогать форсированному вдоху, поднимая грудину и ключицу."
        ],
        "innervationRu": "Двигательная — добавочный нерв (XI); проприоцептивные волокна — C2–C3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Сосцевидный отросток",
          "рукоятка грудины",
          "медиальная ключица"
        ],
        "relationsRu": [
          "Крупная поверхностная мышца разделяет шею на передний и задний треугольники; глубже располагаются лестничные мышцы и сосудисто-нервные структуры."
        ]
      },
      "movementCueRu": "Поворот головы в противоположную сторону делает мышцу заметной, но сильное сопротивление для ориентации не требуется.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, грудино-ключично-сосцевидная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-sternocleidomastoid",
          "locator": "Introduction; Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-neck-movements",
          "locator": "Anterior neck muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-action-nuance"
      }
    },
    {
      "id": "digastric",
      "kind": "muscle",
      "names": {
        "ru": "Двубрюшная мышца",
        "latin": "musculus digastricus",
        "modelAliases": [
          "digastric",
          "digastricus"
        ]
      },
      "subregions": [
        "submandibular-region"
      ],
      "layer": "suprahyoid",
      "anatomy": {
        "originRu": [
          "Переднее брюшко — двубрюшная ямка нижней челюсти.",
          "Заднее брюшко — сосцевидная вырезка височной кости."
        ],
        "insertionRu": [
          "Оба брюшка соединяются промежуточным сухожилием, фиксированным фасциальной петлёй к подъязычной кости."
        ],
        "fiberDirectionRu": "Переднее и заднее брюшки сходятся к промежуточному сухожилию у подъязычной кости.",
        "actionsRu": [
          "При фиксированной нижней челюсти поднимает подъязычную кость при глотании.",
          "При фиксированной подъязычной кости помогает опускать нижнюю челюсть."
        ],
        "innervationRu": "Переднее брюшко — нерв челюстно-подъязычной мышцы (V3); заднее — лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя челюсть",
          "сосцевидная область",
          "подъязычная кость"
        ],
        "relationsRu": [
          "Формирует границы подчелюстного и подподбородочного треугольников."
        ]
      },
      "movementCueRu": "Функцию рассматривают в составе координации глотания и открывания рта.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, надподъязычные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-suprahyoid",
          "locator": "Suprahyoid muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-mylohyoid",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-dual-innervation"
      }
    },
    {
      "id": "stylohyoid",
      "kind": "muscle",
      "names": {
        "ru": "Шилоподъязычная мышца",
        "latin": "musculus stylohyoideus",
        "modelAliases": [
          "stylohyoid",
          "stylohyoideus"
        ]
      },
      "subregions": [
        "submandibular-region"
      ],
      "layer": "suprahyoid",
      "anatomy": {
        "originRu": [
          "Шиловидный отросток височной кости."
        ],
        "insertionRu": [
          "Тело подъязычной кости у основания большого рога; сухожилие обычно расщепляется вокруг промежуточного сухожилия двубрюшной мышцы."
        ],
        "fiberDirectionRu": "Идёт вниз и вперёд к подъязычной кости.",
        "actionsRu": [
          "Поднимает и тянет подъязычную кость назад при глотании."
        ],
        "innervationRu": "Лицевой нерв (VII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Шиловидный отросток",
          "подъязычная кость"
        ],
        "relationsRu": [
          "Тонкая глубокая структура рядом с задним брюшком двубрюшной мышцы."
        ]
      },
      "movementCueRu": "На базовом уровне важнее понимать её место в надподъязычной группе, чем пытаться изолированно находить мышцу.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, шилоподъязычная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-mylohyoid",
          "locator": "Muscles — stylohyoid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "mylohyoid",
      "kind": "muscle",
      "names": {
        "ru": "Челюстно-подъязычная мышца",
        "latin": "musculus mylohyoideus",
        "modelAliases": [
          "mylohyoid",
          "mylohyoideus"
        ]
      },
      "subregions": [
        "floor-of-mouth",
        "submental-region"
      ],
      "layer": "suprahyoid-floor-of-mouth",
      "anatomy": {
        "originRu": [
          "Челюстно-подъязычная линия нижней челюсти."
        ],
        "insertionRu": [
          "Срединный шов дна рта и тело подъязычной кости."
        ],
        "fiberDirectionRu": "Пучки идут вниз и медиально к срединному шву и подъязычной кости.",
        "actionsRu": [
          "Поднимает дно полости рта и подъязычную кость при глотании.",
          "При фиксированной подъязычной кости помогает опусканию нижней челюсти."
        ],
        "innervationRu": "Нерв челюстно-подъязычной мышцы — ветвь нижнего альвеолярного нерва V3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Внутренняя поверхность нижней челюсти",
          "подъязычная кость"
        ],
        "relationsRu": [
          "Парные мышцы формируют основную мышечную диафрагму дна полости рта."
        ]
      },
      "movementCueRu": "Карточка нужна прежде всего для понимания дна полости рта и глотания.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, челюстно-подъязычная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-mylohyoid",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "geniohyoid",
      "kind": "muscle",
      "names": {
        "ru": "Подбородочно-подъязычная мышца",
        "latin": "musculus geniohyoideus",
        "modelAliases": [
          "geniohyoid",
          "geniohyoideus"
        ]
      },
      "subregions": [
        "floor-of-mouth"
      ],
      "layer": "suprahyoid-deep",
      "anatomy": {
        "originRu": [
          "Нижняя подбородочная ость на внутренней поверхности нижней челюсти."
        ],
        "insertionRu": [
          "Передняя поверхность тела подъязычной кости."
        ],
        "fiberDirectionRu": "Короткие пучки идут назад и вниз к подъязычной кости.",
        "actionsRu": [
          "Тянет подъязычную кость вперёд и вверх.",
          "При фиксированной подъязычной кости помогает опусканию нижней челюсти."
        ],
        "innervationRu": "Волокна C1, проходящие вместе с подъязычным нервом (XII)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подбородочная ость",
          "подъязычная кость"
        ],
        "relationsRu": [
          "Лежит выше челюстно-подъязычной мышцы и ниже языка."
        ]
      },
      "movementCueRu": "Глубокая мышца дна рта; отдельная наружная пальпаторная задача не нужна.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, подбородочно-подъязычная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-infrahyoid",
          "locator": "Anterior cervical region — geniohyoid",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-suprahyoid",
          "locator": "Suprahyoid muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "sternohyoid",
      "kind": "muscle",
      "names": {
        "ru": "Грудино-подъязычная мышца",
        "latin": "musculus sternohyoideus",
        "modelAliases": [
          "sternohyoid",
          "sternohyoideus"
        ]
      },
      "subregions": [
        "anterior-neck"
      ],
      "layer": "infrahyoid-superficial",
      "anatomy": {
        "originRu": [
          "Задняя поверхность рукоятки грудины и прилежащая область медиального конца ключицы."
        ],
        "insertionRu": [
          "Нижний край тела подъязычной кости."
        ],
        "fiberDirectionRu": "Длинные вертикальные пучки идут вверх к подъязычной кости.",
        "actionsRu": [
          "Опускает подъязычную кость после её подъёма при глотании."
        ],
        "innervationRu": "Шейная петля (ansa cervicalis), C1–C3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Рукоятка грудины",
          "подъязычная кость"
        ],
        "relationsRu": [
          "Лежит поверхностнее грудино-щитовидной мышцы; глубже располагаются гортань, трахея и щитовидная железа."
        ]
      },
      "movementCueRu": "Карточка важна как часть передней карты шеи и как напоминание о близости глубоких органов.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, грудино-подъязычная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-sternohyoid",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-infrahyoid",
          "locator": "Infrahyoid muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "omohyoid",
      "kind": "muscle",
      "names": {
        "ru": "Лопаточно-подъязычная мышца",
        "latin": "musculus omohyoideus",
        "modelAliases": [
          "omohyoid",
          "omohyoideus"
        ]
      },
      "subregions": [
        "anterior-neck",
        "lateral-neck"
      ],
      "layer": "infrahyoid",
      "anatomy": {
        "originRu": [
          "Верхний край лопатки около вырезки лопатки."
        ],
        "insertionRu": [
          "Тело подъязычной кости через верхнее брюшко; верхнее и нижнее брюшки соединены промежуточным сухожилием."
        ],
        "fiberDirectionRu": "Нижнее брюшко идёт вперёд и вверх, верхнее — почти вертикально к подъязычной кости.",
        "actionsRu": [
          "Опускает и стабилизирует подъязычную кость."
        ],
        "innervationRu": "Шейная петля, преимущественно C1–C3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Подъязычная кость",
          "верхний край лопатки",
          "латеральная область шеи"
        ],
        "relationsRu": [
          "Пересекает латеральную область шеи и служит топографическим ориентиром; рядом проходят крупные сосудисто-нервные структуры."
        ]
      },
      "movementCueRu": "Для тренажёра особенно полезна как топографическая структура, а не как самостоятельная поверхностная «мишень».",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, лопаточно-подъязычная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-infrahyoid",
          "locator": "Omohyoid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "sternothyroid",
      "kind": "muscle",
      "names": {
        "ru": "Грудино-щитовидная мышца",
        "latin": "musculus sternothyroideus",
        "modelAliases": [
          "sternothyroid",
          "sternothyroideus"
        ]
      },
      "subregions": [
        "anterior-neck"
      ],
      "layer": "infrahyoid-deep",
      "anatomy": {
        "originRu": [
          "Задняя поверхность рукоятки грудины и область I рёберного хряща."
        ],
        "insertionRu": [
          "Косая линия щитовидного хряща."
        ],
        "fiberDirectionRu": "Вертикальные пучки идут вверх к гортани.",
        "actionsRu": [
          "Опускает гортань после её подъёма при глотании."
        ],
        "innervationRu": "Шейная петля, преимущественно C2–C3."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Рукоятка грудины",
          "щитовидный хрящ"
        ],
        "relationsRu": [
          "Лежит глубже грудино-подъязычной мышцы; непосредственно покрывает переднюю область гортани и щитовидной железы."
        ]
      },
      "movementCueRu": "Глубокое положение делает карточку прежде всего анатомической и защитной.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, грудино-щитовидная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-infrahyoid",
          "locator": "Sternothyroid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "thyrohyoid",
      "kind": "muscle",
      "names": {
        "ru": "Щитоподъязычная мышца",
        "latin": "musculus thyrohyoideus",
        "modelAliases": [
          "thyrohyoid",
          "thyrohyoideus"
        ]
      },
      "subregions": [
        "anterior-neck"
      ],
      "layer": "infrahyoid-deep",
      "anatomy": {
        "originRu": [
          "Косая линия щитовидного хряща."
        ],
        "insertionRu": [
          "Нижний край тела и большой рог подъязычной кости."
        ],
        "fiberDirectionRu": "Короткие вертикальные пучки продолжают направление грудино-щитовидной мышцы.",
        "actionsRu": [
          "При фиксированной гортани опускает подъязычную кость.",
          "При фиксированной подъязычной кости поднимает гортань."
        ],
        "innervationRu": "Волокна C1, проходящие вместе с подъязычным нервом (XII), а не ansa cervicalis."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Щитовидный хрящ",
          "подъязычная кость"
        ],
        "relationsRu": [
          "Короткая глубокая мышца между гортанью и подъязычной костью."
        ]
      },
      "movementCueRu": "Важное исключение в подподъязычной группе: иннервация отличается от трёх остальных мышц.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, щито-подъязычная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-infrahyoid",
          "locator": "Thyrohyoid",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-innervation-exception"
      }
    },
    {
      "id": "scalenus-anterior",
      "kind": "muscle",
      "names": {
        "ru": "Передняя лестничная мышца",
        "latin": "musculus scalenus anterior",
        "modelAliases": [
          "scalenus anterior",
          "anterior scalene"
        ]
      },
      "subregions": [
        "lateral-neck",
        "thoracic-inlet"
      ],
      "layer": "deep-lateral-neck",
      "anatomy": {
        "originRu": [
          "Передние бугорки поперечных отростков C3–C6."
        ],
        "insertionRu": [
          "Бугорок передней лестничной мышцы на I ребре."
        ],
        "fiberDirectionRu": "Пучки идут вниз и латерально к I ребру.",
        "actionsRu": [
          "При фиксированной грудной клетке участвует в боковом сгибании и сгибании шеи.",
          "При фиксированном шейном отделе поднимает I ребро и участвует во вдохе как вспомогательная мышца."
        ],
        "innervationRu": "Передние ветви шейных спинномозговых нервов, преимущественно C4–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечные отростки шейных позвонков",
          "I ребро"
        ],
        "relationsRu": [
          "Подключичная вена проходит кпереди от мышцы; подключичная артерия и стволы плечевого сплетения — между передней и средней лестничными мышцами."
        ]
      },
      "movementCueRu": "Карточка должна показывать мышцу вместе с межлестничным пространством; это важнее попытки изолированной глубокой пальпации.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, передняя лестничная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-scalenes",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "scalenus-medius",
      "kind": "muscle",
      "names": {
        "ru": "Средняя лестничная мышца",
        "latin": "musculus scalenus medius",
        "modelAliases": [
          "scalenus medius",
          "middle scalene"
        ]
      },
      "subregions": [
        "lateral-neck",
        "thoracic-inlet"
      ],
      "layer": "deep-lateral-neck",
      "anatomy": {
        "originRu": [
          "Задние бугорки поперечных отростков верхних и средних шейных позвонков, обычно C2–C7."
        ],
        "insertionRu": [
          "Верхняя поверхность I ребра позади борозды подключичной артерии."
        ],
        "fiberDirectionRu": "Пучки идут вниз и латерально к I ребру.",
        "actionsRu": [
          "Участвует в боковом сгибании шеи.",
          "Поднимает I ребро и может участвовать во вдохе."
        ],
        "innervationRu": "Передние ветви шейных спинномозговых нервов, примерно C3–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральная поверхность шеи",
          "I ребро"
        ],
        "relationsRu": [
          "Плечевое сплетение и подключичная артерия проходят между передней и средней лестничными мышцами."
        ]
      },
      "movementCueRu": "Изучается вместе с передней лестничной и межлестничным пространством.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, средняя лестничная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-scalenes",
          "locator": "Structure and Function",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "scalenus-posterior",
      "kind": "muscle",
      "names": {
        "ru": "Задняя лестничная мышца",
        "latin": "musculus scalenus posterior",
        "modelAliases": [
          "scalenus posterior",
          "posterior scalene"
        ]
      },
      "subregions": [
        "lateral-neck"
      ],
      "layer": "deep-lateral-neck",
      "anatomy": {
        "originRu": [
          "Задние бугорки поперечных отростков нижних шейных позвонков, чаще C4–C6."
        ],
        "insertionRu": [
          "Наружная поверхность II ребра."
        ],
        "fiberDirectionRu": "Пучки идут вниз и латерально к II ребру.",
        "actionsRu": [
          "Участвует в боковом сгибании шеи.",
          "Поднимает II ребро и может участвовать во вдохе."
        ],
        "innervationRu": "Передние ветви нижних шейных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Нижняя латеральная область шеи",
          "II ребро"
        ],
        "relationsRu": [
          "Лежит кзади от средней лестничной мышцы; выраженность и точные прикрепления вариабельны."
        ]
      },
      "movementCueRu": "На базовом уровне важна как часть лестничной группы и глубокого слоя.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, задняя лестничная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-scalenes",
          "locator": "Structure and Function; variants",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-variation"
      }
    },
    {
      "id": "longus-colli",
      "kind": "muscle",
      "names": {
        "ru": "Длинная мышца шеи",
        "latin": "musculus longus colli",
        "modelAliases": [
          "longus colli"
        ]
      },
      "subregions": [
        "prevertebral-neck"
      ],
      "layer": "prevertebral-deep",
      "anatomy": {
        "originRu": [
          "Мышца состоит из верхней косой, вертикальной и нижней косой частей, начинающихся от тел и поперечных отростков шейных и верхних грудных позвонков."
        ],
        "insertionRu": [
          "Части прикрепляются к переднему бугорку C1, телам верхних шейных позвонков и передним бугоркам поперечных отростков нижних шейных позвонков."
        ],
        "fiberDirectionRu": "Пучки имеют вертикальное и косое направление вдоль передней поверхности шейного отдела.",
        "actionsRu": [
          "При двусторонней работе сгибает шейный отдел.",
          "При односторонней работе участвует в небольшом боковом сгибании и контроле сегментарного положения."
        ],
        "innervationRu": "Передние ветви шейных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность шейных позвонков"
        ],
        "relationsRu": [
          "Глубокая предпозвоночная мышца позади глотки, пищевода и сосудисто-нервных структур; наружной поверхностной пальпации не предназначена."
        ]
      },
      "movementCueRu": "Нужна для понимания глубоких сгибателей шеи и послойной анатомии, а не как ручная цель.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, 3.2.1 «Длинная мышца шеи»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-prevertebral",
          "locator": "Longus colli",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "longus-capitis",
      "kind": "muscle",
      "names": {
        "ru": "Длинная мышца головы",
        "latin": "musculus longus capitis",
        "modelAliases": [
          "longus capitis"
        ]
      },
      "subregions": [
        "prevertebral-neck",
        "craniovertebral-junction"
      ],
      "layer": "prevertebral-deep",
      "anatomy": {
        "originRu": [
          "Передние бугорки поперечных отростков C3–C6."
        ],
        "insertionRu": [
          "Базилярная часть затылочной кости."
        ],
        "fiberDirectionRu": "Пучки идут вверх и медиально к основанию черепа.",
        "actionsRu": [
          "Сгибает голову и верхнюю часть шеи.",
          "При односторонней работе может вносить небольшой вклад в боковое сгибание."
        ],
        "innervationRu": "Передние ветви верхних шейных спинномозговых нервов."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность C3–C6",
          "основание затылочной кости"
        ],
        "relationsRu": [
          "Глубокая предпозвоночная мышца, лежащая впереди верхнего шейного отдела."
        ]
      },
      "movementCueRu": "Глубокий ориентир функциональной анатомии; не предполагает прямой наружной пальпации.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, 3.2.2 «Длинная мышца головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-prevertebral",
          "locator": "Prevertebral muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "rectus-capitis-anterior",
      "kind": "muscle",
      "names": {
        "ru": "Передняя прямая мышца головы",
        "latin": "musculus rectus capitis anterior",
        "modelAliases": [
          "rectus capitis anterior"
        ]
      },
      "subregions": [
        "craniovertebral-junction"
      ],
      "layer": "prevertebral-deep",
      "anatomy": {
        "originRu": [
          "Латеральная масса и передняя поверхность поперечного отростка C1."
        ],
        "insertionRu": [
          "Базилярная часть затылочной кости кпереди от затылочного мыщелка."
        ],
        "fiberDirectionRu": "Короткие пучки идут вверх и медиально.",
        "actionsRu": [
          "Сгибает голову в атлантозатылочном суставе и помогает стабилизировать краниовертебральный переход."
        ],
        "innervationRu": "Передние ветви C1–C2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "C1",
          "основание затылочной кости"
        ],
        "relationsRu": [
          "Очень глубокая мышца передней поверхности краниовертебрального перехода."
        ]
      },
      "movementCueRu": "Карточка нужна для глубокой карты, без ручной задачи.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, 3.2.3 «Передняя прямая мышца головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-prevertebral",
          "locator": "Rectus capitis anterior",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-correction"
      }
    },
    {
      "id": "rectus-capitis-lateralis",
      "kind": "muscle",
      "names": {
        "ru": "Латеральная прямая мышца головы",
        "latin": "musculus rectus capitis lateralis",
        "modelAliases": [
          "rectus capitis lateralis"
        ]
      },
      "subregions": [
        "craniovertebral-junction"
      ],
      "layer": "prevertebral-deep",
      "anatomy": {
        "originRu": [
          "Поперечный отросток C1."
        ],
        "insertionRu": [
          "Яремный отросток затылочной кости."
        ],
        "fiberDirectionRu": "Короткие вертикально-косые пучки идут от атланта к затылочной кости.",
        "actionsRu": [
          "Участвует в боковом сгибании головы и стабилизации атлантозатылочного сустава."
        ],
        "innervationRu": "Передние ветви C1–C2."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечный отросток C1",
          "яремный отросток затылочной кости"
        ],
        "relationsRu": [
          "Глубокая латеральная мышца краниовертебрального перехода."
        ]
      },
      "movementCueRu": "В справочнике важна для полноты глубокого слоя, без поверхностной пальпаторной задачи.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел V, 3.2.4 «Латеральная прямая мышца головы»",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-prevertebral",
          "locator": "Rectus capitis lateralis",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-correction"
      }
    },
    {
      "id": "rectus-capitis-posterior-major",
      "kind": "muscle",
      "names": {
        "ru": "Большая задняя прямая мышца головы",
        "latin": "musculus rectus capitis posterior major",
        "modelAliases": [
          "rectus capitis posterior major"
        ]
      },
      "subregions": [
        "suboccipital-region"
      ],
      "layer": "suboccipital-deep",
      "anatomy": {
        "originRu": [
          "Остистый отросток C2."
        ],
        "insertionRu": [
          "Латеральная часть нижней выйной линии затылочной кости."
        ],
        "fiberDirectionRu": "Пучки идут вверх и латерально.",
        "actionsRu": [
          "Разгибает голову.",
          "Участвует в повороте головы в свою сторону."
        ],
        "innervationRu": "Подзатылочный нерв — задняя ветвь C1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Остистый отросток C2",
          "нижняя выйная линия"
        ],
        "relationsRu": [
          "Одна из мышц подзатылочной группы; формирует медиальную границу подзатылочного треугольника."
        ]
      },
      "movementCueRu": "Изучается как часть глубокой группы; точечная практическая работа по отдельной мышце не является задачей базового курса.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, подзатылочные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-suboccipital",
          "locator": "Suboccipital muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "rectus-capitis-posterior-minor",
      "kind": "muscle",
      "names": {
        "ru": "Малая задняя прямая мышца головы",
        "latin": "musculus rectus capitis posterior minor",
        "modelAliases": [
          "rectus capitis posterior minor"
        ]
      },
      "subregions": [
        "suboccipital-region"
      ],
      "layer": "suboccipital-deep",
      "anatomy": {
        "originRu": [
          "Задний бугорок C1."
        ],
        "insertionRu": [
          "Медиальная часть нижней выйной линии и прилежащая затылочная кость."
        ],
        "fiberDirectionRu": "Короткие пучки идут вверх и несколько латерально.",
        "actionsRu": [
          "Разгибает голову и участвует в тонкой постуральной стабилизации краниовертебрального перехода."
        ],
        "innervationRu": "Подзатылочный нерв — задняя ветвь C1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Задний бугорок C1",
          "нижняя выйная линия"
        ],
        "relationsRu": [
          "Лежит медиально в глубоком подзатылочном слое."
        ]
      },
      "movementCueRu": "Карточка нужна для понимания слоя; отдельную пальпаторную точность не обещаем.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, подзатылочные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-suboccipital",
          "locator": "Suboccipital muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "obliquus-capitis-superior",
      "kind": "muscle",
      "names": {
        "ru": "Верхняя косая мышца головы",
        "latin": "musculus obliquus capitis superior",
        "modelAliases": [
          "obliquus capitis superior"
        ]
      },
      "subregions": [
        "suboccipital-region"
      ],
      "layer": "suboccipital-deep",
      "anatomy": {
        "originRu": [
          "Поперечный отросток C1."
        ],
        "insertionRu": [
          "Затылочная кость между верхней и нижней выйными линиями."
        ],
        "fiberDirectionRu": "Пучки идут вверх и медиально.",
        "actionsRu": [
          "Разгибает голову.",
          "Участвует в боковом сгибании головы в свою сторону."
        ],
        "innervationRu": "Подзатылочный нерв — задняя ветвь C1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Поперечный отросток C1",
          "затылочная кость"
        ],
        "relationsRu": [
          "Формирует суперолатеральную границу подзатылочного треугольника; рядом проходит позвоночная артерия."
        ]
      },
      "movementCueRu": "Глубокая анатомическая структура, важная прежде всего из-за отношений подзатылочного треугольника.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, подзатылочные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-suboccipital",
          "locator": "Suboccipital triangle",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "obliquus-capitis-inferior",
      "kind": "muscle",
      "names": {
        "ru": "Нижняя косая мышца головы",
        "latin": "musculus obliquus capitis inferior",
        "modelAliases": [
          "obliquus capitis inferior"
        ]
      },
      "subregions": [
        "suboccipital-region"
      ],
      "layer": "suboccipital-deep",
      "anatomy": {
        "originRu": [
          "Остистый отросток C2."
        ],
        "insertionRu": [
          "Поперечный отросток C1."
        ],
        "fiberDirectionRu": "Пучки идут вверх и латерально.",
        "actionsRu": [
          "Поворачивает атлант и голову в свою сторону в атлантоосевом комплексе; к затылочной кости не прикрепляется."
        ],
        "innervationRu": "Подзатылочный нерв — задняя ветвь C1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Остистый отросток C2",
          "поперечный отросток C1"
        ],
        "relationsRu": [
          "Формирует нижнелатеральную границу подзатылочного треугольника; рядом проходят позвоночная артерия и подзатылочный нерв."
        ]
      },
      "movementCueRu": "Эта мышца полезна для понимания ротации C1–C2 и глубоких сосудисто-нервных отношений.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел I, подзатылочные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-suboccipital",
          "locator": "Suboccipital muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    }
  ]
});

export const HEAD_NECK_STRUCTURE_COUNT = HEAD_NECK_REGION.structures.length;

export function headNeckStructureById(id) {
  return HEAD_NECK_REGION.structures.find((item) => item.id === id) || null;
}
