import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { structureTerm, structureSearchText } from "./anatomy-terms-ru.js";

const SOURCE_ROOT =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public";
const ATLAS_URL = SOURCE_ROOT + "/models/atlas.json";

const canvas = document.querySelector("#fullbody-canvas");
const loadingEl = document.querySelector("#fullbody-loading");
const progressBar = document.querySelector("#progress-bar");
const progressText = document.querySelector("#progress-text");
const searchInput = document.querySelector("#structure-search");
const searchResults = document.querySelector("#search-results");
const selectedName = document.querySelector("#selected-name");
const selectedSource = document.querySelector("#selected-source");
const focusSelectedButton = document.querySelector("#focus-selected");
const isolateSelectedButton = document.querySelector("#isolate-selected");
const showAllButton = document.querySelector("#show-all");
const musclesToggle = document.querySelector("#muscles-toggle");
const bonesToggle = document.querySelector("#bones-toggle");
const boneOpacity = document.querySelector("#bone-opacity");
const viewFront = document.querySelector("#view-front");
const viewBack = document.querySelector("#view-back");
const viewThreeQuarter = document.querySelector("#view-three-quarter");
const resetViewButton = document.querySelector("#reset-view");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdedbd4);

const camera = new THREE.PerspectiveCamera(36, 1, 0.001, 100);
camera.position.set(0.55, 0.85, 3.3);

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
controls.maxPolarAngle = Math.PI * 0.98;

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
let relevantParts = [];
let partMeshes = [];
let renderedMeshes = [];
let selectedIndex = -1;
let isolated = false;
let fullBox = new THREE.Box3();
let totalBytes = 0;

const muscleMaterial = new THREE.MeshStandardMaterial({
  color: 0xa95d58,
  roughness: 0.58,
  metalness: 0,
  side: THREE.DoubleSide,
});
const boneMaterial = new THREE.MeshStandardMaterial({
  color: 0xe5d5ad,
  roughness: 0.76,
  metalness: 0,
  transparent: true,
  opacity: Number(boneOpacity.value),
  side: THREE.DoubleSide,
});

function sourceUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return SOURCE_ROOT + (path.startsWith("/") ? path : "/" + path);
}

function isRelevant(part) {
  return part.system === "muscular" || part.system === "skeletal";
}

async function decodeChunk(chunk) {
  const canInflate = typeof DecompressionStream !== "undefined";
  const path = canInflate && chunk.gzip ? chunk.gzip : chunk.url;
  const response = await fetch(sourceUrl(path));
  if (!response.ok) throw new Error("Не удалось загрузить блок анатомической геометрии.");

  let payload = await response.arrayBuffer();
  totalBytes += payload.byteLength;

  if (canInflate && chunk.gzip) {
    const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
    if (sig[0] === 0x1f && sig[1] === 0x8b) {
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

function geometryForPart(part, buffer) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true)
  );
  geometry.setIndex(
    new THREE.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1)
  );
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(part.bounds[0]),
    new THREE.Vector3().fromArray(part.bounds[1])
  );
  geometry.computeBoundingSphere();
  return geometry;
}

function setProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + "%";
  progressText.textContent =
    `${pct}% · ${done} из ${total} блоков · ${(totalBytes / 1024 / 1024).toFixed(1)} МБ по сети`;
  loadingEl.textContent =
    `Загружаю полнотелую модель: ${pct}%`;
}

function displayName(part) {
  const term = structureTerm(part.name);
  return term.nameRu === part.name ? part.name : term.nameRu;
}

function detailName(part) {
  const term = structureTerm(part.name);
  const bits = [term.latin, part.name].filter(Boolean);
  return bits.join(" · ");
}

function clearSelection() {
  if (selectedIndex < 0) return;
  const mesh = partMeshes[selectedIndex];
  if (mesh?.material?.emissive) {
    mesh.material.emissive.setHex(0x000000);
    mesh.material.emissiveIntensity = 0;
  }
}

function selectPart(index, focus = false) {
  if (index < 0 || !relevantParts[index]) return;
  clearSelection();
  selectedIndex = index;

  const mesh = partMeshes[index];
  if (mesh?.material?.emissive) {
    mesh.material.emissive.setHex(0x245da8);
    mesh.material.emissiveIntensity = 0.45;
  }

  const part = relevantParts[index];
  selectedName.textContent = displayName(part);
  selectedSource.textContent = detailName(part) || part.name;
  focusSelectedButton.disabled = false;
  isolateSelectedButton.disabled = false;

  if (focus) focusSelected();
}

function visibleByLayer(part) {
  if (part.system === "muscular") return musclesToggle.checked;
  if (part.system === "skeletal") return bonesToggle.checked;
  return false;
}

function applyVisibility() {
  for (let i = 0; i < relevantParts.length; i += 1) {
    const mesh = partMeshes[i];
    if (!mesh) continue;
    const selected = i === selectedIndex;
    mesh.visible = isolated ? selected : visibleByLayer(relevantParts[i]);
  }
}

