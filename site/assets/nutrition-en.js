/* English presentation layer. Does not modify formulas, profiles, food keys or stored data. */
(function(){
'use strict';
if(document.documentElement.lang!=='en')return;
const CYR=/[А-Яа-яЁё]/;
const unitTerms={'мкг':'µg','мг':'mg','ккал':'kcal','кг':'kg','г':'g','л':'L','мл':'mL','г/сут':'g/day','ккал/сут':'kcal/day','см':'cm','ИМТ':'BMI'};
let dictionary=new Map(),fragments=[];
function setDictionaries(parts){
  dictionary=new Map(Object.entries(Object.assign({},...parts)));
  fragments=[...dictionary.entries()].filter(([s])=>s.length>=6&&CYR.test(s)).sort((a,b)=>b[0].length-a[0].length);
  scan(document.body);
}
function tr(raw){
  const s=String(raw??'');
  if(!CYR.test(s))return s;
  const cleaned=s.trim(),exact=dictionary.get(cleaned);
  if(exact!==undefined)return s.slice(0,s.indexOf(cleaned))+exact+s.slice(s.indexOf(cleaned)+cleaned.length);
  let out=s;
  for(const [ru,en] of fragments){
    if(!out.includes(ru))continue;
    if(ru.length>=18)out=out.split(ru).join(en);
    else {
      let start=0,at;
      while((at=out.indexOf(ru,start))!==-1){
        const before=at>0?out[at-1]:'';
        const after=out[at+ru.length]||'';
        if(!/\p{L}/u.test(before)&&!/\p{L}/u.test(after)){
          out=out.slice(0,at)+en+out.slice(at+ru.length);
          start=at+en.length;
        }else start=at+ru.length;
      }
    }
  }
  for(const [ru,en] of Object.entries(unitTerms).sort((a,b)=>b[0].length-a[0].length))out=out.replace(new RegExp('(?<![\\p{L}])'+ru.replace('/','\\/')+'(?![\\p{L}])','gu'),en);
  // Age values are composed at runtime (e.g. `37 лет`) and are not dictionary keys.
  out=out.replace(/(?<![\p{L}\p{N}])(\d{1,3})\s+(?:лет|года|год)(?![\p{L}])/gu,(_,age)=>`${age} ${Number(age)===1?'year':'years'}`);
  return out;
}
function translateNode(n){
  if(!n)return;
  if(n.nodeType===3){
    if(!CYR.test(n.nodeValue||''))return;
    const parent=n.parentElement;
    if(parent?.closest('script,style,textarea,code,[data-nut-no-translate]'))return;
    const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;
  }else if(n.nodeType===1){
    const e=n;
    if(e.matches('script,style,textarea,code,[data-nut-no-translate]'))return;
    for(const attr of ['placeholder','title','aria-label']){
      const v=e.getAttribute(attr);if(v&&CYR.test(v)){const t=tr(v);if(t!==v)e.setAttribute(attr,t);}
    }
  }
}
function scan(node){
  if(!node)return;
  translateNode(node);
  if(node.nodeType!==1&&node.nodeType!==9&&node.nodeType!==11)return;
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let n;while(n=walker.nextNode())translateNode(n);
}
const observer=new MutationObserver(changes=>{
  for(const ch of changes){
    if(ch.type==='characterData')translateNode(ch.target);
    else if(ch.type==='attributes')translateNode(ch.target);
    else if(ch.type==='childList')for(const n of ch.addedNodes)scan(n);
  }
});
function init(){
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
  scan(document.body);
}
window.addEventListener('beforeprint',()=>scan(document.body));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
// Keys, search, original Russian tags and classification are untouched.
const specialFoodNames={
  mayonnaise_30pct:'Mayonnaise, 30% fat',
  mayonnaise_50pct:'Mayonnaise, 50% fat',
  mayonnaise_67pct:'Mayonnaise, 67% fat',
  mayonnaise_vegan:'Vegan mayonnaise'
};
const aliases=p=>foodName(p);
function foodName(p){
 if(!p)return '';
 if(specialFoodNames[p.key])return specialFoodNames[p.key];
 if(p.name_en&&/[a-z]/i.test(p.name_en))return String(p.name_en);
 const name=String(p.name||'');
 if(name&&/[a-z]/i.test(name)&&!CYR.test(name))return name;
 const original=String(p.name_ru||name||p.key||'');
 // Do not invent a full food name from isolated translated ingredients.
 return original;
}
window.VMNutritionEN={tr,foodName,aliases,translateNow:()=>scan(document.body)};
Promise.all([
 fetch('/assets/nutrition-en-dictionary.json?v=20261011en1').then(r=>{if(!r.ok)throw Error('Dictionary unavailable');return r.json();}),
 fetch('/assets/nutrition-en-ui.json?v=20261011en1').then(r=>{if(!r.ok)throw Error('Dictionary unavailable');return r.json();}),
 ...['science','model','details','visuals','app','atlas','priorities','profile'].map(k=>fetch('/assets/nutrition-en-'+k+'.json?v=20261011en1').then(r=>{if(!r.ok)throw Error(k+' dictionary unavailable');return r.json();}))
]).then(setDictionaries).catch(e=>{console.error('English translations could not load',e);document.documentElement.dataset.nutTranslationError='true';});
})();