function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const UPPER_LIMB_REGION = deepFreeze({
  "id": "upper-limb",
  "nameRu": "Плечо, предплечье и кисть",
  "status": "verified-v1",
  "scopeRu": "Мышцы плеча, предплечья и собственные мышцы кисти. Мышцы плечевого пояса и вращательной манжеты хранятся в разделе «Спина и плечевой пояс» и подключаются как связанные структуры.",
  "relatedStructureIds": [
    "deltoid",
    "supraspinatus",
    "infraspinatus",
    "teres-minor",
    "subscapularis",
    "teres-major",
    "pectoralis-major",
    "latissimus-dorsi"
  ],
  "teachingPrinciplesRu": [
    "Показывать предплечье по компартментам и слоям: передний поверхностный, промежуточный, глубокий; задний поверхностный и глубокий.",
    "Связывать длинные мышцы предплечья с сухожилиями на запястье и кисти: это помогает понять, почему мышечное брюшко и место движения разделены расстоянием.",
    "Для кисти сначала давать тенар, гипотенар, межкостные и червеобразные как функциональные группы, затем отдельные мышцы там, где они меняют понимание движения.",
    "Иннервацию использовать как справочный слой, не превращая её в обязательное заучивание без учебной задачи.",
    "Не использовать видимое сокращение отдельной мышцы как доказательство причины боли или нарушения функции."
  ],
  "structures": [
    {
      "id": "coracobrachialis",
      "kind": "muscle",
      "names": {
        "ru": "Клювовидно-плечевая мышца",
        "latin": "musculus coracobrachialis",
        "modelAliases": [
          "coracobrachialis"
        ]
      },
      "subregions": [
        "anterior-arm",
        "axillary-region"
      ],
      "layer": "anterior-arm-deep",
      "anatomy": {
        "originRu": [
          "Клювовидный отросток лопатки общим началом с короткой головкой двуглавой мышцы плеча."
        ],
        "insertionRu": [
          "Средняя треть медиальной поверхности плечевой кости."
        ],
        "fiberDirectionRu": "Пучки идут вниз и латерально от клювовидного отростка к плечевой кости.",
        "actionsRu": [
          "Сгибает плечо.",
          "Слабо приводит плечо и помогает стабилизировать головку плечевой кости."
        ],
        "innervationRu": "Мышечно-кожный нерв, преимущественно C5–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Клювовидный отросток",
          "медиальная поверхность плеча"
        ],
        "relationsRu": [
          "Лежит глубже короткой головки двуглавой мышцы; мышечно-кожный нерв обычно прободает мышцу."
        ]
      },
      "movementCueRu": "Сгибание и приведение плеча показывают направление тяги, но отдельная поверхностная пальпация ограничена.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, клювовидно-плечевая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-arm-muscles",
          "locator": "Arm muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "brachialis",
      "kind": "muscle",
      "names": {
        "ru": "Плечевая мышца",
        "latin": "musculus brachialis",
        "modelAliases": [
          "brachialis"
        ]
      },
      "subregions": [
        "anterior-arm",
        "elbow"
      ],
      "layer": "anterior-arm-deep",
      "anatomy": {
        "originRu": [
          "Передняя поверхность дистальной половины плечевой кости.",
          "Межмышечные перегородки плеча."
        ],
        "insertionRu": [
          "Бугристость локтевой кости.",
          "Венечный отросток локтевой кости."
        ],
        "fiberDirectionRu": "Пучки идут вниз к проксимальной локтевой кости.",
        "actionsRu": [
          "Основной сгибатель предплечья в локтевом суставе независимо от положения пронации/супинации."
        ],
        "innervationRu": "Преимущественно мышечно-кожный нерв C5–C6; латеральная часть нередко получает ветвь лучевого нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Дистальная передняя поверхность плеча",
          "венечный отросток",
          "локтевая бугристость"
        ],
        "relationsRu": [
          "Большая часть лежит глубже двуглавой мышцы; дистально часть мышцы доступна по сторонам сухожилия бицепса."
        ]
      },
      "movementCueRu": "Сгибание локтя показывает функцию; нейтральное положение предплечья не выключает мышцу.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, плечевая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-arm-muscles",
          "locator": "Arm muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-dual-innervation"
      }
    },
    {
      "id": "biceps-brachii",
      "kind": "muscle",
      "names": {
        "ru": "Двуглавая мышца плеча",
        "latin": "musculus biceps brachii",
        "modelAliases": [
          "biceps brachii",
          "biceps"
        ]
      },
      "subregions": [
        "anterior-arm",
        "elbow",
        "shoulder"
      ],
      "layer": "anterior-arm-superficial",
      "anatomy": {
        "originRu": [
          "Длинная головка — надсуставной бугорок лопатки и верхняя губа суставной впадины.",
          "Короткая головка — клювовидный отросток лопатки."
        ],
        "insertionRu": [
          "Бугристость лучевой кости.",
          "Через апоневроз двуглавой мышцы — фасция медиальной части предплечья."
        ],
        "fiberDirectionRu": "Две головки сходятся в общее мышечное брюшко и дистальное сухожилие.",
        "actionsRu": [
          "Супинирует предплечье, особенно при согнутом локте.",
          "Сгибает предплечье в локтевом суставе.",
          "Слабо участвует в сгибании плеча."
        ],
        "innervationRu": "Мышечно-кожный нерв, C5–C6."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Клювовидный отросток",
          "межбугорковая борозда",
          "локтевая ямка",
          "бугристость лучевой кости"
        ],
        "relationsRu": [
          "Длинное сухожилие проходит через плечевой сустав и межбугорковую борозду; дистальный апоневроз лежит поверх плечевой артерии и срединного нерва в локтевой области."
        ]
      },
      "movementCueRu": "Супинация против лёгкого сопротивления и сгибание локтя делают функцию мышцы очевидной.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, двуглавая мышца плеча",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-biceps",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Musculocutaneous nerve",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "triceps-brachii",
      "kind": "muscle",
      "names": {
        "ru": "Трёхглавая мышца плеча",
        "latin": "musculus triceps brachii",
        "modelAliases": [
          "triceps brachii",
          "triceps"
        ]
      },
      "subregions": [
        "posterior-arm",
        "elbow",
        "shoulder"
      ],
      "layer": "posterior-arm-superficial",
      "anatomy": {
        "originRu": [
          "Длинная головка — подсуставной бугорок лопатки.",
          "Латеральная головка — задняя поверхность плечевой кости выше борозды лучевого нерва.",
          "Медиальная головка — задняя поверхность плечевой кости ниже борозды лучевого нерва."
        ],
        "insertionRu": [
          "Локтевой отросток локтевой кости и фасция предплечья."
        ],
        "fiberDirectionRu": "Три головки сходятся к общему сухожилию на локтевом отростке.",
        "actionsRu": [
          "Разгибает предплечье в локтевом суставе.",
          "Длинная головка также участвует в разгибании и приведении плеча."
        ],
        "innervationRu": "Лучевой нерв, преимущественно C6–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Задняя поверхность плеча",
          "локтевой отросток",
          "подсуставной бугорок"
        ],
        "relationsRu": [
          "Лучевой нерв и глубокая артерия плеча проходят в борозде между головками на задней поверхности плечевой кости."
        ]
      },
      "movementCueRu": "Разгибание локтя показывает общую функцию трёх головок.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, трёхглавая мышца плеча",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-arm-muscles",
          "locator": "Arm muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "anconeus",
      "kind": "muscle",
      "names": {
        "ru": "Локтевая мышца",
        "latin": "musculus anconeus",
        "modelAliases": [
          "anconeus"
        ]
      },
      "subregions": [
        "posterolateral-elbow"
      ],
      "layer": "posterior-elbow-superficial",
      "anatomy": {
        "originRu": [
          "Латеральный надмыщелок плечевой кости."
        ],
        "insertionRu": [
          "Латеральная поверхность локтевого отростка.",
          "Проксимальная задняя поверхность локтевой кости."
        ],
        "fiberDirectionRu": "Короткие веерообразные волокна идут вниз и медиально.",
        "actionsRu": [
          "Помогает разгибанию предплечья.",
          "Стабилизирует локтевой сустав; участвует в небольшом отведении локтевой кости при пронации."
        ],
        "innervationRu": "Лучевой нерв, преимущественно C7–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелок",
          "локтевой отросток"
        ],
        "relationsRu": [
          "Небольшая поверхностная мышца заднелатеральной области локтя, функционально связанная с трицепсом."
        ]
      },
      "movementCueRu": "Лёгкое разгибание локтя помогает увидеть область мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, локтевая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-arm-muscles",
          "locator": "Arm muscles",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "brachioradialis",
      "kind": "muscle",
      "names": {
        "ru": "Плечелучевая мышца",
        "latin": "musculus brachioradialis",
        "modelAliases": [
          "brachioradialis"
        ]
      },
      "subregions": [
        "lateral-forearm",
        "elbow"
      ],
      "layer": "posterior-superficial-lateral",
      "anatomy": {
        "originRu": [
          "Проксимальные две трети латерального надмыщелкового гребня плечевой кости."
        ],
        "insertionRu": [
          "Латеральная поверхность дистального конца лучевой кости около шиловидного отростка."
        ],
        "fiberDirectionRu": "Длинные волокна идут вдоль латерального края предплечья.",
        "actionsRu": [
          "Сгибает предплечье, особенно из среднего положения между пронацией и супинацией.",
          "Помогает возвращать предплечье к нейтральному положению из крайней пронации или супинации."
        ],
        "innervationRu": "Лучевой нерв, преимущественно C5–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелковый гребень",
          "латеральный край локтевой ямки",
          "шиловидный отросток лучевой кости"
        ],
        "relationsRu": [
          "Формирует латеральный контур предплечья и латеральную границу локтевой ямки."
        ]
      },
      "movementCueRu": "Сгибание локтя при положении большого пальца вверх подчёркивает мышцу.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, плечелучевая мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "pronator-teres",
      "kind": "muscle",
      "names": {
        "ru": "Круглый пронатор",
        "latin": "musculus pronator teres",
        "modelAliases": [
          "pronator teres"
        ]
      },
      "subregions": [
        "proximal-anterior-forearm"
      ],
      "layer": "anterior-superficial",
      "anatomy": {
        "originRu": [
          "Плечевая головка — медиальный надмыщелок плечевой кости.",
          "Локтевая головка — венечный отросток локтевой кости."
        ],
        "insertionRu": [
          "Латеральная поверхность средней трети лучевой кости."
        ],
        "fiberDirectionRu": "Пучки идут косо вниз и латерально.",
        "actionsRu": [
          "Пронирует предплечье.",
          "Слабо помогает сгибанию локтя."
        ],
        "innervationRu": "Срединный нерв, C6–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальный надмыщелок",
          "локтевая ямка",
          "средняя треть лучевой кости"
        ],
        "relationsRu": [
          "Срединный нерв обычно проходит между двумя головками мышцы."
        ]
      },
      "movementCueRu": "Пронация предплечья помогает связать косое направление волокон с действием.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, круглый пронатор",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-carpi-radialis",
      "kind": "muscle",
      "names": {
        "ru": "Лучевой сгибатель запястья",
        "latin": "musculus flexor carpi radialis",
        "modelAliases": [
          "flexor carpi radialis"
        ]
      },
      "subregions": [
        "anterior-forearm",
        "wrist"
      ],
      "layer": "anterior-superficial",
      "anatomy": {
        "originRu": [
          "Общее сухожилие сгибателей на медиальном надмыщелке плечевой кости."
        ],
        "insertionRu": [
          "Ладонная поверхность основания II пястной кости, нередко с небольшим пучком к III."
        ],
        "fiberDirectionRu": "Пучки переходят в длинное сухожилие, направленное к лучевой стороне кисти.",
        "actionsRu": [
          "Сгибает кисть.",
          "Отводит кисть в лучевую сторону."
        ],
        "innervationRu": "Срединный нерв, C6–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальный надмыщелок",
          "лучевая сторона запястья",
          "основание II пястной кости"
        ],
        "relationsRu": [
          "Сухожилие заметно на передней поверхности запястья при сгибании и лучевом отведении."
        ]
      },
      "movementCueRu": "Сгибание кисти с лучевым отведением подчёркивает сухожилие.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, лучевой сгибатель запястья",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "palmaris-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинная ладонная мышца",
        "latin": "musculus palmaris longus",
        "modelAliases": [
          "palmaris longus"
        ]
      },
      "subregions": [
        "anterior-forearm",
        "palm"
      ],
      "layer": "anterior-superficial-variable",
      "anatomy": {
        "originRu": [
          "Общее сухожилие сгибателей на медиальном надмыщелке плечевой кости."
        ],
        "insertionRu": [
          "Удерживатель сгибателей.",
          "Ладонный апоневроз."
        ],
        "fiberDirectionRu": "Небольшое проксимальное брюшко переходит в длинное поверхностное сухожилие.",
        "actionsRu": [
          "Слабо сгибает кисть.",
          "Натягивает ладонный апоневроз."
        ],
        "innervationRu": "Срединный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность запястья",
          "ладонный апоневроз"
        ],
        "relationsRu": [
          "Мышца часто отсутствует с одной или обеих сторон; отсутствие является нормальным анатомическим вариантом."
        ]
      },
      "movementCueRu": "Сведение большого пальца и мизинца с лёгким сгибанием кисти может проявить сухожилие, если мышца присутствует.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, длинная ладонная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable"
      }
    },
    {
      "id": "flexor-carpi-ulnaris",
      "kind": "muscle",
      "names": {
        "ru": "Локтевой сгибатель запястья",
        "latin": "musculus flexor carpi ulnaris",
        "modelAliases": [
          "flexor carpi ulnaris"
        ]
      },
      "subregions": [
        "anterior-medial-forearm",
        "wrist"
      ],
      "layer": "anterior-superficial",
      "anatomy": {
        "originRu": [
          "Плечевая головка — медиальный надмыщелок.",
          "Локтевая головка — локтевой отросток и задний край локтевой кости."
        ],
        "insertionRu": [
          "Гороховидная кость.",
          "Через гороховидно-крючковидную и гороховидно-пястную связки — крючок крючковидной и основание V пястной кости."
        ],
        "fiberDirectionRu": "Волокна идут вдоль локтевого края предплечья к гороховидной кости.",
        "actionsRu": [
          "Сгибает кисть.",
          "Приводит кисть в локтевую сторону."
        ],
        "innervationRu": "Локтевой нерв, C7–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Медиальный надмыщелок",
          "локтевой край предплечья",
          "гороховидная кость"
        ],
        "relationsRu": [
          "Локтевой нерв проходит глубоко между головками мышцы в проксимальном отделе."
        ]
      },
      "movementCueRu": "Сгибание кисти с локтевым отведением подчёркивает мышцу.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, локтевой сгибатель запястья",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-digitorum-superficialis",
      "kind": "muscle",
      "names": {
        "ru": "Поверхностный сгибатель пальцев",
        "latin": "musculus flexor digitorum superficialis",
        "modelAliases": [
          "flexor digitorum superficialis"
        ]
      },
      "subregions": [
        "anterior-forearm",
        "fingers"
      ],
      "layer": "anterior-intermediate",
      "anatomy": {
        "originRu": [
          "Плечелоктевая головка — медиальный надмыщелок и венечный отросток.",
          "Лучевая головка — передний край проксимальной части лучевой кости."
        ],
        "insertionRu": [
          "Боковые поверхности средних фаланг II–V пальцев."
        ],
        "fiberDirectionRu": "Мышца делится на четыре сухожилия, проходящие через запястный канал к пальцам.",
        "actionsRu": [
          "Сгибает проксимальные межфаланговые суставы II–V пальцев.",
          "Также помогает сгибанию пястно-фаланговых суставов и кисти."
        ],
        "innervationRu": "Срединный нерв, C7–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Передняя поверхность предплечья",
          "запястный канал",
          "средние фаланги II–V"
        ],
        "relationsRu": [
          "Лежит глубже поверхностной группы и поверхностнее глубоких сгибателей."
        ]
      },
      "movementCueRu": "Сгибание проксимального межфалангового сустава отдельного пальца при контроле соседних пальцев помогает понять основную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, поверхностный сгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-digitorum-profundus",
      "kind": "muscle",
      "names": {
        "ru": "Глубокий сгибатель пальцев",
        "latin": "musculus flexor digitorum profundus",
        "modelAliases": [
          "flexor digitorum profundus"
        ]
      },
      "subregions": [
        "deep-anterior-forearm",
        "fingers"
      ],
      "layer": "anterior-deep",
      "anatomy": {
        "originRu": [
          "Проксимальные три четверти передней и медиальной поверхности локтевой кости.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Основания дистальных фаланг II–V пальцев."
        ],
        "fiberDirectionRu": "Четыре сухожилия проходят глубоко через запястный канал к дистальным фалангам.",
        "actionsRu": [
          "Сгибает дистальные межфаланговые суставы II–V пальцев.",
          "Помогает сгибанию проксимальных межфаланговых и пястно-фаланговых суставов, а также кисти."
        ],
        "innervationRu": "Латеральная половина (II–III пальцы) — передний межкостный нерв от срединного; медиальная половина (IV–V) — локтевой нерв."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Локтевая кость",
          "запястный канал",
          "дистальные фаланги II–V"
        ],
        "relationsRu": [
          "Глубокий слой; сухожилия дают начало червеобразным мышцам кисти."
        ]
      },
      "movementCueRu": "Сгибание дистального межфалангового сустава при фиксации средней фаланги показывает специфическую функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, глубокий сгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-dual-innervation"
      }
    },
    {
      "id": "flexor-pollicis-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинный сгибатель большого пальца",
        "latin": "musculus flexor pollicis longus",
        "modelAliases": [
          "flexor pollicis longus"
        ]
      },
      "subregions": [
        "deep-anterior-forearm",
        "thumb"
      ],
      "layer": "anterior-deep",
      "anatomy": {
        "originRu": [
          "Передняя поверхность лучевой кости.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Основание дистальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "Длинное сухожилие проходит через запястный канал к большому пальцу.",
        "actionsRu": [
          "Сгибает межфаланговый сустав большого пальца.",
          "Помогает сгибать большой палец также в пястно-фаланговом и запястно-пястном суставах."
        ],
        "innervationRu": "Передний межкостный нерв от срединного нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лучевая кость",
          "запястный канал",
          "дистальная фаланга большого пальца"
        ],
        "relationsRu": [
          "Глубокая мышца переднего отдела предплечья."
        ]
      },
      "movementCueRu": "Сгибание концевой фаланги большого пальца показывает основную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, длинный сгибатель большого пальца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "pronator-quadratus",
      "kind": "muscle",
      "names": {
        "ru": "Квадратный пронатор",
        "latin": "musculus pronator quadratus",
        "modelAliases": [
          "pronator quadratus"
        ]
      },
      "subregions": [
        "distal-anterior-forearm"
      ],
      "layer": "anterior-deep",
      "anatomy": {
        "originRu": [
          "Дистальная четверть передней поверхности локтевой кости."
        ],
        "insertionRu": [
          "Дистальная четверть передней поверхности лучевой кости."
        ],
        "fiberDirectionRu": "Короткие поперечные волокна соединяют дистальные отделы локтевой и лучевой костей.",
        "actionsRu": [
          "Пронирует предплечье.",
          "Стабилизирует дистальный лучелоктевой сустав."
        ],
        "innervationRu": "Передний межкостный нерв от срединного нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Дистальные отделы лучевой и локтевой костей"
        ],
        "relationsRu": [
          "Самая глубокая мышца передней поверхности дистального предплечья; покрыта сухожилиями сгибателей."
        ]
      },
      "movementCueRu": "Искать в самом глубоком слое дистального предплечья между локтевой и лучевой костями; с поверхности мышца не изолируется.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, квадратный пронатор",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-carpi-radialis-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинный лучевой разгибатель запястья",
        "latin": "musculus extensor carpi radialis longus",
        "modelAliases": [
          "extensor carpi radialis longus"
        ]
      },
      "subregions": [
        "posterolateral-forearm",
        "wrist"
      ],
      "layer": "posterior-superficial",
      "anatomy": {
        "originRu": [
          "Дистальная треть латерального надмыщелкового гребня плечевой кости."
        ],
        "insertionRu": [
          "Тыльная поверхность основания II пястной кости."
        ],
        "fiberDirectionRu": "Пучки переходят в длинное сухожилие на лучевой стороне задней поверхности предплечья.",
        "actionsRu": [
          "Разгибает кисть.",
          "Отводит кисть в лучевую сторону."
        ],
        "innervationRu": "Лучевой нерв, C6–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелковый гребень",
          "лучевая сторона запястья",
          "основание II пястной"
        ],
        "relationsRu": [
          "Лежит рядом с плечелучевой мышцей; сухожилие проходит под удерживателем разгибателей."
        ]
      },
      "movementCueRu": "Разгибание кисти с лучевым отведением показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, длинный лучевой разгибатель запястья",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-carpi-radialis-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткий лучевой разгибатель запястья",
        "latin": "musculus extensor carpi radialis brevis",
        "modelAliases": [
          "extensor carpi radialis brevis"
        ]
      },
      "subregions": [
        "posterior-forearm",
        "wrist"
      ],
      "layer": "posterior-superficial",
      "anatomy": {
        "originRu": [
          "Общее сухожилие разгибателей на латеральном надмыщелке плечевой кости."
        ],
        "insertionRu": [
          "Тыльная поверхность основания III пястной кости."
        ],
        "fiberDirectionRu": "Пучки идут дистально к лучевой стороне тыла кисти.",
        "actionsRu": [
          "Разгибает кисть.",
          "Отводит кисть в лучевую сторону; важен для стабилизации кисти при хвате."
        ],
        "innervationRu": "Глубокая ветвь лучевого нерва, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелок",
          "основание III пястной"
        ],
        "relationsRu": [
          "Лежит глубже/медиальнее длинного лучевого разгибателя; сухожилие проходит под удерживателем разгибателей."
        ]
      },
      "movementCueRu": "Разгибание кисти при хвате показывает стабилизирующую роль мышцы.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, короткий лучевой разгибатель запястья",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-digitorum",
      "kind": "muscle",
      "names": {
        "ru": "Разгибатель пальцев",
        "latin": "musculus extensor digitorum",
        "modelAliases": [
          "extensor digitorum",
          "extensor digitorum communis"
        ]
      },
      "subregions": [
        "posterior-forearm",
        "fingers"
      ],
      "layer": "posterior-superficial",
      "anatomy": {
        "originRu": [
          "Общее сухожилие разгибателей на латеральном надмыщелке плечевой кости."
        ],
        "insertionRu": [
          "Разгибательные аппараты II–V пальцев."
        ],
        "fiberDirectionRu": "Общее мышечное брюшко переходит в четыре сухожилия к тылу пальцев.",
        "actionsRu": [
          "Разгибает II–V пальцы преимущественно в пястно-фаланговый суставах и через разгибательный аппарат участвует в разгибании межфаланговых суставов.",
          "Помогает разгибанию кисти."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелок",
          "тыл предплечья",
          "тыл кисти"
        ],
        "relationsRu": [
          "Сухожилия соединяются межсухожильными перемычками на тыле кисти."
        ]
      },
      "movementCueRu": "Разгибание пальцев показывает общий сухожильный рельеф, но независимость отдельных пальцев ограничена.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, разгибатель пальцев",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      },
      "illustrations": [
        {
          "sourceId": "gray-forearm-extensors-public-domain",
          "rightsStatus": "public-domain",
          "purpose": "candidate-for-local-copy"
        }
      ]
    },
    {
      "id": "extensor-digiti-minimi",
      "kind": "muscle",
      "names": {
        "ru": "Разгибатель мизинца",
        "latin": "musculus extensor digiti minimi",
        "modelAliases": [
          "extensor digiti minimi"
        ]
      },
      "subregions": [
        "posterior-forearm",
        "little-finger"
      ],
      "layer": "posterior-superficial",
      "anatomy": {
        "originRu": [
          "Общее сухожилие разгибателей на латеральном надмыщелке."
        ],
        "insertionRu": [
          "Разгибательный аппарат V пальца."
        ],
        "fiberDirectionRu": "Тонкое сухожилие проходит отдельно под удерживателем разгибателей.",
        "actionsRu": [
          "Разгибает мизинец и помогает разгибанию кисти."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелок",
          "тыл мизинца"
        ],
        "relationsRu": [
          "Небольшая мышца между разгибателем пальцев и локтевым разгибателем запястья."
        ]
      },
      "movementCueRu": "Изолированное разгибание мизинца показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, разгибатель мизинца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-carpi-ulnaris",
      "kind": "muscle",
      "names": {
        "ru": "Локтевой разгибатель запястья",
        "latin": "musculus extensor carpi ulnaris",
        "modelAliases": [
          "extensor carpi ulnaris"
        ]
      },
      "subregions": [
        "posterior-ulnar-forearm",
        "wrist"
      ],
      "layer": "posterior-superficial",
      "anatomy": {
        "originRu": [
          "Общее сухожилие разгибателей на латеральном надмыщелке.",
          "Задний край локтевой кости."
        ],
        "insertionRu": [
          "Тыльная поверхность основания V пястной кости."
        ],
        "fiberDirectionRu": "Волокна идут вдоль локтевого края задней поверхности предплечья.",
        "actionsRu": [
          "Разгибает кисть.",
          "Приводит кисть в локтевую сторону."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Локтевой край предплечья",
          "головка локтевой кости",
          "основание V пястной"
        ],
        "relationsRu": [
          "Сухожилие проходит в отдельном канале удерживателя разгибателей у головки локтевой кости."
        ]
      },
      "movementCueRu": "Разгибание кисти с локтевым отведением подчёркивает сухожилие.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, локтевой разгибатель запястья",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "supinator",
      "kind": "muscle",
      "names": {
        "ru": "Супинатор",
        "latin": "musculus supinator",
        "modelAliases": [
          "supinator"
        ]
      },
      "subregions": [
        "proximal-posterolateral-forearm"
      ],
      "layer": "posterior-deep",
      "anatomy": {
        "originRu": [
          "Латеральный надмыщелок плечевой кости.",
          "Лучевая коллатеральная и кольцевая связки.",
          "Гребень супинатора локтевой кости."
        ],
        "insertionRu": [
          "Проксимальная треть лучевой кости на латеральной, задней и передней поверхностях."
        ],
        "fiberDirectionRu": "Пучки оборачиваются вокруг проксимальной лучевой кости.",
        "actionsRu": [
          "Супинирует предплечье, особенно при небольшом внешнем сопротивлении."
        ],
        "innervationRu": "Глубокая ветвь лучевого нерва, C6–C7."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Латеральный надмыщелок",
          "головка лучевой кости"
        ],
        "relationsRu": [
          "Глубокая ветвь лучевого нерва проходит между слоями мышцы и после выхода продолжается как задний межкостный нерв."
        ]
      },
      "movementCueRu": "Супинация без сильного сопротивления показывает действие группы; мышца лежит глубоко.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, супинатор",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "abductor-pollicis-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинная мышца, отводящая большой палец кисти",
        "latin": "musculus abductor pollicis longus",
        "modelAliases": [
          "abductor pollicis longus"
        ]
      },
      "subregions": [
        "deep-posterior-forearm",
        "thumb"
      ],
      "layer": "posterior-deep",
      "anatomy": {
        "originRu": [
          "Задние поверхности лучевой и локтевой костей.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Основание I пястной кости."
        ],
        "fiberDirectionRu": "Сухожилие идёт косо к лучевой стороне запястья и проходит в I тыльном канале.",
        "actionsRu": [
          "Отводит большой палец в запястно-пястном суставе.",
          "Помогает разгибанию большого пальца и лучевому отведению кисти."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лучевая сторона запястья",
          "анатомическая табакерка"
        ],
        "relationsRu": [
          "Вместе с коротким разгибателем большого пальца формирует переднюю границу анатомической табакерки."
        ]
      },
      "movementCueRu": "Отведение большого пальца проявляет сухожилие на лучевой стороне запястья.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, длинная мышца, отводящая большой палец кисти",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-pollicis-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткий разгибатель большого пальца",
        "latin": "musculus extensor pollicis brevis",
        "modelAliases": [
          "extensor pollicis brevis"
        ]
      },
      "subregions": [
        "deep-posterior-forearm",
        "thumb"
      ],
      "layer": "posterior-deep",
      "anatomy": {
        "originRu": [
          "Задняя поверхность лучевой кости.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Основание проксимальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "Сухожилие идёт вместе с APL через I тыльный канал.",
        "actionsRu": [
          "Разгибает пястно-фаланговый сустав большого пальца и помогает разгибанию запястно-пястного сустава."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Лучевая сторона запястья",
          "анатомическая табакерка"
        ],
        "relationsRu": [
          "Вместе с APL формирует переднюю границу анатомической табакерки."
        ]
      },
      "movementCueRu": "Разгибание большого пальца в пястно-фаланговом суставе помогает различить сухожильный ход.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, короткий разгибатель большого пальца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-pollicis-longus",
      "kind": "muscle",
      "names": {
        "ru": "Длинный разгибатель большого пальца",
        "latin": "musculus extensor pollicis longus",
        "modelAliases": [
          "extensor pollicis longus"
        ]
      },
      "subregions": [
        "deep-posterior-forearm",
        "thumb"
      ],
      "layer": "posterior-deep",
      "anatomy": {
        "originRu": [
          "Задняя поверхность локтевой кости.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Основание дистальной фаланги большого пальца."
        ],
        "fiberDirectionRu": "Сухожилие огибает бугорок Листера и идёт к тылу большого пальца.",
        "actionsRu": [
          "Разгибает межфаланговый сустав большого пальца.",
          "Также участвует в разгибании большого пальца в пястно-фаланговом и запястно-пястном суставах."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Бугорок Листера",
          "анатомическая табакерка",
          "дистальная фаланга большого пальца"
        ],
        "relationsRu": [
          "Формирует заднюю границу анатомической табакерки."
        ]
      },
      "movementCueRu": "Разгибание концевой фаланги большого пальца подчёркивает сухожилие.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, длинный разгибатель большого пальца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "extensor-indicis",
      "kind": "muscle",
      "names": {
        "ru": "Разгибатель указательного пальца",
        "latin": "musculus extensor indicis",
        "modelAliases": [
          "extensor indicis"
        ]
      },
      "subregions": [
        "deep-posterior-forearm",
        "index-finger"
      ],
      "layer": "posterior-deep",
      "anatomy": {
        "originRu": [
          "Задняя поверхность дистальной части локтевой кости.",
          "Межкостная перепонка."
        ],
        "insertionRu": [
          "Разгибательный аппарат II пальца."
        ],
        "fiberDirectionRu": "Сухожилие проходит в IV тыльном канале рядом с сухожилиями разгибателя пальцев.",
        "actionsRu": [
          "Обеспечивает дополнительное независимое разгибание указательного пальца."
        ],
        "innervationRu": "Задний межкостный нерв, C7–C8."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Тыл предплечья",
          "тыл указательного пальца"
        ],
        "relationsRu": [
          "Глубокая мышца; её сухожилие присоединяется к разгибательному аппарату указательного пальца."
        ]
      },
      "movementCueRu": "Отдельное разгибание указательного пальца показывает функциональную роль.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, разгибатель указательного пальца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-forearm-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-upper-limb-nerves",
          "locator": "Muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "abductor-pollicis-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткая мышца, отводящая большой палец кисти",
        "latin": "musculus abductor pollicis brevis",
        "modelAliases": [
          "abductor pollicis brevis"
        ]
      },
      "subregions": [
        "thenar"
      ],
      "layer": "intrinsic-hand-superficial",
      "anatomy": {
        "originRu": [
          "Удерживатель сгибателей.",
          "Бугорки ладьевидной и трапециевидной костей."
        ],
        "insertionRu": [
          "Латеральная сторона основания проксимальной фаланги большого пальца и разгибательный аппарат."
        ],
        "fiberDirectionRu": "Короткие пучки идут дистально вдоль лучевой стороны тенара.",
        "actionsRu": [
          "Отводит большой палец перпендикулярно плоскости ладони.",
          "Участвует в оппозиции."
        ],
        "innervationRu": "Возвратная ветвь срединного нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Возвышение большого пальца",
          "ладьевидная и трапециевидная кости"
        ],
        "relationsRu": [
          "Поверхностная мышца тенара."
        ]
      },
      "movementCueRu": "Отведение большого пальца от плоскости ладони делает тенар заметным.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — короткая мышца, отводящая большой палец",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "opponens-pollicis",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, противопоставляющая большой палец кисти",
        "latin": "musculus opponens pollicis",
        "modelAliases": [
          "opponens pollicis"
        ]
      },
      "subregions": [
        "thenar"
      ],
      "layer": "intrinsic-hand-deep",
      "anatomy": {
        "originRu": [
          "Удерживатель сгибателей.",
          "Бугорок трапециевидной кости."
        ],
        "insertionRu": [
          "Латеральный край и передняя поверхность I пястной кости."
        ],
        "fiberDirectionRu": "Пучки идут вдоль I пястной кости.",
        "actionsRu": [
          "Противопоставляет большой палец: сгибает и медиально вращает I пястную кость в запястно-пястном суставе."
        ],
        "innervationRu": "Возвратная ветвь срединного нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Возвышение большого пальца",
          "I пястная кость"
        ],
        "relationsRu": [
          "Лежит глубже короткой мышцы, отводящей большой палец."
        ]
      },
      "movementCueRu": "Оппозиция большого пальца к мизинцу показывает комплексное движение запястно-пястного сустава.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — мышца, противопоставляющая большой палец",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-pollicis-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткий сгибатель большого пальца",
        "latin": "musculus flexor pollicis brevis",
        "modelAliases": [
          "flexor pollicis brevis"
        ]
      },
      "subregions": [
        "thenar"
      ],
      "layer": "intrinsic-hand",
      "anatomy": {
        "originRu": [
          "Поверхностная головка — удерживатель сгибателей и трапециевидная кость.",
          "Глубокая головка — соседние кости запястья; описание варьирует между источниками."
        ],
        "insertionRu": [
          "Латеральная сторона основания проксимальной фаланги большого пальца через сесамовидную кость."
        ],
        "fiberDirectionRu": "Пучки идут дистально к пястно-фаланговый суставу большого пальца.",
        "actionsRu": [
          "Сгибает большой палец преимущественно в пястно-фаланговом суставе.",
          "Участвует в оппозиции."
        ],
        "innervationRu": "Поверхностная головка обычно — возвратная ветвь срединного нерва; глубокая часто — глубокая ветвь локтевого нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Тенар",
          "пястно-фаланговый сустав большого пальца"
        ],
        "relationsRu": [
          "Одна из мышц тенара с вариабельной двойной иннервацией."
        ]
      },
      "movementCueRu": "Сгибание большого пальца в пястно-фаланговом суставе показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — короткий сгибатель большого пальца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-variable"
      }
    },
    {
      "id": "adductor-pollicis",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, приводящая большой палец кисти",
        "latin": "musculus adductor pollicis",
        "modelAliases": [
          "adductor pollicis"
        ]
      },
      "subregions": [
        "deep-palm",
        "thumb"
      ],
      "layer": "intrinsic-hand-deep",
      "anatomy": {
        "originRu": [
          "Косая головка — головчатая кость и основания II–III пястных костей.",
          "Поперечная головка — передняя поверхность III пястной кости."
        ],
        "insertionRu": [
          "Медиальная сторона основания проксимальной фаланги большого пальца и разгибательный аппарат."
        ],
        "fiberDirectionRu": "Две головки сходятся к локтевой стороне основания большого пальца.",
        "actionsRu": [
          "Приводит большой палец к ладони.",
          "Помогает силовому щипковому захвату."
        ],
        "innervationRu": "Глубокая ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "I межпальцевой промежуток",
          "III пястная кость",
          "основание большого пальца"
        ],
        "relationsRu": [
          "Не относится к трём мышцам возвышения тенара, хотя находится рядом с ними."
        ]
      },
      "movementCueRu": "Приведение большого пальца к указательному показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — мышца, приводящая большой палец",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "palmaris-brevis",
      "kind": "muscle",
      "names": {
        "ru": "Короткая ладонная мышца",
        "latin": "musculus palmaris brevis",
        "modelAliases": [
          "palmaris brevis"
        ]
      },
      "subregions": [
        "hypothenar-superficial"
      ],
      "layer": "intrinsic-hand-most-superficial",
      "anatomy": {
        "originRu": [
          "Ладонный апоневроз.",
          "Удерживатель сгибателей."
        ],
        "insertionRu": [
          "Кожа локтевого края ладони."
        ],
        "fiberDirectionRu": "Короткие поперечные пучки идут к коже гипотенара.",
        "actionsRu": [
          "Морщит кожу локтевого края ладони и помогает углублять ладонную впадину."
        ],
        "innervationRu": "Поверхностная ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Локтевой край ладони",
          "гипотенар"
        ],
        "relationsRu": [
          "Очень поверхностная мышца, прикрепляющаяся к коже."
        ]
      },
      "movementCueRu": "Сильный хват может вызвать складки кожи над гипотенаром.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — короткая ладонная мышца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "abductor-digiti-minimi-hand",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, отводящая мизинец кисти",
        "latin": "musculus abductor digiti minimi",
        "modelAliases": [
          "abductor digiti minimi hand",
          "abductor digiti minimi"
        ]
      },
      "modelAliasContext": "hand",
      "subregions": [
        "hypothenar"
      ],
      "layer": "intrinsic-hand-superficial",
      "anatomy": {
        "originRu": [
          "Гороховидная кость.",
          "Сухожилие локтевого сгибателя запястья и гороховидно-крючковидная связка."
        ],
        "insertionRu": [
          "Медиальная сторона основания проксимальной фаланги V пальца и разгибательный аппарат."
        ],
        "fiberDirectionRu": "Пучки идут дистально вдоль локтевого края кисти.",
        "actionsRu": [
          "Отводит V палец.",
          "Помогает сгибанию его пястно-фаланговый сустава."
        ],
        "innervationRu": "Глубокая ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Гороховидная кость",
          "гипотенар",
          "основание V пальца"
        ],
        "relationsRu": [
          "Формирует локтевую часть возвышения гипотенара."
        ]
      },
      "movementCueRu": "Отведение мизинца показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — мышца, отводящая мизинец",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "opponens-digiti-minimi",
      "kind": "muscle",
      "names": {
        "ru": "Мышца, противопоставляющая мизинец",
        "latin": "musculus opponens digiti minimi",
        "modelAliases": [
          "opponens digiti minimi"
        ]
      },
      "subregions": [
        "hypothenar"
      ],
      "layer": "intrinsic-hand-deep",
      "anatomy": {
        "originRu": [
          "Крючок крючковидной кости.",
          "Удерживатель сгибателей."
        ],
        "insertionRu": [
          "Медиальный край V пястной кости."
        ],
        "fiberDirectionRu": "Пучки идут дистально вдоль V пястной кости.",
        "actionsRu": [
          "Тянет V пястную кость вперёд и слегка вращает её, углубляя ладонную чашу при оппозиции мизинца."
        ],
        "innervationRu": "Глубокая ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Крючок крючковидной кости",
          "V пястная кость"
        ],
        "relationsRu": [
          "Лежит глубже остальных мышц гипотенара."
        ]
      },
      "movementCueRu": "Сведение большого пальца и мизинца показывает общую функцию гипотенара.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — мышца, противопоставляющая мизинец",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "flexor-digiti-minimi-brevis-hand",
      "kind": "muscle",
      "names": {
        "ru": "Короткий сгибатель мизинца кисти",
        "latin": "musculus flexor digiti minimi brevis",
        "modelAliases": [
          "flexor digiti minimi brevis hand",
          "flexor digiti minimi brevis"
        ]
      },
      "subregions": [
        "hypothenar"
      ],
      "layer": "intrinsic-hand-superficial",
      "anatomy": {
        "originRu": [
          "Крючок крючковидной кости.",
          "Удерживатель сгибателей."
        ],
        "insertionRu": [
          "Медиальная сторона основания проксимальной фаланги V пальца."
        ],
        "fiberDirectionRu": "Короткие пучки идут дистально к пястно-фаланговый суставу мизинца.",
        "actionsRu": [
          "Сгибает V палец в пястно-фаланговом суставе."
        ],
        "innervationRu": "Глубокая ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Гипотенар",
          "основание V пальца"
        ],
        "relationsRu": [
          "Лежит рядом с мышцей, отводящей мизинец."
        ]
      },
      "movementCueRu": "Сгибание мизинца в пястно-фаланговом суставе показывает функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — короткий сгибатель мизинца",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked"
      }
    },
    {
      "id": "lumbricals-hand",
      "kind": "muscle-group",
      "names": {
        "ru": "Червеобразные мышцы кисти",
        "latin": "musculi lumbricales manus",
        "modelAliases": [
          "lumbricals hand",
          "lumbrical muscles"
        ]
      },
      "subregions": [
        "central-palm",
        "fingers"
      ],
      "layer": "intrinsic-hand-central",
      "anatomy": {
        "originRu": [
          "Сухожилия глубокого сгибателя пальцев."
        ],
        "insertionRu": [
          "Лучевые стороны разгибательных аппаратов II–V пальцев."
        ],
        "fiberDirectionRu": "Тонкие мышцы идут от ладонных сухожилий FDP к тыльному разгибательному аппарату.",
        "actionsRu": [
          "Сгибают пястно-фаланговый суставы II–V пальцев.",
          "Одновременно помогают разгибанию межфаланговых суставов через разгибательный аппарат."
        ],
        "innervationRu": "I–II — срединный нерв; III–IV — глубокая ветвь локтевого нерва."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Центральная ладонь",
          "разгибательные аппараты пальцев"
        ],
        "relationsRu": [
          "Связывают сухожилия глубоких сгибателей с разгибательным аппаратом; это объясняет их необычное сочетание действий."
        ]
      },
      "movementCueRu": "Положение «пястно-фаланговые суставы согнуты, межфаланговые разогнуты» демонстрирует общий результат работы червеобразных и межкостных.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, кисть — червеобразные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-muscles",
          "locator": "Structure and Function",
          "role": "verification"
        },
        {
          "sourceId": "ncbi-hand-intrinsic",
          "locator": "Intrinsic hand muscles",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    },
    {
      "id": "palmar-interossei",
      "kind": "muscle-group",
      "names": {
        "ru": "Ладонные межкостные мышцы",
        "latin": "musculi interossei palmares",
        "modelAliases": [
          "palmar interossei"
        ]
      },
      "subregions": [
        "deep-palm",
        "metacarpal-spaces"
      ],
      "layer": "intrinsic-hand-deep",
      "anatomy": {
        "originRu": [
          "Ладонные поверхности пястных костей пальцев, которые приводятся к оси III пальца; обычно выделяют три хорошо выраженные мышцы."
        ],
        "insertionRu": [
          "Основания проксимальных фаланг и разгибательные аппараты соответствующих пальцев."
        ],
        "fiberDirectionRu": "Пучки идут от пястных костей к проксимальным фалангам и разгибательному аппарату.",
        "actionsRu": [
          "Приводят пальцы к оси III пальца.",
          "Помогают сгибанию пястно-фаланговых суставов и разгибанию межфаланговых суставов."
        ],
        "innervationRu": "Глубокая ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Пястные промежутки",
          "III палец как функциональная ось"
        ],
        "relationsRu": [
          "Лежат между пястными костями; число и описание первой ладонной межкостной могут различаться между анатомическими традициями."
        ]
      },
      "movementCueRu": "Мнемоника PAD (palmar adduct) отражает направление, но движение всегда координировано с другими мышцами.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, ладонные межкостные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-interossei",
          "locator": "Palmar interossei",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-with-count-variation"
      }
    },
    {
      "id": "dorsal-interossei",
      "kind": "muscle-group",
      "names": {
        "ru": "Тыльные межкостные мышцы кисти",
        "latin": "musculi interossei dorsales",
        "modelAliases": [
          "dorsal interossei"
        ]
      },
      "subregions": [
        "deep-hand",
        "metacarpal-spaces"
      ],
      "layer": "intrinsic-hand-deep",
      "anatomy": {
        "originRu": [
          "Соседние поверхности пястных костей; четыре двуперистые мышцы."
        ],
        "insertionRu": [
          "Основания проксимальных фаланг и разгибательные аппараты II–IV пальцев."
        ],
        "fiberDirectionRu": "Двуперистые мышцы заполняют межпястные промежутки.",
        "actionsRu": [
          "Отводят пальцы от оси III пальца.",
          "Помогают сгибанию пястно-фаланговых суставов и разгибанию межфаланговых суставов."
        ],
        "innervationRu": "Глубокая ветвь локтевого нерва, C8–T1."
      },
      "surfaceMap": {
        "landmarksRu": [
          "Межпястные промежутки",
          "III палец как ось"
        ],
        "relationsRu": [
          "Глубокие собственные мышцы кисти; первая тыльная межкостная особенно заметна в первом межпястном промежутке."
        ]
      },
      "movementCueRu": "Разведение пальцев показывает их основную функцию.",
      "sources": [
        {
          "sourceId": "miology-igma-2018",
          "locator": "Раздел VI, тыльные межкостные мышцы",
          "role": "teaching-source"
        },
        {
          "sourceId": "ncbi-hand-interossei",
          "locator": "Dorsal interossei",
          "role": "verification"
        }
      ],
      "verification": {
        "status": "cross-checked-group"
      }
    }
  ]
});

export const UPPER_LIMB_STRUCTURE_COUNT = UPPER_LIMB_REGION.structures.length;

export function upperLimbStructureById(id) {
  return UPPER_LIMB_REGION.structures.find((item) => item.id === id) || null;
}
