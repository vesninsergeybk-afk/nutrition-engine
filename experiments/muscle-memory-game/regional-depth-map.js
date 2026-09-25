export const DEPTH_LEVELS = Object.freeze({
  superficial: Object.freeze({ rank: 1, id: "superficial", nameRu: "Поверхностный" }),
  intermediate: Object.freeze({ rank: 2, id: "intermediate", nameRu: "Промежуточный" }),
  deep: Object.freeze({ rank: 3, id: "deep", nameRu: "Глубокий" }),
  deepest: Object.freeze({ rank: 4, id: "deepest", nameRu: "Самый глубокий" }),
});

function rule(id, level, pattern) {
  return Object.freeze({
    id,
    level,
    rank: DEPTH_LEVELS[level].rank,
    nameRu: DEPTH_LEVELS[level].nameRu,
    pattern,
  });
}

const PROFILES = Object.freeze({
  shoulder: Object.freeze({
    id: "shoulder",
    nameRu: "Плечевой пояс",
    rules: Object.freeze([
      rule("trapezius", "superficial", /^trapezius$/i),
      rule("deltoid", "superficial", /^deltoid$/i),

      rule("supraspinatus", "intermediate", /^supraspinatus$/i),
      rule("infraspinatus", "intermediate", /^infraspinatus$/i),
      rule("teres-minor", "intermediate", /^teres minor$/i),
      rule("teres-major", "intermediate", /^teres major$/i),
      rule("levator-scapulae", "intermediate", /^levator scapulae$/i),
      rule("rhomboid-major", "intermediate", /^rhomboid major$/i),
      rule("rhomboid-minor", "intermediate", /^rhomboid minor$/i),

      rule("subscapularis", "deep", /^subscapularis$/i),
      rule("serratus-anterior", "deep", /^serratus anterior$/i),
      rule("pectoralis-minor", "deep", /^pectoralis minor$/i),
      rule("subclavius", "deep", /^subclavius$/i),
    ]),
    covers: Object.freeze({
      trapezius: Object.freeze([
        "levator-scapulae",
        "rhomboid-major",
        "rhomboid-minor",
        "supraspinatus",
      ]),
      deltoid: Object.freeze([
        "supraspinatus",
        "infraspinatus",
        "teres-minor",
      ]),
    }),
  }),

  back: Object.freeze({
    id: "back",
    nameRu: "Спина",
    rules: Object.freeze([
      rule("latissimus-dorsi", "superficial", /^latissimus dorsi$/i),
      rule(
        "serratus-posterior",
        "intermediate",
        /^serratus posterior (?:superior|inferior)$/i
      ),
      rule(
        "erector-spinae",
        "deep",
        /^(?:iliocostalis (?:thoracis|lumborum)|longissimus thoracis|spinalis(?: thoracis)?)$/i
      ),
      rule(
        "transversospinal-deep",
        "deepest",
        /(?:multifidus (?:thoracis|lumborum)|\b(?:lumbar|thoracic) rotator\b|\brotatores\b|\binterspinal(?:is|es)\b|\bintertransversar(?:ius|ii)\b|levatores costarum|quadratus lumborum)/i
      ),
    ]),
    covers: Object.freeze({
      "latissimus-dorsi": Object.freeze(["erector-spinae"]),
      "serratus-posterior": Object.freeze(["erector-spinae"]),
      "erector-spinae": Object.freeze(["transversospinal-deep"]),
    }),
  }),

  abdomen: Object.freeze({
    id: "abdomen",
    nameRu: "Живот",
    rules: Object.freeze([
      rule("external-oblique", "superficial", /^external (?:abdominal )?oblique$/i),
      rule("rectus-abdominis", "superficial", /^rectus abdominis$/i),
      rule("pyramidalis", "superficial", /^pyramidalis$/i),
      rule("internal-oblique", "intermediate", /^internal (?:abdominal )?oblique$/i),
      rule("transversus-abdominis", "deep", /^transversus abdominis$/i),
    ]),
    covers: Object.freeze({
      "external-oblique": Object.freeze(["internal-oblique"]),
      "internal-oblique": Object.freeze(["transversus-abdominis"]),
    }),
  }),
});

function normalizeConcept(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");
}

export function regionDepthProfile(regionId) {
  return PROFILES[regionId] || null;
}

export function regionHasDepthProfile(regionId) {
  return Boolean(regionDepthProfile(regionId));
}

export function muscleDepthInfo(regionId, conceptKey) {
  const profile = regionDepthProfile(regionId);
  if (!profile) return null;

  const concept = normalizeConcept(conceptKey);
  const matched = profile.rules.find((candidate) => candidate.pattern.test(concept));
  if (!matched) return null;

  return {
    regionId,
    profileNameRu: profile.nameRu,
    ruleId: matched.id,
    level: matched.level,
    rank: matched.rank,
    nameRu: matched.nameRu,
  };
}

export function nextDepthRank(infos) {
  const ranks = (infos || [])
    .map((info) => Number(info?.rank) || 0)
    .filter((rank) => rank > 0);
  return ranks.length ? Math.min(...ranks) : null;
}

function reachableRuleIds(profile, startRuleId) {
  const visited = new Set();
  const pending = [...(profile?.covers?.[startRuleId] || [])];

  while (pending.length) {
    const current = pending.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    pending.push(...(profile?.covers?.[current] || []));
  }

  return visited;
}

export function hasCoverageRules(regionId, ruleId) {
  const profile = regionDepthProfile(regionId);
  return Boolean(profile?.covers?.[ruleId]?.length);
}

export function isKnownDeeperRelation(regionId, upperRuleId, deeperRuleId) {
  if (!upperRuleId || !deeperRuleId || upperRuleId === deeperRuleId) return false;
  const profile = regionDepthProfile(regionId);
  if (!profile) return false;
  return reachableRuleIds(profile, upperRuleId).has(deeperRuleId);
}

export function depthProfileCoverage(regionId, conceptKeys) {
  const keys = [...new Set((conceptKeys || []).map(normalizeConcept).filter(Boolean))];
  const mapped = keys.filter((key) => muscleDepthInfo(regionId, key));
  return {
    total: keys.length,
    mapped: mapped.length,
    complete: keys.length > 0 && mapped.length === keys.length,
    missing: keys.filter((key) => !muscleDepthInfo(regionId, key)),
  };
}

export const REGIONAL_DEPTH_PROFILE_IDS = Object.freeze(Object.keys(PROFILES));
