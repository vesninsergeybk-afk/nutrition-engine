/* Diet interpretation engine — independent from the HEI score. RC2 HOTFIX3. */
(function(w,d){'use strict';
var VERSION='v5.3.210-rc2-hf3-diet-interpretation';
function num(v,dv){v=Number(v);return isFinite(v)?v:(dv==null?0:dv);}
function finite(v){return v!=null&&isFinite(Number(v));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function tier(v){v=String(v||'').toUpperCase();return v==='HIGH'||v==='MEDIUM'?v:'LOW';}
function worstTier(list){list=(list||[]).map(tier);if(!list.length)return 'LOW';if(list.indexOf('LOW')>=0)return 'LOW';if(list.indexOf('MEDIUM')>=0)return 'MEDIUM';return 'HIGH';}
function tierRu(v){return tier(v)==='HIGH'?'высокая':tier(v)==='MEDIUM'?'средняя':'ограниченная';}
function readProfile(){
 var age=num((d.getElementById('needs_age')||{}).value,NaN),sex=String((d.getElementById('needs_sex')||{}).value||'male');
 var active=d.querySelector('#regionSeg button.active[data-region],#regionSeg button[aria-pressed="true"][data-region]');
 return {age:isFinite(age)?age:null,sex:sex,region:active?active.getAttribute('data-region')||'us':'us'};
}
function modelTier(model){
 var q=model&&model.dataQuality||{},tiers=[];
 function add(x){if(x&&x.confidence_tier)tiers.push(x.confidence_tier);else if(x&&x.confidence)tiers.push(x.confidence);}
 add(q.foodEquivalents);add(q.sodium);add(q.saturatedFat);add(q.addedSugars);add(q.addedSugarNutrient);
 return worstTier(tiers);
}
function nutrientQuality(snapshot,key){
 var api=w.ProductDataQualityV13,ration=snapshot&&snapshot.nutrientRation;
 if(api&&typeof api.nutrientAnalysis==='function'&&Array.isArray(ration)){
  try{return api.nutrientAnalysis(ration,w.DB,key);}catch(_){}
 }
 return {confidence_tier:'LOW',uncertainty_abs:0,assumed_zero_products:0,missing_products:1};
}
function hasGap(q){return !q||tier(q.confidence_tier)==='LOW'||num(q.assumed_zero_products)>0||num(q.missing_products)>0;}
function thresholdMayBeCrossed(value,threshold,q,uncertaintyScale){
 value=num(value);threshold=num(threshold);if(!(threshold>0)||!hasGap(q))return false;
 var uncertainty=Math.max(0,num(q&&q.uncertainty_abs))*Math.max(0,num(uncertaintyScale,1));
 if(uncertainty>0&&value+2*uncertainty>threshold)return true;
 return value>=threshold*0.8&&(num(q&&q.assumed_zero_products)>0||num(q&&q.missing_products)>0);
}
function addLimitation(result,item){
 if(!item||!item.id)return;
 for(var i=0;i<result.limitations.length;i++)if(result.limitations[i].id===item.id)return;
 result.limitations.push(item);
}
function addGuardrail(result,spec){
 var value=num(spec.displayValue==null?spec.value:spec.displayValue),threshold=num(spec.displayThreshold==null?spec.threshold:spec.displayThreshold);
 if(value>threshold){
  result.guidelineFlags.push({id:spec.id,kind:'guideline_exceedance',status:'flagged',priority:'high',value:value,threshold:threshold,unit:spec.unit||'',linkedHeiComponent:spec.linkedHeiComponent||null,linkedHeiPoints:num(spec.linkedHeiPoints),title:spec.title,confidence:tier(spec.quality&&spec.quality.confidence_tier)});
 }else if(thresholdMayBeCrossed(value,threshold,spec.quality,spec.uncertaintyScale)){
  addLimitation(result,{id:spec.id+'_uncertain',kind:'data_quality',status:'not_evaluable',reason:'uncertainty_may_cross_limit',title:spec.title,confidence:tier(spec.quality&&spec.quality.confidence_tier)});
 }
}
function build(model,snapshot,context){
 context=context||{};
 var result={schemaVersion:2,version:VERSION,hei:{total:num(model&&model.total),grade:model&&model.grade||'',components:model&&model.components||{}},guidelineFlags:[],upperLimitFlags:[],limitations:[],notEvaluable:[],componentConfidence:{},confidence:{hei:modelTier(model),guardrails:'LOW',overall:'LOW'},generatedAt:Date.now()};
 if(!model||model.valid===false){result.summary={flagCount:0,ulCount:0,limitationCount:0,notEvaluableCount:0,hasIndependentConcern:false};return result;}
 var intake=model.intake||{},density=model.density||{},tot=snapshot&&snapshot.totals||{},reg=w.NutritionNormativeRegistry;
 var energy=finite(intake.energy_kcal)?Number(intake.energy_kcal):num(tot.kcal),sfa=num(intake.fatty_sfa_g),sugar=num(intake.added_sugars_g),sodium=num(intake.sodium_mg);
 var sfaPct=finite(density.sat_fats_pct)?Number(density.sat_fats_pct):(energy>0?sfa*9/energy*100:0);
 var sugarPct=finite(density.added_sugars_pct)?Number(density.added_sugars_pct):(energy>0?num(intake.added_sugars_kcal,sugar*4)/energy*100:0);
 var qSfa=nutrientQuality(snapshot,'sfa_g'),qSugar=nutrientQuality(snapshot,'added_sugars_g'),qSodium=nutrientQuality(snapshot,'sodium_mg');
 result.componentConfidence.sat_fats_pct=tier(qSfa.confidence_tier);result.componentConfidence.added_sugars_pct=tier(qSugar.confidence_tier);result.componentConfidence.sodium_g=tier(qSodium.confidence_tier);
 var p=context.profile||readProfile();p.energyKcal=energy;
 var sfaRule=reg&&reg.resolveDerived?reg.resolveDerived('sfa_g',{energyKcal:energy,age:p.age,sex:p.sex,region:p.region}):null;
 if(sfaRule&&finite(sfaRule.value))addGuardrail(result,{id:'saturated_fat_general_limit',displayValue:sfaPct,displayThreshold:energy>0?Number(sfaRule.value)*9/energy*100:10,unit:'% энергии',linkedHeiComponent:'sat_fats_pct',linkedHeiPoints:model.points&&model.points.sat_fats_pct,title:'Насыщённые жиры выше общего ориентира',quality:qSfa,uncertaintyScale:energy>0?9/energy*100:0});
 var sugarRule=reg&&reg.resolveDerived?reg.resolveDerived('added_sugars_g',{energyKcal:energy,age:p.age,sex:p.sex,region:p.region}):null;
 if(sugarRule&&finite(sugarRule.value))addGuardrail(result,{id:'added_sugars_general_limit',displayValue:sugarPct,displayThreshold:energy>0?Number(sugarRule.value)*4/energy*100:10,unit:'% энергии',linkedHeiComponent:'added_sugars_pct',linkedHeiPoints:model.points&&model.points.added_sugars_pct,title:'Добавленный сахар выше общего ориентира',quality:qSugar,uncertaintyScale:energy>0?4/energy*100:0});
 var sodiumRule=reg&&reg.resolveDerived?reg.resolveDerived('sodium_mg_public_health_max',{energyKcal:energy,age:p.age,sex:p.sex,region:p.region}):null;
 if(sodiumRule&&finite(sodiumRule.value))addGuardrail(result,{id:'sodium_absolute_limit',displayValue:sodium,displayThreshold:Number(sodiumRule.value),unit:'мг/сут',linkedHeiComponent:'sodium_g',linkedHeiPoints:model.points&&model.points.sodium_g,title:'Натрий выше суточного ориентира',quality:qSodium,uncertaintyScale:1});
 var scopeMap={retinol_only:'vitamin_a_retinol_mcg',supplemental_only:'magnesium_supplemental_mg',supplemental_synthetic:'vitamin_e_synthetic_supplemental_mg',folic_acid_only:'folic_acid_mcg'};
 if(reg&&reg.data&&reg.data.nutrients&&typeof reg.resolveMicro==='function')Object.keys(reg.data.nutrients).forEach(function(key){
  var lim=reg.resolveMicro(key,p.region,p),ul=lim&&lim.ul;if(!ul||!finite(ul.value))return;
  var scope=ul.scope||'total',sourceKey=scope==='total'?key:scopeMap[scope],value=sourceKey?tot[sourceKey]:null,totalValue=tot[key],meta=reg.data.nutrients[key]||{},q=nutrientQuality(snapshot,key),threshold=Number(ul.value);
  if(finite(value)&&Number(value)>threshold){
   result.upperLimitFlags.push({id:'ul_'+key,kind:'upper_limit_exceedance',status:'flagged',priority:'critical',nutrient:key,value:Number(value),threshold:threshold,scope:scope,unit:meta.unit||'',title:meta.title||key,confidence:tier(q.confidence_tier)});
  }else if(scope!=='total'&&sourceKey&&!finite(value)&&finite(totalValue)&&Number(totalValue)>threshold){
   addLimitation(result,{id:'ul_'+key,kind:'upper_limit',status:'not_evaluable',reason:'required_source_fraction_missing',nutrient:key,scope:scope,title:'Верхний уровень: '+(meta.title||key),confidence:'LOW'});
  }else if(scope==='total'&&finite(value)&&thresholdMayBeCrossed(Number(value),threshold,q,1)){
   addLimitation(result,{id:'ul_'+key+'_uncertain',kind:'upper_limit',status:'not_evaluable',reason:'uncertainty_may_cross_ul',nutrient:key,scope:scope,title:'Верхний уровень: '+(meta.title||key),confidence:tier(q.confidence_tier)});
  }
 });
 if(snapshot&&snapshot.rawRation&&snapshot.rawRation.length&&!finite(tot.trans_fat_g)&&!finite(tot.trans_fats_g))addLimitation(result,{id:'trans_fat',kind:'outside_hei',status:'not_evaluable',reason:'missing_product_data',title:'Трансжиры',confidence:'LOW'});
 var fa=model.fieldAudit||{};if(fa.addedSugars&&fa.addedSugars.assumedZero>0)addLimitation(result,{id:'added_sugars_assumed_zero',kind:'data_quality',status:'not_evaluable',reason:'assumed_zero',title:'Добавленный сахар',confidence:'LOW'});
 result.notEvaluable=result.limitations.slice();
 result.confidence.guardrails=worstTier([qSfa.confidence_tier,qSugar.confidence_tier,qSodium.confidence_tier]);
 result.confidence.overall=worstTier([result.confidence.hei,result.confidence.guardrails]);
 result.summary={flagCount:result.guidelineFlags.length,ulCount:result.upperLimitFlags.length,limitationCount:result.limitations.length,notEvaluableCount:result.limitations.length,hiddenLimitationsCount:result.limitations.length,hasIndependentConcern:result.guidelineFlags.length+result.upperLimitFlags.length>0};
 return result;
}
function fmt(v){return finite(v)?String(Math.round(Number(v)*10)/10):'—';}
function reasonText(f){
 if(f.reason==='required_source_fraction_missing')return 'не разделены формы или источники нутриента, к которым относится верхний уровень';
 if(f.reason==='uncertainty_may_cross_limit'||f.reason==='uncertainty_may_cross_ul')return 'неопределённость исходных данных не позволяет уверенно исключить превышение';
 if(f.reason==='assumed_zero')return 'часть нулевых значений предположена, а не подтверждена';
 if(f.reason==='missing_product_data')return 'для части продуктов показатель не указан';
 return 'необходимых данных недостаточно';
}
function render(a){
 var panel=d.getElementById('heiPanel');if(!panel)return;
 var host=d.getElementById('heiAssessment');if(!host){host=d.createElement('section');host.id='heiAssessment';host.className='hei-assessment';var summary=d.getElementById('heiSummary');(summary&&summary.parentNode?summary.parentNode:panel).insertBefore(host,summary?summary.nextSibling:null);}
 var flags=a.upperLimitFlags.concat(a.guidelineFlags),limitations=a.limitations||a.notEvaluable||[];
 var html='<div class="hei-assessment__head"><strong>Отдельные ограничения</strong><span>не входят в общий балл HEI</span></div>';
 if(!flags.length)html+='<p class="hei-assessment__ok">Подтверждённых превышений по доступным данным не выявлено.</p>';
 flags.slice(0,3).forEach(function(f){var confidence=f.confidence&&f.confidence!=='HIGH'?' Достоверность оценки — '+tierRu(f.confidence)+'.':'';html+='<article class="hei-assessment__item '+(f.kind==='upper_limit_exceedance'?'is-critical':'is-warning')+'"><strong>'+esc(f.title)+'</strong><p>'+esc(fmt(f.value)+' '+(f.unit||'')+' при ориентире '+fmt(f.threshold)+' '+(f.unit||''))+'. Это отклонение оценивается независимо от общего балла HEI.'+esc(confidence)+'</p></article>';});
 if(flags.length>3)html+='<p class="hei-assessment__more">Ещё отклонений: '+esc(flags.length-3)+'. Полный перечень доступен в отчёте.</p>';
 if(limitations.length){html+='<details class="hei-assessment__limitations"><summary>Ограничения данных — '+esc(limitations.length)+'</summary><ul>'+limitations.slice(0,8).map(function(f){return '<li><b>'+esc(f.title)+'</b>: '+esc(reasonText(f))+'.</li>';}).join('')+'</ul>'+(limitations.length>8?'<p>Ещё ограничений: '+esc(limitations.length-8)+'.</p>':'')+'</details>';}
 html+='<p class="hei-assessment__confidence">Достоверность расчёта HEI — <b>'+esc(tierRu(a.confidence.hei))+'</b>; проверки ограничений — <b>'+esc(tierRu(a.confidence.guardrails))+'</b>.</p>';
 host.innerHTML=html;
}
function refresh(model){
 model=model||w.__lastHEIModel;if(!model)return null;var core=w.NutritionCalculationCore||w.NutritionCalculationCoreV53155,snap=null;
 try{if(core&&typeof core.snapshot==='function')snap=core.snapshot();}catch(_){}
 var a=build(model,snap,{profile:readProfile()});w.__lastDietAssessment=a;render(a);try{w.dispatchEvent(new CustomEvent('diet:assessment-ready',{detail:{assessment:a}}));}catch(_){}return a;
}
function init(){w.addEventListener('hei:rendered',function(e){setTimeout(function(){refresh(e&&e.detail&&e.detail.model);},0);});['needs:computed','needs:changed'].forEach(function(n){w.addEventListener(n,function(){setTimeout(function(){refresh();},40);});});setTimeout(function(){refresh();},150);}
var api={version:VERSION,build:build,refresh:refresh,reasonText:reasonText};try{if(Object.freeze)Object.freeze(api);}catch(_){}w.DietInterpretationEngineV1=api;if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
