const { test, expect } = require('./fixtures');
async function openNeeds(page){if(!(await page.locator('#needs_sex').isVisible()))await page.click('#v40NeedsToggle');}
async function calculateNeeds(page){await openNeeds(page);await page.selectOption('#needs_sex','female');await page.fill('#needs_h','168');await page.fill('#needs_w','62');await page.fill('#needs_age','34');await page.selectOption('#needs_state','normal');await page.selectOption('#needs_activity','low');await page.selectOption('#needs_goal','maintain');await page.click('#needs_calc_btn');await expect(page.locator('#normInput-kcal')).not.toHaveValue('');await page.evaluate(()=>window.NavigationShellV1.navigate('ration'));}
async function addFirst(page,q){await page.fill('#globalSearchInput',q);const b=page.locator('#globalResults button[data-role="add-search"], #globalResults button[data-role="add"]').first();await expect(b).toBeVisible();await b.click();}

test('RC2 restores the direct professional analysis workflow',async({page,loadApp})=>{
 await page.setViewportSize({width:390,height:844});await loadApp();await calculateNeeds(page);await addFirst(page,'банан');
 for(const selector of ['#pc1ProductHeader','#p15DecisionSummary','#pc1ScopePanel','#p15CoreResults','#pc2CoreTabs','#p20ValidationStatus'])await expect(page.locator(selector)).toHaveCount(0);
 await expect(page.locator('[data-pc-mode]')).toHaveCount(0);await expect(page.locator('#pc1ConfirmComplete')).toHaveCount(0);
 await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/overview'));
 await expect(page.locator('#workspaceOverviewPanel')).toBeVisible();
 await expect(page.locator('#heiPanel')).toBeHidden();
 await expect(page.locator('#totalsSection')).toBeHidden();
 await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/hei'));
 await expect(page.locator('#workspaceHeiPanel')).toBeVisible();
 await expect(page.locator('#workspaceHeiPanel .workspace-hei-row').first()).toBeVisible();
 await expect(page.locator('#heiPanel')).toBeHidden();
 await page.evaluate(()=>window.NavigationShellV1.navigate('analysis/nutrients'));
 await expect(page.locator('#workspaceNutrientsPanel')).toBeVisible();
 await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-row').first()).toBeVisible();
 await expect(page.locator('#totalsSection')).toBeHidden();
 await page.evaluate(()=>window.NavigationShellV1.setMode('long'));
 for(const selector of ['#dietAnalysisProfilePanel','#dietAnalysisMatrix','#strictHarvardPlateDetails','#dataQualityPanel'])await expect(page.locator(selector)).toBeVisible();
 await expect(page.locator('#dietAnalysisMatrix')).toHaveAttribute('aria-label',/Матрица качества и структуры/);
 await expect(page.locator('#strictHarvardPlateDetails')).not.toHaveAttribute('open','');
 await page.locator('#strictHarvardPlateDetails > summary').click();await expect(page.locator('#harvardPlatePanel')).toBeVisible();
 const note=page.locator('#rc2CurrentRationNote');await expect(note).toBeVisible();await expect(note).toContainText(/текущему составу введённого рациона/i);
 const audit=await page.evaluate(()=>window.NutritionProfessionalWorkflowRC2.audit());expect(audit.ok).toBe(true);expect(audit.version).toBe('v5.3.210-rc2');expect(audit.directResults).toBe(true);expect(audit.mode).toBe('professional');expect(audit.analysisState).toBe('complete');
 const report=await page.evaluate(()=>window.NutritionReportV5.getReportHtml({force:true}));expect(report).toContain('data-report-status="current-ration"');expect(report).toContain('HEI');expect(report).not.toContain('data-report-status="preliminary"');
});

test('RC2 keeps everyday search and simplifies protected context',async({page,loadApp})=>{
 await page.setViewportSize({width:1440,height:1000});await loadApp();await page.evaluate(()=>window.NavigationShellV1.navigate('ration'));
 for(const [q,re] of [['гречка',/греч/i],['молоко',/молок/i],['яйцо',/яйц/i],['огурец',/огур/i]]){await page.fill('#globalSearchInput',q);const first=page.locator('#globalResults .search-result-card').first();await expect(first).toBeVisible();await expect(first).toContainText(re);}
 await page.evaluate(()=>window.NavigationShellV1.navigate('profile'));await openNeeds(page);await expect(page.locator('label[for="needs_guardrail"]')).toContainText('Особое состояние');
 await page.selectOption('#needs_guardrail','pregnancy');await page.waitForTimeout(100);
 await expect(page.locator('#needsProtectedModeContext')).toBeVisible();await expect(page.locator('#rc2IntersectingFactors')).toHaveCount(1);
 await expect(page.locator('#rc2PregnancyAdvanced')).toHaveCount(1);
});
