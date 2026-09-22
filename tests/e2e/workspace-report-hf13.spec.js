const { test, expect } = require('./fixtures');

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
}

async function addProduct(page,query,grams){
  await page.evaluate(({query,grams})=>{
    const p=(window.DB.items||[]).find(x=>String(x.name_ru||x.name||'').toLowerCase().includes(query));
    if(!p)throw new Error('product not found: '+query);
    window.State.add(p.key,grams);
  },{query,grams});
}

async function prepareReport(page){
  await calculateNeeds(page);
  await addProduct(page,'сыр российский',100);
  await addProduct(page,'куриная грудка',250);
  await addProduct(page,'хлеб',250);
  await addProduct(page,'банан',180);
  await page.waitForFunction(()=>window.NutritionReportV5&&window.NutritionAnalysisWorkspaceHF7&&window.NutritionAnalysisWorkspaceHF7.getViewModel().items>=4);
  await page.evaluate(()=>window.NavigationShellV1.navigate('report'));
  await page.waitForFunction(()=>window.WorkspaceReportHF13&&window.WorkspaceReportHF13.getLastModel()&&document.querySelector('#workspaceReportPreview .workspace-report-document'));
}

test.describe('HF13 unified report',()=>{
  test('screen and print document use the same canonical report snapshot',async({page,loadApp})=>{
    await loadApp();
    await prepareReport(page);
    await expect(page.locator('#workspaceReportPanel')).toBeVisible();
    await expect(page.locator('#globalActions')).toBeHidden();
    const state=await page.evaluate(()=>{
      const unified=window.WorkspaceReportHF13.getLastModel();
      const canonical=window.NutritionReportV5.buildReportModel({force:true});
      const body=window.WorkspaceReportHF13.buildBodyHtml(unified);
      const documentHtml=window.WorkspaceReportHF13.buildDocumentHtml(unified);
      return {
        schema:unified.schemaVersion,
        options:Object.keys(unified.reportOptions||{}).length,
        kcalUnified:unified.totals.kcal,
        kcalCanonical:canonical.totals.kcal,
        bodyInDocument:documentHtml.includes(body),
        hasScript:/<script\b/i.test(documentHtml),
        hasTechnicalHeiUnits:/cup-eq|oz-eq|ounce|унц/i.test(documentHtml),
        hasQuality:!!unified.dataQuality,
        hasGuardrails:Array.isArray(unified.hei.guardrails)
      };
    });
    expect(state.schema).toBe('nutrition-workspace-report-v1');
    expect(state.options).toBe(5);
    expect(state.kcalUnified).toBe(state.kcalCanonical);
    expect(state.bodyInDocument).toBe(true);
    expect(state.hasScript).toBe(false);
    expect(state.hasTechnicalHeiUnits).toBe(false);
    expect(state.hasQuality).toBe(true);
    expect(state.hasGuardrails).toBe(true);
  });

  test('report options preserve focus and mobile tables become readable cards',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844});
    await loadApp();
    await prepareReport(page);
    await page.locator('.workspace-report-options>summary').click();
    const checkbox=page.locator('[data-report-option="detailedNutrients"]');
    await checkbox.uncheck();
    await expect(page.locator('#workspaceReportPreview')).not.toContainText('Нутриенты и ориентиры');
    expect(await page.evaluate(()=>document.activeElement&&document.activeElement.getAttribute('data-report-option'))).toBe('detailedNutrients');
    await checkbox.check();
    await expect(page.locator('#workspaceReportPreview')).toContainText('Нутриенты и ориентиры');
    const displays=await page.evaluate(()=>({
      table:getComputedStyle(document.querySelector('.workspace-report-table-wrap')).display,
      cards:getComputedStyle(document.querySelector('.workspace-report-mobile-list')).display,
      panelPadding:getComputedStyle(document.getElementById('workspaceReportPanel')).paddingBottom
    }));
    expect(displays.table).toBe('none');
    expect(displays.cards).not.toBe('none');
    expect(parseFloat(displays.panelPadding)).toBeGreaterThan(80);
  });
});
