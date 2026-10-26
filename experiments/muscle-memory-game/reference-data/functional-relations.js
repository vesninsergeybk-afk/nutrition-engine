import { REFERENCE_REGIONS } from "./regions/index.js";
import { functionalPartsForStructure } from "./functional-parts.js";

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

  Object.freeze({ id:"elbow-flexion", labelRu:"Сгибание предплечья", opposite:"elbow-extension", patterns:[/сгиба(?:ет|ют) предплечье/i,/сгиба(?:ет|ют) локт/i,/основной сгибатель предплечья/i] }),
  Object.freeze({ id:"elbow-extension", labelRu:"Разгибание предплечья", opposite:"elbow-flexion", patterns:[/разгиба(?:ет|ют) предплечье/i,/разгиба(?:ет|ют) локт/i] }),
  Object.freeze({ id:"forearm-pronation", labelRu:"Пронация предплечья", opposite:"forearm-supination", patterns:[/прониру(?:ет|ют) .*предплеч/i,/пронац.*предплеч/i,/враща(?:ет|ют) лучевую кость внутр/i] }),
  Object.freeze({ id:"forearm-supination", labelRu:"Супинация предплечья", opposite:"forearm-pronation", patterns:[/супиниру(?:ет|ют) предплеч/i,/супинац.*предплеч/i] }),

  Object.freeze({ id:"wrist-flexion", labelRu:"Сгибание кисти", opposite:"wrist-extension", patterns:[/сгиба(?:ет|ют) кисть/i,/ладонн.*сгибан/i] }),
  Object.freeze({ id:"wrist-extension", labelRu:"Разгибание кисти", opposite:"wrist-flexion", patterns:[/разгиба(?:ет|ют) кисть/i,/тыльн.*сгибан/i] }),
  Object.freeze({ id:"wrist-radial-deviation", labelRu:"Отведение кисти в лучевую сторону", opposite:"wrist-ulnar-deviation", patterns:[/отвод(?:ит|ят) кисть/i,/лучев.*отведен.*кист/i] }),
  Object.freeze({ id:"wrist-ulnar-deviation", labelRu:"Приведение кисти в локтевую сторону", opposite:"wrist-radial-deviation", patterns:[/привод(?:ит|ят) кисть/i,/локтев.*отведен.*кист/i] }),

  // Small joints require precise, curated assignments: generic searches for
  // "finger flexion" would incorrectly merge MCP, PIP and DIP actions.
  Object.freeze({ id:"hand-mcp-flexion", labelRu:"Сгибание пальцев II–V в пястно-фаланговых суставах", opposite:"hand-mcp-extension", patterns:[] }),
  Object.freeze({ id:"hand-mcp-extension", labelRu:"Разгибание пальцев II–V в пястно-фаланговых суставах", opposite:"hand-mcp-flexion", patterns:[] }),
  Object.freeze({ id:"hand-pip-flexion", labelRu:"Сгибание пальцев II–V в проксимальных межфаланговых суставах", opposite:"hand-pip-extension", patterns:[] }),
  Object.freeze({ id:"hand-pip-extension", labelRu:"Разгибание пальцев II–V в проксимальных межфаланговых суставах", opposite:"hand-pip-flexion", patterns:[] }),
  Object.freeze({ id:"hand-dip-flexion", labelRu:"Сгибание пальцев II–V в дистальных межфаланговых суставах", opposite:"hand-dip-extension", patterns:[] }),
  Object.freeze({ id:"hand-dip-extension", labelRu:"Разгибание пальцев II–V в дистальных межфаланговых суставах", opposite:"hand-dip-flexion", patterns:[] }),
  Object.freeze({ id:"thumb-mcp-flexion", labelRu:"Сгибание большого пальца кисти в пястно-фаланговом суставе", opposite:"thumb-mcp-extension", patterns:[] }),
  Object.freeze({ id:"thumb-mcp-extension", labelRu:"Разгибание большого пальца кисти в пястно-фаланговом суставе", opposite:"thumb-mcp-flexion", patterns:[] }),
  Object.freeze({ id:"thumb-ip-flexion", labelRu:"Сгибание большого пальца кисти в межфаланговом суставе", opposite:"thumb-ip-extension", patterns:[] }),
  Object.freeze({ id:"thumb-ip-extension", labelRu:"Разгибание большого пальца кисти в межфаланговом суставе", opposite:"thumb-ip-flexion", patterns:[] }),

  Object.freeze({ id:"toe-mtp-flexion", labelRu:"Сгибание пальцев II–V стопы в плюснефаланговых суставах", opposite:"toe-mtp-extension", patterns:[] }),
  Object.freeze({ id:"toe-mtp-extension", labelRu:"Разгибание пальцев II–V стопы в плюснефаланговых суставах", opposite:"toe-mtp-flexion", patterns:[] }),
  Object.freeze({ id:"hallux-mtp-flexion", labelRu:"Сгибание большого пальца стопы в плюснефаланговом суставе", opposite:"hallux-mtp-extension", patterns:[] }),
  Object.freeze({ id:"hallux-mtp-extension", labelRu:"Разгибание большого пальца стопы в плюснефаланговом суставе", opposite:"hallux-mtp-flexion", patterns:[] }),
  Object.freeze({ id:"hallux-ip-flexion", labelRu:"Сгибание большого пальца стопы в межфаланговом суставе", opposite:"hallux-ip-extension", patterns:[] }),
  Object.freeze({ id:"hallux-ip-extension", labelRu:"Разгибание большого пальца стопы в межфаланговом суставе", opposite:"hallux-ip-flexion", patterns:[] }),

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

  Object.freeze({ id:"trunk-flexion", labelRu:"Сгибание туловища", opposite:"trunk-extension", patterns:[/сгиба(?:ет|ют) туловищ/i,/сгиба(?:ет|ют) позвоночн/i,/участву(?:ет|ют) в сгибании туловища/i] }),
  Object.freeze({ id:"trunk-extension", labelRu:"Разгибание позвоночника", opposite:"trunk-flexion", patterns:[/разгиба(?:ет|ют) туловищ/i,/разгиба(?:ет|ют) позвоночн/i,/участву(?:ет|ют) в разгибании позвоночника/i,/помога(?:ет|ют) разгибанию (?:шейного и поясничного отделов|и контралатеральной ротации)/i] }),

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

