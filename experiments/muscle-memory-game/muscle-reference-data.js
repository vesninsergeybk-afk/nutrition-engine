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
import { courseArtPrimaryForStructure } from "./reference-data/course-art.js";
import { bookArtPrimaryForStructure } from "./reference-data/book-art.js";
import { functionalRelationsForStructure } from "./reference-data/functional-relations.js";
import { structureTerm } from "./anatomy-terms-ru.js";

const Z_ANATOMY_REFERENCE_ALIASES = Object.freeze({
  "abductor digiti minimi of foot": Object.freeze({ referenceId: "abductor-digiti-minimi-foot", coverage: "exact" }),
  "abductor digiti minimi of hand": Object.freeze({ referenceId: "abductor-digiti-minimi-hand", coverage: "exact" }),
  "dorsal interossei muscles of foot": Object.freeze({ referenceId: "dorsal-interossei-foot", coverage: "exact" }),
  "dorsal interossei muscles of hand": Object.freeze({ referenceId: "dorsal-interossei", coverage: "exact" }),
  "dorsal parts of lateral intertransversarii lumborum muscles": Object.freeze({ referenceId: "intertransversarii", coverage: "part" }),
  "external intercostal muscles": Object.freeze({ referenceId: "external-intercostals", coverage: "exact" }),
  "flexor digiti minimi of foot": Object.freeze({ referenceId: "flexor-digiti-minimi-brevis-foot", coverage: "exact" }),
  "flexor digiti minimi of hand": Object.freeze({ referenceId: "flexor-digiti-minimi-brevis-hand", coverage: "exact" }),
  "iliocostalis colli muscle": Object.freeze({ referenceId: "iliocostalis", coverage: "part" }),
  "innermost intercostal muscles": Object.freeze({ referenceId: "innermost-intercostals", coverage: "exact" }),
  "internal intercostal muscles": Object.freeze({ referenceId: "internal-intercostals", coverage: "exact" }),
  "interspinales colli muscles": Object.freeze({ referenceId: "interspinales", coverage: "part" }),
  "interspinales lumborum muscles": Object.freeze({ referenceId: "interspinales", coverage: "part" }),
  "interspinales thoracis muscles": Object.freeze({ referenceId: "interspinales", coverage: "part" }),
  "levatores breves costarum": Object.freeze({ referenceId: "levatores-costarum", coverage: "part" }),
  "levatores longi costarum": Object.freeze({ referenceId: "levatores-costarum", coverage: "part" }),
  "longissimus colli muscle": Object.freeze({ referenceId: "longissimus", coverage: "part" }),
  "lumbrical muscles of foot": Object.freeze({ referenceId: "lumbricals-foot", coverage: "exact" }),
  "lumbrical muscles of hand": Object.freeze({ referenceId: "lumbricals-hand", coverage: "exact" }),
  "multifidus colli muscle": Object.freeze({ referenceId: "multifidus", coverage: "part" }),
  "obliquus inferior capitis muscle": Object.freeze({ referenceId: "obliquus-capitis-inferior", coverage: "exact" }),
  "obliquus superior capitis muscle": Object.freeze({ referenceId: "obliquus-capitis-superior", coverage: "exact" }),
  "opponens digiti minimi muscle of hand": Object.freeze({ referenceId: "opponens-digiti-minimi", coverage: "exact" }),
  "plantar interossei muscles": Object.freeze({ referenceId: "plantar-interossei-foot", coverage: "exact" }),
  "rectus anterior capitis muscle": Object.freeze({ referenceId: "rectus-capitis-anterior", coverage: "exact" }),
  "rectus lateralis capitis muscle": Object.freeze({ referenceId: "rectus-capitis-lateralis", coverage: "exact" }),
  "rectus posterior major capitis muscle": Object.freeze({ referenceId: "rectus-capitis-posterior-major", coverage: "exact" }),
  "rectus posterior minor capitis muscle": Object.freeze({ referenceId: "rectus-capitis-posterior-minor", coverage: "exact" }),
  "semispinalis colli muscle": Object.freeze({ referenceId: "semispinalis", coverage: "part" }),
  "spinalis colli muscle": Object.freeze({ referenceId: "spinalis", coverage: "part" }),
  "splenius colli muscle": Object.freeze({ referenceId: "splenius-cervicis", coverage: "exact" }),
  "ventral parts of lateral intertransversarii lumborum muscles": Object.freeze({ referenceId: "intertransversarii", coverage: "part" }),
});

