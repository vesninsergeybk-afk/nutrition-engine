// Nutrition Calculator v5.3.200 — ration snapshot and cache consistency fix
(function(){
  'use strict';
  var VERSION='v5.3.200_ration_snapshot_cache_consistency_fix';
  var endpoint='./api/gemini.php?v=5.3.200';
  var activeController=null,progressTimer=null,busyState=false,cooldownUntil=0,cooldownTimer=null,lastRequestedSnapshot='',staleCheckTimer=null;
  var REQUEST_TIMEOUT_MS=38000;
  var ANALYTIC_KEYS=['kcal','protein_g','fat_g','fiber_g','sodium_mg','sfa_g','added_sugars_g','calcium_mg','vitamin_d_mcg','iron_mg','vitamin_b12_mcg','vitamin_b9_mcg','potassium_mg','magnesium_mg','vitamin_c_mg','zinc_mg'];
  var KEY_LABELS={kcal:'Энергия',protein_g:'Белок',fat_g:'Жиры',fiber_g:'Клетчатка',sodium_mg:'Натрий',sfa_g:'Насыщенные жиры',added_sugars_g:'Добавленный сахар',calcium_mg:'Кальций',vitamin_d_mcg:'Витамин D',iron_mg:'Железо',vitamin_b12_mcg:'Витамин B12',vitamin_b9_mcg:'Фолат',potassium_mg:'Калий',magnesium_mg:'Магний',vitamin_c_mg:'Витамин C',zinc_mg:'Цинк'};

  function $(id){return document.getElementById(id);}
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function safeArray(x){return Array.isArray(x)?x:[];}
  function num(x){x=Number(x);return Number.isFinite(x)?x:null;}
  function round(x,d){x=Number(x);if(!Number.isFinite(x))return null;var m=Math.pow(10,d==null?1:d);return Math.round(x*m)/m;}
  function text(x,max){var s=String(x==null?'':x).replace(/\s+/g,' ').trim();return max&&s.length>max?s.slice(0,max):s;}
  function uniq(values,max){var out=[];safeArray(values).forEach(function(v){v=text(v,180);if(v&&out.indexOf(v)<0&&(!max||out.length<max))out.push(v);});return out;}
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function lower(x){return text(x,5000).toLowerCase().replace(/ё/g,'е');}
  function safeId(value,fallback){var s=text(value,120).replace(/[^a-zA-Z0-9_:\-.]/g,'_').replace(/^_+|_+$/g,'');return s||fallback||'';}
  function stableSerialize(value){if(value===null)return 'null';var type=typeof value;if(type==='number')return Number.isFinite(value)?String(value):'null';if(type==='boolean')return value?'true':'false';if(type==='string')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stableSerialize).join(',')+']';if(type==='object'){return '{'+Object.keys(value).sort().map(function(key){return JSON.stringify(key)+':'+stableSerialize(value[key]);}).join(',')+'}';}return 'null';}
  function hash32(value,seed){var h=seed>>>0;for(var i=0;i<value.length;i++){h^=value.charCodeAt(i);if(Math.imul)h=Math.imul(h,16777619);else h=(h*16777619)>>>0;}return ('00000000'+(h>>>0).toString(16)).slice(-8);}
  function snapshotId(payload){var material={profile:payload.profile,ration:payload.ration,nutrients:payload.nutrients,hei:payload.hei,structural_axis:payload.structural_axis,harvard_plate:payload.harvard_plate,model_discrepancies:payload.model_discrepancies,meal_distribution:payload.meal_distribution,data_quality:payload.data_quality,already_shown_analysis:payload.already_shown_analysis,decision_context:payload.decision_context,calculated_options:payload.calculated_options};var raw=stableSerialize(material);return 'snap_'+hash32(raw,2166136261)+hash32(raw.split('').reverse().join(''),2246822519);}

  function dbProduct(key){try{var byKey=window.DB&&window.DB.byKey;if(!byKey)return null;if(typeof byKey.get==='function')return byKey.get(key)||null;return byKey[key]||null;}catch(_){return null;}}
  function stateRation(){try{return window.State&&typeof window.State.get==='function'?safeArray(window.State.get()):[];}catch(_){return [];}}
  function scaledContribution(item){try{var core=window.NutritionCalculationCore||window.NutritionCalculationCoreV53155;if(core&&typeof core.scaledPerItem==='function')return contributionMap(core.scaledPerItem(item)||{});}catch(_){}return contributionMap(item&&item.nutrients||item&&item.nutrient_contribution||{});}
  function productName(product,fallback){return text(product&&(product.name_ru||product.name)||fallback||'',140);}
  function firstNonEmpty(){for(var i=0;i<arguments.length;i++){var v=arguments[i];if(Array.isArray(v))v=v[0];v=text(v,160);if(v)return v;}return '';}
  function regionLabel(){var status=$('normRegionStatus');if(status){var t=text(status.textContent,80);if(t)return t.replace(/^Применяются нормы:\s*/i,'');}try{return localStorage.getItem('nutri_norm_region')==='eu'?'ЕС · EFSA':'США · DRI';}catch(_){return 'США · DRI';}}
  function metricMode(row){return text(row&&row.mode,40)||(/sodium|sfa|added_sugars/.test(String(row&&row.key||''))?'upper_limit':'minimum');}
  function heiMax(key){return /^(fruits_total|fruits_whole|vegetables_total|greens_beans|protein_total|seafood_plant)$/.test(String(key||''))?5:10;}
  function contributionMap(nutrients){var out={},count=0;Object.keys(nutrients||{}).sort().forEach(function(k){if(count>=90||!/^[a-zA-Z0-9_]+$/.test(k))return;var value=Number(nutrients[k]);if(!Number.isFinite(value))return;out[k]=round(value,k==='kcal'||/_mg$/.test(k)?1:2);count++;});return out;}

  function mealPlannerContext(){
    var raw='',model=null;
    try{raw=localStorage.getItem('nutri_meal_planner_v463')||'';model=raw?JSON.parse(raw):null;}catch(_){model=null;}
    if(!model||!Array.isArray(model.meals))return {available:false,stale:false,scheme:'',meals:[],by_key:{},warnings:['Распределение по приёмам пищи не сформировано; для импортированных позиций используются только распознанные подписи приёмов.']};
    var byKey={},meals=[];
    safeArray(model.meals).forEach(function(m,index){
      var mealId=safeId(m&&m.id,'meal_'+(index+1)),title=text(m&&m.title,60)||('Приём пищи '+(index+1));
      var allocations=safeArray(m&&m.allocations).map(function(a){
        var p=dbProduct(a&&a.key),g=round(a&&a.g,1),key=text(a&&a.key,120),name=productName(p,key);
        if(key){if(!byKey[key])byKey[key]=[];if(byKey[key].indexOf(title)<0)byKey[key].push(title);}
        return {key:key,name:name,grams:g,manual:!!(a&&a.manual),reason:text(a&&a.reason,180)};
      }).filter(function(x){return x.key&&x.grams>0;});
      var t=m&&m.totals||{};
      meals.push({meal_id:mealId,id:mealId,title:title,target_kcal_pct:round(Number(m&&m.targetKcalPct||0)*100,0),actual:{energy_kcal:round(t.kcal,0),protein_g:round(t.protein_g,1),fat_g:round(t.fat_g,1),fiber_g:round(t.fiber_g,1),sodium_mg:round(t.sodium_mg,0),sfa_g:round(t.sfa_g,1),added_sugars_g:round(t.added_sugars_g,1)},status:text(m&&m.status,30),warnings:safeArray(m&&m.warnings).slice(0,6).map(function(x){return text(x,180);}),items:allocations});
    });
    safeArray(model.unassigned).forEach(function(a){var key=text(a&&a.key,120);if(key){if(!byKey[key])byKey[key]=[];if(byKey[key].indexOf('Не распределено')<0)byKey[key].push('Не распределено');}});
    var currentHash='';try{if(window.MealPlannerV463&&typeof window.MealPlannerV463.rationHash==='function')currentHash=window.MealPlannerV463.rationHash();}catch(_){}
    return {available:true,stale:!!(currentHash&&model.rationHash&&currentHash!==model.rationHash),scheme:text(model.schemeId||model.version,60),meals:meals,by_key:byKey,warnings:safeArray(model.warnings).slice(0,10).map(function(x){return text(x&&x.text||x,180);})};
  }

  function preparationContext(item,product){
    var ai=item&&item.ai_import&&typeof item.ai_import==='object'?item.ai_import:{};
    return {
      method:firstNonEmpty(ai.preparation_methods,item&&item.preparation_method,product&&product.preparation_method,product&&product.cooking_method),
      state:firstNonEmpty(ai.preparation_states,item&&item.preparation_state,product&&product.preparation_state,product&&product.food_state),
      weight_basis:firstNonEmpty(ai.weight_basis_hints,item&&item.weight_basis_hint,product&&product.weight_basis,product&&product.mass_basis),
      recognition_status:firstNonEmpty(ai.preparation_match_statuses,item&&item.preparation_match_status),
      source:ai&&ai.source==='gemini_media'?'Gemini media import':'manual/database'
    };
  }
  function productQuality(item,product){
    var ai=item&&item.ai_import&&typeof item.ai_import==='object'?item.ai_import:{};
    return {verification:text(product&&product.nutrition_verification_status,60),completeness:text(product&&product.nutrient_completeness_status,60),exactness:text(product&&product.source_exactness_class,60),recognition_confidence:round(ai.confidence,2),issues:uniq(ai.recognition_issue_codes,8)};
  }

  function buildRationItems(model,mealCtx){
    var raw=safeArray(model&&model.rawRation);if(!raw.length)raw=stateRation();
    var display=safeArray(model&&model.displayRationRows),items=[];
    function rawForKey(key){
      for(var i=0;i<raw.length;i++){var it=raw[i];if(it&&String(it.key)===String(key))return it;}
      for(var j=0;j<raw.length;j++){var ch=safeArray(raw[j]&&raw[j].children);for(var k=0;k<ch.length;k++)if(ch[k]&&String(ch[k].key)===String(key))return ch[k];}
      return null;
    }
    function parentNameForKey(key){
      for(var i=0;i<raw.length;i++){var parent=raw[i],children=safeArray(parent&&parent.children);for(var j=0;j<children.length;j++)if(children[j]&&String(children[j].key)===String(key))return productName(dbProduct(parent.key)||parent,parent.name_ru||parent.name||parent.key);}
      return '';
    }
    function add(row,item,kind,level,parent,index){
      item=item||{};row=row||{};var key=text(row.key||item.key,120),grams=round(row.grams!=null?row.grams:item.grams,1);if(!(grams>0))return;
      var p=dbProduct(key)||item||{},name=text(row.name||productName(p,item.name_ru||item.name||item.name_fallback||key),140)||('Позиция '+String(index+1));
      var ai=item.ai_import||{},mealLabels=uniq([].concat((mealCtx.by_key&&mealCtx.by_key[key])||[],ai.meal_labels||[],ai.meal_label||[],item.meal_label||[]),6);
      var isCompositeRoot=kind==='composite_root';var nutrients=isCompositeRoot?{}:contributionMap(row.nutrients&&Object.keys(row.nutrients).length?row.nutrients:scaledContribution(item));
      items.push({item_id:'item_'+('000'+String(items.length+1)).slice(-3),order:Number(row.order||index+1),key:key,name:name,grams:grams,entry_type:text(kind||row.kind||item.entry_type||'normal',40),parent_dish:text(parent||'',140),meal_labels:mealLabels.length?mealLabels:['Не распределено'],preparation:preparationContext(item,p),nutrient_contribution:nutrients,contribution_basis:isCompositeRoot?'Сводная строка блюда; нутриентный вклад передан по ингредиентам, чтобы избежать двойного счёта.':'Вклад позиции в текущей массе по расчётному ядру.',quality:productQuality(item,p),note:text(row.note||item.note,220)});
    }
    if(display.length){
      display.forEach(function(row,index){if(!row||!(Number(row.grams)>0))return;var item=rawForKey(row.key)||{},kind=text(row.kind||item.entry_type||'normal',40),parent=Number(row.level)>0?parentNameForKey(row.key):'';add(row,item,kind,Number(row.level)||0,parent,index);});
    }
    if(!items.length){
      raw.forEach(function(item,index){if(!item||!(Number(item.grams)>0))return;var isComposite=item.entry_type==='composite_food'&&safeArray(item.children).length>0;if(isComposite){add({key:item.key,name:item.name_ru||item.name,grams:item.grams,nutrients:{}},item,'composite_root',0,'',index);safeArray(item.children).forEach(function(child,childIndex){add({key:child&&child.key,name:child&&(child.name_ru||child.name),grams:child&&child.grams,nutrients:scaledContribution(child),note:child&&child.component_role},child,'composite_child',1,productName(dbProduct(item.key)||item,item.name_ru||item.name||item.key),index+childIndex+1);});}else add({key:item.key,name:item.name_ru||item.name,grams:item.grams,nutrients:scaledContribution(item)},item,'normal',0,'',index);});
    }
    return items;
  }

  function nutrientRows(model){return safeArray(model&&model.macros).concat(safeArray(model&&model.vitamins),safeArray(model&&model.minerals));}
  function buildDeviations(model,rationItems){
    var rows=nutrientRows(model),out=[];
    rows.forEach(function(r){
      var target=Number(r&&r.target),pct=Number(r&&r.pct),mode=metricMode(r),deviates=target>0&&(mode==='upper_limit'?pct>100:pct<90);if(!deviates)return;
      var key=text(r.key,60),sources=rationItems.map(function(it){return {item_id:it.item_id,name:it.name,meal_labels:it.meal_labels,value:Number(it.nutrient_contribution&&it.nutrient_contribution[key]||0),grams:it.grams};}).filter(function(x){return x.value>0;}).sort(function(a,b){return b.value-a.value;}).slice(0,5).map(function(x){return {item_id:x.item_id,product:x.name,meal_labels:x.meal_labels,grams:x.grams,contribution:round(x.value,2)};});
      out.push({key:key,title:text(r.title||KEY_LABELS[key],90),value:round(r.value,2),target:round(r.target,2),unit:text(r.unit,20),pct:round(r.pct,0),mode:mode,status:text(r.status,100),coverage_pct:round(r.coverage&&r.coverage.pct,0),main_sources:sources,source_status:sources.length?'grounded':'no_positive_source_in_payload'});
    });
    return out.sort(function(a,b){var coverageA=Number(a.coverage_pct),coverageB=Number(b.coverage_pct),relA=Number.isFinite(coverageA)?coverageA:0,relB=Number.isFinite(coverageB)?coverageB:0,da=(a.mode==='upper_limit'?a.pct-100:100-a.pct)*Math.max(.25,relA/100),db=(b.mode==='upper_limit'?b.pct-100:100-b.pct)*Math.max(.25,relB/100);return db-da;});
  }
  function buildAllNutrients(model){
    return nutrientRows(model).filter(function(r){return r&&ANALYTIC_KEYS.indexOf(String(r.key))>=0;}).map(function(r){return {key:text(r.key,60),title:text(r.title||KEY_LABELS[r.key],90),value:round(r.value,2),target:round(r.target,2),unit:text(r.unit,20),pct:round(r.pct,0),mode:metricMode(r),status:text(r.status,100),coverage_pct:round(r.coverage&&r.coverage.pct,0),personal_target:!!r.personalTarget};});
  }
  function buildHei(model){
    var rows=safeArray(model&&model.hei&&model.hei.rows).map(function(r){var max=heiMax(r&&r.key),pts=num(r&&r.points),ratio=pts==null?null:round(pts/max*100,0);return {key:text(r&&r.key,60),title:text(r&&r.title,100),value:text(r&&r.value,100),norm:text(r&&r.norm,120),delta:text(r&&r.delta,220),points:round(pts,2),maximum:max,achievement_pct:ratio,maximum_reached:pts!=null&&pts>=max-0.01,interpretation_rule:'Максимум категории означает достижение порога HEI, но не доказывает избыток относительно нутриентных или клинических ориентиров.'};});
    return {total:round(model&&model.hei&&model.hei.total,1),summary:text(model&&model.hei&&model.hei.summary,320),components:rows};
  }
  function buildStructure(model){
    var d=model&&model.dietProfile&&model.dietProfile.model||{},p=d.profile||{},n=d.narrative||{},domains=p.domains||{},labels={plantBase:'Растительная основа',wholeGrainStarch:'Цельные злаки и крахмалистая часть',proteinAdequacy:'Белковое обеспечение',dairyCalcium:'Молочно-кальциевый вклад',outsideSafety:'Продукты вне основной структуры',balanceDisplacement:'Структурный баланс'};
    var domainRows=Object.keys(labels).map(function(k){return {key:k,title:labels[k],score:round(domains[k],1)};}).filter(function(x){return x.score!=null;});
    return {hei:round(p.hei,1),daily_structure:round(p.dailyStructure,1),strict_harvard_structure:round(p.strictStructure,1),axis_agreement:round(p.interpretation&&p.interpretation.axisAgreement,1),zone:text(d.quadrant&&d.quadrant.label,100),relation:text(n.title||n.summary,360),domains:domainRows,weak_structure:safeArray(n.weakStructure).slice(0,6).map(function(x){return {key:text(x&&x.key,60),title:text(x&&x.label,100),score:round(x&&x.value,1),why:text(x&&x.why,220),action:text(x&&x.action,260)};}),weak_hei:safeArray(n.weakHei).slice(0,8).map(function(x){return {key:text(x&&x.key,60),title:text(x&&x.label,100),points:round(x&&x.pts,2),maximum:round(x&&x.max,2),achievement_pct:round(Number(x&&x.ratio)*100,0)};})};
  }
  function buildHarvard(model){
    var hp=model&&model.harvard||{},sectors=[];
    if(hp.stage&&hp.stage.sectors)Object.keys(hp.stage.sectors).forEach(function(k){var s=hp.stage.sectors[k]||{};sectors.push({key:k,grams:round(s.grams,1),actual_pct:round(s.actualPercent,1),target_pct:round(s.targetPercent,1),fill_ratio:round(s.fillRatio,2)});});
    return {ready:hp.ready!==false,score:round(hp.score,1),core_mass_g:round(hp.coreMass,1),weakest_sector:text(hp.weakest,50),sectors:sectors,quality_flags:safeArray(hp.stage&&hp.stage.qualityFlags).slice(0,10).map(function(x){return {severity:text(x&&x.severity,20),text:text(x&&x.text||x&&x.title,180)};})};
  }
  function buildDiscrepancies(hei,structure,harvard,nutrients){
    var out=[],h=Number(hei&&hei.total),s=Number(structure&&structure.daily_structure),hp=Number(harvard&&harvard.score);
    if(Number.isFinite(h)&&Number.isFinite(s)&&Math.abs(h-s)>=8)out.push({models:['HEI','Структурная ось'],finding:'Разрыв между HEI и структурной осью составляет '+round(Math.abs(h-s),0)+' п.',meaning:h>s?'Индекс качества выглядит сильнее, чем фактическая структура дневного рациона.':'Структура дня выглядит сильнее, чем совокупный балл компонентов HEI.'});
    if(Number.isFinite(h)&&Number.isFinite(hp)&&Math.abs(h-hp)>=10)out.push({models:['HEI','Гарвардская тарелка'],finding:'HEI и Гарвардская тарелка расходятся примерно на '+round(Math.abs(h-hp),0)+' п.',meaning:'Модели оценивают разные свойства: индексные пороги не равны распределению массы по секторам тарелки.'});
    var byKey={};safeArray(nutrients).forEach(function(x){byKey[x.key]=x;});
    safeArray(hei&&hei.components).forEach(function(c){var map={sodium_g:'sodium_mg',added_sugars_pct:'added_sugars_g',sat_fats_pct:'sfa_g'},nk=map[c.key],nr=nk&&byKey[nk];if(!nr)return;if(c.maximum_reached&&((nr.mode==='upper_limit'&&nr.pct>100)||(nr.mode!=='upper_limit'&&nr.pct<90)))out.push({models:['HEI '+c.title,'Нутриентные нормы'],finding:'Категория HEI достигла максимума, но показатель «'+nr.title+'» остаётся вне ориентира.',meaning:'Максимальный балл категории нельзя трактовать как доказательство отсутствия нутриентного отклонения.'});});
    safeArray(hei&&hei.components).filter(function(c){return c.maximum_reached&&/fruit/i.test(c.key);}).forEach(function(c){out.push({models:['HEI '+c.title,'Правило интерпретации'],finding:'Фруктовый компонент достиг максимального балла HEI.',meaning:'Это означает достижение порога категории, а не автоматически избыток фруктов; избыток допустимо утверждать только при отдельном ориентире и подтверждающих данных.'});});
    return out.slice(0,12);
  }
  function captureShownAnalysis(model,discrepancies){
    var out=[];
    function push(source,value){value=text(value,700);if(value&&!out.some(function(x){return lower(x.text)===lower(value);})&&out.length<70)out.push({source:source,text:value});}
    var pc=model&&model.patientContent||{};
    push('Калькулятор: итог',pc.summary||pc.conclusion||pc.interpretation);
    push('Калькулятор: первый шаг',pc.firstAction&&pc.firstAction.instruction);
    safeArray(pc.priorities).forEach(function(x){push('Калькулятор: приоритет',(x.title?x.title+': ':'')+(x.action||x.reason||x.text||''));});
    safeArray(model&&model.personalNutrients).forEach(function(x){push('Калькулятор: нутриент',(x.title?x.title+': ':'')+(x.action||x.reason||x.status||''));});
    var dp=model&&model.dietProfile&&model.dietProfile.model||{},n=dp.narrative||{};
    push('Калькулятор: профиль',n.title);push('Калькулятор: профиль',n.summary);push('Калькулятор: профиль',n.first);
    safeArray(n.weakStructure).forEach(function(x){push('Калькулятор: структура',(x.label||x.title||'')+': '+(x.why||'')+' '+(x.action||''));});
    safeArray(n.weakHei).forEach(function(x){push('Калькулятор: HEI',(x.label||x.title||'')+': '+(x.action||x.why||''));});
    push('Калькулятор: HEI',model&&model.hei&&model.hei.summary);
    safeArray(model&&model.hei&&model.hei.rows).forEach(function(x){push('Калькулятор: компонент HEI',(x.title||'')+': '+(x.delta||x.norm||''));});
    safeArray(discrepancies).forEach(function(x){push('Калькулятор: межмодельное расхождение',(x.finding||'')+' '+(x.meaning||''));});
    safeArray(model&&model.harvard&&model.harvard.stage&&model.harvard.stage.qualityFlags).forEach(function(x){push('Калькулятор: Гарвардская тарелка',x&&x.text||x&&x.title||x);});
    try{var nodes=document.querySelectorAll('.hei-p1-action,.diet-step-card,.nr-action-card,.patient-summary,.hp-rec-card,.hpwi-preview,.hpapply-shell');for(var i=0;i<nodes.length&&out.length<70;i++)push('Показано в интерфейсе',nodes[i].textContent);}catch(_){}
    return out;
  }
  function profilePayload(model){
    var p=model&&model.personalNeeds||{};
    return {inputs:safeArray(model&&model.needs&&model.needs.inputs).slice(0,24).map(function(x){return {key:text(x&&x.key,50),label:text(x&&x.label,80),value:text(x&&x.value,120)};}),age_group:text(p.ageGroup&&p.ageGroup.label,80),sex:text(p.sexLabel,40),activity:text(p.activityLabel,80),goal:text(p.goalLabel||model&&model.needs&&model.needs.goal,100),state:text(p.stateLabel,100),diet_style:text(p.dietStyleLabel,100),guardrail:text(p.guardrailLabel,100),norm_system:regionLabel(),personalization_applied:!!(model&&model.needs&&model.needs.personalizationApplied),needs:{energy:text(model&&model.needs&&model.needs.energy,60),protein:text(model&&model.needs&&model.needs.protein,60),fat:text(model&&model.needs&&model.needs.fat,60),carbs:text(model&&model.needs&&model.needs.carbs,60),fluid:text(model&&model.needs&&model.needs.fluid,60),method:text(model&&model.needs&&model.needs.method,140)}};
  }
  function dataQualityPayload(model,rationItems){return {aggregate:safeArray(model&&model.dataQuality).map(function(q){return {key:text(q&&q.key,60),label:text(q&&q.label,100),coverage_pct:round(q&&q.pct,0),note:text(q&&q.note,160)};}),source_quality:model&&model.sourceQuality||{},item_limitations:rationItems.filter(function(x){var q=x.quality||{};return /low|incomplete|review|required|proxy|model|unknown/i.test([q.verification,q.completeness,q.exactness].join(' '))||safeArray(q.issues).length;}).slice(0,20).map(function(x){return {product:x.name,quality:x.quality};})};}

  function decisionConstraint(){var el=$('geminiAiConstraint');return text(el&&el.value,600);}
  function calculatedOptions(){
    try{var api=window.HarvardWhatIfDecisionSupportV53199;if(api&&typeof api.getCalculatedOptions==='function')return safeArray(api.getCalculatedOptions()).slice(0,3);}catch(_){}
    return [];
  }
  function collectPayload(){
    var report=window.NutritionReportV5||window.NutritionReportV5360;if(!report||typeof report.buildReportModel!=='function')throw new Error('Расчётные модули ещё загружаются. Подождите несколько секунд.');
    var model=report.buildReportModel({force:true});if(!model||!Number(model.rationPositionCount))throw new Error('Сначала добавьте продукты в итоговый рацион.');
    var mealCtx=mealPlannerContext(),rationItems=buildRationItems(model,mealCtx),allNutrients=buildAllNutrients(model),hei=buildHei(model),structure=buildStructure(model),harvard=buildHarvard(model),discrepancies=buildDiscrepancies(hei,structure,harvard,allNutrients);
    var payload={schema_version:'nutrition-ai-decision-support-v1',client_build:VERSION,locale:'ru-RU',analysis_contract:{single_network_call:true,numeric_source_of_truth:'calculator',model_must_not_recalculate:true,novelty_only:true,no_forced_findings:true,no_duplicate_actions:true,calculated_option_comparison_only:true,structured_fact_references:true,unknown_reference_rejected:true,authored_numeric_claims_forbidden:true,honest_no_additional_value:true,category_specific_grounding:true,option_comparison_only_when_decision_ambiguous:true,question_cannot_be_only_value:true,snapshot_staleness_guard:true,hei_maximum_rule:'Максимум HEI означает достижение порога категории. Количество сверх порога не повышает балл и само по себе не является избытком.'},profile:profilePayload(model),ration:{positions:Number(model.rationPositionCount||0),energy_kcal:round(model.totals&&model.totals.kcal,0),items:rationItems},nutrients:{totals:allNutrients,deviations:buildDeviations(model,rationItems)},hei:hei,structural_axis:structure,harvard_plate:harvard,model_discrepancies:discrepancies,meal_distribution:{available:mealCtx.available,stale:mealCtx.stale,scheme:mealCtx.scheme,meals:mealCtx.meals,warnings:mealCtx.warnings},data_quality:dataQualityPayload(model,rationItems),already_shown_analysis:captureShownAnalysis(model,discrepancies),decision_context:{user_constraint:decisionConstraint()},calculated_options:calculatedOptions()};
    if(!rationItems.length)throw new Error('Рацион рассчитан, но позиции не удалось передать в ИИ-модуль. Обновите страницу до v5.3.200 и повторите запрос.');payload.snapshot_id=snapshotId(payload);return payload;
  }

  function setStatus(message,state){var el=$('geminiAiStatus');if(!el)return;el.textContent=message||'';el.dataset.state=state||'idle';}
  function scalarText(value,max){if(value==null)return '';if(typeof value!=='string'&&typeof value!=='number'&&typeof value!=='boolean')return '';return text(value,max||1200);}
  function objectOnly(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function scalarList(value,limit,max){var out=[];safeArray(value).slice(0,limit||10).forEach(function(item){var v=scalarText(item,max||420);if(v&&out.indexOf(v)<0)out.push(v);});return out;}
  function findProtocol(value,depth){
    if(depth>7||!value||typeof value!=='object')return null;
    function score(v){if(!v||typeof v!=='object'||Array.isArray(v))return 0;var required=['novelty_status','novel_insights','option_comparison','missing_information','no_additional_value_reason'],n=0;required.forEach(function(key){if(Object.prototype.hasOwnProperty.call(v,key))n+=10;});if(Array.isArray(v.novel_insights))n+=Math.min(2,v.novel_insights.length)*4;return n;}
    var best=score(value)>0?value:null,bestScore=score(value),preferred=['result','analysis','decision_support','payload','data','response','content'],children=[];
    preferred.forEach(function(key){if(value&&typeof value==='object'&&value[key]&&typeof value[key]==='object')children.push(value[key]);});
    if(Array.isArray(value))value.slice(0,12).forEach(function(child){if(child&&typeof child==='object')children.push(child);});else Object.keys(value).slice(0,20).forEach(function(key){if(preferred.indexOf(key)>=0)return;var child=value[key];if(child&&typeof child==='object')children.push(child);});
    children.forEach(function(child){var found=findProtocol(child,depth+1),foundScore=score(found);if(found&&foundScore>bestScore){best=found;bestScore=foundScore;}});return bestScore>=40?best:null;
  }
  function normalizeDecisionResult(raw){
    var value=findProtocol(raw,0)||{},comparison=objectOnly(value.option_comparison),missing=objectOnly(value.missing_information);
    var insights=safeArray(value.novel_insights).slice(0,2).map(function(x){x=objectOnly(x);return {category:scalarText(x.category,50),title:scalarText(x.title,600),explanation:scalarText(x.explanation,1500),novelty_reason:scalarText(x.novelty_reason,900),evidence:scalarList(x.evidence,10,520)};}).filter(function(x){return x.title&&x.explanation&&x.novelty_reason&&x.evidence.length;});
    var options=safeArray(comparison.compared_options).slice(0,3).map(function(x){x=objectOnly(x);return {option_id:scalarText(x.option_id,80),label:scalarText(x.label,160),description:scalarText(x.description,400),changes:scalarList(x.changes,10,300),metrics:objectOnly(x.metrics)};});
    return {novelty_status:scalarText(value.novelty_status,50),novel_insights:insights,option_comparison:{recommended_option_id:scalarText(comparison.recommended_option_id,80),recommended_option_label:scalarText(comparison.recommended_option_label,180),comparison:scalarText(comparison.comparison,1500),tradeoff:scalarText(comparison.tradeoff,1000),constraint_fit:scalarText(comparison.constraint_fit,900),evidence:scalarList(comparison.evidence,12,520),compared_options:options},missing_information:{question:scalarText(missing.question,700),why_it_matters:scalarText(missing.why_it_matters,1000),affected_option_labels:scalarList(missing.affected_option_labels,3,180)},no_additional_value_reason:scalarText(value.no_additional_value_reason,1200)};
  }
  function balancedJsonSlice(raw,start){var stack=[],inString=false,escape=false;for(var i=start;i<raw.length;i++){var ch=raw.charAt(i);if(inString){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch==='"')inString=false;continue;}if(ch==='"'){inString=true;continue;}if(ch==='{'||ch==='[')stack.push(ch);else if(ch==='}'||ch===']'){if(!stack.length)return '';var open=stack.pop();if((open==='{'&&ch!=='}')||(open==='['&&ch!==']'))return '';if(!stack.length)return raw.slice(start,i+1);}}return '';}
  function parseServerEnvelope(raw){raw=String(raw==null?'':raw).replace(/^\uFEFF/,'').trim();if(!raw)return null;try{var direct=JSON.parse(raw);if(direct&&typeof direct==='object')return direct;}catch(_){}for(var i=0;i<raw.length;i++){var ch=raw.charAt(i);if(ch!=='{'&&ch!=='[')continue;var slice=balancedJsonSlice(raw,i);if(!slice)continue;try{var parsed=JSON.parse(slice);if(parsed&&typeof parsed==='object'&&(Object.prototype.hasOwnProperty.call(parsed,'ok')||Object.prototype.hasOwnProperty.call(parsed,'error')||Object.prototype.hasOwnProperty.call(parsed,'result_mode')))return parsed;}catch(_){}}return null;}
  function nonJsonServerError(response,raw){var status=response&&response.status?Number(response.status):0;var type=response&&response.headers&&response.headers.get?String(response.headers.get('content-type')||'').toLowerCase():'';var body=String(raw==null?'':raw).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240);var low=body.toLowerCase();if(!body)return new Error('Сервер завершил запрос без JSON-ответа'+(status?' (HTTP '+status+')':'')+'. Обычно это означает тайм-аут или остановку PHP на хостинге.');if(status===502||status===503||status===504||/gateway|timeout|timed out|maximum execution time|upstream|cloudflare|nginx/.test(low))return new Error('Хостинг прервал запрос ИИ-анализа до завершения'+(status?' (HTTP '+status+')':'')+'. Повторите запрос; если ошибка сохраняется, проверьте лимит времени выполнения PHP.');if(type.indexOf('text/html')>=0||/^\s*</.test(String(raw)))return new Error('Сервер вернул HTML вместо JSON'+(status?' (HTTP '+status+')':'')+'. Проверьте журнал PHP и api/gemini.php.');return new Error('Сервер вернул непредусмотренный формат ответа'+(status?' (HTTP '+status+')':'')+'.');}
  function cooldownSeconds(){return Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000));}
  function updateRunButton(){var btn=$('geminiAiRunBtn');if(!btn)return;var wait=cooldownSeconds();btn.disabled=!!busyState||wait>0;btn.textContent=busyState?'Ищем новое сверх отчёта…':(wait>0?'Повторить через '+wait+' с':'Найти дополнительный вывод');}
  function startCooldown(seconds,message){seconds=Math.max(1,Math.min(3600,Math.ceil(Number(seconds)||60)));cooldownUntil=Date.now()+seconds*1000;if(cooldownTimer)clearInterval(cooldownTimer);function tick(){var left=cooldownSeconds();updateRunButton();if(left<=0){clearInterval(cooldownTimer);cooldownTimer=null;setStatus('Можно повторить запрос.','idle');}else setStatus((message||'Gemini ограничил частоту запросов.')+' Повтор будет доступен через '+left+' с.','error');}tick();cooldownTimer=setInterval(tick,1000);}
  function setBusy(busy){busyState=!!busy;updateRunButton();var pr=$('geminiAiProgress');if(pr)pr.setAttribute('aria-hidden',busy?'false':'true');if(progressTimer){clearInterval(progressTimer);progressTimer=null;}if(busy&&pr){var step=1;pr.dataset.step='1';progressTimer=setInterval(function(){step=step>=5?1:step+1;pr.dataset.step=String(step);},450);}else if(pr)pr.dataset.step='0';}
  function listHtml(values,className){var list=scalarList(values,12,520).map(function(x){return '<li>'+esc(x)+'</li>';}).join('');return list?'<ul'+(className?' class="'+esc(className)+'"':'')+'>'+list+'</ul>':'';}
  function fmt(value,digits){var n=Number(value);if(!Number.isFinite(n))return '—';return n.toFixed(digits==null?1:digits).replace(/\.0$/,'');}
  function signed(value,unit,digits){var n=Number(value);if(!Number.isFinite(n))return '—';return (n>0?'+':'')+fmt(n,digits)+(unit||'');}
  function optionCard(option,recommended){var m=option.metrics||{},changes=listHtml(option.changes,'gemini-ds-option-changes');return '<article class="gemini-ds-option'+(recommended?' is-recommended':'')+'"><div class="gemini-ds-option-head"><div><small>'+(recommended?'Предпочтительный вариант':'Рассчитанный вариант')+'</small><h3>'+esc(option.label||option.option_id)+'</h3></div>'+(recommended?'<span>Выбран ИИ</span>':'')+'</div><p>'+esc(option.description||'')+'</p>'+changes+'<dl class="gemini-ds-metrics"><div><dt>HEI</dt><dd>'+esc(fmt(m.hei_before,1))+' → '+esc(fmt(m.hei_after,1))+' ('+esc(signed(m.hei_delta,'',1))+')</dd></div><div><dt>Структура</dt><dd>'+esc(m.structure_before||'—')+' → '+esc(m.structure_after||'—')+'</dd></div><div><dt>Энергия</dt><dd>'+esc(signed(m.energy_delta_kcal,' ккал',0))+'</dd></div><div><dt>Натрий</dt><dd>'+esc(signed(m.sodium_delta_mg,' мг',0))+'</dd></div><div><dt>НЖК</dt><dd>'+esc(signed(m.sfa_delta_g,' г',1))+'</dd></div></dl></article>';}
  function renderDecision(rawResult,meta){
    var out=$('geminiAiOutput');if(!out)return;var result=normalizeDecisionResult(rawResult),status=result.novelty_status,html='<div class="gemini-ai-stale-banner" role="alert" hidden><strong>ИИ-разбор устарел.</strong><span>Рацион, профиль, ограничение или выбранный what-if-вариант изменились.</span></div>';
    if(status==='no_additional_value'){
      html+='<section class="gemini-ds-empty" data-ai-outcome="no-additional-value"><span>Проверка завершена</span><h2>Нового содержательного вывода сверх расчётного отчёта не найдено</h2><p>'+esc(result.no_additional_value_reason||'Расчётные модели и уже показанные рекомендации достаточно полно описывают текущий рацион. ИИ-блок не создаёт дополнительные карточки ради объёма.')+'</p></section>';
    }else if(status==='insufficient_basis'){
      html+='<section class="gemini-ds-empty gemini-ds-empty--warning" data-ai-outcome="insufficient-basis"><span>Дополнительный вывод не показан</span><h2>ИИ-ответ не прошёл проверку новизны или доказательности</h2><p>'+esc(result.no_additional_value_reason||'Калькулятор сохранил основной расчёт без повторяющей или неподтверждённой интерпретации.')+'</p></section>';
    }else{
      var insightHtml=result.novel_insights.map(function(x,index){return '<article class="gemini-ds-insight"><span>0'+(index+1)+'</span><div><small>'+esc(x.category||'Новый ракурс')+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.explanation)+'</p><div class="gemini-ds-novelty"><strong>Почему этого не было в отчёте</strong><p>'+esc(x.novelty_reason)+'</p></div>'+listHtml(x.evidence,'gemini-ds-evidence')+'</div></article>';}).join('');
      html+='<section class="gemini-ds-block" data-block="novel-insights"><div class="gemini-ds-heading"><span>ИИ-дополнение</span><h2>Что обнаружено сверх расчёта</h2><p>Показываются только выводы, которые не совпали по смыслу с уже выведенными заключениями и рекомендациями калькулятора.</p></div><div class="gemini-ds-insights">'+(insightHtml||'<p class="gemini-ai-empty">Отдельного нового наблюдения нет.</p>')+'</div></section>';
      var cmp=result.option_comparison,hasCmp=cmp.recommended_option_id&&cmp.compared_options.length>=2;
      if(hasCmp){var cards=cmp.compared_options.map(function(x){return optionCard(x,x.option_id===cmp.recommended_option_id);}).join('');html+='<section class="gemini-ds-block" data-block="option-comparison"><div class="gemini-ds-heading"><span>Поддержка выбора</span><h2>Какой рассчитанный вариант лучше соответствует задаче</h2><p>Числа получены существующим what-if-движком. Gemini только сопоставляет рассчитанные последствия и пользовательское ограничение.</p></div><div class="gemini-ds-option-grid">'+cards+'</div><div class="gemini-ds-comparison"><h3>'+esc(cmp.recommended_option_label||'Предпочтительный вариант')+'</h3><p>'+esc(cmp.comparison)+'</p><dl><div><dt>Главный компромисс</dt><dd>'+esc(cmp.tradeoff||'Не выделен.')+'</dd></div><div><dt>Соответствие вашему условию</dt><dd>'+esc(cmp.constraint_fit||'Пользовательское условие не задано.')+'</dd></div></dl>'+listHtml(cmp.evidence,'gemini-ds-evidence')+'</div></section>';}
      var mi=result.missing_information;if(mi.question){html+='<section class="gemini-ds-question" data-block="missing-information"><span>Один вопрос, который может изменить выбор</span><h2>'+esc(mi.question)+'</h2><p>'+esc(mi.why_it_matters)+'</p>'+(mi.affected_option_labels.length?'<p><strong>Может изменить оценку вариантов:</strong> '+esc(mi.affected_option_labels.join(', '))+'</p>':'')+'</section>';}
    }
    html+='<div class="gemini-ds-meta">Модель: '+esc(meta&&meta.model||'Gemini')+(meta&&meta.model_fallback_used?' · резервная модель':'')+(meta&&meta.deterministic_fallback_used?' · безопасный отказ от неподтверждённого дополнения':'')+(meta&&meta.novelty_validation_passed?' · новизна проверена':'')+' · числовые эффекты: только расчётное ядро</div>';
    out.innerHTML=html;out.hidden=false;out.dataset.stale='false';out.dataset.snapshotId=scalarText(meta&&meta.snapshot_id,80)||lastRequestedSnapshot||'';var clear=$('geminiAiClearBtn');if(clear)clear.hidden=false;
  }
  function renderUnexpectedFormat(meta){var out=$('geminiAiOutput');if(!out)return;out.innerHTML='<div class="gemini-ai-format-error" role="alert"><strong>Сервер вернул устаревший формат ИИ-дополнения.</strong><p>Сырой ответ скрыт. Обновите файлы сборки v5.3.200 на хостинге и повторите запрос.</p><div class="gemini-ds-meta">Модель: '+esc(meta&&meta.model||'Gemini')+'</div></div>';out.hidden=false;var clear=$('geminiAiClearBtn');if(clear)clear.hidden=false;}
  function run(){
    if(activeController)activeController.abort();var payload;try{payload=collectPayload();lastRequestedSnapshot=payload.snapshot_id;}catch(e){setStatus(e.message||String(e),'error');return;}
    var controller=typeof AbortController!=='undefined'?new AbortController():null;activeController=controller;var timeoutId=null,timedOut=false;if(controller)timeoutId=setTimeout(function(){timedOut=true;try{controller.abort();}catch(_){}},REQUEST_TIMEOUT_MS);
    setBusy(true);setStatus('Сравниваем расчётный отчёт с возможным ИИ-дополнением и отсеиваем повторы.','working');
    fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({action:'explain_results',payload:payload}),signal:controller?controller.signal:undefined}).then(function(response){return response.text().then(function(raw){return {response:response,raw:raw};});}).then(function(pack){var data=parseServerEnvelope(pack.raw);if(!data)throw nonJsonServerError(pack.response,pack.raw);if(!pack.response.ok||data.ok!==true){if(pack.response.status===429&&Number(data.retry_after_seconds)>0){startCooldown(Number(data.retry_after_seconds),data.error||'Gemini ограничил частоту запросов.');return null;}throw new Error(data.error||'Не удалось получить ИИ-дополнение.');}var normalized=normalizeDecisionResult(data.result||{});if(data.result_mode==='decision_support_v1'||normalized.novelty_status)renderDecision(data.result||{},data.meta||{});else renderUnexpectedFormat(data.meta||{});var mode=data.result&&data.result.novelty_status;if(mode==='new_value')setStatus('Найдено дополнительное наблюдение или полезное сравнение рассчитанных вариантов.','success');else if(mode==='no_additional_value')setStatus('Новых выводов сверх расчётного отчёта не найдено — дополнительные сущности не созданы.','success');else setStatus('Неподтверждённое ИИ-дополнение скрыто; основной расчёт сохранён без изменений.','idle');return data;}).catch(function(e){if(timedOut)setStatus('Хостинг не завершил ИИ-проверку за тридцать восемь секунд. Повторите запрос; при повторении проверьте лимит времени PHP.','error');else if(e&&e.name==='AbortError')setStatus('Запрос отменён.','idle');else setStatus(e&&e.message?e.message:'Не удалось связаться с Gemini API.','error');}).then(function(){if(timeoutId)clearTimeout(timeoutId);setBusy(false);if(activeController===controller)activeController=null;},function(e){if(timeoutId)clearTimeout(timeoutId);setBusy(false);if(activeController===controller)activeController=null;throw e;});
  }
  function clearResult(){var out=$('geminiAiOutput');if(out){out.hidden=true;out.innerHTML='';out.dataset.stale='false';out.dataset.snapshotId='';}lastRequestedSnapshot='';var b=$('geminiAiClearBtn');if(b)b.hidden=true;setStatus('','idle');}
  function markStale(reason){var out=$('geminiAiOutput');if(out&&!out.hidden&&out.dataset.stale!=='true'){out.dataset.stale='true';var banner=out.querySelector('.gemini-ai-stale-banner');if(banner)banner.hidden=false;setStatus(reason||'Расчётный снимок изменился. Старое ИИ-дополнение помечено как недействующее.','idle');}}
  function checkSnapshotStaleness(){var out=$('geminiAiOutput');if(!out||out.hidden||out.dataset.stale==='true')return;var expected=out.dataset.snapshotId||lastRequestedSnapshot;if(!expected)return;try{var current=collectPayload().snapshot_id;if(current!==expected)markStale('Рацион, профиль, пользовательское условие или what-if-вариант изменились. Старое дополнение больше не относится к текущему снимку.');}catch(_){markStale('Исходные данные изменились или стали недоступны. Запустите проверку заново.');}}
  function scheduleSnapshotCheck(){if(staleCheckTimer)clearTimeout(staleCheckTimer);staleCheckTimer=setTimeout(function(){staleCheckTimer=null;checkSnapshotStaleness();},160);}
  function install(){var btn=$('geminiAiRunBtn');if(!btn||btn.dataset.bound==='1')return;btn.dataset.bound='1';btn.addEventListener('click',function(e){e.preventDefault();run();});var clear=$('geminiAiClearBtn');if(clear)clear.addEventListener('click',function(e){e.preventDefault();clearResult();});var constraint=$('geminiAiConstraint');if(constraint){try{constraint.value=localStorage.getItem('nutri_ai_decision_constraint_v53199')||'';}catch(_){}constraint.addEventListener('input',function(){try{localStorage.setItem('nutri_ai_decision_constraint_v53199',text(constraint.value,600));}catch(_){}scheduleSnapshotCheck();});}['ration:changed','needs:computed','needs:changed','hei:rendered','diet:profile-rendered','harvard:event-bridge-render','harvard:recommendation-check'].forEach(function(ev){window.addEventListener(ev,scheduleSnapshotCheck);});document.addEventListener('input',function(e){if(e.target&&e.target.id&&e.target.id.indexOf('hpwi')===0)scheduleSnapshotCheck();},true);}
  window.NutritionGeminiAI={version:VERSION,collectPayload:collectPayload,snapshotId:snapshotId,normalizeResult:normalizeDecisionResult,render:renderDecision,parseEnvelope:parseServerEnvelope,checkStaleness:checkSnapshotStaleness,run:run,clear:clearResult,install:install};ready(install);
})();
