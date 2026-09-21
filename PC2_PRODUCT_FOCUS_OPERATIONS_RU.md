# Эксплуатация PC2 Product Focus

## Основные файлы

- `config/runtime-assets.v5.3.210-pc2.json`
- `assets/js/67-ux-decision-hierarchy-v5.3.210-pc2.js`
- `assets/legacy/js/67-ux-decision-hierarchy-v5.3.210-pc2.js`
- `assets/css/product-correction-stabilization-v5.3.210-pc2.css`
- `assets/runtime/runtime-manifest-v5.3.210-pc2.js`
- `assets/css/runtime-bundle-v5.3.210-pc2.css`

## Проверки

```bash
node tests/product-focus-stabilization.test.js
PLAYWRIGHT_USE_SYSTEM_CHROMIUM=1 npx playwright test --project=chromium tests/e2e/product-focus-stabilization.spec.js
python tools/generate_runtime_assets.py --check
python tools/runtime_inventory.py
python tools/static_checks.py
```

## Редактирование generic-first карты

Каноническая пользовательская карта находится в:

- `assets/js/08-ux-search-mobile-v5.3.207.js` — активный renderer поиска;
- `assets/js/03-app-core-v5.3.208.js` — базовый search core.

При добавлении запроса необходимо:

1. добавить русские и английские варианты терма;
2. указывать только существующие canonical product keys;
3. не поднимать готовое блюдо выше базового продукта для однословного общего запроса;
4. добавить browser-сценарий или расширить существующий;
5. проверить modern и legacy runtime.

## Выпуск

```bash
python tools/release_gate.py --profile release \
  --manual-acceptance quality/manual-acceptance.template.json \
  --external-evidence quality/p2-external-evidence.pending.json
```

Текущий pending evidence ожидаемо не разрешает клинический claim. Для обычной внутренней и hosting-проверки используется профиль `full` без заявления о внешней валидации.

## Rollback

PC2 устанавливается в отдельный каталог релиза. Для отката переключить серверный symlink/document root на предыдущий PC1-каталог; не смешивать файлы двух runtime closure в одной директории.
