/* HEI-2020 canonical scoring core — RC2 HOTFIX3. Pure math, no DOM. */
(function(w){'use strict';
var VERSION='v5.3.210-rc2-hf3-hei-core';
var STD={
 fruits_total:{min:0.8,pts:5,kind:'adequacy'},fruits_whole:{min:0.4,pts:5,kind:'adequacy'},
 vegetables_total:{min:1.1,pts:5,kind:'adequacy'},greens_beans:{min:0.2,pts:5,kind:'adequacy'},
 grains_whole:{min:1.5,pts:10,kind:'adequacy'},dairy:{min:1.3,pts:10,kind:'adequacy'},
 protein_total:{min:2.5,pts:5,kind:'adequacy'},seafood_plant:{min:0.8,pts:5,kind:'adequacy'},
 fatty_acids_ratio:{min:1.2,max:2.5,pts:10,kind:'adequacy_ratio'},
 grains_refined:{max:1.8,maxBad:4.3,pts:10,kind:'moderation'},
 sodium_g:{max:1.1,maxBad:2.0,pts:10,kind:'moderation'},
 added_sugars_pct:{max:6.5,maxBad:26,pts:10,kind:'moderation'},
 sat_fats_pct:{max:8,maxBad:16,pts:10,kind:'moderation'}
};
function num(v,d){v=Number(v);return isFinite(v)?v:(d==null?0:d);}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function per1000(v,e){return e>0?num(v)*1000/e:0;}function pct(k,e){return e>0?100*num(k)/e:0;}
function grade(total){total=num(total);return total>=90?'A':total>=80?'B':total>=70?'C':total>=60?'D':'F';}
function pointsAdequacy(value,s){return clamp(num(value)/s.min,0,1)*s.pts;}
function pointsModeration(value,s){value=num(value);if(value<=s.max)return s.pts;if(value>=s.maxBad)return 0;return (s.maxBad-value)/(s.maxBad-s.max)*s.pts;}
function componentObjects(density,points){var out={},k;for(k in STD){if(!Object.prototype.hasOwnProperty.call(STD,k))continue;out[k]={value:num(density[k]),points:num(points[k]),maxPoints:STD[k].pts,scorePct:STD[k].pts?num(points[k])/STD[k].pts*100:0,standard:STD[k]};}return out;}
function formulaAudit(){return w.NutritionFormulaRegistryP14?w.NutritionFormulaRegistryP14.audit(['hei.density','hei.adequacy_component','hei.moderation_component','hei.fatty_acid_ratio','hei.total']):null;}
function scoreDensity(density,intake,options){
 density=density||{};intake=intake||{};options=options||{};var energy=num(intake.energy_kcal,0),p={},k;
 if(!(energy>0)){for(k in STD)if(Object.prototype.hasOwnProperty.call(STD,k))p[k]=0;return {schemaVersion:2,version:VERSION,methodology:{id:'HEI-2020',energyBasis:'actual_ration_energy',canonical:options.canonical!==false,canonicalScoringFormula:options.canonical!==false,inputMapping:options.inputMapping||'adapter_reported'},density:density,points:p,components:componentObjects(density,p),total:0,grade:'F',energyRefKcal:0,intake:intake,valid:false,invalidReason:'empty_ration',formulaAudit:formulaAudit(),calculationWarnings:[]};}
 ['fruits_total','fruits_whole','vegetables_total','greens_beans','grains_whole','dairy','protein_total','seafood_plant'].forEach(function(n){p[n]=pointsAdequacy(density[n],STD[n]);});
 p.fatty_acids_ratio=clamp((num(density.fatty_acids_ratio)-STD.fatty_acids_ratio.min)/(STD.fatty_acids_ratio.max-STD.fatty_acids_ratio.min),0,1)*STD.fatty_acids_ratio.pts;
 ['grains_refined','sodium_g','added_sugars_pct','sat_fats_pct'].forEach(function(n){p[n]=pointsModeration(density[n],STD[n]);});
 var total=0;for(k in p)if(Object.prototype.hasOwnProperty.call(p,k))total+=num(p[k]);
 var warnings=[];if(options.requestedEnergyRefKcal!=null&&Math.abs(num(options.requestedEnergyRefKcal)-energy)>0.01)warnings.push({code:'REQUESTED_ENERGY_IGNORED',requested:num(options.requestedEnergyRefKcal),used:energy});
 return {schemaVersion:2,version:VERSION,methodology:{id:'HEI-2020',energyBasis:'actual_ration_energy',canonical:options.canonical!==false,canonicalScoringFormula:options.canonical!==false,inputMapping:options.inputMapping||'adapter_reported',addedSugarEnergy:'16_kcal_per_tsp_eq'},density:density,points:p,components:componentObjects(density,p),total:total,grade:grade(total),energyRefKcal:energy,intake:intake,valid:true,formulaAudit:formulaAudit(),calculationWarnings:warnings,compat:{requestedEnergyRefKcal:options.requestedEnergyRefKcal==null?null:num(options.requestedEnergyRefKcal),actualEnergyKcal:energy,requestedEnergyIgnored:warnings.length>0}};
}
function scoreIntake(intake,options){
 intake=intake||{};options=options||{};var energy=num(intake.energy_kcal,0);
 var protein=num(intake.protein_excl_legumes)+num(intake.legumes_as_protein);
 var vegetables=num(intake.vegetables_total)+num(intake.legumes_veg_total);
 var greens=num(intake.greens_beans)+num(intake.legumes_greens_beans);
 var sugarKcal,kcalField=Number(intake.added_sugars_kcal),tspEq=Number(intake.added_sugars_tsp_eq),tsp=Number(intake.added_sugars_tsp),grams=Number(intake.added_sugars_g);
 /* Positive source values take precedence over a stale derived zero. A literal zero is used only when no positive source exists. */
 /* HEI's native added-sugar input is teaspoon-equivalents. Prefer it, then grams, and use a direct kcal field only as a compatibility fallback. */
 if(isFinite(tspEq)&&tspEq>0)sugarKcal=tspEq*16;
 else if(isFinite(tsp)&&tsp>0)sugarKcal=tsp*16;
 else if(isFinite(grams)&&grams>0)sugarKcal=grams*4;
 else if(isFinite(kcalField)&&kcalField>0)sugarKcal=kcalField;
 else if(isFinite(tspEq))sugarKcal=Math.max(0,tspEq)*16;
 else if(isFinite(tsp))sugarKcal=Math.max(0,tsp)*16;
 else if(isFinite(grams))sugarKcal=Math.max(0,grams)*4;
 else sugarKcal=Math.max(0,num(kcalField));
 var sfa=num(intake.fatty_sfa_g),unsat=num(intake.fatty_unsat_g);
 var d={fruits_total:per1000(intake.fruits_total,energy),fruits_whole:per1000(intake.fruits_whole,energy),vegetables_total:per1000(vegetables,energy),greens_beans:per1000(greens,energy),grains_whole:per1000(intake.grains_whole,energy),grains_refined:per1000(intake.grains_refined,energy),dairy:per1000(intake.dairy,energy),protein_total:per1000(protein,energy),seafood_plant:per1000(intake.seafood_plant,energy),sodium_g:per1000(num(intake.sodium_mg)/1000,energy),added_sugars_pct:pct(sugarKcal,energy),sat_fats_pct:pct(sfa*9,energy),fatty_acids_ratio:sfa>0?unsat/sfa:(unsat>0?STD.fatty_acids_ratio.max:0)};
 var normalized={};Object.keys(intake).forEach(function(k){normalized[k]=intake[k];});normalized.energy_kcal=energy;normalized.added_sugars_kcal=sugarKcal;if(!isFinite(Number(normalized.added_sugars_g)))normalized.added_sugars_g=sugarKcal/4;
 return scoreDensity(d,normalized,{requestedEnergyRefKcal:options.requestedEnergyRefKcal,canonical:true,inputMapping:options.inputMapping||'adapter_reported'});
}
var api={version:VERSION,standards:STD,grade:grade,scoreIntake:scoreIntake,scoreDensity:scoreDensity};try{if(Object.freeze)Object.freeze(api);}catch(_){}w.HEI2020CoreV2=api;
})(window);
