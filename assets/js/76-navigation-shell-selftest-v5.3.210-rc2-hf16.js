/* Stage 5A unified navigation shell deterministic runtime self-test. */
(function(w,d){'use strict';
var VERSION='v5.3.210-rc2-hf16-navigation-shell-selftest';
function run(){
 var checks={},errors=[];function ok(name,value){checks[name]=!!value;if(!value)errors.push(name);}
 var api=w.NavigationShellV1,state=api&&api.getState?api.getState():null;
 var queryLong=false;try{queryLong=(new URL(w.location.href)).searchParams.get('ui')==='long';}catch(_){}
 ok('apiLoaded',!!api);ok('version',!!api&&api.version==='v5.3.210-rc2-hf16');
 ok('ordinaryModeSwitcherRemoved',!d.getElementById('navigationShellModeSwitcher')&&d.querySelectorAll('[data-navshell-mode]').length===0);
 ok('shellNavigation',!!d.getElementById('navigationShell'));
 ok('shellContext',!!d.getElementById('navigationShellContext'));
 ok('technicalReturnControl',!!d.getElementById('navigationShellLongReturn'));
 ok('fourPrimaryDestinations',d.querySelectorAll('#navigationShell .navigation-shell__items [data-navshell-route]').length===4);
 ok('queryScopedMode',!!state&&state.mode===(queryLong?'long':'workspace'));
 ok('technicalFlag',!!state&&state.technicalFallback===queryLong);
 ok('profileRoute',!!api&&api.routes&&!!api.routes.profile);
 ok('managedSectionsRemainInDom',!!d.getElementById('rationSection')&&!!d.getElementById('heiPanel')&&!!d.getElementById('globalActions')&&!!d.getElementById('workspaceReportPanel'));
 var result={version:VERSION,ok:errors.length===0,checks:checks,errors:errors,state:state};w.__NAVIGATION_SHELL_SELFTEST__=result;return result;
}
w.NavigationShellSelftest={version:VERSION,run:run};setTimeout(run,80);
})(window,document);
