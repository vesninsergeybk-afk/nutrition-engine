import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL =
  "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/main/systems/kas.glb";

const TARGETS = [
  { ru: "дельтовидную мышцу", latin: "m. deltoideus", re: /deltoid/i },
  { ru: "надостную мышцу", latin: "m. supraspinatus", re: /supraspin/i },
  { ru: "подостную мышцу", latin: "m. infraspinatus", re: /infraspin/i },
  { ru: "подлопаточную мышцу", latin: "m. subscapularis", re: /subscap/i },
  { ru: "малую круглую мышцу", latin: "m. teres minor", re: /teres.?minor/i },
  { ru: "большую круглую мышцу", latin: "m. teres major", re: /teres.?major/i },
  { ru: "большую грудную мышцу", latin: "m. pectoralis major", re: /pectoralis.?major/i },
  { ru: "широчайшую мышцу спины", latin: "m. latissimus dorsi", re: /latissimus/i },
  { ru: "двуглавую мышцу плеча", latin: "m. biceps brachii", re: /biceps.?brach/i },
  { ru: "трёхглавую мышцу плеча", latin: "m. triceps brachii", re: /triceps.?brach/i },
];

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

let root = null;
let meshes = [];
let availableTargets = [];
let currentTarget = null;
let locked = false;
let correct = 0;
let wrong = 0;
let lastTargetIndex = -1;

const originalMaterials = new WeakMap();

function normalizedName(mesh) {
  return (mesh.userData?.originalName || mesh.name || "").trim();
}

function rememberMaterial(mesh) {
  if (!mesh.material) return;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const clones = materials.map((m) => m.clone());
  mesh.material = Array.isArray(mesh.material) ? clones : clones[0];
  originalMaterials.set(mesh, clones.map((m) => ({
    color: m.color?.clone?.() ?? null,
    emissive: m.emissive?.clone?.() ?? null,
    emissiveIntensity: m.emissiveIntensity ?? 1,
    opacity: m.opacity,
    transparent: m.transparent,
  })));
}

function restoreMaterials() {
  for (const mesh of meshes) {
    const saved = originalMaterials.get(mesh);
    if (!saved) continue;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m, i) => {
      const s = saved[i] ?? saved[0];
      if (s.color && m.color) m.color.copy(s.color);
      if (s.emissive && m.emissive) m.emissive.copy(s.emissive);
      if ("emissiveIntensity" in m) m.emissiveIntensity = s.emissiveIntensity;
      m.opacity = s.opacity;
      m.transparent = s.transparent;
      m.needsUpdate = true;
    });
  }
}

function highlight(mesh, kind = "answer") {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of mats) {
    if (m.emissive) {
      m.emissive.set(kind === "wrong" ? 0x5f1515 : 0x175f32);
      m.emissiveIntensity = kind === "wrong" ? 0.75 : 0.95;
    } else if (m.color) {
      m.color.offsetHSL(0, 0, kind === "wrong" ? -0.18 : 0.16);
    }
  }
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

function targetMeshes(target) {
  return meshes.filter((mesh) => target.re.test(normalizedName(mesh)));
}

function discoverTargets() {
  availableTargets = TARGETS.filter((target) => targetMeshes(target).length > 0);

  const lines = availableTargets.map((target) => {
    const matches = targetMeshes(target).map(normalizedName);
    return `${target.latin}: ${matches.join(", ")}`;
  });

  targetStatusEl.textContent =
    `Распознано учебных целей: ${availableTargets.length} из ${TARGETS.length}.`;

  diagnosticsEl.textContent =
    `В GLB найдено mesh-объектов: ${meshes.length}. Учебных целей: ${availableTargets.length}.`;
  meshNamesEl.textContent = lines.join("\n") || meshes.slice(0, 120).map(normalizedName).join("\n");

  if (!availableTargets.length) {
    questionEl.textContent = "Не удалось сопоставить названия мышц";
    feedbackEl.textContent =
      "Откройте техническую диагностику: нам нужно сверить реальные имена объектов в GLB.";
    return;
  }

  nextButton.disabled = false;
  answerButton.disabled = false;
  nextQuestion();
}

function nextQuestion() {
  if (!availableTargets.length) return;

  restoreMaterials();
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
  restoreMaterials();

  const matches = targetMeshes(currentTarget);
  matches.forEach((mesh) => highlight(mesh, "answer"));

  feedbackEl.className = "feedback correct";
  feedbackEl.textContent =
    `${currentTarget.latin}. Подсвечены все найденные варианты этой структуры, включая правую и левую стороны.`;

  locked = true;
  nextButton.textContent = "Следующая";
}

function choose(mesh) {
  if (!currentTarget || locked) return;

  restoreMaterials();
  const name = normalizedName(mesh);

  if (currentTarget.re.test(name)) {
    correct += 1;
    correctEl.textContent = String(correct);
    highlight(mesh, "answer");
    feedbackEl.className = "feedback correct";
    feedbackEl.textContent = `Верно. Вы выбрали: ${name || currentTarget.latin}.`;
    locked = true;
    nextButton.textContent = "Следующая";
  } else {
    wrong += 1;
    wrongEl.textContent = String(wrong);
    highlight(mesh, "wrong");
    feedbackEl.className = "feedback wrong";
    feedbackEl.textContent =
      `Это «${name || "неопознанная структура"}». Попробуйте ещё раз.`;
  }
}

function onPointerUp(event) {
  if (!meshes.length || !currentTarget || locked) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length) choose(hits[0].object);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const needsResize =
    canvas.width !== Math.floor(width * renderer.getPixelRatio()) ||
    canvas.height !== Math.floor(height * renderer.getPixelRatio());

  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

async function loadModel() {
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(MODEL_URL);

    root = gltf.scene;
    scene.add(root);

    root.traverse((child) => {
      if (!child.isMesh) return;
      child.frustumCulled = true;
      child.userData.originalName = child.name;
      rememberMaterial(child);
      meshes.push(child);
    });

    fitCamera(root);
    discoverTargets();
    loadingEl.classList.add("is-hidden");
  } catch (error) {
    console.error(error);
    loadingEl.textContent = "Не удалось загрузить 3D-модель.";
    questionEl.textContent = "Ошибка загрузки";
    feedbackEl.textContent =
      "Для следующего шага перенесём GLB в наш репозиторий, чтобы не зависеть от внешней загрузки.";
    diagnosticsEl.textContent = String(error?.message || error);
  }
}

nextButton.addEventListener("click", nextQuestion);
answerButton.addEventListener("click", revealAnswer);
renderer.domElement.addEventListener("pointerup", onPointerUp);

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
loadModel();
