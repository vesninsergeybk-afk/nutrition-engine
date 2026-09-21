# Эксплуатация runtime-архитектуры P1.1

## Изменение порядка модулей

Редактировать только:

`config/runtime-assets.v5.3.210-p1.1.json`

После изменения выполнить:

```bash
python3 tools/generate_runtime_assets.py
python3 tests/p1-1-runtime-consolidation.test.py
python3 tools/release_gate.py --profile full
```

Прямое редактирование generated CSS или browser manifest запрещено: `--check` остановит release gate.

## Сборка

Полный private archive:

```bash
python3 tools/build_release.py --kind full --output release/nutrition_calculator_v5_3_210_p1_1_FULL_PRIVATE.zip --verify-reproducible
```

Минимальный hosting archive:

```bash
python3 tools/build_release.py --kind hosting --output release/nutrition_calculator_v5_3_210_p1_1_HOSTING_PRIVATE.zip --verify-reproducible
```

## Проверка

```bash
python3 tools/verify_release.py release/nutrition_calculator_v5_3_210_p1_1_HOSTING_PRIVATE.zip --apache --browser
python3 tools/verify_release.py release/nutrition_calculator_v5_3_210_p1_1_FULL_PRIVATE.zip
```

## Важное правило

Нельзя вручную копировать отдельный исторический файл в hosting ZIP. Если он действительно нужен runtime, зависимость должна быть выражена в canonical manifest либо обнаруживаться inventory. После этого archive пересобирается целиком.
