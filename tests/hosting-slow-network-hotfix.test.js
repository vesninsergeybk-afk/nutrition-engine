const fs=require('fs');
const assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const boot=fs.readFileSync(root+'/assets/js/00-runtime-bootstrap-v5.3.210.js','utf8');
const legacy=fs.readFileSync(root+'/assets/legacy/js/00-runtime-bootstrap-v5.3.210.legacy.js','utf8');
const gate=fs.readFileSync(root+'/assets/js/00-browser-compatibility-gate-v5.3.210.js','utf8');
const index=fs.readFileSync(root+'/index.html','utf8');
const checks=[
 ['product concurrency 4',/Math\.min\(4, urls\.length/.test(boot)],
 ['runtime concurrency 6',/Math\.min\(6, list\.length/.test(boot)],
 ['product timeout extended',boot.includes('120000')],
 ['runtime timeout extended',boot.includes('60000')],
 ['watchdog respects active bootstrap',gate.includes('!w.__PRODUCTS_READY__')],
 ['explicit fatal event',gate.includes('app:boot-fatal')&&boot.includes('app:boot-fatal')],
 ['cache key updated',index.includes('rc2-hf1')],
 ['legacy parity',legacy.includes('Math.min(4, urls.length')&&legacy.includes('Math.min(6, list.length')],
];
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);assert.ok(ok,name)}
console.log(JSON.stringify({status:'PASS',assertions:checks.length}));
