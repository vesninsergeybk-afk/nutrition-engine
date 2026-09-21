# P0.4.1 — эксплуатация Gemini Cost & Abuse Guard

Версия приложения: `v5.3.210-p0.4.1`
Дата выпуска: 2026-07-18

## Назначение

Контур останавливает неконтролируемое потребление Gemini API до обращения к провайдеру и учитывает каждую фактическую либо неоднозначно завершившуюся попытку. Он дополняет, но не заменяет проектные квоты, spend limits и billing alerts Google Cloud.

## Обязательные действия перед production

1. Проверьте, что health endpoint возвращает `ai_available=true` только после настройки постоянного guard-хранилища.
2. Предпочтительно задайте `NUTRITION_GEMINI_GUARD_DIR` как постоянный каталог вне web-root. Права: каталог `0700`, файлы `0600`.
3. Задайте случайный `NUTRITION_GEMINI_GUARD_SALT` длиной не менее 24 символов. Не помещайте его в клиентский код.
4. Проверьте текущие тарифы Gemini и задайте `NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL=YYYY-MM-DD`. Встроенная консервативная проверка действительна до `2026-10-18`; после этой даты AI автоматически блокируется.
5. Настройте проектные квоты, provider spend limits и billing alerts в Google AI Studio / Google Cloud.
6. Если используется reverse proxy, включайте доверие к forwarded-заголовкам только после точной настройки CIDR и выбранного клиентского заголовка.
7. Запустите все P0.4.1 tests и Apache staging test на целевом хостинге.

## Хранилище guard

### Явно настроенный путь

```text
NUTRITION_GEMINI_GUARD_DIR=/private/persistent/nutrition-gemini-guard
```

Каталог не должен находиться внутри `DOCUMENT_ROOT`.

### Без явного пути

Guard пытается создать скрытый постоянный каталог в родительском каталоге web-root:

```text
<parent-of-document-root>/.nutrition-gemini-guard-<hash>
```

Если постоянное хранилище невозможно создать, AI работает по принципу fail closed.

Эфемерный `/tmp` разрешается только явно для разработки:

```text
NUTRITION_GEMINI_ALLOW_EPHEMERAL_GUARD=1
```

или:

```text
NUTRITION_GEMINI_REQUIRE_PERSISTENT_GUARD=0
```

Для production эти флаги использовать нельзя.

### Файлы состояния

- `state.json` — основная копия текущей ревизии;
- `state.backup.json` — вторая атомарная копия той же ревизии;
- `public-status.json` — компактный health snapshot;
- `state.lock` — межпроцессная блокировка;
- `integrity-failed.flag` — постоянная аварийная блокировка;
- `events-YYYY-MM-DD.jsonl` — минимальный безопасный журнал.

Чтение выбирает наиболее новую валидную ревизию. Повреждение одной копии не откатывает ledger назад. Изменение любой копии инвалидирует публичный snapshot и заставляет health выполнить безопасное полное чтение.

## Модели и параметры

Разрешены только закреплённые стабильные модели:

```text
gemini-3.5-flash
gemini-3.1-flash-lite
```

Произвольные aliases, `latest`, preview-модели и внешняя compatibility model не принимаются.

Для Gemini 3 задаётся:

```text
thinkingLevel=LOW
```

Параметр `temperature` не переопределяется. Google Search grounding в P0.4.1 жёстко отключён, поскольку стоимость поисковых запросов не включена в локальный ledger.

## Денежный ledger

Все суммы хранятся целыми micro-USD.

Консервативные минимальные ставки:

```text
NUTRITION_GEMINI_INPUT_MICRO_USD_PER_M_TOKENS=1500000
NUTRITION_GEMINI_OUTPUT_MICRO_USD_PER_M_TOKENS=9000000
```

Ставки нельзя снизить ниже встроенного безопасного минимума. Более дешёвая fallback-модель намеренно учитывается по более дорогому тарифу Gemini 3.5 Flash.

Бюджеты по умолчанию:

```text
NUTRITION_GEMINI_COST_MICRO_USD_PER_MINUTE=2000000   # $2
NUTRITION_GEMINI_COST_MICRO_USD_PER_HOUR=5000000    # $5
NUTRITION_GEMINI_COST_MICRO_USD_PER_DAY=20000000    # $20

NUTRITION_GEMINI_EXPLAIN_COST_MICRO_USD_PER_DAY=6000000
NUTRITION_GEMINI_PLANNER_COST_MICRO_USD_PER_DAY=9000000
NUTRITION_GEMINI_MEDIA_COST_MICRO_USD_PER_DAY=15000000
```

Перед каждым провайдерским вызовом резервируется консервативная стоимость. После ответа резерв заменяется `usageMetadata`. При отсутствии metadata или неоднозначном сетевом исходе применяется максимально консервативная оценка по output/thinking rate.

## Pricing-review gate

```text
NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL=2026-10-18
```

Допускается только реальная дата `YYYY-MM-DD`, не раньше текущего UTC-дня. При просрочке или некорректной дате health возвращает недоступность, а POST получает `503` с кодом:

```text
guard_pricing_review_required
guard_pricing_review_invalid
```

После проверки актуальной официальной страницы тарифов:

1. при необходимости увеличьте input/output rates;
2. пересмотрите минутный, часовой и дневной денежные бюджеты;
3. установите новую дату следующего обязательного контроля;
4. прогоните P0.4.1 test suite.

## Токеновые бюджеты

Общие defaults:

