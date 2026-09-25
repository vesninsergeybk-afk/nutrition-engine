import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { structureTerm, structureSearchText } from "./anatomy-terms-ru.js";
import {
  bodyPartsAnatomyKind,
  bodyPartsClassificationStats,
} from "./bodyparts4-classification.js";
import {
  LEARNING_REGIONS,
  buildMuscleCatalog,
  filterCatalogByRegion,
  learningSummary,
  loadLearningStore,
  recordLearningAttempt,
  regionCounts,
  regionNameRu,
} from "./learning-engine.js";
import {
  SESSION_MODES,
  buildSmartChoices,
  completeSessionItem,
  createLearningSession,
  currentSessionItem,
  mistakeTargets,
  sessionProgress,
  sessionSummary,
} from "./learning-session.js";

const MUSCLE_MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb";
const SKELETON_MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/iskelet.glb";

const BODYPARTS_SOURCE_ROOT =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public";
const BODYPARTS_ATLAS_URL = BODYPARTS_SOURCE_ROOT + "/models/atlas.json";

const COVER_RE =
  /fascia|aponeuros|retinacul|peritone|pleura|dura mater|pericardi|omentum|epicardium/i;

const canvas = document.querySelector("#viewer");
const loadingEl = document.querySelector("#loading");
const questionLabelEl = document.querySelector("#question-label");
const questionEl = document.querySelector("#question");
const feedbackEl = document.querySelector("#feedback");
const nextButton = document.querySelector("#next-question");
const answerButton = document.querySelector("#show-answer");
const correctEl = document.querySelector("#score-correct");
const wrongEl = document.querySelector("#score-wrong");
const scoreEl = document.querySelector("#score");
const diagnosticsEl = document.querySelector("#diagnostics");
const meshNamesEl = document.querySelector("#mesh-names");
const targetStatusEl = document.querySelector("#target-status");
const learningControls = document.querySelector("#learning-controls");
const learningRegion = document.querySelector("#learning-region");
const learningSummaryEl = document.querySelector("#learning-summary");
const learningSessionMode = document.querySelector("#learning-session-mode");
const learningSessionSize = document.querySelector("#learning-session-size");
const startLearningSessionButton = document.querySelector("#start-learning-session");
const sessionProgressEl = document.querySelector("#session-progress");
const nameChoicesEl = document.querySelector("#name-choices");
const revealDeeperButton = document.querySelector("#reveal-deeper");
const boneMode = document.querySelector("#bone-mode");
const boneOpacity = document.querySelector("#bone-opacity");
const connectiveMode = document.querySelector("#connective-mode");
const modelSource = document.querySelector("#model-source");
const focusShoulderButton = document.querySelector("#focus-shoulder");
const focusFullButton = document.querySelector("#focus-full");
const focusSelectedButton = document.querySelector("#focus-selected");
const viewPreset = document.querySelector("#view-preset");
const modeQuizButton = document.querySelector("#mode-quiz");
const modeExploreButton = document.querySelector("#mode-explore");
const quizActions = document.querySelector("#quiz-actions");
const exploreControls = document.querySelector("#explore-controls");
const searchInput = document.querySelector("#structure-search");
const searchResults = document.querySelector("#search-results");
const isolateButton = document.querySelector("#isolate-selected");
const hideSelectedButton = document.querySelector("#hide-selected");
const undoHideButton = document.querySelector("#undo-hide");
const showAllButton = document.querySelector("#show-all");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdedbd4);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 5000);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  stencil: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.zoomToCursor = true;
controls.zoomSpeed = 0.72;
controls.panSpeed = 0.72;
controls.rotateSpeed = 0.78;
controls.maxPolarAngle = Math.PI * 0.98;

scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.2));

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 5, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 1.1);
fill.position.set(-4, 1, -3);
scene.add(fill);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let anatomyMesh = null;
let skeletonMesh = null;
let connectiveMesh = null;
let structureNames = [];
let structureRanges = [];
let structureVisibility = [];
let baseColors = [];
let highlightedIds = new Set();
let bodySize = new THREE.Vector3(1, 1, 1);

let appMode = "quiz";
let learningCatalog = [];
let selectedLearningRegion = "all";
let learningStore = loadLearningStore();
let selectedSessionMode = "find";
let learningSession = null;
let currentItemWrongAttempts = 0;
let lastWrongSid = null;
let sessionSummaryShown = false;
let availableTargets = [];
let currentTarget = null;
let selectedExploreSid = null;
let isolated = false;
const hiddenStack = [];
let locked = false;
let correct = 0;
let wrong = 0;
const activePointers = new Map();
let tapBlocked = false;
let focusedStructureIds = [];
let boneDisplayMode = "anatomical";
let connectiveDisplayMode = "anatomical";
let currentModelSource = "z-anatomy";
let initialQueryApplied = false;

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function baseColorFor(name) {
  const hash = hashString(name);
  const hue = 0.985 + (hash % 20) / 2000;
  const saturation = 0.43 + ((hash >>> 5) % 10) / 100;
  const lightness = 0.47 + ((hash >>> 9) % 8) / 100;
  return new THREE.Color().setHSL(hue % 1, saturation, lightness);
}

function displayStructureName(sid) {
  const sourceName = structureNames[sid] || "Неизвестная структура";
  const term = structureTerm(sourceName);

  // Пользовательский интерфейс — русскоязычный. Исходное имя остаётся
  // поисковым синонимом и диагностическим идентификатором.
  return term.nameRu || sourceName;
}

const navPoint = new THREE.Vector3();

function currentViewDirection() {
  const direction = camera.position.clone().sub(controls.target);
  if (direction.lengthSq() < 1e-8) direction.set(0.28, 0.04, 1);
  return direction.normalize();
}

function focusBox(box, padding = 1.22, direction = currentViewDirection()) {
  if (!box || box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const fitHeight = size.y / (2 * Math.tan(verticalFov / 2));
  const fitWidth = size.x / (2 * Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.2));
  const distance = Math.max(fitHeight, fitWidth, size.z * 1.25, controls.minDistance) * padding;

  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  controls.update();
}

function worldBodyBox() {
  if (!anatomyMesh) return new THREE.Box3();
  anatomyMesh.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(anatomyMesh);
}

function setFullBodyView(direction = new THREE.Vector3(0.22, 0.035, 1).normalize()) {
  const box = worldBodyBox();
  if (box.isEmpty()) return;
  focusBox(box, 1.12, direction);
}

function setViewPreset(value) {
  const directions = {
    threeQuarter: new THREE.Vector3(0.35, 0.04, 1).normalize(),
    front: new THREE.Vector3(0, 0.02, 1).normalize(),
    back: new THREE.Vector3(0, 0.02, -1).normalize(),
    left: new THREE.Vector3(-1, 0.02, 0).normalize(),
    right: new THREE.Vector3(1, 0.02, 0).normalize(),
  };
  setFullBodyView(directions[value] || directions.threeQuarter);
}

function setShoulderView() {
  const body = worldBodyBox();
  if (body.isEmpty()) return;

  const size = body.getSize(new THREE.Vector3());
  const region = new THREE.Box3(
    new THREE.Vector3(
      body.min.x - size.x * 0.03,
      body.max.y - size.y * 0.43,
      body.min.z - size.z * 0.06
    ),
    new THREE.Vector3(
      body.max.x + size.x * 0.03,
      body.max.y - size.y * 0.08,
      body.max.z + size.z * 0.06
    )
  );

  focusBox(region, 1.12);
}

