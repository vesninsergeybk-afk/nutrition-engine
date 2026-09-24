import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/main/systems/kas.glb";

// Первый MVP спрашивает только структуры, которые реально доступны
// на поверхностной модели. Глубокие мышцы появятся после режима снятия слоёв.
const TARGETS = [
  { ru: "дельтовидную мышцу", latin: "m. deltoideus", re: /deltoid/i },
  { ru: "большую грудную мышцу", latin: "m. pectoralis major", re: /pectoralis.?major/i },
  { ru: "широчайшую мышцу спины", latin: "m. latissimus dorsi", re: /latissimus/i },
  { ru: "двуглавую мышцу плеча", latin: "m. biceps brachii", re: /biceps.?brach/i },
  { ru: "трёхглавую мышцу плеча", latin: "m. triceps brachii", re: /triceps.?brach/i },
  { ru: "трапециевидную мышцу", latin: "m. trapezius", re: /trapezius/i },
];

const COVER_RE =
  /fascia|aponeuros|retinacul|peritone|pleura|dura mater|pericardi|omentum|epicardium/i;

const canvas = document.querySelector("#viewer");
const loadingEl = document.querySelector("#loading");
const questionEl = document.querySelector("#question");
const feedbackEl = document.querySelector("#feedback");
const nextButton = document.querySelector("#next-question");
const answerButton = document.querySelector("#show-answer");
const correctEl = document.querySelector("#score-correct");
const wrongEl = document.querySelector("#score-wrong");
const diagnosticsEl = document.querySelector("#diagnostics");
const meshNamesEl = document.querySelector("#mesh-names");
const targetStatusEl = document.querySelector("#target-status");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdedbd4);

const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 5000);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;

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
let structureNames = [];
let structureRanges = [];
let baseColors = [];
let highlightedIds = new Set();

let availableTargets = [];
let currentTarget = null;
let locked = false;
let correct = 0;
let wrong = 0;
let lastTargetIndex = -1;
let pointerStart = null;

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

function fitCamera(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (maxDim / 2) / Math.tan(fov / 2);

  camera.position.set(0, maxDim * 0.02, distance * 1.18);
  camera.near = Math.max(maxDim / 10000, 0.001);
  camera.far = maxDim * 20;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.minDistance = maxDim * 0.15;
  controls.maxDistance = maxDim * 4;
  controls.update();
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

  const color = new THREE.Color(kind === "wrong" ? 0x751d28 : 0x168148);
  for (const sid of ids) {
    paintStructure(sid, color);
    highlightedIds.add(sid);
  }
  anatomyMesh.geometry.getAttribute("color").needsUpdate = true;
}

function discoverTargets() {
  availableTargets = TARGETS.filter((target) => targetStructureIds(target).length > 0);

  const lines = availableTargets.map((target) => {
    const matches = targetStructureIds(target).map((sid) => structureNames[sid]);
    return `${target.latin}: ${matches.join(", ")}`;
  });

  targetStatusEl.textContent =
    `Поверхностный режим: распознано целей ${availableTargets.length} из ${TARGETS.length}. Глубокие мышцы будут в режиме снятия слоёв.`;

  diagnosticsEl.textContent =
    `В GLB после исключения фасциальных покрытий найдено структур: ${structureNames.length}. Для рендера они объединены в один mesh; учебных целей: ${availableTargets.length}.`;
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

function nextQuestion() {
  if (!availableTargets.length) return;

  restoreHighlights();
  locked = false;
  feedbackEl.className = "feedback";
  feedbackEl.textContent = "Нажмите на нужную мышцу прямо на модели.";

  let index = Math.floor(Math.random() * availableTargets.length);
  if (availableTargets.length > 1 && index === lastTargetIndex) {
    index = (index + 1) % availableTargets.length;
  }

  lastTargetIndex = index;
  currentTarget = availableTargets[index];

  questionEl.textContent = `Найдите ${currentTarget.ru}`;
  nextButton.textContent = "Пропустить";
}

function revealAnswer() {
  if (!currentTarget) return;

  restoreHighlights();
  const ids = targetStructureIds(currentTarget);
  highlightStructures(ids, "answer");

  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    `${currentTarget.latin}. Подсвечены найденные варианты этой структуры, включая правую и левую стороны.`;

  locked = true;
  nextButton.textContent = "Следующая";
}

function choose(sid) {
  if (!currentTarget || locked || sid == null || !structureNames[sid]) return;

  restoreHighlights();
  const name = structureNames[sid];

  if (currentTarget.re.test(name)) {
    correct += 1;
    correctEl.textContent = String(correct);
    highlightStructures([sid], "answer");
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent = `Верно. Вы выбрали: ${name}.`;
    locked = true;
    nextButton.textContent = "Следующая";
  } else {
    wrong += 1;
    wrongEl.textContent = String(wrong);
    highlightStructures([sid], "wrong");
    feedbackEl.className = "feedback wrong";
    feedbackEl.textContent = `Это «${name}». Попробуйте ещё раз.`;
  }
}

function onPointerDown(event) {
  pointerStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
}

function onPointerUp(event) {
  if (!pointerStart || pointerStart.pointerId !== event.pointerId) return;

  const moved = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y
  );
  pointerStart = null;

  // Поворот модели не должен засчитываться как ответ.
  if (moved > 8 || !anatomyMesh || !currentTarget || locked) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(anatomyMesh, false)[0];
  if (!hit || hit.faceIndex == null) return;

  // Геометрия намеренно non-indexed: три последовательные вершины = один треугольник.
  const vertexIndex = hit.faceIndex * 3;
  const structureId = anatomyMesh.geometry.getAttribute("structureId");
  const sid = Math.round(structureId.getX(vertexIndex));

  choose(sid);
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

function cleanGeometry(sourceGeometry, matrixWorld, sid, color) {
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

  const colors = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i += 1) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return geometry;
}

async function loadModel() {
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(MODEL_URL);

    // GLTFLoader нормализует имена node-объектов. Для учебной логики
    // восстанавливаем исходные имена из glTF JSON.
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

      // Фасции/апоневрозы могут перекрывать мышцы и делать задание невыполнимым.
      if (COVER_RE.test(name)) return;

      const sid = structureNames.length;
      const color = baseColorFor(name);
      const geometry = cleanGeometry(child.geometry, child.matrixWorld, sid, color);

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

    for (const geometry of geometries) geometry.dispose();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.62,
      metalness: 0,
    });

    anatomyMesh = new THREE.Mesh(merged, material);
    scene.add(anatomyMesh);

    fitCamera(anatomyMesh);
    discoverTargets();
    loadingEl.classList.add("is-hidden");
  } catch (error) {
    console.error(error);
    loadingEl.textContent = "Не удалось загрузить 3D-модель.";
    questionEl.textContent = "Ошибка загрузки";
    feedbackEl.textContent =
      "Технический прототип не прошёл загрузку модели. Причина указана в диагностике.";
    diagnosticsEl.textContent = String(error?.message || error);
  }
}

nextButton.addEventListener("click", nextQuestion);
answerButton.addEventListener("click", revealAnswer);
renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointercancel", () => {
  pointerStart = null;
});

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
loadModel();
