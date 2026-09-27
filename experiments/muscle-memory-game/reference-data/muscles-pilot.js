import { referenceStructureById } from "./regions/index.js";

// Compatibility view for the original four reference-data pilot records.
// Anatomical facts now live only in the regional database.
export const PILOT_STRUCTURE_IDS = Object.freeze([
  "latissimus-dorsi",
  "serratus-anterior",
  "external-oblique",
  "masseter",
]);

export const MUSCLE_REFERENCE_PILOT = Object.freeze(
  PILOT_STRUCTURE_IDS.map((id) => {
    const resolved = referenceStructureById(id);
    if (!resolved?.structure) {
      throw new Error(`Pilot structure is missing from regional reference data: ${id}`);
    }
    return resolved.structure;
  })
);

export function pilotMuscleById(id) {
  return MUSCLE_REFERENCE_PILOT.find((muscle) => muscle.id === id) || null;
}
