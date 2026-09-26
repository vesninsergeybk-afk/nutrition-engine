# Исправление конфликтов внешних продуктовых семейств — v14

Дата: 2026-09-26  
Ветка: `data-source-expansion`

## Итог

Повторный проход исправил не только семь исходно отмеченных конфликтов, но и связанные ошибки того же класса.

- входной core: **13 764** строки;
- семейный слой: **13 673** строки;
- резерв/карантин: **91** строка;
- навигационные семейства: **6 900**;
- содержательные профили: **8 593**;
- независимый аудит: **PASS, ошибок 0**.

Нутриентные значения не усреднялись и не заменялись.

## Исправления

### Catfish / wolffish
Разделены channel catfish, Atlantic wolffish, European catfish, striped catfish и farmed catfish с неуказанным видом. Семь BLS-записей `Katfisch/Steinbeißer` помещены в карантин: исходное название неоднозначно и не позволяет честно выбрать один вид.

### Pike complex
Разделены northern pike, zander/pike-perch, walleye и sauger. Дополнительно `piked dogfish` исключён из pike-комплекса и собран в собственную семью.

### Mexican cheeses
Chihuahua, Asadero, Cotija, Añejo, queso blanco, queso seco и queso fresco теперь являются отдельными семействами.

### Muenster / Munster
BLS European profile отделён от USDA/CNF US-standard Muenster. Жирность остаётся отдельным профилем, а не новой семьёй.

### Neufchatel
USDA/CNF Neufchatel помечен как US standard и не приравнивается к французскому PDO Neufchâtel.

### Romano
USDA/CNF generic Romano помечен как US standard и не называется автоматически Pecorino Romano.

### Ocean perch / rockfish
Разделены Atlantic ocean perch (Sebastes market group), Pacific rockfish mixed species и BLS ocean perch/redfish с неуказанным видом.

## Дополнительная локализационная коллизия

Текущая production-запись FDC 173694 `Fish, sea bass, mixed species, cooked, dry heat` отображается как `Морской окунь, запечённый`. Это конфликтует с корректным русским обозначением Sebastes/ocean perch. Переименование должно быть отдельным staging-патчем без изменения нутриентов.

## Контроль

Независимый аудит проверил поштучно спорные source_record_id, целостность разбиения 13 764 строк и отсутствие старых конфликтных family key.
