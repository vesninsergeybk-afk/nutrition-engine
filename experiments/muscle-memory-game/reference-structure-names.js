// Russian labels for named objects in the pinned Z-Anatomy GLBs.
// Labels describe the source geometry; they do not infer individual spinal levels.
const terms = new Map();
function add(rows) {
  for (const row of rows.trim().split('\n')) {
    const [en, ru] = row.split('|');
    terms.set(en.trim().toLowerCase(), ru.trim());
  }
}
add(`
Central canal|Центральный канал спинного мозга
Olfactory nerve|Обонятельный нерв
Inferior alveolar nerve|Нижний альвеолярный нерв
Mental nerve|Подбородочный нерв
Nerve to mylohyoid muscle|Нерв челюстно-подъязычной мышцы
Buccal nerve|Щёчный нерв
Posterior division of mandibular nerve|Задняя часть нижнечелюстного нерва
Anterior division of mandibular nerve|Передняя часть нижнечелюстного нерва
Lingual nerve|Язычный нерв
Maxillary nerve|Верхнечелюстной нерв
Ophthalmic nerve|Глазной нерв
Meningeal branch of maxillary nerve|Менингеальная ветвь верхнечелюстного нерва
Chorda tympani|Барабанная струна
Vestibular nerve|Преддверный нерв
Cochlear nerve|Улитковый нерв
Vestibulocochlear nerve|Преддверно-улитковый нерв
Glossopharyngeal nerve|Языкоглоточный нерв
Superior trunk of brachial plexus|Верхний ствол плечевого сплетения
Middle trunk of brachial plexus|Средний ствол плечевого сплетения
Inferior trunk of brachial plexus|Нижний ствол плечевого сплетения
Roots of brachial plexus|Корешки плечевого сплетения
Subclavian nerve|Подключичный нерв
Posterior cord of brachial plexus|Задний пучок плечевого сплетения
Posterior interosseous nerve of forearm|Задний межкостный нерв предплечья
Posterior antebrachial cutaneous nerve|Задний кожный нерв предплечья
Inferior lateral brachial cutaneous nerve|Нижний латеральный кожный нерв плеча
Superior lateral brachial cutaneous nerve|Верхний латеральный кожный нерв плеча
Medial brachial cutaneous nerve|Медиальный кожный нерв плеча
Anterior interosseous nerve of forearm|Передний межкостный нерв предплечья
Intercostal nerves|Межрёберные нервы
Ilio-inguinal nerve|Подвздошно-паховый нерв
Infrapatellar branch of saphenous nerve|Поднадколенниковая ветвь подкожного нерва
Medial crural cutaneous branches of saphenous nerve|Медиальные кожные ветви голени подкожного нерва
Sural nerve|Икроножный нерв
Sural communicating branch of common fibular nerve|Икроножная соединительная ветвь общего малоберцового нерва
Medial sural cutaneous nerve|Медиальный кожный нерв икры
Anterior cutaneous branches of femoral nerve|Передние кожные ветви бедренного нерва
Femoral branch of genitofemoral nerve|Бедренная ветвь бедренно-полового нерва
Genital branch of genitofemoral nerve|Половая ветвь бедренно-полового нерва
Medial dorsal cutaneous nerve of foot|Медиальный тыльный кожный нерв стопы
Intermediate dorsal cutaneous nerve of foot|Промежуточный тыльный кожный нерв стопы
Sympathetic nerves|Симпатические нервы
Sympathetic trunk|Симпатический ствол
Superior subscapular nerve|Верхний подлопаточный нерв
Inferior subscapular nerve|Нижний подлопаточный нерв
Nerve to piriformis muscle|Нерв грушевидной мышцы
Nerve to quadratus femoris muscle|Нерв квадратной мышцы бедра
Anterior root of posterior femoral cutaneous nerve|Передний корешок заднего кожного нерва бедра
Posterior root of posterior femoral cutaneous nerve|Задний корешок заднего кожного нерва бедра
Fourth ventricle|Четвёртый желудочек головного мозга
Olive|Олива продолговатого мозга
Pyramid of medulla oblongata|Пирамида продолговатого мозга
Medulla oblongata|Продолговатый мозг
Anterior cochlear nucleus|Переднее улитковое ядро
Inferior salivatory nucleus|Нижнее слюноотделительное ядро
Nucleus ambiguus|Двойное ядро
Nucleus of hypoglossal nerve|Ядро подъязычного нерва
Nucleus of solitary tract|Ядро одиночного пути
Posterior cochlear nucleus|Заднее улитковое ядро
Posterior nucleus of vagus nerve|Заднее ядро блуждающего нерва
Aqueduct of midbrain|Водопровод среднего мозга
Base of peduncle|Основание ножки мозга
Nucleus of trochlear nerve|Ядро блокового нерва
Accessory nucleus of oculomotor nerve|Добавочное ядро глазодвигательного нерва
Nucleus of oculomotor nerve|Ядро глазодвигательного нерва
Red nucleus|Красное ядро
Interpeduncular fossa|Межножковая ямка
Midbrain|Средний мозг
Inferior colliculus|Нижний холмик
Superior colliculus|Верхний холмик
Pons|Мост
Motor nucleus of facial nerve|Двигательное ядро лицевого нерва
Nucleus of abducens nerve|Ядро отводящего нерва
Superior salivatory nucleus|Верхнее слюноотделительное ядро
Vestibular nuclei|Вестибулярные ядра
Anterior quadrangular lobule|Передняя четырёхугольная долька мозжечка
Biventral lobule|Двубрюшная долька мозжечка
Central lobule|Центральная долька мозжечка
Culmen|Вершина червя мозжечка
Declive|Скат червя мозжечка
Flocculus|Клочок мозжечка
Folium of vermis|Листок червя мозжечка
Gracile lobule|Тонкая долька мозжечка
Inferior semilunar lobule|Нижняя полулунная долька мозжечка
Lingula of cerebellum|Язычок мозжечка
Nodule of vermis|Узелок червя мозжечка
Peduncle of flocculus|Ножка клочка мозжечка
Posterior quadrangular lobule|Задняя четырёхугольная долька мозжечка
Pyramis of vermis|Пирамида червя мозжечка
Superior cerebellar peduncle|Верхняя ножка мозжечка
Superior semilunar lobule|Верхняя полулунная долька мозжечка
Tonsil of cerebellum|Миндалина мозжечка
Tuber of vermis|Бугор червя мозжечка
Uvula of vermis|Язычок червя мозжечка
Wing of central lobule|Крыло центральной дольки мозжечка
Habenula|Поводок
Hypothalamus|Гипоталамус
Lateral geniculate body|Латеральное коленчатое тело
Mamillary body|Сосцевидное тело
Medial geniculate body|Медиальное коленчатое тело
Optic chiasm|Зрительный перекрёст
Optic tract|Зрительный тракт
Thalamus|Таламус
Third ventricle|Третий желудочек головного мозга
Posterior commissure|Задняя спайка мозга
Stria medullaris thalami|Мозговая полоска таламуса
Amygdaloid body|Миндалина головного мозга
Septal nuclei|Ядра перегородки
Caudate nucleus|Хвостатое ядро
Putamen|Скорлупа
Globus pallidus|Бледный шар
Lentiform nucleus|Чечевицеобразное ядро
Lat Fis-ant-Horizont|Передняя горизонтальная ветвь латеральной борозды
Lat Fis-ant-Vertical|Передняя восходящая ветвь латеральной борозды
Middle frontal gyrus|Средняя лобная извилина
Orbital gyri (Frontomarginal gyrus and sulcus*)|Лобнокраевая извилина и борозда
Orbital gyri|Глазничные извилины
Orbital part of inferior frontal gyrus|Глазничная часть нижней лобной извилины
Orbital sulci (H-shaped orbital sulci*)|Н-образные глазничные борозды
Orbital sulci (Lateral Orbital sulcus*)|Латеральная глазничная борозда
Paracentral gyrus and sulcus*|Парацентральная извилина и борозда
Precentral gyrus|Предцентральная извилина
Inferior frontal sulcus|Нижняя лобная борозда
Olfactory sulcus|Обонятельная борозда
Opercular part of inferior frontal gyrus|Покрышечная часть нижней лобной извилины
Paracentral sulcus|Парацентральная борозда
Precentral sulcus (inferior part)*|Нижняя часть предцентральной борозды
Precentral sulcus (Superior part)*|Верхняя часть предцентральной борозды
Straight gyrus (Gyrus rectus)|Прямая извилина
Superior frontal gyrus|Верхняя лобная извилина
Superior frontal sulcus|Верхняя лобная борозда
Transverse frontopolar gyrus and sulcus*|Поперечная лобнополюсная извилина и борозда
Triangular part of inferior frontal gyrus|Треугольная часть нижней лобной извилины
Insula (Subcentral gyrus and ant. and post. sulci*)|Подцентральная извилина и её передняя и задняя борозды
Posterior transverse collateral sulcus|Задняя поперечная коллатеральная борозда
Anterior occipital sulcus*|Передняя затылочная борозда
Central sulcus|Центральная борозда
Circular sulcus of insula|Круговая борозда островка
Collateral sulcus|Коллатеральная борозда
Lat Fis-post|Задняя ветвь латеральной борозды
Parieto-occipital sulcus|Теменно-затылочная борозда
Subparietal sulcus|Подтеменная борозда
Sulcus interm prim-Jensen|Промежуточная борозда Йенсена
Lateral ventricle|Боковой желудочек головного мозга
Cingulate gyrus (Posteroventral part*)|Задняя вентральная часть поясной извилины
Cingulate gyrus and sulcus (Middle anterior part)|Средняя передняя часть поясной извилины и борозды
Cingulate gyrus and sulcus (Middle posterior part)|Средняя задняя часть поясной извилины и борозды
Cingulate gyrus and sulcus (Posterior dorsal part)|Задняя дорсальная часть поясной извилины и борозды
Cingulate sulcus (Marginal part*)|Краевая ветвь поясной борозды
Hippocampus|Гиппокамп
Calcarine sulcus|Шпорная борозда
Cuneus|Клин
Inferior occipital gyrus and sulcus*|Нижняя затылочная извилина и борозда
Lateral occipital gyrus (Middle occipital gyrus*)|Латеральная затылочная извилина (средняя затылочная извилина)
Lingual gyrus|Язычная извилина
Lunate sulcus|Полулунная борозда
Occipital pole|Затылочный полюс
Superior occipital gyri|Верхние затылочные извилины
Transverse occipital sulcus|Поперечная затылочная борозда
Angular gyrus|Угловая извилина
Postcentral gyrus|Постцентральная извилина
Precuneus|Предклинье
Intraparietal sulcus|Внутритеменная борозда
Postcentral sulcus|Постцентральная борозда
Superior parietal lobule|Верхняя теменная долька
Supramarginal gyrus|Надкраевая извилина
Inferior temporal gyrus|Нижняя височная извилина
Lateral occipitotemporal gyrus|Латеральная затылочно-височная извилина
Medial occipitotemporal gyrus (Parahippocampal*)|Медиальная затылочно-височная извилина (парагиппокампальная извилина)
Middle temporal gyrus|Средняя височная извилина
Occipitotemporal sulcus (Lateral part*)|Латеральная часть затылочно-височной борозды
Inferior temporal sulcus|Нижняя височная борозда
Superior temporal gyrus (Lateral part)|Латеральная часть верхней височной извилины
Superior temporal sulcus|Верхняя височная борозда
Temporal plane|Височная плоскость
Temporal pole|Височный полюс
Transverse temporal gyri|Поперечные височные извилины
Septum pellucidum|Прозрачная перегородка
Stria terminalis|Конечная полоска
Anterior commissure|Передняя спайка мозга
Corpus callosum|Мозолистое тело
Hippocampal commissure|Спайка гиппокампа
Fornix|Свод мозга
White matter of telencephalon|Белое вещество конечного мозга
Falx cerebri|Серп большого мозга
Tentorium cerebelli|Намёт мозжечка
Spinal dura|Твёрдая оболочка спинного мозга
Choroid plexus|Сосудистое сплетение
Anterior horn of spinal cord|Передний рог спинного мозга
Nucleus of accessory nerve|Ядро добавочного нерва
Intermediolateral nucleus|Промежуточно-латеральное ядро
Intermediomedial nucleus|Промежуточно-медиальное ядро
Lateral intermediate substance|Латеральное промежуточное вещество
Nucleus proprius|Собственное ядро заднего рога спинного мозга
Posterior horn of spinal cord|Задний рог спинного мозга
Spinal reticular process|Ретикулярный отросток спинного мозга
Anterior corticospinal tract|Передний корково-спинномозговой путь
Anterior fasciculus proprius|Передний собственный пучок
Lateral vestibulospinal tract|Латеральный преддверно-спинномозговой путь
Medial reticulospinal tract|Медиальный сетчато-спинномозговой путь
Medial vestibulospinal tract|Медиальный преддверно-спинномозговой путь
Tectospinal tract|Покрышечно-спинномозговой путь
Anterior spinothalamic tract|Передний спинноталамический путь
Lateral spinothalamic tract|Латеральный спинноталамический путь
Spinotectal tract|Спинопокрышечный путь
Anterior spinocerebellar tract|Передний спинномозжечковый путь
Lateral corticospinal tract|Латеральный корково-спинномозговой путь
Lateral fasciculus proprius|Латеральный собственный пучок
Lateral reticulospinal tract|Латеральный сетчато-спинномозговой путь
Posterior spinocerebellar tract|Задний спинномозжечковый путь
Rubrospinal tract|Красноядерно-спинномозговой путь
Cuneate fasciculus|Клиновидный пучок
Gracile fasciculus|Тонкий пучок
Posterior fasciculus proprius|Задний собственный пучок
Posterolateral tract|Заднелатеральный путь
White matter of spinal cord|Белое вещество спинного мозга
Ganglia of sympathetic trunk|Узлы симпатического ствола
Motor root of trigeminal nerve|Двигательный корешок тройничного нерва
Sensory root of trigeminal nerve|Чувствительный корешок тройничного нерва
Tympanic membrane|Барабанная перепонка
Cochlea|Улитка
Vestibule|Преддверие внутреннего уха
Auditory tube|Слуховая труба
Ampulla of lacrimal canaliculus|Ампула слёзного канальца
Lacrimal canaliculus|Слёзный каналец
Lacrimal gland|Слёзная железа
Lacrimal sac|Слёзный мешок
Nasolacrimal duct|Носослёзный проток
Suspensory ligament of eyeball|Подвешивающая связка глазного яблока
Anterior chamber of eyeball|Передняя камера глазного яблока
Zonular fibres|Волокна ресничного пояска
Anterior segment of eyeball|Передний сегмент глазного яблока
Cornea|Роговица
Iris|Радужка
Lens|Хрусталик
Vitreous body|Стекловидное тело
Posterior segment of eyeball|Задний сегмент глазного яблока
Retina|Сетчатка
Sclera|Склера
Parotid duct|Проток околоушной железы
Submandibular duct|Проток поднижнечелюстной железы
Accessory pancreatic duct|Добавочный проток поджелудочной железы
Ductus deferens|Семявыносящий проток
Ejaculatory duct|Семявыбрасывающий проток
Greater omentum|Большой сальник
Lesser omentum|Малый сальник
Meso-appendix|Брыжейка червеобразного отростка
Mesocolon|Брыжейка ободочной кишки
Free taenia|Свободная лента ободочной кишки
Mesocolic taenia|Брыжеечная лента ободочной кишки
Omental taenia|Сальниковая лента ободочной кишки
Mucosa of stomach|Слизистая оболочка желудка
Anterior lateral segment of liver|Передний латеральный сегмент печени (VI)
Anterior medial segment of liver|Передний медиальный сегмент печени (V)
Left anterior lateral segment of liver|Левый передний латеральный сегмент печени (III)
Left medial segment of liver|Левый медиальный сегмент печени (IV)
Left posterior lateral segment of liver|Левый задний латеральный сегмент печени (II)
Posterior lateral segment of liver|Задний латеральный сегмент печени (VII)
Posterior medial segment of liver|Задний медиальный сегмент печени (VIII)
Posterior segment of liver|Задний сегмент печени (I)
Laryngopharynx|Гортанная часть глотки
Nasopharynx|Носовая часть глотки
Oropharynx|Ротовая часть глотки
Pharynx|Глотка
Gingiva|Десна
Accessory parotid gland|Добавочная околоушная железа
Soft palate|Мягкое нёбо
Uvula of palate|Нёбный язычок
Adenohypophysis|Аденогипофиз
Neurohypophysis|Нейрогипофиз
Inferior parathyroid gland|Нижняя паращитовидная железа
Superior parathyroid gland|Верхняя паращитовидная железа
Pineal gland|Шишковидная железа
Corpus cavernosum of penis|Пещеристое тело полового члена
Corpus spongiosum of penis|Губчатое тело полового члена
Glans penis|Головка полового члена
Seminal gland|Семенная железа (семенной пузырёк)
Mucosa of nasal cavity|Слизистая оболочка полости носа
Pleura|Плевра
Middle lobar bronchus|Среднедолевой бронх
Intermediate bronchus|Промежуточный бронх
Left main bronchus|Левый главный бронх
Right main bronchus|Правый главный бронх
Left superior lobar bronchus|Левый верхнедолевой бронх
Left inferior lobar bronchus|Левый нижнедолевой бронх
Right superior lobar bronchus|Правый верхнедолевой бронх
Right inferior lobar bronchus|Правый нижнедолевой бронх
Anteromedial basal segmental bronchus of left lung|Переднемедиальный базальный сегментарный бронх левого лёгкого
Apicoposterior segmental bronchus of left lung|Верхушечно-задний сегментарный бронх левого лёгкого
`);

