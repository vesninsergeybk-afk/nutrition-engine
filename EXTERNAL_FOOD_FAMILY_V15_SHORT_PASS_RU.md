# Короткий проход внешних пищевых семейств — v15

Дата: 2026-09-26
Ветка: `data-source-expansion`
Статус: staging only; production `main` не изменён.

## Что выполнено

Короткий проход выполнен в формате:
1. сборка семейного слоя из 13 764 отфильтрованных core-записей;
2. независимый семантический аудит;
3. сравнение v14 → v15;
4. повторный запуск после каждого найденного дефекта.

## Ошибки v14, исправленные в v15

- BLS `Catfish/wolffish` больше не карантинируется как catfish/wolffish ambiguity; вынесен в отдельную семью зубатки с неуказанным видом.
- BLS `Striped catfish` переименован для пользовательского слоя в pangasius/пангасиус.
- sweet cherry и sour/tart cherry разделены (черешня vs вишня).
- Zante currant отделён от настоящей смородины Ribes.
- black currant и red/red-white currant разделены.
- striped mullet отделён от white sucker.
- pigeon pea отделён от ordinary split pea.
- Alaska pollock отделён от Atlantic pollock; generic pollock оставлен unspecified.
- Atlantic / Spanish / king / jack / mixed mackerel разделены.
- Atlantic horse mackerel после отдельной проверки отделён от Atlantic mackerel в собственную семью `horse mackerel`.
- canned cherry in juice pack остаётся фруктом; реальный cherry juice остаётся производным продуктом.
- Fish bake Bordelaise style (Alaska pollock) больше не попадает в семейство обычного минтая.

## Итог v15

- входной core: **13 764**;
- семейный слой: **13 680**;
- резерв/secondary: **84**;
- навигационные семейства: **6 887**;
- профили: **8 541**;
- потери строк: **0**;
- двойное членство family/secondary: **0**.

Нутриентные значения не объединялись, не усреднялись и не изменялись.

## Независимый аудит

Отдельный аудит проверил покрытие всех исходных source ID, отсутствие двойного членства и точные назначения критических записей.

Результат: **PASS, errors = []**.

Дополнительно проверено, что:
- sweet cherry != sour cherry;
- Ribes currant != Zante currant;
- striped mullet != white sucker;
- pigeon pea != split pea;
- Atlantic pollock != Alaska pollock;
- Atlantic mackerel != king mackerel;
- horse mackerel != Atlantic mackerel;
- canned cherry in juice pack не превращается в cherry juice;
- Bordelaise fish bake не превращается в plain Alaska pollock.

## Контрольные SHA-256 локального проверенного артефакта

- builder: `09174842b338645e94e23ab3bce9071abb2d364dd8c61ea119ebc5af9654e48f`
- independent audit: `02b6247fa58f38ef0855598c8126864bb26b564497e89184a7d2082f252e7a2f`
- family members: `144db74691f6c08af3405f621d6471289aad6740beb77e519b47949604d31188`
- family report: `20ea45444e3cefc970ed269db1f5655fb0f77518c43ac22e28842e5cb406e138`
- semantic audit: `de32d252caafe26bd925e35f731616f2ac016585610625b91ffa8ebe912ddabd`

## Ограничение процесса

Полный builder/audit v15 пока сохранён в проверенном артефакте, но ещё не перенесён как исполняемый pipeline в репозиторий. Этот отчёт фиксирует проверенный результат и явно заменяет v14 как актуальную контрольную точку. Следующий короткий проход — перенос builder/audit в GitHub Actions и воспроизводимый запуск там.
