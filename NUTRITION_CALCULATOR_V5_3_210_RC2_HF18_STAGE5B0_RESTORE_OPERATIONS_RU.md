# Восстановление карантина этапа 5Б.0

1. Распаковать очищенную исходную сборку в отдельный каталог.
2. Распаковать карантинный архив в другой каталог без наложения на runtime.
3. Из корня исходной сборки выполнить:

```bash
python tools/pre5b_quarantine.py \
  --quarantine-root /путь/к/распакованному/карантину \
  --restore
```

4. Проверить:

```bash
python tools/runtime_inventory.py --json-out reports/runtime-after-restore.json
python tools/static_checks.py --json-out reports/static-after-restore.json
```

Ожидаемый результат: 194 файла восстановлены, runtime closure остаётся 277/277, число файлов вне runtime возвращается к 489.