const nerveGen = {
  'radial nerve': 'лучевого нерва', 'ulnar nerve': 'локтевого нерва',
  'median nerve': 'срединного нерва', 'axillary nerve': 'подмышечного нерва',
  'medial antebrachial cutaneous nerve': 'медиального кожного нерва предплечья',
  'obturator nerve': 'запирательного нерва',
  'superficial fibular nerve': 'поверхностного малоберцового нерва',
  'deep fibular nerve': 'глубокого малоберцового нерва',
  'medial plantar nerve': 'медиального подошвенного нерва',
  'lateral plantar nerve': 'латерального подошвенного нерва',
};
const nerveBranches = {
  'deep branch': 'Глубокая ветвь', 'superficial branch': 'Поверхностная ветвь',
  'anterior branch': 'Передняя ветвь', 'posterior branch': 'Задняя ветвь',
  'dorsal branch': 'Тыльная ветвь', 'palmar branch': 'Ладонная ветвь',
  'muscular branches': 'Мышечные ветви', 'dorsal digital branches': 'Тыльные пальцевые ветви',
  'proper palmar digital branches': 'Собственные ладонные пальцевые ветви',
  'common palmar digital branches': 'Общие ладонные пальцевые ветви',
  'proper plantar digital branches': 'Собственные подошвенные пальцевые ветви',
  'common plantar digital branches': 'Общие подошвенные пальцевые ветви',
};
terms.set('communicating branch of median nerve with ulnar nerve', 'Соединительная ветвь срединного нерва с локтевым нервом');
for (const level of ['superior', 'middle', 'inferior']) {
  const ru = {superior:'верхнего', middle:'среднего', inferior:'нижнего'}[level];
  for (const division of ['anterior', 'posterior']) {
    terms.set(`${division} division of ${level} trunk of brachial plexus`, `${division === 'anterior' ? 'Передняя' : 'Задняя'} ветвь ${ru} ствола плечевого сплетения`);
  }
}
const bronchialSegments = {
  superior:'Верхушечный', lateral:'Латеральный', medial:'Медиальный',
  anterior:'Передний', posterior:'Задний', apical:'Верхушечный',
  'anterior basal':'Передний базальный', 'posterior basal':'Задний базальный',
  'medial basal':'Медиальный базальный', 'lateral basal':'Латеральный базальный',
  'superior lingular':'Верхний язычковый', 'inferior lingular':'Нижний язычковый',
};