function focusBox(box, padding = 1.18, direction = null) {
  if (!box || box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const fitH = size.y / (2 * Math.tan(vfov / 2));
  const fitW = size.x / (2 * Math.tan(vfov / 2) * Math.max(camera.aspect, 0.2));
  const distance = Math.max(fitH, fitW, size.z * 1.25, 0.04) * padding;

  const dir = direction || camera.position.clone().sub(controls.target).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(dir, distance);
  controls.update();
}

function setWholeBodyView(direction = new THREE.Vector3(0.32, 0.04, 1).normalize()) {
  focusBox(fullBox, 1.14, direction);
}

function focusSelected() {
  if (selectedIndex < 0) return;
  const mesh = partMeshes[selectedIndex];
  if (!mesh) return;
  focusBox(new THREE.Box3().setFromObject(mesh), 1.65);
}

function renderSearch(query) {
  searchResults.replaceChildren();
  const q = query.trim().toLocaleLowerCase("ru-RU");
  if (q.length < 2) return;

  const matches = [];
  for (let i = 0; i < relevantParts.length && matches.length < 14; i += 1) {
    const part = relevantParts[i];
    const haystack = structureSearchText(part.name);
    if (haystack.includes(q) || part.name.toLowerCase().includes(q)) matches.push(i);
  }

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "Совпадений не найдено.";
    searchResults.appendChild(empty);
    return;
  }

  for (const index of matches) {
    const part = relevantParts[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = displayName(part);
    button.addEventListener("click", () => {
      if (isolated) {
        isolated = false;
        isolateSelectedButton.textContent = "Изолировать";
      }
      selectPart(index, true);
      applyVisibility();
      searchInput.value = displayName(part);
      searchResults.replaceChildren();
    });
    searchResults.appendChild(button);
  }
}

async function loadAtlas() {
  const response = await fetch(ATLAS_URL);
  if (!response.ok) throw new Error("Не удалось получить каталог BodyParts3D 4.0.");
  atlas = await response.json();

  relevantParts = atlas.parts.filter(isRelevant);
  partMeshes = new Array(relevantParts.length);

  const originalIndex = new Map(relevantParts.map((part, index) => [part.id, index]));
  const chunkIds = [...new Set(relevantParts.map((part) => part.chunk))].sort((a, b) => a - b);

  progressText.textContent =
    `${relevantParts.length.toLocaleString("ru-RU")} мышечных и костных структур · ${chunkIds.length} блоков геометрии`;

  let cursor = 0;
  let done = 0;

  const loadChunk = async (chunkId) => {
    const chunk = atlas.chunks[chunkId];
    const buffer = await decodeChunk(chunk);
    const parts = relevantParts.filter((part) => part.chunk === chunkId);

    for (const part of parts) {
      const geometry = geometryForPart(part, buffer);
      const material = (part.system === "muscular" ? muscleMaterial : boneMaterial).clone();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.part = part;
      mesh.userData.index = originalIndex.get(part.id);
      root.add(mesh);
      renderedMeshes.push(mesh);
      partMeshes[mesh.userData.index] = mesh;
    }

    done += 1;
    setProgress(done, chunkIds.length);
    await new Promise(requestAnimationFrame);
  };

  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (cursor < chunkIds.length) {
        const id = chunkIds[cursor];
        cursor += 1;
        await loadChunk(id);
      }
    })
  );

  fullBox = new THREE.Box3().setFromObject(root);
  setWholeBodyView();

  loadingEl.classList.add("is-hidden");
  progressBar.style.width = "100%";
  progressText.textContent =
    `Готово: ${relevantParts.length.toLocaleString("ru-RU")} структур · ${(totalBytes / 1024 / 1024).toFixed(1)} МБ по сети`;
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
  if (!validTap || !renderedMeshes.length) return;

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const visible = renderedMeshes.filter((mesh) => mesh.visible);
  const hits = raycaster.intersectObjects(visible, false);
  if (!hits.length) return;

  const index = hits[0].object.userData.index;
  selectPart(index);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
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

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

searchInput.addEventListener("input", () => renderSearch(searchInput.value));
musclesToggle.addEventListener("change", applyVisibility);
bonesToggle.addEventListener("change", applyVisibility);
boneOpacity.addEventListener("input", () => {
  for (const mesh of renderedMeshes) {
    if (mesh.userData.part?.system === "skeletal") {
      mesh.material.opacity = Number(boneOpacity.value);
      mesh.material.needsUpdate = true;
    }
  }
});

focusSelectedButton.addEventListener("click", focusSelected);
isolateSelectedButton.addEventListener("click", () => {
  if (selectedIndex < 0) return;
  isolated = !isolated;
  isolateSelectedButton.textContent = isolated ? "Показать окружение" : "Изолировать";
  applyVisibility();
  if (isolated) focusSelected();
});
showAllButton.addEventListener("click", () => {
  isolated = false;
  isolateSelectedButton.textContent = "Изолировать";
  applyVisibility();
  setWholeBodyView();
});

viewFront.addEventListener("click", () => setWholeBodyView(new THREE.Vector3(0, 0.02, 1).normalize()));
viewBack.addEventListener("click", () => setWholeBodyView(new THREE.Vector3(0, 0.02, -1).normalize()));
viewThreeQuarter.addEventListener("click", () => setWholeBodyView(new THREE.Vector3(0.32, 0.04, 1).normalize()));
resetViewButton.addEventListener("click", () => setWholeBodyView());

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", (event) => {
  activePointers.delete(event.pointerId);
  tapBlocked = true;
});

animate();
loadAtlas().catch((error) => {
  console.error(error);
  loadingEl.textContent = "Не удалось загрузить полнотелую модель.";
  progressText.textContent = String(error?.message || error);
});
