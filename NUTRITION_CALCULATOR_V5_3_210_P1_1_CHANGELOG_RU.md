# v5.3.210-p1.1 — Runtime Architecture Consolidation

## Цель прохода

Сократить исторически накопленный runtime без переписывания расчётного ядра и без удаления истории из полного проекта. Hosting-артефакт должен содержать только файлы, достижимые из актуальной точки входа, а порядок загрузки должен иметь единственный источник истины.

## Выполнено

### Единый runtime-манифест

Создан `config/runtime-assets.v5.3.210-p1.1.json`, который фиксирует:

- 12 текущих JSON-чанков базы продуктов;
- 12 script-fallback чанков;
- 57 modern runtime-модулей;
- 57 legacy runtime-модулей;
- self-test, diagnostics и performance branches;
- 27 активных CSS-слоёв в точном порядке каскада.

Из него детерминированно генерируется ES5-safe browser-манифест `assets/runtime/runtime-manifest-v5.3.210-p1.1.js`. Modern и legacy bootstraps больше не содержат собственных копий массивов модулей.

### Консолидация CSS

27 активных прикладных CSS-файлов объединены в один сгенерированный файл:

`assets/css/runtime-bundle-v5.3.210-p1.1.css`

Порядок правил, содержимое каждого слоя и SHA-256 исходников фиксируются генератором. Отдельным остаётся только ранний `browser-compatibility-v5.3.192.css`.

Количество CSS-запросов уменьшено с 28 до 2.

### Reachability-based hosting

Добавлен `tools/runtime_inventory.py`. Он вычисляет транзитивную closure актуального runtime, включая:

- HTML/JS/CSS/JSON зависимости;
- modern и legacy пути;
- dynamically composed Harvard Plate assets;
- текущие product chunks;
- API endpoint и private server files.

Hosting ZIP формируется только из closure. Исторические версии остаются в полном архиве.

### Production self-test

Из браузерного hosting self-test удалены сравнения с базами 5.3.184 и 5.3.189, устаревшее имя `03-app-core.js` и зависимость от снятого с hosting диагностического HTML. Исторические сравнения сохранены в полном CI/source-контуре.

### Дополнительное исправление

Исправлен живой путь formula registry:

- было: `formula-registry.v5.3.142.json` — файла нет;
- стало: `formula-registry.v5.3.145.json` — существующий registry.

### Два самостоятельных артефакта

- `FULL_PRIVATE`: полный проект, исторические версии, CI, тесты, инструменты и неизменённый server secret;
- `HOSTING_PRIVATE`: минимальный deployable runtime без tests/tools/config/старых entrypoints и исторических данных.

CI вместо private full создаёт `SOURCE_CI` без настоящего ключа.

## Результат сокращения hosting относительно P0.5

| Метрика | P0.5 | P1.1 | Изменение |
|---|---:|---:|---:|
| Файлы runtime manifest | 540 | 228 | −312 / −57,78% |
| Распакованный payload | 116 078 439 Б | 26 398 278 Б | −77,26% |
| ZIP | 10 585 245 Б | около 3 095 273 Б | −70,76% |
| CSS-запросы | 28 | 2 | −92,86% |

## Обратная совместимость

Расчётные формулы, protected modes, low-weight/refeeding guard, Gemini API guard и клинические контракты не изменялись. Modern и legacy порядок модулей сохранён в canonical manifest.
