const { test, expect } = require('./fixtures');

async function calculateNeeds(page){
  if(!(await page.locator('#needs_sex').isVisible()))await page.click('#v40NeedsToggle');
  await page.selectOption('#needs_sex','female');
  await page.fill('#needs_h','168');
  await page.fill('#needs_w','62');
  await page.fill('#needs_age','34');
  await page.selectOption('#needs_state','normal');
  await page.selectOption('#needs_activity','low');
  await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await expect(page.locator('#normInput-kcal')).not.toHaveValue('');
}
async function addKiev(page){
  await page.fill('#globalSearchInput','котлета по-киевски');
  const card=page.locator('#globalResults .search-result-card').first();
  await expect(card).toBeVisible();
  await card.locator('button[data-role="add-search"],button[data-role="add"]').first().click();
  await page.waitForFunction(()=>window.__lastHEIModel&&window.__lastDietAssessment&&window.__lastDietAnalysisProfile);
}
async function overflowInfo(page){
  return page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const offenders=[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,100),left:r.left,right:r.right,width:r.width};}).filter(x=>x.width>0&&(x.right>width+1||x.left<-1)).slice(0,20);
    return {doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,client:width,offenders};
  });
}

test('HEI HF3 stays compact and exposes only relevant warnings',async({page,loadApp})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width:1440,height:1000});
  await loadApp();await calculateNeeds(page);
  await page.evaluate(()=>window.NavigationShellV1&&window.NavigationShellV1.navigate('ration'));
  await addKiev(page);
  const desktop=await page.evaluate(()=>{
    const a=document.getElementById('heiAssessment'),details=a&&a.querySelector('details');
    return {height:a&&a.getBoundingClientRect().height,items:a&&a.querySelectorAll('.hei-assessment__item').length,text:a&&a.innerText,detailsOpen:details&&details.open,total:window.__lastHEIModel.total,sfaPoints:window.__lastHEIModel.points.sat_fats_pct,coreVersion:window.HEI2020CoreV2&&window.HEI2020CoreV2.version,assessment:window.__lastDietAssessment,profile:window.__lastDietAnalysisProfile};
  });
  expect(errors).toEqual([]);
  expect(desktop.coreVersion).toContain('hf3');
  expect(desktop.total).toBeGreaterThan(30);expect(desktop.total).toBeLessThan(45);
  expect(desktop.sfaPoints).toBe(0);
  expect(desktop.items).toBeLessThanOrEqual(2);
  expect(desktop.height).toBeLessThan(250);
  expect(desktop.detailsOpen).toBe(false);
  expect(desktop.text).toContain('Насыщённые жиры');
  expect(desktop.text).not.toContain('Витамин C');
  expect(desktop.text).not.toContain('Йод');
  expect(desktop.text).not.toContain('Высокий общий HEI');
  expect(desktop.text).toContain('независимо от общего балла HEI');
  expect(desktop.assessment.summary.flagCount).toBe(1);
  expect(desktop.profile.dietAssessment.summary.flagCount).toBe(1);
  let overflow=await overflowInfo(page);
  expect(overflow.offenders,JSON.stringify(overflow,null,2)).toEqual([]);
  expect(overflow.doc).toBeLessThanOrEqual(overflow.client+1);

  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);
  const mobile=await page.evaluate(()=>{const a=document.getElementById('heiAssessment');return {height:a&&a.getBoundingClientRect().height,items:a&&a.querySelectorAll('.hei-assessment__item').length,detailsOpen:a&&a.querySelector('details')&&a.querySelector('details').open};});
  expect(mobile.items).toBeLessThanOrEqual(2);
  expect(mobile.height).toBeLessThan(360);
  expect(mobile.detailsOpen).toBe(false);
  overflow=await overflowInfo(page);
  expect(overflow.doc,JSON.stringify(overflow,null,2)).toBeLessThanOrEqual(overflow.client+1);
  expect(overflow.body).toBeLessThanOrEqual(overflow.client+1);
});
