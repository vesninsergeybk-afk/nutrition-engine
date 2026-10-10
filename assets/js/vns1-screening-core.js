/* VesninMed Nutritional Screening VNS-1 v0.2: non-validated research prototype.
 * Independent decision-support logic. Inputs are anonymized local values only.
 * Evidence: GLIM 2025, NICE CG32. No text/scoring from MNA, MUST, MST is used.
 */
(function(root){'use strict';
  function evaluateVNS1(p) {
  "use strict";
  p=p||{};
  var explanations=[],warnings=[],quality=[],urgent=[],points=[];
  function num(v,min,max){if(v===null||v===undefined||v==="")return null;var n=Number(String(v).replace(",","."));return Number.isFinite(n)&&n>=min&&n<=max?n:null;}
  function emit(code,level,message,source){points.push({code:code,level:level,message:message,source:source});}
  var age=num(p.age,18,120),height=num(p.heightCm,90,250),weight=num(p.weightKg,15,400),past=num(p.previousWeightKg,15,400);
  var bmi=height!==null&&weight!==null?weight/Math.pow(height/100,2):null;
  var loss=weight!==null&&past!==null&&past>weight?100*(past-weight)/past:0;
  var reliable=p.weightReliable!==false&&p.edema!==true;
  var intended=p.weightLossIntent==="intentional";
  var unintentional=p.weightLossIntent==="unintentional";
  var days=num(p.reducedIntakeDays,0,365),almostDays=num(p.almostNoIntakeDays,0,365),futureDays=num(p.expectedLowIntakeDays,0,365);
  var amount=p.intakeAmount||"unknown"; // none, some, half-or-less, almost-none, unknown
  var barriers=Array.isArray(p.barriers)?p.barriers:[];
  var emergency=p.emergency||"none";
  var blocked=["pregnancy","icu","enteral","parenteral"].indexOf(p.specialContext)>=0 || (p.age!==undefined&&p.age!==null&&Number(p.age)<18);
  if(["cannot-swallow-saliva","breathing-problem","aspiration-breathing"].indexOf(emergency)>=0) {
    urgent.push("Нарушение глотания или дыхания требует экстренной медицинской оценки.");
  } else if(emergency==="cannot-keep-fluids"){
    urgent.push("Невозможность удерживать жидкость требует срочной медицинской оценки.");
  }
  if(age===null)quality.push("Возраст неизвестен или вне диапазона применения.");
  if(weight===null||height===null)quality.push("Нет надёжных данных о росте или текущей массе тела; ИМТ не оценивается.");
  if(p.weightReliable===false||p.edema===true)quality.push("Из-за отёков или колебаний жидкости динамика массы и ИМТ могут вводить в заблуждение.");
  if(p.weightLossIntent===undefined||p.weightLossIntent==="unknown")quality.push("Неизвестно, снижалась ли масса тела непреднамеренно.");
  if(p.intakeReduced===undefined||p.intakeReduced==="unknown")quality.push("Неизвестно, уменьшилось ли количество пищи.");
  if(almostDays===null)quality.push("Неизвестна длительность почти полного отсутствия питания.");
  if(blocked)warnings.push("Для этого клинического состояния алгоритм ВНС-1 не предназначен. Нужна специализированная оценка.");
  if(unintentional) {
    if(past===null||weight===null){emit("weight-loss-unknown",1,"Сообщено непреднамеренное снижение массы, величина неизвестна.","Нутритивный скрининг; NICE CG32");}
    else if(!reliable){emit("weight-loss-unreliable",1,"Изменение массы может быть искажено задержкой или потерей жидкости.","Ограничение антропометрии");}
    else if(loss>5){emit("weight-loss-over-five",2,"Непреднамеренная потеря массы более 5% за период около 3–6 месяцев.","GLIM 2025");}
    else if(loss>0){emit("weight-loss-any",1,"Есть непреднамеренное снижение массы, даже если оно меньше 5%.","Нутритивный скрининг");}
    else {quality.push("Непреднамеренная потеря массы заявлена, но измерения её не подтверждают.");}
  }
  if(p.weightLossIntent==="none"&&past!==null&&weight!==null&&past>weight&&reliable)emit("conflicting-weight-history",1,"Прежняя масса в профиле выше текущей, хотя снижение отрицается: уточните историю изменения веса.","Проверка согласованности данных");
  if(intended&&loss>5)quality.push("Снижение массы названо намеренным: его причины и безопасность нельзя определить одним вопросом.");
  if(bmi!==null&&!reliable)warnings.push("ИМТ рассчитан ориентировочно: масса может изменяться из-за жидкости.");
  if(bmi!==null&&reliable&&age!==null&&bmi<(age>=70?22:20))emit("low-bmi",2,"ИМТ ниже возрастного порога, применяемого в критериях GLIM.","GLIM 2025");
  if(bmi!==null&&reliable&&bmi<16)emit("very-low-bmi",2,"ИМТ ниже 16 кг/м²; возможен высокий риск осложнений при возобновлении питания.","NICE CG32");
  if(p.intakeReduced==="yes"){
    if(days===null){emit("reduced-intake-duration-unknown",1,"Потребление пищи уменьшилось, но продолжительность неизвестна.","Нутритивный скрининг");}
    else if(days>14){emit("reduced-intake-extended",2,"Сообщено о снижении количества пищи более двух недель; необходимо оценить фактическое поступление энергии.","GLIM 2025: дальнейшая оценка");}
    else if(days>7&&amount==="half-or-less"){emit("reduced-intake-substantial",2,"Более недели человек ест примерно половину своей обычной порции или меньше; это повод проверить фактическое поступление энергии.","Направление на оценку; не эквивалент критерию GLIM ≤50% потребности");}
    else if(days>0){emit("reduced-intake",1,"Поступление пищи снижено; длительность и причина важны для наблюдения.","Нутритивный скрининг");}
  }
  if(almostDays!==null&&almostDays>=5)emit("no-intake-five",2,"Почти отсутствующее питание не менее пяти дней требует медицинской оценки до увеличения рациона.","NICE CG32");
  else if(almostDays!==null&&almostDays>0)emit("no-intake-short",1,"Были дни с почти полным отсутствием питания.","Нутритивный скрининг");
  if(futureDays!==null&&futureDays>=5)emit("future-low-intake",2,"Ожидается длительное отсутствие полноценного питания; нужна оценка до начала этого периода.","NICE CG32");
  else if(futureDays!==null&&futureDays>0)emit("future-low-intake-short",1,"Ожидается временное ограничение питания.","Нутритивный скрининг");
  if(barriers.length&&p.barriersAffectIntake!=="no")emit("intake-barriers",1,"Есть обстоятельства, мешающие регулярно или безопасно питаться.","NICE CG32: клиническая настороженность");
  if(p.foodAccess==="yes")emit("food-access",1,"Есть трудности с доступом к еде или её приготовлением.","Контекст питания");
  if(p.functionDecline==="yes")emit("function-change",1,"Сообщено об изменении мышц или физических возможностей; необходима объективная оценка при клиническом подозрении.","GLIM 2025: функция не равна измеренной мышечной массе");
  if(p.illnessAffectsIntake==="yes")emit("disease-food-impact",1,"Заболевание или лечение влияет на потребление или усвоение пищи.","GLIM 2025: этиологические обстоятельства");
  var refCount=0;
  if(reliable&&bmi!==null&&bmi<18.5)refCount++;
  if(unintentional&&reliable&&loss>10)refCount++;
  if(almostDays!==null&&almostDays>5)refCount++;
  if(p.refeedingFactors==="yes")refCount++;
  var refHigh=(reliable&&bmi!==null&&bmi<16)||
    (unintentional&&reliable&&loss>15)||
    (almostDays!==null&&almostDays>10)||
    p.lowElectrolytes==="yes"||
    refCount>=2;
  if(refHigh){warnings.push("Обнаружены признаки возможного высокого риска синдрома возобновления питания по NICE. Не увеличивайте питание резко без оценки медицинским специалистом.");}
  else if(almostDays!==null&&almostDays>=5){warnings.push("После нескольких дней почти без еды при возобновлении питания нужно учитывать риск рефидинга.");}
  var max=0;
  points.forEach(function(x){max=Math.max(max,x.level);});
  if(urgent.length)max=3;
  var enough=p.weightLossIntent!==undefined&&p.weightLossIntent!=="unknown"&&p.intakeReduced!==undefined&&p.intakeReduced!=="unknown"&&almostDays!==null&&
    (p.barriersPresent==="no"||(p.barriersPresent==="yes"&&barriers.length>0))&&
    (p.foodAccess==="yes"||p.foodAccess==="no")&&
    (p.illnessAffectsIntake==="yes"||p.illnessAffectsIntake==="no")&&
    (p.functionDecline==="yes"||p.functionDecline==="no")&&futureDays!==null&&
    (p.emergency==="none"||urgent.length>0)&&
    (p.fluidState==="no"||p.fluidState==="yes")&&
    (p.intakeReduced!=="yes"||(days!==null&&days>0));
  if(!enough)quality.push("Не все разделы анкеты заполнены: итог может измениться после дополнения ответов.");
  if(blocked)max=urgent.length?3:null;
  if(!blocked&&!enough&&max===0)max=null;
  var labels={0:"По указанным сведениям выраженных сигналов не выявлено",1:"Есть обстоятельства, требующие внимания",2:"Нужна медицинская оценка питания",3:"Требуется срочная медицинская помощь"};
  var category=max===null?"insufficient":max;
  return {version:"vns1-0.2-research",status:"NOT_VALIDATED",category:category,title:category==="insufficient"?(blocked?"Нужна специализированная оценка":"Недостаточно сведений"):labels[category],flags:points,warnings:warnings,urgent:urgent,dataLimitations:quality,bmi:bmi===null?null:Number(bmi.toFixed(2)),weightLossPercent:unintentional&&reliable&&past!==null&&weight!==null?Number(loss.toFixed(2)):null,refeedingRiskFlag:refHigh?"needs-professional-review":"not-identified-by-known-data",complete:!!enough&&!blocked,disclaimer:"Исследовательский алгоритм, не валидирован. Не устанавливает диагноз и не заменяет клинический скрининг."};
}
  var api={evaluate:evaluateVNS1,version:'vns1-0.2-research',validated:false};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.VNS1Core=api;
})(typeof window!=='undefined'?window:null);
