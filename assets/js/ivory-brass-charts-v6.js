/* Small dependency-free SVG charts for Ivory & Brass.
 * Nutrient group chart is a transparent navigation summary over the canonical
 * nutrient table. It never calculates norms or produces a synthetic score.
 */
(function(w,d){
  'use strict';
  var VERSION='v6.0.0-beta2-ivory-charts';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function polar(cx,cy,r,angle){var a=(angle-90)*Math.PI/180;return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};}
  function arc(cx,cy,r,start,end){var s=polar(cx,cy,r,end),e=polar(cx,cy,r,start),large=end-start<=180?'0':'1';return 'M '+s.x+' '+s.y+' A '+r+' '+r+' 0 '+large+' 0 '+e.x+' '+e.y;}
  function countText(g){
    if(!g||!g.total)return 'Расчёт пока недоступен.';
    var parts=['целевой диапазон — '+g.target,'ниже ориентира — '+g.below,'требуют проверки — '+g.review,'выше применимого предела — '+g.above,'не оцениваются — '+g.unknown];
    return parts.join(', ')+'.';
  }
  function radial(groups,label){
    groups=Array.isArray(groups)?groups:[];
    var size=250,c=125,step=18,base=43;
    var html='<svg viewBox="0 0 250 250" role="img" aria-labelledby="ibRadialTitle ibRadialDesc"><title id="ibRadialTitle">'+esc(label||'Обзор нутриентов по группам')+'</title><desc id="ibRadialDesc">Каждое кольцо соответствует подписанной ниже группе и показывает распределение статусов из полной сводной таблицы. Диаграмма не является общей оценкой рациона.</desc>';
    groups.slice(0,5).forEach(function(g,i){
      var r=base+i*step,total=Math.max(0,Number(g.total)||0),cursor=0;
      var parts=[['target',Number(g.target)||0],['below',Number(g.below)||0],['review',Number(g.review)||0],['above',Number(g.above)||0],['unknown',Number(g.unknown)||0]];
      html+='<g class="ib-chart-ring" role="button" tabindex="0" data-ivory-nutrient-group="'+esc(g.key)+'" aria-label="'+esc(g.label+'. '+countText(g)+' Открыть эту группу в полной сводной таблице.')+'">';
      html+='<title>'+esc(g.label+': '+countText(g))+'</title><circle class="ib-chart-hit" cx="'+c+'" cy="'+c+'" r="'+r+'"/><circle class="ib-chart-track" cx="'+c+'" cy="'+c+'" r="'+r+'"/>';
      if(total>0)parts.forEach(function(p){
        var amount=p[1]/total;if(!(amount>0))return;
        var gap=Math.min(1.2,amount*359.5/5),start=cursor*359.5+gap,end=(cursor+amount)*359.5-gap;
        if(end>start)html+='<path class="ib-chart-segment is-'+p[0]+'" d="'+arc(c,c,r,start,end)+'"/>';
        cursor+=amount;
      });
      html+='</g>';
    });
    html+='<circle class="ib-chart-core" cx="125" cy="125" r="29"/><text class="ib-chart-core-label" x="125" y="121">ОБЗОР</text><text class="ib-chart-core-caption" x="125" y="137">по группам</text></svg>';
    return html;
  }
  function stackedBar(group){
    var total=Math.max(0,Number(group&&group.total)||0),parts=[['target',group&&group.target],['below',group&&group.below],['review',group&&group.review],['above',group&&group.above],['unknown',group&&group.unknown]];
    if(!total)return '<span class="ib-group-bar is-empty" aria-hidden="true"><i></i></span>';
    return '<span class="ib-group-bar" aria-hidden="true">'+parts.map(function(p){var value=Math.max(0,Number(p[1])||0);return value?'<i class="is-'+p[0]+'" style="width:'+(value/total*100).toFixed(3)+'%"></i>':'';}).join('')+'</span>';
  }
  function score(value){var v=isFinite(Number(value))?clamp(Number(value),0,10):0,circ=2*Math.PI*42,dash=circ*(v/10);return '<svg viewBox="0 0 110 110" role="img" aria-label="Общая оценка '+(v?v.toFixed(1)+' из 10':'не рассчитана')+'"><circle class="ib-score-track" cx="55" cy="55" r="42"/><circle class="ib-score-value" cx="55" cy="55" r="42" stroke-dasharray="'+dash+' '+(circ-dash)+'"/><text class="ib-score-number" x="55" y="55">'+(v?v.toFixed(1):'—')+'</text><text class="ib-score-caption" x="55" y="72">из 10</text></svg>';}
  function progress(percent,status){var p=isFinite(Number(percent))?clamp(Number(percent),0,120):0;return '<span class="ib-progress" data-status="'+esc(status||'unknown')+'"><i style="width:'+clamp(p,0,100)+'%"></i><b style="left:'+clamp(p,0,100)+'%"></b></span>';}
  w.IvoryBrassCharts={version:VERSION,radial:radial,stackedBar:stackedBar,score:score,progress:progress,countText:countText};
})(window,document);
