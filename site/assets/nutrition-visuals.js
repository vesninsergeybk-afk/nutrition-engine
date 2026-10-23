// Визуальный слой анализа рациона VesninMed.
import {buildHeiProductBreakdown,componentHeiContributors,heiTone,nutrientTone,renderHeiProductBreakdown} from './nutrition-hei-details.js?v=hei-explain-20261010-a-en1';
// Использует только результаты действующего engine.analyze() и engine.references().
// Не рассчитывает новых норм, HEI, «дефицитов» или авторских индексов.
const finite = n => typeof n === 'number' && Number.isFinite(n);
const pct = (value,max) => finite(value) && finite(max) && max > 0 ? value/max*100 : NaN;
const cap = n => Math.max(0,Math.min(100,n));
const aliases = {fiber_g:'fiber',sugars_g:'sugar',unsat_g:'unsaturated_fat_g'};
const heroKeys = ['kcal','protein_g','fat_g','carbs_g'];
const focusKeys = ['fiber_g','calcium_mg','iron_mg','magnesium_mg','potassium_mg','zinc_mg','vitamin_d_mcg','vitamin_b9_mcg','vitamin_b12_mcg'];

function bar(value,maximum,label,esc,tone='neutral') {
  const percent=pct(value,maximum);
  return finite(percent)
    ? '<span class="nut-viz-track" data-tone="'+esc(tone)+'" role="img" aria-label="'+esc(label+': заполнение шкалы '+Math.round(percent)+'%')+'"><span style="width:'+cap(percent).toFixed(2)+'%"></span></span>'
    : '<span class="nut-viz-track is-unknown" aria-hidden="true"></span>';
}
function qualityFor(engine,items,key) {
  try{return engine.quality.nutrientAnalysis(items,engine.db,aliases[key]||key);}
  catch{return null;}
}
function actualFor(result,engine,items,key) {
  const quality=qualityFor(engine,items,key);
  const total=result?.totals?.[key];
  return {quality,actual:finite(total) && items.length>0 && quality && quality.missing_products<items.length ? total : NaN};
}
function statusText(quality,hasData){
  if(!hasData)return 'Нет пригодных данных';
  if(quality?.missing_products)return 'Неполный состав';
  if(quality?.assumed_zero_products)return 'Есть условные нули';
  if(quality?.confidence_tier==='LOW')return 'Ориентировочно';
  return 'По данным каталога';
}

const upperLimitKeys = new Set(['sfa_g','added_sugars_g']);
export const isUpperNutrientLimit = (key,reference) =>
  upperLimitKeys.has(key) || /^(maximum|maximum_proxy|upper_limit)$/i.test(String(reference?.type||''));

