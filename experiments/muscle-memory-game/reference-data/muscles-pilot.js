export const MUSCLE_REFERENCE_PILOT = Object.freeze([
  Object.freeze({
    id: "latissimus-dorsi",
    names: Object.freeze({
      ru: "Широчайшая мышца спины",
      latin: "musculus latissimus dorsi",
      modelAliases: Object.freeze(["latissimus dorsi", "latissimus_dorsi"]),
    }),
    regions: Object.freeze(["back", "shoulder"]),
    layerByRegion: Object.freeze({
      back: "superficial",
      shoulder: "superficial",
    }),
    anatomy: Object.freeze({
      originRu: Object.freeze([
        "Остистые отростки нижних грудных позвонков и грудопоясничная фасция.",
        "Задняя часть подвздошного гребня.",
        "Нижние 3–4 ребра.",
      ]),
      insertionRu: Object.freeze([
        "Дно межбугорковой борозды плечевой кости.",
      ]),
      fiberDirectionRu: "Волокна идут преимущественно вверх и латерально к плечевой кости.",
      actionsRu: Object.freeze([
        "Разгибает плечо.",
        "Приводит плечо.",
        "Вращает плечо внутрь.",
        "При фиксированных верхних конечностях участвует в подтягивании туловища к рукам.",
      ]),
    }),
    surfaceMap: Object.freeze({
      landmarksRu: Object.freeze([
        "Нижние грудные и поясничные отделы спины.",
        "Подвздошный гребень.",
        "Задняя подмышечная складка — вместе с большой круглой мышцей.",
      ]),
      relationsRu: Object.freeze([
        "Образует крупный поверхностный пласт нижней и боковой части спины.",
        "В верхнелатеральной части проходит к плечевой кости и участвует в формировании задней подмышечной складки.",
      ]),
    }),
    movementCueRu: "Приведение или разгибание плеча делает направление тяги мышцы понятнее.",
    learningNotesRu: Object.freeze([
      "Не связывать движение плеча с одной широчайшей мышцей: те же движения создаются совместной работой нескольких мышц.",
      "По наружному рельефу нельзя уверенно приписывать ощущаемую ткань одной глубокой структуре.",
    ]),
    sources: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел I «Мышцы спины», 1.2 «Широчайшая мышца спины»",
        role: "teaching-source",
      }),
      Object.freeze({
        sourceId: "course-anatomy-map-m6",
        locator: "4.2 «Поверхностный слой спины»",
        role: "pedagogy",
      }),
      Object.freeze({
        sourceId: "ncbi-latissimus-dorsi",
        locator: "Structure and Function / attachments",
        role: "verification",
      }),
    ]),
    sourceNotesRu: Object.freeze([
      "В «Миологии» ИГМА место прикрепления указано как гребень малого бугорка. Для пилотной записи принято современное описание — дно межбугорковой борозды плечевой кости. Перед финальным релизом расхождение нужно дополнительно сверить по академическому атласу.",
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел I, рис. 1 «Мышцы спины»",
        rightsStatus: "review",
        purpose: "reference-only",
      }),
      Object.freeze({
        sourceId: "gray-1918-plate-409",
        locator: "Gray 1918, plate 409; выделение широчайшей мышцы",
        rightsStatus: "public-domain",
        purpose: "candidate-for-local-copy",
      }),
    ]),
    verification: Object.freeze({
      status: "needs-atlas-check",
      checkedAgainst: Object.freeze(["miology-igma-2018", "ncbi-latissimus-dorsi"]),
    }),
  }),

  Object.freeze({
    id: "serratus-anterior",
    names: Object.freeze({
      ru: "Передняя зубчатая мышца",
      latin: "musculus serratus anterior",
      modelAliases: Object.freeze(["serratus anterior", "serratus_anterior"]),
    }),
    regions: Object.freeze(["thorax", "shoulder"]),
    layerByRegion: Object.freeze({
      thorax: "intermediate",
      shoulder: "deep",
    }),
    anatomy: Object.freeze({
      originRu: Object.freeze([
        "Наружные поверхности верхних 8–9 рёбер.",
      ]),
      insertionRu: Object.freeze([
        "Передняя поверхность медиального края лопатки с выраженным прикреплением у нижнего угла.",
      ]),
      fiberDirectionRu: "Пучки идут от боковой поверхности грудной клетки назад к медиальному краю лопатки.",
      actionsRu: Object.freeze([
        "Тянет лопатку вперёд по грудной клетке.",
        "Участвует во вращении лопатки вверх.",
        "Удерживает лопатку прилежащей к грудной клетке.",
      ]),
    }),
    surfaceMap: Object.freeze({
      landmarksRu: Object.freeze([
        "Боковая поверхность верхних рёбер.",
        "Медиальный край и нижний угол лопатки.",
      ]),
      relationsRu: Object.freeze([
        "Большая часть мышцы лежит между лопаткой и грудной клеткой.",
        "Зубцы мышцы частично видны на боковой поверхности грудной клетки там, где их не перекрывают крупные поверхностные мышцы.",
      ]),
    }),
    movementCueRu: "Вытягивание руки вперёд и подъём руки над головой помогают увидеть движение лопатки, в котором участвует передняя зубчатая мышца.",
    learningNotesRu: Object.freeze([
      "Основная учебная задача — понять положение мышцы между рёбрами и лопаткой и её вклад в движение лопатки.",
      "Не создавать впечатление, что всю мышцу можно изолированно пальпировать через лежащие поверх неё структуры.",
    ]),
    sources: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел II «Мышцы груди», 1.4 «Передняя зубчатая мышца»",
        role: "teaching-source",
      }),
      Object.freeze({
        sourceId: "course-anatomy-map-m5",
        locator: "4.6 «Лопатка и мышцы плечевого пояса»",
        role: "pedagogy",
      }),
      Object.freeze({
        sourceId: "ncbi-serratus-anterior",
        locator: "Anatomy / function",
        role: "verification",
      }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел II, рис. 2 «Мышцы груди»",
        rightsStatus: "review",
        purpose: "reference-only",
      }),
      Object.freeze({
        sourceId: "gray-1918-plate-411",
        locator: "Gray 1918, plate 411; передняя зубчатая и соседние мышцы",
        rightsStatus: "public-domain",
        purpose: "candidate-for-local-copy",
      }),
    ]),
    verification: Object.freeze({
      status: "cross-checked",
      checkedAgainst: Object.freeze(["miology-igma-2018", "ncbi-serratus-anterior"]),
    }),
  }),

  Object.freeze({
    id: "external-oblique",
    names: Object.freeze({
      ru: "Наружная косая мышца живота",
      latin: "musculus obliquus externus abdominis",
      modelAliases: Object.freeze([
        "external oblique",
        "external abdominal oblique",
        "obliquus externus abdominis",
      ]),
    }),
    regions: Object.freeze(["abdomen", "lateral-trunk"]),
    layerByRegion: Object.freeze({
      abdomen: "superficial",
      "lateral-trunk": "superficial",
    }),
    anatomy: Object.freeze({
      originRu: Object.freeze([
        "Наружные поверхности V–XII рёбер.",
      ]),
      insertionRu: Object.freeze([
        "Белая линия живота через широкий апоневроз.",
        "Лобковый бугорок.",
        "Передняя часть подвздошного гребня.",
      ]),
      fiberDirectionRu: "Большинство волокон идёт вниз и медиально; нижние пучки идут более вертикально.",
      actionsRu: Object.freeze([
        "При двустороннем сокращении участвует в сгибании туловища.",
        "При одностороннем сокращении участвует в повороте туловища в противоположную сторону.",
        "Участвует в создании внутрибрюшного давления.",
      ]),
    }),
    surfaceMap: Object.freeze({
      landmarksRu: Object.freeze([
        "Нижние рёбра.",
        "Передняя часть подвздошного гребня.",
        "Белая линия живота как медиальная апоневротическая граница.",
      ]),
      relationsRu: Object.freeze([
        "Это наиболее поверхностная из трёх широких боковых мышц живота.",
        "Под ней располагается внутренняя косая мышца, глубже — поперечная мышца живота.",
      ]),
    }),
    movementCueRu: "Поворот туловища помогает связать направление волокон с функцией мышцы.",
    learningNotesRu: Object.freeze([
      "На учебной карте важно показать переход мышечной части в широкий апоневроз.",
      "Не трактовать наружную косую как самостоятельный «двигатель» поворота: движение создаётся системой мышц туловища.",
    ]),
    sources: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел III «Мышцы живота», 1.1 «Наружная косая мышца живота»",
        role: "teaching-source",
      }),
      Object.freeze({
        sourceId: "ncbi-anterolateral-abdominal-wall",
        locator: "External oblique / attachments and actions",
        role: "verification",
      }),
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел III, рис. 1 «Передне-боковая стенка живота»",
        rightsStatus: "review",
        purpose: "reference-only",
      }),
      Object.freeze({
        sourceId: "gray-1918-plate-392",
        locator: "Gray 1918, plate 392; наружная косая мышца живота",
        rightsStatus: "public-domain",
        purpose: "candidate-for-local-copy",
      }),
    ]),
    verification: Object.freeze({
      status: "cross-checked",
      checkedAgainst: Object.freeze(["miology-igma-2018", "ncbi-anterolateral-abdominal-wall"]),
    }),
  }),

  Object.freeze({
    id: "masseter",
    names: Object.freeze({
      ru: "Жевательная мышца",
      latin: "musculus masseter",
      modelAliases: Object.freeze(["masseter"]),
    }),
    regions: Object.freeze(["face"]),
    layerByRegion: Object.freeze({
      face: "superficial",
    }),
    anatomy: Object.freeze({
      originRu: Object.freeze([
        "Скуловая дуга и прилежащая часть скуловой кости.",
      ]),
      insertionRu: Object.freeze([
        "Латеральная поверхность ветви и угла нижней челюсти.",
      ]),
      fiberDirectionRu: "Поверхностные пучки идут преимущественно вниз и назад; глубокие — более вертикально.",
      actionsRu: Object.freeze([
        "Поднимает нижнюю челюсть.",
        "Поверхностные волокна помогают выдвижению нижней челюсти вперёд.",
      ]),
    }),
    surfaceMap: Object.freeze({
      landmarksRu: Object.freeze([
        "Скуловая дуга.",
        "Ветвь и угол нижней челюсти.",
      ]),
      relationsRu: Object.freeze([
        "Мышца образует заметный поверхностный мышечный пласт на боковой поверхности нижней части лица.",
      ]),
    }),
    movementCueRu: "Смыкание зубов с умеренным усилием делает контур жевательной мышцы хорошо различимым.",
    learningNotesRu: Object.freeze([
      "Для базовой карточки достаточно положения, прикреплений и основного действия мышцы.",
      "Разные источники по-разному делят жевательную мышцу на части; это не нужно превращать в обязательный материал первого уровня.",
    ]),
    sources: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел IV «Мышцы головы», 2.1 «Собственно жевательная мышца»",
        role: "teaching-source",
      }),
      Object.freeze({
        sourceId: "ncbi-masseter",
        locator: "Structure and Function",
        role: "verification",
      }),
    ]),
    sourceNotesRu: Object.freeze([
      "В «Миологии» ИГМА описаны три части мышцы, тогда как современные краткие англоязычные источники часто используют деление на поверхностную и глубокую части. В пилотной карточке это различие не превращено в обязательную классификацию.",
    ]),
    illustrations: Object.freeze([
      Object.freeze({
        sourceId: "miology-igma-2018",
        locator: "Раздел IV, рис. 3 «Жевательные мышцы»",
        rightsStatus: "review",
        purpose: "reference-only",
      }),
      Object.freeze({
        sourceId: "gray-1918-plate-378-masseter",
        locator: "Gray 1918, plate 378; жевательная мышца выделена на боковой проекции",
        rightsStatus: "public-domain",
        purpose: "candidate-for-local-copy",
      }),
    ]),
    verification: Object.freeze({
      status: "cross-checked-core",
      checkedAgainst: Object.freeze(["miology-igma-2018", "ncbi-masseter"]),
    }),
  }),
]);

export function pilotMuscleById(id) {
  return MUSCLE_REFERENCE_PILOT.find((muscle) => muscle.id === id) || null;
}
