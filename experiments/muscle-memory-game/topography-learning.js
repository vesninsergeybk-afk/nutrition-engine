import { learningConceptSourceName } from "./learning-engine.js";
import {
  muscleDepthInfo,
  regionDepthProfile,
} from "./regional-depth-map.js";

function shuffled(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function topographyTargetInfo(target, profileId) {
  if (!target || !profileId) return null;
  for (const sourceName of target.sourceNames || []) {
    const concept = learningConceptSourceName(sourceName);
    const info = muscleDepthInfo(profileId, concept);
    if (info) return { ...info, concept };
  }
  return null;
}

export function buildTopographyRelations(catalog, profileId) {
  const profile = regionDepthProfile(profileId);
  if (!profile?.covers) return [];

  const byRule = new Map();
  for (const target of catalog || []) {
    const info = topographyTargetInfo(target, profileId);
    if (!info) continue;
    if (!byRule.has(info.ruleId)) byRule.set(info.ruleId, []);
    byRule.get(info.ruleId).push(target);
  }

  const relations = [];
  const seen = new Set();

  for (const [upperRuleId, deeperRuleIds] of Object.entries(profile.covers)) {
    const uppers = byRule.get(upperRuleId) || [];
    for (const deeperRuleId of deeperRuleIds || []) {
      const deepers = byRule.get(deeperRuleId) || [];
      for (const upperTarget of uppers) {
        for (const deeperTarget of deepers) {
          if (!upperTarget || !deeperTarget || upperTarget.id === deeperTarget.id) continue;
          const key = upperTarget.id + "::" + deeperTarget.id;
          if (seen.has(key)) continue;
          seen.add(key);
          relations.push({
            id: key,
            profileId,
            upperRuleId,
            deeperRuleId,
            upperTarget,
            deeperTarget,
          });
        }
      }
    }
  }

  return relations;
}

export function buildTopographyChoices(
  item,
  catalog,
  profileId,
  count = 4,
  rng = Math.random
) {
  if (!item?.target) return [];

  const answer = item.target;
  const answerInfo = topographyTargetInfo(answer, profileId);
  const mapped = (catalog || [])
    .filter(
      (target) =>
        target?.id !== item.promptTarget?.id &&
        target?.id !== answer.id &&
        topographyTargetInfo(target, profileId)
    )
    .map((target) => ({
      target,
      info: topographyTargetInfo(target, profileId),
    }));

  mapped.sort((a, b) => {
    const da = Math.abs((a.info?.rank || 0) - (answerInfo?.rank || 0));
    const db = Math.abs((b.info?.rank || 0) - (answerInfo?.rank || 0));
    return da - db || a.target.nameRu.localeCompare(b.target.nameRu, "ru");
  });

  const preferred = mapped.slice(0, Math.max(count * 2, count));
  const distractors = shuffled(preferred, rng)
    .slice(0, Math.max(0, count - 1))
    .map((entry) => entry.target);

  return shuffled([answer, ...distractors], rng);
}

export function createTopographySession({
  catalog = [],
  profileId,
  size = 10,
  rng = Math.random,
} = {}) {
  const relations = buildTopographyRelations(catalog, profileId);
  const safeSize = Math.max(
    1,
    Math.min(Number(size) || 10, 30, relations.length || 1)
  );
  const selected = shuffled(relations, rng).slice(0, safeSize);

  return {
    mode: "topography",
    profileId,
    items: selected.map((relation) => ({
      target: relation.deeperTarget,
      promptTarget: relation.upperTarget,
      answerTarget: relation.deeperTarget,
      skillId: "topography",
      relationId: relation.id,
      upperRuleId: relation.upperRuleId,
      deeperRuleId: relation.deeperRuleId,
    })),
    index: 0,
    results: [],
    startedAt: Date.now(),
    finishedAt: null,
  };
}
