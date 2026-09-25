import {
  LEARNING_REGIONS,
  filterCatalogByRegion,
  regionNameRu,
  saveLearningStore,
  skillRecord,
} from "./learning-engine.js";
import {
  retentionRecord,
  retentionStatus,
} from "./retention-engine.js";

function confusionKey(targetId, chosenId, skillId) {
  return [skillId, targetId, chosenId].join("::");
}

export function recordConfusion(
  store,
  targetId,
  chosenId,
  skillId,
  storage = globalThis.localStorage,
  now = Date.now()
) {
  if (!store || !targetId || !chosenId || targetId === chosenId) return null;
  if (skillId !== "find" && skillId !== "name") return null;

  store.confusions ||= {};
  const key = confusionKey(targetId, chosenId, skillId);
  const current = store.confusions[key] || {};

  store.confusions[key] = {
    targetId,
    chosenId,
    skillId,
    count: Math.max(0, Number(current.count) || 0) + 1,
    lastSeen: Math.max(0, Number(now) || Date.now()),
  };

  saveLearningStore(store, storage);
  return store.confusions[key];
}

export function topConfusions(
  store,
  catalog,
  { limit = 5, skillId = null } = {}
) {
  const byId = new Map((catalog || []).map((item) => [item.id, item]));
  return Object.values(store?.confusions || {})
    .filter((entry) => !skillId || entry.skillId === skillId)
    .map((entry) => ({
      ...entry,
      target: byId.get(entry.targetId),
      chosen: byId.get(entry.chosenId),
    }))
    .filter((entry) => entry.target && entry.chosen)
    .sort(
      (a, b) =>
        (Number(b.count) || 0) - (Number(a.count) || 0) ||
        (Number(b.lastSeen) || 0) - (Number(a.lastSeen) || 0) ||
        a.target.nameRu.localeCompare(b.target.nameRu, "ru")
    )
    .slice(0, Math.max(1, Number(limit) || 5));
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

    rows.push({
      regionId: region.id,
      nameRu: region.nameRu,
      total: items.length,
      find,
      name,
      seen: Math.max(find.seen, name.seen),
      due: find.due + name.due,
    });
  }

  return rows;
}

function weakReason(record, status) {
  if (record.reviewDebt > 0) return "есть ошибка для повторения";
  if (status === "due") return "подошёл срок повторения";

  const attempts = Math.max(0, Number(record.attempts) || 0);
  const wrong = Math.max(0, Number(record.wrong) || 0);
  const errorRate = attempts ? wrong / attempts : 0;

  if (record.lapses >= 2) return "повторные затруднения";
  if (attempts >= 2 && errorRate >= 0.4) return "частые ошибки";
  return "давно не повторялась";
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

      if (
        record.reviewDebt <= 0 &&
        status !== "due" &&
        record.lapses < 2 &&
        !(attempts >= 2 && errorRate >= 0.4)
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
    modelSource = null,
    storage = globalThis.localStorage,
  } = {}
) {
  if (!store || !session || !session.finishedAt) return null;

  store.sessionHistory ||= [];
  const existing = store.sessionHistory.find(
    (entry) => Number(entry.startedAt) === Number(session.startedAt)
  );
  if (existing) return existing;

  const results = session.results || [];
  const entry = {
    startedAt: Number(session.startedAt) || 0,
    finishedAt: Number(session.finishedAt) || Date.now(),
    mode: session.mode,
    regionId,
    regionNameRu: regionNameRu(regionId),
    modelSource,
    total: session.items?.length || 0,
    completed: results.length,
    clean: results.filter(
      (result) =>
        result.correct &&
        (Number(result.wrongAttempts) || 0) === 0 &&
        !result.revealed
    ).length,
    wrongAttempts: results.reduce(
      (sum, result) => sum + Math.max(0, Number(result.wrongAttempts) || 0),
      0
    ),
    revealed: results.filter((result) => result.revealed).length,
  };

  store.sessionHistory.push(entry);
  store.sessionHistory = store.sessionHistory
    .sort((a, b) => Number(a.startedAt) - Number(b.startedAt))
    .slice(-60);

  saveLearningStore(store, storage);
  return entry;
}

export function recentSessionHistory(store, limit = 5) {
  return [...(store?.sessionHistory || [])]
    .sort((a, b) => Number(b.startedAt) - Number(a.startedAt))
    .slice(0, Math.max(1, Number(limit) || 5));
}

export function currentAreaProgress(store, catalog, now = Date.now()) {
  return {
    find: skillProgress(store, catalog, "find", now),
    name: skillProgress(store, catalog, "name", now),
  };
}
