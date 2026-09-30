import { functionalPartForModelName } from "./reference-data/functional-parts.js";

// This controller owns reference navigation only. Scene state remains in app.js.
export function createReferenceUI(root, { onShowGroup, onClearGroup, onSelectItem }) {
  const find = id => root.querySelector(`#${id}`);
  const tabs = [...root.querySelectorAll("[data-reference-tab]")];
  const partField = find("functional-part-field");
  const partSelect = find("functional-part");
  const movementSelect = find("functional-movement");
  const roleButtons = [...root.querySelectorAll("[data-functional-role]")];
  const content = find("structure-reference-functional");
  const showButton = find("functional-show-group");
  const status = find("functional-model-status");
  let reference = null;
  let rows = [];
  let role = "synergists";
  let showing = false;

  function clearGroup() {
    if (showing) onClearGroup?.();
    showing = false;
    showButton.setAttribute("aria-pressed", "false");
    showButton.textContent = "Выделить на модели";
    status.textContent = "";
  }

  function syncPartContext() {
    const context = find("structure-reference-context");
    const movementActive = tabs.find(tab => tab.getAttribute("aria-selected") === "true")?.dataset.referenceTab === "movement";
    context.hidden = movementActive || !context.textContent;
  }

  function activateTab(tab, focus = false) {
    if (tab.dataset.referenceTab !== "movement") clearGroup();
    for (const button of tabs) {
      const active = button === tab;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      find(button.getAttribute("aria-controls")).hidden = !active;
    }
    syncPartContext();
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activateTab(tabs[next], true);
    });
  });

  function selectedRow() { return rows[Number(movementSelect.value)] || null; }
  function renderRow() {
    clearGroup();
    content.replaceChildren();
    const row = selectedRow();
    root.dataset.functionalMovement = row?.movementId || "";
    root.dataset.functionalPart = row?.subjectPartId || "";
    root.dataset.referenceFunctionalRole = row ? role : "";
    if (!row) return;
    const items = row[role] || [];
    const list = document.createElement("div");
    list.className = "functional-muscle-list";
    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "functional-muscle";
      button.textContent = item.nameRu;
      button.title = "Выбрать эту мышцу на модели";
      button.addEventListener("click", () => {
        clearGroup();
        const message = onSelectItem?.(item);
        if (message) status.textContent = message;
      });
      list.append(button);
    }
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "functional-empty";
      empty.textContent = role === "antagonists"
        ? "Прямые антагонисты для этой задачи в карточке не указаны. Это не означает, что противоположное движение невозможно."
        : "Синергисты для этой задачи в карточке не указаны.";
      list.append(empty);
    }
    content.append(list);
    if (row.contextDependent?.length) {
      const conditional = document.createElement("p");
      conditional.className = "functional-conditional";
      conditional.textContent = "Зависят от части мышцы и положения: " + row.contextDependent.map(item => item.nameRu).join("; ") + ".";
      content.append(conditional);
    }
    const note = document.createElement("p");
    note.className = "structure-reference-functional-row-note";
    note.textContent = row.noteRu;
    content.append(note);
    if (row.sourceUrl) {
      const source = document.createElement("a");
      source.href = row.sourceUrl;
      source.target = "_blank";
      source.rel = "noreferrer";
      source.className = "functional-source";
      source.textContent = row.sourceTitle;
      content.append(source);
    }
    showButton.disabled = !items.length;
    root.dataset.functionalMovement = row.movementId;
    root.dataset.functionalPart = row.subjectPartId || "";
    root.dataset.referenceFunctionalRole = role;
  }

  function renderMovements() {
    rows = (reference?.functionalRelations || []).filter(row => !partSelect.value || row.subjectPartId === partSelect.value);
    movementSelect.replaceChildren();
    rows.forEach((row, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = row.movementRu;
      movementSelect.append(option);
    });
    renderRow();
  }
  partSelect.addEventListener("change", renderMovements);
  movementSelect.addEventListener("change", renderRow);
  roleButtons.forEach(button => button.addEventListener("click", () => {
    role = button.dataset.functionalRole;
    for (const item of roleButtons) item.setAttribute("aria-pressed", String(item === button));
    renderRow();
  }));
  showButton.addEventListener("click", () => {
    if (showing) { clearGroup(); return; }
    const row = selectedRow();
    if (!row) return;
    const result = onShowGroup?.(row[role], role, { id: reference.id, partId: row.subjectPartId });
    showing = Boolean(result?.shown);
    showButton.setAttribute("aria-pressed", String(showing));
    showButton.textContent = showing ? "Убрать выделение группы" : "Выделить на модели";
    status.textContent = result?.message || "";
  });

  return {
    clearGroup,
    render(nextReference, sourceName) {
      clearGroup();
      reference = nextReference;
      const parts = reference?.functionalParts || [];
      partField.hidden = !parts.length;
      partSelect.replaceChildren();
      parts.forEach(part => {
        const option = document.createElement("option");
        option.value = part.id;
        option.textContent = part.nameRu;
        partSelect.append(option);
      });
      const selectedPart = functionalPartForModelName(reference?.id, sourceName);
      if (selectedPart) partSelect.value = selectedPart;
      const available = Boolean(reference?.functionalRelations?.length);
      find("structure-reference-functional-details").hidden = !available;
      find("functional-unavailable").hidden = available;
      renderMovements();
      syncPartContext();
    },
  };
}
