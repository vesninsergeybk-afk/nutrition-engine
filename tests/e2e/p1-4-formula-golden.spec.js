const { test, expect } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = process.env.NUTRITION_APP_ROOT ? path.resolve(process.env.NUTRITION_APP_ROOT) : path.resolve(__dirname, '../..');

test.describe.configure({ mode:'serial' });

test('P1.4 formula registry is loaded before calculation modules', async ({ page, loadApp }) => {
  await loadApp();
  const state=await page.evaluate(()=>({
    version:window.NutritionFormulaRegistryP14&&window.NutritionFormulaRegistryP14.version,
    formulas:window.NutritionFormulaRegistryP14&&window.NutritionFormulaRegistryP14.data.formulas.length,
    cases:window.NutritionFormulaRegistryP14&&window.NutritionFormulaRegistryP14.golden.cases.length,
    qa:window.NutritionNeedsFormulaQA&&window.NutritionNeedsFormulaQA.version,
    core:window.NutritionCalculationCore&&window.NutritionCalculationCore.formulaRegistryVersion,
    hei:!!window.HEI
  }));
  expect(state).toEqual({version:'v5.3.210-p1.4',formulas:29,cases:113,qa:'v5.3.210-p1.4',core:'v5.3.210-p1.4',hei:true});
});

test('actual needs calculation and product scaling expose formula provenance', async ({ page, loadApp }) => {
  await loadApp();
  await page.selectOption('#needs_sex','male');await page.fill('#needs_h','175');await page.fill('#needs_w','70');await page.fill('#needs_age','40');
  await page.selectOption('#needs_state','normal');await page.selectOption('#needs_activity','moderate');await page.selectOption('#needs_edema','no');await page.selectOption('#needs_goal','maintain');await page.selectOption('#needs_guardrail','none');
  await page.click('#needs_calc_btn');
  const out=await page.evaluate(()=>{
    const meta=window.__lastNeedsMeta;
    const key=(window.State.getForNutrients()[0]||{}).key || 'apple';
    const a=window.NutritionCalculationCore.scaledPerItem({key,grams:100});
    const b=window.NutritionCalculationCore.scaledPerItem({key,grams:50});
    const report=window.NutritionReportV5.buildReportModel({force:true});
    const reportHtml=window.NutritionReportV5.buildReportHtml(report);
    return {formulaVersion:meta.formulaAudit.registryVersion,ids:meta.formulaAudit.formulaIds,protein:meta.proteinPerKg,bmr:meta.bmr,scaleKey:key,kcal100:a.kcal,kcal50:b.kcal,snapshot:window.NutritionCalculationCore.snapshot([]).formulaAudit,reportAudit:report.formulaAudit,reportHtml};
  });
  expect(out.formulaVersion).toBe('v5.3.210-p1.4');
  expect(out.ids).toContain('energy.mifflin_st_jeor');expect(out.ids).toContain('protein.ordinary_target');
  expect(out.protein).toBe(1.05);expect(out.bmr).toBe(1598.75);
  if(Number.isFinite(out.kcal100)) expect(out.kcal50).toBeCloseTo(out.kcal100/2,10);
  expect(out.snapshot.formulaIds).toEqual(['product.per100_scaling','product.salt_to_sodium','ration.nutrient_sum']);
  expect(out.reportAudit.registryVersion).toBe('v5.3.210-p1.4');
  expect(out.reportAudit.needs.formulaIds).toContain('energy.mifflin_st_jeor');
  expect(out.reportHtml).toContain('Трассировка расчётных формул');
  expect(out.reportHtml).toContain('energy.mifflin_st_jeor');
});

test('protected NASEM, HEI and compatibility diagnostic use current golden registry', async ({ page, loadApp }) => {
  await loadApp();
  await page.addScriptTag({content:fs.readFileSync(path.join(ROOT,'assets/js/14-protein-formula-tests.js'),'utf8')});
  const out=await page.evaluate(()=>{
    const p=window.ProtectedModesP03.pregnancyTee('low_active',30,165,70,24,60);
    const d={fruits_total:.8,fruits_whole:.4,vegetables_total:1.1,greens_beans:.2,grains_whole:1.5,dairy:1.3,protein_total:2.5,seafood_plant:.8,fatty_acids_ratio:2.5,grains_refined:1.8,sodium_g:1.1,added_sugars_pct:6.5,sat_fats_pct:8};
    const h=window.HEI.scoreFromDensity(d,2000,2000);
    return {pregnancy:p,hei:{total:h.total,version:h.formulaAudit.registryVersion},proteinDiagnostic:window.runP14ProteinFormulaTests()};
  });
  expect(out.pregnancy.target).toBe(2711);expect(out.pregnancy.provenance.registryVersion).toBe('v5.3.210-p1.4');
  expect(out.hei).toEqual({total:100,version:'v5.3.210-p1.4'});expect(out.proteinDiagnostic).toBe(true);
});
