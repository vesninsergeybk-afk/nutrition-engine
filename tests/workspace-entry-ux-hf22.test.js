#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
let failed=0, assertions=0;
function assert(ok,msg){assertions++; if(!ok){failed++;console.error('FAIL:',msg);}else console.log('PASS:',msg);}
const runtime=JSON.parse(read('config/runtime-assets.v5.3.210-rc2.json'));
const modern='assets/js/89-workspace-entry-ux-v5.3.210-rc2-hf21.js';
const legacy='assets/legacy/js/89-workspace-entry-ux-v5.3.210-rc2-hf21.js';
const css='assets/css/workspace-entry-ux-v5.3.210-rc2-hf20.css';
const js=read(modern), legacyJs=read(legacy), styles=read(css), index=read('index.html');
const fs22=runtime.fast_start||{};
assert(runtime.release_version==='v5.3.210-rc2-hf22-fast-start','runtime version is HF22 fast start');
assert((fs22.critical_shell_sources.modern||[]).some(x=>x.split('?')[0].replace(/^\.\//,'')===modern),'HF21 entry controller is in critical modern shell');
assert((fs22.critical_shell_sources.legacy||[]).some(x=>x.split('?')[0].replace(/^\.\//,'')===legacy),'HF21 entry controller is in critical legacy shell');
assert(runtime.css_sources.includes(css),'reviewed HF20 entry stylesheet remains in retained HF21 CSS bundle');
assert(js===legacyJs,'modern and compatibility controllers are byte-identical');
assert(index.includes('runtime-manifest-v5.3.210-rc2-hf22.js'),'index loads HF22 runtime manifest');
assert(index.includes('data-performance-release="hf22-fast-start"'),'index declares HF22 performance release');
assert(index.includes('Имя или ФИО (необязательно)'),'profile label uses natural wording');
assert(js.includes('data-workspace-view-mode="workspace"')&&js.includes('data-workspace-view-mode="long"'),'visible Sections/Canvas switch is created');
assert(js.includes('workspaceProfileBackAction')&&js.includes("navigate('profile')"),'ration has a direct return to profile');
assert(js.includes('Поиск или ИИ-распознавание')&&js.includes('geminiRationChoosePhotos')&&js.includes('geminiRationRecordAudio')&&js.includes('geminiRationChooseAudio'),'photo, recorded voice and audio file AI entry points are explicit');
assert(styles.includes('#mainContent>#heiPanel')&&styles.includes('#mainContent>#totalsSection')&&styles.includes('data-navigation-shell="workspace"'),'legacy canvas is isolated from section mode');
assert(styles.includes('@media(max-width:560px)'),'mobile layout is explicitly covered');
console.log(JSON.stringify({ok:failed===0,assertions,failed}));
process.exit(failed?1:0);
