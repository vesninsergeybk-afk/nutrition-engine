# Отчёт P1.4 — Formula Registry & Independent Golden Cases

Версия: `v5.3.210-p1.4`  
Дата: 18 июля 2026 года

## 1. Результат

Создан единый версионируемый реестр расчётных формул:

- 29 формул и правил;
- 113 golden cases;
- 29 из 29 формул покрыты;
- не менее двух случаев на каждую материальную формулу;
- 8 зарегистрированных классов источников/источников;
- modern и legacy получают один и тот же сгенерированный набор данных.

## 2. Классификация

| Класс | Количество | Значение |
|---|---:|---|
| `AUTHORITATIVE` | 14 | Формула или scoring method опирается на внешний авторитетный или первичный источник |
| `LOCAL_POLICY` | 7 | Локальная политика калькулятора; не универсальная клиническая рекомендация |
| `DECISION_RULE` | 1 | Категориальное правило решения с проверкой границ |
| `DERIVED` | 5 | Производное вычисление из уже выбранных параметров |
| `ARITHMETIC` | 2 | Базовая размерностная арифметика |

## 3. Зарегистрированные формулы

### Антропометрия и безопасность

- `anthropometry.bmi`;
- `anthropometry.devine_ibw`;
- `anthropometry.adjusted_weight`;
- `anthropometry.weight_loss_pct`;
- `safety.nice_refeeding_screen`.

### Энергия, белок, макронутриенты, жидкость и приёмы пищи

- `energy.mifflin_st_jeor`;
- `energy.ordinary_pal`;
- `energy.weight_screen`;
- `energy.goal_factor`;
- `protein.ordinary_target`;
- `macros.fat_share`;
- `macros.carb_residual`;
- `fluids.ordinary_screen`;
- `meals.energy_split`.

### Жизненные стадии

- `energy.nasem_adult_female_2023`;
- `energy.nasem_pregnancy_2023`;
- `energy.nasem_lactation_2023`;
- `protein.efsa_pregnancy`;
- `protein.efsa_lactation`.

### Продуктовая и нормативная арифметика

- `product.per100_scaling`;
- `product.salt_to_sodium`;
- `ration.nutrient_sum`;
- `norm.per_mj`;
- `norm.percent_energy_to_grams`.

### HEI-2020

- `hei.density`;
- `hei.adequacy_component`;
- `hei.moderation_component`;
- `hei.fatty_acid_ratio`;
- `hei.total`.

## 4. Источники

Реестр содержит ссылки и идентификаторы для:

- первичной публикации Mifflin–St Jeor;
- NASEM Dietary Reference Intakes for Energy 2023;
- NICE CG32 по nutritional support и refeeding risk;
- официальной методологии HEI-2020 NCI;
- EFSA dietary reference values;
- исторической формулы Devine;
- математических тождеств;
- внутренней локальной политики калькулятора.

## 5. Golden cases

Набор включает:

- обычные, минимальные и пограничные значения;
- мужчин и женщин для Mifflin–St Jeor;
- границы NICE по ИМТ, потере массы и длительности недостаточного питания;
- варианты PAL;
- триместры беременности и BMI-зависимую energy deposition;
- периоды и типы лактации;
- EFSA-добавки белка;
- полное линейное интерполирование HEI между 0 и максимумом;
- perfect и zero HEI totals;
- масштабирование продуктов, преобразование соли и суммирование.

## 6. Runtime traceability

Каждый применённый расчёт может вернуть:

- `registryVersion`;
- `registrySha256`;
- `formulaIds`;
- метаданные каждой формулы.

Трассировка включена в:

- расчёт потребностей;
- protected NASEM profiles;
- продуктовую арифметику;
- HEI;
- report model и report snapshot;
- печатный/PDF-отчёт.

## 7. Ключевой принцип

Внешняя методика и локальная продуктовая политика не смешиваются. Например, уравнение Mifflin–St Jeor зарегистрировано как внешняя формула, тогда как выбранный PAL-коридор и локальный диапазон результата зарегистрированы отдельно как `LOCAL_POLICY`.

## 8. Ограничения

- Реестр не доказывает клиническую применимость формулы для каждого пациента.
- Golden cases не заменяют внешний экспертный review.
- Историческая формула Devine описана как историческое расчётное правило, а не как цель массы тела.
- Локальные политики требуют отдельного продуктового и клинического управления версиями.
