/* HEI-2020 runtime bridge — active canonical core with legacy contract preserved. */
(function(w){'use strict';
var VERSION='v5.3.210-rc2-hf3-hei-runtime';var cfg=w.__HEI_V2_CONFIG__||{};if(!cfg.mode)cfg.mode='active';w.__HEI_V2_CONFIG__=cfg;
function foodPatternRation(ration){var route=w.CompositeNutrientRoutingV53107;try{if(route&&typeof route.toFoodPatternEntries==='function')return route.toFoodPatternEntries(ration||[]);}catch(_){}return Array.isArray(ration)?ration:[];}
function attach(model,intake){model.dataQuality=intake&&intake.dataQuality||null;model.fieldAudit=intake&&intake.fieldAudit||null;model.runtimeVersion=VERSION;return model;}
function calculate(args){args=args||{};if(!w.HEI2020InputAdapterV2||!w.HEI2020CoreV2)throw new Error('HEI-2020 V2 modules are not loaded');var routed=foodPatternRation(args.ration||[]),intake=w.HEI2020InputAdapterV2.adapt(routed,args.db||w.DB);return attach(w.HEI2020CoreV2.scoreIntake(intake,{requestedEnergyRefKcal:args.requestedEnergyRefKcal}),intake);}
function calculateFromIntake(intake,requested){return attach(w.HEI2020CoreV2.scoreIntake(intake||{},{requestedEnergyRefKcal:requested}),intake||{});}
function calculateFromSnapshot(snapshot,requested){snapshot=snapshot||{};return calculate({ration:snapshot.foodPatternRation||snapshot.rawRation||[],db:w.DB,requestedEnergyRefKcal:requested});}
function compare(a,b){var out={legacyTotal:a&&Number(a.total)||0,v2Total:b&&Number(b.total)||0,totalDelta:(b&&Number(b.total)||0)-(a&&Number(a.total)||0),componentDeltas:{}};var keys={},k;Object.keys(a&&a.points||{}).concat(Object.keys(b&&b.points||{})).forEach(function(x){keys[x]=1;});for(k in keys)out.componentDeltas[k]=(b&&b.points&&Number(b.points[k])||0)-(a&&a.points&&Number(a.points[k])||0);w.__lastHEIV2Comparison=out;return out;}
var api={version:VERSION,mode:cfg.mode,calculate:calculate,calculateFromIntake:calculateFromIntake,calculateFromSnapshot:calculateFromSnapshot,foodPatternRation:foodPatternRation,compare:compare};try{if(Object.freeze)Object.freeze(api);}catch(_){}w.HEIRuntimeV2=api;
})(window);
