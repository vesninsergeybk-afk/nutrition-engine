const {chromium} = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const start=Date.now();const stage=s=>console.log(Math.round((Date.now()-start)/1000)+'s '+s);
  const click = s => page.locator(s).first().evaluate(el=>el.click());
  const ds = key => page.locator('#viewer').getAttribute('data-'+key);
  const search = async (q,expected) => {
   await page.fill('#structure-search',q);
   await click('.search-result');
   assert.match(await page.locator('#mobile-muscle-name').textContent(),expected);
  };
  const layer = async key => {
   stage('loading '+key);
   await click('[data-context-layer="'+key+'"]');
   await page.waitForFunction(key => document.getElementById('viewer').dataset.referenceLayers.includes(key),key,{timeout:45000});
  };
  await page.goto('http://127.0.0.1:4173/?mode=explore&scope=all',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.getElementById('atlas-bones-toggle').disabled,null,{timeout:90000});
  await click('#atlas-bones-toggle');stage('skeleton ready');
  await layer('organs');
  await search('большой сальник',/Большой сальник/);
  await click('#mobile-focus-structure');
  // Drop the search selection without moving the camera, then tap actual geometry.
  await click('#atlas-bones-toggle');await click('#atlas-bones-toggle');
  await page.evaluate(()=>scrollTo(0,0));
  const box=await page.locator('#viewer').boundingBox();
  for(const [dx,dy] of [[0,0],[-15,0],[15,0],[0,-25],[0,25]]) {
   await page.touchscreen.tap(box.x+box.width/2+dx,box.y+box.height/2+dy);
   if(await ds('selected-reference-layer')==='organs') break;
  }
  assert.equal(await ds('selected-reference-layer'),'organs','Real mobile tap did not select organ geometry');
  assert.match(await page.locator('#mobile-muscle-name').textContent(),/Большой сальник/);
  const part = await ds('selected-reference-part');
  await click('#mobile-hide-muscle');
  assert.equal(await ds('selected-reference-layer'),'');
  const hidden = Number(await ds('hidden-reference-parts'));assert.ok(hidden>0);
  await page.fill('#structure-search','большой сальник');
  assert.equal(await page.locator('.search-result').count(),0,'Hidden object still participates in search/picking');
  await click('[data-context-layer="organs"]');await layer('organs');
  assert.equal(Number(await ds('hidden-reference-parts')),hidden,'System toggle resurrected a hidden surface');
  await click('#atlas-context-undo');
  assert.equal(await ds('selected-reference-part'),part);assert.equal(await ds('hidden-reference-parts'),'0');
  await click('#mobile-hide-muscle');
  await search('тощая кишка',/Тощая кишка/);
  assert.equal(Number(await ds('hidden-reference-parts')),hidden);
  await click('#atlas-context-muscles');
  assert.ok(await page.locator('#muscle-transparency-field').isVisible());
  assert.ok(Math.abs(Number(await ds('muscle-opacity'))-.06)<.001);
  await page.locator('#muscle-transparency').fill('97');
  assert.ok(Math.abs(Number(await ds('muscle-opacity'))-.03)<.001);
  assert.equal(await page.locator('#muscle-transparency-value').textContent(),'97%');
  stage('organ tap, hide/undo, cache, opacity passed');
  await click('#atlas-context-restore');assert.equal(await ds('hidden-reference-parts'),'0');
  await click('#atlas-context-muscles');await click('[data-context-layer="organs"]');
  for(const [key,q,label] of [
   ['nervous','конский хвост',/Конский хвост/],
   ['joints','капсула грудино-ключичного',/Капсула грудино-ключичного сустава/],
   ['vascular','глубокая вена бедра',/Глубокая вена бедра/],
   ['lymphatic','селезёнка',/Селезёнка/],
  ]) {
   await layer(key);await search(q,label);
   assert.equal(await ds('selected-reference-layer'),key);
   if(key==='nervous') {
    await search('передний корешок спинномозгового',/Передний корешок спинномозгового нерва/);
    await click('#mobile-hide-muscle');assert.ok(Number(await ds('hidden-reference-parts'))>0);
    await click('#atlas-context-undo');assert.equal(await ds('hidden-reference-parts'),'0');
   }
   if(key==='joints') {
    await click('#mobile-focus-structure');
    await page.setViewportSize({width:1440,height:960});
    await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.locator('#hide-selected').isEnabled(),true);
    await page.setViewportSize({width:320,height:720});
    assert.ok(await page.locator('#atlas-context-layers').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }
   stage(key+' selection passed');
   await click('[data-context-layer="'+key+'"]');
   assert.equal(await ds('selected-reference-layer'),'');
  }
  await click('#atlas-bones-toggle');
  assert.equal(await ds('atlas-view'),'muscles');
  assert.equal(await ds('muscle-mode'),'anatomical');
  assert.equal(await ds('reference-layers'),'');
  assert.deepEqual(errors,[]);
  console.log('PASS: real organ tap, hidden surface, undo/restore, layer cache, opacity, roots/cauda, all five systems, desktop/mobile layout and mode return.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
