# Проверка 112 сильных кандидатов внешней продуктовой базы — российская релевантность

Дата: 2026-09-26  
Ветка: `data-source-expansion`

## Итог

Исходный shortlist: **112** кандидатов, которые встречаются минимум в двух независимых официальных базах и ранее не имели найденного прямого/широкого аналога в текущем каталоге.

После проверки:
- **47 — ADD_CORE**: добавить в основной reference-каталог после русской локализации;
- **37 — ADD_EXTENDED**: полезные позиции для расширенного поиска;
- **11 — MERGE_EXISTING**: не новые базовые продукты, привязать к существующим семьям;
- **3 — REBUILD_FAMILY**: семейства построены неправильно; импорт запрещён до разделения;
- **14 — RESERVE_NOT_CORE**: сохранить в резерве, но не выводить в основной поиск.

Сумма: **112 / 112**.

## Критические ошибки, обнаруженные при повторной проверке

1. `Catfish` смешивал channel catfish (сом) и wolffish / Atlantic wolffish (зубатка). Это разные рыбы.
2. `Pike` смешивал northern pike (щука), pike-perch / zander (судак) и walleye. Семейство должно быть разделено.
3. `Cheese Mexican Queso` объединял Chihuahua, Asadero, Cotija и Añejo — это разные сыры.

Эти три семейства нельзя импортировать как единый продукт.

## ADD_CORE — 47

- Carp → Карп
- Rhubarb → Ревень
- Cheese Tilsit → Сыр тильзитер
- Cheese Camembert → Сыр камамбер
- Cheese Blue → Сыр с голубой плесенью
- Cheese Brie → Сыр бри
- Oil Coconut → Масло кокосовое
- Coconut Water Liquid From Coconut → Кокосовая вода
- Flour Chickpea → Мука нутовая
- Flour Soy → Мука соевая
- Cheese Swiss → Сыр швейцарского типа
- Ocean Perch → Морской окунь (Sebastes)
- Perch → Окунь
- Cheese Goat Soft → Сыр козий мягкий
- Coconut Meat Desiccated → Кокосовая стружка / сушёная мякоть кокоса без сахара
- Flour Barley → Мука ячменная
- Flour Buckwheat → Мука гречневая
- Flour Oat → Мука овсяная
- Spice Rosemary → Розмарин
- Spice Thyme → Тимьян
- Cheese Goat Hard → Сыр козий твёрдый
- Cheese Gruyere → Сыр грюйер
- Cheese Havarti → Сыр хаварти
- Flour Spelt → Мука полбяная
- Milk Sheep → Молоко овечье
- Oil Avocado → Масло авокадо
- Spice Allspice Ground → Перец душистый молотый
- Spice Anise Seed → Анис, семена
- Spice Bay Leaf → Лавровый лист
- Spice Caraway Seed → Тмин, семена
- Spice Cinnamon Ground → Корица молотая
- Spice Clove Ground → Гвоздика молотая
- Spice Curry Powder → Карри, смесь специй
- Spice Fennel Seed → Фенхель, семена
- Spice Fenugreek Seed → Пажитник, семена
- Spice Garlic Powder → Чеснок сушёный молотый
- Spice Marjoram → Майоран
- Spice Nutmeg Ground → Мускатный орех молотый
- Spice Onion Powder → Лук сушёный молотый
- Spice Paprika → Паприка молотая
- Spice Pepper Red Or Cayenne → Перец кайенский / красный острый молотый
- Spice Pepper White → Перец белый
- Spice Saffron → Шафран
- Spice Sage Ground → Шалфей молотый
- Spice Savory Ground → Чабер
- Spice Tarragon → Эстрагон
- Spice Turmeric Ground → Куркума молотая

## ADD_EXTENDED — 37

