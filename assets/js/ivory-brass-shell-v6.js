/* v6 Ivory & Brass responsive presentation shell.
 * Desktop: spatial workspace. Mobile: sequential route model.
 * Does not move forms or own calculation state.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta6-design-refinement';
  var initialized=false,renderTimer=0;
  function byId(id){return d.getElementById(id);}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmt(v,digits){var n=Number(v);if(!isFinite(n))return '—';return n.toLocaleString('ru-RU',{maximumFractionDigits:digits==null?0:digits});}
  function plural(n,a,b,c){n=Math.abs(n)%100;var n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c;}
  function svgIcon(kind){
    var p={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',camera:'<path d="M4 7h4l1.5-2h5L16 7h4v12H4z"/><circle cx="12" cy="13" r="3.5"/>',voice:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/>',audio:'<path d="M6 3h8l4 4v14H6zM14 3v5h5"/><path d="M9 15c1.2-2 4.8-2 6 0"/>',report:'<path d="M6 3h9l3 3v15H6zM9 11h6M9 15h6M9 7h3"/>',plus:'<path d="M12 5v14M5 12h14"/>',spark:'<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>',plate:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>'};
    return '<svg aria-hidden="true" viewBox="0 0 24 24">'+(p[kind]||p.spark)+'</svg>';
  }
  function brushSvg(){return '<svg class="ivory-hero-art" viewBox="0 0 620 330" aria-hidden="true"><defs><linearGradient id="ibGold" x1="0" x2="1"><stop stop-color="#d7b66f" stop-opacity=".14"/><stop offset="1" stop-color="#9a6b20" stop-opacity=".72"/></linearGradient><filter id="ibBlur"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g fill="none"><circle cx="355" cy="165" r="112" stroke="#b18a43" stroke-opacity=".34"/><circle cx="355" cy="165" r="145" stroke="#d2b06c" stroke-opacity=".18"/><path d="M95 230C210 112 330 265 530 74" stroke="#303823" stroke-width="42" stroke-linecap="round" opacity=".88"/><path d="M80 205C220 84 345 235 545 58" stroke="url(#ibGold)" stroke-width="28" stroke-linecap="round" opacity=".8"/><path d="M135 260C260 140 410 242 550 120" stroke="#d5c4a5" stroke-width="22" stroke-linecap="round" opacity=".46"/><path d="M125 196C250 140 345 220 510 104" stroke="#fffdf8" stroke-width="12" stroke-linecap="round" opacity=".62" filter="url(#ibBlur)"/></g></svg>';}
  function enhanceBrand(){
    var brand=d.querySelector('#navigationShell .navigation-shell__brand');if(!brand||brand.getAttribute('data-v6-brand')==='1')return;
    brand.setAttribute('data-v6-brand','1');brand.innerHTML='<div class="ivory-brand-mark" aria-hidden="true"><span>С</span><b>В</b></div><div class="ivory-brand-copy"><strong>Калькулятор рациона</strong><span>Сергея Веснина</span></div>';
    var nav=byId('navigationShell'),secondary=nav&&nav.querySelector('.navigation-shell__secondary');
    if(secondary&&!byId('ivoryNavTheme')){
      var panel=d.createElement('section');panel.id='ivoryNavTheme';panel.className='ivory-nav-theme';panel.setAttribute('aria-label','Оформление');
      panel.innerHTML='<span>Оформление</span><div role="group" aria-label="Выбор темы"><button type="button" data-theme-value="modern" aria-pressed="false">Modern</button><button type="button" data-theme-value="retro-2bit" aria-pressed="false">2-bit</button><button type="button" data-theme-value="ivory-brass" aria-pressed="false">Ivory</button></div>';
      nav.insertBefore(panel,secondary);
    }
  }
  function createHero(){
    var context=byId('navigationShellContext');if(!context||byId('ivoryRationHero'))return;
    var hero=d.createElement('section');hero.id='ivoryRationHero';hero.className='ivory-ration-hero';hero.setAttribute('aria-labelledby','ivoryHeroTitle');
    hero.innerHTML='<div class="ivory-ration-hero__copy"><span>Точный расчёт · понятные решения</span><h1 id="ivoryHeroTitle">Наука о питании.<br><em>Искусство баланса.</em></h1><p>Собирайте рацион, наблюдайте изменения и переходите от выявленного отклонения к осмысленной коррекции.</p><button id="ivoryHeroPrimary" type="button" data-ivory-action="profile">'+svgIcon('plus')+'<span>Сначала рассчитать потребности</span></button></div><div class="ivory-ration-hero__art">'+brushSvg()+'</div>';
    context.insertBefore(hero,context.firstChild);
  }
  function createRail(){
    var main=byId('mainContent');if(!main||byId('ivoryInsightRail'))return;
    var rail=d.createElement('aside');rail.id='ivoryInsightRail';rail.className='ivory-insight-rail';rail.setAttribute('aria-label','Краткая аналитика рациона');
    rail.innerHTML=''+
      '<section class="ivory-rail-card ivory-nutrient-orbit" aria-labelledby="ivoryNutrientGroupTitle"><div class="ivory-card-head"><div><span>Нутриенты</span><h2 id="ivoryNutrientGroupTitle">Обзор по группам</h2></div><button type="button" data-ivory-route="analysis/nutrients" data-ivory-target="workspaceNutrientsPanel">Полная таблица</button></div><p class="ivory-group-overview-copy">Показывает, где сосредоточены показатели, требующие внимания. Это навигационный обзор, а не новая итоговая оценка рациона.</p><div id="ivoryGroupEmptyState" class="ivory-group-empty-state" hidden><strong>Обзор появится после расчёта</strong><span>Заполните профиль и добавьте продукты — затем здесь будет видно, в каких группах сосредоточены отклонения.</span><button type="button" data-ivory-action="profile">Перейти к профилю</button></div><div id="ivoryRadialChart"></div><div class="ivory-chart-legend" aria-label="Условные обозначения"><span class="is-target">Целевой диапазон</span><span class="is-below">Ниже ориентира</span><span class="is-review">Требует проверки</span><span class="is-above">Выше предела</span><span class="is-unknown">Не оценивается</span></div><div id="ivoryNutrientGroupList" class="ivory-nutrient-group-list"></div></section>'+
      '<section class="ivory-rail-card ivory-priority-card"><div class="ivory-card-head"><div><span>Приоритеты</span><h2>На что обратить внимание</h2></div><button type="button" data-ivory-route="analysis" data-ivory-target="workspaceAnalysisOverview">Подробнее</button></div><div id="ivoryIssueList" class="ivory-issue-list"></div></section>'+
      '<section class="ivory-rail-card ivory-plate-summary"><div class="ivory-card-head"><div><span>Структура</span><h2>Гарвардская тарелка</h2></div><button type="button" data-ivory-route="analysis" data-ivory-target="strictHarvardPlateDetails">Открыть</button></div><div class="ivory-plate-graphic" aria-hidden="true"><i></i><b></b><em></em><span></span></div><p id="ivoryPlateText">Структурная оценка появится после добавления продуктов.</p></section>';
    main.appendChild(rail);
  }
  function createMobileSummary(){
    var context=byId('navigationShellContext');if(!context||byId('ivoryMobileSummary'))return;
    var box=d.createElement('section');box.id='ivoryMobileSummary';box.className='ivory-mobile-summary';box.setAttribute('aria-label','Краткие итоги рациона');
    box.innerHTML='<div class="ivory-mobile-summary__top"><div><span>Текущий рацион</span><strong id="ivoryMobileRation">Рацион пока пуст</strong></div><button type="button" data-ivory-route="analysis" data-ivory-target="workspaceAnalysisOverview">Анализ</button></div><div id="ivoryMobileMetrics" class="ivory-mobile-summary__metrics"></div><div id="ivoryMobileHint" class="ivory-mobile-summary__hint">Добавьте первый продукт.</div>';
    context.appendChild(box);
  }
  function createMobileGroupOverview(){
    var context=byId('navigationShellContext');if(!context||byId('ivoryMobileGroupOverview'))return;
    var box=d.createElement('section');box.id='ivoryMobileGroupOverview';box.className='ivory-mobile-group-overview';box.setAttribute('aria-labelledby','ivoryMobileGroupTitle');
    box.innerHTML='<div class="ivory-mobile-group-overview__head"><div><span>Нутриенты</span><h2 id="ivoryMobileGroupTitle">Обзор по группам</h2></div><button type="button" data-ivory-route="analysis/nutrients" data-ivory-target="workspaceNutrientsPanel">Полная таблица</button></div><p>Кратко показывает распределение статусов из сводной таблицы. Нажмите группу, чтобы открыть её показатели.</p><div id="ivoryMobileNutrientGroupList" class="ivory-nutrient-group-list is-mobile"></div>';
    context.appendChild(box);
  }
  function createDock(){
    if(byId('ivoryQuickDock'))return;var dock=d.createElement('nav');dock.id='ivoryQuickDock';dock.className='ivory-quick-dock';dock.setAttribute('aria-label','Быстрые действия');
    dock.innerHTML='<button type="button" data-ivory-action="search">'+svgIcon('search')+'<span>Поиск</span></button><button type="button" data-ivory-action="photo">'+svgIcon('camera')+'<span>Фото</span></button><button class="ivory-quick-dock__main" type="button" data-ivory-action="search" aria-label="Добавить продукт">'+svgIcon('plus')+'</button><button type="button" data-ivory-action="voice">'+svgIcon('voice')+'<span>Голос</span></button><button type="button" data-ivory-route="report">'+svgIcon('report')+'<span>Отчёт</span></button>';
    var context=byId('navigationShellContext');(context||d.body).appendChild(dock);
  }
  function createScoreStrip(){
    var context=byId('navigationShellContext');if(!context||byId('ivoryMetricStrip'))return;
    var strip=d.createElement('section');strip.id='ivoryMetricStrip';strip.className='ivory-metric-strip';strip.setAttribute('aria-label','Основные показатели рациона');
    strip.innerHTML='<div id="ivoryMetricCards" class="ivory-metric-strip__cards"></div><div id="ivoryScoreRing" class="ivory-metric-strip__score"></div>';
    context.appendChild(strip);
  }
  function create(){enhanceBrand();createHero();createScoreStrip();createMobileSummary();createMobileGroupOverview();createRail();createDock();}
  function metricHtml(m){var target=isFinite(Number(m.target))?'из '+fmt(m.target,m.unit==='ккал'||m.unit==='мл'?0:1)+' '+m.unit:'ориентир не задан';return '<article data-status="'+esc(m.status)+'"><span>'+esc(m.label)+'</span><strong>'+fmt(m.value,m.unit==='ккал'||m.unit==='мл'?0:1)+' <small>'+esc(m.unit)+'</small></strong><em>'+esc(target)+'</em>'+(w.IvoryBrassCharts?w.IvoryBrassCharts.progress(m.percent,m.status):'')+'<b>'+(m.percent==null?'—':m.percent+'%')+'</b></article>';}
  function groupSentence(g){
    if(!g||!g.total)return 'Расчёт пока недоступен';
    var parts=[];
    if(g.target)parts.push('Целевой диапазон — '+g.target);
    if(g.below)parts.push('Ниже ориентира — '+g.below);
    if(g.review)parts.push('Требуют проверки — '+g.review);
    if(g.above)parts.push('Выше предела — '+g.above);
    if(g.unknown)parts.push('Не оцениваются — '+g.unknown);
    return parts.join(' · ')||'Нет оценённых показателей';
  }
  function renderGroupList(hostId,groups){
    var host=byId(hostId);if(!host)return;
    groups=Array.isArray(groups)?groups:[];
    if(!groups.length){host.innerHTML='<div class="ivory-group-empty"><strong>Обзор появится после расчёта</strong><span>Сначала заполните профиль и добавьте продукты.</span></div>';return;}
    host.innerHTML=groups.map(function(g){
      var targetText=g.evaluated?('Целевой диапазон: '+g.target+' из '+g.evaluated):'Нет оценённых показателей';
      var bar=w.IvoryBrassCharts&&w.IvoryBrassCharts.stackedBar?w.IvoryBrassCharts.stackedBar(g):'';
      return '<button type="button" class="ivory-nutrient-group-row" data-ivory-nutrient-group="'+esc(g.key)+'" aria-label="'+esc(g.label+'. '+groupSentence(g)+'. Открыть группу в полной сводной таблице.')+'"><span class="ivory-nutrient-group-row__top"><strong>'+esc(g.label)+'</strong><b>'+esc(targetText)+'</b></span>'+bar+'<span class="ivory-nutrient-group-row__counts">'+esc(groupSentence(g))+'</span></button>';
    }).join('');
  }
  function renderNutrientGroupOverview(model){
    var groups=model&&model.analysis&&model.analysis.nutrientGroups||[];
    var evaluated=groups.reduce(function(sum,g){return sum+Number(g&&g.evaluated||0);},0);
    var ready=evaluated>0;
    var rail=byId('ivoryInsightRail'),empty=byId('ivoryGroupEmptyState');
    if(rail)rail.setAttribute('data-ivory-group-state',ready?'ready':'empty');
    if(empty){empty.hidden=ready;var b=empty.querySelector('button');if(b){var current=d.documentElement.getAttribute('data-profile-calculation-state')==='current';b.setAttribute('data-ivory-action',current?'search':'profile');b.textContent=current?'Добавить продукты':'Перейти к профилю';}}
    var radial=byId('ivoryRadialChart');if(radial&&w.IvoryBrassCharts)radial.innerHTML=ready?w.IvoryBrassCharts.radial(groups,'Обзор нутриентов по группам'):'';
    renderGroupList('ivoryNutrientGroupList',ready?groups:[]);
    renderGroupList('ivoryMobileNutrientGroupList',ready?groups:[]);
  }
  function renderIssues(model){
    var host=byId('ivoryIssueList');if(!host)return;var rows=model.analysis.issues||[];
    if(model.ration.empty){var current=d.documentElement.getAttribute('data-profile-calculation-state')==='current';host.innerHTML=current?'<div class="ivory-empty"><strong>Рацион пока пуст</strong><p>Добавьте первый продукт — краткий анализ появится автоматически.</p><button type="button" data-ivory-action="search">Добавить продукт</button></div>':'<div class="ivory-empty"><strong>Начните с профиля</strong><p>Пять основных данных нужны, чтобы сравнивать рацион с персональными ориентирами.</p><button type="button" data-ivory-action="profile">Рассчитать потребности</button></div>';return;}
    if(!rows.length){host.innerHTML='<article class="is-ok"><i></i><div><strong>Выраженных отклонений не найдено</strong><p>Для полной проверки откройте подробный анализ.</p></div></article>';return;}
    host.innerHTML=rows.slice(0,5).map(function(x){return '<article class="is-'+esc(x.kind)+'"><i></i><div><strong>'+esc(x.title)+'</strong><p>'+esc(x.body)+'</p></div></article>';}).join('');
  }
  function syncHero(){
    var button=byId('ivoryHeroPrimary');if(!button)return;
    var current=d.documentElement.getAttribute('data-profile-calculation-state')==='current';
    button.setAttribute('data-ivory-action',current?'search':'profile');
    var label=button.querySelector('span');if(label)label.textContent=current?'Добавить продукт или блюдо':'Сначала рассчитать потребности';
  }
  function render(model){
    if(!model)return;syncHero();var cards=byId('ivoryMetricCards');if(cards)cards.innerHTML=model.metrics.map(metricHtml).join('');
    var ring=byId('ivoryScoreRing');if(ring)ring.innerHTML=(w.IvoryBrassCharts?w.IvoryBrassCharts.score(model.analysis.score):'<strong>'+fmt(model.analysis.score,1)+'</strong>')+'<span>Общая оценка</span>';
    renderNutrientGroupOverview(model);
    renderIssues(model);
    var plate=byId('ivoryPlateText');if(plate)plate.textContent=isFinite(Number(model.analysis.structure))?'Структурная оценка: '+fmt(model.analysis.structure,0)+' из 100. Откройте подробности, чтобы увидеть вклад групп продуктов.':'Структурная оценка появится после полного расчёта.';
    var mr=byId('ivoryMobileRation');if(mr)mr.textContent=model.ration.empty?'Рацион пока пуст':model.ration.count+' '+plural(model.ration.count,'позиция','позиции','позиций')+' · '+fmt(model.ration.kcal,0)+' ккал';
    var mm=byId('ivoryMobileMetrics');if(mm)mm.innerHTML=model.metrics.slice(0,4).map(function(m){return '<span><b>'+esc(m.label)+'</b><strong>'+fmt(m.value,m.unit==='ккал'?0:1)+' '+esc(m.unit)+'</strong></span>';}).join('');
    var hint=byId('ivoryMobileHint');if(hint)hint.textContent=model.ration.empty?'Добавьте продукт поиском, фотографией или голосом.':(model.analysis.issues[0]?model.analysis.issues[0].title:'Краткий анализ обновлён.');
    d.documentElement.setAttribute('data-ivory-ration',model.ration.empty?'empty':'filled');
  }
  function schedule(){w.clearTimeout(renderTimer);renderTimer=w.setTimeout(function(){if(w.NutritionUIViewModel)render(w.NutritionUIViewModel.refresh());},60);}
  function navigate(route,target){if(w.NavigationShellV1&&typeof w.NavigationShellV1.navigate==='function')w.NavigationShellV1.navigate(route,target||'');}
  function runAction(kind){
    if(kind==='profile'){navigate('profile','needs_sex');w.setTimeout(function(){var el=byId('needs_sex');if(el){try{el.focus({preventScroll:true});}catch(_){el.focus();}}},100);return;}
    if(kind==='search'){navigate('ration','globalSearchSection');w.setTimeout(function(){var input=byId('globalSearchInput');if(input){try{input.focus({preventScroll:true});}catch(_){input.focus();}}},100);return;}
    var button=d.querySelector('[data-ration-entry-method="'+kind+'"]');if(button){button.click();return;}
    navigate('ration','globalSearchSection');
  }
  function openNutrientGroup(group){
    group=String(group||'');
    var allowed={basic:1,vitamins:1,minerals:1,limits:1};
    navigate('analysis/nutrients','workspaceNutrientsPanel');
    w.setTimeout(function(){
      var all=d.querySelector('[data-nutrient-filter="all"]');if(all)all.click();
      var selector=allowed[group]?'[data-nutrient-group="'+group+'"]':'[data-nutrient-group="all"]';
      var button=d.querySelector(selector);if(button)button.click();
      w.setTimeout(function(){
        var panel=byId('workspaceNutrientsPanel');
        var heading=panel&&panel.querySelector('h2,h3,[tabindex="-1"]');
        if(heading){if(!heading.hasAttribute('tabindex'))heading.setAttribute('tabindex','-1');try{heading.focus({preventScroll:true});}catch(_){heading.focus();}}
      },80);
    },140);
  }
  function bind(){
    d.addEventListener('click',function(e){
      var group=e.target&&e.target.closest?e.target.closest('[data-ivory-nutrient-group]'):null;if(group){e.preventDefault();openNutrientGroup(group.getAttribute('data-ivory-nutrient-group'));return;}
      var action=e.target&&e.target.closest?e.target.closest('[data-ivory-action]'):null;if(action){e.preventDefault();runAction(action.getAttribute('data-ivory-action'));return;}
      var route=e.target&&e.target.closest?e.target.closest('[data-ivory-route]'):null;if(route){e.preventDefault();navigate(route.getAttribute('data-ivory-route'),route.getAttribute('data-ivory-target')||'');}
    },false);
    d.addEventListener('keydown',function(e){var group=e.target&&e.target.closest?e.target.closest('svg [data-ivory-nutrient-group]'):null;if(!group||!(e.key==='Enter'||e.key===' '))return;e.preventDefault();openNutrientGroup(group.getAttribute('data-ivory-nutrient-group'));},false);
    w.addEventListener('nutrition-ui:view-model',function(e){render(e.detail);},false);
    ['navigation-shell:ready','workspace-entry-ux:ready','analysis-workspace:ready','nutrition:themechange','workspace-layout:changed','app:ready','profile:persistence-ready','needs:computed','needs:invalidated'].forEach(function(n){w.addEventListener(n,function(){create();schedule();},false);});
  }
  function init(){if(initialized)return;initialized=true;create();bind();schedule();w.IvoryBrassShell={version:VERSION,refresh:schedule,openNutrientGroup:openNutrientGroup};try{w.dispatchEvent(new CustomEvent('ivory-brass:ready',{detail:{version:VERSION}}));}catch(_){}}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
