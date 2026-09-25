import { confusionPairs, skillRecord } from "./learning-engine.js";
import { buildTodayQueue } from "./retention-engine.js";

export const SESSION_MODES = Object.freeze({
  find: {
    id: "find",
    nameRu: "Найти",
    descriptionRu: "По названию найти мышцу на 3D-модели.",
  },
  name: {
    id: "name",
    nameRu: "Назвать",
    descriptionRu: "По выделенной мышце выбрать её название.",
  },
  practical: {
    id: "practical",
    nameRu: "Практикум",
    descriptionRu: "Смешанная практика: поочерёдно находить мышцы и называть выделенные.",
  },
  mistakes: {
    id: "mistakes",
    nameRu: "Повторить ошибки",
    descriptionRu: "Повторить мышцы и навыки, где уже были ошибки.",
  },
  today: {
    id: "today",
    nameRu: "На сегодня",
    descriptionRu: "Повторить навыки, срок которых подошёл по истории ответов.",
  },
  exam: {
    id: "exam",
    nameRu: "Контроль",
    descriptionRu: "Одна попытка на задание и ограниченное время.",
  },
});

function shuffled(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizedTokens(value) {
  return new Set(
    String(value || "")
      .toLocaleLowerCase("ru-RU")
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]+/giu, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !["мышца", "мышцы", "часть", "головка"].includes(token))
  );
}

function similarityScore(a, b) {
  const aTokens = normalizedTokens(a.nameRu);
  const bTokens = normalizedTokens(b.nameRu);
  let shared = 0;
  for (const token of aTokens) if (bTokens.has(token)) shared += 1;

  let score = shared * 5;
  if (a.region === b.region) score += 3;

  const aName = a.nameRu.toLocaleLowerCase("ru-RU");
  const bName = b.nameRu.toLocaleLowerCase("ru-RU");
  if (aName.includes("больш") && bName.includes("мал")) score += 2;
  if (aName.includes("мал") && bName.includes("больш")) score += 2;
  if (aName.includes("длинн") && bName.includes("корот")) score += 2;
  if (aName.includes("корот") && bName.includes("длинн")) score += 2;
  if (aName.includes("передн") && bName.includes("задн")) score += 2;
  if (aName.includes("задн") && bName.includes("передн")) score += 2;
  if (aName.includes("медиаль") && bName.includes("латераль")) score += 2;
  if (aName.includes("латераль") && bName.includes("медиаль")) score += 2;

  return score;
}

function greedySpreadFrom(items, firstIndex) {
  const remaining = items.filter((_, index) => index !== firstIndex);
  const ordered = [items[firstIndex]];

  while (remaining.length) {
    const previous = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const score = similarityScore(previous, remaining[i]);
      if (score < bestScore) {
        bestIndex = i;
        bestScore = score;
      }
    }

    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }

  return ordered;
}

function sequenceSimilarityPenalty(items) {
  let penalty = 0;
  for (let i = 1; i < items.length; i += 1) {
    const score = similarityScore(items[i - 1], items[i]);
    penalty += score * score;
  }
  return penalty;
}

function spreadSimilarTargets(items, rng = Math.random) {
  const seedOrder = shuffled(items, rng);
  if (seedOrder.length < 3) return seedOrder;

  let best = seedOrder;
  let bestPenalty = Infinity;

  // Sessions are capped at 30 targets, so evaluating every possible starting
  // target remains cheap and avoids leaving a confusable pair together merely
  // because of an unlucky starting point.
  for (let firstIndex = 0; firstIndex < seedOrder.length; firstIndex += 1) {
    const candidate = greedySpreadFrom(seedOrder, firstIndex);
    const penalty = sequenceSimilarityPenalty(candidate);
    if (penalty < bestPenalty) {
      best = candidate;
      bestPenalty = penalty;
    }
  }

  return best;
}

function confusionWeight(store, targetId, candidateId) {
  if (!store) return 0;

  return confusionPairs(store, { skillId: "name", limit: 50 })
    .filter(
      (entry) =>
        entry.expectedMuscleId === targetId &&
        entry.chosenMuscleId === candidateId
    )
    .reduce((sum, entry) => sum + Math.min(4, Number(entry.count) || 0), 0);
}

