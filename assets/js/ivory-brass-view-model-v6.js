/* NutritionUIViewModel v1 adapter for the v6 presentation layer.
 * Reads canonical runtime APIs and existing calculation snapshots; never calculates norms.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta2-ui-view-model-v1.1';
  var timer=0,lastModel=null;
  function byId(id){return d.getElementById(id);}
  function text(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim():'';}
  function num(v,f){var n=Number(v);return isFinite(n)?n:(f==null?NaN:f);}
  function inputNumber(id){var el=byId(id);return num(el&&String(el.value||'').replace(',','.'),NaN);}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function stateItems(){try{return w.State&&typeof w.State.get==='function'?(w.State.get()||[]).filter(function(x){return x&&num(x.grams,0)>0;}):[];}catch(_){return [];}}
  function parseKpi(){
    var raw=text(byId('rationKpiStrip')),out={count:stateItems().length,kcal:NaN,protein:NaN,fat:NaN,carbs:NaN};
    var m=raw.match(/(\d+)\s*поз[^·]*·\s*([\d\s.,]+)\s*ккал\s*·\s*Б\s*([\d\s.,]+)\s*·\s*Ж\s*([\d\s.,]+)\s*·\s*У\s*([\d\s.,]+)/i);
    function read(v){return Number(String(v||'').replace(/\s/g,'').replace(',','.'));}
    if(m){out.kcal=read(m[2]);out.protein=read(m[3]);out.fat=read(m[4]);out.carbs=read(m[5]);}
    out.count=stateItems().length;
    return out;
  }
  function metric(value,target,unit,label){
    var ratio=isFinite(value)&&isFinite(target)&&target>0?value/target:NaN;
    return {label:label,value:value,target:target,unit:unit,ratio:ratio,percent:isFinite(ratio)?Math.round(ratio*100):null,status:!isFinite(ratio)?'unknown':ratio<.7?'low':ratio>1.25?'high':'ok'};
  }
  function issueRows(){
    var nodes=d.querySelectorAll('#workspaceOverviewIssueList .workspace-issue'),out=[],i,title,body,kind;
    for(i=0;i<nodes.length&&out.length<6;i++){
      title=text(nodes[i].querySelector('strong'));body=text(nodes[i].querySelector('p'));kind=(String(nodes[i].className).match(/is-([\w-]+)/)||[])[1]||'neutral';
      if(title)out.push({title:title,body:body,kind:kind});
    }
    if(out.length)return out;
    var a=w.__lastDietAssessment||{},f;
    (a.upperLimitFlags||[]).slice(0,3).forEach(function(x){out.push({title:x.title||'Превышение верхнего уровня',body:'Проверьте источники и подробный расчёт.',kind:'critical'});});
    (a.guidelineFlags||[]).slice(0,3).forEach(function(x){out.push({title:x.title||'Показатель выше ориентира',body:'Откройте подробный анализ.',kind:'high'});});
    return out.slice(0,6);
  }
  function detailViewModel(){try{return w.NutritionAnalysisWorkspaceHF7&&typeof w.NutritionAnalysisWorkspaceHF7.getViewModel==='function'?w.NutritionAnalysisWorkspaceHF7.getViewModel():null;}catch(_){return null;}}
  function classifyNutrientState(row){
    var status=row&&row.status||{},code=String(status.code||'').toLowerCase(),label=String(status.label||'').toLowerCase();
    if(code==='ok'||code==='target')return 'target';
    if(code==='critical'||/верхн(?:его|ий) (?:уров|предел)|превыш/.test(label))return 'above';
    if(/ниже|недостат|дефицит/.test(label)||code==='provisional'||code==='deficit'||code==='low')return 'below';
    if(code==='medium'||code==='attention'||code==='high'||/близко|проверк|внимани|выше ориентира/.test(label))return 'review';
    return 'unknown';
  }
  function groupSummary(detail){
    var order=['basic','vitamins','minerals','limits','other'];
    var labels={basic:'Основные показатели',vitamins:'Витамины',minerals:'Минералы',limits:'Ограничиваемые',other:'Прочие показатели'};
    var groups={},out=[];
    order.forEach(function(k){groups[k]={key:k,label:labels[k],target:0,below:0,review:0,above:0,unknown:0,total:0,evaluated:0,attention:0,targetPercent:null};});
    if(detail&&Array.isArray(detail.nutrients))detail.nutrients.forEach(function(row){
      var g=groups[row.group]||groups.other,state=classifyNutrientState(row);g.total++;g[state]++;
    });
    order.forEach(function(k){
      var g=groups[k];
      if(!g.total)return;
      g.evaluated=g.target+g.below+g.review+g.above;
      g.attention=g.below+g.review+g.above;
      g.targetPercent=g.evaluated?Math.round(g.target/g.evaluated*100):null;
      out.push(g);
    });
    return out;
  }
  function route(){try{return w.NavigationShellV1&&w.NavigationShellV1.getState?w.NavigationShellV1.getState().route:'ration';}catch(_){return 'ration';}}
  function mediaState(){var voice=d.querySelector('[data-ration-entry-method="voice"]');return voice&&voice.getAttribute('data-media-state')||'idle';}
  function build(){
    var k=parseKpi(),detail=detailViewModel(),heiModel=(detail&&detail.hei&&detail.hei.model)||w.__lastHEIModel||{},assessment=w.__lastDietAssessment||{},profile=w.__lastDietAnalysisProfile||{};
    var profileReady=!!w.__lastNeedsProfileApplied;
    var kcalTarget=profileReady?inputNumber('normInput-kcal'):NaN,proteinTarget=profileReady?inputNumber('normInput-protein_g'):NaN,fatTarget=profileReady?inputNumber('normInput-fat_g'):NaN,carbsTarget=profileReady?inputNumber('normInput-carbs_g'):NaN,waterTarget=profileReady?inputNumber('normInput-water_ml'):NaN;
    var waterActual=num((detail&&detail.snapshot&&detail.snapshot.totals&&detail.snapshot.totals.water_ml),NaN);
    var metrics=[metric(k.kcal,kcalTarget,'ккал','Энергия'),metric(k.protein,proteinTarget,'г','Белки'),metric(k.fat,fatTarget,'г','Жиры'),metric(k.carbs,carbsTarget,'г','Углеводы'),metric(waterActual,waterTarget,'мл','Вода')];
    var hei=num(heiModel.total,NaN),structure=num(profile.dailyStructure,NaN),confidence=assessment.confidence&&assessment.confidence.overall||'';
    var score=isFinite(hei)?clamp(hei/10,0,10):(isFinite(structure)?clamp(structure/10,0,10):NaN);
    var items=stateItems();
    return {
      contract:'NutritionUIViewModel.v1',version:VERSION,generatedAt:new Date().toISOString(),
      meta:{theme:d.documentElement.getAttribute('data-theme')||'modern',layout:d.documentElement.getAttribute('data-workspace-layout')||'sections',route:route()},
      profile:{ready:profileReady,restoring:d.documentElement.getAttribute('data-profile-restoring')==='1',saved:!!(w.NutritionProfilePersistenceV1&&w.NutritionProfilePersistenceV1.hasStoredProfile&&w.NutritionProfilePersistenceV1.hasStoredProfile()),name:(byId('needs_person_name')&&byId('needs_person_name').value)||'',confidence:confidence},
      ration:{count:k.count,items:items,kcal:k.kcal,empty:k.count===0},
      metrics:metrics,
      analysis:{score:score,hei:hei,heiGrade:heiModel.grade||'',structure:structure,issues:issueRows(),limitations:(assessment.limitations||assessment.notEvaluable||[]).length,nutrientGroups:groupSummary(detail),nutrientGroupOverview:{contract:'NutrientGroupOverview.v1',source:'NutritionAnalysisWorkspaceHF7',purpose:'navigation-summary'}},
      gemini:(function(){var h=null;try{h=w.NutritionGeminiRationImport&&w.NutritionGeminiRationImport.getServiceHealth?w.NutritionGeminiRationImport.getServiceHealth():null;}catch(_){}return {configured:h&&h.checked?h.configured:null,reachable:h&&h.checked?h.reachable:null,mediaState:mediaState(),busy:!!(d.querySelector('[data-ration-entry-method][aria-busy="true"]'))};})(),
      capabilities:{photo:!!byId('geminiRationChoosePhotos'),voice:!!byId('geminiRationRecordAudio'),audio:!!byId('geminiRationChooseAudio'),report:!!byId('workspaceReportPanel')}
    };
  }
  function publish(force){
    var model=build(),key=JSON.stringify({r:model.meta.route,l:model.meta.layout,t:model.meta.theme,c:model.ration.count,m:model.metrics.map(function(x){return [x.value,x.target];}),s:model.analysis.score,i:model.analysis.issues.map(function(x){return x.title;}),ng:model.analysis.nutrientGroups.map(function(x){return [x.key,x.target,x.below,x.review,x.above,x.unknown,x.total];}),g:model.gemini.mediaState});
    if(!force&&lastModel&&lastModel.__key===key)return lastModel;
    Object.defineProperty(model,'__key',{value:key,enumerable:false});lastModel=model;
    try{w.dispatchEvent(new CustomEvent('nutrition-ui:view-model',{detail:model}));}catch(_){}
    return model;
  }
  function schedule(){w.clearTimeout(timer);timer=w.setTimeout(function(){publish(false);},70);}
  ['ration:changed','needs:computed','needs:changed','hei:rendered','diet:assessment-ready','diet:profile-rendered','analysis-workspace:ready','navigation-shell:route-changed','navigation-shell:mode-changed','nutrition:themechange','workspace-layout:changed','app:ready'].forEach(function(name){w.addEventListener(name,schedule,false);});
  d.addEventListener('input',schedule,true);d.addEventListener('change',schedule,true);
  w.NutritionUIViewModel={version:VERSION,get:function(){return lastModel||publish(true);},refresh:function(){return publish(true);}};
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){publish(true);},{once:true});else publish(true);
})(window,document);
