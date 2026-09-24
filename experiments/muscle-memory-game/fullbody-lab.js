import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { structureTerm, structureSearchText } from "./anatomy-terms-ru.js";
import { bodyPartsAnatomyKind } from "./bodyparts4-classification.js";

const SOURCE_ROOT =
  "https://raw.githubusercontent.com/ashemag/human-atlas/1c38bf35c254a891200d3cedecfd57abebe83d8d/public";
const ATLAS_URL = SOURCE_ROOT + "/models/atlas.json";

const canvas = document.querySelector("#fullbody-canvas");
const loadingEl = document.querySelector("#fullbody-loading");
const searchInput = document.querySelector("#fullbody-search");
const resultsEl = document.querySelector("#fullbody-results");
const musclesToggle = document.querySelector("#muscles-toggle");
const bonesToggle = document.querySelector("#bones-toggle");
const selectedNameEl = document.querySelector("#selected-name");
const selectedSourceEl = document.querySelector("#selected-source");
const focusSelectedButton = document.querySelector("#focus-selected");
const statusEl = document.querySelector("#fullbody-status");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdedbd4);

const root = new THREE.Group();
scene.add(root);

const camera = new THREE.PerspectiveCamera(36, 1, 0.001, 100);
camera.position.set(0, 0.3, 2.4);

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
const fill = new THREE.DirectionalLight(0xffffff, 1.05);
fill.position.set(-4, 1, -3);
scene.add(fill);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const activePointers = new Map();

let tapBlocked = false;
let atlas = null;
let selectedParts = [];
let chunkMeshes = [];
let structureIndex = [];
let selectedId = null;
let selectedRange = null;

function sourceUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return SOURCE_ROOT + (path.startsWith("/") ? path : "/" + path);
}

function kindOf(part) {
  return bodyPartsAnatomyKind(part);
}

async function fetchBuffer(chunk) {
  const canInflate = typeof DecompressionStream !== "undefined";
  const path = canInflate && chunk.gzip ? chunk.gzip : chunk.url;
  const response = await fetch(sourceUrl(path));
  if (!response.ok) throw new Error("Не удалось загрузить блок геометрии.");

  let payload = await response.arrayBuffer();
  if (canInflate && chunk.gzip) {
    const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
    if (sig[0] === 0x1f && sig[1] === 0x8b) {
      payload = await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))
      ).arrayBuffer();
    }
  }

  if (payload.byteLength !== chunk.bytes) {
    throw new Error("Получен неполный блок геометрии.");
  }
  return payload;
}

function geometryForPart(part, buffer, sid, color) {
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

  geometry.setAttribute(
    "structureId",
    new THREE.BufferAttribute(new Float32Array(part.vertexCount).fill(sid), 1)
  );

  const colors = new Float32Array(part.vertexCount * 3);
  for (let i = 0; i < part.vertexCount; i += 1) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function materialFor(kind) {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: kind === "bone" ? 0.76 : 0.58,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });
}

function resetView(direction = new THREE.Vector3(0.28, 0.03, 1).normalize()) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const fitHeight = size.y / (2 * Math.tan(verticalFov / 2));
  const fitWidth = size.x / (2 * Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.2));
  const distance = Math.max(fitHeight, fitWidth, size.z * 1.3) * 1.12;

  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.near = Math.max(distance / 5000, 0.001);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  controls.update();
}

function focusBox(box, padding = 1.55) {
  if (!box || box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const fitHeight = size.y / (2 * Math.tan(verticalFov / 2));
  const fitWidth = size.x / (2 * Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.2));
  const distance = Math.max(fitHeight, fitWidth, size.z * 1.2, 0.02) * padding;
  let direction = camera.position.clone().sub(controls.target);
  if (direction.lengthSq() < 1e-8) direction.set(0.28, 0.03, 1);
  direction.normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  controls.update();
}

function boxForStructure(sid) {
  const item = structureIndex[sid];
  if (!item) return new THREE.Box3();
  const box = new THREE.Box3().makeEmpty();
  const position = item.mesh.geometry.getAttribute("position");
  const structureId = item.mesh.geometry.getAttribute("structureId");
  const point = new THREE.Vector3();

  item.mesh.updateMatrixWorld(true);
  for (let i = 0; i < position.count; i += 1) {
    if (Math.round(structureId.getX(i)) !== sid) continue;
    point.fromBufferAttribute(position, i).applyMatrix4(item.mesh.matrixWorld);
    box.expandByPoint(point);
  }
  return box;
}

function displayName(part) {
  const term = structureTerm(part.name);
  return term.nameRu === part.name
    ? part.name
    : term.latin
      ? term.nameRu + " · " + term.latin
      : term.nameRu;
}

