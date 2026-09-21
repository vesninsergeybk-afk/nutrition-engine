# Дорожная карта после P1.1

## Завершено

- P0.1–P0.5: safety, clinical protected modes, API guard и release gate.
- P1.1: manifest-driven runtime, CSS consolidation, reachability hosting, dual full/hosting artifacts.

## Обязательные действия перед production GO

1. Запустить GitHub CI на Chromium, Firefox и WebKit.
2. Выполнить manual acceptance.
3. Развернуть hosting candidate на реальном HTTPS staging.
4. Выполнить remote smoke и Apache denial check.
5. Отрепетировать rollback.
6. Настроить provider quotas, billing alerts, guard directory и guard salt.

## Следующие продуктовые проходы

### P1.2 — Normative Registry & Data Provenance

- единый registry формул и нормативов;
- источник, версия, возрастная группа, регион, единица и применимость;
- coverage и conflict tests;
- provenance каждой продуктовой карточки;
- запрет непроверенных fallback-норм.

### P1.3 — Calculation Validation

- эталонные кейсы;
- двойной ручной расчёт;
- допустимые отклонения;
- экспертная клиническая и диетологическая проверка.

### P1.4 — JS Module Consolidation & Performance Budget

- карта глобальных API;
- contract-first объединение модулей;
- lazy loading необязательных блоков;
- performance budgets по запросам, байтам и времени интерактивности.