// Match inflected Russian nouns as well as verbs. Work on one fact at a
// time so a rotation in one sentence cannot borrow a joint from another.
const ACTION_FORMS = Object.freeze({
  "shoulder-flexion": /сгибани[еяию] плеча/i,
  "shoulder-extension": /разгибани[еяию] плеча|разгибать плечо/i,
  "shoulder-abduction": /отведени[еяию] плеча/i,
  "shoulder-adduction": /приведени[еяию] плеча/i,
  "shoulder-external-rotation": /наружн\S* враща(?:ет|ют) плечо/i,
  "shoulder-internal-rotation": /внутренн\S* враща(?:ет|ют) плечо/i,
  "scapula-protraction": /тянет лопатку впер[её]д/i,
  "scapula-depression": /тянет лопатку впер[её]д и вниз/i,
  "elbow-flexion": /сгибани[еяию] предплечья|сгибани[еяию] в локтевом суставе/i,
  "elbow-extension": /разгибани[еяию] предплечья|разгибани[еяию] в локтевом суставе/i,
  "wrist-flexion": /сгибани[еяию] кисти/i,
  "wrist-extension": /разгибани[еяию] кисти/i,
  "hip-flexion": /сгибани[еяию] бедра/i,
  "hip-extension": /разгибани[еяию] бедра/i,
  "hip-abduction": /отведени[еяию] бедра/i,
  "hip-adduction": /приведени[еяию] бедра/i,
  "knee-flexion": /сгибани[еяию] колена|сгибани[еяию] голени/i,
  "knee-extension": /разгибани[еяию] колена|разгибани[еяию] голени/i,
});

