/* Nutrition Calculator v5.3.210 RC2 HF27
 * Resilient trusted-gesture bridge for camera, files and microphone entry.
 * Keeps permission feedback visible in the entry card, releases stuck requests,
 * and provides a native recorder fallback for constrained mobile WebViews.
 */
(function(w,d){
  'use strict';
  var VERSION='v5.3.210-rc2-hf27-media-resilient';
  var loadPromise=null,voicePending=false,installed=false,voiceToken=0;
  var softTimer=0,hardTimer=0,statusMirror=null;

  function byId(id){return d.getElementById(id);}
  function api(){return w.NutritionGeminiRationImport||null;}
  function numberSetting(name,fallback,min,max){var n=Number(w[name]);return isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
  function softTimeout(){return numberSetting('__NUTRITION_MIC_SOFT_TIMEOUT_MS__',2800,250,15000);}
  function hardTimeout(){return numberSetting('__NUTRITION_MIC_HARD_TIMEOUT_MS__',18000,1500,60000);}
  function moduleUrl(){
    var m=w.__NUTRITION_RUNTIME_MANIFEST__||{},lazy=m.lazyFeatureScripts||{};
    return lazy.geminiMediaImport||'./assets/js/62-gemini-ration-import-v5.js?v=v5.3.210-rc2-hf27-media-resilient';
  }
  function openTools(){var details=byId('workspaceRationSecondary');if(details){details.open=true;try{d.documentElement.setAttribute('data-workspace-secondary-open','1');}catch(_){}}}
  function reveal(){
    openTools();var section=byId('geminiRationImportSection');
    if(section){try{section.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{section.scrollIntoView(true);}catch(__){}}}
  }
  function setStatus(message,state){var el=byId('geminiRationStatus');if(el){el.textContent=message||'';el.dataset.state=state||'idle';}}
  function entryButton(){return d.querySelector('[data-ration-entry-method="voice"]');}
  function setEntryStatus(message,state,showFallback){
    var box=byId('workspaceMediaEntryStatus'),text=byId('workspaceMediaEntryStatusText'),fallback=byId('workspaceNativeVoiceFallback'),button=entryButton();
    if(box){box.hidden=!message;box.dataset.state=state||'idle';}
    if(text)text.textContent=message||'';
    if(fallback)fallback.hidden=!showFallback;
    if(button){button.setAttribute('aria-busy',state==='working'?'true':'false');button.dataset.mediaState=state||'idle';}
  }
  function pendingPanel(on,message){
    var panel=byId('geminiRationRecorderPanel'),label=byId('geminiRationRecorderState'),timer=byId('geminiRationRecorderTimer');
    if(panel){panel.hidden=!on;panel.dataset.recorderState=on?'starting':'idle';}
    if(label&&message)label.textContent=message;
    if(timer&&on)timer.textContent='0:00 / 5:00';
  }
  function policyAllowsMicrophone(){
    try{var p=d.permissionsPolicy||d.featurePolicy;if(p&&typeof p.allowsFeature==='function')return p.allowsFeature('microphone');}catch(_){}
    return true;
  }
  function stopStream(stream){try{if(stream&&typeof stream.getTracks==='function')stream.getTracks().forEach(function(t){try{t.stop();}catch(_){}});}catch(_){}}
  function clearVoiceTimers(){if(softTimer){w.clearTimeout(softTimer);softTimer=0;}if(hardTimer){w.clearTimeout(hardTimer);hardTimer=0;}}
  function microphoneError(error){
    var name=error&&error.name||'',message=error&&error.message||'';
    if(name==='NotAllowedError'||name==='PermissionDeniedError'){
      if(!policyAllowsMicrophone())return 'Браузер или контейнер страницы запретил микрофон. Откройте калькулятор в обычной вкладке браузера либо разрешите microphone для iframe.';
      return 'Доступ к микрофону не разрешён. В настройках сайта разрешите микрофон и повторите запись.';
    }
    if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'На устройстве не найден доступный микрофон.';
    if(name==='NotReadableError'||name==='TrackStartError')return 'Микрофон занят другим приложением или недоступен системе.';
    if(name==='OverconstrainedError'||name==='ConstraintNotSatisfiedError')return 'Браузер не смог применить параметры микрофона. Используйте системный диктофон или готовый аудиофайл.';
    if(name==='SecurityError')return 'Браузер заблокировал микрофон из-за настроек безопасности страницы.';
    if(name==='AbortError')return 'Подключение микрофона было прервано. Повторите попытку.';
    if(message&&/HTTPS|secure context/i.test(message))return message;
    return message?'Не удалось открыть микрофон: '+message:'Не удалось открыть микрофон.';
  }
  function finishFailure(error,token){
    if(token!=null&&token!==voiceToken)return false;
    clearVoiceTimers();voicePending=false;pendingPanel(false);
    var message=microphoneError(error);setStatus(message,'error');setEntryStatus(message,'error',true);return false;
  }
  function nativeVoiceInput(){
    var input=byId('workspaceNativeVoiceCaptureInput');if(input)return input;
    input=d.createElement('input');input.id='workspaceNativeVoiceCaptureInput';input.type='file';input.accept='audio/*';input.setAttribute('capture','microphone');input.hidden=true;
    input.addEventListener('change',function(){var files=Array.prototype.slice.call(input.files||[]);input.value='';if(files.length)ingest(files,'audio','microphone-native');});
    (d.body||d.documentElement).appendChild(input);return input;
  }
  function openNativeRecorder(){
    var input=nativeVoiceInput();setEntryStatus('Открываем системный диктофон или выбор аудиозаписи…','working',false);
    try{input.click();return true;}catch(error){finishFailure(new Error('Браузер не открыл системный диктофон. Выберите «Аудиофайл» или откройте калькулятор в обычном Chrome/Firefox.'));return false;}
  }
  function ensureModule(){
    if(api())return Promise.resolve(api());
    if(loadPromise)return loadPromise;
    loadPromise=new Promise(function(resolve,reject){
      var existing=d.querySelector('script[data-gemini-media-lazy-module]'),script=existing||d.createElement('script'),done=false;
      var timer=w.setTimeout(function(){if(done)return;done=true;loadPromise=null;reject(new Error('Модуль фото и голоса загружается слишком долго. Обновите страницу и повторите попытку.'));},20000);
      function finish(error){
        if(done)return;done=true;w.clearTimeout(timer);
        if(error){loadPromise=null;reject(error);return;}
        var ready=api();if(ready)resolve(ready);else{loadPromise=null;reject(new Error('Модуль фото и голоса загрузился некорректно.'));}
      }
      if(existing){
        if(api()){finish();return;}
        existing.addEventListener('load',function(){finish();},{once:true});existing.addEventListener('error',function(){finish(new Error('Не удалось загрузить модуль фото и голоса.'));},{once:true});return;
      }
      script.src=moduleUrl();script.async=true;script.setAttribute('data-gemini-media-lazy-module',VERSION);
      script.onload=function(){finish();};script.onerror=function(){finish(new Error('Не удалось загрузить модуль фото и голоса. Проверьте файлы на хостинге.'));};
      (d.head||d.documentElement).appendChild(script);
    });
    return loadPromise;
  }
  function ingest(files,kind,source){
    files=Array.prototype.slice.call(files||[]);if(!files.length){setEntryStatus('', 'idle', false);return Promise.resolve([]);}
    var preparing=kind==='image'?'Подготавливаем фотографию…':'Подготавливаем аудиозапись…';setStatus(preparing,'working');setEntryStatus(preparing,'working',false);
    return ensureModule().then(function(mod){
      if(!mod||typeof mod.ingestFiles!=='function')throw new Error('Модуль импорта не готов принимать файлы.');
      return mod.ingestFiles(files,kind,source);
    }).then(function(items){
      var ok=items&&items.length;setEntryStatus(ok?(kind==='image'?'Фотография подготовлена. Перейдите к блоку ИИ для распознавания.':'Аудиозапись подготовлена. Перейдите к блоку ИИ для распознавания.'):'Файл не был выбран.',ok?'success':'idle',false);if(ok)reveal();return items||[];
    }).catch(function(error){var message=error&&error.message?error.message:'Не удалось подготовить файл.';setStatus(message,'error');setEntryStatus(message,'error',kind==='audio');return [];});
  }
  function choose(inputId,kind){
    reveal();var input=byId(inputId);if(!input){var missing='Элемент выбора файла не найден. Обновите страницу.';setStatus(missing,'error');setEntryStatus(missing,'error',false);return;}
    setEntryStatus(kind==='image'?'Открываем выбор фотографии…':'Открываем выбор аудиофайла…','working',false);
    ensureModule().catch(function(error){setStatus(error.message,'error');setEntryStatus(error.message,'error',kind==='audio');});
    try{input.click();}catch(error){var message='Браузер не открыл выбор файла. Повторите попытку.';setStatus(message,'error');setEntryStatus(message,'error',false);}
  }
  function startVoice(){
    if(voicePending){setEntryStatus('Ожидаем ответ браузера на запрос микрофона. Если окно разрешения не появилось, откройте системный диктофон.','working',true);return false;}
    if(!w.isSecureContext||!navigator.mediaDevices||typeof navigator.mediaDevices.getUserMedia!=='function'){
      var unsupported='Прямая запись недоступна в этом режиме браузера. Открываем системный диктофон; также можно выбрать готовый аудиофайл.';setStatus(unsupported,'error');setEntryStatus(unsupported,'error',true);return openNativeRecorder();
    }
    voicePending=true;var token=++voiceToken;pendingPanel(true,'Подключаем микрофон…');setStatus('Запрашиваем доступ к микрофону…','working');setEntryStatus('Запрашиваем доступ к микрофону… Разрешите его во всплывающем окне браузера.','working',true);
    var streamPromise,modulePromise;
    try{
      /* Do not pre-block on document.featurePolicy: several Android WebViews report
         a false negative. The actual getUserMedia result is the source of truth. */
      streamPromise=navigator.mediaDevices.getUserMedia({audio:true});
    }catch(error){return finishFailure(error,token);}
    modulePromise=ensureModule();
    softTimer=w.setTimeout(function(){if(voicePending&&token===voiceToken)setEntryStatus('Браузер всё ещё ожидает разрешение на микрофон. Если окно не появилось, нажмите «Открыть диктофон».','working',true);},softTimeout());
    hardTimer=w.setTimeout(function(){
      if(!voicePending||token!==voiceToken)return;voicePending=false;voiceToken++;clearVoiceTimers();pendingPanel(false);
      var message='Браузер не ответил на запрос микрофона. Откройте калькулятор в обычной вкладке Chrome/Firefox либо используйте системный диктофон.';setStatus(message,'error');setEntryStatus(message,'error',true);
    },hardTimeout());
    Promise.all([Promise.resolve(streamPromise),modulePromise]).then(function(values){
      var stream=values[0],mod=values[1];if(token!==voiceToken||!voicePending){stopStream(stream);return false;}
      clearVoiceTimers();voicePending=false;
      if(!mod||typeof mod.startLiveRecordingWithStream!=='function'){stopStream(stream);throw new Error('Модуль записи загружен без совместимого обработчика микрофона.');}
      return Promise.resolve(mod.startLiveRecordingWithStream(stream)).then(function(started){
        if(started){setEntryStatus('Микрофон включён. Запись идёт; остановить её можно в открывшемся блоке ИИ.','success',false);reveal();}
        else{var lower=byId('geminiRationStatus'),message=lower&&lower.textContent?lower.textContent:'Запись не запустилась. Используйте системный диктофон или готовый аудиофайл.';setEntryStatus(message,'error',true);}
        return started;
      });
    }).catch(function(error){finishFailure(error,token);});
    return true;
  }
  function clickHandler(e){
    var target=e.currentTarget;if(api())return;
    e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    var id=target&&target.id||'';
    if(id==='geminiRationRecordAudio')startVoice();
    else if(id==='geminiRationChoosePhotos')choose('geminiRationPhotoInput','image');
    else if(id==='geminiRationTakePhoto')choose('geminiRationCameraInput','image');
    else if(id==='geminiRationChooseAudio')choose('geminiRationAudioInput','audio');
  }
  function changeHandler(e){
    if(api())return;var input=e.currentTarget,files=Array.prototype.slice.call(input.files||[]);if(!files.length)return;
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();input.value='';
    if(input.id==='geminiRationPhotoInput')ingest(files,'image','upload');
    else if(input.id==='geminiRationCameraInput')ingest(files,'image','camera');
    else ingest(files,'audio','upload');
  }
  function bindStatusMirror(){
    var status=byId('geminiRationStatus');if(!status||!w.MutationObserver||statusMirror)return;
    statusMirror=new MutationObserver(function(){var text=String(status.textContent||'').trim(),state=status.dataset.state||'idle';if(text&&!voicePending)setEntryStatus(text,state,state==='error');});
    try{statusMirror.observe(status,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-state']});}catch(_){statusMirror=null;}
  }
  function bind(){
    if(installed)return;installed=true;nativeVoiceInput();
    ['geminiRationChoosePhotos','geminiRationTakePhoto','geminiRationChooseAudio','geminiRationRecordAudio'].forEach(function(id){var el=byId(id);if(el){el.setAttribute('data-media-resilient-bridge','1');el.addEventListener('click',clickHandler,false);}});
    ['geminiRationPhotoInput','geminiRationCameraInput','geminiRationAudioInput'].forEach(function(id){var el=byId(id);if(el)el.addEventListener('change',changeHandler,false);});
    var fallback=byId('workspaceNativeVoiceFallback');if(fallback)fallback.addEventListener('click',function(e){e.preventDefault();openNativeRecorder();},false);
    bindStatusMirror();
  }
  function ready(fn){if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',fn,false);else fn();}
  w.NutritionMediaEntryBridge={version:VERSION,ensureModule:ensureModule,choosePhotos:function(){choose('geminiRationPhotoInput','image');},takePhoto:function(){choose('geminiRationCameraInput','image');},chooseAudio:function(){choose('geminiRationAudioInput','audio');},startVoice:startVoice,openNativeRecorder:openNativeRecorder,ingestFiles:ingest,policyAllowsMicrophone:policyAllowsMicrophone,isVoicePending:function(){return voicePending;},resetVoicePending:function(){voiceToken++;voicePending=false;clearVoiceTimers();pendingPanel(false);}};
  ready(bind);
})(window,document);
