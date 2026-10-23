import {sendHandoff,peekHandoff,clearHandoff} from './nutrition-handoff.js?v=20261011c';
const root = document.querySelector('[data-nutrition-runtime]');
const EN = document.documentElement.lang === 'en';
const displayFood = p => EN && window.VMNutritionEN ? window.VMNutritionEN.foodName(p) : (p?.name_ru || p?.name || p?.key || '');
import {renderNutritionVisuals,renderNeedsBreakdown,nutrientDataAudit,isUpperNutrientLimit} from './nutrition-visuals.js?v=analysis-clarity-20261010-en1';
import {buildRadialNutritionProfile,renderRadialNutritionProfile} from './nutrition-radial.js?v=radial-workspace-20261011d-en1';
import {initRadialProfileControls} from './nutrition-radial-controls.js?v=radial-workspace-20261011d-en1';
import {renderRadialNutrientGuide} from './nutrition-radial-guide.js?v=food-scroll-20261011-en1';
import {attachNutrientSourceExplorer} from './nutrition-source-explorer.js?v=visuals-20261010-b-en1';
import {calculateStructureProfile,renderStructureMatrix} from './nutrition-structure.js?v=structure-language-20261011-en1';
import {assessStructureScenarios,renderStructureScenarios} from './nutrition-structure-actions.js?v=structure-groups-20261011-en1';
import {renderClinicalReview,renderRationPrintTable,renderNeedsPrintSection} from './nutrition-report.js?v=visuals-20261010-f-en1';
const [{WorkspaceStorage},{importLegacyRation}]=await Promise.all([import('./workspace-storage.js?v='+root.dataset.storageVersion),import('./nutrition-legacy.js?v='+root.dataset.legacyVersion)]);
const $ = selector => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (value,digits=1) => Number.isFinite(value) ? value.toLocaleString(EN?'en-US':'ru-RU',{maximumFractionDigits:digits}) : '—';
const number = value => { const text=String(value).trim().replace(',','.'); return /^(?:\d+\.?\d*|\.\d+)$/.test(text)?Number(text):NaN; };
const quantityText = (grams,unit) => (grams/(unit==='kg'?1000:1)).toLocaleString(EN?'en-US':'ru-RU',{maximumSignificantDigits:15,useGrouping:false});
const quantityDrafts = new Map();
const SOURCE='4e8f51d28acc7c2c842dd859e03c3aa5e8eb22bf';
const sections=['needs','ration','analysis','improve','report'];
const viewKey='vesninmed:nutrition:last-section:v1';
function initialSection(){
  if(location.hash)return location.hash.slice(1);
  try{const saved=sessionStorage.getItem(viewKey);if(sections.includes(saved))return saved;}catch{}
  return 'ration';
}
let engine, specs, needsResult, lastResult, currentSummary, writePromise=Promise.resolve();
let heiView='all',heiKind='all';
let structureScenarioCache=null;
let lastStructureHelpTrigger=null;
let lastRadialGuideTrigger=null,lastRadialModel=null,lastRadialMethodTrigger=null;
let recognitionPanel, recognitionLoading=false, aiSelection=null;
let domain={version:1,profile:{region:'us'},ration:[],customProducts:[],analysis:null,recognitionDraft:null};
const macros=['kcal','protein_g','fat_g','carbs_g'];
const labels={person_name:'Имя или псевдоним (необязательно)',sex:'Пол',h:'Рост, см',w:'Масса, кг',age:'Возраст, лет',state:'Состояние',activity:'Активность',edema:'Отёки / асцит',goal:'Цель',diet_style:'Пищевой стиль',guardrail:'Особые условия',nasem_pal:'Активность по NASEM',gestation_week:'Неделя беременности',prepreg_w:'Масса до беременности, кг',fetus_count:'Число плодов',pregnancy_complications:'Осложнения беременности',postpartum_month:'Месяцев после родов',lactation_feeding:'Вскармливание',clinical_energy_manual:'Клиническая цель энергии, ккал',clinical_reference_weight:'Клиническая расчётная масса, кг',clinical_confirmed_by:'Специалист, подтвердивший цель',clinical_confirmed_role:'Роль специалиста',clinical_confirmed_at:'Дата подтверждения',clinical_review_due_at:'Дата пересмотра',clinical_source_method:'Метод / протокол',clinical_phase:'Клиническая фаза',clinical_route:'Способ питания',clinical_source_note:'Комментарий к назначению',clinical_targets_confirmed:'Цели подтверждены специалистом',additional_ed_risk:'Дополнительный риск РПП',additional_medical_restriction:'Дополнительные медицинские ограничения',additional_clinical_conditions:'Сопутствующие клинические состояния',protein_manual:'Назначенный белок, г/кг',prev_w:'Предыдущая масса, кг',low_intake_days:'Дней резко сниженного питания',electrolytes:'Электролиты',refeeding_factors:'Дополнительные факторы риска рефидинга',calc_w_manual:'Подтверждённая расчётная масса, кг',split:'Распределение по приёмам пищи'};
const messages={ready:'Рацион сохраняется в этом браузере.',pending:'Сохраняю изменения…',saved:'Изменения сохранены в этом браузере.',restored:'Сохранённый рацион восстановлен.',unavailable:'Браузер не разрешил сохранить изменения. Скачайте резервную копию перед закрытием страницы.',incompatible:'Сохранённый файл не удалось прочитать. Он оставлен без изменений; текущая работа временная.',conflict:'Рацион изменился в другой вкладке. Эта вкладка не перезапишет его. Скачайте свою копию или продолжите в той вкладке.',invalid:'Не удалось сохранить изменения. Скачайте резервную копию.'};
function validRecord(value){
  const items = entries => Array.isArray(entries) && entries.length<=500 && new Set(entries.map(it=>it?.id)).size===entries.length && entries.every(it=>it && typeof it.id==='string' && /^[A-Za-z0-9_-]{1,80}$/.test(it.id) && typeof it.key==='string' && it.key.length<=200 && Number.isFinite(it.grams) && it.grams>0 && it.grams<=100000 && ['g','kg'].includes(it.unit||'g'));
  const profile = p => p && typeof p==='object' && !Array.isArray(p) && Object.entries(p).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&['string','number','boolean'].includes(typeof v));
  return value && value.version===1 && value.profile && typeof value.profile==='object' && !Array.isArray(value.profile) &&
    profile(value.profile) && items(value.ration) &&
    Array.isArray(value.customProducts) && value.customProducts.length<=100 && value.customProducts.every(p=>p && typeof p.key==='string' && p.key.startsWith('local:') && typeof p.name_ru==='string' && typeof p.kcal==='number' && p.kcal>=0 && Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v))) &&
    (value.recognitionDraft==null || Array.isArray(value.recognitionDraft)&&value.recognitionDraft.length<=40&&value.recognitionDraft.every(it=>it&&typeof it.name==='string'&&it.name.length<=200&&(it.grams===null||Number.isFinite(it.grams)&&it.grams>0&&it.grams<=100000))) &&
    (value.analysis===null || (value.analysis && typeof value.analysis.signature==='string' && typeof value.analysis.sourceCommit==='string' && Number.isFinite(value.analysis.at) && items(value.analysis.ration) && profile(value.analysis.profile)));
}
const storage=new WorkspaceStorage('nutrition',{validate:validRecord,onStatus:state=>{const el=$('[data-nutrition-storage]');el.dataset.state=state;el.textContent=messages[state]||messages.ready;}});
const signature = () => JSON.stringify({sourceCommit:SOURCE,profile:domain.profile,ration:domain.ration.map(it=>({key:it.key,grams:it.grams,quantityMethod:it.quantityMethod||'USER_INPUT'})),customProducts:domain.customProducts});
const stale = () => domain.analysis && domain.analysis.signature!==signature();
function persist(){writePromise=storage.write(domain);return writePromise;}
function installCustomProducts(){
  for(const p of domain.customProducts){const current=engine.db.byKey.get(p.key);if(current)Object.assign(current,p);else{engine.db.items.push(p);engine.db.byKey.set(p.key,p);}}
}
function setSection(section,{navigate=false,focus=false}={}){
  if(!sections.includes(section))section='ration';
  const invalid=navigate&&['analysis','improve','report'].includes(section)?root.querySelector('[data-quantity][aria-invalid="true"]'):null;
  if(invalid)section='ration';
  try{sessionStorage.setItem(viewKey,section);}catch{}
  for(const item of root.querySelectorAll('[data-nut-panel]'))item.hidden=item.dataset.nutPanel!==section;
  for(const link of root.querySelectorAll('[data-nut-section]')){if(link.dataset.nutSection===section)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  if(['analysis','improve','report'].includes(section))renderResults();
  const panel=root.querySelector('[data-nut-panel="'+section+'"]');
  if(navigate){if(location.hash!=='#'+section)history.replaceState(history.state,'','#'+section);panel.scrollIntoView({block:'start',behavior:'instant'});}
  if(invalid){invalid.focus();invalid.reportValidity();}
  else if(focus){const heading=panel.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
function field(key){
  const spec=specs[key]||{type:'text',options:[]}, label=labels[key]||key;
  const value=domain.profile[key]??spec.value??'';
  if(!(key in domain.profile))domain.profile[key]=spec.type==='checkbox'?false:value;
  const id='nut-profile-'+key;
  if(spec.type==='checkbox')return `<label class="nut-check"><input id="${id}" type="checkbox" data-profile="${key}" ${value===true?'checked':''}>${esc(label)}</label>`;
  let input;
  if(spec.type==='select')input=`<select id="${id}" data-profile="${key}">${spec.options.map(o=>`<option value="${esc(o.value)}" ${String(value)===o.value?'selected':''}>${esc(o.label)}</option>`).join('')}</select>`;
  else input=`<input id="${id}" data-profile="${key}" type="${spec.type==='date'?'date':'text'}" ${spec.type==='number'?'inputmode="decimal"':''} value="${esc(value)}" maxlength="${spec.type==='number'?12:300}" ${['h','w','age'].includes(key)?'required':''} placeholder="${esc(spec.placeholder)}">`;
  return `<label class="${key==='person_name'?'nut-wide':''}" for="${id}" data-field-row="${key}">${esc(label)}${input}</label>`;
}
function renderProfile(){
  const basic=['person_name','sex','age','h','w','activity','goal','diet_style'];
  $('#needs-basic').innerHTML=basic.map(field).join('')+`<label for="nut-norm-region">Нормативы<select id="nut-norm-region" data-profile="region"><option value="us" ${domain.profile.region!=='eu'?'selected':''}>США · DRI</option><option value="eu" ${domain.profile.region==='eu'?'selected':''}>ЕС · EFSA</option></select></label>`;
  const groups=[
    {name:'Условия расчёта',description:'Уточните состояние, медицинские ограничения и особые периоды.',keys:['state','guardrail','edema','additional_ed_risk','additional_medical_restriction','additional_clinical_conditions','nasem_pal','gestation_week','prepreg_w','fetus_count','pregnancy_complications','postpartum_month','lactation_feeding']},
    {name:'Клиническое назначение',description:'Цели энергии и белка вводятся только по назначению специалиста. Система не подтверждает подлинность назначения.',keys:['clinical_energy_manual','protein_manual','clinical_reference_weight','clinical_confirmed_by','clinical_confirmed_role','clinical_confirmed_at','clinical_review_due_at','clinical_source_method','clinical_phase','clinical_route','clinical_targets_confirmed']},
    {name:'Питательный статус и риск рефидинга',description:'Важны прежняя масса, снижение питания и сведения об электролитах.',keys:['prev_w','weight_loss_pct','low_intake_days','electrolytes','refeeding_factors','calc_w_manual']},
    {name:'План приёмов пищи',description:'Схема распределяет расчётную энергию, а не фактически съеденные блюда.',keys:['split']}
  ];
  const used=new Set(basic);
  $('#needs-additional').innerHTML=groups.map((g,i)=>{
    const present=g.keys.filter(k=>specs[k]&&labels[k]);present.forEach(k=>used.add(k));
    return '<fieldset class="nut-profile-group" data-profile-group="'+i+'"><legend>'+esc(g.name)+'</legend><p class="nut-profile-help">'+esc(g.description)+'</p><div class="nut-fields">'+present.map(field).join('')+'</div></fieldset>';
  }).join('')+Object.keys(specs).filter(k=>!used.has(k)&&labels[k]).map(field).join('');
  updateConditionalFields();
}
function updateConditionalFields(){
  const guard=domain.profile.guardrail||'none';
  const clinical=engine.protectedModes.isClinicalState(domain.profile.state||'normal');
  const signedTarget=clinical||['ed_risk','medical_restriction'].includes(guard)||
    domain.profile.additional_ed_risk===true||domain.profile.additional_medical_restriction===true||
    domain.profile.additional_clinical_conditions===true||
    (guard==='pregnancy'&&domain.profile.pregnancy_complications==='yes');
  const pregnancy=['gestation_week','prepreg_w','fetus_count','pregnancy_complications'];
  const lactation=['postpartum_month','lactation_feeding'];
  const clinicalKeys=['clinical_energy_manual','protein_manual','clinical_reference_weight','clinical_confirmed_by','clinical_confirmed_role','clinical_confirmed_at','clinical_review_due_at','clinical_source_method','clinical_phase','clinical_route','clinical_targets_confirmed'];
  for(const row of root.querySelectorAll('[data-field-row]')){
    const key=row.dataset.fieldRow;
    row.hidden = pregnancy.includes(key)?guard!=='pregnancy':
      lactation.includes(key)?guard!=='lactation':
      key==='nasem_pal'?!['pregnancy','lactation'].includes(guard):
      clinicalKeys.includes(key)?!signedTarget:false;
  }
  const proteinInput=root.querySelector('[data-field-row="protein_manual"]');
  const proteinGroup=root.querySelector('[data-profile-group="'+(signedTarget?'1':'3')+'"] .nut-fields');
  if(proteinInput&&proteinGroup){
    if(proteinInput.parentElement!==proteinGroup)proteinGroup.appendChild(proteinInput);
    if(proteinInput.firstChild?.nodeType===3)proteinInput.firstChild.nodeValue=
      signedTarget?'Назначенная специалистом цель белка, г/сут':'Индивидуальный белок, г/кг/сут';
    proteinInput.hidden=false;
  }
  const clinicalGroup=root.querySelector('[data-profile-group="1"]');
  if(clinicalGroup){clinicalGroup.hidden=!signedTarget;clinicalGroup.dataset.active=signedTarget?'true':'false';}
}
function profileNeeds(profile){
  const canonical={...profile};
  for(const [key,spec] of Object.entries(specs))if(spec.type==='number'&&canonical[key]!==''&&canonical[key]!=null)canonical[key]=String(canonical[key]).replace(',','.');
  return engine.needs(canonical);
}
function knownAmount(values,items,key){return items?.length&&engine.quality.nutrientAnalysis(items,engine.db,key).missing_products>=items.length?NaN:values?.[key];}
function valueCards(values,items=null){return '<div class="nut-values">'+macros.map(key=>`<div><span>${esc(engine.defaults[key].title)}</span><strong>${fmt(knownAmount(values,items,key))} <small>${esc(engine.defaults[key].unit)}</small></strong></div>`).join('')+'</div>';}
function renderNeeds(){
  if(!needsResult?.meta){$('#needs-result').innerHTML=needsResult?`<div class="nut-error">${esc(needsResult.errors.join(' ')||needsResult.reason||'Проверьте исходные данные.')}</div>`+renderClinicalReview(needsResult,domain.profile,fmt,esc):'';return;}
  const m=needsResult.meta,targets=m.personalProfile.targetMeta;
  $('#needs-result').innerHTML=`<h3>Расчётные ориентиры</h3>${valueCards(Object.fromEntries(macros.map(k=>[k,targets[k]?.value])))}<p class="nut-quality">${esc(m.personalProfile.ageGroup.label)} · ${esc(m.activityLabel)} · ${esc(m.goalLabel)}</p>${m.personalProfile.caution?`<div class="nut-callout">${esc(m.personalProfile.caution)}</div>`:''}<details class="nut-secondary"><summary>Как получен результат</summary><p>Энергия: ${fmt(m.energyLow,0)}–${fmt(m.energyHigh,0)} ккал. Расчётная масса: ${fmt(m.usedWeight)} кг.</p><p>${esc(m.autoReason)}</p><p>${esc(m.proteinNote)}</p>${formulaSources(m.formulaAudit)}</details>`;
  $('#needs-result').insertAdjacentHTML('beforeend',renderNeedsBreakdown(m,fmt,esc)+renderClinicalReview(needsResult,domain.profile,fmt,esc));


}
function sourceDescription(product){
  if(product.key.startsWith('local:'))return 'С этикетки · '+(product.local_source||'свой продукт');
  const q=engine.quality.classifyProduct(product);
  return q.source_kind==='AI_ESTIMATE'?'Оценка AI':q.tier==='HIGH'?'Справочная запись':q.tier==='MEDIUM'?'Справочная / модельная запись':'Данные требуют проверки';
}
function search(){
  const query=$('#food-search').value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
  const list=$('#food-results');
  if(query.length<2){list.hidden=true;$('#food-search-status').textContent=`В базе ${engine.db.items.length} продуктов. Введите хотя бы две буквы.`;return;}
  const words=query.split(/\s+/);
  const all=engine.db.items.filter(p=>words.every(w=>(p.name_ru+' '+p.name+' '+(p.tags||[]).join(' ')+(EN&&window.VMNutritionEN?' '+window.VMNutritionEN.foodName(p):'')).toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(w)));
  const result=all.slice(0,16);
  list.innerHTML=result.map(p=>`<li><button type="button" data-add-food="${esc(p.key)}"><span><strong>${esc(displayFood(p))}</strong><small>${fmt(p.kcal,0)} ккал / 100 г · ${esc(sourceDescription(p))}</small></span><span class="nut-search-add" aria-hidden="true">+</span><span class="visually-hidden">Добавить ${fmt(aiSelection?.grams||100)} г</span></button></li>`).join('');
  list.hidden=!result.length;
  $('#food-search-status').textContent=result.length?`Найдено: ${all.length}${all.length>16?'. Уточните запрос, чтобы увидеть остальные продукты.':'. Нажмите на продукт, чтобы добавить 100 г.'}`:'Ничего не найдено. Уточните название или внесите свой продукт с этикетки.';
  if(aiSelection)$('#food-search-status').innerHTML=`Выберите продукт для «${esc(aiSelection.name)}»: добавить ${fmt(aiSelection.grams)} г. <button type="button" class="nut-text-button" data-clear-ai-selection>Отменить выбор</button>`;
}
function renderRation(){
  $('#ration-rows').innerHTML=domain.ration.map(it=>{
    const p=engine.db.byKey.get(it.key),name=p?displayFood(p):it.key;
    return `<tr data-ration-id="${esc(it.id)}"><td><span class="nut-food-name">${esc(name)}</span><span class="nut-food-source">${esc(p?sourceDescription(p):'Запись недоступна в этой версии базы')}${it.quantityMethod==='AI_ESTIMATED'?' · количество оценено AI':it.quantityMethod==='LEGACY_IMPORT'?' · количество из файла':''}</span></td><td><div class="nut-quantity"><input data-quantity="${esc(it.id)}" aria-label="Количество: ${esc(name)}" aria-describedby="quantity-error-${esc(it.id)}" inputmode="decimal" value="${quantityText(it.grams,it.unit)}"><select data-unit="${esc(it.id)}" aria-label="Единица количества: ${esc(name)}"><option value="g" ${it.unit!=='kg'?'selected':''}>г</option><option value="kg" ${it.unit==='kg'?'selected':''}>кг</option></select></div><span class="nut-quantity-error" id="quantity-error-${esc(it.id)}" role="alert" hidden></span></td><td class="nut-energy"><span data-item-energy="${esc(it.id)}">${fmt(p?.kcal*it.grams/100,0)}</span> <span class="nut-hint">ккал</span></td><td><button type="button" class="nut-remove" data-remove-food="${esc(it.id)}" aria-label="Удалить: ${esc(name)}">×</button></td></tr>`;
  }).join('');
  for(const input of root.querySelectorAll('[data-quantity]'))if(quantityDrafts.has(input.dataset.quantity)){input.value=quantityDrafts.get(input.dataset.quantity);quantityError(input,'Количество не принято. Введите значение больше 0, до 100 000 г (100 кг).');}
  for(const id of quantityDrafts.keys())if(!domain.ration.some(it=>it.id===id))quantityDrafts.delete(id);
  $('#ration-empty').hidden=domain.ration.length>0;$('#ration-table').hidden=!domain.ration.length;
  $('[data-ration-count]').textContent=`Продуктов: ${domain.ration.length}`;
  root.querySelectorAll('[data-analyze]').forEach(b=>b.disabled=!domain.ration.length);
  $('[data-clear-ration]').hidden=!domain.ration.length;
  renderSummary();
}
function quantityError(input,message){
  input.setCustomValidity(message);if(message)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');
  const error=document.getElementById(input.getAttribute('aria-describedby'));error.textContent=message;error.hidden=!message;
}
function dashFact(label,value,missing=false){return `<div class="nut-dash-fact${missing?' is-missing':''}"><dt>${esc(label)}</dt><dd>${value==null||value===''?'—':esc(value)}</dd></div>`;}
function renderSummary(){
  currentSummary=engine.analyze(domain.ration);
  const p=domain.profile||{};
  const n=key=>{const x=number(p[key]??'');return Number.isFinite(x)&&x>0?x:NaN;};
  const age=n('age'),height=n('h'),weight=n('w');
  const missing=[['age','Возраст'],['h','Рост'],['w','Масса']].filter(([key])=>String(p[key]??'').trim()===''||!Number.isFinite(n(key)));
  const shown=(v,d=0)=>Number.isFinite(v)?fmt(v,d):'—';
  const bmi=Number.isFinite(weight)&&Number.isFinite(height)&&height>0?weight/(height/100)**2:NaN;
  const gender={male:'Мужской',female:'Женский'}[p.sex]||'—';
  const profileName=String(p.person_name||'').trim();
  const profileCompleted=missing.length===0;
  const m=needsResult?.meta, targets=m?.personalProfile?.targetMeta||{};
  const verifiedTarget=k=>{const x=Number(targets[k]?.value);return targets[k]?.value!==null&&targets[k]?.value!==undefined&&Number.isFinite(x)&&x>=0?x:NaN;};
  const energyTarget=verifiedTarget('kcal');
  const modeLabel=key=>{const spec=specs?.[key];return spec?.options?.find(o=>o.value===p[key])?.label||String(p[key]||'');};
  const conditions=[];
  if(p.state&&p.state!=='normal')conditions.push(modeLabel('state'));
  if(p.guardrail&&p.guardrail!=='none')conditions.push(modeLabel('guardrail'));
  if(p.additional_ed_risk===true)conditions.push('Дополнительный риск РПП');
  if(p.additional_medical_restriction===true)conditions.push('Медицинские ограничения');
  if(p.additional_clinical_conditions===true)conditions.push('Сопутствующие состояния');
  const policy=needsResult?.policy||m?.protectedPolicy;
  const clinicallyConfirmed=!!m?.externalClinicalTargetApplied;
  const restricted=!!policy?.protectedMode||!!(needsResult&&!m&&(policy?.calculationAllowed===false||needsResult.reason));
  const incompleteHelp=missing.length
    ?`<div class="nut-dash-next"><span class="nut-dash-next-title">Для расчёта потребностей укажите:</span>${missing.map(([key,label])=>`<a href="#needs" data-dash-focus="${esc(key)}">${esc(label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>`
    :!m?`<a class="nut-dash-action" href="#needs" data-dash-focus="needs-submit">${needsResult?'Проверить исходные данные':'Рассчитать потребности'} <span aria-hidden="true">↗</span></a>`:'';
  const targetRows=['protein_g','fat_g','carbs_g'].map(k=>{
    const label={protein_g:'Белок',fat_g:'Жиры',carbs_g:'Углеводы'}[k];
    return `<div><dt>${label}</dt><dd>${shown(verifiedTarget(k),0)} <small>г/сут</small></dd></div>`;
  }).join('');
  const targetsMarkup=m?`<div class="nut-dash-target"><div class="nut-dash-target-head"><span>Расчётные ориентиры</span><span>${esc(p.region==='eu'?'EFSA':'DRI')}</span></div><div class="nut-dash-target-energy">${shown(energyTarget)} <small>ккал/сут</small></div><dl class="nut-dash-target-macros">${targetRows}</dl>${m.personalProfile?.caution?'<p class="nut-dash-caution">При расчёте есть ограничения. Откройте раздел «Потребности» для пояснений.</p>':''}</div>`:'';
  const clinicalMarkup=conditions.length?`<div class="nut-dash-conditions"><div class="nut-dash-line-title">Выбранные условия</div><p>${esc(conditions.join(' · '))}</p>${clinicallyConfirmed?'<small>Применена подтверждённая специалистом клиническая цель.</small>':restricted?'<small>Клинические ориентиры требуют проверки или подтверждения; автоматический расчёт может быть ограничен.</small>':!m?'<small>Условия выбраны. Рассчитайте потребности, чтобы проверить их применимость.</small>':'<small>Условия учтены в пределах доступного расчёта. Подробности — в разделе «Потребности».</small>'}</div>`:'';
  const profileHtml=`<section class="nut-dash-card" aria-labelledby="nut-dash-profile-title"><div class="nut-dash-section-head"><h3 id="nut-dash-profile-title">Профиль</h3><a href="#needs">Изменить <span aria-hidden="true">↗</span></a></div>${profileName?`<p class="nut-dash-person">${esc(profileName)}</p>`:''}<dl class="nut-dash-facts">${dashFact('Возраст',Number.isFinite(age)?shown(age)+' лет':null)}${dashFact('Масса',Number.isFinite(weight)?shown(weight,1)+' кг':null)}${dashFact('Рост',Number.isFinite(height)?shown(height,1)+' см':null)}${dashFact('ИМТ',shown(bmi,1))}${dashFact('Пол',gender)}</dl>${profileCompleted?'<p class="nut-dash-hint">Проверьте предзаполненные значения пола, активности и цели.</p>':''}${incompleteHelp}${targetsMarkup}${clinicalMarkup}</section>`;
  const hasFood=domain.ration.length>0;
  const metric=(key,label)=>{
    const v=hasFood?knownAmount(currentSummary.totals,domain.ration,key):NaN;
    const target=verifiedTarget(key),ratio=Number.isFinite(v)&&Number.isFinite(target)&&target>0?v/target*100:NaN;
    return `<div class="nut-dash-metric"><dt>${label}</dt><dd>${shown(v,key==='kcal'?0:1)} <small>${key==='kcal'?'ккал':'г'}</small></dd>${key!=='kcal'&&Number.isFinite(ratio)?`<span class="nut-dash-metric-relative">${shown(ratio)}% от ориентира</span>`:''}</div>`;
  };
  const actualEnergy=hasFood?knownAmount(currentSummary.totals,domain.ration,'kcal'):NaN;
  const energyPercent=Number.isFinite(energyTarget)&&energyTarget>0&&Number.isFinite(actualEnergy)?actualEnergy/energyTarget*100:NaN;
  const energyMeter=Number.isFinite(energyPercent)?`<div class="nut-dash-energy-compare"><div><span>Энергия / ориентир</span><strong>${shown(energyPercent)}%</strong></div><div class="nut-dash-track" role="meter" aria-label="Энергия относительно расчётного ориентира" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,Math.max(0,Math.round(energyPercent)))}" aria-valuetext="${shown(energyPercent)}% от расчётного ориентира"><span style="width:${Math.min(100,Math.max(0,energyPercent))}%"></span></div><small>${shown(actualEnergy,0)} из ${shown(energyTarget,0)} ккал за выбранный период; 100% — ориентир, не целевая оценка качества.</small></div>`:'';
  const h=currentSummary?.hei;
  const heiValid=hasFood&&h?.valid===true&&Number.isFinite(h.total);
  const heiPercent=heiValid?Math.min(100,Math.max(0,h.total)):0;
  const heiBlock=heiValid?`<div class="nut-dash-hei"><div class="nut-dash-hei-head"><span>Индекс HEI‑2020</span><strong>${shown(h.total,0)}<small> / 100</small></strong></div><div class="nut-dash-track nut-dash-hei-track" role="meter" aria-label="Ориентировочный балл HEI‑2020" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(heiPercent)}"><span style="width:${heiPercent}%"></span></div><p>Предварительная оценка структуры питания; часть пищевых эквивалентов может быть модельной. <a href="#analysis">Подробнее ↗</a></p></div>`:`<p class="nut-dash-hei-unavailable">HEI пока не рассчитан: проверьте энергетическую ценность введённых продуктов. <a href="#ration">К рациону ↗</a></p>`;
  const structurePreview=lastResult&&!stale()&&domain.analysis?.ration?.length?calculateStructureProfile(lastResult,engine,domain.analysis.ration):null;
  const structureReady=Number.isFinite(structurePreview?.structure)&&Number.isFinite(structurePreview?.hei);
  const structureMarkup=structureReady?
    `<div class="nut-dash-structure"><div class="nut-dash-hei-head"><span>Структура рациона</span><strong>${shown(structurePreview.structure,0)}<small> / 100</small></strong></div><div class="nut-dash-track nut-dash-structure-track" role="meter" aria-label="Оценка структуры рациона" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.max(0,Math.min(100,structurePreview.structure)))}"><span style="width:${Math.max(0,Math.min(100,structurePreview.structure))}%"></span></div><p>Шесть составляющих и их вклад в оценку. <a href="#analysis" data-dash-structure>Открыть разбор ↗</a></p></div>`:
    (structurePreview?.unavailableReason?`<p class="nut-dash-structure-unavailable">Структурная оценка ограничена для выбранного клинического сценария. <a href="#analysis">Почему ↗</a></p>`:
    `<p class="nut-dash-structure-unavailable">Оценка структуры появится после анализа подходящего рациона. <a href="#analysis">К анализу ↗</a></p>`);
  const rationHtml=`<section class="nut-dash-card nut-dash-ration" aria-labelledby="nut-dash-ration-title"><div class="nut-dash-section-head"><h3 id="nut-dash-ration-title">Введено в рацион</h3><a href="#ration">Изменить <span aria-hidden="true">↗</span></a></div>${hasFood?`<p class="nut-dash-context">${domain.ration.length} ${domain.ration.length===1?'позиция':domain.ration.length<5?'позиции':'позиций'} · данные по введённым продуктам</p><dl class="nut-dash-metrics">${metric('kcal','Энергия')}${metric('protein_g','Белки')}${metric('fat_g','Жиры')}${metric('carbs_g','Углеводы')}</dl>${energyMeter}${heiBlock}${structureMarkup}${stale()?'<a class="nut-dash-action" href="#analysis">Данные изменены — пересчитать анализ ↗</a>':''}`:`<div class="nut-dash-empty">Рацион пока пуст. Добавьте продукты, чтобы увидеть КБЖУ и структуру питания.<a href="#ration">Добавить продукт ↗</a></div>`}</section>`;
  const readyCount=[profileCompleted,!!m,hasFood].filter(Boolean).length;
  $('#nutrition-summary').innerHTML=`<div class="nut-dash-top"><span class="nut-dash-overline">МОЙ ОБЗОР</span><span class="nut-dash-progress" aria-label="Доступны ${readyCount} из 3 разделов сводки"><span class="nut-dash-dot ${profileCompleted?'on':''}"></span><span class="nut-dash-dot ${m?'on':''}"></span><span class="nut-dash-dot ${hasFood?'on':''}"></span></span></div>${profileHtml}${rationHtml}<p class="nut-science-note">Значения характеризуют введённый рацион и расчётные ориентиры, не устанавливают диагноз.</p>`;
}
function formulaSources(audit){
  if(!audit)return '';
  const sources=engine.formulas.data.sources,ids=new Set((audit.formulas||[]).flatMap(f=>f.source_ids||[]));
  return `<p class="nut-quality">Версия формул: ${esc(audit.registryVersion||engine.formulas.version)}. Нормативы: ${esc(engine.normative.version)}.</p><ul class="nut-source-list">${[...ids].map(id=>{const s=sources[id];return s?`<li>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`:esc(s.title)}${s.citation?' · '+esc(s.citation):''}</li>`:'';}).join('')}</ul>`;
}
function prepareLastResult(){
  if(!domain.analysis){lastResult=null;return;}
  lastResult=engine.analyze(domain.analysis.ration);
  const previousNeeds=profileNeeds(domain.analysis.profile);
  lastResult.references=engine.references(previousNeeds,domain.analysis.profile);
  lastResult.needs=previousNeeds;
  // Restore the current demographic context after deriving the last report.
  needsResult=profileNeeds(domain.profile);
}
function analyze(){
  if(!domain.ration.length)return;
  const invalid=root.querySelector('[data-quantity][aria-invalid="true"]');
  if(invalid){setSection('ration',{navigate:true});invalid.focus();invalid.reportValidity();return;}
  domain.analysis={signature:signature(),sourceCommit:SOURCE,at:Date.now(),ration:structuredClone(domain.ration),profile:structuredClone(domain.profile)};
  prepareLastResult();persist();renderSummary();renderNeeds();renderResults();setSection('analysis',{navigate:true,focus:true});
}
function nutrientTable(result,options={}){
  const printMode=options.print===true;
  const q=engine.quality,rows=Object.keys(engine.defaults).map(key=>{
    const v=result.totals[key],metric=engine.metric(key),ref=result.references[key];
    const quality=q.nutrientAnalysis(domain.analysis.ration,engine.db,({fiber_g:'fiber',sugars_g:'sugar',unsat_g:'unsaturated_fat_g'})[key]||key);
    const known=Number.isFinite(v)&&quality.missing_products<domain.analysis.ration.length;
    const audit=nutrientDataAudit(engine,domain.analysis.ration,key,esc);
    const target=ref?.value;
    const comparison=known&&Number.isFinite(target)&&target>0?fmt(v/target*100,0)+'% '+(isUpperNutrientLimit(key,ref)?'от верхнего ориентира':'от ориентира'):'—';
    return `<tr><th scope="row">${esc(metric.title)} <span class="nut-hint">${esc(engine.defaults[key].unit)}</span></th><td>${known?fmt(v):'Нет данных'}</td><td>${Number.isFinite(target)?fmt(target):'—'}</td><td>${comparison}</td><td class="nut-quality">${known?esc(audit.label):'Нет пригодных данных'}${audit.detail}</td></tr>`;
  }).join('');
  return `<details class="nut-analysis-details" data-analysis-extra="nutrients"${printMode?' open':''}><summary>Полная таблица нутриентов и качество исходных данных</summary><p>Здесь приведены все показатели. Раскройте предупреждения в колонке «Качество данных», чтобы увидеть продукты с пробелами в сведениях или условными значениями.</p><div class="nut-data-table-wrap" tabindex="0" aria-label="Таблица нутриентов; на узком экране доступна горизонтальная прокрутка"><table class="nut-data-table"><caption class="visually-hidden">Поступление нутриентов и расчётные ориентиры</caption><thead><tr><th scope="col">Показатель</th><th scope="col">В рационе</th><th scope="col">Ориентир</th><th scope="col">Сравнение</th><th scope="col">Качество данных</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
function heiTable(result,options={}){
  const printMode=options.print===true;
  const h=result.hei;if(!h.valid)return '';
  const standards=engine.hei.helpers.STD;
  const heiMethodRights="<details class=\"nut-secondary\" data-hei-method-rights><summary>Методика HEI‑2020, единицы измерения и права</summary><div class=\"nut-hint\"><p><strong>Разработчики методики.</strong> Healthy Eating Index–2020 разработан Министерством сельского хозяйства США (USDA) и Национальным институтом рака США (NCI, NIH). В основе оценивания — 13 компонентов и официальные пороги HEI‑2020 для лиц от 2 лет; итоговая шкала — от 0 до 100 баллов.</p><p><strong>Как рассчитывается показатель.</strong> Количество продуктов вводится в граммах, но баллы начисляются по официальным пищевым эквивалентам USDA и величинам на 1000 ккал фактического рациона. Cup equivalents и ounce equivalents — показатели состава пищевых групп: их нельзя переводить в граммы единым множителем. Для продуктов с неполными данными в VesninMed могут использоваться приблизительные коэффициенты пересчёта; такие результаты требуют осторожной интерпретации и не считаются независимо валидированной адаптацией HEI‑2020.</p><p><strong>Использование материалов.</strong> Русскоязычный интерфейс и программная реализация VesninMed созданы независимо, на основе опубликованных критериев NCI/USDA. Они не являются официальным продуктом NCI или USDA. The National Cancer Institute (NCI) does not endorse this translation and no endorsement by NCI should be inferred.</p><p>Первоисточники: <a href=\"https://epi.grants.cancer.gov/hei/hei-2020-table1.html\" target=\"_blank\" rel=\"noopener noreferrer\">компоненты и нормы HEI‑2020</a>; <a href=\"https://epi.grants.cancer.gov/hei/calculating-hei-scores.html\" target=\"_blank\" rel=\"noopener noreferrer\">методика вычисления</a>; <a href=\"https://epi.grants.cancer.gov/hei/sas-code.html\" target=\"_blank\" rel=\"noopener noreferrer\">эталонные алгоритмы NCI</a>; <a href=\"https://www.cancer.gov/policies/copyright-reuse\" target=\"_blank\" rel=\"noopener noreferrer\">условия повторного использования материалов NCI</a>.</p></div></details>";
  return `<details class="nut-analysis-details" data-analysis-extra="hei"${printMode?' open':''}><summary>Полная таблица баллов HEI-2020 и методика</summary><p><strong>${fmt(h.total)} / 100</strong> — оценка структуры введённого рациона. Это не оценка здоровья человека.</p><div class="nut-data-table-wrap"><table class="nut-data-table"><caption class="visually-hidden">Компоненты индекса HEI-2020</caption><thead><tr><th scope="col">Компонент</th><th scope="col">Баллы</th><th scope="col">Максимум</th></tr></thead><tbody>${Object.entries(h.points).map(([key,points])=>`<tr><th scope="row">${esc(standards[key]?.label||key)}</th><td>${fmt(points)}</td><td>${fmt(standards[key]?.pts,0)}</td></tr>`).join('')}</tbody></table></div><p class="nut-quality">${esc(result.sourceQuality.label)}. Для части продуктов используются модельные эквиваленты пищевых групп.</p>${heiMethodRights}</details>`;
}
function applyHeiFilters(){
  const panel=$('#analysis-content .nut-viz-hei');
  if(!panel)return;
  let count=0;
  for(const node of panel.querySelectorAll('.nut-viz-hei-disclosure')){
    const show=(heiView==='all'||node.dataset.tone!=='good')&&
      (heiKind==='all'||node.dataset.heiKind===heiKind);
    node.hidden=!show;if(show)count++;
  }
  for(const control of panel.querySelectorAll('[data-hei-view]'))control.setAttribute('aria-pressed',String(control.dataset.heiView===heiView));
  for(const control of panel.querySelectorAll('[data-hei-kind-filter]'))control.setAttribute('aria-pressed',String(control.dataset.heiKindFilter===heiKind));
  const empty=panel.querySelector('.nut-viz-hei-empty');if(empty)empty.hidden=count>0;
}
function renderResults(){
  if(!lastResult){const empty='<div class="nut-empty"><h3>Сначала соберите рацион</h3><p>После анализа здесь появятся состав, пищевые группы и источники расчёта.</p><a class="nut-text-button" href="#ration">К рациону</a></div>';$('#analysis-content').innerHTML=empty;$('#improve-content').innerHTML=empty;$('#report-content').innerHTML=empty;return;}
  const openDetails=new Set([...$('#analysis-content').querySelectorAll('details[open][data-hei-key],details[open][data-nutrient-key]')].map(el=>el.dataset.heiKey?'hei:'+el.dataset.heiKey:'nutrient:'+el.dataset.nutrientKey));
  const extraOpened=!!$('#analysis-content .nut-viz-nutrient-additional[open]');
  const tableOpen=new Set([...$('#analysis-content').querySelectorAll('details[data-analysis-extra][open]')].map(el=>el.dataset.analysisExtra));
  const structureOpen=new Set([...$('#analysis-content').querySelectorAll('.nut-viz-structure-domain[open]')].map(el=>el.dataset.structureDomain));
  const insightOpen=!!$('#analysis-content .nut-viz-structure-insight[open]');
  const radialOpen=!!$('#analysis-content .nut-radial-data[open]');
  const notice=stale()?'<div class="nut-callout" data-stale role="status">Рацион или профиль изменён после последнего анализа. Ниже показаны прежние значения. <button type="button" class="nut-text-button" data-analyze>Пересчитать и обновить отчёт</button></div>':'';
  const result=lastResult,meta=result.needs.meta;
  const profileNote=meta?`<p class="nut-quality">${esc(meta.personalProfile.ageGroup.label)} · ${esc(meta.activityLabel)} · ${esc(domain.analysis.profile.region==='eu'?'ЕС · EFSA':'США · DRI')}</p>`:'<div class="nut-callout">Показан фактический состав рациона. Для сравнения с индивидуальными ориентирами заполните «Потребности».</div>';
  const visuals=renderNutritionVisuals(result,engine,domain.analysis.ration,fmt,esc);
  const printVisuals=renderNutritionVisuals(result,engine,domain.analysis.ration,fmt,esc,{print:true});
  const radialModel=buildRadialNutritionProfile(result,engine,domain.analysis.ration,domain.analysis.profile);
  lastRadialModel=radialModel;
  const radial=renderRadialNutritionProfile(radialModel,fmt,esc);
  const printRadial=renderRadialNutritionProfile(radialModel,fmt,esc,{print:true});
  const printNeeds=meta?renderNeedsBreakdown(meta,fmt,esc):'';
  const structure=calculateStructureProfile(result,engine,domain.analysis.ration);
  const matrix=renderStructureMatrix(structure,fmt);
  const printMatrix=renderStructureMatrix(structure,fmt,{print:true});
  // Keep scenarios tied to the exact analyzed input, never to unsaved edits.
  const scenarioKey=String(domain.analysis?.at||'')+'|'+String(domain.analysis?.signature||'');
  if(!structureScenarioCache||structureScenarioCache.key!==scenarioKey){
    structureScenarioCache={key:scenarioKey,data:!stale()&&structure?.structure!==undefined?
      assessStructureScenarios(result,structure,engine,domain.analysis.ration,domain.analysis.profile,calculateStructureProfile):null};
  }
  const scenarios=stale()?null:structureScenarioCache.data;
  const scenarioPanel=scenarios?renderStructureScenarios(scenarios,fmt,esc):'';
  const clinicalReport=renderClinicalReview(result.needs,domain.analysis.profile,fmt,esc,{print:true});
  const needsReport=renderNeedsPrintSection(result.needs,domain.analysis.profile,engine,fmt,esc);
  const rationReport=renderRationPrintTable(domain.analysis.ration,engine,fmt,esc);
  const semantic='<p class="nut-quality">Значение ниже ориентира не доказывает клинический дефицит. Неизвестные данные не заменяются нулём. Общие сахара и ненасыщенные жиры показаны для информации.</p>';
  $('#analysis-content').innerHTML=notice+valueCards(result.totals,domain.analysis.ration)+profileNote+semantic+visuals+radial+matrix+scenarioPanel+nutrientTable(result)+heiTable(result);
  initRadialProfileControls($('#analysis-content'),radialModel);
  const priorities=meta?.personalProfile.priorities||[];
  for(const el of $('#analysis-content').querySelectorAll('details[data-hei-key],details[data-nutrient-key]'))if(openDetails.has(el.dataset.heiKey?'hei:'+el.dataset.heiKey:'nutrient:'+el.dataset.nutrientKey))el.open=true;
  if(extraOpened){const extra=$('#analysis-content .nut-viz-nutrient-additional');if(extra)extra.open=true;}
  for(const el of $('#analysis-content').querySelectorAll('details[data-analysis-extra]'))if(tableOpen.has(el.dataset.analysisExtra))el.open=true;
  for(const el of $('#analysis-content').querySelectorAll('.nut-viz-structure-domain'))if(structureOpen.has(el.dataset.structureDomain))el.open=true;
  if(insightOpen){const element=$('#analysis-content .nut-viz-structure-insight');if(element)element.open=true;}
  if(radialOpen){const element=$('#analysis-content .nut-radial-data');if(element)element.open=true;}
  applyHeiFilters();
  $('#improve-content').innerHTML=notice+`<p class="nut-intro">Изменяйте продукты и количества в разделе «Рацион» и сравнивайте повторный анализ.</p>${priorities.length?`<ol class="nut-improvements">${priorities.map(p=>`<li><h3>${esc(p.title)}</h3><p>${esc(p.action)}</p><small>${esc(p.why)}</small></li>`).join('')}</ol>`:'<p>Настройте потребности, чтобы увидеть особенности вашего профиля. Состав рациона доступен без профиля.</p>'}<a class="nut-text-button" href="#ration">Изменить рацион</a><div class="nut-callout">AI не требуется для расчёта и не меняет числовые результаты. Расширенное моделирование, конструктор рецептов и AI-планировщик пока доступны в прежней версии Nutrient. Распознавание фото и аудио находится в разделе «Рацион».</div><a class="nut-text-button" href="https://nutrient.vesninmed.ru" target="_blank" rel="noopener">Дополнительные возможности прежней версии</a>`;
  $('#report-content').innerHTML=`<h3 class="nut-print-only">Nutrient · VesninMed</h3>`+notice+`<p>${esc(domain.analysis.profile.person_name||'Анализ рациона')} · ${new Date(domain.analysis.at).toLocaleDateString(EN?'en-US':'ru-RU')}</p>`+needsReport+clinicalReport+rationReport+valueCards(result.totals,domain.analysis.ration)+profileNote+semantic+printNeeds+printVisuals+printRadial+printMatrix+nutrientTable(result,{print:true})+heiTable(result,{print:true})+formulaSources(result.formulaAudit)+formulaSources(meta?.formulaAudit)+`<p class="nut-quality">Источник вычислительного ядра: ${SOURCE.slice(0,12)}. Работа сохраняется локально; резервная копия доступна в меню «Мой рацион».</p>`;
}
function changed(){persist();renderSummary();renderResults();}
$('#nutrition-ai-form').addEventListener('submit',event=>event.preventDefault());
$('.nut-ai').addEventListener('toggle',async()=>{
  if(!$('.nut-ai').open||recognitionPanel||recognitionLoading)return;
  recognitionLoading=true;
  try{
    const {createRecognitionPanel}=await import('./nutrition-ai.js?v='+root.dataset.nutritionAiVersion);
    recognitionPanel=createRecognitionPanel({root,getDraft:()=>domain.recognitionDraft,setDraft:draft=>{domain.recognitionDraft=draft;persist();},
      onSelect:item=>{aiSelection=item;$('#food-search').value=item.name;search();$('#food-search').focus();},
      isAllowed:()=>!(domain.profile.age!==''&&Number(domain.profile.age)<18)&&needsResult?.meta?.geminiAllowed!==false&&engine.protectedModes.evaluate(engine.protectedModes.readContext()).geminiAllowed!==false});
  }catch{$('#nutrition-ai-status').textContent='Распознавание сейчас недоступно. Ручной ввод и расчёт работают.';}
  finally{recognitionLoading=false;}
});
root.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='food-search')search();
  if(el.dataset.profile){domain.profile[el.dataset.profile]=el.type==='checkbox'?el.checked:el.value;updateConditionalFields();needsResult=null;renderNeeds();changed();}
  if(el.dataset.quantity){const it=domain.ration.find(it=>it.id===el.dataset.quantity),amount=number(el.value),grams=amount*(it.unit==='kg'?1000:1);if(!Number.isFinite(grams)||grams<=0||grams>100000){quantityDrafts.set(it.id,el.value);quantityError(el,'Количество не принято. Введите значение больше 0, до 100 000 г (100 кг).');return;}quantityDrafts.delete(it.id);quantityError(el,'');it.grams=grams;it.quantityMethod='USER_INPUT';const p=engine.db.byKey.get(it.key);el.closest('tr').querySelector('.nut-food-source').textContent=sourceDescription(p);$('[data-item-energy="'+it.id+'"]').textContent=fmt(p?.kcal*grams/100,0);changed();}
});
root.addEventListener('change',event=>{
  const el=event.target;
  if(el.dataset.unit){const it=domain.ration.find(it=>it.id===el.dataset.unit);if(quantityDrafts.has(it.id)){el.value=it.unit||'g';return;}it.unit=el.value;const input=$('[data-quantity="'+it.id+'"]');input.value=quantityText(it.grams,it.unit);changed();}
});
function showRadialGuide(key,trigger){
  const nutrient=lastRadialModel?.items?.find(n=>n.key===key);
  const dialog=document.getElementById('nut-radial-dialog');
  if(!nutrient||!dialog||typeof dialog.showModal!=='function'||!domain.analysis)return;
  lastRadialGuideTrigger=trigger||null;
  const content=dialog.querySelector('[data-radial-dialog-body]');
  if(!content)return;
  content.innerHTML=(stale()?'<p class="nut-radial-guide-stale">Сведения относятся к последнему выполненному анализу. Текущие изменения рациона ещё не пересчитаны.</p>':'')+
    renderRadialNutrientGuide(nutrient,engine,domain.analysis.ration,fmt,esc,lastRadialModel);
  dialog.showModal();
  dialog.querySelector('[data-close-radial-dialog]')?.focus();
}
root.addEventListener('click',event=>{
  const methodTrigger=event.target.closest('[data-radial-method]');
  if(methodTrigger){
    const dialog=document.getElementById('nut-radial-method-dialog');
    if(dialog&&typeof dialog.showModal==='function'){
      lastRadialMethodTrigger=methodTrigger;
      dialog.showModal();
      dialog.querySelector('[data-close-radial-method]')?.focus();
    }
    return;
  }
  const clickedRadial=event.target.closest('[data-radial-key],[data-radial-detail]');
  if(clickedRadial){
    event.preventDefault();
    const key=clickedRadial.dataset.radialKey||clickedRadial.dataset.radialDetail;
    showRadialGuide(key,clickedRadial);return;
  }
  const help=event.target.closest('[data-structure-help]');
  if(help){
    event.preventDefault();
    const dialog=document.getElementById('nut-structure-dialog');
    if(dialog&&typeof dialog.showModal==='function'){
      const type=help.dataset.structureHelp;
      lastStructureHelpTrigger=help;
      dialog.querySelectorAll('[data-structure-help-panel]').forEach(panel=>panel.hidden=panel.dataset.structureHelpPanel!==type);
      dialog.showModal();
      dialog.querySelector('[data-close-structure-dialog]')?.focus();
    }
    return;
  }
  const marker=event.target.closest('.nut-structure-marker');
  if(marker){marker.classList.toggle('is-active');return;}
  root.querySelectorAll('.nut-structure-marker.is-active').forEach(item=>item.classList.remove('is-active'));
  const heiViewControl=event.target.closest('[data-hei-view]'),heiKindControl=event.target.closest('[data-hei-kind-filter]');
  if(heiViewControl||heiKindControl){event.preventDefault();if(heiViewControl)heiView=heiViewControl.dataset.heiView;else heiKind=heiKindControl.dataset.heiKindFilter;applyHeiFilters();return;}
  const dashStructure=event.target.closest('a[data-dash-structure]');
  if(dashStructure){event.preventDefault();setSection('analysis',{navigate:true});requestAnimationFrame(()=>document.getElementById('nutrition-structure-section')?.scrollIntoView({block:'start'}));return;}
  const dashLink=event.target.closest('a[data-dash-focus]');
  if(dashLink){event.preventDefault();setSection('needs',{navigate:true});const key=dashLink.dataset.dashFocus;const field=key==='needs-submit'?$('#needs-form button[type="submit"]'):root.querySelector('[data-profile="'+key+'"]');if(field){field.scrollIntoView({block:'center',behavior:'instant'});field.focus({preventScroll:true});}return;}
  const navigation=event.target.closest('a[href^="#"]');
  if(navigation&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
    const section=navigation.hash.slice(1);
    if(sections.includes(section)){event.preventDefault();setSection(section,{navigate:true});return;}
  }
  const add=event.target.closest('[data-add-food]'),remove=event.target.closest('[data-remove-food]');
  if(event.target.closest('[data-clear-ai-selection]')){aiSelection=null;search();return;}
  if(add){const key=add.dataset.addFood,existing=domain.ration.find(it=>it.key===key),grams=aiSelection?.grams||100;if(existing){existing.grams+=grams;if(aiSelection&&!aiSelection.userEdited)existing.quantityMethod='AI_ESTIMATED';}else domain.ration.push({id:crypto.randomUUID(),key,grams,unit:'g',quantityMethod:aiSelection&&!aiSelection.userEdited?'AI_ESTIMATED':'USER_INPUT'});if(aiSelection){domain.recognitionDraft.splice(aiSelection.index,1);aiSelection=null;recognitionPanel?.render();}renderRation();changed();$('#food-search').value='';search();$('[data-quantity="'+(existing?.id||domain.ration.at(-1).id)+'"]').focus();}
  if(remove){domain.ration=domain.ration.filter(it=>it.id!==remove.dataset.removeFood);renderRation();changed();$('#food-search').focus();}
  if(event.target.closest('[data-clear-food-search]')){$('#food-search').value='';search();$('#food-search').focus();}
  if(event.target.closest('[data-analyze]'))analyze();
  if(event.target.closest('[data-clear-ration]')&&confirm('Очистить текущий рацион? Резервная копия позволит восстановить его.')){domain.ration=[];renderRation();changed();}
  if(event.target.closest('[data-reset-needs]')&&confirm('Очистить данные профиля? Рацион сохранится.')){domain.profile={region:'us'};needsResult=null;renderProfile();renderNeeds();changed();}
  if(event.target.closest('[data-nut-retry]'))location.reload();
  if(event.target.closest('[data-export-nutrition]')){
    const payload={format:'VesninMed.Nutrient',schemaVersion:1,exportedAt:new Date().toISOString(),data:domain};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='vesninmed-nutrient.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('.nut-file-menu').open=false;
  }
  if(event.target.closest('[data-print-nutrition]')){
    $('.nut-file-menu').open=false;
    if(!lastResult||stale()){
      if(domain.ration.length){setSection('analysis',{navigate:true,focus:true});}
      else setSection('ration',{navigate:true,focus:true});
      if(stale())$('#analysis-content [data-stale]')?.scrollIntoView({block:'center',behavior:'instant'});
      return;
    }
    setSection('report',{navigate:true,focus:true});
    window.print();
  }
});
const radialMethodDialog=document.getElementById('nut-radial-method-dialog');
radialMethodDialog?.addEventListener('click',event=>{
  if(event.target===radialMethodDialog||event.target.closest('[data-close-radial-method]'))radialMethodDialog.close();
});
radialMethodDialog?.addEventListener('close',()=>{
  lastRadialMethodTrigger?.focus?.({preventScroll:true});
  lastRadialMethodTrigger=null;
});
const radialDialog=document.getElementById('nut-radial-dialog');
radialDialog?.addEventListener('close',()=>{lastRadialGuideTrigger?.focus?.({preventScroll:true});lastRadialGuideTrigger=null;});
radialDialog?.addEventListener('click',event=>{
  if(event.target===radialDialog||event.target.closest('[data-close-radial-dialog]'))radialDialog.close();
});
const structureDialog=document.getElementById('nut-structure-dialog');
structureDialog?.addEventListener('close',()=>{lastStructureHelpTrigger?.focus({preventScroll:true});lastStructureHelpTrigger=null;});
structureDialog?.addEventListener('click',event=>{
  if(event.target===structureDialog||event.target.closest('[data-close-structure-dialog]'))structureDialog.close();
});
root.addEventListener('keydown',event=>{
  const radial=event.target.closest?.('.nut-radial-node circle[tabindex]');
  if(radial&&(event.key==='Enter'||event.key===' ')){
    event.preventDefault();const root=radial.closest('[data-radial-key]');showRadialGuide(root?.dataset.radialKey,radial);return;
  }
  const marker=event.target.closest?.('.nut-structure-marker');
  if(marker&&(event.key==='Enter'||event.key===' ')){
    event.preventDefault();marker.classList.toggle('is-active');
  }
  if(event.key==='Escape')root.querySelectorAll('.nut-structure-marker.is-active').forEach(item=>item.classList.remove('is-active'));
});
$('#food-search-form').addEventListener('submit',event=>event.preventDefault());
$('#needs-form').addEventListener('submit',event=>{
  event.preventDefault();
  needsResult=profileNeeds(domain.profile);
  if(domain.analysis&&domain.ration.length&&!quantityDrafts.size){
    domain.analysis={signature:signature(),sourceCommit:SOURCE,at:Date.now(),ration:structuredClone(domain.ration),profile:structuredClone(domain.profile)};
    prepareLastResult();
  }
  renderNeeds();renderSummary();renderResults();persist();
});
$('#custom-food-form').addEventListener('submit',event=>{
  event.preventDefault();const form=new FormData(event.target),p={key:'local:'+crypto.randomUUID(),name_ru:String(form.get('name')).trim(),name:String(form.get('name')).trim(),local_source:String(form.get('source')).trim(),category:'Other',hei_category_key:'other'};
  const fields=['kcal','protein_per_100g','fat_per_100g','carbs_per_100g'];
  for(const key of fields){const input=String(form.get(key));if(!input.trim()&&key!=='kcal')continue;const v=number(input);if(!Number.isFinite(v)||v<0||v>(key==='kcal'?1000:100)){$('[data-custom-status]').textContent='Проверьте значения на 100 г: энергия — до 1000 ккал, нутриенты — до 100 г.';return;}p[key]=v;}
  p.nutrient_provenance_v1_3={LABEL:fields.filter(k=>k in p)};p.data_quality_v1_3={confidence_tier:'MEDIUM',confidence_score:.65,source_kind:'LABEL',review_status:'CONDITIONALLY_ACCEPTED'};
  domain.customProducts.push(p);installCustomProducts();domain.ration.push({id:crypto.randomUUID(),key:p.key,grams:100,unit:'g'});renderRation();changed();event.target.reset();$('[data-custom-status]').textContent='Продукт добавлен. Неизвестные показатели не включены в расчёт.';
});
$('#nutrition-import').addEventListener('change',async event=>{
  const message=$('[data-nutrition-import-status]');try{
    const file=event.target.files[0];if(!file)return;if(file.size>2*1024*1024)throw Error('Файл больше 2 МБ.');
    let imported=JSON.parse(await file.text());const legacy=imported?.type==='ration_preset';
    if(legacy)imported={format:'VesninMed.Nutrient',schemaVersion:1,data:importLegacyRation(imported,{profile:domain.profile,customProducts:domain.customProducts,knownKeys:new Set(engine.db.byKey.keys()),makeId:()=>crypto.randomUUID()})};
    if(!imported||imported.format!=='VesninMed.Nutrient'||imported.schemaVersion!==1||!validRecord(imported.data))throw Error('Файл не подходит. Нужна резервная копия Nutrient этой версии.');
    if(imported.data.ration.some(it=>!engine.db.byKey.has(it.key)&&!imported.data.customProducts.some(p=>p.key===it.key)))throw Error('В файле есть неизвестные продукты.');
    if(domain.ration.length&&!confirm('Заменить текущий рацион данными из файла? Перед заменой можно скачать резервную копию.'))return;
    domain=structuredClone(imported.data);quantityDrafts.clear();installCustomProducts();needsResult=profileNeeds(domain.profile);prepareLastResult();renderProfile();renderRation();renderNeeds();renderResults();await persist();message.textContent='Рацион загружен. '+(legacy?'Перенесены продукты и количества. Файл прежней версии не содержит данных потребностей. ':'')+(storage.writable?'Он сохранён в этом браузере.':'Сохранение недоступно; не закрывайте страницу без резервной копии.');
  }catch(error){message.textContent='Импорт не выполнен: '+error.message+' Текущий рацион не изменён.';}finally{event.target.value='';$('.nut-file-menu').open=false;}
});
window.addEventListener('hashchange',()=>{if(engine)setSection(location.hash.slice(1));});
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');if(!engine||!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href);if(url.origin!==location.origin||url.pathname===location.pathname&&url.hash)return;
  event.preventDefault();void writePromise.then(()=>storage.flush()).then(()=>location.assign(url.href));
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine)void storage.flush();});
window.addEventListener('pageshow',()=>{if(engine){renderRation();renderResults();setSection(initialSection());}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('.nut-file-menu').open){$('.nut-file-menu').open=false;$('.nut-file-menu summary').focus();}});
document.addEventListener('click',event=>{const menu=$('.nut-file-menu');if(menu.open&&!menu.contains(event.target))menu.open=false;});

