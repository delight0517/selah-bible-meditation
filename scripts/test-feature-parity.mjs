import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = await mkdtemp(resolve(tmpdir(), 'selah-feature-parity-'));
const git = (...args) => execFileSync('git', args, { cwd: fixture, encoding: 'utf8' }).trim();
const run = (base, ...args) => spawnSync(process.execPath, ['scripts/check-feature-parity.mjs', ...args], { cwd: fixture, encoding: 'utf8', env: { ...process.env, SELAH_PARITY_BASE: base } });
try {
  await mkdir(resolve(fixture, 'scripts')); await mkdir(resolve(fixture, 'contracts'));
  await copyFile(resolve(root, 'scripts/check-feature-parity.mjs'), resolve(fixture, 'scripts/check-feature-parity.mjs'));
  const ledger = JSON.parse(await readFile(resolve(root, 'contracts/feature-parity.json'), 'utf8'));
  for (const feature of ledger.features) for (const row of Object.values(feature.platforms)) {
    Object.assign(row, { state: 'verified', appliedRevision: feature.revision, source: 'fixture', build: 'fixture', evidence: 'fixture runtime proof' });
  }
  const save = () => writeFile(resolve(fixture, 'contracts/feature-parity.json'), JSON.stringify(ledger));
  await save(); await writeFile(resolve(fixture, 'index.html'), 'old');
  git('init'); git('config', 'user.name', 'Parity test'); git('config', 'user.email', 'test@example.invalid');
  git('add', '.'); git('commit', '-m', 'base'); const base = git('rev-parse', 'HEAD');
  assert.equal(run('', '--release').status, 0);
  await writeFile(resolve(fixture, 'index.html'), 'changed');
  git('add', '.'); git('commit', '-m', 'untracked behavior change');
  assert.notEqual(run(base).status, 0, 'Behavior change without ledger update must fail');
  ledger.features[0].revision++;
  await save(); git('add', '.'); git('commit', '-m', 'stale platform evidence');
  assert.notEqual(run(base).status, 0, 'Old revision evidence must fail');
  for (const row of Object.values(ledger.features[0].platforms)) row.state = 'pending';
  await save(); git('add', '.'); git('commit', '-m', 'record pending targets');
  assert.equal(run(base).status, 0, 'Partial rollout with explicit pending targets is valid');
  assert.notEqual(run(base, '--release').status, 0, 'Partial rollout cannot be called unified completion');
  console.log('Feature parity checks passed: missing ledger, stale revision, partial rollout, unified release gate.');
} finally { await rm(fixture, { recursive: true, force: true }); }