// Reviewed against the joint-specific actions in the canonical reference cards.
// Each list concerns the indicated joint, not every movement of the digit.
const CURATED_MOVEMENT_ASSIGNMENTS = Object.freeze({
  "flexor-digitorum-superficialis": ["hand-mcp-flexion", "hand-pip-flexion"],
  "flexor-digitorum-profundus": ["hand-mcp-flexion", "hand-pip-flexion", "hand-dip-flexion"],
  "extensor-digitorum": ["hand-mcp-extension", "hand-pip-extension", "hand-dip-extension"],
  "extensor-indicis": ["hand-mcp-extension"],
  "extensor-digiti-minimi": ["hand-mcp-extension"],
  "lumbricals-hand": ["hand-mcp-flexion", "hand-pip-extension", "hand-dip-extension"],
  "palmar-interossei": ["hand-mcp-flexion", "hand-pip-extension", "hand-dip-extension"],
  "dorsal-interossei": ["hand-mcp-flexion", "hand-pip-extension", "hand-dip-extension"],
  "flexor-pollicis-longus": ["thumb-mcp-flexion", "thumb-ip-flexion"],
  "flexor-pollicis-brevis": ["thumb-mcp-flexion"],
  "extensor-pollicis-longus": ["thumb-mcp-extension", "thumb-ip-extension"],
  "extensor-pollicis-brevis": ["thumb-mcp-extension"],
  "flexor-digiti-minimi-brevis-hand": ["hand-mcp-flexion"],
  "abductor-digiti-minimi-hand": ["hand-mcp-flexion"],

  "flexor-digitorum-longus-foot": ["toe-mtp-flexion"],
  "flexor-digitorum-brevis-foot": ["toe-mtp-flexion"],
  "extensor-digitorum-longus": ["toe-mtp-extension"],
  "extensor-digitorum-brevis-foot": ["toe-mtp-extension"],
  "lumbricals-foot": ["toe-mtp-flexion"],
  "plantar-interossei-foot": ["toe-mtp-flexion"],
  "dorsal-interossei-foot": ["toe-mtp-flexion"],
  "flexor-hallucis-longus-foot": ["hallux-ip-flexion", "hallux-mtp-flexion"],
  "flexor-hallucis-brevis": ["hallux-mtp-flexion"],
  "abductor-hallucis": ["hallux-mtp-flexion"],
  "adductor-hallucis": ["hallux-mtp-flexion"],
  "extensor-hallucis-longus": ["hallux-ip-extension", "hallux-mtp-extension"],
  "extensor-hallucis-brevis-foot": ["hallux-mtp-extension"],
  "quadratus-plantae": ["toe-mtp-flexion"],
  "flexor-digiti-minimi-brevis-foot": ["toe-mtp-flexion"],
  "abductor-digiti-minimi-foot": ["toe-mtp-flexion"],
});

const MOVEMENT_CONTEXT_NOTES = Object.freeze({
  hand: "Указано движение конкретного сустава. Мышцы могут действовать на разные пальцы и через разгибательный аппарат; совпадение в списке не означает равной силы или одновременного участия во всех пальцах.",
  thumb: "Речь о конкретном суставе большого пальца. Роль мышцы меняется с положением пальца и сочетанием движений.",
  toe: "Показано общее направление действия для указанных суставов. Мышцы действуют на разные пальцы и могут одновременно поддерживать своды стопы.",
  hallux: "Роль мышцы зависит от сустава, положения большого пальца и опоры стопы.",
});

function jointSpecificNote(movementId) {
  const scope = movementId.split("-")[0];
  return MOVEMENT_CONTEXT_NOTES[scope] || null;
}

function movementIdsFor(structure) {
  const facts = structure.anatomy?.actionsRu || [];
  const reviewed = CURATED_MOVEMENT_ASSIGNMENTS[structure.id] || [];
  return MOVEMENTS.filter(movement => reviewed.includes(movement.id) || facts.some(text =>
    movement.patterns.some(pattern => pattern.test(text)) || ACTION_FORMS[movement.id]?.test(text)
  )).map(movement => movement.id);
}

