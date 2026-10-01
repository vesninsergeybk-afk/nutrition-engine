// Presentation only: anatomy, selection and learning state remain in app.js.
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
const easing = "cubic-bezier(.2,.7,.2,1)";
const animations = new Set();
const running = new WeakMap();

function revealContent(element) {
  running.get(element)?.cancel();
  if (preference.matches || document.hidden || !element.getClientRects().length ||
      element.closest("[hidden], details:not([open])") || typeof element.animate !== "function") return;
  const animation = element.animate([
    { opacity: .65, transform: "translateY(3px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 160, easing });
  running.set(element, animation);
  animations.add(animation);
  animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
}

function selectionTrack(group) {
  const indicator = document.createElement("span");
  indicator.className = "ui-selection-indicator";
  indicator.setAttribute("aria-hidden", "true");
  group.classList.add("ui-motion-track");
  group.prepend(indicator);
  let frame = 0;
  let initialized = false;

  function update() {
    frame = 0;
    const active = [...group.querySelectorAll(":scope > button")].find(button =>
      !button.hidden && (button.getAttribute("aria-selected") === "true" ||
        button.getAttribute("aria-pressed") === "true"));
    if (!active || !active.getClientRects().length) {
      indicator.hidden = true;
      return;
    }
    indicator.hidden = false;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.height = `${active.offsetHeight}px`;
    indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    if (!initialized) {
      initialized = true;
      requestAnimationFrame(() => group.classList.add("ui-motion-ready"));
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  new MutationObserver(schedule).observe(group, {
    subtree: true, attributes: true,
    attributeFilter: ["aria-selected", "aria-pressed", "hidden"],
  });
  const resize = new ResizeObserver(schedule);
  resize.observe(group);
  for (const button of group.querySelectorAll(":scope > button")) resize.observe(button);
  update();
}

document.querySelectorAll(".mode-switch, .reference-tabs").forEach(selectionTrack);

const pending = new Set();
let contentFrame = 0;
for (const element of document.querySelectorAll(
  "#question, #feedback, #mobile-muscle-name, #search-results, #atlas-relations-list"
)) {
  let previous = element.textContent;
  new MutationObserver(() => {
    const next = element.textContent;
    if (next === previous) return;
    previous = next;
    if (!next.trim()) return;
    pending.add(element);
    if (!contentFrame) contentFrame = requestAnimationFrame(() => {
      contentFrame = 0;
      for (const item of pending) revealContent(item);
      pending.clear();
    });
  }).observe(element, { childList: true, characterData: true, subtree: true });
}

preference.addEventListener("change", () => {
  if (preference.matches) {
    for (const animation of animations) animation.cancel();
    animations.clear();
  }
});
