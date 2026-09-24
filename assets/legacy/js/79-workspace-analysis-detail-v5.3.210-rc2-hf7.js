/* Nutrition Calculator v5.3.210 RC2 HF7
 * Purpose-built nutrient and HEI workspace views.
 * The module reads the canonical calculation snapshot, nutrient metric registry,
 * HEI input adapter and HEI model. It does not clone legacy result blocks or
 * maintain a second calculation implementation.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf7-analysis-detail';
  var initialized=false;
  var refreshTimer=0;
  var nutrientFilter='attention';
  var nutrientGroup='all';
  var heiFilter='attention';
  var heiGroup='all';
  var nutrientPage=0;
  var heiPage=0;
  var selectedNutrientKey='';
  var selectedHeiKey='';
  var lastViewModel=null;
  var lastNutrientRenderKey='';
  var lastHeiRenderKey='';
  var rendering=false;
  var pendingForce=false;

  var NUTRIENT_GROUPS={
    basic:{label:'Основные показатели',keys:['kcal','protein_g','fat_g','carbs_g','fiber_g']},
    limits:{label:'Ограничиваемые и справочные',keys:['sfa_g','sodium_mg','salt_g','added_sugars_g','sugars_g','unsat_g']},
    vitamins:{label:'Витамины и холин',keys:['vitamin_a_mcg','vitamin_c_mg','vitamin_d_mcg','vitamin_e_mg','vitamin_k_mcg','vitamin_b1_mg','vitamin_b2_mg','vitamin_b3_mg','vitamin_b5_mg','vitamin_b6_mg','vitamin_b9_mcg','vitamin_b12_mcg','choline_mg']},
    minerals:{label:'Минералы',keys:['calcium_mg','iron_mg','magnesium_mg','zinc_mg','potassium_mg','phosphorus_mg','iodine_mcg','selenium_mcg','copper_mg','manganese_mg']}
  };
  var NUTRIENT_QUALITY_KEYS={kcal:'kcal',protein_g:'protein',fat_g:'fat',carbs_g:'carbs',fiber_g:'fiber',sodium_mg:'sodium_mg',sfa_g:'sfa'};
  var HEI_LABELS={
    fruits_total:'Все фрукты',fruits_whole:'Цельные фрукты',vegetables_total:'Все овощи',greens_beans:'Зелень и бобовые',
    grains_whole:'Цельные злаки',dairy:'Молочные продукты',protein_total:'Все белковые продукты',seafood_plant:'Рыба и растительный белок',
    fatty_acids_ratio:'Соотношение жиров',grains_refined:'Рафинированные злаки',sodium_g:'Натрий',added_sugars_pct:'Добавленный сахар',sat_fats_pct:'Насыщённые жиры'
  };
  var HEI_ORDER=['fruits_total','fruits_whole','vegetables_total','greens_beans','grains_whole','dairy','protein_total','seafood_plant','fatty_acids_ratio','grains_refined','sodium_g','added_sugars_pct','sat_fats_pct'];
  var HEI_GROUP_LABELS={adequacy:'Основные группы рациона',moderation:'Ограничиваемые компоненты',ratio:'Качество жиров'};
  var GRADE_LABELS={A:'очень высокое соответствие',B:'высокое соответствие',C:'среднее соответствие',D:'низкое соответствие',F:'очень низкое соответствие'};

  function byId(id){return d.getElementById(id);}
  function own(obj,key){return !!obj&&Object.prototype.hasOwnProperty.call(obj,key);}
  function text(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim():'';}
  function num(value,fallback){var n=Number(value);return isFinite(n)?n:(fallback==null?0:fallback);}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function fmt(value,digits){var n=Number(value);if(!isFinite(n))return '—';return n.toLocaleString('ru-RU',{maximumFractionDigits:digits==null?1:digits,minimumFractionDigits:0});}
  function fmtAmount(value,unit){var n=Number(value),digits=1;if(!isFinite(n))return '—';if(unit==='ккал'||Math.abs(n)>=100)digits=0;else if(Math.abs(n)<1&&n!==0)digits=2;return fmt(n,digits)+(unit?' '+unit:'');}
  function plural(count,one,few,many){var n=Math.abs(count)%100,n1=n%10;if(n>10&&n<20)return many;if(n1>1&&n1<5)return few;if(n1===1)return one;return many;}
  function workspace(){try{return !!(w.NavigationShellV1&&w.NavigationShellV1.getState&&w.NavigationShellV1.getState().mode==='workspace');}catch(_){return false;}}
  function currentRoute(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'';}catch(_){return '';}}
  function stateItems(){try{return w.State&&typeof w.State.get==='function'?w.State.get().filter(function(item){return item&&num(item.grams)>0;}):[];}catch(_){return [];}}
  function core(){return w.NutritionCalculationCore||w.NutritionCalculationCoreV53155||null;}
  function metricRegistry(){return w.NutritionMetricRegistryV53155||null;}
  function confidenceRu(value){value=String(value||'').toUpperCase();return value==='HIGH'?'высокая':value==='MEDIUM'?'средняя':value==='LOW'?'ограниченная':'не определена';}
  function sourceQualityLabel(value){var s=String(value&&value.label||'').replace(/\s+/g,' ').trim();if(/proxy|модельн/i.test(s))return 'часть значений рассчитана приближённо';if(s)return s.toLowerCase();return confidenceRu(value&&value.tier);}
  function cleanTitle(value){return String(value||'').replace(/\s*\(чем меньше, тем лучше\)\s*/i,'').trim();}
  function groupForNutrient(key){var group;for(group in NUTRIENT_GROUPS){if(NUTRIENT_GROUPS[group].keys.indexOf(key)>=0)return group;}return 'other';}
  function productName(item){var p=null;try{p=w.DB&&w.DB.byKey&&w.DB.byKey.get?w.DB.byKey.get(item.key):null;}catch(_){}return item.name_ru||item.name||(p&&(p.name_ru||p.name))||item.key||'Продукт';}
  function buildItemCaches(items,includeHei){var calcCore=core(),adapter=w.HEI2020InputAdapterV2,db=w.DB,out=[],i,item,scaled,intake;for(i=0;i<items.length;i++){item=items[i];scaled={};intake=null;try{scaled=calcCore&&calcCore.scaledPerItem?calcCore.scaledPerItem(item)||{}:{};}catch(_){}if(includeHei&&adapter&&typeof adapter.adapt==='function'){try{intake=adapter.adapt([item],db)||null;}catch(_){}}out.push({item:item,scaled:scaled,hei:intake});}return out;}
  function aggregateContributors(caches,key){
    var map={},covered=0,total=caches.length,i,item,scaled,value,name,token,row,arr=[];
    for(i=0;i<caches.length;i++){
      item=caches[i].item;scaled=caches[i].scaled||{};
      if(own(scaled,key))covered++;
      value=num(scaled[key],0);if(!(value>0))continue;
      name=productName(item);token=String(item.key||name)+'|'+name;
      row=map[token]||(map[token]={name:name,grams:0,value:0});row.grams+=num(item.grams);row.value+=value;
    }
    for(token in map)if(own(map,token))arr.push(map[token]);
    arr.sort(function(a,b){return b.value-a.value;});
    var sum=0;for(i=0;i<arr.length;i++)sum+=arr[i].value;
    for(i=0;i<arr.length;i++)arr[i].share=sum>0?arr[i].value/sum*100:0;
    return {items:arr,covered:covered,total:total,sum:sum};
  }
  function nutrientQuality(snapshot,key,coverage){
    var q=snapshot&&snapshot.dataQuality&&snapshot.dataQuality.nutrients||{},entry=q[NUTRIENT_QUALITY_KEYS[key]||key]||null;
    if(entry)return {tier:String(entry.confidence_tier||''),label:confidenceRu(entry.confidence_tier),missing:num(entry.missing_products),assumed:num(entry.assumed_zero_products)};
    if(!coverage.total)return {tier:'',label:'нет рациона',missing:0,assumed:0};
    if(coverage.covered===coverage.total)return {tier:'',label:'значение есть у всех продуктов',missing:0,assumed:0};
    if(coverage.covered>0)return {tier:'LOW',label:'частичное покрытие',missing:coverage.total-coverage.covered,assumed:0};
    return {tier:'LOW',label:'нет данных в карточках продуктов',missing:coverage.total,assumed:0};
  }
  function assessmentFlags(){var a=w.__lastDietAssessment||{};return {upper:a.upperLimitFlags||[],guideline:a.guidelineFlags||[],limitations:a.limitations||a.notEvaluable||[]};}
  function assessmentNutrientKey(flag){
    var id=String(flag&&flag.nutrient||''),raw=String(flag&&flag.id||''),linked=String(flag&&flag.linkedHeiComponent||''),mapped={saturated_fat_general_limit:'sfa_g',added_sugars_general_limit:'added_sugars_g',sodium_absolute_limit:'sodium_mg',sat_fats_pct:'sfa_g',added_sugars_pct:'added_sugars_g',sodium_g:'sodium_mg'};
    if(id)return id;if(mapped[raw])return mapped[raw];if(mapped[linked])return mapped[linked];id=raw.replace(/^ul_/,'').replace(/_uncertain$/,'');try{if(id&&core()&&core().getMetricSpec&&core().getMetricSpec(id))return id;}catch(_){}return '';
  }
  function findNutrientFlag(flags,key){var i,f,id;for(i=0;i<flags.upper.length;i++){f=flags.upper[i];id=assessmentNutrientKey(f);if(id===key)return {kind:'critical',flag:f};}for(i=0;i<flags.guideline.length;i++){f=flags.guideline[i];id=assessmentNutrientKey(f);if(id===key)return {kind:'high',flag:f};}return null;}
  function nutrientStatus(row,completion,flag){
    var ratio=row.target>0?row.actual/row.target:NaN;
    if(!row.itemCount)return {code:'empty',label:'Нет рациона',note:'Добавьте продукты, чтобы получить оценку.'};
    if(row.coverage.covered===0)return {code:'unavailable',label:'Нет данных',note:'В карточках продуктов нет значения для этого показателя.'};
    if(flag)return {code:flag.kind,label:flag.kind==='critical'?'Выше верхнего уровня':'Выше ориентира',note:'Показатель отмечен отдельной проверкой ограничений.'};
    if(row.mode==='informational'||!(row.target>0))return {code:'info',label:'Справочный показатель',note:'Целевой минимум для этого значения не задан.'};
    if(row.mode==='upper_limit'){
      if(ratio>1)return {code:'critical',label:'Выше верхнего предела',note:'Сначала проверьте основные продукты-вкладчики.'};
      if(ratio>=.8)return {code:'medium',label:'Близко к верхнему пределу',note:'Запас до предела небольшой.'};
      return {code:'ok',label:'Ниже верхнего предела',note:'Превышение по текущему расчёту не подтверждено.'};
    }
    if(completion<.7&&row.key!=='kcal')return {code:'provisional',label:'Предварительно ниже',note:'Рацион заполнен не полностью; отдельный недостаток пока не ранжируется.'};
    if(ratio<.7)return {code:'high',label:'Ниже ориентира',note:'Проверьте продукты-вкладчики и полноту рациона.'};
    if(ratio<.9)return {code:'medium',label:'Немного ниже ориентира',note:'До ориентира остаётся небольшая разница.'};
    return {code:'ok',label:'Ориентир достигнут',note:'Превышение ориентира само по себе не считается проблемой.'};
  }
  function buildNutrientRows(snapshot,caches,completion,flags){
    var reg=metricRegistry(),calcCore=core(),labels=reg&&reg.labels||{},keys=[],seen={},group,arr,i,key,spec,coverage,quality,flag,row,rows=[];
    for(group in NUTRIENT_GROUPS){arr=NUTRIENT_GROUPS[group].keys;for(i=0;i<arr.length;i++)if(!seen[arr[i]]){seen[arr[i]]=1;keys.push(arr[i]);}}
    for(key in labels)if(own(labels,key)&&!seen[key]){seen[key]=1;keys.push(key);}
    for(i=0;i<keys.length;i++){
      key=keys[i];spec=calcCore&&calcCore.getMetricSpec?calcCore.getMetricSpec(key):null;if(!spec)continue;
      coverage=aggregateContributors(caches,key);quality=nutrientQuality(snapshot,key,coverage);flag=findNutrientFlag(flags,key);
      row={key:key,title:cleanTitle(spec.title||labels[key]||key),unit:spec.unit||'',actual:num(snapshot.totals&&snapshot.totals[key]),target:num(spec.target),mode:spec.mode||'informational',group:groupForNutrient(key),coverage:coverage,quality:quality,itemCount:caches.length};
      row.ratio=row.target>0?row.actual/row.target:NaN;row.status=nutrientStatus(row,completion,flag);row.progress=row.mode==='informational'||!(row.target>0)?0:clamp(row.ratio*100,0,120);row.flag=flag&&flag.flag||null;rows.push(row);
    }
    return rows;
  }
  function attentionNutrient(row){return ['critical','high','medium','unavailable'].indexOf(row.status.code)>=0;}
  function summarizeNutrients(rows){var out={attention:0,ok:0,incomplete:0,informational:0};rows.forEach(function(row){if(attentionNutrient(row))out.attention++;if(row.status.code==='ok')out.ok++;if(row.coverage.covered<row.coverage.total)out.incomplete++;if(row.status.code==='info')out.informational++;});return out;}

  function cleanHeiMeasure(value){return String(value||'—').replace(/\s+/g,' ').replace(/^ориентир\s+HEI\s*:\s*/i,'').replace(/^фактическое значение\s*:\s*/i,'').trim();}
  function compactHeiAction(value){
    var s=String(value||'').replace(/\s+/g,' ').trim(),match,tail,verb;if(!s)return '';
    s=s.replace(/\s*Это индексный ориентир.*$/i,'').replace(/\s*до максимального балла HEI.*$/i,'').trim();
    if(s.indexOf('Ориентир HEI достигнут')===0)return 'Ориентир достигнут.';
    s=s.replace(/≈\s*/g,'около ').replace(/([А-Яа-яЁё])\/([А-Яа-яЁё])/g,'$1 или $2');
    match=s.match(/^([+-])\s*([\d.,]+)\s+(.+?)\s+до \+1 балла;\s*(.*)$/i);
    if(match){
      verb=match[1]==='-'?'сократить':'добавить';tail=match[4].replace(/^[+-]\s*[\d.,]+\s+.+?\s+до максимума\.\s*/i,'').replace(/^практический шаг:\s*/i,'Практический вариант — ').replace(/^Практически:\s*/i,'Что можно сделать: ');
      s='До следующего балла нужно '+verb+' примерно '+match[2]+' '+match[3]+'.'+(tail?' '+tail:'');
    }else s=s.replace(/практический шаг:\s*/ig,'Практический вариант — ').replace(/Практически:\s*/ig,'Что можно сделать: ');
    if(s.length>240)s=s.slice(0,237).replace(/\s+\S*$/,'')+'…';
    return s;
  }
  function heiGroupFor(component){var kind=component&&component.standard&&component.standard.kind||'';if(kind==='moderation')return 'moderation';if(kind==='adequacy_ratio')return 'ratio';return 'adequacy';}
  function heiStatus(pct){if(pct>=90)return {code:'ok',label:'Высокий балл'};if(pct>=60)return {code:'medium',label:'Есть запас для улучшения'};return {code:'high',label:'Требует внимания'};}
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
  function aggregateHeiContributors(caches,key){
    var mapPos={},mapNeg={},i,item,intake,name,token,pos,neg,row,positive=[],negative=[];
    for(i=0;i<caches.length;i++){
      item=caches[i].item;intake=caches[i].hei;if(!intake)continue;
      name=productName(item);token=String(item.key||name)+'|'+name;pos=heiContribution(intake,key,'positive');neg=key==='fatty_acids_ratio'?heiContribution(intake,key,'negative'):0;
      if(pos>0){row=mapPos[token]||(mapPos[token]={name:name,grams:0,value:0});row.grams+=num(item.grams);row.value+=pos;}
      if(neg>0){row=mapNeg[token]||(mapNeg[token]={name:name,grams:0,value:0});row.grams+=num(item.grams);row.value+=neg;}
    }
    function finish(map,out){var token,sum=0,j;for(token in map)if(own(map,token)){out.push(map[token]);sum+=map[token].value;}out.sort(function(a,b){return b.value-a.value;});for(j=0;j<out.length;j++)out[j].share=sum>0?out[j].value/sum*100:0;}
    finish(mapPos,positive);finish(mapNeg,negative);return {positive:positive,negative:negative};
  }
  function buildHeiRows(caches){
    var model=w.__lastHEIModel||{},sourceRows=w.__lastHEIRows||[],rowMap={},components=model.components||{},assessment=w.__lastDietAssessment||{},out=[],i,key,c,src,pct,confidence;
    for(i=0;i<sourceRows.length;i++)rowMap[sourceRows[i].key]=sourceRows[i];
    for(i=0;i<HEI_ORDER.length;i++){
      key=HEI_ORDER[i];c=components[key]||null;src=rowMap[key]||{};if(!c&&!own(model.points||{},key))continue;
      pct=clamp(num(c&&c.scorePct,(num(c&&c.maxPoints)>0?num(c.points)/num(c.maxPoints)*100:0)),0,100);confidence=assessment.componentConfidence&&assessment.componentConfidence[key]||assessment.confidence&&assessment.confidence.hei||'';
      out.push({key:key,title:src.label||HEI_LABELS[key]||key,actual:cleanHeiMeasure(src.value),norm:cleanHeiMeasure(src.norm),action:compactHeiAction(src.delta),points:num(c&&c.points,model.points&&model.points[key]),maxPoints:num(c&&c.maxPoints,(c&&c.standard&&c.standard.pts)||10),pct:pct,group:heiGroupFor(c),status:heiStatus(pct),confidence:confidenceRu(confidence),contributors:aggregateHeiContributors(caches,key)});
    }
    return out;
  }
  function buildGuardrails(){
    var flags=assessmentFlags(),rows=[],i,f;
    for(i=0;i<flags.upper.length;i++){f=flags.upper[i];rows.push({code:'critical',title:f.title||'Превышение верхнего уровня',body:fmtAmount(f.value,f.unit)+' при верхнем уровне '+fmtAmount(f.threshold,f.unit)+'.',nutrient:assessmentNutrientKey(f)});}
    for(i=0;i<flags.guideline.length;i++){f=flags.guideline[i];rows.push({code:'high',title:f.title||'Показатель выше ориентира',body:fmtAmount(f.value,f.unit)+' при ориентире '+fmtAmount(f.threshold,f.unit)+'.',nutrient:assessmentNutrientKey(f)});}
    for(i=0;i<flags.limitations.length;i++){f=flags.limitations[i];rows.push({code:'unavailable',title:f.title||'Показатель не оценён',body:'Данных недостаточно; отсутствие оценки не считается нулевым значением.',nutrient:assessmentNutrientKey(f)});}
    return rows;
  }
  function summarizeHei(rows,guardrails){var attention=0,ok=0;rows.forEach(function(row){if(row.pct<90)attention++;else ok++;});return {attention:attention,ok:ok,guardrails:guardrails.length};}
  function buildViewModel(){
    var calcCore=core(),items=stateItems(),snapshot=calcCore&&calcCore.snapshot?calcCore.snapshot(items):{totals:{},nutrientRation:items,sourceQuality:null,dataQuality:null},nutrientItems=snapshot.nutrientRation||items,foodItems=snapshot.foodPatternRation||items,nutrientCaches=buildItemCaches(nutrientItems,false),foodCaches=buildItemCaches(foodItems,true),kcal=num(snapshot.totals&&snapshot.totals.kcal),kcalSpec=calcCore&&calcCore.getMetricSpec?calcCore.getMetricSpec('kcal'):null,target=num(kcalSpec&&kcalSpec.target),completion=target>0?kcal/target:0,flags=assessmentFlags(),nutrients=buildNutrientRows(snapshot,nutrientCaches,completion,flags),guardrails=buildGuardrails(),heiRows=buildHeiRows(foodCaches);
    return {version:VERSION,items:items.length,snapshot:snapshot,completion:completion,nutrients:nutrients,nutrientSummary:summarizeNutrients(nutrients),hei:{model:w.__lastHEIModel||{},rows:heiRows,guardrails:guardrails,summary:summarizeHei(heiRows,guardrails)},sourceQuality:snapshot.sourceQuality||{}};
  }

  function createPanels(){
    var main=byId('mainContent'),anchor=byId('heiPanel');if(!main||!anchor)return;
    if(!byId('workspaceNutrientsPanel')){
      var nutrients=d.createElement('section');nutrients.id='workspaceNutrientsPanel';nutrients.className='card workspace-analysis-detail workspace-nutrients-panel';nutrients.hidden=true;nutrients.setAttribute('data-navshell-original-hidden','1');nutrients.setAttribute('aria-labelledby','workspaceNutrientsTitle');
      nutrients.innerHTML=''+
        '<div class="workspace-analysis-detail__head"><div><span>Текущий рацион</span><h2 id="workspaceNutrientsTitle">Показатели и продукты-вкладчики</h2><p>Для каждого показателя приведены фактическое значение, ориентир и продукты с наибольшим вкладом.</p></div><button type="button" class="secondary" data-workspace-route="ration">Изменить рацион</button></div>'+
        '<div class="workspace-analysis-summary" aria-live="polite"><article><span>Требуют внимания</span><strong id="workspaceNutrientAttentionCount">—</strong><small>подтверждённые приоритеты</small></article><article><span>Ориентир достигнут</span><strong id="workspaceNutrientOkCount">—</strong><small>или ниже верхнего предела</small></article><article><span>Неполные данные</span><strong id="workspaceNutrientIncompleteCount">—</strong><small>расчёт не по всем продуктам</small></article></div>'+
        '<div class="workspace-analysis-guidance" id="workspaceNutrientGuidance"></div>'+
        '<div class="workspace-analysis-toolbar"><div class="workspace-analysis-filters" role="group" aria-label="Фильтр статуса нутриентов"><button type="button" class="is-active" data-nutrient-filter="attention" aria-pressed="true">Требуют внимания</button><button type="button" data-nutrient-filter="all" aria-pressed="false">Все</button><button type="button" data-nutrient-filter="incomplete" aria-pressed="false">Неполные данные</button></div><div class="workspace-analysis-filters workspace-analysis-filters--groups" role="group" aria-label="Группа нутриентов"><button type="button" class="is-active" data-nutrient-group="all" aria-pressed="true">Все группы</button><button type="button" data-nutrient-group="basic" aria-pressed="false">Основные</button><button type="button" data-nutrient-group="vitamins" aria-pressed="false">Витамины</button><button type="button" data-nutrient-group="minerals" aria-pressed="false">Минералы</button><button type="button" data-nutrient-group="limits" aria-pressed="false">Ограничиваемые</button></div></div>'+
        '<div class="workspace-analysis-list" id="workspaceNutrientList"></div>'+
        '<div class="workspace-analysis-quality" id="workspaceNutrientQuality"></div>'+
        '<div class="workspace-analysis-actions"><button type="button" data-workspace-route="analysis/hei">Открыть HEI</button><button type="button" class="secondary" data-workspace-route="correction">Перейти к улучшению</button></div>';
      main.insertBefore(nutrients,anchor);
    }
    if(!byId('workspaceHeiPanel')){
      var hei=d.createElement('section');hei.id='workspaceHeiPanel';hei.className='card workspace-analysis-detail workspace-hei-panel';hei.hidden=true;hei.setAttribute('data-navshell-original-hidden','1');hei.setAttribute('aria-labelledby','workspaceHeiTitle');
      hei.innerHTML=''+
        '<div class="workspace-analysis-detail__head"><div><span>HEI-2020</span><h2 id="workspaceHeiTitle">Качество структуры рациона</h2><p>Общий балл показывает структуру питания. Отдельные верхние уровни и ограничения проверяются независимо.</p></div><button type="button" class="secondary" data-workspace-route="ration">Изменить рацион</button></div>'+
        '<div class="workspace-hei-hero" aria-live="polite"><div><span>Итоговый HEI</span><strong id="workspaceHeiTotal">—</strong><small id="workspaceHeiGrade">нет расчёта</small></div><div class="workspace-hei-hero__bar" aria-hidden="true"><i id="workspaceHeiTotalBar"></i></div><p id="workspaceHeiConclusion">Добавьте продукты, чтобы рассчитать HEI.</p></div>'+
        '<div class="workspace-analysis-summary"><article><span>Требуют внимания</span><strong id="workspaceHeiAttentionCount">—</strong><small>компоненты ниже 90% балла</small></article><article><span>Высокий балл</span><strong id="workspaceHeiOkCount">—</strong><small>компоненты от 90%</small></article><article><span>Отдельные проверки</span><strong id="workspaceHeiGuardrailCount">—</strong><small>ограничения и нехватка данных</small></article></div>'+
        '<section class="workspace-guardrails" aria-labelledby="workspaceGuardrailsTitle"><div class="workspace-analysis-section-head"><div><span>Отдельно от общего индекса</span><h3 id="workspaceGuardrailsTitle">Ограничения и достоверность</h3></div></div><div id="workspaceGuardrailList"></div></section>'+
        '<div class="workspace-analysis-toolbar"><div class="workspace-analysis-filters" role="group" aria-label="Фильтр компонентов HEI"><button type="button" class="is-active" data-hei-filter="attention" aria-pressed="true">Требуют внимания</button><button type="button" data-hei-filter="all" aria-pressed="false">Все компоненты</button></div><div class="workspace-analysis-filters workspace-analysis-filters--groups" role="group" aria-label="Тип компонентов HEI"><button type="button" class="is-active" data-hei-group="all" aria-pressed="true">Все типы</button><button type="button" data-hei-group="adequacy" aria-pressed="false">Основные группы</button><button type="button" data-hei-group="moderation" aria-pressed="false">Ограничения</button><button type="button" data-hei-group="ratio" aria-pressed="false">Качество жиров</button></div></div>'+
        '<div class="workspace-analysis-list" id="workspaceHeiComponentList"></div>'+
        '<div class="workspace-analysis-quality" id="workspaceHeiQuality"></div>'+
        '<div class="workspace-analysis-actions"><button type="button" data-workspace-route="correction">Перейти к улучшению</button><button type="button" class="secondary" data-workspace-route="report">Открыть отчёт</button></div>';
      main.insertBefore(hei,anchor);
    }
  }
  function registerPanels(){if(!w.NavigationShellV1)return;if(typeof w.NavigationShellV1.registerManaged==='function'){w.NavigationShellV1.registerManaged('workspaceNutrientsPanel',true);w.NavigationShellV1.registerManaged('workspaceHeiPanel',true);}if(typeof w.NavigationShellV1.refresh==='function')w.NavigationShellV1.refresh();}

  function contributorHtml(contributors,unit,emptyText){
    var items=contributors.items||contributors,html='',i,item;
    if(!items.length)return '<p class="workspace-contributors__empty">'+esc(emptyText||'Продукты с рассчитанным вкладом не найдены.')+'</p>';
    for(i=0;i<Math.min(4,items.length);i++){item=items[i];html+='<div class="workspace-contributor"><strong>'+esc(item.name)+'</strong><span>'+fmt(item.grams,0)+' г · '+fmt(item.share,0)+'% вклада'+(unit&&item.value>0?' · '+esc(fmtAmount(item.value,unit)):'')+'</span></div>';}
    return html;
  }
  function nutrientRowHtml(row){
    var target=row.mode==='informational'||!(row.target>0)?'целевой ориентир не задан':(row.mode==='upper_limit'?'верхний предел '+fmtAmount(row.target,row.unit):'ориентир '+fmtAmount(row.target,row.unit));
    var coverage=row.coverage.total?(row.coverage.covered===row.coverage.total?'данные по всем продуктам':'данные по '+row.coverage.covered+' из '+row.coverage.total+' '+plural(row.coverage.total,'продукта','продуктов','продуктов')):'нет продуктов';
    return '<article class="workspace-analysis-row is-'+esc(row.status.code)+'" id="workspaceNutrientRow-'+esc(row.key)+'" data-analysis-key="'+esc(row.key)+'">'+
      '<div class="workspace-analysis-row__top"><div><span class="workspace-analysis-row__group">'+esc(NUTRIENT_GROUPS[row.group]?NUTRIENT_GROUPS[row.group].label:'Прочее')+'</span><h4>'+esc(row.title)+'</h4></div><span class="workspace-status">'+esc(row.status.label)+'</span></div>'+
      '<div class="workspace-analysis-row__values"><div><span>Фактическое значение</span><strong>'+esc(fmtAmount(row.actual,row.unit))+'</strong></div><div><span>Ориентир</span><strong>'+esc(target)+'</strong></div></div>'+
      (row.mode!=='informational'&&row.target>0?'<div class="workspace-analysis-progress" aria-label="'+esc(row.status.label)+'"><i style="width:'+fmt(clamp(row.progress,0,100),1)+'%"></i><b style="left:'+fmt(clamp(row.progress,0,100),1)+'%"></b></div>':'')+
      '<p class="workspace-analysis-row__note">'+esc(row.status.note)+'</p>'+
      '<details class="workspace-contributors" data-contributor-key="'+esc(row.key)+'"><summary><span>Основные вкладчики</span><small>'+esc(coverage)+'</small></summary><div class="workspace-contributors__body">'+contributorHtml(row.coverage,row.unit,row.coverage.covered===0?'В карточках текущих продуктов нет данных для этого показателя.':'Продукты с положительным вкладом не найдены.')+'<p class="workspace-contributors__quality">Достоверность: '+esc(row.quality.label)+'.</p></div></details>'+
      '</article>';
  }
  function nutrientVisible(row){if(nutrientGroup!=='all'&&row.group!==nutrientGroup)return false;if(nutrientFilter==='attention')return attentionNutrient(row);if(nutrientFilter==='incomplete')return row.coverage.covered<row.coverage.total;return true;}
  function nutrientGroupNavigator(vm){var html='<div class="workspace-analysis-group-picker"><strong>Выберите группу нутриентов</strong><p>Полный перечень разделён на смысловые группы, чтобы на экране не появлялась длинная лента из десятков карточек. Главные отклонения по всем группам остаются в фильтре «Требуют внимания».</p><div>';['basic','vitamins','minerals','limits'].forEach(function(key){var count=0;vm.nutrients.forEach(function(row){if(row.group===key)count++;});html+='<button type="button" data-nutrient-select-group="'+key+'"><span>'+esc(NUTRIENT_GROUPS[key].label)+'</span><small>'+count+' '+plural(count,'показатель','показателя','показателей')+'</small></button>';});return html+'</div></div>';}
  function pageSize(){return w.innerWidth<=680?2:8;}
  function paginate(rows,page,selectedKey){var size=pageSize(),pages=Math.max(1,Math.ceil(rows.length/size)),index=-1,i;if(selectedKey){for(i=0;i<rows.length;i++)if(rows[i].key===selectedKey){index=i;break;}if(index>=0)page=Math.floor(index/size);}page=clamp(page,0,pages-1);return {rows:rows.slice(page*size,page*size+size),page:page,pages:pages,total:rows.length,start:rows.length?page*size+1:0,end:Math.min(rows.length,(page+1)*size)};}
  function pagerHtml(kind,paged){if(paged.pages<=1)return '';var attr=kind==='nutrient'?'data-nutrient-page':'data-hei-page';return '<nav class="workspace-analysis-pager" aria-label="Страницы результатов"><button type="button" '+attr+'="prev"'+(paged.page===0?' disabled':'')+'>Предыдущие</button><span>'+paged.start+'–'+paged.end+' из '+paged.total+'</span><button type="button" '+attr+'="next"'+(paged.page>=paged.pages-1?' disabled':'')+'>Следующие</button></nav>';}
  function renderNutrients(vm){
    var summary=vm.nutrientSummary,host=byId('workspaceNutrientList'),guidance=byId('workspaceNutrientGuidance'),quality=byId('workspaceNutrientQuality'),visible=[],groups={},open={},i,row,group,html='';
    if(byId('workspaceNutrientAttentionCount'))byId('workspaceNutrientAttentionCount').textContent=vm.items?summary.attention:'—';
    if(byId('workspaceNutrientOkCount'))byId('workspaceNutrientOkCount').textContent=vm.items?summary.ok:'—';
    if(byId('workspaceNutrientIncompleteCount'))byId('workspaceNutrientIncompleteCount').textContent=vm.items?summary.incomplete:'—';
    if(guidance){if(!vm.items)guidance.innerHTML='<strong>Рацион пока пуст.</strong><span>Добавьте продукты, и здесь появятся значения, ориентиры и вкладчики.</span>';else if(vm.completion<.7)guidance.innerHTML='<strong>Рацион заполнен примерно на '+Math.round(vm.completion*100)+'% от ориентира по энергии.</strong><span>Недостатки отдельных витаминов и минералов пока считаются предварительными и не выводятся в список главных приоритетов.</span>';else guidance.innerHTML='<strong>Расчёт выполнен по текущему рациону.</strong><span>Ориентир потребления не является верхним пределом; достижение значения выше RDA или AI само по себе не отмечается как проблема.</span>';}
    if(!host)return;
    Array.prototype.forEach.call(host.querySelectorAll('details[open][data-contributor-key]'),function(el){open[el.getAttribute('data-contributor-key')]=1;});
    if(vm.items&&nutrientFilter==='all'&&nutrientGroup==='all'){host.innerHTML=nutrientGroupNavigator(vm);if(quality){var q0=vm.sourceQuality||{},incomplete0=summary.incomplete;quality.innerHTML='<strong>Качество исходных карточек: '+esc(sourceQualityLabel(q0))+'</strong><span>'+(incomplete0?incomplete0+' '+plural(incomplete0,'показатель рассчитан','показателя рассчитаны','показателей рассчитаны')+' не по всем продуктам. Это отмечено в строках и не подменяется нулём.':'Для показанных нутриентов существенных пробелов покрытия не обнаружено.')+'</span>';}updatePressed('[data-nutrient-filter]',nutrientFilter,'data-nutrient-filter');updatePressed('[data-nutrient-group]',nutrientGroup,'data-nutrient-group');return;}
    for(i=0;i<vm.nutrients.length;i++)if(nutrientVisible(vm.nutrients[i]))visible.push(vm.nutrients[i]);
    var paged=paginate(visible,nutrientPage,selectedNutrientKey);nutrientPage=paged.page;selectedNutrientKey='';
    if(!vm.items){host.innerHTML='<div class="workspace-analysis-empty"><strong>Добавьте продукты в рацион</strong><p>Подробный анализ появится после первого расчёта.</p><button type="button" data-workspace-route="ration">Перейти к рациону</button></div>';}
    else if(!visible.length){host.innerHTML='<div class="workspace-analysis-empty"><strong>По выбранному фильтру ничего не найдено</strong><p>Измените фильтр статуса или группу нутриентов.</p><button type="button" data-reset-nutrient-filters>Показать все нутриенты</button></div>';}
    else{
      if(nutrientGroup==='all'&&nutrientFilter!=='all'){
        var combinedTitle=nutrientFilter==='incomplete'?'Показатели с неполными данными':'Главные отклонения';
        html='<section class="workspace-analysis-group workspace-analysis-group--combined"><div class="workspace-analysis-section-head"><div><span>Выбранный фильтр</span><h3>'+combinedTitle+'</h3></div><small>'+paged.rows.length+' '+plural(paged.rows.length,'показатель','показателя','показателей')+'</small></div><div class="workspace-analysis-group__rows">';paged.rows.forEach(function(r){html+=nutrientRowHtml(r);});html+='</div></section>';
      }else{
        for(i=0;i<paged.rows.length;i++){row=paged.rows[i];group=row.group;if(!groups[group])groups[group]=[];groups[group].push(row);}
        ['basic','limits','vitamins','minerals','other'].forEach(function(groupKey){var rows=groups[groupKey];if(!rows||!rows.length)return;html+='<section class="workspace-analysis-group"><div class="workspace-analysis-section-head"><div><span>Группа</span><h3>'+esc(NUTRIENT_GROUPS[groupKey]?NUTRIENT_GROUPS[groupKey].label:'Прочее')+'</h3></div><small>'+rows.length+' '+plural(rows.length,'показатель','показателя','показателей')+'</small></div><div class="workspace-analysis-group__rows">';rows.forEach(function(r){html+=nutrientRowHtml(r);});html+='</div></section>';});
      }
      host.innerHTML=html+pagerHtml('nutrient',paged);
      Array.prototype.forEach.call(host.querySelectorAll('details[data-contributor-key]'),function(el){if(open[el.getAttribute('data-contributor-key')])el.open=true;});
    }
    if(quality){if(!vm.items)quality.innerHTML='<strong>Качество исходных карточек: нет рациона</strong><span>Оценка покрытия появится после добавления продуктов.</span>';else{var q=vm.sourceQuality||{},incomplete=summary.incomplete;quality.innerHTML='<strong>Качество исходных карточек: '+esc(sourceQualityLabel(q))+'</strong><span>'+(incomplete?incomplete+' '+plural(incomplete,'показатель рассчитан','показателя рассчитаны','показателей рассчитаны')+' не по всем продуктам. Это отмечено в строках и не подменяется нулём.':'Для показанных нутриентов существенных пробелов покрытия не обнаружено.')+'</span>';}}
    updatePressed('[data-nutrient-filter]',nutrientFilter,'data-nutrient-filter');updatePressed('[data-nutrient-group]',nutrientGroup,'data-nutrient-group');
  }

  function heiContributorHtml(row){
    if(row.key==='fatty_acids_ratio'){
      return '<div class="workspace-contributor-columns"><div><strong>Ненасыщенные жиры</strong>'+contributorHtml(row.contributors.positive,'г','Вклад ненасыщенных жиров не рассчитан.')+'</div><div><strong>Насыщенные жиры</strong>'+contributorHtml(row.contributors.negative,'г','Вклад насыщенных жиров не рассчитан.')+'</div></div>';
    }
    var empty=(row.group==='moderation'&&row.status.code==='ok')?'Вклад не обнаружен; это соответствует текущему высокому баллу.':'В текущем рационе нет продуктов, которые дали вклад в этот компонент.';
    return contributorHtml(row.contributors.positive,'',empty);
  }
  function heiRowHtml(row){
    return '<article class="workspace-analysis-row workspace-hei-row is-'+esc(row.status.code)+'" id="workspaceHeiRow-'+esc(row.key)+'" data-analysis-key="'+esc(row.key)+'">'+
      '<div class="workspace-analysis-row__top"><div><span class="workspace-analysis-row__group">'+esc(HEI_GROUP_LABELS[row.group]||'Компонент HEI')+'</span><h4>'+esc(row.title)+'</h4></div><span class="workspace-status">'+esc(row.status.label)+'</span></div>'+
      '<div class="workspace-hei-scoreline"><strong>'+fmt(row.points,1)+' из '+fmt(row.maxPoints,0)+' баллов</strong><span>'+fmt(row.pct,0)+'% собственного максимума</span></div>'+
      '<div class="workspace-analysis-progress" aria-label="'+esc(row.status.label)+'"><i style="width:'+fmt(row.pct,1)+'%"></i><b style="left:'+fmt(row.pct,1)+'%"></b></div>'+
      '<div class="workspace-analysis-row__values"><div><span>Фактическое значение</span><strong>'+esc(row.actual)+'</strong></div><div><span>Ориентир HEI</span><strong>'+esc(row.norm)+'</strong></div></div>'+
      (row.action?'<p class="workspace-analysis-row__note">'+esc(row.action)+'</p>':'')+
      '<details class="workspace-contributors" data-hei-contributor-key="'+esc(row.key)+'"><summary><span>Основные вкладчики</span><small>достоверность: '+esc(row.confidence)+'</small></summary><div class="workspace-contributors__body">'+heiContributorHtml(row)+'</div></details>'+
      '</article>';
  }
  function heiVisible(row){if(heiGroup!=='all'&&row.group!==heiGroup)return false;if(heiFilter==='attention')return row.pct<90;return true;}
  function renderGuardrails(vm){
    var host=byId('workspaceGuardrailList'),rows=vm.hei.guardrails,html='';if(!host)return;
    if(!vm.items){host.innerHTML='<div class="workspace-guardrail is-neutral"><strong>Проверка появится после добавления продуктов</strong><p>HEI и отдельные ограничения рассчитываются по одному и тому же рациону.</p></div>';return;}
    if(!rows.length){host.innerHTML='<div class="workspace-guardrail is-ok"><strong>Подтверждённых превышений применимых верхних уровней не найдено</strong><p>Общий HEI всё равно следует разбирать по компонентам ниже.</p></div>';return;}
    rows.forEach(function(row){html+='<article class="workspace-guardrail is-'+esc(row.code)+'"><div><strong>'+esc(row.title)+'</strong><p>'+esc(row.body)+'</p></div>'+(row.nutrient?'<button type="button" data-analysis-open-nutrient="'+esc(row.nutrient)+'">Открыть нутриент</button>':'')+'</article>';});host.innerHTML=html;
  }
  function renderHei(vm){
    var model=vm.hei.model||{},summary=vm.hei.summary,host=byId('workspaceHeiComponentList'),visible=[],groups={},open={},html='',i,row,quality=byId('workspaceHeiQuality'),total=vm.items?num(model.total,NaN):NaN,grade=vm.items?(model.grade||''):'';
    if(byId('workspaceHeiTotal'))byId('workspaceHeiTotal').textContent=isFinite(total)?fmt(total,0)+'/100':'—';
    if(byId('workspaceHeiGrade'))byId('workspaceHeiGrade').textContent=grade?('Категория '+grade+' — '+(GRADE_LABELS[grade]||'оценка структуры')):'нет расчёта';
    if(byId('workspaceHeiTotalBar'))byId('workspaceHeiTotalBar').style.width=(isFinite(total)?clamp(total,0,100):0)+'%';
    if(byId('workspaceHeiConclusion'))byId('workspaceHeiConclusion').textContent=!vm.items?'Добавьте продукты, чтобы рассчитать HEI.':(vm.completion<.7?'Рацион заполнен не полностью. Балл уже отражает введённую структуру, но вывод остаётся предварительным.':'Индекс рассчитан по фактической энергии рациона. Причины балла показаны в компонентах ниже.');
    if(byId('workspaceHeiAttentionCount'))byId('workspaceHeiAttentionCount').textContent=vm.items?summary.attention:'—';
    if(byId('workspaceHeiOkCount'))byId('workspaceHeiOkCount').textContent=vm.items?summary.ok:'—';
    if(byId('workspaceHeiGuardrailCount'))byId('workspaceHeiGuardrailCount').textContent=vm.items?summary.guardrails:'—';
    renderGuardrails(vm);
    if(!host)return;
    Array.prototype.forEach.call(host.querySelectorAll('details[open][data-hei-contributor-key]'),function(el){open[el.getAttribute('data-hei-contributor-key')]=1;});
    for(i=0;i<vm.hei.rows.length;i++)if(heiVisible(vm.hei.rows[i]))visible.push(vm.hei.rows[i]);
    var paged=paginate(visible,heiPage,selectedHeiKey);heiPage=paged.page;selectedHeiKey='';
    if(!vm.items||!vm.hei.rows.length){host.innerHTML='<div class="workspace-analysis-empty"><strong>HEI пока не рассчитан</strong><p>Добавьте продукты в рацион и вернитесь к анализу.</p><button type="button" data-workspace-route="ration">Перейти к рациону</button></div>';}
    else if(!visible.length){host.innerHTML='<div class="workspace-analysis-empty"><strong>Все компоненты в выбранной группе имеют высокий балл</strong><p>Переключитесь на «Все компоненты», чтобы увидеть полный расчёт.</p><button type="button" data-reset-hei-filters>Показать все компоненты</button></div>';}
    else{
      for(i=0;i<paged.rows.length;i++){row=paged.rows[i];if(!groups[row.group])groups[row.group]=[];groups[row.group].push(row);}
      ['adequacy','moderation','ratio'].forEach(function(groupKey){var rows=groups[groupKey];if(!rows||!rows.length)return;html+='<section class="workspace-analysis-group"><div class="workspace-analysis-section-head"><div><span>Тип компонента</span><h3>'+esc(HEI_GROUP_LABELS[groupKey])+'</h3></div><small>'+rows.length+' '+plural(rows.length,'компонент','компонента','компонентов')+'</small></div><div class="workspace-analysis-group__rows">';rows.forEach(function(r){html+=heiRowHtml(r);});html+='</div></section>';});host.innerHTML=html+pagerHtml('hei',paged);
      Array.prototype.forEach.call(host.querySelectorAll('details[data-hei-contributor-key]'),function(el){if(open[el.getAttribute('data-hei-contributor-key')])el.open=true;});
    }
    if(quality){if(!vm.items)quality.innerHTML='<strong>Достоверность HEI: нет расчёта</strong><span>Оценка достоверности появится после добавления продуктов.</span>';else{var a=w.__lastDietAssessment||{},limitations=(a.limitations||a.notEvaluable||[]).length;quality.innerHTML='<strong>Достоверность HEI: '+esc(confidenceRu(a.confidence&&a.confidence.hei))+'</strong><span>'+(limitations?limitations+' '+plural(limitations,'ограничение данных не позволяет','ограничения данных не позволяют','ограничений данных не позволяют')+' считать соответствующие показатели нулевыми.':'Существенных ограничений данных для компонентов HEI не отмечено.')+'</span>';}}
    updatePressed('[data-hei-filter]',heiFilter,'data-hei-filter');updatePressed('[data-hei-group]',heiGroup,'data-hei-group');
  }
  function updatePressed(selector,value,attr){Array.prototype.forEach.call(d.querySelectorAll(selector),function(button){var active=button.getAttribute(attr)===value;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active?'true':'false');});}
  function detailRouteActive(){var route=currentRoute();return route==='analysis/nutrients'||route==='analysis/hei';}
  function renderKey(vm){var parts=[nutrientFilter,nutrientGroup,heiFilter,heiGroup,vm.items,Math.round(vm.completion*1000)];vm.nutrients.forEach(function(row){parts.push(row.key,Math.round(row.actual*1000),row.status.code,row.coverage.covered,row.coverage.total);});vm.hei.rows.forEach(function(row){parts.push(row.key,Math.round(row.points*1000),row.status.code);});parts.push(vm.hei.guardrails.length);return parts.join('|');}
  function refresh(force){if(rendering)return;if(!force&&!detailRouteActive())return;try{rendering=true;lastViewModel=buildViewModel();var key=renderKey(lastViewModel),route=currentRoute();if(route==='analysis/nutrients'&&(force||key!==lastNutrientRenderKey)){renderNutrients(lastViewModel);lastNutrientRenderKey=key;}if(route==='analysis/hei'&&(force||key!==lastHeiRenderKey)){renderHei(lastViewModel);lastHeiRenderKey=key;}}catch(error){try{console.error('HF7 analysis workspace refresh failed',error);}catch(_){}}finally{rendering=false;}}
  function schedule(force){pendingForce=pendingForce||!!force;w.clearTimeout(refreshTimer);refreshTimer=w.setTimeout(function(){var forced=pendingForce;pendingForce=false;refresh(forced);},70);}
  function openNutrient(key){nutrientFilter='all';nutrientGroup=groupForNutrient(key);nutrientPage=0;selectedNutrientKey=key;if(w.NavigationShellV1&&typeof w.NavigationShellV1.navigate==='function')w.NavigationShellV1.navigate('analysis/nutrients','workspaceNutrientRow-'+key);w.setTimeout(function(){refresh(true);},40);}

  function bind(){
    d.addEventListener('click',function(e){
      var button=e.target&&e.target.closest?e.target.closest('[data-nutrient-filter],[data-nutrient-group],[data-hei-filter],[data-hei-group],[data-reset-nutrient-filters],[data-reset-hei-filters],[data-analysis-open-nutrient],[data-nutrient-select-group],[data-nutrient-page],[data-hei-page]'):null;if(!button)return;
      if(button.hasAttribute('data-nutrient-filter')){nutrientFilter=button.getAttribute('data-nutrient-filter');nutrientPage=0;}
      else if(button.hasAttribute('data-nutrient-group')){nutrientGroup=button.getAttribute('data-nutrient-group');nutrientPage=0;}
      else if(button.hasAttribute('data-nutrient-select-group')){nutrientFilter='all';nutrientGroup=button.getAttribute('data-nutrient-select-group');nutrientPage=0;}
      else if(button.hasAttribute('data-nutrient-page')){nutrientPage=Math.max(0,nutrientPage+(button.getAttribute('data-nutrient-page')==='next'?1:-1));}
      else if(button.hasAttribute('data-hei-filter')){heiFilter=button.getAttribute('data-hei-filter');heiPage=0;}
      else if(button.hasAttribute('data-hei-group')){heiGroup=button.getAttribute('data-hei-group');heiPage=0;}
      else if(button.hasAttribute('data-hei-page')){heiPage=Math.max(0,heiPage+(button.getAttribute('data-hei-page')==='next'?1:-1));}
      else if(button.hasAttribute('data-reset-nutrient-filters')){nutrientFilter='all';nutrientGroup='all';nutrientPage=0;}
      else if(button.hasAttribute('data-reset-hei-filters')){heiFilter='all';heiGroup='all';heiPage=0;}
      else if(button.hasAttribute('data-analysis-open-nutrient')){e.preventDefault();openNutrient(button.getAttribute('data-analysis-open-nutrient'));return;}
      e.preventDefault();w.setTimeout(function(){refresh(true);},0);
    },false);
    ['ration:changed','needs:computed','needs:changed','hei:rendered','diet:assessment-ready','app:ready','navigation-shell:mode-changed'].forEach(function(name){w.addEventListener(name,schedule,false);});
    w.addEventListener('navigation-shell:route-changed',function(event){var detail=event&&event.detail||{},target=String(detail.targetId||'');if(detail.route==='analysis/nutrients'&&target.indexOf('workspaceNutrientRow-')===0){var key=target.replace('workspaceNutrientRow-','');nutrientFilter='all';nutrientGroup=groupForNutrient(key);nutrientPage=0;selectedNutrientKey=key;refresh(true);return;}if(detail.route==='analysis/hei'&&target.indexOf('workspaceHeiRow-')===0){heiFilter='all';heiGroup='all';heiPage=0;selectedHeiKey=target.replace('workspaceHeiRow-','');refresh(true);return;}schedule(false);},false);
    d.addEventListener('input',function(e){if(e.target&&e.target.id&&String(e.target.id).indexOf('normInput-')===0)schedule();},true);
    d.addEventListener('change',schedule,true);
  }
  function init(){
    if(initialized)return;initialized=true;createPanels();registerPanels();bind();schedule();
    w.NutritionAnalysisWorkspaceHF7={version:VERSION,refresh:refresh,getViewModel:function(){return lastViewModel||buildViewModel();},openNutrient:openNutrient,getFilters:function(){return {nutrientFilter:nutrientFilter,nutrientGroup:nutrientGroup,heiFilter:heiFilter,heiGroup:heiGroup,nutrientPage:nutrientPage,heiPage:heiPage};}};
    try{w.dispatchEvent(new CustomEvent('analysis-workspace:ready',{detail:{version:VERSION}}));}catch(_){}
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
