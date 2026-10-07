// Stable domain session contract: IDs, answers and view data, without Three.js objects.
const modes = new Set(['find', 'name', 'practical', 'topography', 'mistakes', 'today', 'exam']);
const skills = new Set(['find', 'name', 'topography']);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const vector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const ids = value => Array.isArray(value) && value.length <= 20000 && value.every(integer);
const strings = value => Array.isArray(value) && value.length <= 32 && value.every(item => typeof item === 'string' && item.length <= 120);

export function encodeLearningSession(session) {
  if (!session) return null;
  return {
    mode: session.mode, index: session.index, startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    ...(session.profileId ? { profileId: session.profileId } : {}),
    items: session.items.map(item => ({ targetId: item.target.id, skillId: item.skillId,
      ...(item.promptTarget ? { promptTargetId: item.promptTarget.id } : {}),
      ...(item.answerTarget ? { answerTargetId: item.answerTarget.id } : {}),
      ...(item.relationId ? { relationId: item.relationId, upperRuleId: item.upperRuleId, deeperRuleId: item.deeperRuleId } : {}) })),
    results: session.results.map(result => ({ ...result })),
  };
}

export function validLearningSession(session) {
  if (session === null) return true;
  if (!object(session) || !modes.has(session.mode) || !Array.isArray(session.items) ||
      session.items.length < 1 || session.items.length > 30 || !integer(session.index) ||
      session.index > session.items.length || !Number.isFinite(session.startedAt) ||
      !(session.finishedAt === null || Number.isFinite(session.finishedAt)) ||
      !Array.isArray(session.results) || session.results.length !== session.index) return false;
  if (!session.items.every(item => object(item) && typeof item.targetId === 'string' &&
      skills.has(item.skillId) && (!item.promptTargetId || typeof item.promptTargetId === 'string') &&
      (!item.answerTargetId || typeof item.answerTargetId === 'string'))) return false;
  return session.results.every((result, index) => object(result) && result.index === index &&
    result.targetId === session.items[index].targetId && result.skillId === session.items[index].skillId &&
    typeof result.correct === 'boolean' && typeof result.revealed === 'boolean' &&
    integer(result.wrongAttempts) && integer(result.navigationActions));
}

export function decodeLearningSession(saved, catalog) {
  if (!saved || !validLearningSession(saved)) return null;
  const targets = new Map(catalog.map(target => [target.id, target]));
  const items = saved.items.map(item => ({ skillId: item.skillId, target: targets.get(item.targetId),
    ...(item.promptTargetId ? { promptTarget: targets.get(item.promptTargetId) } : {}),
    ...(item.answerTargetId ? { answerTarget: targets.get(item.answerTargetId) } : {}),
    ...(item.relationId ? { relationId: item.relationId, upperRuleId: item.upperRuleId, deeperRuleId: item.deeperRuleId } : {}) }));
  if (items.some(item => !item.target || (item.skillId === 'topography' && (!item.promptTarget || !item.answerTarget)))) return null;
  return { ...saved, items, results: saved.results.map(result => ({ ...result })) };
}

export function validAnatomyWorkspace(value) {
  if (!object(value) || value.version !== 1 || !['z-anatomy', 'bodyparts4'].includes(value.model) ||
      !['explore', 'quiz'].includes(value.mode) || typeof value.region !== 'string' ||
      typeof value.regional !== 'boolean' || !modes.has(value.practice) ||
      (!integer(value.size) || value.size < 1 || value.size > 30) || !integer(value.correct) || !integer(value.wrong) ||
      !validLearningSession(value.session) || !['setup', 'question', 'feedback', 'summary'].includes(value.phase) ||
      !integer(value.wrongAttempts) || !integer(value.navigationActions) ||
      !Number.isFinite(value.deadline) || value.deadline < 0 ||
      ![15, 20, 30, 45].includes(value.examSeconds) ||
      !(value.pendingNavigation === null || integer(value.pendingNavigation)) ||
      !['', 'correct', 'wrong', 'navigation'].includes(value.feedbackKind) ||
      !Number.isFinite(value.scroll) || value.scroll < 0 || !Number.isFinite(value.panelScroll) || value.panelScroll < 0 ||
      !object(value.view) || !vector(value.view.camera) || !vector(value.view.target) ||
      !ids(value.view.hiddenMuscles) || !ids(value.view.hiddenBones) || !ids(value.view.hiddenStudy) ||
      !ids(value.view.manualBones) || !strings(value.view.referenceLayers) || !strings(value.view.connectiveLayers) ||
      typeof value.view.preset !== 'string' || value.view.preset.length > 100 || typeof value.view.bonesView !== 'boolean' || typeof value.view.isolated !== 'boolean' ||
      !['off', 'ghost', 'anatomical'].includes(value.view.skinMode) || !['off', 'anatomical'].includes(value.view.connectiveMode) ||
      !['off', 'xray', 'anatomical'].includes(value.view.boneMode) ||
      !['off', 'ghost', 'anatomical'].includes(value.view.muscleMode) ||
      !Number.isFinite(value.view.opacity) || value.view.opacity < 0 || value.view.opacity > 100 ||
      typeof value.feedback !== 'string' || value.feedback.length > 12000 ||
      typeof value.question !== 'string' || value.question.length > 1000 ||
      typeof value.search !== 'string' || value.search.length > 500 ||
      !object(value.progress) || value.progress.version !== 1 || !Number.isFinite(value.progress.updatedAt) ||
      !object(value.progress.records) || !Object.values(value.progress.records).every(object) ||
      !object(value.progress.confusions) || !Array.isArray(value.progress.sessions) ||
      value.progress.sessions.length > 100 || !value.progress.sessions.every(object)) return false;
  if (value.view.selection !== null && (!object(value.view.selection) ||
      !['muscle', 'bone', 'study', 'reference'].includes(value.view.selection.kind) ||
      !integer(value.view.selection.id ?? value.view.selection.partId))) return false;
  if (value.view.selection?.kind === 'reference' && (typeof value.view.selection.layerKey !== 'string' || value.view.selection.layerKey.length > 120)) return false;
  try { return JSON.stringify(value).length <= 2000000; } catch { return false; }
}
