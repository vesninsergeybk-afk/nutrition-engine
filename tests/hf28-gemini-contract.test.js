'use strict';
const fs=require('fs');
function assert(v,m){if(!v)throw new Error(m);}
const php=fs.readFileSync('api/gemini.php','utf8');
const media=fs.readFileSync('assets/js/62-gemini-ration-import-v5.js','utf8');
const planner=fs.readFileSync('assets/js/61-ai-nutrition-planner-v5.3.210.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const bridge=fs.readFileSync('assets/js/90-media-entry-resilient-bridge-v5.3.210-rc2-hf28.js','utf8');
const checks=[
  [php.includes("require_once __DIR__.'/utf8-safe.php'"),'PHP must load UTF-8 helper'],
  [php.includes('JSON_INVALID_UTF8_SUBSTITUTE'),'PHP JSON must substitute malformed input'],
  [php.includes('ai_non_clinical_use_attestation_required'),'Server must require non-clinical use'],
  [php.includes('ai_media_transfer_consent_required'),'Server must require transfer consent'],
  [!php.includes('доступен только после подтверждения профессиональной или деловой цели'),'Professional-only server copy must be removed'],
  [media.includes("form.append('ai_non_clinical_use'"),'Media client must send non-clinical consent'],
  [media.includes("form.append('ai_media_transfer_consent'"),'Media client must send transfer consent'],
  [planner.includes('non_clinical_use: confirmed'),'Planner must use the same consent contract'],
  [html.includes('использую AI-функцию только для немедицинского планирования питания'),'UI must describe ordinary non-medical use'],
  [!html.includes('профессиональных или деловых целях'),'Professional-only UI copy must be removed'],
  [bridge.includes("setDirectRecordState('recording','Запись идёт')"),'Record button must expose persistent recording state'],
  [media.includes("setAttribute('aria-pressed',recorderState.active?'true':'false')"),'Record button must expose aria-pressed'],
  [media.includes("section.setAttribute('aria-busy',busy?'true':'false')"),'Recognition section must expose aria-busy'],
];
checks.forEach(([v,m])=>assert(v,m));
console.log(JSON.stringify({ok:true,assertions:checks.length}));
