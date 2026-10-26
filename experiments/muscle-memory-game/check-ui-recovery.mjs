import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = new URL("./", import.meta.url);
const [html, css, app, boot] = await Promise.all([
  "index.html", "ui-polish.css", "app.js", "boot-feedback.js",
].map(file => readFile(new URL(file, root), "utf8")));

for (const id of [
  "loading", "loading-recovery", "loading-recovery-title",
  "loading-recovery-message", "loading-retry", "loading-alternate", "model-source",
]) {
  assert(html.includes(`id="${id}"`), `Missing loading recovery UI: ${id}`);
}
assert(html.includes('<script src="./boot-feedback.js"></script>'), "Fallback must load independently of the ES module");
assert(/id="region-isolation-field"[^>]*hidden/.test(html), "Legacy area-isolation checkbox must stay hidden while the model loads");
assert(css.includes(".panel .scope-controls") && css.includes("grid-template-columns: minmax(0, 1fr)"), "Sidebar scope controls must fit their own width");
assert(app.includes('document.dispatchEvent(new Event("atlas:model-failed"))'), "Model errors must open recovery controls");
assert(app.includes('document.dispatchEvent(new Event("atlas:model-ready"))'), "Successful loading must close recovery controls");
assert(app.includes('event.key === "ArrowDown"') && app.includes('event.key === "ArrowUp"'), "Search results must support keyboard navigation");

const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    const listeners = new Map();
    nodes.set(id, {
      hidden: id === "loading-recovery" || id === "loading-alternate",
      dataset: {},
      textContent: "",
      value: id === "model-source" ? "z-anatomy" : "",
      listeners,
      classList: { contains: () => false },
      addEventListener(type, cb) { listeners.set(type, cb); },
      dispatchEvent(event) { listeners.get(event.type)?.(event); },
    });
  }
  return nodes.get(id);
}
const documentListeners = new Map();
const timeouts = new Map();
let timeoutId = 0;
let reloadCount = 0;
const context = {
  document: {
    querySelector(selector) { return node(selector.slice(1)); },
    addEventListener(type, cb) { documentListeners.set(type, cb); },
  },
  window: { location: { reload() { reloadCount++; } } },
  Event: class { constructor(type) { this.type = type; } },
  setTimeout(cb) { const id = ++timeoutId; timeouts.set(id, cb); return id; },
  clearTimeout(id) { timeouts.delete(id); },
};
function signal(type) { documentListeners.get(type)?.(); }
function el(id) { return node(id); }
function elClick(id) { el(id).listeners.get("click")?.(); }
function runLatestTimeout() {
  const entry = [...timeouts].at(-1);
  assert(entry, "No scheduled loading timeout");
  timeouts.delete(entry[0]);
  entry[1]();
}

runInNewContext(boot, context, { filename: "boot-feedback.js" });
assert(el("loading-recovery").hidden, "Recovery should not cover initial loading");
runLatestTimeout();
assert(!el("loading-recovery").hidden && el("loading-alternate").hidden, "When ES modules fail, recovery must offer reload without inert switching");
signal("atlas:model-loading");
assert(el("loading-recovery").hidden, "Starting a model load must clear stale messages");
runLatestTimeout();
assert(!el("loading-recovery").hidden && /дольше/.test(el("loading-recovery-title").textContent), "Slow model loading needs helpful feedback");
signal("atlas:model-failed");
assert(!el("loading-alternate").hidden && el("loading-recovery").dataset.state === "error", "Failed model must offer a second source");
let modelChangeEvents = 0;
el("model-source").listeners.set("change", () => modelChangeEvents++);
elClick("loading-alternate");
assert(el("model-source").value === "bodyparts4" && modelChangeEvents === 1, "Alternate-source button must actually request the second model");
signal("atlas:model-loading");
signal("atlas:model-ready");
assert(el("loading-recovery").hidden && timeouts.size === 0, "Successful model loading must hide stale error and cancel timer");
elClick("loading-retry");
assert(reloadCount === 1, "Reload button must reload the page");

console.log("UI recovery: delayed load, module failure, alternate model, success, reload and narrow sidebar contract ok");
