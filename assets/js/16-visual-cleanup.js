// nutrition calculator v4.5.1_visual_cleanup
// Responsibility: bind top JSON loading button and expose a small visual cleanup self-test.
(function(){
  'use strict';
  var VERSION = 'v4.5.1_visual_cleanup';
  function byId(id){ return document.getElementById(id); }
  function bindTopJsonLoad(){
    var topBtn = byId('loadRationJsonBtn');
    var fileInput = byId('presetJsonFile');
    if (!topBtn || !fileInput || topBtn.dataset.v451Bound === '1') return;
    topBtn.dataset.v451Bound = '1';
    topBtn.addEventListener('click', function(){ fileInput.click(); });
  }
  function removeVisibleCompatibilityComments(){
    Array.prototype.slice.call(document.body.childNodes).forEach(function(node){
      if (node.nodeType === 3 && /v4\.[45].*product database is loaded/i.test(node.textContent || '')) {
        node.textContent = '';
      }
    });
  }
  function runTests(){
    var rows = [
      {test:'v4.5.1 visual cleanup CSS linked', pass:!!document.querySelector('link[href$="visual-cleanup.css"],link[data-css-bundle="5.3.117"]')},
      {test:'v4.5.1 visual cleanup JS loaded', pass:window.__V451_VISUAL_CLEANUP__ === VERSION},
      {test:'top JSON load button exists', pass:!!byId('loadRationJsonBtn')},
      {test:'bottom hints section removed', pass:!Array.prototype.some.call(document.querySelectorAll('section.card h3'), function(h){ return h.textContent.trim() === 'Подсказки'; })},
      {test:'visible compatibility comment absent', pass:!document.body.textContent.includes('script#db remains as a runtime compatibility slot')}
    ];
    if (console && console.table) console.table(rows);
    return rows.every(function(r){ return !!r.pass; });
  }
  function init(){
    window.__V451_VISUAL_CLEANUP__ = VERSION;
    bindTopJsonLoad();
    removeVisibleCompatibilityComments();
    window.runV451VisualCleanupTests = runTests;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
