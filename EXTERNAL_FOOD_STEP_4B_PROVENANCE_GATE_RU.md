# Шаг 4Б — provenance/null-semantics gate v15

Дата: 2026-09-28  
Ветка: `data-source-expansion`  
Статус: **PASS, staging only**. Production `main` не изменён.

## Цель

Закрыть только блокер `PROVENANCE_METHOD_SCHEMA_GATE` для актуального shortlist из 89 карточек, не подменяя этим проверку полноты нутриентов, HEI/FNDDS/FPID и не меняя production provenance-policy P1.3.

## Контракт

Production-policy `config/product-provenance-policy.v5.3.210-p1.3.json` не изменён и по-прежнему не включает `SOURCE_REPORTED`.

Для staging введён отдельный контракт `external-food-step4b-provenance-v15`.

Временный метод `SOURCE_REPORTED_COMPAT` разрешён только на входе preparation-stage и полностью устраняется на 4Б.

После 4Б разрешены только:
- `SOURCE_REPORTED`;
- `SOURCE_REPORTED_ZERO`;
- `CALCULATED`;
- `ASSUMED_ZERO`;
- `MISSING`.

## Результат

Проверено **89 карточек × 33 нутриента = 2 937 классификаций**.

Распределение:
- `SOURCE_REPORTED`: **2 009**;
- `SOURCE_REPORTED_ZERO`: **450**;
- `CALCULATED`: **174**;
- `ASSUMED_ZERO`: **85**;
- `MISSING`: **219**.

Все 2 937 полей классифицированы ровно одним методом.

## Null semantics

Проверено:
- `null` не преобразуется в 0;
- каждое отсутствующее значение остаётся `null` и получает метод `MISSING`;
- `SOURCE_REPORTED_ZERO` используется только при реальном числовом 0 из source row;
- `SOURCE_REPORTED` используется только для ненулевого source-row значения;
- `ASSUMED_ZERO` не маскируется под измеренный ноль;
- `salt` маркируется как `CALCULATED` по `sodium_mg * 2.54 / 1000`;
- `unsat` маркируется как `CALCULATED` из исходных MUFA + PUFA.

Нутриентные значения на 4Б не изменялись.

## Статус shortlist после 4Б

- `READY_FOR_NEXT_STAGING_GATE`: **29**;
- `BLOCKED_OTHER_GATES`: **60**;
- provenance-schema blockers remaining: **0**.

Важно: 29 — это только provenance-ready. Это не означает production-ready и не отменяет последующие semantic/state gates.

## Оставшиеся блокеры

После удаления только provenance-gate остаются:
- `MISSING_CALCULATOR_NUTRIENTS`: **54**;
- `HEI_EQUIVALENTS_UNRESOLVED`: **30**;
- `FPID_EXACT_NAME_AMBIGUOUS`: **2**;
- `FNDDS_EXACT_NAME_AMBIGUOUS`: **1**.

Ни один из этих блокеров не был автоматически снят на 4Б.

## Воспроизводимость

GitHub Actions run: `36399951207`  
Workflow: `External Food Import Preparation v15`  
Заключение: **success**.

Контрольные SHA-256:
- resolved proposals: `3265201c678279b106a49896a3ab76d365530c95c624fe5bc1d4b6a9bcb888be`;
- step 4B report: `02d07d5ae80fdf83574745243b8b1b60f6804a8e63f6394d337051a0b45efba5`;
- workflow artifact: `91e2426af6daef3fdf5ed3faad71906f5199695c1b4575094c1a8ef740fc121b`.

## Gate

Шаг 4Б закрыт.

Разрешён следующий staging-подшаг по оставшимся блокерам. Production `main` до отдельного import-gate менять запрещено.
