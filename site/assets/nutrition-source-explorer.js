/* Каталог пищевых источников: только чтение, расчёт на 100 г без рекомендаций. */
const acceptedMethods=new Set(['MEASURED','LABEL','CALCULATED','SOURCE_REPORTED']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function field(engine,key){return engine.quality.fieldName(key);}
function eligible(engine,p,key){
  const q=engine.quality;
  if(!p||p.hidden_from_search===true||!p.key)return null;
  const info=q.classifyProduct(p);
  if(info.review_status!=='VERIFIED'||info.tier==='LOW')return null;
  const fieldName=field(engine,key),value=p[fieldName],method=q.methodFor(p,fieldName);
  if(!acceptedMethods.has(method)||!finite(value)||value<=0)return null;
  return {key:p.key,name:String(document.documentElement.lang==='en'&&window.VMNutritionEN?window.VMNutritionEN.foodName(p):p.name_ru||p.name||'').trim(),value,method,
    category:String(p.catalog_category_key||p.category||'other')};
}
export function verifiedNutrientSources(engine,key){
  if(!engine?.quality?.fieldName||!engine?.db?.items)return [];
  const seen=new Set(),out=[];
  for(const p of engine.db.items){
    const e=eligible(engine,p,key);
    if(!e||!e.name||seen.has(e.key))continue;
    seen.add(e.key);out.push(e);
  }
  return out.sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'ru'));
}
const methodLabels={MEASURED:'измерение',LABEL:'этикетка',CALCULATED:'расчётное значение',SOURCE_REPORTED:'данные первичного источника'};
const guides={
  vitamin_a_mcg:['Разные формы витамина A требуют правильного пересчёта единиц.','VitaminA'],
  vitamin_d_mcg:['Для обогащённых продуктов важны конкретный состав и этикетка.','VitaminD'],
  vitamin_b12_mcg:['Растительные продукты содержат B12, только если они обогащены им или имеют другой проверенный источник.','VitaminB12'],
  vitamin_b9_mcg:['Природные фолаты и синтетическая фолиевая кислота могут учитываться в разных единицах.','Folate'],
  iron_mg:['Усвоение железа зависит от его формы и состава пищи.','Iron'],
  calcium_mg:['Поступление кальция с пищей не равно количеству, которое усвоится.','Calcium'],
  magnesium_mg:['Содержание магния зависит от вида и обработки продукта.','Magnesium']
};
export function attachNutrientSourceExplorer({root,getEngine,getAnalysis,format,escape}){
  let active='',sources=[],openedFrom=null;
  const dialog=document.createElement('dialog');
  dialog.id='nutVizSourceDialog';dialog.className='nut-viz-dialog';
  dialog.setAttribute('aria-labelledby','nutVizSourceTitle');
  dialog.innerHTML='<div class="nut-viz-dialog-header"><div><span class="nut-viz-eyebrow">ПРОВЕРЕННЫЕ КАРТОЧКИ</span><h2 id="nutVizSourceTitle">Источники нутриента</h2></div>'+
    '<button type="button" class="nut-viz-dialog-close" data-nut-viz-close aria-label="Закрыть справочник">Закрыть</button></div>'+
    '<p class="nut-viz-dialog-note">Значения приведены на 100 г. Это справочник состава, а не предложение изменить рацион или назначение продукта.</p>'+
    '<label class="nut-viz-search-label" for="nutVizSourceSearch">Найти среди проверенных продуктов</label>'+
    '<input id="nutVizSourceSearch" type="search" autocomplete="off" placeholder="Название продукта">'+
    '<p id="nutVizSourceGuide" class="nut-viz-dialog-guide"></p>'+
    '<div id="nutVizSourceResults" aria-live="polite"></div>';
  root.appendChild(dialog);
  const search=dialog.querySelector('#nutVizSourceSearch'),host=dialog.querySelector('#nutVizSourceResults');
  function render(filter=''){
    const needle=String(filter).toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim();
    const found=sources.filter(x=>x.name.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(needle));
    const chosen=found.slice(0,18),engine=getEngine(),unit=engine?.defaults?.[active]?.unit||'';
    if(!sources.length){
      host.innerHTML='<p>Для этого показателя пока нет проверенных карточек с явным положительным числовым значением. Отсутствующие данные мы не заменяем оценками.</p>';return;
    }
    if(!chosen.length){host.innerHTML='<p>В проверенных карточках ничего не найдено. Попробуйте другое название.</p>';return;}
    host.innerHTML='<p class="nut-viz-dialog-count">Найдено: '+found.length+' из '+sources.length+'. Показано: '+chosen.length+'.</p>'+
      '<div class="nut-viz-source-results">'+chosen.map(x=>
        '<article class="nut-viz-source-result"><div><strong>'+escape(x.name)+'</strong><small>'+escape(methodLabels[x.method]||x.method)+'</small></div>'+
        '<div><b>'+format(x.value,2)+' '+escape(unit)+'</b><small>на 100 г</small></div></article>').join('')+'</div>'+
      '<p class="nut-viz-dialog-note">Проверьте реальную порцию и состояние продукта. Высокое содержание вещества на 100 г не означает, что продукт подходит конкретному человеку.</p>';
  }
  function close(){
    if(dialog.open)dialog.close();
    openedFrom?.focus?.({preventScroll:true});
    openedFrom=null;
  }
  function open(key,sourceButton){
    const engine=getEngine(),analysis=getAnalysis();
    if(!engine||!analysis?.hei)return;
    if(!engine.defaults?.[key])return;
    openedFrom=sourceButton;active=key;sources=verifiedNutrientSources(engine,key);
    dialog.querySelector('#nutVizSourceTitle').textContent='Где содержится: '+engine.defaults[key].title;
    const guide=dialog.querySelector('#nutVizSourceGuide'),entry=guides[key];
    guide.innerHTML=entry?escape(entry[0])+' <a href="https://ods.od.nih.gov/factsheets/'+entry[1]+'-HealthProfessional/" target="_blank" rel="noopener noreferrer">NIH ODS · справочник (англ.)</a>':'';
    search.value='';render();
    if(!dialog.open)dialog.showModal();
    search.focus();
  }
  root.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-nut-viz-source]');
    if(trigger){event.preventDefault();open(trigger.dataset.nutVizSource,trigger);return;}
    if(event.target.closest?.('[data-nut-viz-close]')){event.preventDefault();close();}
  });
  dialog.addEventListener('input',event=>{if(event.target===search)render(search.value);});
  dialog.addEventListener('close',()=>{openedFrom?.focus?.({preventScroll:true});openedFrom=null;});
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  return {open,close,verifiedNutrientSources:key=>verifiedNutrientSources(getEngine(),key)};
}
