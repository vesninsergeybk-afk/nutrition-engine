import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { structureTerm, structureSearchText } from "./anatomy-terms-ru.js";
import {
  studyLayerNameRu,
  studyStructureSearchText,
  studyStructureTerm,
} from "./study-layer-terms-ru.js";
import {
  hasCoverageRules,
  isKnownDeeperRelation,
  muscleDepthInfo,
  nextDepthRank,
  regionHasDepthProfile,
} from "./regional-depth-map.js";
import {
  specimenById,
  specimenDepthProfileId,
  specimenPadding,
  specimenPrimaryView,
  specimenSceneTargets,
  specimenSupportBoneMatches,
} from "./virtual-specimens.js";
import {
  bodyPartsAnatomyKind,
  bodyPartsClassificationStats,
} from "./bodyparts4-classification.js";
import {
  LEARNING_REGIONS,
  LEARNING_SCOPES,
  buildMuscleCatalog,
  filterCatalogByRegion,
  learningConceptSourceName,
  learningScopeDescriptionRu,
  learningSummary,
  loadLearningStore,
  migrateLearningStoreAliases,
  recordLearningAttempt,
  recordConfusion,
  regionCounts,
  regionNameRu,
} from "./learning-engine.js";
import {
  RETENTION_OUTCOMES,
  buildTodayQueue,
  recordReviewOutcome,
} from "./retention-engine.js";
import {
  currentAreaProgress,
  recentSessionHistory,
  recordSessionHistory,
  regionProgress,
  topConfusions,
  weakSkills,
} from "./progress-engine.js";
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

const REFERENCE_LAYER_SOURCES = {
  nervous: "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/sinir.glb",
  vascular: "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/dolasim.glb",
  lymphatic: "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/lenf.glb",
};

const REFERENCE_LAYER_COLORS = {
  nervous: 0xd1ad5d,
  vascular: 0xa44f4b,
  lymphatic: 0x78966f,
};

const BODYPARTS_SOURCE_ROOT =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public";
const BODYPARTS_ATLAS_URL = BODYPARTS_SOURCE_ROOT + "/models/atlas.json";

const COVER_RE =
  /fascia|aponeuros|retinacul|peritone|pleura|dura mater|pericardi|omentum|epicardium/i;

const canvas = document.querySelector("#viewer");
const viewerWrap = document.querySelector(".viewer-wrap");
const panelEl = document.querySelector(".panel");
const questionCardEl = document.querySelector(".question-card");
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
const scopeControls = document.querySelector("#scope-controls");
const learningRegion = document.querySelector("#learning-region");
const regionIsolation = document.querySelector("#region-isolation");
const learningSummaryEl = document.querySelector("#learning-summary");
const todayLearningSessionButton = document.querySelector("#today-learning-session");
const learningProgressEl = document.querySelector("#learning-progress");
const learningProgressContentEl = document.querySelector("#learning-progress-content");
const learningSessionMode = document.querySelector("#learning-session-mode");
const learningModeButtons = [...document.querySelectorAll("[data-learning-mode]")];
const learningSessionSize = document.querySelector("#learning-session-size");
const examTimeField = document.querySelector("#exam-time-field");
const examItemSeconds = document.querySelector("#exam-item-seconds");
const startLearningSessionButton = document.querySelector("#start-learning-session");
const sessionProgressEl = document.querySelector("#session-progress");
const exitLearningSessionButton = document.querySelector("#exit-learning-session");
const nameChoicesEl = document.querySelector("#name-choices");
const revealDeeperButton = document.querySelector("#reveal-deeper");
const boneMode = document.querySelector("#bone-mode");
const boneOpacity = document.querySelector("#bone-opacity");
const boneOpacityField = document.querySelector("#bone-opacity-field");
const connectiveMode = document.querySelector("#connective-mode");
const connectiveField = document.querySelector("#connective-field");
const connectiveLayersField = document.querySelector("#connective-layers-field");
const connectiveLayerInputs = [
  ...document.querySelectorAll("[data-connective-layer]"),
];
const skinMode = document.querySelector("#skin-mode");
const skinField = document.querySelector("#skin-field");
const layerTrainingNote = document.querySelector("#layer-training-note");
const referenceLayersField = document.querySelector("#reference-layers-field");
const referenceLayerNote = document.querySelector("#reference-layer-note");
const referenceLayerInputs = [
  ...document.querySelectorAll("[data-reference-layer]"),
];
const debugPanel = document.querySelector("#debug-panel");
const viewerSettings = document.querySelector(".viewer-settings");
const modelSource = document.querySelector("#model-source");
const layerPresetField = document.querySelector("#layer-preset-field");
const layerPreset = document.querySelector("#layer-preset");
const layerPresetNote = document.querySelector("#layer-preset-note");
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
const showNearestMuscleButton = document.querySelector("#show-nearest-muscle");
const peelSurfaceLayerButton = document.querySelector("#peel-surface-layer");
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

scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.35));

const key = new THREE.DirectionalLight(0xffffff, 2.45);
key.position.set(3, 5, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.62);
fill.position.set(-4, 1, -3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.5);
rim.position.set(0, 2, -4);
scene.add(rim);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let anatomyMesh = null;
let skeletonMesh = null;
let boneNames = [];
let boneRanges = [];
let boneVisibility = [];
let boneLocalBounds = [];
let connectiveMeshes = new Map();
let skinMesh = null;
let referenceMeshes = new Map();
let referenceLayerPromises = new Map();
let referenceLoadGeneration = 0;
let studyStructures = [];
let studyRanges = new Map();
let selectedStudyId = null;
let highlightedStudyId = null;
const exploreHiddenActions = [];
let structureNames = [];
let structureRanges = [];
let structureVisibility = [];
let baseColors = [];
let highlightedIds = new Set();
let bodySize = new THREE.Vector3(1, 1, 1);

let appMode = "quiz";
let learningCatalog = [];
let learningTargetBySid = new Map();
let selectedLearningRegion = "all";
let learningStore = loadLearningStore();
let selectedSessionMode = "find";
let learningSession = null;
let currentItemWrongAttempts = 0;
let lastWrongSid = null;
let sessionSummaryShown = false;
let examTimerId = null;
let examDeadline = 0;
let availableTargets = [];
let currentTarget = null;
let selectedExploreSid = null;

const mobileTaskMedia = window.matchMedia("(max-width: 920px)");

function syncQuestionCardPlacement() {
  const shouldDock = mobileTaskMedia.matches;

  if (shouldDock) {
    if (questionCardEl.parentElement !== viewerWrap) viewerWrap.appendChild(questionCardEl);
  } else if (questionCardEl.parentElement !== panelEl) {
    panelEl.prepend(questionCardEl);
  }

  document.body.classList.toggle("task-docked", shouldDock);
}
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
let skinDisplayMode = "off";
let muscleDisplayMode = "anatomical";
let currentLayerPreset = "muscles";
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
  // Both sides and anatomical subdivisions of one muscle should read as one
  // structure. Use the learning concept as the color key while keeping the
  // exact mesh identity for atlas selection and highlighting.
  const concept = learningConceptSourceName(name) || name;
  const hash = hashString(concept.toLocaleLowerCase("en-US"));

  // Stay inside an anatomical red/rose family, but use enough perceptual
  // variation to separate neighbouring muscles without turning the atlas into
  // a rainbow.
  const hueOffsets = [-0.028, -0.014, 0, 0.014, 0.028, 0.042];
  const hue = (0.99 + hueOffsets[hash % hueOffsets.length] + 1) % 1;
  const saturation = 0.42 + ((hash >>> 5) % 17) / 100;
  const lightness = 0.46 + ((hash >>> 11) % 13) / 100;

  return new THREE.Color().setHSL(hue, saturation, lightness);
}

function structureSideForDisplay(sourceName) {
  const source = String(sourceName || "");

  // "Right/left ventricle" is an anatomical organ qualifier, not the side of
  // a bilateral muscle mesh.
  if (/\b(?:right|left) ventricle\b/i.test(source)) return null;
  if (/\bright\b|\.r$/i.test(source)) return "справа";
  if (/\bleft\b|\.l$/i.test(source)) return "слева";
  return null;
}

function normalizeRussianSideLabel(nameRu, sourceName) {
  const side = structureSideForDisplay(sourceName);
  if (!side) return String(nameRu || "").trim();

  const base = String(nameRu || "")
    .replace(/\s*\((?:справа|слева)\)\s*$/iu, "")
    .replace(/^(?:правая|левая)\s+/iu, "")
    .replace(
      /\b(?:прав(?:ой|ую|ого|ому|ым|ом)|лев(?:ой|ую|ого|ому|ым|ом))\b/giu,
      ""
    )
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();

  return base ? base + " (" + side + ")" : String(nameRu || "").trim();
}

function displayStructureName(sid) {
  const sourceName = structureNames[sid] || "Неизвестная структура";
  const term = structureTerm(sourceName);

  // Пользовательский интерфейс — русскоязычный. Исходное имя остаётся
  // поисковым синонимом и диагностическим идентификатором.
  return normalizeRussianSideLabel(term.nameRu || sourceName, sourceName);
}

function studyEntry(studyId) {
  return studyStructures[studyId] || null;
}

function studyDisplayName(studyId) {
  const entry = studyEntry(studyId);
  if (!entry) return "Анатомическая структура";
  return studyStructureTerm(entry.sourceName, entry.layerKey).nameRu;
}

function studyMeshes() {
  return [
    ...connectiveMeshes.values(),
    ...(skinMesh ? [skinMesh] : []),
  ];
}

function indexStudyRanges(mesh) {
  const ids = mesh?.geometry?.getAttribute("structureId");
  if (!ids?.count) return;

  let start = 0;
  let currentId = Math.round(ids.getX(0));

  for (let i = 1; i <= ids.count; i += 1) {
    const nextId = i < ids.count ? Math.round(ids.getX(i)) : null;
    if (nextId === currentId) continue;

    studyRanges.set(currentId, {
      mesh,
      start,
      count: i - start,
    });
    start = i;
    currentId = nextId;
  }
}


function studyStructureIdFromHit(hit) {
  if (!hit?.object?.geometry || hit.faceIndex == null) return null;
  const geometry = hit.object.geometry;
  const ids = geometry.getAttribute("structureId");
  if (!ids) return null;
  const corner = hit.faceIndex * 3;
  const vertexIndex = geometry.index ? geometry.index.getX(corner) : corner;
  const value = Math.round(ids.getX(vertexIndex));
  return studyStructures[value] ? value : null;
}

function setStudyStructureVisible(studyId, visible) {
  const range = studyRanges.get(studyId);
  const visibility = range?.mesh?.geometry?.getAttribute("structureVisible");
  if (!range || !visibility) return;

  visibility.array.fill(
    visible ? 1 : 0,
    range.start,
    range.start + range.count
  );
  visibility.needsUpdate = true;
}

function setAllStudyStructuresVisible(visible = true) {
  for (const mesh of studyMeshes()) {
    const visibility = mesh.geometry.getAttribute("structureVisible");
    if (!visibility) continue;
    visibility.array.fill(visible ? 1 : 0);
    visibility.needsUpdate = true;
  }
}

function studyStructureIsVisible(studyId) {
  const range = studyRanges.get(studyId);
  const visibility = range?.mesh?.geometry?.getAttribute("structureVisible");
  return Boolean(
    range &&
    visibility &&
    visibility.getX(range.start) >= 0.5
  );
}

function studyBaseColor(entry) {
  if (!entry) return new THREE.Color(0xc9c1b2);
  if (entry.layerKey === "skin") return new THREE.Color(0xc69c84);
  return new THREE.Color(
    CONNECTIVE_LAYER_COLORS[entry.layerKey] || CONNECTIVE_LAYER_COLORS.other
  );
}

function paintStudyStructure(studyId, color) {
  const range = studyRanges.get(studyId);
  const colors = range?.mesh?.geometry?.getAttribute("color");
  if (!range || !colors) return;

  for (let i = range.start; i < range.start + range.count; i += 1) {
    colors.setXYZ(i, color.r, color.g, color.b);
  }
  colors.needsUpdate = true;
}

function restoreStudyHighlight() {
  if (highlightedStudyId == null) return;
  const entry = studyEntry(highlightedStudyId);
  paintStudyStructure(highlightedStudyId, studyBaseColor(entry));
  highlightedStudyId = null;
}

function boxForStudyStructure(studyId) {
  const entry = studyEntry(studyId);
  if (!entry?.bounds) return new THREE.Box3().makeEmpty();

  modelGroup.updateMatrixWorld(true);
  const min = new THREE.Vector3(...entry.bounds[0]).applyMatrix4(modelGroup.matrixWorld);
  const max = new THREE.Vector3(...entry.bounds[1]).applyMatrix4(modelGroup.matrixWorld);

  return new THREE.Box3(
    new THREE.Vector3(
      Math.min(min.x, max.x),
      Math.min(min.y, max.y),
      Math.min(min.z, max.z)
    ),
    new THREE.Vector3(
      Math.max(min.x, max.x),
      Math.max(min.y, max.y),
      Math.max(min.z, max.z)
    )
  );
}

function nearestMuscleForPart(part, muscleParts) {
  if (!part?.bounds || !muscleParts?.length) return "";
  const center = new THREE.Vector3(
    (part.bounds[0][0] + part.bounds[1][0]) / 2,
    (part.bounds[0][1] + part.bounds[1][1]) / 2,
    (part.bounds[0][2] + part.bounds[1][2]) / 2
  );

  let best = null;
  let bestDistance = Infinity;
  for (const muscle of muscleParts) {
    if (!muscle.bounds) continue;
    const muscleCenter = new THREE.Vector3(
      (muscle.bounds[0][0] + muscle.bounds[1][0]) / 2,
      (muscle.bounds[0][1] + muscle.bounds[1][1]) / 2,
      (muscle.bounds[0][2] + muscle.bounds[1][2]) / 2
    );
    const distance = center.distanceToSquared(muscleCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = muscle;
    }
  }

  if (!best) return { sourceName: "", nameRu: "" };
  const term = structureTerm(best.name);
  return {
    sourceName: best.name,
    nameRu: normalizeRussianSideLabel(term.nameRu || best.name, best.name),
  };
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

  if (
    document.body.classList.contains("task-docked") &&
    document.body.classList.contains("session-active")
  ) {
    // The mobile task sheet occupies the lower part of the viewer. Aim slightly
    // below the anatomical center so the structure itself appears higher in the
    // unobstructed portion of the screen.
    controls.target.y -= size.y * 0.18;
  }

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

function bestViewDirectionForBox(box) {
  const body = worldBodyBox();
  if (!box || box.isEmpty() || body.isEmpty()) return currentViewDirection();

  const center = box.getCenter(new THREE.Vector3());
  const candidates = [
    {
      distance: Math.abs(body.max.z - center.z),
      direction: new THREE.Vector3(0, 0.02, 1).normalize(),
      label: "front",
    },
    {
      distance: Math.abs(center.z - body.min.z),
      direction: new THREE.Vector3(0, 0.02, -1).normalize(),
      label: "back",
    },
    {
      distance: Math.abs(center.x - body.min.x),
      direction: new THREE.Vector3(-1, 0.02, 0).normalize(),
      label: "left",
    },
    {
      distance: Math.abs(body.max.x - center.x),
      direction: new THREE.Vector3(1, 0.02, 0).normalize(),
      label: "right",
    },
  ];

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0];
}

