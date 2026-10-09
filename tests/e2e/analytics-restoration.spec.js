const {test,expect}=require('./fixtures');

test('real loaded calculator renders progressive analytics and verified-source dialog',async({page,loadApp})=>{
  await page.setViewportSize({width:1280,height:900});
  await loadApp();
  await expect(page.locator('#nutritionInsightDashboard')).toBeAttached({timeout:20000});
  await expect(page.locator('#arNeedsExtra')).toBeVisible();
  await expect(page.locator('#arBody')).toContainText('Графики появятся');
  await page.locator('#arMealSplit').selectOption('3|30,40,30');
  await expect(page.locator('#needs_split')).toHaveValue('3|30,40,30');

  const key=await page.evaluate(()=>{
    const list=window.DB&&window.DB.items||[];
    const p=list.find(x=>x&&x.key&&x.hidden_from_search!==true&&
      Number(x.protein_per_100g)>0&&Number(x.kcal)>0);
    if(!p||!window.State||typeof window.State.add!=='function')
      throw new Error('Sample product or canonical State API unavailable');
    window.State.add(p.key,100);
    return p.key;
  });
  expect(key).toBeTruthy();

  await page.waitForFunction(()=>{
    const vm=window.NutritionAnalysisWorkspaceHF7&&window.NutritionAnalysisWorkspaceHF7.getViewModel();
    return vm&&vm.items>0&&!!document.querySelector('#arBody .ar-metrics');
  },null,{timeout:18000});
  await expect(page.locator('#arBody .ar-metric')).toHaveCount(5);
  await expect(page.locator('#arBody')).toContainText('Нутриенты и минералы');
  await expect(page.locator('#arBody')).toContainText('Качество × структура');
  await expect(page.locator('#nutritionInsightDashboard')).toBeVisible();
  const heiRows=await page.evaluate(()=>{
    const rows=window.NutritionAnalysisWorkspaceHF7.getViewModel().hei.rows||[];
    return rows.filter(x=>Array.isArray(x.contributors&&x.contributors.positive)&&x.contributors.positive.length).map(x=>x.key);
  });
  expect(heiRows.length).toBeGreaterThan(0);
  await expect(page.locator('#arBody [data-ar-hei-key="'+heiRows[0]+'"] .ar-contributor-entry').first()).toBeAttached();
  await expect(page.locator('#arBody .ar-hei-jump')).toHaveCount(13);

  // Open the first nutrient with a defined source lookup using normal user controls.
  const source=page.locator('#arBody [data-ar-source-key]').first();
  await expect(source).toBeAttached();
  const outer=page.locator('#arBody details.ar-group').filter({has:page.locator('[data-ar-source-key]')}).first();
  const inner=page.locator('#arBody details.ar-detail-row').filter({has:page.locator('[data-ar-source-key]')}).first();
  if(!(await outer.evaluate(node=>node.open)))await outer.locator(':scope > summary').click();
  if(!(await inner.evaluate(node=>node.open)))await inner.locator(':scope > summary').click();
  await expect(source).toBeVisible({timeout:12000});
  await source.click({timeout:10000});
  await expect(page.locator('#arFoodSourcesDialog')).toBeVisible();
  await expect(page.locator('#arSourcesIntro')).toContainText('Проверено');
  await expect(page.locator('#arSourcesSearch')).toBeVisible();
  await page.locator('#arFoodSourcesDialog [data-ar-close]').click();
  await expect(page.locator('#arFoodSourcesDialog')).toBeHidden();
});

test('mobile analytics remain within viewport and source lookup is keyboard reachable',async({page,loadApp})=>{
  await page.setViewportSize({width:390,height:844});
  await loadApp();
  await expect(page.locator('#arNeedsExtra')).toBeVisible();
  await expect(page.locator('#arMealSplit')).toBeVisible();
  const metrics=await page.evaluate(()=>{
    const root=document.documentElement;
    return {client:root.clientWidth,scroll:root.scrollWidth,sourceExists:!!window.NutritionNutrientSourceExplorer};
  });
  expect(metrics.sourceExists).toBe(true);
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+2);
});


