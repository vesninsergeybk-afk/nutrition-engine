# v5.3.210-p0.5 — Release Gate & CI

## Исправления, найденные самим gate

1. Исправлены восемь серьёзных нарушений цветового контраста в светлой теме.
2. Исправлен запрещённый `aria-label` на безролевом мобильном контейнере.
3. Восстановлен единственный семантический `<main>` без дублирующего `id`.
4. Полный Chromium обнаружил гонку, при которой после инвалидации защищённого профиля очищенная норма калорий возвращалась как `0`. Добавлен устойчивый маркер «норма намеренно не задана»; ручной ввод снимает маркер.
5. Добавлен browser regression с реальным ожиданием асинхронных обработчиков.
6. Завершение Apache staging-test сделано ограниченным по времени с остановкой всей process group.

## Release engineering

- Добавлен единый `tools/release_gate.py` с JSON и JUnit отчётами.
- Добавлены профили quick/full/ci/release и сегментированный запуск.
- Добавлена Playwright-матрица Chromium/Firefox/WebKit.
- Добавлен axe-core WCAG 2.2 A/AA gate для desktop и mobile.
- GitHub Actions закреплены полными commit SHA.
- Добавлен deterministic ZIP builder с повторной побайтовой сборкой.
- Добавлены manifest, SHA-256 и SPDX 2.3 SBOM.
- Добавлен verifier против path traversal, лишних файлов, изменения secret, неверных modes и дублирования ключа.
- Hosting artifact переведён на минимальный allowlist.
- Source/CI bundle исключает настоящий server secret.
- Добавлены atomic deploy, rollback и remote HTTPS smoke.
- Добавлен обязательный manual acceptance contract.

## Ограничения

Локально подтверждён Chromium. Firefox и WebKit являются обязательными CI-gates, но в текущей управляемой среде их бинарные файлы не удалось получить из Playwright CDN. Полный production GO также требует ручной keyboard/screen-reader проверки и реального HTTPS staging.
