# Отчёт тестирования v5.3.210-p1.1

## Результат

P1.1 прошёл полный набор автоматизированных проверок в двух сегментах release gate. Сегментация использована из-за ограничения длительного единого процесса в управляемой среде; набор команд и критерии не сокращались.

## Специализированные проверки

| Контур | Результат |
|---|---:|
| P1.1 runtime consolidation | 52/52 |
| Low-weight/refeeding | 14/14 |
| Protected modes | 37/37 |
| Legacy fail closed | 6/6 |
| Clinical independent revalidation | 34/34 |
| DOM state transitions | 10/10 |
| Gemini server guard | 62/62 |
| Cross-process guard | 9/9 |
| Client guard | 16/16 |
| HTTP/sessionless CSRF | 12/12 |
| Storage policy | 6/6 |
| Version consistency | 25/25 |
| Hosting-check contract | 3/3 |
| Permissions | 5/5 |
| Apache source staging | 9/9 |
| Chromium source runtime | 3/3 |

Всего: **303/303 специализированных assertions PASS**.

## Статический контроль

- JavaScript syntax: 305/305;
- PHP syntax: 8/8;
- JSON parsing: 145/145;
- HTML integrity: 19/19;
- permission checks: 639;
- secret scan: 604;
- version/workflow: 9.

Всего: **1729 статических проверок PASS**.

## Artifact-level проверка

Минимальный hosting ZIP дополнительно проверяется после распаковки:

- manifest/hash/mode integrity;
- exact runtime closure;
- отсутствие исторических product versions;
- только два CSS-файла;
- Apache secret/flag denial;
- `LimitRequestBody`;
- Chromium desktop/mobile/protected-profile/CSRF/a11y workflows непосредственно на файлах из ZIP.

## Browser

Chromium source runtime: 3/3 PASS.

Chromium hosting artifact: 3/3 PASS.

Blocking axe violations (`critical`/`serious`): 0 на desktop и mobile.

Firefox и WebKit остаются обязательными CI-gates. Локальная среда использовала системный Chromium.

## Реальные вызовы Gemini

Не выполнялись. Квота и денежный бюджет провайдера не расходовались.