test('calculated profile exposes real water reference and full print report is generated from canonical model',async({page,loadApp})=>{
  await page.setViewportSize({width:1280,height:900});
  await loadApp();
  const sex=page.locator('#needs_sex');
  if(!(await sex.isVisible())){
    const toggle=page.locator('#v40NeedsToggle');
    if(await toggle.count())await toggle.click();
  }
  await expect(sex).toBeVisible();
  await sex.selectOption('female');
  await page.fill('#needs_age','42');
  await page.fill('#needs_h','168');
  await page.fill('#needs_w','64');
  await page.selectOption('#needs_activity','moderate');
  const before=await page.evaluate(()=>({
    primaryDisabled:document.querySelector('#profileCalculateContinue')?.disabled,
    canonicalDisabled:document.querySelector('#needs_calc_btn')?.disabled,
    sex:document.querySelector('#needs_sex')?.value,
    age:document.querySelector('#needs_age')?.value,
    height:document.querySelector('#needs_h')?.value,
    weight:document.querySelector('#needs_w')?.value,
    activity:document.querySelector('#needs_activity')?.value,
    state:document.documentElement.getAttribute('data-profile-calculation-state')
  }));
  console.log('PROFILE_CALC_PRECHECK',JSON.stringify(before));
  if(test.info().project.name==='webkit')await page.evaluate(()=>{
    window.__webKitCalcProbe=[];
    window.addEventListener('click',event=>{
      const target=event.target;
      const btn=target&&target.closest?target.closest('#profileCalculateContinue,#needs_calc_btn'):null;
      if(btn)window.__webKitCalcProbe.push({id:btn.id,time:Date.now(),disabled:btn.disabled});
    },true);
    document.addEventListener('needs:computed',()=>window.__webKitCalcProbe.push({id:'computed',time:Date.now()}));
  });

  await page.locator('#profileCalculateContinue').click();
  const after=await page.evaluate(()=>({
    needsOk:window.__lastNeedsMeta?.ok,
    canonicalDisabled:document.querySelector('#needs_calc_btn')?.disabled,
    state:document.documentElement.getAttribute('data-profile-calculation-state')
  }));
  console.log('PROFILE_CALC_POSTCHECK',JSON.stringify(after));
  if(test.info().project.name==='webkit'&&!after.needsOk){
    const diag=await page.evaluate(()=>{
      const events=window.__webKitCalcProbe||[];
      const direct=document.getElementById('needs_calc_btn');
      if(direct&&!direct.disabled)direct.click();
      return {events,afterDirect:window.__lastNeedsMeta?.ok,afterDirectState:document.documentElement.getAttribute('data-profile-calculation-state')};
    });
    console.log('WEBKIT_CLICK_DIAGNOSTIC',JSON.stringify(diag));
  }
  expect(after.needsOk).toBe(true);

  await page.waitForFunction(()=>window.__lastNeedsMeta&&window.__lastNeedsMeta.ok===true,{},{timeout:18000});

  const reference=await page.evaluate(()=>({
    water:window.__lastNeedsMeta.waterReference,
    state:document.documentElement.getAttribute('data-profile-calculation-state')
  }));
  expect(reference.state).toBe('current');
  await expect(page.locator('#arNeedsExtra .ar-water')).toContainText('Общее поступление воды');
  const expected=reference.water.valueL?Number(reference.water.valueL).toLocaleString('ru-RU',{maximumFractionDigits:1}):null;
  if(expected)await expect(page.locator('#arNeedsExtra .ar-water')).toContainText(expected);

  await page.evaluate(()=>{
    const food=window.DB.items.find(p=>p&&p.kcal>0&&p.protein_per_100g>0&&p.hidden_from_search!==true);
    if(!food)throw new Error('No test food in real catalog');
    window.State.add(food.key,150);
  });
  await page.waitForFunction(()=>document.querySelector('#arBody .ar-primary .ar-metrics'),null,{timeout:18000});
  const printResult=await page.evaluate(()=>{
    let printed=null,count=0;
    const previous=window.open;
    window.open=()=>({
      document:{open(){},write(html){printed=html;},close(){},body:{textContent:''}},
      focus(){},setTimeout(fn){fn();},print(){count++;}
    });
    let ok;
    try{ok=window.NutritionAnalyticsRestorationV1.print();}finally{window.open=previous;}
    return {ok,count,html:printed};
  });
  expect(printResult.ok).toBe(true);
  expect(printResult.count).toBe(1);
  expect(printResult.html).toContain('workspace-report-cover');
  expect(printResult.html).toContain('Наглядный разбор показателей');
  expect(printResult.html).toContain('Показатели');
  expect(printResult.html.indexOf('workspace-report-cover')).toBeLessThan(printResult.html.indexOf('Наглядный разбор показателей'));
  expect(printResult.html).not.toMatch(/<button[^>]+data-ar-source-key/);
  if(test.info().project.name==='chromium'){
    const preview=await page.context().newPage();
    try{
      await preview.setContent(printResult.html,{waitUntil:'domcontentloaded'});
      const pdf=await preview.pdf({format:'A4',printBackground:true});
      expect(pdf.subarray(0,4).toString()).toBe('%PDF');
      expect(pdf.length).toBeGreaterThan(8000);
    }finally{await preview.close();}
  }
});
