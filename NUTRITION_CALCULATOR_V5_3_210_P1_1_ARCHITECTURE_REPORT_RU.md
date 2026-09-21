# P1.1 — отчёт по консолидации архитектуры runtime

## Исходная проблема

До P1.1 deployable сборка включала почти всё историческое дерево `assets/` и `data/`, хотя актуальный runtime использовал только часть файлов. Одни и те же списки модулей отдельно хранились в modern и legacy bootstrap. Интерфейс подключал 27 последовательных прикладных CSS-слоёв плюс compatibility CSS.

Это создавало четыре риска:

1. расхождение порядка modern/legacy runtime;
2. случайное возвращение снятого модуля;
3. публикация устаревших данных и диагностических файлов;
4. сложность доказать, какие файлы действительно нужны production.

## Принятая архитектура

### Source of truth

`config/runtime-assets.v5.3.210-p1.1.json` является редактируемым источником порядка runtime.

`tools/generate_runtime_assets.py` генерирует:

- browser runtime manifest;
- CSS bundle.

`--check` блокирует релиз, если generated files не соответствуют config и исходным CSS.

### Runtime closure

`tools/runtime_inventory.py` начинает обход с актуальных entrypoints и server API, рекурсивно обнаруживает локальные зависимости и отдельно учитывает динамические legacy mappings и Harvard Plate asset tree.

Отсутствующая зависимость делает inventory неуспешным. Hosting builder использует сам результат inventory, поэтому allowlist и проверка достижимости не могут разойтись.

### Full versus hosting

История не удаляется из проекта. Она исключается только из deployable artifact:

- полный архив нужен для аудита, разработки и воспроизводимости;
- hosting архив нужен для публикации.

### CSS

CSS объединён без минификации и преобразования селекторов. Это минимизирует семантический риск: сохраняются исходный порядок, комментарии-разделители и относительная база `assets/css/`.

JS намеренно не объединялся: отдельные script contexts могут иметь одинаковые top-level lexical identifiers, а механическое объединение способно изменить область видимости и порядок ошибок.

## Инварианты

Release gate проверяет:

- config ↔ generated manifest;
- config ↔ CSS bundle;
- отсутствие hardcoded `CORE_SCRIPTS` в bootstraps;
- одинаковость modern/legacy ordering contract;
- точное совпадение hosting manifest с runtime closure;
- отсутствие исторических product versions в hosting;
- наличие истории в full archive;
- browser execution непосредственно из распакованного hosting ZIP.

## Ограничения

P1.1 не устраняет внутреннюю модульную фрагментацию 57 JS-файлов. Это сделано сознательно: следующий этап объединения JS требует построения модульных границ, contract tests и постепенного переноса глобальных API. Простое concatenation не считается безопасной архитектурной консолидацией.
