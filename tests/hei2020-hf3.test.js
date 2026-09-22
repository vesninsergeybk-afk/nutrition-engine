'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
function source(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function near(a,b,t=1e-8,msg=''){assert.ok(Math.abs(Number(a)-Number(b))<=t,`${msg} expected ${b}, got ${a}`);}
function context(extra={}){
  const listeners={};
  const document={
    readyState:'complete',
    getElementById(id){return id==='hei_map'?{textContent:'{"cup_eq":{},"oz_eq":{}}'}:null;},
    querySelector(){return null;},
    addEventListener(){},
    createElement(){return {className:'',innerHTML:'',setAttribute(){},appendChild(){}};}
  };
  const w={document,console,setTimeout(fn){fn();return 1;},clearTimeout(){},CustomEvent:function(name,init){this.type=name;this.detail=init&&init.detail;},addEventListener(name,fn){(listeners[name]||(listeners[name]=[])).push(fn);},dispatchEvent(ev){(listeners[ev.type]||[]).forEach(fn=>fn(ev));},...extra};
  w.window=w;w.globalThis=w;
  return vm.createContext(w);
}
function load(ctx,rel){vm.runInContext(source(rel),ctx,{filename:rel});}
let assertions=0;function check(fn){fn();assertions++;}

const ctx=context();
load(ctx,'assets/js/70-hei2020-core-v5.3.210-rc2-hf3.js');
check(()=>assert.ok(ctx.HEI2020CoreV2));
const core=ctx.HEI2020CoreV2;
const base={energy_kcal:2000,fruits_total:1.6,fruits_whole:0.8,vegetables_total:2.2,greens_beans:0.4,grains_whole:3,grains_refined:3.6,dairy:2.6,protein_excl_legumes:5,legumes_as_protein:0,legumes_veg_total:0,legumes_greens_beans:0,seafood_plant:1.6,sodium_mg:2200,fatty_sfa_g:2000*0.08/9,fatty_unsat_g:2000*0.08/9*2.5,added_sugars_tsp_eq:2000*0.065/16};
const m=core.scoreIntake(base,{requestedEnergyRefKcal:3000});
check(()=>near(m.total,100));
check(()=>near(m.density.added_sugars_pct,6.5));
check(()=>near(m.density.sat_fats_pct,8));
check(()=>assert.strictEqual(m.energyRefKcal,2000));
check(()=>assert.strictEqual(m.compat.requestedEnergyIgnored,true));
check(()=>assert.strictEqual(m.grade,'A'));
const staleSugar=core.scoreIntake({energy_kcal:1000,added_sugars_kcal:0,added_sugars_tsp_eq:2});
check(()=>near(staleSugar.intake.added_sugars_kcal,32));
check(()=>near(staleSugar.density.added_sugars_pct,3.2));
const conflictingSugar=core.scoreIntake({energy_kcal:1000,added_sugars_kcal:80,added_sugars_tsp_eq:2});
check(()=>near(conflictingSugar.intake.added_sugars_kcal,32));
const doubled={};Object.keys(base).forEach(k=>doubled[k]=typeof base[k]==='number'?base[k]*2:base[k]);
const m2=core.scoreIntake(doubled);
check(()=>near(m2.total,m.total));
check(()=>near(m2.density.added_sugars_pct,m.density.added_sugars_pct));
const sfaZero=core.scoreIntake({...base,fatty_sfa_g:2000*0.16/9});
check(()=>near(sfaZero.points.sat_fats_pct,0));
const invalid=core.scoreIntake({energy_kcal:0});
check(()=>assert.strictEqual(invalid.valid,false));

// Defence in depth: even if the HF3 adapter is unavailable, the legacy intake fallback
// uses 4 g per teaspoon-equivalent and never lets a stale zero hide positive sugar grams.
for (const rel of ['assets/js/01-hei-module.js','assets/legacy/js/01-hei-module.js']) {
  const fallback=context(); load(fallback,rel);
  const fallbackDb={byKey:new Map([
    ['zero-vs-grams',{key:'zero-vs-grams',kcal:100,added_sugar:5,added_sugars_tsp_eq_per_100g:0}],
    ['native-tsp',{key:'native-tsp',kcal:100,added_sugar:20,added_sugars_tsp_eq_per_100g:2}],
    ['null-vs-grams',{key:'null-vs-grams',kcal:100,added_sugar:5,added_sugars_tsp_eq_per_100g:null}]
  ])};
  const zeroFallback=fallback.HEI.computeIntake([{key:'zero-vs-grams',grams:100}],fallbackDb);
  check(()=>near(zeroFallback.added_sugars_g,5));
  check(()=>near(zeroFallback.added_sugars_tsp,1.25));
  const tspFallback=fallback.HEI.computeIntake([{key:'native-tsp',grams:100}],fallbackDb);
  check(()=>near(tspFallback.added_sugars_g,8));
  check(()=>near(tspFallback.added_sugars_tsp,2));
  const nullFallback=fallback.HEI.computeIntake([{key:'null-vs-grams',grams:100}],fallbackDb);
  check(()=>near(nullFallback.added_sugars_g,5));
}

load(ctx,'assets/js/71-hei2020-input-adapter-v5.3.210-rc2-hf3.js');
ctx.__HEIClassifiers={isLegume:()=>false,isVeg:()=>false,isFruit:()=>false,isLeafy:()=>false,isWholeGrain:()=>false,isRefinedGrain:()=>false,isProteinFood:()=>false,isSeafoodPlantProtein:()=>false};
ctx.ProductDataQualityV13={methodFor(p,k){const groups=p.nutrient_provenance_v1_3||{};for(const method of Object.keys(groups))if((groups[method]||[]).includes(k))return method;return 'MISSING';},nutrientAnalysis(){return {confidence_tier:'HIGH',assumed_zero_products:0,missing_products:0};}};
let p={key:'sugar-conflict',kcal:100,sfa:0,unsat:0,sodium_mg:0,added_sugar:10,added_sugars_tsp_eq_per_100g:0,nutrient_provenance_v1_3:{CALCULATED:['added_sugar']}};
let db={byKey:new Map([[p.key,p]])};
let intake=ctx.HEI2020InputAdapterV2.adapt([{key:p.key,grams:100}],db);
check(()=>near(intake.added_sugars_kcal,40));
check(()=>near(intake.added_sugars_g,10));
p={...p,key:'sugar-tsp',added_sugars_tsp_eq_per_100g:2,added_sugar:20};db={byKey:new Map([[p.key,p]])};
intake=ctx.HEI2020InputAdapterV2.adapt([{key:p.key,grams:100}],db);
check(()=>near(intake.added_sugars_kcal,32));
check(()=>assert.strictEqual(intake.fieldAudit.addedSugars.conflicts.length,1));
check(()=>assert.ok(intake.fieldAudit.foodEquivalents.fallback>=0));
check(()=>assert.ok(intake.fieldAudit.addedSugars.derivedMassFromTsp>0));
// Null/empty equivalent fields are missing, not confirmed zero; an unspecified zero cannot suppress positive grams.
p={...p,key:'sugar-null',added_sugars_tsp_eq_per_100g:null,added_sugar:5,nutrient_provenance_v1_3:{LABEL:['added_sugar']}};db={byKey:new Map([[p.key,p]])};
intake=ctx.HEI2020InputAdapterV2.adapt([{key:p.key,grams:100}],db);
check(()=>near(intake.added_sugars_kcal,20));
check(()=>assert.strictEqual(intake.fieldAudit.addedSugars.explicit,1));
p={...p,key:'sugar-unspecified-zero',added_sugars_tsp_eq_per_100g:0,added_sugar:5,nutrient_provenance_v1_3:{LABEL:['added_sugar']}};db={byKey:new Map([[p.key,p]])};
intake=ctx.HEI2020InputAdapterV2.adapt([{key:p.key,grams:100}],db);
check(()=>near(intake.added_sugars_kcal,20));

load(ctx,'assets/js/73-hei2020-runtime-bridge-v5.3.210-rc2-hf3.js');
ctx.CompositeNutrientRoutingV53107={toFoodPatternEntries(){return [{key:'child',grams:50}];}};
const child={key:'child',kcal:200,sfa:2,unsat:4,sodium_mg:100,added_sugar:0,fruit_cup_eq_per_100g:0,whole_fruit_cup_eq_per_100g:0,veg_cup_eq_per_100g:0,greens_beans_cup_eq_per_100g:0,dairy_cup_eq_per_100g:0,whole_grain_oz_eq_per_100g:0,refined_grain_oz_eq_per_100g:0,protein_oz_eq_per_100g:0,seafood_plant_oz_eq_per_100g:0,added_sugars_tsp_eq_per_100g:0};
ctx.DB={byKey:new Map([[child.key,child]])};
const routed=ctx.HEIRuntimeV2.calculate({ration:[{key:'root',grams:999}],db:ctx.DB,requestedEnergyRefKcal:2000});
check(()=>near(routed.intake.energy_kcal,100));
check(()=>assert.strictEqual(routed.energyRefKcal,100));

// Load actual classifier layer and product database, then verify the Kiev recipe path.
const actual=context();
load(actual,'assets/js/70-hei2020-core-v5.3.210-rc2-hf3.js');
load(actual,'assets/js/02-product-data-quality-v5.3.210-p1.3.js');
load(actual,'assets/js/71-hei2020-input-adapter-v5.3.210-rc2-hf3.js');
load(actual,'assets/js/73-hei2020-runtime-bridge-v5.3.210-rc2-hf3.js');
load(actual,'assets/js/01-hei-module.js');
const products=[];
for(const file of fs.readdirSync(path.join(ROOT,'data')).filter(x=>/^products\.v5\.3\.210-p1\.3\.part-\d+\.json$/.test(x)).sort())products.push(...JSON.parse(fs.readFileSync(path.join(ROOT,'data',file),'utf8')));
const byKey=new Map(products.map(x=>[x.key,x]));actual.DB={byKey};
const kiev=byKey.get('chicken_kiev_cutlet_ready');
check(()=>assert.ok(kiev&&kiev.composite_food_model_latest));
const children=kiev.composite_food_model_latest.components.map(x=>({key:x.key,grams:x.g_per_100g*1.8}));
const kievModel=actual.HEIRuntimeV2.calculate({ration:children,db:actual.DB,requestedEnergyRefKcal:2500});
check(()=>assert.ok(kievModel.intake.energy_kcal>500&&kievModel.intake.energy_kcal<650));
check(()=>assert.ok(kievModel.density.sat_fats_pct>20));
check(()=>near(kievModel.points.sat_fats_pct,0));
check(()=>assert.strictEqual(kievModel.compat.requestedEnergyIgnored,true));

// Migration parity: all non-sugar HEI inputs remain identical to the former explicit-field route.
function legacyExplicitIntake(ration,db){
  const out={fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,grains_refined:0,dairy:0,protein_excl_legumes:0,legumes_as_protein:0,legumes_veg_total:0,legumes_greens_beans:0,seafood_plant:0,sodium_mg:0,fatty_sfa_g:0,fatty_unsat_g:0,energy_kcal:0};
  for(const it of ration){const product=db.byKey.get(it.key),g=it.grams;if(!product||!(g>0))continue;out.energy_kcal+=g*(product.kcal||0)/100;out.sodium_mg+=g*(product.sodium_mg||0)/100;out.fatty_sfa_g+=g*(product.sfa||0)/100;out.fatty_unsat_g+=g*(product.unsat||0)/100;const leg=actual.__HEIClassifiers.isLegume(product);const add=(field,target)=>{out[target]+=g*Number(product[field])/100;};add('fruit_cup_eq_per_100g','fruits_total');add('whole_fruit_cup_eq_per_100g','fruits_whole');if(leg)out.legumes_veg_total+=g*Number(product.veg_cup_eq_per_100g)/100;else add('veg_cup_eq_per_100g','vegetables_total');if(leg)out.legumes_greens_beans+=g*Number(product.greens_beans_cup_eq_per_100g)/100;else add('greens_beans_cup_eq_per_100g','greens_beans');add('dairy_cup_eq_per_100g','dairy');add('whole_grain_oz_eq_per_100g','grains_whole');add('refined_grain_oz_eq_per_100g','grains_refined');if(leg)out.legumes_as_protein+=g*Number(product.protein_oz_eq_per_100g)/100;else add('protein_oz_eq_per_100g','protein_excl_legumes');add('seafood_plant_oz_eq_per_100g','seafood_plant');}
  return out;
}
const eqFields=['fruit_cup_eq_per_100g','whole_fruit_cup_eq_per_100g','veg_cup_eq_per_100g','greens_beans_cup_eq_per_100g','dairy_cup_eq_per_100g','whole_grain_oz_eq_per_100g','refined_grain_oz_eq_per_100g','protein_oz_eq_per_100g','seafood_plant_oz_eq_per_100g'];
const leaf=products.filter(x=>!x.root_hei_direct_counting_disabled&&!x.is_composite_food&&Number.isFinite(Number(x.kcal))&&eqFields.every(k=>Number.isFinite(Number(x[k]))));
let seed=531210;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
check(()=>{for(let caseNo=0;caseNo<200;caseNo++){const ration=[];for(let j=0;j<6;j++){const product=leaf[Math.floor(rnd()*leaf.length)];ration.push({key:product.key,grams:5+Math.floor(rnd()*246)});}const oldI=legacyExplicitIntake(ration,actual.DB),newI=actual.HEI2020InputAdapterV2.adapt(ration,actual.DB);for(const key of Object.keys(oldI))near(newI[key],oldI[key],1e-7,`parity case ${caseNo} ${key}`);}});

// Independent interpretation must preserve HEI, surface real exceedances and keep remote data gaps quiet.
const ic=context();
ic.DB={};
ic.ProductDataQualityV13={nutrientAnalysis(ration,db,key){
  if(key==='vitamin_c_mg')return {confidence_tier:'LOW',uncertainty_abs:5,assumed_zero_products:0,missing_products:1};
  if(key==='iodine_mcg')return {confidence_tier:'LOW',uncertainty_abs:0,assumed_zero_products:0,missing_products:1};
  return {confidence_tier:'HIGH',uncertainty_abs:0,assumed_zero_products:0,missing_products:0};
}};
ic.NutritionNormativeRegistry={
 data:{nutrients:{vitamin_d_mcg:{title:'Витамин D',unit:'мкг'},vitamin_a_mcg:{title:'Витамин A',unit:'мкг РЭ'},vitamin_c_mg:{title:'Витамин C',unit:'мг'},iodine_mcg:{title:'Йод',unit:'мкг'}}},
 resolveDerived(key,c){if(key==='sfa_g')return {value:c.energyKcal*0.10/9};if(key==='added_sugars_g')return {value:c.energyKcal*0.10/4};if(key==='sodium_mg_public_health_max')return {value:2000};return null;},
 resolveMicro(key){if(key==='vitamin_d_mcg')return {ul:{value:100,scope:'total'}};if(key==='vitamin_a_mcg')return {ul:{value:3000,scope:'retinol_only'}};if(key==='vitamin_c_mg')return {ul:{value:2000,scope:'total'}};if(key==='iodine_mcg')return {ul:{value:1100,scope:'total'}};return {ul:null};}
};
load(ic,'assets/js/72-diet-interpretation-engine-v5.3.210-rc2-hf3.js');
const hei={valid:true,total:85,grade:'B',points:{sat_fats_pct:2,added_sugars_pct:10,sodium_g:8},components:{},density:{sat_fats_pct:12,added_sugars_pct:5},intake:{energy_kcal:2000,fatty_sfa_g:26.7,added_sugars_g:25,sodium_mg:2500},dataQuality:{foodEquivalents:{confidence:'HIGH'},sodium:{confidence_tier:'HIGH'},saturatedFat:{confidence_tier:'HIGH'},addedSugars:{confidence:'HIGH'}}};
const snapshot={rawRation:[{key:'x',grams:100}],nutrientRation:[{key:'x',grams:100}],totals:{kcal:2000,sfa_g:26.7,added_sugars_g:25,sodium_mg:2500,vitamin_d_mcg:120,vitamin_a_mcg:4000,vitamin_c_mg:50}};
const assessment=ic.DietInterpretationEngineV1.build(hei,snapshot,{profile:{age:34,sex:'female',region:'us'}});
check(()=>assert.strictEqual(assessment.hei.total,85));
check(()=>assert.ok(assessment.guidelineFlags.some(x=>x.id==='saturated_fat_general_limit')));
check(()=>assert.ok(assessment.guidelineFlags.some(x=>x.id==='sodium_absolute_limit')));
check(()=>assert.ok(assessment.upperLimitFlags.some(x=>x.id==='ul_vitamin_d_mcg')));
check(()=>assert.ok(assessment.limitations.some(x=>x.id==='ul_vitamin_a_mcg')));
check(()=>assert.ok(assessment.limitations.some(x=>x.id==='trans_fat')));
check(()=>assert.ok(!assessment.limitations.some(x=>x.id.includes('vitamin_c_mg'))));
check(()=>assert.ok(!assessment.limitations.some(x=>x.id.includes('iodine_mcg'))));

// A low-confidence estimate becomes a limitation only when uncertainty can cross the UL.
ic.NutritionNormativeRegistry.resolveMicro=function(key){if(key==='vitamin_c_mg')return {ul:{value:100,scope:'total'}};return {ul:null};};
const nearUl=ic.DietInterpretationEngineV1.build({...hei,density:{sat_fats_pct:5,added_sugars_pct:5},intake:{energy_kcal:2000,fatty_sfa_g:10,added_sugars_g:25,sodium_mg:1000}},
  {rawRation:[{key:'x',grams:100}],nutrientRation:[{key:'x',grams:100}],totals:{vitamin_c_mg:95}}, {profile:{age:34,sex:'female',region:'us'}});
check(()=>assert.ok(nearUl.limitations.some(x=>x.id==='ul_vitamin_c_mg_uncertain')));
check(()=>assert.strictEqual(nearUl.guidelineFlags.length,0));

console.log(`hei2020_hf3: PASS (${assertions})`);
