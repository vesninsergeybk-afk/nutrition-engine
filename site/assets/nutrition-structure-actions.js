// Small, deterministic what-if checks for a SINGLE entered set of foods.
// Never changes user's ration, targets, or HEI/structure scoring algorithms.
const GROUPS=[
  {id:'vegetables',title:'Овощи',grams:150,pattern:/брокколи|морков|капуст|томат|помидор|огурец|шпинат|св[её]кл/i,valid:p=>/vegetable|greens_beans/i.test(String(p.hei_category_key||''))||/vegetable|овощ/i.test(String(p.category||''))},
  {id:'fruits',title:'Фрукты',grams:150,pattern:/яблок|груш|апельсин|банан|ягод|ревен|слив[аыу]/i,valid:p=>/fruit/i.test(String(p.hei_category_key||''))||/fruit|фрукт/i.test(String(p.category||''))},
  {id:'wholegrains',title:'Цельные злаки',grams:100,pattern:/овсян|гречнев|гречк|бурый рис|коричневый рис|цельнозернов|булгур|перлов/i,valid:p=>Number(p.whole_grain_oz_eq_per_100g)>0||/whole.?grain/i.test(String(p.hei_category_key||''))},
  {id:'legumes',title:'Бобовые',grams:120,pattern:/чечевиц|нут\b|фасол|горох/i,valid:p=>/legume|beans/i.test(String(p.hei_category_key||''))||(Array.isArray(p.tags)&&p.tags.some(t=>/legume|beans/i.test(String(t))))},
  {id:'dairy',title:'Молочные продукты',grams:150,pattern:/кефир|йогурт|молоко|ряженк/i,valid:p=>/dairy/i.test(String(p.hei_category_key||''))&&Number(p.dairy_cup_eq_per_100g)>0}
];
const round=(n,p=1)=>Math.round(n*10**p)/10**p;
function eligible(p,group,profile){
  if(!p||!p.key||String(p.key).startsWith('local:'))return false;
  if(profile?.diet_style==='no_dairy'&&group.id==='dairy')return false;
  const review=p.data_quality_v1_3?.review_status;
  if(review&&review!=='VERIFIED')return false;
  const n=String(p.name_ru||p.name||'').trim();
  if(!n||!group.pattern.test(n)||!group.valid(p))return false;
  if(/комплекс|торт|печенье|конфет|салат с|запеканк|пирог|сироп|с сахаром|шоколад|заменитель|концентрат|сухое молоко|детское питание|для детей|смесь для|meal|mixed dish/i.test(n))return false;
  if((group.id==='wholegrains'||group.id==='legumes')&&/сырой|сухой|неготов|uncooked|raw|dry|flour|мука/i.test(n))return false;
  const energy=Number(p.kcal);
  if(!Number.isFinite(energy)||energy<=0||energy*group.grams/100>300)return false;
  return true;
}
function candidates(engine,profile,ration){
 const products=Array.isArray(engine?.db?.items)?engine.db.items:[], used=new Set((ration||[]).map(e=>e.key)),selected=[];
 for(const group of GROUPS){
   const possible=products.filter(p=>!used.has(p.key)&&eligible(p,group,profile)).sort((a,b)=>{
     const name=x=>String(x.name_ru||x.name||'');
     const score=x=>/варен|отвар|готов|cooked|boiled|без сахар|натуральн/i.test(name(x))?0:1;
     return score(a)-score(b)||name(a).length-name(b).length;
   }).slice(0,2);
   for(const p of possible)selected.push({group,p,grams:group.grams});
 }
 return selected.slice(0,10);
}
export function assessStructureScenarios(result,model,engine,ration,profile,calculateStructureProfile){
 if(!model||!Number.isFinite(model.structure)||!Number.isFinite(model.hei))
   return {status:'unavailable',items:[],message:'Невозможно сравнить изменения: структурная оценка не рассчитана.'};
 if(result?.needs?.policy?.protectedMode||result?.needs?.meta?.normsSyncAllowed===false||
   (profile?.state&&profile.state!=='normal')||(profile?.guardrail&&profile.guardrail!=='none')||
   profile?.additional_medical_restriction||profile?.additional_ed_risk||profile?.additional_clinical_conditions||
   (Number(profile?.age)>0&&Number(profile.age)<18)){
   return {status:'restricted',items:[],message:'Для выбранных медицинских или особых условий автоматические варианты изменения рациона не предлагаются.'};
 }
 if(!Array.isArray(ration)||!ration.length)return {status:'unavailable',items:[],message:'Сначала добавьте продукты.'};
 const suggestions=[];
 const baselineKcal=Number(result?.totals?.kcal);
 for(const {p,group,grams} of candidates(engine,profile,ration)){
   const variant=ration.map(x=>({...x}));
   variant.push({key:p.key,grams,unit:'g'});
   try{
     const after=engine.analyze(variant);
     after.references=result.references;
     after.needs=result.needs;
     const updated=calculateStructureProfile(after,engine,variant);
     if(!updated||!Number.isFinite(updated.hei)||!Number.isFinite(updated.structure))continue;
     const deltaHei=round(updated.hei-model.hei),deltaStructure=round(updated.structure-model.structure);
     if(deltaHei<-.05||deltaStructure<-.05||Math.max(deltaHei,deltaStructure)<.5)continue;
     const deltaKcal=Number(after.totals?.kcal)-baselineKcal;
     if(!Number.isFinite(deltaKcal)||deltaKcal<=0||deltaKcal>300)continue;
     suggestions.push({key:p.key,name:String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru||p.name),category:group.title,grams,
       deltaHei,deltaStructure,deltaKcal:round(deltaKcal,0),
       both:deltaHei>=.5&&deltaStructure>=.5});
   }catch{continue;}
 }
 suggestions.sort((a,b)=>Number(b.both)-Number(a.both)||
   (Math.min(b.deltaHei,b.deltaStructure)-Math.min(a.deltaHei,a.deltaStructure))||
   (b.deltaHei+b.deltaStructure-a.deltaHei-a.deltaStructure));
 // Keep variety: do not fill the result with near-identical products.
 const seen=new Set(),unique=[];
 for(const s of suggestions){if(seen.has(s.category))continue;seen.add(s.category);unique.push(s);if(unique.length===3)break;}
 return {status:unique.length?'ready':'none',items:unique,
   message:unique.length?'Проверены возможные добавления продуктов к введённому набору. Это учебные сравнения, не назначение питания.':
    'Среди продуктов доступного справочника не удалось найти простой вариант добавления, который повышает хотя бы одну оценку без снижения другой.'};
}
export function renderStructureScenarios(data,fmt,esc,options={}){
 if(!data)return '';
 const items=data.items||[];
 const cards=items.map((item,index)=>{
   const group=esc(item.category),name=esc(item.name),grams=esc(fmt(item.grams,0));
   const type=item.both?'Обе оценки повышаются':(item.deltaHei>=.5?'Повышается HEI-2020':'Повышается оценка структуры');
   const metric=(title,val)=>'<div><small>'+esc(title)+'</small><strong>'+(val>0?'+':'')+esc(fmt(val,1))+'<em> балла</em></strong></div>';
   return '<article class="nut-structure-scenario" data-scenario-group="'+esc(item.category)+'">'+
     '<div class="nut-structure-scenario-top"><span class="nut-structure-scenario-rank">Вариант '+(index+1)+'</span><span class="nut-structure-scenario-result">'+esc(type)+'</span></div>'+
     '<p class="nut-structure-scenario-eyebrow">Пищевая группа</p><h5>'+group+'</h5>'+
     '<p class="nut-structure-scenario-example"><strong>Пример:</strong> '+name+' · '+grams+' г</p>'+
     '<p class="nut-structure-scenario-metric-title">Если добавить этот продукт к введённому рациону:</p>'+
     '<div class="nut-structure-scenario-scores">'+metric('HEI-2020',item.deltaHei)+metric('Структура рациона',item.deltaStructure)+
     '<div class="nut-structure-scenario-energy"><small>Дополнительно</small><strong>+'+esc(fmt(item.deltaKcal,0))+' ккал</strong></div></div>'+
     '</article>';
 }).join('');
 const note=items.length?'Сначала показаны варианты, повышающие обе оценки. Для каждого примера баллы действительно пересчитаны по выбранной порции продукта.':
   'Расчёт не нашёл подходящих вариантов среди доступных проверенных продуктов.';
 return '<section class="nut-structure-scenarios" aria-label="Пробные изменения структуры рациона">'+
   '<div class="nut-structure-scenarios-heading"><div><span class="nut-viz-eyebrow">ПРОБНЫЕ ИЗМЕНЕНИЯ</span><h4>Какие группы продуктов могут повысить оценки?</h4></div></div>'+
   '<p>'+esc(data.message)+'</p>'+(items.length?'<p class="nut-structure-scenario-summary">'+esc(note)+'</p><div class="nut-structure-scenario-grid">'+cards+'</div>':'')+
   '<p class="nut-structure-scenario-note">Это сравнение вариантов, а не готовый план питания. В расчёте учитывается только введённый набор продуктов. Добавление увеличивает общую калорийность, а повышение баллов само по себе не означает улучшения здоровья. При необходимости уточните состав продуктов и полный суточный рацион.</p></section>';
}