add(`
Left lobe of thymus|Левая доля тимуса
Right lobe of thymus|Правая доля тимуса
Spleen|Селезёнка
Palatine tonsil|Нёбная миндалина
Anterior tibial node|Передний большеберцовый лимфатический узел
Fibular node|Малоберцовый лимфатический узел
Intermediate deep inguinal node|Промежуточный глубокий паховый лимфатический узел
Intermediate lacunar node|Промежуточный лакунарный лимфатический узел
Lateral lacunar node|Латеральный лакунарный лимфатический узел
Medial lacunar node|Медиальный лакунарный лимфатический узел
Posterior tibial node|Задний большеберцовый лимфатический узел
Proximal deep inguinal node|Проксимальный глубокий паховый лимфатический узел
Suprapyloric node|Надпривратниковый лимфатический узел
Bucinator node|Щёчный лимфатический узел
Cystic node|Лимфатический узел жёлчного пузыря
Jugulodigastric node|Яремно-двубрюшный лимфатический узел
Lateral superior jugular node|Латеральный верхний яремный лимфатический узел
Mandibular node|Нижнечелюстной лимфатический узел
Nasolabial node|Носогубной лимфатический узел
Node of arch of azygos vein|Лимфатический узел дуги непарной вены
Node of ligamentum arteriosum|Лимфатический узел артериальной связки
`);
const lymphGroups = `
Retropyloric|Задние привратниковые
Subpyloric|Подпривратниковые
Anterior inferior jugular|Передние нижние яремные
Appendicular|Аппендикулярные
Brachial|Плечевые
Brachiocephalic|Плечеголовные
Central superior mesenteric|Центральные верхние брыжеечные
Coeliac|Чревные
Ileocolic|Подвздошно-ободочные
Inferior deep lateral cervical|Нижние глубокие латеральные шейные
Inferior diaphragmatic|Нижние диафрагмальные
Inferior epigastric|Нижние надчревные
Inferior gluteal|Нижние ягодичные
Inferior pancreatic|Нижние поджелудочные
Inferior superficial inguinal|Нижние поверхностные паховые
Inferior tracheobronchial|Нижние трахеобронхиальные
Infra-auricular|Подушные
Infraclavicular|Подключичные
Intercostal|Межрёберные
Intermediate common iliac|Промежуточные общие подвздошные
Intermediate external iliac|Промежуточные наружные подвздошные
Intermediate lumbar|Промежуточные поясничные
Interpectoral|Межгрудные
Intraglandular parotid|Внутрижелезистые околоушные
Intrapulmonary|Внутрилёгочные
Juxta-intestinal mesenteric|Околокишечные брыжеечные
Juxta-oesophageal|Околопищеводные
Lateral aortic|Латеральные аортальные
Lateral caval|Латеральные кавальные
Lateral common iliac|Латеральные общие подвздошные
Lateral pericardial|Латеральные перикардиальные
Lateral sacral|Латеральные крестцовые
Lateral vesical|Латеральные мочепузырные
Left colic|Левые ободочные
Mastoid|Сосцевидные
Medial common iliac|Медиальные общие подвздошные
Medial external iliac|Медиальные наружные подвздошные
Median sacral|Срединные крестцовые
Middle colic|Средние ободочные
Obturator|Запирательные
Occipital|Затылочные
Paracolic superior mesenteric|Околоободочные верхние брыжеечные
Pararectal|Околопрямокишечные
Parasternal|Окологрудинные
Paratracheal cervical|Околотрахеальные шейные
Paratracheal thoracic|Околотрахеальные грудные
Postvesical|Позадимочепузырные
Pre-aortic|Предаортальные
Pre-auricular|Предушные
Precaecal|Предслепокишечные
Precaval|Предкавальные
Prepericardial|Предперикардиальные
Pretracheal|Предтрахеальные
Prevertebral|Предпозвоночные
Prevesical|Предмочепузырные
Retro-aortic|Позадиаортальные
Retrocaecal|Позадислепокишечные
Retrocaval|Позадикавальные
Retropharyngeal|Заглоточные
Right colic|Правые ободочные
Right gastric|Правые желудочные
Right gastro-omental|Правые желудочно-сальниковые
Sigmoid|Сигмовидные
Splenic|Селезёночные
Subaortic|Подаортальные
Superficial anterior cervical|Поверхностные передние шейные
Superficial parotid|Поверхностные околоушные
Superior diaphragmatic|Верхние диафрагмальные
Superior gluteal|Верхние ягодичные
Superior pancreatic|Верхние поджелудочные
Superior pancreaticoduodenal|Верхние поджелудочно-двенадцатиперстные
Superior tracheobronchial|Верхние трахеобронхиальные
Superolateral superficial inguinal|Верхнелатеральные поверхностные паховые
Superomedial superficial inguinal|Верхнемедиальные поверхностные паховые
Supratrochlear|Надблоковые
Thyroid|Щитовидные
`;
for (const row of lymphGroups.trim().split('\n')) {
  const [en, ru] = row.split('|');
  terms.set(en.toLowerCase() + ' nodes', ru + ' лимфатические узлы');
}

