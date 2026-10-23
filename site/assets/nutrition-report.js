// One clinical-context appendix shared by on-screen needs and full PDF.
// No clinical recommendations or new numerical targets are calculated here.
const defined=x=>x!==undefined&&x!==null&&String(x).trim()!=='';
const safeText=(x,esc)=>esc(defined(x)?x:'не указано');
const stateLabels={normal:'Обычный профиль',rehab:'Реабилитация / набор',
  preop:'Предоперационный период',postop:'Послеоперационный период',
  icu:'ОРИТ',elderly:'Пожилой пациент',ckd:'ХБП без диализа',
  dialysis:'Диализ',oncology:'Онкология'};
const roles={physician:'Лечащий врач',clinical_dietitian:'Клинический диетолог',
  multidisciplinary_team:'Мультидисциплинарная команда',
  other_clinician:'Другой медицинский специалист'};
const phases={stable:'Стабильное состояние',acute_early:'Острая ранняя фаза',acute_late:'Острая поздняя фаза',
  recovery:'Восстановление',preoperative:'Предоперационная',postoperative:'Послеоперационная',active_treatment:'Активное лечение',other:'Другая'};
const routes={oral:'Пероральный',enteral:'Энтеральный',parenteral:'Парентеральный',mixed:'Смешанный'};
const list=(items,esc)=>Array.isArray(items)&&items.length?'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'';
function entry(label,value,esc){return '<div><dt>'+esc(label)+'</dt><dd>'+safeText(value,esc)+'</dd></div>';}
export function renderClinicalReview(needs,profile,fmt,esc,options={}){
  const m=needs?.meta,policy=needs?.policy||m?.protectedPolicy,risk=m?.refeedingRisk,clinical=!!policy?.protectedMode;
  const clinicalInput=['preop','postop','icu','ckd','dialysis','oncology'].includes(profile?.state);
  const lifeStage=['pregnancy','lactation'].includes(profile?.guardrail);
  const blocked=!!needs&&!m&&(policy?.calculationAllowed===false||!!needs.reason);
  const highRisk=risk?.highRisk===true;
  const print=options.print===true;
  if(!print&&!clinical&&!clinicalInput&&!lifeStage&&!highRisk)return '';
  const title='<h3>Клинический контекст и ограничения расчёта</h3>';
  const inputs=entry('Выбранный режим',stateLabels[profile?.state]||profile?.state||'Обычный профиль',esc)+
    entry('Особые условия',profile?.guardrail&&profile.guardrail!=='none'?profile.guardrail:'нет',esc);
  const target=policy?.clinicalTarget||m?.clinicalTarget||null;
  const targetRows=clinicalInput?'<h4>Внешняя клиническая цель</h4><dl>'+
    entry('Энергия',defined(target?.energy)?fmt(target.energy,0)+' ккал/сут':profile?.clinical_energy_manual,esc)+
    entry('Белок',defined(target?.protein)?fmt(target.protein,1)+' г/сут':profile?.protein_manual,esc)+
    entry('Расчётная / сухая масса',defined(target?.referenceWeightKg)?fmt(target.referenceWeightKg,1)+' кг':profile?.clinical_reference_weight,esc)+
    entry('Подтвердивший специалист',target?.confirmedBy||profile?.clinical_confirmed_by,esc)+
    entry('Роль специалиста',roles[target?.confirmedRole||profile?.clinical_confirmed_role]||target?.confirmedRole||profile?.clinical_confirmed_role,esc)+
    entry('Дата подтверждения',target?.confirmedAt||profile?.clinical_confirmed_at,esc)+
    entry('Дата пересмотра',target?.reviewDueAt||profile?.clinical_review_due_at,esc)+
    entry('Метод / протокол',target?.sourceMethod||profile?.clinical_source_method,esc)+
    entry('Фаза',phases[target?.phase||profile?.clinical_phase]||target?.phase||profile?.clinical_phase,esc)+
    entry('Путь питания',routes[target?.route||profile?.clinical_route]||target?.route||profile?.clinical_route,esc)+
    '</dl>':'';
  let outcome='';
  if(blocked)outcome='<div class="nut-callout"><strong>Автоматический расчёт заблокирован.</strong> '+
    esc(needs.reason||needs.errors?.join('. ')||'Не выполнены требования режима.')+'</div>';
  else if(m?.externalClinicalTargetApplied)outcome='<p><strong>Использована подтверждённая внешняя клиническая цель.</strong> Энергия и белок не рассчитаны по общим популяционным коэффициентам. Автоматическое распределение пищи, расчёт жидкости и общий нутритивный планировщик отключены.</p>';
  else if(m?.energyEstimateOnly)outcome='<p><strong>Справочная оценка, не назначение питания.</strong> Ввод рациона и оценка состава остаются доступны; автоматические назначения и распределение по приёмам отключены.</p>';
  else if(m)outcome='<p>Расчёт выполнен в пределах выбранного режима. Его корректность зависит от полноты исходных данных.</p>';
  const riskBlock=risk?.applicable?'<h4>Проверка риска рефидинга · NICE CG32</h4>'+
    '<p><strong>'+esc(risk.label||'Результат не определён')+'</strong>. Это проверка перечисленных критериев, не самостоятельный клинический диагноз.</p>'+
    list(risk.reasons,esc)+(risk.missing?.length?'<p class="nut-viz-detail-note">Неуточнённые данные: '+esc(risk.missing.join(', '))+'.</p>':'')+
    (highRisk?'<p><strong>Высокий риск:</strong> показанная полная потребность не должна использоваться как стартовый план питания без клинического протокола.</p>':''):'';
  const limits=(m?.protectedPolicy||policy)?'<h4>Ограничения функций</h4><dl>'+
    entry('Ориентиры нутриентов',m?.normsSyncAllowed===false?'Не синхронизируются':'Зависят от индивидуального расчёта',esc)+
    entry('Распределение по приёмам',m?.mealSplitAllowed===false||policy?.mealSplitAllowed===false?'Отключено':'Доступно в допустимом режиме',esc)+
    entry('Ориентир по жидкости',policy?.fluidEstimateAllowed===false?'Отключён':'Доступен при наличии исходных данных',esc)+
    entry('Автоматические рекомендации',policy?.automaticPlannerAllowed===false?'Отключены':'Требуют отдельной проверки',esc)+'</dl>':'';
  return '<section class="nut-clinical-review" aria-label="Клинические ограничения">'+title+
    '<dl>'+inputs+'</dl>'+outcome+targetRows+riskBlock+limits+
    '<p class="nut-viz-detail-note">Область применения: справочный калькулятор. Внешняя цель — введённые пользователем сведения, а не подтверждение подлинности назначения системой. Анализ рациона не заменяет клинические обследования и оценку специалиста.</p></section>';
}
export function renderRationPrintTable(items,engine,fmt,esc){
  if(!Array.isArray(items)||!items.length)return '<p>Рацион не введён.</p>';
  const rows=items.map((it,i)=>{
    const p=engine.db.byKey.get(it.key),label=document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p?.name_ru||p?.name||it.key;
    const grams=Number(it.grams),energy=typeof p?.kcal==='number'&&Number.isFinite(p.kcal)&&Number.isFinite(grams)?p.kcal*grams/100:NaN;
    const q=p?engine.quality.classifyProduct(p):null;
    const quality=q?.review_status==='VERIFIED'?'проверенная':q?.review_status==='CONDITIONALLY_ACCEPTED'?'условно принятая':q?.review_status||'статус не установлен';
    return '<tr><td>'+esc(String(i+1))+'</td><td>'+esc(label)+'</td><td>'+esc(fmt(grams,1))+' г</td><td>'+esc(quality)+'</td><td>'+(Number.isFinite(energy)?fmt(energy,0)+' ккал':'—')+'</td></tr>';
  }).join('');
  return '<section class="nut-report-ration"><h3>Продукты и количества</h3><p>Именно эти продукты и количества использованы при анализе. Значения из неполных карточек могут быть приблизительными.</p>'+
    '<table class="nut-report-items"><thead><tr><th>№</th><th>Продукт</th><th>Количество</th><th>Проверка</th><th>Энергия</th></tr></thead><tbody>'+rows+'</tbody></table></section>';
}


