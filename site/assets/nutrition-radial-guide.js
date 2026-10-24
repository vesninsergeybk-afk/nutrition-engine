import {getRadialKnowledge} from './nutrition-radial-knowledge.js?v=guide-20261011-en1';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const aliases={fiber_g:'fiber'};
const methods=new Set(['MEASURED','LABEL','CALCULATED','SOURCE_REPORTED','BORROWED','IMPUTED']);
function foodNutrient(engine,p,key){
 if(!p)return null;
 try{
  const field=engine.quality.fieldName(aliases[key]||key),v=p[field];
  const method=engine.quality.methodFor(p,field);
  return finite(v)&&v>=0&&methods.has(method)?{value:v,method}:null;
 }catch{return null;}
}
export function radialFoodContributors(engine,ration,key){
 let unknown=0;
 const sources=[];
 for(const it of ration||[]){
  const p=engine.db.byKey.get(it.key),data=foodNutrient(engine,p,key),grams=Number(it.grams);
  if(!data||!finite(grams)||grams<=0){unknown++;continue;}
  if(data.value<=0)continue;
  sources.push({key:it.key,name:String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru||p.name||it.key),
   per100:data.value,amount:data.value*grams/100,grams,method:data.method});
 }
 sources.sort((a,b)=>b.amount-a.amount);
 return {items:sources.slice(0,6),unknown};
}
export function radialFoodSecondaryEffects(engine,food,model,primaryKey){
 if(!Array.isArray(model?.items))return [];
 return model.items.filter(n=>n.key!==primaryKey&&n.ref>0&&n.pct!==null&&n.pct<100)
  .map(n=>{
    const source=foodNutrient(engine,food,n.key);
    const delta=source&&source.value>0?source.value/n.ref*100:0;
    return {name:n.name,delta:Math.round(delta*10)/10,shortfall:100-n.pct,
       benefit:Math.max(0,Math.min(100-n.pct,delta))};
  }).filter(n=>n.delta>=3).sort((a,b)=>b.benefit-a.benefit||b.delta-a.delta)
  .slice(0,3);
}
export function radialCatalogFoods(engine,key,exclude=[],model=null){
 const excluded=new Set(exclude),options=[];
 for(const p of engine.db?.items||[]){
  if(!p?.key||excluded.has(p.key)||p.key.startsWith('local:'))continue;
  const status=engine.quality.classifyProduct(p).review_status;
  if(status==='BLOCKED')continue;
  const title=String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru||p.name||'');
  if(!title||/добавк|капсул|таблет|концентрат|витаминный комплекс|порошок|сироп|экстракт|специали[зс]ированн|комплексный препарат|молот|приправ|специ|пряност|шафран|суш[её]н|кофе|какао-порошок/i.test(title))continue;
  const data=foodNutrient(engine,p,key);
  if(!data||data.value<=0||!['MEASURED','LABEL','CALCULATED','SOURCE_REPORTED'].includes(data.method))continue;
  const primaryRef=model?.items?.find(item=>item.key===key)?.ref;
  if(primaryRef>0&&data.value/primaryRef<.1)continue;
  const other=radialFoodSecondaryEffects(engine,p,model,key);
  options.push({key:p.key,name:title,per100:data.value,energy:finite(p.kcal)?p.kcal:null,
    confirmed:status==='VERIFIED',other,
    multiScore:other.reduce((sum,n)=>sum+n.benefit,0)});
 }
 options.sort((a,b)=>Number(b.confirmed)-Number(a.confirmed)||(model?b.multiScore-a.multiScore:0)||b.per100-a.per100||a.name.localeCompare(b.name,'ru'));
 // Keep a broad but bounded range of plausible food sources. Verified records appear first.
 // Entries still requiring review retain their explicit caveat.
 const seen=new Set(),unique=[];
 for(const item of options){
  const normalized=item.name.toLowerCase().replace(/\s*\([^)]*\)/g,'').slice(0,42);
  if(seen.has(normalized))continue;
  seen.add(normalized);unique.push(item);
  if(unique.length>=60)break;
 }
 return unique;
}
const typeLabel=t=>t==='AI'?'AI — ориентировочное достаточное потребление':
 t==='RDA'?'RDA — рекомендуемое поступление':
 t==='PRI'?'PRI — популяционный ориентир достаточного поступления':
 t==='AR'?'AR — средняя потребность':
 t?String(t)+' — расчётный ориентир':'Расчётный ориентир';
