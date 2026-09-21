/* HF9 correction workspace static/browser self-test. */
(function(w,d){'use strict';
  function byId(id){return d.getElementById(id);}
  function row(name,pass){return {name:name,pass:!!pass};}
  function audit(){
    var api=w.WorkspaceCorrectionHF9,nav=w.NavigationShellV1,model=null;try{model=api&&api.getModel?api.getModel():null;}catch(_){}
    var rows=[
      row('navigation HF9',nav&&nav.version==='v5.3.210-rc2-hf9'),
      row('correction API',api&&api.version==='v5.3.210-rc2-hf9-correction'),
      row('correction panel',byId('workspaceCorrectionPanel')),
      row('correction route isolated',nav&&nav.routes&&nav.routes.correction&&nav.routes.correction.ids.length===1&&nav.routes.correction.ids[0]==='workspaceCorrectionPanel'),
      row('legacy AI hidden in workspace',nav&&nav.routes&&nav.routes.correction&&nav.routes.correction.ids.indexOf('geminiAiSection')<0),
      row('priority region',byId('workspaceCorrectionPriorities')),
      row('preview region',byId('workspaceCorrectionPreview')),
      row('scenario API surface',api&&typeof api.preview==='function'&&typeof api.apply==='function'&&typeof api.undo==='function'),
      row('model contract',model&&Array.isArray(model.priorities)&&Array.isArray(model.items))
    ];
    return {version:'v5.3.210-rc2-hf9',ok:rows.every(function(x){return x.pass;}),rows:rows};
  }
  w.WorkspaceCorrectionHF9Selftest={version:'v5.3.210-rc2-hf9',audit:audit};
  w.runWorkspaceCorrectionHF9Tests=function(){return audit().ok;};
  w.setTimeout(function(){try{w.dispatchEvent(new CustomEvent('workspace-correction:selftest',{detail:audit()}));}catch(_){}},850);
})(window,document);
