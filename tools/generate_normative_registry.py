#!/usr/bin/env python3
from __future__ import annotations
import argparse, datetime as dt, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/data/normative-registry.v5.3.210-p1.2.json'
TARGETS=[ROOT/'assets/data/normative-registry.v5.3.210-p1.2.js',ROOT/'assets/legacy/data/normative-registry.v5.3.210-p1.2.js']

def validate(d):
    errors=[]
    if d.get('schema_version')!='1.0.0': errors.append('schema_version')
    try:
        due=dt.date.fromisoformat(d.get('review_due_at',''))
        if dt.date.today()>due: errors.append('registry review overdue: '+str(due))
    except ValueError: errors.append('invalid review_due_at')
    sources=d.get('sources',{})
    if not sources: errors.append('sources empty')
    def check_sources(obj,path='root'):
        if isinstance(obj,dict):
            for k,v in obj.items():
                if k=='source_ids':
                    if not isinstance(v,list) or not v: errors.append(path+': empty source_ids')
                    for sid in v or []:
                        if sid not in sources: errors.append(path+': unknown source '+str(sid))
                else: check_sources(v,path+'.'+str(k))
        elif isinstance(obj,list):
            for i,v in enumerate(obj): check_sources(v,path+f'[{i}]')
    check_sources(d)
    for region in ('us','eu'):
        rules=d.get('adult_rules',{}).get(region,{})
        for key in d.get('nutrients',{}):
            if key not in rules: errors.append(f'missing adult {region} {key}')
            elif not rules[key].get('min_rules'): errors.append(f'missing min {region} {key}')
    if errors: raise SystemExit('normative registry invalid:\n'+'\n'.join(errors[:50]))