function nearestTargetPointToCamera(ids) {
  if (!anatomyMesh || !ids.length) return null;

  anatomyMesh.updateMatrixWorld(true);
  const position = anatomyMesh.geometry.getAttribute("position");
  const point = new THREE.Vector3();
  const best = new THREE.Vector3();
  let bestDistance = Infinity;
  let found = false;

  for (const sid of ids) {
    const range = structureRanges[sid];
    if (!range) continue;

    const stride = Math.max(1, Math.floor(range.count / 1200));
    for (let i = range.start; i < range.start + range.count; i += stride) {
      point.fromBufferAttribute(position, i).applyMatrix4(anatomyMesh.matrixWorld);
      const distance = point.distanceToSquared(camera.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        best.copy(point);
        found = true;
      }
    }
  }

  return found ? best : null;
}

function firstVisibleStructureOnRay(point) {
  if (!anatomyMesh || !point) return null;

  const direction = point.clone().sub(camera.position);
  if (direction.lengthSq() < 1e-10) return null;
  raycaster.set(camera.position, direction.normalize());

  const hits = raycaster.intersectObject(anatomyMesh, false);
  for (const hit of hits) {
    const sid = structureIdFromHit(hit);
    if (sid == null || structureVisibility[sid] === false) continue;
    return sid;
  }

  return null;
}

function revealNamedTarget(ids, maxOccluders = 10) {
  if (!anatomyMesh || !ids.length) {
    return { hidden: 0, visible: false, isolated: false };
  }

  const targetSet = new Set(ids);
  const targetPoint = nearestTargetPointToCamera(ids);
  if (!targetPoint) {
    setVisibleStructures(ids);
    return { hidden: 0, visible: true, isolated: true };
  }

  const direction = targetPoint.clone().sub(camera.position).normalize();
  raycaster.set(camera.position, direction);
  const hits = raycaster.intersectObject(anatomyMesh, false);

  const occluders = [];
  let reachesTarget = false;

  for (const hit of hits) {
    const sid = structureIdFromHit(hit);
    if (sid == null || structureVisibility[sid] === false) continue;
    if (targetSet.has(sid)) {
      reachesTarget = true;
      break;
    }
    if (!occluders.includes(sid)) occluders.push(sid);
  }

  if (reachesTarget) {
    for (const sid of occluders.slice(0, maxOccluders)) {
      hiddenStack.push(sid);
      setStructureVisible(sid, false);
    }

    const visibleSid = firstVisibleStructureOnRay(targetPoint);
    if (visibleSid != null && targetSet.has(visibleSid)) {
      return { hidden: Math.min(occluders.length, maxOccluders), visible: true, isolated: false };
    }
  }

  // Fairness matters more than preserving every surrounding muscle: if the
  // selected structure is still occluded, show it with skeletal landmarks.
  setVisibleStructures(ids);
  return { hidden: 0, visible: true, isolated: true };
}


function prepareFindTargetAccess(target, maxOccluders = 10) {
  const ids = targetStructureIds(target);
  if (!anatomyMesh || !ids.length) {
    return { accessible: false, hidden: 0 };
  }

  const targetSet = new Set(ids);
  const targetPoint = nearestTargetPointToCamera(ids);
  if (!targetPoint) return { accessible: false, hidden: 0 };

  const direction = targetPoint.clone().sub(camera.position);
  if (direction.lengthSq() < 1e-10) return { accessible: false, hidden: 0 };

  raycaster.set(camera.position, direction.normalize());
  const hits = raycaster.intersectObject(anatomyMesh, false);
  const occluders = [];
  let reachesTarget = false;

  for (const hit of hits) {
    const sid = structureIdFromHit(hit);
    if (sid == null || structureVisibility[sid] === false) continue;
    if (targetSet.has(sid)) {
      reachesTarget = true;
      break;
    }
    if (!occluders.includes(sid)) occluders.push(sid);
  }

  if (!reachesTarget) return { accessible: false, hidden: 0 };

  for (const sid of occluders.slice(0, maxOccluders)) {
    hiddenStack.push(sid);
    setStructureVisible(sid, false);
  }

  const visibleSid = firstVisibleStructureOnRay(targetPoint);
  return {
    accessible: visibleSid != null && targetSet.has(visibleSid),
    hidden: Math.min(occluders.length, maxOccluders),
  };
}

function focusSelectedStructures(padding = 1.65, direction = null) {
  if (appMode === "explore" && selectedStudyId != null) {
    const box = boxForStudyStructure(selectedStudyId);
    if (!box.isEmpty()) {
      focusBox(box, Math.max(padding, 1.9), direction || currentViewDirection());
    }
    return;
  }

  if (!focusedStructureIds.length) return;
  const box = boxForStructures(focusedStructureIds);
  if (!box.isEmpty()) focusBox(box, padding, direction || currentViewDirection());
}

function regionIsolationActive() {
  return Boolean(
    regionIsolation?.checked &&
    selectedLearningRegion !== "all" &&
    availableTargets.length
  );
}

function activeSceneTargets() {
  const specimen = specimenById(selectedLearningRegion);
  if (!specimen) return availableTargets;
  const targets = specimenSceneTargets(learningCatalog, specimen.id);
  return targets.length ? targets : availableTargets;
}

function activeRegionStructureIds() {
  return [
    ...new Set(
      activeSceneTargets().flatMap((target) => target.sids || [])
    ),
  ];
}

function activeRegionConceptKeys() {
  const keys = new Set();
  for (const target of activeSceneTargets()) {
    for (const sourceName of target.sourceNames || []) {
      keys.add(learningConceptSourceName(sourceName));
    }
  }
  return keys;
}

function studyStructureMatchesActiveRegion(entry) {
  if (!regionIsolationActive()) return true;
  if (!entry?.nearestMuscleSourceName) return false;
  return activeRegionConceptKeys().has(
    learningConceptSourceName(entry.nearestMuscleSourceName)
  );
}

function writeVisibleStructures(ids = null) {
  if (!anatomyMesh) return;

  const attr = anatomyMesh.geometry.getAttribute("structureVisible");
  if (!attr) return;

  if (ids === null) {
    attr.array.fill(1);
    structureVisibility = structureNames.map(() => true);
  } else {
    attr.array.fill(0);
    structureVisibility = structureNames.map(() => false);
    for (const sid of ids) {
      const range = structureRanges[sid];
      if (!range) continue;
      attr.array.fill(1, range.start, range.start + range.count);
      structureVisibility[sid] = true;
    }
  }

  attr.needsUpdate = true;
}

function applyRegionMuscleVisibility() {
  writeVisibleStructures(
    regionIsolationActive() ? activeRegionStructureIds() : null
  );
  isolated = false;
  canvas.dataset.regionIsolation = regionIsolationActive() ? "true" : "false";
  canvas.dataset.regionVisibleMuscles = String(
    structureVisibility.filter(Boolean).length
  );
}

function applyRegionStudyVisibility() {
  for (const entry of studyStructures) {
    setStudyStructureVisible(
      entry.id,
      studyStructureMatchesActiveRegion(entry)
    );
  }
}

function applyMuscleDisplayMode() {
  if (!anatomyMesh) return;

  const material = anatomyMesh.material;
  anatomyMesh.visible = muscleDisplayMode !== "off";

  if (muscleDisplayMode === "ghost") {
    material.transparent = true;
    material.opacity = 0.2;
    material.depthWrite = false;
  } else {
    material.transparent = false;
    material.opacity = 1;
    material.depthWrite = true;
  }

  material.depthTest = true;
  material.needsUpdate = true;
  canvas.dataset.muscleMode = muscleDisplayMode;
}

function setConnectiveLayerSelection(keys) {
  const enabled = new Set(keys);
  for (const input of connectiveLayerInputs) {
    input.checked = enabled.has(input.dataset.connectiveLayer);
  }
}

function applyStudyLayerPreset(preset = "muscles") {
  currentLayerPreset = preset;
  if (layerPreset) layerPreset.value = preset;

  muscleDisplayMode = "anatomical";
  skinDisplayMode = "off";
  connectiveDisplayMode = "off";
  setConnectiveLayerSelection([]);
  boneDisplayMode =
    preset === "muscles" && !regionIsolationActive()
      ? "anatomical"
      : "off";
  boneMode.value = boneDisplayMode;

  if (preset === "bones") {
    muscleDisplayMode = "ghost";
    boneDisplayMode = "anatomical";
    boneMode.value = boneDisplayMode;
  } else if (preset === "skin") {
    muscleDisplayMode = "ghost";
    skinDisplayMode = "anatomical";
  } else if (preset === "subcutaneous") {
    muscleDisplayMode = "ghost";
    connectiveDisplayMode = "anatomical";
    setConnectiveLayerSelection(["subcutaneous"]);
  } else if (preset === "fascia") {
    muscleDisplayMode = "ghost";
    connectiveDisplayMode = "anatomical";
    setConnectiveLayerSelection(["fascia"]);
  } else if (preset === "attachments") {
    muscleDisplayMode = "ghost";
    connectiveDisplayMode = "anatomical";
    setConnectiveLayerSelection(["tendon", "ligament", "joint", "cartilage"]);
  } else if (preset === "all-tissues") {
    muscleDisplayMode = "anatomical";
    skinDisplayMode = "ghost";
    connectiveDisplayMode = "ghost";
    setConnectiveLayerSelection([
      "subcutaneous",
      "fascia",
      "tendon",
      "ligament",
      "joint",
      "cartilage",
    ]);
  }

  skinMode.value = skinDisplayMode;
  connectiveMode.value = connectiveDisplayMode;

  applyRegionStudyVisibility();
  applyMuscleDisplayMode();
  applyBoneDisplayMode();
  applyConnectiveDisplayMode();
  applySkinDisplayMode();

  canvas.dataset.layerPreset = preset;
}

function syncLayerPresetAvailability() {
  const available = currentModelSource === "bodyparts4";
  layerPresetField.hidden = false;
  layerPresetNote.hidden = false;
  layerPreset.disabled = !available;
  layerPresetNote.textContent = available
    ? "Послойные режимы применяются внутри выбранного учебного блока."
    : "Послойные тканевые режимы доступны в BodyParts3D; мышечный блок остаётся доступен в текущей модели.";

  if (!available) {
    currentLayerPreset = "muscles";
    layerPreset.value = "muscles";
    canvas.dataset.layerPreset = "muscles";
  }
}

function resetRegionSupportLayers() {
  currentLayerPreset = "muscles";
  if (layerPreset) layerPreset.value = "muscles";
  muscleDisplayMode = "anatomical";
  skinDisplayMode = "off";
  connectiveDisplayMode = "off";
  boneDisplayMode = "off";
  if (skinMode) skinMode.value = "off";
  if (connectiveMode) connectiveMode.value = "off";
  if (boneMode) boneMode.value = "off";
  setConnectiveLayerSelection([]);
  for (const input of referenceLayerInputs) input.checked = false;
}

function applyRegionScene({ resetLayers = false, focus = false } = {}) {
  if (resetLayers && regionIsolationActive()) resetRegionSupportLayers();

  if (anatomyMesh) anatomyMesh.visible = true;
  applyRegionMuscleVisibility();
  applyRegionStudyVisibility();
  applyMuscleDisplayMode();

  const depthProfileId =
    specimenDepthProfileId(selectedLearningRegion) ||
    (
      activeSceneTargets().length &&
      activeSceneTargets().every(
        (target) => target.region === activeSceneTargets()[0].region
      )
        ? activeSceneTargets()[0].region
        : null
    );

  canvas.dataset.depthProfile =
    regionIsolationActive() &&
    depthProfileId &&
    regionHasDepthProfile(depthProfileId)
      ? depthProfileId
      : "unverified-or-mixed";
  canvas.dataset.virtualSpecimen =
    specimenById(selectedLearningRegion)?.id || "";

  const regional = regionIsolationActive();
  if (skeletonMesh) {
    applyRegionBoneVisibility();
    boneMode.disabled = false;
    applyBoneDisplayMode();
    canvas.dataset.regionBoneContext = regional ? "filtered" : "all";
  }

  setReferenceLayerAvailability(currentModelSource === "z-anatomy");
  restoreReferenceLayerVisibility();

  applyConnectiveDisplayMode();
  applySkinDisplayMode();

  if (focus) {
    if (regional) focusLearningRegion();
    else setFullBodyView();
  }
}

function specimenViewDirection(viewId) {
  const directions = {
    threeQuarter: new THREE.Vector3(0.35, 0.04, 1).normalize(),
    front: new THREE.Vector3(0, 0.02, 1).normalize(),
    back: new THREE.Vector3(0, 0.02, -1).normalize(),
    left: new THREE.Vector3(-1, 0.02, 0).normalize(),
    right: new THREE.Vector3(1, 0.02, 0).normalize(),
  };
  return directions[viewId] || currentViewDirection();
}

