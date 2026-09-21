# P2.0 — итоговый тестовый отчёт

Версия: `v5.3.210-p2.0`  
Дата: 19 июля 2026 года

## Результат

- внутренний validation-readiness gate: **PASS**;
- внешний evidence status: **EXTERNAL_VALIDATION_PENDING**;
- полный внутренний regression: **PASS**;
- разрешение clinical claim: **FALSE**.

## Coverage P2.0

- validation policy domains: 5;
- blind cases: 51;
- quantitative/rule cases: 31;
- safety cases: 12;
- usability/interpretation cases: 8;
- critical reference cases: 9;
- P2 unit assertions: 15;
- external-evidence validator assertions: 8;
- Chromium P2 end-to-end scenarios: 1 атомарный сценарий, проверяющий UI, runtime и отчёт.

## Полный внутренний gate

- suites: 36;
- assertions: `2478`;
- static assertions: `2050/2050`;
- runtime closure: 246/246;
- runtime consolidation: 54/54;
- Chromium: 11/11 сценариев;
- Apache source staging: 9/9;
- P1.4 golden cases: 113/113;
- P1.2 normative registry: 74/74.

## Негативные проверки evidence gate

Gate обязан завершаться FAIL при:

- pending decision;
- несовпадении версии или SHA-256;
- отсутствии подписи;
- неполном наборе case responses;
- непринятом critical safety case;
- недостаточном числе либо составе рецензентов;
- critical use error в пилоте;
- нерешённом CRITICAL/MAJOR finding;
- несовпадении заявленных и пересчитанных метрик;
- попытке разрешить claim без принятого evidence package.

## Ограничения

Chromium проверен локально. Firefox и WebKit остаются обязательными CI-профилями. Автоматизированные и test-only проверки не являются внешней клинической валидацией и не учитываются как реальные reviewer/pilot evidence.
