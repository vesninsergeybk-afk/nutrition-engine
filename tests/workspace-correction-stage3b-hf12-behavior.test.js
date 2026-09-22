'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','assets/js/85-workspace-correction-stage3b-v5.3.210-rc2-hf12.js'),'utf8');
const listeners={};const document={readyState:'complete',getElementById(){return null;},addEventListener(){},createElement(){return {}}};
const products=[
 {key:'cheese_salty',name_ru:'Сыр солёный',category:'Dairy',catalog_category_key:'cheese',hei_category_key:'dairy',tags:['cheese'],kcal:350,sodium_mg:1200,protein_g:25},
 {key:'cheese_mild',name_ru:'Сыр мягкий',category:'Dairy',catalog_category_key:'cheese',hei_category_key:'dairy',tags:['cheese'],kcal:320,sodium_mg:300,protein_g:22},
 {key:'apple',name_ru:'Яблоко',category:'Fruit',catalog_category_key:'fruit',hei_category_key:'fruits_whole',tags:['fruit'],kcal:52,fiber_g:2.4},
 {key:'beans_bad',name_ru:'Фасоль непроверенная',category:'Legumes',catalog_category_key:'legumes',hei_category_key:'seafood_plant_protein',tags:['legume'],kcal:100,fiber_g:30,data_quality_v1_3:{confidence_score:0.2,review_status:'REJECTED',missing_count:10}},
 {key:'beans',name_ru:'Фасоль',category:'Legumes',catalog_category_key:'legumes',hei_category_key:'seafood_plant_protein',tags:['legume'],kcal:127,fiber_g:7.4},
 {key:'salt',name_ru:'Соль',category:'Seasonings',catalog_category_key:'salt',hei_category_key:'other',tags:['seasoning'],kcal:0,sodium_mg:39000}
];
const byKey=new Map(products.map(x=>[x.key,x]));
const specs={sodium_mg:{title:'Натрий',unit:'мг',target:1500,mode:'upper_limit'},fiber_g:{title:'Клетчатка',unit:'г',target:30,mode:'adequacy'},kcal:{title:'Калории',unit:'ккал',target:2000,mode:'adequacy'},protein_g:{title:'Белок',unit:'г',target:80,mode:'adequacy'}};
function scaled(item){const p=byKey.get(item.key)||{},f=(item.grams||0)/100;return {kcal:(p.kcal||0)*f,sodium_mg:(p.sodium_mg||0)*f,fiber_g:(p.fiber_g||0)*f,protein_g:(p.protein_g||0)*f};}
function snapshot(items){const t={kcal:0,sodium_mg:0,fiber_g:0,protein_g:0};items.forEach(it=>{const r=scaled(it);Object.keys(t).forEach(k=>t[k]+=r[k]||0);});return {totals:t};}
function dev(key,v){const s=specs[key],t=s.target;return s.mode==='upper_limit'?Math.max(0,(v-t)/t):Math.max(0,(t-v)/t);}
const initial=[{id:'cheese_salty',key:'cheese_salty',grams:150},{id:'apple',key:'apple',grams:100}];
const models={reduce:null,increase:null};
function targetResult(p,b,a){const before=b.totals[p.key],after=a.totals[p.key],bd=dev(p.key,before),ad=dev(p.key,after);return {before,after,unit:p.unit,improves:ad<bd,meaningful:ad<bd&&Math.abs(after-before)>=0.1,gapClosed:bd?Math.max(0,bd-ad)/bd:0};}
function verdict(s){if(!s.targetResult.improves||!s.targetResult.meaningful)return {code:'not-helpful',candidate:false,applyAllowed:false,title:'Не помогает',text:''};const worse=(s.tradeoffs||[]).filter(x=>x.kind==='worse').length;if(worse>=2)return {code:'blocked',candidate:false,applyAllowed:false,title:'Плохо',text:''};return {code:worse?'review':'clear',candidate:true,applyAllowed:true,title:worse?'Неоднозначно':'Целесообразно',text:''};}
const window={DB:{items:products,byKey},NutritionCalculationCore:{getMetricSpec:k=>specs[k]||null,scaledPerItem:scaled,snapshot},HEIRuntimeV2:{calculateFromSnapshot:()=>({total:70,components:{},points:{}})},State:{get:()=>initial},NavigationShellV1:{getState:()=>({route:'correction'})},WorkspaceCorrectionHF11:{getModel:()=>models.current,getScenario:()=>null,getVerdict:()=>({candidate:false}),_test:{targetResult,verdict}},addEventListener(n,f){listeners[n]=f;},dispatchEvent(){},setTimeout(){return 0;},clearTimeout(){},CustomEvent:function(){}};
const ctx={window,document,CustomEvent:window.CustomEvent,console,Date,JSON,Math,Number,String,Object,Array,Map,RegExp,isFinite,setTimeout:window.setTimeout,clearTimeout:window.clearTimeout};vm.createContext(ctx);vm.runInContext(source,ctx);const t=window.WorkspaceCorrectionStage3BHF12._test;let n=0;function check(name,fn){fn();n++;console.log('PASS',name);}
const reducePriority={id:'nutrient:sodium_mg',type:'nutrient',key:'sodium_mg',title:'Натрий',unit:'мг',direction:'reduce',confidence:'высокая',contributors:[{ref:'cheese_salty',key:'cheese_salty',name:'Сыр солёный',grams:150,value:1800,share:100,item:initial[0]}]};
models.current={active:reducePriority,items:initial,vm:{snapshot:snapshot(initial),hei:{model:{total:70,components:{},points:{}}}}};
check('replacement keeps the food role',()=>{const rows=t.replacementCandidates(models.current);assert.ok(rows.length);assert.equal(rows[0].scenario.operations[0].productKey,'cheese_mild');assert.equal(rows[0].scenario.operations[0].type,'replace_item');});
check('salt is not treated as a cheese replacement',()=>assert.ok(!t.replacementCandidates(models.current).some(x=>x.scenario.operations[0].productKey==='salt')));
const increasePriority={id:'nutrient:fiber_g',type:'nutrient',key:'fiber_g',title:'Клетчатка',unit:'г',direction:'increase',confidence:'высокая',contributors:[{ref:'apple',key:'apple',name:'Яблоко',grams:100,value:2.4,share:100,item:initial[1]}]};
models.current={active:increasePriority,items:initial,vm:{snapshot:snapshot(initial),hei:{model:{total:70,components:{},points:{}}}}};
check('addition selects a plausible fibre source',()=>{const rows=t.additionCandidates(models.current);assert.ok(rows.length);assert.ok(rows.some(x=>x.scenario.operations[0].productKey==='beans'));assert.ok(rows.every(x=>x.scenario.operations[0].type==='add_item'));});
check('low-quality product is not proposed',()=>assert.ok(!t.additionCandidates(models.current).some(x=>x.scenario.operations[0].productKey==='beans_bad')));
check('candidate count remains capped',()=>assert.ok(t.additionCandidates(models.current).length<=3&&t.replacementCandidates({active:reducePriority,items:initial,vm:{snapshot:snapshot(initial),hei:{model:{total:70}}}}).length<=3));
console.log(JSON.stringify({status:'PASS',assertions:n},null,2));
