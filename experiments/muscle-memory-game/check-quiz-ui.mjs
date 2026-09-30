import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app, styles, engine, specimens, session] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("learning-engine.js", root), "utf8"),
  readFile(new URL("virtual-specimens.js", root), "utf8"),
  readFile(new URL("learning-session.js", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('id="scope-label">Анатомическая область</span>') &&
    html.includes('aria-label="Учебный блок или анатомическая область"') &&
    app.includes('scopeLabel.textContent = mode === "quiz" ? "Учебный блок" : "Анатомическая область"'),
  "Regional selector must read as an anatomical area in Atlas and as a learning block in Training"
);

for (const scope of [
  "upper-limb",
  "lower-limb",
  "neck",
  "neck-collar",
  "foot",
  "erector-spinae",
  "rotator-cuff",
  "scapular-stabilizers",
]) {
  assert(
    engine.includes('id: "' + scope + '"') ||
      specimens.includes('"' + scope + '"'),
    "Missing course-ready scope/specimen: " + scope
  );
}

assert(
  html.includes('id="scope-controls"') &&
    html.includes('id="region-isolation"') &&
    /scope-controls[\s\S]*learning-region/.test(html),
  "Learning block selector is not a persistent scene control"
);
assert(
  app.includes("function regionIsolationActive()") &&
    app.includes("applyRegionScene({ resetLayers: true })") &&
    app.includes("applyRegionMuscleVisibility()") &&
    app.includes("focusLearningRegion();"),
  "Learning block does not control real scene isolation"
);
assert(
  app.includes("buildSmartChoices(item.target, availableTargets"),
  "Recognition choices are not restricted to the active learning block"
);
assert(
  app.includes("function syncLearningSessionSizes()") &&
    app.includes("Весь блок ·"),
  "Quiz size does not adapt to small regional blocks"
);
assert(
  app.includes('params.get("scope") || params.get("region")') &&
    app.includes('url.searchParams.set("scope", selectedLearningRegion)'),
  "Learning blocks are not deep-linkable for course embeds"
);
assert(
  app.includes("focusLearningRegion();") &&
    app.includes('focusShoulderButton.textContent = appMode === "quiz" ? "К блоку" : "К области"'),
  "Regional camera navigation must use mode-appropriate terminology"
);
assert(
  session.includes("const buckets = new Map()") &&
    session.includes("for (const region of regionOrder)"),
  "Composite-region sessions are not balanced across anatomical subregions"
);
assert(
  session.includes("bySkill") &&
    app.includes("Найти на модели: без ошибок") &&
    app.includes("Назвать: без ошибок"),
  "Session feedback does not separate localization and naming retrieval"
);

console.log("Quiz UI contract: course scopes + active-block choices + adaptive size + deep links");


assert(
  app.includes("applyRegionBoneVisibility()") &&
    app.includes('boneDisplayMode = "anatomical"') &&
    app.includes('canvas.dataset.boneScope = regionIsolationActive() ? "regional" : "full"'),
  "Regional bone support must stay filtered and remain visible by default"
);
assert(
  app.includes("studyStructureMatchesActiveRegion") &&
    app.includes("applyRegionStudyVisibility"),
  "Tissue layers are not filtered to the selected learning block"
);

assert(
  html.includes(">Анатомический контекст<") &&
    html.includes(">Глубина мышц<") &&
    html.includes("Контур кожи") &&
    html.includes("Дополнительные ткани") &&
    !html.includes(">Послойное изучение<"),
  "Display panel must separate muscle depth from optional anatomical context"
);
assert(
  html.includes('id="show-all"') &&
    app.includes('"Вернуть структуры области"') &&
    app.includes('"Вернуть все структуры"'),
  "Restore-scene action does not distinguish regional area from whole-atlas context"
);

assert(
  app.includes("regionIsolationField.hidden = true") &&
    app.includes('regionIsolation.checked = selectedLearningRegion !== "all"') &&
    app.includes('focusShoulderButton.addEventListener("click", () => {') &&
    app.includes('focusSelectedButton.addEventListener("click", () => focusSelectedStructures())'),
  "Area selection must control isolation directly and camera buttons must not receive MouseEvent as navigation arguments"
);


assert(
  html.includes('id="quiz-muscle-actions"') &&
    html.includes('id="quiz-muscle-select"') &&
    html.includes('id="quiz-muscle-hide"') &&
    app.includes("function openQuizMuscleActions") &&
    app.includes("function hideQuizMuscleCandidate") &&
    app.includes("chooseQuiz(sid, hitStack, { explicitAnswer: true })"),
  "Find-mode muscle taps must open an explicit choose-or-hide action instead of submitting immediately"
);
assert(
  app.includes('canvas.dataset.quizLastHiddenSid = String(sid)') &&
    app.includes('currentItemNavigationActions += 1') &&
    app.includes("Это действие не засчитывается как ошибка."),
  "Hiding a covering muscle in Training must be recorded as navigation, not as an answer error"
);

assert(
  html.includes('id="undo-quiz-hide"') &&
    app.includes("const quizManualHiddenStack = []") &&
    app.includes("function undoQuizHiddenMuscle") &&
    app.includes('undoQuizHideButton?.addEventListener("click", undoQuizHiddenMuscle)'),
  "Training layer navigation must be reversible so an accidental hide cannot strand the learner"
);
assert(
  app.includes('quizMuscleActionsName.textContent = "Эта мышца"') &&
    app.includes('quizMuscleHideButton.hidden = examMode') &&
    app.includes('learningSession?.mode === "exam"'),
  "Find-mode actions must not reveal muscle identity before commitment, and Control must not allow free layer hiding"
);
assert(
  app.includes("function revealAnswer()") &&
    app.includes("closeQuizMuscleActions();") &&
    app.includes('canvas.dataset.quizLastRestoredSid = String(sid)'),
  "Answer reveal and undo must clear stale contextual actions and expose deterministic state for browser checks"
);
assert(
  app.includes('panelEl.prepend(questionCardEl)') &&
    app.includes('document.body.classList.remove("task-docked")') &&
    !app.includes('viewerWrap.appendChild(questionCardEl)') &&
    styles.includes('body.session-active:not(.motion-mode) .viewer-tools') &&
    styles.includes('body.session-active .panel .question-card'),
  "Mobile Training must keep the task card and controls off the anatomy canvas"
);

console.log("Quiz mobile interaction contract: clear viewer + choose/hide contextual action");

const answerRevealStart = app.indexOf("function revealQuizAnswerInContext");
const answerRevealEnd = app.indexOf("\n\nfunction revealAnswer", answerRevealStart);
const answerRevealBlock =
  answerRevealStart >= 0 && answerRevealEnd > answerRevealStart
    ? app.slice(answerRevealStart, answerRevealEnd)
    : "";

assert(
  answerRevealBlock &&
    answerRevealBlock.includes("verifiedCoveringStructureIds(sid)") &&
    answerRevealBlock.includes("answerTargetSamplePoints(targetIds, 9)") &&
    answerRevealBlock.includes("answerOccludersFromCamera(targetIds, answerSamples)") &&
    answerRevealBlock.includes("focusBox(box, 2.75, answerView.direction)") &&
    answerRevealBlock.includes("applyBodyPartsSurfaceConflictGuards()") &&
    answerRevealBlock.includes("setStructureVisible(sid, true)") &&
    !answerRevealBlock.includes("setVisibleStructures(targetIds)"),
  "Answer reveal must keep anatomical context: hide verified/multi-ray occluders, keep the target visible, and avoid full isolation"
);
assert(
  app.includes("function answerRevealDirectionForBox") &&
    app.includes('label: (best?.label || "current") + "-oblique"') &&
    app.includes("THREE.MathUtils.degToRad(16 * yawSign)") &&
    app.includes('canvas.dataset.answerRevealPadding = "2.75"') &&
    app.includes('canvas.dataset.answerRevealSampleCount'),
  "Show-answer camera must use a wider padded oblique view and expose multi-sample occlusion state"
);
assert(
  app.includes("revealQuizAnswerInContext(") &&
    app.includes('canvas.dataset.answerRevealHidden = ""') &&
    app.includes('canvas.dataset.answerRevealTargetIds = ""') &&
    app.includes("Перекрывающие наружные мышцы скрыты, ближайшее окружение оставлено."),
  "Show-answer flow must reset and expose its contextual reveal state for each learning item"
);

assert(
  app.includes("function clearAnswerRevealOverlay()") &&
    app.includes("new THREE.MeshBasicMaterial({") &&
    app.includes("kind: \"answer-highlight\"") &&
    app.includes("depthTest: true") &&
    app.includes("depthWrite: false") &&
    app.includes('canvas.dataset.answerRevealOverlayCount = String(answerRevealOverlayMeshes.length)') &&
    app.includes("clearAnswerRevealOverlay();"),
  "Show answer must add an unlit depth-tested overlay to the revealed muscle and remove it with normal highlight cleanup"
);

console.log("Answer reveal emphasis: visible cyan overlay + deterministic cleanup");

console.log("Answer reveal contract: moderate oblique focus + occluder removal + preserved context");