function focusLearningRegion() {
  const sceneTargets = activeSceneTargets();
  if (!sceneTargets.length) {
    setFullBodyView();
    return;
  }

  const ids = [...new Set(sceneTargets.flatMap((target) => target.sids || []))];
  const box = boxForStructures(ids);
  if (box.isEmpty()) {
    setFullBodyView();
    return;
  }

  const specimen = specimenById(selectedLearningRegion);
  const preferredView = specimenPrimaryView(selectedLearningRegion);
  const direction = preferredView
    ? specimenViewDirection(preferredView)
    : bestViewDirectionForBox(box).direction;

  focusBox(
    box,
    specimen ? specimenPadding(specimen.id) : selectedLearningRegion === "all" ? 1.12 : 1.28,
    direction
  );
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

function recognitionStructureIds(target, seed = 0) {
  if (!target) return [];

  const sideGroups = [
    target.sidsBySide?.right || [],
    target.sidsBySide?.left || [],
  ].filter((ids) => ids.length);

  if (sideGroups.length) {
    return [...sideGroups[Math.abs(Number(seed) || 0) % sideGroups.length]];
  }

  const midline = target.sidsBySide?.midline || [];
  if (midline.length) return [...midline];
  return targetStructureIds(target);
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

function targetConceptKeys(target) {
  return [
    ...new Set(
      (target?.sourceNames || [])
        .map((sourceName) => learningConceptSourceName(sourceName))
        .filter(Boolean)
    ),
  ];
}

function activeDepthProfileId(target = null) {
  return (
    specimenDepthProfileId(selectedLearningRegion) ||
    target?.region ||
    null
  );
}

function targetDepthInfo(target) {
  const depthRegionId = activeDepthProfileId(target);
  if (!target || !depthRegionId) return null;

  for (const conceptKey of targetConceptKeys(target)) {
    const info = muscleDepthInfo(depthRegionId, conceptKey);
    if (info) return { ...info, conceptKey };
  }

  return null;
}

function targetHasVisibleStructure(target) {
  return Boolean(
    target?.sids?.some((sid) => structureVisibility[sid] !== false)
  );
}

function nextRegionalAnatomicalLayer() {
  const sceneTargets = activeSceneTargets();
  if (!regionIsolationActive() || !sceneTargets.length) {
    return {
      supported: false,
      reason: "Сначала изолируйте анатомический блок.",
    };
  }

  const visibleTargets = sceneTargets.filter(targetHasVisibleStructure);
  if (!visibleTargets.length) {
    return {
      supported: false,
      reason: "В выбранном блоке не осталось видимых мышц.",
    };
  }

  const entries = visibleTargets.map((target) => ({
    target,
    info: targetDepthInfo(target),
  }));
  const missing = entries.filter((entry) => !entry.info);

  if (missing.length) {
    const unsupportedRegions = [
      ...new Set(missing.map((entry) => entry.target.region).filter(Boolean)),
    ];
    return {
      supported: false,
      reason:
        "Для этого блока анатомическая карта глубины ещё не проверена" +
        (unsupportedRegions.length
          ? ": " + unsupportedRegions.map(regionNameRu).join(", ")
          : "") +
        ". Можно скрывать отдельные структуры, но режим не будет выдавать геометрическую видимость за анатомический слой.",
    };
  }

  const rank = nextDepthRank(entries.map((entry) => entry.info));
  const layerEntries = entries.filter((entry) => entry.info.rank === rank);
  const ids = [
    ...new Set(
      layerEntries.flatMap((entry) =>
        (entry.target.sids || []).filter(
          (sid) => structureVisibility[sid] !== false
        )
      )
    ),
  ];

  const nameRu = layerEntries[0]?.info?.nameRu || "Анатомический";

  return {
    supported: true,
    rank,
    nameRu,
    entries: layerEntries,
    ids,
  };
}

function peelAnatomicalMuscleLayer() {
  if (appMode !== "explore") return;

  const layer = nextRegionalAnatomicalLayer();
  if (!layer.supported || !layer.ids.length) {
    feedbackEl.className = "feedback";
    feedbackEl.textContent =
      layer.reason || "Следующий анатомический слой не найден.";
    return;
  }

  restoreHighlights();
  restoreStudyHighlight();

  for (const sid of layer.ids) setStructureVisible(sid, false);

  exploreHiddenActions.push({
    kind: "anatomical-layer",
    ids: [...layer.ids],
    rank: layer.rank,
    nameRu: layer.nameRu,
  });

  selectedExploreSid = null;
  selectedStudyId = null;
  focusedStructureIds = [];

  const muscles = layer.entries.map((entry) => entry.target.nameRu);
  questionLabelEl.textContent = "Послойное изучение";
  questionEl.textContent = `Скрыт ${layer.nameRu.toLocaleLowerCase("ru-RU")} слой`;
  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    "Скрыты только мышцы этого анатомического уровня: " +
    muscles.join(", ") +
    ". Более глубокие мышцы, которые уже были видны в анатомических окнах, сохранены.";

  updateLayerButtons();
}

function deeperMuscleNamesFromHits(hits, selectedSid, limit = 3) {
  const selectedTarget = learningTargetBySid.get(selectedSid) || null;
  const selectedInfo = targetDepthInfo(selectedTarget);
  const ordered = [];
  let reachedSelected = false;

  for (const hit of hits || []) {
    if (hit.object !== anatomyMesh) continue;
    const sid = structureIdFromHit(hit);
    if (sid == null || structureVisibility[sid] === false) continue;

    if (!reachedSelected) {
      if (sid === selectedSid) reachedSelected = true;
      continue;
    }

    if (sid === selectedSid || ordered.includes(sid)) continue;

    const candidateTarget = learningTargetBySid.get(sid) || null;
    const candidateInfo = targetDepthInfo(candidateTarget);

    if (selectedInfo && candidateInfo) {
      const depthRegionId = activeDepthProfileId(selectedTarget);
      if (
        activeDepthProfileId(candidateTarget) !== depthRegionId ||
        candidateInfo.rank <= selectedInfo.rank
      ) {
        continue;
      }

      if (
        hasCoverageRules(depthRegionId, selectedInfo.ruleId) &&
        !isKnownDeeperRelation(
          depthRegionId,
          selectedInfo.ruleId,
          candidateInfo.ruleId
        )
      ) {
        continue;
      }
    }

    ordered.push(sid);
    if (ordered.length >= limit) break;
  }

  return ordered.map((sid) => displayStructureName(sid));
}

function updateLayerButtons() {
  isolateButton.textContent = isolated ? "Показать окружение" : "Изолировать";

  const nextLayer =
    appMode === "explore" && anatomyMesh && regionIsolationActive()
      ? nextRegionalAnatomicalLayer()
      : null;

  peelSurfaceLayerButton.disabled =
    appMode !== "explore" ||
    !anatomyMesh ||
    !regionIsolationActive() ||
    !structureVisibility.some(Boolean);

  peelSurfaceLayerButton.textContent =
    nextLayer?.supported && nextLayer?.ids?.length
      ? "Снять: " + nextLayer.nameRu.toLocaleLowerCase("ru-RU") + " слой"
      : "Снять анатомический слой";
  undoHideButton.disabled =
    hiddenStack.length === 0 && exploreHiddenActions.length === 0;

  if (selectedStudyId != null) {
    hideSelectedButton.disabled =
      isolated || !studyStructureIsVisible(selectedStudyId);
    isolateButton.disabled = false;
    showNearestMuscleButton.hidden = !studyEntry(selectedStudyId)?.nearestMuscleSourceName;
    showNearestMuscleButton.disabled = showNearestMuscleButton.hidden;
    return;
  }

  showNearestMuscleButton.hidden = true;
  showNearestMuscleButton.disabled = true;
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
  writeVisibleStructures(ids);
  isolated = ids !== null;
  updateLayerButtons();
}

function showAllStructures() {
  applyRegionMuscleVisibility();
  hiddenStack.length = 0;
  exploreHiddenActions.length = 0;
  updateLayerButtons();
}

function restoreExploreContext() {
  if (anatomyMesh) anatomyMesh.visible = true;
  applyRegionMuscleVisibility();
  setAllStudyStructuresVisible(true);
  applyRegionStudyVisibility();
  hiddenStack.length = 0;
  exploreHiddenActions.length = 0;
  isolated = false;
  applyMuscleDisplayMode();
  applyConnectiveDisplayMode();
  applySkinDisplayMode();
  restoreReferenceLayerVisibility();
  updateLayerButtons();
}

function isolateSelectedStudyStructure() {
  if (selectedStudyId == null) return;

  if (isolated) {
    const studyId = selectedStudyId;
    restoreExploreContext();
    selectStudyStructure(studyId);
    return;
  }

  const entry = studyEntry(selectedStudyId);
  if (!entry) return;

  if (anatomyMesh) anatomyMesh.visible = false;
  setAllStudyStructuresVisible(false);
  setStudyStructureVisible(selectedStudyId, true);

  for (const [layerKey, mesh] of connectiveMeshes) {
    mesh.visible = entry.layerKey !== "skin" && layerKey === entry.layerKey;
  }
  if (skinMesh) skinMesh.visible = entry.layerKey === "skin";
  for (const mesh of referenceMeshes.values()) mesh.visible = false;

  isolated = true;
  focusSelectedStructures(2.05);
  updateLayerButtons();
}

function hideSelectedStructure() {
  if (appMode !== "explore") return;

  if (selectedStudyId != null) {
    if (isolated || !studyStructureIsVisible(selectedStudyId)) return;

    const studyId = selectedStudyId;
    const label = studyDisplayName(studyId);
    setStudyStructureVisible(studyId, false);
    exploreHiddenActions.push({ kind: "study", id: studyId });
    restoreStudyHighlight();

    selectedStudyId = null;
    focusSelectedButton.disabled = true;
    isolateButton.disabled = true;
    hideSelectedButton.disabled = true;
    showNearestMuscleButton.hidden = true;
    showNearestMuscleButton.disabled = true;

    questionLabelEl.textContent = "Структура скрыта";
    questionEl.textContent = label;
    feedbackEl.className = "feedback";
    feedbackEl.textContent =
      "Структура скрыта. Теперь можно изучать лежащие глубже ткани или вернуть её.";
    updateLayerButtons();
    return;
  }

  if (
    selectedExploreSid == null ||
    isolated ||
    structureVisibility[selectedExploreSid] === false
  ) return;

  const sid = selectedExploreSid;
  hiddenStack.push(sid);
  exploreHiddenActions.push({ kind: "muscle", id: sid });
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
  const action = exploreHiddenActions.pop();

  if (
    action?.kind === "anatomical-layer" ||
    action?.kind === "surface-layer"
  ) {
    for (const sid of action.ids || []) setStructureVisible(sid, true);
    questionLabelEl.textContent = "Послойное изучение";
    questionEl.textContent = "Последний анатомический слой возвращён";
    feedbackEl.className = "feedback";
    feedbackEl.textContent =
      "Мышцы последнего снятого анатомического уровня снова показаны.";
    updateLayerButtons();
    return;
  }

  if (action?.kind === "study") {
    setStudyStructureVisible(action.id, true);
    selectStudyStructure(action.id);
    questionLabelEl.textContent = "Возвращена структура";
    updateLayerButtons();
    return;
  }

  const sid = action?.kind === "muscle" ? action.id : hiddenStack.pop();
  if (sid == null) {
    updateLayerButtons();
    return;
  }

  for (let i = hiddenStack.length - 1; i >= 0; i -= 1) {
    if (hiddenStack[i] === sid) {
      hiddenStack.splice(i, 1);
      break;
    }
  }

  setStructureVisible(sid, true);
  selectedExploreSid = sid;
  selectedStudyId = null;
  focusedStructureIds = [sid];
  restoreStudyHighlight();
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

  const groups = [
    { id: "overview", label: "Обзорные учебные блоки" },
    { id: "specimen-region", label: "Виртуальные препараты — области" },
    { id: "specimen-group", label: "Виртуальные препараты — комплексы" },
  ];

  for (const group of groups) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;

    for (const scope of LEARNING_SCOPES.filter(
      (item) => (item.group || "overview") === group.id
    )) {
      const count = filterCatalogByRegion(learningCatalog, scope.id).length;
      if (scope.id !== "all" && count === 0) continue;

      const option = document.createElement("option");
      option.value = scope.id;
      option.textContent = `${scope.nameRu} · ${count}`;
      optgroup.appendChild(option);
    }

    if (optgroup.children.length) learningRegion.appendChild(optgroup);
  }

  const scopeIds = new Set(LEARNING_SCOPES.map((scope) => scope.id));
  const exactGroup = document.createElement("optgroup");
  exactGroup.label = "Полные анатомические области";
  for (const region of LEARNING_REGIONS) {
    if (scopeIds.has(region.id)) continue;
    const count = counts[region.id] || 0;
    if (!count) continue;

    const option = document.createElement("option");
    option.value = region.id;
    option.textContent = `${region.nameRu} · ${count}`;
    exactGroup.appendChild(option);
  }
  if (exactGroup.children.length) learningRegion.appendChild(exactGroup);

  const stillAvailable = [...learningRegion.options].some(
    (option) => option.value === previous
  );
  selectedLearningRegion = stillAvailable ? previous : "all";
  learningRegion.value = selectedLearningRegion;
  learningRegion.disabled = learningCatalog.length === 0;
}

function syncLearningSessionSizes() {
  const count = availableTargets.length;
  const previous = Number(learningSessionSize.value) || 10;
  const standard = [5, 10, 20].filter((size) => size <= count);
  const sizes = [...standard];

  if (count > 0 && count <= 30 && !sizes.includes(count)) sizes.push(count);
  sizes.sort((a, b) => a - b);

  learningSessionSize.replaceChildren();
  for (const size of sizes) {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = size === count && count <= 30
      ? `Весь блок · ${size}`
      : String(size);
    learningSessionSize.appendChild(option);
  }

  if (!sizes.length) {
    const option = document.createElement("option");
    option.value = "1";
    option.textContent = "1";
    learningSessionSize.appendChild(option);
  }

  const nextValue = sizes.includes(previous)
    ? previous
    : sizes.includes(10)
      ? 10
      : sizes[sizes.length - 1] || 1;
  learningSessionSize.value = String(nextValue);
}

function summarySkillForMode() {
  return selectedSessionMode === "name" ? "name" : "find";
}

function syncLearningModeButtons() {
  const noTargets = availableTargets.length === 0;
  const hasMistakes = mistakeTargets(learningStore, availableTargets).length > 0;

  for (const button of learningModeButtons) {
    const mode = button.dataset.learningMode;
    const active = mode === selectedSessionMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.title = SESSION_MODES[mode]?.descriptionRu || "";
    button.disabled = noTargets || (mode === "mistakes" && !hasMistakes);
  }
}

function setLearningMode(mode, { reset = true } = {}) {
  if (!SESSION_MODES[mode]) return;

  selectedSessionMode = mode;
  learningSessionMode.value = mode;
  examTimeField.hidden = mode !== "exam";
  syncLearningModeButtons();
  updateLearningSummary();

  if (reset) {
    resetLearningSessionUi(
      mode === "mistakes" && !canStartLearningSession()
        ? "Ошибок для повторения пока нет."
        : "Настройте короткую тренировку и нажмите «Начать»."
    );
  }
}

function todayQueueForCurrentRegion(limit = 1000) {
  return buildTodayQueue(learningStore, availableTargets, {
    now: Date.now(),
    limit,
  });
}

function updateTodayAction() {
  const due = todayQueueForCurrentRegion();
  const selectedSize = Math.max(1, Number(learningSessionSize.value) || 10);
  const batchSize = Math.min(due.length, selectedSize);

  todayLearningSessionButton.hidden = due.length === 0 || appMode !== "quiz";
  todayLearningSessionButton.disabled = due.length === 0;

  if (due.length <= selectedSize) {
    todayLearningSessionButton.textContent =
      due.length === 1
        ? "Повторить сегодня · 1 задание"
        : `Повторить сегодня · ${due.length} заданий`;
  } else {
    todayLearningSessionButton.textContent =
      `Повторить сегодня · ${batchSize} из ${due.length}`;
  }
}


function progressBlock(title) {
  const section = document.createElement("section");
  section.className = "progress-block";

  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);
  return section;
}

