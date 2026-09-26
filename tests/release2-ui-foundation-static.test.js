const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/css/ui-foundation-v1.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const compat = fs.readFileSync(path.join(root, 'index-v5.3.210.html'), 'utf8');

const checks = [];
function add(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail: detail || '' });
}

const requiredTokens = [
  '--ui-font-body','--ui-type-body','--ui-space-4','--ui-control-min',
  '--ui-radius-control','--ui-radius-surface','--ui-surface','--ui-text',
  '--ui-muted','--ui-border','--ui-accent','--ui-danger'
];
add('foundation marker is enabled', index.includes('data-ui-foundation="1"'));
add('compat entry has foundation marker', compat.includes('data-ui-foundation="1"'));
add('entry documents remain byte-identical', index === compat);
add('foundation stylesheet is loaded', index.includes('assets/css/ui-foundation-v1.css?v=release2-ui-foundation-2026-09-27'));
add('foundation loads after visual grammar', index.indexOf('visual-grammar-v6.0.0-beta9.css') < index.indexOf('ui-foundation-v1.css'));
add('canonical token set exists', requiredTokens.every(token => css.includes(token)), requiredTokens.filter(token => !css.includes(token)).join(', '));
add('all three theme voices are represented', css.includes('html[data-theme="retro-2bit"]') && css.includes('html[data-theme="ivory-brass"]') && css.includes('--ui-bg:#f5f7fa'));
add('HF4 compatibility bridge exists', css.includes('--hf4-body-font:var(--ui-font-body)') && css.includes('--hf4-accent:var(--ui-accent)'));
add('visual grammar compatibility bridge exists', css.includes('--vg-bg:var(--ui-bg)') && css.includes('--d111-bg:var(--ui-bg)'));
add('semantic button roles exist', css.includes('button.secondary') && css.includes('button.ghost') && css.includes('button.danger'));
add('field primitive excludes intrinsic compact inputs', css.includes(':not([type="checkbox"])') && css.includes(':not([type="radio"])'));
add('foundation does not hide application content', !/display\s*:\s*none/i.test(css));
add('foundation does not encode route visibility', !css.includes('[data-navigation-route=') && !css.includes('[data-navigation-route="'));
add('foundation contains no calculation script', !/\b(State|DB|HEI2020|calculateNeeds|nutritionCalc)\b/.test(css));

const failed = checks.filter(row => !row.ok);
console.log(JSON.stringify({ ok: failed.length === 0, assertions: checks.length, checks }, null, 2));
process.exit(failed.length ? 1 : 0);
