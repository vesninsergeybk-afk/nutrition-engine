/* v6.0.0 beta 1 — ES5-safe runtime selector */
(function(w,d){'use strict';
var RELEASE_VERSION='v6.0.0-beta1-profile-continuity';
w.__RUNTIME_SELECTOR_RELEASE__=RELEASE_VERSION;
var c=w.__BROWSER_COMPAT__||{mode:'unsupported'};
function fail(message){if(typeof w.__renderBrowserCompatibilityNotice__==='function')w.__renderBrowserCompatibilityNotice__('runtime-error',message);}
function load(src,next){var s=d.createElement('script');s.src=src;s.async=false;s.onload=function(){if(next)next();};s.onerror=function(){fail('Не удалось загрузить '+src);};(d.head||d.documentElement).appendChild(s);}
if(c.mode==='unsupported')return;
if(c.mode==='legacy'){
 load('./assets/legacy/compat-polyfills-v5.3.192.js?v=5.3.192',function(){
  load('./assets/legacy/compat-runtime-bridge-v5.3.192.js?v=5.3.192',function(){
   load('./assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta1.legacy.js?v=v6.0.0-beta1-profile-continuity');
  });
 });
}else load('./assets/js/00-runtime-bootstrap-v6.0.0-beta1.js?v=v6.0.0-beta1-profile-continuity');
})(window,document);
