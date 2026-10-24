/* Android-only user interface. All networking and validation happen natively. */
(() => {
  'use strict';
  if (!window.NutrientNative?.getCatalogStatus) return;

  function parseStatus(text) {
    try { return JSON.parse(text); } catch { return {}; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const heading = document.querySelector('.nut-heading');
    if (!heading) return;
    const panel = document.createElement('details');
    panel.className = 'nut-catalog-menu';
    panel.innerHTML = '<summary>База продуктов</summary>' +
      '<div class="nut-catalog-panel">' +
      '<p data-catalog-status role="status" aria-live="polite"></p>' +
      '<p data-catalog-count class="nut-hint"></p>' +
      '<button type="button" class="vm-button" data-check-catalog>Проверить обновления</button>' +
      '<p class="nut-hint">Все расчёты доступны без интернета. Проверка обновлений ' +
      'не отправляет ваш профиль и рацион.</p></div>';
    heading.append(panel);

    const message = panel.querySelector('[data-catalog-status]');
    const count = panel.querySelector('[data-catalog-count]');
    const button = panel.querySelector('[data-check-catalog]');
    function render(status) {
      message.textContent = status.message || 'Встроенная база доступна без интернета.';
      count.textContent = `Продуктов: ${Number(status.productCount) || 0}`;
      if (status.lastSuccessTime) {
        const time = new Date(status.lastSuccessTime);
        if (!Number.isNaN(time.getTime())) {
          count.textContent += ` · Проверено: ${time.toLocaleDateString('ru-RU')}`;
        }
      }
      button.disabled = status.state === 'checking';
      button.textContent = status.state === 'checking' ? 'Проверяю…' : 'Проверить обновления';
    }
    button.addEventListener('click', () => {
      render({ ...parseStatus(window.NutrientNative.getCatalogStatus()),
               state: 'checking', message: 'Проверяю новую базу продуктов…' });
      window.NutrientNative.checkCatalogNow();
    });
    window.addEventListener('nutrient-catalog-status', event => render(event.detail || {}));
    render(parseStatus(window.NutrientNative.getCatalogStatus()));
  }, { once: true });
})();