// Each descriptor is used with the anatomical noun in the pinned source.
const vesselAdjectives = new Map(`
abdominal|Брюшная
thoracic|Грудная
angular|Угловая
anterior cerebral|Передняя мозговая
anterior circumflex humeral|Передняя артерия, огибающая плечевую кость
anterior deep temporal|Передняя глубокая височная
anterior ethmoidal|Передняя решётчатая
anterior inferior cerebellar|Передняя нижняя мозжечковая
anterior inferior pancreaticoduodenal|Передняя нижняя поджелудочно-двенадцатиперстная
anterior interventricular|Передняя межжелудочковая
anterior jugular|Передняя яремная
anterior spinal|Передняя спинномозговая
appendicular|Аппендикулярная
arcuate|Дугообразная
ascending pharyngeal|Восходящая глоточная
basilar|Базилярная
brachial|Плечевая
buccal|Щёчная
callosomarginal|Мозолисто-краевая
central retinal|Центральная артерия сетчатки
common facial|Общая лицевая
common hepatic|Общая печёночная
common iliac|Общая подвздошная
common interosseous|Общая межкостная
common palmar digital|Общая ладонная пальцевая
common plantar digital|Общая подошвенная пальцевая
deep brachial|Глубокая артерия плеча
deep cervical|Глубокая шейная
deep external pudendal|Глубокая наружная половая
deep femoral|Глубокая артерия бедра
descending palatine|Нисходящая нёбная
external iliac|Наружная подвздошная
external pudendal|Наружная половая
facial|Лицевая
fibular|Малоберцовая
gastroduodenal|Желудочно-двенадцатиперстная
greater palatine|Большая нёбная
ileocolic|Подвздошно-ободочная
iliolumbar|Подвздошно-поясничная
inferior alveolar|Нижняя альвеолярная
inferior epigastric|Нижняя надчревная
inferior gluteal|Нижняя ягодичная
inferior labial|Нижняя губная
inferior lateral genicular|Нижняя латеральная коленная
inferior medial genicular|Нижняя медиальная коленная
inferior mesenteric|Нижняя брыжеечная
inferior ophthalmic|Нижняя глазная
inferior pancreaticoduodenal|Нижняя поджелудочно-двенадцатиперстная
inferior phrenic|Нижняя диафрагмальная
inferior suprarenal|Нижняя надпочечниковая
inferior thyroid|Нижняя щитовидная
inferior ulnar collateral|Нижняя локтевая коллатеральная
infra-orbital|Подглазничная
internal iliac|Внутренняя подвздошная
internal pudendal|Внутренняя половая
internal thoracic|Внутренняя грудная
lacrimal|Слёзная
lateral frontobasal|Латеральная лобно-базальная
lateral occipital|Латеральная затылочная
lateral plantar|Латеральная подошвенная
lateral sacral|Латеральная крестцовая
lateral tarsal|Латеральная предплюсневая
lateral thoracic|Латеральная грудная
left colic|Левая ободочная
left gastric|Левая желудочная
lingual|Язычная
long posterior ciliary|Длинная задняя ресничная
lumbar|Поясничная
maxillary|Верхнечелюстная
medial frontobasal|Медиальная лобно-базальная
medial occipital|Медиальная затылочная
medial plantar|Медиальная подошвенная
median antebrachial|Срединная вена предплечья
median cubital|Срединная локтевая
median sacral|Срединная крестцовая
middle colic|Средняя ободочная
middle collateral|Средняя коллатеральная
middle genicular|Средняя коленная
middle meningeal|Средняя менингеальная
musculophrenic|Мышечно-диафрагмальная
obturator|Запирательная
occipital|Затылочная
ophthalmic|Глазная
parieto-occipital|Теменно-затылочная
pericallosal|Перикаллёзная
popliteal|Подколенная
posterior auricular|Задняя ушная
posterior cerebral|Задняя мозговая
posterior deep temporal|Задняя глубокая височная
posterior ethmoidal|Задняя решётчатая
posterior inferior cerebellar|Задняя нижняя мозжечковая
posterior intercostal|Задняя межрёберная
posterior interosseous|Задняя межкостная
posterior superior alveolar|Задняя верхняя альвеолярная
posterior tibial|Задняя большеберцовая
prefrontal|Префронтальная
proper hepatic|Собственная печёночная
proper palmar digital|Собственная ладонная пальцевая
proper plantar digital|Собственная подошвенная пальцевая
radial collateral|Лучевая коллатеральная
radial|Лучевая
recurrent interosseous|Возвратная межкостная
retromandibular|Занижнечелюстная
right colic|Правая ободочная
short posterior ciliary|Короткая задняя ресничная
sigmoid|Сигмовидная
splenic|Селезёночная
subcostal|Подрёберная
submental|Подподбородочная
subscapular|Подлопаточная
superficial epigastric|Поверхностная надчревная
superficial external pudendal|Поверхностная наружная половая
superior anorectal|Верхняя прямокишечная
superior cerebellar|Верхняя мозжечковая
superior epigastric|Верхняя надчревная
superior gluteal|Верхняя ягодичная
superior labial|Верхняя губная
superior lateral genicular|Верхняя латеральная коленная
superior medial genicular|Верхняя медиальная коленная
superior mesenteric|Верхняя брыжеечная
superior ophthalmic|Верхняя глазная
superior phrenic|Верхняя диафрагмальная
superior thyroid|Верхняя щитовидная
superior ulnar collateral|Верхняя локтевая коллатеральная
supra-orbital|Надглазничная
suprascapular|Надлопаточная
supratrochlear|Надблоковая
supreme intercostal|Наивысшая межрёберная
thoraco-acromial|Грудоакромиальная
thoracodorsal|Грудоспинная
transverse cervical|Поперечная артерия шеи
transverse facial|Поперечная артерия лица
ulnar recurrent|Возвратная локтевая
ulnar|Локтевая
vertebral|Позвоночная
`.trim().split('\n').map(row => row.split('|')));

