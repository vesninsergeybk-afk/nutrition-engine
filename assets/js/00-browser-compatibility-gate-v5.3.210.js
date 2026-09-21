/* v5.3.210 — ES5-safe early browser compatibility gate; Gemini AI decision support simplification pass build label refresh */
(function(w,d){
  'use strict';
  var VERSION='v5.3.210_rc2_hosting_hotfix_19';
  function syntaxOK(source){try{return !!(new Function(source))();}catch(e){return false;}}
  function has(name,value){return {name:name,ok:!!value};}
  var tests=[];
  tests.push(has('ES2015 syntax',syntaxOK('"use strict"; var f=(x)=>x+1; const a=1; let b=1; return f(a+b)===3;')));
  tests.push(has('generator syntax',syntaxOK('function* g(){yield 1;} return g().next().value===1;')));
  tests.push(has('ES2020 syntax',syntaxOK('var a={x:1}; return (a?.x ?? 0)===1;')));
  tests.push(has('Promise',typeof w.Promise==='function'));
  tests.push(has('Map',typeof w.Map==='function'));
  tests.push(has('Set',typeof w.Set==='function'));
  tests.push(has('JSON',typeof w.JSON==='object'&&typeof w.JSON.parse==='function'));
  tests.push(has('querySelector',typeof d.querySelector==='function'));
  tests.push(has('addEventListener',typeof w.addEventListener==='function'));
  tests.push(has('XMLHttpRequest',typeof w.XMLHttpRequest==='function'));
  tests.push(has('fetch',typeof w.fetch==='function'));
  tests.push(has('URL',typeof w.URL==='function'));
  tests.push(has('URLSearchParams',typeof w.URLSearchParams==='function'));
  tests.push(has('CustomEvent',typeof w.CustomEvent==='function'));
  tests.push(has('Object.assign',typeof Object.assign==='function'));
  tests.push(has('Array.from',typeof Array.from==='function'));
  var byName={},i;
  for(i=0;i<tests.length;i++)byName[tests[i].name]=tests[i].ok;
  var baseline=byName['ES2015 syntax']&&byName['generator syntax']&&byName.Promise&&byName.Map&&byName.Set&&byName.JSON&&byName.querySelector&&byName.addEventListener&&byName.XMLHttpRequest;
  var modern=baseline&&byName['ES2020 syntax']&&byName.fetch&&byName.URL&&byName.URLSearchParams&&byName.CustomEvent&&byName['Object.assign']&&byName['Array.from'];
  var mode=modern?'modern':(baseline?'legacy':'unsupported');
  var forced='';try{var m=(w.location.search||'').match(/[?&]compat=(modern|legacy|unsupported)(?:&|$)/);forced=m?m[1]:'';}catch(e){}
  if(forced==='legacy'&&baseline)mode='legacy';else if(forced==='unsupported')mode='unsupported';else if(forced==='modern'&&modern)mode='modern';
  var failed=[];for(i=0;i<tests.length;i++)if(!tests[i].ok)failed.push(tests[i].name);
  var info={version:VERSION,mode:mode,modern:mode==='modern',baseline:baseline,failed:failed,tests:tests,userAgent:(w.navigator&&w.navigator.userAgent)||'',platform:(w.navigator&&w.navigator.platform)||'',language:(w.navigator&&w.navigator.language)||'',forced:forced};
  w.__BROWSER_COMPAT__=info;w.__LEGACY_COMPAT_MODE__=mode==='legacy';
  try{d.documentElement.setAttribute('data-compat-mode',mode);if(mode==='legacy'){d.documentElement.setAttribute('data-theme','modern');w.__INITIAL_UI_THEME__='modern';}}catch(e){}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function render(kind,extra){
    if(d.getElementById('browserCompatibilityNotice'))return;
    var title=kind==='runtime-error'?'Не удалось загрузить файлы калькулятора':'Браузер слишком старый для безопасного запуска';
    var text=kind==='runtime-error'?'Загрузка прервалась или на сервере отсутствует один из файлов приложения. Расчёты не начаты.':'В браузере нет базовых возможностей JavaScript, которые нужны для расчётов, поиска и сохранения рациона.';
    var failedText=info.failed.length?info.failed.join(', '):'не определены';
    var div=d.createElement('div');div.id='browserCompatibilityNotice';div.className='browser-compat-notice';div.setAttribute('role','alert');
    var listHtml=kind==='runtime-error'
      ? '<li>Подождите устойчивого соединения и нажмите «Проверить снова».</li><li>Если ошибка повторяется, проверьте, что папки assets и data загружены на сервер полностью.</li><li>Откройте «Технические сведения»: там будет указана причина или недоступный файл.</li>'
      : '<li>Обновите iOS/Android и браузер до доступной версии.</li><li>Либо откройте калькулятор в более новом Safari, Chrome, Edge или Firefox.</li><li>Данные рациона не изменялись: приложение не начало расчёт в несовместимой среде.</li>';
    var foot=kind==='runtime-error'?'На медленном хостинге первый запуск может занять больше времени; повторные открытия используют кэш браузера.':'Сборка v5.3.210. Промежуточные старые браузеры запускаются в облегчённом режиме; слишком старые блокируются до расчёта.';
    div.innerHTML='<div class="browser-compat-card"><div class="browser-compat-kicker">Калькулятор нутриентов Сергея Веснина</div><h1>'+esc(title)+'</h1><p>'+esc(text)+'</p><ul class="browser-compat-list">'+listHtml+'</ul><div class="browser-compat-actions"><button type="button" id="browserCompatReload">Проверить снова</button><button type="button" class="secondary" id="browserCompatDetailsToggle">Технические сведения</button></div><div class="browser-compat-details" id="browserCompatDetails" hidden>Режим: '+esc(info.mode)+'\nНедоступно: '+esc(failedText)+'\n'+esc(info.userAgent)+(extra?'\n'+esc(extra):'')+'</div><p class="browser-compat-foot">'+esc(foot)+'</p></div>';
    function mount(){if(!d.body)return;d.body.appendChild(div);var r=d.getElementById('browserCompatReload');if(r)r.onclick=function(){w.location.reload();};var t=d.getElementById('browserCompatDetailsToggle'),x=d.getElementById('browserCompatDetails');if(t&&x)t.onclick=function(){if(x.hasAttribute('hidden'))x.removeAttribute('hidden');else x.setAttribute('hidden','');};}
    if(d.body)mount();else d.addEventListener('DOMContentLoaded',mount,false);
  }
  w.__renderBrowserCompatibilityNotice__=render;
  if(mode==='unsupported')render(mode,'Минимальный legacy-уровень также недоступен.');
  var ready=false;if(w.addEventListener){
    w.addEventListener('app:ready',function(){ready=true;var n=d.getElementById('browserCompatibilityNotice');if(n&&n.parentNode)n.parentNode.removeChild(n);},false);
    w.addEventListener('app:boot-fatal',function(ev){var x=ev&&ev.detail||{};render('runtime-error',(x.message||'Ошибка загрузки.')+(x.detail?'\n'+x.detail:''));},false);
    w.addEventListener('load',function(){setTimeout(function(){
      /* A product-loading promise means bootstrap is alive. Slow shared hosting must not be mislabeled as an incompatible browser. */
      if(!ready&&mode!=='unsupported'&&!w.__APP_BOOTSTRAP_META__&&!w.__PRODUCTS_READY__)render('runtime-error','Стартовый модуль не был загружен. Проверьте полноту загрузки папки assets.');
    },90000);},false);
  }
})(window,document);
