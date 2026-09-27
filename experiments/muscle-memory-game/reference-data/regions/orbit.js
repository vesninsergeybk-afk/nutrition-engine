function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const ORBIT_REGION = deepFreeze({
  "id": "orbit",
  "nameRu": "Глазница и наружные мышцы глаза",
  "status": "verified-v1",
  "scopeRu": "Шесть мышц, вращающих глазное яблоко, и мышца, поднимающая верхнее веко.",
  "teachingPrinciplesRu": [
    "Движение глаза описывать относительно первичного положения взгляда и помнить, что действие вертикальных прямых и косых мышц зависит от ориентации глазного яблока.",
    "Не переносить мнемонику иннервации вместо понимания механики: латеральная прямая — VI, верхняя косая — IV, остальные наружные мышцы глаза — III.",
    "Верхнюю косую обязательно показывать вместе с блоком, потому что он меняет направление тяги.",
    "Эти мышцы относятся к глубокой анатомии орбиты и не являются объектом поверхностной ручной работы."
  ],
  "structures": [
    {
      "id": "medial-rectus",
      "kind": "muscle",
      "names": {
        "ru": "Медиальная прямая мышца глаза",
        "latin": "musculus rectus medialis",
        "modelAliases": [
          "medial rectus"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Общее сухожильное кольцо (annulus of Zinn) в задней части орбиты."
        ],
        "insertionRu": [
          "Медиальная поверхность склеры кпереди от экватора глазного яблока."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Приводит глазное яблоко."
        ],
        "innervationRu": "Глазодвигательный нерв (III), нижняя ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Идёт вдоль медиальной стенки орбиты; среди прямых мышц прикрепляется ближе всего к лимбу."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "lateral-rectus",
      "kind": "muscle",
      "names": {
        "ru": "Латеральная прямая мышца глаза",
        "latin": "musculus rectus lateralis",
        "modelAliases": [
          "lateral rectus"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Общее сухожильное кольцо (annulus of Zinn)."
        ],
        "insertionRu": [
          "Латеральная поверхность склеры кпереди от экватора."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Отводит глазное яблоко."
        ],
        "innervationRu": "Отводящий нерв (VI)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Идёт вдоль латеральной стенки орбиты."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "superior-rectus",
      "kind": "muscle",
      "names": {
        "ru": "Верхняя прямая мышца глаза",
        "latin": "musculus rectus superior",
        "modelAliases": [
          "superior rectus"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Общее сухожильное кольцо (annulus of Zinn)."
        ],
        "insertionRu": [
          "Верхняя поверхность склеры кпереди от экватора."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Основное действие — поднимает глазное яблоко.",
          "Также участвует в инторсии и приведении."
        ],
        "innervationRu": "Глазодвигательный нерв (III), верхняя ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Лежит под мышцей, поднимающей верхнее веко; её действие зависит от положения глаза."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "inferior-rectus",
      "kind": "muscle",
      "names": {
        "ru": "Нижняя прямая мышца глаза",
        "latin": "musculus rectus inferior",
        "modelAliases": [
          "inferior rectus"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Общее сухожильное кольцо (annulus of Zinn)."
        ],
        "insertionRu": [
          "Нижняя поверхность склеры кпереди от экватора."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Основное действие — опускает глазное яблоко.",
          "Также участвует в эксторсии и приведении."
        ],
        "innervationRu": "Глазодвигательный нерв (III), нижняя ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Лежит над дном орбиты; через фасциальные связи участвует и в согласованном движении нижнего века."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "superior-oblique-eye",
      "kind": "muscle",
      "names": {
        "ru": "Верхняя косая мышца глаза",
        "latin": "musculus obliquus superior",
        "modelAliases": [
          "superior oblique"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Тело клиновидной кости в заднемедиальной части орбиты, медиальнее зрительного канала."
        ],
        "insertionRu": [
          "После прохождения сухожилия через блок (trochlea) — задневерхнелатеральная поверхность склеры."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Основное действие — инторсия.",
          "Также участвует в опускании и отведении глазного яблока."
        ],
        "innervationRu": "Блоковый нерв (IV)."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Сухожилие меняет направление в блоке на верхнемедиальном крае орбиты; поэтому направление мышечного брюшка не совпадает с направлением конечной тяги."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "inferior-oblique-eye",
      "kind": "muscle",
      "names": {
        "ru": "Нижняя косая мышца глаза",
        "latin": "musculus obliquus inferior",
        "modelAliases": [
          "inferior oblique"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Переднемедиальная часть дна орбиты на верхней челюсти, латеральнее носослёзного канала."
        ],
        "insertionRu": [
          "Заднелатеральная нижняя поверхность склеры."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Основное действие — эксторсия.",
          "Также участвует в подъёме и отведении глазного яблока."
        ],
        "innervationRu": "Глазодвигательный нерв (III), нижняя ветвь."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Единственная из шести мышц, вращающих глазное яблоко, которая начинается в передней части орбиты, а не у её вершины."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "levator-palpebrae-superioris",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, поднимающая верхнее веко",
        "latin": "musculus levator palpebrae superioris",
        "modelAliases": [
          "levator palpebrae superioris"
        ]
      },
      "layer": "orbital-extraocular",
      "subregions": [
        "orbit"
      ],
      "anatomy": {
        "originRu": [
          "Малое крыло клиновидной кости над зрительным каналом."
        ],
        "insertionRu": [
          "Через апоневроз — верхняя тарзальная пластинка и кожа верхнего века.",
          "Гладкая верхняя тарзальная мышца функционально связана с этим аппаратом, но является отдельной структурой."
        ],
        "fiberDirectionRu": "Волокна ориентированы вдоль оси мышцы от костных/фасциальных структур орбиты к глазному яблоку или верхнему веку.",
        "actionsRu": [
          "Поднимает и удерживает верхнее веко."
        ],
        "innervationRu": "Глазодвигательный нерв (III), верхняя ветвь; гладкая верхняя тарзальная мышца получает симпатическую иннервацию."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Глазница",
          "глазное яблоко"
        ],
        "relationsRu": [
          "Располагается над верхней прямой мышцей; не вращает глазное яблоко и потому функционально отличается от шести глазодвигательных мышц."
        ]
      },
      "movementCueRu": "Функцию изучают по направлению движения глазного яблока или верхнего века; эти мышцы не являются поверхностными пальпаторными структурами.",
      "sources": [
        {
          "sourceId": "ncbi-extraocular-muscles",
          "locator": "Muscles; Nerves",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-extraocular-actions",
          "locator": "Table 1",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    }
  ]
});
export const ORBIT_STRUCTURE_COUNT = ORBIT_REGION.structures.length;
export function orbitStructureById(id) {
  return ORBIT_REGION.structures.find((item) => item.id === id) || null;
}
