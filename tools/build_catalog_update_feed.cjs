#!/usr/bin/env node
'use strict';
/**
 * Build a compact, fully offline-readable snapshot of the reviewed catalog
 * additions. Every release replaces the previous supplement in its entirety.
 * The 1105-item canonical dataset remains unchanged.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const FEED_DIR = path.join(ROOT, 'updates/catalog/v1');
const BASE_PART = 'data/products.v5.3.210-p1.3.part-';
const REVISION = '2026-10-24.1';
const NUTRIENTS = [
  'kcal', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g',
  'sugar_per_100g', 'fiber_per_100g', 'sfa', 'unsat', 'salt',
  'added_sugar', 'calcium_mg', 'iron_mg', 'magnesium_mg',
  'phosphorus_mg', 'potassium_mg', 'sodium_mg', 'zinc_mg',
  'copper_mg', 'manganese_mg', 'selenium_ug', 'vitamin_a_mcg',
  'vitamin_e_mg', 'vitamin_d_mcg', 'vitamin_c_mg', 'vitamin_b1_mg',
  'vitamin_b2_mg', 'vitamin_b3_mg', 'vitamin_b5_mg',
  'vitamin_b6_mg', 'vitamin_b9_mcg', 'vitamin_b12_mcg',
  'choline_mg', 'vitamin_k_mcg',
];
const json = obj => JSON.stringify(obj, null, 2) + '\n';
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function build() {
  const baseline = [];
  for (let part = 1; part <= 12; ++part) {
    baseline.push(...JSON.parse(read(BASE_PART + String(part).padStart(2, '0') + '.json')));
  }
  assert.equal(baseline.length, 1105, 'canonical base version changed');
  const baseKeys = new Set(baseline.map(product => product.key));
  assert.equal(baseKeys.size, baseline.length, 'duplicate canonical key');

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('assets/data/products-supplemental.v20261023.js'), sandbox);
  vm.runInContext(read('assets/data/products-perekrestok-reviewed.v20261023.js'), sandbox);
  const additions = JSON.parse(JSON.stringify(sandbox.window.__NUTRIENT_SUPPLEMENTAL_PRODUCTS__));
  const corrections = JSON.parse(JSON.stringify(sandbox.window.__NUTRIENT_PRODUCT_CORRECTIONS__));
  assert.equal(additions.length, 6, 'reviewed supplement count changed');
  assert.equal(sandbox.window.__NUTRIENT_SUPPLEMENTAL_EXPECTED_COUNT__, additions.length);
  assert.equal(corrections.length, 1, 'unexpected correction count');

  const keys = new Set();
  for (const product of additions) {
    assert.equal(typeof product.key, 'string');
    assert(!baseKeys.has(product.key), 'supplement overrides canonical key: ' + product.key);
    assert(!keys.has(product.key), 'duplicate supplement key: ' + product.key);
    keys.add(product.key);
    for (const field of NUTRIENTS) {
      const value = product[field];
      assert.equal(typeof value, 'number', product.key + ': ' + field + ' missing');
      assert(Number.isFinite(value) && value >= 0, product.key + ': invalid ' + field);
    }
    assert(product.source_id || product.source_url, product.key + ': no source');
    assert(product.nutrient_provenance_v1_3, product.key + ': no nutrient provenance');
  }
  for (const fix of corrections) {
    assert(baseKeys.has(fix.key), 'correction target missing: ' + fix.key);
    const target = baseline.find(item => item.key === fix.key);
    assert.equal(target.source_id, fix.expected_source_id, 'correction source guard mismatch');
    assert.equal(target.fdc_description, fix.expected_fdc_description, 'correction identity mismatch');
  }

  const payload = {
    schema: 'nutrient-catalog-overlay/v1',
    revision: REVISION,
    base_dataset: 'products.v5.3.210-p1.3',
    base_count: baseline.length,
    expected_merged_count: baseline.length + additions.length,
    semantics: 'REPLACE_ENTIRE_REVIEWED_OVERLAY_ATOMICALLY',
    additions, corrections,
  };
  const file = 'revisions/' + REVISION + '.json';
  const bytes = Buffer.from(json(payload), 'utf8');
  const manifest = {
    schema: 'nutrient-catalog-manifest/v1',
    current_revision: REVISION,
    base_dataset: payload.base_dataset,
    base_count: payload.base_count,
    expected_merged_count: payload.expected_merged_count,
    overlay_path: file,
    overlay_sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    overlay_bytes: bytes.length,
    updater_contract: 'fetch-manifest-then-verify-overlay-before-atomic-replace',
  };
  fs.mkdirSync(path.join(FEED_DIR, 'revisions'), { recursive: true });
  const revisionPath = path.join(FEED_DIR, file);
  if (fs.existsSync(revisionPath)) {
    // A previously released revision is immutable. A changed product list
    // must receive a NEW REVISION identifier and file, never mutate the old.
    assert(fs.readFileSync(revisionPath).equals(bytes),
      'immutable catalog revision changed; increment REVISION before generating');
  } else {
    fs.writeFileSync(revisionPath, bytes);
  }
  fs.writeFileSync(path.join(FEED_DIR, 'manifest.json'), json(manifest));
  console.log('Prepared', file, payload.expected_merged_count, manifest.overlay_sha256);
  return { payload, manifest };
}
if (require.main === module) build();
module.exports = { build, NUTRIENTS };
