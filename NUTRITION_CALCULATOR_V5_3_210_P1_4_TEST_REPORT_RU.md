# Отчёт о тестировании P1.4

Версия: `v5.3.210-p1.4`  
Дата: 18 июля 2026 года

## 1. Результат

Статус: **PASS**.

P1.4 прошёл основной, аналитический и выпускной контроль без известных открытых дефектов в заявленном scope.

## 2. Formula registry

- формул и правил: **29**;
- golden cases: **113**;
- покрытых формул: **29/29**;
- независимый повторный пересчёт: **113/113 PASS**;
- непокрытых формул: **0**;
- unresolved analytical findings: **0**;
- runtime/unit assertions P1.4: **108 PASS**.

## 3. Регрессия предыдущих проходов

- P1.3 product provenance: **19 PASS**;
- P1.2 normative registry: **74 PASS**;
- P1.1 runtime consolidation: **52 PASS**;
- P0 safety/server/storage/CSRF/Apache suites: **PASS**;
- полный prebuild release gate: **28 suites / 368 aggregated assertions — PASS**.

## 4. Статический контроль

После добавления полной документации P1.4 выполнено:

- JavaScript syntax: **332 PASS**;
- PHP syntax: **8 PASS**;
- JSON parse: **168 PASS**;
- HTML integrity: **19 PASS**;
- permissions: **711 PASS**;
- secret scan: **677 PASS**;
- version workflow: **11 PASS**;
- всего: **1926 PASS**.

## 5. Browser

На рабочей P1.4-сборке в системном Chromium:

- общий release/security/accessibility gate: **4/4 PASS**;
- P1.4 formula/golden/provenance gate: **3/3 PASS**;
- всего: **7/7 PASS**.

Проверено:

- реестр загружается раньше расчётных модулей;
- runtime version и formula IDs совпадают;
- обычный расчёт потребностей возвращает provenance;
- продуктовое масштабирование возвращает provenance;
- NASEM pregnancy возвращает текущую формульную версию;
- HEI perfect case даёт 100/100;
- compatibility protein diagnostic использует P1.4 golden cases;
- итоговый отчёт содержит формульную трассировку;
- private surface, CSRF и normative provenance не регрессировали;
- desktop/mobile accessibility gate проходит.

## 6. Архивы

### HOSTING

- runtime closure: **238/238 файлов**;
- ZIP entries: **240** вместе с manifest и SBOM;
- verifier checks: **19/19 PASS**;
- Apache staging: **9/9 PASS**;
- Chromium на чистой распаковке: **7/7 PASS**;
- минимальная production-поверхность: **PASS**;
- historical product versions pruned: **PASS**;
- воспроизводимая сборка: **PASS**.

### FULL

- verifier checks: **13/13 PASS**;
- completeness: **PASS**;
- manifest/SBOM integrity: **PASS**;
- private secret integrity: **PASS**;
- отсутствие дублирования секрета: **PASS**;
- воспроизводимая сборка: **PASS**.

## 7. Что именно считается независимой проверкой

Golden expected-значения повторно вычислены отдельным Python-анализатором, который не вызывает browser/runtime-функции. Затем эти значения сравниваются с фактическими modern-runtime функциями и browser-сценариями.

## 8. Ограничения

- Локально подтверждён Chromium.
- Firefox и WebKit остаются обязательными CI-only проектами.
- P1.4 не заменяет внешнюю клиническую экспертизу.
- `LOCAL_POLICY` формулы проходят математическую и регрессионную проверку, но не объявляются внешними клиническими стандартами.
- Golden cases подтверждают заявленные уравнения и границы, но не гарантируют применимость к каждому индивидуальному пациенту.