- Lobster → Омар / лобстер
- Swordfish → Рыба-меч
- Cheese Muenster → Сыр мюнстер
- Cheese Provolone → Сыр проволоне
- Oil Safflower → Масло сафлоровое
- Cheese Limburger → Сыр лимбургер
- Oil Peanut → Масло арахисовое
- Cheese Fontina → Сыр фонтина
- Oil Almond → Масло миндальное пищевое
- Oil Hazelnut → Масло фундучное пищевое
- Bean Pinto → Фасоль пинто
- Bean Yellow → Фасоль жёлтая, зрелые семена
- Snapper → Луциан / snapper
- Flour Peanut → Мука арахисовая
- Game Meat Goat → Козлятина
- Cheese Monterey Jack → Сыр Monterey Jack
- Flour Potato → Картофельная мука (не крахмал)
- Sunflower Seed Butter → Паста из семян подсолнечника
- Cheese Brick → Сыр Brick
- Cheese Cheshire → Сыр Cheshire
- Cheese Colby → Сыр Colby
- Cheese Gjetost → Сыр Gjetost / brunost
- Cheese Neufchatel → Сыр Neufchâtel
- Cheese Romano → Сыр Romano
- Coconut Meat Desiccated Creamed → Кокосовая паста / creamed coconut
- Flour Arrowroot → Мука / крахмал аррорута
- Flour Millet → Мука пшённая
- Oil Apricot Kernel → Масло абрикосовой косточки пищевое
- Oil Cocoa Butter → Какао-масло пищевое
- Oil Mustard → Масло горчичное
- Oil Rice Bran → Масло рисовых отрубей
- Oil Wheat Germ → Масло зародышей пшеницы
- Sesame Flour High Fat → Мука кунжутная
- Spice Celery Seed → Сельдерей, семена
- Spice Chervil → Кервель сушёный
- Spice Mace Ground → Мацис молотый
- Sunflower Seed Flour Partially Defatted → Мука подсолнечная частично обезжиренная

## MERGE_EXISTING — 11

- Bean Navy → подтип белой фасоли; связать с текущей белой фасолью / cannellini
- Bean Pinto Solid → консервированная фасоль пинто; вариант внутри семьи pinto
- Game Meat Horse → конина уже есть в текущем каталоге
- Oil Butter → пользовательски связать с гхи / топлёным маслом, сохранив технический профиль
- Pine Nut Pinyon → подтип текущих сосновых / кедровых орехов
- Sesame Seed Whole And → жареный кунжут; вариант текущих семян кунжута
- Spice Poppy Seed → мак пищевой уже есть
- Coconut Meat Desiccated Flaked → вариант сушёного кокоса
- Coconut Meat Desiccated Flaked Packaged → вариант сушёного кокоса
- Coconut Meat Desiccated Shredded → вариант сушёного кокоса
- Sesame Flour Partially Defatted → профиль семьи кунжутной муки

## REBUILD_FAMILY — 3

- Catfish → разделить сом / wolffish (зубатка)
- Pike → разделить щука / судак-pike-perch-zander / walleye
- Cheese Mexican Queso → разделить Chihuahua / Asadero / Cotija / Añejo

## RESERVE_NOT_CORE — 14

- Oil Cod Liver
- Bean Sprouts Navy
- Bean Sprouts Pinto
- Cowpea Leafy Tips
- Cowpea Young Pods Seed
- Bean Pinto Immature
- Cheese Caraway
- Oil Herring
- Oil Oat
- Oil Palm
- Oil Palm Kernel
- Oil Salmon
- Oil Sardine
- Sesame Meal Partially Defatted

## Проверка российской релевантности

Текущие российские магазины подтверждают практическую доступность продуктов из ключевых core-категорий: карп, щука и судак; бри, камамбер, тильзитер и голубые сыры; овсяная, гречневая, ячменная, полбяная и нутовая мука.

Действующие в 2026 году декларации соответствия дополнительно подтверждают пищевой оборот широкого ряда специализированных масел (кокосовое, авокадо, арахисовое, миндальное, сафлоровое, горчичное и др.) и специй/пряностей (тимьян, розмарин, шафран, куркума, паприка, фенхель, пажитник и др.).

Это подтверждает пригодность этих групп для российского каталога, но не означает одинаковую массовость каждого отдельного продукта.

## Следующий безопасный шаг

1. Исправить три REBUILD_FAMILY.
2. Подготовить 47 ADD_CORE как первый staging-import.
3. 37 ADD_EXTENDED оставить доступными только в расширенном поиске.
4. 11 MERGE_EXISTING использовать для обогащения/вариантов уже имеющихся продуктов.
5. 14 RESERVE_NOT_CORE не выводить в пользовательский основной каталог.

Production `main` на этом этапе не изменяется.
