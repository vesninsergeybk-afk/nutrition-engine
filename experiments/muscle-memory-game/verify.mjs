import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);

const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const app = read("app.js");
const index = read("index.html");
const qualityApp = read("quality-lab.js");
const qualityHtml = read("quality-lab.html");
const manifest = JSON.parse(read("anatomy-validation-shoulder.json"));

const errors = [];

const rawIds = [...index.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
if (new Set(rawIds).size !== rawIds.length) {
  errors.push("main: duplicate HTML ids are not allowed");
}

function htmlIds(source) {
  return new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

function queriedIds(source) {
  return new Set(
    [...source.matchAll(/querySelector\("#([^"]+)"\)/g)].map((m) => m[1])
  );
}

function checkDom(js, html, label, optionalIds = new Set()) {
  const ids = htmlIds(html);
  for (const id of queriedIds(js)) {
    if (!ids.has(id) && !optionalIds.has(id)) errors.push(`${label}: missing DOM id #${id}`);
  }
}

// The static release intentionally omits controls of the disabled motion lab.
// Keep all other HTML/JS references strict; do not hide a real DOM regression.
const motionDisabled =
  /id="mode-motion"[^>]*hidden[^>]*disabled/.test(index) &&
  app.includes("const MOTION_UI_ENABLED = false");
const staticMotionIds = new Set(["motion-angle", "motion-angle-value", "motion-play"]);
checkDom(app, index, "main", motionDisabled ? staticMotionIds : new Set());
checkDom(qualityApp, qualityHtml, "quality-lab");

const productRefresh = read("product-refresh.css");
for (const requiredId of [
  "mobile-reference-open", "mobile-reference-close", "mobile-muscle-latin",
  "mobile-muscle-summary", "mobile-muscle-primary", "mobile-muscle-more",
  "mobile-quick-practice", "exit-learning-session",
]) {
  if (!htmlIds(index).has(requiredId)) errors.push("mobile reference: missing #" + requiredId);
}
if (!index.includes('href="./product-refresh.css"') ||
    !productRefresh.includes("body.mobile-reference-open") ||
    !productRefresh.includes("body.training-layout")) {
  errors.push("mobile product refresh: stylesheet or responsive layout missing");
}
if (!app.includes('stageEl.append(questionCardEl)') ||
    !app.includes('panelEl.prepend(questionCardEl)') ||
    !app.includes('document.body.classList.toggle("training-layout", dockInStage)')) {
  errors.push("training: question card must move between a mobile stage and desktop panel");
}
if (!app.includes('document.body.classList.toggle("mobile-reference-open", mobileReferenceExpanded)')) {
  errors.push("mobile reference: expanded state must be synchronized with the UI");
}

const reference3d = app.slice(
  app.indexOf("function appendReference3DGallerySlide"),
  app.indexOf("// Reference gallery deploy marker")
);
if (!reference3d.includes("mobileTaskMedia.matches && !mobileReferenceExpanded")) {
  errors.push("reference 3D: hidden mobile sheet must not allocate its own WebGL renderer");
}
if (!app.includes("targetOverride ? [targetOverride] : availableTargets")) {
  errors.push("training: one-muscle practice must use the actual selected target");
}
if (!app.includes('mobileQuickPracticeButton?.addEventListener("click"')) {
  errors.push("mobile card: quick practice action not wired");
}
const sessionEnding = app.slice(
  app.indexOf("function finishLearningSession"),
  app.indexOf("function recordFindMistake")
);
if (!sessionEnding.includes("exitLearningSessionButton.hidden = false")) {
  errors.push("training: completed mobile session must keep a visible exit");
}
if (!productRefresh.includes("clamp(240px, 46dvh, 440px)")) {
  errors.push("mobile card: model must reserve vertical space for study actions");
}


for (const [label, source] of [
  ["main app", app],
  ["quality lab", qualityApp],
]) {
  if (/raw\.githubusercontent\.com\/[^\n"']+\/main\//.test(source)) {
    errors.push(`${label}: external anatomy asset points to floating main branch`);
  }
}

if (/high[- ]?detail|высокодетализ/i.test(qualityHtml)) {
  errors.push("quality-lab: unsupported high-detail claim returned to UI");
}

const structures = Array.isArray(manifest.structures) ? manifest.structures : [];
const verified = structures.filter((s) => s.status === "verified_for_teaching");

if (!manifest.audit_status) {
  errors.push("manifest: audit_status missing");
} else {
  if (manifest.audit_status.total_structures !== structures.length) {
    errors.push("manifest: total_structures does not match structures[]");
  }
  if (manifest.audit_status.verified_for_teaching !== verified.length) {
    errors.push("manifest: verified_for_teaching count does not match structures[]");
  }
}

for (const item of verified) {
  if (
    item.terminology_review !== "verified" ||
    item.geometry_review !== "verified" ||
    item.relation_review !== "verified"
  ) {
    errors.push(
      `manifest: ${item.canonical_key} is teaching-verified before all review gates are verified`
    );
  }
}

const zPin = "37e85dfbbb398e11ba33c8f0e411f06f9bba592f";
const humanPin = "1c38bf35c254a891200d3cedecfd57abebe83d8d";

if (!app.includes(zPin)) errors.push("main app: expected pinned anatomy revision missing");
if (!qualityApp.includes(humanPin)) errors.push("quality-lab: expected pinned Human Atlas revision missing");

if (manifest.policy?.candidate_primary_geometry) {
  errors.push("manifest: obsolete candidate_primary_geometry key returned");
}

if (errors.length) {
  console.error("Muscle-memory integrity check failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}

console.log(
  `OK: ${structures.length} shoulder structures tracked; ${verified.length} verified_for_teaching; anatomy assets pinned.`
);
