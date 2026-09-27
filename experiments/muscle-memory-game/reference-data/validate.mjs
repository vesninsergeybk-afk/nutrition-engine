import { REFERENCE_SOURCES } from "./sources.js";
import { MUSCLE_REFERENCE_PILOT, PILOT_STRUCTURE_IDS } from "./muscles-pilot.js";
import { REFERENCE_REGIONS, REGION_ROADMAP } from "./regions/index.js";
import { BODYPARTS3D_REFERENCE_ALIASES } from "./model-aliases.js";
import { REFERENCE_ILLUSTRATIONS } from "./illustrations.js";
import { REFERENCE_SOURCE_ART } from "./source-art.js";

const errors = [];
const warnings = [];
const regionStructureIds = new Set();
const structuresById = new Map();
const functionalGroupIds = new Set();
const aliases = new Map();

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function normalizeAlias(value) {
  return String(value || "").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

const LEARNER_FORBIDDEN_PATTERNS = Object.freeze([
  /\bBodyParts3D\b/i,
  /\bmesh\b/i,
  /\bMCP\b/,
  /\bMTP\b/,
  /\bPIP\b/,
  /\bDIP\b/,
  /\bCMC\b/,
  /\bFDL\b/,
  /\bTFL\b/,
]);

function learnerFacingStrings(structure) {
  return [
    ...(structure.anatomy?.originRu || []),
    ...(structure.anatomy?.insertionRu || []),
    ...(structure.anatomy?.actionsRu || []),
    structure.anatomy?.fiberDirectionRu,
    structure.anatomy?.innervationRu,
    ...(structure.surfaceMap?.landmarksRu || []),
    ...(structure.surfaceMap?.relationsRu || []),
    structure.movementCueRu,
  ].filter(Boolean);
}

function validateLearnerLanguage(structure) {
  for (const value of learnerFacingStrings(structure)) {
    for (const pattern of LEARNER_FORBIDDEN_PATTERNS) {
      requireValue(
        !pattern.test(value),
        `${structure.id}: learner-facing text contains technical shorthand ${pattern}: ${value}`
      );
      pattern.lastIndex = 0;
    }
  }
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

// First pass: validate each canonical regional structure and collect global ids/aliases.
for (const region of REFERENCE_REGIONS) {
  requireValue(Boolean(region.id), "Region without id");
  requireValue(Boolean(region.nameRu), `${region.id}: missing Russian region name`);
  requireValue(Boolean(region.structures?.length), `${region.id}: region has no structures`);
  requireValue(region.status === "verified-v1", `${region.id}: region is not verified-v1`);

  for (const structure of region.structures || []) {
    requireValue(Boolean(structure.id), `${region.id}: structure without id`);
    requireValue(
      !regionStructureIds.has(structure.id),
      `Duplicate region structure id: ${structure.id}`
    );
    regionStructureIds.add(structure.id);
    structuresById.set(structure.id, structure);

    requireValue(Boolean(structure.names?.ru), `${structure.id}: missing Russian name`);
    requireValue(Boolean(structure.names?.latin), `${structure.id}: missing Latin name`);
    requireValue(Boolean(structure.names?.modelAliases?.length), `${structure.id}: missing model aliases`);
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
    validateLearnerLanguage(structure);
    if (structure.parentStructureId) {
      requireValue(
        Boolean(structure.parentStructureId),
        `${structure.id}: empty parentStructureId`
      );
    }


    for (const memberId of structure.members || []) {
      // Member references are checked after the first pass, once every canonical id is known.
      // Keep the value here; the second pass below resolves it globally.
    }

    for (const rawAlias of structure.names?.modelAliases || []) {
      const alias = normalizeAlias(rawAlias);
      if (!alias) continue;
      if (!aliases.has(alias)) aliases.set(alias, []);
      aliases.get(alias).push({
        id: structure.id,
        context: structure.modelAliasContext || null,
      });
    }
  }
}

// Validate parent-child links after every canonical id has been collected.
for (const structure of structuresById.values()) {
  if (!structure.parentStructureId) continue;
  requireValue(
    structuresById.has(structure.parentStructureId),
    `${structure.id}: parentStructureId does not exist: ${structure.parentStructureId}`
  );
  requireValue(
    structure.parentStructureId !== structure.id,
    `${structure.id}: structure cannot be its own parent`
  );
}

// Second pass: now every canonical structure id is known, validate cross-region relationships and groups.
for (const region of REFERENCE_REGIONS) {
  for (const structure of region.structures || []) {
    for (const memberId of structure.members || []) {
      requireValue(
        structuresById.has(memberId),
        `${structure.id}: Canonical structure member does not exist: ${memberId}`
      );
    }
  }

  for (const relatedId of region.relatedStructureIds || []) {
    requireValue(
      structuresById.has(relatedId),
      `${region.id}: relatedStructureId does not exist: ${relatedId}`
    );
  }

  for (const group of region.functionalGroups || []) {
    requireValue(Boolean(group.id), `${region.id}: functional group without id`);
    requireValue(Boolean(group.nameRu), `${region.id}/${group.id}: missing Russian group name`);
    requireValue(Boolean(group.members?.length), `${region.id}/${group.id}: empty functional group`);
    requireValue(
      !functionalGroupIds.has(group.id),
      `Duplicate functional group id: ${group.id}`
    );
    requireValue(
      !structuresById.has(group.id),
      `Functional group id collides with canonical structure id: ${group.id}`
    );
    functionalGroupIds.add(group.id);

    for (const memberId of group.members || []) {
      requireValue(
        structuresById.has(memberId),
        `${region.id}/${group.id}: missing member ${memberId}`
      );
    }
  }
}

// A model alias may be shared only when every colliding structure has a distinct explicit context.
for (const [alias, uses] of aliases.entries()) {
  const uniqueIds = [...new Set(uses.map((item) => item.id))];
  if (uniqueIds.length < 2) continue;

  const contexts = uses.map((item) => item.context).filter(Boolean);
  const uniqueContexts = new Set(contexts);
  requireValue(
    contexts.length === uses.length && uniqueContexts.size === uses.length,
    `Ambiguous model alias without unique contexts: "${alias}" -> ${uniqueIds.join(", ")}`
  );
}

// Technical 3D aliases may point to an exact card or to a pedagogical group,
 // but every target must exist in the canonical regional database.
 for (const [sourceName, mapping] of Object.entries(BODYPARTS3D_REFERENCE_ALIASES)) {
  requireValue(Boolean(sourceName.trim()), "Empty BodyParts3D alias");
  requireValue(Boolean(mapping?.labelRu), `3D alias has no Russian display label: ${sourceName}`);

  const allowedCoverage = ["exact", "group", "part", "ambiguous"];
  requireValue(
    allowedCoverage.includes(mapping?.coverage),
    `3D alias has invalid coverage type: ${sourceName}`
  );

  if (mapping?.coverage === "ambiguous") {
    requireValue(
      Array.isArray(mapping.candidateReferenceIds) && mapping.candidateReferenceIds.length > 1,
      `Ambiguous 3D alias must list multiple candidates: ${sourceName}`
    );
    requireValue(
      !mapping.referenceId,
      `Ambiguous 3D alias must not pretend to have one exact referenceId: ${sourceName}`
    );
    for (const candidateId of mapping.candidateReferenceIds || []) {
      requireValue(
        structuresById.has(candidateId),
        `Ambiguous 3D alias points to unknown candidate: ${sourceName} -> ${candidateId}`
      );
    }
    requireValue(Boolean(mapping.noteRu), `Ambiguous 3D alias needs an explanatory note: ${sourceName}`);
  } else {
    requireValue(Boolean(mapping?.referenceId), `3D alias has no referenceId: ${sourceName}`);
    requireValue(
      structuresById.has(mapping?.referenceId),
      `3D alias points to unknown referenceId: ${sourceName} -> ${mapping?.referenceId}`
    );
  }
}

// Illustration registry: sources, regions and structure targets must all be canonical.
const regionIds = new Set(REFERENCE_REGIONS.map((region) => region.id));
const illustrationIds = new Set();

for (const illustration of REFERENCE_ILLUSTRATIONS) {
  requireValue(Boolean(illustration.id), "Illustration without id");
  requireValue(
    !illustrationIds.has(illustration.id),
    `Duplicate illustration id: ${illustration.id}`
  );
  illustrationIds.add(illustration.id);

  requireValue(
    Boolean(REFERENCE_SOURCES[illustration.sourceId]),
    `${illustration.id}: unknown illustration source ${illustration.sourceId}`
  );

  requireValue(
    Boolean(illustration.regionIds?.length),
    `${illustration.id}: illustration has no regionIds`
  );
  for (const regionId of illustration.regionIds || []) {
    requireValue(
      regionIds.has(regionId),
      `${illustration.id}: unknown regionId ${regionId}`
    );
  }

  requireValue(
    Boolean(illustration.focusStructureIds?.length),
    `${illustration.id}: illustration has no focusStructureIds`
  );
  for (const structureId of illustration.focusStructureIds || []) {
    requireValue(
      structuresById.has(structureId),
      `${illustration.id}: unknown focusStructureId ${structureId}`
    );
  }

  requireValue(
    ["public-domain", "cc0", "open-license", "cc-by", "cc-by-sa"].includes(
      illustration.rightsStatus
    ),
    `${illustration.id}: unsupported rightsStatus ${illustration.rightsStatus}`
  );

  if (illustration.assetPath) {
    requireValue(
      illustration.status === "asset-ready",
      `${illustration.id}: assetPath requires status=asset-ready`
    );
  } else {
    requireValue(
      illustration.status === "source-verified-asset-pending",
      `${illustration.id}: missing assetPath must remain source-verified-asset-pending`
    );
  }
}

// Source-art registry: an individual artwork must never silently stand in for another muscle.
const sourceArtIds = new Set();
const publishableArtRights = new Set([
  "public-domain",
  "cc0",
  "cc-by",
  "cc-by-sa",
  "licensed",
  "owned",
]);

for (const art of REFERENCE_SOURCE_ART) {
  requireValue(Boolean(art.id), "Source art without id");
  requireValue(
    !sourceArtIds.has(art.id),
    `Duplicate source-art id: ${art.id}`
  );
  sourceArtIds.add(art.id);

  requireValue(
    Boolean(REFERENCE_SOURCES[art.sourceId]),
    `${art.id}: unknown source-art source ${art.sourceId}`
  );
  requireValue(
    Number.isInteger(art.page) && art.page > 0,
    `${art.id}: invalid source page ${art.page}`
  );

  const crop = art.cropNormalized || {};
  for (const key of ["x", "y", "width", "height"]) {
    requireValue(
      Number.isFinite(crop[key]),
      `${art.id}: cropNormalized.${key} must be numeric`
    );
  }
  requireValue(
    crop.x >= 0 &&
      crop.y >= 0 &&
      crop.width > 0 &&
      crop.height > 0 &&
      crop.x + crop.width <= 1.000001 &&
      crop.y + crop.height <= 1.000001,
    `${art.id}: cropNormalized must stay inside the source page`
  );

  if (art.artScope === "group-supplement") {
    requireValue(
      Array.isArray(art.structureIds) && art.structureIds.length > 1,
      `${art.id}: group supplement must list multiple structureIds`
    );
    requireValue(
      !art.structureId,
      `${art.id}: group supplement must not pretend to be exact for one structure`
    );
    for (const structureId of art.structureIds || []) {
      requireValue(
        structuresById.has(structureId),
        `${art.id}: unknown group structure ${structureId}`
      );
    }
  } else {
    requireValue(
      ["exact-card", "exact-card-part"].includes(art.artScope),
      `${art.id}: unsupported artScope ${art.artScope}`
    );
    requireValue(
      Boolean(art.structureId) && structuresById.has(art.structureId),
      `${art.id}: exact artwork must point to one canonical structure`
    );
    requireValue(
      !art.structureIds,
      `${art.id}: exact artwork must not list multiple structureIds`
    );
  }

  if (art.assetPath) {
    requireValue(
      art.status === "asset-ready",
      `${art.id}: assetPath requires status=asset-ready`
    );
    requireValue(
      publishableArtRights.has(art.rightsStatus),
      `${art.id}: public asset requires confirmed publication rights, got ${art.rightsStatus}`
    );
  } else {
    requireValue(
      art.status === "mapped-source-only",
      `${art.id}: art without assetPath must remain mapped-source-only`
    );
  }

  if (art.rightsStatus === "permission-unverified") {
    requireValue(
      !art.assetPath,
      `${art.id}: permission-unverified art must not expose a public assetPath`
    );
  }
}

// The old pilot is a compatibility view only; it must point at the exact canonical objects.
requireValue(
  MUSCLE_REFERENCE_PILOT.length === PILOT_STRUCTURE_IDS.length,
  "Pilot compatibility view has the wrong size"
);
for (let i = 0; i < PILOT_STRUCTURE_IDS.length; i += 1) {
  const id = PILOT_STRUCTURE_IDS[i];
  const canonical = structuresById.get(id);
  requireValue(Boolean(canonical), `Pilot canonical structure missing: ${id}`);
  requireValue(
    MUSCLE_REFERENCE_PILOT[i] === canonical,
    `Pilot record is not the canonical regional object: ${id}`
  );
}

// Every registered region must appear once in the roadmap and every completed roadmap entry must be registered.
const roadmapById = new Map();
for (const item of REGION_ROADMAP) {
  requireValue(Boolean(item.id), "Roadmap entry without id");
  requireValue(!roadmapById.has(item.id), `Duplicate roadmap region: ${item.id}`);
  roadmapById.set(item.id, item);
}

for (const region of REFERENCE_REGIONS) {
  const item = roadmapById.get(region.id);
  requireValue(Boolean(item), `Registered region missing from roadmap: ${region.id}`);
  requireValue(
    item?.state === "verified-v1",
    `Registered region is not marked verified-v1 in roadmap: ${region.id}`
  );
}

for (const item of REGION_ROADMAP) {
  if (item.state === "verified-v1") {
    requireValue(
      REFERENCE_REGIONS.some((region) => region.id === item.id),
      `Roadmap marks unregistered region verified-v1: ${item.id}`
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
    `Reference data OK: ${REFERENCE_REGIONS.length} regions, ${regionStructureIds.size} canonical structures, ${functionalGroupIds.size} functional groups, ${Object.keys(BODYPARTS3D_REFERENCE_ALIASES).length} BodyParts3D aliases, ${REFERENCE_ILLUSTRATIONS.length} illustration plates, ${REFERENCE_SOURCE_ART.length} source-art mappings, ${Object.keys(REFERENCE_SOURCES).length} sources.`
  );
}
