'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','assets/js/83-workspace-correction-v5.3.210-rc2-hf11.js'),'utf8');
const listeners={};
const document={
  readyState:'complete',
  getElementById(){return null;},
  addEventListener(){},
  createElement(){return {setAttribute(){},insertBefore(){},appendChild(){},className:'',hidden:false,innerHTML:''};}
};
const products=new Map([
  ['banana',{name_ru:'Банан',category:'Фрукты'}],
  ['cheese',{name_ru:'Сыр Российский',category:'Сыры'}],
  ['butter',{name_ru:'Масло сливочное',category:'Масла'}]
]);
const metricSpecs={
  salt_g:{title:'Соль',unit:'г',target:6,mode:'upper_limit'},
  fiber_g:{title:'Клетчатка',unit:'г',target:30,mode:'adequacy'},
  kcal:{title:'Калории',unit:'ккал',target:2200,mode:'adequacy'}
};
const window={
  DB:{byKey:products},
  NutritionCalculationCore:{getMetricSpec:key=>metricSpecs[key]||null},
  State:{get:()=>[]},
  addEventListener(name,fn){listeners[name]=fn;},
  dispatchEvent(){},
  setTimeout(){return 0;},clearTimeout(){},
  CustomEvent:function(name,init){this.type=name;this.detail=init&&init.detail;}
};
const context={window,document,CustomEvent:window.CustomEvent,console,Date,JSON,Math,Number,String,Object,Array,Map,isFinite,setTimeout:window.setTimeout,clearTimeout:window.clearTimeout};
vm.createContext(context);vm.runInContext(source,context,{filename:'workspace-correction-hf11.js'});
const api=window.WorkspaceCorrectionHF11;assert.ok(api&&api._test,'HF11 test hooks unavailable');
const t=api._test;
let n=0;function check(name,fn){fn();n++;console.log('PASS',name);}
function contributor(key,grams){return {key,ref:key,name:products.get(key).name_ru,grams,value:10,share:50,item:{key,grams}};}
function scenario({meaningful=true,improves=true,portionOk=true,tradeoffs=[]}={}){
  return {targetResult:{meaningful,improves,gapClosed:0.2},portionCheck:{ok:portionOk,reason:portionOk?'':'Нереалистичная порция'},tradeoffs};
}
check('recommended limit terminology is distinct from UL',()=>{
  assert.equal(t.statusText({mode:'upper_limit',statusCode:'high',statusLabel:'Выше ориентира'}),'Выше рекомендуемого ограничения');
  assert.equal(t.statusText({mode:'upper_limit',statusCode:'critical',statusLabel:'Превышен UL'}),'Выше применимого верхнего уровня');
});
check('deficiency language does not blame the current source',()=>assert.ok(t.contributorLead({type:'nutrient',direction:'increase'},contributor('banana',300)).startsWith('Сейчас больше всего поступает из')));
check('excess language identifies the source of excess',()=>assert.ok(t.contributorLead({type:'nutrient',direction:'reduce'},contributor('cheese',180)).startsWith('Главный источник превышения')));
check('removing more than half a product is rejected',()=>assert.equal(t.portionCheck({direction:'reduce'},contributor('cheese',180),50).ok,false));
check('moderate reduction remains eligible',()=>assert.equal(t.portionCheck({direction:'reduce'},contributor('cheese',180),120).ok,true));
check('unrealistic banana increase is rejected',()=>assert.equal(t.portionCheck({direction:'increase'},contributor('banana',300),450).ok,false));
check('reasonable banana increase remains eligible',()=>assert.equal(t.portionCheck({direction:'increase'},contributor('banana',250),330).ok,true));
check('no target improvement cannot be applied',()=>{const v=t.verdict(scenario({improves:false}));assert.equal(v.applyAllowed,false);assert.equal(v.code,'not-helpful');});
check('imperceptible improvement cannot be applied',()=>{const v=t.verdict(scenario({meaningful:false}));assert.equal(v.applyAllowed,false);assert.equal(v.code,'not-helpful');});
check('multiple negative tradeoffs block automatic application',()=>{const v=t.verdict(scenario({tradeoffs:[{kind:'worse',weight:1},{kind:'worse',weight:1}]}));assert.equal(v.applyAllowed,false);assert.equal(v.code,'blocked');});
check('one moderate tradeoff requires review',()=>{const v=t.verdict(scenario({tradeoffs:[{kind:'worse',weight:1}]}));assert.equal(v.applyAllowed,true);assert.equal(v.code,'review');});
check('clear scenario is phrased cautiously',()=>{const v=t.verdict(scenario());assert.equal(v.code,'clear');assert.ok(/выглядит целесообразным/i.test(v.title));});
check('default increase is bounded and rounded',()=>{const p={type:'nutrient',actual:20,target:30,direction:'increase'};const a=t.defaultAfter(p,contributor('banana',200));assert.ok(a>200&&a<=300&&a%5===0);});
check('gentle option lies between current and main option',()=>{const p={type:'nutrient',actual:20,target:30,direction:'increase'};const c=contributor('banana',200);const main=t.defaultAfter(p,c),gentle=t.gentleAfter(p,c);assert.ok(gentle>200&&gentle<=main);});
console.log(JSON.stringify({status:'PASS',assertions:n},null,2));
