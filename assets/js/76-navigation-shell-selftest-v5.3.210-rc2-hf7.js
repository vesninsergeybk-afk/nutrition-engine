/* Parallel navigation shell deterministic runtime self-test. */
(function(w,d){'use strict';
var VERSION='v5.3.210-rc2-hf7-navigation-shell-selftest';
function run(){
 var checks={},errors=[];function ok(name,value){checks[name]=!!value;if(!value)errors.push(name);}
 var api=w.NavigationShellV1,state=api&&api.getState?api.getState():null;
 ok('apiLoaded',!!api);ok('version',!!api&&api.version==='v5.3.210-rc2-hf7');
 ok('modeSwitcher',!!d.getElementById('navigationShellModeSwitcher'));
 ok('shellNavigation',!!d.getElementById('navigationShell'));
 ok('shellContext',!!d.getElementById('navigationShellContext'));
 ok('fourPrimaryDestinations',d.querySelectorAll('#navigationShell [data-navshell-route]').length===4);
 ok('legacyDefaultOrExplicitWorkspace',!!state&&(state.mode==='long'||state.mode==='workspace'));
 ok('managedSectionsRemainInDom',!!d.getElementById('rationSection')&&!!d.getElementById('heiPanel')&&!!d.getElementById('globalActions'));
 var result={version:VERSION,ok:errors.length===0,checks:checks,errors:errors,state:state};w.__NAVIGATION_SHELL_SELFTEST__=result;return result;
}
w.NavigationShellSelftest={version:VERSION,run:run};setTimeout(run,80);
})(window,document);
