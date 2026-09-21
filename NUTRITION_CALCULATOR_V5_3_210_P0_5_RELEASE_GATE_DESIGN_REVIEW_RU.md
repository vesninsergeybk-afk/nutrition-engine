# Design review P0.5 — почему gate устроен именно так

## Отвергнутый вариант

Первоначально можно было просто объединить существующие тесты в один длинный shell-скрипт и считать проход успешным по exit code. Такой вариант недостаточен:

- не создаёт машиночитаемый отчёт;
- не различает source и deployable artifact;
- не проверяет повторяемость сборки;
- не тестирует фактический ZIP;
- не защищает secret от попадания в source bundle;
- не фиксирует ручные критерии WCAG и staging;
- позволяет автоматическим тестам создать ложную гарантию production readiness.

## Принятый вариант

Gate разделён на четыре независимых уровня:

1. **Source validation** — синтаксис, структура, версии, секреты, права.
2. **Behavior validation** — клинические, security и state-transition regressions.
3. **Browser validation** — реальный движок, responsive layout, keyboard path и axe.
4. **Artifact validation** — deterministic allowlist ZIP, manifest, SBOM, modes и Apache staging.

Production release дополнительно требует ручной acceptance. Таким образом, автоматический PASS означает «кандидат технически пригоден для staging», а не «медицинский продукт полностью валидирован».

## Fail-closed свойства

- Любой suite возвращает ненулевой код и блокирует gate.
- `release` profile без подписанной ручной приёмки завершается ошибкой.
- Hosting artifact строится по allowlist, а не по blacklist.
- Source bundle не может включить production secret.
- GitHub CI не получает production credential.
- Firefox/WebKit не являются необязательной рекомендацией: workflow считает их блокирующими.
- Axe блокирует serious/critical, но ручная accessibility-проверка остаётся обязательной.

## Результат критики

P0.5 не делает необоснованного заявления «10/10 production». Он обеспечивает воспроизводимый технический контроль и явно отделяет:

- локально доказанное;
- то, что обязан доказать CI;
- то, что может подтвердить только человек на реальном staging.