function boxForStructures(ids) {
  const box = new THREE.Box3().makeEmpty();
  if (!anatomyMesh || !ids.length) return box;

  anatomyMesh.updateMatrixWorld(true);
  const position = anatomyMesh.geometry.getAttribute("position");

  for (const sid of ids) {
    const range = structureRanges[sid];
    if (!range) continue;

    for (let i = range.start; i < range.start + range.count; i += 1) {
      navPoint.fromBufferAttribute(position, i).applyMatrix4(anatomyMesh.matrixWorld);
      box.expandByPoint(navPoint);
    }
  }

  return box;
}

function focusSelectedStructures(padding = 1.65) {
  if (!focusedStructureIds.length) return;
  const box = boxForStructures(focusedStructureIds);
  if (!box.isEmpty()) focusBox(box, padding);
}

function focusLearningRegion() {
  if (!availableTargets.length) {
    setFullBodyView();
    return;
  }

  const ids = [...new Set(availableTargets.flatMap((target) => target.sids || []))];
  const box = boxForStructures(ids);
  if (box.isEmpty()) {
    setFullBodyView();
    return;
  }

  focusBox(box, selectedLearningRegion === "all" ? 1.12 : 1.28);
}

function fitCamera(object) {
  const box = new THREE.Box3().setFromObject(object);
  bodySize.copy(box.getSize(new THREE.Vector3()));
  const center = box.getCenter(new THREE.Vector3());

  object.position.sub(center);
  object.updateMatrixWorld(true);

  const maxDim = Math.max(bodySize.x, bodySize.y, bodySize.z);
  camera.near = Math.max(maxDim / 12000, 0.001);
  camera.far = maxDim * 16;
  camera.updateProjectionMatrix();

  controls.minDistance = Math.max(maxDim * 0.055, 0.035);
  controls.maxDistance = maxDim * 2.7;
  controls.cursor.set(0, 0, 0);
  controls.minTargetRadius = 0;
  controls.maxTargetRadius = maxDim * 0.82;

  setFullBodyView();
}

function targetStructureIds(target) {
  return target?.sids ? [...target.sids] : [];
}

function paintStructure(sid, color) {
  if (!anatomyMesh || !structureRanges[sid]) return;

  const attr = anatomyMesh.geometry.getAttribute("color");
  const { start, count } = structureRanges[sid];

  for (let i = start; i < start + count; i += 1) {
    attr.setXYZ(i, color.r, color.g, color.b);
  }
}

function restoreHighlights() {
  if (!anatomyMesh || !highlightedIds.size) return;

  for (const sid of highlightedIds) {
    paintStructure(sid, baseColors[sid]);
  }
  anatomyMesh.geometry.getAttribute("color").needsUpdate = true;
  highlightedIds.clear();
}

function highlightStructures(ids, kind = "answer") {
  if (!anatomyMesh) return;

  const colors = {
    answer: 0x168148,
    wrong: 0x751d28,
    selected: 0x245da8,
  };
  const color = new THREE.Color(colors[kind] || colors.answer);

  for (const sid of ids) {
    paintStructure(sid, color);
    highlightedIds.add(sid);
  }
  anatomyMesh.geometry.getAttribute("color").needsUpdate = true;
}

function updateLayerButtons() {
  isolateButton.textContent = isolated ? "Показать окружение" : "Изолировать";
  undoHideButton.disabled = hiddenStack.length === 0;
  hideSelectedButton.disabled =
    selectedExploreSid == null ||
    isolated ||
    structureVisibility[selectedExploreSid] === false;
}

function setStructureVisible(sid, visible) {
  if (!anatomyMesh || sid == null || !structureRanges[sid]) return;

  const attr = anatomyMesh.geometry.getAttribute("structureVisible");
  if (!attr) return;

  const range = structureRanges[sid];
  attr.array.fill(visible ? 1 : 0, range.start, range.start + range.count);
  attr.needsUpdate = true;
  structureVisibility[sid] = visible;
}

function setVisibleStructures(ids = null) {
  if (!anatomyMesh) return;

  const attr = anatomyMesh.geometry.getAttribute("structureVisible");
  if (!attr) return;

  if (ids === null) {
    attr.array.fill(1);
    structureVisibility = structureNames.map(() => true);
    isolated = false;
  } else {
    attr.array.fill(0);
    structureVisibility = structureNames.map(() => false);

    for (const sid of ids) {
      const range = structureRanges[sid];
      if (!range) continue;
      attr.array.fill(1, range.start, range.start + range.count);
      structureVisibility[sid] = true;
    }
    isolated = true;
  }

  attr.needsUpdate = true;
  updateLayerButtons();
}

function showAllStructures() {
  setVisibleStructures(null);
  hiddenStack.length = 0;
  updateLayerButtons();
}

function hideSelectedStructure() {
  if (
    appMode !== "explore" ||
    selectedExploreSid == null ||
    isolated ||
    structureVisibility[selectedExploreSid] === false
  ) return;

  const sid = selectedExploreSid;
  hiddenStack.push(sid);
  setStructureVisible(sid, false);
  restoreHighlights();

  selectedExploreSid = null;
  focusedStructureIds = [];
  focusSelectedButton.disabled = true;
  isolateButton.disabled = true;
  questionLabelEl.textContent = "Слой скрыт";
  questionEl.textContent = displayStructureName(sid);
  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    "Поверхностная структура скрыта. Теперь можно выбрать лежащую глубже мышцу.";
  updateLayerButtons();
}

function undoLastHide() {
  const sid = hiddenStack.pop();
  if (sid == null) return;

  setStructureVisible(sid, true);
  selectedExploreSid = sid;
  focusedStructureIds = [sid];
  restoreHighlights();
  highlightStructures([sid], "selected");

  questionLabelEl.textContent = "Возвращена структура";
  questionEl.textContent = displayStructureName(sid);
  feedbackEl.className = "feedback";
  feedbackEl.textContent = "Последняя скрытая структура снова показана.";
  focusSelectedButton.disabled = false;
  isolateButton.disabled = false;
  updateLayerButtons();
}

function renderLearningRegionOptions() {
  const counts = regionCounts(learningCatalog);
  const previous = selectedLearningRegion;

  learningRegion.replaceChildren();

  for (const region of LEARNING_REGIONS) {
    const count = counts[region.id] || 0;
    if (region.id !== "all" && count === 0) continue;

    const option = document.createElement("option");
    option.value = region.id;
    option.textContent =
      region.id === "all"
        ? `${region.nameRu} · ${counts.all}`
        : `${region.nameRu} · ${count}`;
    learningRegion.appendChild(option);
  }

  const stillAvailable = [...learningRegion.options].some(
    (option) => option.value === previous
  );
  selectedLearningRegion = stillAvailable ? previous : "all";
  learningRegion.value = selectedLearningRegion;
  learningRegion.disabled = learningCatalog.length === 0;
}

function summarySkillForMode() {
  return selectedSessionMode === "name" ? "name" : "find";
}

function canStartLearningSession() {
  if (!availableTargets.length) return false;
  if (selectedSessionMode !== "mistakes") return true;
  return mistakeTargets(learningStore, availableTargets).length > 0;
}