function progressLine(text, className = "progress-line") {
  const line = document.createElement("p");
  line.className = className;
  line.textContent = text;
  return line;
}

function compareConfusionTargets(target, chosen, skillId) {
  if (!target || !chosen) return;

  setMode("explore");
  showAllStructures();
  restoreHighlights();

  const targetIds = targetStructureIds(target);
  const chosenIds = targetStructureIds(chosen);
  const ids = [...new Set([...targetIds, ...chosenIds])];
  if (!ids.length) return;

  setVisibleStructures(ids);
  highlightStructures(targetIds, "selected");
  highlightStructures(chosenIds, "answer");

  focusedStructureIds = ids;
  focusSelectedButton.disabled = false;
  const box = boxForStructures(ids);
  if (!box.isEmpty()) {
    const view = bestViewDirectionForBox(box);
    focusBox(box, 1.65, view.direction);
  }

  questionLabelEl.textContent = "Сравнение";
  questionEl.textContent = target.nameRu + " и " + chosen.nameRu;
  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    "Синяя структура — та, которую нужно было " +
    (skillId === "name" ? "назвать" : "найти") +
    ". Зелёная — структура, с которой её путали. Сравните положение, форму и соседние ориентиры.";
  updateLayerButtons();
}

function renderProgressPanel() {
  if (!learningProgressEl || !learningProgressContentEl) return;

  const now = Date.now();
  const area = currentAreaProgress(learningStore, availableTargets, now);
  const weak = weakSkills(learningStore, availableTargets, { limit: 6, now });
  const areaIds = new Set(availableTargets.map((target) => target.id));
  const confusions = topConfusions(learningStore, learningCatalog, { limit: 20 })
    .filter((item) => selectedLearningRegion === "all" || areaIds.has(item.target.id))
    .slice(0, 4);
  const history = recentSessionHistory(learningStore, 4);
  const rows = regionProgress(learningStore, learningCatalog, now)
    .filter((row) => row.find.seen > 0 || row.name.seen > 0 || row.due > 0);

  const hasProgress =
    area.find.seen > 0 ||
    area.name.seen > 0 ||
    weak.length > 0 ||
    confusions.length > 0 ||
    history.length > 0;

  learningProgressEl.hidden = !hasProgress || appMode !== "quiz";
  if (!hasProgress) {
    learningProgressContentEl.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();

  const current = progressBlock(regionNameRu(selectedLearningRegion));
  current.appendChild(
    progressLine(
      "Найти: встречались " + area.find.seen + " из " + area.find.total +
      (area.find.due ? " · повторить " + area.find.due : "")
    )
  );
  current.appendChild(
    progressLine(
      "Назвать: встречались " + area.name.seen + " из " + area.name.total +
      (area.name.due ? " · повторить " + area.name.due : "")
    )
  );
  fragment.appendChild(current);

  if (weak.length) {
    const weakBlock = progressBlock("Слабые места");
    const list = document.createElement("div");
    list.className = "progress-weak-list";

    for (const item of weak) {
      const row = document.createElement("div");
      row.className = "progress-weak-item";
      const strong = document.createElement("strong");
      strong.textContent =
        item.target.nameRu + (item.skillId === "name" ? " — назвать" : " — найти");
      row.appendChild(strong);
      row.appendChild(document.createTextNode(" · " + item.reason));
      list.appendChild(row);
    }

    weakBlock.appendChild(list);
    fragment.appendChild(weakBlock);
  }

  if (confusions.length) {
    const confusionBlock = progressBlock("Пары, которые путались");
    const list = document.createElement("div");
    list.className = "progress-confusion-list";

    for (const item of confusions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "progress-confusion";
      button.textContent =
        "Сравнить: " + item.target.nameRu + " / " + item.chosen.nameRu +
        (item.count > 1 ? " · " + item.count + " раза" : "");
      button.addEventListener("click", () =>
        compareConfusionTargets(item.target, item.chosen, item.skillId)
      );
      list.appendChild(button);
    }

    confusionBlock.appendChild(list);
    fragment.appendChild(confusionBlock);
  }

  if (rows.length) {
    const regions = progressBlock("По областям");
    const list = document.createElement("div");
    list.className = "progress-region-list";

    for (const row of rows) {
      const line = document.createElement("div");
      line.className = "progress-region-row";

      const name = document.createElement("span");
      name.className = "progress-region-name";
      name.textContent = row.nameRu;

      const stats = document.createElement("span");
      stats.className = "progress-region-stats";
      stats.textContent =
        "найти " + row.find.seen + "/" + row.total +
        " · назвать " + row.name.seen + "/" + row.total +
        (row.due ? " · повторить " + row.due : "");

      line.append(name, stats);
      list.appendChild(line);
    }

    regions.appendChild(list);
    fragment.appendChild(regions);
  }

  if (history.length) {
    const historyBlock = progressBlock("Последние тренировки");
    for (const entry of history) {
      const modeName = SESSION_MODES[entry.mode]?.nameRu || "Тренировка";
      historyBlock.appendChild(
        progressLine(
          modeName + " · " + regionNameRu(entry.region) +
          " · без ошибок " + entry.clean + "/" + entry.total,
          "progress-history-line"
        )
      );
    }
    fragment.appendChild(historyBlock);
  }

  learningProgressContentEl.replaceChildren(fragment);
}

function canStartLearningSession() {
  if (!availableTargets.length) return false;
  if (selectedSessionMode !== "mistakes") return true;
  return mistakeTargets(learningStore, availableTargets).length > 0;
}

function updateLearningSummary() {
  if (selectedSessionMode === "mistakes") {
    const queue = mistakeTargets(learningStore, availableTargets);
    learningSummaryEl.textContent = queue.length
      ? `${regionNameRu(selectedLearningRegion)} · к повторению: ${queue.length}`
      : `${regionNameRu(selectedLearningRegion)} · ошибок для повторения пока нет`;
    return;
  }

  const skillId = summarySkillForMode();
  const summary = learningSummary(learningStore, availableTargets, skillId);
  const modeHint =
    selectedSessionMode === "name"
      ? "назвать выделенную мышцу"
      : selectedSessionMode === "practical"
        ? "вперемешку: найти и назвать"
        : selectedSessionMode === "exam"
          ? "одна попытка · время задаётся перед началом"
          : "найти мышцу по названию";

  const scopeDescription = learningScopeDescriptionRu(selectedLearningRegion);
  learningSummaryEl.textContent =
    `${regionNameRu(selectedLearningRegion)} · ${summary.muscles} мышц · ${modeHint}` +
    (scopeDescription ? `\n${scopeDescription}` : "");
}

function resetLearningSessionUi(message = "Выберите режим и начните сессию.") {
  clearExamTimer();
  clearExamTaskMetadata();
  learningSession = null;
  sessionSummaryShown = false;
  document.body.classList.remove("session-active");
  currentTarget = null;
  currentItemWrongAttempts = 0;
  lastWrongSid = null;
  locked = true;

  restoreDisplayAfterTraining();
  restoreHighlights();
  showAllStructures();
  nameChoicesEl.replaceChildren();
  nameChoicesEl.hidden = true;
  sessionProgressEl.hidden = true;
  exitLearningSessionButton.hidden = true;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  answerButton.disabled = true;
  answerButton.hidden = false;
  nextButton.disabled = true;
  quizActions.hidden = true;
  syncLearningModeButtons();
  startLearningSessionButton.disabled = !canStartLearningSession();
  startLearningSessionButton.textContent = "Начать";
  updateTodayAction();

  if (appMode === "quiz") {
    questionLabelEl.textContent = "Тренировка";
    questionEl.textContent = regionNameRu(selectedLearningRegion);
    feedbackEl.className = "feedback";
    feedbackEl.textContent = message;
  }

  syncQuestionCardPlacement();
  updateTodayAction();
  renderProgressPanel();
}

function applyLearningRegion() {
  availableTargets = filterCatalogByRegion(learningCatalog, selectedLearningRegion);
  currentTarget = null;
  syncLearningSessionSizes();

  targetStatusEl.textContent =
    `Учебный каталог: ${learningCatalog.length} мышечных целей. ` +
    `Сейчас: ${regionNameRu(selectedLearningRegion)} — ${availableTargets.length} целей.`;

  canvas.dataset.learningRegion = selectedLearningRegion;
  canvas.dataset.learningScope = selectedLearningRegion;
  canvas.dataset.learningTargetCount = String(availableTargets.length);
  canvas.dataset.learningCatalogCount = String(learningCatalog.length);
  focusShoulderButton.textContent = "К блоку";
  focusShoulderButton.hidden = selectedLearningRegion === "all";

  learningSessionMode.disabled = availableTargets.length === 0;
  syncLearningModeButtons();
  startLearningSessionButton.disabled = !canStartLearningSession();
  updateLearningSummary();
  updateTodayAction();
  renderProgressPanel();
  applyRegionScene({ resetLayers: true });

  if (!availableTargets.length) {
    resetLearningSessionUi("В этом учебном блоке нет целей. Выберите другой блок.");
    return;
  }

  resetLearningSessionUi();
}

function discoverTargets() {
  learningCatalog = buildMuscleCatalog(structureNames);
  migrateLearningStoreAliases(learningStore, learningCatalog);
  learningTargetBySid = new Map();
  for (const target of learningCatalog) {
    for (const sid of target.sids) learningTargetBySid.set(sid, target);
  }
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
    questionEl.textContent = "Не удалось подготовить тренировку";
    feedbackEl.textContent =
      "Попробуйте перезагрузить страницу или выбрать другую анатомическую модель в разделе «Отображение».";
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
  const visibleStep =
    locked && progress.done > 0
      ? progress.done
      : progress.current;
  sessionProgressEl.hidden = false;
  const examRemaining =
    learningSession.mode === "exam" && examDeadline
      ? Math.max(0, Math.ceil((examDeadline - Date.now()) / 1000))
      : null;
  sessionProgressEl.textContent =
    `${regionNameRu(selectedLearningRegion)} · ${visibleStep} из ${progress.total}` +
    (examRemaining == null ? "" : ` · ${examRemaining} с`);
  sessionProgressEl.style.setProperty(
    "--session-progress",
    progress.total ? `${Math.round((progress.done / progress.total) * 100)}%` : "0%"
  );

  canvas.dataset.learningSessionMode = learningSession.mode;
  canvas.dataset.learningSessionDone = String(progress.done);
  canvas.dataset.learningSessionTotal = String(progress.total);
}

function renderNameChoices(item) {
  nameChoicesEl.replaceChildren();
  const choices = buildSmartChoices(item.target, availableTargets, 4, Math.random, {
    store: learningStore,
  });

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

function clearExamTimer() {
  if (examTimerId != null) {
    clearInterval(examTimerId);
    examTimerId = null;
  }
  examDeadline = 0;
  canvas.dataset.examSeconds = "";
}

function clearExamTaskMetadata() {
  canvas.dataset.examFindAccessible = "";
  canvas.dataset.examOccludersHidden = "";
  canvas.dataset.examFindFallback = "";
}

function startExamTimer() {
  clearExamTimer();
  if (!learningSession || learningSession.mode !== "exam" || locked) return;

  const seconds = Math.max(5, Number(examItemSeconds.value) || 20);
  examDeadline = Date.now() + seconds * 1000;
  canvas.dataset.examSeconds = String(seconds);
  renderSessionProgress();

  examTimerId = setInterval(() => {
    if (!learningSession || learningSession.mode !== "exam" || locked) {
      clearExamTimer();
      return;
    }

    const remaining = Math.max(0, Math.ceil((examDeadline - Date.now()) / 1000));
    canvas.dataset.examSeconds = String(remaining);
    renderSessionProgress();

    if (remaining <= 0) {
      clearExamTimer();
      completeExamFailure({ timedOut: true });
    }
  }, 250);
}

function completeExamFailure({
  chosenSid = null,
  chosenTargetId = null,
  chosenButton = null,
  timedOut = false,
} = {}) {
  if (
    !learningSession ||
    learningSession.mode !== "exam" ||
    !currentTarget ||
    locked
  ) return;

  const item = currentSessionItem(learningSession);
  if (!item) return;

  clearExamTimer();
  wrong += 1;
  currentItemWrongAttempts = 1;
  wrongEl.textContent = String(wrong);

  if (item.skillId === "find" && chosenSid != null) {
    const chosenTarget = learningTargetBySid.get(chosenSid);
    if (chosenTarget) {
      recordConfusion(
        learningStore,
        currentTarget.id,
        chosenTarget.id,
        "find"
      );
    }
  }

  if (
    item.skillId === "name" &&
    chosenTargetId &&
    chosenTargetId !== currentTarget.id
  ) {
    recordConfusion(
      learningStore,
      currentTarget.id,
      chosenTargetId,
      "name"
    );
  }

  recordLearningAttempt(
    learningStore,
    currentTarget.id,
    item.skillId,
    false,
    undefined,
    { addReviewDebt: true }
  );

  restoreHighlights();
  if (item.skillId === "find") {
    if (chosenSid != null) highlightStructures([chosenSid], "wrong");
    const ids = targetStructureIds(currentTarget);
    highlightStructures(ids, "answer");
    focusedStructureIds = ids;
    focusSelectedButton.disabled = false;
  } else {
    if (chosenButton) chosenButton.classList.add("wrong");
    for (const option of nameChoicesEl.querySelectorAll(".name-choice")) {
      if (option.dataset.targetId === currentTarget.id) option.classList.add("correct");
      option.disabled = true;
    }
  }

  feedbackEl.className = "feedback wrong";
  feedbackEl.textContent =
    (timedOut ? "Время вышло. " : "Неверно. ") +
    `Ответ: «${currentTarget.nameRu}».`;

  updateLearningSummary();
  renderProgressPanel();
  locked = true;
  completeCurrentSessionItem({
    correct: false,
    wrongAttempts: 1,
    revealed: true,
  });
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
  canvas.dataset.learningCurrentTargetId = currentTarget.id;
  currentItemWrongAttempts = 0;
  lastWrongSid = null;
  canvas.dataset.nameTargetVisible = "";
  canvas.dataset.nameTargetPresentation = "";
  canvas.dataset.nameOccludersHidden = "";
  canvas.dataset.nameView = "";
  canvas.dataset.nameTargetComponentCount = "";
  canvas.dataset.examSeconds = "";
  focusedStructureIds = [];
  focusSelectedButton.disabled = true;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  const examMode = learningSession.mode === "exam";

  if (examMode && item.skillId === "find") {
    focusLearningRegion();
    const access = prepareFindTargetAccess(item.target);
    canvas.dataset.examFindAccessible = String(access.accessible);
    canvas.dataset.examOccludersHidden = String(access.hidden);

    if (!access.accessible) {
      // A control task must never require clicking through an occluding layer.
      // Fall back to recognition for this target instead of exposing its answer.
      showAllStructures();
      item.skillId = "name";
      canvas.dataset.examFindFallback = "name";
    } else {
      canvas.dataset.examFindFallback = "";
    }
  } else {
    canvas.dataset.examFindAccessible = "";
    canvas.dataset.examOccludersHidden = "";
    canvas.dataset.examFindFallback = "";
  }

  canvas.dataset.learningCurrentSkill = item.skillId;
  quizActions.hidden = examMode;
  quizActions.classList.remove("next-only");
  answerButton.hidden = examMode;
  answerButton.disabled = examMode;
  nextButton.disabled = true;
  nextButton.textContent = "Следующая";
  feedbackEl.className = "feedback";

  renderSessionProgress();

  const modeLabel =
    learningSession.mode === "mistakes"
      ? "Повторение"
      : SESSION_MODES[learningSession.mode]?.nameRu || "Задание";

  questionLabelEl.textContent = modeLabel;

  if (item.skillId === "name") {
    const ids = recognitionStructureIds(item.target, learningSession.index);
    if (ids.length) {
      focusedStructureIds = ids;
      focusSelectedButton.disabled = false;

      const targetBox = boxForStructures(ids);
      const preferredView = bestViewDirectionForBox(targetBox);
      focusSelectedStructures(2.05, preferredView.direction);

      const presentation = revealNamedTarget(ids);
      highlightStructures(ids, "selected");

      canvas.dataset.nameTargetVisible = String(presentation.visible);
      canvas.dataset.nameTargetPresentation = presentation.isolated ? "isolated" : "context";
      canvas.dataset.nameOccludersHidden = String(presentation.hidden);
      canvas.dataset.nameView = preferredView.label;
      canvas.dataset.nameTargetComponentCount = String(ids.length);
    }
    questionEl.textContent = "Назовите выделенную мышцу";
    feedbackEl.textContent = "Выберите название.";
    renderNameChoices(item);
  } else {
    nameChoicesEl.replaceChildren();
    nameChoicesEl.hidden = true;
    if (!examMode) focusLearningRegion();
    questionEl.textContent = `Найдите: «${item.target.nameRu}»`;
    feedbackEl.textContent =
      examMode && Number(canvas.dataset.examOccludersHidden || 0) > 0
        ? "Поверхностный слой подготовлен. Коснитесь нужной мышцы."
        : "Коснитесь нужной мышцы на модели.";
  }

  if (examMode) startExamTimer();
  else clearExamTimer();
}

function startLearningSession(modeOverride = null) {
  if (!availableTargets.length || appMode !== "quiz") return;

  const sessionMode = modeOverride || learningSessionMode.value;
  if (!modeOverride) {
    selectedSessionMode = sessionMode;
    updateLearningSummary();
  }
  const size = Number(learningSessionSize.value) || 10;

  learningSession = createLearningSession({
    mode: sessionMode,
    catalog: availableTargets,
    store: learningStore,
    size,
  });

  if (!learningSession.items.length) {
    resetLearningSessionUi(
      sessionMode === "today"
        ? "На сегодня повторений нет."
        : selectedSessionMode === "mistakes"
          ? "В выбранном учебном блоке пока нет сохранённых ошибок. Сначала пройдите обычную тренировку."
          : "Для этой сессии не удалось подобрать задания."
    );
    return;
  }

  correct = 0;
  wrong = 0;
  correctEl.textContent = "0";
  wrongEl.textContent = "0";
  sessionSummaryShown = false;
  document.body.classList.add("session-active");
  exitLearningSessionButton.hidden = false;
  if (viewerSettings) viewerSettings.open = false;
  applyTrainingDisplayOverride();
  startLearningSessionButton.textContent = "Перезапустить";
  syncQuestionCardPlacement();
  prepareSessionItem();

  if (mobileTaskMedia.matches) {
    viewerWrap.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function completeCurrentSessionItem(result) {
  if (!learningSession) return;
  clearExamTimer();

  const item = currentSessionItem(learningSession);
  if (item) {
    const outcome = result?.revealed
      ? RETENTION_OUTCOMES.revealed
      : result?.correct && (Number(result?.wrongAttempts) || 0) === 0
        ? RETENTION_OUTCOMES.clean
        : RETENTION_OUTCOMES.corrected;

    recordReviewOutcome(
      learningStore,
      item.target.id,
      item.skillId,
      outcome
    );
  }

  completeSessionItem(learningSession, result);
  const progress = sessionProgress(learningSession);

  // A finished session belongs in history as soon as the final answer is fixed.
  // Opening the summary is optional UI; leaving before pressing “Итоги” must not
  // discard the completed session from progress history.
  if (progress.finished) {
    recordSessionHistory(learningStore, learningSession, {
      regionId: selectedLearningRegion,
      modelSource: currentModelSource,
    });
  }

  updateTodayAction();
  renderProgressPanel();
  renderSessionProgress();

  answerButton.hidden = true;
  quizActions.hidden = false;
  quizActions.classList.add("next-only");
  nextButton.disabled = false;
  nextButton.textContent = progress.finished ? "Итоги" : "Следующая";
}

function finishLearningSession() {
  if (!learningSession) return;
  clearExamTimer();

  const summary = sessionSummary(learningSession);
  recordSessionHistory(learningStore, learningSession, {
    regionId: selectedLearningRegion,
    modelSource: currentModelSource,
  });
  renderProgressPanel();
  sessionSummaryShown = true;
  locked = true;
  currentTarget = null;
  canvas.dataset.learningCurrentTargetId = "";
  canvas.dataset.learningCurrentSkill = "";
  lastWrongSid = null;
  restoreHighlights();
  showAllStructures();
  nameChoicesEl.replaceChildren();
  nameChoicesEl.hidden = true;
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  answerButton.disabled = true;
  answerButton.hidden = true;
  quizActions.hidden = false;
  focusSelectedButton.disabled = true;
  focusLearningRegion();

  questionLabelEl.textContent = "Сессия завершена";
  questionEl.textContent = `Без ошибок и подсказки: ${summary.clean} из ${summary.total}`;
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

  const skillLines = [];
  if (summary.bySkill?.find) {
    skillLines.push(
      `Найти на модели: без ошибок ${summary.bySkill.find.clean} из ${summary.bySkill.find.total}`
    );
  }
  if (summary.bySkill?.name) {
    skillLines.push(
      `Назвать: без ошибок ${summary.bySkill.name.clean} из ${summary.bySkill.name.total}`
    );
  }

  feedbackEl.className = "feedback";
  feedbackEl.textContent =
    (skillLines.length ? skillLines.join("\n") + "\n" : "") +
    (visibleReviewLabels.length
      ? "\nК повторению:\n" +
        visibleReviewLabels.map((label) => `• ${label}`).join("\n") +
        (hiddenReviewCount ? `\n• ещё ${hiddenReviewCount}` : "")
      : "\nВсе задания выполнены без ошибок и подсказки.");

  sessionProgressEl.hidden = false;
  exitLearningSessionButton.hidden = true;
  sessionProgressEl.textContent =
    `${regionNameRu(selectedLearningRegion)} · ${summary.completed} из ${summary.total}`;

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

  const chosenTarget = learningTargetBySid.get(lastWrongSid);
  if (chosenTarget) {
    recordConfusion(
      learningStore,
      currentTarget.id,
      chosenTarget.id,
      "find"
    );
  }

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
  if (learningSession.mode === "exam") return;

  const item = currentSessionItem(learningSession);
  if (!item) return;

  if (item.skillId === "find") commitPendingFindMistake();
  restoreHighlights();
  const ids =
    item.skillId === "name"
      ? recognitionStructureIds(currentTarget, learningSession.index)
      : targetStructureIds(currentTarget);
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
    if (learningSession.mode === "exam") {
      completeExamFailure({ chosenSid: sid });
      return;
    }

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
    feedbackEl.textContent =
      currentItemWrongAttempts > 0
        ? `Верно после коррекции: «${currentTarget.nameRu}».`
        : `Верно: «${currentTarget.nameRu}».`;
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
    if (learningSession.mode === "exam") {
      completeExamFailure({
        chosenTargetId: targetId,
        chosenButton: button,
      });
      return;
    }

    wrong += 1;
    currentItemWrongAttempts += 1;
    wrongEl.textContent = String(wrong);
    recordConfusion(
      learningStore,
      currentTarget.id,
      targetId,
      "name"
    );
    button.classList.add("wrong");
    button.disabled = true;
    feedbackEl.className = "feedback wrong";
    const chosen = learningCatalog.find((target) => target.id === targetId);
    feedbackEl.textContent =
      "Вы выбрали «" + (chosen?.nameRu || "другую мышцу") +
      "». Это не она. Сопоставьте форму и положение и попробуйте ещё раз.";
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
  if (learningSession?.mode === "exam") return;
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
      setLearningMode("mistakes", { reset: false });
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

function selectExploreStructure(sid, hitStack = null) {
  if (sid == null || !structureNames[sid]) return;

  restoreStudyHighlight();
  restoreHighlights();
  selectedStudyId = null;
  canvas.dataset.selectedStudyLayer = "";
  canvas.dataset.selectedStudySpecific = "";
  selectedExploreSid = sid;
  focusedStructureIds = [sid];
  isolated = false;
  highlightStructures([sid], "selected");

  questionLabelEl.textContent = "Мышца";
  questionEl.textContent = displayStructureName(sid);
  feedbackEl.className = "feedback";
  const deeperNames = deeperMuscleNamesFromHits(hitStack, sid);
  feedbackEl.textContent = deeperNames.length
    ? "Глубже по выбранной точке: " +
      deeperNames.join(" → ") +
      ". Можно снять видимый слой целиком или скрыть только выбранную мышцу."
    : "Можно приблизить выбранную мышцу, изолировать её или продолжить исследование модели.";

  focusSelectedButton.disabled = false;
  isolateButton.disabled = false;
  updateLayerButtons();
}

function selectStudyStructure(studyId) {
  if (appMode !== "explore") return;
  const entry = studyEntry(studyId);
  if (!entry) return;

  const keepIsolation = isolated && selectedStudyId === studyId;

  restoreHighlights();
  restoreStudyHighlight();

  selectedExploreSid = null;
  focusedStructureIds = [];
  selectedStudyId = studyId;
  highlightedStudyId = studyId;
  isolated = keepIsolation;

  paintStudyStructure(studyId, new THREE.Color(0x245da8));

  const term = studyStructureTerm(entry.sourceName, entry.layerKey);
  questionLabelEl.textContent = studyLayerNameRu(entry.layerKey);
  questionEl.textContent = term.nameRu;
  feedbackEl.className = "feedback";
  feedbackEl.textContent = entry.nearestMuscleNameRu
    ? "Ближайшая мышечная структура в этой 3D-модели: " +
      entry.nearestMuscleNameRu +
      ". Это пространственный ориентир, а не утверждение о прикреплении."
    : term.specific
      ? "Структура выбрана. Можно изолировать её или вернуть окружающие ткани."
      : "Структура выбрана в соответствующем анатомическом слое; точный русский термин для этой записи источника ещё не подтверждён.";

  focusSelectedButton.disabled = false;
  isolateButton.disabled = false;
  hideSelectedButton.disabled = false;
  canvas.dataset.selectedStudyLayer = entry.layerKey;
  canvas.dataset.selectedStudySpecific = String(term.specific);
  updateLayerButtons();
}

function setMode(mode) {
  if (mode !== "quiz" && mode !== "explore") return;

  appMode = mode;
  restoreStudyHighlight();
  restoreHighlights();
  restoreExploreContext();
  selectedStudyId = null;
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
  scopeControls.hidden = false;
  learningControls.hidden = mode !== "quiz";
  learningSummaryEl.hidden = mode !== "quiz";
  sessionProgressEl.hidden = mode !== "quiz" || !learningSession;
  scoreEl.hidden = true;
  document.body.classList.toggle("explore-mode", mode === "explore");
  updateTodayAction();
  renderProgressPanel();
  if (mode !== "quiz") document.body.classList.remove("session-active");
  syncQuestionCardPlacement();

  if (mode === "quiz") {
    if (learningSession && !sessionSummaryShown) {
      document.body.classList.add("session-active");
      syncQuestionCardPlacement();
      prepareSessionItem();
    } else {
      resetLearningSessionUi();
    }
  } else {
    locked = true;
    restoreDisplayAfterTraining();
    questionLabelEl.textContent = "Атлас";
    questionEl.textContent = "Выберите структуру";
    feedbackEl.className = "feedback";
    feedbackEl.textContent =
      "Коснитесь мышцы, связки, сухожилия, фасциальной структуры или наружного слоя. Здесь можно свободно изучать их взаимное расположение.";
    searchInput.focus({ preventScroll: true });
  }

  notifyEmbedHeight();
}

function ensureStudyLayerShown(entry) {
  if (!entry) return;

  if (entry.layerKey === "skin") {
    if (skinDisplayMode === "off") {
      skinDisplayMode = "ghost";
      skinMode.value = skinDisplayMode;
    }
    applySkinDisplayMode();
    return;
  }

  const input = connectiveLayerInputs.find(
    (item) => item.dataset.connectiveLayer === entry.layerKey
  );
  if (input) input.checked = true;
  if (connectiveDisplayMode === "off") {
    connectiveDisplayMode = "anatomical";
    connectiveMode.value = connectiveDisplayMode;
  }
  applyConnectiveDisplayMode();
}

function renderSearchResults(query) {
  searchResults.replaceChildren();
  const q = query.trim().toLocaleLowerCase("ru-RU");

  if (q.length < 2 || !structureNames.length) return;

  const matches = [];
  for (let sid = 0; sid < structureNames.length && matches.length < 10; sid += 1) {
    if (
      regionIsolationActive() &&
      !activeRegionStructureIds().includes(sid)
    ) continue;

    if (structureSearchText(structureNames[sid]).includes(q)) {
      matches.push({ kind: "muscle", id: sid });
    }
  }

  if (appMode === "explore" && matches.length < 10) {
    for (const entry of studyStructures) {
      if (matches.length >= 10) break;
      if (!studyStructureMatchesActiveRegion(entry)) continue;
      if (studyStructureSearchText(entry.sourceName, entry.layerKey).includes(q)) {
        matches.push({ kind: "study", id: entry.id });
      }
    }
  }

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "Совпадений не найдено.";
    searchResults.appendChild(empty);
    return;
  }

  for (const match of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";

    if (match.kind === "muscle") {
      const sid = match.id;
      button.textContent = displayStructureName(sid);
      button.addEventListener("click", () => {
        if (isolated || selectedStudyId != null) restoreExploreContext();
        if (structureVisibility[sid] === false) {
          setStructureVisible(sid, true);
          for (let i = hiddenStack.length - 1; i >= 0; i -= 1) {
            if (hiddenStack[i] === sid) hiddenStack.splice(i, 1);
          }
        }
        selectExploreStructure(sid);
        focusSelectedStructures();
        searchResults.replaceChildren();
        searchInput.value = displayStructureName(sid);
      });
    } else {
      const entry = studyEntry(match.id);
      button.textContent =
        studyDisplayName(match.id) + " · " + studyLayerNameRu(entry?.layerKey);
      button.addEventListener("click", () => {
        if (isolated) restoreExploreContext();
        ensureStudyLayerShown(entry);
        setStudyStructureVisible(match.id, true);
        selectStudyStructure(match.id);
        focusSelectedStructures();
        searchResults.replaceChildren();
        searchInput.value = studyDisplayName(match.id);
      });
    }

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

  if (appMode === "quiz") {
    const hits = raycaster.intersectObject(anatomyMesh, false);
    for (const hit of hits) {
      const candidate = structureIdFromHit(hit);
      if (candidate != null && structureVisibility[candidate] !== false) {
        chooseQuiz(candidate);
        return;
      }
    }
    return;
  }

  const pickables = [
    anatomyMesh,
    ...studyMeshes().filter((mesh) => mesh.visible),
  ].filter(Boolean);
  const hits = raycaster.intersectObjects(pickables, false);

  for (const hit of hits) {
    if (hit.object === anatomyMesh) {
      const sid = structureIdFromHit(hit);
      if (sid != null && structureVisibility[sid] !== false) {
        selectExploreStructure(
          sid,
          hits.filter((candidateHit) => candidateHit.object === anatomyMesh)
        );
        return;
      }
      continue;
    }

    const studyId = studyStructureIdFromHit(hit);
    if (studyId != null && studyStructureIsVisible(studyId)) {
      selectStudyStructure(studyId);
      return;
    }
  }
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

function cleanSkeletonGeometry(sourceGeometry, matrixWorld, boneId = null) {
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

  if (boneId != null) {
    const vertexCount = geometry.getAttribute("position").count;
    geometry.setAttribute(
      "structureId",
      new THREE.BufferAttribute(new Float32Array(vertexCount).fill(boneId), 1)
    );
    geometry.setAttribute(
      "structureVisible",
      new THREE.BufferAttribute(new Float32Array(vertexCount).fill(1), 1)
    );
  }

  geometry.computeBoundingBox();
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

function setAllBonesVisible(visible = true) {
  if (!skeletonMesh) return;
  const attr = skeletonMesh.geometry.getAttribute("structureVisible");
  if (!attr) return;

  attr.array.fill(visible ? 1 : 0);
  attr.needsUpdate = true;
  boneVisibility = boneNames.map(() => visible);
  canvas.dataset.regionVisibleBones = String(
    boneVisibility.filter(Boolean).length
  );
}

function setBoneVisible(boneId, visible) {
  if (!skeletonMesh || boneId == null || !boneRanges[boneId]) return;
  const attr = skeletonMesh.geometry.getAttribute("structureVisible");
  if (!attr) return;

  const range = boneRanges[boneId];
  attr.array.fill(visible ? 1 : 0, range.start, range.start + range.count);
  attr.needsUpdate = true;
  boneVisibility[boneId] = visible;
}

function boneWorldBox(boneId) {
  const local = boneLocalBounds[boneId];
  if (!skeletonMesh || !local) return new THREE.Box3().makeEmpty();
  skeletonMesh.updateMatrixWorld(true);
  return local.clone().applyMatrix4(skeletonMesh.matrixWorld);
}

function regionalBoneContextBox() {
  const ids = activeRegionStructureIds();
  const box = boxForStructures(ids);
  if (box.isEmpty()) return box;

  const body = worldBodyBox();
  const size = box.getSize(new THREE.Vector3());
  const bodySizeNow = body.getSize(new THREE.Vector3());
  const expand = new THREE.Vector3(
    Math.max(size.x * 0.10, bodySizeNow.x * 0.018),
    Math.max(size.y * 0.08, bodySizeNow.y * 0.012),
    Math.max(size.z * 0.14, bodySizeNow.z * 0.025)
  );
  box.min.sub(expand);
  box.max.add(expand);

  // Shoulder-focused blocks need scapula/clavicle/humerus plus a limited
  // thoracic anchor, not the entire rib cage and spine.
  if (
    ["shoulder", "rotator-cuff", "scapular-stabilizers"].includes(
      selectedLearningRegion
    ) &&
    !body.isEmpty()
  ) {
    const minY = body.max.y - bodySizeNow.y * 0.50;
    const maxY = body.max.y - bodySizeNow.y * 0.07;
    box.min.y = Math.max(box.min.y, minY);
    box.max.y = Math.min(box.max.y, maxY);
  }

  return box;
}

function applyRegionBoneVisibility() {
  if (!skeletonMesh) return;

  if (!regionIsolationActive()) {
    setAllBonesVisible(true);
    return;
  }

  const context = regionalBoneContextBox();
  if (context.isEmpty()) {
    setAllBonesVisible(false);
    return;
  }

  const specimen = specimenById(selectedLearningRegion);
  const hasNamedBoneMatches =
    Boolean(specimen) &&
    boneNames.some((name) =>
      specimenSupportBoneMatches(specimen.id, name)
    );

  let visibleCount = 0;
  for (let boneId = 0; boneId < boneNames.length; boneId += 1) {
    const inWindow = context.intersectsBox(boneWorldBox(boneId));
    const namedMatch =
      !hasNamedBoneMatches ||
      specimenSupportBoneMatches(specimen.id, boneNames[boneId]);
    const visible = inWindow && namedMatch;
    setBoneVisible(boneId, visible);
    if (visible) visibleCount += 1;
  }

  canvas.dataset.regionVisibleBones = String(visibleCount);
}

function applyBoneDisplayMode() {
  if (!skeletonMesh) {
    boneOpacityField.hidden = true;
    return;
  }

  applyRegionBoneVisibility();
  const mode = boneDisplayMode;
  const material = skeletonMesh.material;

  if (mode === "off") {
    skeletonMesh.visible = false;
    boneOpacity.disabled = true;
    boneOpacityField.hidden = true;
    canvas.dataset.boneMode = mode;
    canvas.dataset.boneScope = regionIsolationActive() ? "regional" : "full";
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
    boneOpacityField.hidden = true;
  } else {
    material.transparent = true;
    material.opacity = Number(boneOpacity.value);
    material.depthTest = false;
    material.depthWrite = false;
    skeletonMesh.renderOrder = 10;
    boneOpacity.disabled = false;
    boneOpacityField.hidden = false;
  }

  material.needsUpdate = true;
  canvas.dataset.boneMode = mode;
  canvas.dataset.boneScope = regionIsolationActive() ? "regional" : "full";
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

function learningAreaOptionExists(value) {
  return [...learningRegion.options].some((option) => option.value === value);
}

function syncLearningAreaQuery() {
  if (!initialQueryApplied || typeof history?.replaceState !== "function") return;

  const url = new URL(window.location.href);
  if (selectedLearningRegion && selectedLearningRegion !== "all") {
    url.searchParams.set("scope", selectedLearningRegion);
  } else {
    url.searchParams.delete("scope");
  }
  url.searchParams.delete("region");
  history.replaceState(null, "", url);
}

function applyInitialQueryState() {
  if (initialQueryApplied) return;
  initialQueryApplied = true;
  const params = new URLSearchParams(window.location.search);

  if (debugPanel) debugPanel.hidden = params.get("debug") !== "1";

  const requestedArea = params.get("scope") || params.get("region");
  if (requestedArea && learningAreaOptionExists(requestedArea)) {
    selectedLearningRegion = requestedArea;
    learningRegion.value = requestedArea;
    applyLearningRegion();
  }

  const requestedSize = params.get("size");
  if (
    requestedSize &&
    [...learningSessionSize.options].some((option) => option.value === requestedSize)
  ) {
    learningSessionSize.value = requestedSize;
  }

  const requestedPractice = params.get("practice");
  if (requestedPractice && SESSION_MODES[requestedPractice] && requestedPractice !== "today") {
    setLearningMode(requestedPractice);
  }

  if (params.get("mode") === "explore") setMode("explore");

  if (requestedArea && requestedArea !== "all") {
    focusLearningRegion();
  } else if (params.get("region") === "shoulder") {
    setShoulderView();
  }

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
  boneNames = [];
  boneRanges = [];
  boneVisibility = [];
  boneLocalBounds = [];
  connectiveMeshes = new Map();
  skinMesh = null;
  referenceMeshes = new Map();
  referenceLayerPromises = new Map();
  referenceLoadGeneration += 1;
  studyStructures = [];
  studyRanges = new Map();
  selectedStudyId = null;
  highlightedStudyId = null;
  exploreHiddenActions.length = 0;
  structureNames = [];
  structureRanges = [];
  structureVisibility = [];
  baseColors = [];
  highlightedIds = new Set();
  bodySize.set(1, 1, 1);

  learningCatalog = [];
  learningTargetBySid = new Map();
  availableTargets = [];
  learningSession = null;
  sessionSummaryShown = false;
  document.body.classList.remove("session-active");
  currentItemWrongAttempts = 0;
  lastWrongSid = null;
  currentTarget = null;
  selectedExploreSid = null;
  isolated = false;
  hiddenStack.length = 0;
  locked = false;

  focusedStructureIds = [];

  // A model switch keeps the selected learning scope/progress but must not
  // carry a rendering preset that the next source cannot represent.
  currentLayerPreset = "muscles";
  muscleDisplayMode = "anatomical";
  skinDisplayMode = "off";
  connectiveDisplayMode = "off";
  boneDisplayMode =
    regionIsolation?.checked && selectedLearningRegion !== "all"
      ? "off"
      : "anatomical";
  layerPreset.value = "muscles";
  skinMode.value = "off";
  connectiveMode.value = "off";
  boneMode.value = boneDisplayMode;
  setConnectiveLayerSelection([]);

  searchInput.value = "";
  searchResults.replaceChildren();
  meshNamesEl.textContent = "";
  targetStatusEl.textContent = "Загружаю выбранную модель…";
  learningRegion.disabled = true;
  learningRegion.replaceChildren(new Option("Загрузка…", "all"));
  learningSessionMode.disabled = true;
  for (const button of learningModeButtons) button.disabled = true;
  startLearningSessionButton.disabled = true;
  sessionProgressEl.hidden = true;
  learningProgressEl.hidden = true;
  learningProgressContentEl.replaceChildren();
  nameChoicesEl.hidden = true;
  nameChoicesEl.replaceChildren();
  revealDeeperButton.hidden = true;
  revealDeeperButton.disabled = true;
  learningSummaryEl.textContent = "После загрузки выберите учебный блок и режим тренировки.";

  nextButton.disabled = true;
  answerButton.disabled = true;
  answerButton.hidden = true;
  quizActions.classList.add("next-only");
  focusSelectedButton.disabled = true;
  isolateButton.disabled = true;
  hideSelectedButton.disabled = true;
  undoHideButton.disabled = true;

  boneMode.disabled = true;
  boneOpacity.disabled = true;
  boneOpacityField.hidden = true;
  connectiveMode.disabled = true;
  connectiveField.hidden = true;
  connectiveLayersField.hidden = true;
  skinMode.disabled = true;
  skinField.hidden = true;
  layerTrainingNote.hidden = true;
  referenceLayersField.hidden = true;
  referenceLayerNote.hidden = true;
  for (const input of referenceLayerInputs) input.disabled = true;
  canvas.dataset.referenceLayers = "";
  canvas.dataset.referenceTrainingHidden = "false";
  canvas.dataset.connectiveMode = "";
  canvas.dataset.connectiveCount = "";
  canvas.dataset.connectiveVisibleLayers = "";
  canvas.dataset.skinMode = "";
  canvas.dataset.skinCount = "";
  canvas.dataset.selectedStudyLayer = "";
  canvas.dataset.selectedStudySpecific = "";
  canvas.dataset.boneMode = "";
  canvas.dataset.boneScope = "";
  canvas.dataset.boneTransparent = "";
  canvas.dataset.regionVisibleBones = "";
  canvas.dataset.boneStencil = "";
  canvas.dataset.learningRegion = "";
  canvas.dataset.learningScope = "";
  canvas.dataset.regionIsolation = "";
  canvas.dataset.regionVisibleMuscles = "";
  canvas.dataset.layerPreset = "";
  canvas.dataset.muscleMode = "";
  canvas.dataset.learningTargetCount = "";
  canvas.dataset.learningCatalogCount = "";
  canvas.dataset.learningSessionMode = "";
  canvas.dataset.learningSessionDone = "";
  canvas.dataset.learningSessionTotal = "";
  canvas.dataset.learningSessionFinished = "";
  canvas.dataset.learningCurrentTargetId = "";
  canvas.dataset.nameTargetVisible = "";
  canvas.dataset.nameTargetPresentation = "";
  canvas.dataset.nameOccludersHidden = "";
  canvas.dataset.nameView = "";
  canvas.dataset.nameTargetComponentCount = "";
  canvas.dataset.trainingDisplay = "false";
  canvas.dataset.connectiveTrainingHidden = "false";
  canvas.dataset.skinTrainingHidden = "false";
}

function attachStructureVisibilityShader(material, cacheKey) {
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
  material.customProgramCacheKey = () => cacheKey;
  return material;
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

  return attachStructureVisibilityShader(material, "muscle-visibility-v3");
}

function createBoneMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xe7d8b7,
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });

  return attachStructureVisibilityShader(material, "bone-visibility-v1");
}



const CONNECTIVE_LAYER_COLORS = {
  subcutaneous: 0xe5c9b3,
  fascia: 0xb9c6c2,
  tendon: 0xe1d7c4,
  ligament: 0xd8cfb7,
  joint: 0xc8d4d6,
  cartilage: 0xc5d2d6,
  other: 0xc9c1b2,
};

const CONNECTIVE_DISPLAY_NAME_RE =
  /ligament|fascia|tendon|aponeuros|retinacul|cartilage|bursa|capsule|synovial|subcutaneous|adipose|iliotibial tract/i;

function createReferenceMaterial(layerKey) {
  const material = new THREE.MeshStandardMaterial({
    color: REFERENCE_LAYER_COLORS[layerKey] || 0xb8b8b8,
    roughness: 0.58,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });
  return attachStructureVisibilityShader(
    material,
    "reference-region-visibility-" + layerKey
  );
}

function referenceWorldBox(mesh, partIndex) {
  const local = mesh?.userData?.referenceBounds?.[partIndex];
  if (!mesh || !local) return new THREE.Box3().makeEmpty();
  mesh.updateMatrixWorld(true);
  return local.clone().applyMatrix4(mesh.matrixWorld);
}

function setReferencePartVisible(mesh, partIndex, visible) {
  const range = mesh?.userData?.referenceRanges?.[partIndex];
  const attr = mesh?.geometry?.getAttribute("structureVisible");
  if (!range || !attr) return;

  attr.array.fill(
    visible ? 1 : 0,
    range.start,
    range.start + range.count
  );
  attr.needsUpdate = true;
}

function applyReferenceRegionVisibility(mesh) {
  const ranges = mesh?.userData?.referenceRanges || [];
  if (!mesh || !ranges.length) return 0;

  if (!regionIsolationActive()) {
    for (let i = 0; i < ranges.length; i += 1) {
      setReferencePartVisible(mesh, i, true);
    }
    return ranges.length;
  }

  const context = regionalBoneContextBox();
  if (context.isEmpty()) {
    for (let i = 0; i < ranges.length; i += 1) {
      setReferencePartVisible(mesh, i, false);
    }
    return 0;
  }

  let visible = 0;
  for (let i = 0; i < ranges.length; i += 1) {
    const show = context.intersectsBox(referenceWorldBox(mesh, i));
    setReferencePartVisible(mesh, i, show);
    if (show) visible += 1;
  }
  return visible;
}

function updateReferenceLayerDataset() {
  const visible = [];
  for (const [key, mesh] of referenceMeshes) {
    if (mesh.visible) visible.push(key);
  }
  canvas.dataset.referenceLayers = visible.join(",");
}

function restoreReferenceLayerVisibility() {
  for (const input of referenceLayerInputs) {
    const key = input.dataset.referenceLayer;
    const mesh = referenceMeshes.get(key);
    if (!mesh) continue;

    const visibleParts = applyReferenceRegionVisibility(mesh);
    mesh.visible = Boolean(input.checked) && visibleParts > 0;
  }
  updateReferenceLayerDataset();
}

async function loadReferenceLayer(layerKey) {
  if (currentModelSource !== "z-anatomy") return null;
  if (referenceMeshes.has(layerKey)) return referenceMeshes.get(layerKey);
  if (referenceLayerPromises.has(layerKey)) return referenceLayerPromises.get(layerKey);

  const url = REFERENCE_LAYER_SOURCES[layerKey];
  if (!url) return null;
  const generation = referenceLoadGeneration;

  const promise = (async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);

    if (generation !== referenceLoadGeneration || currentModelSource !== "z-anatomy") {
      return null;
    }

    gltf.scene.updateMatrixWorld(true);
    const geometries = [];
    const vertexCounts = [];
    const localBounds = [];

    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;

      // Reference layers keep their own part IDs. They never share bone state.
      const referenceId = vertexCounts.length;
      const geometry = cleanSkeletonGeometry(
        child.geometry,
        child.matrixWorld,
        referenceId
      );
      vertexCounts.push(geometry.getAttribute("position").count);
      localBounds.push(geometry.boundingBox?.clone() || null);
      geometries.push(geometry);
    });

    const { merged, temporaries } = mergeSkeletonGeometries(geometries);
    for (const geometry of geometries) geometry.dispose();
    for (const geometry of temporaries) geometry.dispose();
    if (!merged) throw new Error("Не удалось собрать дополнительный анатомический слой.");

    let start = 0;
    const ranges = vertexCounts.map((count) => {
      const range = { start, count };
      start += count;
      return range;
    });

    const mesh = new THREE.Mesh(merged, createReferenceMaterial(layerKey));
    mesh.renderOrder = 2;
    mesh.userData.referenceLayer = layerKey;
    mesh.userData.referenceRanges = ranges;
    mesh.userData.referenceBounds = localBounds;
    modelGroup.add(mesh);
    referenceMeshes.set(layerKey, mesh);

    const visibleParts = applyReferenceRegionVisibility(mesh);
    mesh.visible = Boolean(
      referenceLayerInputs.find((input) => input.dataset.referenceLayer === layerKey)?.checked
    ) && visibleParts > 0;

    updateReferenceLayerDataset();
    return mesh;
  })()
    .catch((error) => {
      console.error(error);
      const input = referenceLayerInputs.find(
        (item) => item.dataset.referenceLayer === layerKey
      );
      if (input) input.checked = false;
      if (appMode === "explore") {
        feedbackEl.className = "feedback wrong";
        feedbackEl.textContent =
          "Не удалось загрузить дополнительный анатомический слой. Основная модель продолжает работать.";
      }
      return null;
    })
    .finally(() => {
      referenceLayerPromises.delete(layerKey);
      const input = referenceLayerInputs.find(
        (item) => item.dataset.referenceLayer === layerKey
      );
      if (input && currentModelSource === "z-anatomy") input.disabled = false;
    });

  referenceLayerPromises.set(layerKey, promise);
  return promise;
}

function setReferenceLayerAvailability(available) {
  referenceLayersField.hidden = !available;
  referenceLayerNote.hidden = !available;
  for (const input of referenceLayerInputs) input.disabled = !available;
  if (!available) {
    for (const mesh of referenceMeshes.values()) mesh.visible = false;
    updateReferenceLayerDataset();
  }
}

async function handleReferenceLayerChange(input) {
  const layerKey = input.dataset.referenceLayer;
  if (!layerKey || currentModelSource !== "z-anatomy") return;

  if (!input.checked) {
    const mesh = referenceMeshes.get(layerKey);
    if (mesh) mesh.visible = false;
    updateReferenceLayerDataset();
    return;
  }

  input.disabled = true;
  const mesh = await loadReferenceLayer(layerKey);
  if (mesh && input.checked && currentModelSource === "z-anatomy") {
    mesh.visible = applyReferenceRegionVisibility(mesh) > 0;
    updateReferenceLayerDataset();
  }
}

function createConnectiveMaterial(layerKey) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: layerKey === "fascia" ? 0.76 : 0.68,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });
  return attachStructureVisibilityShader(
    material,
    "study-connective-visibility-" + layerKey
  );
}

function createSkinMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthTest: true,
    depthWrite: true,
  });
  return attachStructureVisibilityShader(material, "study-skin-visibility-v1");
}

function selectedConnectiveLayers() {
  return new Set(
    connectiveLayerInputs
      .filter((input) => input.checked)
      .map((input) => input.dataset.connectiveLayer)
      .filter(Boolean)
  );
}

function applyConnectiveDisplayMode() {
  if (!connectiveMeshes.size) {
    syncLayerPresetAvailability();
    connectiveMode.disabled = true;
    connectiveField.hidden = true;
    connectiveLayersField.hidden = true;
    canvas.dataset.connectiveMode = "unavailable";
    canvas.dataset.connectiveVisibleLayers = "";
    return;
  }

  connectiveField.hidden = false;
  connectiveLayersField.hidden = false;
  layerTrainingNote.hidden = false;
  connectiveMode.disabled = false;

  applyRegionStudyVisibility();
  const mode = connectiveDisplayMode;
  const enabled = selectedConnectiveLayers();
  const visibleLayers = [];
  const isolatedEntry =
    isolated && selectedStudyId != null ? studyEntry(selectedStudyId) : null;

  for (const [layerKey, mesh] of connectiveMeshes) {
    const show = isolatedEntry
      ? isolatedEntry.layerKey !== "skin" && layerKey === isolatedEntry.layerKey
      : mode !== "off" && enabled.has(layerKey);
    mesh.visible = show;
    if (show) visibleLayers.push(layerKey);

    const material = mesh.material;
    material.depthTest = true;

    if (mode === "ghost") {
      material.transparent = true;
      material.opacity = layerKey === "fascia" ? 0.18 : 0.28;
      material.depthWrite = false;
      mesh.renderOrder = 3;
    } else {
      material.transparent = layerKey === "fascia";
      material.opacity = layerKey === "fascia" ? 0.54 : 1;
      material.depthWrite = layerKey !== "fascia";
      mesh.renderOrder = 2;
    }

    material.needsUpdate = true;
  }

  canvas.dataset.connectiveMode = mode;
  canvas.dataset.connectiveVisibleLayers = visibleLayers.join(",");
}

