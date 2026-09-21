/* v6 beta 1 functional-parity guard for the full ration assessment surface. */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta1-feature-continuity';
  var REQUIRED=[
    ['ration','rationSection'],['nutrientSummary','totalsSection'],['hei','heiPanel'],
    ['dietProfile','dietAnalysisProfilePanel'],['harvardPlate','strictHarvardPlateDetails'],
    ['report','globalActions'],['search','globalSearchSection'],['needs','needs']
  ];
  function audit(){
    var missing=[],present={};REQUIRED.forEach(function(row){var ok=!!d.getElementById(row[1]);present[row[0]]=ok;if(!ok)missing.push(row[1]);});
    var api={state:!!(w.State&&typeof w.State.get==='function'),hei:!!(w.HEI||w.HEI2020Core||w.__lastHEIModel!==undefined),needs:!!w.NutritionNeedsFormulaQA,viewModel:!!w.NutritionUIViewModel};
    var ok=missing.length===0&&api.state&&api.needs;
    var result={ok:ok,version:VERSION,missing:missing,present:present,apis:api};
    d.documentElement.setAttribute('data-feature-continuity',ok?'ok':'error');
    try{w.dispatchEvent(new CustomEvent('nutrition:feature-continuity',{detail:result}));}catch(_){}
    return result;
  }
  function init(){w.NutritionFeatureContinuityV1={version:VERSION,audit:audit};audit();w.addEventListener('app:ready',audit,false);w.addEventListener('navigation-shell:ready',audit,false);}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
