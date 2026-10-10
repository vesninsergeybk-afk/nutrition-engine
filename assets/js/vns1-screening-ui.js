/* VesninMed VNS-1 research prototype — interface adapter v0.2.
 * Reuses canonical needs_* fields without duplicating sensitive anthropometry.
 * User answers remain in memory only; no automatic upload or secondary storage.
 */
(function(w,d){
  'use strict';
  var last=null,section=null,version='vns1-0.2-research';
  function byId(id){return d.getElementById(id);}
  function val(id){var e=byId(id);return e?String(e.value||'').trim():'';}
  function numeric(id){var v=val(id).replace(',','.');return v!==''&&isFinite(Number(v))?Number(v):null;}
  function add(node,tag,cls,txt){var x=d.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;node.appendChild(x);return x;}
  function field(name,label,choices){
    var box=add(section,'div','vns1-field');
    var lbl=add(box,'label','',label);lbl.setAttribute('for','vns1_'+name);
    var e=add(box,'select');e.id='vns1_'+name;
    choices.forEach(function(pair){var opt=add(e,'option','',pair[1]);opt.value=pair[0];});
    return e;
  }
  function input(name,label,hint){
    var box=add(section,'div','vns1-field');
    var lbl=add(box,'label','',label);lbl.setAttribute('for','vns1_'+name);
    var e=add(box,'input');e.id='vns1_'+name;e.type='number';e.min='0';e.max='365';e.step='1';e.inputMode='numeric';e.placeholder=hint||'Укажите число дней';
    return e;
  }
  function subsection(title,caption){var x=add(section,'div','vns1-subhead');add(x,'h3','',title);if(caption)add(x,'p','',caption);}
  function optionSet(name,options){
    var set=add(section,'fieldset','vns1-options');
    add(set,'legend','',name);
    options.forEach(function(opt){var row=add(set,'label','vns1-option');var inp=add(row,'input');inp.type='checkbox';inp.value=opt[0];inp.name='vns1_barriers';add(row,'span','',opt[1]);});
    return set;
  }
  function populate(){
    var mount=byId('dietAnalysisProfilePanel')||byId('globalActions');
    if(!mount||byId('vns1ResearchSection')||!w.VNS1Core)return;
    section=d.createElement('section');section.className='card vns1-card';section.id='vns1ResearchSection';section.setAttribute('aria-labelledby','vns1Title');mount.parentNode.insertBefore(section,mount);
    var head=add(section,'div','vns1-head');add(head,'span','vns1-kicker','Исследовательская версия · v0.2');add(head,'h2','','ВНС-1 · Предварительная оценка питания').id='vns1Title';
    add(head,'p','','Самостоятельный опросник VesninMed. Пока не проходил клиническую валидацию, не устанавливает диагноз и не заменяет рекомендованный скрининг.');
    var shared=add(section,'div','vns1-shared');
    add(shared,'strong','','Данные из общего профиля');
    add(shared,'p','', 'Возраст, рост, масса, прежний вес и период почти полного отсутствия питания используются из уже заполненных полей калькулятора.');
    var values=add(shared,'p','vns1-shared-values','');values.id='vns1SharedValues';
    var link=add(shared,'a','','Проверить или дополнить данные профиля ↗');link.href='#needsCompact';link.addEventListener('click',function(){var needs=byId('needs');if(needs){needs.hidden=false;needs.removeAttribute('aria-hidden');}var f=byId('needsLowWeightSafety');if(f)f.open=true;},false);
    var details=add(section,'details','vns1-form');details.id='vns1Questionnaire';
    add(details,'summary','','Открыть анкету нутритивного скрининга');
    var content=add(details,'div','vns1-form-body');
    /* Mount form controls inside details, not outside the disclosure. */
    var root=section;section=content;
    subsection('Проверка безопасности','При опасных симптомах оценка питания не должна задерживать обращение за медицинской помощью.');
    field('emergency','Есть ли сейчас признаки, требующие незамедлительной помощи?',[
      ['','Выберите ответ'],['none','Нет'],['cannot-swallow-saliva','Не могу проглотить слюну'],['breathing-problem','Нарушено дыхание'],['aspiration-breathing','При глотании возникает затруднение дыхания'],['cannot-keep-fluids','Не удаётся удержать жидкость из-за повторной рвоты']]);
    subsection('Изменение массы и питания','Учитывайте только фактические изменения, даже если нет точных измерений.');
    field('weightLossIntent','За последние 3–6 месяцев масса тела снижалась?',[
      ['','Выберите ответ'],['none','Нет'],['unintentional','Да, без намерения похудеть'],['intentional','Да, я намеренно снижал(а) вес'],['unknown','Не знаю']]);
    field('fluid','Были ли заметные отёки или колебания веса из-за жидкости?',[
      ['','Не знаю / не могу оценить'],['no','Нет'],['yes','Да']]);
    field('intakeReduced','За последние недели вы стали есть меньше обычного?',[
      ['','Выберите ответ'],['no','Нет'],['yes','Да'],['unknown','Не знаю']]);
    field('intakeAmount','Если стали есть меньше, насколько изменился объём пищи?',[
      ['unknown','Трудно оценить'],['some','Немного меньше'],['half-or-less','Примерно половина обычной порции или меньше'],['almost-none','Практически перестал(а) есть']]);
    input('reducedDays','Как долго продолжается снижение количества пищи?','Дней');
    field('almostNone','Были ли дни, когда вы практически ничего не ели?',[
      ['','Выберите ответ'],['no','Нет'],['yes','Да — число дней указано в профиле'],['unknown','Не знаю']]);
    subsection('Что мешает питаться','Вопросы о причинах не подменяют измерение потребления пищи.');
    optionSet('За последние две недели возникали трудности при приёме пищи?',[
      ['appetite','Нет аппетита или быстрое насыщение'],['chewing','Боль, проблемы с зубами или жеванием'],
      ['swallowing','Трудно глотать'],['nausea','Тошнота, рвота или боль в животе'],
      ['digestion','Длительные проблемы с пищеварением'],['weakness','Выраженная слабость']]);
    field('barriersPresent','Были ли какие-либо трудности при приёме пищи?', [['','Выберите ответ'],['no','Нет'],['yes','Да']]);
    field('barriersAffectIntake','Если трудности есть, мешают ли они съедать достаточно?',[
      ['unknown','Не знаю / не применимо'],['yes','Да'],['no','Нет']]);
    field('foodAccess','За последний месяц случалось ли, что вы не могли нормально питаться из-за нехватки продуктов, денег или помощи?',[
      ['','Выберите ответ'],['no','Нет'],['yes','Да'],['unknown','Не знаю']]);
    field('illnessAffectsIntake','За последние 3 месяца болезнь или лечение мешали вам есть либо усваивать пищу?',[
      ['','Выберите ответ'],['no','Нет'],['yes','Да'],['unknown','Не знаю']]);
    field('functionDecline','За последние 3 месяца заметно изменились мышцы или способность выполнять привычные действия?',[
      ['','Выберите ответ'],['no','Нет'],['yes','Да'],['unknown','Не знаю']]);
    subsection('Возможные изменения в ближайшие дни','Этот раздел помогает заметить риск ещё до того, как питание ухудшится.');
    input('futureDays','Сколько ближайших дней, вероятно, не получится питаться достаточно?','0 — не ожидается');
    field('support','Как вы получаете питание?', [['none','Обычное питание'],['enteral','Через зонд'],['parenteral','Внутривенно']]);
    field('pregnancy','Вы беременны?',[
      ['unknown','Нет / не применимо / не знаю'],['yes','Да']]);
    var actions=add(section,'div','vns1-actions');var btn=add(actions,'button','vns1-primary','Оценить признаки риска');btn.type='button';btn.id='vns1Evaluate';
    var status=add(section,'p','vns1-status','');status.id='vns1Status';
    section=root; // restore outer section for result rendering
    var result=add(section,'div','vns1-result');result.id='vns1Result';result.setAttribute('aria-live','polite');
    add(section,'p','vns1-footnote','Результат носит предварительный характер. При заболеваниях, требующих специального питания, решения принимает лечащий врач. ВНС-1 пока не имеет установленных чувствительности, специфичности или клинических порогов как самостоятельная шкала.');
    var refs=add(section,'p','vns1-references');
    var a=add(refs,'a','','Критерии GLIM (2025)');a.href='https://pubmed.ncbi.nlm.nih.gov/40223699/';a.target='_blank';a.rel='noopener noreferrer';
    add(refs,'span','',' · ');
    a=add(refs,'a','','Рекомендации NICE CG32');a.href='https://www.nice.org.uk/guidance/cg32/chapter/Recommendations';a.target='_blank';a.rel='noopener noreferrer';
    btn.addEventListener('click',calculate,false);
    ['needs_age','needs_h','needs_w','needs_prev_w','needs_low_intake_days','needs_edema','needs_state','needs_electrolytes','needs_refeeding_factors'].forEach(function(id){var field=byId(id);if(field){field.addEventListener('input',changed,false);field.addEventListener('change',changed,false);}});
    d.addEventListener('needs:computed',changed,false);
    w.addEventListener('profile:persistence-ready',changed,false);
    section.addEventListener('change',changed,false);
    section.addEventListener('input',changed,false);
    updateShared();
  }
  function read(){
    var almost=val('vns1_almostNone'),existing=numeric('needs_low_intake_days');
    var barriers=[];if(section)section.querySelectorAll('input[name="vns1_barriers"]:checked').forEach(function(e){barriers.push(e.value);});
    var state=val('needs_state');
    var edema=val('needs_edema')==='yes'||val('vns1_fluid')==='yes';
    var compatible=val('vns1_fluid')==='no'&&!edema;
    return {
      age:numeric('needs_age'),heightCm:numeric('needs_h'),weightKg:numeric('needs_w'),previousWeightKg:numeric('needs_prev_w'),
      weightLossIntent:val('vns1_weightLossIntent')||undefined,weightReliable:compatible,fluidState:val('vns1_fluid')||'unknown',edema:edema,
      intakeReduced:val('vns1_intakeReduced')||undefined,intakeAmount:val('vns1_intakeAmount'),
      reducedIntakeDays:numeric('vns1_reducedDays'),
      almostNoIntakeDays:almost==='no'?(existing!==null&&existing>0?null:0):(almost==='yes'?existing:null),
      barriers:barriers,barriersPresent:val('vns1_barriersPresent')||undefined,barriersAffectIntake:val('vns1_barriersAffectIntake'),
      foodAccess:val('vns1_foodAccess')||undefined,illnessAffectsIntake:val('vns1_illnessAffectsIntake')||undefined,
      functionDecline:val('vns1_functionDecline')||undefined,expectedLowIntakeDays:numeric('vns1_futureDays'),
      specialContext:val('vns1_pregnancy')==='yes'?'pregnancy':val('vns1_support')==='enteral'?'enteral':val('vns1_support')==='parenteral'?'parenteral':state==='icu'?'icu':state==='dialysis'?'dialysis':state==='ckd'?'ckd':state,
      emergency:val('vns1_emergency')||'unknown',
      lowElectrolytes:val('needs_electrolytes')==='low'?'yes':val('needs_electrolytes')==='normal'?'no':'unknown',
      refeedingFactors:val('needs_refeeding_factors')
    };
  }
  function updateShared(){
    var box=byId('vns1SharedValues');if(!box)return;
    var fields=[['Возраст',val('needs_age'),'лет'],['Рост',val('needs_h'),'см'],['Текущая масса',val('needs_w'),'кг'],['Прежняя масса',val('needs_prev_w'),'кг'],['Почти без питания',val('needs_low_intake_days'),'дней']];
    box.textContent=fields.map(function(f){return f[0]+': '+(f[1]?f[1]+' '+f[2]:'не указано');}).join(' · ');
  }
  function render(model){
    var box=byId('vns1Result');if(!box)return;
    while(box.firstChild)box.removeChild(box.firstChild);
    box.className='vns1-result vns1-result--'+String(model.category);
    add(box,'strong','vns1-result-title',model.title);
    add(box,'p','',model.disclaimer);
    if(model.bmi!==null)add(box,'p','','ИМТ: '+model.bmi.toFixed(1)+' кг/м² (зависит от достоверности измерений).');
    if(model.weightLossPercent!==null)add(box,'p','','Непреднамеренная потеря массы: '+model.weightLossPercent.toFixed(1)+'% за указанный период.');
    var entries=model.urgent.concat(model.flags.map(function(x){return x.message;})).concat(model.warnings);
    if(entries.length){var ul=add(box,'ul');entries.forEach(function(s){add(ul,'li','',s);});}
    if(model.dataLimitations.length){var dbox=add(box,'details');add(dbox,'summary','','Ограничения и недостающие сведения ('+model.dataLimitations.length+')');var ul2=add(dbox,'ul');model.dataLimitations.forEach(function(s){add(ul2,'li','',s);});}
    var advice=model.category===3?'При затруднении дыхания или невозможности проглотить слюну вызовите экстренную помощь. При невозможности удерживать жидкость срочно обратитесь за медицинской помощью.':
      model.category===2?'Обсудите результаты с медицинским специалистом для оценки питания и причин изменений. Не используйте результат для самостоятельного назначения нутритивной поддержки.':
      model.category===1?'Если трудности сохраняются, обратитесь к врачу для уточнения причин.':'При изменении состояния повторите оценку; отсутствие отмеченных признаков не исключает нарушений питания.';
    add(box,'p','vns1-next-step',advice);
    var analysis=byId('dietAnalysisProfilePanel');
    if(analysis){
      var brief=byId('vns1AnalysisBrief');
      if(!brief){brief=d.createElement('p');brief.id='vns1AnalysisBrief';brief.className='vns1-analysis-brief';var head=analysis.querySelector('.diet-analysis-head')||analysis.firstElementChild;if(head&&head.nextSibling)analysis.insertBefore(brief,head.nextSibling);else analysis.insertBefore(brief,analysis.firstChild);}
      brief.textContent='ВНС-1 (исследовательская версия): '+model.title+'. Это отдельная предварительная оценка; она не меняет нормы калорий и белка.';
    }
  }
  function changed(){
    updateShared();
    if(!last)return;
    calculate();
  }
  function calculate(){
    if(!w.VNS1Core)return;
    last=w.VNS1Core.evaluate(read());
    render(last);
    var s=byId('vns1Status');if(s)s.textContent='Предварительный результат пересчитывается при изменении общих данных пациента.';
    try{w.dispatchEvent(new CustomEvent('vns1:changed',{detail:{category:last.category,version:version,validated:false}}));}catch(_){}
  }
  function init(){
    if(!w.VNS1Core)return;
    populate();
    w.VNS1ScreeningResearch={version:version,validated:false,getLastResult:function(){return last;},readProfile:read,recalculate:calculate};
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