function applySkinDisplayMode() {
  if (!skinMesh) {
    skinMode.disabled = true;
    skinField.hidden = true;
    canvas.dataset.skinMode = "unavailable";
    return;
  }

  skinField.hidden = false;
  layerTrainingNote.hidden = false;
  skinMode.disabled = false;
  applyRegionStudyVisibility();
  const mode = skinDisplayMode;
  const material = skinMesh.material;
  const isolatedEntry =
    isolated && selectedStudyId != null ? studyEntry(selectedStudyId) : null;

  if (isolatedEntry && isolatedEntry.layerKey !== "skin") {
    skinMesh.visible = false;
    canvas.dataset.skinMode = mode;
    return;
  }

  if (mode === "off") {
    skinMesh.visible = false;
    canvas.dataset.skinMode = "off";
    return;
  }

  skinMesh.visible = true;
  material.transparent = true;
  material.depthTest = true;

  if (mode === "ghost") {
    material.opacity = 0.16;
    material.depthWrite = false;
    skinMesh.renderOrder = 4;
  } else {
    material.opacity = 0.9;
    material.depthWrite = true;
    skinMesh.renderOrder = 4;
  }

  material.needsUpdate = true;
  canvas.dataset.skinMode = mode;
}

function applyTrainingDisplayOverride() {
  applyRegionMuscleVisibility();

  if (anatomyMesh) {
    const material = anatomyMesh.material;
    anatomyMesh.visible = true;
    material.transparent = false;
    material.opacity = 1;
    material.depthTest = true;
    material.depthWrite = true;
    material.needsUpdate = true;
  }

  if (skeletonMesh) skeletonMesh.visible = false;
  for (const mesh of connectiveMeshes.values()) mesh.visible = false;
  if (skinMesh) skinMesh.visible = false;
  for (const mesh of referenceMeshes.values()) mesh.visible = false;

  canvas.dataset.trainingDisplay = "true";
  canvas.dataset.connectiveTrainingHidden = String(connectiveMeshes.size > 0);
  canvas.dataset.skinTrainingHidden = String(Boolean(skinMesh));
  canvas.dataset.referenceTrainingHidden = String(referenceMeshes.size > 0);
  canvas.dataset.boneTrainingHidden = String(Boolean(skeletonMesh));
}

