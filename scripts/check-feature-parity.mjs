import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = 'contracts/feature-parity.json';
const ledger = JSON.parse(await readFile(resolve(root, ledgerPath), 'utf8'));
const required = ['web', 'windows', 'macos', 'ios'];
assert.deepEqual(ledger.platforms, required);
const ids = new Set(), pending = [];
for (const feature of ledger.features) {
  assert.ok(feature.id && !ids.has(feature.id), 'Feature IDs must be unique'); ids.add(feature.id);
  assert.ok(Number.isInteger(feature.revision) && feature.revision > 0);
  assert.ok(feature.acceptance?.length && feature.paths?.length, 'Feature needs acceptance criteria and paths');
  assert.deepEqual(Object.keys(feature.platforms).sort(), [...required].sort());
  for (const platform of required) {
    const row = feature.platforms[platform];
    assert.ok(row.owner && row.evidence, `${feature.id}/${platform}: owner and evidence/reason required`);
    assert.ok(['pending', 'acknowledged', 'implementing', 'implemented', 'verified', 'not_applicable'].includes(row.state));
    if (['implemented', 'verified'].includes(row.state)) {
      assert.equal(row.appliedRevision, feature.revision, `${feature.id}/${platform}: stale feature revision`);
      assert.ok(row.source && row.build, 'Implementation source and platform build required');
    }
    if (row.state === 'not_applicable') assert.ok(row.reason, 'Platform exclusion requires a reason');
    if (!['verified', 'not_applicable'].includes(row.state)) pending.push(`${feature.id}/${platform}: ${row.state} (${row.owner})`);
  }
}
const base = process.env.SELAH_PARITY_BASE;
if (base && !/^0+$/.test(base)) {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const changed = git(['diff', '--name-only', base, 'HEAD']).split('\n');
  const product = changed.filter(path => /^(?:index\.html|home\.html|privacy\.html|manifest\.webmanifest|bible-translations\.json|matthew-.*\.json|assets\/|styles\/|scripts\/.*\.(?:js|css)$|mobile\/(?:www\/|ios\/)|windows\/.*\.(?:js|vbs|cmd|ps1)$|analytics-worker\/src\/|contracts\/selah-)/.test(path));
  if (product.length) {
    assert.ok(changed.includes(ledgerPath), 'Product changed without feature-parity ledger update');
    let previous;
    try { previous = JSON.parse(git(['show', `${base}:${ledgerPath}`])); } catch { previous = { features: [] }; }
    const touched = ledger.features.filter(feature => {
      const old = previous.features.find(item => item.id === feature.id);
      return !old || JSON.stringify(old) !== JSON.stringify(feature);
    });
    for (const path of product) assert.ok(touched.some(feature => feature.paths.some(pattern => pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern)), `No updated feature covers ${path}`);
    for (const feature of touched) {
      const old = previous.features.find(item => item.id === feature.id);
      if (old && product.some(path => feature.paths.some(pattern => pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern))) {
        assert.ok(feature.revision > old.revision, `${feature.id}: increment revision and reassess every platform`);
      }
    }
  }
}
console.log('Feature coordination ledger valid. Pending platform work:\n' + (pending.join('\n') || 'none'));
if (process.argv.includes('--release')) assert.equal(pending.length, 0, 'Unified release cannot close while platform work or runtime evidence is pending');