const sexLabels={male:'Мужской',female:'Женский'};
const methodLabels={mifflin:'Миффлин — Сан Жеор',weight:'Оценка по массе',
  rus_child_norm:'Возрастная норма (дети)',life_stage:'Возрастно-физиологический режим',
  clinical_external:'Внешняя подтверждённая цель'};
export function renderNeedsPrintSection(needs,profile,engine,fmt,esc){
  const m=needs?.meta,targets=m?.personalProfile?.targetMeta||{};
  const ageValue=Number(profile?.age),weight=Number(profile?.w),height=Number(profile?.h);
  const demographics='<dl>'+
    entry('Возраст',Number.isFinite(ageValue)&&ageValue>0?fmt(ageValue,0)+' лет':null,esc)+
    entry('Пол',sexLabels[profile?.sex]||profile?.sex,esc)+
    entry('Масса тела',Number.isFinite(weight)&&weight>0?fmt(weight,1)+' кг':null,esc)+
    entry('Рост',Number.isFinite(height)&&height>0?fmt(height,0)+' см':null,esc)+
    entry('База ориентиров',profile?.region==='eu'?'ЕС · EFSA':'США · DRI',esc)+
    entry('Расчётный метод',m?(methodLabels[m.method]||m.method):'Не выполнен',esc)+'</dl>';
  const macroKeys=['kcal','protein_g','fat_g','carbs_g'];
  const fullTargets=macroKeys.map(key=>{
    const raw=targets[key]?.value;
    const label=engine?.defaults?.[key]?.title||key;
    const unit=engine?.defaults?.[key]?.unit||'';
    return entry(label,typeof raw==='number'&&Number.isFinite(raw)?fmt(raw,key==='kcal'?0:1)+' '+unit:'Не рассчитан',esc);
  }).join('');
  const block=m?'<h4>Расчётные ориентиры</h4><dl>'+fullTargets+'</dl>'+
    (typeof m.usedWeight==='number'&&Number.isFinite(m.usedWeight)?'<p>Масса, использованная для расчёта: '+fmt(m.usedWeight,1)+' кг.</p>':'')+
    (m.autoReason?'<p>'+esc(m.autoReason)+'</p>':'')+
    (m.proteinNote?'<p>'+esc(m.proteinNote)+'</p>':'')+
    (m.personalProfile?.caution?'<p><strong>Ограничения:</strong> '+esc(m.personalProfile.caution)+'</p>':''):
    '<p><strong>Автоматический расчёт потребностей не завершён.</strong> Результаты анализа пищевого состава сохраняют информационный характер. Нерассчитанные потребности не подменяются универсальными числами.</p>';
  return '<section class="nut-clinical-review nut-report-needs" aria-label="Исходные данные и потребности">'+
    '<h3>Исходные данные и оценка потребностей</h3>'+demographics+block+
    '<p class="nut-viz-detail-note">Сведения введены пользователем и не проверяются по медицинским документам автоматически. Ориентиры должны оцениваться в контексте состояния и назначений.</p></section>';
}