function restoreDisplayAfterTraining() {
  applyRegionScene();

  canvas.dataset.trainingDisplay = "false";
  canvas.dataset.connectiveTrainingHidden = "false";
  canvas.dataset.skinTrainingHidden = "false";
  canvas.dataset.referenceTrainingHidden = "false";
  canvas.dataset.boneTrainingHidden = "false";
}

function connectiveSubtype(name) {
  const value = String(name || "").toLowerCase();
  if (/subcutaneous|adipose/.test(value)) return "subcutaneous";
  if (/bursa|capsule|synovial/.test(value)) return "joint";
  if (/ligament/.test(value)) return "ligament";
  if (/fascia|iliotibial tract/.test(value)) return "fascia";
  if (/tendon/.test(value)) return "tendon";
  if (/aponeuros/.test(value)) return "aponeurosis";
  if (/retinacul/.test(value)) return "retinaculum";
  if (/cartilage/.test(value)) return "cartilage";
  return "other";
}

function connectiveLayerKey(name) {
  const subtype = connectiveSubtype(name);
  if (subtype === "aponeurosis") return "tendon";
  if (subtype === "retinaculum") return "fascia";
  return subtype;
}

function connectiveStats(parts) {
  const stats = {
    total: parts.length,
    subcutaneous: 0,
    joint: 0,
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

    if (color) {
      const colors = new Float32Array(part.vertexCount * 3);
      for (let i = 0; i < part.vertexCount; i += 1) {
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
  }

  return geometry;
}

async function loadSkeletonLayer(loader) {
  try {
    const gltf = await loader.loadAsync(SKELETON_MODEL_URL);
    gltf.scene.updateMatrixWorld(true);

    const geometries = [];
    const vertexCounts = [];

    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;

      const boneId = boneNames.length;
      const geometry = cleanSkeletonGeometry(
        child.geometry,
        child.matrixWorld,
        boneId
      );

      boneNames.push(child.name || `Кость ${boneId + 1}`);
      vertexCounts.push(geometry.getAttribute("position").count);
      boneLocalBounds.push(geometry.boundingBox?.clone() || null);
      geometries.push(geometry);
    });

    const { merged, temporaries } = mergeSkeletonGeometries(geometries);
    if (!merged) throw new Error("Не удалось объединить геометрию скелета.");

    for (const geometry of geometries) geometry.dispose();
    for (const geometry of temporaries) geometry.dispose();

    let boneStart = 0;
    boneRanges = vertexCounts.map((count) => {
      const range = { start: boneStart, count };
      boneStart += count;
      return range;
    });
    boneVisibility = boneNames.map(() => true);

    skeletonMesh = new THREE.Mesh(merged, createBoneMaterial());
    skeletonMesh.renderOrder = 1;
    modelGroup.add(skeletonMesh);
    applyRegionBoneVisibility();

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
    connectiveField.hidden = true;
    connectiveLayersField.hidden = true;
    skinMode.disabled = true;
    skinField.hidden = true;
    layerTrainingNote.hidden = true;
    canvas.dataset.connectiveMode = "unavailable";
    canvas.dataset.connectiveCount = "0";
    canvas.dataset.connectiveVisibleLayers = "";
    canvas.dataset.skinMode = "unavailable";
    canvas.dataset.skinCount = "0";
    boneMode.disabled = true;
    setReferenceLayerAvailability(true);
    await loadSkeletonLayer(loader);

    for (const input of referenceLayerInputs) {
      if (input.checked) void handleReferenceLayerChange(input);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function loadBodyParts4Model() {
  setReferenceLayerAvailability(false);
  syncLayerPresetAvailability();
  const response = await fetch(BODYPARTS_ATLAS_URL);
  if (!response.ok) throw new Error("Не удалось получить каталог BodyParts3D 4.0.");
  const atlas = await response.json();

  const anatomyParts = atlas.parts.filter((part) => bodyPartsAnatomyKind(part));
  const muscleAnatomyParts = atlas.parts.filter(
    (part) => bodyPartsAnatomyKind(part) === "muscle"
  );
  const connectiveParts = atlas.parts.filter(
    (part) =>
      !bodyPartsAnatomyKind(part) &&
      (
        part.system === "connective" ||
        (
          (part.system === "skeletal" || part.system === "integumentary") &&
          CONNECTIVE_DISPLAY_NAME_RE.test(part.name)
        )
      )
  );
  const connectiveIds = new Set(connectiveParts.map((part) => part.id));
  const skinParts = atlas.parts.filter(
    (part) => part.system === "integumentary" && !connectiveIds.has(part.id)
  );
  const skinIds = new Set(skinParts.map((part) => part.id));
  const parts = [...anatomyParts, ...connectiveParts, ...skinParts];
  const chunkIds = [...new Set(parts.map((part) => part.chunk))].sort((a, b) => a - b);

  const muscleChunks = [];
  const boneChunks = [];
  const boneVertexCounts = [];
  const connectiveChunksByLayer = new Map(
    ["subcutaneous", "fascia", "tendon", "ligament", "joint", "cartilage", "other"]
      .map((key) => [key, []])
  );
  const skinChunks = [];
  const vertexCounts = [];
  let triangleCount = 0;
  let connectiveTriangleCount = 0;
  let skinTriangleCount = 0;

  for (let chunkPosition = 0; chunkPosition < chunkIds.length; chunkPosition += 1) {
    const chunkId = chunkIds[chunkPosition];
    loadingEl.textContent =
      "Загружаю анатомическую модель — часть " +
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
        const boneId = boneNames.length;
        triangleCount += Math.floor(part.indexCount / 3);
        const geometry = bodyPartsGeometry(part, buffer, boneId);
        geometry.computeBoundingBox();
        boneNames.push(part.name || `Кость ${boneId + 1}`);
        boneVertexCounts.push(part.vertexCount);
        boneLocalBounds.push(geometry.boundingBox?.clone() || null);
        return geometry;
      });
      const mergedChunk = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!mergedChunk) throw new Error("Не удалось объединить костный блок BodyParts3D.");
      boneChunks.push(mergedChunk);
    }

    const connectiveInChunk = chunkParts.filter(
      (part) => connectiveIds.has(part.id)
    );
    for (const layerKey of ["subcutaneous", "fascia", "tendon", "ligament", "joint", "cartilage", "other"]) {
      const layerParts = connectiveInChunk.filter(
        (part) => connectiveLayerKey(part.name) === layerKey
      );
      if (!layerParts.length) continue;

      const geometries = layerParts.map((part) => {
        const studyId = studyStructures.length;
        const color = new THREE.Color(
          CONNECTIVE_LAYER_COLORS[layerKey] || CONNECTIVE_LAYER_COLORS.other
        );
        const geometry = bodyPartsGeometry(part, buffer, studyId, color);
        const nearestMuscle = nearestMuscleForPart(part, muscleAnatomyParts);
        studyStructures.push({
          id: studyId,
          sourceName: part.name,
          conceptId: part.conceptId || "",
          layerKey,
          bounds: part.bounds || null,
          nearestMuscleNameRu: nearestMuscle.nameRu,
          nearestMuscleSourceName: nearestMuscle.sourceName,
        });
        connectiveTriangleCount += Math.floor(part.indexCount / 3);
        return geometry;
      });
      const mergedChunk = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!mergedChunk) {
        throw new Error("Не удалось объединить соединительнотканный подслой BodyParts3D.");
      }
      connectiveChunksByLayer.get(layerKey).push(mergedChunk);
    }

    const skinInChunk = chunkParts.filter((part) => skinIds.has(part.id));
    if (skinInChunk.length) {
      const geometries = skinInChunk.map((part) => {
        const studyId = studyStructures.length;
        const geometry = bodyPartsGeometry(
          part,
          buffer,
          studyId,
          new THREE.Color(0xc69c84)
        );
        const nearestMuscle = nearestMuscleForPart(part, muscleAnatomyParts);
        studyStructures.push({
          id: studyId,
          sourceName: part.name,
          conceptId: part.conceptId || "",
          layerKey: "skin",
          bounds: part.bounds || null,
          nearestMuscleNameRu: nearestMuscle.nameRu,
          nearestMuscleSourceName: nearestMuscle.sourceName,
        });
        skinTriangleCount += Math.floor(part.indexCount / 3);
        return geometry;
      });
      const mergedChunk = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!mergedChunk) throw new Error("Не удалось объединить слой наружных покровов BodyParts3D.");
      skinChunks.push(mergedChunk);
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
    let boneStart = 0;
    boneRanges = boneVertexCounts.map((count) => {
      const range = { start: boneStart, count };
      boneStart += count;
      return range;
    });
    boneVisibility = boneNames.map(() => true);

    skeletonMesh = new THREE.Mesh(mergedBones, createBoneMaterial());
    skeletonMesh.renderOrder = 1;
    modelGroup.add(skeletonMesh);
    applyRegionBoneVisibility();
  }

  for (const [layerKey, chunks] of connectiveChunksByLayer) {
    if (!chunks.length) continue;
    const merged = mergeGeometries(chunks, false);
    for (const geometry of chunks) geometry.dispose();
    if (!merged) continue;

    const mesh = new THREE.Mesh(merged, createConnectiveMaterial(layerKey));
    mesh.renderOrder = 2;
    mesh.userData.layerKey = layerKey;
    connectiveMeshes.set(layerKey, mesh);
    modelGroup.add(mesh);
    indexStudyRanges(mesh);
  }

  const mergedSkin = skinChunks.length ? mergeGeometries(skinChunks, false) : null;
  for (const geometry of skinChunks) geometry.dispose();
  if (mergedSkin) {
    skinMesh = new THREE.Mesh(mergedSkin, createSkinMaterial());
    skinMesh.renderOrder = 4;
    modelGroup.add(skinMesh);
    indexStudyRanges(skinMesh);
  }

  fitCamera(modelGroup);

  if (skeletonMesh) {
    boneMode.disabled = false;
    applyBoneDisplayMode();
  }
  applyConnectiveDisplayMode();
  applySkinDisplayMode();

  discoverTargets();
  const classification = bodyPartsClassificationStats(atlas.parts);
  const connective = connectiveStats(connectiveParts);
  canvas.dataset.connectiveCount = String(connective.total);
  canvas.dataset.skinCount = String(skinParts.length);
  updateDiagnostics(
    "BodyParts3D 4.0: всё тело, " +
    classification.muscles +
    " мышечных, " +
    classification.bones +
    " костных, " +
    connective.total +
    " соединительнотканных и " +
    skinParts.length +
    " структур наружных покровов. " +
    "В соединительнотканном слое по названиям: подкожная клетчатка " +
    connective.subcutaneous +
    ", фасции " +
    connective.fascia +
    ", сухожилия " +
    connective.tendon +
    ", апоневрозы " +
    connective.aponeurosis +
    ", удерживатели " +
    connective.retinaculum +
    ", суставные капсулы/сумки " +
    connective.joint +
    ", связки " +
    connective.ligament +
    ", хрящевые структуры " +
    connective.cartilage +
    "; остальные " +
    connective.other +
    ". Исключено " +
    classification.excludedSkeletal +
    " структур, ошибочно помеченных atlas как skeletal. " +
    (triangleCount + connectiveTriangleCount + skinTriangleCount).toLocaleString("ru-RU") +
    " треугольников загруженных слоёв."
  );
}