function zAnatomyReferenceAlias(sourceName) {
  const key = String(sourceName || "")
    .trim()
    .replace(/\.(?:l|r)\s*$/i, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
  return Z_ANATOMY_REFERENCE_ALIASES[key] || null;
}

function normalizeModelName(value) {
  return String(value || "")
    .trim()
    .replace(/\.(?:l|r)\s*$/i, " ")
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

function zAnatomyLookupTerms(sourceName) {
  const raw = String(sourceName || "")
    .trim()
    .replace(/\.(?:l|r)\s*$/i, "")
    .replace(/^\((.*)\)$/u, "$1")
    .replace(/\bbucinator\b/gi, "buccinator")
    .replace(/\s+/g, " ")
    .trim();

  const terms = [raw];
  const withoutGenericMuscle = raw
    .replace(/\bmuscles?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (withoutGenericMuscle && withoutGenericMuscle !== raw) {
    terms.push(withoutGenericMuscle);
  }

  // Z-Anatomy often exposes one named head, part or belly as a separate mesh.
  // Prefer an exact canonical part card when one exists; otherwise bridge the
  // mesh to the parent muscle card without pretending the mesh is the whole
  // muscle.
  for (const value of [...terms]) {
    const partMatch = value.match(
      /^(?:.+?\s+)?(?:part|parts|head|belly)\s+of\s+(.+)$/i
    );
    if (partMatch?.[1]) {
      const parent = partMatch[1]
        .replace(/\bmuscles?\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (parent) terms.push(parent);
    }
  }

  return [...new Set(terms.filter(Boolean))];
}

function lookupCandidatesForTerms(terms) {
  const candidates = [];
  const seenIds = new Set();

  for (const term of terms || []) {
    for (const candidate of [
      ...(DIRECT_INDEX.get(normalizeModelName(term)) || []),
      ...(COMPACT_INDEX.get(compactModelName(term)) || []),
    ]) {
      if (seenIds.has(candidate.structure.id)) continue;
      seenIds.add(candidate.structure.id);
      candidates.push(candidate);
    }
  }

  return candidates;
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
      structure.names?.ru,
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
  const modelCoverage = mapping?.coverage || "exact";
  const exactPrimaryArt =
    modelCoverage === "exact"
      ? (
          bookArtPrimaryForStructure(candidate.structure.id) ||
          courseArtPrimaryForStructure(candidate.structure.id)
        )
      : null;
  const primaryIllustration = exactPrimaryArt
    ? Object.freeze({
        ...exactPrimaryArt,
        displayMatch: "exact-muscle",
        selectedPartLabelRu: null,
      })
    : null;
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
    sourceNotesRu: Object.freeze(candidate.structure.sourceNotesRu || []),
    functionalRelations: functionalRelationsForStructure(candidate.structure.id),
    sources: card.sections.sources,
    illustrations: Object.freeze(illustrations),
    primaryIllustration,
    verificationStatus: candidate.structure.verification?.status || null,
    modelCoverage,
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
  const mapping = aliasLookup(sourceName) || zAnatomyReferenceAlias(sourceName);

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

  // Z-Anatomy uses .l/.r suffixes and often exposes heads/parts/bellies as
  // separate meshes. Resolve those names against the same canonical cards as
  // BodyParts3D, preferring an exact part card and then the parent muscle.
  const zTerms = zAnatomyLookupTerms(sourceName);
  const zCandidates = lookupCandidatesForTerms(zTerms);

  if (zCandidates.length === 1) {
    const translated = structureTerm(sourceName);
    const source = String(sourceName || "");
    const partLike =
      /\b(?:part|parts|head|belly)\s+of\b|\bpars\b|\bcaput\b/i.test(source);
    return candidateCard(zCandidates[0], {
      coverage: partLike ? "part" : "exact",
      labelRu: translated?.nameRu || null,
    });
  }

  if (zCandidates.length > 1) {
    const translated = structureTerm(sourceName);
    return ambiguityResult(
      translated?.nameRu || "Имя встречается у нескольких структур",
      "Название 3D-объекта соответствует нескольким анатомическим карточкам. Нужна более точная идентификация структуры.",
      zCandidates.map((item) => item.structure.id)
    );
  }

  const translated = structureTerm(sourceName);
  const translatedTerms = [
    translated?.latin,
    translated?.nameRu,
    ...(translated?.aliases || []),
  ].filter(Boolean);
  const translatedCandidates = lookupCandidatesForTerms(translatedTerms);

  if (translatedCandidates.length === 1) {
    const source = String(sourceName || "");
    const partLike =
      /\b(?:part|parts|head|belly)\s+of\b|\bpars\b|\bcaput\b/i.test(source);
    return candidateCard(translatedCandidates[0], {
      coverage: partLike ? "part" : "exact",
      labelRu: translated?.nameRu || null,
    });
  }

  if (translatedCandidates.length > 1) {
    return ambiguityResult(
      translated?.nameRu || "Имя встречается у нескольких структур",
      "Название 3D-объекта соответствует нескольким анатомическим карточкам. Нужна более точная идентификация структуры.",
      translatedCandidates.map((item) => item.structure.id)
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
