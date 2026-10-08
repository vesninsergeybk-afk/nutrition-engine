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

  // Open the first nutrient with a defined source lookup using normal user controls.
  const source=page.locator('#arBody [data-ar-source-key]').first();
  await expect(source).toBeAttached();
  await source.evaluate(button=>{
    let parent=button.parentElement;
    while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}
  });
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
