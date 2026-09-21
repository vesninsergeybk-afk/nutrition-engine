/* Nutrition Calculator v5.3.210-p0.3.2.1 — Independent Safety Revalidation & Stability Hardening
 * Central capability policy for pregnancy, lactation, eating-disorder risk,
 * medical restrictions and clinician-supervised states.
 * Clinical states are external-target-only: this module never creates a treatment target.
 */
(function(){
  'use strict';

  var CLINICAL_STATES = Object.freeze({preop:1,postop:1,icu:1,ckd:1,dialysis:1,oncology:1});
  var PROTECTED_GUARDRAILS = Object.freeze({pregnancy:1,lactation:1,ed_risk:1,medical_restriction:1});
  var NASEM_PAL = Object.freeze({inactive:'inactive',low_active:'low',active:'active',very_active:'very'});
  var CLINICAL_ROLES = Object.freeze({physician:1,clinical_dietitian:1,multidisciplinary_team:1,other_clinician:1});
  var CLINICAL_PHASES = Object.freeze({stable:1,acute_early:1,acute_late:1,recovery:1,preoperative:1,postoperative:1,active_treatment:1,other:1});
  var CLINICAL_ROUTES = Object.freeze({oral:1,enteral:1,parenteral:1,mixed:1});
  var CLINICAL_TARGET_MAX_AGE_DAYS = 366;
  var DAY_MS = 86400000;
  var LIFE_STAGE_TRACKED_KEYS = Object.freeze(((window.NutritionNormativeRegistry && window.NutritionNormativeRegistry.data && window.NutritionNormativeRegistry.data.tracked_life_stage_keys) || []).slice());
  var EVIDENCE_REGISTRY = (window.NutritionNormativeRegistry && window.NutritionNormativeRegistry.data && window.NutritionNormativeRegistry.data.sources) || Object.freeze({});
  function formulaProvenance(id){var map={nasem_pregnancy_2023:'energy.nasem_pregnancy_2023',nasem_lactation_2023:'energy.nasem_lactation_2023',nasem_adult_female_2023:'energy.nasem_adult_female_2023'};var fr=window.NutritionFormulaRegistryP14,fid=map[id]||id;if(fr&&fr.get){var f=fr.get(fid);return {registryVersion:fr.version,registrySha256:fr.sourceSha256,reviewedAt:fr.data&&fr.data.reviewed_at||null,formulaId:fid,sourceIds:f?(f.source_ids||[]).slice():[]};}var r=window.NutritionNormativeRegistry;return {registryVersion:r&&r.version||null,registrySha256:r&&r.sourceSha256||null,reviewedAt:r&&r.reviewedAt||null,formulaId:id,sourceIds:(r&&r.data&&r.data.energy_formulas&&r.data.energy_formulas[id]&&r.data.energy_formulas[id].source_ids||[]).slice()};}

  function finite(v){ if(v==null||String(v).trim()==='')return null; v=Number(v); return Number.isFinite(v)?v:null; }
  function round(v,d){ var p=Math.pow(10,d||0); return Math.round((Number(v)+Number.EPSILON)*p)/p; }
  function text(id, fallback){ var el=document.getElementById(id); return el ? String(el.value||'') : (fallback||''); }
  function checked(id){ var el=document.getElementById(id); return !!(el && el.checked); }
  function bmi(weight,height){ weight=finite(weight);height=finite(height);return weight&&height?weight/Math.pow(height/100,2):null; }
  function region(){ try{return window.State&&State.getRegion?String(State.getRegion()||'us'):'us';}catch(_){return 'us';} }
  function nonEmpty(v){ return String(v==null?'':v).trim(); }
  function dateValue(v){
    v=nonEmpty(v); var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v); if(!m)return null;
    var y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
    if(y<1900||y>2200||mo<1||mo>12||d<1||d>31)return null;
    var ts=Date.UTC(y,mo-1,d), check=new Date(ts);
    if(check.getUTCFullYear()!==y||check.getUTCMonth()!==mo-1||check.getUTCDate()!==d)return null;
    return ts;
  }
  function localTodayValue(){ var d=new Date(); return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()); }
  function validationToday(input){ var explicit=input&&dateValue(input.validationToday); return explicit!=null?explicit:localTodayValue(); }

  function equationLevel(pal){ return NASEM_PAL[String(pal||'')] || null; }
  function adultFemaleTee(pal, age, height, weight){
    age=finite(age);height=finite(height);weight=finite(weight);
    var level=equationLevel(pal);
    if(age==null||height==null||weight==null||!level)return null;
    var equations={
      inactive:function(){return 584.90-7.01*age+5.72*height+11.71*weight;},
      low:function(){return 575.77-7.01*age+6.60*height+12.14*weight;},
      active:function(){return 710.25-7.01*age+6.54*height+12.34*weight;},
      very:function(){return 511.83-7.01*age+9.07*height+12.56*weight;}
    };
    return Math.max(0,equations[level]());
  }

  function pregnancyTee(pal, age, height, currentWeight, gestationWeek, prepregWeight){
    age=finite(age);height=finite(height);currentWeight=finite(currentWeight);gestationWeek=finite(gestationWeek);prepregWeight=finite(prepregWeight);
    var level=equationLevel(pal);
    if([age,height,currentWeight,gestationWeek,prepregWeight].some(function(v){return v==null;})||!level)return null;
    if(gestationWeek<=13){
      var first=adultFemaleTee(pal,age,height,currentWeight);
      return first==null?null:{target:round(first,0),deposition:0,prepregBmi:round(bmi(prepregWeight,height),1),trimester:1,pal:String(pal),method:'nasem_2023_pregnancy_first_trimester',provenance:formulaProvenance('nasem_pregnancy_2023')};
    }
    var base;
    if(level==='inactive') base=1131.20-2.04*age+0.34*height+12.15*currentWeight+9.16*gestationWeek;
    else if(level==='low') base=693.35-2.04*age+5.73*height+10.20*currentWeight+9.16*gestationWeek;
    else if(level==='active') base=-223.84-2.04*age+13.23*height+8.15*currentWeight+9.16*gestationWeek;
    else base=-779.72-2.04*age+18.45*height+8.73*currentWeight+9.16*gestationWeek;
    var pbmi=bmi(prepregWeight,height), dep=200;
    if(pbmi!=null&&pbmi<18.5)dep=300;
    else if(pbmi!=null&&pbmi>=25&&pbmi<30)dep=150;
    else if(pbmi!=null&&pbmi>=30)dep=-50;
    return {target:round(Math.max(0,base+dep),0),deposition:dep,prepregBmi:pbmi==null?null:round(pbmi,1),trimester:gestationWeek<=27?2:3,pal:String(pal),method:'nasem_2023_pregnancy_second_third',provenance:formulaProvenance('nasem_pregnancy_2023')};
  }

  function lactationTee(pal, age, height, currentWeight, postpartumMonth, feeding){
    var base=adultFemaleTee(pal,age,height,currentWeight), month=finite(postpartumMonth);
    if(base==null||month==null)return null;
    var increment=null, phase='';
    if(month<=6 && feeding==='exclusive'){ increment=404; phase='exclusive_0_6'; }
    else if(month>6 && month<=12 && feeding==='partial'){ increment=380; phase='partial_7_12'; }
    if(increment==null)return null;
    return {target:round(base+increment,0),base:round(base,0),increment:increment,phase:phase,pal:String(pal),method:'nasem_2023_lactation',provenance:formulaProvenance('nasem_lactation_2023')};
  }

  function lifeStageTargetsFromRegistry(input, stage){
    var registry=window.NutritionNormativeRegistry;
    if(!registry||typeof registry.resolveLifeStageProfile!=='function')return null;
    return registry.resolveLifeStageProfile({
      region:String(input.region||'us'), stage:stage, age:finite(input.age), sex:'female',
      gestationWeek:finite(input.gestationWeek), prepregWeight:finite(input.prepregWeight),
      currentWeight:finite(input.currentWeight), postpartumMonth:finite(input.postpartumMonth), feeding:String(input.feeding||'unknown')
    });
  }
  function pregnancyTargets(input){ return lifeStageTargetsFromRegistry(input||{},'pregnancy'); }
  function lactationTargets(input){ return lifeStageTargetsFromRegistry(input||{},'lactation'); }

  function clinicalTargetFrom(input){
    var target={
      energy:finite(input.clinicalEnergyManual), protein:finite(input.clinicalProteinManual), referenceWeightKg:finite(input.clinicalReferenceWeight),
      confirmedBy:nonEmpty(input.clinicalConfirmedBy), confirmedRole:nonEmpty(input.clinicalConfirmedRole), confirmedAt:nonEmpty(input.clinicalConfirmedAt),
      reviewDueAt:nonEmpty(input.clinicalReviewDueAt), sourceMethod:nonEmpty(input.clinicalSourceMethod), phase:nonEmpty(input.clinicalPhase),
      route:nonEmpty(input.clinicalRoute), sourceNote:nonEmpty(input.clinicalSourceNote)
    };
    target.confirmedAtTs=dateValue(target.confirmedAt); target.reviewDueAtTs=dateValue(target.reviewDueAt);
    return target;
  }

  function validateClinicalTarget(input, required){
    input=input||{};
    var t=clinicalTargetFrom(input), errors=[], warnings=[], today=validationToday(input);
    var minConfirmed=today-CLINICAL_TARGET_MAX_AGE_DAYS*DAY_MS, maxReviewSpan=CLINICAL_TARGET_MAX_AGE_DAYS*DAY_MS;
    if(!input.clinicalTargetsConfirmed)errors.push('Подтвердите, что внешняя клиническая цель введена из назначения специалиста.');
    if(t.energy==null||t.energy<300||t.energy>10000)errors.push('Укажите внешнюю цель энергии в техническом диапазоне 300–10000 ккал/сут.');
    if(t.protein==null||t.protein<1||t.protein>500)errors.push('Укажите внешнюю цель белка в техническом диапазоне 1–500 г/сут.');
    if(t.referenceWeightKg==null||t.referenceWeightKg<15||t.referenceWeightKg>400)errors.push('Укажите расчётную/сухую массу, к которой относится внешняя цель.');
    if(t.confirmedBy.length<2)errors.push('Укажите имя или идентификатор специалиста, подтвердившего цель.');
    if(!CLINICAL_ROLES[t.confirmedRole])errors.push('Выберите допустимую роль специалиста из списка.');
    if(!t.confirmedAt)errors.push('Укажите дату подтверждения внешней цели.');
    else if(!t.confirmedAtTs)errors.push('Дата подтверждения внешней цели календарно некорректна.');
    if(t.confirmedAtTs&&t.confirmedAtTs>today)errors.push('Дата подтверждения внешней цели не может быть в будущем.');
    if(t.confirmedAtTs&&t.confirmedAtTs<minConfirmed)errors.push('Внешняя цель подтверждена более 366 дней назад; требуется актуализация.');
    if(!t.reviewDueAt)errors.push('Укажите дату обязательного пересмотра цели.');
    else if(!t.reviewDueAtTs)errors.push('Дата обязательного пересмотра календарно некорректна.');
    if(t.confirmedAtTs&&t.reviewDueAtTs&&t.reviewDueAtTs<t.confirmedAtTs)errors.push('Дата пересмотра не может быть раньше даты подтверждения.');
    if(t.reviewDueAtTs&&t.reviewDueAtTs<today)errors.push('Срок действия внешней цели истёк; требуется актуальное подтверждение.');
    if(t.confirmedAtTs&&t.reviewDueAtTs&&t.reviewDueAtTs-t.confirmedAtTs>maxReviewSpan)errors.push('Срок действия цели превышает технический предел 366 дней; задайте дату пересмотра не позднее года от подтверждения.');
    if(t.sourceMethod.length<5)errors.push('Укажите источник или метод формирования цели.');
    if(!CLINICAL_PHASES[t.phase])errors.push('Выберите допустимую клиническую фазу из списка.');
    if(!CLINICAL_ROUTES[t.route])errors.push('Выберите допустимый путь питания из списка.');
    if((t.confirmedRole==='other_clinician'||t.phase==='other')&&t.sourceNote.length<5)errors.push('Для варианта «другой специалист» или «другая фаза» уточните контекст в примечании.');
    t.valid=errors.length===0; t.errors=errors; t.warnings=warnings; t.required=!!required;
    return t;
  }

  function evaluate(input){
    input=input||{};
    var state=String(input.state||'normal'), guardrail=String(input.guardrail||'none');
    var additionalEdRisk=!!input.additionalEdRisk, additionalMedicalRestriction=!!input.additionalMedicalRestriction, additionalClinicalConditions=!!input.additionalClinicalConditions;
    var edRiskActive=guardrail==='ed_risk'||additionalEdRisk;
    var medicalRestrictionActive=guardrail==='medical_restriction'||additionalMedicalRestriction;
    var reasons=[],errors=[],warnings=[], lifeStage=null, clinical=!!CLINICAL_STATES[state];
    var lifeStageGuardrail=guardrail==='pregnancy'||guardrail==='lactation';
    var externalTargetOnly=clinical||(!lifeStageGuardrail&&(edRiskActive||medicalRestrictionActive));
    var protectedMode=clinical||!!PROTECTED_GUARDRAILS[guardrail]||edRiskActive||medicalRestrictionActive||additionalClinicalConditions;
    var policy={
      version:'v5.3.210-p0.3.2.1', protectedMode:protectedMode, state:state, guardrail:guardrail, externalTargetOnly:externalTargetOnly,
      additionalEdRisk:additionalEdRisk, additionalMedicalRestriction:additionalMedicalRestriction, additionalClinicalConditions:additionalClinicalConditions,
      edRiskActive:edRiskActive, medicalRestrictionActive:medicalRestrictionActive,
      status:protectedMode?'protected':'standard', estimateOnly:protectedMode,
      goalFactorAllowed:!protectedMode, normsSyncAllowed:!protectedMode, mealSplitAllowed:!protectedMode,
      automaticPlannerAllowed:!protectedMode, geminiAllowed:!protectedMode, localRecommendationsAllowed:!protectedMode, fluidEstimateAllowed:!protectedMode,
      calculationAllowed:true, lifeStageCalculationAllowed:true,
      manualClinicalEnergyReady:false, manualClinicalEnergy:null, manualClinicalProteinReady:false, manualClinicalProtein:null,
      clinicalTargetReady:false, clinicalTarget:null, reasons:reasons,warnings:warnings,errors:errors
    };

    if(additionalClinicalConditions){
      errors.push('Отмечены дополнительные клинические состояния. До внедрения модели clinicalContexts[] автоматический расчёт потребностей выполняться не может.');
      policy.calculationAllowed=false; policy.status='blocked';
    }

    if(externalTargetOnly){
      if(clinical) reasons.push('Профиль «'+state+'» работает только с внешней клинической целью; универсальные коэффициенты энергии и белка удалены из рабочего пути.');
      else if(edRiskActive) reasons.push('При текущем или недавнем риске РПП автоматическая энергетическая и белковая цель не формируется; для числового сопоставления требуется внешняя цель специалиста.');
      else reasons.push('При неуточнённых медицинских ограничениях автоматическая цель потребностей не формируется; для числового сопоставления требуется внешняя цель специалиста.');
      var clinicalAge=finite(input.age);
      if(clinicalAge!=null&&clinicalAge<18)errors.push('Защищённые внешние цели для пациентов младше 18 лет требуют отдельного педиатрического клинического контура.');
      var validated=validateClinicalTarget(input,true);
      policy.clinicalTarget=validated;
      if(validated.valid&&!additionalClinicalConditions){
        policy.clinicalTargetReady=true;
        policy.manualClinicalEnergyReady=true; policy.manualClinicalEnergy=validated.energy;
        policy.manualClinicalProteinReady=true; policy.manualClinicalProtein=validated.protein;
        reasons.push('Применяется актуальная внешняя цель с указанным происхождением и сроком пересмотра; калькулятор не выводит её из состояния, диагноза или универсального коэффициента.');
      }else{
        validated.errors.forEach(function(x){errors.push(x);});
        policy.calculationAllowed=false; policy.status='blocked';
      }
    }

    if(edRiskActive)reasons.push('При риске РПП отключены дефицит/профицит, распределение по приёмам, автоматические замены и AI-планирование.');
    if(medicalRestrictionActive)reasons.push('Неуточнённые медицинские ограничения переводят калькулятор в режим фактического анализа без автоматических назначений.');

    if(guardrail==='pregnancy'||guardrail==='lactation'){
      lifeStage=guardrail; policy.lifeStage=lifeStage;
      var normativeRegistry=window.NutritionNormativeRegistry, normativeAudit=normativeRegistry&&typeof normativeRegistry.audit==='function'?normativeRegistry.audit():null;
      if(!normativeAudit||!normativeAudit.ok)errors.push('Нормативный реестр отсутствует, просрочен или не прошёл самопроверку; жизненный расчёт заблокирован.');
      policy.normsSyncAllowed=false; policy.automaticPlannerAllowed=false; policy.geminiAllowed=false; policy.localRecommendationsAllowed=false;
      policy.goalFactorAllowed=false; policy.estimateOnly=true; policy.fluidEstimateAllowed=false; policy.mealSplitAllowed=false;
      var sex=String(input.sex||''), age=finite(input.age), nasemPal=String(input.nasemPal||'unknown');
      if(sex!=='female')errors.push('Для профиля «'+(guardrail==='pregnancy'?'Беременность':'Лактация')+'» выберите женский пол.');
      if(age==null||age<19||age>50)errors.push('Автоматический жизненный расчёт реализован для диапазона 19–50 лет; вне него нужен отдельный профиль.');
      if(!NASEM_PAL[nasemPal])errors.push('Выберите отдельную категорию активности NASEM: inactive, low active, active или very active.');
      if(clinical)errors.push('Сочетание жизненного и клинического профиля не рассчитывается автоматически. Используйте фактический анализ и индивидуальную клиническую цель.');
      if(edRiskActive)errors.push('Сочетание беременности или лактации с текущим/недавним риском РПП требует отдельного наблюдения; автоматическая энергетическая цель не формируется.');
      if(medicalRestrictionActive)errors.push('Сочетание беременности или лактации с неуточнёнными медицинскими ограничениями требует индивидуальной проверки; автоматическая энергетическая цель не формируется.');
      if(additionalClinicalConditions)errors.push('Дополнительные клинические состояния требуют отдельной многоконтекстной модели; жизненная EER не формируется.');
      if(String(input.edema||'no')==='yes')errors.push('При отёках или асците текущая масса может быть ненадёжной, поэтому автоматический жизненный EER не рассчитывается.');
      if(input.refeedingHighRisk)errors.push('При высоком риске рефидинга жизненный профиль не формирует автоматическую энергетическую цель.');
      if(guardrail==='pregnancy'){
        var week=finite(input.gestationWeek), pw=finite(input.prepregWeight), fetus=String(input.fetusCount||'unknown');
        if(week==null||week<1||week>42)errors.push('Укажите срок беременности от 1 до 42 недель.');
        if(pw==null||pw<15||pw>300)errors.push('Укажите добеременную массу: она нужна для классификации исходного ИМТ и белкового ориентира.');
        if(pw!=null&&finite(input.currentWeight)!=null&&finite(input.currentWeight)<pw)warnings.push('Текущая масса ниже добеременной: проверьте ввод и интерпретируйте результат только вместе с динамикой массы и акушерским контекстом.');
        if(fetus==='unknown')errors.push('Подтвердите число плодов; одноплодность не устанавливается по умолчанию.');
        else if(fetus!=='singleton')errors.push('Многоплодная беременность требует отдельного расчёта; стандартная формула не применяется.');
        if(String(input.pregnancyComplications||'unknown')!=='none')errors.push('При осложнениях или неизвестном статусе осложнений автоматический расчёт беременности отключён.');
      } else {
        var month=finite(input.postpartumMonth), feeding=String(input.feeding||'unknown');
        if(month==null||month<0||month>12)errors.push('Укажите месяц после родов от 0 до 12; более поздняя лактация требует отдельной оценки.');
        if(!((month!=null&&month<=6&&feeding==='exclusive')||(month!=null&&month>6&&feeding==='partial'))){
          errors.push('Автоматическая энергетическая поправка доступна для исключительно грудного вскармливания 0–6 месяцев или частичного вскармливания 7–12 месяцев. Для другого объёма лактации требуется индивидуальная оценка продукции молока.');
        }
      }
      if(errors.length){policy.lifeStageCalculationAllowed=false;policy.calculationAllowed=false;policy.status='blocked';}
      else reasons.push('Жизненный профиль рассчитан как справочный EER/DRI для неосложнённого сценария с явно выбранной категорией NASEM PAL; цель изменения массы не применяется.');
    }
    if(input.refeedingHighRisk){
      policy.protectedMode=true;policy.estimateOnly=true;policy.goalFactorAllowed=false;policy.normsSyncAllowed=false;policy.mealSplitAllowed=false;policy.automaticPlannerAllowed=false;policy.geminiAllowed=false;policy.localRecommendationsAllowed=false;policy.fluidEstimateAllowed=false;
      reasons.push('Высокий риск рефидинга имеет приоритет над всеми другими режимами.');
    }
    policy.status=(errors.length||policy.calculationAllowed===false)?'blocked':(policy.protectedMode?'protected':'standard');
    policy.primaryReason=errors[0]||reasons[0]||'';
    return policy;
  }

  function currentRefeedingHighRisk(){
    try{
      var qa=window.NutritionNeedsFormulaQA;
      if(qa&&typeof qa.assessAdultRefeedingRisk==='function'){
        var h=finite(text('needs_h','')),w=finite(text('needs_w',''));
        var result=qa.assessAdultRefeedingRisk({
          age:finite(text('needs_age','')),bmi:bmi(w,h),currentWeight:w,previousWeight:finite(text('needs_prev_w','')),
          lowIntakeDays:finite(text('needs_low_intake_days','')),electrolytes:text('needs_electrolytes','unknown'),additionalFactors:text('needs_refeeding_factors','unknown')
        });
        return !!(result&&result.highRisk);
      }
    }catch(_){}
    return !!(window.__lastNeedsMeta&&window.__lastNeedsMeta.refeedingRisk&&window.__lastNeedsMeta.refeedingRisk.highRisk);
  }

  function readContext(){
    return {
      state:text('needs_state','normal'),guardrail:text('needs_guardrail','none'),sex:text('needs_sex','male'),edema:text('needs_edema','no'),
      age:finite(text('needs_age','')),height:finite(text('needs_h','')),currentWeight:finite(text('needs_w','')),activity:text('needs_activity','low'),nasemPal:text('needs_nasem_pal','unknown'),
      gestationWeek:finite(text('needs_gestation_week','')),prepregWeight:finite(text('needs_prepreg_w','')),fetusCount:text('needs_fetus_count','unknown'),pregnancyComplications:text('needs_pregnancy_complications','unknown'),
      additionalEdRisk:checked('needs_additional_ed_risk'),additionalMedicalRestriction:checked('needs_additional_medical_restriction'),additionalClinicalConditions:checked('needs_additional_clinical_conditions'),
      postpartumMonth:finite(text('needs_postpartum_month','')),feeding:text('needs_lactation_feeding','unknown'),
      clinicalTargetsConfirmed:checked('needs_clinical_targets_confirmed'),clinicalEnergyManual:finite(text('needs_clinical_energy_manual','')),clinicalProteinManual:finite(text('needs_protein_manual','')),
      clinicalReferenceWeight:finite(text('needs_clinical_reference_weight','')),clinicalConfirmedBy:text('needs_clinical_confirmed_by',''),clinicalConfirmedRole:text('needs_clinical_confirmed_role','unknown'),
      clinicalConfirmedAt:text('needs_clinical_confirmed_at',''),clinicalReviewDueAt:text('needs_clinical_review_due_at',''),clinicalSourceMethod:text('needs_clinical_source_method',''),
      clinicalPhase:text('needs_clinical_phase','unknown'),clinicalRoute:text('needs_clinical_route','unknown'),clinicalSourceNote:text('needs_clinical_source_note',''),region:region(),
      refeedingHighRisk:currentRefeedingHighRisk()
    };
  }

  function calculateLifeStage(input){
    input=Object.assign({},input||{}); var p=evaluate(input); if(!p.calculationAllowed||!p.lifeStage)return null;
    var e=p.lifeStage==='pregnancy'
      ? pregnancyTee(input.nasemPal,input.age,input.height,input.currentWeight,input.gestationWeek,input.prepregWeight)
      : lactationTee(input.nasemPal,input.age,input.height,input.currentWeight,input.postpartumMonth,input.feeding);
    if(!e)return null;
    var targets=p.lifeStage==='pregnancy'?pregnancyTargets(input):lactationTargets(input);
    return {lifeStage:p.lifeStage,energy:e,targets:targets,policy:p};
  }

  function lifeStageNutrientReference(key,input){
    input=Object.assign({},input||readContext());
    var p=evaluate(input), active=p.lifeStage==='pregnancy'||p.lifeStage==='lactation';
    if(!active)return null;
    var stageLabel=p.lifeStage==='pregnancy'?'беременность':'лактация';
    if(!p.calculationAllowed)return {active:true,valid:false,suppressAdult:true,allowAdultUpperLimit:false,min:null,ul:null,safe:null,coverageStatus:'blocked',profile:'Защищённый жизненный профиль: '+stageLabel,basis:'жизненный профиль не завершён',note:(p.errors||[]).join(' ')};
    var ls=calculateLifeStage(input), targets=ls&&ls.targets?ls.targets:null;
    if(!targets)return {active:true,valid:false,suppressAdult:true,allowAdultUpperLimit:false,min:null,ul:null,safe:null,coverageStatus:'unavailable',profile:'Защищённый жизненный профиль: '+stageLabel,basis:'жизненный профиль',note:'Расчёт жизненных ориентиров недоступен.'};
    var target=targets[key], stageMeta=targets._lifeStage||{}, regionCode=String(input.region||region()), coverage=targets._coverage&&targets._coverage[key]?targets._coverage[key]:{status:'unavailable'};
    var upper=targets._upperLimits&&targets._upperLimits[key]?targets._upperLimits[key]:undefined;
    if(target&&Number.isFinite(Number(target.value)))return {active:true,valid:true,suppressAdult:true,allowAdultUpperLimit:regionCode==='us',min:{type:target.type||(regionCode==='eu'?'EFSA DRV':'US DRI'),value:Number(target.value),provenance:target.provenance||null},ul:upper,safe:null,coverageStatus:coverage.status,basis:target.basis||'жизненный профиль',profile:'Защищённый жизненный профиль: '+stageLabel,note:stageMeta.note||'',provenance:target.provenance||null};
    return {active:true,valid:true,suppressAdult:true,allowAdultUpperLimit:regionCode==='us',min:null,ul:upper,safe:null,coverageStatus:coverage.status,basis:regionCode==='eu'?'EFSA DRV — проверенный поднабор':'US DRI — жизненный профиль',profile:'Защищённый жизненный профиль: '+stageLabel,note:coverage.note||'Для этого показателя жизненное значение не подтверждено; обычная взрослая норма намеренно не подставляется.'};
  }

  function currentPolicy(){return evaluate(readContext());}

  function htmlEscape(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function renderUi(){
    var root=document.getElementById('needsProtectedModeContext'); if(!root)return;
    var c=readContext(), p=evaluate(c), preg=document.getElementById('needsPregnancyFields'), lact=document.getElementById('needsLactationFields'), lifePal=document.getElementById('needsLifeStagePalField'), clinical=document.getElementById('needsClinicalModeFields');
    if(preg)preg.hidden=c.guardrail!=='pregnancy'; if(lact)lact.hidden=c.guardrail!=='lactation'; if(lifePal)lifePal.hidden=!(c.guardrail==='pregnancy'||c.guardrail==='lactation');
    if(clinical)clinical.hidden=!p.externalTargetOnly;
    root.open=!!(p.protectedMode||p.errors.length);
    var status=document.getElementById('needsProtectedModeStatus'); if(status){
      var label=p.status==='blocked'?'Автоматический расчёт заблокирован':(p.protectedMode?'Защищённый режим активен':'Обычный режим');
      var details=(p.errors.length?p.errors:p.reasons.concat(p.warnings||[])).slice(0,4).join(' ');
      status.innerHTML='<strong>'+htmlEscape(label)+'</strong><div class="small" style="margin-top:4px;">'+htmlEscape(details||'Ограничения не активны.')+'</div>';
      status.className='alert'+(p.status==='blocked'?' alert-danger':'');
    }
  }

  function init(){
    ['needs_state','needs_guardrail','needs_sex','needs_age','needs_h','needs_w','needs_activity','needs_nasem_pal','needs_gestation_week','needs_prepreg_w','needs_fetus_count','needs_pregnancy_complications','needs_postpartum_month','needs_lactation_feeding','needs_additional_ed_risk','needs_additional_medical_restriction','needs_additional_clinical_conditions','needs_clinical_energy_manual','needs_protein_manual','needs_clinical_reference_weight','needs_clinical_confirmed_by','needs_clinical_confirmed_role','needs_clinical_confirmed_at','needs_clinical_review_due_at','needs_clinical_source_method','needs_clinical_phase','needs_clinical_route','needs_clinical_source_note','needs_clinical_targets_confirmed'].forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      el.addEventListener('change',renderUi);el.addEventListener('input',renderUi);
    });
    window.addEventListener('norm:region-changed',renderUi);renderUi();
  }

  window.ProtectedModesP03=Object.freeze({
    version:'v5.3.210-p0.3.2.1',evaluate:evaluate,readContext:readContext,currentPolicy:currentPolicy,
    calculateLifeStage:calculateLifeStage,adultFemaleTee:adultFemaleTee,pregnancyTee:pregnancyTee,lactationTee:lactationTee,
    pregnancyTargets:pregnancyTargets,lactationTargets:lactationTargets,lifeStageNutrientReference:lifeStageNutrientReference,renderUi:renderUi,
    validateClinicalTarget:validateClinicalTarget,trackedLifeStageKeys:LIFE_STAGE_TRACKED_KEYS,evidence:EVIDENCE_REGISTRY,dateValue:dateValue,clinicalTargetMaxAgeDays:CLINICAL_TARGET_MAX_AGE_DAYS,
    isClinicalState:function(s){return !!CLINICAL_STATES[String(s||'')];}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
