const { test, expect, ORIGIN } = require('./fixtures');
async function openApp(page,suffix=''){
  const response=await page.goto(`${ORIGIN}/index.html${suffix}`,{waitUntil:'networkidle'});
  if(!response||response.status()!==200)throw new Error(`app load failed: ${response&&response.status()}`);
  await page.waitForFunction(()=>!!window.NavigationShellV1&&!!window.State&&!!window.DB,null,{timeout:30000});
}
test.describe('stage 5A stability gate',()=>{
  test('managed visibility settles without a mutation feedback loop',async({page})=>{
    await openApp(page);
    await page.evaluate(()=>{window.__mutations=0;window.__observer=new MutationObserver(list=>window.__mutations+=list.length);document.querySelectorAll('.navshell-managed').forEach(el=>window.__observer.observe(el,{attributes:true,attributeFilter:['hidden','aria-hidden']}));});
    await page.waitForTimeout(1000);
    expect(await page.evaluate(()=>window.__mutations)).toBeLessThanOrEqual(2);
  });
  test('external visibility drift is repaired once and then settles',async({page})=>{
    await openApp(page,'#ration');
    await page.evaluate(()=>{const hidden=document.getElementById('workspaceHeiPanel');hidden.hidden=false;hidden.removeAttribute('aria-hidden');const visible=document.getElementById('globalSearchSection');visible.hidden=true;visible.setAttribute('aria-hidden','true');});
    await page.waitForTimeout(150);
    expect(await page.locator('#workspaceHeiPanel').isHidden()).toBeTruthy();
    expect(await page.locator('#globalSearchSection').isVisible()).toBeTruthy();
  });
  test('unrelated query parameters survive the technical fallback roundtrip',async({page})=>{
    await openApp(page,'?campaign=alpha&utm_source=ci&ui=long#analysis/hei');
    await page.locator('[data-navshell-return-workspace]').click();
    await expect(page).toHaveURL(/\?campaign=alpha&utm_source=ci#analysis\/hei$/);
  });
});
