import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SOURCE_ROOT =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public";
const ATLAS_URL = SOURCE_ROOT + "/models/atlas.json";

const MUSCLE_RE =
  /deltoid|supraspinatus|infraspinatus|subscapularis|teres minor|teres major|pectoralis major|latissimus dorsi|biceps brachii|triceps brachii|trapezius|levator scapulae|rhomboid|serratus anterior|coracobrachialis/i;
const BONE_RE = /scapula|clavicle|humerus/i;

const canvas = document.querySelector("#quality-canvas");
const loadingEl = document.querySelector("#quality-loading");
const selectedEl = document.querySelector("#quality-selected");
const metaEl = document.querySelector("#quality-meta");
const statsEl = document.querySelector("#quality-stats");
const structuresEl = document.querySelector("#quality-structures");
const sideFilter = document.querySelector("#side-filter");
const musclesToggle = document.querySelector("#muscles-toggle");
const bonesToggle = document.querySelector("#bones-toggle");
const resetButton = document.querySelector("#reset-view");
const focusButton = document.querySelector("#focus-selected-quality");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdedbd4);

const camera = new THREE.PerspectiveCamera(36, 1, 0.001, 100);
camera.position.set(0, 0.4, 2.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
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

scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.15));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(3, 5, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 1.1);
fill.position.set(-4, 1, -3);
scene.add(fill);

const root = new THREE.Group();
scene.add(root);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const activePointers = new Map();
let tapBlocked = false;

let atlas = null;
let selectedParts = [];
let visibleMeshes = [];
let selectedMesh = null;
let totalDownloaded = 0;

function sourceUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return SOURCE_ROOT + (path.startsWith("/") ? path : "/" + path);
}

function sideOf(name) {
  const n = String(name).toLowerCase();
  if (/\bright\b/.test(n)) return "right";
  if (/\bleft\b/.test(n)) return "left";
  return "midline";
}

function classify(part) {
  if (part.system === "muscular" && MUSCLE_RE.test(part.name)) return "muscle";
  if (part.system === "skeletal" && BONE_RE.test(part.name)) return "bone";
  return null;
}

function partWanted(part) {
  return Boolean(classify(part));
}

async function fetchBuffer(chunk) {
  const canInflate = typeof DecompressionStream !== "undefined";
  const path = canInflate && chunk.gzip ? chunk.gzip : chunk.url;
  const response = await fetch(sourceUrl(path));
  if (!response.ok) throw new Error("Не удалось загрузить часть геометрии.");

  let payload = await response.arrayBuffer();
  totalDownloaded += payload.byteLength;

  if (canInflate && chunk.gzip) {
    const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
    const isGzip = sig[0] === 0x1f && sig[1] === 0x8b;
    if (isGzip) {
      payload = await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))
      ).arrayBuffer();
    }
  }

  if (payload.byteLength !== chunk.bytes) {
    throw new Error(
      "Неполная геометрия: ожидалось " + chunk.bytes +
      " байт, получено " + payload.byteLength + "."
    );
  }

  return payload;
}

function geometryForPart(part, buffer) {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(
    buffer,
    part.positions,
    part.vertexCount * 3
  );
  const normals = new Int16Array(
    buffer,
    part.normals,
    part.vertexCount * 3
  );
  const indices = new Uint32Array(
    buffer,
    part.indices,
    part.indexCount
  );

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(normals, 3, true)
  );
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();

  return geometry;
}

function materialFor(kind) {
  return new THREE.MeshStandardMaterial({
    color: kind === "bone" ? 0xe5d5ad : 0xa95d58,
    roughness: kind === "bone" ? 0.76 : 0.58,
    metalness: 0,
    transparent: kind === "bone",
    opacity: kind === "bone" ? 0.76 : 1,
    side: THREE.DoubleSide,
  });
}

function clearSelection() {
  if (!selectedMesh) return;
  if (selectedMesh.material.emissive) selectedMesh.material.emissive.setHex(0x000000);
  selectedMesh.material.emissiveIntensity = 0;
  selectedMesh = null;
}

function selectMesh(mesh) {
  clearSelection();
  selectedMesh = mesh;
  if (mesh.material.emissive) mesh.material.emissive.setHex(0x174a64);
  mesh.material.emissiveIntensity = 0.75;

  const part = mesh.userData.part;
  const triangles = Math.floor(part.indexCount / 3);
  selectedEl.textContent = part.name;
  metaEl.textContent =
    (part.system === "muscular" ? "Мышца" : "Кость") +
    " · representation ID: " + part.id +
    " · FMA/concept: " + (part.conceptId || "—") +
    " · " + triangles.toLocaleString("ru-RU") + " треугольников.";
  focusButton.disabled = false;
}

function visibleBox() {
  const box = new THREE.Box3().makeEmpty();
  for (const mesh of visibleMeshes) {
    if (mesh.visible) box.expandByObject(mesh);
  }
  return box;
}

