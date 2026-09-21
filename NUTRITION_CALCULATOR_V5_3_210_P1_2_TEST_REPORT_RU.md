# Отчёт тестирования P1.2

## Специализированные проверки

- low-weight/refeeding: 14;
- protected modes: 37;
- legacy fail-closed: 6;
- clinical revalidation: 34;
- DOM state regression: 10;
- API cost/abuse guard: 62;
- cross-process guard: 9;
- client guard: 16;
- HTTP/CSRF: 12;
- storage: 6;
- version consistency: 25;
- hosting contract: 3;
- permissions: 5;
- Apache staging: 9;
- P1.1 runtime consolidation: 52;
- P1.2 normative registry: 74;
- Chromium release workflows: 4.

Итого специализированных assertions / browser cases: **378**.

## Статический контроль

- JavaScript syntax: 309/309;
- PHP syntax: 8/8;
- JSON parse: 148/148;
- HTML integrity: 19;
- filesystem permissions: 648;
- secret scan: 614;
- version/workflow checks: 11.

Итого статических и файловых проверок на чисто распакованном FULL-архиве: **1757**.

## Browser

Chromium подтвердил:

- обычный и защищённый расчёт;
- отсутствие serious/critical axe violations;
- mobile overflow contract;
- private HTTP surface;
- CSRF contract;
- загрузку реестра;
- расчёт энергозависимых EFSA B1/B3;
- UL B6 = 12,5 мг;
- отображение версии и provenance реестра.

Firefox и WebKit остаются обязательными CI-проектами. Локальная управляемая среда подтверждает Chromium.

## Release integrity

- generated registry соответствует JSON;
- modern/legacy generated registry побайтно идентичны;
- runtime inventory не содержит missing resources;
- full и hosting ZIP собираются детерминированно;
- manifest и SBOM проверяются;
- hosting ZIP тестируется после распаковки через Apache и Chromium;
- server secret проверяется по неизменной SHA-256.


## Независимая проверка готовых ZIP

Первый candidate hosting ZIP был отклонён verifier: production closure включал одновременно bundle P1.1 и P1.2 из-за устаревшей ссылки в hosting self-test. Браузерные сценарии проходили, но двойной каскад нарушал архитектурный контракт.

После исправления self-test и повторной сборки:

- runtime closure: **231/231**;
- активные CSS: только `browser-compatibility-v5.3.192.css` и `runtime-bundle-v5.3.210-p1.2.css`;
- старый bundle P1.1 и его manifest отсутствуют в hosting ZIP;
- manifest/SBOM/integrity: PASS;
- Apache artifact staging: 9/9 PASS;
- Chromium непосредственно на распакованном hosting ZIP: 4/4 PASS.

Полный единый verifier в управляемой среде превысил общий timeout оркестратора после успешных отдельных шагов. Поэтому release-контроль выполнен сегментами: core ZIP verifier, Apache и Chromium. Сами проверки и acceptance criteria не сокращались.

## Финальная повторная валидация

При независимом повторном прогоне обнаружено, что прежняя цифра `1768` зависела от служебных файлов рабочей директории (`__pycache__` и результатов браузерных тестов), а не только от содержимого поставляемого архива. Это не влияло на PASS/FAIL, но делало итоговое число невоспроизводимым.

Исправлено:

- `tools/static_checks.py` и `tools/build_release.py` исключают Python/test/browser caches;
- `.gitignore` отражает тот же контракт;
- эталонный статический итог для чистого FULL ZIP зафиксирован как **1757**;
- повторный Chromium-прогон: **4/4 PASS**;
- повторный verifier готового HOSTING ZIP с Apache и Chromium: **PASS**;
- WHO sodium provenance приведён к точному названию и каноническому URL официального fact sheet 2026.

После исправления статический итог одинаков до и после запуска Python/Playwright, то есть статистика release gate стала детерминированной.
