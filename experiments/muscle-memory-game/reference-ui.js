import { functionalPartForModelName } from "./reference-data/functional-parts.js";

// One movement/part/role state for the compact Atlas menu and full reference.
// Scene state remains in app.js.
export function createReferenceUI(root, { quickRoot, onShowGroup, onClearGroup, onSelectItem }) {
  const find = id => root.querySelector(`#${id}`);
  const tabs = [...root.querySelectorAll("[data-reference-tab]")];
  const partField = find("functional-part-field");
  const partSelect = find("functional-part");
  const movementSelect = find("functional-movement");
  const roleButtons = [...root.querySelectorAll("[data-functional-role]")];
  const content = find("structure-reference-functional");
  const showButton = find("functional-show-group");
  const status = find("functional-model-status");
  const quickFind = id => quickRoot?.querySelector(`#${id}`);
  const quickBody = quickFind("atlas-relations-body");
  const quickParts = quickFind("atlas-relations-part");
  const quickMovements = quickFind("atlas-relations-movement");
  const quickList = quickFind("atlas-relations-list");
  const quickStatus = quickFind("atlas-relations-status");
  const quickRoles = [...(quickRoot?.querySelectorAll("[data-quick-role]") || [])];
  let reference = null;
  let rows = [];
  let role = "synergists";
  let showing = false;
  let quickOpen = false;
  let quickMessage = "";
  let quickOpeningAnimation = null;
  let quickOpeningFrame = 0;

  function syncQuickState() {
    if (!quickRoot) return;
    const opening = quickOpen && quickRoot.dataset.open !== "true";
    const previousHeight = opening ? quickRoot.getBoundingClientRect().height : 0;
    if (!quickOpen || opening) {
      cancelAnimationFrame(quickOpeningFrame);
      quickOpeningFrame = 0;
      quickOpeningAnimation?.cancel();
      quickOpeningAnimation = null;
    }
    quickRoot.dataset.open = String(quickOpen);
    quickRoot.dataset.role = quickOpen ? role : "";
    quickBody.hidden = !quickOpen;
    quickFind("atlas-relations-close").hidden = !quickOpen;
    for (const button of quickRoles) {
      button.setAttribute("aria-expanded", String(quickOpen && button.dataset.quickRole === role));
    }
    quickStatus.textContent = quickMessage || status.textContent;
    // Expand the existing card in place; repeated scene/status updates do not
    // restart the motion, and a quick close cancels it immediately.
    if (opening && previousHeight > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      quickOpeningFrame = requestAnimationFrame(() => {
        quickOpeningFrame = 0;
        if (!quickOpen || quickRoot.hidden) return;
        const expandedHeight = quickRoot.getBoundingClientRect().height;
        quickOpeningAnimation = quickRoot.animate(
          [
            { height: `${previousHeight}px`, overflow: "hidden" },
            { height: `${expandedHeight}px`, overflow: "hidden" },
          ],
          { duration: 220, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      });
    }
  }

  function clearGroup() {
    if (showing) onClearGroup?.();
    showing = false;
    showButton.setAttribute("aria-pressed", "false");
    showButton.textContent = "Выделить на модели";
    status.textContent = "";
    quickMessage = "";
    syncQuickState();
  }

  function closeQuick(focus = false) {
    quickOpen = false;
    clearGroup();
    if (focus) quickRoles.find(button => button.dataset.quickRole === role)?.focus();
  }

  function showGroup() {
    const row = selectedRow();
    if (!row || !row[role]?.length) return;
    const result = onShowGroup?.(row[role], role, { id: reference.id, partId: row.subjectPartId, movementRu: row.movementRu });
    showing = Boolean(result?.shown);
    showButton.setAttribute("aria-pressed", String(showing));
    showButton.textContent = showing ? "Убрать выделение группы" : "Выделить на модели";
    status.textContent = result?.message || "";
    quickMessage = result?.quickMessage || "";
    if (quickList) {
      [...quickList.querySelectorAll(".atlas-relation-muscle")].forEach((label, index) => {
        const state = result?.availability?.[index]?.state;
        label.textContent = row[role][index].nameRu;
        label.dataset.availability = state || "";
        if (state === "missing" || state === "hidden") {
          label.append(state === "missing" ? " · нет отдельной геометрии" : " · скрыта");
          label.dataset.availability = state;
        }
      });
    }
    syncQuickState();
  }

  function syncPartContext() {
    const context = find("structure-reference-context");
    const movementActive = tabs.find(tab => tab.getAttribute("aria-selected") === "true")?.dataset.referenceTab === "movement";
    context.hidden = movementActive || !context.textContent;
  }

  function activateTab(tab, focus = false) {
    if (tab.dataset.referenceTab !== "movement") closeQuick();
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
    if (quickRoot) {
      quickMovements.value = movementSelect.value;
      quickList.replaceChildren();
      quickRoot.dataset.movement = row?.movementId || "";
      quickRoot.dataset.part = row?.subjectPartId || "";
    }
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
      if (quickList) {
        const label = document.createElement("span");
        label.className = "atlas-relation-muscle";
        label.textContent = item.nameRu;
        quickList.append(label);
      }
    }
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "functional-empty";
      empty.textContent = role === "antagonists"
        ? "Прямые антагонисты для этой задачи в карточке не указаны. Это не означает, что противоположное движение невозможно."
        : "Синергисты для этой задачи в карточке не указаны.";
      list.append(empty);
      if (quickList) {
        const summary = document.createElement("p");
        summary.className = "functional-empty";
        summary.textContent = role === "antagonists"
          ? "Прямые антагонисты в данных не указаны."
          : "Синергисты в данных не указаны.";
        quickList.append(summary);
      }
    }
    content.append(list);
    if (row.contextDependent?.length) {
      const conditional = document.createElement("p");
      conditional.className = "functional-conditional";
      conditional.textContent = "Зависят от части мышцы и положения: " + row.contextDependent.map(item => item.nameRu).join("; ") + ".";
      content.append(conditional);
      if (quickList) {
        const summary = document.createElement("p");
        summary.className = "functional-conditional";
        summary.textContent = conditional.textContent;
        quickList.append(summary);
      }
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
    if (quickOpen) showGroup();
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
    if (quickRoot) {
      quickParts.value = partSelect.value;
      quickMovements.replaceChildren(...[...movementSelect.options].map(option => option.cloneNode(true)));
    }
    renderRow();
  }
  partSelect.addEventListener("change", renderMovements);
  movementSelect.addEventListener("change", renderRow);
  function selectRole(nextRole) {
    role = nextRole;
    for (const item of roleButtons) item.setAttribute("aria-pressed", String(item.dataset.functionalRole === role));
    renderRow();
  }
  roleButtons.forEach(button => button.addEventListener("click", () => selectRole(button.dataset.functionalRole)));
  showButton.addEventListener("click", () => {
    if (showing) { closeQuick(); return; }
    showGroup();
  });
  quickRoles.forEach(button => button.addEventListener("click", () => {
    if (quickOpen && role === button.dataset.quickRole) { closeQuick(); return; }
    quickOpen = true;
    quickBody.scrollTop = 0;
    selectRole(button.dataset.quickRole);
  }));
  quickParts?.addEventListener("change", () => {
    partSelect.value = quickParts.value;
    renderMovements();
  });
  quickMovements?.addEventListener("change", () => {
    movementSelect.value = quickMovements.value;
    renderRow();
  });
  quickFind("atlas-relations-close")?.addEventListener("click", () => closeQuick(true));
  quickRoot?.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !quickOpen) return;
    event.preventDefault();
    closeQuick(true);
  });

  return {
    clearGroup: closeQuick,
    refreshGroup() { if (quickOpen) renderRow(); },
    render(nextReference, sourceName, quickEnabled = true) {
      closeQuick();
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
      if (quickRoot) {
        quickRoot.hidden = !quickEnabled || !reference || reference.ambiguous;
        quickRoles.forEach(button => { button.disabled = !available; });
        quickFind("atlas-relations-unavailable").hidden = available;
        quickFind("atlas-relations-part-field").hidden = !parts.length;
        quickParts.replaceChildren(...[...partSelect.options].map(option => option.cloneNode(true)));
      }
      find("structure-reference-functional-details").hidden = !available;
      find("functional-unavailable").hidden = available;
      renderMovements();
      syncPartContext();
    },
  };
}
