import { REFERENCE_REGIONS } from "./regions/index.js";

const MOVEMENTS = Object.freeze([
  Object.freeze({ id:"shoulder-flexion", labelRu:"Сгибание плеча", opposite:"shoulder-extension", patterns:[/сгиба(?:ет|ют) плечо(?! назад)/i,/сгибание плеча/i,/передн(?:ее|его) сгибан/i] }),
  Object.freeze({ id:"shoulder-extension", labelRu:"Разгибание плеча", opposite:"shoulder-flexion", patterns:[/разгиба(?:ет|ют) плечо/i,/сгиба(?:ет|ют) плечо назад/i,/задн(?:ее|его) сгибан/i] }),
  Object.freeze({ id:"shoulder-abduction", labelRu:"Отведение плеча", opposite:"shoulder-adduction", patterns:[/отвод(?:ит|ят) плечо/i,/отведение плеча/i,/отведение руки/i] }),
  Object.freeze({ id:"shoulder-adduction", labelRu:"Приведение плеча", opposite:"shoulder-abduction", patterns:[/привод(?:ит|ят) плечо/i,/привод(?:ит|ят) .*конечност/i,/приведение плеча/i] }),
  Object.freeze({ id:"shoulder-internal-rotation", labelRu:"Внутреннее вращение плеча", opposite:"shoulder-external-rotation", patterns:[/враща(?:ет|ют) плечо внутр/i,/внутренн.*вращен.*плеч/i,/поворачива(?:ет|ют) плечо внутр/i] }),
  Object.freeze({ id:"shoulder-external-rotation", labelRu:"Наружное вращение плеча", opposite:"shoulder-internal-rotation", patterns:[/враща(?:ет|ют) плечо наруж/i,/наружн.*вращен.*плеч/i,/поворачива(?:ет|ют) плечо наруж/i] }),

  Object.freeze({ id:"scapula-elevation", labelRu:"Подъём лопатки", opposite:"scapula-depression", patterns:[/поднима(?:ет|ют) лопатк/i,/поднима(?:ет|ют) плечев.*пояс/i] }),
  Object.freeze({ id:"scapula-depression", labelRu:"Опускание лопатки", opposite:"scapula-elevation", patterns:[/опуска(?:ет|ют) лопатк/i,/опуска(?:ет|ют) плечев.*пояс/i] }),
  Object.freeze({ id:"scapula-retraction", labelRu:"Приведение лопатки", opposite:"scapula-protraction", patterns:[/привод(?:ит|ят) лопатку/i,/приближа(?:ет|ют) лопатку к позвоноч/i,/сведен.*лопат/i] }),
  Object.freeze({ id:"scapula-protraction", labelRu:"Отведение лопатки", opposite:"scapula-retraction", patterns:[/отвод(?:ит|ят) лопатку/i,/смеща(?:ет|ют) лопатку латераль/i,/протракц/i] }),
  Object.freeze({ id:"scapula-upward-rotation", labelRu:"Вращение лопатки вверх", opposite:"scapula-downward-rotation", patterns:[/вращен.*лопатк.*вверх/i,/враща(?:ет|ют) лопатку вверх/i] }),
  Object.freeze({ id:"scapula-downward-rotation", labelRu:"Вращение лопатки вниз", opposite:"scapula-upward-rotation", patterns:[/вращен.*лопатк.*вниз/i,/враща(?:ет|ют) лопатку вниз/i] }),

  Object.freeze({ id:"elbow-flexion", labelRu:"Сгибание предплечья", opposite:"elbow-extension", patterns:[/сгиба(?:ет|ют) предплечье/i,/сгиба(?:ет|ют) локт/i] }),
  Object.freeze({ id:"elbow-extension", labelRu:"Разгибание предплечья", opposite:"elbow-flexion", patterns:[/разгиба(?:ет|ют) предплечье/i,/разгиба(?:ет|ют) локт/i] }),
  Object.freeze({ id:"forearm-pronation", labelRu:"Пронация предплечья", opposite:"forearm-supination", patterns:[/прониру(?:ет|ют) .*предплеч/i,/пронац.*предплеч/i,/враща(?:ет|ют) лучевую кость внутр/i] }),
  Object.freeze({ id:"forearm-supination", labelRu:"Супинация предплечья", opposite:"forearm-pronation", patterns:[/супиниру(?:ет|ют) предплеч/i,/супинац.*предплеч/i] }),

  Object.freeze({ id:"wrist-flexion", labelRu:"Сгибание кисти", opposite:"wrist-extension", patterns:[/сгиба(?:ет|ют) кисть/i,/ладонн.*сгибан/i] }),
  Object.freeze({ id:"wrist-extension", labelRu:"Разгибание кисти", opposite:"wrist-flexion", patterns:[/разгиба(?:ет|ют) кисть/i,/тыльн.*сгибан/i] }),
  Object.freeze({ id:"wrist-radial-deviation", labelRu:"Отведение кисти в лучевую сторону", opposite:"wrist-ulnar-deviation", patterns:[/отвод(?:ит|ят) кисть/i,/лучев.*отведен.*кист/i] }),
  Object.freeze({ id:"wrist-ulnar-deviation", labelRu:"Приведение кисти в локтевую сторону", opposite:"wrist-radial-deviation", patterns:[/привод(?:ит|ят) кисть/i,/локтев.*отведен.*кист/i] }),

  Object.freeze({ id:"hip-flexion", labelRu:"Сгибание бедра", opposite:"hip-extension", patterns:[/сгиба(?:ет|ют) бедро(?! назад)/i,/сгибание бедра/i] }),
  Object.freeze({ id:"hip-extension", labelRu:"Разгибание бедра", opposite:"hip-flexion", patterns:[/разгиба(?:ет|ют) бедро/i,/сгиба(?:ет|ют) бедро назад/i] }),
  Object.freeze({ id:"hip-abduction", labelRu:"Отведение бедра", opposite:"hip-adduction", patterns:[/отвод(?:ит|ят) бедро/i,/отведение бедра/i] }),
  Object.freeze({ id:"hip-adduction", labelRu:"Приведение бедра", opposite:"hip-abduction", patterns:[/привод(?:ит|ят) бедро/i,/приведение бедра/i] }),
  Object.freeze({ id:"hip-internal-rotation", labelRu:"Внутреннее вращение бедра", opposite:"hip-external-rotation", patterns:[/враща(?:ет|ют) бедро внутр/i,/внутренн.*вращен.*бедр/i] }),
  Object.freeze({ id:"hip-external-rotation", labelRu:"Наружное вращение бедра", opposite:"hip-internal-rotation", patterns:[/враща(?:ет|ют) бедро наруж/i,/наружн.*вращен.*бедр/i] }),

  Object.freeze({ id:"knee-flexion", labelRu:"Сгибание колена", opposite:"knee-extension", patterns:[/сгиба(?:ет|ют) колен/i,/сгиба(?:ет|ют) голень/i] }),
  Object.freeze({ id:"knee-extension", labelRu:"Разгибание колена", opposite:"knee-flexion", patterns:[/разгиба(?:ет|ют) колен/i,/разгиба(?:ет|ют) голень/i] }),

  Object.freeze({ id:"ankle-dorsiflexion", labelRu:"Тыльное сгибание стопы", opposite:"ankle-plantarflexion", patterns:[/тыльно сгиба(?:ет|ют) стоп/i,/тыльн.*сгибан.*стоп/i] }),
  Object.freeze({ id:"ankle-plantarflexion", labelRu:"Подошвенное сгибание стопы", opposite:"ankle-dorsiflexion", patterns:[/подошвенно сгиба(?:ет|ют) стоп/i,/подошвен.*сгибан.*стоп/i] }),
  Object.freeze({ id:"foot-inversion", labelRu:"Инверсия стопы", opposite:"foot-eversion", patterns:[/инвертиру(?:ет|ют) стоп/i,/инверси.*стоп/i,/супиниру(?:ет|ют) стоп/i] }),
  Object.freeze({ id:"foot-eversion", labelRu:"Эверсия стопы", opposite:"foot-inversion", patterns:[/эвертиру(?:ет|ют) стоп/i,/эверси.*стоп/i,/прониру(?:ет|ют) стоп/i] }),

  Object.freeze({ id:"trunk-flexion", labelRu:"Сгибание туловища", opposite:"trunk-extension", patterns:[/сгиба(?:ет|ют) туловищ/i,/сгиба(?:ет|ют) позвоночн/i] }),
  Object.freeze({ id:"trunk-extension", labelRu:"Разгибание туловища", opposite:"trunk-flexion", patterns:[/разгиба(?:ет|ют) туловищ/i,/разгиба(?:ет|ют) позвоночн/i] }),

  Object.freeze({ id:"jaw-elevation", labelRu:"Поднимание нижней челюсти", opposite:"jaw-depression", patterns:[/поднима(?:ет|ют) нижн.*челюст/i,/закрыва(?:ет|ют) рот/i] }),
  Object.freeze({ id:"jaw-depression", labelRu:"Опускание нижней челюсти", opposite:"jaw-elevation", patterns:[/опуска(?:ет|ют) нижн.*челюст/i,/открыва(?:ет|ют) рот/i] }),
  Object.freeze({ id:"jaw-protraction", labelRu:"Выдвижение нижней челюсти", opposite:"jaw-retraction", patterns:[/выдвига(?:ет|ют) нижн.*челюст/i,/протракц.*челюст/i] }),
  Object.freeze({ id:"jaw-retraction", labelRu:"Смещение нижней челюсти назад", opposite:"jaw-protraction", patterns:[/смеща(?:ет|ют) нижн.*челюст назад/i,/тян(?:ет|ут) нижн.*челюст назад/i,/ретракц.*челюст/i] }),
]);

