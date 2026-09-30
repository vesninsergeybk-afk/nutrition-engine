// Functional units are distinct from canonical reference cards and 3D meshes.
// A part can oppose another part of the same muscle for one movement and
// cooperate for another. Do not infer a part's geometry from its parent.
export const FUNCTIONAL_PARTS = Object.freeze({
  trapezius: Object.freeze([
    Object.freeze({ id: "upper", nameRu: "Верхние (нисходящие) пучки", modelPattern: /descending|upper|superior|нисходящ|верхни/i, movementIds: Object.freeze(["scapula-elevation", "scapula-upward-rotation"]),
      noteRu: "При фиксированных голове и шее поднимают плечевой пояс. Во вращении лопатки вверх участвуют через ключицу, совместно с нижними пучками и передней зубчатой мышцей." }),
    Object.freeze({ id: "middle", nameRu: "Средние (поперечные) пучки", modelPattern: /transverse|middle|поперечн|средни/i, movementIds: Object.freeze(["scapula-retraction"]),
      noteRu: "При фиксированном позвоночнике приводят лопатку к позвоночнику. Стабилизация лопатки при подъёме руки не означает антагонизм ко всем действиям передней зубчатой мышцы." }),
    Object.freeze({ id: "lower", nameRu: "Нижние (восходящие) пучки", modelPattern: /ascending|lower|inferior|восходящ|нижни/i, movementIds: Object.freeze(["scapula-depression", "scapula-retraction", "scapula-upward-rotation"]),
      noteRu: "При фиксированном позвоночнике опускают плечевой пояс и участвуют в приведении лопатки. Во вращении вверх работают вместе с верхними пучками и передней зубчатой мышцей." }),
  ]),
  deltoid: Object.freeze([
    Object.freeze({ id: "anterior", nameRu: "Передняя (ключичная) часть", modelPattern: /anterior|clavicular|передн|ключичн/i, movementIds: Object.freeze(["shoulder-flexion", "shoulder-internal-rotation"]), noteRu: "Указаны основные действия передней части из проверенной карточки. Вклад зависит от положения плеча." }),
    Object.freeze({ id: "middle", nameRu: "Средняя (акромиальная) часть", modelPattern: /middle|acromial|средн|акромиальн/i, movementIds: Object.freeze(["shoulder-abduction"]), noteRu: "Преимущественно участвует в отведении плеча; движение выполняется совместно с другими мышцами плечевого комплекса." }),
    Object.freeze({ id: "posterior", nameRu: "Задняя (остистая) часть", modelPattern: /posterior|spinal|задн|остист/i, movementIds: Object.freeze(["shoulder-extension", "shoulder-external-rotation"]), noteRu: "Указаны основные действия задней части из проверенной карточки. Вклад зависит от положения плеча." }),
  ]),
});

export function functionalPartsForStructure(id) {
  return FUNCTIONAL_PARTS[id] || Object.freeze([]);
}

// Audited against the pinned Z-Anatomy kas.glb (37e85df…). Its four
// side-specific trapezius objects have reversed ascending/descending names:
// “Ascending” occupies y=1.416–1.574 (upper), “Descending” y=1.120–1.414
// (lower). Apply the correction only to these exact source objects; generic
// anatomical names and BodyParts3D naming retain their normal meaning.
const Z_TRAPEZIUS_PARTS = Object.freeze({
  "ascending part of trapezius muscle.l": "upper",
  "ascending part of trapezius muscle.r": "upper",
  "descending part of trapezius muscle.l": "lower",
  "descending part of trapezius muscle.r": "lower",
});

export function functionalPartForModelName(id, sourceName) {
  const sourceKey = String(sourceName || "").trim().toLocaleLowerCase("en-US");
  if (id === "trapezius" && Z_TRAPEZIUS_PARTS[sourceKey]) return Z_TRAPEZIUS_PARTS[sourceKey];
  return functionalPartsForStructure(id).find(part => part.modelPattern.test(sourceName || ""))?.id || null;
}
