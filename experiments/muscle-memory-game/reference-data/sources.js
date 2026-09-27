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

  "ncbi-latissimus-dorsi": Object.freeze({
    title: "StatPearls: Anatomy, Back, Latissimus Dorsi",
    role: "Современная сверка прикреплений и функций",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK448120/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-serratus-anterior": Object.freeze({
    title: "StatPearls: Anatomy, Thorax, Serratus Anterior Muscles",
    role: "Современная сверка прикреплений и функций",
    url: "https://www.ncbi.nlm.nih.gov/books/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-anterolateral-abdominal-wall": Object.freeze({
    title: "StatPearls: Anatomy, Abdomen and Pelvis: Anterolateral Abdominal Wall Fascia",
    role: "Современная сверка наружной косой мышцы живота",
    url: "https://www.ncbi.nlm.nih.gov/books/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),

  "ncbi-masseter": Object.freeze({
    title: "StatPearls: Anatomy, Head and Neck, Masseter Muscle",
    role: "Современная сверка жевательной мышцы",
    url: "https://www.ncbi.nlm.nih.gov/books/",
    rights: Object.freeze({ illustrations: "not-assumed" }),
  }),
});

export function referenceSource(sourceId) {
  return REFERENCE_SOURCES[sourceId] || null;
}
