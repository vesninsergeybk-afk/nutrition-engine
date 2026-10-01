// Index existing innervation text; this does not infer branches, root levels,
// dermatomes or a complete territory of a nerve.
const stems = Object.freeze({
  'axillary nerve': 'подмышечн',
  'musculocutaneous nerve': 'мышечно-кожн',
  'median nerve': 'срединн',
  'ulnar nerve': 'локтев',
  'radial nerve': 'лучев',
  'femoral nerve': 'бедренн',
  'obturator nerve': 'запирательн',
  'tibial nerve': 'большеберцов',
  'deep fibular nerve': 'глубок.{0,16}малоберцов',
  'superficial fibular nerve': 'поверхностн.{0,16}малоберцов',
  'superior gluteal nerve': 'верхн.{0,16}ягодичн',
  'inferior gluteal nerve': 'нижн.{0,16}ягодичн',
  'thoracodorsal nerve': 'грудоспинн',
  'long thoracic nerve': 'длинн.{0,16}грудн',
  'suprascapular nerve': 'надлопаточн',
  'dorsal scapular nerve': 'дорсальн.{0,16}лопатк',
  'accessory nerve': 'добавочн',
  'phrenic nerve': 'диафрагмальн',
  'facial nerve': 'лицев',
  'hypoglossal nerve': 'подъязычн',
  'oculomotor nerve': 'глазодвигательн',
  'trochlear nerve': 'блоков',
  'abducens nerve': 'отводящ',
});
export function nerveMentionMatches(sourceName, innervationRu) {
  const name = String(sourceName).replace(/_/g, ' ').replace(/\.[lr]$/i, '')
    .replace(/\s*\([IVX]+\)$/i, '').trim().toLowerCase();
  const stem = stems[name];
  if (!stem) return false;
  const text = String(innervationRu || '').toLowerCase().replace(/ё/g, 'е').replace(/[‑–]/g, '-');
  // The nerve itself must be named. "Лучевая половина" and a cutaneous branch
  // alone must not turn into a motor link for the parent nerve.
  return new RegExp(stem + '\\p{L}*\\s+нерв', 'u').test(text);
}
