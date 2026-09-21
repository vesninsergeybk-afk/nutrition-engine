# Тестовый отчёт v5.3.210-rc1

## Назначение проверки

RC1 проверялся как предрелизная серверная оболочка над продуктовой основой `v5.3.210-pc2`. Формулы, нормативные значения и числовые данные продуктовых карточек в рамках этого прохода не изменялись.

Основные задачи проверки:

- подтвердить готовность HOSTING-сборки к размещению на реальном сервере;
- проверить безопасность и приватность диагностического контура;
- исключить потерю первого нажатия во время загрузки runtime;
- подтвердить mobile/desktop пользовательские сценарии;
- исключить регрессии P1.2–P2.0 и PC1–PC2;
- проверить воспроизводимость и автономность обоих ZIP-артефактов.

## Итог

Статус внутренней проверки: **PASS**.

Статус внешней предметной и клинической валидации: **EXTERNAL_VALIDATION_PENDING**.

RC1 пригоден для ограниченного beta-тестирования на сервере. Этот статус не означает клиническую валидированность или завершение Priority-100.

## Небраузерный контур

Совокупный внутренний результат: **2687 assertions — PASS**.

В том числе:

- RC1 beta-release hardening: **20/20**;
- PC1 product correction: **13/13**;
- PC2 product focus: **12/12**;
- P2.0 validation-readiness unit: **15/15**;
- внешний evidence gate: **8/8**;
- P1.5 UX hierarchy: **26/26**;
- P1.4 formula registry: **108/108**;
- independent golden cases: **113/113**;
- P1.3 product provenance: **19/19**;
- P1.2 normative registry: **74/74**;
- runtime consolidation: **56/56**;
- DOM state regression: **10/10**;
- HTTP/CSRF, storage, version, permissions и hosting checks: **PASS**;
- Apache staging: **15/15**;
- статический контроль: **2220/2220**.

Статический контроль включает:

- JavaScript syntax: 370;
- PHP syntax: 8;
- JSON parse: 184;
- HTML integrity: 19;
- permissions: 827;
- secret scan: 791;
- version workflow: 21.

## Chromium

На рабочей сборке и затем повторно на чисто распакованном HOSTING ZIP прошли **13/13** сценариев:

- release security/accessibility: 4;
- formula registry и golden runtime: 3;
- UX decision hierarchy: 1;
- validation readiness: 1;
- PC1 critical journey: 1;
- мобильный расчёт потребностей: 1;
- PC2 product-focus journey: 1;
- RC1 beta diagnostics: 1.

Мобильный сценарий первого нажатия после быстрого ввода был дополнительно повторён последовательно три раза в рабочем дереве и один раз на чистой HOSTING-распаковке.

Firefox и WebKit закреплены за CI-профилем; локальная управляемая среда подтверждала Chromium.

## Исправление мобильного первого нажатия

Проверка выявила гонку между пользовательским вводом и завершением отложенного возрастного профиля. На узком экране форма могла изменить высоту непосредственно во время нажатия кнопки.

В RC1:

- кнопка `needs_calc_btn` изначально отключена;
- она активируется только после официального события `app:ready`;
- переход от поля возраста к следующему полю немедленно завершает возрастной debounce;
- расчёт дополнительно закрывает незавершённый возрастной таймер перед чтением входных данных;
- standalone DOM-harness и Playwright используют тот же readiness-контракт.

## Серверная проверка HOSTING

Чистая HOSTING-распаковка:

- runtime closure: **249/249**;
- содержимое ZIP: **251 запись** — 249 runtime-файлов, manifest и SBOM;
- structural verifier: **22/22**;
- Apache staging: **15/15**;
- Chromium: **13/13**;
- private secret и integrity flags: HTTP 403;
- test/tools/private surface: недоступна;
- oversized request: HTTP 413;
- `X-Robots-Tag`: присутствует;
- `robots.txt`: закрывает beta от индексации;
- versioned assets: immutable cache;
- текстовые ресурсы: compression enabled;
- manifest и SBOM: PASS.

## Проверка FULL

Полный архив:

- structural verifier: **18/18**;
- manifest content integrity: PASS;
- manifest allowlist completeness: PASS;
- private-secret integrity: PASS;
- full archive completeness: PASS;
- no group/world writable files: PASS;
- генераторы runtime, normative registry, provenance, formula registry, UX contract и validation package воспроизводятся из канонических источников;
- статический контроль чистой исходной поставки: PASS.

## Воспроизводимость

Обе сборки создаются детерминированно: повторная сборка из одного дерева даёт побайтно идентичный ZIP.

## Ограничения

Внутренние gates подтверждают заявленные технические и продуктовые контракты, но не заменяют:

- наблюдаемое тестирование реальными пользователями;
- содержательную ревизию Priority-100;
- независимое заключение специалистов;
- внешнюю клиническую/предметную валидацию.
