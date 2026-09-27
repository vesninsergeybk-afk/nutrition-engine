export const THORAX_ABDOMEN_REGION = Object.freeze({
  id: "thorax-abdomen",
  nameRu: "Грудная клетка и живот",
  status: "verified-v1",
  scopeRu: "Передняя и боковая грудная стенка, межрёберные слои, диафрагма и мышцы переднебоковой брюшной стенки.",
  relatedStructureIds: Object.freeze([
    "serratus-anterior",
    "quadratus-lumborum",
  ]),
  teachingPrinciplesRu: Object.freeze([
    "Для дыхательных движений различать основной вклад диафрагмы, работу межрёберных мышц и дополнительную работу других мышц.",
    "Не обозначать отдельную мышцу как единственную причину вдоха, выдоха или движения туловища.",
    "У плоских мышц брюшной стенки обязательно показывать слой и переход мышечной части в апоневроз.",
    "Не превращать глубокие слои грудной и брюшной стенки в пальпаторные «мишени».",
  ]),
  structures: Object.freeze([
    Object.freeze({
      id: "pectoralis-major",
      kind: "muscle",
      names: Object.freeze({
        ru: "Большая грудная мышца",
        latin: "musculus pectoralis major",
        modelAliases: Object.freeze(["pectoralis major", "pectoralis_major"]),
      }),
      subregions: Object.freeze(["anterior-chest", "anterior-axillary-fold", "shoulder"]),
      layer: "superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Передняя поверхность медиальной половины ключицы.",
          "Передняя поверхность грудины.",
          "Хрящи верхних рёбер; в разных описаниях граница реберной части несколько различается.",
          "Часть волокон связана с апоневрозом наружной косой мышцы живота.",
        ]),
        insertionRu: Object.freeze(["Латеральная губа межбугорковой борозды плечевой кости."]),
        fiberDirectionRu: "Веерообразные пучки сходятся латерально к плечевой кости; направление различается у ключичной и грудино-рёберной частей.",
        actionsRu: Object.freeze([
          "Приводит плечо.",
          "Вращает плечо внутрь.",
          "Ключичная часть участвует в сгибании плеча.",
          "Грудино-рёберная часть помогает разгибать плечо из согнутого положения.",
        ]),
        innervationRu: "Латеральный и медиальный грудные нервы.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Ключица", "грудина", "передняя подмышечная складка"]),
        relationsRu: Object.freeze([
          "Образует основной поверхностный мышечный пласт передней грудной стенки.",
          "Перекрывает малую грудную мышцу.",
        ]),
      }),
      movementCueRu: "Горизонтальное приведение и внутреннее вращение плеча хорошо показывают направление работы мышцы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 1.1 «Большая грудная мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-pectoralis-major", locator: "Introduction; Structure and Function", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "pectoralis-minor",
      kind: "muscle",
      names: Object.freeze({
        ru: "Малая грудная мышца",
        latin: "musculus pectoralis minor",
        modelAliases: Object.freeze(["pectoralis minor", "pectoralis_minor"]),
      }),
      subregions: Object.freeze(["anterior-chest", "axillary-region"]),
      layer: "deep-to-pectoralis-major",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Передние поверхности III–V рёбер около их хрящей."]),
        insertionRu: Object.freeze(["Клювовидный отросток лопатки."]),
        fiberDirectionRu: "Волокна идут вверх и латерально от рёбер к клювовидному отростку.",
        actionsRu: Object.freeze([
          "Тянет лопатку вперёд и вниз и помогает удерживать её у грудной клетки.",
          "При фиксированной лопатке может участвовать в подъёме III–V рёбер при усиленном вдохе.",
        ]),
        innervationRu: "Медиальный и латеральный грудные нервы; вклад ветвей может варьировать.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Клювовидный отросток", "III–V рёбра"]),
        relationsRu: Object.freeze([
          "Расположена глубже большой грудной мышцы.",
          "Находится рядом с сосудисто-нервными структурами подмышечной области; её глубокое положение важно учитывать при практической работе.",
        ]),
      }),
      movementCueRu: "Движение лопатки вперёд и вниз показывает функциональное направление мышцы лучше, чем попытка найти её контур через большую грудную.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 1.2 «Малая грудная мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Muscles — Pectoralis minor", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-pectoral-muscles", locator: "Nerves; Muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "subclavius",
      kind: "muscle",
      names: Object.freeze({
        ru: "Подключичная мышца",
        latin: "musculus subclavius",
        modelAliases: Object.freeze(["subclavius"]),
      }),
      subregions: Object.freeze(["infraclavicular-region"]),
      layer: "deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Область соединения I ребра с его хрящом."]),
        insertionRu: Object.freeze(["Борозда подключичной мышцы на нижней поверхности средней трети ключицы."]),
        fiberDirectionRu: "Короткие волокна идут вверх и латерально от I ребра к ключице.",
        actionsRu: Object.freeze([
          "Стабилизирует ключицу в грудино-ключичном суставе.",
          "Тянет ключицу несколько вниз и медиально.",
        ]),
        innervationRu: "Нерв к подключичной мышце, преимущественно C5–C6.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Ключица", "I ребро"]),
        relationsRu: Object.freeze(["Лежит глубже ключицы; сосудисто-нервный пучок верхней конечности проходит глубже и ниже этой области."]),
      }),
      movementCueRu: "В базовом обучении мышца нужна как элемент глубокой карты подключичной области, а не как отдельная поверхностная цель.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 1.3 «Подключичная мышца»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Muscles — Subclavius", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-pectoral-muscles", locator: "Nerves — Subclavius", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "external-intercostals",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Наружные межрёберные мышцы",
        latin: "musculi intercostales externi",
        modelAliases: Object.freeze(["external intercostals", "intercostales externi"]),
      }),
      subregions: Object.freeze(["thoracic-wall"]),
      layer: "thoracic-wall-superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Нижний край вышележащего ребра."]),
        insertionRu: Object.freeze(["Верхний край нижележащего ребра."]),
        fiberDirectionRu: "Волокна идут вниз и вперёд; спереди мышечный слой переходит в наружную межрёберную мембрану.",
        actionsRu: Object.freeze([
          "Стабилизируют межрёберные промежутки.",
          "При вдохе участвуют в подъёме рёбер и увеличении размеров грудной клетки.",
        ]),
        innervationRu: "Межрёберные нервы соответствующих уровней.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Межрёберные промежутки", "углы рёбер", "рёберные хрящи"]),
        relationsRu: Object.freeze(["Образуют наружный мышечный слой межрёберных промежутков."]),
      }),
      movementCueRu: "Их работа рассматривается как часть общей механики грудной клетки при вдохе.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 2.1 «Наружные межрёберные мышцы»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-intercostal-wall", locator: "Thoracic wall layers", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-group" }),
    }),

    Object.freeze({
      id: "internal-intercostals",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Внутренние межрёберные мышцы",
        latin: "musculi intercostales interni",
        modelAliases: Object.freeze(["internal intercostals", "intercostales interni"]),
      }),
      subregions: Object.freeze(["thoracic-wall"]),
      layer: "thoracic-wall-middle",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Внутренняя поверхность и нижний край вышележащего ребра."]),
        insertionRu: Object.freeze(["Верхний край нижележащего ребра."]),
        fiberDirectionRu: "Волокна идут преимущественно вниз и назад, почти перпендикулярно наружным межрёберным.",
        actionsRu: Object.freeze([
          "Стабилизируют межрёберные промежутки.",
          "Межкостная часть преимущественно участвует в опускании рёбер при активном выдохе.",
          "Межхрящевая часть может участвовать в подъёме рёбер; поэтому всю мышцу нельзя описывать одним движением без оговорки.",
        ]),
        innervationRu: "Межрёберные нервы соответствующих уровней.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Межрёберные промежутки", "грудина", "углы рёбер"]),
        relationsRu: Object.freeze(["Лежат глубже наружных межрёберных мышц."]),
      }),
      movementCueRu: "В справочнике важно показывать различие частей мышцы, чтобы не закреплять правило «внутренние межрёберные всегда выдох».",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 2.2 «Внутренние межрёберные мышцы»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-intercostal-wall", locator: "Thoracic wall layers and respiratory function", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-functional-nuance" }),
    }),

    Object.freeze({
      id: "innermost-intercostals",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Самые внутренние межрёберные мышцы",
        latin: "musculi intercostales intimi",
        modelAliases: Object.freeze(["innermost intercostals", "intercostales intimi"]),
      }),
      subregions: Object.freeze(["thoracic-wall"]),
      layer: "thoracic-wall-deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Внутренняя поверхность вышележащего ребра в пределах межрёберного промежутка."]),
        insertionRu: Object.freeze(["Внутренняя поверхность нижележащего ребра."]),
        fiberDirectionRu: "Направление волокон в целом сходно с внутренними межрёберными мышцами.",
        actionsRu: Object.freeze([
          "Участвуют в стабилизации межрёберного промежутка и движении рёбер совместно с внутренним межрёберным слоем.",
        ]),
        innervationRu: "Межрёберные нервы соответствующих уровней.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Внутренняя поверхность межрёберных промежутков"]),
        relationsRu: Object.freeze([
          "Это самый глубокий из трёх основных межрёберных слоёв.",
          "Межрёберный сосудисто-нервный пучок проходит между внутренним и самым внутренним слоями.",
        ]),
      }),
      movementCueRu: "Структура нужна для точной послойной карты грудной стенки.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "ncbi-intercostal-wall", locator: "Thoracic wall layers", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-group" }),
    }),

    Object.freeze({
      id: "subcostales",
      kind: "muscle-group",
      names: Object.freeze({
        ru: "Подрёберные мышцы",
        latin: "musculi subcostales",
        modelAliases: Object.freeze(["subcostales", "subcostal muscles"]),
      }),
      subregions: Object.freeze(["posterior-thoracic-wall"]),
      layer: "deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Внутренняя поверхность нижних рёбер около их углов."]),
        insertionRu: Object.freeze(["Внутренняя поверхность ребра на один или два межрёберных промежутка ниже."]),
        fiberDirectionRu: "Пучки идут вниз и медиально, сходно с внутренними межрёберными мышцами.",
        actionsRu: Object.freeze([
          "Могут участвовать в опускании рёбер и стабилизации задней части грудной стенки.",
        ]),
        innervationRu: "Межрёберные нервы соответствующих уровней.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Углы нижних рёбер"]),
        relationsRu: Object.freeze(["Лежат на внутренней поверхности задней грудной стенки."]),
      }),
      movementCueRu: "Для базового уровня достаточно понимать их как небольшой глубокий слой задней грудной стенки.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 2.3 «Подрёберные мышцы»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Thoracic wall muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-group" }),
    }),

    Object.freeze({
      id: "transversus-thoracis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Поперечная мышца груди",
        latin: "musculus transversus thoracis",
        modelAliases: Object.freeze(["transversus thoracis"]),
      }),
      subregions: Object.freeze(["anterior-inner-thoracic-wall"]),
      layer: "deep",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Задняя поверхность нижней части грудины и мечевидного отростка."]),
        insertionRu: Object.freeze(["Внутренние поверхности хрящей примерно II–VI рёбер."]),
        fiberDirectionRu: "Пучки расходятся вверх и латерально от грудины к рёберным хрящам.",
        actionsRu: Object.freeze([
          "Слабо участвует в опускании рёбер и стабилизации передней грудной стенки.",
        ]),
        innervationRu: "Межрёберные нервы.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Грудина", "II–VI рёберные хрящи"]),
        relationsRu: Object.freeze(["Лежит на внутренней поверхности передней грудной стенки и не является поверхностно доступной мышцей."]),
      }),
      movementCueRu: "Карточка нужна для полноты глубокой анатомии грудной стенки.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, 2.4 «Поперечная мышца груди»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Thoracic wall muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "diaphragm",
      kind: "muscle",
      names: Object.freeze({
        ru: "Диафрагма",
        latin: "diaphragma",
        modelAliases: Object.freeze(["diaphragm", "diaphragma"]),
      }),
      subregions: Object.freeze(["inferior-thoracic-aperture"]),
      layer: "deep-cavity-boundary",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Грудинная часть — от мечевидного отростка.",
          "Рёберная часть — от внутренней поверхности нижних шести рёбер и их хрящей.",
          "Поясничная часть — от правой и левой ножек и дугообразных связок, связанных с поясничными позвонками.",
        ]),
        insertionRu: Object.freeze(["Все мышечные части сходятся к центральному сухожилию."]),
        fiberDirectionRu: "Периферические мышечные волокна радиально сходятся к центральному сухожилию.",
        actionsRu: Object.freeze([
          "Главная мышца вдоха: сокращение опускает центральное сухожилие и увеличивает вертикальный размер грудной полости.",
          "Участвует в создании внутрибрюшного давления совместно с мышцами брюшной стенки и тазового дна.",
        ]),
        innervationRu: "Двигательная иннервация — диафрагмальные нервы C3–C5.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Нижние рёбра", "мечевидный отросток", "поясничный отдел позвоночника"]),
        relationsRu: Object.freeze(["Разделяет грудную и брюшную полости; большая часть мышцы недоступна непосредственной поверхностной пальпации."]),
      }),
      movementCueRu: "Дыхательное движение грудной клетки и передней брюшной стенки отражает работу всей дыхательной системы, а не позволяет напрямую видеть отдельные пучки диафрагмы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел II, «Диафрагма»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-diaphragm", locator: "Muscles", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-thorax-muscles", locator: "Diaphragm", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "external-oblique",
      kind: "muscle",
      names: Object.freeze({
        ru: "Наружная косая мышца живота",
        latin: "musculus obliquus externus abdominis",
        modelAliases: Object.freeze(["external oblique", "external abdominal oblique", "obliquus externus abdominis"]),
      }),
      subregions: Object.freeze(["anterolateral-abdominal-wall", "lateral-trunk"]),
      layer: "superficial",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Наружные поверхности V–XII рёбер."]),
        insertionRu: Object.freeze([
          "Белая линия живота через широкий апоневроз.",
          "Лобковый бугорок.",
          "Передняя половина подвздошного гребня.",
        ]),
        fiberDirectionRu: "Большинство волокон идёт вниз и медиально; нижние пучки идут более вертикально.",
        actionsRu: Object.freeze([
          "При двустороннем сокращении участвует в сгибании туловища и повышении внутрибрюшного давления.",
          "При одностороннем сокращении участвует в боковом сгибании и повороте туловища в противоположную сторону.",
        ]),
        innervationRu: "Передние ветви нижних грудных спинномозговых нервов, включая грудобрюшные и подрёберный нервы.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["V–XII рёбра", "передняя часть подвздошного гребня", "белая линия живота"]),
        relationsRu: Object.freeze([
          "Самая поверхностная из трёх широких боковых мышц живота.",
          "Под ней лежит внутренняя косая, ещё глубже — поперечная мышца живота.",
        ]),
      }),
      movementCueRu: "Поворот туловища помогает связать направление волокон с функцией мышцы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел III, 1.1 «Наружная косая мышца живота»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-abdominal-wall", locator: "External Oblique", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-anterolateral-abdominal-wall", locator: "External oblique", role: "verification" }),
      ]),
      illustrations: Object.freeze([
        Object.freeze({ sourceId: "gray-1918-plate-392", rightsStatus: "public-domain", purpose: "candidate-for-local-copy" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "internal-oblique",
      kind: "muscle",
      names: Object.freeze({
        ru: "Внутренняя косая мышца живота",
        latin: "musculus obliquus internus abdominis",
        modelAliases: Object.freeze(["internal oblique", "internal abdominal oblique", "obliquus internus abdominis"]),
      }),
      subregions: Object.freeze(["anterolateral-abdominal-wall"]),
      layer: "intermediate",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Грудопоясничная фасция.",
          "Передние две трети подвздошного гребня.",
          "Латеральная часть паховой связки.",
        ]),
        insertionRu: Object.freeze([
          "Нижние края X–XII рёбер.",
          "Белая линия живота через апоневроз.",
          "Нижние волокна участвуют в формировании общего сухожилия с поперечной мышцей живота.",
        ]),
        fiberDirectionRu: "Большинство волокон идёт вверх и медиально, примерно перпендикулярно наружной косой; нижние волокна имеют более горизонтальное направление.",
        actionsRu: Object.freeze([
          "При двустороннем сокращении участвует в сгибании туловища и повышении внутрибрюшного давления.",
          "При одностороннем сокращении участвует в боковом сгибании и повороте туловища в свою сторону.",
        ]),
        innervationRu: "Передние ветви нижних грудных спинномозговых нервов и L1.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Подвздошный гребень", "нижние рёбра", "латеральная часть паховой связки"]),
        relationsRu: Object.freeze(["Лежит глубже наружной косой и поверхностнее поперечной мышцы живота."]),
      }),
      movementCueRu: "Поворот туловища в сторону сокращения помогает понять отличие функции от наружной косой мышцы.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел III, 1.2 «Внутренняя косая мышца живота»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-abdominal-wall", locator: "Internal Oblique", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "transversus-abdominis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Поперечная мышца живота",
        latin: "musculus transversus abdominis",
        modelAliases: Object.freeze(["transversus abdominis", "transverse abdominis"]),
      }),
      subregions: Object.freeze(["anterolateral-abdominal-wall"]),
      layer: "deep",
      anatomy: Object.freeze({
        originRu: Object.freeze([
          "Внутренние поверхности нижних рёберных хрящей.",
          "Грудопоясничная фасция.",
          "Подвздошный гребень.",
          "Латеральная часть паховой связки.",
        ]),
        insertionRu: Object.freeze([
          "Белая линия живота через апоневроз.",
          "Лобковый гребень и гребенчатая линия через нижние апоневротические волокна.",
        ]),
        fiberDirectionRu: "Большая часть волокон идёт почти поперечно.",
        actionsRu: Object.freeze([
          "Сжимает и поддерживает содержимое брюшной полости.",
          "Участвует в повышении внутрибрюшного давления и стабилизации стенки живота.",
          "Не является главным двигателем сгибания или вращения туловища.",
        ]),
        innervationRu: "Передние ветви нижних грудных спинномозговых нервов и L1.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Нижние рёбра", "подвздошный гребень", "белая линия живота"]),
        relationsRu: Object.freeze(["Самый глубокий из трёх широких боковых мышечных слоёв живота."]),
      }),
      movementCueRu: "Карточка нужна для понимания глубокого мышечно-апоневротического слоя и контроля давления, а не как отдельная поверхностная мышца.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел III, 1.3 «Поперечная мышца живота»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-abdominal-wall", locator: "Transversus Abdominis", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked" }),
    }),

    Object.freeze({
      id: "rectus-abdominis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Прямая мышца живота",
        latin: "musculus rectus abdominis",
        modelAliases: Object.freeze(["rectus abdominis"]),
      }),
      subregions: Object.freeze(["anterior-abdominal-wall"]),
      layer: "superficial-within-rectus-sheath",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Лобковый гребень и область лобкового симфиза."]),
        insertionRu: Object.freeze(["Мечевидный отросток и хрящи V–VII рёбер."]),
        fiberDirectionRu: "Вертикальные мышечные пучки прерываются сухожильными перемычками.",
        actionsRu: Object.freeze([
          "Сгибает туловище при соответствующей фиксации таза.",
          "Участвует в заднем наклоне таза при фиксированной грудной клетке.",
          "Сжимает содержимое брюшной полости и участвует в создании внутрибрюшного давления.",
        ]),
        innervationRu: "Грудобрюшные нервы нижних грудных сегментов.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Белая линия живота", "рёберная дуга", "лобковая область"]),
        relationsRu: Object.freeze(["Заключена во влагалище прямой мышцы живота, образованное апоневрозами широких мышц."]),
      }),
      movementCueRu: "Сгибание туловища показывает общую функцию мышцы, но не требует максимального напряжения для анатомической ориентации.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "miology-igma-2018", locator: "Раздел III, 2 «Прямая мышца живота»", role: "teaching-source" }),
        Object.freeze({ sourceId: "ncbi-abdominal-wall", locator: "Anterolateral abdominal wall muscles", role: "verification" }),
        Object.freeze({ sourceId: "ncbi-anterolateral-abdominal-wall-nerves", locator: "Muscles", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-with-source-index-gap" }),
    }),

    Object.freeze({
      id: "pyramidalis",
      kind: "muscle",
      names: Object.freeze({
        ru: "Пирамидальная мышца",
        latin: "musculus pyramidalis",
        modelAliases: Object.freeze(["pyramidalis"]),
      }),
      subregions: Object.freeze(["lower-anterior-abdominal-wall"]),
      layer: "superficial-within-rectus-sheath",
      anatomy: Object.freeze({
        originRu: Object.freeze(["Лобковый гребень и область лобкового симфиза."]),
        insertionRu: Object.freeze(["Нижняя часть белой линии живота."]),
        fiberDirectionRu: "Короткие пучки идут вверх и медиально.",
        actionsRu: Object.freeze(["Натягивает белую линию живота."]),
        innervationRu: "Обычно подрёберный нерв T12.",
      }),
      surfaceMap: Object.freeze({
        landmarksRu: Object.freeze(["Лобковая область", "нижняя часть белой линии живота"]),
        relationsRu: Object.freeze(["Небольшая вариабельная мышца перед прямой мышцей живота в нижней части её влагалища; может отсутствовать."]),
      }),
      movementCueRu: "На базовом уровне достаточно знать о её вариабельности; отдельная практическая задача не требуется.",
      sources: Object.freeze([
        Object.freeze({ sourceId: "ncbi-anterolateral-abdominal-wall-nerves", locator: "Muscles; physiologic variants", role: "verification" }),
      ]),
      verification: Object.freeze({ status: "cross-checked-variant" }),
    }),
  ]),
});

export const THORAX_ABDOMEN_STRUCTURE_COUNT = THORAX_ABDOMEN_REGION.structures.length;

export function thoraxAbdomenStructureById(id) {
  return THORAX_ABDOMEN_REGION.structures.find((item) => item.id === id) || null;
}
