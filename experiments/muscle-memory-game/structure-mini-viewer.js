import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// On-demand viewer: reuse the selected geometry, render only on interaction.
export function mountStructureMiniViewer(stage, meshes, label) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "3D-модель: " + label);
  stage.replaceChildren(canvas);
  let renderer;
  try {renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: "low-power"});}
  catch {
    meshes.forEach(mesh => {mesh.geometry.dispose(); mesh.material.dispose();});
    stage.textContent = "Этот браузер не смог открыть дополнительный 3D-вид. Структуру можно рассмотреть на основной модели.";
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xeaf0f6);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8293a5, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 2.5); light.position.set(3, 4, 5); scene.add(light);
  const group = new THREE.Group(); meshes.forEach(mesh => group.add(mesh)); scene.add(group);
  const box = new THREE.Box3().setFromObject(group);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = Math.max(...box.getSize(new THREE.Vector3()).toArray(), .001);
  const camera = new THREE.PerspectiveCamera(35, 1, radius / 1000, radius * 100);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = false;
  controls.minDistance = radius * .25; controls.maxDistance = radius * 8;
  const reset = () => {
    controls.target.copy(centre);
    camera.position.copy(centre).add(new THREE.Vector3(.35, .12, 1).normalize().multiplyScalar(radius * 2.25));
    controls.update();
  };
  const render = () => {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const resetButton = document.createElement("button"); resetButton.type = "button";
  resetButton.textContent = "Сбросить ракурс"; resetButton.addEventListener("click", () => {reset(); render();}); stage.append(resetButton);
  controls.addEventListener("change", render);
  const observer = new ResizeObserver(render); observer.observe(stage);
  reset(); render();
  return () => {
    observer.disconnect(); controls.removeEventListener("change", render); controls.dispose();
    meshes.forEach(mesh => {mesh.geometry.dispose(); mesh.material.dispose();});
    renderer.dispose(); renderer.forceContextLoss(); stage.replaceChildren();
  };
}