export function nutrientDataAudit(engine,items,key,esc){
  const quality=qualityFor(engine,items,key),api=engine?.quality;
  if(!quality || !api?.fieldName || !api?.methodFor)return {label:'Нет сведений о качестве данных',detail:''};
  const field=api.fieldName(aliases[key]||key),missing=[],assumed=[],estimated=[];
  for(const entry of (items||[])){
    const p=engine.db.byKey.get(entry.key),name=String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p?.name_ru||p?.name||entry.key||'Неизвестный продукт');
    if(!p){missing.push(name);continue;}
    const method=api.methodFor(p,field);
    if(method==='ASSUMED_ZERO')assumed.push(name);
    else if(method==='MISSING'||!finite(p[field]))missing.push(name);
    else if(method==='BORROWED'||method==='IMPUTED')estimated.push(name);
  }
  const productCount=n=>n+' '+(n%100>=11&&n%100<=14?'продуктов':n%10===1?'продукт':n%10>=2&&n%10<=4?'продукта':'продуктов');
  const flags=[];
  if(missing.length)flags.push('Нет данных: '+productCount(missing.length));
  if(assumed.length)flags.push('Условные нули: '+productCount(assumed.length));
  if(estimated.length)flags.push('Приближённые данные: '+productCount(estimated.length));
  const label=flags.length?flags.join(' · '):quality.confidence_tier==='LOW'?'Достоверность требует проверки':
    quality.confidence_tier==='MEDIUM'?'Приближённая справочная оценка':'Данные доступны в каталоге';
  const group=(name,values,explanation)=>values.length?
    '<li><strong>'+esc(name)+'</strong> — '+esc(values.join(', '))+'. '+esc(explanation)+'</li>':'';
  const content=group('Нет числовых данных',missing,'По этим продуктам нельзя определить поступление вещества.')+
    group('Условно принято за ноль',assumed,'Отсутствие вещества в продукте не подтверждено; итог может быть занижен.')+
    group('Приближённые значения',estimated,'Сведения заимствованы из похожих продуктов или восстановлены расчётным способом.');
  const detail=content?'<details class="nut-viz-quality-audit"><summary>Какие данные требуют внимания</summary><ul>'+content+'</ul></details>':'';
  return {label,detail};
}
function nutrientDisplayTone(key,actual,reference,quality){
  if(quality?.confidence_tier==='LOW')return {code:'unknown',label:'Достоверность требует проверки'};
  if(!isUpperNutrientLimit(key,reference))return nutrientTone(actual,reference?.value,quality);
  const upper=reference?.value;
  if(!finite(actual)||!finite(upper)||upper<=0||quality?.missing_products||quality?.assumed_zero_products)
    return {code:'unknown',label:'Нельзя надёжно сравнить с пределом'};
  return actual>upper?{code:'low',label:'Выше верхнего ориентира'}:{code:'good',label:'В пределах верхнего ориентира'};
}

function metricCard(result,engine,items,key,fmt,esc){
  const info=engine.defaults[key];
  if(!info)return '';
  const {quality,actual}=actualFor(result,engine,items,key),reference=result?.references?.[key],target=reference?.value;
  const enough=finite(actual),unit=info.unit||'';
  const targetValid=finite(target)&&target>0,percent=targetValid&&enough?pct(actual,target):NaN;
  const tone=nutrientDisplayTone(key,actual,reference,quality);
  return '<article class="nut-viz-metric"><div class="nut-viz-metric-top"><span>'+esc(info.title)+'</span><strong>'+ (enough?fmt(actual,key==='kcal'?0:1):'—')+' <small>'+esc(unit)+'</small></strong></div>'+
    bar(actual,target,info.title,esc,tone.code)+
    '<p>'+(targetValid?(isUpperNutrientLimit(key,reference)?'Верхний ориентир: ':'Ориентир: ')+fmt(target,1)+' '+esc(unit)+(finite(percent)?' · '+fmt(percent,0)+'% '+(isUpperNutrientLimit(key,reference)?'от верхнего ориентира':'от ориентира'):''):'Индивидуальный ориентир не рассчитан')+'</p>'+
    '<small class="nut-viz-uncertainty">'+esc(statusText(quality,enough))+(targetValid?' · '+esc(tone.label):'')+'</small></article>';
}

