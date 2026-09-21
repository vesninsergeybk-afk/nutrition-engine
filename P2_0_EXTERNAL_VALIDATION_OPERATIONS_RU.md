# P2.0 — эксплуатация независимой проверки

## 1. Подготовка review

Передавайте рецензенту только:

- `validation/P2_0_BLIND_DOMAIN_REVIEW_CASES_RU.json` либо его CSV-представление;
- отдельную копию `validation/P2_0_REVIEWER_RESPONSE_TEMPLATE.json`.

Не передавайте `P2_0_REFERENCE_ANSWER_KEY_PRIVATE.json` до фиксации `review_locked_at` и подписи исходного ответа.

## 2. Требования к рецензии

Каждая рецензия должна содержать:

- уникальные `review_id` и псевдоним;
- точную версию релиза и SHA-256 blind pack;
- аттестацию независимости и disclosure конфликтов интересов;
- профессиональную область;
- ответ по каждому из 51 кейса;
- итоговое решение;
- дату и идентификатор подписанта либо ссылку на внешнюю подпись.

Рецензент не должен менять case IDs или удалять непройденные кейсы. Для незавершённого ответа используется `NOT_REVIEWED`.

## 3. Пилот

- используйте псевдонимные participant/observation IDs;
- фиксируйте согласие вне шаблона;
- не помещайте прямые идентификаторы и свободный медицинский анамнез;
- выполняйте четыре предусмотренные задачи;
- каждую критическую ошибку использования регистрируйте явно;
- не объединяйте результаты разных версий приложения.

## 4. Формирование evidence package

Создайте новый файл на основе `quality/p2-external-evidence.template.json`. Не превращайте `p2-external-evidence.pending.json` в принятый файл.

В evidence package встраиваются подписанные reviewer records и pilot observations. Заявленные метрики должны быть рассчитаны по тем же первичным записям: validator пересчитает их независимо.

Проверка:

```bash
python3 tools/validate_external_evidence.py /secure/path/p2-external-evidence.accepted.json
```

## 5. Выпуск

Профиль окончательного выпуска запускается только с двумя отдельными доказательствами:

```bash
python3 tools/release_gate.py \
  --profile release \
  --manual-acceptance /secure/path/manual-acceptance.json \
  --external-evidence /secure/path/p2-external-evidence.accepted.json
```

Без обоих файлов release profile должен завершиться FAIL. Статус `EXTERNAL_VALIDATION_PENDING` изменяется только в новом versioned проходе после принятия реальных доказательств; текущий P2.0-артефакт задним числом не переименовывается в validated.
