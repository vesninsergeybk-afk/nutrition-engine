const KIND_LABELS_RU = Object.freeze({
  muscle: "мышца",
  "muscle-group": "группа мышц",
  "muscle-complex": "мышечный комплекс",
  "muscle-part": "часть мышцы",
  "variable-muscle": "вариабельная мышца",
  "variable-muscle-part": "вариабельная часть мышцы",
  "controversial-muscular-structure": "анатомически спорная мышечная структура",
});

function depthLabelRu(layer) {
  const value = String(layer || "");
  if (!value) return null;
  if (value.includes("most-superficial")) return "самый поверхностный слой";
  if (value.includes("superficial")) return "поверхностный слой";
  if (value.includes("deepest")) return "самый глубокий слой";
  if (value.includes("deep")) return "глубокий слой";
  if (value.includes("intermediate")) return "промежуточный слой";
  return null;
}

function badgesRu(structure) {
  const badges = [];
  if (String(structure.kind || "").includes("variable")) badges.push("вариабельность");
  if (String(structure.kind || "").includes("part")) badges.push("часть более крупной мышцы");
  if (structure.kind === "controversial-muscular-structure") badges.push("анатомическая дискуссия");
  if (structure.verification?.status?.includes("caution")) badges.push("функция требует осторожной интерпретации");
  return badges;
}

export const REFERENCE_CARD_SECTION_ORDER = Object.freeze([
  "actions",
  "attachments",
  "orientation",
  "landmarks",
  "relations",
  "innervation",
  "studyCue",
  "sources",
]);

export const REFERENCE_CARD_LABELS_RU = Object.freeze({
  actions: "Основные действия",
  attachments: "Начало и прикрепление",
  orientation: "Направление волокон",
  landmarks: "Костные и поверхностные ориентиры",
  relations: "Что находится рядом",
  innervation: "Иннервация",
  studyCue: "Ориентир для изучения",
  sources: "Источники и проверка",
});

export function referenceCardView(region, structure) {
  const actions = structure.anatomy?.actionsRu || [];
  return Object.freeze({
    id: structure.id,
    titleRu: structure.names?.ru || structure.id,
    latin: structure.names?.latin || null,
    regionRu: region?.nameRu || null,
    typeRu: KIND_LABELS_RU[structure.kind] || "мышечная структура",
    depthRu: depthLabelRu(structure.layer),
    badgesRu: Object.freeze(badgesRu(structure)),
    sections: Object.freeze({
      actions: Object.freeze(actions),
      attachments: Object.freeze({
        originRu: Object.freeze(structure.anatomy?.originRu || []),
        insertionRu: Object.freeze(structure.anatomy?.insertionRu || []),
      }),
      orientation: structure.anatomy?.fiberDirectionRu || null,
      landmarks: Object.freeze(structure.surfaceMap?.landmarksRu || []),
      relations: Object.freeze(structure.surfaceMap?.relationsRu || []),
      innervation: structure.anatomy?.innervationRu || null,
      studyCue: structure.movementCueRu || null,
      sources: Object.freeze(structure.sources || []),
    }),
  });
}
