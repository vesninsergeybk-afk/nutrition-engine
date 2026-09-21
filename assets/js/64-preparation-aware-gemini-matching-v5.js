// nutrition calculator v5.3.190 — final preparation-aware matching
// A preparation word affects the ration only when it resolves to a concrete product key
// whose nutrient profile and weight basis are declared in the local registry.
(function(){
  'use strict';
  var VERSION='v5.3.190_preparation_final_cross_chain_matching';
  var api=window.NutritionPreparationFamilies;

  var METHOD_ALIASES=[
    ['sous_vide',/(?:^|\s)(?:су\s*вид|sous[\s-]?vide)(?:$|\s)/],
    ['air_fried',/(?:^|\s)(?:в\s+аэрогрил[а-яa-z0-9_-]*|аэрогрил[а-яa-z0-9_-]*|air[\s-]?fried|air\s+fryer)(?:$|\s)/],
    ['pressure_cooked',/(?:^|\s)(?:в\s+скороварк[а-яa-z0-9_-]*|скороварк[а-яa-z0-9_-]*|под\s+давлением|pressure[\s-]?cooked)(?:$|\s)/],
    ['slow_cooked',/(?:^|\s)(?:в\s+медленноварк[а-яa-z0-9_-]*|медленноварк[а-яa-z0-9_-]*|долго\s+томл[а-яa-z0-9_-]*|slow[\s-]?cooked)(?:$|\s)/],
    ['blanched',/(?:^|\s)(?:бланширован[а-яa-z0-9_-]*|бланширов[а-яa-z0-9_-]*|blanched)(?:$|\s)/],
    ['braised',/(?:^|\s)(?:томлен[а-яa-z0-9_-]*|томлён[а-яa-z0-9_-]*|braised)(?:$|\s)/],
    ['deep_fried',/(?:картофел[а-яa-z0-9_-]*\s+фри|картошк[а-яa-z0-9_-]*\s+фри|(?:^|\s)(?:во\s+фритюре|фритюр[а-яa-z0-9_-]*|deep[\s-]?fried|french\s+fries)(?:$|\s))/],
    ['pan_fried',/(?:жарен[а-яa-z0-9_-]*\s+(?:картошк|картофел)[а-яa-z0-9_-]*|(?:картофел|картошк)[а-яa-z0-9_-]*\s+жарен[а-яa-z0-9_-]*|(?:^|\s)(?:по[\s-]?домашнему\s+на\s+сковород[а-яa-z0-9_-]*|на\s+сковород[а-яa-z0-9_-]*|обжарен[а-яa-z0-9_-]*|saute|sauté|pan[\s-]?fried|home\s+fries)(?:$|\s))/],
    ['fried_unspecified',/(?:^|\s)(?:жарен[а-яa-z0-9_-]*|fried)(?:$|\s)/],
    ['steamed',/(?:^|\s)(?:на\s+пару|паровой|паровая|паровое|steamed)(?:$|\s)/],
    ['poached',/(?:^|\s)(?:пашот|припущен[а-яa-z0-9_-]*|poached)(?:$|\s)/],
    // Word boundaries are essential: "заваренный" must not be classified as boiled.
    ['boiled',/(?:^|\s)(?:отварн[а-яa-z0-9_-]*|варен[а-яa-z0-9_-]*|варён[а-яa-z0-9_-]*|boiled)(?:$|\s)/],
    ['stewed',/(?:^|\s)(?:тушен[а-яa-z0-9_-]*|тушён[а-яa-z0-9_-]*|stewed)(?:$|\s)/],
    ['roasted',/(?:^|\s)(?:жаркое|roasted)(?:$|\s)/],
    ['baked',/(?:^|\s)(?:запечен[а-яa-z0-9_-]*|запечён[а-яa-z0-9_-]*|печен[а-яa-z0-9_-]*|печён[а-яa-z0-9_-]*|baked)(?:$|\s)/],
    ['grilled',/(?:^|\s)(?:на\s+гриле|гриль|grilled)(?:$|\s)/],
    ['smoked',/(?:^|\s)(?:копчен[а-яa-z0-9_-]*|копчён[а-яa-z0-9_-]*|smoked)(?:$|\s)/],
    ['rehydrated',/(?:^|\s)(?:восстановлен[а-яa-z0-9_-]*\s+(?:водой|в\s+воде)|регидратирован[а-яa-z0-9_-]*|rehydrated)(?:$|\s)/],
    ['dried',/(?:^|\s)(?:сушен[а-яa-z0-9_-]*|сушён[а-яa-z0-9_-]*|вялен[а-яa-z0-9_-]*|dried|dehydrated)(?:$|\s)/],
    ['brewed',/(?:^|\s)(?:заварен[а-яa-z0-9_-]*|заварн[а-яa-z0-9_-]*|brewed)(?:$|\s)/],
    ['fermented',/(?:^|\s)(?:ферментирован[а-яa-z0-9_-]*|сквашен[а-яa-z0-9_-]*|fermented)(?:$|\s)/],
    ['canned',/(?:^|\s)(?:консервирован[а-яa-z0-9_-]*|консервы|canned)(?:$|\s)/],
    ['microwaved',/(?:^|\s)(?:микроволнов[а-яa-z0-9_-]*|свч|microwaved)(?:$|\s)/],
    ['pureed',/(?:^|\s)(?:пюре|протерт[а-яa-z0-9_-]*|протёрт[а-яa-z0-9_-]*|pureed)(?:$|\s)/],
    ['uncooked',/(?:^|\s)(?:сухая\s+крупа|сухой\s+продукт|до\s+варки|не\s+приготовлен[а-яa-z0-9_-]*|uncooked|dry\s+weight)(?:$|\s)/],
    ['raw',/(?:^|\s)(?:сырой|сырая|сырое|raw)(?:$|\s)/],
    ['cooked_unspecified',/(?:^|\s)(?:готовый|готовая|приготовлен[а-яa-z0-9_-]*|cooked)(?:$|\s)/]
  ];
  var FAT_ALIASES=[
    ['none',/(?:^|\s)(?:без\s+масла|без\s+добавленн[а-яa-z0-9_-]*\s+жир[а-яa-z0-9_-]*|no\s+oil|without\s+oil)(?:$|\s)/],
    ['included_in_variant',/(?:^|\s)(?:на\s+масле|с\s+маслом|масло\s+учтено|oil\s+included)(?:$|\s)/],
    ['explicit_separate_ingredient',/(?:^|\s)(?:масло\s+отдельно|отдельно\s+[а-яa-z0-9_-]*масл[а-яa-z0-9_-]*|указан[а-яa-z0-9_-]*\s+масл[а-яa-z0-9_-]*)(?:$|\s)/]
  ];

  function norm(value){
    if(api&&api.normalizeText)return api.normalizeText(value);
    return String(value==null?'':value).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').replace(/\s+/g,' ').trim();
  }
  function enumHas(field,value){var rows=api&&api.registry&&api.registry.enums&&api.registry.enums[field];return Array.isArray(rows)&&rows.indexOf(value)>=0;}
  function explicitEnum(field,value){var v=norm(value).replace(/ /g,'_');return enumHas(field,v)?v:'';}
  function detectByAliases(value,aliases){var n=' '+norm(value)+' ';if(n.trim()==='')return '';for(var i=0;i<aliases.length;i++){aliases[i][1].lastIndex=0;if(aliases[i][1].test(n))return aliases[i][0];}return '';}
  function detectMethod(value){return explicitEnum('preparation_method',value)||detectByAliases(value,METHOD_ALIASES);}
  function detectFat(value){return explicitEnum('added_fat_mode',value)||detectByAliases(value,FAT_ALIASES);}
  function detectSkin(value){var e=explicitEnum('skin_state',value);if(e)return e;var n=norm(value);if(/(?:^|\s)(?:без кожи|skinless)(?:$|\s)/.test(' '+n+' '))return 'skinless';if(/(?:^|\s)(?:с кожей|кожа сохранена|skin on)(?:$|\s)/.test(' '+n+' '))return 'with_skin';return '';}
  function detectBreading(value){var e=explicitEnum('breading_state',value);if(e)return e;var n=norm(value);if(/без паниров|unbreaded/.test(n))return 'unbreaded';if(/в паниров|панирован|breaded/.test(n))return 'breaded';return '';}
  function detectDrain(value){var e=explicitEnum('drain_state',value);if(e)return e;var n=norm(value);if(/без заливки|жидкость слита|рассол слит|drained/.test(n))return 'drained';if(/с заливкой|в рассоле|in liquid/.test(n))return 'not_drained';return '';}
  function detectDoneness(value){var e=explicitEnum('doneness_state',value);if(e)return e;var n=norm(value);if(/всмятку|soft boiled/.test(n))return 'soft';if(/вкрутую|hard boiled/.test(n))return 'hard';if(/medium|средн.*прожарк/.test(n))return 'medium';return '';}
  function detectStorage(value){var e=explicitEnum('storage_state',value);if(e)return e;var n=norm(value);if(/заморож|frozen/.test(n))return 'frozen';if(/охлажден|охлаждён|chilled/.test(n))return 'chilled';if(/свеж|fresh/.test(n))return 'fresh';return '';}
  function detectWeight(value){var e=explicitEnum('weight_basis',value);if(e)return e;var n=norm(value);if(/готов.*масс|после приготов|cooked weight/.test(n))return 'cooked_edible_weight';if(/сыр.*масс|до приготов|raw weight/.test(n))return 'raw_edible_weight';if(/сух.*масс|до варки|dry weight/.test(n))return 'dry_weight';if(/после слив|drained weight/.test(n))return 'drained_edible_weight';return '';}
  function isRequestedMethod(method){return !!method&&['unspecified','unknown','cooked_unspecified','prepared_unspecified','none'].indexOf(method)<0;}
  function parseIntent(input){
    input=input||{};if(typeof input==='string')input={text:input};
    var text=[input.text,input.observed_name_ru,input.exact_product_name,input.preparation_state,input.source_transcript_ru,input.notes].filter(Boolean).join(' ');
    var method=explicitEnum('preparation_method',input.preparation_method)||detectMethod(input.preparation_state)||detectMethod(text);
    var intent={
      preparation_method:method||'unspecified',preparation_confidence:Number(input.preparation_confidence)||0,
      added_fat_mode:explicitEnum('added_fat_mode',input.added_fat_mode)||detectFat(text)||'unknown',
      skin_state:explicitEnum('skin_state',input.skin_state)||detectSkin(text)||'unspecified',
      breading_state:explicitEnum('breading_state',input.breading_state)||detectBreading(text)||'unspecified',
      drain_state:explicitEnum('drain_state',input.drain_state)||detectDrain(text)||'unspecified',
      doneness_state:explicitEnum('doneness_state',input.doneness_state)||detectDoneness(text)||'unspecified',
      storage_state:explicitEnum('storage_state',input.storage_state)||detectStorage(text)||'unspecified',
      weight_basis:explicitEnum('weight_basis',input.weight_basis_hint||input.weight_basis)||detectWeight(text)||'unspecified'
    };
    if(intent.preparation_method!=='unspecified'&&!intent.preparation_confidence)intent.preparation_confidence=input.preparation_method?0.9:0.72;
    intent.methodRequested=isRequestedMethod(intent.preparation_method);return Object.freeze(intent);
  }
  function recognitionText(recognition,query){return [query,recognition.observed_name_ru,recognition.exact_product_name,recognition.product_family_hint,recognition.product_family,recognition.source_transcript_ru,(recognition.alternate_search_terms||[]).join(' ')].filter(Boolean).join(' ');}
  function familyFromRecognition(recognition,query){
    recognition=recognition||{};var text=recognitionText(recognition,query);var direct=String(recognition.food_family_id||'').trim();var candidates=api&&api.resolveFamilyCandidates?api.resolveFamilyCandidates(text):[];var inferred=candidates&&candidates[0]||null;
    if(direct&&api&&api.getFamily(direct)){var directFamily=api.getFamily(direct);if(inferred&&inferred.family&&inferred.family.food_family_id!==direct)return {conflict:true,directFamily:directFamily,inferred:inferred,text:text};return {family:directFamily,quality:'direct_family_id_validated',score:120};}
    if(direct)return {conflict:true,directFamily:null,inferred:inferred,text:text,unknownDirect:true};
    if(recognition.product_family_hint&&api&&api.getFamily(recognition.product_family_hint)){var hinted=api.getFamily(recognition.product_family_hint);if(inferred&&inferred.family&&inferred.family.food_family_id!==hinted.food_family_id)return {conflict:true,directFamily:hinted,inferred:inferred,text:text};return {family:hinted,quality:'direct_family_hint_validated',score:115};}
    return inferred;
  }
  function constraintsFromIntent(intent){return {preparation_method:intent.preparation_method,added_fat_mode:intent.added_fat_mode,skin_state:intent.skin_state,breading_state:intent.breading_state,drain_state:intent.drain_state,doneness_state:intent.doneness_state,storage_state:intent.storage_state,weight_basis:intent.weight_basis};}
  function policyNeedsConfirmation(meta){return !!meta&&meta.automatic_selection_policy&&meta.automatic_selection_policy!=='automatic';}
  function resolveRecognition(recognition,query){
    recognition=recognition||{};var intent=parseIntent(Object.assign({},recognition,{text:[query,recognition.preparation_state].filter(Boolean).join(' ')}));var serverStatus=String(recognition.preparation_match_status||'');var serverKey=String(recognition.exact_variant_key||'');var hit=familyFromRecognition(recognition,query);
    if(hit&&hit.conflict)return Object.freeze({status:'family_conflict',family:null,familyId:'',intent:intent,exactKey:'',requiresConfirmation:true,reason:'Возвращённое семейство не согласуется с названием продукта.'});
    if(!hit)return Object.freeze({status:'family_unmanaged',family:null,familyId:'',intent:intent,exactKey:'',requiresConfirmation:intent.methodRequested,reason:intent.methodRequested?'Для точного способа приготовления нет управляемого семейства.':''});
    var family=hit.family||hit;
    if(serverStatus==='not_found'||serverStatus==='ambiguous'||serverStatus==='conflict')return Object.freeze({status:serverStatus==='conflict'?'family_conflict':serverStatus,family:family,familyId:family.food_family_id,intent:intent,exactKey:'',candidates:[],requiresConfirmation:true,reason:'Сервер заблокировал автоматическую подстановку.'});
    if((serverStatus==='exact'||serverStatus==='exact_requires_confirmation')&&serverKey){
      var serverMeta=api.getVariantMeta(serverKey),serverFamily=api.getFamilyForProduct(serverKey);
      if(serverMeta&&serverFamily&&serverFamily.food_family_id===family.food_family_id){
        var needs=serverStatus==='exact_requires_confirmation'||policyNeedsConfirmation(serverMeta);
        return Object.freeze({status:needs?'exact_requires_confirmation':'exact',family:family,familyId:family.food_family_id,intent:intent,exactKey:serverKey,candidates:[],requiresConfirmation:needs,resolution:{status:needs?'exact_requires_confirmation':'exact',product:{key:serverKey},meta:serverMeta,serverValidated:true,requiresConfirmation:needs}});
      }
    }
    if(!intent.methodRequested)return Object.freeze({status:'family_only',family:family,familyId:family.food_family_id,intent:intent,exactKey:'',requiresConfirmation:false});
    var resolution=api.resolveExactVariant(family.food_family_id,constraintsFromIntent(intent));
    return Object.freeze({status:resolution.status,family:family,familyId:family.food_family_id,intent:intent,exactKey:resolution.product&&resolution.product.key||'',candidates:resolution.candidates||[],requiresConfirmation:resolution.status!=='exact'||resolution.requiresConfirmation===true,resolution:resolution});
  }
  function assessProduct(productKey,recognition,query){
    var resolved=resolveRecognition(recognition,query);
    if(resolved.status==='family_conflict')return {boost:-1.1,hardReject:true,exact:false,resolution:resolved,reason:'семейство продукта противоречит распознанному названию'};
    if(!resolved.familyId||!resolved.intent.methodRequested)return {boost:0,hardReject:false,exact:false,resolution:resolved,reason:resolved.requiresConfirmation?'способ приготовления требует ручного подтверждения':''};
    var meta=api.getVariantMeta(productKey);if(!meta)return {boost:-0.18,hardReject:true,exact:false,resolution:resolved,reason:'вариант приготовления не подтверждён семейным реестром'};
    var family=api.getFamilyForProduct(productKey);if(!family||family.food_family_id!==resolved.familyId)return {boost:-1.0,hardReject:true,exact:false,resolution:resolved,reason:'другое продуктовое семейство'};
    if(resolved.status==='exact'){
      if(productKey===resolved.exactKey)return {boost:0.72,hardReject:false,exact:true,resolution:resolved,reason:'точно совпадает способ приготовления и нутритивный профиль'};
      return {boost:-1.1,hardReject:true,exact:false,resolution:resolved,reason:'несовместимый способ приготовления'};
    }
    if(resolved.status==='exact_requires_confirmation'){
      if(productKey===resolved.exactKey)return {boost:0.35,hardReject:false,exact:false,resolution:resolved,reason:'профиль совместим, но содержит типовую рецептуру или расчётную модель; требуется подтверждение'};
      return {boost:-1.1,hardReject:true,exact:false,resolution:resolved,reason:'несовместимый способ приготовления'};
    }
    if(resolved.status==='compatible_method_class'){
      if(productKey===resolved.exactKey)return {boost:0.20,hardReject:false,exact:false,resolution:resolved,reason:'ближайший вариант; требуется подтверждение'};
      return {boost:-.9,hardReject:true,exact:false,resolution:resolved,reason:'несовместимый способ приготовления'};
    }
    if(resolved.status==='ambiguous'){var allowed=(resolved.candidates||[]).some(function(x){return x&&x.product&&x.product.key===productKey;});return {boost:allowed?.10:-.9,hardReject:!allowed,exact:false,resolution:resolved,reason:allowed?'совместимый вариант; требуется выбор':'несовместимый способ приготовления'};}
    if(resolved.status==='not_found')return {boost:-1.0,hardReject:true,exact:false,resolution:resolved,reason:'точного варианта приготовления нет в базе'};
    return {boost:0,hardReject:false,exact:false,resolution:resolved,reason:''};
  }
  function validateSelection(productKey,recognition,query){
    if(!productKey)return {ok:false,reason:'product_missing'};
    var assessment=assessProduct(productKey,recognition,query);
    if(assessment.hardReject)return {ok:false,reason:'preparation_incompatible',assessment:assessment};
    if(assessment.resolution&&assessment.resolution.requiresConfirmation&&!assessment.exact)return {ok:false,reason:'preparation_confirmation_required',assessment:assessment};
    return {ok:true,assessment:assessment};
  }
  function methodLabel(method){return ({
    raw:'сырой',uncooked:'сухой / до приготовления',boiled:'отварной',steamed:'на пару',poached:'припущенный / пашот',stewed:'тушёный',baked:'запечённый',roasted:'жаркое / запечённый крупным куском',grilled:'гриль',pan_fried:'обжаренный на сковороде',deep_fried:'во фритюре',fried_unspecified:'жареный',microwaved:'в микроволновой печи',smoked:'копчёный',dried:'сушёный',brewed:'заваренный',fermented:'ферментированный',rehydrated:'восстановленный водой',canned:'консервированный',pureed:'пюре',blanched:'бланшированный',braised:'томлёный',pressure_cooked:'приготовленный в скороварке',slow_cooked:'приготовленный в медленноварке',air_fried:'приготовленный в аэрогриле',cooked_unspecified:'приготовленный',prepared_unspecified:'подготовленный, способ не уточнён',sous_vide:'су-вид',none:'без отдельного способа',unknown:'способ не определён'
  })[method]||method||'';}
  var exported={version:VERSION,enabled:true,parseIntent:parseIntent,detectMethod:detectMethod,resolveRecognition:resolveRecognition,assessProduct:assessProduct,validateSelection:validateSelection,methodLabel:methodLabel,isRequestedMethod:isRequestedMethod};
  try{Object.freeze(exported);}catch(_){}window.NutritionPreparationMatching=exported;
  try{window.dispatchEvent(new CustomEvent('nutrition:preparationmatchingready',{detail:{version:VERSION}}));}catch(_){}
})();
