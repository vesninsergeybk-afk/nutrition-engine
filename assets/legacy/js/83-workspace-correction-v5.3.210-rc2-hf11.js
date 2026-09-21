/* Nutrition Calculator v5.3.210 RC2 HF11
 * Final user-flow polish for the "Improve" workspace.
 *
 * The user sees three action-oriented directions, ready quantity variants and
 * a concise compromise assessment. Manual grams and technical details remain
 * available on demand. All previews still use the canonical nutrition and HEI
 * calculators and never mutate the ration before explicit confirmation.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf11-correction';
  var initialized=false;
  var refreshTimer=0;
  var previewTimer=0;
  var selectedPriorityId='';
  var selectedRef='';
  var selectedPreset='recommended';
  var manualMode=false;
  var draftGrams=null;
  var currentModel=null;
  var currentScenario=null;
  var lastApplied=null;
  var internalMutation=false;
  var lastRenderKey='';
  var scenarioCache={};
  var reviewConfirmedScenarioId='';

  var STATUS_SCORE={critical:120,high:90,medium:62,unavailable:45};
  var HEI_LABELS={
    fruits_total:'Все фрукты',fruits_whole:'Цельные фрукты',vegetables_total:'Все овощи',greens_beans:'Зелень и бобовые',
    grains_whole:'Цельные злаки',dairy:'Молочные продукты',protein_total:'Все белковые продукты',seafood_plant:'Рыба и растительный белок',
    fatty_acids_ratio:'Соотношение жиров',grains_refined:'Рафинированные злаки',sodium_g:'Натрий',added_sugars_pct:'Добавленный сахар',sat_fats_pct:'Насыщённые жиры'
  };
  var HEI_NUTRIENT_EQUIVALENTS={sodium_g:'sodium_mg',added_sugars_pct:'added_sugars_g',sat_fats_pct:'sfa_g'};
  var ACTION_TITLES={
    kcal:{increase:'Добавить энергию',reduce:'Снизить калорийность'},protein_g:{increase:'Добавить белок',reduce:'Снизить белок'},
    fat_g:{increase:'Добавить жиры',reduce:'Снизить жиры'},carbs_g:{increase:'Добавить углеводы',reduce:'Снизить углеводы'},
    fiber_g:{increase:'Добавить клетчатку',reduce:'Снизить клетчатку'},sfa_g:{increase:'Добавить насыщенные жиры',reduce:'Снизить насыщенные жиры'},
    sodium_mg:{increase:'Добавить натрий',reduce:'Снизить натрий'},salt_g:{increase:'Добавить соль',reduce:'Снизить соль'},
    added_sugars_g:{increase:'Добавить сахар',reduce:'Снизить добавленный сахар'},calcium_mg:{increase:'Добавить кальций',reduce:'Снизить кальций'},
    iron_mg:{increase:'Добавить железо',reduce:'Снизить железо'},potassium_mg:{increase:'Добавить калий',reduce:'Снизить калий'},
    vitamin_d_mcg:{increase:'Добавить витамин D',reduce:'Снизить витамин D'},sodium_g:{increase:'Добавить натрий',reduce:'Снизить натрий'},
    added_sugars_pct:{increase:'Добавить сахар',reduce:'Снизить добавленный сахар'},sat_fats_pct:{increase:'Добавить насыщенные жиры',reduce:'Снизить насыщенные жиры'}
  };
  var TRACKED_METRICS=['kcal','protein_g','fat_g','carbs_g','fiber_g','sfa_g','sodium_mg','added_sugars_g','calcium_mg','iron_mg','potassium_mg','vitamin_d_mcg'];

  function byId(id){return d.getElementById(id);}
  function own(obj,key){return !!obj&&Object.prototype.hasOwnProperty.call(obj,key);}
  function num(value,fallback){var n=Number(value);return isFinite(n)?n:(fallback==null?0:fallback);}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function roundStep(value,step){step=step||5;return Math.max(step,Math.round(num(value)/step)*step);}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function fmt(value,digits){var n=Number(value);if(!isFinite(n))return '—';return n.toLocaleString('ru-RU',{maximumFractionDigits:digits==null?1:digits,minimumFractionDigits:0});}
  function fmtAmount(value,unit){var n=Number(value),digits=1;if(!isFinite(n))return '—';if(unit==='ккал'||Math.abs(n)>=100)digits=0;else if(Math.abs(n)<1&&n!==0)digits=2;return fmt(n,digits)+(unit?' '+unit:'');}
  function signed(value,digits){var n=Number(value);if(!isFinite(n)||Math.abs(n)<0.000001)return 'без изменения';return (n>0?'+':'−')+fmt(Math.abs(n),digits==null?1:digits);}
  function deepClone(value){try{return JSON.parse(JSON.stringify(value));}catch(_){return null;}}
  function currentRoute(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'';}catch(_){return '';}}
  function stateItems(){try{return w.State&&typeof w.State.get==='function'?(w.State.get()||[]):[];}catch(_){return [];}}
  function core(){return w.NutritionCalculationCore||w.NutritionCalculationCoreV53155||null;}
  function analysisApi(){return w.NutritionAnalysisWorkspaceHF7||null;}
  function product(item){try{return w.DB&&w.DB.byKey&&w.DB.byKey.get?w.DB.byKey.get(item.key):null;}catch(_){return null;}}
  function productName(item){var p=product(item);return item&&((item.name_ru||item.name)||(p&&(p.name_ru||p.name))||item.key)||'Продукт';}
  function itemRef(item){return String(item&&item.id||item&&item.key||'');}
  function itemByRef(ref,items){var i;items=items||stateItems();for(i=0;i<items.length;i++)if(itemRef(items[i])===ref||String(items[i].key||'')===ref)return items[i];return null;}
  function metricSpec(key){var c=core();try{return c&&c.getMetricSpec?c.getMetricSpec(key):null;}catch(_){return null;}}
  function dispatch(name,detail){try{w.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){} }
  function confidenceLabel(value){var s=String(value||'').toLowerCase();if(s.indexOf('высок')>=0)return 'высокая';if(s.indexOf('сред')>=0)return 'средняя';if(s.indexOf('огранич')>=0||s.indexOf('низк')>=0||s.indexOf('неполн')>=0)return 'ограниченная';return s||'не определена';}
  function actionTitle(p){var row=ACTION_TITLES[p&&p.key];if(row&&row[p.direction])return row[p.direction];return (p.direction==='reduce'?'Снизить: ':'Добавить: ')+(p&&p.title||'показатель').toLowerCase();}
  function statusText(p){
    if(!p)return 'Требует внимания';
    if(p.type==='hei')return 'Структура рациона ниже ориентира';
    if(p.mode==='upper_limit'){
      if(p.statusCode==='critical'&&/верхн|UL/i.test(String(p.statusLabel||'')))return 'Выше применимого верхнего уровня';
      return 'Выше рекомендуемого ограничения';
    }
    if(p.statusCode==='unavailable')return 'Недостаточно данных для оценки';
    return 'Ниже ориентира';
  }
  function contributorLead(p,main){
    if(!main)return 'Недостаточно данных о продуктах-вкладчиках';
    if(p.type==='hei')return (p.direction==='reduce'?'Основной источник снижения балла: ':'Наибольший вклад в этот компонент сейчас даёт ')+main.name+' — '+fmt(main.share,0)+'%';
    if(p.direction==='reduce')return 'Главный источник превышения: '+main.name+' — '+fmt(main.share,0)+'%';
    return 'Сейчас больше всего поступает из '+main.name+' — '+fmt(main.share,0)+'%';
  }
  function parseRangeMax(value){var matches=String(value||'').replace(',','.').match(/\d+(?:\.\d+)?/g),max=0,i,n;if(!matches)return 0;for(i=0;i<matches.length;i++){n=num(matches[i]);if(n>max)max=n;}return max;}
  function productText(contributor){var p=product(contributor&&contributor.item)||{},parts=[p.name_ru,p.name,p.category,p.catalog_category_key,(p.tags||[]).join(' ')];return parts.join(' ').toLowerCase();}
  function portionCap(contributor){
    var p=product(contributor&&contributor.item)||{},text=productText(contributor),units=p.serving_units||[],unitMax=0,i,u,range;
    for(i=0;i<units.length;i++){u=units[i]||{};range=parseRangeMax(u.weight_range_or_variants);unitMax=Math.max(unitMax,num(u.grams),range);}
    if(/масло сливоч|butter|майонез|mayonnaise|растительн.*масл|olive oil|sunflower oil/.test(text))return 120;
    if(/сыр|cheese/.test(text))return 200;
    if(unitMax>0)return Math.max(50,unitMax*2);
    if(/fruit|фрукт|ягод|banana|банан/.test(text))return 350;
    if(/vegetable|овощ|зелень/.test(text))return 500;
    if(/bread|хлеб|grain|круп|макарон|rice|рис|buckwheat|греч/.test(text))return 400;
    if(/meat|poultry|fish|мяс|птиц|рыб|творог/.test(text))return 400;
    return 400;
  }
  function portionCheck(priority,contributor,after){
    var before=num(contributor&&contributor.grams),next=num(after),change=Math.abs(next-before),cap;
    if(!(next>0)||next>5000)return {ok:false,reason:'Указанное количество выходит за рабочий диапазон.'};
    if(priority.direction==='reduce'){
      if(before>0&&(before-next)/before>0.55)return {ok:false,reason:'За один шаг пришлось бы убрать больше половины продукта.'};
      return {ok:true,reason:''};
    }
    cap=portionCap(contributor);
    if(next>cap+0.01)return {ok:false,reason:'Получилась чрезмерная порция для одного продукта: лучше добавить другой источник.'};
    if(before>0&&change>Math.max(80,before*0.35))return {ok:false,reason:'Изменение порции слишком велико для одного шага.'};
    return {ok:true,reason:''};
  }
  function displayStep(priority){
    if(priority&&priority.type==='hei')return 0.5;
    var unit=String(priority&&priority.unit||'').toLowerCase(),target=Math.abs(num(priority&&priority.target));
    if(unit.indexOf('ккал')>=0)return 10;
    if(unit.indexOf('мг')>=0)return target>=1000?10:target>=100?2:0.1;
    if(unit.indexOf('мкг')>=0)return target>=100?1:0.1;
    if(unit.indexOf('г')>=0)return 0.1;
    return 0.1;
  }
  function scenarioInstruction(p){return p&&p.direction==='reduce'?'Нужна замена продукта или уменьшение другого значимого источника.':'Нужен другой источник — простое увеличение текущей порции не подходит.';}

  function nutrientContributors(key,items){
    var c=core(),out=[],i,item,scaled,value;if(!c||typeof c.scaledPerItem!=='function')return out;
    for(i=0;i<items.length;i++){item=items[i];if(!item||!(num(item.grams)>0))continue;try{scaled=c.scaledPerItem(item)||{};}catch(_){scaled={};}value=num(scaled[key]);if(!(value>0))continue;out.push({ref:itemRef(item),key:item.key,name:productName(item),grams:num(item.grams),value:value,item:item});}
    out.sort(function(a,b){return b.value-a.value;});var sum=0;for(i=0;i<out.length;i++)sum+=out[i].value;for(i=0;i<out.length;i++)out[i].share=sum>0?out[i].value/sum*100:0;return out;
  }
  function heiContribution(intake,key,side){
    if(!intake)return 0;if(key==='vegetables_total')return num(intake.vegetables_total)+num(intake.legumes_veg_total);if(key==='greens_beans')return num(intake.greens_beans)+num(intake.legumes_greens_beans);if(key==='protein_total')return num(intake.protein_excl_legumes)+num(intake.legumes_as_protein);if(key==='sodium_g')return num(intake.sodium_mg);if(key==='added_sugars_pct')return num(intake.added_sugars_g);if(key==='sat_fats_pct')return num(intake.fatty_sfa_g);if(key==='fatty_acids_ratio')return side==='negative'?num(intake.fatty_sfa_g):num(intake.fatty_unsat_g);return num(intake[key]);
  }
  function heiContributors(key,direction,items){
    var adapter=w.HEI2020InputAdapterV2,out=[],i,item,intake,value,side=(key==='fatty_acids_ratio'&&direction==='reduce')?'negative':'positive';if(!adapter||typeof adapter.adapt!=='function')return out;
    for(i=0;i<items.length;i++){item=items[i];if(!item||!(num(item.grams)>0))continue;try{intake=adapter.adapt([item],w.DB)||null;}catch(_){intake=null;}value=heiContribution(intake,key,side);if(!(value>0))continue;out.push({ref:itemRef(item),key:item.key,name:productName(item),grams:num(item.grams),value:value,item:item});}
    out.sort(function(a,b){return b.value-a.value;});var sum=0;for(i=0;i<out.length;i++)sum+=out[i].value;for(i=0;i<out.length;i++)out[i].share=sum>0?out[i].value/sum*100:0;return out;
  }
  function nutrientPriority(row,items){
    var status=row&&row.status||{},score=STATUS_SCORE[status.code]||0,direction=row.mode==='upper_limit'||(num(row.target)>0&&num(row.actual)>num(row.target))?'reduce':'increase',contributors=nutrientContributors(row.key,items),actionable=status.code!=='unavailable'&&contributors.length>0;if(!score)return null;
    return {id:'nutrient:'+row.key,type:'nutrient',key:row.key,title:row.title,statusCode:status.code,statusLabel:status.label||'Требует внимания',actual:num(row.actual),target:num(row.target),unit:row.unit||'',mode:row.mode||'adequacy',direction:direction,score:score,confidence:confidenceLabel(row.quality&&row.quality.label),contributors:contributors,actionable:actionable,explanation:status.note||'',source:'rule'};
  }
  function heiDirection(row){if(row.key==='fatty_acids_ratio')return 'reduce';return row.group==='moderation'?'reduce':'increase';}
  function heiPriority(row,items){
    var pct=num(row.pct),direction=heiDirection(row),contributors=heiContributors(row.key,direction,items),score=58+clamp(90-pct,0,90)*0.28;
    return {id:'hei:'+row.key,type:'hei',key:row.key,title:row.title||HEI_LABELS[row.key]||row.key,statusCode:pct<60?'high':'medium',statusLabel:row.status&&row.status.label||'Есть запас для улучшения',actual:pct,target:90,unit:'% собственного максимума',mode:'adequacy',direction:direction,score:score,points:num(row.points),maxPoints:num(row.maxPoints),confidence:confidenceLabel(row.confidence),contributors:contributors,actionable:contributors.length>0,explanation:row.action||'',source:'rule'};
  }
  function buildPriorities(vm,items){
    var out=[],nutrientKeys={},i,row,p;if(!vm||!vm.items)return out;
    for(i=0;i<(vm.nutrients||[]).length;i++){row=vm.nutrients[i];if(['critical','high','medium','unavailable'].indexOf(row.status&&row.status.code)<0)continue;if(vm.completion<0.7&&row.key!=='kcal'&&row.status.code!=='critical'&&row.mode!=='upper_limit')continue;p=nutrientPriority(row,items);if(p){out.push(p);nutrientKeys[row.key]=1;}}
    for(i=0;i<(vm.hei&&vm.hei.rows||[]).length;i++){row=vm.hei.rows[i];if(num(row.pct)>=90)continue;if(HEI_NUTRIENT_EQUIVALENTS[row.key]&&nutrientKeys[HEI_NUTRIENT_EQUIVALENTS[row.key]])continue;p=heiPriority(row,items);if(p)out.push(p);}
    out.sort(function(a,b){if(a.actionable!==b.actionable)return a.actionable?-1:1;return b.score-a.score;});return out.slice(0,3);
  }
  function defaultAfter(priority,contributor){
    var before=num(contributor&&contributor.grams),fraction=0.2,gap,contribution=num(contributor&&contributor.value);
    if(priority.type==='nutrient'&&contribution>0&&priority.target>0){gap=Math.abs(priority.actual-priority.target);if(priority.direction==='reduce')fraction=clamp((gap/contribution)*0.8,0.1,0.4);else fraction=clamp((gap/contribution)*0.5,0.1,0.5);}else if(priority.type==='hei')fraction=priority.actual<60?0.25:0.15;
    if(priority.direction==='reduce')return roundStep(Math.max(5,before*(1-fraction)),5);return roundStep(Math.min(5000,before*(1+fraction)),5);
  }
  function gentleAfter(priority,contributor){
    var before=num(contributor&&contributor.grams),recommended=defaultAfter(priority,contributor),after=roundStep((before+recommended)/2,5);
    if(Math.abs(after-before)<4.9)after=priority.direction==='reduce'?Math.max(5,before-5):Math.min(5000,before+5);return after;
  }
  function presetAfter(priority,contributor,preset){if(preset==='gentle')return gentleAfter(priority,contributor);return defaultAfter(priority,contributor);}
  function priorityCurrentText(p){if(p.type==='hei')return fmt(p.points,1)+' из '+fmt(p.maxPoints,0)+' баллов · '+fmt(p.actual,0)+'% максимума';return fmtAmount(p.actual,p.unit)+(p.target>0?' при ориентире '+fmtAmount(p.target,p.unit):'');}

  function buildModel(){
    var api=analysisApi(),vm=null,items=stateItems(),priorities=[],active=null,contributor=null,model,i,best,selectionChanged=false;
    try{vm=api&&api.getViewModel?api.getViewModel():null;}catch(_){vm=null;}
    if(!vm&&core()&&core().snapshot)vm={items:items.length,completion:0,snapshot:core().snapshot(items),nutrients:[],hei:{rows:[],model:{}}};
    priorities=buildPriorities(vm,items);model={version:VERSION,vm:vm,items:items,priorities:priorities,active:null,contributor:null};
    for(i=0;i<priorities.length;i++){
      best=bestReadyCandidate(model,priorities[i]);
      if(best){priorities[i].readyRef=best.ref;priorities[i].readyAfter=best.after;priorities[i].readyPreset=best.preset;priorities[i].readyQuality=best.quality;priorities[i].readyVerdict=best.verdict;}
      else priorities[i].readyReason=scenarioInstruction(priorities[i]);
    }
    if(!selectedPriorityId||!priorities.some(function(x){return x.id===selectedPriorityId;})){selectedPriorityId=priorities.length?priorities[0].id:'';selectionChanged=true;}
    for(i=0;i<priorities.length;i++)if(priorities[i].id===selectedPriorityId){active=priorities[i];break;}
    model.active=active;
    if(active){
      if(selectionChanged||!selectedRef||!active.contributors.some(function(x){return x.ref===selectedRef;})){
        selectedRef=active.readyRef||(active.contributors.length?active.contributors[0].ref:'');selectedPreset=active.readyPreset||'recommended';draftGrams=null;manualMode=false;
      }
      for(i=0;i<active.contributors.length;i++)if(active.contributors[i].ref===selectedRef){contributor=active.contributors[i];break;}
      if(contributor&&(draftGrams==null||!isFinite(Number(draftGrams))))draftGrams=(active.readyRef===contributor.ref&&active.readyAfter&&selectedPreset===active.readyPreset)?active.readyAfter:presetAfter(active,contributor,selectedPreset);
    }else{selectedRef='';draftGrams=null;currentScenario=null;}
    model.contributor=contributor;return model;
  }
  function scaleComposite(item,before,after){var ratio=before>0?after/before:1,i;if(!item||!Array.isArray(item.children))return;for(i=0;i<item.children.length;i++)if(item.children[i])item.children[i].grams=Math.max(0,num(item.children[i].grams)*ratio);}
  function draftRation(items,ref,after){var cloned=deepClone(items)||[],i,item,before;for(i=0;i<cloned.length;i++){item=cloned[i];if(itemRef(item)!==ref&&String(item.key||'')!==ref)continue;before=num(item.grams);scaleComposite(item,before,after);item.grams=after;break;}return cloned;}
  function requestedEnergy(){var spec=metricSpec('kcal');return num(spec&&spec.target)||undefined;}
  function calculateHei(snapshot){try{return w.HEIRuntimeV2&&typeof w.HEIRuntimeV2.calculateFromSnapshot==='function'?w.HEIRuntimeV2.calculateFromSnapshot(snapshot,requestedEnergy()):null;}catch(_){return null;}}
  function heiComponent(model,key){var c=model&&model.components&&model.components[key]||null,max=num(c&&c.maxPoints,(c&&c.standard&&c.standard.pts)||10),points=num(c&&c.points,model&&model.points&&model.points[key]);return {points:points,maxPoints:max,pct:max>0?clamp(points/max*100,0,100):0};}
  function deviation(key,value){var spec=metricSpec(key),target=num(spec&&spec.target);if(!spec||!(target>0)||spec.mode==='informational')return 0;if(spec.mode==='upper_limit')return Math.max(0,(num(value)-target)/target);return Math.max(0,(target-num(value))/target);}
  function metricChange(before,after,key){var spec=metricSpec(key);return {key:key,title:spec&&spec.title||key,unit:spec&&spec.unit||'',before:num(before&&before.totals&&before.totals[key]),after:num(after&&after.totals&&after.totals[key]),target:num(spec&&spec.target),mode:spec&&spec.mode||'informational'};}
  function targetResult(priority,beforeSnapshot,afterSnapshot,beforeHei,afterHei){
    var before,after,beforeDev,afterDev,gapClosed,step,delta,displayChanged,rawImproves,meaningful;
    if(priority.type==='hei'){
      var b=heiComponent(beforeHei,priority.key),a=heiComponent(afterHei,priority.key);
      before=b.pct;after=a.pct;delta=after-before;step=displayStep(priority);gapClosed=Math.max(0,delta)/Math.max(90-before,1);displayChanged=Math.abs(delta)>=step;rawImproves=delta>0.05;meaningful=rawImproves&&displayChanged&&(gapClosed>=0.08||delta>=2);
      return {before:before,after:after,unit:'%',beforePoints:b.points,afterPoints:a.points,maxPoints:a.maxPoints,improves:rawImproves,meaningful:meaningful,displayChanged:displayChanged,gapClosed:gapClosed,delta:delta};
    }
    before=num(beforeSnapshot.totals&&beforeSnapshot.totals[priority.key]);after=num(afterSnapshot.totals&&afterSnapshot.totals[priority.key]);beforeDev=deviation(priority.key,before);afterDev=deviation(priority.key,after);gapClosed=beforeDev>0?Math.max(0,beforeDev-afterDev)/beforeDev:0;step=displayStep(priority);delta=after-before;displayChanged=Math.abs(delta)>=step;rawImproves=afterDev<beforeDev-0.0001;meaningful=rawImproves&&displayChanged&&(gapClosed>=0.08||Math.abs(delta)>=step*3);
    return {before:before,after:after,unit:priority.unit,improves:rawImproves,meaningful:meaningful,displayChanged:displayChanged,gapClosed:gapClosed,delta:delta};
  }
  function buildTradeoffs(priority,beforeSnapshot,afterSnapshot,beforeHei,afterHei){
    var rows=[],i,key,m,bDev,aDev,delta,target,kind,weight,heiDelta=num(afterHei&&afterHei.total)-num(beforeHei&&beforeHei.total);
    for(i=0;i<TRACKED_METRICS.length;i++){
      key=TRACKED_METRICS[i];if(priority.type==='nutrient'&&key===priority.key)continue;m=metricChange(beforeSnapshot,afterSnapshot,key);delta=m.after-m.before;target=m.target||Math.max(Math.abs(m.before),1);bDev=deviation(key,m.before);aDev=deviation(key,m.after);kind='';
      if(aDev>bDev+0.05)kind='worse';else if(aDev<bDev-0.05)kind='better';else if(Math.abs(delta)/target>=0.1)kind='change';
      if(kind){weight=Math.abs(aDev-bDev)*10+Math.abs(delta)/target;rows.push({kind:kind,title:m.title,before:m.before,after:m.after,unit:m.unit,weight:weight});}
    }
    if(heiDelta<-1)rows.push({kind:'worse',title:'Итоговый HEI',before:num(beforeHei&&beforeHei.total),after:num(afterHei&&afterHei.total),unit:' баллов',weight:Math.abs(heiDelta)/5+2});else if(heiDelta>1)rows.push({kind:'better',title:'Итоговый HEI',before:num(beforeHei&&beforeHei.total),after:num(afterHei&&afterHei.total),unit:' баллов',weight:Math.abs(heiDelta)/5+1});
    rows.sort(function(a,b){return b.weight-a.weight;});return rows.slice(0,5);
  }
  function rationSignature(items){var rows=[],i;for(i=0;i<items.length;i++)rows.push(itemRef(items[i])+':'+num(items[i].grams));return rows.join('|');}
  function buildScenarioFor(model,p,ref,after){
    var contributor=null,i,cacheKey,beforeSnapshot,afterSnapshot,beforeHei,afterHei,target,tradeoffs,sourceSnapshot,portion;
    if(!p||!p.actionable||!ref)return null;for(i=0;i<p.contributors.length;i++)if(p.contributors[i].ref===ref){contributor=p.contributors[i];break;}if(!contributor)return null;
    cacheKey=rationSignature(model.items)+'~'+p.id+'~'+ref+'~'+num(after);if(scenarioCache[cacheKey])return scenarioCache[cacheKey];
    sourceSnapshot=model.vm&&model.vm.snapshot||null;beforeSnapshot=sourceSnapshot||core().snapshot(model.items);afterSnapshot=core().snapshot(draftRation(model.items,ref,num(after)));beforeHei=model.vm&&model.vm.hei&&model.vm.hei.model&&own(model.vm.hei.model,'total')?model.vm.hei.model:calculateHei(beforeSnapshot);afterHei=calculateHei(afterSnapshot);target=targetResult(p,beforeSnapshot,afterSnapshot,beforeHei,afterHei);tradeoffs=buildTradeoffs(p,beforeSnapshot,afterSnapshot,beforeHei,afterHei);portion=portionCheck(p,contributor,num(after));
    scenarioCache[cacheKey]={id:'hf11-'+p.id+'-'+ref+'-'+num(after),source:'rule',targetMetric:{type:p.type,key:p.key,title:p.title},operations:[{type:'set_grams',productKey:contributor.key,ref:contributor.ref,productName:contributor.name,gramsBefore:contributor.grams,gramsAfter:num(after)}],beforeSnapshot:beforeSnapshot,afterSnapshot:afterSnapshot,beforeHei:beforeHei,afterHei:afterHei,benefits:target.meaningful?[{metric:p.key,before:target.before,after:target.after}]:[],tradeoffs:tradeoffs,confidence:p.confidence,status:'draft',targetResult:target,portionCheck:portion,priority:p,createdAt:new Date().toISOString()};return scenarioCache[cacheKey];
  }
  function scenarioBurden(s){
    var v=verdict(s),worse=0,weight=0,i,r,op,ratio;if(!v.candidate)return 1000000;
    for(i=0;i<(s.tradeoffs||[]).length;i++){r=s.tradeoffs[i];if(r.kind==='worse')worse++;weight+=num(r.weight)*(r.kind==='worse'?1:0.2);}
    op=s.operations&&s.operations[0];ratio=op&&op.gramsBefore>0?Math.abs(op.gramsAfter-op.gramsBefore)/op.gramsBefore:1;
    return worse*100+weight*8+ratio*5+(1-num(s.targetResult&&s.targetResult.gapClosed))*12+(v.code==='review'?18:0);
  }
  function bestReadyCandidate(model,p){
    var limit=Math.min(3,(p&&p.contributors||[]).length),best=null,i,j,c,after,s,q,presets=['recommended','gentle'],mainShare=num(p&&p.contributors&&p.contributors[0]&&p.contributors[0].share),seen={};
    for(i=0;i<limit;i++){
      c=p.contributors[i];if(i>0&&num(c.share)<Math.max(20,mainShare*0.6))continue;
      for(j=0;j<presets.length;j++){
        after=presetAfter(p,c,presets[j]);if(seen[c.ref+':'+after])continue;seen[c.ref+':'+after]=1;s=buildScenarioFor(model,p,c.ref,after);q=scenarioBurden(s)+i*25+j*3;
        if(!best||q<best.quality)best={ref:c.ref,after:after,preset:presets[j],quality:q,verdict:verdict(s)};
      }
    }
    return best&&best.quality<1000000?best:null;
  }
  function buildScenario(model){
    if(!model||!model.active)return null;
    if(!manualMode&&!model.active.readyRef)return null;
    return buildScenarioFor(model,model.active,selectedRef,draftGrams);
  }
  function verdict(s){
    var worse=0,severity=0,i,r;if(!s)return {code:'not-helpful',title:'Готового варианта нет',text:'Выберите другое направление.',applyAllowed:false,candidate:false};
    if(!s.portionCheck||!s.portionCheck.ok)return {code:'blocked',title:'Количество получается нереалистичным',text:s.portionCheck&&s.portionCheck.reason||'Нужен другой способ изменения рациона.',applyAllowed:false,candidate:false};
    if(!s.targetResult||!s.targetResult.improves)return {code:'not-helpful',title:'Этот вариант не решает выбранную задачу',text:'Показатель не меняется в нужную сторону.',applyAllowed:false,candidate:false};
    if(!s.targetResult.meaningful)return {code:'not-helpful',title:'Изменение слишком мало, чтобы быть полезным',text:'В отображаемой точности результат почти не меняется.',applyAllowed:false,candidate:false};
    for(i=0;i<(s.tradeoffs||[]).length;i++){r=s.tradeoffs[i];if(r.kind==='worse'){worse++;severity+=num(r.weight);}}
    if(worse>=2||severity>=4)return {code:'blocked',title:'Вариант не подходит для автоматического применения',text:'Целевой показатель улучшится, но другие важные результаты ухудшатся слишком заметно.',applyAllowed:false,candidate:false};
    if(worse===1||severity>=1.5)return {code:'review',title:'Вариант неоднозначный',text:'Показатель улучшится, но перед применением нужно проверить одно побочное изменение.',applyAllowed:true,candidate:true};
    return {code:'clear',title:'Вариант выглядит целесообразным',text:'По рассчитанным данным выбранный показатель заметно улучшится без существенных ухудшений по основным показателям.',applyAllowed:true,candidate:true};
  }
  function targetValues(s){var t=s.targetResult,p=s.priority,before,after;if(p.type==='hei'){before=fmt(t.beforePoints,1)+'/'+fmt(t.maxPoints,0);after=fmt(t.afterPoints,1)+'/'+fmt(t.maxPoints,0);}else{before=fmtAmount(t.before,t.unit);after=fmtAmount(t.after,t.unit);}return {before:before,after:after};}

  function createPanel(){
    var main=byId('mainContent'),anchor=byId('heiPanel'),panel;if(!main||!anchor||byId('workspaceCorrectionPanel'))return;
    panel=d.createElement('section');panel.id='workspaceCorrectionPanel';panel.className='card workspace-correction';panel.hidden=true;panel.setAttribute('data-navshell-original-hidden','1');panel.setAttribute('aria-labelledby','workspaceCorrectionWorkbenchTitle');
    panel.innerHTML='<div id="workspaceCorrectionStatus" class="workspace-correction-status" aria-live="polite"></div><section id="workspaceCorrectionWorkbench" class="workspace-correction-workbench" aria-labelledby="workspaceCorrectionWorkbenchTitle"><div class="workspace-correction-section-head"><div><h3 id="workspaceCorrectionWorkbenchTitle">Проверить изменение</h3></div><small id="workspaceCorrectionWorkbenchNote">рацион изменится только после подтверждения</small></div><div id="workspaceCorrectionEditor"></div><div id="workspaceCorrectionPreview" class="workspace-correction-preview" aria-live="polite"></div></section><section id="workspaceCorrectionPriorities" class="workspace-correction-priorities" aria-labelledby="workspaceCorrectionPrioritiesTitle"><div class="workspace-correction-section-head"><div><h3 id="workspaceCorrectionPrioritiesTitle">Другие направления</h3></div><small>выберите, чтобы проверить</small></div><div id="workspaceCorrectionPriorityList"></div></section><details class="workspace-correction-method"><summary>Как рассчитан вариант</summary><p>Предпросмотр создаётся на копии рациона и заново рассчитывает энергию, нутриенты и HEI. Основной рацион меняется только после подтверждения.</p></details><div class="workspace-correction-ai"><button type="button" class="secondary link-button" data-open-legacy-ai>Подобрать другой вариант с ИИ</button><small>Это отдельный инструмент. Его предложения не применяются автоматически.</small></div>';
    main.insertBefore(panel,anchor);
  }
  function registerPanel(){if(!w.NavigationShellV1)return;if(typeof w.NavigationShellV1.registerManaged==='function')w.NavigationShellV1.registerManaged('workspaceCorrectionPanel',true);if(typeof w.NavigationShellV1.refresh==='function')w.NavigationShellV1.refresh();}

  function renderStatus(model){
    var host=byId('workspaceCorrectionStatus'),vm=model.vm,html='';if(!host)return;
    if(!vm||!vm.items)html='<div class="is-neutral"><strong>Сначала добавьте продукты</strong><span>Без рациона невозможно определить вкладчики и проверить изменение.</span><button type="button" data-workspace-route="ration">Перейти к рациону</button></div>';
    else if(num(vm.completion)<0.55)html='<div class="is-warning"><strong>Рацион заполнен примерно на '+fmt(num(vm.completion)*100,0)+'%</strong><span>Сначала приблизьте рацион к обычному дневному объёму, иначе выводы будут преждевременными.</span><button type="button" data-workspace-route="ration">Продолжить заполнение</button></div>';
    else if(!model.priorities.length)html='<div class="is-ok"><strong>Явных направлений для автоматической проверки не найдено</strong><span>Откройте подробный анализ или измените рацион вручную.</span><button type="button" data-workspace-route="analysis/nutrients">Открыть нутриенты</button></div>';
    else if(lastApplied){var current=itemByRef(lastApplied.ref,model.items),canUndo=current&&Math.abs(num(current.grams)-lastApplied.after)<0.01;html='<div class="is-applied"><strong>Изменение применено: '+esc(lastApplied.productName)+'</strong><span>'+fmt(lastApplied.before,0)+' → '+fmt(lastApplied.after,0)+' г. Все показатели пересчитаны.</span><button type="button" class="secondary" data-correction-undo '+(canUndo?'':'disabled')+'>Отменить изменение</button>'+(canUndo?'':'<small>Граммовка уже изменена повторно; автоматический откат отключён.</small>')+'</div>';}
    host.innerHTML=html;
  }
  function priorityCardHtml(model,p){
    var ready=p.readyRef&&p.readyAfter,summary=ready?'Есть проверяемый вариант':scenarioInstruction(p);
    return '<button type="button" class="secondary workspace-priority-chip is-'+esc(p.statusCode)+'" data-correction-priority="'+esc(p.id)+'"><strong>'+esc(actionTitle(p))+'</strong><small>'+esc(priorityCurrentText(p))+'</small><span>'+esc(summary)+'</span></button>';
  }
  function renderPriorities(model){
    var host=byId('workspaceCorrectionPriorityList'),section=byId('workspaceCorrectionPriorities'),html='',i,p;if(!host)return;
    for(i=0;i<model.priorities.length;i++){p=model.priorities[i];if(p.id===selectedPriorityId)continue;html+=priorityCardHtml(model,p);}
    host.innerHTML=html;if(section)section.hidden=!html;
  }
  function contributorOptions(priority){var html='',i,c;for(i=0;i<priority.contributors.length;i++){c=priority.contributors[i];html+='<option value="'+esc(c.ref)+'"'+(c.ref===selectedRef?' selected':'')+'>'+esc(c.name)+' — '+fmt(c.grams,0)+' г, '+fmt(c.share,0)+'% показателя</option>';}return html;}
  function variantButton(p,c,preset,model){
    var after=presetAfter(p,c,preset),s=buildScenarioFor(model,p,c.ref,after),v=verdict(s),tv=s?targetValues(s):null,label;if(!v.candidate)return '';
    label=(p.direction==='reduce'?'Уменьшить до ':'Увеличить до ')+fmt(after,0)+' г';
    return '<button type="button" class="secondary workspace-correction-variant'+(selectedPreset===preset&&!manualMode?' is-active':'')+'" data-correction-preset="'+preset+'" aria-pressed="'+(selectedPreset===preset&&!manualMode?'true':'false')+'"><strong>'+esc(label)+'</strong><span>'+esc(c.name)+': '+fmt(c.grams,0)+' → '+fmt(after,0)+' г</span>'+(tv?'<small>'+esc(p.title)+': '+esc(tv.before)+' → '+esc(tv.after)+'</small>':'')+'<em class="is-'+esc(v.code)+'">'+esc(v.title)+'</em></button>';
  }
  function renderEditor(model){
    var host=byId('workspaceCorrectionEditor'),p=model.active,c=model.contributor,workTitle=byId('workspaceCorrectionWorkbenchTitle'),workNote=byId('workspaceCorrectionWorkbenchNote'),main,variants='',seen={},after,html='';if(!host)return;
    if(!p){if(workTitle)workTitle.textContent='Проверить изменение';if(workNote)workNote.textContent='рацион изменится только после подтверждения';host.innerHTML='<div class="workspace-correction-empty"><strong>Направлений пока нет</strong><p>Сначала заполните рацион и выполните анализ.</p></div>';return;}
    if(workTitle)workTitle.textContent='Проверить изменение';if(workNote)workNote.textContent=statusText(p)+' · '+priorityCurrentText(p);
    main=p.contributors[0]||null;html+='<div class="workspace-correction-active"><span>'+esc(statusText(p))+'</span><strong>'+esc(actionTitle(p))+'</strong><p>'+esc(contributorLead(p,main))+'.</p></div>';if(c&&main&&c.ref!==main.ref)html+='<p class="workspace-correction-selection-note">Для проверки выбран '+esc(c.name)+': этот продукт тоже заметно влияет на показатель, а изменение главного источника вызывает больше нежелательных изменений.</p>';
    if(!p.actionable){html+='<div class="workspace-correction-no-simple"><strong>Готовый вариант пока недоступен</strong><p>Для показателя недостаточно данных по продуктам. Проверьте карточки продуктов или измените рацион вручную.</p><button type="button" data-workspace-route="analysis/nutrients">Проверить данные</button></div>';host.innerHTML=html;return;}
    if(c){['recommended','gentle'].forEach(function(preset){after=presetAfter(p,c,preset);if(seen[after])return;seen[after]=1;variants+=variantButton(p,c,preset,model);});}
    if(variants)html+='<div class="workspace-correction-variants" role="group" aria-label="Проверяемые варианты">'+variants+'</div>';
    else html+='<div class="workspace-correction-no-simple"><strong>Простого изменения количества недостаточно</strong><p>'+esc(p.readyReason||scenarioInstruction(p))+' Простое изменение имеющихся порций либо почти не решает задачу, либо требует нереалистичного количества продукта или заметно ухудшает другие показатели.</p></div>';
    html+='<button type="button" class="secondary workspace-correction-manual-toggle" data-correction-manual aria-expanded="'+(manualMode?'true':'false')+'">'+(manualMode?'Скрыть ручную настройку':'Настроить количество вручную')+'</button><div class="workspace-correction-manual" '+(manualMode?'':'hidden')+'><label>Продукт для проверки<select id="workspaceCorrectionProduct">'+contributorOptions(p)+'</select></label><label>Количество, г<div class="workspace-correction-grams"><button type="button" class="secondary" data-correction-step="-10" aria-label="Уменьшить на 10 граммов">−10</button><input id="workspaceCorrectionGrams" type="number" min="1" max="5000" step="1" value="'+esc(draftGrams)+'"><button type="button" class="secondary" data-correction-step="10" aria-label="Увеличить на 10 граммов">+10</button></div></label><small>Результат пересчитывается автоматически.</small></div>';
    host.innerHTML=html;
  }
  function summaryMetric(snapshot,key){var spec=metricSpec(key),value=num(snapshot&&snapshot.totals&&snapshot.totals[key]);return {title:spec&&spec.title||key,value:value,unit:spec&&spec.unit||''};}
  function summaryHtml(s){var keys=['kcal','protein_g','fat_g','carbs_g'],html='<div class="workspace-correction-summary">',i,b,a,delta;for(i=0;i<keys.length;i++){b=summaryMetric(s.beforeSnapshot,keys[i]);a=summaryMetric(s.afterSnapshot,keys[i]);delta=a.value-b.value;html+='<article><span>'+esc(a.title)+'</span><strong>'+esc(fmtAmount(a.value,a.unit))+'</strong><small>'+esc(signed(delta,a.unit==='ккал'?0:1))+' '+esc(a.unit)+'</small></article>';}b=num(s.beforeHei&&s.beforeHei.total);a=num(s.afterHei&&s.afterHei.total);html+='<article><span>HEI</span><strong>'+fmt(a,1)+'/100</strong><small>'+signed(a-b,1)+' балла</small></article></div>';return html;}
  function tradeoffHtml(rows){var html='<section class="workspace-correction-tradeoffs"><h4>Другие заметные изменения</h4>';if(!rows.length)return html+'<p>Существенных изменений по другим основным показателям не обнаружено.</p></section>';html+='<div>';rows.forEach(function(r){html+='<article class="is-'+esc(r.kind)+'"><strong>'+esc(r.title)+'</strong><span>'+esc(fmtAmount(r.before,r.unit))+' → '+esc(fmtAmount(r.after,r.unit))+'</span><small>'+(r.kind==='worse'?'может потребовать внимания':r.kind==='better'?'сопутствующее улучшение':'заметное изменение')+'</small></article>';});return html+'</div></section>';}
  function briefTradeoffs(rows){var html='',shown=0,i,r;for(i=0;i<(rows||[]).length&&shown<3;i++){r=rows[i];if(r.kind!=='worse'&&r.kind!=='better'&&shown>0)continue;html+='<li class="is-'+esc(r.kind)+'"><strong>'+esc(r.title)+'</strong><span>'+esc(fmtAmount(r.before,r.unit))+' → '+esc(fmtAmount(r.after,r.unit))+'</span></li>';shown++;}if(!shown)html='<li class="is-ok"><strong>Другие показатели</strong><span>заметных ухудшений не обнаружено</span></li>';return '<ul class="workspace-correction-brief">'+html+'</ul>';}
  function renderPreview(){
    var host=byId('workspaceCorrectionPreview'),s=currentScenario,v,tv,op,button='';if(!host)return;
    if(!s){host.innerHTML='';return;}
    v=verdict(s);tv=targetValues(s);op=s.operations[0];
    if(v.applyAllowed){if(v.code==='review'&&reviewConfirmedScenarioId!==s.id)button='<button type="button" class="secondary is-review" data-correction-review-confirm>Проверить последствия</button>';else button='<button type="button" '+(v.code==='review'?'class="secondary is-review" ':'')+'data-correction-apply>'+(v.code==='review'?'Подтвердить применение':'Применить изменение')+'</button>';}
    else button='<div class="workspace-correction-next"><strong>Не применять автоматически</strong><span>'+esc(v.text)+'</span></div>';
    host.innerHTML='<section class="workspace-correction-decision is-'+esc(v.code)+'"><div class="workspace-correction-decision__copy"><span>Итог проверки</span><strong>'+esc(v.title)+'</strong><p>'+esc(op.productName)+': '+fmt(op.gramsBefore,0)+' → '+fmt(op.gramsAfter,0)+' г. '+esc(s.priority.title)+': '+esc(tv.before)+' → '+esc(tv.after)+'.</p></div>'+briefTradeoffs(s.tradeoffs)+button+'</section><details class="workspace-correction-details"><summary>Все изменения показателей</summary>'+summaryHtml(s)+tradeoffHtml(s.tradeoffs)+'</details>';
  }
  function render(force){
    if(!force&&currentRoute()!=='correction')return;currentModel=buildModel();currentScenario=buildScenario(currentModel);updateCorrectionPersonContext();
    var key=[currentModel.items.length,currentModel.priorities.map(function(p){return p.id+':'+Math.round(p.actual*100)+':'+p.actionable+':'+(p.readyRef||'');}).join('|'),selectedPriorityId,selectedRef,selectedPreset,manualMode,draftGrams,currentScenario&&currentScenario.id,lastApplied&&lastApplied.after].join('~');if(!force&&key===lastRenderKey)return;lastRenderKey=key;
    renderStatus(currentModel);renderEditor(currentModel);renderPreview();renderPriorities(currentModel);
  }
  function updateCorrectionPersonContext(){
    var box=byId('workspacePersonContext'),name=byId('workspacePersonName'),targets=byId('workspacePersonTargets'),compact;if(!box)return;
    compact=byId('workspaceCorrectionPersonSummary');if(!compact){compact=d.createElement('div');compact.id='workspaceCorrectionPersonSummary';compact.className='workspace-correction-person-summary';box.insertBefore(compact,box.firstChild);}
    var targetText=String(targets&&targets.textContent||''),first=targetText.split('·')[0].trim();compact.textContent=String(name&&name.textContent||'Профиль')+(first?' · '+first:'');
  }
  function schedule(force){w.clearTimeout(refreshTimer);refreshTimer=w.setTimeout(function(){render(!!force);},80);}
  function schedulePreview(){w.clearTimeout(previewTimer);previewTimer=w.setTimeout(function(){render(true);dispatch('workspace-correction:preview',{version:VERSION,scenario:currentScenario});},220);}
  function choosePriority(id){selectedPriorityId=id;selectedRef='';selectedPreset='recommended';manualMode=false;draftGrams=null;currentScenario=null;reviewConfirmedScenarioId='';lastRenderKey='';render(true);var panel=byId('workspaceCorrectionWorkbench');if(panel){try{panel.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){panel.scrollIntoView(true);}}}
  function choosePreset(preset){selectedPreset=preset;manualMode=false;draftGrams=null;currentScenario=null;reviewConfirmedScenarioId='';render(true);}
  function chooseContributor(ref){selectedRef=ref;selectedPreset='recommended';draftGrams=null;currentScenario=null;reviewConfirmedScenarioId='';manualMode=true;render(true);}
  function updateDraft(value){selectedPreset='manual';manualMode=true;draftGrams=clamp(num(value),1,5000);currentScenario=null;reviewConfirmedScenarioId='';var input=byId('workspaceCorrectionGrams');if(input)input.value=String(draftGrams);schedulePreview();}
  function preview(){currentModel=buildModel();currentScenario=buildScenario(currentModel);render(true);dispatch('workspace-correction:preview',{version:VERSION,scenario:currentScenario});}
  function applyScenario(){
    var s=currentScenario,op,current,v=verdict(s);if(!s||!v.applyAllowed||(v.code==='review'&&reviewConfirmedScenarioId!==s.id)||!w.State||typeof w.State.update!=='function')return;op=s.operations[0];current=itemByRef(op.ref,stateItems());if(!current||Math.abs(num(current.grams)-op.gramsBefore)>0.01){currentScenario=null;render(true);return;}
    internalMutation=true;w.State.update(op.ref,op.gramsAfter);internalMutation=false;s.status='applied';lastApplied={ref:op.ref,key:op.productKey,productName:op.productName,before:op.gramsBefore,after:op.gramsAfter,scenarioId:s.id,appliedAt:new Date().toISOString()};scenarioCache={};currentScenario=null;draftGrams=null;reviewConfirmedScenarioId='';dispatch('workspace-correction:applied',{version:VERSION,change:lastApplied});w.setTimeout(function(){render(true);},180);
  }
  function undo(){var a=lastApplied,current;if(!a||!w.State||typeof w.State.update!=='function')return;current=itemByRef(a.ref,stateItems());if(!current||Math.abs(num(current.grams)-a.after)>0.01){render(true);return;}internalMutation=true;w.State.update(a.ref,a.before);internalMutation=false;dispatch('workspace-correction:reverted',{version:VERSION,change:a});lastApplied=null;scenarioCache={};currentScenario=null;draftGrams=null;reviewConfirmedScenarioId='';w.setTimeout(function(){render(true);},180);}
  function openLegacyAi(){if(w.NavigationShellV1&&typeof w.NavigationShellV1.setMode==='function')w.NavigationShellV1.setMode('long');w.setTimeout(function(){var el=byId('geminiAiSection');if(el){try{el.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){el.scrollIntoView(true);}}},80);}

  function bind(){
    d.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('[data-correction-priority],[data-correction-preset],[data-correction-manual],[data-correction-step],[data-correction-review-confirm],[data-correction-apply],[data-correction-undo],[data-open-legacy-ai]'):null;if(!el)return;
      if(el.hasAttribute('data-correction-priority')){e.preventDefault();choosePriority(el.getAttribute('data-correction-priority'));return;}
      if(el.hasAttribute('data-correction-preset')){e.preventDefault();choosePreset(el.getAttribute('data-correction-preset'));return;}
      if(el.hasAttribute('data-correction-manual')){e.preventDefault();manualMode=!manualMode;if(manualMode)selectedPreset='manual';render(true);return;}
      if(el.hasAttribute('data-correction-step')){e.preventDefault();updateDraft(num(draftGrams)+num(el.getAttribute('data-correction-step')));return;}
      if(el.hasAttribute('data-correction-review-confirm')){e.preventDefault();if(currentScenario)reviewConfirmedScenarioId=currentScenario.id;render(true);return;}
      if(el.hasAttribute('data-correction-apply')){e.preventDefault();applyScenario();return;}
      if(el.hasAttribute('data-correction-undo')){e.preventDefault();undo();return;}
      if(el.hasAttribute('data-open-legacy-ai')){e.preventDefault();openLegacyAi();}
    },false);
    d.addEventListener('change',function(e){if(!e.target)return;if(e.target.id==='workspaceCorrectionProduct'){chooseContributor(e.target.value);return;}if(e.target.id==='workspaceCorrectionGrams')updateDraft(e.target.value);},false);
    d.addEventListener('input',function(e){if(e.target&&e.target.id==='workspaceCorrectionGrams')updateDraft(e.target.value);},false);
    w.addEventListener('navigation-shell:route-changed',function(e){if(e&&e.detail&&e.detail.route==='correction')schedule(true);},false);
    ['needs:computed','needs:changed','analysis-workspace:ready','hei:rendered','diet:assessment-ready','app:ready'].forEach(function(name){w.addEventListener(name,function(){schedule(false);},false);});
    w.addEventListener('ration:changed',function(){scenarioCache={};if(!internalMutation){currentScenario=null;draftGrams=null;selectedPreset='recommended';manualMode=false;reviewConfirmedScenarioId='';}schedule(false);},false);
  }
  function init(){
    if(initialized)return;initialized=true;createPanel();registerPanel();bind();schedule(true);
    w.WorkspaceCorrectionHF11={version:VERSION,refresh:function(){render(true);},getModel:function(){return currentModel||buildModel();},getScenario:function(){if(!currentScenario){currentModel=buildModel();currentScenario=buildScenario(currentModel);}return currentScenario;},getVerdict:function(s){return verdict(s||currentScenario);},_test:{portionCap:portionCap,portionCheck:portionCheck,targetResult:targetResult,verdict:verdict,statusText:statusText,contributorLead:contributorLead,defaultAfter:defaultAfter,gentleAfter:gentleAfter},preview:preview,apply:applyScenario,undo:undo,getLastApplied:function(){return lastApplied;}};
    w.WorkspaceCorrectionHF10=w.WorkspaceCorrectionHF11;w.WorkspaceCorrectionHF9=w.WorkspaceCorrectionHF11;
    dispatch('workspace-correction:ready',{version:VERSION});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
