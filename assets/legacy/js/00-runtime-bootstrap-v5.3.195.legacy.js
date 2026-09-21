// nutrition calculator v5.2.38_scroll_state_guard
// Module: 00-runtime-bootstrap-v5.js
// Responsibility: chunked product loading + ordered runtime script loading + perf metadata.
(function () {
    'use strict';
    var VERSION = 'v5.3.195_gemini_strategy_gateway_fix';
    var qs = new URLSearchParams(location.search || '');
    var DEV = qs.get('dev') === '1' || qs.get('dev') === 'legacy';
    var SELFTEST = qs.get('selftest') === '1';
    var PERF = qs.get('perf') === '1' || DEV || SELFTEST;
    var startedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var dataStartedAt = 0;
    var scriptsStartedAt = 0;
    var dataBytes = 0;
    var loadedDataUrl = '';
    var loadedScripts = [];
    var failedScripts = [];
    var PRODUCT_CHUNK_URLS = [
        "./data/products.v5.3.190.part-01.json?v=v5.3.190",
        "./data/products.v5.3.190.part-02.json?v=v5.3.190",
        "./data/products.v5.3.190.part-03.json?v=v5.3.190",
        "./data/products.v5.3.190.part-04.json?v=v5.3.190",
        "./data/products.v5.3.190.part-05.json?v=v5.3.190",
        "./data/products.v5.3.190.part-06.json?v=v5.3.190",
        "./data/products.v5.3.190.part-07.json?v=v5.3.190",
        "./data/products.v5.3.190.part-08.json?v=v5.3.190",
        "./data/products.v5.3.190.part-09.json?v=v5.3.190",
        "./data/products.v5.3.190.part-10.json?v=v5.3.190",
        "./data/products.v5.3.190.part-11.json?v=v5.3.190",
        "./data/products.v5.3.190.part-12.json?v=v5.3.190"
    ];
    var PRODUCT_CHUNK_FALLBACK_SETS = [
        [
            "./data/products.v5.3.190.part-01.json?v=v5.3.190",
            "./data/products.v5.3.190.part-02.json?v=v5.3.190",
            "./data/products.v5.3.190.part-03.json?v=v5.3.190",
            "./data/products.v5.3.190.part-04.json?v=v5.3.190",
            "./data/products.v5.3.190.part-05.json?v=v5.3.190",
            "./data/products.v5.3.190.part-06.json?v=v5.3.190",
            "./data/products.v5.3.190.part-07.json?v=v5.3.190",
            "./data/products.v5.3.190.part-08.json?v=v5.3.190",
            "./data/products.v5.3.190.part-09.json?v=v5.3.190",
            "./data/products.v5.3.190.part-10.json?v=v5.3.190",
            "./data/products.v5.3.190.part-11.json?v=v5.3.190",
            "./data/products.v5.3.190.part-12.json?v=v5.3.190"
        ]
    ];
    var PRODUCT_SCRIPT_CHUNK_URLS = [
        "./assets/data/products.v5.3.190.part-01.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-02.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-03.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-04.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-05.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-06.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-07.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-08.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-09.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-10.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-11.js?v=v5.3.190",
        "./assets/data/products.v5.3.190.part-12.js?v=v5.3.190"
    ];
    var DATA_URLS = PRODUCT_CHUNK_URLS.concat.apply(PRODUCT_CHUNK_URLS.slice(), PRODUCT_CHUNK_FALLBACK_SETS);
    var CORE_SCRIPTS = [
        "./assets/data/preparation-calculation-guard.v5.3.190.js?v=v5.3.190",
        "./assets/js/01-hei-module.js?v=v5.3.194",
        "./assets/js/03-app-core.js?v=v5.3.194",
        "./assets/js/04-needs-norms.js?v=5.3.155",
        "./assets/js/05-hei-bridges.js?v=v5.3.138",
        "./assets/js/06-dialogs-export-print.js?v=v5.3.138",
        "./assets/js/08-ux-search-mobile.js?v=v5.3.181",
        "./assets/js/53-ration-clarity-analytics-v5.js?v=v5.3.138",
        "./assets/js/10-ui-polish.js?v=v5.3.138",
        "./assets/js/12-accessibility-readability.js?v=v5.3.138",
        "./assets/js/13-needs-first-step.js?v=v5.3.138",
        "./assets/js/15-search-usability-tuning.js?v=v5.3.181",
        "./assets/js/35-mobile-ergonomics-v5.js?v=v5.3.138",
        "./assets/js/36-mobile-critical-fix-v5.js?v=v5.3.138",
        "./assets/js/16-visual-cleanup.js?v=v5.3.138",
        "./assets/js/17-readability-catalog-fix.js?v=v5.3.138",
        "./assets/js/18-catalog-group-labels-final.js?v=v5.3.138",
        "./assets/js/19-serving-units.js?v=v5.3.138",
        "./assets/js/23-mobile-ration-cards.js?v=v5.3.138",
        "./assets/js/24-unit-quick-input.js?v=v5.3.138",
        "./assets/js/26-harvard-plate-v5-masks.js?v=v5.3.138",
        "./assets/js/26-harvard-plate-v5-stage-engine.js?v=v5.3.138",
        "./assets/js/34-harvard-plate-v5-diagram-remaster.js?v=v5.3.138",
        "./assets/js/29-report-builder-v5.js?v=v5.3.157",
        "./assets/js/30-methodology-governance-v5.js?v=v5.3.138",
        "./assets/js/38-mobile-hei-dashboard-v5.js?v=v5.3.138",
        "./assets/js/39-hei-recompute-watchdog-v5.js?v=v5.3.194",
        "./assets/js/40-harvard-hei-bridge-v5.js?v=v5.3.138",
        "./assets/js/41-harvard-plate-accordion-cleanup-v5.js?v=v5.3.138",
        "./assets/js/42-harvard-smart-rebalance-v5.js?v=v5.3.155",
        "./assets/js/43-harvard-whatif-simulator-v5.js?v=v5.3.138",
        "./assets/js/44-harvard-apply-plan-v5.js?v=v5.3.138",
        "./assets/js/45-interaction-state-guard-v5.js?v=v5.3.138",
        "./assets/js/46-harvard-event-scroll-hardlock-v5.js?v=v5.3.138",
        "./assets/js/47-resource-error-diagnostics-v5.js?v=v5.3.138",
        "./assets/js/48-pdf-export-safe-v5.js?v=v5.3.138",
        "./assets/js/49-harvard-ux-regression-selftest-v5.js?v=v5.3.138",
        "./assets/js/50-integrated-diet-analysis-profile-v5.js?v=v5.3.156",
        "./assets/data/composite-food-models.v5.3.145.js?v=v5.3.145",
        "./assets/js/51-composite-food-decomposer-v5.js?v=v5.3.138",
        "./assets/js/52-composite-food-folder-ui-v5.js?v=v5.3.138",
        "./assets/js/53-personal-profile-mobile-polish-v5.js?v=v5.3.138",
        "./assets/js/54-ui-design-audit-v5.js?v=v5.3.138",
        "./assets/js/55-design-system-audit-v5.js?v=v5.3.138",
        "./assets/js/56-hei-recommendations-critical-pass-v5.js?v=v5.3.194",
        "./assets/js/57-hei-recommendations-personalization-pass-v5.js?v=v5.3.194",
        "./assets/js/58-hei-recommendations-language-polish-v5.js?v=v5.3.138",
        "./assets/js/59-ui-ux-consolidation-v5.js?v=v5.3.138",
        "./assets/js/60-norm-region-clarity-v5.js?v=v5.3.138",
        "./assets/js/61-gemini-ai-explanation-v5.js?v=v5.3.195",
        "./assets/js/62-gemini-ration-import-v5.js?v=v5.3.194",
        "./assets/data/preparation-family-registry.v5.3.190.js?v=v5.3.190",
        "./assets/js/63-preparation-family-foundation-v5.js?v=v5.3.190",
        "./assets/js/64-preparation-aware-gemini-matching-v5.js?v=v5.3.190",
        "./assets/js/65-preparation-family-ui-v5.js?v=v5.3.190"
    ];
    var SELFTEST_SCRIPTS = [
        './assets/js/11-hosting-selftest.js?v=v5.3.190'
    ];
    var LEGACY_TEST_SCRIPTS = [
        "./assets/js/07-diagnostics-tests-legacy.js?v=v5.3.138",
        "./assets/js/09-domain-tests.js?v=v5.3.138",
        "./assets/js/14-protein-formula-tests.js?v=v5.3.138",
        "./assets/js/20-search-relevance-tests.js?v=v5.3.138",
        "./assets/js/21-category-taxonomy-tests.js?v=v5.3.138",
        "./assets/js/22-category-taxonomy-second-pass-tests.js?v=v5.3.138"
    ];
    var PERF_SCRIPT = './assets/js/32-performance-selftest-v5.js?v=v5.3.138';
    function legacyRuntimePath(src) {
        if (src.indexOf('./assets/js/') === 0)
            return src.replace('./assets/js/', './assets/legacy/js/');
        if (src.indexOf('./assets/data/') === 0 && src.indexOf('products.') < 0)
            return src.replace('./assets/data/', './assets/legacy/data/');
        return src;
    }
    CORE_SCRIPTS = CORE_SCRIPTS.map(legacyRuntimePath);
    SELFTEST_SCRIPTS = SELFTEST_SCRIPTS.map(legacyRuntimePath);
    LEGACY_TEST_SCRIPTS = LEGACY_TEST_SCRIPTS.map(legacyRuntimePath);
    PERF_SCRIPT = legacyRuntimePath(PERF_SCRIPT);
    function installLateDomReadyShim() {
        if (window.__LATE_DOM_READY_SHIM_INSTALLED__)
            return;
        window.__LATE_DOM_READY_SHIM_INSTALLED__ = true;
        var nativeDocumentAdd = document.addEventListener.bind(document);
        var nativeWindowAdd = window.addEventListener.bind(window);
        var domReadyFired = document.readyState === 'complete';
        nativeDocumentAdd('DOMContentLoaded', function () { domReadyFired = true; }, { once: true });
        function makeReadyEvent() {
            try {
                return new Event('DOMContentLoaded', { bubbles: true, cancelable: false });
            }
            catch (_) {
                var ev = document.createEvent('Event');
                ev.initEvent('DOMContentLoaded', true, false);
                return ev;
            }
        }
        function invokeDomReadyListener(target, listener) {
            if (!listener)
                return;
            var ev = makeReadyEvent();
            try {
                if (typeof listener === 'function')
                    listener.call(target, ev);
                else if (listener && typeof listener.handleEvent === 'function')
                    listener.handleEvent(ev);
            }
            catch (err) {
                setTimeout(function () { throw err; }, 0);
            }
        }
        function patchedAdd(target, nativeAdd) {
            return function (type, listener, options) {
                if (type === 'DOMContentLoaded' && listener && (domReadyFired || document.readyState === 'complete')) {
                    setTimeout(function () { invokeDomReadyListener(target, listener); }, 0);
                    if (options && options.once === true)
                        return;
                }
                return nativeAdd(type, listener, options);
            };
        }
        document.addEventListener = patchedAdd(document, nativeDocumentAdd);
        window.addEventListener = patchedAdd(window, nativeWindowAdd);
    }
    installLateDomReadyShim();
    function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
    function ready(fn) { if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    else
        fn(); }
    function timeoutPromise(promise, ms, label) {
        var timer;
        var timeout = new Promise(function (_, reject) {
            timer = setTimeout(function () { reject(new Error((label || 'operation') + ' timed out after ' + ms + 'ms')); }, ms);
        });
        return Promise.race([promise, timeout]).then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
    }
    function fetchTextHard(url, timeoutMs, purpose) {
        timeoutMs = timeoutMs || 12000;
        var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { try {
            controller.abort();
        }
        catch (_) { } }, timeoutMs) : null;
        var cacheMode = (purpose === 'manifest') ? 'default' : 'default';
        var req = fetch(url, { cache: cacheMode, credentials: 'same-origin', signal: controller ? controller.signal : undefined }).then(function (resp) {
            if (timer)
                clearTimeout(timer);
            if (!resp.ok)
                throw new Error('HTTP status ' + resp.status + ' while loading ' + url);
            return resp.text().then(function (text) {
                if (purpose !== 'manifest')
                    dataBytes += text.length || 0;
                var trimmed = text.replace(/^\s+/, '');
                if (trimmed.charAt(0) === '<')
                    throw new Error('Expected JSON but received HTML from ' + url);
                return text;
            });
        }).catch(function (e) {
            if (timer)
                clearTimeout(timer);
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
        palette: ['near-black', 'dark gray', 'light gray', 'white'],
        rendering: 'CSS background-position + image-rendering: pixelated',
        note: 'Production loader assets are loaded from JSON manifest; bootstrap keeps only a minimal fallback registry.'
    };
    if (typeof window !== 'undefined') {
        window.__LOADER_ART_SPEC__ = LOADER_ART_SPEC;
    }
    var LOADER_ASSETS = [{ "id": "boot_default", "frame": 0, "stages": ["boot"], "tags": ["boot"], "weight": 1 }, { "id": "product_database", "frame": 1, "stages": ["products"], "tags": ["products"], "weight": 1 }, { "id": "hei_analysis", "frame": 8, "stages": ["runtime"], "tags": ["hei"], "weight": 1 }, { "id": "data_check", "frame": 24, "stages": ["finalize"], "tags": ["check"], "weight": 1 }, { "id": "done_default", "frame": 12, "stages": ["done"], "tags": ["done"], "weight": 1 }, { "id": "error_default", "frame": 15, "stages": ["error"], "tags": ["error"], "weight": 1 }];
    var LOADER_STAGE_POOLS = { "boot": ["boot_default"], "products": ["product_database"], "runtime": ["hei_analysis"], "finalize": ["data_check"], "done": ["done_default"], "error": ["error_default"] };
    var LOADER_STAGE_SUBPOOLS = { "productsPrimary": ["product_database"], "productsSecondary": ["product_database"], "runtimeEarly": ["hei_analysis"], "runtimeLate": ["hei_analysis"], "finalizePrimary": ["data_check"], "donePrimary": ["done_default"] };
    var LOADER_THEMES = { "fallbackSafe": { "label": "Fallback safe", "stagePools": { "products": ["product_database"], "runtime": ["hei_analysis"], "finalize": ["data_check"], "done": ["done_default"] }, "weight": 1 } };
    var LOADER_ASSETS_BY_ID = {};
    var LOADER_RUN = null;
    var LOADER_MANIFEST_STATE = { loading: false, loaded: false, error: null, data: null, promise: null };
    function indexLoaderAssets() {
        LOADER_ASSETS_BY_ID = {};
        for (var lai = 0; lai < LOADER_ASSETS.length; lai++)
            LOADER_ASSETS_BY_ID[LOADER_ASSETS[lai].id] = LOADER_ASSETS[lai];
    }
    indexLoaderAssets();
    function normalizeLoaderPath(path) {
        if (!path)
            return '';
        if (/^(?:https?:)?\/\//.test(path))
            return path;
        if (path.charAt(0) === '.')
            return path;
        return './' + path.replace(/^\/+/, '');
    }
    function withLoaderVersion(url) {
        if (!url)
            return url;
        return url.indexOf('?') >= 0 ? url : (url + '?v=v5.3.138');
    }
    function applyLoaderManifest(data) {
        if (!data || !Array.isArray(data.assets))
            throw new Error('Invalid loader manifest');
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
        }
        catch (_) { }
    }
    function loadLoaderManifest() {
        if (LOADER_MANIFEST_STATE.loaded || LOADER_MANIFEST_STATE.loading)
            return LOADER_MANIFEST_STATE.promise;
        LOADER_MANIFEST_STATE.loading = true;
        LOADER_MANIFEST_STATE.promise = fetchTextHard(LOADER_MANIFEST_URL, 5000, 'manifest').then(function (txt) {
            var data = JSON.parse(txt);
            applyLoaderManifest(data);
            LOADER_MANIFEST_STATE.loaded = true;
            LOADER_MANIFEST_STATE.loading = false;
            LOADER_MANIFEST_STATE.data = data;
            try {
                window.__LOADER_MANIFEST_STATE__ = LOADER_MANIFEST_STATE;
            }
            catch (_) { }
            window.__LOADER_SPRITE_PRELOADED__ = null;
            preloadLoaderSprite(true);
            try {
                renderLoaderFrame();
            }
            catch (_) { }
            return data;
        }).catch(function (err) {
            LOADER_MANIFEST_STATE.error = err && err.message ? err.message : String(err || 'loader manifest error');
            LOADER_MANIFEST_STATE.loading = false;
            LOADER_MANIFEST_STATE.loaded = false;
            try {
                window.__LOADER_MANIFEST_STATE__ = LOADER_MANIFEST_STATE;
            }
            catch (_) { }
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
                'Калькулятор готов к работе.',
                'Все модули загружены и синхронизированы.',
                'Можно переходить к расчётам, HEI и Гарвардской тарелке.'
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
    var LOADER_RUNTIME = { ticker: 0, stage: 'boot', kind: 'loading', actualText: 'Загружаем калькулятор Сергея Веснина…', cycleTick: 0, lastFrameIndex: -1 };
    var LOADER_PROGRESS = { boot: 2, productsDone: 0, productsTotal: 0, scriptsDone: 0, scriptsTotal: 0 };
    function preloadLoaderSprite(force) {
        try {
            loadLoaderManifest();
            if (!force && window.__LOADER_SPRITE_PRELOADED__ && window.__LOADER_SPRITE_PRELOADED__.src && window.__LOADER_SPRITE_PRELOADED__.src.indexOf((LOADER_SPRITE.url || '').replace('./', '')) >= 0)
                return;
            var img = new Image();
            img.onload = function () {
                LOADER_SPRITE.failed = false;
                try {
                    renderLoaderFrame();
                }
                catch (_) { }
            };
            img.onerror = function () {
                if (LOADER_SPRITE.fallbackUrl && LOADER_SPRITE.url !== LOADER_SPRITE.fallbackUrl) {
                    LOADER_SPRITE.url = LOADER_SPRITE.fallbackUrl;
                    window.__LOADER_SPRITE_PRELOADED__ = null;
                    preloadLoaderSprite(true);
                    return;
                }
                LOADER_SPRITE.failed = true;
                try {
                    renderLoaderFrame();
                }
                catch (_) { }
            };
            img.src = LOADER_SPRITE.url;
            window.__LOADER_SPRITE_PRELOADED__ = img;
        }
        catch (_) { }
    }
    function inferStage(text, kind) {
        if (kind === 'done')
            return 'done';
        if (kind === 'error')
            return 'error';
        var t = String(text || '').toLowerCase();
        if (t.indexOf('загружаем базу продуктов') >= 0)
            return 'products';
        if (t.indexOf('инициализируем калькулятор') >= 0)
            return 'runtime';
        if (t.indexOf('загружаем интерфейс') >= 0)
            return 'runtime';
        if (t.indexOf('финализируем') >= 0)
            return 'finalize';
        return 'boot';
    }
    function computeRealProgress() {
        var pFrac = LOADER_PROGRESS.productsTotal ? (LOADER_PROGRESS.productsDone / LOADER_PROGRESS.productsTotal) : 0;
        var sFrac = LOADER_PROGRESS.scriptsTotal ? (LOADER_PROGRESS.scriptsDone / LOADER_PROGRESS.scriptsTotal) : 0;
        var value = LOADER_PROGRESS.boot + (pFrac * 50) + (sFrac * 46);
        if (LOADER_RUNTIME.kind === 'done')
            value = 100;
        if (LOADER_RUNTIME.kind === 'error')
            value = Math.max(value, 100);
        return Math.max(0, Math.min(100, Math.round(value)));
    }
    function stageProgress(stage) {
        if (stage === 'products')
            return LOADER_PROGRESS.productsTotal ? (LOADER_PROGRESS.productsDone / LOADER_PROGRESS.productsTotal) : 0;
        if (stage === 'runtime')
            return LOADER_PROGRESS.scriptsTotal ? (LOADER_PROGRESS.scriptsDone / LOADER_PROGRESS.scriptsTotal) : 0;
        if (stage === 'finalize')
            return 0.9;
        if (stage === 'done')
            return 1;
        if (stage === 'error')
            return 1;
        return Math.min(1, computeRealProgress() / 12);
    }
    function makeLoaderSeed() {
        var base = Date.now() + ':' + Math.floor(Math.random() * 1000000) + ':' + (window.performance && performance.now ? Math.floor(performance.now() * 1000) : 0);
        var h = 2166136261;
        for (var i = 0; i < base.length; i++) {
            h ^= base.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }
    function seededRandom(seed) {
        var t = seed >>> 0;
        return function () {
            t += 0x6D2B79F5;
            var r = t;
            r = Math.imul(r ^ (r >>> 15), r | 1);
            r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }
    function prefersReducedMotion() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        }
        catch (_) {
            return false;
        }
    }
    function getAsset(id) {
        return LOADER_ASSETS_BY_ID[id] || LOADER_ASSETS_BY_ID.boot_default || LOADER_ASSETS[0];
    }
    function readRecentLoaderAssets() {
        try {
            var raw = localStorage.getItem('nutri_v5328_loader_recent_assets');
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list.slice(0, 18) : [];
        }
        catch (_) {
            return [];
        }
    }
    function saveRecentLoaderAssets(run) {
        try {
            var current = [];
            ['bootSequence', 'productsSequence', 'runtimeSequence', 'finalizeSequence', 'doneSequence'].forEach(function (key) {
                var seq = run && run[key];
                if (Array.isArray(seq)) {
                    for (var i = 0; i < seq.length; i++)
                        if (current.indexOf(seq[i]) < 0)
                            current.push(seq[i]);
                }
            });
            if (run && run.error && current.indexOf(run.error) < 0)
                current.push(run.error);
            var previous = readRecentLoaderAssets();
            var merged = current.concat(previous.filter(function (id) { return current.indexOf(id) < 0; }));
            localStorage.setItem('nutri_v5328_loader_recent_assets', JSON.stringify(merged.slice(0, 18)));
        }
        catch (_) { }
    }
    function weightedPick(ids, rand, used, recent, opts) {
        opts = opts || {};
        var pool = (ids || []).filter(function (id) { return !!getAsset(id); });
        var candidates = pool.filter(function (id) { return !used[id]; });
        if (!candidates.length)
            candidates = pool.slice();
        if (!opts.allowRecent && candidates.length > 1) {
            var fresh = candidates.filter(function (id) { return recent.indexOf(id) < 0; });
            if (fresh.length)
                candidates = fresh;
        }
        var total = 0;
        for (var i = 0; i < candidates.length; i++) {
            var asset = getAsset(candidates[i]);
            var weight = Math.max(0.01, Number(asset.weight || 1));
            if (recent.indexOf(candidates[i]) >= 0)
                weight *= 0.25;
            total += weight;
        }
        var roll = rand() * total;
        for (var j = 0; j < candidates.length; j++) {
            var a = getAsset(candidates[j]);
            var w = Math.max(0.01, Number(a.weight || 1));
            if (recent.indexOf(candidates[j]) >= 0)
                w *= 0.25;
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
    function weightedTheme(rand) {
        var keys = Object.keys(LOADER_THEMES || {});
        if (!keys.length)
            return null;
        var total = 0;
        for (var i = 0; i < keys.length; i++)
            total += Math.max(0.01, Number((LOADER_THEMES[keys[i]] || {}).weight || 1));
        var roll = rand() * total;
        for (var j = 0; j < keys.length; j++) {
            var theme = LOADER_THEMES[keys[j]] || {};
            roll -= Math.max(0.01, Number(theme.weight || 1));
            if (roll <= 0)
                return keys[j];
        }
        return keys[0];
    }
    function themePool(themeId, stage, fallbackPool) {
        var theme = themeId && LOADER_THEMES ? LOADER_THEMES[themeId] : null;
        var pools = theme && theme.stagePools ? theme.stagePools : null;
        return (pools && pools[stage] && pools[stage].length) ? pools[stage] : fallbackPool;
    }
    function pickStageSequence(stage, rand, used, recent, count, primaryPool, secondaryPool) {
        var seq = [];
        var first = weightedPick(primaryPool || LOADER_STAGE_POOLS[stage] || LOADER_STAGE_POOLS.boot, rand, used, recent);
        seq.push(first);
        if (count > 1) {
            var second = weightedPick(secondaryPool || LOADER_STAGE_POOLS[stage] || LOADER_STAGE_POOLS.boot, rand, used, recent);
            if (second && seq.indexOf(second) < 0)
                seq.push(second);
        }
        return seq;
    }
    function buildLoaderRun() {
        if (LOADER_RUN)
            return LOADER_RUN;
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
        }
        catch (_) { }
        saveRecentLoaderAssets(LOADER_RUN);
        return LOADER_RUN;
    }
    function sequenceForStage(stage) {
        var run = buildLoaderRun();
        if (stage === 'products')
            return run.productsSequence || [run.products || 'product_database'];
        if (stage === 'runtime')
            return run.runtimeSequence || [run.runtime || 'hei_analysis'];
        if (stage === 'finalize')
            return run.finalizeSequence || [run.finalize || 'data_check'];
        if (stage === 'done')
            return run.doneSequence || [run.done || 'done_default'];
        if (stage === 'error')
            return run.errorSequence || ['error_default'];
        return run.bootSequence || [run.boot || 'boot_default'];
    }
    function assetForStage(stage, prog) {
        var seq = sequenceForStage(stage);
        if (!seq.length)
            seq = ['boot_default'];
        if (prefersReducedMotion() || seq.length === 1 || stage === 'error' || stage === 'done' || stage === 'finalize')
            return getAsset(seq[0]);
        var index = 0;
        if (stage === 'products') {
            if (prog >= 0.58 || LOADER_RUNTIME.cycleTick >= 8)
                index = 1;
        }
        else if (stage === 'runtime') {
            if (prog >= 0.52 || LOADER_RUNTIME.cycleTick >= 7)
                index = 1;
        }
        index = Math.max(0, Math.min(seq.length - 1, index));
        return getAsset(seq[index]);
    }
    function frameForStage(stage, prog) {
        var asset = assetForStage(stage, prog);
        var frame = asset && typeof asset.frame === 'number' ? asset.frame : 0;
        return Math.max(0, Math.min(LOADER_SPRITE.total - 1, frame));
    }
    function currentScene() {
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
    function ensureStatusUi() {
        preloadLoaderSprite();
        var style = document.getElementById('runtimeBootStatusStyle');
        if (!style) {
            style = document.createElement('style');
            style.id = 'runtimeBootStatusStyle';
            style.textContent = [
                "#runtimeBootStatusOverlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(248,250,252,.86);backdrop-filter:blur(3px);z-index:9999;transition:opacity .28s ease,visibility .28s ease}",
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
                "@media (max-width:420px){#runtimeBootStatus{width:min(360px,calc(100vw - 18px))}#runtimeBootStatus .rbs-shell{grid-template-columns:1fr}#runtimeBootStatus .rbs-figure{margin:0 auto}}"
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
                    '<div class="rbs-foot"><span class="rbs-hint">Сборка от ' + (window.__APP_BUILD_DATE_RU__ || 'дата не указана') + '</span><span class="rbs-percent">0%</span></div>' +
                    '</div>' +
                    '</div>' +
                    '</section>';
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hide');
        return document.getElementById('runtimeBootStatus');
    }
    function stopLoaderTicker() { if (LOADER_RUNTIME.ticker) {
        clearInterval(LOADER_RUNTIME.ticker);
        LOADER_RUNTIME.ticker = 0;
    } }
    function applySpriteFrame(el, frameIndex) {
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
    function renderLoaderFrame() {
        if (typeof document === 'undefined' || !document.body)
            return;
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
        if (sprite) {
            if (sceneState.frameIndex !== LOADER_RUNTIME.lastFrameIndex) {
                applySpriteFrame(sprite, sceneState.frameIndex);
                LOADER_RUNTIME.lastFrameIndex = sceneState.frameIndex;
            }
        }
        if (step)
            step.textContent = 'Стадия ' + sceneState.scene.stageIndex + '/' + sceneState.scene.stageCount;
        if (stageEl)
            stageEl.textContent = sceneState.scene.label;
        if (primary)
            primary.textContent = LOADER_RUNTIME.actualText || 'Загружаем калькулятор Сергея Веснина…';
        if (secondary)
            secondary.textContent = sceneState.text;
        if (percent)
            percent.textContent = overall + '%';
        if (hint)
            hint.textContent = (LOADER_RUNTIME.kind === 'error')
                ? 'Проверьте файлы хостинга и повторите загрузку.'
                : (LOADER_RUNTIME.kind === 'done' ? 'Калькулятор готов к работе.' : 'Сцены и подписи связаны с текущей стадией и фактической загрузкой.');
        var onCount = Math.max(0, Math.min(cells.length, Math.round((overall / 100) * cells.length)));
        for (var i = 0; i < cells.length; i++)
            cells[i].classList.toggle('on', i < onCount);
        if (overlay)
            overlay.classList.remove('hide');
    }
    function startLoaderTicker() {
        if (LOADER_RUNTIME.ticker)
            return;
        renderLoaderFrame();
        LOADER_RUNTIME.ticker = setInterval(function () {
            if (LOADER_RUNTIME.kind !== 'loading')
                return;
            LOADER_RUNTIME.cycleTick += 1;
            renderLoaderFrame();
        }, prefersReducedMotion() ? 900 : 420);
    }
    function setProductProgress(done, total) {
        LOADER_PROGRESS.productsDone = Math.max(0, done || 0);
        LOADER_PROGRESS.productsTotal = Math.max(0, total || 0);
        if (LOADER_PROGRESS.productsDone > 0)
            LOADER_PROGRESS.boot = 4;
        LOADER_RUNTIME.stage = 'products';
        renderLoaderFrame();
    }
    function setScriptProgress(done, total) {
        LOADER_PROGRESS.scriptsDone = Math.max(0, done || 0);
        LOADER_PROGRESS.scriptsTotal = Math.max(0, total || 0);
        if (LOADER_PROGRESS.productsDone >= LOADER_PROGRESS.productsTotal && LOADER_PROGRESS.productsTotal > 0)
            LOADER_PROGRESS.boot = 6;
        LOADER_RUNTIME.stage = 'runtime';
        renderLoaderFrame();
    }
    function setStatus(text, kind, progress) {
        ready(function () {
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
            if (LOADER_RUNTIME.kind === 'error')
                LOADER_RUNTIME.stage = 'error';
            renderLoaderFrame();
            if (LOADER_RUNTIME.kind === 'done' && overlay) {
                setTimeout(function () { overlay.classList.add('hide'); }, 1800);
                setTimeout(function () {
                    try {
                        overlay.remove();
                    }
                    catch (_) { }
                    try {
                        window.__RUNTIME_LOADER_CLOSED__ = true;
                        window.dispatchEvent(new CustomEvent('runtime:loader-closed', { detail: { version: VERSION } }));
                        // v5.3.13: first-step popup is intentionally disabled. Keep runtime:loader-closed event only.
                    }
                    catch (_) { }
                }, 2300);
            }
        });
    }
    function showLoadError(message, detail) {
        window.__PRODUCTS_LOAD_ERROR__ = { message: message, detail: detail || '', tried_urls: DATA_URLS.slice(), app_version: VERSION };
        try {
            console.error('[v5.3.38 bootstrap]', message, detail || '');
        }
        catch (_) { }
        setStatus('Не удалось завершить запуск. Проверьте файлы хостинга и обновите страницу.', 'error');
    }
    function showLoadWarning(message, detail) {
        window.__PRODUCTS_LOAD_WARNING__ = { message: message, detail: detail || '', tried_urls: DATA_URLS.slice(), app_version: VERSION };
        try {
            console.warn('[v5.3.38 bootstrap]', message, detail || '');
        }
        catch (_) { }
        try {
            LOADER_RUNTIME.actualText = 'База продуктов недоступна; запускаем основные расчёты…';
            LOADER_RUNTIME.stage = 'runtime';
            renderLoaderFrame();
        }
        catch (_) { }
    }
    function normalizeProducts(products, source) {
        if (!Array.isArray(products))
            throw new Error(source + ' must contain product array');
        var seen = Object.create(null);
        for (var i = 0; i < products.length; i++) {
            var key = products[i] && products[i].key;
            if (!key)
                throw new Error('product without key at index ' + i + ' from ' + source);
            if (seen[key])
                throw new Error('duplicate product key: ' + key);
            seen[key] = true;
        }
        return products;
    }
    function fetchText(url) {
        return fetchTextHard(url, 20000, url);
    }
    function loadProductChunks(urls, label) {
        dataStartedAt = dataStartedAt || now();
        urls = urls || PRODUCT_CHUNK_URLS;
        label = label || 'chunked products v5.3.127';
        var productDone = 0;
        setProductProgress(0, urls.length || 0);
        return Promise.all(urls.map(function (url) {
            return fetchText(url).then(function (text) {
                productDone += 1;
                setProductProgress(productDone, urls.length || 0);
                var chunk = JSON.parse(text);
                if (!Array.isArray(chunk))
                    throw new Error('Product chunk is not an array: ' + url);
                return chunk;
            });
        })).then(function (chunks) {
            var products = [];
            chunks.forEach(function (chunk) { Array.prototype.push.apply(products, chunk); });
            products = normalizeProducts(products, label);
            loadedDataUrl = 'chunked:' + urls.length + ' files:' + label;
            return { payload: { schema_version: 'chunked-json-v1', app_version: 'v5.3.194', products_count: products.length, chunk_urls: urls.slice() }, products: products };
        });
    }
    function loadProductScriptChunk(src, index) {
        return new Promise(function (resolve, reject) {
            var done = false;
            var s = document.createElement('script');
            var timer = setTimeout(function () {
                if (done)
                    return;
                done = true;
                reject(new Error('Timed out loading product script chunk ' + src));
            }, 22000);
            s.src = src;
            s.async = false;
            s.onload = function () {
                if (done)
                    return;
                done = true;
                clearTimeout(timer);
                var chunk = window.__PRODUCT_SCRIPT_CHUNKS__ && window.__PRODUCT_SCRIPT_CHUNKS__[index];
                if (!Array.isArray(chunk)) {
                    reject(new Error('Product script chunk did not register array at index ' + index + ': ' + src));
                    return;
                }
                setProductProgress(index + 1, PRODUCT_SCRIPT_CHUNK_URLS.length || 0);
                resolve(chunk);
            };
            s.onerror = function () {
                if (done)
                    return;
                done = true;
                clearTimeout(timer);
                reject(new Error('Failed to load product script chunk ' + src));
            };
            document.head.appendChild(s);
        });
    }
    function loadProductScriptChunks(urls, label) {
        dataStartedAt = dataStartedAt || now();
        urls = urls || PRODUCT_SCRIPT_CHUNK_URLS;
        label = label || 'product script chunks v5.3.127';
        window.__PRODUCT_SCRIPT_CHUNKS__ = [];
        setProductProgress(0, urls.length || 0);
        return urls.reduce(function (promise, url, index) {
            return promise.then(function (chunks) {
                return loadProductScriptChunk(url, index).then(function (chunk) {
                    chunks.push(chunk);
                    return chunks;
                });
            });
        }, Promise.resolve([])).then(function (chunks) {
            var products = [];
            chunks.forEach(function (chunk) { Array.prototype.push.apply(products, chunk); });
            products = normalizeProducts(products, label);
            loadedDataUrl = 'script-chunks:' + urls.length + ' files:' + label;
            return { payload: { schema_version: 'script-chunks-v1', app_version: 'v5.3.194', products_count: products.length, chunk_urls: urls.slice() }, products: products };
        });
    }
    function loadEmbeddedProducts(errors) {
        var dbEl = document.getElementById('db');
        if (!dbEl)
            throw new Error('script#db compatibility slot not found');
        var text = (dbEl.textContent || '').trim();
        if (!text || text === '[]')
            throw new Error('embedded script#db is empty; chunk loading failed: ' + (errors || []).join(' | '));
        dataBytes += text.length || 0;
        var parsed = JSON.parse(text);
        var products = Array.isArray(parsed) ? parsed : parsed.products;
        products = normalizeProducts(products, 'embedded script#db');
        loadedDataUrl = 'embedded:script#db';
        return { payload: Array.isArray(parsed) ? { app_version: 'v5.3.194', products_count: products.length } : parsed, products: products };
    }
    function installProducts(result) {
        var dbEl = document.getElementById('db');
        if (!dbEl)
            throw new Error('script#db compatibility slot not found');
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
            script_chunk_database: loadedDataUrl.indexOf('script-chunks:') === 0,
            chunk_count: PRODUCT_CHUNK_URLS.length,
            script_chunk_count: PRODUCT_SCRIPT_CHUNK_URLS.length,
            tried_urls: DATA_URLS.slice(),
            loaded_at: new Date().toISOString(),
            async_loader: true,
            embedded_db_fallback: loadedDataUrl === 'embedded:script#db',
            payload_bytes: dataBytes
        };
        try {
            window.dispatchEvent(new CustomEvent('products:loaded', { detail: window.__PRODUCTS_META__ }));
        }
        catch (_) { }
        return result.products;
    }
    function productLoadFatal(errors, reason) {
        window.__PRODUCTS_LOAD_FATAL__ = { reason: reason || 'unknown', errors: (errors || []).slice(), version: VERSION };
        throw new Error('Product database failed: ' + (reason || 'unknown') + ' | ' + (errors || []).join(' | '));
    }
    function loadProducts() {
        var errors = [];
        function remember(e) { if (e)
            errors.push(e && (e.message || String(e))); }
        // v5.3.10: script chunks are primary. They use the same mechanism as runtime JS and avoid
        // hosting/MIME/fetch/cache failures that can make JSON chunks appear empty in some environments.
        var job = loadProductScriptChunks(PRODUCT_SCRIPT_CHUNK_URLS, 'primary script chunks v5.3.37').catch(function (e) {
            remember(e);
            return loadProductChunks(PRODUCT_CHUNK_URLS, 'fallback JSON v5.3.37');
        }).catch(function (e) {
            remember(e);
            var chain = Promise.reject(e);
            PRODUCT_CHUNK_FALLBACK_SETS.forEach(function (urls, idx) {
                chain = chain.catch(function (prev) {
                    remember(prev);
                    return loadProductChunks(urls, 'fallback JSON set ' + (idx + 1));
                });
            });
            return chain;
        }).catch(function (e) {
            remember(e);
            try {
                return loadEmbeddedProducts(errors);
            }
            catch (embeddedErr) {
                remember(embeddedErr);
                return productLoadFatal(errors, 'all product sources failed');
            }
        });
        return job.then(function (result) {
            var installed = installProducts(result);
            if (!installed || installed.length < 100) {
                return productLoadFatal(errors, 'installed product database is empty or too small: ' + (installed ? installed.length : 0));
            }
            return installed;
        });
    }
    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var done = false;
            var s = document.createElement('script');
            var timer = setTimeout(function () {
                if (done)
                    return;
                done = true;
                failedScripts.push(src);
                if (LOADER_PROGRESS.scriptsTotal)
                    setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
                reject(new Error('Timed out loading script ' + src));
            }, 6500);
            s.src = src;
            s.async = false;
            s.onload = function () {
                if (done)
                    return;
                done = true;
                clearTimeout(timer);
                loadedScripts.push(src);
                if (LOADER_PROGRESS.scriptsTotal)
                    setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
                resolve(src);
            };
            s.onerror = function () {
                if (done)
                    return;
                done = true;
                clearTimeout(timer);
                failedScripts.push(src);
                if (LOADER_PROGRESS.scriptsTotal)
                    setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
                reject(new Error('Failed to load script ' + src));
            };
            document.head.appendChild(s);
        });
    }
    function loadScriptsSequential(list) { return list.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve()); }
    function loadScriptsOrderedParallelSafe(list) {
        if (!list || !list.length)
            return Promise.resolve([]);
        return new Promise(function (resolve) {
            var remaining = list.length;
            var results = [];
            function done(src, ok, err) {
                results.push(src);
                if (!ok) {
                    try {
                        console.warn('[v5.3.37 bootstrap] optional script failed', src, err && (err.message || err));
                    }
                    catch (_) { }
                }
                remaining -= 1;
                if (LOADER_PROGRESS.scriptsTotal)
                    setScriptProgress(LOADER_PROGRESS.scriptsDone + 1, LOADER_PROGRESS.scriptsTotal);
                if (remaining <= 0)
                    resolve(results);
            }
            list.forEach(function (src) {
                var finished = false;
                var s = document.createElement('script');
                var timer = setTimeout(function () {
                    if (finished)
                        return;
                    finished = true;
                    failedScripts.push(src);
                    done(src, false, new Error('Timed out loading optional script ' + src));
                }, 12000);
                s.src = src;
                s.async = false;
                s.onload = function () {
                    if (finished)
                        return;
                    finished = true;
                    clearTimeout(timer);
                    loadedScripts.push(src);
                    done(src, true);
                };
                s.onerror = function () {
                    if (finished)
                        return;
                    finished = true;
                    clearTimeout(timer);
                    failedScripts.push(src);
                    done(src, false, new Error('Failed to load optional script ' + src));
                };
                document.head.appendChild(s);
            });
        });
    }
    function loadScriptsSequentialSafe(list) {
        return loadScriptsOrderedParallelSafe(list);
    }
    function loadRuntime() {
        setStatus('Загружаем интерфейс и интерактивные модули…', 'loading');
        scriptsStartedAt = now();
        var critical = CORE_SCRIPTS.slice(0, 3); // HEI module + app core + needs/norms only
        var optional = CORE_SCRIPTS.slice(3);
        if (SELFTEST || DEV)
            optional = optional.concat(SELFTEST_SCRIPTS);
        if (DEV && (qs.get('legacytests') === '1' || qs.get('dev') === 'legacy'))
            optional = optional.concat(LEGACY_TEST_SCRIPTS);
        if (PERF)
            optional.push(PERF_SCRIPT);
        setScriptProgress(0, critical.length + optional.length);
        return loadScriptsSequential(critical).then(function () { return loadScriptsOrderedParallelSafe(optional); });
    }
    function finish() {
        LOADER_RUNTIME.stage = 'finalize';
        LOADER_RUNTIME.actualText = 'Финализируем запуск калькулятора…';
        renderLoaderFrame();
        var finishedAt = now();
        window.__APP_BOOTSTRAP_META__ = {
            version: VERSION, async_data_loader: true, data_urls: DATA_URLS.slice(), product_payload_bytes: dataBytes,
            loaded_scripts: loadedScripts.slice(), failed_scripts: failedScripts.slice(), dev_mode: DEV, selftest_mode: SELFTEST, perf_mode: PERF,
            timings_ms: { total: Math.round(finishedAt - startedAt), data: dataStartedAt ? Math.round(scriptsStartedAt - dataStartedAt) : null, scripts: scriptsStartedAt ? Math.round(finishedAt - scriptsStartedAt) : null }
        };
        try {
            window.dispatchEvent(new CustomEvent('app:ready', { detail: window.__APP_BOOTSTRAP_META__ }));
        }
        catch (_) { }
        setStatus('Калькулятор готов.', 'done', 100);
    }
    function startRuntimeAfterProducts() {
        setStatus('Загружаем калькулятор Сергея Веснина…', 'loading');
        return loadRuntime();
    }
    setStatus('Загружаем калькулятор Сергея Веснина…', 'loading');
    try {
        loadLoaderManifest();
    }
    catch (_) { }
    window.__PRODUCTS_READY__ = (function () {
        setStatus('Загружаем базу продуктов…', 'loading');
        return loadProducts()
            .catch(function (e) {
            showLoadError('База продуктов не загрузилась. Поиск и расчёты остановлены, чтобы не показывать нулевые значения.', e && (e.stack || e.message || String(e)));
            throw e;
        })
            .then(startRuntimeAfterProducts)
            .then(finish)
            .catch(function (e) {
            showLoadError('Runtime bootstrap failed', e && (e.stack || e.message || String(e)));
            throw e;
        });
    })();
})();
