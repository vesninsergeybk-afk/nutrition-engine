# Эксплуатация P1.5 UX Decision Hierarchy

## Канонический источник

Редактировать следует только:

`config/ux-decision-hierarchy.v5.3.210-p1.5.json`

После изменения выполнить:

```bash
python3 tools/generate_ux_contract.py
python3 tools/generate_runtime_assets.py
```

Для проверки отсутствия ручного расхождения:

```bash
python3 tools/generate_ux_contract.py --check
python3 tools/generate_runtime_assets.py --check
```

## Обязательные тесты

```bash
node tests/p1-5-ux-decision-hierarchy.test.js
PLAYWRIGHT_USE_SYSTEM_CHROMIUM=1 npx playwright test \
  --project=chromium tests/e2e/p1-5-ux-decision-hierarchy.spec.js \
  --retries=0 --workers=1 --timeout=90000
```

Полный контур:

```bash
python3 tools/release_gate.py --profile full
```

## Правила изменения интерфейса

1. Не удалять существующий control только ради сокращения экрана.
2. Не скрывать элемент, необходимый для текущего состояния пользователя.
3. Любой новый профессиональный блок должен получить явный уровень приоритета.
4. Данные, обязательные для печати или экспорта, должны раскрываться в `@media print`.
5. Modern и legacy артефакты должны оставаться побайтно согласованными.
6. Новая логика должна быть fail-open как progressive enhancement: базовый калькулятор остаётся доступным при отказе P1.5-слоя.

## Быстрая runtime-диагностика

В консоли браузера:

```javascript
NutritionUxP15.audit()
NutritionUxP15.state()
NutritionUxP15.refresh()
```

`audit()` должен возвращать `ok: true`, версию P1.5, четыре этапа и фактическое число строк рациона.

## Откат

Для отката presentation-слоя убрать последние P1.5 CSS/JS записи из runtime config и пересобрать runtime assets. Формулы, нормативы и продуктовые данные при этом не затрагиваются.