function pluralAdjectives(text) {
  return text.replace(/ая(?= |$)/g, 'ые').replace(/яя(?= |$)/g, 'ие');
}
function vesselName(key) {
  const m = key.match(/^(.+) (artery|arteries|vein|veins)$/);
  if (!m) return '';
  const adjective = vesselAdjectives.get(m[1]);
  if (!adjective) return '';
  // Phrases containing a noun are supplied separately below for veins/plurals.
  if (/артерия|вена/.test(adjective)) return adjective.replace('артерия', m[2] === 'vein' ? 'вена' : 'артерия');
  const many = m[2] === 'arteries' || m[2] === 'veins';
  const noun = {artery:'артерия', arteries:'артерии', vein:'вена', veins:'вены'}[m[2]];
  return (many ? pluralAdjectives(adjective) : adjective) + ' ' + noun;
}

add(`
Bifurcation of pulmonary trunk|Раздвоение лёгочного ствола
Circumflex artery of heart|Огибающая артерия сердца
Right inferolateral branch of right coronary artery|Правая нижнелатеральная ветвь правой венечной артерии
Septal branches of anterior interventricular artery|Перегородочные ветви передней межжелудочковой артерии
Great cardiac vein|Большая вена сердца
Middle cardiac vein|Средняя вена сердца
Inferior vein of left ventricle|Нижняя вена левого желудочка
Inferior vein of left ventricle (//Posterior '')|Нижняя вена левого желудочка (задняя вена в исходной модели)
Coronary sinus|Венечный синус
Thoracic aorta|Грудная аорта
Abdominal aorta|Брюшная аорта
Coeliac trunk|Чревный ствол
Marginal artery|Краевая артерия
Colic branch of ileocolic artery|Ободочная ветвь подвздошно-ободочной артерии
Ileal branch of ileocolic artery|Подвздошная ветвь подвздошно-ободочной артерии
Anterior branch of renal artery|Передняя ветвь почечной артерии
Posterior branch of renal artery|Задняя ветвь почечной артерии
Descending branch of left colic artery|Нисходящая ветвь левой ободочной артерии
Ascending branch of left colic artery|Восходящая ветвь левой ободочной артерии
Iliacus branch of iliolumbar artery|Подвздошная ветвь подвздошно-поясничной артерии
Posterior division of internal iliac artery|Задний ствол внутренней подвздошной артерии
Anterior division of internal iliac artery|Передний ствол внутренней подвздошной артерии
Deep artery of penis|Глубокая артерия полового члена
Dorsal artery of penis|Тыльная артерия полового члена
Frontal branch of superficial temporal artery|Лобная ветвь поверхностной височной артерии
Mental branch of inferior alveolar artery|Подбородочная ветвь нижней альвеолярной артерии
Mylohyoid branch of inferior alveolar artery|Челюстно-подъязычная ветвь нижней альвеолярной артерии
Accessory branch of middle meningeal artery|Добавочная ветвь средней менингеальной артерии
Artery of pterygoid canal|Артерия крыловидного канала
Posterior lateral nasal branches of sphenopalatine artery.|Задние латеральные носовые ветви клиновидно-нёбной артерии
Anterior septal branches of anterior ethmoidal artery|Передние перегородочные ветви передней решётчатой артерии
Septal branches of posterior ethmoidal artery|Перегородочные ветви задней решётчатой артерии
Posterior septal branches of sphenopalatine artery|Задние перегородочные ветви клиновидно-нёбной артерии
Frontal branches of callosomarginal artery|Лобные ветви мозолисто-краевой артерии
Orbitofrontal branches of anterior cerebral artery|Глазнично-лобные ветви передней мозговой артерии
Proximal lateral striate branches|Проксимальные латеральные полосатые ветви
Distal lateral striate branches|Дистальные латеральные полосатые ветви
Insular branches of middle cerebral artery (M2)|Островковые ветви средней мозговой артерии (M2)
Insular branches of middle cerebral artery (M2-segment)|Островковые ветви средней мозговой артерии (M2)
Anterior temporal branch|Передняя височная ветвь
Temporal branches of middle cerebral artery|Височные ветви средней мозговой артерии
Posterior temporal branch|Задняя височная ветвь
Branch to angular gyrus|Ветвь к угловой извилине
Temporo-occipital branch|Височно-затылочная ветвь
Posterior parietal artery|Задняя теменная артерия
Artery of central sulcus|Артерия центральной борозды
Artery of precentral sulcus|Артерия предцентральной борозды
Postcentral arterial branch|Постцентральная артериальная ветвь
Parietal branches of middle cerebral artery|Теменные ветви средней мозговой артерии
Middle cerebral artery (M3-segment)|Средняя мозговая артерия (M3)
Middle cerebral artery (M1-segment)|Средняя мозговая артерия (M1)
Middle cerebral artery (M3 segment)|Средняя мозговая артерия (M3)
Anterior communicating artery|Передняя соединительная артерия
Posterior communicating artery|Задняя соединительная артерия
Lateral pontine branches of basilar artery|Латеральные мостовые ветви базилярной артерии
Medial pontine branches of basilar artery|Медиальные мостовые ветви базилярной артерии
Deep branch of transverse cervical artery|Глубокая ветвь поперечной артерии шеи
Superficial branch of transverse cervical artery|Поверхностная ветвь поперечной артерии шеи
Thyrocervical trunk|Щитошейный ствол
Costocervical trunk|Рёберно-шейный ствол
First posterior intercostal artery|Первая задняя межрёберная артерия
Second posterior intercostal artery|Вторая задняя межрёберная артерия
Pectoral branches of thoraco-acromial artery|Грудные ветви грудоакромиальной артерии
Dorsal metacarpal arteries|Тыльные пястные артерии
Dorsal digital arteries of hand|Тыльные пальцевые артерии кисти
Dorsal carpal anastomosis|Тыльный запястный анастомоз
Palmar metacarpal arteries|Ладонные пястные артерии
Deep palmar arch|Глубокая ладонная дуга
Superficial palmar arch|Поверхностная ладонная дуга
Palmar carpal branch of radial artery|Ладонная запястная ветвь лучевой артерии
Dorsal carpal branch of ulnar artery|Тыльная запястная ветвь локтевой артерии
Anterior circumflex humeral artery|Передняя артерия, огибающая плечевую кость
Anterior circumflex humeral vein|Передняя вена, огибающая плечевую кость
Posterior circumflex humeral artery|Задняя артерия, огибающая плечевую кость
Posterior circumflex humeral vein|Задняя вена, огибающая плечевую кость
Medial circumflex femoral artery|Медиальная артерия, огибающая бедренную кость
Lateral circumflex femoral artery|Латеральная артерия, огибающая бедренную кость
Medial circumflex femoral veins|Медиальные вены, огибающие бедренную кость
Lateral circumflex femoral veins|Латеральные вены, огибающие бедренную кость
Descending branch of lateral circumflex femoral artery|Нисходящая ветвь латеральной артерии, огибающей бедренную кость
Perforating femoral arteries|Прободающие артерии бедра
Dorsal digital arteries of foot|Тыльные пальцевые артерии стопы
Deep plantar artery|Глубокая подошвенная артерия
Calcaneal branches of fibular artery|Пяточные ветви малоберцовой артерии
Superficial branch of medial plantar artery|Поверхностная ветвь медиальной подошвенной артерии
Plantar metatarsal arteries|Подошвенные плюсневые артерии
Perforating branches of plantar metatarsal arteries|Прободающие ветви подошвенных плюсневых артерий
Plantar arch|Подошвенная дуга
Calcaneal branches of posterior tibial artery|Пяточные ветви задней большеберцовой артерии
Patellar anastomosis|Надколенниковый анастомоз
Accessory hemi-azygos vein|Добавочная полунепарная вена
Hemi-azygos vein|Полунепарная вена
Azygos vein|Непарная вена
Posterior division of retromandibular vein|Задняя ветвь занижнечелюстной вены
Anterior division of retromandibular vein|Передняя ветвь занижнечелюстной вены
Straight sinus|Прямой синус
Inferior sagittal sinus|Нижний сагиттальный синус
Superior sagittal sinus|Верхний сагиттальный синус
Occipital sinus|Затылочный синус
Superior petrosal sinus|Верхний каменистый синус
Inferior petrosal sinus|Нижний каменистый синус
Transverse sinus|Поперечный синус
Sigmoid sinus|Сигмовидный синус
Posterior intercavernous sinus|Задний межпещеристый синус
Anterior intercavernous sinus|Передний межпещеристый синус
Cavernous sinus|Пещеристый синус
Basilar venous plexus|Базилярное венозное сплетение
Dorsal digital veins of hand|Тыльные пальцевые вены кисти
Dorsal venous network of hand|Тыльная венозная сеть кисти
Cephalic vein|Латеральная подкожная вена руки
Basilic vein|Медиальная подкожная вена руки
Circumflex scapular artery|Артерия, огибающая лопатку
Circumflex scapular vein|Вена, огибающая лопатку
Superficial venous palmar arch|Поверхностная ладонная венозная дуга
Deep venous palmar arch|Глубокая ладонная венозная дуга
Palmar digital veins|Ладонные пальцевые вены
Hepatic veins|Печёночные вены
Hepatic portal vein|Воротная вена печени
Deep dorsal vein of penis|Глубокая тыльная вена полового члена
Superficial dorsal veins of penis|Поверхностные тыльные вены полового члена
Inferior vena cava (thoracic part)|Грудная часть нижней полой вены
Inferior vena cava (abdominal part)|Брюшная часть нижней полой вены
Perforating veins|Прободающие вены
Anterior tibial veins|Передние большеберцовые вены
Plantar digital veins|Подошвенные пальцевые вены
Plantar metatarsal veins|Подошвенные плюсневые вены
Plantar venous arch|Подошвенная венозная дуга
Dorsal venous arch of foot|Тыльная венозная дуга стопы
Intercapitular veins of foot|Межголовчатые вены стопы
Genicular veins|Коленные вены
Dorsal metatarsal arteries|Тыльные плюсневые артерии
Dorsal metatarsal veins|Тыльные плюсневые вены
Dorsal digital veins of foot|Тыльные пальцевые вены стопы
Spinal branch of iliolumbar artery|Спинномозговая ветвь подвздошно-поясничной артерии
Lumbar branch of iliolumbar artery|Поясничная ветвь подвздошно-поясничной артерии
Inferior papillary muscle of left ventricle|Нижняя сосочковая мышца левого желудочка
Anterior papillary muscle of right ventricle|Передняя сосочковая мышца правого желудочка
Inferior papillary muscle of right ventricle|Нижняя сосочковая мышца правого желудочка
Septal papillary muscle of right ventricle|Перегородочная сосочковая мышца правого желудочка
Inferior leaflet of right atrioventricular valve|Нижняя створка правого предсердно-желудочкового клапана
Posterior leaflet of left atrioventricular valve|Задняя створка левого предсердно-желудочкового клапана
Septal leaflet of right atrioventricular valve|Перегородочная створка правого предсердно-желудочкового клапана
Left coronary leaflet|Левая венечная заслонка аортального клапана
Non-coronary leaflet|Невенечная заслонка аортального клапана
Right coronary leaflet|Правая венечная заслонка аортального клапана
Anterior semilunar leaflet of pulmonary valve|Передняя полулунная заслонка клапана лёгочного ствола
Left semilunar leaflet of pulmonary valve|Левая полулунная заслонка клапана лёгочного ствола
Right semilunar leaflet of pulmonary valve|Правая полулунная заслонка клапана лёгочного ствола
`);
for (const [en, ru] of [
  ['renal','Почечная'], ['testicular','Яичковая'], ['coronary','Венечная'],
  ['pulmonary','Лёгочная'], ['superior pulmonary','Верхняя лёгочная'],
  ['inferior pulmonary','Нижняя лёгочная'], ['brachiocephalic','Плечеголовная'],
  ['ascending lumbar','Восходящая поясничная'], ['superior intercostal','Верхняя межрёберная'],
  ['gastro-omental','Желудочно-сальниковая'],
]) vesselAdjectives.set(en, ru);

