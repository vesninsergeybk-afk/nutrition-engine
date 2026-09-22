#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='v5.3.210-p1.4'
REGISTRY_JSON=ROOT/'config/formula-registry.v5.3.210-p1.4.json'
CASES_JSON=ROOT/'data/formula-golden-cases.v5.3.210-p1.4.json'
RUNTIME_JS=ROOT/'assets/data/formula-registry.v5.3.210-p1.4.js'
LEGACY_JS=ROOT/'assets/legacy/data/formula-registry.v5.3.210-p1.4.js'

def r(v,d=6):
    return round(float(v),d)
def jsround(v):
    return math.floor(float(v)+0.5) if v>=0 else math.ceil(float(v)-0.5)

def formula(fid,title,kind,source_ids,implementation,equation,inputs,outputs,rounding='none',status='active',notes='',materiality='material'):
    return {'id':fid,'title_ru':title,'kind':kind,'source_ids':source_ids,'implementation':implementation,'equation':equation,'inputs':inputs,'outputs':outputs,'rounding':rounding,'status':status,'materiality':materiality,'notes_ru':notes,'golden_case_required':materiality=='material'}

def registry():
    sources={
      'mifflin_1990':{'title':'Mifflin–St Jeor resting energy equation','authority':'peer_reviewed_primary','url':'https://pubmed.ncbi.nlm.nih.gov/2305711/','reviewed_at':'2026-07-18'},
      'nasem_energy_2023':{'title':'Dietary Reference Intakes for Energy, NASEM 2023','authority':'authoritative_report','url':'https://www.ncbi.nlm.nih.gov/books/NBK591024/','doi':'10.17226/26818','reviewed_at':'2026-07-18'},
      'nice_cg32':{'title':'NICE CG32 Nutrition support for adults','authority':'official_guideline','url':'https://www.nice.org.uk/guidance/cg32','reviewed_at':'2026-07-18'},
      'nci_hei_2020':{'title':'Healthy Eating Index 2020 scoring standards','authority':'official_methodology','url':'https://epi.grants.cancer.gov/hei/hei-2020-scoring-metric.html','reviewed_at':'2026-07-18'},
      'efsa_dietary_reference_values':{'title':'EFSA dietary reference values and life-stage additions','authority':'official_scientific_opinion','url':'https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values','reviewed_at':'2026-07-18'},
      'devine_1974':{'title':'Devine ideal body weight equation (historical dosage rule)','authority':'historical_peer_reviewed','citation':'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650–655.','reviewed_at':'2026-07-18'},
      'internal_local_policy':{'title':'Nutrition Calculator local screening policy','authority':'internal_policy','document':'NUTRITION_CALCULATOR_V5_3_210_P1_4_FORMULA_REGISTRY_REPORT_RU.md','reviewed_at':'2026-07-18'},
      'arithmetic_identity':{'title':'Dimensional arithmetic identity','authority':'mathematical_identity','reviewed_at':'2026-07-18'},
    }
    F=[]
    F += [
      formula('anthropometry.bmi','Индекс массы тела','AUTHORITATIVE',['arithmetic_identity'],['assets/js/04-needs-norms.js::computeBMI'],'weight_kg/(height_m^2)',['height_cm','weight_kg'],['bmi_kg_m2'],'0.1'),
      formula('anthropometry.devine_ibw','Расчётная масса Devine','AUTHORITATIVE',['devine_1974'],['assets/js/04-needs-norms.js::computeIBW'],'male: 50+0.9*(height_cm-152); female:45.5+0.9*(height_cm-152); undefined below 152 cm',['sex','height_cm'],['ibw_kg'],'none',notes='Историческая формула для расчётной массы; не является универсальной целью массы.'),
      formula('anthropometry.adjusted_weight','Скорректированная масса','LOCAL_POLICY',['internal_local_policy'],['assets/js/04-needs-norms.js::computeAdjusted'],'ibw+factor*(actual-ibw)',['ibw_kg','actual_weight_kg','factor'],['adjusted_weight_kg'],'none',notes='Локальная расчётная политика, не самостоятельная клиническая рекомендация.'),
      formula('anthropometry.weight_loss_pct','Непреднамеренная потеря массы','AUTHORITATIVE',['nice_cg32'],['assets/js/04-needs-norms.js::computeUnintentionalWeightLossPct'],'max(0,(previous-current)/previous*100)',['previous_weight_kg','current_weight_kg'],['weight_loss_pct'],'0.1'),
      formula('safety.nice_refeeding_screen','Скрининг риска рефидинга NICE','DECISION_RULE',['nice_cg32'],['assets/js/04-needs-norms.js::assessAdultRefeedingRisk'],'one major OR two minor criteria; extreme if BMI<14 or intake>15 days',['age','bmi','weight_loss_pct','low_intake_days','electrolytes','additional_factors'],['risk_level','high_risk','extreme_risk'],'categorical'),
      formula('energy.mifflin_st_jeor','Основной обмен Mifflin–St Jeor','AUTHORITATIVE',['mifflin_1990'],['assets/js/04-needs-norms.js::mifflinBMR'],'10*w+6.25*h-5*age+s; s=5 male, -161 female',['sex','weight_kg','height_cm','age_years'],['bmr_kcal_day'],'none'),
      formula('energy.ordinary_pal','Оценка TEE через PAL','LOCAL_POLICY',['mifflin_1990','internal_local_policy'],['assets/js/04-needs-norms.js::energyByMifflinSF'],'BMR*PAL*state_factor',['bmr_kcal_day','pal','state_factor'],['tee_low_kcal','tee_high_kcal'],'integer',notes='PAL и диапазон +10% являются локальной политикой калькулятора.'),
      formula('energy.weight_screen','Весовой скрининговый диапазон энергии','LOCAL_POLICY',['internal_local_policy'],['assets/js/04-needs-norms.js::energyByWeightMethod'],'kcal_per_kg*weight*activity_scale*state_factor; high=low*1.15',['state','activity','weight_kg'],['energy_low_kcal','energy_high_kcal'],'integer',notes='Скрининговая, а не лечебная формула; клинические режимы исключены.'),
      formula('energy.goal_factor','Целевой множитель энергии','LOCAL_POLICY',['internal_local_policy'],['assets/js/04-needs-norms.js::goalFactorByKey'],'maintain 1.00; lose 0.85; gain 1.10; rehab_gain 1.10',['goal'],['factor'],'none',notes='Локальная настройка; блокируется защитными режимами.'),
      formula('protein.ordinary_target','Обычная цель белка','LOCAL_POLICY',['internal_local_policy'],['assets/js/04-needs-norms.js::proteinPerKgFor'],'state/activity table + goal bump + age floor, clamped to state corridor',['state','activity','age','goal','weight_kg','sex'],['protein_g_kg_day'],'0.01',notes='Локальная политика. Клинические состояния требуют внешней цели.'),
      formula('macros.fat_share','Жиры из доли энергии','DERIVED',['arithmetic_identity','internal_local_policy'],['assets/js/04-needs-norms.js::calcNeeds_internal'],'energy_kcal*fat_percent/100/9',['energy_kcal','fat_percent'],['fat_g'],'0.1'),
      formula('macros.carb_residual','Углеводы как остаток энергии','DERIVED',['arithmetic_identity','internal_local_policy'],['assets/js/04-needs-norms.js::calcNeeds_internal'],'max(0,(energy-protein_g*4-fat_g*9)/4)',['energy_kcal','protein_g','fat_g'],['carbs_g'],'0.1'),
      formula('fluids.ordinary_screen','Обычная оценка жидкости','LOCAL_POLICY',['internal_local_policy'],['assets/js/04-needs-norms.js::calcNeeds_internal'],'fluid_ml_per_kg*calculation_weight',['fluid_ml_per_kg','weight_kg'],['fluid_ml_day'],'integer',notes='Не применяется при клинических ограничениях жидкости.'),
      formula('meals.energy_split','Распределение по приёмам','DERIVED',['arithmetic_identity'],['assets/js/04-needs-norms.js::parseSplit','assets/js/04-needs-norms.js::calcNeeds_internal'],'daily_target*meal_percent/100',['daily_targets','meal_percentages'],['meal_targets'],'mixed'),
      formula('energy.nasem_adult_female_2023','NASEM 2023 EER для взрослых женщин','AUTHORITATIVE',['nasem_energy_2023'],['assets/js/05-protected-modes-v5.3.210.js::adultFemaleTee'],'PAL-specific linear equation in age, height and weight',['pal','age_years','height_cm','weight_kg'],['tee_kcal_day'],'none'),
      formula('energy.nasem_pregnancy_2023','NASEM 2023 энергия при беременности','AUTHORITATIVE',['nasem_energy_2023'],['assets/js/05-protected-modes-v5.3.210.js::pregnancyTee'],'trimester/PAL-specific equation plus BMI-dependent deposition',['pal','age_years','height_cm','current_weight_kg','gestation_week','prepreg_weight_kg'],['target_kcal_day','deposition_kcal','trimester'],'integer'),
      formula('energy.nasem_lactation_2023','NASEM 2023 энергия при лактации','AUTHORITATIVE',['nasem_energy_2023'],['assets/js/05-protected-modes-v5.3.210.js::lactationTee'],'adult female EER +404 (exclusive 0-6) or +380 (partial 7-12)',['pal','age_years','height_cm','current_weight_kg','postpartum_month','feeding'],['target_kcal_day'],'integer'),
      formula('product.per100_scaling','Масштабирование значений на массу продукта','ARITHMETIC',['arithmetic_identity'],['assets/js/03-app-core-v5.3.208.js::Calc.scaledPerItem','assets/legacy/js/03-app-core-v5.3.208.js::Calc.scaledPerItem'],'per100_value*grams/100',['per100_value','grams'],['scaled_value'],'none'),
      formula('product.salt_to_sodium','Fallback соли в натрий','LOCAL_POLICY',['internal_local_policy'],['assets/js/03-app-core-v5.3.208.js::Calc.scaledPerItem','assets/legacy/js/03-app-core-v5.3.208.js::Calc.scaledPerItem'],'sodium_mg=salt_g*393 when sodium is absent',['salt_g'],['sodium_mg'],'none',notes='Коэффициент соответствует 39.3% натрия в NaCl; применяется только как fallback.'),
      formula('ration.nutrient_sum','Суммирование нутриентов рациона','ARITHMETIC',['arithmetic_identity'],['assets/js/03-app-core-v5.3.208.js::Calc.totals','assets/legacy/js/03-app-core-v5.3.208.js::Calc.totals'],'sum(scaled product values)',['ration_items'],['nutrient_totals'],'none'),
      formula('norm.per_mj','Норма на мегаджоуль','DERIVED',['arithmetic_identity'],['assets/data/normative-registry.v5.3.210-p1.2.js::evaluateRule(per_mj_energy)'],'energy_kcal*4.184/1000*value_per_mj',['energy_kcal','value_per_mj'],['target_value'],'0.01'),
      formula('norm.percent_energy_to_grams','Процент энергии в граммы','DERIVED',['arithmetic_identity'],['assets/data/normative-registry.v5.3.210-p1.2.js::evaluateRule(percent_energy_to_grams)'],'energy_kcal*percent/100/kcal_per_g',['energy_kcal','percent','kcal_per_g'],['grams'],'0.01'),
      formula('protein.efsa_pregnancy','Белок EFSA при беременности','AUTHORITATIVE',['efsa_dietary_reference_values'],['assets/data/normative-registry.v5.3.210-p1.2.js::resolveLifeStageProfile'],'0.83*prepreg_weight + trimester addition (1/9/28 g)',['prepreg_weight_kg','gestation_week'],['protein_g_day'],'none'),
      formula('protein.efsa_lactation','Белок EFSA при лактации','AUTHORITATIVE',['efsa_dietary_reference_values'],['assets/data/normative-registry.v5.3.210-p1.2.js::resolveLifeStageProfile'],'0.83*current_weight +19 g first 6 months, +13 g thereafter',['current_weight_kg','postpartum_month'],['protein_g_day'],'none'),
      formula('hei.density','HEI плотность на 1000 ккал','AUTHORITATIVE',['nci_hei_2020'],['assets/js/01-hei-module.js::score','assets/legacy/js/01-hei-module.js::score'],'component_amount*1000/reference_energy_kcal',['component_amount','energy_ref_kcal'],['density_per_1000_kcal'],'none'),
      formula('hei.adequacy_component','HEI adequacy interpolation','AUTHORITATIVE',['nci_hei_2020'],['assets/js/01-hei-module.js::scoreFromDensity','assets/legacy/js/01-hei-module.js::scoreFromDensity'],'linear from 0 points at zero to max points at standard',['density','standard','max_points'],['points'],'none'),
      formula('hei.moderation_component','HEI moderation interpolation','AUTHORITATIVE',['nci_hei_2020'],['assets/js/01-hei-module.js::scoreFromDensity','assets/legacy/js/01-hei-module.js::scoreFromDensity'],'max points <= max standard; zero >= minimum standard; linear between',['density','max_standard','zero_standard','max_points'],['points'],'none'),
      formula('hei.fatty_acid_ratio','HEI отношение ненасыщенных к насыщенным жирам','AUTHORITATIVE',['nci_hei_2020'],['assets/js/01-hei-module.js::score','assets/legacy/js/01-hei-module.js::score'],'(MUFA+PUFA)/SFA; max standard 2.5, zero standard 1.2',['unsaturated_fat_g','saturated_fat_g'],['ratio','points'],'none'),
      formula('hei.total','Суммарный HEI-2020','AUTHORITATIVE',['nci_hei_2020'],['assets/js/01-hei-module.js::scoreFromDensity','assets/legacy/js/01-hei-module.js::scoreFromDensity'],'sum of 13 component scores, range 0-100',['component_points'],['hei_total'],'none'),
    ]
    return {'schema_version':1,'registry_version':VERSION,'released_at':'2026-07-18','reviewed_at':'2026-07-18','review_due_at':'2027-07-18','scope':'Material, user-observable calculation and decision formulas. Search ranking and visual heuristics are excluded.','sources':sources,'formulas':F,'quality_policy':{'authoritative_requires_source':True,'material_requires_golden_cases':True,'local_policy_must_be_labeled':True,'clinical_profiles_external_target_only':True,'minimum_cases_per_material_formula':2,'boundary_case_required_for_decision_rules':True}}

