# Шаг 4Г — HEI / FPID / FNDDS semantic gate v15

Дата: 2026-09-28  
Ветка: `data-source-expansion`  
Статус: **PASS, staging only**. Production `main` не изменён.

## Цель

Закрыть только семантические блокеры HEI/FPID/FNDDS там, где существует уникальное точное официальное соответствие. Не использовать fuzzy matching, перенос по классу продукта или похожему продукту.

## Диагностический probe

Проверено 30 уникальных карточек:
- HEI unresolved: 30;
- FPID ambiguity: 2;
- FNDDS ambiguity: 1.

33 — это число issue-флагов, а не число уникальных карточек.

Проверка FPID показала:
- `Cheese, swiss` имеет ровно одно точное нормализованное совпадение: FPID code **1040**;
- `Cheese, provolone` имеет ровно одно точное нормализованное совпадение: FPID code **1035**.

Для Provolone FNDDS-различие между обычным и reduced-fat вариантом разрешено по точному имени и pinned FDC ID **2705733**.

## Почему не применён class-rule для рыбы

В FPID найдено 30 raw-fish rows. Их PF_TOTAL не является инвариантным:
- встречаются значения примерно от **2.45 до 2.72 oz eq./100 g**;
- различаются и high/low-seafood подкомпоненты.

Поэтому судак, зубатка, ставрида, европейский сом и другие не получили HEI-эквиваленты «по аналогии» с другой рыбой.

## Результат

Разрешены только две карточки:
- `cheese swiss`;
- `cheese provolone`.

После шага 4Г:
- `HEI_EQUIVALENTS_UNRESOLVED`: **30 → 28**;
- `FPID_EXACT_NAME_AMBIGUOUS`: **2 → 0**;
- `FNDDS_EXACT_NAME_AMBIGUOUS`: **1 → 0**;
- `READY_FOR_NEXT_STAGING_GATE`: **31 → 33**;
- `BLOCKED_OTHER_GATES`: **58 → 56**.

## Защита данных

Проверено:
- нутриентные значения не менялись;
- family ID / profile ID не менялись;
- fuzzy matching не использовался;
- class-proxy inference не использовался;
- production `main` не изменён.

GitHub Actions run: **36448883372**  
Workflow artifact: **10982296616**  
Artifact SHA-256 digest: `a60f63ff8027073736dd3d00df9a91c1101fc42eac760d488317e277493f2091`.

## Следующий шаг

Остаются два независимых контура:
1. **28 HEI-unresolved** — требуют либо точного официального источника/правила, либо сохранения честного unresolved состояния.
2. **179 честных nutrient null** у 52 карточек — не должны заполняться предположениями.

Следующий короткий проход должен определить, какие из 28 HEI-unresolved можно закрыть доказуемым официальным rule/mapping без semantic widening.
