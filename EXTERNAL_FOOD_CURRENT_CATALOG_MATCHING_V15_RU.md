# Пересопоставление v15 с текущим каталогом — контрольная точка

Дата: 2026-09-27
Ветка: `data-source-expansion`
Статус: staging only; production `main` не изменён.

## Воспроизводимая база v15
GitHub Actions reproducibility gate: PASS.

- input core: 13 764
- family members: 13 680
- secondary: 84
- navigation families: 6 887
- identity profiles: 8 541
- independent semantic audit: PASS
- exact artifact hashes: PASS

## Текущий каталог: 1 105 продуктов

После пересопоставления с v15:

- **641** — чистая reference-связь:
  - 607 `LINKED_HIGH_CONFIDENCE`
  - 34 `LINKED_EXPLICIT_CONCEPT`
- **3** — связь существует, но текущая карточка/источник имеет семантический конфликт
- **1** — жёсткий конфликт: текущий source ID противоречит названию продукта
- **460** — остаются без надёжной reference-связи / требуют отдельного review

## Обнаруженные конфликты текущей базы

1. `Вишня (сырая)` использует FDC 171719 = `Cherries, sweet, raw` (черешня). Автоматическое объединение заблокировано.
2. Карточки красной и белой смородины обе используют FDC 173964 = объединённый `Currants, red and white, raw`; этот источник не поддерживает два отдельных видоспецифичных нутриентных профиля.
3. `Сайра тихоокеанская, консервированная...` использует FDC 175121 = `Fish, mackerel, jack, canned, drained solids`. Reference-link заблокирован как противоречащий названию.
4. `Sea bass, baked` отображается как `Морской окунь, запечённый`, что конфликтует с корректной русской терминологией Sebastes/ocean perch. Нужна отдельная локализационная коррекция без изменения нутриентов.

## Внешние 6 887 семей

- UNMATCHED_GENERIC_PROCESSED: 2 742
- REVIEW_OTHER: 1 664
- RELATED_EXISTING_BASE: 1 221
- NEW_BASIC_REFERENCE_CANDIDATE: 622
- DIRECT_CURRENT_MATCH: 374
- REVIEW_COMPLEX: 166
- SAFE_VARIANT_OF_DIRECT: 64
- EXPLICIT_CURRENT_CONCEPT: 32
- DIRECT_WITH_CURRENT_CONFLICT: 2

Старый shortlist `112` отозван. Среди 622 новых базовых кандидатов 142 встречаются минимум в двух импортированных базах и 480 — в одной. Это **перекрытие баз**, а не доказательство независимых лабораторных измерений.

## Проверки

- 1 105 current rows / 1 105 unique indices: PASS
- 6 887 external rows / 6 887 unique family IDs: PASS
- все связанные family ID существуют в v15: PASS
- все DIRECT_CURRENT_MATCH имеют реальный current anchor: PASS
- конфликтные FDC 171719 / 173964 / 175121 проверены по source ID: PASS

Следующий проход: пересчитать shortlist кандидатов с учётом v15 и уже проведённого российского review; не импортировать до завершения shortlist gate.
