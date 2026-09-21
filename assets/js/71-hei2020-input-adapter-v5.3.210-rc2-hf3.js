/* HEI-2020 input adapter — explicit equivalents first, audited fallbacks second. */
(function(w){'use strict';
var VERSION='v5.3.210-rc2-hf3-hei-adapter';
function num(v,d){v=Number(v);return isFinite(v)?v:(d==null?0:d);}function finite(v){return v!==null&&v!==''&&typeof v!=='boolean'&&isFinite(Number(v));}
function dbGet(db,key){if(!db)return null;if(db.byKey&&typeof db.byKey.get==='function')return db.byKey.get(key)||null;if(typeof db.get==='function')return db.get(key)||null;return db[key]||null;}
function mapData(){try{var el=document.getElementById('hei_map');return el?JSON.parse(el.textContent||'{}'):{};}catch(_){return {};}}
function methodFor(p,field){var q=w.ProductDataQualityV13;return q&&typeof q.methodFor==='function'?q.methodFor(p,field):(finite(p&&p[field])?'UNSPECIFIED':'MISSING');}
function field(p,field){return finite(p&&p[field])?Number(p[field]):null;}
function eqValue(p,fieldName,audit){var v=field(p,fieldName),method=methodFor(p,fieldName);audit.methods[method]=(audit.methods[method]||0)+1;if(v==null){audit.missing++;return null;}if(method==='ASSUMED_ZERO')audit.assumedZero++;else if(method==='MISSING'||method==='UNSPECIFIED'){audit.fallback++;}else audit.explicit++;return {value:v,method:method};}
function createAudit(){return {explicit:0,fallback:0,assumedZero:0,missing:0,conflicts:[],methods:{},derivedMassFromTsp:0};}
function confidence(a){var total=a.explicit+a.fallback+a.assumedZero+a.missing;if(!total)return 'LOW';var score=(a.explicit+0.65*a.fallback+0.1*a.assumedZero)/(total||1);return a.missing||score<0.45?'LOW':score<0.82?'MEDIUM':'HIGH';}
function adapt(ration,db){
 var c=w.__HEIClassifiers||{},hm=mapData();var audits={foodEquivalents:createAudit(),addedSugars:createAudit()};
 var acc={fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,grains_refined:0,dairy:0,protein_excl_legumes:0,legumes_as_protein:0,legumes_veg_total:0,legumes_greens_beans:0,seafood_plant:0,sodium_mg:0,fatty_sfa_g:0,fatty_unsat_g:0,added_sugars_g:0,added_sugars_tsp_eq:0,added_sugars_tsp:0,added_sugars_kcal:0,energy_kcal:0};
 function is(fn,p){try{return typeof c[fn]==='function'&&c[fn](p);}catch(_){return false;}}
 function fallback(target,g,denom){if(denom&&isFinite(denom)&&denom>0){acc[target]+=g/denom;audits.foodEquivalents.fallback++;return true;}return false;}
 function explicit(p,g,fieldName,target){var q=eqValue(p,fieldName,audits.foodEquivalents);if(!q)return false;acc[target]+=g*q.value/100;return true;}
 (Array.isArray(ration)?ration:[]).forEach(function(it){var g=Math.max(0,num(it&&it.grams)),p=dbGet(db,it&&it.key);if(!(g>0)||!p)return;
  acc.energy_kcal+=g*num(p.kcal)/100;acc.sodium_mg+=g*num(p.sodium_mg)/100;acc.fatty_sfa_g+=g*num(p.sfa)/100;acc.fatty_unsat_g+=g*num(p.unsat)/100;
  var legume=is('isLegume',p),veg=is('isVeg',p),fruit=is('isFruit',p),leafy=is('isLeafy',p),wholeGrain=is('isWholeGrain',p),refined=is('isRefinedGrain',p),protein=is('isProteinFood',p),seaPlant=is('isSeafoodPlantProtein',p);
  var fruitUsed=explicit(p,g,'fruit_cup_eq_per_100g','fruits_total');var wholeFruitUsed=explicit(p,g,'whole_fruit_cup_eq_per_100g','fruits_whole');
  var v=eqValue(p,'veg_cup_eq_per_100g',audits.foodEquivalents);var vegUsed=!!v;if(v){if(legume)acc.legumes_veg_total+=g*v.value/100;else acc.vegetables_total+=g*v.value/100;}
  var gb=eqValue(p,'greens_beans_cup_eq_per_100g',audits.foodEquivalents);var greensUsed=!!gb;if(gb){if(legume)acc.legumes_greens_beans+=g*gb.value/100;else acc.greens_beans+=g*gb.value/100;}
  var dairyUsed=explicit(p,g,'dairy_cup_eq_per_100g','dairy'),wgUsed=explicit(p,g,'whole_grain_oz_eq_per_100g','grains_whole'),rgUsed=explicit(p,g,'refined_grain_oz_eq_per_100g','grains_refined');
  var pr=eqValue(p,'protein_oz_eq_per_100g',audits.foodEquivalents);if(pr){if(legume)acc.legumes_as_protein+=g*pr.value/100;else acc.protein_excl_legumes+=g*pr.value/100;}
  var spUsed=explicit(p,g,'seafood_plant_oz_eq_per_100g','seafood_plant');
  var tsp=eqValue(p,'added_sugars_tsp_eq_per_100g',audits.addedSugars),grams=field(p,'added_sugar'),gramsMethod=methodFor(p,'added_sugar');
  var useTsp=!!tsp&&!(tsp.value===0&&(tsp.method==='ASSUMED_ZERO'||tsp.method==='MISSING'||tsp.method==='UNSPECIFIED')&&grams>0);
  if(useTsp){var t=g*tsp.value/100;acc.added_sugars_tsp_eq+=t;acc.added_sugars_tsp+=t;acc.added_sugars_kcal+=t*16;acc.added_sugars_g+=t*4;audits.addedSugars.derivedMassFromTsp+=t*4;if(grams!=null&&Math.abs(g*grams/100-t*4)>0.5)audits.addedSugars.conflicts.push({key:it.key,selected:'tsp_equivalent'});}
  else if(grams!=null){var sg=g*grams/100;acc.added_sugars_g+=sg;acc.added_sugars_kcal+=sg*4;acc.added_sugars_tsp_eq+=sg/4;acc.added_sugars_tsp+=sg/4;audits.addedSugars.methods[gramsMethod]=(audits.addedSugars.methods[gramsMethod]||0)+1;if(gramsMethod==='ASSUMED_ZERO')audits.addedSugars.assumedZero++;else if(gramsMethod==='MISSING'||gramsMethod==='UNSPECIFIED')audits.addedSugars.fallback++;else audits.addedSugars.explicit++;}
  else {audits.addedSugars.missing++;}
  if(!vegUsed&&veg)fallback('vegetables_total',g,typeof c.vegetableCupEqGrams==='function'?c.vegetableCupEqGrams(p):130);
  if(!greensUsed&&leafy)fallback('greens_beans',g,typeof c.greensBeansCupEqGrams==='function'?c.greensBeansCupEqGrams(p):130);
  if(!vegUsed&&legume&&!veg)fallback('legumes_veg_total',g,typeof c.legumeCupEqGrams==='function'?c.legumeCupEqGrams(p):172);
  if(!greensUsed&&legume&&!leafy)fallback('legumes_greens_beans',g,typeof c.legumeCupEqGrams==='function'?c.legumeCupEqGrams(p):172);
  if(!fruitUsed&&fruit)fallback('fruits_total',g,typeof c.fruitCupEqGrams==='function'?c.fruitCupEqGrams(p):150);
  if(!wholeFruitUsed&&fruit)fallback('fruits_whole',g,typeof c.fruitCupEqGrams==='function'?c.fruitCupEqGrams(p):150);
  if(!dairyUsed){var de=typeof c.dairyCupEqGrams==='function'?c.dairyCupEqGrams(p):null;if(de)fallback('dairy',g,de);}
  if(!wgUsed&&wholeGrain)fallback('grains_whole',g,typeof c.grainOzEqGrams==='function'?c.grainOzEqGrams(p):(hm.oz_eq&&hm.oz_eq['grain.cooked']||85));
  if(!rgUsed&&refined)fallback('grains_refined',g,typeof c.grainOzEqGrams==='function'?c.grainOzEqGrams(p):(hm.oz_eq&&hm.oz_eq['grain.cooked']||85));
  if(!pr&&protein){var ozg=typeof c.proteinOzEqGrams==='function'?c.proteinOzEqGrams(p):28.35;if(legume)fallback('legumes_as_protein',g,ozg);else fallback('protein_excl_legumes',g,ozg);}
  if(!spUsed&&seaPlant)fallback('seafood_plant',g,typeof c.proteinOzEqGrams==='function'?c.proteinOzEqGrams(p):28.35);
 });
 audits.foodEquivalents.confidence=confidence(audits.foodEquivalents);audits.addedSugars.confidence=confidence(audits.addedSugars);
 var dq=w.ProductDataQualityV13,quality={foodEquivalents:audits.foodEquivalents,addedSugars:audits.addedSugars};
 if(dq&&typeof dq.nutrientAnalysis==='function'){quality.sodium=dq.nutrientAnalysis(ration,db,'sodium_mg');quality.saturatedFat=dq.nutrientAnalysis(ration,db,'sfa');quality.addedSugarNutrient=dq.nutrientAnalysis(ration,db,'added_sugar');}
 acc.fieldAudit=audits;acc.dataQuality=quality;acc.adapterVersion=VERSION;return acc;
}
var api={version:VERSION,adapt:adapt};try{if(Object.freeze)Object.freeze(api);}catch(_){}w.HEI2020InputAdapterV2=api;
})(window);
