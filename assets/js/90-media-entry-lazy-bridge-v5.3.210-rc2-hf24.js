/* Nutrition Calculator v5.3.210 RC2 HF24
 * Tiny trusted-gesture bridge for camera, file and microphone entry.
 * The full Gemini import module is loaded only when media entry is used.
 */
(function(w,d){
  'use strict';
  var VERSION='v5.3.210-rc2-hf24-media-lazy';
  var loadPromise=null, voicePending=false, installed=false;

  function byId(id){return d.getElementById(id);}
  function api(){return w.NutritionGeminiRationImport||null;}
  function moduleUrl(){
    var m=w.__NUTRITION_RUNTIME_MANIFEST__||{},lazy=m.lazyFeatureScripts||{};
    return lazy.geminiMediaImport||'./assets/js/62-gemini-ration-import-v5.js?v=v5.3.210-rc2-hf24-media-lazy';
  }
  function openTools(){var details=byId('workspaceRationSecondary');if(details)details.open=true;}
  function reveal(){
    openTools();var section=byId('geminiRationImportSection');
    if(section){try{section.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{section.scrollIntoView(true);}catch(__){}}}
  }
  function setStatus(message,state){
    var el=byId('geminiRationStatus');if(el){el.textContent=message||'';el.dataset.state=state||'idle';}
  }
  function pendingPanel(on,message){
    var panel=byId('geminiRationRecorderPanel'),label=byId('geminiRationRecorderState'),timer=byId('geminiRationRecorderTimer');
    if(panel){panel.hidden=!on;panel.dataset.recorderState=on?'starting':'idle';}
    if(label&&message)label.textContent=message;
    if(timer&&on)timer.textContent='0:00 / 5:00';
  }
  function policyAllowsMicrophone(){
    try{
      var p=d.permissionsPolicy||d.featurePolicy;
      if(p&&typeof p.allowsFeature==='function')return p.allowsFeature('microphone');
    }catch(_){}
    return true;
  }
  function stopStream(stream){
    try{if(stream&&typeof stream.getTracks==='function')stream.getTracks().forEach(function(t){try{t.stop();}catch(_){}});}catch(_){}
  }
  function microphoneError(error){
    var name=error&&error.name||'';
    if(name==='NotAllowedError'||name==='PermissionDeniedError')return 'Доступ к микрофону не разрешён. Откройте настройки сайта, разрешите микрофон и повторите запись.';
    if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'На устройстве не найден доступный микрофон.';
    if(name==='NotReadableError'||name==='TrackStartError')return 'Микрофон занят другим приложением или недоступен системе.';
    if(name==='OverconstrainedError'||name==='ConstraintNotSatisfiedError')return 'Браузер не смог применить параметры микрофона. Повторите попытку или выберите готовый аудиофайл.';
    if(name==='SecurityError')return 'Браузер заблокировал микрофон из-за настроек безопасности страницы.';
    if(name==='AbortError')return 'Подключение микрофона было прервано. Повторите попытку.';
    return error&&error.message?'Не удалось открыть микрофон: '+error.message:'Не удалось открыть микрофон.';
  }
  function showMicrophoneFailure(error){
    voicePending=false;pendingPanel(false);reveal();setStatus(microphoneError(error),'error');
  }
  function ensureModule(){
    if(api())return Promise.resolve(api());
    if(loadPromise)return loadPromise;
    loadPromise=new Promise(function(resolve,reject){
      var existing=d.querySelector('script[data-gemini-media-lazy-module]'),script=existing||d.createElement('script'),done=false;
      var timer=w.setTimeout(function(){if(done)return;done=true;reject(new Error('Модуль фото и голоса загружается слишком долго. Обновите страницу и повторите попытку.'));},20000);
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
    files=Array.prototype.slice.call(files||[]);if(!files.length)return Promise.resolve([]);
    setStatus(kind==='image'?'Подготавливаем фотографию…':'Подготавливаем аудиофайл…','working');
    return ensureModule().then(function(mod){
      if(!mod||typeof mod.ingestFiles!=='function')throw new Error('Модуль импорта не готов принимать файлы.');
      return mod.ingestFiles(files,kind,source);
    }).catch(function(error){setStatus(error&&error.message?error.message:'Не удалось подготовить файл.','error');return [];});
  }
  function choose(inputId){
    reveal();var input=byId(inputId);if(!input){setStatus('Элемент выбора файла не найден. Обновите страницу.','error');return;}
    ensureModule().catch(function(error){setStatus(error.message,'error');});
    try{input.click();}catch(error){setStatus('Браузер не открыл выбор файла. Повторите попытку.','error');}
  }
  function startVoice(){
    if(voicePending)return;reveal();
    if(!w.isSecureContext||!navigator.mediaDevices||typeof navigator.mediaDevices.getUserMedia!=='function'){
      showMicrophoneFailure(new Error('Прямая запись работает только через HTTPS (или localhost) в браузере с поддержкой микрофона.'));return;
    }
    if(!policyAllowsMicrophone()){
      showMicrophoneFailure(new Error('Доступ к микрофону запрещён политикой страницы. Если калькулятор открыт внутри конструктора или iframe, для него требуется разрешение allow="microphone".'));return;
    }
    voicePending=true;pendingPanel(true,'Подключаем микрофон…');setStatus('Запрашиваем доступ к микрофону…','working');
    var streamPromise;
    try{
      /* Keep the request deliberately simple for Android WebView, Yandex Browser and Safari. */
      streamPromise=navigator.mediaDevices.getUserMedia({audio:true});
    }catch(error){showMicrophoneFailure(error);return;}
    Promise.all([Promise.resolve(streamPromise),ensureModule()]).then(function(values){
      var stream=values[0],mod=values[1];voicePending=false;
      if(!mod||typeof mod.startLiveRecordingWithStream!=='function'){stopStream(stream);throw new Error('Модуль записи загружен без совместимого обработчика микрофона.');}
      return mod.startLiveRecordingWithStream(stream);
    }).catch(function(error){showMicrophoneFailure(error);});
  }
  function clickHandler(e){
    var target=e.currentTarget;if(api())return;
    e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    var id=target&&target.id||'';
    if(id==='geminiRationRecordAudio')startVoice();
    else if(id==='geminiRationChoosePhotos')choose('geminiRationPhotoInput');
    else if(id==='geminiRationTakePhoto')choose('geminiRationCameraInput');
    else if(id==='geminiRationChooseAudio')choose('geminiRationAudioInput');
  }
  function changeHandler(e){
    if(api())return;var input=e.currentTarget,files=Array.prototype.slice.call(input.files||[]);if(!files.length)return;
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();input.value='';
    if(input.id==='geminiRationPhotoInput')ingest(files,'image','upload');
    else if(input.id==='geminiRationCameraInput')ingest(files,'image','camera');
    else ingest(files,'audio','upload');
  }
  function bind(){
    if(installed)return;installed=true;
    ['geminiRationChoosePhotos','geminiRationTakePhoto','geminiRationChooseAudio','geminiRationRecordAudio'].forEach(function(id){var el=byId(id);if(el){el.setAttribute('data-media-lazy-bridge','1');el.addEventListener('click',clickHandler,false);}});
    ['geminiRationPhotoInput','geminiRationCameraInput','geminiRationAudioInput'].forEach(function(id){var el=byId(id);if(el)el.addEventListener('change',changeHandler,false);});
  }
  function ready(fn){if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',fn,false);else fn();}
  w.NutritionMediaEntryBridge={version:VERSION,ensureModule:ensureModule,choosePhotos:function(){choose('geminiRationPhotoInput');},takePhoto:function(){choose('geminiRationCameraInput');},chooseAudio:function(){choose('geminiRationAudioInput');},startVoice:startVoice,ingestFiles:ingest,policyAllowsMicrophone:policyAllowsMicrophone};
  ready(bind);
})(window,document);
