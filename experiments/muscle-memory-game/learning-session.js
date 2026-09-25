import { skillRecord } from "./learning-engine.js";

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
    descriptionRu: "Последовательно найти небольшой набор мышц региона.",
  },
  mistakes: {
    id: "mistakes",
    nameRu: "Повторить ошибки",
    descriptionRu: "Повторить мышцы и навыки, где уже были ошибки.",
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

export function buildSmartChoices(target, catalog, count = 4, rng = Math.random) {
  const distractors = (catalog || [])
    .filter((item) => item.id !== target.id)
    .map((item) => ({
      item,
      score: similarityScore(target, item),
      tie: rng(),
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, Math.max(0, count - 1))
    .map((entry) => entry.item);

  return shuffled([target, ...distractors], rng);
}

function mistakeItemForTarget(store, target) {
  const find = skillRecord(store, target.id, "find");
  const name = skillRecord(store, target.id, "name");

  const findDebt = find.wrong;
  const nameDebt = name.wrong;
  if (findDebt <= 0 && nameDebt <= 0) return null;

  return {
    target,
    skillId: nameDebt > findDebt ? "name" : "find",
    debt: Math.max(findDebt, nameDebt),
  };
}

export function mistakeTargets(store, catalog) {
  return (catalog || [])
    .map((target) => mistakeItemForTarget(store, target))
    .filter(Boolean)
    .sort((a, b) => b.debt - a.debt || a.target.nameRu.localeCompare(b.target.nameRu, "ru"));
}

export function createLearningSession({
  mode = "find",
  catalog = [],
  store,
  size = 10,
  rng = Math.random,
}) {
  const safeSize = Math.max(1, Math.min(Number(size) || 10, 30));
  let items = [];

  if (mode === "mistakes") {
    items = mistakeTargets(store, catalog)
      .slice(0, safeSize)
      .map((entry) => ({
        target: entry.target,
        skillId: entry.skillId,
      }));
  } else {
    const skillId = mode === "name" ? "name" : "find";
    const pool = shuffled(catalog, rng).slice(0, Math.min(safeSize, catalog.length));
    items = pool.map((target) => ({ target, skillId }));
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
