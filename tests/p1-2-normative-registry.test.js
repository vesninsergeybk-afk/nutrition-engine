#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const assertions=[];
function check(name,ok,detail){assertions.push({name,ok:!!ok,detail:detail||''});if(!ok)console.error('FAIL',name,detail||'');}
const raw=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/data/normative-registry.v5.3.210-p1.2.json'),'utf8'));
const src=fs.readFileSync(path.join(ROOT,'assets/data/normative-registry.v5.3.210-p1.2.js'),'utf8');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(src,ctx);const R=ctx.window.NutritionNormativeRegistry;
check('registry loaded',!!R);
check('registry version',R.version==='v5.3.210-p1.2',R.version);
check('registry self-audit',R.audit().ok,JSON.stringify(R.audit()));
check('registry content hash exposed',R.sourceSha256===R.audit().registrySha256&&/^[a-f0-9]{64}$/.test(R.sourceSha256),R.sourceSha256);
check('all sources official metadata',Object.values(raw.sources).every(x=>x.publisher&&x.kind&&x.url&&x.reviewed_at));
function near(a,b,e=.02){return Math.abs(Number(a)-Number(b))<=e;}
let x=R.resolveMicro('iron_mg','us',{age:30,sex:'female',energyKcal:2000});
check('US adult female iron 18',x.min.value===18,JSON.stringify(x));
check('adult provenance complete',x.provenance.registryVersion===R.version&&x.provenance.registrySha256===R.sourceSha256&&x.provenance.ruleId&&x.provenance.sourceIds.length>0,JSON.stringify(x.provenance));
x=R.resolveMicro('calcium_mg','us',{age:60,sex:'female'});check('US female 51+ calcium 1200',x.min.value===1200,JSON.stringify(x));
x=R.resolveMicro('vitamin_b6_mg','eu',{age:30,sex:'female'});check('EU B6 UL corrected 12.5',x.ul.value===12.5,JSON.stringify(x));
x=R.resolveMicro('vitamin_b1_mg','eu',{age:30,sex:'female',energyKcal:2000});check('EU B1 energy formula',near(x.min.value,.84),JSON.stringify(x));
x=R.resolveMicro('vitamin_b3_mg','eu',{age:30,sex:'female',energyKcal:2000});check('EU niacin energy formula',near(x.min.value,13.39),JSON.stringify(x));
x=R.resolveMicro('vitamin_b1_mg','eu',{age:30,sex:'female'});check('energy formula fail-closed without energy',x.min.value===null&&x.min.formula_label&&x.min.requires.includes('energyKcal'),JSON.stringify(x));
x=R.resolveMicro('calcium_mg','us',{age:5,sex:'female'});check('RU child calcium source',x.min.value===900&&x.provenance.sourceIds[0]==='ru_mr_2_3_1_0253_21',JSON.stringify(x));
let p=R.resolveLifeStageProfile({region:'us',stage:'pregnancy',age:30,prepregWeight:60,gestationWeek:20});
check('US pregnancy complete',p._coverageSummary.complete&&p._coverageSummary.verified===26,JSON.stringify(p._coverageSummary));
check('US pregnancy sodium',p.sodium_mg.value===1500,JSON.stringify(p.sodium_mg));
check('US pregnancy provenance',p.iron_mg.provenance.sourceIds.length>0&&p.iron_mg.provenance.registryVersion===R.version);
p=R.resolveLifeStageProfile({region:'eu',stage:'pregnancy',age:30,prepregWeight:60,gestationWeek:20});
check('EU pregnancy protein formula',near(p.protein_g.value,58.8,.1),JSON.stringify(p.protein_g));
check('EU pregnancy subset explicit',!p._coverageSummary.complete&&p._coverageSummary.unavailable>0,JSON.stringify(p._coverageSummary));
p=R.resolveLifeStageProfile({region:'eu',stage:'lactation',age:30,currentWeight:60,postpartumMonth:3});
check('EU lactation potassium 4000',p.potassium_mg.value===4000,JSON.stringify(p.potassium_mg));
let d=R.resolveDerived('sfa_g',{energyKcal:2000});check('SFA 10 percent derived',near(d.value,22.22),JSON.stringify(d));
d=R.resolveDerived('added_sugars_g',{energyKcal:2000});check('added sugar proxy 10 percent',d.value===50,JSON.stringify(d));
const protectedSrc=fs.readFileSync(path.join(ROOT,'assets/js/05-protected-modes-v5.3.210.js'),'utf8');
check('protected targets delegated',protectedSrc.includes('resolveLifeStageProfile'));
check('old pregnancy nutrient table removed',!protectedSrc.includes("protein_g:{value:71"));
check('registry review gate present',R.reviewDueAt==='2027-07-18',R.reviewDueAt);
const appSrc=fs.readFileSync(path.join(ROOT,'assets/js/03-app-core-v5.3.208.js'),'utf8');
check('adult hardcoded maps removed',!appSrc.includes('var usMin=')&&!appSrc.includes('var euMin='));
check('inline child table retired',/id="age_rda_table" type="application\/json">\[\]<\/script>/.test(fs.readFileSync(path.join(ROOT,'index.html'),'utf8')));
const legacyJs=fs.readFileSync(path.join(ROOT,'assets/legacy/data/normative-registry.v5.3.210-p1.2.js'));
check('modern legacy registry identical',legacyJs.equals(fs.readFileSync(path.join(ROOT,'assets/data/normative-registry.v5.3.210-p1.2.js'))));
for(const [region,buckets] of Object.entries(raw.adult_rules))for(const [key,b] of Object.entries(buckets)){
 check(`source adult ${region} ${key}`,b.min_rules.every(r=>r.source_ids&&r.source_ids.every(id=>raw.sources[id])));
}
const noReg={console,document:{readyState:'complete',getElementById:()=>null,addEventListener:()=>{}},Date,Math,Number,String,Object,Array,JSON,RegExp,Map,Set,Promise};noReg.window=noReg;noReg.globalThis=noReg;noReg.addEventListener=()=>{};noReg.State={getRegion:()=> 'us'};vm.createContext(noReg);vm.runInContext(protectedSrc,noReg);const blocked=noReg.ProtectedModesP03.evaluate({state:'normal',guardrail:'pregnancy',sex:'female',age:30,nasemPal:'low_active',gestationWeek:20,prepregWeight:60,fetusCount:'singleton',pregnancyComplications:'none',height:165,currentWeight:68});check('life stage fails closed without registry',blocked.calculationAllowed===false&&blocked.errors.some(x=>/Нормативный реестр/.test(x)),JSON.stringify(blocked.errors));
const failed=assertions.filter(x=>!x.ok);console.log(JSON.stringify({ok:failed.length===0,assertions:assertions.length,failed:failed.length,registryVersion:R.version},null,2));
process.exit(failed.length?1:0);
