/* V6 interface pass 1 — reversible composition simplification. ES5-safe. */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta8-interface-pass1';
  var timer=0,observer=null;

  function byId(id){return d.getElementById(id);}
  function closest(node,selector){return node&&node.closest?node.closest(selector):null;}
  function setText(node,text){if(node&&node.textContent!==text)node.textContent=text;}

  function mark(){
    d.documentElement.setAttribute('data-interface-simplification','1');
  }

  function simplifySettings(){
    var button=byId('interfaceSettingsHF2');
    if(button){
      setText(button,'Настройки');
      button.setAttribute('aria-label','Показать или скрыть настройки интерфейса и норм');
    }
  }

  function simplifyPersonContext(){
    var button=byId('workspacePersonEdit');
    if(!button)return;
    var compact=w.innerWidth<900;
    var ready=!!(w.__lastNeedsMeta&&w.__lastNeedsMeta.ok===true);
    setText(button,compact?(ready?'Изменить':'Профиль'):(ready?'Изменить профиль':'Рассчитать'));
  }

  function simplifyEntryMethods(){
    var panel=byId('workspaceRationEntryMethods');
    var search=byId('globalSearchSection');
    if(!panel||!search)return;

    var searchGrid=search.querySelector('.search-main-grid');
    if(searchGrid&&panel.previousElementSibling!==searchGrid){
      if(searchGrid.nextSibling)searchGrid.parentNode.insertBefore(panel,searchGrid.nextSibling);
      else searchGrid.parentNode.appendChild(panel);
    }

    var grid=panel.querySelector('.workspace-ration-entry-methods__grid');
    if(!grid)return;
    var details=byId('workspaceAltEntryMethods');
    if(!details){
      details=d.createElement('details');
      details.id='workspaceAltEntryMethods';
      details.className='workspace-alt-entry';
      var summary=d.createElement('summary');
      summary.textContent='Фото, голос или аудиофайл';
      var body=d.createElement('div');
      body.className='workspace-alt-entry__buttons';
      var buttons=grid.querySelectorAll('button[data-ration-entry-method]');
      var i,kind;
      for(i=0;i<buttons.length;i++){
        kind=buttons[i].getAttribute('data-ration-entry-method');
        if(kind==='search'){
          buttons[i].hidden=true;
          continue;
        }
        body.appendChild(buttons[i]);
      }
      details.appendChild(summary);
      details.appendChild(body);
      panel.appendChild(details);
    }
    grid.hidden=true;
    panel.setAttribute('data-ui-simplified','1');
  }

  function closeDialog(dialog){
    if(!dialog||dialog.tagName!=='DIALOG'||!dialog.open)return;
    try{dialog.close();}catch(_){try{dialog.removeAttribute('open');}catch(__){}}
  }

  function keepSingleDialog(targetId){
    w.setTimeout(function(){
      var keep=targetId?byId(targetId):null;
      var open=d.querySelectorAll('dialog[open]');
      var i;
      for(i=0;i<open.length;i++){
        if(keep&&open[i]===keep)continue;
        if(open.length>1)closeDialog(open[i]);
      }
    },0);
  }

  function handleClick(event){
    var close=closest(event.target,'dialog .close-btn, dialog .norm-region-help-close');
    if(close){
      var dialog=closest(close,'dialog');
      if(dialog){event.preventDefault();closeDialog(dialog);}
      return;
    }
    if(event.target&&event.target.tagName==='DIALOG'&&event.target.open){
      event.preventDefault();closeDialog(event.target);return;
    }
    var trigger=closest(event.target,'[aria-haspopup="dialog"]');
    if(trigger){
      var targetId=trigger.getAttribute('aria-controls')||trigger.getAttribute('data-dialog')||'';
      keepSingleDialog(targetId);
    }
  }

  function refresh(){
    mark();
    simplifySettings();
    simplifyEntryMethods();
    simplifyPersonContext();
  }
  function schedule(){
    w.clearTimeout(timer);
    timer=w.setTimeout(refresh,60);
  }

  function init(){
    d.addEventListener('click',handleClick,false);
    w.addEventListener('resize',schedule,false);
    ['app:ready','navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','workspace-entry-ux:ready','needs:computed','ration:changed'].forEach(function(name){
      w.addEventListener(name,schedule,false);
    });
    if(w.MutationObserver){
      try{
        observer=new MutationObserver(schedule);
        observer.observe(d.body||d.documentElement,{childList:true,subtree:true});
      }catch(_){}
    }
    refresh();
    w.NutritionInterfaceSimplification={version:VERSION,refresh:refresh};
    try{w.dispatchEvent(new CustomEvent('interface-simplification:ready',{detail:{version:VERSION}}));}catch(_){}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
