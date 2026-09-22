#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function clean(u){return u.split('?')[0].replace(/^\.\//,'');}
let failed=0, assertions=0;
function assert(ok,msg){assertions++;if(!ok){failed++;console.error('FAIL:',msg);}else console.log('PASS:',msg);}
const runtime=JSON.parse(read('config/runtime-assets.v5.3.210-rc2.json'));
const fs23=runtime.fast_start||{};
const modern='assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf23.js';
const legacy='assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf23.js';
const media='assets/js/62-gemini-ration-import-v5.js';
const js=read(modern), legacyJs=read(legacy), index=read('index.html');
const criticalM=(fs23.critical_shell_sources&&fs23.critical_shell_sources.modern||[]).map(clean);
const criticalL=(fs23.critical_shell_sources&&fs23.critical_shell_sources.legacy||[]).map(clean);
const deferredM=(fs23.deferred_runtime_sources&&fs23.deferred_runtime_sources.modern||[]).map(clean);
const deferredL=(fs23.deferred_runtime_sources&&fs23.deferred_runtime_sources.legacy||[]).map(clean);
assert(runtime.release_version==='v5.3.210-rc2-hf23-media-entry-fix','runtime version is HF23 media entry fix');
assert(criticalM.includes(modern)&&criticalL.includes(legacy),'HF23 entry controller is in both critical shells');
assert(criticalM.includes(media)&&criticalL.includes(media),'Gemini media module is available in both critical shells');
assert(!deferredM.includes(media)&&!deferredL.includes(media),'Gemini media module is not duplicated in deferred runtime');
assert(js===legacyJs,'modern and compatibility entry controllers are byte-identical');
assert(index.includes('runtime-manifest-v5.3.210-rc2-hf23.js'),'index loads HF23 runtime manifest');
assert(index.includes('data-performance-release="hf23-media-entry-fix"'),'index declares HF23 performance release');
assert(js.includes("target.click()"),'photo and audio shortcuts forward the trusted click synchronously');
assert(js.includes("NutritionGeminiRationImport.startLiveRecording()"),'voice shortcut starts recording directly');
assert(js.includes("if(target.disabled)return"),'disabled media controls remain protected');
assert(js.includes('Нажатие сразу открывает выбор фотографии'),'visible copy describes one-click behavior');
assert(!js.includes('separate visible click inside AI block'),'obsolete two-click contract is absent');
assert(js.includes('geminiRationChoosePhotos')&&js.includes('geminiRationRecordAudio')&&js.includes('geminiRationChooseAudio'),'all media entry targets remain mapped');
assert(read('assets/runtime/critical-shell-v5.3.210-rc2-hf23.js').includes('NutritionGeminiRationImport'),'generated critical bundle contains media implementation');
assert(!read('assets/runtime/deferred-runtime-v5.3.210-rc2-hf23.js').includes('var VERSION=\'v5.3.210-p1.2\';'),'generated deferred bundle does not contain the media implementation marker');
console.log(JSON.stringify({ok:failed===0,assertions,failed}));
process.exit(failed?1:0);
