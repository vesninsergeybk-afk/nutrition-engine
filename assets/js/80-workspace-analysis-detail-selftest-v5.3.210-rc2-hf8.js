/* HF8 release self-test for the HF7 analysis view on the HF8 shell. */
(function(w,d){'use strict';
function byId(id){return d.getElementById(id);}function row(name,pass){return {name:name,pass:!!pass};}
function audit(){var api=w.NutritionAnalysisWorkspaceHF7,nav=w.NavigationShellV1,vm=null;try{vm=api&&api.getViewModel?api.getViewModel():null;}catch(_){}var rows=[
 row('navigation HF8',nav&&nav.version==='v5.3.210-rc2-hf8'),
 row('analysis API',api&&api.version==='v5.3.210-rc2-hf7-analysis-detail'),
 row('nutrient panel',byId('workspaceNutrientsPanel')),
 row('HEI panel',byId('workspaceHeiPanel')),
 row('nutrient route isolated',nav&&nav.routes&&nav.routes['analysis/nutrients']&&nav.routes['analysis/nutrients'].ids.length===1&&nav.routes['analysis/nutrients'].ids[0]==='workspaceNutrientsPanel'),
 row('HEI route isolated',nav&&nav.routes&&nav.routes['analysis/hei']&&nav.routes['analysis/hei'].ids.length===1&&nav.routes['analysis/hei'].ids[0]==='workspaceHeiPanel'),
 row('view model',vm&&Array.isArray(vm.nutrients)&&vm.hei&&Array.isArray(vm.hei.rows)),
 row('one legacy nutrient grid',d.querySelectorAll('#totalsGrid').length===1),
 row('one legacy HEI table',d.querySelectorAll('#heiTable').length===1),
 row('filter controls',d.querySelectorAll('[data-nutrient-filter]').length===3&&d.querySelectorAll('[data-hei-filter]').length===2),
 row('contributors use details',!!d.querySelector('#workspaceNutrientsPanel details.workspace-contributors')||!vm||!vm.items)
];return {version:'v5.3.210-rc2-hf8',ok:rows.every(function(x){return x.pass;}),rows:rows};}
w.runWorkspaceAnalysisHF7Tests=function(){var result=audit();try{if(console&&console.table)console.table(result.rows);}catch(_){}return result.ok;};
w.WorkspaceAnalysisHF7Selftest={version:'v5.3.210-rc2-hf8',audit:audit};
})(window,document);
