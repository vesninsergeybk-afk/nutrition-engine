// Nutrition Calculator v5.3.190 — final preparation cross-chain UI
// Groups verified preparation variants in search and Gemini draft while keeping
// every calculation bound to a concrete existing product key.
(function(){
  'use strict';
  var VERSION='v5.3.190_preparation_final_cross_chain_ui';
  var scanTimer=0, observer=null, internalMutation=false, installed=false;

  function api(){return window.NutritionPreparationFamilies&&window.NutritionPreparationFamilies.enabled?window.NutritionPreparationFamilies:null;}
  function matcher(){return window.NutritionPreparationMatching&&window.NutritionPreparationMatching.enabled?window.NutritionPreparationMatching:null;}
  function enabled(){var f=window.NutritionFeatureFlags||{};return f.preparation_family_ui_enabled===true&&!!api();}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmt1(n){n=Number(n);return Number.isFinite(n)?n.toFixed(1).replace(/\.0$/,''):'—';}
  function clamp(n,min,max){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;}
  function productName(p){return p&&(p.name_ru||p.name||p.key)||'';}
  function methodLabel(method){
    var m=matcher();if(m&&typeof m.methodLabel==='function'){var x=m.methodLabel(method);if(x&&x!==method)return x;}
    return ({raw:'сырой',uncooked:'сухой / до приготовления',boiled:'отварной',steamed:'на пару',poached:'припущенный / пашот',stewed:'тушёный',baked:'запечённый',roasted:'жаркое / запечённый',grilled:'гриль',pan_fried:'обжаренный на сковороде',deep_fried:'во фритюре',fried_unspecified:'жареный, способ не уточнён',microwaved:'в микроволновой печи',smoked:'копчёный',dried:'сушёный',brewed:'заваренный',fermented:'ферментированный',rehydrated:'восстановленный водой',canned:'консервированный',pureed:'пюре / измельчённый',blanched:'бланшированный',braised:'томлёный',pressure_cooked:'в скороварке',slow_cooked:'медленное приготовление',air_fried:'в аэрогриле',cooked_unspecified:'приготовленный, способ не уточнён',prepared_unspecified:'подготовленный, способ не уточнён',sous_vide:'су-вид'})[method]||method||'вариант приготовления';
  }
  function weightBasisLabel(basis){return ({raw_edible_weight:'масса сырого съедобного продукта',cooked_edible_weight:'масса готового продукта',dry_weight:'масса сухого продукта до приготовления',ready_to_eat_weight:'фактически съеденная готовая масса',drained_edible_weight:'масса после слива жидкости',as_sold_weight:'масса продукта в приобретённом виде'})[basis]||'уточните основание массы';}
  function processClassLabel(value){return ({raw_or_dry:'сырой или сухой профиль',moist_heat:'влажное приготовление без добавленного жира',dry_heat:'сухой нагрев',retained_liquid:'тушение с сохранённой жидкостью',pan_fried:'жарка на сковороде',deep_fried:'глубокая жарка',dried_or_rehydrated:'сушка или восстановление водой',canned_or_drained:'консервы или продукт после слива',cured_or_smoked:'посол, вяление или копчение',prepared_recipe:'готовая рецептурная модель',cooked_unspecified:'готовый продукт, способ не уточнён',identity_or_unmanaged:'способ не меняет расчётный профиль'})[value]||'нутритивный класс не указан';}
  function effectModeLabel(value){return ({exact_variant:'самостоятельный нутриентный профиль',derived_yield_retention:'расчёт по выходу массы и сохранности нутриентов',base_plus_ingredients:'типовая рецептура: жир, соль или другие ингредиенты уже учтены',alias_same_profile:'нутритивно эквивалентный профиль',unsupported:'автоматический расчёт запрещён'})[value]||'режим воздействия не указан';}
  function requiresManual(meta){return !!meta&&meta.automatic_selection_policy!=='automatic';}
  function weightInstruction(basis){return ({raw_edible_weight:'Указывайте массу сырой съедобной части.',cooked_edible_weight:'Указывайте массу уже приготовленного продукта.',dry_weight:'Указывайте массу сухой крупы или другого продукта до приготовления.',ready_to_eat_weight:'Указывайте фактически съеденную готовую массу.',drained_edible_weight:'Указывайте массу после полного слива жидкости.',as_sold_weight:'Указывайте массу продукта в том виде, в котором он приобретён.'})[basis]||'Проверьте, к какому состоянию относится введённая масса.';}
  function fatLabel(mode,method){
    if(mode==='included_in_variant')return 'добавленный жир уже учтён';
    if(mode==='none'&&(method==='pan_fried'||method==='fried_unspecified'||method==='deep_fried'||method==='air_fried'))return 'масло не учтено — добавьте отдельно, если использовали';
    if(mode==='none')return 'без добавленного жира';
    if(mode==='explicit_separate_ingredient')return 'масло учитывается отдельной строкой';
    return '';
  }
  function modifierLabels(meta){
    var out=[];
    if(!meta)return out;
    if(meta.doneness_state==='soft')out.push('всмятку');
    else if(meta.doneness_state==='hard')out.push('вкрутую');
    else if(meta.doneness_state==='medium')out.push('средняя степень готовности');
    if(meta.skin_state==='with_skin')out.push('с кожей');
    else if(meta.skin_state==='skinless')out.push('без кожи');
    if(meta.breading_state==='breaded')out.push('в панировке');
    else if(meta.breading_state==='unbreaded'&&(/fried/.test(meta.preparation_method)||meta.preparation_method==='pan_fried'))out.push('без панировки');
    if(meta.storage_state==='frozen')out.push('замороженный');
    else if(meta.storage_state==='chilled')out.push('охлаждённый');
    else if(meta.storage_state==='shelf_stable')out.push('длительного хранения');
    var fat=fatLabel(meta.added_fat_mode,meta.preparation_method);if(fat)out.push(fat);
    return out;
  }
  function variantOptionLabel(meta,product){
    var base=methodLabel(meta&&meta.preparation_method);
    if(meta&&meta.doneness_state==='soft')base='варёный всмятку';
    if(meta&&meta.doneness_state==='hard')base='варёный вкрутую';
    var mods=modifierLabels(meta).filter(function(x){return x!=='всмятку'&&x!=='вкрутую'&&x!=='без добавленного жира';});
    return base+(mods.length?' · '+mods.join(' · '):'')+(requiresManual(meta)?' · требует подтверждения':'');
  }
  function macro(p,g){var f=clamp(g,1,5000)/100;return {kcal:f*(Number(p&&p.kcal)||0),protein:f*(Number(p&&(p.protein_per_100g!=null?p.protein_per_100g:p.protein_g))||0),fat:f*(Number(p&&(p.fat_per_100g!=null?p.fat_per_100g:p.fat_g))||0),carbs:f*(Number(p&&(p.carbs_per_100g!=null?p.carbs_per_100g:p.carbs_g))||0)};}
  function trustLabel(p){
    var attr=p&&(p.source_attribution_v5_3_68||p.source_attribution_v5_3_69)||null,cls=String(attr&&attr.class||'').toLowerCase(),conf=String(attr&&attr.confidence||'').toUpperCase(),status=String(p&&p.nutrition_verification_status||'').toUpperCase(),exact=String(p&&p.source_exactness_class||'').toUpperCase();
    if(cls.indexOf('usda_fdc_mapped')>=0||status.indexOf('FDC_EXACT')>=0||status.indexOf('FNDDS_EXACT')>=0||status.indexOf('SR_LEGACY_EXACT')>=0)return 'Источник: сопоставлено с FoodData Central.';
    if(cls.indexOf('recipe_model')>=0)return 'Рецептурная модель: расчёт по ингредиентам.';
    if(cls.indexOf('label')>=0||status.indexOf('LABEL')>=0||exact.indexOf('LABEL')>=0)return 'КБЖУ по этикетке; часть микронутриентов может быть модельной.';
    if(cls.indexOf('logic_proxy')>=0||status.indexOf('PROXY')>=0||exact.indexOf('PROXY')>=0)return 'Логическая proxy-модель; подходит для ориентировочного расчёта.';
    if(conf==='HIGH')return 'Данные прошли внутреннюю проверку источника.';
    return 'Данные участвуют в расчёте; при клинически значимых решениях проверяйте источник.';
  }
  function constraintFromIntent(intent){return {preparation_method:intent.preparation_method,added_fat_mode:intent.added_fat_mode,skin_state:intent.skin_state,breading_state:intent.breading_state,drain_state:intent.drain_state,doneness_state:intent.doneness_state,storage_state:intent.storage_state,weight_basis:intent.weight_basis};}
  function selectionPlan(family,currentKey,query){
    var a=api(),m=matcher(),variants=a.listVariants(family.food_family_id),intent=m&&m.parseIntent?m.parseIntent({text:query}):null;
    if(intent&&intent.methodRequested){
      var r=a.resolveExactVariant(family.food_family_id,constraintFromIntent(intent));
      if(r.status==='exact'&&r.product)return {key:r.product.key,status:'exact',intent:intent,message:'По запросу выбран точный способ приготовления.',manualConfirmation:false};
      if(r.status==='exact_requires_confirmation'&&r.product)return {key:r.product.key,status:r.status,intent:intent,message:'Найден точный типовой или рецептурный профиль. Подтвердите его вручную: жир, соль либо другие ингредиенты уже входят в расчёт.',manualConfirmation:true};
      if(r.status==='compatible_method_class'||r.status==='ambiguous')return {key:'',status:r.status,intent:intent,message:'Способ приготовления распознан, но в семействе есть несколько совместимых вариантов. Выберите один вручную.',manualConfirmation:true};
      return {key:'',status:'not_found',intent:intent,message:'Точного варианта «'+methodLabel(intent.preparation_method)+'» в базе пока нет. Автоматическая подмена запрещена; выберите доступный вариант вручную.'};
    }
    if(variants.length>1)return {key:'',status:'choice_required',intent:intent,message:'Выберите способ приготовления и состояние массы. Без этого калькулятор не будет подставлять случайный вариант.'};
    var current=variants.find(function(x){return x.product&&x.product.key===currentKey;});
    if(current){var currentManual=requiresManual(current.meta);return {key:currentKey,status:'current',intent:intent,message:currentManual?'Этот профиль нельзя применять автоматически. Проверьте состояние продукта и подтвердите выбор отдельной кнопкой.':'',manualConfirmation:currentManual};}
    var ref=variants.find(function(x){return x.product&&x.product.key===family.reference_variant_key;})||variants[0];
    var refManual=!!(ref&&requiresManual(ref.meta));
    return {key:ref&&ref.product?ref.product.key:'',status:'reference',intent:intent,message:refManual?'Этот профиль нельзя применять автоматически. Проверьте состояние продукта и подтвердите выбор отдельной кнопкой.':'',manualConfirmation:refManual};
  }
  function optionsHtml(family,selectedKey,allowPlaceholder){
    var a=api(),variants=a.listVariants(family.food_family_id),html=allowPlaceholder?'<option value=""'+(!selectedKey?' selected':'')+'>Выберите способ приготовления</option>':'';
    variants.forEach(function(x){if(!x.product)return;html+='<option value="'+esc(x.product.key)+'"'+(x.product.key===selectedKey?' selected':'')+'>'+esc(variantOptionLabel(x.meta,x.product))+'</option>';});
    return html;
  }
  function variantDetailsHtml(meta,product){
    if(!meta||!product)return '<div class="preparation-family-warning">Выберите конкретный вариант, чтобы калькулятор использовал его собственные нутриенты и правильное основание массы.</div>';
    var mods=modifierLabels(meta),badges=['Основание: '+weightBasisLabel(meta.weight_basis),'Нутритивный класс: '+processClassLabel(meta.nutritional_process_class),'Расчёт: '+effectModeLabel(meta.nutrition_effect_mode)].concat(mods);
    var macro100=macro(product,100),confirm=requiresManual(meta)?'<div class="preparation-family-impact-warning"><strong>Нужно подтверждение.</strong> Это типовой или рецептурный вариант. Проверьте, что использованные масло, соль, панировка и другие ингредиенты соответствуют карточке; иначе внесите их отдельными строками.</div>':'';
    var summary=meta.nutritional_effect_summary_ru?'<div class="preparation-family-impact-summary">'+esc(meta.nutritional_effect_summary_ru)+'</div>':'';
    return '<div class="preparation-family-selected-name">В расчёт войдёт карточка: <strong>'+esc(productName(product))+'</strong></div><div class="preparation-family-impact-macros"><span>'+fmt1(macro100.kcal)+' ккал</span><span>Б '+fmt1(macro100.protein)+' г</span><span>Ж '+fmt1(macro100.fat)+' г</span><span>У '+fmt1(macro100.carbs)+' г</span><small>на 100 г выбранного состояния</small></div><div class="preparation-family-badges">'+badges.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>'+summary+'<div class="preparation-family-weight-note">'+esc(meta.weight_input_instruction_ru||weightInstruction(meta.weight_basis))+'</div>'+confirm;
  }
  function updateSearchCard(card,key,manualConfirmed){
    var a=api(),p=key&&window.DB&&window.DB.byKey?window.DB.byKey.get(key):null,meta=key?a.getVariantMeta(key):null;
    if(manualConfirmed===true)card.dataset.preparationManualConfirmed='1';else if(manualConfirmed===false)delete card.dataset.preparationManualConfirmed;
    var confirmed=card.dataset.preparationManualConfirmed==='1',needsConfirm=!!p&&requiresManual(meta)&&!confirmed,canAdd=!!p&&!needsConfirm;
    card.dataset.key=key||'';card.classList.toggle('preparation-family-needs-choice',!p||needsConfirm);card.classList.toggle('preparation-family-needs-confirmation',needsConfirm);
    var addButtons=card.querySelectorAll('[data-role="add-search"],[data-role="add-search-edit"],[data-role="add"]');Array.prototype.forEach.call(addButtons,function(b){b.disabled=!canAdd;b.setAttribute('aria-disabled',canAdd?'false':'true');if(b.getAttribute('data-role')==='add-search'||b.getAttribute('data-role')==='add')b.textContent=canAdd?'Добавить выбранный вариант':(needsConfirm?'Подтвердите выбранный профиль':'Сначала выберите вариант');});
    var details=card.querySelector('[data-preparation-family-details]');if(details)details.innerHTML=variantDetailsHtml(meta,p);
    if(!p)return;
    var gramsInput=card.querySelector('[data-role="grams"]'),g=clamp(gramsInput&&gramsInput.value,1,5000),m=macro(p,g),nut=card.querySelector('[data-role="portion"],.search-result-nutrients');
    if(nut)nut.innerHTML='<span>'+fmt1(m.kcal)+' ккал</span><span>Б '+fmt1(m.protein)+' г</span><span>Ж '+fmt1(m.fat)+' г</span><span>У '+fmt1(m.carbs)+' г</span>';
    var metaNode=card.querySelector('.search-result-meta,.meta');if(metaNode){var cat=typeof window.labelCatalog==='function'?window.labelCatalog(p.catalog_category_key||p.category||''):(p.catalog_category_key||p.category||''),hei=typeof window.labelHEI==='function'?window.labelHEI(p.hei_category_key||''):(p.hei_category_key||'');metaNode.textContent=[cat,hei].filter(Boolean).join(' · ');}
    var trust=card.querySelector('.search-result-trust');if(trust)trust.textContent=trustLabel(p);
    var weighing=card.querySelector('.search-result-weighing-note');if(!weighing){weighing=document.createElement('div');weighing.className='search-result-weighing-note';var anchor=card.querySelector('.search-result-trust');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(weighing,anchor);}
    weighing.textContent=p.weighing_instruction_ru||weightInstruction(meta&&meta.weight_basis);
  }
  function familyPanelHtml(family,plan){
    return '<div class="preparation-family-ui preparation-family-search-ui" data-preparation-family-ui="search"><div class="preparation-family-head"><div><span>Варианты одного продукта</span><strong>'+esc(family.family_display_name_ru)+'</strong></div><small>'+api().listVariants(family.food_family_id).length+' варианта</small></div><label class="preparation-family-select-label">Способ приготовления<select data-preparation-family-select>'+optionsHtml(family,plan.key,!plan.key)+'</select></label>'+(plan.message?'<div class="preparation-family-warning" data-preparation-plan-warning>'+esc(plan.message)+'</div>':'')+'<div data-preparation-family-details>'+variantDetailsHtml(plan.key?api().getVariantMeta(plan.key):null,plan.key&&window.DB&&window.DB.byKey?window.DB.byKey.get(plan.key):null)+'</div>'+(plan.manualConfirmation?'<button type="button" class="secondary preparation-family-confirm" data-preparation-confirm-profile>Подтвердить этот нутриентный профиль</button>':'')+'</div>';
  }
  function decorateSearchCard(card,family,query,currentKey){
    if(card.dataset.preparationFamilyDecorated==='1')return;
    var plan=selectionPlan(family,currentKey,query),title=card.querySelector('.search-result-title');
    card.dataset.preparationFamilyDecorated='1';card.dataset.preparationFamilyId=family.food_family_id;card.classList.add('preparation-family-search-card');
    if(title)title.innerHTML=esc(family.family_display_name_ru)+' <span class="preparation-family-count">способ приготовления</span>';
    var main=card.firstElementChild||card,meta=card.querySelector('.search-result-meta,.meta'),panel=document.createElement('div');panel.innerHTML=familyPanelHtml(family,plan);panel=panel.firstElementChild;
    if(meta&&meta.parentNode)meta.parentNode.insertBefore(panel,meta.nextSibling);else main.appendChild(panel);
    function bindConfirmationButton(button){if(!button)return;button.addEventListener('click',function(){var warn=panel.querySelector('[data-preparation-plan-warning]');if(warn)warn.remove();button.remove();updateSearchCard(card,select&&select.value||plan.key,true);});}
    var select=panel.querySelector('[data-preparation-family-select]');if(select)select.addEventListener('change',function(){var selectedMeta=api().getVariantMeta(select.value),manual=requiresManual(selectedMeta),warn=panel.querySelector('[data-preparation-plan-warning]'),confirm=panel.querySelector('[data-preparation-confirm-profile]');if(warn)warn.remove();if(confirm)confirm.remove();updateSearchCard(card,select.value,manual?false:true);if(manual){warn=document.createElement('div');warn.className='preparation-family-warning';warn.setAttribute('data-preparation-plan-warning','');warn.textContent='Этот профиль требует отдельного подтверждения: проверьте состояние продукта, состав и основание массы.';var details=panel.querySelector('[data-preparation-family-details]');if(details&&details.parentNode)details.parentNode.insertBefore(warn,details);confirm=document.createElement('button');confirm.type='button';confirm.className='secondary preparation-family-confirm';confirm.setAttribute('data-preparation-confirm-profile','');confirm.textContent='Подтвердить этот нутриентный профиль';panel.appendChild(confirm);bindConfirmationButton(confirm);}});var confirmProfile=panel.querySelector('[data-preparation-confirm-profile]');bindConfirmationButton(confirmProfile);
    var grams=card.querySelector('[data-role="grams"]');if(grams)grams.addEventListener('input',function(){updateSearchCard(card,card.dataset.key);});
    updateSearchCard(card,plan.key,plan.manualConfirmation===true?false:undefined);
  }
  function createSyntheticCard(family,query){
    var plan=selectionPlan(family,'',query),card=document.createElement('div');card.className='search-result-card preparation-family-synthetic-card';card.dataset.key=plan.key||'';
    card.innerHTML='<div><div class="search-result-title"></div><div class="search-result-meta"></div><div class="search-result-nutrients" data-role="portion"><span>— ккал</span><span>Б — г</span><span>Ж — г</span><span>У — г</span></div><div class="search-result-trust"></div></div><div class="search-result-actions"><label>Граммы</label><input type="number" min="1" max="5000" step="1" value="100" data-role="grams"><button type="button" data-role="add-search">Добавить выбранный вариант</button></div>';
    decorateSearchCard(card,family,query,plan.key);return card;
  }
  function scanSearch(){
    if(!enabled())return;var a=api(),root=document.getElementById('globalResults'),input=document.getElementById('globalSearchInput');if(!root||!input)return;var query=String(input.value||'').trim();
    var cards=Array.prototype.slice.call(root.querySelectorAll('.search-result-card:not([data-preparation-family-removed="1"])')),firstByFamily=new Map(),managed=0;
    cards.forEach(function(card){var key=card.dataset.key||'',family=a.getFamilyForProduct(key);if(!family)return;managed++;var fid=family.food_family_id;if(firstByFamily.has(fid)){card.dataset.preparationFamilyRemoved='1';card.remove();return;}firstByFamily.set(fid,card);decorateSearchCard(card,family,query,key);});
    if(!cards.length||(!root.querySelector('.search-result-card')&&query.length>=2)){
      var candidates=a.resolveFamilyCandidates(query);if(candidates.length){internalMutation=true;root.innerHTML='';candidates.slice(0,3).forEach(function(x){root.appendChild(createSyntheticCard(x.family,query));});internalMutation=false;}
    }
    var visible=root.querySelectorAll('.search-result-card').length,status=document.getElementById('globalSearchStatus');
    if(managed||root.querySelector('.preparation-family-search-card'))root.dataset.preparationFamilyGrouped='true';else delete root.dataset.preparationFamilyGrouped;
    if(status&&visible&&managed)status.textContent='Показано '+visible+' результатов. Связанные способы приготовления объединены в одну карточку продукта.';
  }
  function rowForCard(card){var mod=window.NutritionGeminiRationImport;if(!mod||typeof mod.getDraft!=='function')return null;var id=card.getAttribute('data-draft-id');return mod.getDraft().find(function(x){return x&&x.id===id;})||null;}
  function familyForRow(row){
    var a=api(),direct=row&&row.recognition&&row.recognition.food_family_id;if(direct&&a.getFamily(direct))return a.getFamily(direct);
    var byKey=row&&row.selectedKey&&a.getFamilyForProduct(row.selectedKey);if(byKey)return byKey;
    var pr=row&&(row.preparation_resolution||(row.candidates&&row.candidates.preparationResolution));if(pr&&pr.familyId&&a.getFamily(pr.familyId))return a.getFamily(pr.familyId);
    var c=(row&&row.candidates||[]).find(function(x){return x&&a.getFamilyForProduct(x.key);});return c?a.getFamilyForProduct(c.key):null;
  }
  function addCandidate(row,key,product,meta){
    if(!Array.isArray(row.candidates))row.candidates=[];var existing=row.candidates.find(function(x){return x&&x.key===key;});if(existing){existing.exactPreparationMatch=true;existing.matchReason='выбран вручную из семейства способов приготовления';return existing;}
    var c={key:key,name:productName(product),score:1,product:product,nutritionScore:null,matchReason:'выбран вручную из семейства способов приготовления',isAnalog:false,family:'',exactPreparationMatch:true,preparationResolution:{status:'exact',product:product,meta:meta,serverValidated:false,userSelected:true}};row.candidates.push(c);return c;
  }
  function applyRowVariant(card,row,family,key){
    var a=api(),product=window.DB&&window.DB.byKey?window.DB.byKey.get(key):null,meta=a.getVariantMeta(key);if(!product||!meta)return;
    addCandidate(row,key,product,meta);row.selectedKey=key;row.manualConfirmed=true;row.include=true;row.requires_user_confirmation=!!row.requires_user_confirmation;row.attribution_status='manually_confirmed';row.candidate_selection_reason='manual_family_variant';row.candidate_selection_margin=1;row.preparation_method=meta.preparation_method;row.preparation=methodLabel(meta.preparation_method);row.preparation_resolution={status:'exact',family:family,familyId:family.food_family_id,intent:{methodRequested:true,preparation_method:meta.preparation_method},exactKey:key,candidates:[],requiresConfirmation:false,resolution:{status:'exact',product:product,meta:meta,userSelected:true}};
    row.recognition=row.recognition||{};row.recognition.food_family_id=family.food_family_id;row.recognition.product_family_hint=family.food_family_id;row.recognition.preparation_method=meta.preparation_method;row.recognition.preparation_state=methodLabel(meta.preparation_method);row.recognition.preparation_confidence=1;row.recognition.added_fat_mode=meta.added_fat_mode;row.recognition.skin_state=meta.skin_state;row.recognition.breading_state=meta.breading_state;row.recognition.drain_state=meta.drain_state;row.recognition.doneness_state=meta.doneness_state;row.recognition.storage_state=meta.storage_state;row.recognition.weight_basis_hint=meta.weight_basis;row.recognition.exact_variant_key=key;row.recognition.nutritional_process_class=meta.nutritional_process_class;row.recognition.nutrition_effect_mode=meta.nutrition_effect_mode;row.recognition.automatic_selection_policy=meta.automatic_selection_policy;row.recognition.nutritional_effect_dimensions=(meta.nutritional_effect_dimensions||[]).slice();row.recognition.preparation_match_status='exact';
    var productSelect=card.querySelector('[data-role="product"]');if(productSelect){var opt=Array.prototype.slice.call(productSelect.options).find(function(o){return o.value===key;});if(!opt){opt=document.createElement('option');opt.value=key;opt.textContent=productName(product)+' · выбранный вариант приготовления';productSelect.appendChild(opt);}productSelect.value=key;productSelect.dispatchEvent(new Event('change',{bubbles:true}));}
    var detail=card.querySelector('[data-preparation-family-details]');if(detail)detail.innerHTML=variantDetailsHtml(meta,product);
    var warning=card.querySelector('[data-preparation-plan-warning]');if(warning)warning.remove();
  }
  function decorateGeminiCard(card,row,family){
    if(card.dataset.preparationFamilyGeminiDecorated==='1')return;card.dataset.preparationFamilyGeminiDecorated='1';card.dataset.preparationFamilyId=family.food_family_id;
    var resolution=row.preparation_resolution||(row.candidates&&row.candidates.preparationResolution)||null;var hasExactMethod=!!(resolution&&resolution.status==='exact'&&resolution.exactKey);var requiresExactConfirmation=!!(resolution&&resolution.status==='exact_requires_confirmation'&&resolution.exactKey);
    var current=hasExactMethod&&row.selectedKey&&api().getFamilyForProduct(row.selectedKey)&&api().getFamilyForProduct(row.selectedKey).food_family_id===family.food_family_id?row.selectedKey:'';
    if(!current&&hasExactMethod&&row.recognition&&row.recognition.exact_variant_key&&api().getVariantMeta(row.recognition.exact_variant_key))current=row.recognition.exact_variant_key;
    if(requiresExactConfirmation){current='';row.manualConfirmed=false;row.requires_user_confirmation=true;row.include=false;}
    if(!current&&api().listVariants(family.food_family_id).length>1){row.selectedKey='';row.manualConfirmed=false;row.requires_user_confirmation=true;row.include=false;var ps=card.querySelector('[data-role="product"]');if(ps){ps.value='';ps.dispatchEvent(new Event('change',{bubbles:true}));}row.include=false;}
    var panel=document.createElement('div');panel.className='preparation-family-ui preparation-family-gemini-ui';panel.setAttribute('data-preparation-family-ui','gemini');
    panel.innerHTML='<div class="preparation-family-head"><div><span>Уточнение для расчёта</span><strong>'+esc(family.family_display_name_ru)+'</strong></div><small>выберите фактический вариант</small></div><label class="preparation-family-select-label">Способ приготовления<select data-preparation-family-select>'+optionsHtml(family,current,true)+'</select></label>'+(!current?'<div class="preparation-family-warning" data-preparation-plan-warning>Gemini не выбрал однозначный вариант. До ручного выбора позиция не попадёт в рацион.</div>':'')+'<div data-preparation-family-details>'+variantDetailsHtml(current?api().getVariantMeta(current):null,current&&window.DB&&window.DB.byKey?window.DB.byKey.get(current):null)+'</div>';
    var anchor=card.querySelector('.gemini-ration-draft-row__controls');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor);else card.appendChild(panel);
    var select=panel.querySelector('[data-preparation-family-select]');if(select)select.addEventListener('change',function(){if(select.value)applyRowVariant(card,row,family,select.value);});
    var productSelect=card.querySelector('[data-role="product"]');if(productSelect)productSelect.addEventListener('change',function(){setTimeout(function(){var fam=api().getFamilyForProduct(productSelect.value);if(fam&&fam.food_family_id===family.food_family_id){select.value=productSelect.value;var meta=api().getVariantMeta(productSelect.value),p=window.DB.byKey.get(productSelect.value),detail=panel.querySelector('[data-preparation-family-details]');if(detail)detail.innerHTML=variantDetailsHtml(meta,p);}else if(fam&&fam.food_family_id!==family.food_family_id){panel.remove();card.dataset.preparationFamilyGeminiDecorated='0';card.removeAttribute('data-preparation-family-id');queue();}},0);});
  }
  function scanGemini(){if(!enabled())return;var root=document.getElementById('geminiRationDraftRows');if(!root)return;Array.prototype.slice.call(root.querySelectorAll('.gemini-ration-draft-row[data-draft-id]')).forEach(function(card){var row=rowForCard(card);if(!row)return;var family=familyForRow(row);if(family)decorateGeminiCard(card,row,family);});}
  function scan(){if(!enabled())return;scanSearch();scanGemini();}
  function queue(){if(scanTimer)return;scanTimer=setTimeout(function(){scanTimer=0;if(!internalMutation)scan();},20);}
  function install(){
    if(installed)return;installed=true;scan();
    var root=document.body;if(root&&typeof MutationObserver!=='undefined'){observer=new MutationObserver(function(records){if(internalMutation)return;for(var i=0;i<records.length;i++){var target=records[i].target,inside=target&&target.nodeType===1&&target.closest&&target.closest('#globalResults,#geminiRationDraftRows');if(inside||(records[i].addedNodes&&Array.prototype.some.call(records[i].addedNodes,function(n){return n&&n.nodeType===1&&(n.matches&&n.matches('#globalResults,#geminiRationDraftRows,.search-result-card,.gemini-ration-draft-row')||n.querySelector&&n.querySelector('.search-result-card,.gemini-ration-draft-row'));}))){queue();break;}}});observer.observe(root,{childList:true,subtree:true});}
    var input=document.getElementById('globalSearchInput'),grams=document.getElementById('globalSearchGrams');if(input){input.addEventListener('input',function(){setTimeout(queue,0);},true);}if(grams)grams.addEventListener('input',function(){setTimeout(queue,0);},true);
    document.addEventListener('click',function(e){var btn=e.target&&e.target.closest&&e.target.closest('.preparation-family-search-card [data-role="add-search"],.preparation-family-search-card [data-role="add"]');if(!btn)return;var card=btn.closest('.search-result-card');e.preventDefault();e.stopImmediatePropagation();if(!card||!card.dataset.key||card.classList.contains('preparation-family-needs-confirmation')){var sel=card&&card.querySelector('[data-preparation-family-select]');if(sel)sel.focus();return;}var grams=card.querySelector('[data-role="grams"]'),g=clamp(grams&&grams.value,1,5000);if(window.State&&typeof window.State.add==='function')window.State.add(card.dataset.key,g);},true);
    try{window.dispatchEvent(new CustomEvent('nutrition:preparationfamilyuiready',{detail:{version:VERSION}}));}catch(_){}
  }
  var exported={version:VERSION,enabled:true,methodLabel:methodLabel,weightBasisLabel:weightBasisLabel,weightInstruction:weightInstruction,processClassLabel:processClassLabel,effectModeLabel:effectModeLabel,fatLabel:fatLabel,modifierLabels:modifierLabels,variantOptionLabel:variantOptionLabel,selectionPlan:selectionPlan,scan:scan,scanSearch:scanSearch,scanGemini:scanGemini};try{Object.freeze(exported);}catch(_){}window.NutritionPreparationFamilyUI=exported;
  if(window.addEventListener){window.addEventListener('nutrition:preparationfamilyready',function(){install();queue();});window.addEventListener('nutrition:preparationmatchingready',function(){install();queue();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  (function retryInstall(n){if(installed)return;install();if(!installed&&n<60)setTimeout(function(){retryInstall(n+1);},100);})(0);
})();
