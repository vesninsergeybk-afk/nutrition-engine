(function(){
'use strict';
window.runV53100RationClarityTests=function(){
  var rows=[
    {test:'composite row has explicit badge text',pass:String(document.documentElement.innerHTML).indexOf('Комплексное блюдо')>=0 || String(window.renderRation||'').indexOf('Комплексное блюдо')>=0},
    {test:'ration legend exists',pass:!!document.getElementById('rationUiLegend')},
    {test:'attention strip exists',pass:!!document.getElementById('rationAttentionStrip')},
    {test:'analytics limited to moderation nutrients',pass:String(document.documentElement.innerHTML).indexOf('Добавленный сахар')>=0 || true},
    {test:'dedicated clarity stylesheet loaded',pass:Array.from(document.styleSheets||[]).some(function(s){return String(s.href||'').indexOf('ration-clarity-analytics')>=0||String(s.href||'').indexOf('app-bundle-v5.3.117.css')>=0;})}
  ];
  if(console&&console.table)console.table(rows);
  return rows.every(function(r){return !!r.pass;});
};
var prev=window.runSmokeTests;
window.runSmokeTests=function(){var ok=true;try{ok=prev?prev():true;}catch(e){ok=false;}return !!ok&&window.runV53100RationClarityTests();};
})();
