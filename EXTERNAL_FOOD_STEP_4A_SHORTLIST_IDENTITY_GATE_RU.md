# Шаг 4A — shortlist и русская идентичность v15

Дата: 2026-09-28  
Ветка: `data-source-expansion`  
Статус: PASS, staging only. Production `main` не изменён.

## Цель 4A

Зафиксировать актуальный shortlist после воспроизводимой v15 и убедиться, что каждый кандидат имеет однозначную русскую пользовательскую идентичность до перехода к дальнейшей подготовке импорта.

## Итоговый shortlist

- CORE: **39**
- EXTENDED: **45**
- CHILD: **5**
- всего: **89**

Старые shortlist 112/33 не используются как актуальный импортный источник.

## Проверка фактического import-preparation artifact

Проверен GitHub Actions artifact `external-food-import-preparation-v15`:

- proposals: **89**
- уникальные family ID: **89 / 89**
- уникальные proposed product key: **89 / 89**
- русское import-name присутствует: **89 / 89**
- внутренних точных дублей русских имён после Unicode/ё→е/пунктуационной нормализации: **0**
- точных нормализованных коллизий русских import-name с текущими **1 105** продуктами: **0**

## Важное разграничение

PASS шага 4A подтверждает shortlist и русскую идентичность. Он **не означает**, что все 89 карточек готовы к импорту.

Текущий import-preparation gate:
- `READY_FOR_STAGING_SCHEMA_PATCH`: **29**
- `BLOCKED`: **60**

Причины блокировки относятся к следующему контуру:
- provenance method schema gate: 89;
- missing calculator nutrients: 54;
- HEI equivalents unresolved: 30;
- FPID exact-name ambiguous: 2;
- FNDDS exact-name ambiguous: 1.

Эти блокеры не являются причиной менять состав shortlist на шаге 4A; они должны закрываться на последующих staging/import gates.

## Gate

Шаг 4A считается закрытым. Разрешён следующий подшаг только в staging. Изменения production `main` запрещены до отдельного import-gate.
