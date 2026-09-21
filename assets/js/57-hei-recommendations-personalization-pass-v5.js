// nutrition calculator v5.3.194_hei_personalization_atomic_render
// Responsibility: product-grounded HEI actions, energy-aware add/replace logic and PersonalNutritionProfile context.
(function(){
  'use strict';
  var VERSION='v5.3.194_hei_personalization_atomic_render';
  window.__V53115_HEI_RECOMMENDATIONS_REGRESSION_HARDENING__=VERSION;

  function num(v,d){v=Number(v);return Number.isFinite(v)?v:(d||0);}
  function clamp(v,a,b){return Math.max(a,Math.min(b,num(v,0)));}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmt(v,d){v=num(v,0);var s=v.toFixed(d==null?0:d).replace('.',',');return s.replace(/,0$/,'');}
  function round5(v){return Math.max(5,Math.round(num(v,0)/5)*5);}
  function gramsText(v){return fmt(v,0)+'\u00a0г';}
  function shortName(v){v=String(v||'').replace(/\s+/g,' ').trim();return v.length>54?v.slice(0,51)+'…':v;}
  function joinSources(items){items=(items||[]).filter(Boolean);if(items.length<2)return items[0]||'';if(items.length===2)return items[0]+' и '+items[1];return items.slice(0,-1).join(', ')+' и '+items[items.length-1];}
  function productName(p){return shortName(p&&(p.name_ru||p.name)||'Продукт');}
  function dbByKey(db,key){
    if(!db||!key)return null;
    try{if(db.byKey&&typeof db.byKey.get==='function')return db.byKey.get(key)||null;}catch(_){}
    var items=Array.isArray(db.items)?db.items:(Array.isArray(db.raw)?db.raw:[]);
    for(var i=0;i<items.length;i++)if(items[i]&&items[i].key===key)return items[i];
    return null;
  }
  function rawRation(){try{return window.State&&typeof window.State.get==='function'?(window.State.get()||[]):[];}catch(_){return[];}}
  function flattenRation(raw){
    try{
      var api=window.CompositeFoodFolderV5377||window.CompositeFoodDecomposerV5377||window.CompositeFoodDecomposerV5376;
      if(api&&typeof api.flattenForCalculation==='function')return api.flattenForCalculation(raw||[]);
      if(api&&typeof api.flattenCompositeForCalculation==='function')return api.flattenCompositeForCalculation(raw||[]);
    }catch(_){}
    return Array.isArray(raw)?raw:[];
  }
  function makeRawIndex(raw){
    var out={};(raw||[]).forEach(function(x){if(!x)return;var id=String(x.id||x.key||'');if(id)out[id]=x;});return out;
  }
  function blankContribution(){return {fruits_total:0,fruits_whole:0,vegetables_total:0,greens_beans:0,grains_whole:0,grains_refined:0,dairy:0,protein_total:0,seafood_plant:0,sodium_g:0,added_sugars_pct:0,sat_fats_pct:0,unsat:0,animal_protein:0,processed_fruit:0};}
  function explicitNumber(p,key){
    if(!p||!Object.prototype.hasOwnProperty.call(p,key))return null;
    var v=Number(p[key]);return Number.isFinite(v)?v:null;
  }
  function addContribution(row,p,g){
    var f=function(k){return num(p&&p[k],0)*g/100;};
    row.kcal+=f('kcal');row.proteinG+=f('protein_per_100g');row.fatG+=f('fat_per_100g');
    row.contrib.fruits_total+=f('fruit_cup_eq_per_100g');
    row.contrib.fruits_whole+=f('whole_fruit_cup_eq_per_100g');
    row.contrib.vegetables_total+=f('veg_cup_eq_per_100g');
    row.contrib.greens_beans+=f('greens_beans_cup_eq_per_100g');
    row.contrib.grains_whole+=f('whole_grain_oz_eq_per_100g');
    row.contrib.grains_refined+=f('refined_grain_oz_eq_per_100g');
    row.contrib.dairy+=f('dairy_cup_eq_per_100g');
    row.contrib.protein_total+=f('protein_oz_eq_per_100g');
    row.contrib.seafood_plant+=f('seafood_plant_oz_eq_per_100g');
    row.contrib.sodium_g+=f('sodium_mg');
    var sugarTsp=explicitNumber(p,'added_sugars_tsp_eq_per_100g');
    row.contrib.added_sugars_pct+=sugarTsp===null?f('added_sugar'):sugarTsp*g/100*4.2;
    row.contrib.sat_fats_pct+=f('sfa');
    row.contrib.unsat+=f('unsat');
    row.contrib.animal_protein+=Math.max(0,f('protein_oz_eq_per_100g')-f('seafood_plant_oz_eq_per_100g'));
    row.contrib.processed_fruit+=Math.max(0,f('fruit_cup_eq_per_100g')-f('whole_fruit_cup_eq_per_100g'));
  }
  function compositeConfidence(parent){
    if(!parent)return '';
    var model=parent.composite_food_model_v5_3_79||parent.composite_food_model_v5_3_78||parent.composite_food_model||null;
    return String(parent.confidence||(model&&model.confidence)||'').toUpperCase();
  }
  function collectRationRows(flat,db,raw){
    flat=Array.isArray(flat)?flat:[];var rawIndex=makeRawIndex(raw||[]),map={};
    flat.forEach(function(entry){
      if(!entry||!entry.key)return;var g=num(entry.grams,0);if(g<=0)return;
      var p=dbByKey(db,entry.key);if(!p)return;
      var parentId=entry.parent_composite_id?String(entry.parent_composite_id):'';
      var parent=parentId?rawIndex[parentId]:null;
      var key=parentId?'parent:'+parentId:'food:'+entry.key;
      if(!map[key])map[key]={id:key,key:parent&&parent.key||entry.key,name:entry.parent_composite_name||(parent&&(parent.name_ru||parent.name))||productName(p),grams:0,kcal:0,proteinG:0,fatG:0,products:[],isComposite:!!parentId,confidence:compositeConfidence(parent),children:{},contrib:blankContribution()};
      var row=map[key];row.grams+=g;row.products.push(p);addContribution(row,p,g);
      if(parentId){
        var childKey=String(entry.key);if(!row.children[childKey])row.children[childKey]={key:childKey,name:productName(p),grams:0,kcal:0,proteinG:0,fatG:0,contrib:blankContribution()};
        row.children[childKey].grams+=g;addContribution(row.children[childKey],p,g);
      }
    });
    return Object.keys(map).map(function(k){var r=map[k];r.childRows=Object.keys(r.children||{}).map(function(x){return r.children[x];});delete r.children;return r;}).sort(function(a,b){return b.kcal-a.kcal;});
  }

  function currentProfile(){
    try{
      if(window.__lastNeedsProfileApplied!==true)return null;
      if(window.__lastPersonalNeedsProfile)return window.__lastPersonalNeedsProfile;
      var api=window.PersonalNeedsProfileV5367||window.PersonalNeedsProfileV5366||window.PersonalNeedsProfileV5363;
      return api&&typeof api.current==='function'?api.current():null;
    }catch(_){return null;}
  }
  function currentNeedsMeta(){try{return window.__lastNeedsProfileApplied===true?(window.__lastNeedsMeta||null):null;}catch(_){return null;}}
  function buildEnergyContext(model,meta,profile){
    var actual=num(model&&model.intake&&model.intake.energy_kcal,0),low=num(meta&&meta.energyLow,0),high=num(meta&&meta.energyHigh,0);
    if(low>0&&high<=0)high=low;if(high>0&&low<=0)low=high;
    var applied=low>0&&high>0,state='unknown';
    if(applied){if(actual<low)state='low';else if(actual>high)state='high';else state='within';}
    var goal=String(profile&&profile.goal||meta&&meta.goal||'maintain');
    var guardrail=String(profile&&profile.guardrail||meta&&meta.guardrail||'none');
    var dietStyle=String(profile&&profile.dietStyle||meta&&meta.dietStyle||'mixed');
    var mode='replace';
    if(['ed_risk','pregnancy','lactation','medical_restriction'].indexOf(guardrail)>=0)mode='cautious';
    else if(state==='high'||goal==='lose')mode='replace';
    else if(state==='low'||goal==='gain'||goal==='rehab_gain'||dietStyle==='low_appetite')mode='add';
    else if(state==='within')mode='replace';
    else mode='neutral';
    var label='Расчёт потребности в энергии не выполнен';
    if(state==='low')label='Калорийность ниже расчётного диапазона';
    if(state==='within')label='Калорийность находится в расчётном диапазоне';
    if(state==='high')label='Калорийность выше расчётного диапазона';
    return {actual:actual,low:low,high:high,applied:applied,state:state,mode:mode,label:label,goal:goal,guardrail:guardrail,dietStyle:dietStyle};
  }
  function profileFlags(profile,energy){
    var style=String(profile&&profile.dietStyle||energy&&energy.dietStyle||'mixed');
    var state=String(profile&&profile.state||'normal'),guard=String(profile&&profile.guardrail||energy&&energy.guardrail||'none');
    return {noDairy:style==='no_dairy',vegetarian:style==='vegetarian',plantForward:style==='plant_forward',lowAppetite:style==='low_appetite',child:!!(profile&&profile.ageGroup&&profile.ageGroup.child),older:!!(profile&&profile.ageGroup&&profile.ageGroup.older),renal:state==='ckd'||state==='dialysis',medical:guard==='medical_restriction',protected:['ed_risk','pregnancy','lactation'].indexOf(guard)>=0};
  }
  function targetFor(action,profile,energy){
    var f=profileFlags(profile,energy),id=action.id;
    function result(label,amount,childAmount){return {label:label,amount:f.child?(childAmount||amount):amount};}
    if(id.indexOf('fruit')===0)return result('фрукты целиком или ягоды','около 150\u00a0г','возрастная порция');
    if(id==='veg')return result('порцию овощей, включив в неё листовую зелень или готовые бобовые','130–150\u00a0г','возрастная порция');
    if(id==='veg-total')return result('некрахмалистые овощи','130–150\u00a0г','возрастная порция');
    if(id==='greens')return result('листовую зелень или готовые бобовые','порция подходящего объёма','возрастная порция');
    if(id==='grains'||id==='whole-grain'||id==='refined')return result('готовую цельную крупу или цельнозерновой хлеб','80–100\u00a0г готовой крупы','возрастная порция');
    if(id==='dairy')return f.noDairy?result('обогащённый кальцием растительный напиток или растительный йогурт без добавленного сахара','200–250\u00a0мл','возрастная порция'):result('несладкий кисломолочный продукт или подходящую обогащённую альтернативу','200–250\u00a0мл','возрастная порция');
    if(id==='protein'||id==='protein-quality'||id==='protein-total'){
      if(f.renal||f.medical)return result('подходящий источник белка в пределах индивидуальных ограничений','количество, согласованное с назначениями');
      if(f.vegetarian||f.plantForward)return result('готовые бобовые, тофу, темпе, орехи или семена','одна порция');
      return result('рыбу, готовые бобовые или тофу','80–150\u00a0г готового продукта','возрастная порция');
    }
    if(id==='fats'||id==='sat-fat'||id==='fat-ratio')return (f.vegetarian||f.plantForward)?result('орехи, семена, авокадо или растительное масло','количество в пределах текущей калорийности'):result('рыбу, орехи, семена или растительное масло','количество в пределах текущей калорийности');
    return result('подходящий продукт','порция, соответствующая текущему рациону');
  }
  function amountSentence(target){
    var amount=String(target&&target.amount||'').trim();if(!amount)return '';
    if(amount.indexOf('согласован')>=0)return 'Количество согласуйте с индивидуальными назначениями.';
    if(amount.indexOf('пределах текущей калорийности')>=0)return 'Количество подберите в пределах текущей калорийности.';
    return 'Ориентир по количеству — '+amount+'.';
  }
  function scoreForAction(row,id){
    var c=row.contrib||{};
    if(id==='fruit'||id==='fruit-total')return c.fruits_total;
    if(id==='fruit-whole')return c.processed_fruit||c.fruits_whole;
    if(id==='veg'||id==='veg-total')return c.vegetables_total;
    if(id==='greens')return c.greens_beans;
    if(id==='grains'||id==='refined')return c.grains_refined;
    if(id==='whole-grain')return c.grains_whole;
    if(id==='dairy')return c.dairy;
    if(id==='protein')return c.protein_total+c.seafood_plant;
    if(id==='protein-quality')return c.animal_protein;
    if(id==='protein-total')return c.protein_total;
    if(id==='sodium')return c.sodium_g;
    if(id==='sugar')return c.added_sugars_pct;
    if(id==='fats'||id==='sat-fat'||id==='fat-ratio')return c.sat_fats_pct;
    return 0;
  }
  function targetScoreForAction(row,id){
    var c=row.contrib||{};
    if(id==='fruit'||id==='fruit-whole')return c.fruits_whole;
    if(id==='fruit-total')return c.fruits_total;
    if(id==='veg'||id==='greens')return c.greens_beans;
    if(id==='veg-total')return c.vegetables_total;
    if(id==='grains'||id==='whole-grain'||id==='refined')return c.grains_whole;
    if(id==='dairy')return c.dairy;
    if(id==='protein'||id==='protein-quality')return c.seafood_plant;
    if(id==='protein-total')return c.protein_total;
    if(id==='fats'||id==='sat-fat'||id==='fat-ratio')return c.unsat;
    return 0;
  }
  function topRows(rows,id,count){return (rows||[]).filter(function(r){return scoreForAction(r,id)>1e-9;}).sort(function(a,b){return scoreForAction(b,id)-scoreForAction(a,id);}).slice(0,count||2);}
  function targetRows(rows,id,count){return (rows||[]).filter(function(r){return targetScoreForAction(r,id)>1e-9;}).sort(function(a,b){return targetScoreForAction(b,id)-targetScoreForAction(a,id);}).slice(0,count||2);}
  function formatSource(row,id){
    var base='«'+shortName(row.name)+'» — '+gramsText(row.grams),c=row.contrib||{};
    if(id==='sodium')base+=' ('+fmt(c.sodium_g,0)+'\u00a0мг натрия)';
    if(id==='sugar')base+=' ('+fmt(c.added_sugars_pct,1)+'\u00a0г добавленного сахара)';
    if(id==='fats'||id==='sat-fat'||id==='fat-ratio')base+=' ('+fmt(c.sat_fats_pct,1)+'\u00a0г насыщённых жиров)';
    return base;
  }
  function compositeChildText(row,id){
    if(!row||!row.isComposite||!row.childRows||!row.childRows.length)return '';
    var top=row.childRows.filter(function(x){return scoreForAction(x,id)>1e-9;}).sort(function(a,b){return scoreForAction(b,id)-scoreForAction(a,id);}).slice(0,2);
    if(!top.length)return '';
    return ' Внутри блюда основной вклад дают '+joinSources(top.map(function(x){return '«'+shortName(x.name)+'» — '+gramsText(x.grams);}))+'.';
  }
  function reliabilityNote(action,rows){
    var comps=topRows(rows,action.id,2).filter(function(r){return r.isComposite;});if(!comps.length)return '';
    var limited=comps.some(function(r){return !r.confidence||r.confidence==='LOW'||r.confidence==='MEDIUM'||r.confidence.indexOf('MEDIUM')>=0;});
    return limited?'Вклад составного блюда рассчитан по ориентировочной декомпозиции; надёжность продуктового совета ограничена точностью рецептуры.':'Вклад составного блюда рассчитан по сохранённой декомпозиции ингредиентов.';
  }
  function sourceText(action,rows){
    var top=topRows(rows,action.id,2);if(!top.length)return 'В текущем рационе пока нет продукта, который заметно формирует этот показатель.';
    var correction=['grains','refined','protein-quality','sodium','sugar','fats','sat-fat','fat-ratio','fruit-whole'].indexOf(action.id)>=0;
    var text=(correction?'Основной вклад в показатель вносят ':'Вклад этой группы уже формируют ')+joinSources(top.map(function(r){return formatSource(r,action.id);}))+'.';
    top.forEach(function(r){text+=compositeChildText(r,action.id);});return text;
  }
  function isTargetRow(row,action){return targetScoreForAction(row,action.id)>1e-9;}
  function donorRows(rows,action){
    return (rows||[]).filter(function(r){return !isTargetRow(r,action);}).map(function(r){
      var c=r.contrib||{};return {row:r,score:r.kcal*0.01+c.added_sugars_pct*3+c.sat_fats_pct*2+c.sodium_g/450+c.grains_refined*3};
    }).filter(function(x){return x.score>0.5;}).sort(function(a,b){return b.score-a.score;});
  }
  function calcReduction(action,source,plan){
    if(!source||source.grams<=0)return 0;var key='',metric=null,perGram=0,c=source.contrib||{};
    if(action.id==='sodium'){key='sodium_g';perGram=c.sodium_g/source.grams;}
    else if(action.id==='sugar'){key='added_sugars_pct';perGram=c.added_sugars_pct/source.grams;}
    else if(action.id==='fats'||action.id==='sat-fat'){key='sat_fats_pct';perGram=c.sat_fats_pct/source.grams;}
    else if(action.id==='grains'||action.id==='refined'){key='grains_refined';perGram=(c.grains_refined*85)/source.grams;}
    if(!key||perGram<=0)return 0;metric=plan&&plan.metrics&&plan.metrics[key];var need=num(metric&&metric.next,0);if(need<=0)return 0;
    return clamp(round5(need/perGram),5,Math.max(5,source.grams*0.5));
  }
  function relevantProfileNote(action,profile,energy){
    if(!profile)return '';
    var f=profileFlags(profile,energy),id=action.id;
    if(f.protected)return 'В защитном сценарии рекомендация служит мягким ориентиром и не заменяет индивидуальный план питания.';
    if(id==='dairy'&&f.noDairy)return 'Для рациона без молочных продуктов предлагаются только обогащённые растительные альтернативы.';
    if(id.indexOf('protein')===0&&(f.renal||f.medical))return 'При выбранном медицинском профиле количество и источник белка не изменяются автоматически.';
    if(id.indexOf('protein')===0&&(f.vegetarian||f.plantForward))return 'При растительном пищевом стиле приоритет отдан бобовым, соевым продуктам, орехам и семенам.';
    if(f.medical)return 'При медицинских ограничениях конкретную замену следует сверить с допустимым перечнем продуктов.';
    if(f.lowAppetite)return 'При сниженном аппетите изменение лучше распределить между небольшими порциями, не увеличивая объём пищи резко.';
    if(f.older&&id.indexOf('protein')===0)return 'В старшей возрастной группе белковые продукты предпочтительно распределять между основными приёмами пищи.';
    if(f.child)return 'Для ребёнка объём следует соотнести с возрастной порцией и общей достаточностью рациона.';
    if(energy.goal==='lose')return 'При цели снижения массы предпочтительна равноценная замена без увеличения общей калорийности.';
    if(energy.goal==='gain'||energy.goal==='rehab_gain')return 'При цели набора или восстановления продукт можно добавить, пока калорийность остаётся ниже расчётного диапазона.';
    return '';
  }
  function operationBadge(text,energy){
    text=String(text||'');
    if(energy&&energy.mode==='cautious')return 'Нужна индивидуальная проверка';
    if(/^(?:Не увеличивайте|Не вводите|Сверьте)(?=\s|[.,;:!?—-]|$)/.test(text))return 'Нужна индивидуальная проверка';
    if(/^(?:Уменьшите|Сократите|Снизьте)(?=\s|[.,;:!?—-]|$)/.test(text))return 'Выбрано сокращение';
    if(/^(?:Замените|Перераспределите|Не увеличивая)(?=\s|[.,;:!?—-]|$)/.test(text))return 'Выбрана замена';
    if(/^(?:Добавьте|Увеличьте)(?=\s|[.,;:!?—-]|$)/.test(text))return 'Выбрано добавление';
    return 'Выбран осторожный вариант';
  }
  function personalizedPractical(action,rows,plan,profile,energy){
    var target=targetFor(action,profile,energy),top=topRows(rows,action.id,1),source=top[0]||null,f=profileFlags(profile,energy);
    if(action.id.indexOf('protein')===0&&(f.renal||f.medical))return 'Не увеличивайте белковую часть автоматически. Сверьте допустимый источник и количество белка с индивидуальными назначениями, затем пересчитайте рацион.';
    var correction=['sodium','sugar','fats','sat-fat','fat-ratio','refined','grains','protein-quality','fruit-whole'].indexOf(action.id)>=0;
    if(correction&&source){
      var reduction=calcReduction(action,source,plan);
      if(energy.mode==='cautious')return 'Не вводите жёсткое ограничение автоматически. Возможную замену продукта «'+shortName(source.name)+'» согласуйте с индивидуальным планом и переносимостью.';
      if(action.id==='grains'||action.id==='refined')return 'Замените часть продукта «'+shortName(source.name)+'» на '+target.label+'. '+amountSentence(target);
      if(action.id==='protein-quality')return 'Не увеличивая общий объём белковой пищи, замените часть продукта «'+shortName(source.name)+'» на '+target.label+'.';
      if(action.id==='fruit-whole')return 'Замените переработанную фруктовую позицию «'+shortName(source.name)+'» фруктом целиком или ягодами.';
      if(action.id==='fats'||action.id==='sat-fat'||action.id==='fat-ratio')return 'Замените часть продукта «'+shortName(source.name)+'» на '+target.label+'. '+amountSentence(target);
      return 'Уменьшите количество продукта «'+shortName(source.name)+'»'+(reduction?' примерно на '+gramsText(reduction):'')+'. После изменения пересчитайте рацион.';
    }
    var existing=targetRows(rows,action.id,1)[0]||null;
    if(energy.mode==='add'){
      if(existing)return 'Увеличьте количество уже используемого продукта «'+shortName(existing.name)+'» либо добавьте '+target.label+'. '+amountSentence(target);
      return 'Добавьте '+target.label+'. '+amountSentence(target);
    }
    if(energy.mode==='cautious')return 'Не вводите автоматическое жёсткое ограничение. Подберите '+target.label+' с учётом переносимости и индивидуального плана.';
    var donor=(donorRows(rows,action)[0]||{}).row;
    if(donor)return 'Замените часть продукта «'+shortName(donor.name)+'» на '+target.label+', не увеличивая общую калорийность. '+amountSentence(target);
    if(existing)return 'Перераспределите рацион в пользу продукта «'+shortName(existing.name)+'», сохраняя общую калорийность.';
    return 'Добавьте '+target.label+' и сократите другую, сопоставимую по калорийности позицию. '+amountSentence(target);
  }
  function profileChips(profile,energy){
    if(!profile)return [];
    var out=[];
    if(profile.goalLabel)out.push('Цель: '+profile.goalLabel);
    if(profile.dietStyleLabel)out.push(profile.dietStyleLabel);
    if(profile.state&&profile.state!=='normal'&&profile.stateLabel)out.push('Состояние: '+profile.stateLabel);
    if(profile.ageGroup&&profile.ageGroup.label)out.push(profile.ageGroup.label);
    if(energy&&energy.applied)out.push(energy.label);
    if(energy&&energy.guardrail&&energy.guardrail!=='none')out.push('Защитный сценарий: '+String(energy.guardrail).replace(/_/g,' '));
    return out.slice(0,6);
  }
  function personalizeAction(action,rows,plan,profile,energy){
    var out={};Object.keys(action||{}).forEach(function(k){out[k]=action[k];});
    var source=topRows(rows,out.id,1)[0]||null,target=targetRows(rows,out.id,1)[0]||null,flags=profileFlags(profile,energy);
    out.sourceText=sourceText(out,rows);
    out.personalPractical=personalizedPractical(out,rows,plan,profile,energy);
    out.profileNote=relevantProfileNote(out,profile,energy);
    out.operationBadge=operationBadge(out.personalPractical,energy);
    out.reliabilityNote=reliabilityNote(out,rows);
    if(source){
      if(['sodium','sugar','fats','sat-fat','fat-ratio'].indexOf(out.id)>=0)out.headline='Начните с продукта «'+shortName(source.name)+'»';
      else if(out.id==='grains'||out.id==='refined')out.headline='Замените часть продукта «'+shortName(source.name)+'» цельнозерновым вариантом';
      else if(out.id==='protein-quality')out.headline='Пересмотрите источник белка — «'+shortName(source.name)+'»';
    }
    if(target&&energy.mode==='add'&&['sodium','sugar','fats','sat-fat','fat-ratio','grains','refined','protein-quality','fruit-whole'].indexOf(out.id)<0)out.headline='Увеличьте долю продукта «'+shortName(target.name)+'»';
    if(out.id.indexOf('protein')===0&&(flags.renal||flags.medical))out.headline='Сверьте допустимый источник и количество белка';
    else if(energy.mode==='cautious')out.headline='Сверьте изменение рациона с индивидуальным планом';
    else if(out.id==='dairy'&&flags.noDairy)out.headline=out.operationBadge==='Выбрано добавление'?'Добавьте обогащённую растительную альтернативу':'Замените часть рациона обогащённой растительной альтернативой';
    return out;
  }
  function personalizePlan(plan,model,options){
    options=options||{};var rows=options.rows||[],profile=options.profile||null,meta=options.needsMeta||null;
    var energy=buildEnergyContext(model,meta,profile);
    var actions=(plan.actions||[]).map(function(a){return personalizeAction(a,rows,plan,profile,energy);});
    var byKey={};(plan.allActions||[]).forEach(function(a){var pa=personalizeAction(a,rows,plan,profile,energy);(a.keys||[]).forEach(function(k){if(!byKey[k])byKey[k]=pa;});});
    return {base:plan,actions:actions,byKey:byKey,rows:rows,profile:profile,energy:energy,profileChips:profileChips(profile,energy)};
  }

  function applyActionCard(card,action){
    if(!card||!action)return;
    var title=card.querySelector('h4');if(title)setTextStable(title,action.headline);
    var reason=card.querySelector('.hei-p1-reason');if(reason)setTextStable(reason,action.reason);
    var step=card.querySelector('.hei-p1-step strong');if(step)setTextStable(step,action.personalPractical);
    var old=card.querySelector('.hei-p2-grounding');if(old)old.remove();
    var box=document.createElement('div');box.className='hei-p2-grounding';box.innerHTML='<p><span>Что формирует показатель</span>'+esc(action.sourceText)+'</p><div class="hei-p2-badges"><b>'+esc(action.operationBadge)+'</b>'+(action.profileNote?'<em>'+esc(action.profileNote)+'</em>':'')+'</div>'+(action.reliabilityNote?'<p class="hei-p2-reliability">'+esc(action.reliabilityNote)+'</p>':'');
    var calc=card.querySelector('.hei-p1-calculation');card.insertBefore(box,calc||null);
  }
  function applyComponentCard(details,action){
    if(!details||!action)return;var body=details.querySelector('.hei-p1-component-body');if(!body)return;
    var p=body.querySelector(':scope > p');if(p)setTextStable(p,action.personalPractical);
    var old=body.querySelector('.hei-p2-component-context');if(old)old.remove();
    var ctx=document.createElement('div');ctx.className='hei-p2-component-context';ctx.innerHTML='<span>Что формирует показатель</span><p>'+esc(action.sourceText)+'</p>'+(action.profileNote?'<em>'+esc(action.profileNote)+'</em>':'')+(action.reliabilityNote?'<small>'+esc(action.reliabilityNote)+'</small>':'');
    body.insertBefore(ctx,body.firstChild);
  }
  function applyTable(plan){
    var tbody=document.getElementById('heiTableBody');if(!tbody)return;
    Object.keys(plan.byKey||{}).forEach(function(key){
      var row=tbody.querySelector('tr[data-hei-key="'+key+'"]');if(!row||row.children.length<4)return;var action=plan.byKey[key],cell=row.children[3];
      var line=cell.querySelector('.hei-p2-table-personal');if(!line){line=document.createElement('span');line.className='hei-p1-table-line hei-p2-table-personal';cell.appendChild(line);}
      line.innerHTML='<b>Персональный шаг:</b> '+esc(action.personalPractical);
    });
  }
  function personalizedPlanSignature(plan){
    try{return JSON.stringify({actions:(plan.actions||[]).map(function(a){return [a.id||'',a.headline||'',a.reason||'',a.personalPractical||'',a.sourceText||'',a.operationBadge||'',a.profileNote||'',a.reliabilityNote||''];}),byKey:Object.keys(plan.byKey||{}).sort().map(function(k){var a=plan.byKey[k]||{};return [k,a.personalPractical||'',a.sourceText||'',a.profileNote||'',a.reliabilityNote||''];}),chips:(plan.profileChips||[]).slice(),energy:plan.energy?{mode:plan.energy.mode||'',current:Number(plan.energy.current)||0,target:Number(plan.energy.target)||0}:null});}catch(_){return '';}
  }
  function setTextStable(node,value){if(node&&node.textContent!==String(value==null?'':value))node.textContent=String(value==null?'':value);}

  function renderPersonalized(plan){
    var signature=personalizedPlanSignature(plan);
    var levers=document.getElementById('heiLevers');
    if(signature&&signature===window.__lastHEIRecommendationPersonalizedSignature&&levers&&levers.querySelector('.hei-p2-grounding')){window.__lastHEIRecommendationPlanPersonalized=plan;return;}
    window.__lastHEIRecommendationPersonalizedSignature=signature;
    if(levers){
      var cards=levers.querySelectorAll('.hei-p1-action');for(var i=0;i<cards.length;i++)applyActionCard(cards[i],plan.actions[i]);
      var heading=levers.querySelector('.hei-p1-heading p');if(heading)setTextStable(heading,'Рекомендации привязаны к продуктам текущего рациона. Калькулятор выбирает между добавлением, заменой и сокращением с учётом калорийности и заданного профиля потребностей.');
      var head=levers.querySelector('.hei-p1-heading');if(head){var old=head.querySelector('.hei-p2-profile-context');if(old)old.remove();if(plan.profileChips.length){var chips=document.createElement('div');chips.className='hei-p2-profile-context';chips.innerHTML='<span>Что учтено</span><div>'+plan.profileChips.map(function(x){return '<b>'+esc(x)+'</b>';}).join('')+'</div>';head.appendChild(chips);}}
    }
    var recs=document.getElementById('heiRecs');if(recs)Object.keys(plan.byKey||{}).forEach(function(k){applyComponentCard(recs.querySelector('.hei-p1-component[data-hei-key="'+k+'"]'),plan.byKey[k]);});
    applyTable(plan);
    window.__lastHEIRecommendationPlanPersonalized=plan;
    try{window.dispatchEvent(new CustomEvent('hei:recommendations-personalized',{detail:{plan:plan}}));}catch(_){}
  }
  function injectStyles(){
    if(document.getElementById('heiRecommendationsPersonalizationPass2Styles'))return;
    var s=document.createElement('style');s.id='heiRecommendationsPersonalizationPass2Styles';s.textContent='\
.hei-p2-grounding{margin:10px 0 0;padding:10px 11px;border:1px solid #dbe7ef;border-radius:10px;background:#fff}.hei-p2-grounding p{margin:0;color:#40566b;font-size:12px;line-height:1.48}.hei-p2-grounding p>span,.hei-p2-component-context>span{display:block;margin-bottom:3px;color:#356b94;font-size:10px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.hei-p2-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.hei-p2-badges b,.hei-p2-badges em{border-radius:999px;padding:5px 8px;font-size:10px;line-height:1.25;font-style:normal}.hei-p2-badges b{background:#edf5fb;color:#255f87}.hei-p2-badges em{background:#f3f8f5;color:#35644f}.hei-p2-profile-context{flex:1 0 100%;border-top:1px solid #e3ebf2;padding-top:10px}.hei-p2-profile-context>span{display:block;color:#6a7c8d;font-size:10px;font-weight:800;text-transform:none;letter-spacing:.01em}.hei-p2-profile-context>div{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.hei-p2-profile-context b{border:1px solid #dbe6ef;border-radius:999px;background:#f8fbfd;color:#3b566d;padding:5px 8px;font-size:10px}.hei-p2-component-context{margin:0 0 9px;padding:9px 10px;border-radius:9px;background:#f7fafc}.hei-p2-component-context p{margin:0;color:#40566b;font-size:12px;line-height:1.45}.hei-p2-component-context em{display:block;margin-top:6px;color:#3d6754;font-size:11px;font-style:normal}.hei-p2-reliability,.hei-p2-component-context small{display:block;margin:7px 0 0;color:#6a5b40;font-size:10px;line-height:1.4}.hei-p2-table-personal{margin-top:6px;padding-top:6px;border-top:1px dashed #dce5ec}@media(max-width:900px){.hei-p2-profile-context{margin-top:10px}.hei-p2-badges{display:grid}.hei-p2-grounding{padding:9px}.hei-p2-profile-context>div{gap:5px}}@media print{.hei-p2-grounding,.hei-p2-component-context{break-inside:avoid}}';document.head.appendChild(s);
  }
  var timer=0,busy=false;
  function refresh(){
    if(busy)return;var p1=window.HEIRecommendationPass1,base=window.__lastHEIRecommendationPlan,model=window.__lastHEIModel;if(!p1||!base||!model||model.valid===false)return;
    busy=true;try{var raw=rawRation(),flat=flattenRation(raw),rows=collectRationRows(flat,window.DB,raw);var plan=personalizePlan(base,model,{rows:rows,profile:currentProfile(),needsMeta:currentNeedsMeta()});renderPersonalized(plan);}finally{busy=false;}
  }
  function schedule(delay){clearTimeout(timer);timer=setTimeout(refresh,delay==null?30:delay);}
  function init(){injectStyles();window.addEventListener('hei:recommendations-updated',function(){clearTimeout(timer);refresh();});window.addEventListener('app:ready',function(){schedule(20);});setTimeout(refresh,450);setTimeout(refresh,1250);}

  window.HEIRecommendationPass2={version:VERSION,collectRationRows:collectRationRows,buildEnergyContext:buildEnergyContext,personalizeAction:personalizeAction,personalizePlan:personalizePlan,render:renderPersonalized,refresh:refresh};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
