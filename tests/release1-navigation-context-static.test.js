const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const navPath = path.join(root, 'assets/js/91-navigation-access-hotfix-v6.0.0-beta6-hf1.js');
const indexPath = path.join(root, 'index.html');
const legacyIndexPath = path.join(root, 'index-v5.3.210.html');

const nav = fs.readFileSync(navPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const legacyIndex = fs.readFileSync(legacyIndexPath, 'utf8');

const checks = [];
function add(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail: detail || '' });
}
const token = 'release1-navigation-reversibility-2026-09-26';

add('release token present', nav.includes(token));
add('semantic context uses session storage', nav.includes('nutritionCalculator.navigationContext.v1') && nav.includes('sessionStorage'));
add('semantic return uses session storage', nav.includes('nutritionCalculator.navigationReturn.v1'));
add('history state is enriched in place', nav.includes('history.replaceState') && nav.includes('navigationSemantic'));
add('Back/Forward has explicit popstate restoration', nav.includes("addEventListener('popstate'") && nav.includes('pendingHistorySemantic'));
add('analysis context stores filters not calculated values', nav.includes('nutrientFilter') && nav.includes('nutrientGroup') && nav.includes('heiFilter') && nav.includes('heiGroup'));
add('semantic return control exists', nav.includes('data-navigation-semantic-return'));
add('new overlay layer was not introduced', !fs.existsSync(path.join(root, 'assets/js/97-release1-navigation.js')));
add('primary index cache-busts Release 1 navigation code', index.includes('91-navigation-access-hotfix-v6.0.0-beta6-hf1.js?v=' + token));
add('compat index cache-busts Release 1 navigation code', legacyIndex.includes('91-navigation-access-hotfix-v6.0.0-beta6-hf1.js?v=' + token));
add('entry documents remain byte-identical', index === legacyIndex);

const failed = checks.filter(row => !row.ok);
console.log(JSON.stringify({ ok: failed.length === 0, assertions: checks.length, checks }, null, 2));
process.exit(failed.length ? 1 : 0);
