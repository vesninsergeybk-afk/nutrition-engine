import { REFERENCE_SOURCES } from "./sources.js";
import { MUSCLE_REFERENCE_PILOT, PILOT_STRUCTURE_IDS } from "./muscles-pilot.js";
import { REFERENCE_REGIONS, REGION_ROADMAP } from "./regions/index.js";
import { BODYPARTS3D_REFERENCE_ALIASES } from "./model-aliases.js";

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
   requireValue(Boolean(mapping?.referenceId), `3D alias has no referenceId: ${sourceName}`);
   requireValue(
     structuresById.has(mapping?.referenceId),
     `3D alias points to unknown referenceId: ${sourceName} -> ${mapping?.referenceId}`
   );
   requireValue(
     mapping?.coverage === "exact" || mapping?.coverage === "group",
     `3D alias has invalid coverage type: ${sourceName}`
   );
   requireValue(Boolean(mapping?.labelRu), `3D alias has no Russian display label: ${sourceName}`);
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
    `Reference data OK: ${REFERENCE_REGIONS.length} regions, ${regionStructureIds.size} canonical structures, ${functionalGroupIds.size} functional groups, ${Object.keys(BODYPARTS3D_REFERENCE_ALIASES).length} BodyParts3D aliases, ${Object.keys(REFERENCE_SOURCES).length} sources.`
  );
}
