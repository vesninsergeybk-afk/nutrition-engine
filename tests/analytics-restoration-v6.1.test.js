/* Dependency-free browser contract check for the progressive analytics layer.
 * Run: node tests/analytics-restoration-v6.1.test.js
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/98-analytics-restoration-v6.1.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('98-analytics-restoration-v6.1.js'),'new layer is loaded in the live index');
assert(html.includes('analytics-restoration-v6.1.css'),'analytics CSS is loaded');
new vm.Script(source,{filename:'98-analytics-restoration-v6.1.js'});

const nodes={},events={};
function makeNode(id){
  return {id:id||'',className:'',value:'',attributes:{},innerHTML:'',parentNode:null,
    setAttribute(k,v){this.attributes[k]=v;},
    getAttribute(k){return this.attributes[k]||'';},
    querySelectorAll(){return [];},
    addEventListener(){},
  };
}
const main=makeNode('mainContent'),anchor=makeNode('heiPanel'),out=makeNode('needs_out'),split=makeNode('needs_split');
split.value='4|25,35,30,10';
Object.assign(nodes,{mainContent:main,heiPanel:anchor,needs_out:out,needs_split:split,
  'normInput-kcal':{value:'2000'},'normInput-protein_g':{value:'90'},
  'normInput-fat_g':{value:'70'},'normInput-carbs_g':{value:'260'}});
main.insertBefore=node=>{
  nodes[node.id]=node;
  if(node.id==='nutritionInsightDashboard')nodes.arBody=makeNode('arBody');
};
out.parentNode={insertBefore(node){nodes[node.id]=node;}};

const document={readyState:'complete',
  documentElement:{getAttribute(k){return k==='data-profile-calculation-state'?'current':'long';}},
  getElementById(k){return nodes[k]||null;},
  createElement(){return makeNode('');},
  addEventListener(k,handler){events[k]=handler;},
};
let data={
  items:2,
  snapshot:{totals:{kcal:1500,protein_g:60,fat_g:50,carbs_g:200,water_ml:900}},
  nutrients:[{key:'vitamin_a',title:'Витамин A',unit:'мкг',actual:500,target:750,mode:'minimum',
    group:'vitamins',status:{code:'medium',label:'Ниже ориентира',note:'Проверьте данные.'},
    coverage:{covered:1,total:2,items:[{name:'Морковь',share:100,value:500}]}}],
  hei:{model:{total:74.5},rows:[{key:'total_veg',title:'Овощи',points:3,maxPoints:5,
    status:{label:'Требует внимания'},actual:'1 порция',norm:'2 порции',
    contributors:{positive:{items:[{name:'Морковь',share:100,value:3}]}}}]},
};
let printed='',printedCount=0;
const popup={document:{open(){},write(s){printed=s;},close(){},body:{}},
  focus(){},setTimeout(fn){fn();},print(){printedCount++;}};
const window={
  clearTimeout(){},setTimeout(fn){fn();return 1;},addEventListener(){},
  __lastNeedsMeta:{ok:true,waterReference:{kind:'ai',valueL:2.5},workingEnergyTargetKcal:2000},
  __lastDietAnalysisProfile:{hei:74.5,dailyStructure:55},
  NutritionAnalysisWorkspaceHF7:{refresh(){},getViewModel(){return data;}},
  State:{get(){return [{key:'carrot',grams:100}];}},
  WorkspaceReportHF13:{buildReportModel(options){assert.equal(options.contributors,true);return {ration:{count:2}};},
    buildDocumentHtml(){return '<!doctype html><html><head></head><body><article id="canonical-report"><section class="workspace-report-section workspace-report-cover">Обложка</section><section id="detailed-report">Полный отчёт</section></article></body></html>'; }},
  open(){return popup;},
};
vm.runInNewContext(source,{window,document,Event:class Event{},CustomEvent:class CustomEvent{}});
assert(nodes.nutritionInsightDashboard,'section inserted');
assert.match(nodes.arBody.innerHTML,/Витамин A/);
assert.match(nodes.arBody.innerHTML,/Морковь/);
assert.match(nodes.arBody.innerHTML,/data-ar-source-key="vitamin_a"/);
assert.match(nodes.arBody.innerHTML,/рассчитанного вклада/);
assert.match(nodes.arBody.innerHTML,/неполные данные/);
assert.match(nodes.arBody.innerHTML,/74,5/);
assert.match(nodes.arBody.innerHTML,/data-ar-hei-jump="total_veg"/);
assert.match(nodes.arBody.innerHTML,/ar-hei-overview/);
assert.match(nodes.arBody.innerHTML,/Качество × структура/);
assert.match(nodes.arBody.innerHTML,/Вода в рационе/);
assert.match(nodes.arNeedsExtra.innerHTML,/2,5 л\/сут/);
assert.match(nodes.arNeedsExtra.innerHTML,/4 приёма/);
assert.equal(typeof events['needs:computed'],'function','listen to non-bubbling document event');
window.__lastNeedsMeta={ok:true,waterReference:{kind:'ai',valueL:2.0},workingEnergyTargetKcal:1800};
events['needs:computed']();
assert.match(nodes.arNeedsExtra.innerHTML,/2 л\/сут/,'needs recomputation updates water');
window.__lastNeedsMeta={ok:true,waterReference:{kind:'ai',valueL:2.0},workingEnergyTargetKcal:2000,totalProtein:100,fatGrams:60,carbGrams:240,macroCalculationAvailable:true,normsSyncAllowed:true};
events['needs:computed']();
assert.match(nodes.arNeedsExtra.innerHTML,/Б 25 г/,'per-meal protein uses working target');
assert.match(nodes.arNeedsExtra.innerHTML,/Ж 15 г/,'per-meal fat uses working target');
assert.match(nodes.arNeedsExtra.innerHTML,/У 60 г/,'per-meal carbohydrates use working target');
assert.equal(window.NutritionAnalyticsRestorationV1.print(),true);
assert.match(printed,/canonical-report/);
assert.match(printed,/Наглядный разбор показателей/);
assert(printed.indexOf('Обложка') < printed.indexOf('Наглядный разбор показателей'));
assert(printed.indexOf('Наглядный разбор показателей') < printed.indexOf('detailed-report'));
assert.match(printed,/break-inside:auto/);
assert.match(printed,/<details open/);
assert.equal(printedCount,1);
assert.match(printed,/data-ar-source-key=/);
data={items:0,hei:{model:{total:0},rows:[]}};
window.NutritionAnalyticsRestorationV1.refresh();
assert.match(nodes.arBody.innerHTML,/Графики появятся/);
assert.doesNotMatch(nodes.arBody.innerHTML,/0 из 100/);
data={items:1,snapshot:{totals:{kcal:300}},nutrients:[{title:'<img src=x onerror=alert(1)>',
  status:{label:'нет данных'},group:'basic',coverage:{covered:0,total:1}}],hei:{model:{total:64},rows:[]}};
window.NutritionAnalyticsRestorationV1.refresh();
assert.match(nodes.arBody.innerHTML,/&lt;img/);
assert.doesNotMatch(nodes.arBody.innerHTML,/<img src=x/);
console.log('PASS: entrypoint, water, meal split, nutrients, contributor provenance, HEI, matrix, print and empty states');
