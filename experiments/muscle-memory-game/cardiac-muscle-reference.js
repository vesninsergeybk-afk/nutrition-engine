// Five cardiac entries in the pinned BodyParts3D model. These remain outside
// the skeletal-muscle curriculum and movement synergy/antagonism catalogue.
const PAPILLARY_LABELS = Object.freeze({
  'anterolateral head of lateral papillary muscle of left ventricle': ['Переднелатеральная головка латеральной сосочковой мышцы левого желудочка', 'Caput anterolaterale musculi papillaris lateralis ventriculi sinistri'],
  'lateral papillary muscle of left ventricle': ['Латеральная сосочковая мышца левого желудочка', 'Musculus papillaris lateralis ventriculi sinistri'],
  'anterior papillary muscle of right ventricle': ['Передняя сосочковая мышца правого желудочка', 'Musculus papillaris anterior ventriculi dextri'],
  'posterior papillary muscle of right ventricle': ['Задняя сосочковая мышца правого желудочка', 'Musculus papillaris posterior ventriculi dextri'],
  'septal papillary muscle of right ventricle': ['Перегородочная сосочковая мышца правого желудочка', 'Musculus papillaris septalis ventriculi dextri'],
});

export function cardiacMuscleReferenceFor(sourceName) {
  const key = String(sourceName || '').replace(/_/g, ' ').trim().toLowerCase();
  const labels = PAPILLARY_LABELS[key];
  if (!labels) return null;
  const left = key.includes('left ventricle');
  return Object.freeze({
    id: 'cardiac-' + key.replace(/ /g, '-'), titleRu: labels[0], latin: labels[1],
    regionId: 'heart', regionRu: 'Сердце', typeRu: 'Сердечная мышца', depthRu: 'Внутренняя поверхность желудочка',
    badgesRu: ['Сердечная мышца'], modelCoverage: 'exact',
    originRu: 'Миокард стенки ' + (left ? 'левого' : 'правого') + ' желудочка.',
    insertionRu: 'Через сухожильные хорды связана со створками ' + (left ? 'митрального' : 'трёхстворчатого') + ' клапана.',
    actionsRu: ['При сокращении желудочка натягивает сухожильные хорды и препятствует выворачиванию клапанных створок в предсердие.'],
    orientationRu: 'Мышечный выступ внутри полости желудочка; от верхушки отходят сухожильные хорды.',
    landmarksRu: ['Полость желудочка', 'Сухожильные хорды', 'Створки предсердно-желудочкового клапана'],
    relationsRu: ['Часть клапанного аппарата; работает согласованно с миокардом желудочка.'],
    innervationRu: 'Относится к миокарду. Детальная иннервация отдельных сосочковых мышц в источнике описана ограниченно; схему иннервации скелетных мышц сюда переносить нельзя.',
    studyCueRu: 'Найдите связь «стенка желудочка → сосочковая мышца → хорды → створка клапана».',
    sourceNotesRu: ['Это сердечная мышечная ткань. Суставных движений и соответствующих им синергистов и антагонистов здесь нет.', 'Название сохраняет детализацию исходной 3D-базы; число и форма головок сосочковых мышц вариабельны.'],
    sources: [{ sourceId: 'ncbi-papillary-muscles', locator: 'Structure and Function; Nerves', role: 'Справочные факты' }],
    illustrations: [], primaryIllustration: null, functionalParts: [], functionalRelations: [],
    referenceCoverage: { facts: true, atlasArt: false, galleryCount: 0 },
  });
}
