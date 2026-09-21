# RC2 Hosting Hotfix 1 — отчёт проверки

## Причина выпуска

На реальном shared-хостинге ранний 35-секундный watchdog показывал экран «Не удалось завершить запуск калькулятора» до завершения загрузки 12 частей продуктовой базы и runtime-модулей. Экран ошибочно интерпретировал медленную загрузку как несовместимый браузер.

## Проверено

- синтаксис modern и legacy bootstrap;
- browser compatibility gate;
- единый runtime manifest RC2;
- bounded-concurrency загрузка продуктов и модулей;
- отсутствие ложного watchdog при активном `window.__PRODUCTS_READY__`;
- professional workflow RC2 в Chromium: 2/2;
- formula registry и golden runtime в Chromium: 3/3;
- desktop accessibility/safety: 1/1;
- mobile accessibility/layout: 1/1;
- private surface и CSRF: 1/1;
- normative provenance: 1/1;
- статический аудит и runtime consolidation.

## Ограничение

Точный результат на `nutrient.page.gd` необходимо подтвердить после загрузки этого hotfix в чистую папку. Если ошибка повторится, обновлённый экран покажет фактическую причину вместо общего сообщения о браузере.
