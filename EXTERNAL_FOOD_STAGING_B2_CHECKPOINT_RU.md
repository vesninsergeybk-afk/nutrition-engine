# External food staging B2 — checkpoint

Дата: 2026-09-27  
Ветка: `data-source-expansion`  
Production `main`: не изменён.

## Вход

- текущий продуктовый каталог: **1 105** карточек;
- GitHub-produced staging B1: **28** новых карточек;
- semantic-state blocked: **1** (`bean pinto` dry, потому что нутриенты dry, а HEI/FPID-профиль был cooked).

Перед проверкой подтверждено, что manifest продуктовых shards в `main` и `data-source-expansion` имеет один и тот же blob SHA и одинаковые chunk SHA-256.

## Результат B2

Отдельный preview-каталог: **1 133** карточки.

Проверки:
- уникальные product keys: **1 133 / 1 133**;
- коллизии точного source record ID с текущими 1 105: **0**;
- полные совпадения 33-компонентного нутриентного вектора с текущими 1 105: **0**;
- текущие 1 105 объектов в preview не изменены;
- новые 28 карточек содержат числовые 33 нутриента и HEI-поля;
- provenance покрывает каждый из 33 нутриентов ровно один раз;
- `SOURCE_REPORTED` не просочился в существующие 1 105 карточек;
- формула соли проверена;
- итог: **PASS, errors=[]**.

B2 является staging-checkpoint, а не разрешением на production import.
