# Отчёт о тестировании v5.3.210-p1.3

Дата: 18 июля 2026 года  
Объект: P1.3 Product Database Provenance & Nutrient Confidence

## Итог

P1.3 принят в пределах заявленного scope. Основная миграция, аналитический второй цикл и финальная release-полировка выполнены последовательно. Ни одна исходная числовая величина 33 нутриентных полей не изменена автоматически.

## P1.3-specific

`tests/p1-3-product-provenance.test.js`: **19/19 PASS**.

Проверено:

- 1105 карточек и уникальность ключей;
- 36 465 классификаций «карточка × нутриент»;
- ровно один provenance-метод на каждый нутриент;
- явная семантика каждого числового нуля;
- полное совпадение нутриентных чисел с baseline v5.3.190;
- запрет HIGH для непервичных источников;
- идентичность JSON/JS и modern/legacy registry;
- runtime uncertainty;
- AI confidence clamp;
- пациентский отчёт с uncertainty и zero caveat;
- наличие аналитической очереди.

## Регрессия нормативов и runtime

- P1.2 normative registry: **74/74 PASS**.
- Runtime consolidation: **52/52 PASS**.
- Runtime closure: **236/236 файлов**, missing: 0.
- Детерминированная генерация P1.3 и runtime manifest: PASS, stale changes: 0.

## Safety/server suites

Прямой последовательный прогон: **248/248 PASS**:

- low-weight safety: 14;
- protected modes: 37;
- legacy fail-closed: 6;
- independent clinical revalidation: 34;
- DOM state regression: 10;
- PHP server guard: 62;
- cross-process guard: 9;
- client guard: 16;
- HTTP/CSRF: 12;
- storage policy: 6;
- version consistency: 25;
- hosting check: 3;
- permissions: 5;
- Apache source staging: 9.

Итого специализированные, нормативные, runtime и safety suites без статического аудита: **393/393 PASS**.

## Статический аудит

До добавления настоящего отчёта выполнено **1883/1883 PASS**:

- JavaScript syntax: 327;
- PHP syntax: 8;
- JSON parse: 165;
- HTML integrity: 19;
- permissions: 692;
- secret scan: 658;
- version/workflow: 14.

Финальный статический счёт после включения всей документации фиксируется в `reports/static-checks-final-release.json` и должен использоваться как authoritative для итогового ZIP.

## Browser

Chromium release gate на исходном P1.3 runtime: **4/4 PASS**.

На чисто распакованном HOSTING_PRIVATE ZIP: **4/4 PASS**.

Проверены desktop/mobile, automated accessibility, private surface, CSRF contract и нормативный registry. Firefox и WebKit остаются обязательными CI-проектами; в локальной управляемой среде подтверждён Chromium.

## Архивы

HOSTING_PRIVATE после устранения исторических ссылок:

- 238 ZIP entries;
- 236 manifest/runtime files плюс manifest и SBOM;
- ровно один CSS runtime bundle P1.3;
- только product chunks P1.3;
- runtime closure exact;
- Apache staging PASS;
- browser staging PASS;
- secret integrity PASS;
- reproducible build PASS.

FULL_PRIVATE пересобирается после включения этого отчёта и проверяется отдельно по manifest/SBOM/hash/mode/full-surface completeness.

## Ограничения результата

P1.3 доказывает происхождение, метод и уровень уверенности и делает неизвестность видимой. Он не равнозначен ручному повторному сопоставлению всех 1105 карточек с первичными записями и не заменяет лабораторный анализ. Review queue остаётся входом для последующей data remediation; независимые формулы и golden cases относятся к P1.4.
