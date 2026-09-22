'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'quality/stage-4-5-architecture-contract.json'),'utf8'));
const nav=fs.readFileSync(path.join(ROOT,'assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js'),'utf8');
const profile=fs.readFileSync(path.join(ROOT,'assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js'),'utf8');
const report=fs.readFileSync(path.join(ROOT,'assets/js/87-workspace-report-v5.3.210-rc2-hf14.js'),'utf8');
const navCss=fs.readFileSync(path.join(ROOT,'assets/css/navigation-shell-v5.3.210-rc2-hf17.css'),'utf8');
const reportCss=fs.readFileSync(path.join(ROOT,'assets/css/workspace-report-v5.3.210-rc2-hf14.css'),'utf8');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'config/runtime-assets.v5.3.210-rc2.json'),'utf8'));
const gate=fs.readFileSync(path.join(ROOT,'tools/release_gate.py'),'utf8');
let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name);}catch(error){console.error('FAIL',name,error.message);process.exitCode=1;}}
function esc(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function routeIds(route){
  const key=route.includes('/')?"'"+route+"'":route;
  const match=nav.match(new RegExp(esc(key)+':\\{[\\s\\S]*?ids:\\[([^\\]]*)\\]'));
  assert.ok(match,'route not found: '+route);
  return [...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
}
function hiddenIds(){
  const match=nav.match(/WORKSPACE_HIDDEN_IDS=\[([^\]]*)\]/);
  assert.ok(match,'WORKSPACE_HIDDEN_IDS not found');
  return [...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
}
check('contract is versioned for stage 4.5',()=>{assert.equal(contract.schema_version,1);assert.equal(contract.release_version,'v5.3.210-rc2-hf14');});
check('all seven routes are contractually fixed',()=>assert.deepEqual(contract.routes.map(x=>x.route),['profile','ration','analysis/overview','analysis/nutrients','analysis/hei','correction','report']));
check('runtime route ownership exactly matches the contract',()=>contract.routes.forEach(row=>assert.deepEqual(routeIds(row.route),row.owns,row.route)));
check('owned blocks have one route owner',()=>{const owners={};contract.routes.forEach(row=>row.owns.forEach(id=>{assert.ok(!owners[id],id+' also owned by '+owners[id]);owners[id]=row.route;}));});
check('forbidden blocks never leak into their route',()=>contract.routes.forEach(row=>row.forbids.forEach(id=>assert.ok(!routeIds(row.route).includes(id),row.route+' contains '+id))));
check('needs and anthropometric form belong only to profile',()=>{assert.deepEqual(routeIds('profile'),['workspaceProfilePanel','needsCompact']);contract.routes.filter(x=>x.route!=='profile').forEach(x=>assert.ok(!routeIds(x.route).includes('needsCompact')));});
check('ration owns editing without owning the needs form',()=>{const ids=routeIds('ration');assert.ok(ids.includes('globalSearchSection')&&ids.includes('rationSection'));assert.ok(!ids.includes('needsCompact'));});
check('analysis is split into three isolated views',()=>{assert.deepEqual(routeIds('analysis/overview'),['workspaceOverviewPanel']);assert.deepEqual(routeIds('analysis/nutrients'),['workspaceNutrientsPanel']);assert.deepEqual(routeIds('analysis/hei'),['workspaceHeiPanel']);});
check('correction has one dedicated workspace',()=>assert.deepEqual(routeIds('correction'),['workspaceCorrectionPanel']));
check('report route cannot fall back to the old report DOM',()=>{assert.deepEqual(routeIds('report'),['workspaceReportPanel']);assert.ok(!routeIds('report').includes('globalActions'));assert.ok(nav.includes("WORKSPACE_HIDDEN_IDS=['rc1BetaSupport','geminiAiSection','globalActions','legal-note']"));});
check('global hidden list matches the contract',()=>assert.deepEqual(hiddenIds(),contract.always_hidden_in_workspace));
check('context is a summary and not a transferred function',()=>{contract.contextual_summaries.forEach(item=>contract.routes.forEach(row=>assert.ok(!routeIds(row.route).includes(item.id))));assert.ok(profile.includes('workspacePersonContext')&&profile.includes('data-workspace-route="profile"'));});
check('full journey can return from report to profile and recalculate',()=>{assert.ok(profile.includes("setText(byId('workspacePersonEdit'),m?'Изменить профиль':'Рассчитать')"));assert.ok(profile.includes("data-workspace-route=\"profile\""));assert.ok(nav.includes("history.pushState")&&nav.includes("addEventListener('popstate'"));});
check('inactive managed sections are hidden from assistive technology',()=>{assert.ok(nav.includes('function applyManagedState('));assert.ok(nav.includes('if(el.hidden!==hidden)el.hidden=hidden'));assert.ok(nav.includes("if(el.getAttribute('aria-hidden')!=='true')el.setAttribute('aria-hidden','true')"));assert.ok(nav.includes('applyManagedState(el,!visible[id],!!visible[id])'));assert.ok(navCss.includes('.navshell-managed:not(.navshell-route-visible){display:none!important}'));});
check('all required viewport sizes are fixed in the contract',()=>assert.deepEqual(contract.viewports.map(x=>[x.width,x.height]),[[360,800],[390,844],[430,932],[768,1024],[1366,768],[1440,900]]));
check('narrow header and technical fallback are bounded without the retired switcher',()=>{assert.ok(navCss.includes('grid-template-columns:minmax(0,1fr);gap:8px;align-items:start'));assert.ok(navCss.includes('navigation-shell-long-return'));assert.ok(!navCss.includes('.navigation-shell-mode-switcher'));});
check('mobile keeps one bottom navigation and no mini-cart layer',()=>{assert.ok(navCss.includes('position:fixed'));assert.ok(navCss.includes('grid-template-columns:repeat(4'));assert.ok(navCss.includes('#v40MiniCart{display:none!important}'));});
check('screen print and popup PDF protect long names and table rows',()=>{for(const source of [reportCss,report]){assert.ok(source.includes('overflow-wrap:anywhere'));assert.ok(source.includes('table-layout:fixed'));assert.ok(source.includes('display:table-header-group'));assert.ok(source.includes('page-break-inside:avoid'));}});
check('HF13 report calculations remain unchanged in the accepted controller',()=>{assert.ok(report.includes("SCHEMA='nutrition-workspace-report-v1'"));assert.ok(!report.includes('calculateFromSnapshot('));assert.ok(cfg.modern_core_scripts.some(x=>x.includes('87-workspace-report-v5.3.210-rc2-hf14.js')));});
check('HF18 runtime preserves the accepted stage 4.5 ownership and report assets',()=>{assert.equal(cfg.release_version,'v5.3.210-rc2-hf18');assert.ok(cfg.css_sources.includes('assets/css/navigation-shell-v5.3.210-rc2-hf17.css'));assert.ok(cfg.css_sources.includes('assets/css/workspace-report-v5.3.210-rc2-hf14.css'));assert.ok(!cfg.css_sources.includes('assets/css/navigation-shell-v5.3.210-rc2-hf14.css'));});
check('release gate includes static and browser stage 4.5 scenarios',()=>{assert.ok(gate.includes("stage_4_5_architecture_acceptance"));assert.ok(gate.includes("stage-4-5-architecture-acceptance.spec.js"));});
check('stage 5A keeps the stage 4.5 fallback reversible without a user architecture switcher',()=>{assert.ok(nav.includes('restoreLongPage()'));assert.ok(nav.includes('data-navshell-return-workspace'));assert.ok(nav.includes('returnToWorkspace'));assert.ok(!nav.includes('createModeSwitcher()'));});
if(!process.exitCode)console.log(`stage 4.5 architecture acceptance: ${passed}/22 checks passed`);
