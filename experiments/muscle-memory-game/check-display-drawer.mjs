import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [app, css, html] = await Promise.all([
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("index.html", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  html.includes('id="display-panel-toggle"') &&
    html.includes('aria-controls="display-panel"') &&
    html.includes('id="display-panel" class="display-panel viewer-settings"'),
  "Display control must be a direct button connected to the side drawer"
);
assert(
  app.includes("function setDisplayPanelOpen(open)") &&
    app.includes('viewerWrap.classList.toggle("display-panel-open", next)') &&
    app.includes('displayPanelToggle?.addEventListener("click"'),
  "Display drawer open state is not connected to the viewer shell"
);
assert(
  css.includes("--display-panel-width: clamp(340px, 36vw, 410px)") &&
    css.includes("body:not(.motion-mode) .viewer-wrap.display-panel-open .comparison-pane-static") &&
    css.includes("left: var(--display-panel-width)") &&
    css.includes(".viewer-wrap.display-panel-open .viewer-tools"),
  "Desktop display controls must occupy the full-height side panel and shift the atlas"
);
assert(
  css.includes("height: 100%") &&
    css.includes("max-height: none") &&
    css.includes("overflow-y: auto"),
  "Display panel can collapse or be clipped instead of filling the viewer height"
);
assert(
  !css.includes(".viewer-settings[open] .viewer-settings-menu") &&
    !css.includes("body.display-drawer-open"),
  "Legacy disclosure drawer CSS still conflicts with the current display panel"
);
assert(
  /overflow-y:\s*auto/.test(css) &&
    css.includes(".display-section"),
  "Display drawer must remain scrollable when many layer controls are visible"
);

console.log("Display UX: side drawer keeps the 3D model visible beside controls");
