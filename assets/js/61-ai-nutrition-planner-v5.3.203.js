/* Nutrition Calculator v5.3.203 — verified AI nutrition planner, pass 3. */
(function(){
  'use strict';
  var VERSION='v5_3_203_ai_nutrition_planner_pass_3';
  var BUILD='v5.3.203';
  var FEATURE_LEVEL=3;
  var API='./api/gemini.php?v=5.3.203';
  var STORAGE='nutri_ai_planner_preferences_v5_3_203';
  var activeController=null;
  var currentResult=null;
  var running=false;

  var METRICS=[
    {key:'protein_g',label:'Белок',mode:'min',unit:'г',weight:0.8},
    {key:'fiber_g',label:'Клетчатка',mode:'min',unit:'г',weight:1.25},
    {key:'calcium_mg',label:'Кальций',mode:'min',unit:'мг',weight:1.1},
    {key:'iron_mg',label:'Железо',mode:'min',unit:'мг',weight:0.9},
    {key:'magnesium_mg',label:'Магний',mode:'min',unit:'мг',weight:1.0},
    {key:'potassium_mg',label:'Калий',mode:'min',unit:'мг',weight:1.0},
    {key:'phosphorus_mg',label:'Фосфор',mode:'min',unit:'мг',weight:0.65},
    {key:'zinc_mg',label:'Цинк',mode:'min',unit:'мг',weight:0.8},
    {key:'iodine_mcg',label:'Йод',mode:'min',unit:'мкг',weight:0.9},
    {key:'selenium_mcg',label:'Селен',mode:'min',unit:'мкг',weight:0.75},
    {key:'copper_mg',label:'Медь',mode:'min',unit:'мг',weight:0.65},
    {key:'manganese_mg',label:'Марганец',mode:'min',unit:'мг',weight:0.65},
    {key:'vitamin_a_mcg',label:'Витамин A',mode:'min',unit:'мкг',weight:1.15},
    {key:'vitamin_c_mg',label:'Витамин C',mode:'min',unit:'мг',weight:0.9},
    {key:'vitamin_d_mcg',label:'Витамин D',mode:'min',unit:'мкг',weight:1.0},
    {key:'vitamin_e_mg',label:'Витамин E',mode:'min',unit:'мг',weight:0.8},
    {key:'vitamin_k_mcg',label:'Витамин K',mode:'min',unit:'мкг',weight:0.75},
    {key:'vitamin_b1_mg',label:'Витамин B1',mode:'min',unit:'мг',weight:0.7},
    {key:'vitamin_b2_mg',label:'Витамин B2',mode:'min',unit:'мг',weight:0.7},
    {key:'vitamin_b3_mg',label:'Витамин B3',mode:'min',unit:'мг',weight:0.65},
    {key:'vitamin_b5_mg',label:'Витамин B5',mode:'min',unit:'мг',weight:0.65},
    {key:'vitamin_b6_mg',label:'Витамин B6',mode:'min',unit:'мг',weight:0.7},
    {key:'vitamin_b9_mcg',label:'Фолат',mode:'min',unit:'мкг',weight:0.9},
    {key:'vitamin_b12_mcg',label:'Витамин B12',mode:'min',unit:'мкг',weight:0.85},
    {key:'choline_mg',label:'Холин',mode:'min',unit:'мг',weight:0.75},
    {key:'sodium_mg',label:'Натрий',mode:'max',unit:'мг',weight:1.25},
    {key:'sfa_g',label:'Насыщенные жиры',mode:'max',unit:'г',weight:1.15},
    {key:'added_sugars_g',label:'Добавленный сахар',mode:'max',unit:'г',weight:1.0}
  ];
  var METRIC_BY_KEY={};METRICS.forEach(function(m){METRIC_BY_KEY[m.key]=m;});

  function arr(x){return Array.isArray(x)?x:[];}
  function num(x,d){x=Number(x);return Number.isFinite(x)?x:(d==null?0:d);}
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function round(x,d){var m=Math.pow(10,d==null?1:d);return Math.round(num(x)*m)/m;}
  function text(x,max){var s=String(x==null?'':x).replace(/\s+/g,' ').trim();return max&&s.length>max?s.slice(0,max):s;}
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clone(x){try{return JSON.parse(JSON.stringify(x));}catch(_){return x;}}
  function uniq(a){var o=[];arr(a).forEach(function(x){if(x!=null&&o.indexOf(x)<0)o.push(x);});return o;}
  function $(id){return document.getElementById(id);}
  function dbProduct(key){try{return window.DB&&window.DB.byKey&&window.DB.byKey.get?window.DB.byKey.get(key):null;}catch(_){return null;}}
  function dbItems(){try{return window.DB&&Array.isArray(window.DB.items)?window.DB.items:[];}catch(_){return [];}}
  function ration(){try{return window.State&&typeof window.State.get==='function'?arr(window.State.get()):[];}catch(_){return [];}}
  function core(){return window.NutritionCalculationCore||window.NutritionCalculationCoreV53155||null;}
  function normRaw(key){
    var values=(window.norms&&window.norms.values)||{};var v=values[key];
    if(v&&typeof v==='object')v=v.value;
    v=num(v,0);
    if(v>0)return v;
    var fall={fiber_g:25,sodium_mg:2300,sfa_g:22,added_sugars_g:50};
    return num(fall[key],0);
  }
  function sourceQuality(p){
    var s=(text(p&&p.nutrition_verification_status,100)+' '+text(p&&p.nutrient_completeness_status,100)+' '+text(p&&p.source_exactness_class,100)).toLowerCase();
    if(/source_required|review_required|incomplete|missing|manual_review/.test(s))return 0.25;
    if(/verified.*exact|exact.*verified|complete.*exact/.test(s))return 1;
    if(/verified|complete/.test(s)&&!/proxy|recipe|label/.test(s))return 0.92;
    if(/proxy|recipe|label|model/.test(s))return 0.68;
    return 0.5;
  }
  function productRole(p){
    var c=(text(p&&p.catalog_category_key,80)+' '+text(p&&p.category,80)+' '+text(p&&p.hei_category_key,80)).toLowerCase();
    var n=text(p&&(p.name_ru||p.name),160).toLowerCase();
    if(/veget|овощ|root|green|mushroom|crucifer|starchy/.test(c)||/морков|тыкв|капуст|броккол|св[её]кл|кабач|баклаж|томат|огурц/.test(n))return 'vegetable';
    if(/fruit|фрукт|ягод/.test(c))return 'fruit';
    if(/whole_grain|refined_grain|grain|bakery|круп|злак|хлеб/.test(c))return 'grain';
    if(/seafood|protein|meat|legume|nuts|seed|рыб|мяс|боб|орех/.test(c))return 'protein';
    if(/dairy|молоч/.test(c))return 'dairy';
    if(/oil|fat|масл|жир/.test(c))return 'fat';
    if(/sweet|snack|ready_food|fastfood|dessert|слад|снек/.test(c))return 'discretionary';
    if(/drink|напит/.test(c))return 'drink';
    return 'other';
  }
  function productFlags(p){
    var blob=(text(p&&(p.name_ru||p.name),180)+' '+text(p&&p.category,100)+' '+text(p&&p.state,60)+' '+arr(p&&p.tags).join(' ')).toLowerCase();
    return {
      excluded:/supplement|sports[_ ]protein|protein[_ ]supplement|mass[_ ]gainer|гейнер|протеинова.{0,8}(смесь|добав)|бад\b|витаминн.{0,8}комплекс/.test(blob),
      herb:/\bherbs?\b|зелень|петруш|укроп|базилик|кинз/.test(blob),
      spice:/spice|seasoning|прян|спец|порошок/.test(blob),
      dried:/dried|dehydrated|суш[её]н|вялен/.test(blob),
      seeds:/nuts_seeds|seed|семен|орех/.test(blob),
      organ:/offal|\bliver\b|печен/.test(blob),
      concentratedRetinol:/rich_vitamin_a|high_vitamin_a|\bliver\b|печен/.test(blob),
      processed:/processed|ultra_processed|плавлен|колбас|сосиск|fastfood/.test(blob),
      powder:/powder|сухое молоко|молоко сухое|порошк/.test(blob),
      ingredient:/\bbran\b|отруб|\bflour\b|мука|крахмал|starch|сухое молоко|молоко сухое|текстурирован|текстурат|protein isolate|protein concentrate|изолят|концентрат белка|\bdry\b|сух(ая|ой|ое|ие)\b/.test(blob),
      cheese:/cheese|сыр/.test(blob),
      familiar:/морков|тыкв|батат|картоф|броккол|цветн.{0,8}капуст|шпинат|св[её]кл|кабач|томат|перец|яблок|банан|апельс|смород|чечев|фасол|нут|греч|овся|рис|творог|йогурт|кефир|яйц|куриц|индей|лосос|форел|треск|сардин|тофу/.test(blob),
      niche:/листья репы|листовая горчица|угорь|помело|гуава|окра|мангольд/.test(blob),
      dairy:productRole(p)==='dairy', fish:/fish|seafood|рыб|треск|лосос|тунец|угор/.test(blob), meat:/meat|poultry|chicken|beef|pork|мяс|куриц|индей|говяд|свин/.test(blob), egg:/\begg\b|яйц/.test(blob), legumes:/legume|lentil|bean|pea|нут|чечев|фасол|горох/.test(blob), gluten:/wheat|barley|rye|пшен|ячмен|рож/.test(blob)
    };
  }
  function blockedByConstraint(p,preferences){
    var q=text(preferences&&preferences.constraint,600).toLowerCase(),f=productFlags(p);if(!q)return false;
    function denied(re){return re.test(q);}
    if(f.dairy&&denied(/без\s+(молоч|сыра|молока)|не\s+(добавлять|использовать|хочу)\s+.{0,20}(молоч|сыр|молок)/))return true;
    if(f.fish&&denied(/без\s+рыб|не\s+(добавлять|использовать|хочу)\s+.{0,15}рыб/))return true;
    if(f.meat&&denied(/без\s+мяс|не\s+(добавлять|использовать|хочу)\s+.{0,15}мяс/))return true;
    if(f.egg&&denied(/без\s+яиц|без\s+яйц|не\s+(добавлять|использовать)\s+.{0,15}яйц/))return true;
    if(f.seeds&&denied(/без\s+(орех|семен)|не\s+(добавлять|использовать)\s+.{0,20}(орех|семен)/))return true;
    if(f.legumes&&denied(/без\s+боб|не\s+(добавлять|использовать)\s+.{0,15}(боб|чечев|фасол|горох)/))return true;
    if(f.gluten&&denied(/без\s+глютен|глютен\s+исключ/))return true;
    return false;
  }
  function practicalPortions(p,role){
    var f=productFlags(p),vals=[];arr(p&&p.serving_units).forEach(function(u){var g=num(u&&u.grams,0);if(g>=2&&g<=500)vals.push(round(g,1));});
    if(vals.length){vals.sort(function(a,b){return a-b;});var mid=vals[Math.floor(vals.length/2)],cap=role==='fruit'?250:role==='fat'?30:role==='protein'?200:role==='grain'?250:300;return uniq([Math.max(2,round(Math.min(mid*0.6,cap),1)),round(Math.min(mid,cap),1),round(Math.min(mid*1.4,cap),1)]).filter(function(g){return g>=2;});}
    if(f.herb)return [5,10,15];if(f.spice)return [2,5,10];if(f.organ)return [20,30,40];if(f.powder)return [10,20,30];if(f.cheese)return [20,30,50];if(f.dried)return [15,25,40];if(f.seeds)return [10,20,30];
    if(role==='fat')return [5,10,15];if(role==='dairy')return [100,150,200];if(role==='protein'||role==='grain')return [50,75,100,150];if(role==='fruit')return [75,100,150,200];return [50,100,150,200];
  }
  function productSubrole(p){
    var role=productRole(p),f=productFlags(p),blob=(text(p&&(p.name_ru||p.name),180)+' '+text(p&&p.category,100)+' '+text(p&&p.state,50)+' '+arr(p&&p.tags).join(' ')).toLowerCase();
    if(f.ingredient||f.powder)return 'ingredient';
    if(role==='grain'){if(/bread|хлеб|лаваш|булоч/.test(blob))return 'bread';if(/pasta|макарон|лапш/.test(blob))return 'pasta';if(/cooked|boiled|вар[её]н|готов/.test(blob))return 'cooked_grain';return 'grain_other';}
    if(role==='dairy'){if(/yog|кефир|айран|йогур/.test(blob))return 'fermented_dairy';if(f.cheese)return 'cheese';if(/curd|творог/.test(blob))return 'curd';return 'dairy_other';}
    if(role==='protein'){if(f.fish)return 'fish';if(f.legumes)return 'legumes';if(f.egg)return 'egg';if(f.meat)return 'meat';return 'protein_other';}
    return role;
  }
  function nutrient100(p){
    var c=core();if(!c||typeof c.scaledPerItem!=='function')return {};
    try{return c.scaledPerItem({key:p.key,grams:100})||{};}catch(_){return {};}
  }
  function nutrientFieldPresent(p,key){
    if(!p)return false;var aliases={protein_g:['protein_per_100g','protein_g','protein'],fiber_g:['fiber_per_100g','fiber_g','fiber'],sfa_g:['sfa_per_100g','sfa_g','sfa'],added_sugars_g:['added_sugars_per_100g','added_sugars_g','added_sugar'],selenium_mcg:['selenium_mcg','selenium_ug']};
    var list=aliases[key]||[key];for(var i=0;i<list.length;i++)if(Object.prototype.hasOwnProperty.call(p,list[i])&&Number.isFinite(Number(p[list[i]])))return true;return false;
  }
  function nutrientCoverage(raw,key,before){
    var list=arr(before&&before.snapshot&&before.snapshot.nutrientRation);if(!list.length)list=normalizeRation(raw);var total=0,covered=0;
    list.forEach(function(it){var g=Math.max(0,num(it&&it.grams,0)),p=dbProduct(it&&it.key);if(!(g>0)||!p)return;total+=g;if(nutrientFieldPresent(p,key))covered+=g*sourceQuality(p);});return total?clamp(covered/total,0,1):0;
  }
  function calc(r){
    var c=core();if(!c||typeof c.snapshot!=='function')throw new Error('Расчётное ядро не готово.');
    var snap=c.snapshot(r),tot=snap.totals||{},energyRef=normRaw('kcal')||num(tot.kcal,2000),hei=null;
    try{if(window.HEI&&window.HEI.computeIntake&&window.HEI.score)hei=window.HEI.score(window.HEI.computeIntake(r,window.DB),energyRef);}catch(_){hei=null;}
    return {ration:r,snapshot:snap,totals:tot,hei:hei,hei_total:hei?num(hei.total,0):null};
  }
  function normalizeRation(raw){return arr(raw).filter(function(x){return x&&x.key&&num(x.grams)>0;}).map(function(x){return clone(x);});}
  function addToVirtual(raw,key,grams){
    var r=normalizeRation(raw),found=null;
    for(var i=0;i<r.length;i++)if(r[i].key===key&&!Array.isArray(r[i].children)){found=r[i];break;}
    if(found)found.grams=clamp(num(found.grams)+num(grams),0,5000);else{var p=dbProduct(key);r.push({id:key,key:key,name_ru:p&&(p.name_ru||p.name)||key,hei_category_key:p&&p.hei_category_key||'other',catalog_category_key:p&&p.catalog_category_key||'other',grams:num(grams)});}
    return r;
  }
  function reduceVirtual(raw,ref,grams){
    var r=normalizeRation(raw),left=num(grams);
    for(var i=0;i<r.length;i++){var it=r[i];if((it.id===ref||it.key===ref)&&!Array.isArray(it.children)){it.grams=Math.max(0,num(it.grams)-left);break;}}
    return r.filter(function(x){return num(x.grams)>0;});
  }
  function applyOpsVirtual(raw,ops){
    var r=normalizeRation(raw);
    arr(ops).forEach(function(op){
      if(op.type==='add')r=addToVirtual(r,op.product_id,op.grams);
      else if(op.type==='reduce')r=reduceVirtual(r,op.ref||op.product_id,op.grams);
      else if(op.type==='replace'){r=reduceVirtual(r,op.from_ref||op.from_product_id,op.from_grams);r=addToVirtual(r,op.to_product_id,op.to_grams);}
    });return r;
  }
  function analysisOf(raw){
    var before=calc(raw),tot=before.totals,def=[],exc=[],caveats=[];
    METRICS.forEach(function(m){var norm=normRaw(m.key);if(!(norm>0))return;var value=num(tot[m.key],0),ratio=value/norm,coverage=nutrientCoverage(raw,m.key,before);
      if(m.mode==='min'&&ratio<0.9){if(coverage<0.55){caveats.push({key:m.key,label:m.label,coverage:round(coverage,2),reason:'Недостаточное покрытие продуктовых карточек'});return;}def.push({key:m.key,label:m.label,unit:m.unit,value:round(value,2),norm:round(norm,2),ratio:round(ratio,3),gap:round(Math.max(0,norm-value),2),severity:round(clamp((0.9-ratio)/0.9,0,1),3),coverage:round(coverage,2),weight:m.weight});}
      if(m.mode==='max'&&ratio>1.05)exc.push({key:m.key,label:m.label,unit:m.unit,value:round(value,2),norm:round(norm,2),ratio:round(ratio,3),excess:round(Math.max(0,value-norm),2),severity:round(clamp((ratio-1.05)/1.5,0,1),3),coverage:round(coverage,2),weight:m.weight});
    });
    def.sort(function(a,b){return b.severity*b.weight-a.severity*a.weight;});exc.sort(function(a,b){return b.severity*b.weight-a.severity*a.weight;});
    return {before:before,deficits:def,excesses:exc,data_caveats:caveats,primary:def.concat(exc).slice(0,8)};
  }
  function structuralBenefits(p){var role=productRole(p),out=[];if(role==='vegetable')out.push('vegetables');if(role==='fruit')out.push('fruits');if(role==='grain'&&/whole/.test(String(p.hei_category_key||'')))out.push('whole_grains');if(role==='protein'&&/seafood|plant/.test(String(p.hei_category_key||'')))out.push('seafood_plant');return out;}
  function candidateMatrix(analysis,preferences){
    var currentKeys={};ration().forEach(function(x){currentKeys[x.key]=true;});
    var deficits=analysis.deficits.slice(0,8),excessMap={};analysis.excesses.forEach(function(x){excessMap[x.key]=x;});
    var candidates=[];
    dbItems().forEach(function(p){
      if(!p||!p.key||p.hidden_from_search===true||p.is_composite_food===true)return;var flags=productFlags(p),role=productRole(p);if(flags.excluded||flags.ingredient||blockedByConstraint(p,preferences)||role==='discretionary'||role==='drink'||role==='other')return;if(role==='protein'&&String(p.state||'').toLowerCase()==='raw'&&(flags.meat||flags.fish||flags.egg))return;
      var n=nutrient100(p),quality=sourceQuality(p),portionList=practicalPortions(p,role),referencePortion=portionList[Math.min(1,portionList.length-1)]||100,benefits=[],benefitScore=0;
      deficits.forEach(function(d){var v=num(n[d.key],0),atPortion=v*referencePortion/100;if(v<=0)return;var frac=clamp(atPortion/Math.max(d.gap,d.norm*0.08),0,1);if(frac>=0.05){benefits.push({key:d.key,label:d.label,per100:round(v,2),per_portion:round(atPortion,2),gap_share:round(frac,2)});benefitScore+=frac*d.weight*(0.75+d.severity);}});
      var structural=structuralBenefits(p);benefitScore+=structural.length*0.15;
      if(!benefits.length&&!structural.length)return;
      var kcal=num(n.kcal,0),sodium=num(n.sodium_mg,0),sfa=num(n.sfa_g,0),sugar=num(n.added_sugars_g,0),penalty=0;
      if(excessMap.sodium_mg)penalty+=clamp(sodium*referencePortion/100/500,0,1.8)*0.9;
      if(excessMap.sfa_g)penalty+=clamp(sfa*referencePortion/100/6,0,1.8)*0.9;
      if(excessMap.added_sugars_g)penalty+=clamp(sugar*referencePortion/100/15,0,1.8)*0.9;
      if(preferences.preserve_energy)penalty+=clamp(kcal*referencePortion/100/300,0,1.4)*0.4;
      if(flags.herb||flags.spice)penalty+=0.34;if(flags.organ)penalty+=0.45;if(flags.powder)penalty+=0.5;if(flags.processed)penalty+=0.25;if(flags.niche)penalty+=0.55;if(quality<0.5)penalty+=0.8;
      var practicality=1;if(flags.herb||flags.spice)practicality*=0.55;if(flags.organ)practicality*=0.65;if(flags.powder)practicality*=0.55;if(flags.dried)practicality*=0.78;if(flags.processed)practicality*=0.82;if(flags.niche)practicality*=0.62;if(flags.familiar)practicality=Math.min(1.12,practicality+0.12);
      var score=benefitScore*quality*practicality-penalty+(currentKeys[p.key]?-0.08:0.08);
      if(score<=0.04)return;
      candidates.push({product_id:p.key,name:text(p.name_ru||p.name||p.key,120),role:role,quality:round(quality,2),practicality:round(practicality,2),score:round(score,4),benefits:benefits.slice(0,5),structural:structural,portions:portionList,reference_portion_g:referencePortion,cautions:uniq([flags.organ?'Концентрированный продукт: оценивается только умеренная порция.':'',flags.herb||flags.spice?'Используется как небольшое дополнение, а не основная порция.':'',flags.powder?'Это ингредиент, а не самостоятельная обычная порция.':'',flags.processed?'Следует учитывать степень переработки продукта.':'']).filter(Boolean),risks:{kcal_per100:round(kcal,1),sodium_mg_per100:round(sodium,1),sfa_g_per100:round(sfa,2),added_sugars_g_per100:round(sugar,2)},already_in_ration:!!currentKeys[p.key]});
    });
    candidates.sort(function(a,b){return b.score-a.score||b.quality-a.quality;});
    var seen={},out=[];candidates.forEach(function(c){var sig=c.name.toLowerCase().replace(/\s*\([^)]*\)/g,'').replace(/[^a-zа-яё0-9]+/g,' ');if(seen[sig])return;seen[sig]=true;out.push(c);});
    return out.slice(0,30);
  }
  function portions(candidate){return arr(candidate&&candidate.portions).length?candidate.portions:practicalPortions(dbProduct(candidate&&candidate.product_id),candidate&&candidate.role);}
  function itemEnergyPerGram(it){var p=dbProduct(it&&it.key);if(!p)return 0;return num(nutrient100(p).kcal,0)/100;}
  function itemTargetValue(it,targetKeys){var p=dbProduct(it&&it.key);if(!p)return 0;var n=nutrient100(p),v=0;arr(targetKeys).forEach(function(k){v+=num(n[k],0)/100*num(it.grams);});return v;}
  function compensationOperation(raw,addedKcal,targetKeys){
    if(!(addedKcal>3))return null;var list=normalizeRation(raw).filter(function(it){return !Array.isArray(it.children)&&num(it.grams)>=20&&itemEnergyPerGram(it)>0.2;});
    list.sort(function(a,b){var pa=dbProduct(a.key),pb=dbProduct(b.key),ra=productRole(pa),rb=productRole(pb),wa=(ra==='discretionary'?3:ra==='fat'?2.2:ra==='grain'?1.3:1)-itemTargetValue(a,targetKeys)*0.0001,wb=(rb==='discretionary'?3:rb==='fat'?2.2:rb==='grain'?1.3:1)-itemTargetValue(b,targetKeys)*0.0001;return wb-wa;});
    for(var i=0;i<list.length;i++){var it=list[i],kpg=itemEnergyPerGram(it),g=round(addedKcal/kpg,1);var max=num(it.grams)*0.6;if(g>=5&&g<=max)return {type:'reduce',ref:it.id||it.key,product_id:it.key,grams:g,name:text((dbProduct(it.key)||{}).name_ru||it.name_ru||it.key,120)};}
    return null;
  }
  function metricState(before,after,analysis){
    var keys={kcal:true,protein_g:true,fiber_g:true,sodium_mg:true,sfa_g:true,added_sugars_g:true};analysis.deficits.slice(0,8).forEach(function(x){keys[x.key]=true;});analysis.excesses.slice(0,3).forEach(function(x){keys[x.key]=true;});
    var out={};Object.keys(keys).forEach(function(k){var a=num(before.totals[k],0),b=num(after.totals[k],0);out[k]={before:round(a,2),after:round(b,2),delta:round(b-a,2),norm:round(normRaw(k),2),label:(METRIC_BY_KEY[k]&&METRIC_BY_KEY[k].label)||(k==='kcal'?'Энергия':k),unit:(METRIC_BY_KEY[k]&&METRIC_BY_KEY[k].unit)||(k==='kcal'?'ккал':'')};});
    out.hei_total={before:before.hei_total==null?null:round(before.hei_total,1),after:after.hei_total==null?null:round(after.hei_total,1),delta:(before.hei_total==null||after.hei_total==null)?null:round(after.hei_total-before.hei_total,1),norm:null,label:'HEI‑2020',unit:'балла'};
    return out;
  }
  function scenarioScore(metrics,analysis,ops,quality,preferences){
    var score=0,improved=[],worsened=[];
    analysis.deficits.forEach(function(d){var m=metrics[d.key];if(!m)return;var usefulBefore=Math.min(m.before,d.norm),usefulAfter=Math.min(m.after,d.norm),imp=(usefulAfter-usefulBefore)/Math.max(d.gap,d.norm*0.08);if(imp>0.02)improved.push(d.key);score+=clamp(imp,-1,1)*d.weight*(1+d.severity);if(m.after<m.before-d.norm*0.03)worsened.push(d.key);});
    analysis.excesses.forEach(function(e){var m=metrics[e.key];if(!m)return;var imp=(m.before-m.after)/Math.max(e.excess,e.norm*0.08);if(imp>0.02)improved.push(e.key);score+=clamp(imp,-1,1)*e.weight*(1+e.severity);if(m.after>m.before+e.norm*0.03)worsened.push(e.key);});
    ['sodium_mg','sfa_g','added_sugars_g'].forEach(function(k){var m=metrics[k],limit=normRaw(k);if(!m||!(limit>0))return;if(m.before<=limit*1.05&&m.after>limit*1.05){worsened.push(k);score-=1.4;}else if(m.before>limit*1.05&&m.after>m.before+limit*0.02){worsened.push(k);score-=1;}});
    var hei=metrics.hei_total&&metrics.hei_total.delta;if(hei!=null)score+=clamp(hei/5,-1,1)*0.45;
    var energy=Math.abs(num(metrics.kcal&&metrics.kcal.delta,0));if(preferences.preserve_energy)score-=energy/Math.max(normRaw('kcal')||2000,1000)*8;else score-=energy/1000*0.25;
    var opPenalty=preferences.goal==='minimal'?0.42:0.16;score-=Math.max(0,ops.length-1)*opPenalty;score+=quality*0.25;
    if(preferences.goal==='replace')score+=ops.some(function(o){return o.type==='replace';})?0.5:-0.25;
    if(preferences.goal==='balanced'&&uniq(improved).length>=2)score+=0.22;
    return {score:round(score,4),improved:uniq(improved),worsened:uniq(worsened)};
  }
  function opLabel(op){if(op.type==='add')return 'Добавить '+op.name+' — '+round(op.grams,1)+' г';if(op.type==='reduce')return 'Уменьшить '+op.name+' — на '+round(op.grams,1)+' г';return 'Заменить '+op.from_name+' ('+round(op.from_grams,1)+' г) на '+op.to_name+' ('+round(op.to_grams,1)+' г)';}
  function buildScenario(raw,analysis,ops,quality,preferences,kind,label){
    if(ops.length>Math.max(1,num(preferences.max_changes,FEATURE_LEVEL===1?1:2)))return null;
    var virtual=applyOpsVirtual(raw,ops),after=calc(virtual),metrics=metricState(analysis.before,after,analysis),ss=scenarioScore(metrics,analysis,ops,quality,preferences);
    if(!ss.improved.length||ss.score<=0.02)return null;
    var critical=false;ss.worsened.forEach(function(k){var d=METRIC_BY_KEY[k];if(d&&d.weight>=1)critical=true;});if(critical)return null;
    var concentrated=ops.some(function(o){return productFlags(dbProduct(o.product_id||o.to_product_id)).concentratedRetinol;}),a=metrics.vitamin_a_mcg;if(concentrated&&a&&a.after>3000)return null;
    var id='sc_'+kind+'_'+ops.map(function(o){return o.type+':'+(o.product_id||o.to_product_id||'')+':'+round(o.grams||o.to_grams||0,0);}).join('_').replace(/[^a-zA-Z0-9_:.-]/g,'_');
    var cautions=[];ops.forEach(function(o){var f=productFlags(dbProduct(o.product_id||o.to_product_id));if(f.organ)cautions.push('Концентрированный субпродукт рассматривается только как умеренная пищевая порция, не как ежедневное назначение.');});
    return {scenario_id:id,kind:kind,label:label,operations:ops,operation_labels:ops.map(opLabel),metrics:metrics,score:ss.score,improved:ss.improved,worsened:ss.worsened,cautions:uniq(cautions),quality:round(quality,2),virtual_ration:virtual,verified:true,calculation_source:'NutritionCalculationCore+HEI',feature_level:FEATURE_LEVEL};
  }
  function replacementScenarios(raw,analysis,candidates,preferences){
    if(FEATURE_LEVEL<3)return [];var out=[],current=normalizeRation(raw).filter(function(x){return !Array.isArray(x.children)&&num(x.grams)>=25;}),top=candidates.slice(0,14);
    current.forEach(function(it){var fromP=dbProduct(it.key),role=productRole(fromP),from100=fromP?nutrient100(fromP):{},fromKcal=num(from100.kcal,0),fromProtein=num(from100.protein_g,0);if(role==='other'||role==='vegetable'||role==='fruit')return;
      top.forEach(function(c){if(c.product_id===it.key||c.role!==role)return;var toP=dbProduct(c.product_id),toFlags=productFlags(toP),fromSub=productSubrole(fromP),toSub=productSubrole(toP);if(toFlags.ingredient||toFlags.powder||toFlags.herb||toFlags.spice||toFlags.organ||toFlags.dried)return;if((role==='grain'||role==='dairy')&&fromSub!==toSub)return;var to100=toP?nutrient100(toP):{},basis=role==='protein'&&fromProtein>2&&num(to100.protein_g)>2?'protein':'energy',fromG=Math.min(num(it.grams),role==='fat'?15:100),toG=0;
        if(basis==='protein')toG=fromG*fromProtein/Math.max(num(to100.protein_g),0.1);else toG=fromG*fromKcal/Math.max(num(to100.kcal),1);
        toG=round(clamp(toG,role==='fat'?3:20,role==='fat'?30:250),1);
        var op={type:'replace',from_ref:it.id||it.key,from_product_id:it.key,from_name:text(fromP&&(fromP.name_ru||fromP.name)||it.name_ru||it.key,120),from_grams:round(fromG,1),to_product_id:c.product_id,to_name:c.name,to_grams:toG,basis:basis};
        var sc=buildScenario(raw,analysis,[op],Math.min(sourceQuality(fromP),c.quality)*num(c.practicality,1),preferences,'replace','Замена с сохранением роли продукта');if(sc)out.push(sc);
      });
    });return out;
  }
  function multiScenarios(raw,analysis,candidates,preferences){
    if(FEATURE_LEVEL<3)return [];var out=[],top=candidates.slice(0,10);
    for(var i=0;i<top.length;i++)for(var j=i+1;j<top.length;j++){var a=top[i],b=top[j],fa=productFlags(dbProduct(a.product_id)),fb=productFlags(dbProduct(b.product_id));if(a.role===b.role||fa.ingredient||fb.ingredient||fa.powder||fb.powder||fa.herb||fb.herb||fa.spice||fb.spice||(fa.organ&&fb.organ))continue;var pa=portions(a)[0],pb=portions(b)[0];if(a.role==='vegetable'||a.role==='fruit')pa=100;if(b.role==='vegetable'||b.role==='fruit')pb=100;
      var ops=[{type:'add',product_id:a.product_id,name:a.name,grams:pa},{type:'add',product_id:b.product_id,name:b.name,grams:pb}];
      if(preferences.preserve_energy){var tmp=calc(applyOpsVirtual(raw,ops)),added=num(tmp.totals.kcal)-num(analysis.before.totals.kcal),comp=compensationOperation(raw,added,analysis.deficits.slice(0,4).map(function(x){return x.key;}));if(comp)ops.push(comp);}
      var sc=buildScenario(raw,analysis,ops,Math.min(a.quality*num(a.practicality,1),b.quality*num(b.practicality,1)),preferences,'multi','Комбинация для нескольких слабых показателей');if(sc)out.push(sc);
    }return out;
  }
  function generateScenarios(raw,analysis,candidates,preferences){
    var out=[],targetKeys=analysis.deficits.slice(0,4).map(function(x){return x.key;});
    candidates.slice(0,18).forEach(function(c){portions(c).forEach(function(g){var ops=[{type:'add',product_id:c.product_id,name:c.name,grams:g}];
      if(FEATURE_LEVEL>=2&&preferences.preserve_energy){var kcal=num(c.risks.kcal_per100)*g/100,comp=compensationOperation(raw,kcal,targetKeys);if(comp)ops.push(comp);}
      var sc=buildScenario(raw,analysis,ops,c.quality*num(c.practicality,1),preferences,'add',FEATURE_LEVEL>=2&&preferences.preserve_energy?'Добавление с компенсацией калорийности':'Точечное добавление');if(sc)out.push(sc);
    });});
    if(FEATURE_LEVEL>=3)out=out.concat(replacementScenarios(raw,analysis,candidates,preferences),multiScenarios(raw,analysis,candidates,preferences));
    out.sort(function(a,b){return b.score-a.score||a.operations.length-b.operations.length;});
    var seen={},pool=[];out.forEach(function(s){var sig=s.operations.map(function(o){return o.type+':' +(o.product_id||o.to_product_id||'')+':' +(o.from_product_id||'');}).sort().join('|');if(seen[sig])return;seen[sig]=true;pool.push(s);});
    var max=FEATURE_LEVEL===1?2:3,final=[],usedProducts={},usedRoles={};
    function primaryProduct(sc){for(var j=0;j<sc.operations.length;j++){var o=sc.operations[j],k=o.to_product_id||o.product_id;if(o.type!=='reduce'&&k)return k;}return '';}
    function primaryRole(sc){var k=primaryProduct(sc);return productRole(dbProduct(k));}
    function everydayScenario(sc){var f=productFlags(dbProduct(primaryProduct(sc)));return !(f.organ||f.niche||f.ingredient||f.powder||f.herb||f.spice||f.processed);}
    function pushDistinct(sc,strictRole){if(!sc||final.indexOf(sc)>=0)return false;var k=primaryProduct(sc),r=primaryRole(sc);if((k&&usedProducts[k])||(strictRole&&r&&usedRoles[r]))return false;final.push(sc);if(k)usedProducts[k]=true;if(r)usedRoles[r]=true;return true;}
    function take(kind){for(var h=0;h<pool.length;h++)if(pool[h].kind===kind&&everydayScenario(pool[h])&&pushDistinct(pool[h],true))return;for(var i=0;i<pool.length;i++)if(pool[i].kind===kind&&pushDistinct(pool[i],true))return;for(var j=0;j<pool.length;j++)if(pool[j].kind===kind&&pushDistinct(pool[j],false))return;}
    if(FEATURE_LEVEL>=3){if(preferences.goal==='replace'){take('replace');take('add');take('multi');}else if(preferences.goal==='minimal'){take('add');take('replace');take('multi');}else{take('multi');take('add');take('replace');}}
    pool.forEach(function(x){if(final.length<max)pushDistinct(x,true);});pool.forEach(function(x){if(final.length<max)pushDistinct(x,false);});if(final.length<max)pool.forEach(function(x){if(final.length<max&&final.indexOf(x)<0)final.push(x);});return final.slice(0,max);
  }
  function localPattern(analysis){
    if(!analysis.deficits.length&&!analysis.excesses.length)return 'По доступным нормам выраженных отклонений не найдено; планировщик ищет улучшение структуры и разнообразия.';
    var a=analysis.deficits.slice(0,3).map(function(x){return x.label;}),b=analysis.excesses.slice(0,2).map(function(x){return x.label;});var s=[];if(a.length)s.push('Ниже ориентира: '+a.join(', ')+'.');if(b.length)s.push('Выше ориентира: '+b.join(', ')+'.');if(analysis.data_caveats&&analysis.data_caveats.length)s.push('Часть низких значений не использована как цель из-за недостаточного покрытия данных.');return s.join(' ');
  }
  function localNote(s,analysis){var names=s.operations.map(function(o){return o.name||o.to_name;}).filter(Boolean);var improved=s.improved.slice(0,3).map(function(k){return (METRIC_BY_KEY[k]&&METRIC_BY_KEY[k].label)||k;});return (names.length?'Вариант использует '+names.join(' и ')+'. ':'')+(improved.length?'По точному пересчёту улучшаются '+improved.join(', ')+'.':'');}
  function plannerPayload(raw,analysis,candidates,scenarios,preferences){
    return {protocol_version:'nutrition-ai-action-planner-v'+FEATURE_LEVEL,client_build:BUILD,feature_level:FEATURE_LEVEL,goal:preferences.goal,constraint_text:preferences.constraint,preserve_energy:preferences.preserve_energy,max_changes:preferences.max_changes,ration:normalizeRation(raw).map(function(x){return {key:x.key,name:text((dbProduct(x.key)||{}).name_ru||x.name_ru||x.key,100),grams:round(x.grams,1),role:productRole(dbProduct(x.key))};}),pattern:{local_summary:localPattern(analysis),deficits:analysis.deficits.slice(0,8),data_caveats:analysis.data_caveats.slice(0,4),excesses:analysis.excesses.slice(0,4)},candidate_matrix:candidates.slice(0,18),verified_scenarios:scenarios.map(function(s){return {scenario_id:s.scenario_id,label:s.label,kind:s.kind,operations:s.operations,score:s.score,improved:s.improved,worsened:s.worsened,metrics:s.metrics};})};
  }
  function callGemini(payload){
    if(typeof fetch!=='function')return Promise.resolve(null);activeController=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=setTimeout(function(){try{if(activeController)activeController.abort();}catch(_){}},30000);
    return fetch(API,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({action:'plan_ration',payload:payload}),signal:activeController?activeController.signal:undefined}).then(function(r){return r.text().then(function(t){var d=null;try{d=JSON.parse(t);}catch(_){}if(!r.ok||!d||d.ok!==true)throw new Error(d&&d.error||'Gemini недоступен');return d.result||null;});}).catch(function(){return null;}).then(function(x){clearTimeout(timer);return x;});
  }
  function mergeGemini(scenarios,g){
    var by={};scenarios.forEach(function(s){by[s.scenario_id]=s;});var order=[];arr(g&&g.ranked_scenario_ids).forEach(function(id){if(by[id]&&order.indexOf(id)<0)order.push(id);});scenarios.forEach(function(s){if(order.indexOf(s.scenario_id)<0)order.push(s.scenario_id);});
    var notes={};arr(g&&g.scenario_notes).forEach(function(n){if(n&&by[n.scenario_id])notes[n.scenario_id]={why:text(n.why,600),tradeoff:text(n.tradeoff,500)};});
    return order.map(function(id){var s=by[id];s.ai_note=notes[id]||{why:'',tradeoff:''};return s;});
  }
  function preferencesFromUi(){return {goal:($('aiPlannerGoal')&&$('aiPlannerGoal').value)||'balanced',constraint:text($('geminiAiConstraint')&&$('geminiAiConstraint').value,600),preserve_energy:!!($('aiPlannerPreserveEnergy')&&$('aiPlannerPreserveEnergy').checked),max_changes:num($('aiPlannerMaxChanges')&&$('aiPlannerMaxChanges').value,FEATURE_LEVEL===1?1:2)};}
  function savePreferences(p){try{localStorage.setItem(STORAGE,JSON.stringify(p));}catch(_){}}
  function loadPreferences(){try{var p=JSON.parse(localStorage.getItem(STORAGE)||'null');if(!p)return; if($('aiPlannerGoal')&&p.goal)$('aiPlannerGoal').value=p.goal;if($('geminiAiConstraint'))$('geminiAiConstraint').value=p.constraint||'';if($('aiPlannerPreserveEnergy'))$('aiPlannerPreserveEnergy').checked=!!p.preserve_energy;if($('aiPlannerMaxChanges')&&p.max_changes)$('aiPlannerMaxChanges').value=String(p.max_changes);}catch(_){}}
  function fmt(v,unit){if(v==null||!Number.isFinite(Number(v)))return '—';var n=Number(v),d=Math.abs(n)>=100?0:Math.abs(n)>=10?1:2;return round(n,d)+(unit?' '+unit:'');}
  function metricRows(s){
    var keys=uniq(s.improved.concat(['kcal','protein_g','sodium_mg','sfa_g','hei_total'])).slice(0,7),html='';keys.forEach(function(k){var m=s.metrics[k];if(!m)return;var delta=m.delta,cls=delta==null?'':(s.improved.indexOf(k)>=0?'good':s.worsened.indexOf(k)>=0?'bad':'neutral');html+='<div class="ai-plan-metric '+cls+'"><span>'+esc(m.label)+'</span><strong>'+esc(fmt(m.before,m.unit))+' → '+esc(fmt(m.after,m.unit))+'</strong><em>'+esc(delta==null?'':((delta>0?'+':'')+fmt(delta,m.unit)))+'</em></div>';});return html;
  }
  function render(result){
    var out=$('geminiAiOutput');if(!out)return;var g=result.gemini||{},html='<div class="ai-plan-summary"><strong>Что обнаружено</strong><p>'+esc(text(g.pattern_summary,1000)||localPattern(result.analysis))+'</p></div>';
    if(!result.scenarios.length)html+='<div class="ai-plan-empty"><strong>Проверяемый вариант не найден</strong><p>В базе нет решения, которое одновременно улучшает выбранные показатели и проходит расчётную проверку. Попробуйте ослабить ограничения.</p></div>';
    result.scenarios.forEach(function(s,index){var note=s.ai_note||{},trade=note.tradeoff||((s.worsened.length)?'Есть ухудшения, показанные в таблице ниже.':'Критических ухудшений по проверенным показателям не обнаружено.');html+='<article class="ai-plan-card" data-scenario-id="'+esc(s.scenario_id)+'"><header><span>Вариант '+(index+1)+'</span><h3>'+esc(s.label)+'</h3><b>проверен ядром</b></header><div class="ai-plan-ops">'+s.operation_labels.map(function(x){return '<div>'+esc(x)+'</div>';}).join('')+'</div><p class="ai-plan-why">'+esc(note.why||localNote(s,result.analysis))+'</p><div class="ai-plan-metrics">'+metricRows(s)+'</div>'+(s.cautions&&s.cautions.length?'<p class="ai-plan-caution"><strong>Важно:</strong> '+esc(s.cautions.join(' '))+'</p>':'')+'<p class="ai-plan-tradeoff"><strong>Компромисс:</strong> '+esc(trade)+'</p>'+(FEATURE_LEVEL>=2?'<button type="button" class="ai-plan-apply" data-apply-scenario="'+esc(s.scenario_id)+'">Применить этот вариант</button>':'')+'</article>';});
    if(FEATURE_LEVEL>=3&&result.candidates.length)html+='<details class="ai-plan-candidates"><summary>Почему выбраны именно эти продукты</summary>'+result.candidates.slice(0,8).map(function(c){return '<div><strong>'+esc(c.name)+'</strong><span>'+esc(c.benefits.slice(0,3).map(function(b){return b.label;}).join(', '))+'</span><em>качество '+esc(String(c.quality))+'</em></div>';}).join('')+'</details>';
    out.innerHTML=html;out.hidden=false;var clear=$('geminiAiClearBtn');if(clear)clear.hidden=false;
  }
  function applyScenario(id){
    if(!currentResult)return false;var s=null;currentResult.scenarios.forEach(function(x){if(x.scenario_id===id)s=x;});if(!s||!window.State)return false;var api=window.State,batch=typeof api.beginAddBatch==='function'&&typeof api.endAddBatch==='function';if(batch)api.beginAddBatch('ai-nutrition-planner');
    try{s.operations.forEach(function(op){if(op.type==='add')api.add(op.product_id,op.grams,{source_type:'ai_verified_planner',planner_version:BUILD});else if(op.type==='reduce'){var list=api.get(),it=null;arr(list).forEach(function(x){if(!it&&(x.id===op.ref||x.key===op.ref||x.key===op.product_id))it=x;});if(it){var next=Math.max(0,num(it.grams)-num(op.grams));if(next>0)api.update(it.id||it.key,next);else api.remove(it.id||it.key);}}else if(op.type==='replace'){var list2=api.get(),from=null;arr(list2).forEach(function(x){if(!from&&(x.id===op.from_ref||x.key===op.from_product_id))from=x;});if(from){var next2=Math.max(0,num(from.grams)-num(op.from_grams));if(next2>0)api.update(from.id||from.key,next2);else api.remove(from.id||from.key);}api.add(op.to_product_id,op.to_grams,{source_type:'ai_verified_planner',planner_version:BUILD});}});}finally{if(batch)api.endAddBatch('ai-nutrition-planner',{scenario_id:id});}
    setTimeout(function(){var status=$('geminiAiStatus');if(status)status.textContent='Вариант применён. Основной расчёт обновлён; прежние сценарии помечены как устаревшие.';if($('geminiAiOutput'))$('geminiAiOutput').classList.add('is-stale');},50);return true;
  }
  function run(){
    if(running)return;var raw=ration(),status=$('geminiAiStatus'),out=$('geminiAiOutput');if(!raw.length){if(status)status.textContent='Сначала добавьте продукты в рацион.';return;}running=true;if(out){out.hidden=true;out.innerHTML='';out.classList.remove('is-stale');}if(status)status.textContent='Идёт локальный поиск продуктов и точный пересчёт вариантов…';var prefs=preferencesFromUi();if(FEATURE_LEVEL===1){prefs.max_changes=1;prefs.preserve_energy=false;}savePreferences(prefs);
    setTimeout(function(){try{var analysis=analysisOf(raw),candidates=candidateMatrix(analysis,prefs),scenarios=generateScenarios(raw,analysis,candidates,prefs);var payload=plannerPayload(raw,analysis,candidates,scenarios,prefs);if(status)status.textContent='Проверенные варианты готовы. Gemini выбирает наиболее осмысленную подачу…';callGemini(payload).then(function(g){scenarios=mergeGemini(scenarios,g);currentResult={analysis:analysis,candidates:candidates,scenarios:scenarios,gemini:g||null,payload:payload};render(currentResult);if(status)status.textContent=g?'Готово: варианты рассчитаны ядром, Gemini объяснил выбор.':'Готово: показаны локально рассчитанные варианты; Gemini сейчас недоступен.';running=false;});}catch(e){running=false;if(status)status.textContent='Не удалось построить варианты: '+text(e&&e.message||e,300);}},30);
  }
  function clearOutput(){currentResult=null;var o=$('geminiAiOutput');if(o){o.hidden=true;o.innerHTML='';o.classList.remove('is-stale');}var s=$('geminiAiStatus');if(s)s.textContent='';var c=$('geminiAiClearBtn');if(c)c.hidden=true;}
  function bind(){var runBtn=$('geminiAiRunBtn'),clear=$('geminiAiClearBtn'),out=$('geminiAiOutput');if(runBtn)runBtn.addEventListener('click',run);if(clear)clear.addEventListener('click',clearOutput);if(out)out.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-apply-scenario]');if(b)applyScenario(b.getAttribute('data-apply-scenario'));});loadPreferences();['ration:changed','needs:changed','norm:region-changed'].forEach(function(ev){window.addEventListener(ev,function(){if(currentResult&&$('geminiAiOutput'))$('geminiAiOutput').classList.add('is-stale');});});}
  var API_PUBLIC={version:VERSION,build:BUILD,featureLevel:FEATURE_LEVEL,analysisOf:analysisOf,candidateMatrix:candidateMatrix,generateScenarios:generateScenarios,applyOpsVirtual:applyOpsVirtual,applyScenario:applyScenario,productRole:productRole,run:run,getCurrentResult:function(){return currentResult;}};
  window['AINutritionPlannerV'+BUILD.replace(/\D/g,'')]=API_PUBLIC;window.AINutritionPlanner=API_PUBLIC;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
