const { test, expect } = require('./fixtures');
const contract = require('../../quality/stage-4-5-architecture-contract.json');

async function calculateNeeds(page,weight='74'){
  await page.fill('#needs_person_name','Иван Иванов');
  await page.selectOption('#needs_sex','male');
  await page.fill('#needs_h','175');
  await page.fill('#needs_w',weight);
  await page.fill('#needs_age','45');
  await page.selectOption('#needs_state','normal');
  await page.selectOption('#needs_activity','low');
  await page.selectOption('#needs_goal','maintain');
  await page.click('#needs_calc_btn');
  await page.waitForFunction(expected=>window.__lastNeedsProfileApplied===true&&window.__lastNeedsMeta&&String(window.__lastNeedsMeta.w)===String(expected),weight);
}

async function addProduct(page,query,grams){
  await page.evaluate(({query,grams})=>{
    const product=(window.DB.items||[]).find(item=>String(item.name_ru||item.name||'').toLowerCase().includes(query));
    if(!product)throw new Error('product not found: '+query);
    window.State.add(product.key,grams);
  },{query,grams});
}

async function expectRoute(page,route){
  const row=contract.routes.find(item=>item.route===route);
  await expect(page.locator('html')).toHaveAttribute('data-navigation-route',route);
  for(const id of row.owns)await expect(page.locator('#'+id)).toBeVisible();
  for(const id of row.forbids){
    const node=page.locator('#'+id);
    if(await node.count())await expect(node).toBeHidden();
  }
}

async function prepareRation(page){
  await addProduct(page,'сыр российский',100);
  await addProduct(page,'куриная грудка',250);
  await addProduct(page,'хлеб',250);
  await addProduct(page,'банан',180);
  await page.waitForFunction(()=>window.NutritionAnalysisWorkspaceHF7&&window.NutritionAnalysisWorkspaceHF7.getViewModel().items>=4);
}

test.describe('stage 4.5 architecture acceptance',()=>{
  test('full journey preserves ration and refreshes analysis and report after profile recalculation',async({page,loadApp})=>{
    await page.setViewportSize({width:390,height:844});
    await loadApp();
    await expectRoute(page,'profile');
    await calculateNeeds(page);
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click();
    await expectRoute(page,'ration');
    await prepareRation(page);
    const rationBefore=await page.evaluate(()=>JSON.stringify(window.State.get()));

    await page.locator('[data-navshell-route="analysis/overview"]').click();
    await expectRoute(page,'analysis/overview');
    await page.locator('[data-navshell-analysis-view="analysis/nutrients"]').click();
    await expectRoute(page,'analysis/nutrients');
    await page.locator('[data-navshell-analysis-view="analysis/hei"]').click();
    await expectRoute(page,'analysis/hei');
    await page.locator('[data-navshell-route="correction"]').click();
    await expectRoute(page,'correction');
    await page.locator('[data-navshell-route="report"]').click();
    await expectRoute(page,'report');
    await page.waitForFunction(()=>window.WorkspaceReportHF13&&window.WorkspaceReportHF13.getLastModel());
    await expect(page.locator('#globalActions')).toBeHidden();

    await page.goBack();
    await expectRoute(page,'correction');
    await page.goForward();
    await expectRoute(page,'report');
    await page.locator('#workspacePersonEdit').click();
    await expectRoute(page,'profile');
    await expect(page.locator('#needs_person_name')).toHaveValue('Иван Иванов');
    await calculateNeeds(page,'75');
    expect(await page.evaluate(()=>JSON.stringify(window.State.get()))).toBe(rationBefore);

    await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/overview'));
    await expectRoute(page,'analysis/overview');
    await page.evaluate(()=>window.NavigationShellV1.navigate('report'));
    await expectRoute(page,'report');
    await page.waitForFunction(()=>window.WorkspaceReportHF13.getLastModel().profile&&parseFloat(window.WorkspaceReportHF13.getLastModel().profile.weight)===75);
    const parity=await page.evaluate(()=>{
      const unified=window.WorkspaceReportHF13.getLastModel();
      const canonical=window.NutritionReportV5.buildReportModel({force:true});
      return {weight:unified.profile.weight,kcal:unified.totals.kcal,canonicalKcal:canonical.totals.kcal,ration:JSON.stringify(window.State.get())};
    });
    expect(parseFloat(parity.weight)).toBe(75);
    expect(parity.kcal).toBe(parity.canonicalKcal);
    expect(parity.ration).toBe(rationBefore);
  });

  test('all target viewports keep the shell and header inside the screen',async({page,loadApp})=>{
    await loadApp();
    await calculateNeeds(page);
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click();
    for(const viewport of contract.viewports){
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      for(const route of ['ration','analysis/overview','correction','report']){
        await page.evaluate(value=>window.NavigationShellV1.navigate(value),route);
        await expectRoute(page,route);
        const metrics=await page.evaluate(()=>{
          const rect=node=>{if(!node)return null;const box=node.getBoundingClientRect();return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height,display:getComputedStyle(node).display,position:getComputedStyle(node).position};};
          return {innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,header:rect(document.querySelector('#mainContent>header')),switcher:rect(document.getElementById('navigationShellModeSwitcher')),nav:rect(document.getElementById('navigationShell')),context:rect(document.getElementById('navigationShellContext'))};
        });
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        for(const box of [metrics.header,metrics.switcher,metrics.nav,metrics.context]){
          expect(box.left).toBeGreaterThanOrEqual(-0.5);
          expect(box.right).toBeLessThanOrEqual(metrics.innerWidth+0.5);
        }
        expect(metrics.nav.position).toBe(viewport.width<=860?'fixed':'sticky');
      }
    }
  });

  test('print view hides controls, repeats table headers and produces an A4 PDF in Chromium',async({page,loadApp,browserName})=>{
    await loadApp();
    await calculateNeeds(page);
    await page.locator('#workspaceProfileNext [data-workspace-route="ration"]').click();
    await prepareRation(page);
    await page.evaluate(()=>window.NavigationShellV1.navigate('report'));
    await page.waitForFunction(()=>window.WorkspaceReportHF13&&window.WorkspaceReportHF13.getLastModel());
    await page.emulateMedia({media:'print'});
    const printState=await page.evaluate(()=>({
      nav:getComputedStyle(document.getElementById('navigationShell')).display,
      context:getComputedStyle(document.getElementById('navigationShellContext')).display,
      switcher:getComputedStyle(document.getElementById('navigationShellModeSwitcher')).display,
      toolbar:getComputedStyle(document.querySelector('.workspace-report-toolbar')).display,
      options:getComputedStyle(document.querySelector('.workspace-report-options')).display,
      report:getComputedStyle(document.querySelector('.workspace-report-document')).display,
      tableLayout:getComputedStyle(document.querySelector('.workspace-report-table')).tableLayout,
      thead:getComputedStyle(document.querySelector('.workspace-report-table thead')).display
    }));
    expect(printState.nav).toBe('none');
    expect(printState.context).toBe('none');
    expect(printState.switcher).toBe('none');
    expect(printState.toolbar).toBe('none');
    expect(printState.options).toBe('none');
    expect(printState.report).not.toBe('none');
    expect(printState.tableLayout).toBe('fixed');
    expect(printState.thead).toBe('table-header-group');
    if(browserName==='chromium'){
      const pdf=await page.pdf({format:'A4',printBackground:true});
      expect(pdf.length).toBeGreaterThan(10000);
    }
  });
});