const trustedMethods=new Set(['MEASURED','LABEL','CALCULATED','SOURCE_REPORTED']);
function currentContributors(result,engine,items,key,fmt,esc){
  const quality=engine?.quality;
  if(!quality?.fieldName||!quality?.methodFor)return '<p>Источники данных недоступны.</p>';
  const field=quality.fieldName(key);
  const nutrientItems=Array.isArray(result?.nutrientRation)?result.nutrientRation:items;
  const found=[],excluded={count:0};
  let knownSum=0;
  for(const it of nutrientItems){
    const p=engine.db.byKey.get(it.key),grams=it.grams;
    if(!p||!finite(grams)||grams<=0){excluded.count++;continue;}
    const value=p[field],method=quality.methodFor(p,field);
    if(!finite(value)||value<0||!trustedMethods.has(method)){excluded.count++;continue;}
    const contribution=value*grams/100;
    if(!finite(contribution)||contribution<=0)continue;
    knownSum+=contribution;
    found.push({name:String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru||p.name||it.key),grams,contribution,method});
  }
  found.sort((a,b)=>b.contribution-a.contribution||a.name.localeCompare(b.name,'ru'));
  const unit=engine.defaults?.[key]?.unit||'';
  if(!found.length)return '<p class="nut-viz-detail-note">Положительных вкладов с подтверждённым происхождением значения для этого рациона не найдено.</p>';
  const entries=found.slice(0,5).map(x=>
    '<li><span>'+esc(x.name)+'</span><b>'+fmt(x.contribution,2)+' '+esc(unit)+'</b>'+
    '<small>'+fmt(x.grams,1)+' г · '+fmt(x.contribution/knownSum*100,0)+'% от известных вкладов</small></li>').join('');
  return '<ol class="nut-viz-contributors">'+entries+'</ol>'+
    '<p class="nut-viz-detail-note">Доли рассчитаны только среди положительных вкладов с явными данными. Значения, перенесённые из непроверенных или модельно заполненных полей, в этот список не входят.'+
    (excluded.count?' Часть продуктовых записей не вошла в разбор из-за пробелов или особенностей исходных данных.':'')+'</p>';
}
function heiExplanation(hei,key,spec,fmt,esc){
  const density=hei?.density?.[key],unit=String(spec?.unit||''),moderation=String(spec?.kind||'').startsWith('moderation');
  const type=moderation?'ограничиваемого компонента':'основного компонента';
  let desired;
  if(moderation&&finite(spec.max))desired='Для полного балла значение должно быть не выше '+fmt(spec.max,2)+' '+unit+'.';
  else if(key==='fatty_acids_ratio'&&finite(spec.max))desired='Для полного балла отношение жиров должно достичь '+fmt(spec.max,2)+'.';
  else if(finite(spec.min))desired='Для полного балла значение должно достичь '+fmt(spec.min,2)+' '+unit+'.';
  else desired='Балл рассчитывается по правилам HEI‑2020.';
  return '<div class="nut-viz-detail-body"><p><strong>Как читать компонент.</strong> Это оценка '+type+' в рамках HEI‑2020. '+esc(desired)+'</p>'+
    (finite(density)?'<p>Расчётное значение для введённого рациона: <strong>'+fmt(density,2)+' '+esc(unit)+'</strong>.</p>':'')+
    (spec.tip?'<p>'+esc(spec.tip)+'</p>':'')+
    '<p class="nut-viz-detail-note">Баллы рассчитываются по составу рациона в целом. Изменение отдельного продукта может влиять сразу на несколько компонентов.</p></div>';
}

