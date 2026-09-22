'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hosting-check.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
if(scripts.length!==1)throw new Error(`expected one inline script, got ${scripts.length}`);
const elements={
  run:{onclick:null},
  out:{className:'',textContent:'Ожидание…'}
};
const context={
  console,
  Date,
  Promise,
  setTimeout,
  clearTimeout,
  location:{search:'?autorun=1'},
  document:{getElementById(id){if(!elements[id])throw new Error(`unknown element ${id}`);return elements[id];}},
  fetch:async function(resource){
    const clean=String(resource).split('?')[0];
    if(clean==='api/gemini.php')return{ok:true,status:200,text:async()=>JSON.stringify({ok:true,version:'v5.3.210-rc2',protocol_version:'nutrition-ai-comprehensive-planner-v7',ai_available:false,availability_code:'ai_kill_switch_env',csrf_token:'a'.repeat(64)})};
    if(clean==='api/gemini-guard.php')return{ok:false,status:404,text:async()=>''};
    const target=path.resolve(root,clean);
    if(!target.startsWith(root+path.sep)&&target!==root)return{ok:false,status:403,text:async()=>''};
    try{return{ok:true,status:200,text:async()=>fs.readFileSync(target,'utf8')}}catch{return{ok:false,status:404,text:async()=>''}}
  }
};
vm.createContext(context);
vm.runInContext(scripts[0][1],context,{filename:'hosting-check.inline.js'});
(async()=>{
  const deadline=Date.now()+5000;
  while(Date.now()<deadline&&elements.out.textContent==='Ожидание…')await new Promise(r=>setTimeout(r,20));
  const output=elements.out.textContent;
  if(elements.out.className!=='ok'||!output.includes('Итог: все активные ресурсы доступны и согласованы')||output.includes('ERR '))throw new Error(output);
  const checked=output.split('\n').filter(line=>line.startsWith('OK  ')).length;
  if(checked<40)throw new Error(`too few checked resources: ${checked}`);
  console.log(JSON.stringify({status:'PASS',assertions:3,resources:checked},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
