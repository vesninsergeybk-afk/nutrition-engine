import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);

const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const app = read("app.js");
const accountClient = read("account-client.js");
const index = read("index.html");
const qualityApp = read("quality-lab.js");
const qualityHtml = read("quality-lab.html");
const manifest = JSON.parse(read("anatomy-validation-shoulder.json"));

const errors = [];

function htmlIds(source) {
  return new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

function queriedIds(source) {
  return new Set(
    [...source.matchAll(/querySelector\("#([^"]+)"\)/g)].map((m) => m[1])
  );
}

function checkDom(js, html, label) {
  const ids = htmlIds(html);
  for (const id of queriedIds(js)) {
    if (!ids.has(id)) errors.push(`${label}: missing DOM id #${id}`);
  }
}

checkDom(app, index, "main");
checkDom(accountClient, index, "account-client");
checkDom(qualityApp, qualityHtml, "quality-lab");

for (const id of [
  "account-button",
  "account-dialog",
  "account-login-form",
  "account-register-form",
  "account-consent-form",
  "account-recovery-form",
  "account-reset-form",
  "account-consent-link",
  "account-privacy-link",
  "overall-progress",
  "review-all-mistakes",
]) {
  if (!htmlIds(index).has(id)) errors.push("account/progress UI: missing #" + id);
}

const registerFormMatch = index.match(/<form id="account-register-form"[\s\S]*?<\/form>/);
const consentFormMatch = index.match(/<form id="account-consent-form"[\s\S]*?<\/form>/);
if (!consentFormMatch?.[0]?.includes('name="consent" type="checkbox" required')) {
  errors.push("account UI: separate explicit personal-data consent form is missing");
}
if (registerFormMatch?.[0]?.includes('name="consent"')) {
  errors.push("account UI: consent must not be embedded in the registration form");
}
if (!index.includes('name="email" type="email"')) {
  errors.push("account UI: recovery email field is missing");
}
if (!accountClient.includes('/\\.pages\\.dev$/i.test(location.hostname)')) {
  errors.push("account client: Cloudflare Pages registration safety gate is missing");
}
if (!accountClient.includes('localhost|127\\.0\\.0\\.1')) {
  errors.push("account client: local static-preview safety gate is missing");
}
if (!accountClient.includes('"/api/account/register"')) {
  errors.push("account client: registration endpoint is not wired");
}
if (!accountClient.includes('"/api/account/request-password-reset"')) {
  errors.push("account client: password recovery endpoint is not wired");
}
if (!accountClient.includes('credentials:"include"')) {
  errors.push("account client: protected cookie credentials are not enabled");
}
if (/TOKEN_KEY|muscle-memory-account-token-v1/.test(accountClient)) {
  errors.push("account client: browser session token must not be persisted in localStorage");
}
if (!app.includes('reviewAllMistakesButton')) {
  errors.push("main app: global mistake-review action is not wired");
}
if (!app.includes('renderOverallProgress')) {
  errors.push("main app: overall progress surface is not wired");
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
