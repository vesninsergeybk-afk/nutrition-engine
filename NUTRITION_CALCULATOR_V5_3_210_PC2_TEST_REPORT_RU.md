# Отчёт о тестировании v5.3.210-pc2

## Итог

**Статус: PASS для внутреннего release scope PC2.**

Проверки подтверждают корректность product-focus слоя, отсутствие регрессий P1.2–P2.0/PC1, воспроизводимую сборку и работоспособность чистого HOSTING-артефакта в Chromium и Apache.

Они не заменяют исследование с реальными пользователями и внешнюю клиническую/предметную валидацию. Статус внешней валидации остаётся `EXTERNAL_VALIDATION_PENDING`.

## PC2 product-focus проверки

- статический PC2-контракт: **12/12 PASS**;
- PC1 product-correction regression: **13/13 PASS**;
- Chromium PC2 focused result/search journey: **1/1 PASS**;
- максимум приоритетов: **5**;
- вкладки результата: **2**;
- quality-tab до подтверждения дня: **заблокирован**;
- расширенная generic-first карта: **не менее 25 бытовых намерений**.

## Унаследованные доказательные контуры

- formula registry runtime/unit: **108/108 PASS**;
- independent golden cases: **113/113 PASS**;
- зарегистрированные формулы: **29/29 покрыты**;
- normative registry: **74/74 PASS**;
- product provenance: **19/19 PASS**;
- продуктов в provenance-контуре: **1105**;
- validation readiness: **15/15 PASS**;
- external evidence gate: **8/8 PASS**;
- runtime consolidation: **55/55 PASS**.

## Статический и серверный контроль

- статический аудит финального состава: **2153/2153 PASS**;
- runtime closure: **246/246 файлов**;
- Apache staging на чистом HOSTING ZIP: **9/9 PASS**;
- private secret integrity: **PASS**;
- manifest и SBOM: **PASS**;
- group/world writable files: **0**;
- архивы собираются побайтно воспроизводимо.

## Chromium на чистом HOSTING ZIP

Проверено **12/12 сценариев**:

- accessibility/security/normative: **4/4**;
- formula registry: **3/3**;
- UX decision hierarchy: **1/1**;
- validation readiness: **1/1**;
- PC1 product correction: **1/1**;
- mobile needs regression: **1/1**;
- PC2 product focus/search: **1/1**.

Accessibility-проверка выполнялась для desktop и mobile. Обнаруженный на промежуточном проходе недостаточный контраст загрузочного статуса в мобильной ретро-теме был исправлен в CSS; повторный axe-проход не содержит серьёзных или критических нарушений.

## Проверка архивов

### HOSTING

- ожидаемый runtime manifest: `v5.3.210-pc2`;
- файлов runtime closure: 246;
- дополнительных файлов поставки: manifest и SBOM;
- исторические продуктовые чанки: отсутствуют;
- tests/tools/config/quality/node_modules: отсутствуют;
- Apache и Chromium выполнялись после чистой распаковки.

### FULL

- содержит исходники, тесты, генераторы, документы, validation templates и private secret;
- completeness verifier: PASS;
- генераторы runtime, validation, formula, normative и provenance воспроизводимы;
- static и runtime inventory воспроизводятся после чистой распаковки.

## Ограничения

- локально проверен Chromium;
- Firefox и WebKit закреплены за CI-профилем;
- приоритеты результата являются продуктовой политикой текущей версии, а не клиническим назначением;
- качество приоритетов и поиска должно далее проверяться наблюдением за реальными пользователями и реальными поисковыми логами.
