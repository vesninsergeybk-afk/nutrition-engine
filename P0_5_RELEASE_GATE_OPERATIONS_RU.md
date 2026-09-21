# P0.5 — Release Gate & CI: эксплуатационная инструкция

## Назначение

P0.5 превращает набор разрозненных тестов в блокирующий релизный конвейер. Кандидат не считается готовым к production, если не пройдены автоматические проверки, браузерная CI-матрица и ручная приёмка.

## Локальные профили

```bash
npm ci --ignore-scripts
python3 tools/release_gate.py --profile quick
PLAYWRIGHT_USE_SYSTEM_CHROMIUM=1 python3 tools/release_gate.py --profile full
```

В ограниченной локальной среде полный gate можно запускать сегментами:

```bash
python3 tools/release_gate.py --profile full --stop-after clinical_revalidation --skip-build --summary-out reports/gate-segment-1.json
python3 tools/release_gate.py --profile full --start-at dom_state_regression --stop-after apache_source --skip-build --summary-out reports/gate-segment-2.json
PLAYWRIGHT_USE_SYSTEM_CHROMIUM=1 python3 tools/release_gate.py --profile full --start-at browser_chromium_release_gate --summary-out reports/gate-segment-3.json
```

Сегментация не меняет состав проверок; она нужна только для сред с ограничением длительности одного процесса.

## CI

Workflow `.github/workflows/quality-gate.yml`:

- использует immutable SHA для GitHub Actions;
- устанавливает зависимости через `npm ci`;
- устанавливает Chromium, Firefox и WebKit;
- запускает один и тот же browser release-gate на трёх движках;
- создаёт deterministic hosting-template и source/CI bundle;
- публикует отчёты только как CI artifacts;
- не использует production API-ключ.

CI создаёт временный placeholder `api/gemini-secret.php`. Настоящий ключ никогда не должен находиться в Git-репозитории.

## Private hosting artifact

```bash
python3 tools/build_release.py \
  --kind hosting \
  --output release/nutrition_calculator_v5_3_210_p0_5_HOSTING_PRIVATE.zip \
  --verify-reproducible

python3 tools/verify_release.py \
  release/nutrition_calculator_v5_3_210_p0_5_HOSTING_PRIVATE.zip \
  --apache
```

Hosting ZIP строится по allowlist и не содержит:

- `.github/`;
- `tests/`;
- `tools/`;
- `quality/`;
- `reports/`;
- `release/`;
- `node_modules/`;
- `hosting-check.html`;
- npm/Playwright-конфигурацию.

Внутри находятся `release-manifest.json` и `release-sbom.spdx.json`.

## Source/CI bundle

```bash
python3 tools/build_release.py \
  --kind source \
  --output release/nutrition_calculator_v5_3_210_p0_5_SOURCE_CI.zip \
  --verify-reproducible
```

Source bundle не содержит `api/gemini-secret.php`. Вместо него включён `api/gemini-secret.example.php`.

## Ручная приёмка

Скопировать шаблон:

```bash
cp quality/manual-acceptance.template.json quality/manual-acceptance.json
```

Обязательные блокирующие проверки:

1. Полный keyboard-only проход.
2. Проверка screen reader.
3. Smoke-test опубликованного HTTPS staging.
4. Подтверждение `403/404` для secret и внутренних файлов на реальном Apache.
5. Репетиция atomic rollback.

После заполнения:

```bash
python3 tools/release_gate.py \
  --profile release \
  --manual-acceptance quality/manual-acceptance.json
```

Автоматический axe-аудит не заменяет ручную WCAG-проверку.

## Развёртывание и откат

```bash
tools/deploy_atomic.sh ARTIFACT.zip /srv/nutrition/releases /srv/nutrition/current
tools/remote_smoke.py https://staging.example.org
tools/rollback_atomic.sh /srv/nutrition/releases /srv/nutrition/current
```

Сначала развёртывается staging, затем выполняется remote smoke и только после подписанной ручной приёмки переключается production symlink.

## Критерий GO

Production GO возможен только при одновременном выполнении:

- local/CI automated gate PASS;
- Chromium + Firefox + WebKit PASS;
- manual acceptance PASS;
- remote HTTPS smoke PASS;
- проверенный rollback;
- отдельные provider quotas и billing alerts;
- постоянный guard storage вне web-root.
