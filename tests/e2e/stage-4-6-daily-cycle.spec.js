const { test, expect } = require('./fixtures');
const contract = require('../../quality/stage-4-6-daily-cycle-contract.json');

async function calculateNeeds(page){
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
  await page.evaluate(()=>window.NavigationShellV1.navigate('ration','globalSearchSection'));
}

async function addFromSearch(page,query,grams){
  await page.fill('#globalSearchInput',query);
  const card=page.locator('#globalResults .search-result-card').first();
  await expect(card).toBeVisible();
  const amount=card.locator('[data-role="grams"]');
  if(await amount.count())await amount.fill(String(grams));
  const before=await page.evaluate(()=>({route:window.NavigationShellV1.getState().route,count:window.State.get().length}));
  const add=card.locator('button[data-role="add-search"],button[data-role="add"]').first();
  await add.click();
  await page.waitForFunction(count=>window.State.get().length===count+1,before.count);
  await page.waitForTimeout(520);
  const after=await page.evaluate(()=>{
    const input=document.getElementById('globalSearchInput');
    const box=input.getBoundingClientRect();
    const nav=document.getElementById('navigationShell');
    const navBox=nav&&nav.getBoundingClientRect();
    return {
      route:window.NavigationShellV1.getState().route,
      count:window.State.get().length,
      query:input.value,
      focused:document.activeElement===input,
      inputTop:box.top,
      inputBottom:box.bottom,
      viewport:window.innerHeight,
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      covered:!!(navBox&&getComputedStyle(nav).position==='fixed'&&box.bottom>navBox.top)
    };
  });
  return {before,after};
}

test.describe('stage 4.6 daily working cycle',()=>{
  test('five sequential additions stay in search until the user explicitly opens the ration',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844});
    await loadApp();
    await calculateNeeds(page);
    for(const [query,grams] of [['сыр российский',100],['масло сливочное',40],['хлеб',180],['банан',160],['куриная грудка',220]]){
      const {before,after}=await addFromSearch(page,query,grams);
      expect(after.route).toBe(before.route);
      expect(after.route).toBe('ration');
      expect(after.count).toBe(before.count+1);
      expect(after.query).toBe(query);
      expect(after.focused).toBeTruthy();
      expect(after.inputTop).toBeGreaterThanOrEqual(80);
      expect(after.inputBottom).toBeLessThan(after.viewport-80);
      expect(after.covered).toBeFalsy();
      expect(after.scrollWidth).toBeLessThanOrEqual(after.innerWidth);
      const action=page.locator('#searchAddedToast [data-search-open-ration]');
      await expect(action).toBeVisible();
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(contract.scope.mobile_target_minimum_px);
    }
    const queryBefore=await page.inputValue('#globalSearchInput');
    await page.locator('#searchAddedToast [data-search-open-ration]').click();
    await expect(page.locator('#rationSection')).toBeVisible();
    await expect(page.locator('#searchAddedToast')).not.toHaveClass(/show/);
    expect(await page.inputValue('#globalSearchInput')).toBe(queryBefore);
  });

  test('target viewports preserve the search context without horizontal overflow',async({page,loadApp})=>{
    await loadApp();
    await calculateNeeds(page);
    let index=0;
    for(const [width,height] of contract.viewport_matrix){
      await page.setViewportSize({width,height});
      const result=await addFromSearch(page,['сыр российский','банан','хлеб'][index++%3],100+index);
      expect(result.after.route).toBe('ration');
      expect(result.after.focused).toBeTruthy();
      expect(result.after.covered).toBeFalsy();
      expect(result.after.scrollWidth).toBeLessThanOrEqual(result.after.innerWidth);
    }
  });
});
