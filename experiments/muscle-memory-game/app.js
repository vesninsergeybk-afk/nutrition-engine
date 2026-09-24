import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { structureTerm, structureSearchText } from "./anatomy-terms-ru.js";

const MUSCLE_MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/kas.glb";
const SKELETON_MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/iskelet.glb";

const BODYPARTS_SOURCE_ROOT =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public";
const BODYPARTS_ATLAS_URL = BODYPARTS_SOURCE_ROOT + "/models/atlas.json";

// Первый игровой набор намеренно ограничен поверхностными структурами.
// Глубокие мышцы появятся после отдельного режима снятия слоёв.
const TARGETS = [
  { nameRu: "Дельтовидная мышца", ru: "дельтовидную мышцу", latin: "m. deltoideus", re: /deltoid/i },
  { nameRu: "Большая грудная мышца", ru: "большую грудную мышцу", latin: "m. pectoralis major", re: /pectoralis.?major/i },
  { nameRu: "Широчайшая мышца спины", ru: "широчайшую мышцу спины", latin: "m. latissimus dorsi", re: /latissimus/i },
  { nameRu: "Двуглавая мышца плеча", ru: "двуглавую мышцу плеча", latin: "m. biceps brachii", re: /biceps.?brach/i },
  { nameRu: "Трёхглавая мышца плеча", ru: "трёхглавую мышцу плеча", latin: "m. triceps brachii", re: /triceps.?brach/i },
  { nameRu: "Трапециевидная мышца", ru: "трапециевидную мышцу", latin: "m. trapezius", re: /trapezius/i },
];

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
const boneMode = document.querySelector("#bone-mode");
const boneOpacity = document.querySelector("#bone-opacity");
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
let anatomicalOccluderMesh = null;
let structureNames = [];
let structureRanges = [];
let structureVisibility = [];
let baseColors = [];
let highlightedIds = new Set();
let bodySize = new THREE.Vector3(1, 1, 1);

let appMode = "quiz";
let availableTargets = [];
let currentTarget = null;
let selectedExploreSid = null;
let isolated = false;
const hiddenStack = [];
let locked = false;
let correct = 0;
let wrong = 0;
let lastTargetIndex = -1;
const sessionDifficulty = new Map();
const activePointers = new Map();
let tapBlocked = false;
let focusedStructureIds = [];
let boneDisplayMode = "anatomical";
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

function targetForName(name) {
  return TARGETS.find((target) => target.re.test(name)) || null;
}

