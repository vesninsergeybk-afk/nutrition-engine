import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = await readFile(new URL("index.html", import.meta.url), "utf8");
const app = await readFile(new URL("app.js", import.meta.url), "utf8");

assert(
  /id="mode-motion"[^>]*hidden[^>]*disabled/.test(html),
  "Motion mode must be hidden and disabled in the static release UI"
);
assert(
  app.includes("const MOTION_UI_ENABLED = false"),
  "Static release must explicitly disable Motion UI"
);
assert(
  app.includes('mode === "motion" && !MOTION_UI_ENABLED'),
  "setMode must guard disabled Motion UI"
);
assert(
  app.includes('params.get("mode") === "motion" && MOTION_UI_ENABLED'),
  "URL query must not reopen disabled Motion UI"
);

console.log("Static release: Motion UI is disabled without deleting experimental code");