function updateLearningSummary() {
  if (selectedSessionMode === "mistakes") {
    const queue = mistakeTargets(learningStore, availableTargets);
    const findCount = queue.filter((item) => item.skillId === "find").length;
    const nameCount = queue.filter((item) => item.skillId === "name").length;

    learningSummaryEl.textContent =
      `${regionNameRu(selectedLearningRegion)}: к повторению ${queue.length} · ` +
      `найти ${findCount} · назвать ${nameCount}.`;
    return;
  }

  const skillId = summarySkillForMode();
  const summary = learningSummary(learningStore, availableTargets, skillId);
  const accuracy = summary.accuracy == null ? "—" : summary.accuracy + "%";
  const skillName = skillId === "name" ? "название" : "поиск на модели";

  learningSummaryEl.textContent =
    `${regionNameRu(selectedLearningRegion)}: ${summary.muscles} целей · ` +
    `${skillName}: встречались ${summary.touched} · попыток ${summary.attempts} · точность ${accuracy}.`;
}

function resetLearningSessionUi(message = "Выберите режим и начните сессию.") {
  learningSession = null;
  sessionSummaryShown = false;
  currentTarget = null;
  currentItemWrongAttempts = 0;
  lastWrongSid = null;
  locked = true;

  restoreHighlights();
  showAllStructures();
  nameChoicesEl.replaceChildren();
  nameChoicesEl.hidden = true;
  sessionProgressEl.hidden = true;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  answerButton.disabled = true;
  nextButton.disabled = true;
  startLearningSessionButton.disabled = !canStartLearningSession();
  startLearningSessionButton.textContent = "Начать";

  if (appMode === "quiz") {
    questionLabelEl.textContent = "Учебная сессия";
    questionEl.textContent = regionNameRu(selectedLearningRegion);
    feedbackEl.className = "feedback";
    feedbackEl.textContent = message;
  }
}

function applyLearningRegion() {
  availableTargets = filterCatalogByRegion(learningCatalog, selectedLearningRegion);
  currentTarget = null;

  targetStatusEl.textContent =
    `Учебный каталог: ${learningCatalog.length} мышц и частей мышц. ` +
    `Сейчас: ${regionNameRu(selectedLearningRegion)} — ${availableTargets.length} целей.`;

  canvas.dataset.learningRegion = selectedLearningRegion;
  canvas.dataset.learningTargetCount = String(availableTargets.length);
  canvas.dataset.learningCatalogCount = String(learningCatalog.length);

  learningSessionMode.disabled = availableTargets.length === 0;
  startLearningSessionButton.disabled = !canStartLearningSession();
  updateLearningSummary();

  if (!availableTargets.length) {
    resetLearningSessionUi("В этом регионе нет учебных целей. Выберите другой регион.");
    return;
  }

  resetLearningSessionUi();
}

function discoverTargets() {
  learningCatalog = buildMuscleCatalog(structureNames);
  renderLearningRegionOptions();
  applyLearningRegion();

  const counts = regionCounts(learningCatalog);
  const lines = LEARNING_REGIONS
    .filter((region) => region.id !== "all" && (counts[region.id] || 0) > 0)
    .map((region) => `${region.nameRu}: ${counts[region.id]}`);

  updateDiagnostics(
    `Учебных целей после объединения правой и левой сторон: ${learningCatalog.length}. ` +
    `Регионы: ${lines.join("; ")}.`
  );

  meshNamesEl.textContent =
    learningCatalog
      .slice(0, 220)
      .map((target) => `${target.nameRu} [${target.region}] ← ${target.sourceNames.join(" | ")}`)
      .join("\n");

  if (!learningCatalog.length) {
    questionEl.textContent = "Не удалось построить учебный каталог";
    feedbackEl.textContent =
      "Откройте техническую диагностику: нужно сверить реальные имена объектов модели.";
  }
}

function updateDiagnostics(extra = "") {
  const skeletonState = skeletonMesh
    ? "костные ориентиры загружены"
    : "костные ориентиры ещё не загружены";

  diagnosticsEl.textContent =
    `Мышечных структур после исключения фасциальных покрытий: ${structureNames.length}. Для рендера они объединены в один mesh; ${skeletonState}.${extra ? " " + extra : ""}`;
}

function renderSessionProgress() {
  if (!learningSession) {
    sessionProgressEl.hidden = true;
    return;
  }

  const progress = sessionProgress(learningSession);
  const modeName = SESSION_MODES[learningSession.mode]?.nameRu || "Сессия";
  sessionProgressEl.hidden = false;
  sessionProgressEl.textContent =
    `${modeName} · ${regionNameRu(selectedLearningRegion)} · ` +
    `${progress.done}/${progress.total} выполнено`;

  canvas.dataset.learningSessionMode = learningSession.mode;
  canvas.dataset.learningSessionDone = String(progress.done);
  canvas.dataset.learningSessionTotal = String(progress.total);
}

function renderNameChoices(item) {
  nameChoicesEl.replaceChildren();
  const choices = buildSmartChoices(item.target, learningCatalog, 4);

  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "name-choice";
    button.dataset.targetId = choice.id;
    button.textContent = choice.nameRu;
    button.addEventListener("click", () => chooseNameAnswer(choice.id, button));
    nameChoicesEl.appendChild(button);
  }

  nameChoicesEl.hidden = false;
}

function prepareSessionItem() {
  if (!learningSession || appMode !== "quiz") return;

  const item = currentSessionItem(learningSession);
  if (!item) {
    finishLearningSession();
    return;
  }

  restoreHighlights();
  showAllStructures();
  locked = false;
  currentTarget = item.target;
  currentItemWrongAttempts = 0;
  lastWrongSid = null;
  focusedStructureIds = [];
  focusSelectedButton.disabled = true;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  answerButton.disabled = false;
  nextButton.disabled = true;
  nextButton.textContent = "Следующая";
  feedbackEl.className = "feedback";

  renderSessionProgress();

  const progress = sessionProgress(learningSession);
  const prefix =
    learningSession.mode === "practical"
      ? `Практикум · ${progress.current}/${progress.total}`
      : `${SESSION_MODES[learningSession.mode]?.nameRu || "Задание"} · ${progress.current}/${progress.total}`;

  questionLabelEl.textContent = prefix;

  if (item.skillId === "name") {
    const ids = targetStructureIds(item.target);
    const sid = ids.length ? ids[learningSession.index % ids.length] : null;
    if (sid != null) {
      highlightStructures([sid], "selected");
      focusedStructureIds = [sid];
      focusSelectedButton.disabled = false;
      focusSelectedStructures(2.35);
    }
    questionEl.textContent = "Как называется выделенная мышца?";
    feedbackEl.textContent = "Выберите название. Неправильный вариант не завершает задание.";
    renderNameChoices(item);
  } else {
    nameChoicesEl.replaceChildren();
    nameChoicesEl.hidden = true;
    focusLearningRegion();
    questionEl.textContent = `Найдите на модели: «${item.target.nameRu}»`;
    feedbackEl.textContent = "Коснитесь нужной мышцы на модели.";
  }
}

function startLearningSession() {
  if (!availableTargets.length || appMode !== "quiz") return;

  selectedSessionMode = learningSessionMode.value;
  updateLearningSummary();
  const size = Number(learningSessionSize.value) || 10;

  learningSession = createLearningSession({
    mode: selectedSessionMode,
    catalog: availableTargets,
    store: learningStore,
    size,
  });

  if (!learningSession.items.length) {
    resetLearningSessionUi(
      selectedSessionMode === "mistakes"
        ? "В выбранном регионе пока нет сохранённых ошибок. Сначала пройдите обычную сессию."
        : "Для этой сессии не удалось подобрать задания."
    );
    return;
  }

  correct = 0;
  wrong = 0;
  correctEl.textContent = "0";
  wrongEl.textContent = "0";
  sessionSummaryShown = false;
  startLearningSessionButton.textContent = "Начать заново";
  prepareSessionItem();
}

