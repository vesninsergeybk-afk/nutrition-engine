const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
let assertions=0;
function check(name,fn){fn();assertions++;console.log('PASS',name);}
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'config/ux-decision-hierarchy.v5.3.210-p1.5.json'),'utf8'));
const runtime=JSON.parse(fs.readFileSync(path.join(ROOT,'config/runtime-assets.v5.3.210-rc1.json'),'utf8'));
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const legacyCss=fs.readFileSync(path.join(ROOT,'assets/css/ux-decision-hierarchy-v5.3.210-p1.5.css'),'utf8');
const correctionCss=fs.readFileSync(path.join(ROOT,'assets/css/product-correction-stabilization-v5.3.210-pc2.css'),'utf8');
const js=fs.readFileSync(path.join(ROOT,'assets/js/67-ux-decision-hierarchy-v5.3.210-pc2.js'),'utf8');
check('retained contract release version',()=>assert.equal(contract.release_version,'v5.3.210-p1.5'));
check('four-stage hierarchy',()=>assert.deepEqual(contract.stages.map(x=>x.id),['profile','ration','analysis','action']));
check('unique stage targets',()=>assert.equal(new Set(contract.stages.map(x=>x.target)).size,4));
for(const stage of contract.stages)check(`stage target exists ${stage.id}`,()=>assert.ok(html.includes(stage.target.slice(1))));
check('three explicit decision rules',()=>assert.equal(contract.decision_rules.length,3));
check('runtime release version',()=>assert.equal(runtime.release_version,'v5.3.210-rc1'));
check('P1.5 CSS retained before correction layer',()=>{const p=runtime.css_sources.indexOf('assets/css/ux-decision-hierarchy-v5.3.210-p1.5.css'),c=runtime.css_sources.indexOf('assets/css/product-correction-stabilization-v5.3.210-pc2.css');assert.ok(p>=0&&c>p)});
for(const branch of ['modern_core_scripts','legacy_core_scripts']){
  check(`${branch} loads UX contract`,()=>assert.ok(runtime[branch].some(x=>x.includes('ux-decision-hierarchy.v5.3.210-p1.5.js'))));
  check(`${branch} loads consolidated controller before validation`,()=>{const u=runtime[branch].findIndex(x=>x.includes('67-ux-decision-hierarchy-v5.3.210-pc2.js')),v=runtime[branch].findIndex(x=>x.includes('68-validation-readiness-v5.3.210-pc2.js'));assert.ok(u>=0&&v>u)});
}
check('HTML uses current bundle',()=>assert.ok(html.includes('runtime-bundle-v5.3.210-rc1.css')));
check('HTML uses current manifest',()=>assert.ok(html.includes('runtime-manifest-v5.3.210-rc1.js')));
check('legacy CSS hides duplicate workflow',()=>assert.ok(legacyCss.includes('.p15-ux-active .workflow-steps{display:none!important}')));
check('correction CSS guards incomplete daily HEI',()=>assert.ok(correctionCss.includes('.pc1-analysis-preliminary #p15CoreResults #heiPanel')));
check('correction CSS preserves print boundary',()=>assert.ok(correctionCss.includes('@media print')));
check('controller exposes PC2 audit API',()=>assert.ok(js.includes('NutritionProductCorrectionPC2={version:VERSION')));
check('controller retains PC1 and P1.5 aliases',()=>assert.ok(js.includes('NutritionProductCorrectionPC1=w.NutritionProductCorrectionPC2')&&js.includes('NutritionUxP15=w.NutritionProductCorrectionPC2')));
check('controller does not remove controls',()=>assert.ok(!/\.remove\(\)|removeChild\(/.test(js)));
check('controller requires explicit daily completion',()=>assert.ok(js.includes('pc1ConfirmComplete')&&js.includes("return isConfirmed()?'complete':'fragment'")));
check('controller uses bounded numeric HEI source',()=>assert.ok(js.includes('__lastHEIModel.total')&&js.includes('value<=100')));
for(const rel of ['assets/legacy/data/ux-decision-hierarchy.v5.3.210-p1.5.js','assets/legacy/js/67-ux-decision-hierarchy-v5.3.210-pc2.js'])check(`legacy UX artifact exists ${rel}`,()=>assert.ok(fs.existsSync(path.join(ROOT,rel))));
console.log(`P1.5/PC2 UX assertions: ${assertions}/${assertions} PASS`);