const movementById = new Map(MOVEMENTS.map(item => [item.id, item]));
const structures = [];
const structureById = new Map();

for (const region of REFERENCE_REGIONS) {
  for (const structure of region.structures || []) {
    const item = { region, structure };
    structures.push(item);
    structureById.set(structure.id, item);
  }
}

function actionText(structure) {
  return (structure.anatomy?.actionsRu || []).join(" ");
}

function movementIdsFor(structure) {
  const text = actionText(structure);
  const ids = [];
  for (const movement of MOVEMENTS) {
    if (movement.patterns.some(pattern => pattern.test(text))) ids.push(movement.id);
  }
  return ids;
}

const membership = new Map();
for (const item of structures) {
  const ids = movementIdsFor(item.structure);
  for (const movementId of ids) {
    if (!membership.has(movementId)) membership.set(movementId, []);
    membership.get(movementId).push(item.structure.id);
  }
}

function displayName(id) {
  return structureById.get(id)?.structure?.names?.ru || id;
}

const CURATED_FUNCTIONAL_RELATIONS = Object.freeze({
  "levator-ani": Object.freeze([
    Object.freeze({
      movementId: "pelvic-floor-support",
      movementRu: "Поддержка и подъём тазового дна",
      synergistIds: Object.freeze(["coccygeus"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Coccygeus дополняет levator ani в составе тазовой диафрагмы; отдельную прямую мышцу-антагонист для этой опорной функции обычно не выделяют.",
    }),
  ]),
  "puborectalis": Object.freeze([
    Object.freeze({
      movementId: "pelvic-floor-support",
      movementRu: "Поддержка тазового дна",
      synergistIds: Object.freeze(["pubococcygeus", "iliococcygeus", "coccygeus"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Puborectalis является частью интегрированного комплекса levator ani; расслабление при дефекации не является действием отдельной мышцы-антагониста.",
    }),
    Object.freeze({
      movementId: "anal-continence",
      movementRu: "Поддержание анальной континенции",
      synergistIds: Object.freeze(["external-anal-sphincter"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Puborectalis поддерживает аноректальный угол и действует совместно со сфинктерным аппаратом; отдельную поперечнополосатую мышцу-антагонист здесь не выделяют.",
    }),
  ]),
  "pubococcygeus": Object.freeze([
    Object.freeze({
      movementId: "pelvic-floor-support",
      movementRu: "Поддержка и подъём тазового дна",
      synergistIds: Object.freeze(["puborectalis", "iliococcygeus", "coccygeus"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Pubococcygeus действует совместно с другими компонентами levator ani и coccygeus; прямой мышечный антагонист для общей опорной функции не выделяется.",
    }),
  ]),
  "iliococcygeus": Object.freeze([
    Object.freeze({
      movementId: "pelvic-floor-support",
      movementRu: "Поддержка и стабилизация тазового дна",
      synergistIds: Object.freeze(["puborectalis", "pubococcygeus", "coccygeus"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Iliococcygeus входит в интегрированный комплекс levator ani и совместно с coccygeus поддерживает тазовую диафрагму; отдельную прямую мышцу-антагонист для этой опорной функции обычно не выделяют.",
    }),
  ]),
  "coccygeus": Object.freeze([
    Object.freeze({
      movementId: "pelvic-floor-support",
      movementRu: "Поддержка и подъём тазового дна",
      synergistIds: Object.freeze(["puborectalis", "pubococcygeus", "iliococcygeus"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Coccygeus функционально дополняет levator ani; для этой опорной функции отдельную прямую мышцу-антагонист обычно не выделяют.",
    }),
  ]),
  "pubo-analis": Object.freeze([
    Object.freeze({
      movementId: "anorectal-support",
      movementRu: "Аноректальная поддержка",
      synergistIds: Object.freeze(["puborectalis"]),
      antagonistIds: Object.freeze([]),
      noteRu: "Puboanalis и puborectalis участвуют в общей аноректальной поддержке как разные подчасти levator ani; это функциональное сотрудничество, а не простая пара агонист–антагонист. Отдельную прямую мышцу-антагонист для puboanalis не выделяют.",
    }),
  ]),
  "deep-transverse-perineal": Object.freeze([
    Object.freeze({
      movementId: "deep-perineal-support",
      movementRu: "Предполагаемая поддержка урогенитального треугольника",
      synergistIds: Object.freeze([]),
      antagonistIds: Object.freeze([]),
      noteRu: "Для спорной структуры, традиционно называемой deep transverse perineal muscle, достоверные прямые синергисты и антагонисты не установлены. Современные данные пересматривают саму её тканевую природу и самостоятельность.",
    }),
  ]),
});

function relatedItems(ids) {
  return Object.freeze(
    (ids || []).map(id =>
      Object.freeze({
        id,
        nameRu: displayName(id),
      })
    )
  );
}

function curatedFunctionalRelationsForStructure(structureId) {
  return Object.freeze(
    (CURATED_FUNCTIONAL_RELATIONS[structureId] || []).map(row =>
      Object.freeze({
        movementId: row.movementId,
        movementRu: row.movementRu,
        synergists: relatedItems(row.synergistIds),
        antagonists: relatedItems(row.antagonistIds),
        contextDependent: Object.freeze([]),
        method: "curated-from-verified-pelvic-floor-function",
        noteRu: row.noteRu,
      })
    )
  );
}

export function functionalRelationsForStructure(structureId) {
  const current = structureById.get(structureId);
  if (!current) return Object.freeze([]);

  const movementIds = movementIdsFor(current.structure);
  const rows = [...curatedFunctionalRelationsForStructure(structureId)];

  for (const movementId of movementIds) {
    const movement = movementById.get(movementId);
    if (!movement) continue;

    const rawSynergistIds = (membership.get(movementId) || [])
      .filter(id => id !== structureId);
    const rawAntagonistIds = movement.opposite
      ? (membership.get(movement.opposite) || []).filter(id => id !== structureId)
      : [];

    // Whole-muscle cards can legitimately contain actions of different parts.
    // Example: anterior deltoid contributes to internal rotation, while the
    // posterior part contributes to external rotation. Such a structure must
    // not be presented as both a synergist and antagonist in the same row.
    const antagonistSet = new Set(rawAntagonistIds);
    const contextDependentIds = rawSynergistIds.filter(id =>
      antagonistSet.has(id)
    );
    const contextDependentSet = new Set(contextDependentIds);
    const synergistIds = rawSynergistIds.filter(
      id => !contextDependentSet.has(id)
    );
    const antagonistIds = rawAntagonistIds.filter(
      id => !contextDependentSet.has(id)
    );

    if (
      !synergistIds.length &&
      !antagonistIds.length &&
      !contextDependentIds.length
    ) continue;

    rows.push(Object.freeze({
      movementId,
      movementRu: movement.labelRu,
      synergists: relatedItems(synergistIds),
      antagonists: relatedItems(antagonistIds),
      contextDependent: relatedItems(contextDependentIds),
      method: "derived-from-verified-actions",
      noteRu:
        "Связи показаны для указанного движения. Для мышц с функционально различающимися частями роль вынесена отдельно; она также меняется с положением сустава и задачей.",
    }));
  }

  return Object.freeze(rows);
}

export function functionalRelationsCoverage() {
  const withRelations = structures.filter(
    item => functionalRelationsForStructure(item.structure.id).length > 0
  );
  return Object.freeze({
    canonicalStructures: structures.length,
    structuresWithFunctionalRelations: withRelations.length,
    movementClasses: MOVEMENTS.length,
  });
}