function completeCurrentSessionItem(result) {
  if (!learningSession) return;
  completeSessionItem(learningSession, result);
  renderSessionProgress();

  const progress = sessionProgress(learningSession);
  nextButton.disabled = false;
  nextButton.textContent = progress.finished ? "Итоги" : "Следующая";
}

function finishLearningSession() {
  if (!learningSession) return;

  const summary = sessionSummary(learningSession);
  sessionSummaryShown = true;
  locked = true;
  currentTarget = null;
  lastWrongSid = null;
  restoreHighlights();
  nameChoicesEl.replaceChildren();
  nameChoicesEl.hidden = true;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  answerButton.disabled = true;
  focusSelectedButton.disabled = true;

  questionLabelEl.textContent = "Сессия завершена";
  questionEl.textContent =
    `${summary.clean} из ${summary.total} заданий выполнены без ошибок и подсказки`;
  const reviewLabels = learningSession.results
    .filter((result) => result.wrongAttempts > 0 || result.revealed)
    .map((result) => {
      const item = learningSession.items[result.index];
      if (!item) return null;
      return `${item.target.nameRu} — ${item.skillId === "name" ? "назвать" : "найти"}`;
    })
    .filter(Boolean);
  const uniqueReviewLabels = [...new Set(reviewLabels)];
  const visibleReviewLabels = uniqueReviewLabels.slice(0, 6);
  const hiddenReviewCount = Math.max(0, uniqueReviewLabels.length - visibleReviewLabels.length);

  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    `Правильно завершено: ${summary.correct}. Показан ответ: ${summary.revealed}. ` +
    `Неверных попыток: ${summary.wrongAttempts}.` +
    (visibleReviewLabels.length
      ? ` Повторить: ${visibleReviewLabels.join("; ")}${hiddenReviewCount ? `; ещё ${hiddenReviewCount}` : ""}.`
      : " Все задания выполнены без ошибок и показа ответа.");

  sessionProgressEl.hidden = false;
  sessionProgressEl.textContent =
    `Итог · ${regionNameRu(selectedLearningRegion)} · ${summary.completed}/${summary.total}`;

  const hasMistakes = mistakeTargets(learningStore, availableTargets).length > 0;
  nextButton.disabled = false;
  nextButton.textContent = hasMistakes ? "Повторить ошибки" : "Новая сессия";
  canvas.dataset.learningSessionFinished = "true";
}

function commitPendingFindMistake() {
  if (
    lastWrongSid == null ||
    !learningSession ||
    !currentTarget ||
    locked
  ) return false;

  const item = currentSessionItem(learningSession);
  if (!item || item.skillId !== "find") return false;

  wrong += 1;
  currentItemWrongAttempts += 1;
  wrongEl.textContent = String(wrong);

  recordLearningAttempt(
    learningStore,
    currentTarget.id,
    "find",
    false,
    undefined,
    { addReviewDebt: currentItemWrongAttempts === 1 }
  );
  updateLearningSummary();

  lastWrongSid = null;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  return true;
}

function revealAnswer() {
  if (!currentTarget || appMode !== "quiz" || locked || !learningSession) return;

  const item = currentSessionItem(learningSession);
  if (!item) return;

  if (item.skillId === "find") commitPendingFindMistake();
  restoreHighlights();
  const ids = targetStructureIds(currentTarget);
  highlightStructures(ids, "answer");
  focusedStructureIds = ids;
  focusSelectedButton.disabled = false;

  if (item.skillId === "name") {
    for (const button of nameChoicesEl.querySelectorAll(".name-choice")) {
      if (button.dataset.targetId === currentTarget.id) button.classList.add("correct");
      button.disabled = true;
    }
  }

  feedbackEl.className = "feedback correct";
  feedbackEl.textContent = `Ответ: «${currentTarget.nameRu}».`;

  wrong += 1;
  wrongEl.textContent = String(wrong);
  recordLearningAttempt(
    learningStore,
    currentTarget.id,
    item.skillId,
    false,
    undefined,
    { addReviewDebt: currentItemWrongAttempts === 0 }
  );
  updateLearningSummary();
  locked = true;
  answerButton.disabled = true;

  completeCurrentSessionItem({
    correct: false,
    wrongAttempts: currentItemWrongAttempts + 1,
    revealed: true,
  });
}

function chooseQuiz(sid) {
  if (!currentTarget || locked || sid == null || !structureNames[sid] || !learningSession) return;

  const item = currentSessionItem(learningSession);
  if (!item || item.skillId !== "find") return;

  if (lastWrongSid != null) commitPendingFindMistake();
  restoreHighlights();
  const isCorrect = targetStructureIds(currentTarget).includes(sid);

  if (isCorrect) {
    correct += 1;
    correctEl.textContent = String(correct);
    highlightStructures([sid], "answer");
    focusedStructureIds = [sid];
    focusSelectedButton.disabled = false;
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent = `Верно. Вы выбрали: ${displayStructureName(sid)}.`;
    recordLearningAttempt(
      learningStore,
      currentTarget.id,
      "find",
      true,
      undefined,
      { retireMistake: currentItemWrongAttempts === 0 }
    );
    updateLearningSummary();
    locked = true;
    answerButton.disabled = true;
    revealDeeperButton.hidden = true;
    revealDeeperButton.disabled = true;

    completeCurrentSessionItem({
      correct: true,
      wrongAttempts: currentItemWrongAttempts,
      revealed: false,
    });
  } else {
    highlightStructures([sid], "wrong");
    feedbackEl.className = "feedback wrong";
    feedbackEl.textContent =
      `Вы попали в «${displayStructureName(sid)}». Если она закрывает целевую мышцу, скройте её и продолжайте поиск глубже; иначе выберите другую структуру.`;

    lastWrongSid = sid;
    revealDeeperButton.hidden = false;
    revealDeeperButton.disabled = false;
  }
}

function chooseNameAnswer(targetId, button) {
  if (!learningSession || !currentTarget || locked) return;
  const item = currentSessionItem(learningSession);
  if (!item || item.skillId !== "name") return;

  const isCorrect = targetId === currentTarget.id;

  if (isCorrect) {
    correct += 1;
    correctEl.textContent = String(correct);
    button.classList.add("correct");
    for (const option of nameChoicesEl.querySelectorAll(".name-choice")) option.disabled = true;
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent = `Верно: «${currentTarget.nameRu}».`;
    recordLearningAttempt(
      learningStore,
      currentTarget.id,
      "name",
      true,
      undefined,
      { retireMistake: currentItemWrongAttempts === 0 }
    );
    updateLearningSummary();
    locked = true;

    completeCurrentSessionItem({
      correct: true,
      wrongAttempts: currentItemWrongAttempts,
      revealed: false,
    });
  } else {
    wrong += 1;
    currentItemWrongAttempts += 1;
    wrongEl.textContent = String(wrong);
    button.classList.add("wrong");
    button.disabled = true;
    feedbackEl.className = "feedback wrong";
    feedbackEl.textContent = "Не эта мышца. Сравните варианты и попробуйте ещё раз.";
    recordLearningAttempt(
      learningStore,
      currentTarget.id,
      "name",
      false,
      undefined,
      { addReviewDebt: currentItemWrongAttempts === 1 }
    );
    updateLearningSummary();
  }
}