function selectStructure(sid) {
  const item = structureIndex[sid];
  if (!item) return;
  selectedId = sid;
  selectedNameEl.textContent = displayName(item.part);
  selectedSourceEl.textContent = item.part.name;
  focusSelectedButton.disabled = false;
}

function applyVisibility() {
  for (const mesh of chunkMeshes) {
    const kind = mesh.userData.kind;
    mesh.visible =
      (kind === "muscle" && musclesToggle.checked) ||
      (kind === "bone" && bonesToggle.checked);
  }
}

function renderSearch(query) {
  resultsEl.replaceChildren();
  const q = query.trim().toLocaleLowerCase("ru-RU");
  if (q.length < 2) return;

  const matches = [];
  for (let sid = 0; sid < structureIndex.length && matches.length < 14; sid += 1) {
    const item = structureIndex[sid];
    if (!item) continue;
    const haystack = (structureSearchText(item.part.name) + " " + item.part.name)
      .toLocaleLowerCase("ru-RU");
    if (haystack.includes(q)) matches.push(sid);
  }

  for (const sid of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = displayName(structureIndex[sid].part);
    button.addEventListener("click", () => {
      selectStructure(sid);
      focusBox(boxForStructure(sid));
      resultsEl.replaceChildren();
      searchInput.value = displayName(structureIndex[sid].part);
    });
    resultsEl.appendChild(button);
  }
}

async function loadAtlas() {
  const response = await fetch(ATLAS_URL);
  if (!response.ok) throw new Error("Не удалось получить каталог BodyParts3D.");
  atlas = await response.json();

  selectedParts = atlas.parts.filter((part) => kindOf(part));
  const chunkIds = [...new Set(selectedParts.map((part) => part.chunk))].sort((a, b) => a - b);

  let nextSid = 0;
  let triangles = 0;

  for (let chunkIndex = 0; chunkIndex < chunkIds.length; chunkIndex += 1) {
    const chunkId = chunkIds[chunkIndex];
    loadingEl.textContent =
      "Загружаю всё тело: блок " + (chunkIndex + 1) + " из " + chunkIds.length + "…";
    const buffer = await fetchBuffer(atlas.chunks[chunkId]);
    const parts = selectedParts.filter((part) => part.chunk === chunkId);

    for (const kind of ["muscle", "bone"]) {
      const kindParts = parts.filter((part) => kindOf(part) === kind);
      if (!kindParts.length) continue;

      const geometries = [];
      const pending = [];

      for (const part of kindParts) {
        const sid = nextSid++;
        const color = new THREE.Color(kind === "bone" ? 0xe5d5ad : 0xa95d58);
        const geometry = geometryForPart(part, buffer, sid, color);
        geometries.push(geometry);
        pending.push({ sid, part });
        triangles += Math.floor(part.indexCount / 3);
      }

      const merged = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!merged) continue;

      const mesh = new THREE.Mesh(merged, materialFor(kind));
      mesh.userData.kind = kind;
      root.add(mesh);
      chunkMeshes.push(mesh);

      for (const item of pending) {
        structureIndex[item.sid] = { part: item.part, mesh };
      }
    }

    await new Promise(requestAnimationFrame);
  }

  applyVisibility();
  resetView();
  loadingEl.classList.add("is-hidden");
  statusEl.textContent =
    "Загружено " + structureIndex.filter(Boolean).length +
    " мышечных и костных структур, " +
    triangles.toLocaleString("ru-RU") + " треугольников.";
}

function structureIdFromHit(hit) {
  if (!hit?.face) return null;
  const attr = hit.object.geometry.getAttribute("structureId");
  if (!attr) return null;
  return Math.round(attr.getX(hit.face.a));
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

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(chunkMeshes.filter((mesh) => mesh.visible), false);
  if (!hits.length) return;
  const sid = structureIdFromHit(hits[0]);
  if (sid != null) selectStructure(sid);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const pixelRatio = renderer.getPixelRatio();
  if (
    canvas.width !== Math.floor(width * pixelRatio) ||
    canvas.height !== Math.floor(height * pixelRatio)
  ) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

searchInput.addEventListener("input", () => renderSearch(searchInput.value));
musclesToggle.addEventListener("change", applyVisibility);
bonesToggle.addEventListener("change", applyVisibility);
focusSelectedButton.addEventListener("click", () => {
  if (selectedId != null) focusBox(boxForStructure(selectedId));
});
document.querySelector("#view-front").addEventListener("click", () => resetView(new THREE.Vector3(0, 0, 1)));
document.querySelector("#view-back").addEventListener("click", () => resetView(new THREE.Vector3(0, 0, -1)));
document.querySelector("#view-reset").addEventListener("click", () => resetView());

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("pointercancel", (event) => {
  activePointers.delete(event.pointerId);
  tapBlocked = true;
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
  loadingEl.textContent = "Не удалось загрузить полнотельную модель.";
  statusEl.textContent = String(error?.message || error);
});
