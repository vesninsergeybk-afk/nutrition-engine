const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'config/runtime-assets.v5.3.210-rc2.json'),'utf8'));
const nav=fs.readFileSync(path.join(ROOT,'assets/js/75-navigation-shell-v5.3.210-rc2-hf11.js'),'utf8');
const moduleJs=fs.readFileSync(path.join(ROOT,'assets/js/79-workspace-analysis-detail-v5.3.210-rc2-hf7.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'assets/css/workspace-analysis-detail-v5.3.210-rc2-hf7.css'),'utf8');
let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name);}catch(error){console.error('FAIL',name,error.message);process.exitCode=1;}}
check('nutrient and HEI routes use dedicated panels',()=>{
 assert.ok(nav.includes("ids:['workspaceNutrientsPanel']"));
 assert.ok(nav.includes("ids:['workspaceHeiPanel']"));
});
check('analysis module does not clone legacy result blocks',()=>assert.ok(!moduleJs.includes('cloneNode(')&&moduleJs.includes('NutritionCalculationCore')&&moduleJs.includes('HEI2020InputAdapterV2')));
check('nutrients use canonical per-item contributions',()=>assert.ok(moduleJs.includes('calcCore.scaledPerItem(item)')&&moduleJs.includes('aggregateContributors')));
check('HEI contributors use canonical adapter',()=>assert.ok(moduleJs.includes('adapter.adapt([item],db)')&&moduleJs.includes('aggregateHeiContributors')));
check('incomplete ration suppresses premature micronutrient ranking',()=>assert.ok(moduleJs.includes("completion<.7&&row.key!=='kcal'")&&moduleJs.includes("code:'provisional'")));
check('missing values are not silently treated as complete coverage',()=>assert.ok(moduleJs.includes('own(scaled,key)')&&moduleJs.includes('row.coverage.covered<row.coverage.total')));
check('HEI and independent guardrails stay separate',()=>assert.ok(moduleJs.includes('buildGuardrails')&&moduleJs.includes('Отдельно от общего индекса')));
check('filters cover status and meaningful groups',()=>['data-nutrient-filter','data-nutrient-group','data-hei-filter','data-hei-group'].forEach(x=>assert.ok(moduleJs.includes(x))));
check('component scale preserves real points and normalized percent',()=>assert.ok(moduleJs.includes('баллов</strong>')&&moduleJs.includes('% собственного максимума')));
check('mobile detail layout has no wide-table dependency',()=>assert.ok(css.includes('@media (max-width:680px)')&&css.includes('.workspace-analysis-group__rows{grid-template-columns:1fr}')));
check('large result sets use explicit pagination',()=>assert.ok(moduleJs.includes('function paginate(')&&moduleJs.includes('data-nutrient-page')&&moduleJs.includes('data-hei-page')&&css.includes('.workspace-analysis-pager')));
check('deep links render their target before navigation scroll restoration',()=>assert.ok(moduleJs.includes("selectedNutrientKey=key;refresh(true)")&&moduleJs.includes("selectedHeiKey=target.replace('workspaceHeiRow-','');refresh(true)")));
check('guardrail identifiers map to real nutrient rows',()=>assert.ok(moduleJs.includes("saturated_fat_general_limit:'sfa_g'")&&moduleJs.includes("added_sugars_general_limit:'added_sugars_g'")&&moduleJs.includes("sodium_absolute_limit:'sodium_mg'")));
check('HEI detail removes repeated labels and mechanical group wording',()=>assert.ok(moduleJs.includes('cleanHeiMeasure')&&moduleJs.includes("adequacy:'Основные группы рациона'")&&!moduleJs.includes(">Нужно набирать</button>")));
check('runtime includes modern and legacy analysis modules',()=>{
 assert.ok(cfg.modern_core_scripts.includes('./assets/js/79-workspace-analysis-detail-v5.3.210-rc2-hf7.js?v=v5.3.210-rc2-hf7'));
 assert.ok(cfg.legacy_core_scripts.includes('./assets/legacy/js/79-workspace-analysis-detail-v5.3.210-rc2-hf7.js?v=v5.3.210-rc2-hf7'));
});
check('runtime includes dedicated CSS and self-test',()=>{
 assert.ok(cfg.css_sources.includes('assets/css/workspace-analysis-detail-v5.3.210-rc2-hf7.css'));
 assert.ok(cfg.selftest_scripts.includes('./assets/js/80-workspace-analysis-detail-selftest-v5.3.210-rc2-hf8.js?v=v5.3.210-rc2-hf8'));
});
if(!process.exitCode)console.log(`workspace analysis HF7: ${passed}/16 checks passed`);