function displayStructureName(sid) {
  const sourceName = structureNames[sid] || "Неизвестная структура";
  const term = structureTerm(sourceName);
  if (term.nameRu !== sourceName) {
    return term.latin ? `${term.nameRu} · ${term.latin}` : term.nameRu;
  }
  const target = targetForName(sourceName);
  return target ? `${target.nameRu} · ${sourceName}` : sourceName;
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

function focusSelectedStructures() {
  if (!focusedStructureIds.length) return;
  const box = boxForStructures(focusedStructureIds);
  if (!box.isEmpty()) focusBox(box, 1.65);
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
  const ids = [];
  for (let sid = 0; sid < structureNames.length; sid += 1) {
    if (target.re.test(structureNames[sid])) ids.push(sid);
  }
  return ids;
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

function discoverTargets() {
  availableTargets = TARGETS.filter((target) => targetStructureIds(target).length > 0);

  const lines = availableTargets.map((target) => {
    const matches = targetStructureIds(target).map((sid) => structureNames[sid]);
    return `${target.latin}: ${matches.join(", ")}`;
  });

  targetStatusEl.textContent =
    `Поверхностный режим: распознано целей ${availableTargets.length} из ${TARGETS.length}. Ошибочные ответы чаще возвращаются в этой сессии.`;

  updateDiagnostics();
  meshNamesEl.textContent = lines.join("\n") || structureNames.slice(0, 120).join("\n");

  if (!availableTargets.length) {
    questionEl.textContent = "Не удалось сопоставить названия мышц";
    feedbackEl.textContent =
      "Откройте техническую диагностику: нужно сверить реальные имена объектов в GLB.";
    return;
  }

  nextButton.disabled = false;
  answerButton.disabled = false;
  nextQuestion();
}

function updateDiagnostics(extra = "") {
  const skeletonState = skeletonMesh
    ? "костные ориентиры загружены"
    : "костные ориентиры ещё не загружены";

  diagnosticsEl.textContent =
    `Мышечных структур после исключения фасциальных покрытий: ${structureNames.length}. Для рендера они объединены в один mesh; ${skeletonState}.${extra ? " " + extra : ""}`;
}

function pickNextTargetIndex() {
  if (!availableTargets.length) return -1;

  const weights = availableTargets.map((target) => {
    const difficulty = sessionDifficulty.get(target.latin) || 0;
    return 1 + Math.min(4, difficulty * 1.5);
  });

  let total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  let index = 0;

  for (; index < weights.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) break;
  }

  index = Math.min(index, availableTargets.length - 1);
  if (availableTargets.length > 1 && index === lastTargetIndex) {
    index = (index + 1) % availableTargets.length;
  }
  return index;
}

function recordDifficulty(target, wasCorrect) {
  if (!target) return;
  const current = sessionDifficulty.get(target.latin) || 0;
  sessionDifficulty.set(target.latin, wasCorrect ? Math.max(0, current - 0.5) : current + 1);
}

function nextQuestion() {
  if (!availableTargets.length || appMode !== "quiz") return;

  restoreHighlights();
  showAllStructures();
  locked = false;
  feedbackEl.className = "feedback";
  feedbackEl.textContent = "Нажмите на нужную мышцу прямо на модели.";

  const index = pickNextTargetIndex();
  lastTargetIndex = index;
  currentTarget = availableTargets[index];
  focusedStructureIds = [];
  focusSelectedButton.disabled = true;

  questionLabelEl.textContent = "Задание";
  questionEl.textContent = `Найдите ${currentTarget.ru}`;
  nextButton.textContent = "Пропустить";
}

function revealAnswer() {
  if (!currentTarget || appMode !== "quiz") return;

  restoreHighlights();
  const ids = targetStructureIds(currentTarget);
  highlightStructures(ids, "answer");
  focusedStructureIds = ids;
  focusSelectedButton.disabled = false;

  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    `${currentTarget.latin}. Подсвечены найденные варианты этой структуры, включая правую и левую стороны.`;

  recordDifficulty(currentTarget, false);
  locked = true;
  nextButton.textContent = "Следующая";
}

function chooseQuiz(sid) {
  if (!currentTarget || locked || sid == null || !structureNames[sid]) return;

  restoreHighlights();
  const name = structureNames[sid];

  if (currentTarget.re.test(name)) {
    correct += 1;
    correctEl.textContent = String(correct);
    highlightStructures([sid], "answer");
    focusedStructureIds = [sid];
    focusSelectedButton.disabled = false;
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent = `Верно. Вы выбрали: ${displayStructureName(sid)}.`;
    recordDifficulty(currentTarget, true);
    locked = true;
    nextButton.textContent = "Следующая";
  } else {
    wrong += 1;
    wrongEl.textContent = String(wrong);
    highlightStructures([sid], "wrong");
    feedbackEl.className = "feedback wrong";
    feedbackEl.textContent = `Это «${displayStructureName(sid)}». Попробуйте ещё раз.`;
    recordDifficulty(currentTarget, false);
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
  scoreEl.hidden = mode !== "quiz";

  if (mode === "quiz") {
    nextQuestion();
  } else {
    locked = true;
    questionLabelEl.textContent = "Исследование";
    questionEl.textContent = "Выберите мышцу";
    feedbackEl.className = "feedback";
    feedbackEl.textContent =
      "Коснитесь структуры на модели или найдите её по исходному названию. Ответы здесь не оцениваются.";
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
    const target = targetForName(source);
    const haystack =
      structureSearchText(source) +
      " " +
      `${target?.nameRu || ""} ${target?.latin || ""}`.toLocaleLowerCase("ru-RU");
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
    if (anatomicalOccluderMesh) anatomicalOccluderMesh.visible = false;
    boneOpacity.disabled = true;
    canvas.dataset.boneMode = mode;
    canvas.dataset.boneTransparent = "false";
    canvas.dataset.boneStencil = "off";
    return;
  }

  skeletonMesh.visible = true;

  if (mode === "anatomical") {
    if (anatomicalOccluderMesh) anatomicalOccluderMesh.visible = true;
    // BodyParts3D contains several bone surfaces that geometrically intersect the
    // muscle shell. A depth test alone therefore cannot guarantee a correct
    // "muscle above bone" teaching view. Visible muscles write stencil=1 first;
    // bones are then allowed only in pixels not occupied by muscle.
    material.transparent = false;
    material.opacity = 1;
    material.depthTest = true;
    material.depthWrite = true;
    material.stencilWrite = true;
    material.stencilRef = 1;
    material.stencilFunc = THREE.NotEqualStencilFunc;
    material.stencilFail = THREE.KeepStencilOp;
    material.stencilZFail = THREE.KeepStencilOp;
    material.stencilZPass = THREE.KeepStencilOp;
    anatomyMesh.renderOrder = 0;
    skeletonMesh.renderOrder = 1;
    boneOpacity.disabled = true;
  } else {
    if (anatomicalOccluderMesh) anatomicalOccluderMesh.visible = false;
    // Deliberate x-ray reference mode ignores the muscle stencil.
    material.transparent = true;
    material.opacity = Number(boneOpacity.value);
    material.depthTest = false;
    material.depthWrite = false;
    material.stencilWrite = false;
    skeletonMesh.renderOrder = 10;
    boneOpacity.disabled = false;
  }

  material.needsUpdate = true;
  canvas.dataset.boneMode = mode;
  canvas.dataset.boneTransparent = String(Boolean(material.transparent));
  canvas.dataset.boneStencil = mode === "anatomical" ? "muscle-mask" : "off";
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

  if (anatomicalOccluderMesh) {
    modelGroup.remove(anatomicalOccluderMesh);
    disposeMaterial(anatomicalOccluderMesh.material);
    anatomicalOccluderMesh = null;
  }

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
  anatomicalOccluderMesh = null;
  structureNames = [];
  structureRanges = [];
  structureVisibility = [];
  baseColors = [];
  highlightedIds = new Set();
  bodySize.set(1, 1, 1);

  availableTargets = [];
  currentTarget = null;
  selectedExploreSid = null;
  isolated = false;
  hiddenStack.length = 0;
  locked = false;
  lastTargetIndex = -1;
  focusedStructureIds = [];

  searchInput.value = "";
  searchResults.replaceChildren();
  meshNamesEl.textContent = "";
  targetStatusEl.textContent = "Загружаю выбранную модель…";

  nextButton.disabled = true;
  answerButton.disabled = true;
  focusSelectedButton.disabled = true;
  isolateButton.disabled = true;
  hideSelectedButton.disabled = true;
  undoHideButton.disabled = true;

  boneMode.disabled = true;
  boneOpacity.disabled = true;
  canvas.dataset.boneMode = "";
  canvas.dataset.boneTransparent = "";
  canvas.dataset.boneStencil = "";
  canvas.dataset.boneOcclusionInflation = "";
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
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
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
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  });
}