```text
NUTRITION_GEMINI_TOKENS_PER_MINUTE=750000
NUTRITION_GEMINI_TOKENS_PER_HOUR=1000000
NUTRITION_GEMINI_TOKENS_PER_DAY=3000000
```

По операциям задаются отдельные minute/hour/day значения для `EXPLAIN`, `PLANNER` и `MEDIA`.

Предварительная оценка резервирует:

- сериализованный payload;
- schema и system instructions;
- заявленный output;
- полный безопасный thinking reserve;
- изображение по tile-based оценке;
- консервативный reserve для аудио и неизвестных модальностей.

## Частота и параллельность

Поддерживаются rolling limits для:

- точного HMAC-псевдонима клиента;
- IPv4 `/24` или IPv6 `/56` подсети;
- глобального процесса приложения;
- операций `explain`, `planner`, `media`;
- окон 1 минута, 10 минут, 1 час и 24 часа.

Defaults параллельности:

```text
NUTRITION_GEMINI_GLOBAL_CONCURRENCY=2
NUTRITION_GEMINI_CLIENT_CONCURRENCY=1
```

## Provider attempts и circuit breaker

Каждая HTTP-попытка резервируется и учитывается до отправки, включая retry, смену модели и смену ключа.

Основные defaults:

```text
NUTRITION_GEMINI_PROVIDER_ATTEMPTS_MINUTE=20
NUTRITION_GEMINI_PROVIDER_ATTEMPTS_10M=50
NUTRITION_GEMINI_PROVIDER_ATTEMPTS_HOUR=200
NUTRITION_GEMINI_PROVIDER_ATTEMPTS_DAY=700

NUTRITION_GEMINI_CIRCUIT_FAILURES=5
NUTRITION_GEMINI_CIRCUIT_WINDOW_SECONDS=300
NUTRITION_GEMINI_CIRCUIT_OPEN_SECONDS=120
```

Cache hit и локальный fallback не закрывают provider circuit. Его закрывает только подтверждённый успешный ответ провайдера.

## Reverse proxy

По умолчанию forwarded-заголовки игнорируются.

Для доверенного reverse proxy:

```text
NUTRITION_GEMINI_TRUST_PROXY=1
NUTRITION_GEMINI_TRUSTED_PROXIES=10.0.0.0/8,192.0.2.10/32
NUTRITION_GEMINI_TRUSTED_CLIENT_IP_HEADER=x-forwarded-for
```

Поддерживаемые client-IP headers выбираются явно. Цепочка `X-Forwarded-For` разбирается справа налево; адреса доверенных прокси удаляются, а подставленный атакующим левый адрес не выбирается автоматически.

`X-Forwarded-Proto` влияет на Secure cookie только от адреса из trusted proxy allowlist.

## CSRF и входные данные

- GET health использует stateless double-submit cookie и не создаёт PHP-сессию.
- Все POST требуют пользовательский заголовок `X-Nutrition-CSRF`.
- Токен в JSON или multipart body без заголовка не принимается.
- JSON CSRF проверяется до чтения `php://input`.
- Apache ограничивает `api/gemini.php` телом 8 MiB через `LimitRequestBody`.
- Неподдерживаемый Content-Type получает `415`.

## Аварийное отключение

```text
NUTRITION_GEMINI_ENABLED=0
```

или файл:

```text
api/gemini-disabled.flag
```

Внешние вызовы прекращаются, но локальный калькулятор остаётся работоспособным.

## Integrity lockdown

Дополнительный emergency marker можно задать явно:

```text
NUTRITION_GEMINI_INTEGRITY_FLAG_FILE=/private/persistent/nutrition-gemini-integrity.flag
```


Если после провайдерского ответа невозможно надёжно записать токены или стоимость, создаётся `integrity-failed.flag`. Все последующие AI-вызовы блокируются.

Восстановление:

1. оставьте AI отключённым;
2. сохраните копии обоих state-файлов, snapshot, integrity flag и журналов;
3. проверьте диск, права, владельца, системные часы и целостность JSON;
4. устраните причину;
5. выполните весь P0.4.1 test suite;
6. удалите flag только после успешной проверки;
7. не удаляйте state без документированного решения — это сбрасывает локальную историю бюджета.

## Clock rollback

События, значительно находящиеся в будущем относительно системных часов, не удаляются как «старые». Вместо этого guard блокирует AI кодом `guard_clock_anomaly`. После исправления времени требуется повторная проверка состояния.

## Права deployable-файлов

Релиз поставляется без group/world-writable paths:

- каталоги `0755`;
- обычные файлы `0644`;
- CLI `.sh`/`.py` tests `0755`.

После переноса через FTP/панель хостинга перепроверьте, что файлы не получили `0777`.

## HTTP-доступ к служебным файлам

Корневой `.htaccess` запрещает прямую выдачу secret и flag-файлов. Каталог `tests/` закрыт отдельным deny-by-default `.htaccess`, а PHP workers дополнительно завершаются `404` вне CLI.

Старые entrypoints 5.3.208 и 5.3.209 не запускают исторический runtime, а показывают retirement page с переходом на актуальный `index.html`.

## Масштабирование

Файловый backend корректен для одного сервера либо нескольких PHP-процессов с общим локальным файловым хранилищем.

Для нескольких независимых серверов или контейнеров с разными дисками нужен централизованный backend:

- Redis;
- SQL с транзакциями;
- API gateway с общими квотами.

До миграции на общий backend горизонтальное масштабирование нельзя считать финансово защищённым.
