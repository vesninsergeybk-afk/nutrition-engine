/* Nutrition Calculator v5.3.210 RC2 HF9
 * Dedicated "Improve" workspace: priority -> contributors -> one reviewable
 * quantity scenario -> full recalculation -> apply or undo.
 *
 * The module does not implement a second nutrition or HEI calculation. It reads
 * the canonical analysis view model and delegates before/after calculations to
 * NutritionCalculationCore and HEIRuntimeV2.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf9-correction';
  var initialized=false;
  var refreshTimer=0;
  var selectedPriorityId='';
  var selectedRef='';
  var draftGrams=null;
  var currentModel=null;
  var currentScenario=null;
  var lastApplied=null;
  var internalMutation=false;
  var lastRenderKey='';

  var STATUS_SCORE={critical:120,high:90,medium:62,unavailable:45};
  var HEI_LABELS={
    fruits_total:'Все фрукты',fruits_whole:'Цельные фрукты',vegetables_total:'Все овощи',greens_beans:'Зелень и бобовые',
    grains_whole:'Цельные злаки',dairy:'Молочные продукты',protein_total:'Все белковые продукты',seafood_plant:'Рыба и растительный белок',
    fatty_acids_ratio:'Соотношение жиров',grains_refined:'Рафинированные злаки',sodium_g:'Натрий',added_sugars_pct:'Добавленный сахар',sat_fats_pct:'Насыщённые жиры'
  };
  var HEI_NUTRIENT_EQUIVALENTS={sodium_g:'sodium_mg',added_sugars_pct:'added_sugars_g',sat_fats_pct:'sfa_g'};
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

  function nutrientContributors(key,items){
    var c=core(),out=[],i,item,scaled,value;
    if(!c||typeof c.scaledPerItem!=='function')return out;
    for(i=0;i<items.length;i++){
      item=items[i];if(!item||!(num(item.grams)>0))continue;
      try{scaled=c.scaledPerItem(item)||{};}catch(_){scaled={};}
      value=num(scaled[key]);if(!(value>0))continue;
      out.push({ref:itemRef(item),key:item.key,name:productName(item),grams:num(item.grams),value:value,item:item});
    }
    out.sort(function(a,b){return b.value-a.value;});
    var sum=0;for(i=0;i<out.length;i++)sum+=out[i].value;
    for(i=0;i<out.length;i++)out[i].share=sum>0?out[i].value/sum*100:0;
    return out;
  }

  function heiContribution(intake,key,side){
    if(!intake)return 0;
    if(key==='vegetables_total')return num(intake.vegetables_total)+num(intake.legumes_veg_total);
    if(key==='greens_beans')return num(intake.greens_beans)+num(intake.legumes_greens_beans);
    if(key==='protein_total')return num(intake.protein_excl_legumes)+num(intake.legumes_as_protein);
    if(key==='sodium_g')return num(intake.sodium_mg);
    if(key==='added_sugars_pct')return num(intake.added_sugars_g);
    if(key==='sat_fats_pct')return num(intake.fatty_sfa_g);
    if(key==='fatty_acids_ratio')return side==='negative'?num(intake.fatty_sfa_g):num(intake.fatty_unsat_g);
    return num(intake[key]);
  }

  function heiContributors(key,direction,items){
    var adapter=w.HEI2020InputAdapterV2,out=[],i,item,intake,value,side=(key==='fatty_acids_ratio'&&direction==='reduce')?'negative':'positive';
    if(!adapter||typeof adapter.adapt!=='function')return out;
    for(i=0;i<items.length;i++){
      item=items[i];if(!item||!(num(item.grams)>0))continue;
      try{intake=adapter.adapt([item],w.DB)||null;}catch(_){intake=null;}
      value=heiContribution(intake,key,side);if(!(value>0))continue;
      out.push({ref:itemRef(item),key:item.key,name:productName(item),grams:num(item.grams),value:value,item:item});
    }
    out.sort(function(a,b){return b.value-a.value;});
    var sum=0;for(i=0;i<out.length;i++)sum+=out[i].value;
    for(i=0;i<out.length;i++)out[i].share=sum>0?out[i].value/sum*100:0;
    return out;
  }

  function nutrientPriority(row,items){
    var status=row&&row.status||{},score=STATUS_SCORE[status.code]||0,direction=row.mode==='upper_limit'||(num(row.target)>0&&num(row.actual)>num(row.target))?'reduce':'increase',contributors=nutrientContributors(row.key,items),actionable=status.code!=='unavailable'&&contributors.length>0;
    if(!score)return null;
    return {
      id:'nutrient:'+row.key,type:'nutrient',key:row.key,title:row.title,statusCode:status.code,statusLabel:status.label||'Требует внимания',
      actual:num(row.actual),target:num(row.target),unit:row.unit||'',mode:row.mode||'adequacy',direction:direction,score:score,
      confidence:confidenceLabel(row.quality&&row.quality.label),contributors:contributors,actionable:actionable,
      explanation:status.note||'',source:'rule'
    };
  }

  function heiDirection(row){if(row.key==='fatty_acids_ratio')return 'reduce';return row.group==='moderation'?'reduce':'increase';}
  function heiPriority(row,items){
    var pct=num(row.pct),direction=heiDirection(row),contributors=heiContributors(row.key,direction,items),score=58+clamp(90-pct,0,90)*0.28;
    return {
      id:'hei:'+row.key,type:'hei',key:row.key,title:row.title||HEI_LABELS[row.key]||row.key,statusCode:pct<60?'high':'medium',statusLabel:row.status&&row.status.label||'Есть запас для улучшения',
      actual:pct,target:90,unit:'% собственного максимума',mode:'adequacy',direction:direction,score:score,
      points:num(row.points),maxPoints:num(row.maxPoints),confidence:confidenceLabel(row.confidence),contributors:contributors,
      actionable:contributors.length>0,explanation:row.action||'',source:'rule'
    };
  }

  function buildPriorities(vm,items){
    var out=[],nutrientKeys={},i,row,p;
    if(!vm||!vm.items)return out;
    for(i=0;i<(vm.nutrients||[]).length;i++){
      row=vm.nutrients[i];
      if(['critical','high','medium','unavailable'].indexOf(row.status&&row.status.code)<0)continue;
      if(vm.completion<0.7&&row.key!=='kcal'&&row.status.code!=='critical'&&row.mode!=='upper_limit')continue;
      p=nutrientPriority(row,items);if(p){out.push(p);nutrientKeys[row.key]=1;}
    }
    for(i=0;i<(vm.hei&&vm.hei.rows||[]).length;i++){
      row=vm.hei.rows[i];if(num(row.pct)>=90)continue;
      if(HEI_NUTRIENT_EQUIVALENTS[row.key]&&nutrientKeys[HEI_NUTRIENT_EQUIVALENTS[row.key]])continue;
      p=heiPriority(row,items);if(p)out.push(p);
    }
    out.sort(function(a,b){if(a.actionable!==b.actionable)return a.actionable?-1:1;return b.score-a.score;});
    return out.slice(0,5);
  }

  function defaultAfter(priority,contributor){
    var before=num(contributor&&contributor.grams),fraction=0.2,gap,contribution=num(contributor&&contributor.value);
    if(priority.type==='nutrient'&&contribution>0&&priority.target>0){
      gap=Math.abs(priority.actual-priority.target);
      if(priority.direction==='reduce')fraction=clamp((gap/contribution)*0.8,0.1,0.4);
      else fraction=clamp((gap/contribution)*0.5,0.1,0.5);
    }else if(priority.type==='hei')fraction=priority.actual<60?0.25:0.15;
    if(priority.direction==='reduce')return roundStep(Math.max(5,before*(1-fraction)),5);
    return roundStep(Math.min(5000,before*(1+fraction)),5);
  }

  function priorityCurrentText(p){
    if(p.type==='hei')return fmt(p.points,1)+' из '+fmt(p.maxPoints,0)+' баллов · '+fmt(p.actual,0)+'% максимума';
    return fmtAmount(p.actual,p.unit)+(p.target>0?' при ориентире '+fmtAmount(p.target,p.unit):'');
  }
  function directionText(p){return p.direction==='reduce'?'проверить уменьшение количества':'проверить увеличение количества';}

  function buildModel(){
    var api=analysisApi(),vm=null,items=stateItems(),priorities=[];
    try{vm=api&&api.getViewModel?api.getViewModel():null;}catch(_){vm=null;}
    if(!vm&&core()&&core().snapshot){vm={items:items.length,completion:0,snapshot:core().snapshot(items),nutrients:[],hei:{rows:[],model:{}}};}
    priorities=buildPriorities(vm,items);
    if(!selectedPriorityId||!priorities.some(function(x){return x.id===selectedPriorityId;}))selectedPriorityId=priorities.length?priorities[0].id:'';
    var active=null,i;for(i=0;i<priorities.length;i++)if(priorities[i].id===selectedPriorityId){active=priorities[i];break;}
    if(active){
      if(!selectedRef||!active.contributors.some(function(x){return x.ref===selectedRef;}))selectedRef=active.contributors.length?active.contributors[0].ref:'';
      var contributor=null;for(i=0;i<active.contributors.length;i++)if(active.contributors[i].ref===selectedRef){contributor=active.contributors[i];break;}
      if(contributor&&(draftGrams==null||!isFinite(Number(draftGrams))))draftGrams=defaultAfter(active,contributor);
    }else{selectedRef='';draftGrams=null;currentScenario=null;}
    return {version:VERSION,vm:vm,items:items,priorities:priorities,active:active};
  }

  function scaleComposite(item,before,after){
    var ratio=before>0?after/before:1,i;if(!item||!Array.isArray(item.children))return;
    for(i=0;i<item.children.length;i++){if(item.children[i])item.children[i].grams=Math.max(0,num(item.children[i].grams)*ratio);}
  }
  function draftRation(items,ref,after){
    var cloned=deepClone(items)||[],i,item,before;
    for(i=0;i<cloned.length;i++){
      item=cloned[i];if(itemRef(item)!==ref&&String(item.key||'')!==ref)continue;
      before=num(item.grams);scaleComposite(item,before,after);item.grams=after;break;
    }
    return cloned;
  }
  function requestedEnergy(){var spec=metricSpec('kcal');return num(spec&&spec.target)||undefined;}
  function calculateHei(snapshot){try{return w.HEIRuntimeV2&&typeof w.HEIRuntimeV2.calculateFromSnapshot==='function'?w.HEIRuntimeV2.calculateFromSnapshot(snapshot,requestedEnergy()):null;}catch(_){return null;}}
  function heiComponent(model,key){var c=model&&model.components&&model.components[key]||null,max=num(c&&c.maxPoints,(c&&c.standard&&c.standard.pts)||10),points=num(c&&c.points,model&&model.points&&model.points[key]);return {points:points,maxPoints:max,pct:max>0?clamp(points/max*100,0,100):0};}
  function deviation(key,value){var spec=metricSpec(key),target=num(spec&&spec.target);if(!spec||!(target>0)||spec.mode==='informational')return 0;if(spec.mode==='upper_limit')return Math.max(0,(num(value)-target)/target);return Math.max(0,(target-num(value))/target);}
  function metricChange(before,after,key){var spec=metricSpec(key);return {key:key,title:spec&&spec.title||key,unit:spec&&spec.unit||'',before:num(before&&before.totals&&before.totals[key]),after:num(after&&after.totals&&after.totals[key]),target:num(spec&&spec.target),mode:spec&&spec.mode||'informational'};}
  function targetResult(priority,beforeSnapshot,afterSnapshot,beforeHei,afterHei){
    if(priority.type==='hei'){
      var b=heiComponent(beforeHei,priority.key),a=heiComponent(afterHei,priority.key);
      return {before:b.pct,after:a.pct,unit:'%',beforePoints:b.points,afterPoints:a.points,maxPoints:a.maxPoints,improves:a.pct>b.pct+0.05};
    }
    var before=num(beforeSnapshot.totals&&beforeSnapshot.totals[priority.key]),after=num(afterSnapshot.totals&&afterSnapshot.totals[priority.key]);
    return {before:before,after:after,unit:priority.unit,improves:deviation(priority.key,after)<deviation(priority.key,before)-0.0001};
  }
  function buildTradeoffs(priority,beforeSnapshot,afterSnapshot,beforeHei,afterHei){
    var rows=[],i,key,m,bDev,aDev,delta,target,heiDelta=num(afterHei&&afterHei.total)-num(beforeHei&&beforeHei.total);
    for(i=0;i<TRACKED_METRICS.length;i++){
      key=TRACKED_METRICS[i];if(priority.type==='nutrient'&&key===priority.key)continue;
      m=metricChange(beforeSnapshot,afterSnapshot,key);delta=m.after-m.before;target=m.target||Math.max(Math.abs(m.before),1);
      bDev=deviation(key,m.before);aDev=deviation(key,m.after);
      if(aDev>bDev+0.05||Math.abs(delta)/target>=0.1){
        rows.push({kind:aDev>bDev+0.05?'worse':'change',title:m.title,before:m.before,after:m.after,unit:m.unit,weight:(aDev-bDev)*10+Math.abs(delta)/target});
      }
    }
    if(heiDelta<-1)rows.push({kind:'worse',title:'Итоговый HEI',before:num(beforeHei&&beforeHei.total),after:num(afterHei&&afterHei.total),unit:' баллов',weight:Math.abs(heiDelta)/5+2});
    else if(heiDelta>1)rows.push({kind:'better',title:'Итоговый HEI',before:num(beforeHei&&beforeHei.total),after:num(afterHei&&afterHei.total),unit:' баллов',weight:Math.abs(heiDelta)/5+1});
    rows.sort(function(a,b){return b.weight-a.weight;});return rows.slice(0,5);
  }

  function buildScenario(model){
    var p=model.active,items=model.items,contributor=null,i,after=clamp(num(draftGrams),1,5000),beforeSnapshot,afterSnapshot,beforeHei,afterHei,target,tradeoffs,sourceSnapshot;
    if(!p||!p.actionable||!selectedRef)return null;
    for(i=0;i<p.contributors.length;i++)if(p.contributors[i].ref===selectedRef){contributor=p.contributors[i];break;}
    if(!contributor||Math.abs(after-contributor.grams)<0.01)return null;
    sourceSnapshot=model.vm&&model.vm.snapshot||null;
    beforeSnapshot=sourceSnapshot||core().snapshot(items);
    afterSnapshot=core().snapshot(draftRation(items,selectedRef,after));
    beforeHei=model.vm&&model.vm.hei&&model.vm.hei.model&&own(model.vm.hei.model,'total')?model.vm.hei.model:calculateHei(beforeSnapshot);
    afterHei=calculateHei(afterSnapshot);
    target=targetResult(p,beforeSnapshot,afterSnapshot,beforeHei,afterHei);
    tradeoffs=buildTradeoffs(p,beforeSnapshot,afterSnapshot,beforeHei,afterHei);
    return {
      id:'hf9-'+Date.now(),source:'rule',targetMetric:{type:p.type,key:p.key,title:p.title},
      operations:[{type:'set_grams',productKey:contributor.key,ref:contributor.ref,productName:contributor.name,gramsBefore:contributor.grams,gramsAfter:after}],
      beforeSnapshot:beforeSnapshot,afterSnapshot:afterSnapshot,beforeHei:beforeHei,afterHei:afterHei,
      benefits:target.improves?[{metric:p.key,before:target.before,after:target.after}]:[],tradeoffs:tradeoffs,
      confidence:p.confidence,status:'draft',targetResult:target,priority:p,createdAt:new Date().toISOString()
    };
  }

  function createPanel(){
    var main=byId('mainContent'),anchor=byId('heiPanel'),panel;if(!main||!anchor||byId('workspaceCorrectionPanel'))return;
    panel=d.createElement('section');panel.id='workspaceCorrectionPanel';panel.className='card workspace-correction';panel.hidden=true;panel.setAttribute('data-navshell-original-hidden','1');panel.setAttribute('aria-labelledby','workspaceCorrectionTitle');
    panel.innerHTML=''+
      '<div class="workspace-correction__head"><div><span>Один проверяемый шаг</span><h2 id="workspaceCorrectionTitle">Улучшить рацион</h2><p>Выберите приоритет, проверьте изменение количества одного продукта и посмотрите полный пересчёт до применения.</p></div><button type="button" class="secondary" data-workspace-route="analysis/overview">Вернуться к анализу</button></div>'+
      '<div id="workspaceCorrectionStatus" class="workspace-correction-status" aria-live="polite"></div>'+
      '<section id="workspaceCorrectionPriorities" class="workspace-correction-priorities" aria-labelledby="workspaceCorrectionPrioritiesTitle"><div class="workspace-correction-section-head"><div><span>Шаг 1</span><h3 id="workspaceCorrectionPrioritiesTitle">Что изменить в первую очередь</h3></div><small>до пяти приоритетов</small></div><div id="workspaceCorrectionPriorityList"></div></section>'+
      '<section id="workspaceCorrectionWorkbench" class="workspace-correction-workbench" aria-labelledby="workspaceCorrectionWorkbenchTitle"><div class="workspace-correction-section-head"><div><span>Шаг 2</span><h3 id="workspaceCorrectionWorkbenchTitle">Проверить один вариант</h3></div><small>основной рацион пока не меняется</small></div><div id="workspaceCorrectionEditor"></div><div id="workspaceCorrectionPreview" class="workspace-correction-preview" aria-live="polite"></div></section>'+
      '<section class="workspace-correction-source"><div><strong>Источник сценария: расчётное правило</strong><p>Это не ИИ-рекомендация и не назначение. Система меняет только указанную граммовку, затем заново считает энергию, нутриенты и HEI.</p></div><button type="button" class="secondary" data-open-legacy-ai>Открыть отдельный ИИ-помощник</button></section>'+
      '<details class="workspace-correction-method"><summary>Как устроена проверка</summary><p>Предпросмотр не записывается в рацион. Применение доступно только после полного пересчёта и только если выбранный показатель действительно улучшается. После применения последнее изменение можно отменить.</p></details>';
    main.insertBefore(panel,anchor);
  }
  function registerPanel(){if(!w.NavigationShellV1)return;if(typeof w.NavigationShellV1.registerManaged==='function')w.NavigationShellV1.registerManaged('workspaceCorrectionPanel',true);if(typeof w.NavigationShellV1.refresh==='function')w.NavigationShellV1.refresh();}

  function priorityHtml(p,active){
    return '<button type="button" class="workspace-priority-card is-'+esc(p.statusCode)+(active?' is-active':'')+'" data-correction-priority="'+esc(p.id)+'" aria-pressed="'+(active?'true':'false')+'">'+
      '<span class="workspace-priority-card__status">'+esc(p.statusLabel)+'</span><strong>'+esc(p.title)+'</strong><small>'+esc(priorityCurrentText(p))+'</small><em>'+(p.actionable?esc(directionText(p)):'сначала проверить исходные данные')+'</em></button>';
  }
  function renderStatus(model){
    var host=byId('workspaceCorrectionStatus'),vm=model.vm,html='';if(!host)return;
    if(!vm||!vm.items){html='<div class="is-neutral"><strong>Сначала добавьте продукты</strong><span>Без рациона невозможно выбрать вкладчик и проверить изменение.</span><button type="button" data-workspace-route="ration">Перейти к рациону</button></div>';}
    else if(num(vm.completion)<0.55){html='<div class="is-warning"><strong>Рацион заполнен примерно на '+fmt(num(vm.completion)*100,0)+'%</strong><span>Сначала приблизьте рацион к обычному дневному объёму. Иначе предполагаемые недостатки и сценарии будут преждевременными.</span><button type="button" data-workspace-route="ration">Продолжить заполнение</button></div>';}
    else if(!model.priorities.length){html='<div class="is-ok"><strong>Явных приоритетов для автоматического сценария не найдено</strong><span>Откройте подробный анализ или измените рацион вручную.</span><button type="button" data-workspace-route="analysis/nutrients">Открыть нутриенты</button></div>';}
    else if(lastApplied){
      var current=itemByRef(lastApplied.ref,model.items),canUndo=current&&Math.abs(num(current.grams)-lastApplied.after)<0.01;
      html='<div class="is-applied"><strong>Изменение применено: '+esc(lastApplied.productName)+'</strong><span>'+fmt(lastApplied.before,0)+' → '+fmt(lastApplied.after,0)+' г. Все показатели пересчитаны.</span><button type="button" data-correction-undo '+(canUndo?'':'disabled')+'>Отменить последнее изменение</button>'+(canUndo?'':'<small>Граммовка уже была изменена повторно; автоматический откат отключён.</small>')+'</div>';
    }
    host.innerHTML=html;
  }
  function renderPriorities(model){var host=byId('workspaceCorrectionPriorityList'),html='',i;if(!host)return;for(i=0;i<model.priorities.length;i++)html+=priorityHtml(model.priorities[i],model.priorities[i].id===selectedPriorityId);host.innerHTML=html||'<p class="workspace-correction-empty">Приоритеты появятся после полноценного расчёта рациона.</p>';}

  function contributorOptions(priority){var html='',i,c;for(i=0;i<priority.contributors.length;i++){c=priority.contributors[i];html+='<option value="'+esc(c.ref)+'"'+(c.ref===selectedRef?' selected':'')+'>'+esc(c.name)+' — '+fmt(c.grams,0)+' г, '+fmt(c.share,0)+'% вклада</option>';}return html;}
  function renderEditor(model){
    var host=byId('workspaceCorrectionEditor'),p=model.active,contributor=null,i;if(!host)return;
    if(!p){host.innerHTML='<div class="workspace-correction-empty"><strong>Выберите приоритет</strong><p>После выбора появятся продукты-вкладчики и поле для проверяемой граммовки.</p></div>';return;}
    if(!p.actionable){host.innerHTML='<div class="workspace-correction-empty"><strong>Автоматический вариант пока недоступен</strong><p>Для показателя недостаточно продуктовых данных. Исправьте карточки продуктов или измените рацион вручную.</p><button type="button" data-workspace-route="analysis/nutrients">Проверить данные</button></div>';return;}
    for(i=0;i<p.contributors.length;i++)if(p.contributors[i].ref===selectedRef){contributor=p.contributors[i];break;}
    if(!contributor){host.innerHTML='';return;}
    host.innerHTML=''+
      '<article class="workspace-correction-target"><span>'+esc(p.statusLabel)+'</span><h4>'+esc(p.title)+'</h4><p>'+esc(priorityCurrentText(p))+'. '+esc(p.explanation||'Проверьте вкладчики и результат полного пересчёта.')+'</p><small>Достоверность: '+esc(p.confidence)+'</small></article>'+
      '<div class="workspace-correction-controls"><label>Продукт-вкладчик<select id="workspaceCorrectionProduct">'+contributorOptions(p)+'</select></label><label>Проверяемое количество, г<div class="workspace-correction-grams"><button type="button" data-correction-step="-10" aria-label="Уменьшить на 10 граммов">−10</button><input id="workspaceCorrectionGrams" type="number" min="1" max="5000" step="1" value="'+esc(draftGrams)+'"><button type="button" data-correction-step="10" aria-label="Увеличить на 10 граммов">+10</button></div></label><div class="workspace-correction-controls__summary"><span>Сейчас</span><strong>'+fmt(contributor.grams,0)+' г</strong><small>'+fmt(contributor.share,0)+'% вклада в выбранный показатель</small></div><button type="button" data-correction-preview>Полностью пересчитать вариант</button></div>';
  }

  function targetPreviewHtml(s){
    var t=s.targetResult,p=s.priority,before,after;
    if(p.type==='hei'){before=fmt(t.beforePoints,1)+'/'+fmt(t.maxPoints,0)+' ('+fmt(t.before,0)+'%)';after=fmt(t.afterPoints,1)+'/'+fmt(t.maxPoints,0)+' ('+fmt(t.after,0)+'%)';}
    else{before=fmtAmount(t.before,t.unit);after=fmtAmount(t.after,t.unit);}
    return '<article class="workspace-correction-result '+(t.improves?'is-better':'is-not-better')+'"><span>Выбранный показатель</span><strong>'+esc(p.title)+'</strong><div><b>'+esc(before)+'</b><i aria-hidden="true">→</i><b>'+esc(after)+'</b></div><small>'+(t.improves?'Показатель меняется в нужную сторону.':'Этот вариант не улучшает выбранный показатель.')+'</small></article>';
  }
  function summaryMetric(snapshot,key){var spec=metricSpec(key),value=num(snapshot&&snapshot.totals&&snapshot.totals[key]);return {title:spec&&spec.title||key,value:value,unit:spec&&spec.unit||''};}
  function summaryHtml(s){
    var keys=['kcal','protein_g','fat_g','carbs_g'],html='<div class="workspace-correction-summary">',i,b,a,delta;
    for(i=0;i<keys.length;i++){b=summaryMetric(s.beforeSnapshot,keys[i]);a=summaryMetric(s.afterSnapshot,keys[i]);delta=a.value-b.value;html+='<article><span>'+esc(a.title)+'</span><strong>'+esc(fmtAmount(a.value,a.unit))+'</strong><small>'+esc(signed(delta,a.unit==='ккал'?0:1))+' '+esc(a.unit)+'</small></article>';}
    b=num(s.beforeHei&&s.beforeHei.total);a=num(s.afterHei&&s.afterHei.total);html+='<article><span>HEI</span><strong>'+fmt(a,1)+'/100</strong><small>'+signed(a-b,1)+' балла</small></article></div>';return html;
  }
  function tradeoffHtml(rows){var html='<section class="workspace-correction-tradeoffs"><h4>Что ещё изменится</h4>';if(!rows.length)return html+'<p class="is-ok">Существенных побочных изменений по основным показателям в этом варианте не обнаружено.</p></section>';html+='<div>';rows.forEach(function(r){html+='<article class="is-'+esc(r.kind)+'"><strong>'+esc(r.title)+'</strong><span>'+esc(fmtAmount(r.before,r.unit))+' → '+esc(fmtAmount(r.after,r.unit))+'</span><small>'+(r.kind==='worse'?'может потребовать внимания':r.kind==='better'?'сопутствующее улучшение':'заметное изменение')+'</small></article>';});return html+'</div></section>';}
  function renderPreview(){
    var host=byId('workspaceCorrectionPreview'),s=currentScenario,hasWorse=false;if(!host)return;
    if(!s){host.innerHTML='<div class="workspace-correction-preview__empty"><strong>Предпросмотр ещё не рассчитан</strong><p>Измените граммовку и запустите полный пересчёт. Основной рацион останется без изменений.</p></div>';return;}
    hasWorse=(s.tradeoffs||[]).some(function(row){return row&&row.kind==='worse';});
    host.innerHTML='<div class="workspace-correction-section-head"><div><span>Шаг 3</span><h3>Результат до применения</h3></div><small>'+esc(s.operations[0].productName)+': '+fmt(s.operations[0].gramsBefore,0)+' → '+fmt(s.operations[0].gramsAfter,0)+' г</small></div>'+targetPreviewHtml(s)+summaryHtml(s)+tradeoffHtml(s.tradeoffs)+'<div class="workspace-correction-decision"><div><strong>'+(s.targetResult.improves?'Выбранный показатель улучшится':'Нужна другая граммовка')+'</strong><p>'+(s.targetResult.improves?(hasWorse?'Перед применением проверьте ухудшения других показателей. Изменение можно будет отменить.':'После применения рацион и все расчёты обновятся. Последнее изменение можно будет отменить.'):'Подберите другое количество: применение неактивно, пока выбранный показатель не улучшается.')+'</p></div><button type="button" data-correction-apply '+(s.targetResult.improves?'':'disabled')+'>Применить изменение</button></div>';
  }

  function render(force){
    if(!force&&currentRoute()!=='correction')return;
    currentModel=buildModel();
    var key=[currentModel.items.length,currentModel.priorities.map(function(p){return p.id+':'+Math.round(p.actual*100)+':'+p.actionable;}).join('|'),selectedPriorityId,selectedRef,draftGrams,currentScenario&&currentScenario.id,lastApplied&&lastApplied.after].join('~');
    if(!force&&key===lastRenderKey)return;lastRenderKey=key;
    renderStatus(currentModel);renderPriorities(currentModel);renderEditor(currentModel);renderPreview();
  }
  function schedule(force){w.clearTimeout(refreshTimer);refreshTimer=w.setTimeout(function(){render(!!force);},80);}

  function choosePriority(id){selectedPriorityId=id;selectedRef='';draftGrams=null;currentScenario=null;render(true);}
  function chooseContributor(ref){selectedRef=ref;draftGrams=null;currentScenario=null;render(true);}
  function updateDraft(value){draftGrams=clamp(num(value),1,5000);currentScenario=null;var input=byId('workspaceCorrectionGrams');if(input)input.value=String(draftGrams);renderPreview();}
  function preview(){currentModel=buildModel();currentScenario=buildScenario(currentModel);render(true);dispatch('workspace-correction:preview',{version:VERSION,scenario:currentScenario});}
  function applyScenario(){
    var s=currentScenario,op,current;if(!s||!s.targetResult.improves||!w.State||typeof w.State.update!=='function')return;
    op=s.operations[0];current=itemByRef(op.ref,stateItems());
    if(!current||Math.abs(num(current.grams)-op.gramsBefore)>0.01){currentScenario=null;render(true);return;}
    internalMutation=true;w.State.update(op.ref,op.gramsAfter);internalMutation=false;s.status='applied';lastApplied={ref:op.ref,key:op.productKey,productName:op.productName,before:op.gramsBefore,after:op.gramsAfter,scenarioId:s.id,appliedAt:new Date().toISOString()};currentScenario=null;draftGrams=null;
    dispatch('workspace-correction:applied',{version:VERSION,change:lastApplied});w.setTimeout(function(){render(true);},180);
  }
  function undo(){
    var a=lastApplied,current;if(!a||!w.State||typeof w.State.update!=='function')return;current=itemByRef(a.ref,stateItems());if(!current||Math.abs(num(current.grams)-a.after)>0.01){render(true);return;}
    internalMutation=true;w.State.update(a.ref,a.before);internalMutation=false;dispatch('workspace-correction:reverted',{version:VERSION,change:a});lastApplied=null;currentScenario=null;draftGrams=null;w.setTimeout(function(){render(true);},180);
  }
  function openLegacyAi(){
    if(w.NavigationShellV1&&typeof w.NavigationShellV1.setMode==='function')w.NavigationShellV1.setMode('long');
    w.setTimeout(function(){var el=byId('geminiAiSection');if(el){try{el.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){el.scrollIntoView(true);}}},80);
  }

  function bind(){
    d.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('[data-correction-priority],[data-correction-step],[data-correction-preview],[data-correction-apply],[data-correction-undo],[data-open-legacy-ai]'):null;if(!el)return;
      if(el.hasAttribute('data-correction-priority')){e.preventDefault();choosePriority(el.getAttribute('data-correction-priority'));return;}
      if(el.hasAttribute('data-correction-step')){e.preventDefault();updateDraft(num(draftGrams)+num(el.getAttribute('data-correction-step')));return;}
      if(el.hasAttribute('data-correction-preview')){e.preventDefault();preview();return;}
      if(el.hasAttribute('data-correction-apply')){e.preventDefault();applyScenario();return;}
      if(el.hasAttribute('data-correction-undo')){e.preventDefault();undo();return;}
      if(el.hasAttribute('data-open-legacy-ai')){e.preventDefault();openLegacyAi();}
    },false);
    d.addEventListener('change',function(e){if(!e.target)return;if(e.target.id==='workspaceCorrectionProduct'){chooseContributor(e.target.value);return;}if(e.target.id==='workspaceCorrectionGrams'){updateDraft(e.target.value);}},false);
    d.addEventListener('input',function(e){if(e.target&&e.target.id==='workspaceCorrectionGrams'){draftGrams=clamp(num(e.target.value),1,5000);currentScenario=null;renderPreview();}},false);
    w.addEventListener('navigation-shell:route-changed',function(e){if(e&&e.detail&&e.detail.route==='correction')schedule(true);},false);
    ['needs:computed','needs:changed','analysis-workspace:ready','hei:rendered','diet:assessment-ready','app:ready'].forEach(function(name){w.addEventListener(name,function(){schedule(false);},false);});
    w.addEventListener('ration:changed',function(){if(!internalMutation){currentScenario=null;draftGrams=null;}schedule(false);},false);
  }

  function init(){
    if(initialized)return;initialized=true;createPanel();registerPanel();bind();schedule(true);
    w.WorkspaceCorrectionHF9={
      version:VERSION,refresh:function(){render(true);},getModel:function(){return currentModel||buildModel();},getScenario:function(){return currentScenario;},
      preview:preview,apply:applyScenario,undo:undo,getLastApplied:function(){return lastApplied;}
    };
    dispatch('workspace-correction:ready',{version:VERSION});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
