/* P1.4 compatibility diagnostic: retained filename, current formula policy. */
(function(){
  'use strict';
  var CASE_IDS=['protein_1','protein_2','protein_3','protein_4','protein_5','protein_6'];
  function run(){
    var qa=window.NutritionNeedsFormulaQA, reg=window.NutritionFormulaRegistryP14;
    if(!qa||!reg) return false;
    var rows=reg.golden.cases.filter(function(c){return CASE_IDS.indexOf(c.case_id)>=0;}).map(function(c){
      var i=c.inputs,actual=qa.proteinPerKgFor(i.state,i.activity,i.age,i.goal,i.weight_kg,i.sex);
      return {test:c.case_id,formulaId:c.formula_id,expected:c.expected,actual:actual,pass:Math.abs(Number(actual)-Number(c.expected))<=Number(c.tolerance||1e-9)};
    });
    window.__V44_PROTEIN_FORMULA_TESTS__=rows;
    window.__P14_PROTEIN_FORMULA_TESTS__=rows;
    if(window.console&&console.table) console.table(rows);
    return rows.length===CASE_IDS.length&&rows.every(function(x){return x.pass;});
  }
  window.runV44ProteinFormulaTests=run;
  window.runP14ProteinFormulaTests=run;
  window.__V44_PROTEIN_FORMULA_VERSION__='v5.3.210-p1.4';
})();
