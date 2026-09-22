#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,json,math,re
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'config/formula-registry.v5.3.210-p1.4.json'; CASES=ROOT/'data/formula-golden-cases.v5.3.210-p1.4.json'

def jsround(v): return math.floor(v+0.5) if v>=0 else math.ceil(v-0.5)
def close(a,b,t): return abs(float(a)-float(b))<=float(t)
def lerp(x0,x1,v,y0,y1):
    if x0==x1:return y1 if v>=x1 else y0
    q=max(0,min(1,(v-x0)/(x1-x0)));return y0+(y1-y0)*q
PAL={'sedentary':1.2,'low':1.35,'moderate':1.5,'high':1.7,'veryhigh':1.9}
STATE={'normal':(25,1),'rehab':(27,1.05),'elderly':(25,1)}
PROT={'normal':{'sedentary':.8,'low':.9,'moderate':1.05,'high':1.2,'veryhigh':1.4,'floor':.8,'cap':1.6},'rehab':{'sedentary':1.2,'low':1.2,'moderate':1.3,'high':1.4,'veryhigh':1.5,'floor':1.2,'cap':1.5},'elderly':{'sedentary':1,'low':1,'moderate':1.1,'high':1.2,'veryhigh':1.2,'floor':1,'cap':1.5}}
ADEQ={'fruits_total':(.8,5),'fruits_whole':(.4,5),'vegetables_total':(1.1,5),'greens_beans':(.2,5),'grains_whole':(1.5,10),'dairy':(1.3,10),'protein_total':(2.5,5),'seafood_plant':(.8,5)}
MOD={'grains_refined':(1.8,4.3,10),'sodium_g':(1.1,2,10),'added_sugars_pct':(6.5,26,10),'sat_fats_pct':(8,16,10)}
def adult(pal,a,h,w):
    return {'inactive':584.90-7.01*a+5.72*h+11.71*w,'low_active':575.77-7.01*a+6.60*h+12.14*w,'active':710.25-7.01*a+6.54*h+12.34*w,'very_active':511.83-7.01*a+9.07*h+12.56*w}[pal]
def eval_case(c):
    f=c['formula_id'];i=c['inputs']
    if f=='anthropometry.bmi': return round(i['weight_kg']/(i['height_cm']/100)**2,1)
    if f=='anthropometry.devine_ibw': return None if i['height_cm']<152 else (50 if i['sex']=='male' else 45.5)+.9*(i['height_cm']-152)
    if f=='anthropometry.adjusted_weight':return i['ibw_kg']+i['factor']*(i['actual_weight_kg']-i['ibw_kg'])
    if f=='anthropometry.weight_loss_pct':return round(max(0,(i['previous_weight_kg']-i['current_weight_kg'])/i['previous_weight_kg']*100),1)
    if f=='safety.nice_refeeding_screen':
        major=i['bmi']<16 or i['weight_loss_pct']>15 or i['low_intake_days']>10 or i['electrolytes']=='low'
        minors=sum([i['bmi']<18.5,i['weight_loss_pct']>10,i['low_intake_days']>5,i['additional_factors']=='yes'])
        extreme=i['bmi']<14 or i['low_intake_days']>15
        return {'highRisk':bool(extreme or major or minors>=2),'extremeRisk':bool(extreme)}
    if f=='energy.mifflin_st_jeor':return 10*i['weight_kg']+6.25*i['height_cm']-5*i['age_years']+(5 if i['sex']=='male' else -161)
    if f=='energy.ordinary_pal':
        b=10*i['weight_kg']+6.25*i['height_cm']-5*i['age_years']+(5 if i['sex']=='male' else -161);lo=jsround(b*PAL[i['activity']]*i['state_factor']);return {'low':lo,'high':jsround(lo*1.1)}
    if f=='energy.weight_screen':
        k,s=STATE[i['state']];scale=max(.9,PAL[i['activity']]/1.35);lo=jsround(k*i['weight_kg']*scale*s);return {'low':lo,'high':jsround(k*i['weight_kg']*scale*s*1.15)}
    if f=='energy.goal_factor':return {'maintain':1,'lose':.85,'gain':1.1,'rehab_gain':1.1}[i['goal']]
    if f=='protein.ordinary_target':
        cfg=PROT[i['state']];x=cfg[i['activity']]
        if i['state'] in ('normal','elderly'):x+=.1 if i['goal'] in ('lose','gain') else .15 if i['goal']=='rehab_gain' else 0
        if i['age']>=65:x=max(x,1 if i['state']=='normal' and i['goal']=='maintain' else 1.2)
        return round(max(cfg['floor'],min(cfg['cap'],x)),2)
    if f=='macros.fat_share':return round(i['energy_kcal']*i['fat_percent']/100/9,1)
    if f=='macros.carb_residual':return round(max(0,(i['energy_kcal']-i['protein_g']*4-i['fat_g']*9)/4),1)
    if f=='fluids.ordinary_screen':return jsround(i['fluid_ml_per_kg']*i['weight_kg'])
    if f=='meals.energy_split':return [jsround(i['daily_target']*x/100) for x in i['percentages']]
    if f=='energy.nasem_adult_female_2023':return adult(i['pal'],i['age_years'],i['height_cm'],i['weight_kg'])
    if f=='energy.nasem_pregnancy_2023':
        if i['gestation_week']<=13:return {'target':jsround(adult(i['pal'],i['age_years'],i['height_cm'],i['current_weight_kg'])),'deposition':0,'trimester':1}
        a,h,w,wk=i['age_years'],i['height_cm'],i['current_weight_kg'],i['gestation_week']; pal=i['pal']
        base={'inactive':1131.20-2.04*a+.34*h+12.15*w+9.16*wk,'low_active':693.35-2.04*a+5.73*h+10.2*w+9.16*wk,'active':-223.84-2.04*a+13.23*h+8.15*w+9.16*wk,'very_active':-779.72-2.04*a+18.45*h+8.73*w+9.16*wk}[pal]
        b=i['prepreg_weight_kg']/(h/100)**2;dep=300 if b<18.5 else 150 if b<30 and b>=25 else -50 if b>=30 else 200
        return {'target':jsround(max(0,base+dep)),'deposition':dep,'trimester':2 if wk<=27 else 3}
    if f=='energy.nasem_lactation_2023':
        inc=404 if i['postpartum_month']<=6 and i['feeding']=='exclusive' else 380
        return {'target':jsround(adult(i['pal'],i['age_years'],i['height_cm'],i['current_weight_kg'])+inc),'increment':inc}
    if f=='product.per100_scaling':return i['per100_value']*i['grams']/100
    if f=='product.salt_to_sodium':return i['salt_g']*393
    if f=='ration.nutrient_sum':return sum(i['values'])
    if f=='norm.per_mj':return round(i['energy_kcal']*4.184/1000*i['value_per_mj'],2)
    if f=='norm.percent_energy_to_grams':return round(i['energy_kcal']*i['percent']/100/i['kcal_per_g'],2)
    if f=='protein.efsa_pregnancy':return .83*i['prepreg_weight_kg']+(1 if i['gestation_week']<=13 else 9 if i['gestation_week']<=27 else 28)
    if f=='protein.efsa_lactation':return .83*i['current_weight_kg']+(19 if i['postpartum_month']<=6 else 13)
    if f=='hei.density':return i['component_amount']*1000/i['energy_ref_kcal']
    if f=='hei.adequacy_component':std,pts=ADEQ[i['component']];return lerp(0,std,i['density'],0,pts)
    if f=='hei.moderation_component':good,bad,pts=MOD[i['component']];return pts if i['density']<=good else 0 if i['density']>=bad else lerp(bad,good,i['density'],0,pts)
    if f=='hei.fatty_acid_ratio':return lerp(1.2,2.5,i['ratio'],0,10)
    if f=='hei.total':return sum(i['component_points'])
    raise KeyError(f)
