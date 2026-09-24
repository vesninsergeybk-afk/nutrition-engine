# Сверка внешней продуктовой базы в семейства — разрушительный аудит, исправленная версия

Дата: 2026-09-24  
Ветка: `data-source-expansion`

## Вывод

Первый семейный проход был **непригоден для импорта**: арифметика сходилась, но повторный разрушительный аудит обнаружил системные семантические ошибки. Рабочая база калькулятора при этом не менялась.

Главная архитектурная ошибка: ранняя версия нормализации в одном месте сортировала слова. Это могло сближать продукты с одинаковыми словами, но разным смыслом — например, `almond oil` и `almonds, oil-roasted`, либо `pineapple juice` и `pineapple canned in juice pack`.

## Реально найденные и исправленные классы ошибок

- pumpkin seeds / leaves / flowers могли попадать в `pumpkin`;
- turnip greens — в `turnip`;
- broccoli raab / Chinese broccoli — в обычный `broccoli`;
- orange roughy и orange birch bolete — в `orange`;
- lemongrass — в `lemon`;
- oat milk — в `oat`;
- barley malt extract — в `barley`;
- soybean sprouts и edamame — в mature soybean;
- mature yellow beans — в yellow snap beans;
- baked beans — в обычные beans;
- amaranth leaves — в зерно амаранта;
- potato rösti / croquettes / puffs / sticks / skin — в обычный potato;
- apple cider vinegar / pectin / must — в apple;
- eggnog / omelet / pate / liqueur — в egg;
- corn dogs / pudding — в corn;
- salmon/cod/herring roe — в мясо соответствующей рыбы;
- cod liver — в cod;
- cod-liver oil — в cod liver;
- skin-only poultry — в thigh/other meat cuts;
- skinless chicken breast после первой коррекции мог ошибочно попасть в chicken skin;
- состояния `deep-frozen`, `without skin` и похожие формулировки создавали ложные отдельные семьи;
- правило `sweet potato / sweet potatoes` содержало реальную ошибку регулярного выражения и дробило обычный батат на технические псевдосемьи.

## Исправленный принцип

Семейства — только навигационный слой. Нутриентные значения не усредняются, не заменяются и не теряются.

Структура:
1. **Семья** — пользовательская группа продукта.
2. **Профиль** — сорт, вид, часть туши или другой содержательно значимый подтип.
3. **Вариант** — состояние и приготовление.

При сомнении продукты не объединяются: ложное разделение безопаснее ложного объединения.

Порядок слов сохраняется. Эквивалентные конструкции объединяются только отдельными явными правилами.

## Регрессионная защита

Проверки теперь явно запрещают повторное объединение, среди прочего:

- orange ↔ orange roughy / orange birch bolete;
- lemon ↔ lemongrass;
- pumpkin ↔ pumpkin seeds / leaves;
- turnip root ↔ turnip greens;
- broccoli ↔ rapini / Chinese broccoli;
- oats ↔ oat milk;
- barley ↔ barley malt extract;
- mature soybean ↔ edamame / soybean sprouts;
- mature yellow beans ↔ yellow snap beans;
- green beans ↔ baked beans;
- amaranth grain ↔ amaranth leaves;
- potato ↔ skin / croquettes / puffs;
- apple ↔ cider vinegar / pectin;
- egg ↔ eggnog;
- corn ↔ corn dog;
- almond oil ↔ oil-roasted almonds;
- pineapple juice ↔ pineapple canned in juice pack;
- salmon ↔ salmon roe;
- cod ↔ cod liver / cod roe;
- cod liver ↔ cod-liver oil;
- chicken skin ↔ skinless chicken breast;
- sweet potato ↔ leaves / flour.

## Последний пересчёт

Исходный core: **13 764 строки**.

В резерве остаются **84 записи**:
- 14 остаточных иностранных брендов;
- 68 технических/рыночно-специфичных мясных и жировых записей;
- 2 записи человеческого грудного молока.

В семейном слое: **13 680 исходных записей**.

После исправлений и нормализации:
- **6 906 навигационных семейств**;
- **8 627 профилей**;
- все **13 680 исходных нутриентных строк** остаются отдельно адресуемыми;
- сокращение 13 764 входных строк до навигационных семейств — примерно **49,8%**.

По сравнению с первоначальными 7 391 семейством эта цифра ниже не потому, что данные удалены, а потому что:
- ошибочно склеенные разные продукты были разделены;
- одновременно сотни ложных технических псевдосемейств (`deep-frozen`, `without skin` и т. п.) были корректно собраны обратно.

## Независимый контроль результата

Отдельный проверочный скрипт, не использующий внутренние проверки классификатора, прошёл без ошибок.

Проверено:
- 13 680 членов семей + 84 резервных = 13 764 входных записи;
- уникальность family ID и profile ID;
- отсутствие двойного членства исходной строки;
- отсутствие битых ссылок family/profile;
- суммы record_count и member_count обе равны 13 680;
- представители действительно принадлежат своим группам;
- набор известных опасных пар не объединяется;
- juice-pack не превращается в отдельный juice-продукт;
- oil-roasted nuts не превращаются в oil;
- skinless/without-skin не попадает в skin-only family;
- рыбная икра и печень отделены от мышечной части рыбы;
- растительное молоко отделено от исходного зерна/ореха.

## Статус

Это уже существенно безопаснее предыдущей версии, но всё ещё staging, а не готовый пользовательский каталог. Перед импортом нужно отдельно сопоставить эти 6 906 семейств с текущими 1 105 продуктами и проверить самые большие мясные/рыбные семейства.

Рабочая база калькулятора не изменялась.
