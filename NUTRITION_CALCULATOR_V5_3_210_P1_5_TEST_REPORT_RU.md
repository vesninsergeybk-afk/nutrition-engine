# Отчёт испытаний P1.5

Версия: `v5.3.210-p1.5`  
Дата: 18 июля 2026 года

## Итог

P1.5 прошёл полный локальный release gate без сборки артефактов:

- **31 suite — PASS**;
- **402 агрегированных assertions — PASS**;
- P1.5 contract/static — **29/29 PASS**;
- Chromium P1.5 — **3/3 PASS**;
- общий Chromium accessibility/security gate — **4/4 PASS**;
- Chromium formula registry — **3/3 PASS**;
- P1.4 formula runtime — **108/108 PASS**;
- P1.3 provenance — **19/19 PASS**;
- P1.2 normative registry — **74/74 PASS**;
- runtime consolidation — **53/53 PASS**;
- runtime closure — **242/242 файла**;
- DOM regression — **10/10 PASS**;
- CSRF HTTP — **12/12 PASS**;
- Apache source staging — **9/9 PASS**.

## Статический контроль

Финальный чистый исходный scope воспроизводит **1976/1976 PASS**:

- JavaScript syntax — 339;
- PHP syntax — 8;
- JSON parse — 171;
- HTML integrity — 19;
- permissions — 730;
- secret scan — 696;
- version/workflow — 13.

Проверяются:

- JavaScript syntax;
- PHP syntax;
- JSON parse;
- HTML resource integrity и уникальность ID;
- права доступа;
- отсутствие дублирования секретов;
- release markers и immutable GitHub Actions.

## Browser-сценарии P1.5

1. Пустой desktop показывает короткий маршрут, скрывает неприменимые результаты и остаётся ниже установленного лимита высоты.
2. После расчёта потребностей CTA переводит пользователя к продуктам; после добавления банана появляется краткий итог, а полные totals/HEI открываются по запросу.
3. Mobile 390×844 не имеет горизонтального overflow, основной CTA фокусируется клавиатурой и переводит к форме потребностей.

## Найденный и устранённый дефект финального прохода

Первый полный accessibility gate обнаружил шесть нарушений `color-contrast` в новых P1.5 подписях. Причина: светлая тема карточек сочеталась с переменными muted/accent от альтернативной темы. Тест не ослаблялся. Для P1.5 light surfaces введены фиксированные контрастные токены, после чего desktop и mobile axe-проверки прошли без blocking violations.

## Ограничения

Локально проверен системный Chromium. Firefox и WebKit закреплены в CI-профиле quality gate. Автоматизированные проверки не являются внешним модерируемым usability study.
