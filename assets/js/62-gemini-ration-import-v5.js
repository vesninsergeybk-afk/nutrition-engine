// Nutrition Calculator v5.3.210-p0.5 — protected-mode gated Gemini media import with shared cost and abuse guard
// Native MediaRecorder is preferred to keep audio capture off the main UI thread; PCM remains a compatibility fallback.
(function(){
  'use strict';
  if(window.NutritionGeminiRationImport&&window.NutritionGeminiRationImport.__initialized)return;
  var VERSION='v5.3.210-rc2-hf28-gemini-reliability';
  var ENDPOINT='./api/gemini.php?v=v5.3.210-rc2-hf28-gemini-reliability';
  var MAX_FILES=8;
  var MAX_TOTAL_BYTES=7*1024*1024;
  var MAX_AUDIO_SOURCE_BYTES=64*1024*1024;
  var MAX_IMAGE_SOURCE_BYTES=40*1024*1024;
  var IMAGE_DEFAULT_TOTAL_BYTES=760*1024;
  var IMAGE_RETRY_TOTAL_BYTES=480*1024;
  var IMAGE_MIN_BYTES=44*1024;
  var IMAGE_MAX_BYTES=680*1024;
  var IMAGE_MAX_SIDE=1600;
  var MAX_AUDIO_OUTPUT_BYTES=960*1024;
  var MAX_AUDIO_SECONDS=5*60;
  var AUDIO_SAMPLE_RATE=16000;
  var AUDIO_PRIMARY_KBPS=24;
  var AUDIO_FALLBACK_KBPS=16;
  var LIVE_RECORD_BITS_PER_SECOND=24000;
  var AUTO_RETRY_DELAYS_SECONDS=(window.__NUTRITION_GEMINI_RETRY_DELAYS__||[5,12]).map(function(x){return Math.max(1,Math.min(60,Number(x)||1));});
  var AUTO_RETRY_MAX_ATTEMPTS=AUTO_RETRY_DELAYS_SECONDS.length+1;
  var CLIENT_REQUEST_TIMEOUT_MS=Math.max(35000,Math.min(90000,Number(window.__NUTRITION_GEMINI_CLIENT_TIMEOUT_MS__)||70000));
  var IMAGE_PREP_MAX_CONCURRENCY=(function(){var n=Number(window.__NUTRITION_GEMINI_IMAGE_CONCURRENCY__)||0;return n>0?Math.max(1,Math.min(3,n)):0;})();
  var LAME_SCRIPT_URL='./assets/vendor/lamejs/lame.min.js?v=1.2.0';
  var media=[];
  var draft=[];
  var activeController=null;
  var progressTimer=null;
  var uid=1;
  var busyState=false;
  var cooldownUntil=0;
  var cooldownTimer=null;
  var retryCountdownTimer=null;
  var retryCountdownSeconds=0;
  var lastRecognitionFailed=false;
  var lameLoadPromise=null;
  var audioPreparingCount=0;
  var imagePreparingCount=0;
  var imagePreparationChain=Promise.resolve();
  var hostingSafeTotalBytes=IMAGE_DEFAULT_TOTAL_BYTES;
  var hostingSafeSingleBytes=IMAGE_MAX_BYTES;
  var mediaDbPromise=null;
  var serviceHealthPromise=null;
  var serviceHealth={checked:false,reachable:false,configured:null,aiAvailable:null,availabilityCode:'',retryAfter:0,version:'',model:'',csrfToken:'',error:''};
  var mediaPersistTimer=null;
  var restoringMedia=false;
  var MEDIA_DB_NAME='nutrition-calculator-media-v1';
  var MEDIA_STORE='prepared-media';
  var CONTEXT_STORAGE_KEY='nutri_gemini_media_context_v1';
  var AI_ATTESTATION_KEY='nutri_ai_nonclinical_transfer_consent_v2';
  var LEGACY_AI_ATTESTATION_KEY='nutri_ai_user_18_attestation_v1';
  var recorderState={starting:false,active:false,processing:false,cancelled:false,mode:'',recorder:null,stream:null,chunks:[],startedAt:0,startedAtMonotonic:0,elapsedSeconds:0,timer:null,animationFrame:null,lastTimerPaint:-1,bytes:0,mimeType:'',audioContext:null,sourceNode:null,processorNode:null,sinkNode:null,pcmChunks:[],pcmSamples:0,sourceSampleRate:0};

  function $(id){return document.getElementById(id);}
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clamp(n,a,b){n=Number(n);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;}
  function clean(v,max){var s=String(v==null?'':v).replace(/\s+/g,' ').trim();return max&&s.length>max?s.slice(0,max):s;}
  function fmtBytes(n){n=Number(n)||0;if(n<1024)return n+' Б';if(n<1024*1024)return (n/1024).toFixed(1)+' КБ';return (n/1024/1024).toFixed(2)+' МБ';}
  function makeFile(blob,name,type,lastModified){try{return new File([blob],name,{type:type||blob.type||'application/octet-stream',lastModified:lastModified||Date.now()});}catch(_){blob.name=name;return blob;}}
  function mediaFile(item){return item&&item.preparedFile?item.preparedFile:(item&&item.file?item.file:null);}
  function mediaSignature(file,kind){return [kind||'',file&&file.name||'',Number(file&&file.size)||0,Number(file&&file.lastModified)||0].join('|');}
  function safeSessionGet(key){try{return sessionStorage.getItem(key);}catch(_){return null;}}
  function safeSessionSet(key,value){try{sessionStorage.setItem(key,value);return true;}catch(_){return false;}}
  function safeSessionRemove(key){try{sessionStorage.removeItem(key);}catch(_){}}
  function aiAttested(){var box=$('geminiRationAiEligibility');if(box&&box.checked)return true;try{return sessionStorage.getItem(AI_ATTESTATION_KEY)==='1'||sessionStorage.getItem(LEGACY_AI_ATTESTATION_KEY)==='1';}catch(_){return false;}}
  function setAiAttestation(value){value=!!value;try{if(value)sessionStorage.setItem(AI_ATTESTATION_KEY,'1');else{sessionStorage.removeItem(AI_ATTESTATION_KEY);sessionStorage.removeItem(LEGACY_AI_ATTESTATION_KEY);}}catch(_){}['geminiRationAiEligibility','geminiAiEligibility'].forEach(function(id){var el=$(id);if(el)el.checked=value;});}
  function aiUsageContext(){var stateEl=$('needs_state'),guardEl=$('needs_guardrail'),state=clean(stateEl&&stateEl.value,40)||'normal',guard=clean(guardEl&&guardEl.value,40)||'none',confirmed=aiAttested(),nutritionSafety=window.__lastNeedsMeta&&window.__lastNeedsMeta.refeedingRisk||null,safetyBlocked=!!(nutritionSafety&&nutritionSafety.highRisk),policy=window.ProtectedModesP03?window.ProtectedModesP03.currentPolicy():null,protectedBlocked=policy?policy.geminiAllowed===false:['preop','postop','icu','ckd','dialysis','oncology'].indexOf(state)>=0||guard!=='none';return {user_confirmed_18:confirmed,non_clinical_use:confirmed,media_transfer_consent:confirmed,professional_business_use:false,profile_state:state,nutrition_safety_block:safetyBlocked,protected_reason:policy&&policy.primaryReason||'',clinical_profile:protectedBlocked||safetyBlocked};}
  function aiEligibilityError(ctx){if(!ctx.user_confirmed_18||!ctx.non_clinical_use||!ctx.media_transfer_consent)return 'Подтвердите возраст 18+, немедицинское использование и согласие на отправку материалов в Gemini.';if(ctx.nutrition_safety_block)return 'Отправка материалов в Gemini отключена: скрининг выявил высокий риск рефидинга. Используйте локальный фактический анализ рациона без автоматической схемы увеличения питания.';if(ctx.clinical_profile)return ctx.protected_reason||'Для выбранного защищённого профиля отправка материалов в Gemini отключена.';return '';}
  function fetchHealthWithTimeout(){
    var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;
    if(controller)timer=setTimeout(function(){try{controller.abort();}catch(_){}},8000);
    return fetch(ENDPOINT,{method:'GET',credentials:'same-origin',headers:{'Accept':'application/json'},cache:'no-store',signal:controller?controller.signal:undefined}).finally(function(){if(timer)clearTimeout(timer);});
  }
  async function loadHostingLimits(force){
    if(serviceHealthPromise&&!force)return serviceHealthPromise;
    serviceHealthPromise=(async function(){
      try{
        var response=await fetchHealthWithTimeout();
        var text=await response.text(),data=parseJsonResponseText(text);
        if(!response.ok||!data){serviceHealth={checked:true,reachable:false,configured:null,aiAvailable:null,availabilityCode:'',retryAfter:0,version:'',model:'',csrfToken:'',error:'Сервер распознавания вернул некорректный ответ'+(response.status?' (HTTP '+response.status+')':'')+'.'};return serviceHealth;}
        var limits=data&&data.limits||{};
        var total=Number(limits.recommended_client_media_bytes)||0,single=Number(limits.recommended_client_single_bytes)||0;
        if(total>=IMAGE_RETRY_TOTAL_BYTES)hostingSafeTotalBytes=Math.max(IMAGE_RETRY_TOTAL_BYTES,Math.min(MAX_TOTAL_BYTES,Math.floor(total)));
        if(single>=IMAGE_MIN_BYTES)hostingSafeSingleBytes=Math.max(IMAGE_MIN_BYTES,Math.min(IMAGE_MAX_BYTES,Math.floor(single)));
        serviceHealth={checked:true,reachable:true,configured:data.configured===true,aiAvailable:data.ai_available!==false,availabilityCode:clean(data.availability_code,80),retryAfter:Math.max(0,Number(data.retry_after_seconds)||0),version:clean(data.version,40),model:clean(data.model,80),csrfToken:clean(data.csrf_token,160),error:data.configured===false?'Серверный ключ Gemini не настроен.':(data.ai_available===false?'Gemini временно поставлен на паузу серверным защитным контуром.':'')};return serviceHealth;
      }catch(error){
        serviceHealth={checked:true,reachable:false,configured:null,aiAvailable:null,availabilityCode:'',retryAfter:0,version:'',model:'',csrfToken:'',error:'Не удалось связаться с сервером распознавания. Проверьте интернет и доступность файла api/gemini.php.'};return serviceHealth;
      }finally{serviceHealthPromise=null;}
    })();
    return serviceHealthPromise;
  }
  async function ensureServiceReady(){
    // Refresh immediately before every upload: a previous health result may have become stale
    // after a circuit-breaker, daily budget, kill-switch or recovery transition.
    var health=await loadHostingLimits(true);
    if(!health.reachable){var networkError=new Error(health.error||'Сервер распознавания недоступен.');networkError.code='service_health_failed';networkError.retryable=false;throw networkError;}
    if(health.configured===false){var keyError=new Error('Серверный ключ Gemini не настроен.');keyError.code='api_key_missing';keyError.retryable=false;throw keyError;}
    if(health.aiAvailable===false){var guardError=new Error(health.error||'Gemini временно недоступен по серверному защитному бюджету.');guardError.code=health.availabilityCode||'guard_unavailable';guardError.retryable=true;guardError.retryAfter=health.retryAfter||0;throw guardError;}
    if(!health.csrfToken){var sessionError=new Error('Сервер не выдал защитный токен сессии.');sessionError.code='csrf_token_missing';sessionError.retryable=false;throw sessionError;}
    return health;
  }
  function retrySafeTotalBytes(){return Math.max(IMAGE_RETRY_TOTAL_BYTES,Math.min(hostingSafeTotalBytes,Math.floor(hostingSafeTotalBytes*.62)));}
  function openMediaDb(){
    if(mediaDbPromise)return mediaDbPromise;
    if(!window.indexedDB)return Promise.reject(new Error('indexedDB_unavailable'));
    mediaDbPromise=new Promise(function(resolve,reject){
      var req=indexedDB.open(MEDIA_DB_NAME,1);
      req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(MEDIA_STORE))db.createObjectStore(MEDIA_STORE,{keyPath:'id'});};
      req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error||new Error('indexedDB_open_failed'));};
    }).catch(function(error){mediaDbPromise=null;throw error;});
    return mediaDbPromise;
  }
  async function persistMediaNow(){
    if(restoringMedia)return;
    var rows=media.map(function(item,index){var file=mediaFile(item);if(!file||!item.preparedSize)return null;return {id:item.id,order:index,kind:item.kind,meal:item.meal||'',source:item.source||'upload',originalName:item.originalName||item.file&&item.file.name||file.name||'',originalSize:Number(item.originalSize)||Number(item.file&&item.file.size)||Number(file.size)||0,durationSeconds:Number(item.durationSeconds)||0,wasCompressed:!!item.wasCompressed,fileName:file.name||item.preparedName||'media',fileType:file.type||'application/octet-stream',lastModified:Number(file.lastModified)||Date.now(),blob:file};}).filter(Boolean);
    try{var db=await openMediaDb();await new Promise(function(resolve,reject){var tx=db.transaction(MEDIA_STORE,'readwrite'),store=tx.objectStore(MEDIA_STORE);store.clear();rows.forEach(function(row){store.put(row);});tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error||new Error('indexedDB_write_failed'));};tx.onabort=function(){reject(tx.error||new Error('indexedDB_write_aborted'));};});}catch(_){}
  }
  function schedulePersistMedia(){if(restoringMedia)return;if(mediaPersistTimer)clearTimeout(mediaPersistTimer);mediaPersistTimer=setTimeout(function(){mediaPersistTimer=null;persistMediaNow();},180);}
  async function clearPersistedMedia(){if(mediaPersistTimer){clearTimeout(mediaPersistTimer);mediaPersistTimer=null;}try{var db=await openMediaDb();await new Promise(function(resolve,reject){var tx=db.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).clear();tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};});}catch(_){} }
  async function restorePersistedMedia(){
    if(media.length)return 0;restoringMedia=true;
    try{var db=await openMediaDb();var rows=await new Promise(function(resolve,reject){var tx=db.transaction(MEDIA_STORE,'readonly'),req=tx.objectStore(MEDIA_STORE).getAll();req.onsuccess=function(){resolve(req.result||[]);};req.onerror=function(){reject(req.error);};});rows.sort(function(a,b){return Number(a.order)-Number(b.order);});rows.slice(0,MAX_FILES).forEach(function(row){if(!row||!row.blob)return;var restoredId=clean(row.id,80)||'media_'+(uid++),uidMatch=/^media_(\d+)$/.exec(restoredId);if(uidMatch)uid=Math.max(uid,Number(uidMatch[1])+1);var file=makeFile(row.blob,row.fileName||row.originalName||'media',row.fileType,row.lastModified);media.push({id:restoredId,file:file,kind:row.kind==='audio'?'audio':'image',meal:clean(row.meal,40),source:clean(row.source,20)||'recovered',previewUrl:URL.createObjectURL(file),preparedFile:file,preparedSize:Number(file.size)||0,preparedName:file.name||'',durationSeconds:Number(row.durationSeconds)||0,wasCompressed:!!row.wasCompressed,originalName:clean(row.originalName,120)||file.name||'',originalSize:Number(row.originalSize)||Number(file.size)||0,preparationState:'ready'});});return media.length;
    }catch(_){return 0;}finally{restoringMedia=false;}
  }
  function isImage(file){return /^image\//i.test(file&&file.type||'');}
  function isAudio(file){return /^audio\//i.test(file&&file.type||'')||/\.(mp3|wav|aac|ogg|opus|webm|flac|m4a|mp4|aif|aiff)$/i.test(file&&file.name||'');}
  function mealOptions(selected){
    var values=[['','Не указано'],['breakfast','Завтрак'],['second_breakfast','Второй завтрак'],['lunch','Обед'],['snack','Перекус'],['afternoon','Полдник'],['dinner','Ужин'],['late_snack','Поздний перекус'],['full_day','Весь день / несколько приёмов']];
    return values.map(function(x){return '<option value="'+esc(x[0])+'"'+(selected===x[0]?' selected':'')+'>'+esc(x[1])+'</option>';}).join('');
  }
  function mealLabel(value){var m={breakfast:'Завтрак',second_breakfast:'Второй завтрак',lunch:'Обед',snack:'Перекус',afternoon:'Полдник',dinner:'Ужин',late_snack:'Поздний перекус',full_day:'Несколько приёмов'};return m[value]||clean(value,60)||'Приём пищи не указан';}
  function confidenceLabel(n){n=Number(n);if(n>=0.8)return 'высокая';if(n>=0.58)return 'средняя';return 'нужна проверка';}
  function confidenceClass(n){n=Number(n);return n>=0.8?'high':(n>=0.58?'medium':'low');}
  function setStatus(message,state){var el=$('geminiRationStatus'),section=$('geminiRationImportSection');state=state||'idle';if(el){el.textContent=message||'';el.dataset.state=state;}if(section)section.dataset.geminiState=state;}
  function setActionState(el,state,busy){if(!el)return;el.dataset.actionState=state||'idle';el.setAttribute('aria-busy',busy?'true':'false');}
  function cooldownSeconds(){return Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000));}
  function updateRecognizeButton(){
    var btn=$('geminiRationRecognizeBtn');if(!btn)return;var wait=cooldownSeconds(),working=!!busyState||audioPreparingCount>0||imagePreparingCount>0||retryCountdownSeconds>0;btn.disabled=!!busyState||recorderBusy()||audioPreparingCount>0||imagePreparingCount>0||!media.length||wait>0;
    btn.textContent=retryCountdownSeconds>0?'Автоповтор через '+retryCountdownSeconds+' с':(busyState?'Распознаём рацион…':(imagePreparingCount>0?'Подготавливаем фотографии…':(audioPreparingCount>0?'Подготавливаем аудио…':(wait>0?'Повторить через '+wait+' с':(lastRecognitionFailed?'Повторить распознавание':'Распознать и подобрать продукты')))));
    setActionState(btn,working?'working':(lastRecognitionFailed?'error':(media.length?'ready':'idle')),working);
  }
  function startCooldown(seconds,message){
    seconds=Math.max(1,Math.min(3600,Math.ceil(Number(seconds)||60)));cooldownUntil=Date.now()+seconds*1000;
    if(cooldownTimer)clearInterval(cooldownTimer);
    function tick(){var left=cooldownSeconds();updateRecognizeButton();if(left<=0){clearInterval(cooldownTimer);cooldownTimer=null;setStatus('Можно повторить распознавание.','idle');}else setStatus((message||'Gemini ограничил частоту запросов.')+' Повтор будет доступен через '+left+' с.','error');}
    tick();cooldownTimer=setInterval(tick,1000);
  }
  function setBusy(busy){
    busyState=!!busy;updateRecognizeButton();var section=$('geminiRationImportSection');if(section)section.setAttribute('aria-busy',busy?'true':'false');
    ['geminiRationChoosePhotos','geminiRationTakePhoto','geminiRationChooseAudio','geminiRationRecordAudio','geminiRationClearMediaBtn'].forEach(function(id){var el=$(id);if(el){el.disabled=!!busy||recorderBusy()||audioPreparingCount>0||imagePreparingCount>0||(id==='geminiRationClearMediaBtn'&&!media.length);if(id!=='geminiRationRecordAudio')setActionState(el,busy?'disabled':'idle',false);}});
    var pr=$('geminiRationProgress');if(progressTimer){clearInterval(progressTimer);progressTimer=null;}
    if(pr){pr.setAttribute('aria-hidden',busy?'false':'true');pr.dataset.step=busy?'1':'0';}
    if(busy&&pr){var step=1;progressTimer=setInterval(function(){step=step>=5?1:step+1;pr.dataset.step=String(step);},420);}
  }
  function revokeItem(item){try{if(item&&item.previewUrl)URL.revokeObjectURL(item.previewUrl);}catch(_){} }
  function clearMedia(){media.forEach(revokeItem);media=[];lastRecognitionFailed=false;renderQueue();clearPersistedMedia();setStatus('','idle');}
  function clearDraft(){draft=[];var host=$('geminiRationDraft');if(host)host.hidden=true;var rows=$('geminiRationDraftRows');if(rows)rows.innerHTML='';}
  function totalOriginalBytes(){return media.reduce(function(a,x){return a+(Number(x.originalSize)||Number(x.file&&x.file.size)||0);},0);}
  function addFiles(files,forcedKind,source){
    var list=Array.from(files||[]);var rejected=[];var added=[];var signatures=new Set(media.map(function(x){return mediaSignature(x.file,x.kind);}));
    list.forEach(function(file){
      if(media.length>=MAX_FILES){rejected.push('Можно добавить не более '+MAX_FILES+' файлов.');return;}
      var kind=forcedKind||(isImage(file)?'image':(isAudio(file)?'audio':''));
      if(!kind){rejected.push('Формат «'+file.name+'» не поддерживается.');return;}
      if(kind==='audio'&&file.size>MAX_AUDIO_SOURCE_BYTES){rejected.push('Аудиофайл «'+file.name+'» больше 64 МБ. Сначала сократите запись до пяти минут.');return;}
      if(kind==='image'&&file.size>MAX_IMAGE_SOURCE_BYTES){rejected.push('Фотография «'+file.name+'» больше 40 МБ. Уменьшите её перед загрузкой.');return;}
      var signature=mediaSignature(file,kind);if(signatures.has(signature)){rejected.push('Файл «'+file.name+'» уже выбран.');return;}signatures.add(signature);
      var item={id:'media_'+(uid++),file:file,kind:kind,meal:kind==='audio'?'full_day':'',source:source||'upload',previewUrl:kind==='audio'?URL.createObjectURL(file):'',preparedFile:null,preparedSize:0,preparedName:'',durationSeconds:0,wasCompressed:false,originalName:file.name||'',originalSize:Number(file.size)||0,preparationState:kind==='image'?'queued':'checking'};
      media.push(item);added.push(item);
    });
    lastRecognitionFailed=false;renderQueue();clearDraft();
    if(rejected.length)setStatus(rejected.join(' '),'error');else if(added.length)setStatus(added.some(function(x){return x.kind==='audio';})?'Аудио добавлено. Проверяем длительность и подготавливаем компактный файл.':'Фотографии выбраны. Сначала создаём облегчённые копии, чтобы браузер не перегружал память.','working');
    return added;
  }
  function renderQueue(){
    var host=$('geminiRationMediaQueue');if(!host)return;
    host.hidden=!media.length;
    host.innerHTML=media.map(function(item,index){
      var preview=item.kind==='image'?(item.previewUrl?'<img src="'+esc(item.previewUrl)+'" alt="">':'<div class="gemini-ration-media-card__image-pending" aria-label="'+(item.preparationState==='ready'?'Фотография готова':'Фотография подготавливается')+'">'+(item.preparationState==='ready'?'Фото готово':'Подготовка фото…')+'</div>'):'<div class="gemini-ration-media-card__audio"><span aria-hidden="true">♪</span><audio controls preload="metadata" src="'+esc(item.previewUrl)+'" aria-label="Прослушать аудиозапись"></audio></div>';
      var originalSize=Number(item.originalSize)||Number(item.file&&item.file.size)||0;var sizeText=fmtBytes(originalSize)+(item.preparedSize?(originalSize!==item.preparedSize?' → '+fmtBytes(item.preparedSize)+' перед отправкой':' · готово'):(item.kind==='audio'?' · будет подготовлено до 1 МБ':' · подготавливается'));
      var durationText=item.durationSeconds?' · '+formatDuration(item.durationSeconds):'';
      var sourceText=item.kind==='audio'&&item.source==='microphone'?'Запись с микрофона':' ';
      return '<article class="gemini-ration-media-card" data-media-id="'+esc(item.id)+'">'+preview+'<div class="gemini-ration-media-card__body"><strong>'+(item.kind==='image'?'Фото '+(index+1):'Аудио '+(index+1))+'</strong><span title="'+esc(item.file.name)+'">'+esc(item.file.name)+'</span><small>'+esc(sizeText+durationText)+'</small>'+(sourceText.trim()?'<small class="gemini-ration-media-card__source">'+esc(sourceText)+'</small>':'')+'<label>Какой это приём пищи?<select data-role="meal">'+mealOptions(item.meal)+'</select></label></div><button type="button" class="secondary" data-role="remove" aria-label="Удалить файл">Удалить</button></article>';
    }).join('');
    host.querySelectorAll('[data-media-id]').forEach(function(card){
      var id=card.getAttribute('data-media-id');var item=media.find(function(x){return x.id===id;});
      var sel=card.querySelector('[data-role="meal"]');if(sel&&item)sel.addEventListener('change',function(){item.meal=sel.value;schedulePersistMedia();});
      var rm=card.querySelector('[data-role="remove"]');if(rm)rm.addEventListener('click',function(){var idx=media.findIndex(function(x){return x.id===id;});if(idx>=0){revokeItem(media[idx]);media.splice(idx,1);renderQueue();clearDraft();schedulePersistMedia();}});
    });
    updateRecognizeButton();
    var clear=$('geminiRationClearMediaBtn');if(clear)clear.disabled=!media.length;
  }

  function formatDuration(seconds){
    seconds=Math.max(0,Math.round(Number(seconds)||0));
    var minutes=Math.floor(seconds/60),rest=seconds%60;
    return String(minutes)+':'+String(rest).padStart(2,'0');
  }
  function nextFrame(){return new Promise(function(resolve){if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){resolve();});else setTimeout(resolve,0);});}
  function imagePreparationConcurrency(){
    if(IMAGE_PREP_MAX_CONCURRENCY>0)return IMAGE_PREP_MAX_CONCURRENCY;
    var cores=Math.max(1,Number(navigator&&navigator.hardwareConcurrency)||2);
    return cores>=8?3:2;
  }
  async function runWithConcurrency(list,limit,worker){
    list=Array.isArray(list)?list:[];limit=Math.max(1,Math.min(list.length||1,Number(limit)||1));var cursor=0;
    async function run(){while(true){var index=cursor++;if(index>=list.length)return;await worker(list[index],index);}}
    await Promise.all(Array.from({length:limit},run));
  }
  function setAudioPreparing(delta){audioPreparingCount=Math.max(0,audioPreparingCount+Number(delta||0));updateRecognizeButton();}
  function setImagePreparing(delta){imagePreparingCount=Math.max(0,imagePreparingCount+Number(delta||0));updateRecognizeButton();}
  function ensureLameLoaded(){
    if(window.lamejs&&typeof window.lamejs.Mp3Encoder==='function')return Promise.resolve(window.lamejs);
    if(lameLoadPromise)return lameLoadPromise;
    lameLoadPromise=new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-lamejs-audio-compressor]');
      if(existing){existing.addEventListener('load',function(){window.lamejs?resolve(window.lamejs):reject(new Error('Модуль сжатия аудио не загрузился.'));},{once:true});existing.addEventListener('error',function(){reject(new Error('Не удалось загрузить модуль сжатия аудио.'));},{once:true});return;}
      var script=document.createElement('script');script.src=LAME_SCRIPT_URL;script.async=true;script.dataset.lamejsAudioCompressor='1';
      script.onload=function(){window.lamejs?resolve(window.lamejs):reject(new Error('Модуль сжатия аудио недоступен.'));};
      script.onerror=function(){reject(new Error('Не удалось загрузить локальный модуль сжатия аудио.'));};document.head.appendChild(script);
    }).catch(function(error){lameLoadPromise=null;throw error;});
    return lameLoadPromise;
  }
  function readAudioDuration(file,timeoutMs){
    return new Promise(function(resolve){
      var audio=document.createElement('audio'),url=URL.createObjectURL(file),done=false,timer=setTimeout(function(){finish(0);},Math.max(800,Number(timeoutMs)||3500));
      function finish(value){if(done)return;done=true;clearTimeout(timer);try{audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);}catch(_){}resolve(Number(value)||0);}
      audio.preload='metadata';audio.onloadedmetadata=function(){finish(audio.duration);};audio.onerror=function(){finish(0);};audio.src=url;
    });
  }
  async function decodeAudioFile(file){
    var AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)throw new Error('Этот браузер не поддерживает подготовку аудио. Используйте актуальную версию Chrome, Edge, Firefox или Safari.');
    var context=new AudioCtx();
    try{
      var raw=await file.arrayBuffer();
      var buffer=await new Promise(function(resolve,reject){
        var settled=false;function ok(value){if(!settled){settled=true;resolve(value);}}function bad(error){if(!settled){settled=true;reject(error);}}
        try{var result=context.decodeAudioData(raw.slice(0),ok,bad);if(result&&typeof result.then==='function')result.then(ok,bad);}catch(error){bad(error);}
      });
      return buffer;
    }catch(error){throw new Error('Не удалось прочитать аудиозапись «'+clean(file.name||'аудио',120)+'». Выберите MP3, WAV, M4A, AAC, OGG, FLAC или AIFF.');}
    finally{try{await context.close();}catch(_){}}
  }
  function downmixResampleToInt16(buffer,targetRate){
    var sourceRate=Number(buffer.sampleRate)||44100;var channels=Math.max(1,Number(buffer.numberOfChannels)||1);var duration=Number(buffer.duration)||0;
    var targetLength=Math.max(1,Math.ceil(duration*targetRate));var output=new Int16Array(targetLength);var channelData=[];
    for(var c=0;c<channels;c++)channelData.push(buffer.getChannelData(c));
    var ratio=sourceRate/targetRate;
    for(var i=0;i<targetLength;i++){
      var pos=i*ratio;var left=Math.floor(pos);var frac=pos-left;var mixed=0;
      for(var ch=0;ch<channels;ch++){var data=channelData[ch];var a=data[Math.min(left,data.length-1)]||0;var b=data[Math.min(left+1,data.length-1)]||a;mixed+=a+(b-a)*frac;}
      mixed/=channels;mixed=Math.max(-1,Math.min(1,mixed));output[i]=mixed<0?Math.round(mixed*32768):Math.round(mixed*32767);
    }
    return output;
  }
  async function encodeMp3Mono(samples,sampleRate,kbps){
    var lame=await ensureLameLoaded();var encoder=new lame.Mp3Encoder(1,sampleRate,kbps);var chunks=[];var block=1152;
    for(var i=0;i<samples.length;i+=block){
      var encoded=encoder.encodeBuffer(samples.subarray(i,Math.min(i+block,samples.length)));if(encoded&&encoded.length)chunks.push(new Uint8Array(encoded));
      if(i%(block*180)===0)await nextFrame();
    }
    var tail=encoder.flush();if(tail&&tail.length)chunks.push(new Uint8Array(tail));return new Blob(chunks,{type:'audio/mpeg'});
  }
  function supportedGeminiAudio(file){
    var mime=String(file&&file.type||'').toLowerCase();var name=String(file&&file.name||'').toLowerCase();
    return /^(audio\/(mpeg|mp3|wav|x-wav|aac|ogg|flac|x-flac|mp4|x-m4a|aiff|x-aiff))$/.test(mime)||/\.(mp3|wav|aac|ogg|flac|m4a|mp4|aif|aiff)$/.test(name);
  }
  async function prepareAudioFile(item){
    if(item.preparedFile&&item.preparedSize>0)return item.preparedFile;
    var file=item.file,duration=0,buffer=null;var directCandidate=file.size<=MAX_AUDIO_OUTPUT_BYTES&&supportedGeminiAudio(file);
    /* Metadata probing is useful only for files that may be sent unchanged. WebM microphone recordings and large files go straight to decoding instead of waiting for an avoidable metadata timeout. */
    if(directCandidate){
      duration=await readAudioDuration(file,3500);
      if(duration>MAX_AUDIO_SECONDS+0.5)throw new Error('Аудиозапись «'+clean(file.name||'аудио',120)+'» длится '+formatDuration(duration)+'. Допустимо не более 5:00.');
      if(duration>=0.25){item.durationSeconds=duration;item.preparedFile=file;item.preparedSize=file.size;item.preparedName=file.name;item.wasCompressed=false;item.preparationState='ready';renderQueue();schedulePersistMedia();return file;}
    }
    buffer=await decodeAudioFile(file);duration=Number(buffer.duration)||duration||0;
    if(!duration||duration<0.25)throw new Error('Аудиозапись «'+clean(file.name||'аудио',120)+'» слишком короткая или пустая.');
    if(duration>MAX_AUDIO_SECONDS+0.5)throw new Error('Аудиозапись «'+clean(file.name||'аудио',120)+'» длится '+formatDuration(duration)+'. Допустимо не более 5:00.');
    item.durationSeconds=duration;
    setStatus('Сжимаем аудио «'+clean(file.name||'запись',80)+'» для отправки: моно, 16 кГц, речевой битрейт.','working');
    var samples=downmixResampleToInt16(buffer,AUDIO_SAMPLE_RATE);buffer=null;var targetKbps=AUDIO_PRIMARY_KBPS;
    var blob=await encodeMp3Mono(samples,AUDIO_SAMPLE_RATE,targetKbps);
    if(blob.size>MAX_AUDIO_OUTPUT_BYTES&&targetKbps!==AUDIO_FALLBACK_KBPS)blob=await encodeMp3Mono(samples,AUDIO_SAMPLE_RATE,AUDIO_FALLBACK_KBPS);
    samples=null;if(blob.size>MAX_AUDIO_OUTPUT_BYTES)throw new Error('Аудиозапись не удалось уменьшить до 1 МБ без чрезмерной потери качества. Сократите её длительность.');
    var name=(file.name||'voice').replace(/\.[^.]+$/,'')+'.mp3';var prepared=makeFile(blob,name,'audio/mpeg',Date.now());
    item.preparedFile=prepared;item.preparedSize=prepared.size;item.preparedName=name;item.wasCompressed=true;item.preparationState='ready';if(item.previewUrl)URL.revokeObjectURL(item.previewUrl);item.previewUrl=URL.createObjectURL(prepared);renderQueue();schedulePersistMedia();return prepared;
  }
  async function prepareAudioItems(items){
    var list=(items||[]).filter(function(x){return x&&x.kind==='audio';});if(!list.length)return;
    setAudioPreparing(1);var errors=[],readyItems=[];
    try{
      for(var i=0;i<list.length;i++){
        var item=list[i];setStatus('Проверяем и подготавливаем аудио: '+(i+1)+' из '+list.length+'.','working');
        try{await prepareAudioFile(item);readyItems.push(item);}catch(error){errors.push(error&&error.message?error.message:'Не удалось подготовить аудио.');var idx=media.indexOf(item);if(idx>=0){revokeItem(item);media.splice(idx,1);}renderQueue();}
      }
      var before=readyItems.reduce(function(a,x){return a+(Number(x.originalSize)||Number(x.file&&x.file.size)||0);},0);var after=readyItems.reduce(function(a,x){return a+(Number(x.preparedSize)||0);},0);
      if(errors.length)setStatus(errors.join(' ')+' Остальные аудиофайлы сохранены.','error');else if(readyItems.length)setStatus('Аудио готово: '+fmtBytes(before)+' → '+fmtBytes(after)+'. Небольшие совместимые файлы отправляются без повторного перекодирования.','success');
      schedulePersistMedia();
    }finally{setAudioPreparing(-1);}
  }
  function recorderMimeType(){
    var types=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg','audio/mp4;codecs=mp4a.40.2','audio/mp4'];
    if(!window.MediaRecorder)return '';
    if(typeof MediaRecorder.isTypeSupported!=='function')return '';
    for(var i=0;i<types.length;i++)if(MediaRecorder.isTypeSupported(types[i]))return types[i];return '';
  }
  function recorderExtension(mime){mime=String(mime||'').toLowerCase();if(mime.indexOf('ogg')>=0)return 'ogg';if(mime.indexOf('mp4')>=0)return 'm4a';return 'webm';}
  function recorderBusy(){return !!(recorderState.starting||recorderState.active||recorderState.processing);}
  function recorderClockNow(){return typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now();}
  function recorderElapsed(){
    if(recorderState.active){
      if(recorderState.startedAtMonotonic)return Math.min(MAX_AUDIO_SECONDS,Math.max(0,(recorderClockNow()-recorderState.startedAtMonotonic)/1000));
      if(recorderState.startedAt)return Math.min(MAX_AUDIO_SECONDS,Math.max(0,(Date.now()-recorderState.startedAt)/1000));
    }
    return Math.max(0,Number(recorderState.elapsedSeconds)||0);
  }
  function paintRecorderTimer(force){
    var timer=$('geminiRationRecorderTimer');if(!timer)return;
    var elapsed=recorderElapsed(),whole=Math.floor(elapsed+0.0001),text=formatDuration(whole)+' / 5:00';
    if(force||whole!==recorderState.lastTimerPaint||timer.textContent!==text){timer.textContent=text;recorderState.lastTimerPaint=whole;timer.dataset.seconds=String(whole);}
  }
  function recorderAnimationTick(){
    if(!recorderState.active){recorderState.animationFrame=null;return;}
    paintRecorderTimer(false);
    if(recorderElapsed()>=MAX_AUDIO_SECONDS){stopLiveRecording(false);return;}
    recorderState.animationFrame=requestAnimationFrame(recorderAnimationTick);
  }
  function startRecorderClock(){
    clearRecorderTimer();recorderState.startedAt=Date.now();recorderState.startedAtMonotonic=recorderClockNow();recorderState.lastTimerPaint=-1;paintRecorderTimer(true);
    if(typeof requestAnimationFrame==='function')recorderState.animationFrame=requestAnimationFrame(recorderAnimationTick);
    recorderState.timer=setInterval(function(){
      if(!recorderState.active)return;
      if(recorderState.mode==='pcm'&&recorderState.audioContext&&recorderState.audioContext.state==='suspended'&&typeof recorderState.audioContext.resume==='function'){try{var r=recorderState.audioContext.resume();if(r&&typeof r.catch==='function')r.catch(function(){});}catch(_){} }
      paintRecorderTimer(false);if(recorderElapsed()>=MAX_AUDIO_SECONDS)stopLiveRecording(false);
    },500);
  }
  function updateRecorderUi(){
    var panel=$('geminiRationRecorderPanel'),state=$('geminiRationRecorderState');
    if(panel){panel.hidden=!recorderBusy();panel.dataset.recorderState=recorderState.starting?'starting':(recorderState.active?'recording':(recorderState.processing?'processing':'idle'));panel.dataset.recorderMode=recorderState.mode||'';}
    paintRecorderTimer(true);
    if(state){
      if(recorderState.starting)state.textContent='Подключаем микрофон…';
      else if(recorderState.active)state.textContent='Идёт запись. Говорите обычным голосом, перечисляя продукты и их массу.';
      else if(recorderState.processing)state.textContent='Подготавливаем запись для распознавания…';
      else state.textContent='Запись остановлена.';
    }
    ['geminiRationChoosePhotos','geminiRationTakePhoto','geminiRationChooseAudio','geminiRationRecordAudio','geminiRationClearMediaBtn'].forEach(function(id){var el=$(id);if(el)el.disabled=busyState||recorderBusy()||audioPreparingCount>0||imagePreparingCount>0||(id==='geminiRationClearMediaBtn'&&!media.length);});
    var recordButton=$('geminiRationRecordAudio');if(recordButton){var rState=recorderState.starting?'working':(recorderState.active?'recording':(recorderState.processing?'working':'idle'));recordButton.setAttribute('aria-pressed',recorderState.active?'true':'false');setActionState(recordButton,rState,recorderState.starting||recorderState.processing);recordButton.innerHTML=recorderState.active?'<span aria-hidden="true">●</span> Запись идёт':(recorderState.starting?'Подключаем микрофон…':(recorderState.processing?'Подготавливаем запись…':'<span aria-hidden="true">●</span> Записать голос'));}
    var stopButton=$('geminiRationStopRecording'),cancelButton=$('geminiRationCancelRecording');if(stopButton){stopButton.disabled=!recorderState.active;setActionState(stopButton,recorderState.active?'ready':'disabled',false);}if(cancelButton)cancelButton.disabled=recorderState.processing;
    updateRecognizeButton();
  }
  function clearRecorderTimer(){
    if(recorderState.timer){clearInterval(recorderState.timer);recorderState.timer=null;}
    if(recorderState.animationFrame&&typeof cancelAnimationFrame==='function'){cancelAnimationFrame(recorderState.animationFrame);recorderState.animationFrame=null;}
  }
  function stopRecorderTracks(stream){
    if(!stream||typeof stream.getTracks!=='function')return;
    stream.getTracks().forEach(function(track){try{track.onended=null;track.stop();}catch(_){}});
  }
  function releaseRecorderAudioGraph(){
    var processor=recorderState.processorNode,source=recorderState.sourceNode,sink=recorderState.sinkNode,context=recorderState.audioContext;
    try{if(processor)processor.onaudioprocess=null;}catch(_){}
    [source,processor,sink].forEach(function(node){try{if(node&&typeof node.disconnect==='function')node.disconnect();}catch(_){}});
    recorderState.processorNode=null;recorderState.sourceNode=null;recorderState.sinkNode=null;recorderState.audioContext=null;
    if(context&&typeof context.close==='function'){try{var closing=context.close();if(closing&&typeof closing.catch==='function')closing.catch(function(){});}catch(_){}}
  }
  function releaseRecorderResources(){clearRecorderTimer();releaseRecorderAudioGraph();stopRecorderTracks(recorderState.stream);recorderState.stream=null;recorderState.recorder=null;}
  function resetRecorderState(){
    recorderState.starting=false;recorderState.active=false;recorderState.processing=false;recorderState.cancelled=false;recorderState.mode='';recorderState.recorder=null;recorderState.stream=null;recorderState.chunks=[];recorderState.startedAt=0;recorderState.startedAtMonotonic=0;recorderState.elapsedSeconds=0;recorderState.timer=null;recorderState.animationFrame=null;recorderState.lastTimerPaint=-1;recorderState.bytes=0;recorderState.mimeType='';recorderState.audioContext=null;recorderState.sourceNode=null;recorderState.processorNode=null;recorderState.sinkNode=null;recorderState.pcmChunks=[];recorderState.pcmSamples=0;recorderState.sourceSampleRate=0;updateRecorderUi();
  }
  function resampleInputBufferToInt16(buffer,targetRate){
    var sourceRate=Number(buffer&&buffer.sampleRate)||Number(recorderState.sourceSampleRate)||44100;
    var channels=Math.max(1,Number(buffer&&buffer.numberOfChannels)||1);var frames=Math.max(0,Number(buffer&&buffer.length)||0);
    if(!frames)return new Int16Array(0);
    var channelData=[];for(var c=0;c<channels;c++){try{channelData.push(buffer.getChannelData(c));}catch(_){}}
    if(!channelData.length)return new Int16Array(0);
    var ratio=sourceRate/targetRate;var outLength=Math.max(1,Math.floor(frames/ratio));var output=new Int16Array(outLength);
    for(var i=0;i<outLength;i++){
      var pos=i*ratio,left=Math.floor(pos),frac=pos-left,mixed=0;
      for(var ch=0;ch<channelData.length;ch++){var data=channelData[ch],a=data[Math.min(left,data.length-1)]||0,b=data[Math.min(left+1,data.length-1)]||a;mixed+=a+(b-a)*frac;}
      mixed/=channelData.length;mixed=Math.max(-1,Math.min(1,mixed));output[i]=mixed<0?Math.round(mixed*32768):Math.round(mixed*32767);
    }
    return output;
  }
  function capturePcmEvent(event){
    if(!recorderState.active||recorderState.mode!=='pcm'||!event||!event.inputBuffer)return;
    var chunk=resampleInputBufferToInt16(event.inputBuffer,AUDIO_SAMPLE_RATE);if(!chunk.length)return;
    recorderState.pcmChunks.push(chunk);recorderState.pcmSamples+=chunk.length;
    if(recorderState.pcmSamples>=AUDIO_SAMPLE_RATE*MAX_AUDIO_SECONDS)stopLiveRecording(false);
  }
  function concatenatePcm(chunks,total){
    total=Math.max(0,Number(total)||0);var output=new Int16Array(total),offset=0;
    (chunks||[]).forEach(function(chunk){if(!chunk||!chunk.length)return;var remain=output.length-offset;if(remain<=0)return;var part=chunk.length>remain?chunk.subarray(0,remain):chunk;output.set(part,offset);offset+=part.length;});
    return offset===output.length?output:output.subarray(0,offset);
  }
  async function startPcmCapture(stream){
    var AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return false;
    var context;try{context=new AudioCtx({latencyHint:'interactive'});}catch(_){try{context=new AudioCtx();}catch(__){return false;}}
    var createProcessor=context.createScriptProcessor||context.createJavaScriptNode;
    if(typeof createProcessor!=='function'){try{await context.close();}catch(_){}return false;}
    try{
      var source=context.createMediaStreamSource(stream);var processor=createProcessor.call(context,4096,1,1);var sink=context.createGain();sink.gain.value=0;
      processor.onaudioprocess=capturePcmEvent;source.connect(processor);processor.connect(sink);sink.connect(context.destination);
      if(context.state==='suspended'&&typeof context.resume==='function')await context.resume();
      recorderState.mode='pcm';recorderState.audioContext=context;recorderState.sourceNode=source;recorderState.processorNode=processor;recorderState.sinkNode=sink;recorderState.sourceSampleRate=Number(context.sampleRate)||44100;recorderState.pcmChunks=[];recorderState.pcmSamples=0;
      return true;
    }catch(error){try{await context.close();}catch(_){}return false;}
  }
  function markPreparedMicrophoneItem(file,duration,wasCompressed){
    var added=addFiles([file],'audio','microphone');if(!added.length)return null;var item=added[0];item.preparedFile=file;item.preparedSize=Number(file.size)||0;item.preparedName=file.name||'voice.mp3';item.durationSeconds=duration;item.wasCompressed=wasCompressed!==false;item.preparationState='ready';renderQueue();schedulePersistMedia();return item;
  }
  async function finalizePcmRecording(snapshot){
    try{
      var samples=concatenatePcm(snapshot.pcmChunks,snapshot.pcmSamples);var duration=samples.length/AUDIO_SAMPLE_RATE;
      if(duration<0.7||samples.length<AUDIO_SAMPLE_RATE*.7)throw new Error('Запись получилась слишком короткой. Запишите голос ещё раз.');
      setStatus('Подготавливаем запись: моно, 16 кГц, речевой MP3.','working');await nextFrame();
      var blob=await encodeMp3Mono(samples,AUDIO_SAMPLE_RATE,AUDIO_PRIMARY_KBPS);if(blob.size>MAX_AUDIO_OUTPUT_BYTES)blob=await encodeMp3Mono(samples,AUDIO_SAMPLE_RATE,AUDIO_FALLBACK_KBPS);
      if(blob.size>MAX_AUDIO_OUTPUT_BYTES)throw new Error('Запись не удалось уменьшить до 1 МБ. Сократите её длительность.');
      var stamp=new Date().toISOString().replace(/[:.]/g,'-'),name='voice-'+stamp+'.mp3',file;try{file=new File([blob],name,{type:'audio/mpeg',lastModified:Date.now()});}catch(_){file=blob;file.name=name;}
      markPreparedMicrophoneItem(file,duration,true);setStatus('Запись готова: '+formatDuration(duration)+' · '+fmtBytes(file.size)+'. Можно запускать распознавание.','success');
    }catch(error){setStatus(error&&error.message?error.message:'Не удалось подготовить запись.','error');}
    finally{resetRecorderState();}
  }
  async function finalizeMediaRecorder(snapshot){
    try{
      var duration=Math.max(0,Number(snapshot.elapsedSeconds)||0);if(duration<0.7||!snapshot.chunks.length)throw new Error('Запись получилась слишком короткой. Запишите голос ещё раз.');
      var blob=new Blob(snapshot.chunks,{type:snapshot.mimeType});var stamp=new Date().toISOString().replace(/[:.]/g,'-');var filename='voice-'+stamp+'.'+recorderExtension(snapshot.mimeType);var file;try{file=new File([blob],filename,{type:snapshot.mimeType,lastModified:Date.now()});}catch(_){file=blob;file.name=filename;}
      if(file.size<=MAX_AUDIO_OUTPUT_BYTES&&supportedGeminiAudio(file)){markPreparedMicrophoneItem(file,duration,false);setStatus('Запись готова: '+formatDuration(duration)+' · '+fmtBytes(file.size)+'. Можно запускать распознавание.','success');}
      else{var added=addFiles([file],'audio','microphone');if(!added.length)throw new Error('Не удалось добавить запись.');await prepareAudioItems(added);}
    }catch(error){setStatus(error&&error.message?error.message:'Не удалось подготовить запись.','error');}
    finally{resetRecorderState();}
  }
  async function startMediaRecorderFallback(stream){
    if(!window.MediaRecorder)return false;var mime=recorderMimeType();var options={audioBitsPerSecond:LIVE_RECORD_BITS_PER_SECOND};if(mime)options.mimeType=mime;var recorder;
    try{recorder=new MediaRecorder(stream,options);}catch(_){try{recorder=new MediaRecorder(stream);}catch(__){return false;}}
    recorderState.mode='media';recorderState.recorder=recorder;recorderState.chunks=[];recorderState.bytes=0;recorderState.mimeType=recorder.mimeType||mime||'audio/webm';
    recorder.ondataavailable=function(event){if(event.data&&event.data.size){recorderState.chunks.push(event.data);recorderState.bytes+=event.data.size;if(recorderState.bytes>8*1024*1024)stopLiveRecording(false);}};
    recorder.onerror=function(){releaseRecorderResources();resetRecorderState();setStatus('Во время записи произошла ошибка. Проверьте разрешение на использование микрофона.','error');};
    recorder.onstop=function(){
      if(!recorderState.active&&!recorderState.processing)return;var cancelled=recorderState.cancelled;recorderState.elapsedSeconds=recorderElapsed();var snapshot={chunks:recorderState.chunks.slice(),mimeType:recorderState.mimeType,elapsedSeconds:recorderState.elapsedSeconds};recorderState.active=false;recorderState.processing=!cancelled;releaseRecorderResources();updateRecorderUi();if(cancelled){resetRecorderState();setStatus('Запись отменена.','idle');return;}finalizeMediaRecorder(snapshot);
    };
    try{recorder.start(1000);}catch(error){recorderState.recorder=null;recorderState.mode='';return false;}return true;
  }
  function stopLiveRecording(cancel){
    if(recorderState.starting){recorderState.cancelled=!!cancel;return;}
    if(!recorderState.active)return;recorderState.cancelled=!!cancel;recorderState.elapsedSeconds=recorderElapsed();
    if(recorderState.mode==='media'&&recorderState.recorder&&recorderState.recorder.state!=='inactive'){try{recorderState.recorder.stop();return;}catch(_){}}
    var snapshot={pcmChunks:recorderState.pcmChunks.slice(),pcmSamples:recorderState.pcmSamples,elapsedSeconds:recorderState.elapsedSeconds};recorderState.active=false;recorderState.processing=!cancel;releaseRecorderResources();updateRecorderUi();
    if(cancel){resetRecorderState();setStatus('Запись отменена.','idle');return;}finalizePcmRecording(snapshot);
  }
  function microphoneErrorMessage(error){
    var name=error&&error.name||'';
    if(name==='NotAllowedError'||name==='PermissionDeniedError')return 'Доступ к микрофону не разрешён. Разрешите его в настройках сайта и повторите запись.';
    if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'На устройстве не найден доступный микрофон.';
    if(name==='NotReadableError'||name==='TrackStartError')return 'Микрофон занят другим приложением или недоступен системе.';
    if(name==='OverconstrainedError'||name==='ConstraintNotSatisfiedError')return 'Браузер не смог применить параметры микрофона. Повторите попытку или выберите готовый аудиофайл.';
    if(name==='SecurityError')return 'Браузер заблокировал микрофон из-за настроек безопасности страницы.';
    if(name==='AbortError')return 'Подключение микрофона было прервано. Повторите попытку.';
    return error&&error.message?error.message:'Не удалось открыть микрофон.';
  }
  function recorderPolicyAllowsMicrophone(){
    try{var policy=document.permissionsPolicy||document.featurePolicy;if(policy&&typeof policy.allowsFeature==='function')return policy.allowsFeature('microphone');}catch(_){}
    return true;
  }
  async function activateLiveRecordingStream(stream){
    if(!stream||typeof stream.getAudioTracks!=='function'||!stream.getAudioTracks().length)throw new Error('Браузер не передал аудиодорожку микрофона.');
    if(recorderState.cancelled){stopRecorderTracks(stream);resetRecorderState();setStatus('Запись отменена.','idle');return false;}
    recorderState.stream=stream;var mediaStarted=false;
    if(window.__NUTRITION_RECORDER_FORCE_PCM__!==true)mediaStarted=await startMediaRecorderFallback(stream);
    if(!mediaStarted){var pcmStarted=await startPcmCapture(stream);if(!pcmStarted)throw new Error('Этот браузер не поддерживает совместимую запись аудио. Используйте актуальный Chrome, Firefox, Edge или Safari либо выберите готовый аудиофайл.');}
    recorderState.starting=false;recorderState.active=true;recorderState.processing=false;recorderState.elapsedSeconds=0;startRecorderClock();
    stream.getAudioTracks().forEach(function(track){track.onended=function(){if(recorderState.active)stopLiveRecording(false);};});
    updateRecorderUi();setStatus('Микрофон включён. Запись идёт; таймер обновляется в реальном времени. Максимальная длительность — 5 минут.','working');
    return true;
  }
  async function startLiveRecordingWithStream(stream){
    if(recorderBusy()){stopRecorderTracks(stream);return false;}
    if(media.length>=MAX_FILES){stopRecorderTracks(stream);setStatus('Сначала удалите один из файлов: можно добавить не более '+MAX_FILES+'.','error');return false;}
    recorderState.starting=true;recorderState.cancelled=false;recorderState.elapsedSeconds=0;updateRecorderUi();setStatus('Подключаем микрофон…','working');
    try{return await activateLiveRecordingStream(stream);}
    catch(error){releaseRecorderResources();stopRecorderTracks(stream);resetRecorderState();setStatus(microphoneErrorMessage(error),'error');return false;}
  }
  async function startLiveRecording(){
    if(recorderBusy())return false;
    if(media.length>=MAX_FILES){setStatus('Сначала удалите один из файлов: можно добавить не более '+MAX_FILES+'.','error');return false;}
    if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){setStatus('Прямая запись требует HTTPS и браузер с поддержкой доступа к микрофону. На локальном компьютере также допустим localhost.','error');return false;}
    /* Attempt the real request instead of pre-blocking on featurePolicy: some Android WebViews report false negatives. */
    recorderState.starting=true;recorderState.cancelled=false;recorderState.elapsedSeconds=0;updateRecorderUi();setStatus('Подключаем микрофон…','working');
    try{
      /* A plain audio constraint is the most compatible request for mobile browsers and embedded WebViews. */
      var stream=await navigator.mediaDevices.getUserMedia({audio:true});
      return await activateLiveRecordingStream(stream);
    }catch(error){releaseRecorderResources();resetRecorderState();setStatus(microphoneErrorMessage(error),'error');return false;}
  }

  async function readImageDimensions(file){
    try{
      var buffer=await file.slice(0,512*1024).arrayBuffer(),u=new Uint8Array(buffer),v=new DataView(buffer);
      if(u.length>=24&&u[0]===137&&u[1]===80&&u[2]===78&&u[3]===71)return {width:v.getUint32(16),height:v.getUint32(20)};
      if(u.length>=12&&u[0]===255&&u[1]===216){var i=2,sof=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);while(i+9<u.length){if(u[i]!==255){i++;continue;}while(i<u.length&&u[i]===255)i++;var marker=u[i++];if(marker===216||marker===217)continue;if(i+1>=u.length)break;var len=(u[i]<<8)+u[i+1];if(len<2||i+len>u.length)break;if(sof.has(marker))return {height:(u[i+3]<<8)+u[i+4],width:(u[i+5]<<8)+u[i+6]};i+=len;}}
      if(u.length>=30&&String.fromCharCode.apply(null,u.slice(0,4))==='RIFF'&&String.fromCharCode.apply(null,u.slice(8,12))==='WEBP'){
        var kind=String.fromCharCode.apply(null,u.slice(12,16));
        if(kind==='VP8X')return {width:1+u[24]+(u[25]<<8)+(u[26]<<16),height:1+u[27]+(u[28]<<8)+(u[29]<<16)};
        if(kind==='VP8 '&&u.length>=30)return {width:v.getUint16(26,true)&16383,height:v.getUint16(28,true)&16383};
        if(kind==='VP8L'&&u.length>=25){var b1=u[21],b2=u[22],b3=u[23],b4=u[24];return {width:1+((b1|(b2<<8))&16383),height:1+(((b2>>6)|(b3<<2)|(b4<<10))&16383)};}
      }
    }catch(_){}return null;
  }
  function imageBudgetForCount(count,totalBytes){count=Math.max(1,Number(count)||1);var headroom=48*1024;return Math.max(IMAGE_MIN_BYTES,Math.min(hostingSafeSingleBytes,IMAGE_MAX_BYTES,Math.floor((Math.max(totalBytes||hostingSafeTotalBytes,headroom+IMAGE_MIN_BYTES)-headroom)/count)));
  }
  async function imageToJpeg(file,targetBytes){
    if(!isImage(file))return file;targetBytes=Math.max(IMAGE_MIN_BYTES,Math.min(IMAGE_MAX_BYTES,Number(targetBytes)||IMAGE_MAX_BYTES));
    var bitmap=null,canvas=null;
    try{
      var dims=await readImageDimensions(file),targetW=0,targetH=0;
      /* Choose a target geometry from the byte budget before decoding. This avoids repeatedly encoding a 1600 px canvas when eight photos only receive about 89 KiB each. */
      var budgetSide=Math.max(640,Math.min(IMAGE_MAX_SIDE,Math.round(Math.sqrt(targetBytes/.12))));
      if(dims&&dims.width&&dims.height){var scale=Math.min(1,budgetSide/Math.max(dims.width,dims.height));targetW=Math.max(1,Math.round(dims.width*scale));targetH=Math.max(1,Math.round(dims.height*scale));}
      if(window.createImageBitmap){
        if(targetW&&targetH){try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image',resizeWidth:targetW,resizeHeight:targetH,resizeQuality:'high'});}catch(_){}}
        if(!bitmap){try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(_){}}
      }
      if(!bitmap){
        bitmap=await new Promise(function(resolve,reject){var img=new Image(),u=URL.createObjectURL(file);img.onload=function(){URL.revokeObjectURL(u);resolve(img);};img.onerror=function(){URL.revokeObjectURL(u);reject(new Error('Не удалось открыть изображение '+file.name));};img.src=u;});
      }
      var sourceW=bitmap.width||bitmap.naturalWidth,sourceH=bitmap.height||bitmap.naturalHeight;if(!sourceW||!sourceH)throw new Error('Не удалось определить размеры изображения '+file.name);
      var initialScale=Math.min(1,budgetSide/Math.max(sourceW,sourceH));canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(sourceW*initialScale));canvas.height=Math.max(1,Math.round(sourceH*initialScale));
      function paint(target,source){var ctx=target.getContext('2d',{alpha:false});if(!ctx)throw new Error('Браузер не поддерживает подготовку фотографии.');ctx.fillStyle='#fff';ctx.fillRect(0,0,target.width,target.height);ctx.drawImage(source,0,0,target.width,target.height);}
      paint(canvas,bitmap);if(bitmap&&typeof bitmap.close==='function'){bitmap.close();bitmap=null;}
      function encode(quality){return new Promise(function(resolve){canvas.toBlob(resolve,'image/jpeg',quality);});}
      var quality=.72,blob=null;
      for(var i=0;i<8;i++){
        blob=await encode(quality);if(blob&&blob.size<=targetBytes)break;if(!blob)break;
        if(quality>.42){quality=Math.max(.42,quality-.08);continue;}
        var ratio=Math.sqrt(targetBytes/Math.max(blob.size,1))*.91;ratio=Math.max(.62,Math.min(.86,ratio));var nextW=Math.max(1,Math.round(canvas.width*ratio)),nextH=Math.max(1,Math.round(canvas.height*ratio));var shortSide=Math.min(nextW,nextH);if(shortSide<240){var keep=240/Math.max(shortSide,1);nextW=Math.round(nextW*keep);nextH=Math.round(nextH*keep);}if(nextW===canvas.width&&nextH===canvas.height)break;var next=document.createElement('canvas');next.width=nextW;next.height=nextH;paint(next,canvas);canvas.width=1;canvas.height=1;canvas=next;quality=.68;await nextFrame();
      }
      if(!blob)throw new Error('Не удалось подготовить изображение '+file.name);
      if(blob.size>targetBytes*1.12)throw new Error('Фотографию «'+file.name+'» не удалось достаточно сжать. Попробуйте обрезать её или сделать снимок в меньшем разрешении.');
      var name=(file.name||'photo').replace(/\.[^.]+$/,'')+'.jpg';return makeFile(blob,name,'image/jpeg',Date.now());
    }catch(error){if(/image\/(heic|heif)/i.test(file.type||'')&&file.size<=targetBytes)return file;throw error;}
    finally{try{if(bitmap&&typeof bitmap.close==='function')bitmap.close();}catch(_){}if(canvas){canvas.width=1;canvas.height=1;}}
  }
  function imageCanUseOriginal(file,budget){
    var mime=String(file&&file.type||'').toLowerCase(),name=String(file&&file.name||'').toLowerCase();
    var compatible=/^image\/(jpeg|jpg|png|webp)$/.test(mime)||/\.(jpe?g|png|webp)$/.test(name);
    return compatible&&Number(file&&file.size)>0&&Number(file.size)<=Math.floor(budget*1.04);
  }
  function prepareImageItems(items){
    var list=(items||[]).filter(function(x){return x&&x.kind==='image';});if(!list.length)return Promise.resolve([]);setImagePreparing(1);
    imagePreparationChain=imagePreparationChain.then(async function(){
      var readyItems=[],errors=[],budget=imageBudgetForCount(media.filter(function(x){return x.kind==='image';}).length,hostingSafeTotalBytes),completed=0;
      var workers=Math.min(imagePreparationConcurrency(),list.length);
      setStatus('Подготавливаем '+list.length+' фото параллельно: одновременно до '+workers+'.','working');
      await runWithConcurrency(list,workers,async function(item){
        if(media.indexOf(item)<0)return;item.preparationState='working';renderQueue();
        try{
          var prepared=imageCanUseOriginal(item.file,budget)?item.file:await imageToJpeg(item.file,budget);
          item.preparedFile=prepared;item.preparedSize=Number(prepared.size)||0;item.preparedName=prepared.name||item.file.name;item.wasCompressed=prepared!==item.file;item.preparationState='ready';
          if(item.previewUrl)URL.revokeObjectURL(item.previewUrl);
          /* Original multi-megapixel files are never inserted into <img>. Only compact derivatives receive previews. */
          item.previewUrl=item.wasCompressed?URL.createObjectURL(prepared):'';readyItems.push(item);
        }catch(error){errors.push(error&&error.message?error.message:'Не удалось подготовить фотографию.');var idx=media.indexOf(item);if(idx>=0){revokeItem(item);media.splice(idx,1);}}
        completed++;setStatus('Подготовлено фотографий: '+completed+' из '+list.length+'. Обработка идёт в '+workers+' параллельных потока с ограничением памяти.','working');renderQueue();await nextFrame();
      });
      if(readyItems.length)schedulePersistMedia();if(errors.length)setStatus(errors.join(' ')+' Остальные фотографии сохранены.','error');else if(readyItems.length)setStatus('Фотографии готовы. Подготовленные материалы сохранены локально и будут восстановлены после случайной перезагрузки страницы.','success');return readyItems;
    }).finally(function(){setImagePreparing(-1);});return imagePreparationChain;
  }

  async function prepareMedia(options){
    options=options||{};
    var safeTotal=Math.max(0,Number(options.safeTotalBytes)||0),audioPrepared=new Map(),audioBytes=0;
    for(var ai=0;ai<media.length;ai++){
      if(media[ai].kind!=='audio')continue;setStatus('Подготавливаем аудио: '+(ai+1)+' из '+media.length+'.','working');var audioFile=await prepareAudioFile(media[ai]);audioPrepared.set(media[ai].id,audioFile);audioBytes+=Number(audioFile.size)||0;
    }
    var imageItems=media.filter(function(x){return x.kind==='image';}),imageCount=imageItems.length,headroom=48*1024;
    if(safeTotal&&audioBytes+headroom>=safeTotal)throw new Error('Подготовленное аудио занимает почти весь лимит этого сервера. Отправьте аудио отдельно от фотографий.');
    var imageBudget=imageCount?Math.floor(((safeTotal?safeTotal:hostingSafeTotalBytes)-audioBytes-headroom)/imageCount):0;imageBudget=Math.max(IMAGE_MIN_BYTES,Math.min(hostingSafeSingleBytes,IMAGE_MAX_BYTES,imageBudget||IMAGE_MAX_BYTES));
    var imageFiles=new Map(),changed=false,recompress=imageItems.filter(function(item){return !(item.preparedFile&&Number(item.preparedFile.size)<=imageBudget*1.12);});
    imageItems.forEach(function(item){if(recompress.indexOf(item)<0)imageFiles.set(item.id,item.preparedFile);});
    if(recompress.length){
      var done=0,workers=Math.min(imagePreparationConcurrency(),recompress.length);setStatus('Дополнительно сжимаем '+recompress.length+' фото параллельно: одновременно до '+workers+'.','working');
      await runWithConcurrency(recompress,workers,async function(item){
        var current=item.preparedFile||item.file,file=await imageToJpeg(current,imageBudget);item.preparedFile=file;item.preparedSize=Number(file.size)||0;item.preparedName=file.name||item.file.name;item.wasCompressed=true;item.preparationState='ready';if(item.previewUrl)URL.revokeObjectURL(item.previewUrl);item.previewUrl=URL.createObjectURL(file);imageFiles.set(item.id,file);changed=true;done++;setStatus('Дополнительно подготовлено фотографий: '+done+' из '+recompress.length+'.','working');await nextFrame();
      });
    }
    var prepared=[],total=0;
    for(var i=0;i<media.length;i++){
      var item=media[i],file=item.kind==='image'?imageFiles.get(item.id):audioPrepared.get(item.id);if(!file)throw new Error('Не удалось подготовить файл «'+clean(item.file&&item.file.name||'медиа',120)+'».');
      item.preparedSize=Number(file.size)||0;item.preparedName=file.name||item.file.name;total+=item.preparedSize;
      if(item.kind==='audio'&&item.preparedSize>MAX_AUDIO_OUTPUT_BYTES)throw new Error('Подготовленное аудио превышает 1 МБ. Сократите запись.');
      if(total>MAX_TOTAL_BYTES)throw new Error('После подготовки общий объём превышает 7 МБ. Удалите часть файлов или отправьте материалы несколькими запросами.');
      if(safeTotal&&total+headroom>safeTotal)throw new Error('После сжатия запрос всё ещё превышает безопасный лимит хостинга. Оставьте меньше фотографий.');prepared.push({item:item,file:file});
    }
    renderQueue();if(changed)await persistMediaNow();var original=totalOriginalBytes();setStatus('Файлы готовы: '+fmtBytes(original)+' → '+fmtBytes(total)+'. Отправляем уже подготовленные копии без повторной тяжёлой обработки.','working');return prepared;
  }

  function buildMediaForm(prepared,retryContext){
    var form=new FormData(),usage=aiUsageContext();form.append('action','recognize_ration_media');form.append('context',clean($('geminiRationContext')&&$('geminiRationContext').value,800));
    form.append('csrf_token',serviceHealth.csrfToken||'');form.append('ai_user_confirmed_18',usage.user_confirmed_18?'1':'0');form.append('ai_non_clinical_use',usage.non_clinical_use?'1':'0');form.append('ai_media_transfer_consent',usage.media_transfer_consent?'1':'0');form.append('ai_professional_business_use','0');form.append('ai_profile_state',usage.profile_state||'normal');form.append('ai_clinical_profile',usage.clinical_profile?'1':'0');
    retryContext=retryContext||{};if(retryContext.requestId)form.append('client_request_id',clean(retryContext.requestId,80));form.append('client_attempt',String(Math.max(0,Number(retryContext.attempt)||0)));
    form.append('media_meta',JSON.stringify(prepared.map(function(x,index){return {source_id:x.item.id,kind:x.item.kind,meal_code:x.item.meal,label_ru:mealLabel(x.item.meal),filename:clean(x.item.file.name,120),order:index+1};})));
    prepared.forEach(function(x){form.append('media[]',x.file,x.file.name||('media-'+Date.now()));});
    return form;
  }
  function nonJsonError(response,text){
    var raw=String(text||'');var compact=clean(raw.replace(/<[^>]*>/g,' '),220);
    var sizeLike=response.status===413||/request entity too large|payload too large|content too large|post_max_size|upload_max_filesize|client_max_body_size|413\b/i.test(raw);
    var timeoutLike=[502,503,504].indexOf(response.status)>=0||/gateway timeout|timed out|timeout/i.test(raw);
    var message=sizeLike?'Сервер отклонил загрузку из-за ограничения размера. Фотография будет сжата сильнее и отправлена ещё раз.':(timeoutLike?'Сервер не успел обработать фотографию. Повторите запрос через несколько секунд.':'Сервер вернул не-JSON ответ'+(response.status?' (HTTP '+response.status+')':'')+'.');
    if(compact&&!sizeLike&&!timeoutLike)message+=' Ответ сервера: '+compact;
    var error=new Error(message);error.code=sizeLike?'upload_too_large':(timeoutLike?'gateway_timeout':'non_json_response');error.status=response.status;error.responseText=raw;error.retryable=timeoutLike;return error;
  }
  function parseJsonResponseText(text){
    var raw=String(text==null?'':text).replace(/^\uFEFF/,'').trim();
    if(!raw)return null;
    try{return JSON.parse(raw);}catch(_){}
    /* Some shared hosts prepend PHP warnings to an otherwise valid JSON body. */
    var markers=['{\"ok\"','{\"service\"'];var start=-1;
    markers.forEach(function(marker){var i=raw.lastIndexOf(marker);if(i>start)start=i;});
    if(start>=0){try{var recovered=JSON.parse(raw.slice(start));if(recovered&&typeof recovered==='object')return recovered;}catch(_){}}
    return null;
  }
  async function sendPrepared(prepared,retryContext){
    var timeoutController=typeof AbortController!=='undefined'?new AbortController():null,external=activeController&&activeController.signal,timedOut=false,timer=null,onAbort=null;
    if(timeoutController){
      if(external){onAbort=function(){try{timeoutController.abort();}catch(_){}};if(external.aborted)onAbort();else external.addEventListener('abort',onAbort,{once:true});}
      timer=setTimeout(function(){timedOut=true;try{timeoutController.abort();}catch(_){}},CLIENT_REQUEST_TIMEOUT_MS);
    }
    try{
      var response=await fetch(ENDPOINT,{method:'POST',credentials:'same-origin',headers:{'Accept':'application/json','X-Nutrition-CSRF':serviceHealth.csrfToken||''},body:buildMediaForm(prepared,retryContext),signal:timeoutController?timeoutController.signal:external});
      var text=await response.text();var data=parseJsonResponseText(text);
      if(!data)throw nonJsonError(response,text);
      return {response:response,data:data};
    }catch(error){
      if(external&&external.aborted){var aborted=new Error('Распознавание отменено.');aborted.name='AbortError';throw aborted;}
      if(timedOut){var timeoutError=new Error('Сервер распознавания не ответил за '+Math.round(CLIENT_REQUEST_TIMEOUT_MS/1000)+' с. Запрос остановлен, чтобы вкладка не ожидала бесконечно.');timeoutError.code='client_timeout';timeoutError.retryable=true;throw timeoutError;}
      if(error instanceof TypeError||/failed to fetch|networkerror|load failed|fetch failed/i.test(String(error&&error.message||''))){var networkError=new Error('Соединение с сервером распознавания оборвалось до получения ответа. Подготовленные файлы сохранены.');networkError.code='network_fetch_failed';networkError.retryable=true;throw networkError;}
      throw error;
    }finally{if(timer)clearTimeout(timer);if(external&&onAbort)try{external.removeEventListener('abort',onAbort);}catch(_){}}
  }
  function recognitionRequestId(){return 'rr_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);}
  function packetRetryPolicy(packet){
    var response=packet&&packet.response,data=packet&&packet.data||{},status=Number(response&&response.status)||0,code=clean(data.error_code,80),retryAfter=Math.max(0,Math.ceil(Number(data.retry_after_seconds)||0));
    if(/^(?:ai_kill_switch|guard_)/.test(code))return {retry:false,retryAfter:retryAfter,status:status,code:code,maxAttempts:1,reason:data.error||'Gemini временно остановлен серверным защитным контуром.'};
    if([500,502,503,504].indexOf(status)>=0&&data.retryable!==false)return {retry:true,retryAfter:retryAfter,status:status,code:code,maxAttempts:3,reason:data.error||'Gemini временно недоступен.'};
    if(status===429&&data.retryable===true&&!/daily|session_daily_limit|local_rolling_guard/.test(code)&&retryAfter>0&&retryAfter<=60)return {retry:true,retryAfter:retryAfter,status:status,code:code,maxAttempts:2,reason:data.error||'Gemini временно ограничил частоту запросов.'};
    return {retry:false,retryAfter:retryAfter,status:status,code:code,maxAttempts:1,reason:data.error||''};
  }
  function exceptionRetryPolicy(error){
    if(error&&error.name==='AbortError')return {retry:false,maxAttempts:1};
    var status=Number(error&&error.status)||0,code=clean(error&&error.code,80);if(/^(?:ai_kill_switch|guard_)/.test(code))return {retry:false,retryAfter:Math.max(0,Number(error&&error.retryAfter)||0),status:status,code:code,maxAttempts:1,reason:error&&error.message||'Gemini временно остановлен серверным защитным контуром.'};var network=!status&&(error instanceof TypeError||code==='network_fetch_failed'||code==='client_timeout'||/network|fetch|соединени/i.test(String(error&&error.message||'')));
    var retry=network||error&&error.retryable===true||code==='gateway_timeout'||([500,502,503,504].indexOf(status)>=0&&code!=='upload_too_large');
    return {retry:!!retry,status:status,code:code,maxAttempts:network?2:3,reason:error&&error.message||'Не удалось связаться с сервером.'};
  }
  function waitForAutomaticRetry(seconds,nextAttempt,totalAttempts,reason){
    seconds=Math.max(1,Math.min(60,Math.ceil(Number(seconds)||7)));retryCountdownSeconds=seconds;updateRecognizeButton();
    return new Promise(function(resolve,reject){
      var finished=false;function finish(error){if(finished)return;finished=true;if(retryCountdownTimer){clearInterval(retryCountdownTimer);retryCountdownTimer=null;}retryCountdownSeconds=0;updateRecognizeButton();error?reject(error):resolve();}
      function abortCheck(){if(activeController&&activeController.signal&&activeController.signal.aborted){var e=new Error('Распознавание отменено.');e.name='AbortError';finish(e);return true;}return false;}
      function tick(){if(abortCheck())return;if(retryCountdownSeconds<=0){finish();return;}setStatus((reason||'Gemini временно недоступен.')+' Автоматическая попытка '+nextAttempt+' из '+totalAttempts+' через '+retryCountdownSeconds+' с. Аудио и фотографии сохранены.','working');retryCountdownSeconds--;updateRecognizeButton();}
      tick();retryCountdownTimer=setInterval(tick,1000);
    });
  }
  async function sendPreparedWithAutomaticRetry(prepared,requestId){
    var lastPacket=null,lastError=null,allowedAttempts=AUTO_RETRY_MAX_ATTEMPTS;
    for(var attempt=0;attempt<allowedAttempts;attempt++){
      if(attempt>0){var previousPolicy=lastPacket?packetRetryPolicy(lastPacket):exceptionRetryPolicy(lastError);allowedAttempts=Math.min(allowedAttempts,Math.max(1,Number(previousPolicy.maxAttempts)||allowedAttempts));if(attempt>=allowedAttempts)break;var scheduled=AUTO_RETRY_DELAYS_SECONDS[attempt-1]||12;var delay=Math.max(scheduled,Math.min(60,Number(previousPolicy.retryAfter)||0));await waitForAutomaticRetry(delay,attempt+1,allowedAttempts,previousPolicy.reason);}
      setStatus('Gemini обрабатывает материалы. Попытка '+(attempt+1)+' из '+allowedAttempts+'.','working');
      try{
        lastPacket=await sendPrepared(prepared,{requestId:requestId,attempt:attempt});lastError=null;
        if(lastPacket.response.ok&&lastPacket.data&&lastPacket.data.ok===true){lastPacket.clientRetryCount=attempt;return lastPacket;}
        var packetPolicy=packetRetryPolicy(lastPacket);allowedAttempts=Math.min(allowedAttempts,Math.max(1,Number(packetPolicy.maxAttempts)||allowedAttempts));if(!packetPolicy.retry||attempt>=allowedAttempts-1){lastPacket.clientRetryCount=attempt;return lastPacket;}
      }catch(error){
        lastError=error;lastPacket=null;var errorPolicy=exceptionRetryPolicy(error);allowedAttempts=Math.min(allowedAttempts,Math.max(1,Number(errorPolicy.maxAttempts)||allowedAttempts));if(!errorPolicy.retry||attempt>=allowedAttempts-1)throw error;
      }
    }
    if(lastError)throw lastError;return lastPacket;
  }

  function normalize(value){return String(value==null?'':value).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9%]+/gi,' ').replace(/\s+/g,' ').trim();}
  function isServiceMediaName(value){var n=normalize(value).replace(/ /g,'_');if(!n)return true;return /^(?:media|audio|source|item|product|file|recording|upload|файл|аудио|источник|медиа|продукт|позиция)_?\d*$/.test(n)||/^(?:неизвестно|не_распознано|unknown|untitled)$/.test(n);}
  function preparationMatcher(){return window.NutritionPreparationMatching&&window.NutritionPreparationMatching.enabled?window.NutritionPreparationMatching:null;}
  var STOP=new Set(['и','с','со','в','во','на','из','для','без','под','по','к','ко','а','или','примерно','около','порция','кусок','тарелка','блюдо','готовый','готовая','готовое','продукт','упаковка']);
  function stem(token){token=normalize(token);if(token.length<5)return token;return token.replace(/(иями|ями|ами|ого|ему|ому|ыми|ими|ение|енный|енная|енное|овые|овая|овое|ский|ская|ское|ного|ная|ное|ные|ый|ий|ой|ая|яя|ое|ее|ую|юю|ов|ев|ам|ям|ах|ях|ом|ем|а|я|ы|и|у|ю|е|о)$/,'');}
  var STATE_TOKEN_STOP=new Set(['свеж','сыр','жар','обжар','варен','отвар','запеч','печен','грил','копчен','солен','малосол','тушен','сушен','вялен','консерв','готов','приготовлен','заморож']);
  function tokens(value){return normalize(value).split(' ').filter(function(x){return x&&!STOP.has(x);}).map(stem).filter(function(x){return x&&!STATE_TOKEN_STOP.has(x);});}
  function expandQuery(value){var q=normalize(value);var pairs=[['картошка','картофель'],['помидор','томат'],['овсянка','овсяная каша'],['гречка','гречневая каша'],['макароны','паста'],['курица','куриная'],['яичница','яйцо жареное'],['омлет','омлет яйца'],['творожок','творог'],['мюсли','сухой завтрак'],['хлеб черный','хлеб ржаной'],['рыба красная','лосось форель'],['черешня','вишня'],['фруктовый йогурт','йогурт сладкий'],['газировка','газированный напиток'],['кола зеро','кола без сахара'],['темный шоколад','горький шоколад'],['растительное молоко','растительный напиток'],['тунец масло','тунец в масле'],['фасоль томат','фасоль в томатном соусе']];pairs.forEach(function(p){if(q.indexOf(p[0])>=0)q+=' '+p[1];});return q;}
  function bigrams(s){s=normalize(s).replace(/ /g,'_');var out=[];for(var i=0;i<s.length-1;i++)out.push(s.slice(i,i+2));return out;}
  function dice(a,b){var A=bigrams(a),B=bigrams(b);if(!A.length||!B.length)return 0;var counts={};A.forEach(function(x){counts[x]=(counts[x]||0)+1;});var hit=0;B.forEach(function(x){if(counts[x]){hit++;counts[x]--;}});return 2*hit/(A.length+B.length);}
  function categoryMatch(p,hint){var h=normalize(hint);if(!h)return 0;var t=normalize([p.category,p.catalog_category_key,p.hei_category_key,(p.tags||[]).join(' ')].join(' '));var groups=[{h:['овощ','vegetable'],t:['овощ','vegetable','greens','root_vegetables']},{h:['фрукт','ягод','fruit','berry'],t:['фрукт','ягод','fruit','berries']},{h:['мяс','птиц','meat','poultry'],t:['мяс','птиц','meat','protein_foods','meat_eggs']},{h:['рыб','морепродукт','fish','seafood'],t:['рыб','морепродукт','fish','seafood']},{h:['молоч','сыр','йогурт','dairy'],t:['молоч','сыр','йогурт','dairy']},{h:['круп','хлеб','макарон','каша','grain'],t:['круп','хлеб','макарон','grain','bakery']},{h:['напит','сок','чай','кофе','drink'],t:['напит','сок','чай','кофе','drink']},{h:['слад','десерт','sweet'],t:['слад','десерт','sweet']},{h:['готов','салат','суп','блюд','composite','ready'],t:['готов','салат','суп','блюд','ready','composite']}];for(var i=0;i<groups.length;i++){if(groups[i].h.some(function(x){return h.indexOf(x)>=0;})&&groups[i].t.some(function(x){return t.indexOf(x)>=0;}))return 0.12;}return 0;}
  var STATE_GROUPS=[{id:'fried',q:['жар','обжар','fried'],t:['жар','обжар','fried']},{id:'boiled',q:['варен','отвар','boil'],t:['варен','отвар','boil']},{id:'baked',q:['запеч','печен','baked','roast'],t:['запеч','печен','baked','roast']},{id:'grilled',q:['грил','grill'],t:['грил','grill']},{id:'raw',q:['сырой','сырая','сырое','свеж','raw'],t:['сырой','сырая','сырое','свеж','raw']},{id:'dried',q:['сушен','вялен','dried','dehydrat'],t:['сушен','вялен','dried','dehydrat']},{id:'smoked',q:['копчен','smok'],t:['копчен','smok']},{id:'salted',q:['солен','малосол','salt'],t:['солен','малосол','salt']},{id:'stewed',q:['тушен','stew'],t:['тушен','stew']},{id:'canned',q:['консерв','canned'],t:['консерв','canned']},{id:'pureed',q:['пюре','puree'],t:['пюре','puree']},{id:'frozen',q:['заморож','frozen'],t:['заморож','frozen']}];
  function detectState(text,field){text=normalize(text);if(!text)return '';for(var i=0;i<STATE_GROUPS.length;i++){var words=field==='target'?STATE_GROUPS[i].t:STATE_GROUPS[i].q;if(words.some(function(x){return text.indexOf(x)>=0;}))return STATE_GROUPS[i].id;}return '';}
  function preparationBonus(p,prep,query){var requested=detectState([prep,query].filter(Boolean).join(' '),'query');var target=normalize([p.state,p.key,p.name_ru,p.name,(p.tags||[]).join(' ')].join(' '));var candidate=detectState(target,'target');if(requested){if(candidate===requested)return 0.18;if(candidate&&candidate!==requested)return -0.18;return 0;}if(candidate==='raw')return 0.06;if(['dried','canned','pureed','smoked','salted'].indexOf(candidate)>=0)return -0.08;return 0;}
  var FLAVORS=['вишн','череш','клубник','черник','малин','персик','абрикос','манго','ананас','банан','яблок','груш','смород','брусник','голубик','морошк','маракуй','ванил','шоколад','карамел','мед','инжир','кокос','лимон','апельсин','виноград','томат','гриб','сыр','бекон','лук','сметан'];
  function flavorTokens(value){var n=normalize(value);return FLAVORS.filter(function(x){return n.indexOf(x)>=0;});}
  function productFamily(value){var n=normalize(value);if(!n)return '';
    /* Gemini may return either a concrete product name or a broad Russian family label. Normalize both before matching candidates. */
    if(/^(?:переработанн(?:ое|ые) мяс|мясн(?:ые|ой) издел|колбасн(?:ые|ая) издел)/.test(n))return 'processed_meat';if(/^(?:мясо|мясн(?:ой|ые) продукт)/.test(n))return 'meat';if(/^(?:птица|мясо птиц)/.test(n))return 'poultry';if(/^(?:рыба|рыбн(?:ый|ые) продукт)/.test(n))return 'fish';if(/^(?:морепродукт|морск(?:ие|ой) продукт)/.test(n))return 'seafood';if(/^(?:газированн(?:ый|ые) напит|безалкогольн(?:ый|ые) напит)/.test(n))return 'soft_drink';if(/^(?:растительн(?:ый|ые) напит)/.test(n))return 'plant_drink';if(/^(?:бобов(?:ые|ый)|бобовые продукт)/.test(n))return 'legume';if(/^(?:снек|закуск)/.test(n))return 'snack';if(/^(?:соус|заправк)/.test(n))return 'sauce';
    if(/^салат(?:\s|$)/.test(n))return 'salad';if(/^(?:суп|борщ|щи|солянк|окрошк)(?:\s|$)/.test(n))return 'soup';if(/^(?:фасол|нут|чечевиц|горох|бобов|бобы|эдамам)/.test(n))return 'legume';if(/^пицц/.test(n))return 'pizza';if(/^(?:сэндвич|бутерброд|бургер|шаурм)/.test(n))return 'sandwich';if(/гранол|мюсли|хлопья|сухой завтрак/.test(n))return 'breakfast_cereal';
    if(/растительн.*напит|овсян.*напит|соев.*напит|миндальн.*напит|oat drink|soy drink|almond drink/.test(n))return 'plant_drink';
    if(/йогурт|yogurt|yoghurt/.test(n))return 'yogurt';if(/кефир|биокефир/.test(n))return 'kefir';if(/творог|творож/.test(n))return 'curd';if(/сметан/.test(n))return 'sour_cream';if(/сливк/.test(n))return 'cream';if(/(?:^|\s)сыр(?:а|у|ом|е|ы|ов|ный|ная|ное|ные)?(?:\s|$)|cheese/.test(n))return 'cheese';if(/молоко|milk/.test(n))return 'milk';if(/масло сливоч|butter/.test(n))return 'butter';
    if(/майонез/.test(n))return 'mayonnaise';if(/кетчуп|горчиц|соус|заправк|песто|аджик/.test(n))return 'sauce';if(/^(?:масло|oil)\b|масло (?:олив|подсол|кукуруз|льнян|соев|тыквен|виноград|орех)/.test(n))return 'oil';
    if(/шоколад/.test(n))return 'chocolate';if(/конфет|мармелад|зефир|пастил|карамел|цукат/.test(n))return 'confectionery';if(/печенье|вафл|крекер|пряник/.test(n))return 'cookies';if(/морожен/.test(n))return 'ice_cream';if(/чипс|начос|сухарик|снек|попкорн/.test(n))return 'snack';if(/орех|семечк|семена/.test(n))return 'nuts_seeds';
    if(/хлебц/.test(n))return 'crispbread';if(/хлеб|батон|багет|лаваш/.test(n))return 'bread';if(/гранол|мюсли|хлопья|сухой завтрак/.test(n))return 'breakfast_cereal';if(/макарон|паста|спагетти|лапша/.test(n))return 'pasta';if(/мука|отруб/.test(n))return 'flour_bran';if(/рис|греч|овсян.*круп|перлов|пшено|булгур|киноа|крупа|каша/.test(n))return 'grain';
    if(/колбас|сосиск|сардель|ветчин|салями|сервелат|бекон/.test(n))return 'processed_meat';if(/куриц|индейк|утк|гус|птиц/.test(n))return 'poultry';if(/говядин|свинин|баранин|теляти|кролик|мясо|фарш/.test(n))return 'meat';if(/тунец|лосос|форел|треск|минтай|скумбр|сельд|сардин|рыб|горбуш|хек|тилап|пангаси/.test(n))return 'fish';if(/кревет|кальмар|мид|осьминог|морепродукт|морской коктейль/.test(n))return 'seafood';if(/яйцо|омлет|яичниц/.test(n))return 'egg';
    if(/сок|нектар|морс/.test(n))return 'juice';if(/кола|лимонад|газированн.*напит|энергетик/.test(n))return 'soft_drink';if(/вода питьев|минеральн.*вода/.test(n))return 'water';if(/кофе|чай|какао/.test(n))return 'hot_drink';
    if(/фасол|нут|чечевиц|горох|бобов|\bбоб|эдамам/.test(n))return 'legume';if(/яблок|банан|груш|апельсин|мандарин|виноград|ананас|манго|персик|абрикос|ягод|клубник|черник|вишн|фрукт/.test(n))return 'fruit';if(/огур|томат|помидор|капуст|морков|свекл|перец|баклажан|кабач|овощ|брокколи|шпинат|кукуруз|гриб/.test(n))return 'vegetable';
    if(/суп|борщ|щи|солянк|окрошк/.test(n))return 'soup';if(/салат/.test(n))return 'salad';if(/пицц/.test(n))return 'pizza';if(/сэндвич|бутерброд|бургер|шаурм/.test(n))return 'sandwich';if(/готов.*блюд|рагу|плов|котлет|фрикадел|запеканк/.test(n))return 'prepared_food';return '';}
  function familyCompatible(a,b){
    if(!a||!b)return true;if(a===b)return true;
    var broad={prepared_food:['soup','salad','pizza','sandwich'],bread:['crispbread'],crispbread:['bread'],sauce:['mayonnaise','sour_cream','yogurt','cream'],mayonnaise:['sauce'],sour_cream:['sauce'],yogurt:['sauce'],cream:['sauce'],fish:['seafood'],seafood:['fish']};
    return !!(broad[a]&&broad[a].indexOf(b)>=0);
  }
  function variantFlags(value,nutrition){var n=normalize(value),nu=nutrition||{};return {sweet:/слад|подслащ|фрукт|ягод|десерт|с сахар|вкус/.test(n)||Number(nu.sugar)>=8||Number(nu.carbs)>=12,sugar_free:/без сахара|zero|зеро|no sugar|неслад/.test(n),greek:/греческ|greek/.test(n),fruit:flavorTokens(n).length>0,high_protein:/высокобел|high pro|protein/.test(n)||Number(nu.protein)>=8,lactose_free:/безлактоз/.test(n),plant_based:/растительн|веган|соев|овсян|миндал/.test(n),smoked:/копчен|smok/.test(n),salted:/солен|малосол/.test(n),canned:/консерв/.test(n),oil_packed:/в масле|маслян.*залив/.test(n),water_packed:/в воде|собственн.*сок|натуральн.*консерв/.test(n),tomato_sauce:/томатн.*соус|в томате/.test(n),wholegrain:/цельнозер|whole grain|с отруб/.test(n),dark_chocolate:/темн.*шоколад|горьк.*шоколад|70% какао/.test(n),milk_chocolate:/молочн.*шоколад/.test(n),light:/легк|низкожир|обезжир|0[,.]?\d*%/.test(n),vegan:/веган|постн/.test(n),sparkling:/газирован/.test(n)};}
  function variantAdjustment(target,candidate,family){var score=0,hard=['plant_based','sugar_free','dark_chocolate','milk_chocolate'];hard.forEach(function(k){if(target[k]&&!candidate[k])score-=.48;});if(target.sweet&&candidate.sweet)score+=.16;if(target.sweet&&!candidate.sweet)score-=.48;if(!target.sweet&&target.sugar_free&&candidate.sweet)score-=.42;if(target.greek&&candidate.greek)score+=.24;if(!target.greek&&target.sweet&&candidate.greek)score-=.38;if(target.high_protein&&candidate.high_protein)score+=.14;if(target.lactose_free&&!candidate.lactose_free)score-=.22;if(target.smoked&&!candidate.smoked)score-=.20;if(target.salted&&!candidate.salted)score-=.16;if(target.canned&&!candidate.canned)score-=.12;if(target.oil_packed&&!candidate.oil_packed)score-=.26;if(target.water_packed&&candidate.oil_packed)score-=.28;if(target.tomato_sauce&&!candidate.tomato_sauce)score-=.26;if(target.wholegrain&&!candidate.wholegrain)score-=.22;if(target.vegan&&!candidate.vegan)score-=.32;if(family==='soft_drink'&&target.sugar_free&&!candidate.sugar_free)score-=.60;return score;}
  function num(v){v=Number(v);return Number.isFinite(v)?v:null;}
  function recognitionNutrition(r){var n=r&&r.nutrition_per_100g||{};return {kcal:num(n.kcal),protein:num(n.protein),fat:num(n.fat),carbs:num(n.carbs),sugar:num(n.sugar)};}
  function productNutrition(p){return {kcal:num(p.kcal),protein:num(p.protein_per_100g),fat:num(p.fat_per_100g),carbs:num(p.carbs_per_100g),sugar:num(p.sugar_per_100g)};}
  function nutritionWeights(family){if(['meat','poultry','fish','seafood','processed_meat','egg'].indexOf(family)>=0)return {kcal:.20,protein:.36,fat:.34,carbs:.10,sugar:0};if(['oil','mayonnaise'].indexOf(family)>=0)return {kcal:.34,protein:0,fat:.56,carbs:.10,sugar:0};if(['juice','soft_drink','plant_drink','milk','kefir'].indexOf(family)>=0)return {kcal:.22,protein:.14,fat:.14,carbs:.28,sugar:.22};if(family==='yogurt'||family==='curd')return {kcal:.15,protein:.25,fat:.20,carbs:.25,sugar:.15};if(['chocolate','confectionery','cookies','snack','ice_cream'].indexOf(family)>=0)return {kcal:.25,protein:.08,fat:.25,carbs:.24,sugar:.18};if(['bread','crispbread','breakfast_cereal','pasta','grain','flour_bran'].indexOf(family)>=0)return {kcal:.24,protein:.12,fat:.14,carbs:.36,sugar:.14};return {kcal:.20,protein:.25,fat:.15,carbs:.30,sugar:.10};}
  function nutritionSimilarity(p,recognition,family){var target=recognitionNutrition(recognition),cand=productNutrition(p),weights=nutritionWeights(family||'');var tolerances={kcal:Math.max(15,(target.kcal||0)*.16),protein:Math.max(.8,(target.protein||0)*.25),fat:Math.max(.7,(target.fat||0)*.28),carbs:Math.max(1.5,(target.carbs||0)*.18),sugar:Math.max(1.5,(target.sugar||0)*.22)};var sum=0,w=0,parts=[];Object.keys(weights).forEach(function(k){var wt=weights[k],a=target[k],b=cand[k];if(!wt||a==null||b==null)return;var c=Math.exp(-Math.abs(a-b)/tolerances[k]);sum+=c*wt;w+=wt;parts.push({key:k,target:a,candidate:b,closeness:c});});return {score:w?sum/w:0,available:w>0,parts:parts};}
  function isSweetRecognition(query,r){var n=normalize([query,r&&r.exact_product_name,r&&r.flavor,r&&r.category_hint].filter(Boolean).join(' '));return variantFlags(n,recognitionNutrition(r)).sweet;}
  function isSweetProduct(p,text){return variantFlags(text,productNutrition(p)).sweet||Number(p.added_sugar||0)>0.5;}
  function packageWeightFromText(text){var m=normalize(text).match(/(?:^|\s)(\d{2,4})\s*(?:г|гр|g|мл|ml)(?:\s|$)/);return m?Number(m[1]):null;}
  function fatPercentFromText(text){var m=normalize(text).match(/(?:^|\s)(\d{1,2}(?:[.,]\d+)?)\s*%/);return m?Number(String(m[1]).replace(',','.')):null;}
  var productIndex=null;
  function buildProductIndex(){if(productIndex&&productIndex.length)return productIndex;var items=window.DB&&Array.isArray(window.DB.items)?window.DB.items:[];productIndex=items.filter(function(p){return p&&p.key&&p.hidden_from_search!==true;}).map(function(p){var aliases=Array.isArray(p.search_aliases)?p.search_aliases.join(' '):'';var tags=Array.isArray(p.tags)?p.tags.join(' '):String(p.tags||'');var raw=[p.name_ru,p.name,p.key,aliases,tags,p.state,p.category,p.catalog_category_key,p.hei_category_key].filter(Boolean).join(' ');var text=normalize(raw),primaryName=normalize(p.name_ru||p.name||p.key),family=productFamily(primaryName)||productFamily(text),parsedFat=fatPercentFromText(primaryName);if(parsedFat==null&&['mayonnaise','oil','butter','sour_cream','cream','milk','yogurt','kefir'].indexOf(family)>=0)parsedFat=num(p.fat_per_100g);return {p:p,name:primaryName,text:text,tokens:new Set(tokens(text)),family:family,flavors:flavorTokens(primaryName),flags:variantFlags(primaryName,productNutrition(p)),package_grams:packageWeightFromText(primaryName),fat_percent:parsedFat};});return productIndex;}
  function componentRoleLabel(role){var labels={base:'Основа',protein:'Основная начинка',vegetable:'Овощная часть',fruit:'Фруктовая часть',sauce:'Соус или заправка',dairy:'Молочная часть',topping:'Добавка',other:'Компонент',dish:'Блюдо целиком'};return labels[role]||'Компонент';}
  function componentAnalogBonus(row,query,recognition,family){
    var q=normalize([query,recognition&&recognition.exact_product_name,(recognition&&recognition.alternate_search_terms||[]).join(' ')].join(' '));var role=clean(recognition&&recognition.component_role,30);var key=String(row.p&&row.p.key||'');var score=0;
    if(role==='base'&&family==='bread'){
      if(/ржан|черн|темн/.test(q)){if(/^rye_bread(?:_|$)/.test(key)||key==='rye_wheat_bread')score+=.42;else if(key==='seeded_grain_bread')score+=.12;}
      if(/зернов|цельнозер|семен/.test(q)&&key==='seeded_grain_bread')score+=.42;
    }
    if(role==='vegetable'&&/огур/.test(q)){if(key==='cucumber_raw')score+=.48;if(/pickl|марин|солен/.test(key+row.name)&&!/марин|солен/.test(q))score-=.34;}
    if(role==='protein'&&family==='fish'&&(/тунец/.test(q)||/рыбн.*(?:намаз|пашт)/.test(q))){if(key==='tuna_canned_water'||key==='tuna_canned_water_spp')score+=.38;if(key==='tuna_canned_oil_spp'&&!/масл/.test(q))score-=.16;}
    if(role==='sauce'&&/(бел|майонез|йогурт|сливоч|сметан|соус)/.test(q)){
      if(row.family==='mayonnaise')score+=.28;if(key==='mayonnaise_light')score+=.16;if(/йогурт/.test(q)&&row.family==='yogurt')score+=.22;if(/сметан/.test(q)&&row.family==='sour_cream')score+=.22;
    }
    return score;
  }
  function matchProducts(query,prep,hint,alternates,limit,recognition){
    recognition=recognition||{};
    if(!recognition.preparation_state&&prep)recognition.preparation_state=prep;
    if(!recognition.observed_name_ru&&query)recognition.observed_name_ru=query;
    var prepApi=preparationMatcher();var prepResolution=prepApi?prepApi.resolveRecognition(recognition,query):null;
    var identity=[query,recognition.exact_product_name,recognition.brand,recognition.flavor,recognition.product_family_hint,recognition.product_family].filter(Boolean).join(' ');var primary=expandQuery(identity);var altValues=Array.isArray(alternates)?alternates:[];var q=expandQuery([identity].concat(altValues).join(' '));var qt=tokens(q),qset=new Set(qt);if(!primary)return [];
    var requestedFamily=productFamily(recognition.product_family_hint)||productFamily(recognition.product_family)||productFamily([identity,hint].join(' '));var requestFlavors=flavorTokens([identity,hint].join(' '));var targetFlags=variantFlags([identity,hint].join(' '),recognitionNutrition(recognition));var brand=normalize(recognition.brand||'');var targetPackage=num(recognition.package_grams);var targetFat=num(recognition.fat_percent);var nutritionConfidence=clamp(Number(recognition.nutrition_confidence)||0,0,1);var probe=nutritionSimilarity({},recognition,requestedFamily),hasNutrition=probe.available&&nutritionConfidence>0.2;var componentRole=clean(recognition.component_role,30);var altNorms=altValues.map(normalize).filter(Boolean);
    var results=buildProductIndex().map(function(row){
      if(requestedFamily&&row.family&&!familyCompatible(requestedFamily,row.family))return null;
      if(componentRole&&['prepared_food','soup','salad','pizza','sandwich'].indexOf(row.family)>=0)return null;
      var prepAssessment=prepApi?prepApi.assessProduct(row.p.key,recognition,query):null;if(prepAssessment&&prepAssessment.hardReject)return null;
      var score=0,name=row.name,nq=normalize(query);if(name===nq)score+=1.0;else if(nq&&name.startsWith(nq))score+=.68;else if(nq&&name.indexOf(nq)>=0)score+=.52;else if(primary.indexOf(name)>=0&&name.length>4)score+=.38;
      if(altNorms.indexOf(name)>=0)score+=.46;
      var overlap=0;qset.forEach(function(t){if(row.tokens.has(t))overlap++;});var union=Math.max(1,new Set([].concat(Array.from(qset),Array.from(row.tokens))).size);score+=(overlap/union)*.54;score+=dice(primary,name)*.24;score+=preparationBonus(row.p,prep,query);score+=categoryMatch(row.p,hint);if(requestedFamily&&row.family===requestedFamily)score+=.24;if((Array.isArray(row.p.search_aliases)?row.p.search_aliases:[]).some(function(a){return normalize(a)===nq;}))score+=.30;if(brand&&row.text.indexOf(brand)>=0)score+=.28;
      score+=variantAdjustment(targetFlags,row.flags,requestedFamily);var flavorHit=requestFlavors.filter(function(x){return row.flavors.indexOf(x)>=0;});if(flavorHit.length)score+=.36;if(requestFlavors.length&&row.flavors.length&&!flavorHit.length)score-=.22;
      var ns=nutritionSimilarity(row.p,recognition,requestedFamily);if(ns.available&&hasNutrition)score+=ns.score*.72*(.30+.70*nutritionConfidence);if(targetPackage&&row.package_grams){var pd=Math.abs(targetPackage-row.package_grams)/Math.max(targetPackage,1);if(pd<=.08)score+=.08;else if(pd<=.20)score+=.03;else if(pd>.40)score-=.06;}if(targetFat!=null&&row.fat_percent!=null){var fd=Math.abs(targetFat-row.fat_percent);if(fd<=.3)score+=.22;else if(fd<=1)score+=.09;else if(fd>=3)score-=.18;}
      score+=componentAnalogBonus(row,q,recognition,requestedFamily);if(prepAssessment)score+=prepAssessment.boost||0;
      var reason=[];if(prepAssessment&&prepAssessment.reason)reason.push(prepAssessment.reason);if(ns.available&&hasNutrition)reason.push(ns.score>=.84?'КБЖУ очень близки':(ns.score>=.64?'КБЖУ близки':'КБЖУ отличаются'));if(flavorHit.length)reason.push('совпадает вариант');if(brand&&row.text.indexOf(brand)>=0)reason.push('совпадает бренд');if(requestedFamily&&row.family===requestedFamily)reason.push(componentRole?'подходит для этого компонента':'тот же тип продукта');if(targetFat!=null&&row.fat_percent!=null&&Math.abs(targetFat-row.fat_percent)<=1)reason.push('близкая жирность');return {key:row.p.key,name:row.p.name_ru||row.p.name||row.p.key,score:Math.max(0,Math.min(1.25,score)),product:row.p,nutritionScore:ns.available&&hasNutrition?ns.score:null,matchReason:reason.join(' · '),isAnalog:!(brand&&row.text.indexOf(brand)>=0),family:row.family,exactPreparationMatch:!!(prepAssessment&&prepAssessment.exact),preparationResolution:prepAssessment&&prepAssessment.resolution||prepResolution};
    }).filter(function(x){return x&&x.score>.08;}).sort(function(a,b){if(a.exactPreparationMatch!==b.exactPreparationMatch)return a.exactPreparationMatch?-1:1;return b.score-a.score||String(a.name).localeCompare(String(b.name),'ru');}).slice(0,limit||6);
    if(!(results.length&&results[0].score>=.20))results=[];results.preparationResolution=prepResolution;results.requiresConfirmation=!!(prepResolution&&prepResolution.requiresConfirmation);results.exactPreparationKey=prepResolution&&prepResolution.exactKey||'';
    return results;
  }
  function autoSelectKey(candidates,componentRole,options){options=options||{};var first=candidates&&candidates[0],second=candidates&&candidates[1];if(!first||options.requiresConfirmation||candidates.requiresConfirmation){if(candidates)candidates.autoSelectionReason='confirmation_required';return '';}var recognitionConfidence=Number(options.recognitionConfidence);if(Number.isFinite(recognitionConfidence)&&recognitionConfidence<.55){candidates.autoSelectionReason='low_recognition_confidence';return '';}var threshold=componentRole?.34:.42;if(first.exactPreparationMatch)threshold=Math.min(threshold,.34);if(candidates.exactPreparationKey&&first.key!==candidates.exactPreparationKey){candidates.autoSelectionReason='exact_preparation_key_not_first';return '';}var margin=second?first.score-second.score:first.score;if(!first.exactPreparationMatch&&second&&margin<.08){candidates.autoSelectionReason='candidate_margin_too_small';return '';}if(first.score<threshold){candidates.autoSelectionReason='candidate_score_too_low';return '';}candidates.autoSelectionReason='accepted';candidates.autoSelectionMargin=margin;return first.key;}
  function samePackagedIdentity(a,b){var ar=a.recognition||{},br=b.recognition||{};if(a.dish_group_id||b.dish_group_id)return false;if(a.meal_code&&b.meal_code&&a.meal_code!==b.meal_code)return false;if(ar.photo_group_id&&br.photo_group_id){if(ar.photo_group_id===br.photo_group_id)return true;return false;}if(Math.min(Number(ar.same_product_confidence)||0,Number(br.same_product_confidence)||0)<.82)return false;var brandA=normalize(ar.brand),brandB=normalize(br.brand),nameA=normalize(ar.exact_product_name||a.observed_name),nameB=normalize(br.exact_product_name||b.observed_name);if(!brandA||!brandB||brandA!==brandB||!nameA||!nameB)return false;var pkgA=num(ar.package_grams),pkgB=num(br.package_grams);if(pkgA&&pkgB&&Math.abs(pkgA-pkgB)/Math.max(pkgA,pkgB)>.08)return false;return dice(nameA,nameB)>=.82;}
  function mergeDraftRows(a,b){
    var order={explicit:5,package_net_weight:4,visual_estimate:3,standard_portion:2,unknown:1};
    var preferred=(order[b.grams_source]||0)>(order[a.grams_source]||0)?b:a;
    var src=Array.from(new Set([].concat(a.source_ids||[a.source_id],b.source_ids||[b.source_id]).filter(Boolean)));
    var transcripts=Array.from(new Set([].concat(a.source_transcripts||[],a.source_transcript||[],b.source_transcripts||[],b.source_transcript||[]).map(function(x){return clean(x,800);}).filter(Boolean))).slice(0,8);
    var issues=Array.from(new Set([].concat(a.recognition_issue_codes||[],a.recognition_issue_code||[],b.recognition_issue_codes||[],b.recognition_issue_code||[]).map(function(x){return clean(x,60);}).filter(Boolean))).slice(0,12);
    var conflictFields=['brand','exact_product_name','barcode','food_family_id','preparation_method','exact_variant_key'];
    var conflicts=[];
    conflictFields.forEach(function(k){var av=clean(a.recognition&&a.recognition[k],180),bv=clean(b.recognition&&b.recognition[k],180);if(av&&bv&&normalize(av)!==normalize(bv))conflicts.push(k);});
    if(conflicts.length&&issues.indexOf('multi_view_attribution_conflict')<0)issues.unshift('multi_view_attribution_conflict');
    a.source_ids=src;a.source_id=src[0]||a.source_id;a.merged_source_count=src.length;
    a.source_transcripts=transcripts;a.source_transcript=clean(transcripts.join(' / '),800);
    a.grams=preferred.grams;a.grams_source=preferred.grams_source;a.recognition_confidence=Math.max(a.recognition_confidence,b.recognition_confidence);
    Object.keys(b.recognition||{}).forEach(function(k){var av=a.recognition[k],bv=b.recognition[k];if((av==null||av===''||(typeof av==='object'&&!Object.keys(av).length))&&bv!=null&&bv!=='')a.recognition[k]=bv;});
    if(a.recognition)a.recognition.source_transcript_ru=a.source_transcript;
    a.requires_user_confirmation=!!(a.requires_user_confirmation||b.requires_user_confirmation||issues.length||conflicts.length);
    if(a.requires_user_confirmation){a.manualConfirmed=false;a.include=false;a.attribution_status='review_required';}
    a.recognition_issue_codes=issues;a.recognition_issue_code=issues[0]||'';
    a.notes=clean([a.notes,b.notes,src.length>1?'Объединены разные ракурсы одного продукта.':'',conflicts.length?'Найдены противоречия между ракурсами: '+conflicts.join(', ')+'.':''].filter(Boolean).join(' · '),320);
    a.alternates=Array.from(new Set([].concat(a.alternates||[],b.alternates||[]))).slice(0,5);
    a.candidates=matchProducts(a.observed_name,a.preparation,a.category_hint,a.alternates,8,a.recognition);
    if(a.requires_user_confirmation)a.candidates.requiresConfirmation=true;
    a.selectedKey=autoSelectKey(a.candidates,a.component_role,{recognitionConfidence:a.recognition_confidence,requiresConfirmation:a.requires_user_confirmation});
    return a;
  }
  function deduplicateRows(rows){var out=[];(rows||[]).forEach(function(row){var hit=out.find(function(x){return samePackagedIdentity(x,row);});if(hit)mergeDraftRows(hit,row);else out.push(row);});return out;}
  function localCompositeSpecs(row){
    var text=normalize([row.observed_name,row.notes,(row.alternates||[]).join(' ')].join(' '));var family=productFamily(row.observed_name);if(row.dish_group_id||row.component_role||(row.recognition&&row.recognition.brand))return [];
    if(family!=='sandwich'&&!/(бутерброд|сэндвич|тост|брускетт|бургер|шаурм)/.test(text))return [];
    var specs=[];function add(name,role,pFamily,weight,alts,hint){if(specs.some(function(x){return x.role===role&&normalize(x.name)===normalize(name);} ))return;specs.push({name:name,role:role,family:pFamily,weight:weight,alternates:alts||[],hint:hint||''});}
    if(/лаваш/.test(text))add('Лаваш','base','bread',.40,['Лаваш тонкий'],'хлеб и зерновые');
    else if(/ржан|черн|темн/.test(text))add('Хлеб ржаной','base','bread',.40,['Хлеб ржано-пшеничный','Хлеб зерновой с семенами'],'хлеб и зерновые');
    else if(/зернов|цельнозер|семен/.test(text))add('Хлеб зерновой с семенами','base','bread',.40,['Хлеб цельнозерновой','Хлеб ржаной'],'хлеб и зерновые');
    else if(/батон|бел.*хлеб|пшеничн.*хлеб/.test(text))add('Хлеб пшеничный','base','bread',.40,['Батон нарезной'],'хлеб и зерновые');
    else add('Хлеб','base','bread',.40,['Хлеб ржаной','Хлеб пшеничный'],'хлеб и зерновые');
    if(/тунец/.test(text))add('Тунец консервированный в воде, без жидкости','protein','fish',.28,['Тунец натуральный','Тунец консервированный'],'рыба');
    else if(/рыб|лосос|форел|семг|горбуш|паштет.*рыб|рыб.*паштет|рыбн.*намаз/.test(text))add('Рыбная намазка','protein','fish',.28,['Тунец консервированный в воде, без жидкости','Рыба консервированная'],'рыба');
    else if(/куриц/.test(text))add('Курица, готовая','protein','poultry',.28,['Куриная грудка, готовая'],'птица');
    else if(/индейк/.test(text))add('Индейка, готовая','protein','poultry',.28,['Филе индейки, готовое'],'птица');
    else if(/ветчин|колбас|сосиск|бекон/.test(text))add('Мясное изделие','protein','processed_meat',.28,['Ветчина','Колбаса варёная'],'переработанное мясо');
    else if(/сыр/.test(text))add('Сыр','protein','cheese',.28,['Сыр полутвёрдый'],'молочные продукты');
    else if(/яйц|омлет/.test(text))add('Яйцо приготовленное','protein','egg',.28,['Яйцо варёное'],'яйца');
    if(/огур/.test(text))add('Огурцы (сырые)','vegetable','vegetable',.23,['Огурец свежий'],'овощи');
    if(/томат|помидор/.test(text))add('Помидоры (сырые)','vegetable','vegetable',.18,['Томат свежий'],'овощи');
    if(/салатн.*лист|лист.*салат|зелень|руккол|шпинат/.test(text))add('Листовая зелень','vegetable','vegetable',.10,['Салат листовой','Шпинат свежий'],'овощи');
    if(/капуст/.test(text))add('Капуста свежая','vegetable','vegetable',.14,['Капуста белокочанная'],'овощи');
    if(/морков/.test(text))add('Морковь (сырая)','vegetable','vegetable',.12,['Морковь свежая'],'овощи');
    if(/перец/.test(text))add('Перец сладкий (сырой)','vegetable','vegetable',.12,['Болгарский перец'],'овощи');
    if(/майонез/.test(text))add(/легк/.test(text)?'Майонез лёгкий':'Майонез, классический','sauce','mayonnaise',.09,['Белый соус'],'соус');
    else if(/йогурт.*соус|йогуртов.*заправ/.test(text))add('Йогурт натуральный, без сахара','sauce','yogurt',.09,['Йогуртовый соус','Сметана 10%'],'соус');
    else if(/сметан/.test(text))add('Сметана','sauce','sour_cream',.09,['Сметана 10%','Сметана 15%'],'соус');
    else if(/бел.*соус|соус.*бел|соус|заправ/.test(text))add('Белый соус','sauce','sauce',.09,['Майонез лёгкий','Йогурт натуральный, без сахара','Сметана 10%'],'соус');
    return specs.length>=2?specs:[];
  }
  function decomposeCompositeRow(row){
    var specs=localCompositeSpecs(row);if(specs.length<2)return [row];var total=Math.max(specs.length,Math.round(Number(row.grams)||100));var sum=specs.reduce(function(a,x){return a+x.weight;},0)||1;var allocated=[],used=0;
    specs.forEach(function(spec,i){var grams=i===specs.length-1?Math.max(1,total-used):Math.max(1,Math.round(total*spec.weight/sum));allocated.push(grams);used+=grams;});if(used!==total)allocated[allocated.length-1]=Math.max(1,allocated[allocated.length-1]+(total-used));
    var group='dish_'+row.id;return specs.map(function(spec,i){var rec={brand:'',exact_product_name:spec.name,flavor:'',package_grams:null,fat_percent:null,barcode:'',product_family:spec.family,photo_group_id:'',same_product_confidence:0,nutrition_per_100g:{},nutrition_confidence:0,nutrition_basis:'',component_role:spec.role,alternate_search_terms:spec.alternates.slice(0,5)};var candidates=matchProducts(spec.name,row.preparation,spec.hint,spec.alternates,8,rec);return {id:row.id+'_component_'+(i+1),include:row.include!==false,meal_label:row.meal_label,meal_code:row.meal_code,source_id:row.source_id,source_ids:(row.source_ids||[]).slice(),source_transcripts:(row.source_transcripts||[]).slice(),source_transcript:row.source_transcript||'',merged_source_count:row.merged_source_count,source_type:row.source_type,observed_name:spec.name,preparation:row.preparation,category_hint:spec.hint,grams:allocated[i],grams_source:row.grams_source==='explicit'?'visual_estimate':row.grams_source,recognition_confidence:Math.min(Number(row.recognition_confidence)||.55,.72),notes:clean('Компонент автоматически выделен из распознанного составного блюда; проверьте распределение массы. '+(row.notes||''),320),alternates:spec.alternates.slice(0,5),recognition:rec,candidates:candidates,selectedKey:autoSelectKey(candidates,spec.role),dish_group_id:group,dish_name:row.observed_name,component_role:spec.role,component_index:i+1,component_count:specs.length,component_confidence:.62,decomposition_source:'local_name_fallback'};});
  }
  function expandCompositeRows(rows){var out=[];(rows||[]).forEach(function(row){var expanded=decomposeCompositeRow(row);expanded.forEach(function(x){out.push(x);});});return out;}
  function removeCompositeRoots(rows){var groups={};(rows||[]).forEach(function(r){if(r.dish_group_id)(groups[r.dish_group_id]||(groups[r.dish_group_id]=[])).push(r);});return (rows||[]).filter(function(r){var g=r.dish_group_id&&groups[r.dish_group_id];if(!g||g.length<2)return true;var components=g.filter(function(x){return x.component_role&&x.component_role!=='dish';});if(components.length<2)return true;return !(r.component_role==='dish'||(!r.component_role&&normalize(r.observed_name)===normalize(r.dish_name)));});}
  function normalizeComponentGroups(rows){var groups={};(rows||[]).forEach(function(r){if(r.dish_group_id)(groups[r.dish_group_id]||(groups[r.dish_group_id]=[])).push(r);});Object.keys(groups).forEach(function(k){groups[k].sort(function(a,b){return (Number(a.component_index)||999)-(Number(b.component_index)||999);});groups[k].forEach(function(r,i){r.component_index=i+1;r.component_count=groups[k].length;});});return rows;}
  function normalizeServerResult(result){
    var meals=Array.isArray(result&&result.meals)?result.meals:[];var rows=[];
    meals.forEach(function(meal,mi){
      var label=clean(meal&&meal.label_ru,60)||mealLabel(meal&&meal.meal_code)||('Приём '+(mi+1));
      (Array.isArray(meal&&meal.items)?meal.items:[]).forEach(function(item){
        var rawObserved=clean(item&&item.observed_name_ru,160)||'Название продукта не распознано';
        var issueCodes=[];(Array.isArray(item&&item.recognition_issue_codes)?item.recognition_issue_codes:[]).forEach(function(x){x=clean(x,60);if(x&&issueCodes.indexOf(x)<0)issueCodes.push(x);});var singleIssue=clean(item&&item.recognition_issue_code,60);if(singleIssue&&issueCodes.indexOf(singleIssue)<0)issueCodes.unshift(singleIssue);
        var serverReview=!!(item&&item.requires_user_confirmation),serviceName=isServiceMediaName(rawObserved);if(serviceName&&issueCodes.indexOf('service_name_leak')<0)issueCodes.unshift('service_name_leak');var requiresConfirmation=serverReview||serviceName||issueCodes.length>0;
        var observed=serviceName?'Название продукта не распознано':rawObserved;
        var grams=clamp(item&&item.estimated_grams,1,5000),rec=clamp(item&&item.confidence,0,1);var sourceIds=Array.isArray(item&&item.source_ids)?item.source_ids.map(function(x){return clean(x,60);}).filter(Boolean):[];var primary=clean(item&&item.source_id,60);if(primary&&sourceIds.indexOf(primary)<0)sourceIds.unshift(primary);var componentRole=clean(item&&item.component_role,30);var itemAlternates=Array.isArray(item&&item.alternate_search_terms)?item.alternate_search_terms.slice(0,5):[];
        var recognition={
          observed_name_ru:observed,source_transcript_ru:clean(item&&item.source_transcript_ru,800),brand:clean(item&&item.brand,100),exact_product_name:clean(item&&item.exact_product_name,180),flavor:clean(item&&item.flavor,100),package_grams:num(item&&item.package_grams),fat_percent:num(item&&item.fat_percent),barcode:clean(item&&item.barcode,40),product_family:clean(item&&item.product_family,80),product_family_hint:clean(item&&item.product_family_hint,100),food_family_id:clean(item&&item.food_family_id,100),family_match_status:clean(item&&item.family_match_status,30),preparation_match_status:clean(item&&item.preparation_match_status,30),exact_variant_key:clean(item&&item.exact_variant_key,120),preparation_candidate_keys:Array.isArray(item&&item.preparation_candidate_keys)?item.preparation_candidate_keys.slice(0,12):[],photo_group_id:clean(item&&item.photo_group_id,60),same_product_confidence:clamp(item&&item.same_product_confidence,0,1),nutrition_per_100g:item&&item.nutrition_per_100g||{},nutrition_confidence:clamp(item&&item.nutrition_confidence,0,1),nutrition_basis:clean(item&&item.nutrition_basis,300),component_role:componentRole,alternate_search_terms:itemAlternates,
          preparation_state:clean(item&&item.preparation_state,80),preparation_method:clean(item&&item.preparation_method,40),preparation_confidence:clamp(item&&item.preparation_confidence,0,1),added_fat_mode:clean(item&&item.added_fat_mode,40),skin_state:clean(item&&item.skin_state,40),breading_state:clean(item&&item.breading_state,40),drain_state:clean(item&&item.drain_state,40),doneness_state:clean(item&&item.doneness_state,40),storage_state:clean(item&&item.storage_state,40),weight_basis_hint:clean(item&&item.weight_basis_hint,50),consumption_scope:clean(item&&item.consumption_scope,30)
        };
        var canMatch=!serviceName&&observed!=='Название продукта не распознано';var candidates=canMatch?matchProducts(observed,recognition.preparation_state,item&&item.category_hint,itemAlternates,8,recognition):[];if(requiresConfirmation)candidates.requiresConfirmation=true;
        var prepResolution=candidates.preparationResolution||(preparationMatcher()?preparationMatcher().resolveRecognition(recognition,observed):null);var preparationReview=!!(prepResolution&&prepResolution.requiresConfirmation&&prepResolution.intent&&prepResolution.intent.methodRequested);var rowRequiresConfirmation=requiresConfirmation||preparationReview;
        var preparationIssue=preparationReview?(prepResolution.status==='not_found'?'preparation_variant_not_found':(prepResolution.status==='ambiguous'||prepResolution.status==='compatible_method_class'?'preparation_variant_ambiguous':(prepResolution.status==='family_conflict'?'family_name_conflict':'preparation_variant_confirmation_required'))):'';if(preparationIssue&&issueCodes.indexOf(preparationIssue)<0)issueCodes.push(preparationIssue);
        var selected=autoSelectKey(candidates,componentRole,{requiresConfirmation:rowRequiresConfirmation,recognitionConfidence:rec});
        rows.push({id:'draft_'+(uid++),include:!rowRequiresConfirmation,manualConfirmed:false,requires_user_confirmation:rowRequiresConfirmation,recognition_issue_code:issueCodes[0]||'',recognition_issue_codes:issueCodes,attribution_status:rowRequiresConfirmation?'review_required':'validated',meal_label:label,meal_code:clean(meal&&meal.meal_code,40),source_id:sourceIds[0]||primary,source_ids:sourceIds,source_transcripts:recognition.source_transcript_ru?[recognition.source_transcript_ru]:[],merged_source_count:Math.max(1,sourceIds.length),source_type:clean(item&&item.source_type,20)||'mixed',observed_name:observed,raw_observed_name:rawObserved,source_transcript:recognition.source_transcript_ru,preparation:recognition.preparation_state,preparation_method:recognition.preparation_method,category_hint:clean(item&&item.category_hint,80),grams:Math.round(grams),grams_source:clean(item&&item.grams_source,40),consumption_scope:recognition.consumption_scope,recognition_confidence:rowRequiresConfirmation?Math.min(rec,.55):rec,notes:clean(item&&item.notes,320),alternates:itemAlternates,recognition:recognition,candidates:candidates,selectedKey:selected,candidate_selection_reason:candidates.autoSelectionReason||'',candidate_selection_margin:Number(candidates.autoSelectionMargin)||0,preparation_resolution:prepResolution,dish_group_id:clean(item&&item.dish_group_id,60),dish_name:clean(item&&item.dish_name_ru,180),dish_total_grams:num(item&&item.dish_total_grams),dish_mass_confidence:clamp(item&&item.dish_mass_confidence,0,1),component_role:componentRole,component_index:Math.max(0,Math.round(Number(item&&item.component_index)||0)),component_count:Math.max(0,Math.round(Number(item&&item.component_count)||0)),component_confidence:clamp(item&&item.component_confidence,0,1),decomposition_source:clean(item&&item.decomposition_source,40)});
      });
    });
    return normalizeComponentGroups(deduplicateRows(removeCompositeRoots(expandCompositeRows(rows))));
  }
  function candidateOptions(row){var opts=row.candidates||[];var html='<option value="">Выберите продукт из базы</option>';opts.forEach(function(c){var detail=c.matchReason?' · '+c.matchReason:'';html+='<option value="'+esc(c.key)+'"'+(row.selectedKey===c.key?' selected':'')+'>'+esc(c.name)+' · '+Math.round(Math.min(1,c.score)*100)+'%'+esc(detail)+'</option>';});return html;}

  function combinedConfidence(row){var m=(row.candidates||[]).find(function(x){return x.key===row.selectedKey;});var ms=m?Math.min(1,m.score):0;return Math.min(Number(row.recognition_confidence)||0,ms||0);}
  function fmtNum(v,d){v=Number(v);return Number.isFinite(v)?v.toFixed(d==null?1:d).replace(/\.0$/,'').replace('.',','):'';}
  function packagedRecognitionHtml(row){var r=row.recognition||{},n=recognitionNutrition(r);if(!r.brand&&!r.exact_product_name&&!n.kcal&&!n.protein&&!n.fat&&!n.carbs)return '';var title=[r.brand,r.exact_product_name].filter(Boolean).join(' · ')||row.observed_name;var bits=[];if((row.source_ids||[]).length>1)bits.push('объединено фото: '+row.source_ids.length);if(r.barcode)bits.push('штрихкод: '+r.barcode);if(r.flavor)bits.push('вкус: '+r.flavor);if(r.fat_percent!=null)bits.push('жирность '+fmtNum(r.fat_percent,1)+'%');if(r.package_grams)bits.push('упаковка '+fmtNum(r.package_grams,0)+' г');var macros=[];if(n.kcal!=null)macros.push(fmtNum(n.kcal,0)+' ккал');if(n.protein!=null)macros.push('Б '+fmtNum(n.protein,1));if(n.fat!=null)macros.push('Ж '+fmtNum(n.fat,1));if(n.carbs!=null)macros.push('У '+fmtNum(n.carbs,1));if(n.sugar!=null)macros.push('сахара '+fmtNum(n.sugar,1));var reliability=r.nutrition_confidence>=.8?'высокая':(r.nutrition_confidence>=.55?'средняя':(r.nutrition_confidence>0?'низкая':'не указана'));return '<div class="gemini-ration-draft-row__package"><strong>Распознано по упаковке:</strong> '+esc(title)+(bits.length?'<span>'+esc(bits.join(' · '))+'</span>':'')+(macros.length?'<span><b>КБЖУ на 100 г:</b> '+esc(macros.join(' · '))+' · надёжность: '+esc(reliability)+'</span>':'<span>Точные КБЖУ на 100 г не подтверждены.</span>')+(r.nutrition_basis?'<small>'+esc(r.nutrition_basis)+'</small>':'')+'</div>';}
  function componentContextHtml(row){if(!row.dish_group_id&&!row.component_role)return '';var bits=[];if(row.dish_name)bits.push('Состав блюда: '+row.dish_name);if(row.component_count)bits.push('компонент '+(row.component_index||1)+' из '+row.component_count);var role=row.component_role?'<span class="gemini-ration-draft-row__component-role">'+esc(componentRoleLabel(row.component_role))+'</span>':'';return '<div class="gemini-ration-draft-row__component">'+role+(bits.length?'<span>'+esc(bits.join(' · '))+'</span>':'')+'</div>';}
  function selectedMatchHtml(row){var c=(row.candidates||[]).find(function(x){return x.key===row.selectedKey;});if(!c){var pr=row.preparation_resolution||(row.candidates&&row.candidates.preparationResolution);if(pr&&pr.status==='not_found')return '<span><b>Точного варианта приготовления в базе нет.</b> Автоматическая подмена другим способом приготовления запрещена; выберите вариант вручную.</span>';if(pr&&(pr.status==='ambiguous'||pr.status==='compatible_method_class'))return '<span><b>Способ приготовления определён не полностью однозначно.</b> Выберите подходящий вариант вручную.</span>';if(row.requires_user_confirmation)return '<span><b>Нужно ручное подтверждение.</b> Служебное или ненадёжное название не будет добавлено автоматически.</span>';return '<span>Для этой позиции ещё не выбран подходящий продукт из базы.</span>';}var parts=[c.exactPreparationMatch?'Найден точный вариант приготовления':(c.isAnalog?(row.component_role?'Для компонента подобран ближайший аналог':'Подобран ближайший аналог'):'Найдено точное совпадение')];if(c.matchReason)parts.push(c.matchReason);if(c.nutritionScore!=null)parts.push('сходство КБЖУ '+Math.round(c.nutritionScore*100)+'%');return '<span>'+esc(parts.join(' · '))+'.</span>';}
  function readyDraftRows(){var prepApi=preparationMatcher();return draft.filter(function(x){if(!(x&&x.include!==false&&x.selectedKey&&Number(x.grams)>0&&(!x.requires_user_confirmation||x.manualConfirmed===true)))return false;if(!prepApi)return true;var validation=prepApi.validateSelection(x.selectedKey,x.recognition||{},x.observed_name||'');if(validation.ok)return true;return validation.reason==='preparation_confirmation_required'&&x.manualConfirmed===true;});}
  function updateDraftSelectionSummary(){var included=draft.filter(function(x){return x&&x.include!==false;}).length,ready=readyDraftRows().length,pending=Math.max(0,included-ready),summary=$('geminiRationDraftSummary'),add=$('geminiRationAddDraftBtn');if(summary)summary.textContent='Выбрано '+included+' из '+draft.length+(ready!==included?' · готово к добавлению '+ready+(pending?' · требует подтверждения '+pending:''):'');if(add){add.disabled=ready===0;add.textContent=ready?(pending?'Добавить готовые позиции ('+ready+')':'Добавить выбранное к рациону ('+ready+')'):'Сначала подтвердите продукт';add.setAttribute('aria-label',ready?'Добавить готовые позиции к рациону: '+ready+(pending?'. Ещё требуют подтверждения: '+pending:''):'Сначала подтвердите хотя бы одну позицию');}}
  function updateDraftCardSelection(card,row){if(!card||!row)return;var included=row.include!==false;var waiting=row.requires_user_confirmation&&!row.manualConfirmed;card.classList.toggle('is-included',included&&!waiting);card.classList.toggle('is-excluded',!included||waiting);card.classList.toggle('needs-manual-review',waiting);card.setAttribute('data-included',included&&!waiting?'true':'false');var inc=card.querySelector('[data-role="include"]'),text=card.querySelector('.gemini-ration-draft-row__include-text'),state=card.querySelector('.gemini-ration-draft-row__include-state');if(inc){inc.checked=included;inc.setAttribute('aria-label',waiting?'Требуется ручная проверка и выбор продукта':(included?'Выбрано для добавления в рацион':'Не выбрано для добавления в рацион'));}if(text)text.textContent=waiting?'Требуется ручная проверка':(included?'Выбрано для рациона':'Не добавлять в рацион');if(state)state.textContent=waiting?'Не будет добавлено автоматически':(included?'Будет добавлено':'Будет пропущено');}
  function renderWebSources(result){var host=$('geminiRationDraftSources');if(!host)return;var src=Array.isArray(result&&result.web_sources)?result.web_sources:[];host.hidden=!src.length;if(!src.length){host.innerHTML='';return;}host.innerHTML='<strong>Источники интернет-проверки упаковки</strong><div>'+src.slice(0,6).map(function(x){var u=String(x&&x.url||'');var t=clean(x&&x.title,120)||u;return /^https?:\/\//i.test(u)?'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(t)+'</a>':'';}).filter(Boolean).join('')+'</div><small>КБЖУ используются только как сигнатура для выбора ближайшего продукта из локальной базы. Перед добавлением проверьте выбранный аналог и массу.</small>';}
  function renderDraft(result){
    draft=normalizeServerResult(result);var host=$('geminiRationDraft'),rows=$('geminiRationDraftRows'),summary=$('geminiRationDraftSummary');if(!host||!rows)return;host.hidden=false;if(summary)summary.textContent=draft.length+' поз.';
    var warnings=Array.isArray(result&&result.warnings)?result.warnings.filter(Boolean).slice(0,6):[];if(draft.some(function(x){return x.decomposition_source==='local_name_fallback';}))warnings.unshift('Состав блюда дополнительно разобран локально по распознанному названию. Проверьте компоненты и распределение общей массы.');
    var wh=$('geminiRationDraftWarnings');if(wh){wh.hidden=!warnings.length;wh.innerHTML=warnings.slice(0,7).map(function(w){return '<div>'+esc(w)+'</div>';}).join('');}renderWebSources(result);
    rows.innerHTML=draft.map(function(row){var conf=combinedConfidence(row);var sourceText=row.grams_source==='explicit'?'масса названа':(row.grams_source==='package_net_weight'?'взята масса упаковки — подтвердите, что она съедена целиком':(row.grams_source==='visual_estimate'?'масса оценена по фото':(row.grams_source==='standard_portion'?'типовая порция':'масса требует проверки')));var componentClass=row.component_role?' is-component component-'+esc(row.component_role):'';var searchLabel=row.component_role?'Поиск аналога для компонента':'Поиск аналога в базе';return '<article class="gemini-ration-draft-row is-included'+componentClass+'" data-included="true" data-draft-id="'+esc(row.id)+'"><label class="gemini-ration-draft-row__include" data-role="include-toggle"><input type="checkbox" data-role="include" checked aria-label="Выбрано для добавления в рацион"><span class="gemini-ration-draft-row__include-box" aria-hidden="true"></span><span class="gemini-ration-draft-row__include-copy"><strong class="gemini-ration-draft-row__include-text">Выбрано для рациона</strong><small class="gemini-ration-draft-row__include-state">Будет добавлено</small></span></label><div class="gemini-ration-draft-row__main"><div class="gemini-ration-draft-row__title"><strong>'+esc(row.observed_name)+'</strong><span>'+esc(row.meal_label)+'</span><em class="confidence-'+confidenceClass(conf)+'">'+confidenceLabel(conf)+'</em></div>'+componentContextHtml(row)+'<div class="gemini-ration-draft-row__meta">'+esc([row.preparation,row.source_transcript?('Расшифровка: '+row.source_transcript):'',sourceText,row.notes].filter(Boolean).join(' · '))+'</div>'+packagedRecognitionHtml(row)+'<div class="gemini-ration-draft-row__controls"><label>'+esc(searchLabel)+'<input type="search" data-role="search" value="'+esc(row.recognition.exact_product_name||row.observed_name)+'" autocomplete="off"></label><label>Выбранный продукт<select data-role="product">'+candidateOptions(row)+'</select></label><label>Масса, г<input type="number" data-role="grams" min="1" max="5000" step="1" value="'+esc(row.grams)+'"></label></div><div class="gemini-ration-draft-row__match" data-role="match-explanation">'+selectedMatchHtml(row)+'</div></div><button type="button" class="secondary" data-role="remove">Удалить</button></article>';}).join('')||'<div class="gemini-ration-draft__empty">Gemini не выделил продуктов, которые можно добавить. Попробуйте более чёткую фотографию или перечислите продукты в аудио.</div>';
    rows.querySelectorAll('[data-draft-id]').forEach(function(card){var id=card.getAttribute('data-draft-id');var row=draft.find(function(x){return x.id===id;});if(!row)return;var inc=card.querySelector('[data-role="include"]'),select=card.querySelector('[data-role="product"]'),grams=card.querySelector('[data-role="grams"]');if(inc)inc.addEventListener('change',function(){row.include=inc.checked;updateDraftCardSelection(card,row);updateDraftSelectionSummary();});if(select)select.addEventListener('change',function(){row.selectedKey=select.value;row.manualConfirmed=!!select.value;if(row.manualConfirmed)row.include=true;updateDraftCardSelection(card,row);renderDraftRowConfidence(card,row);var ex=card.querySelector('[data-role="match-explanation"]');if(ex)ex.innerHTML=selectedMatchHtml(row);updateDraftSelectionSummary();});if(grams)grams.addEventListener('input',function(){row.grams=clamp(grams.value,1,5000);updateDraftSelectionSummary();});var search=card.querySelector('[data-role="search"]'),timer=null;if(search)search.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(function(){row.recognition.observed_name_ru=clean(search.value,160);row.candidates=matchProducts(search.value,row.preparation,row.category_hint,row.alternates,8,row.recognition);row.selectedKey=autoSelectKey(row.candidates,row.component_role,{requiresConfirmation:row.requires_user_confirmation,recognitionConfidence:row.recognition_confidence});if(select)select.innerHTML=candidateOptions(row);renderDraftRowConfidence(card,row);var ex=card.querySelector('[data-role="match-explanation"]');if(ex)ex.innerHTML=selectedMatchHtml(row);updateDraftSelectionSummary();},180);});var rm=card.querySelector('[data-role="remove"]');if(rm)rm.addEventListener('click',function(){draft=draft.filter(function(x){return x.id!==id;});card.remove();updateDraftSelectionSummary();});updateDraftCardSelection(card,row);});
    var discard=$('geminiRationDiscardDraftBtn');if(discard)discard.disabled=false;updateDraftSelectionSummary();if(window.NutritionPreparationFamilyUI&&typeof window.NutritionPreparationFamilyUI.scanGemini==='function')window.NutritionPreparationFamilyUI.scanGemini();host.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderDraftRowConfidence(card,row){var em=card.querySelector('.gemini-ration-draft-row__title em');if(!em)return;var c=combinedConfidence(row);em.className='confidence-'+confidenceClass(c);em.textContent=confidenceLabel(c);}

  function inlineMarkdown(value){
    var s=esc(String(value==null?'':value));
    s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    s=s.replace(/__(.+?)__/g,'<strong>$1</strong>');
    s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
    return s;
  }
  function markdownLite(value){
    var lines=String(value==null?'':value).replace(/\r\n?/g,'\n').split('\n');var html=[],p=[],list='';
    function fp(){if(p.length){html.push('<p>'+p.map(inlineMarkdown).join('<br>')+'</p>');p=[];}}
    function fl(){if(list){html.push('</'+list+'>');list='';}}
    lines.forEach(function(raw){var line=raw.trim();if(!line){fp();fl();return;}var h=line.match(/^#{1,6}\s+(.+)$/);if(h){fp();fl();html.push('<h3>'+inlineMarkdown(h[1])+'</h3>');return;}var b=line.match(/^[-*•]\s+(.+)$/);if(b){fp();if(list!=='ul'){fl();list='ul';html.push('<ul>');}html.push('<li>'+inlineMarkdown(b[1])+'</li>');return;}var n=line.match(/^\d+[.)]\s+(.+)$/);if(n){fp();if(list!=='ol'){fl();list='ol';html.push('<ol>');}html.push('<li>'+inlineMarkdown(n[1])+'</li>');return;}fl();p.push(line.replace(/^#{1,6}\s*/,''));});fp();fl();return html.join('');
  }

  function renderTextOnly(value,meta){
    draft=[];var host=$('geminiRationDraft'),rows=$('geminiRationDraftRows'),summary=$('geminiRationDraftSummary'),wh=$('geminiRationDraftWarnings');if(!host||!rows)return;
    host.hidden=false;if(summary)summary.textContent='текст';
    if(wh){wh.hidden=false;wh.innerHTML='<div><strong>Автоматический черновик не создан.</strong> Ответ сохранён на экране. Повторите распознавание либо внесите продукты через поиск.</div>';}
    rows.innerHTML='<article class="gemini-ration-raw-text"><strong>Ответ Gemini</strong><div class="gemini-ration-raw-text__body">'+(markdownLite(value)||'<p>Ответ пуст.</p>')+'</div><small>Модель: '+esc(meta&&meta.model||'Gemini')+(meta&&meta.model_fallback_used?' · использована резервная модель':'')+(meta&&meta.credential_fallback_used?' · использован резервный API-ключ':'')+(meta&&meta.retry_count?' · повторных попыток: '+esc(meta.retry_count):'')+'</small></article>';
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function recognize(){
    if(!media.length){setStatus('Сначала выберите фотографию или аудиофайл.','error');return;}
    var eligibilityProblem=aiEligibilityError(aiUsageContext());if(eligibilityProblem){setStatus(eligibilityProblem+' Файлы остаются только на устройстве и не отправлялись.','error');return;}
    if(activeController)activeController.abort();activeController=typeof AbortController!=='undefined'?new AbortController():null;lastRecognitionFailed=false;setBusy(true);clearDraft();
    var requestId=recognitionRequestId();
    try{
      await ensureServiceReady();
      var imageOnly=media.every(function(x){return x.kind==='image';});
      var prepared=await prepareMedia({safeTotalBytes:imageOnly?hostingSafeTotalBytes:0});
      setStatus('Gemini читает фотографии и аудио. Интернет-проверка запускается отдельно только для брендированных товаров, у которых КБЖУ не видны на этикетке.','working');
      var packet;
      try{
        packet=await sendPreparedWithAutomaticRetry(prepared,requestId);
        if(imageOnly&&packet&&packet.response&&packet.response.status===413){
          setStatus('Сервер отклонил размер фотографий. Сжимаем их сильнее и повторяем отправку без потери исходных файлов.','working');
          prepared=await prepareMedia({safeTotalBytes:retrySafeTotalBytes()});requestId=recognitionRequestId();packet=await sendPreparedWithAutomaticRetry(prepared,requestId);
        }
      }catch(firstError){
        if(imageOnly&&firstError&&firstError.code==='upload_too_large'){
          setStatus('Первый запрос был отклонён из-за размера. Сжимаем фотографии сильнее и повторяем отправку.','working');
          prepared=await prepareMedia({safeTotalBytes:retrySafeTotalBytes()});requestId=recognitionRequestId();
          try{packet=await sendPreparedWithAutomaticRetry(prepared,requestId);}catch(secondError){
            if(secondError&&secondError.code==='upload_too_large'){
              var finalUploadError=new Error('Даже после усиленного сжатия сервер не принял фотографию. Причиной может быть лимит загрузки хостинга'+(secondError.status?' (HTTP '+secondError.status+')':'')+'.');
              finalUploadError.code='final_upload_failure';finalUploadError.status=secondError.status;throw finalUploadError;
            }
            throw secondError;
          }
        }else throw firstError;
      }
      var response=packet.response,data=packet.data;
      if(!response.ok||!data||data.ok!==true){
        lastRecognitionFailed=true;
        if(data&&Number(data.retry_after_seconds)>0&&(response.status===429||/^(?:ai_kill_switch|guard_)/.test(clean(data.error_code,80)))){startCooldown(Number(data.retry_after_seconds),data.error||'Gemini временно остановлен серверным защитным контуром.');return;}
        var serviceError=new Error(data&&data.error?data.error:'Не удалось распознать рацион.');serviceError.code=data&&data.error_code||'recognition_failed';serviceError.status=response.status;serviceError.retryable=!!(data&&data.retryable);serviceError.clientRetryCount=Number(packet.clientRetryCount)||0;throw serviceError;
      }
      lastRecognitionFailed=false;
      if(data.result_mode==='text_only'||(!data.result&&data.text)){
        renderTextOnly(data.text||'',data.meta||{});
        setStatus('Gemini вернул обычный текст. Результат сохранён на экране, но в рацион ничего не добавлено.','success');
      }else{
        renderDraft(data.result||{});
        var mode=data.result_mode||'structured';
        var note=mode==='line_protocol'?'Структурированный ответ не прошёл проверку; черновик безопасно восстановлен из резервного протокола. ':mode==='loose_text'?'Черновик восстановлен из свободного текста и требует особенно внимательной проверки. ':mode==='fallback_json'?'Черновик восстановлен резервным JSON-запросом. ':'Черновик создан из структурированного ответа Gemini. ';
        if(packet.clientRetryCount)note+='Потребовалось автоматических повторных отправок: '+Number(packet.clientRetryCount)+'. ';
        if(data.meta&&data.meta.request_count)note+='Внутренних обращений к моделям Gemini: '+Number(data.meta.request_count)+'. ';
        if(data.meta&&data.meta.credential_fallback_used)note+='Основной ключ Gemini достиг ограничения или был недоступен; распознавание выполнено через резервный ключ. ';
        if(data.meta&&data.meta.structured_fallback_used)note+='Использован резервный формат ответа. ';if(data.meta&&data.meta.attribution_repair_used)note+='Название или расшифровка были повторно восстановлены по исходному материалу. ';else if(data.meta&&data.meta.name_repair_used)note+='Служебное название было автоматически восстановлено по исходному материалу. ';if(data.meta&&data.meta.unresolved_name_items)note+='Не удалось надёжно восстановить названий: '+Number(data.meta.unresolved_name_items)+'. Эти позиции требуют ручного выбора. ';if(data.meta&&data.meta.web_search_used)note+='КБЖУ брендированного товара уточнены через интернет. ';
        if(data.meta&&data.meta.invalid_source_items)note+='Позиций с неподтверждённой привязкой к источнику: '+Number(data.meta.invalid_source_items)+'. ';if(data.meta&&data.meta.missing_audio_transcripts)note+='Аудиопозиций без надёжной расшифровки: '+Number(data.meta.missing_audio_transcripts)+'. ';if(data.meta&&data.meta.preparation_blocked_items)note+='Позиций, заблокированных из-за способа приготовления: '+Number(data.meta.preparation_blocked_items)+'. ';if(data.meta&&data.meta.lookup_deferred)note+=(data.meta.supplemental_calls_deferred?'Дополнительная интернет-проверка не задерживала основной запрос; черновик сохранён по данным фотографии. ':'Интернет-проверка временно пропущена; черновик сохранён по данным фотографии. ');if(data.meta&&data.meta.processing_time_ms)note+='Серверная обработка: '+Math.max(1,Math.round(Number(data.meta.processing_time_ms)/1000))+' с. ';
        if(data.meta&&data.meta.exact_duplicates_removed)note+='Удалено точных дублей файлов: '+Number(data.meta.exact_duplicates_removed)+'. ';
        var grouped=draft.filter(function(x){return (x.source_ids||[]).length>1;}).length;if(grouped)note+='Объединено групп ракурсов: '+grouped+'. ';var dishGroups=new Set(draft.filter(function(x){return x.dish_group_id;}).map(function(x){return x.dish_group_id;}));if(dishGroups.size)note+='Составных блюд разобрано на компоненты: '+dishGroups.size+'. ';setStatus(note+'Проверьте подобранные аналоги и массу каждого компонента перед добавлением.','success');
      }
    }catch(e){
      if(e&&e.name==='AbortError'){lastRecognitionFailed=false;setStatus('Распознавание отменено.','idle');}
      else{
        lastRecognitionFailed=true;
        if(e&&e.code==='non_json_response')setStatus((e.message||'Сервер вернул ответ, который приложение не смогло прочитать.')+' Аудио и фотографии сохранены. Нажмите «Повторить распознавание»; если ошибка повторится, проверьте журнал PHP на хостинге.','error');
        else if(e&&e.code==='service_health_failed')setStatus((e.message||'Сервер распознавания недоступен.')+' Файлы остаются на устройстве и не отправлялись.','error');
        else if(e&&e.code==='api_key_missing')setStatus('Серверный ключ Gemini не настроен. Файлы остаются на устройстве и не отправлялись.','error');
        else if(e&&/^(?:ai_kill_switch|guard_)/.test(clean(e.code,80))&&Number(e.retryAfter)>0){startCooldown(Number(e.retryAfter),e.message||'Gemini временно остановлен серверным защитным контуром.');}
        else if(e&&e.retryable)setStatus((e.message||'Gemini временно недоступен.')+' Автоматические попытки исчерпаны. Аудио и фотографии сохранены — повторная запись не требуется.','error');
        else setStatus((e&&e.message?e.message:'Не удалось связаться с Gemini API.')+' Аудио и фотографии сохранены.','error');
      }
    }
    finally{retryCountdownSeconds=0;if(retryCountdownTimer){clearInterval(retryCountdownTimer);retryCountdownTimer=null;}setBusy(false);activeController=null;updateRecognizeButton();}
  }

  function commitRowsToRation(rows){
    if(!window.State||typeof window.State.add!=='function')throw new Error('Модуль рациона ещё не готов.');
    var prepApi=preparationMatcher(),blocked=0;
    var selected=(Array.isArray(rows)?rows:[]).filter(function(x){
      if(!(x&&x.include!==false&&x.selectedKey&&Number(x.grams)>0&&(!x.requires_user_confirmation||x.manualConfirmed===true)))return false;
      if(!prepApi)return true;var validation=prepApi.validateSelection(x.selectedKey,x.recognition||{},x.observed_name||'');if(validation.ok)return true;if(validation.reason==='preparation_confirmation_required'&&x.manualConfirmed===true)return true;blocked++;return false;
    });
    if(!selected.length)return {added:0,blocked:blocked,committed_ids:[],batch_id:'',positions_before:window.State.get?window.State.get().length:0,positions_after:window.State.get?window.State.get().length:0};
    var before=window.State.get?window.State.get().length:0;var batch='gemini_'+Date.now();var added=0,committedIds=[];
    var batchStarted=typeof window.State.beginAddBatch==='function'&&typeof window.State.endAddBatch==='function';
    if(batchStarted)window.State.beginAddBatch('gemini-ration-import');
    try{selected.forEach(function(row){
      var candidate=(row.candidates||[]).find(function(x){return x.key===row.selectedKey;});var validation=prepApi?prepApi.validateSelection(row.selectedKey,row.recognition||{},row.observed_name||''):null;var assessment=validation&&validation.assessment||null;
      var committedEntry=window.State.add(row.selectedKey,clamp(row.grams,1,5000),{batch_id:batch,source_type:row.source_type,source_ids:(row.source_ids||[]).slice(0,8),meal_label:row.meal_label,observed_name:row.observed_name,dish_group_id:row.dish_group_id||'',dish_name:row.dish_name||'',dish_total_grams:Number(row.dish_total_grams)||0,component_role:row.component_role||'',component_index:Number(row.component_index)||0,component_count:Number(row.component_count)||0,decomposition_source:row.decomposition_source||'',preparation_method:row.preparation_method||'',preparation_state:row.preparation||'',preparation_match_status:row.recognition&&row.recognition.preparation_match_status||assessment&&assessment.resolution&&assessment.resolution.status||'',exact_variant_key:row.recognition&&row.recognition.exact_variant_key||'',food_family_id:row.recognition&&row.recognition.food_family_id||'',nutritional_process_class:row.recognition&&row.recognition.nutritional_process_class||'',nutrition_effect_mode:row.recognition&&row.recognition.nutrition_effect_mode||'',automatic_selection_policy:row.recognition&&row.recognition.automatic_selection_policy||'',nutritional_effect_dimensions:row.recognition&&Array.isArray(row.recognition.nutritional_effect_dimensions)?row.recognition.nutritional_effect_dimensions.slice(0,12):[],weight_basis_hint:row.recognition&&row.recognition.weight_basis_hint||'',consumption_scope:row.consumption_scope||'',source_transcript:row.source_transcript||'',source_transcripts:(row.source_transcripts||[]).slice(0,8),recognition_issue_codes:(row.recognition_issue_codes||[]).slice(0,12),attribution_status:row.manualConfirmed?'manually_confirmed':(row.attribution_status||'validated'),candidate_selection_reason:row.candidate_selection_reason||'',candidate_selection_margin:Number(row.candidate_selection_margin)||0,confidence:Math.min(Number(row.recognition_confidence)||0,candidate?Math.min(1,candidate.score):0),imported_at:new Date().toISOString()});if(committedEntry){added++;committedIds.push(row.id);}
    });}finally{if(batchStarted)window.State.endAddBatch('geminiBatchAdd',{batch_id:batch,added:added,selected:selected.length,blocked:blocked});}
    return {added:added,blocked:blocked,committed_ids:committedIds,batch_id:batch,positions_before:before,positions_after:window.State.get?window.State.get().length:before};
  }
  function refreshRationUiAfterCommit(){
    try{
      if(window.NutritionRationUI&&typeof window.NutritionRationUI.refresh==='function')window.NutritionRationUI.refresh('gemini-commit');
      else if(window.Events&&typeof window.Events.emit==='function')window.Events.emit('change',{source:'gemini-commit'});
    }catch(error){try{console.error('Gemini ration UI refresh failed',error);}catch(_){} }
    [0,60,240].forEach(function(delay){setTimeout(function(){
      try{if(window.__UI_DESIGN_AUDIT_V53110__&&typeof window.__UI_DESIGN_AUDIT_V53110__.sync==='function')window.__UI_DESIGN_AUDIT_V53110__.sync();}catch(_){}
    },delay);});
  }

  function addDraft(){
    if(!window.State||typeof window.State.add!=='function'){setStatus('Модуль рациона ещё загружается. Повторите через несколько секунд.','error');return;}
    var selected=readyDraftRows();
    if(!selected.length){setStatus('В черновике нет готовых позиций. Проверьте название, способ приготовления, продукт и массу.','error');return;}
    var result;
    try{result=commitRowsToRation(selected);}catch(e){setStatus(e&&e.message?e.message:'Не удалось добавить позиции к рациону.','error');return;}
    if(!result.added){setStatus(result.blocked?'Позиции не добавлены: итоговая проверка обнаружила несовместимый продукт или способ приготовления.':'Не удалось добавить выбранные позиции.','error');return;}
    var committed=new Set(result.committed_ids||[]);
    draft=draft.filter(function(row){return !committed.has(row.id);});
    var rowsHost=$('geminiRationDraftRows');if(rowsHost)committed.forEach(function(id){var card=rowsHost.querySelector('[data-draft-id="'+String(id).replace(/"/g,'\"')+'"]');if(card)card.remove();});
    if(!draft.length){clearDraft();clearMedia();var context=$('geminiRationContext');if(context)context.value='';safeSessionRemove(CONTEXT_STORAGE_KEY);setStatus('✓ Готово: добавлено '+result.added+' поз. к текущему рациону. Ранее внесённые продукты сохранены; совпадающие позиции суммированы.','success');}
    else{updateDraftSelectionSummary();var pendingSelected=draft.filter(function(row){return row&&row.include!==false;}).length,pendingReady=readyDraftRows().length,pendingReview=Math.max(0,pendingSelected-pendingReady);setStatus('✓ Добавлено '+result.added+' поз. к рациону.'+(pendingReview?' Ещё '+pendingReview+' выбранн. поз. требуют подтверждения продукта или способа приготовления.':'')+' В черновике осталось '+draft.length+' поз.','success');}
    refreshRationUiAfterCommit();
    try{window.dispatchEvent(new CustomEvent('gemini:ration-imported',{detail:{batch_id:result.batch_id,items:result.added,remaining_draft_items:draft.length,positions_before:result.positions_before,positions_after:result.positions_after}}));}catch(_){}
    var ration=$('rationSection');if(ration)setTimeout(function(){ration.scrollIntoView({behavior:'auto',block:'start'});},120);
  }
  async function ingestFiles(files,kind,source){
    var list=Array.prototype.slice.call(files||[]),added=addFiles(list,kind,source||'upload');
    if(!added.length)return [];
    if(kind==='image')await prepareImageItems(added);else if(kind==='audio')await prepareAudioItems(added);
    return added;
  }
  function install(){
    loadHostingLimits();
    var photo=$('geminiRationPhotoInput'),camera=$('geminiRationCameraInput'),audio=$('geminiRationAudioInput'),context=$('geminiRationContext');
    var bPhoto=$('geminiRationChoosePhotos'),bCamera=$('geminiRationTakePhoto'),bAudio=$('geminiRationChooseAudio'),bRecord=$('geminiRationRecordAudio');
    if(!bPhoto||bPhoto.dataset.bound==='1')return;bPhoto.dataset.bound='1';
    bPhoto.addEventListener('click',function(e){e.preventDefault();photo&&photo.click();});bCamera&&bCamera.addEventListener('click',function(e){e.preventDefault();camera&&camera.click();});bAudio&&bAudio.addEventListener('click',function(e){e.preventDefault();audio&&audio.click();});bRecord&&bRecord.addEventListener('click',function(e){e.preventDefault();var bridge=window.NutritionMediaEntryBridge;if(bridge&&typeof bridge.startVoice==='function')bridge.startVoice();else startLiveRecording();});
    photo&&photo.addEventListener('change',async function(){var files=Array.from(photo.files||[]);photo.value='';await ingestFiles(files,'image','upload');});
    camera&&camera.addEventListener('change',async function(){var files=Array.from(camera.files||[]);camera.value='';await ingestFiles(files,'image','camera');});
    audio&&audio.addEventListener('change',async function(){var files=Array.from(audio.files||[]);audio.value='';await ingestFiles(files,'audio','upload');});
    var stopRecord=$('geminiRationStopRecording');if(stopRecord)stopRecord.addEventListener('click',function(){stopLiveRecording(false);});var cancelRecord=$('geminiRationCancelRecording');if(cancelRecord)cancelRecord.addEventListener('click',function(){stopLiveRecording(true);});
    var eligibility=$('geminiRationAiEligibility');if(eligibility){eligibility.checked=aiAttested();eligibility.addEventListener('change',function(){setAiAttestation(eligibility.checked);});}
    var recognizeBtn=$('geminiRationRecognizeBtn');if(recognizeBtn)recognizeBtn.addEventListener('click',function(e){e.preventDefault();recognize();});
    var clearBtn=$('geminiRationClearMediaBtn');if(clearBtn)clearBtn.addEventListener('click',function(e){e.preventDefault();clearMedia();clearDraft();});
    var addBtn=$('geminiRationAddDraftBtn');if(addBtn)addBtn.addEventListener('click',function(e){e.preventDefault();addDraft();});
    var discard=$('geminiRationDiscardDraftBtn');if(discard)discard.addEventListener('click',function(e){e.preventDefault();clearDraft();setStatus('Черновик удалён. Загруженные файлы оставлены для повторного распознавания.','idle');});
    if(context){var savedContext=safeSessionGet(CONTEXT_STORAGE_KEY);if(savedContext&&!context.value)context.value=clean(savedContext,800);context.addEventListener('input',function(){safeSessionSet(CONTEXT_STORAGE_KEY,context.value||'');});}
    window.addEventListener('pagehide',function(){persistMediaNow();});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')persistMediaNow();else if(recorderState.active){paintRecorderTimer(true);if(!recorderState.animationFrame&&typeof requestAnimationFrame==='function')recorderState.animationFrame=requestAnimationFrame(recorderAnimationTick);}});
    renderQueue();updateRecorderUi();restorePersistedMedia().then(function(count){renderQueue();if(count)setStatus('После перезагрузки восстановлены подготовленные материалы: '+count+'. Можно продолжить распознавание.','success');});
  }
  window.NutritionGeminiRationImport={version:VERSION,__initialized:true,parseJsonResponseText:parseJsonResponseText,productFamily:productFamily,matchProducts:matchProducts,isServiceMediaName:isServiceMediaName,deduplicateRows:deduplicateRows,expandCompositeRows:expandCompositeRows,normalizeServerResult:normalizeServerResult,commitRowsToRation:commitRowsToRation,addDraft:addDraft,recognize:recognize,renderTextOnly:renderTextOnly,renderDraft:renderDraft,startLiveRecording:startLiveRecording,startLiveRecordingWithStream:startLiveRecordingWithStream,stopLiveRecording:stopLiveRecording,ingestFiles:ingestFiles,prepareAudioFile:prepareAudioFile,prepareImageItems:prepareImageItems,prepareMedia:prepareMedia,imageBudgetForCount:imageBudgetForCount,loadHostingLimits:loadHostingLimits,ensureServiceReady:ensureServiceReady,getServiceHealth:function(){return Object.assign({},serviceHealth);},getImagePreparationConcurrency:imagePreparationConcurrency,getHostingLimits:function(){return {total:hostingSafeTotalBytes,single:hostingSafeSingleBytes,retry:retrySafeTotalBytes()};},restorePersistedMedia:restorePersistedMedia,persistMediaNow:persistMediaNow,clearMedia:clearMedia,formatDuration:formatDuration,getMedia:function(){return media.slice();},getDraft:function(){return draft.slice();},packetRetryPolicy:packetRetryPolicy,exceptionRetryPolicy:exceptionRetryPolicy,sendPreparedWithAutomaticRetry:sendPreparedWithAutomaticRetry,buildMediaForm:buildMediaForm,getRetryPolicy:function(){return {delays:AUTO_RETRY_DELAYS_SECONDS.slice(),maxAttempts:AUTO_RETRY_MAX_ATTEMPTS};},getRecorderDiagnostics:function(){return {starting:recorderState.starting,active:recorderState.active,processing:recorderState.processing,mode:recorderState.mode,mimeType:recorderState.mimeType,elapsedSeconds:recorderElapsed(),timerText:$('geminiRationRecorderTimer')?$('geminiRationRecorderTimer').textContent:'',nativePreferred:window.__NUTRITION_RECORDER_FORCE_PCM__!==true};}};
  ready(install);
})();
