/* Contract tests for the read-only verified-source explorer. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'assets/js/99-nutrient-source-explorer-v6.1.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(index.includes('99-nutrient-source-explorer-v6.1.js'));
new vm.Script(script);
const nodes={},events={};
function element(id){
  return {id,innerHTML:'',textContent:'',value:'',attributes:{},open:false,
    setAttribute(k,v){this.attributes[k]=v;},
    getAttribute(k){return this.attributes[k]||'';},
    removeAttribute(k){delete this.attributes[k];},
    showModal(){this.open=true;},
    close(){this.open=false;},
    focus(){},
  };
}
for(const id of ['arSourcesTitle','arSourcesIntro','arSourcesSearch','arSourcesResults'])nodes[id]=element(id);
const doc={readyState:'complete',body:{appendChild(node){nodes[node.id]=node;}},
  createElement(){return element('');},
  getElementById(id){return nodes[id]||null;},
  addEventListener(k,fn){events[k]=fn;}
};
function product(key,name,value,status,method,tier='HIGH'){
  return {key,name_ru:name,vitamin_a_mcg:value,
    data_quality_v1_3:{review_status:status,confidence_tier:tier},
    nutrient_provenance_v1_3:{[method]:['vitamin_a_mcg']}};
}
const items=[
  product('carrot','Морковь',850,'VERIFIED','MEASURED'),
  product('pumpkin','Тыква',450,'VERIFIED','LABEL'),
  product('needs_review','Непроверенная карточка',50000,'REVIEW_REQUIRED','MEASURED'),
  product('zero','Условный нуль',0,'VERIFIED','ASSUMED_ZERO'),
  product('imputed','Прогнозное значение',2000,'VERIFIED','IMPUTED'),
  product('unknown','Нет основания поля',500,'VERIFIED','MISSING'),
  product('low','Низкая достоверность',6000,'VERIFIED','MEASURED','LOW'),
  product('unsafe','<img src=x onerror=alert(1)>',650,'VERIFIED','MEASURED'),
];
const quality={
  fieldName(k){return k;},
  classifyProduct(p){return {review_status:p.data_quality_v1_3.review_status,tier:p.data_quality_v1_3.confidence_tier};},
  methodFor(p,key){for(const [type,fields] of Object.entries(p.nutrient_provenance_v1_3))if(fields.includes(key))return type;return 'MISSING';}
};
const w={DB:{items},ProductDataQualityV13:quality,
  NutritionAnalysisWorkspaceHF7:{getViewModel(){return {nutrients:[{key:'vitamin_a_mcg',title:'Витамин A',unit:'мкг'}]};}}};
vm.runInNewContext(script,{window:w,document:doc});
const api=w.NutritionNutrientSourceExplorer;
assert(api);
const found=api.candidates('vitamin_a_mcg');
assert.deepEqual(Array.from(found.map(x=>x.key)),['carrot','unsafe','pumpkin']);
assert(!found.some(x=>x.key==='needs_review'));
assert(!found.some(x=>x.key==='imputed'));
api.open('vitamin_a_mcg');
assert(nodes.arFoodSourcesDialog.open);
assert.match(nodes.arSourcesIntro.innerHTML,/NIH ODS/);
assert.match(nodes.arSourcesResults.innerHTML,/Морковь/);
assert.match(nodes.arSourcesResults.innerHTML,/&lt;img/);
assert.doesNotMatch(nodes.arSourcesResults.innerHTML,/<img src=x/);
nodes.arSourcesSearch.value='тыква';
events.input({target:nodes.arSourcesSearch});
assert.match(nodes.arSourcesResults.innerHTML,/Тыква/);
assert.doesNotMatch(nodes.arSourcesResults.innerHTML,/Морковь/);
nodes.arSourcesSearch.value='такого нет';
events.input({target:nodes.arSourcesSearch});
assert.match(nodes.arSourcesResults.innerHTML,/такого названия нет/);
console.log('PASS: verified source filter, method provenance, quality boundary, escaped output and catalog search');
