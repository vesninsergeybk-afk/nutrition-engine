import { REFERENCE_SOURCES } from "./sources.js";
import { MUSCLE_REFERENCE_PILOT } from "./muscles-pilot.js";
import { REFERENCE_REGIONS } from "./regions/index.js";

const errors = [];
const warnings = [];
const seenPilotIds = new Set();
const regionStructureIds = new Set();

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function validateIllustrations(ownerId, illustrations = []) {
  for (const illustration of illustrations) {
    requireValue(
      Boolean(REFERENCE_SOURCES[illustration.sourceId]),
      `${ownerId}: illustration uses unknown source id ${illustration.sourceId}`
    );

    if (illustration.rightsStatus === "review" && illustration.src) {
      errors.push(
        `${ownerId}: illustration with rightsStatus=review must not expose src (${illustration.src})`
      );
    }

    if (!illustration.rightsStatus) {
      warnings.push(`${ownerId}: illustration has no rightsStatus`);
    }
  }
}

for (const muscle of MUSCLE_REFERENCE_PILOT) {
  requireValue(Boolean(muscle.id), "Pilot muscle without id");
  requireValue(!seenPilotIds.has(muscle.id), `Duplicate pilot muscle id: ${muscle.id}`);
  seenPilotIds.add(muscle.id);

  requireValue(Boolean(muscle.names?.ru), `${muscle.id}: missing Russian name`);
  requireValue(Boolean(muscle.names?.latin), `${muscle.id}: missing Latin name`);
  requireValue(Boolean(muscle.regions?.length), `${muscle.id}: missing regions`);
  requireValue(Boolean(muscle.anatomy?.originRu?.length), `${muscle.id}: missing origin`);
  requireValue(Boolean(muscle.anatomy?.insertionRu?.length), `${muscle.id}: missing insertion`);
  requireValue(Boolean(muscle.anatomy?.actionsRu?.length), `${muscle.id}: missing actions`);
  requireValue(Boolean(muscle.sources?.length), `${muscle.id}: missing sources`);

  for (const source of muscle.sources || []) {
    requireValue(
      Boolean(REFERENCE_SOURCES[source.sourceId]),
      `${muscle.id}: unknown source id ${source.sourceId}`
    );
  }

  validateIllustrations(muscle.id, muscle.illustrations);

  const verificationSources = new Set(muscle.verification?.checkedAgainst || []);
  if (!verificationSources.size) {
    warnings.push(`${muscle.id}: no verification sources recorded`);
  }

  for (const sourceId of verificationSources) {
    requireValue(
      Boolean(REFERENCE_SOURCES[sourceId]),
      `${muscle.id}: verification refers to unknown source ${sourceId}`
    );
  }
}

for (const region of REFERENCE_REGIONS) {
  requireValue(Boolean(region.id), "Region without id");
  requireValue(Boolean(region.nameRu), `${region.id}: missing Russian region name`);
  requireValue(Boolean(region.structures?.length), `${region.id}: region has no structures`);

  for (const structure of region.structures || []) {
    requireValue(Boolean(structure.id), `${region.id}: structure without id`);
    requireValue(
      !regionStructureIds.has(structure.id),
      `Duplicate region structure id: ${structure.id}`
    );
    regionStructureIds.add(structure.id);

    requireValue(Boolean(structure.names?.ru), `${structure.id}: missing Russian name`);
    requireValue(Boolean(structure.names?.latin), `${structure.id}: missing Latin name`);
    requireValue(Boolean(structure.kind), `${structure.id}: missing kind`);
    requireValue(Boolean(structure.layer), `${structure.id}: missing layer`);
    requireValue(Boolean(structure.anatomy?.originRu?.length), `${structure.id}: missing origin`);
    requireValue(Boolean(structure.anatomy?.insertionRu?.length), `${structure.id}: missing insertion`);
    requireValue(Boolean(structure.anatomy?.actionsRu?.length), `${structure.id}: missing actions`);
    requireValue(Boolean(structure.sources?.length), `${structure.id}: missing sources`);
    requireValue(Boolean(structure.verification?.status), `${structure.id}: missing verification status`);

    for (const source of structure.sources || []) {
      requireValue(
        Boolean(REFERENCE_SOURCES[source.sourceId]),
        `${structure.id}: unknown source id ${source.sourceId}`
      );
    }

    validateIllustrations(structure.id, structure.illustrations);
  }
}

if (warnings.length) {
  console.warn("\nWarnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("\nReference data validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Reference data OK: ${MUSCLE_REFERENCE_PILOT.length} pilot muscles, ${REFERENCE_REGIONS.length} regions, ${regionStructureIds.size} region structures, ${Object.keys(REFERENCE_SOURCES).length} sources.`
  );
}