function lungVesselName(key) {
  const renal = key.match(/^intrarenal (arteries|veins) of (left|right) kidney$/);
  if (renal) return `Внутрипочечные ${renal[1] === 'arteries' ? 'артерии' : 'вены'} ${renal[2] === 'left' ? 'левой' : 'правой'} почки`;
  const heart = key.match(/^(left|right) (atrium|ventricle)$/);
  if (heart) return heart[2] === 'atrium' ? `${heart[1] === 'left' ? 'Левое' : 'Правое'} предсердие` : `${heart[1] === 'left' ? 'Левый' : 'Правый'} желудочек`;
  const lung = key.match(/^(.+?) (segmental artery|lobar artery|artery|vein) of (left|right) lung$/);
  if (!lung) return '';
  const artery = lung[2].includes('artery');
  const descriptor = {
    superior:'Верхняя', inferior:'Нижняя', middle:'Средняя', apical:'Верхушечная',
    anterior:'Передняя', posterior:'Задняя', medial:'Медиальная', lateral:'Латеральная',
    'anterior basal':'Передняя базальная', 'posterior basal':'Задняя базальная',
    'medial basal':'Медиальная базальная', 'lateral basal':'Латеральная базальная',
    'superior basal':'Верхняя базальная', 'inferior basal':'Нижняя базальная',
    'superior lingular':'Верхняя язычковая', 'inferior lingular':'Нижняя язычковая',
    lingular:'Язычковая', apicoposterior:'Верхушечно-задняя',
  }[lung[1]];
  if (!descriptor) return '';
  const type = lung[2] === 'lobar artery' ? 'долевая артерия' : lung[2] === 'segmental artery' ? 'сегментарная артерия' : artery ? 'артерия' : 'вена';
  return `${descriptor} ${type} ${lung[3] === 'left' ? 'левого' : 'правого'} лёгкого`;
}

