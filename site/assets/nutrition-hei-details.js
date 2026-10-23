// Расшифровка HEI-2020: исходный адаптер, использованный при расчёте индекса.
// НЕ распределяем HEI-баллы по продуктам: балл — нелинейная функция всего рациона.
const finite = x => typeof x === 'number' && Number.isFinite(x);
const total = (intake,key) => finite(intake?.[key]) ? Math.max(0,intake[key]) : 0;
const units={
  fruits_total:'чаш.-экв.', fruits_whole:'чаш.-экв.',
  vegetables_total:'чаш.-экв.', greens_beans:'чаш.-экв.',
  grains_whole:'унц.-экв.',grains_refined:'унц.-экв.',
  dairy:'чаш.-экв.',protein_total:'унц.-экв.',seafood_plant:'унц.-экв.',
  sodium_g:'мг натрия',added_sugars_pct:'г сахара',sat_fats_pct:'г насыщенных жиров',
  fatty_acids_ratio:'г жиров'
};
const groupNotes={
  fruits_total:'Эквивалент чашки фруктов',fruits_whole:'Эквивалент чашки цельных фруктов',
  vegetables_total:'Эквивалент чашки овощей',greens_beans:'Эквивалент чашки зелени и бобовых',
  grains_whole:'Эквивалент унции злаков',grains_refined:'Эквивалент унции злаков',
  dairy:'Эквивалент чашки молочных продуктов',protein_total:'Эквивалент унции белковых продуктов',
  seafood_plant:'Эквивалент унции рыбы и растительного белка'
};
export function heiRawContribution(intake,key,side='positive'){
  if(key==='vegetables_total')return total(intake,'vegetables_total')+total(intake,'legumes_veg_total');
  if(key==='greens_beans')return total(intake,'greens_beans')+total(intake,'legumes_greens_beans');
  if(key==='protein_total')return total(intake,'protein_excl_legumes')+total(intake,'legumes_as_protein');
  if(key==='sodium_g')return total(intake,'sodium_mg');
  if(key==='added_sugars_pct')return total(intake,'added_sugars_g');
  if(key==='sat_fats_pct')return total(intake,'fatty_sfa_g');
  if(key==='fatty_acids_ratio')return total(intake,side==='negative'?'fatty_sfa_g':'fatty_unsat_g');
  return total(intake,key);
}
export function buildHeiProductBreakdown(result,engine,items){
  const ration=Array.isArray(result?.foodPatternRation)?result.foodPatternRation:items;
  const rows=[],warnings=[],makeIntake=engine?.hei?.computeIntake;
  if(typeof makeIntake!=='function')return {rows,warnings:['Адаптер пищевых групп недоступен.'],verified:false};
  for(const entry of (Array.isArray(ration)?ration:[])){
    const p=engine?.db?.byKey?.get(entry.key),grams=Number(entry.grams);
    if(!p||!finite(grams)||grams<=0){warnings.push('Некоторые позиции не удалось сопоставить с каталогом.');continue;}
    try {
      // Важно: ровно тот же адаптер и уже разложенные пищевые компоненты,
      // которые использованы при engine.analyze(). Балл на отдельную позицию не начисляется.
      const intake=makeIntake([{key:entry.key,grams}],engine.db);
      const audit=intake?.fieldAudit||{};
      const inferred=Number(audit.foodEquivalents?.fallback||0)>0||
        Number(audit.foodEquivalents?.assumedZero||0)>0||
        Number(audit.addedSugars?.fallback||0)>0||
        Number(audit.addedSugars?.assumedZero||0)>0;
      rows.push({key:entry.key,name:String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru||p.name||entry.name||entry.key),
        grams,intake,inferred});
    } catch {warnings.push('Для части позиций не удалось рассчитать распределение вклада.');}
  }
  // Проверяем энергетический инвариант, чтобы не показывать ложную точность.
  const energy=rows.reduce((sum,x)=>sum+total(x.intake,'energy_kcal'),0);
  const expected=result?.hei?.intake?.energy_kcal;
  const verified=finite(expected)&&Math.abs(energy-expected)<Math.max(.1,expected*.001);
  if(!verified)warnings.push('Вклад рассчитан по доступным компонентам; сумма может отличаться от основной модели.');
  return {rows,warnings:[...new Set(warnings)],verified};
}
export function componentHeiContributors(breakdown,key){
  const rows=breakdown?.rows||[];
  const aggregate=side=>{
    const map=new Map();
    for(const row of rows){
      const value=heiRawContribution(row.intake,key,side);
      if(!(value>0))continue;
      let record=map.get(row.key);
      if(!record){record={key:row.key,name:row.name,grams:0,value:0,inferred:false};map.set(row.key,record);}
      record.grams+=row.grams;record.value+=value;record.inferred ||= row.inferred;
    }
    const values=[...map.values()].sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'ru'));
    const sum=values.reduce((s,row)=>s+row.value,0);
    for(const row of values)row.share=sum>0?100*row.value/sum:0;
    return {values,total:sum};
  };
  return {positive:aggregate('positive'),negative:key==='fatty_acids_ratio'?aggregate('negative'):null,
    unit:units[key]||'условн. ед.',basis:groupNotes[key]||null,
    warnings:breakdown?.warnings||[]};
}
export function heiTone(points,maximum){
  if(!finite(points)||!finite(maximum)||maximum<=0)return {code:'unknown',label:'Нет оценки'};
  const fraction=points/maximum;
  if(fraction>=.9-1e-8)return {code:'good',label:'Высокий балл'};
  if(fraction>=.6-1e-8)return {code:'mid',label:'Можно улучшить'};
  return {code:'low',label:'Требует внимания'};
}
export function nutrientTone(actual,reference,quality){
  if(!finite(actual)||!finite(reference)||reference<=0)return {code:'unknown',label:'Нет сопоставимого ориентира'};
  if(quality?.missing_products || quality?.assumed_zero_products)return {code:'unknown',label:'Неполные данные'};
  const fraction=actual/reference;
  if(fraction<.7)return {code:'low',label:'Ниже ориентира'};
  if(fraction<.95)return {code:'mid',label:'Близко к ориентиру'};
  if(fraction>1.2)return {code:'above',label:'Выше ориентира'};
  return {code:'good',label:'На уровне ориентира'};
}
export function renderHeiProductBreakdown(contribution,key,fmt,esc){
  const renderGroup=(g,caption)=>{
    if(!g)return '';
    if(!g.values.length)return '<section class="nut-viz-hei-sources"><h5>'+esc(caption)+'</h5><p class="nut-viz-detail-note">Введённые продукты не дали положительного вклада в этот компонент.</p></section>';
    const maxRows=8,body=g.values.slice(0,maxRows).map(x=>
      '<li><span>'+esc(x.name)+(x.inferred?' <small title="Часть показателей оценена по модельным правилам">≈</small>':'')+'</span>'+
      '<b>'+fmt(x.value,key==='sodium_g'?0:2)+' '+esc(contribution.unit)+'</b>'+
      '<small>'+fmt(x.grams,1)+' г продукта · '+fmt(x.share,0)+'% учтённого вклада</small></li>').join('');
    const rest=g.values.length>maxRows?'<p class="nut-viz-detail-note">Показаны 8 из '+g.values.length+' продуктов с наибольшим вкладом.</p>':'';
    return '<section class="nut-viz-hei-sources"><h5>'+esc(caption)+'</h5><ol class="nut-viz-contributors">'+body+'</ol>'+rest+'</section>';
  };
  const fat=key==='fatty_acids_ratio';
  const main=renderGroup(contribution.positive,fat?'Ненасыщенные жиры':'Продукты, формирующие показатель');
  const other=fat?renderGroup(contribution.negative,'Насыщенные жиры'):'';
  const caution=contribution.warnings.length?'<p class="nut-viz-detail-note">'+esc(contribution.warnings.join(' '))+'</p>':'';
  return '<div class="nut-viz-hei-source-detail"><h4>Какие продукты влияют на этот показатель</h4>'+
    '<p class="nut-viz-detail-note">'+(fat?
    'Соотношение рассчитывается для всего рациона; два списка показывают вклад в числитель и знаменатель.':
    'Это вклад в исходное количество компонента, а не распределение баллов HEI по продуктам.')+'</p>'+
    (contribution.basis?'<p class="nut-viz-detail-note">'+esc(contribution.basis)+'; показатели могут быть приближёнными.</p>':'')+
    '<div class="nut-viz-hei-source-columns">'+main+other+'</div>'+caution+
    '<p class="nut-viz-detail-note">Знак ≈ отмечает позиции, в расчёте которых есть модельные эквиваленты или условно заполненные поля. Процент относится к показанному компоненту, а не к общему баллу HEI.</p></div>';
}