// Optional same-tab bridge. Does not automatically merge people or change diet history.
function installGuideHandoff(){
 const container=$('#nutrition-ready');
 if(!container||container.querySelector('#nutrition-guide-bridge'))return;
 const panel=document.createElement('section');
 panel.id='nutrition-guide-bridge';
 panel.setAttribute('aria-label',EN?'Healthy diet guide data transfer':'Передача данных в справочник питания');
 panel.style.cssText='grid-column:1/-1;background:#eef6f5;border:1px solid #cbdede;border-radius:12px;padding:13px 16px;margin:0 0 15px;max-width:100%';
 const title=document.createElement('p');title.style.cssText='margin:0 0 7px;font-weight:700';title.textContent=EN?'Healthy diet guide':'Составить здоровый рацион · справочник';
 const text=document.createElement('p');text.style.cssText='margin:0 0 10px;font-size:.86rem';
 text.textContent=EN?'You can send a temporary, non-identifying profile and optionally your current food items to the Russian-language healthy diet guide. This does not alter saved meals.':'Можно по вашему желанию передать в справочник возраст, рост, массу и записи рациона без имени, диагнозов и истории анализа. Передача работает только при переходе в той же вкладке; сохранённые данные калькулятора не изменяются.';
 const outbound=document.createElement('button');outbound.type='button';outbound.className='vm-button';
 outbound.textContent=EN?'Open guide with my data':'Открыть справочник с моим рационом';
 outbound.addEventListener('click',()=>{
  const payload=sendHandoff({from:'calculator',to:'guide',profile:domain.profile,includeRation:domain.ration.length>0,ration:domain.ration});
  if(!payload.ok){info.textContent=payload.reason;return;}
  location.assign('/materials/nutrition-guide/');
 });
 const nav=document.createElement('a');nav.href='/materials/nutrition-guide/';nav.textContent=EN?'Open guide without data':'Открыть без передачи данных';nav.style.cssText='margin-left:14px;font-size:.88rem';
 const info=document.createElement('p');info.setAttribute('role','status');info.style.cssText='font-size:.85rem;margin:10px 0 0;color:#526970';
 panel.append(title,text,outbound,nav,info);
 const pending=peekHandoff('calculator');
 if(pending?.profile){
  const imported=document.createElement('div');
  imported.style.cssText='border-top:1px solid #d4e5e2;padding-top:10px;margin-top:10px';
  const p=document.createElement('p');p.style.cssText='margin:0 0 8px;font-size:.86rem';
  p.textContent='Из справочника готовы параметры: '+pending.profile.age+' лет, '+pending.profile.h+' см, '+pending.profile.w+' кг. Передать их в текущую анкету?';
  const accept=document.createElement('button');accept.type='button';accept.className='vm-button';accept.textContent='Принять параметры';
  const decline=document.createElement('button');decline.type='button';decline.textContent='Не переносить';decline.style.cssText='margin-left:9px;cursor:pointer';
  accept.addEventListener('click',()=>{
   const source=peekHandoff('calculator');if(!source?.profile){info.textContent='Временная передача истекла.';imported.remove();return;}
   const clinical=domain.profile?.state&&domain.profile.state!=='normal'||domain.profile?.guardrail&&domain.profile.guardrail!=='none'||domain.profile?.additional_medical_restriction===true;
   if(clinical){info.textContent='У текущей анкеты заданы особые медицинские условия. Параметры автоматически не перенесены. Для другого человека создайте отдельную анкету, не смешивая данные.';return;}
   const diff=['age','h','w','sex'].some(k=>source.profile[k]!==undefined&&source.profile[k]!==String(domain.profile[k]??''));
   if(domain.ration.length&&diff&&!window.confirm('В калькуляторе уже есть рацион. Подтвердите, что новый профиль относится к тому же человеку. Иначе вы смешаете данные разных людей. Продолжить?'))return;
   Object.assign(domain.profile,source.profile);
   domain.analysis=null;
   clearHandoff();
   renderProfile();
   needsResult=profileNeeds(domain.profile);
   renderNeeds();renderRation();renderResults();persist();
   setSection('needs',{navigate:true});
   imported.remove();info.textContent='Параметры приняты. Рацион и собственные продукты сохранены. Пересмотрите настройки медицинских ограничений и активности.';
  });
  decline.addEventListener('click',()=>{clearHandoff();imported.remove();info.textContent='Передача отменена.';});
  imported.append(p,accept,decline);panel.append(imported);
 }
 container.prepend(panel);
}

