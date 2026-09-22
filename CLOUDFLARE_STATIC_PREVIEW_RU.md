# Cloudflare static preview

Ветка: `cloudflare/static-preview`.

## Назначение

Эта ветка готовит безопасный первый деплой калькулятора через Cloudflare Workers Static Assets.

`wrangler.jsonc` запускает `tools/build_cloudflare_static.py` автоматически при `npx wrangler deploy`. Скрипт формирует `.cloudflare/dist` только из браузерного runtime closure и не публикует исходники проекта, тесты, отчёты, PHP-файлы или приватные материалы.

## Настройки Cloudflare

- Git branch: `cloudflare/static-preview`
- Build command: оставить пустым
- Deploy command: `npx wrangler deploy`
- Builds for non-production branches: можно оставить включённым

## Что заработает в первом деплое

Статический калькулятор, интерфейс, локальные расчёты, продуктовые данные и публичные страницы.

## Что пока намеренно не переносится

PHP endpoint Gemini. Cloudflare Workers не исполняет PHP; `api/*.php` исключены из публичной статики. Голос/фото/Gemini переносятся отдельным этапом в Worker/Function с секретами Cloudflare.

## Защита

Сборка завершается ошибкой, если runtime closure неполон, не сформированы обязательные публичные файлы или в статический каталог попал PHP/известный приватный файл.