const membership = new Map();
const functionalUnits = new Map();
for (const item of structures) {
  const parts = functionalPartsForStructure(item.structure.id);
  const units = parts.length ? parts : [{ id: null, movementIds: movementIdsFor(item.structure) }];
  for (const part of units) {
    const key = part.id ? `${item.structure.id}::${part.id}` : item.structure.id;
    functionalUnits.set(key, { structureId: item.structure.id, part });
    for (const movementId of part.movementIds) {
      if (!membership.has(movementId)) membership.set(movementId, []);
      membership.get(movementId).push(key);
    }
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
  // Eye movements are position-dependent: derive neither torsion nor vertical
  // roles from a bare word search across all eye-muscle action descriptions.
  "medial-rectus": Object.freeze([
    Object.freeze({ movementId: "eye-adduction", movementRu: "Приведение глазного яблока", synergistIds: Object.freeze([]), antagonistIds: Object.freeze(["lateral-rectus"]), method: "curated-eye-movement", noteRu: "Медиальная и латеральная прямые мышцы образуют основную противоположно действующую пару для горизонтального движения одного глаза. Другие мышцы могут влиять на положение глаза, но не приравниваются к этой паре." }),
  ]),
  "lateral-rectus": Object.freeze([
    Object.freeze({ movementId: "eye-abduction", movementRu: "Отведение глазного яблока", synergistIds: Object.freeze([]), antagonistIds: Object.freeze(["medial-rectus"]), method: "curated-eye-movement", noteRu: "Латеральная и медиальная прямые мышцы образуют основную противоположно действующую пару для горизонтального движения одного глаза." }),
  ]),
  "superior-rectus": Object.freeze([
    Object.freeze({ movementId: "eye-elevation", movementRu: "Подъём глазного яблока", synergistIds: Object.freeze(["inferior-oblique-eye"]), antagonistIds: Object.freeze(["inferior-rectus", "superior-oblique-eye"]), method: "curated-eye-movement", noteRu: "В первичном положении глаза верхняя прямая и нижняя косая мышцы участвуют в подъёме. При отведённом глазе вклад верхней прямой возрастает. У мышцы есть также действия вращения вокруг зрительной оси и приведения." }),
  ]),
  "inferior-oblique-eye": Object.freeze([
    Object.freeze({ movementId: "eye-elevation", movementRu: "Подъём глазного яблока", synergistIds: Object.freeze(["superior-rectus"]), antagonistIds: Object.freeze(["inferior-rectus", "superior-oblique-eye"]), method: "curated-eye-movement", noteRu: "Нижняя косая помогает подъёму особенно при приведённом глазе; её основное вращательное действие — эксторсия. Списки относятся к вертикальному компоненту движения." }),
  ]),
  "inferior-rectus": Object.freeze([
    Object.freeze({ movementId: "eye-depression", movementRu: "Опускание глазного яблока", synergistIds: Object.freeze(["superior-oblique-eye"]), antagonistIds: Object.freeze(["superior-rectus", "inferior-oblique-eye"]), method: "curated-eye-movement", noteRu: "В первичном положении глаза нижняя прямая и верхняя косая участвуют в опускании. При отведённом глазе вклад нижней прямой возрастает; также возможны приведение и эксторсия." }),
  ]),
  "superior-oblique-eye": Object.freeze([
    Object.freeze({ movementId: "eye-depression", movementRu: "Опускание глазного яблока", synergistIds: Object.freeze(["inferior-rectus"]), antagonistIds: Object.freeze(["superior-rectus", "inferior-oblique-eye"]), method: "curated-eye-movement", noteRu: "Верхняя косая участвует в опускании особенно при приведённом глазе. Её основное действие — инторсия; отношения приведены для вертикального компонента движения." }),
  ]),
  "levator-palpebrae-superioris": Object.freeze([
    Object.freeze({ movementId: "upper-eyelid-elevation", movementRu: "Подъём верхнего века", synergistIds: Object.freeze([]), antagonistIds: Object.freeze(["orbicularis-oculi"]), method: "curated-eye-movement", noteRu: "Круговая мышца глаза закрывает веки и функционально противодействует их подъёму. Верхняя тарзальная гладкая мышца тоже поддерживает открытие века, но в данном мышечном каталоге отдельно не представлена." }),
  ]),
  "orbicularis-oculi": Object.freeze([
    Object.freeze({ movementId: "eyelid-closure", movementRu: "Закрывание век", synergistIds: Object.freeze([]), antagonistIds: Object.freeze(["levator-palpebrae-superioris"]), method: "curated-eye-movement", noteRu: "При закрывании век круговая мышца глаза действует противоположно мышце, поднимающей верхнее веко. Это сопоставление относится именно к веку, а не к вращению глазного яблока." }),
  ]),
});