function createBodyPartsOccluder() {
  if (!anatomyMesh || currentModelSource !== "bodyparts4") return;

  const maxDim = Math.max(bodySize.x, bodySize.y, bodySize.z);
  const inflation = Math.max(maxDim * 0.006, 0.0005);

  const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    colorWrite: false,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBoneOcclusionInflate = { value: inflation };
    shader.vertexShader =
      "uniform float uBoneOcclusionInflate; attribute float structureVisible; varying float vStructureVisible;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed += normalize(objectNormal) * uBoneOcclusionInflate;\nvStructureVisible = structureVisible;"
    );
    shader.fragmentShader =
      "varying float vStructureVisible;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      "#include <clipping_planes_fragment>\nif (vStructureVisible < 0.5) discard;"
    );
  };
  material.customProgramCacheKey = () => "bodyparts-bone-occluder-v1";

  anatomicalOccluderMesh = new THREE.Mesh(anatomyMesh.geometry, material);
  anatomicalOccluderMesh.renderOrder = 1;
  anatomicalOccluderMesh.frustumCulled = false;
  modelGroup.add(anatomicalOccluderMesh);
  canvas.dataset.boneOcclusionInflation = String(inflation);
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

  const parts = atlas.parts.filter(
    (part) => part.system === "muscular" || part.system === "skeletal"
  );
  const chunkIds = [...new Set(parts.map((part) => part.chunk))].sort((a, b) => a - b);

  const muscleChunks = [];
  const boneChunks = [];
  const vertexCounts = [];
  let triangleCount = 0;

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

    const muscleParts = chunkParts.filter((part) => part.system === "muscular");
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

    const boneParts = chunkParts.filter((part) => part.system === "skeletal");
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
    skeletonMesh.renderOrder = 2;
    modelGroup.add(skeletonMesh);
  }

  fitCamera(modelGroup);
  createBodyPartsOccluder();

  if (skeletonMesh) {
    boneMode.disabled = false;
    applyBoneDisplayMode();
  }

  discoverTargets();
  updateDiagnostics(
    "BodyParts3D 4.0: всё тело, " +
    parts.length +
    " мышечных и костных структур, " +
    triangleCount.toLocaleString("ru-RU") +
    " треугольников."
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

boneOpacity.addEventListener("input", () => {
  if (!skeletonMesh || boneDisplayMode !== "xray") return;
  skeletonMesh.material.opacity = Number(boneOpacity.value);
  skeletonMesh.material.needsUpdate = true;
});

modelSource.addEventListener("change", () => {
  void loadSelectedModel(modelSource.value);
});

focusShoulderButton.addEventListener("click", setShoulderView);
focusFullButton.addEventListener("click", () => setFullBodyView());
focusSelectedButton.addEventListener("click", focusSelectedStructures);
viewPreset.addEventListener("change", () => setViewPreset(viewPreset.value));
modeQuizButton.addEventListener("click", () => setMode("quiz"));
modeExploreButton.addEventListener("click", () => setMode("explore"));
nextButton.addEventListener("click", nextQuestion);
answerButton.addEventListener("click", revealAnswer);

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