function focusBox(box, padding = 1.22) {
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const fitH = size.y / (2 * Math.tan(vfov / 2));
  const fitW = size.x / (2 * Math.tan(vfov / 2) * Math.max(camera.aspect, 0.2));
  const distance = Math.max(fitH, fitW, size.z * 1.3, 0.04) * padding;
  let direction = camera.position.clone().sub(controls.target);
  if (direction.lengthSq() < 1e-8) direction = new THREE.Vector3(0.32, 0.08, 1);
  direction.normalize();

  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  controls.minDistance = Math.max(Math.max(size.x, size.y, size.z) * 0.045, 0.02);
  controls.maxDistance = Math.max(distance * 5, 2);
  controls.update();
}

function resetView() {
  const box = visibleBox();
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const distance = Math.max(
    size.y / (2 * Math.tan(vfov / 2)),
    size.x / (2 * Math.tan(vfov / 2) * Math.max(camera.aspect, 0.2)),
    size.z * 1.4
  ) * 1.22;

  controls.target.copy(center);
  camera.position.copy(center).add(
    new THREE.Vector3(0.32, 0.08, 1).normalize().multiplyScalar(distance)
  );
  controls.minDistance = Math.max(Math.max(size.x, size.y, size.z) * 0.045, 0.02);
  controls.maxDistance = Math.max(distance * 5, 2);
  controls.update();
}

function applyFilters() {
  const side = sideFilter.value;
  clearSelection();
  focusButton.disabled = true;

  for (const mesh of visibleMeshes) {
    const kind = mesh.userData.kind;
    const partSide = mesh.userData.side;
    const kindVisible =
      (kind === "muscle" && musclesToggle.checked) ||
      (kind === "bone" && bonesToggle.checked);
    const sideVisible =
      side === "both" ||
      partSide === "midline" ||
      partSide === side;

    mesh.visible = kindVisible && sideVisible;
  }

  resetView();
}

async function loadAtlas() {
  const response = await fetch(ATLAS_URL);
  if (!response.ok) throw new Error("Не удалось получить каталог BodyParts3D.");
  atlas = await response.json();

  selectedParts = atlas.parts.filter(partWanted);

  const chunkIds = [...new Set(selectedParts.map((part) => part.chunk))].sort(
    (a, b) => a - b
  );

  loadingEl.textContent =
    "Найдено " + selectedParts.length +
    " структур. Загружаю " + chunkIds.length + " блоков геометрии…";

  let loadedChunks = 0;
  for (const chunkId of chunkIds) {
    const chunk = atlas.chunks[chunkId];
    const buffer = await fetchBuffer(chunk);
    const parts = selectedParts.filter((part) => part.chunk === chunkId);

    for (const part of parts) {
      const kind = classify(part);
      const geometry = geometryForPart(part, buffer);
      const material = materialFor(kind);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.userData.part = part;
      mesh.userData.kind = kind;
      mesh.userData.side = sideOf(part.name);
      mesh.name = part.name;
      root.add(mesh);
      visibleMeshes.push(mesh);
    }

    loadedChunks += 1;
    loadingEl.textContent =
      "Геометрия: " + loadedChunks + " из " + chunkIds.length + " блоков…";
    await new Promise(requestAnimationFrame);
  }

  const muscleCount = visibleMeshes.filter((m) => m.userData.kind === "muscle").length;
  const boneCount = visibleMeshes.filter((m) => m.userData.kind === "bone").length;
  const triangles = selectedParts.reduce(
    (sum, part) => sum + Math.floor(part.indexCount / 3),
    0
  );

  statsEl.textContent =
    "Версия: " + atlas.version +
    ". Найдено структур: " + visibleMeshes.length +
    " (" + muscleCount + " мышечных, " + boneCount + " костных). " +
    "Треугольников в выбранном регионе: " +
    triangles.toLocaleString("ru-RU") +
    ". По сети загружено около " +
    (totalDownloaded / 1024 / 1024).toFixed(1) + " МБ.";

  structuresEl.textContent = visibleMeshes
    .map((mesh) => (mesh.userData.kind === "muscle" ? "М · " : "К · ") + mesh.name)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

  loadingEl.classList.add("is-hidden");
  applyFilters();
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
  if (!validTap) return;

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster
    .intersectObjects(visibleMeshes.filter((mesh) => mesh.visible), false)[0];

  if (hit) selectMesh(hit.object);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  renderer.setPixelRatio(Math.min(devicePixelRatio, width < 768 ? 1.5 : 2));
  const ratio = renderer.getPixelRatio();

  if (
    canvas.width !== Math.floor(width * ratio) ||
    canvas.height !== Math.floor(height * ratio)
  ) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

sideFilter.addEventListener("change", applyFilters);
musclesToggle.addEventListener("change", applyFilters);
bonesToggle.addEventListener("change", applyFilters);
resetButton.addEventListener("click", resetView);
focusButton.addEventListener("click", () => {
  if (!selectedMesh) return;
  focusBox(new THREE.Box3().setFromObject(selectedMesh), 1.65);
});

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", (event) => {
  activePointers.delete(event.pointerId);
  tapBlocked = true;
});

canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  loadingEl.classList.remove("is-hidden");
  loadingEl.textContent =
    "3D-сессия была приостановлена устройством. Обновите страницу.";
});

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
loadAtlas().catch((error) => {
  console.error(error);
  loadingEl.textContent = "Ошибка загрузки: " + String(error?.message || error);
  statsEl.textContent =
    "Высокодетализированный источник не загрузился. Основной тренажёр при этом не затронут.";
});
