# Changelog v5.3.210-p1.3

## P1.3A — Product provenance foundation

- Добавлена политика `config/product-provenance-policy.v5.3.210-p1.3.json`.
- Добавлен реестр `config/product-source-registry.v5.3.210-p1.3.json`.
- Добавлен детерминированный генератор `tools/generate_product_provenance.py`.
- Сформированы 12 JSON- и 12 JS-чанков `products.v5.3.210-p1.3`.
- Каждая из 1105 карточек получила `data_quality_v1_3`, `nutrient_provenance_v1_3` и `unknown_zero_fields_v1_3`.
- Исходные числовые значения нутриентов не изменены.

## P1.3B — аналитический второй цикл

- Добавлен `tools/analyze_product_provenance.py`.
- Сформированы аналитический отчёт и CSV-очередь ручной проверки.
- HIGH ограничен карточками с конкретным первичным dataset-источником.
- Непервичные источники после бонусов ограничены верхней границей confidence 0,81.
- Специальные энергетические основы, для которых 4‑4‑9 неприменима, переведены из ложной ошибки в информационный флаг.
- Неуказанное состояние составных продуктов нормализовано как `recipe_model`.
- Автоматическое удаление потенциальных дублей запрещено.

## P1.3C — runtime и release hardening

- Добавлен `ProductDataQualityV13` для product summary, nutrient-specific confidence и оценочной uncertainty.
- Calculation Core возвращает `sourceQuality` и `dataQuality` в snapshot.
- Пациентский отчёт отображает распределение достоверности, оценочную неопределённость основных макронутриентов и предупреждение об условных нулях.
- AI planner передаёт качество каждой карточки и всего рациона.
- Серверный Gemini guard запрещает повышать уверенность выше качества данных и трактовать `ASSUMED_ZERO` как доказанное отсутствие.
- P1.3-контроль добавлен и в modern, и в legacy runtime.
- Runtime manifest, CSS bundle, hosting check, release builder, verifier и CI mock переведены на `v5.3.210-p1.3`.
- Release gate дополнен генерацией provenance, аналитическим вторым проходом и отдельным P1.3-тестом.

## Фактическое распределение базы

- PRIMARY_DATASET: 263
- MIXED_SOURCE: 275
- BORROWED_PROXY: 289
- DERIVED_MODEL: 116
- RECIPE_MODEL: 108
- OFFICIAL_LABEL: 54

Confidence:

- HIGH: 263
- MEDIUM: 814
- LOW: 28

Нутриентные методы:

- MEASURED: 7468
- LABEL: 3228
- CALCULATED: 3387
- BORROWED: 13 465
- IMPUTED: 4099
- SOURCE_REPORTED_ZERO: 1241
- ASSUMED_ZERO: 3577

775 карточек содержат хотя бы один `ASSUMED_ZERO`. Это теперь явно отображается как неопределённость, а не как подтверждённое отсутствие нутриента.
