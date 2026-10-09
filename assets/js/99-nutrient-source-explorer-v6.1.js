/* Verified source explorer: read-only catalog and NIH ODS references.
 * No additions to the ration and no generated "deficiency prescriptions".
 */
(function(w,d){
  'use strict';
  var VERSION='v6.1-nutrient-source-explorer-20261009', activeKey='',all=[];
  var GUIDES={
    vitamin_a_mcg:{note:'Ретинол и провитаминные каротиноиды поступают из разных продуктов. Учитывайте форму витамина A и единицу измерения, прежде чем сравнивать значения.',url:'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/'},
    vitamin_d_mcg:{note:'Содержание витамина D зависит от вида продукта и обогащения. Для обогащённых продуктов проверяйте конкретную этикетку.',url:'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'},
    vitamin_b12_mcg:{note:'Витамин B12 естественно содержится в продуктах животного происхождения. Для растительных продуктов проверяйте, обогащены ли они витамином.',url:'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/'},
    iron_mg:{note:'Железо из растений обычно поступает в негемовой форме; его усвоение зависит от состава пищи. Указанное количество не равно усвоенному.',url:'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'},
    vitamin_b9_mcg:{note:'Природные фолаты и синтетическая фолиевая кислота имеют разные правила пересчёта. При сравнении источников проверяйте единицы.',url:'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/'},
    calcium_mg:{note:'Содержание кальция и доля, которая усваивается, зависят от продукта. Обогащённые напитки и тофу проверяйте по этикетке.',url:'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'},
    magnesium_mg:{note:'Магний встречается в бобовых, орехах, семенах и цельных злаках. Содержание зависит от обработки и состава продукта.',url:'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'}
  };
  var FIELDS={protein_g:'protein_per_100g',fat_g:'fat_per_100g',carbs_g:'carbs_per_100g',
    fiber_g:'fiber_per_100g',sugars_g:'sugar_per_100g',sfa_g:'sfa',
    sodium_mg:'sodium_mg',selenium_mcg:'selenium_ug',
    added_sugars_g:'added_sugar',salt_g:'salt'};
  var CATEGORIES={vegetables:'Овощи',fruits:'Фрукты',nuts_seeds:'Орехи и семена',grains:'Зерновые',dairy:'Молочные',meat:'Мясные',fish:'Рыба и морепродукты',drinks:'Напитки',oils_fats:'Масла и жиры',other:'Другие'};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function num(v){if(v==null||v==='')return NaN;var n=Number(v);return isFinite(n)?n:NaN;}
  function fmt(v){return Number(v).toLocaleString('ru-RU',{maximumFractionDigits:2});}
  function quality(){return w.ProductDataQualityV13||null;}
  function field(key){var q=quality();return q&&q.fieldName?q.fieldName(key):(FIELDS[key]||key);}
  function known(p,k){
    var name=field(k),v=num(p&&p[name]),q=quality();
    if(!(v>0))return false;
    if(!q||typeof q.methodFor!=='function')return false;
    var m=String(q.methodFor(p,name)||'');
    return ['MEASURED','LABEL','CALCULATED','SOURCE_REPORTED'].indexOf(m)>=0;
  }
  function verified(p){
    var q=quality();
    if(!q||typeof q.classifyProduct!=='function')return false;
    var info=q.classifyProduct(p)||{};
    return info.review_status==='VERIFIED'&&info.tier!=='LOW';
  }
  function candidates(key){
    var db=w.DB,items=db&&db.items||[],out=[],seen={};
    for(var i=0;i<items.length;i++){
      var p=items[i],v,keyName;
      if(!p||p.hidden_from_search===true||!verified(p)||!known(p,key))continue;
      v=num(p[field(key)]);keyName=String(p.key||'');
      if(!keyName||seen[keyName])continue;seen[keyName]=true;
      var name=String(p.name_ru||p.name||'').trim();
      if(!name)continue;
      out.push({key:keyName,name:name,value:v,category:String(p.catalog_category_key||p.category||'other'),method:String(quality().methodFor(p,field(key))||'')});
    }
    out.sort(function(a,b){return b.value-a.value||a.name.localeCompare(b.name,'ru');});
    return out;
  }
  function modal(){
    var node=d.getElementById('arFoodSourcesDialog');
    if(node)return node;
    node=d.createElement('dialog');node.id='arFoodSourcesDialog';node.className='ar-sources-dialog';
    node.setAttribute('aria-labelledby','arSourcesTitle');
    node.innerHTML='<div class="ar-sources-head"><div><span class="ar-kicker">ПРОДУКТЫ И ДАННЫЕ</span><h2 id="arSourcesTitle">Источники нутриента</h2></div><button class="secondary" type="button" data-ar-close aria-label="Закрыть справочник">Закрыть</button></div>'+
      '<div id="arSourcesIntro"></div><label class="ar-sources-label" for="arSourcesSearch">Найти продукт среди проверенных</label>'+
      '<input id="arSourcesSearch" type="search" autocomplete="off" placeholder="Название продукта">'+
      '<div id="arSourcesResults" aria-live="polite"></div>';
    (d.body||d.documentElement).appendChild(node);return node;
  }
  function modelRow(key){
    try{var a=w.NutritionAnalysisWorkspaceHF7;return a&&a.getViewModel&&a.getViewModel().nutrients.filter(function(x){return x.key===key;})[0]||null;}catch(_){return null;}
  }
  function intro(key,row){
    var guide=GUIDES[key],unit=String(row&&row.unit||''),title=String(row&&row.title||key);
    var desc=guide?'<p class="ar-sources-science">'+esc(guide.note)+' <a href="'+guide.url+'" target="_blank" rel="noopener noreferrer">Справочник NIH ODS (англ.)</a></p>':'';
    return '<p>Показаны только карточки каталога со статусом <strong>«Проверено»</strong>, достаточной достоверностью и явным значением нутриента. Порядок — по содержанию на 100 г, а не по пользе для конкретного человека.</p>'+
      '<p class="ar-sources-note">Содержание: '+esc(title)+' ('+esc(unit||'единицы по данным справочника')+') на 100 г продукта. Здесь нет расчёта усвоения, размера привычной порции или клинических ограничений.</p>'+desc;
  }
  function resultHtml(key,filter){
    var row=modelRow(key)||{},unit=String(row.unit||''),needle=String(filter||'').toLocaleLowerCase('ru-RU').trim();
    var arr=all.filter(function(x){return !needle||x.name.toLocaleLowerCase('ru-RU').indexOf(needle)>=0;});
    var visible=arr.slice(0,18);
    if(!all.length)return '<p class="ar-sources-empty">Для этого показателя пока нет карточек, которые одновременно отвечают условиям проверки и содержат подтверждённое числовое значение. Мы не заменяем неизвестные данные предположениями.</p>';
    if(!visible.length)return '<p class="ar-sources-empty">Среди проверенных карточек такого названия нет.</p>';
    return '<p class="ar-sources-count">Проверенных продуктов: '+all.length+'. Показано: '+visible.length+(arr.length>18?' из '+arr.length+' по текущему поиску':'')+'.</p>'+
      '<div class="ar-source-list">'+visible.map(function(x){
        return '<article class="ar-source-item"><div><strong>'+esc(x.name)+'</strong><small>'+esc(CATEGORIES[x.category]||x.category)+' · '+(x.method==='CALCULATED'?'расчётное значение':x.method==='LABEL'?'этикетка':'источник состава')+'</small></div><div class="ar-source-amount"><b>'+fmt(x.value)+' '+esc(unit)+'</b><small>на 100 г</small></div></article>';
      }).join('')+'</div><p class="ar-sources-note">Показаны справочные значения из каталога калькулятора. Для выбора продукта учитывайте фактическую порцию, способ приготовления и достоверность данных.</p>';
  }
  function open(key){
    var row=modelRow(key);if(!row)return;
    activeKey=String(key);all=candidates(activeKey);
    var dlg=modal(),title=d.getElementById('arSourcesTitle'),introHost=d.getElementById('arSourcesIntro'),input=d.getElementById('arSourcesSearch');
    if(title)title.textContent='Где встречается: '+String(row.title||key);
    if(introHost)introHost.innerHTML=intro(key,row);
    if(input)input.value='';
    var results=d.getElementById('arSourcesResults');if(results)results.innerHTML=resultHtml(activeKey,'');
    if(typeof dlg.showModal==='function'){if(!dlg.open)dlg.showModal();}
    else{dlg.setAttribute('open','');dlg.hidden=false;}
    if(input&&input.focus)input.focus();
  }
  function close(){
    var dlg=d.getElementById('arFoodSourcesDialog');if(!dlg)return;
    if(typeof dlg.close==='function'&&dlg.open)dlg.close();else{dlg.removeAttribute('open');dlg.hidden=true;}
  }
  function init(){
    modal();
    d.addEventListener('click',function(e){
      var openButton=e.target&&e.target.closest&&e.target.closest('[data-ar-source-key]'),closeButton=e.target&&e.target.closest&&e.target.closest('[data-ar-close]');
      if(openButton){e.preventDefault();open(openButton.getAttribute('data-ar-source-key'));return;}
      if(closeButton){e.preventDefault();close();}
    },false);
    d.addEventListener('input',function(e){if(e.target&&e.target.id==='arSourcesSearch'){var host=d.getElementById('arSourcesResults');if(host)host.innerHTML=resultHtml(activeKey,e.target.value);}},false);
    w.NutritionNutrientSourceExplorer={version:VERSION,open:open,candidates:candidates,known:known,verified:verified};
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
