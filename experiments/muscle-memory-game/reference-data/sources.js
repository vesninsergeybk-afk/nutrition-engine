export const REFERENCE_SOURCES = Object.freeze({
  "miology-igma-2018": Object.freeze({
    title: "Растегаева Л. И., Козырева Е. А., Гомоюнова С. Л., Полякова О. Л. Миология",
    year: 2018,
    institution: "Ижевская государственная медицинская академия",
    role: "Основной учебный источник по миологии и топографии; факты требуют сверки при расхождениях",
    rights: Object.freeze({
      text: "Факты используются в пересказе; дословное копирование не требуется",
      illustrations: "review",
      note: "В пособии указано, что изображения мышц выполнены с препаратов кафедры, изображения мышц головы — с фабричных планшетов, схемы — Л. И. Растегаевой. Открытая лицензия не установлена.",
    }),
  }),

  "samusev-lipchenko-2003": Object.freeze({
    title: "Самусев Р. П., Липченко В. Я. Атлас анатомии человека",
    year: 2003,
    role: "Академическая контрольная точка для терминов, костных ориентиров и пространственных отношений",
    rights: Object.freeze({
      illustrations: "review",
      note: "Использовать для сверки; публичное воспроизведение иллюстраций требует отдельного основания.",
    }),
  }),

  "course-anatomy-map-m5": Object.freeze({
    title: "Модуль 5 — анатомическая карта и интеграция в занятия и видео",
    role: "Педагогический объём для верхней конечности и плечевого пояса",
    rights: Object.freeze({ text: "internal-project" }),
  }),

  "course-anatomy-map-m6": Object.freeze({
    title: "Модуль 6 — анатомическая карта и интеграция в занятия и видео",
    role: "Педагогический объём для спины, шеи, затылка и пояснично-крестцовой области",
    rights: Object.freeze({ text: "internal-project" }),
  }),

  "course-anatomy-map-m7": Object.freeze({
    title: "Модуль 7 — анатомическая карта и интеграция в занятия и видео",
    role: "Педагогический объём для нижней конечности",
    rights: Object.freeze({ text: "internal-project" }),
  }),

  "gray-1918-plate-392": Object.freeze({
    title: "Gray's Anatomy, plate 392 — external oblique / anterolateral trunk",
    year: 1918,
    role: "Проверенный кандидат для иллюстрации наружной косой мышцы и соседних поверхностных структур",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Gray392.png",
    rights: Object.freeze({
      illustrations: "public-domain",
      note: "Wikimedia Commons указывает Public Domain / PD-scan для конкретного файла.",
    }),
  }),

  "gray-1918-plate-409": Object.freeze({
    title: "Gray's Anatomy, plate 409 — posterior trunk / latissimus dorsi",
    year: 1918,
    role: "Проверенный кандидат для иллюстрации широчайшей мышцы спины",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Latissimus_dorsi_.PNG",
    rights: Object.freeze({
      illustrations: "public-domain",
      note: "Производное от Gray 1918; на странице Wikimedia Commons файл отмечен как Public Domain.",
    }),
  }),

  "gray-1918-plate-411": Object.freeze({
    title: "Gray's Anatomy, plate 411 — axillary and thoracic muscles",
    year: 1918,
    role: "Проверенный кандидат для иллюстрации передней зубчатой мышцы и соседних структур",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Gray411.png",
    rights: Object.freeze({
      illustrations: "public-domain",
      note: "Wikimedia Commons указывает Public Domain / PD-scan для конкретного файла.",
    }),
  }),

  "gray-1918-plate-378-masseter": Object.freeze({
    title: "Gray's Anatomy, plate 378 — masseter highlighted",
    year: 1918,
    role: "Проверенный кандидат для иллюстрации жевательной мышцы",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Gray_%E2%80%94_musculus_masseter.png",
    rights: Object.freeze({
      illustrations: "public-domain",
      note: "На странице Wikimedia Commons конкретный файл отмечен как Public Domain.",
    }),
  }),




  "ncbi-upper-limb-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Muscles",
    role: "Общая сверка мышц плеча, предплечья и кисти",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK482410/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-arm-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Arm Muscles",
    role: "Сверка передней и задней групп мышц плеча",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK554420/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-biceps": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Biceps Muscle",
    role: "Сверка двуглавой мышцы плеча, её сухожилий и основных функций",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK519538/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-forearm-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Forearm Muscles",
    role: "Сверка слоёв и состава переднего и заднего отделов предплечья",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK536975/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-upper-limb-nerves": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Arm Nerves",
    role: "Сверка моторной иннервации мышц плеча, предплечья и кисти",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK547735/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-hand-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Hand Muscles",
    role: "Сверка собственных мышц кисти",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK537229/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-hand-intrinsic": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Hand Intrinsic Muscles",
    role: "Сверка тенара, гипотенара, червеобразных и межкостных мышц",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK539810/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-hand-interossei": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Hand Interossei Muscles",
    role: "Сверка ладонных и тыльных межкостных мышц",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK534772/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "gray-forearm-extensors-public-domain": Object.freeze({
    title: "Gray anatomy — forearm extensor muscles and tendons",
    role: "Проверенный кандидат для иллюстрации задней группы предплечья",
    sourcePage: "https://www.ncbi.nlm.nih.gov/books/NBK534805/figure/article-31415.image.f1/",
    rights: Object.freeze({
      illustrations: "public-domain",
      note: "На странице NCBI изображение атрибутировано Henry Vandyke Carter, Public domain, via Wikimedia Commons."
    }),
  }),

  "ncbi-sternocleidomastoid": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck: Sternocleidomastoid Muscle",
    role: "Сверка прикреплений, функции и топографической роли грудино-ключично-сосцевидной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK532881/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-scalenes": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Scalenus Muscle",
    role: "Сверка лестничных мышц, их дыхательной и шейной функции и отношений с сосудисто-нервными структурами",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK519058/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-suprahyoid": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck: Suprahyoid Muscle",
    role: "Сверка надподъязычной группы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK546710/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-mylohyoid": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Mylohyoid Muscle",
    role: "Сверка мышц дна полости рта и надподъязычной группы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK545293/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-infrahyoid": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck: Anterior Cervical Region",
    role: "Сверка подподъязычных мышц, их прикреплений и иннервации",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK557475/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-sternohyoid": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Sternohyoid Muscle",
    role: "Сверка подподъязычной группы и ansa cervicalis",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK547693/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-prevertebral": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Prevertebral Muscles",
    role: "Сверка длинной мышцы шеи, длинной мышцы головы и передних прямых мышц головы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK560569/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-suboccipital": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Suboccipital Muscles",
    role: "Сверка состава, функций, иннервации и сосудистых отношений подзатылочной группы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK567762/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-mastication": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Mastication Muscles",
    role: "Сверка жевательной, височной и крыловидных мышц",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK541027/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-facial-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck: Facial Muscles",
    role: "Сверка мимических мышц и их общей иннервации лицевым нервом",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK493209/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-platysma": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Platysma",
    role: "Сверка подкожной мышцы шеи, её слоя, прикреплений и иннервации",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK545294/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-neck-movements": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Neck Movements",
    role: "Сверка совместной функции мышц шеи и границ упрощения «одна мышца — одно движение»",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK557555/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-thorax-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Thorax, Muscles",
    role: "Сверка грудных мышц, межрёберных мышц и диафрагмы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK538321/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-pectoralis-major": Object.freeze({
    title: "StatPearls: Anatomy, Thorax, Pectoralis Major",
    role: "Сверка большой грудной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK525991/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-pectoral-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Pectoral Muscles",
    role: "Сверка грудных мышц и подключичной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK545241/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-intercostal-wall": Object.freeze({
    title: "StatPearls: Anatomy, Thoracotomy and the Collateral Intercostal Neurovascular Bundle",
    role: "Сверка слоёв и функций межрёберных мышц",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK544368/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-diaphragm": Object.freeze({
    title: "StatPearls: Anatomy, Thorax: Diaphragm",
    role: "Сверка частей и прикреплений диафрагмы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK519558/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-abdominal-wall": Object.freeze({
    title: "StatPearls: Anatomy, Abdomen and Pelvis: Abdominal Wall",
    role: "Сверка мышц переднебоковой брюшной стенки",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK551649/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-anterolateral-abdominal-wall-nerves": Object.freeze({
    title: "StatPearls: Anatomy, Anterolateral Abdominal Wall Nerves",
    role: "Сверка состава и вариабельности мышц брюшной стенки",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK556034/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-trapezius": Object.freeze({
    title: "StatPearls: Anatomy, Back, Trapezius",
    role: "Сверка прикреплений, частей, функции и иннервации трапециевидной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK518994/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-rhomboids": Object.freeze({
    title: "StatPearls: Anatomy, Back, Rhomboid Muscles",
    role: "Сверка ромбовидных мышц, их функции и иннервации",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK534856/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-levator-scapulae": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Levator Scapulae Muscles",
    role: "Сверка прикреплений и функции мышцы, поднимающей лопатку",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK553120/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-shoulder-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Muscles",
    role: "Сверка дельтовидной мышцы и мышц плечевого сустава",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK482410/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-rotator-cuff": Object.freeze({
    title: "StatPearls: Anatomy, Rotator Cuff",
    role: "Сверка состава вращательной манжеты и её роли в динамической стабилизации плечевого сустава",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK441844/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-infraspinatus": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Infraspinatus Muscle",
    role: "Сверка прикреплений и функции подостной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK513255/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-subscapularis": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Subscapularis Muscle",
    role: "Сверка прикреплений и функции подлопаточной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK513344/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-teres-minor": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Teres Minor Muscle",
    role: "Сверка прикреплений и функции малой круглой мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK513324/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-teres-major": Object.freeze({
    title: "StatPearls: Anatomy, Shoulder and Upper Limb, Teres Major Muscle",
    role: "Сверка прикреплений и функции большой круглой мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK580487/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-back-muscles": Object.freeze({
    title: "StatPearls: Anatomy, Back, Muscles",
    role: "Сверка слоёв собственных мышц спины, erector spinae и transversospinalis",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK537074/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-quadratus-lumborum": Object.freeze({
    title: "StatPearls: Anatomy, Abdomen and Pelvis, Quadratus Lumborum",
    role: "Сверка прикреплений и функциональных оговорок квадратной мышцы поясницы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK535407/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "pubmed-serratus-posterior-function": Object.freeze({
    title: "Vilensky et al. Serratus posterior muscles: anatomy, clinical relevance, and function",
    year: 2001,
    role: "Проверка спорной традиционной трактовки задних зубчатых мышц как дыхательных",
    url: "https://pubmed.ncbi.nlm.nih.gov/11424195/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "kenhub-splenius-capitis": Object.freeze({
    title: "Kenhub: Splenius capitis muscle",
    role: "Сверка прикреплений и действий ременной мышцы головы",
    url: "https://www.kenhub.com/en/library/anatomy/splenius-capitis-muscle",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "kenhub-splenius-cervicis": Object.freeze({
    title: "Kenhub: Splenius cervicis muscle",
    role: "Сверка прикреплений и действий ременной мышцы шеи",
    url: "https://www.kenhub.com/en/library/anatomy/splenius-cervicis-muscle",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-latissimus-dorsi": Object.freeze({
    title: "StatPearls: Anatomy, Back, Latissimus Dorsi",
    role: "Современная сверка прикреплений и функций",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK448120/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-serratus-anterior": Object.freeze({
    title: "StatPearls: Anatomy, Thorax, Serratus Anterior Muscles",
    role: "Современная сверка прикреплений и функций",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK531457/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-anterolateral-abdominal-wall": Object.freeze({
    title: "StatPearls: Anatomy, Abdomen and Pelvis: Anterolateral Abdominal Wall Fascia",
    role: "Современная сверка наружной косой мышцы живота",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK459392/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-masseter": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Masseter Muscle",
    role: "Современная сверка жевательной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK539869/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),
});

export function referenceSource(sourceId) {
  return REFERENCE_SOURCES[sourceId] || null;
}