def js_text(d):
    payload=json.dumps(d,ensure_ascii=False,separators=(',',':'))
    source_sha=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    source_sha_js=json.dumps(source_sha)
    return r'''/* Generated normative registry v5.3.210-p1.2. Do not edit directly. */
(function(w){'use strict';
var DATA='''+payload+r''';
var SOURCE_SHA='''+source_sha_js+r''';
function finite(v){v=Number(v);return isFinite(v)?v:null;}
function clone(v){if(v==null)return v;return JSON.parse(JSON.stringify(v));}
function match(when,c){when=when||{};c=c||{};if(when.sex&&String(c.sex)!==String(when.sex))return false;var a=finite(c.age);if(when.age_min!=null&&(a==null||a<Number(when.age_min)))return false;if(when.age_max!=null&&(a==null||a>Number(when.age_max)))return false;return true;}
function select(rules,c){rules=rules||[];for(var i=0;i<rules.length;i++)if(match(rules[i].when,c))return rules[i];return null;}
function provenance(rule,ruleId){return {registryVersion:DATA.registry_version,registrySha256:SOURCE_SHA,reviewedAt:DATA.reviewed_at,reviewDueAt:DATA.review_due_at,ruleId:ruleId,sourceIds:(rule&&rule.source_ids||[]).slice()};}
function evaluateRule(rule,c,ruleId){if(!rule)return null;var out=clone(rule);delete out.when;var f=rule.formula||null;if(f){var value=null;if(f.kind==='per_mj_energy'){var kcal=finite(c&&c.energyKcal);if(kcal!=null)value=kcal*4.184/1000*Number(f.factor);}else if(f.kind==='percent_energy_to_grams'){var e=finite(c&&c.energyKcal);if(e!=null)value=e*Number(f.percent)/100/Number(f.kcal_per_g);}if(value!=null)out.value=Math.round(value*100)/100;else{out.value=null;out.requires=['energyKcal'];}}
out.provenance=provenance(rule,ruleId);return out;}
function profile(c,region){var age=finite(c&&c.age),sex=String(c&&c.sex||'male');return (region==='eu'?'ЕС · EFSA':'США · DRI')+' · '+(sex==='female'?'женщина':'мужчина')+' · '+(age!=null?Math.round(age)+' лет':'возраст не указан');}
function childRow(c){var age=finite(c&&c.age),sex=String(c&&c.sex||'male');if(age==null||age<1||age>=18)return null;var rows=DATA.pediatric_ru_rules||[];for(var i=0;i<rows.length;i++){var r=rows[i];if(age>=r.age_min&&age<=r.age_max&&(r.sex===sex||r.sex==='any'))return r;}return null;}
function resolveChild(key,c){var row=childRow(c);if(!row)return null;var n=row.norms&&row.norms[key];var base={min:null,ul:null,safe:null,basis:'МР 2.3.1.0253-21',profile:row.group+(row.sex==='male'?' · мальчики':row.sex==='female'?' · девочки':''),note:'',coverageStatus:n?'verified':'unavailable',provenance:{registryVersion:DATA.registry_version,reviewedAt:DATA.reviewed_at,ruleId:'pediatric_ru.'+row.age_min+'_'+row.age_max+'.'+row.sex+'.'+key,sourceIds:['ru_mr_2_3_1_0253_21']}};if(n)base.min={type:'Норма РФ',value:Number(n.value),provenance:base.provenance};else base.note='Для этого нутриента отдельный детский ориентир в текущем реестре не задан.';return base;}
function resolveAdult(key,region,c){region=region==='eu'?'eu':'us';var bucket=DATA.adult_rules[region]&&DATA.adult_rules[region][key];if(!bucket)return {min:null,ul:null,safe:null,basis:'реестр недоступен',profile:profile(c,region),note:'Норматив не найден.',coverageStatus:'unavailable',provenance:{registryVersion:DATA.registry_version,reviewedAt:DATA.reviewed_at,ruleId:'missing.'+region+'.'+key,sourceIds:[]}};var minRule=select(bucket.min_rules,c),ulRule=select(bucket.ul_rules,c),safeRule=select(bucket.safe_rules,c);var min=evaluateRule(minRule,c,'adult.'+region+'.'+key+'.min'),ul=evaluateRule(ulRule,c,'adult.'+region+'.'+key+'.ul'),safe=evaluateRule(safeRule,c,'adult.'+region+'.'+key+'.safe');var meta=DATA.nutrients[key]||{};return {min:min,ul:ul,safe:safe,basis:bucket.basis,profile:profile(c,region),note:meta.note||'',coverageStatus:min?'verified':'unavailable',provenance:provenance(minRule,'adult.'+region+'.'+key)};}
function resolveMicro(key,region,c){return resolveChild(key,c)||resolveAdult(key,region,c||{});}
function calcLifeItem(item,c,stage,key){var out=clone(item),f=item&&item.formula;if(f){var v=null;if(f.kind==='pregnancy_protein_efsa'){var wt=finite(c.prepregWeight),week=finite(c.gestationWeek),tr=week==null?null:(week<=13?1:week<=27?2:3);if(wt!=null&&tr!=null)v=Number(f.base_g_per_kg)*wt+Number(f.trimester_additions_g[String(tr)]);}else if(f.kind==='lactation_protein_efsa'){var cw=finite(c.currentWeight),m=finite(c.postpartumMonth);if(cw!=null&&m!=null)v=Number(f.base_g_per_kg)*cw+Number(m<=6?f.first_6_months_addition_g:f.later_addition_g);}else if(f.kind==='age_threshold'){var a=finite(c.age);if(a!=null)v=Number(a<=Number(f.threshold)?f.at_or_below:f.above);}if(v!=null)out.value=Math.round(v*10)/10;else{out.value=null;out.requires=['life_stage_inputs'];}}out.provenance=provenance(item,'life_stage.'+String(c.region)+'.'+stage+'.'+key);out.basis=String(out.type||'ориентир')+' · '+(out.provenance.sourceIds||[]).join(', ');return out;}
function resolveLifeStage(c){c=c||{};var region=c.region==='eu'?'eu':'us',stage=String(c.stage||'');var group=DATA.life_stage_profiles[region]||{},p;if(region==='us')p=group[stage+'_19_50'];else p=group[stage];if(!p)return null;var items={},coverage={},keys=(DATA.tracked_life_stage_keys||[]).slice();for(var i=0;i<keys.length;i++){var k=keys[i],raw=p.items&&p.items[k];if(raw){var it=calcLifeItem(raw,c,stage,k);if(it.value!=null){items[k]=it;coverage[k]={status:'verified',sourceId:(it.provenance.sourceIds||[])[0]||null,sourceIds:it.provenance.sourceIds,basis:it.basis};}else coverage[k]={status:'unavailable',sourceIds:it.provenance.sourceIds,note:'Для расчёта не хватает входных данных.'};}else coverage[k]={status:'unavailable',sourceIds:[],note:'Жизненное значение не подтверждено; взрослая норма не подставляется.'};}
var verified=Object.keys(coverage).filter(function(k){return coverage[k].status==='verified';});items._coverage=coverage;items._verifiedKeys=verified;items._coverageSummary={tracked:keys.length,verified:verified.length,unavailable:keys.length-verified.length,complete:verified.length===keys.length};items._constraints=clone(p.constraints||{});items._upperLimits=clone(p.upper_limits||{});items._lifeStage={region:region,stage:stage,completeness:verified.length===keys.length?'tracked_dri_complete':'verified_subset',registryVersion:DATA.registry_version,reviewedAt:DATA.reviewed_at,note:region==='us'?'US DRI жизненный профиль из централизованного реестра.':'Показан только проверенный поднабор EFSA; отсутствующие взрослые нормы не подставляются.'};return items;}
function resolveDerived(key,c){var rule=DATA.derived_guardrails[key];if(!rule)return null;return evaluateRule(rule,c||{},'derived.'+key);}
function getMicroLimitsMap(){var out={};Object.keys(DATA.nutrients).forEach(function(k){var m=DATA.nutrients[k];out[k]={title:m.title,unit:m.unit,note:m.note||'',min:{us:{type:'registry'},eu:{type:'registry'}},ul:null,registryManaged:true};});return out;}
function audit(){var errs=[],today=(new Date()).toISOString().slice(0,10),stale=!!(DATA.review_due_at&&today>DATA.review_due_at);Object.keys(DATA.adult_rules).forEach(function(r){Object.keys(DATA.nutrients).forEach(function(k){var b=DATA.adult_rules[r][k];if(!b||!b.min_rules||!b.min_rules.length)errs.push('missing:'+r+':'+k);});});return {ok:errs.length===0&&!stale,stale:stale,errors:errs,registryVersion:DATA.registry_version,registrySha256:SOURCE_SHA,reviewedAt:DATA.reviewed_at,reviewDueAt:DATA.review_due_at,sourceCount:Object.keys(DATA.sources).length,nutrientCount:Object.keys(DATA.nutrients).length};}
function deepFreeze(o){if(!o||typeof o!=='object'||!Object.freeze)return o;Object.keys(o).forEach(function(k){deepFreeze(o[k]);});try{Object.freeze(o);}catch(_){}return o;}deepFreeze(DATA);
var API={version:DATA.registry_version,schemaVersion:DATA.schema_version,sourceSha256:SOURCE_SHA,reviewedAt:DATA.reviewed_at,reviewDueAt:DATA.review_due_at,data:DATA,resolveMicro:resolveMicro,resolveAdult:resolveAdult,resolveLifeStageProfile:resolveLifeStage,resolveDerived:resolveDerived,getMicroLimitsMap:getMicroLimitsMap,getNutrientMeta:function(k){return clone(DATA.nutrients[k]||null);},getSource:function(id){return clone(DATA.sources[id]||null);},audit:audit};
try{if(Object.freeze)Object.freeze(API);}catch(_){}w.NutritionNormativeRegistry=API;
})(window);
'''

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    d=json.loads(SOURCE.read_text(encoding='utf-8'));validate(d);txt=js_text(d)
    changed=False
    for t in TARGETS:
        old=t.read_text(encoding='utf-8') if t.exists() else None
        if old!=txt: changed=True
        t.parent.mkdir(parents=True,exist_ok=True);t.write_text(txt,encoding='utf-8')
    result={'ok':True,'registry_version':d['registry_version'],'sources':len(d['sources']),'nutrients':len(d['nutrients']),'sha256':hashlib.sha256(txt.encode()).hexdigest(),'changed':changed}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if args.check and changed: raise SystemExit('generated normative registry was stale')
if __name__=='__main__': main()