async function boot(){
  try{
    const prefix=root.dataset.nutritionRuntime;
    const [module,fieldsResponse,response]=await Promise.all([import(prefix+'engine.js'),fetch(prefix+'fields.json'),fetch(prefix+'products.json.gz')]);
    if(!response.ok||!fieldsResponse.ok)throw Error('Загрузка базы прервана.');
    const bytes=new Uint8Array(await response.arrayBuffer());
    let text;if(bytes[0]===31&&bytes[1]===139){if(typeof DecompressionStream==='undefined')throw Error('Этот браузер не поддерживает загрузку сжатой базы. Откройте калькулятор в актуальном браузере.');text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}else text=new TextDecoder().decode(bytes);
    engine=module.createNutritionEngine(JSON.parse(text));specs=await fieldsResponse.json();
    attachNutrientSourceExplorer({root,getEngine:()=>engine,getAnalysis:()=>lastResult,format:fmt,escape:esc});
    const saved=await storage.read();if(saved)domain=saved;
    installCustomProducts();renderProfile();needsResult=profileNeeds(domain.profile);prepareLastResult();renderNeeds();renderRation();search();renderResults();
    $('#nutrition-loading').hidden=true;$('#nutrition-ready').hidden=false;setSection(initialSection());installGuideHandoff();root.dataset.nutritionReady='true';
    document.dispatchEvent(new Event('vesninmed:workspace-readiness'));
  }catch(error){$('#nutrition-loading').hidden=true;$('#nutrition-error').hidden=false;$('#nutrition-error p').textContent=error.message||'Проверьте подключение к интернету и повторите загрузку.';root.dataset.nutritionReady='error';}
}
void boot();
