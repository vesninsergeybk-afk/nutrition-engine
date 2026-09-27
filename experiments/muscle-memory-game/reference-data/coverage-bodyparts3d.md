# Аудит покрытия BodyParts3D

Дата прохода: 2026-09-27.

## Что сравнивается

Источник 3D-имён: `bodyparts4-muscles-ru.js` из рабочей ветки тренажёра.

Справочник: канонические региональные карточки из `reference-data/regions/` плюс техническое сопоставление `model-aliases.js`.

Аудит не считает одну и ту же мышцу новой сущностью только потому, что BodyParts3D хранит её:
- справа и слева отдельно;
- по частям или головкам;
- под историческим или альтернативным английским названием;
- как региональную часть глубокой мышечной группы.

## Текущее состояние

- 307 уникальных английских имён в словаре BodyParts3D после удаления дублирования.
- 174 канонические структуры в региональной справочной базе на момент аудита.
- 51 явное техническое сопоставление BodyParts3D → каноническая карточка/учебная группа.
- 42 имени остаются без справочной карточки или группового сопоставления.

## Оставшиеся 42 имени

### Не входят в текущий справочник скелетных мышц — 5

Сосочковые мышцы желудочков сердца:
- anterolateral head of lateral papillary muscle of left ventricle;
- anterior papillary muscle of right ventricle;
- lateral papillary muscle of left ventricle;
- posterior papillary muscle of right ventricle;
- septal papillary muscle of right ventricle.

Они относятся к миокарду и не должны искусственно включаться в справочник скелетных мышц. Если позже появится отдельный раздел сердца, их следует описывать там.

### Тазовое дно и промежность — 7

- coccygeus;
- iliococcygeus;
- pubococcygeus;
- puborectalis;
- pubo-analis;
- external anal sphincter;
- superficial perineal muscle.

Это самостоятельный следующий региональный блок. Его не следует смешивать с ягодичной областью.

### Глазодвигательный аппарат — 7

- superior rectus;
- inferior rectus;
- medial rectus;
- lateral rectus;
- superior oblique;
- inferior oblique;
- levator palpebrae superioris.

Эти структуры относятся к орбите и требуют отдельной подкарты внутри головы.

### Язык, глотка, мягкое нёбо и гортань — 23

- genioglossus;
- hyoglossus;
- superior pharyngeal constrictor;
- middle pharyngeal constrictor;
- inferior pharyngeal constrictor;
- stylopharyngeus;
- palatopharyngeus;
- levator veli palatini;
- tensor veli palatini;
- uvular muscle;
- cricothyroid;
- straight part of cricothyroid;
- oblique part of cricothyroid;
- posterior crico-arytenoid;
- lateral crico-arytenoid;
- transverse arytenoid;
- oblique arytenoid;
- aryepiglotticus;
- ary-epiglottic part of oblique arytenoid;
- thyro-arytenoid;
- external part of thyro-arytenoid;
- thyro-epiglottic part of thyro-arytenoid;
- vocalis.

Части одной мышцы не должны автоматически становиться независимыми учебными карточками. Для cricothyroid, oblique arytenoid и thyro-arytenoid сначала нужна каноническая карточка мышцы, затем дочерние 3D-части.

## Уже закрытые пробелы этого прохода

Добавлены самостоятельные карточки:
- adductor minimus — с пометкой, что это вариабельно выделяемая верхняя часть приводящего отдела adductor magnus;
- opponens digiti minimi pedis — вариабельная глубокая мышца латеральной группы подошвы;
- levator labii superioris alaeque nasi;
- depressor septi nasi;
- temporoparietalis.

Для глубоких мышц спины, которые BodyParts3D делит по отделам, создан технический слой `model-aliases.js`. Он сохраняет точное имя выбранного mesh-объекта и связывает его с канонической учебной карточкой группы без создания ложного дублирования фактов.

## Следующий проход

1. Не менять фронтенд тренажёра.
2. Дождаться/забрать изменения параллельной справочной ветки по глотке, гортани и levator ani, если они уже готовятся.
3. Добавить недостающие внутренние мышцы головы и шеи как подкарты «Орбита», «Язык», «Глотка и мягкое нёбо», «Гортань».
4. Добавить отдельный регион «Тазовое дно и промежность».
5. Повторить автоматический аудит BodyParts3D. Целевое состояние: все скелетные мышцы имеют exact- или group-покрытие; пять сосочковых мышц сердца остаются явным системным исключением.
