// Radial nutrition profile: a presentation of existing food intakes and verified references.
// Pure input/output. No new dietary targets, risk thresholds, clinical decisions or aggregate scores.
export const RADIAL_GROUPS=[
 {id:'macro',name:'Основные нутриенты',short:'Основные',color:'#6697b5',members:[
  ['protein_g','Белок','Белок'],['fiber_g','Пищевые волокна','Клетчатка']]},
 {id:'mineral',name:'Минералы',short:'Минералы',color:'#a88ac7',members:[
  ['calcium_mg','Кальций','Ca'],['magnesium_mg','Магний','Mg'],['potassium_mg','Калий','K'],
  ['iron_mg','Железо','Fe'],['zinc_mg','Цинк','Zn'],['phosphorus_mg','Фосфор','P'],
  ['iodine_mcg','Йод','I'],['selenium_mcg','Селен','Se'],['copper_mg','Медь','Cu'],
  ['manganese_mg','Марганец','Mn']]},
 {id:'vitamin',name:'Витамины',short:'Витамины',color:'#5aada2',members:[
  ['vitamin_a_mcg','Витамин A','A'],['vitamin_c_mg','Витамин C','C'],['vitamin_d_mcg','Витамин D','D'],
  ['vitamin_e_mg','Витамин E','E'],['vitamin_k_mcg','Витамин K','K'],
  ['vitamin_b1_mg','Витамин B1','B1'],['vitamin_b2_mg','Витамин B2','B2'],
  ['vitamin_b3_mg','Витамин B3','B3'],['vitamin_b5_mg','Витамин B5','B5'],
  ['vitamin_b6_mg','Витамин B6','B6'],['vitamin_b9_mcg','Фолат (B9)','B9'],
  ['vitamin_b12_mcg','Витамин B12','B12']]},
 {id:'other',name:'Другие вещества',short:'Другие',color:'#bba169',members:[
  ['choline_mg','Холин','Холин']]}
];
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const aliases={fiber_g:'fiber'};
const round=(x,d=1)=>Math.round(x*10**d)/10**d;
const cap=(x,a,b)=>Math.max(a,Math.min(b,x));
const allKeys=RADIAL_GROUPS.flatMap(g=>g.members.map(e=>e[0]));
const restricted=(result)=>!!(result?.needs?.policy?.protectedMode||result?.needs?.meta?.normsSyncAllowed===false);
const radialContext=p=>({age:Number(p?.age),sex:p?.sex,energyKcal:null});
function reliableIntake(engine,ration,key,value){
  if(!Array.isArray(ration)||!ration.length||!finite(value)||value<0)return {valid:false,quality:'Нет данных'};
  try{
    const q=engine.quality.nutrientAnalysis(ration,engine.db,aliases[key]||key);
    if(!q||q.missing_products>=ration.length){
      return {valid:false,quality:'Нет числовых данных о веществе в введённых продуктах'};
    }
    const uncertain=!!(q.missing_products||q.assumed_zero_products||q.confidence_tier!=='HIGH');
    return {valid:true,trusted:!uncertain,quality:q.missing_products?'Состав указан не для всех продуктов':
      q.assumed_zero_products?'Есть условные нули':q.confidence_tier==='LOW'?'Низкая достоверность состава':
      q.confidence_tier==='MEDIUM'?'Приближённые данные':'По данным справочника',approximate:uncertain};
  }catch{return {valid:false,quality:'Не удалось проверить качество данных'};}
}
function verifiedUpper(engine,key,profile){
  // UL applies to TOTAL intake only. Retinol, synthetic folate and supplemented
  // magnesium/niacin have different scopes and cannot be compared to this field.
  // Do not infer that lack of UL means unlimited intake.
  try{
    if(!finite(Number(profile?.age))||Number(profile.age)<18||(profile.state&&profile.state!=='normal'))return null;
    const r=engine.normative?.resolveMicro?.(key,profile.region==='eu'?'eu':'us',radialContext(profile));
    const upper=r?.ul;
    return upper?.scope==='total'&&finite(upper.value)&&upper.value>0?
      {value:upper.value,sourceIds:upper.provenance?.sourceIds||upper.source_ids||[]}:null;
  }catch{return null;}
}
function anglesByGroup(){
 const count=allKeys.length,n=RADIAL_GROUPS.length,gap=.14,step=(Math.PI*2-gap*n)/count;
 let angle=-Math.PI/2;
 return RADIAL_GROUPS.map(group=>{
   const start=angle,items=group.members.map(item=>{const theta=angle+step/2;angle+=step;return {item,theta};});
   const stop=angle;angle+=gap;return {id:group.id,name:group.name,short:group.short,color:group.color,start,stop,items};
 });
}
export function buildRadialNutritionProfile(result,engine,ration,profile={}){
 if(!result||!engine||!Array.isArray(ration)||!ration.length)return {status:'empty',items:[],message:'Для построения диаграммы сначала добавьте продукты и выполните анализ.'};
 if(restricted(result))return {status:'restricted',items:[],message:'Для выбранного клинического режима сравнение со стандартными суточными ориентирами ограничено. Подробные поступления нутриентов остаются в таблице анализа.'};
 const energy=Number(result.totals?.kcal),target=Number(result.references?.kcal?.value);
 const eq=reliableIntake(engine,ration,'kcal',energy);
 const energyPct=eq.valid&&finite(target)&&target>0?energy/target*100:null;
 // The energy ring may be a preliminary estimate, and must be labelled as such.
 const macroKeys=[['fat_g','Жиры',9],['carbs_g','Углеводы',4]];
 const macroDetails=macroKeys.map(([key,name,factor])=>{
   const value=result.totals?.[key],quality=reliableIntake(engine,ration,key,value);
   return {key,name,value:quality.valid?value:null,energyShare:quality.valid&&eq.valid&&energy>0?
     round(value*factor/energy*100,1):null,estimatedKcal:quality.valid?round(value*factor,0):null,
     factor,quality:quality.quality,approximate:quality.approximate};
 });
 const groups=anglesByGroup();
 const items=groups.flatMap(group=>group.items.map(({item,theta})=>{
   const [key,name,short]=item,value=result.totals?.[key],reference=result.references?.[key];
   const quality=reliableIntake(engine,ration,key,value);
   const ref=Number(reference?.value);
   const valid=quality.valid&&finite(ref)&&ref>0;
   const pct=valid?value/ref*100:null;
   const upper=valid?verifiedUpper(engine,key,profile):null;
   const exceed=!!(upper&&value>upper.value);
   const signal=!valid?'unknown':exceed&&quality.trusted?'upper':pct<100?'below':'met';
   const status=!valid?'unknown':!quality.trusted?'uncertain':signal;
   let comment;
   if(!valid)comment=!quality.valid?quality.quality:'Нет применимого расчётного ориентира';
   else if(!quality.trusted)comment='Предварительное сравнение: '+quality.quality.toLowerCase()+'.';
   else if(exceed)comment='Поступление выше применимого UL для общего количества вещества. Разовый дневник не показывает привычное потребление.';
   else if(pct<100)comment=reference?.type==='AI'?'Ниже ориентира AI; это не позволяет оценить вероятность недостаточности.':
     'Ниже выбранного ориентира; это не доказательство дефицита.';
   else comment=quality.approximate?'Ориентир достигнут по приблизительным справочным данным.':
     'Ориентир достигнут во введённых продуктах. Превышение 100% само по себе не считается ухудшением.';
   return {key,name,short,group:group.id,groupName:group.name,theta,
     value:quality.valid?value:null,unit:engine.defaults?.[key]?.unit||'',
     ref:valid?ref:null,refType:reference?.type||'',pct:finite(pct)?round(pct,1):null,
     status,signal,upper,comment,quality:quality.quality};
 }));
 return {status:'ready',groups,items,energy:{
   actual:eq.valid?energy:null,target:finite(target)&&target>0?target:null,pct:finite(energyPct)?round(energyPct,1):null,
   quality:eq.quality},macros:macroDetails,validCount:items.filter(x=>['met','below','upper'].includes(x.status)).length,
   provisionalCount:items.filter(x=>x.status==='uncertain').length};
}
const point=(theta,r)=>[300+Math.cos(theta)*r,300+Math.sin(theta)*r];
const pt=(theta,r)=>point(theta,r).map(v=>v.toFixed(2)).join(',');
const ellipseAngle=(theta,r)=>point(theta,r);
const strokeColor=status=>status==='met'?'#31856a':status==='below'?'#b8873c':status==='upper'?'#b34f50':'#9aabb8';
const pathRing=(a,b,inner,outer)=>{
 const p1=point(a,outer),p2=point(b,outer),p3=point(b,inner),p4=point(a,inner),large=b-a>Math.PI?1:0;
 return 'M'+p1.join(' ')+' A'+outer+' '+outer+' 0 '+large+' 1 '+p2.join(' ')+
  ' L'+p3.join(' ')+' A'+inner+' '+inner+' 0 '+large+' 0 '+p4.join(' ')+' Z';
};
function runs(items){
 // Never bridge unknown points: the outline is separate, with no filled polygon
 // unless the whole group of individual nutrient axes is available.
 const segments=[];let run=[];
 for(const item of items){
  if(item.status==='unknown'||item.status==='uncertain'){if(run.length>1)segments.push(run);run=[];}
  else run.push(item);
 }
 if(run.length>1)segments.push(run);
 if(items.length&&['met','below','upper'].includes(items[0].status)&&['met','below','upper'].includes(items.at(-1).status)&&segments.length>1){
  segments[0]=segments.at(-1).concat(segments[0]);segments.pop();
 }
 return segments;
}
export function renderRadialNutritionProfile(model,fmt,esc,{print=false}={}){
 if(!model||model.status!=='ready')return '<section class="nut-viz-panel nut-radial-panel"><h3>Энергия и нутриенты</h3><p>'+esc(model?.message||'Недостаточно данных для построения диаграммы.')+'</p></section>';
 const visible=model.items,energy=model.energy;
 const axis=visible.map(n=>{
  const p=point(n.theta,172),label=point(n.theta,205);
  const rad=n.status==='unknown'?null:Math.min(158,n.pct);
  const end=rad===null?null:point(n.theta,rad);
  const over=n.pct!==null&&n.pct>158;
  const color=strokeColor(n.status==='uncertain'?n.signal:n.status);
  const opacity=n.status==='uncertain'?.75:1;
  const labelText=(n.name+': '+(n.pct===null?'недостаточно данных':fmt(n.pct,1)+'% от ориентира')+
    (n.value===null?'':'; '+fmt(n.value,2)+' '+n.unit)+'; '+n.comment);
  return '<line x1="300" y1="300" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="#a6b9c6" stroke-width="1" stroke-opacity=".24"/>'+
   (end?'<line class="nut-radial-stem" x1="300" y1="300" x2="'+end[0].toFixed(1)+'" y2="'+end[1].toFixed(1)+'" stroke="'+color+'" stroke-opacity="'+(n.status==='uncertain'?.40:.66)+'" stroke-width="1.6"'+(n.status==='uncertain'?' stroke-dasharray="3 3"':'')+'/>':'')+
   '<text x="'+label[0].toFixed(1)+'" y="'+label[1].toFixed(1)+'" text-anchor="middle" dominant-baseline="central" class="nut-radial-axis-label">'+esc(n.short)+'</text>'+
   (end?'<g class="nut-radial-node" data-radial-key="'+esc(n.key)+'"><circle tabindex="0" role="button" aria-haspopup="dialog" aria-label="'+esc('Открыть справку: '+labelText)+'" cx="'+end[0].toFixed(1)+'" cy="'+end[1].toFixed(1)+'" r="10" fill="'+color+'" fill-opacity="'+opacity+'" stroke="#fff" stroke-width="2.3"/>'+
     (n.status==='uncertain'?'<circle cx="'+end[0].toFixed(1)+'" cy="'+end[1].toFixed(1)+'" r="13" fill="none" stroke="'+color+'" stroke-width="1.1" stroke-dasharray="2 3" pointer-events="none"/>':'')+
     (over?'<circle cx="'+end[0].toFixed(1)+'" cy="'+end[1].toFixed(1)+'" r="11" fill="none" stroke="'+color+'" stroke-width="1.4" stroke-dasharray="3 2"/>':'')+
     (print?'<title>'+esc(labelText)+'</title>':'')+'</g>':
     '<g class="nut-radial-node" data-radial-key="'+esc(n.key)+'"><circle tabindex="0" role="button" aria-haspopup="dialog" aria-label="'+esc('Открыть справку: '+n.name+', сравнение недоступно')+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="8" fill="white" stroke="#9aabb8" stroke-width="1.5" stroke-dasharray="2 2"/>'+(print?'<title>'+esc(n.name+': сравнение недоступно')+'</title>':'')+'</g>');
 }).join('');
 const sections=model.groups.map(g=>{
  const mid=(g.start+g.stop)/2,label=point(mid,238);
  return '<path d="'+pathRing(g.start,g.stop,181,193)+'" fill="'+g.color+'" fill-opacity=".18" stroke="'+g.color+'" stroke-opacity=".45"/>'+
    '<text x="'+label[0].toFixed(1)+'" y="'+label[1].toFixed(1)+'" text-anchor="middle" class="nut-radial-group-label">'+esc(g.short)+'</text>';
 }).join('');
 const edges=visible.flatMap((n,i)=>{
  const next=visible[i+1];
  if(!next||n.group!==next.group||n.pct===null||next.pct===null)return [];
  const p1=point(n.theta,Math.min(158,n.pct)),p2=point(next.theta,Math.min(158,next.pct));
  const id='nut-radial-edge-'+(print?'p':'a')+'-'+i;
  const color1=strokeColor(n.status==='uncertain'?n.signal:n.status);
  const color2=strokeColor(next.status==='uncertain'?next.signal:next.status);
  const provisional=n.status==='uncertain'||next.status==='uncertain';
  return [{id,p1,p2,color1,color2,provisional}];
 });
 const edgeDefs=edges.map(e=>'<linearGradient id="'+e.id+'" gradientUnits="userSpaceOnUse" x1="'+e.p1[0]+'" y1="'+e.p1[1]+'" x2="'+e.p2[0]+'" y2="'+e.p2[1]+'"><stop offset="0%" stop-color="'+e.color1+'"/><stop offset="100%" stop-color="'+e.color2+'"/></linearGradient>').join('');
 const outline=edges.map(e=>'<line x1="'+e.p1[0]+'" y1="'+e.p1[1]+'" x2="'+e.p2[0]+'" y2="'+e.p2[1]+'" stroke="url(#'+e.id+')" stroke-width="2.4" stroke-opacity="'+(e.provisional?.48:.88)+'"'+(e.provisional?' stroke-dasharray="4 4"':'')+'/>').join('');
 const polygon=visible.every(n=>['met','below','upper'].includes(n.status))?'<polygon points="'+visible.map(n=>pt(n.theta,Math.min(158,n.pct))).join(' ')+'" fill="#5a91b8" fill-opacity=".11"/>':'';
 const pctEnergy=energy.pct;
 const eRadius=pctEnergy!==null?Math.min(158,pctEnergy):null;
 const energyCircle=eRadius!==null?'<circle cx="300" cy="300" r="'+eRadius.toFixed(1)+'" fill="none" stroke="#b67d3a" stroke-width="3.3" stroke-dasharray="8 5"/>'+
   (pctEnergy>158?'<text x="305" y="124" class="nut-radial-over">Энергия за пределами шкалы</text>':''):'';
 const svg='<svg class="nut-radial-svg" viewBox="0 0 600 600" role="img" aria-label="'+esc('Поступление нутриентов относительно ориентиров. '+model.validCount+' показателей доступны для сравнения. Энергия: '+(pctEnergy===null?'недоступна':fmt(pctEnergy,1)+'%'))+'" xmlns="http://www.w3.org/2000/svg">'+
  '<defs>'+edgeDefs+'</defs>'+'<circle cx="300" cy="300" r="155" fill="#f6f9fb" stroke="#e1e9ee"/>'+
  '<circle cx="300" cy="300" r="100" fill="none" stroke="#6aa58b" stroke-width="13" stroke-opacity=".19"/>'+
  '<circle cx="300" cy="300" r="100" fill="none" stroke="#54896f" stroke-width="1.3" stroke-dasharray="3 4"/>'+
  '<circle cx="300" cy="300" r="50" fill="none" stroke="#aebdc8" stroke-width="1" stroke-dasharray="3 4"/>'+
  sections+axis+polygon+outline+energyCircle+
  '<circle cx="300" cy="300" r="2" fill="#527187"/><text x="309" y="201" class="nut-radial-tick">100%</text>'+
  '</svg>';
 const counts={met:visible.filter(x=>x.status==='met').length,below:visible.filter(x=>x.status==='below').length,upper:visible.filter(x=>x.status==='upper').length,unknown:visible.filter(x=>x.status==='unknown').length};
 const focus=visible.filter(n=>n.pct!==null&&n.pct<100).sort((a,b)=>a.pct-b.pct);
 const focusVisible=focus.slice(0,6);
 const focusButton=n=>'<button type="button" data-radial-detail="'+esc(n.key)+'">'+esc(n.name)+' <strong>'+esc(fmt(n.pct,0))+'%</strong>'+(n.status==='uncertain'?' <small>≈</small>':'')+'</button>';
 const focusMarkup=focus.length?'<div class="nut-radial-focus"><h4>Показатели ниже ориентира ('+focus.length+')</h4>'+
  '<p>Показаны <strong>все</strong> сопоставления ниже 100%. Это данные о введённых продуктах, а не диагноз. Нажмите на показатель, чтобы открыть справку.</p>'+
  '<div>'+focusVisible.map(focusButton).join('')+'</div>'+
  (focus.length>focusVisible.length?'<details class="nut-radial-focus-more"'+(print?' open':'')+'><summary>Показать остальные ('+(focus.length-focusVisible.length)+')</summary><div>'+focus.slice(focusVisible.length).map(focusButton).join('')+'</div></details>':'')+
  '</div>':'<div class="nut-radial-focus"><h4>Показатели ниже ориентира</h4><p>Среди доступных значений нет сопоставлений ниже 100%. Это не означает, что весь рацион полностью обеспечивает потребности.</p></div>';
 const macroPanel=model.macros?.length?'<div class="nut-radial-macro"><h4>Жиры и углеводы</h4><p>Они тоже важны. Здесь показана их доля в энергии введённой пищи, а не дополнительные вершины с условным минимумом.</p><div>'+
  model.macros.map(x=>'<div class="nut-radial-macro-card"><span>'+esc(x.name)+'</span><strong>'+(x.value===null?'Нет данных':esc(fmt(x.value,1))+' г')+'</strong><small>'+
  (x.energyShare===null?'Доля энергии не рассчитана':'Примерно '+esc(fmt(x.energyShare,1))+'% энергии')+'</small></div>').join('')+
  '</div><p class="nut-radial-macro-foot">Приближённый расчёт: жиры × 9 ккал/г, углеводы × 4 ккал/г. Эти доли не являются индивидуальной нормой; подробности — в методике.</p></div>':'';
 const methodsButton=print?'':'<button type="button" class="nut-radial-method-button" data-radial-method aria-haspopup="dialog">Клиническая основа и формулы <span aria-hidden="true">↗</span></button>';

 const chartView=print?svg:'<div class="nut-radial-viewport" data-radial-viewport tabindex="0" aria-label="Интерактивный профиль: колесо мыши меняет масштаб, перетаскивание перемещает диаграмму, клавиши плюс, минус и ноль управляют видом">'+
  '<div class="nut-radial-canvas" data-radial-canvas>'+svg+'</div></div>'+
  '<div class="nut-radial-toolbar" data-radial-toolbar role="group" aria-label="Управление масштабом диаграммы">'+
  '<button type="button" data-radial-view="in" title="Увеличить" aria-label="Увеличить диаграмму">+</button>'+
  '<button type="button" data-radial-view="out" title="Уменьшить" aria-label="Уменьшить диаграмму" disabled>−</button>'+
  '<button type="button" data-radial-view="reset" title="Вернуть исходный вид" aria-label="Вернуть диаграмму в центр и исходный масштаб">⌖</button>'+
  '<output data-radial-zoom-label aria-label="Масштаб диаграммы">100%</output></div>'+
  '<div class="nut-radial-hover-tip" data-radial-hover-tip role="tooltip" aria-hidden="true" hidden>'+
   '<strong data-radial-hover-name></strong><b data-radial-hover-pct></b>'+
   '<span data-radial-hover-amount></span><small data-radial-hover-note></small></div>';
 const list=model.groups.map(g=>{
  const rows=visible.filter(x=>x.group===g.id).map(n=>{
   const label=n.pct===null?'Нет данных':fmt(n.pct,1)+'% от ориентира';
   return '<li class="nut-radial-item"><span class="nut-radial-status" data-status="'+(n.status==='uncertain'?n.signal:n.status)+'"'+(n.status==='uncertain'?' data-preliminary="true"':'')+'></span>'+
    '<button type="button" class="nut-radial-detail-button" data-radial-detail="'+esc(n.key)+'" aria-haspopup="dialog"><span class="nut-radial-name">'+esc(n.name)+'</span><strong>'+esc(label)+'</strong>'+
    '<small>'+(n.value===null?esc(n.quality):esc(fmt(n.value,2)+' '+n.unit+(n.ref!==null?' / '+fmt(n.ref,2)+' '+n.unit:'')))+'</small>'+
    '<span class="nut-radial-open">Подробнее ↗</span></button></li>';
  }).join('');
  return '<div class="nut-radial-list-group"><h4>'+esc(g.name)+'</h4><ul>'+rows+'</ul></div>';
 }).join('');
 return '<section class="nut-viz-panel nut-radial-panel" id="nut-radial-section">'+
  '<div class="nut-viz-panel-heading"><div><span class="nut-viz-eyebrow">ЭНЕРГИЯ И ПИЩЕВЫЕ ВЕЩЕСТВА</span><h3>Нутриентный профиль рациона</h3>'+
  '<p>Каждая вершина показывает отдельное вещество. Сектора объединяют их по группам, а пунктирный круг — долю энергии от расчётного ориентира. Ни одна группа не усредняет показатели своих веществ.</p></div></div>'+
  '<div class="nut-radial-layout"><div class="nut-radial-plot">'+chartView+
  '<p class="nut-radial-plot-note">Зелёное кольцо отмечает 100% выбранного ориентира. Оно не обозначает медицинскую норму. При значениях выше 158% вершина остаётся на краю шкалы; точный процент сохраняется в подробностях.</p></div>'+
  '<div class="nut-radial-reading"><h4>Как читать диаграмму</h4>'+
  '<div class="nut-radial-energy"><span>Энергия</span><strong>'+(pctEnergy===null?'Нет надёжного сравнения':esc(fmt(pctEnergy,1)+'%'))+'</strong>'+
  '<small>'+(energy.actual!==null&&energy.target!==null?esc(fmt(energy.actual,0)+' из '+fmt(energy.target,0)+' ккал · '+energy.quality):'Сравнение с энергетическим ориентиром недоступно')+'</small></div>'+
  '<div class="nut-radial-legend"><span><i data-status="met"></i>Ориентир достигнут</span><span><i data-status="below"></i>Ниже ориентира</span><span><i data-status="upper"></i>Выше применимого верхнего уровня (UL)</span><span><i data-status="uncertain"></i>Пунктирная обводка — предварительные данные</span><span><i data-status="unknown"></i>Нет сравнения</span></div>'+
  '<p>Всего <b>'+visible.length+'</b> веществ: сопоставлений без отмеченных пробелов — <b>'+model.validCount+'</b>, предварительных — <b>'+model.provisionalCount+'</b>. Штриховая обводка отмечает значения, для которых состав продуктов требует уточнения.</p>'+
  '<p><strong>Цвет — направление, штриховка — надёжность.</strong> Зелёный отмечает достижение выбранного ориентира, янтарный — меньшую долю. Для предварительных данных цвет приглушён и не означает медицинского заключения. Красный используется только при надёжных данных и применимом верхнем уровне.</p>'+
  '<p>Нажмите на любую точку или название вещества ниже: откроется справка о его роли, источниках и точном расчёте. Превышение 100% не считается ухудшением автоматически.</p></div>'+
   '<div class="nut-radial-support">'+methodsButton+macroPanel+'</div>'+focusMarkup+'</div>'+
  '<details class="nut-radial-data"'+(print?' open':'')+'><summary>Все показатели, точные значения и пояснения ('+visible.length+')</summary>'+
   '<div class="nut-radial-data-grid">'+list+'</div></details>'+
  '<p class="nut-viz-disclaimer">Показаны вещества, поступающие с введёнными продуктами, а не измеренная обеспеченность организма. Недостаток записей за день и погрешности состава ограничивают выводы. Сравнение с UL описывает возможное превышение ориентира в введённом рационе и само по себе не является диагнозом или оценкой хронического воздействия.</p></section>';
}
