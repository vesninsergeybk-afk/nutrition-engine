# Эксплуатация нормативного реестра P1.2

## Изменение нормы

1. Изменить только `assets/data/normative-registry.v5.3.210-p1.2.json`.
2. Добавить или обновить карточку первичного/официального источника.
3. Указать `source_ids` у каждого изменённого правила.
4. Обновить `reviewed_at` и при полном аудите `review_due_at`.
5. Выполнить:

```bash
python3 tools/generate_normative_registry.py
node tests/p1-2-normative-registry.test.js
python3 tools/release_gate.py --profile full
```

Generated JS вручную не редактируется.

## Добавление нутриента

Нужно одновременно добавить:

- metadata;
- US adult min rule;
- EU adult min rule;
- применимые UL/safe rules;
- source IDs;
- life-stage coverage либо явный `unavailable`;
- unit и UI-тест.

Генератор блокирует отсутствие взрослого min-правила.

## Пересмотр источников

До `2027-07-18` необходимо:

- проверить NASEM/NIH ODS;
- проверить EFSA DRV Finder и новые scientific opinions;
- проверить WHO guidelines;
- проверить актуальность МР РФ;
- проверить units, age bands, sex rules, UL scope;
- обновить дату пересмотра только после документированной проверки.

## Запреты

- не добавлять число без source ID;
- не заменять formula rule фиксированным «средним» числом;
- не подставлять взрослую норму вместо неизвестной нормы беременности/лактации;
- не использовать UL как рекомендуемую цель;
- не использовать safe level как UL;
- не менять generated JS напрямую.
