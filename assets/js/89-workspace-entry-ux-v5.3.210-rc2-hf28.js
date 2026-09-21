/* Nutrition Calculator v5.3.210 RC2 HF28
 * Restores an explicit view switcher, provides a reliable return to profile,
 * and makes photo/voice ration entry visible at the point where products are added.
 * ES5-safe and shared by modern and compatibility runtimes.
 */
(function(w,d){
  'use strict';

  var VERSION='v5.3.210-rc2-hf28-media-resilient';
  var initialized=false;
  var syncTimer=0;

  function byId(id){return d.getElementById(id);}
  function shell(){try{return w.NavigationShellV1||null;}catch(_){return null;}}
  function shellState(){var api=shell();try{return api&&api.getState?api.getState():null;}catch(_){return null;}}
  function setText(node,value){value=String(value==null?'':value);if(node&&node.textContent!==value)node.textContent=value;}
  function setAttr(node,name,value){value=String(value);if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);}
  function toggle(node,name,on){if(node&&node.classList.contains(name)!==!!on)node.classList.toggle(name,!!on);}

  function createModeSwitcher(){
    var header=d.querySelector('#mainContent>header'),title=header&&header.querySelector('.title');
    if(!header||byId('workspaceViewSwitcher'))return;
    var box=d.createElement('div');
    box.id='workspaceViewSwitcher';
    box.className='workspace-view-switcher';
    box.setAttribute('role','group');
    box.setAttribute('aria-label','Режим отображения калькулятора');
    box.innerHTML='<span>Вид</span><button type="button" data-workspace-view-mode="workspace" aria-pressed="false">Разделы</button><button type="button" data-workspace-view-mode="long" aria-pressed="false">Полотно</button>';
    if(title&&title.nextSibling)header.insertBefore(box,title.nextSibling);else header.appendChild(box);
  }

  function createProfileBackAction(){
    var context=byId('navigationShellContext'),copy=context&&context.querySelector('.navigation-shell-context__copy');
    if(!context||byId('workspaceProfileBackAction'))return;
    var button=d.createElement('button');
    button.type='button';
    button.id='workspaceProfileBackAction';
    button.className='workspace-profile-back-action';
    button.setAttribute('data-workspace-profile-back','');
    button.innerHTML='<span aria-hidden="true">←</span> Профиль и потребности';
    if(copy&&copy.nextSibling)context.insertBefore(button,copy.nextSibling);else context.appendChild(button);
  }

  function methodIcon(kind){
    if(kind==='search')return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>';
    if(kind==='photo')return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>';
    if(kind==='voice')return '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"></rect><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"></path></svg>';
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v5h5"></path><path d="M9 15c1.2-2 4.8-2 6 0"></path></svg>';
  }

  function ensureMediaEntryStyles(){
    if(byId('workspaceMediaEntryStatusStyles'))return;
    var style=d.createElement('style');style.id='workspaceMediaEntryStatusStyles';
    style.textContent="#workspaceMediaEntryStatus{grid-column:1/-1;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-top:8px;padding:10px 12px;border:1px solid #b8cbe0;border-radius:12px;background:#f7faff;color:#29455f;font-size:12px;line-height:1.4}#workspaceMediaEntryStatus[hidden]{display:none!important}#workspaceMediaEntryStatus[data-state=working]{border-color:#8db9e5;background:#edf6ff;color:#174f80}#workspaceMediaEntryStatus[data-state=success]{border-color:#9bc9ae;background:#f1faf4;color:#245c39}#workspaceMediaEntryStatus[data-state=error]{border-color:#e0b3ad;background:#fff6f4;color:#7a3028}#workspaceMediaEntryStatusText{min-width:0;flex:1}#workspaceNativeVoiceFallback{flex:0 0 auto;min-height:38px!important;padding:7px 10px!important;border:1px solid currentColor!important;border-radius:9px!important;background:#fff!important;color:inherit!important;font-size:11px!important;font-weight:800!important}.workspace-ration-entry-methods__grid button[aria-busy=true]{filter:saturate(.82);box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)!important}.workspace-ration-entry-methods__grid button[data-media-state=error]{outline:2px solid rgba(153,55,43,.28);outline-offset:2px}@media(max-width:520px){#workspaceMediaEntryStatus{display:grid}#workspaceNativeVoiceFallback{width:100%}}";
    (d.head||d.documentElement).appendChild(style);
  }

  function createRationEntryMethods(){
    var search=byId('globalSearchSection'),head=search&&search.querySelector('.search-hero-head');
    if(!search||byId('workspaceRationEntryMethods'))return;
    var panel=d.createElement('section');
    panel.id='workspaceRationEntryMethods';
    panel.className='workspace-ration-entry-methods';
    panel.setAttribute('aria-labelledby','workspaceRationEntryMethodsTitle');
    panel.innerHTML=''+
      '<div class="workspace-ration-entry-methods__copy"><span>Добавление продуктов</span><strong id="workspaceRationEntryMethodsTitle">Поиск или ИИ-распознавание</strong><small>ИИ может распознать продукты по фотографии, голосу или готовому аудиофайлу.</small><em>Нажатие сразу открывает выбор фотографии, аудиофайла или запись голоса. Калькулятор не запрашивает пароли и платёжные данные.</em></div>'+
      '<div class="workspace-ration-entry-methods__grid">'+
        '<button type="button" data-ration-entry-method="search">'+methodIcon('search')+'<span><b>По названию</b><small>Поиск в базе</small></span></button>'+
        '<button type="button" data-ration-entry-method="photo">'+methodIcon('photo')+'<span><b>По фотографии</b><small>Распознать с ИИ</small></span></button>'+
        '<button type="button" data-ration-entry-method="voice">'+methodIcon('voice')+'<span><b>Записать голос</b><small>Распознать с ИИ</small></span></button>'+
        '<button type="button" data-ration-entry-method="audio">'+methodIcon('audio')+'<span><b>Аудиофайл</b><small>Распознать с ИИ</small></span></button>'+
      '</div>'+
      '<div id="workspaceMediaEntryStatus" role="status" aria-live="polite" data-state="idle" hidden><span id="workspaceMediaEntryStatusText"></span><button type="button" id="workspaceNativeVoiceFallback" hidden>Открыть диктофон</button></div>';
    if(head&&head.nextSibling)search.insertBefore(panel,head.nextSibling);else search.insertBefore(panel,search.firstChild);
  }

  function normalizeProfileCopy(){
    var label=d.querySelector('label[for="needs_person_name"]'),helper=label&&label.parentNode?label.parentNode.querySelector('.small'):null;
    setText(label,'Имя или ФИО (необязательно)');
    setText(helper,'Используется только в локальном отчёте; поле можно оставить пустым.');
  }

  function openSecondaryTools(){
    var details=byId('workspaceRationSecondary');
    if(details){details.open=true;d.documentElement.setAttribute('data-workspace-secondary-open','1');}
  }

  function revealAiSection(focusTarget){
    openSecondaryTools();
    var section=byId('geminiRationImportSection');
    if(section){
      try{section.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){try{section.scrollIntoView(true);}catch(__){}}
    }
    if(focusTarget){try{focusTarget.focus({preventScroll:true});}catch(_){try{focusTarget.focus();}catch(__){}}}
  }

  function handleEntryMethod(kind){
    if(kind==='search'){
      var input=byId('globalSearchInput');
      if(input){try{input.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){input.scrollIntoView(true);}try{input.focus({preventScroll:true});}catch(_){try{input.focus();}catch(__){}}}
      return;
    }
    openSecondaryTools();
    var target=kind==='photo'?byId('geminiRationChoosePhotos'):kind==='voice'?byId('geminiRationRecordAudio'):byId('geminiRationChooseAudio');
    revealAiSection(target);
    if(!target)return;
    toggle(target,'workspace-entry-target',true);
    setAttr(target,'data-entry-guided','true');
    w.setTimeout(function(){toggle(target,'workspace-entry-target',false);try{target.removeAttribute('data-entry-guided');}catch(_){}},1200);
    if(target.disabled)return;
    /* Keep media acquisition inside the trusted click while loading the full
       AI module only on demand. This preserves mobile permissions and fast startup. */
    try{
      var bridge=w.NutritionMediaEntryBridge;
      if(bridge){
        if(kind==='photo'&&typeof bridge.choosePhotos==='function')bridge.choosePhotos();
        else if(kind==='voice'&&typeof bridge.startVoice==='function')bridge.startVoice();
        else if(kind==='audio'&&typeof bridge.chooseAudio==='function')bridge.chooseAudio();
        else target.click();
      }else target.click();
    }catch(_){
      try{target.focus();}catch(__){}
    }
  }

  function goToProfile(){
    var api=shell();
    if(api&&typeof api.navigate==='function'){api.navigate('profile');return;}
    try{w.location.hash='#profile';}catch(_){}
  }

  function setMode(mode){
    var api=shell();
    if(api&&typeof api.setMode==='function')api.setMode(mode==='long'?'long':'workspace');
  }

  function sync(){
    normalizeProfileCopy();
    var state=shellState(),mode=state&&state.mode?state.mode:(d.documentElement.getAttribute('data-navigation-shell')||'workspace'),route=state&&state.route?state.route:(d.documentElement.getAttribute('data-navigation-route')||'');
    var buttons=d.querySelectorAll('[data-workspace-view-mode]'),i,value,active;
    for(i=0;i<buttons.length;i++){
      value=buttons[i].getAttribute('data-workspace-view-mode');active=value===mode;
      setAttr(buttons[i],'aria-pressed',active?'true':'false');toggle(buttons[i],'is-active',active);
    }
    var back=byId('workspaceProfileBackAction');
    if(back)back.hidden=mode!=='workspace'||route==='profile';
  }

  function scheduleSync(){w.clearTimeout(syncTimer);syncTimer=w.setTimeout(sync,20);}

  function bind(){
    d.addEventListener('click',function(e){
      var mode=e.target&&e.target.closest?e.target.closest('[data-workspace-view-mode]'):null;
      if(mode){e.preventDefault();setMode(mode.getAttribute('data-workspace-view-mode'));return;}
      var back=e.target&&e.target.closest?e.target.closest('[data-workspace-profile-back],#workspacePersonEdit'):null;
      if(back){e.preventDefault();goToProfile();return;}
      var nativeVoice=e.target&&e.target.closest?e.target.closest('#workspaceNativeVoiceFallback'):null;
      if(nativeVoice){e.preventDefault();var mediaBridge=w.NutritionMediaEntryBridge;if(mediaBridge&&typeof mediaBridge.openNativeRecorder==='function')mediaBridge.openNativeRecorder();return;}
      var entry=e.target&&e.target.closest?e.target.closest('[data-ration-entry-method]'):null;
      if(entry){e.preventDefault();handleEntryMethod(entry.getAttribute('data-ration-entry-method'));return;}
    },false);
    ['navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','workspace-profile:ready','workspace-slice:ready','app:ready'].forEach(function(name){w.addEventListener(name,scheduleSync,false);});
    d.addEventListener('input',function(e){if(e.target&&e.target.id==='needs_person_name')scheduleSync();},true);
  }

  function init(){
    if(initialized)return;initialized=true;
    ensureMediaEntryStyles();createModeSwitcher();createProfileBackAction();createRationEntryMethods();normalizeProfileCopy();bind();sync();
    w.NutritionWorkspaceEntryUXHF28={version:VERSION,refresh:sync,goToProfile:goToProfile,setMode:setMode,revealAiSection:revealAiSection};
    try{w.dispatchEvent(new CustomEvent('workspace-entry-ux:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