function revealDeeperAfterMistake() {
  if (appMode !== "quiz" || locked || lastWrongSid == null) return;
  if (structureVisibility[lastWrongSid] === false) return;

  const sid = lastWrongSid;
  hiddenStack.push(sid);
  setStructureVisible(sid, false);
  restoreHighlights();

  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    `«${displayStructureName(sid)}» скрыта как поверхностный слой. Это навигационное действие не засчитано как ошибка; продолжайте поиск глубже.`;

  lastWrongSid = null;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  updateLayerButtons();
}

function nextSessionStep() {
  if (appMode !== "quiz") return;

  if (!learningSession) {
    startLearningSession();
    return;
  }

  const progress = sessionProgress(learningSession);
  if (progress.finished) {
    if (!sessionSummaryShown) {
      finishLearningSession();
      return;
    }

    const hasMistakes = mistakeTargets(learningStore, availableTargets).length > 0;

    if (hasMistakes) {
      selectedSessionMode = "mistakes";
      learningSessionMode.value = "mistakes";
      startLearningSession();
    } else {
      resetLearningSessionUi(
        "Ошибок для повторения не осталось. Выберите следующий режим и начните новую сессию."
      );
    }
    return;
  }

  if (locked) {
    prepareSessionItem();
  } else {
    revealAnswer();
  }
}

function selectExploreStructure(sid) {
  if (sid == null || !structureNames[sid]) return;

  restoreHighlights();
  selectedExploreSid = sid;
  focusedStructureIds = [sid];
  highlightStructures([sid], "selected");

  questionLabelEl.textContent = "Выбрана структура";
  questionEl.textContent = displayStructureName(sid);
  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    "Можно приблизить выбранную мышцу, изолировать её или продолжить исследование модели.";

  focusSelectedButton.disabled = false;
  isolateButton.disabled = false;
}

function setMode(mode) {
  if (mode !== "quiz" && mode !== "explore") return;

  appMode = mode;
  restoreHighlights();
  showAllStructures();
  selectedExploreSid = null;
  focusedStructureIds = [];
  focusSelectedButton.disabled = true;
  isolateButton.disabled = true;
  isolateButton.textContent = "Изолировать";
  updateLayerButtons();

  modeQuizButton.classList.toggle("active", mode === "quiz");
  modeExploreButton.classList.toggle("active", mode === "explore");
  modeQuizButton.setAttribute("aria-pressed", String(mode === "quiz"));
  modeExploreButton.setAttribute("aria-pressed", String(mode === "explore"));

  quizActions.hidden = mode !== "quiz";
  exploreControls.hidden = mode !== "explore";
  learningControls.hidden = mode !== "quiz";
  learningSummaryEl.hidden = mode !== "quiz";
  sessionProgressEl.hidden = mode !== "quiz" || !learningSession;
  scoreEl.hidden = mode !== "quiz";

  if (mode === "quiz") {
    if (learningSession && !sessionSummaryShown) {
      prepareSessionItem();
    } else {
      resetLearningSessionUi();
    }
  } else {
    locked = true;
    questionLabelEl.textContent = "Исследование";
    questionEl.textContent = "Выберите мышцу";
    feedbackEl.className = "feedback";
    feedbackEl.textContent =
      "Коснитесь структуры на модели или найдите её по русскому или исходному названию. Ответы здесь не оцениваются.";
    searchInput.focus({ preventScroll: true });
  }

  notifyEmbedHeight();
}

function renderSearchResults(query) {
  searchResults.replaceChildren();
  const q = query.trim().toLowerCase();

  if (q.length < 2 || !structureNames.length) return;

  const matches = [];
  for (let sid = 0; sid < structureNames.length && matches.length < 10; sid += 1) {
    const source = structureNames[sid];
    const haystack = structureSearchText(source);
    if (haystack.includes(q.toLocaleLowerCase("ru-RU"))) matches.push(sid);
  }

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "Совпадений не найдено.";
    searchResults.appendChild(empty);
    return;
  }

  for (const sid of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = displayStructureName(sid);
    button.addEventListener("click", () => {
      if (structureVisibility[sid] === false) {
        setStructureVisible(sid, true);
        for (let i = hiddenStack.length - 1; i >= 0; i -= 1) {
          if (hiddenStack[i] === sid) hiddenStack.splice(i, 1);
        }
        updateLayerButtons();
      }
      selectExploreStructure(sid);
      focusSelectedStructures();
      searchResults.replaceChildren();
      searchInput.value = structureTerm(structureNames[sid]).nameRu;
    });
    searchResults.appendChild(button);
  }
}

function structureIdFromHit(hit) {
  if (!hit || hit.faceIndex == null || !anatomyMesh) return null;
  const geometry = anatomyMesh.geometry;
  const corner = hit.faceIndex * 3;
  const vertexIndex = geometry.index ? geometry.index.getX(corner) : corner;
  const structureId = geometry.getAttribute("structureId");
  return Math.round(structureId.getX(vertexIndex));
}

function onPointerDown(event) {
  if (activePointers.size === 0) tapBlocked = false;

  activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
    threshold: event.pointerType === "touch" ? 12 : 5,
  });

  if (activePointers.size > 1) tapBlocked = true;
}

function onPointerMove(event) {
  const start = activePointers.get(event.pointerId);
  if (!start) return;

  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > start.threshold) {
    tapBlocked = true;
  }
}

function onPointerUp(event) {
  const start = activePointers.get(event.pointerId);
  if (!start) return;

  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > start.threshold) {
    tapBlocked = true;
  }

  const validTap = activePointers.size === 1 && !tapBlocked;
  activePointers.delete(event.pointerId);

  if (!validTap || !anatomyMesh) return;
  if (appMode === "quiz" && (!currentTarget || locked)) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(anatomyMesh, false);
  let sid = null;

  for (const hit of hits) {
    const candidate = structureIdFromHit(hit);
    if (candidate != null && structureVisibility[candidate] !== false) {
      sid = candidate;
      break;
    }
  }

  if (sid == null) return;
  if (appMode === "quiz") chooseQuiz(sid);
  else selectExploreStructure(sid);
}

function onPointerCancel(event) {
  activePointers.delete(event.pointerId);
  tapBlocked = true;
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const pixelRatio = renderer.getPixelRatio();
  const needsResize =
    canvas.width !== Math.floor(width * pixelRatio) ||
    canvas.height !== Math.floor(height * pixelRatio);

  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function cleanMuscleGeometry(sourceGeometry, matrixWorld, sid, color) {
  let geometry = sourceGeometry.clone();
  geometry.applyMatrix4(matrixWorld);

  if (geometry.index) {
    const nonIndexed = geometry.toNonIndexed();
    geometry.dispose();
    geometry = nonIndexed;
  }

  for (const attribute of Object.keys(geometry.attributes)) {
    if (attribute !== "position" && attribute !== "normal") {
      geometry.deleteAttribute(attribute);
    }
  }

  if (!geometry.getAttribute("normal")) {
    geometry.computeVertexNormals();
  }

  const vertexCount = geometry.getAttribute("position").count;
  const ids = new Float32Array(vertexCount).fill(sid);
  geometry.setAttribute("structureId", new THREE.BufferAttribute(ids, 1));
  geometry.setAttribute(
    "structureVisible",
    new THREE.BufferAttribute(new Float32Array(vertexCount).fill(1), 1)
  );

  const colors = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i += 1) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return geometry;
}

function cleanSkeletonGeometry(sourceGeometry, matrixWorld) {
  let geometry = sourceGeometry.clone();
  geometry.applyMatrix4(matrixWorld);

  for (const attribute of Object.keys(geometry.attributes)) {
    if (attribute !== "position" && attribute !== "normal") {
      geometry.deleteAttribute(attribute);
    }
  }

  if (!geometry.getAttribute("normal")) {
    geometry.computeVertexNormals();
  }

  return geometry;
}