// In these anatomical systems, a shared task is better described as an
// explicitly reviewed group than extracted from a generic Russian verb.
// Opposite groups refer to the *same* movable structure and movement plane.
const CURATED_FUNCTION_GROUPS = Object.freeze([
  {
    id: "vocal-fold-adduction", labelRu: "Приведение голосовых складок",
    actors: ["lateral-cricoarytenoid", "transverse-arytenoid", "thyroarytenoid"],
    opposite: "vocal-fold-abduction",
    noteRu: "Мышцы совместно уменьшают голосовую щель, но действуют на разные её участки. Их вклад зависит от фонации, дыхания и степени смыкания.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK545265/",
    sourceTitle: "Hoerter и соавт. · Laryngeal Muscles · NCBI Bookshelf",
  },
  {
    id: "vocal-fold-abduction", labelRu: "Отведение голосовых складок",
    actors: ["posterior-cricoarytenoid"], opposite: "vocal-fold-adduction",
    noteRu: "Задняя перстнечерпаловидная — единственная парная мышца, активно отводящая голосовые складки. В каталоге не выделен другой прямой синергист этого движения.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK545265/",
    sourceTitle: "Hoerter и соавт. · Laryngeal Muscles · NCBI Bookshelf",
  },
  {
    id: "laryngeal-inlet-narrowing", labelRu: "Сужение входа в гортань",
    actors: ["oblique-arytenoid", "aryepiglottic"], opposite: "laryngeal-inlet-widening",
    noteRu: "В этих движениях мышцы участвуют совместно с другими механизмами защиты дыхательных путей. Списки описывают направление тяги, а не отдельный рефлекс глотания.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538307/",
    sourceTitle: "Cervical, Respiratory, Larynx, and Cricoarytenoid · NCBI Bookshelf",
  },
  {
    id: "laryngeal-inlet-widening", labelRu: "Расширение входа в гортань",
    actors: ["thyroepiglottic"], opposite: "laryngeal-inlet-narrowing",
    noteRu: "Щитонадгортанная часть помогает расширять вход в гортань; это движение отличается от отведения самих голосовых складок.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538307/",
    sourceTitle: "Cervical, Respiratory, Larynx, and Cricoarytenoid · NCBI Bookshelf",
  },
  {
    id: "hyoid-elevation", labelRu: "Подъём подъязычной кости при фиксированной нижней челюсти",
    actors: ["digastric", "stylohyoid", "mylohyoid", "geniohyoid"], opposite: "hyoid-depression",
    noteRu: "Синергия относится к подъёму подъязычной кости при относительно неподвижной нижней челюсти. При другой фиксации некоторые мышцы помогают открывать рот; мышцы-опускатели стабилизируют кость после глотка.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK546710/",
    sourceTitle: "Suprahyoid Muscle · NCBI Bookshelf",
  },
  {
    id: "hyoid-depression", labelRu: "Опускание подъязычной кости",
    actors: ["sternohyoid", "omohyoid"], opposite: "hyoid-elevation",
    noteRu: "Мышцы опускают и удерживают подъязычную кость. Их противоположное действие по отношению к надподъязычным мышцам зависит от фиксации нижней челюсти и фазы глотания.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK554405/",
    sourceTitle: "Swallowing · NCBI Bookshelf",
  },
  {
    id: "larynx-elevation", labelRu: "Подъём гортани при фиксированной подъязычной кости",
    actors: ["thyrohyoid"], opposite: "larynx-depression",
    noteRu: "Щитоподъязычная мышца поднимает гортань, когда подъязычная кость фиксирована. При другой фиксации она может опускать подъязычную кость.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538307/",
    sourceTitle: "Cervical, Respiratory, Larynx, and Cricoarytenoid · NCBI Bookshelf",
  },
  {
    id: "larynx-depression", labelRu: "Опускание гортани",
    actors: ["sternothyroid"], opposite: "larynx-elevation",
    noteRu: "Грудино-щитовидная мышца опускает гортань; противоположный вклад щитоподъязычной зависит от положения и фиксации подъязычной кости.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538307/",
    sourceTitle: "Cervical, Respiratory, Larynx, and Cricoarytenoid · NCBI Bookshelf",
  },
  {
    id: "oral-commissure-elevation", labelRu: "Подъём угла рта",
    actors: ["zygomaticus-major", "levator-anguli-oris"], opposite: "oral-commissure-depression",
    noteRu: "Обе мышцы поднимают угол рта, но направления их тяги немного различаются. Это сравнение относится к перемещению угла рта, а не к эмоции или выражению лица в целом.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK547688/",
    sourceTitle: "Levator Anguli Oris Muscle · NCBI Bookshelf",
  },
  {
    id: "oral-commissure-depression", labelRu: "Опускание угла рта",
    actors: ["depressor-anguli-oris"], opposite: "oral-commissure-elevation",
    noteRu: "Мышца тянет угол рта вниз. Другие мышцы могут участвовать в выражении лица, но противоположная группа здесь сопоставлена только по движению угла рта.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK547688/",
    sourceTitle: "Levator Anguli Oris Muscle · NCBI Bookshelf",
  },
  {
    id: "upper-lip-elevation", labelRu: "Подъём верхней губы",
    actors: ["zygomaticus-minor", "levator-labii-superioris", "levator-labii-superioris-alaeque-nasi"], opposite: null,
    noteRu: "Мышцы совместно поднимают верхнюю губу, но различаются точками прикрепления и участками тяги. Достоверную простую пару мышц-антагонистов именно для этого движения не выделяем.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK547688/",
    sourceTitle: "Levator Anguli Oris Muscle · NCBI Bookshelf",
  },
  {
    id: "lower-lip-elevation", labelRu: "Подъём и выдвижение нижней губы",
    actors: ["mentalis"], opposite: "lower-lip-depression",
    noteRu: "Подбородочная мышца поднимает и выдвигает нижнюю губу; противоположное движение её опускателя не равно точной механической противоположности всех компонентов выдвижения.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK603755/table/article-156219.table1/",
    sourceTitle: "Facial Expression Muscles · NCBI Bookshelf",
  },
  {
    id: "lower-lip-depression", labelRu: "Опускание нижней губы",
    actors: ["depressor-labii-inferioris"], opposite: "lower-lip-elevation",
    noteRu: "Мышца опускает и выворачивает нижнюю губу. Противопоставление подбородочной мышце касается вертикального движения губы, но не всех её движений.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK603755/table/article-156219.table1/",
    sourceTitle: "Facial Expression Muscles · NCBI Bookshelf",
  },
  {
    id: "inspiratory-chest-expansion", labelRu: "Увеличение объёма грудной клетки при вдохе",
    actors: ["diaphragm", "external-intercostals"], opposite: null,
    noteRu: "Диафрагма увеличивает вертикальный размер грудной полости, наружные межрёберные мышцы помогают расширению грудной клетки, особенно при повышенной вентиляции. В спокойном дыхании выдох преимущественно пассивен; прямой парный антагонист диафрагмы не выделяется.",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/8519384/",
    sourceTitle: "Respiratory function of the rib cage muscles · PubMed",
  },
  {
    id: "active-rib-depression", labelRu: "Содействие опусканию рёбер при активном выдохе",
    actors: ["innermost-intercostals", "subcostales", "transversus-thoracis"], opposite: null,
    noteRu: "Эти мышцы могут участвовать в опускании рёбер и стабилизации грудной стенки, причём действуют в разных её отделах. Их участие не следует приравнивать к роли главных мышц активного выдоха.",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538328/",
    sourceTitle: "Anatomy, Thorax, Ribs · NCBI Bookshelf",
  },
]);

