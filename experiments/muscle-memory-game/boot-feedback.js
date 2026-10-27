// This tiny classic script deliberately has no 3D or CDN dependencies.
// It still runs when the main ES module cannot be imported at all.
(() => {
  const loading = document.querySelector("#loading");
  const recovery = document.querySelector("#loading-recovery");
  const title = document.querySelector("#loading-recovery-title");
  const message = document.querySelector("#loading-recovery-message");
  const retry = document.querySelector("#loading-retry");
  const alternate = document.querySelector("#loading-alternate");
  const modelSource = document.querySelector("#model-source");
  if (!loading || !recovery || !title || !message || !retry || !alternate || !modelSource) return;

  let slowTimer;
  let appStarted = false;

  function hideRecovery() {
    clearTimeout(slowTimer);
    recovery.hidden = true;
    recovery.dataset.state = "";
  }

  function scheduleSlowNotice() {
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => {
      if (loading.classList.contains("is-hidden") || recovery.dataset.state === "error") return;
      recovery.dataset.state = "slow";
      title.textContent = appStarted
        ? "Модель загружается дольше обычного"
        : "Не удаётся открыть 3D-атлас";
      message.textContent = appStarted
        ? "Большие анатомические модели загружаются постепенно. Если ожидание затянулось, проверьте соединение и обновите страницу."
        : "Браузер не получил файлы для трёхмерной модели. Попробуйте обновить страницу. Если ошибка повторяется, откройте сайт в другом браузере или сети.";
      alternate.hidden = true;
      recovery.hidden = false;
    }, 20000);
  }

  document.addEventListener("atlas:model-loading", () => {
    appStarted = true;
    hideRecovery();
    scheduleSlowNotice();
  });

  document.addEventListener("atlas:model-ready", hideRecovery);

  document.addEventListener("atlas:model-failed", () => {
    clearTimeout(slowTimer);
    recovery.dataset.state = "error";
    title.textContent = "Не удалось загрузить 3D-модель";
    message.textContent = "Можно повторить загрузку страницы или выбрать запасную анатомическую модель.";
    alternate.hidden = false;
    recovery.hidden = false;
  });

  retry.addEventListener("click", () => window.location.reload());
  alternate.addEventListener("click", () => {
    modelSource.value = modelSource.value === "z-anatomy" ? "bodyparts4" : "z-anatomy";
    modelSource.dispatchEvent(new Event("change", { bubbles: true }));
  });

  scheduleSlowNotice();
})();
