import { REFERENCE_SOURCES } from "./reference-data/sources.js";
import {
  REFERENCE_REGIONS,
  referenceStructureById,
} from "./reference-data/regions/index.js";
import {
  bodyPartsReferenceAlias,
} from "./reference-data/model-aliases.js";
import {
  referenceCardView,
} from "./reference-data/presentation.js";
import {
  referenceIllustrationsForStructure,
} from "./reference-data/illustrations.js";
import {
  publishableReferenceSourceArtForStructure,
  referenceSourceArtForStructure,
  referenceSupplementArtForStructure,
} from "./reference-data/source-art.js";

function normalizeModelName(value) {
  return String(value || "")
    .toLocaleLowerCase("en-US")
    .replace(/\bright\b|\bleft\b/g, " ")
    .replace(/\bset of\b/g, " ")
    .replace(/\bparts? of\b/g, " ")
    .replace(/\bmuscles?\b/g, " ")
    .replace(/\bmusculi?\b/g, " ")
    .replace(/^\s*musculus\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactModelName(value) {
  return normalizeModelName(value).replace(/\s+/g, "");
}

const DIRECT_INDEX = new Map();
const COMPACT_INDEX = new Map();

function addIndex(index, key, candidate) {
  if (!key) return;
  if (!index.has(key)) index.set(key, []);
  const items = index.get(key);
  if (!items.some((item) => item.structure.id === candidate.structure.id)) {
    items.push(candidate);
  }
}

for (const region of REFERENCE_REGIONS) {
  for (const structure of region.structures || []) {
    const candidate = { region, structure };
    const terms = [
      structure.id,
      structure.names?.latin,
      ...(structure.names?.modelAliases || []),
    ].filter(Boolean);

    for (const term of terms) {
      addIndex(DIRECT_INDEX, normalizeModelName(term), candidate);
      addIndex(COMPACT_INDEX, compactModelName(term), candidate);
    }
  }
}

function aliasLookup(sourceName) {
  const raw = String(sourceName || "")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");

  const withoutSide = raw
    .replace(/\bright\b|\bleft\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    bodyPartsReferenceAlias(raw) ||
    bodyPartsReferenceAlias(withoutSide) ||
    null
  );
}

function candidateCard(candidate, mapping = null) {
  if (!candidate) return null;

  const card = referenceCardView(candidate.region, candidate.structure);
  const localIllustrations = candidate.structure.illustrations || [];
  const registryIllustrations = referenceIllustrationsForStructure(
    candidate.structure.id
  )
    .filter((item) => item.status === "asset-ready" && item.assetPath)
    .map((item) => ({
      sourceId: item.sourceId,
      rightsStatus: item.rightsStatus,
      src: item.assetPath,
      locator: item.id,
    }));

  const exactArtCandidates = referenceSourceArtForStructure(
    candidate.structure.id
  );
  const exactArt = publishableReferenceSourceArtForStructure(
    candidate.structure.id
  ).map((item) => ({
    ...item,
    source: REFERENCE_SOURCES[item.sourceId] || null,
  }));
  const supplementArt = referenceSupplementArtForStructure(
    candidate.structure.id
  );

  const illustrations = [];
  const seen = new Set();
  for (const item of [...localIllustrations, ...registryIllustrations]) {
    const key = [
      item.sourceId || "",
      item.src || "",
      item.locator || "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    illustrations.push(item);
  }

  return Object.freeze({
    id: card.id,
    titleRu: card.titleRu,
    latin: card.latin,
    regionId: candidate.region.id,
    regionRu: card.regionRu,
    typeRu: card.typeRu,
    depthRu: card.depthRu,
    badgesRu: card.badgesRu,
    originRu: card.sections.attachments.originRu.join(" "),
    insertionRu: card.sections.attachments.insertionRu.join(" "),
    actionsRu: card.sections.actions,
    orientationRu: card.sections.orientation,
    landmarksRu: card.sections.landmarks,
    relationsRu: card.sections.relations,
    innervationRu: card.sections.innervation,
    studyCueRu: card.sections.studyCue,
    sources: card.sections.sources,
    illustrations: Object.freeze(illustrations),
    exactArt: Object.freeze(exactArt),
    exactArtMappedCount: exactArtCandidates.length,
    supplementArtMappedCount: supplementArt.length,
    verificationStatus: candidate.structure.verification?.status || null,
    modelCoverage: mapping?.coverage || "exact",
    modelLabelRu: mapping?.labelRu || null,
    parentStructureId: candidate.structure.parentStructureId || null,
  });
}

function ambiguityResult(labelRu, noteRu, candidateIds) {
  const candidates = (candidateIds || [])
    .map((id) => referenceStructureById(id))
    .filter(Boolean)
    .map((candidate) => candidateCard(candidate));

  return Object.freeze({
    ambiguous: true,
    labelRu: labelRu || "Неоднозначное имя структуры",
    noteRu:
      noteRu ||
      "Имя в 3D-модели не позволяет однозначно выбрать одну анатомическую карточку.",
    candidates: Object.freeze(candidates),
  });
}

export function muscleReferenceFor(sourceName) {
  const mapping = aliasLookup(sourceName);

  if (mapping?.coverage === "ambiguous") {
    return ambiguityResult(
      mapping.labelRu,
      mapping.noteRu,
      mapping.candidateReferenceIds
    );
  }

  if (mapping?.referenceId) {
    return candidateCard(
      referenceStructureById(mapping.referenceId),
      mapping
    );
  }

  const key = normalizeModelName(sourceName);
  const direct = DIRECT_INDEX.get(key) || [];

  if (direct.length === 1) return candidateCard(direct[0]);

  if (direct.length > 1) {
    return ambiguityResult(
      "Имя встречается у нескольких структур",
      "Для точного сопоставления нужна область или более конкретное имя 3D-объекта.",
      direct.map((item) => item.structure.id)
    );
  }

  const compact = COMPACT_INDEX.get(compactModelName(sourceName)) || [];
  if (compact.length === 1) return candidateCard(compact[0]);

  if (compact.length > 1) {
    return ambiguityResult(
      "Имя встречается у нескольких структур",
      "Для точного сопоставления нужна область или более конкретное имя 3D-объекта.",
      compact.map((item) => item.structure.id)
    );
  }

  return null;
}

export function muscleReferenceSource(sourceId) {
  const source = REFERENCE_SOURCES[sourceId] || null;
  if (!source) return null;

  return Object.freeze({
    ...source,
    href: source.url || source.sourcePage || null,
    rightsStatus:
      source.rightsStatus ||
      source.rights?.illustrations ||
      null,
  });
}
