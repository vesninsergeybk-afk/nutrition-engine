// Migration for the actual ration_preset v1 export of Nutrition v5/v6.
// That format contains catalogue keys and grams; it does not export needs.
export function importLegacyRation(raw,{profile,customProducts,knownKeys,makeId}) {
  if(!raw||raw.type!=='ration_preset'||raw.version!==1||!Array.isArray(raw.items)||raw.items.length>500)throw Error('Нужен файл «Сохранить JSON» из прежней версии Nutrient.');
  if(raw.items.some(it=>!it||typeof it.key!=='string'||!knownKeys.has(it.key)||!Number.isFinite(it.grams)||it.grams<=0||it.grams>100000))throw Error('В файле есть неизвестный продукт или неверное количество. Ни одна запись не перенесена.');
  const nextProfile=structuredClone(profile);
  if(typeof raw.person_name==='string')nextProfile.person_name=raw.person_name.slice(0,300);
  return {version:1,profile:nextProfile,customProducts:structuredClone(customProducts),ration:raw.items.map(it=>({id:makeId(),key:it.key,grams:it.grams,unit:'g',quantityMethod:'LEGACY_IMPORT'})),analysis:null,recognitionDraft:null};
}
