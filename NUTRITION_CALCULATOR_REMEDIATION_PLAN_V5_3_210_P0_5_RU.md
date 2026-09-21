# Обновлённая дорожная карта после P0.5

## Завершено

- P0.1: базовый server/API hardening.
- P0.2: выраженная недостаточность массы и refeeding safety.
- P0.3–P0.3.2.1: protected modes, external clinical targets и независимая revalidation.
- P0.4–P0.4.1: API cost, abuse guard и независимая revalidation.
- P0.5: release gate, deterministic artifacts, browser/a11y CI, deployment/rollback contract.

## Обязательные действия перед production GO

1. Выполнить GitHub CI на Chromium, Firefox и WebKit.
2. Заполнить и подписать manual acceptance.
3. Развернуть candidate на реальном HTTPS staging.
4. Выполнить `tools/remote_smoke.py`.
5. Проверить Apache denial и `LimitRequestBody` на реальном хостинге.
6. Отрепетировать atomic rollback.
7. Настроить provider quotas, billing alerts, постоянный guard dir и уникальный guard salt.

## Следующие продуктовые проходы после production gate

- P1.1: архитектурная консолидация исторических runtime/CSS-слоёв.
- P1.2: формальный нормативный registry и provenance базы продуктов.
- P1.3: пользовательская и экспертная валидация расчётных результатов.
- P1.4: performance budget и сокращение bootstrap/resources.
