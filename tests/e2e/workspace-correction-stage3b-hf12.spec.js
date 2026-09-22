const { test, expect } = require('./fixtures');

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
  await addProduct(page,'сыр российский',180);
  await addProduct(page,'хлеб',300);
  await addProduct(page,'куриная грудка',300);
  await addProduct(page,'банан',150);
  await page.waitForFunction(()=>window.NutritionAnalysisWorkspaceHF7&&window.NutritionAnalysisWorkspaceHF7.getViewModel().items>=5);
  await page.evaluate(()=>window.NavigationShellV1.navigate('correction'));
  await page.waitForFunction(()=>window.WorkspaceCorrectionHF11&&window.WorkspaceCorrectionStage3BHF12&&window.WorkspaceCorrectionHF11.getModel().priorities.length>0);
}
async function selectPriority(page,direction,key){
  const id=await page.evaluate(({direction,key})=>{
    const m=window.WorkspaceCorrectionHF11.getModel();
    const p=m.priorities.find(x=>(!direction||x.direction===direction)&&(!key||x.key===key));
    if(!p)return '';
    if(m.active&&m.active.id===p.id)return p.id;
    const btn=document.querySelector(`[data-correction-priority="${CSS.escape(p.id)}"]`);
    if(btn)btn.click();
    return p.id;
  },{direction,key});
  expect(id).not.toBe('');
  await page.waitForFunction(id=>window.WorkspaceCorrectionHF11.getModel().active&&window.WorkspaceCorrectionHF11.getModel().active.id===id,id);
}
async function forceQuantityNoop(page){
  const manual=page.locator('[data-correction-manual]');
  if(await manual.count()){
    if(!(await page.locator('.workspace-correction-manual').isVisible().catch(()=>false)))await manual.click();
    const original=await page.evaluate(()=>window.WorkspaceCorrectionHF11.getModel().contributor&&window.WorkspaceCorrectionHF11.getModel().contributor.grams);
    await page.locator('#workspaceCorrectionGrams').fill(String(original));
  }
  await page.waitForTimeout(350);
  await expect(page.locator('#workspaceCorrectionAlternative')).toBeVisible();
}
async function openCandidates(page){
  const open=page.locator('[data-stage3b-open]');
  if(await open.count())await open.click();
  await page.waitForFunction(()=>window.WorkspaceCorrectionStage3BHF12.getCandidates().length>0);
  const count=await page.evaluate(()=>window.WorkspaceCorrectionStage3BHF12.getCandidates().length);
  expect(count).toBeGreaterThan(0); expect(count).toBeLessThanOrEqual(3);
}
async function applySelected(page){
  if(await page.locator('[data-stage3b-review]').count())await page.locator('[data-stage3b-review]').click();
  await expect(page.locator('[data-stage3b-apply]')).toBeVisible();
  await page.locator('[data-stage3b-apply]').click();
  await page.waitForFunction(()=>!!window.WorkspaceCorrectionStage3BHF12.getLastApplied());
}

test.describe('HF12 Stage 3B minimal alternatives',()=>{
  test('replacement is previewed, applied and undone as one operation',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844}); await loadApp(); await prepare(page);
    await selectPriority(page,'reduce'); await forceQuantityNoop(page); await openCandidates(page);
    const selected=await page.evaluate(()=>{
      const c=window.WorkspaceCorrectionStage3BHF12.getCandidates()[0].scenario,op=c.operations[0];
      return {type:op.type,sourceKey:op.sourceKey,newKey:op.productKey};
    });
    expect(selected.type).toBe('replace_item');
    await applySelected(page);
    const applied=await page.evaluate(({sourceKey,newKey})=>({source:window.State.get().some(x=>x.key===sourceKey),added:window.State.get().some(x=>x.key===newKey)}),selected);
    expect(applied.source).toBe(false); expect(applied.added).toBe(true);
    await page.locator('[data-stage3b-undo]').click();
    await page.waitForFunction(()=>!window.WorkspaceCorrectionStage3BHF12.getLastApplied());
    const restored=await page.evaluate(({sourceKey,newKey})=>({source:window.State.get().some(x=>x.key===sourceKey),added:window.State.get().some(x=>x.key===newKey)}),selected);
    expect(restored.source).toBe(true); expect(restored.added).toBe(false);
  });

  test('addition uses one plausible product and can be undone',async({page,loadApp})=>{
    await loadApp(); await prepare(page); await selectPriority(page,'increase','fiber_g'); await forceQuantityNoop(page); await openCandidates(page);
    const selected=await page.evaluate(()=>{const op=window.WorkspaceCorrectionStage3BHF12.getCandidates()[0].scenario.operations[0];return {type:op.type,key:op.productKey};});
    expect(selected.type).toBe('add_item');
    await applySelected(page);
    expect(await page.evaluate(key=>window.State.get().some(x=>x.key===key),selected.key)).toBe(true);
    await page.locator('[data-stage3b-undo]').click();
    await page.waitForFunction(()=>!window.WorkspaceCorrectionStage3BHF12.getLastApplied());
    expect(await page.evaluate(key=>window.State.get().some(x=>x.key===key),selected.key)).toBe(false);
  });
});
