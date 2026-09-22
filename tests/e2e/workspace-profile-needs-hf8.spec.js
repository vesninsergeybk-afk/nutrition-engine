const { test, expect } = require('./fixtures');
const AxeBuilder = require('@axe-core/playwright').default;

async function calculateIvan(page){
  await page.fill('#needs_person_name','Иван Иванов');
  await page.selectOption('#needs_sex','male');
  await page.fill('#needs_h','175');
  await page.fill('#needs_w','74');
  await page.fill('#needs_age','45');
  await page.selectOption('#needs_state','normal');
  await page.selectOption('#needs_activity','low');
  await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await page.waitForFunction(()=>window.__lastNeedsProfileApplied===true&&!!window.__lastNeedsMeta);
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
}

test.describe('HF8 profile and needs before ration',()=>{
  test('fresh mobile session starts with the person profile, not the ration',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844});
    await loadApp();
    await expect(page.locator('html')).toHaveAttribute('data-navigation-route','profile');
    await expect(page.locator('#workspaceProfilePanel')).toBeVisible();
    await expect(page.locator('#needsCompact')).toBeVisible();
    await expect(page.locator('#globalSearchSection')).toBeHidden();
    await expect(page.locator('#needs_person_name')).toHaveAttribute('placeholder','Иван Иванов');
    await expect(page.locator('label[for="needs_person_name"]')).toHaveText('Имя или ФИО (необязательно)');
    await expect(page.locator('#navigationShell')).toBeHidden();
    await expect(page.locator('[data-profile-step="profile"]')).toHaveAttribute('aria-current','step');
  });

  test('calculated profile leads to ration and remains visible as its context',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844});
    await loadApp();
    await calculateIvan(page);
    await expect(page.locator('#workspaceProfilePanel')).toHaveClass(/is-ready/);
    await expect(page.locator('[data-profile-step="ration"]')).toHaveAttribute('aria-current','step');
    await expect(page.locator('#workspaceProfileNext')).toBeVisible();
    await expect(page.locator('#workspaceProfileNext')).toContainText('Иван Иванов');
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-navigation-route','ration');
    await expect(page.locator('#globalSearchSection')).toBeVisible();
    await expect(page.locator('#needsCompact')).toBeHidden();
    await expect(page.locator('#workspacePersonContext')).toBeVisible();
    await expect(page.locator('#workspacePersonName')).toHaveText('Иван Иванов');
    await expect(page.locator('#workspacePersonTargets')).toContainText('ккал');
    await expect(page.locator('#workspacePersonTargets')).toContainText('вода');
    await expect(page.locator('#navigationShell')).toBeVisible();
  });

  test('profile can be edited from ration without losing the person identity',async({page,loadApp})=>{
    await loadApp();
    await calculateIvan(page);
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click();
    await page.locator('#workspacePersonEdit').click();
    await expect(page.locator('html')).toHaveAttribute('data-navigation-route','profile');
    await expect(page.locator('#needs_person_name')).toHaveValue('Иван Иванов');
    await expect(page.locator('#needs_w')).toHaveValue('74');
    await page.fill('#needs_w','75');
    await page.click('#needs_calc_btn');
    await page.waitForFunction(()=>window.__lastNeedsMeta&&Number(window.__lastNeedsMeta.w)===75);
    await expect(page.locator('#workspaceProfileStatusText')).toContainText('75');
  });

  test('profile route has no serious accessibility violations',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844});
    await loadApp();
    const results=await new AxeBuilder({page}).analyze();
    const serious=results.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(serious,serious.map(v=>v.id).join(', ')).toEqual([]);
  });
});