const curatedGroupById = new Map(CURATED_FUNCTION_GROUPS.map(group => [group.id, group]));

function curatedGroupRelationsForStructure(structureId) {
  return CURATED_FUNCTION_GROUPS.filter(group => group.actors.includes(structureId)).map(group => {
    const opposite = curatedGroupById.get(group.opposite);
    return Object.freeze({
      movementId: group.id,
      movementRu: group.labelRu,
      synergists: relatedItems(group.actors.filter(id => id !== structureId)),
      antagonists: relatedItems(opposite?.actors || []),
      contextDependent: Object.freeze([]),
      method: "curated-anatomical-function-group",
      noteRu: group.noteRu,
      sourceUrl: group.sourceUrl,
      sourceTitle: group.sourceTitle,
    });
  });
}

function relatedItems(ids) {
  return Object.freeze((ids || []).map(key => {
    const unit = functionalUnits.get(key);
    const id = unit?.structureId || key;
    const part = unit?.part;
    return Object.freeze({
      id,
      ...(part?.id ? { partId: part.id } : {}),
      nameRu: part?.id ? `${displayName(id)} · ${part.nameRu.toLocaleLowerCase("ru-RU")}` : displayName(id),
    });
  }));
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
        method: row.method || "curated-from-verified-pelvic-floor-function",
        noteRu: row.noteRu,
        ...(row.method === "curated-eye-movement" ? {
          sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK10793/",
          sourceTitle: "Purves и соавт. · Neuroscience, 2001 · действия глазодвигательных мышц",
        } : {}),
      })
    )
  );
}