def c(fid,cid,inputs,expected,tol=1e-9,tags=None):
    return {'case_id':cid,'formula_id':fid,'inputs':inputs,'expected':expected,'tolerance':tol,'tags':tags or []}

def cases():
    out=[]
    out += [c('anthropometry.bmi','bmi_normal',{'height_cm':180,'weight_kg':81},25.0,0.01),c('anthropometry.bmi','bmi_low',{'height_cm':165,'weight_kg':50},18.4,0.01),c('anthropometry.bmi','bmi_obese',{'height_cm':160,'weight_kg':102.4},40.0,0.01)]
    out += [c('anthropometry.devine_ibw','devine_male_152',{'sex':'male','height_cm':152},50),c('anthropometry.devine_ibw','devine_female_170',{'sex':'female','height_cm':170},61.7),c('anthropometry.devine_ibw','devine_below_domain',{'sex':'male','height_cm':151},None,tags=['boundary'])]
    out += [c('anthropometry.adjusted_weight','adj_quarter',{'ibw_kg':70,'actual_weight_kg':110,'factor':0.25},80),c('anthropometry.adjusted_weight','adj_point4',{'ibw_kg':70,'actual_weight_kg':120,'factor':0.4},90)]
    out += [c('anthropometry.weight_loss_pct','loss_10',{'previous_weight_kg':50,'current_weight_kg':45},10.0),c('anthropometry.weight_loss_pct','loss_no_gain_negative',{'previous_weight_kg':50,'current_weight_kg':55},0.0)]
    out += [
      c('safety.nice_refeeding_screen','refeed_bmi_16_not_major',{'age':40,'bmi':16,'weight_loss_pct':0,'low_intake_days':0,'electrolytes':'normal','additional_factors':'no'},{'highRisk':False,'extremeRisk':False},tags=['boundary']),
      c('safety.nice_refeeding_screen','refeed_bmi_15_9_major',{'age':40,'bmi':15.9,'weight_loss_pct':0,'low_intake_days':0,'electrolytes':'normal','additional_factors':'no'},{'highRisk':True,'extremeRisk':False},tags=['boundary']),
      c('safety.nice_refeeding_screen','refeed_two_minor',{'age':40,'bmi':18.4,'weight_loss_pct':10.1,'low_intake_days':0,'electrolytes':'normal','additional_factors':'no'},{'highRisk':True,'extremeRisk':False}),
      c('safety.nice_refeeding_screen','refeed_extreme_intake',{'age':40,'bmi':20,'weight_loss_pct':0,'low_intake_days':15.1,'electrolytes':'normal','additional_factors':'no'},{'highRisk':True,'extremeRisk':True},tags=['boundary'])]
    def mif(sex,w,h,a): return 10*w+6.25*h-5*a+(5 if sex=='male' else -161)
    for sex,w,h,a in [('male',70,175,40),('female',60,165,30),('female',90,170,65)]: out.append(c('energy.mifflin_st_jeor',f'mifflin_{sex}_{w}_{a}',{'sex':sex,'weight_kg':w,'height_cm':h,'age_years':a},r(mif(sex,w,h,a))))
    pals={'sedentary':1.2,'low':1.35,'moderate':1.5,'high':1.7,'veryhigh':1.9}
    for act in ['sedentary','low','moderate','high','veryhigh']:
      b=mif('male',70,175,40); low=jsround(b*pals[act]); out.append(c('energy.ordinary_pal',f'ordinary_pal_{act}',{'sex':'male','weight_kg':70,'height_cm':175,'age_years':40,'activity':act,'state_factor':1},{'low':low,'high':jsround(low*1.10)}))
    for st,kpg,sf in [('normal',25,1),('rehab',27,1.05),('elderly',25,1)]:
      base=kpg*70*1*sf; out.append(c('energy.weight_screen',f'weight_screen_{st}_low',{'state':st,'activity':'low','weight_kg':70},{'low':jsround(base),'high':jsround(base*1.15)}))
    for goal,val in [('maintain',1),('lose',.85),('gain',1.1),('rehab_gain',1.1)]: out.append(c('energy.goal_factor',f'goal_{goal}',{'goal':goal},val))
    protein_cases=[('normal','low',40,'maintain',.9),('normal','moderate',40,'maintain',1.05),('normal','high',40,'lose',1.3),('rehab','moderate',40,'rehab_gain',1.3),('elderly','moderate',70,'maintain',1.2),('normal','low',70,'maintain',1.0)]
    for i,(st,act,age,goal,exp) in enumerate(protein_cases): out.append(c('protein.ordinary_target',f'protein_{i+1}',{'state':st,'activity':act,'age':age,'goal':goal,'weight_kg':70,'sex':'male'},exp,1e-9))
    out += [c('macros.fat_share','fat_30pct_2000',{'energy_kcal':2000,'fat_percent':30},66.7,.05),c('macros.fat_share','fat_25pct_1800',{'energy_kcal':1800,'fat_percent':25},50,.05)]
    out += [c('macros.carb_residual','carb_residual_standard',{'energy_kcal':2000,'protein_g':100,'fat_g':66.7},249.9,.1),c('macros.carb_residual','carb_residual_floor',{'energy_kcal':1000,'protein_g':200,'fat_g':50},0,.01)]
    out += [c('fluids.ordinary_screen','fluid_70',{'fluid_ml_per_kg':30,'weight_kg':70},2100),c('fluids.ordinary_screen','fluid_55',{'fluid_ml_per_kg':30,'weight_kg':55},1650)]
    out += [c('meals.energy_split','split_four',{'daily_target':2000,'percentages':[25,35,30,10]},[500,700,600,200]),c('meals.energy_split','split_three',{'daily_target':1800,'percentages':[30,40,30]},[540,720,540])]
    def adult(pal,age,h,w):
      return {'inactive':584.90-7.01*age+5.72*h+11.71*w,'low_active':575.77-7.01*age+6.60*h+12.14*w,'active':710.25-7.01*age+6.54*h+12.34*w,'very_active':511.83-7.01*age+9.07*h+12.56*w}[pal]
    for pal in ['inactive','low_active','active','very_active']: out.append(c('energy.nasem_adult_female_2023',f'nasem_adult_{pal}',{'pal':pal,'age_years':30,'height_cm':165,'weight_kg':60},r(adult(pal,30,165,60),6),1e-6))
    def pbmi(w,h): return w/(h/100)**2
    preg_specs=[('first','low_active',30,165,62,12,60),('under','low_active',30,165,70,24,48),('normal','low_active',30,165,70,24,60),('over','low_active',30,165,75,30,72),('obese','low_active',30,165,85,30,85)]
    for name,pal,age,h,cw,wk,pw in preg_specs:
      if wk<=13: exp={'target':jsround(adult(pal,age,h,cw)),'deposition':0,'trimester':1}
      else:
        base=693.35-2.04*age+5.73*h+10.20*cw+9.16*wk
        b=pbmi(pw,h); dep=300 if b<18.5 else 150 if b<30 and b>=25 else -50 if b>=30 else 200
        exp={'target':jsround(max(0,base+dep)),'deposition':dep,'trimester':2 if wk<=27 else 3}
      out.append(c('energy.nasem_pregnancy_2023',f'preg_{name}',{'pal':pal,'age_years':age,'height_cm':h,'current_weight_kg':cw,'gestation_week':wk,'prepreg_weight_kg':pw},exp))
    for month,feed,inc in [(3,'exclusive',404),(8,'partial',380)]: out.append(c('energy.nasem_lactation_2023',f'lact_{month}_{feed}',{'pal':'low_active','age_years':30,'height_cm':165,'current_weight_kg':62,'postpartum_month':month,'feeding':feed},{'target':jsround(adult('low_active',30,165,62)+inc),'increment':inc}))
    for v,g in [(100,50),(12.3,250),(0,80)]: out.append(c('product.per100_scaling',f'scale_{v}_{g}',{'per100_value':v,'grams':g},r(v*g/100)))
    out += [c('product.salt_to_sodium','salt_1g',{'salt_g':1},393),c('product.salt_to_sodium','salt_2_5g',{'salt_g':2.5},982.5)]
    out += [c('ration.nutrient_sum','sum_basic',{'values':[10,20.5,0,3]},33.5),c('ration.nutrient_sum','sum_empty',{'values':[]},0)]
    out += [c('norm.per_mj','per_mj_2000',{'energy_kcal':2000,'value_per_mj':0.1},.84,1e-9),c('norm.per_mj','per_mj_2500',{'energy_kcal':2500,'value_per_mj':1.6},16.74,1e-9)]
    out += [c('norm.percent_energy_to_grams','pct_energy_fat',{'energy_kcal':2000,'percent':30,'kcal_per_g':9},66.67,1e-9),c('norm.percent_energy_to_grams','pct_energy_carb',{'energy_kcal':1800,'percent':50,'kcal_per_g':4},225,1e-9)]
    for wk,add in [(10,1),(20,9),(30,28)]: out.append(c('protein.efsa_pregnancy',f'efsa_preg_{wk}',{'prepreg_weight_kg':60,'gestation_week':wk},49.8+add,1e-9))
    for month,add in [(3,19),(8,13)]: out.append(c('protein.efsa_lactation',f'efsa_lact_{month}',{'current_weight_kg':62,'postpartum_month':month},.83*62+add,1e-9))
    standards={'fruits_total':(.8,5),'fruits_whole':(.4,5),'vegetables_total':(1.1,5),'greens_beans':(.2,5),'grains_whole':(1.5,10),'dairy':(1.3,10),'protein_total':(2.5,5),'seafood_plant':(.8,5)}
    for k,(std,pts) in standards.items():
      out.append(c('hei.adequacy_component',f'hei_adeq_{k}_zero',{'component':k,'density':0},0))
      out.append(c('hei.adequacy_component',f'hei_adeq_{k}_mid',{'component':k,'density':std/2},pts/2))
      out.append(c('hei.adequacy_component',f'hei_adeq_{k}_max',{'component':k,'density':std},pts))
    moderation={'grains_refined':(1.8,4.3,10),'sodium_g':(1.1,2.0,10),'added_sugars_pct':(6.5,26,10),'sat_fats_pct':(8,16,10)}
    for k,(good,bad,pts) in moderation.items():
      out.append(c('hei.moderation_component',f'hei_mod_{k}_max',{'component':k,'density':good},pts))
      out.append(c('hei.moderation_component',f'hei_mod_{k}_mid',{'component':k,'density':(good+bad)/2},pts/2))
      out.append(c('hei.moderation_component',f'hei_mod_{k}_zero',{'component':k,'density':bad},0))
    out += [c('hei.fatty_acid_ratio','hei_fat_ratio_zero',{'ratio':1.2},0),c('hei.fatty_acid_ratio','hei_fat_ratio_mid',{'ratio':1.85},5),c('hei.fatty_acid_ratio','hei_fat_ratio_max',{'ratio':2.5},10)]
    out += [c('hei.density','hei_density_basic',{'component_amount':2,'energy_ref_kcal':2000},1),c('hei.density','hei_density_1500',{'component_amount':1.2,'energy_ref_kcal':1500},.8)]
    out += [c('hei.total','hei_total_perfect',{'component_points':[5,5,5,5,10,10,5,5,10,10,10,10,10]},100),c('hei.total','hei_total_zero',{'component_points':[0]*13},0)]
    return {'schema_version':1,'cases_version':VERSION,'generated_by':'independent_python_reference_implementations','generated_at':'2026-07-18','cases':out}

