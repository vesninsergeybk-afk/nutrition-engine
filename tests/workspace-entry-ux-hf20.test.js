#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
const runtime=JSON.parse(read('config/runtime-assets.v5.3.210-rc2.json'));
const modern='assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf20.js';
const legacy='assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf20.js';
const css='assets/css/workspace-entry-ux-v5.3.210-rc2-hf20.css';
const js=read(modern), legacyJs=read(legacy), styles=read(css), index=read('index.html');
assert(runtime.release_version==='v5.3.210-rc2-hf20','runtime version is HF20');
assert(runtime.modern_core_scripts.some(x=>x.split('?')[0].replace(/^\.\//,'')===modern),'modern HF20 controller is active');
assert(runtime.legacy_core_scripts.some(x=>x.split('?')[0].replace(/^\.\//,'')===legacy),'legacy HF20 controller is active');
assert(runtime.css_sources.includes(css),'HF20 stylesheet is active');
assert(js===legacyJs,'modern and compatibility controllers are identical');
assert(index.includes('runtime-manifest-v5.3.210-rc2-hf20.js'),'index loads HF20 runtime manifest');
assert(index.includes('Имя или ФИО (необязательно)'),'profile label uses natural wording');
assert(js.includes('data-workspace-view-mode="workspace"')&&js.includes('data-workspace-view-mode="long"'),'visible Sections/Canvas switch is created');
assert(js.includes('workspaceProfileBackAction')&&js.includes("navigate('profile')"),'ration has a direct return to profile');
assert(js.includes('Поиск или ИИ-распознавание')&&js.includes('geminiRationChoosePhotos')&&js.includes('geminiRationRecordAudio')&&js.includes('geminiRationChooseAudio'),'photo, recorded voice and audio file AI entry points are explicit');
assert(styles.includes('#mainContent>#heiPanel')&&styles.includes('#mainContent>#totalsSection')&&styles.includes('data-navigation-shell="workspace"'),'legacy canvas is isolated from section mode');
assert(styles.includes('@media(max-width:560px)'),'mobile layout is explicitly covered');
if(process.exitCode)process.exit(process.exitCode);