export function functionalRelationsForStructure(structureId) {
  const current = structureById.get(structureId);
  if (!current) return Object.freeze([]);
  const parts = functionalPartsForStructure(structureId);
  const subjects = parts.length ? parts : [{ id: null, movementIds: movementIdsFor(current.structure) }];
  const rows = [...curatedFunctionalRelationsForStructure(structureId), ...curatedGroupRelationsForStructure(structureId)];

  for (const subject of subjects) {
    const subjectKey = subject.id ? `${structureId}::${subject.id}` : structureId;
    for (const movementId of subject.movementIds) {
      const movement = movementById.get(movementId);
      if (!movement) continue;
      const rawSynergists = (membership.get(movementId) || []).filter(key => key !== subjectKey);
      const rawAntagonists = (membership.get(movement.opposite) || []).filter(key => key !== subjectKey);
      const opposites = new Set(rawAntagonists);
      const contextDependent = rawSynergists.filter(key => opposites.has(key));
      const context = new Set(contextDependent);
      // A multi-action whole muscle stays conditional until its parts have
      // been reviewed. Never assign its two opposed actions to one fixed role.
      rows.push(Object.freeze({
        movementId,
        movementRu: movement.labelRu,
        ...(subject.id ? { subjectPartId: subject.id, subjectPartRu: subject.nameRu } : {}),
        synergists: relatedItems(rawSynergists.filter(key => !context.has(key))),
        antagonists: relatedItems(rawAntagonists.filter(key => !context.has(key))),
        contextDependent: relatedItems(contextDependent),
        method: subject.id ? "curated-functional-parts" : CURATED_MOVEMENT_ASSIGNMENTS[structureId]?.includes(movementId) ? "curated-joint-specific-action" : "derived-from-verified-actions",
        noteRu: subject.noteRu || jointSpecificNote(movementId) || "Связи сопоставлены по действиям из проверенных карточек. Вклад мышц зависит от положения сустава, фиксации и задачи; список не является моделью распределения усилий.",
        ...(structureId === "trapezius" ? { sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6849087/", sourceTitle: "Camargo, Neumann, 2019 · функция частей трапециевидной мышцы" } : {}),
      }));
    }
  }
  return Object.freeze(rows);
}

export function functionalRelationsCoverage() {
  const withRelations = structures.filter(
    item => functionalRelationsForStructure(item.structure.id).length > 0
  );
  const usedMovements = new Set(withRelations.flatMap(item =>
    functionalRelationsForStructure(item.structure.id).map(row => row.movementId)
  ));
  return Object.freeze({
    canonicalStructures: structures.length,
    structuresWithFunctionalRelations: withRelations.length,
    movementClasses: usedMovements.size,
  });
}