async function loadSelectedModel(source) {
  const requestedSource = source === "bodyparts4" ? "bodyparts4" : "z-anatomy";
  modelSource.disabled = true;
  loadingEl.classList.remove("is-hidden");
  loadingEl.textContent = "Загружаю анатомическую модель…";

  resetLoadedModel();
  currentModelSource = requestedSource;
  canvas.dataset.modelSource = requestedSource;
  syncLayerPresetAvailability();

  try {
    if (requestedSource === "bodyparts4") {
      await loadBodyParts4Model();
    } else {
      await loadZAnatomyModel();
    }

    loadingEl.classList.add("is-hidden");
    modelSource.disabled = false;

    if (appMode === "explore") {
      questionLabelEl.textContent = "Атлас";
      questionEl.textContent = "Выберите структуру";
      feedbackEl.className = "feedback";
      feedbackEl.textContent =
        "Коснитесь структуры на модели или найдите её по названию.";
    }

    setViewPreset(viewPreset.value);
    applyInitialQueryState();
    notifyEmbedHeight();
  } catch (error) {
    console.error(error);
    loadingEl.textContent = "Не удалось загрузить выбранную 3D-модель.";
    questionEl.textContent = "Ошибка загрузки";
    feedbackEl.textContent =
      "Попробуйте выбрать другую анатомическую модель в разделе «Отображение».";
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

for (const input of connectiveLayerInputs) {
  input.addEventListener("change", applyConnectiveDisplayMode);
}

skinMode.addEventListener("change", () => {
  skinDisplayMode = skinMode.value;
  applySkinDisplayMode();
});

for (const input of referenceLayerInputs) {
  input.addEventListener("change", () => {
    void handleReferenceLayerChange(input);
  });
}

boneOpacity.addEventListener("input", () => {
  if (!skeletonMesh || boneDisplayMode !== "xray") return;
  skeletonMesh.material.opacity = Number(boneOpacity.value);
  skeletonMesh.material.needsUpdate = true;
});

modelSource.addEventListener("change", () => {
  void loadSelectedModel(modelSource.value);
});

layerPreset.addEventListener("change", () => {
  applyStudyLayerPreset(layerPreset.value);
});

regionIsolation.addEventListener("change", () => {
  applyRegionScene({ resetLayers: regionIsolation.checked, focus: true });
  renderSearchResults(searchInput.value);
});

learningRegion.addEventListener("change", () => {
  selectedLearningRegion = learningRegion.value;
  applyLearningRegion();
  syncLearningAreaQuery();
  applyRegionScene({ resetLayers: true, focus: true });
  renderSearchResults(searchInput.value);
});

learningSessionMode.addEventListener("change", () => {
  setLearningMode(learningSessionMode.value);
});

learningSessionSize.addEventListener("change", updateTodayAction);

for (const button of learningModeButtons) {
  button.addEventListener("click", () => {
    if (button.disabled) return;
    setLearningMode(button.dataset.learningMode);
  });
}

startLearningSessionButton.addEventListener("click", () => startLearningSession());
todayLearningSessionButton.addEventListener("click", () => startLearningSession("today"));
exitLearningSessionButton.addEventListener("click", () => {
  resetLearningSessionUi("Выберите учебный блок и способ тренировки.");
  focusLearningRegion();
});

focusShoulderButton.addEventListener("click", focusLearningRegion);
focusFullButton.addEventListener("click", () => {
  regionIsolation.checked = false;
  applyRegionScene();
  setFullBodyView();
});
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
  if (selectedStudyId != null) {
    isolateSelectedStudyStructure();
    return;
  }

  if (selectedExploreSid == null) return;

  if (isolated) {
    showAllStructures();
    if (selectedExploreSid != null) {
      highlightStructures([selectedExploreSid], "selected");
    }
  } else {
    setVisibleStructures([selectedExploreSid]);
    isolated = true;
    focusSelectedStructures();
    updateLayerButtons();
  }
});

hideSelectedButton.addEventListener("click", hideSelectedStructure);
peelSurfaceLayerButton.addEventListener("click", peelAnatomicalMuscleLayer);
showNearestMuscleButton.addEventListener("click", () => {
  const entry = studyEntry(selectedStudyId);
  if (!entry?.nearestMuscleSourceName) return;

  let sid = structureNames.findIndex(
    (name) => name === entry.nearestMuscleSourceName
  );

  if (sid < 0) {
    const concept = learningConceptSourceName(entry.nearestMuscleSourceName);
    sid = structureNames.findIndex(
      (name) => learningConceptSourceName(name) === concept
    );
  }

  if (sid < 0) return;

  restoreExploreContext();
  selectExploreStructure(sid);
  focusSelectedStructures(1.9);
});
undoHideButton.addEventListener("click", undoLastHide);

showAllButton.addEventListener("click", () => {
  restoreExploreContext();
  if (selectedStudyId != null) {
    restoreStudyHighlight();
    highlightedStudyId = selectedStudyId;
    paintStudyStructure(selectedStudyId, new THREE.Color(0x245da8));
  } else if (selectedExploreSid != null) {
    restoreHighlights();
    highlightStructures([selectedExploreSid], "selected");
  }
});

mobileTaskMedia.addEventListener?.("change", syncQuestionCardPlacement);
window.addEventListener("resize", syncQuestionCardPlacement);

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
