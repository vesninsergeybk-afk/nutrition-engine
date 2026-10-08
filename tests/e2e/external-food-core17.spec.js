'use strict';
const { test, expect } = require('./fixtures');

const FIELDS = [
  'kcal','protein_per_100g','fat_per_100g','carbs_per_100g','sugar_per_100g','fiber_per_100g',
  'sfa','unsat','added_sugar','salt','calcium_mg','iron_mg','magnesium_mg','phosphorus_mg',
  'potassium_mg','sodium_mg','zinc_mg','copper_mg','manganese_mg','selenium_ug','vitamin_a_mcg',
  'vitamin_e_mg','vitamin_d_mcg','vitamin_c_mg','vitamin_b1_mg','vitamin_b2_mg',
  'vitamin_b3_mg','vitamin_b5_mg','vitamin_b6_mg','vitamin_b9_mcg','vitamin_b12_mcg',
  'choline_mg','vitamin_k_mcg'
];
const HEI = [
  'fruit_cup_eq_per_100g','whole_fruit_cup_eq_per_100g','veg_cup_eq_per_100g',
  'greens_beans_cup_eq_per_100g','dairy_cup_eq_per_100g',
  'whole_grain_oz_eq_per_100g','refined_grain_oz_eq_per_100g',
  'protein_oz_eq_per_100g','seafood_plant_oz_eq_per_100g',
  'added_sugars_tsp_eq_per_100g'
];

async function searchProduct(page, term) {
  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('#globalSearchInput')).toBeVisible();
  await page.locator('#globalSearchInput').fill(term);
  await page.waitForFunction(() => {
    const root = document.getElementById('globalResults');
    return root && root.classList.contains('has-query') && root.getBoundingClientRect().height > 0;
  });
  await expect(page.locator('#globalResults')).toContainText(new RegExp(term, 'i'), { timeout: 10000 });
}

test('CORE17: all source-backed foods load with provenance, search and calculate in real desktop UI', async ({page, loadApp}) => {
  await page.setViewportSize({width:1440,height:900});
  await loadApp();
  const state=await page.evaluate(({fields,hei}) => {
    const catalog=window.__PRODUCTS_ARRAY__ || [];
    const added=catalog.filter(x => /^ext_/.test(x.key));
    const q=window.ProductDataQualityV13;
    return {
      boot:window.__APP_BOOTSTRAP_META__?.status,
      total:catalog.length, added:added.length,
      manifest:window.__NUTRITION_RUNTIME_MANIFEST__?.fastStart?.productCount,
      invalid:added.flatMap(x => {
        const bad = [];
        for(const field of fields.concat(hei)){
          if(typeof x[field] !== 'number' || !Number.isFinite(x[field]))bad.push(field);
        }
        if(x.data_quality_v1_3?.review_status !== 'REVIEW_REQUIRED')bad.push('status');
        if(x.nutrient_provenance_v1_3?.ASSUMED_ZERO?.join(',') !== 'added_sugar')bad.push('assumed_zero');
        if(!q || q.methodFor(x,'added_sugar') !== 'ASSUMED_ZERO')bad.push('quality_engine_zero');
        if(!q || !['SOURCE_REPORTED','SOURCE_REPORTED_ZERO','CALCULATED','ASSUMED_ZERO'].includes(q.methodFor(x,'protein_per_100g')))bad.push('quality_engine_protein');
        return bad.map(field => x.key+':'+field);
      }),
      cheese:added.find(x=>x.key==='ext_cheese_camembert')?.name_ru,
      carp:added.find(x=>x.key==='ext_carp')?.name_ru
    };
  },{fields:FIELDS,hei:HEI});
  expect(state).toMatchObject({boot:'ready',total:1122,added:17,manifest:1122,invalid:[]});
  expect(state.cheese).toContain('камамбер');
  expect(state.carp).toContain('Карп');
  await searchProduct(page,'камамбер');
  const add=page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration','filled',{timeout:15000});
  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/nutrients'));
  await expect(page.locator('#workspaceNutrientsPanel .workspace-analysis-summary')).toBeVisible();
  await page.evaluate(() => window.NavigationShellV1.navigate('analysis/hei'));
  await expect(page.locator('#workspaceHeiTotal')).not.toHaveText('—',{timeout:12000});
});

test('CORE17: mobile search recognises fish, retains ration after reload', async ({page,loadApp}) => {
  await page.setViewportSize({width:390,height:844});
  await loadApp();
  await searchProduct(page,'щука');
  const add=page.locator('#globalResults button[data-role="add-search"]:not([disabled]), #globalResults button[data-role="add"]:not([disabled])').first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('html')).toHaveAttribute('data-ivory-ration','filled',{timeout:15000});
  await expect(page.locator('body')).toContainText('Щука');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.__APP_BOOTSTRAP_META__?.status==='ready',{timeout:45000});
  await page.evaluate(() => window.NavigationShellV1.navigate('ration'));
  await expect(page.locator('body')).toContainText('Щука',{timeout:15000});
});
