// Repeatable, read-only inventory of the canonical muscle-card data.
// Run: node experiments/muscle-memory-game/audit-reference-completeness.mjs
import { REFERENCE_REGIONS } from "./reference-data/regions/index.js";
import { functionalRelationsForStructure } from "./reference-data/functional-relations.js";
import { referenceIllustrationsForStructure } from "./reference-data/illustrations.js";
import { courseArtPrimaryForStructure } from "./reference-data/course-art.js";

const requiredFields = {
  "русское название": structure => structure.names?.ru,
  "латинское название": structure => structure.names?.latin,
  "начало": structure => structure.anatomy?.originRu,
  "прикрепление": structure => structure.anatomy?.insertionRu,
  "направление волокон": structure => structure.anatomy?.fiberDirectionRu,
  "действия": structure => structure.anatomy?.actionsRu,
  "иннервация": structure => structure.anatomy?.innervationRu,
  "источники": structure => structure.sources,
};

const missingFacts = [];
const missingRelations = [];
const missingArt = [];
const reportRows = [];
let total = 0;
let functionalCount = 0;
let artCount = 0;

for (const region of REFERENCE_REGIONS) {
  let functional = 0;
  let art = 0;
  for (const structure of region.structures || []) {
    total++;
    for (const [field, read] of Object.entries(requiredFields)) {
      const value = read(structure);
      if (!value || (Array.isArray(value) && !value.length) || (typeof value === "string" && !value.trim())) {
        missingFacts.push({ id: structure.id, field });
      }
    }

    if (functionalRelationsForStructure(structure.id).length) {
      functional++;
      functionalCount++;
    } else {
      missingRelations.push({ region: region.nameRu, id: structure.id, nameRu: structure.names.ru });
    }

    const hasArt = Boolean(courseArtPrimaryForStructure(structure.id)) ||
      (structure.illustrations || []).some(item => Boolean(item.src)) ||
      referenceIllustrationsForStructure(structure.id).some(item => item.status === "asset-ready" && Boolean(item.assetPath));
    if (hasArt) {
      art++;
      artCount++;
    } else {
      missingArt.push({ region: region.nameRu, id: structure.id, nameRu: structure.names.ru });
    }
  }
  reportRows.push({ name: region.nameRu, all: region.structures.length, functional, art });
}

console.log(`Справочные карточки: ${total}; основные поля: ${total - new Set(missingFacts.map(item => item.id)).size}/${total}`);
console.log(`Связи по движениям: ${functionalCount}/${total}; доступные иллюстрации: ${artCount}/${total}\n`);
console.log("Область | Связи | Иллюстрации");
for (const region of reportRows) console.log(`${region.name} | ${region.functional}/${region.all} | ${region.art}/${region.all}`);
console.log("\nНе заполненные функциональные связи:");
for (const item of missingRelations) console.log(`- ${item.region}: ${item.nameRu} [${item.id}]`);
console.log("\nБез доступной иллюстрации:");
for (const item of missingArt) console.log(`- ${item.region}: ${item.nameRu} [${item.id}]`);

if (missingFacts.length) {
  console.error("\nОтсутствуют обязательные сведения:");
  for (const item of missingFacts) console.error(`- ${item.id}: ${item.field}`);
  process.exitCode = 1;
}
