// Управление видом радиального профиля. Не изменяет рацион, показатели и расчёты.
// Короткая подсказка к одной точке: без новых медицинских порогов.
export function radialHoverCopy(item) {
  if(!item)return null;
  const fmt=(value,digits=1)=>Number(value).toLocaleString('ru-RU',{maximumFractionDigits:digits});
  const pct=item.pct===null?'Сравнение недоступно':fmt(item.pct)+'% от ориентира';
  const amount=Number.isFinite(item.value)&&Number.isFinite(item.ref)&&item.ref>0?
    fmt(item.value,2)+' из '+fmt(item.ref,2)+' '+(item.unit||'').trim():
    Number.isFinite(item.value)?'Поступило: '+fmt(item.value,2)+' '+(item.unit||'').trim():'';
  const note=item.status==='uncertain'?'Предварительный результат: состав некоторых продуктов требует уточнения.':
    item.status==='unknown'?'Недостаточно данных для сравнения.':
    item.status==='upper'?'Выше применимого верхнего уровня (UL) по введённым продуктам.':
    item.status==='below'?'Ниже пищевого ориентира; это не диагноз дефицита.':
    'Пищевой ориентир достигнут; это не клиническая оценка.';
  return {name:item.name,pct,amount,note};
}

export function initRadialProfileControls(root,model) {
  const viewport=root?.querySelector('[data-radial-viewport]');
  const canvas=viewport?.querySelector('[data-radial-canvas]');
  if(!viewport||!canvas)return;
  const svg=canvas.querySelector('svg.nut-radial-svg');
  if(!svg)return;
  // Меняем систему координат SVG вместо увеличения готового слоя CSS.
  const originalBox=svg.viewBox?.baseVal;
  const origin={
    x:originalBox?.x??0,
    y:originalBox?.y??0,
    width:originalBox?.width||600,
    height:originalBox?.height||600
  };
  const markerRadii=[...svg.querySelectorAll('.nut-radial-node circle')].map(node=>({
    node,
    radius:Number(node.getAttribute('r')),
    dash:node.getAttribute('stroke-dasharray')
  }));
  const labelSizes=[...svg.querySelectorAll('text')].map(node=>({
    node,
    fontSize:parseFloat(window.getComputedStyle(node).fontSize)||11
  }));
  const toolbar=viewport.parentElement.querySelector('[data-radial-toolbar]');
  const zoomLabel=toolbar?.querySelector('[data-radial-zoom-label]');
  const zoomIn=toolbar?.querySelector('[data-radial-view="in"]');
  const zoomOut=toolbar?.querySelector('[data-radial-view="out"]');
  const MAX=2.4, MIN=1;
  let zoom=1, offsetX=0, offsetY=0, mouse=null, touch=null, suppressClick=false;
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  function restrict() {
    const size=viewport.getBoundingClientRect();
    // Не позволяем потерять диаграмму за границами рабочей области.
    const roomX=size.width*(.08+(zoom-1)*.58);
    const roomY=size.height*(.08+(zoom-1)*.58);
    offsetX=clamp(offsetX,-roomX,roomX);
    offsetY=clamp(offsetY,-roomY,roomY);
  }
  function apply() {
    restrict();
    const actualWidth=canvas.getBoundingClientRect().width||viewport.getBoundingClientRect().width||1;
    const actualHeight=canvas.getBoundingClientRect().height||viewport.getBoundingClientRect().height||1;
    const visibleWidth=origin.width/zoom, visibleHeight=origin.height/zoom;
    const visibleX=origin.x+(origin.width-visibleWidth)/2-offsetX*visibleWidth/actualWidth;
    const visibleY=origin.y+(origin.height-visibleHeight)/2-offsetY*visibleHeight/actualHeight;
    svg.setAttribute('viewBox',[visibleX,visibleY,visibleWidth,visibleHeight].map(n=>n.toFixed(5)).join(' '));
    // Приближаются оси и расстояния между значениями, но сами точки и подписи
    // остаются одного размера на экране.
    for(const marker of markerRadii){
      if(Number.isFinite(marker.radius)&&marker.radius>0){
        marker.node.setAttribute('r',(marker.radius/zoom).toFixed(4));
      }
      if(marker.dash){
        const dashes=marker.dash.trim().split(/[ ,]+/).map(Number);
        if(dashes.every(Number.isFinite))marker.node.setAttribute('stroke-dasharray',dashes.map(n=>(n/zoom).toFixed(4)).join(' '));
      }
    }
    for(const label of labelSizes)label.node.style.fontSize=(label.fontSize/zoom).toFixed(3)+'px';
    if(zoomLabel)zoomLabel.textContent=Math.round(zoom*100)+'%';
    if(zoomIn)zoomIn.disabled=zoom>=MAX-.001;
    if(zoomOut)zoomOut.disabled=zoom<=MIN+.001;
    viewport.dataset.radialZoomed=zoom>1.001?'true':'false';
    // При обычном просмотре один палец прокручивает страницу.
    viewport.style.touchAction=zoom>1.001?'none':'pan-y';
  }
  function changeZoom(next,clientX,clientY) {
    const target=clamp(next,MIN,MAX);
    if(Math.abs(target-zoom)<.0001)return;
    const rect=viewport.getBoundingClientRect();
    const localX=clientX-rect.left-rect.width/2;
    const localY=clientY-rect.top-rect.height/2;
    const ratio=target/zoom;
    offsetX=localX-(localX-offsetX)*ratio;
    offsetY=localY-(localY-offsetY)*ratio;
    zoom=target;
    apply();
  }
  function zoomAtCenter(multiplier) {
    const r=viewport.getBoundingClientRect();
    changeZoom(zoom*multiplier,r.left+r.width/2,r.top+r.height/2);
  }
  function reset() {zoom=MIN;offsetX=0;offsetY=0;apply();}
  toolbar?.addEventListener('click',event=>{
    const button=event.target.closest('[data-radial-view]');
    if(!button)return;
    const action=button.dataset.radialView;
    if(action==='in')zoomAtCenter(1.2);
    if(action==='out')zoomAtCenter(1/1.2);
    if(action==='reset')reset();
  });
  const handleWheel=event=>{
    // Прокрутку страницы перехватываем на ВСЕХ уровнях масштаба,
    // включая минимум и максимум. За пределами графика страница скроллится обычно.
    event.preventDefault();
    if(!event.deltaY)return;
    changeZoom(zoom*Math.exp(-clamp(event.deltaY,-120,120)*.0026),event.clientX,event.clientY);
  };
  viewport.addEventListener('wheel',handleWheel,{passive:false});
  toolbar?.addEventListener('wheel',handleWheel,{passive:false});
  viewport.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0)return;
    mouse={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};
  });
  viewport.addEventListener('pointermove',event=>{
    if(!mouse||mouse.id!==event.pointerId)return;
    const dx=event.clientX-mouse.x,dy=event.clientY-mouse.y;
    if(!mouse.moved&&Math.hypot(event.clientX-mouse.startX,event.clientY-mouse.startY)>5){
      mouse.moved=true;
      hideTip();
      viewport.setPointerCapture(event.pointerId);
    }
    if(mouse.moved){offsetX+=dx;offsetY+=dy;apply();viewport.classList.add('is-dragging');}
    mouse.x=event.clientX;mouse.y=event.clientY;
  });
  function finishMouse(event) {
    if(!mouse||mouse.id!==event.pointerId)return;
    if(mouse.moved){
      suppressClick=true;
      // При отпускании указателя над точкой не открываем её карточку.
      setTimeout(()=>{suppressClick=false;},100);
    }
    mouse=null;
    viewport.classList.remove('is-dragging');
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
  }
  viewport.addEventListener('pointerup',finishMouse);
  viewport.addEventListener('pointercancel',finishMouse);
  viewport.addEventListener('click',event=>{
    if(!suppressClick)return;
    event.preventDefault();event.stopPropagation();suppressClick=false;
  },true);
  function midpoint(a,b){return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
  function distance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
  viewport.addEventListener('touchstart',event=>{
    if(event.touches.length>=2){
      const a=event.touches[0],b=event.touches[1];
      touch={kind:'pinch',distance:Math.max(1,distance(a,b)),zoom,center:midpoint(a,b),offsetX,offsetY};
      if(event.cancelable)event.preventDefault();
    }else if(event.touches.length===1&&zoom>1.001){
      touch={kind:'drag',x:event.touches[0].clientX,y:event.touches[0].clientY};
    }else touch=null;
  },{passive:false});
  viewport.addEventListener('touchmove',event=>{
    if(event.touches.length>=2){
      const a=event.touches[0],b=event.touches[1];
      if(!touch||touch.kind!=='pinch'){
        touch={kind:'pinch',distance:Math.max(1,distance(a,b)),zoom,center:midpoint(a,b),offsetX,offsetY};
      }
      if(event.cancelable)event.preventDefault();
      const target=clamp(touch.zoom*distance(a,b)/touch.distance,MIN,MAX);
      const rect=viewport.getBoundingClientRect(),center=midpoint(a,b);
      const ox=touch.center.x-rect.left-rect.width/2,oy=touch.center.y-rect.top-rect.height/2;
      const nx=center.x-rect.left-rect.width/2,ny=center.y-rect.top-rect.height/2;
      const ratio=target/touch.zoom;
      zoom=target;
      offsetX=nx-(ox-touch.offsetX)*ratio;
      offsetY=ny-(oy-touch.offsetY)*ratio;
      apply();
    }else if(event.touches.length===1&&zoom>1.001){
      const finger=event.touches[0];
      if(!touch||touch.kind!=='drag')touch={kind:'drag',x:finger.clientX,y:finger.clientY};
      if(event.cancelable)event.preventDefault();
      offsetX+=finger.clientX-touch.x;
      offsetY+=finger.clientY-touch.y;
      touch.x=finger.clientX;touch.y=finger.clientY;
      apply();
    }
  },{passive:false});
  viewport.addEventListener('touchend',event=>{
    if(event.touches.length===1&&zoom>1.001){
      touch={kind:'drag',x:event.touches[0].clientX,y:event.touches[0].clientY};
    }else touch=null;
  });
  viewport.addEventListener('touchcancel',()=>{touch=null;});
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport)return;
    if(event.key==='+'||event.key==='='){event.preventDefault();zoomAtCenter(1.2);}
    else if(event.key==='-'){event.preventDefault();zoomAtCenter(1/1.2);}
    else if(event.key==='0'||event.key==='Home'){event.preventDefault();reset();}
    else if(event.key.startsWith('Arrow')&&zoom>1.001){
      event.preventDefault();
      offsetX+=(event.key==='ArrowLeft'?26:event.key==='ArrowRight'?-26:0);
      offsetY+=(event.key==='ArrowUp'?26:event.key==='ArrowDown'?-26:0);
      apply();
    }
  });
  // Одна собственная подсказка вместо системного SVG title: показывается без задержки.
  // Положение вычисляется в координатах внешней карточки и не зависит от SVG zoom.
  const tip=viewport.parentElement.querySelector('[data-radial-hover-tip]');
  const items=new Map((model?.items||[]).map(item=>[item.key,item]));
  const parts=tip?{
    name:tip.querySelector('[data-radial-hover-name]'),
    pct:tip.querySelector('[data-radial-hover-pct]'),
    amount:tip.querySelector('[data-radial-hover-amount]'),
    note:tip.querySelector('[data-radial-hover-note]')
  }:null;
  let activeKey=null;
  function hideTip(){
    if(!tip)return;
    tip.hidden=true;
    tip.setAttribute('aria-hidden','true');
    activeKey=null;
  }
  function placeTip(clientX,clientY){
    if(!tip||tip.hidden)return;
    const plot=viewport.parentElement.getBoundingClientRect();
    const width=tip.offsetWidth, height=tip.offsetHeight;
    const x=Math.max(7,Math.min(clientX-plot.left+14,plot.width-width-7));
    const bottom=clientY-plot.top+17;
    const y=bottom+height>plot.height-7?clientY-plot.top-height-15:bottom;
    tip.style.left=Math.max(7,x)+'px';
    tip.style.top=Math.max(7,y)+'px';
  }
  function showTip(key,clientX,clientY){
    if(!tip||!key||!items.has(key))return;
    if(activeKey!==key){
      const data=radialHoverCopy(items.get(key));
      parts.name.textContent=data.name;
      parts.pct.textContent=data.pct;
      parts.amount.textContent=data.amount;
      parts.amount.hidden=!data.amount;
      parts.note.textContent=data.note;
      activeKey=key;
    }
    tip.hidden=false;
    tip.setAttribute('aria-hidden','false');
    placeTip(clientX,clientY);
  }
  const pointKey=target=>target?.closest?.('[data-radial-key]')?.dataset.radialKey;
  viewport.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch'||mouse?.moved)return;
    const key=pointKey(event.target);
    if(key)showTip(key,event.clientX,event.clientY);
  });
  viewport.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||mouse?.moved)return;
    const key=pointKey(event.target);
    if(key)showTip(key,event.clientX,event.clientY);
    else hideTip();
  });
  viewport.addEventListener('pointerout',event=>{
    const from=pointKey(event.target),to=pointKey(event.relatedTarget);
    if(from&&from!==to)hideTip();
  });
  viewport.addEventListener('pointerleave',hideTip);
  viewport.addEventListener('pointerdown',hideTip);
  viewport.addEventListener('focusin',event=>{
    const key=pointKey(event.target);
    if(!key)return;
    const rect=event.target.getBoundingClientRect();
    showTip(key,rect.left+rect.width/2,rect.top+rect.height/2);
  });
  viewport.addEventListener('focusout',hideTip);
  toolbar?.addEventListener('pointerover',hideTip);
  toolbar?.addEventListener('focusin',hideTip);
  viewport.addEventListener('wheel',hideTip,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(apply).observe(viewport);
  apply();
}
