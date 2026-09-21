# P1.4 Formula Registry — эксплуатационная инструкция

## Канонические файлы

- `config/formula-registry.v5.3.210-p1.4.json` — реестр формул;
- `data/formula-golden-cases.v5.3.210-p1.4.json` — эталонные случаи;
- `assets/data/formula-registry.v5.3.210-p1.4.js` — modern runtime;
- `assets/legacy/data/formula-registry.v5.3.210-p1.4.js` — legacy runtime;
- `NUTRITION_CALCULATOR_V5_3_210_P1_4_FORMULA_COVERAGE.csv` — покрытие.

## Генерация

```bash
python3 tools/generate_formula_registry.py
```

Проверка отсутствия ручных расхождений:

```bash
python3 tools/generate_formula_registry.py --check
```

## Независимый аналитический прогон

```bash
python3 tools/analyze_formula_registry.py --json-out reports/p1-4b-analytics.json
```

## Основной тест

```bash
node tests/p1-4-formula-registry.test.js
```

## Browser regression

```bash
PLAYWRIGHT_USE_SYSTEM_CHROMIUM=1 npx playwright test \
  --project=chromium \
  tests/e2e/p1-4-formula-golden.spec.js
```

## Полный release gate

```bash
python3 tools/release_gate.py --profile full
```

## Как добавить или изменить формулу

1. Изменить генератор `tools/generate_formula_registry.py`.
2. Указать уникальный ID, класс, источник, binding, входы, выходы и округление.
3. Добавить минимум два golden cases; для decision rule — граничный случай.
4. Добавить независимую реализацию в `tools/analyze_formula_registry.py`.
5. При необходимости добавить runtime binding-test.
6. Перегенерировать registry и runtime assets.
7. Запустить P1.4, P1.3, P1.2, static и browser gates.
8. Не редактировать generated JSON/JS вручную.

## Правила классов

- `AUTHORITATIVE` — только при наличии конкретного внешнего источника.
- `LOCAL_POLICY` — коэффициенты и решения продукта, даже если они используют внешнюю формулу как основу.
- `DECISION_RULE` — категориальные правила с явными границами.
- `DERIVED` — вычисления из уже определённых величин.
- `ARITHMETIC` — базовые операции без самостоятельного нормативного смысла.

## Запреты

- нельзя выдавать local policy за клинический стандарт;
- нельзя создавать expected из той же runtime-функции, которую проверяет тест;
- нельзя менять формулу без изменения версии registry;
- нельзя оставлять материальную формулу без golden cases;
- нельзя добавлять альтернативную реализацию без явного статуса и причины.
