/* Exercise the actual production installProducts function with the canonical DB.
 * No browser, network or secrets required. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
let baseline = [];
for (let part = 1; part <= 12; part++) {
  baseline.push(...JSON.parse(read(`data/products.v5.3.210-p1.3.part-${String(part).padStart(2, '0')}.json`)));
}
assert.equal(baseline.length, 1105);

for (const filename of ['assets/js/00-runtime-bootstrap-v6.0.0-beta6.js',
                        'assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta6.legacy.js']) {
  const window = { dispatchEvent() {} };
  const dbElement = { textContent: '[]' };
  const context = { window, console, Date,
    CustomEvent: function CustomEvent() {},
    document: { getElementById(id) { return id === 'db' ? dbElement : null; } },
    VERSION: 'v6.0.0-beta6', loadedDataUrl: 'unit-test:canonical',
    dataBytes: 0, PRODUCT_CHUNK_URLS: [], PRODUCT_SCRIPT_CHUNK_URLS: [], DATA_URLS: [] };
  vm.createContext(context);
  vm.runInContext(read('assets/data/products-supplemental.v20261023.js'), context);
  vm.runInContext(read('assets/data/products-perekrestok-reviewed.v20261023.js'), context);
  const source = read(filename);
  const begin = source.indexOf('  function installProducts(result){');
  const end = source.indexOf('  function productLoadFatal(', begin);
  assert(begin >= 0 && end > begin, `${filename}: cannot isolate installer`);
  vm.runInContext(source.slice(begin, end) + '\nwindow.__testInstallProducts=installProducts;', context);
  const db = baseline.map(item => ({ ...item }));
  const installed = context.window.__testInstallProducts({ products: db, payload: {} });
  assert.equal(installed.length, 1111, `${filename}: wrong total`);
  assert.equal(new Set(installed.map(x => x.key)).size, 1111, 'duplicate keys');
  assert.equal(window.__PRODUCTS_META__.products_count, 1111);
  assert.equal(window.__PRODUCTS_SUPPLEMENTAL_META__.count, 6);
  assert.equal(window.__PRODUCTS_SUPPLEMENTAL_META__.expected, 6);
  assert.equal(window.__PRODUCTS_CORRECTIONS_META__.count, 1);
  assert.equal(window.__PRODUCTS_CORRECTIONS_META__.warnings.length, 0);
  assert.equal(installed.find(x => x.key === 'cherry').name_ru, 'Черешня, свежая (сырая)');
  assert.equal(installed.find(x => x.key === 'cherry').state, 'raw');
  for (const key of ['tvorog_prostokvashino_2pct_200g', 'sour_cherry_raw_sr_173954',
    'artichoke_raw_sr_169205', 'mung_beans_dry_sr_174256',
    'sea_bass_raw_sr_175142', 'pork_tenderloin_raw_sr_168312']) {
    const product = installed.find(item => item.key === key);
    assert(product, `${filename}: product ${key} not installed`);
    assert.equal(product.data_quality_v1_3.missing_count, 0);
  }
  console.log(`PASS actual installer: ${filename} -> ${installed.length} products`);
}