export function renderRadialNutrientGuide(nutrient,engine,ration,fmt,esc,model=null){
 if(!nutrient)return '<p>Для этого показателя нет данных.</p>';
 const k=getRadialKnowledge(nutrient.key),source=radialFoodContributors(engine,ration,nutrient.key);
 const foodOptions=radialCatalogFoods(engine,nutrient.key,(ration||[]).map(x=>x.key),model);
 const unit=nutrient.unit;
 const show=n=>esc(fmt(n,2));
 const row=(label,value)=>'<div class="nut-radial-guide-fact"><span>'+esc(label)+'</span><strong>'+value+'</strong></div>';
 const metrics='<div class="nut-radial-guide-metrics">'+
   row('Во введённых продуктах',nutrient.value===null?'Недостаточно данных':show(nutrient.value)+' '+esc(unit))+
   row(typeLabel(nutrient.refType),nutrient.ref===null?'Нет ориентира':show(nutrient.ref)+' '+esc(unit))+
   row('Доля ориентира',nutrient.pct===null?'Не рассчитана':esc(fmt(nutrient.pct,1))+'%')+
   '</div>';
 const userFoods=source.items.length?'<ol class="nut-radial-guide-foods">'+source.items.map(p=>
   '<li><strong>'+esc(p.name)+'</strong><span>'+show(p.amount)+' '+esc(unit)+' в '+esc(fmt(p.grams,0))+' г вашей порции</span>'+
   '<small>'+show(p.per100)+' '+esc(unit)+' на 100 г'+
   (['BORROWED','IMPUTED'].includes(p.method)?' · приблизительная запись':'')+'</small></li>').join('')+'</ol>':
   '<p class="nut-radial-guide-muted">Введённые продукты не содержат пригодных положительных значений этого вещества в справочнике.</p>';
 const otherFoods=foodOptions.length?'<ol class="nut-radial-guide-foods nut-radial-guide-foods-scroll" tabindex="0" aria-label="Прокручиваемый список продуктов-источников">'+foodOptions.map(p=>
   '<li><strong>'+esc(p.name)+'</strong><span>'+show(p.per100)+' '+esc(unit)+' на 100 г'+(nutrient.ref!==null?' · '+esc(fmt(p.per100/nutrient.ref*100,0))+'% от ориентира':'')+'</span>'+
     (p.energy!==null?'<small>Дополнительно примерно '+esc(fmt(p.energy,0))+' ккал на 100 г</small>':'')+
     (p.other?.length?'<small class="nut-radial-guide-extra">Также увеличится расчётное поступление: '+
       p.other.map(e=>esc(e.name)+' (+'+esc(fmt(e.delta,0))+' п. п. от ориентира)').join('; ')+'.</small>':'')+
     (!p.confirmed?'<small>Предварительная справочная карточка; сведения нуждаются в проверке</small>':'')+'</li>').join('')+'</ol>':'';
 const kFoods=k?.foods?'<p>'+esc(k.foods)+'</p>':'';
 const status=nutrient.pct===null?'Нет надёжного сравнения с ориентиром':
   nutrient.status==='uncertain'?'По предварительным данным относительно выбранного ориентира. Оценку следует уточнить по источникам состава.':
   nutrient.status==='upper'?'Превышен применимый верхний уровень; это не диагноз.':
   nutrient.pct<100?'Поступление в введённом наборе ниже выбранного ориентира. Это не медицинский дефицит.':
   'Выбранный ориентир достигнут. Значения выше 100% не считаются неблагоприятными автоматически.';
 return '<header class="nut-radial-guide-head"><span class="nut-viz-eyebrow">'+esc(nutrient.groupName)+'</span><h2 id="nut-radial-dialog-title">'+esc(nutrient.name)+'</h2>'+
   '<p class="nut-radial-guide-status">'+esc(status)+'</p></header>'+
   metrics+
   '<section class="nut-radial-guide-section"><h3>Для чего нужен организму</h3><p>'+esc(k?.role||'Этот компонент участвует в физиологических процессах организма.')+'</p>'+
   (k?.note?'<p class="nut-radial-guide-note">'+esc(k.note)+'</p>':'')+'</section>'+
   '<section class="nut-radial-guide-section"><h3>Откуда поступает в вашем рационе</h3>'+userFoods+
   (source.unknown?'<p class="nut-radial-guide-muted">Для '+source.unknown+' продуктовых записей вклад не удалось уточнить. Показаны только значения с указанным происхождением.</p>':'')+'</section>'+
   '<section class="nut-radial-guide-section"><h3>В каких продуктах содержится</h3>'+kFoods+
   (foodOptions.length?'<p class="nut-radial-guide-food-count">В справочнике найдено подходящих продуктов: <strong>'+foodOptions.length+'</strong>. Прокрутите список, чтобы просмотреть варианты.</p>':'')+
   (otherFoods?'<h4>Примеры из продуктового справочника</h4>'+otherFoods:
     '<p class="nut-radial-guide-muted">Для количественного сравнения примеров в доступном справочнике пока недостаточно данных. Общие источники перечислены выше.</p>')+
   '<p class="nut-radial-guide-muted">Это сравнение добавления 100 г к уже введённому набору, а не рекомендация съесть такую порцию. Продукт дополнительно увеличивает калорийность, а качество справочных данных и индивидуальная биодоступность могут влиять на результат.</p></section>'+
   '<section class="nut-radial-guide-section"><h3>Как читать ваши данные</h3><p>'+esc(nutrient.quality)+'. '+
   'Доля от ориентира относится только к введённым продуктам, а не обязательно ко всему дню. По одному дню нельзя заключить о клиническом дефиците или избытке.</p>'+
   (nutrient.upper?'<p>Для этого вещества указан применимый верхний уровень общего поступления: '+show(nutrient.upper.value)+' '+esc(unit)+'. Для оценки риска необходимо учитывать регулярность и качество данных.</p>':'')+
   (k?.url?'<p><a href="'+esc(k.url)+'" target="_blank" rel="noopener noreferrer">Научная справка NIH ODS (англ.) ↗</a></p>':'')+'</section>';
}
