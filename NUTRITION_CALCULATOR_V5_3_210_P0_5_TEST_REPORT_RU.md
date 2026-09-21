# Отчёт тестирования v5.3.210-p0.5

Дата: 18 июля 2026 года.

## Итог

- Статус локального автоматизированного gate: **PASS**.
- Production-статус: **CONDITIONAL CANDIDATE**.
- Причина условного статуса: Firefox/WebKit должны пройти GitHub CI, а ручная приёмка ещё не подписана.

## Проверки предметной и защитной логики

| Пакет | Результат |
|---|---:|
| Низкая масса и refeeding safety | 14/14 PASS |
| Protected modes | 37/37 PASS |
| Legacy fail closed | 6/6 PASS |
| Независимая клиническая revalidation | 34/34 PASS |
| Полные DOM-переходы состояния | 10/10 PASS |
| Gemini server guard | 62/62 PASS |
| Межпроцессные гонки | 9/9 PASS |
| Клиентский cooldown/recovery | 16/16 PASS |
| HTTP/CSRF и отсутствие session flood | 12/12 PASS |
| Storage policy | 6/6 PASS |
| Version consistency | 34/34 PASS |
| Hosting-check contract | 3/3 PASS |
| Permissions | 5/5 PASS |
| Apache staging | 9/9 PASS |

## Browser release gate

System Chromium 144:

- desktop clinical safety workflow — PASS;
- mobile layout — PASS;
- keyboard skip navigation — PASS;
- protected-profile invalidation — PASS;
- private surface — PASS;
- CSRF browser contract — PASS;
- axe-core WCAG 2.2 A/AA desktop — 0 serious/critical violations;
- axe-core WCAG 2.2 A/AA mobile — 0 serious/critical violations.

Полноценный Chromium выявил и позволил исправить дефект, который не воспроизводился прежним stripped-DOM тестом: после очистки автоматически перенесённой нормы UI мог повторно показать `0`. После исправления поле остаётся действительно незаданным, а ручное значение пользователя сохраняется.

## Статические проверки

- JavaScript syntax: 304 файла PASS.
- PHP syntax: 8 файлов PASS.
- JSON parse: 142 файла PASS.
- HTML/resources/duplicate IDs: PASS.
- Group/world writable paths: 0.
- API-key-like значения вне private secret: 0.
- GitHub Actions без полного immutable SHA: 0.

Всего выполнено 1739 статических и файловых валидаций.

## Артефакт

Private hosting ZIP:

- deterministic rebuild: PASS;
- ZIP path traversal: PASS;
- duplicate entries: 0;
- manifest integrity: PASS;
- SPDX SBOM: присутствует;
- лишние build/test surfaces: 0;
- secret SHA-256 сохранён;
- API-ключ не дублируется;
- Apache staging из распакованного ZIP: PASS;
- oversized request: HTTP 413;
- secret/flags: HTTP 403;
- test path в production artifact: HTTP 404.

Source/CI ZIP:

- deterministic rebuild: PASS;
- настоящий `api/gemini-secret.php` отсутствует;
- присутствует только `api/gemini-secret.example.php`.

## Ограничения проверки

1. Playwright CDN недоступен из управляемой локальной среды, поэтому локально выполнен Chromium. Firefox и WebKit настроены как обязательные GitHub CI gates.
2. Автоматический axe-аудит не заменяет ручную проверку клавиатурой и screen reader.
3. Не выполнен smoke-test на фактическом публичном HTTPS staging URL пользователя.
4. Не подписан `quality/manual-acceptance.json`.
5. Не выполнена реальная репетиция production rollback на серверной файловой системе пользователя.

До закрытия этих пунктов релиз нельзя маркировать как окончательный production GO.