function mergeSkeletonGeometries(geometries) {
  if (!geometries.length) return { merged: null, temporaries: [] };

  const allIndexed = geometries.every((g) => Boolean(g.index));
  const allNonIndexed = geometries.every((g) => !g.index);

  if (!allIndexed && !allNonIndexed) {
    const temporaries = geometries.map((geometry) =>
      geometry.index ? geometry.toNonIndexed() : geometry.clone()
    );
    return {
      merged: mergeGeometries(temporaries, false),
      temporaries,
    };
  }

  return {
    merged: mergeGeometries(geometries, false),
    temporaries: [],
  };
}

function applyBoneDisplayMode() {
  if (!skeletonMesh) return;

  const mode = boneDisplayMode;
  const material = skeletonMesh.material;

  if (mode === "off") {
    skeletonMesh.visible = false;
    boneOpacity.disabled = true;
    canvas.dataset.boneMode = mode;
    canvas.dataset.boneTransparent = "false";
    canvas.dataset.boneStencil = "off";
    return;
  }

  skeletonMesh.visible = true;

  if (mode === "anatomical") {
    material.transparent = false;
    material.opacity = 1;
    material.depthTest = true;
    material.depthWrite = true;
    anatomyMesh.renderOrder = 0;
    skeletonMesh.renderOrder = 1;
    boneOpacity.disabled = true;
  } else {
    material.transparent = true;
    material.opacity = Number(boneOpacity.value);
    material.depthTest = false;
    material.depthWrite = false;
    skeletonMesh.renderOrder = 10;
    boneOpacity.disabled = false;
  }

  material.needsUpdate = true;
  canvas.dataset.boneMode = mode;
  canvas.dataset.boneTransparent = String(Boolean(material.transparent));
  canvas.dataset.boneStencil = "off";
}

function notifyEmbedHeight() {
  if (!document.body.classList.contains("embed-mode") || window.parent === window) return;

  const height = Math.ceil(
    Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    )
  );

  window.parent.postMessage(
    { type: "muscle-memory-resize", height },
    "*"
  );
}

function applyInitialQueryState() {
  if (initialQueryApplied) return;
  initialQueryApplied = true;
  const params = new URLSearchParams(window.location.search);

  if (params.get("mode") === "explore") setMode("explore");
  if (params.get("region") === "shoulder") setShoulderView();

  if (params.get("embed") === "1") {
    document.body.classList.add("embed-mode");

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => notifyEmbedHeight());
      observer.observe(document.documentElement);
    }

    window.addEventListener("load", notifyEmbedHeight, { once: true });
    setTimeout(notifyEmbedHeight, 250);
  }
}


function disposeMaterial(material) {
  if (!material) return;
  if (Array.isArray(material)) {
    for (const item of material) item?.dispose?.();
  } else {
    material.dispose?.();
  }
}

function resetLoadedModel() {
  restoreHighlights();

  for (const child of [...modelGroup.children]) {
    modelGroup.remove(child);
    child.geometry?.dispose?.();
    disposeMaterial(child.material);
  }

  modelGroup.position.set(0, 0, 0);
  modelGroup.rotation.set(0, 0, 0);
  modelGroup.scale.set(1, 1, 1);

  anatomyMesh = null;
  skeletonMesh = null;
  connectiveMesh = null;
  structureNames = [];
  structureRanges = [];
  structureVisibility = [];
  baseColors = [];
  highlightedIds = new Set();
  bodySize.set(1, 1, 1);

  learningCatalog = [];
  availableTargets = [];
  learningSession = null;
  sessionSummaryShown = false;
  currentItemWrongAttempts = 0;
  lastWrongSid = null;
  currentTarget = null;
  selectedExploreSid = null;
  isolated = false;
  hiddenStack.length = 0;
  locked = false;

  focusedStructureIds = [];

  searchInput.value = "";
  searchResults.replaceChildren();
  meshNamesEl.textContent = "";
  targetStatusEl.textContent = "Загружаю выбранную модель…";
  learningRegion.disabled = true;
  learningRegion.replaceChildren(new Option("Загрузка…", "all"));
  learningSessionMode.disabled = true;
  startLearningSessionButton.disabled = true;
  sessionProgressEl.hidden = true;
  nameChoicesEl.hidden = true;
  nameChoicesEl.replaceChildren();
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  learningSummaryEl.textContent = "Учебный каталог появится после загрузки модели.";

  nextButton.disabled = true;
  answerButton.disabled = true;
  focusSelectedButton.disabled = true;
  isolateButton.disabled = true;
  hideSelectedButton.disabled = true;
  undoHideButton.disabled = true;

  boneMode.disabled = true;
  boneOpacity.disabled = true;
  connectiveMode.disabled = true;
  canvas.dataset.connectiveMode = "";
  canvas.dataset.connectiveCount = "";
  canvas.dataset.boneMode = "";
  canvas.dataset.boneTransparent = "";
  canvas.dataset.boneStencil = "";
  canvas.dataset.learningRegion = "";
  canvas.dataset.learningTargetCount = "";
  canvas.dataset.learningCatalogCount = "";
  canvas.dataset.learningSessionMode = "";
  canvas.dataset.learningSessionDone = "";
  canvas.dataset.learningSessionTotal = "";
  canvas.dataset.learningSessionFinished = "";
}

function createMuscleMaterial() {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.62,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    depthTest: true,
    depthWrite: true,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "attribute float structureVisible; varying float vStructureVisible;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvStructureVisible = structureVisible;"
    );
    shader.fragmentShader =
      "varying float vStructureVisible;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      "#include <clipping_planes_fragment>\nif (vStructureVisible < 0.5) discard;"
    );
  };
  material.customProgramCacheKey = () => "muscle-visibility-v2";
  return material;
}

function createBoneMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xe7d8b7,
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });
}



function createConnectiveMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd5cfb8,
    roughness: 0.68,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });
}

function applyConnectiveDisplayMode() {
  if (!connectiveMesh) {
    connectiveMode.disabled = true;
    canvas.dataset.connectiveMode = "unavailable";
    return;
  }

  connectiveMode.disabled = false;
  const mode = connectiveDisplayMode;
  const material = connectiveMesh.material;

  if (mode === "off") {
    connectiveMesh.visible = false;
    canvas.dataset.connectiveMode = "off";
    return;
  }

  connectiveMesh.visible = true;
  material.depthTest = true;

  if (mode === "ghost") {
    material.transparent = true;
    material.opacity = 0.28;
    material.depthWrite = false;
    connectiveMesh.renderOrder = 3;
  } else {
    material.transparent = false;
    material.opacity = 1;
    material.depthWrite = true;
    connectiveMesh.renderOrder = 2;
  }

  material.needsUpdate = true;
  canvas.dataset.connectiveMode = mode;
}

function connectiveSubtype(name) {
  const value = String(name || "").toLowerCase();
  if (/ligament/.test(value)) return "ligament";
  if (/fascia/.test(value)) return "fascia";
  if (/tendon/.test(value)) return "tendon";
  if (/aponeuros/.test(value)) return "aponeurosis";
  if (/retinacul/.test(value)) return "retinaculum";
  if (/cartilage/.test(value)) return "cartilage";
  return "other";
}