function heiCards(result,engine,items,fmt,esc,printMode=false) {
  const hei=result?.hei;
  if(!hei?.valid || !finite(hei.total))return '<section class="nut-viz-panel"><h3>HEI‑2020</h3><p>Для оценки HEI нужна известная энергетическая ценность введённого рациона.</p></section>';
  const standards=engine.hei.helpers.STD||{};
  const keys=Object.keys(standards).filter(key=>Object.hasOwn(hei.points||{},key));
  const breakdown=buildHeiProductBreakdown(result,engine,items);
  const tones=keys.map(key=>heiTone(hei.points[key],standards[key].pts));
  const lowCount=tones.filter(t=>t.code==='low').length;
  const midCount=tones.filter(t=>t.code==='mid').length;
  const goodCount=tones.filter(t=>t.code==='good').length;
  const rows=keys.map((key,i)=>{
    const points=hei.points[key],spec=standards[key],max=spec.pts,tone=tones[i];
    const group=String(spec.kind||'').startsWith('moderation')?'moderation':key==='fatty_acids_ratio'?'ratio':'adequacy';
    const category=String(spec.kind||'').startsWith('moderation')?'Ограничиваемый компонент':
      key==='fatty_acids_ratio'?'Качество жиров':'Основная пищевая группа';
    return '<details class="nut-viz-hei-disclosure" data-hei-key="'+esc(key)+'" data-tone="'+esc(tone.code)+'" data-hei-kind="'+group+'"'+(printMode?' open':'')+'><summary>'+
      '<span class="nut-viz-hei-row"><span class="nut-viz-hei-text"><span>'+esc(spec.label||key)+'</span><b>'+fmt(points,1)+' <small>/ '+fmt(max,0)+'</small></b></span>'+
      bar(points,max,spec.label||key,esc,tone.code)+'</span>'+
      '<span class="nut-viz-hei-state" data-tone="'+esc(tone.code)+'">'+esc(tone.label)+'</span>'+
      '<span class="nut-viz-more">Продукты и расчёт</span></summary>'+
      '<div class="nut-viz-hei-meta">'+esc(category)+' · '+fmt(pct(points,max),0)+'% максимума баллов</div>'+
      heiExplanation(hei,key,spec,fmt,esc)+
      renderHeiProductBreakdown(componentHeiContributors(breakdown,key),key,fmt,esc)+'</details>';
  }).join('');
  const overall=heiTone(hei.total,100);
  return '<section class="nut-viz-panel nut-viz-hei">'+
    '<div class="nut-viz-panel-heading"><div><span class="nut-viz-eyebrow">ИНДЕКС КАЧЕСТВА ПИТАНИЯ</span><h3>HEI‑2020</h3><p>13 компонентов индекса. Цвет — оценка доли полученных баллов, не процент обеспеченности нутриентами. Нажмите строку, чтобы увидеть, какие продукты внесли вклад.</p></div>'+
    '<div class="nut-viz-hei-score" aria-label="Общий балл HEI '+esc(fmt(hei.total,1))+' из 100"><strong>'+fmt(hei.total,1)+'</strong><span>/ 100</span></div></div>'+
    bar(hei.total,100,'Общий HEI',esc,overall.code)+
    '<div class="nut-viz-hei-summary" aria-label="Распределение компонентов по уровням">'+
      '<span data-tone="low"><b>'+lowCount+'</b> требуют внимания</span>'+
      '<span data-tone="mid"><b>'+midCount+'</b> можно улучшить</span>'+
      '<span data-tone="good"><b>'+goodCount+'</b> высокий балл</span></div>'+
    '<div class="nut-viz-hei-legend"><span><i data-tone="low"></i> Менее 60%</span><span><i data-tone="mid"></i> 60–89%</span><span><i data-tone="good"></i> От 90%</span></div>'+
    (printMode?'':'<div class="nut-viz-hei-filters" role="group" aria-label="Показать компоненты HEI"><button type="button" data-hei-view="all" aria-pressed="true">Все компоненты</button><button type="button" data-hei-view="attention" aria-pressed="false">Требуют внимания</button></div>'+ 
      '<div class="nut-viz-hei-filters nut-viz-hei-kinds" role="group" aria-label="Тип компонента HEI"><button type="button" data-hei-kind-filter="all" aria-pressed="true">Все типы</button><button type="button" data-hei-kind-filter="adequacy" aria-pressed="false">Пищевые группы</button><button type="button" data-hei-kind-filter="moderation" aria-pressed="false">Ограничения</button><button type="button" data-hei-kind-filter="ratio" aria-pressed="false">Жиры</button></div>')+
    '<p class="nut-viz-hei-empty" hidden>По этим условиям компонентов нет. Выберите «Все компоненты» или «Все типы».</p>'+ 
    '<div class="nut-viz-hei-grid">'+rows+'</div>'+
    '<p class="nut-viz-disclaimer">Высокий балл ограничиваемого компонента означает, что его доля в рационе относительно невелика. HEI не устанавливает клинический дефицит, избыток, диагноз и не оценивает полноту введённого рациона. Часть эквивалентов пищи моделируется приближённо.</p></section>';
}
function nutrientCards(result,engine,items,fmt,esc,printMode=false){
  const keys=focusKeys.filter(key=>engine.defaults[key]);
  const makeRows=sourceKeys=>sourceKeys.map(key=>{
    const data=actualFor(result,engine,items,key),reference=result?.references?.[key],ref=reference?.value,
      title=engine.defaults[key].title,unit=engine.defaults[key].unit||'',
      compare=finite(ref)&&ref>0&&finite(data.actual),percent=compare?pct(data.actual,ref):NaN,
      upper=isUpperNutrientLimit(key,reference),
      audit=nutrientDataAudit(engine,items,key,esc),tone=nutrientDisplayTone(key,data.actual,reference,data.quality);
    const comparison=compare?fmt(percent,0)+'% '+(upper?'от верхнего ориентира':'от ориентира'):'Ориентир для сравнения не задан';
    const head='<span class="nut-viz-nutrient"><span class="nut-viz-hei-text"><span>'+esc(title)+'</span><b>'+(finite(data.actual)?fmt(data.actual,2):'—')+' <small>'+esc(unit)+'</small></b></span>'+
      '<strong class="nut-viz-nutrient-percent'+(compare?'':' is-unknown')+'">'+esc(comparison)+'</strong>'+
      bar(data.actual,ref,title,esc,tone.code)+
      '<span class="nut-viz-nutrient-note">'+(finite(ref)&&ref>0?(upper?'Верхний ориентир ':'Ориентир ')+fmt(ref,2)+' '+esc(unit):'Ориентир не задан')+
      ' · '+esc(audit.label)+(compare?' · '+esc(tone.label):'')+'</span></span>';
    const details='<div class="nut-viz-detail-body"><h4>Продукты, из которых поступает вещество</h4>'+
      currentContributors(result,engine,items,key,fmt,esc)+audit.detail+
      (printMode?'':'<button type="button" class="nut-viz-open-catalog" data-nut-viz-source="'+esc(key)+'">Проверенные продукты в справочнике</button>')+
      '<p class="nut-viz-detail-note">Количество и процент характеризуют только введённый рацион. Неполные сведения могут занижать результат; низкая доля сама по себе не устанавливает дефицит.</p></div>';
    return '<details class="nut-viz-nutrient-disclosure" data-nutrient-key="'+esc(key)+'"'+(printMode?' open':'')+'><summary>'+head+
      '<span class="nut-viz-more">Источники и пояснения</span></summary>'+details+'</details>';
  }).join('');
  const rows=makeRows(keys);
  const extraKeys=printMode?[]:Object.keys(engine.defaults||{}).filter(key=>!heroKeys.includes(key)&&!focusKeys.includes(key));
  const extra=extraKeys.length?'<details class="nut-viz-nutrient-additional"><summary>Ещё '+extraKeys.length+' показателей: витамины, минералы и другие вещества</summary><p class="nut-viz-detail-note">У каждого показателя указан процент относительно применимого ориентира. Для ограничиваемых веществ это доля верхнего ориентира, а не потребность, которую нужно набрать.</p><div class="nut-viz-nutrient-grid">'+makeRows(extraKeys)+'</div></details>':'';
  return '<section class="nut-viz-panel"><div class="nut-viz-panel-heading"><div><span class="nut-viz-eyebrow">ПОСТУПЛЕНИЕ ПИЩЕВЫХ ВЕЩЕСТВ</span><h3>Основные нутриенты</h3><p>Число рядом со шкалой — процент от ориентира. Раскройте показатель, чтобы увидеть продукты и оценку полноты исходных данных.</p></div></div>'+
    '<div class="nut-viz-nutrient-grid">'+rows+'</div>'+extra+'<p class="nut-viz-disclaimer">100% — сопоставление с ориентиром, но не универсальная цель. Для верхних ограничений меньший процент не означает недостатка; при неполном рационе и пробелах в каталоге проценты не описывают суточную обеспеченность человека.</p></section>';
}
function waterNote(result,fmt,esc) {
  const meta=result?.needs?.meta,ref=meta?.waterReference;
  let amount='';
  if(ref?.kind==='range' && finite(ref.lowL) && finite(ref.highL))amount=fmt(ref.lowL,1)+'–'+fmt(ref.highL,1)+' л/сут';
  else if(finite(ref?.valueL))amount=fmt(ref.valueL,1)+' л/сут';
  if(!amount)return '';
  return '<p class="nut-viz-water"><strong>Общее поступление воды: '+esc(amount)+'</strong><span>Ориентир включает воду из пищи и напитков; это не предписание выпивать указанный объём.</span></p>';
}
export function renderNutritionVisuals(result,engine,items,fmt,esc,options={}){
  const printMode=options.print===true;
  if(!result || !Array.isArray(items) || !items.length)return '';
  return '<div class="nut-viz" aria-label="Графики анализа рациона">'+
    '<section class="nut-viz-panel" ><div class="nut-viz-panel-heading"><div><span class="nut-viz-eyebrow">СОСТАВ РАЦИОНА</span><h3 >Энергия и БЖУ</h3><p>Поступление относительно индивидуальных расчётных ориентиров, если они доступны.</p></div></div>'+
    '<div class="nut-viz-metrics">'+heroKeys.map(key=>metricCard(result,engine,items,key,fmt,esc)).join('')+'</div>'+waterNote(result,fmt,esc)+'</section>'+
    heiCards(result,engine,items,fmt,esc,printMode)+nutrientCards(result,engine,items,fmt,esc,printMode)+'</div>';
}


