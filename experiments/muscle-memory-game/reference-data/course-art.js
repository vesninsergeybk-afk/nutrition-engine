const COURSE_ART_ROWS = Object.freeze({
  1: "./reference-data/assets/course-art/row-1.webp",
  2: "./reference-data/assets/course-art/row-2.webp",
  3: "./reference-data/assets/course-art/row-3.webp",
});

export const COURSE_ART_PRIMARY = Object.freeze([
  { structureId: "trapezius", sourceId: "course-method-back-lesson8", page: 1, row: 1, column: 0 },
  { structureId: "latissimus-dorsi", sourceId: "course-method-back-lesson8", page: 2, row: 1, column: 1 },
  { structureId: "levator-scapulae", sourceId: "course-method-back-lesson8", page: 3, row: 1, column: 2 },
  { structureId: "splenius-capitis", sourceId: "course-method-back-lesson8", page: 4, row: 1, column: 3 },
  { structureId: "splenius-cervicis", sourceId: "course-method-back-lesson8", page: 4, row: 1, column: 4 },
  { structureId: "gluteus-maximus", sourceId: "course-method-posterior-leg-lesson9", page: 1, row: 1, column: 5 },

  { structureId: "biceps-femoris", sourceId: "course-method-posterior-leg-lesson9", page: 2, row: 2, column: 0 },
  { structureId: "gastrocnemius", sourceId: "course-method-posterior-leg-lesson9", page: 3, row: 2, column: 1 },
  { structureId: "soleus", sourceId: "course-method-posterior-leg-lesson9", page: 3, row: 2, column: 2 },
  { structureId: "piriformis", sourceId: "course-method-anterior-leg-lesson15", page: 1, row: 2, column: 3 },
  { structureId: "tensor-fasciae-latae", sourceId: "course-method-anterior-leg-lesson15", page: 2, row: 2, column: 4 },
  { structureId: "adductor-magnus", sourceId: "course-method-anterior-leg-lesson15", page: 3, row: 2, column: 5 },

  { structureId: "adductor-longus", sourceId: "course-method-anterior-leg-lesson15", page: 3, row: 3, column: 0 },
  { structureId: "gracilis", sourceId: "course-method-anterior-leg-lesson15", page: 4, row: 3, column: 1 },
  { structureId: "sartorius", sourceId: "course-method-anterior-leg-lesson15", page: 4, row: 3, column: 2 },
  { structureId: "semitendinosus", sourceId: "course-method-anterior-leg-lesson15", page: 5, row: 3, column: 3 },
  { structureId: "tibialis-anterior", sourceId: "course-method-anterior-leg-lesson15", page: 5, row: 3, column: 4 },
  { structureId: "extensor-digitorum-longus", sourceId: "course-method-anterior-leg-lesson15", page: 6, row: 3, column: 5 },
].map((item) => Object.freeze({
  ...item,
  kind: "course-art-exact",
  match: "exact",
  spritePath: COURSE_ART_ROWS[item.row],
  spriteColumns: 6,
  locator: `стр. ${item.page}`,
})));

const COURSE_ART_BY_STRUCTURE = new Map(
  COURSE_ART_PRIMARY.map((item) => [item.structureId, item])
);

export function courseArtPrimaryForStructure(structureId) {
  return COURSE_ART_BY_STRUCTURE.get(structureId) || null;
}
