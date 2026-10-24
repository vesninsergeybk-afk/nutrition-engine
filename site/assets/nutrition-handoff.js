/* VesninMed Nutrition <-> Healthy Diet one-time same-tab handoff.
 * The packet lives only in sessionStorage for <=15 minutes, with no patient name,
 * diagnosis, photos, supplements, previous history or AI data.
 * Receiver must obtain a second explicit user confirmation before applying it.
 * Never writes to IndexedDB or to another tool's persistence boundary.
 */
const KEY='vesninmed:nutrition:handoff:v1';
const MAX_AGE_MS=15*60*1000;
const number=(v,min,max)=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)&&n>=min&&n<=max?n:null};
function cleanProfile(p){
 if(!p||typeof p!=='object')return null;
 const age=number(p.age??p.ageYears,18,100),
  h=number(p.h??p.heightCm,120,230),
  w=number(p.w??p.weightKg,30,300);
 if(!Number.isInteger(age)||h===null||w===null)return null;
 const sex=['male','female'].includes(p.sex)?p.sex:null;
 return {age:String(age),h:String(h),w:String(w),...(sex?{sex}:{})};
}
function cleanRation(a){
 if(!Array.isArray(a)||a.length===0)return [];
 if(a.length>80)throw Error('Для передачи выберите рацион не более чем из 80 позиций.');
 return a.map(x=>{
  const key=String(x.key||'');
  const grams=number(x.grams,0.1,100000);
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(key)||grams===null)throw Error('В рационе есть запись с неподдерживаемым ключом или массой.');
  return {key,grams};
 });
}
export function sendHandoff({from,to,profile,includeRation=false,ration=[]}){
 if(!['guide','calculator'].includes(from)||!['guide','calculator'].includes(to)||from===to)return {ok:false,reason:'Некорректное направление передачи.'};
 const p=cleanProfile(profile);
 let food=[];
 try{if(includeRation)food=cleanRation(ration);}catch(e){return {ok:false,reason:e.message};}
 if(!p&&!food.length)return {ok:false,reason:'Сначала заполните возраст, рост и массу тела либо добавьте продукты.'};
 const packet={schema:1,from,to,at:Date.now(),profile:p,ration:food};
 try{sessionStorage.setItem(KEY,JSON.stringify(packet));return {ok:true,profile:!!p,rationCount:food.length};}
 catch{return {ok:false,reason:'Браузер не разрешил временную передачу данных.'};}
}
export function peekHandoff(expectedTo){
 let value;
 try{value=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{return null;}
 if(!value||value.schema!==1||value.to!==expectedTo||!['guide','calculator'].includes(value.from)||Date.now()-value.at>MAX_AGE_MS||Date.now()<value.at)return null;
 const profile=cleanProfile(value.profile);
 let ration=[];
 try{ration=cleanRation(value.ration);}catch{return null;}
 if(!profile&&!ration.length)return null;
 return {from:value.from,to:expectedTo,profile,ration,at:value.at};
}
export function clearHandoff(){
 try{sessionStorage.removeItem(KEY);return true;}catch{return false;}
}
