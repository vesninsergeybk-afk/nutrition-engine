# Тестовый отчёт Product Correction / Stabilization PC1

Версия: `v5.3.210-pc1`  
Дата: 19 июля 2026 года

## Объём проверки

Проверка охватывает новый продуктовый контракт PC1 и все унаследованные контуры P0–P2.0: safety, protected modes, нормативы, provenance продуктовых данных, формулы, UX, evidence readiness, серверные ограничения и выпускную упаковку.

## Ключевые результаты до упаковки

- Product Correction static contract: **13/13 PASS**;
- P1.5 corrected UX contract: **26/26 PASS**;
- formula registry runtime: **108/108 PASS**;
- independent formula golden cases: **113/113 PASS**;
- normative registry: **74/74 PASS**;
- product provenance: **19/19 PASS**;
- runtime consolidation: **55/55 PASS**;
- static audit: **2104/2104 PASS**;
- совокупный non-browser gate: **2532 assertions PASS**;
- Chromium: **11/11 сценариев PASS**.

## Chromium-сценарии

1. desktop safety, keyboard path и accessibility;
2. mobile layout и accessibility;
3. private surface и CSRF contract;
4. normative registry и EFSA energy-dependent values;
5. formula registry load order;
6. formula provenance в реальном расчёте и отчёте;
7. protected NASEM/HEI compatibility diagnostics;
8. corrected P1.5 route и completion gating;
9. P2 evidence status в UI, runtime и отчёте;
10. полный PC1 critical journey;
11. mobile needs calculation при ширине 390 px.

## Специальные PC1-проверки

Подтверждено, что:

- один продукт остаётся черновиком;
- финальный HEI скрыт до подтверждения дня;
- HEI не может стать `2020/100`;
- допустимый балл ограничен диапазоном `0–100`;
- предварительный отчёт не содержит финальных суточных выводов;
- предварительный отчёт сохраняет трассировку применённых формул;
- изменение граммов сбрасывает подтверждение;
- один приём пищи не получает суточный HEI;
- simple/professional mode переключаются обратимо;
- consumer mode не открывает protected profiles;
- при недоступном `localStorage` работает session fallback;
- базовые продукты занимают первое место по пяти контрольным запросам;
- статус внешней валидации остаётся `EXTERNAL_VALIDATION_PENDING`.

## Найденные и исправленные дефекты в ходе стабилизации

- modern/legacy рассогласование report builder и methodology governance;
- устаревшее ожидание финальной формульной трассировки только для полного дня;
- устаревший P2 browser-сценарий, считавший один продукт завершённым рационом;
- production self-test продолжал ссылаться на P2.0 manifest и CSS bundle;
- из-за старых ссылок HOSTING closure содержал шесть лишних исторических файлов;
- подтверждение и режим не сохранялись в средах с запрещённым `localStorage`;
- базовый search priority мог быть перезаписан поздним core-renderer.

## Артефактная проверка

Финальные архивы проверены как самостоятельные чисто распакованные артефакты:

- HOSTING verifier: **20/20 PASS**;
- FULL verifier: **16/16 PASS**;
- runtime closure: **246/246 файлов**;
- в HOSTING присутствуют только два CSS-файла: compatibility layer и активный PC1 bundle;
- исторические P2.0 runtime manifest и CSS bundle исключены;
- Apache staging: **9/9 PASS**;
- Chromium на чистом HOSTING: **11/11 PASS**;
- manifest, SBOM, permissions и private-secret integrity: **PASS**;
- обе сборки воспроизводятся побайтно.

## Ограничения

Локально проверен Chromium. Firefox и WebKit закреплены за CI-профилем. Автоматические проверки не заменяют наблюдаемое пользовательское тестирование и внешнюю клиническую/предметную валидацию.
