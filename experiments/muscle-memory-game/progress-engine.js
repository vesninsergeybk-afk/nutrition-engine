import {
  LEARNING_REGIONS,
  appendSessionHistory,
  confusionPairs,
  filterCatalogByRegion,
  learningHistory,
} from "./learning-engine.js";
import {
  retentionRecord,
  retentionStatus,
} from "./retention-engine.js";

export function topConfusions(
  store,
  catalog,
  { limit = 5, skillId = null } = {}
) {
  const byId = new Map((catalog || []).map((item) => [item.id, item]));

  return confusionPairs(store, { skillId, limit: Math.max(1, Number(limit) || 5) })
    .map((entry) => ({
      ...entry,
      target: byId.get(entry.expectedMuscleId),
      chosen: byId.get(entry.chosenMuscleId),
    }))
    .filter((entry) => entry.target && entry.chosen);
}

export function skillProgress(store, catalog, skillId, now = Date.now()) {
  const summary = {
    total: (catalog || []).length,
    seen: 0,
    new: 0,
    due: 0,
    scheduled: 0,
  };

  for (const target of catalog || []) {
    const status = retentionStatus(store, target.id, skillId, now);
    summary[status] += 1;
    if (status !== "new") summary.seen += 1;
  }

  return summary;
}

export function regionProgress(store, catalog, now = Date.now()) {
  const rows = [];

  for (const region of LEARNING_REGIONS) {
    if (region.id === "all" || region.id === "other") continue;
    const items = filterCatalogByRegion(catalog, region.id);
    if (!items.length) continue;

    const find = skillProgress(store, items, "find", now);
    const name = skillProgress(store, items, "name", now);

    const seen = items.filter((target) => {
      const findStatus = retentionStatus(store, target.id, "find", now);
      const nameStatus = retentionStatus(store, target.id, "name", now);
      return findStatus !== "new" || nameStatus !== "new";
    }).length;

    rows.push({
      regionId: region.id,
      nameRu: region.nameRu,
      total: items.length,
      find,
      name,
      seen,
      due: find.due + name.due,
    });
  }

  return rows;
}

function weakReason(record, status) {
  if (record.reviewDebt > 0) return "есть ошибка для повторения";

  const attempts = Math.max(0, Number(record.attempts) || 0);
  const wrong = Math.max(0, Number(record.wrong) || 0);
  const errorRate = attempts ? wrong / attempts : 0;

  if (record.lapses >= 2 && record.cleanStreak < 2) return "повторные затруднения";
  if (attempts >= 2 && errorRate >= 0.4 && record.cleanStreak < 2) return "частые ошибки";
  return "нужна дополнительная проверка";
}

function weakPriority(record, status, now) {
  const attempts = Math.max(0, Number(record.attempts) || 0);
  const wrong = Math.max(0, Number(record.wrong) || 0);
  const errorRate = attempts ? wrong / attempts : 0;
  const last = record.lastReviewedAt || record.lastSeen || 0;
  const ageDays = last ? Math.max(0, now - last) / 86400000 : 0;

  return (
    (record.reviewDebt > 0 ? 100000 : 0) +
    (status === "due" ? 10000 : 0) +
    Math.min(20, record.lapses || 0) * 500 +
    errorRate * 100 +
    Math.min(365, ageDays)
  );
}

export function weakSkills(
  store,
  catalog,
  { limit = 6, now = Date.now() } = {}
) {
  const items = [];

  for (const target of catalog || []) {
    for (const skillId of target.skillIds || ["find", "name"]) {
      const record = retentionRecord(store, target.id, skillId);
      if (record.attempts === 0 && record.reviewCount === 0) continue;

      const status = retentionStatus(store, target.id, skillId, now);
      const attempts = Math.max(0, Number(record.attempts) || 0);
      const wrong = Math.max(0, Number(record.wrong) || 0);
      const errorRate = attempts ? wrong / attempts : 0;

      // A skill is not a "weak spot" merely because its scheduled
      // review date arrived. Due-only work belongs in the Today queue.
      // Two clean recalls are enough to retire an old weak-spot label even
      // though cumulative lapse history is retained for analysis.
      const recovered = record.cleanStreak >= 2;
      const recurringDifficulty = record.lapses >= 2 && !recovered;
      const frequentErrors = attempts >= 2 && errorRate >= 0.4 && !recovered;

      if (
        record.reviewDebt <= 0 &&
        !recurringDifficulty &&
        !frequentErrors
      ) {
        continue;
      }

      items.push({
        target,
        skillId,
        record,
        status,
        reason: weakReason(record, status),
        priority: weakPriority(record, status, now),
      });
    }
  }

  return items
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.target.nameRu.localeCompare(b.target.nameRu, "ru") ||
        a.skillId.localeCompare(b.skillId)
    )
    .slice(0, Math.max(1, Number(limit) || 6));
}



export function recordSessionHistory(
  store,
  session,
  {
    regionId = "all",
    modelSource = "",
    storage = globalThis.localStorage,
  } = {}
) {
  if (!session) return null;

  const results = session.results || [];
  const clean = results.filter(
    (result) =>
      result.correct &&
      (Number(result.wrongAttempts) || 0) === 0 &&
      !result.revealed
  ).length;
  const wrongAttempts = results.reduce(
    (sum, result) => sum + Math.max(0, Number(result.wrongAttempts) || 0),
    0
  );
  const revealed = results.filter((result) => result.revealed).length;
  const completedAt = Number(session.finishedAt) || Date.now();
  const sessionId = [
    Number(session.startedAt) || 0,
    completedAt,
    String(session.mode || ""),
    String(regionId || "all"),
  ].join(":");

  return appendSessionHistory(
    store,
    {
      sessionId,
      startedAt: Number(session.startedAt) || 0,
      completedAt,
      mode: String(session.mode || ""),
      region: regionId,
      modelSource,
      total: session.items?.length || results.length,
      clean,
      wrongAttempts,
      revealed,
    },
    storage
  );
}

export function recentSessionHistory(store, limit = 5) {
  return learningHistory(store, limit);
}

export function currentAreaProgress(store, catalog, now = Date.now()) {
  return {
    find: skillProgress(store, catalog, "find", now),
    name: skillProgress(store, catalog, "name", now),
  };
}
