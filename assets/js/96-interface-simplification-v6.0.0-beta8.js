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

  function settingsHeader(){return d.querySelector('#mainContent>header');}

  function syncSettingsVisibility(){
    var header=settingsHeader();
    if(!header)return;
    var mobile=w.innerWidth<900;
    var open=header.classList.contains('interface-settings-pass1-open');
    var ids=['workspaceViewSwitcher','themeSwitcher'];
    var i,node;
    for(i=0;i<ids.length;i++){
      node=byId(ids[i]);
      if(!node)continue;
      if(mobile&&!open)node.style.setProperty('display','none','important');
      else node.style.removeProperty('display');
    }
    var toolbar=header.querySelector('.toolbar');
    if(toolbar){
      if(mobile&&!open)toolbar.style.setProperty('display','none','important');
      else toolbar.style.removeProperty('display');
    }
  }

  function setSettingsOpen(open){
    var header=settingsHeader(),button=byId('interfaceSettingsPass1');
    if(!header)return;
    header.classList.toggle('interface-settings-pass1-open',!!open);
    if(button)button.setAttribute('aria-expanded',open?'true':'false');
    syncSettingsVisibility();
  }

  function ensureSettingsControl(){
    var header=settingsHeader();
    if(!header)return;
    var button=byId('interfaceSettingsPass1');
    if(!button){
      button=d.createElement('button');
      button.id='interfaceSettingsPass1';
      button.type='button';
      button.className='secondary interface-settings-pass1';
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-controls','workspaceViewSwitcher themeSwitcher normRegionSwitcher');
      button.setAttribute('aria-label','Показать или скрыть настройки интерфейса и норм');
      button.textContent='Настройки';
      var title=header.querySelector('.title');
      if(title&&title.nextSibling)header.insertBefore(button,title.nextSibling);
      else header.insertBefore(button,header.firstChild);
    }
    var legacy=byId('interfaceSettingsHF2'),oldNav=d.querySelector('#navigationShell [data-navshell-settings-toggle]');
    if(legacy){
      legacy.setAttribute('aria-hidden','true');
      legacy.setAttribute('tabindex','-1');
    }
    if(oldNav){
      oldNav.setAttribute('aria-hidden','true');
      oldNav.setAttribute('tabindex','-1');
    }
    button.setAttribute('aria-expanded',header.classList.contains('interface-settings-pass1-open')?'true':'false');
  }

  function simplifyPersonContext(){
    var button=byId('workspacePersonEdit');
    if(!button)return;
    var compact=w.innerWidth<900;
    var ready=!!(w.__lastNeedsMeta&&w.__lastNeedsMeta.ok===true);
    setText(button,compact?(ready?'Изменить':'Профиль'):(ready?'Изменить профиль':'Рассчитать'));
  }

  function syncEmptyAnalysisSemantics(){
    if(d.documentElement.getAttribute('data-ivory-ration')!=='empty')return;
    var emptyCounters=[
      'workspaceNutrientAttentionCount','workspaceNutrientOkCount','workspaceNutrientIncompleteCount',
      'workspaceHeiAttentionCount','workspaceHeiOkCount','workspaceHeiGuardrailCount'
    ];
    var i,node;
    for(i=0;i<emptyCounters.length;i++)setText(byId(emptyCounters[i]),'—');
    setText(byId('workspaceHeiTotal'),'—');
    setText(byId('workspaceHeiGrade'),'нет расчёта');
    setText(byId('workspaceHeiConclusion'),'Добавьте продукты, чтобы рассчитать HEI.');
    node=byId('workspaceHeiTotalBar');
    if(node&&node.style.width!=='0%')node.style.width='0%';
    node=byId('workspaceNutrientQuality');
    if(node&&node.textContent&&!/нет рациона/i.test(node.textContent)){
      node.innerHTML='<strong>Достоверность данных: нет рациона</strong><span>Оценка появится после добавления продуктов.</span>';
    }
    node=byId('workspaceHeiQuality');
    if(node&&node.textContent&&!/нет расч[её]та/i.test(node.textContent)){
      node.innerHTML='<strong>Достоверность HEI: нет расчёта</strong><span>Оценка достоверности появится после добавления продуктов.</span>';
    }
  }

  function normalizePublicReportModel(model){
    if(!model||!model.ration||Number(model.ration.count)>0)return model;
    var copy=null;
    try{copy=JSON.parse(JSON.stringify(model));}catch(_){return model;}
    if(copy.hei){
      copy.hei.available=false;
      copy.hei.total=null;
      copy.hei.grade='';
    }
    return copy;
  }

  function patchReportApi(){
    var api=null;
    try{api=w.WorkspaceReportHF13||null;}catch(_){api=null;}
    if(!api||api.__emptySemanticPatch)return;
    var getLast=typeof api.getLastModel==='function'?api.getLastModel:null;
    var build=typeof api.buildReportModel==='function'?api.buildReportModel:null;
    if(getLast)api.getLastModel=function(){return normalizePublicReportModel(getLast.apply(api,arguments));};
    if(build)api.buildReportModel=function(){return normalizePublicReportModel(build.apply(api,arguments));};
    try{api.__emptySemanticPatch='v6-ui-audit-2026-09-25';}catch(_){}
  }

  function replaceEmptyReportSection(section,title,body){
    if(!section)return;
    var current=section.querySelector('[data-ui-empty-report="'+title+'"]');
    if(current)return;
    var head=section.querySelector('.workspace-report-section__head');
    var children=section.children,i;
    for(i=children.length-1;i>=0;i--){
      if(head&&children[i]===head)continue;
      section.removeChild(children[i]);
    }
    var empty=d.createElement('div');
    empty.className='workspace-report-empty';
    empty.setAttribute('data-ui-empty-report',title);
    empty.innerHTML=body;
    section.appendChild(empty);
  }

  function syncEmptyReportSemantics(){
    if(d.documentElement.getAttribute('data-ivory-ration')!=='empty')return;
    var preview=byId('workspaceReportPreview');
    if(!preview||!preview.querySelector('.workspace-report-document'))return;

    var cover=preview.querySelector('.workspace-report-cover'),nodes,i,label,strong;
    if(cover){
      var intro=cover.querySelector('p');
      if(intro)setText(intro,'Рацион пока пуст. Расчётные выводы появятся после добавления продуктов.');
      nodes=cover.querySelectorAll('.workspace-report-kv');
      for(i=0;i<nodes.length;i++){
        label=nodes[i].querySelector('span');
        strong=nodes[i].querySelector('strong');
        if(!label||!strong)continue;
        if(label.textContent==='Энергия')setText(strong,'—');
        else if(label.textContent==='HEI')setText(strong,'не рассчитан');
      }
    }

    var sections=preview.querySelectorAll('.workspace-report-section'),heading,title;
    for(i=0;i<sections.length;i++){
      heading=sections[i].querySelector('.workspace-report-section__head h3');
      title=heading?String(heading.textContent||'').replace(/^\s+|\s+$/g,''):'';
      if(title==='Краткий итог'){
        replaceEmptyReportSection(sections[i],title,'<strong>Рацион пока пуст</strong><p>Добавьте продукты — после этого отчёт сформирует выводы, сильные стороны и приоритеты.</p>');
      }else if(title==='Энергия и основные показатели'){
        replaceEmptyReportSection(sections[i],title,'<strong>Нет данных о рационе</strong><p>Энергия и основные показатели появятся после добавления продуктов.</p>');
      }else if(title==='Нутриенты и ориентиры'){
        replaceEmptyReportSection(sections[i],title,'<strong>Нет данных для анализа нутриентов</strong><p>Подробные значения и статусы появятся после добавления продуктов.</p>');
      }else if(title==='HEI-2020'){
        replaceEmptyReportSection(sections[i],title,'<strong>HEI пока не рассчитан</strong><p>Индекс появится после добавления продуктов в рацион.</p>');
      }
    }
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
    var settings=closest(event.target,'#interfaceSettingsPass1');
    if(settings){
      event.preventDefault();
      var header=settingsHeader();
      setSettingsOpen(!(header&&header.classList.contains('interface-settings-pass1-open')));
      return;
    }
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
    ensureSettingsControl();
    syncSettingsVisibility();
    simplifyEntryMethods();
    simplifyPersonContext();
    syncEmptyAnalysisSemantics();
    patchReportApi();
    syncEmptyReportSemantics();
  }
  function schedule(){
    w.clearTimeout(timer);
    timer=w.setTimeout(refresh,60);
  }

  function init(){
    d.addEventListener('click',handleClick,false);
    w.addEventListener('resize',schedule,false);
    ['app:ready','navigation-shell:ready','navigation-shell:route-changed','navigation-shell:mode-changed','workspace-entry-ux:ready','workspace-report:ready','needs:computed','ration:changed'].forEach(function(name){
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