function connectiveStats(parts) {
  const stats = {
    total: parts.length,
    ligament: 0,
    fascia: 0,
    tendon: 0,
    aponeurosis: 0,
    retinaculum: 0,
    cartilage: 0,
    other: 0,
  };
  for (const part of parts) stats[connectiveSubtype(part.name)] += 1;
  return stats;
}

function bodyPartsSourceUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return BODYPARTS_SOURCE_ROOT + (path.startsWith("/") ? path : "/" + path);
}

async function fetchBodyPartsBuffer(chunk) {
  const canInflate = typeof DecompressionStream !== "undefined";
  const path = canInflate && chunk.gzip ? chunk.gzip : chunk.url;
  const response = await fetch(bodyPartsSourceUrl(path));
  if (!response.ok) throw new Error("Не удалось загрузить блок BodyParts3D.");

  let payload = await response.arrayBuffer();
  if (canInflate && chunk.gzip) {
    const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
    if (signature[0] === 0x1f && signature[1] === 0x8b) {
      payload = await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))
      ).arrayBuffer();
    }
  }

  if (payload.byteLength !== chunk.bytes) {
    throw new Error("Один из блоков BodyParts3D загрузился не полностью.");
  }
  return payload;
}

function bodyPartsGeometry(part, buffer, sid = null, color = null) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(buffer, part.positions, part.vertexCount * 3),
      3
    )
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(
      new Int16Array(buffer, part.normals, part.vertexCount * 3),
      3,
      true
    )
  );
  geometry.setIndex(
    new THREE.BufferAttribute(
      new Uint32Array(buffer, part.indices, part.indexCount),
      1
    )
  );

  if (sid != null) {
    geometry.setAttribute(
      "structureId",
      new THREE.BufferAttribute(new Float32Array(part.vertexCount).fill(sid), 1)
    );
    geometry.setAttribute(
      "structureVisible",
      new THREE.BufferAttribute(new Float32Array(part.vertexCount).fill(1), 1)
    );

    const colors = new Float32Array(part.vertexCount * 3);
    for (let i = 0; i < part.vertexCount; i += 1) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  return geometry;
}

async function loadSkeletonLayer(loader) {
  try {
    const gltf = await loader.loadAsync(SKELETON_MODEL_URL);
    gltf.scene.updateMatrixWorld(true);

    const geometries = [];
    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;
      geometries.push(cleanSkeletonGeometry(child.geometry, child.matrixWorld));
    });

    const { merged, temporaries } = mergeSkeletonGeometries(geometries);
    if (!merged) throw new Error("Не удалось объединить геометрию скелета.");

    for (const geometry of geometries) geometry.dispose();
    for (const geometry of temporaries) geometry.dispose();

    skeletonMesh = new THREE.Mesh(merged, createBoneMaterial());
    skeletonMesh.renderOrder = 1;
    modelGroup.add(skeletonMesh);

    boneMode.disabled = false;
    boneOpacity.disabled = boneDisplayMode !== "xray";
    applyBoneDisplayMode();

    updateDiagnostics("Костный слой по умолчанию использует нормальную проверку глубины. Режим просвечивания включается отдельно и не должен трактоваться как топографически точный.");
    notifyEmbedHeight();
  } catch (error) {
    console.error(error);
    boneMode.disabled = true;
    boneOpacity.disabled = true;
    updateDiagnostics(`Ошибка загрузки костных ориентиров: ${String(error?.message || error)}`);
  }
}

async function loadZAnatomyModel() {
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(MUSCLE_MODEL_URL);

    const json = gltf.parser.json;
    const assoc = gltf.parser.associations;
    const originalName = (obj) => {
      const a = assoc.get(obj);
      if (a && a.nodes !== undefined && json.nodes?.[a.nodes]) {
        return json.nodes[a.nodes].name || obj.name;
      }
      return obj.name;
    };

    gltf.scene.updateMatrixWorld(true);

    const geometries = [];
    const vertexCounts = [];

    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;

      const name = originalName(child) || `Структура ${structureNames.length}`;
      if (COVER_RE.test(name)) return;

      const sid = structureNames.length;
      const color = baseColorFor(name);
      const geometry = cleanMuscleGeometry(child.geometry, child.matrixWorld, sid, color);

      structureNames.push(name);
      baseColors.push(color);
      vertexCounts.push(geometry.getAttribute("position").count);
      geometries.push(geometry);
    });

    const merged = mergeGeometries(geometries, false);
    if (!merged) throw new Error("Не удалось объединить геометрию мышц.");

    let start = 0;
    structureRanges = vertexCounts.map((count) => {
      const range = { start, count };
      start += count;
      return range;
    });
    structureVisibility = structureNames.map(() => true);

    for (const geometry of geometries) geometry.dispose();

    anatomyMesh = new THREE.Mesh(merged, createMuscleMaterial());
    anatomyMesh.renderOrder = 0;
    modelGroup.add(anatomyMesh);

    fitCamera(modelGroup);
    discoverTargets();

    connectiveMode.disabled = true;
    canvas.dataset.connectiveMode = "unavailable";
    canvas.dataset.connectiveCount = "0";
    boneMode.disabled = true;
    await loadSkeletonLayer(loader);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function loadBodyParts4Model() {
  const response = await fetch(BODYPARTS_ATLAS_URL);
  if (!response.ok) throw new Error("Не удалось получить каталог BodyParts3D 4.0.");
  const atlas = await response.json();

  const anatomyParts = atlas.parts.filter((part) => bodyPartsAnatomyKind(part));
  const connectiveParts = atlas.parts.filter(
    (part) => part.system === "connective" && !bodyPartsAnatomyKind(part)
  );
  const parts = [...anatomyParts, ...connectiveParts];
  const chunkIds = [...new Set(parts.map((part) => part.chunk))].sort((a, b) => a - b);

  const muscleChunks = [];
  const boneChunks = [];
  const connectiveChunks = [];
  const vertexCounts = [];
  let triangleCount = 0;
  let connectiveTriangleCount = 0;

  for (let chunkPosition = 0; chunkPosition < chunkIds.length; chunkPosition += 1) {
    const chunkId = chunkIds[chunkPosition];
    loadingEl.textContent =
      "BodyParts3D: загружаю всё тело — блок " +
      (chunkPosition + 1) +
      " из " +
      chunkIds.length +
      "…";

    const buffer = await fetchBodyPartsBuffer(atlas.chunks[chunkId]);
    const chunkParts = parts.filter((part) => part.chunk === chunkId);

    const muscleParts = chunkParts.filter((part) => bodyPartsAnatomyKind(part) === "muscle");
    if (muscleParts.length) {
      const geometries = [];
      for (const part of muscleParts) {
        const sid = structureNames.length;
        const color = baseColorFor(part.name);
        const geometry = bodyPartsGeometry(part, buffer, sid, color);

        structureNames.push(part.name);
        baseColors.push(color);
        vertexCounts.push(part.vertexCount);
        triangleCount += Math.floor(part.indexCount / 3);
        geometries.push(geometry);
      }

      const mergedChunk = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!mergedChunk) throw new Error("Не удалось объединить мышечный блок BodyParts3D.");
      muscleChunks.push(mergedChunk);
    }

    const boneParts = chunkParts.filter((part) => bodyPartsAnatomyKind(part) === "bone");
    if (boneParts.length) {
      const geometries = boneParts.map((part) => {
        triangleCount += Math.floor(part.indexCount / 3);
        return bodyPartsGeometry(part, buffer);
      });
      const mergedChunk = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!mergedChunk) throw new Error("Не удалось объединить костный блок BodyParts3D.");
      boneChunks.push(mergedChunk);
    }

    const connectiveInChunk = chunkParts.filter(
      (part) => part.system === "connective" && !bodyPartsAnatomyKind(part)
    );
    if (connectiveInChunk.length) {
      const geometries = connectiveInChunk.map((part) => {
        connectiveTriangleCount += Math.floor(part.indexCount / 3);
        return bodyPartsGeometry(part, buffer);
      });
      const mergedChunk = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!mergedChunk) throw new Error("Не удалось объединить соединительнотканный блок BodyParts3D.");
      connectiveChunks.push(mergedChunk);
    }

    await new Promise(requestAnimationFrame);
  }

  const mergedMuscles = mergeGeometries(muscleChunks, false);
  for (const geometry of muscleChunks) geometry.dispose();
  if (!mergedMuscles) throw new Error("Не удалось собрать полнотелую мышечную модель BodyParts3D.");

  let start = 0;
  structureRanges = vertexCounts.map((count) => {
    const range = { start, count };
    start += count;
    return range;
  });
  structureVisibility = structureNames.map(() => true);

  anatomyMesh = new THREE.Mesh(mergedMuscles, createMuscleMaterial());
  anatomyMesh.renderOrder = 0;
  modelGroup.add(anatomyMesh);

  const mergedBones = mergeGeometries(boneChunks, false);
  for (const geometry of boneChunks) geometry.dispose();
  if (mergedBones) {
    skeletonMesh = new THREE.Mesh(mergedBones, createBoneMaterial());
    skeletonMesh.renderOrder = 1;
    modelGroup.add(skeletonMesh);
  }

  const mergedConnective = connectiveChunks.length
    ? mergeGeometries(connectiveChunks, false)
    : null;
  for (const geometry of connectiveChunks) geometry.dispose();
  if (mergedConnective) {
    connectiveMesh = new THREE.Mesh(mergedConnective, createConnectiveMaterial());
    connectiveMesh.renderOrder = 2;
    modelGroup.add(connectiveMesh);
  }

  fitCamera(modelGroup);

  if (skeletonMesh) {
    boneMode.disabled = false;
    applyBoneDisplayMode();
  }
  applyConnectiveDisplayMode();

  discoverTargets();
  const classification = bodyPartsClassificationStats(atlas.parts);
  const connective = connectiveStats(connectiveParts);
  canvas.dataset.connectiveCount = String(connective.total);
  updateDiagnostics(
    "BodyParts3D 4.0: всё тело, " +
    classification.muscles +
    " мышечных, " +
    classification.bones +
    " костных и " +
    connective.total +
    " соединительнотканных структур. " +
    "В соединительнотканном слое по названиям: связки " +
    connective.ligament +
    ", фасции " +
    connective.fascia +
    ", сухожилия " +
    connective.tendon +
    ", апоневрозы " +
    connective.aponeurosis +
    ", удерживатели " +
    connective.retinaculum +
    ", хрящевые структуры " +
    connective.cartilage +
    "; остальные " +
    connective.other +
    ". Исключено " +
    classification.excludedSkeletal +
    " структур, ошибочно помеченных atlas как skeletal. " +
    (triangleCount + connectiveTriangleCount).toLocaleString("ru-RU") +
    " треугольников загруженных слоёв."
  );
}

