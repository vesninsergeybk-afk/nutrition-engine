import { skillRecord, saveLearningStore } from "./learning-engine.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const RETENTION_OUTCOMES = Object.freeze({
  clean: "clean",
  corrected: "corrected",
  revealed: "revealed",
});

export const DEFAULT_RETENTION_POLICY = Object.freeze({
  initialCleanDays: 1,
  initialCorrectedDays: 0.25,
  initialRevealedDays: 0.08,
  cleanGrowthBase: 1.7,
  cleanGrowthStep: 0.12,
  correctedFactor: 0.55,
  revealedFactor: 0.3,
  minCorrectedDays: 0.25,
  minRevealedDays: 0.08,
  maxDays: 120,
});

function recordKey(muscleId, skillId) {
  return muscleId + "::" + skillId;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function retentionRecord(store, muscleId, skillId) {
  const base = skillRecord(store, muscleId, skillId);
  const raw = store?.records?.[recordKey(muscleId, skillId)] || {};

  const reviewCount = Math.max(0, Number(raw.reviewCount) || 0);
  const stabilityDays = Math.max(0, Number(raw.stabilityDays) || 0);
  const lastReviewedAt = Math.max(0, Number(raw.lastReviewedAt) || 0);

  // Records created before pass 3 have no schedule. If the learner has
  // already practised the skill, treat it as due once so it enters the new
  // scheduling system without erasing previous progress.
  const legacyDueAt =
    base.attempts > 0 && !lastReviewedAt
      ? Math.max(1, Number(base.lastSeen) || 1)
      : 0;

  return {
    ...base,
    reviewCount,
    cleanStreak: Math.max(0, Number(raw.cleanStreak) || 0),
    lapses: Math.max(0, Number(raw.lapses) || 0),
    stabilityDays,
    lastReviewedAt,
    dueAt: Math.max(0, Number(raw.dueAt) || legacyDueAt),
    lastOutcome: raw.lastOutcome || null,
  };
}

export function retentionStatus(store, muscleId, skillId, now = Date.now()) {
  const record = retentionRecord(store, muscleId, skillId);

  if (record.attempts === 0 && record.reviewCount === 0) return "new";
  if (record.reviewDebt > 0) return "due";
  if (!record.dueAt || record.dueAt <= now) return "due";
  return "scheduled";
}

function nextStability(record, outcome, policy) {
  if (outcome === RETENTION_OUTCOMES.clean) {
    if (!record.stabilityDays) return policy.initialCleanDays;
    const growth =
      policy.cleanGrowthBase +
      Math.min(record.cleanStreak, 5) * policy.cleanGrowthStep;
    return clamp(record.stabilityDays * growth, policy.initialCleanDays, policy.maxDays);
  }

  if (outcome === RETENTION_OUTCOMES.corrected) {
    if (!record.stabilityDays) return policy.initialCorrectedDays;
    return clamp(
      record.stabilityDays * policy.correctedFactor,
      policy.minCorrectedDays,
      policy.maxDays
    );
  }

  if (!record.stabilityDays) return policy.initialRevealedDays;
  return clamp(
    record.stabilityDays * policy.revealedFactor,
    policy.minRevealedDays,
    policy.maxDays
  );
}

export function recordReviewOutcome(
  store,
  muscleId,
  skillId,
  outcome,
  storage = globalThis.localStorage,
  options = {}
) {
  if (!Object.values(RETENTION_OUTCOMES).includes(outcome)) {
    throw new Error("Unknown retention outcome: " + outcome);
  }

  const now = Number(options.now) || Date.now();
  const policy = { ...DEFAULT_RETENTION_POLICY, ...(options.policy || {}) };
  const key = recordKey(muscleId, skillId);
  const current = retentionRecord(store, muscleId, skillId);
  const stabilityDays = nextStability(current, outcome, policy);
  const clean = outcome === RETENTION_OUTCOMES.clean;

  store.records[key] = {
    ...(store.records[key] || {}),
    reviewCount: current.reviewCount + 1,
    cleanStreak: clean ? current.cleanStreak + 1 : 0,
    lapses: current.lapses + (clean ? 0 : 1),
    stabilityDays,
    lastReviewedAt: now,
    dueAt: now + Math.round(stabilityDays * DAY_MS),
    lastOutcome: outcome,
  };

  saveLearningStore(store, storage);
  return retentionRecord(store, muscleId, skillId);
}

function duePriority(item, now) {
  if (item.record.reviewDebt > 0) return 1_000_000_000 + item.record.reviewDebt;

  const overdueMs = Math.max(0, now - item.record.dueAt);
  const ageMs = Math.max(0, now - (item.record.lastReviewedAt || item.record.lastSeen || 0));
  const fragility = 1 / Math.max(0.08, item.record.stabilityDays || 0.08);

  return overdueMs / DAY_MS * 1000 + ageMs / DAY_MS + fragility;
}

export function buildTodayQueue(
  store,
  catalog,
  { now = Date.now(), limit = 10 } = {}
) {
  const due = [];

  for (const target of catalog || []) {
    for (const skillId of target.skillIds || ["find", "name"]) {
      const record = retentionRecord(store, target.id, skillId);
      if (record.attempts === 0 && record.reviewCount === 0) continue;
      if (record.reviewDebt <= 0 && record.dueAt > now) continue;

      due.push({
        target,
        skillId,
        record,
        priority: duePriority({ target, skillId, record }, now),
      });
    }
  }

  return due
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.target.nameRu.localeCompare(b.target.nameRu, "ru") ||
        a.skillId.localeCompare(b.skillId)
    )
    .slice(0, Math.max(1, Number(limit) || 10))
    .map(({ target, skillId, record, priority }) => ({ target, skillId, record, priority }));
}

export function retentionSummary(store, catalog, skillId, now = Date.now()) {
  const summary = {
    total: (catalog || []).length,
    new: 0,
    due: 0,
    scheduled: 0,
  };

  for (const target of catalog || []) {
    const status = retentionStatus(store, target.id, skillId, now);
    summary[status] += 1;
  }

  return summary;
}
