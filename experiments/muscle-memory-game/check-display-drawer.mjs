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
  html.includes('<details class="viewer-settings">') &&
    html.includes("<summary>Отображение</summary>"),
  "Display control must remain a direct, accessible control"
);
assert(
  app.includes('"display-drawer-open"') &&
    app.includes('viewerSettings?.addEventListener("toggle"'),
  "Display drawer open state is not connected to the application shell"
);
assert(
  css.includes(".viewer-settings[open] .viewer-settings-menu") &&
    css.includes("body.display-drawer-open:not(.motion-mode) .comparison-pane-static") &&
    css.includes("left: var(--display-drawer-width)"),
  "Display controls still behave like an overlay instead of a side drawer"
);
assert(
  /max-height:s*calc(100% - 60px)/.test(css) &&
    /overflow-y:s*auto/.test(css),
  "Display drawer must remain usable when many layer controls are visible"
);

console.log("Display UX: side drawer keeps the 3D model visible beside controls");
