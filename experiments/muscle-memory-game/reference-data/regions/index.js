import { BACK_SHOULDER_REGION } from "./back-shoulder.js";
import { THORAX_ABDOMEN_REGION } from "./thorax-abdomen.js";
import { HEAD_NECK_REGION } from "./head-neck.js";

export const REFERENCE_REGIONS = Object.freeze([
  BACK_SHOULDER_REGION,
  THORAX_ABDOMEN_REGION,
  HEAD_NECK_REGION,
]);

export const REGION_ROADMAP = Object.freeze([
  Object.freeze({ id: "back-shoulder", nameRu: "Спина и плечевой пояс", state: "verified-v1" }),
  Object.freeze({ id: "thorax-abdomen", nameRu: "Грудная клетка и живот", state: "verified-v1" }),
  Object.freeze({ id: "head-neck", nameRu: "Голова и шея", state: "verified-v1" }),
  Object.freeze({ id: "upper-limb", nameRu: "Плечо, предплечье и кисть", state: "next" }),
  Object.freeze({ id: "pelvis-gluteal", nameRu: "Таз и ягодичная область", state: "queued" }),
  Object.freeze({ id: "thigh", nameRu: "Бедро", state: "queued" }),
  Object.freeze({ id: "leg-foot", nameRu: "Голень и стопа", state: "queued" }),
]);

export function referenceRegionById(id) {
  return REFERENCE_REGIONS.find((region) => region.id === id) || null;
}

export function referenceStructureById(id) {
  for (const region of REFERENCE_REGIONS) {
    const found = region.structures.find((structure) => structure.id === id);
    if (found) return { region, structure: found };
  }
  return null;
}
