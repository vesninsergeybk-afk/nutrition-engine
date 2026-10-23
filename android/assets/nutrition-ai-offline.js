// Offline photo recognition preserves the existing consent/confirmation workflow.
// Labels from a small, bundled ML Kit model are suggestions only: no meal mass
// or nutrient amounts are inferred from a photograph.
export function createRecognitionPanel({root,getDraft,setDraft,onSelect,isAllowed}) {
  const $=s=>root.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>{const s=String(v).trim().replace(',','.');return /^(?:\d+\.?\d*|\.\d+)$/.test(s)?Number(s):NaN;};
  const foodLabels=new Map(Object.entries({
    apple:'яблоко',banana:'банан',orange:'апельсин',pear:'груша',
    strawberry:'клубника',grape:'виноград',watermelon:'арбуз',
    lemon:'лимон',pineapple:'ананас',avocado:'авокадо',
    broccoli:'брокколи',carrot:'морковь',tomato:'помидор',
    cucumber:'огурец',potato:'картофель',onion:'лук',
    egg:'яйцо',bread:'хлеб',rice:'рис',pasta:'макароны',
    pizza:'пицца',hamburger:'гамбургер',sandwich:'сэндвич',
    salad:'салат',soup:'суп',steak:'стейк',chicken:'курица',
    fish:'рыба',cheese:'сыр',milk:'молоко',yogurt:'йогурт',
    pancake:'блины',sushi:'суши',cake:'торт',cookie:'печенье',
    chocolate:'шоколад',coffee:'кофе',tea:'чай',
    oatmeal:'овсяная каша',porridge:'каша',nuts:'орехи'
  }));
  const status=$('#nutrition-ai-status');
  let pending=false;

  function render(){
    $('#nutrition-ai-draft').innerHTML=(getDraft()||[]).map((item,index)=>
      '<div class="nut-ai-item"><strong>'+esc(item.name)+'</strong>'
      +'<p class="nut-hint">Предварительная подсказка по фото. Проверьте название, приготовление и массу.</p>'
      +'<label for="ai-quantity-'+index+'">Количество, г'
      +'<input id="ai-quantity-'+index+'" inputmode="decimal" data-ai-quantity="'+index+'" '
      +'value="'+(item.grams==null?'':item.grams)+'" required></label>'
      +'<button class="vm-button" type="button" data-ai-select="'+index+'">Найти и подтвердить продукт</button></div>'
    ).join('');
  }

  function asBase64(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('Фотография не прочитана'));
      reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
      reader.readAsDataURL(file);
    });
  }

  function recognize(base64){
    return new Promise((resolve,reject)=>{
      const requestId=String(Date.now())+'-'+Math.random().toString(36).slice(2);
      const timer=setTimeout(()=>{cleanup();reject(new Error('Время локального распознавания истекло.'));},20000);
      const listener=event=>{
        if(event.detail?.id!==requestId)return;
        cleanup();event.detail.error?reject(new Error(event.detail.error)):resolve(event.detail.labels||[]);
      };
      function cleanup(){clearTimeout(timer);window.removeEventListener('nutrient-photo-result',listener);}
      window.addEventListener('nutrient-photo-result',listener);
      try{window.NutrientNative.classifyPhoto(requestId,base64);}
      catch(error){cleanup();reject(error);}
    });
  }

  $('#nutrition-ai-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(pending)return;
    const button=event.currentTarget.querySelector('button[type=submit]');
    try {
      if(!isAllowed())throw new Error('В этом профиле распознавание недоступно.');
      if(!window.NutrientNative?.classifyPhoto)throw new Error('Локальная модель доступна только в приложении Android.');
      const files=[...$('#nutrition-ai-files').files];
      if(files.length!==1 || !files[0].type.startsWith('image/') || files[0].size>1700000)
        throw new Error('Выберите одну фотографию размером до 1,7 МБ.');
      pending=true;button.disabled=true;
      status.textContent='Обрабатываю фотографию на устройстве…';
      const labels=await recognize(await asBase64(files[0]));
      const drafts=[];
      for(const label of labels){
        const raw=String(label.text||'').toLowerCase().trim();
        const value=foodLabels.get(raw);
        if(value && Number(label.confidence)>=0.55 && !drafts.some(it=>it.name===value))
          drafts.push({name:value,grams:null,preparation:'Не определено',userEdited:false});
      }
      const context=$('#nutrition-ai-context').value.trim();
      if(context && !drafts.length){
        drafts.push({name:context.slice(0,200),grams:null,preparation:'Указано пользователем',userEdited:false});
      }
      setDraft(drafts.slice(0,4));render();
      status.textContent=drafts.length
        ?'Есть предварительные варианты. Уточните продукт в справочнике и обязательно введите количество.'
        :'Определить конкретный продукт не удалось. Введите название в поле поиска вручную.';
    } catch(error) {
      status.textContent=(error.message||'Ошибка локального распознавания.')+' Ручной ввод доступен.';
    } finally {
      pending=false;button.disabled=false;
    }
  });

  root.addEventListener('input',event=>{
    const index=event.target.dataset.aiQuantity;if(index==null)return;
    const grams=number(event.target.value);
    if(!Number.isFinite(grams)||grams<=0||grams>100000){
      event.target.setCustomValidity('Введите количество больше 0 и до 100 000 г.');return;
    }
    event.target.setCustomValidity('');
    const draft=structuredClone(getDraft()||[]);
    if(draft[Number(index)]){
      draft[Number(index)].grams=grams;draft[Number(index)].userEdited=true;setDraft(draft);
    }
  });

  root.addEventListener('click',event=>{
    const selected=event.target.closest('[data-ai-select]');if(!selected)return;
    const index=Number(selected.dataset.aiSelect),input=$('#ai-quantity-'+index);
    if(!input?.reportValidity()||!Number.isFinite(number(input.value)))return;
    const item=(getDraft()||[])[index];
    if(item)onSelect({...item,grams:number(input.value),index});
  });
  render();return {render};
}
