/* HF8 workspace first-slice self-test. */
(function(w,d){'use strict';
function byId(id){return d.getElementById(id);}function row(name,pass){return {name:name,pass:!!pass};}
function audit(){var api=w.NutritionWorkspaceSliceHF8,nav=w.NavigationShellV1,state=nav&&nav.getState?nav.getState():{};var rows=[
 row('workspace API',api&&api.version==='v5.3.210-rc2-hf8-workspace-slice'),
 row('navigation HF8',nav&&nav.version==='v5.3.210-rc2-hf8'),
 row('ration inline summary',byId('workspaceRationInlineSummary')),
 row('ration empty state',byId('workspaceRationEmpty')),
 row('secondary disclosure',byId('workspaceRationSecondary')),
 row('overview panel',byId('workspaceOverviewPanel')),
 row('overview route registered',nav&&nav.routes&&nav.routes['analysis/overview']&&nav.routes['analysis/overview'].ids.indexOf('workspaceOverviewPanel')>=0),
 row('one source ration table',d.querySelectorAll('#rationTable').length===1),
 row('one source totals grid',d.querySelectorAll('#totalsGrid').length===1),
 row('current route valid',!!state.route)
];return {version:'v5.3.210-rc2-hf8',ok:rows.every(function(x){return x.pass;}),rows:rows};}
w.runWorkspaceSliceHF8Tests=function(){var result=audit();try{if(console&&console.table)console.table(result.rows);}catch(_){}return result.ok;};
w.WorkspaceSliceHF8Selftest={version:'v5.3.210-rc2-hf8',audit:audit};
})(window,document);
