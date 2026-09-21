# Подготовка к переносу на Cloudflare

Исходная точка: checkpoint `NUTRITION_CALCULATOR_V6_NEEDS_CHECKPOINT_PRIVATE_2026-09-11.zip` после Pass 3A.3, 3B, 3B.1, 3B.2 и UI-sync Pass 3C.

## Что намеренно не попадает в GitHub

- `api/gemini-secret.php` — содержит серверные ключи и исключён из репозитория.
- `reports/`, `playwright-report/`, `test-results/`, `release/` — генерируемые артефакты и отчёты.
- локальные state/lock/kill-switch файлы API.

`.gitignore` дополнительно защищает эти пути от случайного коммита.

## Важное для Cloudflare

Текущий фронтенд — статический. Серверный Gemini API реализован на PHP (`api/gemini.php`, `api/gemini-guard.php`, `api/utf8-safe.php`). Cloudflare Pages/Workers не выполняют этот PHP-код как серверный runtime. Перед финальным публичным деплоем API нужно перенести в Cloudflare Worker / Pages Function и хранить ключи через Cloudflare Secrets.

До переноса API статическую часть можно развернуть отдельно, но функции Gemini/медиа, которые вызывают `./api/gemini.php`, работать не будут.