def canonical(obj): return json.dumps(obj,ensure_ascii=False,sort_keys=True,indent=2)+'\n'
def runtime_text(reg,cas):
    reg_json=json.dumps(reg,ensure_ascii=False,separators=(',',':'))
    cas_json=json.dumps(cas,ensure_ascii=False,separators=(',',':'))
    digest=hashlib.sha256(canonical(reg).encode()).hexdigest()
    return f"""/* Generated P1.4 formula registry. Do not edit by hand. */\n(function(){{\n'use strict';\nvar registry={reg_json};\nvar golden={cas_json};\nvar byId=Object.create(null);registry.formulas.forEach(function(f){{byId[f.id]=f;}});\nfunction ids(list){{return (list||[]).filter(function(id){{return !!byId[id];}});}}\nfunction audit(idsList){{var clean=ids(idsList);return Object.freeze({{registryVersion:registry.registry_version,registrySha256:'{digest}',formulaIds:Object.freeze(clean.slice()),formulas:Object.freeze(clean.map(function(id){{return byId[id];}}))}});}}\nwindow.NutritionFormulaRegistryP14=Object.freeze({{version:registry.registry_version,sourceSha256:'{digest}',data:registry,golden:golden,get:function(id){{return byId[id]||null;}},ids:ids,audit:audit}});\n}})();\n"""

def write_or_check(path:Path,text:str,check:bool):
    if check:
      if not path.exists() or path.read_text(encoding='utf-8')!=text: raise SystemExit(f'generated artifact differs: {path.relative_to(ROOT)}')
    else:
      path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');ap.add_argument('--json-out');a=ap.parse_args()
    reg=registry();cas=cases();rt=runtime_text(reg,cas)
    write_or_check(REGISTRY_JSON,canonical(reg),a.check);write_or_check(CASES_JSON,canonical(cas),a.check);write_or_check(RUNTIME_JS,rt,a.check);write_or_check(LEGACY_JS,rt,a.check)
    counts={}
    for x in reg['formulas']: counts[x['kind']]=counts.get(x['kind'],0)+1
    covered={x['formula_id'] for x in cas['cases']}
    result={'ok':True,'registry_version':VERSION,'formulas':len(reg['formulas']),'golden_cases':len(cas['cases']),'formula_kinds':counts,'covered_formulas':len(covered),'uncovered':[x['id'] for x in reg['formulas'] if x['golden_case_required'] and x['id'] not in covered]}
    if result['uncovered']: raise SystemExit('uncovered material formulas: '+','.join(result['uncovered']))
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if a.json_out:
      p=ROOT/a.json_out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__': main()