/* Отображаем значения, уже рассчитанные модулем Needs; свои формулы не используем. */
export function renderNeedsBreakdown(meta,fmt,esc){
  if(!meta||typeof meta!=='object')return '';
  const fluidAllowed=meta.protectedPolicy?.fluidEstimateAllowed!==false,
    fluid=fluidAllowed&&finite(meta.fluidMl)&&meta.fluidMl>0?meta.fluidMl:NaN;
  const canMeals=meta.mealSplitAllowed===true&&meta.normsSyncAllowed===true&&
    meta.energyEstimateOnly!==true&&!meta.externalClinicalTargetApplied&&Array.isArray(meta.meals)&&
    meta.meals.length>=3&&meta.meals.length<=5&&Math.abs(meta.meals.reduce((sum,m)=>sum+(finite(m.pct)?m.pct:0),0)-1)<0.001&&meta.meals.every(m=>
      finite(m.pct)&&m.pct>=0&&m.pct<=1&&finite(m.kcal)&&m.kcal>=0);
  const data=canMeals?meta.meals:[];
  if(!finite(fluid)&&!canMeals)return '';
  const water=finite(fluid)?'<div class="nut-viz-fluid"><strong>Ориентир по жидкости</strong><b>'+fmt(fluid,0)+' мл/сут</b>'+
    '<p>Расчётная оценка потребности в жидкости. Учитывайте пищу и напитки, индивидуальные ограничения и рекомендации лечащего специалиста.</p></div>':'';
  const mealRows=data.map((m,i)=>{
    const pct=Math.round(m.pct*100),macros=[['Б',m.protein],['Ж',m.fat],['У',m.carbs]].filter(pair=>finite(pair[1])&&pair[1]>=0).map(pair=>pair[0]+' '+fmt(pair[1],1)+' г').join(' · ');
    return '<div class="nut-viz-meal"><div class="nut-viz-meal-heading"><strong>'+(i+1)+'-й приём пищи</strong><b>'+pct+'% · '+fmt(m.kcal,0)+' ккал</b></div>'+
      '<span class="nut-viz-track" role="img" aria-label="Доля энергии '+pct+'%"><span style="width:'+cap(pct)+'%"></span></span>'+
      (macros?'<small>'+esc(macros)+'</small>':'')+'</div>';
  }).join('');
  const meals=canMeals?'<div class="nut-viz-meal-section"><h4>Распределение по приёмам пищи</h4><div class="nut-viz-meal-grid">'+mealRows+'</div>'+
    '<p class="nut-viz-detail-note">Это распределение расчётной энергии и БЖУ по выбранной схеме. Оно не показывает, что человек действительно съел, и не является обязательной физиологической нормой.</p></div>':'';
  return '<section class="nut-viz-needs-extra" aria-label="Жидкость и распределение по приёмам">'+water+meals+'</section>';
}
