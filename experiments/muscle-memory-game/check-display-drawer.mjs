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
  css.includes(".display-panel-open .comparison-pane-static") &&
    css.includes("width: calc(100% - min(340px, 34%))") &&
    css.includes(".display-panel-open .viewer-tools"),
  "Desktop display controls must shift the atlas instead of covering it"
);
assert(
  /overflow-y:\s*auto/.test(css) &&
    css.includes(".display-section"),
  "Display drawer must remain scrollable when many layer controls are visible"
);

console.log("Display UX: side drawer keeps the 3D model visible beside controls");