export function buildSmartChoices(
  target,
  catalog,
  count = 4,
  rng = Math.random,
  { store = null } = {}
) {
  const pool = (catalog || []).filter((item) => item.id !== target.id);
  const sameRegion = pool.filter((item) => item.region === target.region);
  const primaryPool =
    sameRegion.length >= Math.max(3, count - 1) ? sameRegion : pool;

  const ranked = primaryPool
    .map((item) => ({
      item,
      score:
        similarityScore(target, item) +
        confusionWeight(store, target.id, item.id) * 6,
      tie: rng(),
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie);

  const selected = [];
  for (const entry of ranked) {
    if (selected.length >= Math.max(0, count - 1)) break;

    // Avoid choices that collapse to the same visible Russian label.
    if (
      selected.some(
        (other) =>
          other.nameRu.toLocaleLowerCase("ru-RU") ===
          entry.item.nameRu.toLocaleLowerCase("ru-RU")
      )
    ) continue;

    selected.push(entry.item);
  }

  if (selected.length < Math.max(0, count - 1)) {
    for (const item of pool) {
      if (selected.length >= Math.max(0, count - 1)) break;
      if (selected.some((other) => other.id === item.id)) continue;
      selected.push(item);
    }
  }

  return shuffled([target, ...selected], rng);
}

export function mistakeTargets(store, catalog) {
  const items = [];

  for (const target of catalog || []) {
    const find = skillRecord(store, target.id, "find");
    const name = skillRecord(store, target.id, "name");

    if (find.reviewDebt > 0) {
      items.push({
        target,
        skillId: "find",
        debt: find.reviewDebt,
      });
    }

    if (name.reviewDebt > 0) {
      items.push({
        target,
        skillId: "name",
        debt: name.reviewDebt,
      });
    }
  }

  return items.sort(
    (a, b) =>
      b.debt - a.debt ||
      a.target.nameRu.localeCompare(b.target.nameRu, "ru") ||
      a.skillId.localeCompare(b.skillId)
  );
}

function spreadReviewItems(items, rng = Math.random) {
  const remaining = [...items];
  const ordered = [];

  while (remaining.length) {
    const previous = ordered[ordered.length - 1];
    let candidates = remaining.map((item, index) => ({
      item,
      index,
      tie: rng(),
    }));

    if (previous) {
      const differentTarget = candidates.filter(
        ({ item }) => item.target.id !== previous.target.id
      );
      if (differentTarget.length) candidates = differentTarget;
    }

    candidates.sort((a, b) => {
      const aPriority = Number(a.item.priority ?? a.item.debt ?? 0);
      const bPriority = Number(b.item.priority ?? b.item.debt ?? 0);
      const priorityOrder = bPriority - aPriority;
      if (priorityOrder) return priorityOrder;

      if (previous) {
        const similarityOrder =
          similarityScore(previous.target, a.item.target) -
          similarityScore(previous.target, b.item.target);
        if (similarityOrder) return similarityOrder;
      }

      return a.tie - b.tie;
    });

    const chosenIndex = candidates[0].index;
    ordered.push(remaining.splice(chosenIndex, 1)[0]);
  }

  return ordered;
}

function practiceRecordForMode(store, target, mode) {
  const find = skillRecord(store, target.id, "find");
  const name = skillRecord(store, target.id, "name");

  if (mode === "find") return find;
  if (mode === "name") return name;

  return {
    attempts: Math.min(find.attempts, name.attempts),
    wrong: find.wrong + name.wrong,
    correct: find.correct + name.correct,
  };
}

function balancedPracticeTargets(catalog, store, mode, size, rng = Math.random) {
  const ranked = (catalog || [])
    .map((target) => {
      const record = practiceRecordForMode(store, target, mode);
      return {
        target,
        attempts: Number(record.attempts) || 0,
        wrong: Number(record.wrong) || 0,
        tie: rng(),
      };
    })
    .sort(
      (a, b) =>
        a.attempts - b.attempts ||
        b.wrong - a.wrong ||
        a.tie - b.tie
    );

  const selected = ranked
    .slice(0, Math.min(size, ranked.length))
    .map((entry) => entry.target);

  return spreadSimilarTargets(selected, rng);
}

export function createLearningSession({
  mode = "find",
  catalog = [],
  store,
  size = 10,
  rng = Math.random,
  now = Date.now(),
}) {
  const safeSize = Math.max(1, Math.min(Number(size) || 10, 30));
  let items = [];

  if (mode === "mistakes") {
    items = spreadReviewItems(mistakeTargets(store, catalog), rng)
      .slice(0, safeSize)
      .map((entry) => ({
        target: entry.target,
        skillId: entry.skillId,
      }));
  } else if (mode === "today") {
    items = spreadReviewItems(
      buildTodayQueue(store, catalog, { now, limit: safeSize }),
      rng
    ).map((entry) => ({
      target: entry.target,
      skillId: entry.skillId,
    }));
  } else {
    const pool = balancedPracticeTargets(
      catalog,
      store,
      mode,
      Math.min(safeSize, catalog.length),
      rng
    );

    if (mode === "practical" || mode === "exam") {
      const startWithName = rng() >= 0.5;
      items = pool.map((target, index) => ({
        target,
        skillId:
          (index + (startWithName ? 1 : 0)) % 2 === 0 ? "find" : "name",
      }));
    } else {
      const skillId = mode === "name" ? "name" : "find";
      items = pool.map((target) => ({ target, skillId }));
    }
  }

  return {
    mode,
    items,
    index: 0,
    results: [],
    startedAt: Date.now(),
    finishedAt: null,
  };
}

export function currentSessionItem(session) {
  if (!session || session.index < 0 || session.index >= session.items.length) return null;
  return session.items[session.index];
}

export function completeSessionItem(session, result) {
  if (!session || !currentSessionItem(session)) return session;

  session.results.push({
    index: session.index,
    targetId: session.items[session.index].target.id,
    skillId: session.items[session.index].skillId,
    correct: Boolean(result?.correct),
    wrongAttempts: Math.max(0, Number(result?.wrongAttempts) || 0),
    revealed: Boolean(result?.revealed),
  });

  session.index += 1;
  if (session.index >= session.items.length) session.finishedAt = Date.now();
  return session;
}

export function sessionProgress(session) {
  if (!session) return { current: 0, total: 0, done: 0, finished: false };
  const total = session.items.length;
  const done = Math.min(session.index, total);
  return {
    current: total ? Math.min(done + 1, total) : 0,
    total,
    done,
    finished: Boolean(session.finishedAt) || done >= total,
  };
}

export function sessionSummary(session) {
  const results = session?.results || [];
  const correct = results.filter((result) => result.correct).length;
  const revealed = results.filter((result) => result.revealed).length;
  const wrongAttempts = results.reduce((sum, result) => sum + result.wrongAttempts, 0);

  return {
    total: session?.items?.length || 0,
    completed: results.length,
    correct,
    revealed,
    wrongAttempts,
    clean: results.filter(
      (result) => result.correct && result.wrongAttempts === 0 && !result.revealed
    ).length,
  };
}