def same(a,b,t):
    if isinstance(a,dict):return set(a)==set(b) and all(same(a[k],b[k],t) for k in a)
    if isinstance(a,list):return len(a)==len(b) and all(same(x,y,t) for x,y in zip(a,b))
    if a is None or isinstance(a,bool) or isinstance(a,str):return a==b
    return close(a,b,t)
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--json-out');ap.add_argument('--csv-out',default='NUTRITION_CALCULATOR_V5_3_210_P1_4_FORMULA_COVERAGE.csv');a=ap.parse_args()
    reg=json.loads(REG.read_text());cases=json.loads(CASES.read_text())['cases'];fails=[]
    for c in cases:
        actual=eval_case(c)
        if not same(actual,c['expected'],c.get('tolerance',1e-9)):fails.append({'case_id':c['case_id'],'formula_id':c['formula_id'],'expected':c['expected'],'actual':actual})
    by=defaultdict(list)
    for c in cases:by[c['formula_id']].append(c)
    rows=[]
    for f in reg['formulas']:
        impl=[]
        for b in f['implementation']:
            rel=b.split('::')[0];impl.append((ROOT/rel).exists())
        rows.append({'formula_id':f['id'],'title_ru':f['title_ru'],'kind':f['kind'],'source_count':len(f['source_ids']),'golden_cases':len(by[f['id']]),'boundary_cases':sum('boundary' in x.get('tags',[]) for x in by[f['id']]),'implementations':len(f['implementation']),'implementation_files_present':all(impl),'status':f['status']})
    needs=(ROOT/'assets/js/04-needs-norms.js').read_text();old=(ROOT/'assets/js/14-protein-formula-tests.js').read_text()
    findings=[]
    if needs.count('window.NutritionNeedsFormulaQA =')!=1:findings.append('QA surface is assigned more than once')
    if re.search(r'function\s+energyByMifflin\s*\(',needs):findings.append('dead duplicate energyByMifflin remains')
    if 'expected:1.75' in old or "state:'ckd'" in old:findings.append('stale protein diagnostic remains')
    if any('legacy/js/05-protected' in b for f in reg['formulas'] for b in f['implementation']):findings.append('legacy fail-closed runtime falsely claims protected equations')
    result={'ok':not fails and not findings,'registry_version':reg['registry_version'],'formulas':len(reg['formulas']),'golden_cases':len(cases),'independent_cases_passed':len(cases)-len(fails),'independent_cases_failed':len(fails),'failures':fails,'findings':findings,'formula_kinds':dict(Counter(f['kind'] for f in reg['formulas'])),'local_policy_formulas':[f['id'] for f in reg['formulas'] if f['kind']=='LOCAL_POLICY'],'authoritative_formulas':[f['id'] for f in reg['formulas'] if f['kind']=='AUTHORITATIVE'],'coverage_complete':all(len(by[f['id']])>=2 for f in reg['formulas'] if f['golden_case_required'])}
    out=ROOT/a.csv_out
    with out.open('w',newline='',encoding='utf-8-sig') as fh:
        w=csv.DictWriter(fh,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if a.json_out:
        p=ROOT/a.json_out;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    raise SystemExit(0 if result['ok'] else 1)
if __name__=='__main__':main()
