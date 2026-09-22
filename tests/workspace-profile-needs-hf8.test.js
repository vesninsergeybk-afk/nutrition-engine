const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'config/runtime-assets.v5.3.210-rc2.json'),'utf8'));
const nav=fs.readFileSync(path.join(ROOT,'assets/js/75-navigation-shell-v5.3.210-rc2-hf11.js'),'utf8');
const profile=fs.readFileSync(path.join(ROOT,'assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'assets/css/workspace-profile-needs-v5.3.210-rc2-hf8.css'),'utf8');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name);}catch(error){console.error('FAIL',name,error.message);process.exitCode=1;}}
check('profile is a dedicated route before ration',()=>assert.ok(nav.includes("profile:{")&&nav.includes("hash:'#profile'")&&nav.includes("ids:['workspaceProfilePanel','needsCompact']")));
check('ration no longer owns needs section',()=>{const ration=nav.slice(nav.indexOf('ration:{'),nav.indexOf("'analysis/overview':{"));assert.ok(!ration.includes('needsCompact'));});
check('fresh session defaults to profile but explicit deep links remain valid',()=>assert.ok(nav.includes("return needsReady()?saved:'profile'")&&nav.includes('if(explicit)return explicit')));
check('person name is neutral and uses Russian template',()=>assert.ok(html.includes('Имя или ФИО (необязательно)')&&html.includes('placeholder="Иван Иванов"')&&!html.includes('placeholder="Анна"')));
check('profile module reuses calculated needs metadata',()=>assert.ok(profile.includes('__lastNeedsProfileApplied')&&profile.includes('__lastNeedsMeta')&&!profile.includes('Mifflin')));
check('three-step sequence is explicit',()=>['data-profile-step="profile"','data-profile-step="needs"','data-profile-step="ration"'].forEach(x=>assert.ok(profile.includes(x))));
check('completed profile exposes a clear transition to ration',()=>assert.ok(profile.includes('workspaceProfileNext')&&profile.includes('data-workspace-route="ration"')));
check('current person and targets remain visible in work areas',()=>assert.ok(profile.includes('workspacePersonContext')&&profile.includes('energyTarget')&&profile.includes('fluidMl')));
check('mobile setup does not compete with bottom navigation',()=>assert.ok(css.includes('[data-navigation-route="profile"] #navigationShell{display:none!important}')));
check('runtime includes profile module in modern and legacy paths',()=>{
 assert.ok(cfg.modern_core_scripts.includes('./assets/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18'));
 assert.ok(cfg.legacy_core_scripts.includes('./assets/legacy/js/81-workspace-profile-needs-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18'));
});
check('runtime includes profile CSS and self-test',()=>{
 assert.ok(cfg.css_sources.includes('assets/css/workspace-profile-needs-v5.3.210-rc2-hf8.css'));
 assert.ok(cfg.selftest_scripts.includes('./assets/js/82-workspace-profile-needs-selftest-v5.3.210-rc2-hf18.js?v=v5.3.210-rc2-hf18'));
});
check('calculation core is not duplicated',()=>assert.ok(!profile.includes('calculateBmr')&&!profile.includes('calculateNeeds')&&!profile.includes('HEI2020')));
if(!process.exitCode)console.log(`workspace profile HF18: ${passed}/12 checks passed`);
