import { REFERENCE_SOURCES } from "./sources.js";
import { MUSCLE_REFERENCE_PILOT } from "./muscles-pilot.js";

const errors = [];
const warnings = [];
const seenIds = new Set();

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

for (const muscle of MUSCLE_REFERENCE_PILOT) {
  requireValue(Boolean(muscle.id), "Muscle without id");
  requireValue(!seenIds.has(muscle.id), `Duplicate muscle id: ${muscle.id}`);
  seenIds.add(muscle.id);

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

  for (const illustration of muscle.illustrations || []) {
    requireValue(
      Boolean(REFERENCE_SOURCES[illustration.sourceId]),
      `${muscle.id}: illustration uses unknown source id ${illustration.sourceId}`
    );

    if (illustration.rightsStatus === "review" && illustration.src) {
      errors.push(
        `${muscle.id}: illustration with rightsStatus=review must not expose src (${illustration.src})`
      );
    }

    if (!illustration.rightsStatus) {
      warnings.push(`${muscle.id}: illustration has no rightsStatus`);
    }
  }

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
    `Reference data OK: ${MUSCLE_REFERENCE_PILOT.length} muscles, ${Object.keys(REFERENCE_SOURCES).length} sources.`
  );
}
