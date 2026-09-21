// nutrition calculator v5.2.38_scroll_state_guard
// Module: 00-runtime-bootstrap-v5.js
// Responsibility: fast critical-shell startup + background product/runtime loading + resilient fallbacks + perf metadata.
(function(){
  'use strict';
  var RELEASE_GATE_VERSION = 'v5.3.210-rc2-hf25-splash-balance';
  var VERSION = 'v5.3.210_rc2_hosting_hotfix_25_splash_balance';
  var qs = new URLSearchParams(location.search || '');
  var DEV = qs.get('dev') === '1' || qs.get('dev') === 'legacy';
  var SELFTEST = qs.get('selftest') === '1';
  var PERF = qs.get('perf') === '1' || DEV || SELFTEST;
  var startedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  // UX balance: keep the already-ready splash perceptible without tying it to background data loading.
  var MIN_BLOCKING_LOADER_MS = 1450;
  var LOADER_FADE_MS = 340;
  var dataStartedAt = 0;
  var scriptsStartedAt = 0;
  var dataBytes = 0;
  var loadedDataUrl = '';
  var loadedScripts = [];
  var failedScripts = [];
  var recoveredRequests = [];

  var RUNTIME_MANIFEST = window.__NUTRITION_RUNTIME_MANIFEST__;
  var EXPECTED_RUNTIME_RELEASE = window.__EXPECTED_RUNTIME_RELEASE__ || RELEASE_GATE_VERSION;
  if (!RUNTIME_MANIFEST || RUNTIME_MANIFEST.version !== EXPECTED_RUNTIME_RELEASE || EXPECTED_RUNTIME_RELEASE !== RELEASE_GATE_VERSION) {
    var actualVersion = RUNTIME_MANIFEST && RUNTIME_MANIFEST.version ? RUNTIME_MANIFEST.version : 'отсутствует';
    var mismatchDetail = 'Несогласованные версии загрузчика. Ожидалось: ' + EXPECTED_RUNTIME_RELEASE + '; bootstrap: ' + RELEASE_GATE_VERSION + '; манифест: ' + actualVersion + '.';
    window.__APP_BOOTSTRAP_META__ = { version: VERSION, status: 'fatal', expected: EXPECTED_RUNTIME_RELEASE, bootstrap: RELEASE_GATE_VERSION, manifest: actualVersion };
    if (typeof window.__renderBrowserCompatibilityNotice__ === 'function') window.__renderBrowserCompatibilityNotice__('runtime-error', mismatchDetail);
    return;
  }
  window.__APP_BOOTSTRAP_META__ = { version: VERSION, status: 'loading', release: EXPECTED_RUNTIME_RELEASE };
  var PRODUCT_CHUNK_URLS = RUNTIME_MANIFEST.productJsonChunks.slice();
  var PRODUCT_CHUNK_FALLBACK_SETS = [PRODUCT_CHUNK_URLS.slice()];
  var PRODUCT_SCRIPT_CHUNK_URLS = RUNTIME_MANIFEST.productScriptChunks.slice();
  var DATA_URLS = PRODUCT_CHUNK_URLS.concat.apply(PRODUCT_CHUNK_URLS.slice(), PRODUCT_CHUNK_FALLBACK_SETS);
  var CORE_SCRIPTS = RUNTIME_MANIFEST.modernCoreScripts.slice();
  var CRITICAL_SHELL_SCRIPTS = (RUNTIME_MANIFEST.criticalShellScripts && RUNTIME_MANIFEST.criticalShellScripts.modern) ? RUNTIME_MANIFEST.criticalShellScripts.modern.slice() : [];
  var CRITICAL_SHELL_SOURCE_SCRIPTS = (RUNTIME_MANIFEST.criticalShellSources && RUNTIME_MANIFEST.criticalShellSources.modern) ? RUNTIME_MANIFEST.criticalShellSources.modern.slice() : [];
  var DEFERRED_RUNTIME_SOURCE_SCRIPTS = (RUNTIME_MANIFEST.deferredRuntimeSources && RUNTIME_MANIFEST.deferredRuntimeSources.modern) ? RUNTIME_MANIFEST.deferredRuntimeSources.modern.slice() : [];
  var DEFERRED_RUNTIME_BUNDLE = (RUNTIME_MANIFEST.deferredRuntimeBundles && RUNTIME_MANIFEST.deferredRuntimeBundles.modern) || '';
  var DEFERRED_RUNTIME_COMPRESSED = (RUNTIME_MANIFEST.deferredRuntimeCompressed && RUNTIME_MANIFEST.deferredRuntimeCompressed.modern) || '';
  var PRODUCT_BUNDLE_SCRIPT = RUNTIME_MANIFEST.productBundleScript || '';
  var PRODUCT_COMPRESSED_JSON = RUNTIME_MANIFEST.productCompressedJson || '';
  var shellReadyAt = 0;
  var fullReadyAt = 0;
  var SELFTEST_SCRIPTS = RUNTIME_MANIFEST.selftestScripts.slice();
  var LEGACY_TEST_SCRIPTS = RUNTIME_MANIFEST.diagnosticScripts.slice();
  var PERF_SCRIPT = RUNTIME_MANIFEST.performanceScript;

  function installLateDomReadyShim(){
    if (window.__LATE_DOM_READY_SHIM_INSTALLED__) return;
    window.__LATE_DOM_READY_SHIM_INSTALLED__ = true;
    var nativeDocumentAdd = document.addEventListener.bind(document);
    var nativeWindowAdd = window.addEventListener.bind(window);
    // Dynamic runtime scripts may arrive after DOMContentLoaded while readyState is still "interactive".
    // Treat every non-loading state as ready so late listeners are replayed deterministically.
    var domReadyFired = document.readyState !== 'loading';
    nativeDocumentAdd('DOMContentLoaded', function(){ domReadyFired = true; }, { once:true });
    function makeReadyEvent(){
      try { return new Event('DOMContentLoaded', { bubbles:true, cancelable:false }); }
      catch(_) { var ev = document.createEvent('Event'); ev.initEvent('DOMContentLoaded', true, false); return ev; }
    }
    function invokeDomReadyListener(target, listener){
      if (!listener) return; var ev = makeReadyEvent();
      try { if (typeof listener === 'function') listener.call(target, ev); else if (listener && typeof listener.handleEvent === 'function') listener.handleEvent(ev); }
      catch (err) { setTimeout(function(){ throw err; }, 0); }
    }
    function patchedAdd(target, nativeAdd){
      return function(type, listener, options){
        if (type === 'DOMContentLoaded' && listener && (domReadyFired || document.readyState !== 'loading')) {
          setTimeout(function(){ invokeDomReadyListener(target, listener); }, 0);
          return;
        }
        return nativeAdd(type, listener, options);
      };
    }
    document.addEventListener = patchedAdd(document, nativeDocumentAdd);
    window.addEventListener = patchedAdd(window, nativeWindowAdd);
  }
  installLateDomReadyShim();

  function now(){ return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  
  
  
  
  

  
  function timeoutPromise(promise, ms, label){
    var timer;
    var timeout = new Promise(function(_, reject){
      timer = setTimeout(function(){ reject(new Error((label || 'operation') + ' timed out after ' + ms + 'ms')); }, ms);
    });
    return Promise.race([promise, timeout]).then(function(v){ clearTimeout(timer); return v; }, function(e){ clearTimeout(timer); throw e; });
  }
  function fetchTextHard(url, timeoutMs, purpose){
    timeoutMs = timeoutMs || 12000;
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function(){ try { controller.abort(); } catch(_) {} }, timeoutMs) : null;
    var cacheMode = (purpose === 'manifest') ? 'default' : 'default';
    var req = fetch(url, { cache: cacheMode, credentials:'same-origin', signal: controller ? controller.signal : undefined }).then(function(resp){
      if (timer) clearTimeout(timer);
      if (!resp.ok) throw new Error('HTTP status ' + resp.status + ' while loading ' + url);
      return resp.text().then(function(text){
        if (purpose !== 'manifest') dataBytes += text.length || 0;
        var trimmed = text.replace(/^\s+/, '');
        if (trimmed.charAt(0) === '<') throw new Error('Expected JSON but received HTML from ' + url);
        return text;
      });
    }).catch(function(e){
      if (timer) clearTimeout(timer);
      throw e;
    });
    return timeoutPromise(req, timeoutMs + 1500, purpose || url);
  }
  var LOADER_MANIFEST_URL = './assets/loader/loader-assets-v5.3.37.json?v=v5.3.138';
  var LOADER_SPRITE = {
    version: 'v5.3.37_diet_profile_matrix_grid_dashboard',
    url: './assets/loader/loader-sprite-sheet-v5.3.37.png?v=v5.3.138',
    fallbackUrl: './assets/loader/loader-fallback-v5.3.37.png?v=v5.3.138',
    frameSize: 128,
    columns: 8,
    rows: 4,
    total: 32,
    failed: false
  };
  var LOADER_ART_SPEC = {
    version: 'v5.3.37_diet_profile_matrix_grid_dashboard',
    pipeline: 'manifest-driven external sprite sheet',
    manifest: LOADER_MANIFEST_URL,
    file: LOADER_SPRITE.url,
    fallback: LOADER_SPRITE.fallbackUrl,
    canvas: '128x128 per frame',
    grid: '8x4',
    frames: 32,
    palette: ['near-black','dark gray','light gray','white'],
    rendering: 'CSS background-position + image-rendering: pixelated',
    note: 'Production loader assets are loaded from JSON manifest; bootstrap keeps only a minimal fallback registry.'
  };
  if (typeof window !== 'undefined') { window.__LOADER_ART_SPEC__ = LOADER_ART_SPEC; }

  var LOADER_ASSETS = [{"id":"boot_default","frame":0,"stages":["boot"],"tags":["boot"],"weight":1},{"id":"product_database","frame":1,"stages":["products"],"tags":["products"],"weight":1},{"id":"hei_analysis","frame":8,"stages":["runtime"],"tags":["hei"],"weight":1},{"id":"data_check","frame":24,"stages":["finalize"],"tags":["check"],"weight":1},{"id":"done_default","frame":12,"stages":["done"],"tags":["done"],"weight":1},{"id":"error_default","frame":15,"stages":["error"],"tags":["error"],"weight":1}];
  var LOADER_STAGE_POOLS = {"boot":["boot_default"],"products":["product_database"],"runtime":["hei_analysis"],"finalize":["data_check"],"done":["done_default"],"error":["error_default"]};
  var LOADER_STAGE_SUBPOOLS = {"productsPrimary":["product_database"],"productsSecondary":["product_database"],"runtimeEarly":["hei_analysis"],"runtimeLate":["hei_analysis"],"finalizePrimary":["data_check"],"donePrimary":["done_default"]};
  var LOADER_THEMES = {"fallbackSafe":{"label":"Fallback safe","stagePools":{"products":["product_database"],"runtime":["hei_analysis"],"finalize":["data_check"],"done":["done_default"]},"weight":1}};
  var LOADER_ASSETS_BY_ID = {};
  var LOADER_RUN = null;
  var LOADER_MANIFEST_STATE = { loading:false, loaded:false, error:null, data:null, promise:null };

  function indexLoaderAssets(){
    LOADER_ASSETS_BY_ID = {};
    for (var lai = 0; lai < LOADER_ASSETS.length; lai++) LOADER_ASSETS_BY_ID[LOADER_ASSETS[lai].id] = LOADER_ASSETS[lai];
  }
  indexLoaderAssets();

  function normalizeLoaderPath(path){
    if (!path) return '';
    if (/^(?:https?:)?\/\//.test(path)) return path;
    if (path.charAt(0) === '.') return path;
    return './' + path.replace(/^\/+/, '');
  }
  function withLoaderVersion(url){
    if (!url) return url;
    return url.indexOf('?') >= 0 ? url : (url + '?v=v5.3.138');
  }
  function applyLoaderManifest(data){
    if (!data || !Array.isArray(data.assets)) throw new Error('Invalid loader manifest');
    LOADER_SPRITE.version = data.version || LOADER_SPRITE.version;
    LOADER_SPRITE.url = withLoaderVersion(normalizeLoaderPath(data.sprite || LOADER_SPRITE.url));
    LOADER_SPRITE.fallbackUrl = withLoaderVersion(normalizeLoaderPath(data.fallbackSprite || LOADER_SPRITE.fallbackUrl));
    LOADER_SPRITE.frameSize = Number(data.frameSize || LOADER_SPRITE.frameSize || 128);
    LOADER_SPRITE.columns = Number(data.columns || LOADER_SPRITE.columns || 8);
    LOADER_SPRITE.rows = Number(data.rows || LOADER_SPRITE.rows || 4);
    LOADER_SPRITE.total = Number(data.totalFrames || LOADER_SPRITE.total || (LOADER_SPRITE.columns * LOADER_SPRITE.rows));
    LOADER_SPRITE.failed = false;

    LOADER_ASSETS = data.assets.slice();
    LOADER_STAGE_POOLS = data.stagePools || LOADER_STAGE_POOLS;
    LOADER_STAGE_SUBPOOLS = data.stageSubpools || LOADER_STAGE_SUBPOOLS;
    LOADER_THEMES = data.themes || LOADER_THEMES;
    indexLoaderAssets();

    LOADER_ART_SPEC.file = LOADER_SPRITE.url;
    LOADER_ART_SPEC.fallback = LOADER_SPRITE.fallbackUrl;
    LOADER_ART_SPEC.manifestLoaded = true;

    LOADER_RUN = null;
    try {
      window.__LOADER_ASSET_MANIFEST__ = data;
      window.__LOADER_ART_SPEC__ = LOADER_ART_SPEC;
    } catch(_) {}
  }
  function loadLoaderManifest(){
    if (LOADER_MANIFEST_STATE.loaded || LOADER_MANIFEST_STATE.loading) return LOADER_MANIFEST_STATE.promise;
    LOADER_MANIFEST_STATE.loading = true;
    LOADER_MANIFEST_STATE.promise = fetchTextHard(LOADER_MANIFEST_URL, 5000, 'manifest').then(function(txt){
      var data = JSON.parse(txt);
      applyLoaderManifest(data);
      LOADER_MANIFEST_STATE.loaded = true;
      LOADER_MANIFEST_STATE.loading = false;
      LOADER_MANIFEST_STATE.data = data;
      try { window.__LOADER_MANIFEST_STATE__ = LOADER_MANIFEST_STATE; } catch(_) {}
      window.__LOADER_SPRITE_PRELOADED__ = null;
      preloadLoaderSprite(true);
      try { renderLoaderFrame(); } catch(_) {}
      return data;
    }).catch(function(err){
      LOADER_MANIFEST_STATE.error = err && err.message ? err.message : String(err || 'loader manifest error');
      LOADER_MANIFEST_STATE.loading = false;
      LOADER_MANIFEST_STATE.loaded = false;
      try { window.__LOADER_MANIFEST_STATE__ = LOADER_MANIFEST_STATE; } catch(_) {}
      // Manifest failure must never block product data or runtime modules.
      return null;
    });
    return LOADER_MANIFEST_STATE.promise;
  }

  var LOADER_STAGE_SCENES = {
    boot: {
      stageIndex: 1, stageCount: 4, label: 'Подготовка запуска',
      texts: [
        'Подготавливаем стартовую сцену загрузчика…',
        'Проверяем конфигурацию и стартовые модули…',
        'Инициализируем среду запуска калькулятора…',
        'Готовим первый экран к загрузке данных…'
      ]
    },
    products: {
      stageIndex: 2, stageCount: 4, label: 'База продуктов',
      texts: [
        'Открываем справочник продуктов…',
        'Загружаем продуктовые категории…',
        'Собираем состав базы продуктов…',
        'Подключаем карточки ингредиентов…',
        'Подготавливаем поиск по продуктам…'
      ]
    },
    runtime: {
      stageIndex: 3, stageCount: 4, label: 'Инструменты и расчёты',
      texts: [
        'Инициализируем калькулятор потребностей…',
        'Подключаем вычислительные модули…',
        'Активируем индикаторы HEI…',
        'Собираем визуализацию категорий качества рациона…',
        'Подготавливаем Гарвардскую тарелку…',
        'Связываем продукты, HEI и интерактивные инструменты…'
      ]
    },
    finalize: {
      stageIndex: 4, stageCount: 4, label: 'Финализация',
      texts: [
        'Проверяем итоговые связи интерфейса…',
        'Финализируем стартовые сценарии калькулятора…',
        'Готовим интерфейс к работе…'
      ]
    },
    done: {
      stageIndex: 4, stageCount: 4, label: 'Готово',
      texts: [
        'Первый экран готов к работе.',
        'Открываем калькулятор; база продуктов продолжает загружаться в фоне.',
        'Профиль уже доступен. Остальные разделы активируются автоматически.'
      ]
    },
    error: {
      stageIndex: 4, stageCount: 4, label: 'Ошибка',
      texts: [
        'Во время запуска возникла проблема.',
        'Проверьте файлы хостинга и повторите загрузку.',
        'После исправления можно снова открыть калькулятор.'
      ]
    }
  };
  var LOADER_RUNTIME = { ticker:0, stage:'boot', kind:'loading', actualText:'Загружаем калькулятор Сергея Веснина…', cycleTick:0, lastFrameIndex:-1 };
  var LOADER_PROGRESS = { boot:2, productsDone:0, productsTotal:0, scriptsDone:0, scriptsTotal:0 };

  function preloadLoaderSprite(force){
    try {
      loadLoaderManifest();
      if (!force && window.__LOADER_SPRITE_PRELOADED__ && window.__LOADER_SPRITE_PRELOADED__.src && window.__LOADER_SPRITE_PRELOADED__.src.indexOf((LOADER_SPRITE.url || '').replace('./','')) >= 0) return;
      var img = new Image();
      img.onload = function(){
        LOADER_SPRITE.failed = false;
        try { renderLoaderFrame(); } catch(_) {}
      };
      img.onerror = function(){
        if (LOADER_SPRITE.fallbackUrl && LOADER_SPRITE.url !== LOADER_SPRITE.fallbackUrl) {
          LOADER_SPRITE.url = LOADER_SPRITE.fallbackUrl;
          window.__LOADER_SPRITE_PRELOADED__ = null;
          preloadLoaderSprite(true);
          return;
        }
        LOADER_SPRITE.failed = true;
        try { renderLoaderFrame(); } catch(_) {}
      };
      img.src = LOADER_SPRITE.url;
      window.__LOADER_SPRITE_PRELOADED__ = img;
    } catch(_) {}
  }
  function inferStage(text, kind){
    if (kind === 'done') return 'done';
    if (kind === 'error') return 'error';
    var t = String(text || '').toLowerCase();
    if (t.indexOf('загружаем базу продуктов') >= 0) return 'products';
    if (t.indexOf('инициализируем калькулятор') >= 0) return 'runtime';
    if (t.indexOf('загружаем интерфейс') >= 0) return 'runtime';
    if (t.indexOf('финализируем') >= 0) return 'finalize';
    return 'boot';
  }
  function computeRealProgress(){
    var pFrac = LOADER_PROGRESS.productsTotal ? (LOADER_PROGRESS.productsDone / LOADER_PROGRESS.productsTotal) : 0;
    var sFrac = LOADER_PROGRESS.scriptsTotal ? (LOADER_PROGRESS.scriptsDone / LOADER_PROGRESS.scriptsTotal) : 0;
    var value = LOADER_PROGRESS.boot + (pFrac * 50) + (sFrac * 46);
    if (LOADER_RUNTIME.kind === 'done') value = 100;
    if (LOADER_RUNTIME.kind === 'error') value = Math.max(value, 100);
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  function stageProgress(stage){
    if (stage === 'products') return LOADER_PROGRESS.productsTotal ? (LOADER_PROGRESS.productsDone / LOADER_PROGRESS.productsTotal) : 0;
    if (stage === 'runtime') return LOADER_PROGRESS.scriptsTotal ? (LOADER_PROGRESS.scriptsDone / LOADER_PROGRESS.scriptsTotal) : 0;
    if (stage === 'finalize') return 0.9;
    if (stage === 'done') return 1;
    if (stage === 'error') return 1;
    return Math.min(1, computeRealProgress() / 12);
  }
  function makeLoaderSeed(){
    var base = Date.now() + ':' + Math.floor(Math.random() * 1000000) + ':' + (window.performance && performance.now ? Math.floor(performance.now() * 1000) : 0);
    var h = 2166136261;
    for (var i = 0; i < base.length; i++) {
      h ^= base.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededRandom(seed){
    var t = seed >>> 0;
    return function(){
      t += 0x6D2B79F5;
      var r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function prefersReducedMotion(){
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(_) { return false; }
  }
  function getAsset(id){
    return LOADER_ASSETS_BY_ID[id] || LOADER_ASSETS_BY_ID.boot_default || LOADER_ASSETS[0];
  }
  function readRecentLoaderAssets(){
    try {
      var raw = localStorage.getItem('nutri_v5328_loader_recent_assets');
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.slice(0, 18) : [];
    } catch(_) { return []; }
  }
  function saveRecentLoaderAssets(run){
    try {
      var current = [];
      ['bootSequence','productsSequence','runtimeSequence','finalizeSequence','doneSequence'].forEach(function(key){
        var seq = run && run[key];
        if (Array.isArray(seq)) {
          for (var i = 0; i < seq.length; i++) if (current.indexOf(seq[i]) < 0) current.push(seq[i]);
        }
      });
      if (run && run.error && current.indexOf(run.error) < 0) current.push(run.error);
      var previous = readRecentLoaderAssets();
      var merged = current.concat(previous.filter(function(id){ return current.indexOf(id) < 0; }));
      localStorage.setItem('nutri_v5328_loader_recent_assets', JSON.stringify(merged.slice(0, 18)));
    } catch(_) {}
  }
  function weightedPick(ids, rand, used, recent, opts){
    opts = opts || {};
    var pool = (ids || []).filter(function(id){ return !!getAsset(id); });
    var candidates = pool.filter(function(id){ return !used[id]; });
    if (!candidates.length) candidates = pool.slice();
    if (!opts.allowRecent && candidates.length > 1) {
      var fresh = candidates.filter(function(id){ return recent.indexOf(id) < 0; });
      if (fresh.length) candidates = fresh;
    }
    var total = 0;
    for (var i = 0; i < candidates.length; i++) {
      var asset = getAsset(candidates[i]);
      var weight = Math.max(0.01, Number(asset.weight || 1));
      if (recent.indexOf(candidates[i]) >= 0) weight *= 0.25;
      total += weight;
    }
    var roll = rand() * total;
    for (var j = 0; j < candidates.length; j++) {
      var a = getAsset(candidates[j]);
      var w = Math.max(0.01, Number(a.weight || 1));
      if (recent.indexOf(candidates[j]) >= 0) w *= 0.25;
      roll -= w;
      if (roll <= 0) {
        used[candidates[j]] = true;
        return candidates[j];
      }
    }
    var fallback = candidates[0] || 'boot_default';
    used[fallback] = true;
    return fallback;
  }
  function weightedTheme(rand){
    var keys = Object.keys(LOADER_THEMES || {});
    if (!keys.length) return null;
    var total = 0;
    for (var i = 0; i < keys.length; i++) total += Math.max(0.01, Number((LOADER_THEMES[keys[i]] || {}).weight || 1));
    var roll = rand() * total;
    for (var j = 0; j < keys.length; j++) {
      var theme = LOADER_THEMES[keys[j]] || {};
      roll -= Math.max(0.01, Number(theme.weight || 1));
      if (roll <= 0) return keys[j];
    }
    return keys[0];
  }
  function themePool(themeId, stage, fallbackPool){
    var theme = themeId && LOADER_THEMES ? LOADER_THEMES[themeId] : null;
    var pools = theme && theme.stagePools ? theme.stagePools : null;
    return (pools && pools[stage] && pools[stage].length) ? pools[stage] : fallbackPool;
  }
  function pickStageSequence(stage, rand, used, recent, count, primaryPool, secondaryPool){
    var seq = [];
    var first = weightedPick(primaryPool || LOADER_STAGE_POOLS[stage] || LOADER_STAGE_POOLS.boot, rand, used, recent);
    seq.push(first);
    if (count > 1) {
      var second = weightedPick(secondaryPool || LOADER_STAGE_POOLS[stage] || LOADER_STAGE_POOLS.boot, rand, used, recent);
      if (second && seq.indexOf(second) < 0) seq.push(second);
    }
    return seq;
  }
  function buildLoaderRun(){
    if (LOADER_RUN) return LOADER_RUN;
    loadLoaderManifest();

    var seed = makeLoaderSeed();
    var rand = seededRandom(seed);
    var used = {};
    var recent = readRecentLoaderAssets();
    var reduced = prefersReducedMotion();
    var themeId = weightedTheme(rand);

    var productPrimary = themePool(themeId, 'products', LOADER_STAGE_SUBPOOLS.productsPrimary);
    var productSecondary = themePool(themeId, 'products', LOADER_STAGE_SUBPOOLS.productsSecondary);
    var runtimeEarly = themePool(themeId, 'runtime', LOADER_STAGE_SUBPOOLS.runtimeEarly);
    var runtimeLate = LOADER_STAGE_SUBPOOLS.runtimeLate || themePool(themeId, 'runtime', LOADER_STAGE_POOLS.runtime);

    var productsSeq = pickStageSequence('products', rand, used, recent, reduced ? 1 : 2, productPrimary, productSecondary);
    var runtimeSeq = pickStageSequence('runtime', rand, used, recent, reduced ? 1 : 2, runtimeEarly, runtimeLate);

    LOADER_RUN = {
      seed: seed,
      theme: themeId || 'fallbackSafe',
      reducedMotion: reduced,
      manifestLoaded: !!LOADER_MANIFEST_STATE.loaded,
      bootSequence: pickStageSequence('boot', rand, used, recent, 1),
      productsSequence: productsSeq,
      runtimeSequence: runtimeSeq,
      finalizeSequence: pickStageSequence('finalize', rand, used, recent, 1, themePool(themeId, 'finalize', LOADER_STAGE_SUBPOOLS.finalizePrimary)),
      doneSequence: pickStageSequence('done', rand, used, recent, 1, themePool(themeId, 'done', LOADER_STAGE_SUBPOOLS.donePrimary)),
      errorSequence: ['error_default'],
      boot: null,
      products: null,
      runtime: null,
      finalize: null,
      done: null,
      error: 'error_default'
    };
    LOADER_RUN.boot = LOADER_RUN.bootSequence[0];
    LOADER_RUN.products = LOADER_RUN.productsSequence[0];
    LOADER_RUN.runtime = LOADER_RUN.runtimeSequence[0];
    LOADER_RUN.finalize = LOADER_RUN.finalizeSequence[0];
    LOADER_RUN.done = LOADER_RUN.doneSequence[0];
    try {
      window.__LOADER_RUN__ = LOADER_RUN;
      sessionStorage.setItem('nutri_v5328_loader_run', JSON.stringify(LOADER_RUN));
    } catch(_) {}
    saveRecentLoaderAssets(LOADER_RUN);
    return LOADER_RUN;
  }
  function sequenceForStage(stage){
    var run = buildLoaderRun();
    if (stage === 'products') return run.productsSequence || [run.products || 'product_database'];
    if (stage === 'runtime') return run.runtimeSequence || [run.runtime || 'hei_analysis'];
    if (stage === 'finalize') return run.finalizeSequence || [run.finalize || 'data_check'];
    if (stage === 'done') return run.doneSequence || [run.done || 'done_default'];
    if (stage === 'error') return run.errorSequence || ['error_default'];
    return run.bootSequence || [run.boot || 'boot_default'];
  }
  function assetForStage(stage, prog){
    var seq = sequenceForStage(stage);
    if (!seq.length) seq = ['boot_default'];
    if (prefersReducedMotion() || seq.length === 1 || stage === 'error' || stage === 'done' || stage === 'finalize') return getAsset(seq[0]);

    var index = 0;
    if (stage === 'products') {
      if (prog >= 0.58 || LOADER_RUNTIME.cycleTick >= 8) index = 1;
    } else if (stage === 'runtime') {
      if (prog >= 0.52 || LOADER_RUNTIME.cycleTick >= 7) index = 1;
    }
    index = Math.max(0, Math.min(seq.length - 1, index));
    return getAsset(seq[index]);
  }
  function frameForStage(stage, prog){
    var asset = assetForStage(stage, prog);
    var frame = asset && typeof asset.frame === 'number' ? asset.frame : 0;
    return Math.max(0, Math.min(LOADER_SPRITE.total - 1, frame));
  }
  function currentScene(){
    var stage = LOADER_RUNTIME.stage || 'boot';
    var scene = LOADER_STAGE_SCENES[stage] || LOADER_STAGE_SCENES.boot;
    var prog = stageProgress(stage);
    var maxIndex = Math.max(0, scene.texts.length - 1);
    var baseIndex = Math.min(maxIndex, Math.floor(prog * (maxIndex + 0.999)));
    var swing = (stage === 'done' || stage === 'error') ? 0 : ((LOADER_RUNTIME.cycleTick % 6 >= 3 && baseIndex < maxIndex) ? 1 : 0);
    var textIdx = Math.min(maxIndex, baseIndex + swing);
    var frameIndex = frameForStage(stage, prog);
    return { stageKey: stage, scene: scene, text: scene.texts[textIdx] || scene.texts[0], frameIndex: frameIndex };
  }
  function ensureStatusUi(){
    preloadLoaderSprite();
    var style = document.getElementById('runtimeBootStatusStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'runtimeBootStatusStyle';
      style.textContent = [
        "#runtimeBootStatusOverlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(248,250,252,.86);backdrop-filter:blur(3px);z-index:9999;transition:opacity .34s ease,visibility .34s ease}",
        "#runtimeBootStatusOverlay.hide{opacity:0;visibility:hidden;pointer-events:none}",
        "#runtimeBootStatus{width:min(780px,calc(100vw - 28px));border:3px solid #111;background:#fff;color:#111;border-radius:20px;box-shadow:0 18px 48px rgba(15,23,42,.18);padding:16px 16px 14px;font:600 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}",
        "#runtimeBootStatus[data-kind='error']{border-color:#7f1d1d;background:#fff1f2;color:#7f1d1d}",
        "#runtimeBootStatus .rbs-shell{display:grid;grid-template-columns:228px minmax(0,1fr);gap:18px;align-items:center}",
        "#runtimeBootStatus .rbs-figure{width:228px;height:228px;border:2px solid #111;border-radius:14px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 0 0 2px #fff}",
        "#runtimeBootStatus[data-kind='error'] .rbs-figure{border-color:#7f1d1d;background:#fff}",
        "#runtimeBootStatus .rbs-sprite{width:204px;height:204px;image-rendering:pixelated;image-rendering:crisp-edges;background-repeat:no-repeat;background-size:800% 400%;background-position:0 0;display:block}",
        "#runtimeBootStatus .rbs-sprite.is-sprite-fallback{background-image:linear-gradient(90deg,#111 10px,transparent 10px),linear-gradient(#111 10px,transparent 10px);background-size:32px 32px!important;background-color:#fff;border:2px solid #111;box-sizing:border-box}",
        "#runtimeBootStatus .rbs-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:4px}",
        "#runtimeBootStatus .rbs-title{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#0f172a;margin:0}",
        "#runtimeBootStatus .rbs-step{font-size:11px;font-weight:900;color:#475569;white-space:nowrap}",
        "#runtimeBootStatus[data-kind='error'] .rbs-title,#runtimeBootStatus[data-kind='error'] .rbs-step{color:#7f1d1d}",
        "#runtimeBootStatus .rbs-stage{display:inline-block;margin:0 0 6px;padding:2px 8px;border:1px solid #111;border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.02em;background:#f8fafc;color:#111}",
        "#runtimeBootStatus[data-kind='error'] .rbs-stage{border-color:#7f1d1d;color:#7f1d1d;background:#fff}",
        "#runtimeBootStatus .rbs-primary{font-size:17px;font-weight:900;line-height:1.25;color:#111;margin:0 0 6px}",
        "#runtimeBootStatus .rbs-secondary{font-size:13px;line-height:1.35;color:#475569;min-height:3.1em;margin:0 0 8px}",
        "#runtimeBootStatus[data-kind='error'] .rbs-primary,#runtimeBootStatus[data-kind='error'] .rbs-secondary{color:#7f1d1d}",
        "#runtimeBootStatus .rbs-bar{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:4px;margin:0 0 8px}",
        "#runtimeBootStatus .rbs-cell{height:15px;border:1px solid #111;background:#fff;border-radius:2px;box-sizing:border-box}",
        "#runtimeBootStatus .rbs-cell.on{background:#111}",
        "#runtimeBootStatus[data-kind='error'] .rbs-cell{border-color:#7f1d1d}",
        "#runtimeBootStatus[data-kind='error'] .rbs-cell.on{background:#7f1d1d}",
        "#runtimeBootStatus .rbs-foot{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:11.5px;color:#64748b}",
        "#runtimeBootStatus .rbs-percent{font-variant-numeric:tabular-nums;font-weight:900;color:#111}",
        "#runtimeBootStatus[data-kind='error'] .rbs-foot,#runtimeBootStatus[data-kind='error'] .rbs-percent{color:#7f1d1d}",
        "@media (max-width:760px){#runtimeBootStatus{width:min(580px,calc(100vw - 22px));padding:12px 12px 11px;border-radius:16px}#runtimeBootStatus .rbs-shell{grid-template-columns:156px minmax(0,1fr);gap:12px}#runtimeBootStatus .rbs-figure{width:156px;height:156px}#runtimeBootStatus .rbs-sprite{width:144px;height:144px}#runtimeBootStatus .rbs-primary{font-size:14px}#runtimeBootStatus .rbs-secondary{font-size:12px;min-height:3.4em}#runtimeBootStatus .rbs-bar{gap:3px}#runtimeBootStatus .rbs-cell{height:12px}}",
        "@media (max-width:420px){#runtimeBootStatus{width:min(360px,calc(100vw - 18px))}#runtimeBootStatus .rbs-shell{grid-template-columns:1fr}#runtimeBootStatus .rbs-figure{margin:0 auto}}",
        "@media (prefers-reduced-motion:reduce){#runtimeBootStatusOverlay{transition:none}}"
      ].join('');
      document.head.appendChild(style);
    }
    var overlay = document.getElementById('runtimeBootStatusOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'runtimeBootStatusOverlay';
      overlay.innerHTML =
        '<section id="runtimeBootStatus" role="status" aria-live="polite" data-kind="loading">' +
          '<div class="rbs-shell">' +
            '<div class="rbs-figure"><div class="rbs-sprite" aria-hidden="true"></div></div>' +
            '<div class="rbs-main">' +
              '<div class="rbs-top"><p class="rbs-title">Калькулятор нутриентов Сергея Веснина</p><span class="rbs-step">Стадия 1/4</span></div>' +
              '<p class="rbs-stage">Подготовка запуска</p>' +
              '<p class="rbs-primary">Загружаем калькулятор Сергея Веснина…</p>' +
              '<p class="rbs-secondary">Подготавливаем стартовую сцену загрузчика…</p>' +
              '<div class="rbs-bar" aria-hidden="true">' + new Array(17).join('<i class="rbs-cell"></i>') + '</div>' +
              '<div class="rbs-foot"><span class="rbs-hint">Сборка от '+(window.__APP_BUILD_DATE_RU__||'дата не указана')+'</span><span class="rbs-percent">0%</span></div>' +
            '</div>' +
          '</div>' +
        '</section>';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hide');
    return document.getElementById('runtimeBootStatus');
  }
  function ensureBackgroundStatusUi(){
    if (typeof document === 'undefined' || !document.body) return null;
    var el = document.getElementById('runtimeBackgroundStatus');
    if (!el) {
      el = document.createElement('div');
      el.id = 'runtimeBackgroundStatus';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      el.style.cssText = 'display:block;position:relative;z-index:2;margin:10px 0 0;padding:9px 12px;border:1px solid rgba(90,90,90,.28);border-radius:10px;background:var(--surface,#fff);color:var(--text,#171717);box-shadow:0 5px 16px rgba(0,0,0,.08);font:600 12px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;transition:opacity .2s ease,transform .2s ease;';
      var host=document.querySelector('#navigationShellContext .navigation-shell-context__copy') || document.getElementById('navigationShellContext') || document.querySelector('main') || document.body;
      host.appendChild(el);
    }
    return el;
  }
  function updateBackgroundStatus(text, kind){
    ready(function(){
      var el = ensureBackgroundStatusUi();
      if (!el) return;
      el.textContent = text || 'Подготавливаем расчёты и базу продуктов…';
      el.setAttribute('data-kind', kind || 'loading');
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      if (kind === 'done') {
        setTimeout(function(){
          el.style.opacity = '0'; el.style.transform = 'translateY(-6px)';
          setTimeout(function(){ try { el.remove(); } catch(_) {} }, 260);
        }, 850);
      }
    });
  }
  function routeFromFastStartTarget(target){
    if (!target || !target.closest) return '';
    var node = target.closest('[data-navshell-route],[data-navshell-analysis-view],a[href^="#"]');
    if (!node) return '';
    var route = node.getAttribute('data-navshell-route') || node.getAttribute('data-navshell-analysis-view') || '';
    if (!route) {
      var href = node.getAttribute('href') || '';
      var id = href.charAt(0) === '#' ? href.slice(1) : '';
      var map = {needsCompact:'profile',needs:'profile',profile:'profile',globalSearchSection:'ration',rationSection:'ration',ration:'ration',heiPanel:'analysis/hei',totalsSection:'analysis/nutrients',dietAnalysisProfilePanel:'analysis/overview',correction:'correction',report:'report',globalActions:'report'};
      route = map[id] || id;
    }
    return String(route || '');
  }
  function fastStartRouteBlocked(route){
    route = String(route || '').replace(/^#/,'');
    return !!route && route !== 'profile' && route !== 'needs' && route !== 'needsCompact';
  }
  function installFastStartGuard(){
    if (window.__HF22_FAST_START_GUARD__) return;
    window.__HF22_FAST_START_GUARD__ = true;
    document.addEventListener('click', function(ev){
      if (window.__APP_BACKGROUND_READY__) return;
      var route = routeFromFastStartTarget(ev.target);
      if (!fastStartRouteBlocked(route)) return;
      ev.preventDefault(); ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      updateBackgroundStatus('База продуктов и расчётные разделы ещё подготавливаются. Профиль уже доступен.', 'loading');
      try {
      if (window.NavigationShellV1 && typeof window.NavigationShellV1.navigate === 'function') {
        var shellState=typeof window.NavigationShellV1.getState==='function'?window.NavigationShellV1.getState():null;
        if (!shellState || shellState.route!=='profile') window.NavigationShellV1.navigate('profile');
      }
    } catch(_) {}
    }, true);
    window.addEventListener('hashchange', function(){
      if (window.__APP_BACKGROUND_READY__) return;
      var route = String(location.hash || '').replace(/^#/,'');
      if (!fastStartRouteBlocked(route)) return;
      try { history.replaceState(history.state,'',location.pathname+location.search+'#profile'); } catch(_) {}
      try { if (window.NavigationShellV1 && typeof window.NavigationShellV1.navigate === 'function') window.NavigationShellV1.navigate('profile'); } catch(_) {}
    }, false);
  }
  function closeBlockingLoader(){
    if (window.__RUNTIME_LOADER_CLOSED__ || window.__RUNTIME_LOADER_CLOSING__) return;
    window.__RUNTIME_LOADER_CLOSING__ = true;
    stopLoaderTicker();
    var overlay = document.getElementById('runtimeBootStatusOverlay');
    var elapsed = Math.max(0, now() - startedAt);
    var remaining = Math.max(0, MIN_BLOCKING_LOADER_MS - elapsed);
    var fadeMs = prefersReducedMotion() ? 0 : LOADER_FADE_MS;
    if (window.__APP_SHELL_READY_STATE__) {
      window.__APP_SHELL_READY_STATE__.loader_minimum_ms = MIN_BLOCKING_LOADER_MS;
      window.__APP_SHELL_READY_STATE__.loader_close_scheduled_ms = Math.round(elapsed + remaining);
    }
    setTimeout(function(){
      if (overlay) overlay.classList.add('hide');
      window.__RUNTIME_LOADER_CLOSED__ = true;
      window.__RUNTIME_LOADER_CLOSING__ = false;
      var visibleMs = Math.round(now() - startedAt);
      if (window.__APP_SHELL_READY_STATE__) window.__APP_SHELL_READY_STATE__.loader_visible_ms = visibleMs;
      try { window.dispatchEvent(new CustomEvent('runtime:loader-closed', { detail:{ version: VERSION, phase:'shell-ready', visible_ms:visibleMs, minimum_ms:MIN_BLOCKING_LOADER_MS } })); } catch(_) {}
      setTimeout(function(){ try { if (overlay) overlay.remove(); } catch(_) {} }, fadeMs + 40);
    }, remaining);
  }
  function markShellReady(){
    shellReadyAt = now();
    window.__APP_SHELL_READY_STATE__ = { version:VERSION, release:EXPECTED_RUNTIME_RELEASE, status:'ready', timing_ms:Math.round(shellReadyAt-startedAt) };
    document.documentElement.setAttribute('data-runtime-phase','shell-ready');
    installFastStartGuard();
    try { if (window.NavigationShellV1 && typeof window.NavigationShellV1.navigate === 'function') window.NavigationShellV1.navigate('profile'); } catch(_) {}
    updateBackgroundStatus('Первый экран готов. Подготавливаем базу продуктов и остальные разделы…','loading');
    stopLoaderTicker();
    LOADER_RUNTIME.kind = 'done';
    LOADER_RUNTIME.stage = 'done';
    LOADER_RUNTIME.actualText = 'Первый экран готов';
    LOADER_PROGRESS.boot = 10;
    renderLoaderFrame();
    closeBlockingLoader();
    try { window.dispatchEvent(new CustomEvent('app:shell-ready', { detail:window.__APP_SHELL_READY_STATE__ })); } catch(_) {}
    return window.__APP_SHELL_READY_STATE__;
  }
  function preloadDeferredRuntime(){
    if (!DEFERRED_RUNTIME_BUNDLE || document.querySelector('link[data-hf25-runtime-prefetch]')) return;
    try {
      var link=document.createElement('link'); link.rel='prefetch'; link.as='script'; link.href=DEFERRED_RUNTIME_BUNDLE; try{link.fetchPriority='low';}catch(_){} link.setAttribute('data-hf25-runtime-prefetch','1');
      (document.head||document.documentElement).appendChild(link);
    } catch(_) {}
  }
  function stopLoaderTicker(){ if (LOADER_RUNTIME.ticker) { clearInterval(LOADER_RUNTIME.ticker); LOADER_RUNTIME.ticker = 0; } }
  function applySpriteFrame(el, frameIndex){
    var x = frameIndex % LOADER_SPRITE.columns;
    var y = Math.floor(frameIndex / LOADER_SPRITE.columns);
    var xPct = LOADER_SPRITE.columns > 1 ? (x * 100 / (LOADER_SPRITE.columns - 1)) : 0;
    var yPct = LOADER_SPRITE.rows > 1 ? (y * 100 / (LOADER_SPRITE.rows - 1)) : 0;
    if (LOADER_SPRITE.failed) {
      el.classList.add('is-sprite-fallback');
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      return;
    }
    el.classList.remove('is-sprite-fallback');
    el.style.backgroundImage = 'url("' + LOADER_SPRITE.url + '")';
    el.style.backgroundSize = (LOADER_SPRITE.columns * 100) + '% ' + (LOADER_SPRITE.rows * 100) + '%';
    el.style.backgroundPosition = xPct + '% ' + yPct + '%';
  }
  function renderLoaderFrame(){
    if (typeof document === 'undefined' || !document.body) return;
    if (window.__RUNTIME_LOADER_CLOSED__ || window.__RUNTIME_LOADER_CLOSING__) return;
    var el = ensureStatusUi();
    var overlay = document.getElementById('runtimeBootStatusOverlay');
    var sceneState = currentScene();
    var sprite = el.querySelector('.rbs-sprite');
    var step = el.querySelector('.rbs-step');
    var stageEl = el.querySelector('.rbs-stage');
    var primary = el.querySelector('.rbs-primary');
    var secondary = el.querySelector('.rbs-secondary');
    var percent = el.querySelector('.rbs-percent');
    var hint = el.querySelector('.rbs-hint');
    var cells = el.querySelectorAll('.rbs-cell');
    var overall = computeRealProgress();
    el.setAttribute('data-kind', LOADER_RUNTIME.kind || 'loading');
    if (sprite) {
      if (sceneState.frameIndex !== LOADER_RUNTIME.lastFrameIndex) {
        applySpriteFrame(sprite, sceneState.frameIndex);
        LOADER_RUNTIME.lastFrameIndex = sceneState.frameIndex;
      }
    }
    if (step) step.textContent = 'Стадия ' + sceneState.scene.stageIndex + '/' + sceneState.scene.stageCount;
    if (stageEl) stageEl.textContent = sceneState.scene.label;
    if (primary) primary.textContent = LOADER_RUNTIME.actualText || 'Загружаем калькулятор Сергея Веснина…';
    if (secondary) secondary.textContent = sceneState.text;
    if (percent) percent.textContent = overall + '%';
    if (hint) hint.textContent = (LOADER_RUNTIME.kind === 'error')
      ? 'Проверьте файлы хостинга и повторите загрузку.'
      : (LOADER_RUNTIME.kind === 'done' ? 'Калькулятор готов к работе.' : 'Сцены и подписи связаны с текущей стадией и фактической загрузкой.');
    var onCount = Math.max(0, Math.min(cells.length, Math.round((overall / 100) * cells.length)));
    for (var i = 0; i < cells.length; i++) cells[i].classList.toggle('on', i < onCount);
    if (overlay) overlay.classList.remove('hide');
  }
  function startLoaderTicker(){
    if (LOADER_RUNTIME.ticker) return;
    renderLoaderFrame();
    LOADER_RUNTIME.ticker = setInterval(function(){
      if (LOADER_RUNTIME.kind !== 'loading') return;
      LOADER_RUNTIME.cycleTick += 1;
      renderLoaderFrame();
    }, prefersReducedMotion() ? 900 : 420);
  }
  function setProductProgress(done, total){
    LOADER_PROGRESS.productsDone = Math.max(0, done || 0);
    LOADER_PROGRESS.productsTotal = Math.max(0, total || 0);
    if (LOADER_PROGRESS.productsDone > 0) LOADER_PROGRESS.boot = 4;
    LOADER_RUNTIME.stage = 'products';
    renderLoaderFrame();
  }
  function setScriptProgress(done, total){
    LOADER_PROGRESS.scriptsDone = Math.max(0, done || 0);
    LOADER_PROGRESS.scriptsTotal = Math.max(0, total || 0);
    if (LOADER_PROGRESS.productsDone >= LOADER_PROGRESS.productsTotal && LOADER_PROGRESS.productsTotal > 0) LOADER_PROGRESS.boot = 6;
    LOADER_RUNTIME.stage = 'runtime';
    renderLoaderFrame();
  }
  function setStatus(text, kind, progress){
    ready(function(){
      if (window.__RUNTIME_LOADER_CLOSED__ || window.__RUNTIME_LOADER_CLOSING__) { updateBackgroundStatus(text, kind); return; }
      ensureStatusUi();
      var overlay = document.getElementById('runtimeBootStatusOverlay');
      LOADER_RUNTIME.kind = kind || 'loading';
      LOADER_RUNTIME.actualText = text || 'Загружаем калькулятор Сергея Веснина…';
      LOADER_RUNTIME.stage = inferStage(text, LOADER_RUNTIME.kind);
      if (LOADER_RUNTIME.kind === 'loading') {
        startLoaderTicker();
        renderLoaderFrame();
        return;
      }
      stopLoaderTicker();
      LOADER_RUNTIME.cycleTick += 1;
      if (LOADER_RUNTIME.kind === 'done') {
        LOADER_PROGRESS.boot = 10;
        LOADER_PROGRESS.productsDone = Math.max(LOADER_PROGRESS.productsDone, LOADER_PROGRESS.productsTotal || LOADER_PROGRESS.productsDone);
        LOADER_PROGRESS.scriptsDone = Math.max(LOADER_PROGRESS.scriptsDone, LOADER_PROGRESS.scriptsTotal || LOADER_PROGRESS.scriptsDone);
        LOADER_RUNTIME.stage = 'done';
      }
      if (LOADER_RUNTIME.kind === 'error') LOADER_RUNTIME.stage = 'error';
      renderLoaderFrame();
      if (LOADER_RUNTIME.kind === 'done' && overlay) {
        setTimeout(function(){ overlay.classList.add('hide'); }, 1800);
        setTimeout(function(){
          try { overlay.remove(); } catch(_) {}
          try {
            window.__RUNTIME_LOADER_CLOSED__ = true;
            window.dispatchEvent(new CustomEvent('runtime:loader-closed', { detail:{ version: VERSION } }));
            // v5.3.13: first-step popup is intentionally disabled. Keep runtime:loader-closed event only.
          } catch(_) {}
        }, 2300);
      }
    });
  }

    function showLoadError(message, detail){
    window.__PRODUCTS_LOAD_ERROR__ = { message: message, detail: detail || '', tried_urls: DATA_URLS.slice(), app_version: VERSION };
    window.__APP_BOOTSTRAP_META__ = { version: VERSION, status: 'fatal', release: EXPECTED_RUNTIME_RELEASE, message: message, detail: detail || '', failed_scripts: failedScripts.slice() };
    try { console.error('[v5.3.38 bootstrap]', message, detail || ''); } catch(_) {}
    setStatus('Не удалось завершить запуск. Проверьте файлы хостинга и обновите страницу.', 'error');
    try { window.dispatchEvent(new CustomEvent('app:boot-fatal', { detail:{ message:message, detail:detail || '', failed_scripts:failedScripts.slice(), version:VERSION } })); } catch(_) {}
  }
  function showLoadWarning(message, detail){
    window.__PRODUCTS_LOAD_WARNING__ = { message: message, detail: detail || '', tried_urls: DATA_URLS.slice(), app_version: VERSION };
    try { console.warn('[v5.3.38 bootstrap]', message, detail || ''); } catch(_) {}
    try {
      LOADER_RUNTIME.actualText = 'База продуктов недоступна; запускаем основные расчёты…';
      LOADER_RUNTIME.stage = 'runtime';
      renderLoaderFrame();
    } catch(_) {}
  }
  function normalizeProducts(products, source){
    if (!Array.isArray(products)) throw new Error(source + ' must contain product array');
    var seen = Object.create(null);
    for (var i = 0; i < products.length; i++) {
      var key = products[i] && products[i].key;
      if (!key) throw new Error('product without key at index ' + i + ' from ' + source);
      if (seen[key]) throw new Error('duplicate product key: ' + key);
      seen[key] = true;
    }
    return products;
  }
  function fetchText(url){
    return fetchTextHard(url, 120000, url);
  }
  function loadProductChunks(urls, label){
    dataStartedAt = dataStartedAt || now();
    urls = urls || PRODUCT_CHUNK_URLS;
    label = label || 'chunked products v5.3.127';
    var productDone = 0;
    setProductProgress(0, urls.length || 0);
    return Promise.all(urls.map(function(url){
      return fetchText(url).then(function(text){ productDone += 1; setProductProgress(productDone, urls.length || 0);
        var chunk = JSON.parse(text);
        if (!Array.isArray(chunk)) throw new Error('Product chunk is not an array: ' + url);
        return chunk;
      });
    })).then(function(chunks){
      var products = [];
      chunks.forEach(function(chunk){ Array.prototype.push.apply(products, chunk); });
      products = normalizeProducts(products, label);
      loadedDataUrl = 'chunked:' + urls.length + ' files:' + label;
      return { payload: { schema_version:'chunked-json-v1', app_version:'v5.3.194', products_count:products.length, chunk_urls:urls.slice() }, products: products };
    });
  }
  function loadCompressedProductJson(src){
    if (!src || typeof fetch !== 'function' || typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Compressed product loading is not supported'));
    dataStartedAt = dataStartedAt || now();
    setProductProgress(0,1);
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function(){ try{controller.abort();}catch(_){} }, 120000) : null;
    return fetch(src,{cache:'default',credentials:'same-origin',signal:controller?controller.signal:undefined}).then(function(resp){
      if(timer)clearTimeout(timer);if(!resp.ok)throw new Error('HTTP status '+resp.status+' while loading '+src);return resp.arrayBuffer();
    }).then(function(buffer){
      dataBytes += buffer.byteLength || 0;
      var bytes=new Uint8Array(buffer),isGzip=bytes.length>2&&bytes[0]===31&&bytes[1]===139;
      if(!isGzip)return new TextDecoder('utf-8').decode(bytes);
      var stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream).text();
    }).then(function(text){
      var products=normalizeProducts(JSON.parse(text),'compressed product JSON v5.3.210-p1.3');
      setProductProgress(1,1);loadedDataUrl='compressed-json:'+src;
      return {payload:{schema_version:'compressed-json-gzip-v1',app_version:'v5.3.210',products_count:products.length,bundle_url:src},products:products};
    }).catch(function(error){if(timer)clearTimeout(timer);throw error;});
  }
  function loadProductBundleScript(src){
    if (!src) return Promise.reject(new Error('Product bundle script is not configured'));
    dataStartedAt = dataStartedAt || now();
    setProductProgress(0, 1);
    return new Promise(function(resolve, reject){
      var done=false, script=document.createElement('script');
      var timer=setTimeout(function(){ if(done)return; done=true; reject(new Error('Timed out loading product bundle '+src)); }, 120000);
      try { window.__PRODUCTS_BUNDLE__ = null; } catch(_) {}
      script.src=src; script.async=false;
      script.onload=function(){
        if(done)return; done=true; clearTimeout(timer);
        var products=window.__PRODUCTS_BUNDLE__;
        if(!Array.isArray(products)){ reject(new Error('Product bundle did not register an array: '+src)); return; }
        try { products=normalizeProducts(products,'single product bundle v5.3.210-p1.3'); } catch(e){ reject(e); return; }
        setProductProgress(1,1);
        loadedDataUrl='bundle-script:'+src;
        resolve({payload:{schema_version:'single-script-bundle-v1',app_version:'v5.3.210',products_count:products.length,bundle_url:src},products:products});
      };
      script.onerror=function(){ if(done)return; done=true; clearTimeout(timer); reject(new Error('Failed to load product bundle '+src)); };
      document.head.appendChild(script);
    });
  }
  function loadProductScriptChunk(src, index){
    return new Promise(function(resolve, reject){
      var done = false;
      var s = document.createElement('script');
      var timer = setTimeout(function(){
        if (done) return;
        done = true;
        reject(new Error('Timed out loading product script chunk ' + src));
      }, 120000);
      s.src = src;
      s.async = false;
      s.onload = function(){
        if (done) return;
        done = true;
        clearTimeout(timer);
        var chunk = window.__PRODUCT_SCRIPT_CHUNKS__ && window.__PRODUCT_SCRIPT_CHUNKS__[index];
        if (!Array.isArray(chunk)) {
          reject(new Error('Product script chunk did not register array at index ' + index + ': ' + src));
          return;
        }
        resolve(chunk);
      };
      s.onerror = function(){
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(new Error('Failed to load product script chunk ' + src));
      };
      document.head.appendChild(s);
    });
  }
  function loadProductScriptChunks(urls, label){
    dataStartedAt = dataStartedAt || now();
    urls = urls || PRODUCT_SCRIPT_CHUNK_URLS;
    label = label || 'product script chunks v5.3.127';
    window.__PRODUCT_SCRIPT_CHUNKS__ = [];
    setProductProgress(0, urls.length || 0);
    var chunks = new Array(urls.length), nextIndex = 0, completed = 0;
    var concurrency = Math.max(1, Math.min(4, urls.length || 1));
    function worker(){
      function step(){
        var index = nextIndex++;
        if (index >= urls.length) return Promise.resolve();
        return loadProductScriptChunk(urls[index], index).then(function(chunk){
          chunks[index] = chunk;
          completed += 1;
          setProductProgress(completed, urls.length || 0);
          return step();
        });
      }
      return step();
    }
    var workers = [];
    for (var wi = 0; wi < concurrency; wi++) workers.push(worker());
    return Promise.all(workers).then(function(){
      var products = [];
      chunks.forEach(function(chunk){ Array.prototype.push.apply(products, chunk); });
      products = normalizeProducts(products, label);
      loadedDataUrl = 'script-chunks:' + urls.length + ' files:' + label;
      return { payload: { schema_version:'script-chunks-v1', app_version:'v5.3.194', products_count:products.length, chunk_urls:urls.slice() }, products: products };
    });
  }
  function loadEmbeddedProducts(errors){
    var dbEl = document.getElementById('db');
    if (!dbEl) throw new Error('script#db compatibility slot not found');
    var text = (dbEl.textContent || '').trim();
    if (!text || text === '[]') throw new Error('embedded script#db is empty; chunk loading failed: ' + (errors || []).join(' | '));
    dataBytes += text.length || 0;
    var parsed = JSON.parse(text);
    var products = Array.isArray(parsed) ? parsed : parsed.products;
    products = normalizeProducts(products, 'embedded script#db');
    loadedDataUrl = 'embedded:script#db';
    return { payload: Array.isArray(parsed) ? { app_version:'v5.3.194', products_count:products.length } : parsed, products: products };
  }
  function installProducts(result){
    var dbEl = document.getElementById('db');
    if (!dbEl) throw new Error('script#db compatibility slot not found');
    window.__PRODUCTS_ARRAY__ = result.products;
    window.__PRODUCTS_SOURCE_PAYLOAD__ = result.payload || {};
    dbEl.textContent = '[]';
    var payload = result.payload || {};
    window.__PRODUCTS_META__ = {
      schema_version: payload.schema_version || 'compat',
      app_version: payload.app_version || VERSION,
      products_count: result.products.length,
      data_url: loadedDataUrl || 'chunked-json',
      chunked_database: loadedDataUrl.indexOf('chunked:') === 0 || loadedDataUrl.indexOf('script-chunks:') === 0,
      bundle_database: loadedDataUrl.indexOf('bundle-script:') === 0 || loadedDataUrl.indexOf('compressed-json:') === 0,
      compressed_database: loadedDataUrl.indexOf('compressed-json:') === 0,
      script_chunk_database: loadedDataUrl.indexOf('script-chunks:') === 0,
      chunk_count: PRODUCT_CHUNK_URLS.length,
      script_chunk_count: PRODUCT_SCRIPT_CHUNK_URLS.length,
      tried_urls: DATA_URLS.slice(),
      loaded_at: new Date().toISOString(),
      async_loader: true,
      embedded_db_fallback: loadedDataUrl === 'embedded:script#db',
      payload_bytes: dataBytes
    };
    try { window.dispatchEvent(new CustomEvent('products:loaded', { detail: window.__PRODUCTS_META__ })); } catch(_) {}
    return result.products;
  }
  function productLoadFatal(errors, reason){
    window.__PRODUCTS_LOAD_FATAL__ = { reason: reason || 'unknown', errors:(errors || []).slice(), version: VERSION };
    throw new Error('Product database failed: ' + (reason || 'unknown') + ' | ' + (errors || []).join(' | '));
  }
  function loadProducts(){
    var errors = [];
    function remember(e){ if (e) errors.push(e && (e.message || String(e))); }

    // HF24: use a host-independent gzip payload first; retain the reviewed script and chunks as fallbacks.
    var job = loadCompressedProductJson(PRODUCT_COMPRESSED_JSON).catch(function(e){
      remember(e);
      return loadProductBundleScript(PRODUCT_BUNDLE_SCRIPT);
    }).catch(function(e){
      remember(e);
      if (PRODUCT_BUNDLE_SCRIPT) clearRecoveredFailure(PRODUCT_BUNDLE_SCRIPT);
      return loadProductScriptChunks(PRODUCT_SCRIPT_CHUNK_URLS, 'fallback script chunks v5.3.37');
    }).catch(function(e){
      remember(e);
      return loadProductChunks(PRODUCT_CHUNK_URLS, 'fallback JSON v5.3.37');
    }).catch(function(e){
      remember(e);
      var chain = Promise.reject(e);
      PRODUCT_CHUNK_FALLBACK_SETS.forEach(function(urls, idx){
        chain = chain.catch(function(prev){
          remember(prev);
          return loadProductChunks(urls, 'fallback JSON set ' + (idx + 1));
        });
      });
      return chain;
    }).catch(function(e){
      remember(e);
      try { return loadEmbeddedProducts(errors); }
      catch (embeddedErr) {
        remember(embeddedErr);
        return productLoadFatal(errors, 'all product sources failed');
      }
    });

    return job.then(function(result){
      var installed = installProducts(result);
      if (!installed || installed.length < 100) {
        return productLoadFatal(errors, 'installed product database is empty or too small: ' + (installed ? installed.length : 0));
      }
      return installed;
    });
  }
  function loadScript(src){
    return new Promise(function(resolve, reject){
      var done = false;
      var s = document.createElement('script');
      var timer = setTimeout(function(){
        if (done) return;
        done = true;
        failedScripts.push(src);
        if (LOADER_PROGRESS.scriptsTotal) setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
        reject(new Error('Timed out loading script ' + src));
      }, 60000);
      s.src = src; s.async = false;
      s.onload = function(){
        if (done) return;
        done = true;
        clearTimeout(timer);
        loadedScripts.push(src);
        if (LOADER_PROGRESS.scriptsTotal) setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
        resolve(src);
      };
      s.onerror = function(){
        if (done) return;
        done = true;
        clearTimeout(timer);
        failedScripts.push(src);
        if (LOADER_PROGRESS.scriptsTotal) setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
        reject(new Error('Failed to load script ' + src));
      };
      document.head.appendChild(s);
    });
  }
  function loadCompressedRuntime(src,fallbackSrc){
    if(!src||typeof fetch!=='function'||typeof DecompressionStream==='undefined')return loadScript(fallbackSrc);
    var controller=(typeof AbortController!=='undefined')?new AbortController():null;
    var timer=controller?setTimeout(function(){try{controller.abort();}catch(_){}},60000):null;
    return fetch(src,{cache:'default',credentials:'same-origin',signal:controller?controller.signal:undefined}).then(function(resp){
      if(timer)clearTimeout(timer);if(!resp.ok)throw new Error('HTTP status '+resp.status+' while loading '+src);return resp.arrayBuffer();
    }).then(function(buffer){
      var bytes=new Uint8Array(buffer),isGzip=bytes.length>2&&bytes[0]===31&&bytes[1]===139;
      if(!isGzip)return new TextDecoder('utf-8').decode(bytes);
      return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    }).then(function(text){
      window.__HF24_DEFERRED_INLINE_EXECUTED__=false;
      var script=document.createElement('script');script.setAttribute('data-hf24-compressed-runtime',src);
      script.text=text+'\n;window.__HF24_DEFERRED_INLINE_EXECUTED__=true;\n//# sourceURL='+src.replace(/\s/g,'')+'-decompressed.js';
      (document.head||document.documentElement).appendChild(script);
      if(!window.__HF24_DEFERRED_INLINE_EXECUTED__)throw new Error('Inline execution of compressed runtime was blocked');
      loadedScripts.push(src);if(LOADER_PROGRESS.scriptsTotal)setScriptProgress(LOADER_PROGRESS.scriptsDone+1,LOADER_PROGRESS.scriptsTotal);
      return src;
    }).catch(function(error){
      if(timer)clearTimeout(timer);try{console.warn('[HF24 fast start] compressed runtime unavailable; using script bundle',error&&(error.message||error));}catch(_){}
      return loadScript(fallbackSrc);
    });
  }
  function clearRecoveredFailure(src){
    for (var i=failedScripts.length-1;i>=0;i--) if (failedScripts[i]===src) failedScripts.splice(i,1);
    recoveredRequests.push(src);
  }
  function loadScriptsSequential(list){ return list.reduce(function(p, src){ return p.then(function(){ return loadScript(src); }); }, Promise.resolve()); }
  function loadScriptsOrderedParallelSafe(list){
    if (!list || !list.length) return Promise.resolve([]);
    var results = new Array(list.length), nextIndex = 0, completed = 0;
    var baseDone = LOADER_PROGRESS.scriptsDone || 0;
    var concurrency = Math.max(1, Math.min(6, list.length));
    function worker(){
      function step(){
        var index = nextIndex++;
        if (index >= list.length) return Promise.resolve();
        var src = list[index];
        return new Promise(function(resolve){
          var finished = false;
          var s = document.createElement('script');
          var timer = setTimeout(function(){
            if (finished) return;
            finished = true;
            failedScripts.push(src);
            resolve({src:src, ok:false, error:new Error('Timed out loading optional script ' + src)});
          }, 60000);
          s.src = src;
          s.async = false;
          s.onload = function(){
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            loadedScripts.push(src);
            resolve({src:src, ok:true});
          };
          s.onerror = function(){
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            failedScripts.push(src);
            resolve({src:src, ok:false, error:new Error('Failed to load optional script ' + src)});
          };
          document.head.appendChild(s);
        }).then(function(result){
          results[index] = src;
          completed += 1;
          setScriptProgress(baseDone + completed, LOADER_PROGRESS.scriptsTotal || (baseDone + list.length));
          if (!result.ok) {
            try { console.warn('[v5.3.210 hosting hotfix] optional script failed', src, result.error && (result.error.message || result.error)); } catch(_) {}
          }
          return step();
        });
      }
      return step();
    }
    var workers = [];
    for (var wi = 0; wi < concurrency; wi++) workers.push(worker());
    return Promise.all(workers).then(function(){ return results; });
  }
  function loadScriptsSequentialSafe(list){
    return loadScriptsOrderedParallelSafe(list);
  }
  function loadCriticalShell(){
    setStatus('Готовим первый экран и навигацию…','loading');
    setScriptProgress(0, Math.max(1, CRITICAL_SHELL_SCRIPTS.length));
    if (!CRITICAL_SHELL_SCRIPTS.length) return loadScriptsSequential(CRITICAL_SHELL_SOURCE_SCRIPTS);
    return loadScriptsSequential(CRITICAL_SHELL_SCRIPTS).catch(function(err){
      for (var i=0;i<CRITICAL_SHELL_SCRIPTS.length;i++) clearRecoveredFailure(CRITICAL_SHELL_SCRIPTS[i]);
      try { console.warn('[HF24 fast start] critical shell bundle unavailable; using source files', err && (err.message||err)); } catch(_) {}
      return loadScriptsSequential(CRITICAL_SHELL_SOURCE_SCRIPTS);
    });
  }
  function loadRuntime(){
    setStatus('Подключаем расчёты и рабочие разделы…', 'loading');
    scriptsStartedAt = now();
    var extras = [];
    if (SELFTEST || DEV) extras = extras.concat(SELFTEST_SCRIPTS);
    if (DEV && (qs.get('legacytests') === '1' || qs.get('dev') === 'legacy')) extras = extras.concat(LEGACY_TEST_SCRIPTS);
    if (PERF) extras.push(PERF_SCRIPT);
    setScriptProgress(CRITICAL_SHELL_SCRIPTS.length, CRITICAL_SHELL_SCRIPTS.length + 1 + extras.length);
    var mainRuntime;
    if (DEFERRED_RUNTIME_BUNDLE) {
      mainRuntime = (DEFERRED_RUNTIME_COMPRESSED ? loadCompressedRuntime(DEFERRED_RUNTIME_COMPRESSED,DEFERRED_RUNTIME_BUNDLE) : loadScript(DEFERRED_RUNTIME_BUNDLE)).catch(function(err){
        clearRecoveredFailure(DEFERRED_RUNTIME_BUNDLE);
        try { console.warn('[HF24 fast start] deferred bundle unavailable; using source files', err && (err.message||err)); } catch(_) {}
        var fallback = DEFERRED_RUNTIME_SOURCE_SCRIPTS.length ? DEFERRED_RUNTIME_SOURCE_SCRIPTS : CORE_SCRIPTS.filter(function(src){ return CRITICAL_SHELL_SOURCE_SCRIPTS.indexOf(src) < 0; });
        return loadScriptsSequentialSafe(fallback);
      });
    } else {
      // Compatibility fallback for a manifest without generated bundles.
      var remaining = DEFERRED_RUNTIME_SOURCE_SCRIPTS.length ? DEFERRED_RUNTIME_SOURCE_SCRIPTS : CORE_SCRIPTS.filter(function(src){ return CRITICAL_SHELL_SOURCE_SCRIPTS.indexOf(src) < 0; });
      mainRuntime = loadScriptsSequentialSafe(remaining);
    }
    return mainRuntime.then(function(){ return extras.length ? loadScriptsOrderedParallelSafe(extras) : []; });
  }
  function finish(){
    LOADER_RUNTIME.stage = 'finalize';
    LOADER_RUNTIME.actualText = 'Финализируем запуск калькулятора…';
    renderLoaderFrame();
    var finishedAt = now();
    fullReadyAt = finishedAt;
    window.__APP_BACKGROUND_READY__ = true;
    document.documentElement.setAttribute('data-runtime-phase','ready');
    window.__APP_BOOTSTRAP_META__ = {
      version: VERSION, status: 'ready', release: EXPECTED_RUNTIME_RELEASE, async_data_loader: true, fast_start: true, data_urls: DATA_URLS.slice(), product_payload_bytes: dataBytes,
      loaded_scripts: CORE_SCRIPTS.slice(), loaded_script_requests: loadedScripts.slice(), recovered_requests: recoveredRequests.slice(), failed_scripts: failedScripts.slice(), dev_mode: DEV, selftest_mode: SELFTEST, perf_mode: PERF,
      timings_ms: { total: Math.round(finishedAt - startedAt), shell: shellReadyAt ? Math.round(shellReadyAt - startedAt) : null, background: shellReadyAt ? Math.round(finishedAt - shellReadyAt) : null, data: dataStartedAt && scriptsStartedAt ? Math.round(scriptsStartedAt - dataStartedAt) : null, scripts: scriptsStartedAt ? Math.round(finishedAt - scriptsStartedAt) : null }
    };
    try { window.dispatchEvent(new CustomEvent('app:ready', { detail: window.__APP_BOOTSTRAP_META__ })); } catch(_) {}
    setStatus('Калькулятор готов.', 'done', 100);
  }
  function startRuntimeAfterProducts(){
    setStatus('Загружаем калькулятор Сергея Веснина…', 'loading');
    return loadRuntime();
  }
  setStatus('Загружаем калькулятор Сергея Веснина…', 'loading');
  try { loadLoaderManifest(); } catch(_) {}
  window.__APP_SHELL_READY_PROMISE__ = loadCriticalShell()
    .then(markShellReady)
    .catch(function(e){
      showLoadError('Не удалось подготовить первый экран.', e && (e.stack || e.message || String(e)));
      throw e;
    });
  window.__PRODUCTS_READY__ = window.__APP_SHELL_READY_PROMISE__.then(function(){
      preloadDeferredRuntime();
      setStatus('Загружаем базу продуктов в фоне…', 'loading');
      return loadProducts();
    })
    .catch(function(e){
      showLoadError('База продуктов не загрузилась. Поиск и расчёты остановлены, чтобы не показывать нулевые значения.', e && (e.stack || e.message || String(e)));
      throw e;
    })
    .then(startRuntimeAfterProducts)
    .then(finish)
    .catch(function(e){
      showLoadError('Runtime bootstrap failed', e && (e.stack || e.message || String(e)));
      throw e;
    });
})();
