// nutrition calculator v5.3.132 — explicit regional micronutrient profile selector and comparison
(function(){
  'use strict';
  var VERSION='v5.3.210-p1.2_norm_registry';
  var PROFILE={
    us:{label:'США',short:'DRI',aria:'США, система DRI'},
    eu:{label:'ЕС',short:'EFSA',aria:'ЕС, референсные значения EFSA'}
  };
  var REFERENCE_KEYS=[
    'vitamin_c_mg','vitamin_a_mcg','vitamin_d_mcg','vitamin_e_mg','vitamin_k_mcg',
    'vitamin_b1_mg','vitamin_b2_mg','vitamin_b3_mg','vitamin_b6_mg','vitamin_b9_mcg','vitamin_b12_mcg',
    'calcium_mg','iron_mg','magnesium_mg','zinc_mg','potassium_mg','phosphorus_mg','iodine_mcg',
    'selenium_mcg','copper_mg','manganese_mg','choline_mg'
  ];
  var SAFETY_KEYS=[
    'vitamin_c_mg','vitamin_e_mg','vitamin_b3_mg','vitamin_b6_mg','calcium_mg','iron_mg',
    'magnesium_mg','zinc_mg','phosphorus_mg','iodine_mcg','selenium_mcg','copper_mg','manganese_mg','choline_mg'
  ];
  var META={
    vitamin_c_mg:['Витамин C','мг',''],
    vitamin_a_mcg:['Витамин A','мкг РЭ','UL относится к ретинолу, а не к пищевому β-каротину.'],
    vitamin_d_mcg:['Витамин D','мкг','Число совпадает, однако в США это RDA, а в ЕС — AI.'],
    vitamin_e_mg:['Витамин E','мг',''],
    vitamin_k_mcg:['Витамин K','мкг',''],
    vitamin_b1_mg:['Витамин B1','мг','Ориентир EFSA рассчитывается как 0,1 мг/МДж по выбранной энергетической цели.'],
    vitamin_b2_mg:['Витамин B2','мг',''],
    vitamin_b3_mg:['Витамин B3, ниацин','мг NE','Ориентир EFSA рассчитывается как 1,6 мг NE/МДж; верхний уровень зависит от формы ниацина.'],
    vitamin_b6_mg:['Витамин B6','мг',''],
    vitamin_b9_mcg:['Фолат, B9','мкг DFE','UL относится к фолиевой кислоте из добавок и обогащения.'],
    vitamin_b12_mcg:['Витамин B12','мкг',''],
    calcium_mg:['Кальций','мг','В США и ЕС используются разные возрастные переходы.'],
    iron_mg:['Железо','мг','Для женщин значение меняется после 50 лет; в ЕС 40 мг — безопасный уровень, а не UL.'],
    magnesium_mg:['Магний','мг','Верхние уровни относятся только к добавкам, а не к магнию обычной пищи.'],
    zinc_mg:['Цинк','мг','EFSA связывает PRI с содержанием фитата; калькулятор использует низкофитатный вариант.'],
    potassium_mg:['Калий','мг',''],
    phosphorus_mg:['Фосфор','мг',''],
    iodine_mcg:['Йод','мкг','Число достаточности совпадает, однако тип показателя и UL различаются.'],
    selenium_mcg:['Селен','мкг',''],
    copper_mg:['Медь','мг',''],
    manganese_mg:['Марганец','мг','В ЕС 8 мг — безопасный уровень, а не UL.'],
    choline_mg:['Холин','мг','']
  };
  function byId(id){return document.getElementById(id);}
  function currentRegion(){
    try{if(window.State&&typeof window.State.getRegion==='function')return window.State.getRegion()==='eu'?'eu':'us';}catch(_){}
    var active=document.querySelector('#regionSeg button[aria-pressed="true"],#regionSeg button.active');
    return active&&active.dataset.region==='eu'?'eu':'us';
  }
  function sync(){
    var seg=byId('regionSeg'),status=byId('normRegionStatus');if(!seg||!status)return;
    var region=currentRegion(),p=PROFILE[region];seg.dataset.activeRegion=region;
    seg.querySelectorAll('button[data-region]').forEach(function(btn){
      var active=btn.dataset.region===region;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
      var bp=PROFILE[btn.dataset.region]||PROFILE.us;btn.setAttribute('aria-label',(active?'Применяются: ':'Выбрать: ')+bp.aria);
    });
    status.innerHTML='<span>Применяются нормы:</span> <strong>'+p.label+'</strong> <small>'+p.short+'</small>';
    status.dataset.region=region;
    var switcher=byId('normRegionSwitcher');if(switcher)switcher.setAttribute('aria-label','Сейчас применяются нормы микронутриентов: '+p.aria);
    document.documentElement.dataset.normRegion=region;
  }
  function profileInput(){
    var ageEl=byId('needs_age'),sexEl=byId('needs_sex');
    var age=ageEl&&ageEl.value!==''?Number(ageEl.value):NaN;
    var raw=String(sexEl?sexEl.value:'male').toLowerCase();
    var sex=(raw.indexOf('female')>=0||raw.indexOf('жен')>=0||raw==='ж')?'female':'male';
    var child=Number.isFinite(age)&&age<18;
    return {age:child?30:(Number.isFinite(age)?age:30),shownAge:age,sex:sex,child:child};
  }
  function num(value){
    if(!Number.isFinite(Number(value)))return '—';
    return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(value));
  }
  function formatMin(res,unit){
    if(!res||!res.min)return 'не задан';
    if(Number.isFinite(Number(res.min.value)))return num(res.min.value)+' '+unit+' · '+String(res.min.type||'ориентир');
    if(res.min.formula_label)return String(res.min.formula_label)+' · '+String(res.min.type||'формула')+' · требуется энергетическая цель';
    return 'не задан';
  }
  function scopeRu(scope){
    var map={
      total:'из пищи и добавок',retinol_only:'только ретинол',supplemental_synthetic:'синтетические формы из добавок и обогащения',
      nicotinic_acid_only:'только никотиновая кислота',synthetic_only:'фолиевая кислота из добавок и фортификации',
      supplements_only:'только добавки'
    };return map[scope]||scope||'';
  }
  function formatSafety(res,unit){
    if(res&&res.ul&&Number.isFinite(Number(res.ul.value)))return num(res.ul.value)+' '+unit+' · UL'+(res.ul.scope?' · '+scopeRu(res.ul.scope):'');
    if(res&&res.safe&&Number.isFinite(Number(res.safe.value)))return num(res.safe.value)+' '+unit+' · '+(res.safe.label||'безопасный уровень')+(res.safe.scope?' · '+scopeRu(res.safe.scope):'');
    return 'не установлен';
  }
  function rowHtml(key,usText,euText){
    var m=META[key]||[key,'',''];
    var note=m[2]?'<small>'+m[2]+'</small>':'';
    return '<tr><td>'+m[0]+note+'</td><td data-different="'+String(usText!==euText)+'">'+usText+'</td><td data-different="'+String(usText!==euText)+'">'+euText+'</td></tr>';
  }
  function renderComparison(){
    var resolver=window.__resolveMicroLimitsForQA;
    var refBody=byId('normReferenceComparisonBody'),safeBody=byId('normSafetyComparisonBody');
    if(typeof resolver!=='function'||!refBody||!safeBody)return false;
    var p=profileInput(),sexRu=p.sex==='female'?'женщина':'мужчина';
    var profile=byId('normComparisonProfile'),note=byId('normComparisonProfileNote');
    if(profile)profile.textContent=p.child?'Взрослый пример для '+sexRu:sexRu+', '+(Number.isFinite(p.shownAge)?Math.round(p.shownAge)+' лет':'19–50 лет');
    if(note){
      note.textContent=p.child
        ?'Введён детский возраст: переключатель США/ЕС на детские нормы не действует. Для наглядного сравнения ниже показан взрослый профиль того же пола.'
        :'Таблица пересчитана по полу и возрасту, введённым в калькуляторе потребностей.';
    }
    var reg=window.NutritionNormativeRegistry,regStatus=byId('normRegistryStatus');
    if(regStatus){
      var audit=reg&&typeof reg.audit==='function'?reg.audit():null;
      regStatus.textContent=audit&&audit.ok
        ?'Нормативный реестр '+String(reg.version)+' · проверен '+String(reg.reviewedAt)+' · источников: '+String(audit.sourceCount)
        :'Нормативный реестр не загружен: числовые ориентиры должны считаться недоступными.';
      regStatus.dataset.status=audit&&audit.ok?'ok':'error';
    }
    var refs=[];
    REFERENCE_KEYS.forEach(function(key){
      var m=META[key]||[key,'',''],us=resolver(key,'us',p.age,p.sex),eu=resolver(key,'eu',p.age,p.sex);
      var ut=formatMin(us,m[1]),et=formatMin(eu,m[1]);
      if(ut!==et)refs.push(rowHtml(key,ut,et));
    });
    refBody.innerHTML=refs.length?refs.join(''):'<tr><td colspan="3">Для выбранного профиля различий не найдено.</td></tr>';
    var safes=[];
    SAFETY_KEYS.forEach(function(key){
      var m=META[key]||[key,'',''],us=resolver(key,'us',p.age,p.sex),eu=resolver(key,'eu',p.age,p.sex);
      var ut=formatSafety(us,m[1]),et=formatSafety(eu,m[1]);
      if(ut!==et)safes.push(rowHtml(key,ut,et));
    });
    safeBody.innerHTML=safes.length?safes.join(''):'<tr><td colspan="3">Для выбранного профиля различий не найдено.</td></tr>';
    return true;
  }
  function openHelp(){
    renderComparison();var d=byId('normRegionHelp');if(!d)return;
    try{if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}catch(_){d.setAttribute('open','');}
  }
  function closeHelp(){var d=byId('normRegionHelp');if(!d)return;try{if(typeof d.close==='function')d.close();else d.removeAttribute('open');}catch(_){d.removeAttribute('open');}}
  function wrapState(){
    if(!window.State||typeof window.State.setRegion!=='function'||window.State.__normRegionClarityWrapped)return false;
    var original=window.State.setRegion.bind(window.State);
    window.State.setRegion=function(region){var out=original(region);sync();renderComparison();try{window.dispatchEvent(new CustomEvent('norm:region-changed',{detail:{region:currentRegion(),version:VERSION}}));}catch(_){}return out;};
    window.State.__normRegionClarityWrapped=true;return true;
  }
  function init(){
    sync();wrapState();renderComparison();
    var help=byId('normRegionHelpBtn');if(help&&!help.__normHelpBound){help.__normHelpBound=true;help.addEventListener('click',openHelp);}
    document.querySelectorAll('.norm-region-help-close').forEach(function(btn){if(btn.__normHelpBound)return;btn.__normHelpBound=true;btn.addEventListener('click',closeHelp);});
    var dialog=byId('normRegionHelp');if(dialog&&!dialog.__normBackdropBound){dialog.__normBackdropBound=true;dialog.addEventListener('click',function(e){if(e.target!==dialog)return;var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeHelp();});}
    document.addEventListener('click',function(e){var btn=e.target&&e.target.closest&&e.target.closest('#regionSeg button[data-region]');if(btn)setTimeout(function(){sync();renderComparison();},0);});
    ['needs_age','needs_sex'].forEach(function(id){var el=byId(id);if(el&&!el.__normComparisonBound){el.__normComparisonBound=true;el.addEventListener('input',renderComparison);el.addEventListener('change',renderComparison);}});
    ['app:ready','ration:changed','needs:computed'].forEach(function(ev){window.addEventListener(ev,function(){sync();renderComparison();});});
    var tries=0,timer=setInterval(function(){tries++;var wrapped=wrapState(),rendered=renderComparison();if(wrapped&&rendered){sync();clearInterval(timer);}else if(tries>120)clearInterval(timer);},50);
    window.__NORM_REGION_CLARITY_V53129__={version:VERSION,sync:sync,renderComparison:renderComparison,openHelp:openHelp,closeHelp:closeHelp};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
