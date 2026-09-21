# Операционная инструкция по staging-приёмке HOTFIX18

## 1. Размещение

Использовать только архив:

`NUTRITION_CALCULATOR_V5_3_210_RC2_HOSTING_HOTFIX18_STAGE5A_FINAL_STABILITY_PRIVATE.zip`

Развёртывание должно выполняться в новый release-каталог с атомарным переключением ссылки `current`. Не распаковывать архив поверх действующей версии.

## 2. Серверная проверка

```bash
python3 tools/remote_smoke_stage5a.py \
  https://STAGING_HOST \
  --expected-ui v5.3.210-rc2-hf18 \
  --expected-api v5.3.210-rc2 \
  --json-out reports/stage-5a-external-smoke.json
```

При первом `FAIL` развёртывание не принимается. В первую очередь проверить версию, заголовки, доступность API и запрет приватных путей.

## 3. Браузерная проверка

Для каждого движка выполнить отдельную команду и сохранить отдельный JSON:

```bash
python3 tools/stage_5a_hosting_browser.py https://STAGING_HOST --engine chromium \
  --json-out reports/stage-5a-external-chromium.json \
  --pdf-out reports/stage-5a-external-chromium-report.pdf

python3 tools/stage_5a_hosting_browser.py https://STAGING_HOST --engine firefox \
  --json-out reports/stage-5a-external-firefox.json \
  --pdf-out reports/stage-5a-external-firefox-report.pdf

python3 tools/stage_5a_hosting_browser.py https://STAGING_HOST --engine webkit \
  --json-out reports/stage-5a-external-webkit.json \
  --pdf-out reports/stage-5a-external-webkit-report.pdf
```

## 4. Ручная проверка устройств

Результаты вносить в `quality/stage-5a-hosting-manual-acceptance.template.json`. Для каждого пункта допустимы статусы:

- `PASS`;
- `FAIL_BLOCKING`;
- `FAIL_MAJOR`;
- `FAIL_MINOR`;
- `NOT_RUN`.

Скринридер проверяется при выключенном экране или без зрительного контроля основного действия, чтобы не подменять доступность визуальной навигацией.

## 5. Проверка PDF

Нельзя ограничиваться проверкой размера файла. Каждый PDF следует отрисовать:

```bash
python /home/oai/skills/pdfs/scripts/render_pdf.py \
  reports/stage-5a-external-chromium-report.pdf \
  --out_dir reports/rendered-chromium \
  --dpi 200
```

Проверить первую страницу, страницы с таблицей нутриентов, HEI и последнюю страницу. Не допускаются обрезанные столбцы, наложения, пустые обязательные страницы и повреждённые символы.

## 6. Откат

При блокирующей или существенной ошибке:

1. Не исправлять файлы непосредственно на сервере.
2. Сохранить JSON, скриншот, URL, браузер и точную последовательность действий.
3. Выполнить штатный атомарный откат.
4. Убедиться, что прежняя версия и её API доступны.
5. Исправление выпускать отдельным HOTFIX с новым манифестом.

## 7. Решение по 5Б

Статус `STAGE5B_AUTHORIZED` допускается только после:

- `PASS` всех автоматических browser-runner;
- отсутствия `FAIL_BLOCKING` и `FAIL_MAJOR` в ручной матрице;
- визуального `PASS` PDF;
- подтверждённого отката;
- нескольких рабочих сессий без обращения к резервному полотну.
