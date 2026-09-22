const { test, expect } = require('./fixtures');
const AxeBuilder = require('@axe-core/playwright').default;

async function calculateNeeds(page){
  await page.fill('#needs_person_name','Иван Иванов');
  await page.selectOption('#needs_sex','male');
  await page.fill('#needs_h','175'); await page.fill('#needs_w','74'); await page.fill('#needs_age','45');
  await page.selectOption('#needs_state','normal'); await page.selectOption('#needs_activity','low'); await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await page.waitForFunction(()=>window.__lastNeedsProfileApplied===true&&!!window.__lastNeedsMeta);
}
async function addProduct(page,query,grams){
  await page.evaluate(({query,grams})=>{
    const p=(window.DB.items||[]).find(x=>String(x.name_ru||x.name||'').toLowerCase().includes(query));
    if(!p)throw new Error('product not found: '+query);
    window.State.add(p.key,grams);
  },{query,grams});
}
async function prepare(page){
  await calculateNeeds(page);
  await addProduct(page,'масло сливочное',100);
  await addProduct(page,'сыр',180);
  await addProduct(page,'хлеб',300);
  await addProduct(page,'куриная грудка',300);
  await addProduct(page,'банан',300);
  await page.waitForFunction(()=>window.NutritionAnalysisWorkspaceHF7&&window.NutritionAnalysisWorkspaceHF7.getViewModel().items>=5);
  await page.evaluate(()=>window.NavigationShellV1.navigate('correction'));
  await page.waitForFunction(()=>window.WorkspaceCorrectionHF11&&window.WorkspaceCorrectionHF11.getModel().priorities.length>0);
  await page.waitForTimeout(300);
}

test.describe('HF11 final Improve polish',()=>{
  test('meaningful scenario is automatic, guarded and reversible when available',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844}); await loadApp(); await prepare(page);
    await expect(page.locator('#workspaceCorrectionPanel')).toBeVisible();
    await expect(page.locator('#heiPanel')).toBeHidden(); await expect(page.locator('#geminiAiSection')).toBeHidden();
    await expect(page.locator('#navigationShellCorrectionLinks')).toBeHidden();
    const model=await page.evaluate(()=>{const m=window.WorkspaceCorrectionHF11.getModel();return {count:m.priorities.length,active:m.active&&m.active.id,ready:m.active&&!!m.active.readyRef};});
    expect(model.count).toBeGreaterThan(0); expect(model.count).toBeLessThanOrEqual(3);
    await expect(page.locator('#workspaceCorrectionWorkbenchTitle')).toHaveText('Проверить изменение');
    await expect(page.locator('.workspace-correction-priority-chip')).toHaveCount(Math.max(0,model.count-1));

    const scenario=await page.evaluate(()=>{const s=window.WorkspaceCorrectionHF11.getScenario();return s&&{op:s.operations[0],target:s.targetResult,portion:s.portionCheck,verdict:window.WorkspaceCorrectionHF11.getVerdict(s)};});
    if(!scenario){
      await expect(page.locator('.workspace-correction-no-simple')).toBeVisible();
      await expect(page.locator('[data-correction-apply]')).toHaveCount(0);
    }else{
      expect(scenario.target.meaningful).toBe(true); expect(scenario.portion.ok).toBe(true); expect(scenario.verdict.candidate).toBe(true);
      const before=await page.evaluate(ref=>Number(window.State.get().find(i=>String(i.id||i.key)===ref||String(i.key)===ref).grams),scenario.op.ref);
      expect(before).toBe(scenario.op.gramsBefore);
      await expect(page.locator('[data-correction-apply]')).toBeVisible();
      await page.locator('[data-correction-apply]').click();
      await page.waitForFunction(()=>!!window.WorkspaceCorrectionHF11.getLastApplied());
      const changed=await page.evaluate(ref=>Number(window.State.get().find(i=>String(i.id||i.key)===ref||String(i.key)===ref).grams),scenario.op.ref);
      expect(changed).toBe(scenario.op.gramsAfter);
      await page.locator('[data-correction-undo]').click();
      await page.waitForFunction(()=>!window.WorkspaceCorrectionHF11.getLastApplied());
      const restored=await page.evaluate(ref=>Number(window.State.get().find(i=>String(i.id||i.key)===ref||String(i.key)===ref).grams),scenario.op.ref);
      expect(restored).toBe(before);
    }
    const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client+1);
  });

  test('manual no-op and excessive changes cannot be applied',async({page,loadApp})=>{
    await loadApp(); await prepare(page);
    await page.locator('[data-correction-manual]').click();
    await expect(page.locator('.workspace-correction-manual')).toBeVisible();
    const original=Number(await page.locator('#workspaceCorrectionGrams').inputValue());
    await page.locator('#workspaceCorrectionGrams').fill(String(original));
    await page.waitForTimeout(350);
    await expect(page.locator('.workspace-correction-decision')).toBeVisible();
    await expect(page.locator('[data-correction-apply]')).toHaveCount(0);
    await expect(page.locator('.workspace-correction-next')).toContainText(/Не применять|не решает/i);

    await page.locator('#workspaceCorrectionGrams').fill('1');
    await page.waitForTimeout(350);
    const result=await page.evaluate(()=>{const s=window.WorkspaceCorrectionHF11.getScenario();return {portion:s&&s.portionCheck,verdict:s&&window.WorkspaceCorrectionHF11.getVerdict(s)};});
    expect(result.portion.ok).toBe(false); expect(result.verdict.applyAllowed).toBe(false);
    await expect(page.locator('[data-correction-apply]')).toHaveCount(0);
  });

  test('correction route has no serious accessibility violations',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844}); await loadApp(); await prepare(page);
    for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
      await page.setViewportSize(viewport); await page.waitForTimeout(250);
      const results=await new AxeBuilder({page}).analyze();
      const serious=results.violations.filter(v=>['serious','critical'].includes(v.impact));
      expect(serious,serious.map(v=>v.id+': '+v.help).join('\n')).toEqual([]);
      const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client+1);
    }
  });

  test('methodology and legacy AI are separate secondary actions',async({page,loadApp})=>{
    await loadApp(); await prepare(page);
    await expect(page.locator('.workspace-correction-method summary')).toHaveText('Как рассчитан вариант');
    await expect(page.locator('[data-open-legacy-ai]')).toHaveText(/ИИ/);
    await page.locator('[data-open-legacy-ai]').click();
    await page.waitForFunction(()=>window.NavigationShellV1.getState().mode==='long');
    await expect(page.locator('#geminiAiSection')).toBeVisible();
  });
});
