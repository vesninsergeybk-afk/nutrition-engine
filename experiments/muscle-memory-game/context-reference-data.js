// Independent short Russian summaries. Exact object matching avoids assigning
// a parent nerve/artery card to a separately named branch.
const OPENSTAX = "https://openstax.org/books/anatomy-and-physiology-2e/pages/";
const sources = {
  roots: {title: "OpenStax: спинномозговые нервы", url: OPENSTAX + "13-4-the-peripheral-nervous-system"},
  cord: {title: "OpenStax: спинной мозг", url: OPENSTAX + "13-2-the-central-nervous-system"},
  knee: {title: "OpenStax: строение суставов", url: OPENSTAX + "9-6-anatomy-of-selected-synovial-joints"},
  disc: {title: "OpenStax: позвоночный столб", url: OPENSTAX + "7-3-the-vertebral-column"},
  vessels: {title: "OpenStax: кровеносные сосуды", url: OPENSTAX + "20-5-circulatory-pathways"},
  median: {title: "Сведения о срединном нерве: статья в PMC", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6032467/"},
  sciatic: {title: "StatPearls: анатомия седалищного нерва", url: "https://www.ncbi.nlm.nih.gov/books/NBK482431/"},
};
export const ATLAS_FIGURES = Object.freeze({
  cauda: {src: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Gray662.png", page: "https://commons.wikimedia.org/wiki/File:Gray662.png", caption: "Конский хвост и конечная нить, вид сзади. Твёрдая оболочка раскрыта. Gray’s Anatomy, рис. 662."},
  kneeFront: {src: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Gray347.png", page: "https://commons.wikimedia.org/wiki/File:Gray347.png", caption: "Правый коленный сустав спереди: внутренние связки. Gray’s Anatomy, рис. 347."},
  kneeBack: {src: "https://upload.wikimedia.org/wikipedia/commons/1/19/Gray348.png", page: "https://commons.wikimedia.org/wiki/File:Gray348.png", caption: "Левый коленный сустав сзади: внутренние связки и мениски. Gray’s Anatomy, рис. 348."},
  legArteries: {src: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Gray550.png", page: "https://commons.wikimedia.org/wiki/File:Gray550.png", caption: "Артерии голени, вид сзади. Gray’s Anatomy, рис. 550."},
});
const entry = (latin, descriptionRu, landmarksRu, source, figures = [], noteRu = "") => ({latin, descriptionRu, landmarksRu, source: sources[source], figures, noteRu});
export const CONTEXT_CARDS = Object.freeze({
  "cauda equina": entry("Cauda equina", "Пучок поясничных, крестцовых и копчиковых корешков, которые спускаются в позвоночном канале ниже окончания спинного мозга.", ["Направление корешков вниз в пояснично-крестцовом отделе", "Отличие пучка корешков от самого спинного мозга"], "cord", ["cauda"], "В этой модели корешки не разделены на отдельно подписанные сегментарные уровни."),
  "anterior root of spinal nerve": entry("Radix anterior nervi spinalis", "Проводит двигательные волокна от спинного мозга. Передний и задний корешки соединяются, образуя спинномозговой нерв.", ["Расположение перед спинным мозгом", "Соединение с задним корешком"], "roots", [], "Объект объединяет корешки одной стороны; отдельных подписей C1–S5 здесь нет."),
  "posterior root of spinal nerve": entry("Radix posterior nervi spinalis", "Проводит чувствительные волокна к спинному мозгу. Тела чувствительных нейронов находятся в спинномозговом узле.", ["Расположение позади спинного мозга", "Спинномозговой узел на заднем корешке"], "roots"),
  "spinal ganglion": entry("Ganglion spinale", "Утолщение заднего корешка, содержащее тела чувствительных нейронов. Их отростки связывают периферические рецепторы со спинным мозгом.", ["Утолщение на заднем корешке", "Отличие узла от нервного ствола"], "roots"),
  "median nerve": entry("Nervus medianus", "Нерв плечевого сплетения. Проходит по передней поверхности предплечья и через запястный канал к кисти; содержит двигательные и чувствительные волокна.", ["Ход нерва по предплечью", "Участок в области запястного канала"], "median"),
  "sciatic nerve": entry("Nervus ischiadicus", "Крупный нерв крестцового сплетения. Проходит через ягодичную область и заднюю поверхность бедра; его большеберцовый и общий малоберцовый компоненты далее расходятся в отдельные нервы.", ["Ход по задней поверхности бедра", "Разделение на большеберцовый и общий малоберцовый нервы"], "sciatic"),
  "anterior cruciate ligament": entry("Ligamentum cruciatum anterius", "Внутрикапсульная связка коленного сустава. Ограничивает смещение большеберцовой кости вперёд относительно бедренной и участвует в устойчивости сустава при вращении.", ["Прикрепление в передней межмыщелковой области большеберцовой кости", "Перекрёст с задней крестообразной связкой"], "knee", ["kneeFront", "kneeBack"]),
  "posterior cruciate ligament": entry("Ligamentum cruciatum posterius", "Внутрикапсульная связка коленного сустава. Ограничивает смещение большеберцовой кости назад относительно бедренной.", ["Прикрепление в задней межмыщелковой области большеберцовой кости", "Перекрёст с передней крестообразной связкой"], "knee", ["kneeBack", "kneeFront"]),
  "medial meniscus": entry("Meniscus medialis", "Полулунная пластинка волокнистого хряща между медиальными мыщелками бедренной и большеберцовой костей. Распределяет нагрузку и улучшает соответствие суставных поверхностей.", ["Расположение на медиальной стороне большеберцовой кости", "Форма и связь с суставной капсулой"], "knee", ["kneeBack", "kneeFront"]),
  "lateral meniscus": entry("Meniscus lateralis", "Пластинка волокнистого хряща между латеральными мыщелками бедренной и большеберцовой костей. Распределяет нагрузку и улучшает соответствие суставных поверхностей.", ["Расположение на латеральной стороне большеберцовой кости", "Более замкнутая форма по сравнению с медиальным мениском"], "knee", ["kneeBack", "kneeFront"]),
  "articular capsule of knee joint": entry("Capsula articularis", "Окружает полость коленного сустава. Имеет наружную фиброзную оболочку и внутреннюю синовиальную оболочку.", ["Граница капсулы вокруг суставных поверхностей", "Расположение крестообразных связок внутри капсулы"], "knee", ["kneeFront", "kneeBack"]),
  "femoral artery": entry("Arteria femoralis", "Продолжение наружной подвздошной артерии ниже паховой связки. Проходит по бедру и, выйдя к задней стороне колена, продолжается как подколенная артерия.", ["Участок ниже паховой связки", "Продолжение в подколенную артерию"], "vessels"),
  "popliteal artery": entry("Arteria poplitea", "Продолжение бедренной артерии в подколенной области. Кровоснабжает область колена и даёт начало основным артериям голени.", ["Расположение позади коленного сустава", "Переход к артериям голени"], "vessels", ["legArteries"]),
  "femoral vein": entry("Vena femoralis", "Глубокая вена бедра. Продолжается из подколенной вены и отводит кровь в наружную подвздошную вену.", ["Соседство с бедренной артерией", "Соединение с глубокой веной бедра"], "vessels"),
  "deep femoral vein": entry("Vena profunda femoris", "Собирает кровь от глубоких тканей бедра и впадает в бедренную вену.", ["Ход среди глубоких тканей бедра", "Место соединения с бедренной веной"], "vessels"),
});
export function contextCardFor(sourceName, layerKey) {
  const key = String(sourceName).replace(/\.[lr]$/i, "").trim().toLowerCase();
  const card = CONTEXT_CARDS[key];
  if (card) return {...card, id: key, layerKey};
  if (layerKey === "joints" && /^intervertebral disc [ctl]\d+-[ctls]\d+$/.test(key)) return {
    ...entry("Discus intervertebralis", "Расположен между телами соседних позвонков. Состоит из наружного фиброзного кольца и внутреннего студенистого ядра; распределяет нагрузку и позволяет небольшие движения между позвонками.", ["Положение между телами позвонков", "Отличие диска от дугоотростчатых суставов"], "disc"), id: "intervertebral-disc", layerKey,
  };
  return null;
}