const ligamentAdjectives = new Map(`
acromioclavicular|Акромиально-ключичная
anterior cruciate|Передняя крестообразная
posterior cruciate|Задняя крестообразная
anterior longitudinal|Передняя продольная
posterior longitudinal|Задняя продольная
anterior sacro-iliac|Передняя крестцово-подвздошная
posterior sacro-iliac|Задняя крестцово-подвздошная
anterior sternoclavicular|Передняя грудино-ключичная
posterior sternoclavicular|Задняя грудино-ключичная
anterior talocalcaneal|Передняя таранно-пяточная
posterior talocalcaneal|Задняя таранно-пяточная
lateral talocalcaneal|Латеральная таранно-пяточная
medial talocalcaneal|Медиальная таранно-пяточная
anterior talofibular|Передняя таранно-малоберцовая
posterior talofibular|Задняя таранно-малоберцовая
anterior tibiofibular|Передняя межберцовая
posterior tibiofibular|Задняя межберцовая
arcuate popliteal|Дугообразная подколенная
calcaneocuboid|Пяточно-кубовидная
calcaneofibular|Пяточно-малоберцовая
calcaneonavicular|Пяточно-ладьевидная
capitohamate interosseous|Головчато-крючковидная межкостная
conoid|Конусовидная
coraco-acromial|Клювовидно-акромиальная
coracohumeral|Клювовидно-плечевая
costoclavicular|Рёберно-ключичная
costotransverse|Рёберно-поперечная
cricopharyngeal|Перстнеглоточная
cuneocuboid interosseous|Клиновидно-кубовидная межкостная
cuneometatarsal interosseous|Клиноплюсневая межкостная
deep transverse metacarpal|Глубокая поперечная пястная
deep transverse metatarsal|Глубокая поперечная плюсневая
dorsal calcaneocuboid|Тыльная пяточно-кубовидная
dorsal carpometacarpal|Тыльная запястно-пястная
dorsal cuboideonavicular|Тыльная кубовидно-ладьевидная
dorsal cuneocuboid|Тыльная клиновидно-кубовидная
dorsal cuneonavicular|Тыльная клиноладьевидная
dorsal intercarpal|Тыльная межзапястная
dorsal intercuneiform|Тыльная межклиновидная
dorsal metacarpal|Тыльная пястная
dorsal metatarsal|Тыльная плюсневая
dorsal radio-ulnar|Тыльная лучелоктевая
dorsal radiocarpal|Тыльная лучезапястная
dorsal scaphotriquetral|Тыльная ладьевидно-трёхгранная
dorsal tarsometatarsal|Тыльная предплюсне-плюсневая
dorsal ulnocarpal|Тыльная локтезапястная
fibular collateral|Малоберцовая коллатеральная
iliolumbar|Подвздошно-поясничная
inferior glenohumeral|Нижняя суставно-плечевая
middle glenohumeral|Средняя суставно-плечевая
superior glenohumeral|Верхняя суставно-плечевая
inferior pubic|Нижняя лобковая
superior pubic|Верхняя лобковая
inferior transverse scapular|Нижняя поперечная связка лопатки
superior transverse scapular|Верхняя поперечная связка лопатки
interclavicular|Межключичная
intercornual|Межроговая
intercuneiform interosseous|Межклиновидная межкостная
interosseous metacarpal|Межкостная пястная
interosseous sacro-iliac|Межкостная крестцово-подвздошная
intersesamoid|Межсесамовидная
interspinous|Межостистая
intertransverse|Межпоперечная
ischiofemoral|Седалищно-бедренная
lateral temporomandibular|Латеральная височно-нижнечелюстная
lateral thyrohyoid|Латеральная щитоподъязычная
long plantar|Длинная подошвенная
lunotriquetral interosseous|Полулунно-трёхгранная межкостная
median cricothyroid|Срединная перстнещитовидная
median thyrohyoid|Срединная щитоподъязычная
meniscopatellar|Менисконадколенниковая
metatarsal interosseous|Плюсневая межкостная
nuchal|Выйная
oblique popliteal|Косая подколенная
palmar capitohamate|Ладонная головчато-крючковидная
palmar carpometacarpal|Ладонная запястно-пястная
palmar interphalangeal|Ладонная межфаланговая
palmar lunotriquetral|Ладонная полулунно-трёхгранная
palmar metacarpal|Ладонная пястная
palmar radio-ulnar|Ладонная лучелоктевая
palmar scaphotriquetral|Ладонная ладьевидно-трёхгранная
palmar trapezoideocapitate|Ладонная трапециевидно-головчатая
pisohamate|Гороховидно-крючковидная
pisometacarpal|Гороховидно-пястная
pisotriquetral|Гороховидно-трёхгранная
plantar calcaneocuboid|Подошвенная пяточно-кубовидная
plantar calcaneonavicular|Подошвенная пяточно-ладьевидная
plantar cuboideonavicular|Подошвенная кубовидно-ладьевидная
plantar cuneocuboid|Подошвенная клиновидно-кубовидная
plantar cuneonavicular|Подошвенная клиноладьевидная
plantar intercuneiform|Подошвенная межклиновидная
plantar interphalangeal|Подошвенная межфаланговая
plantar metatarsal|Подошвенная плюсневая
plantar metatarsophalangeal|Подошвенная плюснефаланговая
plantar tarsometatarsal|Подошвенная предплюсне-плюсневая
popliteofibular|Подколенно-малоберцовая
posterior tibiotalar|Задняя большеберцово-таранная
pterygospinous|Крыловидно-остистая
pubofemoral|Лобково-бедренная
quadrate|Квадратная
radial collateral|Лучевая коллатеральная
radiate carpal|Лучистая связка запястья
radiocapitate|Лучеголовчатая
radioscaphocapitate|Лучеладьевидно-головчатая
sacrospinous|Крестцово-остистая
sacrotuberous|Крестцово-бугорная
scaphocapitate|Ладьевидно-головчатая
scapholunate interosseous|Ладьевидно-полулунная межкостная
scaphotrapeziotrapezoidal|Ладьевидно-трапецио-трапециевидная
sphenomandibular|Клиновидно-нижнечелюстная
stylohyoid|Шилоподъязычная
stylomandibular|Шилонижнечелюстная
supraspinous|Надостистая
talocalcaneal interosseous|Таранно-пяточная межкостная
talonavicular|Таранно-ладьевидная
tibiocalcaneal|Большеберцово-пяточная
tibionavicular|Большеберцово-ладьевидная
transverse acetabular|Поперечная связка вертлужной впадины
transverse humeral|Поперечная связка плеча
transverse tibiofibular|Поперечная межберцовая
trapeziotrapezoidal interosseous|Трапецио-трапециевидная межкостная
trapezoid|Трапециевидная
trapezoideocapitate interosseous|Трапециевидно-головчатая межкостная
triquetrocapitate|Трёхгранно-головчатая
triquetrohamate|Трёхгранно-крючковидная
ulnar collateral|Локтевая коллатеральная
ulnocapitate|Локтеголовчатая
ulnolunate|Локтеполулунная
ulnopisiform|Локтегороховидная
ulnotriquetral|Локтетрёхгранная
`.trim().split('\n').map(row => row.split('|')));
const jointGenitives = {
  'acromioclavicular joint':'акромиально-ключичного сустава',
  'elbow joint':'локтевого сустава', 'glenohumeral joint':'плечевого сустава',
  'hip joint':'тазобедренного сустава', 'knee joint':'коленного сустава',
  'radiocarpal joint':'лучезапястного сустава', 'sternoclavicular joint':'грудино-ключичного сустава',
  'superior tibiofibular joint':'верхнего межберцового сустава',
  'temporomandibular joint':'височно-нижнечелюстного сустава',
  'distal radio-ulnar joint':'дистального лучелоктевого сустава',
  'interphalangeal joint of great toe':'межфалангового сустава большого пальца стопы',
  'distal interphalangeal joints':'дистальных межфаланговых суставов кисти',
  'distal interphalangeal joints of foot':'дистальных межфаланговых суставов стопы',
  'proximal interphalangeal joints':'проксимальных межфаланговых суставов кисти',
  'proximal interphalangeal joints of foot':'проксимальных межфаланговых суставов стопы',
  'metacarpophalangeal joints':'пястно-фаланговых суставов',
  'metatarsophalangeal joints':'плюснефаланговых суставов',
};
add(`
Acetabular labrum|Вертлужная губа
Annular ligament of radius|Кольцевая связка лучевой кости
Anterior ligament of fibular head|Передняя связка головки малоберцовой кости
Posterior ligament of fibular head|Задняя связка головки малоберцовой кости
Deep part of tibial collateral ligament|Глубокая часть большеберцовой коллатеральной связки
Superficial part of tibial collateral ligament|Поверхностная часть большеберцовой коллатеральной связки
Descending part of iliofemoral ligament|Нисходящая часть подвздошно-бедренной связки
Transverse part of iliofemoral ligament|Поперечная часть подвздошно-бедренной связки
External intercostal membrane|Наружная межрёберная перепонка
Internal intercostal membrane|Внутренняя межрёберная перепонка
Frenula capsulae|Уздечки суставной капсулы
Glenoid labrum|Суставная губа лопатки
Infrapatellar fat pad|Поднадколенниковое жировое тело
Interosseous membrane of forearm|Межкостная перепонка предплечья
Interosseous membrane of leg|Межкостная перепонка голени
Interpubic disc|Межлобковый диск
Intra-articular ligament of head of rib|Внутрисуставная связка головки ребра
Lateral meniscus|Латеральный мениск
Medial meniscus|Медиальный мениск
Ligament of head of femur|Связка головки бедренной кости
Ligamenta flava|Жёлтые связки
Oblique cord|Косая хорда
Obturator membrane|Запирательная перепонка
Pubic symphysis|Лобковый симфиз
Quadrangular membrane|Четырёхугольная мембрана гортани
Radial collateral ligament of wrist joint|Лучевая коллатеральная связка запястья
Ulnar collateral ligament of wrist joint|Локтевая коллатеральная связка запястья
Radiate ligament of head of rib|Лучистая связка головки ребра
Sacrococcygeal symphysis|Крестцово-копчиковый симфиз
Transverse ligament of knee|Поперечная связка колена
Triradiate cartilage|Y-образный хрящ вертлужной впадины
Zona orbicularis|Круговая зона капсулы тазобедренного сустава
Collateral interphalangeal ligaments of foot|Коллатеральные связки межфаланговых суставов стопы
Collateral interphalangeal ligaments of hand|Коллатеральные связки межфаланговых суставов кисти
Collateral metacarpophalangeal ligaments|Коллатеральные связки пястно-фаланговых суставов
Collateral metatarsophalangeal ligaments|Коллатеральные связки плюснефаланговых суставов
`);
function jointName(key) {
  const spinal = key.match(/^(intervertebral disc|nucleus pulposus) ([ctl]\d+-[ctls]\d+)$/);
  if (spinal) return (spinal[1] === 'intervertebral disc' ? 'Межпозвоночный диск ' : 'Студенистое ядро диска ') + spinal[2].toUpperCase();
  const capsule = key.match(/^(articular capsule|articular capsules|articular disc) of (.+)$/);
  if (capsule && jointGenitives[capsule[2]]) return ({'articular capsule':'Капсула', 'articular capsules':'Капсулы', 'articular disc':'Суставной диск'}[capsule[1]]) + ' ' + jointGenitives[capsule[2]];
  const meniscus = key.match(/^(anterior|posterior) meniscotibial ligament \((lateral|medial) meniscus\)$/);
  if (meniscus) return `${meniscus[1] === 'anterior' ? 'Передняя' : 'Задняя'} менискобольшеберцовая связка ${meniscus[2] === 'lateral' ? 'латерального' : 'медиального'} мениска`;
  const ligament = key.match(/^(.+) (ligament|ligaments)$/);
  const adjective = ligament && ligamentAdjectives.get(ligament[1]);
  if (adjective) return /связка/.test(adjective) ? adjective : (ligament[2] === 'ligaments' ? pluralAdjectives(adjective) + ' связки' : adjective + ' связка');
  return '';
}

export function supplementalReferenceName(core) {
  const key = String(core).replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/[']+$/, '').replace(/\.j$/, '')
    .replace(/^\((.*)\)$/, '$1')
    .replace(/\s+\((?:[ivx]+|b[ivx]+(?:\+b[ivx]+)?)\)$/i, '');
  if (terms.has(key)) return terms.get(key);
  const lungVessel = lungVesselName(key);
  if (lungVessel) return lungVessel;
  const joint = jointName(key);
  if (joint) return joint;
  const vessel = vesselName(key);
  if (vessel) return vessel;
  const branch = key.match(/^(.+) of (.+ nerve)$/);
  if (branch && nerveBranches[branch[1]] && nerveGen[branch[2]]) return nerveBranches[branch[1]] + ' ' + nerveGen[branch[2]];
  const bronchus = key.match(/^(.+) segmental bronchus of (left|right) lung$/);
  if (bronchus && bronchialSegments[bronchus[1]]) return `${bronchialSegments[bronchus[1]]} сегментарный бронх ${bronchus[2] === 'left' ? 'левого' : 'правого'} лёгкого`;
  return '';
}
