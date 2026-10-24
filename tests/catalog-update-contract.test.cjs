#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { NUTRIENTS } = require('../tools/build_catalog_update_feed.cjs');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p));
const feedRoot = 'updates/catalog/v1/';
const manifest = JSON.parse(read(feedRoot + 'manifest.json').toString('utf8'));
assert.equal(manifest.schema, 'nutrient-catalog-manifest/v1');
assert.match(manifest.current_revision, /^\d{4}-\d{2}-\d{2}\.\d+$/);
assert.equal(manifest.base_dataset, 'products.v5.3.210-p1.3');
assert.match(manifest.overlay_path, /^revisions\/\d{4}-\d{2}-\d{2}\.\d+\.json$/);
assert(!manifest.overlay_path.includes('..'), 'traversal refused');
const bytes = read(feedRoot + manifest.overlay_path);
assert.equal(bytes.length, manifest.overlay_bytes);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), manifest.overlay_sha256);

const overlay = JSON.parse(bytes.toString('utf8'));
assert.equal(overlay.schema, 'nutrient-catalog-overlay/v1');
assert.equal(overlay.revision, manifest.current_revision);
assert.equal(overlay.base_dataset, manifest.base_dataset);
assert.equal(overlay.base_count, manifest.base_count);
assert.equal(overlay.expected_merged_count, manifest.expected_merged_count);
assert.equal(overlay.semantics, 'REPLACE_ENTIRE_REVIEWED_OVERLAY_ATOMICALLY');

let base = [];
for (let i = 1; i <= 12; ++i) {
  base.push(...JSON.parse(read('data/products.v5.3.210-p1.3.part-' + String(i).padStart(2, '0') + '.json')));
}
assert.equal(base.length, 1105);
assert.equal(base.length, manifest.base_count);
const baseKeys = new Set(base.map(p => p.key));
assert.equal(baseKeys.size, 1105);
assert.equal(overlay.additions.length + base.length, manifest.expected_merged_count);
const supplementKeys = new Set();
for (const product of overlay.additions) {
  assert(!supplementKeys.has(product.key));
  assert(!baseKeys.has(product.key));
  supplementKeys.add(product.key);
  for (const field of NUTRIENTS) {
    assert.equal(typeof product[field], 'number', product.key + '/' + field);
    assert(Number.isFinite(product[field]) && product[field] >= 0);
  }
  assert(product.nutrient_provenance_v1_3, product.key + ': provenance required');
}
for (const fix of overlay.corrections) {
  const target = base.find(p => p.key === fix.key);
  assert(target, 'unknown correction ' + fix.key);
  assert.equal(target.source_id, fix.expected_source_id);
  assert.equal(target.fdc_description, fix.expected_fdc_description);
}
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const p of ['assets/data/products-supplemental.v20261023.js',
                 'assets/data/products-perekrestok-reviewed.v20261023.js']) {
  vm.runInContext(read(p).toString('utf8'), sandbox);
}
assert.deepEqual(overlay.additions, JSON.parse(JSON.stringify(sandbox.window.__NUTRIENT_SUPPLEMENTAL_PRODUCTS__)));
assert.deepEqual(overlay.corrections, JSON.parse(JSON.stringify(sandbox.window.__NUTRIENT_PRODUCT_CORRECTIONS__)));
console.log('PASS APK catalog contract: ' + overlay.additions.length +
  ' additions; ' + overlay.corrections.length + ' guarded correction; ' +
  overlay.expected_merged_count + ' total; SHA-256 ' + manifest.overlay_sha256);
