const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'config/runtime-assets.v5.3.210-rc2.json'),'utf8'));
const nav=fs.readFileSync(path.join(ROOT,'assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js'),'utf8');
const slice=fs.readFileSync(path.join(ROOT,'assets/js/77-workspace-ration-overview-v5.3.210-rc2-hf15.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'assets/css/workspace-ration-overview-v5.3.210-rc2-hf8.css'),'utf8');
let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name);}catch(error){console.error('FAIL',name,error.message);process.exitCode=1;}}
check('overview is a dedicated workspace view',()=>assert.ok(nav.includes("'analysis/overview':{")&&nav.includes("ids:['workspaceOverviewPanel']")));
check('route isolation survives late hidden changes',()=>assert.ok(nav.includes('scheduleVisibilityGuard')&&nav.includes("attributeFilter:['hidden','aria-hidden']")));
check('dynamic workspace panels can register safely',()=>assert.ok(nav.includes('registerManaged:registerManaged')&&nav.includes('registerManaged(id,originalHidden)')));
check('slice does not clone calculation blocks',()=>assert.ok(!slice.includes('cloneNode(')&&slice.includes('w.__lastDietAssessment')&&slice.includes('rationKpiStrip')));
check('ration summary and concise overview are created',()=>['workspaceRationInlineSummary','workspaceRationEmpty','workspaceRationSecondary','workspaceOverviewPanel'].forEach(id=>assert.ok(slice.includes(id))));
check('overview shows no more than five priorities',()=>assert.ok(slice.includes('priorityIssues(kpi).slice(0,5)')));
check('incomplete ration does not repeat all low macros',()=>assert.ok(slice.includes('energyRatio<.7)return out')));
check('workspace skip links follow profile and ration context',()=>assert.ok(slice.includes("current==='profile'")&&slice.includes("first.setAttribute('href','#globalSearchSection')")));
check('secondary input stays collapsed by default',()=>assert.ok(css.includes(':not([data-workspace-secondary-open]) #geminiRationImportSection')));
check('mobile layout keeps one workspace column',()=>assert.ok(css.includes('display:flex!important;flex-direction:column!important')));
check('runtime includes accepted shell and HF15 ration slice in both paths',()=>{
 assert.ok(cfg.modern_core_scripts.includes('./assets/js/75-navigation-shell-v5.3.210-rc2-hf17.js?v=v5.3.210-rc2-hf17'));
 assert.ok(cfg.modern_core_scripts.includes('./assets/js/77-workspace-ration-overview-v5.3.210-rc2-hf15.js?v=v5.3.210-rc2-hf15'));
 assert.ok(cfg.legacy_core_scripts.includes('./assets/legacy/js/77-workspace-ration-overview-v5.3.210-rc2-hf15.js?v=v5.3.210-rc2-hf15'));
});
check('runtime has dedicated self-test',()=>assert.ok(cfg.selftest_scripts.includes('./assets/js/78-workspace-ration-overview-selftest-v5.3.210-rc2-hf8.js?v=v5.3.210-rc2-hf8')));
if(!process.exitCode)console.log(`workspace HF8: ${passed}/12 checks passed`);