async function loadSelectedModel(source) {
  const requestedSource = source === "bodyparts4" ? "bodyparts4" : "z-anatomy";
  modelSource.disabled = true;
  loadingEl.classList.remove("is-hidden");
  loadingEl.textContent =
    requestedSource === "bodyparts4"
      ? "Загружаю полнотелую BodyParts3D 4.0…"
      : "Загружаю Z-Anatomy…";

  resetLoadedModel();
  currentModelSource = requestedSource;
  canvas.dataset.modelSource = requestedSource;

  try {
    if (requestedSource === "bodyparts4") {
      await loadBodyParts4Model();
    } else {
      await loadZAnatomyModel();
    }

    loadingEl.classList.add("is-hidden");
    modelSource.disabled = false;

    if (appMode === "explore") {
      questionLabelEl.textContent = "Исследование";
      questionEl.textContent = "Выберите мышцу";
      feedbackEl.className = "feedback";
      feedbackEl.textContent =
        "Коснитесь структуры на модели или найдите её по русскому, латинскому или исходному названию.";
    }

    applyInitialQueryState();
    setViewPreset(viewPreset.value);
    notifyEmbedHeight();
  } catch (error) {
    console.error(error);
    loadingEl.textContent = "Не удалось загрузить выбранную 3D-модель.";
    questionEl.textContent = "Ошибка загрузки";
    feedbackEl.textContent =
      "Можно выбрать другой источник модели в том же интерфейсе.";
    diagnosticsEl.textContent = String(error?.message || error);
    modelSource.disabled = false;
  }
}

boneMode.addEventListener("change", () => {
  boneDisplayMode = boneMode.value;
  applyBoneDisplayMode();
});

connectiveMode.addEventListener("change", () => {
  connectiveDisplayMode = connectiveMode.value;
  applyConnectiveDisplayMode();
});

boneOpacity.addEventListener("input", () => {
  if (!skeletonMesh || boneDisplayMode !== "xray") return;
  skeletonMesh.material.opacity = Number(boneOpacity.value);
  skeletonMesh.material.needsUpdate = true;
});

modelSource.addEventListener("change", () => {
  void loadSelectedModel(modelSource.value);
});

learningRegion.addEventListener("change", () => {
  selectedLearningRegion = learningRegion.value;
  applyLearningRegion();
});

learningSessionMode.addEventListener("change", () => {
  selectedSessionMode = learningSessionMode.value;
  updateLearningSummary();
  resetLearningSessionUi(
    selectedSessionMode === "mistakes" && !canStartLearningSession()
      ? "В выбранном регионе пока нет сохранённых ошибок."
      : "Выберите режим и начните сессию."
  );
});

startLearningSessionButton.addEventListener("click", startLearningSession);

focusShoulderButton.addEventListener("click", setShoulderView);
focusFullButton.addEventListener("click", () => setFullBodyView());
focusSelectedButton.addEventListener("click", focusSelectedStructures);
viewPreset.addEventListener("change", () => setViewPreset(viewPreset.value));
modeQuizButton.addEventListener("click", () => setMode("quiz"));
modeExploreButton.addEventListener("click", () => setMode("explore"));
nextButton.addEventListener("click", nextSessionStep);
answerButton.addEventListener("click", revealAnswer);
revealDeeperButton.addEventListener("click", revealDeeperAfterMistake);

searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchInput.value = "";
    searchResults.replaceChildren();
    renderer.domElement.focus?.();
  }
});

isolateButton.addEventListener("click", () => {
  if (selectedExploreSid == null) return;

  if (isolated) {
    showAllStructures();
    if (selectedExploreSid != null) {
      highlightStructures([selectedExploreSid], "selected");
    }
  } else {
    setVisibleStructures([selectedExploreSid]);
    focusSelectedStructures();
  }
});

hideSelectedButton.addEventListener("click", hideSelectedStructure);
undoHideButton.addEventListener("click", undoLastHide);

showAllButton.addEventListener("click", () => {
  showAllStructures();
  if (selectedExploreSid != null) {
    restoreHighlights();
    highlightStructures([selectedExploreSid], "selected");
  }
});

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointercancel", onPointerCancel);
renderer.domElement.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  loadingEl.classList.remove("is-hidden");
  loadingEl.textContent = "3D-сессия была приостановлена устройством. Обновите страницу, чтобы продолжить.";
});

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
void loadSelectedModel(modelSource.value);
